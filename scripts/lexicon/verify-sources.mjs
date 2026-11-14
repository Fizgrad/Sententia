/** Independently reconcile every redistributed community example with raw exports. */
import { readFile,writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import assert from 'node:assert/strict';

const read=async path=>JSON.parse(await readFile(path,'utf8'));
const pack=await read('data/lexicon-import.json');
const advanced=await read('data/advanced-vocabulary.json');
pack.sentences.push(...advanced.sentences);
assert.ok(pack.words.length>=1700,'Assemble at least 1700 reviewed additions first.');
const registry=await read('data/sources/sentence-source-registry.json');
const sourceHashes=[];
for(const source of registry.sources){
  const bytes=await readFile(`.npm-cache/sentences/${source.filename}`);
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,source.sha256,`${source.filename}: source bytes changed`);
  sourceHashes.push({filename:source.filename,sha256:hash});
}
const selected=await read('data/sources/selected-contexts.json');
const advancedSelected=await read('data/sources/advanced-contexts.json');
Object.assign(selected.examples,advancedSelected.examples);
const refs=Object.values(selected.examples).flat();
const needed=new Map();
for(const row of refs){
  const previous=needed.get(row.sourceSentenceId);
  if(previous)assert.equal(row.text,previous.text,`Conflicting source ID ${row.sourceSentenceId}`);
  needed.set(row.sourceSentenceId,row);
}
function archiveText(bytes,name){
  let end=bytes.length-22;
  while(end>=0&&bytes.readUInt32LE(end)!==0x06054b50)end--;
  assert.ok(end>=0,'ZIP index missing');
  let offset=bytes.readUInt32LE(end+16);
  for(let index=0;index<bytes.readUInt16LE(end+10);index++){
    assert.equal(bytes.readUInt32LE(offset),0x02014b50);
    const nameLength=bytes.readUInt16LE(offset+28),extraLength=bytes.readUInt16LE(offset+30),commentLength=bytes.readUInt16LE(offset+32);
    const filename=bytes.subarray(offset+46,offset+46+nameLength).toString('utf8');
    if(filename===name){
      const local=bytes.readUInt32LE(offset+42),method=bytes.readUInt16LE(offset+10),size=bytes.readUInt32LE(offset+20);
      const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
      const compressed=bytes.subarray(start,start+size);
      assert.ok(method===0||method===8,'Unexpected ZIP compression');
      return (method===8?inflateRawSync(compressed):compressed).toString('utf8');
    }
    offset+=46+nameLength+extraLength+commentLength;
  }
  throw new Error(`ZIP entry missing: ${name}`);
}
const bilingual=new Map();
for(const line of archiveText(await readFile('.npm-cache/sentences/cmn-eng.zip'),'cmn.txt').split(/\r?\n/)){
  const [text,translation,attribution]=line.split('\t');
  if(!attribution)continue;
  const ids=[...attribution.matchAll(/#(\d+) \(([^)]+)\)/g)];
  if(ids.length===2)bilingual.set(`${ids[0][1]}:${ids[1][1]}`,{text,translation,author:ids[0][2],translationAuthor:ids[1][2],attribution});
}
const matched=new Set();let bilingualReferences=0;
for(const row of refs.filter(row=>row.translationSource)){
  const pair=bilingual.get(`${row.sourceSentenceId}:${row.translationSource.sentenceId}`);
  assert.ok(pair,`Unverified bilingual pair ${row.id}`);
  for(const field of ['text','translation','author','attribution'])assert.equal(row[field],pair[field],`${row.id}: changed ${field}`);
  assert.equal(row.translationSource.author,pair.translationAuthor);
  matched.add(row.sourceSentenceId);bilingualReferences++;
}
const require=createRequire(resolve('.npm-cache/sentences/tools/package.json'));
const unpack=require('unbzip2-stream');
const stream=createReadStream('.npm-cache/sentences/eng_sentences_detailed.tsv.bz2').pipe(unpack());
const lines=createInterface({input:stream,crlfDelay:Infinity});
let scanned=0;
for await(const line of lines){
  scanned++;
  const [id,language,text,author]=line.split('\t');
  const row=needed.get(id);
  if(!row||row.translationSource)continue;
  assert.equal(language,'eng');assert.equal(row.text,text,`${id}: text differs from raw export`);assert.equal(row.author,author,`${id}: author differs`);
  matched.add(id);
}
assert.equal(matched.size,needed.size,'Some source IDs did not reconcile');
for(const sentence of pack.sentences.filter(row=>row.source)){
  const rows=selected.examples[sentence.wordId]??[];
  const row=rows.find(row=>row.sourceSentenceId===sentence.source.sentenceId);
  assert.ok(row,`${sentence.id}: no selected source record`);
  assert.equal(sentence.text,row.text);assert.equal(sentence.translation,row.translation);
  assert.equal(sentence.source.author,row.author);assert.equal(sentence.source.sourceUrl,row.sourceUrl);
  assert.equal(sentence.source.license,row.license);assert.equal(sentence.source.attribution,row.attribution);
}
const report={schemaVersion:1,checkedAt:new Date().toISOString(),result:'All redistributed community texts, authors and bilingual pairs reconcile with hash-locked raw exports.',referencesChecked:refs.length,uniqueEnglishSentences:matched.size,bilingualReferencesChecked:bilingualReferences,rawEnglishRowsScanned:scanned,sourceHashes};
await writeFile('data/analysis/sentence-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
