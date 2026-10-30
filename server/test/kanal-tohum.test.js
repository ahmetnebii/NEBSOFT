// POS hızlı ticaret, adisyon yemek platformu, emlak ilan portalı tohumları: demo verisi bulut belgesine yazılmaz, boş belgede ekranlar ve bağlantı çalışır
//   node server/test/kanal-tohum.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const js = (x) => JSON.stringify(x);
const noop = () => {};

// Gerçek dosya, küçük bir NS ile yüklenir: ekranlar sütunlarını çizer, olay ve pencere kayıtları sınanmak üzere tutulur
function kur(dosya, ek = {}) {
  const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', ...dosya.split('/')), 'utf8');
  const iso = (d) => new Date(d).toISOString().slice(0, 10); const addDays = (d, g) => { const x = new Date(d); x.setDate(x.getDate() + g); return x; };
  const T = { on: [], modal: null, toast: [], form: {}, formVal: null }; let id = 0;
  const NS = {
    esc: (s) => String(s ?? ''), icon: () => '', money: (x) => String(x), badge: (t) => String(t), kpi: (a, b) => `${a}:${b}`, pageHead: (a, b, c = '') => a + b + c, sum: (l, f) => (l || []).reduce((t, x) => t + (Number(f(x)) || 0), 0),
    iso, today: () => iso(new Date()), addDays, uid: () => 'id' + ++id, rand: (a) => a, pick: (l) => l[0], ago: () => '', dt: (x) => String(x), date: (x) => String(x), num: (x) => String(x), daysBetween: () => 0, fieldsHtml: () => '', beep: noop, currentUser: null,
    $: (s, el) => { el.q = el.q || {}; return (el.q[s] = el.q[s] || {}); }, $$: () => [], on: (el, ev, sel, fn) => T.on.push({ sel, fn }),
    toast: (m) => T.toast.push(m), confirm: async () => true, formModal: async () => T.formVal, prompt: async () => null, modal: (o) => { T.modal = o; }, readForm: () => T.form,
    table: ({ rows, columns, empty }) => (rows.length ? rows.map((r) => columns.map((c) => (c.render ? c.render(r) : r[c.key])).join('|')).join('\n') : empty || ''), ...ek,
  };
  const ctx = vm.createContext({ NS, window: {}, console, setTimeout });
  vm.runInContext(SRC, ctx, { filename: dosya });
  return { w: ctx.window, T };
}
// load bulutta gerçek çekirdek gibi davranır: sunucudaki hâli okur, henüz gönderilmemiş kaydı siler
function belge(cloud, data) {
  const ilk = JSON.stringify({ _meta: {}, _settings: {}, ...data });
  return { cloud, saves: 0, data: JSON.parse(ilk), load() { if (this.cloud) this.data = JSON.parse(ilk); }, save() { this.saves++; }, col(k) { return (this.data[k] = this.data[k] || []); }, all(k, f) { const c = this.col(k); return f ? c.filter(f) : c.slice(); }, get(k, id) { return this.col(k).find((x) => x.id === id); }, find(k, f) { return this.col(k).find(f); }, settings(d = {}) { return { ...d, ...this.data._settings }; }, nextNo: (k, p) => p + '1', insert(k, x) { const y = { id: 'y' + this.col(k).length, ...x }; this.col(k).push(y); return y; }, log: noop };
}
const olay = (T, sel) => T.on.find((x) => x.sel === sel).fn;
const ac = (hub, ad) => { const el = {}; hub.routes[ad](el, {}, { refresh: noop }); return el; };
const bagla = (T) => T.modal.actions.find((a) => a.cls === 'primary').onClick(noop, {});

// ----- POS -----
const posVeri = () => ({ products: [{ id: 'p1', name: 'Süt', barcode: '869', stock: 20, price: 30, vat: 1, buy: 20 }, { id: 'p2', name: 'Ekmek', barcode: '868', stock: 9, price: 10, vat: 1, buy: 6 }], sales: [{ id: 's1', total: 40 }], moves: [] });
function posTest() {
  {
    const { w } = kur('pos/hizli.js'); const db = belge(true, posVeri()); const once = js(db.data); w.QCHUB.ensure(db);
    assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); ok('POS: bulutta ensure belgeye hiçbir şey yazmaz');
  }
  {
    const { w, T } = kur('pos/hizli.js'); const db = belge(true, posVeri()); w.QCHUB.ensure(db); const el = ac(w.QCHUB, 'hizli');
    assert.ok(el.innerHTML.includes('Bağlı kanal yok')); assert.ok(!el.innerHTML.includes('Demo / simülasyon')); assert.ok(el.innerHTML.includes('Sipariş yok'));
    for (const t of ['kanal', 'gecmis']) { olay(T, '[data-tab]')({}, { dataset: { tab: t } }); assert.ok(el.innerHTML.length > 0); }
    assert.ok(el.innerHTML.includes('Geçmiş sipariş yok')); assert.strictEqual(db.saves, 0); ok('POS: boş bulut belgesinde pano, kanallar ve geçmiş açılır, boş durum görünür');
  }
  return (async () => {
    {
      const { w, T } = kur('pos/hizli.js'); const db = belge(true, posVeri()); w.QCHUB.ensure(db); ac(w.QCHUB, 'hizli');
      await olay(T, '#pull')(); assert.deepStrictEqual(T.toast, ['Açık kanal yok']); assert.strictEqual(db.col('qcOrders').length, 0); ok('POS: bağlı kanal yokken sipariş çekmek kayıt üretmez');
      olay(T, '[data-act="qcfg"]')({}, { dataset: { id: 'getir' } }); T.form = { storeId: '' }; bagla(T); assert.strictEqual(db.data.qcChannels, undefined); assert.ok(T.toast.includes('Mağaza no gerekli'));
      T.form = { storeId: 'GERCEK-1', minBasket: 100, radius: 2, prep: 10, markup: 0, buffer: 1, commission: 18 }; bagla(T);
      assert.deepStrictEqual(Object.keys(db.data.qcChannels), ['getir']); assert.strictEqual(db.data.qcChannels.getir.connected, true); assert.strictEqual(db.data.qcChannels.getir.open, true); assert.ok(db.saves > 0); ok('POS: qcChannels yokken kanal bağlanır, yalnızca bağlanan kanal yazılır');
      T.toast.length = 0; await olay(T, '#pull')(); assert.ok(T.toast[0].startsWith('TEST')); assert.strictEqual(db.col('qcOrders').length, 0); assert.strictEqual(db.data.sales.length, 1); ok('POS: bulutta bağlı kanalda simülasyon siparişi yazılmaz, TEST görünür');
      w.QCHUB.ensure(db); assert.deepStrictEqual(Object.keys(db.data.qcChannels), ['getir']); ok('POS: kanal bağlandıktan sonra açılış tohumu çalışmaz');
    }
    {
      const gelen = [{ orderNo: 'GC1', items: [{ code: '869', qty: 2, price: 30 }], customer: { name: 'Ayşe', address: 'Adres' }, note: '' }];
      const { w, T } = kur('pos/hizli.js', { inbox: { online: async () => true, drain: async (h) => (h === 'getircarsi' ? gelen : []) } }); const db = belge(true, posVeri()); w.QCHUB.ensure(db); ac(w.QCHUB, 'hizli');
      await olay(T, '#pull')(); assert.strictEqual(db.data.qcOrders.length, 1); assert.strictEqual(db.data.qcOrders[0].no, 'GC1'); assert.strictEqual(db.data.qcOrders[0].items[0].pid, 'p1'); ok('POS: qcOrders yokken webhook siparişi alınır');
    }
    {
      const { w } = kur('pos/hizli.js'); const eski = { ...posVeri(), qcChannels: { getir: { connected: true, storeId: 'GC-11872', open: true } }, qcOrders: [{ id: 'o1', no: 'G1', ch: 'getir', at: new Date().toISOString(), status: 'yeni', items: [] }] };
      const db = belge(true, JSON.parse(js(eski))); const once = js(db.data); w.QCHUB.ensure(db); ac(w.QCHUB, 'hizli'); assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); ok('POS: daha önce tohumlanmış bulut belgesi kendiliğinden düzeltilmez');
    }
    {
      const { w, T } = kur('pos/hizli.js'); const db = belge(false, posVeri()); w.QCHUB.ensure(db);
      assert.deepStrictEqual(Object.keys(db.data.qcChannels), ['getir', 'ys']); assert.ok(db.data.qcChannels.getir.connected); assert.strictEqual(db.data.qcOrders.length, 3); assert.ok(db.saves > 0); ok('POS: demo ve yerel kipte örnek kanal ve sipariş üretilir');
      const once = js(db.data); w.QCHUB.ensure(db); assert.strictEqual(js(db.data), once); ok('POS: demo tohumu ikinci açılışta tekrarlanmaz');
      const el = ac(w.QCHUB, 'hizli'); assert.ok(el.innerHTML.includes('Demo / simülasyon')); assert.ok(!el.innerHTML.includes('Bağlı kanal yok'));
      await olay(T, '#pull')(); assert.strictEqual(db.data.qcOrders.length, 4); assert.ok(T.toast.some((m) => m.includes('(simülasyon)'))); ok('POS: demo ve yerelde simülasyon siparişi çekilir');
    }
  })();
}

// ----- Adisyon -----
const adiVeri = () => ({ menu: [{ id: 'm1', name: 'Lahmacun', price: 90, active: true }], checks: [{ id: 'c1', type: 'masa', total: 100 }] });
const toplam = () => ({ total: 100 });
async function adisyonTest() {
  {
    const { w } = kur('adisyon/platform.js'); const db = belge(true, adiVeri()); const once = js(db.data); w.PLATHUB.ensure(db, toplam);
    assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); ok('Adisyon: bulutta ensure belgeye hiçbir şey yazmaz; yorum ve menu-senkron günlüğü oluşmaz');
  }
  {
    const { w, T } = kur('adisyon/platform.js'); const db = belge(true, adiVeri()); w.PLATHUB.ensure(db, toplam); const el = ac(w.PLATHUB, 'platformlar');
    assert.ok(el.innerHTML.includes('Bağlı platform yok')); assert.ok(!el.innerHTML.includes('Demo / simülasyon')); assert.ok(el.innerHTML.includes('Yorum yok')); assert.ok(el.innerHTML.includes('Kayıt yok')); assert.ok(el.innerHTML.includes('Açık platform:0 / 0')); assert.strictEqual(db.saves, 0); ok('Adisyon: boş bulut belgesinde ekran açılır, boş durum görünür');
    await el.q['#all'].onclick(); el.q['#busy'].onclick(); assert.deepStrictEqual(T.toast, ['Bağlı platform yok', 'Bağlı platform yok']); assert.strictEqual(db.data.platLog, undefined); assert.strictEqual(db.saves, 0); ok('Adisyon: bağlı platform yokken toplu işlem "yapıldı" demez, günlük yazmaz');
    olay(T, '[data-act="pcfg"]')({}, { dataset: { id: 'Getir Yemek' } }); T.form = { restId: '' }; bagla(T); assert.strictEqual(db.data.platforms, undefined);
    T.form = { restId: 'GERCEK-1', prep: 20, markup: 0, commission: 22, payoutDays: 14, auto: false }; bagla(T);
    assert.deepStrictEqual(Object.keys(db.data.platforms), ['Getir Yemek']); assert.strictEqual(db.data.platforms['Getir Yemek'].connected, true); assert.ok(db.data.platLog[0].d.includes('TEST')); assert.strictEqual(db.all('platReviews').length, 0); assert.ok(db.saves > 0); ok('Adisyon: platforms yokken platform bağlanır; simülasyonda günlük "kuruldu" demez');
    w.PLATHUB.ensure(db, toplam); assert.deepStrictEqual(Object.keys(db.data.platforms), ['Getir Yemek']); const el2 = ac(w.PLATHUB, 'platformlar'); assert.ok(el2.innerHTML.includes('data-off="Getir Yemek|m1"')); assert.ok(!el2.innerHTML.includes('Bağlı platform yok')); ok('Adisyon: bağlanınca menü kapatma görünür, açılış tohumu çalışmaz');
  }
  {
    const { w } = kur('adisyon/platform.js'); const eski = { ...adiVeri(), platforms: { Yemeksepeti: { connected: true, restId: 'ys-48211', open: true } }, platReviews: [{ id: 'r', p: 'Yemeksepeti', text: 'x', stars: 5, name: 'E', at: new Date().toISOString() }], platLog: [{ id: 'l', p: 'Yemeksepeti', a: 'menu-senkron', d: '', at: new Date().toISOString() }] };
    const db = belge(true, JSON.parse(js(eski))); const once = js(db.data); w.PLATHUB.ensure(db, toplam); ac(w.PLATHUB, 'platformlar'); assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); ok('Adisyon: daha önce tohumlanmış bulut belgesi kendiliğinden düzeltilmez');
  }
  {
    const { w } = kur('adisyon/platform.js'); const db = belge(false, adiVeri()); w.PLATHUB.ensure(db, toplam);
    assert.strictEqual(Object.keys(db.data.platforms).length, 3); assert.strictEqual(db.data.platReviews.length, 6); assert.strictEqual(db.data.platLog.length, 3); assert.ok(db.saves > 0); ok('Adisyon: demo ve yerel kipte örnek platform, yorum ve günlük üretilir');
    const once = js(db.data); w.PLATHUB.ensure(db, toplam); assert.strictEqual(js(db.data), once); const el = ac(w.PLATHUB, 'platformlar'); assert.ok(el.innerHTML.includes('Demo / simülasyon')); assert.ok(!el.innerHTML.includes('Bağlı platform yok')); ok('Adisyon: demo tohumu tekrarlanmaz, ekran aynı açılır');
  }
}

// ----- Emlak -----
const ilan = (id, ek) => ({ id, no: 'E' + id, title: 'Daire ' + id, price: 1000, status: 'aktif', ...ek });
async function emlakTest() {
  {
    const { w } = kur('emlak/portal.js'); const db = belge(true, { props: [ilan('1'), ilan('2', { sample: true })] }); const once = js(db.data); w.PORTALHUB.ensure(db);
    assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); ok('Emlak: bulutta ensure belgeye hiçbir şey yazmaz; örnek ilanlı belgede de portal bağlanmaz');
  }
  {
    const { w, T } = kur('emlak/portal.js'); const db = belge(true, { props: [] }); w.PORTALHUB.ensure(db); const el = ac(w.PORTALHUB, 'portallar');
    assert.ok(el.innerHTML.includes('Bağlı portal yok')); assert.ok(el.innerHTML.includes('Gösterilecek ilan yok')); assert.strictEqual(el.innerHTML.match(/Bağlı değil/g).length, 3); assert.strictEqual(db.saves, 0); ok('Emlak: boş bulut belgesinde ekran açılır, üç portal "Bağlı değil" görünür');
    await olay(T, '[data-dop]')(); assert.deepStrictEqual(T.toast, ['Bağlı portal yok']); ok('Emlak: bağlı portal yokken doping kırılmaz');
  }
  {
    const { w, T } = kur('emlak/portal.js'); const db = belge(true, { _settings: { yetkiNo: 'Y1' }, props: [ilan('1', { authNo: 'A1' })] }); w.PORTALHUB.ensure(db); const el = ac(w.PORTALHUB, 'portallar');
    olay(T, '[data-act="pc"]')({}, { dataset: { id: 'emlakjet' } }); assert.strictEqual(T.modal.actions[1].label, 'Bağlan'); T.form = { storeNo: '' }; bagla(T); assert.strictEqual(db.data.portalCfg, undefined);
    T.form = { storeNo: 'GERCEK-1', quota: 10, doping: 0, monthly: 0 }; bagla(T); assert.deepStrictEqual(Object.keys(db.data.portalCfg), ['emlakjet']); assert.strictEqual(db.data.portalCfg.emlakjet.connected, true); assert.ok(el.innerHTML.includes('data-man="1|emlakjet"')); assert.ok(!el.innerHTML.includes('data-man="1|sahibinden"')); assert.ok(!el.innerHTML.includes('Bağlı portal yok')); ok('Emlak: portalCfg yokken portal bağlanır, yalnızca bağlanan portalın sütunu görünür');
    T.formVal = { extNo: '123', start: '2026-10-01', until: '2026-12-01', views: 0, msgs: 0 }; await olay(T, '[data-man]')({}, { dataset: { man: '1|emlakjet' } });
    assert.strictEqual(db.data.portalListings.length, 1); assert.strictEqual(db.data.portalListings[0].source, 'elle'); assert.strictEqual(db.data.portalListings[0].status, 'yayinda'); ok('Emlak: portalListings yokken elle yayın kaydı eklenir');
  }
  {
    const { w, T } = kur('emlak/portal.js'); const db = belge(true, { _settings: { yetkiNo: 'Y1' }, props: [ilan('1', { authNo: 'A1' })], portalCfg: { hepsiemlak: { connected: true, storeNo: 'H1' } } }); w.PORTALHUB.ensure(db); ac(w.PORTALHUB, 'portallar');
    olay(T, '[data-ps]')({}, { checked: true, dataset: { ps: '1' } }); await olay(T, '[data-pub]')({}, { dataset: { pub: 'hepsiemlak' } });
    assert.strictEqual(db.data.portalListings[0].status, 'test'); assert.ok(!db.data.portalListings[0].extNo); assert.ok(T.toast[0].includes('TEST')); ok('Emlak: portalListings yokken gönderim simülasyonda TEST kalır, ilan numarası üretilmez');
  }
  {
    const { w } = kur('emlak/portal.js'); const eski = { props: [ilan('1')], portalCfg: { sahibinden: { connected: true }, hepsiemlak: { connected: true }, emlakjet: { connected: true } }, portalListings: [] };
    const db = belge(true, JSON.parse(js(eski))); const once = js(db.data); w.PORTALHUB.ensure(db); const el = ac(w.PORTALHUB, 'portallar'); assert.strictEqual(js(db.data), once); assert.strictEqual(db.saves, 0); assert.ok(!el.innerHTML.includes('Bağlı değil')); ok('Emlak: daha önce tohumlanmış bulut belgesi kendiliğinden düzeltilmez');
  }
  {
    const { w } = kur('emlak/portal.js'); const db = belge(false, { props: [ilan('1', { sample: true }), ilan('2', { sample: true })] }); w.PORTALHUB.ensure(db);
    assert.ok(Object.values(db.data.portalCfg).every((c) => c.connected && c.storeNo)); assert.ok(db.data.portalListings.length > 0); assert.ok(db.saves > 0); ok('Emlak: demo kipinde örnek portal ve ilan kaydı üretilir');
    const once = js(db.data); w.PORTALHUB.ensure(db); assert.strictEqual(js(db.data), once); const el = ac(w.PORTALHUB, 'portallar'); assert.ok(!el.innerHTML.includes('Bağlı değil')); assert.ok(!el.innerHTML.includes('Bağlı portal yok')); ok('Emlak: demo tohumu tekrarlanmaz, ekran aynı açılır');
  }
  {
    const { w } = kur('emlak/portal.js'); const db = belge(false, { props: [ilan('1')] }); w.PORTALHUB.ensure(db);
    assert.strictEqual(db.data.portalCfg.emlakjet.connected, true); assert.strictEqual(db.data.portalCfg.emlakjet.storeNo, undefined); assert.strictEqual(db.data.portalListings.length, 0); ok('Emlak: yerel kipte davranış aynı kalır, örnek olmayan ilana kayıt yazılmaz');
  }
}

(async () => {
  await posTest(); await adisyonTest(); await emlakTest();
  console.log(`\n${n} test geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
