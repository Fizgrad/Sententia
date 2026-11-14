'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, ArrowRight, BookOpen, Bookmark, Check, ChevronDown, CircleHelp, Layers3, Lightbulb, Plus, Quote, Search, Sparkles, Trash2, X } from 'lucide-react';
import { detectTopic, detectWords, findWordMatches, paraphraseGroups, sentenceMap, topics, wordMap } from '@/lib/corpus';
import { SourceCredit } from './source-credit';
import { createQueuedRecord } from '@/lib/scheduler';
import type { AppData, ArchiveEntry, ParaphraseCategory, Topic } from '@/lib/types';
import './library-views.css';

function LibraryDialog({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = dialog.current?.querySelector<HTMLElement>('[data-autofocus], button, textarea, input, select');
    first?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []);
      const firstElement = items[0];
      const lastElement = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) { event.preventDefault(); lastElement?.focus(); }
      else if (!event.shiftKey && document.activeElement === lastElement) { event.preventDefault(); firstElement?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop library-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={`modal library-modal ${className}`} ref={dialog} role="dialog" aria-modal="true" aria-label={title}>
      <div className="library-dialog-heading"><div><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭弹窗"><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}

export function HighlightWords({ text, wordIds, className = '' }: { text: string; wordIds: string[]; className?: string }) {
  const matches = findWordMatches(text, wordIds);
  if (!matches.length) return <span className={className}>{text}</span>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    parts.push(text.slice(cursor, match.start));
    parts.push(<mark key={match.start}>{text.slice(match.start, match.end)}</mark>);
    cursor = match.end;
  }
  parts.push(text.slice(cursor));
  return <span className={className}>{parts}</span>;
}

function HighlightSynonym({ text, word }: { text: string; word: string }) {
  const index = text.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return <>{text}</>;
  return <>{text.slice(0, index)}<strong>{text.slice(index, index + word.length)}</strong>{text.slice(index + word.length)}</>;
}

export function MatrixView({ onLearn }: { onLearn: (wordId: string) => void }) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [selected, setSelected] = useState<[number, number]>([0, 1]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | ParaphraseCategory>('all');
  const groupList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = groupList.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !active) return;
    const area = list.getBoundingClientRect(), item = active.getBoundingClientRect();
    if (item.top < area.top) list.scrollTop += item.top - area.top;
    else if (item.bottom > area.bottom) list.scrollTop += item.bottom - area.bottom;
    if (item.left < area.left) list.scrollLeft += item.left - area.left;
    else if (item.right > area.right) list.scrollLeft += item.right - area.right;
  }, [groupIndex, query, category]);
  const findGroups = (value: string, filter: 'all' | ParaphraseCategory) => {
    const terms = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return paraphraseGroups.map((item, index) => ({ item, index })).filter(({ item }) => {
      const text = `${item.title} ${item.words.map(word => `${word.word} ${word.meaning} ${word.collocations.join(' ')}`).join(' ')}`.toLowerCase();
      return (filter === 'all' || item.category === filter) && terms.every(term => text.includes(term));
    });
  };
  const filteredGroups = findGroups(query, category);
  function searchGroups(value: string, filter: 'all' | ParaphraseCategory = category) {
    setQuery(value);
    setCategory(filter);
    const matches = findGroups(value, filter);
    if (matches.length && !matches.some(match => match.index === groupIndex)) {
      setGroupIndex(matches[0].index);
      setSelected([0, 1]);
    }
  }
  const group = paraphraseGroups[groupIndex];
  const choose = (slot: number, index: number) => {
    setSelected(previous => {
      const next = [...previous] as [number, number];
      const opposite = slot === 0 ? 1 : 0;
      if (next[opposite] === index) next[opposite] = next[slot];
      next[slot] = index;
      return next;
    });
  };
  return <div className="library-view matrix-view">
    <div className="page-heading library-page-heading">
      <div><div className="eyebrow">THE PARAPHRASE ATLAS</div><h1>词有近义，<span>用有分寸。</span></h1><p>读懂词与词之间的细微差别，把恰当的表达写进下一篇文章。</p></div>
      <span className="matrix-count"><Layers3 size={19} /><strong>{String(paraphraseGroups.length).padStart(2, '0')}</strong> 个语义簇</span>
    </div>
    <div className="matrix-workspace">
      <aside className="matrix-index" aria-label="选择语义簇"><div className="eyebrow">EXPLORE THE NUANCE</div><h2>沿着词义，读深一点。</h2>
        <div className="matrix-search"><Search size={16} aria-hidden="true"/><input aria-label="搜索词脉或单词" placeholder="搜索词脉或单词…" value={query} onChange={event => searchGroups(event.target.value)}/>{query && <button className="icon-button" aria-label="清除词脉搜索" onClick={() => searchGroups('')}><X size={15}/></button>}</div>
        <label className="matrix-category"><span>分类</span><select aria-label="词脉分类" value={category} onChange={event => searchGroups(query, event.target.value as 'all' | ParaphraseCategory)}><option value="all">全部词脉</option><option value="action">动作与过程</option><option value="quality">描述与判断</option><option value="concept">概念与事物</option></select></label>
        <p className="matrix-match-count" role="status">显示 {filteredGroups.length} / {paraphraseGroups.length} 个语义簇</p>
        <div className="matrix-group-list" ref={groupList}>{filteredGroups.map(({ item, index }) => <button key={item.id} className={`matrix-group ${groupIndex === index ? 'active' : ''}`} onClick={() => { setGroupIndex(index); setSelected([0, 1]); }} aria-pressed={groupIndex === index}>
          <span className="matrix-group-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.words.slice(0, 2).map(w => w.word).join(' / ')}</small></span><ArrowRight size={15} />
        </button>)}</div>
        {!filteredGroups.length && <div className="matrix-search-empty"><p>还没有匹配的语义簇。</p><button className="text-button" onClick={() => searchGroups('', 'all')}>查看全部词脉</button></div>}
        <div className="matrix-index-note"><BookOpen size={18} /><p>记住一个词，<br />也记住它习惯相伴的词。</p></div>
      </aside>
      <section className="matrix-main" aria-label={group.title} hidden={!filteredGroups.length}>
        <div className="matrix-section-heading"><span className="eyebrow">{String(groupIndex + 1).padStart(2, '0')} / SEMANTIC CLUSTER</span><h2>{group.title}</h2><p>{group.subtitle}</p></div>
        <div className="matrix-word-row" aria-label="语义簇内的词">{group.words.map((item, index) => <button key={item.word} className={`matrix-word-chip ${selected.includes(index) ? 'selected' : ''}`} onClick={() => choose(selected[0] === index ? 1 : 0, index)} aria-pressed={selected.includes(index)}>{item.word}<span>{selected[0] === index ? 'A' : selected[1] === index ? 'B' : '+'}</span></button>)}</div>
        <div className="matrix-comparison">{selected.map((wordIndex, slot) => {
          const item = group.words[wordIndex];
          return <article className="panel matrix-word-card" key={`${slot}-${item.word}`}>
            <div className="matrix-card-top"><span className="matrix-slot">{slot === 0 ? 'A' : 'B'}</span><label className="matrix-select"><span className="sr-only">选择对比词 {slot === 0 ? 'A' : 'B'}</span><select value={wordIndex} onChange={event => choose(slot, Number(event.target.value))}>{group.words.map((option, index) => <option key={option.word} value={index}>{option.word}</option>)}</select><ChevronDown size={13} /></label></div>
            <h3>{item.word}</h3><p className="matrix-meaning">{wordMap[item.word] && <span className="matrix-pos">[{wordMap[item.word].partOfSpeech}]</span>}{item.meaning}</p>
            <div className="matrix-card-divider" />
            <span className="eyebrow">NATURAL COLLOCATIONS</span><div className="matrix-collocations">{item.collocations.map(collocation => <span key={collocation}>{collocation}</span>)}</div>
            <blockquote lang="en"><HighlightSynonym text={item.example} word={item.word} /></blockquote>
            <div className="matrix-note"><span className="matrix-note-label">用词分寸</span><p>{item.note}</p></div>
            {wordMap[item.word] && <button className="matrix-learn-link" onClick={() => onLearn(item.word)}>在拾句台学习 <ArrowRight size={15} /></button>}
          </article>;
        })}</div>
        <div className="matrix-insight"><span className="matrix-insight-icon"><Lightbulb size={20} /></span><div><strong>写作时，多想一步</strong><p>{group.tip}</p></div></div>
      </section>
    </div>
    <p className="library-footnote"><span /> 对比例句为拾句原创；替换表达时，请同时留意搭配、词性与语境。</p>
  </div>;
}

interface ArchiveProps { data: AppData; onChange: (data: AppData) => Promise<void>; notify: (message: string) => void; onReview: () => void }
export function ArchiveView({ data, onChange, notify, onReview }: ArchiveProps) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<Topic | 'All'>('All');
  const [newestFirst, setNewestFirst] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ArchiveEntry | null>(null);
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [manualTopic, setManualTopic] = useState<Topic | ''>('');
  const [enqueue, setEnqueue] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const matchedWords = useMemo(() => detectWords(text), [text]);
  const suggestedTopic = useMemo(() => detectTopic(text), [text]);
  const activeTopic = manualTopic || suggestedTopic;
  const matching = useMemo(() => data.archive.filter(entry => {
    const needle = search.trim().toLowerCase();
    return (topic === 'All' || entry.topic === topic) && (!needle || `${entry.text} ${entry.source} ${entry.wordIds.join(' ')}`.toLowerCase().includes(needle));
  }).sort((a, b) => (newestFirst ? -1 : 1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt))), [data.archive, topic, search, newestFirst]);
  const archiveWords = new Set(data.archive.flatMap(entry => entry.wordIds));
  const openAdd = () => { setText(''); setSource(''); setManualTopic(''); setEnqueue(true); setError(''); setAdding(true); };
  const addEntry = async () => {
    const cleanText = text.trim();
    if (cleanText.length < 10) { setError('再多拾一点语境吧，请至少输入 10 个字符。'); return; }
    if (data.archive.some(entry => entry.text.replace(/\s+/g, ' ').trim().toLowerCase() === cleanText.replace(/\s+/g, ' ').toLowerCase())) { setError('这句话已经安静地躺在句匣里了。'); return; }
    setSaving(true); setError('');
    try {
      const records = { ...data.records };
      const newWords = enqueue ? matchedWords.filter(id => !records[id]) : [];
      for (const id of newWords) records[id] = createQueuedRecord(id);
      const entry: ArchiveEntry = { id: crypto.randomUUID(), text: cleanText, source: source.trim() || '我的阅读札记', topic: activeTopic, wordIds: matchedWords, createdAt: new Date().toISOString() };
      await onChange({ ...data, records, archive: [entry, ...data.archive] });
      setAdding(false);
      notify(newWords.length ? `已拾句，${newWords.length} 个新词已加入回响` : '这句话已收入句匣');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存遇到问题，请重试。'); }
    finally { setSaving(false); }
  };
  const queueEntry = async (entry: ArchiveEntry) => {
    if (saving) return;
    const unqueued = entry.wordIds.filter(id => !data.records[id]);
    if (!unqueued.length) { onReview(); return; }
    setSaving(true);
    try {
      const records = { ...data.records };
      for (const id of unqueued) records[id] = createQueuedRecord(id);
      await onChange({ ...data, records });
      notify(`${unqueued.length} 个新词已加入回响，等待你的第一次提取`);
    } catch (cause) { notify(cause instanceof Error ? cause.message : '暂时无法加入，请重试。'); }
    finally { setSaving(false); }
  };
  const removeEntry = async () => {
    if (!removing || saving) return;
    setSaving(true);
    try { await onChange({ ...data, archive: data.archive.filter(entry => entry.id !== removing.id) }); setRemoving(null); notify('已从句匣移除'); }
    catch (cause) { notify(cause instanceof Error ? cause.message : '移除遇到问题，请重试。'); }
    finally { setSaving(false); }
  };
  return <div className="library-view archive-view">
    <div className="page-heading library-page-heading"><div><div className="eyebrow">A COMMONPLACE BOOK, YOUR OWN</div><h1>让好句子，<span>有处可归。</span></h1><p>留住阅读时的灵光一现，慢慢长成属于你的表达。</p></div><button className="button primary archive-add-button" onClick={openAdd}><Plus size={17} /> 拾一句</button></div>
    <div className="archive-overview"><div><Bookmark size={19} /><strong>{data.archive.length}</strong><span>句收藏</span><span className="archive-overview-separator" /><strong>{archiveWords.size}</strong><span>个关联词汇</span></div><button onClick={onReview}>让收藏有回响 <ArrowRight size={15} /></button></div>
    <div className="archive-topic-list" aria-label="按话题筛选"><button onClick={() => setTopic('All')} className={topic === 'All' ? 'active' : ''} aria-pressed={topic === 'All'}>全部话题 <span>{data.archive.length}</span></button>{topics.map(item => <button key={item.id} onClick={() => setTopic(item.id)} className={topic === item.id ? 'active' : ''} aria-pressed={topic === item.id}>{item.short}<span>{data.archive.filter(entry => entry.topic === item.id).length}</span></button>)}</div>
    <div className="archive-toolbar"><label className="archive-search"><Search size={17} /><span className="sr-only">搜索句匣</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索原句、目标词或来源…" />{search && <button className="icon-button" onClick={() => setSearch('')} aria-label="清除搜索"><X size={15} /></button>}</label><button className="archive-sort" onClick={() => setNewestFirst(value => !value)} aria-label={newestFirst ? '当前最新优先，点击切换为最早优先' : '当前最早优先，点击切换为最新优先'}><ArrowDownWideNarrow size={16} />{newestFirst ? '最新拾取' : '最早拾取'}</button></div>
    {matching.length ? <div className="archive-grid">{matching.map(entry => {
      const unqueued = entry.wordIds.filter(id => !data.records[id]);
      return <article className="panel archive-card" key={entry.id}>
        <div className="archive-card-heading"><span className="archive-source"><BookOpen size={14} />{entry.source}</span><button className="icon-button archive-delete" onClick={() => setRemoving(entry)} aria-label={`移除句子：${entry.text.slice(0, 25)}`}><Trash2 size={15} /></button></div>
        <Quote className="archive-quote-icon" size={25} strokeWidth={1.3} />
        <p className="archive-sentence" lang="en"><HighlightWords text={entry.text} wordIds={entry.wordIds} /></p>
        {entry.sentenceId&&sentenceMap[entry.sentenceId]&&<SourceCredit sentence={sentenceMap[entry.sentenceId]}/>}
        <div className="archive-card-tags"><span className="topic-pill">{topics.find(item => item.id === entry.topic)?.short}</span>{entry.wordIds.map(id => <span className="archive-word-tag" key={id}>{wordMap[id]?.word}</span>)}</div>
        <div className="archive-card-footer"><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</time>{entry.wordIds.length > 0 ? <button disabled={saving} onClick={() => queueEntry(entry)}>{unqueued.length ? <><Plus size={13} />加入回响</> : <><Check size={13} />已在回响<ArrowRight size={12} /></>}</button> : <span>留作阅读札记</span>}</div>
      </article>;
    })}</div> : <div className="archive-empty panel"><span className="archive-empty-icon"><Bookmark size={32} strokeWidth={1.2} /></span><span className="eyebrow">COLLECT A LITTLE WONDER</span><h2>{data.archive.length ? '这一页，还没有相遇的句子。' : '你的下一种表达，就藏在阅读里。'}</h2><p>{search || topic !== 'All' ? '换一个关键词或话题，也许就能找到。' : '从文章、书页或一段对话中，拾取一句让你停留的英文。'}</p>{search || topic !== 'All' ? <button className="button secondary" onClick={() => { setSearch(''); setTopic('All'); }}>查看全部收藏 <ArrowRight size={15} /></button> : <button className="button primary" onClick={openAdd}><Plus size={16} /> 拾取第一句话</button>}</div>}
    <p className="library-footnote"><span /> 句子保存在这台设备上。你可以在设置中导出，带走自己的阅读痕迹。</p>

    {adding && <LibraryDialog title="拾取一句，留住一个语境。" onClose={() => { if (!saving) setAdding(false); }} className="archive-add-modal">
      <p className="library-dialog-description">粘贴你读到的英文，关联词汇并按话题整理。</p>
      <form onSubmit={event => { event.preventDefault(); void addEntry(); }}>
        <label className="form-field archive-text-field"><span>英文原句 <small>{text.length} / 5000</small></span><textarea data-autofocus rows={5} required minLength={10} maxLength={5000} aria-describedby="archive-matching-method" value={text} onChange={event => { setText(event.target.value); setError(''); }} placeholder="A sentence worth keeping…" /><small id="archive-matching-method">匹配当前词库中的原形与已收录词形。</small></label>
        <div className="archive-form-row"><label className="form-field"><span>阅读来源 <small>选填</small></span><input maxLength={120} value={source} onChange={event => setSource(event.target.value)} placeholder="例如：The Guardian · 一篇阅读" /></label><label className="form-field archive-topic-field"><span>归入话题 <small>{manualTopic ? '手动选择' : '自动识别'}</small></span><select value={activeTopic} onChange={event => setManualTopic(event.target.value as Topic)}>{topics.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        {text.trim() && <div className="archive-preview"><div className="archive-preview-heading"><Sparkles size={14} /><strong>{matchedWords.length ? `匹配 ${matchedWords.length} 个词库词汇` : '作为阅读札记珍藏'}</strong></div>{matchedWords.length ? <><p lang="en"><HighlightWords text={text.trim()} wordIds={matchedWords} /></p><div className="archive-detected-words">{matchedWords.map(id => <span key={id}>{wordMap[id].word}<small>{wordMap[id].definitionCN.split('；')[0]}</small></span>)}</div></> : <p className="archive-no-match">当前词库暂无匹配词汇。收入句匣，留作阅读札记。</p>}</div>}
        {matchedWords.length > 0 && <label className="archive-enqueue"><input type="checkbox" checked={enqueue} onChange={event => setEnqueue(event.target.checked)} /><span><strong>把命中的新词加入回响</strong><small>在你自己的句子里，练习主动想起它。</small></span><CircleHelp size={16} aria-label="已经学习过的词保留原有复习计划" /></label>}
        {error && <p className="archive-error" role="alert">{error}</p>}
        <div className="library-dialog-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => setAdding(false)}>再读一会儿</button><button className="button primary" type="submit" disabled={saving || text.trim().length < 10}><Bookmark size={15} />{saving ? '正在珍藏…' : '收入句匣'}</button></div>
      </form>
    </LibraryDialog>}
    {removing && <LibraryDialog title="从句匣中移除？" onClose={() => { if (!saving) setRemoving(null); }} className="archive-remove-modal"><p className="library-dialog-description">这条句子将离开你的收藏。已建立的词汇复习记录会继续保留。</p><blockquote className="archive-remove-quote">{removing.text.length > 180 ? `${removing.text.slice(0, 180)}…` : removing.text}</blockquote><div className="library-dialog-actions"><button className="button secondary" disabled={saving} onClick={() => setRemoving(null)}>保留它</button><button className="button archive-danger-button" disabled={saving} onClick={() => void removeEntry()}><Trash2 size={15} />{saving ? '正在移除…' : '确认移除'}</button></div></LibraryDialog>}
  </div>;
}
