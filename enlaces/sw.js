/* MARA Originals · funciona sin internet (guarda la tarjeta en el celular) */
const CACHE = 'mara-tarjeta-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './app-192.png', './app-512.png', './app-180.png', './mara-originals.vcf', '../img/marca/logo-premium-fade-sm.webp', '../img/marca/icono-180.png', '../img/qr/qr-whatsapp-solo.png', '../img/qr/qr-instagram-solo.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Red primero (siempre lo más nuevo); si no hay internet, usa lo guardado
  e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./'))));
});
