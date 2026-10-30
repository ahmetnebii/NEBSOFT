// PayTR iFrame API istemcisi. Kart bilgisi PayTR sayfasına girilir, bu sunucudan geçmez.
// Kaynak (okundu 31.10.2026, dokümanda sürüm yok): dev.paytr.com/iframe-api/iframe-api-1-adim, /iframe-api/iframe-api-2-adim, /durum-sorgu, /iade-api, /islem-dokumu, /hata-kodlari
// İmza: base64(HMAC-SHA256(merchant_key, metin + merchant_salt)). Test ve canlı aynı adrestir, test test_mode=1 ile yapılır.
// Zararsız deneme: rapor/islem-dokumu dummy=1 (sahte veri). Bildirim yanıtı düz metin "OK" olmalıdır. Canlı kilit PAYTR_CANLI.
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, form } = require('./ortak');
const { kilit } = require('./odeme-kilit');
const AD = 'PayTR'; const base = () => adres('paytr', 'https://www.paytr.com');
const imza = (k, metin) => crypto.createHmac('sha256', k.merchantKey).update(metin + k.merchantSalt).digest('base64');
const post = async (yol, v) => jsonBekle(AD, await istek(AD, `${base()}${yol}`, { yontem: 'POST', baslik: { 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form(v) }));
const tarih = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');
async function dene(k) {
  const a = tarih(Date.now() - 864e5); const b = tarih(Date.now());
  const j = await post('/rapor/islem-dokumu', { merchant_id: k.merchantId, start_date: a, end_date: b, dummy: 1, paytr_token: imza(k, k.merchantId + a + b) });
  if (j.status === 'error' || (j.err_msg && /token|imza|magaza|mağaza/i.test(j.err_msg))) throw new SaglayiciHata(`PayTR bilgileri kabul etmedi. ${String(j.err_msg || '').slice(0, 160)}`, { kod: 'yetki' });
  if (j.status !== 'success' && j.status !== 'failed') throw new SaglayiciHata('PayTR yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `PayTR mağaza bilgileri doğrulandı.${k.sandbox ? '' : ' Canlı ödeme için sunucu kilidi ayrıca açılmalı.'}`, test: !!k.sandbox };
}
// Ödeme başlatır: dönen token iFrame adresine verilir. Tutar kuruş olarak gelir
async function baslat(k, v) {
  const test = k.sandbox ? '1' : '0'; kilit('PAYTR', AD, !!k.sandbox);
  const sepet = Buffer.from(JSON.stringify(v.sepet)).toString('base64'); const taksitsiz = v.taksitsiz ? '1' : '0'; const enCok = String(v.enCokTaksit ?? 0); const para = 'TL';
  const h = k.merchantId + v.ip + v.siparis + v.eposta + v.tutarKurus + sepet + taksitsiz + enCok + para + test;
  const j = await post('/odeme/api/get-token', { merchant_id: k.merchantId, user_ip: v.ip, merchant_oid: v.siparis, email: v.eposta, payment_amount: v.tutarKurus, user_basket: sepet, no_installment: taksitsiz, max_installment: enCok, paytr_token: imza(k, h), user_name: v.ad, user_address: v.adres, user_phone: v.telefon, merchant_ok_url: v.okUrl, merchant_fail_url: v.hataUrl, currency: para, test_mode: test, debug_on: 0, lang: 'tr' });
  if (j.status !== 'success' || !j.token) throw new SaglayiciHata(String(j.reason || 'PayTR ödeme başlatamadı').slice(0, 200));
  return { token: String(j.token), url: `https://www.paytr.com/odeme/guvenli/${j.token}`, test: !!k.sandbox };
}
// Bildirim doğrulama: imza tutmadan sipariş ödenmiş sayılmaz. Sabit zamanlı karşılaştırılır
function bildirimGecerli(k, b) { const x = Buffer.from(crypto.createHmac('sha256', k.merchantKey).update(`${b.merchant_oid}${k.merchantSalt}${b.status}${b.total_amount}`).digest('base64')); const y = Buffer.from(String(b.hash || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); }
async function sorgu(k, v) {
  const j = await post('/odeme/durum-sorgu', { merchant_id: k.merchantId, merchant_oid: v.siparis, paytr_token: imza(k, k.merchantId + v.siparis) });
  if (j.status !== 'success') throw new SaglayiciHata(String(j.err_msg || 'PayTR sorgusu başarısız').slice(0, 200)); return j;
}
async function iade(k, v) {
  const tutar = Number(v.tutar).toFixed(2); kilit('PAYTR', AD, !!k.sandbox);
  const j = await post('/odeme/iade', { merchant_id: k.merchantId, merchant_oid: v.siparis, return_amount: tutar, paytr_token: imza(k, k.merchantId + v.siparis + tutar) });
  if (j.status !== 'success') throw new SaglayiciHata(String(j.err_msg || 'PayTR iadesi yapılamadı').slice(0, 200)); return { ref: String(j.reference_no || v.siparis), test: j.is_test === 1 };
}
module.exports = { ad: AD, anahtarlar: ['payment:paytr'], kaynak: ['https://dev.paytr.com/iframe-api/iframe-api-1-adim'], deneme: 'zararsiz', bildirimGecerli,
  alanlar: { merchantId: { ad: 'Mağaza no', zorunlu: true, desen: '^\\d{1,12}$' }, merchantKey: { ad: 'Mağaza parola', zorunlu: true, gizli: true }, merchantSalt: { ad: 'Mağaza gizli anahtar', zorunlu: true, gizli: true }, sandbox: { ad: 'Test modu', tur: 'onay' } },
  dene, islemler: { 'odeme-baslat': baslat, 'odeme-sorgu': sorgu, iade } };
