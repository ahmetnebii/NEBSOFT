// Sunucu tarafı ekip rolleri: saf kural işlevleri + gerçek MariaDB ile uçtan uca.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/rol-kural.test.js
// Test kendi geçici veri klasörünü ve "nebsoft_rol_test" veritabanını kullanır (her çalıştırmada sıfırlanır).
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const mysql = require('mysql2/promise');
const assert = require('assert');
const K = require('../cloud/rol-kural');

const PORT = Number(process.env.TEST_PORT) || 5097;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const BASE = `http://127.0.0.1:${PORT}`; const DBN = 'nebsoft_rol_test';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsrol-'));
let passed = 0; const ok = (name) => { passed++; console.log('  ✓', name); };

const klinikDoc = () => ({
  _meta: { created: '2026-01-01', ownerPin: '4821', _seq_x: 5 }, _settings: { bizName: 'Gülüş', kvkkText: 'Metin' },
  users: [{ id: 'u1', name: 'Dt. Aylin', role: 'admin', pin: '4821', active: true }, { id: 'u2', name: 'Dt. Burak', role: 'hekim', pin: '7733', active: true, doctor: 'd2' }, { id: 'u3', name: 'Ece', role: 'sekreter', pin: '9001', active: true }],
  doctors: [{ id: 'd1', name: 'Dt. Aylin', rate: 40 }], treatments: [{ id: 't1', name: 'Dolgu', price: 2500 }],
  patients: [{ id: 'p1', name: 'Ayşe Kaya', phone: '0532', tc: '11111111110', anamnez: ['Diyabet'], meds: 'Metformin' }, { id: 'p2', name: 'Mehmet Ak', phone: '0533', anamnez: [] }, { id: 'p9', name: 'Eski Kayıt', phone: '0534' }],
  visits: [{ id: 'v1', patient: 'p1', text: 'Akut apikal periodontitis', icd: 'K04.4', doctor: 'd1' }], prescriptions: [{ id: 'r1', patient: 'p1', diag: 'Pulpitis', meds: 'Amoksisilin' }],
  plans: [{ id: 'pl1', patient: 'p1', tooth: 16, price: 2500, status: 'done' }], appts: [{ id: 'a1', patient: 'p1', date: '2026-11-01', time: '10:00', reason: 'Kontrol', status: 'bekliyor' }],
  _log: [{ id: 'l1', at: '2026-01-01', action: 'Kart görüntülendi', detail: 'hasta p1', user: 'Dt. Aylin' }],
});
const ikDoc = () => ({
  _meta: {}, _settings: { depts: 'Üretim, Satış' }, users: [{ id: 'u1', name: 'Pelin', role: 'admin', pin: '5555', active: true }],
  employees: [{ id: 'e1', name: 'Usta Ali', dept: 'Üretim', salary: 42000, salaryType: 'net', tc: '22222222220', iban: 'TR99', phone: '0551', birth: '1990-02-02', start: '2020-01-01', portalCode: 'ABC123', leaveCarry: 3, exit: { reason: 'İstifa' } }, { id: 'e2', name: 'Satışçı Can', dept: 'Satış', salary: 90000, tc: '33333333330', phone: '0552', start: '2021-01-01' }],
  ts: { 'e1|2026-10-01': { s: 'C', ot: 2 }, 'e2|2026-10-01': { s: 'R', ot: 0 } }, roster: { 'e1|2026-10-02': 'v1', 'e2|2026-10-02': 'off' },
  leaves: [{ id: 'l1', emp: 'e1', type: 'I', from: '2026-11-01', to: '2026-11-02', status: 'bekliyor' }, { id: 'l2', emp: 'e2', type: 'R', from: '2026-10-01', to: '2026-10-02', note: 'Doktor raporu', status: 'onay' }],
  advances: [{ id: 'av1', emp: 'e1', amount: 5000 }], files: [{ id: 'f1', emp: 'e1', kind: 'belge', name: 'Sözleşme' }], payClosed: [{ id: 'pc1', ym: '2026-09', at: '2026-10-01', rows: [{ emp: 'e1', net: 42000 }] }], sms: [{ id: 's1', to: '0552', name: 'Satışçı Can', text: 'x' }],
});

function saf() {
  console.log('Saf kural işlevleri');
  // filtrele
  { const d = klinikDoc(); const yedek = JSON.stringify(d); const f = K.filtrele('klinik', 'sekreter', d);
    assert.equal(JSON.stringify(d), yedek); ok('filtrele girdiyi değiştirmez');
    assert.deepEqual(f.visits, []); assert.deepEqual(f.prescriptions, []); assert.equal(f.patients[0].anamnez, undefined); assert.equal(f.patients[0].meds, undefined); assert.equal(f.patients[0].tc, '11111111110'); assert.equal(f.doctors[0].rate, undefined); assert.deepEqual(f._log, []);
    assert.ok(f.users.every((u) => !('pin' in u))); assert.equal(f._meta.ownerPin, undefined); assert.equal(f._meta._seq_x, 5); assert.equal(f.plans.length, 1); assert.equal(f.appts[0].reason, 'Kontrol');
    assert.ok(!/4821|7733|9001|K04\.4|Diyabet|Metformin|Amoksisilin/.test(JSON.stringify(f))); ok('filtrele: tanı, anamnez, reçete, PIN, işlem geçmişi gitmez; sekreterin kullandığı alan kalır'); }
  { assert.equal(K.filtrele('pos', 'kasiyer', { a: 1 }).a, 1); assert.equal(K.filtrele('klinik', 'yok', klinikDoc()).visits.length, 1); assert.equal(K.filtrele('klinik', 'sekreter', null), null); ok('kural yoksa belge olduğu gibi döner (yönlendirici rol doğrulaması ayrıdır)'); }
  // geriKoy
  { const s = klinikDoc(); const g = K.filtrele('klinik', 'sekreter', s); g.patients[0].name = 'Ayşe Kaya Yeni'; g.patients[0].anamnez = []; g.visits = [{ id: 'sahte', icd: 'X' }]; g.users = []; g._settings = { bizName: 'Sahte' }; g.doctors[0].name = 'Sahte'; g.treatments = []; g.appts[0].status = 'geldi';
    const o = K.geriKoy('klinik', 'sekreter', g, s);
    assert.equal(o.patients[0].name, 'Ayşe Kaya Yeni'); assert.deepEqual(o.patients[0].anamnez, ['Diyabet']); assert.equal(o.patients[0].meds, 'Metformin'); assert.equal(o.appts[0].status, 'geldi');
    assert.deepEqual(o.visits, s.visits); assert.deepEqual(o.prescriptions, s.prescriptions); assert.deepEqual(o.users, s.users); assert.deepEqual(o._settings, s._settings); assert.deepEqual(o.doctors, s.doctors); assert.deepEqual(o.treatments, s.treatments); assert.equal(o._meta.ownerPin, '4821');
    ok('geriKoy: izinli değişiklik kalır; gizli alan, kapalı koleksiyon, users, _settings sunucudan gelir'); }
  { const s = klinikDoc(); const g = K.filtrele('klinik', 'sekreter', s); g.patients.push({ id: 'p7', name: 'Yeni', anamnez: ['Sahte'], meds: 'Sahte' }); const o = K.geriKoy('klinik', 'sekreter', g, s); const n = o.patients.find((x) => x.id === 'p7'); assert.ok(!('anamnez' in n) && !('meds' in n)); ok('yeni kayıtta gizli alanlar boş kalır'); }
  { const s = klinikDoc(); const g = K.filtrele('klinik', 'sekreter', s); g.patients = g.patients.filter((x) => x.id !== 'p1'); const o = K.geriKoy('klinik', 'sekreter', g, s); assert.deepEqual(o.patients.find((x) => x.id === 'p1'), s.patients[0]); const g2 = { ...K.filtrele('klinik', 'sekreter', s) }; delete g2.patients; assert.equal(K.geriKoy('klinik', 'sekreter', g2, s).patients.length, 3); ok('silemez: silinen veya gönderilmeyen hasta tüm alanlarıyla geri konur'); }
  { const s = klinikDoc(); const g = K.filtrele('klinik', 'sekreter', s); g.patients.find((x) => x.id === 'p9').notes = 'y'; const o = K.geriKoy('klinik', 'sekreter', g, s); const n = o.patients.find((x) => x.id === 'p9'); assert.ok(!('anamnez' in n) && n.notes === 'y'); ok('eski kayıtta eksik gizli alan uydurulmaz'); }
  { const s = klinikDoc(); const g = K.filtrele('klinik', 'sekreter', s); g._log = [{ id: 'l1', action: 'Silinen geçmiş' }, { id: 'l2', action: 'Kart görüntülendi', detail: 'p2' }]; const o = K.geriKoy('klinik', 'sekreter', g, s); assert.deepEqual(o._log.map((x) => x.id), ['l2', 'l1']); assert.equal(o._log[1].action, 'Kart görüntülendi'); ok('işlem geçmişi: yalnızca yeni kayıt eklenir, eskisi değişmez ve silinmez'); }
  { const o = K.geriKoy('klinik', 'sekreter', { patients: 'bozuk', _meta: 3 }, klinikDoc()); assert.equal(o.patients.length, 3); assert.equal(o._meta.ownerPin, '4821'); const y = K.geriKoy('klinik', 'sekreter', { a: 1 }, null); assert.equal(y.a, 1); assert.ok(!('users' in y)); ok('bozuk tip ve boş sunucu belgesi güvenli karşılanır'); }
  // veteriner
  { const s = { visits: [{ id: 'v', diagnosis: 'Gastrit' }], vaccines: [{ id: 'x', type: 'Kuduz' }], owners: [{ id: 'o', name: 'A' }], pets: [{ id: 'p', name: 'Pamuk' }], users: [{ id: 'u', pin: '1' }] }; const f = K.filtrele('veteriner', 'asistan', s); assert.equal(f.visits[0].diagnosis, 'Gastrit'); assert.ok(!('pin' in f.users[0]));
    const g = { ...f, visits: [], vaccines: [{ id: 'x', type: 'Sahte', reminded: '2026-10-30' }], owners: [] }; const o = K.geriKoy('veteriner', 'asistan', g, s); assert.deepEqual(o.visits, s.visits); assert.equal(o.vaccines[0].type, 'Kuduz'); assert.equal(o.vaccines[0].reminded, '2026-10-30'); assert.equal(o.owners.length, 1); ok('veteriner asistan: muayeneyi görür, değiştiremez; aşı hatırlatma işareti yazılır; sahip silinmez'); }
  // eczane
  { const s = { sales: [{ id: 's', no: 'S1' }, { id: 's2', no: 'S2' }], ctrl: [{ id: 'c', saleNo: 'S1', patient: 'h' }, { id: 'c2', saleNo: 'S2' }], claims: [{ id: 'cl' }], patients: [{ id: 'h', name: 'A', allergy: 'Penisilin' }], users: [] }; const f = K.filtrele('eczane', 'kalfa', s); assert.deepEqual(f.ctrl, []); assert.deepEqual(f.claims, []); assert.equal(f.patients[0].allergy, 'Penisilin');
    const g = { ...f, sales: [{ id: 's', no: 'S1', canceled: { at: 'x' } }, s.sales[1], { id: 's3', no: 'S3' }], ctrl: [{ id: 'c3', saleNo: 'S3' }, { id: 'c', saleNo: 'SAHTE' }], claims: [] }; const o = K.geriKoy('eczane', 'kalfa', g, s); assert.deepEqual(o.ctrl.map((c) => c.id), ['c', 'c2', 'c3']); assert.equal(o.ctrl[0].saleNo, 'S1'); assert.equal(o.ctrl[0].canceled, true); assert.ok(!o.ctrl[1].canceled); assert.equal(o.claims.length, 1); ok('eczane kalfa: defter okunmaz; satış deftere eklenir, iade işlenir, eski satır değiştirilemez'); }
  // ik
  { const s = ikDoc(); const f = K.filtrele('ik', 'sef', s, { dept: 'Üretim' }); assert.deepEqual(f.employees.map((e) => e.id), ['e1']); const e = f.employees[0]; ['salary', 'salaryType', 'tc', 'iban', 'portalCode', 'exit'].forEach((x) => assert.ok(!(x in e), x)); assert.equal(e.phone, '0551'); assert.equal(e.birth, '1990-02-02'); assert.equal(e.leaveCarry, 3);
    assert.deepEqual(Object.keys(f.ts), ['e1|2026-10-01']); assert.deepEqual(Object.keys(f.roster), ['e1|2026-10-02']); assert.deepEqual(f.leaves.map((l) => l.id), ['l1']); assert.deepEqual(f.advances, []); assert.deepEqual(f.files, []); assert.deepEqual(f.sms, []); assert.equal(f.payClosed[0].ym, '2026-09'); assert.ok(!('rows' in f.payClosed[0]));
    assert.ok(!/42000|90000|Satışçı|Doktor raporu/.test(JSON.stringify(f))); ok('ik şef: yalnızca kendi departmanı; maaş, TC, IBAN, portal kodu, avans, belge gitmez; dönem kilidi görünür');
    const g = JSON.parse(JSON.stringify(f)); g.ts['e1|2026-10-03'] = { s: 'C', ot: 1 }; g.ts['e2|2026-10-03'] = { s: 'D', ot: 0 }; delete g.ts['e1|2026-10-01']; g.roster['e1|2026-10-04'] = 'off'; g.leaves[0].status = 'onay'; g.leaves.push({ id: 'l3', emp: 'e2', type: 'I', status: 'onay' }, { id: 'l2', emp: 'e1', type: 'I' }); g.employees[0].name = 'Sahte'; g.payClosed = [];
    const o = K.geriKoy('ik', 'sef', g, s, { dept: 'Üretim' }); assert.equal(o.ts['e1|2026-10-03'].ot, 1); assert.equal(o.ts['e2|2026-10-03'], undefined); assert.equal(o.ts['e1|2026-10-01'], undefined); assert.equal(o.ts['e2|2026-10-01'].s, 'R'); assert.equal(o.roster['e2|2026-10-02'], 'off');
    assert.equal(o.leaves.find((l) => l.id === 'l1').status, 'onay'); assert.equal(o.leaves.find((l) => l.id === 'l2').emp, 'e2'); assert.equal(o.leaves.filter((l) => l.id === 'l2').length, 1); assert.ok(!o.leaves.some((l) => l.id === 'l3')); assert.deepEqual(o.employees, s.employees); assert.deepEqual(o.payClosed, s.payClosed); assert.deepEqual(o.advances, s.advances);
    ok('ik şef yazma: kendi departmanı işlenir; diğer departman ve salt okunur veriler korunur');
    { const z = ikDoc(); z.signedDocs = [{ id: 'b1', party: 'e1' }, { id: 'b2', party: 'e2', body: 'Gizli' }, { id: 'b3', party: null, partyName: 'Dışarıdan' }]; const w = K.filtrele('ik', 'sef', z, { dept: 'Üretim' }); assert.deepEqual(w.signedDocs.map((b) => b.id), ['b1', 'b3']); w.signedDocs.unshift({ id: 'b4', party: null, partyName: 'Elle' }); const q = K.geriKoy('ik', 'sef', w, z, { dept: 'Üretim' }); assert.deepEqual(q.signedDocs.map((b) => b.id).sort(), ['b1', 'b2', 'b3', 'b4']); ok('ik şef imzalı belgeler: başka departmanın belgesi gitmez, korunur; kişisi elle yazılan belge çalışır'); }
    const y = K.filtrele('ik', 'sef', s, { dept: '' }); assert.deepEqual(y.employees, []); assert.deepEqual(y.ts, {}); ok('departmanı olmayan şef kimseyi görmez (arayüz davranışı)'); }
  // entegrasyon
  { const s = { cfg: { sms: { apiKey: 'enc:v1:abc' } }, log: [{ id: 'a', text: '{"icd":"K04.4"}' }] }; const f = K.filtrele('entegrasyon', '*', s); assert.deepEqual(f.log, []); assert.ok(f.cfg.sms); const o = K.geriKoy('entegrasyon', '*', { cfg: { sms: { apiKey: 'yeni' } }, log: [{ id: 'b', text: 'y' }] }, s); assert.equal(o.cfg.sms.apiKey, 'enc:v1:abc'); assert.deepEqual(o.log.map((x) => x.id), ['b', 'a']); ok('ortak entegrasyon: rolü olan hesap günlüğü okumaz, ayarı değiştiremez, günlüğe ekler'); }
  // rol çözme ve yazma
  { assert.equal(K.rolCoz('klinik', null), null); assert.equal(K.rolCoz('klinik', '{}'), null); assert.equal(K.rolCoz('pos', '{"klinik":"sekreter"}'), null); assert.deepEqual(K.rolCoz('klinik', '{"klinik":"sekreter"}'), { rol: 'sekreter', dept: '' }); assert.deepEqual(K.rolCoz('ik', '{"ik":"sef","ik_dept":"Üretim"}'), { rol: 'sef', dept: 'Üretim' }); assert.equal(K.rolCoz('entegrasyon', '{"klinik":"sekreter"}').rol, '*'); assert.equal(K.rolCoz('ebelge', '{"klinik":"sekreter"}'), null); assert.ok(K.rolCoz('klinik', 'bozuk').hata); assert.ok(K.rolCoz('klinik', '{"klinik":"kaldirildi"}').hata); assert.equal(K.rolCoz('constructor', '{"constructor":"x"}').hata, true); ok('rolCoz: boş kayıt tam yetki, bozuk veya kaldırılmış rol tam yetki sayılmaz'); }
  { let m = K.rolYaz(null, 'klinik', 'sekreter'); m = K.rolYaz(m, 'ik', 'sef', 'Üretim'); assert.deepEqual(JSON.parse(m), { klinik: 'sekreter', ik: 'sef', ik_dept: 'Üretim' }); m = K.rolYaz(m, 'ik', ''); assert.deepEqual(JSON.parse(m), { klinik: 'sekreter' }); assert.equal(K.rolYaz(m, 'klinik', ''), null); assert.throws(() => K.rollerTemizle({ klinik: 'admin' })); assert.throws(() => K.rollerTemizle({ entegrasyon: '*' })); assert.equal(K.rollerTemizle({ klinik: '' }), null); assert.equal(K.rolVar('klinik', 'admin'), false); ok('rolYaz ve rollerTemizle: yalnızca kuraldaki rol, boşta kayıt kalkar'); }
}

function client() {
  let cookie = '';
  return async (method, url, body) => {
    const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    let j = null; try { j = await r.json(); } catch (e) { /* html */ }
    return { status: r.status, j };
  };
}

async function uctanUca() {
  console.log('Uçtan uca (MariaDB)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS 'ns_rol'@'127.0.0.1'; DROP USER IF EXISTS 'ns_rol'@'localhost'; CREATE USER 'ns_rol'@'127.0.0.1' IDENTIFIED BY 'RolTest123'; CREATE USER 'ns_rol'@'localhost' IDENTIFIED BY 'RolTest123'; GRANT ALL ON ${DBN}.* TO 'ns_rol'@'127.0.0.1'; GRANT ALL ON ${DBN}.* TO 'ns_rol'@'localhost';`);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'test-secret-123', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  try {
    for (let i = 0; i < 50 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const O = client(), S = client(), E = client(), O2 = client(), Y = client();
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: 'ns_rol', password: 'RolTest123', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: 'admin@rol.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('kurulum tamam, team_roles sütunu eklendi');
    const [[kol]] = await root.query(`SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema='${DBN}' AND table_name='users' AND column_name='team_roles'`); assert.equal(kol.n, 1);

    r = await O('POST', '/api/auth/register', { email: 'sahip@klinik.test', pass: 'Sifre1234', name: 'Aylin Kara', phone: '05321112233', company: 'Gülüş', kvkk: true, product: 'klinik' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await O2('POST', '/api/auth/register', { email: 'sahip@baska.test', pass: 'Sifre1234', name: 'Başka Sahip', phone: '05321112244', company: 'Başka', kvkk: true, product: 'klinik' }); assert.equal(r.j.ok, true);
    await new Promise((res) => setTimeout(res, 1100)); // hesap sahibi "created" sırasıyla bulunur (saniye çözünürlüklü): üyeler sonraki saniyede eklensin
    r = await O('PUT', '/api/data/klinik', { data: klinikDoc(), base: 0 }); assert.equal(r.j.version, 1);
    r = await O2('PUT', '/api/data/klinik', { data: { users: [], patients: [{ id: 'z1', name: 'Başka Hasta', anamnez: ['Astım'] }] }, base: 0 }); assert.equal(r.j.version, 1);
    r = await O('POST', '/api/team', { name: 'Ece Sekreter', email: 'ece@klinik.test', pass: 'Sifre1234', roller: { klinik: 'admin' } }); assert.equal(r.status, 400); ok('kuralda olmayan rol reddedildi');
    r = await O('POST', '/api/team', { name: 'Ece Sekreter', email: 'ece@klinik.test', pass: 'Sifre1234', roller: { klinik: 'sekreter' } }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await O('POST', '/api/team', { name: 'Eski Üye', email: 'eski@klinik.test', pass: 'Sifre1234' }); assert.equal(r.j.ok, true);
    await S('POST', '/api/auth/login', { email: 'ece@klinik.test', pass: 'Sifre1234' }); await E('POST', '/api/auth/login', { email: 'eski@klinik.test', pass: 'Sifre1234' });

    // Okuma
    r = await S('GET', '/api/data/klinik'); assert.equal(r.status, 200); assert.equal(r.j.rol, 'sekreter'); assert.deepEqual(r.j.data.visits, []); const txt = JSON.stringify(r.j.data); assert.ok(!/K04\.4|periodontitis|Diyabet|Metformin|Amoksisilin|4821|7733|9001/.test(txt), txt); assert.equal(r.j.data.patients[0].name, 'Ayşe Kaya'); ok('sekreter GET: tanı, anamnez, reçete, PIN yok; rol alanı var');
    const vS = r.j.version; const gorS = r.j.data;
    r = await O('GET', '/api/data/klinik'); assert.equal(r.j.rol, undefined); assert.equal(r.j.data.visits[0].icd, 'K04.4'); assert.equal(r.j.data.users[0].pin, '4821'); ok('sahip her şeyi görür, rol alanı yok');
    r = await E('GET', '/api/data/klinik'); assert.equal(r.j.rol, undefined); assert.equal(r.j.data.visits[0].icd, 'K04.4'); assert.equal(r.j.data.users[1].pin, '7733'); ok('rolü olmayan eski ekip üyesi eskisi gibi tam yetkili');
    r = await E('PUT', '/api/data/klinik', { data: { ...r.j.data, _settings: { bizName: 'Gülüş Yeni' } }, base: r.j.version }); assert.equal(r.status, 200); ok('rolü olmayan üye eskisi gibi yazar');
    const v2 = r.j.version;

    // 409 yanıtı
    r = await S('PUT', '/api/data/klinik', { data: gorS, base: vS, rol: 'sekreter' }); assert.equal(r.status, 409); assert.equal(r.j.code, 'conflict'); assert.equal(r.j.rol, 'sekreter'); assert.ok(!/K04\.4|Diyabet|4821/.test(JSON.stringify(r.j)), JSON.stringify(r.j)); ok('409 çakışma yanıtında gizli veri yok');
    assert.equal(r.j.version, v2);

    // Yazma
    const g = JSON.parse(JSON.stringify(r.j.data)); g.patients[0].anamnez = []; g.patients[0].meds = 'Silindi'; g.patients[0].phone = '0599'; g.patients = g.patients.filter((p) => p.id !== 'p2'); g.patients.push({ id: 'p3', name: 'Yeni Hasta', anamnez: ['Sahte'], meds: 'Sahte' }); g.visits = []; g.prescriptions = [{ id: 'x', diag: 'Sahte' }]; g.users = []; g._settings = { bizName: 'Sahte' }; g._meta.ownerPin = '0000'; g.doctors = []; g._log = [{ id: 'ln', action: 'Kart görüntülendi', detail: 'p1' }];
    r = await S('PUT', '/api/data/klinik', { data: g, base: v2, rol: 'sekreter' }); assert.equal(r.status, 200, JSON.stringify(r.j));
    r = await O('GET', '/api/data/klinik'); let d = r.j.data; const p1 = d.patients.find((p) => p.id === 'p1');
    assert.deepEqual(p1.anamnez, ['Diyabet']); assert.equal(p1.meds, 'Metformin'); assert.equal(p1.phone, '0599'); assert.equal(d.visits[0].icd, 'K04.4'); assert.equal(d.prescriptions[0].diag, 'Pulpitis'); assert.equal(d.users.length, 3); assert.equal(d.users[0].pin, '4821'); assert.equal(d._settings.bizName, 'Gülüş Yeni'); assert.equal(d._meta.ownerPin, '4821'); assert.equal(d.doctors[0].rate, 40);
    assert.ok(d.patients.some((p) => p.id === 'p2')); const p3 = d.patients.find((p) => p.id === 'p3'); assert.ok(p3 && !('anamnez' in p3) && !('meds' in p3)); assert.deepEqual(d._log.map((x) => x.id), ['ln', 'l1']); ok('sekreter PUT: tanıyı silemez/değiştiremez, telefon yazılır, silinen hasta geri gelir, yeni kayıtta gizli alan boş');

    // Hekim değişikliği sonrası sekreterin kaydı hekimin tanısını silmez
    d.visits.push({ id: 'v2', patient: 'p1', icd: 'K02.1', text: 'Yeni tanı' }); d.patients.find((p) => p.id === 'p1').anamnez.push('Astım'); r = await O('PUT', '/api/data/klinik', { data: d, base: r.j.version }); const v4 = r.j.version;
    r = await S('GET', '/api/data/klinik'); assert.equal(r.j.version, v4); const s2 = r.j.data; s2.appts[0].status = 'geldi'; r = await S('PUT', '/api/data/klinik', { data: s2, base: v4, rol: 'sekreter' }); assert.equal(r.status, 200);
    r = await O('GET', '/api/data/klinik'); d = r.j.data; assert.equal(d.visits.length, 2); assert.deepEqual(d.patients.find((p) => p.id === 'p1').anamnez, ['Diyabet', 'Astım']); assert.equal(d.appts[0].status, 'geldi'); ok('hekimin yeni tanısı sekreterin sonraki kaydıyla silinmez');

    // Geçmiş ve yedek
    for (const u of ['/api/data/klinik/gecmis', '/api/data/klinik/history', '/api/data/klinik/yedek', '/api/yedek/klinik', '/api/backup/klinik']) { r = await S('GET', u); assert.ok([401, 404, 405].includes(r.status) || !r.j || r.j.ok !== true, u + ' ' + r.status); }
    r = await S('GET', '/api/data/klinik/v'); assert.deepEqual(Object.keys(r.j).sort(), ['ok', 'version']);
    const [[h]] = await root.query(`SELECT data FROM ${DBN}.app_data_history WHERE app='klinik' ORDER BY id DESC LIMIT 1`).catch(() => [[null]]); if (h) assert.ok(/K04\.4/.test(h.data)); ok('geçmiş ve yedek için kullanıcıya açık uç yok; sürüm ucu yalnızca numara döner');

    // Rol anında geçerli, eski sekme tam yetkiyle yazamaz
    const list = (await O('GET', '/api/team')).j; const uE = list.users.find((u) => u.email === 'eski@klinik.test'), uS = list.users.find((u) => u.email === 'ece@klinik.test'), uO = list.users.find((u) => u.email === 'sahip@klinik.test');
    assert.deepEqual(uS.roller, { klinik: 'sekreter' }); assert.equal(uE.roller, null); assert.equal(uO.sahip, true); assert.ok(list.programlar.some((p) => p.app === 'klinik' && p.roller[0].id === 'sekreter')); ok('GET /api/team rolleri ve programları döner');
    r = await E('GET', '/api/team'); assert.equal(r.j.users[0].roller, undefined); assert.equal(r.j.programlar, undefined); assert.equal(JSON.stringify(r.j).includes('team_roles'), false); ok('ekip üyesi rol bilgisini görmez');
    r = await E('PUT', `/api/team/${uS.id}/rol`, { app: 'klinik', rol: '' }); assert.equal(r.status, 403); ok('rol değişikliği yalnızca hesap sahibinde');
    r = await S('PUT', `/api/team/${uS.id}/rol`, { app: 'klinik', rol: '' }); assert.equal(r.status, 403); ok('kısıtlı hesap kendi rolünü kaldıramaz');
    r = await O('PUT', `/api/team/${uO.id}/rol`, { app: 'klinik', rol: 'sekreter' }); assert.equal(r.status, 400); ok('hesap sahibi kısıtlanamaz');
    r = await O('PUT', `/api/team/${uE.id}/rol`, { app: 'klinik', rol: 'hekim' }); assert.equal(r.status, 400); r = await O('PUT', `/api/team/${uE.id}/rol`, { app: 'pos', rol: 'kasiyer' }); assert.equal(r.status, 400); ok('kuralda olmayan rol ve program reddedildi');
    const uB = (await O2('GET', '/api/team')).j.users[0]; r = await O('PUT', `/api/team/${uB.id}/rol`, { app: 'klinik', rol: 'sekreter' }); assert.equal(r.status, 404); ok('başka işletmenin hesabına rol verilemez');
    const eskiGor = (await E('GET', '/api/data/klinik')).j;
    r = await O('PUT', `/api/team/${uE.id}/rol`, { app: 'klinik', rol: 'sekreter' }); assert.equal(r.j.ok, true);
    r = await E('GET', '/api/data/klinik'); assert.equal(r.j.rol, 'sekreter'); assert.deepEqual(r.j.data.visits, []); ok('rol oturum kapanmadan sonraki istekte geçerli');
    r = await E('PUT', '/api/data/klinik', { data: eskiGor.data, base: eskiGor.version }); assert.equal(r.status, 409); assert.equal(r.j.code, 'rol'); assert.ok(!/K04\.4/.test(JSON.stringify(r.j))); ok('eski sekme yeni rolle yazamaz, yenilemeye yönlendirilir');
    r = await O('PUT', `/api/team/${uE.id}/rol`, { app: 'klinik', rol: '' }); assert.equal(r.j.ok, true); const roleSon = (await root.query(`SELECT team_roles FROM ${DBN}.users WHERE id=?`, [uE.id]))[0][0]; assert.equal(roleSon.team_roles, null);
    r = await E('PUT', '/api/data/klinik', { data: { patients: [] }, base: eskiGor.version, rol: 'sekreter' }); assert.equal(r.status, 409); assert.equal(r.j.code, 'rol'); ok('rolü kaldırılan hesabın süzülmüş sekmesi tam yetkiyle yazıp veriyi silemez');
    const [[den]] = await root.query(`SELECT COUNT(*) AS n FROM ${DBN}.audit WHERE action='Ekip rolü değişti'`); assert.ok(den.n >= 2); ok('rol değişikliği denetim kaydına yazıldı');

    // PIN
    r = await S('POST', '/api/data/klinik/pin', { pin: '0000', roles: ['admin'] }); assert.equal(r.status, 403); assert.ok(!r.j.user);
    r = await S('POST', '/api/data/klinik/pin', { pin: '4821', roles: ['admin'] }); assert.equal(r.status, 200); assert.deepEqual(r.j.user, { id: 'u1', name: 'Dt. Aylin', role: 'admin' }); ok('yetkili PIN sunucuda doğrulanır, PIN dönmez');
    r = await S('POST', '/api/data/klinik/pin', { pin: '7733', roles: ['admin'] }); assert.equal(r.status, 403); r = await S('POST', '/api/data/klinik/pin', { pin: '7733', roles: ['hekim'] }); assert.equal(r.status, 200); assert.equal(r.j.user.role, 'hekim'); ok('PIN yalnızca istenen roller için geçerli');
    r = await S('POST', '/api/data/klinik/pin', { roles: ['admin'] }); assert.equal(r.status, 403); ok('boş PIN reddedildi');
    for (let i = 0; i < 4; i++) r = await S('POST', '/api/data/klinik/pin', { pin: '1' + i + '11', roles: ['admin'] }); assert.equal(r.status, 403);
    r = await S('POST', '/api/data/klinik/pin', { pin: '4821', roles: ['admin'] }); assert.equal(r.status, 429); ok('5 hatadan sonra doğru PIN de kilitli');
    const [den2] = await root.query(`SELECT action, detail FROM ${DBN}.audit WHERE action LIKE 'Yetkili PIN%'`); assert.ok(den2.some((x) => x.action === 'Yetkili PIN hatalı' && /kilitlendi/.test(x.detail))); assert.ok(!den2.some((x) => /0000|4821|7733|1011/.test(x.detail))); ok('PIN denemesi denetim kaydında, PIN yazılmadı');

    // İşletmeler karışmaz
    r = await O2('GET', '/api/data/klinik'); assert.equal(r.j.data.patients[0].name, 'Başka Hasta'); assert.ok(!/Ayşe|K04/.test(JSON.stringify(r.j.data))); r = await S('GET', '/api/data/klinik'); assert.ok(!/Başka Hasta/.test(JSON.stringify(r.j.data))); ok('iki işletme karışmaz');

    // Bozuk rol kaydı ve sahip
    await root.query(`UPDATE ${DBN}.users SET team_roles='bozuk' WHERE id=?`, [uS.id]); r = await S('GET', '/api/data/klinik'); assert.equal(r.status, 403); await root.query(`UPDATE ${DBN}.users SET team_roles=? WHERE id=?`, ['{"klinik":"sekreter"}', uS.id]); ok('bozuk rol kaydı tam yetki sayılmaz');
    await root.query(`UPDATE ${DBN}.users SET team_roles=? WHERE id=?`, ['{"klinik":"sekreter"}', uO.id]); r = await O('GET', '/api/data/klinik'); assert.equal(r.j.rol, undefined); assert.equal(r.j.data.visits.length, 2); await root.query(`UPDATE ${DBN}.users SET team_roles=NULL WHERE id=?`, [uO.id]); ok('veritabanında rol yazılsa bile hesap sahibi kısıtlanmaz');

    // Eczane: ilk belgeyi rolü olan hesap oluşturamaz; kalfanın satışı deftere geçer
    await O('POST', '/api/trial', { product: 'eczane' }); r = await O('PUT', `/api/team/${uS.id}/rol`, { app: 'eczane', rol: 'kalfa' }); assert.equal(r.j.ok, true);
    r = await S('GET', '/api/data/eczane'); assert.equal(r.j.data, null); assert.equal(r.j.rol, 'kalfa');
    r = await S('PUT', '/api/data/eczane', { data: { users: [{ id: 'x', role: 'admin', pin: '1' }] }, base: 0, rol: 'kalfa' }); assert.equal(r.status, 403); ok('rolü olan hesap programın ilk belgesini oluşturamaz');
    r = await O('PUT', '/api/data/eczane', { data: { users: [{ id: 'u1', role: 'admin', pin: '2468', name: 'Ecz.' }], sales: [{ id: 's1', no: 'S1' }], ctrl: [{ id: 'c1', saleNo: 'S1', patient: 'h1', rxNo: 'R1' }], claims: [{ id: 'k1', amount: 500 }], patients: [{ id: 'h1', name: 'Hasta', allergy: 'Penisilin' }], _meta: {}, _settings: {} }, base: 0 }); assert.equal(r.j.version, 1);
    r = await S('GET', '/api/data/eczane'); assert.deepEqual(r.j.data.ctrl, []); assert.deepEqual(r.j.data.claims, []); assert.equal(r.j.data.patients[0].allergy, 'Penisilin'); const ec = r.j.data; ec.sales[0].canceled = { at: 'x' }; ec.sales.push({ id: 's2', no: 'S2' }); ec.ctrl = [{ id: 'c2', saleNo: 'S2', patient: 'h1', rxNo: 'R2' }]; ec.patients = [];
    r = await S('PUT', '/api/data/eczane', { data: ec, base: 1, rol: 'kalfa' }); assert.equal(r.status, 200, JSON.stringify(r.j)); r = await O('GET', '/api/data/eczane'); assert.deepEqual(r.j.data.ctrl.map((c) => [c.id, !!c.canceled]), [['c1', true], ['c2', false]]); assert.equal(r.j.data.claims.length, 1); assert.equal(r.j.data.patients.length, 1); ok('eczane kalfa uçtan uca: defter okunmaz, satış ve iade deftere işlenir, hasta silinmez');

    // İK şef
    await O('POST', '/api/trial', { product: 'ik' }); r = await O('PUT', '/api/data/ik', { data: ikDoc(), base: 0 }); assert.equal(r.j.version, 1);
    r = await O('GET', '/api/team'); assert.deepEqual(r.j.programlar.find((p) => p.app === 'ik').departmanlar.sort(), ['Satış', 'Üretim'].sort()); r = await O('PUT', `/api/team/${uS.id}/rol`, { app: 'ik', rol: 'sef', dept: 'Üretim' }); assert.equal(r.j.ok, true);
    r = await S('GET', '/api/data/ik'); assert.equal(r.j.rol, 'sef'); assert.equal(r.j.rolDept, 'Üretim'); assert.ok(!/42000|90000|Satışçı|22222222220|TR99/.test(JSON.stringify(r.j.data))); const ik = r.j.data; ik.ts['e1|2026-10-05'] = { s: 'C', ot: 1 }; r = await S('PUT', '/api/data/ik', { data: ik, base: 1, rol: 'sef' }); assert.equal(r.status, 200, JSON.stringify(r.j));
    r = await O('GET', '/api/data/ik'); assert.equal(r.j.data.employees[0].salary, 42000); assert.equal(r.j.data.employees.length, 2); assert.equal(r.j.data.ts['e2|2026-10-01'].s, 'R'); assert.equal(r.j.data.ts['e1|2026-10-05'].ot, 1); assert.equal(r.j.data.advances.length, 1); ok('ik şef uçtan uca: maaş ve diğer departman korunur, puantaj yazılır');

    // Ortak entegrasyon belgesi
    r = await O('PUT', '/api/data/entegrasyon', { data: { cfg: { sms: { enabled: true, apiKey: 'gercekanahtar1' } }, log: [{ id: 'a1', text: '{"icd":"K04.4"}' }] }, base: 0 }); assert.equal(r.j.version, 1);
    r = await S('GET', '/api/data/entegrasyon'); assert.equal(r.j.rol, undefined); assert.deepEqual(r.j.data.log, []); assert.ok(!/gercekanahtar1|K04/.test(JSON.stringify(r.j.data))); const en = r.j.data; en.cfg.sms.enabled = false; en.log = [{ id: 'a2', text: 'SMS' }];
    r = await S('PUT', '/api/data/entegrasyon', { data: en, base: 1 }); assert.equal(r.status, 200, JSON.stringify(r.j)); r = await O('GET', '/api/data/entegrasyon'); assert.equal(r.j.data.cfg.sms.enabled, true); assert.deepEqual(r.j.data.log.map((x) => x.id), ['a2', 'a1']);
    const [[ham]] = await root.query(`SELECT data FROM ${DBN}.app_data WHERE app='entegrasyon'`); assert.ok(/enc:v1:/.test(ham.data) && !/gercekanahtar1/.test(ham.data)); ok('entegrasyon günlüğü kısıtlı hesaba gitmez, ayar değişmez, şifreli değer korunur');
    assert.ok(!/4821|7733|Sifre1234|Metformin|K04\.4/.test(log)); ok('sunucu çıktısında PIN, parola ve sağlık verisi yok');
  } finally { srv.kill(); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS 'ns_rol'@'127.0.0.1'; DROP USER IF EXISTS 'ns_rol'@'localhost';`).catch(() => {}); await root.end(); }
}

(async () => {
  saf();
  try { await uctanUca(); } finally { fs.rmSync(DATA, { recursive: true, force: true }); }
  console.log(`\nrol-kural: ${passed} kontrol geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
