/* Pazaryeri Kâr & Fiyat Robotu — KDV'li kâr hesabı, strateji kuralları, rakip kaynağı, içe aktarma, demo verisi. Panel ve testler (hesap.test.js) kullanır.
   Komisyon/kargo oranları ÖRNEKTİR; satıcı kendi sözleşmesine göre Kanallar ekranından günceller. */
window.FRB = {
  CH: {
    trendyol: { name: 'Trendyol', short: 'TY', color: '#f27a1a', fee: 8.49, cargo: [[1, 58], [3, 66], [5, 79], [10, 112], [20, 175]] },
    hepsiburada: { name: 'Hepsiburada', short: 'HB', color: '#ff6000', fee: 6.99, cargo: [[1, 55], [3, 63], [5, 76], [10, 108], [20, 168]] },
    n11: { name: 'n11', short: 'N11', color: '#5b2d90', fee: 5.5, cargo: [[1, 60], [3, 69], [5, 82], [10, 115], [20, 180]] },
    amazon: { name: 'Amazon TR', short: 'AMZ', color: '#232f3e', fee: 0, cargo: [[1, 64], [3, 72], [5, 85], [10, 120], [20, 190]] },
  },
  // Canlı fiyat gönderimi: Pazaryeri programıyla aynı doğrulama (docs/urun/ETICARET.md §6, docs/urun/FIYAT-ROBOTU.md). CLAUDE.md §1: doğrulanamayan canlıda seçilemez.
  LIVE: ['trendyol', 'n11'],
  UNVERIFIED: { hepsiburada: 'Hepsiburada API dokümanı doğrulanamadı; canlı mod kapalı.', amazon: 'Amazon TR için API bağlantısı yok; canlı mod kapalı.' },
  // Kategori komisyonları (%): ÖRNEK değerler
  COM: { 'Elektronik aksesuar': { trendyol: 17, hepsiburada: 15, n11: 13, amazon: 12 }, 'Ev & yaşam': { trendyol: 21, hepsiburada: 19, n11: 16, amazon: 15 }, 'Kozmetik': { trendyol: 19, hepsiburada: 18, n11: 14, amazon: 13 }, 'Spor & outdoor': { trendyol: 20, hepsiburada: 18, n11: 15, amazon: 14 }, 'Oyuncak': { trendyol: 20, hepsiburada: 19, n11: 16, amazon: 15 } },
  STRAT: { buybox: 'Buybox kazan (rakibin altına in)', marj: 'Sabit kâr marjını koru', esitle: 'En ucuz rakiple eşitle', sabit: 'Fiyatı değiştirme' },
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  cargoOf(ch, desi, table) { const t = table || FRB.CH[ch].cargo; const r = t.find(([d]) => desi <= d) || t[t.length - 1]; return r[1] + (desi > t[t.length - 1][0] ? Math.ceil(desi - t[t.length - 1][0]) * 7 : 0); },
  // KDV'li hesap: satış KDV'si düşülür; komisyon, kargo ve hizmet bedeli KDV hariç gider sayılır (hizmet KDV'si %20 indirilir).
  // com: % (varsayılan KDV dahil fiyata; comNet: KDV hariç fiyata — taban sözleşmeyle teyit edilir). ad: reklam, KDV dahil fiyatın %'si. extra: paketleme.
  calc({ price, cost, vat = 20, com = 0, fee = 0, cargo = 0, extra = 0, ad = 0, comNet = false }) {
    const netSale = price / (1 + vat / 100); const comEx = comNet ? (netSale * com) / 100 : (price * com) / 100 / 1.2; const adEx = (price * ad) / 100 / 1.2;
    const profit = netSale - cost - comEx - adEx - (fee + cargo) / 1.2 - extra;
    return { netSale, comEx, adEx, comAmt: comEx * 1.2, fee, cargo, profit: Math.round(profit * 100) / 100, margin: price ? Math.round((profit / netSale) * 1000) / 10 : 0, roi: cost ? Math.round((profit / cost) * 1000) / 10 : 0 };
  },
  // Hedef marj (% net satış) için gereken KDV dahil fiyat; marj bu giderlerle mümkün değilse null
  priceFor({ cost, vat = 20, com = 0, fee = 0, cargo = 0, extra = 0, margin = 0, ad = 0, comNet = false }) {
    const k = (1 - margin / 100) / (1 + vat / 100) - (comNet ? com / 100 / (1 + vat / 100) : com / 100 / 1.2) - ad / 100 / 1.2;
    if (k <= 0) return null;
    return Math.ceil(((cost + extra + (fee + cargo) / 1.2) / k) * 100) / 100;
  },
  // Zarar koruması tabanı; hesaplanamıyorsa null (robot o listelemede fiyat önermez)
  floor(params, minPrice, minMargin) { const f = FRB.priceFor({ ...params, margin: Number(minMargin) || 0 }); return f == null ? null : Math.max(Number(minPrice) || 0, f); },
  ending(x, e, lo, hi) { e = Number(e); if (isNaN(e) || e < 0 || e >= 1) return FRB.r2(x); let v = Math.floor(x) + e; if (v > x + 1e-9) v -= 1; if (lo != null && v < lo) v += 1; if (hi != null && v > hi) return FRB.r2(Math.min(x, hi)); return FRB.r2(v); },
  minComp: (L) => ((L.comps || []).length ? Math.min(...L.comps.map((c) => c.price)) : null),
  // Rakip fiyatı gerçek kaynaktan ve taze mi? Demo verisi kaynaksızdır.
  compsReal(L, now = Date.now(), maxHours = 24) { if (!(L.comps || []).length) return true; if (!L.comps.every((c) => c.source)) return false; const t = L.compAt ? new Date(L.compAt).getTime() : 0; return now - t <= (Number(maxHours) || 24) * 36e5; },
  // Strateji → önerilen fiyat. Dönen { skip } robotun öneremediği listelemedir (zarar koruması sessizce kapanmaz).
  propose(L, params, s) {
    if (L.strategy === 'sabit') return null;
    if (!(Number(params.cost) > 0)) return { skip: 'Maliyet girilmemiş' };
    const fl = FRB.floor(params, L.minPrice, s.minMargin); if (fl == null) return { skip: `%${s.minMargin} marj bu giderlerle mümkün değil` };
    const ce = Number(L.maxPrice) > 0 ? Number(L.maxPrice) : Infinity; if (ce < fl) return { skip: `Tavan fiyat (${ce}) tabanın (${fl}) altında` };
    const mc = FRB.minComp(L); let target, why; const u = Number(L.undercut) || 1;
    if (L.strategy === 'buybox') { if (mc == null) return null; target = mc - u; why = `En ucuz rakip ${mc} ₺ → ${u} ₺ altı`; }
    else if (L.strategy === 'esitle') { if (mc == null) return null; target = mc; why = `En ucuz rakiple eşitle (${mc} ₺)`; }
    else { const m = L.targetMargin ?? 15; target = FRB.priceFor({ ...params, margin: Number(m) }); if (target == null) return { skip: `%${m} hedef marj mümkün değil` }; why = `%${m} hedef marj`; }
    let np = Math.min(Math.max(target, fl), ce);
    if (np === fl && target < fl) why += ` · taban fiyatta durdu (zarar koruması %${s.minMargin})`;
    if (np === ce && target > ce) why += ' · tavan fiyatta durdu';
    np = FRB.ending(np, s.ending, fl, ce === Infinity ? null : ce);
    if (Math.abs(np - L.price) < 0.01) return null;
    const pct = L.price ? Math.abs(np / L.price - 1) * 100 : 0;
    return { to: np, why, pct: Math.round(pct * 10) / 10, big: pct > (Number(s.maxStep) || 100) };
  },
  // Trendyol Ürün Buybox Kontrol Servisi (developers.trendyol.com/docs/ürün-buybox-kontrol-servisi-1, güncelleme 20.7.2026): en çok 10 barkod
  buyboxReq(cfg, barcodes) { return { url: `https://apigw.trendyol.com/integration/product/sellers/${encodeURIComponent(cfg.sellerId)}/products/buybox-information`, method: 'POST', headers: { Authorization: 'Basic ' + btoa(`${cfg.apiKey}:${cfg.apiSecret}`), 'User-Agent': `${cfg.sellerId} - SelfIntegration`, 'Content-Type': 'application/json' }, body: JSON.stringify({ barcodes }) }; },
  // Yanıt: buyboxOrder (bizim sıramız), buyboxPrice / secondBuyboxPrice / thirdBuyboxPrice, hasMultipleSeller. Kendi sıramızın fiyatı rakip sayılmaz.
  applyBuybox(L, info, source, at) {
    const o = Number(info.buyboxOrder) || 0; const P = [info.buyboxPrice, info.secondBuyboxPrice, info.thirdBuyboxPrice];
    const comps = info.hasMultipleSeller === false ? [] : P.map((price, i) => ({ price: Number(price), order: i + 1 })).filter((x) => x.price > 0 && x.order !== o).map((x) => ({ seller: `Buybox ${x.order}. sıra`, price: x.price, source, rating: null }));
    L.comps = comps; L.compAt = at; L.buyboxOrder = o; L.buybox = o === 1; return L;
  },
  // Türkçe sayı: "1.234,56" ve "1234.56" güvenli; "1.234" ve "1,234" belirsizdir, tahmin edilmez (null)
  parseNum(v) { if (typeof v === 'number') return isFinite(v) ? v : null; const s = String(v == null ? '' : v).trim().replace(/\s|₺|TL/gi, ''); if (!s) return null; if (/^\d{1,3}[.,]\d{3}$/.test(s)) return null; let t = s; if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s) || /^\d+,\d+$/.test(s)) t = s.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(,\d{3})+\.\d+$/.test(s)) t = s.replace(/,/g, ''); if (!/^-?\d+(\.\d+)?$/.test(t)) return null; return Number(t); },
  chKey(v) { const s = String(v || '').toLocaleLowerCase('tr-TR').replace(/\s/g, ''); return Object.keys(FRB.CH).find((k) => k === s || FRB.CH[k].name.toLocaleLowerCase('tr-TR').replace(/\s/g, '') === s || FRB.CH[k].short.toLocaleLowerCase('tr-TR') === s) || null; },
  // Rakip fiyat dosyası: Barkod veya Stok kodu, Kanal, Rakip fiyat, Satıcı. Hatalı satır uygulanmaz, numarasıyla bildirilir.
  importComps(rows, products, listings, source, at) {
    const by = new Map(); products.forEach((p) => { if (p.barcode) by.set(String(p.barcode).trim(), p); if (p.sku) by.set(String(p.sku).trim(), p); }); const errs = []; const map = new Map();
    rows.forEach((r, i) => { const n = i + 2; const code = String(r['Barkod'] || r['Stok kodu'] || '').trim(); const p = by.get(code); if (!p) return errs.push(`${n}. satır: ürün bulunamadı (${code || 'kod yok'})`); const ch = FRB.chKey(r['Kanal']); if (!ch) return errs.push(`${n}. satır: kanal tanınmadı`); const L = listings.find((x) => x.pid === p.id && x.ch === ch); if (!L) return errs.push(`${n}. satır: ${FRB.CH[ch].name} listelemesi yok`); const price = FRB.parseNum(r['Rakip fiyat']); if (!(price > 0)) return errs.push(`${n}. satır: fiyat okunamadı ("${r['Rakip fiyat']}")`); if (!map.has(L)) map.set(L, []); map.get(L).push({ seller: String(r['Satıcı'] || 'Rakip').slice(0, 60), price, source, rating: null }); });
    return { errs, apply() { map.forEach((comps, L) => { L.comps = comps; L.compAt = at; L.buybox = false; L.buyboxOrder = null; }); return map.size; }, count: map.size };
  },
  // Toplu fiyat değişikliği sonucu: kalem hatası olan barkodlar. Pazaryeri kabulü (batch) tek başına başarı değildir.
  batchFails(items) { return (items || []).filter((i) => /FAIL|ERROR|REJECT|INVALID/i.test(String(i.status || '')) || (i.reasons && i.reasons.length) || (i.errors && i.errors.length)).map((i) => ({ barcode: i.barcode, reason: (i.reasons || i.errors || [])[0] || i.status || 'hata' })); },
  // Senaryo: maliyet / komisyon / kargo değişirse kaç listeleme zarara geçer?
  scenario(rows, { costPct = 0, comAdd = 0, cargoPct = 0 }) { let lossB = 0, lossA = 0, sumB = 0, sumA = 0; const list = []; rows.forEach(({ price, params, id }) => { const b = FRB.calc({ ...params, price }); const pa = { ...params, cost: params.cost * (1 + costPct / 100), com: params.com + comAdd, cargo: params.cargo * (1 + cargoPct / 100) }; const a = FRB.calc({ ...pa, price }); sumB += b.profit; sumA += a.profit; if (b.profit < 0) lossB++; if (a.profit < 0) { lossA++; if (b.profit >= 0) list.push({ id, before: b.profit, after: a.profit, need: FRB.priceFor({ ...pa, margin: 0 }) }); } }); return { n: rows.length, lossB, lossA, sumB: FRB.r2(sumB), sumA: FRB.r2(sumA), list }; },
  seed(db) {
    const { rand, addDays } = NS;
    db.data._settings = { bizName: 'Teknoloji Dünyası', minMargin: 8, ending: 0.9, packCost: 6, maxStep: 20, compMaxAge: 24, adPct: 0, comNet: false };
    db.data.users = [{ id: 'u1', name: 'Kerem Satıcı', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Seda Fiyat', role: 'fiyat', pin: '1234', active: true }, { id: 'u3', name: 'Onur İzleyici', role: 'izleyici', pin: '1234', active: true }];
    db.data.channels = { trendyol: { on: true, mode: 'demo' }, hepsiburada: { on: true, mode: 'demo' }, n11: { on: true, mode: 'demo' }, amazon: { on: true, mode: 'demo' } };
    const P = [['Hızlı Şarj Aleti 20W USB-C', 'Elektronik aksesuar', 92, 1, 249], ['Kablosuz Kulaklık TWS Pro', 'Elektronik aksesuar', 310, 1, 749], ['Powerbank 10000 mAh', 'Elektronik aksesuar', 260, 1, 599], ['Telefon Tutucu Araç', 'Elektronik aksesuar', 48, 1, 179], ['Akıllı Saat Kordonu', 'Elektronik aksesuar', 22, 1, 99], ['Bluetooth Hoparlör Mini', 'Elektronik aksesuar', 280, 2, 649], ['Ring Light 26 cm', 'Elektronik aksesuar', 190, 3, 449], ['Termos 750 ml', 'Ev & yaşam', 140, 2, 379], ['Hava Nemlendirici', 'Ev & yaşam', 240, 3, 599], ['LED Masa Lambası', 'Ev & yaşam', 210, 3, 529], ['Yoga Matı 6 mm', 'Spor & outdoor', 150, 4, 399], ['Direnç Bandı Seti', 'Spor & outdoor', 70, 1, 229], ['Kamp Feneri Şarjlı', 'Spor & outdoor', 120, 2, 329], ['Saç Düzleştirici', 'Kozmetik', 330, 2, 799], ['Yüz Temizleme Cihazı', 'Kozmetik', 160, 1, 449], ['Manyetik Yapı Blokları 64 Parça', 'Oyuncak', 380, 5, 899], ['Uzaktan Kumandalı Araba', 'Oyuncak', 290, 4, 749], ['Kalem Pil 24\'lü', 'Elektronik aksesuar', 95, 1, 239]];
    db.data.products = P.map(([name, cat, cost, desi, base], i) => ({ id: NS.uid(), sku: 'TD-' + (300 + i), barcode: '8683' + String(100000000 + i * 7919).slice(0, 9), name, cat, cost, desi, vat: 20, stock: rand(0, 6) === 0 ? 0 : rand(8, 240), base }));
    const sellers = ['TeknoMarket', 'GadgetEvi', 'AksesuarCity', 'MobilPark', 'DijitalKöşe', 'Hızlı Ticaret', 'EvimShop'];
    db.data.listings = []; db.data.history = [];
    db.data.products.forEach((p, i) => Object.keys(FRB.CH).forEach((ch, k) => {
      if ((i + k) % 5 === 4) return;
      const own = Math.round(p.base * (1 + rand(-6, 10) / 100)) - 0.1;
      const comps = Array.from({ length: rand(1, 4) }, (_, j) => ({ seller: sellers[(i + j + k) % sellers.length], price: Math.round(p.base * (1 + rand(-14, 12) / 100)) - 0.1, rating: (rand(80, 99) / 10).toFixed(1), fast: Math.random() < 0.5 }));
      const min = Math.min(...comps.map((c) => c.price));
      const strat = i % 6 === 5 ? 'sabit' : i % 4 === 1 ? 'marj' : i % 7 === 3 ? 'esitle' : 'buybox';
      const L = { id: NS.uid(), pid: p.id, ch, price: own, strategy: strat, minPrice: null, maxPrice: Math.round(p.base * 1.3), targetMargin: 15, undercut: 1, comps, buybox: own <= min, active: p.stock > 0, updated: addDays(new Date(), -rand(0, 4)).toISOString() };
      db.data.listings.push(L);
      // Son 14 gün fiyat geçmişi (grafik için)
      for (let d = 14; d >= 0; d -= 2) db.data.history.push({ id: NS.uid(), lid: L.id, at: NS.iso(addDays(new Date(), -d)), own: Math.round(own * (1 + rand(-4, 4) / 100)), min: Math.round(min * (1 + rand(-5, 5) / 100)) });
    }));
    db.data.runs = [];
  },
};
