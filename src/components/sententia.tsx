'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BookOpen, Bookmark, ChartNoAxesColumnIncreasing, Check, ChevronRight, CircleHelp, Keyboard, Leaf, LoaderCircle, Menu, Moon, Network, RefreshCw, RotateCcw, Search, Settings2, Sun, WifiOff, X } from 'lucide-react';
import { ArchiveView, MatrixView } from './library-views';
import { InsightsView, SettingsModal } from './insights-settings';
import { VocabularyView } from './vocabulary-view';
import { LearnView, ReviewView, localDay } from './study-views';
import { ConcurrentWriteError, loadData, replaceDataWithBackup, saveData } from '@/lib/store';
import { notifyLocalChange, resumeSync } from '@/lib/cloud-sync';
import { appPath, assetPath, BASE_PATH } from '@/lib/asset-path';
import { dueRecords } from '@/lib/scheduler';
import { sentenceMap, words } from '@/lib/corpus';
import type { AppData, View } from '@/lib/types';

const navigation = [
  { id: 'learn', label: '拾句台', english: 'Daily context', icon: BookOpen },
  { id: 'review', label: '回响', english: 'Spaced repetition', icon: RotateCcw },
  { id: 'matrix', label: '词脉', english: 'Paraphrase matrix', icon: Network },
  { id: 'archive', label: '句匣', english: 'Personal archive', icon: Bookmark },
] as const;
const viewNames: Record<View,string> = {learn:'拾句台',review:'回响',matrix:'词脉',archive:'句匣',insights:'学习足迹',vocabulary:'词库与词频'};

export default function Sententia() {
  const [data,setData]=useState<AppData|null>(null);
  const [storageError,setStorageError]=useState('');
  const [conflict,setConflict]=useState(false);
  const [view,setView]=useState<View>('learn');
  const [dark,setDark]=useState(false);
  const [settings,setSettings]=useState(false);
  const [help,setHelp]=useState(false);
  const [search,setSearch]=useState(false);
  const [mobileNav,setMobileNav]=useState(false);
  const [online,setOnline]=useState(true);
  const [toast,setToast]=useState('');
  const [focusWord,setFocusWord]=useState<string|null>(null);
  const [speaking,setSpeaking]=useState(false);
  const [clock,setClock]=useState<Date|null>(null);
  const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const latestData=useRef<AppData|null>(null);
  latestData.current=data;

  const notify=useCallback((message:string)=>{setToast(message);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4500);},[]);
  const navigate=useCallback((next:View)=>{setView(next);setFocusWord(null);setMobileNav(false);window.history.replaceState(null,'',appPath(next==='learn'?undefined:next));window.scrollTo({top:0,behavior:'smooth'});if('speechSynthesis'in window)window.speechSynthesis.cancel();setSpeaking(false);},[]);
  const focusConsumed=useCallback(()=>setFocusWord(null),[]);
  const openWord=useCallback((id:string)=>{const target=data?.records[id]?'review':'learn';navigate(target);setFocusWord(id);setSearch(false);},[data,navigate]);
  const reload=useCallback(async()=>{try{const loaded=await loadData();setData(loaded);setStorageError('');setConflict(false);void resumeSync(loaded).catch(()=>{});}catch(error){setStorageError(error instanceof Error?error.message:'本地数据暂时无法打开。');}},[]);
  const update=useCallback(async(next:AppData)=>{
    try {if(conflict)throw new ConcurrentWriteError();await saveData(next);setData(next);notifyLocalChange(next);}
    catch(error){if(error instanceof ConcurrentWriteError){setConflict(true);notify('另一个窗口更新了数据，请重新载入后继续。');}else notify(error instanceof Error?error.message:'保存未成功，请重试。');throw error;}
  },[conflict,notify]);
  const replaceFromCloud=useCallback(async(next:AppData)=>{
    if(conflict)throw new ConcurrentWriteError();
    await replaceDataWithBackup(next);
    setData(next);
  },[conflict]);

  const speak=useCallback((text:string)=>{
    if(!('speechSynthesis'in window)){notify('此浏览器不支持朗读，请使用最新版 Edge 或 Chrome。');return;}
    const synth=window.speechSynthesis;
    if(synth.speaking){synth.cancel();setSpeaking(false);return;}
    const utterance=new SpeechSynthesisUtterance(text);
    const voices=synth.getVoices();
    const voice=voices.find(v=>v.lang==='en-GB'&&/Sonia|Ryan|Daniel|Google|Natural/i.test(v.name))||voices.find(v=>v.lang==='en-GB')||voices.find(v=>v.lang.startsWith('en'));
    if(voice)utterance.voice=voice;
    utterance.lang='en-GB';utterance.rate=.88;
    utterance.onstart=()=>setSpeaking(true);
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=(e)=>{setSpeaking(false);if(e.error!=='interrupted'&&e.error!=='canceled')notify('当前设备的语音暂不可用，请检查系统语音设置。');};
    synth.speak(utterance);
  },[notify]);

  useEffect(()=>{
    void reload();
    const initial=new URLSearchParams(window.location.search).get('view');
    if(initial&&Object.hasOwn(viewNames,initial))setView(initial as View);
    setDark(document.documentElement.dataset.theme==='dark');setOnline(navigator.onLine);setClock(new Date());
    const connected=()=>{setOnline(navigator.onLine);if(navigator.onLine&&latestData.current)void resumeSync(latestData.current).catch(()=>{});};
    window.addEventListener('online',connected);window.addEventListener('offline',connected);
    const timer=setInterval(()=>setClock(new Date()),30000);
    if('speechSynthesis'in window)window.speechSynthesis.getVoices();
    if('serviceWorker'in navigator){
      if(process.env.NODE_ENV==='production')navigator.serviceWorker.register(assetPath('/sw.js')).catch(()=>{});
      else navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.filter(reg=>reg.scope===`${location.origin}${BASE_PATH}/`&&reg.active?.scriptURL===`${location.origin}${assetPath('/sw.js')}`).map(reg=>reg.unregister()))).catch(()=>{});
    }
    return()=>{window.removeEventListener('online',connected);window.removeEventListener('offline',connected);clearInterval(timer);if(toastTimer.current)clearTimeout(toastTimer.current);if('speechSynthesis'in window)window.speechSynthesis.cancel();};
  },[reload]);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!settings&&!help)setSearch(v=>!v);return;}
      if(e.key==='Escape'){setMobileNav(false);if(search)setSearch(false);if(help)setHelp(false);}
      if(document.querySelector('[role="dialog"]'))return;
      if(['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName))return;
      if(e.key==='?'){e.preventDefault();setHelp(true);}
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[settings,help,search]);

  function toggleTheme(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';try{localStorage.setItem('sententia-theme',next?'dark':'light');}catch{} }
  const today=localDay(clock??new Date());
  const learned=data?new Set(data.logs.filter(l=>l.mode==='learn'&&localDay(l.at)===today).map(l=>l.wordId)).size:0;
  const due=data?dueRecords(data,clock??new Date()).length:0;
  const dateLabel=clock?clock.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'}):'今日阅读';

  return <div className="app-shell">
    {mobileNav&&<button className="sidebar-scrim" aria-label="关闭导航" onClick={()=>setMobileNav(false)}/>}
    <aside className={`sidebar ${mobileNav?'is-open':''}`}>
      <button className="brand" onClick={()=>navigate('learn')} aria-label="Sententia 拾句首页"><img src={assetPath('/icon.svg')} alt="" width={39} height={39}/><div><span className="brand-name">Sententia<span className="brand-dot">.</span></span><span className="brand-chinese">拾 句 <i/> 在语境中生根</span></div></button>
      <div className="sidebar-nav-label">你的阅读空间 <span>WORKSPACE</span></div>
      <nav className="main-navigation" aria-label="主导航">{navigation.map(item=><button key={item.id} className={`nav-item ${view===item.id?'active':''}`} aria-current={view===item.id?'page':undefined} onClick={()=>navigate(item.id)}><item.icon size={19} strokeWidth={1.65}/><div>{item.label}<span>{item.english}</span></div>{item.id==='review'&&due>0?<span className="nav-count">{due}</span>:view===item.id?<span className="nav-active-dot"/>:null}</button>)}</nav>
      <div className="sidebar-divider"/>
      <button className={`nav-item insights-nav ${view==='vocabulary'?'active':''}`} onClick={()=>navigate('vocabulary')} aria-current={view==='vocabulary'?'page':undefined}><BookOpen size={19} strokeWidth={1.65}/><div>词库与词频<span>Words & evidence</span></div></button>
      <button className={`nav-item insights-nav ${view==='insights'?'active':''}`} onClick={()=>navigate('insights')} aria-current={view==='insights'?'page':undefined}><ChartNoAxesColumnIncreasing size={19} strokeWidth={1.65}/><div>学习足迹<span>Your reading journey</span></div></button>
      <div className="sidebar-bottom"><div className="sidebar-goal"><div><span><Leaf size={14}/> 每日一点，日久弥新</span><strong>{learned}<small> / {data?.preferences.dailyGoal??10}</small></strong></div><div className="mini-progress"><span style={{width:`${Math.min(100,learned/(data?.preferences.dailyGoal??10)*100)}%`}}/></div><p>{learned>=(data?.preferences.dailyGoal??10)?'今日目标已完成，静待回响。':'留一点时间，给词汇与自己。'}</p></div><div className="sidebar-quote"><span>“</span><p>We are what we<br/>repeatedly read.</p><small>让阅读，留下痕迹。</small></div><button className="profile-button" onClick={()=>{setMobileNav(false);setSettings(true);}} disabled={!data}><span className="avatar">{data?.preferences.name?.slice(0,1)||'拾'}</span><span className="profile-text">{data?.preferences.name||'拾句者'}<small>终身学习，始于一句</small></span><Settings2 size={17}/></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="打开导航" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><span>学习空间</span><ChevronRight size={13}/><strong>{viewNames[view]}</strong></div><div className="topbar-tools"><span className="topbar-date">{dateLabel}</span><span className="topbar-divider"/><button className="icon-button" onClick={()=>setSearch(true)} aria-label="搜索词汇" title="搜索词汇 Ctrl K"><Search size={18}/></button><button className="icon-button" onClick={toggleTheme} aria-label={dark?'切换到宣纸模式':'切换到书房模式'} title={dark?'宣纸 · Paper':'书房 · Study'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button help-button" onClick={()=>setHelp(true)} aria-label="键盘快捷键与帮助" title="快捷键 ?"><CircleHelp size={18}/></button>{!online&&<span className="offline-badge"><WifiOff size={13}/> 离线中</span>}</div></header>
      {conflict&&<div className="conflict-banner"><span>另一个窗口保存了新内容。重新载入后即可继续。</span><button onClick={()=>void reload()}><RefreshCw size={14}/> 重新载入</button></div>}
      <main className="main-content" id="main-content">{storageError?<div className="storage-error panel"><BookOpen size={35}/><h1>句匣暂时无法打开</h1><p>{storageError}</p><p>请允许此网站使用本地存储，然后重新打开。</p><button className="primary-button" onClick={()=>void reload()}><RefreshCw size={16}/> 重新打开</button></div>:!data?<div className="loading-state"><img src={assetPath('/icon.svg')} width={54} height={54} alt="拾句"/><p>为你翻开新的一页…</p><LoaderCircle size={20} className="spinner"/></div>:<AnimatePresence mode="wait"><motion.div key={view} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}>
        {view==='learn'&&<LearnView data={data} onChange={update} notify={notify} onNavigate={navigate} speak={speak} speaking={speaking} focusWord={focusWord} onFocusConsumed={focusConsumed} onSettings={()=>setSettings(true)}/>}
        {view==='review'&&<ReviewView data={data} onChange={update} notify={notify} onNavigate={navigate} speak={speak} speaking={speaking} focusWord={focusWord} onFocusConsumed={focusConsumed}/>}
        {view==='matrix'&&<MatrixView onLearn={openWord}/>}
        {view==='archive'&&<ArchiveView data={data} onChange={update} notify={notify} onReview={()=>navigate('review')}/>}
        {view==='insights'&&<InsightsView data={data} onNavigate={navigate}/>}
        {view==='vocabulary'&&<VocabularyView data={data} onLearn={openWord}/>}
      </motion.div></AnimatePresence>}</main><footer className="app-footer"><span>SENTENTIA <span>·</span> 拾句</span><p>读世界，也拾起更好的自己。</p><button onClick={()=>setHelp(true)}><Keyboard size={14}/> 快捷键 <kbd>?</kbd></button></footer>
    </div>
    <AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}><span className="toast-icon"><Check size={14}/></span>{toast}<button className="icon-button" onClick={()=>setToast('')} aria-label="关闭提示"><X size={14}/></button></motion.div>}</AnimatePresence>
    {settings&&data&&<SettingsModal data={data} onChange={update} onCloudReplace={replaceFromCloud} onClose={()=>setSettings(false)} notify={notify}/>}
    {help&&<HelpModal onClose={()=>setHelp(false)}/>}
    {search&&<SearchModal onClose={()=>setSearch(false)} onWord={openWord} data={data}/>}
  </div>;
}

function useModalFocus(ref:React.RefObject<HTMLDivElement|null>) {
  useEffect(()=>{const previous=document.activeElement as HTMLElement;const target=ref.current?.querySelector<HTMLElement>('input,button,[tabindex="0"]');target?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const items=ref.current?.querySelectorAll<HTMLElement>('input,button:not(:disabled),a,[tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',trap);document.body.style.overflow=old;previous?.focus();};},[ref]);
}

function HelpModal({onClose}:{onClose:()=>void}) {
  const ref=useRef<HTMLDivElement>(null);useModalFocus(ref);
  const shortcuts=[['1 – 4','学习时选择英文释义；复习核对后选择评分'],['Enter / Space','核对已选择的释义；复习时核对答案'],['Enter','学习解析后继续拾句'],['H','复习时逐步展开提示（输入框外）'],['← / →','揭示释义后，切换不同语境'],['U','撤销当前页面的上一次评分'],['Ctrl / ⌘ + K','查找词汇与释义'],['Esc','关闭弹窗；离开复习输入框']];
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" ref={ref}><div className="modal-header"><div><span className="eyebrow">A QUIETER WAY TO LEARN</span><h2 id="help-title">把专注，留给阅读。</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭帮助"><X size={20}/></button></div><p className="help-intro">用键盘翻页，让每一次思考自然衔接。</p><div className="shortcut-list">{shortcuts.map(([key,label])=><div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}</div><div className="help-note"><Leaf size={18}/><div><strong>本地学习，账号同步。</strong><p>在阅读偏好中登录账号、同步进度或导出备份。朗读使用设备提供的英语语音。</p></div></div></div></div>;
}

function SearchModal({onClose,onWord,data}:{onClose:()=>void;onWord:(id:string)=>void;data:AppData|null}) {
  const [query,setQuery]=useState('');const ref=useRef<HTMLDivElement>(null);useModalFocus(ref);
  const matches=words.filter(w=>`${w.word} ${w.forms.join(' ')} ${w.definitionCN} ${w.definitionEN}`.toLowerCase().includes(query.toLowerCase().trim())).slice(0,12);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal search-modal" role="dialog" aria-modal="true" aria-label="查找词汇" ref={ref}><div className="search-input-wrap"><Search size={20}/><input aria-label="查找词汇或释义" value={query} onChange={e=>setQuery(e.target.value)} placeholder="查找一个词，或一段释义…"/><button className="icon-button" onClick={onClose} aria-label="关闭搜索"><X size={18}/></button></div><div className="search-results-heading">{query?'词汇搜索结果':'从一个词，开始阅读'}<span>{matches.length} 个结果</span></div><div className="search-results">{matches.length?matches.map(word=><button key={word.id} onClick={()=>onWord(word.id)}><div><strong>{word.word}</strong><span>{word.partOfSpeech} {word.definitionCN}</span></div><span className="search-result-status">{data?.records[word.id]?'再回响':'去相识'}<ArrowRight size={14}/></span></button>):<div className="search-empty"><BookOpen size={28}/><p>还没有找到这个词。</p><small>试试中文释义；也可以把它所在的句子收入句匣。</small></div>}</div><div className="search-bottom"><span>当前词册 · {words.length} 个核心词 · {words.length*3} 条学习语境</span><kbd>Esc</kbd></div></div></div>;
}

