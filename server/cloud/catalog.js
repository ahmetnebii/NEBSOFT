// Ürün kataloğu ve fiyatlar sunucuda market/catalog.js'ten okunur — tarayıcıdan gelen fiyata asla güvenilmez.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, '..', '..', 'market', 'catalog.js');
const BUNDLE = { id: 'bundle', name: 'Hepsi Bir Arada', prices: [4990, 8990, 16990], ready: true };
let cache = null; let mtime = 0;
function load() {
  const st = fs.statSync(FILE);
  if (!cache || st.mtimeMs !== mtime) { const w = {}; vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), { window: w }); cache = w.CATALOG; mtime = st.mtimeMs; }
  return cache;
}
// Yönetim panelinden gelen ürün düzeltmeleri { pid: { prices, name, tagline, ready, hidden, badge, order } } (routes.syncCatalog ile güncellenir)
let OV = {};
const setOverrides = (o) => { OV = o && typeof o === 'object' ? o : {}; };
const overrides = () => OV;
const apply = (p) => { const o = OV[p.id] || {}; const pr = Array.isArray(o.prices) && o.prices.length === 3 && o.prices.every((x) => Number(x) > 0) ? o.prices.map(Number) : p.prices; return { ...p, ...o, prices: pr }; };
const all = () => load().products.map(apply);
const products = () => all().filter((p) => p.ready && !p.hidden);
// 'soon' (yakında) eklentiler satın alınamaz: sipariş fiyatlamasında geçersiz ürün sayılır
const addon = (id) => { const a = (load().addons || []).find((x) => x.id === id && !x.soon); return a ? { ...a, addon: true, ready: true, prices: [a.price, a.price, a.price] } : null; };
const product = (id) => (id === 'bundle' ? apply(BUNDLE) : /^eklenti-/.test(id) ? addon(id) : products().find((p) => p.id === id));
// Uygulamaların ortak kullandığı veri setleri (her lisanslı işletmeye açık)
const SHARED = ['entegrasyon', 'ebelge'];
const VAT = 20;
function price(items, couponPct = 0) {
  const lines = [];
  for (const it of items || []) {
    const p = product(String(it.pid)); const plan = Number(it.plan); const period = it.period === 'yillik' ? 'yillik' : 'aylik'; const qty = Math.min(50, Math.max(1, Number(it.qty) || 1));
    if (!p || ![0, 1, 2].includes(plan)) throw new Error('Geçersiz ürün veya paket');
    lines.push({ pid: p.id, name: p.name, plan, period, qty, price: p.prices[plan] * (period === 'yillik' ? 10 : 1) * qty });
  }
  if (!lines.length) throw new Error('Sepet boş');
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  const discount = Math.round(subtotal * Math.min(100, Math.max(0, couponPct))) / 100;
  const vat = Math.round((subtotal - discount) * VAT) / 100;
  return { lines, subtotal, discount, vat, total: Math.round((subtotal - discount + vat) * 100) / 100 };
}
module.exports = { load, all, products, product, addon, price, SHARED, VAT, BUNDLE, setOverrides, overrides };
