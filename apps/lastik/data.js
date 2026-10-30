/* Lastikçi & Oto Yedek Parça — ebat ve DOT hesapları, lastik oteli, örnek veri. Panel ve müşteri sorgu sayfası kullanır. */
window.LST = {
  KIND: { lastik: ['Lastik', 'info'], parca: ['Yedek parça', 'acc'], jant: ['Jant', 'warn'], yag: ['Yağ ve sarf', ''] },
  SEASON: { yaz: 'Yaz', kis: 'Kış', dort: '4 mevsim' },
  POS: ['Ön sol', 'Ön sağ', 'Arka sol', 'Arka sağ'],
  JST: { acik: ['Açık', 'warn'], hazir: ['Hazır', 'info'], teslim: ['Teslim edildi', 'ok'], iptal: ['İptal', ''] },
  LABORS: [['Lastik sökme takma', 'adet', 150], ['Balans', 'adet', 120], ['Rot ayarı', 'araç', 900], ['Sibop değişimi', 'adet', 40], ['Tamir (fitil)', 'adet', 200]],
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  // "205/55 R16", "205 55 16" ve "2055516" aynı ebattır
  sizeKey: (s) => String(s || '').replace(/\D/g, ''),
  // DOT son dört hane: HHYY. Hatalıysa null döner
  dotDate(dot) { const m = /^(\d{2})(\d{2})$/.exec(String(dot || '').trim()); if (!m) return null; const w = Number(m[1]), y = 2000 + Number(m[2]); return w >= 1 && w <= 53 ? { week: w, year: y } : null; },
  dotAge(dot, now) { const d = LST.dotDate(dot); if (!d) return null; const t = new Date(now || Date.now()); const first = new Date(Date.UTC(d.year, 0, 1 + (d.week - 1) * 7)); return Math.max(0, (t - first) / (365.25 * 864e5)); },
  // Eşikler işletmenin tercihidir, mevzuat sınırı değildir
  dotState(dot, warn, bad, now) { const a = LST.dotAge(dot, now); if (a == null) return 'yok'; return a >= (Number(bad) || 5) ? 'eski' : a >= (Number(warn) || 3) ? 'orta' : 'yeni'; },
  lineNet: (i) => LST.r2((Number(i.qty) || 0) * (Number(i.price) || 0) * (1 - (Number(i.disc) || 0) / 100)),
  // KDV satır bazında: e-Arşiv ile aynı sonuç
  totals(j) { const r2 = LST.r2; const net = r2((j.items || []).reduce((s, i) => s + LST.lineNet(i), 0)); const kdv = r2((j.items || []).reduce((s, i) => s + r2(LST.lineNet(i) * (Number(i.vat != null ? i.vat : 20)) / 100), 0)); return { net, kdv, total: r2(net + kdv) }; },
  // Saklama ücreti tek kez alınır: ödenmişse yeniden istenmez
  feeDue: (h) => (h.feePaid ? 0 : Number(h.fee) || 0),
  plateKey: (p) => String(p || '').toLocaleUpperCase('tr').replace(/\s+/g, ''),
  // Çıkış doğrulaması: etiket numarası ve plaka birlikte eşleşmeli
  verify: (h, label, plate, vehPlate) => String(label || '').trim().toUpperCase() === String(h.no).toUpperCase() && LST.plateKey(plate) === LST.plateKey(vehPlate),
  stockHits(stock, q) { const k = LST.sizeKey(q); const t = String(q || '').toLocaleLowerCase('tr').trim(); return (stock || []).filter((x) => { if (!t) return true; if (x.kind === 'lastik' && k.length >= 5 && LST.sizeKey(x.size).startsWith(k)) return true; return [x.code, x.name, x.brand, x.oem, x.alt, x.fits, x.size].some((v) => String(v || '').toLocaleLowerCase('tr').includes(t)); }); },
  oldBalance: (L) => (L || []).reduce((s, x) => s + (x.dir === 'cikis' ? -1 : 1) * (Number(x.qty) || 0), 0),
  oldestDays(L, today) { const inn = (L || []).filter((x) => x.dir !== 'cikis').sort((a, b) => String(a.date).localeCompare(String(b.date))); const lastOut = (L || []).filter((x) => x.dir === 'cikis').map((x) => x.date).sort().pop() || ''; const f = inn.find((x) => x.date > lastOut); if (!f) return 0; return Math.round((new Date(today + 'T12:00:00Z') - new Date(f.date + 'T12:00:00Z')) / 864e5); },
  newKey: () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''),
  seed(db) {
    const { rand, pick, addDays } = NS; const iso = NS.iso; const yy = new Date().getFullYear() % 100; const dot = (y) => String(rand(1, 50)).padStart(2, '0') + String(yy - y).padStart(2, '0');
    db.data._settings = { bizName: 'Yıldız Lastik & Yedek Parça', bizPhone: '0232 555 11 44', bizAddress: 'Bornova Sanayi Sitesi, İzmir', dotWarn: 3, dotBad: 5, hotelFee: 1500, retorqueKm: 100, oldDays: 60 };
    db.data.users = [{ id: 'u1', name: 'Bülent Yıldız', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Canan Satış', role: 'danisman', pin: '1234', active: true }, { id: 'u3', name: 'Tolga Usta', role: 'usta', pin: '1234', active: true }];
    const TB = ['Lassa', 'Petlas', 'Michelin', 'Bridgestone', 'Goodyear']; const SZ = ['195/65 R15', '205/55 R16', '225/45 R17', '185/60 R15', '215/55 R17'];
    const stock = []; let n = 100;
    SZ.forEach((size) => ['yaz', 'kis'].forEach((season) => { const br = pick(TB); [0, 1, 4].forEach((age, i) => { if (i === 2 && Math.random() < 0.5) return; const cost = rand(16, 42) * 100; stock.push({ id: NS.uid(), kind: 'lastik', code: 'L' + (n++), name: `${br} ${season === 'kis' ? 'Snow' : 'Sport'}`, brand: br, size, season, dot: dot(age), loadSpeed: '91V', cost, price: Math.round(cost * 1.35), stock: rand(0, 12), min: 2, rack: `A-${rand(1, 9)}` }); }); }));
    [['Fren balatası ön Clio 4', 'TRW', 'GDB1234', '7701208179', 'BOSCH 0986494', 'Renault Clio 4, Symbol', 650, 1100], ['Yağ filtresi Egea 1.3', 'Mann', 'W7032', '55256470', 'BOSCH F026407', 'Fiat Egea, Doblo', 120, 240], ['Hava filtresi Corolla', 'Mann', 'C26003', '1780137021', '', 'Toyota Corolla 2019+', 180, 340], ['Akü 60 Ah', 'Mutlu', 'AK60', '', 'Inci 60', 'Genel', 2100, 3300], ['Silecek takımı 60/40', 'Bosch', 'A863S', '', '', 'Genel', 300, 560], ['Motor yağı 5W-30 (4 lt)', 'Castrol', 'YG530', '', 'Shell 5W-30', 'Genel', 980, 1450]].forEach(([name, brand, code, oem, alt, fits, cost, price]) => stock.push({ id: NS.uid(), kind: /yağı|Silecek/.test(name) ? 'yag' : 'parca', code, name, brand, oem, alt, fits, cost, price, stock: rand(0, 18), min: 2, rack: `P-${rand(1, 6)}` }));
    db.data.stock = stock;
    db.data.customers = NS.NAMES.slice(0, 24).map((n2, i) => ({ id: 'c' + i, name: i % 8 === 3 ? `${n2.split(' ')[1]} Taşımacılık` : n2, phone: NS.phone(), fleet: i % 8 === 3, limit: i % 8 === 3 ? 60000 : 0 }));
    const BR = [['Renault', 'Clio'], ['Fiat', 'Egea'], ['Toyota', 'Corolla'], ['Volkswagen', 'Passat'], ['Hyundai', 'i20'], ['Ford', 'Focus']]; const C = ['35', '35', '35', '09', '45'];
    db.data.vehicles = db.data.customers.map((c, i) => { const [b, m] = pick(BR); return { id: 'v' + i, plate: `${pick(C)} ${String.fromCharCode(65 + i % 26)}${String.fromCharCode(66 + (i * 3) % 24)} ${rand(100, 9999)}`, brand: b, model: m, year: rand(2012, 2024), km: rand(30, 190) * 1000, size: pick(SZ), customer: c.id }; });
    db.data.racks = Array.from({ length: 24 }, (_, i) => ({ id: 'r' + i, code: `${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`, cap: 2 }));
    const hotels = []; db.data.vehicles.slice(0, 14).forEach((v, i) => { const inAt = addDays(new Date(), -rand(20, 170)); const out = i % 6 === 5; const br = pick(TB); hotels.push({ id: NS.uid(), key: LST.newKey(), no: 'LO' + (1001 + i), customer: v.customer, vehicle: v.id, season: 'kis', rack: `${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`, inAt: inAt.toISOString(), tires: LST.POS.map((pos) => ({ pos, size: v.size, brand: br, dot: dot(rand(1, 3)), tread: rand(4, 7) })), rims: i % 3 === 0, fee: 1500, feePaid: i % 2 === 0, status: out ? 'teslim' : 'depoda', ...(out ? { outAt: addDays(inAt, 30).toISOString() } : {}), note: '' }); });
    db.data.hotels = hotels;
    const jobs = []; let no = 7000; for (let d = 60; d >= 0; d--) for (let k = 0; k < rand(0, 3); k++) { const v = pick(db.data.vehicles); const at = addDays(new Date(), -d); at.setHours(rand(8, 17)); if (at > new Date()) continue; const tt = stock.filter((s) => s.kind === 'lastik' && s.size === v.size); const t = pick(tt.length ? tt : stock); const q = pick([2, 4]); const items = [{ id: NS.uid(), sid: t.id, type: 'stok', name: `${t.name} ${t.size || ''}`.trim(), dot: t.dot, qty: q, price: t.price, cost: t.cost }, { id: NS.uid(), type: 'iscilik', name: 'Lastik sökme takma', qty: q, price: 150 }, { id: NS.uid(), type: 'iscilik', name: 'Balans', qty: q, price: 120 }]; const st = d > 0 ? 'teslim' : pick(['acik', 'hazir']); const j = { id: NS.uid(), no: 'IS' + no++, at: at.toISOString(), customer: v.customer, vehicle: v.id, km: v.km, items, status: st, oldQty: Math.random() < 0.5 ? q : 0, measures: { rot: Math.random() < 0.4 ? 'Ön toe −0,2 → 0,0' : '', torque: 110, pressure: 32, tread: '' }, worker: 'Tolga Usta' }; const tot = LST.totals(j).total; if (st === 'teslim') { j.paid = Math.random() < 0.85 ? tot : 0; j.doneAt = at.toISOString(); j.stockDone = true; } else j.paid = 0; jobs.push(j); }
    db.data.jobs = jobs;
    db.data.payments = jobs.filter((j) => j.paid).map((j) => ({ id: NS.uid(), customer: j.customer, job: j.id, amount: j.paid, method: pick(['Nakit', 'Kredi kartı', 'Havale']), at: j.doneAt }));
    db.data.oldTires = jobs.filter((j) => j.oldQty).slice(-12).map((j) => ({ id: NS.uid(), date: iso(new Date(j.at)), qty: j.oldQty, dir: 'giris', job: j.id })); db.data.claims = []; db.data.sms = [];
  },
};
