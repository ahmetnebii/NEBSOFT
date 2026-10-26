/* Adisyon demo verisi — hem yönetim paneli hem QR menü sayfası kullanır */
window.ADISYON_SEED = function (db) {
  const { rand, pick, addDays, uid } = NS;
  db.data._settings = { bizName: 'Lezzet Durağı Restoran', bizPhone: '0216 555 44 33', bizAddress: 'Bağdat Cad. No:210 Kadıköy/İstanbul', service: 0, wifi: 'Lezzet2026', qrOrder: true, receiptFooter: 'Afiyet olsun! Yine bekleriz.' };
  db.data.users = [
    { id: 'u1', name: 'Selim Yönetici', role: 'admin', pin: '1234', active: true },
    { id: 'u2', name: 'Ali Garson', role: 'garson', pin: '1234', active: true },
    { id: 'u3', name: 'Ayşe Garson', role: 'garson', pin: '1234', active: true },
    { id: 'u4', name: 'Mehmet Usta', role: 'mutfak', pin: '1234', active: true },
    { id: 'u5', name: 'Deniz Kasa', role: 'kasa', pin: '1234', active: true },
  ];
  db.data.areas = [{ id: 'a1', name: 'Salon' }, { id: 'a2', name: 'Bahçe' }, { id: 'a3', name: 'Teras' }];
  const tables = [];
  const grid = (area, prefix, cols, rows, shape) => {
    let n = 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tables.push({ id: area + '-' + n, area, name: prefix + n, seats: shape === 'wide' ? 6 : shape === 'round' ? 2 : 4, x: 12 + c * (76 / (cols - 1 || 1)), y: 18 + r * (64 / (rows - 1 || 1)), shape: (n++ % 5 === 0) ? 'wide' : shape });
  };
  grid('a1', 'S', 4, 3, 'square'); grid('a2', 'B', 4, 2, 'round'); grid('a3', 'T', 3, 2, 'square');
  db.data.tables = tables;

  db.data.mcats = [
    { id: 'k1', name: 'Kahvaltı', color: '#f59e0b' }, { id: 'k2', name: 'Çorbalar', color: '#ea580c' }, { id: 'k3', name: 'Ana Yemekler', color: '#dc2626' },
    { id: 'k4', name: 'Pizzalar', color: '#e11d48' }, { id: 'k5', name: 'Salatalar', color: '#16a34a' }, { id: 'k6', name: 'Tatlılar', color: '#db2777' },
    { id: 'k7', name: 'Sıcak İçecekler', color: '#92400e' }, { id: 'k8', name: 'Soğuk İçecekler', color: '#0284c7' },
  ];
  db.data.ingredients = [
    { id: 'i1', name: 'Kıyma', unit: 'kg', stock: 28, min: 5, cost: 650 }, { id: 'i2', name: 'Tavuk göğüs', unit: 'kg', stock: 18, min: 4, cost: 230 },
    { id: 'i3', name: 'Süt', unit: 'L', stock: 22, min: 6, cost: 40 }, { id: 'i4', name: 'Kahve çekirdeği', unit: 'kg', stock: 3.2, min: 1, cost: 1400 },
    { id: 'i5', name: 'Çay', unit: 'kg', stock: 2.6, min: 0.5, cost: 300 }, { id: 'i6', name: 'Yumurta', unit: 'adet', stock: 160, min: 30, cost: 6 },
    { id: 'i7', name: 'Beyaz peynir', unit: 'kg', stock: 7, min: 2, cost: 350 }, { id: 'i8', name: 'Un', unit: 'kg', stock: 24, min: 5, cost: 30 },
    { id: 'i9', name: 'Domates', unit: 'kg', stock: 3, min: 4, cost: 35 }, { id: 'i10', name: 'Hamburger ekmeği', unit: 'adet', stock: 36, min: 10, cost: 8 },
    { id: 'i11', name: 'Ayran (şişe)', unit: 'adet', stock: 54, min: 12, cost: 15 }, { id: 'i12', name: 'Kola (kutu)', unit: 'adet', stock: 40, min: 12, cost: 26 },
    { id: 'i13', name: 'Portakal', unit: 'kg', stock: 10, min: 3, cost: 30 }, { id: 'i14', name: 'Mozzarella', unit: 'kg', stock: 5, min: 2, cost: 420 },
  ];
  const M = [
    ['k1', 'Serpme Kahvaltı (2 kişilik)', 1150, 'mutfak', [['i6', 4], ['i7', 0.2]], 'Peynir çeşitleri, zeytin, bal-kaymak, sucuklu yumurta, sınırsız çay'],
    ['k1', 'Menemen', 220, 'mutfak', [['i6', 3], ['i9', 0.15]]], ['k1', 'Sucuklu Yumurta', 260, 'mutfak', [['i6', 3]]], ['k1', 'Peynirli Omlet', 190, 'mutfak', [['i6', 3], ['i7', 0.05]]], ['k1', 'Peynirli Gözleme', 180, 'mutfak', [['i8', 0.15], ['i7', 0.06]]],
    ['k2', 'Mercimek Çorbası', 140, 'mutfak'], ['k2', 'Ezogelin Çorbası', 140, 'mutfak'], ['k2', 'Tavuk Suyu Çorba', 160, 'mutfak', [['i2', 0.05]]],
    ['k3', 'Izgara Köfte', 380, 'mutfak', [['i1', 0.2]], 'Pilav, közlenmiş biber ve domates ile'], ['k3', 'Tavuk Şiş', 340, 'mutfak', [['i2', 0.25]]], ['k3', 'Adana Kebap', 420, 'mutfak', [['i1', 0.22]]],
    ['k3', 'Karışık Izgara', 650, 'mutfak', [['i1', 0.2], ['i2', 0.15]]], ['k3', 'İskender', 480, 'mutfak', [['i1', 0.18]]], ['k3', 'Tavuk Wrap', 260, 'mutfak', [['i2', 0.15]]],
    ['k3', 'Hamburger', 320, 'mutfak', [['i1', 0.15], ['i10', 1]]], ['k3', 'Ev Mantısı', 290, 'mutfak', [['i8', 0.12], ['i1', 0.06]]],
    ['k4', 'Margarita Pizza', 330, 'mutfak', [['i8', 0.2], ['i14', 0.12]]], ['k4', 'Karışık Pizza', 390, 'mutfak', [['i8', 0.2], ['i14', 0.12]]], ['k4', 'Sucuklu Pizza', 370, 'mutfak', [['i8', 0.2], ['i14', 0.12]]],
    ['k5', 'Çoban Salata', 150, 'mutfak', [['i9', 0.2]]], ['k5', 'Sezar Salata', 260, 'mutfak', [['i2', 0.1]]], ['k5', 'Ton Balıklı Salata', 290, 'mutfak'],
    ['k6', 'Künefe', 220, 'mutfak'], ['k6', 'Fırın Sütlaç', 140, 'mutfak', [['i3', 0.2]]], ['k6', 'Fıstıklı Baklava (4 dilim)', 260, 'mutfak'], ['k6', 'San Sebastian Cheesecake', 210, 'mutfak'], ['k6', 'Profiterol', 190, 'mutfak'],
    ['k7', 'Çay', 30, 'bar', [['i5', 0.005]]], ['k7', 'Türk Kahvesi', 90, 'bar', [['i4', 0.007]]], ['k7', 'Latte', 130, 'bar', [['i4', 0.018], ['i3', 0.2]]], ['k7', 'Americano', 110, 'bar', [['i4', 0.018]]],
    ['k7', 'Cappuccino', 125, 'bar', [['i4', 0.018], ['i3', 0.15]]], ['k7', 'Sıcak Çikolata', 130, 'bar', [['i3', 0.25]]],
    ['k8', 'Ayran', 50, 'bar', [['i11', 1]]], ['k8', 'Kola', 70, 'bar', [['i12', 1]]], ['k8', 'Ev Yapımı Limonata', 110, 'bar'], ['k8', 'Taze Portakal Suyu', 120, 'bar', [['i13', 0.4]]],
    ['k8', 'Su', 25, 'bar'], ['k8', 'Maden Suyu', 45, 'bar'], ['k8', 'Ice Latte', 140, 'bar', [['i4', 0.018], ['i3', 0.2]]],
  ];
  db.data.menu = M.map((m, i) => ({ id: 'm' + i, cat: m[0], name: m[1], price: m[2], station: m[3], recipe: (m[4] || []).map(([iid, qty]) => ({ iid, qty })), desc: m[5] || '', active: true, prepMin: m[3] === 'bar' ? 3 : 12 }));
  db.data.couriers = [{ id: 'c1', name: 'Emre Kurye', phone: '0532 111 22 33' }, { id: 'c2', name: 'Burak Kurye', phone: '0533 444 55 66' }];

  const waiters = ['u2', 'u3'];
  const mk = (pid, qty, extra = {}) => { const m = db.data.menu.find((x) => x.id === pid); return { id: uid(), pid, name: m.name, price: m.price, qty, note: '', status: 'served', station: m.station, ...extra }; };
  // Geçmiş adisyonlar (30 gün)
  const checks = [];
  let no = 5000;
  for (let d = 30; d >= 0; d--) {
    const n = rand(18, 34) + ([5, 6].includes(addDays(new Date(), -d).getDay()) ? 12 : 0);
    for (let k = 0; k < n; k++) {
      const opened = addDays(new Date(), -d); opened.setHours(rand(9, 22), rand(0, 59));
      if (opened.getTime() > Date.now() - 2 * 3600000) continue;
      const items = [];
      const guests = rand(1, 5);
      for (let j = 0; j < rand(2, 7); j++) items.push(mk(pick(db.data.menu).id, rand(1, 2)));
      const total = items.reduce((t, i) => t + i.price * i.qty, 0);
      const pack = Math.random() < 0.15;
      const t = pick(tables);
      checks.push({ id: 'h' + no, no: 'A' + ++no, type: pack ? 'paket' : 'masa', table: pack ? null : t.id, guests, waiter: pick(waiters), opened: opened.toISOString(), closed: new Date(opened.getTime() + rand(25, 110) * 60000).toISOString(), items, payments: [{ type: Math.random() < 0.65 ? 'kart' : 'nakit', amount: total, at: opened.toISOString() }], discount: null, status: 'closed', total, source: pack ? pick(['Telefon', 'Yemeksepeti', 'Getir Yemek', 'Trendyol Yemek']) : null, customer: pack ? { name: pick(NS.NAMES), phone: NS.phone(), address: 'Caferağa Mah. Moda Cad. No:' + rand(1, 120) } : null, pstatus: pack ? 'teslim' : null });
    }
  }
  // Şu an açık masalar
  const now = Date.now();
  const ago = (min) => new Date(now - min * 60000).toISOString();
  checks.push({ id: 'o1', no: 'A' + ++no, type: 'masa', table: 'a1-1', guests: 4, waiter: 'u2', opened: ago(48), items: [mk('m8', 2, { batch: 'b1', sentAt: ago(45) }), mk('m10', 1, { batch: 'b1', sentAt: ago(45) }), mk('m19', 1, { batch: 'b1', sentAt: ago(45) }), mk('m34', 4, { batch: 'b1', sentAt: ago(45) })], payments: [], status: 'bill' });
  checks.push({ id: 'o2', no: 'A' + ++no, type: 'masa', table: 'a1-3', guests: 2, waiter: 'u3', opened: ago(14), items: [mk('m16', 1, { status: 'prep', batch: 'b2', sentAt: ago(11) }), mk('m20', 1, { status: 'ready', batch: 'b2', sentAt: ago(11), readyAt: ago(2) }), mk('m35', 2, { status: 'ready', batch: 'b2', sentAt: ago(11), readyAt: ago(8) })], payments: [], status: 'open' });
  checks.push({ id: 'o3', no: 'A' + ++no, type: 'masa', table: 'a1-6', guests: 3, waiter: 'u2', opened: ago(6), items: [mk('m11', 1, { status: 'sent', batch: 'b3', sentAt: ago(4) }), mk('m14', 2, { status: 'sent', batch: 'b3', sentAt: ago(4), note: 'Biri soğansız' }), mk('m36', 3, { status: 'sent', batch: 'b3', sentAt: ago(4) })], payments: [], status: 'open' });
  checks.push({ id: 'o4', no: 'A' + ++no, type: 'masa', table: 'a2-2', guests: 2, waiter: 'u3', opened: ago(30), items: [mk('m0', 1, { batch: 'b4', sentAt: ago(28) }), mk('m27', 4, { batch: 'b4', sentAt: ago(28) }), mk('m28', 2, { status: 'sent', batch: 'b5', sentAt: ago(1) })], payments: [], status: 'open' });
  checks.push({ id: 'o5', no: 'A' + ++no, type: 'masa', table: 'a3-2', guests: 5, waiter: 'u2', opened: ago(22), items: [mk('m17', 2, { status: 'prep', batch: 'b6', sentAt: ago(18) }), mk('m21', 1, { status: 'prep', batch: 'b6', sentAt: ago(18) }), mk('m37', 2, { status: 'ready', batch: 'b7', sentAt: ago(18), readyAt: ago(10) })], payments: [], status: 'open' });
  checks.push({ id: 'o6', no: 'A' + ++no, type: 'paket', table: null, guests: 1, waiter: 'u5', opened: ago(19), items: [mk('m12', 1, { status: 'prep', batch: 'b8', sentAt: ago(18) }), mk('m33', 2, { status: 'ready', batch: 'b8', sentAt: ago(18) })], payments: [], status: 'open', source: 'Yemeksepeti', customer: { name: 'Gizem Tekin', phone: '0535 222 33 44', address: 'Moda Cad. Ferit Tek Sok. No:7 D:3' }, pstatus: 'hazirlaniyor', paidOnline: true });
  checks.push({ id: 'o7', no: 'A' + ++no, type: 'paket', table: null, guests: 1, waiter: 'u5', opened: ago(35), items: [mk('m17', 1, { batch: 'b9', sentAt: ago(34) }), mk('m33', 1, { batch: 'b9', sentAt: ago(34) })], payments: [], status: 'open', source: 'Telefon', customer: { name: 'Kemal Yavuz', phone: '0542 777 88 99', address: 'Rasimpaşa Mah. İskele Sok. No:3' }, pstatus: 'yolda', courier: 'c1', payOnDelivery: 'nakit' });
  db.data.checks = checks;
  db.data._meta._seq_checks = no;
  const td = NS.today();
  db.data.reservations = [
    { id: 'r1', name: 'Merve Yıldız', phone: '0532 456 78 90', date: td, time: '20:00', guests: 6, table: 'a1-5', note: 'Doğum günü — pasta getirecekler', status: 'bekliyor' },
    { id: 'r2', name: 'Can Özdemir', phone: '0505 123 45 67', date: td, time: '21:30', guests: 2, table: 'a3-1', note: 'Manzaralı masa', status: 'bekliyor' },
    { id: 'r3', name: 'Ebru Şen', phone: '0544 987 65 43', date: NS.iso(addDays(new Date(), 1)), time: '13:00', guests: 4, table: 'a2-4', note: '', status: 'bekliyor' },
  ];
  db.data.calls = [{ id: 'q1', table: 'a2-2', type: 'garson', at: ago(1), done: false }];
};

/* Menü fotoğrafları (doğrulanmış Unsplash görselleri): ürün adındaki anahtar kelimeye, yoksa kategoriye göre; ürüne photo (URL) girilirse o kullanılır */
window.ADISYON_PHOTO = (function () {
  const K = [[/serpme|kahvaltı tabağı/i, '1482049016688-2d3e1b311543'], [/menemen|omlet|yumurta/i, '1533089860892-a7c6f0a88666'], [/pankek|pancake/i, '1567620905732-2d1ec7ab7445'], [/çorba/i, '1547592180-85f173990554'],
    [/köfte|adana|kebap|şiş/i, '1603360946369-dc9bb6258143'], [/karışık ızgara|pirzola|kaburga/i, '1544025162-d76694265947'], [/iskender|döner|biftek|bonfile|\bet\b/i, '1600891964092-4316c288032e'], [/wrap|dürüm/i, '1504674900247-0877df9cc836'],
    [/burger/i, '1568901346375-23c9450c58cd'], [/mantı/i, '1534422298391-e4f8c172dddb'], [/makarna|penne|spagetti/i, '1621996346565-e3dbc646d9a9'], [/tavuk/i, '1626082927389-6cd097cdc6ec'], [/pizza/i, '1565299624946-b28f40a0ae38'],
    [/sezar/i, '1512621776951-a57141f2eefd'], [/\bton\b/i, '1546069901-ba9599a7e63c'], [/salata/i, '1540189549336-e6e99c3679fe'], [/sütlaç|puding|muhallebi/i, '1563805042-7684c019e1cb'], [/baklava|künefe|tiramisu|pasta|cheesecake/i, '1571877227200-a0d98ea607e9'],
    [/dondurma|waffle/i, '1551024601-bec78aea704b'], [/kurabiye|cookie/i, '1558961363-fa8fdf82db35'], [/çay/i, '1576092768241-dec231879fc3'], [/türk kahvesi|espresso|americano|filtre/i, '1509042239860-f550ce710b93'], [/ice latte|frappe|milkshake|çikolata/i, '1572490122747-3968b75cc699'],
    [/latte|cappuccino|kahve/i, '1495474472287-4d71bcdd2085'], [/portakal|meyve suyu/i, '1600271886742-f049cd451bba'], [/limonata/i, '1497534446932-c925b458314e'], [/kokteyl|mojito/i, '1544145945-f90425340c7e'], [/ayran|^su$|soda|maden/i, '1551538827-9c037cb4f32a'], [/kola|gazoz/i, '1544145945-f90425340c7e']];
  const CAT = { Kahvaltı: '1533089860892-a7c6f0a88666', Çorbalar: '1547592180-85f173990554', 'Ana Yemekler': '1555939594-58d7cb561ad1', Pizzalar: '1513104890138-7c749659a591', Salatalar: '1540189549336-e6e99c3679fe', Tatlılar: '1565958011703-44f9829ba187', 'Sıcak İçecekler': '1495474472287-4d71bcdd2085', 'Soğuk İçecekler': '1497534446932-c925b458314e' };
  const url = (id, w) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&q=70&auto=format&fit=crop`;
  const fn = (m, catName, w = 240) => { if (/^https?:/.test(m.photo || '')) return m.photo; const n = String(m.name).toLocaleLowerCase('tr-TR'); const k = K.find(([re]) => re.test(n)); const id = (k && k[1]) || CAT[catName] || '1504674900247-0877df9cc836'; return url(id, w); };
  fn.cover = (w = 1400) => `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=${w}&q=70&auto=format&fit=crop`;
  return fn;
})();
