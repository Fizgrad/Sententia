import assert from 'node:assert/strict';
import test from 'node:test';
import { detectTopic, detectWords, getReviewSentence, sentenceMap, sentences, wordMap, words } from '../src/lib/corpus';
import { createQueuedRecord, dueRecords, formatInterval, previewSchedule, restoreCard, schedule, serializeCard } from '../src/lib/scheduler';
import { defaultData, validateBackup } from '../src/lib/store';

const now = new Date('2026-11-13T10:00:00.000Z');

test('new installations contain no invented study history or saved sentences', () => {
  const data = defaultData();
  assert.deepEqual(data.records, {});
  assert.deepEqual(data.archive, []);
  assert.deepEqual(data.logs, []);
  assert.equal(data.preferences.retention, 0.9);
  assert.deepEqual(validateBackup(data), data);
});

test('every original context points at the exact target and all words have distinct registers', () => {
  assert.ok(words.length >= 2000);
  assert.equal(sentences.length, words.length * 3);
  for (const word of words) {
    const pool = word.sentenceIds.map(id => sentenceMap[id]);
    assert.equal(new Set(pool.map(s => s.register)).size, word.contextOrigin === 'Tatoeba' ? 1 : 3);
    for (const sentence of pool) {
      const target = sentence.text.slice(...sentence.targetSpan).toLowerCase();
      assert.ok([word.word, ...word.forms].includes(target), `${word.id}: ${target}`);
      assert.equal(sentence.wordId, word.id);
      assert.ok(sentence.translation || sentence.source, `${sentence.id} needs a translation or source provenance`);
    }
  }
});

test('context rotation avoids the previous sentence and prioritises unseen contexts', () => {
  const word = wordMap.mitigate;
  assert.equal(getReviewSentence(word, 'mitigate-0', ['mitigate-0']).id, 'mitigate-1');
  assert.equal(getReviewSentence(word, 'mitigate-1', ['mitigate-0', 'mitigate-1']).id, 'mitigate-2');
  assert.notEqual(getReviewSentence(word, 'mitigate-2', word.sentenceIds).id, 'mitigate-2');
});

test('personal contexts are available to review without changing the corpus', () => {
  const archive = [{ id: 'personal-1', text: 'New policies mitigate risks for local families.', topic: 'Government' as const, wordIds: ['mitigate'] }];
  const sentence = getReviewSentence(wordMap.mitigate, 'mitigate-0', ['mitigate-0'], archive);
  assert.equal(sentence.id, 'archive-personal-1-mitigate');
  assert.equal(sentence.text.slice(...sentence.targetSpan), 'mitigate');
  assert.equal(sentences.length, words.length * 3);
});

test('word detection recognises whole word inflections and does not match substrings', () => {
  assert.deepEqual(detectWords('The policies mitigated risks and enhanced learning.'), ['mitigate', 'enhance', 'policy', 'learning']);
  assert.deepEqual(detectWords('The fostering initiative was allocatively efficient.'), ['foster', 'efficient']);
  assert.deepEqual(detectWords('Retaining receipts is sensible.'), ['retain']);
  assert.equal(detectTopic('Students learn in classrooms with teachers.'), 'Education');
  assert.equal(detectTopic('Climate change and carbon pollution affect water.'), 'Environment');
});

test('queueing a word adds a new due card without pretending it has been reviewed', () => {
  const record = createQueuedRecord('mitigate', now);
  assert.equal(record.card.reps, 0);
  assert.equal(record.card.state, 0);
  assert.equal(record.card.due, now.toISOString());
  assert.deepEqual(record.seenSentenceIds, []);
  const data = defaultData();
  data.records.mitigate = record;
  assert.deepEqual(dueRecords(data, now).map(r => r.id), ['mitigate']);
  assert.deepEqual(validateBackup(data), data);
  assert.throws(() => createQueuedRecord('constructor', now));
});

test('FSRS predictions match the actually applied schedule and all ratings are ordered', () => {
  const predictions = previewSchedule(undefined, 0.9, now);
  assert.equal(predictions.length, 4);
  assert.equal(predictions[0].due.getTime() - now.getTime(), 10 * 60_000);
  for (const [index, prediction] of predictions.entries()) {
    const result = schedule(undefined, 'mitigate', 'mitigate-0', prediction.rating, 0.9, now);
    assert.equal(result.card.due, prediction.due.toISOString());
    assert.equal(result.card.reps, 1);
    assert.equal(result.learnedAt, now.toISOString());
    assert.equal(result.lastSentenceId, 'mitigate-0');
    assert.deepEqual(result.seenSentenceIds, ['mitigate-0']);
    if (index) assert.ok(prediction.due >= predictions[index - 1].due);
  }
});

test('reviewing after the due date updates stability, lapses, and sentence history', () => {
  const first = schedule(undefined, 'mitigate', 'mitigate-0', 4, 0.9, now);
  assert.equal(first.card.state, 2);
  const later = new Date(first.card.due);
  const success = schedule(first, 'mitigate', 'mitigate-1', 3, 0.9, later);
  const failure = schedule(first, 'mitigate', 'mitigate-1', 1, 0.9, later);
  assert.ok(success.card.stability > first.card.stability);
  assert.equal(failure.card.lapses, 1);
  assert.equal(success.card.reps, 2);
  assert.deepEqual(success.seenSentenceIds, ['mitigate-0', 'mitigate-1']);
  assert.equal(first.card.reps, 1, 'input record must not be mutated');
  assert.equal(failure.card.due, new Date(later.getTime() + 10 * 60_000).toISOString());
});

test('higher requested retention leads to a shorter long-term review interval', () => {
  const lower = schedule(undefined, 'mitigate', 'mitigate-0', 4, 0.8, now);
  const higher = schedule(undefined, 'mitigate', 'mitigate-0', 4, 0.95, now);
  assert.ok(new Date(higher.card.due) < new Date(lower.card.due));
  assert.throws(() => previewSchedule(undefined, 0));
  assert.throws(() => schedule(undefined, 'mitigate', 'mitigate-0', 0 as 1, 0.9));
});

test('FSRS state round trips through JSON and Date serialization without loss', () => {
  const first = schedule(undefined, 'mitigate', 'mitigate-0', 4, 0.9, now);
  const stored = JSON.parse(JSON.stringify(first.card));
  assert.deepEqual(serializeCard(restoreCard(stored)), first.card);
  const data = defaultData();
  data.records.mitigate = first;
  data.logs.push({ id: 'log-1', wordId: 'mitigate', sentenceId: 'mitigate-0', rating: 4, mode: 'learn', at: now.toISOString() });
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))), data);
});

test('imports reject corrupt state, unknown references, duplicate IDs, and dangerous prototype keys', () => {
  const original = defaultData();
  const mutated = (edit: (data: any) => void) => {
    const data = JSON.parse(JSON.stringify(original));
    edit(data);
    return data;
  };
  assert.throws(() => validateBackup(null));
  assert.throws(() => validateBackup(mutated(d => d.schemaVersion = 2)));
  assert.throws(() => validateBackup(mutated(d => d.preferences.retention = NaN)));
  assert.throws(() => validateBackup(mutated(d => d.preferences.autoSpeak = 'false')));
  assert.throws(() => validateBackup(mutated(d => d.preferences.name = 'x'.repeat(41))));
  assert.throws(() => validateBackup(mutated(d => d.records.unknown = createQueuedRecord('mitigate', now))));
  assert.throws(() => validateBackup(mutated(d => d.records.mitigate = { ...createQueuedRecord('mitigate', now), id: 'foster' })));
  assert.throws(() => validateBackup(mutated(d => d.records.mitigate = { ...createQueuedRecord('mitigate', now), lastSentenceId: 'foster-0' })));
  const proto = JSON.parse('{"schemaVersion":1,"records":{"__proto__":{}},"archive":[],"logs":[],"preferences":{"dailyGoal":10,"retention":0.9,"autoSpeak":false,"name":"Test"}}');
  assert.throws(() => validateBackup(proto));
  const badCard = mutated(d => d.records.mitigate = createQueuedRecord('mitigate', now));
  badCard.records.mitigate.card.due = 'not a date';
  assert.throws(() => validateBackup(badCard));
  const log = { id: 'log-1', wordId: 'mitigate', sentenceId: 'mitigate-0', rating: 3, mode: 'learn', at: now.toISOString() };
  assert.throws(() => validateBackup(mutated(d => d.logs = [log, log])));
  assert.deepEqual(original, defaultData(), 'failed imports must not modify current data');
});

test('intervals are readable and due queue is chronological', () => {
  assert.equal(formatInterval(now, now), '即刻');
  assert.equal(formatInterval(new Date(now.getTime() + 600_000), now), '10 分钟后');
  assert.equal(formatInterval(new Date(now.getTime() + 3_600_000), now), '1 小时后');
  assert.equal(formatInterval(new Date(now.getTime() + 86_400_000), now), '1 天后');
  const data = defaultData();
  data.records.foster = createQueuedRecord('foster', new Date(now.getTime() - 1000));
  data.records.mitigate = createQueuedRecord('mitigate', new Date(now.getTime() - 5000));
  data.records.ubiquitous = createQueuedRecord('ubiquitous', new Date(now.getTime() + 1000));
  assert.deepEqual(dueRecords(data, now).map(r => r.id), ['mitigate', 'foster']);
});
