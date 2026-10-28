/* Kargo & Kurye demo verisi, tarife hesabı — panel ve takip sayfası kullanır */
window.KARGO = {
  ST: { kabul: ['Kabul edildi', '', 'box'], depoda: ['Transfer merkezinde', 'info', 'building'], dagitimda: ['Dağıtımda', 'acc', 'truck'], teslim: ['Teslim edildi', 'ok', 'check'], edilemedi: ['Teslim edilemedi', 'err', 'alert'], iade: ['Göndericiye iade', 'warn', 'refresh'] },
  SERVICE: { standart: ['Standart (1-2 gün)', 1], ekspres: ['Ekspres (ertesi gün)', 1.5], ayni: ['Aynı gün kurye', 2.2] },
  REGION: { sehirici: ['Şehir içi', 1], bolge: ['Yakın şehir', 1.25], uzak: ['Uzak şehir', 1.6] },
  DISTRICTS: ['Kadıköy', 'Üsküdar', 'Ataşehir', 'Maltepe', 'Beşiktaş', 'Şişli', 'Kağıthane', 'Bakırköy', 'Fatih', 'Beyoğlu', 'Sarıyer', 'Ümraniye'],
  FAIL: ['Alıcı adreste yok', 'Adres hatalı / bulunamadı', 'Alıcı teslim almak istemedi', 'İşyeri kapalı', 'Kapıda ödeme yapılmadı'],
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Hızlı Kurye Lojistik', bizPhone: '0850 777 00 11', bizAddress: 'Ümraniye Transfer Merkezi, İstanbul', tiers: '1:90,5:120,10:160,20:230,30:310', perDesi: 9, codPct: 2, codMin: 20 };
    db.data.users = [{ id: 'u1', name: 'Hakan Operasyon', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Seda Kabul', role: 'kabul', pin: '1234', active: true }, { id: 'u3', name: 'Ramazan Kurye', role: 'kurye', pin: '1234', active: true, courier: 'k1' }];
    const D = KARGO.DISTRICTS;
    db.data.couriers = [['Ramazan Yıldız', 'Motor', [D[0], D[1], D[2]]], ['Cem Arslan', 'Panelvan', [D[3], D[2], D[11]]], ['Ferhat Demir', 'Motor', [D[4], D[5], D[6]]], ['Okan Kaya', 'Panelvan', [D[7], D[8], D[9]]], ['Yusuf Er', 'Motor', [D[10], D[4], D[6]]]].map(([name, vehicle, zone], i) => ({ id: 'k' + (i + 1), name, vehicle, zone, phone: NS.phone(), plate: `34 ${String.fromCharCode(65 + i)}K ${rand(100, 999)}` }));
    db.data.caris = [{ id: 'c1', name: 'Lina Butik (e-ticaret)', contact: 'Lina Hanım', phone: NS.phone(), discount: 15, district: 'Şişli' }, { id: 'c2', name: 'Teknoloji Doktoru Servis', contact: 'Murat Bey', phone: NS.phone(), discount: 10, district: 'Kadıköy' }, { id: 'c3', name: 'Pati Petshop', contact: 'Zehra Hanım', phone: NS.phone(), discount: 8, district: 'Kadıköy' }, { id: 'c4', name: 'Kale Mobilya', contact: 'Pelin Hanım', phone: NS.phone(), discount: 20, district: 'Ümraniye' }];
    const ships = []; let no = 100000;
    const past = (ms) => new Date(Math.min(ms, Date.now() - 60000)).toISOString();
    for (let d = 20; d >= 0; d--) for (let k = 0; k < rand(14, 30); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(8, 18), rand(0, 59)); if (at > new Date()) continue;
      const cari = Math.random() < 0.6 ? pick(db.data.caris) : null;
      const rd = pick(D); const desi = pick([1, 1, 2, 3, 5, 8, 12, 25]); const region = pick(['sehirici', 'sehirici', 'sehirici', 'bolge', 'uzak']); const service = pick(region === 'sehirici' ? ['standart', 'standart', 'ekspres', 'ayni'] : ['standart', 'standart', 'ekspres']);
      const cod = Math.random() < 0.3 ? rand(3, 40) * 50 : 0;
      const s = { id: NS.uid(), no: 'HK' + (no += rand(1, 9)) + rand(100, 999), at: at.toISOString(), cari: cari ? cari.id : null, sender: { name: cari ? cari.name : pick(NS.NAMES), phone: cari ? cari.phone : NS.phone(), district: cari ? cari.district : pick(D) }, receiver: { name: pick(NS.NAMES), phone: NS.phone(), district: region === 'sehirici' ? rd : '', city: region === 'sehirici' ? 'İstanbul' : pick(['Ankara', 'İzmir', 'Bursa', 'Kocaeli', 'Antalya']), address: `${pick(['Cumhuriyet', 'Bağdat', 'Atatürk', 'İnönü'])} ${pick(['Cad.', 'Sok.'])} No:${rand(1, 120)} D:${rand(1, 20)}` }, desi, pieces: 1, service, region, cod, history: [{ at: at.toISOString(), status: 'kabul', note: 'Gönderi kabul edildi' }] };
      s.price = KARGO.price(db.data._settings, s, cari);
      const age = d + (at.getHours() < 12 ? 0.3 : 0);
      const fin = age > 2 ? (Math.random() < 0.9 ? 'teslim' : pick(['edilemedi', 'iade'])) : age > 0.9 ? pick(['dagitimda', 'teslim', 'teslim', 'edilemedi']) : pick(['kabul', 'depoda', 'depoda', 'dagitimda']);
      const steps = ['depoda', 'dagitimda'];
      steps.forEach((st, i) => { if (['kabul'].includes(fin) || (fin === 'depoda' && i > 0)) return; s.history.push({ at: past(at.getTime() + (i + 1) * 4 * 3600000), status: st, note: st === 'depoda' ? 'Transfer merkezine ulaştı' : 'Kurye dağıtıma çıkardı' }); });
      if (['dagitimda', 'teslim', 'edilemedi', 'iade'].includes(fin)) s.courier = (pick(db.data.couriers.filter((c) => c.zone.includes(rd))) || { id: 'k1' }).id;
      if (fin === 'teslim') { s.history.push({ at: past(at.getTime() + rand(10, 30) * 3600000), status: 'teslim', note: `Teslim alan: ${s.receiver.name.split(' ')[0]} (kendisi)` }); s.deliveredTo = s.receiver.name; s.codCollected = s.cod; s.codSettled = d > 1; }
      if (fin === 'edilemedi') { s.failReason = pick(KARGO.FAIL); s.history.push({ at: past(at.getTime() + 20 * 3600000), status: 'edilemedi', note: s.failReason }); s.attempts = 1; }
      if (fin === 'iade') s.history.push({ at: past(at.getTime() + 60 * 3600000), status: 'iade', note: 'Göndericiye iade edildi' });
      s.status = fin; ships.push(s);
    }
    db.data.ships = ships;
  },
  tiers(s) { return String(s.tiers || '1:90').split(',').map((x) => x.split(':').map(Number)).sort((a, b) => a[0] - b[0]); },
  price(s, sh, cari) {
    const t = KARGO.tiers(s); const top = t[t.length - 1];
    const base = (t.find(([d]) => sh.desi <= d) || [0, top[1] + Math.ceil(sh.desi - top[0]) * (s.perDesi || 9)])[1] * (sh.pieces || 1);
    let p = base * KARGO.SERVICE[sh.service][1] * KARGO.REGION[sh.region][1];
    if (sh.cod) p += Math.max(s.codMin || 20, (sh.cod * (s.codPct || 2)) / 100);
    if (cari && cari.discount) p *= 1 - cari.discount / 100;
    return Math.round(p * 100) / 100;
  },
};
