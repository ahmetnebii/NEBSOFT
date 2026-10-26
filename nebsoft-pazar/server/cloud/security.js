// Güvenlik katmanı: HTTP güvenlik başlıkları, IP bazlı istek sınırlama, CSRF ve kaynak kontrolü,
// SSRF koruması (iç ağ adreslerine istek engeli), giriş doğrulama yardımcıları.
const dns = require('dns').promises;
const net = require('net');

const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const ip = (req) => (TRUST_PROXY && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress || '').replace(/^::ffff:/, '');
const isHttps = (req) => !!req.socket.encrypted || (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https');

function headers(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self), payment=(), usb=(self), serial=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', ["default-src 'self'", "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com", "font-src 'self' https://fonts.gstatic.com data:", "img-src 'self' data: blob: https:", "connect-src 'self' https:", "frame-src 'self'", "frame-ancestors 'self'", "form-action 'self'", "base-uri 'self'", "object-src 'none'"].join('; '));
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
function sameOrigin(req) {
  if (req.headers['x-ns-csrf'] !== '1') return false;
  const host = req.headers['x-forwarded-host'] && TRUST_PROXY ? req.headers['x-forwarded-host'] : req.headers.host;
  const src = req.headers.origin || req.headers.referer;
  if (!src) return true; // aynı kaynaklı fetch bazı tarayıcılarda Origin göndermez; özel başlık yeterli koruma sağlar
  try { return new URL(src).host === host; } catch (e) { return false; }
}

function cookies(req) { const out = {}; String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return out; }

// SSRF: yalnız dış (internet) adreslere izin ver
function privateIp(a) {
  if (net.isIPv4(a)) { const [x, y] = a.split('.').map(Number); return x === 10 || x === 127 || x === 0 || (x === 169 && y === 254) || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || (x === 100 && y >= 64 && y <= 127) || x >= 224; }
  const l = a.toLowerCase(); return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:');
}
async function publicUrl(u) {
  let url; try { url = new URL(u); } catch (e) { return false; }
  if (!['https:', 'http:'].includes(url.protocol)) return false;
  if (net.isIP(url.hostname)) return !privateIp(url.hostname);
  try { const addrs = await dns.lookup(url.hostname, { all: true }); return addrs.length && addrs.every((x) => !privateIp(x.address)); } catch (e) { return false; }
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
module.exports = { ip, isHttps, headers, limit, sameOrigin, cookies, publicUrl, privateIp, V, clean };
