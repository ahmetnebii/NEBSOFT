/* Emlak ofisi demo verisi — panel ve herkese açık ilan sayfası kullanır */
window.EMLAK = {
  seed(db) {
    const { rand, pick, addDays, iso } = NS;
    db.data._settings = { bizName: 'Anahtar Gayrimenkul', bizPhone: '0232 777 88 99', bizAddress: 'Karşıyaka, İzmir', commission: 2, rentCommission: 100, whatsapp: '05327778899' };
    db.data.users = [{ id: 'u1', name: 'Levent Broker', role: 'admin', pin: '1234', active: true, agent: 'a1' }, { id: 'u2', name: 'Deniz Danışman', role: 'danisman', pin: '1234', active: true, agent: 'a2' }];
    db.data.agents = [{ id: 'a1', name: 'Levent Aydın', phone: '0532 111 22 33', color: '#ca8a04' }, { id: 'a2', name: 'Deniz Koç', phone: '0533 222 33 44', color: '#2563eb' }, { id: 'a3', name: 'Sibel Yurt', phone: '0534 333 44 55', color: '#db2777' }];
    const districts = { Karşıyaka: ['Bostanlı', 'Mavişehir', 'Alaybey', 'Bahariye'], Bornova: ['Erzene', 'Kazımdirik', 'Doğanlar'], Konak: ['Alsancak', 'Göztepe', 'Güzelyalı'], Bayraklı: ['Manavkuyu', 'Adalet', 'Mansuroğlu'], Çiğli: ['Ataşehir', 'Balatçık'] };
    const feats = ['Asansör', 'Otopark', 'Site içi', 'Havuz', 'Güvenlik', 'Deniz manzarası', 'Balkon', 'Ankastre mutfak', 'Doğalgaz', 'Metroya yakın', 'Eşyalı', 'Ebeveyn banyosu'];
    const colors = ['#ca8a04', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#0891b2', '#ea580c'];
    // Türkçe bulunma eki: ses uyumu (da/de) ve sert ünsüz benzeşmesi (ta/te)
    const loc = (w) => { const v = (w.match(/[aıoueiöü]/gi) || ['a']).pop().toLowerCase(); const back = 'aıou'.includes(v); return `${w}'${'çfhkpsşt'.includes(w.slice(-1).toLowerCase()) ? 't' : 'd'}${back ? 'a' : 'e'}`; };
    const props = [];
    for (let k = 0; k < 34; k++) {
      const dist = pick(Object.keys(districts)); const nb = pick(districts[dist]);
      const sale = Math.random() < 0.6; const cat = pick(sale ? ['Daire', 'Daire', 'Daire', 'Daire', 'Villa', 'Arsa', 'İşyeri'] : ['Daire', 'Daire', 'Daire', 'Daire', 'Villa', 'İşyeri']);
      const rooms = cat === 'Arsa' || cat === 'İşyeri' ? '-' : cat === 'Villa' ? pick(['4+1', '5+1']) : pick(['1+1', '2+1', '2+1', '3+1', '3+1', '4+1']);
      const m2 = cat === 'Arsa' ? rand(300, 1500) : cat === 'Villa' ? rand(220, 400) : rand(60, 180);
      const perM2 = cat === 'Arsa' ? rand(6, 18) : rand(38, 85);
      const price = sale ? Math.round((m2 * perM2 * 1000) / 50000) * 50000 : Math.round((m2 * rand(160, 320)) / 500) * 500;
      const status = Math.random() < 0.15 ? (sale ? 'satildi' : 'kiralandi') : Math.random() < 0.1 ? 'opsiyon' : 'aktif';
      props.push({ id: 'p' + k, no: 'ILN' + (7000 + k), title: `${loc(nb)} ${sale ? 'satılık' : 'kiralık'} ${rooms !== '-' ? rooms + ' ' : ''}${cat.toLocaleLowerCase('tr-TR')}`, type: sale ? 'satilik' : 'kiralik', cat, city: 'İzmir', district: dist, nb, rooms, m2, floor: cat === 'Daire' ? rand(1, 12) : 0, age: rand(0, 30), price, dues: cat === 'Daire' ? rand(4, 25) * 100 : 0, heating: pick(['Kombi', 'Merkezi', 'Yerden ısıtma', 'Klima']), furnished: !sale && Math.random() < 0.3, features: feats.filter(() => Math.random() < 0.3), owner: pick(NS.NAMES), ownerPhone: NS.phone(), agent: pick(['a1', 'a2', 'a3']), status, color: pick(colors), desc: `${nb} merkezde, ulaşımı kolay, bakımlı ${cat.toLowerCase()}. Okul, market ve toplu taşımaya yürüme mesafesinde.`, created: addDays(new Date(), -rand(1, 120)).toISOString(), views: rand(20, 900) });
    }
    db.data.props = props;
    db.data.requests = NS.NAMES.slice(0, 14).map((n, i) => { const sale = i % 3 !== 0; const dist = pick(Object.keys(districts)); return { id: 'r' + i, name: n, phone: NS.phone(), type: sale ? 'satilik' : 'kiralik', cat: 'Daire', district: Math.random() < 0.7 ? dist : '', rooms: pick(['', '2+1', '3+1']), budgetMax: sale ? rand(4, 14) * 1000000 : rand(18, 45) * 1000, m2Min: rand(70, 120), note: pick(['Okula yakın olsun', 'Site içi tercih', 'Yatırımlık', 'Acil', '']), status: 'aktif', agent: pick(['a1', 'a2', 'a3']), created: addDays(new Date(), -rand(1, 40)).toISOString() }; });
    db.data.showings = [];
    for (let k = 0; k < 16; k++) { const d = iso(addDays(new Date(), rand(-14, 7))); db.data.showings.push({ id: NS.uid(), prop: pick(props).id, request: pick(db.data.requests).id, date: d, time: pick(['10:00', '11:30', '14:00', '15:30', '17:00']), agent: pick(['a1', 'a2', 'a3']), result: d < NS.today() ? pick(['Beğendi, ikinci gösterim isteniyor', 'Fiyatı yüksek buldu', 'Teklif verecek', 'Uygun bulmadı']) : '' }); }
    const rented = props.filter((p) => p.type === 'kiralik').slice(0, 6);
    db.data.leases = rented.map((p, i) => { const start = addDays(new Date(), -rand(30, 300)); start.setDate(1); const months = []; for (let d = new Date(start); d <= new Date(); d.setMonth(d.getMonth() + 1)) months.push(iso(d).slice(0, 7)); return { id: 'l' + i, prop: p.id, tenant: pick(NS.NAMES), tenantPhone: NS.phone(), rent: p.price, deposit: p.price * 2, start: iso(start), end: iso(addDays(start, 365)), payDay: 5, payments: months.map((m, k) => ({ period: m, paid: k < months.length - 1 || Math.random() < 0.5 })) }; });
    rented.forEach((p) => { p.status = 'kiralandi'; });
    db.data.deals = props.filter((p) => p.status === 'satildi').map((p) => ({ id: NS.uid(), prop: p.id, buyer: pick(NS.NAMES), price: Math.round(p.price * 0.96), pct: 2, date: iso(addDays(new Date(), -rand(3, 80))), agent: p.agent, kind: 'satis' }));
    db.data.leases.forEach((l) => db.data.deals.push({ id: NS.uid(), prop: l.prop, buyer: l.tenant, price: l.rent, pct: 100, date: l.start, agent: (props.find((p) => p.id === l.prop) || {}).agent, kind: 'kira' }));
  },
  // Doğrulanmış Unsplash fotoğrafları (kategoriye göre) — ilanda photoList (satır başına URL) varsa o kullanılır
  PH: {
    int: ['1560448204-e02f11c3d0e2', '1502672260266-1c1ef2d93688', '1522708323590-d24dbb6b0267', '1493809842364-78817add7ffb', '1600210492486-724fe5c67fb0', '1583608205776-bfd35f0d9f83', '1600607687939-ce8a6c25118c'],
    apt: ['1545324418-cc1a3fa10c00', '1515263487990-61b07816b324'],
    villa: ['1512917774080-9991f1c4c750', '1600596542815-ffad4c1539a9', '1580587771525-78b9dba3b914', '1613490493576-7fde63acd811', '1564013799919-ab600027ffc6'],
    house: ['1568605114967-8130f3a36994', '1570129477492-45c003edd2be', '1600585154340-be6161a56a0c', '1449844908441-8829872d2607', '1600566753190-17f0baa2a6c3', '1605276374104-dee2a0ed3cd6', '1576941089067-2de3c901e126', '1554995207-c18c203602cb'],
    kitchen: ['1484154218962-a197022b5858', '1556911220-bff31c812dba'], bed: ['1505691938895-1758d7feb511', '1540518614846-7eded433c457'], bath: ['1552321554-5fefe8c9ef14'],
    office: ['1486406146926-c627a92ad1ab', '1497366216548-37526070297c'], land: ['1500382017468-9049fed747ef'],
  },
  imgUrl: (id, w = 800, h = 0) => (/^https?:|^data:/.test(id) ? id : `https://images.unsplash.com/photo-${id}?w=${w}${h ? '&h=' + h : ''}&q=75&auto=format&fit=crop`),
  photos(p) {
    const own = String(p.photoList || '').split(/\s+/).filter((u) => /^https?:\/\//.test(u));
    if (own.length) return own;
    const h = [...String(p.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0; const P = this.PH; const at = (a, k = 0) => a[(h + k) % a.length];
    if (p.cat === 'Arsa') return [at(P.land), at(P.house, 2)];
    if (p.cat === 'İşyeri') return [at(P.office), at(P.office, 1), at(P.int, 4), at(P.kitchen)];
    if (p.cat === 'Villa') return [at(P.villa), at(P.house), at(P.int, 1), at(P.kitchen), at(P.bed), at(P.bath), at(P.villa, 2)];
    return [at(P.int), at(P.apt), at(P.int, 3), at(P.kitchen, 1), at(P.bed, 1), at(P.bath), at(P.int, 5)];
  },
  // İlçe merkez koordinatları (harita için); ilan koordinatı yoksa ilçe + küçük sapma
  GEO: { Karşıyaka: [38.4595, 27.115], Bornova: [38.4697, 27.2211], Konak: [38.4189, 27.1287], Bayraklı: [38.4622, 27.1667], Çiğli: [38.496, 27.066] },
  geo(p) {
    if (p.lat && p.lng) return [Number(p.lat), Number(p.lng)];
    const c = this.GEO[p.district] || [38.4237, 27.1428]; const h = [...String(p.id)].reduce((a, ch) => a * 17 + ch.charCodeAt(0), 3) >>> 0;
    return [c[0] + ((h % 100) - 50) / 6000, c[1] + (((h >> 7) % 100) - 50) / 5000];
  },
  NEAR: ['Metro / İzban', 'İlkokul', 'Market', 'Hastane', 'Park', 'Sahil'],
  near(p) { const h = [...String(p.id)].reduce((a, ch) => a * 13 + ch.charCodeAt(0), 5) >>> 0; return this.NEAR.map((n, i) => [n, 150 + ((h >> i) % 18) * 90]); },
  TYPE: { satilik: 'Satılık', kiralik: 'Kiralık' },
  ST: { aktif: ['Yayında', 'ok'], opsiyon: ['Opsiyonlu', 'warn'], satildi: ['Satıldı', 'acc'], kiralandi: ['Kiralandı', 'info'], pasif: ['Pasif', ''] },
  // Talep ile ilan uyum puanı (0-100)
  score(r, p) {
    if (p.type !== r.type || !['aktif', 'opsiyon'].includes(p.status)) return 0;
    let s = 40;
    if (r.cat && p.cat === r.cat) s += 15; else if (r.cat) return 0;
    if (!r.district || p.district === r.district) s += 15; else s -= 15;
    if (!r.rooms || p.rooms === r.rooms) s += 10;
    if (!r.budgetMax || p.price <= r.budgetMax) s += 15; else if (p.price <= r.budgetMax * 1.1) s += 5; else return 0;
    if (!r.m2Min || p.m2 >= r.m2Min) s += 5;
    return Math.max(0, Math.min(100, s));
  },
};
