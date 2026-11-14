import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { normalizeBasePath, assetPath, appPath } from '../src/lib/asset-path';

test('Pages base paths accept a repository path and reject origins or traversals', () => {
  for (const value of [undefined, '', '/']) assert.equal(normalizeBasePath(value), '');
  assert.equal(normalizeBasePath('/Sententia'), '/Sententia');
  assert.equal(normalizeBasePath('/apps/sententia/'), '/apps/sententia');
  for (const value of ['sententia', '//host', 'https://host/repo', '/a//b', '/a/../b', '/./repo', '/repo?x', '/repo#x', '/a%2fb', '/a\\b', ' /repo', '/repo ', '/a b']) {
    assert.throws(() => normalizeBasePath(value), value);
  }
});

test('app navigation and public resources stay beneath the configured repository', () => {
  for (const resource of ['/icon.svg', '/manifest.webmanifest', '/sw.js', '/fonts/newsreader-400.ttf', '/licenses/WordNet.txt', '/_next/static/chunks/app.js']) {
    assert.equal(assetPath(resource, ''), resource);
    assert.equal(assetPath(resource, '/sententia'), `/sententia${resource}`);
  }
  assert.equal(appPath(undefined, '/sententia'), '/sententia/');
  assert.equal(appPath('learn', '/sententia'), '/sententia/');
  assert.equal(appPath('matrix', '/sententia'), '/sententia/?view=matrix');
  assert.equal(appPath('a&b', '/sententia'), '/sententia/?view=a%26b');
  for (const path of ['https://other.test/x', '//other.test/x', 'icon.svg', '/../../config', '/%2e%2e/config', '/a\\b', '/%00secret']) {
    assert.throws(() => assetPath(path, '/sententia'), path);
  }
});

test('the web manifest resolves its entry, scope and icons inside a project site', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  const location = 'https://example.github.io/sententia/manifest.webmanifest';
  assert.equal(new URL(manifest.start_url, location).href, 'https://example.github.io/sententia/');
  assert.equal(new URL(manifest.scope, location).href, 'https://example.github.io/sententia/');
  assert.equal(new URL(manifest.icons[0].src, location).href, 'https://example.github.io/sententia/icon.svg');
});

const workerSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker(scope: string) {
  const handlers: Record<string, (event: unknown) => void> = {};
  const removed: string[] = [];
  const context = createContext({
    URL, Response, Headers, Request, console,
    self: { registration: { scope }, location: new URL(scope + 'sw.js'), addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; }, clients: { claim: async () => {} } },
    caches: { keys: async () => ['sententia-offline-%2Fsententia%2F-v1', 'sententia-offline-%2Fother%2F-v1', 'sententia-offline-v4'], delete: async (name: string) => { removed.push(name); return true; } },
  });
  runInContext(workerSource, context);
  return { context, handlers, removed };
}

test('the service worker recognises only its own static scope and never intercepts API or bearer requests', () => {
  const app = worker('https://example.github.io/sententia/');
  assert.equal(runInContext('ROOT_URL', app.context), 'https://example.github.io/sententia/');
  assert.equal(runInContext("isLocal(new URL('https://example.github.io/another/'))", app.context), false);
  assert.equal(runInContext("isAsset(new URL('https://example.github.io/sententia/_next/static/chunks/app.js'))", app.context), true);
  assert.equal(runInContext("isAsset(new URL('https://example.github.io/_next/static/chunks/app.js'))", app.context), false);
  assert.equal(runInContext("isAsset(new URL('https://example.github.io/sententia/fonts/font.ttf'))", app.context), true);
  for (const input of [
    { url:'https://api.example.test/api/v1/state', method:'GET', mode:'cors', headers:new Headers({Authorization:'Bearer personal-session'}) },
    { url:'https://example.github.io/sententia/api/v1/state', method:'GET', mode:'navigate', headers:new Headers() },
    { url:'https://example.github.io/sententia/_next/static/chunks/app.js', method:'GET', mode:'cors', headers:new Headers({Authorization:'Bearer personal-session'}) },
    { url:'https://example.github.io/another/', method:'GET', mode:'navigate', headers:new Headers() },
    { url:'https://example.github.io/sententia/another/', method:'GET', mode:'navigate', headers:new Headers() },
    { url:'https://example.github.io/sententia/api/v1/state', method:'PUT', mode:'cors', headers:new Headers() },
  ]) {
    let intercepted = false;
    app.handlers.fetch({ request: input, respondWith: () => { intercepted = true; }, waitUntil: () => {} });
    assert.equal(intercepted, false, `${input.method} ${input.url}`);
  }
});

test('service-worker cache cleanup leaves other project sites and root caches untouched', async () => {
  const app = worker('https://example.github.io/sententia/');
  let completing: Promise<void> | undefined;
  app.handlers.activate({ waitUntil: (promise: Promise<void>) => { completing = promise; } });
  await completing;
  assert.deepEqual(app.removed, ['sententia-offline-%2Fsententia%2F-v1']);
});

test('the Pages workflow publishes only static out assets and never injects database secrets', () => {
  const workflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /NEXT_PUBLIC_BASE_PATH: \$\{\{ steps\.pages\.outputs\.base_path \}\}/);
  assert.match(workflow, /NEXT_PUBLIC_API_URL: \$\{\{ vars\.NEXT_PUBLIC_API_URL \}\}/);
  assert.match(workflow, /uses: actions\/upload-pages-artifact@v4[\s\S]*?path: out\b/);
  assert.doesNotMatch(workflow, /\bsecrets\.|NEXT_PUBLIC_(?:DB|DATABASE|PASSWORD|TOKEN|SECRET)/i);
});

test('local static previews support a repository path without exposing sibling files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sententia-pages-'));
  const childScript = fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url));
  const root = join(directory, 'out');
  await mkdir(join(root, '_next', 'static'), { recursive: true });
  await mkdir(join(root, 'fonts'), { recursive: true });
  await writeFile(join(root, 'index.html'), '<h1>Local project site</h1>');
  await writeFile(join(root, 'sw.js'), '/* static service worker */');
  await writeFile(join(root, '_next', 'static', 'app.js'), 'window.ready=true');
  await writeFile(join(root, 'fonts', 'font.ttf'), 'font-bytes');
  await writeFile(join(directory, 'private.txt'), 'PRIVATE-SIBLING-CONTENT');
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>(done => reservation.close(() => done()));
  const child = spawn(process.execPath, [childScript, '--port', String(port), '--base-path', '/sententia'], { cwd: directory, env: { ...process.env, NEXT_PUBLIC_BASE_PATH:'' }, windowsHide:true, stdio:['ignore','pipe','pipe'] });
  try {
    await new Promise<void>((done, fail) => {
      const timeout = setTimeout(() => fail(new Error('Preview did not start.')), 8000);
      child.once('error', error => { clearTimeout(timeout); fail(error); });
      child.stdout.on('data', chunk => { if (chunk.toString().includes('Local:')) { clearTimeout(timeout); done(); } });
      child.stderr.on('data', chunk => { clearTimeout(timeout); fail(new Error(chunk.toString())); });
    });
    const origin = `http://127.0.0.1:${port}`;
    const redirect = await fetch(`${origin}/sententia?view=matrix`, { redirect:'manual' });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), '/sententia/?view=matrix');
    assert.match(await (await fetch(`${origin}/sententia/`)).text(), /Local project site/);
    assert.equal((await fetch(`${origin}/sententia/_next/static/app.js`)).headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal((await fetch(`${origin}/sententia/fonts/font.ttf`)).status, 200);
    assert.equal((await fetch(`${origin}/sententia/sw.js`)).headers.get('service-worker-allowed'), '/sententia/');
    assert.equal((await fetch(`${origin}/_next/static/app.js`)).status, 404);
    assert.equal((await fetch(`${origin}/sententia/`, {method:'POST'})).status, 405);
    const traversal = await new Promise<{status:number;body:string}>((done, fail) => {
      const pending = request({ hostname:'127.0.0.1', port, path:'/sententia/%2e%2e/private.txt' }, response => {
        let body=''; response.setEncoding('utf8');response.on('data', part=>body+=part);response.on('end',()=>done({status:response.statusCode??0,body}));
      });pending.on('error',fail);pending.end();
    });
    assert.equal(traversal.status, 403);
    assert.doesNotMatch(traversal.body, /PRIVATE-SIBLING-CONTENT/);
  } finally {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit'); }
    // The recursive cleanup is limited to the exact temporary directory above.
    assert.equal(resolve(dirname(directory)), resolve(tmpdir()));
    assert.ok(directory.split(/[\\/]/).pop()?.startsWith('sententia-pages-'));
    await rm(directory, {recursive:true,force:true});
  }
});
