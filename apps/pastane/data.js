/* Fırın ve pastane: durumlar, müşteri sayfası ayarı, demo verisi. Fiyat ve maliyetler örnektir. */
window.PASTANE = {
  STATUS: [
    { id: 'alindi', name: 'Sipariş alındı', color: '#0284c7', icon: 'file' },
    { id: 'uretim', name: 'Üretimde', color: '#7c3aed', icon: 'chef' },
    { id: 'susleme', name: 'Süsleme', color: '#db2777', icon: 'sparkles' },
    { id: 'hazir', name: 'Hazır', color: '#16a34a', icon: 'check' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
  ],
  seed(db) {
    const I = [['Un', 'kg', 32, 60], ['Şeker', 'kg', 42, 40], ['Yumurta', 'adet', 4.5, 300], ['Süt', 'lt', 35, 30], ['Tereyağı', 'kg', 380, 12], ['Krema', 'lt', 140, 15], ['Bitter çikolata', 'kg', 420, 8], ['Çilek', 'kg', 160, 5]].map(([name, unit, cost, stock], i) => ({ id: 'm' + i, name, unit, cost, stock, min: 5 }));
    db.data.ingredients = I;
    db.data.recipes = [
      { id: 'r0', name: 'Çikolatalı yaş pasta', cat: 'Yaş pasta', yield: 1, items: [{ ing: 'm0', qty: 0.5 }, { ing: 'm1', qty: 0.3 }, { ing: 'm2', qty: 6 }, { ing: 'm5', qty: 0.5 }, { ing: 'm6', qty: 0.3 }] },
      { id: 'r1', name: 'Çilekli yaş pasta', cat: 'Yaş pasta', yield: 1, items: [{ ing: 'm0', qty: 0.5 }, { ing: 'm1', qty: 0.3 }, { ing: 'm2', qty: 6 }, { ing: 'm5', qty: 0.5 }, { ing: 'm7', qty: 0.4 }] },
      { id: 'r2', name: 'Kurabiye', cat: 'Kuru pasta', yield: 2, items: [{ ing: 'm0', qty: 1 }, { ing: 'm1', qty: 0.3 }, { ing: 'm4', qty: 0.4 }, { ing: 'm2', qty: 2 }] },
    ];
    db.data.plans = [{ id: 'p0', date: NS.today(), rc: 'r2', qty: 8, done: false }]; db.data.waste = [{ id: 'w0', at: new Date().toISOString(), name: 'Kurabiye', rc: 'r2', qty: 1, reason: 'Bayat', cost: 102.8 }];
    window.SIPTOHUM(db, {
      prefix: 'PS', akis: ['alindi', 'uretim', 'susleme', 'hazir'], adres: true,
      ayar: { bizName: 'Örnek Pastane', bizPhone: '0216 000 00 00', bizAddress: 'Moda, İstanbul', defaultDays: 2, smsHazir: true, autoPrint: false, iptalKosul: '' },
      users: [{ id: 'u1', name: 'Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tezgâh', role: 'tezgah', pin: '1234', active: true }, { id: 'u3', name: 'Usta', role: 'usta', pin: '1234', active: true }, { id: 'u4', name: 'Kurye', role: 'kurye', pin: '1234', active: true, courier: 's2' }],
      staff: [{ id: 's1', name: 'Fatma Usta', skill: 'Pasta ustası' }, { id: 's2', name: 'Ali Kurye', skill: 'Dağıtım', kurye: true, phone: NS.phone() }],
      services: [['Çikolatalı yaş pasta', 'Yaş pasta', 'adet', 1400, 'r0'], ['Çilekli yaş pasta', 'Yaş pasta', 'adet', 1500, 'r1'], ['Kurabiye (kg)', 'Kuru pasta', 'kg', 650, 'r2'], ['Butik pasta', 'Yaş pasta', 'adet', 2800, '']].map(([name, cat, unit, price, rc]) => ({ name, cat, unit, price, rc })),
      satir: (s) => ({ sid: s.id, name: s.name, unit: s.unit, price: s.price, qty: s.unit === 'kg' ? NS.rand(1, 3) : 1 }),
      ek: (o) => { o.kisi = NS.pick([8, 12, 20, 30]); o.yazi = NS.pick(['İyi ki doğdun Ece', 'Mutlu yıllar', '']); o.flavor = NS.pick(['Çikolata', 'Çilek', 'Muz']); o.alerjen = Math.random() < 0.2 ? 'Fıstık alerjisi' : ''; if (!o.dueTime) o.dueTime = '16:00'; },
    });
  },
};
window.SIPTAKIP = { id: 'pastane', status: window.PASTANE.STATUS, seed: window.PASTANE.seed, baslik: 'Sipariş durumu sorgulama', soru: 'Siparişiniz ne durumda?', icon: 'chef', kodMetni: 'Sipariş fişinizdeki 8 haneli takip kodunu yazın. Aşamayı, teslim saatini ve kalan tutarı görürsünüz.', hazirBaslik: 'Siparişiniz hazır',
  talep: { baslik: 'Özel sipariş talebi', metin: 'Ne istediğinizi yazın, işletme sizi arayarak fiyat ve kaporayı netleştirir. Talep, işletme onaylayana kadar sipariş sayılmaz.', adres: 'isteğe bağlı' } };
