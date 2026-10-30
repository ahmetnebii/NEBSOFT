/* NEBSOFT Düğün Salonu — ortak hesap: panel (app.js), müşteri sayfası (salon.html) ve sunucu kuralı (public-rules.js) aynı kodu kullanır.
   Bu dosya tarayıcıda window.DUGUN_HESAP, Node'da module.exports olur; NS veya DOM kullanmaz. Tutarlar kuruşa yuvarlanır. */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.DUGUN_HESAP = make(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SEANS = [{ id: 'gunduz', name: 'Gündüz', start: '12:00', end: '17:00' }, { id: 'aksam', name: 'Akşam', start: '19:00', end: '00:00' }];
  const TUR = ['Düğün', 'Nişan', 'Kına', 'Söz', 'Sünnet', 'Mezuniyet', 'Kurumsal', 'Diğer'];
  // Takvimi tutan durumlar: iptal ve süresi geçmiş opsiyon tarihi boşaltır
  const DURUM = { opsiyon: ['Opsiyon', 'warn'], kesin: ['Kesin', 'ok'], tamam: ['Tamamlandı', 'info'], iptal: ['İptal', 'err'] };
  const r2 = (x) => Math.round((Number(x) || 0) * 100 + 1e-7) / 100;
  const sum = (a, f) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const dayN = (s) => Math.round(Date.parse(String(s).slice(0, 10) + 'T00:00:00Z') / 864e5);
  const gunFark = (a, b) => dayN(b) - dayN(a);
  const dayS = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
  const addDay = (s, k = 1) => dayS(dayN(s) + k);
  const haftaSonu = (d) => [0, 5, 6].includes(new Date(String(d).slice(0, 10) + 'T12:00:00Z').getUTCDay());
  // Bir ay sonrası: ayın son gününü aşmaz (31 Ocak + 1 ay = 28 Şubat)
  const ayEkle = (s, k) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); const a = new Date(Date.UTC(y, m - 1 + k, 1)); const son = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 0)).getUTCDate(); a.setUTCDate(Math.min(d, son)); return a.toISOString().slice(0, 10); };
  const aktif = (e, bugun) => !!e && (e.status === 'kesin' || e.status === 'tamam' || (e.status === 'opsiyon' && !(e.holdUntil && e.holdUntil < bugun)));
  const suresiDoldu = (e, bugun) => !!e && e.status === 'opsiyon' && !!e.holdUntil && e.holdUntil < bugun;
  // Aynı salon + tarih + seans iki kayıtta bulunamaz. Tüm gün seansı ("tam") iki seansla da çakışır.
  const seansCakisir = (a, b) => a === b || a === 'tam' || b === 'tam';
  const cakisan = (events, r, bugun, selfId) => (events || []).find((e) => e && e.id !== selfId && e.hall === r.hall && e.date === r.date && seansCakisir(e.seans, r.seans) && aktif(e, bugun)) || null;
  const sezonPct = (seasons, d) => { const s = (seasons || []).find((x) => x && x.from && x.to && x.from <= d && d <= x.to); return s ? Number(s.pct) || 0 : 0; };
  // Paket fiyatı: kişi başı veya sabit bedel, hafta sonu ve sezon farkı üst üste uygulanır
  function paketFiyat(p, o) {
    if (!p) return 0; const n = Number(o.guests) || 0; const taban = p.perPerson ? (Number(p.price) || 0) * Math.max(n, Number(p.minGuests) || 0) : Number(p.price) || 0;
    const hs = haftaSonu(o.date) ? Number(p.weekendPct) || 0 : 0; const sz = sezonPct(o.seasons, o.date);
    return r2(taban * (1 + hs / 100) * (1 + sz / 100));
  }
  // Kalem toplamı: paket + ek hizmetler - indirim. Ek protokoller imzalıysa toplama girer: sözleşme tutarı sessizce değişmez.
  function toplam(e) {
    const ara = r2((Number(e.pkgPrice) || 0) + sum(e.extras, (x) => (Number(x.qty) || 0) * (Number(x.price) || 0)));
    const ind = Math.min(ara, Math.max(0, Number(e.discount) || 0)); const ek = sum((e.addenda || []).filter((a) => a.sign || a.ok), (a) => a.amount);
    return { ara, indirim: r2(ind), ek: r2(ek), genel: r2(ara - ind + ek) };
  }
  // Ödeme planı: kapora + kalan eşit taksit, son taksit etkinlikten belirtilen gün önce biter; kuruş farkı son taksite yazılır
  function plan(o) {
    const genel = r2(o.total); const kapora = Math.min(genel, Math.max(0, r2(o.deposit))); const n = Math.max(0, Math.floor(Number(o.taksit) || 0)); const satir = [];
    if (kapora > 0) satir.push({ due: String(o.bugun).slice(0, 10), amount: kapora, label: 'Kapora' });
    const kalan = r2(genel - kapora); if (kalan <= 0) return satir; if (!n) { satir.push({ due: addDay(o.date, -(Number(o.sonGun) || 0)), amount: kalan, label: 'Kalan ödeme' }); return satir; }
    const birim = Math.floor((kalan / n) * 100) / 100; const son = addDay(o.date, -(Number(o.sonGun) || 0));
    for (let i = 0; i < n; i++) { let due = ayEkle(son, i - (n - 1)); if (due < String(o.bugun).slice(0, 10)) due = String(o.bugun).slice(0, 10); satir.push({ due, amount: i === n - 1 ? r2(kalan - birim * (n - 1)) : birim, label: `${i + 1}. taksit` }); }
    return satir;
  }
  // Ödeme durumu: taksitler ödemeler toplamıyla baştan kapatılır; böylece iade veya kısmi ödeme planı bozmaz
  function odeme(e, payments, bugun) {
    const pays = (payments || []).filter((p) => p && p.event === e.id); const odenen = r2(sum(pays, (p) => p.amount)); const genel = toplam(e).genel; let kasa = odenen;
    const satir = (e.plan || []).map((t) => { const a = Number(t.amount) || 0; const ode = Math.max(0, Math.min(a, kasa)); kasa = r2(kasa - ode); const kalan = r2(a - ode); return { ...t, odenen: r2(ode), kalan, gecikti: kalan > 0 && t.due < bugun }; });
    return { odenen, kalan: r2(genel - odenen), gecikmis: r2(sum(satir.filter((t) => t.gecikti), (t) => t.kalan)), satir };
  }
  // İptal önerisi: "tarihe en az X gün kala ödenenin yüzde Y'si iade" kademeleri (işletmenin kendi sözleşmesi). En uzun uyan kademe geçerlidir. Sonuç öneridir, tutar elle değiştirilir.
  function iptalOneri(e, odenen, tiers, bugun) {
    const kalan = gunFark(bugun, e.date); const L = (tiers || []).filter((t) => Number(t.days) >= 0).slice().sort((a, b) => Number(b.days) - Number(a.days)); const k = L.find((t) => kalan >= Number(t.days));
    const pct = k ? Number(k.pct) || 0 : 0; return { kalanGun: kalan, pct, kademe: k || null, iade: r2((Math.max(0, odenen) * pct) / 100) };
  }
  const hazirlik = (d) => [[-180, 'Menü ve paket onayı alındı'], [-90, 'Süsleme ve masa düzeni seçildi'], [-30, 'Davetli sayısı kesinleşti'], [-14, 'Müzik ve akış planı onaylandı'], [-3, 'Son ödeme kontrol edildi'], [0, 'Salon teslim kontrolü yapıldı']].map(([k, t], i) => ({ id: 't' + i, text: t, due: addDay(d, k), done: false }));
  return { SEANS, TUR, DURUM, r2, sum, dayN, gunFark, addDay, ayEkle, haftaSonu, aktif, suresiDoldu, seansCakisir, cakisan, sezonPct, paketFiyat, toplam, plan, odeme, iptalOneri, hazirlik };
}));
