import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOUD_SESSION_KEY, CloudSyncClient, normalizeCloudApiUrl, type CloudState, type CloudStorage } from '../src/lib/cloud-sync';
import { defaultData } from '../src/lib/store';
import { createQueuedRecord } from '../src/lib/scheduler';
import type { AppData } from '../src/lib/types';

const NOW = Date.parse('2026-11-14T02:00:00.000Z');
const API = 'https://progress.example.com';
const SECRET = 'a-test-password-never-written-to-storage';
class MemoryStorage implements CloudStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function dataWithWord(): AppData {
  const data = defaultData();
  data.records.mitigate = createQueuedRecord('mitigate', new Date(NOW));
  return data;
}
interface Call { path: string; method: string; body?: Record<string, unknown>; authorization: string | undefined }
class FakeApi {
  calls: Call[] = [];
  state: CloudState = { revision: 0, data: null, updatedAt: null };
  offline = false;
  registerConflict = false;
  registrationMode: 'open' | 'disabled' = 'open';
  gateNextPut: Promise<void> | null = null;
  revokeCount = 0;
  fetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const path = url.pathname.replace('/api/v1', '');
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
    this.calls.push({ path, method, body, authorization });
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'error');
    if (this.offline) throw new TypeError('offline');
    if (path === '/auth/config') return Response.json({ registrationMode: this.registrationMode });
    if (path === '/auth/login' || path === '/auth/register') {
      if (path === '/auth/register' && this.registerConflict) return Response.json({ detail: 'used' }, { status: 409 });
      return Response.json({ token: 'a'.repeat(43), expiresAt: new Date(NOW + 86_400_000).toISOString(), user: { id: 'account_alice', username: 'alice' } }, { status: path === '/auth/register' ? 201 : 200 });
    }
    assert.equal(authorization, `Bearer ${'a'.repeat(43)}`);
    if (path === '/auth/logout') { this.revokeCount++; return new Response(null, { status: 204 }); }
    if (path === '/state' && method === 'GET') return Response.json(clone(this.state));
    if (path === '/state' && method === 'PUT') {
      if (this.gateNextPut) { const gate = this.gateNextPut; this.gateNextPut = null; await gate; }
      if (body?.expectedRevision !== this.state.revision) return Response.json({ detail: 'changed', revision: this.state.revision }, { status: 409 });
      this.state = { revision: this.state.revision + 1, data: clone(body.data as AppData), updatedAt: new Date(NOW).toISOString() };
      return Response.json(clone(this.state));
    }
    return new Response(null, { status: 404 });
  };
}
function setup() {
  const api = new FakeApi(), storage = new MemoryStorage();
  const client = new CloudSyncClient({ fetch: api.fetch, storage, now: () => NOW });
  return { api, storage, client };
}
async function waitFor(predicate: () => boolean): Promise<void> {
  for (let count = 0; count < 300; count++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail('The expected asynchronous sync state was not reached.');
}
async function bindEmpty(client: CloudSyncClient, data: AppData) {
  await client.login(API, 'alice', SECRET, data);
  await client.uploadLocal(data);
}

test('sync origins require HTTPS or a loopback and cannot smuggle credentials or paths', () => {
  assert.equal(normalizeCloudApiUrl(' https://106.13.2.32/ '), 'https://106.13.2.32');
  assert.equal(normalizeCloudApiUrl('http://127.0.0.1:8765'), 'http://127.0.0.1:8765');
  assert.equal(normalizeCloudApiUrl('http://localhost:8765/'), 'http://localhost:8765');
  assert.equal(normalizeCloudApiUrl('http://[::1]:8765'), 'http://[::1]:8765');
  for (const value of ['http://106.13.2.32', 'http://localhost.evil.test', 'https://name:password@example.com', 'https://example.com/api', 'https://example.com/api/..', 'https://example.com/%2e%2e', 'https://example.com?token=secret', 'https://example.com/#token', 'https://exam\nple.com', 'https://example.com\\api', 'javascript:alert(1)']) {
    assert.throws(() => normalizeCloudApiUrl(value), value);
  }
});

test('login only previews progress and never persists a password or implicitly uploads', async () => {
  const { api, storage, client } = setup(), local = dataWithWord();
  const original = clone(local);
  await client.login(API, 'alice', SECRET, local);
  assert.equal(client.getStatus().phase, 'awaiting-choice');
  assert.equal(client.getStatus().bound, false);
  assert.equal(client.getStatus().remote?.hasData, false);
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 0);
  assert.equal(api.state.data, null);
  assert.deepEqual(local, original);
  assert.ok(storage.getItem(CLOUD_SESSION_KEY));
  assert.ok(!storage.getItem(CLOUD_SESSION_KEY)!.includes(SECRET));
  assert.ok(!storage.getItem(CLOUD_SESSION_KEY)!.includes('password'));
  client.notifyLocalChange({ ...local, preferences: { ...local.preferences, dailyGoal: 15 } });
  await client.resume(local);
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 0, 'first-sync consent is still required');
});

test('public registration validates credentials and also waits for a first-sync choice', async () => {
  const { api, client } = setup(), local = defaultData();
  assert.equal(await client.registrationMode(API), 'open');
  await assert.rejects(client.register(API, 'bad name', SECRET, local), /3–40/);
  await assert.rejects(client.register(API, 'alice', 'short', local), /12–128/);
  await client.register(API, 'Alice', SECRET, local);
  assert.equal(api.calls.filter(call => call.path === '/auth/register').length, 1);
  assert.equal(client.getStatus().phase, 'awaiting-choice');
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 0);
});

test('an already-used registration name is not treated as a progress conflict', async () => {
  const { api, client } = setup(); api.registerConflict = true;
  await assert.rejects(client.register(API, 'alice', SECRET, defaultData()), /已被使用/);
  assert.equal(client.getStatus().loggedIn, false);
  assert.notEqual(client.getStatus().phase, 'conflict');
});

test('password limits count Unicode code points and preserve supplementary characters in requests', async () => {
  for (const length of [12, 90, 128]) {
    const { api, client } = setup();
    const password = '🔐'.repeat(length);
    await client.register(API, 'alice', password, defaultData());
    assert.equal(api.calls.find(call => call.path === '/auth/register')?.body?.password, password);
    const login = setup();
    await login.client.login(API, 'alice', password, defaultData());
    assert.equal(login.api.calls.find(call => call.path === '/auth/login')?.body?.password, password);
  }
  const { api, client } = setup();
  await assert.rejects(client.register(API, 'alice', '🔐'.repeat(11), defaultData()), /12–128/);
  await assert.rejects(client.register(API, 'alice', '🔐'.repeat(129), defaultData()), /12–128/);
  await assert.rejects(client.login(API, 'alice', '🔐'.repeat(129), defaultData()), /128/);
  await assert.rejects(client.login(API, 'alice', 'x'.repeat(129), defaultData()), /128/);
  assert.equal(api.calls.length, 0, 'invalid passwords must be rejected before a request');
});

test('using remote progress waits for a durable local replacement before binding auto sync', async () => {
  const { api, client } = setup();
  const cloud = dataWithWord(); cloud.preferences.name = 'Cloud reader';
  api.state = { revision: 4, data: cloud, updatedAt: new Date(NOW).toISOString() };
  await client.login(API, 'alice', SECRET, defaultData());
  let replaced: AppData | null = null;
  await client.useRemote(async data => {
    assert.equal(client.getStatus().bound, false);
    replaced = data;
  });
  assert.deepEqual(replaced, cloud);
  assert.equal(client.getStatus().phase, 'synced');
  assert.equal(client.getStatus().bound, true);
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 0);
});

test('a failed local replacement leaves first-sync consent and the old device data intact', async () => {
  const { api, client } = setup(); api.state = { revision: 2, data: dataWithWord(), updatedAt: new Date(NOW).toISOString() };
  const local = defaultData();
  await client.login(API, 'alice', SECRET, local);
  await assert.rejects(client.useRemote(async () => { throw new Error('local backup could not be saved'); }), /backup/);
  assert.equal(client.getStatus().bound, false);
  assert.deepEqual(local, defaultData());
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 0);
});

test('serialized auto sync saves the latest change made while another save is in flight', async () => {
  const { api, client } = setup(), initial = defaultData();
  await bindEmpty(client, initial);
  let release!: () => void;
  api.gateNextPut = new Promise<void>(resolve => { release = resolve; });
  const first = { ...initial, preferences: { ...initial.preferences, dailyGoal: 15 } };
  const latest = { ...initial, preferences: { ...initial.preferences, dailyGoal: 20 } };
  client.notifyLocalChange(first);
  await waitFor(() => api.calls.filter(call => call.method === 'PUT').length === 2);
  client.notifyLocalChange(latest);
  release();
  await client.resume(latest);
  assert.equal(api.state.data?.preferences.dailyGoal, 20);
  assert.deepEqual(api.calls.filter(call => call.method === 'PUT').map(call => call.body?.expectedRevision), [0, 1, 2]);
  assert.equal(client.getStatus().phase, 'synced');
});

for (const alreadyBound of [false, true]) test(`an explicit ${alreadyBound ? 'replacement' : 'first'} upload retains changes saved while its request is in flight`, async () => {
  const { api, client } = setup(), initial = defaultData();
  await client.login(API, 'alice', SECRET, initial);
  if (alreadyBound) {
    await client.uploadLocal(initial);
    await client.inspect();
  }
  let release!: () => void;
  api.gateNextPut = new Promise<void>(resolve => { release = resolve; });
  const uploading = client.uploadLocal(initial);
  await waitFor(() => api.calls.some(call => call.method === 'PUT' && call.body?.expectedRevision === (alreadyBound ? 1 : 0)));
  const latest = dataWithWord();
  client.notifyLocalChange(latest);
  release();
  await uploading;
  await waitFor(() => api.state.data?.records.mitigate !== undefined && client.getStatus().phase === 'synced');
  assert.deepEqual(api.state.data, latest);
  assert.equal(api.state.revision, alreadyBound ? 3 : 2);
});

test('offline saves remain pending and a new page detects and uploads them from the local snapshot', async () => {
  const { api, storage, client } = setup(), initial = defaultData();
  await bindEmpty(client, initial);
  api.offline = true;
  const latest = dataWithWord();
  assert.doesNotThrow(() => client.notifyLocalChange(latest));
  await waitFor(() => client.getStatus().phase === 'pending');
  assert.equal(api.state.revision, 1);
  api.offline = false;
  const reloaded = new CloudSyncClient({ storage, fetch: api.fetch, now: () => NOW });
  await reloaded.resume(latest);
  assert.deepEqual(api.state.data, latest);
  assert.equal(api.state.revision, 2);
  assert.equal(reloaded.getStatus().phase, 'synced');
});

test('CAS conflicts stop automatic overwrites and require a new explicit comparison and choice', async () => {
  const { api, client } = setup(), initial = defaultData();
  await bindEmpty(client, initial);
  const remote = dataWithWord(); remote.preferences.name = 'Other device';
  api.state = { revision: 2, data: clone(remote), updatedAt: new Date(NOW).toISOString() };
  const local = { ...initial, preferences: { ...initial.preferences, dailyGoal: 15 } };
  client.notifyLocalChange(local);
  await waitFor(() => client.getStatus().phase === 'conflict');
  const puts = api.calls.filter(call => call.method === 'PUT').length;
  await client.resume(local);
  client.notifyLocalChange(local);
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, puts);
  assert.deepEqual(api.state.data, remote);
  await assert.rejects(client.uploadLocal(local), /先读取/);
  await client.inspect();
  assert.equal(client.getStatus().remote?.revision, 2);
  assert.deepEqual(api.state.data, remote);
  await client.uploadLocal(local); // An explicit user-confirmed direction after comparison.
  assert.equal(api.state.revision, 3);
  assert.equal(api.state.data?.preferences.dailyGoal, 15);
});

test('a clean device reports newer remote progress without silently replacing or overwriting it', async () => {
  const { api, client } = setup(), initial = defaultData();
  await bindEmpty(client, initial);
  api.state = { revision: 2, data: dataWithWord(), updatedAt: new Date(NOW).toISOString() };
  await client.resume(initial);
  assert.equal(client.getStatus().phase, 'remote-newer');
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, 1);
  assert.deepEqual(initial, defaultData());
});

test('a stale tab never adopts a newer shared revision to upload its stale local view', async () => {
  const { api, storage, client } = setup(), initial = defaultData();
  await bindEmpty(client, initial);
  const staleTab = new CloudSyncClient({ storage, fetch: api.fetch, now: () => NOW });
  await staleTab.resume(initial);
  const latest = dataWithWord(); client.notifyLocalChange(latest); await client.resume(latest);
  const puts = api.calls.filter(call => call.method === 'PUT').length;
  await staleTab.resume(initial);
  assert.equal(staleTab.getStatus().phase, 'remote-newer');
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, puts);
  assert.deepEqual(api.state.data, latest);
});

test('logging out revokes the session, keeps local data and prevents later automatic uploads', async () => {
  const { api, storage, client } = setup(), local = dataWithWord();
  await bindEmpty(client, local);
  assert.equal(await client.logout(), true);
  assert.equal(api.revokeCount, 1);
  assert.equal(storage.getItem(CLOUD_SESSION_KEY), null);
  const puts = api.calls.filter(call => call.method === 'PUT').length;
  client.notifyLocalChange({ ...local, preferences: { ...local.preferences, dailyGoal: 15 } });
  await client.resume(local);
  assert.equal(api.calls.filter(call => call.method === 'PUT').length, puts);
  assert.equal(client.getStatus().loggedIn, false);
  assert.equal(Object.keys(local.records).length, 1);
});

test('server-side logout failure still removes the device session and is reported honestly', async () => {
  const { api, storage, client } = setup();
  await client.login(API, 'alice', SECRET, defaultData());
  api.offline = true;
  assert.equal(await client.logout(), false);
  assert.equal(storage.getItem(CLOUD_SESSION_KEY), null);
  assert.equal(client.getStatus().loggedIn, false);
});

test('corrupt local session metadata never triggers a server write or changes local progress', async () => {
  const { api, storage } = setup(); storage.setItem(CLOUD_SESSION_KEY, '{broken');
  const client = new CloudSyncClient({ storage, fetch: api.fetch, now: () => NOW });
  const local = dataWithWord();
  await client.resume(local);
  assert.equal(client.getStatus().loggedIn, false);
  assert.equal(api.calls.length, 0);
  assert.equal(Object.keys(local.records).length, 1);
});

test('a logout while login is in flight cannot resurrect a cancelled session', async () => {
  const storage=new MemoryStorage();let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const api=new FakeApi();
  const fetcher:typeof fetch=async(input,init)=>{
    if(String(input).endsWith('/auth/login'))await gate;
    return api.fetch(input,init);
  };
  const client=new CloudSyncClient({storage,fetch:fetcher,now:()=>NOW});
  const pending=client.login(API,'alice',SECRET,defaultData());
  await new Promise(resolve=>setTimeout(resolve,5));
  await client.logout();release();
  await assert.rejects(pending);
  assert.equal(client.getStatus().loggedIn,false);
  assert.equal(storage.getItem(CLOUD_SESSION_KEY),null);
  await waitFor(()=>api.revokeCount===1);
});

test('revoked server sessions stop auto sync without discarding the local snapshot', async () => {
  const api=new FakeApi(),storage=new MemoryStorage();let expired=false;
  const fetcher:typeof fetch=async(input,init)=>expired&&init?.method==='PUT'?new Response(null,{status:401}):api.fetch(input,init);
  const client=new CloudSyncClient({storage,fetch:fetcher,now:()=>NOW});
  await bindEmpty(client,defaultData());expired=true;
  const local=dataWithWord();client.notifyLocalChange(local);
  await waitFor(()=>client.getStatus().phase==='expired');
  assert.equal(storage.getItem(CLOUD_SESSION_KEY),null);
  assert.equal(client.getStatus().loggedIn,false);
  assert.equal(Object.keys(local.records).length,1);
  assert.equal(api.state.revision,1);
});

test('logging out in another tab prevents this tab from starting a later upload', async () => {
  const {api,storage,client}=setup(),initial=defaultData();
  await bindEmpty(client,initial);
  const other=new CloudSyncClient({storage,fetch:api.fetch,now:()=>NOW});
  await other.resume(initial);
  await client.logout();
  const before=api.calls.filter(call=>call.method==='PUT').length;
  other.notifyLocalChange(dataWithWord());
  await waitFor(()=>other.getStatus().phase==='disconnected');
  assert.equal(api.calls.filter(call=>call.method==='PUT').length,before);
  assert.equal(storage.getItem(CLOUD_SESSION_KEY),null);
});
