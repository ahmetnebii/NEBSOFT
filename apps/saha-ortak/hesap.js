/* NEBSOFT saha hizmeti ortak hesabı (Nakliyat, Temizlik, Usta, Peyzaj): tarayıcı ve sunucu aynı kodu kullanır, DOM ve ağ yoktur.
   Tarihler 'YYYY-AA-GG' metnidir; hesap UTC ile yapılır, saat dilimi günü kaydırmaz. Tutarlar kuruşa yuvarlanır. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.SAHA_HESAP = f(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const gun = (s) => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
  const metin = (d) => d.toISOString().slice(0, 10);
  const ekle = (s, n) => { const d = gun(s); d.setUTCDate(d.getUTCDate() + n); return metin(d); };
  const haftaGunu = (s) => { const w = gun(s).getUTCDay(); return w === 0 ? 7 : w; }; // 1 Pazartesi … 7 Pazar
  const ayBas = (s) => String(s).slice(0, 7) + '-01';
  const ayGun = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  // Ay eklenince gün taşmaz: 31 Ocak + 1 ay = 28/29 Şubat, sonraki ay yine 31 denenir (dayanak başlangıç günüdür)
  function ayEkle(s, n, dayanak) { const d = gun(s); const t = d.getUTCFullYear() * 12 + d.getUTCMonth() + n; const y = Math.floor(t / 12), m = t % 12; const g = Math.min(dayanak || d.getUTCDate(), ayGun(y, m)); return `${y}-${String(m + 1).padStart(2, '0')}-${String(g).padStart(2, '0')}`; }
  const haftaBas = (s) => ekle(s, 1 - haftaGunu(s));
  const FREQ = { gunluk: 'Her gün', haftalik: 'Haftalık', ikihafta: 'İki haftada bir', aylik: 'Aylık', ikiay: 'İki ayda bir', ucay: 'Üç ayda bir', altiay: 'Altı ayda bir', yillik: 'Yıllık' };
  const AYLIK = { aylik: 1, ikiay: 2, ucay: 3, altiay: 6, yillik: 12 };
  const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Planın [bas, bit] aralığındaki ziyaret günleri. plan: { freq, days:[1..7], start, end }. Üst sınır gerekir: sonsuz plan yoktur.
  function tarihler(plan, bas, bit) {
    const o = []; if (!plan || !plan.start || !FREQ[plan.freq]) return o; const son = plan.end && plan.end < bit ? plan.end : bit; const alt = plan.start > bas ? plan.start : bas; if (alt > son) return o;
    if (AYLIK[plan.freq]) { const dayanak = gun(plan.start).getUTCDate(); for (let i = 0, d = plan.start; d <= son && i < 2400; i++, d = ayEkle(plan.start, i * AYLIK[plan.freq], dayanak)) if (d >= alt) o.push(d); return o; }
    const secili = Array.isArray(plan.days) && plan.days.length ? plan.days.map(Number) : plan.freq === 'gunluk' ? [1, 2, 3, 4, 5, 6, 7] : [haftaGunu(plan.start)];
    const bazHafta = haftaBas(plan.start);
    for (let d = alt; d <= son; d = ekle(d, 1)) { if (!secili.includes(haftaGunu(d))) continue; if (plan.freq === 'ikihafta' && Math.round((gun(haftaBas(d)) - gun(bazHafta)) / 864e5 / 7) % 2 !== 0) continue; o.push(d); }
    return o;
  }
  // Üretilecek ziyaretler. Kimlik plan + günden çıkar: iki cihaz aynı anda üretse de belge birleşince tek kayıt kalır; iptal edilen ziyaret geri gelmez.
  const ziyaretId = (planId, d) => `v-${planId}-${d}`;
  function ziyaretUret(planlar, isler, bas, bit) {
    const var_ = new Set(); (isler || []).forEach((j) => { if (j && j.plan) var_.add(ziyaretId(j.plan, j.date)); if (j && j.id) var_.add(j.id); });
    const o = []; (planlar || []).filter((p) => p && p.status === 'aktif').forEach((p) => tarihler(p, bas, bit).forEach((d) => { const id = ziyaretId(p.id, d); if (!var_.has(id)) o.push({ id, plan: p.id, date: d }); }));
    return o;
  }

  // ---------- Tutar ----------
  const satir = (l) => r2(num(l.price) * num(l.qty || 1));
  // Müşteri bir teklifi onayladıysa yalnız onaylı kalemler borç sayılır: bekleyen ek kalem onaylanana kadar toplama, tahsilata ve belgeye girmez.
  const gecerli = (j) => (j.lines || []).filter((l) => !num(j.accepted) || l.ok);
  const toplam = (j) => r2(gecerli(j).reduce((t, l) => t + satir(l), 0));
  const hepsi = (j) => r2((j.lines || []).reduce((t, l) => t + satir(l), 0));
  const onayli = (j) => r2((j.lines || []).filter((l) => l.ok).reduce((t, l) => t + satir(l), 0));
  const onaysiz = (j) => (j.lines || []).filter((l) => !l.ok);
  const odenen = (j) => r2((j.payments || []).reduce((t, p) => t + (p.kind === 'iade' ? -num(p.amount) : num(p.amount)), 0));
  // İşin tutarı müşteriye KDV dahil söylenir; e-Belge satırı KDV hariç fiyat ister. Dört hane: satır toplamı kuruşa yuvarlanınca söylenen tutarla aynı kalır.
  const kdvsiz = (fiyat, oran) => Math.round((num(fiyat) / (1 + num(oran) / 100)) * 10000) / 10000;
  const kalan = (j) => r2(toplam(j) - odenen(j));
  const kapora = (j) => (j.payments || []).filter((p) => p.kind === 'kapora').reduce((t, p) => t + num(p.amount), 0);
  const iade = (j) => (j.payments || []).filter((p) => p.kind === 'iade').reduce((t, p) => t + num(p.amount), 0);
  const faturaOdenen = (f) => r2((f.payments || []).reduce((t, p) => t + num(p.amount), 0));
  const faturaKalan = (f) => r2(num(f.total) - faturaOdenen(f));

  // Müşteri teklife yanıt verir. Fiyat kilidi buradadır: onaylanan satır değişmez, reddedilen ek satır silinir. Panel ve müşteri sayfası aynı işlevi kullanır, sunucu da doğrular.
  function teklifCevap(j, karar, kim, not, an) {
    if (!j.offer || j.offer.status !== 'bekliyor') return null; if (!['onay', 'red'].includes(karar)) return null;
    const at = an || new Date().toISOString(); const lines = karar === 'onay' ? (j.lines || []).map((l) => ({ ...l, ok: true })) : (j.lines || []).filter((l) => l.ok);
    const offer = { ...j.offer, status: karar, answeredAt: at, by: kim, note: String(not || '').slice(0, 300) }; const accepted = r2(lines.reduce((t, l) => t + satir(l), 0));
    const p = { lines, offer, accepted, log: [...(j.log || []), { at, status: j.status, note: `${karar === 'onay' ? 'Teklif onaylandı' : 'Teklif reddedildi'} · ${r2(j.offer.total)} ₺${not ? ' · ' + String(not).slice(0, 200) : ''}`, user: kim }] };
    if (['teklif', 'kesif'].includes(j.status)) p.status = karar === 'onay' ? 'onay' : 'red'; // keşifte açılmış eski teklif kayıtları da ilerler
    return p;
  }
  function teklifAc(j, kim, an) { const l = onaysiz(j); if (!l.length) return null; const at = an || new Date().toISOString(); const total = r2(l.reduce((t, x) => t + satir(x), 0)); return { offer: { status: 'bekliyor', total, at, ek: (j.lines || []).some((x) => x.ok), by: kim }, log: [...(j.log || []), { at, status: j.status, note: `Teklif hazırlandı: ${total} ₺`, user: kim }] }; }

  // ---------- Dönem faturası ----------
  // Sözleşme bu dönemde yürürlükte mi: başlamadan önceki ve bittikten sonraki aya kayıt açılmaz
  const donemKapsar = (c, donem) => (!c.start || String(c.start).slice(0, 7) <= donem) && (!c.end || String(c.end).slice(0, 7) >= donem);
  // Dönem: 'YYYY-AA'. Sabit ücrette aylık bedel, ziyaret başında tamamlanan ziyaret sayılır. Gelinmeyen ziyaret her zaman görünür; missedCut açıksa sabit ücretten oransal düşülür.
  // Yalnız aylık planlanmış ziyaretler sayılır; ek kalemler (j.lines) her iki modelde ayrı satır olur. KDV hariç birim fiyat, oran sözleşmeden.
  function donemFatura(c, isler, donem) {
    const ic = (isler || []).filter((j) => j.plan === c.id && String(j.date).slice(0, 7) === donem); const yapilan = ic.filter((j) => j.status === 'tamam'); const gelinmeyen = ic.filter((j) => j.status === 'gelinmedi'); const iptal = ic.filter((j) => ['iptal', 'ertelendi'].includes(j.status)); const planli = ic.length - iptal.length;
    const lines = []; const ad = c.title || 'Hizmet bedeli'; let dusum = 0;
    if (c.billing !== 'ziyaret' && c.missedCut && gelinmeyen.length && planli > 0) dusum = r2((num(c.fee) * gelinmeyen.length) / planli);
    // Düşüm ayrı eksi satır olmaz: e-Belge eksi satır ve belge geneli indirim almaz, tutar ücret satırına işlenir
    if (c.billing === 'ziyaret') { if (yapilan.length) lines.push({ name: `${ad} (${yapilan.length} ziyaret)`, qty: yapilan.length, price: num(c.visitFee) }); } else if (num(c.fee) - dusum > 0) lines.push({ name: `${ad} (${donem})${dusum ? ` · ${gelinmeyen.length} gelinmeyen ziyaret düşüldü` : ''}`, qty: 1, price: r2(num(c.fee) - dusum) });
    yapilan.forEach((j) => gecerli(j).forEach((l) => lines.push({ name: `${l.name} (${j.no})`, qty: num(l.qty || 1), price: num(l.price) })));
    const net = r2(lines.reduce((t, l) => t + satir(l), 0)); const oran = num(c.vat); const vat = r2((net * oran) / 100);
    return { period: donem, lines, net, vatRate: oran, vat, total: r2(net + vat), done: yapilan.length, missed: gelinmeyen.length, planned: planli, dusum };
  }

  // ---------- Çakışma ----------
  const dk = (t) => { const m = /^(\d{2}):(\d{2})/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  const aralik = (j) => { const a = dk(j.time); return a === null ? null : [a, a + (num(j.duration) || 60)]; };
  const KAPALI = ['tamam', 'iptal', 'gelinmedi', 'ertelendi', 'red'];
  // Aynı gün aynı kaynakta (ekip, araç) çakışan açık işler. Saati olmayan iş tüm günü tutar sayılır; çok günlük iş dateTo ile biter.
  function cakisma(isler, j, alan) {
    if (!j || !j[alan] || !j.date) return []; const bu = aralik(j); const son = j.dateTo || j.date;
    return (isler || []).filter((x) => { if (!x || x.id === j.id || x[alan] !== j[alan] || KAPALI.includes(x.status) || !x.date) return false; if (x.date > son || (x.dateTo || x.date) < j.date) return false; if (x.date !== j.date || !bu) return true; const o = aralik(x); return !o || (bu[0] < o[1] && o[0] < bu[1]); });
  }

  // ---------- Nakliyat teklifi ----------
  const sayi = (n) => String(n).replace('.', ','); // kullanıcıya görünen ondalık Türkçe virgülle yazılır
  const hacim = (eslar) => r2((eslar || []).reduce((t, e) => t + num(e.m3) * num(e.qty || 1), 0));
  // Asansörsüz katta kat ücreti yazılır, asansör varsa veya zemin katta yazılmaz. Birim ücretler işletme ayarıdır.
  function nakliyatTeklif(i, a) {
    const kat = (n, asansor) => (asansor ? 0 : Math.max(0, num(n))); const v = hacim(i.items); const L = [];
    if (v) L.push({ name: `Taşıma (${sayi(v)} m³)`, qty: v, price: num(a.rateM3) }); if (num(i.km)) L.push({ name: `Mesafe (${num(i.km)} km)`, qty: num(i.km), price: num(a.rateKm) });
    const kk = kat(i.floorFrom, i.liftFrom) + kat(i.floorTo, i.liftTo); if (kk) L.push({ name: `Asansörsüz kat (${kk} kat)`, qty: kk, price: num(a.rateFloor) });
    if (i.packing) L.push({ name: 'Paketleme', qty: 1, price: num(a.ratePacking) }); return L.filter((l) => num(l.price));
  }

  // ---------- Bakım ve garanti ----------
  const bakimSonraki = (c) => (c && c.lastCare && num(c.period) > 0 ? ayEkle(c.lastCare, num(c.period)) : c && c.nextCare ? c.nextCare : '');
  const gunFarki = (a, b) => Math.round((gun(a) - gun(b)) / 864e5);
  function bakimDurum(c, bugun, esik = 30) { const n = bakimSonraki(c); if (!n) return { next: '', gun: null, durum: 'plansiz' }; const g = gunFarki(n, bugun); return { next: n, gun: g, durum: g < 0 ? 'gecikti' : g <= esik ? 'yaklasti' : 'iyi' }; }
  const kod = (n = 6, rnd = Math.random) => { const A = '23456789ABCDEFGHJKMNPQRSTVWXYZ'; let s = ''; for (let i = 0; i < n; i++) s += A[Math.floor(rnd() * A.length)]; return s; };

  return { sayi, gecerli, hepsi, kdvsiz, donemKapsar, r2, num, ekle, ayEkle, haftaBas, haftaGunu, ayBas, gunFarki, FREQ, GUNLER, AYLIK, tarihler, ziyaretId, ziyaretUret, satir, toplam, onayli, onaysiz, odenen, kalan, kapora, iade, faturaOdenen, faturaKalan, teklifCevap, teklifAc, donemFatura, dk, KAPALI, cakisma, hacim, nakliyatTeklif, bakimSonraki, bakimDurum, kod };
}));
