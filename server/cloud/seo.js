// Arama motoru görünürlüğü ve "kendi kendini pazarlayan" sistem:
//  • Alan adı yönetim panelindeki "Site adresi" ayarından gelir (tanıtım sitelerindeki yer tutucu sunarken değiştirilir)
//  • /sitemap.xml dinamiktir: ürün siteleri + /programlar + NEBSOFT kullanan her işletmenin herkese açık sayfası (/t/<işletme>/)
//  • /t/<işletme>/ : işletmenin müşterilerine açık hizmetlerini listeleyen, LocalBusiness şemalı sayfa (alt kısmında tavsiye bağlantısı)
//  • IndexNow: yeni/değişen adresler Bing, Yandex, Seznam vb. arama motorlarına anında bildirilir
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { R, site, valid, J, syncCatalog } = require('./routes');
const cat = require('./catalog');
const bizsite = require('../../core/bizsite');
const analitik = require('./analitik');
const tlf = (n) => new Intl.NumberFormat('tr-TR').format(n);

const PLACEHOLDER = 'https://www.domain.com';
const ROOT = path.join(__dirname, '..', '..');
// Müşteriye açık sayfalar (sorgu/kod gerektirmeyenler)
const PAGES = {
  randevu: ['book.html', 'Online randevu al', 'calendar'], servis: ['takip.html', 'Cihaz durumu sorgula', 'wrench'], kargo: ['takip.html', 'Kargo takip', 'truck'],
  veteriner: ['karne.html', 'Pati karnesi', 'paw'], otel: ['rezervasyon.html', 'Online rezervasyon', 'bed'], spor: ['uye.html', 'Üye girişi', 'dumbbell'],
  kurs: ['veli.html', 'Kurs veli portalı', 'book'], site: ['sakin.html', 'Sakin portalı', 'building'], kiralama: ['kirala.html', 'Araç kirala', 'car'],
  oto: ['arac.html', 'Aracım nerede?', 'car'], eczane: ['recete.html', 'Reçete ve stok sorgula', 'pill'], fabrika: ['bayi.html', 'Bayi portalı', 'factory'],
  toptan: ['bayi.html', 'Bayi sipariş', 'truck'], musavir: ['portal.html', 'Mükellef portalı', 'book'], muhasebe: ['cari.html', 'Cari hesap portalı', 'wallet'], hukuk: ['muvekkil.html', 'Müvekkil portalı', 'scale'],
  anaokulu: ['veli.html', 'Anaokulu veli portalı', 'heart'], emlak: ['ilan.html', 'İlanlarımız', 'home'], galeri: ['vitrin.html', 'Araç vitrini', 'car'],
  kuyumcu: ['ekran.html', 'Güncel altın fiyatları', 'coins'], eticaret: ['magaza.html', 'Online mağaza', 'bag'], bilet: ['bilet.html', 'Etkinlikler ve bilet', 'ticket'],
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let cache = { at: 0, s: null };
async function settings() {
  if (!db.ready()) return {};
  if (Date.now() - cache.at > 60e3) { try { cache = { at: Date.now(), s: await site() }; } catch (e) { cache.at = Date.now(); } }
  return cache.s || {};
}
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
async function rewrite(text, req) {
  const s = await settings();
  if (text.includes('www.domain.com')) { const B = await base(req); text = text.split(PLACEHOLDER).join(B).split('www.domain.com').join(B.replace(/^https?:\/\//, '')); }
  if (s.phone && s.phone !== BUILT.phone) text = text.split(telOf(BUILT.phone)).join(telOf(s.phone)).split(BUILT.phone).join(s.phone);
  if (s.email && s.email !== BUILT.email) text = text.split(BUILT.email).join(s.email);
  // Yönetim panelinde değişen fiyatlar
  if (text.includes('data-p="')) { try { await syncCatalog(); } catch (e) { /* yok */ } const ov = cat.overrides(); text = text.replace(/data-p="([a-z]+):(\d)">[^<]*</g, (m, id, i) => (ov[id] && ov[id].prices ? `data-p="${id}:${i}">${tlf(ov[id].prices[i])}<` : m));
    // Arama motoru şeması (JSON-LD) da aynı fiyatı göstersin
    const pid = (text.match(/data-p="([a-z]+):\d"/) || [])[1]; const pr = pid && ov[pid] && ov[pid].prices;
    if (pr) text = text.replace(/"lowPrice":\d+(\.\d+)?/, `"lowPrice":${pr[0]}`).replace(/"highPrice":\d+(\.\d+)?/, `"highPrice":${pr[2]}`); }
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
  xml = xml.split(PLACEHOLDER).join(B);
  const pts = await publicTenants(); const seen = new Set(pts.map((t) => t.slug));
  const sites = await db.q("SELECT t.slug, b.updated FROM biz_sites b JOIN tenants t ON t.id=b.tenant_id JOIN licenses l ON l.tenant_id=t.id AND l.product='eklenti-web' AND l.status IN ('aktif','deneme') AND l.end>UTC_TIMESTAMP() WHERE b.published=1 AND t.status='active'").catch(() => []);
  sites.forEach((x) => { if (!seen.has(x.slug)) { seen.add(x.slug); pts.push({ slug: x.slug, updated: x.updated }); } });
  const extra = pts.map((t) => `  <url><loc>${B}/t/${t.slug}/</loc><lastmod>${new Date(t.updated).toISOString().slice(0, 10)}</lastmod></url>`).join('\n');
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
  if (!/^https:\/\//.test(B) || B === PLACEHOLDER) return { ok: false, error: 'Önce Site Ayarları → Site adresi alanına https:// ile başlayan alan adınızı girin' };
  const list = urls && urls.length ? urls : [...(await sitemap(req)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(B).host, key, keyLocation: `${B}/${key}.txt`, urlList: list.slice(0, 10000) }), signal: AbortSignal.timeout(15000) });
  return { ok: res.status < 300, status: res.status, count: list.length };
}

// İşletme sayfası: /t/<işletme>/
// Web sitesi eklentisi etkin ve yayında ise işletmenin tam web sitesi
async function liveSite(t) {
  const s = await db.one('SELECT data, published, domain FROM biz_sites WHERE tenant_id=?', [t.id]); if (!s || !s.published) return null;
  const on = async (p) => !!(await db.one("SELECT id FROM licenses WHERE tenant_id=? AND product=? AND status IN ('aktif','deneme') AND end>UTC_TIMESTAMP()", [t.id, p]));
  if (!(await on('eklenti-web'))) return null;
  return { data: J(s.data, {}), domain: s.domain, orderable: await on('eklenti-siparis') };
}
// Google Haritalar gömülü haritası için yalnızca bu sayfalarda çerçeve izni
const SITE_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none'";
async function siteHtml(req, t, live, url) { const s = await settings(); return bizsite.render(live.data, { url, slug: t.slug, orderable: live.orderable, ref: `/?ref=${t.ref_code || ''}#/eklentiler` }); }
// Özel alan adı: Host başlığı bir işletmenin alan adıysa o işletmenin sitesi sunulur
const domCache = new Map();
async function domainSite(req, p) {
  if (!db.ready()) return null; const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, ''); if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
  let hit = domCache.get(host); if (!hit || Date.now() - hit.at > 60e3) { const r = await db.one("SELECT t.id, t.name, t.slug, t.ref_code FROM biz_sites b JOIN tenants t ON t.id=b.tenant_id WHERE (b.domain=? OR b.domain=?) AND t.status='active'", [host, host.replace(/^www\./, '')]); hit = { at: Date.now(), t: r || null }; domCache.set(host, hit); }
  if (!hit.t) return null; const live = await liveSite(hit.t); if (!live) return null;
  const B = (req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? 'https://' : 'http://') + req.headers.host;
  if (p === '/' || p === '/index.html') return { type: 'text/html; charset=utf-8', csp: SITE_CSP, body: await siteHtml(req, hit.t, live, B + '/') };
  if (p === '/sitemap.xml') return { type: 'application/xml; charset=utf-8', body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${B}/</loc></url></urlset>\n` };
  if (p === '/robots.txt') return { type: 'text/plain; charset=utf-8', body: `User-agent: *\nAllow: /\nSitemap: ${B}/sitemap.xml\n` };
  return null;
}
async function tenantPage(req, slug) {
  if (!db.ready() || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const t = await db.one("SELECT id, name, slug, phone, address, city, sector, ref_code FROM tenants WHERE slug=? AND status='active'", [slug]);
  if (!t) return null;
  const live = await liveSite(t).catch(() => null);
  if (live) { const B0 = await base(req); return { html: await siteHtml(req, t, live, live.domain ? `https://${live.domain}/` : `${B0}/t/${t.slug}/`), csp: SITE_CSP }; }
  const pt = (await publicTenants()).find((x) => x.slug === slug);
  const apps = pt ? pt.apps : [];
  const B = await base(req); const s = await settings(); const brand = s.siteName || 'NEBSOFT';
  const url = `${B}/t/${t.slug}/`;
  const title = `${t.name}${t.city ? ' · ' + t.city : ''} — Online hizmetler`;
  const desc = `${t.name} online hizmetleri: ${apps.map((a) => PAGES[a][1]).join(', ') || 'iletişim bilgileri'}.${t.phone ? ' Telefon: ' + t.phone + '.' : ''}`;
  const schema = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: t.name, url, telephone: t.phone || undefined, address: t.address || t.city ? { '@type': 'PostalAddress', streetAddress: t.address || undefined, addressLocality: t.city || undefined, addressCountry: 'TR' } : undefined };
  const firstApp = apps[0] || 'pos';
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
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
<div class="m">${esc([t.address, t.city].filter(Boolean).join(', '))}</div>
<div class="k">${t.phone ? `<a href="tel:${esc(String(t.phone).replace(/[^\d+]/g, ''))}">${esc(t.phone)}</a>` : ''}${t.address || t.city ? `<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([t.name, t.address, t.city].filter(Boolean).join(' '))}">Yol tarifi</a>` : ''}</div>
<div class="g">${apps.map((a) => `<a class="c" href="/t/${t.slug}/apps/${a}/${PAGES[a][0]}">${esc(PAGES[a][1])}<span>→</span></a>`).join('') || '<p class="m">Online hizmetler yakında burada.</p>'}</div>
<p class="p">Bu sayfa <a href="/?ref=${esc(t.ref_code)}#/urun/${firstApp}">${esc(brand)}</a> ile hazırlandı. İşletmeniz için <a href="/?ref=${esc(t.ref_code)}#/urunler">${Number(s.trialDays) || 7} gün ücretsiz deneyin</a>.</p>
</main></body></html>`;
}

// Yönetim: arama motorlarına bildir
R.push({ method: 'POST', re: /^\/api\/admin\/seo\/ping$/, opt: { auth: 'admin', cloudOnly: true, limit: ['seo', 10, 3600e3] }, fn: async (c) => pingIndexNow(c.req) });
R.push({ method: 'GET', re: /^\/api\/admin\/seo$/, opt: { auth: 'admin', cloudOnly: true }, fn: async (c) => ({ ok: true, base: await base(c.req), tenants: (await publicTenants()).length, key: await indexnowKey() }) });

module.exports = { base, rewrite, sitemap, robots, indexnowKey, pingIndexNow, tenantPage, domainSite, SITE_CSP, publicTenants, PAGES, PLACEHOLDER };
