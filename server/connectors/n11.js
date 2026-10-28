// n11 REST API adaptörü (developer.n11.com). Kimlik: API anahtarı (appKey) ve API şifresi (appSecret) — her istekte başlık olarak
// gönderilir, Authorization kullanılmaz. Anahtar: Satıcı Ofisi > Hesabım > Api Hesapları; şifre kayıtlı e-postaya gelir.
// n11 ürünleri satıcı stok kodu (stockCode) ile eşlenir; NEBSOFT tarafında stok kodu olarak ürünün sku'su, yoksa barkodu kullanılır.
const { request, chunk } = require('./http');
const { load, fill } = require('./config');

function client(creds) {
  if (!creds || !creds.apiKey || !creds.apiSecret) throw new Error('n11 için API anahtarı (appKey) ve API şifresi (appSecret) gerekli');
  const E = load().n11;
  const headers = { appKey: String(creds.apiKey).trim(), appSecret: String(creds.apiSecret).trim() };
  const call = (k, opt = {}) => request(E.base + fill(E[k], opt.vars || {}) + (opt.query ? '?' + new URLSearchParams(Object.entries(opt.query).filter(([, v]) => v !== undefined && v !== '')).toString() : ''), { method: opt.method || 'GET', headers, body: opt.body });
  return { call, integrator: creds.integrator || 'NEBSOFT' };
}

// n11 paketini NEBSOFT sipariş biçimine çevirir
function mapOrder(p) {
  const a = p.shippingAddress || {};
  return {
    channel: 'n11', orderNo: String(p.orderNumber || p.id), packageId: p.id, status: p.shipmentPackageStatus,
    at: p.lastModifiedDate ? new Date(Number(p.lastModifiedDate)).toISOString() : new Date().toISOString(),
    customer: { name: p.customerfullName || a.fullName || '', phone: a.gsm || '', address: [a.address, a.neighborhood].filter(Boolean).join(' '), city: a.city || '', district: a.district || '' },
    items: (p.lines || []).map((l) => ({ lineId: l.orderLineId, barcode: l.barcode, sku: l.stockCode || l.barcode, name: l.productName, qty: Number(l.quantity) || 1, price: Number(l.price) || 0 })),
    total: Number(p.totalAmount) || 0, cargo: p.cargoProviderName || '', tracking: p.cargoTrackingNumber ? String(p.cargoTrackingNumber) : '',
  };
}
const two = (n) => Math.round(Number(n) * 100) / 100;

const actions = {
  // Salt okuma: ürün listesinin ilk kaydı
  async 'baglanti-test'(c) { const r = await c.call('products', { query: { page: 0, size: 1 } }); return r.ok ? { ok: true, data: { message: 'n11 bağlantısı başarılı', products: r.data && r.data.totalElements } } : r; },
  // payload: { since (ISO), status } — n11 tek istekte en fazla 15 günlük aralık döndürür; sayfa başına en fazla 100
  async 'siparis-cek'(c, p = {}) {
    const end = Date.now(); const start = Math.max(p.since ? new Date(p.since).getTime() : end - 3 * 864e5, end - 15 * 864e5);
    const orders = []; let page = 0;
    for (;;) {
      const r = await c.call('orders', { query: { status: p.status || 'Created', startDate: start, endDate: end, page, size: 100, orderByDirection: 'DESC' } });
      if (!r.ok) return r;
      ((r.data && r.data.content) || []).forEach((x) => orders.push(mapOrder(x)));
      if (page + 1 >= ((r.data && r.data.totalPages) || 1) || page > 50) break; page++;
    }
    return { ok: true, data: { orders } };
  },
  // payload: { items: [{ sku | barcode, stock, price, listPrice }] } — 1000'lik partiler; görev (task) kimlikleri döner
  async 'stok-fiyat'(c, p = {}) {
    const skus = (p.items || []).map((i) => ({ code: String(i.sku || i.stockCode || i.barcode || ''), i })).filter((x) => x.code).map(({ code, i }) => {
      const o = { stockCode: code, quantity: Math.max(0, Math.floor(Number(i.stock) || 0)) };
      if (Number(i.price) > 0) { const sale = two(i.price); o.salePrice = sale; o.listPrice = Math.max(sale, two(i.listPrice || i.price)); o.currencyType = 'TL'; }
      return o;
    });
    if (!skus.length) return { ok: false, error: 'Gönderilecek stok kodlu ürün yok' };
    const tasks = [];
    for (const part of chunk(skus, 1000)) { const r = await c.call('priceStock', { method: 'POST', body: { payload: { integrator: c.integrator, skus: part } } }); if (!r.ok) return { ...r, data: { tasks } }; tasks.push(r.data && r.data.id); }
    return { ok: true, data: { batches: tasks, count: skus.length } };
  },
  async 'batch-durum'(c, p = {}) {
    const r = await c.call('taskDetail', { method: 'POST', body: { taskId: Number(p.batchId), pageable: { page: 0, size: 1000 } } }); if (!r.ok) return r;
    const d = r.data || {}; const content = (d.skus && d.skus.content) || [];
    return { ok: true, data: { status: d.status, items: content.map((x) => ({ barcode: x.itemCode, status: x.status, errors: x.reasons || [] })) } };
  },
};

async function run(action, creds, payload) {
  const fn = actions[action]; if (!fn) return { ok: false, unsupported: true, error: `n11 için '${action}' işlemi henüz desteklenmiyor` };
  let c; try { c = client(creds); } catch (e) { return { ok: false, error: e.message }; }
  return fn(c, payload || {});
}
module.exports = { run, mapOrder, actions: Object.keys(actions) };
