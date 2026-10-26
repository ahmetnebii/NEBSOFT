// NEBSOFT Pazar — bağımlılıksız yerel sunucu + donanım/servis köprüsü.  Çalıştır: node server.js  →  http://localhost:5050
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
const kanal = require('./server/connectors');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5050;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', (c) => { size += c.length; if (size > 5e6) { reject(new Error('İstek çok büyük')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('Geçersiz JSON')); } });
});
// Köprü yalnızca bu bilgisayardan kullanılabilir
const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

async function api(req, res, p) {
  // Pazaryeri bildirimleri dışarıdan gelir; belirteçle korunur
  if (p.startsWith('/api/webhook/') && req.method === 'POST') {
    let body; try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const r = kanal.pushIn(p.slice('/api/webhook/'.length).replace(/\/$/, ''), new URL(req.url, 'http://x').searchParams.get('token') || req.headers['x-nebsoft-token'], body);
    return json(res, r.code, r.body);
  }
  if (!isLocal(req)) return json(res, 403, { ok: false, error: 'Köprü yalnızca yerel bilgisayardan kullanılabilir' });
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

  if (p === '/api/istek') {
    if (!/^https?:\/\//.test(b.url || '')) return json(res, 400, { ok: false, error: 'Geçerli bir url gerekli' });
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(b.url, { method: b.method || 'POST', headers: b.headers || {}, body: ['GET', 'HEAD'].includes(String(b.method).toUpperCase()) ? undefined : b.body, signal: ctrl.signal });
      clearTimeout(t);
      const text = await r.text();
      return json(res, 200, { ok: r.ok, status: r.status, body: text.slice(0, 500000) });
    } catch (e) { return json(res, 502, { ok: false, error: 'Servise ulaşılamadı: ' + e.message }); }
  }

  if (p === '/api/kanal') {
    if (!b.channel || !b.action) return json(res, 400, { ok: false, error: 'channel ve action gerekli' });
    return json(res, 200, await kanal.run(b.channel, b.action, b.creds || {}, b.payload || {}));
  }
  if (p === '/api/inbox') return json(res, 200, { ok: true, items: kanal.drain(String(b.channel || '')) });

  if (p === '/api/pos/satis') {
    // Demo terminal: 1,5 sn sonra onaylar. 13,13 ₺ gibi ",13" ile biten tutarlar test için reddedilir.
    await new Promise((r) => setTimeout(r, 1500));
    const amount = Number(b.amount) || 0;
    if (Math.round(amount * 100) % 100 === 13) return json(res, 200, { ok: false, error: 'Kart reddedildi (demo: yetersiz bakiye)' });
    return json(res, 200, { ok: true, ref: 'DEMO' + Date.now().toString().slice(-8), authCode: String(Math.floor(100000 + Math.random() * 899999)), card: '**** **** **** ' + String(Math.floor(1000 + Math.random() * 8999)) });
  }
  return json(res, 404, { ok: false, error: 'Bilinmeyen uç nokta' });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/')) return api(req, res, p).catch((e) => json(res, 500, { ok: false, error: e.message }));
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Yasak'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`NEBSOFT Pazar çalışıyor: http://localhost:${PORT}  (donanım/servis köprüsü: /api)`));
