/* NEBSOFT Araç Kiralama — ortak hesap: panel (app.js), online kiralama (kirala.html) ve sunucu kuralı (public-rules.js) aynı kodu kullanır.
   Bu dosya tarayıcıda window.KIRA_HESAP, Node'da module.exports olur; NS veya DOM kullanmaz. Tutarlar kuruşa yuvarlanır. */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.KIRA_HESAP = make(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EXTRAS = [{ id: 'bebek', name: 'Bebek koltuğu', daily: 150 }, { id: 'surucu', name: 'Ek sürücü', daily: 200 }, { id: 'sigorta', name: 'Mini hasar sigortası', daily: 350 }, { id: 'navi', name: 'Navigasyon', daily: 100 }, { id: 'zincir', name: 'Kar zinciri', daily: 80 }];
  const DEF = { kmLimit: 300, extraKm: 6, fuelFee: 400, minAge: 21, minLicense: 2, longDays: 7, longPct: 10, freeCancelHours: 24, graceHours: 2, vatPct: 20 };
  const r2 = (x) => Math.round((Number(x) || 0) * 100 + 1e-7) / 100;
  const dayN = (s) => Math.round(Date.parse(String(s).slice(0, 10) + 'T00:00:00Z') / 864e5);
  const dayS = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
  const addDay = (s, k = 1) => dayS(dayN(s) + k);
  const nights = (from, to) => Math.max(1, dayN(to) - dayN(from));
  const sum = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  // Satılan/pasif ve bakımdaki araç kiralanamaz
  const rentable = (c) => !!c && c.status !== 'bakim' && c.status !== 'pasif';
  const extraDaily = (ids) => sum(EXTRAS.filter((x) => (ids || []).includes(x.id)), (x) => x.daily);

  // Sezon fiyatı: her gün için o güne uyan en yüksek oran uygulanır (sınıfa özel ya da tüm sınıflar). Negatif oran indirimdir.
  function seasonPct(seasons, day, cls) { let best = null; (seasons || []).forEach((s) => { if (s.active === false || !s.from || !s.to || day < s.from || day > s.to || (s.cls && s.cls !== cls)) return; const p = Number(s.pct) || 0; if (best === null || p > best) best = p; }); return best || 0; }
  // Tarih aralığının kira bedeli: gün gün sezon + uzun kiralama indirimi
  function quote(daily, from, to, cls, opt = {}) {
    const d = nights(from, to); const seasons = opt.seasons || []; let base = 0;
    for (let i = 0; i < d; i++) base += Number(daily) * (1 + seasonPct(seasons, addDay(from, i), cls) / 100);
    base = r2(base); const longDays = opt.longDays === undefined ? DEF.longDays : Number(opt.longDays), longPct = opt.longPct === undefined ? DEF.longPct : Number(opt.longPct);
    const disc = longPct > 0 && longDays > 0 && d >= longDays ? r2(base * longPct / 100) : 0;
    // Günlük kuruşa yuvarlanınca "günlük × gün − indirim" gösterilen tutardan sapmasın: fark indirime yazılır
    const rent = r2(base - disc), rate = r2(base / d), gross = r2(rate * d);
    return { d, base: gross, disc: r2(gross - rent), rate, rent };
  }

  // Aracın gerçekte serbest kaldığı gün: kirada olup süresi geçen araç hâlâ dışarıdadır, takvimde boş görünmez
  // İade alınan araç ise fiili iade günü boşalır (geç iadede r.to faturalama için ileri taşınabilir)
  const endOf = (r, today) => (r.status === 'kirada' && today && r.to <= today ? addDay(today) : r.status === 'tamamlandi' && r.inAt ? String(r.inAt).slice(0, 10) : r.to);
  const overlaps = (r, from, to, today) => r.status !== 'iptal' && r.from < to && from < endOf(r, today);

  // Geç iade: sözleşme bitişinden sonraki saatler; tolerans içindeyse ek gün yok, aşınca başlayan her 24 saat bir gün
  function lateDays(r, at, grace = DEF.graceHours) {
    const plan = Date.parse(`${r.to}T${r.toTime || '10:00'}:00Z`), real = Date.parse(String(at).slice(0, 16) + ':00Z');
    const h = (real - plan) / 36e5; return h <= Number(grace) ? 0 : Math.ceil(h / 24);
  }

  function bill(r, set = {}) {
    const s = { ...DEF, ...set }; const d = nights(r.from, r.to);
    const has = (v) => v !== null && v !== undefined && v !== '';
    const base = r2(Number(r.daily) * d), disc = r2(r.disc), ext = r2(extraDaily(r.extras) * d);
    const driven = has(r.inKm) && has(r.outKm) ? Math.max(0, Number(r.inKm) - Number(r.outKm)) : 0; const overKm = Math.max(0, driven - Number(s.kmLimit) * d);
    const kmFee = r2(overKm * Number(s.extraKm)); const fuelFee = has(r.inFuel) && has(r.outFuel) && Number(r.inFuel) < Number(r.outFuel) ? r2((Number(r.outFuel) - Number(r.inFuel)) * Number(s.fuelFee)) : 0;
    const dmg = r2(sum(r.damages || [], (x) => x.cost)); const total = r2(base - disc + ext + kmFee + fuelFee + dmg); const paid = r2(sum(r.payments || [], (p) => p.amount));
    return { d, base, disc, ext, driven, overKm, kmFee, fuelFee, dmg, total, paid, due: r2(total - paid) };
  }

  // Depozito: alınan tutar kesinti + iade toplamına eşit olmak zorunda; kesinti açıklamasız yapılamaz (kiracıya gerekçe gösterilir)
  function depositClose(held, cut, note) {
    const h = r2(held), c = r2(cut); if (h <= 0) return { error: 'Alınmış depozito yok' };
    if (c < 0) return { error: 'Kesinti negatif olamaz' }; if (c > h) return { error: 'Kesinti depozitodan büyük olamaz' };
    if (c > 0 && !String(note || '').trim()) return { error: 'Kesinti gerekçesi yazılmalı' };
    return { cut: c, refund: r2(h - c) };
  }
  const yearsBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / (365.25 * 864e5);
  // Teslim/iade fotoğrafı kayda gömülür ve belge bütün olarak gider: taraf başına (sözleşme başına en çok 8) ve tüm sözleşmeler için toplam sınır
  const PHOTO = { perSide: 4, perPhoto: 300e3, total: 10e6, local: 3e6, doc: 18e6 };
  const rentChars = (r) => [...(r.outPhotos || []), ...(r.inPhotos || [])].reduce((t, u) => t + String(u).length, 0);
  // Boş dönerse sığar; list: forma eklenmiş taslak, other: sözleşmenin diğer taraf fotoğrafları
  function photoCheck(rents, r, list, chars, { other = [], docChars = 0, local = false } = {}) {
    if (list.length >= PHOTO.perSide) return `Teslim ve iade için ayrı ayrı en fazla ${PHOTO.perSide} fotoğraf eklenebilir. Yeni fotoğraf için önce birini silin.`;
    const size = (a) => a.reduce((t, u) => t + String(u).length, 0); const max = local ? PHOTO.local : PHOTO.total;
    const used = (rents || []).filter((x) => x.id !== r.id).reduce((t, x) => t + rentChars(x), 0) + size(list) + size(other);
    if (used + chars > max) return `Toplam fotoğraf alanı doldu (${Math.round(max / 1e6)} MB). Yeni fotoğraf için eski sözleşmelerden fotoğraf silin.`;
    if (docChars + chars > PHOTO.doc) return 'Kayıt büyüdüğü için yeni fotoğraf eklenemiyor. Önce eski sözleşmelerden fotoğraf silin.';
    return '';
  }
  return { PHOTO, photoCheck, rentChars, EXTRAS, DEF, r2, addDay, nights, rentable, extraDaily, seasonPct, quote, endOf, overlaps, lateDays, bill, depositClose, yearsBetween };
}));
