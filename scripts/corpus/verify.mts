/** Independent count reconciliation against private extracted source bodies. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {words} from '../../src/lib/corpus';

const root=resolve(import.meta.dirname,'../..');
const dataset=JSON.parse(await readFile(resolve(root,'data/analysis/vocabulary-frequency.json'),'utf8'));
const documents=JSON.parse(await readFile(resolve(root,'.npm-cache/ielts-corpus/content-units.json'),'utf8')) as {id:string;sourceId:string;text:string}[];
const independent=[];
for(const word of words){
  const forms=[word.word,...word.forms].map(form=>form.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const regex=new RegExp(`(?<![a-z])(?:${forms.join('|')})(?:'s)?(?![a-z]|'[a-z])`,'gi');
  const counts=documents.map(document=>({documentId:document.id,count:[...document.text.normalize('NFKC').replace(/[‘’]/g,"'").matchAll(regex)].length}));
  const count=counts.reduce((sum,document)=>sum+document.count,0),documentFrequency=counts.filter(document=>document.count>0).length;
  const published=dataset.words.find((row:{word:string})=>row.word===word.word);
  if(!published||count!==published.count||documentFrequency!==published.documentFrequency)throw new Error(`Independent count mismatch: ${word.word}`);
  independent.push({word:word.word,count,documentFrequency,documentCounts:counts.filter(document=>document.count>0)});
}
const report={checkedAt:new Date().toISOString(),method:'Independent case-insensitive whole-word regular expressions over extracted source bodies; does not call the frequency/tokenisation implementation.',wordsChecked:independent.length,result:'all counts and document frequencies reconcile',manualExtractionChecks:['Selected reading pages contain only passage bodies, with page/task headers, source attributions and question/answer sheets removed.','Two Curie task extracts share one document unit; two workforce extracts share one document unit.','The learner-persistence transcript introduction was removed before counting.','Sample years are sourced from a 2023 filename and a 2024 copyright footer; no actual exam year is inferred.'],spotChecks:independent.filter(row=>['crucial','maintain','evidence','hypothesis','complex','significant','approach','demonstrate','factor','capacity','retain','conventional','profound','incentive','scarce','undergo','viable','diminish','preserve','potential'].includes(row.word))};
await writeFile(resolve(root,'data/analysis/validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({wordsChecked:report.wordsChecked,result:report.result,spotChecks:report.spotChecks.map(({word,count,documentFrequency})=>({word,count,documentFrequency}))},null,2));
