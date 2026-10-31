// Vitrin ödemesi uçtan uca: PayTR, Papara, Paynet, Craftgate. Sahte sunucu resmî dokümandaki alanları uygular, MySQL ister (yoksa ATLANDI, geçti sayılmaz).
// Dokümana uyumu gösterir, gerçek sağlayıcı hesabıyla çalıştığını KANITLAMAZ.
const http = require('http'); const crypto = require('crypto'); const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawn } = require('child_process');
const PORT = Number(process.env.ODEME_TEST_PORT) || 5188; const FAKE = PORT + 1; const BASE = `http://127.0.0.1:${PORT}`;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '', DBN = process.env.ODEME_TEST_DB_NAME || 'nebsoft_odeme_test';
const KEY = 'magaza-parola-gizli'; const SALT = 'magaza-tuz-gizli'; const PAPARA = 'papara-anahtar-gizli'; const PAYNET = 'sck_pcs_gizli'; const CG = 'craftgate-gizli';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let n = 0; const ok = (m) => { n++; console.log('  ✓', m); };
const imza = (m) => crypto.createHmac('sha256', KEY).update(m + SALT).digest('base64');
const fake = { calls: [], paytr: {}, papara: {}, paynet: {}, cg: {}, iade: [] };
const srv = http.createServer((req, res) => {
  const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => {
    const raw = Buffer.concat(ch).toString(); const u = req.url; fake.calls.push({ u, raw, h: req.headers, m: req.method }); const send = (o, d = 200) => { res.writeHead(d, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }; const f = Object.fromEntries(new URLSearchParams(raw));
    if (u === '/paytr/rapor/islem-dokumu') return send({ status: 'failed', err_msg: 'İşlem bulunamadı' });
    if (u === '/paytr/odeme/api/get-token') { const h = f.merchant_id + f.user_ip + f.merchant_oid + f.email + f.payment_amount + f.user_basket + f.no_installment + f.max_installment + f.currency + f.test_mode; if (f.paytr_token !== imza(h)) return send({ status: 'failed', reason: 'paytr_token gecersiz' }); fake.paytr[f.merchant_oid] = { f }; return send({ status: 'success', token: 'tok' + f.merchant_oid }); }
    if (u === '/paytr/odeme/durum-sorgu') { const p = fake.paytr[f.merchant_oid]; if (!p || !p.odendi) return send({ status: 'error', err_no: '004', err_msg: 'merchant_oid ile basarili odeme bulunamadi' }); return send({ status: 'success', payment_amount: '250,00', payment_total: '250,00', taksit: '1', masked_pan: '435508****4358', test_mode: '1' }); }
    if (u === '/paytr/odeme/iade') { fake.iade.push(f); if (f.paytr_token !== imza(f.merchant_id + f.merchant_oid + f.return_amount)) return send({ status: 'error', err_no: '004', err_msg: 'paytr_token gecersiz' }); return send({ status: 'success', is_test: 1, merchant_oid: f.merchant_oid, return_amount: f.return_amount, reference_no: 'R1' }); }
    if (u.startsWith('/papara-test')) {
      if (req.headers.apikey !== PAPARA) return send({}, 401); const d = (data) => send({ data, succeeded: true, error: null });
      if (u === '/papara-test/account') return d({ legalName: 'Firma', brandName: 'Firma' });
      if (u === '/papara-test/payments' && req.method === 'POST') { const b = JSON.parse(raw); const id = 'pp' + b.referenceId; fake.papara[id] = { b, status: 0 }; return d({ id, status: 0, paymentUrl: `http://127.0.0.1:${FAKE}/checkout/${id}` }); }
      if (u.startsWith('/papara-test/payments?id=')) { const id = decodeURIComponent(u.split('id=')[1]); const p = fake.papara[id]; return d({ id, status: p.status, amount: p.tutar ?? p.b.amount, referenceId: p.b.referenceId }); }
      if (u === '/papara-test/payments/refund') { fake.iade.push(JSON.parse(raw)); return d({ ok: 1 }); }
    }
    if (u.startsWith('/paynet-test')) {
      if (req.headers.authorization !== `Basic ${PAYNET}`) return send({}, 401);
      if (u.endsWith('/v1/ratio/Get')) return send({ data: [{ bank_id: 'AXSS' }] });
      if (u.endsWith('/v1/mailorder/create')) { const b = JSON.parse(raw); fake.paynet[b.reference_no] = { b }; return send({ url: `http://127.0.0.1:${FAKE}/S/M?id=1`, object_name: 'mailorder', code: 0, message: 'Basarili Islem' }); }
      if (u.endsWith('/v1/transaction/check')) { const b = JSON.parse(raw); const p = fake.paynet[b.reference_no]; return send({ is_succeed: !!(p && p.odendi), amount: p && p.b.amount, code: 0, message: 'ok' }); }
    }
    if (u.startsWith('/craftgate-test')) {
      const url = `http://127.0.0.1:${FAKE}${u}`; if (req.headers['x-signature'] !== crypto.createHash('sha256').update(url + 'cg-key' + CG + req.headers['x-rnd-key'] + raw).digest('base64')) return send({ errors: { errorCode: '10', errorDescription: 'signature hatalı' } }, 400);
      if (u.includes('/installment/v1/bins/')) return send({ data: { binNumber: '535805' } });
      if (u.endsWith('/checkout-payments/init')) { const b = JSON.parse(raw); const t = 'cg' + b.conversationId; fake.cg[t] = { b, durum: 'WAITING' }; return send({ data: { token: t, pageUrl: `http://127.0.0.1:${FAKE}/cg/${t}` } }); }
      if (u.includes('/checkout-payments/')) { const t = u.split('/').pop(); const p = fake.cg[t]; return send({ data: { id: 501, paymentStatus: p.durum, price: p.b.price, paidPrice: p.b.paidPrice, conversationId: p.b.conversationId, installment: 1 } }); }
      if (u.endsWith('/payment/v1/refunds')) { fake.iade.push(JSON.parse(raw)); return send({ data: { id: 900, status: 'SUCCESS' } }); }
    }
    send({ error: 'yok' }, 404);
  });
});
function client() { let cookie = ''; return async (m, p, body, { raw, ct } = {}) => { const r = await fetch(BASE + p, { method: m, redirect: 'manual', headers: { 'x-ns-csrf': '1', ...(body || raw ? { 'Content-Type': ct || 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: raw ?? (body ? JSON.stringify(body) : undefined) }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; '); const text = await r.text(); let j = {}; try { j = JSON.parse(text); } catch (e) { /* düz metin */ } return { status: r.status, j, text }; }; }
(async () => {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { return console.log('Vitrin ödemesi: ATLANDI (mysql2 yok), geçti sayılmaz'); }
  let root; try { root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true }); } catch (e) { return console.log(`Vitrin ödemesi: ATLANDI (MySQL: ${e.code || e.message}), geçti sayılmaz`); }
  await new Promise((r) => srv.listen(FAKE, '127.0.0.1', r));
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4;`); const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsodm-'));
  let log = ''; const app = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'odeme-test-secret', ENTEGRASYON_API_BASE: `http://127.0.0.1:${FAKE}`, ETICARET_ODEME_TARA_MS: '600000', NODE_ENV: 'test' } });
  app.stdout.on('data', (d) => { log += d; }); app.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${BASE}/api/setup/status`)).ok) break; } catch (e) { /* açılıyor */ } await sleep(100); }
  try {
    const A = client(), C = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DBH, database: DBN, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, r.text);
    await A('PUT', '/api/admin/settings', { trialDays: 7, siteName: 'NEBSOFT', siteUrl: 'https://nebsoft.test' });
    r = await C('POST', '/api/auth/register', { email: 'magaza@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Giyim', kvkk: true, product: 'eticaret' }); assert.equal(r.j.ok, true, r.text);
    r = await C('GET', '/api/auth/me'); const slug = r.j.tenant.slug; const P = `/api/public/${slug}/eticaret`;
    const yaz = async (app_, data) => { const g = await C('GET', `/api/data/${app_}`); const v = g.j.version || 0; const x = await C('PUT', `/api/data/${app_}`, { base: v, data: { ...(g.j.data || {}), ...data } }); assert.equal(x.status, 200, x.text); };
    const urun = { id: 'urun0001', name: 'Tişört', price: 200, active: true, variants: [{ id: 'var00001', color: 'Mavi', size: 'M', stock: 50 }] };
    await yaz('eticaret', { products: [urun], orders: [], customers: [], coupons: [], _settings: { bizName: 'Veli Giyim', freeShip: 100000, shipFee: 50, codFee: 0 }, _meta: { created: new Date().toISOString() } });
    const ord = async (id) => (await C('GET', '/api/data/eticaret')).j.data.orders.find((o) => o.id === id); const q = async (sql, p) => (await root.query(`USE ${DBN}`), (await root.execute(sql, p))[0]);
    const sip = async (id) => { const v = client(); const x = await v('POST', `${P}/ops`, { ops: [{ c: 'customers', op: 'ins', rec: { id: 'mus' + id, name: 'Can Demir', phone: '05351112233', email: 'can@ornek.test' } }, { c: 'orders', op: 'ins', rec: { id, customer: 'mus' + id, ship: { name: 'Can Demir', phone: '05351112233', city: 'Konya', address: 'Merkez Mah. 1' }, items: [{ pid: 'urun0001', vid: 'var00001', qty: 1 }], pay: 'kart' } }] }); assert.equal(x.status, 200, x.text); return { v, tk: x.j.token }; };
    const bagla = async (prov, alan) => { await yaz('entegrasyon', { cfg: { payment: { provider: prov, sandbox: true, ...alan } } }); const d = await C('POST', '/api/entegrasyon/dene', { tur: 'payment', saglayici: prov, alanlar: {} }); assert.equal(d.j.ok, true, d.text); return d; };
    const bildir = (b) => client()('POST', `/api/odeme/paytr/bildirim/${slug}`, null, { raw: new URLSearchParams(b).toString(), ct: 'application/x-www-form-urlencoded' });

    console.log('PayTR'); let d = await bagla('paytr', { merchantId: '123', merchantKey: KEY, merchantSalt: SALT }); assert.match(d.j.mesaj, new RegExp(`/api/odeme/paytr/bildirim/${slug}`)); ok('deneme sonucunda Bildirim URL yazar');
    r = await client()('POST', `${P}/view`, {}); assert.deepEqual(r.j.data._settings.kartOdeme, { test: true, ad: 'PayTR', tc: false }); assert.ok(!r.text.includes(KEY)); ok('vitrin sağlayıcıyı ve TEST bilgisini görür, anahtar gitmez');
    let s = await sip('siparis01'); r = await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); assert.equal(r.j.ok, true, r.text); assert.ok(r.j.iframe.includes('/odeme/guvenli/tok')); assert.equal(r.j.url, undefined); ok('T.C. istemez, ödeme sayfası çerçevede açılır');
    let o = await ord('siparis01'); assert.equal(o.total, 250); assert.equal(o.payTest, true); const oid = o.payment.oid; const f = fake.paytr[oid].f; assert.equal(f.test_mode, '1'); assert.equal(f.payment_amount, '25000'); assert.deepEqual(JSON.parse(Buffer.from(f.user_basket, 'base64').toString())[0].slice(1), ['250.00', 1]); ok('tutar siparişten alınır, kuruş ve sepet doğru, test_mode=1');
    const iyi = { merchant_oid: oid, status: 'success', total_amount: '25000', payment_amount: '25000', test_mode: '1', hash: imza2(oid, 'success', '25000') };
    r = await bildir({ ...iyi, hash: 'sahte' }); assert.equal(r.text, 'HATA'); assert.equal((await ord('siparis01')).payStatus, 'bekliyor'); ok('imzası sahte bildirim ödeme yazmaz');
    r = await bildir({ ...iyi, total_amount: '100', payment_amount: '100', hash: imza2(oid, 'success', '100') }); assert.equal(r.text, 'OK'); assert.equal((await ord('siparis01')).payStatus, 'kontrol'); await q("UPDATE eticaret_odeme SET durum='bekliyor' WHERE order_id='siparis01'"); ok('tutar tutmayan bildirim ödendi yazmaz, kontrole düşer');
    s = await sip('siparis02'); await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); o = await ord('siparis02'); const oid2 = o.payment.oid; const iyi2 = { merchant_oid: oid2, status: 'success', total_amount: '25000', payment_amount: '25000', test_mode: '1', hash: imza2(oid2, 'success', '25000') };
    r = await bildir(iyi2); assert.equal(r.text, 'OK'); o = await ord('siparis02'); assert.equal(o.payStatus, 'alindi'); assert.equal(o.payTest, true); r = await bildir(iyi2); assert.equal(r.text, 'OK'); assert.equal((await ord('siparis02')).history.filter((h) => /Kart ödemesi alındı/.test(h.note)).length, 1); ok('geçerli bildirim ödemeyi yazar, TEST işaretli, tekrar gelen bildirim bir kez işlenir');
    r = await C('POST', '/api/eticaret/siparis/siparis02/iade', { tutar: 50 }); assert.equal(r.j.ok, true, r.text); assert.equal(fake.iade.at(-1).return_amount, '50.00'); assert.equal(fake.iade.at(-1).merchant_oid, oid2); ok('iade imzalı gider, kısmi tutar doğru');
    s = await sip('siparis03'); await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); o = await ord('siparis03'); r = await bildir({ merchant_oid: o.payment.oid, status: 'failed', total_amount: '25000', hash: imza2(o.payment.oid, 'failed', '25000'), failed_reason_msg: 'Limit yetersiz' }); assert.equal(r.text, 'OK'); o = await ord('siparis03'); assert.equal(o.payStatus, 'bekliyor'); assert.equal(o.payment.hata, 'Limit yetersiz'); ok('başarısız ödeme bildirimi ödendi yazmaz, nedeni saklar');
    fake.paytr[(await ord('siparis03')).payment.oid].odendi = true; await client()('GET', `/api/odeme/donus/${slug}/siparis03`); assert.equal((await ord('siparis03')).payStatus, 'alindi'); ok('bildirim gelmese de durum sorgusu ödemeyi yakalar');
    await yaz('entegrasyon', { cfg: { payment: { provider: 'paytr', sandbox: false, merchantId: '123', merchantKey: KEY, merchantSalt: SALT } } }); r = await client()('POST', `${P}/view`, {}); assert.equal(r.j.data._settings.kartOdeme, undefined); ok('canlı kilit kapalıyken canlı modda ödeme açılmaz');

    console.log('Papara'); await bagla('papara', { apiKey: PAPARA }); s = await sip('siparis11'); r = await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); assert.equal(r.j.ok, true, r.text); assert.ok(r.j.url.includes('/checkout/ppsiparis11')); const pb = fake.papara.ppsiparis11.b; assert.equal(pb.amount, 250); assert.match(pb.notificationUrl, /\/api\/odeme\/bildirim\/papara\//); ok('ödeme yönlendirmesi, tutar sunucudan');
    await client()('GET', `/api/odeme/donus/${slug}/siparis11?status=1&amount=250`); assert.equal((await ord('siparis11')).payStatus, 'bekliyor'); ok('yönlendirme parametresine güvenilmez');
    fake.papara.ppsiparis11.status = 1; fake.papara.ppsiparis11.tutar = 1; await client()('POST', `/api/odeme/bildirim/papara/${slug}/siparis11`, null, { raw: '{}' }); assert.equal((await ord('siparis11')).payStatus, 'kontrol'); await q("UPDATE eticaret_odeme SET durum='bekliyor' WHERE order_id='siparis11'"); ok('eksik tutar ödendi yazmaz');
    s = await sip('siparis12'); await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); fake.papara.ppsiparis12.status = 1; await client()('POST', `/api/odeme/bildirim/papara/${slug}/siparis12`, null, { raw: '{}' }); o = await ord('siparis12'); assert.equal(o.payStatus, 'alindi'); r = await C('POST', '/api/eticaret/siparis/siparis12/iade', { tutar: 40 }); assert.equal(r.j.ok, true, r.text); assert.equal(fake.iade.at(-1).refundAmount, '40.00'); ok('bildirim sonucu sorgular, ödeme ve iade çalışır');

    console.log('Paynet'); await bagla('paynet', { secret: PAYNET }); s = await sip('siparis21'); r = await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); assert.equal(r.j.ok, true, r.text); await client()('POST', `/api/odeme/bildirim/paynet/${slug}/siparis21`, null, { raw: '{"is_succeed":true}' }); assert.equal((await ord('siparis21')).payStatus, 'bekliyor'); ok('imzasız bildirim tek başına ödeme yazmaz');
    fake.paynet.siparis21.odendi = true; await client()('POST', `/api/odeme/bildirim/paynet/${slug}/siparis21`, null, { raw: '{}' }); assert.equal((await ord('siparis21')).payStatus, 'alindi'); r = await C('POST', '/api/eticaret/siparis/siparis21/iade', { tutar: 10 }); assert.equal(r.status, 409); assert.match(r.j.error, /Paynet panelinden/); ok('sorgu ödemeyi yazar, iade panele yönlendirilir');

    console.log('Craftgate'); await bagla('craftgate', { apiKey: 'cg-key', secret: CG }); s = await sip('siparis31'); r = await s.v('POST', `${P}/odeme/baslat`, { token: s.tk }); assert.equal(r.j.ok, true, r.text); fake.cg.cgsiparis31.durum = 'SUCCESS'; await client()('POST', `/api/odeme/donus/${slug}/siparis31`, null, { raw: 'token=x', ct: 'application/x-www-form-urlencoded' }); o = await ord('siparis31'); assert.equal(o.payStatus, 'alindi'); r = await C('POST', '/api/eticaret/siparis/siparis31/iade', { tutar: 10 }); assert.equal(r.status, 502); r = await C('POST', '/api/eticaret/siparis/siparis31/iade', { tutar: 250 }); assert.equal(r.j.ok, true, r.text); assert.equal(fake.iade.at(-1).paymentId, 501); ok('imzalı başlatma, sonuç sorgusu, tam iade');

    await yaz('entegrasyon', { cfg: { payment: { provider: 'craftgate', sandbox: true, apiKey: 'yeni-anahtar', secret: CG } } }); r = await client()('POST', `${P}/view`, {}); assert.equal(r.j.data._settings.kartOdeme, undefined); ok('anahtar değişince yeniden deneme istenir');
    for (const x of [KEY, SALT, PAPARA, PAYNET, CG]) assert.ok(!log.includes(x)); ok('günlüğe anahtar yazılmaz');
    console.log(`\nVitrin ödemesi: ${n} kontrol geçti. Dokümana uyumu gösterir, gerçek hesapla çalıştığını kanıtlamaz.`);
  } catch (e) { console.error('✗', e.message, '\n', log.slice(-1200)); process.exitCode = 1; } finally {
    await new Promise((x) => { app.once('exit', x); app.kill(); }); srv.closeAllConnections(); srv.close(); await root.query(`DROP DATABASE IF EXISTS ${DBN}`); await root.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
})();
function imza2(oid, durum, tutar) { return crypto.createHmac('sha256', KEY).update(`${oid}${SALT}${durum}${tutar}`).digest('base64'); }
