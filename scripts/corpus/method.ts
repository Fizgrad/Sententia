import { createHash } from 'node:crypto';

export const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export function tokens(text: string): string[] {
  return (text.normalize('NFKC').replace(/[’‘]/g,"'").toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [])
    .map(token=>token.replace(/'s$/, ''));
}

export function cleanContent(text: string): string {
  return text.replace(/\u0002/g, '-').replace(/\u00ad/g, '')
    .split('\n').map(line=>line.trim())
    .filter(line => line && !/^(?:Page\s+\d+\s+of\s+\d+(?:\s+IELTS\.org)?|IELTS\.org|\d+|[A-H])$/i.test(line))
    .map(line=>line.replace(/^(?:[B-H]\s+|A\s{2,}|(?:M\d*|F\d*|A|B|Paul|Rachel|Tutor|Judy):\s*)/, ''))
    .join('\n');
}

/** Keep each identical/contained extract once, independently of whitespace and case. */
export function deduplicateChunks(chunks: string[]): { text: string; removed: number } {
  const kept: {text:string;normal:string}[] = [];
  let removed=0;
  for (const text of chunks) {
    const normal=tokens(text).join(' ');
    if (!normal || kept.some(old=>` ${old.normal} `.includes(` ${normal} `))) {removed++;continue;}
    for(let i=kept.length-1;i>=0;i--) {
      if(` ${normal} `.includes(` ${kept[i].normal} `)){kept.splice(i,1);removed++;}
    }
    kept.push({text,normal});
  }
  return { text:kept.map(chunk=>chunk.text).join('\n'),removed };
}

export function countForms(content: string[], forms: string[]): { count: number; documentFrequency: number; counts: number[] } {
  const target=new Set(forms.map(form=>form.toLowerCase()));
  const counts=content.map(text=>tokens(text).reduce((sum,token)=>sum+(target.has(token)?1:0),0));
  return {count:counts.reduce((sum,count)=>sum+count,0),documentFrequency:counts.filter(Boolean).length,counts};
}

export function priorityScore(count: number, documentFrequency: number, maxCount: number, maxDocuments: number): number {
  if(!count || !documentFrequency)return 0;
  return Math.round(100*(.7*documentFrequency/Math.max(1,maxDocuments)+.3*Math.log1p(count)/Math.log1p(Math.max(1,maxCount))));
}
