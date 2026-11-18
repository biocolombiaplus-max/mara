/* =========================================================================
   MARA Sport · Panel administrativo
   - Acceso con clave (por defecto 123456; cámbiala con ADMIN_PASSWORD en Vercel)
   - Productos: crear, editar, ocultar, precios, tallas y stock
   - Estudio de fotos: quita el fondo y crea tomas de estudio gratis en el
     navegador, o con Gemini (estudio IA y fotos con modelo)
   - Pedidos con cambio de estado
   Con Vercel Blob conectado, los cambios se publican para todas las clientas.
   Sin servidor (modo demo), se guardan solo en este navegador.
   ========================================================================= */
(function () {
  'use strict';
  const APP = window.MARA_APP;
  const D = window.MARA_DATA;
  const { fmt, esc, toast, store } = APP;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const KEY = 'mara_admin_key';
  const STUDIO_BG = '#F7F2EF';

  const state = {
    key: sessionStorage.getItem(KEY) || '',
    mode: sessionStorage.getItem('mara_admin_mode') || '', // 'vercel' | 'demo'
    gemini: sessionStorage.getItem('mara_admin_gemini') === '1',
    data: null,          // { overrides, products, settings }
    orders: null,
    draft: null, dirty: false, colorIdx: 0,
    raw: {}              // fotos originales de esta sesión (para enviarlas a la IA)
  };

  /* ---------------- API ---------------- */
  async function api(method, path, body) {
    try {
      const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'x-admin-key': state.key }, body: body ? JSON.stringify(body) : undefined });
      let data = null; try { data = await r.json(); } catch (e) { /* sin JSON */ }
      return { ok: r.ok, status: r.status, data: data || {} };
    } catch (e) { return { ok: false, status: 0, data: { error: 'Sin conexión con el servidor' } }; }
  }

  async function login(pass) {
    state.key = pass;
    const r = await api('POST', '/api/login');
    if (r.status === 401) return { ok: false, msg: 'Clave incorrecta. Inténtalo de nuevo.' };
    if (r.ok) { state.mode = r.data.blob ? 'vercel' : 'demo'; state.gemini = !!r.data.gemini; state.blobMissing = !r.data.blob; }
    else { // sin funciones de servidor (vista local): modo demo
      if (pass !== '123456') return { ok: false, msg: 'Clave incorrecta. Inténtalo de nuevo.' };
      state.mode = 'demo'; state.gemini = false;
    }
    sessionStorage.setItem(KEY, pass); sessionStorage.setItem('mara_admin_mode', state.mode); sessionStorage.setItem('mara_admin_gemini', state.gemini ? '1' : '0');
    return { ok: true };
  }
  function logout() { sessionStorage.removeItem(KEY); state.key = ''; location.hash = '#/admin'; }

  async function loadData(force) {
    if (state.data && !force) return state.data;
    if (state.mode === 'vercel') {
      const r = await api('GET', '/api/store');
      state.data = r.ok ? r.data : { overrides: {}, products: [] };
    } else state.data = store.get('mara_admin_store', null) || { overrides: {}, products: [], settings: {} };
    state.data.overrides = state.data.overrides || {}; state.data.products = state.data.products || [];
    return state.data;
  }
  async function saveData() {
    const payload = { overrides: state.data.overrides, products: state.data.products, settings: state.data.settings || {} };
    if (state.mode === 'vercel') {
      const r = await api('PUT', '/api/store', payload);
      if (!r.ok) throw new Error(r.data.error || 'No se pudo guardar');
    } else {
      store.set('mara_admin_store', payload);
      if (!localStorage.getItem('mara_admin_store')) throw new Error('El navegador no permitió guardar (¿muchas fotos en modo demo?)');
    }
    APP.applyStore(payload);
  }

  // Lista completa (incluye ocultos) con los cambios aplicados
  function allProducts() { return APP.applyStore(state.data); }

  async function loadOrders() {
    if (state.mode === 'vercel') {
      const r = await api('GET', '/api/orders');
      state.orders = r.ok ? r.data.orders || [] : [];
    } else {
      state.orders = (store.get('mara_orders', []) || []).map((o) => Object.assign({ status: o.status || 'recibido', customer: { name: o.name, email: o.email } }, o, {
        items: (o.items || []).map((l) => { const p = APP.byId(l.id); return { id: l.id, name: p ? p.brandName + ' ' + p.name : l.id, color: p ? (p.colors[l.ci] || {}).name : '', size: l.size, qty: l.qty, price: p ? p.price : 0 }; })
      }));
    }
    return state.orders;
  }

  /* ---------------- Utilidades de imagen ---------------- */
  const canEncode = (type) => { const c = document.createElement('canvas'); c.width = c.height = 2; return c.toDataURL(type).startsWith('data:' + type); };
  const OUT_TYPE = canEncode('image/webp') ? 'image/webp' : 'image/jpeg';
  const EXT = OUT_TYPE === 'image/webp' ? 'webp' : 'jpg';

  function fileToImage(file) {
    return new Promise((ok, bad) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => ok(im); im.onerror = () => bad(new Error('No se pudo leer la foto')); im.src = url;
    });
  }
  function urlToImage(url) {
    return new Promise((ok, bad) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = bad; im.src = url; });
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fitCanvas(img, max) {
    const s = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const c = canvas(Math.round((img.naturalWidth || img.width) * s), Math.round((img.naturalHeight || img.height) * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c;
  }
  const toBlob = (c, type = OUT_TYPE, q = 0.88) => new Promise((ok) => c.toBlob(ok, type, q));
  const blobToDataURL = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });

  // Quita el fondo: busca los colores del borde de la foto y "inunda" desde los bordes
  // todo lo parecido. Funciona muy bien con fondos lisos o de textura uniforme (piso, sábana, alfombra).
  function removeBackground(img, sens = 1) {
    const small = fitCanvas(img, 520); const w = small.width, h = small.height;
    const ctx = small.getContext('2d'); const px = ctx.getImageData(0, 0, w, h).data;
    const N = w * h;
    // Muestras del borde
    const border = [];
    for (let x = 0; x < w; x++) for (const y of [0, 1, 2, h - 3, h - 2, h - 1]) border.push((y * w + x) * 4);
    for (let y = 0; y < h; y++) for (const x of [0, 1, 2, w - 3, w - 2, w - 1]) border.push((y * w + x) * 4);
    let mr = 0, mg = 0, mb = 0;
    border.forEach((i) => { mr += px[i]; mg += px[i + 1]; mb += px[i + 2]; });
    mr /= border.length; mg /= border.length; mb /= border.length;
    const dist = (i) => Math.hypot(px[i] - mr, px[i + 1] - mg, px[i + 2] - mb);
    const bd = border.map(dist).sort((a, b) => a - b);
    const thr = Math.max(26, bd[Math.floor(bd.length * 0.92)] * 1.25) * sens;
    const sat = (i) => { const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]); return mx ? (mx - mn) / mx : 0; };
    const bgSat = border.reduce((s, i) => s + sat(i), 0) / border.length;
    const isBgLike = new Uint8Array(N);
    for (let k = 0; k < N; k++) {
      const i = k * 4; const d = dist(i);
      isBgLike[k] = (d < thr && !(bgSat < 0.25 && sat(i) > bgSat + 0.28)) ? 1 : 0;
    }
    // Inundación desde los bordes
    const bg = new Uint8Array(N); const q = new Int32Array(N); let qh = 0, qt = 0;
    const push = (k) => { if (!bg[k] && isBgLike[k]) { bg[k] = 1; q[qt++] = k; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    const flood = () => {
      while (qh < qt) {
        const k = q[qh++]; const x = k % w, y = (k / w) | 0;
        if (x > 0) push(k - 1); if (x < w - 1) push(k + 1); if (y > 0) push(k - w); if (y < h - 1) push(k + w);
      }
    };
    flood();
    // Producto de color sobre fondo neutro: también se quitan sombras y bordes grises pegados al producto
    let fs = 0, fn = 0;
    for (let k = 0; k < N; k++) if (!bg[k]) { fs += sat(k * 4); fn++; }
    if (bgSat < 0.25 && fn && fs / fn > 0.35) {
      const chroma = (i) => Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
      for (let k = 0; k < N; k++) if (!bg[k] && (chroma(k * 4) < 42 || sat(k * 4) < Math.max(0.2, bgSat + 0.1))) isBgLike[k] = 1;
      qh = 0; qt = 0;
      for (let k = 0; k < N; k++) if (bg[k]) q[qt++] = k;
      flood();
    }
    // Abrir (quita fibras sueltas): erosión + dilatación del primer plano
    let fg = new Uint8Array(N); for (let k = 0; k < N; k++) fg[k] = bg[k] ? 0 : 1;
    const morph = (src, erode) => {
      const out = new Uint8Array(N);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = y * w + x; let v = src[k];
        const nb = [x > 0 ? src[k - 1] : 0, x < w - 1 ? src[k + 1] : 0, y > 0 ? src[k - w] : 0, y < h - 1 ? src[k + w] : 0];
        out[k] = erode ? (v && nb.every(Boolean) ? 1 : 0) : (v || nb.some(Boolean) ? 1 : 0);
      }
      return out;
    };
    fg = morph(morph(fg, true), false);
    // Conserva la pieza más grande (y las de tamaño parecido, por ejemplo un par de tenis)
    const lab = new Int32Array(N); const areas = [0]; let cur = 0;
    for (let k = 0; k < N; k++) {
      if (!fg[k] || lab[k]) continue;
      cur++; let a = 0; qh = qt = 0; q[qt++] = k; lab[k] = cur;
      while (qh < qt) {
        const j = q[qh++]; a++; const x = j % w, y = (j / w) | 0;
        const nb = [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1];
        for (const n of nb) if (n >= 0 && fg[n] && !lab[n]) { lab[n] = cur; q[qt++] = n; }
      }
      areas.push(a);
    }
    if (cur === 0) throw new Error('No se encontró el producto. Usa una foto con el producto completo y un fondo liso.');
    const maxA = Math.max(...areas.slice(1));
    const keep = areas.map((a) => a >= maxA * 0.18);
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    const m = ctx.createImageData(w, h);
    for (let k = 0; k < N; k++) {
      const on = fg[k] && keep[lab[k]];
      if (on) { const x = k % w, y = (k / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      m.data[k * 4 + 3] = on ? 255 : 0;
    }
    const mc = canvas(w, h); mc.getContext('2d').putImageData(m, 0, 0);
    const coverage = (x1 - x0) * (y1 - y0) / N;
    // Color dominante del producto (para sugerir el nombre del color)
    let cr = 0, cg = 0, cb = 0, cn = 0;
    for (let k = 0; k < N; k += 3) if (m.data[k * 4 + 3]) { cr += px[k * 4]; cg += px[k * 4 + 1]; cb += px[k * 4 + 2]; cn++; }
    const hex = cn ? '#' + [cr, cg, cb].map((v) => Math.round(v / cn).toString(16).padStart(2, '0')).join('') : null;
    return { mask: mc, scale: (img.naturalWidth || img.width) / w, box: [x0, y0, x1 + 1, y1 + 1], coverage, hex };
  }

  function studioBackground(c, S) {
    const g = c.getContext('2d');
    g.fillStyle = STUDIO_BG; g.fillRect(0, 0, S, S);
    const rg = g.createRadialGradient(S / 2, S * 0.45, S * 0.1, S / 2, S / 2, S * 0.75);
    rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(120,90,80,.10)');
    g.fillStyle = rg; g.fillRect(0, 0, S, S);
  }

  let lastHex = null;
  // Nombre de color más cercano de la paleta de la tienda
  function nearestColor(hex) {
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const a = rgb(hex); let best = null, bd = 1e9;
    Object.values(D.PALETTE).forEach((c) => { const b = rgb(c.hex); const dd = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (dd < bd) { bd = dd; best = c; } });
    return best;
  }

  // Toma de estudio a partir de una foto casera
  async function makeStudio(img, { sens = 1, angle = 0, fill = 0.8 } = {}) {
    const src = fitCanvas(img, 2200);
    const { mask, scale, box, hex } = removeBackground(img, sens);
    lastHex = hex;
    const s2 = src.width / (img.naturalWidth || img.width);
    // Recorte con bordes suaves
    const cut = canvas(src.width, src.height); const cg = cut.getContext('2d');
    cg.drawImage(src, 0, 0);
    cg.globalCompositeOperation = 'destination-in'; cg.imageSmoothingQuality = 'high';
    cg.filter = 'blur(1px)'; cg.drawImage(mask, 0, 0, cut.width, cut.height); cg.filter = 'none';
    const k = scale * s2; const [bx0, by0, bx1, by1] = box.map((v) => v * k);
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = 1600; const out = canvas(S, S); const g = out.getContext('2d');
    studioBackground(out, S);
    const f = Math.min((S * fill) / bw, (S * fill) / bh);
    const dw = bw * f, dh = bh * f;
    g.save(); g.translate(S / 2, S / 2 - S * 0.01); g.rotate(angle * Math.PI / 180);
    g.shadowColor = 'rgba(70,35,45,.30)'; g.shadowBlur = 46; g.shadowOffsetY = 34;
    if ('filter' in g) g.filter = 'contrast(1.06) saturate(1.05)';
    g.drawImage(cut, bx0, by0, bw, bh, -dw / 2, -dh / 2, dw, dh);
    g.restore();
    return out;
  }

  // Mejora sin quitar el fondo (fotos con modelo o lifestyle): recorte cuadrado + color
  function makeEnhanced(img) {
    const S = 1600; const out = canvas(S, S); const g = out.getContext('2d');
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height; const side = Math.min(w, h);
    if ('filter' in g) g.filter = 'contrast(1.05) saturate(1.06) brightness(1.02)';
    g.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, S, S);
    return out;
  }
  function makeZoom(studioCanvas, cx, cy, z) {
    const S = 1600; const out = canvas(S, S); const side = S / z;
    out.getContext('2d').drawImage(studioCanvas, cx * S - side / 2, cy * S - side / 2, side, side, 0, 0, S, S);
    return out;
  }

  // Sube una foto (completa + miniatura). En modo demo se guarda en el navegador.
  async function uploadCanvas(c, name) {
    const thumb = canvas(600, 600); thumb.getContext('2d').drawImage(c, 0, 0, 600, 600);
    if (state.mode !== 'vercel') {
      const small = canvas(1000, 1000); small.getContext('2d').drawImage(c, 0, 0, 1000, 1000);
      return { img: await blobToDataURL(await toBlob(small, 'image/jpeg', 0.8)), thumb: await blobToDataURL(await toBlob(thumb, 'image/jpeg', 0.78)) };
    }
    const up = async (cv, nm, q) => {
      const b = await toBlob(cv, OUT_TYPE, q); const data = await blobToDataURL(b);
      const r = await api('POST', '/api/upload', { name: `${nm}.${EXT}`, type: b.type, data });
      if (!r.ok) throw new Error(r.data.error || 'No se pudo subir la foto');
      return r.data.url;
    };
    const [img, th] = await Promise.all([up(c, name, 0.88), up(thumb, name + '-sm', 0.84)]);
    return { img, thumb: th };
  }

  /* ---------------- Layout ---------------- */
  const IC = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 7h14l-1.2 12.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };

  function shell(active, title, body, actions = '') {
    const nav = [['', 'Resumen', IC.home], ['productos', 'Productos', IC.box], ['producto/nuevo', 'Nuevo producto', IC.plus], ['pedidos', 'Pedidos', IC.bag], ['ajustes', 'Ajustes y ayuda', IC.gear]];
    const badge = state.mode === 'vercel'
      ? '<span class="adm-mode adm-mode--ok">● Publicando en vivo</span>'
      : '<a href="#/admin/ajustes" class="adm-mode adm-mode--demo">● Modo demo: cambios solo en este navegador</a>';
    return `<div class="adm">
      <aside class="adm-side">
        <a href="#/admin" class="adm-logo"><span class="logo__mark">MARA</span><small>Panel</small></a>
        <nav>${nav.map(([h, l, i]) => `<a href="#/admin${h ? '/' + h : ''}" class="${active === h ? 'is-on' : ''}">${i}<span>${l}</span></a>`).join('')}</nav>
        <div class="adm-side__foot">
          <a href="#/" target="_blank" rel="noopener">${IC.eye}<span>Ver tienda</span></a>
          <button data-logout>${IC.out}<span>Salir</span></button>
        </div>
      </aside>
      <main class="adm-main">
        <header class="adm-top"><div><h1>${title}</h1>${badge}</div><div class="adm-top__actions">${actions}</div></header>
        <div class="adm-body">${body}</div>
      </main>
    </div>`;
  }

  function mount(html) { $('#app').innerHTML = html; const lo = $('[data-logout]'); if (lo) lo.onclick = logout; window.scrollTo(0, 0); }

  /* ---------------- Login ---------------- */
  function viewLogin() {
    mount(`<div class="adm-login">
      <form class="adm-login__card" id="admLogin" autocomplete="off">
        <div class="adm-login__icon">${IC.lock}</div>
        <a href="#/" class="logo"><span class="logo__mark">MARA</span><span class="logo__sub">SPORT</span></a>
        <h1>Panel administrativo</h1>
        <p>Ingresa tu clave para administrar productos, fotos y pedidos.</p>
        <label class="adm-field"><span>Clave</span><input type="password" name="pass" inputmode="numeric" placeholder="••••••" required autofocus></label>
        <p class="adm-err" id="admErr" hidden></p>
        <button class="btn btn--accent btn--block">Entrar al panel</button>
        <a href="#/" class="adm-login__back">← Volver a la tienda</a>
      </form>
    </div>`);
    $('#admLogin').onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button', e.target); btn.disabled = true; btn.textContent = 'Verificando…';
      const r = await login(e.target.pass.value.trim());
      if (!r.ok) { $('#admErr').hidden = false; $('#admErr').textContent = r.msg; btn.disabled = false; btn.textContent = 'Entrar al panel'; e.target.pass.select(); return; }
      route([], {});
    };
  }

  /* ---------------- Resumen ---------------- */
  const STATUS = { recibido: ['Recibido', '#6b6b72'], preparando: ['Preparando', '#c27c0e'], 'en-camino': ['En camino', '#1f6bff'], entregado: ['Entregado', '#138a46'], cancelado: ['Cancelado', '#e3262f'] };
  const pill = (s) => { const [l, c] = STATUS[s] || STATUS.recibido; return `<span class="adm-pill" style="--c:${c}">${l}</span>`; };
  const stockOf = (p) => Object.values(p.stock || {}).reduce((a, b) => a + (+b || 0), 0);
  const thumbOf = (p) => APP.media(p, 0, 0);

  async function viewDashboard() {
    mount(shell('', 'Resumen', '<div class="adm-skel"></div>'));
    await loadData(); const orders = await loadOrders(); const all = allProducts();
    const valid = orders.filter((o) => o.status !== 'cancelado');
    const sales = valid.reduce((s, o) => s + ((o.totals && o.totals.total) || 0), 0);
    const visible = all.filter((p) => !p.hidden);
    const low = visible.filter((p) => stockOf(p) <= 2).slice(0, 6);
    const noPhotos = visible.filter((p) => !(p.colors[0] && p.colors[0].img && p.colors[0].img.length)).length;
    const tasks = [
      [state.mode === 'vercel', 'Conectar el almacenamiento (Vercel Blob) para publicar cambios en vivo', '#/admin/ajustes'],
      [state.gemini, 'Conectar la clave de Gemini para crear fotos con IA', '#/admin/ajustes'],
      [state.key !== '123456', 'Cambiar la clave 123456 por una más segura', '#/admin/ajustes'],
      [noPhotos === 0, `Subir fotos reales (${noPhotos} productos aún usan ilustración)`, '#/admin/productos?f=sinfotos']
    ];
    mount(shell('', 'Resumen', `
      <div class="adm-kpis">
        <div class="adm-kpi"><span>Ventas</span><b>${fmt(sales)}</b><small>${valid.length} pedidos</small></div>
        <div class="adm-kpi"><span>Ticket promedio</span><b>${fmt(valid.length ? sales / valid.length : 0)}</b><small>por pedido</small></div>
        <div class="adm-kpi"><span>Por despachar</span><b>${orders.filter((o) => ['recibido', 'preparando'].includes(o.status)).length}</b><small>pedidos pendientes</small></div>
        <div class="adm-kpi"><span>Productos</span><b>${visible.length}</b><small>${all.length - visible.length} ocultos</small></div>
      </div>
      <div class="adm-grid2">
        <section class="adm-card">
          <div class="adm-card__head"><h2>Últimos pedidos</h2><a href="#/admin/pedidos" class="adm-link">Ver todos</a></div>
          ${orders.length ? `<div class="adm-list">${orders.slice(0, 6).map((o) => `<a href="#/admin/pedidos?id=${o.id}" class="adm-row"><div><b>${o.id}</b><small>${esc((o.customer && o.customer.name) || o.name || '')} · ${esc(o.city || '')}</small></div><div class="adm-row__end">${pill(o.status)}<b>${fmt((o.totals && o.totals.total) || 0)}</b></div></a>`).join('')}</div>`
            : '<div class="adm-empty">Aún no hay pedidos. Cuando una clienta compre, aparecerá aquí.</div>'}
        </section>
        <section class="adm-card">
          <div class="adm-card__head"><h2>Configura tu tienda</h2></div>
          <div class="adm-tasks">${tasks.map(([ok, t, h]) => `<a href="${h}" class="adm-task ${ok ? 'is-ok' : ''}"><i>${ok ? '✓' : '!'}</i><span>${t}</span></a>`).join('')}</div>
          <div class="adm-card__head" style="margin-top:22px"><h2>Poco inventario</h2></div>
          ${low.length ? `<div class="adm-list">${low.map((p) => `<a href="#/admin/producto/${p.id}" class="adm-row"><div class="adm-row__thumb">${thumbOf(p)}</div><div><b>${esc(p.name)}</b><small>${esc(p.brandName)}</small></div><div class="adm-row__end"><span class="adm-pill" style="--c:${stockOf(p) ? '#c27c0e' : '#e3262f'}">${stockOf(p) ? stockOf(p) + ' und.' : 'Agotado'}</span></div></a>`).join('')}</div>` : '<div class="adm-empty">Todo el inventario está bien 👌</div>'}
        </section>
      </div>
      <a href="#/admin/producto/nuevo" class="adm-cta">${IC.cam}<div><b>Sube un producto nuevo</b><span>Toma la foto con el celular: el panel quita el fondo y crea las tomas de estudio por ti.</span></div><span class="btn btn--accent">Empezar</span></a>`));
  }

  /* ---------------- Productos ---------------- */
  async function viewProducts(q) {
    mount(shell('productos', 'Productos', '<div class="adm-skel"></div>'));
    await loadData(); const all = allProducts();
    const filters = [['', 'Todos'], ['visibles', 'Publicados'], ['ocultos', 'Ocultos'], ['agotados', 'Agotados'], ['sinfotos', 'Sin fotos reales']];
    const draw = () => {
      const term = ($('#admSearch') || {}).value || '';
      const f = q.f || '';
      const list = all.filter((p) => {
        if (term && !(p.name + ' ' + p.brandName + ' ' + p.id).toLowerCase().includes(term.toLowerCase())) return false;
        if (f === 'visibles') return !p.hidden; if (f === 'ocultos') return p.hidden; if (f === 'agotados') return !stockOf(p);
        if (f === 'sinfotos') return !(p.colors[0] && p.colors[0].img && p.colors[0].img.length);
        return true;
      });
      $('#admRows').innerHTML = list.length ? list.map((p) => `
        <div class="adm-prow ${p.hidden ? 'is-hidden' : ''}">
          <a href="#/admin/producto/${p.id}" class="adm-prow__img">${thumbOf(p)}</a>
          <a href="#/admin/producto/${p.id}" class="adm-prow__name"><b>${esc(p.name)}</b><small>${esc(p.brandName)} · ${esc((D.SUBS.find((s) => s.id === p.sub) || {}).name || '')} · ${p.id}</small></a>
          <div class="adm-prow__price"><b>${fmt(p.price)}</b>${p.compareAt ? `<small><s>${fmt(p.compareAt)}</s></small>` : ''}</div>
          <div class="adm-prow__stock">${stockOf(p) ? `${stockOf(p)} und.` : '<span style="color:var(--sale)">Agotado</span>'}</div>
          <label class="adm-switch" title="Publicado en la tienda"><input type="checkbox" data-vis="${p.id}" ${p.hidden ? '' : 'checked'}><i></i><span>${p.hidden ? 'Oculto' : 'Publicado'}</span></label>
          <a href="#/admin/producto/${p.id}" class="btn btn--ghost btn--sm">Editar</a>
        </div>`).join('') : '<div class="adm-empty">No hay productos con ese filtro.</div>';
      $$('[data-vis]').forEach((i) => i.onchange = async () => {
        const id = i.dataset.vis; const hidden = !i.checked;
        const custom = state.data.products.find((x) => x.id === id);
        if (custom) custom.hidden = hidden; else state.data.overrides[id] = Object.assign(state.data.overrides[id] || {}, { hidden });
        try { await saveData(); toast(hidden ? 'Producto oculto de la tienda' : 'Producto publicado ✓'); i.closest('.adm-prow').classList.toggle('is-hidden', hidden); $('span', i.parentElement).textContent = hidden ? 'Oculto' : 'Publicado'; }
        catch (e) { toast('⚠️ ' + e.message); i.checked = !i.checked; }
      });
    };
    mount(shell('productos', 'Productos', `
      <div class="adm-toolbar">
        <input id="admSearch" class="adm-input" placeholder="Buscar por nombre, marca o referencia…">
        <div class="adm-chips">${filters.map(([v, l]) => `<a class="chip ${(q.f || '') === v ? 'is-on' : ''}" href="#/admin/productos${v ? '?f=' + v : ''}">${l}</a>`).join('')}</div>
      </div>
      <div class="adm-card adm-card--flush"><div id="admRows"></div></div>`,
      `<a href="#/admin/producto/nuevo" class="btn btn--accent btn--sm">${IC.plus} Nuevo producto</a>`));
    $('#admSearch').oninput = draw; draw();
  }

  /* ---------------- Editor de producto ---------------- */
  function blankProduct() {
    return { id: 'MSC' + Date.now().toString(36).toUpperCase(), isNew: true, custom: true, name: '', brand: 'nike', sub: 'leggings', sport: 'training', gender: 'mujer',
      price: '', compareAt: '', desc: '', tags: ['nuevo'], hidden: false, colors: [{ name: 'Negro', hex: '#1b1b1d', img: [], thumb: [] }],
      sizes: D.SIZESETS.ropa.slice(), stock: Object.fromEntries(D.SIZESETS.ropa.map((s) => [s, 0])), specs: {} };
  }
  function draftFrom(p, custom) {
    const strip = (c) => { const o = { name: c.name, hex: c.hex, img: (c.img || []).slice(), thumb: (c.thumb || c.img || []).slice() }; if (c.key && D.PALETTE[c.key]) o.key = c.key; return o; };
    return { id: p.id, custom, name: p.name, brand: p.brand, sub: p.sub, sport: p.sport, gender: p.gender, price: p.price, compareAt: p.compareAt || '', desc: p.desc || '',
      tags: (p.tags || []).slice(), hidden: !!p.hidden, colors: p.colors.map(strip), sizes: p.sizes.slice(), stock: Object.assign({}, p.stock), specs: Object.assign({}, p.specs || {}), slug: p.slug };
  }
  // Colores de la paleta conservan su ilustración; los nuevos se generan desde el hex
  const colorForSave = (c) => {
    const base = c.key && D.PALETTE[c.key] ? Object.assign({}, D.PALETTE[c.key]) : {};
    delete base.img; delete base.thumb;
    const o = Object.assign(base, { name: c.name, hex: c.hex });
    if (c.img && c.img.length) { o.img = c.img.slice(); o.thumb = (c.thumb && c.thumb.length === c.img.length ? c.thumb : c.img).slice(); }
    return o;
  };

  async function viewEditor(id) {
    mount(shell('producto/nuevo', 'Producto', '<div class="adm-skel"></div>'));
    await loadData();
    if (id === 'nuevo') state.draft = blankProduct();
    else {
      const all = allProducts(); const p = all.find((x) => x.id === id);
      if (!p) { mount(shell('productos', 'Producto no encontrado', '<div class="adm-empty">Este producto no existe. <a class="adm-link" href="#/admin/productos">Volver</a></div>')); return; }
      state.draft = draftFrom(p, !!state.data.products.find((x) => x.id === id));
    }
    state.dirty = false; state.colorIdx = 0;
    drawEditor();
  }

  function drawEditor() {
    const d = state.draft; const c = d.colors[state.colorIdx] || d.colors[0];
    const sub = D.SUBS.find((s) => s.id === d.sub) || D.SUBS[0];
    const offPct = d.compareAt && d.price && +d.compareAt > +d.price ? Math.round((1 - d.price / d.compareAt) * 100) : 0;
    const shots = [['frente', 'De frente'], ['tres-cuartos', '3/4 caminando'], ['detalle', 'Detalle puesto'], ['gym', 'En el gym'], ['outdoor', 'Al aire libre']];
    const title = d.isNew ? 'Nuevo producto' : 'Editar producto';
    mount(shell(d.isNew ? 'producto/nuevo' : 'productos', title, `
      <div class="adm-editor">
        <div class="adm-editor__main">

          <section class="adm-card">
            <div class="adm-card__head"><h2>1. Fotos</h2><span class="adm-hint">La primera es la principal · arrastra para ordenar</span></div>
            ${d.colors.length > 1 ? `<div class="adm-ctabs">${d.colors.map((x, i) => `<button class="${i === state.colorIdx ? 'is-on' : ''}" data-ctab="${i}"><i style="background:${x.hex}"></i>${esc(x.name || 'Color')}</button>`).join('')}</div>` : ''}
            <div class="adm-photos" id="admPhotos">
              ${(c.img || []).map((u, i) => `<div class="adm-photo" draggable="true" data-ph="${i}">
                <img src="${(c.thumb && c.thumb[i]) || u}" alt="">
                ${i === 0 ? '<span class="adm-photo__main">Principal</span>' : ''}
                ${/\/(modelo|ia)-/.test(u) ? '<span class="adm-photo__ia">IA</span>' : ''}
                <div class="adm-photo__tools">
                  <button data-phmove="${i}" data-d="-1" title="Mover a la izquierda" ${i ? '' : 'disabled'}>‹</button>
                  <button data-phmain="${i}" title="Usar como principal" ${i ? '' : 'disabled'}>★</button>
                  <button data-phmove="${i}" data-d="1" title="Mover a la derecha" ${i < c.img.length - 1 ? '' : 'disabled'}>›</button>
                  <button data-phdel="${i}" title="Eliminar" class="is-del">✕</button>
                </div>
              </div>`).join('')}
              <label class="adm-drop" id="admDrop">
                <input type="file" accept="image/*" multiple id="admFile" hidden>
                ${IC.cam}<b>Subir fotos</b><span>Arrastra aquí o toca para elegir. Desde el celular puedes tomarla de una vez.</span>
              </label>
            </div>
            <div class="adm-process" id="admProcess" hidden></div>
            <div class="adm-studio">
              <div class="adm-studio__head">${IC.spark}<div><b>¿Cómo quieres tus fotos?</b><span>Elige antes de subir. Puedes cambiarlo para cada tanda de fotos.</span></div></div>
              <div class="adm-modes">
                <label class="adm-modecard"><input type="radio" name="pmode" value="estudio" checked><div><b>Estudio automático</b><small>Gratis · quita el fondo y crea 4 tomas: frente, ángulo, detalle y zoom. Ideal para fotos del producto sobre el piso o la cama.</small></div></label>
                <label class="adm-modecard"><input type="radio" name="pmode" value="mejorar"><div><b>Solo mejorar</b><small>Gratis · recorta cuadrado y mejora color y nitidez, sin quitar el fondo. Para fotos con modelo o en ambiente.</small></div></label>
                <label class="adm-modecard ${state.gemini ? '' : 'is-off'}"><input type="radio" name="pmode" value="estudio-ia" ${state.gemini ? '' : 'disabled'}><div><b>Estudio con IA ✨</b><small>Gemini · reconstruye una foto de estudio perfecta respetando el producto. ${state.gemini ? '' : '<a href="#/admin/ajustes" class="adm-link">Conectar Gemini</a>'}</small></div></label>
              </div>
              <label class="adm-check"><input type="checkbox" id="admIsAi"> Fotos creadas con IA (se mostrará el aviso "imagen referencial creada con IA")</label>
              <details class="adm-adv"><summary>Ajuste fino del recorte</summary>
                <label class="adm-range">Sensibilidad para quitar el fondo <input type="range" id="admSens" min="0.6" max="1.6" step="0.05" value="1"><small>Súbela si queda fondo; bájala si se borra parte del producto.</small></label>
              </details>
            </div>
            <div class="adm-ai">
              <div class="adm-studio__head">${IC.spark}<div><b>Fotos con modelo (IA) · gratis con tu app de Gemini</b><span>Elige las tomas, copia el prompt y pégalo en Gemini junto con la foto del producto.</span></div></div>
              <div class="adm-shots">${shots.map(([v, l], i) => `<label class="chip"><input type="checkbox" value="${v}" ${i < 3 ? 'checked' : ''}> ${l}</label>`).join('')}</div>
              <ol class="adm-free">
                <li><button class="btn btn--accent btn--sm" id="admCopyPrompt">📋 Copiar prompt para Gemini</button></li>
                <li>Abre <a class="adm-link" href="https://gemini.google.com/app" target="_blank" rel="noopener">gemini.google.com</a>, adjunta la foto de estudio del producto (descárgala abajo), pega el prompt y envía.</li>
                <li>Descarga la foto que te guste y súbela aquí arriba eligiendo <b>"Solo mejorar"</b> y marcando <b>"Fotos creadas con IA"</b>.</li>
              </ol>
              ${c.img.length ? `<a class="adm-link" href="${c.img[0]}" download="producto-${esc(D.slugify(d.name || 'foto'))}.jpg" target="_blank" rel="noopener">⬇ Descargar foto principal para adjuntarla en Gemini</a>` : '<p class="adm-hint">Primero sube al menos una foto del producto.</p>'}
              <details class="adm-adv"><summary>Automático con clave de API (de pago en Google)</summary>
                <p class="adm-hint">Crea las fotos sin salir del panel, pero Google cobra la clave aparte (unos centavos por foto).</p>
                <button class="btn btn--dark btn--sm" id="admAiModel" ${state.gemini && c.img.length ? '' : 'disabled'} style="margin-top:8px">${IC.spark} Crear fotos automáticamente</button>
                ${!state.gemini ? '<p class="adm-hint">Requiere la clave de Gemini con facturación. <a class="adm-link" href="#/admin/ajustes">Ver cómo</a></p>' : ''}
              </details>
            </div>
          </section>

          <section class="adm-card">
            <div class="adm-card__head"><h2>2. Información</h2></div>
            <div class="adm-fields">
              <label class="adm-field adm-field--full"><span>Nombre del producto</span><input data-f="name" value="${esc(d.name)}" placeholder="Ej: Leggings Tiro Alto 7/8" required></label>
              <label class="adm-field"><span>Marca</span><select data-f="brand">${D.BRANDS.map((b) => `<option value="${b.id}" ${d.brand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
              <label class="adm-field"><span>Tipo de prenda</span><select data-f="sub">${D.SUBS.map((s) => `<option value="${s.id}" ${d.sub === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
              <label class="adm-field"><span>Actividad</span><select data-f="sport">${D.SPORTS.map((s) => `<option value="${s.id}" ${d.sport === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
              <label class="adm-field"><span>Línea</span><select data-f="gender">${[['mujer', 'Mujer'], ['hombre', 'Hombre'], ['unisex', 'Unisex']].map(([v, l]) => `<option value="${v}" ${d.gender === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
              <label class="adm-field adm-field--full"><span>Descripción</span><textarea data-f="desc" rows="4" placeholder="Cuenta cómo es, para qué sirve y por qué le va a encantar.">${esc(d.desc)}</textarea></label>
              <div class="adm-field adm-field--full"><span>Etiquetas</span><div class="adm-chips">
                ${[['nuevo', 'Nuevo'], ['bestseller', 'Top ventas']].map(([v, l]) => `<label class="chip ${d.tags.includes(v) ? 'is-on' : ''}"><input type="checkbox" data-tag="${v}" ${d.tags.includes(v) ? 'checked' : ''}> ${l}</label>`).join('')}
              </div></div>
            </div>
          </section>

          <section class="adm-card">
            <div class="adm-card__head"><h2>3. Precio</h2></div>
            <div class="adm-fields">
              <label class="adm-field"><span>Precio de venta (COP)</span><input data-f="price" inputmode="numeric" value="${d.price}" placeholder="130000" required></label>
              <label class="adm-field"><span>Precio antes (opcional, para mostrar descuento)</span><input data-f="compareAt" inputmode="numeric" value="${d.compareAt}" placeholder="160000"></label>
            </div>
            <p class="adm-hint" id="admPriceHint">${d.price ? `Se verá como <b>${fmt(+d.price)}</b>${offPct ? ` con <b style="color:var(--sale)">-${offPct}%</b>` : ''} · 3 cuotas de ${fmt(d.price / 3)} con Addi${+d.price >= 249900 ? ' · con envío gratis' : ''}` : 'Escribe el precio sin puntos ni signos.'}</p>
          </section>

          <section class="adm-card">
            <div class="adm-card__head"><h2>4. Colores, tallas e inventario</h2></div>
            <div class="adm-colors">${d.colors.map((x, i) => `<div class="adm-color"><input type="color" value="${x.hex}" data-chex="${i}"><input class="adm-input" value="${esc(x.name)}" data-cname="${i}" placeholder="Nombre del color">${d.colors.length > 1 ? `<button data-cdel="${i}" title="Quitar color">✕</button>` : ''}</div>`).join('')}
              <button class="btn btn--ghost btn--sm" id="admAddColor">+ Agregar color</button></div>
            <div class="adm-field" style="margin-top:18px"><span>Juego de tallas</span><div class="adm-chips">
              ${[['ropa', 'Ropa XS–XL'], ['tenisMujer', 'Tenis mujer 34–40'], ['tenisHombre', 'Tenis hombre 38–44'], ['unica', 'Talla única']].map(([k, l]) => `<button class="chip ${JSON.stringify(D.SIZESETS[k]) === JSON.stringify(d.sizes) ? 'is-on' : ''}" data-sizeset="${k}">${l}</button>`).join('')}
            </div></div>
            <div class="adm-stock">${d.sizes.map((s) => `<label><span>${s}</span><input type="number" min="0" inputmode="numeric" value="${d.stock[s] || 0}" data-stock="${s}"></label>`).join('')}</div>
            <p class="adm-hint">Unidades disponibles por talla. Con 0 aparece como agotada; con 1 o 2 muestra "¡Últimas unidades!".</p>
          </section>

          <section class="adm-card">
            <div class="adm-card__head"><h2>5. Ficha técnica</h2><span class="adm-hint">Opcional</span></div>
            <div id="admSpecs">${Object.entries(d.specs).map(([k, v], i) => specRow(k, v, i)).join('')}</div>
            <button class="btn btn--ghost btn--sm" id="admAddSpec">+ Agregar dato</button>
          </section>
        </div>

        <aside class="adm-editor__side">
          <div class="adm-card adm-preview">
            <div class="adm-card__head"><h2>Vista previa</h2></div>
            <div id="admPreview"></div>
          </div>
          <div class="adm-card">
            <label class="adm-switch adm-switch--big"><input type="checkbox" id="admVisible" ${d.hidden ? '' : 'checked'}><i></i><span>${d.hidden ? 'Oculto en la tienda' : 'Publicado en la tienda'}</span></label>
            <button class="btn btn--accent btn--block" id="admSave" style="margin-top:14px">Guardar y publicar</button>
            ${!d.isNew ? `<a class="btn btn--ghost btn--block btn--sm" style="margin-top:8px" href="#/p/${d.slug}" target="_blank" rel="noopener">Ver en la tienda</a>` : ''}
            ${d.custom && !d.isNew ? '<button class="adm-danger" id="admDelete">Eliminar producto</button>' : ''}
          </div>
        </aside>
      </div>
      <div class="adm-savebar" id="admSavebar" hidden><span>Tienes cambios sin guardar</span><button class="btn btn--accent btn--sm" data-save>Guardar y publicar</button></div>`));
    bindEditor();
    preview();
  }
  const specRow = (k, v, i) => `<div class="adm-spec"><input class="adm-input" value="${esc(k)}" placeholder="Ej: Material" data-sk="${i}"><input class="adm-input" value="${esc(v)}" placeholder="Ej: Poliéster / elastano" data-sv="${i}"><button data-sdel="${i}">✕</button></div>`;

  function readSpecs() {
    const specs = {};
    $$('[data-sk]').forEach((k) => { const v = $(`[data-sv="${k.dataset.sk}"]`); if (k.value.trim() && v && v.value.trim()) specs[k.value.trim()] = v.value.trim(); });
    return specs;
  }
  function markDirty() { state.dirty = true; const sb = $('#admSavebar'); if (sb) sb.hidden = false; preview(); }

  function preview() {
    const d = state.draft; const el = $('#admPreview'); if (!el) return;
    try {
      const p = D.makeProduct(Object.assign({}, d, { price: +d.price || 0, compareAt: +d.compareAt || undefined, colors: d.colors.map(colorForSave), cat: (D.SUBS.find((s) => s.id === d.sub) || {}).cat || 'ropa', art: D.ART_BY_SUB[d.sub], name: d.name || 'Nombre del producto', rating: 0, reviews: 0 }));
      el.innerHTML = APP.card(p).replace(/href="#\/p\/[^"]*"/g, 'href="javascript:void 0"');
    } catch (e) { el.innerHTML = ''; }
  }

  function bindEditor() {
    const d = state.draft;
    $$('[data-f]').forEach((i) => i.oninput = () => {
      const k = i.dataset.f; d[k] = (k === 'price' || k === 'compareAt') ? i.value.replace(/\D/g, '') : i.value;
      if (k === 'price' || k === 'compareAt') { i.value = d[k]; const off = d.compareAt && d.price && +d.compareAt > +d.price ? Math.round((1 - d.price / d.compareAt) * 100) : 0; $('#admPriceHint').innerHTML = d.price ? `Se verá como <b>${fmt(+d.price)}</b>${off ? ` con <b style="color:var(--sale)">-${off}%</b>` : ''} · 3 cuotas de ${fmt(d.price / 3)} con Addi${+d.price >= 249900 ? ' · con envío gratis' : ''}` : 'Escribe el precio sin puntos ni signos.'; }
      if (k === 'sub') { const sb = D.SUBS.find((s) => s.id === d.sub); const set = sb.cat === 'tenis' ? (d.gender === 'hombre' ? 'tenisHombre' : 'tenisMujer') : sb.cat === 'accesorios' ? 'unica' : 'ropa'; setSizes(D.SIZESETS[set]); return; }
      markDirty();
    });
    $$('[data-tag]').forEach((i) => i.onchange = () => { const t = i.dataset.tag; d.tags = i.checked ? d.tags.concat(t) : d.tags.filter((x) => x !== t); i.parentElement.classList.toggle('is-on', i.checked); markDirty(); });
    $$('[data-ctab]').forEach((b) => b.onclick = () => { state.colorIdx = +b.dataset.ctab; drawEditor(); });
    $$('[data-chex]').forEach((i) => i.oninput = () => { const x = d.colors[+i.dataset.chex]; x.hex = i.value; x.touched = true; markDirty(); });
    $$('[data-cname]').forEach((i) => i.oninput = () => { const x = d.colors[+i.dataset.cname]; x.name = i.value; x.touched = true; markDirty(); });
    $$('[data-cdel]').forEach((b) => b.onclick = () => { if (!confirm('¿Quitar este color y sus fotos?')) return; d.colors.splice(+b.dataset.cdel, 1); state.colorIdx = 0; state.dirty = true; drawEditor(); });
    $('#admAddColor').onclick = () => { const name = prompt('Nombre del nuevo color (ej: Rosa fresa)'); if (!name) return; d.colors.push({ name, hex: '#e23e7b', img: [], thumb: [] }); state.colorIdx = d.colors.length - 1; state.dirty = true; drawEditor(); };
    $$('[data-sizeset]').forEach((b) => b.onclick = () => setSizes(D.SIZESETS[b.dataset.sizeset]));
    $$('[data-stock]').forEach((i) => i.oninput = () => { d.stock[i.dataset.stock] = Math.max(0, +i.value || 0); markDirty(); });
    const specsBind = () => {
      $$('[data-sk],[data-sv]').forEach((i) => i.oninput = () => { d.specs = readSpecs(); markDirty(); });
      $$('[data-sdel]').forEach((b) => b.onclick = () => { b.parentElement.remove(); d.specs = readSpecs(); markDirty(); });
    };
    $('#admAddSpec').onclick = () => { const n = $$('[data-sk]').length + Date.now() % 1000; $('#admSpecs').insertAdjacentHTML('beforeend', specRow('', '', n)); specsBind(); $(`[data-sk="${n}"]`).focus(); };
    specsBind();
    $('#admVisible').onchange = (e) => { d.hidden = !e.target.checked; $('span', e.target.parentElement).textContent = d.hidden ? 'Oculto en la tienda' : 'Publicado en la tienda'; markDirty(); };
    $('#admSave').onclick = saveProduct; $$('[data-save]').forEach((b) => b.onclick = saveProduct);
    const del = $('#admDelete'); if (del) del.onclick = deleteProduct;

    // Fotos: subir, arrastrar, ordenar
    const c = d.colors[state.colorIdx];
    $('#admFile').onchange = (e) => { processFiles(Array.from(e.target.files)); e.target.value = ''; };
    const drop = $('#admDrop');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); drop.classList.add('is-over'); } }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', (e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); processFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))); });
    const move = (from, to) => { if (to < 0 || to >= c.img.length) return; [c.img[from], c.img[to]] = [c.img[to], c.img[from]]; c.thumb = c.thumb || c.img.slice(); [c.thumb[from], c.thumb[to]] = [c.thumb[to], c.thumb[from]]; state.dirty = true; drawEditor(); };
    $$('[data-phmove]').forEach((b) => b.onclick = () => move(+b.dataset.phmove, +b.dataset.phmove + +b.dataset.d));
    $$('[data-phmain]').forEach((b) => b.onclick = () => { const i = +b.dataset.phmain; c.img.unshift(c.img.splice(i, 1)[0]); c.thumb.unshift(c.thumb.splice(i, 1)[0]); state.dirty = true; drawEditor(); });
    $$('[data-phdel]').forEach((b) => b.onclick = () => { const i = +b.dataset.phdel; c.img.splice(i, 1); c.thumb.splice(i, 1); state.dirty = true; drawEditor(); });
    let dragFrom = null;
    $$('.adm-photo').forEach((el) => {
      el.addEventListener('dragstart', () => { dragFrom = +el.dataset.ph; el.classList.add('is-drag'); });
      el.addEventListener('dragend', () => el.classList.remove('is-drag'));
      el.addEventListener('dragover', (e) => { if (dragFrom !== null) e.preventDefault(); });
      el.addEventListener('drop', (e) => { e.preventDefault(); const to = +el.dataset.ph; if (dragFrom === null || dragFrom === to) return; const [a] = c.img.splice(dragFrom, 1); const [t] = c.thumb.splice(dragFrom, 1); c.img.splice(to, 0, a); c.thumb.splice(to, 0, t); dragFrom = null; state.dirty = true; drawEditor(); });
    });
    const aiBtn = $('#admAiModel'); if (aiBtn) aiBtn.onclick = aiModelPhotos;
    const cp = $('#admCopyPrompt'); if (cp) cp.onclick = copyPrompt;
    if (state.dirty) $('#admSavebar').hidden = false;
  }

  function setSizes(sizes) {
    const d = state.draft; d.sizes = sizes.slice();
    d.stock = Object.fromEntries(sizes.map((s) => [s, d.stock[s] || 0])); state.dirty = true; drawEditor();
  }

  function progress(items) {
    const el = $('#admProcess'); if (!el) return;
    el.hidden = !items.length;
    el.innerHTML = items.map((it) => `<div class="adm-step ${it.state}"><i>${it.state === 'done' ? '✓' : it.state === 'error' ? '!' : ''}</i><span>${esc(it.label)}</span>${it.msg ? `<small>${esc(it.msg)}</small>` : ''}</div>`).join('');
  }

  async function processFiles(files) {
    if (!files.length) return;
    const d = state.draft; const ci = state.colorIdx; const c = d.colors[ci];
    const mode = ($('input[name=pmode]:checked') || {}).value || 'estudio';
    const sens = +($('#admSens') || {}).value || 1;
    const isAi = !!($('#admIsAi') || {}).checked;
    const base = (isAi ? 'modelo-' : '') + D.slugify((d.name || 'producto') + '-' + (c.name || ''));
    const steps = files.map((f) => ({ label: f.name, state: 'run', msg: 'Procesando…' }));
    progress(steps);
    state.raw[ci] = state.raw[ci] || [];
    for (let i = 0; i < files.length; i++) {
      const st = steps[i];
      try {
        const img = await fileToImage(files[i]);
        state.raw[ci].push(fitCanvas(img, 1536));
        let outs = [];
        if (mode === 'mejorar') { st.msg = 'Mejorando color y nitidez…'; progress(steps); outs = [['mejorada', makeEnhanced(img)]]; }
        else if (mode === 'estudio-ia') {
          st.msg = 'Gemini está creando la foto de estudio (puede tardar ~1 minuto)…'; progress(steps);
          const url = await aiGenerate('estudio', 'frente', [state.raw[ci][state.raw[ci].length - 1]]);
          outs = [['ia-estudio', await urlToCanvas(url)]];
        } else {
          st.msg = 'Quitando el fondo…'; progress(steps);
          await new Promise((r) => setTimeout(r, 30));
          const front = await makeStudio(img, { sens });
          st.msg = 'Creando tomas de estudio…'; progress(steps);
          outs = i === 0 && !c.img.length
            ? [['frente', front], ['angulo', await makeStudio(img, { sens, angle: -8, fill: 0.74 })], ['detalle', makeZoom(front, 0.5, 0.36, 1.9)], ['zoom', makeZoom(front, 0.62, 0.62, 2.4)]]
            : [['vista', front]];
        }
        // Producto nuevo: sugiere el color según la foto
        if (mode === 'estudio' && lastHex && !c.img.length && d.isNew && !c.touched) { const nc = nearestColor(lastHex); c.name = nc.name; c.hex = nc.hex; }
        st.msg = state.mode === 'vercel' ? 'Subiendo…' : 'Guardando…'; progress(steps);
        for (const [nm, cv] of outs) {
          const r = await uploadCanvas(cv, `${base}-${nm}-${Date.now().toString(36)}`);
          c.img.push(r.img); c.thumb = c.thumb || []; c.thumb.push(r.thumb);
        }
        st.state = 'done'; st.msg = outs.length > 1 ? `${outs.length} fotos listas` : 'Lista';
      } catch (e) { st.state = 'error'; st.msg = e.message || 'Error'; }
      progress(steps);
    }
    state.dirty = true;
    const keep = steps; drawEditor(); progress(keep);
    if (steps.some((s) => s.state === 'done')) toast('Fotos listas ✓ Revisa y guarda el producto');
  }

  async function urlToCanvas(url) {
    try { const im = await urlToImage(url); const c = canvas(1600, 1600); const g = c.getContext('2d'); const w = im.naturalWidth, h = im.naturalHeight, s = Math.min(w, h); g.drawImage(im, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 1600, 1600); c.getContext('2d').getImageData(0, 0, 1, 1); return c; }
    catch (e) { throw new Error('La foto de IA se creó pero no se pudo procesar. Intenta de nuevo.'); }
  }

  async function refImages(ci) {
    const c = state.draft.colors[ci]; const refs = (state.raw[ci] || []).slice(-2);
    for (const u of (c.img || []).filter((u) => !/\/(modelo|ia)-/.test(u)).slice(0, 4 - refs.length)) {
      try { const im = await urlToImage(u); refs.push(fitCanvas(im, 1280)); } catch (e) { /* omitir */ }
    }
    return refs;
  }

  async function aiGenerate(mode, shot, refCanvases) {
    const d = state.draft; const c = d.colors[state.colorIdx];
    const images = [];
    for (const cv of refCanvases) { const b = await toBlob(cv, 'image/jpeg', 0.9); images.push({ type: 'image/jpeg', data: await blobToDataURL(b) }); }
    const sub = (D.SUBS.find((s) => s.id === d.sub) || {}).name || '';
    const prenda = `${sub} ${D.BRANDS.find((b) => b.id === d.brand).name} "${d.name}", color ${c.name}. ${d.desc || ''}`.slice(0, 600);
    const r = await api('POST', '/api/generate', { mode, shot, prenda, images });
    if (!r.ok) throw new Error(r.data.error || 'Gemini no pudo crear la foto');
    return r.data.url || r.data.dataUrl;
  }

  const SHOT_TXT = {
    frente: 'foto de cuerpo entero, de frente, la modelo de pie con postura segura, fondo de estudio liso color crema claro (#F7F2EF), sombra suave en el piso',
    'tres-cuartos': 'foto de 3/4 de perfil, la modelo caminando hacia la cámara, fondo de estudio crema claro, encuadre de la cabeza a las rodillas, mostrando bien el lado del logo',
    detalle: 'primer plano de la prenda puesta, encuadre ajustado a la zona del producto, fondo de estudio crema claro; las manos no tapan textos ni logos',
    gym: 'foto lifestyle en un gimnasio moderno y luminoso con luz natural, la modelo entrenando (sentadilla o estiramiento), el producto claramente visible, fondo desenfocado',
    outdoor: 'foto lifestyle al aire libre en un parque urbano de Bogotá en la mañana, la modelo trotando, luz dorada suave, el producto claramente visible, fondo desenfocado'
  };
  function buildPrompt() {
    const d = state.draft; const c = d.colors[state.colorIdx];
    const sub = (D.SUBS.find((s) => s.id === d.sub) || {}).name || 'prenda';
    const brand = (D.BRANDS.find((b) => b.id === d.brand) || {}).name || '';
    const shots = $$('.adm-shots input:checked').map((i) => i.value);
    const list = (shots.length ? shots : ['frente']).map((s, i) => `${i + 1}. ${SHOT_TXT[s]}.`).join('\n');
    return `La imagen adjunta muestra un producto real: ${sub.toLowerCase()} ${brand} "${d.name}", color ${c.name}.${d.desc ? ' ' + d.desc : ''}

${shots.length > 1 ? `Vamos a crear ${shots.length} fotografías profesionales de e-commerce de una gran marca deportiva, con una modelo usando ESTE producto exacto. Crea AHORA SOLO LA FOTO 1. Cuando yo escriba "siguiente", crea la siguiente de la lista, con la misma modelo y el mismo producto:` : 'Crea una fotografía profesional de e-commerce de una gran marca deportiva, con una modelo usando ESTE producto exacto:'}
${list}

REGLAS ESTRICTAS (lo más importante):
- El producto debe verse EXACTAMENTE igual al de la foto: mismo color y tono, misma tela, mismo largo y proporciones, mismas costuras, mismo texto y tipografía, mismo logo en el mismo lugar y tamaño.
- No agregues, quites ni muevas logos, textos, bolsillos ni detalles. No cambies el corte.
- No muestres partes del producto que no se ven en la foto (por ejemplo la espalda).
- Modelo: mujer latinoamericana adulta, atlética y natural, piel con textura real, manos y anatomía correctas.
- El resto de su ropa, liso y neutro (negro o blanco), sin logos de ninguna marca.
- Luz suave de estudio, lente 85 mm, colores fieles, alta nitidez, formato cuadrado 1:1, sin texto ni marcas de agua.`;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* respaldo abajo */ }
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove(); return ok;
  }

  // Ventana con el prompt visible, botón para copiar y botón para abrir Gemini
  function copyPrompt() {
    const text = buildPrompt();
    const c = state.draft.colors[state.colorIdx];
    const wrap = document.createElement('div');
    wrap.className = 'adm-modal';
    wrap.innerHTML = `<div class="adm-modal__box" role="dialog" aria-modal="true" aria-label="Prompt para Gemini">
      <button class="adm-modal__x" data-x aria-label="Cerrar">✕</button>
      <h2>Crear fotos con modelo en Gemini</h2>
      <ol class="adm-free">
        <li><b>Copia el prompt</b> con el botón rosado.</li>
        <li><b>Descarga la foto</b> del producto ${c.img.length ? '' : '(primero sube una)'}.</li>
        <li><b>Abre Gemini</b>, toca el <b>+</b> para adjuntar la foto, haz clic en el cuadro de texto y pega con <b>Ctrl + V</b> (en celular: mantén presionado → Pegar). Envía.</li>
      </ol>
      <textarea class="adm-prompt" readonly>${esc(text)}</textarea>
      <div class="adm-modal__actions">
        <button class="btn btn--accent" data-copy>📋 Copiar prompt</button>
        ${c.img.length ? `<a class="btn btn--ghost" href="${c.img[0]}" download="producto-${esc(D.slugify(state.draft.name || 'foto'))}.jpg" target="_blank" rel="noopener">⬇ Descargar foto</a>` : ''}
        <a class="btn btn--dark" href="https://gemini.google.com/app" target="_blank" rel="noopener">Abrir Gemini ↗</a>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });
    const ta = $('.adm-prompt', wrap);
    ta.addEventListener('focus', () => ta.select());
    const btn = $('[data-copy]', wrap);
    btn.onclick = async () => {
      const ok = await copyText(text);
      if (ok) { btn.textContent = '✓ Copiado. Ahora pégalo en Gemini'; btn.classList.add('is-done'); toast('✓ Prompt copiado'); }
      else { ta.focus(); ta.select(); btn.textContent = 'Selecciona el texto y copia con Ctrl + C'; }
    };
  }

  async function aiModelPhotos() {
    const d = state.draft; const ci = state.colorIdx; const c = d.colors[ci];
    const shots = $$('.adm-shots input:checked').map((i) => i.value);
    if (!shots.length) return toast('Elige al menos una toma');
    const refs = await refImages(ci);
    if (!refs.length) return toast('Sube primero una foto del producto');
    const steps = shots.map((s) => ({ label: 'Modelo · ' + s, state: 'run', msg: 'En cola…' }));
    progress(steps);
    for (let i = 0; i < shots.length; i++) {
      steps[i].msg = 'Gemini está creando la foto (~1 minuto)…'; progress(steps);
      try {
        const url = await aiGenerate('modelo', shots[i], refs);
        let saved;
        try { saved = await uploadCanvas(await urlToCanvas(url), `modelo-${shots[i]}-${Date.now().toString(36)}`); }
        catch (e) { if (url.startsWith('data:')) throw e; saved = { img: url, thumb: url }; }
        c.img.push(saved.img); c.thumb.push(saved.thumb);
        steps[i].state = 'done'; steps[i].msg = 'Lista';
      } catch (e) { steps[i].state = 'error'; steps[i].msg = e.message; }
      progress(steps);
    }
    state.dirty = true; drawEditor(); progress(steps);
  }

  async function saveProduct() {
    const d = state.draft;
    const errs = [];
    if (!d.name.trim()) errs.push('el nombre');
    if (!(+d.price > 0)) errs.push('el precio');
    if (errs.length) { toast('Falta ' + errs.join(' y ')); return; }
    const btns = $$('#admSave,[data-save]'); btns.forEach((b) => { b.disabled = true; b.textContent = 'Guardando…'; });
    const out = {
      name: d.name.trim(), brand: d.brand, sub: d.sub, sport: d.sport, gender: d.gender,
      price: +d.price, compareAt: +d.compareAt > +d.price ? +d.compareAt : null, desc: d.desc.trim(), tags: d.tags,
      hidden: !!d.hidden, colors: d.colors.map(colorForSave), sizes: d.sizes, stock: d.stock, specs: readSpecs()
    };
    if (!out.compareAt) delete out.compareAt;
    const prev = JSON.stringify(state.data);
    if (d.custom) {
      const raw = Object.assign({ id: d.id, slug: d.slug || D.slugify((D.BRANDS.find((b) => b.id === d.brand) || {}).name + ' ' + d.name) + '-' + d.id.toLowerCase(), art: D.ART_BY_SUB[d.sub], createdAt: Date.now() }, out);
      const i = state.data.products.findIndex((x) => x.id === d.id);
      if (i > -1) state.data.products[i] = Object.assign(state.data.products[i], raw); else state.data.products.unshift(raw);
      d.slug = raw.slug;
    } else {
      if (!out.compareAt) out.compareAt = null;
      state.data.overrides[d.id] = out;
    }
    try {
      await saveData();
      state.dirty = false; d.isNew = false;
      toast(state.mode === 'vercel' ? '✓ Guardado y publicado en la tienda' : '✓ Guardado (modo demo: solo en este navegador)');
      location.hash = '#/admin/producto/' + d.id;
      if (location.hash === '#/admin/producto/' + d.id) drawEditor();
    } catch (e) {
      state.data = JSON.parse(prev);
      toast('⚠️ ' + e.message);
      btns.forEach((b) => { b.disabled = false; b.textContent = 'Guardar y publicar'; });
    }
  }

  async function deleteProduct() {
    const d = state.draft;
    if (!confirm(`¿Eliminar "${d.name}" de la tienda? Esta acción no se puede deshacer.`)) return;
    state.data.products = state.data.products.filter((x) => x.id !== d.id);
    try { await saveData(); state.dirty = false; toast('Producto eliminado'); location.hash = '#/admin/productos'; }
    catch (e) { toast('⚠️ ' + e.message); }
  }

  /* ---------------- Pedidos ---------------- */
  async function viewOrders(q) {
    mount(shell('pedidos', 'Pedidos', '<div class="adm-skel"></div>'));
    const orders = await loadOrders();
    const pay = { card: 'Tarjeta', pse: 'PSE', addi: 'Addi', nequi: 'Nequi', davi: 'Daviplata', efecty: 'Efecty', cod: 'Contraentrega' };
    const ship = { std: 'Estándar', express: 'Express 24h', tienda: 'Recoge en tienda' };
    const sel = q.id && orders.find((o) => o.id === q.id);
    mount(shell('pedidos', 'Pedidos', `
      ${state.mode !== 'vercel' ? '<div class="adm-note">Modo demo: aquí ves los pedidos hechos desde este navegador. Conecta Vercel Blob para recibir los pedidos de todas tus clientas.</div>' : ''}
      <div class="adm-orders ${sel ? 'has-detail' : ''}">
        <div class="adm-card adm-card--flush">
          ${orders.length ? orders.map((o) => `<a href="#/admin/pedidos?id=${o.id}" class="adm-orow ${sel && sel.id === o.id ? 'is-on' : ''}">
            <div><b>${o.id}</b><small>${new Date(o.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
            <div><b>${esc((o.customer && o.customer.name) || o.name || '')}</b><small>${esc(o.city || '')}</small></div>
            <div><small>${pay[o.pay] || ''}</small></div>
            <div>${pill(o.status)}</div>
            <div class="adm-orow__total">${fmt((o.totals && o.totals.total) || 0)}</div>
          </a>`).join('') : '<div class="adm-empty">Aún no hay pedidos.</div>'}
        </div>
        ${sel ? `<div class="adm-card adm-odetail">
          <div class="adm-card__head"><h2>${sel.id}</h2><a href="#/admin/pedidos" class="icon-btn" aria-label="Cerrar">✕</a></div>
          <label class="adm-field"><span>Estado del pedido</span><select id="admStatus">${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${sel.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <div class="adm-odetail__block"><h3>Cliente</h3><p><b>${esc((sel.customer && sel.customer.name) || sel.name || '')}</b><br>${esc((sel.customer && sel.customer.email) || sel.email || '')}<br>${esc((sel.customer && sel.customer.phone) || '')}${sel.customer && sel.customer.doc ? '<br>Doc. ' + esc(sel.customer.doc) : ''}</p>
            ${sel.customer && sel.customer.phone ? `<a class="btn btn--sm" style="background:#25d366" target="_blank" rel="noopener" href="https://wa.me/57${esc(sel.customer.phone)}?text=${encodeURIComponent(`Hola ${((sel.customer.name || '').split(' ')[0])}, te escribimos de MARA Sport sobre tu pedido ${sel.id} 💗`)}">Escribir por WhatsApp</a>` : ''}</div>
          <div class="adm-odetail__block"><h3>Entrega</h3><p>${ship[sel.ship] || ''}<br>${esc(sel.addr || '')}<br>${esc(sel.city || '')}, ${esc(sel.dep || '')}</p></div>
          <div class="adm-odetail__block"><h3>Productos</h3>${(sel.items || []).map((l) => `<div class="adm-oitem"><span>${l.qty} × ${esc(l.name)}<small>${esc(l.color || '')} · Talla ${esc(l.size || '')}</small></span><b>${fmt((l.price || 0) * l.qty)}</b></div>`).join('')}
            <div class="adm-oitem adm-oitem--total"><span>Total · ${pay[sel.pay] || ''}</span><b>${fmt((sel.totals && sel.totals.total) || 0)}</b></div></div>
        </div>` : ''}
      </div>`));
    const st = $('#admStatus');
    if (st) st.onchange = async () => {
      if (state.mode === 'vercel') {
        const r = await api('PATCH', '/api/orders', { id: sel.id, status: st.value });
        if (!r.ok) return toast('⚠️ ' + (r.data.error || 'No se pudo actualizar'));
      } else {
        const list = store.get('mara_orders', []); const o = list.find((x) => x.id === sel.id); if (o) { o.status = st.value; store.set('mara_orders', list); }
      }
      toast('Estado actualizado: ' + STATUS[st.value][0]); viewOrders(q);
    };
  }

  /* ---------------- Ajustes y ayuda ---------------- */
  async function viewSettings() {
    await loadData();
    const ok = (b) => `<i class="adm-dot ${b ? 'is-ok' : ''}">${b ? '✓' : '!'}</i>`;
    mount(shell('ajustes', 'Ajustes y ayuda', `
      <div class="adm-grid2">
        <section class="adm-card">
          <div class="adm-card__head"><h2>${ok(state.mode === 'vercel')} Publicar cambios en vivo</h2></div>
          ${state.mode === 'vercel' ? '<p>Conectado a Vercel Blob. Los productos, fotos y pedidos se guardan en la nube y todas tus clientas ven los cambios en menos de un minuto.</p>' : `
          <p>Ahora estás en <b>modo demo</b>: lo que cambias solo se ve en este navegador. Para publicar para todas:</p>
          <ol class="adm-steps">
            <li>Entra a <b>vercel.com</b> → tu proyecto <b>mara</b> → pestaña <b>Storage</b>.</li>
            <li>Toca <b>Create Database</b> → elige <b>Blob</b> → acceso <b>Public</b> → <b>Create</b>.</li>
            <li>Cuando pregunte, conéctalo al proyecto <b>mara</b> (todos los entornos) y confirma.</li>
            <li>Ve a <b>Deployments</b> → en el último, menú ⋯ → <b>Redeploy</b>.</li>
            <li>Vuelve a entrar a este panel: arriba dirá <b>"Publicando en vivo"</b>.</li>
          </ol>`}
        </section>
        <section class="adm-card">
          <div class="adm-card__head"><h2>${ok(state.gemini)} Fotos con IA (Gemini)</h2></div>
          ${state.gemini ? '<p>Gemini está conectado. Puedes crear fotos de estudio con IA y fotos con modelo desde cada producto.</p>' : `
          <ol class="adm-steps">
            <li>Crea tu clave en <b>aistudio.google.com</b> → <b>Get API key</b> y activa la facturación del proyecto (el plan gratis no crea imágenes).</li>
            <li>En Vercel → proyecto <b>mara</b> → <b>Settings</b> → <b>Environment Variables</b>.</li>
            <li>Agrega <b>GEMINI_API_KEY</b> con tu clave → <b>Save</b>.</li>
            <li>Haz <b>Redeploy</b> y vuelve a entrar al panel.</li>
          </ol>
          <p class="adm-hint">La clave queda guardada en Vercel, nunca en la página: tus clientas no pueden verla.</p>`}
        </section>
        <section class="adm-card">
          <div class="adm-card__head"><h2>${ok(state.key !== '123456')} Clave del panel</h2></div>
          ${state.key === '123456' ? '<p>Estás usando la clave <b>123456</b>. Es fácil de adivinar: cámbiala antes de lanzar la tienda.</p>' : '<p>Usas una clave personalizada. 👍</p>'}
          <ol class="adm-steps">
            <li>En Vercel → <b>Settings</b> → <b>Environment Variables</b>.</li>
            <li>Agrega <b>ADMIN_PASSWORD</b> con tu nueva clave → <b>Save</b> → <b>Redeploy</b>.</li>
          </ol>
        </section>
        <section class="adm-card">
          <div class="adm-card__head"><h2>Copia de seguridad</h2></div>
          <p>Descarga todo tu catálogo (productos, precios, inventario y enlaces de fotos) o restáuralo desde un archivo.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button class="btn btn--dark btn--sm" id="admExport">Descargar copia</button>
            <label class="btn btn--ghost btn--sm">Restaurar copia<input type="file" accept="application/json" id="admImport" hidden></label>
          </div>
        </section>
        <section class="adm-card adm-card--wide">
          <div class="adm-card__head"><h2>Consejos para fotos que venden</h2></div>
          <div class="adm-tips">
            <div><b>📱 Luz de ventana</b><span>De día, cerca de una ventana, sin flash ni luz amarilla.</span></div>
            <div><b>🧺 Fondo liso</b><span>Sábana blanca, gris o el piso liso. Que el fondo no sea del mismo color del producto.</span></div>
            <div><b>📐 Producto completo</b><span>Extiéndelo bien, sin arrugas, y que no se corte en los bordes de la foto.</span></div>
            <div><b>🔄 Varias caras</b><span>Frente, espalda, lado, etiqueta y logo. Más fotos = más confianza.</span></div>
          </div>
        </section>
      </div>`));
    $('#admExport').onclick = () => {
      const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mara-catalogo-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    };
    $('#admImport').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || typeof data !== 'object' || !('overrides' in data || 'products' in data)) throw new Error('Archivo no válido');
        if (!confirm('Esto reemplaza el catálogo actual por el de la copia. ¿Continuar?')) return;
        state.data = { overrides: data.overrides || {}, products: data.products || [], settings: data.settings || {} };
        await saveData(); toast('Copia restaurada ✓');
      } catch (err) { toast('⚠️ ' + err.message); }
    };
  }

  /* ---------------- Router del panel ---------------- */
  async function route(seg, q) {
    if (!state.key) return viewLogin();
    const [a, b] = seg;
    if (!a) return viewDashboard();
    if (a === 'productos') return viewProducts(q);
    if (a === 'producto') return viewEditor(b || 'nuevo');
    if (a === 'pedidos') return viewOrders(q);
    if (a === 'ajustes') return viewSettings();
    return viewDashboard();
  }

  window.addEventListener('beforeunload', (e) => { if (state.dirty && location.hash.startsWith('#/admin/producto')) { e.preventDefault(); e.returnValue = ''; } });
  let lastHash = location.hash;
  window.addEventListener('hashchange', (e) => {
    if (state.dirty && lastHash.startsWith('#/admin/producto') && lastHash !== location.hash) {
      if (!confirm('Tienes cambios sin guardar en este producto. ¿Salir sin guardar?')) { history.replaceState(null, '', lastHash); return; }
      state.dirty = false;
    }
    lastHash = location.hash;
  }, true);

  window.MaraAdmin = { render: (seg, q) => { lastHash = location.hash; route(seg, q); } };
})();
