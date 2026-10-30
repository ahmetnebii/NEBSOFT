/* Terzi ve tadilat: durumlar, ölçü şablonları, müşteri sayfası ayarı, demo verisi. Fiyatlar örnektir. */
window.TERZI = {
  STATUS: [
    { id: 'alindi', name: 'Alındı', color: '#0284c7', icon: 'file' },
    { id: 'kesim', name: 'Kesim ve dikim', color: '#7c3aed', icon: 'scissors' },
    { id: 'prova', name: 'Prova', color: '#d97706', icon: 'user' },
    { id: 'son', name: 'Son düzeltme', color: '#db2777', icon: 'wrench' },
    { id: 'hazir', name: 'Hazır', color: '#16a34a', icon: 'check' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
  ],
  SABLON: [['Kadın', ['Boy', 'Omuz', 'Göğüs', 'Bel', 'Basen', 'Kol boyu', 'Etek boyu', 'Yaka', 'Sırt boyu']], ['Erkek', ['Boy', 'Omuz', 'Göğüs', 'Bel', 'Basen', 'Kol boyu', 'Yaka', 'Pantolon boyu', 'Paça genişliği']], ['Gelinlik', ['Göğüs', 'Bel', 'Basen', 'Ön boy', 'Sırt boyu', 'Omuz', 'Kol', 'Etek boyu (topuklu)', 'Korse boyu', 'Kuyruk']]],
  seed(db) {
    db.data.mtpls = window.TERZI.SABLON.map(([name, fields], i) => ({ id: 't' + i, name, fields: fields.join(', ') }));
    window.SIPTOHUM(db, {
      prefix: 'TZ', akis: ['alindi', 'kesim', 'prova', 'son', 'hazir'],
      ayar: { bizName: 'Örnek Terzi', bizPhone: '0216 000 00 00', bizAddress: 'Kadıköy, İstanbul', defaultDays: 4, smsHazir: true, autoPrint: false },
      users: [{ id: 'u1', name: 'Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Kalfa', role: 'usta', pin: '1234', active: true }],
      staff: [{ id: 's1', name: 'Hatice Usta', skill: 'Dikim' }, { id: 's2', name: 'Ramazan Kalfa', skill: 'Tadilat' }],
      services: [['Paça kısaltma', 'Pantolon', 'adet', 150], ['Bel daraltma', 'Pantolon', 'adet', 250], ['Fermuar değişimi', 'Onarım', 'adet', 200], ['Kol kısaltma', 'Ceket', 'adet', 350], ['Yan daraltma', 'Ceket', 'adet', 400], ['Elbise dikimi', 'Dikim', 'adet', 3500], ['Gelinlik tadilatı', 'Dikim', 'adet', 2500]].map(([name, cat, unit, price]) => ({ name, cat, unit, price })),
      satir: (s) => ({ sid: s.id, name: s.name, unit: s.unit, price: s.price, qty: 1, before: NS.pick(['', '102 cm', '86 cm']), after: NS.pick(['', '98 cm', '82 cm']) }),
      ek: (o, c, k) => { o.fittings = []; if (['prova', 'son'].includes(o.status) || k % 7 === 0) o.fittings.push({ date: o.due, time: '11:00', note: '', done: false }); if (k % 9 === 0) o.eventDate = NS.iso(NS.addDays(new Date(o.due + 'T12:00'), 5)); },
    });
    db.data.measures = db.data.customers.slice(0, 8).map((c, i) => { const t = i % 2 ? 1 : 0; const F = window.TERZI.SABLON[t][1]; return { id: 'mz' + i, customer: c.id, tpl: 't' + t, at: new Date().toISOString(), values: Object.fromEntries(F.map((f) => [f, NS.rand(30, 110)])), note: '' }; });
  },
};
window.SIPTAKIP = { id: 'terzi', status: window.TERZI.STATUS, seed: window.TERZI.seed, baslik: 'İş durumu sorgulama', soru: 'Kıyafetiniz ne durumda?', icon: 'scissors', kodMetni: 'Fişinizdeki 8 haneli takip kodunu yazın. Aşamayı ve kalan tutarı görürsünüz.', hazirBaslik: 'Kıyafetiniz teslime hazır' };
