// E-ticaret kart ödemesi testi: sahte iyzico sunucusuyla (gerçek hesap kullanılmaz). Sahte sunucu resmî dokümandaki imza ve alan biçimini uygular.
//   1. bölüm veritabanı istemez: imza, karar kuralları. 2. bölüm uçtan uca çalışır, MySQL ister, kendi veritabanını kullanır.
// MySQL yoksa 2. bölüm "ATLANDI" yazar; bu geçti sayılmaz. Gerçek iyzico test hesabıyla doğrulama ayrı iştir.
const http = require('http'); const crypto = require('crypto'); const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawn } = require('child_process');
const KEY = 'sandbox-key-' + crypto.randomBytes(8).toString('hex'); const SECRET = 'sandbox-gizli-' + crypto.randomBytes(16).toString('hex');
const PORT = Number(process.env.IYZICO_TEST_PORT) || 5094; const FAKE = PORT + 1; const BASE = `http://127.0.0.1:${PORT}`; const FAKE_URL = `http://127.0.0.1:${FAKE}`;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '', DBN = process.env.IYZICO_TEST_DB_NAME || 'nebsoft_iyzico_test';
let passed = 0; const ok = (n) => { passed++; console.log('  ✓', n); }; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hmac = (m, k = SECRET) => crypto.createHmac('sha256', k).update(m).digest('hex');
const sifirsiz = (v) => { const s = String(v); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; };
const imzaSonuc = (r, k = SECRET) => hmac([r.paymentStatus, r.paymentId, r.currency, r.basketId, r.conversationId, sifirsiz(r.paidPrice), sifirsiz(r.price), r.token].join(':'), k);

// ---------- Sahte iyzico ----------
const fake = { forms: new Map(), calls: [], kipler: {}, seq: 100, refunds: [], cancels: [] };
const server = http.createServer((req, res) => {
  const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => {
    const raw = Buffer.concat(ch).toString('utf8'); const b = raw ? JSON.parse(raw) : {}; const send = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }; fake.calls.push({ path: req.url, raw });
    const a = String(req.headers.authorization || ''); const m = /^IYZWSv2 (.+)$/.exec(a); const d = m ? Buffer.from(m[1], 'base64').toString() : ''; const q = /^apiKey:(.+)&randomKey:(.+)&signature:(.+)$/.exec(d);
    if (!q || q[1] !== KEY || q[3] !== hmac(q[2] + req.url + raw)) return send({ status: 'failure', errorCode: '1001', errorMessage: 'imza hatalı' });
    if (req.url === '/payment/bin/check') return send({ status: 'success', bankName: 'Sahte Banka' });
    if (req.url.endsWith('/initialize/auth/ecom')) { if (fake.kipler.baslatHata) return send({ status: 'failure', errorMessage: 'Sepet hatalı' }); const token = 'tok' + (++fake.seq); fake.forms.set(token, { b, durum: 'bekliyor' }); return send({ status: 'success', token, paymentPageUrl: `${FAKE_URL}/sayfa/${token}`, conversationId: b.conversationId, signature: fake.kipler.bozukImza ? 'x' : hmac([b.conversationId, token].join(':')) }); }
    if (req.url.endsWith('/auth/ecom/detail')) {
      const f = fake.forms.get(b.token); if (!f) return send({ status: 'failure', errorMessage: 'Belirteç yok' }); if (f.durum === 'bekliyor') return send({ status: 'failure', errorMessage: 'Ödeme tamamlanmadı', conversationId: b.conversationId });
      const r = { status: 'success', paymentStatus: f.durum === 'hata' ? 'FAILURE' : 'SUCCESS', paymentId: 'P' + b.token, currency: 'TRY', basketId: f.basket || f.b.basketId, conversationId: f.b.conversationId, paidPrice: f.odenen || f.b.paidPrice, price: f.fiyat || f.b.price, token: b.token, fraudStatus: f.fraud ?? 1, installment: 1, lastFourDigits: '0008', cardAssociation: 'VISA', itemTransactions: [{ paymentTransactionId: 'T' + b.token, itemId: 'x' }] };
      r.signature = f.sahte ? hmac('sahte') : imzaSonuc(r); return send(r);
    }
    if (req.url === '/payment/refund') { fake.refunds.push(b); return send({ status: 'success', paymentId: 'P1', price: b.price, currency: 'TRY', conversationId: b.conversationId, hostReference: 'R1', signature: hmac(['P1', sifirsiz(b.price), 'TRY', b.conversationId].join(':')) }); }
    if (req.url === '/payment/cancel') { fake.cancels.push(b); return send({ status: 'success', paymentId: b.paymentId, price: '1', currency: 'TRY', hostReference: 'C1' }); }
    return send({ status: 'failure', errorMessage: 'yok' });
  });
});

function birim() {
  console.log('Kurallar');
  const y = require('../cloud/iyzico');
  // Dokümandaki yöntem: HMAC-SHA256(randomKey + uri.path + body), hex; base64(apiKey:..&randomKey:..&signature:..)
  const h = y.baslik({ apiKey: 'k', secret: 's' }, '/p', '{"a":1}', 'rnd'); const e = crypto.createHmac('sha256', 's').update('rnd/p{"a":1}').digest('hex'); assert.equal(Buffer.from(h.Authorization.slice(8), 'base64').toString(), `apiKey:k&randomKey:rnd&signature:${e}`); assert.ok(h.Authorization.startsWith('IYZWSv2 ')); assert.equal(h['x-iyzi-rnd'], 'rnd'); ok('IYZWSv2 başlığı doküman yöntemiyle aynı');
  assert.equal(y.sifirsiz('50.00'), '50'); assert.equal(y.sifirsiz('50.10'), '50.1'); assert.equal(y.sifirsiz('100'), '100'); assert.equal(y.sifirsiz('100.0'), '100'); assert.equal(y.fiyat(12.5), '12.50'); ok('fiyat biçimi: sondaki sıfırlar imzadan önce atılır');
  const o = { id: 'siparis1', total: 150.5 }; const r = { status: 'success', paymentStatus: 'SUCCESS', paymentId: '9', currency: 'TRY', basketId: 'siparis1', conversationId: 'siparis1', paidPrice: '150.50', price: '150.50', token: 't', fraudStatus: 1, installment: 1, itemTransactions: [{ paymentTransactionId: '7' }] }; const im = (x) => ({ ...x, signature: imzaSonuc(x) });
  assert.equal(y.karar(o, im(r), SECRET, 't').durum, 'odendi'); assert.equal(y.karar(o, im({ ...r, fraudStatus: 0 }), SECRET, 't').durum, 'inceleme'); assert.equal(y.karar(o, im({ ...r, fraudStatus: -1 }), SECRET, 't').durum, 'reddedildi');
  assert.equal(y.karar(o, { ...r, signature: 'yanlis' }, SECRET, 't').durum, 'uyusmazlik'); assert.equal(y.karar(o, im({ ...r, price: '1.00', paidPrice: '1.00' }), SECRET, 't').durum, 'uyusmazlik'); assert.equal(y.karar(o, im({ ...r, basketId: 'baska' }), SECRET, 't').durum, 'uyusmazlik'); assert.equal(y.karar(o, im({ ...r, currency: 'USD' }), SECRET, 't').durum, 'uyusmazlik'); assert.equal(y.karar(o, im(r), SECRET, 'baska').durum, 'uyusmazlik');
  assert.equal(y.karar(o, im({ ...r, paymentStatus: 'FAILURE' }), SECRET, 't').durum, 'basarisiz'); assert.equal(y.karar(o, { status: 'failure' }, SECRET, 't').durum, 'bekliyor'); assert.equal(y.karar(o, im({ ...r, paidPrice: '160.00' }), SECRET, 't').durum, 'odendi'); ok('imza, tutar, sipariş veya para birimi tutmadan ödendi sayılmaz; taksit farkı kabul edilir');
  assert.equal(y.guvenliAdres('https://sandbox-cpp.iyzipay.com/x'), true); assert.equal(y.guvenliAdres('https://iyzipay.com.kotu.net/x'), false); assert.equal(y.guvenliAdres('http://sandbox-cpp.iyzipay.com/x'), false); ok('yalnız iyzico adresine yönlendirilir');
}

function client() { let cookie = ''; return async (m, p, body, { raw, ct } = {}) => { const r = await fetch(BASE + p, { method: m, redirect: 'manual', headers: { 'x-ns-csrf': '1', ...(body || raw ? { 'Content-Type': ct || 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: raw ?? (body ? JSON.stringify(body) : undefined) }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; '); const text = await r.text(); let j = {}; try { j = JSON.parse(text); } catch (e) { /* html */ } return { status: r.status, j, text }; }; }

async function e2e() {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { return console.log('Uçtan uca: ATLANDI (mysql2 yok), geçti sayılmaz'); }
  let root; try { root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true }); } catch (e) { return console.log(`Uçtan uca: ATLANDI (MySQL: ${e.code || e.message}), geçti sayılmaz`); }
  console.log('Uçtan uca (sahte iyzico + MySQL)');
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4;`); const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsiyz-'));
  let log = ''; const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'iyzico-test-secret', IYZICO_API_BASE: FAKE_URL, IYZICO_TIMEOUT_MS: '1500', ETICARET_ODEME_TTL_MS: '1500', ETICARET_ODEME_TARA_MS: '600', NODE_ENV: 'test' } });
  srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${BASE}/api/setup/status`)).ok) break; } catch (e) { /* açılıyor */ } await sleep(100); }
  const stop = () => new Promise((r) => { srv.once('exit', r); srv.kill(); });
  try {
    const A = client(), C = client(), V = client(), Z = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DBH, database: DBN, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, r.text);
    await A('PUT', '/api/admin/settings', { trialDays: 7, siteName: 'NEBSOFT', siteUrl: 'https://nebsoft.test' });
    r = await C('POST', '/api/auth/register', { email: 'magaza@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Giyim', kvkk: true, product: 'eticaret' }); assert.equal(r.j.ok, true, r.text);
    r = await Z('POST', '/api/auth/register', { email: 'baska@firma.test', pass: 'Sifre1234', name: 'Ayşe Kaya', phone: '05321112234', company: 'Kaya Giyim', kvkk: true, product: 'eticaret' }); assert.equal(r.j.ok, true, r.text);
    r = await C('GET', '/api/auth/me'); const slug = r.j.tenant.slug; const slug2 = (await Z('GET', '/api/auth/me')).j.tenant.slug; const P = `/api/public/${slug}/eticaret`;
    const urun = () => ({ id: 'urun0001', name: 'Tişört', price: 200, active: true, variants: [{ id: 'var00001', color: 'Mavi', size: 'M', stock: 10 }] });
    const yaz = async (who, app, data) => { const g = await who('GET', `/api/data/${app}`); const v = g.j.version || 0; const x = await who('PUT', `/api/data/${app}`, { base: v, data: { ...(g.j.data || {}), ...data } }); assert.equal(x.status, 200, x.text); };
    await yaz(C, 'eticaret', { products: [urun()], orders: [], customers: [], coupons: [], _settings: { bizName: 'Veli Giyim', freeShip: 100000, shipFee: 50, codFee: 0 }, _meta: { created: new Date().toISOString() } });
    await yaz(Z, 'eticaret', { products: [urun()], orders: [], customers: [], _settings: {}, _meta: {} });
    r = await V('POST', `${P}/view`, {}); assert.equal(r.j.data._settings.kartOdeme, undefined); ok('anahtar yokken kart seçeneği kapalı');
    const sip = async (id, ek = {}) => { const x = await V('POST', `${P}/ops`, { ops: [{ c: 'customers', op: 'ins', rec: { id: 'mus' + id, name: 'Can Demir', phone: '05351112233', email: 'can@ornek.test' } }, { c: 'orders', op: 'ins', rec: { id, customer: 'mus' + id, ship: { name: 'Can Demir', phone: '05351112233', city: 'Konya', address: 'Merkez Mah. 1' }, items: [{ pid: 'urun0001', vid: 'var00001', qty: 1 }], pay: 'kart', ...ek } }] }); return x; };
    r = await sip('sip00001'); assert.equal(r.status, 409, r.text); ok('kart kapalıyken kartla sipariş reddedilir');
    await yaz(C, 'entegrasyon', { cfg: { payment: { provider: 'iyzico', apiKey: KEY, secret: SECRET, sandbox: true } } });
    r = await V('POST', `${P}/view`, {}); assert.equal(r.j.data._settings.kartOdeme, undefined); ok('Bağlantıyı dene geçmeden vitrinde kart açılmaz');
    r = await C('POST', '/api/entegrasyon/dene', { tur: 'payment', saglayici: 'iyzico', alanlar: {} }); assert.equal(r.j.ok, true, r.text);
    r = await V('POST', `${P}/view`, {}); assert.deepEqual(r.j.data._settings.kartOdeme, { test: true, ad: 'iyzico', tc: true }); assert.ok(!r.text.includes(SECRET) && !r.text.includes(KEY)); ok('vitrin yalnız kart açık ve test bilgisini görür, anahtar gitmez');
    const g0 = await C('GET', '/api/data/entegrasyon'); assert.ok(!g0.text.includes(SECRET) && !g0.text.includes(KEY)); ok('anahtar panele de düz gönderilmez');
    await yaz(C, 'entegrasyon', { cfg: { payment: { provider: 'iyzico', apiKey: g0.j.data.cfg.payment.apiKey, secret: g0.j.data.cfg.payment.secret, sandbox: false } } }); r = await V('POST', `${P}/view`, {}); assert.equal(r.j.data._settings.kartOdeme, undefined); ok('canlı mod IYZICO_CANLI olmadan açılmaz');
    await yaz(C, 'entegrasyon', { cfg: { payment: { provider: 'iyzico', apiKey: g0.j.data.cfg.payment.apiKey, secret: g0.j.data.cfg.payment.secret, sandbox: true } } });

    r = await sip('sip00001'); assert.equal(r.status, 200, r.text); const tk = r.j.token; assert.ok(tk); const q = async (sql, p) => (await root.query(`USE ${DBN}`), (await root.execute(sql, p))[0]);
    const ord = async (who = C, id = 'sip00001') => (await who('GET', '/api/data/eticaret')).j.data.orders.find((o) => o.id === id); let o = await ord(); assert.equal(o.total, 250); assert.equal(o.payStatus, 'bekliyor'); assert.equal((await q('SELECT durum FROM eticaret_odeme WHERE order_id=?', ['sip00001']))[0].durum, 'bekliyor');
    r = await V('POST', `${P}/odeme/baslat`, { token: tk, tc: '123' }); assert.equal(r.status, 400); r = await V('POST', `${P}/odeme/baslat`, { token: 'sahte.x', tc: '12345678901' }); assert.equal(r.status, 401); r = await V('POST', `/api/public/${slug2}/eticaret/odeme/baslat`, { token: tk, tc: '12345678901' }); assert.equal(r.status, 401, r.text); ok('kimlik numarası ve sipariş oturumu denetlenir, başka mağazanın belirteci geçmez');
    fake.kipler.bozukImza = true; r = await V('POST', `${P}/odeme/baslat`, { token: tk, tc: '12345678901' }); assert.equal(r.status, 502, r.text); fake.kipler.bozukImza = false; ok('imzası tutmayan başlatma yanıtı kullanılmaz');
    r = await V('POST', `${P}/odeme/baslat`, { token: tk, tc: '12345678901', fiyat: 1, total: 1 }); assert.equal(r.j.ok, true, r.text); assert.ok(r.j.url.startsWith(FAKE_URL)); const tok1 = r.j.url.split('/').pop(); const f = fake.forms.get(tok1); assert.equal(f.b.price, '250.00'); assert.equal(f.b.basketItems[0].price, '250.00'); assert.equal(f.b.buyer.identityNumber, '12345678901'); assert.ok(f.b.callbackUrl.startsWith(`https://nebsoft.test/api/odeme/iyzico/donus/${slug}/`)); ok('tutarı sunucu belirler, istemcinin gönderdiği yok sayılır');
    const hamDoc = JSON.stringify(await q("SELECT data FROM app_data WHERE app='eticaret'")); assert.ok(!hamDoc.includes('12345678901')); o = await ord(); assert.equal(o.payTest, true); ok('kimlik numarası kaydedilmez, test ödemesi TEST işaretli');
    r = await V('POST', `${P}/view`, { token: tk }); assert.ok(!r.text.includes(tok1)); ok('ödeme belirteci müşteri görünümüne girmez');
    const don = (id, s = slug) => V('POST', `/api/odeme/iyzico/donus/${s}/${id}`, null, { raw: `token=${tok1}`, ct: 'application/x-www-form-urlencoded' });
    r = await don('sip00001'); assert.equal(r.status, 200); assert.ok(r.text.includes('#/tesekkurler/')); o = await ord(); assert.equal(o.payStatus, 'bekliyor'); ok('ödeme tamamlanmadan dönüş siparişi ödenmiş yapmaz');
    f.durum = 'odendi'; f.sahte = true; r = await don('sip00001'); o = await ord(); assert.equal(o.payStatus, 'kontrol'); ok('imzası sahte sonuç ödenmiş sayılmaz, kontrole düşer');
    await q("UPDATE eticaret_odeme SET durum='bekliyor', created=? WHERE order_id='sip00001'", [new Date()]);

    // Yeni sipariş: başarılı ödeme, tekrar gelen dönüş, webhook
    const yeni = async (id) => { const v = client(); const x = await v('POST', `${P}/ops`, { ops: [{ c: 'customers', op: 'ins', rec: { id: 'mus' + id, name: 'Can Demir', phone: '05351112233', email: 'can@ornek.test' } }, { c: 'orders', op: 'ins', rec: { id, customer: 'mus' + id, ship: { name: 'Can Demir', phone: '05351112233', city: 'Konya', address: 'Merkez' }, items: [{ pid: 'urun0001', vid: 'var00001', qty: 1 }], pay: 'kart' } }] }); assert.equal(x.status, 200, x.text); const b = await v('POST', `${P}/odeme/baslat`, { token: x.j.token, tc: '12345678901' }); assert.equal(b.j.ok, true, b.text); const t = b.j.url.split('/').pop(); return { t, form: fake.forms.get(t), v, tk: x.j.token }; };
    const a = await yeni('sip00002'); a.form.durum = 'odendi'; r = await V('POST', `/api/odeme/iyzico/donus/${slug}/sip00002`, null, { raw: 'token=baska', ct: 'application/x-www-form-urlencoded' }); o = await ord(C, 'sip00002'); assert.equal(o.payStatus, 'alindi'); assert.equal(o.payment.paymentId, 'P' + a.t); assert.equal(o.payment.last4, '0008'); assert.ok(!r.text.includes(SECRET)); ok('başarılı ödeme siparişe işlenir, gövdedeki belirteç kullanılmaz');
    const once = fake.calls.length; await V('POST', `/api/odeme/iyzico/donus/${slug}/sip00002`, null, { raw: 'token=x', ct: 'application/x-www-form-urlencoded' }); assert.equal(fake.calls.length, once); ok('ödenmiş sipariş yeniden işlenmez');
    const b2 = await yeni('sip00003'); b2.form.durum = 'odendi'; r = await V('POST', `/api/odeme/iyzico/webhook/${slug}`, null, { raw: JSON.stringify({ paymentConversationId: 'sip00003', status: 'SUCCESS' }) }); assert.equal(r.status, 200); assert.equal((await ord(C, 'sip00003')).payStatus, 'alindi'); ok('müşteri dönmese de webhook ödemeyi yakalar');
    const c3 = await yeni('sip00004'); r = await V('POST', `/api/odeme/iyzico/webhook/${slug}`, null, { raw: JSON.stringify({ paymentConversationId: 'sip00004', status: 'SUCCESS' }) }); assert.equal((await ord(C, 'sip00004')).payStatus, 'bekliyor'); ok('sahte webhook ödeme yazdıramaz, sonuç iyzico\'dan sorulur');
    const d4 = await yeni('sip00005'); d4.form.durum = 'odendi'; d4.form.fiyat = '1.00'; d4.form.odenen = '1.00'; await V('POST', `/api/odeme/iyzico/donus/${slug}/sip00005`, null, { raw: 't', ct: 'text/plain' }); assert.equal((await ord(C, 'sip00005')).payStatus, 'kontrol'); ok('düşük tutarlı ödeme kontrole düşer, ödenmiş sayılmaz');
    const e5 = await yeni('sip00006'); e5.form.durum = 'odendi'; e5.form.fraud = 0; await V('POST', `/api/odeme/iyzico/donus/${slug}/sip00006`, null, { raw: 't', ct: 'text/plain' }); assert.equal((await ord(C, 'sip00006')).payStatus, 'inceleme'); e5.form.fraud = 1; for (let i = 0; i < 40 && (await ord(C, 'sip00006')).payStatus !== 'alindi'; i++) await sleep(100); assert.equal((await ord(C, 'sip00006')).payStatus, 'alindi'); ok('incelemedeki ödeme taramayla sonuçlanır');

    // İade
    r = await Z('POST', '/api/eticaret/siparis/sip00002/iade', { tutar: 10 }); assert.ok(r.status === 404 || r.status === 409, r.text); ok('başka işletme iade yapamaz');
    r = await C('POST', '/api/eticaret/siparis/sip00002/iade', { tutar: 9999 }); assert.equal(r.status, 400); r = await C('POST', '/api/eticaret/siparis/sip00002/iade', { tutar: 50 }); assert.equal(r.j.tur, 'iade', r.text); assert.equal(fake.refunds[0].paymentTransactionId, 'T' + a.t); assert.equal(fake.refunds[0].price, '50.00'); r = await C('POST', '/api/eticaret/siparis/sip00002/iade', { tutar: 201 }); assert.equal(r.status, 400); o = await ord(C, 'sip00002'); assert.equal(o.onlineIade.length, 1); ok('kısmi iade işlem numarasıyla yapılır, toplam sipariş tutarını aşamaz');
    r = await C('POST', '/api/eticaret/siparis/sip00003/iade', { tutar: 250 }); assert.equal(r.j.tur, 'iptal', r.text); assert.equal(fake.cancels.length, 1); ok('aynı gün tam tutar iptal olarak gider');

    // Süresi dolan sipariş
    for (let i = 0; i < 60 && (await q("SELECT COUNT(*) n FROM eticaret_odeme WHERE durum='bekliyor' AND order_id<>'sip00001'"))[0].n; i++) await sleep(100); const st0 = (await C('GET', '/api/data/eticaret')).j.data.products[0].variants[0].stock; const y = await yeni('sip00007'); assert.ok(y.t); for (let i = 0; i < 50 && (await ord(C, 'sip00007')).status !== 'iptal'; i++) await sleep(100); o = await ord(C, 'sip00007'); assert.equal(o.status, 'iptal'); assert.equal(o.payStatus, 'odenmedi'); assert.equal((await C('GET', '/api/data/eticaret')).j.data.products[0].variants[0].stock, st0); ok('ödenmeyen siparişin stoğu geri eklenir');
    const g = await yeni('sip00008'); g.form.durum = 'odendi'; for (let i = 0; i < 50 && (await ord(C, 'sip00008')).payStatus !== 'alindi'; i++) await sleep(100); o = await ord(C, 'sip00008'); assert.equal(o.status, 'yeni'); assert.equal(o.payStatus, 'alindi'); ok('süresi dolan sipariş iptal edilmeden önce iyzico\'ya sorulur');
    assert.ok(!log.includes(SECRET) && !log.includes(KEY)); ok('günlüğe anahtar yazılmaz');
  } catch (e) { console.error(log.slice(-1800)); throw e; } finally { await stop().catch(() => {}); await root.query(`DROP DATABASE IF EXISTS ${DBN}`).catch(() => {}); await root.end().catch(() => {}); fs.rmSync(DATA, { recursive: true, force: true }); }
}
(async () => { birim(); await new Promise((r) => server.listen(FAKE, '127.0.0.1', r)); try { await e2e(); } finally { server.close(); } console.log(`\nE-ticaret ödeme: ${passed} kontrol geçti`); process.exit(0); })().catch((e) => { console.error(e); process.exit(1); });
