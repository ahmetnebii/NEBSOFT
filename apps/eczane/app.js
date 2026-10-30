/* NEBSOFT Eczane — reçeteli/elden satış, katkı payı, parti/SKT stok, muadil, kronik hasta, depo siparişi, nöbet */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const RX = { yok: 'Reçetesiz (OTC)', normal: 'Normal reçete', kirmizi: 'Kırmızı reçete', yesil: 'Yeşil reçete', mor: 'Mor reçete', turuncu: 'Turuncu reçete' };
  const INST = { sgk: 'SGK', ozel: 'Özel sigorta', ucretli: 'Ücretli (kendisi)' };
  const r2 = (n) => Math.round(n * 100) / 100;

  function seed(db) {
    db.data._settings = { bizName: 'Şifa Eczanesi', bizPhone: '0216 345 67 89', bizAddress: 'Kadıköy, Söğütlüçeşme Cad. No:12', pharmacist: 'Ecz. Selin Aydın', gln: '8680000123456', patientPct: 20, retiredPct: 10, rxFee: 5, sktWarnDays: 90 };
    db.data.users = [{ id: 'u1', name: 'Ecz. Selin Aydın', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Kalfa Murat', role: 'kalfa', pin: '1234', active: true }];
    // Kurgusal marka adları; etken maddeler gerçek
    const D = [
      ['Paranol 500 mg 20 tablet', 'Parasetamol', 'Tablet', 'yok', true, 48, 'İlaç'], ['Termofen 500 mg 20 tablet', 'Parasetamol', 'Tablet', 'yok', true, 42, 'İlaç'], ['Ibufen 400 mg 20 tablet', 'İbuprofen', 'Tablet', 'yok', true, 62, 'İlaç'],
      ['Amoksilin 1000 mg 14 tablet', 'Amoksisilin + Klavulanik asit', 'Tablet', 'normal', true, 185, 'İlaç'], ['Klavomed 1000 mg 14 tablet', 'Amoksisilin + Klavulanik asit', 'Tablet', 'normal', true, 162, 'İlaç'],
      ['Metfor 1000 mg 100 tablet', 'Metformin', 'Tablet', 'normal', true, 138, 'İlaç'], ['Glukomet 850 mg 100 tablet', 'Metformin', 'Tablet', 'normal', true, 112, 'İlaç'],
      ['Tansinorm 5 mg 30 tablet', 'Amlodipin', 'Tablet', 'normal', true, 96, 'İlaç'], ['Amlovas 10 mg 30 tablet', 'Amlodipin', 'Tablet', 'normal', true, 118, 'İlaç'],
      ['Kolestat 20 mg 28 tablet', 'Atorvastatin', 'Tablet', 'normal', true, 214, 'İlaç'], ['Atorlip 40 mg 28 tablet', 'Atorvastatin', 'Tablet', 'normal', true, 268, 'İlaç'],
      ['Levotir 100 mcg 50 tablet', 'Levotiroksin', 'Tablet', 'normal', true, 74, 'İlaç'], ['Pantomid 40 mg 28 tablet', 'Pantoprazol', 'Tablet', 'normal', true, 156, 'İlaç'], ['Gastroprol 40 mg 28 tablet', 'Pantoprazol', 'Tablet', 'normal', true, 142, 'İlaç'],
      ['Sertrin 50 mg 28 tablet', 'Sertralin', 'Tablet', 'normal', true, 128, 'İlaç'], ['Alprax 0,5 mg 50 tablet', 'Alprazolam', 'Tablet', 'yesil', true, 98, 'İlaç'], ['Tramadin 50 mg 20 kapsül', 'Tramadol', 'Kapsül', 'kirmizi', true, 145, 'İlaç'],
      ['Desloran 5 mg 20 tablet', 'Desloratadin', 'Tablet', 'normal', true, 88, 'İlaç'], ['Öksürük şurubu 150 ml', 'Dekstrometorfan', 'Şurup', 'yok', false, 165, 'İlaç'], ['Burun spreyi 15 ml', 'Ksilometazolin', 'Sprey', 'yok', false, 92, 'İlaç'],
      ['İnsülin kalem 3 ml x5', 'İnsülin glarjin', 'Enjeksiyon', 'normal', true, 1450, 'İlaç'], ['Ventolin inhaler 200 doz', 'Salbutamol', 'İnhaler', 'normal', true, 134, 'İlaç'],
      ['C vitamini 1000 mg 30 efervesan', 'Askorbik asit', 'Efervesan', 'yok', false, 210, 'Vitamin'], ['D3 vitamini damla 50 ml', 'Kolekalsiferol', 'Damla', 'yok', false, 245, 'Vitamin'], ['Omega-3 60 kapsül', 'Balık yağı', 'Kapsül', 'yok', false, 520, 'Vitamin'], ['Magnezyum 30 tablet', 'Magnezyum sitrat', 'Tablet', 'yok', false, 290, 'Vitamin'],
      ['Güneş kremi SPF50 50 ml', '-', 'Krem', 'yok', false, 680, 'Dermokozmetik'], ['Nemlendirici krem 200 ml', '-', 'Krem', 'yok', false, 540, 'Dermokozmetik'], ['Bebek pişik kremi 100 g', 'Çinko oksit', 'Krem', 'yok', false, 185, 'Dermokozmetik'],
      ['Tansiyon aleti (koldan)', '-', 'Cihaz', 'yok', false, 1650, 'Medikal'], ['Şeker ölçüm stribi 50 adet', '-', 'Sarf', 'yok', true, 420, 'Medikal'], ['Cerrahi maske 50 adet', '-', 'Sarf', 'yok', false, 95, 'Medikal'],
    ];
    let bc = 8699500000000;
    db.data.drugs = D.map(([name, active, form, rx, sgk, price, cat], i) => ({ id: 'd' + i, name, active, form, rx, sgk, price, diff: sgk && Math.random() < 0.35 ? rand(3, 25) : 0, cat, barcode: String(bc + i * 13 + 7), min: cat === 'İlaç' ? rand(4, 10) : 3 }));
    const lots = [];
    db.data.drugs.forEach((d) => { for (let k = 0; k < rand(1, 3); k++) lots.push({ id: NS.uid(), drug: d.id, lot: 'L' + rand(10000, 99999), skt: iso(addDays(new Date(), pick([rand(-20, 30), rand(31, 120), rand(150, 900), rand(150, 900), rand(300, 900)]))), qty: rand(0, 18), cost: r2(d.price * 0.75) }); });
    db.data.lots = lots;
    db.data.patients = NS.NAMES.slice(0, 20).map((n, i) => ({ id: 'h' + i, name: n, tc: String(rand(10000000000, 99999999999)), phone: NS.phone(), retired: i % 4 === 0, chronic: i % 2 ? [pick(['d5', 'd7', 'd9', 'd11', 'd12', 'd20'])] : [], allergy: i % 7 === 0 ? 'Penisilin alerjisi' : '' }));
    const sales = []; let no = 7000;
    for (let d = 30; d >= 0; d--) for (let k = 0; k < rand(15, 35); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(9, 21), rand(0, 59)); if (at > new Date()) continue;
      const isRx = Math.random() < 0.55; const pt = isRx ? pick(db.data.patients) : null;
      const pool = db.data.drugs.filter((x) => (isRx ? x.rx !== 'yok' && x.sgk : x.rx === 'yok'));
      const items = Array.from({ length: rand(1, 3) }, () => { const x = pick(pool); return { drug: x.id, name: x.name, qty: 1, price: x.price, diff: x.diff, sgk: x.sgk, rx: x.rx }; });
      const c = calc({ mode: isRx ? 'recete' : 'elden', inst: 'sgk', retired: pt && pt.retired, items }, db.data._settings);
      sales.push({ id: NS.uid(), no: 'S' + ++no, at: at.toISOString(), mode: isRx ? 'recete' : 'elden', inst: isRx ? 'sgk' : null, rxNo: isRx ? Math.random().toString(36).slice(2, 9).toUpperCase() : '', patient: pt ? pt.id : null, items, ...c, pay: pick(['nakit', 'kart', 'kart']), user: pick(['u1', 'u2']) });
      if (pt) pt.lastBuy = at.toISOString();
    }
    db.data.sales = sales; db.data._meta._seq_sales = no;
    db.data.depots = [{ id: 'dp1', name: 'Selçuk Ecza Deposu' }, { id: 'dp2', name: 'Hedef Alliance' }, { id: 'dp3', name: 'Neo Ecza Deposu' }];
    db.data.orders = [];
    const duty = []; for (let k = -10; k < 40; k += rand(6, 12)) duty.push({ id: NS.uid(), date: iso(addDays(new Date(), k)), note: 'Gece nöbeti 19:00 – 08:30' });
    db.data.duty = duty;
  }
  // Satış hesabı: elden → tam fiyat; reçeteli SGK → hasta katılım payı + eşdeğer fark + reçete katılımı, kalanı SGK
  function calc(c, s) {
    let total = 0, patient = 0, inst = 0;
    const pct = (c.retired ? s.retiredPct : s.patientPct) / 100;
    c.items.forEach((i) => {
      const line = i.price * i.qty; total += line;
      if (c.mode === 'recete' && c.inst === 'sgk' && i.sgk) { const p = line * pct + (i.diff || 0) * i.qty; patient += p; inst += line - line * pct; }
      else if (c.mode === 'recete' && c.inst === 'ozel') { patient += line * 0.1; inst += line * 0.9; }
      else patient += line;
    });
    const rxFee = c.mode === 'recete' && c.inst === 'sgk' && c.items.length ? s.rxFee : 0;
    return { total: r2(total + rxFee), patientPay: r2(patient + rxFee), instPay: r2(inst), rxFee };
  }
  const db = new NS.DB('eczane', seed);
  const S = () => db.settings({ patientPct: 20, retiredPct: 10, rxFee: 5, sktWarnDays: 90 });
  const drug = (id) => db.get('drugs', id) || { name: '-', price: 0 };
  const pat = (id) => db.get('patients', id) || { name: '-' };
  const lotsOf = (id) => db.all('lots', (l) => l.drug === id && l.qty > 0).sort((a, b) => a.skt.localeCompare(b.skt));
  const stock = (id) => sum(db.all('lots', (l) => l.drug === id && l.skt >= today()), (l) => l.qty);
  const nearSkt = (id) => { const l = lotsOf(id).filter((x) => x.skt >= today())[0]; return l ? l.skt : null; };
  const rxDot = (r) => `<span class="rx rx-${r}" title="${RX[r]}"></span>`;
  const equivalents = (d) => (d.active && d.active !== '-' ? db.all('drugs', (x) => x.active === d.active && x.id !== d.id) : []);

  // ---------- Satış ----------
  let sale = newSale();
  // Açık olan resmi bağlantılara sessiz çağrı (kapalıysa null)
  const ig = (k, a, p) => (NS.integ && NS.integ.isOn(k) ? NS.integ.call(k, a, p, { silent: true }) : Promise.resolve(null));
  function newSale() { return { mode: 'elden', inst: 'sgk', patient: null, rxNo: '', doctor: '', items: [] }; }
  function salePage(el, p, app) {
    const draw = () => {
      const pt = sale.patient ? pat(sale.patient) : null;
      const c = calc({ ...sale, retired: pt && pt.retired }, S());
      const needsRx = sale.items.filter((i) => i.rx !== 'yok');
      el.innerHTML = `<div class="sale"><div class="col">
          <div class="search">${icon('barcode')}<input class="input lg" id="sc" placeholder="Karekod / barkod okutun veya ilaç, etken madde yazın" autocomplete="off"></div>
          <div class="card" id="res"></div>
          ${sale.items.length ? `<div class="card"><div class="card-h"><h3>${icon('layers')} Muadil öneriler</h3><span class="small muted">Aynı etken maddeli, hasta için daha uygun seçenekler</span></div><div class="card-b">${sale.items.map((i) => { const eq = equivalents(drug(i.drug)).filter((x) => stock(x.id) > 0); return eq.length ? `<div class="list-item small"><span class="grow"><b>${esc(i.name)}</b> → ${eq.map((x) => `<button class="btn sm" data-swap="${i.drug}|${x.id}">${esc(x.name.split(' ')[0])} ${money(x.price)}${x.price < i.price ? ` <span style="color:var(--ok)">(-${money(i.price - x.price)})</span>` : ''}</button>`).join(' ')}</span></div>` : ''; }).join('') || '<div class="faint small">Sepetteki ilaçların stokta muadili yok</div>'}</div></div>` : ''}
        </div>
        <div class="card"><div class="mode"><button class="btn ${sale.mode === 'elden' ? 'on' : ''}" data-mode="elden">${icon('bag')} Elden satış</button><button class="btn ${sale.mode === 'recete' ? 'on' : ''}" data-mode="recete">${icon('file')} Reçeteli</button></div>
          ${sale.mode === 'recete' ? `<div class="card-b col" style="border-bottom:1px solid var(--border)"><div class="row nw"><select class="input" id="pt"><option value="">Hasta seçin...</option>${db.all('patients').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((x) => `<option value="${x.id}" ${x.id === sale.patient ? 'selected' : ''}>${esc(x.name)} · ${esc(x.tc.slice(0, 3))}*****${esc(x.tc.slice(-3))}</option>`).join('')}</select><button class="btn icon" id="ptn">${icon('plus')}</button></div>
            ${pt && pt.allergy ? `<div>${badge(pt.allergy, 'err')}</div>` : ''}${pt && pt.retired ? `<div>${badge('Emekli — katılım %' + S().retiredPct, 'info')}</div>` : ''}${sale.rxVerified ? `<div>${badge('MEDULA: reçete doğrulandı ' + sale.rxVerified, 'ok')}</div>` : ''}
            <div class="row nw"><input class="input" id="rxno" placeholder="E-reçete no" value="${esc(sale.rxNo)}"><button class="btn icon" id="rxq" title="MEDULA reçete sorgu">${icon('search')}</button><select class="input" id="inst">${Object.entries(INST).map(([k, v]) => `<option value="${k}" ${k === sale.inst ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>` : ''}
          <div>${sale.items.length ? sale.items.map((i, k) => { const d = drug(i.drug); return `<div class="line"><b>${rxDot(i.rx)} ${esc(i.name)}</b><b>${money(i.price * i.qty)}</b><div class="meta"><button class="btn sm icon" data-q="${k}|-1">${icon('minus')}</button><b>${i.qty}</b><button class="btn sm icon" data-q="${k}|1">${icon('plus')}</button>${i.sgk ? badge('SGK', 'info') : ''}${i.diff && sale.mode === 'recete' ? badge('Fark ' + money(i.diff), 'warn') : ''}<span class="grow"></span><span class="faint">stok ${stock(d.id)}</span><button class="btn sm ghost icon" data-x="${k}">${icon('x')}</button></div></div>`; }).join('') : `<div class="empty">${icon('pill')}<div>Karekod okutarak başlayın</div></div>`}</div>
          ${sale.mode === 'elden' && needsRx.length ? `<div class="card-b small" style="background:var(--err-soft);color:var(--err)">${icon('alert')} ${needsRx.length} reçeteli ilaç var — elden satılamaz, reçeteli moda geçin.</div>` : ''}
          <div class="pay-split"><div class="row between small"><span>İlaç bedeli</span><span>${money(c.total - c.rxFee)}</span></div>${c.rxFee ? `<div class="row between small"><span>Reçete katılım payı</span><span>${money(c.rxFee)}</span></div>` : ''}${c.instPay ? `<div class="row between small" style="color:var(--info)"><span>${INST[sale.inst]} öder</span><span>${money(c.instPay)}</span></div>` : ''}
            <div class="row between mt"><span class="muted">HASTA ÖDER</span><b style="font-size:30px">${money(c.patientPay)}</b></div>
            <div class="row mt"><button class="btn ok lg grow" data-pay="nakit" ${sale.items.length ? '' : 'disabled'}>${icon('cash')} Nakit</button><button class="btn primary lg grow" data-pay="kart" ${sale.items.length ? '' : 'disabled'}>${icon('card')} Kart</button></div>
            <button class="btn ghost block mt" id="clr">${icon('trash')} Temizle</button></div></div></div>`;
      const sc = $('#sc', el); sc.focus();
      const results = (q) => { const r = q ? db.all('drugs', (d) => NS.match(q, d.name, d.active, d.barcode)).slice(0, 8) : []; $('#res', el).innerHTML = r.length ? table({ rows: r, columns: [{ label: 'İlaç', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b><div class="small faint">${esc(d.active)} · ${esc(d.form)}</div>` }, { label: 'Fiyat', cls: 'right', render: (d) => money(d.price) }, { label: 'Stok / SKT', cls: 'right', render: (d) => `${stock(d.id) ? stock(d.id) : badge('Yok', 'err')}<div class="small faint">${nearSkt(d.id) ? NS.date(nearSkt(d.id)) : ''}</div>` }], actions: [{ icon: 'plus', act: 'add' }] }) : '<div class="card-b small muted">İlaç adı, etken madde (ör. "metformin") veya barkod ile arayın.' + (db.all('drugs')[0] ? ' Örnek barkod: ' + esc(db.all('drugs')[0].barcode) : ' Önce İlaç & Stok ekranından ürün ekleyin.') + '</div>'; };
      sc.oninput = () => results(sc.value);
      sc.onkeydown = (e) => { if (e.key !== 'Enter') return; const d = db.find('drugs', (x) => x.barcode === sc.value.trim()) || (db.all('drugs', (x) => NS.match(sc.value, x.name, x.active)).length === 1 && db.all('drugs', (x) => NS.match(sc.value, x.name, x.active))[0]); if (d) add(d); else results(sc.value); };
      results('');
      if ($('#pt', el)) { $('#pt', el).onchange = (e) => { sale.patient = e.target.value || null; draw(); }; $('#rxno', el).oninput = (e) => { sale.rxNo = e.target.value; sale.rxVerified = null; }; $('#rxq', el).onclick = async () => { if (!sale.rxNo) return toast('E-reçete numarası girin', 'err'); const r = await NS.integ.call('medula', 'recete-sorgu', { rxNo: sale.rxNo, tc: sale.patient ? pat(sale.patient).tc : '' }); if (r && r.simulated) { toast('MEDULA TEST — reçete sorgulanmadı (simülasyon); provizyonu MEDULA’dan kontrol edin', 'warn'); } else if (r && r.ok) { sale.rxVerified = r.ref; draw(); } }; $('#inst', el).onchange = (e) => { sale.inst = e.target.value; draw(); }; $('#ptn', el).onclick = async () => { const v = await formModal({ title: 'Yeni hasta', fields: PF }); if (v) { const n = db.insert('patients', { ...v, chronic: [] }); sale.patient = n.id; draw(); } }; }
      $('#clr', el).onclick = () => { sale = newSale(); draw(); };
    };
    const add = (d) => {
      if (stock(d.id) <= sum(sale.items.filter((i) => i.drug === d.id), (i) => i.qty)) { NS.beep(220, 250); return toast(`${d.name} stokta yok`, 'err'); }
      if (d.rx !== 'yok' && sale.mode === 'elden') toast(`${RX[d.rx]} gerektirir`, '');
      if (['kirmizi', 'yesil'].includes(d.rx)) toast(`Dikkat: ${RX[d.rx]} — hasta kimliği ve reçete aslı kontrol edilmeli`, 'err');
      const ex = sale.items.find((i) => i.drug === d.id); if (ex) ex.qty++; else sale.items.push({ drug: d.id, name: d.name, qty: 1, price: d.price, diff: d.diff, sgk: d.sgk, rx: d.rx });
      NS.beep(1200, 50); draw();
    };
    on(el, 'click', '[data-act=add]', (e, b) => add(drug(b.dataset.id)));
    on(el, 'click', '[data-mode]', (e, b) => { sale.mode = b.dataset.mode; draw(); });
    on(el, 'click', '[data-q]', (e, b) => { const [k, d] = b.dataset.q.split('|').map(Number); sale.items[k].qty += d; if (sale.items[k].qty <= 0) sale.items.splice(k, 1); draw(); });
    on(el, 'click', '[data-x]', (e, b) => { sale.items.splice(Number(b.dataset.x), 1); draw(); });
    on(el, 'click', '[data-swap]', (e, b) => { const [from, to] = b.dataset.swap.split('|'); const i = sale.items.find((x) => x.drug === from); const d = drug(to); Object.assign(i, { drug: d.id, name: d.name, price: d.price, diff: d.diff, sgk: d.sgk, rx: d.rx }); toast('Muadil ile değiştirildi', 'ok'); draw(); });
    on(el, 'click', '[data-pay]', async (e, b) => {
      if (sale.mode === 'elden' && sale.items.some((i) => i.rx !== 'yok')) return toast('Reçeteli ilaçlar elden satılamaz', 'err');
      if (sale.mode === 'recete' && (!sale.patient || !sale.rxNo)) return toast('Hasta ve e-reçete numarası girin', 'err');
      const pt = sale.patient ? pat(sale.patient) : null;
      const c = calc({ ...sale, retired: pt && pt.retired }, S());
      if (b.dataset.pay === 'kart' && c.patientPay > 0 && NS.integ) { const r = await NS.integ.cardPayment(c.patientPay); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); }
      // Stok düşümü: son kullanma tarihi en yakın partiden başlayarak (FEFO)
      sale.items.forEach((i) => { let need = i.qty; lotsOf(i.drug).filter((l) => l.skt >= today()).forEach((l) => { const t = Math.min(need, l.qty); l.qty -= t; need -= t; }); });
      const s = db.insert('sales', { no: db.nextNo('sales', 'S'), at: new Date().toISOString(), mode: sale.mode, inst: sale.mode === 'recete' ? sale.inst : null, rxNo: sale.rxNo, patient: sale.patient, items: sale.items.map((i) => ({ ...i })), ...c, pay: b.dataset.pay, user: (NS.currentUser || {}).id });
      if (pt) { pt.lastBuy = s.at; db.save(); }
      // Resmi bildirimler: MEDULA provizyon (reçeteli), İTS satış bildirimi (karekodlu), ÖKC mali fiş
      const items = s.items.map((i) => ({ barcode: drug(i.drug).barcode, name: i.name, qty: i.qty, price: i.price }));
      Promise.all([s.mode === 'recete' ? ig('medula', 'provizyon', { rxNo: s.rxNo, tc: pt ? pt.tc : '', inst: s.inst, items, instPay: s.instPay, patientPay: s.patientPay }) : null, ig('its', 'satis-bildirim', { no: s.no, tc: pt ? pt.tc : '', items }), ig('okc', 'mali-fis', { no: s.no, total: s.patientPay, pay: s.pay, items })]).then(([m, i, o]) => { // Simülasyon sonucu "TEST" yazılır (gerçek bildirim sanılmasın); doğrulanmamış bağlayıcı "hata" (gönderilmedi)
      const st = (x) => (!x ? null : x.simulated ? 'TEST' : x.ok ? x.ref : 'hata'); s.medula = st(m); s.its = st(i); s.okc = o && o.ok && !o.simulated ? o.ref : o && o.simulated ? 'TEST' : null; db.save(); if ((m && !m.ok) || (i && !i.ok)) toast('Bazı resmi bildirimler gönderilemedi — Satışlar ekranından tekrar deneyin', 'err'); });
      printReceipt(s); toast(`Satış tamamlandı · hasta ${money(c.patientPay)}`, 'ok');
      sale = newSale(); app.refresh();
    });
    draw();
  }
  function printReceipt(s) {
    const st = S();
    (NS.integ ? NS.integ.printReceipt : NS.printHtml)(`<div class="c"><div class="big">${esc(st.bizName)}</div><div>${esc(st.bizAddress)}</div><div>${esc(st.pharmacist)}</div></div><hr><div class="r"><span>${NS.dt(s.at)}</span><span>${esc(s.no)}</span></div>${s.mode === 'recete' ? `<div>Reçete: ${esc(s.rxNo)} · ${INST[s.inst]}</div><div>Hasta: ${esc(pat(s.patient).name)}</div>` : ''}<hr>${s.items.map((i) => `<div>${esc(i.name)}</div><div class="r"><span>${i.qty} x ${money(i.price)}</span><span>${money(i.qty * i.price)}</span></div>`).join('')}<hr>${s.rxFee ? `<div class="r"><span>Reçete katılım</span><span>${money(s.rxFee)}</span></div>` : ''}${s.instPay ? `<div class="r"><span>Kurum payı</span><span>${money(s.instPay)}</span></div>` : ''}<div class="r big"><span>ÖDENEN</span><span>${money(s.patientPay)}</span></div><hr><div class="c">Geçmiş olsun · Mali değeri yoktur</div>`, { title: s.no });
  }

  // ---------- İlaçlar / stok / SKT ----------
  const DF = [{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'barcode', label: 'Barkod (GTIN)' }, { name: 'active', label: 'Etken madde' }, { name: 'form', label: 'Form', type: 'select', options: ['Tablet', 'Kapsül', 'Şurup', 'Krem', 'Damla', 'Sprey', 'Enjeksiyon', 'İnhaler', 'Efervesan', 'Cihaz', 'Sarf'] }, { name: 'cat', label: 'Kategori', type: 'select', options: ['İlaç', 'Vitamin', 'Dermokozmetik', 'Medikal'] }, { name: 'rx', label: 'Reçete türü', type: 'select', options: Object.entries(RX).map(([value, label]) => ({ value, label })) }, { name: 'price', label: 'Perakende satış fiyatı (₺)', type: 'number', required: true }, { name: 'diff', label: 'Eşdeğer fark ücreti (₺)', type: 'number' }, { name: 'min', label: 'Kritik stok', type: 'number' }, { name: 'sgk', label: 'SGK ödemeli', type: 'checkbox' }];
  function drugsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'drugs', title: 'İlaç & Ürün Kartları', sub: 'Reçete türü, SGK durumu, fiyat ve stok', single: 'Ürün', addLabel: 'Yeni ürün', emptyIcon: 'pill', fields: DF, defaults: { rx: 'yok', cat: 'İlaç', min: 5 },
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (d) => [d.name, d.active, d.barcode],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'rx', label: 'Reçeteli', test: (d) => d.rx !== 'yok' }, { value: 'low', label: 'Kritik stok', test: (d) => stock(d.id) <= d.min }, { value: 'otc', label: 'Reçetesiz', test: (d) => d.rx === 'yok' }],
      columns: [{ key: 'name', label: 'Ürün', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b><div class="small faint">${esc(d.active)} · ${esc(d.form)} · ${esc(d.barcode || '')}</div>` }, { key: 'cat', label: 'Kategori', render: (d) => `${esc(d.cat)}${d.sgk ? ' ' + badge('SGK', 'info') : ''}` }, { key: 'price', label: 'PSF', cls: 'right', render: (d) => money(d.price) }, { label: 'Stok', cls: 'right', render: (d) => (stock(d.id) <= d.min ? badge(stock(d.id), 'err') : stock(d.id)) }, { label: 'En yakın SKT', render: (d) => { const s = nearSkt(d.id); return s ? (daysBetween(new Date(), s) <= S().sktWarnDays ? badge(NS.date(s), 'warn') : NS.date(s)) : '-'; } }, { label: 'Muadil', cls: 'right', render: (d) => equivalents(d).length || '-' }],
      extraActions: [{ icon: 'layers', act: 'lots', title: 'Partiler' }],
      onAction: (a, d) => modal({ title: `${d.name} — partiler`, size: 'wide', body: table({ rows: db.all('lots', (l) => l.drug === d.id).sort((x, y) => x.skt.localeCompare(y.skt)), empty: 'Parti yok', columns: [{ label: 'Parti', key: 'lot' }, { label: 'SKT', render: (l) => (l.skt < today() ? badge('Geçti ' + NS.date(l.skt), 'err') : NS.date(l.skt)) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Maliyet', cls: 'right', render: (l) => money(l.cost) }] }) + (equivalents(d).length ? `<h3 class="mt mb">Muadiller</h3>${equivalents(d).map((x) => `<div class="list-item small"><span class="grow">${esc(x.name)}</span><b>${money(x.price)}</b><span class="faint">stok ${stock(x.id)}</span></div>`).join('')}` : '') }),
    });
  }
  function sktPage(el, p, app) {
    const warn = S().sktWarnDays;
    const lots = db.all('lots', (l) => l.qty > 0 && daysBetween(new Date(), l.skt) <= warn).sort((a, b) => a.skt.localeCompare(b.skt));
    el.innerHTML = pageHead('Stok & SKT Takibi', `Son kullanma tarihi ${warn} gün içinde dolacak veya geçmiş partiler`, `<button class="btn primary" id="in">${icon('plus')} Mal kabul (parti girişi)</button>`) + `
      <div class="grid g4 mb">${kpi('SKT geçmiş', lots.filter((l) => l.skt < today()).length + ' parti', 'alert', 'err', `<div class="small faint">${money(sum(lots.filter((l) => l.skt < today()), (l) => l.qty * l.cost))} maliyet</div>`)}${kpi('30 gün içinde', lots.filter((l) => l.skt >= today() && daysBetween(new Date(), l.skt) <= 30).length + ' parti', 'clock', 'warn')}${kpi(`${warn} gün içinde`, lots.filter((l) => l.skt >= today()).length + ' parti', 'calendar', 'info')}${kpi('Toplam stok değeri', money(sum(db.all('lots', (l) => l.skt >= today()), (l) => l.qty * l.cost)), 'wallet', 'ok')}</div>
      <div class="card">${table({ rows: lots, empty: 'SKT riski olan parti yok', columns: [{ label: 'Ürün', render: (l) => `${rxDot(drug(l.drug).rx)} <b>${esc(drug(l.drug).name)}</b>` }, { label: 'Parti', key: 'lot' }, { label: 'SKT', render: (l) => (l.skt < today() ? badge(`Geçti (${daysBetween(l.skt, new Date())} gün)`, 'err') : badge(`${daysBetween(new Date(), l.skt)} gün kaldı`, daysBetween(new Date(), l.skt) <= 30 ? 'warn' : 'info')) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Maliyet', cls: 'right', render: (l) => money(l.qty * l.cost) }], actions: [{ label: 'Depoya iade', act: 'ret' }, { label: 'İmha', act: 'dis', show: (l) => l.skt < today() }] })}</div>`;
    on(el, 'click', '[data-act]', async (e, b) => { const l = db.get('lots', b.dataset.id); if (!(await confirm(`${drug(l.drug).name} (${l.lot}) ${l.qty} adet ${b.dataset.act === 'ret' ? 'depoya iade' : 'imha'} edilsin mi?`, { danger: b.dataset.act === 'dis', ok: 'Onayla' }))) return; db.log(b.dataset.act === 'ret' ? 'Depoya iade' : 'İmha', `${drug(l.drug).name} · ${l.qty} adet`); l.qty = 0; db.save(); app.refresh(); });
    $('#in', el).onclick = () => receiveLot(app);
  }
  async function receiveLot(app, drugId, qty) {
    const v = await formModal({ title: 'Mal kabul', fields: [{ name: 'drug', label: 'Ürün', type: 'select', options: db.all('drugs').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((d) => ({ value: d.id, label: d.name })), value: drugId }, { name: 'lot', label: 'Parti no', required: true, value: 'L' + rand(10000, 99999) }, { name: 'skt', label: 'Son kullanma tarihi', type: 'date', required: true, value: iso(addDays(new Date(), 540)) }, { name: 'qty', label: 'Adet', type: 'number', required: true, value: qty || 10 }, { name: 'cost', label: 'Birim maliyet', type: 'number', value: drugId ? r2(drug(drugId).price * 0.75) : '' }] });
    if (!v) return false;
    if (v.skt <= iso(addDays(new Date(), 90)) && !(await confirm('Bu partinin SKT\'si 90 günden yakın. Yine de kabul edilsin mi?', { ok: 'Kabul et', danger: false }))) return false;
    db.insert('lots', { ...v, qty: Number(v.qty), cost: Number(v.cost) || r2(drug(v.drug).price * 0.75) }); toast('Parti stoğa eklendi', 'ok'); app.refresh(); return true;
  }
  function ordersPage(el, p, app) {
    const since = addDays(new Date(), -30).toISOString(); const sold = {};
    db.all('sales', (s) => s.at > since).forEach((s) => s.items.forEach((i) => { sold[i.drug] = (sold[i.drug] || 0) + i.qty; }));
    const sug = db.all('drugs').map((d) => ({ ...d, st: stock(d.id), m: sold[d.id] || 0, need: Math.max(0, Math.ceil((sold[d.id] || 0) * 0.5 + d.min - stock(d.id))) })).filter((d) => d.need > 0).sort((a, b) => b.need - a.need);
    el.innerHTML = pageHead('Depo Siparişi', 'Son 30 günlük satış hızı ve kritik stoğa göre sipariş önerisi') + `
      <div class="card mb"><div class="card-h"><h3>Sipariş önerisi (${sug.length})</h3><select class="input" id="dp" style="max-width:220px">${db.all('depots').map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><button class="btn primary" id="send">${icon('send')} Seçilenleri sipariş et</button></div>${table({ rows: sug, empty: 'Sipariş gereken ürün yok', columns: [{ label: '', render: (d) => `<input type="checkbox" data-sel="${d.id}" checked>` }, { label: 'Ürün', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b>` }, { label: 'Stok', cls: 'right', key: 'st' }, { label: '30 gün satış', cls: 'right', key: 'm' }, { label: 'Önerilen', cls: 'right', render: (d) => `<input class="input" type="number" style="width:76px;text-align:right" data-n="${d.id}" value="${d.need}">` }, { label: 'Tahmini', cls: 'right', render: (d) => money(d.need * d.price * 0.75) }] })}</div>
      <div class="card"><div class="card-h"><h3>Verilen siparişler</h3></div>${table({ rows: db.all('orders').sort((a, b) => b.at.localeCompare(a.at)), empty: 'Henüz sipariş verilmedi', columns: [{ label: 'Tarih', render: (o) => NS.dt(o.at) }, { label: 'Depo', render: (o) => esc((db.get('depots', o.depot) || {}).name) }, { label: 'Kalem', cls: 'right', render: (o) => o.items.length }, { label: 'Durum', render: (o) => (o.status === 'geldi' ? badge('Teslim alındı', 'ok') : badge('Yolda', 'warn')) }], actions: [{ label: 'Teslim al', act: 'recv', show: (o) => o.status !== 'geldi' }] })}</div>`;
    $('#send', el).onclick = () => { const items = $$('[data-sel]:checked', el).map((c) => ({ drug: c.dataset.sel, qty: Number($(`[data-n="${c.dataset.sel}"]`, el).value) || 0 })).filter((i) => i.qty > 0); if (!items.length) return toast('Ürün seçin', 'err'); db.insert('orders', { at: new Date().toISOString(), depot: $('#dp', el).value, items, status: 'yolda' }); if (NS.integ) NS.integ.emit('depo_siparis', { depot: (db.get('depots', $('#dp', el).value) || {}).name, items }); const dep = db.get('depots', $('#dp', el).value) || {}; ig('eczadeposu', 'siparis', { depot: dep.name, items: items.map((i) => ({ barcode: drug(i.drug).barcode, name: drug(i.drug).name, qty: i.qty })) }).then((r) => { if (r) toast(r.simulated ? `TEST — ${dep.name} deposuna sipariş gönderilmedi (simülasyon)` : r.ok ? `${dep.name} deposuna sipariş iletildi (${r.ref})` : 'Depo siparişi iletilemedi', r.simulated ? 'warn' : r.ok ? 'ok' : 'err'); }); toast('Sipariş kaydedildi', 'ok'); app.refresh(); };
    on(el, 'click', '[data-act=recv]', (e, b) => { const o = db.get('orders', b.dataset.id); o.items.forEach((i) => db.insert('lots', { drug: i.drug, lot: 'L' + rand(10000, 99999), skt: iso(addDays(new Date(), rand(300, 900))), qty: i.qty, cost: r2(drug(i.drug).price * 0.75) }, true)); o.status = 'geldi'; db.save(); ig('its', 'alim-bildirim', { depot: (db.get('depots', o.depot) || {}).name, items: o.items.map((i) => ({ barcode: drug(i.drug).barcode, qty: i.qty })) }); toast('Ürünler stoğa alındı', 'ok'); app.refresh(); });
  }
  const PF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'tc', label: 'TC kimlik no', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'allergy', label: 'Alerji', full: true }, { name: 'retired', label: 'Emekli (katılım payı indirimli)', type: 'checkbox' }];
  function patientsPage(el, p, app) {
    const due = (pt) => (pt.chronic || []).length && pt.lastBuy && daysBetween(pt.lastBuy, new Date()) >= 25;
    NS.crud(el, app, {
      col: 'patients', title: 'Hastalar', sub: 'Kronik ilaç kullananlara bitiş hatırlatması', single: 'Hasta', addLabel: 'Yeni hasta', emptyIcon: 'users', fields: () => [...PF, { type: 'section', label: 'Kronik ilaçlar' }, ...db.all('drugs', (d) => d.rx === 'normal').map((d) => ({ name: 'ch_' + d.id, label: d.name, type: 'checkbox' }))],
      toForm: (r) => ({ ...r, ...Object.fromEntries((r.chronic || []).map((id) => ['ch_' + id, true])) }), beforeSave: (v) => { v.chronic = Object.keys(v).filter((k) => k.startsWith('ch_') && v[k]).map((k) => k.slice(3)); Object.keys(v).filter((k) => k.startsWith('ch_')).forEach((k) => delete v[k]); },
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (x) => [x.name, x.tc, x.phone],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'due', label: 'İlacı bitmek üzere', test: due }],
      columns: [{ key: 'name', label: 'Hasta', render: (x) => `<b>${esc(x.name)}</b> ${x.retired ? badge('Emekli', 'info') : ''} ${x.allergy ? badge(x.allergy, 'err') : ''}<div class="small faint">${esc(x.phone || '')}</div>` }, { label: 'Kronik ilaç', render: (x) => (x.chronic || []).map((id) => esc(drug(id).name.split(' ')[0])).join(', ') || '-' }, { label: 'Son alım', render: (x) => (x.lastBuy ? `${NS.date(x.lastBuy)}${due(x) ? ' ' + badge('Hatırlat', 'warn') : ''}` : '-') }],
      extraActions: [{ icon: 'message', act: 'wa', title: 'WhatsApp hatırlatma', show: due }],
      onAction: (a, x) => window.open(`https://wa.me/90${String(x.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${x.name}, ${(x.chronic || []).map((id) => drug(id).name).join(', ')} ilacınızın bitmek üzere olduğunu hatırlatırız. Reçetenizi bekliyoruz. ${S().bizName}`)}`, '_blank', 'noopener'),
    });
  }
  // Hastanın recete.html'den gönderdiği e-reçeteler
  function rxOrdersPage(el, p, app) {
    const ST = { yeni: ['Yeni', 'info'], hazirlaniyor: ['Hazırlanıyor', 'warn'], hazir: ['Hazır', 'ok'], eksik: ['Eksik ilaç', 'err'], teslim: ['Teslim edildi', ''] };
    const sms = (o, text) => NS.smsLog(db, { to: o.phone, name: o.name, text: `${S().bizName}: ${text}`, kind: 'recete' }, true);
    NS.crud(el, app, {
      col: 'rxOrders', title: 'Online Reçeteler', sub: 'Hastaların web sayfasından gönderdiği e-reçeteler — hazırlayın, SMS ile haber verin', single: 'Reçete', canAdd: false, emptyIcon: 'file',
      fields: [{ name: 'rxNo', label: 'E-reçete no' }, { name: 'name', label: 'Hasta' }, { name: 'phone', label: 'Telefon' }, { name: 'total', label: 'Katkı payı / fark (₺)', type: 'number' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'open', label: 'Açık', test: (o) => o.status !== 'teslim' }, { value: 'all', label: 'Tümü' }],
      sort: (a, b) => FLOWI(a) - FLOWI(b) || b.at.localeCompare(a.at), searchFields: (o) => [o.rxNo, o.name, o.phone, o.code],
      columns: [{ key: 'rxNo', label: 'E-reçete', render: (o) => `<b class="mono">${esc(o.rxNo)}</b><div class="small faint">${esc(o.code)} · ${NS.ago(o.at)}</div>` }, { key: 'name', label: 'Hasta', render: (o) => `<b>${esc(o.name)}</b><div class="small faint">${esc(o.phone)}</div>` }, { key: 'pickup', label: 'Alış' }, { key: 'note', label: 'Not', render: (o) => `<span class="small">${esc(o.note || '')}</span>${o.missing ? `<div class="small" style="color:var(--err)">${esc(o.missing)}</div>` : ''}` }, { key: 'status', label: 'Durum', render: (o) => badge(ST[o.status][0], ST[o.status][1]) }],
      extraActions: [{ icon: 'pill', act: 'prep', title: 'Hazırlanıyor' }, { icon: 'check', act: 'ready', title: 'Hazır — SMS gönder' }, { icon: 'alert', act: 'miss', title: 'Eksik ilaç bildir' }, { icon: 'user', act: 'done', title: 'Teslim edildi' }],
      onAction: async (a, o, redraw) => {
        if (a === 'prep') { o.status = 'hazirlaniyor'; }
        else if (a === 'ready') { const v = await formModal({ title: 'Reçete hazır', fields: [{ name: 'total', label: 'Ödenecek katkı payı / fark (₺)', type: 'number', value: o.total || 0 }] }); if (!v) return; o.total = v.total; o.status = 'hazir'; sms(o, `${o.rxNo} numaralı reçeteniz hazır.${o.total ? ' Ödenecek: ' + money(o.total) + '.' : ''} Kimliğinizle gelebilirsiniz.`); }
        else if (a === 'miss') { const v = await formModal({ title: 'Eksik ilaç', fields: [{ name: 'missing', label: 'Eksik ilaç / açıklama', required: true, full: true, value: o.missing || '' }, { name: 'eta', label: 'Tahmini geliş', value: 'Yarın 14:00' }] }); if (!v) return; o.missing = v.missing; o.eta = v.eta; o.status = 'eksik'; sms(o, `${o.rxNo} numaralı reçetenizde eksik ilaç var (${v.missing}). Tahmini geliş: ${v.eta}.`); }
        else if (a === 'done') { o.status = 'teslim'; o.doneAt = new Date().toISOString(); }
        db.save(); toast('Güncellendi', 'ok'); redraw();
      },
    });
  }
  const FLOWI = (o) => ['yeni', 'eksik', 'hazirlaniyor', 'hazir', 'teslim'].indexOf(o.status);

  function dutyPage(el, p, app) {
    NS.crud(el, app, { col: 'duty', title: 'Nöbet Takvimi', sub: 'Eczacılar odası nöbet listesi', single: 'Nöbet', addLabel: 'Nöbet ekle', emptyIcon: 'calendar', fields: [{ name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'note', label: 'Açıklama', value: 'Gece nöbeti 19:00 – 08:30' }], sort: (a, b) => a.date.localeCompare(b.date), filters: [{ value: 'up', label: 'Yaklaşan', test: (d) => d.date >= today() }, { value: 'all', label: 'Tümü' }], columns: [{ key: 'date', label: 'Tarih', render: (d) => `<b>${NS.dateLong(d.date)}</b> ${d.date === today() ? badge('BUGÜN NÖBETÇİ', 'err') : ''}` }, { key: 'note', label: 'Not' }, { label: 'Kalan', render: (d) => (d.date >= today() ? daysBetween(new Date(), d.date) + ' gün' : 'Geçti') }] });
  }
  function dashboard(el, p, app) {
    const t = today(); const todayS = db.all('sales', (s) => iso(s.at) === t);
    const d30 = db.all('sales', (s) => s.at > addDays(new Date(), -30).toISOString());
    const ser = NS.dailySeries(db.all('sales'), 14, 'at', (s) => s.total);
    const nextDuty = db.all('duty', (d) => d.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
    const low = db.all('drugs', (d) => stock(d.id) <= d.min);
    const skt = db.all('lots', (l) => l.qty > 0 && daysBetween(new Date(), l.skt) <= 30);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/satis">${icon('barcode')} Satış ekranı</a>`) + `
      ${nextDuty && nextDuty.date === t ? `<div class="card pad mb row" style="background:var(--err-soft);border-color:var(--err)">${icon('alert')}<b class="grow">Bugün nöbetçisiniz — ${esc(nextDuty.note)}</b></div>` : ''}
      <div class="grid g4 mb">${kpi('Bugünkü ciro', money(sum(todayS, (s) => s.total)), 'trend', 'ok', `<div class="small faint">Hastadan ${money(sum(todayS, (s) => s.patientPay))}</div>`)}${kpi('Bugün reçete', todayS.filter((s) => s.mode === 'recete').length, 'file', 'info', `<div class="small faint">${todayS.filter((s) => s.mode === 'elden').length} elden satış</div>`)}${kpi('30 gün SGK alacağı', money(sum(d30, (s) => s.instPay)), 'wallet', 'warn')}${kpi('Sonraki nöbet', nextDuty ? NS.date(nextDuty.date) : '-', 'calendar')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Satış türü (30 gün)</h3></div><div class="card-b">${chart.donut([{ label: 'Reçeteli', value: d30.filter((s) => s.mode === 'recete').length, color: '#0d9488' }, { label: 'Elden', value: d30.filter((s) => s.mode === 'elden').length, color: '#f59e0b' }], { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Kritik stok (${low.length})</h3><a class="btn sm" href="#/siparis">Depo siparişi</a></div><div class="card-b">${low.slice(0, 8).map((d) => `<div class="list-item small"><span class="grow">${rxDot(d.rx)} ${esc(d.name)}</span>${badge(stock(d.id) + ' adet', 'err')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('clock')} 30 gün içinde SKT (${skt.length})</h3><a class="btn sm" href="#/skt">Tümü</a></div><div class="card-b">${skt.slice(0, 8).map((l) => `<div class="list-item small"><span class="grow">${esc(drug(l.drug).name)}</span>${badge(l.skt < t ? 'Geçti' : NS.date(l.skt), l.skt < t ? 'err' : 'warn')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>`;
  }
  function salesPage(el, p, app) {
    let day = today();
    const draw = () => {
      const rows = db.all('sales', (s) => iso(s.at) === day).sort((a, b) => b.at.localeCompare(a.at));
      el.innerHTML = pageHead('Satışlar & Kasa', NS.dateLong(day), `<input type="date" class="input" id="dd" value="${day}" style="max-width:170px">`) + `<div class="grid g4 mb">${kpi('Toplam', money(sum(rows, (s) => s.total)), 'trend', 'ok')}${kpi('Hastadan tahsil', money(sum(rows, (s) => s.patientPay)), 'cash')}${kpi('Kurum alacağı', money(sum(rows, (s) => s.instPay)), 'building', 'info')}${kpi('Reçete', rows.filter((s) => s.mode === 'recete').length, 'file', 'warn')}</div>
        <div class="card">${table({ rows, empty: 'Bu gün satış yok', columns: [{ label: 'Saat', render: (s) => `<b>${NS.time(s.at)}</b> <span class="faint small">${esc(s.no)}</span>` }, { label: 'Tür', render: (s) => (s.mode === 'recete' ? badge(`Reçete · ${INST[s.inst] || ''}`, 'info') : badge('Elden', 'warn')) }, { label: 'Hasta', render: (s) => esc(s.patient ? pat(s.patient).name : '-') }, { label: 'İlaçlar', render: (s) => `<span class="small">${esc(s.items.map((i) => i.name.split(' ')[0]).join(', '))}</span>` }, { label: 'Hasta öder', cls: 'right', render: (s) => money(s.patientPay) }, { label: 'Kurum', cls: 'right', render: (s) => (s.instPay ? money(s.instPay) : '-') }, { label: 'Bildirim', render: (s) => [s.medula ? badge(s.medula === 'TEST' ? 'MEDULA TEST' : 'MEDULA', s.medula === 'hata' ? 'err' : s.medula === 'TEST' ? 'warn' : 'ok') : '', s.its ? badge(s.its === 'TEST' ? 'İTS TEST' : 'İTS', s.its === 'hata' ? 'err' : s.its === 'TEST' ? 'warn' : 'ok') : '', s.okc ? badge(s.okc === 'TEST' ? 'ÖKC TEST' : 'ÖKC', s.okc === 'TEST' ? 'warn' : 'ok') : ''].join(' ') || '<span class="faint small">-</span>' }], actions: [{ icon: 'refresh', act: 'rs', title: 'Bildirimleri yeniden gönder', show: (s) => s.medula === 'hata' || s.its === 'hata' || (!s.its && NS.integ && NS.integ.isOn('its')) }, { icon: 'print', act: 'p' }] })}</div>`;
      $('#dd', el).onchange = (e) => { day = e.target.value; draw(); };
    };
    on(el, 'click', '[data-act=p]', (e, b) => printReceipt(db.get('sales', b.dataset.id)));
    on(el, 'click', '[data-act=rs]', async (e, b) => { const s = db.get('sales', b.dataset.id); const pt = s.patient ? pat(s.patient) : null; const items = s.items.map((i) => ({ barcode: drug(i.drug).barcode, name: i.name, qty: i.qty })); if (s.mode === 'recete' && s.medula !== undefined && (!s.medula || s.medula === 'hata')) { const m = await ig('medula', 'provizyon', { rxNo: s.rxNo, tc: pt ? pt.tc : '', inst: s.inst, items }); if (m) s.medula = m.ok ? m.ref : 'hata'; } if (!s.its || s.its === 'hata') { const i = await ig('its', 'satis-bildirim', { no: s.no, items }); if (i) s.its = i.ok ? i.ref : 'hata'; } db.save(); toast('Bildirimler yeniden denendi', 'ok'); draw(); });
    draw();
  }

  // Kurum (SGK ve diğer) dönem mutabakatı: aylık reçete fatura gönderimi ve tahsilat takibi
  function claimsPage(el, p, app) {
    const months = [...new Set(db.all('sales', (s) => s.mode === 'recete').map((s) => s.at.slice(0, 7)))].sort().reverse();
    const rows = months.flatMap((m) => Object.keys(INST).map((k) => { const ss = db.all('sales', (s) => s.mode === 'recete' && s.inst === k && s.at.slice(0, 7) === m); if (!ss.length) return null; const c = db.find('claims', (x) => x.month === m && x.inst === k) || {}; return { id: m + '|' + k, month: m, inst: k, count: ss.length, amount: sum(ss, (s) => s.instPay), missing: ss.filter((s) => s.medula === 'hata' || (s.medula === null && NS.integ && NS.integ.isOn('medula'))).length, ...c, id2: c.id }; }).filter(Boolean));
    el.innerHTML = pageHead('Kurum Mutabakatı', 'Aylık reçete dönem faturası (MEDULA), kurum alacağı ve tahsilat takibi') + `
      <div class="grid g3 mb">${kpi('Faturalanmamış kurum alacağı', money(sum(rows.filter((r) => !r.ref), (r) => r.amount)), 'wallet', 'warn')}${kpi('Tahsil bekleyen', money(sum(rows.filter((r) => r.ref && !r.paid), (r) => r.amount)), 'clock', 'info')}${kpi('Provizyonsuz reçete', sum(rows, (r) => r.missing), 'alert', 'err')}</div>
      <div class="card">${table({ rows, empty: 'Reçeteli satış yok', columns: [{ label: 'Dönem', render: (r) => `<b>${NS.MONTHS[Number(r.month.slice(5)) - 1]} ${r.month.slice(0, 4)}</b>` }, { label: 'Kurum', render: (r) => esc(INST[r.inst]) }, { label: 'Reçete', cls: 'right', render: (r) => `${r.count}${r.missing ? ' ' + badge(r.missing + ' provizyonsuz', 'err') : ''}` }, { label: 'Kurum payı', cls: 'right', render: (r) => `<b>${money(r.amount)}</b>` }, { label: 'Durum', render: (r) => (r.paid ? badge('Tahsil edildi ' + NS.date(r.paid), 'ok') : r.ref ? badge('Faturalandı · ' + r.ref, 'info') : badge('Faturalanmadı', 'warn')) }], actions: [{ label: 'Dönem faturası gönder', act: 'inv', show: (r) => !r.ref }, { label: 'Tahsil edildi', act: 'paid', show: (r) => r.ref && !r.paid }, { icon: 'print', act: 'pr' }] })}</div>`;
    on(el, 'click', '[data-act]', async (e, b) => {
      const r = rows.find((x) => x.id === b.dataset.id); const a = b.dataset.act;
      if (a === 'pr') return NS.printHtml(`<h2>${esc(S().bizName)} — ${esc(INST[r.inst])} ${r.month} reçete icmali</h2><table><tr><th>Tarih</th><th>Reçete</th><th>Hasta</th><th>Provizyon</th><th style="text-align:right">Kurum payı</th></tr>${db.all('sales', (s) => s.mode === 'recete' && s.inst === r.inst && s.at.slice(0, 7) === r.month).map((s) => `<tr><td>${NS.date(s.at)}</td><td>${esc(s.rxNo)}</td><td>${esc(s.patient ? pat(s.patient).name : '')}</td><td>${esc(s.medula || '-')}</td><td style="text-align:right">${money(s.instPay)}</td></tr>`).join('')}</table><p><b>Toplam: ${money(r.amount)}</b></p>`, { title: 'İcmal' });
      if (a === 'inv') { if (r.missing && !(await confirm(`${r.missing} reçetenin provizyonu yok. Yine de dönem faturası gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return; const res = NS.integ && NS.integ.isOn('medula') ? await NS.integ.call('medula', 'donem-fatura', { month: r.month, inst: r.inst, count: r.count, amount: r.amount }) : { ok: true, ref: 'EL-' + r.month }; if (res && res.simulated) return toast('MEDULA TEST — dönem faturası gönderilmedi (simülasyon); kayıt oluşturulmadı', 'warn'); if (!res || !res.ok) return; db.insert('claims', { month: r.month, inst: r.inst, ref: res.ref, amount: r.amount, at: new Date().toISOString() }); toast('Dönem faturası kaydedildi', 'ok'); app.refresh(); }
      else if (a === 'paid') { const c = db.get('claims', r.id2); c.paid = today(); db.save(); app.refresh(); }
    });
  }

  const ROLES = { admin: 'Eczacı', kalfa: 'Kalfa / teknisyen' };
  NS.shell({
    id: 'eczane', integrations: ['printer','label','pos','barcode','efatura','sms','whatsapp','webhook','backup'], name: 'Eczane', tagline: 'Eczane Otomasyonu', icon: 'pill', accent: '#0d9488', db, home: 'satis', auth: { roles: ROLES },
    nav: [{ sec: 'Eczane' }, { id: 'satis', label: 'Satış Ekranı', icon: 'barcode' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'satislar', label: 'Satışlar & Kasa', icon: 'receipt' }, { id: 'hastalar', label: 'Hastalar', icon: 'users' }, { id: 'recete', label: 'Online Reçeteler', icon: 'file' }, { id: 'kurum', label: 'Kurum Mutabakatı', icon: 'building', roles: ['admin'] }, { sec: 'Stok' }, { id: 'ilaclar', label: 'İlaç Kartları', icon: 'pill' }, { id: 'skt', label: 'Stok & SKT', icon: 'clock' }, { id: 'siparis', label: 'Depo Siparişi', icon: 'truck' }, { sec: 'Yönetim' }, { id: 'nobet', label: 'Nöbet Takvimi', icon: 'calendar' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { recete: rxOrdersPage, kurum: claimsPage, satis: salePage, ozet: dashboard, satislar: salesPage, hastalar: patientsPage, ilaclar: drugsPage, skt: sktPage, siparis: ordersPage, nobet: dutyPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Reçete hesabı' }, { name: 'pharmacist', label: 'Mesul eczacı' }, { name: 'gln', label: 'GLN no' }, { name: 'patientPct', label: 'Hasta katılım payı %', type: 'number' }, { name: 'retiredPct', label: 'Emekli katılım payı %', type: 'number' }, { name: 'rxFee', label: 'Reçete katılım payı (₺)', type: 'number' }, { name: 'sktWarnDays', label: 'SKT uyarı süresi (gün)', type: 'number' }] }) },
  });
})();
