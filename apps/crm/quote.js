/* CRM teklif hesapları ve durumları — panel (app.js) ve müşteri onay sayfası (teklif.html) kullanır */
window.CRMQ = {
  STATUS: { gonderildi: ['Yanıt bekleniyor', 'warn'], kabul: ['Kabul edildi', 'ok'], red: ['Reddedildi', 'err'], revize: ['Revize edildi', ''], suresi: ['Süresi doldu', ''] },
  // Eski kayıtlarda KDV ve durum alanı yoktur: KDV hariç toplam korunur, oran %20 varsayılır
  calc(q) {
    const gross = (q.lines || []).reduce((t, l) => t + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    const disc = gross * (Number(q.disc) || 0) / 100;
    const net = Math.round((gross - disc) * 100) / 100;
    const vat = q.vat === undefined ? 20 : Number(q.vat) || 0;
    const vatAmt = Math.round(net * vat * 100) / 10000;
    return { gross, disc, net, vat, vatAmt, grand: Math.round((net + vatAmt) * 100) / 100 };
  },
  status(q) {
    const s = q.status || 'gonderildi';
    if (s === 'gonderildi' && q.valid && q.valid < new Date().toISOString().slice(0, 10)) return 'suresi';
    return s;
  },
  token() { return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); },
};
