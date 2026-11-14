import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { words } from '../src/lib/corpus';
import { cleanContent, countForms, deduplicateChunks, priorityScore, tokens } from '../scripts/corpus/method';

test('frequency tokenisation preserves function words and matches explicit inflections only',()=>{
  assert.deepEqual(tokens('A learner’s EVIDENCE, maintained; maintaining. I can’t.'),['a','learner','evidence','maintained','maintaining','i',"can't"]);
  assert.deepEqual(countForms(['Maintain a system. It is maintained.','Maintenance is different.','We are maintaining it.'],['maintain','maintains','maintained','maintaining']),{count:3,documentFrequency:2,counts:[2,0,1]});
  assert.equal(countForms(['The implication is different from imply.'],['imply']).count,1);
});

test('paragraph and speaker labels do not inflate corpus counts or remove a normal article',()=>{
  const body=cleanContent('Page 3 of 46 IELTS.org\nA\nA   First section.\nA normal article remains.\nM1: A student speaks.\nRachel: Reply.\n34');
  assert.equal(body,'First section.\nA normal article remains.\nA student speaks.\nReply.');
  assert.equal(tokens(body).filter(word=>word==='a').length,2);
});

test('the same extract and a shorter contained task extract count once',()=>{
  const result=deduplicateChunks(['Shared evidence supports a claim.','shared EVIDENCE supports a claim.','Evidence supports a claim.','A different paragraph contributes additional evidence.']);
  assert.equal(result.removed,2);
  assert.equal(countForms([result.text],['evidence']).count,2);
  const reverse=deduplicateChunks(['evidence supports a claim','Shared evidence supports a claim.']);
  assert.equal(reverse.removed,1);
  assert.equal(countForms([reverse.text],['evidence']).count,1);
});

test('priority weights document spread above repetitions in a single passage and keeps unseen words at zero',()=>{
  assert(priorityScore(5,5,8,5)>priorityScore(8,1,8,5));
  assert.equal(priorityScore(0,0,8,5),0);
  assert.equal(priorityScore(8,5,8,5),100);
});

test('published frequency aggregates reconcile and preserve unknown exam years',()=>{
  const data=JSON.parse(readFileSync(new URL('../data/analysis/vocabulary-frequency.json',import.meta.url),'utf8'));
  assert.equal(data.summary.trackedWordCount,words.length,'word additions require refreshed corpus statistics');
  assert.deepEqual(new Set(data.words.map((row:{word:string})=>row.word)),new Set(words.map(word=>word.id)));
  assert.equal(data.summary.scope,'official-public-samples');
  assert.equal(data.summary.examYearCoverage,null);
  assert.equal(data.summary.documentCount,data.documents.length);
  assert.equal(data.summary.sourceCount,data.sources.length);
  assert.equal(data.summary.tokenCount,data.documents.reduce((sum:number,document:{tokenCount:number})=>sum+document.tokenCount,0));
  assert.equal(new Set(data.documents.map((document:{sha256:string})=>document.sha256)).size,data.documents.length);
  for(const source of data.sources){assert.equal(source.examYear,null);assert.match(source.sha256,/^[a-f0-9]{64}$/);assert.equal(new URL(source.url).hostname,'ielts.org');assert.equal(source.passageCount,data.documents.filter((document:{sourceId:string})=>document.sourceId===source.id).length);}
  for(const word of data.words){
    assert.equal(word.documentFrequency,word.documentCounts.length);
    assert.equal(word.count,word.documentCounts.reduce((sum:number,document:{count:number})=>sum+document.count,0));
    assert.equal(word.count,word.byRegister.Reading+word.byRegister.Listening);
    assert.equal(word.per10000,Math.round(word.count/data.summary.tokenCount*1_000_000)/100);
    assert(word.priorityScore>=0&&word.priorityScore<=100);
    if(!word.count){assert.equal(word.priorityScore,0);assert.equal(word.rank,null);assert.equal(word.priorityTier,'supplementary');}
  }
});
