/* Düğün Salonu demo verisi — panel ve müşteri sayfası (salon.html) kullanır. Kişi, salon ve fiyatlar örnektir. */
window.DUGUN = {
  // Örnek iptal kademeleri ve sözleşme metni işletmenin kendi metniyle değiştirilir: hukuki danışmanlık değildir
  KADEME: [{ days: 180, pct: 75 }, { days: 90, pct: 50 }, { days: 30, pct: 25 }],
  SOZLESME: 'ÖRNEK ŞABLON: Bu metin bağlayıcı hukuki metin değildir; kullanmadan önce avukatınıza gösterin.\n\n{{isletme}} ile {{musteri}} arasında {{tarih}} tarihinde, {{salon}} salonunda {{etkinlikTarihi}} {{seans}} seansında yapılacak {{tur}} için aşağıdaki kalemlerle ve {{toplam}} toplam bedelle anlaşılmıştır.\n\nKapora toplam bedelden düşülür. Ödemeler bu sözleşmedeki plana göre yapılır. Sözleşmede yazmayan hiçbir ek ücret alınmaz; sonradan istenen değişiklikler ancak iki tarafın imzaladığı ek protokolle geçerli olur.\n\nİptal: {{iptal}}\n\nİşletme, kapalı olduğu veya hizmet veremediği durumda müşteriye derhal bilgi verir ve aldığı bedeli geri öder.',
  seed(db) {
    const { rand, pick, addDays, iso } = NS; const H = window.DUGUN_HESAP; const bugun = iso(new Date());
    db.data._settings = { bizName: 'Saray Bahçe Düğün Salonu', bizPhone: '0312 444 22 11', bizAddress: 'Yenimahalle, Atatürk Bulvarı No:120 Ankara', holdDays: 7, sonGun: 7, depositPct: 20, discMax: 5, cancelTiers: window.DUGUN.KADEME, contractText: window.DUGUN.SOZLESME, iban: '', showPrices: true, smsDays: 7 };
    db.data.users = [{ id: 'u1', name: 'Nilgün Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Berk Satış', role: 'satis', pin: '1234', active: true }, { id: 'u3', name: 'Sevda Operasyon', role: 'operasyon', pin: '1234', active: true }];
    db.data.halls = [{ id: 'h1', name: 'Kristal Salon', capacity: 450, color: '#be185d', desc: 'Kapalı salon, sahne ve gelin odası' }, { id: 'h2', name: 'Bahçe', capacity: 300, color: '#059669', desc: 'Açık hava, yağmur planı kapalı salon' }];
    db.data.packages = [
      { id: 'p1', name: 'Yemeksiz Salon', price: 95000, perPerson: false, minGuests: 0, weekendPct: 25, desc: 'Salon, masa düzeni, ses ve ışık', includes: 'Salon kullanımı\nMasa ve sandalye\nSes ve ışık sistemi\nGelin odası' },
      { id: 'p2', name: 'İkramlı Paket', price: 650, perPerson: true, minGuests: 150, weekendPct: 20, desc: 'Pasta, meşrubat ve çerez ikramı', includes: 'Salon kullanımı\nDüğün pastası\nMeşrubat ve çerez\nSes ve ışık sistemi' },
      { id: 'p3', name: 'Yemekli Paket', price: 1450, perPerson: true, minGuests: 150, weekendPct: 20, desc: 'Üç çeşit yemek, pasta ve meşrubat', includes: 'Salon kullanımı\nÜç çeşit yemek\nDüğün pastası\nMeşrubat\nSes ve ışık sistemi' },
      { id: 'p4', name: 'Nişan & Kına', price: 60000, perPerson: false, minGuests: 0, weekendPct: 15, desc: 'Gündüz seansında küçük davetler', includes: 'Salon kullanımı\nKına düzeni\nMeşrubat' },
    ];
    db.data.extras = [['e1', 'DJ', 18000], ['e2', 'Canlı orkestra', 45000], ['e3', 'Fotoğraf ve video', 30000], ['e4', 'Gelin arabası süsleme', 6000], ['e5', 'Havai fişek gösterisi', 12000], ['e6', 'Çiçek süsleme', 22000], ['e7', 'Sahne dekoru', 15000], ['e8', 'Vale hizmeti', 8000]].map(([id, name, price]) => ({ id, name, price }));
    db.data.seasons = [{ id: 'z1', name: 'Yaz sezonu', from: `${bugun.slice(0, 4)}-06-01`, to: `${bugun.slice(0, 4)}-09-15`, pct: 15 }, { id: 'z2', name: 'Gelecek yaz', from: `${Number(bugun.slice(0, 4)) + 1}-06-01`, to: `${Number(bugun.slice(0, 4)) + 1}-09-15`, pct: 15 }];
    db.data.customers = NS.NAMES.slice(0, 34).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), partner: i % 2 ? pick(NS.NAMES) : '', note: '' }));
    db.data.events = []; db.data.payments = []; db.data.signedDocs = []; db.data.sms = [];
    const salonlar = db.data.halls;
    for (let i = 0; i < 44; i++) {
      const date = iso(addDays(new Date(), i < 12 ? -rand(3, 90) : rand(3, 300))); const hall = pick(salonlar); const seans = pick(['aksam', 'aksam', 'gunduz']); const r = { hall: hall.id, date, seans };
      if (H.cakisan(db.data.events, r, bugun)) continue;
      const pkg = pick(db.data.packages); const guests = rand(120, hall.capacity); const pkgPrice = H.paketFiyat(pkg, { guests, date, seasons: db.data.seasons }); const extras = [pick(db.data.extras), pick(db.data.extras)].filter((x, k, a) => a.indexOf(x) === k).map((x) => ({ id: NS.uid(), ref: x.id, name: x.name, qty: 1, price: x.price }));
      const c = db.data.customers[i % db.data.customers.length]; const status = date < bugun ? 'tamam' : i % 6 === 0 ? 'opsiyon' : 'kesin'; const id = 'ev' + i;
      const e = { id, no: db.nextNo('events', 'DGN'), customer: c.id, hall: hall.id, date, seans, type: pkg.id === 'p4' ? pick(['Nişan', 'Kına']) : pick(H.TUR.slice(0, 5)), guests, pkg: pkg.id, pkgName: pkg.name, pkgPrice, extras, discount: 0, status, holdUntil: status === 'opsiyon' ? iso(addDays(new Date(), rand(-1, 7))) : '', note: '', tasks: H.hazirlik(date), log: [], addenda: [], created: addDays(new Date(), -rand(10, 200)).toISOString() };
      const genel = H.toplam(e).genel; const dep = status === 'opsiyon' ? 0 : H.r2(genel * 0.2);
      e.plan = H.plan({ total: genel, deposit: dep, taksit: 3, date, sonGun: 7, bugun: date < bugun ? iso(addDays(date, -120)) : bugun }).map((t) => ({ id: NS.uid(), ...t })); e.tasks.forEach((t) => { t.done = t.due < bugun && Math.random() < 0.9; });
      db.data.events.push(e);
      if (status !== 'opsiyon') e.plan.forEach((t, k) => { if (t.due <= bugun && (k === 0 || Math.random() < 0.8)) db.data.payments.push({ id: NS.uid(), event: id, amount: t.amount, at: new Date(t.due + 'T11:00').toISOString(), type: pick(['havale', 'kart', 'nakit']), kind: k === 0 ? 'kapora' : 'taksit', by: 'Berk Satış', receipt: db.nextNo('payments', 'MK') }); });
    }
    db.data.leads = [{ id: 'l1', name: 'Ece Yıldız', phone: '0532 111 22 33', date: iso(addDays(new Date(), 120)), hall: 'h1', seans: 'aksam', type: 'Düğün', guests: 300, note: 'Hafta sonu istiyoruz', status: 'yeni', src: 'web', created: new Date().toISOString() }, { id: 'l2', name: 'Murat Şen', phone: '0533 222 33 44', date: iso(addDays(new Date(), 60)), hall: 'h2', seans: 'gunduz', type: 'Nişan', guests: 120, note: '', status: 'arandi', src: 'telefon', created: addDays(new Date(), -2).toISOString() }];
    db.data.vendors = [{ id: 'v1', name: 'Pastane Lale', type: 'Pasta', phone: '0312 222 11 00', note: '' }, { id: 'v2', name: 'Işık Ses Sistemleri', type: 'Ses ve ışık', phone: '0312 333 44 55', note: '' }, { id: 'v3', name: 'Ateş Çiçekçilik', type: 'Çiçek', phone: '0312 444 55 66', note: '' }];
  },
};
