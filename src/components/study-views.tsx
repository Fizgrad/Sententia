'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, CheckCheck, ChevronDown, CircleHelp, Headphones, Leaf, Lightbulb, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { getReviewSentence, registerLabels, sentenceMap, topics, wordMap, words } from '@/lib/corpus';
import { dueRecords, formatInterval, previewSchedule, schedule } from '@/lib/scheduler';
import type { AppData, ContextSentence, Topic, View } from '@/lib/types';
import { createMeaningQuestion, judgeMeaning } from '@/lib/meaning-quiz';
import { MeaningChoices, type GuessResult } from './meaning-choices';
import { sortByCorpusPriority } from '@/lib/frequency';
import { SourceCredit } from './source-credit';
import { matchesVocabularyLevel, vocabularyLevels, type VocabularyLevel } from '@/lib/vocabulary-level';

type CommonProps = { data: AppData; onChange: (data: AppData) => Promise<void>; notify: (message: string) => void; onNavigate: (view: View) => void; speak: (text: string) => void; speaking: boolean };
export function localDay(date: Date | string = new Date()) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export function HighlightSentence({ sentence, cloze = false, hint = 0, answered = false }: { sentence: ContextSentence; cloze?: boolean; hint?: number; answered?: boolean }) {
  const [start, end] = sentence.targetSpan;
  return <>{sentence.text.slice(0, start)}{cloze && !answered ? <span className="cloze-blank" aria-label="待填单词">{hint ? sentence.text[start] : ''}<span>{'_'.repeat(Math.min(end-start-(hint ? 1 : 0), 13))}</span></span> : <mark>{sentence.text.slice(start, end)}</mark>}{sentence.text.slice(end)}</>;
}

function useStudyShortcut(handler: (event: KeyboardEvent) => void) {
  const callback = useRef(handler); callback.current = handler;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || document.querySelector('[role="dialog"]')) return;
      const tag = (event.target as HTMLElement).tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag) || (event.target as HTMLElement).isContentEditable) return;
      if (['BUTTON','A'].includes(tag) && (event.code==='Space'||event.key==='Enter')) return;
      callback.current(event);
    };
    window.addEventListener('keydown',listener); return () => window.removeEventListener('keydown', listener);
  }, []);
}

function SaveSentence({ sentence, data, onChange, notify }: Pick<CommonProps,'data'|'onChange'|'notify'> & { sentence: ContextSentence }) {
  const [pending, setPending] = useState(false);
  const saved = data.archive.some(a => a.text === sentence.text);
  async function save() {
    if (saved || pending) return;
    setPending(true);
    try {
      await onChange({ ...data, archive: [{ id: crypto.randomUUID(), text: sentence.text, topic: sentence.topic, source: sentence.source?'Tatoeba · CC BY 2.0 FR':'拾句原创 · 雅思语境', wordIds: [sentence.wordId], createdAt: new Date().toISOString(), sentenceId: sentence.id }, ...data.archive] });
      notify('这一句，已妥帖收入句匣。');
    } catch {} finally { setPending(false); }
  }
  return <button className={`icon-button bookmark-button ${saved?'saved':''}`} onClick={save} disabled={saved || pending} aria-label={saved?'已收入句匣':'收藏此句'} title={saved?'已收入句匣':'收藏此句'}>{saved?<BookmarkCheck size={19}/>:<Bookmark size={19}/>}</button>;
}

function SentenceMeta({ sentence, pos, onSpeak, speaking, save }: { sentence: ContextSentence; pos: string; onSpeak: () => void; speaking: boolean; save: React.ReactNode }) {
  return <div className="sentence-meta"><div className="sentence-source"><span className="source-dot"/>{registerLabels[sentence.register]}<span className="meta-divider"/>{sentence.id.startsWith('archive-')?'个人收藏':sentence.source?'Tatoeba':'原创语境'}</div><div className="sentence-tools"><span className="part-of-speech">[{pos}]</span><span className="topic-pill">#{sentence.topic}</span><button className={`icon-button ${speaking?'is-speaking':''}`} onClick={onSpeak} aria-label="英式发音朗读" title="英式发音朗读"><Volume2 size={19}/></button>{save}</div></div>;
}

export function LearnView({ data, onChange, notify, onNavigate, speak, speaking, focusWord, onFocusConsumed, onSettings }: CommonProps & { focusWord: string | null; onFocusConsumed: () => void; onSettings: () => void }) {
  const [selection, setSelection] = useState<{wordId:string;optionId:string}|null>(null);
  const [result, setResult] = useState<GuessResult|null>(null);
  const [context, setContext] = useState(0);
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [order, setOrder] = useState<'priority'|'original'>('priority');
  const [level, setLevel] = useState<VocabularyLevel>('advanced');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [bonus, setBonus] = useState(false);
  const [undo, setUndo] = useState<{before:AppData;wordId:string;logId:string;context:number;result:GuessResult}|null>(null);
  const [pinned, setPinned] = useState<string|null>(focusWord);
  const today = localDay();
  const learnedToday = new Set(data.logs.filter(l => l.mode==='learn' && localDay(l.at)===today).map(l=>l.wordId)).size;
  const candidates = useMemo(()=>{const pool=words.filter(w=>!data.records[w.id] && (w.id===pinned || (matchesVocabularyLevel(w,level) && (topic==='all' || sentenceMap[w.sentenceIds[0]].topic===topic))));return order==='priority'?sortByCorpusPriority(pool):pool;},[data.records,topic,order,level,pinned]);
  const word = (pinned && candidates.find(w=>w.id===pinned)) || candidates[0];
  const sentence = word ? sentenceMap[word.sentenceIds[context]] : null;
  const question = useMemo(()=>word?createMeaningQuestion(word,words):null,[word?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const revealed = !!word && result?.wordId===word.id;
  const selected = selection?.wordId===word?.id ? selection?.optionId??null : null;
  const nextInterval = useMemo(()=>previewSchedule(undefined,data.preferences.retention).find(p=>p.rating===(result?.correct?3:1))?.interval,[data.preferences.retention,result?.correct]);
  const goalComplete = learnedToday >= data.preferences.dailyGoal && !bonus && topic==='all';
  const due = dueRecords(data).length;

  useEffect(()=>{ if (focusWord) { setPinned(focusWord);setTopic('all');setBonus(true);setResult(null);setSelection(null);setContext(0);onFocusConsumed(); } }, [focusWord,onFocusConsumed]);
  useEffect(()=>{ if (word && data.preferences.autoSpeak) speak(sentenceMap[word.sentenceIds[0]].text); /* Read only when advancing to a new word. */ }, [word?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectOption(optionId:string) { if(question&&!revealed&&question.options.some(option=>option.id===optionId))setSelection({wordId:question.wordId,optionId}); }
  function confirmGuess(skip=false) { if(!question||revealed||(!skip&&!selected))return;const optionId=skip?null:selected;setResult({wordId:question.wordId,optionId,correct:judgeMeaning(question,optionId)}); }

  async function grade() {
    if (!word || !sentence || !revealed || !result || pending) return;
    const rating = result.correct ? 3 : 1;
    setPending(true);
    try {
      const now = new Date();
      const record = schedule(undefined,word.id,sentence.id,rating,data.preferences.retention,now);
      const logId=crypto.randomUUID();
      await onChange({ ...data, records: { ...data.records,[word.id]:record }, logs: [...data.logs,{id:logId,wordId:word.id,sentenceId:sentence.id,rating,mode:'learn',at:now.toISOString(),guess:{choiceId:result.optionId,correct:result.correct}}] });
      setUndo({before:data,wordId:word.id,logId,context,result});setResult(null);setSelection(null);setContext(0);setPinned(null);
      notify(rating===1?'没关系，下一次相遇已安排。':'已记下这一词，复习时再相遇。');
    } catch {} finally { setPending(false); }
  }
  async function undoLast() {
    if(!undo||pending)return;
    if(!data.logs.some(l=>l.id===undo.logId)){setUndo(null);notify('这条记录已更新，无法继续撤销。');return;}
    setPending(true);
    try {const records={...data.records};if(undo.before.records[undo.wordId])records[undo.wordId]=undo.before.records[undo.wordId];else delete records[undo.wordId];await onChange({...data,records,logs:data.logs.filter(l=>l.id!==undo.logId)});setPinned(undo.wordId);setTopic('all');setBonus(true);setContext(undo.context);setResult(undo.result);setSelection(undo.result.optionId?{wordId:undo.wordId,optionId:undo.result.optionId}:null);setUndo(null);notify('已撤销上一次标记。');}catch{}finally{setPending(false);}
  }
  useStudyShortcut(e=>{
    if(e.code==='Space' || e.key==='Enter'){ e.preventDefault(); if(!revealed)confirmGuess();else if(e.key==='Enter')void grade(); }
    if(!revealed && /^[1-4]$/.test(e.key) && question){e.preventDefault();selectOption(question.options[Number(e.key)-1].id);}
    if(e.key.toLowerCase()==='u')void undoLast();
    if(revealed && e.key==='ArrowRight')setContext(c=>(c+1)%3);
    if(revealed && e.key==='ArrowLeft')setContext(c=>(c+2)%3);
  });

  return <>
    <div className="page-heading learn-heading"><div><div className="eyebrow"><span className="tiny-line"/> A LITTLE CONTEXT. A LASTING MEMORY.</div><h1>把单词，读进<span className="title-accent">记忆里。</span></h1><p>不急着看答案。让每一个新词，在真实的语境里与你相遇。</p></div><button className="secondary-button plan-button" onClick={onSettings}><Leaf size={15}/> 我的学习计划</button></div>
    <div className="stats-row">
      <button className="stat-card" onClick={()=>onNavigate('insights')}><div className="stat-icon"><Sparkles size={20}/></div><div><span className="stat-label">今日拾句</span><div className="stat-value">{learnedToday}<span>/ {data.preferences.dailyGoal} 词</span></div></div><span className="stat-note">慢慢来，比较快</span></button>
      <button className="stat-card" onClick={()=>onNavigate('review')}><div className="stat-icon amber"><RotateCcw size={20}/></div><div><span className="stat-label">等待回响</span><div className="stat-value">{due}<span>词待复习</span></div></div><ArrowRight size={17} className="stat-arrow"/></button>
      <button className="stat-card" onClick={()=>onNavigate('insights')}><div className="stat-icon blue"><BookmarkCheck size={20}/></div><div><span className="stat-label">词汇足迹</span><div className="stat-value">{Object.values(data.records).filter(r=>r.card.reps>0).length}<span>词已相识</span></div></div><span className="stat-note">每一步，都算数</span></button>
    </div>
    <div className="workspace-grid"><div className="learning-column">
      <div className="priority-learning-link"><span>{words.length} 词 · {words.length*3} 条学习语境</span><button onClick={()=>onNavigate('vocabulary')}>查看词频与来源 <ArrowRight size={14}/></button></div>
      <div className="learning-filters"><label className="learning-order-select">词汇难度<select aria-label="学习词汇难度" value={level} onChange={e=>{setLevel(e.target.value as VocabularyLevel);setResult(null);setSelection(null);setContext(0);setPinned(null);}}>{vocabularyLevels.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="learning-order-select">学习顺序<select aria-label="学习顺序" value={order} onChange={e=>{setOrder(e.target.value as typeof order);setResult(null);setSelection(null);setContext(0);setPinned(null);}}><option value="priority">官方样题语料优先级</option><option value="original">词册顺序</option></select></label></div>
      <div className="section-heading"><h2>今日语境 <span>THE DAILY CONTEXT</span></h2><div className="topic-filter"><button className="text-button" aria-expanded={filterOpen} onClick={()=>setFilterOpen(!filterOpen)}>{topic==='all'?'全部话题':topics.find(t=>t.id===topic)?.short}<ChevronDown size={14}/></button>{filterOpen&&<div className="filter-menu">{[{id:'all',short:'全部话题'},...topics].map(t=><button className={topic===t.id?'selected':''} key={t.id} onClick={()=>{setTopic(t.id as Topic|'all');setFilterOpen(false);setContext(0);setResult(null);setSelection(null);setPinned(null);}}>{t.short}{topic===t.id&&<Check size={13}/>}</button>)}</div>}</div></div>
      {goalComplete || !word || !sentence ? <div className="panel completion-panel"><div className="completion-mark"><CheckCheck size={37}/></div><div className="eyebrow">A CHAPTER WELL READ</div><h2>{goalComplete?'今天的积累，已经生根。':topic==='all'?'这一册，已与你相识。':'这个话题，暂时读到这里。'}</h2><p>{goalComplete?`你今天已拾得 ${learnedToday} 个新词。给记忆一点时间，再听听它们的回响。`:'已学过的词会按记忆状态安排复习。你也可以在句匣加入新的个人语境。'}</p><div className="completion-actions"><button className="primary-button" onClick={()=>onNavigate('review')}>去听回响 <ArrowRight size={16}/></button>{goalComplete?<button className="secondary-button" onClick={()=>setBonus(true)}>再拾一句</button>:<button className="secondary-button" onClick={()=>{setTopic('all');onNavigate('archive');}}>打开句匣</button>}</div></div> : <>
      <motion.article className="study-card panel" key={word.id} initial={{opacity:0,y:9}} animate={{opacity:1,y:0}} transition={{duration:.3}}>
        <div className="card-topline"><span className="card-edition">SENTENTIA <span>·</span> DAILY READING</span><span className="card-number">{String(learnedToday+1).padStart(2,'0')} <span>/ {String(Math.max(data.preferences.dailyGoal,learnedToday+1)).padStart(2,'0')}</span></span></div>
        <SentenceMeta sentence={sentence} pos={word.partOfSpeech} onSpeak={()=>speak(sentence.text)} speaking={speaking} save={<SaveSentence sentence={sentence} data={data} onChange={onChange} notify={notify}/>}/>
        <div className="sentence-reading"><span className="opening-quote" aria-hidden="true">“</span><AnimatePresence mode="wait"><motion.p className="context-sentence" key={sentence.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}><HighlightSentence sentence={sentence}/></motion.p></AnimatePresence></div>
        {question&&<MeaningChoices question={question} selected={selected} result={revealed?result:null} onSelect={selectOption} onConfirm={()=>confirmGuess()} onSkip={()=>confirmGuess(true)}/>}
        <AnimatePresence initial={false}>{revealed&&<motion.div className="reveal-panel" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.3}}><div className="reveal-inner"><div className="word-heading"><h3>{word.word}</h3><span title={word.contextOrigin?'词典来源音标，未逐词核实英美变体':'英式音标'}>{word.phoneticUK}</span><span className="band-pill" title="拾句编辑学习层级">{word.ieltsBand===6?'基础拓展':word.ieltsBand===7?'进阶词汇':'学术表达'}</span></div><p className="definition-en">{word.definitionEN}</p><p className="definition-cn">{word.definitionCN}</p><div className="collocation-block"><span className="small-label"><Sparkles size={13}/> {sentence.source?'句中词块':'黄金搭配'}</span><span className="collocation">{sentence.collocation}</span></div>{sentence.translation&&<details className="translation"><summary>查看整句译文 <ChevronDown size={13}/></summary><p>{sentence.translation}</p></details>}<SourceCredit sentence={sentence}/><div className="context-switch"><span>换个语境，再读一次</span><div>{word.sentenceIds.map((id,i)=><button key={id} className={context===i?'active':''} onClick={()=>setContext(i)} aria-pressed={context===i} title={sentenceMap[id].register==='Example'?`语境例句 ${i+1}`:registerLabels[sentenceMap[id].register]}>{i+1}<span>{registerLabels[sentenceMap[id].register]}</span></button>)}</div></div></div></motion.div>}</AnimatePresence>
        <div className="card-bottom"><span><span className="step-dot done"><Check size={10}/></span> 读语境</span><i/><span className={!revealed?'current-label':''}><span className={`step-dot ${revealed?'done':'current'}`}>{revealed?<Check size={10}/>:2}</span> 选词义</span><i/><span className={revealed?'current-label':''}><span className={`step-dot ${revealed?'current':''}`}>3</span> 看解析</span></div>
      </motion.article>
      <div className="study-action-area">{!revealed?<span className="quiz-keyboard-hint"><kbd>1</kbd>–<kbd>4</kbd> 选择释义，<kbd>Enter</kbd> 核对答案</span>:<><button className="primary-button guess-next-button" disabled={pending} onClick={()=>void grade()}>继续拾句 <ArrowRight size={17}/></button><p className="guess-followup-note">{result?.correct?'读懂了，再用主动回忆巩固。':'这个词需要再巩固一下。'}继续后，下次回响安排在{nextInterval}。</p><span className="quiz-keyboard-hint">按 <kbd>Enter</kbd> 留下这个词，翻开下一句</span></>}</div>
      </>}
      <div className="learning-footer"><span><span className="secure-dot"/> 学习进度自动保存在此设备</span><button className="text-button" disabled={!undo||pending} onClick={()=>void undoLast()}><ArrowLeft size={13}/> 撤销上一步 <kbd>U</kbd></button></div>
    </div><aside className="context-aside"><DailyIntention learned={learnedToday} goal={data.preferences.dailyGoal} onSettings={onSettings}/><div className="editor-note"><span className="small-label"><Lightbulb size={14}/> 拾句小笺</span><h3>先理解，<br/>再让记忆发生。</h3><p>先从上下文推测词义，<br/>再比较英文选项。<br/>那一点点思考，会留下更深的印记。</p><span className="note-bottom">MAKE IT MEANINGFUL.</span><Leaf className="note-leaf" size={67} strokeWidth={.8}/></div><button className="aside-link" onClick={()=>onNavigate('matrix')}><span className="aside-link-icon"><Headphones size={18}/></span><span>不止认识，还要会用<small>去词脉，读懂同义词的分寸</small></span><ArrowRight size={16}/></button></aside></div>
  </>;
}

function DailyIntention({learned,goal,onSettings}:{learned:number;goal:number;onSettings:()=>void}) {
  const pct=Math.min(learned/goal,1);
  return <div className="daily-intention panel"><div className="intention-title"><h3>今日的一小步</h3><span className="small-label">DAILY INTENTION</span></div><div className="progress-circle"><svg viewBox="0 0 120 120" aria-label={`今日目标完成 ${Math.round(pct*100)}%`}><circle className="circle-track" cx="60" cy="60" r="50"/><circle className="circle-progress" cx="60" cy="60" r="50" strokeDasharray={`${pct*314.16} 314.16`}/></svg><div><strong>{learned}<span> / {goal}</span></strong><small>让积累，自然而然</small></div></div><div className="intention-bottom"><span>每天 {goal} 词，日积月累</span><button onClick={onSettings}>调整目标 <ArrowRight size={12}/></button></div></div>;
}

export function ReviewView({data,onChange,notify,onNavigate,speak,speaking,focusWord,onFocusConsumed}:{focusWord:string|null;onFocusConsumed:()=>void}&CommonProps) {
  const [tick,setTick]=useState(Date.now());
  const [hint,setHint]=useState(0);
  const [answer,setAnswer]=useState('');
  const [answered,setAnswered]=useState(false);
  const [pending,setPending]=useState(false);
  const [reviewed,setReviewed]=useState(0);
  const [undo,setUndo]=useState<{before:AppData;wordId:string;logId:string}|null>(null);
  const [forced,setForced]=useState<string|null>(focusWord);
  const inputRef=useRef<HTMLInputElement>(null);
  const initialCount=useRef(dueRecords(data).length);
  useEffect(()=>{const timer=setInterval(()=>setTick(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(focusWord){setForced(focusWord);setAnswered(false);setAnswer('');setHint(0);onFocusConsumed();}},[focusWord,onFocusConsumed]);
  const queue=useMemo(()=>dueRecords(data,new Date(tick)),[data,tick]);
  const record=(forced && data.records[forced]) || queue[0];
  const word=record?wordMap[record.id]:null;
  const sentence=useMemo(()=>word&&record?getReviewSentence(word,record.lastSentenceId,record.seenSentenceIds,data.archive):null,[word?.id,record?.lastSentenceId,record?.card.reps,data.archive]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview=useMemo(()=>previewSchedule(record||undefined,data.preferences.retention,new Date(tick)),[record,data.preferences.retention,tick]);
  const correct=!!word && !!sentence && [word.word,...word.forms,sentence.text.slice(...sentence.targetSpan)].some(w=>w.toLowerCase()===answer.trim().toLowerCase());
  const upcoming=Object.values(data.records).filter(r=>new Date(r.card.due).getTime()>Date.now()).sort((a,b)=>Date.parse(a.card.due)-Date.parse(b.card.due));
  useEffect(()=>{if(word&&!answered)inputRef.current?.focus();},[word?.id,answered]);
  function check(){ if(!word||!sentence||answered)return;setAnswered(true);inputRef.current?.blur(); }
  async function grade(rating:1|2|3|4){
    if(!word||!sentence||!record||!answered||pending)return;
    setPending(true);
    try {const now=new Date();const next=schedule(record,word.id,sentence.id,rating,data.preferences.retention,now);const logId=crypto.randomUUID();await onChange({...data,records:{...data.records,[word.id]:next},logs:[...data.logs,{id:logId,wordId:word.id,sentenceId:sentence.id,rating,mode:'review',at:now.toISOString()}]});setUndo({before:data,wordId:word.id,logId});setForced(null);setHint(0);setAnswer('');setAnswered(false);setReviewed(n=>n+1);setTick(Date.now());notify(`已安排下次回响：${formatInterval(new Date(next.card.due))}。`);}catch{}finally{setPending(false);}
  }
  async function undoLast(){if(!undo||pending)return;if(!data.logs.some(l=>l.id===undo.logId)){setUndo(null);notify('这条记录已更新，无法继续撤销。');return;}setPending(true);try{await onChange({...data,records:{...data.records,[undo.wordId]:undo.before.records[undo.wordId]},logs:data.logs.filter(l=>l.id!==undo.logId)});setForced(undo.wordId);setUndo(null);setReviewed(n=>Math.max(0,n-1));setAnswered(false);setAnswer('');setHint(0);setTick(Date.now());notify('已撤销上一次评分。');}catch{}finally{setPending(false);}}
  useStudyShortcut(e=>{if(e.key.toLowerCase()==='h'&&!answered){e.preventDefault();setHint(h=>Math.min(2,h+1));}if((e.key==='Enter'||e.code==='Space')&&!answered){e.preventDefault();check();}if(answered&&/^[1-4]$/.test(e.key))void grade(Number(e.key) as 1|2|3|4);if(e.key.toLowerCase()==='u')void undoLast();});
  return <><div className="page-heading"><div><div className="eyebrow"><span className="tiny-line"/> EVERY WORD DESERVES AN ECHO.</div><h1>让记忆，有<span className="title-accent">回响。</span></h1><p>换一个句子，重新想起。主动提取，让熟悉成为真正的掌握。</p></div><span className="review-count-pill"><RotateCcw size={14}/> 本轮已复习 {reviewed} 词</span></div>
  <div className="workspace-grid"><div className="learning-column"><div className="section-heading"><h2>语境完形 <span>ACTIVE RECALL</span></h2><span className="small-label">{queue.length} 词待复习</span></div>
  {word&&sentence&&record?<><motion.article className="study-card panel review-card" key={`${word.id}-${record.card.reps}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="card-topline"><span className="card-edition">SENTENTIA <span>·</span> THE ECHO</span><span className="card-number">{String(reviewed+1).padStart(2,'0')} <span>/ {String(Math.max(initialCount.current,reviewed+queue.length,1)).padStart(2,'0')}</span></span></div><SentenceMeta sentence={sentence} pos={word.partOfSpeech} onSpeak={()=>speak(answered?sentence.text:sentence.text.slice(0,sentence.targetSpan[0])+' blank '+sentence.text.slice(sentence.targetSpan[1]))} speaking={speaking} save={<SaveSentence sentence={sentence} data={data} onChange={onChange} notify={notify}/>}/><div className="sentence-reading"><span className="opening-quote" aria-hidden="true">“</span><p className="context-sentence"><HighlightSentence sentence={sentence} cloze hint={hint} answered={answered}/></p></div>
  {!answered?<div className="recall-form"><label htmlFor="recall-answer">那个词，你还记得吗？</label><form onSubmit={e=>{e.preventDefault();check();}}><input ref={inputRef} id="recall-answer" autoComplete="off" autoCapitalize="off" spellCheck={false} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.blur();}} placeholder="输入你想起的单词…"/><button type="submit" className="primary-button">核对答案 <ArrowRight size={16}/></button></form><div className="recall-hint-row"><button className="text-button" disabled={hint>=2} onClick={()=>setHint(h=>Math.min(2,h+1))}><Lightbulb size={14}/>{hint===0?'给我一点提示':hint===1?'再多一点提示':'提示已展开'} <kbd>H</kbd></button><button className="text-button" onClick={check}>暂时想不起来 <ArrowRight size={13}/></button></div>{hint>=1&&<div className="hint-panel"><span className="small-label">首字母提示</span><strong>{sentence.text[sentence.targetSpan[0]]}{'_'.repeat(Math.min(word.word.length-1,12))}</strong>{hint>=2&&<p>{word.definitionEN}</p>}</div>}</div>:<motion.div className="answer-panel" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}><div className={`answer-feedback ${correct?'correct':''}`}>{correct?<CheckCheck size={17}/>:<Lightbulb size={17}/>}<span>{correct?'你想起来了。把这一份记忆留住。':answer.trim()?`你填写了「${answer.trim()}」。再读一次，让语境帮你记住。`:'想不起来，也是在发现下一次进步的地方。'}</span></div><div className="word-heading"><h3>{word.word}</h3><span>{word.phoneticUK}</span></div><p className="definition-en">{word.definitionEN}</p><p className="definition-cn">{word.definitionCN}</p>{sentence.translation&&<p className="review-translation">{sentence.translation}</p>}<SourceCredit sentence={sentence}/></motion.div>}
  <div className="review-card-bottom"><span><span className="source-dot"/> 不同的语境，同一个词</span><span>第 {record.card.reps+1} 次主动提取</span></div></motion.article>{answered&&<div className="rating-area"><p>根据真实的回忆难度，安排下一次相遇</p><div className="rating-buttons">{preview.map((item,i)=><button key={item.rating} className={`rating-button rating-${item.rating}`} disabled={pending} onClick={()=>void grade(item.rating)}><span><kbd>{i+1}</kbd>{item.label}</span><strong>{item.interval}</strong></button>)}</div>{(!correct || hint>0)&&<span className="keyboard-hint">{!correct?'这次未能准确回忆，建议选择「重来」。':'你使用了提示，评分时也请把这一点考虑进去。'}</span>}</div>}</>:<div className="panel completion-panel review-empty"><div className="completion-mark">{reviewed>0?<CheckCheck size={37}/>:<Leaf size={37}/>}</div><div className="eyebrow">{reviewed?'LET THE MEMORY SETTLE':'MAKE ROOM FOR A NEW WORD'}</div><h2>{reviewed?'这一轮回响，已收好。':Object.keys(data.records).length?'现在，让记忆慢慢生长。':'每一声回响，都从相识开始。'}</h2><p>{upcoming.length?`下一次回响将在${formatInterval(new Date(upcoming[0].card.due))}。现在可以继续拾句，或者读读词脉。`:'先在拾句台认识一个新词，再回来听听记忆的回响。'}</p><button className="primary-button" onClick={()=>onNavigate('learn')}>去拾一句 <ArrowRight size={16}/></button>{upcoming.length>0&&<button className="text-button early-review" onClick={()=>{setForced(upcoming[0].id);setHint(0);setAnswer('');setAnswered(false);}}>提前复习一个词 <ArrowRight size={13}/></button>}</div>}
  <div className="learning-footer"><span><span className="secure-dot"/> 按你的记忆状态，动态安排复习</span><button className="text-button" disabled={!undo||pending} onClick={()=>void undoLast()}><ArrowLeft size={13}/> 撤销评分 <kbd>U</kbd></button></div></div><aside className="context-aside"><div className="panel review-guide"><span className="small-label"><CircleHelp size={14}/> 怎样才算记住？</span><h3>不是看着眼熟，<br/>而是能想起来。</h3><p>先试着独立提取，再使用提示。真实的反馈，才能让复习时间更适合你。</p><div className="guide-steps"><div><span>01</span><p>读懂句子的逻辑</p></div><div><span>02</span><p>主动回想缺少的词</p></div><div><span>03</span><p>诚实评估回忆难度</p></div></div></div><div className="editor-note small-note"><span className="small-label">SPACED, NOT RUSHED.</span><h3>适当的遗忘，<br/>是下一次记住的开始。</h3><p>FSRS 会根据每次评分，<br/>调整这个词的下一次复习时间。</p><Leaf className="note-leaf" size={60} strokeWidth={.8}/></div></aside></div></>;
}
