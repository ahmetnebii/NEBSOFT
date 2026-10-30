// Güvenlik üçüncü tur: iki adımlı giriş (RFC 6238), CSP, bilet koltuk kilidi. Saf işlevler + gerçek MariaDB ve yerel sahte SMTP ile uçtan uca.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/guvenlik-ucuncu.test.js
// Kendi geçici veri klasörünü ve "ns_ucuncu_test" veritabanını kullanır, sonunda siler.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const net = require('net');
const { spawn, spawnSync } = require('child_process');
const mysql = require('mysql2/promise');
process.env.NEBSOFT_SECRET = 'test-secret-ucuncu'; delete process.env.NEBSOFT_SECRET_ESKI;
const T = require('../cloud/totp'); const cfg = require('../cloud/config'); const K = require('../cloud/public-rules').bilet;

const ROOT = path.join(__dirname, '..', '..');
const PORT = Number(process.env.TEST_PORT || 5199) + 5, SMTP = PORT + 1, DBN = 'ns_ucuncu_test', DBK = 'ns_ucuncu';
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsucuncu-')); const B = `http://127.0.0.1:${PORT}`;
let n = 0; const ok = (m) => { n++; console.log('  ✓ ' + m); };
let ipNo = 0; // hız sınırı IP başına: her istek ayrı adresten gelir, test sınıra değil kurala takılır
const client = () => { let ck = ''; return async (m, p, body) => { const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', Origin: B, Cookie: ck, 'X-Forwarded-For': `10.9.${(++ipNo >> 8) & 255}.${ipNo & 255}` }, body: body === undefined ? undefined : JSON.stringify(body) }); const sc = r.headers.get('set-cookie'); if (sc) ck = sc.split(';')[0]; let j = null; try { j = await r.json(); } catch (e) { /* html */ } return { status: r.status, j, h: r.headers }; }; };

function saf() {
  console.log('Saf işlevler');
  const rfc = Buffer.from('12345678901234567890');
  // RFC 4226 Ek D ve RFC 6238 Ek B (SHA1, 8 hane)
  ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'].forEach((k, i) => assert.strictEqual(T.hotp(rfc, i), k));
  for (const [t, k] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']]) assert.strictEqual(T.hotp(rfc, Math.floor(t / 30), 8), k);
  ok('RFC 4226 ve RFC 6238 test vektörleri');
  assert.strictEqual(T.b32yaz(Buffer.from('foobar')), 'MZXW6YTBOI'); assert.strictEqual(T.b32oku('mzxw 6ytb oi').toString(), 'foobar'); assert.throws(() => T.b32oku('!')); ok('base32 (RFC 4648)');
  const ms = 1800000000000; const a = T.adimNo(ms); const kod = (d) => T.hotp(rfc, a + d);
  assert.strictEqual(T.eslesen(rfc, kod(0), 0, ms), a); assert.strictEqual(T.eslesen(rfc, kod(-1), 0, ms), a - 1); assert.strictEqual(T.eslesen(rfc, kod(1), 0, ms), a + 1); assert.strictEqual(T.eslesen(rfc, kod(2), 0, ms), null); assert.strictEqual(T.eslesen(rfc, kod(-2), 0, ms), null); ok('zaman penceresi ±1, dışı reddedilir');
  assert.strictEqual(T.eslesen(rfc, kod(0), a, ms), null); assert.strictEqual(T.eslesen(rfc, kod(-1), a, ms), null); assert.strictEqual(T.eslesen(rfc, kod(1), a, ms), a + 1); ok('kullanılan adım ve öncesi tekrar geçmez');
  const m = T.muhurle('u1', 'MZXW6YTBOI'); assert.ok(!m.includes('MZXW6YTBOI')); assert.strictEqual(T.muhurAc('u1', m).toString(), 'foobar'); assert.strictEqual(T.muhurAc('u2', m), null); ok('anahtar şifreli, başka kullanıcının satırında açılmıyor');
  const eski = process.env.NEBSOFT_SECRET; process.env.NEBSOFT_SECRET = 'yeni'; assert.strictEqual(T.muhurAc('u1', m), null); process.env.NEBSOFT_SECRET_ESKI = eski; assert.strictEqual(T.muhurAc('u1', m).toString(), 'foobar'); process.env.NEBSOFT_SECRET = eski; delete process.env.NEBSOFT_SECRET_ESKI; ok('anahtar değişiminde NEBSOFT_SECRET_ESKI ile okunuyor');
  const kk = T.kodUret(); assert.strictEqual(new Set(kk).size, 8); assert.ok(kk.every((x) => /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/.test(x))); ok('8 benzersiz kurtarma kodu');
  const o = T.otpauth('a+b@c.test', 'ABC'); assert.ok(o.startsWith('otpauth://totp/NEBSOFT:a%2Bb%40c.test?secret=ABC&issuer=NEBSOFT')); ok('otpauth metni kodlanmış');

  // CSP
  const sec = require('../cloud/security'); const seo = require('../cloud/seo'); const h = {}; sec.headers({ headers: {}, socket: {} }, { setHeader: (k, v) => { h[k] = v; } }); const csp = h['Content-Security-Policy'];
  const dir = (s, ad) => (s.split('; ').find((x) => x.startsWith(ad + ' ')) || '');
  assert.strictEqual(dir(csp, 'connect-src'), "connect-src 'self' https://api.emailjs.com"); assert.strictEqual(dir(seo.SITE_CSP, 'connect-src'), "connect-src 'self'");
  for (const p of [csp, seo.SITE_CSP]) for (const [ad, v] of [['base-uri', "'self'"], ['form-action', "'self'"], ['object-src', "'none'"], ['frame-ancestors', "'self'"]]) assert.strictEqual(dir(p, ad), `${ad} ${v}`);
  ok('connect-src daraltıldı; base-uri, form-action, object-src, frame-ancestors iki ilkede de var');
  // Tarayıcının dışarıya doğrudan bağlandığı yer yalnızca EmailJS kalmalı: yeni doğrudan çağrı eklenirse connect-src engeller, burada yakalanır
  const tara = (d, out = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'vendor') tara(p, out); } else if (/\.(js|html)$/.test(f) && !/\.test\.js$/.test(f)) out.push(p); } return out; };
  const bulgu = []; for (const k of ['core', 'apps', 'market', 'admin']) for (const f of tara(path.join(ROOT, k))) { const s = fs.readFileSync(f, 'utf8'); for (const r of [/\bfetch\(\s*['"`]https?:/g, /new\s+(WebSocket|EventSource)\s*\(/g, /sendBeacon\(\s*['"`]https?:/g]) if (r.test(s)) bulgu.push(path.relative(ROOT, f)); }
  assert.deepStrictEqual(bulgu, []); assert.ok(/c\.mode === 'emailjs' \? await fetch\(req\.url/.test(fs.readFileSync(path.join(ROOT, 'core/integrations.js'), 'utf8'))); ok('kodda doğrudan dış bağlantı yok, tek istisna EmailJS');

  // Bilet: kilit sahibi
  const col = (doc) => (k) => (doc[k] = doc[k] || []);
  const x = (doc, q) => ({ doc, q, col: col(doc), get: (k, id) => col(doc)(k).find((r) => r.id === id), pick: (o, f) => Object.fromEntries(f.filter((a) => a in o).map((a) => [a, o[a]])) });
  const h1 = { id: 'h1', event: 'e', seat: 'A1', owner: 'sahipkimligi1', until: Date.now() + 6e4 }; const biten = { ...h1, id: 'h2', until: Date.now() - 1 }; const D = { holds: [h1, biten] };
  assert.strictEqual(K.write.holds.del(h1, x(D, { sahip: 'sahipkimligi1' })), true); assert.strictEqual(K.write.holds.del(h1, x(D, { sahip: 'baskasininkimligi' })), false); assert.strictEqual(K.write.holds.del(h1, x(D, {})), false); assert.strictEqual(K.write.holds.del(h1, x(D, null)), false); assert.strictEqual(K.write.holds.del(h1, x(D, { sahip: 'kisa' })), false); assert.strictEqual(K.write.holds.del(biten, x(D, {})), true); ok('süren kilidi yalnızca sahibi kaldırır, süresi dolan temizlenir');
  assert.deepStrictEqual(K.pub.holds.fields, ['id', 'event', 'seat', 'until']); const v = K.query(x(D, {}), { sahip: 'sahipkimligi1' }).holds; assert.strictEqual(v[0].owner, 'sahipkimligi1'); assert.ok(!K.query(x(D, {}), { sahip: 'baskasininkimligi' }).holds[0].owner); ok('sahip kimliği herkese açık değil, ziyaretçi yalnızca kendi kilidini tanır');
}

// Yerel sahte SMTP: gelen postaları saklar, 6 haneli kodu okur
function smtp() {
  const kutu = []; const srv = net.createServer((s) => {
    let buf = ''; let veri = false; s.write('220 test\r\n');
    s.on('error', () => {}); s.on('data', (d) => {
      buf += d.toString('utf8');
      if (veri) { if (buf.includes('\r\n.\r\n')) { kutu.push(buf); buf = ''; veri = false; s.write('250 ok\r\n'); } return; }
      let i; while ((i = buf.indexOf('\r\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); if (/^EHLO/.test(l)) s.write('250 ok\r\n'); else if (l === 'AUTH LOGIN') s.write('334 x\r\n'); else if (/^MAIL|^RCPT/.test(l)) s.write('250 ok\r\n'); else if (l === 'DATA') { veri = true; s.write('354 go\r\n'); } else if (l === 'QUIT') { s.write('221 bye\r\n'); s.end(); } else if (/^[A-Za-z0-9+/=]+$/.test(l)) s.write(s.gecti ? '235 ok\r\n' : (s.gecti = true, '334 x\r\n')); }
    });
  });
  const kod = () => { const m = kutu[kutu.length - 1]; const metin = Buffer.from(m.split('Content-Transfer-Encoding: base64\r\n\r\n')[1].split('\r\n--')[0].replace(/\s/g, ''), 'base64').toString('utf8'); return /\b(\d{6})\b/.exec(metin)[1]; };
  return { kutu, kod, ac: () => new Promise((r) => srv.listen(SMTP, '127.0.0.1', r)), kapat: () => new Promise((r) => { srv.close(r); }) };
}

async function uctanUca() {
  console.log('Uçtan uca (MariaDB + yerel SMTP)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS '${DBK}'@'127.0.0.1'; CREATE USER '${DBK}'@'127.0.0.1' IDENTIFIED BY 'UcuncuTest123'; GRANT ALL ON ${DBN}.* TO '${DBK}'@'127.0.0.1'; FLUSH PRIVILEGES; USE ${DBN}`);
  const ortam = { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, HOST: '127.0.0.1', TRUST_PROXY: '1' };
  const srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: ortam, stdio: ['ignore', 'pipe', 'pipe'] }); let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  const mb = smtp(); await mb.ac();
  const EPOSTA = 'admin@ucuncu.test', SIFRE = 'GucluSifre2026!';
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const Y = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: DBK, password: 'UcuncuTest123', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: EPOSTA, name: 'Yönetici', pass: SIFRE, token }); assert.equal(r.j.ok, true);
    r = await Y('PUT', '/api/admin/mail', { provider: 'custom', host: '127.0.0.1', port: SMTP, user: 'posta@ucuncu.test', pass: 'x', enabled: true }); assert.equal(r.status, 200, JSON.stringify(r.j));
    const [[ms]] = await root.query("SELECT v FROM settings WHERE k='mail'"); await root.query("UPDATE settings SET v=? WHERE k='mail'", [JSON.stringify({ ...JSON.parse(ms.v), tls: false })]);

    // Etkin değilken e-posta kodu sürer
    const girisKod = async (C) => { let x = await C('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE }); assert.equal(x.j.needCode, true, JSON.stringify(x.j)); x = await C('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE, ticket: x.j.ticket, code: mb.kod() }); assert.equal(x.j.ok, true, JSON.stringify(x.j)); return x; };
    const E = client(); const D2 = client(); await girisKod(E); await girisKod(D2); ok('TOTP kapalıyken e-posta kodu davranışı sürüyor');

    // Müşteri kurulum uçlarına giremez
    const M = client(); r = await M('POST', '/api/auth/register', { email: 'sahip@ucuncu.test', pass: 'Sifre1234', name: 'Aylin', phone: '05321112233', company: 'Sahne', kvkk: true, product: 'bilet' }); if (r.j.needCode) r = await M('POST', '/api/auth/register', { email: 'sahip@ucuncu.test', pass: 'Sifre1234', name: 'Aylin', phone: '05321112233', company: 'Sahne', kvkk: true, product: 'bilet', ticket: r.j.ticket, code: mb.kod() }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await M('POST', '/api/auth/totp/kur', { pass: 'Sifre1234' }); assert.equal(r.status, 403); ok('müşteri hesabı iki adımlı kurulumuna giremez');

    // Kurulum: şifre, kod, kurtarma
    r = await E('POST', '/api/auth/totp/kur', { pass: 'yanlis' }); assert.equal(r.status, 403);
    const Bekleyen = client(); let bekleyen = await Bekleyen('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE }); assert.equal(bekleyen.j.needCode, true);
    r = await E('POST', '/api/auth/totp/kur', { pass: SIFRE }); assert.equal(r.status, 200, JSON.stringify(r.j)); const gizli = r.j.gizli; assert.ok(/^[A-Z2-7]{32}$/.test(gizli)); assert.ok(r.j.otpauth.includes(`secret=${gizli}`));
    const anahtar = T.b32oku(gizli); const kod = (d = 0) => T.hotp(anahtar, T.adimNo() + d);
    let [[sat]] = await root.query('SELECT * FROM user_totp'); assert.ok(!sat.secret.includes(gizli)); assert.equal(sat.enabled, 0); ok('anahtar veritabanında şifreli');
    r = await Y('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE }); assert.equal(r.j.needCode, true); ok('kod doğrulanmadan etkinleşmiyor, giriş eskisi gibi');
    r = await E('POST', '/api/auth/totp/etkinlestir', { code: '000000' === kod() ? '111111' : '000000' }); assert.equal(r.status, 400); assert.equal((await E('GET', '/api/auth/totp')).j.etkin, false);
    r = await E('POST', '/api/auth/totp/etkinlestir', { code: kod() }); assert.equal(r.status, 200, JSON.stringify(r.j)); let kodlar = r.j.kodlar; assert.equal(kodlar.length, 8);
    [[sat]] = await root.query('SELECT * FROM user_totp'); assert.equal(sat.enabled, 1); assert.ok(kodlar.every((x) => !sat.recovery.includes(x) && !sat.recovery.includes(x.replace('-', '')))); assert.equal(JSON.parse(sat.recovery).length, 8); ok('etkinleşti, 8 kurtarma kodu yalnızca özet olarak saklanıyor');
    r = await E('POST', '/api/auth/totp/etkinlestir', { code: kod() }); assert.equal(r.status, 400); r = await E('POST', '/api/auth/totp/kur', { pass: SIFRE }); assert.equal(r.status, 400); ok('etkin anahtar yeniden kurulumla değiştirilemez');
    assert.equal((await D2('GET', '/api/admin/users')).status, 401); assert.equal((await E('GET', '/api/admin/users')).j.users[0].totp, 1); ok('etkinleşince diğer oturumlar kapanıyor, bu oturum sürüyor');
    r = await Bekleyen('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE, ticket: bekleyen.j.ticket, code: mb.kod() }); assert.equal(r.status, 400); assert.equal((await Bekleyen('GET', '/api/admin/users')).status, 401); ok('koruma açılmadan alınan e-posta kodu oturum açmıyor');

    // Giriş
    const adim = async (C) => { const x = await C('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE }); assert.equal(x.j.needTotp, true, JSON.stringify(x.j)); return x.j.totpTicket; };
    const mail0 = mb.kutu.length; const G = client(); let tk = await adim(G); assert.equal(mb.kutu.length, mail0); assert.equal((await G('GET', '/api/admin/users')).status, 401); ok('TOTP etkinse e-posta gönderilmiyor, şifre tek başına oturum açmıyor');
    r = await Y('POST', '/api/auth/login', { email: EPOSTA, pass: 'yanlis-sifre' }); assert.equal(r.status, 401); assert.ok(!r.j.needTotp && !r.j.totpTicket); ok('yanlış şifreye iki adım bileti verilmiyor');
    r = await G('POST', '/api/auth/login', { totpTicket: tk.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), code: kod() }); assert.equal(r.status, 400); ok('bileti değiştirilen istek reddediliyor');
    await root.query('UPDATE user_totp SET last_step=0');
    const ayni = kod(); r = await G('POST', '/api/auth/login', { totpTicket: tk, code: ayni }); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(r.j.role, 'superadmin'); assert.equal((await G('GET', '/api/admin/users')).status, 200); ok('doğru kodla oturum açılıyor');
    const G2 = client(); tk = await adim(G2); r = await G2('POST', '/api/auth/login', { totpTicket: tk, code: ayni }); assert.equal(r.status, 401); ok('aynı kod ikinci kez kabul edilmiyor');
    await root.query('UPDATE user_totp SET last_step=0, failed=0, locked_until=NULL');
    const P1 = client(), P2 = client(); const t1 = await adim(P1), t2 = await adim(P2); const es = await Promise.all([P1('POST', '/api/auth/login', { totpTicket: t1, code: kod() }), P2('POST', '/api/auth/login', { totpTicket: t2, code: kod() })]); assert.deepEqual(es.map((x) => x.status).sort(), [200, 401]); ok('aynı anda gelen aynı kodla tek oturum açılıyor');

    // Kilit
    await root.query('UPDATE user_totp SET last_step=0, failed=0, locked_until=NULL');
    const K1 = client(); tk = await adim(K1); const yanlis = kod() === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) { r = await K1('POST', '/api/auth/login', { totpTicket: tk, code: yanlis }); assert.equal(r.status, 401); }
    r = await K1('POST', '/api/auth/login', { totpTicket: tk, code: yanlis }); assert.equal(r.status, 429); r = await K1('POST', '/api/auth/login', { totpTicket: tk, code: kod() }); assert.equal(r.status, 429); r = await K1('POST', '/api/auth/login', { totpTicket: tk, code: kodlar[0] }); assert.equal(r.status, 429); r = await K1('POST', '/api/auth/login', { email: EPOSTA, pass: SIFRE }); assert.equal(r.status, 429); assert.ok(!r.j.totpTicket); ok('5 hatada kilit: doğru kod ve kurtarma kodu da reddediliyor');
    await root.query('UPDATE user_totp SET failed=0, locked_until=NULL');

    // Kurtarma kodu
    const R1 = client(); tk = await adim(R1); r = await R1('POST', '/api/auth/login', { totpTicket: tk, code: kodlar[0].toLowerCase() }); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(r.j.kurtarmaKalan, 7); assert.equal((await R1('GET', '/api/auth/totp')).j.kalan, 7);
    const R2 = client(); tk = await adim(R2); r = await R2('POST', '/api/auth/login', { totpTicket: tk, code: kodlar[0] }); assert.equal(r.status, 401); ok('kurtarma kodu tek kullanımlık');

    // Şifre sıfırlama ikinci adımı atlatamıyor
    const S1 = client(); const eskiBilet = await adim(S1);
    r = await S1('POST', '/api/auth/forgot', { email: EPOSTA }); r = await S1('POST', '/api/auth/reset', { ticket: r.j.ticket, code: mb.kod(), pass: 'YeniSifre2027!' }); assert.equal(r.j.girisGerekli, true, JSON.stringify(r.j)); assert.equal((await S1('GET', '/api/admin/users')).status, 401);
    await root.query('UPDATE user_totp SET last_step=0'); r = await S1('POST', '/api/auth/login', { totpTicket: eskiBilet, code: kod() }); assert.equal(r.status, 400); ok('e-postayla şifre sıfırlama oturum açmıyor, eski bilet geçersiz');
    const S2 = client(); r = await S2('POST', '/api/auth/login', { email: EPOSTA, pass: 'YeniSifre2027!' }); assert.equal(r.j.needTotp, true); r = await S2('POST', '/api/auth/login', { totpTicket: r.j.totpTicket, code: kod() }); assert.equal(r.status, 200);

    // Yönetim: yenileme ve kapatma şifre + kod ister
    await root.query('UPDATE user_totp SET last_step=0');
    r = await S2('POST', '/api/auth/totp/kodlar', { pass: 'yanlis', code: kod() }); assert.equal(r.status, 403); r = await S2('POST', '/api/auth/totp/kodlar', { pass: 'YeniSifre2027!', code: yanlis }); assert.equal(r.status, 400);
    r = await S2('POST', '/api/auth/totp/kodlar', { pass: 'YeniSifre2027!', code: kod() }); assert.equal(r.status, 200, JSON.stringify(r.j)); const eskiKod = kodlar[1]; kodlar = r.j.kodlar; assert.equal(kodlar.length, 8);
    r = await S2('POST', '/api/auth/totp/kapat', { pass: 'YeniSifre2027!', code: eskiKod }); assert.equal(r.status, 400); ok('kod yenileme şifre ve kod istiyor, eski kurtarma kodları geçersiz');
    r = await S2('POST', '/api/auth/totp/kapat', { code: kodlar[0] }); assert.equal(r.status, 403); assert.equal((await S2('GET', '/api/auth/totp')).j.etkin, true); ok('oturum tek başına korumayı kapatamıyor');

    // Sıfırlama betiği
    const betik = (...a) => spawnSync(process.execPath, ['scripts/totp-sifirla.js', ...a], { cwd: ROOT, env: ortam, encoding: 'utf8' });
    let b = betik(); assert.equal(b.status, 0, b.stderr); assert.ok(/açık\s+superadmin\s+admin@ucuncu\.test/.test(b.stdout)); assert.ok(!b.stdout.includes(gizli));
    b = betik('--eposta', EPOSTA); assert.equal(b.status, 1); assert.equal((await root.query('SELECT COUNT(*) AS n FROM user_totp'))[0][0].n, 1);
    b = betik('--eposta', 'sahip@ucuncu.test', '--evet'); assert.equal(b.status, 1);
    b = betik('--eposta', EPOSTA, '--evet'); assert.equal(b.status, 0, b.stderr); assert.equal((await root.query('SELECT COUNT(*) AS n FROM user_totp'))[0][0].n, 0); assert.equal((await S2('GET', '/api/admin/users')).status, 401); assert.equal((await root.query("SELECT COUNT(*) AS n FROM audit WHERE action LIKE '%sunucuda sıfırlandı%'"))[0][0].n, 1);
    r = await Y('POST', '/api/auth/login', { email: EPOSTA, pass: 'YeniSifre2027!' }); assert.equal(r.j.needCode, true, JSON.stringify(r.j)); ok('sıfırlama betiği onay istiyor, TOTP silinip e-posta koduna dönülüyor, oturumlar kapanıyor');

    // Canlı başlık
    r = await Y('GET', '/'); assert.ok(r.h.get('content-security-policy').includes("connect-src 'self' https://api.emailjs.com;")); ok('sunucu yanıtında daraltılmış connect-src');

    // Bilet koltuk kilidi gerçek uçlarla
    r = await M('PUT', '/api/data/bilet', { base: 0, data: { _meta: {}, _settings: {}, users: [], venues: [{ id: 'v1', type: 'seated', seatsPerRow: 4, rows: [{ r: 'A', cat: 'gen' }], cats: { gen: 'Genel' } }], events: [{ id: 'e1', venue: 'v1', date: '2030-01-01', time: '20:00', status: 'satista', prices: { gen: 100 } }], tickets: [], holds: [] } }); assert.equal(r.j.version, 1, JSON.stringify(r.j));
    const [[ten]] = await root.query('SELECT slug FROM tenants LIMIT 1'); const P = client(); const U = `/api/public/${ten.slug}/bilet`; const AHMET = 'ziyaretci-kimligi-1', AYSE = 'ziyaretci-kimligi-2';
    r = await P('POST', `${U}/ops`, { x: { sahip: AHMET }, ops: [{ c: 'holds', op: 'ins', rec: { id: 'hold0001', event: 'e1', seat: 'A1', owner: AHMET, until: Date.now() + 6e4 } }] }); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(r.j.data.holds[0].owner, AHMET);
    r = await P('POST', `${U}/view`, {}); assert.equal(r.j.data.holds.length, 1); assert.ok(!JSON.stringify(r.j).includes(AHMET)); r = await P('POST', `${U}/view`, { x: { sahip: AYSE } }); assert.ok(!JSON.stringify(r.j).includes(AHMET)); ok('kilit sahibi başka ziyaretçiye görünmüyor');
    r = await P('POST', `${U}/ops`, { ops: [{ c: 'holds', op: 'del', id: 'hold0001' }] }); assert.equal(r.status, 403); r = await P('POST', `${U}/ops`, { x: { sahip: AYSE }, ops: [{ c: 'holds', op: 'del', id: 'hold0001' }] }); assert.equal(r.status, 403); r = await P('POST', `${U}/ops`, { x: { sahip: AHMET }, ops: [{ c: 'holds', op: 'del', id: 'hold0001' }] }); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(r.j.data.holds.length, 0); ok('başkası kilidi kaldıramıyor, sahibi kaldırıyor');

    assert.ok(!log.includes(gizli) && !kodlar.some((x) => log.includes(x)) && !log.includes(SIFRE)); ok('sunucu çıktısında anahtar, kurtarma kodu ve şifre yok');
  } finally { srv.kill(); await mb.kapat().catch(() => {}); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS '${DBK}'@'127.0.0.1'`).catch(() => {}); await root.end(); }
}

(async () => {
  saf();
  try { await uctanUca(); } finally { fs.rmSync(DATA, { recursive: true, force: true }); }
  console.log(`\nguvenlik-ucuncu: ${n} kontrol geçti`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
