// Sipariş ve Teslim ailesi uçtan uca (MariaDB): rol kısıtı, /t/ sayfaları, takip kodu, tasarım onayı, talep, başka işletme yalıtımı.
//   node server/test/siparis-bulut.test.js
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const mysql = require('mysql2/promise'); const assert = require('assert');
const PORT = Number(process.env.TEST_PORT) || 5098; const BASE = `http://127.0.0.1:${PORT}`;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const DBN = (process.env.TEST_DB_NAME || 'nebsoft_sip') + '_bulut'; const RU = 'ns_sipb';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nssip-'));
let n = 0; const ok = (m) => { n++; console.log('  ✓', m); };
function client() { let cookie = ''; return async (method, url, body) => { const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* html */ } return { status: r.status, j, t }; }; }
const belge = () => ({ _meta: {}, _settings: { bizName: 'Baskı Evi', bizPhone: '0212', smsKey: 'GIZLI-ANAHTAR' }, users: [{ id: 'u1', role: 'admin', pin: '1111' }], staff: [], services: [{ id: 'h1', name: 'Branda', price: 100, cost: 40 }], sms: [], requests: [], customers: [{ id: 'c1', name: 'Gizli Müşteri', phone: '05320000000' }],
  orders: [{ id: 'ordr1', no: 'MB1', code: 'ABCD2345', customer: 'c1', status: 'onay', address: 'Gizli Adres', internal: 'GIZLI-NOT', lines: [{ name: 'Branda', qty: 2, unit: 'm²', price: 100 }], payments: [{ amount: 50, kind: 'kapora' }], log: [{ at: '2026-01-01T10:00:00Z', status: 'onay', note: 'GIZLI-LOG', user: 'Ali' }], proofs: [{ rev: 1, status: 'bekliyor', note: 'Ön yüz', at: '2026-01-01T10:00:00Z' }] }] });
(async () => {
  console.log('Sipariş ve Teslim uçtan uca (MariaDB)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS '${RU}'@'127.0.0.1'; DROP USER IF EXISTS '${RU}'@'localhost'; CREATE USER '${RU}'@'127.0.0.1' IDENTIFIED BY 'SipTest123'; CREATE USER '${RU}'@'localhost' IDENTIFIED BY 'SipTest123'; GRANT ALL ON ${DBN}.* TO '${RU}'@'127.0.0.1'; GRANT ALL ON ${DBN}.* TO '${RU}'@'localhost'; FLUSH PRIVILEGES;`);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'test-secret-123', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const O = client(), Y = client(), O2 = client(), P = client();
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: RU, password: 'SipTest123', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: 'admin@sip.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await O('POST', '/api/auth/register', { email: 'sahip@matbaa.test', pass: 'Sifre1234', name: 'Sahip Bir', phone: '05321112233', company: 'Baskı Evi', kvkk: true, product: 'matbaa' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('yeni program kaydı ve deneme açılır');
    r = await O('PUT', '/api/data/matbaa', { data: belge(), base: 0 }); assert.equal(r.j.version, 1, JSON.stringify(r.j));
    r = await O('GET', '/api/auth/me'); const slug = r.j.tenant.slug; const api = `/api/public/${slug}/matbaa`;
    r = await P('GET', `/t/${slug}/apps/matbaa/takip.html`); assert.equal(r.status, 200); assert.ok(r.t.includes('../siparisortak/takip.js'));
    r = await P('GET', `/t/${slug}/apps/siparisortak/takip.js`); assert.equal(r.status, 200); r = await P('GET', `/t/${slug}/apps/siparisortak/hesap.js`); assert.equal(r.status, 200); ok('işletme adresinden müşteri sayfası ve ortak betikler açılır');
    r = await P('POST', api + '/view', {}); assert.equal(r.status, 200); assert.ok(!r.t.includes('GIZLI') && !r.t.includes('Gizli')); assert.deepEqual(r.j.data.orders, []); ok('kodsuz görünümde sipariş ve gizli ayar yok');
    r = await P('POST', api + '/view', { q: { kod: 'MB1' } }); assert.equal(r.status, 401); ok('sıralı kayıt numarasıyla giriş olmaz');
    r = await P('POST', api + '/view', { q: { kod: 'abcd2345' } }); assert.equal(r.status, 200, JSON.stringify(r.j)); const tok = r.j.token; assert.ok(tok); assert.ok(!r.t.includes('GIZLI') && !r.t.includes('Gizli')); assert.equal(r.j.data.orders[0].lines[0].price, 100); assert.equal(r.j.data.orders[0].proofs[0].status, 'bekliyor'); ok('takip koduyla yalnız izinli alanlar gelir');
    r = await P('POST', api + '/ops', { ops: [{ c: 'orders', op: 'upd', id: 'ordr1', set: { approval: { rev: 1, status: 'onay' } } }] }); assert.equal(r.status, 403); ok('kimliksiz ziyaretçi onaylayamaz');
    r = await P('POST', api + '/ops', { token: tok, ops: [{ c: 'orders', op: 'upd', id: 'ordr1', set: { status: 'teslim' } }] }); assert.equal(r.status, 403); ok('müşteri durum yazamaz');
    r = await P('POST', api + '/ops', { token: tok, ops: [{ c: 'orders', op: 'upd', id: 'ordr1', set: { approval: { rev: 1, status: 'revize', note: 'Logo büyük olsun' } } }] }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    let d = (await O('GET', '/api/data/matbaa')).j.data.orders[0]; assert.equal(d.status, 'tasarim'); assert.equal(d.proofs[0].status, 'revize'); assert.equal(d.proofs[0].answer, 'Logo büyük olsun'); assert.ok(!d.approval); assert.equal(d.log.length, 2); assert.equal(d.log[0].note, 'GIZLI-LOG'); ok('düzeltme isteği panele geçer, tasarıma döner, geçmiş korunur');
    r = await P('POST', api + '/ops', { token: tok, ops: [{ c: 'orders', op: 'upd', id: 'ordr1', set: { approval: { rev: 1, status: 'onay' } } }] }); assert.equal(r.status, 403); ok('yanıtlanmış sürüm ikinci kez onaylanamaz');
    r = await P('POST', api + '/ops', { ops: [{ c: 'requests', op: 'ins', rec: { id: 'rq001', name: 'X', phone: '05321112233', note: 'y' } }] }); assert.equal(r.status, 403); ok('talep açmayan programda talep yazılamaz');
    r = await O2('POST', '/api/auth/register', { email: 'sahip@pasta.test', pass: 'Sifre1234', name: 'Sahip İki', phone: '05321112244', company: 'Pasta Evi', kvkk: true, product: 'pastane' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await O2('PUT', '/api/data/pastane', { data: { _meta: {}, _settings: { bizName: 'Pasta Evi' }, users: [{ id: 'u1', role: 'admin', pin: '2222' }], orders: [], requests: [], customers: [] }, base: 0 }); assert.equal(r.j.version, 1, JSON.stringify(r.j));
    const s2 = (await O2('GET', '/api/auth/me')).j.tenant.slug; const a2 = `/api/public/${s2}/pastane`;
    r = await P('POST', a2 + '/ops', { ops: [{ c: 'requests', op: 'ins', rec: { id: 'rq001', name: 'Ece', phone: '05321112255', note: 'Doğum günü pastası', address: '', date: '', time: '', status: 'siparis' } }] }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    d = (await O2('GET', '/api/data/pastane')).j.data.requests[0]; assert.equal(d.status, 'yeni'); assert.equal(d.note, 'Doğum günü pastası'); ok('müşteri talebi panele yeni olarak düşer, durumu müşteri belirleyemez');
    r = await P('POST', a2 + '/view', { q: { kod: 'ABCD2345' } }); assert.equal(r.status, 401); ok('başka işletmenin kodu bu işletmede geçmez');
    console.log(`\n${n} denetim geçti`);
  } finally { srv.kill(); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS '${RU}'@'127.0.0.1'; DROP USER IF EXISTS '${RU}'@'localhost';`).catch(() => {}); await root.end(); fs.rmSync(DATA, { recursive: true, force: true }); }
})().catch((e) => { console.error(e); process.exit(1); });
