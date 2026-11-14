import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { words, sentences, wordMap, sentenceMap, detectWords } from '../src/lib/corpus';
import { createMeaningQuestion } from '../src/lib/meaning-quiz';
import { defaultData, validateBackup } from '../src/lib/store';
import { schedule } from '../src/lib/scheduler';

const plan=JSON.parse(readFileSync(new URL('../data/vocabulary-expansion-plan.json',import.meta.url),'utf8')) as {batches:Record<string,string[]>};
const additions=Object.values(plan.batches).flat();

test('the expansion adds 200 independent words with three useful original contexts each',()=>{
  assert.equal(additions.length,200);
  assert.equal(new Set(additions).size,200);
  assert.ok(words.length>=2000);
  assert.equal(sentences.length,words.length*3);
  for(const id of additions){
    const word=wordMap[id];
    assert.ok(word,`missing ${id}`);
    assert.match(word.phoneticUK,/^\/[^/]+\/$/);
    assert.ok(['v.','n.','adj.','adv.'].includes(word.partOfSpeech));
    assert.ok(word.definitionEN.length>=20);
    assert.match(word.definitionCN,/[\u4e00-\u9fff]/);
    const pool=word.sentenceIds.map(sentenceId=>sentenceMap[sentenceId]);
    assert.equal(new Set(pool.map(sentence=>sentence.register)).size,3);
    assert.equal(new Set(pool.map(sentence=>sentence.text)).size,3);
    for(const sentence of pool){
      const [start,end]=sentence.targetSpan;
      assert.ok([word.word,...word.forms].includes(sentence.text.slice(start,end).toLowerCase()));
      assert.ok(sentence.text.split(/\s+/).length>=8,`${sentence.id} needs meaningful context`);
      assert.ok(sentence.text.split(/\s+/).length<=35,`${sentence.id} should stay readable`);
      assert.ok(sentence.text.toLowerCase().includes(sentence.collocation.toLowerCase()),`${sentence.id} collocation is not in its sentence`);
      assert.match(sentence.translation,/[\u4e00-\u9fff]/);
      assert.ok(detectWords(sentence.text).includes(id));
    }
  }
});

test('different learning words do not claim the same inflected form in frequency counting',()=>{
  const owner=new Map<string,string>();
  for(const word of words){
    for(const form of [word.word,...word.forms]){
      assert.match(form,/^[a-z]+$/);
      assert.ok(!owner.has(form)||owner.get(form)===word.id,`${form} is claimed by ${owner.get(form)} and ${word.id}`);
      owner.set(form,word.id);
    }
  }
});

test('added vocabulary works with objective guessing, scheduling and legacy backup restoration',()=>{
  const now=new Date('2026-11-14T08:00:00.000Z');
  const legacy=defaultData();
  legacy.records.mitigate=schedule(undefined,'mitigate','mitigate-0',3,.9,now);
  legacy.logs.push({id:'old-learning',wordId:'mitigate',sentenceId:'mitigate-0',mode:'learn',rating:3,at:now.toISOString()});
  const data=validateBackup(JSON.parse(JSON.stringify(legacy)));
  for(const id of ['analyse','criterion','consequently']){
    const question=createMeaningQuestion(wordMap[id],words);
    assert.equal(question.options.length,4);
    assert.ok(question.options.some(option=>option.id===id));
    data.records[id]=schedule(undefined,id,wordMap[id].sentenceIds[0],3,.9,now);
    data.logs.push({id:`new-${id}`,wordId:id,sentenceId:wordMap[id].sentenceIds[0],mode:'learn',rating:3,at:now.toISOString(),guess:{choiceId:id,correct:true}});
  }
  const restored=validateBackup(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(restored.records.mitigate,legacy.records.mitigate);
  assert.equal(Object.keys(restored.records).length,4);
  assert.equal(restored.logs.length,4);
});

test('a long personal extract can retain more than 100 detected core words in a backup',()=>{
  const selected=words.slice(0,150);
  const text=selected.map(word=>word.word).join(' ');
  assert.ok(text.length<5000);
  const data=defaultData();
  data.archive.push({id:'long-extract',text,source:'My notes',topic:'Society',wordIds:detectWords(text),createdAt:'2026-11-14T08:00:00.000Z'});
  assert.ok(data.archive[0].wordIds.length>100);
  const restored=validateBackup(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(restored.archive[0].wordIds,data.archive[0].wordIds);
});
