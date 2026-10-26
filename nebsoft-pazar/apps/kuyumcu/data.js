/* Kuyumcu — ayar/milyem, has hesabı, sikke tanımları, demo verisi. Panel ve vitrin kur ekranı kullanır.
   Kurlar örnektir; dükkân kendi alış/satış fiyatını Kur ekranından girer veya kur servisine bağlar. */
window.KYM = {
  AYAR: { 24: 0.995, 22: 0.916, 21: 0.875, 18: 0.75, 14: 0.585, 8: 0.333 },
  // Sikke: brüt gram, milyem; alış/satış has çarpanı dükkân makasıyla
  COINS: [{ id: 'ceyrek', name: 'Çeyrek Altın', g: 1.75, m: 0.916 }, { id: 'yarim', name: 'Yarım Altın', g: 3.5, m: 0.916 }, { id: 'tam', name: 'Tam Altın', g: 7.0, m: 0.916 }, { id: 'ata', name: 'Ata Lira', g: 7.216, m: 0.916 }, { id: 'gremse', name: 'Gremse (2,5)', g: 17.5, m: 0.916 }, { id: 'gram', name: 'Gram Altın (24 ayar)', g: 1, m: 0.995 }],
  CAT: ['Bilezik', 'Kolye', 'Yüzük', 'Küpe', 'Bileklik', 'Set', 'Alyans'],
  has: (g, ayar) => Math.round(g * (KYM.AYAR[ayar] || ayar) * 1000) / 1000,
  // Kur tablosu: has alış/satış (TL/gr) + makas yüzdeleri
  rates(s) {
    const hb = Number(s.hasBuy) || 0, hs = Number(s.hasSell) || 0;
    const coin = KYM.COINS.map((c) => ({ ...c, buy: Math.round(c.g * c.m * hb * (1 - (Number(s.coinBuyCut) || 0) / 100)), sell: Math.round(c.g * c.m * hs * (1 + (Number(s.coinSellAdd) || 0) / 100)) }));
    const ayar = Object.entries(KYM.AYAR).map(([k, m]) => ({ ayar: Number(k), buy: Math.round(m * hb * (1 - (Number(s.scrapCut) || 0) / 100) * 100) / 100, sell: Math.round(m * hs * 100) / 100 }));
    return { coin, ayar, usd: s.usd, eur: s.eur, at: s.rateAt };
  },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Altınbaş Kuyumculuk', bizPhone: '0212 520 33 44', bizAddress: 'Kapalıçarşı, Kuyumcular Cad. No:41, Fatih/İstanbul', hasBuy: 4120, hasSell: 4185, usd: 41.9, eur: 48.6, rateAt: new Date().toISOString(), coinBuyCut: 1.2, coinSellAdd: 2.4, scrapCut: 2, laborDefault: 180, rateUrl: '' };
    db.data.users = [{ id: 'u1', name: 'Ercan Usta', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Melis Tezgâh', role: 'tezgah', pin: '1234', active: true }];
    const items = [];
    const mk = (cat, name, ayar, g, labor) => items.push({ id: NS.uid(), code: 'K' + (5000 + items.length), cat, name, ayar, g, labor, status: 'stok', at: addDays(new Date(), -rand(5, 200)).toISOString(), supplier: pick(['Atölye Kaya', 'Gold Center', 'Nur Kuyum İmalat']) });
    for (let i = 0; i < 9; i++) mk('Bilezik', pick(['Hasır Bilezik', 'Burma Bilezik', 'Trabzon Hasır', 'Ajda Bilezik', 'Mega Bilezik']), 22, rand(90, 240) / 10, rand(80, 140));
    for (let i = 0; i < 7; i++) mk('Kolye', pick(['Su Yolu Kolye', 'Kalp Kolye', 'Harf Kolye', 'İsim Kolye', 'Zincir 45 cm']), pick([14, 14, 18]), rand(22, 85) / 10, rand(250, 600));
    for (let i = 0; i < 8; i++) mk('Yüzük', pick(['Tektaş Yüzük', 'Beştaş Yüzük', 'Şövalye Yüzük', 'Taşlı Yüzük']), pick([14, 18]), rand(18, 60) / 10, rand(300, 900));
    for (let i = 0; i < 6; i++) mk('Küpe', pick(['Halka Küpe', 'Damla Küpe', 'Sallantılı Küpe']), 14, rand(12, 45) / 10, rand(200, 450));
    for (let i = 0; i < 6; i++) mk('Alyans', pick(['Düz Alyans', 'Kesme Alyans', 'Taşlı Alyans']), pick([14, 22]), rand(28, 70) / 10, rand(150, 400));
    db.data.items = items;
    db.data.coins = { ceyrek: rand(40, 120), yarim: rand(15, 40), tam: rand(8, 25), ata: rand(4, 15), gremse: rand(1, 4), gram: rand(30, 80) };
    db.data.customers = NS.NAMES.slice(0, 16).map((name, i) => ({ id: 'c' + i, name, phone: NS.phone(), hasBalance: i % 5 === 2 ? Math.round(rand(5, 60)) / 1 : 0, tl: 0, note: i % 5 === 2 ? 'Altın hesabı (emanet)' : '' }));
    // İşlemler: satış, alış (hurda/sikke), emanet
    const tx = []; const s = db.data._settings;
    for (let d = 30; d >= 0; d--) for (let k = 0; k < rand(5, 14); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(10, 19), rand(0, 59)); if (at > new Date()) continue;
      const hs = s.hasSell * (1 + rand(-30, 10) / 1000); const hb = s.hasBuy * (1 + rand(-30, 10) / 1000);
      const type = pick(['satis', 'satis', 'satis', 'alis', 'alis']); const cust = Math.random() < 0.4 ? pick(db.data.customers).id : null;
      let lines;
      if (Math.random() < 0.55) { const c = pick(KYM.COINS); const qty = c.id === 'gram' ? rand(1, 10) : rand(1, 4); lines = [{ kind: 'coin', ref: c.id, name: c.name, qty, has: Math.round(c.g * c.m * qty * 1000) / 1000, price: type === 'satis' ? Math.round(c.g * c.m * hs * (1 + s.coinSellAdd / 100)) * qty : Math.round(c.g * c.m * hb * (1 - s.coinBuyCut / 100)) * qty }]; }
      else if (type === 'satis') { const ayar = pick([22, 14, 18]); const g = rand(25, 220) / 10; const labor = rand(100, 600); lines = [{ kind: 'item', name: pick(['Bilezik', 'Kolye', 'Yüzük', 'Küpe']) + ` ${ayar} ayar`, ayar, g, has: KYM.has(g, ayar), labor, price: Math.round(KYM.has(g, ayar) * hs + labor * g) }]; }
      else { const ayar = pick([22, 14, 18]); const g = rand(30, 300) / 10; lines = [{ kind: 'hurda', name: `Hurda ${ayar} ayar`, ayar, g, has: KYM.has(g, ayar), price: Math.round(KYM.has(g, ayar) * hb * (1 - s.scrapCut / 100)) }]; }
      tx.push({ id: NS.uid(), no: (type === 'satis' ? 'S' : 'A') + String(10000 + tx.length), type, at: at.toISOString(), customer: cust, lines, total: lines.reduce((a, l) => a + l.price, 0), hasRate: Math.round(type === 'satis' ? hs : hb), pay: type === 'satis' ? pick(['Nakit', 'Kredi kartı', 'Kredi kartı', 'Havale']) : pick(['Nakit', 'Havale']), user: pick(['Ercan Usta', 'Melis Tezgâh']) });
    }
    db.data.tx = tx;
    db.data.orders = [{ id: NS.uid(), customer: 'c3', at: addDays(new Date(), -4).toISOString(), desc: 'Tektaş yüzük 14 ayar, ölçü 14, 0.25 ct', due: NS.iso(addDays(new Date(), 6)), deposit: 5000, est: 28000, status: 'atolyede' }, { id: NS.uid(), customer: 'c7', at: addDays(new Date(), -1).toISOString(), desc: 'İsim kolye "Elif" 14 ayar', due: NS.iso(addDays(new Date(), 3)), deposit: 1000, est: 6800, status: 'siparis' }];
    db.data.cash = { tl: 185000 };
  },
};
