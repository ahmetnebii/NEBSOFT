/* NEBSOFT Fabrika ERP (3/3) — operatör ekranı, fason iş emirleri, genel üretim gideri dağıtımı, maliyet farkı analizi */
(function () {
  'use strict';
  const { esc, $, on, icon, money, num, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const F = window.FAB;
  const { r3, r2, db, S, me, mat, sup, stn, wh, qu, matOpts, rowsOf, move, pickPlan, createLot, bomOf, unitCost, needOf, printLotLabels, docLine, noPrice, noInvoice, DOCS } = F;

  // ---------- Operatör ekranı (tablet): istasyon seç, başla / bitir / bildir ----------
  const ST_KEY = 'nebsoft-fabrika-istasyon'; // cihazda hatırlanır; yalnızca kolaylık
  const lsGet = () => { try { return localStorage.getItem(ST_KEY) || ''; } catch (e) { return ''; } };
  const lsSet = (v) => { try { localStorage.setItem(ST_KEY, v); } catch (e) { /* gizli pencere */ } };
  const OPEN = ['planlandi', 'uretimde'];
  const opsAt = (sid) => {
    const rows = db.all('wo', (w) => OPEN.includes(w.status)).flatMap((w) => (w.ops || []).map((o, i) => ({ w, o, i })).filter((x) => x.o.station === sid && x.o.status !== 'tamam'));
    const pr = { acil: 0, yuksek: 1, normal: 2, dusuk: 3 };
    return rows.sort((a, b) => (b.o.status === 'basladi') - (a.o.status === 'basladi') || pr[a.w.prio || 'normal'] - pr[b.w.prio || 'normal'] || String(a.w.due).localeCompare(String(b.w.due)));
  };
  function operatorPage(el, p, app) {
    let sid = lsGet(); const st = db.all('stations'); if (!st.some((s) => s.id === sid)) sid = '';
    const big = 'min-height:56px;font-size:17px;flex:1 1 140px;justify-content:center';
    const card = ({ w, o, i }) => {
      const m = mat(w.mat); const prev = (w.ops || []).slice(0, i).filter((x) => x.status !== 'tamam').pop(); const pct = Math.min(100, ((w.produced || 0) / w.qty) * 100); const rem = F.woNeeds(w).some((n) => n.rem > 0);
      return `<div class="card pad col" data-wo="${esc(w.id)}" data-i="${i}"><div class="row nw"><div class="grow"><b style="font-size:20px">${esc(w.no)}</b> ${badge(F.PRIO[w.prio || 'normal'][0], F.PRIO[w.prio || 'normal'][1])}<div>${esc(m.name)}</div></div>${o.status === 'basladi' ? badge('Devam ediyor', 'warn') : badge('Bekliyor')}</div>
        <div><b>${esc(o.name)}</b> <span class="small faint">· termin ${NS.date(w.due)}</span></div>
        <div class="progress"><i style="width:${pct}%"></i></div><div class="small">${num(w.produced || 0)} / ${num(w.qty)} ${esc(m.unit)}${w.scrap ? ` · fire ${num(w.scrap)}` : ''}</div>
        ${prev ? `<div class="small" style="color:var(--warn)">Önceki adım bitmedi: ${esc(prev.name)}</div>` : ''}${rem && !S().backflush ? '<div class="small" style="color:var(--warn)">Malzeme çıkışı tamamlanmadı — depoya bildirin</div>' : ''}${stn(o.station).status !== 'calisiyor' ? '<div class="small" style="color:var(--err)">Makine şu an devrede değil</div>' : ''}
        <div class="row">${o.status === 'bekliyor' ? `<button class="btn primary" style="${big}" data-op="start">${icon('check')} Başla</button>` : `<button class="btn primary" style="${big}" data-op="end">${icon('check')} Bitir</button>`}<button class="btn" style="${big}" data-op="report">${icon('plus')} Üretim bildir</button></div></div>`;
    };
    const draw = () => {
      const s = sid ? stn(sid) : null; const rows = sid ? opsAt(sid) : [];
      el.innerHTML = pageHead('Operatör Ekranı', `${esc(me())} · ${NS.dateLong(new Date())}`) + `
        <div class="card pad mb"><div class="row"><select class="input lg" id="st" style="flex:2 1 220px"><option value="">İstasyon seçin</option>${st.map((x) => `<option value="${esc(x.id)}" ${x.id === sid ? 'selected' : ''}>${esc(x.code)} · ${esc(x.name)}</option>`).join('')}</select><input class="input lg" id="sc" placeholder="İş emri no okutun" style="flex:2 1 200px" autocomplete="off">${NS.scan && NS.scan.available && NS.scan.available() ? `<button class="btn" id="cam" style="min-height:48px">${icon('search')} Kamera</button>` : ''}${s ? (s.status === 'calisiyor' ? `<button class="btn" id="dn" style="min-height:48px">${icon('alert')} Arıza / duruş</button>` : badge('Makine devrede değil', 'err')) : ''}</div></div>
        ${!sid ? `<div class="empty">${icon('gauge')}<div>Çalıştığınız istasyonu seçin veya iş emri numarasını okutun</div></div>` : rows.length ? `<div class="grid g2">${rows.slice(0, 40).map(card).join('')}</div>` : `<div class="empty">${icon('check')}<div>Bu istasyonda bekleyen operasyon yok</div></div>`}`;
      $('#st', el).onchange = (e) => { sid = e.target.value; lsSet(sid); draw(); };
      const go = (code) => { const c = String(code).trim().toUpperCase(); if (!c) return; const w = db.find('wo', (x) => String(x.no).toUpperCase() === c && OPEN.includes(x.status)); if (!w) return toast('Açık iş emri bulunamadı: ' + c, 'err'); const o = (w.ops || []).find((x) => x.status === 'basladi') || (w.ops || []).find((x) => x.status !== 'tamam'); if (!o) return toast(`${w.no}: tüm operasyonlar bitti`, 'warn'); sid = o.station; lsSet(sid); draw(); };
      $('#sc', el).onkeydown = (e) => { if (e.key === 'Enter') go(e.target.value); };
      if ($('#cam', el)) $('#cam', el).onclick = () => { const sc = NS.scan({ title: 'İş emri okut', hint: 'Föydeki kodu çerçeveye getirin', onCode: (c) => { sc.close(); go(c); } }); };
      if ($('#dn', el)) $('#dn', el).onclick = async () => { if (await F.stationDown(stn(sid))) draw(); };
    };
    on(el, 'click', '[data-op]', (e, b) => { const c = b.closest('[data-wo]'); const w = db.get('wo', c.dataset.wo); const o = w.ops[Number(c.dataset.i)]; const a = b.dataset.op; if (a === 'start') { F.opStart(w, o); toast(`${o.name} başladı`, 'ok'); draw(); } else if (a === 'end') { F.opFinish(w, o); toast(`${o.name} bitti · ${o.min} dk`, 'ok'); draw(); } else F.reportModal(app, w, draw); });
    draw();
  }

  // ---------- Fason iş emirleri: malzeme fasoncuya gider (stok düşmez, "Fasoncuda" deposuna geçer), mamul dönünce tüketilir ----------
  const FST = { taslak: ['Malzeme gönderilmedi', ''], sevk: ['Malzeme fasoncuda', 'warn'], kismi: ['Kısmi teslim', 'info'], tamam: ['Tamamlandı', 'ok'], iptal: ['İptal', 'err'] };
  const WF = 'wfs';
  const fasonWh = () => { if (!db.get('warehouses', WF)) { db.col('warehouses').push({ id: WF, name: 'Fasoncudaki Malzeme', type: 'fason', locs: [] }); F.dirty(); } return WF; };
  const atSup = (f) => { const out = []; new Set((f.sent || []).map((s) => s.mat)).forEach((m) => rowsOf(m).filter((r) => r.wh === WF && r.loc === f.no && r.qty > 0).forEach((r) => out.push(r))); return out; };
  const open = (f) => !['tamam', 'iptal'].includes(f.status);
  function fasonEditor(app) {
    const boms = matOpts((m) => !!bomOf(m.id));
    if (!boms.length) return toast('Önce reçete tanımlayın', 'err'); if (!db.all('suppliers').length) return toast('Önce tedarikçi ekleyin', 'err');
    formModal({ title: 'Yeni fason iş', fields: [{ name: 'sup', label: 'Fasoncu', type: 'select', required: true, options: db.all('suppliers').map((s) => ({ value: s.id, label: s.name })) }, { name: 'mat', label: 'Üretilecek ürün', type: 'select', required: true, options: boms }, { name: 'qty', label: 'Miktar', type: 'number', step: 'any', required: true }, { name: 'price', label: 'Birim fason bedeli (₺, KDV hariç)', type: 'number', step: 'any', required: true }, { name: 'due', label: 'Termin', type: 'date', value: iso(addDays(new Date(), 7)) }, { name: 'note', label: 'Not', full: true }] }).then((v) => {
      if (!v) return; if (!(Number(v.qty) > 0) || Number(v.price) < 0) return toast('Miktar ve bedel geçerli olmalı', 'err');
      const b = bomOf(v.mat); const f = db.insert('fason', { ...v, qty: Number(v.qty), price: Number(v.price), no: 'FS' + db.nextNo('fason'), bom: b.id, date: today(), status: 'taslak', sent: [], issued: [], outLots: [], receipts: [], good: 0, scrap: 0 });
      db.log('Fason iş', `${f.no} · ${sup(f.sup).name}`); toast(`${f.no} oluşturuldu`, 'ok'); app.refresh();
    });
  }
  const needsOf = (f) => { const b = db.get('boms', f.bom) || bomOf(f.mat); if (!b) return []; return needOf(b, f.qty).map((n) => ({ ...n, rem: r3(Math.max(0, n.qty - sum((f.sent || []).filter((s) => s.mat === n.mat), (s) => s.qty))) })); };
  const fasonDoc = (f, batch, no) => ({ title: DOCS['fason-sevk'], no, date: new Date().toISOString(), party: { title: 'Fasoncu', name: sup(f.sup).name, lines: [sup(f.sup).city] }, info: [['Fason iş', f.no], ['Üretilecek', `${mat(f.mat).name} · ${num(f.qty)} ${mat(f.mat).unit}`], ['Plaka', batch.plate || '-'], ['Şoför', batch.driver || '-'], ['e-İrsaliye', batch.ebelge || (batch.ebelgeTest ? 'TEST — gönderilmedi' : '')]], lines: batch.lines.map((l) => docLine({ mat: l.mat, qty: l.qty, note: `Lot ${l.lot}` })), note: batch.ebelge ? 'Mal fason işçilik için gönderilmiştir; satış değildir.' : `Mal fason işçilik için gönderilmiştir; satış değildir. ${noInvoice}`, ...noPrice });
  function sendModal(app, f) {
    const plans = needsOf(f).filter((n) => n.rem > 0).map((n) => ({ n, ...pickPlan(n.mat, n.rem) }));
    if (!plans.length) return toast('Gönderilecek malzeme kalmadı', 'ok');
    modal({
      title: `${f.no} — malzeme gönder`, size: 'wide',
      body: `<div class="form-grid mb" id="hf">${NS.fieldsHtml([{ name: 'plate', label: 'Araç plakası', required: true }, { name: 'driver', label: 'Şoför' }, { name: 'eirs', label: 'e-İrsaliye düzenle', type: 'checkbox', value: false }], {})}</div>${table({ rows: plans.map((p, i) => ({ ...p, id: i })), columns: [{ label: 'Malzeme', render: (p) => `<b>${esc(mat(p.n.mat).name)}</b>` }, { label: 'Gönderilecek', cls: 'right', render: (p) => qu(p.n.rem, mat(p.n.mat)) }, { label: 'Lotlar (FEFO)', render: (p) => `<span class="small mono">${p.lines.map((r) => `${esc(r.lot)} (${num(r.qty)})`).join(', ') || '-'}</span>` }, { label: 'Durum', render: (p) => (p.short ? badge('Eksik ' + num(p.short), 'err') : badge('Hazır', 'ok')) + (p.expired ? ' ' + badge('SKT geçmiş ' + num(p.expired), 'warn') : '') }] })}`,
      actions: [{ label: 'Vazgeç' }, { label: 'Gönder', cls: 'primary', icon: 'truck', onClick: async (close, b) => {
        if (!NS.validate($('#hf', b))) return; const h = NS.readForm($('#hf', b)); const lines = plans.flatMap((p) => p.lines); if (!lines.length) return toast('Gönderilebilecek serbest stok yok', 'err');
        if (plans.some((p) => p.short) && !(await confirm('Bazı malzemelerde stok eksik. Mevcut miktar gönderilsin mi? (kalan sonra gönderilebilir)', { ok: 'Gönder', danger: false }))) return;
        fasonWh(); const no = `${f.no}-${(f.batches || []).length + 1}`; const batch = { no, at: new Date().toISOString(), plate: h.plate, driver: h.driver, lines: [] };
        lines.forEach((r) => { const c = unitCost(r.mat); move({ mat: r.mat, wh: r.wh, loc: r.loc, lot: r.lot, qty: -r.qty, cost: c, type: 'fason', ref: f.id, refNo: f.no }); move({ mat: r.mat, wh: WF, loc: f.no, lot: r.lot, qty: r.qty, cost: c, type: 'fason', ref: f.id, refNo: f.no }); f.sent.push({ mat: r.mat, lot: r.lot, wh: r.wh, loc: r.loc, qty: r.qty, cost: c, at: batch.at }); batch.lines.push({ mat: r.mat, lot: r.lot, qty: r.qty }); });
        if (f.status === 'taslak') f.status = 'sevk';
        if (h.eirs && NS.ebelge) { const su = sup(f.sup); const r = await NS.ebelge.create({ docType: 'e-İrsaliye', no, buyer: su.name, buyerVkn: su.taxNo, buyerTaxOffice: su.taxOffice, address: su.address || su.city || '', plate: h.plate, driver: h.driver, date: today(), note: 'Fason işçilik için gönderim', lines: batch.lines.map((l) => ({ code: mat(l.mat).code, name: `${mat(l.mat).name} (lot ${l.lot})`, qty: l.qty, unit: mat(l.mat).unit, price: 0 })) }); if (r && r.ok) { if (!r.simulated) batch.ebelge = r.no; batch.ebelgeTest = !!r.simulated; batch.ebelgeId = r.id; } }
        (f.batches = f.batches || []).push(batch); db.log('Fason sevk', no); db.save(); close(); toast(`${no} gönderildi, malzeme "Fasoncuda" deposuna geçti`, 'ok'); NS.docs.print('fason-sevk', fasonDoc(f, batch, no)); app.refresh();
      } }],
    });
  }
  // Kalan malzemeyi çıkıldığı depoya döndürür (iş kapanınca veya iptalde)
  function backHome(f) {
    let n = 0; atSup(f).forEach((r) => { const src = (f.sent || []).find((s) => s.lot === r.lot && s.mat === r.mat) || {}; const c = src.cost || unitCost(r.mat); move({ mat: r.mat, wh: WF, loc: f.no, lot: r.lot, qty: -r.qty, cost: c, type: 'fason', ref: f.id, refNo: f.no, note: 'Fasoncudan iade' }); move({ mat: r.mat, wh: src.wh || 'w3', loc: src.loc || '', lot: r.lot, qty: r.qty, cost: c, type: 'fason', ref: f.id, refNo: f.no, note: 'Fasoncudan iade' }); n++; }); return n;
  }
  function receiveModal(app, f) {
    const m = mat(f.mat); const tw = wh(F.outWh(m)); const left = r3(f.qty - (f.good || 0) - (f.scrap || 0));
    modal({
      title: `${f.no} — mamul teslim al`, size: 'wide',
      body: `<div class="row mb">${badge(m.name, 'acc')} ${badge(`Hedef ${num(f.qty)} ${m.unit}`)} ${badge(`Alınan ${num(f.good || 0)}`, 'ok')}</div><div class="form-grid" id="pf">${NS.fieldsHtml([{ name: 'good', label: `Sağlam miktar (${m.unit})`, type: 'number', step: 'any', required: true, value: Math.max(0, left) }, { name: 'scrap', label: 'Fire / hatalı', type: 'number', step: 'any', value: 0 }, { name: 'waybill', label: 'Fasoncu irsaliye no' }, { name: 'loc', label: `Giriş lokasyonu (${tw.name})`, type: 'select', options: tw.locs || [], value: m.loc }, { name: 'label', label: 'Lot etiketi yazdır', type: 'checkbox', value: true }], {})}</div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Teslim al', cls: 'primary', icon: 'check', onClick: async (close, b) => {
        if (!NS.validate($('#pf', b))) return; const v = NS.readForm($('#pf', b)); const good = r3(Number(v.good) || 0), scrap = r3(Number(v.scrap) || 0);
        if (good < 0 || scrap < 0) return toast('Miktar eksi olamaz', 'err'); if (good <= 0 && scrap <= 0) return toast('Miktar girin', 'err');
        if (r3(good + scrap) > left && !(await confirm(`Kalan ${num(left)} ${m.unit}. Fazlası da teslim alınsın mı?`, { ok: 'Teslim al', danger: false }))) return;
        const bm = db.get('boms', f.bom) || bomOf(f.mat); const issuedTo = (id) => sum((f.issued || []).filter((i) => i.mat === id), (i) => i.qty); let matCost = 0; const short = [];
        // Fasoncudaki malzeme, teslim alınan miktarın reçete ihtiyacı kadar tüketilir
        needOf(bm, (f.good || 0) + (f.scrap || 0) + good + scrap).forEach((n) => { let q = r3(n.qty - issuedTo(n.mat)); rowsOf(n.mat).filter((r) => r.wh === WF && r.loc === f.no && r.qty > 0).forEach((r) => { if (q <= 0) return; const t = r3(Math.min(q, r.qty)); const src = (f.sent || []).find((s) => s.lot === r.lot && s.mat === r.mat) || {}; const c = src.cost || unitCost(r.mat); move({ mat: r.mat, wh: WF, loc: f.no, lot: r.lot, qty: -t, cost: c, type: 'tuketim', ref: f.id, refNo: f.no }); f.issued.push({ mat: r.mat, lot: r.lot, qty: t, cost: c, at: new Date().toISOString() }); matCost += t * c; q = r3(q - t); }); if (q > 0) short.push(`${mat(n.mat).name} ${num(q)}`); });
        const costStd = short.length > 0 || !(good > 0); const unit = good > 0 ? (costStd ? r2(unitCost(f.mat) - (F.bomCost(bm).oc || 0) + f.price) : r2(matCost / good + f.price)) : 0;
        let lot = null; if (good > 0) { lot = createLot(m, { fason: f.id }); move({ mat: m.id, wh: F.outWh(m), loc: v.loc || m.loc, lot, qty: good, cost: unit, type: 'uretim', ref: f.id, refNo: f.no }); f.outLots.push(lot); }
        f.good = r3((f.good || 0) + good); f.scrap = r3((f.scrap || 0) + scrap); f.receipts.push({ at: new Date().toISOString(), good, scrap, lot, unit, waybill: v.waybill, by: me(), ...(costStd ? { costStd: true } : {}) });
        f.status = 'kismi'; db.log('Fason teslim', `${f.no} · ${num(good)} ${m.unit}`); db.save(); close(); toast(`${num(good)} ${m.unit} stoğa girdi${lot ? ' · lot ' + lot : ''}`, 'ok');
        if (short.length) toast(`Fasoncuda malzeme yetersiz görünüyor (${short.join(', ')}). Lot standart maliyetle girdi`, 'warn');
        if (v.label && lot) printLotLabels([{ mat: m.id, lot, qty: good }]);
        if (f.good + f.scrap >= f.qty * 0.98 && (await confirm('Hedef miktara ulaşıldı. Fason iş kapatılsın mı? Fasoncuda kalan malzeme depoya döner.', { ok: 'Kapat', danger: false }))) { backHome(f); f.status = 'tamam'; f.end = today(); db.save(); }
        app.refresh();
      } }],
    });
  }
  function fasonDetail(app, f) {
    const m = mat(f.mat); const left = atSup(f);
    modal({ title: `${f.no} · ${sup(f.sup).name}`, size: 'xl', body: `<div class="row mb">${badge(FST[f.status][0], FST[f.status][1])} ${badge(`${num(f.qty)} ${m.unit} ${m.name}`, 'acc')} <span class="small muted">Termin ${NS.date(f.due)}</span></div>
      <h3 class="mb">Fasoncudaki malzeme</h3>${table({ rows: left.map((r, i) => ({ ...r, id: i })), empty: 'Fasoncuda malzeme yok', columns: [{ label: 'Malzeme', render: (r) => esc(mat(r.mat).name) }, { label: 'Lot', render: (r) => `<span class="mono">${esc(r.lot)}</span>` }, { label: 'Kalan', cls: 'right', render: (r) => qu(r.qty, mat(r.mat)) }] })}
      <h3 class="mb mt">Teslimler</h3>${table({ rows: (f.receipts || []).map((r, i) => ({ ...r, id: i })), empty: 'Henüz teslim yok', columns: [{ label: 'Zaman', render: (r) => NS.dt(r.at) }, { label: 'Lot', render: (r) => `<span class="mono">${esc(r.lot || '-')}</span>` }, { label: 'Sağlam', cls: 'right', render: (r) => num(r.good) }, { label: 'Fire', cls: 'right', render: (r) => num(r.scrap) }, { label: 'Birim maliyet', cls: 'right', render: (r) => (r.unit ? money(r.unit) : '-') + (r.costStd ? ' ' + badge('Standart', 'warn') : '') }, { label: 'İrsaliye', render: (r) => esc(r.waybill || '') }] })}
      <div class="card pad mt small"><b>Fason bedeli:</b> ${money((f.good || 0) * f.price)} <span class="faint">(${num(f.good || 0)} × ${money(f.price)}, KDV hariç)</span>${f.invoice ? ` · Fatura ${esc(f.invoice)}` : ''}</div>`, actions: [{ label: 'Kapat', cls: 'primary' }] });
  }
  function fasonPage(el, p, app) {
    let q = ''; const all = db.all('fason');
    el.innerHTML = pageHead('Fason İşler', 'Malzemeyi fasoncuya gönderin, mamulü teslim alın, işçilik bedelini izleyin', `<button class="btn primary" id="nf">${icon('plus')} Yeni fason iş</button>`) + `
      <div class="grid g3 mb">${kpi('Açık iş', all.filter(open).length, 'cog', 'warn')}${kpi('Termini geçen', all.filter((f) => open(f) && f.due && f.due < today()).length, 'alert', 'err')}${kpi('Faturası gelmeyen bedel', money(sum(all.filter((f) => !f.invoice && f.status !== 'iptal'), (f) => (f.good || 0) * f.price)), 'wallet', 'info')}</div>
      <div class="card"><div class="card-h">${NS.searchBox('q', 'Fason no, fasoncu, ürün...')}</div><div id="t"></div></div>`;
    const draw = () => { const rows = db.all('fason', (f) => NS.match(q, f.no, sup(f.sup).name, mat(f.mat).name)).sort((a, b) => open(b) - open(a) || String(a.due).localeCompare(String(b.due))); $('#t', el).innerHTML = table({ rows: rows.slice(0, 300), empty: 'Fason iş yok', emptyIcon: 'truck', columns: [{ label: 'İş', render: (f) => `<b>${esc(f.no)}</b><div class="small faint">${NS.date(f.date)}</div>` }, { label: 'Fasoncu', render: (f) => esc(sup(f.sup).name) }, { label: 'Ürün', render: (f) => `${esc(mat(f.mat).name)}<div class="small faint">${num(f.good || 0)} / ${num(f.qty)} ${esc(mat(f.mat).unit)}${f.scrap ? ` · fire ${num(f.scrap)}` : ''}</div>` }, { label: 'Termin', render: (f) => (open(f) && f.due && f.due < today() ? badge(NS.date(f.due) + ' · gecikti', 'err') : NS.date(f.due)) }, { label: 'Bedel', cls: 'right', render: (f) => money((f.good || 0) * f.price) + (f.invoice ? `<div class="small faint">${esc(f.invoice)}</div>` : '') }, { label: 'Durum', render: (f) => badge(FST[f.status][0], FST[f.status][1]) }], actions: [{ icon: 'eye', act: 'dt', title: 'Detay' }, { label: 'Malzeme gönder', act: 'sd', show: (f) => open(f) && needsOf(f).some((n) => n.rem > 0) }, { label: 'Teslim al', act: 'rc', show: (f) => open(f) && f.status !== 'taslak' }, { label: 'Kapat', act: 'cl', show: (f) => f.status === 'kismi' }, { label: 'Fatura', act: 'fa', show: (f) => (f.good || 0) > 0 && !f.invoice }, { icon: 'x', act: 'cx', title: 'İptal', show: (f) => open(f) && !(f.good || f.scrap) }] }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); }; $('#nf', el).onclick = () => fasonEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => {
      const f = db.get('fason', b.dataset.id); const a = b.dataset.act; if (!f) return;
      if (a === 'dt') fasonDetail(app, f); else if (a === 'sd') sendModal(app, f); else if (a === 'rc') receiveModal(app, f);
      else if (a === 'cl') { if (await confirm(`${f.no} kapatılsın mı? Fasoncuda kalan malzeme çıkıldığı depoya döner.`, { ok: 'Kapat', danger: false })) { const n = backHome(f); f.status = 'tamam'; f.end = today(); db.log('Fason kapandı', f.no); db.save(); toast(`${f.no} kapandı${n ? ` · ${n} lot depoya döndü` : ''}`, 'ok'); app.refresh(); } }
      else if (a === 'fa') { const c = await NS.prompt('Fasoncu fatura no', '', { title: 'Fason faturası' }); if (c) { f.invoice = c; db.save(); app.refresh(); } }
      else if (await confirm(`${f.no} iptal edilsin mi?${(f.sent || []).length ? ' Fasoncudaki malzeme depoya döner.' : ''}`)) { backHome(f); f.status = 'iptal'; db.log('Fason iptal', f.no); db.save(); app.refresh(); }
    });
    draw();
  }

  // ---------- Maliyet analizi: genel üretim gideri dağıtımı + standart / gerçek farkı ----------
  const woMin = (w) => sum(w.ops || [], (o) => (o.min > 0 ? o.min : F.opStdMin(w, o)));
  const closedIn = (ym) => db.all('wo', (w) => w.status === 'tamam' && String(w.end || w.due).slice(0, 7) === ym);
  // Fark: gerçek − standart. Artı (kırmızı) maliyet aşımı. Fire kalemi, fire edilen miktarın standart malzemesidir; malzeme farkı bunu içermez.
  function variance(w) {
    const b = db.get('boms', w.bom) || bomOf(w.mat); if (!b) return null; const c = F.woCost(w); if (!(c.mc > 0)) return null;
    const bc = F.bomCost(b); const p = w.produced || 0, s = w.scrap || 0;
    const mat_ = r2(c.mc - bc.mc * (p + s)); const fire = r2(bc.mc * s); const lab = r2(sum((w.ops || []).filter((o) => o.min > 0), (o) => ((o.min - F.opStdMin(w, o)) / 60) * stn(o.station).cph));
    return { w, id: w.id, std: r2(bc.mc * p + c.ocStd + sum((w.ops || []).filter((o) => o.min > 0), (o) => (F.opStdMin(w, o) / 60) * stn(o.station).cph)), act: r2(c.mc + c.oc + c.ocStd), mat: mat_, fire, lab, part: c.ocStd > 0 };
  }
  const vCell = (v) => `<b style="color:${v > 0.005 ? 'var(--err)' : v < -0.005 ? 'var(--ok)' : 'inherit'}">${v > 0 ? '+' : ''}${money(v)}</b>`;
  function costPage(el, p, app) {
    const tab = (p || 'gider').split('|')[0]; let ym = today().slice(0, 7);
    const head = pageHead('Maliyet Analizi', 'Genel üretim giderinin iş emirlerine dağıtımı ve standart / gerçek maliyet farkı', `<input class="input" type="month" id="ym" value="${ym}" style="max-width:170px">`) + `<div class="tabs">${[['gider', 'Genel gider dağıtımı'], ['fark', 'Maliyet farkı']].map(([k, l]) => `<a href="#/maliyet/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div><div id="t"></div>`;
    el.innerHTML = head; const t = $('#t', el);
    const gider = () => {
      const ohs = db.all('overheads', (o) => o.month === ym); const tot = sum(ohs, (o) => Number(o.amount) || 0); const wos = closedIn(ym); const base = sum(wos, woMin); const rate = base > 0 ? tot / base : 0;
      const rows = wos.map((w) => { const min = woMin(w); const oh = r2(min * rate); return { id: w.id, w, min, oh, unit: w.produced ? r2(oh / w.produced) : 0, full: w.produced ? r2(F.woCost(w).unit + oh / w.produced) : 0 }; }).sort((a, b) => b.oh - a.oh);
      t.innerHTML = `<div class="grid g4 mb">${kpi('Toplam gider', money(tot), 'wallet', 'info')}${kpi('Kapanan iş emri', wos.length, 'cog')}${kpi('Üretim süresi', num(Math.round(base)) + ' dk', 'clock')}${kpi('Dakika başı gider', base ? money(rate) : '-', 'gauge', 'warn')}</div>
        <div class="card pad mb small">Dağıtım anahtarı: iş emrinin operasyon süresi (ölçülen, yoksa standart). Bu hesap <b>bilgi amaçlıdır; stok ve lot değerini değiştirmez</b>. Genel giderin stok maliyetine katılması mali müşavir kararıdır.</div>
        <div class="grid g2"><div class="card"><div class="card-h"><h3>Bu ayın giderleri</h3>${app.can('uretim') ? `<button class="btn sm primary" id="na">${icon('plus')} Gider ekle</button>` : ''}</div>${table({ rows: ohs, empty: 'Bu ay için gider girilmedi', emptyIcon: 'wallet', columns: [{ label: 'Gider', render: (o) => esc(o.name) }, { label: 'Tutar', cls: 'right', render: (o) => money(o.amount) }], actions: [{ icon: 'edit', act: 'oe' }, { icon: 'trash', act: 'od' }] })}</div>
        <div class="card"><div class="card-h"><h3>İş emirlerine dağılım</h3><button class="btn sm" id="ex">${icon('download')}</button></div>${table({ rows: rows.slice(0, 200), empty: 'Bu ay kapanan iş emri yok; gider dağıtılamaz', emptyIcon: 'cog', columns: [{ label: 'İş emri', render: (r) => `<b>${esc(r.w.no)}</b><div class="small faint">${esc(mat(r.w.mat).name)}</div>` }, { label: 'Süre', cls: 'right', render: (r) => num(Math.round(r.min)) + ' dk' }, { label: 'Pay', cls: 'right', render: (r) => money(r.oh) }, { label: 'Birime düşen', cls: 'right', render: (r) => money(r.unit) }, { label: 'Giderli birim', cls: 'right', render: (r) => `<b>${money(r.full)}</b>` }] })}</div></div>`;
      const ed = async (o) => { const v = await formModal({ title: o ? 'Gideri düzenle' : 'Genel üretim gideri', fields: [{ name: 'name', label: 'Gider (elektrik, kira...)', required: true, full: true }, { name: 'amount', label: 'Aylık tutar (₺)', type: 'number', step: 'any', required: true }], values: o || {} }); if (!v) return; if (!(Number(v.amount) >= 0)) return toast('Tutar geçerli olmalı', 'err'); if (o) db.update('overheads', o.id, { ...v, amount: Number(v.amount) }); else db.insert('overheads', { ...v, amount: Number(v.amount), month: ym }); gider(); };
      if ($('#na', t)) $('#na', t).onclick = () => ed(); t._ed = ed;
      $('#ex', t).onclick = () => NS.csv('genel-gider-' + ym, rows, [{ label: 'İş emri', value: (r) => r.w.no }, { label: 'Ürün', value: (r) => mat(r.w.mat).name }, { label: 'Süre (dk)', value: (r) => Math.round(r.min) }, { label: 'Gider payı', value: (r) => r.oh }, { label: 'Birime düşen', value: (r) => r.unit }, { label: 'Giderli birim maliyet', value: (r) => r.full }]);
    };
    const fark = () => {
      const wos = closedIn(ym); const rows = wos.map(variance).filter(Boolean).sort((a, b) => Math.abs(b.act - b.std) - Math.abs(a.act - a.std)); const skip = wos.length - rows.length;
      t.innerHTML = `<div class="grid g4 mb">${kpi('Malzeme farkı', vCell(r2(sum(rows, (r) => r.mat))), 'box')}${kpi('İşçilik / makine farkı', vCell(r2(sum(rows, (r) => r.lab))), 'clock')}${kpi('Fire maliyeti', vCell(r2(sum(rows, (r) => r.fire))), 'x')}${kpi('Toplam fark', vCell(r2(sum(rows, (r) => r.act - r.std))), 'wallet')}</div>
        <div class="card pad mb small">Artı değer maliyet aşımıdır. Standart, bugünkü reçete ve kart maliyetinden hesaplanır. Süresi ölçülmeyen operasyonlarda işçilik farkı yoktur (standart alındı); bu satırlar işaretlidir.${skip ? ` <b>${skip} iş emri</b> malzeme çıkışı olmadığı için hesaba girmedi.` : ''}</div>
        <div class="card"><div class="card-h"><h3>İş emri bazında fark</h3><button class="btn sm" id="ex">${icon('download')}</button></div>${table({ rows: rows.slice(0, 200), empty: 'Bu ay karşılaştırılacak iş emri yok', emptyIcon: 'chart', columns: [{ label: 'İş emri', render: (r) => `<b>${esc(r.w.no)}</b><div class="small faint">${esc(mat(r.w.mat).name)} · ${num(r.w.produced || 0)} ${esc(mat(r.w.mat).unit)}</div>` }, { label: 'Standart', cls: 'right', render: (r) => money(r.std) }, { label: 'Gerçek', cls: 'right', render: (r) => money(r.act) }, { label: 'Malzeme', cls: 'right', render: (r) => vCell(r.mat) }, { label: 'İşçilik', cls: 'right', render: (r) => vCell(r.lab) + (r.part ? `<div>${badge('Kısmen standart', 'warn')}</div>` : '') }, { label: 'Fire', cls: 'right', render: (r) => vCell(r.fire) }, { label: 'Toplam', cls: 'right', render: (r) => vCell(r2(r.act - r.std)) }] })}</div>`;
      $('#ex', t).onclick = () => NS.csv('maliyet-farki-' + ym, rows, [{ label: 'İş emri', value: (r) => r.w.no }, { label: 'Ürün', value: (r) => mat(r.w.mat).name }, { label: 'Standart', value: (r) => r.std }, { label: 'Gerçek', value: (r) => r.act }, { label: 'Malzeme farkı', value: (r) => r.mat }, { label: 'İşçilik farkı', value: (r) => r.lab }, { label: 'Fire', value: (r) => r.fire }]);
    };
    const draw = tab === 'fark' ? fark : gider;
    $('#ym', el).onchange = (e) => { ym = e.target.value || ym; draw(); };
    on(t, 'click', '[data-act]', async (e, b) => { const o = db.get('overheads', b.dataset.id); if (!o) return; if (!app.can('uretim')) return toast('Bu işlem için yetkiniz yok', 'err'); if (b.dataset.act === 'oe') t._ed(o); else if (await confirm('Gider silinsin mi?')) { db.remove('overheads', o.id); draw(); } });
    draw();
  }

  Object.assign(F.pages, { operator: operatorPage, fason: fasonPage, maliyet: costPage });
})();
