import assert from 'node:assert/strict';
import test from 'node:test';
import { paraphraseGroups, sentenceMap, wordMap } from '../src/lib/corpus';

const originalGroupIds = ['relieve', 'promote', 'significant', 'reduce', 'widespread'];
const chinese = /[\u4e00-\u9fff]/;
const items = paraphraseGroups.flatMap(group => group.words);

test('the expanded matrix preserves its original clusters and offers 100 distinct comparisons', () => {
  assert.equal(paraphraseGroups.length, 100);
  assert.deepEqual(paraphraseGroups.slice(0, originalGroupIds.length).map(group => group.id), originalGroupIds);
  assert.ok(items.length >= 325 && items.length <= 400, `unexpected comparison count ${items.length}`);
  assert.equal(new Set(paraphraseGroups.map(group => group.id)).size, paraphraseGroups.length);
  assert.deepEqual(new Set(paraphraseGroups.map(group => group.category)), new Set(['action', 'quality', 'concept']));
  const wordSets = new Set<string>();
  for (const [index, group] of paraphraseGroups.entries()) {
    assert.match(group.id, /^[a-z]+(?:-[a-z]+)*$/, `${group.id}: use a stable cluster identifier`);
    if (index < 25) assert.equal(group.words.length, 4, `${group.id}: preserve the existing four-word comparison`);
    else assert.ok(group.words.length >= 3 && group.words.length <= 4, `${group.id}: expected three or four related choices`);
    assert.equal(new Set(group.words.map(item => item.word)).size, group.words.length, `${group.id}: repeated word choice`);
    assert.ok(['action', 'quality', 'concept'].includes(group.category ?? ''), `${group.id}: missing comparison category`);
    const wordSet = group.words.map(item => item.word).sort().join('|');
    assert.ok(!wordSets.has(wordSet), `${group.id}: repeats another cluster's whole set of words`);
    wordSets.add(wordSet);
  }
});

test('each cluster explains its meaning and substitution boundaries in Chinese', () => {
  for (const group of paraphraseGroups) {
    assert.match(group.title.trim(), chinese, `${group.id}: missing Chinese title`);
    assert.match(group.tip.trim(), chinese, `${group.id}: missing substitution guidance`);
    assert.match(group.subtitle.trim(), /[A-Za-z]/, `${group.id}: missing English subtitle`);
    for (const item of group.words) {
      assert.match(item.word, /^[a-z]+$/, `${group.id}: invalid headword`);
      assert.match(item.meaning.trim(), chinese, `${item.word}: missing Chinese meaning`);
      assert.match(item.note.trim(), chinese, `${item.word}: missing usage distinction`);
    }
  }
});

test('matrix examples are distinct complete contexts containing the exact target headword', () => {
  const examples = new Set<string>();
  for (const item of items) {
    const example = item.example.trim();
    const target = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.equal([...example.matchAll(new RegExp(`\\b${target}\\b`, 'gi'))].length, 1, `${item.word}: expected its exact headword once`);
    assert.doesNotMatch(example, chinese, `${item.word}: example must be in English`);
    assert.match(example, /[.!?]$/, `${item.word}: example must be a complete sentence`);
    const count = (example.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length;
    assert.ok(count >= 8 && count <= 25, `${item.word}: ${count} words, expected 8–25`);
    const normalised = example.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
    assert.ok(!examples.has(normalised), `${item.word}: example repeats another card's context`);
    examples.add(normalised);
  }
});

test('every comparison supplies at least three distinct usable collocation prompts', () => {
  for (const item of items) {
    assert.ok(item.collocations.length >= 3, `${item.word}: insufficient collocations`);
    const collocations = item.collocations.map(value => value.trim().toLowerCase());
    assert.ok(collocations.every(value => value.length > 0), `${item.word}: empty collocation`);
    assert.equal(new Set(collocations).size, collocations.length, `${item.word}: duplicate collocation`);
    for (const collocation of item.collocations) {
      assert.match(collocation, /[A-Za-z]/, `${item.word}: collocation must be usable in English`);
    }
  }
});

test('all 95 added clusters lead to existing cards with three learning contexts', () => {
  const additions = paraphraseGroups.slice(originalGroupIds.length);
  assert.equal(additions.length, 95);
  for (const group of additions) {
    for (const item of group.words) {
      assert.ok(Object.hasOwn(wordMap, item.word), `${group.id}/${item.word}: no learning card for this comparison`);
      const word = wordMap[item.word];
      assert.equal(word.sentenceIds.length, 3, `${item.word}: expected three existing learning contexts`);
      for (const id of word.sentenceIds) {
        assert.ok(Object.hasOwn(sentenceMap, id), `${item.word}: missing ${id}`);
        assert.equal(sentenceMap[id].wordId, word.id, `${id}: linked to another word`);
      }
    }
  }
});
