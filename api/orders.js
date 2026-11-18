import { readOrder, writeOrder, listOrders, hasBlob, guard, isAdmin, send } from './_lib.js';

const STATUSES = ['recibido', 'preparando', 'en-camino', 'entregado', 'cancelado'];

// POST  /api/orders            → la tienda registra un pedido nuevo (público)
// GET   /api/orders?id=MS-...  → estado de un pedido para "Rastrea tu pedido" (público, datos mínimos)
// GET   /api/orders            → lista de pedidos (solo administradora)
// PATCH /api/orders { id, status } → cambia el estado (solo administradora)
export default async function handler(req, res) {
  try {
    if (!hasBlob()) return send(res, 503, { error: 'Falta conectar Vercel Blob', code: 'NO_BLOB' });
    if (req.method === 'POST') {
      const o = req.body || {};
      if (!/^MS-\d{5,10}$/.test(o.id || '') || !Array.isArray(o.items) || !o.items.length) return send(res, 400, { error: 'Pedido inválido' });
      if (await readOrder(o.id)) return send(res, 409, { error: 'El pedido ya existe' });
      const order = {
        id: o.id, date: Date.now(), status: 'recibido',
        customer: { name: String(o.name || '').slice(0, 120), email: String(o.email || '').slice(0, 160), phone: String(o.phone || '').slice(0, 20), doc: String(o.doc || '').slice(0, 20) },
        city: String(o.city || '').slice(0, 80), dep: String(o.dep || '').slice(0, 80), addr: String(o.addr || '').slice(0, 200),
        ship: o.ship, pay: o.pay, coupon: o.coupon || '',
        items: o.items.slice(0, 50).map((l) => ({ id: String(l.id), name: String(l.name || '').slice(0, 160), color: String(l.color || ''), size: String(l.size || ''), qty: Math.max(1, Math.min(10, +l.qty || 1)), price: +l.price || 0 })),
        totals: o.totals || {}
      };
      await writeOrder(order);
      return send(res, 201, { ok: true, id: order.id });
    }
    if (req.method === 'GET' && req.query.id) {
      const o = await readOrder(String(req.query.id).toUpperCase());
      if (!o) return send(res, 404, { error: 'No encontrado' });
      return send(res, 200, { id: o.id, status: o.status, city: o.city, dep: o.dep, date: o.date });
    }
    if (!isAdmin(req)) return send(res, 401, { error: 'Clave incorrecta' });
    if (req.method === 'GET') return send(res, 200, { orders: await listOrders() });
    if (req.method === 'PATCH') {
      if (!guard(req, res)) return;
      const { id, status } = req.body || {};
      if (!STATUSES.includes(status)) return send(res, 400, { error: 'Estado inválido' });
      const o = await readOrder(id); if (!o) return send(res, 404, { error: 'No encontrado' });
      o.status = status; o.updatedAt = Date.now();
      await writeOrder(o);
      return send(res, 200, o);
    }
    send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    send(res, 500, { error: 'Error con los pedidos: ' + e.message });
  }
}
