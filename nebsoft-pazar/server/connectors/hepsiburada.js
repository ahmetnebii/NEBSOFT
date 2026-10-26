// Hepsiburada satıcı API adaptörü. Kimlik: merchantId, servis kullanıcı adı ve servis anahtarı (Satıcı Paneli > Entegrasyon)
const { request, basic, chunk } = require('./http');
const { load, fill } = require('./config');

function client(creds) {
  if (!creds || !creds.sellerId || !creds.apiKey || !creds.apiSecret) throw new Error('Hepsiburada için merchantId, servis kullanıcı adı ve servis anahtarı gerekli');
  const E = load().hepsiburada;
  const host = { listing: creds.stage ? E.listingStage : E.listing, oms: creds.stage ? E.omsStage : E.oms };
  const headers = { Authorization: basic(creds.apiKey, creds.apiSecret), 'User-Agent': creds.integrator || 'nebsoft_dev' };
  const call = (svc, k, opt = {}) => request(host[svc] + fill(E[k], { mid: creds.sellerId, ...(opt.vars || {}) }) + (opt.query ? '?' + new URLSearchParams(opt.query).toString() : ''), { method: opt.method || 'GET', headers, body: opt.body });
  return { call };
}
// Hepsiburada sipariş kalemlerini NEBSOFT biçimine çevirir (yanıt sipariş veya kalem listesi olabilir)
function mapOrders(data) {
  const list = Array.isArray(data) ? data : (data && (data.items || data.orders || data.content)) || [];
  const by = {};
  list.forEach((x) => {
    const no = String(x.orderNumber || x.OrderNumber || x.orderId || x.id || '');
    const o = (by[no] = by[no] || { channel: 'hepsiburada', orderNo: no, at: x.orderDate || x.OrderDate || new Date().toISOString(), customer: { name: x.customerName || (x.shippingAddress && x.shippingAddress.name) || '', phone: (x.shippingAddress && x.shippingAddress.phoneNumber) || '', address: (x.shippingAddress && x.shippingAddress.address) || '', city: (x.shippingAddress && x.shippingAddress.city) || '', district: (x.shippingAddress && x.shippingAddress.town) || '' }, items: [], total: 0 });
    const lines = x.items || x.lineItems || [x];
    lines.forEach((l) => { const price = Number((l.unitPrice && l.unitPrice.amount) ?? (l.price && l.price.amount) ?? l.price ?? 0); const qty = Number(l.quantity) || 1; o.items.push({ lineId: l.id || l.lineItemId, sku: l.merchantSku || l.merchantSKU || l.sku, hbSku: l.hepsiburadaSku || l.sku, name: l.productName || l.name || '', qty, price }); o.total += price * qty; });
  });
  return Object.values(by);
}
const actions = {
  async 'baglanti-test'(c) { const r = await c.call('listing', 'listings', { query: { offset: 0, limit: 1 } }); return r.ok ? { ok: true, data: { message: 'Hepsiburada bağlantısı başarılı' } } : r; },
  async 'siparis-cek'(c) {
    const orders = []; let offset = 0;
    for (let i = 0; i < 20; i++) { const r = await c.call('oms', 'orders', { query: { offset, limit: 100 } }); if (!r.ok) return r; const got = mapOrders(r.data); orders.push(...got); const total = r.data && (r.data.totalCount || r.data.TotalCount); offset += 100; if (!got.length || (total && offset >= total)) break; }
    return { ok: true, data: { orders } };
  },
  // payload: { items: [{ sku, hbSku, stock, price }] } — envanter yükleme kimliği döner, durum 'batch-durum' ile izlenir
  async 'stok-fiyat'(c, p = {}) {
    const items = (p.items || []).filter((i) => i.sku || i.barcode).map((i) => ({ merchantSku: String(i.sku || i.barcode), ...(i.hbSku ? { hepsiburadaSku: String(i.hbSku) } : {}), ...(i.price ? { price: Number(i.price) } : {}), availableStock: Math.max(0, Math.floor(Number(i.stock) || 0)) }));
    if (!items.length) return { ok: false, error: 'Gönderilecek ürün yok' };
    const batches = [];
    for (const part of chunk(items, 4000)) { const r = await c.call('listing', 'inventory', { method: 'POST', body: part }); if (!r.ok) return { ...r, data: { batches } }; batches.push(r.data && (r.data.id || r.data.Id)); }
    return { ok: true, data: { batches, count: items.length } };
  },
  async 'batch-durum'(c, p = {}) { const r = await c.call('listing', 'inventoryStatus', { vars: { id: p.batchId } }); return r.ok ? { ok: true, data: { status: r.data && (r.data.status || r.data.Status), errors: (r.data && (r.data.errors || r.data.Errors)) || [] } } : r; },
};
async function run(action, creds, payload) {
  const fn = actions[action]; if (!fn) return { ok: false, unsupported: true, error: `Hepsiburada için '${action}' işlemi bu sürümde desteklenmiyor (satıcı panelinden yapın)` };
  let c; try { c = client(creds); } catch (e) { return { ok: false, error: e.message }; }
  return fn(c, payload || {});
}
module.exports = { run, mapOrders, actions: Object.keys(actions) };
