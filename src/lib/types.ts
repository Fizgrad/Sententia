import type { Card } from 'ts-fsrs';

export type View = 'learn' | 'review' | 'matrix' | 'archive' | 'insights' | 'vocabulary';
export type Topic = 'Environment' | 'Education' | 'Technology' | 'Society' | 'Economy' | 'Health' | 'Culture' | 'Government';
export type Register = 'Reading' | 'Writing' | 'Listening' | 'Example';
export interface LexiconEvidence {
  provider: 'ECDICT';
  ieltsTagged: boolean;
  bncRank: number | null;
  contemporaryRank: number | null;
  url: string;
  examTags?: string[];
}
export interface SentenceAttribution {
  provider: 'Tatoeba';
  sentenceId: string;
  author: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  translationSource?: { sentenceId: string; author: string; url: string; license: string; attribution: string };
}
export interface ContextSentence {
  id: string;
  wordId: string;
  topic: Topic;
  register: Register;
  text: string;
  translation: string;
  targetSpan: [number, number];
  collocation: string;
  source?: SentenceAttribution;
}
export interface VocabCard {
  id: string;
  word: string;
  forms: string[];
  phoneticUK: string;
  partOfSpeech: string;
  definitionEN: string;
  definitionCN: string;
  ieltsBand: 6 | 7 | 8;
  paraphraseGroupId?: string;
  sentenceIds: string[];
  lexiconSource?: LexiconEvidence;
  definitionOrigin?: 'curated' | 'dictionary' | 'edited';
  contextOrigin?: 'curated' | 'Tatoeba' | 'editorial';
  collection?: 'advanced';
}
export type StoredCard = Omit<Card, 'due' | 'last_review'> & { due: string; last_review?: string };
export interface MemoryRecord {
  id: string;
  card: StoredCard;
  lastSentenceId: string;
  seenSentenceIds: string[];
  learnedAt: string;
}
export interface ArchiveEntry {
  id: string;
  text: string;
  topic: Topic;
  source: string;
  wordIds: string[];
  createdAt: string;
  sentenceId?: string;
}
export interface StudyLog {
  id: string;
  wordId: string;
  sentenceId: string;
  rating: 1 | 2 | 3 | 4;
  mode: 'learn' | 'review';
  at: string;
  guess?: { choiceId: string | null; correct: boolean };
}
export interface Preferences {
  dailyGoal: number;
  retention: number;
  autoSpeak: boolean;
  name: string;
}
export interface AppData {
  schemaVersion: 1;
  records: Record<string, MemoryRecord>;
  archive: ArchiveEntry[];
  logs: StudyLog[];
  preferences: Preferences;
}
export type ParaphraseCategory = 'action' | 'quality' | 'concept';
export interface ParaphraseGroup {
  id: string;
  category?: ParaphraseCategory;
  title: string;
  subtitle: string;
  words: { word: string; meaning: string; collocations: string[]; example: string; note: string }[];
  tip: string;
}
