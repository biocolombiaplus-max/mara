import { guard, saveImage, send } from './_lib.js';

// POST /api/upload { name, type, data(base64) } → guarda una foto y devuelve su URL pública
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!guard(req, res)) return;
  try {
    const { name = 'foto.webp', type = 'image/webp', data } = req.body || {};
    if (!data) return send(res, 400, { error: 'Falta la imagen' });
    if (!/^image\/(webp|jpeg|png)$/.test(type)) return send(res, 400, { error: 'Formato no permitido' });
    const buf = Buffer.from(String(data).replace(/^data:[^,]+,/, ''), 'base64');
    if (buf.length > 4 * 1024 * 1024) return send(res, 413, { error: 'La foto pesa más de 4 MB' });
    const safe = String(name).toLowerCase().normalize('NFD').replace(/[^a-z0-9.-]+/g, '-').slice(0, 80);
    send(res, 200, { url: await saveImage(`productos/${safe}`, buf, type) });
  } catch (e) {
    send(res, 500, { error: 'No se pudo subir la foto: ' + e.message });
  }
}
