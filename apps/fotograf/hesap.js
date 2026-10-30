/* NEBSOFT Fotoğrafçı & Stüdyo — ortak hesap: panel, müşteri galerisi (galeri.html) ve sunucu kuralı aynı kodu kullanır.
   Tarayıcıda window.FOTO_HESAP, Node'da module.exports; NS veya DOM kullanmaz. */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.FOTO_HESAP = make(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // İş akışı sırası: müşteri galeride aynı adımları görür
  const ASAMA = [['talep', 'Talep'], ['kesin', 'Kesinleşti'], ['cekildi', 'Çekildi'], ['duzenleme', 'Düzenleniyor'], ['secim', 'Müşteri seçiminde'], ['baski', 'Baskıda'], ['hazir', 'Teslime hazır'], ['teslim', 'Teslim edildi']];
  const TIP = ['Düğün', 'Nişan', 'Dış çekim', 'Hamile', 'Bebek', 'Aile', 'Mezuniyet', 'Ürün', 'Kurumsal', 'Vesikalık'];
  const FOTO = { bulutMax: 400, yerelMax: 8, yerelBoyut: 200e3 };
  const r2 = (x) => Math.round((Number(x) || 0) * 100 + 1e-7) / 100;
  const sum = (a, f) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const dayN = (s) => Math.round(Date.parse(String(s).slice(0, 10) + 'T00:00:00Z') / 864e5);
  const gunFark = (a, b) => dayN(b) - dayN(a);
  const addDay = (s, k = 1) => new Date((dayN(s) + k) * 864e5).toISOString().slice(0, 10);
  const asamaNo = (id) => ASAMA.findIndex((a) => a[0] === id);
  const asamaAd = (id) => (ASAMA.find((a) => a[0] === id) || [id, id])[1];
  const canli = (s) => !!s && s.status !== 'iptal';
  // Fotoğrafçı aynı anda iki yerde olamaz; yol süresi (dakika) iki çekimin arasına eklenir
  function cakisan(shoots, r, tampon, selfId) {
    const a = toMin(r.start), b = a + (Number(r.dur) || 0), t = Number(tampon) || 0;
    return (shoots || []).find((s) => canli(s) && s.id !== selfId && s.staff && s.staff === r.staff && s.date === r.date && a < toMin(s.start) + (Number(s.dur) || 0) + t && toMin(s.start) < b + t) || null;
  }
  const toplam = (s) => { const ara = r2((Number(s.price) || 0) + sum(s.extras, (x) => (Number(x.qty) || 0) * (Number(x.price) || 0))); const ind = Math.min(ara, Math.max(0, Number(s.discount) || 0)); return r2(ara - ind); };
  const odenen = (s, pays) => r2(sum((pays || []).filter((p) => p && p.shoot === s.id), (p) => p.amount));
  const kalan = (s, pays) => r2(toplam(s) - odenen(s, pays));
  // Teslim sözü: çekim tarihi + söz verilen gün. Teslim edilene kadar gecikme sayılır.
  const sozTarihi = (s) => s.dueAt || (s.date && Number(s.promiseDays) ? addDay(s.date, Number(s.promiseDays)) : '');
  const gecikme = (s, bugun) => { const d = sozTarihi(s); return !canli(s) || s.status === 'teslim' || !d || d >= bugun ? 0 : gunFark(d, bugun); };
  // Yedek kuralı: kartlar silinmeden önce en az iki kopya işaretlenmeli
  const yedekTamam = (s) => !!(s.backup && s.backup.a && s.backup.b);
  const arsivBitis = (s, yil) => (s.date && Number(yil) ? `${Number(s.date.slice(0, 4)) + Number(yil)}${s.date.slice(4, 10)}` : '');
  const galeriAcik = (g, bugun) => !!g && !!g.published && !(g.expires && g.expires < bugun);
  // Seçim doğrulaması: yalnızca galerideki fotoğraflar, tekrarsız, sınırı aşmadan
  function secimHata(g, picks) {
    if (!Array.isArray(picks)) return 'Geçersiz seçim'; const v = new Set(g.photos || []); if (new Set(picks).size !== picks.length) return 'Aynı fotoğraf iki kez seçilmiş';
    if (picks.some((u) => !v.has(u))) return 'Galeride olmayan fotoğraf seçilemez'; if (Number(g.pickLimit) > 0 && picks.length > Number(g.pickLimit)) return `En fazla ${g.pickLimit} fotoğraf seçebilirsiniz`; return '';
  }
  return { ASAMA, TIP, FOTO, r2, sum, toMin, gunFark, addDay, asamaNo, asamaAd, canli, cakisan, toplam, odenen, kalan, sozTarihi, gecikme, yedekTamam, arsivBitis, galeriAcik, secimHata };
}));
