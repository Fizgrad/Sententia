'use client';

import { useEffect, useState } from 'react';
import { Check, Cloud, CloudOff, Download, LoaderCircle, LogOut, RefreshCw, Upload } from 'lucide-react';
import { cloudSync, DEFAULT_CLOUD_API_URL, getCloudSyncStatus, subscribeCloudSync, type CloudSyncPhase, type CloudSyncStatus } from '@/lib/cloud-sync';
import { exportData } from '@/lib/store';
import type { AppData } from '@/lib/types';
import './cloud-sync-panel.css';

const phaseLabels: Record<CloudSyncPhase, string> = {
  disconnected: '未登录', connecting: '正在连接', 'awaiting-choice': '等待选择', syncing: '正在同步', synced: '已同步', pending: '待同步',
  'remote-newer': '云端有更新', conflict: '需要核对', expired: '请重新登录', error: '暂未连接',
};

export interface CloudSyncPanelProps {
  data: AppData;
  onReplace: (data: AppData) => Promise<void>;
  notify: (message: string) => void;
}

export function CloudSyncPanel({ data, onReplace, notify }: CloudSyncPanelProps) {
  const [status, setStatus] = useState<CloudSyncStatus>(getCloudSyncStatus);
  const [apiUrl, setApiUrl] = useState(DEFAULT_CLOUD_API_URL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registration, setRegistration] = useState<'checking' | 'open' | 'disabled' | 'unavailable'>('checking');
  const [configAttempt, setConfigAttempt] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [confirmUpload, setConfirmUpload] = useState(false);
  const busy = working || status.phase === 'connecting' || status.phase === 'syncing';

  useEffect(() => {
    const update = () => setStatus(getCloudSyncStatus());
    update();
    return subscribeCloudSync(update);
  }, []);

  useEffect(() => {
    if (status.loggedIn) return;
    let cancelled = false;
    setRegistration('checking'); setMode('login');
    if (!apiUrl.trim()) { setRegistration('unavailable'); return; }
    const timer = setTimeout(() => {
      void cloudSync.registrationMode(apiUrl).then(value => { if (!cancelled) setRegistration(value); })
        .catch(() => { if (!cancelled) setRegistration('unavailable'); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [apiUrl, status.loggedIn, configAttempt]);

  async function run(action: () => Promise<void>, success?: string) {
    setError(''); setWorking(true);
    try { await action(); setConfirmUpload(false); if (success) notify(success); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '操作失败，请重试。'); }
    finally { setWorking(false); }
  }

  async function authenticate() {
    if (mode === 'register' && password !== passwordAgain) { setError('两次输入的密码不一致。'); return; }
    const secret = password;
    setPassword(''); setPasswordAgain('');
    await run(() => mode === 'register'
      ? cloudSync.register(apiUrl, username, secret, data)
      : cloudSync.login(apiUrl, username, secret, data));
  }

  function requestUpload() {
    setError('');
    if (status.remote?.hasData) setConfirmUpload(true);
    else void run(() => cloudSync.uploadLocal(data), '进度已上传。');
  }

  const remote = status.remote;
  const needsChoice = ['awaiting-choice', 'conflict', 'remote-newer'].includes(status.phase);

  return <section className="cloud-sync-panel" aria-labelledby="cloud-sync-title">
    <div className="cloud-sync-heading"><div><Cloud size={21}/><h3 id="cloud-sync-title">账号与同步</h3></div><span className={`cloud-status cloud-status-${status.phase}`} role="status">{status.phase === 'syncing' || status.phase === 'connecting' ? <LoaderCircle size={14} className="spinner"/> : status.phase === 'synced' ? <Check size={14}/> : <CloudOff size={14}/>} {phaseLabels[status.phase]}</span></div>
    {!status.loggedIn ? <>
      <p className="cloud-sync-intro">使用同一账号同步学习进度。</p>
      <div className="cloud-auth-mode" aria-label="账号操作"><button type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); setError(''); }}>登录</button>{registration === 'open' && <button type="button" aria-pressed={mode === 'register'} disabled={busy} onClick={() => { setMode('register'); setError(''); }}>创建账号</button>}</div>
      <form className="cloud-auth-form" onSubmit={event => { event.preventDefault(); void authenticate(); }}>
        <label className="cloud-field"><span>账号</span><input aria-label="同步账号" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={40} value={username} disabled={busy} onChange={event => setUsername(event.target.value)}/></label>
        <label className="cloud-field"><span>密码{mode === 'register' && <small>12–128 个字符</small>}</span><input aria-label="同步密码" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : undefined} maxLength={128} value={password} disabled={busy} onChange={event => setPassword(event.target.value)}/></label>
        {mode === 'register' && <label className="cloud-field"><span>再次输入密码</span><input aria-label="再次输入同步密码" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={passwordAgain} disabled={busy} onChange={event => setPasswordAgain(event.target.value)}/></label>}
        <details className="cloud-connection" open={!DEFAULT_CLOUD_API_URL}><summary>同步服务地址</summary><label className="cloud-field"><span>服务地址</span><input aria-label="同步服务地址" type="url" autoComplete="url" placeholder="https://study.example.com" value={apiUrl} disabled={busy} onChange={event => setApiUrl(event.target.value)}/></label></details>
        {registration === 'unavailable' && <div className="cloud-auth-note">注册状态读取失败，请重试。<button type="button" className="text-button" disabled={busy || !apiUrl.trim()} onClick={() => setConfigAttempt(value => value + 1)}>重新检查注册入口</button></div>}
        {mode === 'register' && <p className="cloud-auth-note">账号需为 3–40 位字母、数字、点、下划线或短横线，首位为字母或数字。</p>}
        <button className="primary-button" type="submit" disabled={busy || !apiUrl.trim()}>{busy && <LoaderCircle size={15} className="spinner"/>}{mode === 'register' ? '创建账号并登录' : '登录并查看进度'}</button>
      </form>
    </> : <>
      <div className="cloud-account"><span>当前账号 <strong>{status.username}</strong></span><button type="button" className="text-button" disabled={busy} onClick={() => void run(async () => { const revoked = await cloudSync.logout(); notify(revoked ? '已退出同步账号。' : '本机已退出，云端退出失败。'); })}><LogOut size={14}/>退出账号</button></div>
      <p className="cloud-sync-message">{status.message}</p>
      {status.lastSyncedAt && <p className="cloud-last-sync">上次同步：{new Date(status.lastSyncedAt).toLocaleString('zh-CN')}</p>}
      {(remote || needsChoice || !status.bound) && <div className="cloud-comparison">
        <div><strong>本设备</strong><span>{Object.keys(data.records).length} 张词卡</span><span>{data.archive.length} 句收藏 · {data.logs.length} 条记录</span></div>
        <div><strong>云端</strong>{remote ? <><span>{remote.words} 张词卡</span><span>{remote.sentences} 句收藏 · {remote.reviews} 条记录</span>{!remote.hasData && <small>还没有学习进度</small>}</> : <span>请先读取云端进度</span>}</div>
      </div>}
      <div className="cloud-sync-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => void run(async () => { await cloudSync.inspect(); })}><RefreshCw size={15}/>比较两端进度</button>{status.bound && !needsChoice && <button type="button" className="secondary-button" disabled={busy} onClick={() => void run(() => cloudSync.resume(data))}><Upload size={15}/>立即同步</button>}</div>
      {remote && (needsChoice || !status.bound) && <div className="cloud-direction-choice">
        <p>选择要使用的进度。</p>
        <div className="cloud-sync-actions"><button type="button" className="secondary-button" disabled={busy || !remote.hasData} onClick={() => void run(() => cloudSync.useRemote(onReplace), '已使用云端进度。')}><Download size={15}/>使用云端进度</button><button type="button" className="secondary-button" disabled={busy} onClick={requestUpload}><Upload size={15}/>上传本地进度</button></div>
      </div>}
      {confirmUpload && remote?.hasData && <div className="cloud-overwrite-confirm" role="group" aria-label="确认替换云端进度"><strong>将用本地进度替换云端记录。</strong><p>请核对两端的词卡、收藏和记录数量。</p><div className="cloud-sync-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => { const snapshot = cloudSync.getRemoteData(); if (snapshot) exportData(snapshot); }}>先备份云端进度</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setConfirmUpload(false)}>取消</button><button type="button" className="primary-button" disabled={busy} onClick={() => void run(() => cloudSync.uploadLocal(data), '云端进度已更新。')}>确认替换云端进度</button></div></div>}
    </>}
    {error && <p className="cloud-sync-error" role="alert">{error}</p>}
  </section>;
}
