/* Pazaryeri Kâr & Fiyat Robotu — KDV'li kâr hesabı, strateji kuralları, demo verisi.
   Komisyon/kargo oranları örnektir; satıcı kendi sözleşmesine göre Kanallar ekranından günceller. */
window.FRB = {
  CH: {
    trendyol: { name: 'Trendyol', short: 'TY', color: '#f27a1a', fee: 8.49, cargo: [[1, 58], [3, 66], [5, 79], [10, 112], [20, 175]] },
    hepsiburada: { name: 'Hepsiburada', short: 'HB', color: '#ff6000', fee: 6.99, cargo: [[1, 55], [3, 63], [5, 76], [10, 108], [20, 168]] },
    n11: { name: 'n11', short: 'N11', color: '#5b2d90', fee: 5.5, cargo: [[1, 60], [3, 69], [5, 82], [10, 115], [20, 180]] },
    amazon: { name: 'Amazon TR', short: 'AMZ', color: '#232f3e', fee: 0, cargo: [[1, 64], [3, 72], [5, 85], [10, 120], [20, 190]] },
  },
  // Kategori komisyonları (% , KDV dahil satış fiyatı üzerinden)
  COM: { 'Elektronik aksesuar': { trendyol: 17, hepsiburada: 15, n11: 13, amazon: 12 }, 'Ev & yaşam': { trendyol: 21, hepsiburada: 19, n11: 16, amazon: 15 }, 'Kozmetik': { trendyol: 19, hepsiburada: 18, n11: 14, amazon: 13 }, 'Spor & outdoor': { trendyol: 20, hepsiburada: 18, n11: 15, amazon: 14 }, 'Oyuncak': { trendyol: 20, hepsiburada: 19, n11: 16, amazon: 15 } },
  STRAT: { buybox: 'Buybox kazan (rakibin altına in)', marj: 'Sabit kâr marjını koru', esitle: 'En ucuz rakiple eşitle', sabit: 'Fiyatı değiştirme' },
  cargoOf(ch, desi, table) { const t = table || FRB.CH[ch].cargo; const r = t.find(([d]) => desi <= d) || t[t.length - 1]; return r[1] + (desi > t[t.length - 1][0] ? Math.ceil(desi - t[t.length - 1][0]) * 7 : 0); },
  // KDV'li hesap: satış KDV'si düşülür, komisyon/kargo/hizmet bedelinin %20 KDV'si indirilir
  calc({ price, cost, vat = 20, com = 0, fee = 0, cargo = 0, extra = 0 }) {
    const netSale = price / (1 + vat / 100); const comAmt = (price * com) / 100;
    const ded = (comAmt + fee + cargo) / 1.2;
    const profit = netSale - cost - ded - extra;
    return { netSale, comAmt, fee, cargo, profit: Math.round(profit * 100) / 100, margin: price ? Math.round((profit / netSale) * 1000) / 10 : 0, roi: cost ? Math.round((profit / cost) * 1000) / 10 : 0 };
  },
  // Hedef marj (% net satış) için gereken KDV dahil fiyat
  priceFor({ cost, vat = 20, com = 0, fee = 0, cargo = 0, extra = 0, margin = 0 }) {
    const k = (1 - margin / 100) / (1 + vat / 100) - com / 100 / 1.2;
    if (k <= 0) return null;
    return Math.ceil(((cost + extra + (fee + cargo) / 1.2) / k) * 100) / 100;
  },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Teknoloji Dünyası', minMargin: 8, step: 0.5, ending: 0.9, autoRun: false, packCost: 6 };
    db.data.users = [{ id: 'u1', name: 'Kerem Satıcı', role: 'admin', pin: '1234', active: true }];
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
