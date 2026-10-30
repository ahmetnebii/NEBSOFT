// NEBSOFT Pazar — web sunucusu, bulut API'si (MySQL) ve donanım/servis köprüsü.  Çalıştır: npm install && node server.js
// Bulut API: server/cloud (kurulum /admin/ üzerinden). Veritabanı yapılandırılmamışsa sistem yerel demo modunda çalışır.
//
// Köprü uç noktaları (tarayıcının yapamadığı işleri yapar):
//   GET  /api/durum              → köprü çalışıyor mu
//   POST /api/yazdir             → { host, port, data(base64) } ağ fiş/etiket yazıcısına ham ESC/POS veya ZPL gönderir
//   POST /api/istek              → { url, method, headers, body } SMS, e-Fatura, WhatsApp gibi servislere sunucu tarafından istek atar (CORS engeli olmaz)
//   POST /api/pos/satis          → { amount, installment } demo ödeme terminali (gerçek cihazda üretici SDK'sı ile değiştirilir)
//   POST /api/kanal              → { channel, action, creds, payload } pazaryeri API adaptörü (server/connectors)
//   GET  /api/kanal              → desteklenen kanallar, işlemler ve webhook adresi
//   POST /api/inbox              → { channel } webhook ile gelen siparişleri okur ve kutuyu boşaltır
//   POST /api/webhook/<kanal>?token=…  → (dışarıdan erişilebilir) Getir, Yemeksepeti, Trendyol vb. sipariş bildirimleri
const http = require('http');
const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const kanal = require('./server/connectors');
const proto = require('./server/bridge-proto');
const cloud = require('./server/cloud');
const sec = require('./server/cloud/security');
const log = require('./server/cloud/log');
const cfg = require('./server/cloud/config');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5050;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.apk': 'application/vnd.android.package-archive',
};

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', (c) => { size += c.length; if (size > 5e6) { reject(new Error('İstek çok büyük')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('Geçersiz JSON')); } });
});

async function api(req, res, p) {
  // Pazaryeri bildirimleri dışarıdan gelir; belirteçle korunur
  if (p.startsWith('/api/webhook/') && req.method === 'POST') {
    let body; try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const r = kanal.pushIn(p.slice('/api/webhook/'.length).replace(/\/$/, ''), new URL(req.url, 'http://x').searchParams.get('token') || req.headers['x-nebsoft-token'], body);
    return json(res, r.code, r.body);
  }
  // Köprü yalnızca bu bilgisayardan ve veritabanısız yerel kurulumda kullanılabilir (bulut sunucusunda hiç açılmaz; veritabanı geçici koptuğunda da)
  if (sec.bridgeDenied(req, cloud.db.ready() || cfg.configured())) return json(res, 403, { ok: false, error: 'Köprü yalnızca yerel bilgisayardan kullanılabilir' });
  if (p === '/api/durum') return json(res, 200, { ok: true, version: '1.1', node: process.version, kanal: kanal.info() });
  if (p === '/api/kanal' && req.method === 'GET') return json(res, 200, { ok: true, ...kanal.info(), webhook: `/api/webhook/<kanal>?token=${kanal.token()}` });
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST bekleniyor' });
  let b;
  try { b = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }

  if (p === '/api/yazdir') {
    if (!b.host || !b.data) return json(res, 400, { ok: false, error: 'host ve data gerekli' });
    const sock = net.createConnection({ host: b.host, port: Number(b.port) || 9100 });
    let done = false;
    const finish = (code, obj) => { if (done) return; done = true; sock.destroy(); json(res, code, obj); };
    sock.setTimeout(6000, () => finish(504, { ok: false, error: 'Yazıcı yanıt vermedi (zaman aşımı)' }));
    sock.on('error', (e) => finish(502, { ok: false, error: 'Yazıcıya bağlanılamadı: ' + e.message }));
    sock.on('connect', () => sock.write(Buffer.from(b.data, 'base64'), () => { sock.end(); finish(200, { ok: true }); }));
    return;
  }

  // Kurulum sihirbazı: yerel ağdaki cihaza (yazıcı, terazi indikatörü) TCP bağlantısı açılıp hemen kapatılır; veri gönderilmez.
  // Yalnızca özel ağ adresleri (10.x, 172.16-31.x, 192.168.x, 127.x) kabul edilir — internete port taraması yapılamaz.
  // Kantar / terazi indikatörü: yerel ağdaki cihaza bağlanıp en fazla 3 sn gelen veriyi döndürür (istenirse önce komut gönderir)
  if (p === '/api/tcp-oku') {
    const host = String(b.host || ''); const port = Number(b.port) || 0;
    if (!/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)(\d{1,3}\.){1,2}\d{1,3}$/.test(host) || port < 1 || port > 65535) return json(res, 400, { ok: false, error: 'Yalnızca yerel ağ IP adresi ve geçerli port kabul edilir' });
    const sock = net.createConnection({ host, port }); let buf = ''; let done = false;
    const fin = (o) => { if (done) return; done = true; sock.destroy(); json(res, 200, o); };
    sock.setTimeout(4000, () => fin(buf ? { ok: true, text: buf.slice(0, 4000) } : { ok: false, error: 'İndikatör veri göndermedi (zaman aşımı)' }));
    sock.on('error', (e) => fin({ ok: false, error: 'İndikatöre bağlanılamadı: ' + (e.code || e.message) }));
    sock.on('connect', () => { if (b.request) sock.write(b.request === 'ENQ' ? '\x05' : String(b.request) + '\r\n'); setTimeout(() => fin(buf ? { ok: true, text: buf.slice(0, 4000) } : { ok: false, error: 'İndikatör veri göndermedi' }), 3000); });
    sock.on('data', (d) => { buf += d.toString('latin1'); if (buf.length > 4000) fin({ ok: true, text: buf.slice(0, 4000) }); });
    return;
  }
  if (p === '/api/tcp-test') {
    const host = String(b.host || ''); const port = Number(b.port) || 9100;
    if (!/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)(\d{1,3}\.){1,2}\d{1,3}$/.test(host) || port < 1 || port > 65535) return json(res, 400, { ok: false, code: 'EINVAL', error: 'Yalnızca yerel ağ IP adresi ve geçerli port kabul edilir' });
    const t0 = Date.now(); const sock = net.createConnection({ host, port }); let done = false;
    const fin = (o) => { if (done) return; done = true; sock.destroy(); json(res, 200, { ...o, ms: Date.now() - t0 }); };
    sock.setTimeout(4000, () => fin({ ok: false, code: 'ETIMEDOUT', error: 'Cihaz 4 saniye içinde yanıt vermedi (zaman aşımı)' }));
    sock.on('error', (e) => fin({ ok: false, code: e.code || 'ERR', error: e.code === 'ECONNREFUSED' ? 'Cihaz bağlantıyı reddetti (port kapalı)' : 'Cihaza bağlanılamadı: ' + e.message }));
    sock.on('connect', () => fin({ ok: true }));
    return;
  }
  // Makine verisi: Modbus TCP (yalnızca yerel ağ) ve MQTT aracısı
  if (p === '/api/modbus') return json(res, 200, await proto.modbus(b));
  if (p === '/api/mqtt') return json(res, 200, await proto.mqtt(b));
  if (p === '/api/istek') {
    if (!/^https?:\/\//.test(b.url || '')) return json(res, 400, { ok: false, error: 'Geçerli bir url gerekli' });
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(b.url, { method: b.method || 'POST', headers: b.headers || {}, body: ['GET', 'HEAD'].includes(String(b.method).toUpperCase()) ? undefined : b.body, signal: ctrl.signal });
      clearTimeout(t);
      const text = await r.text();
      return json(res, 200, { ok: r.ok, status: r.status, body: text.slice(0, 500000) });
    } catch (e) { return json(res, 502, { ok: false, error: 'Servise ulaşılamadı: ' + e.message + (e.cause && e.cause.code ? ' (' + e.cause.code + ')' : '') }); }
  }

  if (p === '/api/kanal') {
    if (!b.channel || !b.action) return json(res, 400, { ok: false, error: 'channel ve action gerekli' });
    return json(res, 200, await kanal.run(b.channel, b.action, b.creds || {}, b.payload || {}));
  }
  if (p === '/api/inbox') return json(res, 200, { ok: true, items: kanal.drain(String(b.channel || '')) });

  if (p === '/api/pos/satis') {
    // Test terminali: gerçek çekim yapmaz, sonuç her yerde TEST görünür. 1,5 sn sonra onaylar. 13,13 ₺ gibi ",13" ile biten tutarlar test için reddedilir.
    await new Promise((r) => setTimeout(r, 1500));
    const amount = Number(b.amount) || 0;
    if (Math.round(amount * 100) % 100 === 13) return json(res, 200, { ok: false, error: 'Kart reddedildi (demo: yetersiz bakiye)' });
    return json(res, 200, { ok: true, test: true, ref: 'TEST' + Date.now().toString().slice(-8), authCode: 'TEST', card: 'TEST kart' });
  }
  return json(res, 404, { ok: false, error: 'Bilinmeyen uç nokta' });
}

const SITES = new Set(fs.existsSync(path.join(ROOT, 'site')) ? fs.readdirSync(path.join(ROOT, 'site')).filter((d) => fs.existsSync(path.join(ROOT, 'site', d, 'index.html'))) : []);
// Dışarıya asla sunulmayacak yollar (sunucu kodu, veriler, gizli dosyalar, araçlar)
const DENY = /^\/(data|config|server|node_modules|site\/tools|site\/src|awesome-claude-design|docs|desktop|android|scripts|yayin|ic-araclar|\.[^/]*)(\/|$)|^\/(server\.js|sunucu\.json|package(-lock)?\.json|skills-lock\.json|baslat\.bat)$|\.(md|bat|sh|test\.js)$|\/\.[^/]+$/i;
const LONG = /\.(jpg|jpeg|png|webp|svg|ico|woff2?)$/i;
// Adresi sonda / ile biten statik sayfalar (program sayfaları ve /programlar eski biçimde kalır: sonda / yok)
const SLASHED = new Set(['fiyatlar', 'kvkk', 'gizlilik', 'mesafeli-satis', 'iade', 'cerez', 'kayit', 'rehber']);
const GZ = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/; // sıkıştırılacak türler
const canGz = (req, type, size) => size >= 1024 && GZ.test(type) && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));

function handle(req, res) {
  sec.headers(req, res);
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end('Geçersiz adres'); }
  if (p.includes('\0')) { res.writeHead(400); return res.end('Geçersiz adres'); }
  if (/[?&]demo=1(&|$)/.test(req.url)) res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // demo verisi dizine girmez
  // API dışındaki adreslerde ham ".." ve ters bölü kabul edilmez; nginx de isteği ham iletir (proxy_pass URI'siz)
  if (!p.startsWith('/api/') && !sec.safePath(p)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
  if (p.startsWith('/api/')) {
    return cloud.handle(req, res, p).then((done) => { if (!done) return api(req, res, p); }).catch((e) => { log.uygulama.hata('sunucu.istek', { hata: e }); json(res, 500, { ok: false, error: 'Beklenmeyen bir hata oluştu' }); });
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  if (p === '/.well-known/assetlinks.json') { const f = path.join(ROOT, 'data', 'assetlinks.json'); return fs.readFile(f, 'utf8', (e, t) => { if (e) { res.writeHead(404); return res.end(); } sendText(req, res, t, 'application/json; charset=utf-8', 'public, max-age=3600'); }); }
  if (DENY.test(p)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
  // Bulutta işletme sahibi uygulamayı /t/<işletme>/apps/... adresinde kullanır (paylaşılan linkler ve QR kodlar işletmeyi taşır)
  const am = /^\/apps\/([a-z0-9]+)\/(index\.html)?$/.exec(p);
  if (am && cloud.db.ready() && !/[?&]demo=1/.test(req.url)) {
    return cloud.tenantSlug(req).then((slug) => {
      if (slug) { res.writeHead(302, { Location: `/t/${slug}${p}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}` }); return res.end(); }
      serve(req, res, p);
    }).catch(() => serve(req, res, p));
  }
  // İşletme adresi: /t/<işletme>/apps/... aynı dosyaları sunar; işletme bilgisi sayfadaki betik tarafından okunur
  const tm = /^\/t\/([a-z0-9-]{1,80})(\/.*)?$/.exec(p);
  if (tm) {
    if (!tm[2] || tm[2] === '/') { // işletmenin herkese açık sayfası
      if (!tm[2]) { res.writeHead(301, { Location: `/t/${tm[1]}/` }); return res.end(); }
      return cloud.seo.tenantPage(req, tm[1]).then((r) => { const html = r && typeof r === 'object' ? r.html : r; if (r && r.csp) res.setHeader('Content-Security-Policy', r.csp); if (!html) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); } sendText(req, res, html, 'text/html; charset=utf-8', 'no-cache'); }).catch(() => { res.writeHead(500); res.end(); });
    }
    // İşletme sitemap'i ve hizmet sayfaları sunucuda üretilir (ana sitemap'e düşmez)
    const NF = () => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Bulunamadı'); };
    if (tm[2] === '/sitemap.xml') return cloud.seo.tenantSitemap(req, tm[1]).then((r) => { if (!r) return NF(); if (r.redirect) { res.writeHead(301, { Location: r.redirect }); return res.end(); } sendText(req, res, r.body, 'application/xml; charset=utf-8', 'public, max-age=3600'); }).catch(() => { res.writeHead(500); res.end(); });
    const sv = /^\/hizmet\/([a-z0-9-]{1,80})(\/?)$/.exec(tm[2]);
    if (sv) { if (!sv[2]) { res.writeHead(301, { Location: `/t/${tm[1]}${tm[2]}/` }); return res.end(); } return cloud.seo.tenantService(req, tm[1], sv[1]).then((r) => { if (!r) return NF(); res.setHeader('Content-Security-Policy', r.csp); sendText(req, res, r.html, 'text/html; charset=utf-8', 'no-cache'); }).catch(() => { res.writeHead(500); res.end(); }); }
    p = tm[2]; if (DENY.test(p)) { res.writeHead(404); return res.end(); }
    if (/^\/apps\/[a-z0-9]+\/(index\.html)?$/.test(p)) res.setHeader('X-Robots-Tag', 'noindex'); // programın giriş ekranı arama sonucuna girmez
  }
  // PWA manifest: ?app=pos gibi programa özel ad, renk ve açılış adresi (ana ekrana eklenince doğrudan o program açılır)
  if (p === '/manifest.webmanifest') {
    let app = null; try { app = new URL(req.url, 'http://x').searchParams.get('app'); } catch (e) { /* yok */ }
    const pr = app && /^[a-z0-9]{2,20}$/.test(app) ? require('./server/cloud/catalog').load().products.find((x) => x.id === app) : null;
    const m = { name: pr ? `${pr.name} · NEBSOFT` : 'NEBSOFT', short_name: pr ? pr.name.split(/[ &]/)[0] : 'NEBSOFT', id: pr ? `/apps/${pr.id}/` : '/', start_url: pr ? `/apps/${pr.id}/` : '/#/programlarim', scope: '/', display: 'standalone', background_color: '#09090b', theme_color: pr ? pr.accent || '#4f46e5' : '#4f46e5', lang: 'tr', description: pr ? pr.tagline : 'İşletme programlarınız tek uygulamada',
      icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/assets/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' }, { src: '/assets/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
    return sendText(req, res, JSON.stringify(m), 'application/manifest+json', 'public, max-age=3600');
  }
  // Dinamik SEO dosyaları (alan adı panel ayarından)
  if (p === '/sitemap.xml') return cloud.seo.sitemap(req).then((x) => sendText(req, res, x, 'application/xml; charset=utf-8', 'public, max-age=3600')).catch(() => { res.writeHead(500); res.end(); });
  if (p === '/robots.txt') return cloud.seo.robots(req).then((x) => sendText(req, res, x, 'text/plain; charset=utf-8', 'public, max-age=3600')).catch(() => { res.writeHead(500); res.end(); });
  if (/^\/[0-9a-f]{32}\.txt$/.test(p) && cloud.db.ready()) return cloud.seo.indexnowKey().then((k) => { if (p !== `/${k}.txt`) { res.writeHead(404); return res.end(); } sendText(req, res, k, 'text/plain; charset=utf-8', 'public, max-age=86400'); });
  serve(req, res, p);
}
// İşletmenin kendi alan adı (web sitesi eklentisi): kök sayfa, site haritası ve robots o işletmeye aittir; diğer her şey normal akar
const server = http.createServer((req, res) => {
  const p0 = req.url.split('?')[0];
  if (['GET', 'HEAD'].includes(req.method) && cloud.db.ready() && (['/', '/index.html', '/sitemap.xml', '/robots.txt'].includes(p0) || /^\/hizmet\/[a-z0-9-]{1,80}\/?$/.test(p0))) {
    sec.headers(req, res);
    return cloud.seo.domainSite(req, p0).then((x) => { if (!x) return handle(req, res); if (x.redirect) { res.writeHead(301, { Location: x.redirect }); return res.end(); } if (x.csp) res.setHeader('Content-Security-Policy', x.csp); sendText(req, res, x.body, x.type, 'no-cache'); }).catch(() => handle(req, res));
  }
  handle(req, res);
});

function sendText(req, res, text, type, cache) {
  const etag = `W/"${crypto.createHash('sha1').update(text).digest('base64url').slice(0, 20)}"`;
  const h = { 'Content-Type': type, ETag: etag, 'Cache-Control': cache, Vary: 'Accept-Encoding' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
  const gz = canGz(req, type, Buffer.byteLength(text)) ? zlib.gzipSync(text) : null; const body = gz || text;
  res.writeHead(200, { ...h, ...(gz ? { 'Content-Encoding': 'gzip' } : {}), 'Content-Length': Buffer.byteLength(body) }); res.end(req.method === 'HEAD' ? undefined : body);
}

// Statik dosyalar ve tanıtım siteleri
function serve(req, res, p) {
  // Tanıtım siteleri: /randevusistemi → site/randevusistemi/index.html (görseller /randevusistemi/img/…)
  const seg = p.split('/')[1] || '';
  const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  // Aynı sayfanın /site/... kopyası ayrı adres olarak görünmesin
  const dup = /^\/site\/([a-z0-9-]+)\/(?:([a-z0-9-]+)\/)?(index\.html)?$/.exec(p);
  if (dup && SITES.has(dup[1]) && (!dup[2] || dup[1] === 'rehber')) { res.writeHead(301, { Location: `/${dup[1]}${dup[2] ? '/' + dup[2] : ''}${SLASHED.has(dup[1]) ? '/' : ''}${q}` }); return res.end(); }
  if (SLASHED.has(seg) && SITES.has(seg)) {
    if (p === '/' + seg || /^\/rehber\/[a-z0-9-]+$/.test(p)) { res.writeHead(301, { Location: p + '/' + q }); return res.end(); }
    p = '/site' + p;
  } else if (/^[a-z0-9-]+$/.test(seg) && SITES.has(seg)) {
    if (p === '/' + seg + '/') { res.writeHead(301, { Location: '/' + seg }); return res.end(); }
    p = '/site' + (p === '/' + seg ? p + '/index.html' : p);
  }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || DENY.test('/' + path.relative(ROOT, file).split(path.sep).join('/'))) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
    const ext = path.extname(file).toLowerCase();
    const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const type = TYPES[ext] || 'application/octet-stream'; const gz = canGz(req, type, st.size);
    // Sürüm parametreli CSS (?v=<özet>) içerik değişince adresi de değiştiği için uzun süre önbellekte kalabilir
    const cache = ext === '.html' ? 'no-cache' : ext === '.css' && /[?&]v=[0-9a-f]{6,}/.test(req.url) ? 'public, max-age=31536000, immutable' : LONG.test(ext) ? 'public, max-age=604800' : 'public, max-age=300, must-revalidate';
    const h = { 'Content-Type': type, ETag: etag, 'Cache-Control': cache, ...(GZ.test(type) ? { Vary: 'Accept-Encoding' } : {}) };
    // Tanıtım sitelerinde alan adı yer tutucusu panel ayarındaki adresle değiştirilir
    if (ext === '.html' && (p.startsWith('/site/') || p === '/index.html')) return fs.readFile(file, 'utf8', (er, txt) => { if (er) { res.writeHead(500); return res.end(); } cloud.seo.rewrite(txt, req).then((t) => cloud.guven.inject(t, p)).then((t) => sendText(req, res, t, h['Content-Type'], h['Cache-Control'])); });
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    res.writeHead(200, gz ? { ...h, 'Content-Encoding': 'gzip' } : { ...h, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    if (gz) return fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    fs.createReadStream(file).pipe(res);
  });
}
server.requestTimeout = 60000; server.headersTimeout = 20000; server.keepAliveTimeout = 65000;
if (process.env.NODE_ENV === 'production' && !process.env.NEBSOFT_SECRET) log.uygulama.uyari('sunucu.anahtar', { mesaj: 'NEBSOFT_SECRET tanımlı değil — şifreleme anahtarı data/secret.key dosyasında; bu dosyayı yedekleyin (kaybolursa veritabanı bağlantı ayarı çözülemez).' });
process.on('unhandledRejection', (e) => log.uygulama.hata('sunucu.soz', { mesaj: 'İşlenmemiş söz', hata: e }));
process.on('uncaughtException', (e) => { log.uygulama.hata('sunucu.istisna', { mesaj: 'Yakalanmamış istisna, yeniden başlatılmak üzere çıkılıyor', hata: e }); setTimeout(() => process.exit(1), 200); }); // systemd/pm2 otomatik yeniden başlatır
// Düzgün kapanma (systemd / pm2 yeniden başlatmalarında yarım kalan istek olmasın)
const stop = (sig) => { log.uygulama.bilgi('sunucu.kapaniyor', { mesaj: `${sig} alındı, kapanıyor…` }); server.close(() => { cloud.analitik.bosalt().catch(() => {}).finally(() => cloud.db.close().finally(() => process.exit(0))); }); setTimeout(() => process.exit(0), 10000).unref(); };
process.on('SIGTERM', () => stop('SIGTERM')); process.on('SIGINT', () => stop('SIGINT'));
cloud.init().catch((e) => log.uygulama.hata('sunucu.bulut', { mesaj: 'Bulut başlatılamadı', hata: e }));
server.listen(PORT, process.env.HOST || '0.0.0.0', () => console.log(`NEBSOFT çalışıyor: http://localhost:${PORT}`));
