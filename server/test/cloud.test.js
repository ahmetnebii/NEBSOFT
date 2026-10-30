// Bulut API uçtan uca testi. Gerekli: erişilebilir MySQL/MariaDB ve test veritabanı yetkisi.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/cloud.test.js
// Test kendi geçici veri klasörünü ve "nebsoft_test" veritabanını kullanır (her çalıştırmada sıfırlanır).
// Paralel oturumlar çakışmasın diye ad değiştirilebilir: TEST_DB_NAME (veritabanı), TEST_DB_APP_USER (testin açtığı kullanıcı).
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const mysql = require('mysql2/promise');
const assert = require('assert');

const PORT = Number(process.env.TEST_PORT) || 5097;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const DBN = process.env.TEST_DB_NAME || 'nebsoft_test', APPU = process.env.TEST_DB_APP_USER || 'ns_test';
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
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS '${APPU}'@'localhost'; DROP USER IF EXISTS '${APPU}'@'127.0.0.1';`);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'test-secret-123', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  try {
    for (let i = 0; i < 50 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const A = client(), C = client(), X = client();

    // 1) Kurulum: SQL üret → yönetici SQL'i çalıştırır → bağlantı bilgisi girilir
    let r = await A('GET', '/api/setup/status'); assert.equal(r.j.configured, false); ok('kurulum durumu: yapılandırılmamış');
    r = await A('POST', '/api/setup/sql', { database: DBN, user: APPU, host: '127.0.0.1' }); assert.ok(r.j.sql.includes('CREATE USER')); ok('veritabanı/kullanıcı/yetki SQL’i üretildi');
    await root.query(r.j.sql.replace(/-- .*$/gm, '').replace("'127.0.0.1'", "'127.0.0.1'"));
    await root.query(`CREATE USER IF NOT EXISTS '${APPU}'@'localhost' IDENTIFIED BY '${r.j.password}'; GRANT ALL ON ${DBN}.* TO '${APPU}'@'localhost';`);
    const pw = r.j.password;
    r = await A('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: APPU, password: pw, token: 'yanlis' }); assert.equal(r.status, 403); ok('yanlış kurulum anahtarı reddedildi');
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    r = await A('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: APPU, password: pw, token }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('MySQL bağlandı ve tablolar oluştu');
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
    const days = Math.round((new Date(lic.end) - Date.now()) / 864e5); assert.equal(days, 7); ok('kayıtta POS için 7 günlük deneme hemen başladı');
    r = await C('POST', '/api/trial', { product: 'adisyon' }); assert.equal(r.j.ok, true); assert.equal(r.j.license.status, 'deneme'); ok('ikinci ürün için deneme hemen başladı');

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
    assert.equal(r.j.ok, true, JSON.stringify(r.j)); assert.equal(r.j.order.status, 'odeme-bekliyor'); assert.equal(r.j.order.subtotal, 10990); assert.ok(r.j.banks[0].iban); ok('sipariş "ödeme bekliyor"; fiyat sunucuda hesaplandı (istemci fiyatı yok sayıldı)');
    const oid = r.j.order.id;
    r = await C('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.status, 403); ok('müşteri kendi siparişini onaylayamaz');
    r = await A('GET', '/api/admin/orders?status=odeme-bekliyor'); assert.equal(r.j.orders.length, 1); ok('admin bekleyen havaleyi görüyor');
    r = await A('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.j.ok, true); ok('admin "ödendi" olarak onayladı');
    r = await C('GET', '/api/auth/me'); const l2 = r.j.licenses.find((l) => l.product === 'pos'); assert.equal(l2.status, 'aktif'); assert.ok((new Date(l2.end) - Date.now()) / 864e5 > 360); ok('lisans 12 ay aktif oldu');
    r = await A('POST', `/api/admin/orders/${oid}/approve`, {}); assert.equal(r.status, 400); ok('aynı sipariş ikinci kez onaylanamaz');

    // 6) Müşteriye açık sayfa (online randevu): yalnızca izinli veri, sunucu tarafı doğrulama
    r = await C('GET', '/api/auth/me'); const slug = r.j.tenant.slug;
    await C('POST', '/api/trial', { product: 'randevu' });
    const doc = { _meta: {}, _settings: { bizName: 'Veli Kuaför', smsApiKey: 'GIZLI-ANAHTAR', autoConfirm: false, cancelHours: 2 },
      services: [{ id: 's1', name: 'Saç kesimi', duration: 30, price: 500, online: true, staff: ['u1'], cost: 120 }],
      staff: [{ id: 'u1', name: 'Ayşe', active: true, hours: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { start: '09:00', end: '20:00' }])) }],
      customers: [{ id: 'c1', name: 'Eski Müşteri', phone: '0532 111 22 33' }], appointments: [], blocks: [] };
    r = await C('PUT', '/api/data/randevu', { data: doc, base: 0 }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    const P = client(); const api = `/api/public/${slug}/randevu`;
    r = await P('POST', api + '/view', {}); const pv = JSON.stringify(r.j);
    assert.equal(r.j.ok, true); assert.ok(!pv.includes('GIZLI-ANAHTAR') && !pv.includes('Eski Müşteri') && !pv.includes('"cost"')); ok('müşteri sayfası: gizli ayar, müşteri listesi ve maliyet gönderilmiyor');
    const day = new Date(Date.now() + 2 * 864e5 + 3 * 3600e3).toISOString().slice(0, 10);
    r = await P('POST', api + '/ops', { ops: [{ c: 'customers', op: 'ins', rec: { id: 'newc1', name: 'Yeni Müşteri', phone: '0555 000 11 22' } }, { c: 'appointments', op: 'ins', rec: { id: 'apt001', date: day, start: '10:00', staff: 'u1', service: 's1', customer: 'newc1', price: 1, status: 'onay' } }] });
    assert.equal(r.j.ok, true, JSON.stringify(r.j));
    let saved = (await C('GET', '/api/data/randevu')).j.data.appointments.find((a) => a.id === 'apt001');
    assert.equal(saved.price, 500); assert.equal(saved.status, 'bekliyor'); ok('online randevu: fiyat ve durum sunucuda belirlendi (istemci değeri yok sayıldı)');
    r = await P('POST', api + '/ops', { ops: [{ c: 'appointments', op: 'ins', rec: { id: 'apt002', date: day, start: '10:15', staff: 'u1', service: 's1', customer: 'newc1' } }] }); assert.equal(r.status, 409); ok('aynı saate ikinci randevu reddedildi');
    r = await P('POST', api + '/ops', { ops: [{ c: 'appointments', op: 'upd', id: 'apt001', set: { status: 'iptal' } }] }); assert.equal(r.status, 403); ok('kimliksiz ziyaretçi randevu iptal edemez');
    r = await P('POST', api + '/ops', { ops: [{ c: 'staff', op: 'del', id: 'u1' }] }); assert.equal(r.status, 403); ok('izin verilmeyen koleksiyon değiştirilemez');
    const kod = saved.tCode; assert.ok(/^[A-Z2-9]{6}$/.test(kod), 'randevu kodu sunucuda üretilmeli');
    r = await P('POST', api + '/view', { q: { phone: '0555 000 11 22' } }); assert.ok(!r.j.token); r = await P('POST', api + '/view', { q: { phone: '0555 000 11 23', code: kod } }); assert.ok(!r.j.token); ok('telefon tek başına veya kodla başka telefon giriş açmıyor');
    r = await P('POST', api + '/view', { q: { phone: '0555 000 11 22', code: kod.toLowerCase() } }); assert.ok(r.j.token); const tok = r.j.token; assert.ok(!JSON.stringify(r.j.data.customers || []).includes('Yeni Müşteri')); ok('randevu kodu yalnızca o randevuyu açıyor, müşteri bilgisini vermiyor');
    r = await P('POST', api + '/ops', { token: tok.slice(0, -2) + 'xx', ops: [{ c: 'appointments', op: 'upd', id: 'apt001', set: { status: 'iptal' } }] }); assert.equal(r.status, 403); ok('değiştirilmiş belirteç reddedildi');
    r = await P('POST', api + '/ops', { token: tok, ops: [{ c: 'appointments', op: 'upd', id: 'apt001', set: { status: 'iptal', price: 0 } }] }); assert.equal(r.status, 403);
    r = await P('POST', api + '/ops', { token: tok, ops: [{ c: 'appointments', op: 'upd', id: 'apt001', set: { status: 'iptal' } }] }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); ok('kodla giriş yapan müşteri yalnızca izinli alanla kendi randevusunu iptal etti');
    const Bf = client(); for (let i = 0; i < 20; i++) await Bf('POST', api + '/view', { q: { phone: '0599' + String(1000000 + i) } });
    r = await Bf('POST', api + '/view', { q: { phone: '0555 000 11 22' } }); assert.equal(r.status, 429); ok('müşteri girişinde kaba kuvvet denemesi engellendi');
    r = await P('POST', `/api/public/${slug}/otel/view`, {}); assert.equal(r.status, 402); ok('lisansı olmayan hizmetin müşteri sayfası kapalı');
    r = await P('POST', `/api/public/olmayan-isletme/randevu/view`, {}); assert.equal(r.status, 404); ok('bilinmeyen işletme 404');

    // 7) Hesap kilitleme
    const L = client();
    for (let i = 0; i < 5; i++) await L('POST', '/api/auth/login', { email: 'musteri@firma.test', pass: 'Yanlis9999' });
    r = await L('POST', '/api/auth/login', { email: 'musteri@firma.test', pass: 'Sifre1234' }); assert.equal(r.status, 401); assert.ok(/kilit/i.test(r.j.error)); ok('5 hatalı denemede hesap kilitlendi');

    console.log(`\n${passed} test geçti`);
  } catch (e) { console.error('\nTEST HATASI:', e.message, '\n--- sunucu çıktısı ---\n' + log.slice(-3000)); process.exitCode = 1; } finally {
    srv.kill(); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS '${APPU}'@'localhost'; DROP USER IF EXISTS '${APPU}'@'127.0.0.1';`); await root.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
})();
