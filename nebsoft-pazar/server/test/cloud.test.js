// Bulut API uçtan uca testi. Gerekli: erişilebilir MySQL/MariaDB ve test veritabanı yetkisi.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/cloud.test.js
// Test kendi geçici veri klasörünü ve "nebsoft_test" veritabanını kullanır (her çalıştırmada sıfırlanır).
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const mysql = require('mysql2/promise');
const assert = require('assert');

const PORT = Number(process.env.TEST_PORT) || 5097;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nstest-'));
let passed = 0; const ok = (name) => { passed++; console.log('  ✓', name); };

function client() {
  let cookie = '';
  return async (method, url, body, extra = {}) => {
    const h = { 'Content-Type': 'application/json', ...(extra.noCsrf ? {} : { 'x-ns-csrf': '1' }), ...(cookie ? { Cookie: cookie } : {}), ...(extra.headers || {}) };
    const r = await fetch(BASE + url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    let j = null; try { j = await r.json(); } catch (e) { /* html */ }
    return { status: r.status, j, headers: r.headers };
  };
}

(async () => {
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query("DROP DATABASE IF EXISTS nebsoft_test; DROP USER IF EXISTS 'ns_test'@'localhost'; DROP USER IF EXISTS 'ns_test'@'127.0.0.1';");
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'test-secret-123', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  try {
    for (let i = 0; i < 50 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const A = client(), C = client(), X = client();

    // 1) Kurulum: SQL üret → yönetici SQL'i çalıştırır → bağlantı bilgisi girilir
    let r = await A('GET', '/api/setup/status'); assert.equal(r.j.configured, false); ok('kurulum durumu: yapılandırılmamış');
    r = await A('POST', '/api/setup/sql', { database: 'nebsoft_test', user: 'ns_test', host: '127.0.0.1' }); assert.ok(r.j.sql.includes('CREATE USER')); ok('veritabanı/kullanıcı/yetki SQL’i üretildi');
    await root.query(r.j.sql.replace(/-- .*$/gm, '').replace("'127.0.0.1'", "'127.0.0.1'"));
    await root.query(`CREATE USER IF NOT EXISTS 'ns_test'@'localhost' IDENTIFIED BY '${r.j.password}'; GRANT ALL ON nebsoft_test.* TO 'ns_test'@'localhost';`);
    const pw = r.j.password;
    r = await A('POST', '/api/setup/db', { host: '127.0.0.1', database: 'nebsoft_test', user: 'ns_test', password: pw, token: 'yanlis' }); assert.equal(r.status, 403); ok('yanlış kurulum anahtarı reddedildi');
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    r = await A('POST', '/api/setup/db', { host: '127.0.0.1', database: 'nebsoft_test', user: 'ns_test', password: pw, token }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('MySQL bağlandı ve tablolar oluştu');
    assert.ok(!fs.readFileSync(path.join(DATA, 'config.enc'), 'utf8').includes(pw)); ok('bağlantı şifresi diskte şifreli');
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'kisa1', token }); assert.equal(r.status, 400); ok('zayıf yönetici şifresi reddedildi');
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('süper yönetici oluşturuldu');
    r = await X('POST', '/api/setup/admin', { email: 'x@x.test', name: 'X', pass: 'GucluSifre2026!', token }); assert.notEqual(r.status, 200); ok('ikinci kurulum engellendi');

    // 2) Güvenlik
    r = await X('POST', '/api/auth/login', { email: 'admin@nebsoft.test', pass: 'x' }, { noCsrf: true }); assert.equal(r.status, 403); ok('CSRF başlığı olmayan istek reddedildi');
    r = await X('POST', '/api/auth/login', { email: 'a@b.test', pass: 'x' }, { headers: { Origin: 'https://kotu-site.com' } }); assert.equal(r.status, 403); ok('başka kaynaktan istek reddedildi');
    r = await X('GET', '/api/admin/orders'); assert.equal(r.status, 401); ok('oturumsuz admin isteği reddedildi');
    for (const f of ['/data/config.enc', '/server/cloud/db.js', '/package.json', '/.git/config', '/node_modules/mysql2/package.json']) { const s = await fetch(BASE + f); assert.equal(s.status, 404, f); }
    ok('gizli dosya ve klasörler sunulmuyor');
    const h = await fetch(BASE + '/'); assert.ok(h.headers.get('content-security-policy') && h.headers.get('x-frame-options')); ok('güvenlik başlıkları var');

    // 3) Müşteri kaydı + 7 gün deneme
    r = await C('POST', '/api/auth/register', { email: 'musteri@firma.test', pass: 'zayif', name: 'Ali Veli', phone: '05321112233', company: 'Veli Market', kvkk: true }); assert.equal(r.status, 400); ok('zayıf müşteri şifresi reddedildi');
    r = await C('POST', '/api/auth/register', { email: 'musteri@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Market', kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('müşteri kaydı');
    r = await C('GET', '/api/auth/me'); assert.equal(r.j.user.email, 'musteri@firma.test'); const lic = r.j.licenses.find((l) => l.product === 'pos'); assert.equal(lic.status, 'deneme');
    const days = Math.round((new Date(lic.end) - Date.now()) / 864e5); assert.equal(days, 7); ok('POS için 7 günlük deneme açıldı');
    r = await C('POST', '/api/trial', { product: 'adisyon' }); assert.equal(r.j.ok, true); ok('ikinci ürün için deneme');

    // 4) Uygulama verisi: lisanslı uygulama okunur/yazılır, lisanssız reddedilir, sürüm çakışması yakalanır
    r = await C('GET', '/api/data/pos'); assert.equal(r.j.version, 0); ok('boş veri');
    r = await C('PUT', '/api/data/pos', { data: { products: [{ id: 'p1', name: 'Su' }] }, base: 0 }); assert.equal(r.j.version, 1); ok('veri kaydedildi (v1)');
    r = await C('PUT', '/api/data/pos', { data: { products: [] }, base: 0 }); assert.equal(r.status, 409); assert.equal(r.j.version, 1); ok('eski sürümle yazma çakışma döndü');
    r = await C('GET', '/api/data/otel'); assert.equal(r.status, 402); ok('lisanssız uygulama verisi engellendi');

    // 5) Sipariş: havale; fiyat sunucuda hesaplanır
    r = await C('POST', '/api/orders', { items: [{ pid: 'pos', plan: 1, period: 'aylik', qty: 1, price: 1 }], billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' } }); assert.equal(r.status, 503); ok('banka hesabı yokken sipariş engellendi');
    r = await A('POST', '/api/admin/banks', { holder: 'NEBSOFT Yazılım A.Ş.', iban: 'TR33 0006 1005 1978 6457 8413 27', bank: 'İş Bankası' }); assert.equal(r.status, 400); ok('hatalı IBAN (kontrol hanesi) reddedildi');
    r = await A('POST', '/api/admin/banks', { holder: 'NEBSOFT Yazılım A.Ş.', iban: 'TR33 0006 1005 1978 6457 8413 26', bank: 'İş Bankası' });
    assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('banka hesabı eklendi (ad soyad + IBAN)');
    r = await C('POST', '/api/orders', { items: [{ pid: 'pos', plan: 1, period: 'yillik', qty: 1, price: 1 }], billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' } });
    assert.equal(r.j.ok, true, JSON.stringify(r.j)); assert.equal(r.j.order.status, 'odeme-bekliyor'); assert.equal(r.j.order.subtotal, 6990); assert.ok(r.j.banks[0].iban); ok('sipariş "ödeme bekliyor"; fiyat sunucuda hesaplandı (istemci fiyatı yok sayıldı)');
    const oid = r.j.order.id;
    r = await C('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.status, 403); ok('müşteri kendi siparişini onaylayamaz');
    r = await A('GET', '/api/admin/orders?status=odeme-bekliyor'); assert.equal(r.j.orders.length, 1); ok('admin bekleyen havaleyi görüyor');
    r = await A('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.j.ok, true); ok('admin "ödendi" olarak onayladı');
    r = await C('GET', '/api/auth/me'); const l2 = r.j.licenses.find((l) => l.product === 'pos'); assert.equal(l2.status, 'aktif'); assert.ok((new Date(l2.end) - Date.now()) / 864e5 > 360); ok('lisans 12 ay aktif oldu');
    r = await A('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.status, 400); ok('aynı sipariş ikinci kez onaylanamaz');

    // 6) Hesap kilitleme
    const L = client();
    for (let i = 0; i < 5; i++) await L('POST', '/api/auth/login', { email: 'musteri@firma.test', pass: 'Yanlis9999' });
    r = await L('POST', '/api/auth/login', { email: 'musteri@firma.test', pass: 'Sifre1234' }); assert.equal(r.status, 401); assert.ok(/kilit/i.test(r.j.error)); ok('5 hatalı denemede hesap kilitlendi');

    console.log(`\n${passed} test geçti`);
  } catch (e) { console.error('\nTEST HATASI:', e.message, '\n--- sunucu çıktısı ---\n' + log.slice(-3000)); process.exitCode = 1; } finally {
    srv.kill(); await root.query("DROP DATABASE IF EXISTS nebsoft_test; DROP USER IF EXISTS 'ns_test'@'localhost'; DROP USER IF EXISTS 'ns_test'@'127.0.0.1';"); await root.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
})();
