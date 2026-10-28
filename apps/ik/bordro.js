/* Türkiye ücret bordrosu hesabı — brüt/net, SGK, işsizlik, kümülatif gelir vergisi, asgari ücret istisnası,
   damga vergisi, işveren maliyeti, kıdem ve ihbar tazminatı. Parametreler Ayarlar > Bordro'dan güncellenir. */
(function (root) {
  'use strict';
  const r2 = (x) => Math.round(x * 100) / 100;

  // Varsayılanlar 2026 yılı içindir; yıl başında ve ara dönem değişikliklerinde Ayarlar'dan güncelleyin
  const DEFAULTS = {
    year: 2026,
    minGross: 33030, // asgari ücret (brüt, aylık)
    sgkEmp: 14, unempEmp: 1, // işçi payları (%)
    sgkEr: 21.75, unempEr: 2, incentive: 5, // işveren payları (%) ve hazine teşviki (puan)
    ceilingX: 9, // SGK prime esas kazanç tavanı = asgari ücretin katı
    stampPermille: 7.59, // damga vergisi (binde)
    brackets: '190000:15,400000:20,1500000:27,5300000:35,0:40', // ücret gelirleri için GV tarifesi (yıllık kümülatif üst sınır : oran)
    severanceCap: 64948.77, // kıdem tazminatı tavanı (dönemsel)
  };

  const parse = (p) => {
    const b = String(p.brackets || DEFAULTS.brackets).split(',').map((x) => x.split(':').map(Number)).map(([lim, rate]) => [lim || Infinity, rate]);
    return { ...DEFAULTS, ...p, B: b.sort((a, c) => a[0] - c[0]) };
  };
  // Kümülatif matraha göre toplam gelir vergisi
  const tax = (P, base) => {
    let t = 0, prev = 0;
    for (const [lim, rate] of P.B) { if (base <= prev) break; t += (Math.min(base, lim) - prev) * rate / 100; prev = lim; }
    return t;
  };

  /* Bir ayın bordrosu.
     o.gross: aylık brüt maaş, o.days: SGK günü (0-30), o.extra: fazla mesai vb. ek brüt,
     o.cum: yılbaşından önceki ayların GV matrahı toplamı, o.month: 1-12 (asgari ücret istisnası kümülatifi için) */
  function month(params, o) {
    const P = parse(params);
    const days = Math.max(0, Math.min(30, o.days == null ? 30 : o.days));
    const gross = r2((o.gross * days) / 30 + (o.extra || 0));
    const ceiling = P.minGross * P.ceilingX;
    const floor = (P.minGross * days) / 30;
    const sgkBase = gross > 0 ? Math.min(Math.max(gross, floor), ceiling) : 0;
    const sgk = r2(sgkBase * P.sgkEmp / 100), unemp = r2(sgkBase * P.unempEmp / 100);
    const base = r2(gross - sgk - unemp);
    const cum = o.cum || 0;
    const taxRaw = tax(P, cum + base) - tax(P, cum);
    // Asgari ücret istisnası: asgari ücretin o aya kadarki kümülatif matrahına isabet eden vergi
    const minBase = (P.minGross * (1 - (P.sgkEmp + P.unempEmp) / 100) * days) / 30;
    const minCum = P.minGross * (1 - (P.sgkEmp + P.unempEmp) / 100) * ((o.month || 1) - 1);
    const taxEx = tax(P, minCum + minBase) - tax(P, minCum);
    const incomeTax = r2(Math.max(0, taxRaw - taxEx));
    const stampRaw = gross * P.stampPermille / 1000;
    const stampEx = ((P.minGross * days) / 30) * P.stampPermille / 1000;
    const stamp = r2(Math.max(0, stampRaw - stampEx));
    const net = r2(gross - sgk - unemp - incomeTax - stamp);
    const sgkEr = r2(sgkBase * Math.max(0, P.sgkEr - P.incentive) / 100), unempEr = r2(sgkBase * P.unempEr / 100);
    return { days, gross, sgkBase: r2(sgkBase), sgk, unemp, base, incomeTax, taxEx: r2(Math.min(taxRaw, taxEx)), stamp, stampEx: r2(Math.min(stampRaw, stampEx)), net, sgkEr, unempEr, cost: r2(gross + sgkEr + unempEr), cumAfter: r2(cum + base) };
  }

  // Net anlaşmalı personel: o ayın kümülatifine göre hedef neti veren brüt maaş (tam ay, ek ödeme hariç)
  function grossFromNet(params, net, o = {}) {
    let lo = net, hi = net * 2.5;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (month(params, { ...o, gross: mid, days: 30, extra: 0 }).net < net) lo = mid; else hi = mid; }
    return r2(hi);
  }

  // Kıdem ve ihbar tazminatı (iş kanunu 4857, 1475/14)
  function severance(params, o) {
    const P = parse(params);
    const ms = new Date(o.end) - new Date(o.start);
    const years = Math.max(0, ms / (365.25 * 864e5));
    const dailyGross = o.gross / 30;
    const kidemBase = Math.min(o.gross, P.severanceCap);
    const kidem = years >= 1 ? r2(kidemBase * years) : 0;
    const kidemStamp = r2(kidem * P.stampPermille / 1000);
    const weeks = years < 0.5 ? 2 : years < 1.5 ? 4 : years < 3 ? 6 : 8;
    const ihbar = o.notice ? r2(dailyGross * weeks * 7) : 0;
    const ihbarTax = r2(tax(P, (o.cum || 0) + ihbar) - tax(P, o.cum || 0));
    const ihbarStamp = r2(ihbar * P.stampPermille / 1000);
    const leaveDays = Math.max(0, o.leaveDays || 0);
    const leavePay = r2(dailyGross * leaveDays);
    const leave = leavePay ? month(params, { gross: 0, days: 0, extra: leavePay, cum: (o.cum || 0) + ihbar, month: 12 }) : null;
    const leaveNet = leave ? leave.net : 0;
    return { years: r2(years), kidemBase: r2(kidemBase), capped: o.gross > P.severanceCap, kidem, kidemStamp, kidemNet: r2(kidem - kidemStamp), weeks, ihbar, ihbarTax, ihbarStamp, ihbarNet: r2(ihbar - ihbarTax - ihbarStamp), leaveDays, leavePay, leaveNet: r2(Math.max(0, leaveNet)) };
  }

  root.BORDRO = { DEFAULTS, month, grossFromNet, severance, tax: (p, b) => tax(parse(p), b) };
})(typeof window !== 'undefined' ? window : globalThis);
