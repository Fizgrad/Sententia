import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { detectWords, sentences, sentenceMap, wordMap, words } from '../src/lib/corpus';
import { advancedTier, matchesVocabularyLevel, vocabularyLevelLabel } from '../src/lib/vocabulary-level';
import { defaultData, validateBackup } from '../src/lib/store';
import { schedule } from '../src/lib/scheduler';
import type { ContextSentence, VocabCard } from '../src/lib/types';

const read=(file:string)=>JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
const pack=read('../data/advanced-vocabulary.json') as {words:VocabCard[];sentences:ContextSentence[]};
const candidates=new Map((read('../data/lexicon-candidates.json') as {word:string;tags:string[];bncRank:number|null;contemporaryRank:number|null}[]).map(row=>[row.word,row]));

test('one thousand additional advanced words preserve all existing cards and have examination-list evidence',()=>{
  assert.equal(pack.words.length,1000);
  assert.equal(words.length,3000);
  assert.equal(words.filter(word=>word.collection!=='advanced').length,2000);
  assert.equal(pack.sentences.length,3000);
  assert.equal(sentences.length,9000);
  for(const word of pack.words){
    const source=candidates.get(word.id);
    assert.ok(source,`${word.id} must have a dictionary source row`);
    assert.deepEqual(word.lexiconSource?.examTags,source.tags);
    assert.ok(source.tags.some(tag=>['cet6','toefl','gre'].includes(tag)),`${word.id}: no advanced word-list tag`);
    assert.ok(source.tags.every(tag=>!['zk','gk','cet4'].includes(tag)),`${word.id}: overlaps basic examination lists`);
    assert.equal(word.lexiconSource?.bncRank,source.bncRank);
    assert.equal(word.lexiconSource?.contemporaryRank,source.contemporaryRank);
    assert.ok(Math.min(source.bncRank||Infinity,source.contemporaryRank||Infinity)<=20000);
    assert.equal(wordMap[word.id].collection,'advanced');
    assert.ok(vocabularyLevelLabel(word));
  }
});

test('advanced contexts retain source texts, attribution and correct complete-token targets',()=>{
  const selected=read('../data/sources/advanced-contexts.json').examples as Record<string,{sourceSentenceId:string;text:string;translation:string;author:string;sourceUrl:string;license:string;attribution:string}[]>;
  for(const word of pack.words){
    assert.equal(word.sentenceIds.length,3);
    const pool=word.sentenceIds.map(id=>sentenceMap[id]);
    assert.equal(new Set(pool.map(sentence=>sentence.text.toLowerCase().trim())).size,3);
    assert.ok(word.definitionEN.length>=8);
    assert.doesNotMatch(word.definitionEN,new RegExp(`\\b${word.word}\\b`,'i'));
    assert.match(word.definitionCN,/[\u4e00-\u9fff]/);
    for(const sentence of pool){
      if(word.contextOrigin==='editorial'){
        assert.equal(sentence.source,undefined);
        assert.match(sentence.translation,/[\u4e00-\u9fff]/);
        assert.ok(['Reading','Writing','Listening'].includes(sentence.register));
        continue;
      }
      const row=selected[word.id]?.find(example=>example.sourceSentenceId===sentence.source?.sentenceId);
      assert.ok(row,`${sentence.id}: missing source identity`);
      for(const field of ['text','translation'] as const)assert.equal(sentence[field],row[field]);
      for(const field of ['author','sourceUrl','license','attribution'] as const)assert.equal(sentence.source![field],row[field]);
      assert.ok([word.word,...word.forms].includes(sentence.text.slice(...sentence.targetSpan).toLowerCase()));
      assert.ok(detectWords(sentence.text).includes(word.id));
      assert.ok(sentence.text.toLowerCase().includes(sentence.collocation.toLowerCase()));
    }
  }
});

test('difficulty filters partition advanced evidence and include the additional collection',()=>{
  const advanced=words.filter(word=>matchesVocabularyLevel(word,'advanced'));
  const cet6=words.filter(word=>matchesVocabularyLevel(word,'cet6'));
  const academic=words.filter(word=>matchesVocabularyLevel(word,'academic'));
  assert.equal(advanced.length,cet6.length+academic.length);
  assert.ok(advanced.length>=1000);
  assert.ok(cet6.length>0&&academic.length>0);
  assert.equal(words.filter(word=>matchesVocabularyLevel(word,'expansion')).length,1000);
  assert.ok(words.every(word=>matchesVocabularyLevel(word,'all')));
  assert.equal(advancedTier(wordMap.access),null);
  assert.ok(advancedTier(wordMap.mitigate));
  for(const word of pack.words)assert.ok(matchesVocabularyLevel(word,'advanced'));
});

test('advanced learning records and personal archive round-trip with the public server manifest',()=>{
  const manifest=read('../backend/vocabulary-manifest.json');
  assert.deepEqual(new Set(Object.keys(manifest.words)),new Set(words.map(word=>word.id)));
  const data=defaultData();
  for(const word of pack.words.filter((_,index)=>index%100===0)){
    const sentence=sentenceMap[word.sentenceIds[0]];
    data.records[word.id]=schedule(undefined,word.id,sentence.id,3,data.preferences.retention,new Date('2026-11-14T08:00:00Z'));
    assert.deepEqual(manifest.words[word.id],word.sentenceIds);
  }
  const word=pack.words[0];
  const sentence=sentenceMap[word.sentenceIds[0]];
  data.archive.push({id:'advanced-sample',text:sentence.text,topic:sentence.topic,source:'Reading notes',wordIds:detectWords(sentence.text),createdAt:'2026-11-14T08:00:00.000Z'});
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))),data);
});
