interface MatchableWord {
  id: string;
  word: string;
  forms: readonly string[];
}

export interface WordMatch {
  wordId: string;
  start: number;
  end: number;
}

/** Return complete-token spans, excluding the suffix of a singular possessive. */
export function createWordMatcher(words: readonly MatchableWord[]) {
  const formOwners = new Map(words.flatMap(word =>
    [word.word, ...word.forms].map(form => [form.toLowerCase(), word.id] as const),
  ));

  return (text: string, wordIds?: readonly string[]): WordMatch[] => {
    const allowed = wordIds ? new Set(wordIds) : undefined;
    if (allowed?.size === 0) return [];
    const matches: WordMatch[] = [];
    for (const token of text.matchAll(/\b[a-z]+(?:['’‘][a-z]+)?\b/gi)) {
      const form = token[0].toLowerCase().replace(/['’‘]s$/, '');
      const wordId = formOwners.get(form);
      if (wordId && (!allowed || allowed.has(wordId))) {
        matches.push({ wordId, start: token.index, end: token.index + form.length });
      }
    }
    return matches;
  };
}
