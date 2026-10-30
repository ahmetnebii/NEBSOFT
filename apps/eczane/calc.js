/* Eczane hesapları: reçete katılım payı, muadil denetimi, karekod çözümü, parti (FEFO) düşümü. Tarayıcı ve testte aynı kod çalışır. */
(function (root) {
  'use strict';
  const r2 = (x) => Math.round(x * 100) / 100;
  const INJ = ['Enjeksiyon', 'Serum', 'Mama', 'Majistral'];

  // Reçete başına katılım — SUT değişiklik tebliği, RG 31.12.2025/33124 md. 2 (resmigazete.gov.tr/eskiler/2025/12/20251231-11.htm, yürürlük 1.1.2026)
  // ve SGK İlaç Katılım Payı sayfası (okundu 30.10.2026) — DOĞRULANDI: 3 kutuya kadar 3,76 ₺, ilave her kutu 1,25 ₺.
  // Enjektabl, serum, beslenme ürünü ve majistral kutu sayısına bakılmadan kalem başına 1 kutudur; EK-4/D muaf ilaçlar kutu hesabına girmez.
  function boxes(items) { let n = 0; items.forEach((i) => { if (i.sgk && !i.exempt) n += INJ.includes(i.form) ? 1 : i.qty; }); return n; }
  const rxFeeOf = (items, s) => { const n = boxes(items); return n ? r2((Number(s.rxFee) || 0) + Math.max(0, n - 3) * (Number(s.rxFeeExtra) || 0)) : 0; };

  // Satış: elden → tam fiyat; SGK reçetesi → katılım payı (%10 gelir/aylık alan ve bakmakla yükümlü olunan, %20 diğer — SGK sayfası) + eşdeğer fark + reçete katılımı, kalanı kurum.
  // Eski hesapta fark ücreti toplama girmiyordu (hasta + kurum ≠ toplam). Toplam artık hasta + kurum'a kuruşu kuruşuna eşittir.
  function calc(c, s) {
    let drug = 0, diff = 0, patient = 0; const rec = c.mode === 'recete'; const sgk = rec && c.inst === 'sgk'; const oz = rec && c.inst === 'ozel';
    const pct = (c.retired ? Number(s.retiredPct) : Number(s.patientPct)) / 100; const opct = (s.privatePct === undefined || s.privatePct === '' ? 10 : Number(s.privatePct)) / 100;
    c.items.forEach((i) => {
      const line = i.price * i.qty; drug += line;
      if (sgk && i.sgk) { const d = (i.diff || 0) * i.qty; diff += d; patient += (i.exempt ? 0 : line * pct) + d; }
      else if (oz) patient += line * opct;
      else patient += line;
    });
    const rxFee = sgk ? rxFeeOf(c.items, s) : 0;
    const total = r2(drug + diff + rxFee), patientPay = r2(patient + rxFee);
    return { total, patientPay, instPay: r2(total - patientPay), rxFee, diffPay: r2(diff) };
  }

  // Muadil: aynı etken madde + aynı form + aynı doz. Etken maddeye bakmak 20 mg yerine 40 mg önermeye yol açıyordu (hasta güvenliği).
  const strengthOf = (d) => { if (d.strength) return String(d.strength).toLowerCase().replace(/\s/g, '').replace(',', '.'); const m = /(\d+(?:[.,]\d+)?)\s*(mcg|µg|mg|iu|ml|g)(?![a-zçğıöşü])/i.exec(String(d.name || '')); return m ? `${m[1].replace(',', '.')}${m[2].toLowerCase()}` : ''; };
  const sameDrug = (a, b) => !!a.active && a.active !== '-' && a.id !== b.id && a.active === b.active && a.form === b.form && !!strengthOf(a) && strengthOf(a) === strengthOf(b);

  // GS1 karekod: (01) GTIN 14 hane, (17) SKT YYAAGG, (10) parti, (21) seri (gs1.org GS1 DataMatrix Guideline — DOĞRULANDI: alan yapısı).
  // Değişken alanlar GS (0x1D) ile biter. Okuyucu GS'i atlarsa seri ile SKT arası "17 + 6 hane" kalıbından ayrılır. İTS'e özel kural DOĞRULANAMADI.
  function parseCode(raw) {
    let s = String(raw || '').trim().replace(/^\]d2/i, '').replace(/^\]Q3/i, ''); const out = {};
    if (s.includes('(')) { const re = /\((\d\d)\)([^(]*)/g; let m; while ((m = re.exec(s))) out[m[1]] = m[2]; }
    else {
      if (!/^01\d{14}/.test(s)) return null; let i = 0; const GS = '\u001d'; const noGs = !s.includes(GS);
      while (i < s.length) {
        const ai = s.slice(i, i + 2); i += 2;
        if (ai === '01') { out['01'] = s.slice(i, i + 14); i += 14; } else if (ai === '17') { out['17'] = s.slice(i, i + 6); i += 6; }
        else if (ai === '10' || ai === '21') {
          let e = s.indexOf(GS, i);
          if (e < 0 && noGs && ai === '21') { const m = /17\d{6}(10|$)/.exec(s.slice(i + 1)); e = m ? i + 1 + m.index : s.length; }
          if (e < 0) e = s.length; out[ai] = s.slice(i, e); i = e;
        } else return null;
        if (s[i] === GS) i++;
      }
    }
    if (!out['01'] || !/^\d{14}$/.test(out['01'])) return null;
    let exp = ''; if (/^\d{6}$/.test(out['17'] || '')) { const y = 2000 + Number(out['17'].slice(0, 2)), m = Number(out['17'].slice(2, 4)); let d = Number(out['17'].slice(4)); if (!d) d = new Date(y, m, 0).getDate(); exp = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
    return { gtin: out['01'], sn: out['21'] || '', lot: out['10'] || '', exp };
  }
  const gtinMatch = (bar, gtin) => { const b = String(bar || ''); return !!b && (b === gtin || b === gtin.replace(/^0+/, '') || b.padStart(14, '0') === gtin); };

  // Parti düşümü: önce okutulan parti, sonra son kullanma tarihi en yakın (FEFO); SKT'si geçmiş parti satılmaz.
  function takeLots(lots, need, today, prefer) {
    const ok = lots.filter((l) => l.qty > 0 && l.skt >= today).sort((a, b) => (b.lot === prefer) - (a.lot === prefer) || a.skt.localeCompare(b.skt)); const out = []; let n = need;
    ok.forEach((l) => { if (n <= 0) return; const t = Math.min(n, l.qty); out.push({ id: l.id, qty: t }); n -= t; });
    return { taken: out, short: n };
  }
  const tcOk = (v) => { const s = String(v || '').trim(); if (!/^[1-9]\d{10}$/.test(s)) return false; const d = [...s].map(Number); const odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7]; return ((odd * 7 - even) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]; };

  root.ECZ = { r2, calc, boxes, rxFeeOf, strengthOf, sameDrug, parseCode, gtinMatch, takeLots, tcOk };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ECZ;
})(typeof window !== 'undefined' ? window : globalThis);
