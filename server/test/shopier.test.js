// Shopier ödeme testi: sahte Shopier sunucusuyla (gerçek hesap kullanılmaz).
//   1. bölüm veritabanı istemez: imza, tutar, karar kuralları ve API istemcisi.
//   2. bölüm uçtan uca çalışır, MySQL ister; kendi "nebsoft_shopier_test" veritabanını ve geçici veri klasörünü kullanır:
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/shopier.test.js
// MySQL yoksa 2. bölüm "ATLANDI" yazar; bu geçti sayılmaz.
const http = require('http'); const crypto = require('crypto'); const assert = require('assert');
const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawn } = require('child_process');

const PAT = 'pat_gizli_' + crypto.randomBytes(16).toString('hex'); // sızıntı testi bu değeri her yerde arar
const HOOK_TOKEN = 'whtok_' + crypto.randomBytes(16).toString('hex');
const PORT = Number(process.env.SHOPIER_TEST_PORT) || 5098; const FAKE = PORT + 1;
const BASE = `http://127.0.0.1:${PORT}`; const FAKE_URL = `http://127.0.0.1:${FAKE}`;
let passed = 0; const ok = (n) => { passed++; console.log('  ✓', n); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hmac = (raw, key = HOOK_TOKEN) => crypto.createHmac('sha256', key).update(raw).digest('hex');
async function until(fn, ms = 4000) { const t = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) return v; await sleep(60); } }

// ---------- Sahte Shopier: belgelenen uçların biçimini taklit eder ----------
const fake = { products: new Map(), orders: [], hooks: [], calls: [], mode: '', rate: 0, seq: 100, bodies: [] };
const server = http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    const u = new URL(req.url, FAKE_URL); const p = u.pathname; const raw = Buffer.concat(chunks).toString('utf8'); const body = raw ? JSON.parse(raw) : null;
    fake.calls.push({ method: req.method, path: p, query: u.search, auth: req.headers.authorization }); if (body) fake.bodies.push(raw);
    const send = (code, o, h = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', ...h }); res.end(o === undefined ? '' : JSON.stringify(o)); };
    if (fake.mode === 'hang') return; // yanıt yok: zaman aşımı
    if (fake.mode === 'hata') return send(500, { error: `iç hata ${req.headers.authorization}` }); // yanıta anahtar yansısa bile bize geçmemeli
    if (fake.rate > 0) { fake.rate--; return send(429, { error: 'rate' }, { 'Retry-After': '1' }); }
    if (req.headers.authorization !== `Bearer ${PAT}`) return send(401, { error: 'unauthorized' });
    if (req.method === 'POST' && p === '/products') { const id = String(++fake.seq); const prod = { ...body, id, url: `${FAKE_URL}/urun/${id}`, priceData: fake.mode === 'yanlisfiyat' ? { ...body.priceData, price: '1.00' } : body.priceData }; fake.products.set(id, prod); return send(200, prod); }
    let m = /^\/products\/(.+)$/.exec(p);
    if (m && req.method === 'DELETE') { if (fake.mode === 'silme404') return send(404, {}); return fake.products.delete(m[1]) ? send(200, undefined) : send(404, {}); }
    if (p === '/products' && req.method === 'GET') return send(200, [...fake.products.values()].slice(0, 1));
    if (p === '/orders' && req.method === 'GET') { const pid = u.searchParams.get('productId'); return send(200, fake.orders.filter((o) => !pid || o.lineItems.some((l) => l.productId === pid))); }
    if (p === '/webhooks' && req.method === 'GET') return send(200, fake.hooks.map(({ token, ...x }) => x));
    if (p === '/webhooks' && req.method === 'POST') { const w = { id: 'wh' + (++fake.seq), event: body.event, url: body.url, token: HOOK_TOKEN }; fake.hooks.push(w); return send(200, w); }
    m = /^\/webhooks\/(.+)$/.exec(p); if (m && req.method === 'DELETE') { fake.hooks = fake.hooks.filter((w) => w.id !== m[1]); return send(200, undefined); }
    return send(404, { error: 'yok' });
  });
});
const shopOrder = (pid, total, over = {}) => ({ id: 'SO' + (++fake.seq), status: 'unfulfilled', paymentStatus: 'paid', installments: false, dateCreated: '2026-10-30T10:00:00+0300', currency: 'TRY', paymentMethod: 'creditCard', totals: { subtotal: total, shipping: '0.00', discount: '0.00', total }, lineItems: [{ productId: pid, title: 'x', type: 'digital', quantity: 1, price: total, total }], refunds: [], ...over });

// ---------- 1. bölüm: veritabanı gerektirmez ----------
async function unit() {
  console.log('Kurallar ve istemci');
  process.env.SHOPIER_API_BASE = FAKE_URL; process.env.SHOPIER_TIMEOUT_MS = '500';
  const s = require('../cloud/shopier');
  // Bilinen sonuç (Node crypto ile değil, elle sabitlenmiş vektör): HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
  assert.equal(s.verifySignature(Buffer.from('The quick brown fox jumps over the lazy dog'), 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', 'key'), true); ok('imza: bilinen HMAC-SHA256 vektörü (hex) doğrulandı');
  const raw = Buffer.from('{"id":"1"}');
  assert.equal(s.verifySignature(raw, hmac(raw).toUpperCase(), HOOK_TOKEN), true); ok('imza: büyük harfli hex de kabul');
  for (const [sig, n] of [['', 'boş'], ['abc', 'kısa'], ['z'.repeat(64), 'hex değil'], [hmac(raw, 'baska-anahtar'), 'başka anahtar'], [hmac(Buffer.from('{"id":"2"}')), 'başka gövde'], [Buffer.from(crypto.createHmac('sha256', HOOK_TOKEN).update(raw).digest()).toString('base64'), 'base64']]) assert.equal(s.verifySignature(raw, sig, HOOK_TOKEN), false, n);
  assert.equal(s.verifySignature(raw, hmac(raw, ''), ''), false); ok('imza: sahte, boş, başka gövde ve anahtarsız durum reddedildi');
  assert.equal(s.kurus('1199.40'), 119940); assert.equal(s.kurus('1199.4'), 119940); assert.equal(s.kurus('1199'), 119900); assert.equal(s.kurus(0.07 + 0.01), 8); assert.ok(Number.isNaN(s.kurus('1,199.40'))); assert.ok(Number.isNaN(s.kurus('1199.401'))); assert.ok(Number.isNaN(s.kurus(''))); assert.ok(Number.isNaN(s.kurus(undefined))); assert.ok(Number.isNaN(s.kurus('-5'))); ok('tutar: kuruşa kesin çevrim, bozuk biçim reddi');
  const o = { total: '1199.40' }; const e = (x) => s.evaluate(o, 'P1', shopOrder('P1', '1199.40', x));
  assert.equal(e({}).state, 'paid'); assert.equal(s.evaluate(o, 'P1', shopOrder('P2', '1199.40')).state, 'ignore'); assert.equal(e({ paymentStatus: 'unpaid' }).state, 'wait'); ok('karar: ödendi / bizim değil / ödenmedi');
  assert.equal(s.evaluate(o, 'P1', shopOrder('P1', '1199.39')).state, 'mismatch'); assert.equal(s.evaluate(o, 'P1', shopOrder('P1', '1199.41')).state, 'mismatch'); assert.equal(e({ currency: 'USD' }).state, 'mismatch'); assert.equal(e({ refunds: [{ id: 'r' }] }).state, 'mismatch'); assert.equal(e({ totals: undefined }).state, 'mismatch'); assert.equal(e({ totals: { total: 'bilinmiyor' } }).state, 'mismatch');
  assert.equal(e({ lineItems: [{ productId: 'P1', quantity: 2 }] }).state, 'mismatch'); assert.equal(e({ lineItems: [{ productId: 'P1', quantity: 1 }, { productId: 'P9', quantity: 1 }] }).state, 'mismatch'); assert.equal(s.evaluate({ total: 0 }, 'P1', shopOrder('P1', '0.00')).state, 'mismatch'); ok('karar: tutar, para birimi, iade, adet, fazladan ürün, eksik alan → uyuşmazlık');
  const b = s.productBody({ no: 'NS24001', total: '1199.40' }, 'https://x.test/a.png'); for (const k of ['title', 'type', 'media', 'priceData', 'shippingPayer']) assert.ok(b[k], k);
  assert.equal(b.priceData.price, '1199.40'); assert.equal(b.priceData.currency, 'TRY'); assert.equal(b.stockQuantity, 1); assert.equal(b.type, 'digital'); assert.equal(b.media[0].placement, 1); assert.ok(!('vatPercent' in b.priceData)); ok('ürün gövdesi: belgelenen zorunlu alanlar, tek adet, KDV alanı gönderilmedi');
  assert.equal(s.safeUrl(`${FAKE_URL}/urun/1`), true); assert.equal(s.safeUrl('https://evil.test/x'), false); delete process.env.SHOPIER_API_BASE;
  assert.equal(s.safeUrl('https://www.shopier.com/696547'), true); assert.equal(s.safeUrl('http://www.shopier.com/1'), false); assert.equal(s.safeUrl('https://shopier.com.evil.test/1'), false); assert.equal(s.safeUrl('javascript:alert(1)'), false); ok('yönlendirme adresi yalnızca https Shopier');
  process.env.SHOPIER_API_BASE = 'http://evil.test'; process.env.NODE_ENV = 'production'; assert.equal(s.safeUrl('http://evil.test/x'), false); delete process.env.NODE_ENV; process.env.SHOPIER_API_BASE = FAKE_URL; ok('üretimde test adresi yok sayılıyor: PAT başka sunucuya gidemez');

  await s.call(PAT, 'GET', '/products?limit=1'); assert.equal(fake.calls.at(-1).auth, `Bearer ${PAT}`); ok('istemci: Authorization Bearer');
  await assert.rejects(s.call('yanlis-anahtar', 'GET', '/products'), (x) => x.status === 401 && !x.message.includes('yanlis-anahtar')); ok('istemci: 401 anahtarı metne yazmadı');
  fake.rate = 1; let t = Date.now(); await s.call(PAT, 'GET', '/products?limit=1'); assert.ok(Date.now() - t >= 900, 'Retry-After beklenmedi'); ok('istemci: 429 sonrası Retry-After kadar bekleyip yeniden denedi');
  fake.rate = 3; await assert.rejects(s.call(PAT, 'GET', '/products'), (x) => x.status === 429); fake.rate = 0; s.reset(); ok('istemci: 429 sürerse hata döner, sonsuza kadar denemez');
  fake.mode = 'hang'; t = Date.now(); await assert.rejects(s.call(PAT, 'POST', '/products', {}), (x) => x.message.includes('zaman aşımı') && !x.message.includes(PAT)); assert.ok(Date.now() - t < 1500); const n = fake.calls.filter((c) => c.method === 'POST' && c.path === '/products').length; await sleep(50); assert.equal(fake.calls.filter((c) => c.method === 'POST' && c.path === '/products').length, n); ok('istemci: zaman aşımı, POST yeniden denenmedi (ikinci ürün açılmaz)');
  fake.mode = 'hata'; await assert.rejects(s.call(PAT, 'GET', '/products'), (x) => x.status === 500 && !x.message.includes(PAT)); fake.mode = ''; ok('istemci: sunucu yanıtındaki anahtar hata metnine geçmedi');
}

// ---------- 2. bölüm: uçtan uca ----------
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || ''; const DBN = 'nebsoft_shopier_test';
function client() {
  let cookie = '';
  return async (method, url, body) => {
    const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (e) { /* düz metin */ }
    return { status: r.status, j, text };
  };
}
const hook = (raw, { sig, event = 'order.created', id = crypto.randomUUID() } = {}) => fetch(`${BASE}/api/odeme/shopier/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Shopier-Event': event, 'Shopier-Webhook-Id': id, 'Shopier-Signature': sig === undefined ? hmac(raw) : sig, 'Shopier-Account-Id': '1', 'Shopier-Timestamp': String(Math.floor(Date.now() / 1000)) }, body: raw });

async function e2e() {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { return console.log('\nUçtan uca: ATLANDI (mysql2 paketi yok) — geçti sayılmaz'); }
  let root; try { root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true }); } catch (e) { return console.log(`\nUçtan uca: ATLANDI (MySQL'e bağlanılamadı: ${e.code || e.message}) — geçti sayılmaz`); }
  console.log('Uçtan uca (sahte Shopier + MySQL)');
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4;`);
  const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsshopier-'));
  let log = ''; const boot = async (scanMs) => {
    const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'shopier-test-secret', SHOPIER_API_BASE: FAKE_URL, SHOPIER_TIMEOUT_MS: '500', SHOPIER_SCAN_MS: String(scanMs), NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
    srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
    await until(async () => { try { return (await fetch(`${BASE}/api/setup/status`)).ok; } catch (e) { return false; } }, 8000); return srv;
  };
  let srv = await boot(3600e3);
  const stop = (p) => new Promise((r) => { p.once('exit', r); p.kill(); });
  try {
    const A = client(), C = client(), D = client();
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DBH, database: DBN, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, r.text);
    await A('PUT', '/api/admin/settings', { trialDays: 7, siteName: 'NEBSOFT', siteUrl: 'https://nebsoft.test' });
    await A('POST', '/api/admin/banks', { holder: 'NEBSOFT Yazılım A.Ş.', iban: 'TR33 0006 1005 1978 6457 8413 26', bank: 'İş Bankası' });
    r = await C('POST', '/api/auth/register', { email: 'musteri@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Market', kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, r.text);
    r = await D('POST', '/api/auth/register', { email: 'baska@firma.test', pass: 'Sifre1234', name: 'Ayşe Kaya', phone: '05321112234', company: 'Kaya Market', kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, r.text);
    const order = (who, method) => who('POST', '/api/orders', { items: [{ pid: 'pos', plan: 1, period: 'aylik', qty: 1 }], billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' }, ...(method ? { method } : {}) });
    const q = async (sql, p) => (await root.query(`USE ${DBN}`), (await root.execute(sql, p))[0]);
    const ostat = async (id) => (await q('SELECT status FROM orders WHERE id=?', [id]))[0].status;
    const lic = async () => (await q("SELECT l.status, l.end, l.order_id FROM licenses l JOIN users u ON u.tenant_id=l.tenant_id WHERE u.email='musteri@firma.test' AND l.product='pos'"))[0];

    // Görünürlük
    r = await C('GET', '/api/odeme/yontemler'); assert.equal(r.j.shopier, false); r = await order(C, 'shopier'); assert.equal(r.status, 400); ok('PAT yokken seçenek görünmüyor, sunucu da reddediyor');
    r = await C('PUT', '/api/admin/shopier', { pat: 'x'.repeat(20) }); assert.equal(r.status, 403); ok('müşteri PAT yazamıyor');
    r = await A('PUT', '/api/admin/shopier', { pat: PAT, testEmail: 'musteri@firma.test' }); assert.equal(r.status, 200, r.text); assert.equal(r.j.hasPat, true); assert.equal(r.j.verifiedAt, null); assert.ok(!r.text.includes(PAT)); ok('PAT kaydedildi, yanıtta yok; "gerçek hesapla denenmedi" durumu');
    r = await A('GET', '/api/admin/shopier'); assert.ok(!r.text.includes(PAT)); r = await A('GET', '/api/admin/settings'); assert.ok(!r.text.includes(PAT));
    assert.ok(!(await q("SELECT v FROM settings WHERE k='shopier'"))[0].v.includes(PAT)); assert.ok((await q("SELECT v FROM settings WHERE k='shopier'"))[0].v.includes('enc:v1:')); ok('PAT veritabanında şifreli, panel yanıtlarında yok');
    r = await D('GET', '/api/odeme/yontemler'); assert.equal(r.j.shopier, false); r = await order(D, 'shopier'); assert.equal(r.status, 400); ok('denenmeden önce başka müşteri seçemiyor');
    r = await C('GET', '/api/odeme/yontemler'); assert.equal(r.j.shopier, true); ok('deneme müşterisi seçeneği görüyor');
    r = await A('POST', '/api/admin/shopier/test'); assert.equal(r.j.ok, true, r.text); r = await A('POST', '/api/admin/shopier/webhook'); assert.equal(r.j.webhook.registered, true, r.text); assert.ok(!r.text.includes(HOOK_TOKEN)); assert.equal(fake.hooks[0].url, 'https://nebsoft.test/api/odeme/shopier/webhook'); ok('bağlantı denendi, webhook kaydı alındı, token yanıtta yok');
    await A('POST', '/api/admin/shopier/webhook'); assert.equal(fake.hooks.length, 1); ok('webhook yeniden kaydı eskisini siler, kopya bırakmaz');

    // Havale akışı bozulmadı
    r = await order(C); assert.equal(r.j.ok, true, r.text); assert.ok(!r.j.shopier); assert.ok(r.j.banks.length); const hav = r.j.order; assert.equal(hav.status, 'odeme-bekliyor'); assert.equal(fake.products.size, 0);
    r = await A('POST', `/api/admin/orders/${hav.id}/approve`, { note: 'dekont' }); assert.equal(r.j.ok, true, r.text); assert.equal(await ostat(hav.id), 'odendi'); assert.equal((await lic()).status, 'aktif'); ok('havale siparişi eskisi gibi: ürün açılmaz, panelden onaylanır');

    // Mutlu yol: webhook
    r = await order(C, 'shopier'); assert.equal(r.j.shopier.ok, true, r.text); const o1 = r.j.order; const pid1 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o1.id]))[0].product_id; const prod = fake.products.get(pid1);
    assert.equal(prod.priceData.price, Number(o1.total).toFixed(2)); assert.equal(prod.stockQuantity, 1); assert.equal(prod.media[0].url, 'https://nebsoft.test/assets/icons/icon-512.png'); assert.ok(!JSON.stringify(prod).includes('Veli') && !JSON.stringify(prod).includes('1234567890')); assert.equal(r.j.shopier.url, prod.url); ok('sipariş tutarında tek adetlik ürün açıldı, müşteri bilgisi Shopier ürününe yazılmadı');
    r = await C('POST', `/api/orders/${o1.id}/shopier`); assert.equal(fake.products.size, 1); assert.equal(r.j.url, prod.url); ok('ikinci tıklama yeni ürün açmıyor');
    r = await C('GET', `/api/orders/${o1.id}/odeme`); assert.equal(r.j.status, 'odeme-bekliyor'); assert.equal(r.j.shopier.state, 'kontrol'); assert.equal(r.j.shopier.url, prod.url); const before = await lic(); ok('ödeme yokken dönüş sayfası "kontrol ediliyor", başarı yok');
    r = await D('GET', `/api/orders/${o1.id}/odeme`); assert.equal(r.status, 404); ok('başka müşteri sipariş durumunu göremiyor');

    let raw = JSON.stringify({ id: 'SAHTE', lineItems: [{ productId: pid1 }] });
    r = await hook(raw, { sig: hmac(raw, 'tahmin') }); assert.equal(r.status, 401); r = await hook(raw, { sig: '' }); assert.equal(r.status, 401); await sleep(150); assert.equal(await ostat(o1.id), 'odeme-bekliyor'); ok('sahte imzalı webhook reddedildi');
    r = await hook(raw); assert.equal(r.status, 200); await sleep(250); assert.equal(await ostat(o1.id), 'odeme-bekliyor'); assert.equal(String((await lic()).end), String(before.end)); ok('imzası doğru ama Shopier’de ödemesi olmayan bildirim lisans açmadı');

    const so1 = shopOrder(pid1, Number(o1.total).toFixed(2)); fake.orders.push(so1); raw = JSON.stringify(so1); const hid = 'hook-1';
    r = await hook(raw, { id: hid }); assert.equal(r.status, 200); await until(async () => (await ostat(o1.id)) === 'odendi'); assert.equal(await ostat(o1.id), 'odendi'); const after = await lic(); assert.equal(after.status, 'aktif'); assert.equal(after.order_id, o1.id); assert.ok(new Date(after.end) > new Date(before.end)); ok('imzalı webhook + API doğrulaması: sipariş ödendi, lisans uzadı');
    await until(() => !fake.products.has(pid1)); assert.equal(fake.products.has(pid1), false); ok('ödeme sonrası Shopier ürünü silindi');
    r = await C('GET', `/api/orders/${o1.id}/odeme`); assert.equal(r.j.status, 'odendi'); assert.equal(r.j.shopier.state, 'odendi'); assert.equal(r.j.shopier.url, null); ok('dönüş sayfası artık ödendi');

    // Tekrar webhook
    r = await hook(raw, { id: hid }); assert.equal((await r.json()).duplicate, true); r = await hook(raw, { id: 'hook-yeni-kimlik' }); assert.equal(r.status, 200); await sleep(300); assert.equal(String((await lic()).end), String(after.end)); assert.equal((await q('SELECT COUNT(*) AS n FROM shopier_orders WHERE order_id=?', [o1.id]))[0].n, 1); ok('tekrar webhook: aynı ve yeni kimlikle lisans ikinci kez uzamadı');
    await Promise.all([1, 2, 3].map((i) => A('POST', `/api/admin/shopier/kontrol/${o1.id}`))); assert.equal(String((await lic()).end), String(after.end)); ok('eşzamanlı sorgular idempotent');

    // Çift ödeme
    const so1b = shopOrder(pid1, Number(o1.total).toFixed(2)); fake.orders.push(so1b); await hook(JSON.stringify(so1b)); await until(async () => (await q('SELECT status FROM shopier_payments WHERE order_id=?', [o1.id]))[0].status === 'cift-odeme'); assert.equal((await q('SELECT status FROM shopier_payments WHERE order_id=?', [o1.id]))[0].status, 'cift-odeme'); assert.equal(String((await lic()).end), String(after.end)); r = await A('GET', '/api/admin/shopier'); assert.ok(r.j.alerts.some((a) => a.order_id === o1.id)); ok('aynı ürüne ikinci ödeme: yönetici uyarısı, lisans uzamadı');

    // Tutar uyuşmazlığı
    r = await order(C, 'shopier'); const o2 = r.j.order; const pid2 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o2.id]))[0].product_id; const end2 = String((await lic()).end);
    const so2 = shopOrder(pid2, '1.00'); fake.orders.push(so2); await hook(JSON.stringify(so2)); const st2 = await until(async () => { const x = (await q('SELECT status, alert FROM shopier_payments WHERE order_id=?', [o2.id]))[0]; return x.status === 'uyusmazlik' && x; }); assert.ok(st2 && /Tutar uyuşmuyor/.test(st2.alert)); assert.equal(await ostat(o2.id), 'odeme-bekliyor'); assert.equal(String((await lic()).end), end2); ok('tutar uyuşmazlığı: lisans açılmadı, sipariş beklemede, uyarı yazıldı');
    r = await C('GET', `/api/orders/${o2.id}/odeme`); assert.equal(r.j.status, 'odeme-bekliyor'); assert.equal(r.j.shopier.state, 'inceleme'); r = await A('GET', '/api/admin/orders?status=odeme-bekliyor'); assert.ok(r.j.orders.find((x) => x.id === o2.id).shopier.alert); assert.equal((await q("SELECT COUNT(*) AS n FROM audit WHERE action='Shopier uyarısı'"))[0].n >= 2, true); ok('müşteriye "inceleniyor", panelde kırmızı uyarı ve güvenlik kaydı');
    await until(() => !fake.products.has(pid2)); assert.equal(fake.products.has(pid2), false); r = await C('POST', `/api/orders/${o2.id}/shopier`); assert.equal(r.status, 503); assert.equal((await q('SELECT status FROM shopier_payments WHERE order_id=?', [o2.id]))[0].status, 'uyusmazlik'); assert.equal(fake.products.size, 0); ok('uyuşmazlıkta bağlantı kapandı; müşteri yeniden ödeyemiyor, uyarı silinmiyor');
    r = await A('POST', `/api/admin/orders/${o2.id}/approve`, { note: 'elle kontrol edildi' }); assert.equal(r.j.ok, true); assert.ok(String((await lic()).end) !== end2); ok('yönetici elle onayla lisansı açabiliyor');

    // Webhook'suz: yalnız sorgulama
    r = await order(C, 'shopier'); const o3 = r.j.order; const pid3 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o3.id]))[0].product_id; fake.orders.push(shopOrder(pid3, Number(o3.total).toFixed(2)));
    r = await C('GET', `/api/orders/${o3.id}/odeme`); assert.equal(r.j.status, 'odendi', r.text); assert.equal(await ostat(o3.id), 'odendi'); await until(() => !fake.products.has(pid3)); assert.equal(fake.products.has(pid3), false); ok('webhook gelmese de dönüş sayfası sorgulaması ödemeyi yakaladı, ürün silindi');

    // Zaman aşımı: sipariş kaybolmaz, havale kalır
    fake.mode = 'hang'; let t = Date.now(); r = await order(C, 'shopier'); fake.mode = ''; assert.equal(r.status, 200, r.text); assert.equal(r.j.shopier.ok, false); assert.ok(Date.now() - t < 3000); assert.ok(!r.text.includes(PAT)); assert.equal(r.j.order.status, 'odeme-bekliyor'); assert.ok(r.j.banks.length); const o4 = r.j.order; assert.equal((await q('SELECT COUNT(*) AS n FROM shopier_payments WHERE order_id=?', [o4.id]))[0].n, 0); ok('Shopier zaman aşımı: sipariş duruyor, havale bilgisi dönüyor, sahte başarı yok');
    r = await C('POST', `/api/orders/${o4.id}/shopier`); assert.equal(r.j.ok, true, r.text); await sleep(600); ok('müşteri aynı sipariş için yeniden kart ödemesi başlatabiliyor');
    fake.mode = 'hang'; r = await C('GET', `/api/orders/${o4.id}/odeme`); fake.mode = ''; assert.equal(r.status, 200); assert.equal(r.j.status, 'odeme-bekliyor'); assert.equal(r.j.shopier.state, 'kontrol'); ok('sorgu zaman aşımında durum "kontrol ediliyor" kalır, ödendi görünmez');

    // İptal: ürün kaldırılır, geç gelen ödeme uyarı üretir
    const pid4 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o4.id]))[0].product_id; r = await C('POST', `/api/orders/${o4.id}/cancel`); assert.equal(r.j.ok, true); await until(() => !fake.products.has(pid4)); assert.equal(fake.products.has(pid4), false); ok('iptalde Shopier ürünü silindi');
    const so4 = shopOrder(pid4, Number(o4.total).toFixed(2)); fake.orders.push(so4); const end4 = String((await lic()).end); await hook(JSON.stringify(so4)); const st4 = await until(async () => { const x = (await q('SELECT status, alert FROM shopier_payments WHERE order_id=?', [o4.id]))[0]; return x.status === 'uyusmazlik' && x; }); assert.ok(st4 && /İptal edilmiş/.test(st4.alert)); assert.equal(await ostat(o4.id), 'iptal'); assert.equal(String((await lic()).end), end4); ok('iptal edilmiş siparişe geç ödeme: lisans yok, iade uyarısı var');

    // Hatalı ürün yanıtı
    fake.mode = 'yanlisfiyat'; r = await order(C, 'shopier'); fake.mode = ''; assert.equal(r.j.shopier.ok, false); assert.equal(fake.products.size, 0); ok('Shopier fiyatı farklı dönerse ürün silinir, müşteri yönlendirilmez');
    const o5 = r.j.order;
    fake.rate = 1; r = await C('POST', `/api/orders/${o5.id}/shopier`); assert.equal(r.j.ok, true, r.text); ok('ürün açarken 429: bekleyip yeniden denedi, tek ürün açıldı'); assert.equal(fake.products.size, 1);

    // Arka plan taraması (webhook yok, kullanıcı sayfayı kapatmış)
    const pid5 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o5.id]))[0].product_id; fake.orders.push(shopOrder(pid5, Number(o5.total).toFixed(2)));
    r = await order(C, 'shopier'); const o6 = r.j.order; const pid6 = (await q('SELECT product_id FROM shopier_payments WHERE order_id=?', [o6.id]))[0].product_id; await q('UPDATE shopier_payments SET created=DATE_SUB(created, INTERVAL 49 HOUR) WHERE order_id=?', [o6.id]);
    await stop(srv); srv = await boot(150); await until(async () => (await ostat(o5.id)) === 'odendi', 5000); assert.equal(await ostat(o5.id), 'odendi'); await until(() => !fake.products.has(pid5), 3000); assert.equal(fake.products.has(pid5), false); ok('arka plan taraması ödemeyi yakaladı ve ürünü sildi');
    await until(() => !fake.products.has(pid6), 3000); assert.equal(fake.products.has(pid6), false); assert.equal(await ostat(o6.id), 'odeme-bekliyor'); r = await C('GET', `/api/orders/${o6.id}/odeme`); assert.equal(r.j.shopier.state, 'kapandi'); assert.equal(r.j.shopier.url, null); r = await C('POST', `/api/orders/${o6.id}/shopier`); assert.equal(r.j.ok, true, r.text); assert.ok(r.j.url && !r.j.url.endsWith(`/${pid6}`)); ok('48 saat ödenmeyen bağlantı kapandı; sipariş duruyor, yeni bağlantı alınabiliyor');

    // Müşterilere açma ve silme
    r = await A('PUT', '/api/admin/shopier', { verified: true }); assert.ok(r.j.verifiedAt); r = await D('GET', '/api/odeme/yontemler'); assert.equal(r.j.shopier, true); ok('"gerçek hesapla denendi" işaretlenince tüm müşterilere açılıyor');
    r = await A('PUT', '/api/admin/shopier', { clear: true }); assert.equal(r.j.hasPat, false); assert.equal(r.j.verifiedAt, null); r = await D('GET', '/api/odeme/yontemler'); assert.equal(r.j.shopier, false); ok('anahtar silinince seçenek kayboluyor');

    // Sızıntı taraması
    assert.ok(!log.includes(PAT), 'PAT sunucu günlüğünde'); assert.ok(!log.includes(HOOK_TOKEN), 'token günlükte'); const dump = JSON.stringify(await q('SELECT * FROM audit')) + JSON.stringify(await q('SELECT * FROM shopier_payments')) + JSON.stringify(await q('SELECT * FROM shopier_orders')); assert.ok(!dump.includes(PAT)); assert.ok(!fake.bodies.some((b) => b.includes(PAT))); ok('PAT ve webhook token günlükte, denetim kaydında ve istek gövdelerinde yok');
    assert.ok(!/\[api\]/.test(log), 'beklenmeyen 500: ' + log.slice(-800)); ok('sunucuda beklenmeyen hata yok');
  } finally {
    await stop(srv).catch(() => {}); await root.query(`DROP DATABASE IF EXISTS ${DBN}`).catch(() => {}); await root.end().catch(() => {}); fs.rmSync(DATA, { recursive: true, force: true });
    if (process.exitCode) console.log(log.slice(-1500));
  }
}

(async () => {
  await new Promise((r) => server.listen(FAKE, '127.0.0.1', r));
  try { await unit(); await e2e(); console.log(`\nShopier testi: ${passed} kontrol geçti`); } catch (e) { console.error('\nHATA:', e.stack || e); process.exitCode = 1; }
  server.closeAllConnections(); server.close();
})();
