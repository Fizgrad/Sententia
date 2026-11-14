import type { VocabCard } from './types';

export type VocabularyLevel = 'all' | 'advanced' | 'cet6' | 'academic' | 'expansion';

export const vocabularyLevels: { id: VocabularyLevel; label: string }[] = [
  { id: 'all', label: '全部词汇' },
  { id: 'advanced', label: '六级及以上进阶' },
  { id: 'cet6', label: '六级词表进阶' },
  { id: 'academic', label: '托福 / GRE 拓展' },
  { id: 'expansion', label: '进阶扩展词册' },
];

export function advancedTier(word: VocabCard): 'cet6' | 'academic' | null {
  const tags = word.lexiconSource?.examTags ?? [];
  if (['zk', 'gk', 'cet4'].some(tag => tags.includes(tag))) return null;
  if (tags.includes('cet6')) return 'cet6';
  return tags.includes('toefl') || tags.includes('gre') ? 'academic' : null;
}

export function matchesVocabularyLevel(word: VocabCard, level: VocabularyLevel): boolean {
  if (level === 'all') return true;
  if (level === 'expansion') return word.collection === 'advanced';
  const tier = advancedTier(word);
  return level === 'advanced' ? tier !== null : tier === level;
}

export function vocabularyLevelLabel(word: VocabCard): string | null {
  const tier = advancedTier(word);
  if (tier === 'cet6') return '六级词表';
  if (tier === 'academic') {
    const tags = word.lexiconSource?.examTags ?? [];
    return tags.includes('toefl') && tags.includes('gre') ? '托福 · GRE' : tags.includes('gre') ? 'GRE 词表' : '托福词表';
  }
  return null;
}
