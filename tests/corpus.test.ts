import assert from 'node:assert/strict';
import test from 'node:test';
import { detectTopic, detectWords, getReviewSentence, paraphraseGroups, sentenceMap, sentences, topics, wordMap, words } from '../src/lib/corpus';

test('all eight product topics are represented by readable, original context pools', () => {
  assert.equal(new Set(sentences.map(s => s.topic)).size, topics.length);
  assert.equal(new Set(sentences.map(s => s.id)).size, sentences.length);
  assert.equal(new Set(words.map(w => w.id)).size, words.length);
  for (const word of words) {
    assert.equal(word.id, word.word);
    assert.ok(word.sentenceIds.length >= 3);
    assert.ok(word.phoneticUK.startsWith('/') && word.phoneticUK.endsWith('/'));
    assert.ok([6, 7, 8].includes(word.ieltsBand));
    for (const id of word.sentenceIds) {
      const sentence = sentenceMap[id];
      assert.ok(sentence, `${word.id} references missing ${id}`);
      const [start, end] = sentence.targetSpan;
      assert.ok(Number.isInteger(start) && Number.isInteger(end));
      assert.ok(start >= 0 && end > start && end <= sentence.text.length);
      assert.ok(sentence.translation.length > 5 || sentence.source);
      assert.ok(sentence.collocation.length > 3);
    }
  }
});

test('every word rotates through every unseen sentence before recycling', () => {
  for (const word of words) {
    let last = word.sentenceIds[0];
    const seen = [last];
    for (let i = 1; i < word.sentenceIds.length; i++) {
      const next = getReviewSentence(word, last, seen);
      assert.notEqual(next.id, last);
      assert.ok(!seen.includes(next.id));
      seen.push(next.id);
      last = next.id;
    }
    for (let i = 0; i < 10; i++) {
      const next = getReviewSentence(word, last, seen);
      assert.notEqual(next.id, last, `${word.id} repeated its last context`);
      last = next.id;
    }
  }
});

test('personal review tolerates stale history and deleted personal sentences', () => {
  const personal = [{ id: 'sample', text: 'The new policy mitigated the financial risks.', topic: 'Government' as const, wordIds: ['mitigate'] }];
  const sentence = getReviewSentence(wordMap.mitigate, 'mitigate-0', ['mitigate-0'], personal);
  assert.equal(sentence.text.slice(...sentence.targetSpan), 'mitigated');
  const next = getReviewSentence(wordMap.mitigate, sentence.id, ['mitigate-0', sentence.id], []);
  assert.equal(next.id, 'mitigate-1');
  const staleReference = getReviewSentence(wordMap.mitigate, 'archive-deleted-mitigate', ['archive-deleted-mitigate']);
  assert.ok(wordMap.mitigate.sentenceIds.includes(staleReference.id));
});

test('saving an existing learning sentence does not bypass cross-sentence recall', () => {
  const word=wordMap.mitigate;
  const original=sentenceMap[word.sentenceIds[0]];
  const archive=[{id:'saved-original',text:original.text.toUpperCase(),topic:original.topic,wordIds:[word.id],sentenceId:original.id}];
  const next=getReviewSentence(word,original.id,[original.id],archive);
  assert.equal(next.id,word.sentenceIds[1]);
  const afterPersonal=getReviewSentence(word,'archive-saved-original-mitigate',['archive-saved-original-mitigate'],archive);
  assert.equal(afterPersonal.id,word.sentenceIds[1]);
  assert.notEqual(next.text.toLowerCase(),original.text.toLowerCase());
});

test('word matching handles punctuation, case, forms, and boundaries', () => {
  assert.deepEqual(detectWords('MITIGATE; mitigated, mitigating!'), ['mitigate']);
  assert.deepEqual(detectWords('Underwent and undergone, but no undergoingness.'), ['undergo']);
  assert.deepEqual(detectWords('Retain; retained. Sustainable approaches enhance learning.'), ['sustainable', 'enhance', 'retain', 'approach', 'learning']);
  assert.deepEqual(detectWords('She retains paperwork rather than retailing.'), ['retain']);
  assert.deepEqual(detectWords(''), []);
  assert.deepEqual(detectWords('a'.repeat(20_000)), []);
  assert.deepEqual(detectWords("haven't haven't haven’t haven‘t"), []);
  assert.deepEqual(detectWords("haven haven's haven’s"), ['haven']);
  assert.deepEqual(detectWords('_mitigate mitigate2 mitigation'), []);
});

test('topic inference recognises relevant stems and avoids accidental substrings', () => {
  const cases = [
    ['Climate change, trees, pollution and carbon emissions.', 'Environment'],
    ['Schools and teachers help students learn.', 'Education'],
    ['Digital software and artificial intelligence are technologies.', 'Technology'],
    ['Communities need housing and social support.', 'Society'],
    ['Financial markets shape investment and income.', 'Economy'],
    ['The doctor recommends exercise to improve health.', 'Health'],
    ['Museums preserve cultural heritage through art.', 'Culture'],
    ['Governments regulate public spending through policies.', 'Government'],
    ['We should start particularly early.', 'Society'],
    ['The museum exhibits traditional painting.', 'Culture'],
    ['一条没有命中英语关键词的阅读札记。', 'Society'],
  ] as const;
  for (const [text, expected] of cases) assert.equal(detectTopic(text), expected, text);
});

test('paraphrase clusters have valid references and distinct choices', () => {
  assert.equal(paraphraseGroups.length, 100);
  const ids = new Set(paraphraseGroups.map(g => g.id));
  assert.equal(ids.size, paraphraseGroups.length);
  for (const group of paraphraseGroups) {
    assert.ok(group.words.length >= 2);
    assert.equal(new Set(group.words.map(w => w.word)).size, group.words.length);
    for (const item of group.words) {
      assert.ok(item.example.toLowerCase().includes(item.word));
      assert.ok(item.collocations.length >= 2);
      assert.ok(item.note);
    }
  }
  for (const word of words) if (word.paraphraseGroupId) assert.ok(ids.has(word.paraphraseGroupId));
});
