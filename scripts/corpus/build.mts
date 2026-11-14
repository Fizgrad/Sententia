/**
 * Reproduce official-sample vocabulary counts without distributing source passages.
 * Run: node node_modules/tsx/dist/cli.mjs scripts/corpus/build.mts
 * Flags: --offline (cached PDFs only), --update-lock (accept changed source bytes).
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { words } from '../../src/lib/corpus';
import { cleanContent, countForms, deduplicateChunks, priorityScore, sha256, tokens } from './method';

interface Section {pages:number[];skipLines:number;stopBefore?:string}
interface Unit {id:string;title:string;register:'Reading'|'Listening';sections:Section[];note?:string}
interface Source {id:string;title:string;publisher:string;url:string;cacheFile:string;documentYear:number|null;yearEvidence:string|null;yearBasis?:string;examYear:null;kind:string;units:Unit[]}
interface SourceLock {schemaVersion:1;sources:Record<string,{url:string;sha256:string;accessedAt:string}>}
interface ContentUnit {id:string;sourceId:string;title:string;register:'Reading'|'Listening';pages:number[];text:string;tokenCount:number;sha256:string}

const root=resolve(import.meta.dirname,'../..');
const cache=join(root,'.npm-cache/ielts-corpus');
const extractor=join(root,'.npm-cache/corpus-extractor');
const registryPath=join(root,'data/sources/ielts-official-public.json');
const lockPath=join(root,'data/sources/ielts-source-lock.json');
const offline=process.argv.includes('--offline');
const updateLock=process.argv.includes('--update-lock');
const registry=JSON.parse(await readFile(registryPath,'utf8')) as {sources:Source[];description:string;discoveryPages:string[]};
const generatedAt=new Date().toISOString();
await Promise.all([mkdir(cache,{recursive:true}),mkdir(extractor,{recursive:true}),mkdir(join(root,'data/analysis'),{recursive:true})]);
let lock:SourceLock;
try{lock=JSON.parse(await readFile(lockPath,'utf8'));}catch{lock={schemaVersion:1,sources:{}};}

async function fetchBytes(url:string):Promise<Uint8Array>{
  const response=await fetch(url,{signal:AbortSignal.timeout(60_000)});
  if(!response.ok)throw new Error(`Download failed (${response.status}): ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

// Isolated tooling keeps the application bundle and runtime dependencies unchanged.
const extractorVersion='4.2.67';
for(const file of ['pdf.mjs','pdf.worker.mjs']){
  const dest=join(extractor,file);
  try{await access(dest);}catch{
    if(offline)throw new Error(`Offline extractor missing: ${dest}`);
    await writeFile(dest,await fetchBytes(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${extractorVersion}/legacy/build/${file}`));
  }
}
const {getDocument,version}=await import(pathToFileURL(join(extractor,'pdf.mjs')).href);
if(version!==extractorVersion)throw new Error(`Expected pdfjs-dist ${extractorVersion}, found ${version}. Recreate the isolated extractor cache.`);

await Promise.all(registry.sources.map(async source=>{
  if(new URL(source.url).hostname!=='ielts.org'||!/^[a-z0-9-]+\.pdf$/.test(source.cacheFile))throw new Error(`Unapproved source: ${source.id}`);
  const file=join(cache,source.cacheFile);
  let bytes:Uint8Array;
  try{bytes=await readFile(file);}catch{
    if(offline)throw new Error(`Offline source missing: ${source.id}`);
    bytes=await fetchBytes(source.url);await writeFile(file,bytes);
  }
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error(`Not a PDF: ${source.id}`);
  const hash=sha256(bytes);
  if(lock.sources[source.id]?.sha256 && (lock.sources[source.id].sha256!==hash||lock.sources[source.id].url!==source.url) && !updateLock)throw new Error(`Source changed: ${source.id}. Inspect before --update-lock.`);
  lock.sources[source.id]={url:source.url,sha256:hash,accessedAt:lock.sources[source.id]?.sha256===hash?lock.sources[source.id].accessedAt:generatedAt};
}));

const documents:ContentUnit[]=[];
const sourceOutput=[];
const discardedDuplicates:{id:string;duplicateOf:string}[]=[];
let removedExtracts=0;
for(const source of registry.sources){
  const pdf=await getDocument({data:new Uint8Array(await readFile(join(cache,source.cacheFile))),useSystemFonts:true,isEvalSupported:false,verbosity:0}).promise;
  const pages:string[]=[];
  for(let i=1;i<=pdf.numPages;i++){
    const content=await(await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map((item:{str?:string;hasEOL?:boolean})=>(item.str??'')+(item.hasEOL?'\n':' ')).join(''));
  }
  // Human-readable extraction cache is deliberately outside tracked source/app assets.
  await writeFile(join(cache,source.cacheFile.replace(/\.pdf$/,'.pages.json')),JSON.stringify(pages));
  let passageCount=0;
  for(const unit of source.units){
    const chunks=unit.sections.map(section=>{
      if(!section.pages.every(page=>page>=1&&page<=pages.length))throw new Error(`Invalid pages in ${unit.id}`);
      const pieces=section.pages.map((page,index)=>{
        const lines=pages[page-1].split('\n').map(line=>line.trim()).filter(Boolean);
        return lines.slice(index===0?section.skipLines:0).join('\n');
      });
      let text=cleanContent(pieces.join('\n'));
      if(section.stopBefore){const end=text.indexOf(section.stopBefore);if(end<0)throw new Error(`Missing boundary ${unit.id}`);text=text.slice(0,end);}
      return text.trim();
    });
    const deduplicated=deduplicateChunks(chunks);
    removedExtracts+=deduplicated.removed;
    const contentTokens=tokens(deduplicated.text);
    if(contentTokens.length<80)throw new Error(`Unexpectedly short extraction: ${unit.id} (${contentTokens.length})`);
    if(/\b(?:answer sheet|Choose NO MORE|Sample Task|Recording Transcript|Tapescript)\b/i.test(deduplicated.text))throw new Error(`Boilerplate remains in ${unit.id}`);
    const hash=sha256(contentTokens.join(' '));
    const duplicate=documents.find(document=>document.sha256===hash);
    if(duplicate){discardedDuplicates.push({id:unit.id,duplicateOf:duplicate.id});continue;}
    documents.push({id:unit.id,sourceId:source.id,title:unit.title,register:unit.register,pages:unit.sections.flatMap(section=>section.pages),text:deduplicated.text,tokenCount:contentTokens.length,sha256:hash});passageCount++;
  }
  sourceOutput.push({id:source.id,title:source.title,publisher:source.publisher,url:source.url,documentYear:source.documentYear,yearBasis:source.yearBasis??(source.documentYear===2023?'filename':source.documentYear===2024?'copyright':'unavailable'),yearEvidence:source.yearEvidence,examYear:source.examYear,kind:source.kind,sha256:lock.sources[source.id].sha256,accessedAt:lock.sources[source.id].accessedAt,passageCount,pageCount:pdf.numPages});
  await pdf.destroy();
}
const tokenCount=documents.reduce((sum,document)=>sum+document.tokenCount,0);
const formToWord=new Map(words.flatMap(word=>[word.word,...word.forms].map(form=>[form.toLowerCase(),word.word] as const)));
const allTokenCounts=new Map<string,{count:number;documents:Set<string>}>();
for(const document of documents){
  for(const token of tokens(document.text)){
    const lemma=formToWord.get(token)??token;
    const record=allTokenCounts.get(lemma)??{count:0,documents:new Set()};
    record.count++;record.documents.add(document.id);allTokenCounts.set(lemma,record);
  }
}
const wordCounts=words.map(word=>{
  const forms=[word.word,...word.forms];const result=countForms(documents.map(document=>document.text),forms);
  const documentIds=documents.filter((_,index)=>result.counts[index]>0).map(document=>document.id);
  const sourceIds=[...new Set(documents.filter(document=>documentIds.includes(document.id)).map(document=>document.sourceId))];
  return {word:word.word,count:result.count,documentFrequency:result.documentFrequency,per10000:Math.round(result.count/tokenCount*10000*100)/100,sourceIds,documentIds,forms,byRegister:{Reading:result.counts.reduce((sum,count,index)=>sum+(documents[index].register==='Reading'?count:0),0),Listening:result.counts.reduce((sum,count,index)=>sum+(documents[index].register==='Listening'?count:0),0)},documentCounts:documentIds.map(id=>({id,count:result.counts[documents.findIndex(document=>document.id===id)]}))};
});
const maxCount=Math.max(1,...wordCounts.map(word=>word.count));
const maxDocuments=Math.max(1,...wordCounts.map(word=>word.documentFrequency));
const ranked=wordCounts.map(word=>({...word,priorityScore:priorityScore(word.count,word.documentFrequency,maxCount,maxDocuments),priorityTier:word.documentFrequency>=3?'high':word.documentFrequency>=1?'medium':'supplementary'})).sort((a,b)=>b.priorityScore-a.priorityScore||b.documentFrequency-a.documentFrequency||b.count-a.count||a.word.localeCompare(b.word)).map((word,index)=>({...word,rank:word.count>0?index+1:null}));
const summary={documentCount:documents.length,tokenCount,uniqueLemmaCount:allTokenCounts.size,sourceCount:sourceOutput.length,description:registry.description,generatedAt,scope:'official-public-samples',trackedWordCount:words.length,attestedWordCount:ranked.filter(word=>word.count>0).length,examYearCoverage:null,documentYearRange:[2023,2024],readingDocumentCount:documents.filter(document=>document.register==='Reading').length,listeningDocumentCount:documents.filter(document=>document.register==='Listening').length,tokenUnit:'lowercase English word tokens, including function words; speaker and section labels excluded',lemmaMethod:'Only explicit word forms from the learning vocabulary are merged; other surface forms remain separate.'};
const output={schemaVersion:1,summary,method:{documentUnit:'One distinct reading passage or listening transcript; two task extracts from the same named article are one unit.',included:'Passage bodies and spoken transcript content only.',excluded:'Question prompts, answer keys, task notes, headings, glossaries, speaker labels, page headers, repeated identical/contained extracts.',priorityFormula:'100 × (0.7 × documentFrequency/maxTrackedDocumentFrequency + 0.3 × log(1+count)/log(1+maxTrackedCount)), rounded to an integer.',priorityTierRule:'high: present in at least 3 content documents; medium: present in 1–2; supplementary: not observed in this sample.',priorityMeaning:'Relative learning order within this small official-sample corpus, not an exam probability, official band, or universal IELTS importance score.',zeroMeaning:'Not observed in these selected sources; does not imply unimportant for IELTS.',recencyLimit:'A 2023 filename and a 2024 copyright date describe the documents. No source provides a verified live exam year; these counts do not represent 2023–2026 past-paper trends.',crossTopicLimit:'A word can repeat within one topic; document frequency is retained separately from raw count.',deduplication:{removedContainedOrIdenticalExtracts:removedExtracts,removedDuplicateDocuments:discardedDuplicates}},sources:sourceOutput,documents:documents.map(({text,...metadata})=>metadata),words:ranked};
await Promise.all([
  writeFile(lockPath,JSON.stringify(lock,null,2)+'\n'),
  writeFile(join(root,'data/analysis/vocabulary-frequency.json'),JSON.stringify(output,null,2)+'\n'),
  writeFile(join(root,'data/analysis/observed-vocabulary.json'),JSON.stringify({summary,words:[...allTokenCounts.entries()].map(([word,entry])=>({word,count:entry.count,documentFrequency:entry.documents.size})).sort((a,b)=>b.documentFrequency-a.documentFrequency||b.count-a.count||a.word.localeCompare(b.word))},null,2)+'\n'),
  writeFile(join(cache,'content-units.json'),JSON.stringify(documents,null,2)+'\n'),
]);
console.log(JSON.stringify({summary,topWords:ranked.slice(0,12).map(({word,count,documentFrequency,priorityScore})=>({word,count,documentFrequency,priorityScore})),output:'data/analysis/vocabulary-frequency.json'},null,2));
