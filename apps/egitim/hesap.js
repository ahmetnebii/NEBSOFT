/* NEBSOFT Eğitim saf hesapları (tarayıcı ve test ortak kullanır): gün listesi, belge geçerlilik tarihi, geciken taksit.
   Bugünün vadesi gecikmiş sayılmaz: Taksit sayfası ve Özet aynı kuralı kullanır. */
(function (root) {
  'use strict';
  // "2,4" → [2, 4]. 1 Pzt ... 7 Paz; 7 ve 0 pazardır (Date.getDay). Boş veya aralık dışı giriş null döner, sessizce başka güne kaymaz
  const gunler = (t) => { const a = String(t == null ? '' : t).split(',').map((x) => x.trim()).filter(Boolean).map(Number); if (!a.length || a.some((x) => !Number.isInteger(x) || x < 0 || x > 7)) return null; return [...new Set(a.map((x) => x % 7))]; };
  // Geçerlilik takvim yılıyla ilerler, 365 ile çarpılmaz (artık yılda bir gün kaymasın)
  const bitis = (tarih, yil) => { const n = Number(yil) || 0; if (!n) return null; const [y, m, d] = String(tarih).split('-'); return `${Number(y) + n}-${m}-${d}`; };
  const gecikmis = (taksitler, bugun) => (taksitler || []).filter((i) => !i.canceled && !i.paid && i.due < bugun).reduce((t, i) => t + (Number(i.amount) || 0), 0);
  const api = { gunler, bitis, gecikmis };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EGITIM_HESAP = api;
})(typeof window !== 'undefined' ? window : globalThis);
