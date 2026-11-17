/* =========================================================================
   MARA Sport · Lógica de la tienda (SPA sin dependencias)
   ========================================================================= */
(function () {
  'use strict';
  const { BRANDS, SPORTS, CATS, PRODUCTS, CITIES, STORES, COUPONS } = window.MARA_DATA;
  const Art = window.MaraArt;

  const FREE_SHIP = 249900;
  const SHIP_STD = 14900;
  const SHIP_EXP = 24900;
  const MAIN_CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Envigado', 'Itagüí', 'Bello', 'Sabaneta', 'Chía', 'Soacha', 'Cajicá'];
  const WHATSAPP = '573000000000';

  /* ---------------- Utilidades ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmt = (v) => money.format(Math.round(v)).replace(/\s/g, ' ');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const off = (p) => p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const bySlug = (s) => PRODUCTS.find((p) => p.slug === s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
  };
  const GENDERS = { hombre: 'Hombre', mujer: 'Mujer', ninos: 'Niños', unisex: 'Unisex' };
  const sportName = (id) => (SPORTS.find((s) => s.id === id) || {}).name || id;
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const brandName = (id) => (BRANDS.find((b) => b.id === id) || {}).name || id;

  function track(event, items, extra) {
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(Object.assign({
      event,
      ecommerce: {
        currency: 'COP',
        items: (items || []).map((it) => ({
          item_id: it.p.id, item_name: it.p.name, item_brand: it.p.brandName,
          item_category: catName(it.p.cat), item_category2: sportName(it.p.sport),
          item_variant: it.color || it.p.colors[0].name, price: it.p.price, quantity: it.qty || 1
        }))
      }
    }, extra || {}));
  }

  function media(p, ci = 0, view = 0, bg) {
    const c = p.colors[ci] || p.colors[0];
    if (c.img && c.img.length) {
      const src = c.img[view % c.img.length];
      return `<img src="${src}" alt="${esc(p.brandName + ' ' + p.name + ' ' + c.name)}" loading="lazy">`;
    }
    return Art.render(p.art, c, view, bg);
  }

  const icons = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9-9.5C2 7 4.3 4.5 7.2 4.5c2 0 3.6 1.2 4.8 2.9 1.2-1.7 2.8-2.9 4.8-2.9 2.9 0 5.2 2.5 4.2 6C19.5 15.4 12 20 12 20z"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.6 4.5M20 20v-3.5h-3.5"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    store: '<svg viewBox="0 0 24 24"><path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>',
    badge: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>'
  };

  /* ---------------- Estado ---------------- */
  let cart = store.get('mara_cart', []);
  let wish = store.get('mara_wish', []);
  let coupon = store.get('mara_coupon', '');
  let filtersOpen = false;

  function saveCart() { store.set('mara_cart', cart); store.set('mara_coupon', coupon); updateBadges(); }
  function saveWish() { store.set('mara_wish', wish); updateBadges(); }

  function cartTotals(shipMethod) {
    const sub = cart.reduce((s, l) => { const p = byId(l.id); return p ? s + p.price * l.qty : s; }, 0);
    const savings = cart.reduce((s, l) => { const p = byId(l.id); return p && p.compareAt ? s + (p.compareAt - p.price) * l.qty : s; }, 0);
    let disc = 0, freeShipCoupon = false, couponMsg = '';
    const c = COUPONS[coupon];
    if (c) {
      if (c.min && sub < c.min) couponMsg = `Este cupón aplica desde ${fmt(c.min)}`;
      else if (c.type === 'pct') disc = Math.round(sub * c.value / 100);
      else if (c.type === 'ship') freeShipCoupon = true;
    }
    const base = sub - disc;
    let ship = 0;
    if (shipMethod === 'express') ship = SHIP_EXP;
    else if (shipMethod === 'tienda') ship = 0;
    else ship = (base >= FREE_SHIP || freeShipCoupon || sub === 0) ? 0 : SHIP_STD;
    return { sub, disc, ship, total: base + ship, savings, couponMsg, count: cart.reduce((s, l) => s + l.qty, 0) };
  }

  function addToCart(p, ci, size, qty = 1) {
    const line = cart.find((l) => l.id === p.id && l.ci === ci && l.size === size);
    if (line) line.qty = Math.min(10, line.qty + qty);
    else cart.push({ id: p.id, ci, size, qty });
    saveCart();
    bump('#cartCount');
    track('add_to_cart', [{ p, qty, color: p.colors[ci].name }], { value: p.price * qty });
    renderCart();
    openDrawer('#cartDrawer');
  }

  function toggleWish(id) {
    const i = wish.indexOf(id);
    if (i > -1) { wish.splice(i, 1); toast('Eliminado de favoritos'); }
    else {
      wish.push(id); bump('#wishCount');
      toast('Guardado en favoritos · <a href="#/favoritos">Ver</a>');
      const p = byId(id); if (p) track('add_to_wishlist', [{ p }]);
    }
    saveWish();
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('is-on', wish.includes(id)));
  }

  function updateBadges() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    const cc = $('#cartCount'); cc.textContent = n; cc.hidden = !n;
    const wc = $('#wishCount'); wc.textContent = wish.length; wc.hidden = !wish.length;
  }
  function bump(sel) { const el = $(sel); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  let toastT;
  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.classList.add('is-show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-show'), 2800);
  }

  /* ---------------- Drawers y modal ---------------- */
  function openDrawer(sel) {
    closeAll(true);
    $(sel).classList.add('is-open'); $(sel).setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('is-open'); document.body.classList.add('lock');
  }
  function openModal(html, small) {
    closeAll(true);
    const box = $('#modalBox');
    box.className = 'modal__box' + (small ? ' modal__box--sm' : '');
    box.innerHTML = `<button class="icon-btn modal__close" data-close aria-label="Cerrar">✕</button>` + html;
    $('#modal').classList.add('is-open'); $('#modal').setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('is-open'); document.body.classList.add('lock');
  }
  function closeAll(silent) {
    $$('.drawer.is-open').forEach((d) => { d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); });
    $('#modal').classList.remove('is-open'); $('#modal').setAttribute('aria-hidden', 'true');
    const f = $('.filters.is-open'); if (f) { f.classList.remove('is-open'); filtersOpen = false; }
    if (!silent) { $('#overlay').classList.remove('is-open'); document.body.classList.remove('lock'); }
  }

  /* ---------------- Navegación ---------------- */
  function megaFor(g) {
    const sp = SPORTS.filter((s) => g !== 'ninos' || ['running', 'lifestyle'].includes(s.id));
    const promo = PRODUCTS.find((p) => p.gender === g && p.cat === 'tenis' && p.tags.includes('nuevo')) || PRODUCTS[0];
    return `<div class="mega"><div class="mega__inner">
      <div><h6>Tenis</h6>
        <a href="#/tienda?gender=${g}&cat=tenis">Ver todos los tenis</a>
        ${sp.map((s) => `<a href="#/tienda?gender=${g}&cat=tenis&sport=${s.id}">${s.name}</a>`).join('')}
      </div>
      <div><h6>Ropa</h6>
        <a href="#/tienda?gender=${g}&cat=ropa">Ver toda la ropa</a>
        <a href="#/tienda?gender=${g}&cat=ropa&sport=running">Ropa de running</a>
        <a href="#/tienda?gender=${g}&cat=ropa&sport=training">Ropa de gimnasio</a>
        <a href="#/tienda?gender=${g}&cat=ropa&sport=lifestyle">Lifestyle</a>
        <h6 style="margin-top:18px">Accesorios</h6>
        <a href="#/tienda?cat=accesorios">Gorras, maletines y más</a>
      </div>
      <div><h6>Destacados</h6>
        <a href="#/tienda?gender=${g}&new=1">Lanzamientos</a>
        <a href="#/tienda?gender=${g}&sort=top">Más vendidos</a>
        <a href="#/tienda?gender=${g}&sale=1" style="color:var(--sale)">Outlet</a>
        <a href="#/info/tallas">Guía de tallas</a>
      </div>
      <div><h6>Marcas</h6>
        ${BRANDS.map((b) => `<a href="#/tienda?gender=${g}&brand=${b.id}">${b.name}</a>`).join('')}
      </div>
      <a class="mega__promo" href="#/p/${promo.slug}" style="background:${promo.colors[0].hex === '#f4f4f2' ? '#111' : promo.colors[0].hex}">
        ${media(promo, 0, 3)}
        <span class="eyebrow" style="color:#fff;position:relative">Nuevo</span>
        <b>${esc(promo.brandName)}<br>${esc(promo.name)}</b>
        <span style="color:var(--volt);font-weight:700;position:relative">Comprar ahora →</span>
      </a>
    </div></div>`;
  }

  function renderNav() {
    const items = [
      { label: 'Lanzamientos', href: '#/tienda?new=1' },
      { label: 'Hombre', href: '#/tienda?gender=hombre', mega: 'hombre' },
      { label: 'Mujer', href: '#/tienda?gender=mujer', mega: 'mujer' },
      { label: 'Niños', href: '#/tienda?gender=ninos', mega: 'ninos' },
      { label: 'Deportes', href: '#/tienda', sports: true },
      { label: 'Marcas', href: '#/marcas', brands: true },
      { label: 'Outlet', href: '#/tienda?sale=1', sale: true }
    ];
    $('#mainnav').innerHTML = items.map((it) => {
      let drop = '';
      if (it.mega) drop = megaFor(it.mega);
      if (it.sports) drop = `<div class="mega"><div class="mega__inner" style="grid-template-columns:repeat(6,1fr)">${SPORTS.map((s) =>
        `<a href="#/tienda?sport=${s.id}" class="sport" style="background:${s.bg}">${Art.render(s.id === 'futbol' ? 'cleat' : s.id === 'lifestyle' || s.id === 'basketball' ? 'court' : 'runner', { a: '#fff', b: '#ddd', c: s.bg, s: '#111' })}<b>${s.name}</b></a>`).join('')}</div></div>`;
      if (it.brands) drop = `<div class="mega"><div class="mega__inner" style="grid-template-columns:repeat(8,1fr)">${BRANDS.map((b) => `<a class="brand-tile" href="#/tienda?brand=${b.id}">${b.name}</a>`).join('')}</div></div>`;
      return `<div class="nav-item"><a href="${it.href}" class="${it.sale ? 'is-sale' : ''}">${it.label}</a>${drop}</div>`;
    }).join('');

    // Menú móvil
    $('#mobileMenuBody').innerHTML = `
      ${['hombre', 'mujer', 'ninos'].map((g) => `
        <div class="mm-section"><button>${GENDERS[g]} <span>+</span></button>
          <div class="mm-sub">
            <a href="#/tienda?gender=${g}">Ver todo</a>
            <a href="#/tienda?gender=${g}&cat=tenis">Tenis</a>
            <a href="#/tienda?gender=${g}&cat=ropa">Ropa</a>
            <a href="#/tienda?gender=${g}&new=1">Lanzamientos</a>
            <a href="#/tienda?gender=${g}&sale=1">Outlet</a>
          </div></div>`).join('')}
      <div class="mm-section"><button>Deportes <span>+</span></button>
        <div class="mm-sub">${SPORTS.map((s) => `<a href="#/tienda?sport=${s.id}">${s.name}</a>`).join('')}</div></div>
      <div class="mm-section"><button>Marcas <span>+</span></button>
        <div class="mm-sub">${BRANDS.map((b) => `<a href="#/tienda?brand=${b.id}">${b.name}</a>`).join('')}</div></div>
      <div class="mm-section"><a href="#/tienda?sale=1" style="color:var(--sale)">Outlet</a></div>
      <div class="mm-links">
        <a href="#/rastreo">🚚 Rastrea tu pedido</a>
        <a href="#/tiendas">📍 Encuentra tu tienda</a>
        <a href="#/favoritos">♡ Favoritos</a>
        <a href="#" data-open="login">👤 Iniciar sesión</a>
        <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">💬 WhatsApp</a>
      </div>`;
  }

  /* ---------------- Tarjeta de producto ---------------- */
  function stars(r, n) {
    const full = Math.round(r);
    return `<span class="stars"><i>${'★'.repeat(full)}${'☆'.repeat(5 - full)}</i>${r.toFixed(1)}${n != null ? ` (${n})` : ''}</span>`;
  }
  function priceHTML(p) {
    const o = off(p);
    return `<div class="price ${o ? 'price--sale' : ''}"><b>${fmt(p.price)}</b>${o ? `<s>${fmt(p.compareAt)}</s><span class="off">-${o}%</span>` : ''}</div>`;
  }
  function card(p) {
    const o = off(p);
    const badges = [
      o ? `<span class="tag-b tag-b--sale">-${o}%</span>` : '',
      p.tags.includes('nuevo') ? '<span class="tag-b tag-b--new">Nuevo</span>' : '',
      p.tags.includes('bestseller') ? '<span class="tag-b tag-b--hot">Top ventas</span>' : ''
    ].join('');
    const meta = `${catName(p.cat) === 'Tenis' ? sportName(p.sport) : catName(p.cat)} · ${GENDERS[p.gender]}`;
    return `<article class="card" data-card="${p.id}">
      <a class="card__media" href="#/p/${p.slug}" aria-label="${esc(p.brandName + ' ' + p.name)}">
        <div class="main">${media(p, 0, 0)}</div><div class="alt">${media(p, 0, 3)}</div>
      </a>
      <div class="card__badges">${badges}</div>
      <button class="card__wish ${wish.includes(p.id) ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Agregar a favoritos">${icons.heart}</button>
      <div class="card__quick"><button class="btn" data-quick="${p.id}">Compra rápida</button></div>
      <div class="card__body">
        ${p.price >= FREE_SHIP ? `<span class="card__ship">${icons.truck.replace('<svg', '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"')} Envío gratis</span>` : ''}
        <span class="card__brand">${esc(p.brandName)}</span>
        <a href="#/p/${p.slug}" class="card__name">${esc(p.name)}</a>
        <span class="card__meta">${meta}</span>
        <div class="card__swatches">${p.colors.slice(0, 5).map((c, i) => `<span class="sw ${i === 0 ? 'is-on' : ''}" data-sw="${i}" title="${c.name}" style="background:${c.hex}"></span>`).join('')}${p.colors.length > 5 ? `<span class="sw-more">+${p.colors.length - 5}</span>` : ''}</div>
        ${priceHTML(p)}
        <span class="cuotas">o 3 cuotas de <b>${fmt(p.price / 3)}</b> con Addi</span>
      </div>
    </article>`;
  }

  function rail(list, id) {
    return `<div class="rail"><div class="rail__track" id="${id}">${list.map(card).join('')}</div></div>`;
  }

  /* ---------------- HOME ---------------- */
  function viewHome() {
    const best = PRODUCTS.filter((p) => p.tags.includes('bestseller'));
    const slides = [
      { p: bySlug(PRODUCTS[2].slug), ci: 1, bg: 'linear-gradient(120deg,#ff5a1f 0%,#ff2d55 100%)', tag: 'Running Lab', h: 'Corre<br><em>más lejos.</em>', txt: 'Las siluetas más rápidas de ASICS, Nike, HOKA y On. Encuentra tu pisada ideal con asesoría experta.', cta: ['Comprar running', '#/tienda?sport=running&cat=tenis'], cta2: ['Ver lanzamientos', '#/tienda?new=1'], big: 'RUN' },
      { p: PRODUCTS.find((p) => p.name === 'Samba OG'), ci: 1, bg: 'linear-gradient(120deg,#0b0b0c 0%,#2a2a2e 100%)', tag: 'Nueva temporada', h: 'Estilo que<br><em>se mueve.</em>', txt: 'Los clásicos que dominan la calle: Samba, 530, Palermo y Court Vision.', cta: ['Comprar lifestyle', '#/tienda?sport=lifestyle'], cta2: ['Mujer', '#/tienda?gender=mujer&sport=lifestyle'], big: 'STYLE' },
      { p: PRODUCTS.find((p) => p.name === 'Ultraboost 5'), ci: 0, bg: 'linear-gradient(120deg,#e3262f 0%,#9e161c 100%)', tag: 'Outlet', h: 'Hasta<br><em>-25% off</em>', txt: 'Descuentos reales en marcas originales. Unidades limitadas por talla.', cta: ['Comprar outlet', '#/tienda?sale=1'], cta2: ['Hombre', '#/tienda?gender=hombre&sale=1'], big: 'SALE' }
    ];
    const sale = PRODUCTS.filter((p) => p.compareAt);
    const genderTiles = [
      { g: 'hombre', bg: '#1c2a4a', p: PRODUCTS[3] },
      { g: 'mujer', bg: '#b9a6f0', p: PRODUCTS[5] },
      { g: 'ninos', bg: '#8ec5ff', p: PRODUCTS.find((p) => p.gender === 'ninos') }
    ];
    const revs = [
      { n: 'Laura M.', c: 'Medellín', t: 'Llegaron en 2 días a Medellín y son 100% originales. El asesor por WhatsApp me ayudó con la talla perfecta.', p: 'HOKA Clifton 10' },
      { n: 'Andrés R.', c: 'Bogotá', t: 'Pedí el viernes y el sábado ya los tenía. Pagué con Addi en 3 cuotas sin interés. Excelente experiencia.', p: 'ASICS Novablast 5' },
      { n: 'Valentina G.', c: 'Cali', t: 'Hice un cambio de talla sin costo en la tienda de Chipichape. Súper fácil, me atendieron muy bien.', p: 'adidas Samba OG' }
    ];

    return `
    <section class="hero" aria-roledescription="carrusel">
      <div class="hero__slides">
        ${slides.map((s, i) => `
          <div class="slide ${i === 0 ? 'is-active' : ''}" data-slide="${i}">
            <div class="slide__bg" style="background:${s.bg}"></div>
            <span class="slide__big">${s.big}</span>
            <div class="slide__copy">
              <span class="tag">${s.tag}</span>
              <h1>${s.h}</h1>
              <p>${s.txt}</p>
              <div class="slide__ctas"><a class="btn btn--light" href="${s.cta[1]}">${s.cta[0]}</a><a class="btn btn--ghost" style="color:#fff;box-shadow:inset 0 0 0 1.5px #fff" href="${s.cta2[1]}">${s.cta2[0]}</a></div>
            </div>
            <a class="slide__art" href="#/p/${s.p.slug}" aria-label="${esc(s.p.brandName + ' ' + s.p.name)}">${media(s.p, s.ci, 0)}</a>
          </div>`).join('')}
      </div>
      <div class="hero__dots">${slides.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-dot="${i}" aria-label="Diapositiva ${i + 1}"></button>`).join('')}</div>
      <div class="hero__arrows"><button data-hero="-1" aria-label="Anterior">‹</button><button data-hero="1" aria-label="Siguiente">›</button></div>
    </section>

    <div class="container">
      <nav class="quick" aria-label="Accesos rápidos">
        <a class="chip chip--volt" href="#/tienda?sale=1">🔥 Outlet hasta -25%</a>
        <a class="chip" href="#/tienda?cat=tenis&sport=running">Tenis running</a>
        <a class="chip" href="#/tienda?gender=mujer">Regalos para ella</a>
        <a class="chip" href="#/tienda?gender=hombre">Regalos para él</a>
        <a class="chip" href="#/tienda?gender=ninos">Niños</a>
        <a class="chip" href="#/tienda?cat=ropa&max=200000">Ropa desde $139.950</a>
        <a class="chip" href="#/tienda?cat=accesorios">Accesorios desde $69.900</a>
      </nav>
    </div>

    <div class="container">
      <div class="trustbar">
        <div>${icons.truck}<p><b>Envío gratis</b><span>Desde ${fmt(FREE_SHIP)}</span></p></div>
        <div>${icons.badge}<p><b>100% originales</b><span>Garantía de autenticidad</span></p></div>
        <div>${icons.card}<p><b>Paga como quieras</b><span>Addi, PSE, Nequi, contraentrega</span></p></div>
        <div>${icons.refresh}<p><b>30 días para cambios</b><span>Sin costo y sin complicaciones</span></p></div>
      </div>
    </div>

    <section class="section container">
      <div class="tiles">
        ${genderTiles.map((t) => `<a class="tile" href="#/tienda?gender=${t.g}" style="background:${t.bg}">${media(t.p, 0, 3)}<div><h3>${GENDERS[t.g]}</h3><span>Comprar ahora</span></div></a>`).join('')}
      </div>
    </section>

    <section class="section--tight container">
      <div class="section__head">
        <div><span class="eyebrow">Lo que todos quieren</span><h2>Tendencias de la semana</h2></div>
        <div class="tabs" id="homeTabs">
          <button class="chip is-on" data-tab="best">Más vendidos</button>
          <button class="chip" data-tab="new">Lanzamientos</button>
          <button class="chip" data-tab="sale">Ofertas</button>
        </div>
        <div class="rail__nav"><button data-rail="railHome" data-dir="-1" aria-label="Anterior">‹</button><button data-rail="railHome" data-dir="1" aria-label="Siguiente">›</button></div>
      </div>
      ${rail(best, 'railHome')}
    </section>

    <section class="section container">
      <div class="section__head"><div><span class="eyebrow">Encuentra tu juego</span><h2>Compra por deporte</h2></div></div>
      <div class="sports">
        ${SPORTS.map((s) => {
          const p = PRODUCTS.find((x) => x.sport === s.id && x.cat === 'tenis') || PRODUCTS[0];
          return `<a class="sport" href="#/tienda?sport=${s.id}" style="background:${s.bg}">${media(p, 1 % p.colors.length, 0)}<b>${s.name}</b></a>`;
        }).join('')}
      </div>
    </section>

    <section class="section--tight container">
      <div class="split">
        <a class="promo" href="#/tienda?sport=running" style="background:#1c2a4a">
          ${media(PRODUCTS[3], 0, 0)}
          <span class="eyebrow" style="color:var(--volt)">Running Lab</span>
          <h3>Tu próximo récord empieza aquí</h3>
          <p>Analizamos tu pisada gratis en tienda y te recomendamos el tenis ideal.</p>
          <span class="btn btn--light" style="align-self:flex-start">Descubrir</span>
        </a>
        <a class="promo" href="#/tienda?sport=training" style="background:#dcff4a;color:#111">
          ${media(PRODUCTS.find((p) => p.name === 'Metcon 10'), 0, 0)}
          <span class="eyebrow" style="color:#111">Training</span>
          <h3>Hecho para el gym</h3>
          <p>Estabilidad para levantar, agarre para tus WODs. Tenis y ropa de entrenamiento.</p>
          <span class="btn btn--dark" style="align-self:flex-start">Comprar training</span>
        </a>
      </div>
    </section>

    <section class="section container">
      <div class="flash">
        <div>
          <span class="eyebrow" style="color:var(--volt)">Solo por tiempo limitado</span>
          <h2>Flash sale <em>48 horas</em></h2>
          <p style="opacity:.8;margin-top:10px">Precios especiales en referencias seleccionadas. Hasta agotar existencias.</p>
        </div>
        <div class="countdown" id="countdown"></div>
      </div>
      <div style="margin-top:24px">${rail(sale, 'railSale')}</div>
    </section>

    <section class="section--tight container">
      <div class="section__head"><div><span class="eyebrow">Distribuidores autorizados</span><h2>Las mejores marcas</h2></div><a class="link" href="#/marcas">Ver todas</a></div>
      <div class="brands">${BRANDS.map((b) => `<a class="brand-tile" href="#/tienda?brand=${b.id}">${b.name}</a>`).join('')}</div>
    </section>

    <section class="section container">
      <div class="section__head">
        <div><span class="eyebrow">Opiniones verificadas</span><h2>+12.000 clientes felices</h2></div>
        <div class="score"><b>4.8</b><div>${stars(4.8)}<br><small style="color:var(--muted)">Basado en 3.214 reseñas</small></div></div>
      </div>
      <div class="reviews">
        ${revs.map((r) => `<blockquote class="review" style="margin:0">${stars(5)}<p>“${r.t}”</p><footer><span class="avatar">${r.n[0]}</span><span><b style="color:var(--ink)">${r.n}</b> · ${r.c}<br><span class="verified">✓ Compra verificada</span> · ${r.p}</span></footer></blockquote>`).join('')}
      </div>
    </section>

    <section class="section--tight container">
      <div class="club">
        <div>
          <span class="eyebrow" style="color:#fff">MARA Club · Gratis</span>
          <h2>10% OFF en tu primera compra</h2>
          <ul><li>Acceso anticipado a lanzamientos y preventas</li><li>Ofertas exclusivas para miembros</li><li>Envío gratis en tu cumpleaños</li></ul>
        </div>
        <div>
          <form class="newsletter" data-newsletter><input type="email" required placeholder="Tu correo electrónico" aria-label="Correo"><button class="btn btn--dark">Quiero mi 10%</button></form>
          <p style="font-size:12px;margin-top:10px;opacity:.85">Al suscribirte aceptas nuestra política de tratamiento de datos (Ley 1581 de 2012).</p>
        </div>
      </div>
    </section>`;
  }

  let heroTimer, cdTimer;
  function initHome() {
    let cur = 0;
    const slides = $$('.slide'), dots = $$('[data-dot]');
    const go = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === cur));
      dots.forEach((d, k) => { d.classList.remove('is-active'); if (k === cur) { void d.offsetWidth; d.classList.add('is-active'); } });
      clearInterval(heroTimer); heroTimer = setInterval(() => go(cur + 1), 6000);
    };
    dots.forEach((d) => d.onclick = () => go(+d.dataset.dot));
    $$('[data-hero]').forEach((b) => b.onclick = () => go(cur + +b.dataset.hero));
    go(0);

    // Swipe en móvil
    let x0 = null;
    const hero = $('.hero');
    hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); x0 = null; });

    // Tabs
    $$('#homeTabs [data-tab]').forEach((b) => b.onclick = () => {
      $$('#homeTabs .chip').forEach((c) => c.classList.toggle('is-on', c === b));
      const t = b.dataset.tab;
      const list = t === 'new' ? PRODUCTS.filter((p) => p.tags.includes('nuevo')) : t === 'sale' ? PRODUCTS.filter((p) => p.compareAt) : PRODUCTS.filter((p) => p.tags.includes('bestseller'));
      $('#railHome').innerHTML = list.map(card).join(''); $('#railHome').scrollLeft = 0;
    });

    // Cuenta regresiva (48 h móviles, persistente por visitante)
    let end = store.get('mara_flash_end', 0);
    if (!end || end < Date.now()) { end = Date.now() + 48 * 3600 * 1000; store.set('mara_flash_end', end); }
    const tick = () => {
      const el = $('#countdown'); if (!el) return clearInterval(cdTimer);
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
      const pad = (v) => String(v).padStart(2, '0');
      el.innerHTML = [[d, 'Días'], [h, 'Horas'], [m, 'Min'], [s, 'Seg']].map(([v, l]) => `<div><b>${pad(v)}</b><span>${l}</span></div>`).join('');
    };
    clearInterval(cdTimer); tick(); cdTimer = setInterval(tick, 1000);
  }

  /* ---------------- CATÁLOGO (PLP) ---------------- */
  function matches(p, q, skip) {
    if (q.gender && skip !== 'gender' && !(p.gender === q.gender || (p.gender === 'unisex' && q.gender !== 'ninos'))) return false;
    if (q.cat && skip !== 'cat' && p.cat !== q.cat) return false;
    if (q.sport && skip !== 'sport' && !q.sport.split(',').includes(p.sport)) return false;
    if (q.brand && skip !== 'brand' && !q.brand.split(',').includes(p.brand)) return false;
    if (q.size && skip !== 'size' && !q.size.split(',').some((s) => p.stock[s] > 0)) return false;
    if (q.color && skip !== 'color' && !p.colors.some((c) => q.color.split(',').includes(c.key))) return false;
    if (q.min && p.price < +q.min) return false;
    if (q.max && p.price > +q.max) return false;
    if (q.sale && !p.compareAt) return false;
    if (q.new && !p.tags.includes('nuevo')) return false;
    if (q.q) {
      const hay = norm([p.name, p.brandName, catName(p.cat), sportName(p.sport), GENDERS[p.gender], p.colors.map((c) => c.name).join(' '), p.desc].join(' '));
      if (!norm(q.q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, '')))) return false;
    }
    return true;
  }
  function sortList(list, s) {
    const l = list.slice();
    if (s === 'price-asc') l.sort((a, b) => a.price - b.price);
    else if (s === 'price-desc') l.sort((a, b) => b.price - a.price);
    else if (s === 'new') l.sort((a, b) => (b.tags.includes('nuevo') - a.tags.includes('nuevo')) || b.createdAt - a.createdAt);
    else if (s === 'off') l.sort((a, b) => off(b) - off(a));
    else if (s === 'rating') l.sort((a, b) => b.rating - a.rating);
    else l.sort((a, b) => (b.tags.includes('bestseller') - a.tags.includes('bestseller')) || b.reviews - a.reviews);
    return l;
  }
  function plpTitle(q) {
    if (q.q) return `“${esc(q.q)}”`;
    const parts = [];
    if (q.sale) parts.push('Outlet');
    if (q.new) parts.push('Lanzamientos');
    if (q.cat) parts.push(catName(q.cat));
    if (q.sport && !q.sport.includes(',')) parts.push(sportName(q.sport));
    if (q.brand && !q.brand.includes(',')) parts.push(brandName(q.brand));
    if (q.gender) parts.push(GENDERS[q.gender]);
    return parts.length ? parts.join(' · ') : 'Toda la tienda';
  }

  function viewPLP(q) {
    const list = sortList(PRODUCTS.filter((p) => matches(p, q)), q.sort);
    const count = (group, val) => PRODUCTS.filter((p) => matches(p, q, group) && (
      group === 'brand' ? p.brand === val : group === 'sport' ? p.sport === val : group === 'cat' ? p.cat === val : group === 'gender' ? p.gender === val : true)).length;
    const has = (k, v) => (q[k] || '').split(',').includes(v);
    const sizes = q.cat === 'ropa' ? ['XS', 'S', 'M', 'L', 'XL', 'XXL'] : q.gender === 'ninos' ? ['28', '29', '30', '31', '32', '33', '34', '35'] : ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
    const palette = window.MARA_DATA.PALETTE;
    const group = (title, body, closed) => `<div class="fgroup ${closed ? 'is-closed' : ''}"><button type="button">${title}</button><div class="fbody">${body}</div></div>`;
    const checks = (key, items) => items.map(([id, name]) => {
      const n = count(key, id);
      return `<label class="check"><input type="checkbox" data-f="${key}" value="${id}" ${has(key, id) ? 'checked' : ''} ${!n && !has(key, id) ? 'disabled' : ''}> ${name} <small>${n}</small></label>`;
    }).join('');

    const chipsActive = [];
    ['gender', 'cat'].forEach((k) => { if (q[k]) chipsActive.push([k, q[k], k === 'gender' ? GENDERS[q[k]] : catName(q[k])]); });
    ['sport', 'brand', 'size', 'color'].forEach((k) => (q[k] || '').split(',').filter(Boolean).forEach((v) =>
      chipsActive.push([k, v, k === 'sport' ? sportName(v) : k === 'brand' ? brandName(v) : k === 'color' ? palette[v].name : 'Talla ' + v])));
    if (q.sale) chipsActive.push(['sale', '1', 'Outlet']);
    if (q.new) chipsActive.push(['new', '1', 'Nuevos']);
    if (q.min || q.max) chipsActive.push(['price', '', `${q.min ? fmt(q.min) : '$0'} – ${q.max ? fmt(q.max) : 'más'}`]);
    if (q.q) chipsActive.push(['q', '', `Búsqueda: ${esc(q.q)}`]);

    return `<div class="container">
      <nav class="crumbs"><a href="#/">Inicio</a> / <a href="#/tienda">Tienda</a>${q.gender ? ` / <a href="#/tienda?gender=${q.gender}">${GENDERS[q.gender]}</a>` : ''}</nav>
      <div class="plp-head">
        <h1>${plpTitle(q)} <small>${list.length} producto${list.length === 1 ? '' : 's'}</small></h1>
        <div class="plp-tools">
          <button class="btn btn--ghost btn--sm filter-toggle" id="openFilters">Filtros ${chipsActive.length ? `(${chipsActive.length})` : ''}</button>
          <select class="select" id="sort" aria-label="Ordenar por">
            ${[['', 'Más relevantes'], ['top', 'Más vendidos'], ['new', 'Novedades'], ['price-asc', 'Menor precio'], ['price-desc', 'Mayor precio'], ['off', 'Mayor descuento'], ['rating', 'Mejor calificados']]
              .map(([v, l]) => `<option value="${v}" ${(q.sort || '') === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="plp">
        <aside class="filters ${filtersOpen ? 'is-open' : ''}" id="filters" aria-label="Filtros">
          <div class="filters__head"><h3>Filtrar</h3><button class="icon-btn" data-close-filters aria-label="Cerrar">✕</button></div>
          ${group('Género', checks('gender', [['hombre', 'Hombre'], ['mujer', 'Mujer'], ['ninos', 'Niños'], ['unisex', 'Unisex']]).replace(/type="checkbox" data-f="gender"/g, 'type="radio" name="g" data-f="gender"'))}
          ${group('Categoría', checks('cat', CATS.map((c) => [c.id, c.name])).replace(/type="checkbox" data-f="cat"/g, 'type="radio" name="c" data-f="cat"'))}
          ${group('Deporte', checks('sport', SPORTS.map((s) => [s.id, s.name])))}
          ${group('Marca', checks('brand', BRANDS.map((b) => [b.id, b.name])))}
          ${group('Talla', `<div class="fsizes">${sizes.map((s) => `<button type="button" data-size="${s}" class="${has('size', s) ? 'is-on' : ''}">${s}</button>`).join('')}</div>`)}
          ${group('Color', `<div class="fcolors">${Object.entries(palette).map(([k, c]) => `<button type="button" data-color="${k}"><span class="sw ${has('color', k) ? 'is-on' : ''}" style="background:${c.hex}"></span>${c.name.split(' ')[0]}</button>`).join('')}</div>`, true)}
          ${group('Precio', `<div class="range"><input type="number" inputmode="numeric" placeholder="Mín" id="pmin" value="${q.min || ''}" step="10000"><span>–</span><input type="number" inputmode="numeric" placeholder="Máx" id="pmax" value="${q.max || ''}" step="10000"></div>
             <div style="display:flex;gap:6px;flex-wrap:wrap">${[[0, 200000], [200000, 500000], [500000, 750000], [750000, 0]].map(([a, b]) => `<button type="button" class="chip" style="height:32px;font-size:12px" data-range="${a}-${b}">${b ? (a ? fmt(a) + ' – ' : 'Hasta ') + fmt(b) : 'Más de ' + fmt(a)}</button>`).join('')}</div>`)}
          ${group('Ofertas', `<label class="check"><input type="checkbox" data-flag="sale" ${q.sale ? 'checked' : ''}> Solo outlet / descuentos</label><label class="check"><input type="checkbox" data-flag="new" ${q.new ? 'checked' : ''}> Solo lanzamientos</label>`)}
          <div class="filters__apply"><button class="btn btn--block" data-close-filters>Ver ${list.length} productos</button></div>
        </aside>
        <section>
          ${chipsActive.length ? `<div class="active-filters">${chipsActive.map(([k, v, l]) => `<button class="chip" data-rm="${k}" data-v="${v}">${l} ✕</button>`).join('')}<button class="link" style="font-size:13px" data-clear>Limpiar todo</button></div>` : ''}
          ${list.length ? `<div class="grid grid--3" id="plpGrid">${list.map(card).join('')}</div>` : `
            <div class="empty"><h3>Sin resultados</h3><p>No encontramos productos con esos filtros. Prueba quitando alguno o habla con un asesor.</p>
            <button class="btn" data-clear>Limpiar filtros</button> <a class="btn btn--ghost" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">Asesoría por WhatsApp</a></div>
            <h2 style="font-size:32px;margin:24px 0 18px">Te puede interesar</h2><div class="grid grid--3">${sortList(PRODUCTS, 'top').slice(0, 6).map(card).join('')}</div>`}
        </section>
      </div>
    </div>`;
  }

  function setQuery(q) {
    const clean = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v != null));
    const qs = new URLSearchParams(clean).toString();
    location.hash = '#/tienda' + (qs ? '?' + qs : '');
  }

  function initPLP(q) {
    const toggleIn = (k, v) => {
      const s = new Set((q[k] || '').split(',').filter(Boolean));
      s.has(v) ? s.delete(v) : s.add(v);
      return Object.assign({}, q, { [k]: [...s].join(',') });
    };
    $('#sort').onchange = (e) => setQuery(Object.assign({}, q, { sort: e.target.value }));
    $$('.fgroup > button').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('is-closed'));
    $$('[data-f]').forEach((i) => i.onchange = () => {
      const k = i.dataset.f;
      if (i.type === 'radio') setQuery(Object.assign({}, q, { [k]: q[k] === i.value ? '' : i.value }));
      else setQuery(toggleIn(k, i.value));
    });
    // Permite deseleccionar radios
    $$('input[type=radio][data-f]').forEach((i) => i.onclick = () => { if (q[i.dataset.f] === i.value) setQuery(Object.assign({}, q, { [i.dataset.f]: '' })); });
    $$('[data-size]').forEach((b) => b.onclick = () => setQuery(toggleIn('size', b.dataset.size)));
    $$('[data-color]').forEach((b) => b.onclick = () => setQuery(toggleIn('color', b.dataset.color)));
    $$('[data-flag]').forEach((i) => i.onchange = () => setQuery(Object.assign({}, q, { [i.dataset.flag]: i.checked ? '1' : '' })));
    $$('[data-range]').forEach((b) => b.onclick = () => { const [a, z] = b.dataset.range.split('-'); setQuery(Object.assign({}, q, { min: +a || '', max: +z || '' })); });
    ['#pmin', '#pmax'].forEach((s) => $(s).onchange = () => setQuery(Object.assign({}, q, { min: $('#pmin').value, max: $('#pmax').value })));
    $$('[data-rm]').forEach((b) => b.onclick = () => {
      const k = b.dataset.rm;
      if (k === 'price') setQuery(Object.assign({}, q, { min: '', max: '' }));
      else if (['sport', 'brand', 'size', 'color'].includes(k)) setQuery(toggleIn(k, b.dataset.v));
      else setQuery(Object.assign({}, q, { [k]: '' }));
    });
    $$('[data-clear]').forEach((b) => b.onclick = () => { filtersOpen = false; setQuery({}); });
    const of = $('#openFilters');
    if (of) of.onclick = () => { filtersOpen = true; $('#filters').classList.add('is-open'); $('#overlay').classList.add('is-open'); document.body.classList.add('lock'); };
    $$('[data-close-filters]').forEach((b) => b.onclick = () => closeAll());
    if (filtersOpen && window.innerWidth <= 960) { $('#overlay').classList.add('is-open'); document.body.classList.add('lock'); }
    if (q.q) track('search', [], { search_term: q.q });
  }

  /* ---------------- PRODUCTO (PDP) ---------------- */
  function deliveryText(city) {
    const fast = MAIN_CITIES.includes(city);
    const add = (n) => { const d = new Date(); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) k++; } return d; };
    const f = (d) => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    return fast ? `Recíbelo entre el <b>${f(add(1))}</b> y el <b>${f(add(2))}</b>` : `Recíbelo entre el <b>${f(add(2))}</b> y el <b>${f(add(5))}</b>`;
  }

  function sampleReviews(p) {
    const names = ['Camila R.', 'Juan P.', 'Daniela V.', 'Santiago M.', 'Mariana L.', 'Felipe C.'];
    const cities = ['Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'Pereira', 'Barranquilla'];
    const texts = p.cat === 'tenis'
      ? [['Comodísimos', 'Los uso para correr 3 veces por semana y la amortiguación es increíble. Talla exacta.'], ['Originales y rápidos', 'Llegaron en 48 horas, con caja y etiquetas originales. Volveré a comprar.'], ['Muy buenos', 'Calzan un poco ajustados, recomiendo media talla más si tienes el pie ancho.'], ['Excelente servicio', 'Me asesoraron por WhatsApp y acertaron con el modelo. 10/10.']]
      : [['Excelente calidad', 'La tela es muy buena y no se deforma con las lavadas.'], ['Me encantó', 'Talla exacta y el color es igual al de la foto.'], ['Recomendado', 'Muy cómodo para entrenar, seca rápido.'], ['Buen precio', 'Lo compré en oferta y la calidad es la de la marca original.']];
    return texts.map((t, i) => ({ n: names[(i + p.createdAt) % 6], c: cities[(i * 2 + p.createdAt) % 6], r: i === 2 ? 4 : 5, t: t[0], b: t[1], d: `hace ${i * 5 + 3} días` }));
  }

  function setProductLD(p) {
    let el = $('#ld-product');
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ld-product'; document.head.appendChild(el); }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: `${p.brandName} ${p.name}`, sku: p.id,
      brand: { '@type': 'Brand', name: p.brandName }, description: p.desc,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.toFixed(1), reviewCount: p.reviews },
      offers: { '@type': 'Offer', priceCurrency: 'COP', price: p.price, availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition' }
    });
  }

  function viewPDP(p, q) {
    const ci = Math.min(+(q.c || 0), p.colors.length - 1);
    const c = p.colors[ci];
    const o = off(p);
    const rv = sampleReviews(p);
    const related = PRODUCTS.filter((x) => x.id !== p.id && (x.sport === p.sport || x.brand === p.brand)).slice(0, 8);
    const complete = PRODUCTS.filter((x) => x.cat !== p.cat && (x.gender === p.gender || x.gender === 'unisex')).slice(0, 8);
    const allCities = Object.values(CITIES).flat().sort((a, b) => a.localeCompare(b, 'es'));
    const savedCity = store.get('mara_city', 'Bogotá');
    const dist = [72, 18, 6, 3, 1];

    return `<div class="container">
      <nav class="crumbs"><a href="#/">Inicio</a> / <a href="#/tienda?gender=${p.gender}">${GENDERS[p.gender]}</a> / <a href="#/tienda?gender=${p.gender}&cat=${p.cat}">${catName(p.cat)}</a> / <a href="#/tienda?sport=${p.sport}">${sportName(p.sport)}</a></nav>
      <div class="pdp">
        <div>
          <div class="gallery" id="gallery">
            ${[0, 1, 2, 3].map((v) => `<div class="gallery__item" data-zoom="${v}">${media(p, ci, v)}</div>`).join('')}
          </div>
          <div class="gallery__dots" id="gdots">${[0, 1, 2, 3].map((v) => `<i class="${v ? '' : 'is-on'}"></i>`).join('')}</div>
        </div>
        <div class="buy">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <a class="buy__brand" href="#/tienda?brand=${p.brand}">${esc(p.brandName)}</a>
              <a href="#reviews" style="text-decoration:none">${stars(p.rating, p.reviews)}</a>
            </div>
            <h1 style="margin-top:8px">${esc(p.name)}</h1>
            <p style="color:var(--muted);margin-top:6px">${catName(p.cat)} de ${sportName(p.sport).toLowerCase()} · ${GENDERS[p.gender]} · Ref. ${p.id}</p>
          </div>
          <div>
            ${priceHTML(p)}
            ${o ? `<p style="color:var(--ok);font-weight:600;font-size:14px;margin-top:4px">Ahorras ${fmt(p.compareAt - p.price)}</p>` : ''}
          </div>
          <div class="buy__cuotas"><span class="addi">addi</span><span>Paga en <b>3 cuotas de ${fmt(p.price / 3)}</b> sin interés. <a class="link" href="#/info/pagos">Conoce más</a></span></div>
          <div>
            <div class="opt-label">Color <span>${c.name}</span></div>
            <div class="colors">${p.colors.map((x, i) => `<button class="${i === ci ? 'is-on' : ''}" data-color-i="${i}" aria-label="${x.name}" title="${x.name}">${media(p, i, 0)}</button>`).join('')}</div>
          </div>
          <div>
            <div class="opt-label">Selecciona tu talla ${p.cat === 'tenis' ? '(CO)' : ''} <button class="link" style="font-size:13px" data-open="sizeguide">Guía de tallas</button></div>
            <div class="sizes" id="sizes">${p.sizes.map((s) => `<button data-size-pick="${s}" class="${!p.stock[s] ? 'is-out' : ''} ${p.stock[s] && p.stock[s] <= 2 ? 'is-low' : ''}" ${!p.stock[s] ? 'aria-disabled="true" title="Agotado"' : ''}>${s}</button>`).join('')}</div>
            <div id="sizeMsg"></div>
          </div>
          <div class="buy__ctas">
            <button class="btn btn--block" id="addBtn">Agregar al carrito</button>
            <button class="wish-big ${wish.includes(p.id) ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Favoritos">${icons.heart}</button>
          </div>
          <button class="btn btn--accent btn--block" id="buyNow" style="height:58px;margin-top:-8px">Comprar ahora</button>
          <div class="perks">
            <div class="perk">${icons.truck}<div><b>${p.price >= FREE_SHIP ? 'Envío gratis' : 'Envío ' + fmt(SHIP_STD) + ' · gratis desde ' + fmt(FREE_SHIP)}</b>
              <small id="eta">${deliveryText(savedCity)}</small>
              <div class="city"><select id="citySel" aria-label="Ciudad de entrega">${allCities.map((x) => `<option ${x === savedCity ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div></div>
            <div class="perk">${icons.store}<div><b>Recoge gratis en tienda</b><small>Disponible hoy en MARA Andino (Bogotá) y El Tesoro (Medellín)</small></div></div>
            <div class="perk">${icons.refresh}<div><b>30 días para cambios</b><small>Cambia talla o referencia sin costo.</small></div></div>
            <div class="perk">${icons.shield}<div><b>Producto 100% original</b><small>Importado por distribuidores autorizados de ${esc(p.brandName)}.</small></div></div>
            <div class="perk">${icons.chat}<div><b>¿Dudas con la talla?</b><small><a class="link" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, tengo una pregunta sobre ' + p.brandName + ' ' + p.name + ' (' + p.id + ')')}" target="_blank" rel="noopener">Habla con un asesor por WhatsApp</a></small></div></div>
          </div>
          <div>
            <div class="acc is-open"><button>Descripción</button><div class="acc__body"><p>${esc(p.desc)}</p></div></div>
            <div class="acc"><button>Ficha técnica</button><div class="acc__body"><dl class="spec">${Object.entries(p.specs || {}).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}<dt>Marca</dt><dd>${esc(p.brandName)}</dd><dt>Referencia</dt><dd>${p.id}</dd><dt>Garantía</dt><dd>Legal según Ley 1480 de 2011</dd></dl></div></div>
            <div class="acc"><button>Envíos, cambios y devoluciones</button><div class="acc__body">
              <p>Envíos a toda Colombia con Servientrega, Coordinadora e Interrapidísimo. Ciudades principales: 1–2 días hábiles; resto del país: 2–5 días hábiles.</p>
              <p style="margin-top:8px">Tienes 30 días para cambios y 5 días hábiles para ejercer tu derecho de retracto (Art. 47, Ley 1480). <a class="link" href="#/info/cambios">Ver política</a></p></div></div>
          </div>
        </div>
      </div>

      <section class="section--tight">
        <div class="section__head"><div><span class="eyebrow">Completa tu look</span><h2>Combínalo con</h2></div></div>
        ${rail(complete, 'railComplete')}
      </section>

      <section class="section" id="reviews">
        <div class="section__head"><h2>Opiniones (${p.reviews})</h2><button class="btn btn--ghost btn--sm" data-open="review">Escribir opinión</button></div>
        <div class="rev-summary">
          <div>
            <div class="score"><b>${p.rating.toFixed(1)}</b><div>${stars(p.rating)}<br><small style="color:var(--muted)">${p.reviews} opiniones</small></div></div>
            <div class="bars" style="margin-top:18px">${dist.map((v, i) => `<div><small>${5 - i}★</small><span><i style="width:${v}%"></i></span><small>${v}%</small></div>`).join('')}</div>
            <p style="margin-top:18px;font-size:14px"><b>94%</b> de los clientes lo recomiendan</p>
            ${p.cat === 'tenis' ? `<p style="margin-top:10px;font-size:14px">Ajuste: <b>Talla exacta</b></p>` : ''}
          </div>
          <div class="rev-list">${rv.map((r) => `<div class="rev-item">${stars(r.r)}<h5>${r.t}</h5><p>${r.b}</p><small><b style="color:var(--ink)">${r.n}</b> · ${r.c} · ${r.d} · <span class="verified">✓ Compra verificada</span></small></div>`).join('')}</div>
        </div>
      </section>

      <section class="section--tight">
        <div class="section__head"><div><span class="eyebrow">También te puede gustar</span><h2>Productos similares</h2></div></div>
        ${rail(related, 'railRelated')}
      </section>
    </div>
    <div class="sticky-buy" id="stickyBuy"><div style="min-width:0"><b style="display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><span style="font-size:14px">${fmt(p.price)}</span></div><button class="btn" id="stickyAdd">Agregar al carrito</button></div>`;
  }

  function initPDP(p, q) {
    const ci = Math.min(+(q.c || 0), p.colors.length - 1);
    let size = null;
    setProductLD(p);
    document.title = `${p.brandName} ${p.name} · MARA Sport`;
    track('view_item', [{ p, color: p.colors[ci].name }], { value: p.price });
    // Vistos recientemente
    const seen = store.get('mara_seen', []).filter((x) => x !== p.id); seen.unshift(p.id); store.set('mara_seen', seen.slice(0, 12));

    $$('[data-color-i]').forEach((b) => b.onclick = () => { history.replaceState(null, '', `#/p/${p.slug}?c=${b.dataset.colorI}`); render(true); });
    $$('[data-size-pick]').forEach((b) => b.onclick = () => {
      size = b.dataset.sizePick;
      $$('[data-size-pick]').forEach((x) => x.classList.toggle('is-on', x === b));
      $('#sizes').classList.remove('is-error');
      const st = p.stock[size];
      $('#sizeMsg').innerHTML = st <= 2 ? `<p class="stock-msg" style="margin-top:8px">🔥 ¡Últimas ${st} unidades en talla ${size}!</p>` : '';
    });
    const add = (go) => {
      if (!size) {
        $('#sizes').classList.add('is-error');
        $('#sizeMsg').innerHTML = '<p class="size-msg">Selecciona una talla para continuar</p>';
        $('#sizes').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      addToCart(p, ci, size);
      if (go) { closeAll(); location.hash = '#/checkout'; }
    };
    $('#addBtn').onclick = () => add(false);
    $('#stickyAdd').onclick = () => add(false);
    $('#buyNow').onclick = () => add(true);
    $('#citySel').onchange = (e) => { store.set('mara_city', e.target.value); $('#eta').innerHTML = deliveryText(e.target.value); };
    $$('.acc > button').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('is-open'));
    $$('[data-zoom]').forEach((z) => z.onclick = () => openModal(`<div style="background:var(--soft);padding:20px">${media(p, ci, +z.dataset.zoom)}</div>`));

    // Dots galería móvil
    const g = $('#gallery');
    g.addEventListener('scroll', () => { const i = Math.round(g.scrollLeft / g.clientWidth); $$('#gdots i').forEach((d, k) => d.classList.toggle('is-on', k === i)); }, { passive: true });

    // Barra fija de compra en móvil
    const sb = $('#stickyBuy');
    const io = new IntersectionObserver(([e]) => { sb.classList.toggle('is-show', !e.isIntersecting && e.boundingClientRect.top < 0); document.body.classList.toggle('has-sticky', sb.classList.contains('is-show')); });
    io.observe($('#addBtn'));
    cleanup.push(() => { io.disconnect(); document.body.classList.remove('has-sticky'); const ld = $('#ld-product'); if (ld) ld.remove(); });
  }

  function quickView(p) {
    let ci = 0, size = null;
    const draw = () => {
      openModal(`<div class="qv">
        <div class="qv__media">${media(p, ci, 0)}</div>
        <div class="qv__info">
          <span class="buy__brand">${esc(p.brandName)}</span>
          <h2>${esc(p.name)}</h2>
          ${stars(p.rating, p.reviews)}
          ${priceHTML(p)}
          <div><div class="opt-label">Color <span>${p.colors[ci].name}</span></div>
            <div class="colors">${p.colors.map((x, i) => `<button class="${i === ci ? 'is-on' : ''}" data-qc="${i}" style="width:60px;height:60px" aria-label="${x.name}">${media(p, i, 0)}</button>`).join('')}</div></div>
          <div><div class="opt-label">Talla</div>
            <div class="sizes" id="qvSizes">${p.sizes.map((s) => `<button data-qs="${s}" class="${!p.stock[s] ? 'is-out' : ''} ${s === size ? 'is-on' : ''}">${s}</button>`).join('')}</div><div id="qvMsg"></div></div>
          <button class="btn btn--block" id="qvAdd">Agregar al carrito · ${fmt(p.price)}</button>
          <a class="link" href="#/p/${p.slug}" style="text-align:center">Ver todos los detalles</a>
        </div></div>`);
      $$('[data-qc]').forEach((b) => b.onclick = () => { ci = +b.dataset.qc; draw(); });
      $$('[data-qs]').forEach((b) => b.onclick = () => { size = b.dataset.qs; $$('[data-qs]').forEach((x) => x.classList.toggle('is-on', x === b)); });
      $('#qvAdd').onclick = () => {
        if (!size) { $('#qvSizes').classList.add('is-error'); $('#qvMsg').innerHTML = '<p class="size-msg">Selecciona una talla</p>'; return; }
        addToCart(p, ci, size);
      };
    };
    draw();
  }

  /* ---------------- CARRITO ---------------- */
  function renderCart() {
    const t = cartTotals();
    $('#cartDrawerCount').textContent = t.count ? `(${t.count})` : '';
    if (!cart.length) {
      $('#cartBody').innerHTML = `<div class="empty" style="padding:60px 0"><h3>Tu carrito está vacío</h3><p>Descubre los lanzamientos y lo más vendido.</p><a class="btn" href="#/tienda?sort=top" data-close>Comprar ahora</a></div>`;
      $('#cartFoot').innerHTML = '';
      return;
    }
    const missing = Math.max(0, FREE_SHIP - (t.sub - t.disc));
    const pct = Math.min(100, ((t.sub - t.disc) / FREE_SHIP) * 100);
    const inCart = new Set(cart.map((l) => l.id));
    const ups = PRODUCTS.filter((p) => p.cat === 'accesorios' && !inCart.has(p.id)).slice(0, 3);
    $('#cartBody').innerHTML = `
      <div class="ship-bar ${missing ? '' : 'is-done'}">${missing ? `Te faltan <b>${fmt(missing)}</b> para el <b>envío gratis</b> 🚚` : '🎉 ¡Tienes <b>envío gratis</b>!'}<div class="ship-bar__track"><i style="width:${pct}%"></i></div></div>
      ${cart.map((l, i) => {
        const p = byId(l.id); if (!p) return '';
        return `<div class="line">
          <a class="line__img" href="#/p/${p.slug}?c=${l.ci}" data-close>${media(p, l.ci, 0)}</a>
          <div>
            <div class="line__top"><b>${esc(p.brandName)} ${esc(p.name)}</b><b>${fmt(p.price * l.qty)}</b></div>
            <small>${p.colors[l.ci].name} · Talla ${l.size}</small>
            ${p.compareAt ? `<small style="color:var(--sale)">Antes ${fmt(p.compareAt)}</small>` : ''}
            <div class="line__bottom">
              <div class="qty"><button data-qty="${i}" data-d="-1" aria-label="Menos">−</button><span>${l.qty}</span><button data-qty="${i}" data-d="1" aria-label="Más">+</button></div>
              <button class="remove" data-rmline="${i}">Eliminar</button>
            </div>
          </div></div>`;
      }).join('')}
      ${t.savings ? `<p style="color:var(--ok);font-weight:600;font-size:14px;margin-top:14px">🎁 Estás ahorrando ${fmt(t.savings)} en esta compra</p>` : ''}
      ${ups.length ? `<div class="upsell"><h4>Agrega y completa tu compra</h4>${ups.map((p) => `<div class="upsell__row"><div class="thumb">${media(p, 0, 0)}</div><div><b style="font-size:14px">${esc(p.name)}</b><br><small style="color:var(--muted)">${fmt(p.price)}</small></div><button class="btn btn--ghost btn--sm" data-upsell="${p.id}">+ Agregar</button></div>`).join('')}</div>` : ''}`;
    $('#cartFoot').innerHTML = `
      <form class="coupon" id="couponForm"><input name="c" placeholder="Código de descuento" value="${esc(coupon)}" aria-label="Cupón"><button class="btn btn--dark btn--sm">Aplicar</button></form>
      ${t.couponMsg ? `<p class="size-msg" style="margin:-6px 0 10px">${t.couponMsg}</p>` : ''}
      <div class="totals">
        <div><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
        ${t.disc ? `<div class="disc"><span>Cupón ${esc(coupon)}</span><span>−${fmt(t.disc)}</span></div>` : ''}
        <div><span>Envío</span><span>${t.ship ? fmt(t.ship) : '<b style="color:var(--ok)">Gratis</b>'}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>
      <a class="btn btn--accent btn--block" href="#/checkout" id="goCheckout">Ir a pagar · ${fmt(t.total)}</a>
      <p class="secure">🔒 Pago 100% seguro · Addi · PSE · Nequi · Tarjetas</p>`;

    $$('[data-qty]').forEach((b) => b.onclick = () => { const l = cart[+b.dataset.qty]; l.qty = Math.max(1, Math.min(10, l.qty + +b.dataset.d)); saveCart(); renderCart(); });
    $$('[data-rmline]').forEach((b) => b.onclick = () => { cart.splice(+b.dataset.rmline, 1); saveCart(); renderCart(); });
    $$('[data-upsell]').forEach((b) => b.onclick = () => { const p = byId(b.dataset.upsell); cart.push({ id: p.id, ci: 0, size: p.sizes[0], qty: 1 }); saveCart(); renderCart(); toast('Agregado al carrito'); });
    $('#couponForm').onsubmit = (e) => {
      e.preventDefault();
      const v = e.target.c.value.trim().toUpperCase();
      if (!v) { coupon = ''; saveCart(); renderCart(); return; }
      if (COUPONS[v]) { coupon = v; saveCart(); renderCart(); toast(`Cupón ${v} aplicado ✓`); }
      else toast('Ese código no es válido');
    };
    $('#goCheckout').onclick = () => closeAll();
  }

  /* ---------------- CHECKOUT ---------------- */
  function viewCheckout() {
    if (!cart.length) return `<div class="container"><div class="empty"><h3>Tu carrito está vacío</h3><p>Agrega productos para continuar con tu compra.</p><a class="btn" href="#/tienda">Ir a la tienda</a></div></div>`;
    const t = cartTotals('std');
    const deps = Object.keys(CITIES);
    return `<div class="container">
      <nav class="crumbs"><a href="#/">Inicio</a> / <a href="#" data-open-cart>Carrito</a> / Pago seguro</nav>
      <div class="steps"><span class="is-done">1. Carrito</span><span class="is-on">2. Datos y envío</span><span>3. Pago</span><span>4. Confirmación</span></div>
      <form class="checkout" id="checkoutForm" novalidate>
        <div>
          <div class="form-block">
            <h3><i>1</i> Tus datos</h3>
            <div class="fields">
              <div class="field full"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="nombre@correo.com"><span class="err">Ingresa un correo válido</span></div>
              <div class="field"><label for="fname">Nombres</label><input id="fname" name="fname" autocomplete="given-name" required><span class="err">Campo obligatorio</span></div>
              <div class="field"><label for="lname">Apellidos</label><input id="lname" name="lname" autocomplete="family-name" required><span class="err">Campo obligatorio</span></div>
              <div class="field"><label for="doctype">Tipo de documento</label><select id="doctype" name="doctype"><option>Cédula de ciudadanía</option><option>Cédula de extranjería</option><option>NIT</option><option>Pasaporte</option></select></div>
              <div class="field"><label for="doc">Número de documento</label><input id="doc" name="doc" inputmode="numeric" required pattern="[0-9]{5,12}"><span class="err">Documento inválido</span></div>
              <div class="field full"><label for="phone">Celular</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required pattern="3[0-9]{9}" placeholder="3001234567"><span class="err">Ingresa un celular de 10 dígitos que empiece por 3</span></div>
            </div>
          </div>

          <div class="form-block">
            <h3><i>2</i> Entrega</h3>
            <div class="fields">
              <div class="field"><label for="dep">Departamento</label><select id="dep" name="dep" required><option value="">Selecciona</option>${deps.map((d) => `<option>${d}</option>`).join('')}</select><span class="err">Selecciona un departamento</span></div>
              <div class="field"><label for="city">Ciudad / Municipio</label><select id="city" name="city" required><option value="">Selecciona</option></select><span class="err">Selecciona una ciudad</span></div>
              <div class="field full"><label for="addr">Dirección</label><input id="addr" name="addr" autocomplete="street-address" required placeholder="Ej: Calle 100 # 15-20"><span class="err">Ingresa tu dirección</span></div>
              <div class="field full"><label for="addr2">Apto, torre, barrio (opcional)</label><input id="addr2" name="addr2" placeholder="Ej: Torre 2 Apto 501, Chicó"></div>
            </div>
            <div style="margin-top:18px" id="shipOpts">
              <label class="radio-card"><input type="radio" name="ship" value="std" checked><div><b>Envío estándar</b><small>2 a 5 días hábiles · Servientrega / Coordinadora</small></div><b id="shipStdPrice">${t.ship ? fmt(t.ship) : 'Gratis'}</b></label>
              <label class="radio-card"><input type="radio" name="ship" value="express"><div><b>Express 24 horas</b><small>Bogotá, Medellín, Cali, Barranquilla y área metropolitana</small></div><b>${fmt(SHIP_EXP)}</b></label>
              <label class="radio-card"><input type="radio" name="ship" value="tienda"><div><b>Recoger en tienda</b><small>Listo en 2 horas · ${STORES.length} tiendas</small></div><b style="color:var(--ok)">Gratis</b></label>
            </div>
          </div>

          <div class="form-block">
            <h3><i>3</i> Pago</h3>
            ${[
              ['card', 'Tarjeta crédito o débito', 'Visa, Mastercard, American Express, Diners · Hasta 36 cuotas', 'VISA · MC'],
              ['pse', 'PSE', 'Débito desde tu cuenta de ahorros o corriente', 'PSE'],
              ['addi', 'Addi', 'Compra ahora y paga en 3 cuotas sin interés', 'addi'],
              ['nequi', 'Nequi', 'Recibe una notificación en tu app para aprobar', 'Nequi'],
              ['davi', 'Daviplata', 'Paga con tu celular', 'Daviplata'],
              ['efecty', 'Efecty / Baloto', 'Paga en efectivo en más de 10.000 puntos', 'Efectivo'],
              ['cod', 'Pago contraentrega', 'Paga en efectivo al recibir (ciudades principales)', 'COD']
            ].map(([v, n, d, b], i) => `<label class="radio-card"><input type="radio" name="pay" value="${v}" ${i === 0 ? 'checked' : ''}><div><b>${n}</b><small>${d}</small></div><span class="pm">${b}</span></label>`).join('')}
            <div id="payExtra" style="margin-top:14px"></div>
          </div>

          <div class="form-block">
            <label class="check" style="margin-bottom:10px"><input type="checkbox" name="invoice"> Necesito factura electrónica a nombre de empresa</label>
            <label class="check" style="margin-bottom:10px"><input type="checkbox" name="news" checked> Quiero recibir novedades y ofertas exclusivas</label>
            <div class="field" id="termsField"><label class="check" style="font-weight:400"><input type="checkbox" name="terms" required> Acepto los <a class="link" href="#/info/terminos" target="_blank">términos y condiciones</a> y autorizo el <a class="link" href="#/info/privacidad" target="_blank">tratamiento de mis datos personales</a> (Ley 1581 de 2012).</label><span class="err">Debes aceptar para continuar</span></div>
          </div>
        </div>

        <aside class="summary">
          <h3>Resumen del pedido</h3>
          ${cart.map((l) => { const p = byId(l.id); return p ? `<div class="line"><div class="line__img">${media(p, l.ci, 0)}<i>${l.qty}</i></div><div><div class="line__top"><b>${esc(p.brandName)} ${esc(p.name)}</b><b>${fmt(p.price * l.qty)}</b></div><small>${p.colors[l.ci].name} · Talla ${l.size}</small></div></div>` : ''; }).join('')}
          <div class="coupon" style="margin-top:16px"><input id="ckCoupon" placeholder="Código de descuento" value="${esc(coupon)}"><button type="button" class="btn btn--dark btn--sm" id="ckCouponBtn">Aplicar</button></div>
          <div class="totals" id="ckTotals"></div>
          <button class="btn btn--accent btn--block" style="height:58px;font-size:16px" id="payBtn">Pagar ahora</button>
          <p class="secure">🔒 Transacción cifrada SSL · Pasarela certificada PCI DSS</p>
          <p class="legal-note">Al realizar tu compra tienes derecho de retracto dentro de los 5 días hábiles siguientes a la entrega (Ley 1480 de 2011).</p>
        </aside>
      </form>
    </div>`;
  }

  function initCheckout() {
    const f = $('#checkoutForm'); if (!f) return;
    track('begin_checkout', cart.map((l) => ({ p: byId(l.id), qty: l.qty, color: byId(l.id).colors[l.ci].name })), { value: cartTotals().total });
    const saved = store.get('mara_customer', null);
    if (saved) Object.entries(saved).forEach(([k, v]) => { if (f.elements[k] && f.elements[k].type !== 'checkbox') f.elements[k].value = v; });
    const fillCities = () => { const d = f.dep.value; f.city.innerHTML = '<option value="">Selecciona</option>' + (CITIES[d] || []).map((c) => `<option>${c}</option>`).join(''); };
    f.dep.onchange = () => { fillCities(); refresh(); };
    if (saved && saved.dep) { fillCities(); f.city.value = saved.city || ''; }
    f.city.onchange = refresh;

    function refresh() {
      const ship = f.ship.value;
      const t = cartTotals(ship);
      const city = f.city.value;
      const expressOk = !city || MAIN_CITIES.includes(city);
      const exp = $('input[value=express]', f); exp.disabled = !expressOk; exp.closest('.radio-card').style.opacity = expressOk ? 1 : .45;
      if (!expressOk && ship === 'express') { $('input[value=std]', f).checked = true; return refresh(); }
      const cod = $('input[value=cod]', f); const codOk = !city || MAIN_CITIES.includes(city); cod.disabled = !codOk; cod.closest('.radio-card').style.opacity = codOk ? 1 : .45;
      if (!codOk && f.pay.value === 'cod') $('input[value=card]', f).checked = true;
      $('#shipStdPrice').innerHTML = cartTotals('std').ship ? fmt(cartTotals('std').ship) : '<span style="color:var(--ok)">Gratis</span>';
      $('#ckTotals').innerHTML = `
        <div><span>Subtotal (${t.count} productos)</span><span>${fmt(t.sub)}</span></div>
        ${t.savings ? `<div class="disc"><span>Ahorro en productos</span><span>${fmt(t.savings)}</span></div>` : ''}
        ${t.disc ? `<div class="disc"><span>Cupón ${esc(coupon)}</span><span>−${fmt(t.disc)}</span></div>` : ''}
        ${t.couponMsg ? `<div style="color:var(--sale);font-size:13px">${t.couponMsg}</div>` : ''}
        <div><span>Envío</span><span>${t.ship ? fmt(t.ship) : '<b style="color:var(--ok)">Gratis</b>'}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(t.total)}</span></div>
        <div style="font-size:12px;color:var(--muted)"><span>IVA incluido</span></div>`;
      $('#payBtn').textContent = `Pagar ${fmt(t.total)}`;
      payExtra();
    }
    function payExtra() {
      const v = f.pay.value, t = cartTotals(f.ship.value);
      const el = $('#payExtra');
      if (v === 'card') el.innerHTML = `<div class="fields"><div class="field full"><label>Número de tarjeta</label><input inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19" data-cc></div><div class="field"><label>Vencimiento</label><input placeholder="MM/AA" maxlength="5"></div><div class="field"><label>CVV</label><input inputmode="numeric" placeholder="123" maxlength="4"></div><div class="field full"><label>Cuotas</label><select>${[1, 3, 6, 12, 24, 36].map((n) => `<option>${n} cuota${n > 1 ? 's' : ''}</option>`).join('')}</select></div></div><p class="legal-note">Demo: en producción estos campos los provee la pasarela (Wompi, ePayco, Mercado Pago o PayU) para cumplir PCI DSS.</p>`;
      else if (v === 'pse') el.innerHTML = `<div class="field"><label>Banco</label><select>${['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'Scotiabank Colpatria', 'Banco AV Villas', 'Banco Caja Social', 'Itaú', 'Nu Colombia', 'Lulo Bank'].map((b) => `<option>${b}</option>`).join('')}</select></div><p class="legal-note">Serás redirigido a tu banco para completar el pago.</p>`;
      else if (v === 'addi') el.innerHTML = `<div class="buy__cuotas"><span class="addi">addi</span><span>3 cuotas de <b>${fmt(t.total / 3)}</b> · Aprobación en minutos solo con tu cédula y WhatsApp.</span></div>`;
      else if (v === 'nequi' || v === 'davi') el.innerHTML = `<div class="field"><label>Número de celular ${v === 'nequi' ? 'Nequi' : 'Daviplata'}</label><input type="tel" placeholder="3001234567" value="${esc(f.phone.value)}"></div>`;
      else if (v === 'efecty') el.innerHTML = `<p class="legal-note">Generaremos un código de pago válido por 48 horas. Tu pedido se despacha al confirmar el pago.</p>`;
      else el.innerHTML = `<p class="legal-note">Te confirmaremos el pedido por WhatsApp antes del despacho. Ten el valor exacto: ${fmt(t.total)}.</p>`;
      const cc = $('[data-cc]'); if (cc) cc.oninput = () => { cc.value = cc.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); };
    }
    $$('input[name=ship]', f).forEach((r) => r.onchange = refresh);
    $$('input[name=pay]', f).forEach((r) => r.onchange = () => { payExtra(); track('add_payment_info', [], { payment_type: f.pay.value }); });
    $('#ckCouponBtn').onclick = () => {
      const v = $('#ckCoupon').value.trim().toUpperCase();
      if (!v) { coupon = ''; saveCart(); refresh(); return; }
      if (COUPONS[v]) { coupon = v; saveCart(); refresh(); toast(`Cupón ${v} aplicado ✓`); } else toast('Ese código no es válido');
    };
    refresh();

    // Validación en vivo
    $$('input, select', f).forEach((i) => i.addEventListener('blur', () => { const fl = i.closest('.field'); if (fl && i.required) fl.classList.toggle('is-error', !i.checkValidity()); }));

    f.onsubmit = (e) => {
      e.preventDefault();
      let first = null;
      $$('[required]', f).forEach((i) => {
        const fl = i.closest('.field'); const ok = i.checkValidity();
        if (fl) fl.classList.toggle('is-error', !ok);
        if (!ok && !first) first = i;
      });
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); toast('Revisa los campos marcados'); return; }
      const btn = $('#payBtn'); btn.disabled = true; btn.textContent = 'Procesando pago seguro…';
      const t = cartTotals(f.ship.value);
      const id = 'MS-' + Date.now().toString().slice(-7);
      const order = {
        id, date: Date.now(), email: f.email.value.trim().toLowerCase(), name: f.fname.value + ' ' + f.lname.value,
        city: f.city.value, dep: f.dep.value, addr: f.addr.value + (f.addr2.value ? ', ' + f.addr2.value : ''),
        ship: f.ship.value, pay: f.pay.value, items: cart.slice(), totals: t, coupon
      };
      store.set('mara_customer', { email: f.email.value, fname: f.fname.value, lname: f.lname.value, doctype: f.doctype.value, doc: f.doc.value, phone: f.phone.value, dep: f.dep.value, city: f.city.value, addr: f.addr.value, addr2: f.addr2.value });
      setTimeout(() => {
        const orders = store.get('mara_orders', []); orders.unshift(order); store.set('mara_orders', orders.slice(0, 20));
        track('purchase', order.items.map((l) => ({ p: byId(l.id), qty: l.qty, color: byId(l.id).colors[l.ci].name })), { transaction_id: id, value: t.total, shipping: t.ship, coupon: coupon || undefined });
        cart = []; coupon = ''; saveCart(); renderCart();
        location.hash = '#/gracias/' + id;
      }, 1400);
    };
  }

  function viewThanks(id) {
    const o = store.get('mara_orders', []).find((x) => x.id === id);
    if (!o) return `<div class="container"><div class="empty"><h3>Pedido no encontrado</h3><a class="btn" href="#/">Volver al inicio</a></div></div>`;
    const payN = { card: 'Tarjeta', pse: 'PSE', addi: 'Addi', nequi: 'Nequi', davi: 'Daviplata', efecty: 'Efecty', cod: 'Contraentrega' }[o.pay];
    const shipN = { std: 'Envío estándar', express: 'Express 24h', tienda: 'Recoger en tienda' }[o.ship];
    return `<div class="container"><div class="thanks">
      <div class="ok">✓</div>
      <h1>¡Gracias, ${esc(o.name.split(' ')[0])}!</h1>
      <p>Tu pedido <b style="color:var(--ink)">${o.id}</b> fue recibido. Te enviamos la confirmación a <b style="color:var(--ink)">${esc(o.email)}</b> y te avisaremos por WhatsApp cada vez que cambie de estado.</p>
      <div class="timeline"><div class="is-on">Recibido</div><div>Preparando</div><div>En camino</div><div>Entregado</div></div>
      <div class="order-box">
        ${o.items.map((l) => { const p = byId(l.id); return p ? `<div style="display:flex;justify-content:space-between;gap:10px"><span>${l.qty} × ${esc(p.brandName)} ${esc(p.name)} <small style="color:var(--muted)">(${p.colors[l.ci].name}, T. ${l.size})</small></span><b>${fmt(p.price * l.qty)}</b></div>` : ''; }).join('')}
        <hr style="border:0;border-top:1px solid var(--line);width:100%">
        <div style="display:flex;justify-content:space-between"><span>Entrega</span><span>${shipN} · ${esc(o.city)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Pago</span><span>${payN}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:18px"><span>Total</span><span>${fmt(o.totals.total)}</span></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn" href="#/rastreo?id=${o.id}">Rastrear pedido</a>
        <a class="btn btn--ghost" href="#/tienda">Seguir comprando</a>
      </div>
    </div></div>`;
  }

  /* ---------------- Otras páginas ---------------- */
  function viewWish() {
    const list = wish.map(byId).filter(Boolean);
    return `<div class="container"><nav class="crumbs"><a href="#/">Inicio</a> / Favoritos</nav>
      <div class="plp-head"><h1>Mis favoritos <small>${list.length} productos</small></h1></div>
      ${list.length ? `<div class="grid" style="padding-bottom:64px">${list.map(card).join('')}</div>` : `<div class="empty"><h3>Aún no tienes favoritos</h3><p>Toca el ♡ en cualquier producto para guardarlo aquí.</p><a class="btn" href="#/tienda">Explorar la tienda</a></div>`}
    </div>`;
  }

  function viewTrack(q) {
    const o = q.id ? store.get('mara_orders', []).find((x) => x.id === q.id.toUpperCase()) : null;
    let res = '';
    if (q.id && o) {
      const hrs = (Date.now() - o.date) / 3.6e6;
      const st = hrs > 48 ? 3 : hrs > 6 ? 2 : hrs > 0.05 ? 1 : 0;
      res = `<div class="order-box"><b>Pedido ${o.id}</b><span>Destino: ${esc(o.city)}, ${esc(o.dep)}</span>
        <div class="timeline">${['Recibido', 'Preparando', 'En camino', 'Entregado'].map((s, i) => `<div class="${i <= st ? 'is-on' : ''}">${s}</div>`).join('')}</div></div>`;
    } else if (q.id) res = `<p class="size-msg" style="margin-top:14px">No encontramos el pedido ${esc(q.id)}. Verifica el número o escríbenos por WhatsApp.</p>`;
    return `<div class="container"><div class="page">
      <h1>Rastrea tu pedido</h1>
      <p>Ingresa el número de pedido que recibiste en tu correo (ej. MS-1234567).</p>
      <form id="trackForm" class="coupon" style="max-width:520px;margin-top:18px"><input name="id" placeholder="Número de pedido" value="${esc(q.id || '')}" required><button class="btn btn--dark btn--sm">Consultar</button></form>
      ${res}
    </div></div>`;
  }

  function viewStores() {
    return `<div class="container"><div class="page" style="max-width:1000px">
      <h1>Nuestras tiendas</h1><p>Visítanos para análisis de pisada gratis, cambios de talla y recoger tus pedidos online.</p>
      <div class="stores" style="margin-top:24px">${STORES.map((s) => `<div class="store"><span class="eyebrow">${s.city}</span><h3>${s.name}</h3><p>${s.addr}</p><p>${s.hours}</p><a class="link" href="https://maps.google.com/?q=${encodeURIComponent(s.addr + ', ' + s.city)}" target="_blank" rel="noopener">Cómo llegar →</a></div>`).join('')}</div>
    </div></div>`;
  }

  function viewBrands() {
    return `<div class="container"><div class="page" style="max-width:1100px">
      <h1>Marcas</h1><p>Somos distribuidores autorizados. Todos nuestros productos son 100% originales.</p>
      <div class="brands" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-top:24px">${BRANDS.map((b) => `<a class="brand-tile" style="height:140px" href="#/tienda?brand=${b.id}">${b.name}<br><small style="font-family:var(--body);font-size:12px;font-style:normal;font-weight:500;color:var(--muted)">${PRODUCTS.filter((p) => p.brand === b.id).length} productos</small></a>`).join('')}</div>
    </div></div>`;
  }

  const INFO = {
    cambios: ['Cambios y devoluciones', `<p>Tienes <b>30 días calendario</b> desde que recibes tu pedido para solicitar un cambio de talla o referencia, sin costo, siempre que el producto esté sin uso, con etiquetas y en su empaque original.</p>
      <h2>¿Cómo hacer un cambio?</h2><ol><li>Escríbenos por WhatsApp o radica una solicitud en PQRS con tu número de pedido.</li><li>Te enviamos la guía de recolección o puedes acercarte a cualquiera de nuestras tiendas.</li><li>Al recibir el producto, despachamos el cambio en máximo 3 días hábiles.</li></ol>
      <h2>Garantía</h2><p>Todos los productos tienen la garantía legal establecida en la Ley 1480 de 2011 (Estatuto del Consumidor).</p>`],
    envios: ['Envíos', `<p>Enviamos a toda Colombia. Envío <b>gratis</b> en compras desde ${fmt(FREE_SHIP)}; por debajo de ese valor el costo es de ${fmt(SHIP_STD)}.</p>
      <table><tr><th>Destino</th><th>Tiempo</th></tr><tr><td>Bogotá, Medellín, Cali, Barranquilla y áreas metropolitanas</td><td>1 a 2 días hábiles</td></tr><tr><td>Ciudades intermedias</td><td>2 a 4 días hábiles</td></tr><tr><td>Municipios y zonas rurales</td><td>3 a 7 días hábiles</td></tr></table>
      <p>Envío Express 24 horas disponible en ciudades principales por ${fmt(SHIP_EXP)}.</p>`],
    tallas: ['Guía de tallas', sizeTable()],
    pagos: ['Medios de pago', `<p>Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express, Diners), PSE, Nequi, Daviplata, Addi (3 cuotas sin interés en tu primera compra), Efecty y pago contraentrega en ciudades principales.</p><p>Todos los pagos se procesan a través de una pasarela certificada PCI DSS. MARA Sport nunca almacena los datos de tu tarjeta.</p>`],
    terminos: ['Términos y condiciones', `<p>Estos términos regulan el uso del sitio y las compras realizadas en MARA Sport S.A.S. Los precios incluyen IVA y están expresados en pesos colombianos (COP). Las promociones son válidas hasta agotar existencias y no son acumulables salvo indicación expresa.</p><p><i>Plantilla de referencia: revísala con tu asesor legal antes de publicar.</i></p>`],
    privacidad: ['Política de tratamiento de datos', `<p>En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, MARA Sport S.A.S. informa que los datos personales recolectados serán tratados para gestionar compras, envíos, facturación, atención al cliente y, con tu autorización, envío de comunicaciones comerciales.</p><p>Como titular puedes conocer, actualizar, rectificar y suprimir tus datos escribiendo a datos@marasport.co.</p><p><i>Plantilla de referencia: revísala con tu asesor legal antes de publicar.</i></p>`],
    retracto: ['Derecho de retracto', `<p>De acuerdo con el artículo 47 de la Ley 1480 de 2011, en las compras realizadas por medios no tradicionales o a distancia puedes ejercer el derecho de retracto dentro de los <b>5 días hábiles</b> siguientes a la entrega del producto. Te devolveremos el dinero dentro de los 30 días calendario siguientes.</p><a class="btn" href="https://wa.me/${WHATSAPP}?text=Quiero%20ejercer%20mi%20derecho%20de%20retracto" target="_blank" rel="noopener">Solicitar retracto</a>`],
    reversion: ['Reversión del pago', `<p>Conforme al artículo 51 de la Ley 1480 de 2011 y el Decreto 587 de 2016, puedes solicitar la reversión del pago cuando seas víctima de fraude, la operación no haya sido solicitada, el producto no haya sido recibido o no corresponda a lo solicitado o sea defectuoso. Debes presentar la queja dentro de los 5 días hábiles siguientes.</p>`],
    pqrs: ['PQRS', `<p>Radica tus peticiones, quejas, reclamos o sugerencias. Te responderemos en máximo 15 días hábiles.</p>
      <form id="pqrsForm" class="fields" style="margin-top:18px"><div class="field"><label>Nombre</label><input required></div><div class="field"><label>Correo</label><input type="email" required></div><div class="field"><label>Tipo</label><select><option>Petición</option><option>Queja</option><option>Reclamo</option><option>Sugerencia</option></select></div><div class="field"><label>Nº de pedido (opcional)</label><input></div><div class="field full"><label>Mensaje</label><textarea required rows="5" style="border:1.5px solid var(--line);border-radius:10px;padding:12px"></textarea></div><div class="full"><button class="btn">Enviar</button></div></form>`]
  };

  function sizeTable() {
    const rows = [['35', '5', '4', '22.5'], ['36', '6', '5', '23'], ['37', '7', '6', '23.5'], ['38', '7.5', '6.5', '24'], ['39', '8', '7', '25'], ['40', '8.5', '7.5', '25.5'], ['41', '9', '8', '26'], ['42', '9.5', '8.5', '27'], ['43', '10', '9', '27.5'], ['44', '11', '10', '28.5']];
    return `<p>Mide tu pie desde el talón hasta el dedo más largo y compara con la tabla. Si estás entre dos tallas, elige la mayor.</p>
      <table><tr><th>CO / EU</th><th>US Hombre</th><th>US Mujer</th><th>CM</th></tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>
      <h2>Ropa</h2><table><tr><th>Talla</th><th>Pecho (cm)</th><th>Cintura (cm)</th></tr>${[['XS', '82-87', '66-71'], ['S', '88-94', '72-78'], ['M', '95-102', '79-86'], ['L', '103-111', '87-95'], ['XL', '112-121', '96-106'], ['XXL', '122-132', '107-118']].map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  }

  function viewInfo(k) {
    const i = INFO[k];
    if (!i) return view404();
    return `<div class="container"><nav class="crumbs"><a href="#/">Inicio</a> / ${i[0]}</nav><div class="page"><h1>${i[0]}</h1>${i[1]}</div></div>`;
  }
  function view404() { return `<div class="container"><div class="empty"><h3>Página no encontrada</h3><p>El enlace que seguiste no existe.</p><a class="btn" href="#/">Ir al inicio</a></div></div>`; }

  /* ---------------- Búsqueda ---------------- */
  function initSearch() {
    const input = $('#searchInput'), panel = $('#searchPanel');
    let focusIdx = -1;
    const trending = ['Samba', 'Novablast', 'Clifton', 'Leggings', 'Running mujer', 'Guayos'];
    const show = () => {
      const v = input.value.trim();
      focusIdx = -1;
      if (!v) {
        const seen = store.get('mara_seen', []).map(byId).filter(Boolean).slice(0, 3);
        panel.innerHTML = `<h5>Búsquedas populares</h5><div class="search__chips">${trending.map((t) => `<a class="chip" href="#/tienda?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div>
          ${seen.length ? `<h5>Vistos recientemente</h5>${seen.map(hit).join('')}` : ''}`;
      } else {
        const hits = PRODUCTS.filter((p) => matches(p, { q: v })).slice(0, 6);
        const brands = BRANDS.filter((b) => norm(b.name).includes(norm(v)));
        const sports = SPORTS.filter((s) => norm(s.name).includes(norm(v)));
        panel.innerHTML = `${brands.length || sports.length ? `<div class="search__chips">${brands.map((b) => `<a class="chip" href="#/tienda?brand=${b.id}">Marca: ${b.name}</a>`).join('')}${sports.map((s) => `<a class="chip" href="#/tienda?sport=${s.id}">${s.name}</a>`).join('')}</div>` : ''}
          ${hits.length ? `<h5>Productos</h5>${hits.map(hit).join('')}<a class="search__all" href="#/tienda?q=${encodeURIComponent(v)}">Ver todos los resultados para “${esc(v)}” →</a>` : `<p style="padding:10px;color:var(--muted)">Sin resultados para “${esc(v)}”. Prueba con otra palabra.</p>`}`;
      }
      panel.hidden = false;
    };
    const hit = (p) => `<a class="search__hit" href="#/p/${p.slug}"><div class="thumb">${media(p, 0, 0)}</div><div><b style="font-size:14px">${esc(p.name)}</b><small>${esc(p.brandName)} · ${catName(p.cat)}</small></div><b style="font-size:14px">${fmt(p.price)}</b></a>`;
    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    input.addEventListener('keydown', (e) => {
      const items = $$('.search__hit', panel);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); focusIdx = Math.max(-1, Math.min(items.length - 1, focusIdx + (e.key === 'ArrowDown' ? 1 : -1)));
        items.forEach((it, i) => it.classList.toggle('is-focus', i === focusIdx));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusIdx > -1 && items[focusIdx]) location.hash = items[focusIdx].getAttribute('href');
        else if (input.value.trim()) setQuery({ q: input.value.trim() });
        panel.hidden = true; input.blur();
      } else if (e.key === 'Escape') { panel.hidden = true; input.blur(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#search')) panel.hidden = true; });
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) { panel.hidden = true; input.value = ''; } });
  }

  /* ---------------- Router ---------------- */
  let cleanup = [];
  let lastPath = null;
  function render(keepScroll) {
    cleanup.forEach((fn) => fn()); cleanup = [];
    clearInterval(heroTimer);
    const h = location.hash.slice(1) || '/';
    const [path, qs] = h.split('?');
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    const seg = path.split('/').filter(Boolean);
    const app = $('#app');
    let html, init;
    document.title = 'MARA Sport · Tenis y ropa deportiva multimarca en Colombia';

    if (!seg.length) { html = viewHome(); init = initHome; }
    else if (seg[0] === 'tienda') { html = viewPLP(q); init = () => initPLP(q); document.title = `${plpTitle(q).replace(/&[^;]+;|“|”/g, '')} · MARA Sport`; }
    else if (seg[0] === 'p') {
      const p = bySlug(seg[1]);
      if (p) { html = viewPDP(p, q); init = () => initPDP(p, q); } else html = view404();
    }
    else if (seg[0] === 'checkout') { html = viewCheckout(); init = initCheckout; document.title = 'Pago seguro · MARA Sport'; }
    else if (seg[0] === 'gracias') { html = viewThanks(seg[1]); }
    else if (seg[0] === 'favoritos') { html = viewWish(); }
    else if (seg[0] === 'rastreo') { html = viewTrack(q); init = () => { $('#trackForm').onsubmit = (e) => { e.preventDefault(); location.hash = '#/rastreo?id=' + encodeURIComponent(e.target.id.value.trim()); }; }; }
    else if (seg[0] === 'tiendas') { html = viewStores(); }
    else if (seg[0] === 'marcas') { html = viewBrands(); }
    else if (seg[0] === 'info') { html = viewInfo(seg[1]); init = () => { const f = $('#pqrsForm'); if (f) f.onsubmit = (e) => { e.preventDefault(); f.innerHTML = '<p class="full"><b>✓ Solicitud radicada.</b> Número de radicado: PQ-' + Date.now().toString().slice(-6) + '. Te responderemos a tu correo.</p>'; }; }; }
    else html = view404();

    app.innerHTML = html;
    if (init) init();

    // Navegación activa
    $$('#mainnav .nav-item > a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + h));
    if (!keepScroll && path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
    if (!$('.drawer.is-open') && !$('.modal.is-open') && !filtersOpen) { $('#overlay').classList.remove('is-open'); document.body.classList.remove('lock'); }
  }

  /* ---------------- Eventos globales ---------------- */
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const w = t.closest('[data-wish]'); if (w) { e.preventDefault(); toggleWish(w.dataset.wish); return; }
      const qv = t.closest('[data-quick]'); if (qv) { e.preventDefault(); quickView(byId(qv.dataset.quick)); return; }
      const rl = t.closest('[data-rail]'); if (rl) { const tr = $('#' + rl.dataset.rail); tr.scrollBy({ left: tr.clientWidth * 0.9 * +rl.dataset.dir, behavior: 'smooth' }); return; }
      const cl = t.closest('[data-close]'); if (cl) { closeAll(); return; }
      if (t.closest('[data-open-cart]')) { e.preventDefault(); renderCart(); openDrawer('#cartDrawer'); return; }
      const op = t.closest('[data-open]');
      if (op) {
        e.preventDefault();
        const k = op.dataset.open;
        if (k === 'sizeguide') openModal(`<div class="page" style="padding:32px">${'<h1>Guía de tallas</h1>' + sizeTable()}</div>`);
        if (k === 'login') openModal(`<div style="padding:36px;display:grid;gap:14px"><h2 style="font-size:40px;font-style:italic">Ingresa a tu cuenta</h2><p style="color:var(--muted)">Guarda tus datos, sigue tus pedidos y accede a beneficios del MARA Club.</p>
            <button class="btn btn--ghost btn--block">Continuar con Google</button>
            <form id="loginForm" style="display:grid;gap:10px"><div class="field"><label>Correo</label><input type="email" required></div><div class="field"><label>Contraseña</label><input type="password" required minlength="6"></div><button class="btn btn--block">Ingresar</button></form>
            <p style="font-size:13px;text-align:center">¿No tienes cuenta? <a class="link" href="#">Regístrate y obtén 10% OFF</a></p></div>`, true);
        if (k === 'review') openModal(`<div style="padding:36px;display:grid;gap:14px"><h2 style="font-size:36px;font-style:italic">Escribe tu opinión</h2><form id="revForm" style="display:grid;gap:10px"><div class="field"><label>Calificación</label><select><option>★★★★★ Excelente</option><option>★★★★ Muy bueno</option><option>★★★ Bueno</option><option>★★ Regular</option><option>★ Malo</option></select></div><div class="field"><label>Título</label><input required></div><div class="field"><label>Opinión</label><textarea required rows="4" style="border:1.5px solid var(--line);border-radius:10px;padding:12px"></textarea></div><button class="btn btn--block">Publicar</button></form></div>`, true);
        const lf = $('#loginForm'); if (lf) lf.onsubmit = (ev) => { ev.preventDefault(); closeAll(); toast('¡Bienvenido de vuelta! 👋'); };
        const rf = $('#revForm'); if (rf) rf.onsubmit = (ev) => { ev.preventDefault(); closeAll(); toast('¡Gracias! Tu opinión será publicada tras moderación.'); };
        return;
      }
      if (t.closest('.mm-section > button')) { t.closest('.mm-section').classList.toggle('is-open'); return; }
      if (t.closest('#mobileMenu a')) closeAll();
    });

    // Cambio de color al pasar por los swatches de la tarjeta
    document.addEventListener('mouseover', (e) => {
      const sw = e.target.closest('.card [data-sw]'); if (!sw) return;
      const cardEl = sw.closest('.card'); const p = byId(cardEl.dataset.card); const i = +sw.dataset.sw;
      $('.main', cardEl).innerHTML = media(p, i, 0); $('.alt', cardEl).innerHTML = media(p, i, 3);
      $$('[data-sw]', cardEl).forEach((x) => x.classList.toggle('is-on', x === sw));
      $$('a[href^="#/p/"]', cardEl).forEach((a) => a.setAttribute('href', `#/p/${p.slug}?c=${i}`));
    });
    document.addEventListener('click', (e) => { const sw = e.target.closest('.card [data-sw]'); if (sw) sw.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });

    document.addEventListener('submit', (e) => {
      if (e.target.matches('[data-newsletter]')) {
        e.preventDefault();
        track('generate_lead', [], { lead_source: 'newsletter' });
        e.target.innerHTML = `<p style="padding:8px 14px;color:var(--ink);font-weight:600">🎉 ¡Listo! Usa el código <b>BIENVENIDO10</b></p>`;
        store.set('mara_welcome', 1);
      }
    });

    $('#overlay').onclick = () => closeAll();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
    $('#cartBtn').onclick = () => { renderCart(); openDrawer('#cartDrawer'); };
    $('#burger').onclick = () => openDrawer('#mobileMenu');
    window.addEventListener('hashchange', () => { closeAll(); render(); });
    window.addEventListener('scroll', () => $('#header').classList.toggle('is-scrolled', window.scrollY > 10), { passive: true });

    // Barra de anuncios rotativa
    const msgs = $$('#announceTrack p'); let ai = 0;
    const rot = (d) => { msgs[ai].classList.remove('is-active'); ai = (ai + d + msgs.length) % msgs.length; msgs.forEach((m) => m.classList.remove('is-out')); msgs[ai].classList.add('is-active'); };
    let at = setInterval(() => rot(1), 4500);
    $$('[data-announce]').forEach((b) => b.onclick = () => { clearInterval(at); rot(+b.dataset.announce); at = setInterval(() => rot(1), 4500); });

    // Cookies
    if (!store.get('mara_cookies', 0)) $('#cookies').hidden = false;
    $('#cookiesOk').onclick = () => { store.set('mara_cookies', 1); $('#cookies').hidden = true; };

    // Popup de bienvenida (primera visita, 9 s)
    if (!store.get('mara_welcome', 0)) {
      setTimeout(() => {
        if ($('.modal.is-open') || $('.drawer.is-open') || location.hash.startsWith('#/checkout')) return;
        store.set('mara_welcome', 1);
        const p = PRODUCTS[4];
        openModal(`<div class="welcome"><div class="welcome__art"><b>10%<br>OFF</b>${media(p, 0, 0)}</div>
          <div class="welcome__body"><span class="eyebrow">Bienvenido a MARA Club</span><h2>Tu primera compra con 10% OFF</h2><p style="color:var(--muted)">Suscríbete y recibe tu código al instante, además de acceso anticipado a lanzamientos.</p>
          <form class="newsletter" data-newsletter><input type="email" required placeholder="Tu correo" aria-label="Correo"><button class="btn btn--accent">Obtener</button></form>
          <button class="link" data-close style="font-size:13px;color:var(--muted)">No gracias, prefiero pagar precio completo</button></div></div>`);
      }, 9000);
    }
    $('#year').textContent = new Date().getFullYear();
  }

  renderNav();
  bindGlobal();
  initSearch();
  updateBadges();
  renderCart();
  render();
})();
