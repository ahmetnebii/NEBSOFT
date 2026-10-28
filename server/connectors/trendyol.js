// Trendyol satıcı API adaptörü. Kimlik: satıcı no (sellerId), API anahtarı, API gizli anahtar (satıcı paneli > Hesap Bilgilerim > Entegrasyon Bilgileri)
const { request, basic, chunk } = require('./http');
const { load, fill } = require('./config');

function client(creds) {
  if (!creds || !creds.sellerId || !creds.apiKey || !creds.apiSecret) throw new Error('Trendyol için satıcı no, API anahtarı ve API gizli anahtar gerekli');
  const E = load().trendyol; const base = creds.stage ? E.stage : E.base;
  const headers = { Authorization: basic(creds.apiKey, creds.apiSecret), 'User-Agent': `${creds.sellerId} - ${creds.integrator || 'SelfIntegration'}` };
  const url = (k, vars = {}, q) => base + fill(E[k], { sid: creds.sellerId, ...vars }) + (q ? '?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')).toString() : '');
  return { url, call: (k, opt = {}) => request(url(k, opt.vars, opt.query), { method: opt.method || 'GET', headers, body: opt.body }) };
}

// Trendyol paketini NEBSOFT sipariş biçimine çevirir
function mapOrder(p) {
  const a = p.shipmentAddress || {};
  return {
    channel: 'trendyol', orderNo: String(p.orderNumber || p.id), packageId: p.id, status: p.status || p.shipmentPackageStatus,
    at: p.orderDate ? new Date(Number(p.orderDate)).toISOString() : new Date().toISOString(),
    customer: { name: [p.customerFirstName, p.customerLastName].filter(Boolean).join(' ') || a.fullName || '', phone: a.phone || '', address: a.fullAddress || [a.address1, a.address2].filter(Boolean).join(' '), city: a.city || '', district: a.district || '' },
    items: (p.lines || []).map((l) => ({ lineId: l.id, barcode: l.barcode, sku: l.merchantSku || l.barcode, name: l.productName, qty: Number(l.quantity) || 1, price: Number(l.price ?? l.amount) || 0 })),
    total: Number(p.totalPrice ?? p.grossAmount) || 0, cargo: p.cargoProviderName || '', tracking: p.cargoTrackingNumber ? String(p.cargoTrackingNumber) : '',
  };
}

const actions = {
  async 'baglanti-test'(c) { const r = await c.call('orders', { query: { size: 1, page: 0 } }); return r.ok ? { ok: true, data: { message: 'Trendyol bağlantısı başarılı' } } : r; },
  // payload: { since (ISO), status }  — en fazla 2 haftalık aralık; sayfa sayfa çeker
  async 'siparis-cek'(c, p = {}) {
    const end = Date.now(); const start = Math.max(p.since ? new Date(p.since).getTime() : end - 3 * 864e5, end - 14 * 864e5);
    const orders = []; let page = 0;
    for (;;) {
      const r = await c.call('orders', { query: { status: p.status || 'Created', startDate: start, endDate: end, page, size: 200, orderByField: 'PackageLastModifiedDate', orderByDirection: 'DESC' } });
      if (!r.ok) return r;
      const content = (r.data && r.data.content) || []; content.forEach((x) => orders.push(mapOrder(x)));
      if (page + 1 >= ((r.data && r.data.totalPages) || 1) || page > 50) break; page++;
    }
    return { ok: true, data: { orders } };
  },
  // payload: { items: [{ barcode, stock, price, listPrice }] }  — 1000'lik partiler; batch kimlikleri döner
  async 'stok-fiyat'(c, p = {}) {
    const items = (p.items || []).filter((i) => i.barcode).map((i) => ({ barcode: String(i.barcode), quantity: Math.max(0, Math.floor(Number(i.stock) || 0)), ...(i.price ? { salePrice: Number(i.price), listPrice: Number(i.listPrice || i.price) } : {}) }));
    if (!items.length) return { ok: false, error: 'Gönderilecek barkodlu ürün yok' };
    const batches = [];
    for (const part of chunk(items, 1000)) { const r = await c.call('inventory', { method: 'POST', body: { items: part } }); if (!r.ok) return { ...r, data: { batches } }; batches.push(r.data && r.data.batchRequestId); }
    return { ok: true, data: { batches, count: items.length } };
  },
  async 'batch-durum'(c, p = {}) { const r = await c.call('batch', { vars: { id: p.batchId } }); if (!r.ok) return r; const d = r.data || {}; return { ok: true, data: { status: d.status, items: (d.items || []).map((i) => ({ barcode: (i.requestItem && (i.requestItem.barcode || (i.requestItem.product && i.requestItem.product.barcode))) || '', status: i.status, reasons: i.failureReasons || [] })) } }; },
  // payload: { items: [{ barcode, title, productMainId, brandId, categoryId, stock, price, listPrice, vat, desc, images[], attributes[] , cargoCompanyId, desi }] }
  async 'urun-gonder'(c, p = {}) {
    const items = (p.items || []).map((i) => ({ barcode: String(i.barcode), title: String(i.title).slice(0, 100), productMainId: String(i.productMainId || i.barcode), brandId: Number(i.brandId), categoryId: Number(i.categoryId), quantity: Math.max(0, Math.floor(Number(i.stock) || 0)), stockCode: String(i.stockCode || i.barcode), dimensionalWeight: Number(i.desi) || 1, description: String(i.desc || i.title), currencyType: 'TRY', listPrice: Number(i.listPrice || i.price), salePrice: Number(i.price), vatRate: Number(i.vat ?? 20), cargoCompanyId: Number(i.cargoCompanyId) || undefined, images: (i.images || []).map((u) => ({ url: u })), attributes: i.attributes || [] }));
    const bad = items.find((i) => !i.brandId || !i.categoryId); if (bad) return { ok: false, error: `${bad.barcode}: Trendyol marka (brandId) ve kategori (categoryId) eşleştirmesi gerekli` };
    const batches = [];
    for (const part of chunk(items, 1000)) { const r = await c.call('products', { method: 'POST', body: { items: part } }); if (!r.ok) return { ...r, data: { batches } }; batches.push(r.data && r.data.batchRequestId); }
    return { ok: true, data: { batches, count: items.length } };
  },
  // payload: { packageId, lines:[{lineId, qty}], status:'Picking'|'Invoiced', invoiceNo, tracking }
  async 'kargo-bildir'(c, p = {}) {
    if (!p.packageId) return { ok: false, error: 'Trendyol paket no (packageId) gerekli' };
    if (p.tracking && p.ownCargo) { const r = await c.call('tracking', { method: 'PUT', vars: { id: p.packageId }, body: { trackingNumber: String(p.tracking) } }); if (!r.ok) return r; }
    const r = await c.call('package', { method: 'PUT', vars: { id: p.packageId }, body: { lines: (p.lines || []).map((l) => ({ lineId: Number(l.lineId), quantity: Number(l.qty) })), params: p.invoiceNo ? { invoiceNumber: String(p.invoiceNo) } : {}, status: p.status || 'Picking' } });
    return r.ok ? { ok: true, data: {} } : r;
  },
  async 'soru-cek'(c) { const r = await c.call('questions', { query: { status: 'WAITING_FOR_ANSWER', size: 50 } }); if (!r.ok) return r; return { ok: true, data: { questions: ((r.data && r.data.content) || []).map((q) => ({ id: String(q.id), text: q.text, product: q.productName, barcode: q.productMainId, customer: q.userName || q.customerName || '', at: q.creationDate ? new Date(Number(q.creationDate)).toISOString() : '' })) } }; },
  async 'soru-yanitla'(c, p = {}) { if (!p.question || !p.answer) return { ok: false, error: 'Soru no ve yanıt gerekli' }; const r = await c.call('answer', { method: 'POST', vars: { id: p.question }, body: { text: String(p.answer) } }); return r.ok ? { ok: true, data: {} } : r; },
  async 'hakedis-cek'(c, p = {}) { const end = Date.now(); const start = p.since ? new Date(p.since).getTime() : end - 14 * 864e5; const r = await c.call('settlements', { query: { transactionType: p.type || 'Sale', startDate: start, endDate: end, size: 500 } }); if (!r.ok) return r; return { ok: true, data: { rows: ((r.data && r.data.content) || []).map((x) => ({ orderNo: String(x.orderNumber || ''), amount: Number(x.debt || x.credit || 0), commission: Number(x.commissionAmount || 0), commissionRate: Number(x.commissionRate || 0), sellerRevenue: Number(x.sellerRevenue || 0), paymentDate: x.paymentDate ? new Date(Number(x.paymentDate)).toISOString() : '' })) } }; },
  async 'kategori-cek'(c) { const r = await c.call('categories'); return r.ok ? { ok: true, data: { categories: (r.data && r.data.categories) || [] } } : r; },
};

async function run(action, creds, payload) {
  const fn = actions[action]; if (!fn) return { ok: false, unsupported: true, error: `Trendyol için '${action}' işlemi desteklenmiyor` };
  let c; try { c = client(creds); } catch (e) { return { ok: false, error: e.message }; }
  return fn(c, payload || {});
}
module.exports = { run, mapOrder, actions: Object.keys(actions) };
