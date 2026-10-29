/* NEBSOFT Ön Muhasebe — fatura, teklif, cari, kasa/banka, gelir-gider, çek/senet ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const r2 = (n) => Math.round(n * 100) / 100;
  const CUR = { TRY: '₺ Türk lirası', USD: '$ ABD doları', EUR: '€ Euro', GBP: '£ Sterlin' };
  const cm = (v, cur) => (cur && cur !== 'TRY' ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(Number(v) || 0) : money(v));

  function seed(db) {
    db.data._settings = { bizName: 'Atlas Ticaret Ltd. Şti.', bizPhone: '0312 444 55 66', bizAddress: 'Kızılay, Atatürk Bulvarı No:120', bizDistrict: 'Çankaya', bizCity: 'Ankara', taxNo: '1234567890', taxOffice: 'Kavaklıdere', iban: 'TR33 0001 0012 3456 7890 1234 56', invoiceNote: 'Ödemenizi vadesinde yapmanızı rica ederiz.' };
    db.data.users = [{ id: 'u1', name: 'Serap Muhasebe', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tolga Satış', role: 'satis', pin: '1234', active: true }];
    db.data.accounts = [{ id: 'a1', name: 'Merkez Kasa', type: 'kasa', opening: 25000, color: '#16a34a' }, { id: 'a2', name: 'İş Bankası TL', type: 'banka', iban: 'TR33 0006 4000 0011 2345 6789 01', opening: 1250000, color: '#2563eb' }, { id: 'a3', name: 'Garanti BBVA TL', type: 'banka', iban: 'TR12 0006 2000 1234 0006 2954 13', opening: 320000, color: '#0d9488' }, { id: 'a4', name: 'Kredi Kartı (Ticari)', type: 'kart', opening: 0, color: '#7c3aed' }];
    const firms = ['Yıldız Gıda A.Ş.', 'Ege Tekstil Ltd.', 'Kuzey Yapı Market', 'Akdeniz Otelcilik', 'Mavi Lojistik', 'Delta Bilişim', 'Güneş Mobilya', 'Anka Reklam Ajansı', 'Toros Kimya', 'Marmara Ofis Malz.', 'Başkent Elektrik', 'Kardelen Kafe'];
    db.data.caris = firms.map((n, i) => ({ id: 'c' + i, name: n, type: i < 8 ? 'musteri' : 'tedarikci', taxNo: String(rand(1000000000, 9999999999)), taxOffice: pick(['Çankaya', 'Kavaklıdere', 'Ulus', 'Maltepe']), phone: NS.phone(), email: 'muhasebe@' + NS.slug(n).split('-')[0] + '.com.tr', ...pick([{ address: 'Atatürk Cad. No:12', district: 'Çankaya', city: 'Ankara' }, { address: 'Büyükdere Cad. No:45', district: 'Şişli', city: 'İstanbul' }, { address: 'Kordon Boyu No:8', district: 'Konak', city: 'İzmir' }, { address: 'FSM Bulvarı No:3', district: 'Nilüfer', city: 'Bursa' }, { address: 'Lara Cad. No:21', district: 'Muratpaşa', city: 'Antalya' }]), term: pick([0, 15, 30, 45, 60]) }));
    db.data.items = [['Danışmanlık hizmeti (saat)', 'saat', 1500, 20], ['Yazılım lisansı (yıllık)', 'adet', 12000, 20], ['Kurulum ve eğitim', 'adet', 7500, 20], ['A4 fotokopi kağıdı (koli)', 'koli', 850, 20], ['Toner kartuş', 'adet', 2400, 20], ['Ofis sandalyesi', 'adet', 4200, 20], ['Bakım sözleşmesi (aylık)', 'ay', 3000, 20], ['Gıda kolisi', 'adet', 650, 1], ['Nakliye hizmeti', 'sefer', 3500, 20]].map(([name, unit, price, vat], i) => ({ id: 'it' + i, code: 'STK-' + String(i + 1).padStart(4, '0'), barcode: '86900' + String(10000000 + i * 137), name, unit, price, buy: Math.round(price * 0.65), vat, kind: [0, 2, 6, 8].includes(i) ? 'hizmet' : 'stok', min: 10, group: [0, 2, 6, 8].includes(i) ? 'Hizmetler' : i === 1 ? 'Yazılım' : i === 7 ? 'Gıda' : 'Ofis' }));
    db.data.depots = [{ id: 'dp1', name: 'Merkez Depo', address: 'Ostim OSB, Ankara' }, { id: 'dp2', name: 'İstanbul Şube', address: 'İkitelli OSB, İstanbul' }];
    db.data.moves = [];
    db.data.items.filter((i) => i.kind === 'stok').forEach((it, k) => { db.data.moves.push({ id: NS.uid(), date: iso(addDays(new Date(), -180)), item: it.id, depot: 'dp1', qty: 40 + k * 15, type: 'acilis', refNo: 'Açılış' }, { id: NS.uid(), date: iso(addDays(new Date(), -180)), item: it.id, depot: 'dp2', qty: 10 + k * 4, type: 'acilis', refNo: 'Açılış' }); });
    db.data._settings.rates = { USD: 49.65, EUR: 55.6, GBP: 66.5 };
    const ln = (id, qty, buy) => { const it = db.data.items.find((x) => x.id === id); return { item: id, name: it.name, unit: it.unit, qty, price: buy ? it.buy : it.price, vat: it.vat, disc: 0 }; };
    db.data.orders = [
      { id: 'o1', kind: 'ssip', no: 'SS2026001001', cari: 'c0', date: iso(addDays(new Date(), -6)), delivery: iso(addDays(new Date(), 2)), currency: 'TRY', rate: 1, depot: 'dp1', status: 'kismi', lines: [{ ...ln('it3', 20), delivered: 12 }, { ...ln('it4', 6), delivered: 6 }], note: '' },
      { id: 'o2', kind: 'ssip', no: 'SS2026001002', cari: 'c5', date: iso(addDays(new Date(), -2)), delivery: iso(addDays(new Date(), -1)), currency: 'TRY', rate: 1, depot: 'dp1', status: 'acik', lines: [ln('it5', 8), ln('it1', 3)], note: '' },
      { id: 'o3', kind: 'asip', no: 'AS2026001001', cari: 'c9', date: iso(addDays(new Date(), -4)), delivery: iso(addDays(new Date(), 5)), currency: 'USD', rate: 49.65, depot: 'dp1', status: 'acik', lines: [{ ...ln('it4', 50, true), price: 45 }], note: 'Toner ithalatı' },
    ];
    db.data.dispatches = [{ id: 'd1', kind: 'satis', no: 'SI2026000001', cari: 'c0', order: 'o1', date: iso(addDays(new Date(), -3)), shipDate: iso(addDays(new Date(), -3)), depot: 'dp1', plate: '06 ABC 123', driver: 'Murat Kaya', lines: [{ item: 'it3', name: 'A4 fotokopi kağıdı (koli)', unit: 'koli', qty: 12 }, { item: 'it4', name: 'Toner kartuş', unit: 'adet', qty: 6 }], note: 'Sipariş SS2026001001' }];
    db.data.dispatches[0].lines.forEach((l) => db.data.moves.push({ id: NS.uid(), date: db.data.dispatches[0].date, item: l.item, depot: 'dp1', qty: -l.qty, type: 'irsaliye', ref: 'd1', refNo: 'SI2026000001', cari: 'c0' }));
    db.data.cats = { gelir: ['Faiz geliri', 'Kira geliri', 'Diğer gelir'], gider: ['Kira', 'Elektrik-su-doğalgaz', 'Personel maaş', 'SGK', 'Vergi', 'Yakıt', 'Yemek', 'Kırtasiye', 'Banka masrafı', 'Reklam', 'Diğer gider'] };
    const invoices = [], txns = [];
    let no = 1000;
    for (let k = 0; k < 110; k++) {
      const sale = k % 3 !== 0;
      const cari = pick(db.data.caris.filter((c) => (sale ? c.type === 'musteri' : c.type === 'tedarikci')));
      const date = iso(addDays(new Date(), -rand(0, 175)));
      const lines = Array.from({ length: rand(1, 4) }, () => { const it = pick(db.data.items); return { name: it.name, unit: it.unit, qty: rand(1, 6), price: Math.round(it.price * (sale ? 1 : 0.65)), vat: it.vat, disc: pick([0, 0, 0, 5, 10]) }; });
      const inv = { id: 'f' + k, no: (sale ? 'SF' : 'AF') + '2026' + String(++no).padStart(6, '0'), kind: sale ? 'satis' : 'alis', cari: cari.id, date, due: iso(addDays(date, cari.term)), lines, note: '', created: date + 'T10:00:00.000Z' };
      invoices.push(inv);
      const tot = invTotals(inv).tl;
      const r = Math.random();
      if (r < 0.6 || daysBetween(date, new Date()) > 70) txns.push({ id: NS.uid(), date: iso(addDays(date, rand(0, Math.max(1, cari.term)))) > today() ? today() : iso(addDays(date, rand(0, Math.max(1, cari.term)))), type: sale ? 'tahsilat' : 'odeme', account: pick(['a1', 'a2', 'a2', 'a3']), cari: cari.id, invoice: inv.id, amount: tot, desc: `${inv.no} ${sale ? 'tahsilatı' : 'ödemesi'}` });
      else if (r < 0.75) txns.push({ id: NS.uid(), date, type: sale ? 'tahsilat' : 'odeme', account: 'a2', cari: cari.id, invoice: inv.id, amount: r2(tot / 2), desc: `${inv.no} kısmi` });
    }
    for (let m = 0; m < 6; m++) {
      const d = new Date(); d.setDate(5); d.setMonth(d.getMonth() - m);
      if (d > new Date()) continue;
      txns.push({ id: NS.uid(), date: iso(addDays(d, 22)) > today() ? today() : iso(addDays(d, 22)), type: 'virman', account: 'a2', account2: 'a4', amount: 42000, desc: 'Kredi kartı ekstre ödemesi' });
      [['Kira', 35000, 'a2'], ['Personel maaş', 145000, 'a2'], ['SGK', 52000, 'a2'], ['Elektrik-su-doğalgaz', rand(6000, 11000), 'a3'], ['Yakıt', rand(8000, 14000), 'a4'], ['Yemek', rand(12000, 18000), 'a4'], ['Reklam', rand(5000, 20000), 'a4'], ['Banka masrafı', rand(300, 900), 'a2']].forEach(([cat, amount, acc]) => txns.push({ id: NS.uid(), date: iso(addDays(d, rand(0, 20))) > today() ? today() : iso(addDays(d, rand(0, 20))), type: 'gider', account: acc, cat, amount, desc: cat }));
      txns.push({ id: NS.uid(), date: iso(d), type: 'gelir', account: 'a2', cat: 'Faiz geliri', amount: rand(1500, 4000), desc: 'Vadeli hesap faizi' });
    }
    db.data.invoices = invoices.sort((a, b) => a.date.localeCompare(b.date));
    db.data.txns = txns;
    db.data._meta._seq_SF = 1100; db.data._meta._seq_AF = 1100; db.data._meta._seq_TK = 100; db.data._meta._seq_SS = 1002; db.data._meta._seq_AS = 1001;
    db.data.quotes = [{ id: 'q1', no: 'TK000101', cari: 'c3', date: iso(addDays(new Date(), -4)), valid: iso(addDays(new Date(), 10)), status: 'gonderildi', lines: [{ name: 'Yazılım lisansı (yıllık)', unit: 'adet', qty: 5, price: 12000, vat: 20, disc: 10 }, { name: 'Kurulum ve eğitim', unit: 'adet', qty: 1, price: 7500, vat: 20, disc: 0 }], note: 'Fiyatlar 15 gün geçerlidir.' }];
    db.data.cheques = [
      { id: 'ck1', dir: 'alinan', kind: 'cek', no: '1234567', bank: 'Ziraat Bankası', cari: 'c0', due: iso(addDays(new Date(), 12)), amount: 45000, status: 'portfoy' },
      { id: 'ck2', dir: 'alinan', kind: 'senet', no: 'S-0045', bank: '', cari: 'c4', due: iso(addDays(new Date(), -3)), amount: 18000, status: 'portfoy' },
      { id: 'ck3', dir: 'verilen', kind: 'cek', no: '8812331', bank: 'İş Bankası', cari: 'c9', due: iso(addDays(new Date(), 25)), amount: 62000, status: 'portfoy' },
    ];
  }
  // Tutarlar apps/muhasebe/calc.js ile: satır satır kuruşa yuvarlanır, e-Fatura (core/ubltr.js) ile aynı kural
  const invTotals = (inv) => window.MUHCALC.totals(inv);
  const lineNet = (l) => window.MUHCALC.line(l).net;
  const db = new NS.DB('muhasebe', seed);
  // ---------- İşlem geçmişi: kayıt ekleme / değiştirme / silme kim tarafından, ne zaman, neyi değiştirerek yapıldı ----------
  const AUD = { invoices: 'Fatura', caris: 'Cari', txns: 'Kasa/banka hareketi', items: 'Stok kartı', cheques: 'Çek/senet', quotes: 'Teklif', orders: 'Sipariş', dispatches: 'İrsaliye', accounts: 'Hesap', depots: 'Depo', users: 'Kullanıcı' };
  const FLD = { date: 'tarih', due: 'vade', cari: 'cari', lines: 'kalemler', note: 'not', currency: 'para birimi', rate: 'kur', amount: 'tutar', name: 'ad', taxNo: 'VKN', taxOffice: 'vergi dairesi', address: 'adres', district: 'ilçe', city: 'il', phone: 'telefon', email: 'e-posta', price: 'fiyat', buy: 'alış fiyatı', vat: 'KDV', active: 'durum', role: 'rol', pin: 'PIN', status: 'durum', account: 'hesap', term: 'vade günü' };
  const audLabel = (r) => (r ? r.no || r.name || r.desc || r.id : '');
  ['insert', 'update', 'remove'].forEach((fn) => {
    const orig = db[fn].bind(db);
    db[fn] = (col, a, b) => {
      if (!AUD[col]) return orig(col, a, b);
      const before = fn === 'insert' ? null : JSON.parse(JSON.stringify(db.get(col, a) || null));
      const out = orig(col, a, b); const after = fn === 'remove' ? null : fn === 'insert' ? out : db.get(col, a);
      const ch = fn === 'update' && before && after ? Object.keys(FLD).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map((k) => (k === 'pin' ? 'PIN' : FLD[k])) : [];
      if (fn !== 'update' || ch.length) { db.log(`${AUD[col]} ${fn === 'insert' ? 'eklendi' : fn === 'update' ? 'değiştirildi' : 'silindi'}`, `${audLabel(after || before)}${ch.length ? ' · ' + ch.join(', ') : ''}`); if (!(fn === 'insert' && b)) db.save(); }
      return out;
    };
  });
  function auditPage(el) {
    let q = '', who = '', from = iso(addDays(new Date(), -30)), to = today();
    const users = [...new Set(db.all('_log').map((l) => l.user).filter(Boolean))];
    el.innerHTML = pageHead('İşlem geçmişi', 'Kim, ne zaman, neyi ekledi / değiştirdi / sildi — son 5.000 işlem', `<button class="btn" id="ax">${icon('download')} Excel (CSV)</button>`) + `
      <div class="card"><div class="card-h row wrap" style="gap:8px">${NS.searchBox('aq', 'İşlem, belge no, cari...')}<select class="input" id="au" style="max-width:200px"><option value="">Tüm kullanıcılar</option>${users.map((u) => `<option>${esc(u)}</option>`).join('')}</select><input class="input" type="date" id="af" value="${from}" style="max-width:160px"><input class="input" type="date" id="at" value="${to}" style="max-width:160px"></div><div id="al"></div></div>`;
    const rows = () => db.all('_log', (l) => (!who || l.user === who) && l.at.slice(0, 10) >= from && l.at.slice(0, 10) <= to && NS.match(q, l.action, l.detail, l.user));
    const draw = () => { $('#al', el).innerHTML = table({ rows: rows().slice(0, 1000), empty: 'Bu aralıkta işlem yok', columns: [{ label: 'Zaman', render: (l) => NS.dt(l.at) }, { label: 'Kullanıcı', render: (l) => esc(l.user || '') }, { label: 'İşlem', render: (l) => `<b>${esc(l.action)}</b>` }, { label: 'Ayrıntı', render: (l) => `<span class="small">${esc(l.detail || '')}</span>` }] }); };
    $('#aq', el).oninput = (e) => { q = e.target.value; draw(); }; $('#au', el).onchange = (e) => { who = e.target.value; draw(); };
    $('#af', el).onchange = (e) => { from = e.target.value; draw(); }; $('#at', el).onchange = (e) => { to = e.target.value; draw(); };
    $('#ax', el).onclick = () => NS.csv('islem-gecmisi', rows(), [{ key: 'at', label: 'Zaman' }, { key: 'user', label: 'Kullanıcı' }, { key: 'action', label: 'İşlem' }, { key: 'detail', label: 'Ayrıntı' }]);
    draw();
  }
  const S = () => db.settings({});
  window.MUHTEKRAR.init({ db, cari: (id) => cari(id), invTotals: (i) => invTotals(i), createDoc: (k, d) => createDoc(k, d), sendEDoc: (a, i, o) => sendEDoc(a, i, o), cm: (v, c) => cm(v, c) });
  window.MUHHATIRLAT.init({ db, cari: (id) => cari(id), invTotals: (i) => invTotals(i), paidOf: (i) => paidOf(i), invStatus: (i) => invStatus(i), isSale: (i) => isSale(i), S: () => S() });
  // Program açılınca ve her saat: vadesi gelen tekrarlayan faturalar kesilir (kapalıyken geçen dönemler dahil), otomatik ödeme hatırlatmaları gider
  const recurTick = () => { if (!NS.app || !NS.currentUser || !NS.app.can('muhasebe')) return; const made = window.MUHTEKRAR.run(); if (made.length) { window.MUHTEKRAR.sendQueued(NS.app, made); if (NS.app.route === 'faturalar' || NS.app.route === 'tekrar') NS.app.refresh(); } window.MUHHATIRLAT.auto(); };
  setTimeout(recurTick, 2000); setInterval(recurTick, 36e5);
  window.MUHAKTAR.init({ db, isStock: (i) => isStock(i), depots: () => depots() });
  window.MUHBEYAN.init({ db, invTotals, cari: (id) => db.get('caris', id) || { name: '-' }, cariBalance: (id) => cariBalance(id), S });
  const cari = (id) => db.get('caris', id) || { name: '-' };
  const acc = (id) => db.get('accounts', id) || { name: '-' };
  // Ödenen: faturaya bağlı hareketler + fatura seçilmeden yapılıp açık faturalara dağıtılan tutarlar (t.alloc)
  const paidOf = (inv) => sum(db.all('txns', (t) => t.invoice === inv.id), (t) => t.amount) + sum(db.all('txns', (t) => t.alloc && !t.invoice), (t) => sum(t.alloc.filter((a) => a.invoice === inv.id), (a) => a.amount));
  // Fatura seçmeden yapılan tahsilat / ödemeyi en eski vadeli açık faturalardan başlayarak dağıtır
  function allocate(cariId, type, amount) {
    const kind = type === 'tahsilat' ? 'satis' : 'alis'; let left = r2(amount); const out = [];
    db.all('invoices', (i) => i.cari === cariId && i.kind === kind && !i.iade && invStatus(i) !== 'odendi').sort((a, b) => String(a.due || a.date).localeCompare(String(b.due || b.date))).forEach((i) => { if (left <= 0) return; const rem = r2(invTotals(i).tl - paidOf(i)); if (rem <= 0) return; const a = Math.min(rem, left); out.push({ invoice: i.id, no: i.no, amount: r2(a) }); left = r2(left - a); });
    return out;
  }
  const invStatus = (inv) => { const t = invTotals(inv).tl, p = paidOf(inv); return p >= t - 0.01 ? 'odendi' : p > 0 ? 'kismi' : inv.due < today() ? 'gecikti' : 'acik'; };
  const IST = { odendi: ['Ödendi', 'ok'], kismi: ['Kısmi ödendi', 'info'], acik: ['Açık', 'warn'], gecikti: ['Vadesi geçti', 'err'] };
  // Cari bakiye: pozitif = bize borçlu (alacağımız), negatif = bizim borcumuz
  function cariBalance(id) {
    const inv = db.all('invoices', (i) => i.cari === id);
    const sales = sum(inv.filter((i) => i.kind === 'satis'), (i) => invTotals(i).tl), buys = sum(inv.filter((i) => i.kind === 'alis'), (i) => invTotals(i).tl);
    const tx = db.all('txns', (t) => t.cari === id);
    // Açılış bakiyesi (içe aktarımdan): + cari bize borçlu, − biz cariye borçluyuz
    return r2((Number(cari(id).opening) || 0) + sales - buys - sum(tx.filter((t) => t.type === 'tahsilat'), (t) => t.amount) + sum(tx.filter((t) => t.type === 'odeme'), (t) => t.amount));
  }
  function accBalance(id) {
    const a = acc(id); const tx = db.all('txns');
    return r2((a.opening || 0) + sum(tx.filter((t) => t.account === id && ['tahsilat', 'gelir'].includes(t.type)), (t) => t.amount) - sum(tx.filter((t) => t.account === id && ['odeme', 'gider'].includes(t.type)), (t) => t.amount) - sum(tx.filter((t) => t.type === 'virman' && t.account === id), (t) => t.amount) + sum(tx.filter((t) => t.type === 'virman' && t.account2 === id), (t) => t.amount));
  }

  // ---------- Belge türleri ----------
  // col: kayıt koleksiyonu, prefix: numara serisi, dir: stok yönü (+ giriş / - çıkış), party: cari türü
  const DOCT = {
    teklif: { col: 'quotes', prefix: 'TK', title: 'Teklif', print: 'FİYAT TEKLİFİ', party: 'musteri', date2: 'Geçerlilik' },
    satis: { col: 'invoices', prefix: 'SF', title: 'Satış faturası', print: 'SATIŞ FATURASI', party: 'musteri', dir: -1, date2: 'Vade' },
    alis: { col: 'invoices', prefix: 'AF', title: 'Alış faturası', print: 'ALIŞ FATURASI', party: 'tedarikci', dir: 1, date2: 'Vade' },
    ssip: { col: 'orders', prefix: 'SS', title: 'Satış siparişi', print: 'SATIŞ SİPARİŞİ', party: 'musteri', date2: 'Teslim tarihi' },
    asip: { col: 'orders', prefix: 'AS', title: 'Alış siparişi', print: 'SATIN ALMA SİPARİŞİ', party: 'tedarikci', date2: 'Teslim tarihi' },
  };
  // İade belgeleri kind'ı ters taraftan taşır (alış iadesi = satis, müşteri iadesi = alis); raporlarda gelir / giderden düşülür
  const isSale = (i) => i.kind === 'satis' && !i.iade, isBuy = (i) => i.kind === 'alis' && !i.iade;
  const docLabel = (i) => (i.iade ? (i.kind === 'satis' ? 'Alış iadesi' : 'Müşteri iadesi') : i.kind === 'satis' ? 'Satış faturası' : 'Alış faturası');
  function createDoc(kind, doc) {
    const T = DOCT[kind]; doc.kind = kind; const px = doc.iade ? (kind === 'satis' ? 'AIF' : 'SIF') : T.prefix;
    doc.no = px + new Date().getFullYear() + String(db.nextNo(px)).padStart(6, '0'); const saved = db.insert(T.col, doc);
    db.log(doc.iade ? docLabel(doc) : T.title, `${doc.no} · ${cari(doc.cari).name} · ${money(invTotals(doc).tl)}${doc.recurring ? ' · tekrarlayan' : ''}`);
    if (T.col === 'invoices') syncMoves('fatura', saved, T.dir);
    if (NS.integ) NS.integ.emit(T.col === 'invoices' ? 'fatura' : T.col === 'orders' ? 'siparis' : 'teklif', { no: doc.no, kind, total: invTotals(doc).tl });
    return saved;
  }
  // Benzerini oluştur: kalemler, cari ve para birimi kopyalanır; tarih bugüne, numara yeniye alınır
  const tagsOf = (c) => String(c.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  // Risk limiti: carinin açık bakiyesi + yeni belge limit aşarsa uyarı (Satış rolü aşamaz, Muhasebe / Yönetici onaylayabilir)
  const riskOver = (c, add = 0) => (Number(c.riskLimit) > 0 && cariBalance(c.id) + add > Number(c.riskLimit) ? r2(cariBalance(c.id) + add - Number(c.riskLimit)) : 0);
  // Fiyat listesi: carinin listesi varsa kalemin satış fiyatı listeden (özel fiyat > yüzde kural)
  const priceLists = () => S().priceLists || [];
  function listPrice(c, it) { const pl = priceLists().find((x) => x.id === (c && c.priceList)); if (!pl) return null; const o = (pl.prices || {})[it.id]; if (o != null && o !== '') return Number(o); return pl.pct ? r2((Number(it.price) || 0) * (1 + Number(pl.pct) / 100)) : null; }
  // Çoklu birim: kartta "koli=12, paket=6" → satırda koli seçilirse stoğa 12 adet işlenir, fiyat 12 ile çarpılır
  const unitsOf = (it) => [[it.unit || 'adet', 1], ...String((it && it.altUnits) || '').split(',').map((x) => x.split('=').map((y) => y.trim())).filter((x) => x[0] && Number(x[1]) > 0).map(([u, f]) => [u, Number(f)])];
  const copyDoc = (app, src) => docEditor(app, src.kind, null, { cari: src.cari, currency: src.currency || 'TRY', rate: src.rate || 1, depot: src.depot, lines: JSON.parse(JSON.stringify(src.lines)).map((l) => { delete l.id; return l; }), note: src.note || '' });
  function priceListModal(app) {
    const lists = JSON.parse(JSON.stringify(priceLists())); let cur = lists[0] ? lists[0].id : null;
    modal({ title: 'Fiyat listeleri', size: 'xl', body: '<div id="plx"></div>', actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close) => { db.saveSettings({ priceLists: lists }); db.log('Fiyat listeleri güncellendi', lists.map((x) => x.name).join(', ')); close(); toast('Kaydedildi', 'ok'); app.refresh(); } }],
      onOpen: (b) => {
        const draw = () => { const pl = lists.find((x) => x.id === cur);
          $('#plx', b).innerHTML = `<p class="small muted mb">Cari kartında seçilen liste, o cariye kesilen faturada satış fiyatını belirler. Kural: satış fiyatına yüzde (ör. bayi −10). Ürüne özel fiyat girilirse o geçerlidir.</p>
            <div class="row wrap mb" style="gap:6px">${lists.map((x) => `<button class="btn sm ${x.id === cur ? 'primary' : ''}" data-pl="${x.id}">${esc(x.name)}</button>`).join('')}<button class="btn sm" data-pl="+">${icon('plus')} Yeni liste</button></div>
            ${pl ? `<div class="row wrap mb" style="gap:8px"><input class="input" id="pln" value="${esc(pl.name)}" style="max-width:240px"><label class="row small">Kural: satış fiyatı % <input class="input" type="number" id="plp" value="${pl.pct || 0}" style="width:90px"></label><button class="btn sm ghost" id="pld">${icon('trash')} Listeyi sil</button></div>
            <div class="tbl-wrap" style="max-height:50vh;overflow:auto"><table class="tbl"><thead><tr><th>Ürün</th><th class="right">Satış fiyatı</th><th class="right">Kurala göre</th><th>Özel fiyat</th></tr></thead><tbody>${db.all('items').map((it) => `<tr><td>${esc(it.code ? it.code + ' · ' : '')}${esc(it.name)}</td><td class="right">${money(it.price)}</td><td class="right">${money(r2((Number(it.price) || 0) * (1 + (Number(pl.pct) || 0) / 100)))}</td><td><input class="input" type="number" step="0.01" data-pi="${it.id}" value="${(pl.prices || {})[it.id] ?? ''}" style="width:120px" placeholder="—"></td></tr>`).join('')}</tbody></table></div>` : '<div class="muted">Henüz liste yok.</div>'}`; };
        on(b, 'click', '[data-pl]', (e, x) => { if (x.dataset.pl === '+') { const id = NS.uid(); lists.push({ id, name: 'Yeni liste', pct: 0, prices: {} }); cur = id; } else cur = x.dataset.pl; draw(); });
        on(b, 'input', '#pln', (e, x) => { lists.find((y) => y.id === cur).name = x.value; });
        on(b, 'input', '#plp', (e, x) => { lists.find((y) => y.id === cur).pct = Number(x.value) || 0; });
        on(b, 'change', '#plp', () => draw());
        on(b, 'input', '[data-pi]', (e, x) => { const pl = lists.find((y) => y.id === cur); pl.prices = pl.prices || {}; if (x.value === '') delete pl.prices[x.dataset.pi]; else pl.prices[x.dataset.pi] = Number(x.value); });
        on(b, 'click', '#pld', () => { const i = lists.findIndex((y) => y.id === cur); if (i >= 0) lists.splice(i, 1); cur = lists[0] ? lists[0].id : null; draw(); });
        draw();
      } });
  }
  // ---------- Banka ekstresi: dosyadan (Excel / CSV) okuma + eşleştirme ----------
  // Bankaların ekstre dosyaları farklı sütun adları kullanır; tarih, açıklama ve tutar (veya Borç / Alacak) sütunları bulunur
  function parseStatement(rows) {
    if (!rows.length) return []; const H = Object.keys(rows[0]); const n = (x) => NS.trLower(x).replace(/[^a-zçğıöşü0-9]/g, '');
    const find = (...a) => H.find((h) => a.some((k) => n(h) === k)) || H.find((h) => a.some((k) => n(h).includes(k)));
    const hd = find('tarih', 'işlemtarihi', 'islemtarihi', 'valör', 'valor', 'date'), hs = find('açıklama', 'aciklama', 'işlemaçıklaması', 'detay', 'description'), ht = find('tutar', 'işlemtutarı', 'islemtutari', 'amount'), hb = find('borç', 'borc', 'çıkış', 'cikis', 'debit'), ha = find('alacak', 'giriş', 'giris', 'credit'), hr = find('dekontno', 'referans', 'fişno', 'refno', 'işlemno');
    const num = window.MUHAKTAR.numOf;
    const dt = (v) => { v = String(v || '').trim(); let m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; if (/^\d{5}(\.\d+)?$/.test(v)) return iso(new Date(Date.UTC(1899, 11, 30) + Number(v) * 864e5)); return ''; };
    if (!hd || !(ht || hb || ha)) return [];
    return rows.map((r) => { const date = dt(r[hd]); let amount = ht ? num(r[ht]) : (num(r[ha]) || 0) - (num(r[hb]) || 0); if (!date || !Number.isFinite(amount) || !amount) return null; const desc = String(hs ? r[hs] : '').trim(); return { id: 'F' + date + '|' + r2(amount) + '|' + (hr && r[hr] ? r[hr] : desc).slice(0, 80), date, amount: r2(amount), desc }; }).filter(Boolean);
  }
  // Öneri: açıklamada fatura no > VKN > cari adı; yoksa kalan tutarı aynı olan tek açık fatura
  function bankMatch(t) {
    const up = NS.trLower(t.desc); const kind = t.amount > 0 ? 'satis' : 'alis';
    let inv = db.find('invoices', (i) => i.no && up.includes(NS.trLower(i.no)));
    let c = inv ? cari(inv.cari) : db.find('caris', (x) => x.taxNo && String(x.taxNo).length >= 10 && up.includes(String(x.taxNo))) || db.find('caris', (x) => { const w = NS.trLower(x.name).split(/\s+/).filter((y) => y.length > 3); return w.length && w.slice(0, 2).every((y) => up.includes(y)); });
    if (!inv) { const open = db.all('invoices', (i) => i.kind === kind && !i.iade && invStatus(i) !== 'odendi' && (!c || i.cari === c.id) && Math.abs(r2(invTotals(i).tl - paidOf(i)) - Math.abs(t.amount)) < 0.01); if (open.length === 1) { inv = open[0]; c = cari(inv.cari); } }
    return { inv: inv ? inv.id : '', cari: c && c.id ? c.id : '', how: inv && up.includes(NS.trLower(inv.no)) ? 'fatura no' : c && c.taxNo && up.includes(String(c.taxNo)) ? 'VKN' : inv ? 'tutar' : c ? 'ad' : '' };
  }
  // Carisiz hareketlerde açıklamadan kategori tahmini (kullanıcı değiştirebilir)
  const CATK = [[/ücret|ucret|masraf|komisyon|bsmv|kart aidat/, 'Banka masrafı'], [/vergi|gib|kdv|stopaj|muhtasar/, 'Vergi'], [/sgk|sigorta prim/, 'SGK'], [/maaş|maas|personel|ücret öd/, 'Personel maaş'], [/kira/, 'Kira'], [/elektrik|doğalgaz|dogalgaz|su |enerjisa|igdaş|aski/, 'Elektrik-su-doğalgaz'], [/akaryakıt|akaryakit|opet|shell|petrol|yakıt/, 'Yakıt'], [/faiz/, 'Faiz geliri']];
  const catGuess = (t, list) => { const d = NS.trLower(t.desc); const hit = CATK.find(([re, c]) => re.test(d) && list.includes(c)); return hit ? hit[1] : (list.includes(t.amount > 0 ? 'Diğer gelir' : 'Diğer') ? (t.amount > 0 ? 'Diğer gelir' : 'Diğer') : list[0]); };
  function bankReview(app, accId, txs, src) {
    const seen = new Set(db.all('txns').map((t) => t.bankRef).filter(Boolean));
    const rows = txs.filter((t) => !seen.has(t.id)).map((t) => ({ ...t, ...bankMatch(t) }));
    if (!rows.length) return toast(`Yeni banka hareketi yok${txs.length ? ' (' + txs.length + ' hareket zaten işlenmiş)' : ''}`, '');
    const cats = (sign) => (db.data.cats || {})[sign > 0 ? 'gelir' : 'gider'] || (sign > 0 ? ['Diğer gelir', 'Faiz geliri'] : ['Banka masrafı', 'Vergi', 'SGK', 'Kira', 'Personel maaş', 'Diğer']);
    modal({ title: `${acc(accId).name} — ${rows.length} yeni hareket${src ? ' · ' + src : ''}`, size: 'xl', body: `<p class="small muted mb">Öneriler fatura no, VKN, cari adı ve açık fatura tutarından çıkarıldı; kontrol edip değiştirebilirsiniz. Aynı hareket ikinci kez yüklenirse atlanır.</p>` + table({ rows: rows.map((t, i) => ({ ...t, i })), columns: [{ label: 'Tarih', render: (t) => NS.date(t.date) }, { label: 'Açıklama', render: (t) => `<span class="small">${esc(t.desc)}</span>` }, { label: 'Tutar', cls: 'right', render: (t) => `<b style="color:${t.amount > 0 ? 'var(--ok)' : 'var(--err)'}">${money(t.amount)}</b>` },
      { label: 'İşlem', render: (t) => `<select class="input" data-bm="${t.i}" style="width:250px"><option value="skip">— Atla —</option><optgroup label="${t.amount > 0 ? 'Gelir' : 'Gider'} (carisiz)">${cats(t.amount).map((c) => `<option value="cat:${esc(c)}" ${!t.cari && c === catGuess(t, cats(t.amount)) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</optgroup><optgroup label="${t.amount > 0 ? 'Tahsilat' : 'Ödeme'} (cari)">${db.all('caris').map((c) => `<option value="${c.id}" ${c.id === t.cari ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup></select>${t.inv ? `<div class="small mt-xs">${badge((db.get('invoices', t.inv) || {}).no, 'info')} <span class="faint">${esc(t.how)} ile eşleşti</span></div>` : t.cari ? `<div class="small faint mt-xs">${esc(t.how)} ile eşleşti</div>` : ''}` }] }),
      actions: [{ label: 'Vazgeç' }, { label: 'İşle', cls: 'primary', icon: 'check', onClick: (close, b) => {
        let n = 0, sk = 0;
        $$('[data-bm]', b).forEach((sel) => { const t = rows[Number(sel.dataset.bm)]; const v = sel.value; if (v === 'skip') { sk++; return; } const base = { date: t.date, account: accId, amount: Math.abs(t.amount), desc: t.desc, bankRef: t.id };
          if (v.startsWith('cat:')) db.insert('txns', { ...base, type: t.amount > 0 ? 'gelir' : 'gider', cat: v.slice(4) }, true);
          else { const inv = t.inv && (db.get('invoices', t.inv) || {}).cari === v ? t.inv : null; const type = t.amount > 0 ? 'tahsilat' : 'odeme'; const alloc = inv ? null : allocate(v, type, Math.abs(t.amount)); db.insert('txns', { ...base, type, cari: v, invoice: inv, ...(alloc && alloc.length ? { alloc } : {}) }, true); }
          n++; });
        db.saveSettings({ bankSince: today() }); db.log('Banka hareketleri işlendi', `${acc(accId).name} · ${n} işlendi, ${sk} atlandı${src ? ' · ' + src : ''}`); db.save(); close(); toast(`${n} banka hareketi işlendi${sk ? ', ' + sk + ' atlandı' : ''}`, 'ok'); app.refresh(); } }] });
  }
  function startReturn(app, src) {
    const lines = src.lines.map((l) => ({ ...JSON.parse(JSON.stringify(l)) }));
    docEditor(app, src.kind === 'satis' ? 'alis' : 'satis', null, { cari: src.cari, currency: src.currency || 'TRY', rate: src.rate || 1, depot: src.depot, lines, iade: { of: src.kind === 'alis' ? (src.supplierNo || src.no) : ((src.ebelge && src.ebelge.no) || src.no), date: src.date, src: src.id }, note: `${src.no} numaralı faturanın iadesi` });
  }
  const blankLine = () => ({ item: null, name: '', unit: 'adet', qty: 1, price: 0, vat: 20, disc: 0 });
  const rates = () => ({ TRY: 1, ...(S().rates || { USD: 49.65, EUR: 55.6, GBP: 66.5 }) });

  // ---------- Fatura / teklif / sipariş düzenleyici ----------
  function docEditor(app, kind, rec, preset) {
    const T = DOCT[kind]; const isQuote = kind === 'teklif';
    const doc = rec ? JSON.parse(JSON.stringify(rec)) : { kind, date: today(), due: today(), valid: iso(addDays(new Date(), 15)), delivery: iso(addDays(new Date(), 7)), currency: 'TRY', rate: 1, depot: (depots()[0] || {}).id, lines: [blankLine()], note: isQuote ? 'Fiyatlar 15 gün geçerlidir.' : kind === 'satis' ? S().invoiceNote || '' : '', ...(preset || {}) };
    // İade: alış iadesi (tedarikçiye kesilen, kind satis) / müşteri iadesi (müşteriden gelen, kind alis) — karşı taraf ters çevrilir
    const party = doc.iade ? (kind === 'satis' ? 'tedarikci' : 'musteri') : T.party;
    const caris = db.all('caris', (c) => c.type === 'ikisi' || c.type === party);
    const K = window.NB_KOD || { istisna: [], tevkifat: [] }; const open = new Set(doc.lines.map((l, i) => (l.exemptionCode || l.whtCode ? i : -1)).filter((i) => i >= 0));
    const d2key = isQuote ? 'valid' : T.col === 'orders' ? 'delivery' : 'due';
    const stockDoc = T.col !== 'quotes';
    modal({
      title: rec ? `${rec.no} düzenle` : doc.iade ? (kind === 'satis' ? 'Yeni alış iadesi faturası (tedarikçiye)' : 'Müşteri iadesi kaydı') : `Yeni ${T.title.toLocaleLowerCase('tr-TR')}`, size: 'xl',
      body: `${doc.iade ? `<div class="card pad mb" style="border-color:var(--warn)"><div class="row wrap" style="gap:12px"><b>${kind === 'satis' ? 'Tedarikçiye iade' : 'Müşteriden iade'}</b><div class="field" style="margin:0"><label>İade edilen fatura no${kind === 'satis' ? ' (tedarikçinin 16 haneli e-Fatura numarası)' : ''}</label><input class="input" id="dio" value="${esc(doc.iade.of || '')}" placeholder="ABC2026000000123"></div><div class="field" style="margin:0"><label>İade edilen fatura tarihi</label><input class="input" type="date" id="did" value="${esc(doc.iade.date || '')}"></div></div></div>` : ''}<div class="form-grid inv-head mb">
        <div class="field"><label>Cari *</label><div id="drisk" class="mt-xs" style="order:2"></div><select class="input" id="dc">${caris.map((c) => `<option value="${c.id}" ${c.id === doc.cari ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Tarih</label><input class="input" type="date" id="dd" value="${doc.date}"></div>
        <div class="field"><label>${T.date2}</label><input class="input" type="date" id="dv" value="${doc[d2key]}"></div>
        <div class="field"><label>Para birimi</label><select class="input" id="dcu">${Object.entries(CUR).map(([k, v]) => `<option value="${k}" ${k === doc.currency ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label>Kur</label><input class="input" type="number" step="0.0001" id="drt" value="${doc.rate || 1}" ${(doc.currency || 'TRY') === 'TRY' ? 'disabled' : ''}></div></div>
        ${kind === 'alis' && !doc.iade ? `<div class="row mb small"><label class="muted">Tedarikçinin fatura no</label><input class="input" id="dsn" style="max-width:220px" value="${esc(doc.supplierNo || '')}" placeholder="ABC2026000000123"><span class="faint">İade faturası keserken gerekir</span></div>` : ''}
        ${stockDoc ? `<div class="row mb small"><label class="muted">Depo</label><select class="input" id="ddp" style="max-width:220px">${depots().map((d) => `<option value="${d.id}" ${d.id === doc.depot ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>${doc.dispatches && doc.dispatches.length ? badge('İrsaliyeden oluşturuldu — stok irsaliyede işlendi', 'info') : kind === 'satis' || kind === 'alis' ? '<span class="faint">Stoklu kalemler bu depodan ' + (T.dir > 0 ? 'stoğa girer' : 'düşer') + '</span>' : ''}</div>` : ''}
        <div class="tbl-wrap"><table class="tbl inv-lines"><thead><tr><th style="min-width:220px">Ürün / hizmet</th><th>Miktar</th><th>Birim</th><th>Birim fiyat</th><th>İsk. %</th><th>KDV %</th><th class="right">Tutar</th><th></th></tr></thead><tbody id="ln"></tbody></table></div>
        <div class="row mt"><button class="btn sm" id="al">${icon('plus')} Satır ekle</button><select class="input" id="ai" style="max-width:300px;height:30px"><option value="">Stok kartından ekle...</option>${db.all('items').map((i) => `<option value="${i.id}">${esc(i.code ? i.code + ' · ' : '')}${esc(i.name)} — ${money(kind === 'alis' || kind === 'asip' ? i.buy || i.price : i.price)}${isStock(i) ? ` (stok ${num(stockOf(i.id))})` : ''}</option>`).join('')}</select><input class="input" id="bc" placeholder="Barkod okut + Enter" style="max-width:200px;height:30px"></div>
        <div class="grid g2 mt"><div class="field"><label>Not</label><textarea class="input" id="dn">${esc(doc.note || '')}</textarea></div><div class="card pad" id="tt"></div></div>`,
      onOpen: (b) => {
        const fill = (l, it) => { const buy = kind === 'alis' || kind === 'asip'; const lp = buy ? null : listPrice(cari($('#dc', b) ? $('#dc', b).value : doc.cari), it); const pr = buy ? it.buy || it.price : lp != null ? lp : it.price; Object.assign(l, { item: it.id, name: it.name, unit: it.unit, factor: 1, price: r2(pr / (Number(doc.rate) || 1)), vat: it.vat, priceList: lp != null ? true : undefined }); };
        const draw = () => {
          $('#ln', b).innerHTML = doc.lines.map((l, i) => { const it = l.item && db.get('items', l.item); const warn = it && isStock(it) && T.dir < 0 && stockOf(it.id, doc.depot) < l.qty * (Number(l.factor) || 1); const tags = [l.exemptionCode ? badge('İstisna ' + l.exemptionCode, 'info') : '', l.whtCode ? badge(`Tevkifat ${l.whtCode} · ${l.wht}/10`, 'warn') : '', Number(l.vat) === 0 && !l.exemptionCode ? `<span class="small" style="color:var(--err)">KDV %0: istisna kodu seçin</span>` : ''].filter(Boolean).join(' ');
            const main = `<tr><td data-l="Ürün / hizmet"><input class="input" data-k="${i}" data-f="name" value="${esc(l.name)}" list="itl">${warn ? `<div class="small" style="color:var(--warn)">Depoda ${num(stockOf(it.id, doc.depot))} ${esc(it.unit)} var</div>` : ''}${tags ? `<div class="mt-xs">${tags}</div>` : ''}</td><td data-l="Miktar"><input class="input" type="number" step="0.01" style="width:80px" data-k="${i}" data-f="qty" value="${l.qty}"></td><td data-l="Birim">${it && unitsOf(it).length > 1 ? `<select class="input" style="width:84px" data-uk="${i}">${unitsOf(it).map(([u, f]) => `<option value="${esc(u)}" data-f="${f}" ${u === l.unit ? 'selected' : ''}>${esc(u)}${f > 1 ? ' (' + f + ')' : ''}</option>`).join('')}</select>` : `<input class="input" style="width:70px" data-k="${i}" data-f="unit" value="${esc(l.unit)}">`}</td><td data-l="Birim fiyat"><input class="input" type="number" step="0.01" style="width:110px" data-k="${i}" data-f="price" value="${l.price}"></td><td data-l="İsk. %"><input class="input" type="number" style="width:64px" data-k="${i}" data-f="disc" value="${l.disc || 0}"></td><td data-l="KDV %"><select class="input" style="width:72px" data-k="${i}" data-f="vat">${[0, 1, 10, 20].map((v) => `<option ${Number(l.vat) === v ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td class="right" data-l="Tutar"><b>${cm(lineNet(l), doc.currency)}</b></td><td class="ln-act"><button class="btn sm ghost icon" data-op="${i}" title="İstisna / tevkifat">${icon('percent')}</button><button class="btn sm ghost icon" data-rm="${i}" title="Satırı sil">${icon('x')}</button></td></tr>`;
            // Ek vergi bilgisi: GİB kod listeleri (core/ebelge/kodlar.js)
            const ext = open.has(i) ? `<tr class="ln-x"><td colspan="8"><div class="row wrap" style="gap:12px"><div class="field" style="margin:0;min-width:260px;flex:1"><label>KDV istisna / muafiyet kodu ${Number(l.vat) === 0 ? '' : '(yalnızca KDV %0)'}</label><select class="input" data-xk="${i}" data-xf="exc" ${Number(l.vat) === 0 ? '' : 'disabled'}><option value="">— Yok —</option>${K.istisna.map(([c, n]) => `<option value="${c}" ${l.exemptionCode === c ? 'selected' : ''}>${c} · ${esc(n)}</option>`).join('')}</select></div><div class="field" style="margin:0;min-width:260px;flex:1"><label>KDV tevkifatı (alıcı KDV'nin bir kısmını vergi dairesine öder)</label><select class="input" data-xk="${i}" data-xf="wht" ${Number(l.vat) > 0 ? '' : 'disabled'}><option value="">— Yok —</option>${K.tevkifat.map(([c, n, r]) => `<option value="${c}" ${l.whtCode === c ? 'selected' : ''}>${c} · ${esc(n)} (${r}/10)</option>`).join('')}</select></div></div></td></tr>` : '';
            return main + ext; }).join('') + `<datalist id="itl">${db.all('items').map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist>`;
          tot();
        };
        const tot = () => { const t = invTotals(doc); const dm = (v) => cm(v, doc.currency); $('#tt', b).innerHTML = `<div class="row between small"><span>Ara toplam</span><span>${dm(t.gross)}</span></div>${t.disc ? `<div class="row between small" style="color:var(--ok)"><span>İskonto</span><span>-${dm(t.disc)}</span></div>` : ''}<div class="row between small"><span>Matrah</span><span>${dm(t.net)}</span></div>${Object.entries(t.vatBy).filter(([, v]) => v).map(([k, v]) => `<div class="row between small"><span>KDV %${k}</span><span>${dm(v)}</span></div>`).join('')}<hr style="margin:8px 0"><div class="row between"><b>GENEL TOPLAM</b><b style="font-size:22px">${dm(t.total)}</b></div>${t.wht ? `<div class="row between small" style="color:var(--warn)"><span>KDV tevkifatı (alıcı öder)</span><span>-${dm(t.wht)}</span></div><div class="row between"><b>ÖDENECEK</b><b>${dm(t.payable)}</b></div>` : ''}${t.cur !== 'TRY' ? `<div class="row between small muted"><span>TL karşılığı (kur ${num(doc.rate)})</span><span>${money(t.tl)}</span></div>` : ''}`; };
        on(b, 'input', '[data-k]', (e, x) => { const l = doc.lines[x.dataset.k]; const f = x.dataset.f; l[f] = ['qty', 'price', 'disc', 'vat'].includes(f) ? Number(x.value) || 0 : x.value; if (f === 'name') { const it = db.find('items', (i) => i.name === x.value); if (it) { fill(l, it); return draw(); } l.item = null; } const row = x.closest('tr'); row.cells[6].innerHTML = `<b>${cm(lineNet(l), doc.currency)}</b>`; tot(); });
        on(b, 'change', 'select[data-k]', (e, x) => { const l = doc.lines[x.dataset.k]; l.vat = Number(x.value); if (l.vat !== 0) { delete l.exemptionCode; delete l.exemptionReason; } else { delete l.whtCode; delete l.wht; delete l.whtName; } draw(); });
        on(b, 'change', '[data-uk]', (e, x) => { const l = doc.lines[x.dataset.uk]; const it = db.get('items', l.item); const f = Number(x.selectedOptions[0].dataset.f) || 1; const old = Number(l.factor) || 1; l.unit = x.value; l.factor = f; l.price = r2((Number(l.price) || 0) / old * f); draw(); });
        on(b, 'click', '[data-op]', (e, x) => { const i = Number(x.dataset.op); if (open.has(i)) open.delete(i); else open.add(i); draw(); });
        on(b, 'change', '[data-xk]', (e, x) => { const l = doc.lines[x.dataset.xk];
          if (x.dataset.xf === 'exc') { if (x.value) { l.exemptionCode = x.value; l.exemptionReason = (K.istisna.find((k) => k[0] === x.value) || [])[1] || ''; } else { delete l.exemptionCode; delete l.exemptionReason; } }
          else { const t = K.tevkifat.find((k) => k[0] === x.value); if (t) { l.whtCode = t[0]; l.whtName = t[1]; l.wht = t[2]; } else { delete l.whtCode; delete l.wht; delete l.whtName; } }
          draw(); });
        on(b, 'click', '[data-rm]', (e, x) => { doc.lines.splice(x.dataset.rm, 1); open.clear(); if (!doc.lines.length) doc.lines.push(blankLine()); draw(); });
        const addItem = (it) => { const ex = doc.lines.find((l) => l.item === it.id); if (ex) { ex.qty++; return draw(); } const empty = doc.lines.find((l) => !l.name); const l = empty || blankLine(); fill(l, it); if (!empty) doc.lines.push(l); draw(); };
        $('#al', b).onclick = () => { doc.lines.push(blankLine()); draw(); };
        $('#ai', b).onchange = (e) => { const it = db.get('items', e.target.value); if (it) addItem(it); e.target.value = ''; };
        $('#bc', b).onkeydown = (e) => { if (e.key !== 'Enter') return; const it = db.find('items', (i) => i.barcode && i.barcode === e.target.value.trim()); e.target.value = ''; if (!it) return toast('Barkod bulunamadı', 'err'); NS.beep(); addItem(it); };
        const riskInfo = () => { const c = cari($('#dc', b).value); const el2 = $('#drisk', b); if (!el2) return; const bal = c.id ? cariBalance(c.id) : 0; el2.innerHTML = c.id ? `${tagsOf(c).map((t) => badge(t, 'acc')).join(' ')} <span class="small muted">Bakiye: ${money(bal)}${Number(c.riskLimit) > 0 ? ` · Limit: ${money(c.riskLimit)}${bal > Number(c.riskLimit) ? ' · <b style="color:var(--err)">limit aşılmış</b>' : ''}` : ''}${c.priceList && priceLists().find((x) => x.id === c.priceList) ? ' · Fiyat listesi: ' + esc(priceLists().find((x) => x.id === c.priceList).name) : ''}</span>` : ''; };
        $('#dc', b).addEventListener('change', riskInfo); setTimeout(riskInfo, 0);
        $('#dc', b).onchange = () => { const c = cari($('#dc', b).value); if (d2key === 'due') $('#dv', b).value = iso(addDays($('#dd', b).value, c.term || 0)); if (c.currency && c.currency !== (doc.currency || 'TRY')) { $('#dcu', b).value = c.currency; $('#dcu', b).dispatchEvent(new Event('change')); } };
        $('#dcu', b).onchange = (e) => { const old = Number(doc.rate) || 1; doc.currency = e.target.value; doc.rate = rates()[doc.currency] || 1; $('#drt', b).value = doc.rate; $('#drt', b).disabled = doc.currency === 'TRY'; doc.lines.forEach((l) => { l.price = r2((l.price * old) / doc.rate); }); draw(); };
        $('#drt', b).oninput = (e) => { doc.rate = Number(e.target.value) || 1; tot(); };
        if ($('#ddp', b)) $('#ddp', b).onchange = (e) => { doc.depot = e.target.value; draw(); };
        if (!rec && !preset) $('#dc', b).dispatchEvent(new Event('change'));
        draw();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
          doc.cari = $('#dc', b).value; doc.date = $('#dd', b).value; if ($('#dsn', b)) doc.supplierNo = String($('#dsn', b).value || '').trim().toUpperCase(); doc.note = $('#dn', b).value; doc[d2key] = $('#dv', b).value;
          if (!doc.cari) return toast('Cari seçin', 'err');
          doc.lines = doc.lines.filter((l) => l.name && l.qty);
          if (!doc.lines.length) return toast('En az bir satır girin', 'err');
          if (doc.lines.some((l) => l.whtCode) && doc.lines.some((l) => l.exemptionCode && !['351', '555'].includes(l.exemptionCode))) return toast('Aynı faturada tevkifat ve istisna birlikte kullanılamaz; ayrı fatura kesin', 'err');
          if (kind === 'satis' && !doc.iade) { const ov = riskOver(cari(doc.cari), invTotals(doc).tl - (rec ? invTotals(rec).tl : 0)); if (ov > 0) { if (!app.can('muhasebe')) return toast(`Risk limiti ${money(ov)} aşılıyor; fatura için Muhasebe onayı gerekir`, 'err'); if (!window.confirm(`${cari(doc.cari).name} risk limitini ${money(ov)} aşıyor. Yine de kaydedilsin mi?`)) return; db.log('Risk limiti aşıldı (onaylandı)', `${cari(doc.cari).name} · ${money(ov)}`); } }
          if (doc.iade) { doc.iade = { ...doc.iade, of: String($('#dio', b).value || '').trim().toUpperCase(), date: $('#did', b).value }; if (!doc.iade.of) return toast('İade edilen faturanın numarasını girin', 'err'); }
          if (T.dir < 0 && !(doc.dispatches || []).length && !S().allowNegative) { const short = doc.lines.find((l) => { const it = l.item && db.get('items', l.item); return it && isStock(it) && stockOf(it.id, doc.depot) + (rec ? stockOfRef(rec.id, it.id) : 0) < l.qty * (Number(l.factor) || 1); }); if (short) return toast(`${short.name}: depoda yeterli stok yok (Ayarlar > eksi stoğa izin ver)`, 'err'); }
          let saved;
          if (rec) { db.update(T.col, rec.id, doc); saved = db.get(T.col, rec.id); }
          else { const px = doc.iade ? (kind === 'satis' ? 'AIF' : 'SIF') : T.prefix; doc.no = px + new Date().getFullYear() + String(db.nextNo(px)).padStart(6, '0'); if (isQuote) doc.status = 'taslak'; if (T.col === 'orders') doc.status = 'acik'; saved = db.insert(T.col, doc); db.log(doc.iade ? docLabel(doc) : T.title, `${doc.no} · ${cari(doc.cari).name} · ${money(invTotals(doc).tl)}`); if (NS.integ) NS.integ.emit(T.col === 'orders' ? 'siparis' : T.col === 'invoices' ? 'fatura' : 'teklif', { no: doc.no, kind, total: invTotals(doc).tl }); }
          if (T.col === 'invoices' && !(saved.dispatches || []).length) syncMoves('fatura', saved, T.dir);
          close(); toast('Kaydedildi', 'ok'); app.refresh();
          // Ayar açıksa yeni satış faturası kaydedilir kaydedilmez e-Fatura / e-Arşiv olarak kesilir
          if (!rec && kind === 'satis' && !saved.iade && S().autoEBelge && !saved.ebelge) sendEDoc(app, saved);
        },
      }],
    });
  }
  // Fatura / teklif / sipariş yazdırma: işletmenin "Belge şablonları" sayfasında tasarladığı şablonla (logo, renk, kağıt, bloklar)
  const docTitle = (doc, isQuote) => (isQuote ? 'Fiyat teklifi' : DOCT[doc.kind] ? DOCT[doc.kind].print : doc.kind === 'satis' ? 'Satış faturası' : 'Alış faturası');
  function docData(doc, isQuote) {
    const s = S(), c = cari(doc.cari), t = invTotals(doc); const dm = (v) => cm(v, doc.currency);
    return { money: dm, title: docTitle(doc, isQuote), no: doc.no, date: doc.date,
      info: [[isQuote ? 'Geçerlilik' : 'Vade', NS.date(isQuote ? doc.valid : doc.due)], ...(t.cur !== 'TRY' ? [['Kur (' + t.cur + ')', num(doc.rate)]] : []), ...(doc.ebelge ? [[doc.ebelge.type + ' no', doc.ebelge.no]] : [])],
      party: { title: doc.kind === 'alis' ? 'Tedarikçi' : 'Sayın', name: c.name, lines: [c.address, [c.district, c.city].filter(Boolean).join(' / '), [c.taxOffice ? 'VD: ' + c.taxOffice : '', c.taxNo ? (String(c.taxNo).length === 11 ? 'TCKN: ' : 'VKN: ') + c.taxNo : ''].filter(Boolean).join(' · ')] },
      lines: doc.lines.map((l) => ({ name: l.name, qty: num(l.qty), unit: l.unit, price: l.price, disc: l.disc, note: 'KDV %' + l.vat, total: lineNet(l) })),
      totals: [['Ara toplam', dm(t.gross)], ...(t.disc ? [['İskonto', '-' + dm(t.disc)]] : []), ['Matrah', dm(t.net)], ...Object.entries(t.vatBy).filter(([, v]) => v).map(([k, v]) => ['KDV %' + k, dm(v)]), ['GENEL TOPLAM', dm(t.total), true], ...(t.cur !== 'TRY' ? [['TL karşılığı', money(t.tl)]] : [])],
      note: [doc.note, s.iban ? 'IBAN: ' + s.iban : '', isQuote ? '' : 'Bu belge bilgi amaçlıdır; resmî fatura e-Fatura / e-Arşiv olarak düzenlenir.'].filter(Boolean).join('\n') };
  }
  if (NS.docs) {
    const smp = (kind) => () => { const d = db.find('invoices', (i) => i.kind === kind) || db.all('invoices')[0]; return d ? docData(d, false) : {}; };
    const inv = { terms: '', signLabels: 'Teslim eden|Teslim alan', hide: ['hasar', 'qr', 'imza', 'kosullar'], accent: '#0d9488' };
    NS.docs.define('muhasebe', 'fatura', { label: 'Fatura / sipariş', sample: smp('satis'), defaults: inv });
    NS.docs.define('muhasebe', 'proforma', { label: 'Proforma fatura', sample: () => { const q = db.all('quotes')[0] || db.all('orders')[0]; if (!q) return {}; const d = docData(q, true); d.title = 'Proforma fatura'; return d; }, defaults: { ...inv, terms: 'Bu belge proforma faturadır; resmî fatura yerine geçmez. Fiyatlar belirtilen geçerlilik tarihine kadar geçerlidir.', hide: ['hasar', 'qr', 'imza'] } });
    NS.docs.define('muhasebe', 'teklif', { label: 'Fiyat teklifi', sample: () => { const q = db.all('quotes')[0]; return q ? docData(q, true) : {}; }, defaults: { ...inv, terms: 'Teklifimiz belirtilen geçerlilik tarihine kadar geçerlidir.', hide: ['hasar', 'qr', 'imza'] } });
  }
  // Proforma fatura: teklif / siparişten, resmî fatura değildir (ön bilgi, avans talebi, gümrük vb. için)
  function printProforma(doc) {
    const d = docData(doc, true); d.title = 'Proforma fatura'; d.note = [doc.note, S().iban ? 'IBAN: ' + S().iban : '', 'Bu belge proforma faturadır; resmî fatura yerine geçmez.'].filter(Boolean).join('\n');
    if (NS.docs) return NS.docs.print('proforma', d); NS.printHtml(`<pre>${esc(JSON.stringify(d, null, 2))}</pre>`);
  }
  function printDoc(doc, isQuote) {
    if (NS.docs) return NS.docs.print(isQuote ? 'teklif' : 'fatura', docData(doc, isQuote));
    const s = S(), c = cari(doc.cari), t = invTotals(doc); const dm = (v) => cm(v, doc.currency);
    NS.printHtml(`<div class="doc"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div><div>${esc(s.bizPhone)} · VD: ${esc(s.taxOffice)} ${esc(s.taxNo)}</div></td><td style="text-align:right"><h2 style="margin:0">${isQuote ? 'FİYAT TEKLİFİ' : DOCT[doc.kind] ? DOCT[doc.kind].print : doc.kind === 'satis' ? 'SATIŞ FATURASI' : 'ALIŞ FATURASI'}</h2><div>No: <b>${esc(doc.no)}</b></div><div>Tarih: ${NS.date(doc.date)}</div><div>${isQuote ? 'Geçerlilik' : 'Vade'}: ${NS.date(isQuote ? doc.valid : doc.due)}</div></td></tr></table><hr>
      <div><b>${esc(c.name)}</b><br>${esc(c.address || '')}<br>VD: ${esc(c.taxOffice || '')} · VKN: ${esc(c.taxNo || '')}</div><br>
      <table><tr><th>#</th><th>Açıklama</th><th>Miktar</th><th style="text-align:right">Birim fiyat</th><th>İsk.</th><th>KDV</th><th style="text-align:right">Tutar</th></tr>${doc.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}</td><td>${num(l.qty)} ${esc(l.unit)}</td><td style="text-align:right">${dm(l.price)}</td><td>${l.disc ? '%' + l.disc : ''}</td><td>%${l.vat}</td><td style="text-align:right">${dm(lineNet(l))}</td></tr>`).join('')}</table>
      <table style="width:320px;margin-left:auto;margin-top:12px"><tr><td>Ara toplam</td><td style="text-align:right">${dm(t.gross)}</td></tr>${t.disc ? `<tr><td>İskonto</td><td style="text-align:right">-${dm(t.disc)}</td></tr>` : ''}<tr><td>Matrah</td><td style="text-align:right">${dm(t.net)}</td></tr>${Object.entries(t.vatBy).filter(([, v]) => v).map(([k, v]) => `<tr><td>KDV %${k}</td><td style="text-align:right">${dm(v)}</td></tr>`).join('')}<tr><td><b>GENEL TOPLAM</b></td><td style="text-align:right"><b>${dm(t.total)}</b></td></tr>${t.cur !== 'TRY' ? `<tr><td>Kur (${t.cur})</td><td style="text-align:right">${num(doc.rate)}</td></tr><tr><td>TL karşılığı</td><td style="text-align:right">${money(t.tl)}</td></tr>` : ''}</table>
      ${doc.ebelge ? `<p style="font-size:11px">${esc(doc.ebelge.type)} no: <b>${esc(doc.ebelge.no)}</b></p>` : ''}${doc.note ? `<p><i>${esc(doc.note)}</i></p>` : ''}<p style="font-size:11px">IBAN: ${esc(s.iban || '')}</p>${isQuote ? '' : '<p style="font-size:10px;color:#666">Bu belge bilgi amaçlıdır; e-Fatura/e-Arşiv entegrasyonu ile resmi fatura düzenlenir.</p>'}</div>`, { title: doc.no });
  }

  // ---------- Tahsilat / ödeme ----------
  async function payModal(app, { cariId, invoice, type }) {
    const c = cari(cariId);
    const def = invoice ? r2(invTotals(invoice).tl - paidOf(invoice)) : Math.abs(cariBalance(cariId));
    const v = await formModal({ title: `${type === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} — ${c.name}`, fields: [{ name: 'amount', label: 'Tutar (₺)', type: 'number', step: '0.01', value: def, required: true }, { name: 'account', label: type === 'tahsilat' ? 'Hangi hesaba' : 'Hangi hesaptan', type: 'select', options: db.all('accounts').map((a) => ({ value: a.id, label: `${a.name} (${money(accBalance(a.id))})` })) }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'desc', label: 'Açıklama', value: invoice ? `${invoice.no} ${type === 'tahsilat' ? 'tahsilatı' : 'ödemesi'}` : '' }, { name: 'print', label: `${type === 'tahsilat' ? 'Tahsilat' : 'Tediye'} makbuzu yazdır`, type: 'checkbox', full: true }, { name: 'notify', label: 'Cariye SMS ile bildir', type: 'checkbox', full: true }, ...(invoice ? [] : [{ name: 'dist', label: 'Açık faturalara dağıt (en eski vadeden başlayarak)', type: 'checkbox', full: true, value: true }])] });
    if (!v) return;
    const { print, notify, dist } = v; delete v.print; delete v.notify; delete v.dist;
    const alloc = !invoice && dist !== false ? allocate(cariId, type, Number(v.amount) || 0) : null;
    const t = db.insert('txns', { ...v, type, cari: cariId, invoice: invoice ? invoice.id : null, ...(alloc && alloc.length ? { alloc } : {}) });
    if (alloc && alloc.length) toast(`${alloc.length} faturaya dağıtıldı: ${alloc.map((a) => a.no).join(', ')}`, 'ok');
    if (print) printPayment(t);
    if (notify && c.phone) NS.smsLog(db, { to: c.phone, name: c.name, text: `Sayın ${c.name}, ${NS.date(v.date)} tarihinde ${money(v.amount)} ${type === 'tahsilat' ? 'ödemeniz alınmıştır' : 'ödeme yapılmıştır'}. Güncel bakiye: ${money(Math.abs(cariBalance(cariId)))}. ${S().bizName}` }, true);
    db.log(type === 'tahsilat' ? 'Tahsilat' : 'Ödeme', `${c.name} · ${money(v.amount)}`);
    toast('Kaydedildi', 'ok'); app.refresh();
  }

  // ---------- Sayfalar ----------
  function dashboard(el, p, app) {
    const caris = db.all('caris');
    const recv = sum(caris.map((c) => cariBalance(c.id)).filter((x) => x > 0)), pay = -sum(caris.map((c) => cariBalance(c.id)).filter((x) => x < 0));
    const mo = today().slice(0, 7);
    const sales = db.all('invoices', (i) => isSale(i) && i.date.slice(0, 7) === mo);
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return iso(d).slice(0, 7); });
    const inc = months.map((m) => sum(db.all('invoices', (i) => isSale(i) && i.date.slice(0, 7) === m), tlNet) - sum(db.all('invoices', (i) => i.iade && i.kind === 'alis' && i.date.slice(0, 7) === m), tlNet) + sum(db.all('txns', (t) => t.type === 'gelir' && t.date.slice(0, 7) === m), (t) => t.amount));
    const exp = months.map((m) => sum(db.all('invoices', (i) => isBuy(i) && i.date.slice(0, 7) === m), tlNet) - sum(db.all('invoices', (i) => i.iade && i.kind === 'satis' && i.date.slice(0, 7) === m), tlNet) + sum(db.all('txns', (t) => t.type === 'gider' && t.date.slice(0, 7) === m), (t) => t.amount));
    const overdue = db.all('invoices', (i) => isSale(i) && invStatus(i) === 'gecikti');
    const upcoming = db.all('invoices', (i) => isBuy(i) && ['acik', 'kismi'].includes(invStatus(i)) && i.due <= iso(addDays(new Date(), 15)));
    el.innerHTML = pageHead('Finansal Özet', NS.dateLong(new Date()), `<button class="btn" data-n="alis">${icon('plus')} Alış faturası</button><button class="btn primary" data-n="satis">${icon('plus')} Satış faturası</button>`) + `
      <div class="grid g4 mb">${db.all('accounts').map((a) => `<div class="acc-card" style="background:linear-gradient(135deg,${a.color},color-mix(in srgb,${a.color} 60%,#000))"><div class="small" style="opacity:.85">${icon(a.type === 'kasa' ? 'cash' : a.type === 'kart' ? 'card' : 'building')} ${esc(a.name)}</div><div class="v">${money(accBalance(a.id))}</div></div>`).join('')}</div>
      <div class="grid g4 mb">${kpi('Toplam alacak', money(recv), 'trend', 'ok')}${kpi('Toplam borç', money(pay), 'minus', 'err')}${kpi('Bu ay satış', money(sum(sales, (i) => invTotals(i).tl)), 'receipt', 'info', `<div class="small faint">${sales.length} fatura</div>`)}${kpi('Vadesi geçen alacak', money(sum(overdue, (i) => invTotals(i).tl - paidOf(i))), 'alert', 'warn', `<div class="small faint">${overdue.length} fatura</div>`)}</div>
      <div class="card mb"><div class="card-h"><h3>Gelir / gider (KDV hariç, 6 ay)</h3></div><div class="card-b">${chart.line([{ name: 'Gelir', values: inc, color: '#16a34a' }, { name: 'Gider', values: exp, color: '#dc2626' }], months.map((m) => NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3)), { format: money })}</div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Vadesi geçen alacaklar</h3></div>${table({ rows: overdue.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8), empty: 'Gecikmiş alacak yok', columns: [{ label: 'Cari', render: (i) => `<b>${esc(cari(i.cari).name)}</b><div class="small faint">${esc(i.no)}</div>` }, { label: 'Vade', render: (i) => `${NS.date(i.due)}<div class="small" style="color:var(--err)">${daysBetween(i.due, new Date())} gün</div>` }, { label: 'Kalan', cls: 'right', render: (i) => `<b>${money(invTotals(i).tl - paidOf(i))}</b>` }], actions: [{ label: 'Tahsil et', act: 'col' }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('clock')} 15 gün içinde ödenecekler</h3></div>${table({ rows: upcoming.sort((a, b) => a.due.localeCompare(b.due)), empty: 'Yaklaşan ödeme yok', columns: [{ label: 'Tedarikçi', render: (i) => `<b>${esc(cari(i.cari).name)}</b><div class="small faint">${esc(i.no)}</div>` }, { label: 'Vade', render: (i) => NS.date(i.due) }, { label: 'Tutar', cls: 'right', render: (i) => `<b>${money(invTotals(i).tl - paidOf(i))}</b>` }], actions: [{ label: 'Öde', act: 'pay' }] })}</div></div>`;
    on(el, 'click', '[data-n]', (e, b) => docEditor(app, b.dataset.n));
    on(el, 'click', '[data-act]', (e, b) => { const i = db.get('invoices', b.dataset.id); payModal(app, { cariId: i.cari, invoice: i, type: b.dataset.act === 'col' ? 'tahsilat' : 'odeme' }); });
  }
  function invoicesPage(el, kind, app) {
    kind = kind || 'satis';
    let q = '', f = '';
    el.innerHTML = pageHead('Faturalar', 'Satış ve alış faturaları, tahsilat durumu', `<div class="seg"><a class="btn sm ${kind === 'satis' ? 'primary' : 'ghost'}" href="#/faturalar/satis">Satış</a><a class="btn sm ${kind === 'alis' ? 'primary' : 'ghost'}" href="#/faturalar/alis">Alış</a><a class="btn sm ${kind === 'iade' ? 'primary' : 'ghost'}" href="#/faturalar/iade">İadeler</a></div><button class="btn" id="ex">${icon('download')}</button>${kind === 'iade' ? '' : `<button class="btn primary" id="nf">${icon('plus')} Yeni ${kind === 'satis' ? 'satış' : 'alış'} faturası</button>`}`) +
      `<div class="card"><div class="card-h">${NS.searchBox('q', 'Fatura no, cari...')}<div class="seg">${[['', 'Tümü'], ['acik', 'Açık'], ['gecikti', 'Vadesi geçen'], ['kismi', 'Kısmi'], ['odendi', 'Ödendi']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('invoices', (i) => (kind === 'iade' ? !!i.iade : i.kind === kind && !i.iade) && (!f || invStatus(i) === f) && NS.match(q, i.no, cari(i.cari).name)).sort((a, b) => b.date.localeCompare(a.date));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'file', columns: [{ label: 'No', render: (i) => `<b>${esc(i.no)}</b>${i.iade ? `<div class="small faint">${esc(docLabel(i))} · ${esc(i.iade.of)}</div>` : ''}` }, { label: 'Cari', render: (i) => esc(cari(i.cari).name) }, { label: 'Tarih', render: (i) => NS.date(i.date) }, { label: 'Vade', render: (i) => NS.date(i.due) }, { label: 'KDV', cls: 'right', render: (i) => money(invTotals(i).vat) }, { label: 'Toplam', cls: 'right', render: (i) => `<b>${money(invTotals(i).tl)}</b>${(i.currency || 'TRY') !== 'TRY' ? `<div class="small faint">${cm(invTotals(i).total, i.currency)}</div>` : ''}` }, { label: 'Kalan', cls: 'right', render: (i) => money(invTotals(i).tl - paidOf(i)) }, { label: 'Durum', render: (i) => badge(IST[invStatus(i)][0], IST[invStatus(i)][1]) + (i.ebelge ? ' ' + (i.ebelge.id && NS.ebelge && NS.ebelge.byId(i.ebelge.id) ? `<a href="#" data-ebv="${i.ebelge.id}" title="e-Belgeyi görüntüle">${NS.ebelge.statusBadge(i.ebelge.id)}</a>` : badge(i.ebelge.type, 'acc')) : '') + ((i.dispatches || []).length ? ' ' + badge('İrsaliyeli', 'info') : '') }], actions: [{ icon: 'cash', act: 'pay', title: kind === 'satis' ? 'Tahsil et' : 'Öde', show: (i) => invStatus(i) !== 'odendi' }, { icon: 'send', act: 'eb', title: 'e-Fatura / e-Arşiv gönder', show: (i) => i.kind === 'satis' && !i.ebelge }, { icon: 'back', act: 'ia', title: 'İade', show: (i) => !i.iade }, { icon: 'layers', act: 'cp', title: 'Benzerini oluştur (kopyala)', show: (i) => !i.iade }, { icon: 'refresh', act: 'rc', title: 'Tekrarlayan fatura yap', show: (i) => i.kind === 'satis' && !i.iade && !i.recurring }, { icon: 'mail', act: 'mail', title: 'E-posta gönder', show: (i) => i.kind === 'satis' }, { icon: 'phone', act: 'wa', title: 'WhatsApp', show: () => kind === 'satis' }, { icon: 'print', act: 'print' }, { icon: 'edit', act: 'edit' }, { icon: 'trash', act: 'del' }], foot: `${r.length} fatura · Toplam ${money(sum(r, (i) => invTotals(i).tl))} · Kalan ${money(sum(r, (i) => invTotals(i).tl - paidOf(i)))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    if ($('#nf', el)) $('#nf', el).onclick = () => docEditor(app, kind);
    $('#ex', el).onclick = () => NS.csv(`faturalar-${kind}`, rows(), [{ key: 'no', label: 'No' }, { label: 'Cari', value: (i) => cari(i.cari).name }, { key: 'date', label: 'Tarih' }, { key: 'due', label: 'Vade' }, { label: 'Matrah', value: (i) => invTotals(i).net }, { label: 'KDV', value: (i) => invTotals(i).vat }, { label: 'Toplam', value: (i) => invTotals(i).tl }, { label: 'Durum', value: (i) => IST[invStatus(i)][0] }]);
    on(el, 'click', '[data-ebv]', (e, b) => { e.preventDefault(); NS.ebelge.view(b.dataset.ebv); });
    // e-Belgesi kesilmiş fatura değiştirilemez / silinemez (yasal kayıt): önce e-Belgeler'den iptal edilmeli
    const locked = (i) => { const d = i.ebelge && i.ebelge.id && NS.ebelge ? NS.ebelge.byId(i.ebelge.id) : null; return d && d.dir === 'giden' && !['iptal', 'hata'].includes(d.status) ? d : null; };
    on(el, 'click', '[data-act]', async (e, b) => {
      const i = db.get('invoices', b.dataset.id);
      if (b.dataset.act === 'del' && !app.can('muhasebe')) return toast('Fatura silme yetkiniz yok (Muhasebe veya Yönetici)', 'err');
      if ((b.dataset.act === 'edit' || b.dataset.act === 'del') && locked(i)) { const d = locked(i); if (await confirm(`${i.no} için ${d.type} ${d.no} kesilmiş. Fatura değiştirilemez; e-Belgeyi iptal edip yeniden kesmeniz gerekir. e-Belgeler ekranına gidilsin mi?`, { ok: 'e-Belgelere git', danger: false, title: 'Kilitli fatura' })) app.go('ebelge', 'giden'); return; }
      if (b.dataset.act === 'print') { if (i.ebelge && i.ebelge.id && NS.ebelge && NS.ebelge.byId(i.ebelge.id)) NS.ebelge.view(i.ebelge.id); else printDoc(i); }
      else if (b.dataset.act === 'edit') docEditor(app, i.kind, i);
      else if (b.dataset.act === 'pay') payModal(app, { cariId: i.cari, invoice: i, type: i.kind === 'satis' ? 'tahsilat' : 'odeme' });
      else if (b.dataset.act === 'ia') startReturn(app, i);
      else if (b.dataset.act === 'cp') copyDoc(app, i);
      else if (b.dataset.act === 'rc') { if (!app.can('muhasebe')) return toast('Tekrarlayan fatura kurma yetkiniz yok', 'err'); window.MUHTEKRAR.create(app, i); }
      else if (b.dataset.act === 'eb') sendEDoc(app, i);
      else if (b.dataset.act === 'mail') { const c = cari(i.cari); if (!c.email) return toast('Carinin e-posta adresi yok', 'err'); NS.integ.email(c.email, `${S().bizName} — ${i.no}`, `Sayın ${c.name},\n\n${i.no} numaralı ${NS.date(i.date)} tarihli faturanız: ${cm(invTotals(i).total, i.currency)}\nVade: ${NS.date(i.due)}\nIBAN: ${S().iban || ''}\n\nİyi çalışmalar.`); }
      else if (b.dataset.act === 'wa') { const c = cari(i.cari); NS.integ.whatsapp(c.phone, `Sayın ${c.name}, ${i.no} numaralı faturanız ${cm(invTotals(i).total, i.currency)} tutarındadır. Kalan: ${money(invTotals(i).tl - paidOf(i))}, vade ${NS.date(i.due)}. ${S().bizName}`); }
      else if (await confirm(`${i.no} silinsin mi? Bağlı tahsilat/ödemeler cari hesaba aktarılır, stok hareketleri geri alınır.`)) { db.all('txns', (t) => t.invoice === i.id).forEach((t) => { t.invoice = null; }); db.all('dispatches', (d) => d.invoice === i.id).forEach((d) => { d.invoice = null; }); db.all('orders', (o) => o.invoice === i.id).forEach((o) => { o.invoice = null; }); db.data.moves = db.all('moves', (m) => m.ref !== i.id); db.remove('invoices', i.id); draw(); }
    });
    draw();
  }
  function quotesPage(el, p, app) {
    const QS = { taslak: ['Taslak', ''], gonderildi: ['Gönderildi', 'info'], kabul: ['Kabul edildi', 'ok'], red: ['Reddedildi', 'err'], faturalandi: ['Faturalandı', 'acc'] };
    el.innerHTML = pageHead('Teklifler', 'Fiyat teklifi hazırlayın, kabul edilince tek tıkla faturaya çevirin', `<button class="btn primary" id="nq">${icon('plus')} Yeni teklif</button>`) + `<div class="card" id="t"></div>`;
    $('#t', el).innerHTML = table({ rows: db.all('quotes').sort((a, b) => b.date.localeCompare(a.date)), emptyIcon: 'file', empty: 'Teklif yok', columns: [{ label: 'No', render: (q) => `<b>${esc(q.no)}</b>` }, { label: 'Cari', render: (q) => esc(cari(q.cari).name) }, { label: 'Tarih', render: (q) => NS.date(q.date) }, { label: 'Geçerlilik', render: (q) => (q.valid < today() && !['kabul', 'faturalandi'].includes(q.status) ? badge('Süresi doldu', 'err') : NS.date(q.valid)) }, { label: 'Tutar', cls: 'right', render: (q) => `<b>${money(invTotals(q).tl)}</b>` }, { label: 'Durum', render: (q) => `<select class="input" style="height:30px" data-qs="${q.id}">${Object.entries(QS).map(([k, v]) => `<option value="${k}" ${k === q.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>` }], actions: [{ label: 'Siparişe çevir', act: 'ord', show: (q) => !['faturalandi', 'kabul', 'red'].includes(q.status) }, { label: 'Faturaya çevir', act: 'conv', show: (q) => q.status !== 'faturalandi' }, { icon: 'file', act: 'pf', title: 'Proforma fatura' }, { icon: 'print', act: 'print' }, { icon: 'edit', act: 'edit' }, { icon: 'trash', act: 'del' }] });
    $('#nq', el).onclick = () => docEditor(app, 'teklif');
    on(el, 'change', '[data-qs]', (e, s) => { db.update('quotes', s.dataset.qs, { status: s.value }); toast('Güncellendi', 'ok'); });
    on(el, 'click', '[data-act]', async (e, b) => {
      const q = db.get('quotes', b.dataset.id);
      if (b.dataset.act === 'print') printDoc(q, true);
      else if (b.dataset.act === 'edit') docEditor(app, 'teklif', q);
      else if (b.dataset.act === 'pf') printProforma(q);
      else if (b.dataset.act === 'conv') { const c = cari(q.cari); const inv = db.insert('invoices', { kind: 'satis', cari: q.cari, date: today(), due: iso(addDays(new Date(), c.term || 0)), currency: q.currency || 'TRY', rate: q.rate || 1, depot: depots()[0].id, lines: JSON.parse(JSON.stringify(q.lines)), note: '', no: 'SF' + new Date().getFullYear() + String(db.nextNo('SF')).padStart(6, '0'), quote: q.id }); syncMoves('fatura', inv, -1); q.status = 'faturalandi'; db.save(); toast(`${inv.no} oluşturuldu`, 'ok'); app.go('faturalar', 'satis'); }
      else if (b.dataset.act === 'ord') { const o = db.insert('orders', { kind: 'ssip', cari: q.cari, date: today(), delivery: iso(addDays(new Date(), 7)), currency: q.currency || 'TRY', rate: q.rate || 1, depot: depots()[0].id, lines: JSON.parse(JSON.stringify(q.lines)), note: `Teklif ${q.no}`, status: 'acik', quote: q.id, no: 'SS' + new Date().getFullYear() + String(db.nextNo('SS')).padStart(6, '0') }); q.status = 'kabul'; db.save(); toast(`${o.no} satış siparişi oluşturuldu`, 'ok'); app.go('siparisler', 'ssip'); }
      else if (await confirm('Teklif silinsin mi?')) { db.remove('quotes', q.id); app.refresh(); }
    });
  }
  function carisPage(el, id, app) {
    if (id) return cariDetail(el, id, app);
    NS.crud(el, app, {
      col: 'caris', title: 'Cari Hesaplar', sub: 'Müşteri ve tedarikçi bakiyeleri', single: 'Cari', addLabel: 'Yeni cari', emptyIcon: 'building',
      fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'musteri', label: 'Müşteri' }, { value: 'tedarikci', label: 'Tedarikçi' }, { value: 'ikisi', label: 'Müşteri + Tedarikçi' }] }, { name: 'term', label: 'Vade (gün)', type: 'number', value: 30 }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'address', label: 'Adres (cadde, sokak, no)', full: true }, { name: 'district', label: 'İlçe' }, { name: 'city', label: 'İl' }, { type: 'section', label: 'Satış koşulları' }, { name: 'tags', label: 'Etiketler (virgülle: bayi, İstanbul, VIP)', full: true }, { name: 'riskLimit', label: 'Risk (borç) limiti ₺', type: 'number', placeholder: 'Boş = limitsiz' }, { name: 'priceList', label: 'Fiyat listesi', type: 'select', options: [{ value: '', label: 'Standart satış fiyatı' }, ...priceLists().map((p) => ({ value: p.id, label: p.name }))] }],
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (c) => [c.name, c.taxNo, c.phone, c.tags],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'm', label: 'Müşteriler', test: (c) => c.type !== 'tedarikci' }, { value: 't', label: 'Tedarikçiler', test: (c) => c.type !== 'musteri' }, { value: 'b', label: 'Bakiyesi olan', test: (c) => Math.abs(cariBalance(c.id)) > 0.01 }, { value: 'e', label: 'e-Belge bilgisi eksik', test: (c) => !!eMissing(c) }, { value: 'r', label: 'Limit aşan', test: (c) => riskOver(c) > 0 }, ...[...new Set(db.all('caris').flatMap(tagsOf))].sort((a, b) => a.localeCompare(b, 'tr')).map((t) => ({ value: 'tag:' + t, label: '#' + t, test: (c) => tagsOf(c).includes(t) }))],
      columns: [{ key: 'name', label: 'Cari', render: (c) => `<a href="#/cariler/${c.id}" style="color:inherit"><b>${esc(c.name)}</b></a><div class="small faint">${esc(c.taxNo || '')}</div>${tagsOf(c).length ? `<div class="mt-xs">${tagsOf(c).map((t) => badge(t, 'acc')).join(' ')}</div>` : ''}${eMissing(c) ? `<div class="small" style="color:var(--warn)">${esc(eMissing(c))}</div>` : ''}${riskOver(c) > 0 ? `<div class="small" style="color:var(--err)">Risk limiti ${money(riskOver(c))} aşıldı</div>` : ''}` }, { label: 'Tür', render: (c) => badge({ musteri: 'Müşteri', tedarikci: 'Tedarikçi', ikisi: 'Her ikisi' }[c.type], c.type === 'musteri' ? 'ok' : 'info') }, { key: 'term', label: 'Vade', render: (c) => (c.term || 0) + ' gün' }, { label: 'Bakiye', cls: 'right', render: (c) => { const b = cariBalance(c.id); return b > 0.01 ? `<b style="color:var(--ok)">${money(b)} (A)</b>` : b < -0.01 ? `<b style="color:var(--err)">${money(-b)} (B)</b>` : '<span class="faint">0</span>'; } }],
      extraActions: [{ icon: 'file', act: 'ext', title: 'Ekstre' }], onAction: (a, c) => app.go('cariler', c.id),
    });
    // e-Fatura / e-Arşiv için eksik bilgi uyarısı ve toplu tamamlama (GİB UBL-TR: adreste ilçe ve il zorunlu)
    { const r = el.querySelector('.page-h .row'); if (r && app.can('muhasebe')) { r.insertAdjacentHTML('afterbegin', `<button class="btn" id="imp">${icon('upload')} İçe aktar</button>`); $('#imp', el).onclick = () => window.MUHAKTAR.open(app, 'cari'); } }
    const miss = db.all('caris', (c) => eMissing(c));
    if (miss.length) {
      const h = el.querySelector('.page-h') || el.firstElementChild;
      h.insertAdjacentHTML('afterend', `<div class="card pad mb row between wrap" style="border-color:var(--warn)"><span>${icon('alert')} <b>${miss.length} carinin</b> e-Fatura / e-Arşiv için bilgisi eksik (VKN/TCKN, ilçe veya il). Eksikse fatura gönderilirken hata alırsınız.</span><button class="btn sm primary" id="emf">Toplu tamamla</button></div>`);
      $('#emf', el).onclick = () => fillMissing(app, miss);
    }
  }
  const eMissing = (c) => { const m = []; const t = String(c.taxNo || '').replace(/\D/g, ''); if (t.length !== 10 && t.length !== 11) m.push('VKN/TCKN'); if (!String(c.district || '').trim()) m.push('ilçe'); if (!String(c.city || '').trim()) m.push('il'); return m.length ? 'Eksik: ' + m.join(', ') : ''; };
  function fillMissing(app, list) {
    modal({ title: 'e-Belge bilgilerini tamamla', size: 'xl', body: `<p class="small muted mb">Yalnızca boş alanları doldurun; dolu alanlar değişmez. VKN 10, TCKN 11 hanedir.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cari</th><th>VKN / TCKN</th><th>İlçe</th><th>İl</th></tr></thead><tbody>${list.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td><input class="input" data-c="${c.id}" data-f="taxNo" value="${esc(c.taxNo || '')}" inputmode="numeric"></td><td><input class="input" data-c="${c.id}" data-f="district" value="${esc(c.district || '')}"></td><td><input class="input" data-c="${c.id}" data-f="city" value="${esc(c.city || '')}"></td></tr>`).join('')}</tbody></table></div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
        const bad = [...b.querySelectorAll('[data-f="taxNo"]')].find((x) => x.value.trim() && ![10, 11].includes(x.value.replace(/\D/g, '').length)); if (bad) { bad.focus(); return toast('VKN 10, TCKN 11 haneli olmalı', 'err'); }
        let n = 0; b.querySelectorAll('[data-c]').forEach((x) => { const c = db.get('caris', x.dataset.c); const v = x.dataset.f === 'taxNo' ? x.value.replace(/\D/g, '') : x.value.trim(); if (v && v !== (c[x.dataset.f] || '')) { c[x.dataset.f] = v; n++; } });
        db.save(); db.log('Cari e-Belge bilgileri tamamlandı', `${n} alan`); close(); toast(`${n} alan güncellendi`, 'ok'); app.refresh(); } }] });
  }
  function cariDetail(el, id, app) {
    const c = cari(id);
    const op = Number(c.opening) || 0;
    const mv = [...(op ? [{ id: 'acilis', date: String(c.created || '').slice(0, 10) || '0000-00-00', desc: 'Açılış bakiyesi (devir)', debit: op > 0 ? op : 0, credit: op < 0 ? -op : 0 }] : []), ...db.all('invoices', (i) => i.cari === id).map((i) => ({ id: i.id, date: i.date, desc: `${docLabel(i)} ${i.no}`, debit: i.kind === 'satis' ? invTotals(i).tl : 0, credit: i.kind === 'alis' ? invTotals(i).tl : 0 })), ...db.all('txns', (t) => t.cari === id).map((t) => ({ id: t.id, date: t.date, desc: `${t.type === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} · ${acc(t.account).name}${t.desc ? ' · ' + t.desc : ''}`, debit: t.type === 'odeme' ? t.amount : 0, credit: t.type === 'tahsilat' ? t.amount : 0 }))].sort((a, b) => a.date.localeCompare(b.date));
    let run = 0; mv.forEach((m) => { run = r2(run + m.debit - m.credit); m.bal = run; });
    const bal = cariBalance(id);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/cariler">${icon('back')} Cariler</a><h1 class="grow">${esc(c.name)}</h1><button class="btn" id="pr">${icon('print')} Ekstre yazdır</button><button class="btn ok" data-t="tahsilat">${icon('plus')} Tahsilat</button><button class="btn" data-t="odeme">${icon('minus')} Ödeme</button></div>
      <div class="grid g4 mb">${kpi('Bakiye', `${money(Math.abs(bal))} ${bal > 0 ? '(Alacak)' : bal < 0 ? '(Borç)' : ''}`, 'wallet', bal > 0 ? 'ok' : bal < 0 ? 'err' : '')}${kpi('Toplam satış', money(sum(mv, (m) => (m.desc.startsWith('Satış') ? m.debit : 0))), 'trend', 'info')}${kpi('Fatura sayısı', db.all('invoices', (i) => i.cari === id).length, 'file')}${kpi('Vade', (c.term || 0) + ' gün', 'clock', 'warn')}</div>
      <div class="card">${table({ rows: mv.slice().reverse(), empty: 'Hareket yok', columns: [{ label: 'Tarih', render: (m) => NS.date(m.date) }, { label: 'Açıklama', key: 'desc' }, { label: 'Borç', cls: 'right', render: (m) => (m.debit ? money(m.debit) : '') }, { label: 'Alacak', cls: 'right', render: (m) => (m.credit ? money(m.credit) : '') }, { label: 'Bakiye', cls: 'right', render: (m) => `<b>${money(m.bal)}</b>` }] })}</div>`;
    on(el, 'click', '[data-t]', (e, b) => payModal(app, { cariId: id, type: b.dataset.t }));
    $('#pr', el).onclick = () => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>CARİ HESAP EKSTRESİ — ${esc(c.name)}</h3><div>${NS.date(new Date())}</div><table><tr><th>Tarih</th><th>Açıklama</th><th style="text-align:right">Borç</th><th style="text-align:right">Alacak</th><th style="text-align:right">Bakiye</th></tr>${mv.map((m) => `<tr><td>${NS.date(m.date)}</td><td>${esc(m.desc)}</td><td style="text-align:right">${m.debit ? money(m.debit) : ''}</td><td style="text-align:right">${m.credit ? money(m.credit) : ''}</td><td style="text-align:right">${money(m.bal)}</td></tr>`).join('')}</table><p><b>Son bakiye: ${money(bal)}</b></p></div>`, { title: 'Ekstre' });
  }
  function accountsPage(el, p, app) {
    let accF = '';
    el.innerHTML = pageHead('Kasa & Banka', 'Hesap bakiyeleri, gelir-gider ve virman', `<button class="btn" data-k="gelir">${icon('plus')} Gelir</button><button class="btn" data-k="gider">${icon('minus')} Gider</button><button class="btn" data-k="virman">${icon('refresh')} Virman</button><button class="btn" id="bxl">${icon('upload')} Ekstre yükle</button>${NS.integ && NS.integ.isOn('banka') ? `<button class="btn" id="bnk">${icon('building')} Banka hareketlerini çek</button>` : ''}<button class="btn primary" data-k="hesap">${icon('plus')} Hesap ekle</button>`) +
      `<div class="grid g4 mb">${db.all('accounts').map((a) => `<div class="acc-card" style="background:linear-gradient(135deg,${a.color},color-mix(in srgb,${a.color} 60%,#000));cursor:pointer" data-a="${a.id}"><div class="small" style="opacity:.85">${esc(a.name)}</div><div class="v">${money(accBalance(a.id))}</div><div class="small mono" style="opacity:.75">${esc(a.iban || a.type)}</div></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3 id="ah">Tüm hareketler</h3></div><div id="t"></div></div>`;
    const TY = { tahsilat: ['Tahsilat', 'ok'], odeme: ['Ödeme', 'err'], gelir: ['Gelir', 'ok'], gider: ['Gider', 'err'], virman: ['Virman', 'info'] };
    const draw = () => {
      const rows = db.all('txns', (t) => !accF || t.account === accF || t.account2 === accF).sort((a, b) => b.date.localeCompare(a.date));
      $('#ah', el).textContent = accF ? acc(accF).name + ' hareketleri' : 'Tüm hareketler';
      $('#t', el).innerHTML = table({ rows: rows.slice(0, 300), columns: [{ label: 'Tarih', render: (t) => NS.date(t.date) }, { label: 'Tür', render: (t) => badge(TY[t.type][0], TY[t.type][1]) }, { label: 'Hesap', render: (t) => esc(acc(t.account).name) + (t.type === 'virman' ? ` → ${esc(acc(t.account2).name)}` : '') }, { label: 'Cari / kategori', render: (t) => esc(t.cari ? cari(t.cari).name : t.cat || '-') }, { label: 'Açıklama', render: (t) => `<span class="small">${esc(t.desc || '')}</span>` }, { label: 'Tutar', cls: 'right', render: (t) => `<b style="color:${['tahsilat', 'gelir'].includes(t.type) ? 'var(--ok)' : t.type === 'virman' ? 'inherit' : 'var(--err)'}">${['tahsilat', 'gelir'].includes(t.type) ? '+' : t.type === 'virman' ? '' : '-'}${money(t.amount)}</b>` }], actions: [{ icon: 'trash', act: 'del' }] });
    };
    on(el, 'click', '[data-a]', (e, b) => { accF = accF === b.dataset.a ? '' : b.dataset.a; draw(); });
    // Açık bankacılık: hareketler çekilir, açıklamadaki cari ünvanı / fatura no ile eşleştirilir
    $('#bxl', el).onclick = async () => {
      const banks = db.all('accounts', (a) => a.type === 'banka'); if (!banks.length) return toast('Önce bir banka hesabı ekleyin', 'err');
      const accId = accF && acc(accF).type === 'banka' ? accF : await (async () => { if (banks.length === 1) return banks[0].id; const v = await formModal({ title: 'Ekstre hangi hesaba ait?', fields: [{ name: 'a', label: 'Banka hesabı', type: 'select', options: banks.map((x) => ({ value: x.id, label: x.name })) }] }); return v && v.a; })(); if (!accId) return;
      let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return;
      const txs = parseStatement(f.rows); if (!txs.length) return toast('Dosyada tarih ve tutar sütunu bulunamadı (Tarih, Açıklama, Tutar veya Borç / Alacak)', 'err');
      bankReview(app, accId, txs, f.name);
    };
    if ($('#bnk', el)) $('#bnk', el).onclick = async () => {
      if (!NS.integ) return; const banks = db.all('accounts', (a) => a.type === 'banka'); if (!banks.length) return toast('Banka hesabı yok', 'err');
      const accId = accF && acc(accF).type === 'banka' ? accF : banks[0].id;
      const r = await NS.integ.call('banka', 'hareketler', { iban: acc(accId).iban, since: S().bankSince || iso(addDays(new Date(), -7)) }); if (!r || !r.ok) return;
      let txs = r.data && Array.isArray(r.data.transactions) ? r.data.transactions : [];
      if (r.simulated) { const open = db.all('invoices', (i) => ['acik', 'gecikti', 'kismi'].includes(invStatus(i))).slice(0, 3); txs = [...open.map((i, k) => ({ id: 'B' + Date.now() + k, date: today(), amount: (i.kind === 'satis' ? 1 : -1) * r2(invTotals(i).tl - paidOf(i)), desc: `${cari(i.cari).name.toLocaleUpperCase('tr-TR')} ${i.no}` })), { id: 'B' + Date.now() + 9, date: today(), amount: -385.5, desc: 'HESAP İŞLETİM ÜCRETİ' }]; }
      bankReview(app, accId, txs);
    };
    on(el, 'click', '[data-act=del]', async (e, b) => { if (await confirm('Hareket silinsin mi?')) { db.remove('txns', b.dataset.id); app.refresh(); } });
    on(el, 'click', '[data-k]', async (e, b) => {
      const k = b.dataset.k; const accs = db.all('accounts').map((a) => ({ value: a.id, label: a.name }));
      if (k === 'hesap') { const v = await formModal({ title: 'Yeni hesap', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'kasa', label: 'Kasa' }, { value: 'banka', label: 'Banka' }, { value: 'kart', label: 'Kredi kartı' }] }, { name: 'iban', label: 'IBAN' }, { name: 'opening', label: 'Açılış bakiyesi', type: 'number', value: 0 }, { name: 'color', label: 'Renk', type: 'color', value: '#475569' }] }); if (v) { db.insert('accounts', v); app.refresh(); } return; }
      const fields = k === 'virman' ? [{ name: 'account', label: 'Kaynak hesap', type: 'select', options: accs }, { name: 'account2', label: 'Hedef hesap', type: 'select', options: accs }] : [{ name: 'account', label: 'Hesap', type: 'select', options: accs }, { name: 'cat', label: 'Kategori', type: 'select', options: db.data.cats[k] }];
      const v = await formModal({ title: { gelir: 'Gelir kaydı', gider: 'Gider kaydı', virman: 'Hesaplar arası virman' }[k], fields: [...fields, { name: 'amount', label: 'Tutar', type: 'number', step: '0.01', required: true }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'desc', label: 'Açıklama' }] });
      if (!v) return; if (k === 'virman' && v.account === v.account2) return toast('Farklı hesap seçin', 'err');
      db.insert('txns', { ...v, type: k }); toast('Kaydedildi', 'ok'); app.refresh();
    });
    draw();
  }
  function chequesPage(el, p, app) {
    const CS = { portfoy: ['Portföyde', 'info'], tahsil: ['Tahsil edildi', 'ok'], ciro: ['Ciro edildi', 'acc'], odendi: ['Ödendi', 'ok'], karsiliksiz: ['Karşılıksız', 'err'] };
    NS.crud(el, app, {
      col: 'cheques', title: 'Çek & Senet', sub: 'Alınan ve verilen çek/senetlerin vade takibi', single: 'Çek/Senet', addLabel: 'Yeni çek/senet', emptyIcon: 'file',
      fields: [{ name: 'dir', label: 'Yön', type: 'select', options: [{ value: 'alinan', label: 'Alınan (müşteriden)' }, { value: 'verilen', label: 'Verilen (tedarikçiye)' }] }, { name: 'kind', label: 'Tür', type: 'select', options: [{ value: 'cek', label: 'Çek' }, { value: 'senet', label: 'Senet' }] }, { name: 'no', label: 'Seri no', required: true }, { name: 'bank', label: 'Banka' }, { name: 'cari', label: 'Cari', type: 'select', options: () => db.all('caris').map((c) => ({ value: c.id, label: c.name })) }, { name: 'due', label: 'Vade', type: 'date', required: true }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(CS).map(([value, v]) => ({ value, label: v[0] })) }],
      defaults: { status: 'portfoy', dir: 'alinan', kind: 'cek' }, sort: (a, b) => a.due.localeCompare(b.due),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'p', label: 'Portföyde', test: (x) => x.status === 'portfoy' }, { value: 'a', label: 'Alınan', test: (x) => x.dir === 'alinan' }, { value: 'v', label: 'Verilen', test: (x) => x.dir === 'verilen' }],
      columns: [{ key: 'no', label: 'No', render: (x) => `<b>${esc(x.no)}</b><div class="small faint">${x.kind === 'cek' ? 'Çek' : 'Senet'} · ${esc(x.bank || '')}</div>` }, { key: 'dir', label: 'Yön', render: (x) => badge(x.dir === 'alinan' ? 'Alınan' : 'Verilen', x.dir === 'alinan' ? 'ok' : 'warn') }, { label: 'Cari', render: (x) => esc(cari(x.cari).name) }, { key: 'due', label: 'Vade', render: (x) => `${NS.date(x.due)}${x.status === 'portfoy' ? `<div class="small" style="color:${x.due < today() ? 'var(--err)' : 'var(--text-3)'}">${x.due < today() ? daysBetween(x.due, new Date()) + ' gün geçti' : daysBetween(new Date(), x.due) + ' gün kaldı'}</div>` : ''}` }, { key: 'amount', label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b>` }, { key: 'status', label: 'Durum', render: (x) => badge(CS[x.status][0], CS[x.status][1]) }],
    });
  }
  // Dönem: hazır aralıklar veya serbest tarih aralığı (seçim bu cihazda hatırlanır)
  const PERIODS = () => { const d = new Date(); const y = d.getFullYear(), mo = d.getMonth(); const f = (a, b) => [iso(a), iso(b)]; const q = Math.floor(mo / 3) * 3;
    return { ay: ['Bu ay', ...f(new Date(y, mo, 1), new Date(y, mo + 1, 0))], gay: ['Geçen ay', ...f(new Date(y, mo - 1, 1), new Date(y, mo, 0))], ceyrek: ['Bu çeyrek', ...f(new Date(y, q, 1), new Date(y, q + 3, 0))], yil: ['Bu yıl', ...f(new Date(y, 0, 1), new Date(y, 11, 31))], gyil: ['Geçen yıl', ...f(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31))] }; };
  const tlNet = (i) => r2(invTotals(i).net * (Number(i.rate) || 1)), tlVat = (i) => r2(invTotals(i).vat * (Number(i.rate) || 1)); // dövizli belgeler TL'ye çevrilir
  function reportsPage(el) {
    let per = 'yil', from, to; [from, to] = PERIODS()[per].slice(1);
    const draw = () => {
      const inR = (x) => x.date >= from && x.date <= to;
      const months = []; { const d = new Date(from.slice(0, 7) + '-01'); const end = to.slice(0, 7); while (iso(d).slice(0, 7) <= end && months.length < 60) { months.push(iso(d).slice(0, 7)); d.setMonth(d.getMonth() + 1); } }
      const rows = months.map((m) => {
        const inM = (x) => x.date.slice(0, 7) === m && inR(x);
        const s = db.all('invoices', (i) => isSale(i) && inM(i)), a = db.all('invoices', (i) => isBuy(i) && inM(i));
        const si = db.all('invoices', (i) => i.iade && i.kind === 'alis' && inM(i)), ai = db.all('invoices', (i) => i.iade && i.kind === 'satis' && inM(i));
        const inc = sum(s, tlNet) - sum(si, tlNet) + sum(db.all('txns', (t) => t.type === 'gelir' && inM(t)), (t) => t.amount);
        const exp = sum(a, tlNet) - sum(ai, tlNet) + sum(db.all('txns', (t) => t.type === 'gider' && inM(t)), (t) => t.amount);
        return { id: m, m, inc, exp, vOut: sum(s, tlVat) + sum(ai, tlVat), vIn: sum(a, tlVat) + sum(si, tlVat) };
      });
      const aging = [[0, 30], [31, 60], [61, 90], [91, 9999]].map(([a, b]) => ({ label: b > 999 ? '90+ gün' : `${a}-${b} gün`, value: sum(db.all('invoices', (i) => isSale(i) && invStatus(i) !== 'odendi' && i.due < today() && daysBetween(i.due, new Date()) >= a && daysBetween(i.due, new Date()) <= b), (i) => invTotals(i).tl - paidOf(i)) }));
      const giderCat = NS.groupBy(db.all('txns', (t) => t.type === 'gider' && inR(t)), (t) => t.cat || 'Diğer');
      el.innerHTML = pageHead('Raporlar', `Kâr-zarar, KDV, yaşlandırma ve gider dağılımı · ${NS.date(from)} – ${NS.date(to)}`, `<div class="seg">${Object.entries(PERIODS()).map(([k, [l]]) => `<button data-p="${k}" class="${k === per ? 'active' : ''}">${l}</button>`).join('')}</div><input class="input" type="date" id="rf" value="${from}" style="max-width:150px" title="Başlangıç"><input class="input" type="date" id="rt" value="${to}" style="max-width:150px" title="Bitiş"><button class="btn" id="aktar">${icon('send')} Resmi muhasebeye aktar</button>${NS.integ && NS.integ.isOn('edefter') ? `<button class="btn" id="edf">${icon('book')} e-Defter</button>` : ''}`) + `
        <div class="grid g4 mb">${kpi('Dönem geliri', money(sum(rows, (r) => r.inc)), 'trend', 'ok')}${kpi('Dönem gideri', money(sum(rows, (r) => r.exp)), 'minus', 'err')}${kpi('Net kâr', money(sum(rows, (r) => r.inc - r.exp)), 'wallet')}${kpi('Ödenecek KDV', money(sum(rows, (r) => r.vOut - r.vIn)), 'percent', 'warn')}</div>
        <div class="card mb"><div class="card-h"><h3>Aylık kâr-zarar ve KDV (TL)</h3><button class="btn sm" id="ex">${icon('download')}</button></div>${table({ rows, columns: [{ label: 'Ay', render: (r) => `${NS.MONTHS[Number(r.m.slice(5)) - 1]} ${r.m.slice(0, 4)}` }, { label: 'Gelir', cls: 'right', render: (r) => money(r.inc) }, { label: 'Gider', cls: 'right', render: (r) => money(r.exp) }, { label: 'Kâr/Zarar', cls: 'right', render: (r) => `<b style="color:${r.inc - r.exp >= 0 ? 'var(--ok)' : 'var(--err)'}">${money(r.inc - r.exp)}</b>` }, { label: 'Hesaplanan KDV', cls: 'right', render: (r) => money(r.vOut) }, { label: 'İndirilecek KDV', cls: 'right', render: (r) => money(r.vIn) }, { label: 'Ödenecek KDV', cls: 'right', render: (r) => money(r.vOut - r.vIn) }] })}</div>
        <div class="grid g2"><div class="card"><div class="card-h"><h3>Alacak yaşlandırma</h3></div><div class="card-b">${chart.bars(aging, { format: money, color: '#dc2626' })}</div></div><div class="card"><div class="card-h"><h3>Gider dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(giderCat).map(([label, v]) => ({ label, value: sum(v, (t) => t.amount) })).sort((a, b) => b.value - a.value), { format: money, size: 140 })}</div></div></div>`;
      // Logo / Mikro / Luca / Zirve... aktarımı: bağlayıcı açıksa API, değilse fiş listesi CSV
      $('#aktar', el).onclick = async () => {
        const v = await formModal({ title: 'Resmi muhasebeye aktarım', fields: [{ name: 'month', label: 'Dönem', type: 'month', value: today().slice(0, 7) }, { name: 'what', label: 'Aktarılacaklar', type: 'select', options: [{ value: 'all', label: 'Faturalar + tahsilat/ödeme + gelir/gider' }, { value: 'inv', label: 'Sadece faturalar' }] }] }); if (!v) return;
        const invs = db.all('invoices', (i) => i.date.slice(0, 7) === v.month).map((i) => ({ no: i.no, kind: i.kind, iadeLabel: i.iade ? docLabel(i) : '', date: i.date, cari: cari(i.cari).name, vkn: cari(i.cari).taxNo, net: invTotals(i).net, vat: invTotals(i).vat, total: invTotals(i).tl, currency: i.currency || 'TRY', ebelge: i.ebelge ? i.ebelge.no : '' }));
        const txs = v.what === 'all' ? db.all('txns', (t) => t.date.slice(0, 7) === v.month).map((t) => ({ date: t.date, type: t.type, account: acc(t.account).name, cari: t.cari ? cari(t.cari).name : '', cat: t.cat || '', amount: t.amount, desc: t.desc || '' })) : [];
        if (NS.integ && NS.integ.isOn('muhasebeaktar')) { const r = await NS.integ.call('muhasebeaktar', 'donem-aktar', { month: v.month, invoices: invs, transactions: txs }); if (r && r.ok && r.simulated) toast('Aktarım simülasyonu — hiçbir programa aktarılmadı', 'warn'); else if (r && r.ok) { db.saveSettings({ ['aktar_' + v.month]: r.ref }); toast(`${invs.length} fatura ve ${txs.length} hareket aktarıldı`, 'ok'); } }
        else { NS.csv(`muhasebe-aktarim-${v.month}`, [...invs.map((i) => ({ tur: i.iadeLabel || (i.kind === 'satis' ? 'Satış faturası' : 'Alış faturası'), tarih: i.date, belge: i.no, cari: i.cari, vkn: i.vkn, matrah: i.net, kdv: i.vat, tutar: i.total })), ...txs.map((t) => ({ tur: t.type, tarih: t.date, belge: '', cari: t.cari || t.cat, vkn: '', matrah: '', kdv: '', tutar: t.amount }))], [{ key: 'tur', label: 'Fiş türü' }, { key: 'tarih', label: 'Tarih' }, { key: 'belge', label: 'Belge no' }, { key: 'cari', label: 'Cari / hesap' }, { key: 'vkn', label: 'VKN' }, { key: 'matrah', label: 'Matrah' }, { key: 'kdv', label: 'KDV' }, { key: 'tutar', label: 'Tutar' }]); toast('Bağlayıcı kapalı — aktarım dosyası (CSV) indirildi', 'ok'); }
      };
      if ($('#edf', el)) $('#edf', el).onclick = async () => { const m = await NS.prompt('Berat oluşturulacak dönem (YYYY-AA)', today().slice(0, 7), { title: 'e-Defter' }); if (!m) return; const r = NS.integ ? await NS.integ.call('edefter', 'berat-olustur', { month: m, invoices: db.all('invoices', (i) => i.date.slice(0, 7) === m).length }) : null; if (r && r.ok && r.simulated) toast('e-Defter simülasyonu — berat oluşturulmadı', 'warn'); else if (r && r.ok) { db.saveSettings({ ['edefter_' + m]: r.ref }); toast(`${m} e-Defter beratı hazırlandı (${r.ref})`, 'ok'); } };
      $('#rf', el).onchange = (e) => { if (e.target.value) { from = e.target.value; per = ''; if (from > to) to = from; draw(); } };
      $('#rt', el).onchange = (e) => { if (e.target.value) { to = e.target.value; per = ''; if (to < from) from = to; draw(); } };
      $('#ex', el).onclick = () => NS.csv(`kar-zarar-${from}-${to}`, rows, [{ key: 'm', label: 'Ay' }, { key: 'inc', label: 'Gelir' }, { key: 'exp', label: 'Gider' }, { label: 'Kâr', value: (r) => r.inc - r.exp }, { key: 'vOut', label: 'Hesaplanan KDV' }, { key: 'vIn', label: 'İndirilecek KDV' }]);
    };
    on(el, 'click', '[data-p]', (e, b) => { per = b.dataset.p; [from, to] = PERIODS()[per].slice(1); draw(); });
    draw();
  }

  // ---------- Stok kartları, depolar ve stok hareketleri ----------
  const depots = () => { if (!db.col('depots').length) { db.data.depots = [{ id: 'dp1', name: 'Merkez Depo', address: '' }]; db.save(); } return db.all('depots'); };
  const depotName = (id) => (db.get('depots', id) || {}).name || '-';
  // Hizmet kalemleri stok tutmaz; eski kayıtlarda tür yoksa adından tahmin edilir
  const isStock = (it) => !!it && (it.kind || (/(hizmet|danışmanlık|kurulum|sözleşme|nakliye|eğitim)/i.test(it.name) ? 'hizmet' : 'stok')) === 'stok';
  const stockOf = (itemId, depot) => r2(sum(db.all('moves', (m) => m.item === itemId && (!depot || m.depot === depot)), (m) => m.qty));
  const stockOfRef = (refId, itemId) => -sum(db.all('moves', (m) => m.ref === refId && m.item === itemId), (m) => m.qty);
  // Belgenin stok hareketlerini yeniden üretir (düzenlemede eskiler silinir)
  function syncMoves(refType, doc, dir) {
    db.data.moves = db.all('moves', (m) => m.ref !== doc.id);
    if (dir) doc.lines.forEach((l) => { const it = l.item && db.get('items', l.item); if (!isStock(it)) return; db.col('moves').push({ id: NS.uid(), date: doc.date, item: it.id, depot: doc.depot || depots()[0].id, qty: dir * l.qty * (Number(l.factor) || 1), type: refType, ref: doc.id, refNo: doc.no, cari: doc.cari }); });
    db.save();
  }
  const MT = { acilis: ['Açılış', ''], fatura: ['Fatura', 'info'], irsaliye: ['İrsaliye', 'acc'], transfer: ['Transfer', 'warn'], sayim: ['Sayım farkı', 'err'], uretim: ['Üretim', 'ok'] };

  function itemsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'items', title: 'Stok & Hizmet Kartları', sub: 'Ürün kodu, barkod, alış/satış fiyatı, KDV ve kritik stok', single: 'Kart', addLabel: 'Yeni kart', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Stok kodu' }, { name: 'barcode', label: 'Barkod' }, { name: 'name', label: 'Ad', required: true, full: true }, { name: 'kind', label: 'Tür', type: 'select', options: [{ value: 'stok', label: 'Stoklu ürün' }, { value: 'hizmet', label: 'Hizmet (stok tutulmaz)' }] }, { name: 'unit', label: 'Birim', type: 'select', options: ['adet', 'kg', 'lt', 'm', 'm²', 'koli', 'paket', 'saat', 'ay', 'sefer'] }, { name: 'buy', label: 'Alış fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01', required: true }, { name: 'vat', label: 'KDV %', type: 'select', options: ['0', '1', '10', '20'], num: true }, { name: 'min', label: 'Kritik stok', type: 'number' }, { name: 'group', label: 'Grup' }, { name: 'altUnits', label: 'Diğer birimler (ör. koli=12, paket=6)', full: true, placeholder: 'Ana birimin katı olarak' }],
      defaults: { kind: 'stok', unit: 'adet', vat: 20, min: 5 }, beforeSave: (v) => { v.vat = Number(v.vat); },
      searchFields: (i) => [i.code, i.name, i.barcode, i.group], sort: (a, b) => String(a.code || a.name).localeCompare(String(b.code || b.name), 'tr', { numeric: true }),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 's', label: 'Stoklu', test: isStock }, { value: 'h', label: 'Hizmet', test: (i) => !isStock(i) }, { value: 'low', label: 'Kritik', test: (i) => isStock(i) && stockOf(i.id) <= (i.min || 0) }],
      columns: [{ key: 'code', label: 'Kod', render: (i) => `<span class="mono small">${esc(i.code || '-')}</span>` }, { key: 'name', label: 'Ad', render: (i) => `<b>${esc(i.name)}</b><div class="small faint">${esc(i.barcode || '')} ${i.group ? '· ' + esc(i.group) : ''}</div>` }, { label: 'Tür', render: (i) => (isStock(i) ? badge('Stoklu', 'acc') : badge('Hizmet')) }, { key: 'buy', label: 'Alış', cls: 'right', render: (i) => (i.buy ? money(i.buy) : '-') }, { key: 'price', label: 'Satış', cls: 'right', render: (i) => money(i.price) }, { label: 'Stok', cls: 'right', render: (i) => (isStock(i) ? (stockOf(i.id) <= (i.min || 0) ? badge(num(stockOf(i.id)) + ' ' + i.unit, 'err') : num(stockOf(i.id)) + ' ' + esc(i.unit)) : '-') }],
      extraActions: [{ icon: 'layers', act: 'mv', title: 'Stok hareketleri', show: isStock }],
      onAction: (a, i) => modal({ title: `${i.name} — stok hareketleri`, size: 'wide', body: `<div class="row mb">${depots().map((d) => badge(`${d.name}: ${num(stockOf(i.id, d.id))} ${i.unit}`, 'acc')).join(' ')}</div>` + table({ rows: db.all('moves', (m) => m.item === i.id).sort((x, y) => y.date.localeCompare(x.date)), empty: 'Hareket yok', columns: [{ label: 'Tarih', render: (m) => NS.date(m.date) }, { label: 'Tür', render: (m) => badge(MT[m.type][0], MT[m.type][1]) }, { label: 'Belge', render: (m) => esc(m.refNo || '-') }, { label: 'Cari', render: (m) => esc(m.cari ? cari(m.cari).name : '-') }, { label: 'Depo', render: (m) => esc(depotName(m.depot)) }, { label: 'Miktar', cls: 'right', render: (m) => `<b style="color:${m.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${m.qty > 0 ? '+' : ''}${num(m.qty)}</b>` }] }) }),
    });
    { const r = el.querySelector('.page-h .row'); if (r && app.can('muhasebe')) { r.insertAdjacentHTML('afterbegin', `<button class="btn" id="imp">${icon('upload')} İçe aktar</button><button class="btn" id="fl">${icon('tag')} Fiyat listeleri</button>`); $('#imp', el).onclick = () => window.MUHAKTAR.open(app, 'urun'); $('#fl', el).onclick = () => priceListModal(app); } }
  }
  function stockPage(el, p, app) {
    let tab = p || 'durum';
    const dps = depots();
    const items = db.all('items', isStock);
    el.innerHTML = pageHead('Stok & Depo', 'Depo bazlı stok, transfer ve sayım', `<button class="btn" id="tr">${icon('refresh')} Depo transferi</button><button class="btn" id="cnt">${icon('list')} Sayım / düzeltme</button><button class="btn primary" id="nd">${icon('plus')} Depo ekle</button>`) + `
      <div class="grid g4 mb">${kpi('Stoklu kart', items.length, 'box')}${kpi('Stok değeri (alış)', money(sum(items, (i) => Math.max(0, stockOf(i.id)) * (i.buy || i.price * 0.7))), 'wallet', 'info')}${kpi('Kritik stok', items.filter((i) => stockOf(i.id) <= (i.min || 0)).length, 'alert', 'err')}${kpi('Depo', dps.length, 'building', 'warn')}</div>
      <div class="tabs">${[['durum', 'Stok durumu'], ['hareket', 'Hareketler'], ['depolar', 'Depolar']].map(([k, l]) => `<button data-tb="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div class="card" id="tb"></div>`;
    const tb = $('#tb', el);
    if (tab === 'durum') tb.innerHTML = table({ rows: items.sort((a, b) => String(a.code || a.name).localeCompare(String(b.code || b.name), 'tr', { numeric: true })), empty: 'Stoklu kart yok', columns: [{ label: 'Ürün', render: (i) => `<b>${esc(i.name)}</b><div class="small faint mono">${esc(i.code || '')}</div>` }, ...dps.map((d) => ({ label: d.name, cls: 'right', render: (i) => num(stockOf(i.id, d.id)) })), { label: 'Toplam', cls: 'right', render: (i) => (stockOf(i.id) <= (i.min || 0) ? badge(num(stockOf(i.id)) + ' ' + i.unit, 'err') : `<b>${num(stockOf(i.id))}</b> ${esc(i.unit)}`) }, { label: 'Değer', cls: 'right', render: (i) => money(Math.max(0, stockOf(i.id)) * (i.buy || 0)) }] });
    else if (tab === 'hareket') tb.innerHTML = table({ rows: db.all('moves').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 300), empty: 'Hareket yok', columns: [{ label: 'Tarih', render: (m) => NS.date(m.date) }, { label: 'Ürün', render: (m) => esc((db.get('items', m.item) || {}).name || '-') }, { label: 'Tür', render: (m) => badge(MT[m.type][0], MT[m.type][1]) }, { label: 'Belge', render: (m) => esc(m.refNo || m.note || '-') }, { label: 'Depo', render: (m) => esc(depotName(m.depot)) }, { label: 'Miktar', cls: 'right', render: (m) => `<b style="color:${m.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${m.qty > 0 ? '+' : ''}${num(m.qty)}</b>` }] });
    else tb.innerHTML = table({ rows: dps, columns: [{ label: 'Depo', render: (d) => `<b>${esc(d.name)}</b><div class="small faint">${esc(d.address || '')}</div>` }, { label: 'Kalem', cls: 'right', render: (d) => items.filter((i) => stockOf(i.id, d.id) > 0).length }, { label: 'Değer', cls: 'right', render: (d) => money(sum(items, (i) => Math.max(0, stockOf(i.id, d.id)) * (i.buy || 0))) }], actions: [{ icon: 'edit', act: 'ed' }] });
    on(el, 'click', '[data-tb]', (e, b) => app.go('stok', b.dataset.tb));
    on(el, 'click', '[data-act=ed]', async (e, b) => { const d = db.get('depots', b.dataset.id); const v = await formModal({ title: 'Depo', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'address', label: 'Adres', full: true }], values: d }); if (v) { db.update('depots', d.id, v); app.refresh(); } });
    $('#nd', el).onclick = async () => { const v = await formModal({ title: 'Yeni depo', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'address', label: 'Adres', full: true }] }); if (v) { db.insert('depots', v); app.refresh(); } };
    $('#tr', el).onclick = async () => {
      if (dps.length < 2) return toast('Transfer için en az iki depo gerekli', 'err');
      const v = await formModal({ title: 'Depolar arası transfer', fields: [{ name: 'item', label: 'Ürün', type: 'select', options: items.map((i) => ({ value: i.id, label: `${i.name} (toplam ${num(stockOf(i.id))})` })) }, { name: 'from', label: 'Çıkış deposu', type: 'select', options: dps.map((d) => ({ value: d.id, label: d.name })) }, { name: 'to', label: 'Giriş deposu', type: 'select', options: dps.map((d) => ({ value: d.id, label: d.name })), value: dps[1].id }, { name: 'qty', label: 'Miktar', type: 'number', required: true }, { name: 'note', label: 'Açıklama' }] });
      if (!v) return; if (v.from === v.to) return toast('Farklı depo seçin', 'err'); if (stockOf(v.item, v.from) < v.qty && !(await confirm('Çıkış deposunda yeterli stok yok. Yine de yapılsın mı?', { ok: 'Yap', danger: false }))) return;
      const ref = NS.uid(), no = db.nextNo('TR', 'TRF');
      db.col('moves').push({ id: NS.uid(), date: today(), item: v.item, depot: v.from, qty: -v.qty, type: 'transfer', ref, refNo: no, note: v.note }, { id: NS.uid(), date: today(), item: v.item, depot: v.to, qty: v.qty, type: 'transfer', ref, refNo: no, note: v.note });
      db.log('Depo transferi', `${(db.get('items', v.item) || {}).name} · ${v.qty}`); db.save(); toast('Transfer yapıldı', 'ok'); app.refresh();
    };
    $('#cnt', el).onclick = async () => {
      const dep = dps.length > 1 ? (await formModal({ title: 'Sayım deposu', fields: [{ name: 'd', label: 'Depo', type: 'select', options: dps.map((d) => ({ value: d.id, label: d.name })) }] }) || {}).d : dps[0].id; if (!dep) return;
      modal({ title: `Sayım — ${depotName(dep)}`, size: 'wide', body: `<p class="small muted mb">Sayılan miktarları girin; farklar sayım hareketi olarak işlenir. Boş bırakılan satırlar değişmez.</p>` + table({ rows: items, columns: [{ label: 'Ürün', render: (i) => esc(i.name) }, { label: 'Sistem', cls: 'right', render: (i) => num(stockOf(i.id, dep)) }, { label: 'Sayılan', cls: 'right', render: (i) => `<input class="input" type="number" step="0.01" style="width:100px;text-align:right" data-c="${i.id}">` }] }),
        actions: [{ label: 'Vazgeç' }, { label: 'Sayımı işle', cls: 'primary', onClick: (c, b) => { let n = 0; const no = db.nextNo('SY', 'SAY'); $$('[data-c]', b).forEach((x) => { if (x.value === '') return; const diff = r2(Number(x.value) - stockOf(x.dataset.c, dep)); if (!diff) return; n++; db.col('moves').push({ id: NS.uid(), date: today(), item: x.dataset.c, depot: dep, qty: diff, type: 'sayim', ref: no, refNo: no }); }); db.save(); c(); toast(`${n} kalemde sayım farkı işlendi`, 'ok'); app.refresh(); } }] });
    };
  }

  // ---------- İrsaliyeler ----------
  function dispatchEditor(app, kind, rec, preset) {
    const d = rec ? JSON.parse(JSON.stringify(rec)) : { kind, date: today(), shipDate: today(), depot: depots()[0].id, lines: [{ item: '', qty: 1 }], ...(preset || {}) };
    const party = kind === 'satis' ? 'musteri' : 'tedarikci';
    const items = db.all('items', isStock);
    modal({
      title: rec ? `${rec.no} düzenle` : kind === 'satis' ? 'Yeni sevk irsaliyesi' : 'Yeni alış (giriş) irsaliyesi', size: 'xl',
      body: `<div class="mb" id="hf">${NS.fieldsHtml([{ name: 'cari', label: 'Cari', type: 'select', required: true, options: db.all('caris', (c) => c.type === 'ikisi' || c.type === party).map((c) => ({ value: c.id, label: c.name })) }, { name: 'docNo', label: kind === 'satis' ? 'Belge no (boşsa otomatik)' : 'Tedarikçi irsaliye no', required: kind === 'alis' }, { name: 'date', label: 'Düzenleme tarihi', type: 'date' }, { name: 'shipDate', label: kind === 'satis' ? 'Sevk tarihi' : 'Teslim alma tarihi', type: 'date' }, { name: 'depot', label: 'Depo', type: 'select', options: depots().map((x) => ({ value: x.id, label: x.name })) }, { name: 'plate', label: 'Araç plakası' }, { name: 'driver', label: 'Şoför / teslim eden' }, { name: 'address', label: 'Sevk adresi', full: true }, { name: 'note', label: 'Not', full: true }], d)}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:260px">Ürün</th><th>Miktar</th><th>Birim</th><th>Depodaki stok</th><th></th></tr></thead><tbody id="dl"></tbody></table></div>
        <div class="row mt"><button class="btn sm" id="da">${icon('plus')} Satır</button><input class="input" id="db" placeholder="Barkod okut + Enter" style="max-width:220px;height:30px">${d.order ? badge('Sipariş: ' + ((db.get('orders', d.order) || {}).no || ''), 'acc') : ''}</div>`,
      onOpen: (b) => {
        const draw = () => { const dep = $('[name=depot]', b).value; $('#dl', b).innerHTML = d.lines.map((l, i) => { const it = db.get('items', l.item); return `<tr><td><select class="input" data-i="${i}" data-f="item"><option value="">Seçin...</option>${items.map((x) => `<option value="${x.id}" ${x.id === l.item ? 'selected' : ''}>${esc(x.code ? x.code + ' · ' : '')}${esc(x.name)}</option>`).join('')}</select></td><td><input class="input" type="number" step="0.01" style="width:100px" data-i="${i}" data-f="qty" value="${l.qty}"></td><td>${esc(it ? it.unit : '')}</td><td class="${it && kind === 'satis' && stockOf(it.id, dep) < l.qty ? '' : 'faint'}" style="${it && kind === 'satis' && stockOf(it.id, dep) < l.qty ? 'color:var(--err)' : ''}">${it ? num(stockOf(it.id, dep)) : ''}</td><td><button class="btn sm ghost icon" data-x="${i}">${icon('x')}</button></td></tr>`; }).join(''); };
        on(b, 'change', '[data-i]', (e, x) => { d.lines[x.dataset.i][x.dataset.f] = x.dataset.f === 'qty' ? Number(x.value) || 0 : x.value; draw(); });
        on(b, 'click', '[data-x]', (e, x) => { d.lines.splice(Number(x.dataset.x), 1); draw(); });
        $('#da', b).onclick = () => { d.lines.push({ item: '', qty: 1 }); draw(); };
        $('[name=depot]', b).onchange = draw;
        $('#db', b).onkeydown = (e) => { if (e.key !== 'Enter') return; const it = db.find('items', (x) => x.barcode === e.target.value.trim()); e.target.value = ''; if (!it) return toast('Barkod bulunamadı', 'err'); const ex = d.lines.find((l) => l.item === it.id); if (ex) ex.qty++; else { const em = d.lines.find((l) => !l.item); if (em) em.item = it.id; else d.lines.push({ item: it.id, qty: 1 }); } NS.beep(); draw(); };
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
        if (!NS.validate($('#hf', b))) return;
        Object.assign(d, NS.readForm($('#hf', b)));
        d.lines = d.lines.filter((l) => l.item && l.qty > 0).map((l) => { const it = db.get('items', l.item); return { ...l, name: it.name, unit: it.unit }; });
        if (!d.lines.length) return toast('En az bir ürün girin', 'err');
        if (kind === 'satis' && !S().allowNegative) { const short = d.lines.find((l) => stockOf(l.item, d.depot) + (rec ? stockOfRef(rec.id, l.item) : 0) < l.qty); if (short) return toast(`${short.name}: depoda yeterli stok yok`, 'err'); }
        let saved;
        if (rec) { db.update('dispatches', rec.id, d); saved = db.get('dispatches', rec.id); }
        else { d.no = d.docNo || (kind === 'satis' ? 'SI' : 'AI') + new Date().getFullYear() + String(db.nextNo('I' + kind)).padStart(6, '0'); saved = db.insert('dispatches', d); db.log(kind === 'satis' ? 'Sevk irsaliyesi' : 'Alış irsaliyesi', `${d.no} · ${cari(d.cari).name}`); }
        syncMoves('irsaliye', saved, kind === 'satis' ? -1 : 1);
        if (saved.order) updateOrderDelivery(saved.order);
        close(); toast('İrsaliye kaydedildi, stok güncellendi', 'ok'); app.refresh();
      } }],
    });
  }
  // Seçilen irsaliyeleri tek faturada toplar (aynı cari)
  function invoiceFromDispatches(app, ids) {
    const ds = ids.map((id) => db.get('dispatches', id));
    if (new Set(ds.map((d) => d.cari)).size > 1) return toast('Toplu faturalamada irsaliyeler aynı cariye ait olmalı', 'err');
    const kind = ds[0].kind; const c = cari(ds[0].cari);
    const map = {};
    ds.forEach((d) => { const ord = d.order && db.get('orders', d.order); d.lines.forEach((l) => { const it = db.get('items', l.item) || {}; const ol = ord && ord.lines.find((x) => x.item === l.item); const k = l.item; map[k] = map[k] || { item: l.item, name: l.name, unit: l.unit, qty: 0, price: ol ? r2(ol.price * (ord.rate || 1)) : kind === 'alis' ? it.buy || it.price : it.price, vat: ol ? ol.vat : it.vat || 20, disc: ol ? ol.disc || 0 : 0 }; map[k].qty += l.qty; }); });
    const prefix = kind === 'satis' ? 'SF' : 'AF';
    const inv = db.insert('invoices', { kind, cari: c.id, date: today(), due: iso(addDays(new Date(), c.term || 0)), currency: 'TRY', rate: 1, depot: ds[0].depot, lines: Object.values(map), note: `İrsaliyeler: ${ds.map((d) => d.no).join(', ')}`, dispatches: ids, no: prefix + new Date().getFullYear() + String(db.nextNo(prefix)).padStart(6, '0') });
    ds.forEach((d) => { d.invoice = inv.id; });
    db.log('İrsaliyeden fatura', `${inv.no} · ${ds.length} irsaliye`); db.save();
    toast(`${inv.no} oluşturuldu (${ds.length} irsaliye)`, 'ok');
    docEditor(app, kind, inv);
  }
  function printDispatch(d) {
    const s = S(), c = cari(d.cari);
    NS.printHtml(`<div class="doc"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div><div>VD: ${esc(s.taxOffice || '')} ${esc(s.taxNo || '')}</div></td><td style="text-align:right"><h2 style="margin:0">${d.kind === 'satis' ? 'SEVK İRSALİYESİ' : 'ALIŞ İRSALİYESİ'}</h2><div>No: <b>${esc(d.no)}</b></div><div>Düzenleme: ${NS.date(d.date)}</div><div>Sevk: ${NS.date(d.shipDate)}</div></td></tr></table><hr>
      <table><tr><td><b>${esc(c.name)}</b><br>${esc(d.address || c.address || '')}<br>VKN: ${esc(c.taxNo || '')}</td><td>Depo: ${esc(depotName(d.depot))}<br>Plaka: ${esc(d.plate || '-')}<br>Şoför: ${esc(d.driver || '-')}</td></tr></table><br>
      <table><tr><th>#</th><th>Kod</th><th>Ürün</th><th style="text-align:right">Miktar</th><th>Birim</th></tr>${d.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc((db.get('items', l.item) || {}).code || '')}</td><td>${esc(l.name)}</td><td style="text-align:right">${num(l.qty)}</td><td>${esc(l.unit)}</td></tr>`).join('')}</table>
      ${d.note ? `<p><i>${esc(d.note)}</i></p>` : ''}${d.ebelge ? `<p style="font-size:11px">${esc(d.ebelge.type)} no: ${esc(d.ebelge.no)}</p>` : ''}<table style="margin-top:50px"><tr><td>Teslim eden<br><br>__________</td><td style="text-align:right">Teslim alan<br><br>__________</td></tr></table></div>`, { title: d.no });
  }
  function dispatchesPage(el, kind, app) {
    kind = kind === 'alis' ? 'alis' : 'satis';
    let q = '', f = 'acik';
    el.innerHTML = pageHead('İrsaliyeler', kind === 'satis' ? 'Sevk irsaliyeleri — mal çıkışı ve faturalama' : 'Alış irsaliyeleri — mal girişi', `<div class="seg"><a class="btn sm ${kind === 'satis' ? 'primary' : 'ghost'}" href="#/irsaliyeler/satis">Sevk (satış)</a><a class="btn sm ${kind === 'alis' ? 'primary' : 'ghost'}" href="#/irsaliyeler/alis">Giriş (alış)</a></div><button class="btn" id="bulk">${icon('file')} Seçilenleri faturala</button><button class="btn primary" id="nw">${icon('plus')} Yeni irsaliye</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'İrsaliye no, cari, plaka...')}<div class="seg">${[['acik', 'Faturalanmamış'], ['fat', 'Faturalanmış'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('dispatches', (d) => d.kind === kind && (f === 'all' || (f === 'acik' ? !d.invoice : !!d.invoice)) && NS.match(q, d.no, cari(d.cari).name, d.plate)).sort((a, b) => b.date.localeCompare(a.date));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'truck', empty: 'İrsaliye yok', columns: [{ label: '', render: (d) => (d.invoice ? '' : `<input type="checkbox" data-sel="${d.id}">`) }, { label: 'No', render: (d) => `<b>${esc(d.no)}</b>${d.ebelge ? '<div>' + badge(d.ebelge.type, 'ok') + '</div>' : ''}` }, { label: 'Cari', render: (d) => esc(cari(d.cari).name) }, { label: 'Tarih', render: (d) => `${NS.date(d.date)}<div class="small faint">Sevk ${NS.date(d.shipDate)}</div>` }, { label: 'Depo', render: (d) => esc(depotName(d.depot)) }, { label: 'Kalem', cls: 'right', render: (d) => `${d.lines.length} <span class="faint small">(${num(sum(d.lines, (l) => l.qty))})</span>` }, { label: 'Araç', render: (d) => esc(d.plate || '-') }, { label: 'Fatura', render: (d) => (d.invoice ? badge((db.get('invoices', d.invoice) || {}).no || 'Faturalandı', 'ok') : badge('Faturalanmadı', 'warn')) }], actions: [{ label: 'Faturala', act: 'inv', show: (d) => !d.invoice }, { icon: 'send', act: 'eb', title: 'e-İrsaliye gönder', show: (d) => !d.ebelge }, { icon: 'print', act: 'pr' }, { icon: 'edit', act: 'ed', show: (d) => !d.invoice }, { icon: 'trash', act: 'del', show: (d) => !d.invoice }], foot: `${r.length} irsaliye` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nw', el).onclick = () => dispatchEditor(app, kind);
    $('#bulk', el).onclick = () => { const ids = $$('[data-sel]:checked', el).map((x) => x.dataset.sel); if (!ids.length) return toast('Faturalanacak irsaliyeleri seçin', 'err'); invoiceFromDispatches(app, ids); };
    on(el, 'click', '[data-act]', async (e, b) => {
      const d = db.get('dispatches', b.dataset.id); const a = b.dataset.act;
      if (a === 'pr') printDispatch(d);
      else if (a === 'inv') invoiceFromDispatches(app, [d.id]);
      else if (a === 'ed') dispatchEditor(app, kind, d);
      else if (a === 'eb') { if (!NS.integ) return; const c = cari(d.cari); const payload = { docType: 'e-İrsaliye', buyer: c.name, buyerVkn: c.taxNo, no: d.no, date: d.shipDate, plate: d.plate, driver: d.driver, address: d.address || c.address, district: c.district, city: c.city, lines: d.lines }; const r = NS.integ.isOn('eirsaliye') ? await NS.integ.call('eirsaliye', 'gonder', payload) : await NS.integ.sendEInvoice(payload); if (r.ok) { d.ebelge = { type: 'e-İrsaliye', no: r.no || r.ref, at: new Date().toISOString(), status: r.simulated ? 'test' : r.queued ? 'kuyrukta' : 'gönderildi' }; db.save(); draw(); } }
      else if (await confirm(`${d.no} silinsin mi? Stok hareketleri geri alınır.`)) { db.data.moves = db.all('moves', (m) => m.ref !== d.id); const ord = d.order; db.remove('dispatches', d.id); if (ord) updateOrderDelivery(ord); draw(); }
    });
    draw();
  }

  // ---------- Siparişler ----------
  // Teslim edilen miktarlar siparişe bağlı irsaliyelerden hesaplanır
  function updateOrderDelivery(orderId) {
    const o = db.get('orders', orderId); if (!o) return;
    const ds = db.all('dispatches', (d) => d.order === orderId);
    o.lines.forEach((l) => { l.delivered = sum(ds.flatMap((d) => d.lines.filter((x) => x.item && x.item === l.item)), (x) => x.qty); });
    if (o.status !== 'iptal') { const all = o.lines.every((l) => !l.item || (l.delivered || 0) >= l.qty); const any = o.lines.some((l) => (l.delivered || 0) > 0); o.status = all && any ? 'tamam' : any ? 'kismi' : 'acik'; }
    db.save();
  }
  const OST = { acik: ['Açık', 'warn'], kismi: ['Kısmi teslim', 'info'], tamam: ['Tamamlandı', 'ok'], iptal: ['İptal', 'err'] };
  function ordersPage(el, kind, app) {
    kind = kind === 'asip' ? 'asip' : 'ssip';
    const dk = kind === 'ssip' ? 'satis' : 'alis';
    let q = '', f = 'aktif';
    el.innerHTML = pageHead('Siparişler', kind === 'ssip' ? 'Müşteri siparişleri — sevk ve faturalama takibi' : 'Satın alma siparişleri — tedarikçi teslim takibi', `<div class="seg"><a class="btn sm ${kind === 'ssip' ? 'primary' : 'ghost'}" href="#/siparisler/ssip">Satış</a><a class="btn sm ${kind === 'asip' ? 'primary' : 'ghost'}" href="#/siparisler/asip">Satın alma</a></div><button class="btn primary" id="nw">${icon('plus')} Yeni sipariş</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Sipariş no, cari...')}<div class="seg">${[['aktif', 'Açık'], ['tamam', 'Tamamlanan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const prog = (o) => { const t = sum(o.lines.filter((l) => l.item), (l) => l.qty); const dl = sum(o.lines.filter((l) => l.item), (l) => Math.min(l.qty, l.delivered || 0)); return t ? Math.round((dl / t) * 100) : 0; };
    const rows = () => db.all('orders', (o) => o.kind === kind && (f === 'all' || (f === 'aktif' ? ['acik', 'kismi'].includes(o.status) : o.status === f)) && NS.match(q, o.no, cari(o.cari).name)).sort((a, b) => b.date.localeCompare(a.date));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'bag', empty: 'Sipariş yok', columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b>` }, { label: 'Cari', render: (o) => esc(cari(o.cari).name) }, { label: 'Tarih', render: (o) => NS.date(o.date) }, { label: 'Teslim', render: (o) => (o.delivery < today() && ['acik', 'kismi'].includes(o.status) ? badge('Gecikti ' + NS.date(o.delivery), 'err') : NS.date(o.delivery)) }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${cm(invTotals(o).total, o.currency)}</b>` }, { label: 'Teslimat', render: (o) => `<div style="min-width:110px"><div class="progress"><i style="width:${prog(o)}%"></i></div><div class="small faint">%${prog(o)}</div></div>` }, { label: 'Durum', render: (o) => badge(OST[o.status][0], OST[o.status][1]) + (o.invoice ? ' ' + badge('Faturalı', 'acc') : '') }], actions: [{ label: kind === 'ssip' ? 'Sevk et' : 'Teslim al', act: 'ship', show: (o) => ['acik', 'kismi'].includes(o.status) }, { label: 'Faturala', act: 'inv', show: (o) => !o.invoice && o.status !== 'iptal' }, { icon: 'file', act: 'pf', title: 'Proforma fatura' }, { icon: 'print', act: 'pr' }, { icon: 'edit', act: 'ed', show: (o) => o.status === 'acik' }, { icon: 'x', act: 'cx', title: 'İptal', show: (o) => ['acik', 'kismi'].includes(o.status) }], foot: `${r.length} sipariş · ${money(sum(r, (o) => invTotals(o).tl))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nw', el).onclick = () => docEditor(app, kind);
    on(el, 'click', '[data-act]', async (e, b) => {
      const o = db.get('orders', b.dataset.id); const a = b.dataset.act;
      if (a === 'pf') printProforma(o);
      if (a === 'pr') printDoc(o);
      else if (a === 'ed') docEditor(app, kind, o);
      else if (a === 'cx') { if (await confirm(`${o.no} iptal edilsin mi?`)) { o.status = 'iptal'; db.save(); draw(); } }
      else if (a === 'ship') { const rem = o.lines.filter((l) => l.item && l.qty - (l.delivered || 0) > 0).map((l) => ({ item: l.item, qty: r2(l.qty - (l.delivered || 0)) })); if (!rem.length) return toast('Teslim edilecek stoklu kalem kalmadı', 'err'); dispatchEditor(app, dk, null, { cari: o.cari, order: o.id, depot: o.depot || depots()[0].id, lines: rem, note: `Sipariş ${o.no}` }); }
      else if (a === 'inv') { const ds = db.all('dispatches', (d) => d.order === o.id && !d.invoice); if (ds.length) return invoiceFromDispatches(app, ds.map((d) => d.id)); const c = cari(o.cari); const prefix = dk === 'satis' ? 'SF' : 'AF'; const inv = db.insert('invoices', { kind: dk, cari: o.cari, date: today(), due: iso(addDays(new Date(), c.term || 0)), currency: o.currency || 'TRY', rate: o.rate || 1, depot: o.depot, lines: JSON.parse(JSON.stringify(o.lines)).map((l) => ({ ...l, delivered: undefined })), note: `Sipariş ${o.no}`, order: o.id, no: prefix + new Date().getFullYear() + String(db.nextNo(prefix)).padStart(6, '0') }); syncMoves('fatura', inv, dk === 'satis' ? -1 : 1); o.invoice = inv.id; o.lines.forEach((l) => { l.delivered = l.qty; }); o.status = 'tamam'; db.save(); toast(`${inv.no} oluşturuldu, stok işlendi`, 'ok'); app.go('faturalar', dk); }
    });
    draw();
  }

  // ---------- Döviz kurları ----------
  const RATE_T = { ForexBuying: 'Döviz alış', ForexSelling: 'Döviz satış', BanknoteBuying: 'Efektif alış', BanknoteSelling: 'Efektif satış' };
  function ratesPage(el, p, app) {
    const r = rates();
    el.innerHTML = pageHead('Döviz Kurları', 'Dövizli fatura, sipariş ve cari hesaplarda kullanılır', `<select class="input" id="rt" style="max-width:170px" title="Kullanılacak TCMB kuru">${Object.entries(RATE_T).map(([k, v]) => `<option value="${k}" ${(S().rateType || 'ForexSelling') === k ? 'selected' : ''}>${v}</option>`).join('')}</select><input class="input" type="date" id="rd" value="${today()}" style="max-width:160px" title="TCMB bülten tarihi"><button class="btn primary" id="tc">${icon('refresh')} TCMB'den güncelle</button>`) + `
      <p class="small muted mb">Hangi kurun (alış / satış) ve hangi günün bülteninin kullanılacağını mali müşavirinizin görüşüne göre seçin; seçiminiz kaydedilir.</p>
      <div class="grid g3 mb">${['USD', 'EUR', 'GBP'].map((k) => `<div class="card pad"><div class="small muted">${CUR[k]}</div><div style="font-size:30px;font-weight:800">${num(r[k])} ₺</div><input class="input mt" type="number" step="0.0001" data-r="${k}" value="${r[k]}"></div>`).join('')}</div>
      <div class="row"><button class="btn" id="sv">${icon('check')} Kurları kaydet</button><span class="small muted">${S().ratesAt ? 'Son güncelleme: ' + NS.dt(S().ratesAt) + (S().ratesSrc ? ' · ' + esc(S().ratesSrc) : '') : 'Henüz güncellenmedi'}</span></div>
      <div class="card mt"><div class="card-h"><h3>Dövizli açık faturalar</h3></div>${table({ rows: db.all('invoices', (i) => (i.currency || 'TRY') !== 'TRY' && invStatus(i) !== 'odendi'), empty: 'Dövizli açık fatura yok', columns: [{ label: 'No', render: (i) => `<b>${esc(i.no)}</b>` }, { label: 'Cari', render: (i) => esc(cari(i.cari).name) }, { label: 'Tutar', cls: 'right', render: (i) => cm(invTotals(i).total, i.currency) }, { label: 'Fatura kuru', cls: 'right', render: (i) => num(i.rate) }, { label: 'Güncel kur', cls: 'right', render: (i) => num(r[i.currency]) }, { label: 'Kur farkı (₺)', cls: 'right', render: (i) => { const d = r2(invTotals(i).total * (r[i.currency] - i.rate)); return `<b style="color:${d >= 0 ? 'var(--ok)' : 'var(--err)'}">${money(d)}</b>`; } }] })}</div>`;
    $('#sv', el).onclick = () => { const nr = {}; $$('[data-r]', el).forEach((x) => { nr[x.dataset.r] = Number(x.value) || 0; }); db.saveSettings({ rates: nr, ratesAt: new Date().toISOString(), ratesSrc: 'elle' }); toast('Kurlar kaydedildi', 'ok'); app.refresh(); };
    $('#tc', el).onclick = async () => {
      try {
        // TCMB: bugünkü bülten kurlar/today.xml, geçmiş bülten kurlar/YYYYAA/GGAAYYYY.xml (ikisi de 28.10.2026'da denendi)
        const type = $('#rt', el).value; const dt = $('#rd', el).value || today(); const [y, mo, dd] = dt.split('-');
        const url = dt === today() ? 'https://www.tcmb.gov.tr/kurlar/today.xml' : `https://www.tcmb.gov.tr/kurlar/${y}${mo}/${dd}${mo}${y}.xml`;
        const res = await fetch('/api/istek', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, method: 'GET' }) }).then((x) => x.json());
        if (!res.ok) throw new Error(res.status === 404 ? `${NS.date(dt)} için TCMB bülteni yok (hafta sonu / tatil olabilir)` : res.error || 'TCMB yanıt vermedi');
        const bul = (res.body.match(/<Tarih_Date Tarih="([^"]+)"/) || [])[1] || '';
        const nr = {};
        ['USD', 'EUR', 'GBP'].forEach((k) => { const m = res.body.match(new RegExp(`CurrencyCode="${k}"[\\s\\S]*?<Unit>(\\d+)</Unit>[\\s\\S]*?<${type}>([\\d.]+)</${type}>`)); if (m) nr[k] = Number(m[2]) / (Number(m[1]) || 1); });
        if (!Object.keys(nr).length) throw new Error('Kur bilgisi okunamadı');
        db.saveSettings({ rates: { ...rates(), ...nr }, rateType: type, ratesAt: new Date().toISOString(), ratesSrc: `TCMB ${RATE_T[type].toLocaleLowerCase('tr-TR')}${bul ? ' · bülten ' + bul : ''}` }); toast('Kurlar TCMB’den güncellendi', 'ok'); app.refresh();
      } catch (e) { toast('TCMB kurları alınamadı: ' + e.message + ' (node server.js ile açın veya elle girin)', 'err'); }
    };
  }

  // ---------- e-Fatura / e-posta / makbuz ----------
  async function sendEDoc(app, inv, { auto } = {}) {
    if (!NS.integ) return toast('Entegrasyon modülü yüklü değil', 'err');
    if (auto) { const c0 = cari(inv.cari), s0 = S(); if (!c0.taxNo || !c0.district || !c0.city || !s0.bizDistrict || !s0.bizCity) return { ok: false, error: 'Eksik bilgi' }; }
    const c = cari(inv.cari); const t = invTotals(inv); const s = S();
    if (!String(s.bizDistrict || '').trim() || !String(s.bizCity || '').trim()) { if (await confirm('İşletmenizin ilçe ve il bilgisi eksik; e-Fatura bunlarsız kesilemez (GİB UBL-TR). Ayarlar açılsın mı?', { ok: 'Ayarlara git', danger: false })) app.go('ayarlar'); return; }
    if (!String(c.district || '').trim() || !String(c.city || '').trim()) {
      const v = await formModal({ title: `${c.name} — adres eksik`, fields: [{ type: 'section', label: 'e-Fatura için alıcının ilçe ve il bilgisi zorunludur' }, { name: 'district', label: 'İlçe', required: true, value: c.district || '' }, { name: 'city', label: 'İl', required: true, value: c.city || '' }] });
      if (!v) return; c.district = v.district.trim(); c.city = v.city.trim(); db.save();
    }
    if (!c.taxNo && !(await confirm(`${c.name} için VKN/TCKN girilmemiş. Nihai tüketici adına e-Arşiv kesilsin mi?`, { ok: 'Devam', danger: false }))) return;
    const r = await NS.integ.sendEInvoice({ buyer: c.name, buyerVkn: c.taxNo, buyerTaxOffice: c.taxOffice, buyerEmail: c.email, address: c.address, district: c.district, city: c.city, no: inv.no, date: inv.date, currency: inv.currency || 'TRY', rate: inv.rate || 1, total: t.total, vat: t.vat, note: inv.note, refund: !!inv.iade, refundOf: inv.iade ? inv.iade.of : undefined, refundDate: inv.iade ? inv.iade.date : undefined, lines: inv.lines.map((l) => ({ ...l, code: (db.get('items', l.item) || {}).code || '' })) });
    if (r.ok) { inv.ebelge = { id: r.id, type: r.type, no: r.no, at: new Date().toISOString(), status: r.status }; db.log(r.type, `${inv.no} → ${r.no}`); db.save(); if (app) app.refresh(); }
    return r;
  }
  // Gelen e-Fatura → alış faturası (VKN ile cari bulunur, yoksa tedarikçi açılır; ürün adıyla stok kartı eşleşir)
  if (NS.ebelge) NS.ebelge.onImport((d) => {
    let c = db.find('caris', (x) => String(x.taxNo || '') === String(d.party.vkn));
    if (!c) c = db.insert('caris', { name: d.party.name, type: 'tedarikci', taxNo: d.party.vkn, taxOffice: d.party.taxOffice || '', address: d.party.address || '', district: d.party.district || '', city: d.party.city || '', term: 30 }, true);
    const inv = db.insert('invoices', { kind: 'alis', cari: c.id, date: d.date, due: iso(addDays(d.date, c.term || 30)), currency: d.currency || 'TRY', rate: 1, depot: depots()[0].id, no: d.no, supplierNo: d.no, note: `e-Fatura ETTN ${d.uuid}`, ebelge: { id: d.id, type: d.type, no: d.no, at: new Date().toISOString(), status: 'gelen' },
      lines: d.lines.map((l) => { const it = db.find('items', (x) => NS.trLower(x.name) === NS.trLower(l.name) || (l.code && x.code === l.code)); return { item: it ? it.id : null, name: l.name, unit: l.unit || 'adet', qty: l.qty, price: l.price, vat: l.vat, disc: l.disc || 0 }; }) }, true);
    syncMoves('fatura', inv, 1); db.log('Gelen e-Fatura aktarıldı', `${d.no} · ${c.name}`); db.save();
    return inv.no;
  }, 'Alış faturası oluştur');

  function printPayment(t) {
    const s = S(), c = cari(t.cari);
    NS.printHtml(`<div class="doc" style="max-width:640px"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div></td><td style="text-align:right"><h2 style="margin:0">${t.type === 'tahsilat' ? 'TAHSİLAT MAKBUZU' : 'TEDİYE MAKBUZU'}</h2><div>${NS.date(t.date)}</div></td></tr></table><hr>
      <p>${t.type === 'tahsilat' ? 'Sayın' : 'Alıcı:'} <b>${esc(c.name)}</b></p><p>${t.type === 'tahsilat' ? 'tarafınızdan' : 'tarafınıza'} <b style="font-size:18px">${money(t.amount)}</b> ${t.type === 'tahsilat' ? 'tahsil edilmiştir' : 'ödenmiştir'}.</p><p>Hesap: ${esc(acc(t.account).name)}<br>Açıklama: ${esc(t.desc || '')}</p><p>Güncel cari bakiye: ${money(Math.abs(cariBalance(c.id)))} ${cariBalance(c.id) > 0 ? '(borçlu)' : cariBalance(c.id) < 0 ? '(alacaklı)' : ''}</p><table style="margin-top:50px"><tr><td>Teslim eden<br><br>__________</td><td style="text-align:right">Teslim alan<br><br>__________</td></tr></table></div>`, { title: 'Makbuz' });
  }

  const ROLES = { admin: 'Yönetici (her şey + ayarlar, kullanıcılar)', muhasebe: 'Muhasebe (finans, raporlar, e-Belge)', satis: 'Satış (teklif, sipariş, satış faturası, cari)', depo: 'Depo (stok, irsaliye)' };
  const FIN = ['muhasebe'], SAT = ['muhasebe', 'satis'], DEP = ['muhasebe', 'satis', 'depo'];
  NS.shell({
    id: 'muhasebe', integrations: ['efatura','email','sms','whatsapp','printer','webhook','backup'], name: 'Ön Muhasebe', tagline: 'Fatura · Cari · Kasa', icon: 'file', accent: '#0d9488', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Muhasebe' }, { id: 'ozet', label: 'Finansal Özet', icon: 'home', roles: FIN }, { id: 'faturalar', label: 'Faturalar', icon: 'file', roles: SAT }, { id: 'tekrar', label: 'Tekrarlayan faturalar', icon: 'refresh', roles: FIN }, { id: 'tahsilat', label: 'Tahsilat takibi', icon: 'bell', roles: SAT }, { id: 'teklifler', label: 'Teklifler', icon: 'send', roles: SAT }, { id: 'siparisler', label: 'Siparişler', icon: 'bag', roles: SAT }, { id: 'irsaliyeler', label: 'İrsaliyeler', icon: 'truck', roles: DEP }, { id: 'cariler', label: 'Cari Hesaplar', icon: 'building', roles: SAT }, window.MUHBEYAN.nav, { sec: 'Stok' }, { id: 'urunler', label: 'Stok & Hizmet Kartları', icon: 'box', roles: DEP }, { id: 'stok', label: 'Stok & Depo', icon: 'layers', roles: DEP }, { sec: 'Finans' }, { id: 'kasa', label: 'Kasa & Banka', icon: 'wallet', roles: FIN }, { id: 'cek', label: 'Çek & Senet', icon: 'ticket', roles: FIN }, { id: 'kurlar', label: 'Döviz Kurları', icon: 'refresh', roles: FIN }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: FIN }, { sec: 'Yönetim' }, { id: 'gecmis', label: 'İşlem geçmişi', icon: 'clock', roles: FIN }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }], ebelgeRoles: FIN,
    routes: {
      ...window.MUHBEYAN.routes,
      ozet: dashboard, faturalar: invoicesPage, teklifler: quotesPage, siparisler: ordersPage, irsaliyeler: dispatchesPage, cariler: carisPage, kasa: accountsPage, cek: chequesPage, raporlar: reportsPage,
      urunler: itemsPage, stok: stockPage, kurlar: ratesPage, gecmis: auditPage, tekrar: (el, p, a) => window.MUHTEKRAR.page(el, p, a), tahsilat: (el, p, a) => window.MUHHATIRLAT.page(el, p, a),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Tahsilat hatırlatmaları' }, { name: 'remindAuto', label: 'Ödeme hatırlatmalarını otomatik gönder (SMS / WhatsApp Cloud / e-posta API bağlıysa)', type: 'checkbox', full: true }, { name: 'remindChannel', label: 'Öncelikli kanal', type: 'select', options: [{ value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'E-posta' }] }, { name: 'remindBefore', label: 'Vadeden kaç gün önce', type: 'number', placeholder: '3' }, { name: 'remindAfter', label: 'Gecikmede kaç günde bir (en çok 3 kez)', type: 'number', placeholder: '7' }, { type: 'section', label: 'Beyanname' }, { name: 'babsLimit', label: 'Ba/Bs bildirim sınırı (₺, KDV hariç)', type: 'number', placeholder: '5000' }, { type: 'section', label: 'Fatura ve stok ayarları' }, { name: 'iban', label: 'IBAN (faturada görünür)', full: true }, { name: 'invoiceNote', label: 'Varsayılan fatura notu', full: true }, { name: 'allowNegative', label: 'Eksi stokla satış/sevke izin ver', type: 'checkbox', full: true }, { name: 'autoEBelge', label: 'Satış faturası kaydedilince otomatik e-Fatura / e-Arşiv kes', type: 'checkbox', full: true }] }),
    },
  });
})();
