import assert from 'node:assert/strict';
import test from 'node:test';
import { extraSeeds } from '../src/lib/corpus-extra';

const originalWords = new Set('mitigate foster ubiquitous alleviate sustainable substantial resilient allocate preserve enhance inevitable diminish facilitate disparity scarce undergo empirical incentive profound vulnerable detrimental viable diverse advocate conventional coherent exacerbate retain constraint predominant'.split(' '));
const allowedTopics = new Set(['Environment', 'Education', 'Technology', 'Society', 'Economy', 'Health', 'Culture', 'Government']);

test('extra corpus adds exactly 70 distinct academically useful words without duplicates', () => {
  assert.equal(extraSeeds.length, 70);
  assert.equal(new Set(extraSeeds.map(seed => seed[0])).size, 70);
  assert.equal(new Set(extraSeeds.map(seed => seed[3])).size, 70, 'English definitions must not be duplicates');
  for (const [word, ipa, pos, en, cn, band, topic, forms] of extraSeeds) {
    assert.ok(!originalWords.has(word), `${word} already exists in the original corpus`);
    assert.match(word, /^[a-z]+$/);
    assert.match(ipa, /^\/[^/]+\/$/);
    assert.ok(['n.', 'v.', 'adj.', 'adv.'].includes(pos));
    assert.ok(en.length >= 25 && !en.toLowerCase().includes(word), `${word}: definition should explain rather than repeat the target`);
    assert.match(cn, /[\u4e00-\u9fff]/);
    assert.ok([6, 7, 8].includes(band));
    assert.ok(allowedTopics.has(topic));
    for (const form of forms ? forms.split(',') : []) {
      assert.match(form, /^[a-z]+$/);
      assert.notEqual(form, word);
    }
  }
});

test('every added word has three distinct complete contexts with accurate target matching', () => {
  const allTexts = new Set<string>();
  for (const [word, , , , , , , rawForms, contexts, translations, collocations] of extraSeeds) {
    assert.equal(contexts.length, 3);
    assert.equal(translations.length, 3);
    assert.equal(collocations.length, 3);
    const forms = [word, ...(rawForms ? rawForms.split(',') : [])].sort((a, b) => b.length - a.length);
    const target = new RegExp(`\\b(${forms.join('|')})\\b`, 'i');
    for (let i = 0; i < contexts.length; i++) {
      const text = contexts[i];
      assert.ok(!allTexts.has(text), `${word}-${i} repeats another context`);
      allTexts.add(text);
      const match = target.exec(text);
      assert.ok(match, `${word}-${i} has no target word or approved inflection`);
      assert.ok(forms.includes(match[0].toLowerCase()));
      assert.match(text, /[.?]$/);
      assert.ok(text.split(/\s+/).length >= 8, `${word}-${i} should offer enough context for inference`);
      assert.ok(text.split(/\s+/).length <= 35, `${word}-${i} is too long for the accessible context feed`);
      assert.ok(translations[i].length >= 10, `${word}-${i} needs a complete Chinese translation`);
      assert.match(translations[i], /[。？！]$/);
      assert.ok(collocations[i].length > word.length, `${word}-${i} needs a phrase, not just the target`);
    }
  }
  assert.equal(allTexts.size, 210);
});

test('new corpus covers all eight product topics and offers enough major-POS choices', () => {
  assert.equal(new Set(extraSeeds.map(seed => seed[6])).size, allowedTopics.size);
  for (const pos of ['n.', 'v.', 'adj.']) assert.ok(extraSeeds.filter(seed => seed[2] === pos).length >= 4);
  // Approximately is deliberately the only adverb: the quiz uses its explicit
  // same-POS fallback bank rather than substituting noun/adjective definitions.
  assert.deepEqual(extraSeeds.filter(seed => seed[2] === 'adv.').map(seed => seed[0]), ['approximately']);
});
