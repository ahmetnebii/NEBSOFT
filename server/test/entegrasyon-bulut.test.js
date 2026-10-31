// Entegrasyon bulut uçları uçtan uca: sahte Netgsm + MySQL. Deneme geçmeden iş akışı çalışmaz, Bağlı yalnız gerçek yanıttan yazılır, anahtar tarayıcıya gitmez.
// MySQL yoksa "ATLANDI" yazar, geçti sayılmaz. Dokümana uyumu gösterir, gerçek Netgsm hesabıyla çalıştığını kanıtlamaz.
const http = require('http'); const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawn } = require('child_process');
const PORT = Number(process.env.ENT_BULUT_PORT) || 5192; const FAKE = PORT + 1; const BASE = `http://127.0.0.1:${PORT}`;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '', DBN = process.env.ENT_TEST_DB_NAME || 'nebsoft_ent_test';
const SIFRE = 'NETGSM-GIZLI-77'; const YENI = 'NETGSM-YENI-88'; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let n = 0; const ok = (m) => { n++; console.log('  ✓', m); };
const fake = { calls: [], kapali: false };
const fsrv = http.createServer((req, res) => {
  const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => {
    const raw = Buffer.concat(ch).toString(); fake.calls.push({ url: req.url, a: req.headers.authorization, raw }); const send = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url === '/netgsm/balance') { const b = JSON.parse(raw); return send([SIFRE, YENI].includes(b.password) ? { balance: [{ amount: 5, balance_name: 'Adet SMS' }] } : { code: '30' }); }
    if (req.url.startsWith('/netgsm/sms/rest/v2/msgheader')) return send({ code: '00', msgheaders: ['BASLIK'] });
    if (req.url === '/netgsm/sms/rest/v2/send') return send({ code: '00', jobid: 'J1', description: 'queued' });
    send({ code: '70' });
  });
});
function client() { let cookie = ''; return async (m, p, body) => { const r = await fetch(BASE + p, { method: m, redirect: 'manual', headers: { 'x-ns-csrf': '1', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; '); const text = await r.text(); let j = {}; try { j = JSON.parse(text); } catch (e) { /* html */ } return { status: r.status, j, text }; }; }
(async () => {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { return console.log('Bulut uçları: ATLANDI (mysql2 yok), geçti sayılmaz'); }
  let root; try { root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true }); } catch (e) { return console.log(`Bulut uçları: ATLANDI (MySQL: ${e.code || e.message}), geçti sayılmaz`); }
  await new Promise((r) => fsrv.listen(FAKE, '127.0.0.1', r));
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4;`); const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsent-'));
  let log = ''; const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'ent-test-secret', ENTEGRASYON_API_BASE: `http://127.0.0.1:${FAKE}`, NODE_ENV: 'test' } });
  srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${BASE}/api/setup/status`)).ok) break; } catch (e) { /* açılıyor */ } await sleep(100); }
  try {
    const A = client(), C = client(), Z = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DBH, database: DBN, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, r.text);
    await A('PUT', '/api/admin/settings', { trialDays: 7, siteName: 'NEBSOFT', siteUrl: 'https://nebsoft.test' });
    r = await C('POST', '/api/auth/register', { email: 'sahip@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Giyim', kvkk: true, product: 'randevu' }); assert.equal(r.j.ok, true, r.text);
    r = await Z('POST', '/api/auth/register', { email: 'baska@firma.test', pass: 'Sifre1234', name: 'Ayşe Kaya', phone: '05321112234', company: 'Kaya Giyim', kvkk: true, product: 'randevu' }); assert.equal(r.j.ok, true, r.text);
    const yaz = async (who, cfg) => { const g = await who('GET', '/api/data/entegrasyon'); const v = g.j.version || 0; const d = g.j.data || {}; const x = await who('PUT', '/api/data/entegrasyon', { base: v, data: { ...d, cfg: { ...(d.cfg || {}), ...cfg } } }); assert.equal(x.status, 200, x.text); };
    const K = { user: '8501234567', pass: SIFRE, header: 'BASLIK' }; const DURUM = async (who) => ((await who('GET', '/api/entegrasyon/durum')).j.liste || []).find((x) => x.tur === 'sms');
    await yaz(C, { sms: { provider: 'netgsm', enabled: true, ...K } }); const gor = await C('GET', '/api/data/entegrasyon'); assert.ok(!gor.text.includes(SIFRE)); assert.match(gor.j.data.cfg.sms.pass, /^__nsg_/); ok('kayıtlı şifre tarayıcıya dönmez');
    let i = await C('POST', '/api/entegrasyon/islem', { tur: 'sms', islem: 'gonder', veri: { to: '905551112233', text: 'x' } }); assert.equal(i.j.ok, false); assert.equal(i.j.kod, 'baglanmadi'); assert.ok(!fake.calls.some((c) => c.url.includes('/send'))); ok('deneme geçmeden SMS gönderilmez');
    r = await C('POST', '/api/entegrasyon/dene', { tur: 'sms', saglayici: 'netgsm', alanlar: { ...K, pass: 'yanlis-sifre' } }); assert.equal(r.j.ok, false); assert.match(r.j.hata, /hatalı/); let d = await DURUM(C); assert.equal(d.durum, 'hata'); assert.ok(d.sonDeneme); i = await C('POST', '/api/entegrasyon/islem', { tur: 'sms', islem: 'gonder', veri: { to: '905551112233', text: 'x' } }); assert.equal(i.j.kod, 'baglanmadi'); ok('yanlış bilgi: durum hata, son deneme yazılı, iş akışı kapalı');
    r = await C('POST', '/api/entegrasyon/dene', { tur: 'sms', saglayici: 'netgsm', alanlar: { user: K.user, pass: gor.j.data.cfg.sms.pass, header: K.header } }); assert.equal(r.j.ok, true, r.text); assert.ok(!('parmak' in r.j)); assert.ok(!r.text.includes(SIFRE)); assert.equal(JSON.parse(fake.calls.filter((c) => c.url === '/netgsm/balance').at(-1).raw).password, SIFRE); d = await DURUM(C); assert.equal(d.durum, 'bagli'); ok('yer tutucuyla deneme: kayıtlı değer sunucuda çözülür, Bağlı gerçek yanıttan yazılır');
    i = await C('POST', '/api/entegrasyon/islem', { tur: 'sms', islem: 'gonder', veri: { to: '905551112233', text: 'Merhaba' } }); assert.equal(i.j.ok, true, i.text); assert.equal(i.j.sonuc.ref, 'J1'); assert.ok(!i.text.includes(SIFRE)); ok('denenen bilgiyle gönderim sağlayıcının numarasını döndürür');
    r = await Z('POST', '/api/entegrasyon/islem', { tur: 'sms', islem: 'gonder', veri: { to: '905551112233', text: 'x' } }); assert.equal(r.j.ok, false); assert.equal(await DURUM(Z), undefined); ok('başka işletme durumu görmez, gönderemez');
    const say = fake.calls.length; r = await Z('POST', '/api/entegrasyon/dene', { tur: 'sms', saglayici: 'netgsm', alanlar: { user: K.user, pass: gor.j.data.cfg.sms.pass, header: 'BASLIK' } }); assert.equal(r.j.ok, false); assert.equal(fake.calls.length, say); ok('başka işletmenin yer tutucusu çözülmez, sağlayıcıya istek gitmez');
    r = await C('POST', '/api/entegrasyon/dene', { tur: 'sms', saglayici: 'netgsm', alanlar: { user: K.user, pass: '__nsg_pazaryeri_trendyol_apiKey__', header: 'BASLIK' } }); assert.equal(JSON.parse(fake.calls.filter((c) => c.url === '/netgsm/balance').at(-1).raw).password, SIFRE); ok('yer tutucu başka grubun gizli değerini okuyamaz');
    await yaz(C, { sms: { ...(await C('GET', '/api/data/entegrasyon')).j.data.cfg.sms, pass: YENI } }); i = await C('POST', '/api/entegrasyon/islem', { tur: 'sms', islem: 'gonder', veri: { to: '905551112233', text: 'x' } }); assert.equal(i.j.kod, 'baglanmadi'); ok('şifre değişince yeniden deneme istenir');
    r = await C('POST', '/api/entegrasyon/dene', { tur: 'sms', saglayici: 'yok', alanlar: {} }); assert.equal(r.status, 404); r = await C('POST', '/api/entegrasyon/dene', { tur: '../x', saglayici: 'netgsm' }); assert.equal(r.status, 400); ok('bilinmeyen sağlayıcı reddedilir');
    r = await fetch(`${BASE}/api/entegrasyon/durum`); assert.equal(r.status, 401); ok('oturumsuz erişim yok');
    assert.ok(!log.includes(SIFRE) && !log.includes(YENI)); ok('anahtar log\'a yazılmaz');
    console.log(`\n${n} bulut testi geçti.`);
  } catch (e) { console.error('✗', e.message, '\n', log.slice(-800)); process.exitCode = 1; } finally {
    await new Promise((res) => { srv.once('exit', res); srv.kill(); }); fsrv.closeAllConnections(); fsrv.close(); await root.query(`DROP DATABASE IF EXISTS ${DBN}`); await root.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
})();
