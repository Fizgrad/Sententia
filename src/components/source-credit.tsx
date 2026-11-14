import { ExternalLink } from 'lucide-react';
import type { ContextSentence } from '@/lib/types';
import './source-credit.css';

export function SourceCredit({sentence}:{sentence:ContextSentence}) {
  if(!sentence.source)return null;
  const source=sentence.source;
  return <details className="sentence-credit"><summary>例句来源与署名 · Tatoeba</summary><div><a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">原句 #{source.sentenceId} · {source.author}<ExternalLink size={12}/></a><p>{source.attribution}</p>{source.translationSource&&<><a href={source.translationSource.url} target="_blank" rel="noopener noreferrer">中文译文 · {source.translationSource.author}<ExternalLink size={12}/></a><p>{source.translationSource.attribution}</p></>}<a href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank" rel="noopener noreferrer">{source.license}</a></div></details>;
}
