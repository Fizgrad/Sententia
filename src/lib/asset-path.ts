/** Public build configuration only. Never put credentials in NEXT_PUBLIC_* values. */
export function normalizeBasePath(value: string | undefined): string {
  if (value === undefined || value === '' || value === '/') return '';
  if (value !== value.trim() || !value.startsWith('/') || value.startsWith('//') || /[\\?#%\s:]/.test(value)) {
    throw new Error('NEXT_PUBLIC_BASE_PATH must be empty or a local path such as /sententia.');
  }
  const path = value.endsWith('/') ? value.slice(0, -1) : value;
  if (path.split('/').slice(1).some(segment => !/^[A-Za-z0-9._-]+$/.test(segment) || segment === '.' || segment === '..')) {
    throw new Error('NEXT_PUBLIC_BASE_PATH contains an invalid path segment.');
  }
  return path;
}

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Prefix an app-local absolute path; queries and fragments remain intact. */
export function assetPath(path: string, basePath: string = BASE_PATH): string {
  const pathname = path.split(/[?#]/, 1)[0];
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s\u0000-\u001f]/.test(pathname)) {
    throw new Error('Expected an app-local absolute path.');
  }
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { throw new Error('Invalid app path encoding.'); }
  if (/[\\\u0000-\u001f]/.test(decoded) || decoded.split('/').some(segment => segment === '.' || segment === '..')) {
    throw new Error('App paths cannot traverse directories.');
  }
  return `${normalizeBasePath(basePath)}${path}`;
}

export function appPath(view?: string, basePath: string = BASE_PATH): string {
  return assetPath('/', basePath) + (view && view !== 'learn' ? `?view=${encodeURIComponent(view)}` : '');
}
