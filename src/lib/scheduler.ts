import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import { wordMap } from './corpus';
import type { AppData, MemoryRecord, StoredCard } from './types';

export type StudyRating = 1 | 2 | 3 | 4;
export const ratingLabels = ['重来', '困难', '良好', '轻松'] as const;

function engine(retention: number) {
  if (!Number.isFinite(retention) || retention < 0.7 || retention > 0.99) {
    throw new Error('目标记忆率必须在 70% 到 99% 之间。');
  }
  return fsrs({
    request_retention: retention,
    enable_fuzz: false,
    learning_steps: ['10m'],
    relearning_steps: ['10m'],
  });
}

export function serializeCard(card: Card): StoredCard {
  const { due, last_review, ...state } = card;
  return {
    ...state,
    due: due.toISOString(),
    ...(last_review ? { last_review: last_review.toISOString() } : {}),
  };
}

export function restoreCard(card: StoredCard): Card {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function createQueuedRecord(wordId: string, now = new Date()): MemoryRecord {
  if (!Object.hasOwn(wordMap, wordId)) throw new Error('该词不在当前词库中。');
  return {
    id: wordId,
    card: serializeCard(createEmptyCard(now)),
    learnedAt: now.toISOString(),
    lastSentenceId: '',
    seenSentenceIds: [],
  };
}

export function schedule(
  record: MemoryRecord | undefined,
  wordId: string,
  sentenceId: string,
  rating: StudyRating,
  retention: number,
  now = new Date(),
): MemoryRecord {
  if (!Object.hasOwn(wordMap, wordId)) throw new Error('该词不在当前词库中。');
  if (![1, 2, 3, 4].includes(rating)) throw new Error('请选择有效的熟悉度。');
  if (record && record.id !== wordId) throw new Error('记忆卡片与词汇不匹配。');
  const card = record ? restoreCard(record.card) : createEmptyCard(now);
  const result = engine(retention).next(card, now, rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy);
  return {
    id: wordId,
    card: serializeCard(result.card),
    learnedAt: record?.learnedAt ?? now.toISOString(),
    lastSentenceId: sentenceId,
    seenSentenceIds: [...new Set([...(record?.seenSentenceIds ?? []), sentenceId])],
  };
}

export function formatInterval(due: Date, now = new Date()): string {
  const milliseconds = due.getTime() - now.getTime();
  if (!Number.isFinite(milliseconds)) return '时间待定';
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  if (minutes < 1) return '即刻';
  if (minutes < 60) return `${minutes} 分钟后`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时后`;
  const days = Math.max(1, Math.round(minutes / 1_440));
  if (days < 365) return `${days} 天后`;
  return `${Math.round((days / 365) * 10) / 10} 年后`;
}

export function previewSchedule(record: MemoryRecord | undefined, retention: number, now = new Date()) {
  const card = record ? restoreCard(record.card) : createEmptyCard(now);
  const scheduler = engine(retention);
  return ([1, 2, 3, 4] as StudyRating[]).map(rating => {
    const result = scheduler.next(card, now, rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy);
    return { rating, label: ratingLabels[rating - 1], interval: formatInterval(result.card.due, now), due: result.card.due };
  });
}

export function dueRecords(data: AppData, now = new Date()): MemoryRecord[] {
  return Object.values(data.records)
    .filter(record => new Date(record.card.due).getTime() <= now.getTime())
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
}
