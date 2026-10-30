/* NEBSOFT service worker — uygulama kabuğunu önbelleğe alır: telefonda/masaüstünde "uygulama gibi" açılır, bağlantı
   koptuğunda son açılan ekran yine gelir. Veriler (API) asla önbellekten verilmez; çevrimdışı kayıtlar core.js kuyruğundadır. */
const V = 'nebsoft-v3-34';
const SHELL = ['/', '/index.html', '/core/core.css', '/core/core.js', '/core/notify.js', '/core/docs.js', '/core/forms.js', '/core/auth.js', '/core/pwa.js', '/core/scan.js', '/core/labels.js', '/core/support.js', '/core/integ-guides.js', '/core/integ-guides-ek.js', '/core/integ-wizard.js', '/core/integrations.js', '/market/market.css', '/market/market.js', '/market/catalog.js', '/market/eklentiler.js', '/core/bizsite.js', '/assets/favicon.svg'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/admin/')) return;
  // Sayfalar: önce ağ (her zaman güncel), ağ yoksa önbellek
  if (r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); if (res.ok) caches.open(V).then((c) => c.put(r, cp)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match('/index.html'))));
    return;
  }
  // Statik dosyalar: önbellekten hemen ver, arka planda sunucuya sorarak (ETag) yenile — güncelleme bir sonraki açılışta gelir
  e.respondWith(caches.match(r).then((m) => {
    const net = fetch(r, { cache: 'no-cache' }).then((res) => { if (res.ok && /\.(js|css|svg|webp|png|woff2?|xslt)$/.test(u.pathname)) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => m);
    return m || net;
  }));
});

// Bildirime tıklanınca ilgili programa dön
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => { const c = cs[0]; if (c) return c.focus(); return self.clients.openWindow('/#/programlarim'); }));
});
