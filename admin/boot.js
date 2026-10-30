/* NEBSOFT Yönetim — tek giriş noktası (admin/)
   • Sunucu bulut modunda kuruluysa (MySQL) → gerçek yönetim paneli (panel.js)
   • Sunucu kurulmamışsa → kurulum sihirbazı (panel.js); sihirbazdan "demo yönetim merkezi" seçilebilir
   • Sunucu yoksa (dosyadan açılış) veya ?demo=1 → tarayıcıdaki demo Yönetim Merkezi (data.js + app.js);
     pazar yerinin satış yönetimi (sipariş, kupon, ürün, müşteri) bu merkezin "Pazar Yeri Satışları" sayfasındadır. */
(function () {
  'use strict';
  const load = (srcs) => srcs.reduce((p, src) => p.then(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.body.appendChild(s); })), Promise.resolve());
  const local = () => load(['../core/integrations.js', 'data.js', 'app.js']);
  const cloud = () => load(['panel-ek.js', 'panel-guven.js', 'panel-kurulum.js', 'panel.js']);
  const fail = (e) => { document.body.innerHTML = `<div class="wiz"><div class="card pad"><h2>Yönetim paneli açılamadı</h2><p class="muted">${String(e && e.message || e).replace(/[<>&]/g, '')}</p></div></div>`; };
  if (/[?&]demo=1/.test(location.search) || !/^https?:$/.test(location.protocol)) { local().catch(fail); return; }
  fetch('/api/setup/status', { headers: { 'x-ns-csrf': '1' } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((st) => (st && st.ok !== false && 'configured' in st ? cloud() : local())).catch(fail);
})();
