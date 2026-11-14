/** Build a reproducible dictionary pool; source tags are never exam counts. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const registry = JSON.parse(await readFile(join(root, 'data/sources/lexicon.json'), 'utf8'));
const cacheFile = join(root, registry.file.cacheFile);
let bytes;
try { bytes = await readFile(cacheFile); }
catch {
  if (process.argv.includes('--offline')) throw new Error(`Missing dictionary cache: ${cacheFile}`);
  const response = await fetch(registry.file.url, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) throw new Error(`Dictionary download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(resolve(cacheFile, '..'), { recursive: true });
  await writeFile(cacheFile, bytes);
}
const blobHash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
if (bytes.length !== registry.file.bytes || blobHash !== registry.file.gitBlobSha1) {
  throw new Error(`Pinned ECDICT bytes do not match (${bytes.length} bytes, blob ${blobHash}).`);
}

// RFC 4180 quoting, including quoted commas/newlines and escaped double quotes.
export function* csvRows(text) {
  let field = '', row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(field); field = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(Boolean)) yield row;
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  if (field || row.length) { row.push(field); yield row; }
}

const plan = JSON.parse(await readFile(join(root, 'data/vocabulary-expansion-plan.json'), 'utf8'));
const curated = new Set(Object.values(plan.batches).flat());
for (const file of ['src/lib/corpus.ts', 'src/lib/corpus-extra.ts']) {
  const source = await readFile(join(root, file), 'utf8');
  for (const match of source.matchAll(/^  \['([^']+)',/gm)) curated.add(match[1]);
}
if (curated.size !== 300) throw new Error(`Expected 300 curated headwords, found ${curated.size}`);

const singleWord = /^[a-z]{3,24}$/;
const contentPos = new Map([['n', 'n.'], ['v', 'v.'], ['a', 'adj.'], ['s', 'adj.'], ['r', 'adv.']]);
// Neutral learning-pool exclusions; the original source cache remains unchanged.
const excludedHeads = new Set(['arse', 'asshole', 'bastard', 'bitch', 'bullshit', 'cock', 'cunt', 'damn', 'dick', 'fuck', 'fucking', 'nigger', 'nigga', 'piss', 'porn', 'pornography', 'shit', 'slut', 'whore', 'may', 'might', 'shall', 'should', 'would', 'could', 'must', 'will', 'can', 'ought', 'all', 'one', 'most', 'many', 'much', 'any', 'some', 'each', 'every', 'either', 'neither', 'whose', 'whom', 'what', 'which', 'that', 'this', 'these', 'those', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);
// Source inspection found missing ordinary senses or a misleading primary POS.
// Excluding these is preferable to inventing a match for a real example sentence.
const senseRiskExclusions = new Set(['phone', 'chance', 'pattern', 'chase', 'pick', 'wear', 'cover', 'hit', 'officer', 'single', 'primary', 'current', 'charge', 'record', 'project', 'object', 'present', 'minute', 'invalid', 'subject', 'lead', 'close', 'wind', 'tear', 'bow', 'row', 'bass', 'desert', 'refuse', 'content', 'principal', 'native', 'capital', 'bond', 'hardware', 'suspension', 'grind', 'fidelity', 'degrade', 'profit', 'patch', 'reserve', 'bracket', 'bathe', 'energy', 'mission', 'cream', 'tablet', 'bunk', 'pharmacy', 'pressure', 'short']);
const unsuitableSense = /\b(?:offensive|derogatory|slur|vulgar|obscene|profanity|fuck|fucking|nigger|nigga)\b/i;
const properSense = /\b(?:a surname|a male given name|a female given name|a family name|a given name|royal house|born (?:in )?\d{3,4}|reigned from|(?:American|United States|U\.?S\.?|English|British|French|German|Italian|Russian|Roman|Greek|Scottish|Irish|Welsh|Dutch|Swiss|Austrian|Canadian|Australian|Polish|Hungarian|Rhodesian) (?:poet|novelist|composer|physicist|chemist|politician|statesman|writer|king|emperor|general|actor|actress|filmmaker|dramatist)|capital (?:city )?of)\b|^a (?:city|town|county|port|state|province|river|mountain|region|kingdom|country) (?:in|of)|\b\d{3,4}\s*[-–]\s*\d{0,4}\b/i;
const numericRank = value => /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
const lines = text => text.replace(/\\n/g, '\n').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const exchanges = value => Object.fromEntries(value.split('/').filter(Boolean).map(part => {
  const colon = part.indexOf(':');
  return [part.slice(0, colon), part.slice(colon + 1)];
}));
const chinesePos = line => {
  if (/^n\.\s*/.test(line)) return 'n.';
  if (/^(?:v[ti]?|v\.[ti])\.\s*/.test(line)) return 'v.';
  if (/^(?:a|adj)\.\s*/.test(line)) return 'adj.';
  if (/^(?:adv|ad)\.\s*/.test(line)) return 'adv.';
  return null;
};
const sourceMajorityPos = value => {
  const weighted = value.split('/').map(part => /^([nvar]):([0-9.]+)$/.exec(part)).filter(Boolean);
  weighted.sort((a, b) => Number(b[2]) - Number(a[2]));
  return weighted[0] ? contentPos.get(weighted[0][1]) : null;
};
const rejections = {}, tagCounts = {}, records = [], curatedEvidence = {};
const reject = reason => { rejections[reason] = (rejections[reason] ?? 0) + 1; };
let rawCount = 0, rawIelts = 0, header;
for (const fields of csvRows(bytes.toString('utf8'))) {
  if (!header) { header = fields; continue; }
  rawCount++;
  if (fields.length !== header.length) throw new Error(`CSV row ${rawCount + 1} has ${fields.length} fields`);
  const source = Object.fromEntries(header.map((field, i) => [field, fields[i]]));
  const tags = source.tag.split(/\s+/).filter(Boolean);
  for (const tag of tags) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
  const ieltsTagged = tags.includes('ielts');
  if (ieltsTagged) rawIelts++;
  const word = source.word;
  const evidence = { word, bncRank: numericRank(source.bnc), contemporaryRank: numericRank(source.frq), ieltsTagged, tags, sourceId: registry.id };
  if (curated.has(word)) { curatedEvidence[word] = evidence; reject('curatedHeadword'); continue; }
  if (!singleWord.test(word)) { reject('notLowercaseSingleWord'); continue; }
  const exchange = exchanges(source.exchange);
  if (exchange['0'] && exchange['0'] !== word) { reject('inflectedHeadword'); continue; }
  if (excludedHeads.has(word)) { reject('explicitUnsuitableHeadword'); continue; }
  if (senseRiskExclusions.has(word)) { reject('reviewedSenseOrPronunciationRisk'); continue; }
  const definitions = lines(source.definition).map(line => {
    const match = /^([nvasr])\.\s*(.+)$/.exec(line);
    if (!match) return null;
    let meaning = match[2].replace(/;\s*$/, '');
    // Parenthetical examples and unit notes must not leak the answer. Keep the
    // actual definition when removing a target-containing aside is sufficient.
    meaning = meaning.replace(/\([^()]*\)/g, part => new RegExp(`\\b${word}\\b`, 'i').test(part) ? '' : part);
    const segments = meaning.split(';');
    if (segments.length > 1 && segments.slice(1).some(part => new RegExp(`\\b${word}\\b`, 'i').test(part))) meaning = segments[0];
    return { pos: contentPos.get(match[1]), text: meaning.replace(/\s+/g, ' ').trim() };
  }).filter(Boolean);
  if (!/[\u4e00-\u9fff]/.test(source.translation)) { reject('noChineseGloss'); continue; }
  if (!source.phonetic.trim()) { reject('noPronunciation'); continue; }
  const translationLines = lines(source.translation).filter(line => !/^\[(?:网络|医|化|计|法|经)\]/.test(line));
  const majorityPos = sourceMajorityPos(source.pos) ?? chinesePos(translationLines[0] ?? '');
  if (!majorityPos) { reject('noPrimaryContentPos'); continue; }
  const selfMention = new RegExp(`\\b${word}\\b`, 'i');
  const rawSenses = definitions.filter(definition => definition.pos === majorityPos && definition.text.length >= 6 && definition.text.length <= 230 && !unsuitableSense.test(definition.text) && !properSense.test(definition.text) && !selfMention.test(definition.text));
  const sense = rawSenses[0];
  if (!sense) { reject('noUsableEnglishSenseForPrimaryPos'); continue; }
  const desiredPos = sense.pos === 'n.' ? /^n\.\s*/ : sense.pos === 'v.' ? /^(?:v[ti]?|v\.[ti])\.\s*/ : sense.pos === 'adj.' ? /^(?:a|adj)\.\s*/ : /^(?:adv|ad)\.\s*/;
  let gloss = translationLines.find(line => desiredPos.test(line)) ?? '';
  gloss = gloss.replace(/^(?:n|v[ti]?|v\.[ti]|a|adj|adv|ad)\.\s*/, '').replace(/\s+/g, ' ').trim();
  // A later same-line proper-name note is not part of a common-word gloss.
  gloss = gloss.replace(/(?:[;；]\s*)?(?:n\.\s*)?\([^)]*\)\s*人名.*$/, '').trim();
  if (!/[\u4e00-\u9fff]/.test(gloss) || gloss.length > 160 || /(?:人名|姓氏|男子名|女子名|王朝|粗俗|蔑称|骂人|侮辱性)/.test(gloss)) { reject('unsuitableChineseGloss'); continue; }
  const formKeys = sense.pos === 'n.' ? ['s'] : sense.pos === 'v.' ? ['p', 'd', 'i', '3'] : ['r', 't'];
  const forms = [...new Set(formKeys.flatMap(key => (exchange[key] ?? '').split(/[,;]/)).filter(form => singleWord.test(form) && form !== word))];
  const phonetic = '/' + source.phonetic.trim().replace(/^\[|\]$/g, '').replace(/'/g, 'ˈ').replace(/:/g, 'ː').replace(/ә/g, 'ə').replace(/є/g, 'e').replace(/əu/g, 'əʊ').replace(/ei/g, 'eɪ').replace(/ai/g, 'aɪ').replace(/au/g, 'aʊ').replace(/(?:oi|ɒi)/g, 'ɔɪ') + '/';
  records.push({ word, forms, pos: sense.pos, definitionEN: sense.text, definitionCN: gloss, phonetic, rawSenses, posBasis: sourceMajorityPos(source.pos) ? 'sourceCorpusDistribution' : 'firstChineseGlossPos', ...evidence });
}

const rankOf = row => Math.min(row.bncRank ?? Infinity, row.contemporaryRank ?? Infinity);
const rank20k = row => rankOf(row) <= 20_000;
// Final selection follows independently verified genuine-sentence coverage.
const candidates = records.filter(row => rankOf(row) >= 500 && (row.ieltsTagged || rank20k(row)));
candidates.sort((a, b) => Number(b.ieltsTagged) - Number(a.ieltsTagged) || rankOf(a) - rankOf(b) || a.word.localeCompare(b.word, 'en'));
const profile = {
  sourceId: registry.id, commit: registry.commit, bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'), gitBlobSha1: blobHash,
  rawCount, rawIelts, tagCounts, excludedCuratedCount: curated.size, curatedFound: Object.keys(curatedEvidence).length,
  curatedIelts: Object.values(curatedEvidence).filter(row => row.ieltsTagged).length,
  curatedGeneralRank20k: Object.values(curatedEvidence).filter(row => Math.min(row.bncRank ?? Infinity, row.contemporaryRank ?? Infinity) <= 20_000).length,
  curatedMissing: [...curated].filter(word => !curatedEvidence[word]), rejections,
  eligibleDictionaryRows: records.length, candidateCount: candidates.length,
  candidateIeltsCount: candidates.filter(row => row.ieltsTagged).length,
  candidateIeltsWithGeneralRank20k: candidates.filter(row => row.ieltsTagged && rank20k(row)).length,
  candidateGeneralRank20k: candidates.filter(rank20k).length,
  candidateUnranked: candidates.filter(row => !row.bncRank && !row.contemporaryRank).length,
  candidatePosBasis: Object.fromEntries(['sourceCorpusDistribution', 'firstChineseGlossPos'].map(basis => [basis, candidates.filter(row => row.posBasis === basis).length])),
  minimumCandidateGeneralRank: 500,
  reviewedSenseOrPronunciationExclusions: [...senseRiskExclusions],
  definitionRule: 'Source majority corpus POS where present, otherwise first Chinese gloss POS; first usable same-POS English sense with biography/profanity/self-headword filtering. Explicit forms restricted to selected POS. rawSenses retain usable same-POS alternatives for context review.',
  claimLimit: 'Independent dictionary IELTS tags and general corpus ranks are selection aids, not measured recent IELTS examination frequency.'
};
await writeFile(join(root, 'data/lexicon-candidates.json'), JSON.stringify(candidates, null, 2) + '\n');
await writeFile(join(root, 'data/lexicon-curated-evidence.json'), JSON.stringify(curatedEvidence, null, 2) + '\n');
await mkdir(join(root, 'data/analysis'), { recursive: true });
await writeFile(join(root, 'data/analysis/lexicon-dictionary-profile.json'), JSON.stringify(profile, null, 2) + '\n');
console.log(JSON.stringify(profile, null, 2));
