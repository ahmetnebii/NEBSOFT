/* Mobilya & Özel İmalat — iş durumları, hesaplar ve örnek veri. Panel ve müşteri takip sayfası kullanır. */
window.MOB = {
  ST: { talep: ['Talep', 'info', 'phone'], olcu: ['Ölçü', 'warn', 'edit'], teklif: ['Teklif', 'warn', 'file'], onay: ['Kapora bekliyor', 'acc', 'wallet'], uretim: ['Üretimde', 'acc', 'factory'], montaj: ['Montajda', 'info', 'wrench'], teslim: ['Teslim edildi', 'ok', 'check'], iptal: ['İptal', '', 'x'] },
  FLOW: ['talep', 'olcu', 'teklif', 'onay', 'uretim', 'montaj', 'teslim'],
  STAGES: [['kesim', 'Kesim'], ['bant', 'Kenar bantlama'], ['delik', 'Delik ve CNC'], ['yuzey', 'Boya ve yüzey'], ['kontrol', 'Ön montaj ve kontrol'], ['paket', 'Paketleme']],
  KT: { malzeme: ['Malzeme', 'info'], aksesuar: ['Aksesuar', 'acc'], iscilik: ['İşçilik', 'warn'], hizmet: ['Nakliye ve montaj', ''] },
  PAY: { kapora: 'Kapora', ara: 'Ara ödeme', son: 'Son ödeme', iade: 'İade' },
  CLAIM: { onarim: 'Ücretsiz onarım', degisim: 'Ayıpsız misliyle değişim', indirim: 'Ayıp oranında indirim', donme: 'Sözleşmeden dönme', belirsiz: 'Henüz seçilmedi' },
  // Mesafeli Sözleşmeler Yönetmeliği m.15/1-b: kişiye özel hazırlanan malda, aksi kararlaştırılmadıkça cayma kullanılamaz
  DISTANCE_NOTE: 'Bu ürün müşterinin ölçü ve isteğine göre özel hazırlanır. Taraflarca aksi kararlaştırılmadıkça mesafeli satışta cayma hakkı kullanılamaz.',
  closed: (j) => j.status === 'teslim' || j.status === 'iptal',
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  lineNet: (i) => MOB.r2((Number(i.qty) || 0) * (Number(i.price) || 0)),
  // İndirim ve KDV genel toplamda hesaplanır; oran işletmenin ayarından gelir
  totals(j, vat) {
    const r2 = MOB.r2; const rate = Number(j.vat != null ? j.vat : vat != null ? vat : 20) || 0;
    const brut = r2((j.items || []).reduce((s, i) => s + MOB.lineNet(i), 0)); const disc = Math.min(brut, Math.max(0, Number(j.disc) || 0)); const net = r2(brut - disc);
    const kdv = r2(net * rate / 100); return { brut, disc, net, rate, kdv, total: r2(net + kdv) };
  },
  costOf: (j) => MOB.r2((j.items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.cost) || 0), 0)),
  // Kapora + ara ödeme − iade: iade kaydı eksi sayılır
  paidOf: (j, pays) => MOB.r2((pays || []).filter((p) => p.job === j.id).reduce((s, p) => s + (p.kind === 'iade' ? -1 : 1) * (Number(p.amount) || 0), 0)),
  stageDone: (j) => MOB.STAGES.filter(([k]) => j.stages && j.stages[k]).length,
  curStage: (j) => { const s = MOB.STAGES.find(([k]) => !(j.stages && j.stages[k])); return s ? s[0] : null; },
  openPunch: (j) => (j.punch || []).filter((p) => !p.done),
  late: (j, today) => !MOB.closed(j) && !!j.deadline && j.deadline < today,
  // Teklif kilidi: onaydan sonra kalem değişmez; değişiklik yeni sürüm teklif olarak yeniden onaya gider
  locked: (j) => ['onay', 'uretim', 'montaj', 'teslim', 'iptal'].includes(j.status),
  snapshot: (j, vat) => ({ v: j.quoteV || 1, at: new Date().toISOString(), total: MOB.totals(j, vat).total, items: (j.items || []).map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, price: i.price, type: i.type })), disc: j.disc || 0 }),
  // Onaylanan sürümün kopyası: linkten onayda da kayıp olmaz, aynı sürüm iki kez yazılmaz
  keepQuote(j, vat) { const v = j.quoteV || 1; j.quotes = j.quotes || []; if (!j.quotes.some((q) => q.v === v)) j.quotes.push(MOB.snapshot(j, vat)); },
  // Genel indirim e-Belgede satır iskontosuna dağıtılır: satırların KDV hariç toplamı işin KDV hariç tutarına eşit kalır
  invoiceLines(j, vat) {
    const t = MOB.totals(j, vat); const L = (j.items || []).filter((i) => MOB.lineNet(i) > 0); let left = t.disc;
    return (j.items || []).map((i) => { const b = MOB.lineNet(i); const k = L.indexOf(i); const cut = k < 0 ? 0 : k === L.length - 1 ? left : Math.min(left, MOB.r2(t.disc * b / (t.brut || 1))); left = MOB.r2(left - cut); return { name: i.name, qty: i.qty, unit: i.unit || 'adet', price: i.price, disc: b > 0 ? (cut / b) * 100 : 0, vat: t.rate }; });
  },
  // Stoktan düşecek miktarlar: yalnız malzeme kartına bağlı kalemler
  usage: (j) => { const m = {}; (j.items || []).forEach((i) => { if (i.mid) m[i.mid] = (m[i.mid] || 0) + (Number(i.qty) || 0); }); return m; },
  usageDiff: (j) => { const now = MOB.usage(j); const old = j.used || (j.materialsUsed ? now : {}); const d = {}; new Set([...Object.keys(now), ...Object.keys(old)]).forEach((k) => { const x = MOB.r2((now[k] || 0) - (old[k] || 0)); if (x) d[k] = x; }); return d; },
  // Hafta sonu dışında n iş günü sonrası (resmî tatiller düşülmez)
  workdays(from, n) { const d = new Date(from + 'T12:00:00Z'); let k = 0; while (k < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) k++; } return d.toISOString().slice(0, 10); },
  // Teslimden bildirime: ilk 6 ay ve 2 yıl (6502 m.10, m.12)
  claimFlags(j, at) { if (!j.deliveredAt) return { m6: false, y2: false }; const d = new Date(j.deliveredAt); const a = new Date(d); a.setMonth(a.getMonth() + 6); const b = new Date(d); b.setFullYear(b.getFullYear() + 2); const t = new Date(at + 'T23:59:59'); return { m6: t <= a, y2: t <= b }; },
  depositOk: (j, pays, minPct, vat) => { const t = MOB.totals(j, vat).total; return MOB.paidOf(j, pays) >= MOB.r2(t * (Number(minPct) || 0) / 100); },
  // Müşteri bağlantısı tahmin edilemesin: NS.uid zaman tabanlıdır, burada güvenli rastgele üretilir
  newKey: () => Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''),
  seed(db) {
    const { rand, pick, addDays } = NS; const iso = NS.iso;
    db.data._settings = { bizName: 'Çınar Mobilya Atölyesi', bizPhone: '0216 555 44 33', bizAddress: 'Masko Sanayi Sitesi 4. Blok No:12, İstanbul', vatRate: 20, minDeposit: 30, warrantyDays: 730, deadlineDays: 30 };
    db.data.users = [{ id: 'u1', name: 'Hakan Çınar', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Elif Ofis', role: 'ofis', pin: '1234', active: true }, { id: 'u3', name: 'Yusuf Usta', role: 'usta', pin: '1234', active: true }, { id: 'u4', name: 'Serkan Montaj', role: 'montaj', pin: '1234', active: true, team: 't1' }];
    db.data.teams = [{ id: 't1', name: 'Montaj Ekibi 1', phone: NS.phone(), lead: 'Serkan Aydın' }, { id: 't2', name: 'Montaj Ekibi 2', phone: NS.phone(), lead: 'Mehmet Koç' }];
    const M = [['MD-18', '18 mm MDF lam beyaz (plaka)', 'plaka', 1450, 12, 6], ['MD-08', '8 mm arkalık MDF (plaka)', 'plaka', 620, 9, 4], ['SN-18', '18 mm suntalam meşe (plaka)', 'plaka', 1180, 14, 5], ['TZ-40', 'Akrilik tezgâh (metre)', 'm', 3200, 18, 6], ['BN-22', 'PVC kenar bandı 22 mm (metre)', 'm', 9, 480, 200], ['MN-35', 'Frenli menteşe (adet)', 'adet', 85, 260, 80], ['RY-45', 'Teleskopik ray 45 cm (takım)', 'takım', 340, 22, 12], ['KL-16', 'Kulp alüminyum (adet)', 'adet', 110, 8, 30], ['AY-10', 'Ayarlı ayak (adet)', 'adet', 28, 120, 40], ['VD-35', 'Montaj vidası (kutu)', 'kutu', 190, 15, 5]];
    db.data.materials = M.map(([code, name, unit, cost, stock, min]) => ({ id: NS.uid(), code, name, unit, cost, stock, min }));
    db.data.catalog = [['Mutfak alt dolap (metre)', 'iscilik', 'm', 6500], ['Mutfak üst dolap (metre)', 'iscilik', 'm', 5200], ['Gardırop sürgülü kapak (m²)', 'iscilik', 'm²', 4800], ['TV ünitesi işçilik', 'iscilik', 'adet', 9000], ['Banyo dolabı işçilik', 'iscilik', 'adet', 7000], ['Nakliye', 'hizmet', 'sefer', 1800], ['Yerinde montaj', 'hizmet', 'gün', 3500], ['Eski dolap söküm', 'hizmet', 'adet', 1500]].map(([name, type, unit, price]) => ({ id: NS.uid(), name, type, unit, price, cost: Math.round(price * 0.45) }));
    const SRC = ['Tavsiye', 'Instagram', 'Google', 'Web sitesi', 'Mağaza'];
    const HOOD = ['Ataşehir', 'Kadıköy', 'Ümraniye', 'Maltepe', 'Üsküdar', 'Kartal'];
    db.data.customers = NS.NAMES.slice(0, 18).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), address: `${pick(HOOD)}, ${rand(1, 60)}. Sokak No:${rand(1, 40)}`, source: pick(SRC) }));
    const K = [['Mutfak dolabı', 'Mutfak', [['Alt dolap duvarı', 340, 86, 60], ['Üst dolap duvarı', 280, 72, 32], ['Boy dolap', 60, 220, 60]]], ['Sürgülü gardırop', 'Yatak odası', [['Gardırop nişi', 260, 245, 62]]], ['TV ünitesi', 'Salon', [['TV duvarı', 300, 240, 40]]], ['Banyo dolabı', 'Banyo', [['Lavabo altı', 90, 60, 48], ['Boy dolap', 40, 190, 35]]], ['Çocuk odası takımı', 'Çocuk odası', [['Yatak ve dolap duvarı', 320, 250, 60]]]];
    const items = (t) => { const ml = (c, q) => { const m = db.data.materials.find((x) => x.code === c); return { id: NS.uid(), type: c === 'MN-35' || c === 'RY-45' || c === 'KL-16' ? 'aksesuar' : 'malzeme', mid: m.id, name: m.name, qty: q, unit: m.unit, price: Math.round(m.cost * 1.5), cost: m.cost }; }; const c = db.data.catalog; return [ml('MD-18', rand(4, 9)), ml('MD-08', rand(2, 4)), ml('BN-22', rand(40, 90)), ml('MN-35', rand(12, 30)), ml('RY-45', rand(2, 6)), { id: NS.uid(), type: 'iscilik', name: `${t} işçilik`, qty: rand(3, 7), unit: 'm', price: 6500, cost: 2800 }, { id: NS.uid(), type: 'hizmet', name: 'Nakliye', qty: 1, unit: 'sefer', price: c[5].price, cost: 900 }, { id: NS.uid(), type: 'hizmet', name: 'Yerinde montaj', qty: rand(1, 2), unit: 'gün', price: c[6].price, cost: 1800 }]; };
    const plan = [...Array(16).fill('teslim'), 'iptal', 'montaj', 'montaj', 'uretim', 'uretim', 'uretim', 'onay', 'teklif', 'teklif', 'olcu', 'olcu', 'talep', 'talep', 'talep'];
    const jobs = [], pays = [];
    plan.forEach((st, i) => {
      const c = pick(db.data.customers); const [title, room, ms] = pick(K); const ago = st === 'teslim' ? rand(20, 170) : st === 'iptal' ? 40 : rand(1, 20); const at = addDays(new Date(), -ago);
      const j = { id: NS.uid(), key: MOB.newKey(), no: 'MB' + (2601 + i), customer: c.id, title, room, channel: i % 7 ? 'yuzyuze' : 'mesafeli', status: st, at: at.toISOString(), source: c.source, address: c.address, deadline: iso(addDays(at, 35)), stages: {}, punch: [], items: [], measures: [], disc: 0, quoteV: 1, quotes: [], history: [] };
      const ix = MOB.FLOW.indexOf(st === 'iptal' ? 'onay' : st);
      if (ix >= 1) { j.measureAt = iso(addDays(at, 2)); j.measurer = 'Hakan Çınar'; }
      if (ix >= 2) { j.measures = ms.map(([place, w, h, d]) => ({ id: NS.uid(), place, w, h, d, qty: 1, note: '' })); j.items = items(title); }
      if (ix >= 3) { j.approval = { name: c.name, at: addDays(at, 5).toISOString(), via: i % 2 ? 'link' : 'yüz yüze' }; j.quotes = [MOB.snapshot(j, 20)]; }
      const t = MOB.totals(j, 20).total;
      if (ix >= 4) pays.push({ id: NS.uid(), job: j.id, customer: c.id, amount: MOB.r2(t * 0.3), kind: 'kapora', method: pick(['Havale', 'Kredi kartı', 'Nakit']), at: addDays(at, 6).toISOString() });
      if (ix >= 4) { j.materialsUsed = true; j.used = MOB.usage(j); }
      if (st === 'uretim') MOB.STAGES.slice(0, rand(0, 4)).forEach(([k]) => { j.stages[k] = { at: new Date().toISOString(), by: 'Yusuf Usta' }; });
      if (ix >= 5) { MOB.STAGES.forEach(([k]) => { j.stages[k] = { at: addDays(at, 18).toISOString(), by: 'Yusuf Usta' }; }); j.team = pick(db.data.teams).id; j.installAt = iso(st === 'montaj' ? addDays(new Date(), rand(0, 5)) : addDays(at, 25)); }
      if (st === 'teslim') { j.deliveredAt = addDays(at, 26).toISOString(); j.warrantyUntil = iso(addDays(at, 756)); pays.push({ id: NS.uid(), job: j.id, customer: c.id, amount: MOB.r2(i % 5 === 0 ? t * 0.5 : t * 0.7), kind: 'son', method: 'Havale', at: j.deliveredAt }); if (i % 6 === 0) j.punch = [{ id: NS.uid(), text: 'Üst dolap kapak ayarı', done: false }]; }
      if (st === 'iptal') { j.cancel = 'Müşteri vazgeçti'; j.history.push({ at: addDays(at, 8).toISOString(), st: 'iptal', note: 'Müşteri vazgeçti' }); }
      MOB.FLOW.slice(0, ix + 1).forEach((s, n) => j.history.push({ at: addDays(at, n * 3 > ago ? ago : n * 3).toISOString(), st: s, note: MOB.ST[s][0] }));
      jobs.push(j);
    });
    db.data.claims = jobs.filter((j) => j.status === 'teslim').slice(0, 2).map((j, i) => { const at = iso(addDays(new Date(), -rand(2, 12))); return { id: NS.uid(), job: j.id, customer: j.customer, text: i ? 'Çekmece rayı sıkışıyor' : 'Kapak menteşesinde gevşeme', at, choice: 'onarim', status: 'acik', due: MOB.workdays(at, 30) }; });
    db.data.jobs = jobs; db.data.payments = pays; db.data.sms = [];
  },
};
