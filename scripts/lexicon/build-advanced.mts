import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { curatedWords, detectTopic } from '../../src/lib/corpus';
import { createWordMatcher } from '../../src/lib/word-matching';
import type { ContextSentence, VocabCard } from '../../src/lib/types';

interface Candidate { word: string; forms: string[]; pos: string; definitionEN: string; definitionCN: string; phonetic: string; tags: string[]; ieltsTagged: boolean; bncRank: number | null; contemporaryRank: number | null }
interface Example { id: string; text: string; translation: string; sourceSentenceId: string; author: string; sourceUrl: string; license: string; attribution: string; translationSource?: NonNullable<ContextSentence['source']>['translationSource'] }
interface Review { word: string; status: 'approved' | 'reject'; exampleIds?: string[]; definitionEN?: string; definitionCN?: string; partOfSpeech?: string; forms?: string[]; phoneticUK?: string; reason?: string; authoredContexts?: {text:string;translation:string;register:'Reading'|'Writing'|'Listening';collocation:string}[] }
const read = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T;
const optional = async <T>(path: string, fallback: T): Promise<T> => { try { return await read<T>(path); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback; throw error; } };
const initialize = process.argv.includes('--initialize');
const check = process.argv.includes('--check');
const excluded = new Set((await read<{words:string[]}>('data/advanced-exclusions.json')).words);
const candidates = await read<Candidate[]>('data/lexicon-candidates.json');
const candidateMap = new Map(candidates.map(row => [row.word, row]));
const originalPack = await read<{ words: VocabCard[] }>('data/lexicon-import.json');
const base = [...curatedWords, ...originalPack.words];
const registry = await read<{ repository: string; commit: string }>('data/sources/lexicon.json');
const reviews = new Map<string, Review>();
const reviewFiles = [];
for (const filename of (await readdir('data/advanced-reviews')).filter(name => /^review-\d+\.json$/.test(name)).sort()) {
  const path = `data/advanced-reviews/${filename}`;
  const bytes = await readFile(path);
  const file = JSON.parse(bytes.toString('utf8')) as { entries: Review[] };
  for (const row of file.entries) {
    if (reviews.has(row.word)) throw new Error(`Duplicate advanced review: ${row.word}`);
    reviews.set(row.word, row);
  }
  reviewFiles.push({ path, sha256: createHash('sha256').update(bytes).digest('hex'), count: file.entries.length });
}
const saved = await optional<{ examples: Record<string, Example[]> }>('data/sources/advanced-contexts.json', { examples: {} });
const cached = initialize ? await read<Record<string, Example[]>>('.npm-cache/sentences/retained-pools.json') : {};
const selection = initialize ? (await read<{ word: string }[]>('artifacts/advanced-vocabulary/review-source.json')).map(row => row.word) : (await read<{ words: string[] }>('data/advanced-selection.json')).words;
const owners = new Map(base.flatMap(word => [word.word, ...word.forms].map(form => [form, word.id] as const)));
const words: VocabCard[] = [];
const sentences: ContextSentence[] = [];
const sourceExamples: Record<string, Example[]> = {};
const skipped: { word: string; reason: string }[] = [];
const rank = (row: Candidate) => Math.min(row.bncRank || Infinity, row.contemporaryRank || Infinity);
for (const id of selection) {
  if (initialize && words.length === 1000) break;
  if (excluded.has(id)) { if (!initialize) throw new Error(`Excluded selection: ${id}`); continue; }
  const review = reviews.get(id);
  if (review?.status !== 'approved') { if (!initialize) throw new Error(`Missing approval: ${id}`); continue; }
  try {
    const row = candidateMap.get(id);
    if (!row || owners.has(id)) throw new Error('Missing dictionary evidence or an existing headword/form');
    if (!row.tags.some(tag => ['cet6', 'toefl', 'gre'].includes(tag)) || row.tags.some(tag => ['zk', 'gk', 'cet4'].includes(tag))) throw new Error('Needs an advanced examination tag and no school/CET4 tag');
    if (rank(row) > 20000) throw new Error('Needs a positive general-corpus rank within 20,000');
    const forms = [...new Set(review.forms ?? row.forms)].filter(form => form !== id && !owners.has(form));
    if (forms.some(form => !/^[a-z]+$/.test(form))) throw new Error('Invalid explicit form');
    const word: VocabCard = { id, word: id, forms, phoneticUK: review.phoneticUK ?? row.phonetic, partOfSpeech: review.partOfSpeech ?? row.pos, definitionEN: review.definitionEN ?? row.definitionEN, definitionCN: review.definitionCN ?? row.definitionCN, ieltsBand: rank(row) <= 5000 ? 7 : 8, sentenceIds: [], lexiconSource: { provider: 'ECDICT', ieltsTagged: row.ieltsTagged, bncRank: row.bncRank, contemporaryRank: row.contemporaryRank, examTags: row.tags, url: `${registry.repository}/blob/${registry.commit}/README.md` }, definitionOrigin: review.definitionEN || review.definitionCN || review.partOfSpeech ? 'edited' : 'dictionary', contextOrigin: review.authoredContexts ? 'editorial' : 'Tatoeba', collection: 'advanced' };
    if (!['n.', 'v.', 'adj.', 'adv.'].includes(word.partOfSpeech) || !/^\/[^/]+\/$/.test(word.phoneticUK) || word.definitionEN.length < 8 || new RegExp(`\\b${id}\\b`, 'i').test(word.definitionEN) || !/[\u4e00-\u9fff]/.test(word.definitionCN)) throw new Error('Invalid learning sense, POS or transcription');
    const lookup = new Map([...(cached[id] ?? []), ...(saved.examples[id] ?? [])].map(example => [example.id, example]));
    const examples = (review.exampleIds ?? []).map(exampleId => lookup.get(exampleId));
    if (!review.authoredContexts && (examples.length !== 3 || examples.some(example => !example))) throw new Error('Three reviewed source examples are required');
    const match = createWordMatcher([word]);
    if(review.authoredContexts&&(review.authoredContexts.length!==3||new Set(review.authoredContexts.map(context=>context.register)).size!==3))throw new Error('Original contexts require three different registers');
    const pool = review.authoredContexts ? review.authoredContexts.map((context,index):ContextSentence=>{
      const matches=match(context.text);
      const count=context.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length??0;
      if(matches.length!==1||count<8||count>25||!/[\u4e00-\u9fff]/.test(context.translation)||!context.text.toLowerCase().includes(context.collocation.toLowerCase()))throw new Error('Invalid original context');
      return {id:`${id}-advanced-${index}`,wordId:id,topic:detectTopic(context.text),...context,targetSpan:[matches[0].start,matches[0].end]};
    }) : (examples as Example[]).map((example, index): ContextSentence => {
      const matches = match(example.text);
      const count = example.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0;
      if (matches.length !== 1 || count < 8 || count > 32 || !example.author || !example.attribution || example.license !== 'CC-BY-2.0-FR' || new URL(example.sourceUrl).hostname !== 'tatoeba.org') throw new Error(`Invalid source text or target: ${example.id}`);
      const { start, end } = matches[0];
      const before = example.text.slice(0, start).match(/(?:[\w'’-]+\s+){0,2}$/)?.[0] ?? '';
      const after = example.text.slice(end).match(/^(?:\s+[\w'’-]+){0,3}/)?.[0] ?? '';
      return { id: `${id}-advanced-${index}`, wordId: id, topic: detectTopic(example.text), register: 'Example', text: example.text, translation: example.translation ?? '', targetSpan: [start, end], collocation: `${before}${example.text.slice(start, end)}${after}`.trim(), source: { provider: 'Tatoeba', sentenceId: example.sourceSentenceId, author: example.author, sourceUrl: example.sourceUrl, license: example.license, attribution: example.attribution, ...(example.translationSource ? { translationSource: example.translationSource } : {}) } };
    });
    if (new Set(pool.map(sentence => sentence.text.toLowerCase().trim())).size !== 3) throw new Error('Repeated source context');
    word.sentenceIds = pool.map(sentence => sentence.id);
    words.push(word); sentences.push(...pool); if(!review.authoredContexts)sourceExamples[id] = examples as Example[];
    for (const form of [id, ...forms]) owners.set(form, id);
  } catch (error) {
    if (!initialize) throw error;
    skipped.push({ word: id, reason: error instanceof Error ? error.message : String(error) });
  }
}
if (words.length !== 1000) { console.error(JSON.stringify(skipped)); throw new Error(`Need 1000 validated advanced cards, found ${words.length}`); }
const previous = await read<{words:VocabCard[]}>('data/advanced-vocabulary.json');
for (const old of previous.words) {
  const current = words.find(word => word.id === old.id);
  if (!current || JSON.stringify(current.sentenceIds) !== JSON.stringify(old.sentenceIds)) throw new Error(`Published advanced identifiers changed: ${old.id}`);
}
const summary = { totalWords: base.length + words.length, addedWords: words.length, addedContexts: sentences.length, cet6Tagged: words.filter(word => word.lexiconSource!.examTags!.includes('cet6')).length, toeflTagged: words.filter(word => word.lexiconSource!.examTags!.includes('toefl')).length, greTagged: words.filter(word => word.lexiconSource!.examTags!.includes('gre')).length, ieltsTagged: words.filter(word => word.lexiconSource!.ieltsTagged).length, generalRankAtMost10000: words.filter(word => rank(candidateMap.get(word.id)!) <= 10000).length, generalRankAtMost20000: words.length, reviewFiles };
if (!check) {
  await writeFile('data/advanced-vocabulary.json', JSON.stringify({ schemaVersion: 1, summary, words, sentences }, null, 2) + '\n');
  await writeFile('data/advanced-selection.json', JSON.stringify({ schemaVersion: 1, words: words.map(word => word.id) }, null, 2) + '\n');
  await writeFile('data/sources/advanced-contexts.json', JSON.stringify({ schemaVersion: 1, examples: sourceExamples }, null, 2) + '\n');
  const tags = await read<Record<string, string[]>>('data/vocabulary-tags.json');
  for (const word of words) tags[word.id] = word.lexiconSource!.examTags!;
  await writeFile('data/vocabulary-tags.json', JSON.stringify(tags, null, 2) + '\n');
  await writeFile('data/analysis/advanced-vocabulary-quality.json', JSON.stringify({ schemaVersion: 1, ...summary, selection: { examinationTags: ['cet6', 'toefl', 'gre'], excludedTags: ['zk', 'gk', 'cet4'], maximumGeneralRank: 20000, contextReview: 'Each approved headword has three individually selected source contexts, matched to its edited learning sense.' } }, null, 2) + '\n');
}
console.log(JSON.stringify({...summary,skipped}));
