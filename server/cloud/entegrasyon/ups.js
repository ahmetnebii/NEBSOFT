// UPS istemcisi: OAuth client credentials + takip + gönderi iptali.
// Kaynak (okundu 31.10.2026, dosyalarda info.version boş): github.com/UPS-API/api-documentation (OAuthClientCredentials.yaml, Tracking.yaml, Shipping.yaml)
// Zararsız deneme: jeton alma (kargo oluşturmaz). Gönderi oluşturma yazılmadı: Türkiye hesabı için servis ve birim kuralları bu dosyalarda yok.
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic, form } = require('./ortak');
const AD = 'UPS'; const base = (k) => (k.test ? adres('ups-test', 'https://wwwcie.ups.com') : adres('ups', 'https://onlinetools.ups.com'));
const iz = () => ({ transId: crypto.randomBytes(12).toString('hex'), transactionSrc: 'NEBSOFT' });
const ilk = (r) => { const e = r.json && r.json.response && r.json.response.errors; return e && e[0] ? e[0].message : ''; };
async function jeton(k) {
  const r = await istek(AD, `${base(k)}/security/v1/oauth/token`, { yontem: 'POST', baslik: { Authorization: basic(k.clientId, k.clientSecret), 'Content-Type': 'application/x-www-form-urlencoded', ...(k.accountNo ? { 'x-merchant-id': k.accountNo } : {}) }, govde: form({ grant_type: 'client_credentials' }) });
  if (!r.ok) throw durumHata(AD, r.durum === 400 ? { ...r, durum: 401 } : r, ilk(r)); const j = jsonBekle(AD, r); if (!j.access_token) throw new SaglayiciHata('UPS erişim jetonu vermedi', { kod: 'bozuk' }); return j.access_token;
}
async function dene(k) { await jeton(k); return { mesaj: 'UPS uygulama bilgileri doğrulandı.', test: !!k.test }; }
async function takip(k, v) {
  const no = String(v.tracking || ''); if (!/^[A-Za-z0-9]{7,34}$/.test(no)) throw new SaglayiciHata('Takip numarası geçersiz', { kod: 'bicim' }); const t = await jeton(k);
  const r = await istek(AD, `${base(k)}/api/track/v1/details/${no}?locale=tr_TR&returnSignature=false&returnMilestones=false&returnPOD=false`, { baslik: { Authorization: `Bearer ${t}`, ...iz() }, tekrar: 1 }); if (!r.ok) throw durumHata(AD, r, ilk(r)); return jsonBekle(AD, r);
}
async function iptal(k, v) {
  const t = await jeton(k); const r = await istek(AD, `${base(k)}/api/shipments/v2409/void/cancel/${encodeURIComponent(String(v.id || ''))}`, { yontem: 'DELETE', baslik: { Authorization: `Bearer ${t}`, ...iz() } }); if (!r.ok) throw durumHata(AD, r, ilk(r)); return { ref: String(v.id) };
}
module.exports = { ad: AD, anahtarlar: ['kargofirma:ups'], kaynak: ['https://github.com/UPS-API/api-documentation'], deneme: 'zararsiz',
  alanlar: { clientId: { ad: 'Client ID', zorunlu: true, gizli: true }, clientSecret: { ad: 'Client Secret', zorunlu: true, gizli: true }, accountNo: { ad: 'UPS hesap no', desen: '^[A-Za-z0-9]{6}$', bicim: '6 karakter' }, test: { ad: 'Test ortamı (CIE)', tur: 'onay' } },
  dene, islemler: { 'durum-sorgu': takip, iptal } };
