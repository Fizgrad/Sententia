'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, FileText, Leaf, ListFilter, Search, X } from 'lucide-react';
import { corpusStatistics, frequencyMap, priorityLabels, sortByCorpusPriority } from '@/lib/frequency';
import { sentenceMap, topics, words } from '@/lib/corpus';
import type { AppData, Topic } from '@/lib/types';
import { assetPath } from '@/lib/asset-path';
import { advancedTier, matchesVocabularyLevel, vocabularyLevelLabel, vocabularyLevels, type VocabularyLevel } from '@/lib/vocabulary-level';
import './vocabulary-view.css';
import './source-credit.css';

export function VocabularyView({data,onLearn}:{data:AppData;onLearn:(id:string)=>void}) {
  const [query,setQuery]=useState('');
  const [topic,setTopic]=useState<Topic|'all'>('all');
  const [attestedOnly,setAttestedOnly]=useState(false);
  const [sort,setSort]=useState<'priority'|'frequency'|'alphabet'|'common'>('priority');
  const [level,setLevel]=useState<VocabularyLevel>('all');
  const [page,setPage]=useState(0);
  const pageSize=50;
  useEffect(()=>setPage(0),[query,topic,sort,attestedOnly,level]);
  const advancedCount=words.filter(word=>advancedTier(word)!==null).length;
  const tagged=words.filter(word=>word.lexiconSource?.ieltsTagged).length;
  const common=words.filter(word=>word.lexiconSource&&Math.min(word.lexiconSource.bncRank??Infinity,word.lexiconSource.contemporaryRank??Infinity)<=10000).length;
  const summary=corpusStatistics.summary;
  const filtered=useMemo(()=>{
    const term=query.trim().toLowerCase();
    const pool=words.filter(word=>matchesVocabularyLevel(word,level)&&(topic==='all'||sentenceMap[word.sentenceIds[0]].topic===topic)&&(!attestedOnly||(frequencyMap.get(word.id)?.count??0)>0)&&(!term||`${word.word} ${word.forms.join(' ')} ${word.definitionCN} ${word.definitionEN}`.toLowerCase().includes(term)));
    if(sort==='alphabet')return pool.sort((a,b)=>a.word.localeCompare(b.word));
    if(sort==='common')return pool.sort((a,b)=>Math.min(a.lexiconSource?.bncRank??Infinity,a.lexiconSource?.contemporaryRank??Infinity)-Math.min(b.lexiconSource?.bncRank??Infinity,b.lexiconSource?.contemporaryRank??Infinity)||a.word.localeCompare(b.word));
    if(sort==='frequency')return pool.sort((a,b)=>(frequencyMap.get(b.id)?.count??-1)-(frequencyMap.get(a.id)?.count??-1)||a.word.localeCompare(b.word));
    return sortByCorpusPriority(pool);
  },[query,topic,sort,attestedOnly,level]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage=Math.min(page,pageCount-1);
  const visible=filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize);

  return <div className="vocabulary-view">
    <div className="page-heading"><div><div className="eyebrow"><span className="tiny-line"/> A WORDLIST WITH CONTEXT</div><h1>词汇的轻重，<span className="title-accent">有迹可循。</span></h1><p>从官方公开语料的出现次数与覆盖篇数，安排下一次相识。</p></div></div>
    <div className="vocabulary-metrics"><div><BookOpen size={20}/><strong>{words.length}</strong><span>核心学习词</span></div><div><FileText size={20}/><strong>{summary.documentCount}</strong><span>去重内容单元</span></div><div><ListFilter size={20}/><strong>{summary.tokenCount.toLocaleString('zh-CN')}</strong><span>语料英文词次</span></div><div><Leaf size={20}/><strong>{summary.sourceCount}</strong><span>官方来源文件</span></div></div>
    <section className="lexicon-evidence-summary"><BookOpen size={19}/><p><strong>{advancedCount} 个六级及以上进阶词 · {tagged} 词有雅思词表标签</strong><small>{common} 词位于 BNC 或当代通用语料排名前 10,000。下方可查看雅思词表标签、通用语料排名和官方公开样题中的出现次数。</small></p></section>
    <section className="frequency-scope"><div><Leaf size={19}/><p><strong>这是一份官方公开样题词频，帮助决定学习先后。</strong><span>统计 {summary.sourceCount} 份官方公开材料中的阅读片段与听力录音稿，覆盖 {summary.documentCount} 个内容单元。资料年份按文件名或版权标记展示。</span></p></div><a href="#frequency-sources" onClick={()=>{const details=document.getElementById('frequency-sources');if(details instanceof HTMLDetailsElement)details.open=true;}}>查看来源与口径 <ChevronDown size={15}/></a></section>
    <div className="vocabulary-toolbar"><label className="vocabulary-search"><Search size={18}/><input aria-label="搜索词库" placeholder="搜索单词或释义…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button className="icon-button" onClick={()=>setQuery('')} aria-label="清除词库搜索"><X size={15}/></button>}</label><div className="vocabulary-filters"><label><span>难度</span><select aria-label="词库难度" value={level} onChange={e=>setLevel(e.target.value as VocabularyLevel)}>{vocabularyLevels.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>话题</span><select aria-label="词库话题" value={topic} onChange={e=>setTopic(e.target.value as Topic|'all')}><option value="all">全部话题</option>{topics.map(t=><option key={t.id} value={t.id}>{t.short}</option>)}</select></label><label><span>排序</span><select aria-label="词库排序" value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="priority">语料优先级</option><option value="frequency">出现次数</option><option value="common">通用语料常用度</option><option value="alphabet">字母顺序</option></select></label></div></div>
    <div className="vocabulary-filter-note"><label><input type="checkbox" checked={attestedOnly} onChange={e=>setAttestedOnly(e.target.checked)}/> 只看本次语料中出现的词</label><span>共 {filtered.length} 词</span></div>
    <section className="vocabulary-list panel" aria-label="词汇与语料词频"><div className="vocabulary-list-heading"><span>词汇与释义</span><span>词频 / 内容覆盖</span><span>学习参考</span><span>去相识</span></div>{filtered.length?visible.map(word=>{
      const stats=frequencyMap.get(word.id),learned=!!data.records[word.id];
      return <article key={word.id} className="vocabulary-row"><div className="vocabulary-identity"><div><h2>{word.word}</h2>{learned&&<span className="vocabulary-known"><Check size={12}/> 已入队</span>}</div><p><span>{word.partOfSpeech}</span> {word.definitionCN}</p>{word.lexiconSource&&<div className="vocabulary-evidence-note">{vocabularyLevelLabel(word)&&<span className="lexicon-tag advanced-level-tag">{vocabularyLevelLabel(word)}</span>}<span className="lexicon-tag">{word.lexiconSource.ieltsTagged?'雅思词表收录':'编辑补充词'}</span><span>BNC {word.lexiconSource.bncRank??'—'} · 当代 {word.lexiconSource.contemporaryRank??'—'}</span></div>}</div><div className="vocabulary-frequency"><span><b>{stats?.count??'—'}</b> {stats?'次':'待统计'}</span><small>覆盖 {stats?.documentFrequency??'—'} / {summary.documentCount} 段</small></div><div className="vocabulary-priority"><span className={`priority-pill ${stats?.priorityTier??'unknown'}`}>{stats?priorityLabels[stats.priorityTier]:'待统计'}</span><small>{topics.find(t=>t.id===sentenceMap[word.sentenceIds[0]].topic)?.short}</small></div><button className="vocabulary-action" onClick={()=>onLearn(word.id)}>{learned?'再回响':'去学习'}<ArrowRight size={15}/></button></article>;
    }):<div className="vocabulary-empty"><BookOpen size={29}/><p>这个筛选条件下，还没有找到单词。</p><button className="secondary-button" onClick={()=>{setQuery('');setTopic('all');setLevel('all');setAttestedOnly(false);}}>查看全部词汇</button></div>}</section>
    {filtered.length>0&&<nav className="vocabulary-pagination" aria-label="词库分页"><span>显示 {currentPage*pageSize+1}–{Math.min(filtered.length,(currentPage+1)*pageSize)} 项，共 {filtered.length} 词</span><div><button className="secondary-button" disabled={currentPage===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>上一页</button><span className="page-count">{currentPage+1} / {pageCount}</span><button className="secondary-button" disabled={currentPage>=pageCount-1} onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))}>下一页</button></div></nav>}
    <div className="vocabulary-footnote"><span>计数合并词库内已收录词形；阅读正文与听力录音稿分别清理后统计。</span><span>词频为本次样本中观察到的出现次数。</span></div>
    <details className="frequency-sources panel" id="frequency-sources"><summary><div><span className="eyebrow">SOURCES & SCOPE</span><h2>每一个数字，都有来处。</h2></div><ChevronDown size={20}/></summary><div className="frequency-source-content"><section className="lexicon-source-details"><h3>词库来源与例句署名</h3><p>选词参考 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener noreferrer">ECDICT 社区词典</a> 的雅思标签及其记录的 BNC / 当代通用语料排名。词表标签与通用语料排名随词卡展示，释义结合学习语境整理。进阶筛选采用六级、托福和 GRE 标签，并排除同源词表中的中考、高考与四级词；每张词卡展示对应标签。</p><p>编辑例句与 <a href="https://tatoeba.org/" target="_blank" rel="noopener noreferrer">Tatoeba 社区例句</a> 分别标识。Tatoeba 原句逐条保留作者、句子链接及 CC BY 2.0 FR 署名；对齐的中文译文保留独立署名。</p><p><a href={assetPath('/licenses/ECDICT-MIT.txt')} target="_blank" rel="noopener noreferrer">ECDICT MIT 许可</a> · <a href={assetPath('/licenses/WordNet.txt')} target="_blank" rel="noopener noreferrer">WordNet 许可</a></p></section><div className="frequency-method"><h3>怎样读这份词频</h3><p>「出现次数」累计单词及其已收录词形的总词次；「覆盖篇数」统计包含该词的内容单元数量。每个单元对应一篇阅读原文取得的片段，或一段听力录音稿；同源原文的不同题型片段合并统计。学习优先级综合参考覆盖篇数和出现次数。</p><p>统计范围为 IELTS.org 公开阅读样题和听力录音稿。正文与录音稿经重复内容清理，并排除题目说明、答案、页眉和标题。资料年份采用文件名或版权标记。</p><details><summary>查看可复算的优先级公式</summary><p>{corpusStatistics.method.priorityFormula}</p><p>优先分用于安排本次词库的学习顺序。</p></details></div><div className="frequency-source-list">{corpusStatistics.sources.map(source=><div className="frequency-source-row" key={source.id}><div><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={14}/></a><p>{source.publisher} · {source.passageCount} 篇{source.documentYear?` · ${source.yearBasis==='copyright'?'版权标记':'文档标记'} ${source.documentYear}`:''}</p><small>{source.kind.includes('listening')?'听力录音稿':source.kind.includes('excerpt')?'出版社公开节选':'官方公开样题'}</small></div></div>)}</div><p className="frequency-method-note">统计日期：{summary.generatedAt.slice(0,10)}。</p></div></details>
  </div>;
}


