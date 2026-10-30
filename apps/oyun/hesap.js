/* NEBSOFT Kafe, Oyun Salonu & Çocuk Oyun Alanı — süre ücreti, adisyon, kart bakiyesi ve doğum günü hesabı.
   Panel, üye sayfası (kart.html) ve sunucu kuralı aynı kodu kullanır. Tarayıcıda window.OYUN_HESAP, Node'da module.exports; NS veya DOM kullanmaz. */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.OYUN_HESAP = make(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const r2 = (x) => Math.round((Number(x) || 0) * 100 + 1e-7) / 100;
  const sum = (a, f) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const dakika = (ms) => Math.max(0, ms) / 60000;
  // Duraklatmalar düşülmüş net süre (dakika). Açık duraklatma "şimdi"ye kadar sayılır.
  function netDakika(s, simdi) {
    const son = s.end ? Date.parse(s.end) : Date.parse(simdi); const dur = sum(s.pauses, (p) => (p.to ? Date.parse(p.to) : son) - Date.parse(p.from));
    return dakika(son - Date.parse(s.start) - dur);
  }
  // Saate göre tarife: from-to dilimi içindeyse o saatlik ücret, yoksa temel ücret. Gece yarısını aşan dilim desteklenir.
  const dilimde = (d, m) => { const a = toMin(d.from), b = toMin(d.to); return a <= b ? m >= a && m < b : m >= a || m < b; };
  const saatlik = (t, m) => { const d = (t.bands || []).find((x) => x && x.from && x.to && dilimde(x, m)); return d ? Number(d.rate) || 0 : Number(t.rate) || 0; };
  // Süre ücreti dakika dakika toplanır, böylece gündüz-gece geçişi doğru hesaplanır. Yukarı yuvarlama ve en az süre tarifededir. Tutar kuruşa yuvarlanır.
  // Dakikalar yerel saatle (dk: gün içi dakika) verilir: gunDk(iso) çağıranın saat dilimindedir.
  const gunDk = (iso) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
  function sureUcret(s, t, simdi, dkFn = gunDk) {
    const net = netDakika(s, simdi); const adim = Math.max(1, Number(t.roundMin) || 1); const yuv = Math.ceil(Math.max(0, net - 1e-6) / adim) * adim; const sure = net > 0 ? Math.max(yuv, Number(t.minMin) || 0) : 0;
    const bas = dkFn(s.start); let tutar = 0; for (let i = 0; i < sure; i++) tutar += saatlik(t, (bas + i) % 1440) / 60;
    return { net: Math.round(net), sure, tutar: r2(tutar) };
  }
  const kalemToplam = (items) => r2(sum((items || []).filter((i) => !i.cancel), (i) => (Number(i.qty) || 0) * (Number(i.price) || 0)));
  // Adisyon: süre + kalemler - indirim
  function adisyon(s, t, simdi, dkFn) {
    const u = t && !s.flat ? sureUcret(s, t, simdi, dkFn) : { net: 0, sure: 0, tutar: Number(s.flatPrice) || 0 }; const k = kalemToplam(s.items); const ara = r2(u.tutar + k); const ind = Math.min(ara, Math.max(0, Number(s.discount) || 0));
    return { ...u, kalem: k, ara, indirim: r2(ind), genel: r2(ara - ind) };
  }
  // Kart bakiyesi: yükleme, harcama, iade hareketlerinin toplamı. Tek doğruluk kaynağı hareket defteridir, yeniden hesaplanabilir.
  const bakiye = (uye, tx) => r2(sum((tx || []).filter((x) => x && x.member === uye), (x) => x.amount));
  const bonusOran = (tiers, tutar) => { const L = (tiers || []).filter((x) => Number(x.min) > 0).slice().sort((a, b) => Number(b.min) - Number(a.min)); const k = L.find((x) => Number(tutar) >= Number(x.min)); return k ? Number(k.pct) || 0 : 0; };
  const yukle = (tutar, tiers) => { const a = r2(tutar); const pct = bonusOran(tiers, a); return { tutar: a, pct, bonus: r2((a * pct) / 100) }; };
  // Çocuk çıkışı: bant kodu ile. Teslim alan kişi kayıtlı veliyle eşleşmezse yetkili onayı gerekir.
  const teslimUygun = (cocuk, ad) => { const n = (x) => String(x || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' '); const v = [cocuk.guardian, ...(cocuk.pickup || [])].map(n).filter(Boolean); return v.includes(n(ad)); };
  const sureBitti = (s, simdi) => !s.end && Number(s.paidMin) > 0 && netDakika(s, simdi) >= Number(s.paidMin);
  const kalanDk = (s, simdi) => Math.ceil(Number(s.paidMin) - netDakika(s, simdi));
  // Doğum günü: aynı alan ve tarihte, temizlik payıyla çakışan rezervasyon alınamaz
  const canliRez = (b) => !!b && !['iptal', 'red'].includes(b.status);
  function cakisan(bookings, r, tampon, selfId) {
    const a = toMin(r.start), z = toMin(r.end), t = Number(tampon) || 0;
    return (bookings || []).find((b) => canliRez(b) && b.id !== selfId && b.date === r.date && b.area === r.area && a < toMin(b.end) + t && toMin(b.start) < z + t) || null;
  }
  const rezTutar = (p, cocuk, ekstra) => { if (!p) return 0; const n = Math.max(Number(cocuk) || 0, Number(p.minKids) || 0); return r2((Number(p.price) || 0) + (n > (Number(p.kids) || 0) ? (n - (Number(p.kids) || 0)) * (Number(p.extraKid) || 0) : 0) + (Number(ekstra) || 0)); };
  const yas = (birth, bugun) => { if (!birth) return null; const [y, m, d] = String(birth).slice(0, 10).split('-').map(Number); const [a, b, c] = String(bugun).slice(0, 10).split('-').map(Number); return a - y - (b < m || (b === m && c < d) ? 1 : 0); };
  return { r2, sum, toMin, netDakika, saatlik, sureUcret, kalemToplam, adisyon, bakiye, bonusOran, yukle, teslimUygun, sureBitti, kalanDk, canliRez, cakisan, rezTutar, yas, gunDk };
}));
