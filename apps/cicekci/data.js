/* Çiçekçi: durumlar, müşteri sayfası ayarı, demo verisi. Fiyatlar örnektir. */
window.CICEKCI = {
  STATUS: [
    { id: 'alindi', name: 'Sipariş alındı', color: '#0284c7', icon: 'file' },
    { id: 'hazirlaniyor', name: 'Hazırlanıyor', color: '#7c3aed', icon: 'flower' },
    { id: 'hazir', name: 'Hazır', color: '#16a34a', icon: 'check' },
    { id: 'yolda', name: 'Kuryede', color: '#d97706', icon: 'truck' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
  ],
  seed(db) {
    db.data.zones = [{ id: 'b0', name: 'Kadıköy', fee: 150 }, { id: 'b1', name: 'Üsküdar', fee: 200 }, { id: 'b2', name: 'Ataşehir', fee: 250 }];
    db.data.stems = [['Kırmızı gül', 200, 7, 0], ['Beyaz lilyum', 60, 8, 3], ['Papatya', 120, 5, 4], ['Okaliptus', 40, 12, 2]].map(([name, qty, life, age], i) => ({ id: 'k' + i, name, qty, life, inDate: NS.iso(NS.addDays(new Date(), -age)) }));
    db.data.fire = [];
    window.SIPTOHUM(db, {
      prefix: 'CC', akis: ['alindi', 'hazirlaniyor', 'hazir', 'yolda'], adres: true, teslimDurum: 'yolda',
      ayar: { bizName: 'Örnek Çiçekçi', bizPhone: '0216 000 00 00', bizAddress: 'Kadıköy, İstanbul', defaultDays: 1, smsHazir: false, autoPrint: false, smsTeslim: true },
      users: [{ id: 'u1', name: 'Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tezgâh', role: 'tezgah', pin: '1234', active: true }, { id: 'u3', name: 'Kurye', role: 'kurye', pin: '1234', active: true, courier: 's2' }],
      staff: [{ id: 's1', name: 'Selin Tasarımcı', skill: 'Buket' }, { id: 's2', name: 'Burak Kurye', skill: 'Dağıtım', kurye: true, phone: NS.phone() }],
      services: [['Gül buketi', 'Buket', 'adet', 1200], ['Mevsim buketi', 'Buket', 'adet', 850], ['Masa aranjmanı', 'Aranjman', 'adet', 1500], ['Orkide', 'Saksı', 'adet', 1100], ['Açılış çelengi', 'Çelenk', 'adet', 2200], ['Cenaze çelengi', 'Çelenk', 'adet', 2000]].map(([name, cat, unit, price]) => ({ name, cat, unit, price })),
      satir: (s) => ({ sid: s.id, name: s.name, unit: s.unit, price: s.price, qty: 1 }),
      ek: (o, c, k) => { o.mode = 'adres'; o.address = o.address || c.address; o.recipient = NS.NAMES[(k + 7) % NS.NAMES.length]; o.recipientPhone = NS.phone(); o.cardNote = NS.pick(['Nice mutlu yıllara', 'Geçmiş olsun', 'Sevgilerimle', '']); o.fee = 150; o.zone = 'Kadıköy'; o.dueTime = NS.pick(['10:00-12:00', '12:00-15:00', '15:00-18:00']); },
    });
    db.data.occasions = db.data.customers.slice(0, 6).map((c, i) => ({ id: 'g' + i, customer: c.id, title: NS.pick(['Eş doğum günü', 'Evlilik yıl dönümü', 'Anne doğum günü']), date: NS.iso(NS.addDays(new Date(), 2 + i * 6)).slice(5), recipient: NS.NAMES[i + 3], consent: false }));
  },
};
window.SIPTAKIP = { id: 'cicekci', status: window.CICEKCI.STATUS, seed: window.CICEKCI.seed, baslik: 'Sipariş durumu sorgulama', soru: 'Çiçeğiniz nerede?', icon: 'flower', kodMetni: 'Sipariş fişinizdeki 8 haneli takip kodunu yazın. Hazırlık, kurye ve teslim bilgisini görürsünüz.', hazirBaslik: 'Siparişiniz hazır, kuryeye verilecek' };
