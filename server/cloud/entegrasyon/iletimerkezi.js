// İleti Merkezi SMS istemcisi.
// Kaynak (okundu 31.10.2026, adreste v1): toplusmsapi.com/sms/gonder/json, /hesap/bakiye/json, /sms/baslik/liste/json, /durum-kodlari-ve-mesajlar  ·  resmî SDK github.com/iletimerkezi/iletimerkezi-node
// Zararsız deneme: get-balance + get-sender (kredi harcamaz). Hash panelden hazır alınır, SDK de üretmez. Hash'in üretimi dokümanda yazmıyor, tahmin edilmez. Test ortamı yok.
const { SaglayiciHata, adres, istek, jsonBekle } = require('./ortak');
const AD = 'İleti Merkezi'; const base = () => adres('iletimerkezi', 'https://api.iletimerkezi.com') + '/v1';
const HATA = { 400: 'İstek çözümlenemedi', 401: 'Üyelik bilgileri hatalı veya sabit IP dışından istek geldi', 402: 'Bakiye yetersiz', 450: 'Başlık kullanıma uygun değil, panelde yazıldığı gibi girin', 451: 'Aynı metin 10 dakika içinde aynı alıcılara gönderilmiş', 452: 'Alıcı numarası hatalı', 453: 'Mesaj çok uzun', 454: 'Mesaj metni boş', 468: 'İYS seçimi gerekli', 469: 'İYS listesi seçilmeli', 470: 'İYS kodu ayarlanmalı' };
const kim = (k) => ({ authentication: { key: k.key, hash: k.hash } });
async function cagir(k, yol, govde) {
  const r = await istek(AD, `${base()}/${yol}/json`, { yontem: 'POST', baslik: { 'Content-Type': 'application/json', Accept: 'application/json' }, govde: JSON.stringify({ request: { ...kim(k), ...govde } }) });
  const j = jsonBekle(AD, r); const s = j.response && j.response.status; if (!s) throw new SaglayiciHata('İleti Merkezi yanıtı okunamadı', { kod: 'bozuk' });
  if (Number(s.code) !== 200) throw new SaglayiciHata(HATA[s.code] || String(s.message || `İleti Merkezi hata kodu ${s.code}`), { kod: Number(s.code) === 401 ? 'yetki' : 'saglayici' });
  return j.response;
}
async function dene(k) {
  const b = (await cagir(k, 'get-balance')).balance || {}; const L = ((await cagir(k, 'get-sender')).senders || {}).sender; const liste = Array.isArray(L) ? L : L ? [L] : [];
  if (liste.length && !liste.includes(k.header)) throw new SaglayiciHata(`"${k.header}" başlığı hesapta yok. Hesaptaki başlıklar: ${liste.join(', ')}`, { kod: 'bicim' });
  return { mesaj: `İleti Merkezi hesabı doğrulandı. Kalan: ${b.sms ?? '?'} SMS kredisi.` };
}
async function gonder(k, v) {
  const ticari = /^ticari/.test(String(v.iys || ''));
  const j = await cagir(k, 'send-sms', { order: { sender: k.header, sendDateTime: [], iys: ticari ? '1' : '0', ...(ticari ? { iysList: v.iys === 'ticari-tacir' ? 'TACIR' : 'BIREYSEL' } : {}), message: { text: String(v.text || ''), receipents: { number: [String(v.to || '').replace(/\D/g, '').replace(/^90(?=5\d{9}$)/, '')] } } } });
  if (!j.order || !j.order.id) throw new SaglayiciHata('İleti Merkezi sipariş numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.order.id) };
}
module.exports = { ad: AD, anahtarlar: ['sms:iletimerkezi'], kaynak: ['https://www.toplusmsapi.com/sms/gonder/json'], deneme: 'zararsiz',
  alanlar: { key: { ad: 'API anahtarı', zorunlu: true, gizli: true }, hash: { ad: 'API hash', zorunlu: true, gizli: true }, header: { ad: 'Gönderici adı', zorunlu: true, desen: '^.{1,11}$', bicim: 'en çok 11 karakter' } },
  dene, islemler: { gonder } };
