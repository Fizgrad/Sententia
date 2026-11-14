import statistics from '../../data/analysis/vocabulary-frequency.json';
import type { VocabCard } from './types';

export const corpusStatistics = statistics;
export const frequencyMap = new Map(statistics.words.map(entry=>[entry.word,entry]));
export const priorityLabels:Record<string,string> = { high:'多篇出现', medium:'样本中出现', supplementary:'拓展学习' };

export function sortByCorpusPriority(pool:readonly VocabCard[]):VocabCard[] {
  return [...pool].sort((a,b)=>{
    const left=frequencyMap.get(a.id),right=frequencyMap.get(b.id);
    if(left&&right)return (left.rank??Number.MAX_SAFE_INTEGER)-(right.rank??Number.MAX_SAFE_INTEGER);
    if(left)return -1;
    if(right)return 1;
    return 0;
  });
}
