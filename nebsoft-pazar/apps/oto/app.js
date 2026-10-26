/* NEBSOFT Oto Yıkama & Otopark — plaka ile giriş/çıkış, tarife, yıkama kuyruğu, abonelik ve kasa */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today } = NS;
  const L = () => String.fromCharCode(65 + rand(0, 25));
  const randPlate = () => `${pick(['34', '34', '34', '06', '35', '16', '41'])} ${L()}${L()}${Math.random() < 0.5 ? L() : ''} ${rand(10, 999)}`;
  const norm = (p) => String(p || '').toLocaleUpperCase('tr-TR').replace(/\s+/g, '').replace(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,4})$/, '$1 $2 $3');

  function seed(db) {
    db.data._settings = { bizName: 'Parlak Oto Yıkama & Otopark', bizPhone: '0216 444 99 00', bizAddress: 'Ümraniye, İstanbul', capacity: 60, firstHour: 80, nextHour: 50, dailyMax: 400, graceMin: 10 };
    db.data.users = [{ id: 'u1', name: 'Kadir Patron', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Yusuf Gişe', role: 'gise', pin: '1234', active: true }, { id: 'u3', name: 'Musa Yıkama', role: 'yikama', pin: '1234', active: true }];
    db.data.packages = [{ id: 'w1', name: 'Dış yıkama', price: 250, min: 15, color: '#0284c7' }, { id: 'w2', name: 'İç-dış yıkama', price: 400, min: 30, color: '#16a34a' }, { id: 'w3', name: 'Detaylı temizlik', price: 1200, min: 90, color: '#7c3aed' }, { id: 'w4', name: 'Motor yıkama', price: 350, min: 20, color: '#ea580c' }, { id: 'w5', name: 'Pasta cila', price: 2500, min: 180, color: '#db2777' }, { id: 'w6', name: 'Seramik kaplama', price: 9500, min: 360, color: '#0d9488' }, { id: 'w7', name: 'Koltuk yıkama', price: 1500, min: 120, color: '#ca8a04' }];
    db.data.workers = [{ id: 'k1', name: 'Musa' }, { id: 'k2', name: 'Cemal' }, { id: 'k3', name: 'Rıza' }];
    db.data.subs = Array.from({ length: 10 }, (_, i) => ({ id: 's' + i, plate: randPlate(), name: NS.NAMES[i], phone: NS.phone(), plan: i % 3 === 0 ? 'yikama4' : 'otopark', start: iso(addDays(new Date(), -rand(0, 25))), end: iso(addDays(new Date(), rand(5, 30))), washesLeft: i % 3 === 0 ? rand(0, 4) : null, price: i % 3 === 0 ? 1300 : 3500 }));
    const parks = [], jobs = [];
    for (let d = 14; d >= 0; d--) {
      for (let k = 0; k < rand(30, 60); k++) {
        const inAt = addDays(new Date(), -d); inAt.setHours(rand(7, 21), rand(0, 59));
        if (inAt > new Date()) continue;
        const dur = rand(10, 480);
        const outAt = new Date(inAt.getTime() + dur * 60000);
        const plate = randPlate();
        const open = outAt > new Date() || (d === 0 && Math.random() < 0.35);
        parks.push({ id: NS.uid(), plate, in: inAt.toISOString(), out: open ? null : outAt.toISOString(), fee: open ? 0 : null, pay: open ? null : pick(['nakit', 'kart']) });
        if (Math.random() < 0.3) { const p = pick(db.data.packages.slice(0, 5)); const st = d > 0 || !open ? 'teslim' : pick(['bekliyor', 'yikaniyor', 'hazir']); jobs.push({ id: NS.uid(), plate, pkg: p.id, price: p.price, status: st, worker: pick(['k1', 'k2', 'k3']), in: inAt.toISOString(), done: st === 'teslim' ? new Date(inAt.getTime() + p.min * 60000).toISOString() : null, pay: st === 'teslim' ? pick(['nakit', 'kart']) : null, note: '' }); }
      }
    }
    db.data.parks = parks; db.data.jobs = jobs;
  }
  const db = new NS.DB('oto', seed);
  const S = () => db.settings({ capacity: 50, firstHour: 80, nextHour: 50, dailyMax: 400, graceMin: 10 });
  const pkg = (id) => db.get('packages', id) || { name: '-', color: '#64748b' };
  const wk = (id) => db.get('workers', id) || { name: '-' };
  const plateHtml = (p, lg) => `<span class="plate ${lg ? 'lg' : ''}"><span>${esc(p)}</span></span>`;
  const inside = () => db.all('parks', (p) => !p.out);
  const subOf = (plate) => db.find('subs', (s) => norm(s.plate) === norm(plate) && s.end >= today());
  // Tarife: ilk saat + sonraki her başlayan saat, günlük üst sınır, ücretsiz süre ve abone muafiyeti
  function fee(p, at = new Date()) {
    const s = S(); const min = Math.max(0, (at - new Date(p.in)) / 60000);
    if (subOf(p.plate) && subOf(p.plate).plan === 'otopark') return 0;
    if (min <= s.graceMin) return 0;
    const days = Math.floor(min / 1440); const rest = min % 1440;
    const part = rest <= 0 ? 0 : Math.min(s.dailyMax, s.firstHour + Math.max(0, Math.ceil(rest / 60) - 1) * s.nextHour);
    const full = days * s.dailyMax + part;
    // Müşteri sayfasından önceden ödendiyse: 15 dk içinde çıkış ücretsiz, sonrası fark alınır
    if (p.paidAt) return at - new Date(p.paidAt) <= 15 * 60000 ? 0 : Math.max(0, full - (p.paidAmount || 0));
    return full;
  }
  const dur = (p, at = new Date()) => { const m = Math.round(((p.out ? new Date(p.out) : at) - new Date(p.in)) / 60000); return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`; };

  // ---------- Gişe ----------
  function gatePage(el, p, app) {
    const s = S(); const ins = inside();
    el.innerHTML = pageHead('Giriş / Çıkış', 'Plakayı yazın veya okutun — içerideyse çıkış, değilse giriş yapılır', `<span class="badge acc" style="font-size:13px;padding:6px 12px">${ins.length} / ${s.capacity} dolu</span>`) + `
      <div class="park mb"><i style="width:${Math.min(100, (ins.length / s.capacity) * 100)}%"></i></div>
      <div class="grid g-21"><div class="col"><div class="card pad"><input class="input gate-in" id="pl" placeholder="34 ABC 123" autocomplete="off"><div class="row mt"><button class="btn primary lg grow" id="go">${icon('right')} Devam (Enter)</button><button class="btn lg" id="cam" title="Kameradan plaka oku">${icon('car')} Kamera</button><button class="btn lg" id="bar" title="Bariyeri aç">${icon('lock')} Bariyer</button></div><p class="small muted mt">Tarife: ilk saat ${money(s.firstHour)}, sonraki her saat ${money(s.nextHour)}, günlük en fazla ${money(s.dailyMax)}. İlk ${s.graceMin} dk ücretsiz.</p></div>
        <div class="card"><div class="card-h"><h3>İçerideki araçlar</h3>${NS.searchBox('iq', 'Plaka ara...')}</div><div id="il"></div></div></div>
        <div class="card"><div class="card-h"><h3>Son hareketler</h3></div><div class="card-b" style="max-height:640px;overflow:auto">${db.all('parks', (x) => x.out && iso(x.out) === today()).sort((a, b) => b.out.localeCompare(a.out)).slice(0, 30).map((x) => `<div class="list-item small">${plateHtml(x.plate)}<span class="grow faint">${NS.time(x.in)} → ${NS.time(x.out)}</span><b>${money(x.fee)}</b></div>`).join('') || '<div class="faint small">Bugün çıkış yok</div>'}</div></div></div>`;
    const drawIn = (q = '') => { $('#il', el).innerHTML = table({ rows: ins.filter((x) => NS.match(q, x.plate)).sort((a, b) => a.in.localeCompare(b.in)), empty: 'Otopark boş', columns: [{ label: 'Plaka', render: (x) => plateHtml(x.plate) + (subOf(x.plate) ? ' ' + badge('Abone', 'ok') : '') }, { label: 'Giriş', render: (x) => NS.time(x.in) }, { label: 'Süre', render: (x) => dur(x) }, { label: 'Ücret', cls: 'right', render: (x) => `<b>${money(fee(x))}</b>` }, { label: 'Yıkama', render: (x) => { const j = db.find('jobs', (jb) => jb.plate === x.plate && jb.status !== 'teslim'); return j ? badge(pkg(j.pkg).name, 'info') : ''; } }], actions: [{ label: 'Çıkış', act: 'out' }] }); };
    const run = async () => {
      const plate = norm($('#pl', el).value); if (plate.length < 5) return toast('Plaka girin', 'err');
      const cur = db.find('parks', (x) => !x.out && norm(x.plate) === plate);
      if (cur) return checkout(app, cur);
      if (ins.length >= s.capacity && !(await confirm('Otopark dolu görünüyor. Yine de giriş yapılsın mı?', { ok: 'Giriş', danger: false }))) return;
      const sub = subOf(plate);
      const v = await formModal({ title: `Giriş: ${plate}`, fields: [{ name: 'wash', label: 'Yıkama hizmeti', type: 'select', empty: 'Sadece otopark', options: db.all('packages').map((x) => ({ value: x.id, label: `${x.name} — ${money(x.price)}` })) }, { name: 'note', label: 'Not (hasar, eşya...)', full: true }], submitLabel: 'Giriş yap', extra: sub ? `<div class="card pad mt" style="background:var(--ok-soft);border:0">${icon('check')} Abone: <b>${esc(sub.name)}</b> · ${sub.plan === 'otopark' ? 'Aylık otopark' : `Yıkama paketi (${sub.washesLeft} hak)`} · ${NS.date(sub.end)} tarihine kadar</div>` : '' });
      if (!v) return;
      db.insert('parks', { plate, in: new Date().toISOString(), out: null, note: v.note });
      openBarrier('giris', plate);
      if (v.wash) { const pk = pkg(v.wash); const free = sub && sub.plan === 'yikama4' && sub.washesLeft > 0; if (free) sub.washesLeft--; db.insert('jobs', { plate, pkg: pk.id, price: free ? 0 : pk.price, status: 'bekliyor', worker: null, in: new Date().toISOString(), note: v.note + (free ? ' (abonelik)' : '') }); }
      NS.beep(1200, 80); toast(`${plate} giriş yaptı`, 'ok');
      printTicket(plate); app.refresh();
    };
    $('#pl', el).onkeydown = (e) => { if (e.key === 'Enter') run(); };
    $('#go', el).onclick = run;
    // Plaka tanıma kamerası: son okunan plaka alınır; abone ise bariyer otomatik açılır
    $('#cam', el).onclick = async () => {
      if (!NS.integ) return; const r = await NS.integ.call('anpr', 'son-plaka', { lane: 'giris' }, { silent: true });
      if (!r || !r.ok) return toast(r && r.disabled ? 'Plaka tanıma kamerası bağlı değil — Entegrasyonlar sayfasından açın' : 'Kameradan plaka okunamadı', 'err');
      const plate = (r.data && r.data.plate) || (r.simulated ? NS.pick(ins.length && Math.random() < 0.5 ? ins.map((x) => x.plate) : ['34 KLM 482', '06 BRT 19', '35 NB 7710']) : '');
      if (!plate) return; $('#pl', el).value = plate; toast(`Kamera: ${plate}`, 'ok');
      const sub = subOf(norm(plate)); if (sub && sub.plan === 'otopark' && !db.find('parks', (x) => !x.out && norm(x.plate) === norm(plate))) { db.insert('parks', { plate: norm(plate), in: new Date().toISOString(), out: null, note: 'Kamera ile otomatik (abone)' }); openBarrier('giris', plate); toast(`Abone ${plate} — bariyer açıldı`, 'ok'); app.refresh(); } else run();
    };
    $('#bar', el).onclick = () => openBarrier('manuel', $('#pl', el).value || '-');
    $('#iq', el).oninput = (e) => drawIn(e.target.value);
    on(el, 'click', '[data-act=out]', (e, b) => checkout(app, db.get('parks', b.dataset.id)));
    drawIn(); setTimeout(() => $('#pl', el).focus(), 50);
  }
  function openBarrier(dir, plate) {
    if (NS.integ && NS.integ.isOn('anpr')) NS.integ.call('anpr', 'bariyer-ac', { dir, plate, relay: NS.integ.cfg('anpr').relay }, { silent: true });
    db.log('Bariyer', `${dir} · ${plate}`);
  }
  function printTicket(plate) {
    const s = S();
    (NS.integ ? NS.integ.printReceipt : NS.printHtml)(`<div class="c"><div class="big">${esc(s.bizName)}</div><div>${esc(s.bizPhone)}</div></div><hr><div class="c big">${esc(plate)}</div><div class="c">Giriş: ${NS.dt(new Date())}</div><div class="c">${NS.barcodeSvg(plate.replace(/\s/g, ''), { height: 40 })}</div><hr><div class="c">İlk saat ${money(s.firstHour)} · Sonraki saat ${money(s.nextHour)}</div><div class="c">Bu fişi kaybetmeyiniz.</div>`, { title: plate });
  }
  async function checkout(app, p) {
    const f = fee(p); const jobs = db.all('jobs', (j) => j.plate === p.plate && j.status !== 'teslim');
    const total = f + sum(jobs, (j) => j.price);
    const v = await formModal({ title: `Çıkış: ${p.plate}`, fields: [{ name: 'pay', label: 'Ödeme', type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }] }, { name: 'disc', label: 'İndirim (₺)', type: 'number', value: 0 }], submitLabel: `Tahsil et ${money(total)}`, extra: `<div class="card pad mt"><div class="list-item"><span class="grow">Otopark (${dur(p)})${subOf(p.plate) ? ' · abone' : ''}</span><b>${money(f)}</b></div>${jobs.map((j) => `<div class="list-item"><span class="grow">${esc(pkg(j.pkg).name)} ${j.status !== 'hazir' ? badge('Henüz hazır değil', 'warn') : ''}</span><b>${money(j.price)}</b></div>`).join('')}<div class="list-item"><b class="grow">Toplam</b><b style="font-size:20px">${money(total)}</b></div></div>` });
    if (!v) return;
    const d = Math.min(total, v.disc || 0);
    if (v.pay === 'kart' && total - d > 0 && NS.integ) { const r = await NS.integ.cardPayment(total - d); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); }
    if (v.pay === 'nakit' && NS.integ) NS.integ.openDrawer();
    p.out = new Date().toISOString(); p.fee = Math.max(0, f - d); p.pay = v.pay;
    jobs.forEach((j) => { j.status = 'teslim'; j.done = j.done || new Date().toISOString(); j.pay = v.pay; });
    db.log('Çıkış', `${p.plate} · ${money(total - d)}`); db.save(); NS.beep(900, 120);
    openBarrier('cikis', p.plate);
    if (total - d > 0 && NS.integ && NS.integ.isOn('okc')) NS.integ.call('okc', 'mali-fis', { no: p.plate, total: total - d, items: [{ name: `Otopark ${dur(p)}`, qty: 1, price: Math.max(0, f - d), vat: 20 }, ...jobs.map((j) => ({ name: pkg(j.pkg).name, qty: 1, price: j.price, vat: 20 }))], payments: [{ type: v.pay, amount: total - d }] }, { silent: true }); toast(`${p.plate} çıkış yaptı · ${money(total - d)}`, 'ok'); app.refresh();
  }

  // ---------- Yıkama kuyruğu ----------
  function washPage(el, p, app) {
    const lanes = [['bekliyor', 'Sırada', 'clock', '#64748b'], ['yikaniyor', 'Yıkanıyor', 'drop', '#0284c7'], ['hazir', 'Hazır', 'check', '#16a34a'], ['teslim', 'Bugün teslim', 'user', '#334155']];
    const jobs = db.all('jobs', (j) => j.status !== 'teslim' || iso(j.done || j.in) === today());
    el.innerHTML = pageHead('Yıkama Kuyruğu', 'Kartlardaki butonlarla işi ilerletin', `<button class="btn primary" id="nj">${icon('plus')} Yıkama ekle (otoparksız)</button>`) + `
      <div class="lanes">${lanes.map(([k, l, ic, c]) => { const js = jobs.filter((j) => j.status === k).sort((a, b) => a.in.localeCompare(b.in)); return `<div class="lane"><h4 style="color:${c}">${icon(ic)} ${l} <span class="badge">${js.length}</span></h4>${js.map((j) => { const pk = pkg(j.pkg); const wait = Math.round((Date.now() - new Date(j.in)) / 60000); return `<div class="job" style="border-left:4px solid ${pk.color}"><div class="row between nw">${plateHtml(j.plate)}<b>${money(j.price)}</b></div><div class="mt"><b>${esc(pk.name)}</b></div><div class="small muted">${k === 'teslim' ? 'Teslim ' + NS.time(j.done) : `${wait} dk önce · ~${pk.min} dk sürer`}${j.worker ? ' · ' + esc(wk(j.worker).name) : ''}</div>${j.note ? `<div class="small" style="color:var(--warn)">${esc(j.note)}</div>` : ''}
        <div class="row mt">${k === 'bekliyor' ? `<button class="btn sm primary grow" data-j="${j.id}|yikaniyor">Başla</button>` : k === 'yikaniyor' ? `<button class="btn sm ok grow" data-j="${j.id}|hazir">Bitti</button>` : k === 'hazir' ? `<button class="btn sm grow" data-j="${j.id}|teslim">Teslim et</button>` : ''}</div></div>`; }).join('') || '<div class="faint small center">Boş</div>'}</div>`; }).join('')}</div>`;
    on(el, 'click', '[data-j]', async (e, b) => {
      const [id, st] = b.dataset.j.split('|'); const j = db.get('jobs', id);
      if (st === 'yikaniyor') { const v = await formModal({ title: 'Yıkamacı', fields: [{ name: 'w', label: 'Kim yıkıyor?', type: 'select', options: db.all('workers').map((x) => ({ value: x.id, label: x.name })) }] }); if (!v) return; j.worker = v.w; j.started = new Date().toISOString(); }
      if (st === 'teslim') { const pk = db.find('parks', (x) => !x.out && x.plate === j.plate); if (pk) return checkout(app, pk); const v = await formModal({ title: `Tahsilat ${money(j.price)}`, fields: [{ name: 'pay', label: 'Ödeme', type: 'select', options: ['nakit', 'kart'] }] }); if (!v) return; j.pay = v.pay; j.done = new Date().toISOString(); }
      j.status = st; if (st === 'hazir') { j.done = new Date().toISOString(); NS.beep(1300, 150); }
      db.save(); app.refresh();
    });
    $('#nj', el).onclick = async () => { const v = await formModal({ title: 'Yıkama işi', fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'pkg', label: 'Hizmet', type: 'select', options: db.all('packages').map((x) => ({ value: x.id, label: `${x.name} — ${money(x.price)}` })) }, { name: 'note', label: 'Not' }] }); if (v) { db.insert('jobs', { plate: norm(v.plate), pkg: v.pkg, price: pkg(v.pkg).price, status: 'bekliyor', in: new Date().toISOString(), note: v.note }); app.refresh(); } };
  }

  // ---------- Özet / abonelik / geçmiş / kasa ----------
  function dashboard(el, p, app) {
    const s = S(); const t = today();
    const outs = db.all('parks', (x) => x.out && iso(x.out) === t), jobsD = db.all('jobs', (j) => j.status === 'teslim' && iso(j.done || j.in) === t);
    const revPark = sum(outs, (x) => x.fee), revWash = sum(jobsD, (j) => j.price);
    const hours = Array.from({ length: 16 }, (_, i) => i + 7).map((h) => ({ label: String(h), value: db.all('parks', (x) => new Date(x.in).getHours() === h && x.in > addDays(new Date(), -14).toISOString()).length / 14 }));
    const ser = NS.dailySeries([...db.all('parks', (x) => x.out).map((x) => ({ at: x.out, v: x.fee })), ...db.all('jobs', (j) => j.status === 'teslim').map((j) => ({ at: j.done || j.in, v: j.price }))], 14, 'at', (x) => x.v);
    el.innerHTML = pageHead(s.bizName, NS.dateLong(new Date()), `<a class="btn" href="arac.html" target="_blank" rel="noopener">${icon('globe')} Müşteri sayfası</a><a class="btn primary" href="#/gise">${icon('car2')} Giriş / çıkış</a>`) + `
      <div class="grid g4 mb">${kpi('Doluluk', `${inside().length} / ${s.capacity}`, 'car2', '', `<div class="park mt" style="height:8px"><i style="width:${Math.min(100, (inside().length / s.capacity) * 100)}%"></i></div>`)}${kpi('Bugünkü ciro', money(revPark + revWash), 'trend', 'ok')}${kpi('Otopark / yıkama', `${money(revPark)} · ${money(revWash)}`, 'wallet', 'info')}${kpi('Kuyrukta', db.all('jobs', (j) => ['bekliyor', 'yikaniyor'].includes(j.status)).length + ' araç', 'drop', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>14 günlük ciro</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money })}</div></div><div class="card"><div class="card-h"><h3>Saatlik ortalama giriş</h3></div><div class="card-b">${chart.bars(hours, { format: num })}</div></div></div>
      <div class="card"><div class="card-h"><h3>Hizmet dağılımı (30 gün)</h3></div><div class="card-b">${chart.donut(db.all('packages').map((x) => ({ label: x.name, value: db.all('jobs', (j) => j.pkg === x.id && j.in > addDays(new Date(), -30).toISOString()).length, color: x.color })).filter((x) => x.value), { size: 140 })}</div></div>`;
  }
  function subsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'subs', title: 'Abonelikler', sub: 'Aylık otopark ve yıkama paketi aboneleri', single: 'Abone', addLabel: 'Yeni abone', emptyIcon: 'key',
      fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'plan', label: 'Plan', type: 'select', options: [{ value: 'otopark', label: 'Aylık otopark' }, { value: 'yikama4', label: 'Aylık 4 yıkama' }] }, { name: 'start', label: 'Başlangıç', type: 'date' }, { name: 'end', label: 'Bitiş', type: 'date' }, { name: 'price', label: 'Ücret', type: 'number' }, { name: 'washesLeft', label: 'Kalan yıkama', type: 'number' }],
      defaults: () => ({ start: today(), end: iso(addDays(new Date(), 30)), plan: 'otopark', price: 3500, washesLeft: 4 }), beforeSave: (v) => { v.plate = norm(v.plate); },
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'a', label: 'Aktif', test: (x) => x.end >= today() }, { value: 'b', label: 'Süresi biten', test: (x) => x.end < today() }],
      columns: [{ key: 'plate', label: 'Plaka', render: (x) => plateHtml(x.plate) }, { key: 'name', label: 'Abone', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.phone || '')}</div>` }, { key: 'plan', label: 'Plan', render: (x) => (x.plan === 'otopark' ? badge('Aylık otopark', 'info') : badge(`Yıkama (${x.washesLeft} hak)`, 'acc')) }, { key: 'end', label: 'Bitiş', render: (x) => (x.end < today() ? badge('Bitti ' + NS.date(x.end), 'err') : NS.date(x.end)) }, { key: 'price', label: 'Ücret', cls: 'right', render: (x) => money(x.price) }],
      extraActions: [{ icon: 'refresh', act: 'renew', title: '1 ay uzat' }], onAction: (a, x, draw) => { x.end = iso(addDays(x.end > today() ? x.end : today(), 30)); if (x.plan === 'yikama4') x.washesLeft = 4; db.save(); toast('Abonelik uzatıldı', 'ok'); draw(); },
    });
  }
  function historyPage(el, p, app) {
    let q = '';
    el.innerHTML = pageHead('Araç Geçmişi', 'Plakaya göre tüm otopark ve yıkama kayıtları') + `<div class="card pad mb">${NS.searchBox('q', 'Plaka yazın (ör. 34 ABC 123)')}</div><div id="r"></div>`;
    const draw = () => {
      const n = norm(q);
      if (n.length < 3) { $('#r', el).innerHTML = '<div class="empty">Plaka yazın</div>'; return; }
      const parks = db.all('parks', (x) => norm(x.plate).includes(n)).sort((a, b) => b.in.localeCompare(a.in)), jobs = db.all('jobs', (j) => norm(j.plate).includes(n)).sort((a, b) => b.in.localeCompare(a.in));
      $('#r', el).innerHTML = `<div class="grid g2"><div class="card"><div class="card-h"><h3>Otopark (${parks.length})</h3></div>${table({ rows: parks.slice(0, 50), columns: [{ label: 'Plaka', render: (x) => plateHtml(x.plate) }, { label: 'Giriş', render: (x) => NS.dt(x.in) }, { label: 'Süre', render: (x) => dur(x) }, { label: 'Ücret', cls: 'right', render: (x) => (x.out ? money(x.fee) : badge('İçeride', 'info')) }] })}</div><div class="card"><div class="card-h"><h3>Yıkama (${jobs.length})</h3></div>${table({ rows: jobs.slice(0, 50), columns: [{ label: 'Tarih', render: (j) => NS.dt(j.in) }, { label: 'Hizmet', render: (j) => esc(pkg(j.pkg).name) }, { label: 'Tutar', cls: 'right', render: (j) => money(j.price) }] })}</div></div>`;
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    draw();
  }
  function cashPage(el, p, app) {
    let day = today();
    const draw = () => {
      const outs = db.all('parks', (x) => x.out && iso(x.out) === day), jobs = db.all('jobs', (j) => j.status === 'teslim' && iso(j.done || j.in) === day);
      const rows = [...outs.map((x) => ({ id: x.id, t: x.out, d: `Otopark ${x.plate} (${dur(x)})`, pay: x.pay, v: x.fee })), ...jobs.map((j) => ({ id: j.id, t: j.done || j.in, d: `${pkg(j.pkg).name} ${j.plate}`, pay: j.pay, v: j.price }))].sort((a, b) => b.t.localeCompare(a.t));
      el.innerHTML = pageHead('Kasa & Gün Sonu', NS.dateLong(day), `<input type="date" class="input" id="dd" value="${day}" style="max-width:170px"><button class="btn" id="z">${icon('print')} Gün sonu raporu</button>`) + `
        <div class="grid g4 mb">${kpi('Toplam', money(sum(rows, (r) => r.v)), 'wallet', 'ok')}${kpi('Nakit', money(sum(rows.filter((r) => r.pay === 'nakit'), (r) => r.v)), 'cash')}${kpi('Kart', money(sum(rows.filter((r) => r.pay === 'kart'), (r) => r.v)), 'card', 'info')}${kpi('İşlem', rows.length, 'receipt', 'warn')}</div>
        <div class="card">${table({ rows, columns: [{ label: 'Saat', render: (r) => NS.time(r.t) }, { label: 'Açıklama', key: 'd' }, { label: 'Ödeme', render: (r) => badge(r.pay || '-', r.pay === 'kart' ? 'info' : 'ok') }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.v)}</b>` }] })}</div>`;
      $('#dd', el).onchange = (e) => { day = e.target.value; draw(); };
      $('#z', el).onclick = () => (NS.integ ? NS.integ.printReceipt : NS.printHtml)(`<div class="c big">${esc(S().bizName)}</div><div class="c">GÜN SONU · ${NS.date(day)}</div><hr><div class="r"><span>Otopark (${outs.length})</span><span>${money(sum(outs, (x) => x.fee))}</span></div><div class="r"><span>Yıkama (${jobs.length})</span><span>${money(sum(jobs, (j) => j.price))}</span></div><hr><div class="r"><span>Nakit</span><span>${money(sum(rows.filter((r) => r.pay === 'nakit'), (r) => r.v))}</span></div><div class="r"><span>Kart</span><span>${money(sum(rows.filter((r) => r.pay === 'kart'), (r) => r.v))}</span></div><div class="r big"><span>TOPLAM</span><span>${money(sum(rows, (r) => r.v))}</span></div>`, { title: 'Gün sonu' });
    };
    draw();
  }

  const ROLES = { admin: 'Yönetici', gise: 'Gişe', yikama: 'Yıkamacı' };
  const app = NS.shell({
    id: 'oto', integrations: ['printer','pos','barcode','sms','whatsapp','webhook','backup'], name: 'Oto Yıkama & Otopark', tagline: 'Plaka ile hızlı işlem', icon: 'car2', accent: '#0284c7', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Operasyon' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['gise'] }, { id: 'gise', label: 'Giriş / Çıkış', icon: 'car2', roles: ['gise'] }, { id: 'yikama', label: 'Yıkama Kuyruğu', icon: 'drop' }, { id: 'gecmis', label: 'Araç Geçmişi', icon: 'search' }, { sec: 'Yönetim' }, { id: 'abonelik', label: 'Abonelikler', icon: 'key', roles: ['gise'] }, { id: 'kasa', label: 'Kasa & Gün Sonu', icon: 'cash', roles: ['gise'] }, { id: 'hizmetler', label: 'Hizmet & Fiyatlar', icon: 'tag', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar & Tarife', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, gise: gatePage, yikama: washPage, gecmis: historyPage, abonelik: subsPage, kasa: cashPage,
      hizmetler: (el, p, a) => NS.crud(el, a, { col: 'packages', title: 'Hizmet & Fiyatlar', single: 'Hizmet', addLabel: 'Yeni hizmet', fields: [{ name: 'name', label: 'Hizmet', required: true }, { name: 'price', label: 'Fiyat', type: 'number', required: true }, { name: 'min', label: 'Süre (dk)', type: 'number' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Hizmet', render: (x) => `<b style="color:${x.color}">${esc(x.name)}</b>` }, { key: 'min', label: 'Süre', render: (x) => x.min + ' dk' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (x) => money(x.price) }, { label: '30 gün adet', cls: 'right', render: (x) => db.all('jobs', (j) => j.pkg === x.id && j.in > addDays(new Date(), -30).toISOString()).length }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Otopark tarifesi' }, { name: 'capacity', label: 'Kapasite (araç)', type: 'number' }, { name: 'graceMin', label: 'Ücretsiz süre (dk)', type: 'number' }, { name: 'firstHour', label: 'İlk saat (₺)', type: 'number' }, { name: 'nextHour', label: 'Sonraki her saat (₺)', type: 'number' }, { name: 'dailyMax', label: 'Günlük en fazla (₺)', type: 'number' }] }),
    },
  });
  if (NS.currentUser && NS.currentUser.role === 'yikama' && !location.hash.includes('yikama')) app.go('yikama');
})();
