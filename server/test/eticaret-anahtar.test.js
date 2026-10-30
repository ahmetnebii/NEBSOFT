// E-ticaret pazaryeri anahtarları: mpChannels şifreli yazılır, tarayıcıya yer tutucu iner, /api/kanal sunucuda çözer, depo rolü alanları görmez ve kanal kaydını değiştiremez
//   node server/test/eticaret-anahtar.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
process.env.NEBSOFT_SECRET = 'test-secret-anahtar'; delete process.env.NEBSOFT_SECRET_ESKI;
const s = require('../cloud/secrets'); const K = require('../cloud/rol-kural'); const kanal = require('../connectors');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const js = (x) => JSON.stringify(x); const kopya = (x) => JSON.parse(js(x));
const PFX = 'enc:v1:'; const tk = (k, f) => s.token('eticaret', k, f);
const belge = () => ({ orders: [{ id: 'o1' }], mpChannels: { n11: { connected: true, mode: 'live', sellerId: 'magazam', apiKey: 'gercek-app-key', apiSecret: 'gercek-app-secret', markup: 12 }, trendyol: { connected: false } } });
// Sunucu: belgenin ham hâli, secrets.resolve'un okuduğu satır
const satir = (d) => ({ one: async () => ({ data: js(d) }), q: async () => [] });

function yazma() {
  const m = s.seal('eticaret', belge(), null); const c = m.mpChannels.n11;
  assert.ok(c.apiKey.startsWith(PFX) && c.apiSecret.startsWith(PFX)); assert.ok(!/gercek-app/.test(js(m))); assert.strictEqual(c.sellerId, 'magazam'); assert.strictEqual(c.markup, 12); assert.strictEqual(c.connected, true); ok('apiKey ve apiSecret şifreli yazılır, kalan alanlar düz kalır');
  assert.strictEqual(s.dec(c.apiKey), 'gercek-app-key'); assert.strictEqual(s.dec(c.apiSecret), 'gercek-app-secret'); ok('şifreli değer açılınca aslı çıkar');
  const v = s.mask('eticaret', m); assert.strictEqual(v.mpChannels.n11.apiKey, tk('n11', 'apiKey')); assert.strictEqual(v.mpChannels.n11.apiSecret, tk('n11', 'apiSecret')); assert.ok(!js(v).includes(PFX) && !/gercek-app/.test(js(v))); ok('istemciye yalnız yer tutucu gider, şifreli metin de gitmez');
  const geri = s.seal('eticaret', v, m); assert.strictEqual(geri.mpChannels.n11.apiKey, c.apiKey); assert.strictEqual(geri.mpChannels.n11.apiSecret, c.apiSecret); ok('yer tutucu geri gelince şifreli değer korunur');
  const y = kopya(v); y.mpChannels.n11.apiSecret = 'yeni-secret'; const d = s.seal('eticaret', y, m); assert.strictEqual(d.mpChannels.n11.apiKey, c.apiKey); assert.strictEqual(s.dec(d.mpChannels.n11.apiSecret), 'yeni-secret'); ok('tek alan değişince yalnız o alan yenilenir');
  const eski = belge(); const vE = s.mask('eticaret', eski); assert.ok(!/gercek-app/.test(js(vE))); const gE = s.seal('eticaret', vE, eski); assert.strictEqual(s.dec(gE.mpChannels.n11.apiKey), 'gercek-app-key'); assert.ok(gE.mpChannels.n11.apiKey.startsWith(PFX)); ok('eski düz metin kayıt maskeli okunur, ilk yazımda şifrelenir');
  assert.deepStrictEqual(s.seal('eticaret', { orders: [] }, null), { orders: [] }); ok('mpChannels olmayan belge değişmez');
}

async function gecis() {
  const tablo = { app_data: [{ k: 't1', data: js(belge()) }], app_data_history: [{ k: 1, data: js(belge()) }] }; const yazilan = [];
  const db = { q: async (sql, p) => { if (sql.startsWith('SELECT')) { const t = /FROM (\w+)/.exec(sql)[1]; return p[0] === 'eticaret' ? tablo[t] : []; } yazilan.push(p); return {}; } };
  assert.strictEqual(await s.migrate(db), 2); assert.ok(yazilan.every((p) => !/gercek-app/.test(p[0]) && p[2] === 'eticaret')); ok('açılış geçişi eski kayıtları, 48 saatlik geçmiş dahil, şifreler');
}

async function kopru() {
  const m = s.seal('eticaret', belge(), null); const v = s.mask('eticaret', m);
  const govde = { channel: 'n11', action: 'baglanti-test', creds: { apiKey: v.mpChannels.n11.apiKey, apiSecret: v.mpChannels.n11.apiSecret }, payload: {} };
  const c = await s.resolve(satir(m), 't', govde); assert.strictEqual(c.creds.apiKey, 'gercek-app-key'); assert.strictEqual(c.creds.apiSecret, 'gercek-app-secret'); ok('/api/kanal yer tutucuyu sunucuda çözer');
  const e = await s.resolve(satir(belge()), 't', govde); assert.strictEqual(e.creds.apiSecret, 'gercek-app-secret'); ok('/api/kanal eski düz metin kaydı da çözer');
  const fetch0 = global.fetch; const giden = []; global.fetch = async (u, o) => { giden.push({ u: String(u), h: o.headers }); return new Response('{"content":[],"totalElements":0}', { status: 200, headers: { 'Content-Type': 'application/json' } }); };
  try { await kanal.run('n11', 'baglanti-test', c.creds, {}); } finally { global.fetch = fetch0; }
  assert.ok(giden.length > 0 && giden[0].u.startsWith('https://api.n11.com')); assert.strictEqual(giden[0].h.appKey, 'gercek-app-key'); assert.strictEqual(giden[0].h.appSecret, 'gercek-app-secret'); ok('n11 adaptörü pazaryerine çözülmüş anahtarla gider');
  const fetch1 = global.fetch; global.fetch = async () => { throw new Error('yer tutucu ile dış istek atılmamalı'); };
  try { const r = await kanal.run('n11', 'baglanti-test', { apiKey: '', apiSecret: '' }, {}); assert.strictEqual(r.ok, false); } finally { global.fetch = fetch1; } ok('anahtar çözülemezse dışarı istek gitmez');
  await assert.rejects(s.resolve(satir(m), 't', { url: 'https://kotu.example.com/topla', headers: { A: tk('n11', 'apiSecret') } }), (x) => x.status === 400); ok('/api/istek anahtarı yabancı adrese göndermez');
}

function depo() {
  const ham = s.seal('eticaret', { ...belge(), products: [{ id: 'p', cost: 70 }] }, null); ham.mpChannels.n11.lastPull = '2026-10-01T10:00:00.000Z';
  const f = K.filtrele('eticaret', 'depo', s.mask('eticaret', ham));
  assert.ok(!('apiKey' in f.mpChannels.n11) && !('apiSecret' in f.mpChannels.n11)); assert.ok(!/gercek-app|__nsg_|enc:v1:/.test(js(f))); assert.strictEqual(f.mpChannels.n11.connected, true); assert.strictEqual(f.mpChannels.n11.mode, 'live'); assert.strictEqual(f.mpChannels.n11.sellerId, 'magazam'); ok('depo görünümünde anahtar alanı yok, kanalın canlı olduğu görünür');
  assert.ok(ham.mpChannels.n11.apiKey.startsWith(PFX)); ok('rol süzgeci girdiyi değiştirmez');
  const g = kopya(f); const o = K.geriKoy('eticaret', 'depo', g, ham); assert.strictEqual(o.mpChannels.n11.apiKey, ham.mpChannels.n11.apiKey); assert.strictEqual(o.mpChannels.n11.apiSecret, ham.mpChannels.n11.apiSecret); ok('depo kaydı anahtarı silmez');
  const son = s.seal('eticaret', o, ham); assert.strictEqual(son.mpChannels.n11.apiKey, ham.mpChannels.n11.apiKey); ok('PUT sırası: rol geri koyma sonrası mühür değeri bozmaz');
  const z = kopya(f); z.mpChannels.n11.lastPull = '2026-10-31T09:00:00.000Z'; z.mpChannels.n11.lastStatusPull = '2026-10-31T09:01:00.000Z'; const oz = K.geriKoy('eticaret', 'depo', z, ham); assert.strictEqual(oz.mpChannels.n11.lastPull, z.mpChannels.n11.lastPull); assert.strictEqual(oz.mpChannels.n11.lastStatusPull, z.mpChannels.n11.lastStatusPull); ok('depo sipariş çekme zamanını yazabilir');
  const k = kopya(f); Object.assign(k.mpChannels.n11, { apiKey: 'degistirdim', apiSecret: tk('trendyol', 'apiSecret'), sellerId: 'baskasi', mode: 'sim', markup: 0, hook: 'https://kotu.example.com/topla', lastPull: 'https://kotu.example.com/topla' }); k.mpChannels.amazon = { connected: true, apiKey: 'yeni' }; delete k.mpChannels.trendyol;
  const ok2 = K.geriKoy('eticaret', 'depo', k, ham); assert.strictEqual(js(ok2.mpChannels), js(ham.mpChannels)); ok('depo kanal ayarını, anahtarı ve kanal listesini değiştiremez');
  const adres = async () => s.resolve(satir(s.seal('eticaret', ok2, ham)), 't', { url: 'https://kotu.example.com/topla', headers: { A: tk('n11', 'apiSecret') } }); return assert.rejects(adres(), (x) => x.status === 400).then(() => ok('depo kanal kaydına adres yazarak anahtarı dışarı çıkaramaz'));
}

function pazaryeriDepo() {
  const s0 = { channels: { trendyol: { connected: true, commission: 21, lastStatusPull: '2026-10-01T10:00:00.000Z' } } };
  const g = { channels: { trendyol: { connected: true, lastStatusPull: '2026-10-31T09:00:00.000Z' } } }; assert.strictEqual(K.geriKoy('pazaryeri', 'depo', g, s0).channels.trendyol.lastStatusPull, '2026-10-31T09:00:00.000Z');
  const a = { channels: { trendyol: { connected: true, lastStatusPull: 'https://kotu.example.com/' } } }; assert.strictEqual(K.geriKoy('pazaryeri', 'depo', a, s0).channels.trendyol.lastStatusPull, '2026-10-01T10:00:00.000Z'); ok('pazaryeri depo: durum çekme zamanı yazılır, zaman olmayan değer reddedilir');
}

// Gerçek pazaryeri.js: depo tarayıcısında anahtar alanı yokken köprüye giden kimlik
async function istemci() {
  const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'eticaret', 'pazaryeri.js'), 'utf8'); const giden = [];
  const NS = { esc: String, $: () => ({}), $$: () => [], on() {}, icon: () => '', money: String, toast() {}, modal() {}, confirm: async () => true, formModal: async () => null, table: () => '', badge: String, kpi: String, pageHead: String, sum: () => 0, iso: (d) => new Date(d).toISOString().slice(0, 10), today: () => '2026-10-31', addDays: (d) => d, uid: () => 'x' };
  const fetch = async (u, o) => { giden.push({ u, b: JSON.parse(o.body) }); return { json: async () => ({ ok: true, data: { orders: [] } }) }; };
  const ctx = vm.createContext({ NS, window: {}, console, fetch }); vm.runInContext(SRC, ctx, { filename: 'pazaryeri.js' }); const MP = ctx.window.MPHUB;
  const db = (cloud, data) => ({ cloud, data: { _settings: {}, ...data }, load() {}, save() {}, col(k) { return (this.data[k] = this.data[k] || []); }, all(k, f) { const c = this.col(k); return f ? c.filter(f) : c.slice(); }, settings(d = {}) { return { ...d, ...this.data._settings }; } });
  const f = K.filtrele('eticaret', 'depo', s.mask('eticaret', s.seal('eticaret', belge(), null)));
  MP.ensure(db(true, kopya(f))); await MP.pullOrders(); assert.strictEqual(giden.length, 1); assert.strictEqual(giden[0].u, '/api/kanal'); assert.strictEqual(giden[0].b.creds.apiKey, tk('n11', 'apiKey')); assert.strictEqual(giden[0].b.creds.apiSecret, tk('n11', 'apiSecret')); ok('depo tarayıcısı köprüye yer tutucu gönderir, sipariş çekme çalışır');
  giden.length = 0; const y = await s.resolve(satir(s.seal('eticaret', belge(), null)), 't', { channel: 'n11', action: 'x', creds: { apiKey: tk('n11', 'apiKey') } }); assert.strictEqual(y.creds.apiKey, 'gercek-app-key'); ok('depodan gelen yer tutucu sunucuda gerçek anahtara döner');
  MP.ensure(db(true, s.mask('eticaret', s.seal('eticaret', belge(), null)))); await MP.pullOrders(); assert.strictEqual(giden[0].b.creds.apiKey, tk('n11', 'apiKey')); ok('yönetici tarayıcısı da maskeli değerle çalışır');
  giden.length = 0; MP.ensure(db(false, { mpChannels: { n11: { connected: true, mode: 'live', apiKey: 'yerel-key', apiSecret: 'yerel-secret' } } })); await MP.pullOrders(); assert.strictEqual(giden[0].b.creds.apiKey, 'yerel-key'); assert.strictEqual(giden[0].b.creds.apiSecret, 'yerel-secret'); ok('yerel kipte anahtar olduğu gibi gider');
  giden.length = 0; MP.ensure(db(false, { mpChannels: { n11: { connected: true, mode: 'live' } } })); await MP.pullOrders(); assert.ok(!/__nsg_/.test(js(giden))); ok('yerel kipte yer tutucu üretilmez');
}

(async () => {
  yazma(); await gecis(); await kopru(); await depo(); pazaryeriDepo(); await istemci();
  console.log(`E-ticaret anahtar testleri: ${n} kontrol geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
