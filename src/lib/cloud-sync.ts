import { validateBackup } from './store';
import type { AppData } from './types';

export type CloudSyncPhase = 'disconnected' | 'connecting' | 'awaiting-choice' | 'syncing' | 'synced' | 'pending' | 'remote-newer' | 'conflict' | 'expired' | 'error';
export interface CloudUser { id: string; username: string }
export interface CloudState { revision: number; data: AppData | null; updatedAt: string | null }
export interface CloudProgressSummary { revision: number; hasData: boolean; words: number; sentences: number; reviews: number; updatedAt: string | null }
export interface CloudSyncStatus {
  phase: CloudSyncPhase;
  loggedIn: boolean;
  bound: boolean;
  username: string;
  apiUrl: string;
  lastSyncedAt: string | null;
  remote: CloudProgressSummary | null;
  message: string;
}
interface CloudSession {
  version: 1;
  apiUrl: string;
  token: string;
  user: CloudUser;
  expiresAt: string;
  bound: boolean;
  revision: number;
  syncedDigest: string | null;
  lastSyncedAt: string | null;
}
export interface CloudStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
interface ClientOptions {
  storage?: CloudStorage | null;
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

export const CLOUD_SESSION_KEY = 'sententia-cloud-session-v1';
export const DEFAULT_CLOUD_API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const MAX_RESPONSE_BYTES = 12 * 1024 * 1024;
const disconnected: CloudSyncStatus = {
  phase: 'disconnected', loggedIn: false, bound: false, username: '', apiUrl: DEFAULT_CLOUD_API_URL,
  lastSyncedAt: null, remote: null, message: '登录账号，同步学习进度。',
};

/** This is a public API origin, never a database credential or a shared API key. */
export function normalizeCloudApiUrl(value: string): string {
  const text = value.trim();
  if (!/^https?:\/\/[^\s/?#\\]+\/?$/i.test(text)) throw new Error('请输入有效的同步服务根地址。');
  let url: URL;
  try { url = new URL(text); } catch { throw new Error('同步服务地址无效。'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))) {
    throw new Error('同步地址无效，请使用 HTTPS 根地址。');
  }
  return url.origin;
}

export function summarizeCloudState(state: CloudState): CloudProgressSummary {
  return { revision: state.revision, hasData: state.data !== null, words: Object.keys(state.data?.records ?? {}).length,
    sentences: state.data?.archive.length ?? 0, reviews: state.data?.logs.length ?? 0, updatedAt: state.updatedAt };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function digest(data: AppData): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(data));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function iso(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)); }
function user(value: unknown): CloudUser {
  const row = value as Partial<CloudUser> | null;
  if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(row.id) || typeof row.username !== 'string' || row.username.length < 1 || row.username.length > 80) throw new Error('账号信息读取失败，请重新登录。');
  return { id: row.id, username: row.username };
}
function cloudState(value: unknown): CloudState {
  const row = value as Partial<CloudState> | null;
  if (!row || !Number.isSafeInteger(row.revision) || row.revision! < 0 || (row.updatedAt !== null && !iso(row.updatedAt)) || row.data === undefined) throw new Error('读取进度失败，请重试。');
  return { revision: row.revision!, updatedAt: row.updatedAt!, data: row.data === null ? null : validateBackup(row.data) };
}
class RequestFailure extends Error {
  constructor(readonly kind: 'network' | 'unauthorized' | 'conflict' | 'other', message: string) { super(message); }
}
class SessionChanged extends Error {}

/** Browser-local cache stays authoritative until an explicit first-sync choice. */
export class CloudSyncClient {
  private initialized = false;
  private session: CloudSession | null = null;
  private storage: CloudStorage | null = null;
  private storageWritable = true;
  private status: CloudSyncStatus = { ...disconnected };
  private remote: CloudState | null = null;
  private latestLocal: AppData | null = null;
  private generation = 0;
  private epoch = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private autoScheduled = false;
  private listeners = new Set<() => void>();
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly timeoutMs: number;

  constructor(private readonly options: ClientOptions = {}) {
    this.fetcher = options.fetch ?? ((...args) => fetch(...args));
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  getStatus = (): CloudSyncStatus => this.status;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  private emit(phase: CloudSyncPhase, message: string): void {
    this.status = { phase, message, loggedIn: !!this.session, bound: this.session?.bound ?? false,
      username: this.session?.user.username ?? '', apiUrl: this.session?.apiUrl ?? this.status.apiUrl,
      lastSyncedAt: this.session?.lastSyncedAt ?? null, remote: this.remote ? summarizeCloudState(this.remote) : null };
    for (const listener of this.listeners) listener();
  }

  private initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (this.options.storage !== undefined) this.storage = this.options.storage;
    else if (typeof window !== 'undefined') {
      try { this.storage = window.localStorage; } catch { this.storageWritable = false; }
    }
    try {
      const raw = this.storage?.getItem(CLOUD_SESSION_KEY);
      if (raw) {
        const item = JSON.parse(raw) as Partial<CloudSession>;
        const validDigest = typeof item.syncedDigest === 'string' && /^[a-f0-9]{64}$/.test(item.syncedDigest);
        if (item.version === 1 && typeof item.token === 'string' && /^[a-zA-Z0-9_-]{24,512}$/.test(item.token) && iso(item.expiresAt) && Number.isSafeInteger(item.revision) && item.revision! >= 0) {
          this.session = { version: 1, apiUrl: normalizeCloudApiUrl(item.apiUrl ?? ''), token: item.token, user: user(item.user), expiresAt: item.expiresAt,
            bound: item.bound === true && validDigest, revision: item.revision!, syncedDigest: validDigest ? item.syncedDigest! : null,
            lastSyncedAt: iso(item.lastSyncedAt) ? item.lastSyncedAt : null };
          this.emit(this.session.bound ? 'pending' : 'awaiting-choice', this.session.bound ? '正在检查设备和云端的进度。' : '请选择要使用的进度。');
        }
      }
    } catch { this.session = null; }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { if (this.latestLocal) void this.resume(this.latestLocal); });
      window.addEventListener('storage', event => {
        if (event.key !== CLOUD_SESSION_KEY || !this.session) return;
        let token: unknown;
        try { token = event.newValue ? JSON.parse(event.newValue).token : null; } catch { token = null; }
        if (token !== this.session.token) {
          // Never adopt another tab's account or revision into a stale local view.
          this.epoch++; this.session = null; this.remote = null;
          this.emit('disconnected', '同步账号已更换，请重新登录。');
        }
      });
    }
  }

  private persist(replace = false): void {
    if (!this.session || !this.storage || !this.storageWritable) return;
    try {
      if (!replace) {
        const existing = this.storage.getItem(CLOUD_SESSION_KEY);
        if (!existing || JSON.parse(existing).token !== this.session.token) throw new SessionChanged();
      }
      this.storage.setItem(CLOUD_SESSION_KEY, JSON.stringify(this.session));
    } catch (error) {
      if (error instanceof SessionChanged) {
        this.epoch++; this.session = null; this.remote = null;
        this.emit('disconnected', '同步账号已变更，请重新登录。');
        throw error;
      }
      this.storageWritable = false;
    }
  }

  private clearMatchingToken(token: string): void {
    try {
      const raw = this.storage?.getItem(CLOUD_SESSION_KEY);
      if (raw && JSON.parse(raw).token === token) this.storage?.removeItem(CLOUD_SESSION_KEY);
    } catch { /* The in-memory session is cleared even when storage is unavailable. */ }
  }

  private authenticated(): CloudSession {
    const session = this.session;
    if (!session) throw new Error('请先登录同步账号。');
    if (Date.parse(session.expiresAt) <= this.now()) {
      this.clearMatchingToken(session.token); this.session = null; this.remote = null; this.epoch++;
      this.emit('expired', '登录已到期，请重新登录。');
      throw new RequestFailure('unauthorized', this.status.message);
    }
    return session;
  }

  private current(session: CloudSession, epoch: number): void {
    if (epoch !== this.epoch || this.session?.token !== session.token) throw new SessionChanged();
    // Storage revisions are not adopted here: a stale tab must still fail CAS.
    if (this.storage && this.storageWritable) {
      try {
        const raw = this.storage.getItem(CLOUD_SESSION_KEY);
        if (!raw || JSON.parse(raw).token !== session.token) throw new SessionChanged();
      } catch (error) {
        if (error instanceof SessionChanged) {
          this.epoch++; this.session = null; this.remote = null;
          this.emit('disconnected', '同步账号已变更，请重新登录。');
          throw error;
        }
      }
    }
  }

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => {});
    return result;
  }

  private async request(apiUrl: string, path: string, token?: string, body?: unknown, method = 'GET'): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${apiUrl}/api/v1${path}`, {
        method, signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.status === 401) throw new RequestFailure('unauthorized', path === '/auth/login' ? '账号或密码不正确。' : '登录已失效，请重新登录。');
      if (response.status === 409) throw new RequestFailure(path === '/auth/register' ? 'other' : 'conflict', path === '/auth/register' ? '该账号已被使用，请换一个账号名称。' : '云端进度已更新，请比较两端进度。');
      if (response.status === 429) throw new RequestFailure('other', '尝试次数较多，请稍后再试。');
      if (response.status === 413) throw new RequestFailure('other', '进度文件过大，请导出备份。');
      if (!response.ok) throw new RequestFailure('other', '同步失败，请重试。');
      if (response.status === 204) return null;
      if (Number(response.headers.get('Content-Length')) > MAX_RESPONSE_BYTES) throw new RequestFailure('other', '云端进度文件过大，读取失败。');
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new RequestFailure('other', '云端进度文件过大，读取失败。');
      try { return JSON.parse(text); } catch { throw new RequestFailure('other', '读取云端进度失败，请重试。'); }
    } catch (error) {
      if (error instanceof RequestFailure) throw error;
      throw new RequestFailure('network', '连接失败，请重试。');
    } finally { clearTimeout(timer); }
  }

  private failure(error: unknown, session?: CloudSession): void {
    if (error instanceof SessionChanged || (session && this.session?.token !== session.token)) return;
    const message = error instanceof Error ? error.message : '同步失败，请重试。';
    if (error instanceof RequestFailure && error.kind === 'unauthorized') {
      if (this.session) this.clearMatchingToken(this.session.token);
      this.epoch++; this.session = null; this.remote = null;
      this.emit('expired', message);
    } else if (error instanceof RequestFailure && error.kind === 'conflict') {
      this.remote = null;
      this.emit('conflict', message);
    } else this.emit(this.session?.bound ? 'pending' : 'error', message);
  }

  async registrationMode(apiUrl: string): Promise<'open' | 'disabled'> {
    const origin = normalizeCloudApiUrl(apiUrl);
    const raw = await this.request(origin, '/auth/config') as { registrationMode?: unknown } | null;
    if (!raw || !['open', 'disabled'].includes(String(raw.registrationMode))) throw new Error('注册状态读取失败，请重试。');
    return raw.registrationMode as 'open' | 'disabled';
  }

  /** Logging in reads the remote preview; it never imports or uploads progress. */
  login(apiUrl: string, username: string, password: string, local: AppData): Promise<void> {
    return this.authenticate(apiUrl, username, password, local, false);
  }

  register(apiUrl: string, username: string, password: string, local: AppData): Promise<void> {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,39}$/.test(username.trim())) return Promise.reject(new Error('账号需为 3–40 位字母、数字、点、下划线或短横线，首位为字母或数字。'));
    if ([...password].length < 12 || [...password].length > 128) return Promise.reject(new Error('密码长度需为 12–128 个字符。'));
    return this.authenticate(apiUrl, username, password, local, true);
  }

  private async authenticate(apiUrl: string, username: string, password: string, local: AppData, registration: boolean): Promise<void> {
    this.initialize();
    const origin = normalizeCloudApiUrl(apiUrl);
    if (!username.trim() || !password) throw new Error('请填写账号和密码。');
    const snapshot = validateBackup(local);
    return this.serial(async () => {
      const startedEpoch = this.epoch;
      this.emit('connecting', registration ? '正在创建账号…' : '正在连接…');
      try {
        const raw = await this.request(origin, registration ? '/auth/register' : '/auth/login', undefined, { username: username.trim(), password }, 'POST') as { token?: unknown; expiresAt?: unknown; user?: unknown };
        if (typeof raw.token !== 'string' || !/^[A-Za-z0-9_-]{24,512}$/.test(raw.token) || !iso(raw.expiresAt) || Date.parse(raw.expiresAt) <= this.now()) throw new Error('登录失败，请重试。');
        if (this.epoch !== startedEpoch) {
          void this.request(origin, '/auth/logout', raw.token, undefined, 'POST').catch(() => {});
          throw new SessionChanged();
        }
        const previous = this.session;
        this.epoch++;
        this.session = { version: 1, apiUrl: origin, token: raw.token, user: user(raw.user), expiresAt: raw.expiresAt, bound: false, revision: 0, syncedDigest: null, lastSyncedAt: null };
        this.remote = null; this.latestLocal = snapshot; this.generation++;
        this.persist(true);
        if (previous && previous.token !== raw.token) void this.request(previous.apiUrl, '/auth/logout', previous.token, undefined, 'POST').catch(() => {});
        await this.readRemote();
        this.emit('awaiting-choice', '请选择要使用的学习进度。');
      } catch (error) { this.failure(error); throw error; }
    });
  }

  private async readRemote(): Promise<CloudState> {
    const session = this.authenticated(), epoch = this.epoch;
    const remote = cloudState(await this.request(session.apiUrl, '/state', session.token));
    this.current(session, epoch); this.remote = remote;
    return remote;
  }

  async inspect(): Promise<CloudState> {
    this.initialize();
    return this.serial(async () => {
      const session = this.session;
      try {
        const remote = await this.readRemote();
        this.emit(this.status.phase === 'conflict' ? 'conflict' : 'awaiting-choice', '请比较两端进度，再选择要使用的版本。');
        return remote;
      } catch (error) { this.failure(error, session ?? undefined); throw error; }
    });
  }

  getRemoteData(): AppData | null { return this.remote?.data ? validateBackup(this.remote.data) : null; }

  /** The caller has shown and confirmed this preview's expected revision. */
  async uploadLocal(local: AppData): Promise<void> {
    this.initialize();
    const snapshot = validateBackup(local);
    return this.serial(async () => {
      const session = this.authenticated(), epoch = this.epoch;
      if (!this.remote) throw new Error('请先读取并比较云端进度。');
      const expectedRevision = this.remote.revision;
      try {
        const fingerprint = await digest(snapshot);
        this.current(session, epoch); this.emit('syncing', '正在上传设备进度…');
        const remote = cloudState(await this.request(session.apiUrl, '/state', session.token, { expectedRevision, data: snapshot }, 'PUT'));
        this.current(session, epoch);
        if (remote.revision !== expectedRevision + 1 || !remote.data || await digest(remote.data) !== fingerprint) throw new Error('同步未完成，请重试。');
        this.session = { ...session, bound: true, revision: remote.revision, syncedDigest: fingerprint, lastSyncedAt: remote.updatedAt };
        this.latestLocal = snapshot; this.generation++; this.remote = remote; this.persist();
        this.emit('synced', '进度已同步。');
      } catch (error) { this.failure(error, session); throw error; }
    });
  }

  /** onReplace must durably back up and replace locally before this binds sync. */
  async useRemote(onReplace: (data: AppData) => Promise<void>): Promise<void> {
    this.initialize();
    return this.serial(async () => {
      const session = this.authenticated(), epoch = this.epoch;
      const remote = this.remote;
      if (!remote?.data) throw new Error('云端还没有可使用的进度。');
      try {
        const data = validateBackup(remote.data), fingerprint = await digest(data);
        this.current(session, epoch);
        await onReplace(data);
        this.current(session, epoch);
        this.session = { ...session, bound: true, revision: remote.revision, syncedDigest: fingerprint, lastSyncedAt: remote.updatedAt };
        this.latestLocal = data; this.generation++; this.persist();
        this.emit('synced', '已使用云端进度。');
      } catch (error) { this.failure(error, session); throw error; }
    });
  }

  notifyLocalChange(local: AppData): void {
    this.initialize();
    try { this.latestLocal = validateBackup(local); this.generation++; }
    catch (error) { this.failure(error); return; }
    if (!this.session?.bound || ['conflict', 'remote-newer', 'awaiting-choice', 'expired'].includes(this.status.phase)) return;
    this.scheduleAuto(false);
  }

  /** Safe to call at startup/online. It does not replace any device progress. */
  async resume(local: AppData): Promise<void> {
    this.initialize();
    this.latestLocal = validateBackup(local); this.generation++;
    if (!this.session || ['conflict', 'remote-newer'].includes(this.status.phase)) return;
    if (!this.session.bound) {
      try { await this.inspect(); } catch { /* The status exposes retry; local use continues. */ }
      return;
    }
    await this.scheduleAuto(true);
  }

  private scheduleAuto(checkRemote: boolean): Promise<void> {
    if (this.autoScheduled) return this.queue.then(() => {});
    this.autoScheduled = true;
    return this.serial(async () => {
      const sessionAtStart = this.session;
      try {
        while (this.latestLocal && this.session?.bound) {
          if (['conflict', 'remote-newer', 'awaiting-choice'].includes(this.status.phase)) return;
          const session = this.authenticated(), epoch = this.epoch;
          const local = this.latestLocal, generation = this.generation;
          const fingerprint = await digest(local);
          this.current(session, epoch);
          if (fingerprint === session.syncedDigest) {
            if (checkRemote) {
              const remote = await this.readRemote();
              if (remote.revision !== session.revision) {
                this.emit(remote.revision > session.revision ? 'remote-newer' : 'conflict', '云端进度已更新，请比较两端进度。');
                return;
              }
            }
            if (generation !== this.generation) continue;
            this.emit('synced', '设备与云端进度已同步。');
            return;
          }
          this.emit('syncing', '正在同步学习进度…');
          const remote = cloudState(await this.request(session.apiUrl, '/state', session.token, { expectedRevision: session.revision, data: local }, 'PUT'));
          this.current(session, epoch);
          if (remote.revision !== session.revision + 1 || !remote.data || await digest(remote.data) !== fingerprint) throw new Error('同步未完成，请重试。');
          this.session = { ...session, revision: remote.revision, syncedDigest: fingerprint, lastSyncedAt: remote.updatedAt };
          this.remote = remote; this.persist(); checkRemote = false;
          if (generation === this.generation) { this.emit('synced', '学习进度已同步。'); return; }
        }
      } catch (error) { this.failure(error, sessionAtStart ?? undefined); }
      finally { this.autoScheduled = false; }
    });
  }

  async logout(): Promise<boolean> {
    this.initialize();
    const previous = this.session;
    this.epoch++; this.session = null; this.remote = null;
    if (previous) this.clearMatchingToken(previous.token);
    this.emit('disconnected', '已退出同步账号。');
    if (!previous) return true;
    try { await this.request(previous.apiUrl, '/auth/logout', previous.token, undefined, 'POST'); return true; }
    catch { return false; }
  }
}

export const cloudSync = new CloudSyncClient();
export const getCloudSyncStatus = cloudSync.getStatus;
export const subscribeCloudSync = cloudSync.subscribe;
export const resumeSync = (data: AppData): Promise<void> => cloudSync.resume(data);
export const notifyLocalChange = (data: AppData): void => cloudSync.notifyLocalChange(data);
export const registerCloudAccount = (apiUrl: string, username: string, password: string, data: AppData): Promise<void> => cloudSync.register(apiUrl, username, password, data);
