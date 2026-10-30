// Saha programları gerçek MariaDB ile uçtan uca: müşteri sayfası teklif onayı, sıralı no ile giriş reddi, saha ekibi rolü, fotoğraf sınıfı.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/saha-uctan.test.js
// Kendi geçici veri klasörünü ve "ns_saha_test" veritabanını kullanır, sonunda siler.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawn } = require('child_process'); const mysql = require('mysql2/promise');
const ROOT = path.join(__dirname, '..', '..'); const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nssaha-'));
const PORT = Number(process.env.TEST_PORT || 5199) + 11, DBN = 'ns_saha_test'; const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || ''; const B = `http://127.0.0.1:${PORT}`;
let n = 0; const ok = (m) => { n++; console.log('  ✓ ' + m); };
const client = () => { let ck = ''; return async (m, p, body) => { const ham = Buffer.isBuffer(body); const r = await fetch(B + p, { method: m, redirect: 'manual', headers: { 'Content-Type': ham ? 'image/jpeg' : 'application/json', 'x-ns-csrf': '1', Origin: B, Cookie: ck }, body: body === undefined ? undefined : ham ? body : JSON.stringify(body) }); const c = r.headers.getSetCookie(); if (c.length) ck = c.map((x) => x.split(';')[0]).join('; '); const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) { /* metin */ } return { status: r.status, j }; }; };
const doc = () => ({ _meta: {}, _settings: { bizName: 'Saha Test', bizPhone: '0216' }, users: [{ id: 'u1', name: 'Selin', role: 'admin', pin: '1234', active: true }], teams: [{ id: 't0', name: 'A Ekibi' }, { id: 't1', name: 'B Ekibi' }], customers: [{ id: 'k1', name: 'Ayşe', phone: '05321112233', taxNo: '123' }], items: [{ id: 'i1', name: 'Bez', cost: 5, stock: 10 }], services: [], contracts: [{ id: 'c1', no: 'SZ1', code: 'SOZKOD', title: 'Bakım', freq: 'aylik', fee: 100, customer: 'k1' }], invoices: [], sms: [],
  jobs: [{ id: 'j1', no: 'NK1', code: 'ABCDE2', customer: 'k1', title: 'Taşıma', status: 'teklif', team: 't0', note: 'iç not', lines: [{ name: 'Taşıma', qty: 2, price: 500 }], offer: { status: 'bekliyor', total: 1000 }, log: [{ at: '2026-01-01T00:00:00.000Z', status: 'teklif', note: 'iç not', user: 'Selin' }], payments: [] }, { id: 'j2', no: 'NK2', code: 'FGHJK3', customer: 'k1', title: 'Başka', status: 'tamam', team: 't1', lines: [], log: [], payments: [] }] });

(async () => {
  console.log('Saha uçtan uca (MariaDB)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS 'ns_saha'@'127.0.0.1'; CREATE USER 'ns_saha'@'127.0.0.1' IDENTIFIED BY 'SahaTest1234'; GRANT ALL ON ${DBN}.* TO 'ns_saha'@'127.0.0.1'; USE ${DBN}`);
  const s = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'test-secret-saha' }, stdio: ['ignore', 'pipe', 'pipe'] }); s.log = ''; s.stdout.on('data', (d) => { s.log += d; }); s.stderr.on('data', (d) => { s.log += d; });
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(s.log); i++) await new Promise((r) => setTimeout(r, 100));
    const Y = client(), O = client(), M = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: 'ns_saha', password: 'SahaTest1234', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); r = await Y('POST', '/api/setup/admin', { email: 'admin@saha.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true);
    r = await O('POST', '/api/auth/register', { email: 'sahip@saha.test', pass: 'Sifre1234', name: 'Selin', phone: '05321112233', company: 'Saha Test', kvkk: true, product: 'nakliyat' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); for (const p of ['temizlik', 'usta', 'peyzaj']) { r = await O('POST', '/api/trial', { product: p }); assert.equal(r.status, 200, JSON.stringify(r.j)); } ok('Dört program satın alma kataloğunda, deneme açılıyor');
    const [[me]] = await root.query("SELECT t.id, t.slug FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE u.email='sahip@saha.test'");
    for (const app of ['nakliyat', 'temizlik', 'usta', 'peyzaj']) {
      r = await O('PUT', `/api/data/${app}`, { data: doc(), base: 0 }); assert.equal(r.status, 200, JSON.stringify(r.j)); const P = `/api/public/${me.slug}/${app}`;
      r = await M('POST', `${P}/view`, { q: { kod: 'NK1' } }); assert.equal(r.status, 401); r = await M('POST', `${P}/view`, { q: { kod: 'ABCDE2' } }); assert.equal(r.status, 200, JSON.stringify(r.j)); const tk = r.j.token; const txt = JSON.stringify(r.j.data); assert.ok(r.j.data.jobs.length === 1 && !txt.includes('iç not') && !txt.includes('05321112233') && !txt.includes('Selin'), txt); assert.ok(r.j.data.teams[0].name === 'A Ekibi');
      r = await M('POST', `${P}/ops`, { token: tk, ops: [{ c: 'jobs', op: 'upd', id: 'j1', set: { accepted: 1 }, unset: [] }] }); assert.equal(r.status, 403); r = await M('POST', `${P}/ops`, { token: tk, ops: [{ c: 'jobs', op: 'upd', id: 'j2', set: { review: { stars: 5 } }, unset: [] }] }); assert.equal(r.status, 403);
      r = await M('POST', `${P}/ops`, { token: tk, ops: [{ c: 'jobs', op: 'upd', id: 'j1', set: { offerAnswer: { decision: 'onay', note: '' } }, unset: [] }] }); assert.equal(r.status, 200, JSON.stringify(r.j)); const [[d]] = await root.query('SELECT data FROM app_data WHERE app=? AND tenant_id=?', [app, me.id]); const j = (typeof d.data === 'string' ? JSON.parse(d.data) : d.data).jobs[0]; assert.equal(j.status, 'onay'); assert.equal(j.accepted, 1000); assert.ok(j.lines[0].ok); assert.equal(j.offerAnswer, undefined); assert.equal(j.note, 'iç not');
      r = await M('POST', `${P}/view`, { q: { kod: 'SOZKOD' } }); assert.equal(r.status, 200); assert.equal(r.j.data.contracts[0].fee, undefined);
    }
    ok('Müşteri sayfası: no ile giriş yok, iç bilgi gitmez, tutar yazılamaz, başka işe yazılamaz, teklif onayı sunucuda hesaplanır');
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x10, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9]);
    r = await O('POST', '/api/dosya?app=usta&sinif=acik', jpg); assert.equal(r.status, 200, JSON.stringify(r.j)); const [[f]] = await root.query('SELECT sinif FROM dosyalar WHERE id=?', [r.j.id]); assert.equal(f.sinif, 'gizli'); ok('İş fotoğrafı açık istense de gizli sınıfta durur');
    console.log(`\n${n} test geçti`);
  } finally { s.kill(); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS 'ns_saha'@'127.0.0.1'`).catch(() => {}); await root.end(); fs.rmSync(DATA, { recursive: true, force: true }); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
