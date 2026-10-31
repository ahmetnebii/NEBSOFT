/* NEBSOFT Öğrenci Yurdu & Apart — oda doluluğu, dönem ücreti, depozito, ayrılış ve veli paylaşımı hesabı.
   Panel, veli sayfası (veli.html) ve sunucu kuralı aynı kodu kullanır. Tarayıcıda window.YURT_HESAP, Node'da module.exports; NS veya DOM kullanmaz. */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.YURT_HESAP = make(); }(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const r2 = (x) => Math.round((Number(x) || 0) * 100 + 1e-7) / 100;
  const sum = (a, f) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const dayN = (s) => Math.round(Date.parse(String(s).slice(0, 10) + 'T00:00:00Z') / 864e5);
  const gunFark = (a, b) => dayN(b) - dayN(a);
  const addDay = (s, k = 1) => new Date((dayN(s) + k) * 864e5).toISOString().slice(0, 10);
  const ayEkle = (s, k) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); const a = new Date(Date.UTC(y, m - 1 + k, 1)); const son = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 0)).getUTCDate(); a.setUTCDate(Math.min(d, son)); return a.toISOString().slice(0, 10); };
  const yas = (birth, bugun) => { if (!birth) return null; const [y, m, d] = String(birth).slice(0, 10).split('-').map(Number); const [a, b, c] = String(bugun).slice(0, 10).split('-').map(Number); return a - y - (b < m || (b === m && c < d) ? 1 : 0); };
  // 4721 sayılı TMK md. 11: ergin olma 18 yaş. Doğum tarihi yoksa reşit sayılmaz, veli paylaşımı da açılmaz: kayıtta doğum tarihi zorunludur.
  const resit = (s, bugun) => { const y = yas(s && s.birth, bugun); return y !== null && y >= 18; };
  const resitDegil = (s, bugun) => { const y = yas(s && s.birth, bugun); return y !== null && y < 18; };
  // Veliye hareket ve ödeme bilgisi: reşit olmayanda doğrudan, reşit öğrencide yalnızca öğrencinin kaydedilmiş izniyle
  const veliPaylasir = (s, bugun) => resitDegil(s, bugun) || (resit(s, bugun) && !!s.veliIzni && !!s.veliIzni.at);
  const aktif = (k) => !!k && !k.left && k.status !== 'iptal';
  const yatakDolu = (stays, room, bed, selfId) => (stays || []).find((k) => aktif(k) && k.id !== selfId && k.room === room && Number(k.bed) === Number(bed)) || null;
  const odaDoluluk = (stays, room) => (stays || []).filter((k) => aktif(k) && k.room === room).length;
  // Kız ve erkek öğrenci aynı odaya yazılmaz; karma oda işletmenin açık seçimidir
  const yerlesimHata = (o) => { const { room, bed, stays, student, selfId } = o; if (!room) return 'Oda seçin'; if (!(Number(bed) >= 1 && Number(bed) <= Number(room.beds))) return 'Bu odada böyle bir yatak yok'; if (room.status === 'kapali') return 'Oda kullanıma kapalı'; if (yatakDolu(stays, room.id, bed, selfId)) return 'Bu yatak dolu'; if (room.gender && room.gender !== 'karma' && student && student.gender && room.gender !== student.gender) return 'Oda bu öğrencinin cinsiyetine göre ayrılmamış'; return ''; };
  // Dönem ücreti aylara bölünür; kuruş farkı son taksite yazılır. Ücret kayıt anında donar: dönem fiyatı sonradan değişse kayıt değişmez.
  function taksitler(o) {
    const n = Math.max(1, Math.floor(Number(o.count) || 1)); const t = r2(o.total); const birim = Math.floor((t / n) * 100) / 100;
    return Array.from({ length: n }, (_, i) => ({ due: ayEkle(o.start, i), amount: i === n - 1 ? r2(t - birim * (n - 1)) : birim, label: n === 1 ? 'Dönem ücreti' : `${i + 1}. taksit` }));
  }
  function odeme(k, payments, bugun) {
    const odenen = r2(sum((payments || []).filter((p) => p && p.stay === k.id && p.kind !== 'depozito'), (p) => p.amount)); let kasa = odenen; const borc = r2(sum(k.plan, (t) => t.amount) + sum(k.charges, (c) => c.amount));
    const satir = (k.plan || []).map((t) => { const a = Number(t.amount) || 0; const o = Math.max(0, Math.min(a, kasa)); kasa = r2(kasa - o); const kalan = r2(a - o); return { ...t, odenen: r2(o), kalan, gecikti: kalan > 0 && t.due < bugun }; });
    return { odenen, borc, kalan: r2(borc - odenen), gecikmis: r2(sum(satir.filter((t) => t.gecikti), (t) => t.kalan)), satir };
  }
  // Depozito: alınan - kesintiler (her kesinti gerekçeli). Kesinti alınanı aşamaz.
  const depoAlinan = (k, payments) => r2(sum((payments || []).filter((p) => p && p.stay === k.id && p.kind === 'depozito' && p.amount > 0), (p) => p.amount));
  const depoIade = (alinan, kesintiler) => { const kes = Math.min(r2(alinan), r2(sum(kesintiler, (x) => x.amount))); return { alinan: r2(alinan), kesinti: kes, iade: r2(alinan - kes) }; };
  // Dönem içi ayrılış önerisi. Rejim oranları yönetmelik metninden (okundu 30.10.2026), ayarla değişir; sonuç öneridir, tutar elle değiştirilir.
  //   GSB, Yükseköğrenim Özel Barınma Hizmetleri Yön. md. 37/10-11 (RG 09.09.2022/31948): 15 Eylül'e kadar bir aylık ücret; sonrası kalınan aylar + içinde bulunulan ay + kalan ayların en çok %50'si
  //   MEB, Ortaokul ve Ortaöğretim Kurumları Özel Barınma Hizmetleri Yön. md. 21/4 (RG 11.09.2020/31241): 15 Eylül'e kadar yıllık ücretin %10'u; sonrası kalınan aylar + içinde bulunulan ay + kalan ayların %30'u
  //   Kurum kusuru, kayıt silme, tedavi gibi cezasız hâllerde yalnızca kalınan aylar mahsup edilir (GSB 37/11, MEB 21/6).
  const REJIM = { gsb: { ad: 'Yükseköğrenim (GSB)', pct: 50 }, meb: { ad: 'Ortaokul ve lise (MEB)', pct: 30 } };
  const aySayisi = (k) => Math.max(1, Math.round(gunFark(k.from, k.to) / 30));
  const gecenAy = (k, gun) => { const [a, b, c] = String(k.from).split('-').map(Number); const [x, y, z] = String(gun).split('-').map(Number); return Math.max(0, (x - a) * 12 + (y - b) - (z < c ? 1 : 0)) + 1; };
  function ayrilisOneri(k, ayrilis, payments, ayarlar = {}) {
    const top = r2(sum(k.plan, (t) => t.amount)); const ay = aySayisi(k); const aylik = r2(top / ay); const rejim = REJIM[ayarlar.rejim] ? ayarlar.rejim : 'gsb'; const pct = ayarlar.leavePct === undefined || ayarlar.leavePct === '' ? REJIM[rejim].pct : Number(ayarlar.leavePct) || 0;
    const kalinan = Math.min(ay, gecenAy(k, ayrilis)); const kalanAy = Math.max(0, ay - kalinan); const e15 = `${String(k.from).slice(0, 4)}-09-15`; const erken = ayrilis <= e15 && String(k.to) > e15; let hak, kural; // 15 Eylül kuralı yalnız o tarihi kapsayan yıllık kayıtta: bahar veya yaz kaydı bir aylık ücrete düşmez
    if (ayarlar.cezasiz) { hak = r2(aylik * kalinan); kural = 'Cezasız ayrılış: yalnızca kalınan aylar'; } else if (erken) { hak = rejim === 'gsb' ? aylik : r2(top * 0.1); kural = rejim === 'gsb' ? `15 Eylül'e kadar: bir aylık ücret` : `15 Eylül'e kadar: yıllık ücretin %10'u`; } else { hak = r2(aylik * kalinan + (aylik * kalanAy * pct) / 100); kural = `Kalınan ${kalinan} ay + kalan ${kalanAy} ay için yüzde ${pct}`; }
    hak = Math.min(top, hak); const odenen = odeme(k, payments, ayrilis).odenen; return { top, ay, aylik, rejim, kalinan, kalanAy, kural, hak, odenen, iade: r2(Math.max(0, odenen - hak)), borc: r2(Math.max(0, hak - odenen)) };
  }
  // Telefon aynı kaldıkça veli kodu korunur; telefon değişirse eski kod yeni kişiye geçmez, yeni kod üretilir
  const veliGuncel = (eski, yeni) => { const d = (x) => String(x || '').replace(/\D/g, '').slice(-10); return eski && eski.portalCode && d(eski.phone) === d(yeni.phone) ? { ...yeni, portalCode: eski.portalCode } : yeni; };
  // Son giriş saati geçti mi: gece yarısından sonra da geçmiş sayılır (sabah 06.00'ya kadar)
  const geceMi = (saat, son) => { const s = son || '23:00'; return s >= '12:00' ? saat >= s || saat < '06:00' : saat >= s && saat < '06:00'; };
  const depozitoFazla = (tutar, aylik) => Number(tutar) > Number(aylik) && Number(aylik) > 0;
  // Giriş-çıkış: son hareket durumu verir. Kapanış saatinden sonra dönmeyen ve izni olmayan öğrenci geç listesine girer.
  const sonHareket = (moves, ogr) => { let s = null; (moves || []).forEach((m) => { if (m && m.student === ogr && (!s || m.at > s.at)) s = m; }); return s; };
  const disarida = (moves, ogr) => { const s = sonHareket(moves, ogr); return !!s && s.type === 'cikis'; };
  const izinli = (leaves, ogr, gun) => (leaves || []).find((l) => l && l.student === ogr && l.status === 'onay' && l.from <= gun && gun <= l.to) || null;
  return { r2, sum, gunFark, addDay, ayEkle, yas, resit, resitDegil, veliPaylasir, aktif, yatakDolu, odaDoluluk, yerlesimHata, taksitler, odeme, depoAlinan, depoIade, ayrilisOneri, REJIM, aySayisi, veliGuncel, geceMi, depozitoFazla, sonHareket, disarida, izinli };
}));
