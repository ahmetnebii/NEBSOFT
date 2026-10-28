/* Butik & Giyim Mağazası — beden/renk matrisi, demo verisi */
window.BTK = {
  SIZES: { harf: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], numara: ['36', '37', '38', '39', '40', '41'], beden: ['34', '36', '38', '40', '42', '44'], tek: ['STD'] },
  SEASONS: ['2026 İlkbahar-Yaz', '2026 Sonbahar-Kış', 'Sezonsuz (basic)'],
  PAY: { nakit: 'Nakit', kart: 'Kredi kartı', havale: 'Havale/EFT', puan: 'Puan' },
  // Varyant barkodu: model kodu + beden + renk sırası
  vcode: (m, size, ci) => `${m.code}-${size}-${String(ci + 1).padStart(2, '0')}`,
  ean: (n) => { const b = String(n).padStart(12, '0').slice(0, 12); const s = b.split('').reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0); return b + ((10 - (s % 10)) % 10); },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Lina Butik', bizPhone: '0216 444 12 12', bizAddress: 'Bağdat Cad. No:214, Kadıköy/İstanbul', pointPct: 3, exchangeDays: 30, lowStock: 2, online: true };
    db.data.users = [{ id: 'u1', name: 'Lina Hanım', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Ece Satış', role: 'kasa', pin: '1234', active: true }];
    const M = [['Keten Gömlek Oversize', 'Gömlek', 'harf', 380, 1199, 0], ['Saten Midi Elbise', 'Elbise', 'beden', 520, 1899, 0], ['Yüksek Bel Mom Jean', 'Pantolon', 'beden', 410, 1299, 0], ['Örme Hırka Uzun', 'Triko', 'harf', 360, 1149, 1], ['Basic Tişört Pamuk', 'Tişört', 'harf', 95, 349, 2], ['Kaşe Kaban Kuşaklı', 'Dış giyim', 'beden', 1350, 3999, 1], ['Pileli Etek Midi', 'Etek', 'beden', 290, 949, 0], ['Deri Görünümlü Ceket', 'Dış giyim', 'harf', 690, 2299, 1], ['Triko Kazak Balıkçı', 'Triko', 'harf', 330, 1049, 1], ['Kadın Sneaker Beyaz', 'Ayakkabı', 'numara', 540, 1699, 2], ['Topuklu Sandalet', 'Ayakkabı', 'numara', 460, 1449, 0], ['Omuz Çantası Örgü', 'Aksesuar', 'tek', 240, 799, 2], ['İpek Eşarp Desenli', 'Aksesuar', 'tek', 150, 549, 2], ['Kumaş Pantolon Palazzo', 'Pantolon', 'beden', 330, 1099, 0], ['Crop Bluz Fırfırlı', 'Bluz', 'harf', 180, 649, 0], ['Kapüşonlu Sweatshirt', 'Sweatshirt', 'harf', 260, 899, 1]];
    const COL = [['Siyah', '#111827'], ['Ekru', '#f1ead9'], ['Bej', '#d6c3a5'], ['Haki', '#6b705c'], ['Lacivert', '#1e3a5f'], ['Bordo', '#7f1d1d'], ['Pudra', '#e8b4b8'], ['Mavi', '#5b8bd0']];
    let seq = 100;
    db.data.models = M.map(([name, cat, st, cost, price, season], i) => {
      const cols = COL.slice(i % 5, (i % 5) + (st === 'tek' ? 2 : rand(2, 3)));
      const m = { id: NS.uid(), code: 'LB' + (2600 + i), name, cat, sizeType: st, season: BTK.SEASONS[season], cost, price, disc: i % 6 === 3 ? 30 : 0, online: i % 4 !== 2, colors: cols.map(([n, hex]) => ({ name: n, hex })), variants: [] };
      cols.forEach((c, ci) => BTK.SIZES[st].forEach((sz, si) => { const mid = Math.abs(si - 2.5); m.variants.push({ size: sz, color: c[0], barcode: BTK.ean('86955' + String(seq++).padStart(7, '0')), stock: Math.max(0, Math.round(rand(0, 7) - mid * 1.4 + (st === 'tek' ? 6 : 0))) }); }));
      return m;
    });
    db.data.customers = NS.NAMES.filter((n, i) => i % 2 === 1 || i < 6).slice(0, 18).map((name, i) => ({ id: 'c' + i, name, phone: NS.phone(), birthday: `19${rand(70, 99)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`, points: 0, size: pick(['S', 'M', 'L', '38', '40']), kvkk: i % 3 !== 0, note: i === 2 ? 'Yeni sezon gelince haber verilsin' : '' }));
    const sales = []; let no = 5000;
    for (let d = 60; d >= 0; d--) for (let k = 0; k < rand(4, 11) + ([5, 6].includes(addDays(new Date(), -d).getDay()) ? 6 : 0); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(10, 21), rand(0, 59)); if (at > new Date()) continue;
      const lines = []; for (let x = 0; x < (Math.random() < 0.65 ? 1 : rand(2, 3)); x++) { const m = pick(db.data.models); const v = pick(m.variants); const price = Math.round(m.price * (1 - (m.disc || 0) / 100)); lines.push({ mid: m.id, barcode: v.barcode, name: m.name, size: v.size, color: v.color, qty: 1, price, cost: m.cost }); }
      const cust = Math.random() < 0.55 ? pick(db.data.customers) : null; const total = NS.sum(lines, (l) => l.price * l.qty);
      const disc = total > 2500 && Math.random() < 0.3 ? Math.round(total * 0.05) : 0;
      const s = { id: NS.uid(), no: 'F' + no++, at: at.toISOString(), customer: cust ? cust.id : null, lines, sub: total, disc, total: total - disc, pay: Math.random() < 0.72 ? 'kart' : 'nakit', user: pick(['Lina Hanım', 'Ece Satış']), channel: Math.random() < 0.12 ? 'online' : 'magaza' };
      if (cust) cust.points += Math.round((s.total * 3) / 100);
      sales.push(s);
    }
    db.data.sales = sales;
    db.data.returns = sales.filter((s, i) => i % 29 === 7 && s.at > addDays(new Date(), -25).toISOString()).map((s) => ({ id: NS.uid(), saleNo: s.no, at: addDays(new Date(s.at), rand(1, 6)).toISOString(), type: pick(['degisim', 'degisim', 'iade']), line: s.lines[0], newLine: null, reason: pick(['Beden uymadı', 'Renk beğenilmedi', 'Vazgeçti']), refund: 0 }));
    db.data.returns.forEach((r) => { if (r.type === 'iade') r.refund = r.line.price; else { const m = db.data.models.find((x) => x.id === r.line.mid); const v = m.variants.find((x) => x.color === r.line.color && x.size !== r.line.size) || m.variants[0]; r.newLine = { ...r.line, size: v.size, barcode: v.barcode }; } });
    db.data.campaigns = [{ id: NS.uid(), name: 'Sezon sonu %30', type: 'yuzde', value: 30, scope: 'sezon', target: BTK.SEASONS[1], active: true }, { id: NS.uid(), name: '2. üründe %50', type: 'ikinci', value: 50, scope: 'kategori', target: 'Tişört', active: true }];
  },
};
