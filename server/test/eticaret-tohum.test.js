// E-ticaret Pazaryeri Merkezi tohumu: demo verisi bulut belgesine yazılmaz, boş belgede ekranlar ve kanal bağlama çalışır
//   node server/test/eticaret-tohum.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'eticaret', 'pazaryeri.js'), 'utf8');
const js = (x) => JSON.stringify(x);
const noop = () => {};

// Gerçek dosya, küçük bir NS ile yüklenir: ekranlar sütunlarını çizer, olay ve pencere kayıtları sınanmak üzere tutulur
function kur() {
  const iso = (d) => new Date(d).toISOString().slice(0, 10); const addDays = (d, g) => { const x = new Date(d); x.setDate(x.getDate() + g); return x; };
  const T = { on: [], modal: null, toast: [] }; let id = 0;
  const NS = {
    esc: (s) => String(s ?? ''), icon: () => '', money: (x) => String(x), badge: (t) => String(t), kpi: (a, b) => `${a}:${b}`, pageHead: (a, b, c = '') => a + b + c, sum: (l, f) => (l || []).reduce((t, x) => t + (Number(f(x)) || 0), 0),
    iso, today: () => iso(new Date()), addDays, uid: () => 'id' + ++id, rand: (a) => a, pick: (l) => l[0], ago: () => '', date: (x) => String(x), match: () => true, searchBox: () => '', fieldsHtml: () => '', csv: noop, currentUser: null,
    $: (s, el) => { el.q = el.q || {}; return (el.q[s] = el.q[s] || { innerHTML: '', focus: noop, setSelectionRange: noop }); }, $$: () => [], on: (el, ev, sel, fn) => T.on.push({ sel, fn }),
    toast: (m) => T.toast.push(m), confirm: async () => true, formModal: async () => null, modal: (o) => { T.modal = o; }, readForm: () => T.form,
    table: ({ rows, columns, empty }) => (rows.length ? rows.map((r) => columns.map((c) => (c.render ? c.render(r) : r[c.key])).join('|')).join('\n') : empty),
  };
  const ctx = vm.createContext({ NS, window: {}, console, fetch: () => Promise.reject(new Error('ağ yok')) });
  vm.runInContext(SRC, ctx, { filename: 'pazaryeri.js' });
  return { MP: ctx.window.MPHUB, T };
}
function belge(cloud, data) {
  const db = { cloud, saves: 0, data: { _meta: {}, _settings: {}, ...data }, load: noop, save() { this.saves++; }, col(k) { return (this.data[k] = this.data[k] || []); }, all(k, f) { const c = this.col(k); return f ? c.filter(f) : c.slice(); }, get(k, id) { return this.col(k).find((x) => x.id === id); }, find(k, f) { return this.col(k).find(f); }, settings(d = {}) { return { ...d, ...this.data._settings }; } };
  return db;
}
const urun = (id, cat) => ({ id, name: 'Ürün ' + id, cat, price: 100, sale: null, active: true, desc: 'Otuz karakterden uzun bir ürün açıklaması metni burada', variants: [{ id: 'v' + id, sku: 'S' + id, stock: 5, color: 'Siyah', size: 'M' }] });
const siparis = (id, ek) => ({ id, no: 'LB' + id, at: new Date().toISOString(), total: 500, status: 'yeni', items: [], ...ek });
const isletme = () => ({ cats: [{ id: 'elbise', name: 'Elbise' }], products: [urun('p1', 'elbise'), urun('p2', 'bluz')], orders: [siparis('1', { channel: 'Web sitesi' }), siparis('2', { channel: 'Instagram' }), siparis('3', { channel: 'Trendyol' }), siparis('4', {}), siparis('5', { channel: 'Web sitesi' }), siparis('6', { channel: 'Doğrudan' })] });
const ac = (MP, ad) => { const el = {}; MP.routes[ad](el, {}, { refresh: noop }); return el; };
const metin = (el) => [el.innerHTML, ...Object.values(el.q || {}).map((x) => x.innerHTML)].join('\n');

(async () => {
  {
    const { MP } = kur(); const db = belge(true, isletme()); const once = js(db.data.orders); MP.ensure(db);
    assert.strictEqual(db.saves, 0); assert.strictEqual(db.data.mpChannels, undefined); assert.strictEqual(db.data.listings, undefined); assert.strictEqual(db.data.mpQuestions, undefined); assert.strictEqual(db.data.mpCatMap, undefined);
    assert.strictEqual(js(db.data.orders), once); assert.ok(db.data.orders.every((o) => !('channelNo' in o) && !('source' in o) && !('channelShip' in o)));
    ok('Bulutta ensure belgeye hiçbir şey yazmaz; web sitesi siparişi dahil kanal, kanal no ve kaynak aynı kalır');
  }
  {
    const { MP } = kur(); const db = belge(true, { orders: [siparis('1', { channel: 'Trendyol' })] }); MP.ensure(db);
    assert.strictEqual(db.data.orders[0].channel, 'Trendyol'); assert.strictEqual(db.saves, 0); ok('Bulutta eski kanal adı da değiştirilmez');
  }
  {
    const { MP } = kur(); const db = belge(true, isletme()); MP.ensure(db); const els = {};
    for (const r of Object.keys(MP.routes)) els[r] = ac(MP, r);
    assert.ok(els.pazaryeri.innerHTML.includes('Bağlı pazaryeri yok')); assert.ok(!els.pazaryeri.innerHTML.includes('simülasyon</b> modunda')); assert.ok(!/TEST|Canlı mod/.test(els.pazaryeri.innerHTML.replace('Canlı mod</b>', '')));
    assert.ok(metin(els.listeleme).includes('Bağlı pazaryeri yok')); assert.ok(metin(els.eslestirme).includes('Bağlı pazaryeri yok')); assert.ok(metin(els.sorular).includes('Soru yok')); assert.ok(metin(els.hakedis).includes('pazaryeri siparişi yok'));
    assert.strictEqual(db.saves, 0); ok('Boş bulut belgesinde altı ekran da açılır, sahte kanal yerine boş durum görünür');
  }
  {
    const { MP } = kur(); const db = belge(true, isletme()); MP.ensure(db);
    assert.ok(!MP.isLive('trendyol')); assert.ok(!MP.anyLive()); assert.strictEqual(MP.unmatchedOrders().length, 0); assert.strictEqual((await MP.pullOrders()).count, 0); MP.stockChanged([{ vid: 'vp1' }]); assert.strictEqual((await MP.pullClaims()).count, 0);
    assert.strictEqual(MP.findVariant('Sp1').p.id, 'p1'); assert.strictEqual(MP.settle(db.data.orders[0]).net, 500); await MP.shipNotify(db.data.orders[0]);
    assert.strictEqual(db.data.mpChannels, undefined); ok('Bağlı kanal yokken app.js\'in çağırdığı işlevler kırılmaz, kanal kaydı oluşmaz');
  }
  {
    const { MP, T } = kur(); const db = belge(true, isletme()); MP.ensure(db); const once = js(db.data.orders);
    ac(MP, 'pazaryeri'); await T.on.find((x) => x.sel === '[data-act="cfg"]').fn({}, { dataset: { id: 'n11' } });
    T.form = { mode: 'sim', sellerId: 'magazam', apiKey: 'anahtar', apiSecret: 'gizli', markup: 0, buffer: 0 };
    await T.modal.actions.find((a) => a.cls === 'primary').onClick(noop, {});
    assert.strictEqual(db.data.mpChannels.n11.connected, true); assert.strictEqual(db.data.mpChannels.n11.sellerId, 'magazam'); assert.deepStrictEqual(Object.keys(db.data.mpChannels), ['n11']); assert.ok(db.saves > 0);
    assert.ok(db.data.mpLog[0].detail.includes('TEST')); ok('Boş belgede kanal bağlanır; simülasyonda günlük "test başarılı" demez');
    MP.ensure(db); assert.deepStrictEqual(Object.keys(db.data.mpChannels), ['n11']); assert.strictEqual(js(db.data.orders), once); ok('Kanal bağlandıktan sonra açılış tohumu çalıştırmaz, siparişler değişmez');
    T.on.length = 0; ac(MP, 'eslestirme'); T.on.find((x) => x.sel === '[data-map]').fn({}, { dataset: { map: 'n11|elbise' }, value: 'Kadın > Giyim > Elbise', style: {} });
    assert.strictEqual(db.data.mpCatMap.n11.elbise, 'Kadın > Giyim > Elbise'); ok('mpCatMap yokken kategori eşleştirme kaydedilir');
    T.on.length = 0; const el = ac(MP, 'listeleme'); T.on.find((x) => x.sel === '[data-sel]').fn({}, { checked: true, dataset: { sel: 'p2' } }); await T.on.find((x) => x.sel === '[data-push]').fn({}, { dataset: { push: 'n11' } });
    assert.strictEqual(db.data.listings.length, 1); assert.strictEqual(db.data.listings[0].status, 'hata'); assert.strictEqual(db.data.listings[0].error, 'Kategori eşleştirmesi yok'); assert.ok(metin(el)); ok('listings yokken simülasyon kontrolü eksik ürünü işaretler, yayında göstermez');
  }
  {
    const { MP } = kur(); const eski = { ...isletme(), mpChannels: { trendyol: { connected: true, sellerId: '482913' } }, listings: [{ id: 'l', pid: 'p1', ch: 'trendyol', status: 'yayinda', extId: 'TY1' }], mpQuestions: [{ id: 'q', ch: 'trendyol', pid: 'p1', text: 'Soru', customer: 'A', at: new Date().toISOString(), answer: '' }] };
    const db = belge(true, JSON.parse(js(eski))); MP.ensure(db); assert.strictEqual(js(db.data.mpChannels), js(eski.mpChannels)); assert.strictEqual(js(db.data.listings), js(eski.listings)); assert.strictEqual(js(db.data.orders), js(eski.orders)); assert.strictEqual(db.saves, 0);
    ok('Daha önce tohumlanmış bulut belgesi kendiliğinden düzeltilmez');
  }
  {
    const { MP } = kur(); const db = belge(false, isletme()); MP.ensure(db);
    assert.deepStrictEqual(Object.keys(db.data.mpChannels), ['trendyol', 'hepsiburada', 'n11']); assert.ok(Object.values(db.data.mpChannels).every((c) => c.connected)); assert.ok(db.data.listings.length > 0); assert.strictEqual(db.data.mpQuestions.length, 9); assert.ok(db.data.orders.filter((o) => MP.CH[o.channel] && o.channelNo).length > 0); assert.ok(db.saves > 0);
    ok('Demo ve yerel kipte örnek kanal, listeleme, soru ve kanal siparişi üretilmeye devam eder');
    const once = js(db.data); MP.ensure(db); assert.strictEqual(js(db.data), once); ok('Demo tohumu ikinci açılışta tekrarlanmaz');
    for (const r of Object.keys(MP.routes)) ac(MP, r); ok('Demo verisiyle altı ekran da açılır');
  }
  {
    const { MP } = kur(); const db = belge(false, { orders: [siparis('1', { channel: 'Trendyol' })], mpChannels: {} }); MP.ensure(db);
    assert.strictEqual(db.data.orders[0].channel, 'trendyol'); ok('Demo/yerel kipte eski kanal adı anahtara çevrilir');
  }
  console.log(`\n${n} test geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
