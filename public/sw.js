/* Sententia: a production-only app shell. Learning data lives in IndexedDB. */
'use strict';

const APP_ROOT = new URL(self.registration.scope);
const ROOT_PATH = APP_ROOT.pathname;
// Other Pages repositories on the same *.github.io origin keep separate caches.
const CACHE_PREFIX = `sententia-offline-${encodeURIComponent(ROOT_PATH)}-`;
const CACHE_NAME = `${CACHE_PREFIX}v6`;
const ROOT_URL = APP_ROOT.href;
const FALLBACK_URL = new URL('__sententia_offline__', APP_ROOT).href;
const FALLBACK_HTML = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf9f6"><title>拾句 · 暂时离线</title><style>body{margin:0;background:#faf9f6;color:#1e2022;font:.9375rem/1.9 system-ui,sans-serif;min-height:100vh;display:grid;place-items:center}main{max-width:420px;padding:40px}small{color:#536c5d;letter-spacing:3px}h1{font:normal 1.875rem/1.6 Georgia,'Songti SC',serif;margin:20px 0}p{color:#777b74;font-size:.875rem}button{margin-top:15px;border:0;border-radius:6px;background:#284d3d;color:white;padding:12px 22px;font:inherit;cursor:pointer}</style><main><small>SENTENTIA · 拾句</small><h1>稍作停留，<br>等连接再次回响。</h1><p>当前设备还没有缓存完整的阅读界面。联网打开一次拾句后，即可在这里继续离线学习。已保存在浏览器的学习记录与收藏不会丢失。</p><button onclick="location.reload()">重新连接</button></main></html>`;

function isLocal(url) {
  return url.origin === APP_ROOT.origin && /^https?:$/.test(url.protocol) && url.pathname.startsWith(ROOT_PATH);
}

function isAsset(url) {
  const path = url.pathname.slice(ROOT_PATH.length);
  return path.startsWith('_next/static/') || path.startsWith('fonts/') || path === 'icon.svg' || path === 'manifest.webmanifest';
}

function isDevelopmentDocument(html) {
  return /\/_next\/static\/development\/|next-devtools|next\/dist\/client\/dev\/|webpack-hmr/.test(html);
}

function mayCache(response) {
  return response.ok && response.type !== 'opaque' && !/\bno-store\b|\bno-cache\b/i.test(response.headers.get('cache-control') || '');
}

function extractAssets(text, baseUrl, isCss = false) {
  const urls = new Set();
  const pattern = isCss ? /url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g : /(?:src|href)\s*=\s*['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(pattern)) {
    try {
      const url = new URL(match[1].replaceAll('&amp;', '&'), baseUrl);
      if (isLocal(url) && isAsset(url)) urls.add(url.href);
    } catch { /* Ignore malformed or data: references. */ }
  }
  return [...urls];
}

async function cacheAsset(url, cache, visited = new Set()) {
  if (visited.has(url)) return;
  visited.add(url);
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!mayCache(response)) return;
    await cache.put(url, response.clone());
    if (response.headers.get('content-type')?.includes('text/css')) {
      const nested = extractAssets(await response.text(), url, true);
      await Promise.allSettled(nested.map(asset => cacheAsset(asset, cache, visited)));
    }
  } catch { /* A missed asset can be cached on a later online visit. */ }
}

async function cacheDocument(response) {
  if (!mayCache(response) || !response.headers.get('content-type')?.includes('text/html')) return;
  const html = await response.clone().text();
  if (isDevelopmentDocument(html)) return;
  const cache = await caches.open(CACHE_NAME);
  const visited = new Set();
  // Save the shell after its entry chunks; the old shell stays usable meanwhile.
  await Promise.allSettled(extractAssets(html, ROOT_URL).map(url => cacheAsset(url, cache, visited)));
  await cache.put(ROOT_URL, response);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(FALLBACK_URL, new Response(FALLBACK_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    try {
      const shell = await fetch(ROOT_URL, { cache: 'reload', headers: { Accept: 'text/html' }, credentials: 'same-origin' });
      await cacheDocument(shell);
      await Promise.allSettled(['icon.svg', 'manifest.webmanifest'].map(path => cacheAsset(new URL(path, ROOT_URL).href, cache)));
    } catch { /* Installation still provides a clear offline fallback. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) || (ROOT_PATH === '/' && /^sententia-offline-v\d+$/.test(name))).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  const url = new URL(request.url);
  if (!isLocal(url)) return;
  const localPath = url.pathname.slice(ROOT_PATH.length);
  if (localPath === 'api' || localPath.startsWith('api/')) return;

  if (request.mode === 'navigate') {
    // This app routes views through its root query string. A root-site worker
    // must not replace another repository's document with this app when offline.
    if (url.pathname !== ROOT_PATH) return;
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && url.pathname === ROOT_PATH) event.waitUntil(cacheDocument(response.clone()));
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(ROOT_URL) || await cache.match(FALLBACK_URL) || new Response(FALLBACK_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  if (isAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (mayCache(response)) event.waitUntil(cache.put(request, response.clone()));
      return response;
    })());
  }
});
