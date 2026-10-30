/* Toptancı & Plasiyer — fiyat listeleri, rota, cari risk, demo verisi. Panel ve bayi sipariş sayfası kullanır. */
window.TPT = {
  ST: { onay: ['Onay bekliyor', 'err'], yeni: ['Yeni', 'info'], hazir: ['Hazırlanıyor', 'warn'], sevk: ['Sevkte', 'acc'], teslim: ['Teslim edildi', 'ok'], iptal: ['İptal', ''] },
  SRC: { saha: 'Plasiyer', b2b: 'Bayi portalı', ofis: 'Ofis / telefon' },
  LISTS: { A: ['A — Zincir / büyük market', 0], B: ['B — Market', 4], C: ['C — Bakkal / büfe', 8] },
  DAYS: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  // Fiyat listesi farkı: A taban fiyat, B %4, C %8 üstü
  price: (p, list) => Math.round(p.price * (1 + (TPT.listOf(list)[1]) / 100) * 100) / 100,
  listOf: (list) => TPT.LISTS[list] || TPT.LISTS.C,
  OPEN: ['yeni', 'hazir', 'onay'],
  RET: ['Hasarlı ürün', 'Son kullanma tarihi', 'Yanlış ürün', 'Müşteri vazgeçti', 'Diğer'],
  nextNo: (orders) => 'S' + (orders.reduce((m, o) => Math.max(m, Number(String(o.no).slice(1)) || 0), 6999) + 1),
  // Cari özeti: sevk/teslim borçları, ödenenler, açık sipariş, tahsil olmamış çek, stok ayrımı. Karşılıksız çek ödeme sayılmaz, iade ödeme gibi düşer.
  ledger(orders, payments, returns) {
    const L = { ord: {}, paid: {}, open: {}, chq: {}, res: {} }; const t = new Date().toISOString().slice(0, 10); const add = (m, k, v) => { m[k] = (m[k] || 0) + v; };
    orders.forEach((o) => { if (['sevk', 'teslim'].includes(o.status)) (L.ord[o.customer] = L.ord[o.customer] || []).push({ at: o.at, v: TPT.orderTotal(o).total }); else if (TPT.OPEN.includes(o.status)) { add(L.open, o.customer, TPT.orderTotal(o).total); o.lines.forEach((l) => add(L.res, l.pid, l.qty)); } });
    payments.forEach((x) => { if (x.cheque === 'karsiliksiz') return; add(L.paid, x.customer, x.amount); if (x.cheque === 'portfoy' || (x.cheque === 'bankada' && x.due >= t)) add(L.chq, x.customer, x.amount); });
    (returns || []).forEach((r) => add(L.paid, r.customer, r.total)); Object.values(L.ord).forEach((a) => a.sort((x, y) => x.at.localeCompare(y.at))); return L;
  },
  // Risk: bakiye + açık siparişler + henüz paraya dönmemiş çekler
  exposure: (c, L, extra = 0) => (c.balance || 0) + (L.open[c.id] || 0) + (L.chq[c.id] || 0) + extra,
  overdue(c, L) { let paid = Math.max(0, (L.paid[c.id] || 0) - Math.max(0, c.opening || 0)); let od = 0; const now = new Date(); (L.ord[c.id] || []).forEach((o) => { const use = Math.min(paid, o.v); paid -= use; if (o.v - use > 0.01 && NS.addDays(new Date(o.at), c.term || 30) < now) od += o.v - use; }); return Math.round(od * 100) / 100; },
  // Ekstre hareketleri tek yerde: panel ve bayi aynı bakiyeyi gösterir
  moves(c, orders, payments, returns) {
    const mv = [...orders.filter((o) => o.customer === c.id && ['sevk', 'teslim'].includes(o.status)).map((o) => ({ at: o.at, d: `Satış ${o.no}`, v: TPT.orderTotal(o).total })), ...payments.filter((x) => x.customer === c.id).flatMap((x) => [{ at: x.at, d: `Tahsilat (${x.method})`, v: -x.amount }, ...(x.cheque === 'karsiliksiz' ? [{ at: x.bouncedAt || x.at, d: `Karşılıksız ${String(x.method).toLocaleLowerCase('tr-TR')} ${x.serial || ''}`, v: x.amount }] : [])]), ...(returns || []).filter((r) => r.customer === c.id).map((r) => ({ at: r.at, d: `İade ${r.no}`, v: -r.total }))].sort((x, y) => x.at.localeCompare(y.at));
    const r2 = (x) => Math.round(x * 100) / 100; let bal = r2((c.balance || 0) - mv.reduce((t, m) => t + m.v, 0)); const open = bal; mv.forEach((m) => { bal = r2(bal + m.v); m.bal = bal; }); return { open, rows: mv };
  },
  // Mal fazlası: X adet alana Y adet bedelsiz (kalemde %100 iskonto); stoktan düşer, tutara girmez. Tarih aralığındaki etkin kampanya uygulanır.
  promoOf: (promos, pid, day) => (promos || []).find((x) => x.active !== false && x.pid === pid && (!x.start || x.start <= day) && (!x.end || x.end >= day)),
  withPromo(lines, promos, products, day) { const paid = lines.filter((l) => !l.free); const free = paid.flatMap((l) => { const x = TPT.promoOf(promos, l.pid, day); const n = x ? Math.floor(l.qty / x.buy) * x.free : 0; return n > 0 ? [{ pid: l.pid, name: `${l.name} (mal fazlası)`, qty: n, price: l.price, vat: l.vat, disc: 100, free: true }] : []; }); return [...paid, ...free]; },
  avail: (p, L) => (p.stock || 0) - (L.res[p.id] || 0),
  orderTotal: (o) => { const net = o.lines.reduce((s, l) => s + l.qty * l.price * (1 - (l.disc || 0) / 100), 0); const vat = o.lines.reduce((s, l) => s + l.qty * l.price * (1 - (l.disc || 0) / 100) * (l.vat ?? 10) / 100, 0); return { net: Math.round(net * 100) / 100, vat: Math.round(vat * 100) / 100, total: Math.round((net + vat) * 100) / 100 }; },
  // Portal giriş kodu: işletme 'portal bilgisini gönder' dediğinde rastgele kod üretilir (NS.portalCode); yoksa eski formül
  code: (c) => c.portalCode || '' /* yalnızca rastgele kod (NS.portalCode); formül kaldırıldı */,
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Anadolu Gıda Toptan', bizPhone: '0332 350 40 40', bizAddress: 'Konya Organize Sanayi, 7. Cad. No:14, Selçuklu/Konya', minOrder: 1500, defaultTerm: 30, iban: 'TR56 0006 2000 3900 0006 2988 21' };
    db.data.users = [{ id: 'u1', name: 'Recep Bey', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Gül Ofis', role: 'ofis', pin: '1234', active: true }, { id: 'u3', name: 'Hasan Plasiyer', role: 'plasiyer', pin: '1234', active: true, rep: 'r1' }, { id: 'u4', name: 'Mert Depo', role: 'depo', pin: '1234', active: true }];
    db.data.reps = [{ id: 'r1', name: 'Hasan Öztürk', phone: NS.phone(), plate: '42 ABC 401', target: 420000 }, { id: 'r2', name: 'Volkan Kara', phone: NS.phone(), plate: '42 ABC 402', target: 380000 }, { id: 'r3', name: 'Onur Karaca', phone: NS.phone(), plate: '42 ABC 403', target: 360000 }];
    const P = [['Ayçiçek Yağı 5 lt', 'Yağ', 4, 285, 20], ['Ayçiçek Yağı 1 lt', 'Yağ', 12, 62, 20], ['Toz Şeker 5 kg', 'Temel gıda', 4, 165, 1], ['Baldo Pirinç 2,5 kg', 'Temel gıda', 6, 142, 1], ['Kırmızı Mercimek 1 kg', 'Bakliyat', 10, 58, 1], ['Nohut 1 kg', 'Bakliyat', 10, 66, 1], ['Spagetti Makarna 500 g', 'Makarna', 20, 17.5, 1], ['Burgu Makarna 500 g', 'Makarna', 20, 17.5, 1], ['Domates Salçası 830 g', 'Konserve', 12, 64, 1], ['Biber Salçası 830 g', 'Konserve', 12, 72, 1], ['Çay 1 kg', 'İçecek', 12, 245, 20], ['Türk Kahvesi 100 g', 'İçecek', 24, 48, 20], ['Un 5 kg', 'Temel gıda', 4, 98, 1], ['Bulaşık Deterjanı 1,5 lt', 'Temizlik', 12, 54, 20], ['Çamaşır Suyu 4 lt', 'Temizlik', 4, 72, 20], ['Tuvalet Kağıdı 32\'li', 'Kağıt', 3, 210, 20], ['Peçete 100\'lü', 'Kağıt', 24, 14, 20], ['Maden Suyu 6\'lı', 'İçecek', 4, 42, 20]];
    db.data.products = P.map(([name, cat, pack, price, vat], i) => ({ id: NS.uid(), code: 'AG' + String(1001 + i), barcode: '8690' + String(5000000000 + i * 113).slice(0, 9), name, cat, pack, price, cost: Math.round(price * 0.86 * 100) / 100, vat, stock: i % 7 === 5 ? rand(4, 20) : rand(80, 900), min: pack * 10 }));
    const D = ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Seydişehir'];
    const shops = ['Bereket Market', 'Yıldız Bakkal', 'Öz Pınar Gıda', 'Ekonomi Market', 'Huzur Büfe', 'Damla Market', 'Can Şarküteri', 'Kardeşler Gıda', 'Güneş Market', 'Saray Bakkal', 'Şimşek Market', 'Doğa Gıda', 'Altın Market', 'Lider Bakkal', 'Ova Market', 'Aydın Büfe', 'Uğur Market', 'Pazar Gıda', 'Merkez Market', 'Sevgi Bakkal', 'Akın Market', 'Tok Gıda'];
    db.data.customers = shops.map((name, i) => { const rep = db.data.reps[i % 3]; const list = i % 7 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C'; return { id: 'c' + i, name, contact: NS.NAMES[i % 30], phone: NS.phone(), district: D[i % D.length], rep: rep.id, day: 1 + (i % 5), list, limit: list === 'A' ? 400000 : list === 'B' ? 150000 : i % 5 === 3 ? 60000 : 90000, term: list === 'A' ? 45 : 30, taxNo: String(rand(1000000000, 9999999999)), balance: 0, lat: 37.87 + rand(-50, 50) / 1000, lng: 32.48 + rand(-60, 60) / 1000 }; });
    const orders = []; const payments = []; let no = 7000;
    for (let d = 40; d >= 0; d--) {
      const date = addDays(new Date(), -d); if (date.getDay() === 0) continue;
      db.data.customers.filter((c) => c.day === date.getDay() || Math.random() < 0.06).forEach((c) => {
        if (Math.random() < 0.18) return;
        const at = new Date(date); at.setHours(rand(9, 17), rand(0, 59)); if (at > new Date()) return;
        const lines = []; const n = rand(4, 10); for (let k = 0; k < n; k++) { const p = pick(db.data.products); if (lines.some((l) => l.pid === p.id)) continue; lines.push({ pid: p.id, name: p.name, qty: p.pack * rand(1, 4), price: TPT.price(p, c.list), vat: p.vat, disc: Math.random() < 0.15 ? 2 : 0 }); }
        const src = Math.random() < 0.7 ? 'saha' : Math.random() < 0.6 ? 'b2b' : 'ofis';
        const st = d > 2 ? 'teslim' : d === 2 ? pick(['teslim', 'sevk']) : d === 1 ? pick(['sevk', 'hazir']) : pick(['yeni', 'yeni', 'hazir']);
        const o = { id: NS.uid(), no: 'S' + no++, customer: c.id, rep: c.rep, src, at: at.toISOString(), lines, status: st, note: '' };
        if (st === 'teslim') o.deliveredAt = addDays(at, 1).toISOString();
        orders.push(o); if (['teslim', 'sevk'].includes(st)) c.balance += TPT.orderTotal(o).total;
      });
    }
    // Tahsilatlar: vadesi gelenlerin çoğu tahsil edilmiş
    db.data.customers.forEach((c, i) => {
      const owed = orders.filter((o) => o.customer === c.id && o.status === 'teslim' && o.at < addDays(new Date(), -c.term + 8).toISOString()).reduce((s, o) => s + TPT.orderTotal(o).total, 0);
      const pay = Math.round(owed * (i % 6 === 2 ? 0.55 : 0.95));
      if (pay > 0) { const m = pick(['Nakit', 'Nakit', 'Havale', 'Çek', 'Kredi kartı']); payments.push({ id: NS.uid(), customer: c.id, rep: c.rep, amount: pay, method: m, at: addDays(new Date(), -rand(1, 20)).toISOString(), ...(m === 'Çek' ? { due: NS.iso(addDays(new Date(), rand(10, 75))), bank: pick(['Ziraat', 'Halkbank', 'İş Bankası']), serial: String(rand(1000000, 9999999)), cheque: 'portfoy' } : {}) }); c.balance -= pay; }
      c.balance = Math.round(c.balance * 100) / 100;
    });
    db.data.orders = orders; db.data.payments = payments;
    db.data.visits = []; db.data.returns = []; db.data.dayends = []; db.data.promos = [{ id: 'kp1', name: 'Yağ kampanyası', pid: db.data.products[1].id, buy: 24, free: 1, start: NS.iso(addDays(new Date(), -5)), end: NS.iso(addDays(new Date(), 25)), active: true }];
  },
};
