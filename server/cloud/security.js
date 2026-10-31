// Güvenlik katmanı: HTTP güvenlik başlıkları, IP bazlı istek sınırlama, CSRF ve kaynak kontrolü,
// SSRF koruması (iç ağ adreslerine istek engeli), giriş doğrulama yardımcıları.
const dnsCb = require('dns');
const dns = dnsCb.promises;
const net = require('net');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const ip = (req) => (TRUST_PROXY && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress || '').replace(/^::ffff:/, '');
const isHttps = (req) => !!req.socket.encrypted || (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https');

// connect-src: dış servis istekleri /api/istek ve /api/kanal üzerinden sunucudan çıkar. Tarayıcının doğrudan bağlandığı tek adres EmailJS'tir (core/integrations.js, e-posta modu "emailjs").
function headers(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self), payment=(), usb=(self), serial=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', ["default-src 'self'", "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdnjs.cloudflare.com", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com", "font-src 'self' https://fonts.gstatic.com data:", "img-src 'self' data: blob: https:", "connect-src 'self' https://api.emailjs.com", "frame-src 'self' https://www.paytr.com", "frame-ancestors 'self'", "form-action 'self'", "base-uri 'self'", "object-src 'none'"].join('; '));
  if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

// Kayan pencere sınırlayıcı (bellekte). Çok sunuculu kurulumda nginx limit_req ile birlikte kullanın.
const buckets = new Map();
function limit(key, max, windowMs) {
  const now = Date.now(); let b = buckets.get(key);
  if (!b || now - b.t > windowMs) { b = { t: now, n: 0 }; buckets.set(key, b); }
  b.n++; return b.n <= max;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now - b.t > 3600e3) buckets.delete(k); }, 600e3).unref();

// Durum değiştiren isteklerde: aynı kaynak (Origin/Referer) ve özel başlık zorunlu. Böylece başka siteden form/istek gönderilemez.
function originOk(req) {
  const host = req.headers['x-forwarded-host'] && TRUST_PROXY ? req.headers['x-forwarded-host'] : req.headers.host;
  const src = req.headers.origin || req.headers.referer;
  if (!src) return true; // aynı kaynaklı fetch bazı tarayıcılarda Origin göndermez; özel başlık yeterli koruma sağlar
  try { return new URL(src).host === host; } catch (e) { return false; }
}
function sameOrigin(req) { return req.headers['x-ns-csrf'] === '1' && originOk(req); }

// Bozuk çerez (% kodlaması hatalı) isteği düşürmez, yok sayılır
function cookies(req) { const out = {}; String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* yok say */ } } }); return out; }
const safeEq = (a, b) => { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// SSRF: yalnız dış (internet) adreslere izin ver
function privateIp(a) {
  if (net.isIPv4(a)) { const [x, y, z] = a.split('.').map(Number); return x === 10 || x === 127 || x === 0 || (x === 169 && y === 254) || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || (x === 100 && y >= 64 && y <= 127) || (x === 192 && y === 0 && z === 0) || (x === 198 && (y === 18 || y === 19)) || x >= 224; }
  // ::ffff: eşlemesi, fc00::/7, fe80::/10, fec0::/10, çoklu yayın ve IPv4 gömen geçiş önekleri (NAT64, 6to4) iç ağa çıkabilir
  const l = a.toLowerCase(); return l === '::1' || l === '::' || /^f[cd]/.test(l) || /^fe[89a-f]/.test(l) || l.startsWith('ff') || l.startsWith('::ffff:') || l.startsWith('64:ff9b:') || l.startsWith('2002:');
}
async function publicUrl(u) {
  let url; try { url = new URL(u); } catch (e) { return false; }
  if (!['https:', 'http:'].includes(url.protocol)) return false;
  if (net.isIP(url.hostname)) return !privateIp(url.hostname);
  try { const addrs = await dns.lookup(url.hostname, { all: true }); return addrs.length && addrs.every((x) => !privateIp(x.address)); } catch (e) { return false; }
}

// DNS denetimi ile bağlantı arasında adres değişemesin (DNS rebinding): adres bağlantı anında çözülür, iç ağ adresi çıkarsa bağlantı kurulmaz
function guardedLookup(host, opts, cb) {
  const o = typeof opts === 'function' ? {} : opts || {}; const done = typeof opts === 'function' ? opts : cb;
  dnsCb.lookup(host, { all: true, family: o.family || 0 }, (e, addrs) => {
    if (e) return done(e);
    if (!addrs.length || addrs.some((x) => privateIp(x.address))) return done(Object.assign(new Error('İç ağ adresine istek atılamaz'), { code: 'ENOTPUBLIC' }));
    if (o.all) return done(null, addrs);
    done(null, addrs[0].address, addrs[0].family);
  });
}
// Dış servis isteği (yalnızca bulut köprüsü): yönlendirme izlenmez, yanıt boyutu sınırlıdır, adres bağlantı anında denetlenir
function safeFetch(u, { method = 'POST', headers = {}, body, timeout = 15000, maxBytes = 2e6, lookup = guardedLookup } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(u); const lib = url.protocol === 'https:' ? https : http; const h = {}; const has = (n) => Object.keys(h).some((k) => k.toLowerCase() === n);
    Object.entries(headers || {}).forEach(([k, v]) => { if (v != null && !/^(accept-encoding|content-length|host|connection|transfer-encoding)$/i.test(k)) h[k] = String(v); });
    const data = !['GET', 'HEAD'].includes(method) && body != null ? Buffer.from(String(body), 'utf8') : null;
    if (!has('user-agent')) h['User-Agent'] = 'NEBSOFT';
    if (!has('accept')) h.Accept = '*/*';
    if (data) { h['Content-Length'] = data.length; if (!has('content-type')) h['Content-Type'] = 'text/plain;charset=UTF-8'; }
    const r = lib.request(url, { method, headers: h, lookup, timeout }, (res) => {
      const chunks = []; let size = 0;
      res.on('data', (c) => { size += c.length; if (size > maxBytes) { res.destroy(); return; } chunks.push(c); });
      res.on('close', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', () => {}); // boyut sınırında destroy: eldeki parça döner
    });
    r.on('timeout', () => r.destroy(new Error('Zaman aşımı'))); r.on('error', reject);
    r.end(data || undefined);
  });
}

// Yerel köprü (yazıcı, terazi, Modbus, /api/istek) yalnızca bu bilgisayardaki arayüzden kullanılır. Engellenenler:
//  • vekil sunucudan gelen istek: nginx arkasında her istek 127.0.0.1'den görünür, soket adresine bakmak yetmez
//  • başka sitenin tarayıcıdan attığı istek (Origin) ve DNS rebinding (Host yerel ad değil)
const LOOPBACK = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
function bridgeDenied(req, cloudOn) {
  if (cloudOn || TRUST_PROXY) return 'bulut';
  if (!LOOPBACK.includes(req.socket.remoteAddress)) return 'uzak';
  if (['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip', 'forwarded', 'via'].some((k) => req.headers[k] !== undefined)) return 'vekil';
  const host = String(req.headers.host || ''); if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return 'host';
  const o = req.headers.origin; if (o !== undefined) { try { if (new URL(o).host !== host) return 'kaynak'; } catch (e) { return 'kaynak'; } }
  return null;
}
// Statik dosya yolu denetimi. req.url ham gelir (nginx de ham iletir): "..", ters bölü ve Windows'a özgü biçimler yol kuralını atlatamaz.
// Geçersizse null; geçerliyse yolun kendisi döner.
function safePath(p) {
  if (typeof p !== 'string' || !p.startsWith('/') || /[\\:*?"<>|\u0000-\u001f]/.test(p)) return null;
  return p.split('/').some((s) => s === '.' || s === '..' || /[. ]$/.test(s)) ? null : p;
}

const V = {
  email: (s) => typeof s === 'string' && s.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
  str: (s, max = 200, min = 0) => typeof s === 'string' && s.trim().length >= min && s.length <= max,
  phone: (s) => typeof s === 'string' && /^[+\d\s()-]{10,20}$/.test(s),
  iban: (s) => { const x = String(s || '').replace(/\s/g, '').toUpperCase(); if (!/^TR\d{24}$/.test(x)) return false; const r = (x.slice(4) + x.slice(0, 4)).replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55); let m = 0; for (const d of r) m = (m * 10 + Number(d)) % 97; return m === 1; },
  password: (s) => typeof s === 'string' && s.length >= 8 && s.length <= 128 && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s) && /\d/.test(s),
  app: (s) => typeof s === 'string' && /^[a-z][a-z0-9]{1,30}$/.test(s),
};
const clean = (s, max = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
module.exports = { ip, isHttps, headers, limit, sameOrigin, originOk, cookies, safeEq, publicUrl, privateIp, guardedLookup, safeFetch, bridgeDenied, safePath, V, clean };
