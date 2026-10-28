/* Pazaryeri Satıcı Paneli — kanal tanımları, kâr hesabı ve demo verisi. Panel (app.js) kullanır. */
window.PZR = {
  // Varsayılan oranlar örnektir; satıcı kendi sözleşmesindeki komisyonu Kanallar ekranından girer
  CH: {
    trendyol: { name: 'Trendyol', short: 'TY', color: '#f27a1a', commission: 21.5, fixedFee: 8.49, payoutDays: 7, shipDays: 1 },
    hepsiburada: { name: 'Hepsiburada', short: 'HB', color: '#ff6000', commission: 19, fixedFee: 6.99, payoutDays: 10, shipDays: 1 },
    n11: { name: 'n11', short: 'N11', color: '#5b2d90', commission: 16, fixedFee: 5.5, payoutDays: 7, shipDays: 2 },
    amazon: { name: 'Amazon TR', short: 'AMZ', color: '#232f3e', commission: 15, fixedFee: 0, payoutDays: 14, shipDays: 1 },
    pazarama: { name: 'Pazarama', short: 'PZR', color: '#0094d8', commission: 12, fixedFee: 0, payoutDays: 7, shipDays: 2 },
    ciceksepeti: { name: 'Çiçeksepeti', short: 'ÇS', color: '#d81e5b', commission: 20, fixedFee: 4.99, payoutDays: 10, shipDays: 1 },
    idefix: { name: 'İdefix', short: 'IDX', color: '#ffb300', commission: 17, fixedFee: 0, payoutDays: 10, shipDays: 2 },
  },
  // Canlı API adaptörü olan kanallar (server/connectors)
  LIVE: ['trendyol', 'hepsiburada', 'n11'],
  ST: { yeni: ['Yeni', 'info'], toplaniyor: ['Toplanıyor', 'warn'], paketlendi: ['Paketlendi', 'acc'], kargoda: ['Kargoda', ''], teslim: ['Teslim edildi', 'ok'], iptal: ['İptal', 'err'], iade: ['İade', 'err'] },
  RST: { talep: ['İade talebi', 'warn'], yolda: ['Kargoda (geliyor)', 'info'], geldi: ['Depoya ulaştı', 'acc'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi / itiraz', 'err'] },
  REASONS: ['Beden/ölçü uymadı', 'Beklediğim gibi değil', 'Kusurlu / hasarlı ürün', 'Yanlış ürün gönderildi', 'Vazgeçtim', 'Renk farklı'],
  CARRIERS: ['Trendyol Express', 'HepsiJET', 'Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'Sürat Kargo', 'PTT Kargo'],
  // Sipariş başına komisyon, hizmet bedeli, kargo, ürün maliyeti ve net kâr
  profit(o, chCfg, costOf) {
    const c = chCfg || {}; const gross = o.total || 0;
    const com = Math.round(gross * (Number(c.commission) || 0)) / 100; const fee = Number(c.fixedFee) || 0; const ship = Number(o.shipCost) || 0;
    const cost = (o.items || []).reduce((s, i) => s + (costOf(i) || 0) * i.qty, 0);
    const net = Math.round((gross - com - fee - ship) * 100) / 100; const kar = Math.round((net - cost) * 100) / 100;
    return { gross, com, fee, ship, net, cost, kar, marj: gross ? Math.round((kar / gross) * 1000) / 10 : 0 };
  },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Nova Ev & Yaşam', bizPhone: '0850 333 44 55', bizAddress: 'İkitelli OSB, Depo 12, Başakşehir/İstanbul', cutoff: '16:00', carrier: 'Yurtiçi Kargo', autoInvoice: true, autoStock: true, lowStock: 5,
      templates: 'Merhaba, ürünümüz stoklarımızda mevcuttur, siparişiniz aynı gün kargoya verilir. İyi alışverişler dileriz.\nMerhaba, ölçüler ürün açıklamasında yer almaktadır. Farklı bir sorunuz olursa yardımcı olmaktan memnuniyet duyarız.\nMerhaba, ürünümüz %100 pamuklu olup 40 derecede yıkanabilir.' };
    db.data.users = [{ id: 'u1', name: 'Deniz Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Kerem Depo', role: 'depo', pin: '1234', active: true }, { id: 'u3', name: 'Aslı Müşteri Hizmetleri', role: 'destek', pin: '1234', active: true }];
    db.data.channels = { trendyol: { connected: true, sellerId: '518204', mode: 'demo', buffer: 1 }, hepsiburada: { connected: true, sellerId: 'NOVA-EV-3301', mode: 'demo', buffer: 1 }, n11: { connected: true, sellerId: 'novaev', mode: 'demo', buffer: 2 }, amazon: { connected: true, sellerId: 'A2NOVAEV', mode: 'demo', buffer: 2 }, pazarama: { connected: false }, ciceksepeti: { connected: true, sellerId: 'nova-ev', mode: 'demo', buffer: 1 }, idefix: { connected: false } };
    const P = [['Pamuk Nevresim Takımı Çift Kişilik', 'Nevresim', 520, 1299], ['Pamuk Nevresim Takımı Tek Kişilik', 'Nevresim', 390, 949], ['Ranforce Çarşaf Seti', 'Nevresim', 210, 549], ['Bambu Havlu Seti 4\'lü', 'Banyo', 260, 699], ['Pamuk Bornoz Unisex', 'Banyo', 340, 899], ['Banyo Paspas Seti', 'Banyo', 95, 279], ['Kadife Kırlent Kılıfı 2\'li', 'Dekorasyon', 70, 229], ['Örme Battaniye 130x170', 'Dekorasyon', 230, 649], ['Seramik Vazo Mat', 'Dekorasyon', 110, 349], ['Çift Kişilik Yorgan Mikrofiber', 'Uyku', 380, 999], ['Visco Yastık', 'Uyku', 190, 549], ['Yastık Koruyucu Alez 2\'li', 'Uyku', 60, 199], ['Masa Örtüsü Keten 150x220', 'Mutfak', 120, 379], ['Mutfak Havlusu 6\'lı', 'Mutfak', 55, 169], ['Fırın Eldiveni Seti', 'Mutfak', 40, 139], ['Kahve Fincanı Takımı 6\'lı', 'Mutfak', 210, 599], ['Saklama Kutusu 3\'lü', 'Düzenleme', 85, 259], ['Vakumlu Hurç Seti', 'Düzenleme', 75, 229], ['Kapı Arkası Askı', 'Düzenleme', 45, 149], ['LED Mum Seti 3\'lü', 'Dekorasyon', 65, 219], ['Duş Perdesi Desenli', 'Banyo', 80, 249], ['Pike Takımı Yazlık', 'Nevresim', 300, 799]];
    const colors = ['Beyaz', 'Gri', 'Bej', 'Antrasit', 'Pudra', 'Mavi'];
    db.data.products = [];
    P.forEach(([name, cat, cost, price], i) => {
      const vars = ['Nevresim', 'Banyo', 'Dekorasyon'].includes(cat) && i % 3 !== 2 ? colors.slice(i % 3, (i % 3) + rand(2, 3)) : [''];
      vars.forEach((col, j) => {
        const sku = `NV-${String(100 + i)}${col ? '-' + col.slice(0, 3).toUpperCase() : ''}`;
        const stock = (i + j) % 9 === 4 ? rand(0, 3) : rand(6, 90);
        const ls = {}; Object.keys(PZR.CH).forEach((k, n) => { if (!db.data.channels[k].connected) return; if ((i + n) % 7 === 5) return; ls[k] = (i + j + n) % 13 === 6 ? 'hata' : stock === 0 ? 'stoksuz' : 'yayinda'; });
        db.data.products.push({ id: NS.uid(), sku, barcode: '869' + String(4400000000 + i * 37 + j * 3).slice(0, 10), name: name + (col ? ' — ' + col : ''), group: name, color: col, cat, cost, price, stock, loc: `${String.fromCharCode(65 + (i % 5))}-${String(1 + (i % 8)).padStart(2, '0')}-${1 + j}`, desi: cat === 'Uyku' || cat === 'Nevresim' ? rand(3, 6) : rand(1, 3), vat: 20, listings: ls, chPrice: {} });
      });
    });
    const prods = db.data.products;
    const cities = [['İstanbul', 'Kadıköy'], ['İstanbul', 'Esenyurt'], ['Ankara', 'Çankaya'], ['İzmir', 'Bornova'], ['Bursa', 'Nilüfer'], ['Antalya', 'Muratpaşa'], ['Konya', 'Selçuklu'], ['Adana', 'Seyhan'], ['Kocaeli', 'İzmit'], ['Gaziantep', 'Şehitkamil']];
    const chW = ['trendyol', 'trendyol', 'trendyol', 'trendyol', 'hepsiburada', 'hepsiburada', 'hepsiburada', 'n11', 'amazon', 'amazon', 'ciceksepeti'];
    const orders = []; let seq = 0;
    for (let d = 34; d >= 0; d--) for (let k = 0; k < rand(9, 18) + (d < 7 ? 3 : 0); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(0, 23), rand(0, 59)); if (at > new Date()) continue;
      const ch = pick(chW); const cfg = PZR.CH[ch];
      const n = Math.random() < 0.78 ? 1 : rand(2, 3);
      const items = []; for (let x = 0; x < n; x++) { const p = pick(prods); if (items.some((it) => it.pid === p.id)) continue; items.push({ pid: p.id, sku: p.sku, barcode: p.barcode, name: p.name, qty: Math.random() < 0.85 ? 1 : 2, price: Math.ceil(p.price * (1 + rand(0, 12) / 100)) - 0.1 }); }
      const total = Math.round(items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;
      const [city, district] = pick(cities); const name = pick(NS.NAMES);
      const shipBy = addDays(at, cfg.shipDays); shipBy.setHours(23, 59, 0, 0);
      const o = { id: NS.uid(), ch, chNo: cfg.short === 'TY' ? String(rand(9, 10)) + rand(100000000, 999999999) : cfg.short + rand(1000000, 9999999) + String(seq++).padStart(3, '0'), pkgNo: String(rand(1000000000, 2999999999)), at: at.toISOString(), shipBy: shipBy.toISOString(), customer: { name, phone: NS.phone(), city, district, address: `${pick(['Cumhuriyet', 'Atatürk', 'İnönü', 'Fatih', 'Yıldız'])} Mah. ${pick(['Gül', 'Lale', 'Çınar', 'Menekşe'])} Sok. No:${rand(1, 80)} D:${rand(1, 20)}` }, items, total, shipCost: rand(42, 78), carrier: ch === 'trendyol' ? 'Trendyol Express' : ch === 'hepsiburada' ? 'HepsiJET' : pick(['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo']), history: [{ at: at.toISOString(), st: 'yeni', note: `${cfg.name} siparişi alındı` }] };
      const age = (Date.now() - at.getTime()) / 864e5;
      const step = (st, h, note) => { o.history.push({ at: new Date(Math.min(Date.now() - 6e4, at.getTime() + h * 3600e3)).toISOString(), st, note }); o.status = st; };
      o.status = 'yeni';
      if (Math.random() < 0.035 && age > 0.3) step('iptal', 2, 'Müşteri iptal etti');
      else if (age > 1.2) {
        step('toplaniyor', rand(2, 8), 'Toplama listesine alındı'); step('paketlendi', 10, 'Paketlendi, fatura kesildi'); o.invoice = 'EAR2026' + String(rand(100000, 999999));
        o.tracking = String(rand(700000000000, 799999999999)); step('kargoda', 14, `${o.carrier} · ${o.tracking}`);
        if (age > 3.5) { o.deliveredAt = new Date(at.getTime() + rand(48, 80) * 3600e3).toISOString(); step('teslim', rand(48, 80), 'Alıcıya teslim edildi'); }
      } else if (age > 0.7) { step('toplaniyor', 2, 'Toplama listesine alındı'); if (Math.random() < 0.6) { step('paketlendi', 5, 'Barkodla doğrulandı'); o.invoice = 'EAR2026' + String(rand(100000, 999999)); o.tracking = String(rand(700000000000, 799999999999)); } } else if (age > 0.3 && Math.random() < 0.35) step('toplaniyor', 2, 'Toplama listesine alındı');
      orders.push(o);
    }
    // Bugünün geciken / son gün siparişleri
    orders.filter((o) => o.status === 'yeni').slice(0, 3).forEach((o) => { o.shipBy = new Date(Date.now() + rand(1, 5) * 3600e3).toISOString(); });
    db.data.orders = orders;
    // İadeler: teslim edilmiş siparişlerin bir kısmı
    db.data.returns = orders.filter((o) => o.status === 'teslim').filter((_, i) => i % 14 === 3).map((o, i) => {
      const at = new Date(new Date(o.deliveredAt).getTime() + rand(1, 5) * 864e5); const st = at > addDays(new Date(), -2) ? pick(['talep', 'yolda']) : pick(['geldi', 'onay', 'onay', 'onay', 'red']);
      o.status = 'iade'; o.history.push({ at: at.toISOString(), st: 'iade', note: 'Müşteri iade talebi oluşturdu' });
      return { id: NS.uid(), no: 'IA' + (10240 + i), oid: o.id, ch: o.ch, at: (at > new Date() ? new Date() : at).toISOString(), reason: pick(PZR.REASONS), items: o.items.slice(0, 1).map((x) => ({ ...x })), status: st, condition: ['onay', 'red'].includes(st) ? (st === 'red' ? 'hasarli' : 'saglam') : '', note: st === 'red' ? 'Ürün kullanılmış, etiketi sökülmüş — fotoğraflı itiraz açıldı' : '' };
    });
    const Q = ['Ürünün ölçüleri nedir?', 'Pamuk oranı yüzde kaç?', 'Bugün sipariş verirsem ne zaman kargoya verilir?', 'Makinede yıkanabilir mi, çeker mi?', 'Gri rengi tekrar gelecek mi?', 'Çift kişilik yatağa uyar mı (160x200)?', 'Faturalı mı gönderiyorsunuz?', 'Hediye paketi yapılıyor mu?'];
    db.data.questions = Q.map((t, i) => { const p = pick(prods); const at = new Date(Date.now() - rand(1, 50) * 3600e3); const done = i > 4; return { id: NS.uid(), ch: pick(['trendyol', 'trendyol', 'hepsiburada', 'amazon', 'n11']), pid: p.id, text: t, customer: pick(['A*** K***', 'M*** T***', 'S*** Y***', 'E*** D***', 'B*** Ö***']), at: at.toISOString(), answer: done ? 'Merhaba, ürünümüz stoklarımızda mevcuttur, siparişiniz aynı gün kargoya verilir. İyi alışverişler dileriz.' : '', answeredAt: done ? new Date(at.getTime() + 2 * 3600e3).toISOString() : null }; });
    db.data.picklists = [];
    db.data.synclog = Object.keys(PZR.CH).filter((k) => db.data.channels[k].connected).flatMap((k) => [{ id: NS.uid(), at: addDays(new Date(), 0).toISOString(), ch: k, action: 'Stok senkronu', detail: `${rand(30, 48)} ürün güncellendi`, ok: true }, { id: NS.uid(), at: new Date(Date.now() - 9e5).toISOString(), ch: k, action: 'Sipariş çekme', detail: `${rand(0, 3)} yeni sipariş`, ok: true }]);
  },
};
