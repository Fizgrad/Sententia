import Dexie, { type Table } from 'dexie';
import { sentenceMap, topics, wordMap } from './corpus';
import type { AppData, ArchiveEntry, MemoryRecord, Preferences, StoredCard, StudyLog, Topic } from './types';

interface StoredSnapshot { key: 'main'; revision: number; value: AppData }
export interface RecoverySnapshot { id: string; revision: number; createdAt: string; value: AppData }
class SententiaDB extends Dexie {
  snapshots!: Table<StoredSnapshot, string>;
  recovery!: Table<RecoverySnapshot, string>;
  constructor() {
    super('sententia');
    this.version(1).stores({ snapshots: '&key' });
    this.version(2).stores({ snapshots: '&key', recovery: '&id,revision' });
  }
}
let database: SententiaDB | undefined;
let revision: number | undefined;
let saves = Promise.resolve();
const getDatabase = () => (database ??= new SententiaDB());

export class ConcurrentWriteError extends Error {
  constructor() {
    super('另一个窗口已更新进度，请重新载入后继续。');
    this.name = 'ConcurrentWriteError';
  }
}

export function defaultData(): AppData {
  return {
    schemaVersion: 1,
    records: {},
    archive: [],
    logs: [],
    preferences: { dailyGoal: 10, retention: 0.9, autoSpeak: false, name: '拾句者' },
  };
}

export async function loadData(): Promise<AppData> {
  const db = getDatabase();
  return db.transaction('rw', db.snapshots, async () => {
    let snapshot = await db.snapshots.get('main');
    if (!snapshot) {
      snapshot = { key: 'main', revision: 0, value: defaultData() };
      await db.snapshots.put(snapshot);
    }
    const value = validateBackup(snapshot.value);
    revision = snapshot.revision;
    return value;
  });
}

export function saveData(data: AppData): Promise<void> {
  // Clone and validate before queuing: subsequent state changes cannot alter this write.
  let value: AppData;
  try { value = validateBackup(data); }
  catch (error) { return Promise.reject(error); }
  const expectedRevision = revision;
  const task = saves.then(async () => {
    const db = getDatabase();
    await db.transaction('rw', db.snapshots, async () => {
      const existing = await db.snapshots.get('main');
      // Capture at invocation, not queue execution: two rapid actions in this tab
      // may have constructed snapshots from the same state. Reject the stale one.
      if (expectedRevision !== undefined && existing && existing.revision !== expectedRevision) throw new ConcurrentWriteError();
      const nextRevision = (existing?.revision ?? 0) + 1;
      await db.snapshots.put({ key: 'main', revision: nextRevision, value });
      revision = nextRevision;
    });
  });
  saves = task.catch(() => {});
  return task;
}

// Keep recovery and replacement in the same transaction. Network failures cannot
// leave a half-applied download or destroy the device's previous progress.
export function replaceDataWithBackup(data: AppData): Promise<void> {
  let value: AppData;
  try { value = validateBackup(data); } catch (error) { return Promise.reject(error); }
  const expectedRevision = revision;
  const task = saves.then(async () => {
    const db = getDatabase();
    await db.transaction('rw', db.snapshots, db.recovery, async () => {
      const existing = await db.snapshots.get('main');
      if (expectedRevision !== undefined && existing && existing.revision !== expectedRevision) throw new ConcurrentWriteError();
      if (existing) {
        await db.recovery.put({ id: crypto.randomUUID(), revision: existing.revision, createdAt: new Date().toISOString(), value: validateBackup(existing.value) });
        const older = await db.recovery.orderBy('revision').reverse().offset(5).primaryKeys();
        await db.recovery.bulkDelete(older);
      }
      const nextRevision = (existing?.revision ?? 0) + 1;
      await db.snapshots.put({ key: 'main', revision: nextRevision, value });
      revision = nextRevision;
    });
  });
  saves = task.catch(() => {});
  return task;
}

export async function latestRecoveryBackup(): Promise<RecoverySnapshot | undefined> {
  return getDatabase().recovery.orderBy('revision').reverse().first();
}

function fail(path: string): never { throw new Error(`备份格式不正确：${path}。`); }
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path);
  return value as Record<string, unknown>;
}
function string(value: unknown, path: string, maximum = 10_000, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > maximum) fail(path);
  return value;
}
function number(value: unknown, path: string, minimum: number, maximum: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) fail(path);
  return value;
}
function date(value: unknown, path: string): string {
  const text = string(value, path, 50);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text) || !Number.isFinite(Date.parse(text))) fail(path);
  return new Date(text).toISOString();
}
function array(value: unknown, path: string, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) fail(path);
  return value;
}
function wordId(value: unknown, path: string): string {
  const id = string(value, path, 60);
  if (!Object.hasOwn(wordMap, id)) fail(`${path} 含未知词汇`);
  return id;
}
function identifier(value: unknown, path: string): string {
  const id = string(value, path, 150);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) fail(path);
  return id;
}
function sentenceId(value: unknown, id: string, path: string, allowEmpty = false): string {
  const sid = string(value, path, 250, allowEmpty);
  if (!sid && allowEmpty) return sid;
  if (Object.hasOwn(sentenceMap, sid) && sentenceMap[sid].wordId === id) return sid;
  // Personal sentences may be removed after review; historical references remain valid.
  if (/^archive-[a-zA-Z0-9_-]+$/.test(sid) && sid.endsWith(`-${id}`)) return sid;
  fail(`${path} 与词汇不匹配`);
}

function card(value: unknown, path: string): StoredCard {
  const c = object(value, path);
  const state = number(c.state, `${path}.state`, 0, 3, true);
  const reps = number(c.reps, `${path}.reps`, 0, 1_000_000, true);
  const result: StoredCard = {
    due: date(c.due, `${path}.due`),
    stability: number(c.stability, `${path}.stability`, state === 0 ? 0 : 0.00001, 1_000_000),
    difficulty: number(c.difficulty, `${path}.difficulty`, state === 0 ? 0 : 1, 10),
    elapsed_days: number(c.elapsed_days, `${path}.elapsed_days`, 0, 1_000_000),
    scheduled_days: number(c.scheduled_days, `${path}.scheduled_days`, 0, 1_000_000),
    learning_steps: number(c.learning_steps, `${path}.learning_steps`, 0, 10_000, true),
    reps,
    lapses: number(c.lapses, `${path}.lapses`, 0, reps, true),
    state,
  };
  if (c.last_review !== undefined) result.last_review = date(c.last_review, `${path}.last_review`);
  if (reps > 0 && !result.last_review) fail(`${path}.last_review 缺失`);
  if (state === 0 && reps !== 0) fail(`${path} 新卡片复习次数不为零`);
  return result;
}

export function validateBackup(input: unknown): AppData {
  const data = object(input, '根节点');
  if (data.schemaVersion !== 1) fail('不支持的版本');
  const rawRecords = object(data.records, 'records');
  if (Object.keys(rawRecords).length > Object.keys(wordMap).length) fail('records 数量超出词库');
  const records: Record<string, MemoryRecord> = {};
  for (const [key, raw] of Object.entries(rawRecords)) {
    const id = wordId(key, 'records 词汇');
    const record = object(raw, `records.${id}`);
    if (record.id !== id) fail(`records.${id}.id`);
    const seen = array(record.seenSentenceIds, `records.${id}.seenSentenceIds`, 5_000).map((s, i) => sentenceId(s, id, `records.${id}.seenSentenceIds[${i}]`));
    records[id] = {
      id,
      card: card(record.card, `records.${id}.card`),
      learnedAt: date(record.learnedAt, `records.${id}.learnedAt`),
      lastSentenceId: sentenceId(record.lastSentenceId, id, `records.${id}.lastSentenceId`, true),
      seenSentenceIds: [...new Set(seen)],
    };
  }
  const archiveIds = new Set<string>();
  const archive = array(data.archive, 'archive', 5_000).map((raw, index): ArchiveEntry => {
    const path = `archive[${index}]`;
    const entry = object(raw, path);
    const id = identifier(entry.id, `${path}.id`);
    if (archiveIds.has(id)) fail(`${path}.id 重复`);
    archiveIds.add(id);
    const topic = string(entry.topic, `${path}.topic`, 30) as Topic;
    if (!topics.some(t => t.id === topic)) fail(`${path}.topic`);
    const wordIds = [...new Set(array(entry.wordIds, `${path}.wordIds`, Object.keys(wordMap).length).map(w => wordId(w, `${path}.wordIds`)))];
    const result: ArchiveEntry = {
      id, topic, wordIds,
      text: string(entry.text, `${path}.text`),
      source: string(entry.source, `${path}.source`, 300, true),
      createdAt: date(entry.createdAt, `${path}.createdAt`),
    };
    if (entry.sentenceId !== undefined) {
      const sid = string(entry.sentenceId, `${path}.sentenceId`, 100);
      if (!Object.hasOwn(sentenceMap, sid)) fail(`${path}.sentenceId`);
      result.sentenceId = sid;
    }
    return result;
  });
  const logIds = new Set<string>();
  const logs = array(data.logs, 'logs', 100_000).map((raw, index): StudyLog => {
    const path = `logs[${index}]`;
    const log = object(raw, path);
    const id = identifier(log.id, `${path}.id`);
    if (logIds.has(id)) fail(`${path}.id 重复`);
    logIds.add(id);
    const wid = wordId(log.wordId, `${path}.wordId`);
    if (log.mode !== 'learn' && log.mode !== 'review') fail(`${path}.mode`);
    const result: StudyLog = {
      id, wordId: wid,
      sentenceId: sentenceId(log.sentenceId, wid, `${path}.sentenceId`),
      rating: number(log.rating, `${path}.rating`, 1, 4, true) as 1 | 2 | 3 | 4,
      mode: log.mode,
      at: date(log.at, `${path}.at`),
    };
    if (log.guess !== undefined) {
      if (log.mode !== 'learn') fail(`${path}.guess 仅用于新词学习`);
      const guess = object(log.guess, `${path}.guess`);
      const choiceId = guess.choiceId === null ? null : string(guess.choiceId, `${path}.guess.choiceId`, 100);
      if (choiceId !== null && !Object.hasOwn(wordMap, choiceId) && !/^fallback-(v|n|adj|adv)\.-\d+$/.test(choiceId)) fail(`${path}.guess.choiceId`);
      if (typeof guess.correct !== 'boolean' || guess.correct !== (choiceId === wid)) fail(`${path}.guess.correct`);
      if (result.rating !== (guess.correct ? 3 : 1)) fail(`${path}.guess 与调度评分不一致`);
      result.guess = { choiceId, correct: guess.correct };
    }
    return result;
  });
  const p = object(data.preferences, 'preferences');
  if (typeof p.autoSpeak !== 'boolean') fail('preferences.autoSpeak');
  const preferences: Preferences = {
    dailyGoal: number(p.dailyGoal, 'preferences.dailyGoal', 1, 100, true),
    retention: number(p.retention, 'preferences.retention', 0.7, 0.99),
    autoSpeak: p.autoSpeak,
    name: string(p.name, 'preferences.name', 40),
  };
  return { schemaVersion: 1, records, archive, logs, preferences };
}

export function exportData(data: AppData): void {
  const value = validateBackup(data);
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sententia-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function closeStore(): void {
  database?.close();
  database = undefined;
  revision = undefined;
}
