// Arama motoru görünürlüğü ve "kendi kendini pazarlayan" sistem:
//  • Alan adı yönetim panelindeki "Site adresi" ayarından gelir (tanıtım sitelerindeki yer tutucu sunarken değiştirilir)
//  • /sitemap.xml dinamiktir: site/sitemap.xml (ürün siteleri, /programlar, /paketler/, /fiyatlar/, yasal metinler, /rehber/) + NEBSOFT kullanan her işletmenin herkese açık sayfası (/t/<işletme>/)
//  • /t/<işletme>/ : yayındaki işletme sitesi (core/bizsite.js) veya yalnızca online hizmet bağlantılarını gösteren noindex yalın sayfa
//  • /t/<işletme>/hizmet/<slug>/ ve /t/<işletme>/sitemap.xml : hizmet sayfaları ve işletme site haritası (kendi alan adında kökten)
//  • IndexNow: yeni/değişen adresler Bing, Yandex, Seznam vb. arama motorlarına anında bildirilir
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const sec = require('./security');
const { R, site, setting, setSetting, valid, J, syncCatalog } = require('./routes');
const cat = require('./catalog');
const paket = require('./paket');
const bizsite = require('../../core/bizsite');
const analitik = require('./analitik');
const tlf = (n) => new Intl.NumberFormat('tr-TR').format(n);
const { md } = require('../../site/tools/markdown');

const PLACEHOLDER = 'https://www.domain.com'; // eski derlemeler için; site.config.js artık gerçek adresi yazıyor
const ROOT = path.join(__dirname, '..', '..');
// Müşteriye açık sayfalar (sorgu/kod gerektirmeyenler)
const PAGES = {
  nakliyat: ['takip.html', 'Taşınma takibi', 'truck'], temizlik: ['takip.html', 'Ziyaret ve rapor sorgula', 'sparkles'], usta: ['takip.html', 'İş emri takibi', 'wrench'], peyzaj: ['takip.html', 'Ziyaret ve rapor sorgula', 'flower'],
  dugun: ['salon.html', 'Müsait tarih ve teklif', 'calendar'], yurt: ['veli.html', 'Veli ve öğrenci portalı', 'bed'], fotograf: ['galeri.html', 'Fotoğraf galerim', 'camera'], oyun: ['kart.html', 'Kartım ve doğum günü', 'star'],
  randevu: ['book.html', 'Online randevu al', 'calendar'], servis: ['takip.html', 'Cihaz durumu sorgula', 'wrench'], kargo: ['takip.html', 'Kargo takip', 'truck'],
  veteriner: ['karne.html', 'Pati karnesi', 'paw'], otel: ['rezervasyon.html', 'Online rezervasyon', 'bed'], spor: ['uye.html', 'Üye girişi', 'dumbbell'],
  kurs: ['veli.html', 'Kurs veli portalı', 'book'], site: ['sakin.html', 'Sakin portalı', 'building'], kiralama: ['kirala.html', 'Araç kirala', 'car'],
  oto: ['arac.html', 'Aracım nerede?', 'car'], eczane: ['recete.html', 'Reçete ve stok sorgula', 'pill'], fabrika: ['bayi.html', 'Bayi portalı', 'factory'],
  ik: ['calisan.html', 'Çalışan portalı', 'users'], toptan: ['bayi.html', 'Bayi sipariş', 'truck'], musavir: ['portal.html', 'Mükellef portalı', 'book'], muhasebe: ['cari.html', 'Cari hesap portalı', 'wallet'], hukuk: ['muvekkil.html', 'Müvekkil portalı', 'scale'],
  anaokulu: ['veli.html', 'Anaokulu veli portalı', 'heart'], emlak: ['ilan.html', 'İlanlarımız', 'home'], galeri: ['vitrin.html', 'Araç vitrini', 'car'],
  kuyumcu: ['ekran.html', 'Güncel altın fiyatları', 'coins'], eticaret: ['magaza.html', 'Online mağaza', 'bag'], bilet: ['bilet.html', 'Etkinlikler ve bilet', 'ticket'],
  terzi: ['takip.html', 'Ölçü', 'scissors'],
  cicekci: ['takip.html', 'Sipariş', 'flower'],
  pastane: ['takip.html', 'Özel sipariş', 'chef'],
  matbaa: ['takip.html', 'Teklif', 'print'],
  kurutemizleme: ['takip.html', 'Fiş', 'drop'],
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let cache = { at: 0, s: null }; const yasalAra = new Map();
async function settings() {
  if (!db.ready()) return {};
  if (Date.now() - cache.at > 60e3) { try { cache = { at: Date.now(), s: { ...(await site()), sirket: await setting('sirket', {}) } }; } catch (e) { cache.at = Date.now(); } }
  return cache.s || {};
}
// Panelde kayıt olunca hemen geçerli olsun (yeniden başlatma ve 1 dakika bekleme gerekmez)
const tazele = () => { cache = { at: 0, s: null }; yasalAra.clear(); };
// Sitenin kök adresi: panel ayarı; yoksa isteğin geldiği alan adı (yalnızca geçerli biçimdeyse)
async function base(req) {
  const s = await settings();
  if (s.siteUrl && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(String(s.siteUrl).replace(/\/$/, ''))) return String(s.siteUrl).replace(/\/$/, '');
  const host = String(req.headers.host || '');
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return PLACEHOLDER;
  const https = process.env.TRUST_PROXY === '1' ? String(req.headers['x-forwarded-proto'] || '').startsWith('https') : !!req.socket.encrypted;
  return `${https ? 'https' : 'http'}://${host}`;
}
// Tanıtım siteleri derlenirken gömülen iletişim bilgisi (site.config.js) panelde değiştirilen bilgiyle değiştirilir
const BUILT = require('../../site/src/site.config');
const telOf = (p) => '+90' + String(p || '').replace(/\D/g, '').replace(/^(90)?0?/, '');
// WhatsApp düğmesi: numara panelden (Site Ayarları) gelir, boşsa hiç basılmaz. Telefonda yalnız simge, alttaki sabit satın alma çubuğunun üstünde durur; sayfa sonu içeriği örtülmesin diye gövdeye pay bırakılır.
const WA_NO = /^[1-9]\d{10,14}$/;
const WA_CSS = '<style>.ns-wa{position:fixed;right:16px;bottom:16px;z-index:40;display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 16px;border-radius:24px;background:#0b7a5e;color:#fff;font:600 14px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.28)}.ns-wa svg{width:22px;height:22px;flex:none}.ns-wa:hover{background:#086650}.ns-wa:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 6px #0b7a5e}body:has(.nsd) .ns-wa{right:20px;bottom:90px}@media(max-width:960px){.ns-wa{width:48px;padding:0;justify-content:center;bottom:calc(12px + env(safe-area-inset-bottom,0px))}body:has(.nsd) .ns-wa{right:25px;bottom:calc(90px + env(safe-area-inset-bottom,0px))}.ns-wa span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.sticky-cta~.ns-wa{bottom:calc(74px + env(safe-area-inset-bottom,0px))}body{padding-bottom:72px}body:has(.sticky-cta){padding-bottom:130px}}@media print{.ns-wa{display:none}}</style>';
// Pazar yeri sayfası gövdeyi yeniden çizer: düğme silinirse geri eklenir, biçim bu yüzden başlıktadır. Sağ altta destek düğmesi (.nsd) varsa onun üstünde durur.
const waDugme = (no) => `<a class="ns-wa" href="https://wa.me/${no}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.4 8.4 0 1 1 21 11.5z"/></svg><span>WhatsApp ile yazın</span></a><script>(function(){var w=document.querySelector('.ns-wa');new MutationObserver(function(){if(!document.body.contains(w))document.body.appendChild(w);}).observe(document.body,{childList:true});})();</script>`;
// Örnek iletişim bilgisinin izini siler. Metin içinde kalan değer destek bölümüne yönlendirilir, sayfa bozulmaz.
const reKac = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function iletisimSil(text, deger, gorunen, sema) {
  let t = text.replace(new RegExp(`<a\\b[^>]*href="${reKac(sema + deger)}"[^>]*>[\\s\\S]*?</a>`, 'g'), '');
  if (sema === 'tel:') return t.replace(/,"contactPoint":\{[^}]*"telephone":"[^"]*"[^}]*\}/g, '').split(gorunen).join('destek talebi');
  t = t.replace(new RegExp(`"email":"${reKac(deger)}",`, 'g'), ''); return t.split(`${gorunen} adresine`).join('Hesabım &gt; Destek bölümüne').split(gorunen).join('destek talebi');
}
// Şirket kimliği: yalnız girilen alanlar alt bilgiye yazılır, eksik alan için değer uydurulmaz
function kimlikYaz(text, s) {
  const k = s.sirket || {}; const p = text.lastIndexOf('</footer>'); if (p < 0) return text;
  const satir = [k.unvan, k.mersis && `MERSİS ${k.mersis}`, (k.vergiDairesi || k.vergiNo) && `Vergi: ${[k.vergiDairesi, k.vergiNo].filter(Boolean).join(' ')}`, s.address, k.kep && `KEP ${k.kep}`, k.destekSaat && `Destek: ${k.destekSaat}`].filter(Boolean).map(esc).join(' · ');
  return satir ? `${text.slice(0, p)}<p data-kimlik style="margin:10px 0 0;font-size:13px">${satir}</p>${text.slice(p)}` : text;
}
// Onaylanmış yasal metin: panelde kaydedilip avukat onayı işaretlenen metin üretilmiş örnek metnin yerine geçer ve sayfa dizine açılır
async function yasalKayit(ad) {
  if (yasalAra.has(ad)) return yasalAra.get(ad);
  const r = await setting(`yasal:${ad}`, null).catch(() => null); yasalAra.set(ad, r); return r;
}
async function yasalYaz(text, req) {
  const m = /^\/(kvkk|gizlilik|mesafeli-satis|iade|cerez)\/(?:index\.html)?(?:\?|$)/.exec(String(req.url || '')); if (!m || !db.ready()) return text;
  const r = await yasalKayit(m[1]); if (!r || !r.onay || !r.metin) return text;
  const a = text.indexOf('<div class="doc">'); const b = a < 0 ? -1 : a + text.slice(a).search(/<\/div>\r?\n<\/div><\/section>/); if (a < 0 || b < a) return text; // kahraman bölümü de aynı kalıpla biter, arama metin bloğundan başlar
  const html = md(r.metin) + (r.at ? `<p class="note">Son güncelleme: ${esc(new Date(r.at).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }))}</p>` : '');
  return (text.slice(0, a) + '<div class="doc">' + html + text.slice(b)).replace(/<meta name="robots" content="noindex[^"]*">/, '<meta name="robots" content="index,follow">');
}
async function rewrite(text, req) {
  const s = await settings();
  // Google Search Console doğrulama etiketi (panel: Site Ayarları). Biçimi kayıtta denetlenir, burada yine de yalnız geçerli kod basılır
  if (/^[A-Za-z0-9_-]{10,100}$/.test(String(s.googleVerify || ''))) text = text.replace('</head>', `<meta name="google-site-verification" content="${s.googleVerify}">\n</head>`);
  if (text.includes('www.domain.com')) { const B = await base(req); text = text.split(PLACEHOLDER).join(B).split('www.domain.com').join(B.replace(/^https?:\/\//, '')); }
  const kok = String(s.siteUrl || '').replace(/\/$/, ''); if (/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(kok) && kok !== BUILT.domain) { const h = (x) => x.replace(/^https?:\/\//, ''); text = text.split(BUILT.domain).join(kok).split(h(BUILT.domain)).join(h(kok)); }
  // Telefon ve e-posta girilmemişse derlemedeki örnek değer gösterilmez: bağlantı, şema alanı ve düğme çıkarılır (yalnız bulut modunda)
  if (s.phone && s.phone !== BUILT.phone) text = text.split(telOf(BUILT.phone)).join(telOf(s.phone)).split(BUILT.phone).join(s.phone);
  else if (s.phone === '') text = iletisimSil(text, telOf(BUILT.phone), BUILT.phone, 'tel:');
  if (s.email && s.email !== BUILT.email) text = text.split(BUILT.email).join(s.email);
  else if (s.email === '') text = iletisimSil(text, BUILT.email, BUILT.email, 'mailto:');
  if (s.trialDays && Number(s.trialDays) !== BUILT.trialDays) text = text.split(`${BUILT.trialDays} gün ücretsiz`).join(`${Number(s.trialDays)} gün ücretsiz`);
  if (s.phone || s.email) text = text.replace('</head>', () => `<meta name="ns-iletisim" data-tel="${esc(s.phone)}" data-eposta="${esc(s.email)}">
</head>`); // destek penceresi site sayfalarında buradan okur
  text = await yasalYaz(text, req); text = kimlikYaz(text, s);
  if (WA_NO.test(String(s.whatsapp || ''))) { const b = text.lastIndexOf('</body>'); if (b > -1) text = (text.slice(0, b) + waDugme(s.whatsapp) + text.slice(b)).replace('</head>', () => `${WA_CSS}</head>`); }
  // Yönetim panelinde değişen fiyatlar
  if (text.includes('data-p="')) { try { await syncCatalog(); } catch (e) { /* yok */ } const ov = cat.overrides(); text = text.replace(/data-p="([a-z]+):(\d)">[^<]*</g, (m, id, i) => (ov[id] && ov[id].prices ? `data-p="${id}:${i}">${tlf(ov[id].prices[i])}<` : m));
    // Arama motoru şeması (JSON-LD) da aynı fiyatı göstersin
    const pid = (text.match(/data-p="([a-z]+):\d"/) || [])[1]; const pr = pid && ov[pid] && ov[pid].prices;
    if (pr) text = text.replace(/"lowPrice":\d+(\.\d+)?/, `"lowPrice":${pr[0]}`).replace(/"highPrice":\d+(\.\d+)?/, `"highPrice":${pr[2]}`); }
  // Hazır paket tutarları: katalog ve toplu indirim kuralından o anki değer yazılır
  if (text.includes('data-pk="')) { try { await syncCatalog(); } catch (e) { /* yok */ } text = text.replace(/data-pk="([a-z0-9-]+):(\d):(liste|net|yuzde)">[^<]*</g, (m, id, i, alan) => { const pk = paket.bul(id); const f = pk && paket.fiyat(pk).planlar[i]; return f ? `data-pk="${id}:${i}:${alan}">${alan === 'yuzde' ? (f.aylik.indirim ? f.aylik.indirim.yuzde : 0) : paket.yazi(f.aylik[alan])}<` : m; }); }
  // Analitik yalnızca bulut modunda ve açıksa yüklenir: rıza bandı ve olay gönderimi core/olay.js içindedir (kaynak dosyalar değişmez)
  if (await analitik.acik().catch(() => false)) {
    const pid = (text.match(/data-p="([a-z]+):\d"/) || [])[1]; const body = text.lastIndexOf('</body>'); const foot = text.lastIndexOf('</footer>');
    if (foot > -1) text = `${text.slice(0, foot)}<p style="margin:10px 0 0;font-size:13px"><a href="#" data-olay-tercih>Analitik tercihleri</a></p>${text.slice(foot)}`;
    if (body > -1) { const b = text.lastIndexOf('</body>'); text = `${text.slice(0, b)}<script src="/core/olay.js"${pid ? ` data-program="${pid}"` : ''} defer></script>${text.slice(b)}`; }
  }
  return text;
}

// Herkese açık sayfası olan işletmeler (geçerli lisans + veri)
async function publicTenants() {
  if (!db.ready()) return [];
  const rows = await db.q("SELECT t.slug, t.id, l.product, l.status, l.end, d.updated FROM tenants t JOIN licenses l ON l.tenant_id=t.id JOIN app_data d ON d.tenant_id=t.id AND d.app=l.product WHERE t.status='active'");
  const map = new Map();
  rows.filter((r) => PAGES[r.product] && valid(r)).forEach((r) => { const m = map.get(r.slug) || { slug: r.slug, apps: [], updated: r.updated }; m.apps.push(r.product); if (r.updated > m.updated) m.updated = r.updated; map.set(r.slug, m); });
  return [...map.values()];
}

async function sitemap(req) {
  const B = await base(req);
  const file = path.join(ROOT, 'site', 'sitemap.xml');
  let xml = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
  xml = xml.split(PLACEHOLDER).join(B).split(BUILT.domain).join(B);
  const pts = await publicTenants(); const seen = new Set(pts.map((t) => t.slug));
  const sites = await db.q("SELECT t.slug, b.updated FROM biz_sites b JOIN tenants t ON t.id=b.tenant_id JOIN licenses l ON l.tenant_id=t.id AND l.product='eklenti-web' AND l.status IN ('aktif','deneme') AND l.end>UTC_TIMESTAMP() WHERE b.published=1 AND t.status='active'").catch(() => []);
  sites.forEach((x) => { if (!seen.has(x.slug)) { seen.add(x.slug); pts.push({ slug: x.slug, updated: x.updated }); } });
  // Yalnızca dizine girmesi istenen adresler: noindex işletme ve kendi alan adındaki siteler ana haritaya yazılmaz
  const satir = []; for (const t of pts) { const r = await tenantUrls(req, t.slug).catch(() => null); if (!r || r.domain || !r.urls.length) continue; const m = new Date(r.updated || t.updated).toISOString().slice(0, 10); r.urls.forEach((u) => satir.push(`  <url><loc>${esc(u)}</loc><lastmod>${m}</lastmod></url>`)); }
  const extra = satir.join('\n');
  return extra ? xml.replace('</urlset>', extra + '\n</urlset>') : xml;
}
async function robots(req) {
  const B = await base(req);
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /apps/\nAllow: /t/\nSitemap: ${B}/sitemap.xml\n`;
}

// IndexNow anahtarı: bir kez üretilir, /<anahtar>.txt adresinde yayınlanır
async function indexnowKey() {
  if (!db.ready()) return null;
  const r = await db.one("SELECT v FROM settings WHERE k='indexnow_key'");
  if (r) return J(r.v, r.v);
  const key = crypto.randomBytes(16).toString('hex');
  await db.q("INSERT IGNORE INTO settings (k, v) VALUES ('indexnow_key', ?)", [JSON.stringify(key)]);
  return key;
}
async function pingIndexNow(req, urls) {
  const B = await base(req); const key = await indexnowKey();
  if (!/^https:\/\//.test(B) || B === PLACEHOLDER) return { ok: false, error: 'Önce Kurulum ve ayarlar ekranında https:// ile başlayan site adresinizi girin' };
  const list = urls && urls.length ? urls : [...(await sitemap(req)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(B).host, key, keyLocation: `${B}/${key}.txt`, urlList: list.slice(0, 10000) }), signal: AbortSignal.timeout(15000) });
  return { ok: res.status < 300, status: res.status, count: list.length };
}

// İşletme sayfası: /t/<işletme>/
// Web sitesi eklentisi etkin ve yayında ise işletmenin tam web sitesi
async function liveSite(t) {
  const s = await db.one('SELECT data, published, domain, domain_ok, updated FROM biz_sites WHERE tenant_id=?', [t.id]); if (!s || !s.published) return null;
  if (s.domain_ok === 0) s.domain = null; // sahipliği doğrulanmamış alan adı kanonik adres olamaz
  const on = async (p) => !!(await db.one("SELECT id FROM licenses WHERE tenant_id=? AND product=? AND status IN ('aktif','deneme') AND end>UTC_TIMESTAMP()", [t.id, p]));
  if (!(await on('eklenti-web'))) return null;
  const apps = (await db.q("SELECT product FROM licenses WHERE tenant_id=? AND status IN ('aktif','deneme') AND end>UTC_TIMESTAMP()", [t.id])).map((r) => r.product);
  return { data: await dropSample(t.id, J(s.data, {})), domain: s.domain, updated: s.updated, apps, orderable: apps.includes('eklenti-siparis') };
}
// Programın "örnek veri" ile başlayan kaydından içe aktarılmış ürünler yayınlanmaz (örnek veriler temizlenince bu denetim boşa düşer).
// İşletmenin onaylamadığı hazır şablon kayıtları da yayınlanmaz.
async function dropSample(tid, data) {
  if (!Array.isArray(data.products) || !data.products.length) return data;
  // Eczane belgesi şifreli olduğu için SQL'de aranamaz, her zaman okunur
  const rows = await db.q("SELECT app, data FROM app_data WHERE tenant_id=? AND (app='eczane' OR (app IN ('pos','butik','eticaret','toptan') AND (data LIKE '%\"sample\":true%' OR data LIKE '%\"kaynak\":\"sablon\"%')))", [tid]).catch(() => []);
  const names = new Set(); for (const r of rows) { const d = await require('./belge').oku(tid, r.app, r, {}).catch(() => ({})); const orn = d._meta && d._meta.sample; (d.products || d.urunler || []).forEach((p) => { if (p && p.name && (orn || (p.kaynak === 'sablon' && !p.onay))) names.add(String(p.name).slice(0, 120)); }); }
  return names.size ? { ...data, products: data.products.filter((p) => !names.has(p.name)) } : data;
}
// İşletme sitesinin kanonik kök adresi: kendi alan adı varsa o, yoksa /t/<işletme>/
const homeUrl = async (req, t, live) => (live.domain ? `https://${live.domain}/` : `${await base(req)}/t/${t.slug}/`);
const sitemapXml = (urls, updated) => { const m = updated ? new Date(updated).toISOString().slice(0, 10) : ''; return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc>${m ? `<lastmod>${m}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`; };
const siteCtx = (t, live, url) => ({ url, slug: t.slug, sector: t.sector, apps: live.apps, orderable: live.orderable, ref: `/?ref=${t.ref_code || ''}#/eklentiler` });
// Google Haritalar gömülü haritası için yalnızca bu sayfalarda çerçeve izni
const SITE_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none'";
const siteHtml = (t, live, url) => bizsite.render(live.data, siteCtx(t, live, url));
// Özel alan adı: Host başlığı bir işletmenin alan adıysa o işletmenin sitesi sunulur
const domCache = new Map();
async function domainSite(req, p) {
  if (!db.ready()) return null; const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, ''); if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
  const own = await settings(); let own0 = ''; try { own0 = new URL(own.siteUrl).hostname.toLowerCase(); } catch (e) { /* ayar yok */ }
  if (own0 && host.replace(/^www\./, '') === own0.replace(/^www\./, '')) return null; // platformun kendi adresi hiçbir işletmeye ait olamaz
  let hit = domCache.get(host); if (!hit || Date.now() - hit.at > 60e3) { if (domCache.size > 5000) domCache.clear(); const r = await db.one("SELECT t.id, t.name, t.slug, t.sector, t.ref_code FROM biz_sites b JOIN tenants t ON t.id=b.tenant_id WHERE (b.domain=? OR b.domain=?) AND (b.domain_ok IS NULL OR b.domain_ok=1) AND t.status='active'", [host, host.replace(/^www\./, '')]); hit = { at: Date.now(), t: r || null }; domCache.set(host, hit); }
  if (!hit.t) return null; const live = await liveSite(hit.t); if (!live) return null;
  // Kanonik adres sabittir: alan adı Host başlığından türetilmez, www'lu/www'suz çift adres oluşmaz
  const B = `https://${live.domain}`; if (live.domain !== host) return { redirect: `${B}${p}` };
  const sm = /^\/hizmet\/([a-z0-9-]{1,80})\/?$/.exec(p);
  if (sm) { if (!p.endsWith('/')) return { redirect: `${B}${p}/` }; const body = bizsite.renderService(live.data, sm[1], siteCtx(hit.t, live, B + '/')); return body ? { type: 'text/html; charset=utf-8', csp: SITE_CSP, body } : null; }
  if (p === '/' || p === '/index.html') return { type: 'text/html; charset=utf-8', csp: SITE_CSP, body: siteHtml(hit.t, live, B + '/') };
  if (p === '/sitemap.xml') return { type: 'application/xml; charset=utf-8', body: sitemapXml(bizsite.sitemapUrls(live.data, siteCtx(hit.t, live, B + '/')), live.updated) };
  if (p === '/robots.txt') return { type: 'text/plain; charset=utf-8', body: `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /apps/\nSitemap: ${B}/sitemap.xml\n` };
  return null;
}
const SLUG = /^[a-z0-9-]{1,80}$/;
const tenantOf = (slug) => db.one("SELECT id, name, slug, sector, ref_code FROM tenants WHERE slug=? AND status='active'", [slug]);
// Hizmet/ürün sayfası: /t/<işletme>/hizmet/<slug>/ (yayında olmayan sitede yoktur)
async function tenantService(req, slug, svc) {
  if (!db.ready() || !SLUG.test(slug) || !SLUG.test(svc)) return null; const t = await tenantOf(slug); if (!t) return null;
  const live = await liveSite(t).catch(() => null); if (!live) return null;
  const html = bizsite.renderService(live.data, svc, siteCtx(t, live, await homeUrl(req, t, live))); return html ? { html, csp: SITE_CSP } : null;
}
// İşletme site haritası: dizine açık ana sayfa + açıklamalı hizmet sayfaları. Kendi alan adı varsa harita oradadır.
async function tenantUrls(req, slug) {
  if (!db.ready() || !SLUG.test(slug)) return null; const t = await tenantOf(slug); if (!t) return null;
  const live = await liveSite(t).catch(() => null); if (!live) return { urls: [], updated: null, home: null };
  const home = await homeUrl(req, t, live); return { urls: bizsite.sitemapUrls(live.data, siteCtx(t, live, home)), updated: live.updated, home, domain: live.domain || null };
}
async function tenantSitemap(req, slug) { const r = await tenantUrls(req, slug); if (!r) return null; if (r.domain) return { redirect: `${r.home}sitemap.xml` }; return { body: sitemapXml(r.urls, r.updated) }; }
// Sitesi yayında olmayan işletmenin yalın sayfası: içerik zayıftır, noindex. Kayıt bilgileri (telefon, adres) burada gösterilmez:
// kayıt telefonu işletme sahibinin kişisel numarası olabilir; yayınlanacak bilgi Web sitem ekranından bilerek girilir.
async function tenantPage(req, slug) {
  if (!db.ready() || !SLUG.test(slug)) return null;
  const t = await tenantOf(slug);
  if (!t) return null;
  const live = await liveSite(t).catch(() => null);
  if (live) return { html: siteHtml(t, live, await homeUrl(req, t, live)), csp: SITE_CSP };
  const pt = (await publicTenants()).find((x) => x.slug === slug);
  const apps = pt ? pt.apps : [];
  const B = await base(req); const s = await settings(); const brand = s.siteName || 'NEBSOFT';
  const url = `${B}/t/${t.slug}/`;
  const title = `${t.name} — Online hizmetler`;
  const desc = `${t.name} online hizmetleri${apps.length ? ': ' + apps.map((a) => PAGES[a][1]).join(', ') : ''}.`;
  const firstApp = apps[0] || 'pos';
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:light dark;--bg:#f6f7f9;--card:#fff;--t:#0f172a;--m:#64748b;--b:#e2e8f0;--a:#1d7bf5}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--card:#111a2e;--t:#e5e7eb;--m:#94a3b8;--b:#1f2a44}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--t);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.w{max-width:760px;margin:0 auto;padding:48px 16px}h1{font-size:clamp(28px,6vw,40px);line-height:1.15;margin:0 0 8px}
.m{color:var(--m)}.g{display:grid;gap:12px;margin:28px 0}a.c{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;background:var(--card);border:1px solid var(--b);border-radius:14px;color:inherit;text-decoration:none;font-weight:600}
a.c:hover{border-color:var(--a)}a.c span{color:var(--a)}.k{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:6px}.k a{color:var(--a)}
.p{margin-top:56px;padding-top:18px;border-top:1px solid var(--b);font-size:13px;color:var(--m)}.p a{color:var(--a)}
</style></head><body><main class="w">
<h1>${esc(t.name)}</h1>
<div class="g">${apps.map((a) => `<a class="c" href="/t/${t.slug}/apps/${a}/${PAGES[a][0]}">${esc(PAGES[a][1])}<span>→</span></a>`).join('') || '<p class="m">Online hizmetler yakında burada.</p>'}</div>
<p class="p">Bu sayfa <a href="/?ref=${esc(t.ref_code)}#/urun/${firstApp}">${esc(brand)}</a> ile hazırlandı. İşletmeniz için <a href="/?ref=${esc(t.ref_code)}#/urunler">${Number(s.trialDays) || 7} gün ücretsiz deneyin</a>.</p>
</main></body></html>`;
}

// Yönetim: arama motorlarına bildir
R.push({ method: 'POST', re: /^\/api\/admin\/seo\/ping$/, opt: { auth: 'admin', cloudOnly: true, limit: ['seo', 10, 3600e3] }, fn: async (c) => { const r = await pingIndexNow(c.req); if (r.ok) await setSetting('indexnow_son', { at: new Date().toISOString(), n: r.count }); return r; } });
R.push({ method: 'GET', re: /^\/api\/admin\/seo$/, opt: { auth: 'admin', cloudOnly: true }, fn: async (c) => ({ ok: true, base: await base(c.req), tenants: (await publicTenants()).length, key: await indexnowKey() }) });

// Web sitem → arama hazırlığı: yayındaki sayfa gerçekten üretilip okunur; sonuç tahmin değildir.
// Alan adı sınaması: https://<alan>/robots.txt bu sunucunun ürettiği Sitemap satırını döndürüyorsa bağlıdır.
async function domainProbe(domain) {
  const u = `https://${domain}/robots.txt`;
  if (!(await sec.publicUrl(u))) return { ok: false, error: 'Alan adı DNS’te bulunamadı veya dış adrese çözülmüyor.' };
  try {
    const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(6000) }); const x = r.status === 200 ? (await r.text()).slice(0, 2000) : '';
    if (x.includes(`Sitemap: https://${domain}/sitemap.xml`)) return { ok: true };
    return { ok: false, error: `Alan adı yanıt verdi (HTTP ${r.status}) ama bu siteye yönlenmiyor. DNS kaydını kontrol edin.` };
  } catch (e) { return { ok: false, error: 'https ile bağlanılamadı: DNS kaydı veya SSL sertifikası eksik olabilir.' }; }
}
R.push({ method: 'GET', re: /^\/api\/websitem\/hazirlik$/, opt: { auth: 'user', limit: ['wsh', 60, 3600e3] }, fn: async (c) => {
  if (!c.user.tenant_id) return { ok: false, error: 'İşletme hesabı gerekli' };
  const t = await db.one('SELECT id, name, slug, sector, ref_code FROM tenants WHERE id=?', [c.user.tenant_id]); const row = await db.one('SELECT domain FROM biz_sites WHERE tenant_id=?', [t.id]);
  const lic = (await db.q("SELECT product FROM licenses WHERE tenant_id=? AND status IN ('aktif','deneme') AND end>UTC_TIMESTAMP()", [t.id])).map((r) => r.product);
  const live = await liveSite(t); const out = { ok: true, sector: t.sector || '', apps: lic, live: null };
  if (live) { const url = await homeUrl(c.req, t, live); const ctx = siteCtx(t, live, url); const html = bizsite.render(live.data, ctx); const chk = bizsite.seoCheck(live.data, ctx); const urls = bizsite.sitemapUrls(live.data, ctx);
    out.live = { index: /<meta name="robots" content="index,follow">/.test(html), reasons: chk.reasons, url, sitemap: `${url}sitemap.xml`, urls: urls.length }; }
  if (row && row.domain) { const d = await domainProbe(row.domain); out.live = { ...(out.live || {}), domain: d }; }
  return out;
} });

module.exports = { tazele, domainProbe, base, rewrite, sitemap, robots, indexnowKey, pingIndexNow, tenantPage, tenantService, tenantSitemap, tenantUrls, domainSite, SITE_CSP, publicTenants, PAGES, PLACEHOLDER };
