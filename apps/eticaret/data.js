/* E-ticaret demo verisi ve ortak hesaplar — yönetim paneli ve mağaza vitrini kullanır */
window.SHOP = {
  CAT_EMOJI: { elbise: '👗', bluz: '👚', pantolon: '👖', ceket: '🧥', aksesuar: '👜', ayakkabi: '👟' },
  COLORS: { Siyah: '#111827', Beyaz: '#f3f4f6', Bej: '#d6c3a5', Lacivert: '#1e3a8a', Bordo: '#7f1d1d', Haki: '#4d5b3a', Pudra: '#f4c2c2', Gri: '#9ca3af' },
  ST: { yeni: ['Yeni sipariş', 'warn'], hazirlaniyor: ['Hazırlanıyor', 'info'], kargoda: ['Kargoda', 'acc'], teslim: ['Teslim edildi', 'ok'], iptal: ['İptal', 'err'], iade: ['İade edildi', ''] },
  seed(db) {
    const { rand, pick, addDays, iso } = NS;
    db.data._settings = { bizName: 'Lina Butik', bizPhone: '0850 333 44 55', bizAddress: 'Nişantaşı, İstanbul', freeShip: 750, shipFee: 79, banner: 'Sonbahar koleksiyonu yayında · 750 ₺ üzeri kargo bedava', carriers: 'Yurtiçi Kargo, Aras Kargo, MNG Kargo, Sürat Kargo', codFee: 30 };
    db.data.users = [{ id: 'u1', name: 'Lina Mağaza Sahibi', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Ece Depo', role: 'depo', pin: '1234', active: true }];
    db.data.cats = [{ id: 'elbise', name: 'Elbise' }, { id: 'bluz', name: 'Bluz & Gömlek' }, { id: 'pantolon', name: 'Pantolon & Etek' }, { id: 'ceket', name: 'Ceket & Mont' }, { id: 'aksesuar', name: 'Çanta & Aksesuar' }, { id: 'ayakkabi', name: 'Ayakkabı' }];
    const P = [
      ['elbise', 'Saten Midi Elbise', 1299, 999, ['Siyah', 'Bordo', 'Pudra']], ['elbise', 'Keten Gömlek Elbise', 1149, null, ['Bej', 'Beyaz']], ['elbise', 'Örme Kazak Elbise', 1399, 1119, ['Gri', 'Bej', 'Siyah']], ['elbise', 'Çiçekli Şifon Elbise', 1049, null, ['Pudra', 'Lacivert']],
      ['bluz', 'Oversize Poplin Gömlek', 749, null, ['Beyaz', 'Lacivert']], ['bluz', 'Fırfırlı Saten Bluz', 699, 559, ['Bej', 'Siyah', 'Pudra']], ['bluz', 'Basic Pamuklu Tişört', 349, null, ['Beyaz', 'Siyah', 'Gri']], ['bluz', 'Triko Hırka', 899, null, ['Bej', 'Haki']],
      ['pantolon', 'Yüksek Bel Palazzo Pantolon', 899, 719, ['Siyah', 'Bej']], ['pantolon', 'Mom Jean', 949, null, ['Lacivert']], ['pantolon', 'Pileli Midi Etek', 799, null, ['Siyah', 'Bordo', 'Haki']], ['pantolon', 'Kumaş Kargo Pantolon', 849, null, ['Haki', 'Bej']],
      ['ceket', 'Kaşe Kaban', 2899, 2399, ['Bej', 'Siyah', 'Gri']], ['ceket', 'Oversize Blazer Ceket', 1699, null, ['Siyah', 'Bej']], ['ceket', 'Deri Görünümlü Ceket', 1499, null, ['Siyah']], ['ceket', 'Şişme Mont', 2199, 1799, ['Siyah', 'Haki', 'Beyaz']],
      ['aksesuar', 'Hasır Omuz Çantası', 649, null, ['Bej']], ['aksesuar', 'Deri Görünümlü El Çantası', 899, 699, ['Siyah', 'Bordo']], ['aksesuar', 'İpek Eşarp', 449, null, ['Pudra', 'Lacivert']], ['aksesuar', 'Hasır Şapka', 399, null, ['Bej']],
      ['ayakkabi', 'Topuklu Sandalet', 1199, null, ['Siyah', 'Bej']], ['ayakkabi', 'Babet', 699, 559, ['Siyah', 'Pudra']], ['ayakkabi', 'Chunky Sneaker', 1399, null, ['Beyaz']], ['ayakkabi', 'Çizme', 2299, 1899, ['Siyah', 'Bordo']],
    ];
    db.data.products = P.map(([cat, name, price, sale, colors], i) => {
      const sizes = cat === 'ayakkabi' ? ['36', '37', '38', '39', '40'] : cat === 'aksesuar' ? ['Standart'] : ['XS', 'S', 'M', 'L', 'XL'];
      const variants = colors.flatMap((c) => sizes.map((s) => ({ id: NS.uid(), color: c, size: s, stock: Math.random() < 0.12 ? 0 : rand(0, 14), sku: `LB${String(100 + i)}-${c.slice(0, 3).toUpperCase()}-${s}` })));
      return { id: 'p' + i, name, slug: NS.slug(name), cat, price, sale, cost: Math.round(price * 0.42), desc: `${name}. Rahat kesim, günlük ve özel günlerde kullanıma uygun. Model ${pick(['S', 'M'])} beden giymektedir. %${rand(60, 100)} pamuk.`, colors, variants, tags: [i % 7 === 0 ? 'Yeni' : '', i % 5 === 2 ? 'Çok satan' : ''].filter(Boolean), active: true, views: rand(120, 4200), created: addDays(new Date(), -rand(1, 120)).toISOString() };
    });
    db.data.coupons = [{ id: 'k1', code: 'HOSGELDIN', type: 'pct', value: 10, min: 500, active: true, uses: 48 }, { id: 'k2', code: 'KARGO0', type: 'ship', value: 0, min: 300, active: true, uses: 21 }, { id: 'k3', code: 'SONBAHAR150', type: 'tl', value: 150, min: 1500, active: true, uses: 9 }];
    const cities = ['İstanbul', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir', 'Kocaeli'];
    const customers = NS.NAMES.filter((n) => NS.sampleGender(n) === 'K').concat(['Hande Er', 'Melis Tan', 'İpek Sarı', 'Ceren Ak', 'Aslı Koç']).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), email: NS.slug(n).replace('-', '.') + '@mail.com', city: pick(cities), address: `${pick(['Cumhuriyet', 'Atatürk', 'Bahçelievler', 'Yenimahalle'])} Mah. ${rand(1, 80)}. Sok. No:${rand(1, 40)}` }));
    db.data.customers = customers;
    const orders = []; let no = 10400;
    for (let d = 45; d >= 0; d--) {
      for (let k = 0; k < rand(2, 8); k++) {
        const at = addDays(new Date(), -d); at.setHours(rand(8, 23), rand(0, 59)); if (at > new Date()) continue;
        const c = pick(customers); const items = [];
        for (let j = 0; j < rand(1, 3); j++) { const p = pick(db.data.products); const v = pick(p.variants); items.push({ pid: p.id, vid: v.id, name: p.name, variant: `${v.color} / ${v.size}`, qty: 1, price: p.sale || p.price }); }
        const sub = items.reduce((t, i) => t + i.price * i.qty, 0); const ship = sub >= 750 ? 0 : 79;
        const status = d > 6 ? (Math.random() < 0.06 ? 'iade' : Math.random() < 0.04 ? 'iptal' : 'teslim') : d > 2 ? pick(['kargoda', 'teslim']) : d > 0 ? pick(['hazirlaniyor', 'kargoda']) : pick(['yeni', 'yeni', 'hazirlaniyor']);
        orders.push({ id: 'o' + no, no: 'LB' + ++no, at: at.toISOString(), customer: c.id, ship: { name: c.name, phone: c.phone, city: c.city, address: c.address }, items, subtotal: sub, discount: 0, shipping: ship, total: sub + ship, pay: pick(['kart', 'kart', 'kart', 'kapida', 'havale']), status, carrier: ['kargoda', 'teslim', 'iade'].includes(status) ? pick(['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo']) : '', tracking: ['kargoda', 'teslim', 'iade'].includes(status) ? String(rand(100000000, 999999999)) + rand(100, 999) : '', channel: pick(['Instagram', 'Google', 'Doğrudan', 'Instagram', 'TikTok']), note: '' });
      }
    }
    db.data.orders = orders; db.data._meta._seq_orders = no;
    db.data.carts = Array.from({ length: 7 }, () => { const p = pick(db.data.products); const c = pick(customers); return { id: NS.uid(), at: addDays(new Date(), -rand(0, 5)).toISOString(), name: c.name, phone: c.phone, items: [{ pid: p.id, name: p.name, qty: 1, price: p.sale || p.price }], total: p.sale || p.price, reminded: false }; });
    db.data.returns = [{ id: 'rt1', order: orders[orders.length - 30].id, reason: 'Beden uymadı', at: addDays(new Date(), -1).toISOString(), status: 'bekliyor' }];
  },
  // Ürün fotoğrafları (Unsplash) — ürün sırasıyla eşleşir; bağlantı açılmazsa renkli yer tutucu gösterilir
  PHOTOS: {
    p0: ['1566174053879-31528523f8ae', '1515372039744-b8f02a3ae446', '1595777457583-95e059d581b8'],
    p1: ['1591369822096-ffd140ec948f', '1539008835657-9e8e9680c956'],
    p2: ['1585487000160-6ebcfceb0d03', '1496747611176-843222e1e57c'],
    p3: ['1572804013309-59a88b7e92f1', '1496747611176-843222e1e57c', '1539008835657-9e8e9680c956'],
    p4: ['1602810318383-e386cc2a3ccf', '1596755094514-f87e34085b2c'],
    p5: ['1581044777550-4cfa60707c03', '1469334031218-e382a71b716b'],
    p6: ['1521572163474-6864f9cf17ab', '1583743814966-8936f5b7be1a', '1562157873-818bc0726f68'],
    p7: ['1434389677669-e08b4cac3105', '1578587018452-892bacefd3f2'],
    p8: ['1509631179647-0177331693ae'],
    p9: ['1541099649105-f69ad21f3246', '1604176354204-9268737828e4', '1542272604-787c3835535d'],
    p10: ['1475180098004-ca77a66827be', '1617922001439-4a2e6562f328'],
    p11: ['1594633312681-425c7b97ccd1', '1542272604-787c3835535d'],
    p12: ['1554412933-514a83d2f3c8', '1539533018447-63fcce2678e3'],
    p13: ['1485968579580-b6d095142e6e', '1617137968427-85924c800a22'],
    p14: ['1551028719-00167b16eac5', '1487222477894-8943e31ef7b2'],
    p15: ['1591047139829-d91aecb6caea', '1483985988355-763728e1935b'],
    p16: ['1590874103328-eac38a683ce7', '1594223274512-ad4803739b7c'],
    p17: ['1584917865442-de89df76afd3', '1594223274512-ad4803739b7c'],
    p18: ['1525507119028-ed4c629a60a3', '1524504388940-b1c1722653e1'],
    p19: ['1617922001439-4a2e6562f328', '1554412933-514a83d2f3c8'],
    p20: ['1543163521-1bf539c55dd2', '1535043934128-cf0b28d52f95'],
    p21: ['1535043934128-cf0b28d52f95'],
    p22: ['1560769629-975ec94e6a86', '1595950653106-6c9ebd614d3a', '1549298916-b41d501d3772'],
    p23: ['1608256246200-53e635b5b65f', '1520639888713-7851133b1ed0'],
  },
  SCENES: { hero1: '1441986300917-64674bd600d8', hero2: '1490481651871-ab68de25d43d', hero3: '1483985988355-763728e1935b', edit: '1445205170230-053b83016050', elbise: '1595777457583-95e059d581b8', bluz: '1581044777550-4cfa60707c03', pantolon: '1509631179647-0177331693ae', ceket: '1539533018447-63fcce2678e3', aksesuar: '1584917865442-de89df76afd3', ayakkabi: '1543163521-1bf539c55dd2', gallery: ['1469334031218-e382a71b716b', '1475180098004-ca77a66827be', '1566174053879-31528523f8ae', '1617922001439-4a2e6562f328', '1554412933-514a83d2f3c8', '1485968579580-b6d095142e6e'] },
  // Yüklenen fotoğraf kayda gömülü data adresidir, olduğu gibi kullanılır; örnek ürünlerde demo görsel kimliği adrese çevrilir
  imgUrl: (id, w = 600, h = 0) => (/^(data:image\/|\/f\/)/.test(String(id)) ? id : `https://images.unsplash.com/photo-${id}?w=${w}${h ? '&h=' + h : ''}&q=75&auto=format&fit=crop`),
  // Sıra: işletmenin yüklediği fotoğraflar, demo ürünün görseli, ürün rengiyle yer tutucu (ürüne ait olmayan görsel gösterilmez)
  photos(p) { const own = (p.photos || []).filter((u) => /^data:image\/(jpeg|png|webp);base64,|^\/f\/[0-9a-f]{16}\/[0-9a-f]{32}$/.test(String(u))); if (own.length) return own; return (this.PHOTOS[p.id] || []).length ? this.PHOTOS[p.id] : [this.fallback(p)]; },
  // Bulutta fotoğraf sunucu deposundadır, toplam alanı sunucu kotası denetler (sunucu: true). Yerelde ve eski kayıtlarda kayda gömülüdür: toplam sınır burada
  PHOTO: { perProduct: 4, perPhoto: 350e3, total: 10e6, local: 3e6, doc: 18e6 },
  // Eklenebilir mi: boş dönerse sığar, değilse kullanıcıya gösterilecek ileti. products: tüm ürünler, p: düzenlenen ürün (taslak olabilir)
  photoCheck(products, p, chars, { docChars = 0, local = false, sunucu = false } = {}) {
    const L = this.PHOTO; const size = (x) => (x.photos || []).reduce((t, u) => t + String(u).length, 0);
    if ((p.photos || []).length >= L.perProduct) return `Bir ürüne en fazla ${L.perProduct} fotoğraf eklenebilir. Yeni fotoğraf için önce birini silin.`;
    if (sunucu) return '';
    const max = local ? L.local : L.total; const used = (products || []).filter((x) => x.id !== p.id).reduce((t, x) => t + size(x), 0) + size(p);
    if (used + chars > max) return `Mağazanın toplam fotoğraf alanı doldu (${Math.round(max / 1e6)} MB). Yeni fotoğraf için başka ürünlerden fotoğraf silin.`;
    if (docChars + chars > L.doc) return 'Mağaza kaydı büyüdüğü için yeni fotoğraf eklenemiyor. Önce kullanılmayan ürünlerin fotoğraflarını silin.';
    return '';
  },
  // Fotoğraf açılmazsa ürün rengiyle yer tutucu
  fallback(p) { const c = this.COLORS[(p.colors || [])[0]] || '#d6c3a5'; return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".25"/><stop offset="1" stop-color="${c}" stop-opacity=".7"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><text x="150" y="215" font-size="90" text-anchor="middle">${this.CAT_EMOJI[p.cat] || '🛍️'}</text></svg>`)}`; },
  // Ürün yorumları (yoksa örnek yorumlar üretilir)
  ensureReviews(db) {
    if (db.data.reviews) return;
    const T = ['Kumaşı çok kaliteli, fotoğraftaki gibi geldi.', 'Kalıbı tam oturdu, kendi bedeninizi alabilirsiniz.', 'Kargo çok hızlıydı, paketleme özenliydi.', 'Rengi ekranda göründüğünden biraz daha koyu ama çok beğendim.', 'Fiyatına göre gerçekten çok iyi.', 'İkinci kez sipariş verdim, tavsiye ederim.', 'Bir beden büyük almanızı öneririm.', 'Günlük kullanım için çok rahat.'];
    const names = NS.NAMES.filter((n) => NS.sampleGender(n) === 'K');
    db.data.reviews = db.data.products.flatMap((p, i) => Array.from({ length: 2 + (i * 7) % 6 }, (_, k) => ({ id: NS.uid(), pid: p.id, name: names[(i + k * 3) % names.length].replace(/ (\S)\S*$/, ' $1.'), rating: [5, 5, 4, 5, 4, 3, 5][(i + k) % 7], text: T[(i * 3 + k) % T.length], size: ['S', 'M', 'L', '38'][k % 4], at: NS.addDays(new Date(), -((i * 5 + k * 9) % 80) - 1).toISOString(), verified: k % 3 !== 2 })));
    db.save();
  },
  rating(db, pid) { const r = (db.data.reviews || []).filter((x) => x.pid === pid); return { n: r.length, avg: r.length ? Math.round((r.reduce((t, x) => t + x.rating, 0) / r.length) * 10) / 10 : 0 }; },
  price: (p) => p.sale || p.price,
  stock: (p) => p.variants.reduce((t, v) => t + v.stock, 0),
  // Kupon geçerli mi: boş dönerse geçerli (sunucu tarafı: server/cloud/public-rules.js shopCoupon)
  couponCheck(k, day = NS.today()) { if (k.start && day < k.start) return `Bu kupon ${NS.date(k.start)} tarihinde başlıyor`; if (k.end && day > k.end) return 'Bu kuponun süresi doldu'; if (Number(k.maxUses) && (k.uses || 0) >= Number(k.maxUses)) return 'Bu kuponun kullanım hakkı doldu'; return ''; },
  // Sepet toplamı: ara toplam, kupon, kargo
  totals(db, items, couponCode, pay) {
    const s = db.settings({ freeShip: 750, shipFee: 79, codFee: 30 });
    const sub = items.reduce((t, i) => t + i.price * i.qty, 0);
    const k = couponCode && db.find('coupons', (c) => c.code === couponCode && c.active);
    let discount = 0, freeByCoupon = false, msg = k ? SHOP.couponCheck(k) : '';
    if (k && !msg) { if (sub < (k.min || 0)) msg = `Bu kupon ${NS.money(k.min)} ve üzeri alışverişte geçerli`; else if (k.type === 'pct') discount = Math.round(sub * k.value) / 100; else if (k.type === 'tl') discount = Math.min(sub, Number(k.value) || 0); else if (k.type === 'ship') freeByCoupon = true; }
    const shipping = sub - discount >= s.freeShip || freeByCoupon || !items.length ? 0 : s.shipFee;
    const cod = pay === 'kapida' ? s.codFee : 0;
    return { sub, discount, shipping, cod, total: Math.max(0, sub - discount + shipping + cod), coupon: k && !msg ? k : null, msg, toFree: Math.max(0, s.freeShip - (sub - discount)) };
  },
};
