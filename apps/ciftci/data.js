/* Çiftçi & Kooperatif — alım, stopaj, üretici cari, gelir-gider farkı hesapları ve örnek veri. Panel ve üretici portalı kullanır. */
window.CFT = {
  // Gelir vergisi tevkifatı varsayılanları: GVK 94/11, 2009/14592 sayılı Karar, GİB tablosu. Oran değişirse Ayarlar'dan güncellenir.
  RATES: { hayTescil: 1, hay: 2, digerTescil: 2, diger: 4 },
  OPS: { ekim: 'Ekim / dikim', gubre: 'Gübreleme', ilac: 'İlaçlama', sulama: 'Sulama', hasat: 'Hasat', diger: 'Diğer' },
  OWN: { malik: 'Malik', kira: 'Kira', tahsis: 'Tahsis' },
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  rate(cat, tescil, s) { const R = { ...CFT.RATES, ...((s && s.rates) || {}) }; const key = cat === 'hayvansal' ? (tescil ? 'hayTescil' : 'hay') : (tescil ? 'digerTescil' : 'diger'); return Number(R[key]) || 0; },
  // Alım: kantar brütü − dara = net; fire yüzdesi düşülür; bedelden stopaj ve diğer kesinti çıkar
  calc(p) {
    const r2 = CFT.r2; const net = r2((Number(p.gross) || 0) - (Number(p.tare) || 0)); const qty = r2(net * (1 - (Number(p.fire) || 0) / 100)); const amount = r2(qty * (Number(p.price) || 0));
    const stopaj = p.noStopaj ? 0 : r2(amount * (Number(p.rate) || 0) / 100); const cut = Number(p.cut) || 0; return { net, qty, amount, stopaj, cut, pay: r2(amount - stopaj - cut) };
  },
  saleTotal: (s) => CFT.r2((s.lines || []).reduce((t, l) => t + (Number(l.qty) || 0) * (Number(l.price) || 0), 0) * (1 + (Number(s.vat) || 0) / 100)),
  // Üretici carisi: bakiye > 0 üretici borçlu, < 0 işletme üreticiye borçlu
  statement(pid, d) {
    const live = (x) => x.status !== 'iptal'; const L = [];
    (d.sales || []).filter((s) => s.producer === pid && s.credit && live(s)).forEach((s) => L.push({ at: s.at, doc: s.no, text: 'Girdi satışı', b: CFT.saleTotal(s), a: 0 }));
    (d.purchases || []).filter((p) => p.producer === pid && live(p)).forEach((p) => L.push({ at: p.at, doc: p.no, text: `${p.productName || ''} alımı`, b: 0, a: CFT.calc(p).pay }));
    (d.payments || []).filter((p) => p.producer === pid).forEach((p) => L.push({ at: p.at, doc: p.no || '', text: p.dir === 'al' ? `Tahsilat · ${p.method || ''}` : `Ödeme · ${p.method || ''}`, b: p.dir === 'al' ? 0 : Number(p.amount) || 0, a: p.dir === 'al' ? Number(p.amount) || 0 : 0 }));
    L.sort((x, y) => String(x.at).localeCompare(String(y.at))); let bal = 0; L.forEach((m) => { bal = CFT.r2(bal + m.b - m.a); m.bal = bal; }); return L;
  },
  // Tüm üreticilerin bakiyesi tek geçişte: liste ekranları için
  balances(d) { const m = new Map(); const add = (id, x) => m.set(id, CFT.r2((m.get(id) || 0) + x)); (d.sales || []).forEach((s) => { if (s.credit && s.status !== 'iptal') add(s.producer, CFT.saleTotal(s)); }); (d.purchases || []).forEach((p) => { if (p.status !== 'iptal') add(p.producer, -CFT.calc(p).pay); }); (d.payments || []).forEach((p) => add(p.producer, p.dir === 'al' ? -(Number(p.amount) || 0) : Number(p.amount) || 0)); return m; },
  balance(pid, d) { const L = CFT.statement(pid, d); return L.length ? L[L.length - 1].bal : 0; },
  // Gelir-gider farkı (1163 md. 38, 39): en az %10 yedek akçe ayrılır, kalan ortaklara muamele oranında dağıtılır; zarar varsa dağıtım olmaz
  distribute(partners, base, reservePct) {
    const fark = Number(base) || 0; if (fark <= 0) return { error: 'Gelir-gider farkı olumlu değil, dağıtım yapılamaz' };
    const pct = Number(reservePct); if (!(pct >= 10)) return { error: 'Yedek akçe oranı en az %10 olmalı' };
    const yedek = CFT.r2(fark * pct / 100); const kalan = CFT.r2(fark - yedek); const toplam = (partners || []).reduce((s, p) => s + (Number(p.vol) || 0), 0); if (!toplam) return { error: 'Ortak muamelesi yok' };
    const rows = partners.filter((p) => Number(p.vol) > 0).map((p) => ({ producer: p.id, vol: p.vol, share: CFT.r2(kalan * p.vol / toplam) })); const diff = CFT.r2(kalan - rows.reduce((s, r) => s + r.share, 0)); if (rows.length) rows[0].share = CFT.r2(rows[0].share + diff); return { yedek, kalan, toplam, rows };
  },
  // Tarla verimi: hasat işleminden kg/da
  yieldOf: (f, ops) => { const kg = (ops || []).filter((o) => o.field === f.id && o.type === 'hasat').reduce((s, o) => s + (Number(o.qty) || 0), 0); return f.area ? CFT.r2(kg / f.area) : 0; },
  nextReceipt: (purchases) => 'MM' + String(Math.max(0, ...(purchases || []).map((p) => Number(String(p.receipt || '').replace(/\D/g, '')) || 0)) + 1).padStart(6, '0'),
  newCode: () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''),
  seed(db) {
    const { rand, pick, addDays } = NS; const iso = NS.iso;
    db.data._settings = { bizName: 'Bereket Tarımsal Kalkınma Kooperatifi', bizPhone: '0332 555 77 88', bizAddress: 'Çumra, Konya', season: new Date().getFullYear(), reserve: 10, sharePrice: 100 };
    const V = ['Alibeyhüyüğü', 'Karkın', 'Dinek', 'Yenisu', 'Okçu'];
    db.data.producers = NS.NAMES.slice(0, 22).map((n, i) => ({ id: 'p' + i, name: n, phone: NS.phone(), village: pick(V), tc: String(10000000000 + rand(1, 899999999) * 10).slice(0, 11), iban: `TR${String(rand(10, 99))}00${String(rand(1e9, 9e9))}${String(rand(1e9, 9e9))}${String(rand(1e5, 9e5))}`.slice(0, 26), partner: i % 4 !== 3, partnerNo: i % 4 !== 3 ? 100 + i : null, shares: i % 4 !== 3 ? rand(1, 20) : 0, joined: iso(addDays(new Date(), -rand(300, 3000))), limit: pick([50000, 80000, 120000]), portalCode: 'CFT' + (2000 + i) }));
    db.data.products = [['Buğday', 'urun', 'kg', 'bitkisel'], ['Arpa', 'urun', 'kg', 'bitkisel'], ['Şeker pancarı', 'urun', 'kg', 'bitkisel'], ['Ayçiçeği', 'urun', 'kg', 'bitkisel'], ['Çiğ süt', 'urun', 'lt', 'hayvansal']].map(([name, kind, unit, cat], i) => ({ id: 'u' + i, name, kind, unit, cat, price: [14, 11, 3, 28, 19][i], stock: rand(1000, 40000), cost: 0 }));
    db.data.products.push(...[['DAP gübre (50 kg)', 'torba', 1450, 980, 0], ['Üre gübre (50 kg)', 'torba', 1200, 820, 0], ['Buğday tohumu (25 kg)', 'torba', 780, 560, 0], ['Yabancı ot ilacı (1 lt)', 'şişe', 690, 480, 1], ['Mantar ilacı (1 lt)', 'şişe', 840, 610, 1], ['Mazot (lt)', 'lt', 44, 40, 0]].map(([name, unit, price, cost, bku], i) => ({ id: 'g' + i, name, kind: 'girdi', unit, price, cost, bku: !!bku, stock: rand(20, 300), min: 20 })));
    const CR = ['Buğday', 'Arpa', 'Şeker pancarı', 'Ayçiçeği'];
    db.data.fields = db.data.producers.flatMap((p, i) => Array.from({ length: rand(1, 2) }, (_, k) => ({ id: `f${i}${k}`, producer: p.id, village: p.village, ada: rand(100, 900), parsel: rand(1, 80), area: rand(8, 90), crop: pick(CR), water: pick(['sulu', 'kuru']), own: pick(Object.keys(CFT.OWN)), season: new Date().getFullYear() })));
    const purchases = []; let no = 1; const U = db.data.products.filter((x) => x.kind === 'urun');
    for (let d = 120; d >= 0; d -= 2) for (let k = 0; k < rand(0, 2); k++) { const p = pick(db.data.producers); const u = pick(U); const gross = rand(2, 24) * 1000; const tes = Math.random() < 0.3; const at = addDays(new Date(), -d); const r = { id: NS.uid(), no: 'AL' + (2000 + no), at: at.toISOString(), producer: p.id, product: u.id, productName: u.name, gross, tare: rand(50, 200), fire: pick([0, 0, 1, 2]), price: u.price, tescil: tes, cat: u.cat, rate: CFT.rate(u.cat, tes), cut: 0, receipt: 'MM' + String(no).padStart(6, '0'), status: 'kayit' }; purchases.push(r); no++; }
    db.data.purchases = purchases;
    const G = db.data.products.filter((x) => x.kind === 'girdi'); const sales = [];
    for (let i = 0; i < 46; i++) { const p = pick(db.data.producers); const g = pick(G); const at = addDays(new Date(), -rand(1, 160)); sales.push({ id: NS.uid(), no: 'SA' + (5000 + i), at: at.toISOString(), producer: p.id, credit: Math.random() < 0.8, due: iso(addDays(at, 150)), vat: 20, lines: [{ product: g.id, name: g.name, qty: rand(1, 12), price: g.price, unit: g.unit, cost: g.cost }], ...(g.bku ? { rxNo: 'RX' + rand(1000, 9999) } : {}), status: 'kayit' }); }
    db.data.sales = sales;
    db.data.payments = Array.from({ length: 20 }, (_, i) => ({ id: NS.uid(), no: 'OD' + (300 + i), producer: pick(db.data.producers).id, dir: pick(['ver', 'ver', 'al']), amount: rand(5, 60) * 1000, method: pick(['Havale', 'Nakit']), at: addDays(new Date(), -rand(1, 100)).toISOString() }));
    db.data.fieldOps = db.data.fields.slice(0, 24).flatMap((f) => [{ id: NS.uid(), field: f.id, date: iso(addDays(new Date(), -rand(120, 200))), type: 'ekim', note: f.crop, cost: rand(800, 4000) }, { id: NS.uid(), field: f.id, date: iso(addDays(new Date(), -rand(60, 110))), type: pick(['gubre', 'ilac', 'sulama']), note: '', cost: rand(500, 3000) }, { id: NS.uid(), field: f.id, date: iso(addDays(new Date(), -rand(5, 50))), type: 'hasat', qty: f.area * rand(250, 620), note: '', cost: rand(600, 2500) }]);
    db.data.distributions = []; db.data.sms = [];
    db.data.users = [{ id: 'u1', name: 'Mustafa Başkan', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Fatma Muhasebe', role: 'muhasebe', pin: '1234', active: true }, { id: 'u3', name: 'Ali Kantar', role: 'kantar', pin: '1234', active: true }];
  },
};
