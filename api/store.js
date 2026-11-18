import { readStore, writeStore, emptyStore, hasBlob, guard, send } from './_lib.js';

// GET /api/store  → catálogo administrado (público, lo lee la tienda)
// PUT /api/store  → guarda el catálogo (solo administradora)
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!hasBlob()) return send(res, 200, Object.assign(emptyStore(), { configured: false }));
      return send(res, 200, Object.assign(await readStore(), { configured: true }));
    }
    if (req.method === 'PUT') {
      if (!guard(req, res)) return;
      const b = req.body || {};
      const store = { version: 1, overrides: b.overrides || {}, products: Array.isArray(b.products) ? b.products : [], settings: b.settings || {} };
      return send(res, 200, await writeStore(store));
    }
    send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    send(res, 500, { error: 'No se pudo leer o guardar el catálogo: ' + e.message });
  }
}
