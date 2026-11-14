import assert from 'node:assert/strict';
import test from 'node:test';
import {defaultData,validateBackup} from '../src/lib/store';
import {schedule} from '../src/lib/scheduler';
import {canUndoStudyAction} from '../src/lib/study-undo';

const make=()=>{
  const data=defaultData();
  const at='2026-11-14T03:00:00.000Z';
  const after=schedule(undefined,'mitigate','mitigate-0',3,.9,new Date(at));
  data.records.mitigate=after;
  data.logs.push({id:'learn-a',wordId:'mitigate',sentenceId:'mitigate-0',rating:3,mode:'learn',at});
  return {data,action:{wordId:'mitigate',logId:'learn-a',after}};
};

test('a current study action remains undoable after backup normalization and unrelated progress',()=>{
  const {data,action}=make();
  const now=new Date('2026-11-14T03:01:00.000Z');
  data.records.foster=schedule(undefined,'foster','foster-0',3,.9,now);
  data.logs.push({id:'other-word',wordId:'foster',sentenceId:'foster-0',rating:3,mode:'learn',at:now.toISOString()});
  assert.equal(canUndoStudyAction(validateBackup(JSON.parse(JSON.stringify(data))),action),true);
});

test('a later review of the same word blocks an older undo even when its original log remains',()=>{
  const {data,action}=make();
  const now=new Date('2026-11-15T03:00:00.000Z');
  data.records.mitigate=schedule(data.records.mitigate,'mitigate','mitigate-1',3,.9,now);
  data.logs.push({id:'review-b',wordId:'mitigate',sentenceId:'mitigate-1',rating:3,mode:'review',at:now.toISOString()});
  assert.equal(canUndoStudyAction(data,action),false);
  data.records.mitigate=action.after;
  assert.equal(canUndoStudyAction(data,action),false,'a later same-word log alone invalidates the action');
});

test('imported memory changes invalidate undo without relying solely on log presence',()=>{
  const {data,action}=make();
  data.records.mitigate={...action.after,card:{...action.after.card,due:'2026-12-01T03:00:00.000Z'}};
  assert.equal(canUndoStudyAction(data,action),false);
  data.records.mitigate=action.after;
  data.logs=[];
  assert.equal(canUndoStudyAction(data,action),false);
  delete data.records.mitigate;
  assert.equal(canUndoStudyAction(data,action),false);
});
