/* Kuyumcu — ayar/milyem, has ve tutar hesabı, sikke tanımları, demo verisi. Panel, vitrin kur ekranı ve testler (hesap.test.js) kullanır.
   Kurlar örnektir: "ornek" kaynaklı kur gerçek satışta kullanılamaz; dükkân kendi alış/satış fiyatını Kur ekranından girer veya kur servisine bağlar. */
window.KYM = {
  AYAR: { 24: 0.995, 22: 0.916, 21: 0.875, 18: 0.75, 14: 0.585, 8: 0.333 },
  // Sikke: brüt gram, milyem; alış/satış has çarpanı dükkân makasıyla (gram ağırlıkları haber kaynaklı, Darphane sayfası açılamadı: docs/urun/KUYUMCU.md §1)
  COINS: [{ id: 'ceyrek', name: 'Çeyrek Altın', g: 1.75, m: 0.916 }, { id: 'yarim', name: 'Yarım Altın', g: 3.5, m: 0.916 }, { id: 'tam', name: 'Tam Altın', g: 7.0, m: 0.916 }, { id: 'ata', name: 'Ata Lira', g: 7.216, m: 0.916 }, { id: 'gremse', name: 'Gremse (2,5)', g: 17.5, m: 0.916 }, { id: 'gram', name: 'Gram Altın (24 ayar)', g: 1, m: 0.995 }],
  CAT: ['Bilezik', 'Kolye', 'Yüzük', 'Küpe', 'Bileklik', 'Set', 'Alyans'],
  STONE: { '': 'Taşsız', dogal: 'Doğal taş', sentetik: 'Sentetik (laboratuvar üretimi) taş' },
  // Kimlik tespiti sınırının varsayılanı: önceki sınır. RG 7.10.2026-33393 (Karar 11845) değişikliğindeki yeni sınır resmî metinden okunamadı (docs/urun/KUYUMCU.md).
  ID_LIMIT: 185000,
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  r3: (x) => Math.round((Number(x) || 0) * 1000) / 1000,
  milyem(ayar) { const n = Number(ayar) || 0; return KYM.AYAR[n] || (n > 0 && n <= 1 ? n : n > 1 && n <= 24 ? n / 24 : 0); },
  has: (g, ayar) => KYM.r3((Number(g) || 0) * KYM.milyem(ayar)),
  // Taş ağırlığı altın değildir: has net gramdan hesaplanır
  netG: (it) => Math.max(0, (Number(it.g) || 0) - (Number(it.stoneG) || 0)),
  itemHas: (it) => KYM.has(KYM.netG(it), it.ayar),
  // İşçilik: ₺/gr (labor) ya da has milyemi (laborType 'mil': 1 gr için has binde kaç)
  laborTl(it, rate) { const g = Number(it.g) || 0, l = Number(it.labor) || 0; return KYM.r2(it.laborType === 'mil' ? (g * l / 1000) * (Number(rate) || 0) : g * l); },
  // Takı satış satırı: altın + işçilik + taş = fiyat (tam TL'ye yuvarlanır, kuruş farkı altın kaleminde kalır)
  itemPrice(it, rate) { const h = KYM.itemHas(it); const labor = KYM.laborTl(it, rate); const stone = KYM.r2(it.stoneVal); const price = Math.round(h * (Number(rate) || 0) + labor + stone); return { has: h, labor, stone, gold: KYM.r2(price - labor - stone), price }; },
  coinUnit(c, s, side) { const hb = Number(s.hasBuy) || 0, hs = Number(s.hasSell) || 0; return side === 'buy' ? Math.round(c.g * c.m * hb * (1 - (Number(s.coinBuyCut) || 0) / 100)) : Math.round(c.g * c.m * hs * (1 + (Number(s.coinSellAdd) || 0) / 100)); },
  coinLine(c, qty, s, side) { const u = KYM.coinUnit(c, s, side); return { kind: 'coin', ref: c.id, name: c.name, qty, has: KYM.r3(c.g * c.m * qty), unit: u, price: u * qty }; },
  // Hurda: brüt - taş/fire = net; net × milyem = has; has × alış kuru × (1 - kesinti)
  scrapLine(gross, fire, ayar, s) { const g = KYM.r3((Number(gross) || 0) - (Number(fire) || 0)); if (g <= 0) return null; const a = Number(ayar); const has = KYM.has(g, a); return { kind: 'hurda', name: `Hurda ${a} ayar`, ayar: a, gross: Number(gross) || 0, fire: Number(fire) || 0, g, has, price: Math.round(has * (Number(s.hasBuy) || 0) * (1 - (Number(s.scrapCut) || 0) / 100)) }; },
  // Kur tablosu: has alış/satış (TL/gr) + makas yüzdeleri
  rates(s) {
    const hb = Number(s.hasBuy) || 0, hs = Number(s.hasSell) || 0;
    const coin = KYM.COINS.map((c) => ({ ...c, buy: KYM.coinUnit(c, s, 'buy'), sell: KYM.coinUnit(c, s, 'sell') }));
    const ayar = Object.entries(KYM.AYAR).map(([k, m]) => ({ ayar: Number(k), buy: Math.round(m * hb * (1 - (Number(s.scrapCut) || 0) / 100) * 100) / 100, sell: Math.round(m * hs * 100) / 100 }));
    return { coin, ayar, usd: s.usd, eur: s.eur, at: s.rateAt };
  },
  // Kur durumu: yok (girilmemiş) · ornek (demo, gerçek değil) · eski (süresi dolmuş) · ok. Kaynağı bilinmeyen eski kayıtlar "kaynak belirtilmemiş" görünür.
  rateState(s, now = Date.now()) {
    const hb = Number(s.hasBuy) || 0, hs = Number(s.hasSell) || 0; const src = s.rateSource || '';
    if (!(hb > 0 && hs > 0)) return { level: 'yok', text: 'Kur girilmedi', min: null };
    if (src === 'ornek') return { level: 'ornek', text: 'ÖRNEK kur — gerçek piyasa fiyatı değildir', min: null };
    const t = s.rateAt ? new Date(s.rateAt).getTime() : NaN; const min = isNaN(t) ? Infinity : Math.max(0, Math.round((now - t) / 6e4)); const max = Number(s.rateMaxAge) || 60;
    if (min > max) return { level: 'eski', text: min === Infinity ? 'Kur tarihi bilinmiyor' : `Kur ${min} dk önce güncellendi`, min };
    return { level: 'ok', text: 'Kur güncel', min };
  },
  sourceText: (s) => { const x = s.rateSource || ''; return x === 'ornek' ? 'Örnek veri' : x ? x : 'Kaynak belirtilmemiş'; },
  // Kur servisi yanıtı: hasBuy/hasSell, alis/satis veya HAS.alis/satis (bilinen alanlar dışında tahmin yapılmaz)
  parseRate(j) {
    if (!j || typeof j !== 'object') throw new Error('Yanıt JSON değil'); const H = j.HAS || {};
    const num = (v) => { if (typeof v === 'string') v = v.trim().replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return Number(v); };
    const hb = num(j.hasBuy ?? j.alis ?? H.alis), hs = num(j.hasSell ?? j.satis ?? H.satis);
    if (!(hb > 0 && hs > 0)) throw new Error('Kur alanları bulunamadı'); if (hs < hb) throw new Error('Satış kuru alıştan düşük geldi');
    return { hasBuy: hb, hasSell: hs, at: j.tarih || j.date || j.updated || '' };
  },
  // TCMB gösterge kurları (tcmb.gov.tr/kurlar/today.xml): döviz satış; bulunamayan alan tahmin edilmez
  parseTcmb(xml) { const x = String(xml || ''); const cur = (k) => { const m = x.match(new RegExp(`<Currency[^>]*Kod="${k}"[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`)); return m ? Number(m[1]) : 0; }; const d = (x.match(/Tarih="([\d.]+)"/) || [])[1] || ''; const usd = cur('USD'), eur = cur('EUR'); if (!(usd > 0 && eur > 0) || !d) throw new Error('TCMB yanıtında USD/EUR bulunamadı'); return { usd, eur, date: d, bulletin: (x.match(/Bulten_No="([^"]+)"/) || [])[1] || '' }; },
  // Öneki aynı en büyük numaranın bir fazlası (silme/iptal sonrası çakışmaz)
  nextNo: (list, prefix, start) => prefix + (list.reduce((m, x) => { const s = String(x.no || x.code || ''); return s.startsWith(prefix) ? Math.max(m, Number(s.slice(prefix.length)) || 0) : m; }, start - 1) + 1),
  paysOf: (t) => (t.pays && t.pays.length ? t.pays : t.pay && t.pay !== '-' ? [{ m: t.pay, a: t.total }] : []),
  live: (t) => !t.canceled,
  // Brüt kâr: satışta tutar - has × işlem anındaki has alış kuru; alışta has × kur - ödenen. Emanet ve sipariş kapanışı makas değildir.
  margin(t, curBuy) {
    if (t.canceled || (t.type !== 'satis' && t.type !== 'alis')) return 0;
    const buy = Number(t.hasBuy) || (t.type === 'alis' ? Number(t.hasRate) : 0) || Number(curBuy) || 0; const has = t.lines.reduce((a, l) => a + (Number(l.has) || 0), 0); const val = t.lines.reduce((a, l) => a + (Number(l.price) || 0), 0);
    return KYM.r2(t.type === 'satis' ? val - (Number(t.disc) || 0) - has * buy : has * buy - val);
  },
  // Eski altın hesabından ödeme: hesap yalnızca has kısmını karşılar; işçilik ve taş TL ödenir
  goldPay: (lines) => ({ has: KYM.r3(lines.reduce((a, l) => a + (Number(l.has) || 0), 0)), tl: KYM.r2(lines.reduce((a, l) => a + (l.kind === 'item' ? (Number(l.labor) || 0) + (Number(l.stone) || 0) : 0), 0)) }),
  // KDV Kanunu md. 23/e: matrah, külçe altın bedeli düşüldükten sonra kalan miktardır. Burada külçe bedeli has × işlem has satış kuru alınır (tebliğdeki referans fiyat doğrulanmadı, müşavir onaylar).
  specialBase(t) { if (t.canceled || t.type !== 'satis') return null; const val = t.lines.reduce((a, l) => a + (Number(l.price) || 0), 0) - (Number(t.disc) || 0); const has = t.lines.reduce((a, l) => a + (Number(l.has) || 0), 0); const gold = KYM.r2(has * (Number(t.hasRate) || 0)); return { total: KYM.r2(val), gold, base: KYM.r2(Math.max(0, val - gold)) }; },
  // Aynı müşterinin bugünkü işlemleri bağlantılı sayılır (kimlik tespiti tek işlem veya bağlantılı işlemler toplamına bakar)
  linkedTotal: (tx, customer, day) => (customer ? tx.filter((t) => t.customer === customer && !t.canceled && String(t.at).slice(0, 10) === day && (t.type === 'satis' || t.type === 'alis')).reduce((a, t) => a + (Number(t.gross ?? t.total) || 0), 0) : 0),
  needsId: (amount, linked, limit) => (Number(amount) || 0) + (Number(linked) || 0) >= (Number(limit) || KYM.ID_LIMIT),
  // Hurda stoğu: alınan (iptal olmayan) hurda has'ı - toptancıya verilen
  scrapHas: (data) => KYM.r3((data.tx || []).reduce((a, t) => (t.canceled || t.type !== 'alis' ? a : a + t.lines.reduce((b, l) => (l.kind === 'hurda' ? b + (Number(l.has) || 0) : b), 0)), 0) - (data.supMoves || []).reduce((a, m) => a + (m.kind === 'hurda' ? Number(m.has) || 0 : 0), 0)),
  // Has pozisyonu: elde olan (takı + sikke + hurda) - borçlu olunan (toptancı has borcu + eski altın hesapları)
  position(data) {
    const items = (data.items || []).filter((x) => x.status === 'stok').reduce((a, x) => a + KYM.itemHas(x), 0); const coins = KYM.COINS.reduce((a, c) => a + ((data.coins || {})[c.id] || 0) * c.g * c.m, 0); const scrap = KYM.scrapHas(data);
    const sup = (data.suppliers || []).reduce((a, x) => a + (Number(x.hasDebt) || 0), 0); const cust = (data.customers || []).reduce((a, x) => a + (Number(x.hasBalance) || 0), 0);
    return { items: KYM.r3(items), coins: KYM.r3(coins), scrap, sup: KYM.r3(sup), cust: KYM.r3(cust), net: KYM.r3(items + coins + scrap - sup - cust) };
  },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Altınbaş Kuyumculuk', bizPhone: '0212 520 33 44', bizAddress: 'Kapalıçarşı, Kuyumcular Cad. No:41, Fatih/İstanbul', hasBuy: 4120, hasSell: 4185, usd: 41.9, eur: 48.6, rateAt: new Date().toISOString(), rateSource: 'ornek', fxSource: 'ornek', rateMaxAge: 60, coinBuyCut: 1.2, coinSellAdd: 2.4, scrapCut: 2, laborDefault: 180, rateUrl: '', idLimit: KYM.ID_LIMIT, discMax: 5 };
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
    db.data.customers = NS.NAMES.slice(0, 16).map((name, i) => ({ id: 'c' + i, name, phone: NS.phone(), hasBalance: 0, tl: 0, note: '' }));
    db.data.suppliers = [{ id: 'sup1', name: 'Atölye Kaya', phone: NS.phone(), hasDebt: 0, tlDebt: 0 }, { id: 'sup2', name: 'Gold Center', phone: NS.phone(), hasDebt: 0, tlDebt: 0 }, { id: 'sup3', name: 'Nur Kuyum İmalat', phone: NS.phone(), hasDebt: 0, tlDebt: 0 }];
    db.data.supMoves = []; db.data.cashLog = []; db.data.rateLog = []; db.data.counts = [];
    // İşlemler: satış, alış (hurda/sikke)
    const tx = []; const s = db.data._settings;
    for (let d = 30; d >= 0; d--) for (let k = 0; k < rand(5, 14); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(10, 19), rand(0, 59)); if (at > new Date()) continue;
      const hs = s.hasSell * (1 + rand(-30, 10) / 1000); const hb = s.hasBuy * (1 + rand(-30, 10) / 1000);
      const type = pick(['satis', 'satis', 'satis', 'alis', 'alis']); const cust = Math.random() < 0.4 ? pick(db.data.customers).id : null;
      let lines;
      if (Math.random() < 0.55) { const c = pick(KYM.COINS); const qty = c.id === 'gram' ? rand(1, 10) : rand(1, 4); lines = [KYM.coinLine(c, qty, { ...s, hasBuy: hb, hasSell: hs }, type === 'satis' ? 'sell' : 'buy')]; }
      else if (type === 'satis') { const ayar = pick([22, 14, 18]); const g = rand(25, 220) / 10; const labor = rand(100, 600); const p = KYM.itemPrice({ g, ayar, labor }, hs); lines = [{ kind: 'item', name: pick(['Bilezik', 'Kolye', 'Yüzük', 'Küpe']) + ` ${ayar} ayar`, ayar, g, ...p, labor: p.labor }]; }
      else lines = [KYM.scrapLine(rand(30, 300) / 10, 0, pick([22, 14, 18]), { ...s, hasBuy: hb })];
      tx.push({ id: NS.uid(), no: (type === 'satis' ? 'S' : 'A') + String(10000 + tx.length), type, at: at.toISOString(), customer: cust, lines, total: lines.reduce((a, l) => a + l.price, 0), hasRate: Math.round(type === 'satis' ? hs : hb), hasBuy: Math.round(hb), pay: type === 'satis' ? pick(['Nakit', 'Kredi kartı', 'Kredi kartı', 'Havale']) : pick(['Nakit', 'Havale']), user: pick(['Ercan Usta', 'Melis Tezgâh']) });
    }
    db.data.tx = tx;
    db.data.orders = [{ id: NS.uid(), type: 'siparis', customer: 'c3', at: addDays(new Date(), -4).toISOString(), desc: 'Tektaş yüzük 14 ayar, ölçü 14, 0.25 ct', due: NS.iso(addDays(new Date(), 6)), deposit: 5000, est: 28000, status: 'atolyede' }, { id: NS.uid(), type: 'siparis', customer: 'c7', at: addDays(new Date(), -1).toISOString(), desc: 'İsim kolye "Elif" 14 ayar', due: NS.iso(addDays(new Date(), 3)), deposit: 1000, est: 6800, status: 'siparis' }];
    db.data.cash = { tl: 185000 };
  },
};
