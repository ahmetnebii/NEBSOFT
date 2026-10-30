/* Türkiye ücret bordrosu hesabı — brüt/net, SGK, işsizlik, kümülatif gelir vergisi, asgari ücret istisnası,
   damga vergisi, işveren maliyeti, kıdem ve ihbar tazminatı. Parametreler Ayarlar > Bordro'dan güncellenir. */
(function (root) {
  'use strict';
  const r2 = (x) => Math.round(x * 100) / 100;

  // Varsayılanlar 2026 yılı içindir; yıl başında ve ara dönem değişikliklerinde Ayarlar'dan güncelleyin.
  // Doğrulama (30.10.2026) — hepsi DOĞRULANDI:
  // asgari ücret günlük 1.101 ₺ (RG 26.12.2025/33119, ACT Kararı 2025/1) × 30 = 33.030 ₺; SGK işçi %14, işsizlik işçi %1, işveren %21,75 + işsizlik %2,
  // prim indirimi imalat 5 / diğer 2 puan (csgb.gov.tr/poco-pages/asgari-ucret/, 01/01–31/12/2026); SGK tavanı 9 kat (5510 md. 82, mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm);
  // ücret GV tarifesi (Gelir Vergisi Genel Tebliği Seri No 332, RG 31.12.2025/33124 5. Mük., md. 3/3); damga binde 7,59 (488 s.K. (1) s. tablo IV-1-b, mevzuat.gov.tr/mevzuatmetin/1.5.488.htm);
  // kıdem tavanı 73.729,87 ₺ — 01.07.2026 itibarıyla (csgb.gov.tr kıdem tazminatı tavan tablosu, Temmuz 2026). Tavan her 6 ayda değişir.
  const DEFAULTS = {
    year: 2026,
    minGross: 33030, // asgari ücret (brüt, aylık)
    sgkEmp: 14, unempEmp: 1, // işçi payları (%)
    sgkEr: 21.75, unempEr: 2, incentive: 2, // işveren payları (%) ve prim indirimi (puan): imalat sektörü 5, diğer sektörler 2
    ceilingX: 9, // SGK prime esas kazanç tavanı = asgari ücretin katı
    stampPermille: 7.59, // damga vergisi (binde)
    brackets: '190000:15,400000:20,1500000:27,5300000:35,0:40', // ücret gelirleri için GV tarifesi (yıllık kümülatif üst sınır : oran)
    severanceCap: 73729.87, // kıdem tazminatı tavanı (01.07.2026; 6 ayda bir değişir)
    severanceAt: '2026-07-01',
  };

  // Aynı parametre nesnesi yeniden çözümlenmez (binlerce personelde her ay yüzlerce kez çağrılır)
  const parsed = new WeakMap();
  const parse = (p) => {
    if (parsed.has(p)) return parsed.get(p);
    const b = String(p.brackets || DEFAULTS.brackets).split(',').map((x) => x.split(':').map(Number)).map(([lim, rate]) => [lim || Infinity, rate]);
    const r = { ...DEFAULTS, ...p, B: b.sort((a, c) => a[0] - c[0]) }; parsed.set(p, r); return r;
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

  // Takvimle süre: yıldönümü günü yıl dolmuş sayılır (365,25'e bölmek tam 1. yıl gününde kıdemi sıfırlıyordu)
  const ymd = (s) => String(s).slice(0, 10).split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const fullMonths = (a, b) => { const [y1, m1, d1] = ymd(a), [y2, m2, d2] = ymd(b); return Math.max(0, (y2 - y1) * 12 + m2 - m1 - (d2 < d1 ? 1 : 0)); };
  const fullYears = (a, b) => Math.floor(fullMonths(a, b) / 12);
  const addYears = (s, n) => { const [y, m, d] = ymd(s); return `${y + n}-${pad(m)}-${pad(d)}`; };

  // Yıllık izin hakkı — 4857 md. 53 (mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm, okundu 30.10.2026 — DOĞRULANDI):
  // en az 1 yıl; 1–5 yıl (5 dahil) 14, 5'ten fazla 15'ten az 20, 15 ve üstü 26 gün; 18 yaş ve altı ile 50 yaş ve üstü en az 20 gün;
  // yer altı işlerinde +4 gün. Sözleşmeyle artırılabilir (e.leaveExtra). Hak, her yıldönümünde o tarihteki kıdem ve yaşla doğar.
  function entitlementAt(e, date) {
    const y = fullYears(e.start, date); if (y < 1) return 0;
    let d = y <= 5 ? 14 : y < 15 ? 20 : 26;
    if (e.birth) { const a = fullYears(e.birth, date); if (a <= 18 || a >= 50) d = Math.max(d, 20); }
    if (e.underground) d += 4;
    return d + (Number(e.leaveExtra) || 0);
  }
  // İzin bakiyesi: kullanılmayan izin yanmaz (md. 54, 59). Geçmişi programda olmayan yıllar sayılmaz: takip başlangıcından
  // (trackFrom: ilk puantaj günü) önceki yıldönümleri yerine son yıldönümü hakkı + elle girilen devir (e.leaveCarry) esas alınır.
  function leaveBalance(e, { asOf, used = 0, trackFrom } = {}) {
    const end = e.end && e.end < asOf ? e.end : asOf; const y = fullYears(e.start, end); let earned = 0;
    for (let k = 1; k <= y; k++) { const d = addYears(e.start, k); if (k === y || !trackFrom || d >= trackFrom) earned += entitlementAt(e, d); }
    const carry = Number(e.leaveCarry) || 0;
    return { earned, carry, used, left: earned + carry - used, yearly: entitlementAt(e, end), next: addYears(e.start, y + 1), years: y };
  }

  // Kıdem ve ihbar tazminatı (4857 md. 17: 6 ay / 1,5 yıl / 3 yıl — 2, 4, 6, 8 hafta; 1475 md. 14: her tam yıl 30 günlük, artan süre orantılı)
  function severance(params, o) {
    const P = parse(params);
    const full = fullYears(o.start, o.end);
    const years = full + Math.max(0, (Date.parse(String(o.end).slice(0, 10)) - Date.parse(addYears(o.start, full))) / 864e5) / 365;
    const dailyGross = o.gross / 30;
    const kidemBase = Math.min(o.gross, P.severanceCap);
    const kidem = years >= 1 ? r2(kidemBase * years) : 0;
    const kidemStamp = r2(kidem * P.stampPermille / 1000);
    const mo = fullMonths(o.start, o.end); const weeks = mo < 6 ? 2 : mo < 18 ? 4 : mo < 36 ? 6 : 8;
    const ihbar = o.notice ? r2(dailyGross * weeks * 7) : 0;
    const ihbarTax = r2(tax(P, (o.cum || 0) + ihbar) - tax(P, o.cum || 0));
    const ihbarStamp = r2(ihbar * P.stampPermille / 1000);
    const leaveDays = Math.max(0, o.leaveDays || 0);
    const leavePay = r2(dailyGross * leaveDays);
    const leave = leavePay ? month(params, { gross: 0, days: 0, extra: leavePay, cum: (o.cum || 0) + ihbar, month: 12 }) : null;
    const leaveNet = leave ? leave.net : 0;
    return { years: r2(years), kidemBase: r2(kidemBase), capped: o.gross > P.severanceCap, kidem, kidemStamp, kidemNet: r2(kidem - kidemStamp), weeks, ihbar, ihbarTax, ihbarStamp, ihbarNet: r2(ihbar - ihbarTax - ihbarStamp), leaveDays, leavePay, leaveNet: r2(Math.max(0, leaveNet)) };
  }

  // Kimlik ve IBAN biçim denetimi: yanlış yazımı yakalar, kaydın gerçekliğini göstermez
  const tcOk = (v) => { const s = String(v || '').trim(); if (!/^[1-9]\d{10}$/.test(s)) return false; const d = [...s].map(Number); const odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7]; return ((odd * 7 - even) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]; };
  const ibanOk = (v) => { const s = String(v || '').replace(/\s/g, '').toUpperCase(); if (!/^TR\d{24}$/.test(s)) return false; const t = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55); let m = 0; for (const ch of t) m = (m * 10 + Number(ch)) % 97; return m === 1; };
  root.BORDRO = { DEFAULTS, month, grossFromNet, severance, fullYears, fullMonths, addYears, entitlementAt, leaveBalance, tcOk, ibanOk, tax: (p, b) => tax(parse(p), b) };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BORDRO;
})(typeof window !== 'undefined' ? window : globalThis);
