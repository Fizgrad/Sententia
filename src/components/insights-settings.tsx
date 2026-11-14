'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, CalendarDays, Check, CheckCheck, Flame, Leaf, LoaderCircle, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { sentenceMap, topics, wordMap, words } from '@/lib/corpus';
import { defaultData, exportData, latestRecoveryBackup, validateBackup, type RecoverySnapshot } from '@/lib/store';
import { CloudSyncPanel } from './cloud-sync-panel';
import type { AppData, Preferences, View } from '@/lib/types';
import './insights-settings.css';

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const shiftDay = (date: Date, amount: number) => { const result = new Date(date); result.setDate(result.getDate() + amount); return result; };

export function InsightsView({ data, onNavigate }: { data: AppData; onNavigate: (view: View) => void }) {
  const now = new Date();
  const today = dayKey(now);
  const reviewLogs = data.logs.filter(log => log.mode === 'review');
  const reviewSuccess = reviewLogs.filter(log => log.rating >= 3).length;
  const learned = Object.values(data.records).filter(record => record.card.reps > 0);
  const todayLogs = data.logs.filter(log => dayKey(new Date(log.at)) === today);
  const activeDates = new Set(data.logs.map(log => dayKey(new Date(log.at))));
  let streak = 0;
  let cursor = activeDates.has(today) ? now : shiftDay(now, -1);
  while (activeDates.has(dayKey(cursor))) { streak += 1; cursor = shiftDay(cursor, -1); }
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(now, i - 6);
    const logs = data.logs.filter(log => dayKey(new Date(log.at)) === dayKey(date));
    return { date, learning: logs.filter(log => log.mode === 'learn').length, review: logs.filter(log => log.mode === 'review').length };
  });
  const chartMax = Math.max(5, ...weekly.map(day => day.learning + day.review));
  const weeklyTotal = weekly.reduce((sum, day) => sum + day.learning + day.review, 0);
  const activity = Array.from({ length: 28 }, (_, i) => {
    const date = shiftDay(now, i - 27);
    const count = data.logs.filter(log => dayKey(new Date(log.at)) === dayKey(date)).length;
    return { date, count };
  });
  const upcoming = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(now, i);
    const count = Object.values(data.records).filter(record => {
      const due = new Date(record.card.due);
      return i === 0 ? due < new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) : dayKey(due) === dayKey(date);
    }).length;
    return { date, count };
  });
  const topicCounts = topics.map(topic => ({ ...topic, count: learned.filter(record => sentenceMap[wordMap[record.id]?.sentenceIds[0]]?.topic === topic.id).length })).sort((a, b) => b.count - a.count);

  return (
    <div className="insights-view">
      <div className="insights-heading">
        <div><span className="eyebrow">YOUR READING JOURNEY</span><h1>每一次回响，都算数。</h1><p>记忆慢慢生根，你的积累清晰可见。</p></div>
        <span className="insights-date"><CalendarDays size={15} /> 最近 7 天</span>
      </div>

      <div className="insights-metrics">
        <InsightMetric icon={<BookOpen size={19} />} value={learned.length} label="已学习词汇" note={`共 ${words.length} 个核心词`} />
        <InsightMetric icon={<CheckCheck size={19} />} value={reviewLogs.length} label="主动提取次数" note="每次回忆都在加固记忆" />
        <InsightMetric icon={<Flame size={19} />} value={streak} label="连续学习天数" note={streak ? '保持自己的阅读节奏' : '今天，从一句开始'} />
        <InsightMetric icon={<Sparkles size={19} />} value={reviewLogs.length ? `${Math.round(reviewSuccess / reviewLogs.length * 100)}%` : '—'} label="自主回忆率" note="复习中「良好 / 轻松」占比" />
      </div>

      {!data.logs.length && <div className="insights-welcome"><span className="insights-welcome-icon"><Leaf size={24} strokeWidth={1.5} /></span><div><h3>你的阅读旅程，正要开始。</h3><p>完成第一张学习卡片，积累会在这里留下痕迹。</p></div><button className="primary-button" onClick={() => onNavigate('learn')}>开始拾句 <ArrowRight size={16} /></button></div>}

      <div className="insights-main-grid">
        <section className="insights-panel insights-weekly">
          <div className="insights-panel-heading"><div><span className="eyebrow">LITTLE BY LITTLE</span><h2>这一周的积累</h2></div><span className="insights-total"><b>{weeklyTotal}</b> 次学习</span></div>
          <div className="insights-chart-legend"><span><i className="legend-learning" /> 新词学习</span><span><i className="legend-review" /> 语境复习</span></div>
          <div className="insights-bars" role="img" aria-label={`最近七天共学习 ${weeklyTotal} 次`}>
            <div className="insights-chart-lines"><i /><i /><i /><i /></div>
            {weekly.map(day => <div className="insights-bar-column" key={dayKey(day.date)}>
              <span className="insights-bar-value">{day.learning + day.review || ''}</span>
              <div className="insights-bar-track"><div className="insights-bar-stack" style={{ height: `${Math.max((day.learning + day.review) / chartMax * 100, 1.5)}%` }} title={`${day.date.toLocaleDateString('zh-CN')}：学习 ${day.learning}，复习 ${day.review}`}>
                {day.review > 0 && <div className="bar-review" style={{ flex: day.review }} />}
                {day.learning > 0 && <div className="bar-learning" style={{ flex: day.learning }} />}
                {day.learning + day.review === 0 && <div className="bar-empty" />}
              </div></div>
              <span className={dayKey(day.date) === today ? 'is-today' : ''}>{dayKey(day.date) === today ? '今天' : `${day.date.getMonth() + 1}/${day.date.getDate()}`}</span>
            </div>)}
          </div>
          <div className="insights-weekly-foot"><span>今日已完成 <b>{todayLogs.length}</b> 次学习与复习</span><span>从容一点，积累多一点。</span></div>
        </section>

        <section className="insights-panel insights-topics">
          <div className="insights-panel-heading"><div><span className="eyebrow">WORDS & WORLDS</span><h2>你的话题版图</h2></div><BookOpen size={19} /></div>
          <div className="insights-topic-list">{topicCounts.map((topic, index) => <div className="insights-topic" key={topic.id}>
            <div><span><i style={{ background: ['#385c48', '#789381', '#a7b8a4', '#b5a27a', '#8b9eaa', '#ae9c92', '#9d9a81', '#838a9d'][index] }} />{topic.short}</span><b>{topic.count}<small> 词</small></b></div>
            <div className="insights-topic-track"><span style={{ width: `${learned.length ? topic.count / learned.length * 100 : 0}%` }} /></div>
          </div>)}</div>
          <p className="insights-fine-print">按词汇的主要学习话题归类</p>
        </section>
      </div>

      <div className="insights-bottom-grid">
        <section className="insights-panel insights-activity"><div className="insights-panel-heading"><div><span className="eyebrow">A QUIET HABIT</span><h2>28 天阅读足迹</h2></div><span className="insights-activity-count">{activity.filter(day => day.count > 0).length} 天有积累</span></div><div className="insights-activity-cells">{activity.map(day => <span key={dayKey(day.date)} className={`activity-cell level-${day.count === 0 ? 0 : day.count < 5 ? 1 : day.count < 10 ? 2 : day.count < 20 ? 3 : 4}`} title={`${day.date.toLocaleDateString('zh-CN')} · ${day.count} 次学习`} aria-label={`${day.date.toLocaleDateString('zh-CN')}，${day.count} 次学习`} />)}</div><div className="insights-activity-foot"><span>{activity[0].date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span><div><span>少</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`activity-cell level-${level}`} />)}<span>多</span></div><span>今天</span></div></section>

        <section className="insights-panel insights-upcoming"><div className="insights-panel-heading"><div><span className="eyebrow">THE NEXT CHAPTER</span><h2>接下来的回响</h2></div><CalendarDays size={19} /></div><div className="insights-schedule">{upcoming.map((day, index) => <div key={dayKey(day.date)} className={index === 0 ? 'today' : ''}><span>{index === 0 ? '今天' : ['日', '一', '二', '三', '四', '五', '六'][day.date.getDay()]}</span><b>{day.count}</b><small>词</small></div>)}</div><button className="insights-text-link" onClick={() => onNavigate('review')}>去回响，巩固记忆 <ArrowRight size={14} /></button></section>
      </div>
    </div>
  );
}

function InsightMetric({ icon, value, label, note }: { icon: ReactNode; value: number | string; label: string; note: string }) {
  return <div className="insight-metric"><div className="insight-metric-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></div>;
}

export function SettingsModal({ data, onClose, onChange, onCloudReplace, notify }: { data: AppData; onClose: () => void; onChange: (data: AppData) => Promise<void>; onCloudReplace: (data: AppData) => Promise<void>; notify: (message: string) => void }) {
  const [draft, setDraft] = useState<Preferences>({ ...data.preferences });
  const [tab, setTab] = useState<'preferences' | 'data'>('preferences');
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<AppData | null>(null);
  const [reset, setReset] = useState(false);
  const [resetText, setResetText] = useState('');
  const [recovery, setRecovery] = useState<RecoverySnapshot>();
  const dialog = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void latestRecoveryBackup().then(value => { if (active) setRecovery(value); }).catch(() => {});
    return () => { active = false; };
  }, [data]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const initial = dialog.current?.querySelector<HTMLElement>('button, input, select');
    initial?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.stopPropagation(); if (!busy) onClose(); }
      if (event.key !== 'Tab') return;
      const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])].filter(element => element.offsetParent !== null);
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [onClose, busy]);

  async function savePreferences() {
    if (!draft.name.trim()) { notify('请为自己取一个称呼。'); return; }
    setBusy(true);
    try { await onChange({ ...data, preferences: { ...draft, name: draft.name.trim() } }); notify('阅读偏好已保存。'); onClose(); }
    catch (error) { notify(error instanceof Error ? error.message : '保存失败，请重试。'); }
    finally { setBusy(false); }
  }

  async function selectBackup(file?: File) {
    if (!file) return;
    setBackup(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('备份文件不能超过 10 MB。');
      const parsed = JSON.parse(await file.text());
      setBackup(validateBackup(parsed));
      setReset(false);
    } catch (error) { notify(error instanceof SyntaxError ? '这不是有效的 JSON 备份文件。' : error instanceof Error ? error.message : '无法读取该备份。'); }
    if (fileInput.current) fileInput.current.value = '';
  }

  async function restoreBackup() {
    if (!backup) return;
    setBusy(true);
    try { await onChange(backup); setDraft({ ...backup.preferences }); setBackup(null); notify('备份已恢复，欢迎继续拾句。'); onClose(); }
    catch (error) { notify(error instanceof Error ? error.message : '恢复失败，请重试。'); }
    finally { setBusy(false); }
  }

  async function resetData() {
    if (resetText !== '拾句') return;
    setBusy(true);
    try { await onChange({ ...defaultData(), preferences: { ...data.preferences } }); setReset(false); setResetText(''); notify('学习记录与句匣已清空，偏好已保留。'); onClose(); }
    catch (error) { notify(error instanceof Error ? error.message : '清空失败，请重试。'); }
    finally { setBusy(false); }
  }

  return <div className="settings-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}><div ref={dialog} className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div className="settings-head"><div><span className="eyebrow">MAKE YOURSELF AT HOME</span><h2 id="settings-title">阅读偏好</h2></div><button className="icon-button" onClick={onClose} disabled={busy} aria-label="关闭设置"><X size={20} /></button></div>
    <div className="settings-tabs" role="tablist" aria-label="设置分类"><button role="tab" aria-selected={tab === 'preferences'} onClick={() => setTab('preferences')}><SlidersHorizontal size={16} /> 学习设置</button><button role="tab" aria-selected={tab === 'data'} onClick={() => setTab('data')}><ShieldCheck size={16} /> 数据与备份</button></div>
    <div className="settings-body">
      {tab === 'preferences' ? <div className="settings-preferences">
        <label className="settings-field"><span>如何称呼你</span><input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} maxLength={20} placeholder="拾句者" autoComplete="nickname" /><small>一个熟悉的称呼，让每天的阅读更亲切。</small></label>
        <div className="settings-field"><span id="goal-label">每日新词目标</span><div className="settings-goal-options" role="group" aria-labelledby="goal-label">{[5, 10, 15, 20, 30].map(goal => <button key={goal} aria-pressed={draft.dailyGoal === goal} onClick={() => setDraft({ ...draft, dailyGoal: goal })}>{goal}<small> 词</small></button>)}</div><small>按自己的节奏学习，目标每天重新计算。</small></div>
        <label className="settings-field"><span>目标记忆保留率</span><select value={draft.retention} onChange={event => setDraft({ ...draft, retention: Number(event.target.value) })}>{[...new Set([0.8, 0.85, 0.9, 0.95, draft.retention])].sort((a,b) => a-b).map(value => <option key={value} value={value}>{Math.round(value * 100)}%{value === 0.9 ? ' · 推荐' : ''}</option>)}</select><small>保留率越高，复习越频繁。对下一次评分后的调度生效。</small></label>
        <div className="settings-toggle-row"><div><b>自动朗读新语境</b><p>切换卡片时，使用浏览器的英式英语语音。</p></div><button className={`settings-switch ${draft.autoSpeak ? 'is-on' : ''}`} role="switch" aria-checked={draft.autoSpeak} aria-label="自动朗读新语境" onClick={() => setDraft({ ...draft, autoSpeak: !draft.autoSpeak })}><span /></button></div>
        <div className="settings-local-note"><Leaf size={17} /><p>在当前浏览器学习，登录账号同步进度，也可导出 JSON 备份。</p></div>
      </div> : <div className="settings-data">
        <div className="settings-data-summary"><span><b>{Object.keys(data.records).length}</b> 学习词卡</span><span><b>{data.archive.length}</b> 收藏句子</span><span><b>{data.logs.length}</b> 学习记录</span></div>
        <CloudSyncPanel data={data} onReplace={async value => { await onCloudReplace(value); setDraft({ ...value.preferences }); }} notify={notify}/>
        {recovery && <div className="settings-data-row"><span className="settings-data-icon"><ShieldCheck size={21}/></span><div><h3>同步前的本地备份</h3><p>{new Date(recovery.createdAt).toLocaleString('zh-CN')} · 替换前的设备进度，最近五份保留在此浏览器。</p></div><button className="secondary-button" onClick={() => { try { exportData(recovery.value); } catch { notify('备份暂时无法下载，请重试。'); } }}>下载最近备份</button></div>}
        <div className="settings-data-row"><span className="settings-data-icon"><ArrowDownToLine size={21} /></span><div><h3>导出完整备份</h3><p>下载包含词卡、收藏、记录与偏好的 JSON 文件。</p></div><button className="secondary-button" onClick={() => { try { exportData(data); notify('备份文件已开始下载。'); } catch { notify('导出失败，请重试。'); } }}>导出</button></div>
        <div className="settings-data-row"><span className="settings-data-icon"><ArrowUpFromLine size={21} /></span><div><h3>从备份恢复</h3><p>先检查备份内容，确认后替换当前数据。</p></div><button className="secondary-button" onClick={() => fileInput.current?.click()}>选择文件</button><input ref={fileInput} type="file" accept=".json,application/json" className="settings-file-input" aria-label="导入拾句备份" onChange={event => { void selectBackup(event.target.files?.[0]); }} /></div>
        {backup && <div className="settings-confirm-box" role="status"><b>备份已通过检查</b><p>包含 {Object.keys(backup.records).length} 张词卡、{backup.archive.length} 句收藏和 {backup.logs.length} 条学习记录。恢复后将使用这份备份中的进度。</p><div><button className="secondary-button" onClick={() => setBackup(null)} disabled={busy}>取消</button><button className="primary-button" onClick={() => { void restoreBackup(); }} disabled={busy}>{busy ? <LoaderCircle size={15} className="settings-spin" /> : <Check size={15} />} 确认恢复</button></div></div>}
        <div className="settings-data-row settings-reset-row"><span className="settings-data-icon"><RotateCcw size={20} /></span><div><h3>重新开始</h3><p>清空学习进度与个人句匣，保留阅读偏好。</p></div><button className="settings-reset-button" onClick={() => { setReset(!reset); setBackup(null); }}>清空数据</button></div>
        {reset && <div className="settings-confirm-box settings-confirm-danger"><label><b>清空学习进度</b><p>词卡、学习记录和句匣将被清空。开启账号同步时，云端进度也会更新。输入「拾句」确认。</p><input value={resetText} onChange={event => setResetText(event.target.value)} placeholder="输入 拾句" aria-label="输入拾句确认清空" /></label><div><button className="secondary-button" onClick={() => { setReset(false); setResetText(''); }} disabled={busy}>取消</button><button className="settings-danger-button" disabled={resetText !== '拾句' || busy} onClick={() => { void resetData(); }}>{busy ? <LoaderCircle size={15} className="settings-spin" /> : <RotateCcw size={15} />} 确认清空</button></div></div>}
        <div className="settings-local-note"><ShieldCheck size={18} /><p>学习进度先保存在本设备，登录后自动同步到账号。数据与备份支持导出和恢复。</p></div>
      </div>}
    </div>
    <div className="settings-footer"><span>Sententia · 拾句 <small>v1.0</small></span>{tab === 'preferences' ? <button className="primary-button" disabled={busy || !draft.name.trim()} onClick={() => { void savePreferences(); }}>{busy ? <LoaderCircle size={16} className="settings-spin" /> : <Check size={16} />} 保存偏好</button> : <button className="secondary-button" onClick={onClose} disabled={busy}>完成</button>}</div>
  </div></div>;
}
