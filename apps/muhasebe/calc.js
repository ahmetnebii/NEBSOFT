/* NEBSOFT Ön Muhasebe — tutar hesabı (tarayıcı + Node, bağımlılıksız)
   Tek kural: her satır kendi içinde kuruşa yuvarlanır (matrah = miktar × fiyat × (1 − iskonto), KDV = matrah × oran),
   toplamlar yuvarlanmış satırların toplamıdır. core/ubltr.js e-Fatura'yı aynı kuralla üretir; böylece program, PDF ve
   giden e-Fatura kuruşu kuruşuna aynı tutarı gösterir (server/test/muhasebe-calc.test.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.MUHCALC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const r2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
  // Satır: { qty, price (KDV hariç), disc (%), vat (%), wht (tevkifat payı, ör. 5 → 5/10) }
  function line(l) {
    const gross = r2((Number(l.qty) || 0) * (Number(l.price) || 0));
    const net = r2((Number(l.qty) || 0) * (Number(l.price) || 0) * (1 - (Number(l.disc) || 0) / 100));
    const vat = r2(net * (Number(l.vat) || 0) / 100);
    const wht = l.wht ? r2(vat * Number(l.wht) / 10) : 0; // KDV tevkifatı: alıcının ödeyeceği KDV payı (x/10)
    return { gross, disc: r2(gross - net), net, vat, wht };
  }
  function totals(inv) {
    let gross = 0, disc = 0, net = 0, vat = 0, wht = 0; const vatBy = {};
    const lines = (inv.lines || []).map((l) => { const c = line(l); gross += c.gross; disc += c.disc; net += c.net; vat += c.vat; wht += c.wht; vatBy[l.vat] = r2((vatBy[l.vat] || 0) + c.vat); return c; });
    const total = r2(net + vat); const payable = r2(total - wht); const rate = Number(inv.rate) || 1;
    // tl: cari bakiyeye işlenen tutar (tevkifat varsa alıcının satıcıya ödeyeceği tutar)
    return { gross: r2(gross), disc: r2(disc), net: r2(net), vat: r2(vat), wht: r2(wht), total, payable, tl: r2(payable * rate), vatBy, lines, cur: inv.currency || 'TRY' };
  }
  return { r2, line, totals };
});
