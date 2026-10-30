// Bulutta db.load gönderilmemiş kaydı silmez: her program gerçek dosyasıyla yüklenir, düğme işlenir, kayıt bellekte kalır; demo ve yerel kip eskisi gibi okur
//   node server/test/bulut-load.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const noop = () => {};

// Bilinmeyen her ad için çağrılabilen, metne boş dönen nesne: sınanmayan ekran parçaları (grafik, seed yardımcıları) çalışmayı durdurmaz
const hep = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === 'length' ? 0 : k === Symbol.iterator ? [][Symbol.iterator].bind([]) : hep()), apply: () => hep(), construct: () => hep(), set: () => true });
const oge = () => { const s = {}; return new Proxy(s, { get: (t, k) => (k in t ? t[k] : k === Symbol.toPrimitive ? () => '' : k === 'then' || k === '__q' ? undefined : hep()), set: (t, k, v) => { t[k] = v; return true; } }); };
const iso = (d) => new Date(d).toISOString().slice(0, 10); const addDays = (d, g) => { const x = new Date(d); x.setDate(x.getDate() + g); return x; };

// load gerçek çekirdek gibi davranır: bulutta sunucudaki hâli okur ve belleği değiştirir, demo ve yerelde son kaydı okur
function belge(cloud, data, ek = {}) {
  let sunucu = JSON.stringify({ _meta: {}, _settings: {}, users: [], ...data });
  return { cloud, saves: 0, yukleme: 0, data: JSON.parse(sunucu), sunucuya(f) { const d = JSON.parse(sunucu); f(d); sunucu = JSON.stringify(d); }, load() { this.yukleme++; this.data = JSON.parse(sunucu); }, save() { this.saves++; if (cloud) this._dirty = true; else sunucu = JSON.stringify(this.data); }, col(k) { return (this.data[k] = this.data[k] || []); }, all(k, f) { const c = this.col(k); return f ? c.filter(f) : c.slice(); }, get(k, id) { return this.col(k).find((x) => x.id === id); }, find(k, f) { return this.col(k).find(f); }, settings(d = {}) { return { ...d, ...this.data._settings }; }, saveSettings(s) { this.data._settings = { ...this.data._settings, ...s }; this.save(); }, insert(k, x, sessiz) { const y = { id: 'y' + this.col(k).length, ...x }; this.col(k).push(y); if (!sessiz) this.save(); return y; }, update(k, id, p) { const r = this.get(k, id); Object.assign(r, p); this.save(); return r; }, remove(k, id) { this.data[k] = this.col(k).filter((x) => x.id !== id); this.save(); }, nextNo: (k, p) => p + '1', log: noop, lookup: () => null, meta: () => true, ...ek };
}
// Gerçek dosyalar küçük bir NS ile yüklenir; olaylar, zamanlayıcılar ve NS.shell ayarı sınanmak üzere tutulur
function kur(dosyalar, db, ek = {}) {
  const T = { on: [], toast: [], timers: [], araliklar: [], shell: null }; const kok = {};
  const taban = { esc: (s) => String(s ?? ''), icon: () => '', money: String, num: String, badge: String, kpi: (a) => String(a), pageHead: (a) => String(a), sum: (l, f) => (l || []).reduce((t, x) => t + (Number(f(x)) || 0), 0), iso, today: () => iso(new Date()), addDays, uid: () => 'u' + T.on.length + Math.random(), date: String, time: String, dt: String, ago: String, MONTHS: Array(12).fill('Ay'), match: () => true, searchBox: () => '', groupBy: () => ({}), DB: function () { return db; }, currentUser: { id: 'u1', name: 'Personel', role: 'admin' },
    $: (s, el) => { const r = el ? (el.__q = el.__q || {}) : kok; return (r[s] = r[s] || oge()); }, $$: () => [], on: (el, ev, sel, fn) => T.on.push({ sel, fn }), toast: (m) => T.toast.push(m), confirm: async () => true, prompt: async () => 'neden', formModal: async () => T.form || null, table: () => '', shell: (o) => { T.shell = o; return { refresh: noop, go: noop }; }, crud: noop, ...ek };
  const NS = new Proxy(taban, { get: (t, k) => (k in t ? t[k] : hep()) });
  const pencere = new Proxy({ ...(ek.window || {}) }, { get: (t, k) => (k in t ? t[k] : hep()), set: (t, k, v) => { t[k] = v; return true; } });
  const belgeYok = { querySelector: () => null, createElement: () => oge(), head: oge(), body: oge(), addEventListener: noop };
  const ctx = vm.createContext({ NS, window: pencere, console, document: belgeYok, location: { search: ek.arama || '', pathname: '/', href: '/' }, history: { replaceState: noop }, localStorage: { getItem: () => null, setItem: noop }, URLSearchParams, addEventListener: noop,
    setTimeout: (f, ms) => { T.timers.push({ f, ms }); if (!ms) Promise.resolve().then(f); return 0; }, clearTimeout: noop, setInterval: (f, ms) => { T.araliklar.push({ f, ms }); return 0; }, clearInterval: noop });
  for (const d of dosyalar) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'apps', ...d.split('/')), 'utf8'), ctx, { filename: d });
  return { T, w: pencere, kok };
}
const olay = (T, sel) => T.on.filter((x) => x.sel === sel).pop().fn;
const app = (route = 'x') => ({ route, refresh: noop, go: noop, can: () => true });
const dur = (x) => ({ dataset: x, checked: true });

// Her ekran iki kez sınanır: bulutta işlem bellekte kalır, demo ve yerelde sayfa eskisi gibi okur
const iki = async (ad, kurucu, isle, sina) => {
  { const c = kurucu(true); await isle(c); assert.ok(sina(c.db), ad + ' bulutta silindi'); assert.strictEqual(c.db.yukleme, 0); ok(`${ad}: bulutta işlem kalır, sunucudan okunmaz`); }
  { const c = kurucu(false); await isle(c); assert.ok(sina(c.db), ad + ' yerelde silindi'); assert.ok(c.db.yukleme > 0); ok(`${ad}: demo ve yerelde sayfa yine okur`); }
};

const simdi = new Date().toISOString();
async function emlak() {
  await iki('Emlak web başvurusu', (cloud) => { const db = belge(cloud, { leads: [{ id: 'L1', kind: 'bilgi', status: 'yeni', name: 'A', at: simdi }] }); const { T } = kur(['emlak/app.js'], db); const el = oge(); T.shell.routes.web(el, '', app()); return { db, T }; },
    ({ T }) => olay(T, '[data-act]')({}, dur({ act: 'call', id: 'L1' })), (db) => db.get('leads', 'L1').status === 'arandi');
}
async function pazaryeri() {
  const veri = () => ({ mpChannels: { trendyol: { connected: true, sellerId: 'T1' } }, products: [{ id: 'p1', name: 'Çanta', cat: 'c1', active: true, price: 10, desc: 'kısa', variants: [{ sku: 'S', stock: 1 }] }], listings: [], mpQuestions: [{ id: 'Q1', ch: 'trendyol', text: 'x', at: simdi, answer: '' }] });
  const kurucu = (rota) => (cloud) => { const db = belge(cloud, veri()); const { T, w } = kur(['eticaret/pazaryeri.js'], db); w.MPHUB.ensure(db); const el = oge(); w.MPHUB.routes[rota](el, '', app()); return { db, T, el }; };
  await iki('Pazaryeri listeleme', kurucu('listeleme'), async ({ T }) => { olay(T, '[data-sel]')({}, { checked: true, dataset: { sel: 'p1' } }); await olay(T, '[data-push]')({}, dur({ push: 'trendyol' })); }, (db) => db.data.mpLog.length === 1 && db.data.listings.length === 1);
  await iki('Pazaryeri müşteri sorusu', kurucu('sorular'), async ({ T, el }) => { NS_deger(el, '#a-Q1', 'Merhaba, normal kalıptır.'); await olay(T, '[data-ans]')({}, dur({ ans: 'Q1' })); }, (db) => db.get('mpQuestions', 'Q1').draft === 'Merhaba, normal kalıptır.');
}
const NS_deger = (el, s, v) => { el.__q = el.__q || {}; el.__q[s] = el.__q[s] || oge(); el.__q[s].value = v; };
async function crm() {
  const CRMQ = { status: (x) => x.status, STATUS: { gonderildi: ['Gönderildi', ''], kabul: ['Kabul', ''], red: ['Red', ''], suresi: ['Süresi', ''] }, closeOthers: noop, calc: () => ({ grand: 0, net: 0 }), fmt: () => String };
  const veri = () => ({ users: [{ id: 'u1', name: 'A' }], deals: [{ id: 'd1', title: 'F', company: 'c1', owner: 'u1', stage: 'teklif', value: 10 }], companies: [{ id: 'c1', name: 'Firma' }], quotes: [{ id: 'T1', no: 'TK1', deal: 'd1', date: '2026-01-01', status: 'gonderildi', total: 1 }], activities: [{ id: 'G1', type: 'gorev', deal: 'd1', text: 'Ara', date: simdi, due: '2026-01-01', done: false, owner: 'u1' }] });
  const kurucu = (rota) => (cloud) => { const db = belge(cloud, veri()); const { T } = kur(['crm/app.js'], db, { window: { CRMQ } }); T.shell.routes[rota](oge(), '', app()); return { db, T }; };
  await iki('CRM teklif reddi', kurucu('teklifler'), ({ T }) => olay(T, '[data-act]')({}, dur({ act: 'no', id: 'T1' })), (db) => db.get('quotes', 'T1').status === 'red');
  await iki('CRM görev tamamlama', kurucu('gorevler'), ({ T }) => olay(T, '[data-tdone]')({}, dur({ tdone: 'G1' })), (db) => db.get('activities', 'G1').done === true);
}
async function klinik() {
  await iki('Klinik kasa toplu SMS', (cloud) => { const db = belge(cloud, { patients: [{ id: 'h1', name: 'A', phone: '05' }], payments: [], plans: [], treatments: [], installments: [{ id: 'i1', patient: 'h1', due: '2020-01-01', amount: 10, paid: 0 }] }); const { T } = kur(['klinik/app.js'], db, { integ: { sms: async () => ({ simulated: true }) } }); const el = oge(); T.shell.routes.kasa(el, '', app()); return { db, T, el }; },
    async ({ el }) => { await el.__q['#rm'].onclick({ target: {} }); }, (db) => db.data.sms && db.data.sms.length === 1 && db.data.sms[0].status.startsWith('TEST'));
}
async function muhasebe() {
  await iki('Muhasebe cari mutabakat', (cloud) => { const db = belge(cloud, { invoices: [], caris: [{ id: 'c1', name: 'Cari' }] }); const { T, w } = kur(['muhasebe/beyan.js'], db); w.MUHBEYAN.init({ db, invTotals: () => ({ net: 0, vat: 0 }), cari: (id) => db.get('caris', id), cariBalance: () => 100, S: () => db.settings({}) }); w.MUHBEYAN.routes.beyanname(oge(), '', app()); return { db, T }; },
    ({ T }) => olay(T, '[data-act]')({}, dur({ act: 'ok', id: 'c1' })), (db) => Object.values(db.data._settings.mutabakat || {}).some((m) => m.c1 === 'mutabik'));
}
// Güncel veri gereken yerler: bekleyen kayıt yoksa bulutta da okur, varsa bellekteki hâl kullanılır
async function randevu() {
  const kurucu = (cloud) => { const db = belge(cloud, { _settings: { autoRemind: true }, appointments: [] }); const { T } = kur(['randevu/app.js'], db, { integ: { isOn: () => true, cfg: () => ({ provider: 'netgsm' }) } }); return { db, tur: T.timers.find((x) => x.ms === 20000).f }; };
  { const { db, tur } = kurucu(true); db.insert('customers', { name: 'Yeni' }); await tur(); assert.strictEqual(db.data.customers.length, 1); assert.strictEqual(db.yukleme, 0); ok('Randevu hatırlatma turu: gönderilmemiş kayıt silinmez'); }
  { const { db, tur } = kurucu(true); db.sunucuya((d) => { d.appointments = [{ id: 'a9', status: 'iptal' }]; }); await tur(); assert.strictEqual(db.yukleme, 1); assert.strictEqual(db.data.appointments.length, 1); ok('Randevu hatırlatma turu: bekleyen kayıt yokken başka oturumun verisi okunur (gizli sekme)'); }
  { const { db, tur } = kurucu(true); db._flight = true; await tur(); assert.strictEqual(db.yukleme, 0); ok('Randevu hatırlatma turu: gönderim sürerken okunmaz'); }
  { const { db, tur } = kurucu(false); await tur(); assert.strictEqual(db.yukleme, 1); ok('Randevu hatırlatma turu: demo ve yerelde yine okur'); }
}
async function veteriner() {
  const kurucu = (cloud) => { const db = belge(cloud, { products: [{ id: 'P1', name: 'Mama', price: 10, stock: 5 }], sales: [] }); const { T } = kur(['veteriner/app.js'], db); T.shell.routes.satis(oge(), '', app()); return { db, T, sat: async () => { await olay(T, '[data-act]')({}, dur({ act: 'add', id: 'P1' })); olay(T, '[data-pay]')({}, dur({ pay: 'nakit' })); } }; };
  { const { db, sat } = kurucu(true); await sat(); await sat(); assert.strictEqual(db.data.sales.length, 2); assert.strictEqual(db.get('products', 'P1').stock, 3); ok('Veteriner: art arda iki satış da kalır'); }
  { const { db, sat, T } = kurucu(true); db.sunucuya((d) => { d.products[0].stock = 0; }); await sat(); assert.strictEqual(db.yukleme, 1); assert.strictEqual(db.data.sales.length, 0); assert.ok(T.toast[0].includes('stok yetersiz')); ok('Veteriner: bekleyen kayıt yokken başka satışta azalan stok görülür'); }
  { const { db, sat } = kurucu(false); await sat(); await sat(); assert.strictEqual(db.data.sales.length, 2); assert.strictEqual(db.yukleme, 2); ok('Veteriner: demo ve yerelde yine okur'); }
}
async function site() {
  const bugun = iso(new Date()); const ziy = (id, code) => ({ id, code, name: id, flat: 'A1', date: bugun, status: 'bekleniyor' });
  const kurucu = (cloud) => { const db = belge(cloud, { flats: [{ id: 'A1', owner: 'S' }], visitors: [ziy('V1', 'AAA'), ziy('V2', 'BBB')] }); const { T } = kur(['site/app.js'], db); const el = oge(); T.shell.routes.ziyaretciler(el, '', app()); return { db, T, gir: (k) => { NS_deger(el, '#vc', k); el.__q['#vk'].onclick(); } }; };
  { const { db, gir } = kurucu(true); gir('AAA'); gir('BBB'); assert.ok(db.data.visitors.every((v) => v.status === 'geldi')); ok('Site: art arda iki ziyaretçi kodu da kalır'); }
  { const { db, gir } = kurucu(true); db.sunucuya((d) => { d.visitors.push(ziy('V3', 'CCC')); }); gir('CCC'); assert.strictEqual(db.get('visitors', 'V3').status, 'geldi'); ok('Site: portaldan az önce gelen kod bekleyen kayıt yokken bulunur'); }
  { const { db, gir } = kurucu(false); gir('AAA'); assert.strictEqual(db.yukleme, 1); assert.strictEqual(db.get('visitors', 'V1').status, 'geldi'); ok('Site: demo ve yerelde yine okur'); }
}
async function bilet() {
  const kurucu = (cloud) => { const db = belge(cloud, { tickets: [] }); const BILET = { capacity: () => 0, ctx: { db, ev: () => ({ name: 'E', cats: {} }), ven: () => ({ name: 'S', cats: {} }), live: () => [] } }; const { T, w } = kur(['bilet/ek.js'], db, { window: { BILET } }); BILET.ek.livePage(oge(), 'e1', app('canli')); return { db, poll: T.araliklar.find((x) => x.ms === 4000).f }; };
  { const { db, poll } = kurucu(true); db.insert('tickets', { name: 'Bekleyen' }); poll(); assert.strictEqual(db.data.tickets.length, 1); assert.strictEqual(db.yukleme, 0); ok('Bilet canlı ekran: yoklama gönderilmemiş kaydı silmez'); }
  { const { db, poll } = kurucu(true); db.sunucuya((d) => { d.tickets.push({ id: 'k1' }); }); poll(); assert.strictEqual(db.data.tickets.length, 1); ok('Bilet canlı ekran: bekleyen kayıt yokken kapıdaki giriş 4 sn içinde görünür'); }
  { const { db, poll } = kurucu(false); poll(); assert.strictEqual(db.yukleme, 1); ok('Bilet canlı ekran: demo ve yerelde yine okur'); }
}
// Müşteri sayfaları: müşteri kipinde kayıt anında gider, load zararsız; /t/ olmadan oturum açık personel sayfası bulut belgesi kullanır
async function takip() {
  const SIPTAKIP = { id: 'terzi', status: [{ id: 'yeni', name: 'Yeni' }], onay: { baslik: 'O', uyari: 'U', sonra: 'hazir', geri: 'yeni' }, baslik: 'B', soru: 'S', kodMetni: 'K' };
  const veri = () => ({ orders: [{ id: 'o1', no: 'S1', code: 'KOD1', status: 'yeni', log: [], lines: [], proofs: [{ rev: 1, status: 'bekliyor' }] }] });
  const onayla = (db) => { const { kok } = kur(['siparisortak/takip.js'], db, { window: { SIPTAKIP }, arama: '?kod=KOD1' }); kok['#tc'] = { checked: true }; kok['#ok'].onclick(); };
  { const db = belge(true, veri()); onayla(db); assert.strictEqual(db.get('orders', 'o1').proofs[0].status, 'onaylandi'); assert.strictEqual(db.get('orders', 'o1').status, 'hazir'); assert.strictEqual(db.yukleme, 0); ok('Sipariş takip: oturum açık personelin onayı silinmez'); }
  { const db = belge(false, veri(), { pub: true, lookup: () => true }); onayla(db); assert.strictEqual(db.get('orders', 'o1').approval.status, 'onay'); ok('Sipariş takip: müşteri kipinde onay yazılır'); }
  { const db = belge(false, veri()); onayla(db); assert.ok(db.yukleme > 0); assert.strictEqual(db.get('orders', 'o1').proofs[0].status, 'onaylandi'); ok('Sipariş takip: demo ve yerelde yine okur'); }
}
async function saha() {
  const veri = () => ({ jobs: [{ id: 'j1', no: 'İ1', code: 'KOD1', title: 'İş', status: 'tamam', log: [], lines: [] }] });
  const bildir = async (db) => { const r = kur(['saha-ortak/portal.js'], db, { arama: '?kod=KOD1' }); r.T.form = { note: 'Musluk akıyor' }; r.w.SAHA_PORTAL({ id: 'usta', title: 'T', icon: 'x', statuses: [] }); await r.kok['#sor'].onclick({ currentTarget: { dataset: { j: 'j1' } } }); };
  { const db = belge(true, veri()); await bildir(db); assert.strictEqual(db.get('jobs', 'j1').issue.note, 'Musluk akıyor'); assert.strictEqual(db.yukleme, 0); ok('Saha portalı: oturum açık personelin bildirimi silinmez'); }
  { const db = belge(false, veri(), { pub: true, lookup: () => true }); await bildir(db); assert.strictEqual(db.get('jobs', 'j1').issue.note, 'Musluk akıyor'); ok('Saha portalı: müşteri kipinde bildirim yazılır'); }
  { const db = belge(false, veri()); await bildir(db); assert.ok(db.yukleme > 0); assert.strictEqual(db.get('jobs', 'j1').issue.note, 'Musluk akıyor'); ok('Saha portalı: demo ve yerelde yine okur'); }
}

(async () => {
  await emlak(); await pazaryeri(); await crm(); await klinik(); await muhasebe(); await randevu(); await veteriner(); await site(); await bilet(); await takip(); await saha();
  console.log(`
${n} test geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
