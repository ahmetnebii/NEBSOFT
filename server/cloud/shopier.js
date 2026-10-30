// Shopier REST API istemcisi ve ödeme eşleştirme kuralları (veritabanına dokunmaz; akış server/cloud/odeme.js'tedir).
// Kaynaklar ve doğrulama durumu: docs/SHOPIER-DOGRULAMA.md. Sandbox yok; gerçek hesapla denenene kadar müşteriye açılmaz.
// PAT hiçbir hata metnine, loga veya yanıta yazılmaz: yalnızca bu dosyadaki Authorization başlığında kullanılır.
const crypto = require('crypto');

const PROD = 'https://api.shopier.com/v1';
// Test için sahte sunucu adresi: üretimde (NODE_ENV=production) ortam değişkeni yok sayılır, PAT başka adrese gidemez
const custom = () => (process.env.NODE_ENV !== 'production' && process.env.SHOPIER_API_BASE) || '';
const base = () => custom() || PROD;
const TIMEOUT = () => Number(process.env.SHOPIER_TIMEOUT_MS) || 10000;
const WAIT_MAX = 3; // 429'da bu kadar saniyeye kadar bekleyip yeniden dener; daha uzunsa çağırana hata döner (müşteri ekranı bekletilmez)
let blockedUntil = 0; // 429 sonrası Retry-After dolana kadar yeni istek atılmaz

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class ShopierError extends Error { constructor(msg, status, retryAfter) { super(msg); this.name = 'ShopierError'; this.status = status || 0; this.retryAfter = retryAfter || 0; } }
const MSG = { 400: 'Shopier isteği kabul etmedi (eksik veya hatalı alan)', 401: 'Shopier anahtarı (PAT) geçersiz', 403: 'Shopier bu işlem için yetki vermedi', 404: 'Shopier kaydı bulunamadı', 429: 'Shopier istek sınırına takıldı' };
const msgOf = (st) => MSG[st] || (st >= 500 ? 'Shopier geçici olarak yanıt vermiyor' : `Shopier beklenmeyen yanıt verdi (${st})`);

async function once(pat, method, path, body) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), TIMEOUT());
  try {
    const r = await fetch(base() + path, { method, headers: { Authorization: `Bearer ${pat}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal, redirect: 'error' });
    const text = await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    return { status: r.status, data, retryAfter: Number(r.headers.get('retry-after')) || 0 };
  } catch (e) { throw new ShopierError(e.name === 'AbortError' ? 'Shopier zaman aşımına uğradı' : 'Shopier’e ulaşılamadı', 0); } finally { clearTimeout(t); }
}
// 429: yalnızca istek işlenmediği için her yöntemde yeniden denenir. Zaman aşımı/5xx: yalnızca GET yeniden denenir (POST ikinci ürün açabilir).
async function call(pat, method, path, body) {
  if (!pat) throw new ShopierError('Shopier anahtarı (PAT) tanımlı değil', 401);
  if (Date.now() < blockedUntil) throw new ShopierError(MSG[429], 429, Math.ceil((blockedUntil - Date.now()) / 1000));
  for (let i = 0; ; i++) {
    let r;
    try { r = await once(pat, method, path, body); } catch (e) { if (method === 'GET' && i < 1) { await sleep(300); continue; } throw e; }
    if (r.status >= 200 && r.status < 300) return r.data;
    if (r.status === 429) {
      const ra = r.retryAfter || 1; blockedUntil = Date.now() + ra * 1000;
      if (i < 2 && ra <= WAIT_MAX) { await sleep(ra * 1000); blockedUntil = 0; continue; }
      throw new ShopierError(MSG[429], 429, ra);
    }
    if (r.status >= 500 && method === 'GET' && i < 1) { await sleep(300); continue; }
    throw new ShopierError(msgOf(r.status), r.status);
  }
}

// Webhook imzası: HMAC-SHA256, anahtar webhook token'ı, veri ham gövde, çıktı onaltılık (Shopier PHP/Python tarifleri)
function verifySignature(raw, signature, token) {
  const h = String(signature || '').trim(); if (!token || !raw || !/^[0-9a-f]{64}$/i.test(h)) return false;
  const want = crypto.createHmac('sha256', token).update(raw).digest();
  return crypto.timingSafeEqual(want, Buffer.from(h, 'hex'));
}
// Tutarlar kayan noktaya çevrilmez: "1199.40" → 119940 kuruş. Biçim bozuksa NaN döner ve eşleşme reddedilir.
function kurus(v) {
  const s = typeof v === 'number' ? (Number.isFinite(v) ? v.toFixed(2) : '') : String(v == null ? '' : v).trim();
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s); if (!m) return NaN;
  return Number(m[1]) * 100 + Number((m[2] || '0').padEnd(2, '0'));
}
const tl = (k) => (Number.isNaN(k) ? '?' : (k / 100).toFixed(2));

// Tek adetlik ödeme ürünü. Fiyat KDV dahil sipariş toplamıdır; vatPercent gönderilmez (üstüne KDV ekleyip eklemediği belgelenmemiş).
// Tutara dahil destek paketi ödeme sayfasında ayrı yazılır
const destekNotu = (o) => { let l = null; try { l = JSON.parse(o.items || '[]').find((i) => i.type === 'support'); } catch (e) { /* kalem okunamadı */ } return l ? ` Tutara ${l.name} (${l.period === 'yillik' ? 'yıllık' : 'aylık'}) ${Number(l.price).toFixed(2)} TL + KDV dahildir.` : ''; };
const productBody = (o, imageUrl) => ({ title: `NEBSOFT yazılım lisansı ${o.no}`, description: `NEBSOFT sipariş no: ${o.no}.${destekNotu(o)} Bu ödeme bağlantısı yalnızca bu sipariş içindir.`, type: 'digital', media: [{ type: 'image', url: imageUrl, placement: 1 }], priceData: { currency: 'TRY', price: tl(kurus(o.total)) }, stockQuantity: 1, shippingPayer: 'sellerPays' });

// Müşterinin yönlendirileceği adres yalnızca Shopier alan adı olabilir (test modunda sahte sunucu)
function safeUrl(u) {
  let x; try { x = new URL(String(u)); } catch (e) { return false; }
  if (custom()) { try { return x.host === new URL(custom()).host; } catch (e) { return false; } }
  return x.protocol === 'https:' && (x.hostname === 'shopier.com' || x.hostname.endsWith('.shopier.com'));
}

// Ödeme kararı. "paid" dışındaki her durum lisans açmaz; bilinmeyen/eksik alan "mismatch" olur (yönetici onayı gerekir).
//   ignore: bu sipariş bizim ürünümüzü içermiyor · wait: ödenmiş görünmüyor · mismatch: tutarsız · paid: ürün, adet, para birimi, tutar tuttu
function evaluate(order, productId, so) {
  const items = Array.isArray(so && so.lineItems) ? so.lineItems : [];
  const line = items.find((l) => l && String(l.productId) === String(productId));
  if (!line) return { state: 'ignore', reasons: [] };
  if (so.paymentStatus !== 'paid') return { state: 'wait', reasons: [] };
  const reasons = []; const want = kurus(order.total); const got = kurus(so.totals && so.totals.total);
  if (items.length !== 1) reasons.push('Shopier siparişinde başka ürün de var');
  if (line.quantity !== 1) reasons.push(`Adet 1 değil (${line.quantity})`);
  if (so.currency !== 'TRY') reasons.push(`Para birimi TRY değil (${so.currency})`);
  if (!(want > 0) || want !== got) reasons.push(`Tutar uyuşmuyor: beklenen ${tl(want)} TL, Shopier ${tl(got)} TL`);
  if (Array.isArray(so.refunds) && so.refunds.length) reasons.push('Shopier siparişinde iade kaydı var');
  return reasons.length ? { state: 'mismatch', reasons } : { state: 'paid', reasons };
}
const reset = () => { blockedUntil = 0; };
module.exports = { call, verifySignature, kurus, tl, productBody, safeUrl, evaluate, ShopierError, reset, PROD };
