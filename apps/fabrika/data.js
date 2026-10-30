/* NEBSOFT Fabrika ERP — sabitler ve demo verisi (bisküvi / gıda üretim tesisi) */
window.FAB = (function () {
  'use strict';
  const { iso, addDays, rand, pick, uid } = NS;
  const r3 = (n) => Math.round(n * 1000) / 1000;

  const TYPES = { hammadde: ['Hammadde', 'info'], ambalaj: ['Ambalaj', 'acc'], yarimamul: ['Yarı mamul', 'warn'], mamul: ['Mamul', 'ok'], sarf: ['Sarf / yedek parça', ''] };
  const WHT = { hammadde: 'Hammadde', karantina: 'Karantina (kalite bekliyor)', uretim: 'Üretim / ara stok', mamul: 'Mamul', red: 'Red / iade alanı', fason: 'Fasoncuda' };
  const MOVE = { acilis: ['Açılış', ''], kabul: ['Mal kabul', 'info'], 'kk-kabul': ['Kalite onayı', 'ok'], 'kk-red': ['Kalite red', 'err'], tuketim: ['Üretime çıkış', 'warn'], uretim: ['Üretimden giriş', 'ok'], fire: ['Fire / sarf', 'err'], transfer: ['Transfer', 'acc'], sayim: ['Sayım farkı', ''], sevk: ['Sevkiyat', 'warn'], iade: ['Tedarikçiye iade', 'err'], musteri_iade: ['Müşteri iadesi', 'info'], fason: ['Fason sevk / iade', 'acc'] };
  const USABLE = ['hammadde', 'uretim', 'mamul'];

  function seed(db) {
    const d = db.data;
    const D = (n) => iso(addDays(new Date(), n));
    d._settings = { bizName: 'Ege Bisküvi ve Gıda San. A.Ş.', bizPhone: '0232 555 40 40', bizAddress: 'Atatürk OSB 10003 Sk. No:8 Çiğli/İzmir', taxNo: '3870012345', taxOffice: 'Çiğli', lotPrefix: 'L', allowNegative: false, qcDefault: true, sktWarn: 30, shiftHours: 8, shifts: 2, poNote: 'Teslimatta irsaliye, analiz sertifikası (CoA) ve lot bilgisi zorunludur.' };
    d.users = [
      { id: 'u1', name: 'Kemal Arslan', role: 'admin', pin: '1234', active: true },
      { id: 'u2', name: 'Hüseyin Toprak', role: 'depo', pin: '1234', active: true },
      { id: 'u3', name: 'Zeynep Kalkan', role: 'kalite', pin: '1234', active: true },
      { id: 'u4', name: 'Okan Yıldırım', role: 'uretim', pin: '1234', active: true },
      { id: 'u5', name: 'Derya Aksoy', role: 'satinalma', pin: '1234', active: true },
      { id: 'u6', name: 'Ali Korkmaz', role: 'operator', pin: '1234', active: true },
    ];
    d.warehouses = [
      { id: 'w1', name: 'Hammadde Deposu', type: 'hammadde', locs: ['A-01', 'A-02', 'A-03', 'A-04', 'B-01', 'B-02', 'SİLO-1', 'SİLO-2', 'SOĞUK-1'] },
      { id: 'w6', name: 'Ambalaj Deposu', type: 'hammadde', locs: ['C-01', 'C-02', 'C-03'] },
      { id: 'w2', name: 'Karantina Alanı', type: 'karantina', locs: ['K-01', 'K-02'] },
      { id: 'w3', name: 'Üretim Hattı (ara stok)', type: 'uretim', locs: ['HAT-1', 'HAT-2', 'KREMA'] },
      { id: 'w4', name: 'Mamul Deposu', type: 'mamul', locs: ['M-01', 'M-02', 'M-03', 'M-04', 'SEVK'] },
      { id: 'w5', name: 'Red / İade Alanı', type: 'red', locs: ['R-01'] },
    ];
    d.suppliers = [
      ['Ege Un Değirmeni A.Ş.', 'Mehmet Uçar', 'Manisa', 3, 'ISO 22000, Helal'], ['Anadolu Şeker Pazarlama', 'Ayten Kılıç', 'Konya', 5, 'FSSC 22000'], ['Marmara Yağ Sanayi', 'Serkan Öz', 'Kocaeli', 4, 'BRC, Helal'],
      ['Kakao Dünyası İthalat Ltd.', 'Burak Ateş', 'İstanbul', 12, 'Rainforest, Helal'], ['Trakya Süt Ürünleri', 'Gülşen Er', 'Tekirdağ', 6, 'ISO 22000'], ['Karadeniz Fındık Koop.', 'Hasan Çelik', 'Ordu', 7, 'Aflatoksin raporlu'],
      ['Akın Ambalaj Film San.', 'Selin Akın', 'İzmir', 10, 'ISO 9001'], ['Kuzey Oluklu Karton', 'Erdem Kuzey', 'Bursa', 6, 'FSC'], ['Renk Etiket Matbaa', 'Tuba Renk', 'İzmir', 4, 'ISO 9001'], ['Gıda Katkı Kimya Ltd.', 'Can Demir', 'İstanbul', 5, 'Helal, Koşer'],
    ].map(([name, contact, city, lead, cert], i) => ({ id: 's' + i, name, contact, city, lead, cert, phone: NS.phone(), email: 'satis@' + NS.slug(name).split('-')[0] + '.com.tr', approved: i !== 9, term: pick([30, 45, 60]), taxNo: String(rand(1000000000, 9999999999)), rating: pick([4, 4, 5, 5, 3]) }));
    d.customers = ['Yıldız Market Zinciri', 'Anadolu Toptan Gıda', 'Ege Gıda Dağıtım', 'Karadeniz Bakkallar Koop.', 'Baltic Foods OÜ (İhracat)', 'Akdeniz Otel Tedarik'].map((name, i) => ({ id: 'm' + i, name, taxNo: ['4310298761', '7720018342', '1150347786', '6014532297', '', '9182736455'][i], taxOffice: ['Mecidiyeköy', 'Ulus', 'Konak', 'Trabzon', '', 'Muratpaşa'][i], phone: NS.phone(), email: 'siparis@' + NS.slug(name).split('-')[0] + '.com', city: ['İstanbul', 'Ankara', 'İzmir', 'Trabzon', 'Tallinn', 'Antalya'][i], address: '', term: pick([30, 45, 60]) }));

    const QCP = { un: 'Nem (%);0;14.5\nKül (%);0;0.55\nGluten (%);26;\nGörsel / koku kontrolü', seker: 'Nem (%);0;0.06\nRenk (ICUMSA);0;45\nGörsel kontrol', yag: 'Erime noktası (°C);34;38\nPeroksit (meq/kg);0;2\nSerbest yağ asidi (%);0;0.1', kakao: 'Nem (%);0;5\nYağ (%);10;12\npH;6.8;7.5\nGörsel / koku kontrolü', sut: 'Nem (%);0;4\nProtein (%);33;\nAsitlik (°SH);0;18', findik: 'Nem (%);0;6\nAflatoksin B1 (ppb);0;5\nToplam aflatoksin (ppb);0;10\nKırık oranı (%);0;3', ambalaj: 'Ölçü kontrolü (mm)\nBaskı / renk uygunluğu\nGramaj (g/m²);;', genel: 'Görsel kontrol\nAmbalaj bütünlüğü' };
    // [kod, ad, tür, birim, grup, min, maliyet, raf ömrü gün, kalite, tedarikçi, lokasyon, açılış, kalite param]
    const M = [
      ['HM-001', 'Buğday unu (Tip 550)', 'hammadde', 'kg', 'Un', 3000, 14.8, 180, true, 's0', 'SİLO-1', 6000, QCP.un],
      ['HM-002', 'Toz şeker', 'hammadde', 'kg', 'Şeker', 1200, 31.5, 720, true, 's1', 'SİLO-2', 2500, QCP.seker],
      ['HM-003', 'Bitkisel margarin', 'hammadde', 'kg', 'Yağ', 800, 72, 270, true, 's2', 'SOĞUK-1', 2000, QCP.yag],
      ['HM-004', 'Kakao tozu (%10-12)', 'hammadde', 'kg', 'Kakao', 250, 410, 540, true, 's3', 'A-02', 550, QCP.kakao],
      ['HM-005', 'Yağsız süt tozu', 'hammadde', 'kg', 'Süt', 300, 155, 365, true, 's4', 'A-03', 700, QCP.sut],
      ['HM-006', 'Yumurta tozu', 'hammadde', 'kg', 'Süt', 150, 290, 365, true, 's4', 'A-03', 350, QCP.sut],
      ['HM-007', 'Kabartma tozu', 'hammadde', 'kg', 'Katkı', 80, 85, 540, false, 's9', 'A-04', 250, QCP.genel],
      ['HM-008', 'Tuz (rafine)', 'hammadde', 'kg', 'Katkı', 50, 9, 1095, false, 's9', 'A-04', 160, QCP.genel],
      ['HM-009', 'Vanilin', 'hammadde', 'kg', 'Aroma', 8, 1450, 730, false, 's9', 'A-04', 30, QCP.genel],
      ['HM-010', 'İç fındık (kavrulmuş, kırık)', 'hammadde', 'kg', 'Kuruyemiş', 300, 520, 270, true, 's5', 'SOĞUK-1', 700, QCP.findik],
      ['HM-011', 'Glikoz şurubu', 'hammadde', 'kg', 'Şeker', 150, 38, 365, false, 's1', 'B-01', 450, QCP.genel],
      ['HM-012', 'Bitter çikolata damla', 'hammadde', 'kg', 'Kakao', 250, 380, 365, true, 's3', 'SOĞUK-1', 650, QCP.kakao],
      ['AM-001', 'Flow-pack film (baskılı, 120 mm)', 'ambalaj', 'm', 'Film', 8000, 1.35, 0, true, 's6', 'C-01', 26000, QCP.ambalaj],
      ['AM-002', 'Oluklu koli (24\'lü)', 'ambalaj', 'adet', 'Koli', 1500, 11.2, 0, false, 's7', 'C-02', 5500, QCP.genel],
      ['AM-003', 'Koli etiketi (rulo 1000)', 'ambalaj', 'adet', 'Etiket', 1500, 0.42, 0, false, 's8', 'C-03', 7000, QCP.genel],
      ['AM-004', 'Streç film', 'ambalaj', 'kg', 'Film', 60, 95, 0, false, 's6', 'C-03', 220, QCP.genel],
      ['AM-005', 'Ahşap palet (euro)', 'ambalaj', 'adet', 'Palet', 40, 260, 0, false, 's7', 'C-02', 140, QCP.genel],
      ['YM-001', 'Bisküvi hamuru (sade)', 'yarimamul', 'kg', 'Hamur', 0, 0, 2, false, '', 'HAT-1', 0, ''],
      ['YM-002', 'Kakaolu krema', 'yarimamul', 'kg', 'Krema', 150, 0, 30, false, '', 'KREMA', 260, ''],
      ['MM-001', 'Sade Bisküvi 100 g × 24', 'mamul', 'koli', 'Bisküvi', 300, 0, 365, false, '', 'M-01', 650, ''],
      ['MM-002', 'Kakaolu Kremalı Bisküvi 120 g × 24', 'mamul', 'koli', 'Kremalı', 400, 0, 300, false, '', 'M-02', 820, ''],
      ['MM-003', 'Fındıklı Kurabiye 200 g × 12', 'mamul', 'koli', 'Kurabiye', 200, 0, 240, false, '', 'M-03', 380, ''],
      ['SR-001', 'Fırın bandı yağı', 'sarf', 'lt', 'Bakım', 20, 240, 0, false, 's9', 'B-02', 60, ''],
      ['SR-002', 'Flow-pack çene rezistansı', 'sarf', 'adet', 'Yedek parça', 4, 1850, 0, false, 's6', 'B-02', 8, ''],
    ];
    d.materials = M.map(([code, name, type, unit, group, min, cost, shelf, qc, supplier, loc, open, qcp], i) => ({ id: 'mt' + (i + 1), code, name, type, unit, group, min, max: min * 4, cost, shelf, qc, supplier, loc, qcp, lead: supplier ? (d.suppliers.find((s) => s.id === supplier) || {}).lead || 5 : 1, moq: type === 'ambalaj' ? (unit === 'm' ? 5000 : 500) : unit === 'kg' ? 100 : 1, barcode: '869' + String(4400000000 + i * 7919).slice(0, 10), _open: open, price: { 'MM-001': 540, 'MM-002': 790, 'MM-003': 690 }[code] || 0 }));
    const mid = (code) => d.materials.find((m) => m.code === code).id;
    d.stations = [
      ['YG-01', 'Spiral yoğurucu', 'Hamur', 1500, 450], ['RK-01', 'Rotary kalıplama', 'Şekillendirme', 1100, 600], ['TF-01', 'Tünel fırın (60 m)', 'Pişirme', 1000, 1800], ['KR-01', 'Krema hazırlama kazanı', 'Krema', 600, 380],
      ['KS-01', 'Kremalı sandviç hattı', 'Kremalama', 260, 700], ['FP-01', 'Flow-pack paketleme 1', 'Paketleme', 180, 520], ['FP-02', 'Flow-pack paketleme 2', 'Paketleme', 160, 520], ['KL-01', 'Koli & paletleme robotu', 'Kolileme', 320, 400],
    ].map(([code, name, kind, cap, cph], i) => ({ id: 'st' + i, code, name, kind, cap, cph, status: i === 6 ? 'ariza' : 'calisiyor' }));
    // cap: saatte işlenen birim (kg ya da koli), cph: saatlik maliyet ₺
    const sid = (code) => d.stations.find((s) => s.code === code).id;
    d.boms = [
      { id: 'b1', mat: mid('YM-001'), version: 'v3', base: 100, active: true, note: 'Su ilavesi tarif dışıdır (hamur %8 su).', lines: [['HM-001', 58], ['HM-002', 18], ['HM-003', 15], ['HM-005', 3], ['HM-006', 2], ['HM-007', 0.8], ['HM-008', 0.4], ['HM-009', 0.05]].map(([c, q]) => ({ mat: mid(c), qty: q, scrap: 1 })), ops: [{ name: 'Yoğurma', station: sid('YG-01'), setup: 10, run: 6 }] },
      { id: 'b2', mat: mid('YM-002'), version: 'v2', base: 100, active: true, note: '', lines: [['HM-002', 45], ['HM-003', 30], ['HM-004', 15], ['HM-005', 8], ['HM-011', 2]].map(([c, q]) => ({ mat: mid(c), qty: q, scrap: 0.5 })), ops: [{ name: 'Krema pişirme', station: sid('KR-01'), setup: 15, run: 12 }] },
      { id: 'b3', mat: mid('MM-001'), version: 'v1', base: 1, active: true, note: '', lines: [['YM-001', 2.6, 2], ['AM-001', 4.1, 3], ['AM-002', 1, 0], ['AM-003', 1, 0]].map(([c, q, s]) => ({ mat: mid(c), qty: q, scrap: s })), ops: [{ name: 'Kalıplama', station: sid('RK-01'), setup: 20, run: 0.09 }, { name: 'Pişirme', station: sid('TF-01'), setup: 30, run: 0.1 }, { name: 'Paketleme', station: sid('FP-01'), setup: 10, run: 0.33 }, { name: 'Kolileme', station: sid('KL-01'), setup: 5, run: 0.19 }] },
      { id: 'b4', mat: mid('MM-002'), version: 'v2', base: 1, active: true, note: 'Krema oranı %31 — müşteri spesifikasyonu.', lines: [['YM-001', 2.0, 2], ['YM-002', 0.9, 1], ['AM-001', 4.3, 3], ['AM-002', 1, 0], ['AM-003', 1, 0]].map(([c, q, s]) => ({ mat: mid(c), qty: q, scrap: s })), ops: [{ name: 'Kalıplama', station: sid('RK-01'), setup: 20, run: 0.08 }, { name: 'Pişirme', station: sid('TF-01'), setup: 30, run: 0.09 }, { name: 'Kremalama', station: sid('KS-01'), setup: 25, run: 0.23 }, { name: 'Paketleme', station: sid('FP-02'), setup: 10, run: 0.37 }, { name: 'Kolileme', station: sid('KL-01'), setup: 5, run: 0.19 }] },
      { id: 'b5', mat: mid('MM-003'), version: 'v1', base: 1, active: true, note: '', lines: [['YM-001', 1.8, 2], ['HM-010', 0.35, 1], ['HM-012', 0.25, 1], ['AM-001', 2.6, 3], ['AM-002', 1, 0], ['AM-003', 1, 0]].map(([c, q, s]) => ({ mat: mid(c), qty: q, scrap: s })), ops: [{ name: 'Kalıplama', station: sid('RK-01'), setup: 25, run: 0.07 }, { name: 'Pişirme', station: sid('TF-01'), setup: 30, run: 0.08 }, { name: 'Paketleme', station: sid('FP-01'), setup: 10, run: 0.3 }, { name: 'Kolileme', station: sid('KL-01'), setup: 5, run: 0.19 }] },
    ];

    d.moves = []; d.lots = []; d.po = []; d.receipts = []; d.wo = []; d.so = []; d.shipments = []; d.prq = []; d.offers = []; d.returns = []; d.maint = []; d.downtime = []; d.plans = []; d.fason = [];
    d.overheads = [['Elektrik', 184000], ['Doğalgaz', 96000], ['Kira', 120000], ['Amortisman', 60000]].map(([name, amount], i) => ({ id: 'oh' + i, month: D(0).slice(0, 7), name, amount }));
    let lotSeq = 100;
    const rem = {}; // lotNo -> {mat, wh, loc, qty, skt}
    const mat = (id) => d.materials.find((m) => m.id === id);
    const whOf = (m) => (m.type === 'ambalaj' ? 'w6' : m.type === 'mamul' ? 'w4' : m.type === 'yarimamul' ? 'w3' : 'w1');
    const newLot = (m, date, extra) => { const no = 'L' + date.replace(/-/g, '').slice(2) + '-' + ++lotSeq; d.lots.push({ id: no, no, mat: m.id, prod: date, skt: m.shelf ? iso(addDays(date, m.shelf)) : '', ...extra }); return no; };
    const mv = (o) => { d.moves.push({ id: uid(), at: o.date + 'T' + String(rand(7, 18)).padStart(2, '0') + ':' + String(rand(10, 59)) + ':00.000Z', user: 'Sistem', ...o }); if (o.lot && o.qty) { rem[o.lot] = rem[o.lot] || { mat: o.mat, wh: o.wh, loc: o.loc, qty: 0, skt: (d.lots.find((l) => l.id === o.lot) || {}).skt || '9999' }; rem[o.lot].qty = r3(rem[o.lot].qty + o.qty); } };
    // Açılış stokları
    d.materials.forEach((m) => { if (!m._open) return; const date = D(-40); const lot = newLot(m, date, { supplier: m.supplier, supLot: m.supplier ? 'T' + rand(10000, 99999) : '' }); mv({ date, mat: m.id, wh: whOf(m), loc: m.loc, lot, qty: m._open, cost: m.cost, type: 'acilis', refNo: 'Açılış' }); delete m._open; });
    // FEFO tüketim
    const consume = (matId, qty, date, ref, refNo) => {
      let need = qty; const used = [];
      Object.entries(rem).filter(([, r]) => r.mat === matId && r.qty > 0 && ['w1', 'w6', 'w3'].includes(r.wh)).sort((a, b) => a[1].skt.localeCompare(b[1].skt)).forEach(([lot, r]) => { if (need <= 0) return; const t = r3(Math.min(need, r.qty)); need = r3(need - t); used.push({ lot, qty: t, wh: r.wh, loc: r.loc }); mv({ date, mat: matId, wh: r.wh, loc: r.loc, lot, qty: -t, cost: mat(matId).cost, type: 'tuketim', ref, refNo }); });
      return used;
    };
    let woSeq = 0, poSeq = 0, rcSeq = 0, soSeq = 0, shSeq = 0;
    const bomOf = (matId) => d.boms.find((b) => b.mat === matId && b.active);
    const produce = (matId, qty, date, done) => {
      const m = mat(matId), b = bomOf(matId); const no = 'IE' + String(26000 + ++woSeq); const id = 'wo' + woSeq;
      const issued = [];
      // Yarı mamul kartında maliyet yok: panelle aynı, reçeteden gelen standart maliyet yazılır
      const stdCost = (id, dp = 0) => { const bm = bomOf(id); if (!bm || dp > 6) return mat(id).cost || 0; const mc = bm.lines.reduce((t, x) => t + x.qty * (1 + (x.scrap || 0) / 100) * stdCost(x.mat, dp + 1), 0) / bm.base; const oc = (bm.ops || []).reduce((t, o) => t + ((o.run || 0) / bm.base) * (((d.stations.find((s) => s.id === o.station) || {}).cph || 0) / 60), 0); return Math.round((mc + oc) * 100) / 100; };
      if (done) b.lines.forEach((l) => { const c = mat(l.mat); const need = r3((l.qty * qty) / b.base * (1 + (l.scrap || 0) / 100)); if (c.type === 'yarimamul' && bomOf(c.id)) produce(c.id, need, date, true); issued.push(...consume(l.mat, need, date, id, no).map((u) => ({ ...u, mat: l.mat, cost: stdCost(l.mat) }))); });
      const scrap = done ? (m.unit === 'koli' ? Math.round((qty * rand(5, 25)) / 1000) : r3((qty * rand(5, 25)) / 1000)) : 0;
      const good = r3(qty - scrap);
      const ops = b.ops.map((o) => { const st = d.stations.find((s) => s.id === o.station); const runMin = Math.round(o.setup + (o.run * qty) / b.base * (1 + rand(3, 18) / 100)); return { ...o, status: done ? 'tamam' : 'bekliyor', good: done ? good : 0, scrap: done ? scrap : 0, min: done ? runMin : 0, ideal: Math.round((qty / st.cap) * 60), date }; });
      const wo = { id, no, mat: matId, bom: b.id, qty: r3(qty), due: date, start: date, end: date, prio: 'normal', status: done ? 'tamam' : 'planlandi', produced: done ? good : 0, scrap, issued: done ? issued : [], ops, outLots: [], created: date + 'T06:00:00.000Z' };
      if (done) { const lot = newLot(m, date, { wo: id }); wo.outLots.push(lot); mv({ date, mat: matId, wh: whOf(m), loc: m.loc, lot, qty: good, cost: 0, type: 'uretim', ref: id, refNo: no }); }
      d.wo.push(wo); return wo;
    };
    // Geçmiş: satınalma + mal kabul + üretim + sevkiyat (son 30 gün)
    const buys = [['HM-001', 4000], ['HM-002', 1500], ['HM-003', 1200], ['HM-010', 400], ['AM-001', 20000], ['AM-002', 3000], ['HM-012', 400], ['HM-004', 300], ['AM-003', 5000], ['HM-005', 400]];
    const events = [];
    for (let k = 0; k < 30; k += 3) { const [c, q] = buys[(k / 3) % buys.length]; events.push({ t: 'buy', day: -30 + k, code: c, qty: q }); }
    for (let k = 0; k < 26; k += 2) events.push({ t: 'make', day: -27 + k, code: ['MM-002', 'MM-001', 'MM-003', 'MM-002'][(k / 2) % 4], qty: rand(18, 36) * 10 });
    events.push({ t: 'make', day: -12, code: 'YM-002', qty: 400 });
    for (let k = 0; k < 24; k += 2) events.push({ t: 'ship', day: -25 + k, cust: d.customers[(k / 2) % 5].id, lines: [['MM-002', rand(6, 16) * 10], ['MM-001', rand(4, 12) * 10], ...(k % 4 === 0 ? [['MM-003', rand(5, 15) * 10]] : [])] });
    events.sort((a, b) => a.day - b.day).forEach((e) => {
      const date = D(e.day);
      if (e.t === 'buy') {
        const m = mat(mid(e.code)); const s = d.suppliers.find((x) => x.id === m.supplier);
        const po = { id: 'po' + ++poSeq, no: 'SA' + String(2600 + poSeq), sup: s.id, date: iso(addDays(date, -s.lead)), due: date, currency: 'TRY', status: 'tamam', lines: [{ mat: m.id, qty: e.qty, price: m.cost, vat: 1, received: e.qty }], note: '' };
        const late = Math.random() < 0.2; const rdate = late ? iso(addDays(date, rand(1, 3))) : date;
        const lot = newLot(m, rdate, { supplier: s.id, supLot: 'T' + rand(10000, 99999) });
        const rc = { id: 'rc' + ++rcSeq, no: 'MK' + String(2600 + rcSeq), po: po.id, sup: s.id, date: rdate, waybill: 'A' + rand(100000, 999999), plate: pick(['35', '45', '16', '34', '42']) + ' ' + pick(['ABC', 'KTR', 'NB', 'EG', 'TR']) + ' ' + rand(100, 999), driver: pick(['Ali Demir', 'Veli Kaya', 'Sinan Öz', 'Rıza Yurt']), wh: whOf(m), status: 'tamam', checks: { arac: true, isi: true, ambalaj: true, belge: true }, lines: [{ mat: m.id, ordered: e.qty, qty: e.qty, lot, supLot: d.lots[d.lots.length - 1].supLot, skt: d.lots[d.lots.length - 1].skt, loc: m.loc, price: m.cost, qc: m.qc ? 'kabul' : 'yok', accepted: e.qty, rejected: 0, qcBy: m.qc ? 'Zeynep Kalkan' : '', qcAt: rdate }], by: 'Hüseyin Toprak' };
        mv({ date: rdate, mat: m.id, wh: whOf(m), loc: m.loc, lot, qty: e.qty, cost: m.cost, type: 'kabul', ref: rc.id, refNo: rc.no });
        d.po.push(po); d.receipts.push(rc);
      } else if (e.t === 'make') produce(mid(e.code), e.qty, date, true);
      else {
        const so = { id: 'so' + ++soSeq, no: 'SP' + String(2600 + soSeq), cust: e.cust, date: iso(addDays(date, -3)), due: date, currency: 'TRY', status: 'tamam', lines: e.lines.map(([c, q]) => ({ mat: mid(c), qty: q, price: mat(mid(c)).price, shipped: 0 })), note: '' };
        const sh = { id: 'sh' + ++shSeq, no: 'SV' + String(2600 + shSeq), so: so.id, cust: e.cust, date, plate: '35 FBR ' + rand(100, 999), driver: pick(['Erkan Yol', 'Murat Tır', 'Kadir Sevk']), lines: [] };
        so.lines.forEach((l) => { let need = l.qty; Object.entries(rem).filter(([, r]) => r.mat === l.mat && r.qty > 0 && r.wh === 'w4').sort((a, b) => a[1].skt.localeCompare(b[1].skt)).forEach(([lot, r]) => { if (need <= 0) return; const t = Math.min(need, r.qty); need -= t; sh.lines.push({ mat: l.mat, lot, qty: t, loc: r.loc }); mv({ date, mat: l.mat, wh: 'w4', loc: r.loc, lot, qty: -t, cost: 0, type: 'sevk', ref: sh.id, refNo: sh.no }); }); l.shipped = l.qty - need; });
        if (sh.lines.length) { d.so.push(so); d.shipments.push(sh); }
      }
    });
    // Bekleyen: kalite kontrol bekleyen mal kabul (bugün)
    const pend = [['HM-001', 4000, 's0'], ['HM-010', 300, 's5']];
    pend.forEach(([c, q, s], k) => {
      const m = mat(mid(c));
      const po = { id: 'po' + ++poSeq, no: 'SA' + String(2600 + poSeq), sup: s, date: D(-6), due: D(0), currency: 'TRY', status: 'tamam', lines: [{ mat: m.id, qty: q, price: m.cost, vat: 1, received: q }], note: '' };
      const lot = newLot(m, D(0), { supplier: s, supLot: 'T' + rand(10000, 99999) });
      const rc = { id: 'rc' + ++rcSeq, no: 'MK' + String(2600 + rcSeq), po: po.id, sup: s, date: D(0), waybill: 'A' + rand(100000, 999999), plate: '45 KTR ' + rand(100, 999), driver: 'Ali Demir', wh: 'w1', status: 'kalite', checks: { arac: true, isi: true, ambalaj: k === 0, belge: true }, gross: k === 0 ? 18420 : 0, tare: k === 0 ? 14380 : 0, lines: [{ mat: m.id, ordered: q, qty: q, lot, supLot: d.lots[d.lots.length - 1].supLot, skt: d.lots[d.lots.length - 1].skt, loc: m.loc, price: m.cost, qc: 'bekliyor', accepted: 0, rejected: 0 }], by: 'Hüseyin Toprak' };
      mv({ date: D(0), mat: m.id, wh: 'w2', loc: 'K-01', lot, qty: q, cost: m.cost, type: 'kabul', ref: rc.id, refNo: rc.no });
      d.po.push(po); d.receipts.push(rc);
    });
    // Açık satınalma siparişleri
    [['s2', [['HM-003', 1500]], 2, 'acik'], ['s3', [['HM-004', 400], ['HM-012', 500]], 6, 'acik'], ['s6', [['AM-001', 30000]], -1, 'acik']].forEach(([s, ls, due, status]) => d.po.push({ id: 'po' + ++poSeq, no: 'SA' + String(2600 + poSeq), sup: s, date: D(-4), due: D(due), currency: s === 's3' ? 'EUR' : 'TRY', rate: s === 's3' ? 55.6 : 1, status, lines: ls.map(([c, q]) => { const m = mat(mid(c)); return { mat: m.id, qty: q, price: s === 's3' ? Math.round((m.cost / 55.6) * 100) / 100 : m.cost, vat: m.type === 'ambalaj' ? 20 : 1, received: 0 }; }), note: '' }));
    d._meta._seq_lot = lotSeq; d._meta._seq_wo = 26000 + woSeq; d._meta._seq_po = 2600 + poSeq; d._meta._seq_rc = 2600 + rcSeq; d._meta._seq_so = 2600 + soSeq + 3; d._meta._seq_sh = 2600 + shSeq; d._meta._seq_prq = 2600 + 2; d._meta._seq_ret = 2600;
    // Açık satış siparişleri
    [['m0', [['MM-002', 600], ['MM-001', 300]], 3], ['m4', [['MM-002', 1200], ['MM-003', 400]], 10], ['m2', [['MM-001', 250]], 1]].forEach(([c, ls, due], k) => d.so.push({ id: 'so' + ++soSeq, no: 'SP' + String(2600 + soSeq), cust: c, date: D(-2), due: D(due), currency: 'TRY', status: 'acik', lines: ls.map(([cd, q]) => ({ mat: mid(cd), qty: q, price: mat(mid(cd)).price, shipped: 0 })), note: k === 1 ? 'İhracat — İngilizce etiket' : '' }));
    // Planlanan / devam eden iş emirleri
    const w1 = produce(mid('MM-002'), 500, D(1), false); w1.prio = 'yuksek'; w1.so = 'so' + (soSeq - 2);
    const w2 = produce(mid('MM-001'), 300, D(0), false); w2.status = 'planlandi';
    produce(mid('YM-001'), 1000, D(0), false).prio = 'yuksek';
    d._meta._seq_wo = 26000 + woSeq;
    // Satınalma talepleri
    d.prq = [
      { id: 'pr1', no: 'ST2601', date: D(-1), dept: 'Üretim', by: 'Okan Yıldırım', status: 'bekliyor', lines: [{ mat: mid('SR-002'), qty: 4, need: D(7) }, { mat: mid('SR-001'), qty: 40, need: D(10) }], note: 'FP-02 çene rezistansı arızalı' },
      { id: 'pr2', no: 'ST2602', date: D(-3), dept: 'Satınalma', by: 'Derya Aksoy', status: 'onaylandi', lines: [{ mat: mid('HM-005'), qty: 600, need: D(8) }, { mat: mid('HM-006'), qty: 300, need: D(8) }], note: '' },
    ];
    d.offers = [{ id: 'of1', prq: 'pr2', sup: 's4', date: D(-2), lead: 6, term: 45, currency: 'TRY', lines: [{ mat: mid('HM-005'), price: 152 }, { mat: mid('HM-006'), price: 288 }] }, { id: 'of2', prq: 'pr2', sup: 's9', date: D(-1), lead: 9, term: 30, currency: 'TRY', lines: [{ mat: mid('HM-005'), price: 149 }, { mat: mid('HM-006'), price: 301 }] }];
    // Bakım planları ve duruşlar
    d.plans = d.stations.map((s, i) => ({ id: 'mp' + i, station: s.id, task: ['Yağlama ve bıçak kontrolü', 'Kalıp temizliği', 'Brülör ve bant ayarı', 'Kazan CIP temizliği', 'Krema nozulu kalibrasyonu', 'Çene ve rezistans kontrolü', 'Çene ve rezistans kontrolü', 'Robot kavrayıcı kontrolü'][i], period: [7, 14, 30, 7, 14, 14, 14, 30][i], last: D(-[3, 10, 26, 8, 15, 4, 12, 31][i]) }));
    d.plans.forEach((p) => { d.maint.push({ id: uid(), station: p.station, type: 'periyodik', date: p.last, desc: p.task, min: rand(30, 120), cost: rand(500, 4000), by: 'Bakım ekibi', status: 'tamam' }); });
    d.maint.push({ id: uid(), station: 'st6', type: 'ariza', date: D(0), desc: 'Çene rezistansı yandı, sızdırmazlık hatası', min: 0, cost: 0, by: 'Okan Yıldırım', status: 'acik' });
    d.downtime = [
      { id: uid(), station: 'st2', start: D(-5) + 'T10:20', end: D(-5) + 'T11:05', reason: 'Brülör arızası' }, { id: uid(), station: 'st4', start: D(-3) + 'T14:00', end: D(-3) + 'T14:40', reason: 'Krema nozulu tıkanması' },
      { id: uid(), station: 'st5', start: D(-2) + 'T09:10', end: D(-2) + 'T09:35', reason: 'Film kopması' }, { id: uid(), station: 'st1', start: D(-1) + 'T16:00', end: D(-1) + 'T16:30', reason: 'Kalıp değişimi (planlı)' },
      { id: uid(), station: 'st6', start: D(0) + 'T07:45', end: '', reason: 'Çene rezistansı arızası' },
    ];
    d.returns = [];
  }

  return { seed, TYPES, WHT, MOVE, USABLE, r3 };
})();
