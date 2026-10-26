/* Teknik servis demo verisi ve ortak tanımlar — panel ve müşteri takip sayfası kullanır */
window.SERVIS = {
  STATUS: [
    { id: 'kabul', name: 'Kabul edildi', color: '#64748b', icon: 'box' },
    { id: 'inceleme', name: 'Arıza tespiti', color: '#0284c7', icon: 'search' },
    { id: 'onay', name: 'Müşteri onayı bekliyor', color: '#d97706', icon: 'clock' },
    { id: 'tamirde', name: 'Tamirde', color: '#7c3aed', icon: 'wrench' },
    { id: 'parca', name: 'Parça bekleniyor', color: '#db2777', icon: 'truck' },
    { id: 'hazir', name: 'Teslime hazır', color: '#16a34a', icon: 'check' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
    { id: 'iade', name: 'Tamir edilemedi / iade', color: '#dc2626', icon: 'x' },
  ],
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Teknoloji Doktoru Servis', bizPhone: '0216 333 22 11', bizAddress: 'Kadıköy Çarşı, Moda Cad. No:5', warrantyDays: 90, terms: 'Cihaz 90 gün içinde teslim alınmazsa sorumluluk kabul edilmez. Veri yedeği müşteri sorumluluğundadır. Garanti yalnızca yapılan işlem ve değişen parçayı kapsar.' };
    db.data.users = [{ id: 'u1', name: 'Murat Aydın', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Emre Teknisyen', role: 'teknisyen', pin: '1234', active: true }, { id: 'u3', name: 'Seda Kabul', role: 'kabul', pin: '1234', active: true }];
    db.data.techs = [{ id: 't1', name: 'Emre Yıldız', skill: 'Telefon & tablet' }, { id: 't2', name: 'Can Kurt', skill: 'Bilgisayar & laptop' }, { id: 't3', name: 'Oğuz Tan', skill: 'Beyaz eşya & klima' }];
    db.data.parts = [
      ['Ekran (iPhone 13)', 'Telefon', 3200, 4800, 4], ['Ekran (Samsung A54)', 'Telefon', 1900, 2900, 6], ['Batarya (iPhone 11-13)', 'Telefon', 650, 1200, 12], ['Şarj soketi Type-C', 'Telefon', 90, 350, 25], ['Arka kapak cam', 'Telefon', 250, 700, 8],
      ['SSD 512GB NVMe', 'Bilgisayar', 1400, 2200, 7], ['RAM 8GB DDR4', 'Bilgisayar', 650, 1100, 10], ['Laptop klavye', 'Bilgisayar', 450, 1000, 5], ['Termal macun + bakım', 'Bilgisayar', 60, 450, 40], ['Laptop adaptör 65W', 'Bilgisayar', 380, 750, 9],
      ['Çamaşır mak. pompa', 'Beyaz eşya', 420, 950, 4], ['Buzdolabı termostat', 'Beyaz eşya', 280, 700, 6], ['Klima gaz dolumu', 'Klima', 300, 1200, 30],
    ].map(([name, cat, cost, price, stock], i) => ({ id: 'p' + i, name, cat, cost, price, stock, min: 3 }));
    db.data.customers = NS.NAMES.slice(0, 24).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), email: NS.slug(n).replace('-', '.') + '@mail.com' }));
    const devices = [['Telefon', 'Apple', 'iPhone 13', 'Ekran kırık, dokunmatik çalışmıyor', 't1'], ['Telefon', 'Samsung', 'Galaxy A54', 'Şarj olmuyor', 't1'], ['Telefon', 'Xiaomi', 'Redmi Note 12', 'Suya düştü, açılmıyor', 't1'], ['Laptop', 'Lenovo', 'IdeaPad 5', 'Çok ısınıyor, kendiliğinden kapanıyor', 't2'], ['Laptop', 'HP', 'Pavilion 15', 'Açılmıyor, şarj ışığı yanıyor', 't2'], ['Bilgisayar', 'Casper', 'Excalibur', 'Yavaş çalışıyor, format + SSD', 't2'], ['Tablet', 'Apple', 'iPad 9', 'Batarya çabuk bitiyor', 't1'], ['Çamaşır makinesi', 'Arçelik', '9 kg', 'Su boşaltmıyor', 't3'], ['Klima', 'Daikin', '12000 BTU', 'Soğutmuyor', 't3'], ['Buzdolabı', 'Bosch', 'No-Frost', 'Alt bölme soğutmuyor', 't3']];
    const flow = ['kabul', 'inceleme', 'onay', 'tamirde', 'parca', 'hazir', 'teslim'];
    const tickets = [];
    for (let k = 0; k < 64; k++) {
      const [type, brand, model, issue, tech] = pick(devices);
      const ageDays = k < 18 ? rand(0, 6) : rand(7, 60);
      const at = addDays(new Date(), -ageDays); at.setHours(rand(9, 19), rand(0, 59));
      let status = ageDays > 6 ? (Math.random() < 0.9 ? 'teslim' : 'iade') : pick(flow.slice(0, 6));
      const part = pick(db.data.parts.filter((p) => (tech === 't1' ? p.cat === 'Telefon' : tech === 't2' ? p.cat === 'Bilgisayar' : ['Beyaz eşya', 'Klima'].includes(p.cat))));
      const needParts = !['kabul', 'inceleme'].includes(status) && status !== 'iade';
      const labor = pick([300, 450, 600, 800]);
      const t = {
        id: 'sv' + k, no: 'SRV' + (5000 + k), code: Math.random().toString(36).slice(2, 8).toUpperCase(), customer: pick(db.data.customers).id, type, brand, model, serial: String(rand(100000000, 999999999)) + rand(100000, 999999),
        accessories: pick(['Şarj aleti', 'Kılıf', 'Yok', 'Çanta + adaptör']), issue, condition: pick(['Kasada çizikler var', 'Temiz', 'Köşede ezik', 'Arka cam çatlak']), lockCode: type === 'Telefon' ? String(rand(1000, 9999)) : '',
        tech, status, received: at.toISOString(), promised: addDays(at, rand(2, 5)).toISOString(), estimate: needParts ? part.price + labor : 0, approved: ['tamirde', 'parca', 'hazir', 'teslim'].includes(status),
        parts: needParts ? [{ pid: part.id, name: part.name, qty: 1, price: part.price, cost: part.cost }] : [], labor: needParts ? labor : 0, payments: status === 'teslim' ? [{ type: pick(['nakit', 'kart']), amount: part.price + labor, at: addDays(at, 3).toISOString() }] : [], deposit: 0,
        log: [{ at: at.toISOString(), status: 'kabul', note: 'Cihaz teslim alındı' }], diagnosis: needParts ? `${part.name} değişimi gerekli` : '', priority: Math.random() < 0.15 ? 'acil' : 'normal',
      };
      if (status !== 'kabul') t.log.push({ at: addDays(at, 0.5).toISOString(), status: 'inceleme', note: 'Arıza tespiti yapılıyor' });
      if (t.approved) t.log.push({ at: addDays(at, 1).toISOString(), status: 'tamirde', note: 'Müşteri fiyatı onayladı' });
      if (['hazir', 'teslim'].includes(status)) t.log.push({ at: addDays(at, 2).toISOString(), status: 'hazir', note: 'Onarım tamamlandı, test edildi' });
      if (status === 'teslim') { t.log.push({ at: addDays(at, 3).toISOString(), status: 'teslim', note: 'Müşteriye teslim edildi' }); t.delivered = addDays(at, 3).toISOString(); }
      if (status === 'iade') t.log.push({ at: addDays(at, 2).toISOString(), status: 'iade', note: 'Anakart arızası — ekonomik değil' });
      if (status === 'onay') t.log.push({ at: addDays(at, 1).toISOString(), status: 'onay', note: `Fiyat teklifi: ${NS.money(t.estimate)}` });
      tickets.push(t);
    }
    db.data.tickets = tickets;
    db.data._meta._seq_tickets = 5100;
    db.data.sms = [];
  },
};
