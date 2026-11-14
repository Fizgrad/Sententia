/** Assemble only individually reviewed cards. No generated or unreviewed fallback. */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { curatedWords, detectTopic } from '../../src/lib/corpus';
import type { ContextSentence, LexiconEvidence, Register, VocabCard } from '../../src/lib/types';

interface Candidate {word:string;forms:string[];pos:string;definitionEN:string;definitionCN:string;phonetic:string;ieltsTagged:boolean;bncRank:number|null;contemporaryRank:number|null}
interface Example {id:string;text:string;translation:string;sourceSentenceId:string;author:string;sourceUrl:string;license:string;attribution:string;translationSource?:NonNullable<ContextSentence['source']>['translationSource']}
interface Review {word:string;status:'approved'|'reject';definitionEN?:string;definitionCN?:string;partOfSpeech?:string;forms?:string[];phoneticUK?:string;exampleIds?:string[];reason?:string;authoredContexts?:{text:string;translation:string;register:Register;collocation:string}[]}
const read = async <T>(file:string):Promise<T> => JSON.parse(await readFile(file,'utf8')) as T;
const optional = async <T>(file:string,fallback:T):Promise<T> => {try{return await read<T>(file);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return fallback;throw error;}};
const candidates = await read<Candidate[]>('data/lexicon-candidates.json');
const supplements = await read<Candidate[]>('data/lexicon-core-supplement.json');
const candidateMap = new Map([...candidates,...supplements].map(item=>[item.word,item]));
const registry = await read<{repository:string;commit:string}>('data/sources/lexicon.json');
const evidenceRows = await read<Record<string,Candidate>>('data/lexicon-curated-evidence.json');
const snapshot = await read<{examples:Record<string,Example[]>}>('data/sources/tatoeba-sentences.json');
const alternatives = await optional<Record<string,Example[]>>('.npm-cache/sentences/retained-pools.json',{});
const savedExamples = await optional<{examples:Record<string,Example[]>}>('data/sources/selected-contexts.json',{examples:{}});
const files=(await readdir('data/lexicon-reviews')).filter(file=>/^review-(?:\d+|reserve-\d+)\.json$/.test(file)).sort();
const reviews=new Map<string,Review>();
const auditFiles: {file:string;sha256:string;count:number}[]=[];
for(const file of [...files,'core-editorial.json']) {
  const path=`data/lexicon-reviews/${file}`;
  const bytes=await readFile(path);
  const document=JSON.parse(bytes.toString('utf8')) as {entries:Review[]};
  const seen=new Set<string>();
  for(const entry of document.entries) {
    if(seen.has(entry.word))throw new Error(`Duplicate review ${file}: ${entry.word}`);
    seen.add(entry.word);reviews.set(entry.word,entry);
  }
  auditFiles.push({file:path,sha256:createHash('sha256').update(bytes).digest('hex'),count:document.entries.length});
}
const rank=(row:Candidate)=>Math.min(...[row.bncRank,row.contemporaryRank].filter((n):n is number=>typeof n==='number'&&n>0));
const evidence=(row:Candidate):LexiconEvidence=>({provider:'ECDICT',ieltsTagged:row.ieltsTagged,bncRank:row.bncRank||null,contemporaryRank:row.contemporaryRank||null,url:`${registry.repository}/blob/${registry.commit}/README.md`});
const coreIds=new Set(supplements.map(row=>row.word));
const previous=await optional<{words:VocabCard[]}>('data/lexicon-import.json',{words:[]});
const previousOrder=new Map(previous.words.map((word,index)=>[word.id,index]));
const approved=[...reviews.values()].filter(row=>row.status==='approved').sort((a,b)=>(previousOrder.get(a.word)??Infinity)-(previousOrder.get(b.word)??Infinity)||Number(coreIds.has(b.word))-Number(coreIds.has(a.word))||rank(candidateMap.get(a.word)!)-rank(candidateMap.get(b.word)!)||a.word.localeCompare(b.word));
const words:VocabCard[]=[];
const sentences:ContextSentence[]=[];
const owners=new Map<string,string>();
for(const word of curatedWords)for(const form of [word.word,...word.forms])owners.set(form,word.word);
const selectedHeads=new Set(approved.map(row=>row.word));
const skipped:{word:string;reason:string}[]=[];
const selectedReviews:Review[]=[];
const selectedExamples:Record<string,Example[]>={};
const tokenCount=(text:string)=>(text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length;
function span(text:string,variants:string[]):[number,number] {
  const escaped=variants.map(form=>form.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const matches=[...text.matchAll(new RegExp(`\\b(?:${escaped.join('|')})\\b`,'gi'))];
  if(matches.length!==1)throw new Error(`Expected one target, found ${matches.length}: ${text}`);
  return [matches[0].index!,matches[0].index!+matches[0][0].length];
}
function snippet(text:string,[start,end]:[number,number]) {
  const before=text.slice(0,start).match(/(?:[\w'’-]+\s+){0,2}$/)?.[0]??'';
  const after=text.slice(end).match(/^(?:\s+[\w'’-]+){0,3}/)?.[0]??'';
  return `${before}${text.slice(start,end)}${after}`.trim();
}
for(const review of approved) {
  if(words.length===1700)break;
  try {
  const row=candidateMap.get(review.word);
  if(!row)throw new Error(`Missing dictionary provenance: ${review.word}`);
  if(owners.has(row.word)){skipped.push({word:row.word,reason:`Headword collides with ${owners.get(row.word)}`});continue;}
  if(rank(row)>20000)throw new Error(`Unranked or uncommon candidate ${row.word}`);
  const forms=[...new Set(review.forms??row.forms)].filter(form=>form!==row.word&&!owners.has(form)&&!selectedHeads.has(form));
  const word:VocabCard={id:row.word,word:row.word,forms,phoneticUK:review.phoneticUK??row.phonetic,partOfSpeech:review.partOfSpeech??row.pos,definitionEN:review.definitionEN??row.definitionEN,definitionCN:review.definitionCN??row.definitionCN,ieltsBand:rank(row)<=5000?6:rank(row)<=10000?7:8,sentenceIds:[],lexiconSource:evidence(row),definitionOrigin:review.definitionEN||review.definitionCN?'edited':'dictionary',contextOrigin:review.authoredContexts?'editorial':'Tatoeba'};
  if(!word.definitionEN||new RegExp(`\\b${row.word}\\b`,'i').test(word.definitionEN)||!/[\u4e00-\u9fff]/.test(word.definitionCN)||!/^\/[^/]+\/$/.test(word.phoneticUK))throw new Error(`Invalid learning gloss/IPA: ${row.word}`);
  let pool:ContextSentence[];
  if(review.authoredContexts) {
    if(review.authoredContexts.length!==3||new Set(review.authoredContexts.map(item=>item.register)).size!==3)throw new Error(`Need 3 original genres: ${row.word}`);
    pool=review.authoredContexts.map((context,index)=>({id:`${row.word}-editorial-${index}`,wordId:row.word,topic:detectTopic(context.text),...context,targetSpan:span(context.text,[row.word,...forms])}));
  } else {
    const lookup=new Map([...(snapshot.examples[row.word]??[]),...(alternatives[row.word]??[]),...(savedExamples.examples[row.word]??[])].map(item=>[item.id,item]));
    const contexts=review.exampleIds?review.exampleIds.map(id=>lookup.get(id)):(snapshot.examples[row.word]??[]);
    if(contexts.length!==3||contexts.some(item=>!item))throw new Error(`Missing reviewed example IDs: ${row.word}`);
    pool=contexts.map((item,index)=>{
      const context=item!;const targetSpan=span(context.text,[row.word,...forms]);
      return {id:`${row.word}-source-${index}`,wordId:row.word,topic:detectTopic(context.text),register:'Example',text:context.text,translation:context.translation??'',targetSpan,collocation:snippet(context.text,targetSpan),source:{provider:'Tatoeba',sentenceId:context.sourceSentenceId,author:context.author,sourceUrl:context.sourceUrl,license:context.license,attribution:context.attribution,...(context.translationSource?{translationSource:context.translationSource}:{})}};
    });
    selectedExamples[row.word]=contexts as Example[];
  }
  for(const context of pool) {
    const count=tokenCount(context.text);
    if(count<8||count>(context.source?32:25))throw new Error(`Context length ${count} for ${row.word}: ${context.text}`);
    if(!context.text.toLowerCase().includes(context.collocation.toLowerCase()))throw new Error(`Invalid collocation: ${row.word}`);
    if(context.source&&(!context.source.author||!context.source.attribution||!context.source.license))throw new Error(`Missing source attribution: ${row.word}`);
  }
  if(new Set(pool.map(item=>item.text.toLowerCase())).size!==3)throw new Error(`Duplicate contexts: ${row.word}`);
  word.sentenceIds=pool.map(item=>item.id);words.push(word);sentences.push(...pool);selectedReviews.push(review);
  for(const form of [word.word,...forms])owners.set(form,word.word);
  } catch(error) {
    skipped.push({word:review.word,reason:error instanceof Error?error.message:String(error)});
  }
}
const curatedEvidence=Object.fromEntries(curatedWords.map(word=>{
  const row=evidenceRows[word.id];if(!row)throw new Error(`Missing curated provenance: ${word.id}`);
  return [word.id,evidence(row)];
}));
const allEvidence=[...Object.values(curatedEvidence),...words.map(word=>word.lexiconSource!)];
const counts={totalWords:300+words.length,curatedWords:300,importedWords:words.length,totalContexts:900+sentences.length,ieltsTagged:allEvidence.filter(row=>row.ieltsTagged).length,rankAtMost5000:allEvidence.filter(row=>rank(row as Candidate)<=5000).length,rankAtMost10000:allEvidence.filter(row=>rank(row as Candidate)<=10000).length,rankAtMost20000:allEvidence.filter(row=>rank(row as Candidate)<=20000).length,sourceContexts:sentences.filter(row=>row.source).length,editorialContexts:900+sentences.filter(row=>!row.source).length,translatedContexts:900+sentences.filter(row=>row.translation).length,approvedAvailable:approved.length,rejected:[...reviews.values()].filter(row=>row.status==='reject').length,skipped};
if(words.length<1700){console.error(JSON.stringify(skipped,null,2));throw new Error(`Only ${words.length}/1700 valid imports (${approved.length} approvals). Need ${1700-words.length} more reviewed words; no pack written.`);}
for(const previousWord of previous.words)if(!words.some(word=>word.id===previousWord.id))throw new Error(`Existing vocabulary ${previousWord.id} would disappear. Repair its review or explicitly migrate saved study records before changing the published set.`);
if(counts.ieltsTagged/counts.totalWords<.95)throw new Error('IELTS-list coverage below 95%.');
if(counts.rankAtMost10000/counts.totalWords<.95)throw new Error('Fewer than 95% of words have general rank at most 10000.');
if(counts.rankAtMost20000!==counts.totalWords)throw new Error('Every word needs a positive general rank at most 20000.');
if(process.argv.includes('--check')){console.log(JSON.stringify(counts,null,2));process.exit(0);}
await mkdir('data/analysis',{recursive:true});
await writeFile('data/lexicon-import.json',JSON.stringify({schemaVersion:1,summary:counts,curatedEvidence,words,sentences},null,2)+'\n');
await writeFile('data/lexicon-selected-final.json',JSON.stringify({schemaVersion:1,reviewFiles:auditFiles,entries:selectedReviews},null,2)+'\n');
await writeFile('data/sources/selected-contexts.json',JSON.stringify({schemaVersion:1,description:'The exact attributed community sentences used by the reviewed final cards. This file makes assembly reproducible without downloading mutable exports or retaining ignored alternatives.',examples:Object.fromEntries(words.filter(word=>word.contextOrigin==='Tatoeba').map(word=>[word.id,selectedExamples[word.id]]))},null,2)+'\n');
await writeFile('data/analysis/lexicon-quality.json',JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),...counts,reviewFiles:auditFiles,limitations:['IELTS membership is an independent ECDICT word-list tag, not official exam frequency.','BNC and contemporary corpus ranks measure general English; the latter corpus identity is not independently verified.','Three contexts per card were individually checked against the selected sense. Community examples are not IELTS exam excerpts.','Official IELTS public-sample observed counts are reported separately in vocabulary-frequency.json.']},null,2)+'\n');
console.log(JSON.stringify(counts,null,2));
