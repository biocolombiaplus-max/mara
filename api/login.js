import { isAdmin, hasBlob, send } from './_lib.js';

// POST /api/login  (header x-admin-key) → verifica la clave del panel
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Clave incorrecta' });
  send(res, 200, { ok: true, blob: hasBlob(), gemini: !!process.env.GEMINI_API_KEY });
}
