// Vitrin ödemesinin sağlayıcı katmanı. eticaret-odeme.js sipariş kurallarını yürütür, buradaki her kayıt tek sağlayıcının farkını taşır:
//   baslat(a, o, b) → { token, url } veya { token, iframe, oid }   sonuc(a, o) → { durum, bilgi, neden }   iade(a, o, tutar, tam) → { ref, tur }
// durum: odendi | inceleme | bekliyor | basarisiz | reddedildi | uyusmazlik. Tutar, sipariş ve para birimi tutmadan odendi dönmez.
const iyz = require('./iyzico');
const ent = require('./entegrasyon');
const { SaglayiciHata } = require('./entegrasyon/ortak');
const kurus = (n) => Math.round(Number(String(n ?? '').replace(',', '.')) * 100);
const isl = (ad, is) => ent.bul(`payment:${ad}`).islemler[is];
const fiyat = (n) => Number(n).toFixed(2);
const etiket = (o) => o.etiket || `Sipariş ${o.no}`; // borç tahsilatı (tahsilat-odeme.js) sipariş biçimiyle gelir

const iyzico = {
  ad: 'iyzico', tc: true,
  async baslat(a, o, b) {
    const adr = { contactName: b.adSoyad, city: String(o.ship.city), country: 'Turkey', address: String(o.ship.address) }; const f = fiyat(o.total);
    const r = await iyz.formBaslat(a, {
      locale: 'tr', conversationId: o.id, price: f, paidPrice: f, currency: 'TRY', basketId: o.id, paymentGroup: 'PRODUCT', callbackUrl: `${b.geri}/api/odeme/iyzico/donus/${b.slug}/${o.id}`,
      buyer: { id: String(o.customer), name: b.ad, surname: b.soyad, identityNumber: b.tc, email: b.eposta, gsmNumber: b.gsm, registrationAddress: adr.address, ip: b.ip, city: adr.city, country: 'Turkey' },
      shippingAddress: adr, billingAddress: adr,
      basketItems: [{ id: String(o.no), name: etiket(o), category1: o.sanal ? 'Hizmet' : 'Sipariş', itemType: o.sanal ? 'VIRTUAL' : 'PHYSICAL', price: f }], // tek kalem: kupon ve kargo kuruş farkı çıkarmaz, kısmi iade tek işlemden düşer
    });
    return { token: r.token, url: r.url };
  },
  sonuc: async (a, o) => iyz.karar(o, await iyz.formSonuc(a, o.payment.token, o.id), a.secret, o.payment.token),
  async iade(a, o, tutar, tam) { const r = await (tam ? iyz.iptal(a, o.payment, o.id) : iyz.iade(a, { txId: o.payment.txId, tutar }, o.id)); return { ref: r.ref, tur: tam ? 'iptal' : 'iade' }; },
};

const paytr = {
  ad: 'PayTR', tc: false, iframe: true,
  // merchant_oid alfanümerik ve her denemede benzersiz olmalı: sipariş kimliği + NEB + zaman. Bildirimde sipariş buradan bulunur
  oid: (id) => `${String(id).replace(/[^a-zA-Z0-9]/g, '')}NEB${Date.now().toString(36)}`,
  siparisOf: (oid) => { const s = String(oid); const i = s.lastIndexOf('NEB'); return i > 0 ? s.slice(0, i) : ''; },
  async baslat(a, o, b) {
    const oid = paytr.oid(o.id); const r = await isl('paytr', 'odeme-baslat')(a, { siparis: oid, ip: b.ip, eposta: b.eposta, tutarKurus: kurus(o.total), sepet: [[etiket(o), fiyat(o.total), 1]], enCokTaksit: 0, ad: b.adSoyad.slice(0, 60), adres: String(o.ship.address).slice(0, 400), telefon: String(o.ship.phone).slice(0, 20), okUrl: b.donus, hataUrl: b.donus });
    return { token: r.token, iframe: r.url, oid };
  },
  // Tek sonuç nesnesi: bildirim ve durum sorgusu aynı karara gider
  karar(o, s) {
    if (kurus(s.payment_amount) !== kurus(o.total) || kurus(s.payment_total ?? s.payment_amount) < kurus(o.total)) return { durum: 'uyusmazlik', neden: 'Ödenen tutar sipariş tutarıyla uyuşmuyor' };
    if (String(s.test_mode || 0) === '1' && !o.payment.test) return { durum: 'uyusmazlik', neden: 'Test ödemesi canlı siparişe geldi' };
    return { durum: 'odendi', bilgi: { paymentId: String(o.payment.oid), paid: Number(String(s.payment_total ?? s.payment_amount).replace(',', '.')), installment: Number(s.taksit) || 1, last4: String(s.masked_pan || '').slice(-4), card: String(s.kart_marka || '').slice(0, 30) } };
  },
  async sonuc(a, o) { try { return paytr.karar(o, await isl('paytr', 'odeme-sorgu')(a, { siparis: o.payment.oid })); } catch (e) { if (e instanceof SaglayiciHata && e.kod === 'bulunamadi') return { durum: 'bekliyor' }; throw e; } },
  async iade(a, o, tutar) { const r = await isl('paytr', 'iade')(a, { siparis: o.payment.oid, tutar }); return { ref: r.ref, tur: 'iade' }; },
};

const papara = {
  ad: 'Papara', tc: false,
  async baslat(a, o, b) {
    const r = await isl('papara', 'odeme-baslat')(a, { tutar: fiyat(o.total), siparis: o.id, aciklama: etiket(o), bildirimUrl: `${b.geri}/api/odeme/bildirim/papara/${b.slug}/${o.id}`, okUrl: b.donusSunucu });
    return { token: r.id, url: r.url };
  },
  // Yönlendirme parametrelerine güvenilmez: sonuç Papara'dan sorgulanır
  async sonuc(a, o) {
    const d = await isl('papara', 'odeme-sorgu')(a, { id: o.payment.token });
    if (String(d.referenceId) !== String(o.id)) return { durum: 'uyusmazlik', neden: 'Ödeme bu siparişe ait değil' };
    if (Number(d.status) === 0) return { durum: 'bekliyor' };
    if (Number(d.status) !== 1) return { durum: 'uyusmazlik', neden: 'Ödeme iade edilmiş görünüyor' };
    if (kurus(d.amount) !== kurus(o.total)) return { durum: 'uyusmazlik', neden: 'Ödenen tutar sipariş tutarıyla uyuşmuyor' };
    return { durum: 'odendi', bilgi: { paymentId: String(d.id), paid: Number(d.amount), installment: 1, card: 'Papara' } };
  },
  async iade(a, o, tutar) { const r = await isl('papara', 'iade')(a, { id: o.payment.paymentId, tutar }); return { ref: r.ref, tur: 'iade' }; },
};

const paynet = {
  ad: 'Paynet', tc: false, iadeYok: 'Paynet iadesi Paynet panelinden talep edilir, operasyon ekibi onaylar',
  async baslat(a, o, b) {
    const r = await isl('paynet', 'odeme-baslat')(a, { adSoyad: b.adSoyad, tutar: fiyat(o.total), eposta: b.eposta, telefon: b.gsm, referans: o.id, okUrl: b.donusSunucu, hataUrl: b.donusSunucu, bildirimUrl: `${b.geri}/api/odeme/bildirim/paynet/${b.slug}/${o.id}` });
    return { token: o.id, url: r.url };
  },
  async sonuc(a, o) {
    const d = await isl('paynet', 'odeme-sorgu')(a, { referans: o.id }); if (!d.is_succeed) return { durum: 'bekliyor', neden: String(d.message || '').slice(0, 200) };
    if (kurus(d.amount) !== kurus(o.total)) return { durum: 'uyusmazlik', neden: 'Ödenen tutar sipariş tutarıyla uyuşmuyor' };
    return { durum: 'odendi', bilgi: { paymentId: String(d.xact_id || o.id), paid: Number(d.amount), installment: Number(d.instalment) || 1 } };
  },
};

const craftgate = {
  ad: 'Craftgate', tc: false,
  async baslat(a, o, b) { const r = await isl('craftgate', 'odeme-baslat')(a, { tutar: fiyat(o.total), siparis: o.id, donus: `${b.geri}/api/odeme/donus/${b.slug}/${o.id}` }); return { token: r.token, url: r.url }; },
  async sonuc(a, o) {
    const d = await isl('craftgate', 'odeme-sorgu')(a, { token: o.payment.token });
    if (d.paymentStatus === 'FAILURE') return { durum: 'basarisiz' }; if (d.paymentStatus !== 'SUCCESS') return { durum: 'bekliyor' };
    if (d.conversationId && d.conversationId !== o.id) return { durum: 'uyusmazlik', neden: 'Ödeme bu siparişe ait değil' };
    if (kurus(d.price) !== kurus(o.total) || kurus(d.paidPrice) < kurus(o.total)) return { durum: 'uyusmazlik', neden: 'Ödenen tutar sipariş tutarıyla uyuşmuyor' };
    return { durum: 'odendi', bilgi: { paymentId: String(d.id), paid: Number(d.paidPrice), installment: Number(d.installment) || 1, last4: String(d.cardLastFour || '').slice(-4), card: String(d.cardAssociation || '').slice(0, 30) } };
  },
  async iade(a, o, tutar, tam) { if (kurus(tutar) !== kurus(o.total)) throw new SaglayiciHata('Craftgate iadesi bu sürümde yalnız tam tutar yapılır'); const r = await isl('craftgate', 'iade')(a, { id: o.payment.paymentId }); return { ref: r.ref, tur: tam ? 'iptal' : 'iade' }; },
};

const TUM = { iyzico, paytr, papara, paynet, craftgate };
module.exports = { TUM, paytr, kurus };
