/* NEBSOFT Oto Servis & Sanayi — plakadan araç geçmişi, iş emri, parça + işçilik, müşteri onay linki,
   teknisyen ekranı, parça stoğu, bakım/muayene/sigorta hatırlatmaları ve cari tahsilat */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const O = window.OTS;
  const db = new NS.DB('otoservis', O.seed);
  const S = () => db.settings({});
  const veh = (id) => db.get('vehicles', id) || { plate: '-', brand: '', model: '' };
  const cus = (id) => db.get('customers', id) || { name: '-', phone: '' };
  const tech = (id) => db.get('techs', id) || { name: '-' };
  const stB = (s) => badge(O.ST[s][0], O.ST[s][1]);
  const normPlate = (p) => String(p || '').toLocaleUpperCase('tr').replace(/\s+/g, '');
  const findVeh = (p) => db.find('vehicles', (v) => normPlate(v.plate) === normPlate(p));
  const linkOf = (j) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'onay.html?k=' + O.token(j);
  const setSt = (j, st, note) => { j.status = st; j.history.push({ at: new Date().toISOString(), st, note: note || O.ST[st][0], user: (NS.currentUser || {}).name }); };
  const sms = (j, text) => { const c = cus(j.customer); NS.smsLog(db, { to: c.phone, name: c.name, text }, true); };
  const myTech = () => (NS.currentUser && NS.currentUser.role === 'teknisyen' ? NS.currentUser.tech : null);

  // ---------- İş emri detay ----------
  function jobModal(app, j) {
    const v = veh(j.vehicle), c = cus(j.customer); const t = O.totals(j);
    const itemsHtml = () => table({ rows: j.items, empty: 'Henüz kalem yok — arıza tespitinden sonra parça ve işçilik ekleyin', columns: [
      { label: 'Kalem', render: (i) => `${badge(i.type === 'parca' ? 'Parça' : 'İşçilik', i.type === 'parca' ? 'info' : 'acc')} ${esc(i.name)}` },
      { label: 'Miktar', cls: 'right', render: (i) => (i.type === 'iscilik' ? i.qty + ' sa' : i.qty) },
      { label: 'Tutar', cls: 'right', render: (i) => money(i.qty * i.price) },
      { label: 'Onay', render: (i) => (i.approved === true ? badge('Onaylı', 'ok') : i.approved === false ? badge('Reddedildi', 'err') : badge('Bekliyor', 'warn')) },
    ], actions: j.status === 'teslim' ? [] : [{ icon: 'trash', act: 'rm' }] });
    const m = modal({
      title: `${j.no} · ${v.plate}`, size: 'wide',
      body: `<div class="grid g2"><div class="col"><div class="row">${stB(j.status)} ${j.photos ? badge(j.photos + ' fotoğraf', 'info') : ''}</div>
          <div class="card pad"><b style="font-size:18px">${esc(v.plate)}</b> <span class="muted">${esc(v.brand)} ${esc(v.model)} ${v.year || ''} · ${esc(v.fuel || '')}</span><div class="small">Giriş km: <b>${NS.num(j.km)}</b> · Şase: <span class="mono">${esc(v.vin || '-')}</span></div><div class="small mt">${esc(c.name)} · ${esc(c.phone)}</div></div>
          <div class="card pad"><div class="small muted">Şikâyet</div><b>${esc(j.complaint)}</b>${j.finding ? `<div class="small muted mt">Tespit</div><div>${esc(j.finding)}</div>` : ''}<div class="small muted mt">Teknisyen: ${esc(tech(j.tech).name)}</div></div>
          <div class="col" style="gap:4px">${j.history.slice().reverse().map((h) => `<div class="small"><b>${esc(O.ST[h.st][0])}</b> — ${esc(h.note || '')} <span class="faint">${NS.dt(h.at)}</span></div>`).join('')}</div></div>
        <div class="col"><div class="card" id="it">${itemsHtml()}</div>
          <div class="card pad">${[['Parça', t.parca], ['İşçilik', t.iscilik], ...(j.disc ? [['İndirim', -j.disc]] : []), ['KDV %20', t.kdv]].map(([l, x]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(x)}</div>`).join('')}<div class="list-item"><b class="grow">Toplam</b><b style="font-size:20px">${money(t.total)}</b></div>${j.paid ? `<div class="list-item small"><span class="grow muted">Tahsil edilen</span>${money(j.paid)}</div>` : ''}</div></div></div>`,
      actions: [
        ...(j.status !== 'teslim' ? [{ label: 'Parça ekle', icon: 'plus', onClick: () => addItem(j, 'parca') }, { label: 'İşçilik ekle', icon: 'wrench', onClick: () => addItem(j, 'iscilik') }] : []),
        { label: 'Yazdır', icon: 'print', onClick: () => printJob(j) },
        ...(j.status === 'teshis' && j.items.length ? [{ label: 'Onaya gönder (SMS)', icon: 'send', cls: 'primary', onClick: (cl) => { j.items.forEach((i) => { if (i.approved !== true) i.approved = null; }); setSt(j, 'onay', 'Onay linki SMS ile gönderildi'); sms(j, `${S().bizName}: ${v.plate} aracınız için ${money(O.totals({ ...j, items: j.items.map((i) => ({ ...i, approved: true })) }).total)} tutarında teklif hazır. Onaylamak için: ${linkOf(j)}`); db.save(); cl(); app.refresh(); toast('Onay linki gönderildi', 'ok'); } }] : []),
        ...(j.status === 'onay' ? [{ label: 'Telefonla onay alındı', onClick: (cl) => { j.items.forEach((i) => { if (i.approved === null) i.approved = true; }); setSt(j, 'islemde', 'Müşteri telefonda onayladı'); db.save(); cl(); app.refresh(); } }, { label: 'Linki kopyala', icon: 'link', onClick: () => { navigator.clipboard && navigator.clipboard.writeText(linkOf(j)); window.open(linkOf(j), '_blank'); } }] : []),
        ...(j.status === 'kabul' ? [{ label: 'Arıza tespitine al', cls: 'primary', onClick: async (cl) => { const f = await NS.prompt('Tespit edilen arıza', j.finding || ''); if (f === null) return; j.finding = f; setSt(j, 'teshis', f); db.save(); cl(); app.refresh(); } }] : []),
        ...(j.status === 'islemde' ? [{ label: 'Tamir bitti', cls: 'primary', icon: 'check', onClick: (cl) => { useParts(j); setSt(j, 'hazir'); sms(j, `${S().bizName}: ${v.plate} aracınız teslime hazır. Tutar: ${money(O.totals(j).total)}. Online ödeme ve detay: ${linkOf(j)}`); db.save(); cl(); app.refresh(); toast('Müşteriye "aracınız hazır" SMS gönderildi', 'ok'); } }] : []),
        ...(j.status === 'hazir' ? [{ label: 'Teslim et + tahsilat', cls: 'primary', icon: 'cash', onClick: (cl) => deliver(app, j, cl) }] : []),
      ],
    });
    on(m.root, 'click', '[data-act=rm]', (e, b) => { j.items = j.items.filter((i) => i.id !== b.dataset.id); db.save(); $('#it', m.root).innerHTML = itemsHtml(); });
    async function addItem(job, type) {
      const fields = type === 'parca' ? [{ name: 'pid', label: 'Parça', type: 'select', options: db.all('parts').map((p) => ({ value: p.id, label: `${p.code} · ${p.name} (${p.brand}) · stok ${p.stock} · ${money(p.price)}` })), full: true }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }, { name: 'name', label: 'Stokta olmayan parça (serbest)', full: true, hint: 'Tedarikçiden gelecek parçayı yazın' }, { name: 'price', label: 'Serbest parça fiyatı', type: 'number' }] : [{ name: 'name', label: 'İşlem', required: true, full: true }, { name: 'qty', label: 'Süre (saat)', type: 'number', step: '0.5', value: 1 }, { name: 'price', label: 'Saat ücreti', type: 'number', value: S().laborRate || 1200 }];
      const r = await formModal({ title: type === 'parca' ? 'Parça ekle' : 'İşçilik ekle', fields, values: { qty: 1, price: type === 'iscilik' ? S().laborRate : '' } }); if (!r) return;
      if (type === 'parca' && !r.name) { const p = db.get('parts', r.pid); job.items.push({ id: NS.uid(), type, pid: p.id, name: `${p.name} (${p.brand})`, qty: Number(r.qty) || 1, price: p.price, cost: p.cost, approved: job.status === 'onay' ? null : true }); }
      else job.items.push({ id: NS.uid(), type, name: r.name, qty: Number(r.qty) || 1, price: Number(r.price) || 0, approved: job.status === 'onay' ? null : true });
      db.save(); $('#it', m.root).innerHTML = itemsHtml();
    }
  }
  function useParts(j) { if (j.partsUsed) return; j.items.filter((i) => i.type === 'parca' && i.approved !== false && i.pid).forEach((i) => { const p = db.get('parts', i.pid); if (p) p.stock = Math.max(0, p.stock - i.qty); }); j.partsUsed = true; }
  async function deliver(app, j, cl) {
    const t = O.totals(j);
    const v = await formModal({ title: `Teslim — ${veh(j.vehicle).plate} · ${money(t.total)}`, fields: [{ name: 'amount', label: 'Tahsil edilen (₺)', type: 'number', step: '0.01' }, { name: 'method', label: 'Ödeme', type: 'select', options: ['Nakit', 'Kredi kartı', 'Havale', 'Cari hesaba (veresiye)'] }, { name: 'km', label: 'Çıkış km', type: 'number' }, { name: 'nextKm', label: 'Sonraki bakım km', type: 'number' }, { name: 'efatura', label: 'e-Arşiv fatura kes', type: 'checkbox' }], values: { amount: Math.max(0, t.total - (j.paid || 0)), method: 'Kredi kartı', km: j.km, nextKm: j.complaint.includes('bakım') ? j.km + (Number(S().serviceKm) || 15000) : '', efatura: true } });
    if (!v) return;
    useParts(j); const prevPaid = j.paid || 0; const got = v.method.startsWith('Cari') ? 0 : Number(v.amount) || 0; j.paid = prevPaid + got; j.nextKm = Number(v.nextKm) || null; j.deliveredAt = new Date().toISOString();
    const vv = veh(j.vehicle); if (vv.id) vv.km = Number(v.km) || vv.km;
    const c = cus(j.customer); if (c.id) c.balance = (c.balance || 0) + t.total - j.paid;
    if (got) db.insert('payments', { customer: j.customer, job: j.id, amount: got, method: v.method, at: new Date().toISOString() });
    if (v.efatura && NS.ebelge) { const r = await NS.ebelge.create({ docType: 'auto', buyer: c.name, no: j.no, lines: j.items.filter((i) => i.approved !== false).map((i) => ({ name: i.name, qty: i.qty, price: i.price, vat: 20 })), note: `${vv.plate} · ${j.km} km`, disc: j.disc }); if (r && r.no) j.invoice = r.no; }
    setSt(j, 'teslim', `${v.method}${j.invoice ? ' · fatura ' + j.invoice : ''}`); db.save(); cl(); app.refresh(); printJob(j);
  }
  function printJob(j) {
    const v = veh(j.vehicle), c = cus(j.customer), t = O.totals(j);
    NS.printHtml(`<div class="doc"><table><tr><td><h2>${esc(S().bizName)}</h2><div>${esc(S().bizAddress || '')}</div><div>${esc(S().bizPhone || '')}</div></td><td style="text-align:right"><h2>İŞ EMRİ ${esc(j.no)}</h2><div>${NS.dt(j.at)}</div></td></tr></table><hr>
      <table><tr><td><b>${esc(v.plate)}</b> · ${esc(v.brand)} ${esc(v.model)} ${v.year || ''}<br>Km: ${NS.num(j.km)} · Şase: ${esc(v.vin || '')}</td><td>${esc(c.name)}<br>${esc(c.phone)}</td></tr></table>
      <p><b>Şikâyet:</b> ${esc(j.complaint)}${j.finding ? `<br><b>Tespit:</b> ${esc(j.finding)}` : ''}</p>
      <table><tr><th>Kalem</th><th style="text-align:right">Miktar</th><th style="text-align:right">Birim</th><th style="text-align:right">Tutar</th></tr>${j.items.filter((i) => i.approved !== false).map((i) => `<tr><td>${esc(i.name)}</td><td style="text-align:right">${i.qty}${i.type === 'iscilik' ? ' sa' : ''}</td><td style="text-align:right">${money(i.price)}</td><td style="text-align:right">${money(i.qty * i.price)}</td></tr>`).join('')}
      <tr><td colspan="3">KDV %20</td><td style="text-align:right">${money(t.kdv)}</td></tr><tr><td colspan="3"><b>TOPLAM</b></td><td style="text-align:right"><b>${money(t.total)}</b></td></tr></table>
      <p style="font-size:11px">Takılan parçalar ve işçilik ${S().warrantyDays || 180} gün garantilidir. ${j.nextKm ? `Sonraki bakım: <b>${NS.num(j.nextKm)} km</b>.` : ''}</p><table><tr><td>Teslim eden</td><td>Teslim alan</td></tr><tr><td style="height:50px"></td><td></td></tr></table></div>`, { title: j.no });
  }

  // ---------- Araç kabul ----------
  function intakePage(el, p, app) {
    el.innerHTML = pageHead('Araç Kabul', 'Plakayı yazın — kayıtlı araçsa geçmişi ve müşterisi otomatik gelir') + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><div class="row"><input class="input grow" id="pl" placeholder="34 AB 1234" style="height:56px;font-size:24px;text-transform:uppercase;letter-spacing:.06em" autocomplete="off"><button class="btn primary lg" id="go">Sorgula</button></div></div><div id="f"></div></div><div id="hist"></div></div>`;
    const go = () => {
      const plate = $('#pl', el).value.trim(); if (plate.length < 5) return toast('Plaka girin', 'err');
      const v = findVeh(plate); const c = v ? cus(v.customer) : null; const prev = v ? db.all('jobs', (j) => j.vehicle === v.id).sort((a, b) => b.at.localeCompare(a.at)) : [];
      $('#hist', el).innerHTML = v ? `<div class="card"><div class="card-h"><h3>${icon('clock')} Araç geçmişi (${prev.length})</h3></div>${table({ rows: prev.slice(0, 8), empty: 'İlk ziyaret', columns: [{ label: 'Tarih', render: (j) => NS.date(j.at) }, { label: 'Km', cls: 'right', render: (j) => NS.num(j.km) }, { label: 'İşlem', render: (j) => `<span class="small">${esc(j.complaint)}</span>` }, { label: 'Tutar', cls: 'right', render: (j) => money(O.totals(j).total) }] })}${v.inspection < iso(addDays(new Date(), 30)) ? `<div class="card-b">${badge('Muayene ' + NS.date(v.inspection), 'warn')}</div>` : ''}</div>` : `<div class="card pad">${badge('Yeni araç', 'info')}<p class="small muted mt">Bu plaka ilk kez geliyor; araç ve müşteri birlikte kaydedilecek.</p></div>`;
      $('#f', el).innerHTML = `<div class="card pad"><div class="form-grid">${NS.fieldsHtml([{ type: 'section', label: 'Araç' }, { name: 'brand', label: 'Marka', type: 'select', options: Object.keys(O.BRANDS) }, { name: 'model', label: 'Model' }, { name: 'year', label: 'Yıl', type: 'number' }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'km', label: 'Güncel km', type: 'number', required: true }, { name: 'vin', label: 'Şase no' }, { type: 'section', label: 'Müşteri' }, { name: 'cname', label: 'Ad soyad / firma', required: true }, { name: 'cphone', label: 'Telefon', type: 'tel', required: true }, { type: 'section', label: 'İş emri' }, { name: 'complaint', label: 'Şikâyet / talep', required: true, full: true }, { name: 'tech', label: 'Teknisyen', type: 'select', options: db.all('techs').map((t) => ({ value: t.id, label: `${t.name} · ${t.skill}` })) }, { name: 'fuelLvl', label: 'Yakıt seviyesi', type: 'select', options: ['1/4', '1/2', '3/4', 'Dolu'] }, { name: 'items', label: 'Araçta bırakılanlar', placeholder: 'Yedek lastik, ruhsat, kriko...', full: true }, { name: 'damage', label: 'Mevcut hasar / çizik notu', full: true }], v ? { ...v, km: '', cname: c.name, cphone: c.phone } : { brand: 'Renault', fuel: 'Dizel', fuelLvl: '1/2' })}</div><button class="btn primary lg block mt" id="sv">${icon('check')} İş emri aç ve fiş yazdır</button></div>`;
      $('#sv', el).onclick = () => {
        const box = $('#f', el); if (!NS.validate(box)) return; const f = NS.readForm(box);
        let cc = c && c.phone === f.cphone ? c : db.find('customers', (x) => String(x.phone).replace(/\D/g, '').slice(-10) === String(f.cphone).replace(/\D/g, '').slice(-10));
        if (!cc) cc = db.insert('customers', { name: f.cname, phone: f.cphone, balance: 0 });
        let vv = v; if (!vv) vv = db.insert('vehicles', { plate: plate.toLocaleUpperCase('tr'), brand: f.brand, model: f.model, year: f.year, fuel: f.fuel, vin: f.vin, km: Number(f.km), customer: cc.id }); else Object.assign(vv, { km: Number(f.km), customer: cc.id, brand: f.brand, model: f.model, year: f.year, fuel: f.fuel, vin: f.vin });
        const j = db.insert('jobs', { no: 'IE' + (2400 + db.all('jobs').length), vehicle: vv.id, customer: cc.id, at: new Date().toISOString(), km: Number(f.km), complaint: f.complaint, tech: f.tech, items: [], status: 'kabul', disc: 0, paid: 0, history: [{ at: new Date().toISOString(), st: 'kabul', note: [f.fuelLvl && 'Yakıt ' + f.fuelLvl, f.items, f.damage].filter(Boolean).join(' · ') || 'Araç kabul edildi', user: (NS.currentUser || {}).name }] });
        sms(j, `${S().bizName}: ${vv.plate} aracınız ${j.no} numarasıyla teslim alındı. Durumu buradan izleyebilirsiniz: ${linkOf(j)}`);
        db.save(); printJob(j); toast(`${j.no} açıldı`, 'ok'); app.go('isemirleri');
      };
    };
    $('#go', el).onclick = go; $('#pl', el).onkeydown = (e) => { if (e.key === 'Enter') go(); };
    if (p) { $('#pl', el).value = p; go(); }
    setTimeout(() => $('#pl', el).focus(), 50);
  }

  // ---------- İş emirleri (pano) ----------
  function jobsPage(el, p, app) {
    let q = ''; const mine = myTech();
    el.innerHTML = pageHead('İş Emirleri', mine ? 'Size atanan araçlar' : 'Servisteki tüm araçlar — karta tıklayın', `<a class="btn primary" href="#/kabul">${icon('plus')} Araç kabul</a>`) + `<div class="card pad mb">${NS.searchBox('q', 'Plaka, müşteri, iş emri no...')}</div><div class="grid" style="grid-template-columns:repeat(5,minmax(200px,1fr));overflow-x:auto;gap:12px" id="kb"></div><div class="card mt"><div class="card-h"><h3>Son teslim edilenler</h3></div><div id="done"></div></div>`;
    const draw = () => {
      const all = db.all('jobs', (j) => (!mine || j.tech === mine) && NS.match(q, j.no, veh(j.vehicle).plate, cus(j.customer).name));
      $('#kb', el).innerHTML = O.FLOW.slice(0, 5).map((s) => { const L = all.filter((j) => j.status === s); return `<div><div class="row mb"><b class="grow">${esc(O.ST[s][0])}</b>${badge(L.length, O.ST[s][1])}</div>${L.map((j) => `<div class="card pad mb" data-j="${j.id}" style="cursor:pointer"><div class="row"><b class="grow mono">${esc(veh(j.vehicle).plate)}</b><span class="small faint">${esc(j.no)}</span></div><div class="small muted">${esc(veh(j.vehicle).brand)} ${esc(veh(j.vehicle).model)}</div><div class="small mt">${esc(j.complaint)}</div><div class="row small mt"><span class="grow faint">${esc(tech(j.tech).name.split(' ')[0])}</span>${j.items.length ? `<b>${money(O.totals(j).total)}</b>` : ''}</div></div>`).join('') || '<div class="small faint">—</div>'}</div>`; }).join('');
      $('#done', el).innerHTML = table({ rows: all.filter((j) => j.status === 'teslim').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10), columns: [{ label: 'İş emri', render: (j) => `<b class="mono">${esc(veh(j.vehicle).plate)}</b> <span class="small faint">${esc(j.no)}</span>` }, { label: 'Müşteri', render: (j) => esc(cus(j.customer).name) }, { label: 'İşlem', render: (j) => `<span class="small">${esc(j.complaint)}</span>` }, { label: 'Tutar', cls: 'right', render: (j) => money(O.totals(j).total) }, { label: 'Ödeme', render: (j) => (j.paid >= O.totals(j).total - 0.01 ? badge('Ödendi', 'ok') : badge('Açık ' + money(O.totals(j).total - j.paid), 'warn')) }], actions: [{ icon: 'eye', act: 'v' }] });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-j]', (e, b) => jobModal(app, db.get('jobs', b.dataset.j)));
    on(el, 'click', '[data-act=v]', (e, b) => jobModal(app, db.get('jobs', b.dataset.id)));
    draw();
  }

  // ---------- Araçlar ----------
  function vehiclesPage(el, p, app) {
    NS.crud(el, app, { col: 'vehicles', title: 'Araçlar', sub: 'Plaka bazında servis geçmişi, muayene ve sigorta tarihleri', single: 'Araç', addLabel: 'Araç ekle', emptyIcon: 'car',
      fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', type: 'select', options: Object.keys(O.BRANDS) }, { name: 'model', label: 'Model' }, { name: 'year', label: 'Yıl', type: 'number' }, { name: 'km', label: 'Km', type: 'number' }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'customer', label: 'Sahibi', type: 'select', options: db.all('customers').map((c) => ({ value: c.id, label: c.name })) }, { name: 'vin', label: 'Şase no' }, { name: 'inspection', label: 'Muayene bitiş', type: 'date' }, { name: 'insurance', label: 'Sigorta bitiş', type: 'date' }],
      searchFields: (v) => [v.plate, v.brand, v.model, cus(v.customer).name],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'mu', label: 'Muayenesi yaklaşan', test: (v) => v.inspection && v.inspection <= iso(addDays(new Date(), 30)) }, { value: 'si', label: 'Sigortası yaklaşan', test: (v) => v.insurance && v.insurance <= iso(addDays(new Date(), 30)) }],
      columns: [{ key: 'plate', label: 'Plaka', render: (v) => `<b class="mono">${esc(v.plate)}</b><div class="small faint">${esc(v.brand)} ${esc(v.model)} ${v.year || ''}</div>` }, { label: 'Sahibi', render: (v) => esc(cus(v.customer).name) }, { key: 'km', label: 'Km', cls: 'right', render: (v) => NS.num(v.km || 0) }, { label: 'Ziyaret', cls: 'right', render: (v) => db.all('jobs', (j) => j.vehicle === v.id).length }, { label: 'Muayene', render: (v) => (v.inspection ? (v.inspection < today() ? badge('Geçmiş', 'err') : v.inspection <= iso(addDays(new Date(), 30)) ? badge(NS.date(v.inspection), 'warn') : NS.date(v.inspection)) : '-') }],
      extraActions: [{ icon: 'clock', act: 'h', title: 'Geçmiş / yeni iş emri' }], onAction: (a, v) => app.go('kabul', v.plate) });
  }

  // ---------- Parça stoğu ----------
  function partsPage(el, p, app) {
    NS.crud(el, app, { col: 'parts', title: 'Parça Stoğu', sub: 'İş emrinde kullanılan parça tamir bitince stoktan düşer', single: 'Parça', addLabel: 'Parça ekle', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'name', label: 'Parça adı', required: true }, { name: 'brand', label: 'Marka' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış (₺)', type: 'number', step: '0.01' }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'min', label: 'En az stok', type: 'number' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'az', label: 'Azalan', test: (x) => x.stock <= (x.min || 2) }],
      searchFields: (x) => [x.code, x.name, x.brand],
      columns: [{ key: 'code', label: 'Kod', render: (x) => `<span class="mono">${esc(x.code)}</span>` }, { key: 'name', label: 'Parça', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.brand || '')}</div>` }, { key: 'stock', label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= (x.min || 2) ? 'err' : 'text'})">${x.stock}</b>` }, { key: 'cost', label: 'Alış', cls: 'right', render: (x) => money(x.cost) }, { key: 'price', label: 'Satış', cls: 'right', render: (x) => money(x.price) }, { label: 'Kâr %', cls: 'right', render: (x) => '%' + Math.round(((x.price - x.cost) / (x.cost || 1)) * 100) }],
      extraActions: [{ icon: 'truck', act: 'ord', title: 'Tedarikçiden sipariş' }],
      onAction: async (a, x) => { if (NS.integ && NS.integ.isOn('parca')) { const r = await NS.integ.call('parca', 'siparis', { code: x.code, qty: Math.max(5, (x.min || 2) * 3) }); if (r && r.ok) toast('Sipariş tedarikçiye iletildi', 'ok'); } else toast('Entegrasyonlar > Yedek parça tedarikçileri bölümünden Martaş / Başbuğ / Dinamik bağlantısını açın', 'err'); } });
  }

  // ---------- Hatırlatmalar ----------
  function remindersPage(el, p, app) {
    const lim = iso(addDays(new Date(), 30));
    const V = db.all('vehicles');
    const last = (v) => db.all('jobs', (j) => j.vehicle === v.id && j.status === 'teslim').sort((a, b) => b.at.localeCompare(a.at))[0];
    const rows = [
      ...V.filter((v) => v.inspection && v.inspection <= lim).map((v) => ({ id: 'm' + v.id, v, type: 'Muayene', date: v.inspection, text: `${S().bizName}: ${v.plate} aracınızın muayenesi ${NS.date(v.inspection)} tarihinde doluyor. Muayene öncesi kontrol için randevu: ${S().bizPhone}` })),
      ...V.filter((v) => v.insurance && v.insurance <= lim).map((v) => ({ id: 's' + v.id, v, type: 'Sigorta', date: v.insurance, text: `${S().bizName}: ${v.plate} aracınızın trafik sigortası ${NS.date(v.insurance)} tarihinde bitiyor.` })),
      ...V.map((v) => ({ v, j: last(v) })).filter(({ v, j }) => j && j.nextKm && (v.km || 0) + 1500 >= j.nextKm).map(({ v, j }) => ({ id: 'b' + v.id, v, type: 'Bakım', date: '', text: `${S().bizName}: ${v.plate} aracınızın ${NS.num(j.nextKm)} km bakımı yaklaştı. Randevu için: ${S().bizPhone}` })),
      ...V.map((v) => ({ v, j: last(v) })).filter(({ j }) => j && j.at < addDays(new Date(), -330).toISOString()).map(({ v }) => ({ id: 'y' + v.id, v, type: 'Yıllık bakım', date: '', text: `${S().bizName}: ${v.plate} aracınızın son bakımının üzerinden 1 yıl geçti.` })),
    ];
    const sent = db.data.sentReminders = db.data.sentReminders || {};
    el.innerHTML = pageHead('Hatırlatmalar', 'Muayene, sigorta ve bakım zamanı gelen araçlar — müşteriyi geri getiren SMS', `<button class="btn primary" id="all">${icon('send')} Tümüne SMS gönder</button>`) + `<div class="card" id="t"></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows, empty: 'Hatırlatılacak araç yok', emptyIcon: 'bell', columns: [{ label: 'Tür', render: (r) => badge(r.type, r.type === 'Muayene' ? 'warn' : r.type === 'Sigorta' ? 'info' : 'acc') }, { label: 'Araç', render: (r) => `<b class="mono">${esc(r.v.plate)}</b><div class="small faint">${esc(cus(r.v.customer).name)}</div>` }, { label: 'Tarih', render: (r) => (r.date ? NS.date(r.date) : '-') }, { label: 'Mesaj', render: (r) => `<span class="small">${esc(r.text)}</span>` }, { label: '', render: (r) => (sent[r.id] ? badge('Gönderildi ' + NS.date(sent[r.id]), 'ok') : '') }], actions: [{ icon: 'send', act: 's', title: 'SMS', show: (r) => !sent[r.id] }] }); };
    const send = (r) => { NS.smsLog(db, { to: cus(r.v.customer).phone, name: cus(r.v.customer).name, text: r.text }, true); sent[r.id] = today(); };
    on(el, 'click', '[data-act=s]', (e, b) => { send(rows.find((r) => r.id === b.dataset.id)); db.save(); draw(); toast('SMS gönderildi', 'ok'); });
    $('#all', el).onclick = async () => { const L = rows.filter((r) => !sent[r.id]); if (!L.length) return toast('Gönderilecek yok'); if (!(await confirm(`${L.length} müşteriye SMS gönderilsin mi?`))) return; L.forEach(send); db.save(); draw(); toast(`${L.length} SMS gönderildi`, 'ok'); };
    draw();
  }

  // ---------- Cari & tahsilat ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler & Cari', sub: 'Filo / kurumsal müşteriler ve açık hesaplar', single: 'Müşteri', addLabel: 'Müşteri ekle', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad / firma', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'fleet', label: 'Filo / kurumsal', type: 'checkbox' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'borc', label: 'Borcu olan', test: (c) => (c.balance || 0) > 0.01 }, { value: 'filo', label: 'Filo', test: (c) => c.fleet }],
      searchFields: (c) => [c.name, c.phone],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b> ${c.fleet ? badge('Filo', 'info') : ''}<div class="small faint">${esc(c.phone)}</div>` }, { label: 'Araç', cls: 'right', render: (c) => db.all('vehicles', (v) => v.customer === c.id).length }, { label: 'Toplam iş', cls: 'right', render: (c) => money(sum(db.all('jobs', (j) => j.customer === c.id && j.status === 'teslim'), (j) => O.totals(j).total)) }, { key: 'balance', label: 'Bakiye', cls: 'right', render: (c) => ((c.balance || 0) > 0.01 ? `<b style="color:var(--err)">${money(c.balance)}</b>` : '<span class="faint">0</span>') }],
      extraActions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat' }],
      onAction: async (a, c, draw) => { const v = await formModal({ title: `Tahsilat — ${c.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Nakit', 'Kredi kartı', 'Havale'] }], values: { amount: Math.max(0, c.balance || 0) } }); if (!v) return; c.balance = (c.balance || 0) - Number(v.amount); db.insert('payments', { customer: c.id, amount: Number(v.amount), method: v.method, at: new Date().toISOString() }); db.save(); draw(); toast('Tahsilat kaydedildi', 'ok'); } });
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const all = db.all('jobs'); const open = all.filter((j) => j.status !== 'teslim');
    const m30 = all.filter((j) => j.status === 'teslim' && j.at > addDays(new Date(), -30).toISOString());
    const T = m30.map(O.totals); const partProfit = sum(m30.flatMap((j) => j.items.filter((i) => i.type === 'parca' && i.approved !== false)), (i) => (i.price - (i.cost || 0)) * i.qty);
    const ser = NS.dailySeries(all.filter((j) => j.status === 'teslim'), 14, 'at', (j) => O.totals(j).total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/kabul">${icon('plus')} Araç kabul</a>`) + `
      <div class="grid g4 mb">${kpi('Servisteki araç', open.length, 'car', 'info', `<div class="small faint">${open.filter((j) => j.status === 'hazir').length} teslime hazır</div>`)}${kpi('Onay bekleyen', open.filter((j) => j.status === 'onay').length, 'clock', 'warn')}${kpi('30 gün ciro', money(sum(T, (t) => t.total)), 'trend', 'ok', `<div class="small faint">işçilik ${money(sum(T, (t) => t.iscilik))} · parça kârı ${money(partProfit)}</div>`)}${kpi('Açık hesap', money(sum(db.all('customers'), (c) => Math.max(0, c.balance || 0))), 'wallet', 'err')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün teslim cirosu</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div>
      <div class="card"><div class="card-h"><h3>Gelen işler (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (j) => j.complaint)).map(([label, v]) => ({ label, value: v.length })).sort((a, b) => b.value - a.value).slice(0, 6), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Teknisyen yükü</h3></div>${table({ rows: db.all('techs').map((t) => ({ id: t.id, t, n: open.filter((j) => j.tech === t.id).length, d: m30.filter((j) => j.tech === t.id).length, h: sum(m30.filter((j) => j.tech === t.id).flatMap((j) => j.items.filter((i) => i.type === 'iscilik')), (i) => i.qty) })), columns: [{ label: 'Teknisyen', render: (r) => `<b>${esc(r.t.name)}</b><div class="small faint">${esc(r.t.skill)}</div>` }, { label: 'Açık iş', cls: 'right', key: 'n' }, { label: '30 gün iş', cls: 'right', key: 'd' }, { label: 'Faturalı saat', cls: 'right', key: 'h' }] })}</div>
      <div class="card"><div class="card-h"><h3>Kritik parça</h3><a class="btn sm" href="#/parcalar">Stok</a></div>${table({ rows: db.all('parts', (x) => x.stock <= (x.min || 2)), empty: 'Kritik parça yok', columns: [{ label: 'Parça', render: (x) => `<b>${esc(x.name)}</b> <span class="small faint">${esc(x.brand)}</span>` }, { label: 'Stok', cls: 'right', render: (x) => badge(x.stock, 'err') }] })}</div></div>`;
  }

  const ROLES = { admin: 'Servis sahibi', danisman: 'Servis danışmanı', teknisyen: 'Teknisyen' };
  const app = NS.shell({
    id: 'otoservis', integrations: ['sms', 'whatsapp', 'efatura', 'parca', 'tramer', 'printer', 'payment', 'webhook', 'backup'], name: 'Oto Servis', tagline: 'Sanayi & servis yönetimi', icon: 'wrench', accent: '#0369a1', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Servis' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['danisman'] }, { id: 'kabul', label: 'Araç Kabul', icon: 'plus', roles: ['danisman'] }, { id: 'isemirleri', label: 'İş Emirleri', icon: 'kanban' }, { id: 'araclar', label: 'Araçlar', icon: 'car', roles: ['danisman'] }, { id: 'hatirlatma', label: 'Hatırlatmalar', icon: 'bell', roles: ['danisman'] }, { sec: 'Yönetim' }, { id: 'parcalar', label: 'Parça Stoğu', icon: 'box', roles: ['danisman'] }, { id: 'musteriler', label: 'Müşteriler & Cari', icon: 'users', roles: ['danisman'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, kabul: intakePage, isemirleri: jobsPage, araclar: vehiclesPage, hatirlatma: remindersPage, parcalar: partsPage, musteriler: customersPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Servis' }, { name: 'laborRate', label: 'İşçilik saat ücreti (₺)', type: 'number' }, { name: 'serviceKm', label: 'Bakım aralığı (km)', type: 'number' }, { name: 'warrantyDays', label: 'İşçilik garantisi (gün)', type: 'number' }] }) },
  });
  if (myTech() && !location.hash) app.go('isemirleri');
})();
