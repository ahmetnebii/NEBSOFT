// Belge şifreleme ve PIN özeti. Saf işlevler + gerçek MariaDB ile uçtan uca (ham satır okunur):
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/sifreleme.test.js
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
process.env.NEBSOFT_SECRET = 'test-secret-sifreleme'; delete process.env.NEBSOFT_SECRET_ESKI;
const belge = require('../cloud/belge'); const pin = require('../cloud/pin');

const PORT = Number(process.env.TEST_PORT || 5199) + 3, DBN = 'ns_sifre_test';
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nssifre-')); const B = `http://127.0.0.1:${PORT}`;
let n = 0; const ok = (m) => { n++; console.log('  ✓ ' + m); };
const client = () => { let ck = ''; return async (m, p, body) => { const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', Origin: B, Cookie: ck }, body: body === undefined ? undefined : JSON.stringify(body) }); const c = r.headers.getSetCookie(); if (c.length) ck = c.map((x) => x.split(';')[0]).join('; '); return { status: r.status, j: await r.json().catch(() => ({})) }; }; };

async function saf() {
  console.log('Saf işlevler');
  const t = JSON.stringify({ patients: [{ name: 'Gizli Hasta', tani: 'Diyabet' }], not: 'ü'.repeat(5000) });
  const e = await belge.kapat('t1', 'klinik', t); assert.ok(e.startsWith('nsdoc1:')); assert.ok(!e.includes('Gizli') && !Buffer.from(e.slice(7), 'base64').includes('Gizli'));
  assert.strictEqual(await belge.ac('t1', 'klinik', e), t); assert.notStrictEqual(await belge.kapat('t1', 'klinik', t), e); ok('şifreli metin açılıyor, her yazımda farklı');
  assert.strictEqual(await belge.kapat('t1', 'pos', t), t); assert.strictEqual(await belge.ac('t1', 'klinik', t), t); ok('şifrelenmeyen program ve eski düz kayıt olduğu gibi okunuyor');
  await assert.rejects(belge.ac('t2', 'klinik', e), (x) => x.status === 500); await assert.rejects(belge.ac('t1', 'eczane', e), (x) => x.status === 500); ok('başka işletme veya programın satırına taşınan belge açılmıyor');
  const boz = e.slice(0, 60) + (e[60] === 'A' ? 'B' : 'A') + e.slice(61); await assert.rejects(belge.ac('t1', 'klinik', boz), (x) => x.status === 500); ok('değiştirilmiş belge sessizce boş sayılmıyor, hata veriyor');
  const eskiAna = process.env.NEBSOFT_SECRET; process.env.NEBSOFT_SECRET = 'yeni-anahtar'; await assert.rejects(belge.ac('t1', 'klinik', e)); process.env.NEBSOFT_SECRET_ESKI = eskiAna; assert.strictEqual(await belge.ac('t1', 'klinik', e), t); ok('anahtar değişiminde eski anahtarla açılıyor'); process.env.NEBSOFT_SECRET = eskiAna; delete process.env.NEBSOFT_SECRET_ESKI;

  const h = pin.ozet('t1', 'klinik', 'u1', '4821'); assert.ok(h.startsWith('h1$') && !h.includes('4821')); assert.notStrictEqual(h, pin.ozet('t1', 'klinik', 'u1', '4821'));
  const u = { id: 'u1', pinH: h }; assert.ok(pin.dogrula('t1', 'klinik', u, '4821')); assert.ok(!pin.dogrula('t1', 'klinik', u, '4822')); assert.ok(!pin.dogrula('t2', 'klinik', u, '4821')); assert.ok(!pin.dogrula('t1', 'klinik', { id: 'u2', pinH: h }, '4821')); assert.ok(!pin.dogrula('t1', 'klinik', u, '')); ok('PIN özeti tuzlu, işletme ve kullanıcıya bağlı');
  assert.ok(pin.dogrula('t1', 'klinik', { id: 'u1', pin: '1111' }, '1111')); ok('geçişi bekleyen eski PIN doğrulanıyor');
  const srv = { users: [{ id: 'u1', pinH: h }, { id: 'u2', pin: '9999' }] };
  const y = pin.yazimda('t1', 'klinik', { _meta: { ownerPin: '4821', a: 1 }, users: [{ id: 'u1', name: 'A', pinH: 'h1$sahte$sahte', pinVar: true }, { id: 'u2', name: 'B' }, { id: 'u3', name: 'C', pin: '1234' }, { id: 'u4', name: 'D' }] }, srv);
  assert.strictEqual(y.users[0].pinH, h); ok('istemcinin gönderdiği özet yok sayılıyor, sunucudaki korunuyor'); assert.ok(pin.dogrula('t1', 'klinik', y.users[1], '9999') && !y.users[1].pin); assert.ok(pin.dogrula('t1', 'klinik', y.users[2], '1234') && !y.users[2].pin); assert.ok(!y.users[3].pinH && !('ownerPin' in y._meta)); assert.strictEqual(y._meta.a, 1); ok('düz PIN özetleniyor, ownerPin siliniyor');
  const g = pin.gorunum({ _meta: { ownerPin: '1' }, users: [{ id: 'u1', pinH: h }, { id: 'u2' }] }); assert.deepStrictEqual(g.users, [{ id: 'u1', pinVar: true }, { id: 'u2' }]); assert.ok(!('ownerPin' in g._meta)); ok('istemci görünümünde PIN ve özet yok');
}

async function uctanUca() {
  console.log('Uçtan uca (MariaDB)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS 'ns_sifre'@'127.0.0.1'; CREATE USER 'ns_sifre'@'127.0.0.1' IDENTIFIED BY 'SifreTest123'; GRANT ALL ON ${DBN}.* TO 'ns_sifre'@'127.0.0.1'; FLUSH PRIVILEGES;`);
  await root.query(`USE ${DBN}`);
  const baslat = () => { const s = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] }); s.log = ''; s.stdout.on('data', (d) => { s.log += d; }); s.stderr.on('data', (d) => { s.log += d; }); return s; };
  const bekle = async (s) => { for (let i = 0; i < 80 && !/çalışıyor/.test(s.log); i++) await new Promise((r) => setTimeout(r, 100)); };
  let srv = baslat();
  try {
    await bekle(srv); const O = client(), Y = client(), P = client();
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: 'ns_sifre', password: 'SifreTest123', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: 'admin@sifre.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true);
    r = await O('POST', '/api/auth/register', { email: 'sahip@sifre.test', pass: 'Sifre1234', name: 'Aylin', phone: '05321112233', company: 'Gülüş', kvkk: true, product: 'klinik' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    await O('POST', '/api/trial', { product: 'pos' }); const [[me]] = await root.query('SELECT id, slug FROM tenants LIMIT 1');
    const doc = { users: [{ id: 'u1', name: 'Dr', role: 'admin', pin: '4821', active: true }, { id: 'u2', name: 'Sek', role: 'sekreter', pin: '7733', active: true }], patients: [{ id: 'p1', name: 'Gizli Hasta', anamnez: ['Diyabet'] }], _meta: { ownerPin: '4821' } };
    r = await O('PUT', '/api/data/klinik', { data: doc, base: 0 }); assert.equal(r.j.version, 1, JSON.stringify(r.j));
    let [[row]] = await root.query("SELECT data FROM app_data WHERE app='klinik'"); assert.ok(row.data.startsWith('nsdoc1:')); assert.ok(!/Gizli|Diyabet|4821/.test(row.data)); ok('veritabanı satırında hasta verisi ve PIN okunmuyor');
    r = await O('GET', '/api/data/klinik'); assert.equal(r.j.data.patients[0].name, 'Gizli Hasta'); assert.deepEqual(r.j.data.users.map((u) => [u.pin, u.pinH, u.pinVar]), [[undefined, undefined, true], [undefined, undefined, true]]); assert.ok(!('ownerPin' in r.j.data._meta)); ok('API düz veri döndürüyor, PIN ve özet istemciye gitmiyor');
    // İstemci PIN'siz belgeyi geri yazar
    const g = r.j.data; g.patients[0].phone = '0555'; r = await O('PUT', '/api/data/klinik', { data: g, base: r.j.version }); assert.equal(r.j.version, 2);
    r = await O('POST', '/api/data/klinik/pin', { pin: '7733', uid: 'u2' }); assert.equal(r.j.user.id, 'u2', JSON.stringify(r.j)); ok('PIN\'siz kayıttan sonra özet korunuyor, personel girişi sunucuda doğrulanıyor');
    r = await O('POST', '/api/data/klinik/pin', { pin: '7733', uid: 'u1' }); assert.equal(r.status, 403); ok('başka kullanıcının PIN\'iyle giriş yok');
    r = await O('POST', '/api/data/klinik/pin', { pin: '4821', roles: [] }); assert.equal(r.j.user.id, 'u1'); r = await O('POST', '/api/data/klinik/pin', { pin: '7733', roles: [] }); assert.equal(r.status, 403); ok('yetkili onayı rolü sunucuda denetliyor');
    const yeni = (await O('GET', '/api/data/klinik')).j; yeni.data.users[1].pin = '1212'; r = await O('PUT', '/api/data/klinik', { data: yeni.data, base: yeni.version }); assert.equal(r.status, 200); r = await O('POST', '/api/data/klinik/pin', { pin: '1212', uid: 'u2' }); assert.equal(r.j.user.id, 'u2'); ok('PIN değişikliği sunucuda özetlenip geçerli oluyor');
    [[row]] = await root.query("SELECT data FROM app_data_history WHERE app='klinik' LIMIT 1").catch(() => [[null]]); if (row) { assert.ok(row.data.startsWith('nsdoc1:')); ok('geçmiş kaydı da şifreli'); }
    r = await P('POST', `/api/public/${me.slug}/klinik/view`, {}); assert.notEqual(r.status, 500, JSON.stringify(r.j)); ok('müşteri sayfası şifreli belgeyle çalışıyor');

    // Eski kurulum: düz belge + düz PIN, açılışta geçiş
    await root.query("UPDATE app_data SET data=?, version=7 WHERE app='klinik'", [JSON.stringify(doc)]);
    await root.query("INSERT INTO app_data_history (tenant_id, app, version, data, at) VALUES (?, 'klinik', 1, ?, NOW())", [me.id, JSON.stringify(doc)]);
    await root.query("INSERT INTO app_data (tenant_id, app, data, version, updated) VALUES (?, 'pos', ?, 3, NOW())", [me.id, JSON.stringify({ users: [{ id: 'u1', name: 'K', role: 'admin', pin: '5555' }], products: [{ id: 'x', name: 'Elma' }] })]);
    srv.kill(); await new Promise((res) => srv.once('exit', res)); srv = baslat(); await bekle(srv); await new Promise((res) => setTimeout(res, 1500));
    const [rows] = await root.query('SELECT app, data, version FROM app_data ORDER BY app'); const kl = rows.find((x) => x.app === 'klinik'); const po = rows.find((x) => x.app === 'pos');
    assert.ok(kl.data.startsWith('nsdoc1:'), 'klinik şifrelenmeli'); assert.equal(kl.version, 8); assert.ok(!po.data.startsWith('nsdoc1:')); assert.ok(!po.data.includes('5555') && po.data.includes('pinH') && po.data.includes('Elma')); ok('açılış geçişi: sağlık belgesi şifrelendi, tüm programlarda PIN özetlendi, sürüm arttı');
    const [hist] = await root.query("SELECT data FROM app_data_history WHERE app='klinik'"); assert.ok(hist.every((h) => h.data.startsWith('nsdoc1:'))); ok('geçmiş satırları da geçişte şifrelendi');
    const O2 = client(); await O2('POST', '/api/auth/login', { email: 'sahip@sifre.test', pass: 'Sifre1234' });
    r = await O2('GET', '/api/data/klinik'); assert.equal(r.j.data.patients[0].name, 'Gizli Hasta'); r = await O2('POST', '/api/data/klinik/pin', { pin: '7733', uid: 'u2' }); assert.equal(r.j.user.id, 'u2'); ok('geçişten sonra eski PIN çalışıyor');
    // Bozuk belge üzerine yazılmıyor
    await root.query("UPDATE app_data SET data=CONCAT(LEFT(data, 40), 'AAAA', SUBSTRING(data, 45)) WHERE app='klinik'"); const [[bz]] = await root.query("SELECT data FROM app_data WHERE app='klinik'");
    r = await O2('GET', '/api/data/klinik'); assert.equal(r.status, 500); r = await O2('PUT', '/api/data/klinik', { data: { users: [] }, base: 8 }); assert.equal(r.status, 500); const [[bz2]] = await root.query("SELECT data FROM app_data WHERE app='klinik'"); assert.equal(bz2.data, bz.data); ok('açılamayan belgenin üzerine yazılmıyor');
  } finally { srv.kill(); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS 'ns_sifre'@'127.0.0.1';`).catch(() => {}); await root.end(); fs.rmSync(DATA, { recursive: true, force: true }); }
}

(async () => { await saf(); await uctanUca(); console.log(`\nsifreleme: ${n} kontrol geçti`); process.exit(0); })().catch((e) => { console.error(e); process.exit(1); });
