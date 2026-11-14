import type {AppData,MemoryRecord,StoredCard,StudyLog} from './types';

export interface UndoableStudyAction {
  wordId: string;
  logId: string;
  after: MemoryRecord;
}

export function canUndoStudyAction(data:AppData,action:UndoableStudyAction):boolean {
  const current=data.records[action.wordId];
  const expected=action.after;
  if(!current||expected.id!==action.wordId)return false;
  let latest:StudyLog|undefined;
  for(const log of data.logs)if(log.wordId===action.wordId)latest=log;
  if(latest?.id!==action.logId)return false;
  if(current.id!==expected.id||current.learnedAt!==expected.learnedAt||current.lastSentenceId!==expected.lastSentenceId)return false;
  if(current.seenSentenceIds.length!==expected.seenSentenceIds.length||!current.seenSentenceIds.every((id,index)=>id===expected.seenSentenceIds[index]))return false;
  const keys=Object.keys(expected.card) as (keyof StoredCard)[];
  return Object.keys(current.card).length===keys.length&&keys.every(key=>current.card[key]===expected.card[key]);
}
