import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { sentences, sentenceMap, words, wordMap } from '../src/lib/corpus';
import { createMeaningQuestion } from '../src/lib/meaning-quiz';
import type { ContextSentence, VocabCard } from '../src/lib/types';

interface LexicalEvidence {
  provider: 'ECDICT';
  ieltsTagged: boolean;
  bncRank: number | null;
  contemporaryRank: number | null;
  url: string;
}
interface ExampleEvidence {
  provider: 'Tatoeba';
  sentenceId: string;
  author: string;
  sourceUrl: string;
  license: string;
  attribution: string;
}
interface SelectedExample {
  id: string;
  text: string;
  translation: string;
  sourceSentenceId: string;
  author: string;
  sourceUrl: string;
  license: string;
  attribution: string;
}
type ImportedWord = VocabCard & { lexiconSource?: LexicalEvidence };
type ImportedSentence = ContextSentence & { source?: ExampleEvidence };
interface ImportPack {
  schemaVersion: number;
  words: ImportedWord[];
  sentences: ImportedSentence[];
}
interface Candidate {
  word: string;
  ieltsTagged: boolean;
  bncRank: number | null;
  contemporaryRank: number | null;
}
const pack = JSON.parse(readFileSync(new URL('../data/lexicon-import.json', import.meta.url), 'utf8')) as ImportPack;
const candidates = JSON.parse(readFileSync(new URL('../data/lexicon-candidates.json', import.meta.url), 'utf8')) as Candidate[];
const supplements = JSON.parse(readFileSync(new URL('../data/lexicon-core-supplement.json', import.meta.url), 'utf8')) as Candidate[];
const candidateMap = new Map([...candidates, ...supplements].map(candidate => [candidate.word, candidate]));
const selected = JSON.parse(readFileSync(new URL('../data/sources/selected-contexts.json', import.meta.url), 'utf8')) as { schemaVersion: number; examples: Record<string, SelectedExample[]> };
const importedIds = new Set(pack.words.map(word => word.id));
const englishWordCount = (text: string): number => (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length;

function bestRank(evidence: Pick<LexicalEvidence, 'bncRank' | 'contemporaryRank'>): number {
  return Math.min(...[evidence.bncRank, evidence.contemporaryRank].filter((rank): rank is number => rank !== null && rank > 0));
}

test('the source-backed expansion contains at least 2,000 distinct words and preserves 300 curated cards', () => {
  assert.equal(pack.schemaVersion, 1);
  assert.ok(pack.words.length >= 1700);
  assert.ok(words.length >= 2000);
  assert.equal(new Set(words.map(word => word.id)).size, words.length);
  assert.equal(new Set(words.map(word => word.word)).size, words.length);
  assert.equal(importedIds.size, pack.words.length);
  const baseWords=words.filter(word=>word.collection!=='advanced');
  assert.equal(baseWords.length - importedIds.size, 300);
  assert.equal(sentences.filter(sentence => !importedIds.has(sentence.wordId)&&wordMap[sentence.wordId].collection!=='advanced').length, 900);
  assert.ok(sentences.length >= 6000);
  for (const word of pack.words) {
    assert.ok(wordMap[word.id], `missing imported card ${word.id}`);
    assert.equal(wordMap[word.id].word, word.word);
    assert.deepEqual(wordMap[word.id].sentenceIds, word.sentenceIds);
  }
  for (const id of ['mitigate', 'foster', 'analyse', 'criterion', 'respectively']) {
    assert.ok(wordMap[id], `lost curated card ${id}`);
    assert.equal(wordMap[id].sentenceIds.length, 3);
    assert.ok(wordMap[id].sentenceIds.every(sentenceId => sentenceMap[sentenceId]));
  }
});

test('IELTS membership and general corpus ranks retain their actual evidence and cover most of the library', () => {
  const publicWords = words.filter(word=>word.collection!=='advanced') as ImportedWord[];
  const tagged = publicWords.filter(word => word.lexiconSource?.ieltsTagged).length;
  const common = publicWords.filter(word => word.lexiconSource && bestRank(word.lexiconSource) <= 10_000).length;
  assert.ok(tagged / publicWords.length >= .95, `${tagged}/${publicWords.length} have ECDICT IELTS-list evidence; expected at least 95%`);
  assert.ok(common / publicWords.length >= .95, `${common}/${publicWords.length} have a positive BNC or contemporary rank <=10,000; expected at least 95%`);
  for (const word of publicWords) {
    assert.ok(word.lexiconSource, `${word.id}, including curated cards, needs preserved lexical evidence`);
    assert.ok(bestRank(word.lexiconSource) <= 20_000, `${word.id} has no positive general-corpus rank within 20,000`);
  }
  for (const word of pack.words) {
    const evidence = word.lexiconSource;
    assert.ok(evidence, `${word.id} needs lexical provenance`);
    assert.equal(evidence.provider, 'ECDICT');
    assert.equal(typeof evidence.ieltsTagged, 'boolean');
    for (const rank of [evidence.bncRank, evidence.contemporaryRank]) {
      assert.ok(rank === null || (Number.isInteger(rank) && rank > 0), `${word.id} has an invalid or sentinel rank`);
    }
    assert.equal(new URL(evidence.url).hostname, 'github.com');
    const candidate = candidateMap.get(word.word);
    assert.ok(candidate, `${word.id} has no candidate source row`);
    assert.equal(evidence.ieltsTagged, candidate.ieltsTagged);
    assert.equal(evidence.bncRank, candidate.bncRank);
    assert.equal(evidence.contemporaryRank, candidate.contemporaryRank);
  }
});

test('imported learning cards have usable bilingual glosses and do not reveal their own answers', () => {
  for (const word of pack.words) {
    assert.equal(word.id, word.word);
    assert.match(word.word, /^[a-z]+$/);
    assert.ok(['v.', 'n.', 'adj.', 'adv.'].includes(word.partOfSpeech), `${word.id} has unsupported POS ${word.partOfSpeech}`);
    assert.ok(word.definitionEN.trim().length >= 8, `${word.id} has no useful English gloss`);
    assert.doesNotMatch(word.definitionEN, new RegExp(`\\b${word.word}\\b`, 'i'), `${word.id} reveals its answer`);
    assert.doesNotMatch(word.definitionEN, /[\u4e00-\u9fff]/, `${word.id} has a non-English gloss`);
    assert.doesNotMatch(word.definitionEN, /^(?:British|English|French|Roman|United States) (?:writer|politician|poet|novelist|jurist|general)\b/, `${word.id} uses a proper-name biography as its learning sense`);
    assert.match(word.definitionCN, /[\u4e00-\u9fff]/, `${word.id} has no Chinese gloss`);
    assert.match(word.phoneticUK, /^\/[^/]+\/$/, `${word.id} has no phonetic transcription`);
    assert.ok(['dictionary', 'edited'].includes(word.definitionOrigin ?? ''), `${word.id} has no definition-origin label`);
    assert.ok(['Tatoeba', 'editorial'].includes(word.contextOrigin ?? ''), `${word.id} has no context-origin label`);
    assert.ok(word.sentenceIds.length === 3 && new Set(word.sentenceIds).size === 3, `${word.id} needs three distinct examples`);
  }
});

test('imported contexts preserve real source evidence or explicitly identify original learning material', () => {
  assert.equal(selected.schemaVersion, 1);
  assert.equal(pack.sentences.length, pack.words.length * 3);
  assert.equal(new Set(pack.sentences.map(sentence => sentence.id)).size, pack.sentences.length);
  const byWord = new Map<string, ImportedSentence[]>();
  for (const sentence of pack.sentences) {
    const word = wordMap[sentence.wordId];
    assert.ok(word && importedIds.has(word.id), `${sentence.id} has no imported parent card`);
    assert.equal(typeof sentence.translation, 'string'); // Missing translations are intentionally empty, never fabricated.
    const [start, end] = sentence.targetSpan;
    assert.ok(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= sentence.text.length);
    assert.ok([word.word, ...word.forms].includes(sentence.text.slice(start, end).toLowerCase()), `${sentence.id} highlights the wrong word`);
    assert.ok(sentence.collocation && sentence.text.toLowerCase().includes(sentence.collocation.toLowerCase()));
    if (word.contextOrigin === 'editorial') {
      assert.equal(sentence.source, undefined, `${sentence.id} must not attribute an original sentence to Tatoeba`);
      assert.ok(['Reading', 'Writing', 'Listening'].includes(sentence.register));
      assert.ok(englishWordCount(sentence.text) >= 8 && englishWordCount(sentence.text) <= 25);
      assert.match(sentence.translation, /[\u4e00-\u9fff]/);
      assert.equal(selected.examples[word.id], undefined, `${word.id} must not have fabricated community-source rows`);
    } else {
      assert.equal(word.contextOrigin, 'Tatoeba');
      assert.equal(sentence.register, 'Example');
      assert.ok(englishWordCount(sentence.text) >= 8 && englishWordCount(sentence.text) <= 32);
      const evidence = sentence.source;
      assert.ok(evidence, `${sentence.id} needs example provenance`);
      assert.equal(evidence.provider, 'Tatoeba');
      assert.match(evidence.sentenceId, /^\d+$/);
      assert.equal(new URL(evidence.sourceUrl).hostname, 'tatoeba.org');
      assert.ok(evidence.sourceUrl.includes(evidence.sentenceId));
      assert.ok(evidence.author.trim() && evidence.license.trim() && evidence.attribution.trim());
      const row = selected.examples[word.id]?.find(example => example.sourceSentenceId === evidence.sentenceId);
      assert.ok(row, `${sentence.id} has no preserved selected-source record`);
      assert.equal(sentence.text, row.text);
      assert.equal(sentence.translation, row.translation);
      assert.equal(evidence.author, row.author);
      assert.equal(evidence.sourceUrl, row.sourceUrl);
      assert.equal(evidence.license, row.license);
      assert.equal(evidence.attribution, row.attribution);
    }
    assert.ok(word.sentenceIds.includes(sentence.id));
    assert.ok(sentenceMap[sentence.id]);
    byWord.set(word.id, [...(byWord.get(word.id) ?? []), sentence]);
  }
  for (const word of pack.words) {
    const contexts = byWord.get(word.id) ?? [];
    assert.equal(contexts.length, 3);
    assert.equal(new Set(contexts.map(sentence => sentence.text.toLowerCase().trim())).size, 3, `${word.id} repeats the same context`);
    if (word.contextOrigin === 'editorial') {
      assert.deepEqual(new Set(contexts.map(sentence => sentence.register)), new Set(['Reading', 'Writing', 'Listening']));
    } else {
      assert.equal(selected.examples[word.id]?.length, 3);
    }
  }
  assert.equal(Object.keys(selected.examples).length, pack.words.filter(word => word.contextOrigin === 'Tatoeba').length);
});

test('a deterministic sample of imported cards produces four distinct English meaning choices', () => {
  const sample = pack.words.filter((_, index) => index % Math.max(1, Math.floor(pack.words.length / 40)) === 0);
  for (const word of sample) {
    const question = createMeaningQuestion(word, words);
    assert.equal(question.correctOptionId, word.id);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map(option => option.id)).size, 4);
    assert.equal(new Set(question.options.map(option => option.definition.toLowerCase().trim())).size, 4);
    assert.equal(question.options.filter(option => option.id === word.id).length, 1);
    assert.ok(question.options.every(option => !/[\u4e00-\u9fff]/.test(option.definition)));
  }
});
