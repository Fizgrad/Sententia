import { createServer } from 'node:http';
import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

const output = resolve('out');
if (!existsSync(resolve(output, 'index.html'))) { console.error('请先运行 npm run build，生成可离线使用的正式版本。'); process.exit(1); }
const root = realpathSync(output);
const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (args[index + 1] === undefined || args[index + 1].startsWith('--')) throw new Error(`${name} 需要参数。`);
  return args[index + 1];
}
function normaliseBasePath(value = '') {
  if (value === '' || value === '/') return '';
  if (value !== value.trim() || !value.startsWith('/') || value.startsWith('//') || /[\\?#%\s:]/.test(value)) throw new Error('站点路径必须为空或 /sententia 这样的本地路径。');
  const path = value.endsWith('/') ? value.slice(0, -1) : value;
  if (path.split('/').slice(1).some(segment => !/^[A-Za-z0-9._-]+$/.test(segment) || segment === '.' || segment === '..')) throw new Error('站点路径包含无效片段。');
  return path;
}
const port = Number(option('--port', process.env.PORT || '3000'));
const basePath = normaliseBasePath(option('--base-path', process.env.NEXT_PUBLIC_BASE_PATH || ''));
if (!Number.isInteger(port) || port < 1 || port > 65535) { console.error('端口必须为 1 到 65535 之间的整数。'); process.exit(1); }
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.woff2':'font/woff2', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };
function withinRoot(path) { return path === root || path.startsWith(root + sep); }

const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || '')) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let url, pathname;
  try {
    if (!request.url?.startsWith('/')) throw new Error('Invalid request target');
    // Check the unnormalised target too: URL() removes literal and encoded ../.
    const original = decodeURIComponent(request.url.split(/[?#]/, 1)[0]);
    if (/[\\\u0000]/.test(original) || original.split('/').some(segment => segment === '.' || segment === '..')) { response.writeHead(403); response.end('Forbidden'); return; }
    url = new URL(request.url, 'http://localhost');
    pathname = decodeURIComponent(url.pathname);
  } catch { response.writeHead(400); response.end('Bad request'); return; }
  if (basePath && pathname === basePath) { response.writeHead(308, { Location: `${basePath}/${url.search}` }); response.end(); return; }
  if (basePath && !pathname.startsWith(basePath + '/')) { response.writeHead(404); response.end('Not found'); return; }
  const path = basePath ? pathname.slice(basePath.length) : pathname;
  if (path.split('/').some(segment => segment.startsWith('.'))) { response.writeHead(404); response.end('Not found'); return; }
  const target = resolve(root, `.${path === '/' ? '/index.html' : path}`);
  if (!withinRoot(target)) { response.writeHead(403); response.end('Forbidden'); return; }
  let file = target;
  try {
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    if (!statSync(file).isFile()) throw new Error();
    file = realpathSync(file);
    if (!withinRoot(file)) { response.writeHead(403); response.end('Forbidden'); return; }
  } catch {
    const fallback = resolve(root, '404.html');
    response.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
    if (request.method === 'HEAD') response.end();
    else if (existsSync(fallback)) createReadStream(fallback).pipe(response);
    else response.end('Not found');
    return;
  }
  const headers = { 'Content-Type':mime[extname(file)] || 'application/octet-stream', 'Cache-Control':path.startsWith('/_next/static/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'same-origin' };
  if (path === '/sw.js') headers['Service-Worker-Allowed'] = `${basePath}/`;
  response.writeHead(200, headers);
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).on('error', () => response.destroy()).pipe(response);
});
server.on('error', error => { console.error(`启动失败：${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Sententia · 拾句\nLocal: http://127.0.0.1:${port}${basePath}/\n按 Ctrl+C 停止。`));
