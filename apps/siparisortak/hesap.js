/* Sipariş ve Teslim ortak hesapları: tarayıcıda SIPHESAP, Node'da require. DOM kullanmaz (server/test/siparis-kural.test.js).
   Tutarlar kuruş hatası taşımasın diye her adımda 2 haneye yuvarlanır. Eski kayıtlarda eksik dizi ve sayı 0 sayılır. */
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.SIPHESAP = m; }(typeof self !== 'undefined' ? self : this, () => {
  const n = (v) => { const x = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : 0; };
  const r2 = (v) => Math.round((n(v) + Number.EPSILON) * 100) / 100;
  const dizi = (a) => (Array.isArray(a) ? a : []);
  const satir = (l) => r2(n(l.qty) * n(l.price));
  const araToplam = (o) => r2(dizi(o.lines).reduce((t, l) => t + satir(l), 0));
  // İndirim ara toplamı aşamaz; teslimat ücreti indirimden sonra eklenir
  const toplam = (o) => { const a = araToplam(o); return r2(a - Math.min(a, Math.max(0, n(o.disc))) + Math.max(0, n(o.fee))); };
  const odenen = (o) => r2(dizi(o.payments).reduce((t, p) => t + n(p.amount), 0)); // iade eksi tutarla yazılır
  const kapora = (o) => r2(dizi(o.payments).filter((p) => p.kind === 'kapora').reduce((t, p) => t + n(p.amount), 0));
  const kalan = (o) => r2(toplam(o) - odenen(o));
  const m2 = (en, boy) => r2(Math.max(0, n(en)) * Math.max(0, n(boy)));
  // Teslim sırası: tarih, sonra saat aralığının başı; saati olmayan gün sonuna
  const saatBas = (s) => { const m = /(\d{1,2})[:.](\d{2})/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : 1440; };
  const sira = (a, b) => String(a.due || '').localeCompare(String(b.due || '')) || saatBas(a.dueTime) - saatBas(b.dueTime);
  const geciktiMi = (o, gun, simdi = '') => !!o.due && o.due < gun || (!!o.due && o.due === gun && !!simdi && saatBas(o.dueTime) < 1440 && saatBas(o.dueTime) < saatBas(simdi));
  // Reçete: malzeme { ing, qty } satırları; verim adedi kaç birim çıktığını söyler. Bilinmeyen malzeme "eksik"te listelenir, maliyet tamam sayılmaz.
  function receteMaliyet(rc, malz) {
    const M = new Map(dizi(malz).map((m) => [m.id, m])); const eksik = [];
    const top = dizi(rc && rc.items).reduce((t, i) => { const m = M.get(i.ing); if (!m || !n(m.cost)) { eksik.push(m ? m.name : i.ing); return t; } return t + n(i.qty) * n(m.cost); }, 0);
    const verim = Math.max(1, n(rc && rc.yield) || 1);
    return { toplam: r2(top), birim: r2(top / verim), eksik };
  }
  // Üretim ihtiyacı: [{ rc, qty }] plan satırlarından malzeme toplamı ve stok açığı
  function ihtiyac(plan, receteler, malz) {
    const R = new Map(dizi(receteler).map((x) => [x.id, x])); const M = new Map(dizi(malz).map((m) => [m.id, m])); const T = new Map();
    dizi(plan).forEach((p) => { const rc = R.get(p.rc); if (!rc) return; const k = n(p.qty) / Math.max(1, n(rc.yield) || 1); dizi(rc.items).forEach((i) => T.set(i.ing, (T.get(i.ing) || 0) + n(i.qty) * k)); });
    return [...T.entries()].map(([id, q]) => { const m = M.get(id) || { name: id, stock: 0, unit: '' }; const gerek = Math.round(q * 1000) / 1000; return { id, name: m.name, unit: m.unit || '', gerek, stok: n(m.stock), acik: Math.max(0, Math.round((gerek - n(m.stock)) * 1000) / 1000) }; }).sort((a, b) => b.acik - a.acik || String(a.name).localeCompare(String(b.name), 'tr'));
  }
  return { n, r2, satir, araToplam, toplam, odenen, kapora, kalan, m2, saatBas, sira, geciktiMi, receteMaliyet, ihtiyac };
}));
