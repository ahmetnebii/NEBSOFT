/* Oto Galeri — araç stoğu, masraf, ekspertiz, ilan ve satış; demo verisi. Panel ve vitrin sayfası kullanır. */
window.GLR = {
  ST: { hazirlik: ['Hazırlıkta', 'warn'], satista: ['Satışta', 'ok'], opsiyon: ['Opsiyonlu', 'info'], satildi: ['Satıldı', ''] },
  SRC: { bireysel: 'Bireyselden alım', takas: 'Takas', ihale: 'İhale / filo', konsinye: 'Konsinye (emanet)' },
  PARTS: ['Kaput', 'Tavan', 'Bagaj', 'Sol ön çamurluk', 'Sol ön kapı', 'Sol arka kapı', 'Sol arka çamurluk', 'Sağ ön çamurluk', 'Sağ ön kapı', 'Sağ arka kapı', 'Sağ arka çamurluk', 'Ön tampon', 'Arka tampon'],
  PST: { orijinal: ['Orijinal', 'ok'], lokal: ['Lokal boyalı', 'warn'], boyali: ['Boyalı', 'warn'], degisen: ['Değişen', 'err'] },
  EXP: ['Ekspertiz', 'Boya / kaporta', 'Mekanik bakım', 'Lastik', 'Detaylı temizlik', 'Noter / devir', 'Muayene', 'Komisyon'],
  cost: (v) => (v.buy || 0) + (v.expenses || []).reduce((s, e) => s + e.amount, 0),
  profit: (v) => (v.source === 'konsinye' ? Math.round(((v.sale ? v.sale.price : v.listPrice) * (v.commission || 3)) / 100) - (v.expenses || []).reduce((s, e) => s + e.amount, 0) : (v.sale ? v.sale.price : v.listPrice) - GLR.cost(v)),
  days: (v) => Math.floor(((v.sale ? new Date(v.sale.at) : new Date()) - new Date(v.buyDate)) / 864e5),
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Yıldırım Otomotiv', bizPhone: '0232 444 35 35', bizAddress: 'Gaziemir Oto Galericiler Sitesi No:18, İzmir', staleDays: 60, kaskoRate: 1.8 };
    db.data.users = [{ id: 'u1', name: 'Tuncay Yıldırım', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Barış Satış', role: 'satis', pin: '1234', active: true }];
    const M = [['Renault', 'Clio', '1.0 TCe Touch', 'Hatchback', 'Benzin', 'Manuel', 1150000], ['Fiat', 'Egea', '1.4 Fire Easy', 'Sedan', 'Benzin', 'Manuel', 920000], ['Volkswagen', 'Passat', '1.5 TSI Business', 'Sedan', 'Benzin', 'Otomatik', 2350000], ['Toyota', 'Corolla', '1.8 Hybrid Flame', 'Sedan', 'Hibrit', 'Otomatik', 1650000], ['Hyundai', 'i20', '1.4 MPI Jump', 'Hatchback', 'Benzin', 'Otomatik', 1050000], ['Ford', 'Focus', '1.5 TDCi Titanium', 'Hatchback', 'Dizel', 'Otomatik', 1420000], ['Peugeot', '3008', '1.5 BlueHDi Allure', 'SUV', 'Dizel', 'Otomatik', 2150000], ['Dacia', 'Duster', '1.5 dCi Prestige', 'SUV', 'Dizel', 'Manuel', 1180000], ['BMW', '3.20i', 'M Sport', 'Sedan', 'Benzin', 'Otomatik', 3150000], ['Mercedes', 'C 200', 'AMG', 'Sedan', 'Benzin', 'Otomatik', 3600000], ['Honda', 'Civic', '1.6 Eco Elegance', 'Sedan', 'LPG', 'Otomatik', 1300000], ['Opel', 'Astra', '1.4 Turbo Enjoy', 'Hatchback', 'Benzin', 'Otomatik', 1080000], ['Renault', 'Megane', '1.5 dCi Touch', 'Sedan', 'Dizel', 'Otomatik', 1250000], ['Citroen', 'C3', '1.2 PureTech Feel', 'Hatchback', 'Benzin', 'Manuel', 940000], ['Volkswagen', 'Golf', '1.5 eTSI Style', 'Hatchback', 'Benzin', 'Otomatik', 1850000], ['Skoda', 'Octavia', '1.5 TSI Premium', 'Sedan', 'Benzin', 'Otomatik', 1750000]];
    const colors = ['Beyaz', 'Gri', 'Siyah', 'Lacivert', 'Kırmızı', 'Gümüş'];
    db.data.vehicles = M.map(([brand, model, pkg, body, fuel, gear, base], i) => {
      const year = rand(2016, 2023); const age = 2026 - year; const km = age * rand(9, 22) * 1000;
      const value = Math.round((base * (1 - age * 0.045) * (1 - km / 2e6)) / 5000) * 5000;
      const source = i % 6 === 4 ? 'konsinye' : i % 5 === 2 ? 'takas' : pick(['bireysel', 'bireysel', 'ihale']);
      const buyDate = NS.iso(addDays(new Date(), -rand(5, 110)));
      const parts = Object.fromEntries(GLR.PARTS.map((p, k) => [p, (i + k) % 9 === 0 ? 'boyali' : (i + k) % 13 === 5 ? 'lokal' : (i * k) % 31 === 7 ? 'degisen' : 'orijinal']));
      const expenses = [{ id: NS.uid(), type: 'Ekspertiz', amount: 3500, at: buyDate }, ...(Object.values(parts).some((x) => x !== 'orijinal') ? [{ id: NS.uid(), type: 'Boya / kaporta', amount: rand(3, 18) * 1000, at: buyDate }] : []), { id: NS.uid(), type: 'Detaylı temizlik', amount: 2500, at: buyDate }, ...(Math.random() < 0.5 ? [{ id: NS.uid(), type: 'Mekanik bakım', amount: rand(4, 15) * 1000, at: buyDate }] : [])];
      const v = { id: NS.uid(), stockNo: 'G' + (300 + i), plate: `35 ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(70 + (i % 18))} ${rand(100, 999)}`, brand, model, pkg, body, fuel, gear, year, km, color: pick(colors), source, buy: source === 'konsinye' ? 0 : Math.round(value * 0.9 / 5000) * 5000, buyDate, owner: source === 'konsinye' ? { name: NS.NAMES[i], phone: NS.phone(), want: value } : null, commission: 3, listPrice: Math.round(value * 1.04 / 5000) * 5000, minPrice: Math.round(value * 0.98 / 5000) * 5000, tramer: (i % 4 === 1 ? rand(8, 85) * 1000 : 0), parts, expenses, status: i < 2 ? 'hazirlik' : 'satista', ads: i < 2 ? {} : { sahibinden: { no: String(rand(1100000000, 1199999999)), views: rand(200, 4800), fav: rand(3, 120) }, ...(i % 2 ? { arabam: { no: String(rand(30000000, 39999999)), views: rand(100, 2400), fav: rand(1, 60) } } : {}) }, desc: `${year} model, ${NS.num(km)} km, ${pick(['tek elden', 'servis bakımlı', 'garaj arabası', 'yeni muayeneli'])}. ${fuel === 'Dizel' ? 'Yakıt cimrisi.' : ''}` };
      return v;
    });
    // Satılmış araçlar (geçmiş)
    for (let k = 0; k < 14; k++) {
      const src = pick(M); const year = rand(2015, 2022); const buy = Math.round((src[6] * (1 - (2026 - year) * 0.05)) / 5000) * 5000;
      const bd = addDays(new Date(), -rand(40, 200)); const sd = addDays(bd, rand(8, 70)); if (sd > new Date()) continue;
      db.data.vehicles.push({ id: NS.uid(), stockNo: 'G' + (200 + k), plate: `35 S${String.fromCharCode(65 + k)} ${rand(100, 999)}`, brand: src[0], model: src[1], pkg: src[2], body: src[3], fuel: src[4], gear: src[5], year, km: rand(40, 190) * 1000, color: pick(colors), source: 'bireysel', buy, buyDate: NS.iso(bd), listPrice: Math.round(buy * 1.1 / 5000) * 5000, minPrice: buy, tramer: 0, parts: {}, expenses: [{ id: NS.uid(), type: 'Ekspertiz', amount: 3500, at: NS.iso(bd) }, { id: NS.uid(), type: 'Detaylı temizlik', amount: 2500, at: NS.iso(bd) }], status: 'satildi', ads: {}, sale: { at: sd.toISOString(), price: Math.round(buy * (1 + rand(4, 11) / 100) / 1000) * 1000, buyer: NS.NAMES[(k * 7) % 30], phone: NS.phone(), pay: pick(['Peşin', 'Kredi', 'Takas + nakit']) } });
    }
    db.data.leads = [['Ayşe Kaya', 'SUV, otomatik, 1,5 milyona kadar', 'SUV', 1500000], ['Mehmet Demir', 'Passat veya Octavia, dizel olabilir', 'Sedan', 2200000], ['Elif Aydın', 'İlk araba, küçük, otomatik', 'Hatchback', 1100000], ['Burak Güneş', 'Hibrit sedan', 'Sedan', 1800000], ['Seda Bulut', 'Takaslı Egea satıp SUV almak istiyor', 'SUV', 1400000]].map(([name, note, body, budget], i) => ({ id: NS.uid(), name, phone: NS.phone(), note, body, budget, at: addDays(new Date(), -rand(0, 12)).toISOString(), status: i < 3 ? 'yeni' : 'arandi', source: pick(['sahibinden', 'Telefon', 'Galeriye geldi', 'Instagram']) }));
  },
};
