// Sağlayıcı istemcileri testi: sahte sunucu resmî dokümandaki istek ve yanıt biçimini uygular (node server/test/entegrasyon.test.js).
// Bu test dokümana uyumu gösterir, gerçek hesapla çalıştığını KANITLAMAZ. Gerçek deneme ilk müşteride yapılır (docs/ENTEGRASYON-ENVANTERI.md).
// Her istemci için: başarı, yetki hatası, zaman aşımı, bozuk yanıt, anahtar sızıntısı. Ardından gönderim, imza, kilit ve durum kuralları.
const http = require('http'); const crypto = require('crypto'); const assert = require('assert'); const os = require('os'); const path = require('path');
const PORT = Number(process.env.ENT_TEST_PORT) || 5196;
process.env.ENTEGRASYON_API_BASE = `http://127.0.0.1:${PORT}`; process.env.NEBSOFT_MOCK = `http://127.0.0.1:${PORT}/pazar`; process.env.ENTEGRASYON_TIMEOUT_MS = '400'; process.env.NEBSOFT_DATA = path.join(os.tmpdir(), `nebsoft-ent-${process.pid}`);
const ent = require('../cloud/entegrasyon'); const ort = require('../cloud/entegrasyon/ortak'); const { kilit } = require('../cloud/entegrasyon/odeme-kilit');
const GIZLI = 'GIZLI-DEGER-9f3a71'; const J = (o, d = 200) => [d, 'application/json', JSON.stringify(o)]; const T = (m, d = 200) => [d, 'text/plain', m];
const pem = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const SA = JSON.stringify({ client_email: 'nebsoft@proje.iam.gserviceaccount.com', private_key: pem });
const b = (a) => Buffer.from(a).toString('base64');
const TOK = J({ access_token: 'tok-1', token_type: 'bearer', expires_in: 3600 });
const JSONHATA = { error: { message: `anahtar ${GIZLI} geçersiz`, code: 190 }, errors: [{ message: `anahtar ${GIZLI} geçersiz` }], message: `anahtar ${GIZLI} geçersiz`, Message: `anahtar ${GIZLI} geçersiz`, ErrorCode: 999 };
// Tablo: anahtar, kimlik, sahte başarı yanıtı (yola göre), yetki hatası yanıtı ve kimlik denetimi
const T1 = [
  { a: 'sms:netgsm', k: { user: '8501234567', pass: GIZLI, header: 'BASLIK' }, ok: (u) => (u.includes('msgheader') ? J({ code: '00', msgheaders: ['BASLIK'], description: 'success' }) : J({ balance: [{ amount: 20, balance_name: 'Adet SMS' }] })), red: J({ code: '30' }, 200), sizinti: J({ code: `30 ${GIZLI}` }) },
  { a: 'sms:iletimerkezi', k: { key: 'k1', hash: GIZLI, header: 'eMarka' }, ok: (u) => (u.includes('get-sender') ? J({ response: { status: { code: 200, message: 'ok' }, senders: { sender: ['eMarka'] } } }) : J({ response: { status: { code: 200, message: 'İşlem başarılı' }, balance: { amount: '0', sms: '18343' } } })), red: J({ response: { status: { code: 401, message: 'Üyelik bilgileri hatalı' } } }, 401), sizinti: J({ response: { status: { code: 499, message: `hata ${GIZLI}` } } }) },
  { a: 'sms:verimor', k: { user: '908501234567', pass: GIZLI, header: 'BASLIGIM' }, ok: (u) => (u.includes('headers') ? J(['BASLIGIM']) : T('123')), red: T('Geçersiz kullanıcı adı/şifre', 401), sizinti: T(`Geçersiz ${GIZLI}`, 401) },
  { a: 'sms:twilio', k: { sid: 'AC' + 'a'.repeat(32), token: GIZLI, from: '+15005550006' }, ok: () => J({ account_sid: 'AC' + 'a'.repeat(32), balance: '0.05', currency: 'USD' }), red: J({ code: 20003, message: 'Authenticate', status: 401 }, 401), sizinti: J({ code: 1, message: `x ${GIZLI}`, status: 401 }, 401) },
  { a: 'sms:mutlucell', k: { user: 'u', pass: GIZLI, header: 'MUTLU' }, ok: (u) => (u.includes('gtorgex') ? T('MUTLU\tDENEME') : T('$1500')), red: T('23'), sizinti: T(`Hata ${GIZLI}`), bozuk: null },
  { a: 'whatsapp:cloud', k: { phoneId: '106540352242922', token: GIZLI }, ok: () => J({ id: '106540352242922', verified_name: 'Firma', display_phone_number: '+90 555' }), red: J({ error: { message: 'bad', type: 'OAuthException', code: 190 } }, 401), sizinti: J(JSONHATA, 400) },
  { a: 'email:sendgrid', k: { apiKey: `SG.${GIZLI}`, from: 'a@b.co' }, ok: () => J({ scopes: ['mail.send'] }), red: J({ errors: [{ message: 'authorization required', field: null }] }, 401), sizinti: J({ errors: [{ message: `SG.${GIZLI}` }] }, 400) },
  { a: 'email:mailgun', k: { apiKey: GIZLI, domain: 'mg.firma.com', from: 'a@mg.firma.com' }, ok: () => J({ domain: { name: 'mg.firma.com', state: 'active', type: 'custom' } }), red: T('Forbidden', 401), sizinti: J(JSONHATA, 400) },
  { a: 'email:brevo', k: { apiKey: GIZLI, from: 'a@b.co' }, ok: () => J({ email: 'a@b.co', companyName: 'Firma' }), red: J({ code: 'unauthorized', message: 'Key not found' }, 401), sizinti: J(JSONHATA, 400) },
  { a: 'email:resend', k: { apiKey: `re_${GIZLI}`, from: 'Firma <a@firma.com>' }, ok: () => J({ object: 'list', data: [{ name: 'firma.com', status: 'verified' }] }), red: J({ name: 'validation_error', message: 'API key is invalid' }, 401), sizinti: J(JSONHATA, 403) },
  { a: 'email:postmark', k: { token: GIZLI, from: 'a@b.co' }, ok: () => J({ ID: 1, Name: 'Firma', DeliveryType: 'Live', ApiTokens: ['gizli-token'] }), red: J({ ErrorCode: 10, Message: 'Bad token' }, 401), sizinti: J(JSONHATA, 422) },
  { a: 'payment:iyzico', k: { apiKey: 'k', secret: GIZLI, sandbox: true }, ok: () => J({ status: 'success', bankName: 'Banka' }), red: J({ status: 'failure', errorCode: '1001', errorMessage: 'api bilgileri bulunamadı' }), sizinti: J({ status: 'failure', errorCode: '9', errorMessage: `x ${GIZLI}` }) },
  { a: 'payment:paytr', k: { merchantId: '123', merchantKey: GIZLI, merchantSalt: 'tuz-degeri', sandbox: true }, ok: () => J({ status: 'failed', err_msg: 'İşlem bulunamadı' }), red: J({ status: 'error', err_msg: 'paytr_token gecersiz' }), sizinti: J({ status: 'error', err_msg: `token ${GIZLI}` }) },
  { a: 'payment:stripe', k: { secret: `sk_test_${GIZLI}` }, ok: () => J({ object: 'balance', livemode: false, available: [] }), red: J({ error: { type: 'invalid_request_error', message: 'Invalid API Key' } }, 401), sizinti: J({ error: { message: `sk_test_${GIZLI}` } }, 400) },
  { a: 'payment:papara', k: { apiKey: GIZLI, sandbox: true }, ok: () => J({ data: { legalName: 'Firma', brandName: 'Firma' }, succeeded: true, error: null }), red: T('', 401), sizinti: J({ succeeded: false, error: { code: 1, message: `x ${GIZLI}` } }) },
  { a: 'payment:moka', k: { dealerCode: 'd', user: 'u', pass: GIZLI, sandbox: true }, ok: () => J({ ResultCode: 'Success', Data: {} }), red: J({ ResultCode: 'PaymentDealer.CheckPaymentDealerAuthentication.InvalidRequest' }), sizinti: J({ ResultCode: 'X', ResultMessage: `x ${GIZLI}` }) },
  { a: 'payment:sipay', k: { apiKey: 'id', secret: GIZLI, sandbox: true }, ok: () => J({ status_code: 100, data: { token: 't', is_3d: 1 } }), red: J({ status_code: 30, status_description: 'Invalid credentials' }), sizinti: J({ status_code: 1, status_description: `x ${GIZLI}` }) },
  { a: 'payment:paynet', k: { secret: `sck_pcs_${GIZLI}`, sandbox: true }, ok: () => J({ data: [{ bank_id: 'AXSS' }] }), red: T('', 401), sizinti: J({ message: `sck_pcs_${GIZLI}` }) },
  { a: 'payment:craftgate', k: { apiKey: 'k', secret: GIZLI, sandbox: true }, ok: () => J({ data: { binNumber: '535805' } }), red: T('', 401), sizinti: J({ errors: { errorCode: '1', errorDescription: `x ${GIZLI}` } }) },
  { a: 'efatura:nilvera', k: { pass: GIZLI, vkn: '1234567890', test: true }, ok: () => J({ Name: 'Firma', TaxNumber: '1234567890' }), red: J({ Message: 'YETKISIZ' }, 401), sizinti: J({ Message: `x ${GIZLI}` }, 400) },
  { a: 'efatura:parasut', k: { clientId: 'c', clientSecret: 's', user: 'a@b.co', pass: GIZLI }, ok: (u) => (u.includes('/oauth/token') ? TOK : J({ data: { id: '1' }, included: [{ id: '7', type: 'companies' }] })), red: J({ error: 'invalid_client' }, 401), sizinti: null },
  { a: 'kargofirma:geliver', k: { token: GIZLI, test: true }, ok: () => J({ result: true, additionalMessage: 'Success', data: [] }), red: J({ result: false, code: 'E1055' }, 403), sizinti: J({ result: false, additionalMessage: `x ${GIZLI}` }) },
  { a: 'kargofirma:ups', k: { clientId: 'c', clientSecret: GIZLI, test: true }, ok: () => J({ access_token: 'a', status: 'approved' }), red: J({ response: { errors: [{ code: '10401', message: 'ClientId is Invalid' }] } }, 401), sizinti: J({ response: { errors: [{ message: `x ${GIZLI}` }] } }, 400) },
  { a: 'kargofirma:dhl', k: { user: 'u', pass: GIZLI, test: true }, ok: () => J({ shipments: [] }), red: T('', 401), sizinti: J(JSONHATA, 500) },
  { a: 'kargofirma:yurtici', k: { user: 'u', pass: GIZLI, denemeNo: 'K123' }, ok: () => T('<env:Envelope><env:Body><ns:queryShipmentResponse><ShippingDeliveryVO><shippingDeliveryDetailVO><cargoKey>K123</cargoKey><errCode>0</errCode><operationMessage>Teslim</operationMessage></shippingDeliveryDetailVO></ShippingDeliveryVO></ns:queryShipmentResponse></env:Body></env:Envelope>'), red: T('<env:Envelope><env:Body><env:Fault><faultstring>Hata</faultstring><detail><errText>Kullanıcı adı veya şifre hatalı</errText></detail></env:Fault></env:Body></env:Envelope>', 500), sizinti: T(`<Fault><faultstring>${GIZLI}</faultstring></Fault>`, 500) },
  { a: 'kargofirma:aras', k: { user: 'u', pass: GIZLI, customerCode: 'c', denemeNo: 'I1', test: true }, ok: () => T('<soap:Envelope><soap:Body><GetCargoInfoResponse><GetCargoInfoResult><diffgr:diffgram><NewDataSet><IrsDataDataTable>x</IrsDataDataTable></NewDataSet></diffgr:diffgram></GetCargoInfoResult></GetCargoInfoResponse></soap:Body></soap:Envelope>'), red: T('<soap:Fault><faultstring>Yetkisiz</faultstring></soap:Fault>', 500), sizinti: T(`<soap:Fault><faultstring>${GIZLI}</faultstring></soap:Fault>`, 500) },
  { a: 'kargofirma:ptt', k: { user: 'u', pass: GIZLI, denemeNo: 'KP01', test: true }, ok: () => T('<soapenv:Envelope><soapenv:Body><ns:gonderiSorgu2Response><ns:return><ax:BARNO>KP01</ax:BARNO><ax:sonucAciklama>Başarılı</ax:sonucAciklama><ax:sonucKodu>1</ax:sonucKodu></ns:return></ns:gonderiSorgu2Response></soapenv:Body></soapenv:Envelope>'), red: T('<ns:return><ax:sonucAciklama>Kullanıcı hatalı</ax:sonucAciklama></ns:return>'), sizinti: T(`<soapenv:Fault><faultstring>${GIZLI}</faultstring></soapenv:Fault>`, 500) },
  { a: 'pazaryeri:idefix', k: { sellerId: '55', apiKey: 'k', apiSecret: GIZLI }, ok: () => J({ totalCount: 0, items: [] }), red: J({ message: 'VENDOR_TOKEN_NOT_EXIST' }, 401), sizinti: J(JSONHATA, 401) },
  { a: 'pazaryeri:amazon', k: { clientId: 'c', clientSecret: 's', refreshToken: `Atzr|${GIZLI}`, sandbox: true }, ok: (u) => (u.includes('/auth/o2/token') ? TOK : J({ payload: [{ marketplace: { id: 'A33AVAJ2PDY3EV' } }] })), red: J({ error: 'invalid_grant' }, 400), sizinti: null },
  { a: 'yemekplatform:trendyol', k: { sellerId: '4321', apiKey: 'k', apiSecret: GIZLI }, ok: () => J({ restaurants: [{ id: 1 }], totalElements: 1 }), red: J({ exception: 'ClientApiAuthenticationException' }, 401), sizinti: J(JSONHATA, 400) },
  { a: 'kanal:hotelrunner', k: { hrId: 'hr1', token: GIZLI }, ok: () => J({ rooms: [{ inv_code: 'HR:1' }] }), red: T('Unauthorized', 401), sizinti: T(`x ${GIZLI}`, 401) },
  { a: 'takvim:google', k: { serviceAccount: SA, calendarId: 'a@group.calendar.google.com' }, ok: (u) => (u.includes('/token') ? TOK : J({ id: 'a@group', summary: 'Randevular' })), red: J({ error: 'invalid_grant' }, 400), sizinti: null, gizliAlan: 'serviceAccount' },
  { a: 'takvim:outlook', k: { tenant: 'firma.com', clientId: 'c', clientSecret: GIZLI, userId: 'a@firma.com' }, ok: (u) => (u.includes('/oauth2/') ? TOK : J({ id: 'AAM' })), red: J({ error: 'invalid_client' }, 401), sizinti: null },
  { a: 'onlineders:zoom', k: { accountId: 'acc', clientId: 'c', clientSecret: GIZLI, hostEmail: 'a@firma.com' }, ok: (u) => (u.includes('/oauth/token') ? TOK : J({ id: 'U1' })), red: J({ reason: 'Invalid client', error: 'invalid_client' }, 400), sizinti: null },
  { a: 'webhook:http', k: { url: `http://127.0.0.1:${PORT}/webhook/al`, secret: GIZLI }, ok: () => J({ ok: true }), red: T('', 401), sizinti: null, bozuk: null, zaman: true },
];
let kip = 'ok'; let satir = null; const gelen = []; let karsilik = null;
const server = http.createServer((req, res) => {
  const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => {
    const govde = Buffer.concat(ch).toString('utf8'); gelen.push({ url: req.url, h: req.headers, govde, yontem: req.method });
    if (kip === 'yavas') return; // yanıt verilmez: istemci zaman aşımına düşer
    const [d, t, m] = karsilik ? karsilik(req.url, govde) : kip === 'bozuk' ? [200, 'text/html', '<html>bakım'] : kip === 'yetki' ? satir.red : kip === 'sizinti' ? satir.sizinti : satir.ok(req.url, govde);
    res.writeHead(d, { 'Content-Type': t, ...(d >= 300 && d < 400 ? { Location: 'http://example.com/' } : {}) }); res.end(m);
  });
});
let n = 0; const t = async (ad, fn) => { await fn(); n++; console.log('✓', ad); };
const gizliYok = (r, s) => { const x = JSON.stringify(r); assert.ok(!x.includes(GIZLI), `${s.a}: gizli değer yanıta girdi: ${x}`); };
(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  try {
    await t('38 sağlayıcı kayıtlı, webhook dışında hepsinde kaynak var', async () => { assert.equal(ent.ozet().length, 38); ent.LISTE.filter((s) => !s.anahtarlar[0].startsWith('webhook') && !s.anahtarlar[0].startsWith('pazaryeri:')).forEach((s) => assert.ok(s.kaynak.length, s.ad)); });
    for (const s of T1) {
      satir = s; const ad = s.a;
      kip = 'ok'; const iyi = await ent.dene(ad, s.k); assert.ok(iyi.ok, `${ad}: ${iyi.hata}`); assert.ok(iyi.mesaj && iyi.parmak);
      kip = 'yetki'; const kotu = await ent.dene(ad, s.k); assert.equal(kotu.ok, false, `${ad} yetki`); gizliYok(kotu, s);
      kip = 'yavas'; if (!s.zaman) { const y = await ent.dene(ad, s.k); assert.equal(y.ok, false); assert.equal(y.kod, 'zamanasimi', `${ad}: ${y.kod} ${y.hata}`); }
      kip = 'bozuk'; if (s.bozuk !== null) { const z = await ent.dene(ad, s.k); assert.equal(z.ok, false, `${ad} bozuk: ${z.mesaj}`); }
      kip = 'sizinti'; if (s.sizinti) { const q = await ent.dene(ad, s.k); assert.equal(q.ok, false, ad); gizliYok(q, s); }
      console.log('✓', ad, 'başarı, yetki, zaman aşımı, bozuk yanıt, sızıntı'); n++;
    }
    kip = 'ok'; satir = T1[0];
    await t('Trendyol, Hepsiburada, n11 bağlayıcı üzerinden denenir', async () => {
      assert.ok(ent.bul('pazaryeri:n11').islemler['siparis-cek']);
      karsilik = () => J({ content: [], totalElements: 0 }, 401); const r = await ent.dene('pazaryeri:trendyol', { sellerId: '482913', apiKey: 'k', apiSecret: GIZLI }); karsilik = null; assert.equal(r.ok, false); assert.equal(r.kod, 'yetki'); gizliYok(r, { a: 'trendyol' });
    });
    await t('Sunucu biçim denetimi: hatalı alan sağlayıcıya gitmez', async () => { const once = gelen.length; const r = await ent.dene('sms:netgsm', { user: 'abc', pass: 'x', header: 'BASLIK' }); assert.equal(r.kod, 'bicim'); assert.equal(gelen.length, once); const r2 = await ent.dene('sms:netgsm', { user: '8501234567' }); assert.equal(r2.kod, 'bicim'); });
    await t('Bilinmeyen sağlayıcı başarı dönmez', async () => { const r = await ent.dene('sms:yok', {}); assert.equal(r.ok, false); });
    await t('Netgsm gönderim: Basic, numara 5xx, jobid gerçek yanıttan', async () => {
      karsilik = () => J({ code: '00', jobid: '173', description: 'queued' }); const s = T1[0]; const r = await ent.islem('sms:netgsm', 'gonder', s.k, { to: '905551112233', text: 'Merhaba', iys: 'ticari-bireysel' }); karsilik = null; assert.ok(r.ok, r.hata); assert.equal(r.sonuc.ref, '173');
      const g = gelen.at(-1); assert.equal(g.url, '/netgsm/sms/rest/v2/send'); assert.equal(g.h.authorization, 'Basic ' + b(`8501234567:${GIZLI}`)); const j = JSON.parse(g.govde); assert.equal(j.messages[0].no, '5551112233'); assert.equal(j.iysfilter, '11'); assert.equal(j.encoding, 'TR');
    });
    await t('SMS hatası başarı veya kuyrukta görünmez, POST tekrar edilmez', async () => {
      karsilik = () => J({ code: '40', jobid: null }); const once = gelen.length; const r = await ent.islem('sms:netgsm', 'gonder', T1[0].k, { to: '905551112233', text: 'x' }); assert.equal(r.ok, false); assert.match(r.hata, /başlığı/); assert.equal(gelen.length, once + 1);
      karsilik = () => J({ code: '00', jobid: null }); const r2 = await ent.islem('sms:netgsm', 'gonder', T1[0].k, { to: '905551112233', text: 'x' }); assert.equal(r2.ok, false); karsilik = null; // jobid yoksa gönderildi denmez
      kip = 'yavas'; const a = gelen.length; const r3 = await ent.islem('sms:netgsm', 'gonder', T1[0].k, { to: '905551112233', text: 'x' }); kip = 'ok'; assert.equal(r3.kod, 'zamanasimi'); assert.equal(gelen.length, a + 1);
    });
    await t('GET 5xx yeniden denenir, en çok istenen kadar', async () => { let c = 0; karsilik = () => { c++; return c === 1 ? T('', 503) : T('5'); }; const r = await ort.istek('X', `${process.env.ENTEGRASYON_API_BASE}/x`, { tekrar: 1 }); karsilik = null; assert.equal(r.durum, 200); assert.equal(c, 2); });
    await t('Yönlendirme izlenmez, kimlik başka adrese gitmez', async () => { karsilik = () => [302, 'text/plain', '']; const r = await ent.dene('sms:twilio', T1[3].k); karsilik = null; assert.equal(r.ok, false); assert.equal(r.kod, 'yonlendirme'); });
    await t('Verimor gönderim: datacoding, ticari alan, hata çevirisi', async () => {
      karsilik = () => T('20212'); const r = await ent.islem('sms:verimor', 'gonder', T1[2].k, { to: '905311234567', text: 'x', iys: 'ticari-tacir' }); assert.equal(r.sonuc.ref, '20212'); const j = JSON.parse(gelen.at(-1).govde); assert.equal(j.iys_recipient_type, 'TACIR'); assert.equal(j.messages[0].dest, '905311234567');
      karsilik = () => T('INSUFFICIENT_CREDITS', 400); const q = await ent.islem('sms:verimor', 'gonder', T1[2].k, { to: '905311234567', text: 'x' }); karsilik = null; assert.match(q.hata, /kredisi/);
    });
    await t('Başlık hesapta yoksa bağlantı başarılı sayılmaz', async () => { satir = T1[0]; const r = await ent.dene('sms:netgsm', { ...T1[0].k, header: 'DIGER' }); assert.equal(r.ok, false); assert.match(r.hata, /Hesaptaki başlıklar/); });
    await t('E-posta gönderimleri belgedeki başarı koduna bakar', async () => {
      karsilik = () => [202, 'text/plain', '']; assert.ok((await ent.islem('email:sendgrid', 'gonder', T1[6].k, { to: 'x@y.co', subject: 's', text: 't' })).ok); karsilik = () => T('', 200); assert.equal((await ent.islem('email:sendgrid', 'gonder', T1[6].k, { to: 'x@y.co' })).ok, false);
      karsilik = () => J({ messageId: '<1@r>' }, 201); assert.ok((await ent.islem('email:brevo', 'gonder', T1[8].k, { to: 'x@y.co', subject: 's', text: 't' })).ok); assert.equal(gelen.at(-1).h['api-key'], GIZLI);
      karsilik = () => J({ To: 'x', MessageID: 'm1', ErrorCode: 0, Message: 'OK' }); assert.ok((await ent.islem('email:postmark', 'gonder', T1[10].k, { to: 'x@y.co' })).ok);
      karsilik = () => J({ id: 'm2', message: 'Queued. Thank you.' }); const mg = await ent.islem('email:mailgun', 'gonder', T1[7].k, { to: 'x@y.co', subject: 's', text: 't' }); assert.ok(mg.ok, mg.hata); assert.match(gelen.at(-1).h['content-type'], /multipart\/form-data/); karsilik = null;
    });
    await t('Postmark sunucu belirteç listesi mesaja girmez', async () => { satir = T1[10]; const r = await ent.dene('email:postmark', T1[10].k); assert.ok(!JSON.stringify(r).includes('gizli-token')); });
    await t('PayTR imzası dokümandaki formülle: dene, bildirim', async () => {
      const k = T1[12].k; satir = T1[12]; await ent.dene('payment:paytr', k); const f = new URLSearchParams(gelen.at(-1).govde); assert.equal(f.get('dummy'), '1');
      const beklenen = crypto.createHmac('sha256', k.merchantKey).update(k.merchantId + f.get('start_date') + f.get('end_date') + k.merchantSalt).digest('base64'); assert.equal(f.get('paytr_token'), beklenen);
      const P = ent.bul('payment:paytr'); const h = crypto.createHmac('sha256', k.merchantKey).update(`S1${k.merchantSalt}success1000`).digest('base64');
      assert.ok(P.bildirimGecerli(k, { merchant_oid: 'S1', status: 'success', total_amount: '1000', hash: h })); assert.equal(P.bildirimGecerli(k, { merchant_oid: 'S1', status: 'success', total_amount: '2000', hash: h }), false);
    });
    await t('Canlı ödeme kilidi: PAYTR_CANLI olmadan gerçek para işlemi yapılmaz', async () => {
      const o = gelen.length; const r = await ent.islem('payment:paytr', 'odeme-baslat', { merchantId: '1', merchantKey: 'k', merchantSalt: 's', sandbox: false }, { siparis: 'S1', ip: '1.1.1.1', eposta: 'a@b.co', tutarKurus: 100, sepet: [['u', '1.00', 1]] }); assert.equal(r.kod, 'kilit'); assert.equal(gelen.length, o);
      assert.throws(() => kilit('PAPARA', 'Papara', false), /canlı ödeme/); kilit('PAPARA', 'Papara', true); process.env.PAPARA_CANLI = '1'; kilit('PAPARA', 'Papara', false); delete process.env.PAPARA_CANLI;
      karsilik = () => J({ status: 'success', token: 'tok9' }); const t2 = await ent.islem('payment:paytr', 'odeme-baslat', T1[12].k, { siparis: 'S1', ip: '1.1.1.1', eposta: 'a@b.co', tutarKurus: 100, sepet: [['u', '1.00', 1]], ad: 'A', adres: 'B', telefon: '5', okUrl: 'https://a/ok', hataUrl: 'https://a/no' }); karsilik = null; assert.ok(t2.ok, t2.hata); assert.equal(t2.sonuc.test, true); assert.equal(new URLSearchParams(gelen.at(-1).govde).get('test_mode'), '1');
    });
    await t('Test sonucu TEST işaretli döner', async () => { satir = T1[13]; const r = await ent.dene('payment:stripe', T1[13].k); assert.equal(r.test, true); satir = T1[14]; assert.equal((await ent.dene('payment:papara', T1[14].k)).test, true); });
    await t('Google JWT RS256 imzalı, doğru claim', async () => { satir = T1.find((x) => x.a === 'takvim:google'); await ent.dene('takvim:google', satir.k); const g = gelen.find((x, i) => i >= gelen.length - 2 && x.url.endsWith('/token')); const [h, c] = new URLSearchParams(g.govde).get('assertion').split('.'); assert.equal(JSON.parse(Buffer.from(h, 'base64url')).alg, 'RS256'); const q = JSON.parse(Buffer.from(c, 'base64url')); assert.equal(q.aud, 'https://oauth2.googleapis.com/token'); assert.equal(q.iss, 'nebsoft@proje.iam.gserviceaccount.com'); });
    await t('Zoom "me" kullanmaz, ev sahibi e-postası gider', async () => { satir = T1.find((x) => x.a === 'onlineders:zoom'); await ent.dene('onlineders:zoom', satir.k); assert.match(gelen.at(-1).url, /\/users\/a%40firma\.com$/); });
    await t('Webhook imzası gövdenin HMAC değeri, 500 başarı sayılmaz', async () => { satir = T1.at(-1); const s = T1.at(-1); await ent.dene('webhook:http', s.k); const g = gelen.at(-1); assert.equal(g.h['x-nebsoft-signature'], crypto.createHmac('sha256', GIZLI).update(g.govde).digest('hex')); karsilik = () => T('', 500); const r = await ent.dene('webhook:http', s.k); karsilik = null; assert.equal(r.ok, false); });
    await t('Parmak izi: bilgi değişince değişir, ayrıntı alanı değiştirmez, değer içermez', async () => {
      const a = ent.parmakIzi('sms:netgsm', T1[0].k); assert.notEqual(a, ent.parmakIzi('sms:netgsm', { ...T1[0].k, pass: 'baska' })); assert.equal(a.length, 64); assert.ok(!a.includes(GIZLI));
      const g = T1.find((x) => x.a === 'kargofirma:geliver').k; assert.equal(ent.parmakIzi('kargofirma:geliver', g), ent.parmakIzi('kargofirma:geliver', { ...g, senderAddressID: 'ad1' }));
    });
    await t('İlk gerçek işlem kipi: zararsız ucu olmayan sağlayıcıda deneme başarı yazmaz', async () => {
      const s = { ad: 'Örnek', anahtarlar: ['sms:ornek'], deneme: 'ilk-islem', alanlar: { key: { ad: 'A', zorunlu: true, gizli: true } }, islemler: { gonder: async () => ({ ref: '1' }) } }; ent.kaydet(s); const r = await ent.dene('sms:ornek', { key: 'a1b2' }); assert.equal(r.ok, false); assert.equal(r.ilkIslem, true); assert.ok(r.parmak); assert.ok(!/Bağlı|başarılı/.test(r.hata)); const g = await ent.islem('sms:ornek', 'gonder', { key: 'a1b2' }, {}); assert.equal(g.sonuc.ref, '1'); ent.LISTE.pop();
    });
    await t('Köprü dışı: anahtar yanıt nesnesinde dönmez', async () => { satir = T1[0]; const r = await ent.dene('sms:netgsm', T1[0].k); gizliYok(r, T1[0]); });
    await t('Eski SMS istek oluşturucu tarayıcı kodunda kalmadı, UNVERIFIED dili ekranda yok', async () => { const fs = require('fs'); const k = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'integ-wizard.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'integrations.js'), 'utf8'); assert.ok(!/doğrulanmadı — kullanılamaz|Kısmi destek|Rehber hazırlanıyor/.test(k)); });
    console.log(`\n${n} test geçti. Bu sonuç dokümana uyumu gösterir, gerçek hesapla çalıştığını kanıtlamaz.`);
  } catch (e) { console.error('✗', e.message, '| sağlayıcı:', satir && satir.a, '| kip:', kip); process.exitCode = 1; } finally { server.closeAllConnections(); server.close(); require('fs').rmSync(process.env.NEBSOFT_DATA, { recursive: true, force: true }); }
})();
