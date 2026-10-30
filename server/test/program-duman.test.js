// 31 program için tek duman testi (tarayıcısız, Node vm; ağ yok): node server/test/program-duman.test.js [-v]
//  1. Sözdizimi: apps, core, market, admin altındaki her .js dosyası ve .html içindeki gömülü betik derlenir
//  2. Yükleme: her programın index.html'indeki betikler sırayla çalışır, NS.shell yakalanır
//  3. Yönlendirme: menüdeki her sayfanın yönlendirmesi var; açılış sayfası (home) tanımlı; katalogda ürün karşılığı var
//  4. Tohum verisi: boş değil, her kayıtta tekil id, formların zorunlu alanları tohumda dolu
//  5. Canlı metin denetimi: "(demo", "simüle" ve simülasyonu ayırmayan sahte başarı cümleleri kalmamış
// Yapılmayan: gerçek tarayıcı çizimi, tıklama akışları (bunlar kalite kapısındaki tarayıcı denemesidir).
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'); const V = process.argv.includes('-v');
let passed = 0; const fails = []; const ok = (m) => { passed++; console.log('  ✓ ' + m); }; const bad = (m) => fails.push(m);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const walk = (d, o = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'vendor') walk(p, o); } else o.push(p); } return o; };
const inline = (html) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({ attrs: m[1], code: m[2] }));
const isJs = (a) => !/type=["']?(application\/ld\+json|text\/(template|plain))/i.test(a);

// ---------- Sahte tarayıcı ----------
function stub() {
  const f = function () {};
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === Symbol.iterator) return function* () { /* boş */ };
      if (k === 'then' || k === 'catch') return undefined;
      if (k === 'length' || k === 'scrollHeight' || k === 'offsetWidth' || k === 'clientWidth') return 0;
      if (k === 'value' || k === 'innerHTML' || k === 'textContent') return t[k] === undefined ? '' : t[k];
      if (k === 'toString') return () => '';
      if (k === 'querySelectorAll' || k === 'getElementsByTagName' || k === 'getElementsByClassName') return () => [];
      if (k === 'querySelector' || k === 'closest') return () => null;
      if (k in t) return t[k];
      return (t[k] = stub());
    },
    set(t, k, v) { t[k] = v; return true; }, apply() { return stub(); }, construct() { return stub(); },
  });
}
function sandbox(pathname, search = '?demo=1') {
  const store = new Map(); const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear(), key: (i) => [...store.keys()][i] || null, get length() { return store.size; } };
  const listeners = {}; const on = (k, fn) => { (listeners[k] = listeners[k] || []).push(fn); };
  const doc = stub(); doc.addEventListener = on; doc.createElement = () => stub(); doc.readyState = 'complete'; doc.documentElement = stub(); doc.body = stub(); doc.head = stub(); doc.title = ''; doc.cookie = ''; doc.getElementById = () => null; doc.querySelector = () => null; doc.querySelectorAll = () => []; doc.createTextNode = () => stub();
  const noop = () => {}; const Ob = class { observe() {} disconnect() {} unobserve() {} };
  const s = {
    console: V ? console : { log: noop, warn: noop, info: noop, debug: noop, error: noop }, document: doc, localStorage: storage, sessionStorage: storage, history: { replaceState: noop, pushState: noop, back: noop }, navigator: { userAgent: 'duman', onLine: true, language: 'tr', clipboard: {}, platform: 'test', mediaDevices: {} },
    location: { href: `http://localhost${pathname}${search}`, pathname, search, hash: '', origin: 'http://localhost', protocol: 'http:', host: 'localhost', hostname: 'localhost', port: '', replace: noop, assign: noop, reload: noop },
    addEventListener: on, removeEventListener: noop, dispatchEvent: noop, setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop, requestAnimationFrame: () => 0, cancelAnimationFrame: noop, queueMicrotask: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }), getComputedStyle: () => stub(), scrollTo: noop, open: noop, print: noop, alert: noop, confirm: () => false, prompt: () => null,
    fetch: () => Promise.reject(new Error('ağ yok')), XMLHttpRequest: class { open() {} setRequestHeader() {} send() {} get status() { return 0; } get responseText() { return '{}'; } }, BroadcastChannel: class { postMessage() {} close() {} addEventListener() {} }, WebSocket: class {},
    IntersectionObserver: Ob, ResizeObserver: Ob, MutationObserver: Ob, Image: class {}, Audio: class { play() { return Promise.resolve(); } }, FormData: class {}, FileReader: class {}, Blob, URL, URLSearchParams, TextEncoder, TextDecoder, AbortController, CustomEvent: class {}, Event: class {}, HTMLElement: class {}, HTMLInputElement: class { set value(v) {} get value() { return ""; } }, HTMLTextAreaElement: class { set value(v) {} get value() { return ""; } }, HTMLSelectElement: class { set value(v) {} get value() { return ""; } }, Node: class {}, crypto: { getRandomValues: (a) => require('crypto').randomFillSync(a), randomUUID: () => require('crypto').randomUUID(), subtle: {} }, btoa: (x) => Buffer.from(String(x), 'binary').toString('base64'), atob: (x) => Buffer.from(String(x), 'base64').toString('binary'), performance: { now: () => Date.now() }, Notification: { permission: 'denied' }, screen: { width: 1280, height: 800 }, innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  };
  s.window = s; s.self = s; s.globalThis = s; s.top = s; s.parent = s; s.__listeners = listeners;
  return vm.createContext(s);
}

// ---------- 1. Sözdizimi ----------
function syntax() {
  let n = 0;
  for (const d of ['apps', 'core', 'market', 'admin']) for (const f of walk(path.join(ROOT, d))) {
    if (f.endsWith('.js')) { try { new vm.Script(fs.readFileSync(f, 'utf8').replace(/^#!.*/, ''), { filename: rel(f) }); n++; } catch (e) { bad(`sözdizimi ${rel(f)}: ${e.message}`); } }
    if (f.endsWith('.html')) inline(fs.readFileSync(f, 'utf8')).filter((s) => isJs(s.attrs) && !/\bsrc=/i.test(s.attrs) && !/type=["']?module/i.test(s.attrs)).forEach((s, i) => { try { new vm.Script(s.code, { filename: `${rel(f)}#${i}` }); n++; } catch (e) { bad(`sözdizimi ${rel(f)}#${i}: ${e.message}`); } });
  }
  ok(`sözdizimi: ${n} betik derlendi`);
}

// ---------- 2-4. Program yükleme ----------
function catalog() { const w = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'market', 'catalog.js'), 'utf8'), { window: w }); return w.CATALOG; }
function program(id, cat) {
  const dir = path.join(ROOT, 'apps', id); const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const ctx = sandbox(`/apps/${id}/index.html`); const cap = { cruds: [] }; const scripts = [];
  for (const m of inline(html)) { const src = (/\bsrc=["']([^"']+)["']/i.exec(m.attrs) || [])[1]; if (!isJs(m.attrs)) continue; if (src && /^https?:/.test(src)) continue; if (src) { const f = path.join(dir, src.split('?')[0]); if (!fs.existsSync(f)) { bad(`${id}: betik yok ${src}`); continue; } scripts.push([fs.readFileSync(f, 'utf8'), rel(f)]); } else scripts.push([m.code, `apps/${id}/index.html`]); }
  for (const [code, name] of scripts) {
    try { vm.runInContext(code, ctx, { filename: name, timeout: 20000 }); } catch (e) { bad(`${id}: ${name} çalışmadı: ${e.message}`); return null; }
    if (ctx.NS && !cap.wrapped) { cap.wrapped = true; const sh = ctx.NS.shell; const cr = ctx.NS.crud; ctx.NS.shell = (o) => { cap.opts = o; try { cap.app = sh(o); } catch (e) { cap.shellErr = e.message; } return cap.app || { opts: o, db: o.db }; }; ctx.NS.crud = (el, a, c) => { cap.cruds.push(c); return cr(el, a, c); }; }
  }
  (ctx.__listeners.DOMContentLoaded || []).forEach((fn) => { try { fn({}); } catch (e) { /* DOM gerekir */ } });
  if (!cap.opts) { bad(`${id}: NS.shell çağrılmadı`); return null; }
  const o = cap.opts; const R = o.routes || {}; const BUILTIN = ['entegrasyonlar', 'ebelge'];
  (o.nav || []).filter((n) => n.id && !BUILTIN.includes(n.id)).forEach((n) => { if (typeof R[n.id] !== 'function') bad(`${id}: menü "${n.id}" için yönlendirme yok`); });
  const home = o.home || (o.nav.find((n) => n.id) || {}).id; if (typeof R[home] !== 'function') bad(`${id}: açılış sayfası "${home}" yok`);
  if (o.id !== id) bad(`${id}: shell id "${o.id}" klasörle uyuşmuyor`);
  if (!cat.products.some((p) => p.id === id)) bad(`${id}: katalogda ürün yok`);
  // Tohum
  const data = o.db && o.db.data; if (!data) { bad(`${id}: veritabanı yok`); return null; }
  const cols = Object.keys(data).filter((k) => !k.startsWith('_') && Array.isArray(data[k])); const rows = cols.reduce((t, c) => t + data[c].length, 0);
  if (!rows) bad(`${id}: tohum verisi boş`);
  cols.forEach((c) => { const seen = new Set(); data[c].forEach((r, i) => { if (!r || typeof r !== 'object') return; if (r.id === undefined || r.id === null || r.id === '') return bad(`${id}.${c}[${i}]: id yok`); if (seen.has(r.id)) bad(`${id}.${c}: yinelenen id ${r.id}`); seen.add(r.id); }); });
  // Sayfaları çalıştır: yalnızca NS.crud yapılandırmalarını toplamak için (sahte DOM'da hata beklenebilir, sonuç sayılmaz)
  const el = stub(); for (const k of Object.keys(R)) { try { const r = R[k](el, undefined, cap.app || { opts: o, db: o.db, can: () => true, go() {}, refresh() {} }); if (r && r.catch) r.catch(() => {}); } catch (e) { /* sahte DOM */ } }
  let req = 0; const miss = {};
  cap.cruds.forEach((c) => { const fs2 = typeof c.fields === 'function' ? null : c.fields; if (!Array.isArray(fs2) || !c.col) return; const need = fs2.filter((f) => f && f.required && f.name && !f.showIf && !f.when && f.type !== 'file'); (data[c.col] || []).slice(0, 200).forEach((r) => { if (!c.test || c.test(r)) need.forEach((f) => { req++; if (r[f.name] === undefined || r[f.name] === null || r[f.name] === '') { const k = `${c.col}.${f.name}`; miss[k] = (miss[k] || 0) + 1; } }); }); });
  // Formun sanal alanları: kayıtta başka biçimde tutulur (anaokulu p1n/p1p → parents[0]; site opts → options)
  const VIRTUAL = ['students.p1n', 'students.p1p', 'polls.opts'];
  Object.entries(miss).filter(([k]) => !VIRTUAL.includes(k)).forEach(([k, n]) => bad(`${id}.${k}: zorunlu alan ${n} tohum kaydında boş`));
  if (KV[id]) kvkk(id, ctx, data);
  return { id, routes: Object.keys(R).length, cols: cols.length, rows, cruds: cap.cruds.length, req, shellErr: cap.shellErr };
}

// ---------- Kişisel veri araçları (sağlık programları) ----------
const KV = { klinik: { col: 'patients', link: 'patient' }, eczane: { col: 'patients', link: 'patient', phoneCols: ['rxOrders'] }, veteriner: { col: 'owners', link: 'owner', sub: [{ col: 'pets', link: 'owner', as: 'pet' }] } };
function kvkk(id, ctx, data) {
  const K = ctx.NS.kvkk; if (!K) return bad(`${id}: core/kvkk.js yüklenmedi`);
  const plan = KV[id]; const p = data[plan.col].find((r) => data.visits ? data.visits.some((v) => v[plan.link] === r.id) || (plan.sub && data.pets.some((x) => x.owner === r.id)) : true) || data[plan.col][0];
  if (plan.phoneCols) { assert.ok(String(p.phone || '').replace(/\D/g, '').length >= 10, 'hastanın telefonu olmalı'); data.rxOrders = [...(data.rxOrders || []), { id: 'rx-duman', phone: '+90 ' + String(p.phone).replace(/^0/, ''), name: 'Online Hasta Duman', rxNo: 'RXDUMAN1', note: 'ozel-recete-notu' }, { id: 'rx-baska', phone: '05000000000', name: 'Baska Hasta Duman' }]; }
  p.note = 'ozel-not-duman'; if (data._log) data._log.unshift({ id: 'l', action: 'x', detail: p.name });
  const c = JSON.parse(JSON.stringify(K.collect(data, plan, p.id))); assert.strictEqual(c.kisi.id, p.id); if (id === 'klinik') assert.ok(Object.keys(c).length > 1, 'bağlı kayıtlar dışa aktarılmalı');
  const r = K.anonymizeData(data, plan, p.id); const s = JSON.stringify(r.data); const before = JSON.stringify(data);
  for (const v of [p.name, p.phone, p.tc, 'ozel-not-duman']) if (v && String(v).length >= 5) { assert.ok(before.includes(JSON.stringify(String(v)).slice(1, -1))); if (s.includes(JSON.stringify(String(v)).slice(1, -1))) bad(`${id}: anonimleştirme sonrası veri kaldı: ${v}`); }
  if (plan.phoneCols) { assert.ok(c.rxOrders.some((x) => x.id === 'rx-duman'), 'online reçete dışa aktarılmalı'); const o = r.data.rxOrders.find((x) => x.id === 'rx-duman'); if (o.name || o.phone || o.rxNo || o.note) bad(`${id}: online reçete kaydında kişisel veri kaldı`); assert.strictEqual(r.data.rxOrders.find((x) => x.id === 'rx-baska').name, 'Baska Hasta Duman', 'başka hastanın kaydı değişmemeli'); }
  const a = r.data[plan.col].find((x) => x.id === p.id); assert.ok(a.anonAt && a.passive && /^Anonim-/.test(a.name));
  assert.strictEqual(r.data[plan.col].length, data[plan.col].length, 'kayıt sayısı değişmemeli'); ['payments', 'sales'].forEach((col) => { if (data[col]) assert.strictEqual(JSON.stringify(r.data[col].map((x) => x.total ?? x.amount)), JSON.stringify(data[col].map((x) => x.total ?? x.amount)), 'tutarlar değişmemeli'); });
}

// ---------- 5. Canlı metin denetimi ----------
// Bu dosyalar yalnızca tarayıcı içi demo mağazadır veya işletme verisini anlatan sabit metindir
const TEXT_ALLOW = [[/emlak[\/]app\.js$/, /data-of=/], [/eticaret[\/]app\.js$/, /c\.reminded === 'sms'/], 
  [/apps\/adisyon\/platform\.js/, /Sos eksik gönderildi/], // örnek yorum tohumu
  [/./, /Yanlış ürün gönderildi/], // iade nedeni seçeneği
  [/./, /gönderildikçe/], // açıklama cümlesi, başarı bildirimi değil
  [/apps\/crm\/app\.js/, /Teklif ve referans listesi iletildi\./], // örnek etkinlik tohumu
  [/apps\/crm\/teklif\.html/, /güncel bir sürüm gönderildi/], // işletmenin yaptığı işlemi anlatır
  [/apps\/crm\/app\.js/, /Teklif \$\{q\.no\} gönderildi/], // kaydın zaman çizelgesi notu
  [/market\/market\.js/, /adresine gönderildi<\/span>|Yeni kod gönderildi/], // sunucudan onaylı doğrulama kodu ekranı
  [/apps\/emlak\/ilan\.html/, /Mesajınız iletildi/], [/apps\/randevu\/book\.html/, /Talebiniz işletmeye iletildi/], // kayıt sunucuya yazıldı
  [/apps\/otoservis\/app\.js/, /Müşteri onayına gönderildi/], // iç durum kaydı
  [/apps\/musavir\/portal\.html/, /iletildi \(portal bildirimi\)/], // portal mesajı kayda yazılır
  [/apps\/muhasebe\/beyan\.js/, /badge\('Gönderildi'/], // kullanıcının işaretlediği durum
  [/apps\/muhasebe\/hatirlat\.js/, /badge\('gönderildi'/], [/apps\/servis\/app\.js/, /=== 'gönderildi' \? badge/], [/core\/integrations\.js/, /'gonderildi': \['Gönderildi'|\/gönderildi\|yazdırıldı/],
  [/core\/integrations\.js/, /log\(/], // gerçek gönderim dalındaki kayıt satırı (simülasyon dalı ayrı döner)
  [/core\/core\.js/, /"3 gönderildi/], // yorum
  // Müşteri portalı mesajları: kayıt sunucuya yazılır, işletme panelinde görür (dış gönderim değil)
  [/\.html$/, /(Mesajınız|İtirazınız|Talebiniz|Tercihiniz|Evrakınız|İzniniz|Okula|Randevu isteğiniz|Geri bildiriminiz)[^'`]* iletildi|iletildi/],
  [/apps\/musavir\/app\.js/, /Yanıt portala iletildi/], // portal mesajı kayda yazılır
  [/apps\/kargo\/takip\.html/, /göndericiye geri gönderildi/], // kargo durumu
  [/apps\/adisyon\/app\.js/, /mutfağa gönderildi|Mutfağa gönderildi/], // program içi mutfak ekranı
  [/apps\/(eticaret\/pazaryeri|pazaryeri\/app)\.js/, /pazaryerine gönderildi|onaya gönderildi/], // üst satırda isLive denetimi var, simülasyon ayrı döner
  [/apps\/ik\/app\.js/, /bankaya iletildi/], [/apps\/otel\/app\.js/, /Onay gönderildi/], [/apps\/randevu\/app\.js/, /SMS gönderildi|otomatik gönderildi/], [/core\/integrations\.js/, /SMS gönderildi|WhatsApp mesajı gönderildi/], // simülasyon dalı üst satırda döner
  [/apps\/muhasebe\/hatirlat\.js/, /ödeme hatırlatması gönderildi/], // sayaç simülasyonu saymaz
];
function textAudit() {
  let n = 0; const files = [...walk(path.join(ROOT, 'apps')), ...walk(path.join(ROOT, 'market')), ...walk(path.join(ROOT, 'core'))].filter((f) => /\.(js|html)$/.test(f) && !/\.test\.js$/.test(f));
  const SIM = /simulated|simülasyon|\bTEST\b|\.test\b|sm\.ok|k === 'ok'|\bsent\b|\btest\b|realOk\(/;
  for (const f of files) {
    const name = rel(f); fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      n++; const at = `${name}:${i + 1}`;
      if (/\([Dd]emo\b/.test(line) && !/^\s*(\/\/|\*)/.test(line) && !/[?&]demo=1|Kapalı \(demo ödeme\)|demo ödeme kullanılıyor|NAME_FAKE/.test(line)) bad(`"(demo" metni: ${at}`);
      if (/simüle ediliyor|simüle edildi|sahte başarı(?! yok)/i.test(line)) bad(`simülasyon metni: ${at}`);
      const m = /[^'"`]{0,60}(gönderildi|Gönderildi|iletildi|raporlandı)/.exec(line); if (!m) return;
      if (/^\s*(\/\/|\*)/.test(line) || SIM.test(line) || TEXT_ALLOW.some(([a, b]) => a.test(name) && b.test(line))) return;
      if (/r\.ok \?|res\.ok \?|x\.ok \?/.test(line) && /(toast|log)\(/.test(line)) return bad(`simülasyonu ayırmayan başarı: ${at}`);
      if (/toast\(|innerHTML|<p|<div|\$\{/.test(line)) bad(`koşulsuz gönderildi iddiası: ${at}`);
    });
  }
  ok(`canlı metin denetimi: ${files.length} dosya, ${n} satır tarandı`);
  // Sunucudaki test terminali her yanıtta TEST işaretli, sahte onay kodu üretmiyor
  const s = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8'); assert.ok(/test: true, ref: 'TEST'/.test(s) && !/ref: 'DEMO'/.test(s), 'test terminali TEST işaretli olmalı'); ok('POS test terminali yanıtı TEST işaretli');
}

(() => {
  console.log('Program duman testi'); syntax();
  const cat = catalog(); const apps = fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'index.html')));
  assert.strictEqual(apps.length, 31, 'program sayısı 31 olmalı'); const out = apps.map((a) => program(a, cat)).filter(Boolean);
  ok(`${out.length}/31 program yüklendi; ${out.reduce((t, x) => t + x.routes, 0)} yönlendirme, ${out.reduce((t, x) => t + x.rows, 0)} tohum kaydı, ${out.reduce((t, x) => t + x.req, 0)} zorunlu alan denetlendi`);
  if (V) console.table(out);
  textAudit();
  if (fails.length) { console.error(`\n${fails.length} sorun:`); fails.forEach((x) => console.error('  ✗ ' + x)); process.exit(1); }
  console.log(`\n${passed} denetim geçti`); process.exit(0);
})();
