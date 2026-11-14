import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { inflateRawSync } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';

const root = process.cwd();
const cache = resolve(root, '.npm-cache/sentences');
const options = new Set(process.argv.slice(2));
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const candidatePath = resolve(root, arg('--candidates', 'data/lexicon-candidates.json'));
const outputPath = resolve(root, arg('--output', 'data/sources/tatoeba-sentences.json'));
const minimumLength = Number(arg('--minimum-length', '8'));
const maximumLength = 32;
const minimumExamples = 3;
const poolLimit = 48;
const license = 'CC-BY-2.0-FR';
const licenseUrl = 'https://creativecommons.org/licenses/by/2.0/fr/';
const sourceFiles = [
  { id: 'tatoeba-english-weekly', filename: 'eng_sentences_detailed.tsv.bz2', url: 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2' },
  { id: 'tatoeba-english-user-languages', filename: 'eng_user_languages.tsv.bz2', url: 'https://downloads.tatoeba.org/exports/per_language/eng/eng_user_languages.tsv.bz2' },
  { id: 'manythings-mandarin-english', filename: 'cmn-eng.zip', url: 'https://www.manythings.org/anki/cmn-eng.zip' },
];

await mkdir(cache, { recursive: true });
for (const source of sourceFiles) {
  const path = resolve(cache, source.filename);
  try { if ((await stat(path)).size > 0) continue; } catch { /* Download on a fresh checkout. */ }
  console.log(`Downloading ${source.url}`);
  const response = await fetch(source.url);
  if (!response.ok || !response.body) throw new Error(`Download failed: ${response.status} ${source.url}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
}

let unbzip2;
let tagger;
try {
  const require = createRequire(resolve(cache, 'tools/package.json'));
  unbzip2 = require('unbzip2-stream');
  tagger = require('wink-pos-tagger')();
} catch {
  throw new Error('Install isolated build helpers: npm install --prefix .npm-cache/sentences/tools --no-audit --no-fund --ignore-scripts unbzip2-stream@1.4.3 wink-pos-tagger@2.2.2');
}

// Read the central directory rather than trusting entry names or extracting files.
// Only the two expected UTF-8 text entries are used; raw archives stay in cache.
function readZip(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP central directory not found');
  const entries = new Map();
  let offset = buffer.readUInt32LE(eocd + 16);
  const count = buffer.readUInt16LE(eocd + 10);
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP directory entry');
    const method = buffer.readUInt16LE(offset + 10);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (name === 'cmn.txt' || name === '_about.txt') {
      const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      const compressed = buffer.subarray(start, start + size);
      if (method !== 0 && method !== 8) throw new Error(`Unsupported ZIP compression ${method}`);
      entries.set(name, (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8'));
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function* bzipLines(filename) {
  const input = createReadStream(resolve(cache, filename)).pipe(unbzip2());
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) yield line;
}

const tokenize = text => Array.from(text.matchAll(/[A-Za-z]+(?:[’'-][A-Za-z]+)*/g), match => ({
  text: match[0], lower: match[0].toLowerCase().replaceAll('’', "'"), start: match.index, end: match.index + match[0].length,
}));
const normalise = text => text.toLowerCase().replaceAll('’', "'").replace(/[^a-z0-9']+/g, ' ').trim();
const namedPeople = /\b(?:Tom|Mary|John|Alice|Bob|Maria|Jack|Jane|Bill|Mike|David|Peter|Susan|Ann|Anna|Ken|Nancy|Betty|George|James|Paul|Helen|Linda|Michael|Robert|Richard|Mr|Mrs|Ms|Miss|Dr|Professor|Father|Mother|Jesus|God|Buddha|Allah|Satan)\b/;
const allowedCapitals = new Set(['I', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Internet']);
const unsuitable = /\b(?:kill(?:ed|ing|s)?|murder(?:ed|er|ers|ing|s)?|assassin\w*|rap(?:e|ed|ist|ists)|suicid\w*|sex(?:ual\w*|y)?|porn\w*|naked|nud(?:e|ity)|prostitut\w*|molest\w*|tortur\w*|terroris\w*|bomb(?:s|ed|ing)?|gun(?:s|shot|shots)?|rifle\w*|pistol\w*|shoot(?:s|ing)?|shot|stab\w*|war(?:s|fare)?|battle\w*|corpse\w*|coffin\w*|execut(?:e|ed|ion)|hostage\w*|slav(?:e|es|ery)|racis\w*|nazi\w*|holocaust|genocide|abuse\w*|bully\w*|bullying|stupid|idiot\w*|dumb|ugly|fatso|moron\w*|retard\w*|bastard\w*|damn\w*|hell|shit\w*|fuck\w*|bitch\w*|asshole\w*|crap|piss\w*|drunk\w*|cocaine|heroin|meth|cannabis|marijuana|opium|orgasm\w*|penis|vagina|breast\w*|erect\w*|fetish\w*|incest|pedo\w*|paedo\w*|homophob\w*|xenophob\w*|lesbian\w*|homosexual\w*|transgender\w*|bisexual\w*|blowjob\w*|hentai|harem|witchcraft|devil\w*)\b/i;
const metalinguistic = /\b(?:the word|this word|that word|a word meaning|words? (?:mean|means|spelled|spelt)|sentence (?:means|is grammatical|is ungrammatical)|pronounc\w*|spelling of|past tense of|plural of|singular of)\b/i;
const unsafeAdvice = /\b(?:you|everyone|people) (?:should|must|need to|have to)\b.*\b(?:pills?|medicin\w*|dos(?:e|age)|drugs?|vaccin\w*)\b/i;
const literaryOrHostile = /\b(?:dead|death|die|died|dying|punish\w*|wicked|evil|witch\w*|sorcer\w*|fascis\w*|feckless|hate\w*|antigravity|pseudoscience|bladder|bleed\w*|nymph\w*|erotic\w*|pervert\w*|thou|thee|thy|thine|hath|doth|whosoever|wherefore|nay|alas|unto|behold|whereupon|dost|hast|batoon|shrouds)\b|\b(?:you|we|he|she|they|it) be (?:my|the|a)\b|\bhydrogen\b.*\bchocolate\b|\bchocolate\b.*\bhydrogen\b/i;

function quality(text, tokens) {
  if (tokens.length < minimumLength || tokens.length > maximumLength) return false;
  if (text.length > 280 || !/^[A-Z]/.test(text) || !/[.!?]["”']?$/.test(text)) return false;
  if (/[\t\r\n/]|https?:|www\.|@|[<>\[\]{}]|_{2}|\.{3}/.test(text)) return false;
  if (namedPeople.test(text) || unsuitable.test(text) || metalinguistic.test(text) || unsafeAdvice.test(text) || literaryOrHostile.test(text)) return false;
  // Keep complete source sentences, but avoid selecting isolated name substitutions.
  if (tokens.some((token, i) => i > 0 && /^[A-Z]/.test(token.text) && !allowedCapitals.has(token.text))) return false;
  if (tokens.some(token => /[A-Za-z][A-Z]/.test(token.text))) return false;
  return true;
}

const diversityStopWords = new Set('i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours ourselves they them their theirs themselves one ones a an the this that these those to of in on at for from by with as is are be been being was were am do does did have has had having will would can could may might must should need needs ought shall and or but if then so than there here not no any some all each every very more most much many little such other only just also even still already yet really want wants wanted like likes liked put make makes made get gets got take takes taken something someone people person things thing <target>'.split(' '));
function tokenSimilarity(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;
  for (const token of leftSet) if (rightSet.has(token)) intersection++;
  const union = leftSet.size + rightSet.size - intersection;
  if (intersection / Math.max(1, union) >= 0.67) return true;
  const leftContent = new Set(left.filter(token => !diversityStopWords.has(token)).map(stem));
  const rightContent = new Set(right.filter(token => !diversityStopWords.has(token)).map(stem));
  let sharedContent = 0;
  for (const token of leftContent) if (rightContent.has(token)) sharedContent++;
  const contentUnion = leftContent.size + rightContent.size - sharedContent;
  if (sharedContent >= 2 && sharedContent / Math.max(1, contentUnion) >= 0.6) return true;
  // Token edit distance rejects the same sentence with a few substituted words.
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const old = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length) >= 0.7;
}

const candidateBytes = await readFile(candidatePath);
const candidatesRaw = JSON.parse(candidateBytes.toString('utf8'));
let candidates = Array.isArray(candidatesRaw) ? candidatesRaw : candidatesRaw.candidates;
if (!Array.isArray(candidates) || candidates.length < 1700) throw new Error('Expected a candidate pool with at least 1,700 entries');
const selectedPath = arg('--selected-words', '');
if (selectedPath) {
  const selected = JSON.parse(await readFile(resolve(root, selectedPath), 'utf8'));
  const selectedRows = Array.isArray(selected) ? selected : selected.words || selected.entries;
  if (!Array.isArray(selectedRows)) throw new Error('Selected words must be an array of strings or objects with word fields');
  const words = new Set(selectedRows.map(row => typeof row === 'string' ? row : row.word));
  candidates = candidates.filter(candidate => words.has(candidate.word));
  if (candidates.length !== words.size) throw new Error('Some selected words do not occur in the candidate dictionary');
}
const candidatesByWord = new Map(candidates.map(candidate => [candidate.word.toLowerCase(), candidate]));
const definitionStopWords = new Set('a an the to of in on at for from by with or and as is are be being that which who one someone something person people thing things any other not having make made used use act state quality manner very more most part relating characteristic relating result involving action process usually especially through into without such'.split(' '));
const stem = word => word.toLowerCase().replace(/(?:ing|ed|es|s)$/, '');
const definitionWords = new Map(candidates.map(candidate => [candidate.word, new Set(tokenize(candidate.definitionEN || '').map(token => token.lower).filter(word => word.length > 3 && !definitionStopWords.has(word) && word !== candidate.word).map(stem))]));
const formsByWord = new Map();
const formIndex = new Map();
for (const candidate of candidates) {
  const forms = new Set([candidate.word, ...(Array.isArray(candidate.forms) ? candidate.forms : String(candidate.forms || '').split(','))].map(form => form.toLowerCase()).filter(form => /^[a-z]+(?:['-][a-z]+)*$/.test(form)));
  formsByWord.set(candidate.word, forms);
  for (const form of forms) {
    if (!formIndex.has(form)) formIndex.set(form, []);
    formIndex.get(form).push(candidate.word);
  }
}

const archive = readZip(await readFile(resolve(cache, 'cmn-eng.zip')));
if (!archive.has('cmn.txt')) throw new Error('ManyThings cmn.txt missing');
const bilingual = new Map();
const checkedAuthors = new Set();
let bilingualPairs = 0;
for (const line of archive.get('cmn.txt').split(/\r?\n/)) {
  const [text, translation, attribution] = line.split('\t');
  if (!text || !translation || !attribution) continue;
  bilingualPairs++;
  const ids = [...attribution.matchAll(/#(\d+) \(([^)]+)\)/g)];
  if (ids.length !== 2) continue;
  const [english, chinese] = ids;
  checkedAuthors.add(english[2]);
  if (!bilingual.has(english[1])) bilingual.set(english[1], {
    text, translation, attribution, author: english[2], sentenceId: english[1],
    translationSource: { sentenceId: chinese[1], author: chinese[2], url: `https://tatoeba.org/en/sentences/show/${chinese[1]}`, license, attribution },
  });
}

const nativeAuthors = new Set();
for await (const line of bzipLines('eng_user_languages.tsv.bz2')) {
  const [language, level, author] = line.split('\t');
  if (language === 'eng' && level === '5' && author && author !== '\\N') nativeAuthors.add(author);
}
for (const author of checkedAuthors) nativeAuthors.add(author);

const pools = new Map(candidates.map(candidate => [candidate.word, []]));
const bilingualOnlyPools = new Map(candidates.map(candidate => [candidate.word, []]));
const counters = { corpusRows: 0, nativeAuthorRows: 0, qualityRows: 0, bilingualPairs, eligibleBilingualRows: 0, matchedRows: 0 };

function consider(row, bilingualOnly = false, suppliedTokens) {
  const tokens = suppliedTokens || tokenize(row.text);
  if (!quality(row.text, tokens)) return;
  const matches = new Map();
  for (const token of tokens) {
    const lemmas = formIndex.get(token.lower);
    if (!lemmas) continue;
    for (const word of lemmas) {
      if (!matches.has(word)) matches.set(word, []);
      matches.get(word).push(token);
    }
  }
  const targetPools = bilingualOnly ? bilingualOnlyPools : pools;
  if (!bilingualOnly && matches.size) counters.matchedRows++;
  for (const [word, targets] of matches) {
    if (targets.length !== 1) continue;
    const target = targets[0];
    const normal = normalise(row.text);
    const skeleton = tokens.map(token => formsByWord.get(word).has(token.lower) ? '<target>' : token.lower);
    const semanticOverlap = tokens.filter(token => token !== target && definitionWords.get(word).has(stem(token.lower))).length;
    const score = (row.translation ? 16 : 0) + (target.lower === word ? 12 : 0) + Math.min(tokens.length, 16) - Math.max(0, tokens.length - 22) + (checkedAuthors.has(row.author) ? 8 : 0) + Math.min(semanticOverlap, 3) * 7;
    const pool = targetPools.get(word);
    if (pool.some(item => item.normal === normal || item.skeleton.join(' ') === skeleton.join(' '))) continue;
    if (pool.length >= poolLimit && pool[pool.length - 1].score > score) continue;
    const example = {
      id: `tatoeba-eng-${row.sentenceId}`, text: row.text, translation: row.translation || '', register: 'Example',
      targetForm: target.text, targetSpan: [target.start, target.end],
      sourceId: row.translation ? 'manythings-mandarin-english' : 'tatoeba-english-weekly',
      sourceSentenceId: row.sentenceId, sourceUrl: `https://tatoeba.org/en/sentences/show/${row.sentenceId}`,
      author: row.author, license, attribution: row.attribution || `Tatoeba sentence #${row.sentenceId} by ${row.author}; ${license} (${licenseUrl})`,
      ...(row.translationSource ? { translationSource: row.translationSource } : {}),
    };
    pool.push({ score, normal, skeleton, example });
    pool.sort((a, b) => b.score - a.score || Number(a.example.sourceSentenceId) - Number(b.example.sourceSentenceId));
    if (pool.length > poolLimit) pool.length = poolLimit;
  }
}

const posCache = new Map();
function matchesPartOfSpeech(item, word) {
  const candidate = candidatesByWord.get(word);
  if (!candidate || !formsByWord.get(word).has(item.example.targetForm.toLowerCase())) return false;
  let tags = posCache.get(item.example.id);
  if (!tags) {
    tags = tagger.tagSentence(item.example.text);
    posCache.set(item.example.id, tags);
  }
  if (tags.some(tag => /^NNP/.test(tag.pos) && !allowedCapitals.has(tag.value))) return false;
  const targetIndex = tags.findIndex(tag => tag.value.toLowerCase() === item.example.targetForm.toLowerCase());
  const target = tags[targetIndex];
  if (!target) return false;
  const expected = candidate.pos;
  const previous = tags[targetIndex - 1];
  const next = tags[targetIndex + 1];
  if (expected === 'n.') {
    if (!/^(NN|NNS)$/.test(target.pos)) return false;
    // A tagger can mislabel an unfamiliar verb as a noun. Require a plausible
    // noun phrase and discard attributive uses that commonly conceal adjectives.
    if (next && /^(?:NN|NNS|NNP|NNPS|JJ|JJR|JJS|DT|PRP\$)$/.test(next.pos)) return false;
    if (previous && /^(?:PRP|MD|TO|RB|RBR|RBS)$/.test(previous.pos)) return false;
    if (previous && /^(?:be|am|is|are|was|were|been|being|do|does|did|will|would|could|can|must|should|may|might|not)$/.test(previous.normal)) return false;
    if (targetIndex === 0 && (!next || !/^VB/.test(next.pos))) return false;
    if (previous?.pos === 'CC' && !/^(?:NN|NNS)$/.test(tags[targetIndex - 2]?.pos || '')) return false;
    return true;
  }
  if (expected === 'v.') return /^VB/.test(target.pos);
  if (expected === 'adj.') {
    if (!/^JJ/.test(target.pos)) return false;
    const attributive = next && /^(?:NN|NNS|JJ|JJR|JJS)$/.test(next.pos);
    const predicative = tags.slice(Math.max(0, targetIndex - 4), targetIndex).some(tag => /^(?:be|am|is|are|was|were|been|being|seem|seems|seemed|feel|feels|felt|look|looks|looked|sound|sounds|sounded|become|becomes|became|remain|remains|remained|stay|stays|stayed|appear|appears|appeared)$/.test(tag.normal));
    return attributive || predicative;
  }
  if (expected === 'adv.') return /^RB/.test(target.pos);
  return false;
}

function select(pool, word) {
  const selected = [];
  for (const item of pool) {
    if (!matchesPartOfSpeech(item, word)) continue;
    if (selected.some(existing => tokenSimilarity(existing.skeleton, item.skeleton))) continue;
    selected.push(item);
    if (selected.length === minimumExamples) break;
  }
  return selected;
}

for (const row of bilingual.values()) {
  if (!quality(row.text, tokenize(row.text))) continue;
  counters.eligibleBilingualRows++;
  consider(row, true);
  consider(row);
}
const bilingualCoverage = [...bilingualOnlyPools.entries()].filter(([word, pool]) => select(pool, word).length === minimumExamples).length;
console.log(`Mandarin pair profile: ${bilingualPairs} pairs; ${counters.eligibleBilingualRows} eligible 8–32-word sentences; ${bilingualCoverage}/${candidates.length} words have three diverse bilingual contexts.`);
if (options.has('--reuse-pools')) {
  const retained = JSON.parse(await readFile(resolve(cache, 'retained-pools.json'), 'utf8'));
  for (const candidate of candidates) {
    const pool = pools.get(candidate.word);
    for (const example of retained[candidate.word] || []) {
      const tokens = tokenize(example.text);
      const targets = tokens.filter(token => formsByWord.get(candidate.word).has(token.lower));
      if (targets.length !== 1 || !quality(example.text, tokens)) continue;
      const target = targets[0];
      const semanticOverlap = tokens.filter(token => token !== target && definitionWords.get(candidate.word).has(stem(token.lower))).length;
      const score = (example.translation ? 16 : 0) + (target.lower === candidate.word ? 12 : 0) + Math.min(tokens.length, 16) - Math.max(0, tokens.length - 22) + (checkedAuthors.has(example.author) ? 8 : 0) + Math.min(semanticOverlap, 3) * 7;
      const { selectionScore, partOfSpeechMatch, ...original } = example;
      pool.push({ score, normal: normalise(example.text), skeleton: tokens.map(token => formsByWord.get(candidate.word).has(token.lower) ? '<target>' : token.lower), example: { ...original, targetForm: target.text, targetSpan: [target.start, target.end] } });
    }
    pool.sort((a, b) => b.score - a.score || Number(a.example.sourceSentenceId) - Number(b.example.sourceSentenceId));
  }
} else if (!options.has('--bilingual-only')) {
  for await (const line of bzipLines('eng_sentences_detailed.tsv.bz2')) {
    counters.corpusRows++;
    const [sentenceId, language, text, author] = line.split('\t');
    if (language !== 'eng' || !nativeAuthors.has(author)) continue;
    counters.nativeAuthorRows++;
    const tokens = text ? tokenize(text) : [];
    if (!text || !quality(text, tokens)) continue;
    counters.qualityRows++;
    const paired = bilingual.get(sentenceId);
    const row = paired?.text === text ? paired : { sentenceId, text, author };
    consider(row, false, tokens);
    if (counters.corpusRows % 200000 === 0) console.log(`Scanned ${counters.corpusRows} English rows.`);
  }
}

const examples = {};
const missing = [];
for (const candidate of candidates) {
  const selected = select(pools.get(candidate.word), candidate.word);
  if (selected.length === minimumExamples) examples[candidate.word] = selected.map(item => item.example);
  else missing.push({ word: candidate.word, available: selected.length, ieltsTagged: candidate.ieltsTagged });
}
const flatExamples = Object.values(examples).flat();
const wordCounts = flatExamples.map(example => tokenize(example.text).length);
const selection = {
  candidates: candidates.length, qualifyingWords: Object.keys(examples).length,
  ieltsTaggedQualifyingWords: Object.keys(examples).filter(word => candidatesByWord.get(word)?.ieltsTagged).length,
  examples: flatExamples.length, bilingualExamples: flatExamples.filter(example => example.translation).length,
  wordsWithThreeBilingualExamples: Object.values(examples).filter(rows => rows.every(row => row.translation)).length,
  bilingualOnlyCoverage: bilingualCoverage, minimumWords: Math.min(...wordCounts), maximumWords: Math.max(...wordCounts),
  requiredExamplesPerWord: minimumExamples, nearDuplicateFilter: 'token Jaccard >=0.67, content-token Jaccard >=0.60 with at least 2 shared content words, or ordered-token edit similarity >=0.70',
  authorPolicy: 'Self-reported native English (level 5) or represented in ManyThings checked English pairs; not an independent guarantee of correctness.',
  partOfSpeechPolicy: 'Target POS matched with wink-pos-tagger 2.2.2 plus noun/adjective phrase checks. Proper-noun tags excluded. These automated checks do not establish the intended dictionary sense.',
  candidateSha256: createHash('sha256').update(candidateBytes).digest('hex'),
  reusedRetainedPools: options.has('--reuse-pools'),
  ...counters,
};
await mkdir(resolve(root, 'data/sources'), { recursive: true });
await writeFile(outputPath, JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), sources: sourceFiles.map(source => source.id), selection, examples }, null, 2) + '\n');
await writeFile(resolve(cache, 'coverage.json'), JSON.stringify({ selection, missing }, null, 2) + '\n');
if (!options.has('--bilingual-only') && !options.has('--reuse-pools')) {
  await writeFile(resolve(cache, 'retained-pools.json'), JSON.stringify(Object.fromEntries([...pools.entries()].map(([word, pool]) => [word, pool.slice(0, 30).map(item => ({ ...item.example, selectionScore: item.score, partOfSpeechMatch: matchesPartOfSpeech(item, word) }))]))) + '\n');
}

const registry = [];
for (const source of sourceFiles) {
  const bytes = await readFile(resolve(cache, source.filename));
  registry.push({ ...source, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), license, licenseUrl });
}
await writeFile(resolve(root, 'data/sources/sentence-source-registry.json'), JSON.stringify({
  schemaVersion: 1, retrievedAt: new Date().toISOString(), sources: registry,
  provenance: { tatoebaDocumentation: 'https://tatoeba.org/en/downloads', manythingsDocumentation: 'https://www.manythings.org/anki/',
    attribution: 'Tatoeba contributors; Mandarin pairs distributed by Charles Kelly at ManyThings.org. Each selected sentence retains its owner, ID, source URL, and license. Mandarin translations retain their separate owner and sentence ID.',
    modifications: 'Selected complete sentences without changing their text. No machine-generated translations. Registers are neutral Example; no claim that these are IELTS exam extracts or academic genres.',
  },
  upstreamNotice: archive.get('_about.txt') || '',
}, null, 2) + '\n');
console.log(JSON.stringify(selection, null, 2));
console.log(`Wrote ${outputPath}`);
if (Object.keys(examples).length < 1700 && !options.has('--bilingual-only')) process.exitCode = 1;
