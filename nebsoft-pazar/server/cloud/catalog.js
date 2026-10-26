// Ürün kataloğu ve fiyatlar sunucuda market/catalog.js'ten okunur — tarayıcıdan gelen fiyata asla güvenilmez.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, '..', '..', 'market', 'catalog.js');
const BUNDLE = { id: 'bundle', name: 'Hepsi Bir Arada', prices: [1999, 3999, 7999], ready: true };
let cache = null; let mtime = 0;
function load() {
  const st = fs.statSync(FILE);
  if (!cache || st.mtimeMs !== mtime) { const w = {}; vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), { window: w }); cache = w.CATALOG; mtime = st.mtimeMs; }
  return cache;
}
const products = () => load().products.filter((p) => p.ready);
const product = (id) => (id === 'bundle' ? BUNDLE : products().find((p) => p.id === id));
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
module.exports = { load, products, product, price, SHARED, VAT, BUNDLE };
