/* =========================================================================
   MARA Sport · Ilustraciones de producto en SVG
   Placeholders vectoriales que se ven nítidos en cualquier pantalla.
   En producción, reemplázalos con fotos reales: en data.js cada color
   acepta la propiedad `img: ['url1.webp','url2.webp', ...]`.
   ========================================================================= */
(function () {
  let uid = 0;

  // Aclara / oscurece un color hex
  function shade(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function defs(id) {
    return `<defs>
      <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".28"/>
        <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".16"/>
      </linearGradient>
      <radialGradient id="sh${id}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#000" stop-opacity=".28"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
  }

  /* ---------- Tenis tipo running (amortiguación alta) ---------- */
  function runner(c, id) {
    const laces = Array.from({ length: 6 }, (_, i) => {
      const x = 186 + i * 13, y = 78 + i * 6.2;
      return `<path d="M${x} ${y} l9 -7" stroke="${c.lace || '#fff'}" stroke-width="4" stroke-linecap="round"/>`;
    }).join('');
    return `
      <ellipse cx="208" cy="292" rx="175" ry="14" fill="url(#sh${id})"/>
      <g transform="translate(0,100)">
        <path d="M40 176 Q38 192 62 193 L332 193 Q372 191 378 172 L376 164 L42 164 Z" fill="${c.s2 || '#1d1d1f'}"/>
        <path d="M36 150 Q30 182 64 182 L336 182 Q372 180 378 160 Q380 147 366 142 L62 138 Q38 138 36 150Z" fill="${c.s}"/>
        <path d="M60 162 Q150 170 250 160 Q320 154 372 156" stroke="${shade(c.s, -30)}" stroke-width="2.5" fill="none" opacity=".55"/>
        <path d="M46 142 Q40 108 60 90 Q76 74 94 77 L122 84 Q140 58 170 60 L190 64 Q212 96 252 108 Q304 118 342 126 Q374 133 370 146 L58 146 Z" fill="${c.a}"/>
        <path d="M46 142 Q40 108 60 90 Q72 82 86 80 Q80 112 98 145 Z" fill="${c.b}"/>
        <path d="M296 120 Q348 126 366 138 Q372 146 360 146 L292 146 Q300 132 296 120Z" fill="${c.b}" opacity=".9"/>
        <path d="M168 60 Q178 42 196 48 L204 70 Q188 64 168 60Z" fill="${shade(c.a, -25)}"/>
        <path d="M112 136 C 168 92, 236 100, 318 132" stroke="${c.c}" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M120 84 Q140 60 170 60" stroke="${shade(c.a, -45)}" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${laces}
        <path d="M46 142 Q40 108 60 90 Q76 74 94 77 L122 84 Q140 58 170 60 L190 64 Q212 96 252 108 Q304 118 342 126 Q374 133 370 146 L58 146 Z" fill="url(#g${id})"/>
        <path d="M36 150 Q30 182 64 182 L336 182 Q372 180 378 160 Q380 147 366 142 L62 138 Q38 138 36 150Z" fill="url(#g${id})" opacity=".7"/>
      </g>`;
  }

  /* ---------- Tenis tipo court / lifestyle ---------- */
  function court(c, id) {
    const laces = Array.from({ length: 6 }, (_, i) => {
      const x = 178 + i * 14, y = 92 + i * 5.5;
      return `<path d="M${x} ${y} l10 -6" stroke="${c.lace || '#fff'}" stroke-width="4" stroke-linecap="round"/>`;
    }).join('');
    return `
      <ellipse cx="208" cy="290" rx="172" ry="13" fill="url(#sh${id})"/>
      <g transform="translate(0,100)">
        <path d="M40 160 L376 160 Q382 182 360 186 L58 186 Q36 184 40 160Z" fill="${c.s}"/>
        <path d="M44 172 L372 172" stroke="${shade(c.s, -35)}" stroke-width="3" opacity=".6"/>
        <path d="M48 160 Q42 120 66 102 Q84 90 104 92 L126 96 Q140 76 168 76 L186 78 Q206 104 250 116 Q310 128 348 136 Q378 144 374 160 Z" fill="${c.a}"/>
        <path d="M48 160 Q42 120 66 102 Q78 95 92 94 Q88 128 104 160 Z" fill="${c.b}"/>
        <path d="M282 128 Q340 134 366 146 Q376 154 372 160 L276 160 Q286 144 282 128Z" fill="${shade(c.a, -14)}"/>
        <path d="M112 150 Q196 112 300 130 L298 142 Q200 128 120 160 Z" fill="${c.c}"/>
        <circle cx="86" cy="128" r="6" fill="${c.c}" opacity=".9"/>
        <path d="M164 76 Q174 60 192 64 L198 84 Q184 80 164 76Z" fill="${shade(c.a, -20)}"/>
        ${laces}
        <path d="M48 160 Q42 120 66 102 Q84 90 104 92 L126 96 Q140 76 168 76 L186 78 Q206 104 250 116 Q310 128 348 136 Q378 144 374 160 Z" fill="url(#g${id})"/>
      </g>`;
  }

  /* ---------- Guayo / fútbol ---------- */
  function cleat(c, id) {
    const studs = [80, 120, 250, 290, 330].map(x => `<rect x="${x}" y="178" width="16" height="16" rx="3" fill="${c.s2 || shade(c.s, -40)}"/>`).join('');
    return `
      <ellipse cx="208" cy="296" rx="168" ry="12" fill="url(#sh${id})"/>
      <g transform="translate(0,100)">
        ${studs}
        <path d="M44 166 L376 162 Q384 176 362 180 L60 182 Q40 180 44 166Z" fill="${c.s}"/>
        <path d="M50 166 Q44 124 66 104 Q86 90 108 92 L132 96 Q150 74 178 74 L196 78 Q218 110 262 122 Q320 132 352 140 Q382 148 376 164 Z" fill="${c.a}"/>
        <path d="M66 140 C 140 120, 230 150, 360 150" stroke="${c.c}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M200 98 C 240 120, 300 130, 360 142" stroke="${c.b}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M50 166 Q44 124 66 104 Q86 90 108 92 L132 96 Q150 74 178 74 L196 78 Q218 110 262 122 Q320 132 352 140 Q382 148 376 164 Z" fill="url(#g${id})"/>
      </g>`;
  }

  /* ---------- Ropa ---------- */
  function tee(c, id) {
    return `
      <ellipse cx="200" cy="356" rx="120" ry="10" fill="url(#sh${id})"/>
      <path d="M128 72 L170 56 Q200 80 230 56 L272 72 L336 134 L298 172 L276 152 L276 340 L124 340 L124 152 L102 172 L64 134 Z" fill="${c.a}"/>
      <path d="M170 56 Q200 84 230 56 Q200 92 170 56Z" fill="${shade(c.a, -35)}"/>
      <path d="M64 134 L102 172 L112 162 L74 124Z" fill="${c.b}"/>
      <path d="M336 134 L298 172 L288 162 L326 124Z" fill="${c.b}"/>
      <path d="M124 300 L276 300" stroke="${c.c}" stroke-width="6" opacity=".9"/>
      <path d="M222 120 l22 0 -8 14 -22 0z" fill="${c.c}"/>
      <path d="M128 72 L170 56 Q200 80 230 56 L272 72 L336 134 L298 172 L276 152 L276 340 L124 340 L124 152 L102 172 L64 134 Z" fill="url(#g${id})"/>`;
  }

  function hoodie(c, id) {
    return `
      <ellipse cx="200" cy="362" rx="130" ry="10" fill="url(#sh${id})"/>
      <path d="M150 60 Q200 20 250 60 L286 78 L330 150 L346 300 L310 306 L292 170 L284 346 L116 346 L108 170 L90 306 L54 300 L70 150 L114 78 Z" fill="${c.a}"/>
      <path d="M150 60 Q200 22 250 60 Q236 110 200 116 Q164 110 150 60Z" fill="${shade(c.a, -30)}"/>
      <path d="M160 64 Q200 40 240 64 Q228 98 200 102 Q172 98 160 64Z" fill="${shade(c.a, -55)}"/>
      <path d="M190 112 L186 170 M210 112 L214 170" stroke="${c.c}" stroke-width="4" stroke-linecap="round"/>
      <path d="M140 250 L260 250 L270 300 L130 300Z" fill="${shade(c.a, -18)}"/>
      <path d="M116 330 L284 330 L284 346 L116 346Z" fill="${c.b}"/>
      <path d="M54 300 L90 306 L92 290 L56 284Z M346 300 L310 306 L308 290 L344 284Z" fill="${c.b}"/>
      <path d="M150 60 Q200 20 250 60 L286 78 L330 150 L346 300 L310 306 L292 170 L284 346 L116 346 L108 170 L90 306 L54 300 L70 150 L114 78 Z" fill="url(#g${id})"/>`;
  }

  function jacket(c, id) {
    return `
      <ellipse cx="200" cy="362" rx="130" ry="10" fill="url(#sh${id})"/>
      <path d="M162 52 L238 52 L288 76 L330 150 L346 300 L310 306 L292 170 L284 346 L116 346 L108 170 L90 306 L54 300 L70 150 L112 76 Z" fill="${c.a}"/>
      <path d="M162 52 L238 52 L232 76 L168 76Z" fill="${c.b}"/>
      <path d="M200 76 L200 346" stroke="${c.c}" stroke-width="5"/>
      <path d="M112 76 L70 150 L54 300 L72 302 L88 160 L124 90Z M288 76 L330 150 L346 300 L328 302 L312 160 L276 90Z" fill="${c.b}" opacity=".85"/>
      <path d="M130 230 L178 226 M222 226 L270 230" stroke="${shade(c.a, -40)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M162 52 L238 52 L288 76 L330 150 L346 300 L310 306 L292 170 L284 346 L116 346 L108 170 L90 306 L54 300 L70 150 L112 76 Z" fill="url(#g${id})"/>`;
  }

  function shorts(c, id) {
    return `
      <ellipse cx="200" cy="330" rx="120" ry="10" fill="url(#sh${id})"/>
      <path d="M106 100 L294 100 L314 300 L216 310 L200 196 L184 310 L86 300 Z" fill="${c.a}"/>
      <path d="M106 100 L294 100 L296 126 L104 126Z" fill="${c.b}"/>
      <path d="M190 126 L186 160 M210 126 L214 160" stroke="${c.c}" stroke-width="4" stroke-linecap="round"/>
      <path d="M300 160 L314 300 L296 302 Z M100 160 L86 300 L104 302 Z" fill="${c.c}" opacity=".9"/>
      <path d="M106 100 L294 100 L314 300 L216 310 L200 196 L184 310 L86 300 Z" fill="url(#g${id})"/>`;
  }

  function leggings(c, id) {
    return `
      <ellipse cx="200" cy="370" rx="110" ry="9" fill="url(#sh${id})"/>
      <path d="M128 40 L272 40 L268 200 L246 360 L210 360 L202 150 L198 150 L190 360 L154 360 L132 200 Z" fill="${c.a}"/>
      <path d="M128 40 L272 40 L271 70 L129 70Z" fill="${c.b}"/>
      <path d="M262 90 L240 352 M138 90 L160 352" stroke="${c.c}" stroke-width="5" opacity=".9"/>
      <path d="M128 40 L272 40 L268 200 L246 360 L210 360 L202 150 L198 150 L190 360 L154 360 L132 200 Z" fill="url(#g${id})"/>`;
  }

  function bra(c, id) {
    return `
      <ellipse cx="200" cy="300" rx="110" ry="9" fill="url(#sh${id})"/>
      <path d="M140 70 L170 70 Q200 150 230 70 L260 70 L292 190 Q296 240 280 260 L120 260 Q104 240 108 190 Z" fill="${c.a}"/>
      <path d="M120 228 L280 228 L280 260 L120 260Z" fill="${c.b}"/>
      <path d="M140 70 Q200 200 260 70" stroke="${c.c}" stroke-width="5" fill="none"/>
      <path d="M140 70 L170 70 Q200 150 230 70 L260 70 L292 190 Q296 240 280 260 L120 260 Q104 240 108 190 Z" fill="url(#g${id})"/>`;
  }

  /* ---------- Accesorios ---------- */
  function cap(c, id) {
    return `
      <ellipse cx="200" cy="296" rx="140" ry="12" fill="url(#sh${id})"/>
      <path d="M96 230 Q96 120 200 112 Q300 120 302 230 Z" fill="${c.a}"/>
      <path d="M200 112 Q214 170 210 230 M200 112 Q160 160 150 230" stroke="${shade(c.a, -30)}" stroke-width="3" fill="none"/>
      <path d="M86 226 Q200 210 314 226 L366 252 Q370 270 340 268 Q200 250 86 246 Z" fill="${c.b}"/>
      <circle cx="200" cy="114" r="9" fill="${c.b}"/>
      <path d="M222 168 l30 0 -10 18 -30 0z" fill="${c.c}"/>
      <path d="M96 230 Q96 120 200 112 Q300 120 302 230 Z" fill="url(#g${id})"/>`;
  }

  function bag(c, id) {
    return `
      <ellipse cx="200" cy="318" rx="160" ry="12" fill="url(#sh${id})"/>
      <path d="M150 140 Q150 90 200 90 Q250 90 250 140" stroke="${c.b}" stroke-width="12" fill="none"/>
      <rect x="56" y="140" width="288" height="168" rx="64" fill="${c.a}"/>
      <path d="M90 160 L310 160" stroke="${c.c}" stroke-width="5" stroke-dasharray="10 8"/>
      <rect x="56" y="230" width="288" height="20" fill="${c.b}" opacity=".9"/>
      <rect x="170" y="186" width="60" height="22" rx="4" fill="${c.c}"/>
      <rect x="56" y="140" width="288" height="168" rx="64" fill="url(#g${id})"/>`;
  }

  function bottle(c, id) {
    return `
      <ellipse cx="200" cy="356" rx="80" ry="9" fill="url(#sh${id})"/>
      <rect x="168" y="40" width="64" height="40" rx="10" fill="${c.b}"/>
      <path d="M156 80 L244 80 Q262 96 262 120 L262 330 Q262 350 242 350 L158 350 Q138 350 138 330 L138 120 Q138 96 156 80Z" fill="${c.a}"/>
      <rect x="138" y="190" width="124" height="80" fill="${c.c}"/>
      <path d="M156 80 L244 80 Q262 96 262 120 L262 330 Q262 350 242 350 L158 350 Q138 350 138 330 L138 120 Q138 96 156 80Z" fill="url(#g${id})"/>`;
  }

  function socks(c, id) {
    return `
      <ellipse cx="200" cy="350" rx="140" ry="10" fill="url(#sh${id})"/>
      <path d="M100 50 L170 50 L170 250 Q170 300 130 330 L76 340 Q50 340 52 316 Q56 296 84 292 L104 286 Z" fill="${c.a}"/>
      <path d="M100 50 L170 50 L170 78 L100 78Z" fill="${c.b}"/>
      <path d="M102 110 L168 110 M102 124 L168 124" stroke="${c.c}" stroke-width="6"/>
      <path d="M230 50 L300 50 L300 250 Q300 300 260 330 L206 340 Q180 340 182 316 Q186 296 214 292 L234 286 Z" fill="${shade(c.a, -10)}"/>
      <path d="M230 50 L300 50 L300 78 L230 78Z" fill="${c.b}"/>
      <path d="M232 110 L298 110 M232 124 L298 124" stroke="${c.c}" stroke-width="6"/>
      <path d="M100 50 L170 50 L170 250 Q170 300 130 330 L76 340 Q50 340 52 316 Q56 296 84 292 L104 286 Z" fill="url(#g${id})"/>`;
  }

  function tank(c, id) {
    return `
      <ellipse cx="200" cy="356" rx="110" ry="10" fill="url(#sh${id})"/>
      <path d="M150 50 L170 50 Q200 110 230 50 L250 50 L258 120 Q290 150 286 200 L280 340 L120 340 L114 200 Q110 150 142 120 Z" fill="${c.a}"/>
      <path d="M150 50 L170 50 Q200 110 230 50 L250 50" stroke="${c.b}" stroke-width="7" fill="none"/>
      <path d="M142 120 Q120 150 116 200 M258 120 Q280 150 284 200" stroke="${c.c}" stroke-width="5" fill="none" opacity=".9"/>
      <path d="M120 312 L280 312" stroke="${c.b}" stroke-width="10"/>
      <path d="M150 50 L170 50 Q200 110 230 50 L250 50 L258 120 Q290 150 286 200 L280 340 L120 340 L114 200 Q110 150 142 120 Z" fill="url(#g${id})"/>`;
  }

  function biker(c, id) {
    return `
      <ellipse cx="200" cy="330" rx="110" ry="9" fill="url(#sh${id})"/>
      <path d="M124 70 L276 70 L280 190 L270 300 L212 300 L202 170 L198 170 L188 300 L130 300 L120 190 Z" fill="${c.a}"/>
      <path d="M124 70 L276 70 L277 108 L123 108Z" fill="${c.b}"/>
      <path d="M200 112 Q180 140 200 168 Q220 140 200 112Z" fill="${shade(c.a, -18)}"/>
      <path d="M270 120 L262 296 M130 120 L138 296" stroke="${c.c}" stroke-width="5" opacity=".9"/>
      <path d="M124 70 L276 70 L280 190 L270 300 L212 300 L202 170 L198 170 L188 300 L130 300 L120 190 Z" fill="url(#g${id})"/>`;
  }

  function skort(c, id) {
    return `
      <ellipse cx="200" cy="320" rx="130" ry="10" fill="url(#sh${id})"/>
      <path d="M132 90 L268 90 L300 290 Q200 312 100 290 Z" fill="${c.a}"/>
      <path d="M132 90 L268 90 L271 122 L129 122Z" fill="${c.b}"/>
      <path d="M160 122 L140 296 M200 122 L200 304 M240 122 L260 296" stroke="${shade(c.a, -22)}" stroke-width="3" opacity=".7"/>
      <path d="M104 270 Q200 292 296 270" stroke="${c.c}" stroke-width="6" fill="none"/>
      <path d="M132 90 L268 90 L300 290 Q200 312 100 290 Z" fill="url(#g${id})"/>`;
  }

  // Conjunto: top + leggings
  function set(c, id) {
    const top = `<g transform="translate(70,-30) scale(.65)">${bra(c, id)}</g>`;
    const bottom = `<g transform="translate(70,130) scale(.65)">${leggings(c, id)}</g>`;
    return `<ellipse cx="200" cy="372" rx="110" ry="9" fill="url(#sh${id})"/>` + top.replace(/<ellipse[^>]*\/>/, '') + bottom.replace(/<ellipse[^>]*\/>/, '');
  }

  const shapes = { runner, court, cleat, tee, tank, hoodie, jacket, shorts, biker, skort, leggings, bra, set, cap, bag, bottle, socks };

  /**
   * view: 0 = lateral, 1 = medial (espejo), 2 = detalle (zoom), 3 = 3/4
   */
  function render(type, colors, view = 0, bg) {
    const id = ++uid;
    const fn = shapes[type] || runner;
    let tf = '';
    if (view === 1) tf = 'translate(400,0) scale(-1,1)';
    if (view === 2) tf = 'translate(-160,-150) scale(1.75)';
    if (view === 3) tf = 'translate(40,30) rotate(-12 200 200) scale(.86)';
    const back = bg ? `<rect width="400" height="400" fill="${bg}"/>` : '';
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${defs(id)}${back}<g transform="${tf}">${fn(colors, id)}</g></svg>`;
  }

  window.MaraArt = { render, shade };
})();
