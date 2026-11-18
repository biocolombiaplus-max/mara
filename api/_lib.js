// Utilidades compartidas por las funciones del panel (los archivos con "_" no son rutas públicas).
import { put, get, list, del } from '@vercel/blob';

export const ACCESS = process.env.BLOB_ACCESS === 'private' ? 'private' : 'public';
const STORE_PATH = 'data/tienda.json';

export function hasBlob() { return !!process.env.BLOB_READ_WRITE_TOKEN; }

// Clave del panel: variable ADMIN_PASSWORD en Vercel (por defecto 123456)
export function isAdmin(req) {
  const pass = process.env.ADMIN_PASSWORD || '123456';
  return (req.headers['x-admin-key'] || '') === pass;
}

export function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

export function guard(req, res) {
  if (!isAdmin(req)) { send(res, 401, { error: 'Clave incorrecta' }); return false; }
  if (!hasBlob()) { send(res, 503, { error: 'Falta conectar Vercel Blob al proyecto', code: 'NO_BLOB' }); return false; }
  return true;
}

async function readJSON(pathname) {
  try {
    const r = await get(pathname, { access: ACCESS, useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    if (e && /not.?found/i.test(e.name + e.message)) return null;
    throw e;
  }
}

async function writeJSON(pathname, data) {
  return put(pathname, JSON.stringify(data), {
    access: ACCESS, addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 60
  });
}

export const emptyStore = () => ({ version: 1, updatedAt: null, overrides: {}, products: [], settings: {} });
export async function readStore() { return (await readJSON(STORE_PATH)) || emptyStore(); }
export async function writeStore(store) { store.updatedAt = new Date().toISOString(); await writeJSON(STORE_PATH, store); return store; }

export async function readOrder(id) { return readJSON(`pedidos/${id}.json`); }
export async function writeOrder(order) { return writeJSON(`pedidos/${order.id}.json`, order); }
export async function listOrders() {
  const out = []; let cursor;
  do {
    const r = await list({ prefix: 'pedidos/', cursor, limit: 1000 });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : null;
  } while (cursor);
  out.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const items = await Promise.all(out.slice(0, 200).map((b) => readJSON(b.pathname).catch(() => null)));
  return items.filter(Boolean);
}

export async function saveImage(pathname, buffer, contentType) {
  const r = await put(pathname, buffer, { access: ACCESS, addRandomSuffix: true, contentType, cacheControlMaxAge: 31536000 });
  return r.url;
}
export { del };
