import type { VocabCard } from './types';

export interface MeaningOption { id: string; definition: string }
export interface MeaningQuestion { wordId: string; options: MeaningOption[]; correctOptionId: string }

// Exclude near-equivalent definitions: a distractor must be wrong for the word,
// rather than another reasonable way of expressing the same meaning.
const relatedMeanings = [
  ['mitigate','alleviate','diminish','decline'],
  ['foster','enhance','facilitate','contribute','enable'],
  ['substantial','significant','profound','crucial','fundamental','predominant'],
  ['ubiquitous','widespread','prevalent','common'],
  ['acquire','obtain','derive'],
  ['preserve','retain','maintain','sustainable','consistent'],
  ['assess','evaluate'],
  ['perceive','interpret'],
  ['indicate','demonstrate','illustrate','imply'],
  ['allocate','distribute'],
  ['consequence','impact','benefit','factor','aspect'],
  ['available','sufficient','viable','effective','efficient'],
  ['scarce','vulnerable','detrimental'],
  ['component','aspect','proportion','factor'],
  ['constitute','comprise','integrate'],
  ['generate','establish','emerge'],
  ['achieve','attain'],
  ['collaborate','cooperate','coordinate'],
  ['deduce','infer','conclude'],
  ['differentiate','distinguish','differ'],
  ['conserve','preserve','retain','maintain'],
  ['create','generate','formulate','initiate','establish'],
  ['incorporate','integrate','comprise','constitute'],
  ['adjust','adapt','modify'],
  ['exhibit','demonstrate','illustrate','depict','indicate','reveal'],
  ['arise','emerge','occur'],
  ['adequate','sufficient'],
  ['considerable','substantial','significant','profound'],
  ['essential','crucial','fundamental','inherent','intrinsic'],
  ['feasible','viable'],
  ['prevalent','ubiquitous','widespread','predominant','prominent'],
  ['apparent','evident','explicit'],
  ['accurate','precise','valid'],
  ['reliable','robust','resilient','stable','constant','consistent'],
  ['initial','preliminary','prior'],
  ['accessible','available'],
  ['constrain','restrict','limit','inhibit','prohibit'],
  ['affect','influence','impact','induce'],
  ['ensure','confirm','verify'],
  ['detect','identify','inspect','perceive','determine'],
  ['acknowledge','confirm','consent'],
  ['clarify','define','explain','specify'],
  ['boundary','barrier','constraint'],
  ['complexity','diversity','biodiversity'],
  ['community','society','institution'],
  ['correlation','interaction','correspondence'],
  ['definition','concept','context'],
  ['accuracy','efficiency','expertise'],
  ['achievement','benefit','advantage'],
  ['allocation','distribution'],
  ['assessment','evaluation'],
  ['conservation','preservation'],
  ['awareness','cognition','insight'],
  ['equality','equilibrium','equivalent'],
  ['controversy','debate','competition'],
  ['emphasis','priority'],
  ['expenditure','investment','consumption'],
  ['duration','extent','dimension','proportion','capacity'],
  ['inequality','disparity'],
  ['assumption','hypothesis'],
  ['data','evidence','account'],
  ['framework','approach','mechanism','context'],
];

const meaningRelations=new Map<string,Set<string>>();
for(const group of relatedMeanings)for(const word of group){const related=meaningRelations.get(word)??new Set<string>();for(const other of group)if(other!==word)related.add(other);meaningRelations.set(word,related);}
const glossCache=new WeakMap<VocabCard,string[]>();
const tokenCache=new WeakMap<VocabCard,Set<string>>();

const fallbackDefinitions: Record<string,string[]> = {
  'v.': ['to move something from one place to another', 'to compare two things and describe their differences', 'to refuse to accept a suggestion or request', 'to divide something into smaller separate pieces', 'to publicly ask for information or assistance', 'to make a problem or situation more serious'],
  'n.': ['a person who studies a subject in detail', 'a rule that controls what people are allowed to do', 'a written request for permission to do something', 'a particular period of time in the past', 'the physical area around a building', 'an amount of money borrowed from another person'],
  'adj.': ['happening at regular and predictable times', 'connected with the physical shape of an object', 'kept separate from other people or things', 'possible to move easily from place to place', 'done by hand rather than by a machine', 'related to a place that is far away'],
  'adv.': ['as a result of something that happened earlier', 'more and more as time passes', 'in the same order as the things already mentioned', 'in a way that is easy to understand', 'in a way that happens without being planned', 'only for a short period of time'],
};

function hash(text:string):number { let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0; }
function glosses(word:VocabCard):string[] {
  const cached=glossCache.get(word);if(cached)return cached;
  const result=word.definitionCN.replace(/（[^）]*）|\([^)]*\)/g,'').split(/[；;、，,/]/).map(text=>text.trim().replace(/的$/,'')).filter(text=>text.length>=2);glossCache.set(word,result);return result;
}
const definitionStopwords=new Set('a an the to of or and in on at as be being is are that which with for by from something someone person people way can able make do done when after before over into than without very more less'.split(' '));
function definitionTokens(word:VocabCard):Set<string> {
  const cached=tokenCache.get(word);if(cached)return cached;
  const result=new Set((word.definitionEN.toLowerCase().match(/[a-z]+/g)??[]).filter(token=>token.length>2&&!definitionStopwords.has(token)).map(token=>token.replace(/(?:ing|ed|s)$/,'')));tokenCache.set(word,result);return result;
}
function related(a:VocabCard,b:VocabCard):boolean {
  if ((a.paraphraseGroupId && a.paraphraseGroupId===b.paraphraseGroupId) || meaningRelations.get(a.word)?.has(b.word)) return true;
  const leftGlosses=glosses(a),rightGlosses=glosses(b);
  if(leftGlosses.some(left=>rightGlosses.some(right=>left===right)))return true;
  const left=definitionTokens(a),right=definitionTokens(b);
  const overlap=[...left].filter(token=>right.has(token)).length;
  return overlap>=2 && overlap/Math.min(left.size,right.size)>=.6;
}

export function createMeaningQuestion(word:VocabCard,pool:readonly VocabCard[]):MeaningQuestion {
  const correct:MeaningOption={id:word.id,definition:word.definitionEN};
  const eligible=pool.filter(candidate=>candidate.id!==word.id && candidate.partOfSpeech===word.partOfSpeech && candidate.definitionEN!==word.definitionEN && !related(word,candidate));
  const ranked=eligible.map(candidate=>({candidate,order:hash(`${word.id}:${candidate.id}`)})).sort((a,b)=>a.order-b.order||a.candidate.id.localeCompare(b.candidate.id));
  const seen=new Set([correct.definition.toLowerCase().trim()]);
  const distractors:MeaningOption[]=[];
  for(const {candidate} of ranked){const text=candidate.definitionEN.toLowerCase().trim();if(!seen.has(text)){seen.add(text);distractors.push({id:candidate.id,definition:candidate.definitionEN});}if(distractors.length===3)break;}
  const fallback=fallbackDefinitions[word.partOfSpeech]??fallbackDefinitions['n.'];
  for(const [index,definition] of fallback.entries()){
    if(distractors.length===3)break;
    if(!seen.has(definition.toLowerCase())){distractors.push({id:`fallback-${word.partOfSpeech}-${index}`,definition});seen.add(definition.toLowerCase());}
  }
  const options=[correct,...distractors].sort((a,b)=>hash(`${word.id}:option:${a.id}`)-hash(`${word.id}:option:${b.id}`)||a.id.localeCompare(b.id));
  return {wordId:word.id,options,correctOptionId:word.id};
}

export function judgeMeaning(question:MeaningQuestion,selectedId:string|null):boolean {
  return selectedId!==null && question.options.some(option=>option.id===selectedId) && selectedId===question.correctOptionId;
}
