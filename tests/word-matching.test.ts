import assert from 'node:assert/strict';
import test from 'node:test';
import { detectWords, findWordMatches, getReviewSentence, wordMap } from '../src/lib/corpus';
import { createWordMatcher } from '../src/lib/word-matching';

test('complete-token matching never highlights a contraction as a collected headword', () => {
  const text = "I haven't found a safe haven; they haven’t either, but havens exist.";
  const matches = findWordMatches(text, ['haven']);
  assert.deepEqual(matches.map(match => text.slice(match.start, match.end)), ['haven', 'havens']);
  assert.equal(matches[0].start, text.indexOf('haven;'));
  assert.ok(detectWords(text).includes('haven'));
  assert.deepEqual(findWordMatches("haven't haven’t haven‘t", ['haven']), []);
});

test('matching and display spans preserve case, inflections, and possessive suffixes', () => {
  const text = "HAVEN'S haven’s havens' underwent UNDERGONE";
  const matches = findWordMatches(text, ['haven', 'undergo']);
  assert.deepEqual(matches.map(match => ({ id: match.wordId, text: text.slice(match.start, match.end) })), [
    { id: 'haven', text: 'HAVEN' },
    { id: 'haven', text: 'haven' },
    { id: 'haven', text: 'havens' },
    { id: 'undergo', text: 'underwent' },
    { id: 'undergo', text: 'UNDERGONE' },
  ]);
  assert.deepEqual(findWordMatches(text, []), []);
  assert.deepEqual(findWordMatches(text, ['not-in-the-library']), []);
});

test('word boundaries reject substrings and alphanumeric identifiers', () => {
  const matchWords = createWordMatcher([{ id: 'he', word: 'he', forms: [] }]);
  const text = 'The theme is hers; HE spoke. _he he2 then he.';
  assert.deepEqual(matchWords(text).map(match => text.slice(match.start, match.end)), ['HE', 'he']);
  assert.deepEqual(matchWords('the theme _he he2'), []);
});

test('personal cloze targets the same complete word as archive matching', () => {
  const text = "I haven't found a safe haven for these rare birds.";
  const entry = { id: 'haven-boundary', text, topic: 'Environment' as const, wordIds: detectWords(text) };
  const sentence = getReviewSentence(wordMap.haven, undefined, [], [entry]);
  assert.equal(sentence.id, 'archive-haven-boundary-haven');
  assert.deepEqual(sentence.targetSpan, [text.indexOf('haven for'), text.indexOf('haven for') + 5]);
  assert.equal(text.slice(...sentence.targetSpan), 'haven');
  assert.equal(`${text.slice(0, sentence.targetSpan[0])}_____${text.slice(sentence.targetSpan[1])}`, "I haven't found a safe _____ for these rare birds.");

  const stale = { ...entry, id: 'contraction-only', text: "We haven't found it yet.", wordIds: ['haven'] };
  const fallback = getReviewSentence(wordMap.haven, undefined, [], [stale]);
  assert.ok(wordMap.haven.sentenceIds.includes(fallback.id));
});
