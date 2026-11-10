// Small fetch wrapper with JWT + refresh-token handling.
const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'nexgen.session';

export const session = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
  set(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

let onLogout = () => {};
export const setLogoutHandler = (fn) => { onLogout = fn; };

async function refresh() {
  const s = session.get();
  if (!s?.refreshToken) return false;
  const r = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: s.refreshToken }),
  });
  if (!r.ok) return false;
  session.set(await r.json());
  return true;
}

export async function api(path, { method = 'GET', body, raw, retry = true } = {}) {
  const s = session.get();
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(s?.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && retry && s?.refreshToken && !path.startsWith('/auth/')) {
    if (await refresh()) return api(path, { method, body, raw, retry: false });
    session.clear(); onLogout();
  }
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${r.status})`);
  }
  if (raw) return r;
  return r.status === 204 ? null : r.json();
}

export async function download(path, filename) {
  const r = await api(path, { raw: true });
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
