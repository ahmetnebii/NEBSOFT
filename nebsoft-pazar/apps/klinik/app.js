/* NEBSOFT Klinik — hasta kartı, anamnez, diş şeması/tedavi planı, hekim takvimi, ödeme ve reçete */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today } = NS;
  const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const ANAMNEZ = ['Kalp hastalığı', 'Yüksek tansiyon', 'Diyabet', 'Astım', 'Hepatit', 'Kan sulandırıcı kullanımı', 'Penisilin alerjisi', 'Lokal anestezi alerjisi', 'Hamilelik', 'Sigara kullanımı', 'Kemik erimesi ilacı', 'Epilepsi'];

  function seed(db) {
    db.data._settings = { bizName: 'Gülüş Ağız ve Diş Sağlığı Polikliniği', bizPhone: '0216 222 33 44', bizAddress: 'Bağdat Cad. No:300 Kadıköy/İstanbul', open: '09:00', close: '19:00', slot: 30 };
    db.data.users = [{ id: 'u1', name: 'Dt. Aylin Kara', role: 'admin', pin: '1234', active: true, doctor: 'd1' }, { id: 'u2', name: 'Dt. Burak Şahin', role: 'hekim', pin: '1234', active: true, doctor: 'd2' }, { id: 'u3', name: 'Ece Sekreter', role: 'sekreter', pin: '1234', active: true }];
    db.data.doctors = [{ id: 'd1', name: 'Dt. Aylin Kara', spec: 'Ortodonti', color: '#2563eb' }, { id: 'd2', name: 'Dt. Burak Şahin', spec: 'Endodonti', color: '#0d9488' }, { id: 'd3', name: 'Dr. Dt. Cem Ay', spec: 'Ağız-diş-çene cerrahisi', color: '#9333ea' }];
    db.data.treatments = [['Muayene', 750, false], ['Panoramik röntgen', 900, false], ['Diş taşı temizliği', 1800, false], ['Kompozit dolgu', 2500, true], ['Kanal tedavisi (tek kanal)', 4500, true], ['Kanal tedavisi (çok kanal)', 6500, true], ['Diş çekimi', 1800, true], ['Gömülü 20lik çekimi', 5500, true], ['Zirkonyum kron', 9000, true], ['Porselen kron', 6500, true], ['İmplant', 28000, true], ['Beyazlatma (ofis tipi)', 8000, false], ['Şeffaf plak (ortodonti)', 65000, false], ['Fissür örtücü', 900, true]].map(([name, price, tooth], i) => ({ id: 'tr' + i, name, price, tooth }));
    const pts = NS.NAMES.slice(0, 26).map((n, i) => ({ id: 'p' + i, no: String(20000 + i), name: n, phone: NS.phone(), tc: String(rand(10000000000, 99999999999)), birth: `${rand(1955, 2015)}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, gender: NS.sampleGender(n), blood: pick(['A Rh+', '0 Rh+', 'B Rh+', 'AB Rh+', 'A Rh-', '0 Rh-']), anamnez: ANAMNEZ.filter(() => Math.random() < 0.08), notes: '', created: addDays(new Date(), -rand(5, 500)).toISOString(), missing: Math.random() < 0.3 ? [pick([18, 28, 38, 48])] : [] }));
    db.data.patients = pts;
    const plans = [];
    pts.forEach((p) => {
      const n = rand(0, 4);
      for (let k = 0; k < n; k++) {
        const t = pick(db.data.treatments.filter((x) => x.tooth));
        const done = Math.random() < 0.55;
        plans.push({ id: NS.uid(), patient: p.id, tooth: pick([...UPPER, ...LOWER].filter((x) => !p.missing.includes(x))), treatment: t.id, price: t.price, status: done ? 'done' : 'planned', doctor: pick(['d1', 'd2', 'd3']), date: done ? iso(addDays(new Date(), -rand(1, 90))) : null });
      }
      if (Math.random() < 0.5) plans.push({ id: NS.uid(), patient: p.id, tooth: null, treatment: 'tr2', price: 1800, status: 'done', doctor: 'd2', date: iso(addDays(new Date(), -rand(1, 120))) });
    });
    db.data.plans = plans;
    db.data.payments = pts.flatMap((p) => { const d = sum(plans.filter((x) => x.patient === p.id && x.status === 'done'), (x) => x.price); return d && Math.random() < 0.8 ? [{ id: NS.uid(), patient: p.id, amount: Math.round(d * pick([1, 1, 0.5])), type: pick(['kart', 'nakit']), at: addDays(new Date(), -rand(0, 60)).toISOString() }] : []; });
    const appts = [];
    for (let d = -14; d <= 10; d++) {
      const date = iso(addDays(new Date(), d)); if (new Date(date + 'T12:00').getDay() === 0) continue;
      db.data.doctors.forEach((doc) => { const used = new Set(); for (let k = 0; k < rand(3, 8); k++) { const h = rand(9, 18), m = pick([0, 30]); const t = `${NS.pad(h)}:${NS.pad(m)}`; if (used.has(t)) continue; used.add(t); appts.push({ id: NS.uid(), date, time: t, doctor: doc.id, patient: pick(pts).id, reason: pick(['Kontrol', 'Dolgu', 'Kanal tedavisi seansı', 'Diş taşı temizliği', 'İlk muayene', 'İmplant kontrol', 'Plak kontrolü']), status: d < 0 ? (Math.random() < 0.9 ? 'geldi' : 'gelmedi') : 'bekliyor' }); } });
    }
    db.data.appts = appts;
    db.data.visits = [];
  }
  const db = new NS.DB('klinik', seed);
  const S = () => db.settings({ open: '09:00', close: '19:00', slot: 30 });
  const pat = (id) => db.get('patients', id) || { name: '-', anamnez: [], missing: [] };
  const doc = (id) => db.get('doctors', id) || { name: '-', color: '#64748b' };
  const trt = (id) => db.get('treatments', id) || { name: '-' };
  const age = (p) => (p.birth ? new Date().getFullYear() - Number(p.birth.slice(0, 4)) : '-');
  const planTotal = (pid, st) => sum(db.all('plans', (x) => x.patient === pid && (!st || x.status === st)), (x) => x.price);
  const balance = (pid) => planTotal(pid, 'done') - sum(db.all('payments', (x) => x.patient === pid), (x) => x.amount);
  const myDoc = () => (NS.currentUser && NS.currentUser.role === 'hekim' ? NS.currentUser.doctor : null);
  const PF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'tc', label: 'TC kimlik no' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'gender', label: 'Cinsiyet', type: 'select', options: [{ value: 'K', label: 'Kadın' }, { value: 'E', label: 'Erkek' }] }, { name: 'blood', label: 'Kan grubu', type: 'select', options: ['', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'] }, { name: 'notes', label: 'Not', full: true }];

  // ---------- Hasta kartı ----------
  function patientPage(el, id, app) {
    const p = db.get('patients', id);
    if (!p) return app.go('hastalar');
    const plans = db.all('plans', (x) => x.patient === id);
    const toothState = (n) => { if ((p.missing || []).includes(n)) return 'missing'; const ps = plans.filter((x) => x.tooth === n); if (!ps.length) return ''; return ps.some((x) => x.status === 'planned') ? 'planned' : 'done'; };
    const toothLabel = (n) => { const ps = plans.filter((x) => x.tooth === n); return ps.length ? trt(ps[ps.length - 1].treatment).name.split(' ')[0] : ''; };
    const jaw = (arr, low) => `<div class="jaw">${arr.map((n) => `<div class="tooth ${low ? 'low' : ''} ${toothState(n)}" data-tooth="${n}">${n}<span class="tt">${esc(toothLabel(n))}</span></div>`).join('')}</div>`;
    const bal = balance(id);
    const apps = db.all('appts', (a) => a.patient === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/hastalar">${icon('back')} Hastalar</a></div>
      <div class="card pad mb row"><div class="avatar lg" style="width:60px;height:60px;font-size:20px">${esc(NS.initials(p.name))}</div><div class="grow"><h1>${esc(p.name)}</h1><div class="muted">Dosya #${esc(p.no)} · ${age(p)} yaş · ${p.gender === 'K' ? 'Kadın' : 'Erkek'} · ${esc(p.blood || '')} · ${esc(p.phone)}</div>
        <div class="row mt gap-s">${(p.anamnez || []).map((a) => badge(a, 'err')).join('') || badge('Anamnezde risk yok', 'ok')}</div></div>
        <div class="row mt gap-s">${p.kps ? badge('Kimlik doğrulandı', 'ok') : `<button class="btn sm" data-x="kps">${icon('shield')} Kimlik doğrula (KPS)</button>`} ${p.enabizAt ? badge('e-Nabız: ' + NS.date(p.enabizAt), 'info') : ''}</div></div>
        <div class="col"><button class="btn primary" data-x="appt">${icon('calendar')} Randevu ver</button><button class="btn" data-x="anam">${icon('heart')} Anamnez</button><button class="btn" data-x="rx">${icon('pill')} Reçete</button><button class="btn" data-x="enb">${icon('send')} e-Nabız’a gönder</button></div></div>
      <div class="grid g4 mb">${kpi('Planlanan tedavi', money(planTotal(id, 'planned')), 'clock', 'warn')}${kpi('Yapılan tedavi', money(planTotal(id, 'done')), 'check', 'ok')}${kpi('Ödenen', money(sum(db.all('payments', (x) => x.patient === id), (x) => x.amount)), 'wallet', 'info')}${kpi('Bakiye', money(bal), 'alert', bal > 0 ? 'err' : 'ok')}</div>
      <div class="card mb"><div class="card-h"><h3>${icon('tooth')} Diş şeması ve tedavi planı</h3><span class="small muted">Dişe tıklayarak tedavi ekleyin</span><span class="grow"></span>${badge('Planlandı', 'warn')} ${badge('Yapıldı', 'ok')} <span class="badge">Eksik diş</span><button class="btn sm" data-x="gen">${icon('plus')} Genel tedavi</button></div>
        <div class="card-b">${jaw(UPPER)}<div class="jaw-sep"></div>${jaw(LOWER, true)}</div></div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Tedavi kalemleri</h3><button class="btn sm" data-x="printplan">${icon('print')} Tedavi planı yazdır</button></div>${table({ rows: plans.sort((a, b) => (a.status === 'planned' ? -1 : 1)), empty: 'Tedavi kaydı yok', columns: [{ label: 'Diş', render: (x) => (x.tooth ? `<b>${x.tooth}</b>` : '<span class="faint">Genel</span>') }, { label: 'Tedavi', render: (x) => esc(trt(x.treatment).name) }, { label: 'Hekim', render: (x) => `<span style="color:${doc(x.doctor).color}">${esc(doc(x.doctor).name)}</span>` }, { label: 'Durum', render: (x) => (x.status === 'done' ? badge('Yapıldı ' + NS.date(x.date), 'ok') : badge('Planlandı', 'warn')) }, { label: 'Ücret', cls: 'right', render: (x) => money(x.price) }], actions: [{ label: 'Yapıldı', act: 'done', show: (x) => x.status === 'planned' }, { icon: 'trash', act: 'del' }] })}</div>
        <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Ödemeler</h3><button class="btn sm primary" data-x="pay">${icon('plus')} Tahsilat</button></div><div class="card-b">${db.all('payments', (x) => x.patient === id).reverse().map((x) => `<div class="list-item small"><span class="grow">${NS.dt(x.at)} · ${esc(x.type)}</span><b>${money(x.amount)}</b></div>`).join('') || '<div class="faint small">Ödeme yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Muayene notları</h3><button class="btn sm" data-x="note">${icon('plus')}</button></div><div class="card-b">${db.all('visits', (v) => v.patient === id).reverse().map((v) => `<div class="list-item small"><div class="grow"><b>${NS.date(v.at)}</b> · ${esc(doc(v.doctor).name)}<div>${esc(v.text)}</div></div></div>`).join('') || '<div class="faint small">Not yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Randevular</h3></div><div class="card-b">${apps.slice(0, 8).map((a) => `<div class="list-item small"><span class="grow">${NS.date(a.date)} ${a.time} · ${esc(a.reason)}</span>${badge(a.status, a.status === 'geldi' ? 'ok' : a.status === 'gelmedi' ? 'err' : 'info')}</div>`).join('') || '<div class="faint small">Randevu yok</div>'}</div></div></div></div>`;
    const re = () => app.refresh();
    const addPlan = async (tooth) => {
      const v = await formModal({ title: tooth ? `Diş ${tooth} — tedavi ekle` : 'Genel tedavi ekle', fields: [{ name: 'treatment', label: 'Tedavi', type: 'select', options: db.all('treatments', (t) => (tooth ? t.tooth : true)).map((t) => ({ value: t.id, label: `${t.name} — ${money(t.price)}` })) }, { name: 'doctor', label: 'Hekim', type: 'select', options: db.all('doctors').map((d) => ({ value: d.id, label: d.name })), value: myDoc() || 'd1' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'planned', label: 'Planlandı' }, { value: 'done', label: 'Bugün yapıldı' }] }, { name: 'price', label: 'Ücret (boş = liste fiyatı)', type: 'number' }, ...(tooth ? [{ name: 'missing', label: 'Bu diş eksik olarak işaretlensin', type: 'checkbox' }] : [])] });
      if (!v) return;
      if (v.missing) { p.missing = [...new Set([...(p.missing || []), tooth])]; db.save(); return re(); }
      db.insert('plans', { patient: id, tooth, treatment: v.treatment, doctor: v.doctor, status: v.status, price: v.price || trt(v.treatment).price, date: v.status === 'done' ? today() : null });
      re();
    };
    on(el, 'click', '[data-tooth]', (e, t) => addPlan(Number(t.dataset.tooth)));
    on(el, 'click', '[data-act]', async (e, b) => { const x = db.get('plans', b.dataset.id); if (b.dataset.act === 'done') { x.status = 'done'; x.date = today(); db.save(); re(); } else if (await confirm('Tedavi kalemi silinsin mi?')) { db.remove('plans', x.id); re(); } });
    on(el, 'click', '[data-x]', async (e, b) => {
      const x = b.dataset.x;
      if (x === 'gen') addPlan(null);
      else if (x === 'pay') {
        const v = await formModal({ title: 'Tahsilat', fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: Math.max(0, bal), required: true }, { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit', 'havale'] }, { name: 'inst', label: 'Taksit (kart)', type: 'select', options: ['Tek çekim', '2', '3', '6', '9'] }, { name: 'doc', label: 'Belge', type: 'select', options: [{ value: '', label: 'Belge kesme' }, { value: 'esmm', label: 'e-Serbest Meslek Makbuzu (e-SMM)' }, { value: 'efatura', label: 'e-Fatura / e-Arşiv' }] }, { name: 'print', label: 'Tahsilat makbuzu yazdır', type: 'checkbox' }] });
        if (!v) return;
        if (v.type === 'kart' && NS.integ) { const r = await NS.integ.cardPayment(v.amount, { installment: v.inst === 'Tek çekim' ? 1 : Number(v.inst) }); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); }
        const pay = db.insert('payments', { patient: id, amount: v.amount, type: v.type + (v.inst !== 'Tek çekim' ? ` (${v.inst} taksit)` : ''), at: new Date().toISOString() });
        if (v.doc === 'esmm' && NS.integ) { const r = await NS.integ.call('esmm', 'makbuz', { name: p.name, tc: p.tc, amount: v.amount, desc: 'Muayene / tedavi bedeli' }); if (r && r.ok) { pay.ebelge = 'e-SMM ' + r.ref; db.save(); } }
        else if (v.doc === 'efatura' && NS.integ) { const r = await NS.integ.sendEInvoice({ buyer: p.name, buyerVkn: p.tc, no: 'TH' + pay.id.slice(-6), total: v.amount, lines: [{ name: 'Sağlık hizmeti', total: v.amount }] }); if (r.ok) { pay.ebelge = `${r.type} ${r.no}`; db.save(); } }
        if (v.print) NS.printHtml(`<div class="doc" style="max-width:600px"><h2>${esc(S().bizName)}</h2><h3>TAHSİLAT MAKBUZU</h3><p>${NS.dt(pay.at)}</p><p>Sayın <b>${esc(p.name)}</b>, ${money(v.amount)} (${esc(pay.type)}) tahsil edilmiştir.</p>${pay.ebelge ? `<p>${esc(pay.ebelge)}</p>` : ''}<p>Kalan bakiye: ${money(balance(id))}</p><p style="margin-top:40px;text-align:right">Kaşe / imza</p></div>`, { title: 'Makbuz' });
        re();
      }
      else if (x === 'note') { const v = await formModal({ title: 'Muayene notu', fields: [{ name: 'text', label: 'Bulgular / yapılan işlem', type: 'textarea', required: true, full: true }, { name: 'icd', label: 'Tanı (ICD-10 kodu)', placeholder: 'K04.4' }, { name: 'doctor', label: 'Hekim', type: 'select', options: db.all('doctors').map((d) => ({ value: d.id, label: d.name })), value: myDoc() || 'd1' }, { name: 'enabiz', label: 'e-Nabız’a gönder', type: 'checkbox', value: NS.integ && NS.integ.isOn('enabiz') }] }); if (v) { const send = v.enabiz; delete v.enabiz; const vis = db.insert('visits', { ...v, patient: id, at: new Date().toISOString() }); if (send && NS.integ) { const r = await NS.integ.call('enabiz', 'muayene', { tc: p.tc, name: p.name, icd: v.icd, text: v.text, doctor: doc(v.doctor).name, at: vis.at }); if (r && r.ok) { vis.enabiz = r.ref; p.enabizAt = new Date().toISOString(); db.save(); } } re(); } }
      else if (x === 'kps') { if (!p.tc || String(p.tc).length !== 11) return toast('Geçerli bir TC kimlik numarası girin', 'err'); const r = NS.integ ? await NS.integ.call('kps', 'dogrula', { tc: p.tc, name: p.name, birth: p.birth }) : null; if (r && r.ok) { p.kps = r.ref; db.save(); re(); } }
      else if (x === 'enb') { const vs = db.all('visits', (v) => v.patient === id && !v.enabiz); const ps = db.all('plans', (y) => y.patient === id && y.status === 'done' && !y.enabiz); if (!vs.length && !ps.length) return toast('Gönderilecek yeni kayıt yok', ''); const r = NS.integ ? await NS.integ.call('enabiz', 'toplu-gonder', { tc: p.tc, visits: vs.map((v) => ({ at: v.at, icd: v.icd, text: v.text })), procedures: ps.map((y) => ({ date: y.date, tooth: y.tooth, name: trt(y.treatment).name })) }) : null; if (r && r.ok) { vs.forEach((v) => { v.enabiz = r.ref; }); ps.forEach((y) => { y.enabiz = r.ref; }); p.enabizAt = new Date().toISOString(); db.save(); toast(`${vs.length + ps.length} kayıt e-Nabız’a iletildi`, 'ok'); re(); } }
      else if (x === 'anam') { const v = await formModal({ title: 'Anamnez formu', fields: [...ANAMNEZ.map((a, i) => ({ name: 'a' + i, label: a, type: 'checkbox' })), { name: 'meds', label: 'Kullandığı ilaçlar', full: true }], values: { ...Object.fromEntries(ANAMNEZ.map((a, i) => ['a' + i, (p.anamnez || []).includes(a)])), meds: p.meds || '' } }); if (v) { p.anamnez = ANAMNEZ.filter((a, i) => v['a' + i]); p.meds = v.meds; db.save(); re(); } }
      else if (x === 'appt') apptForm(app, { patient: id });
      else if (x === 'rx') {
        const v = await formModal({ title: 'Reçete', fields: [{ name: 'diag', label: 'Tanı', value: 'Akut apikal periodontitis', full: true }, { name: 'meds', label: 'İlaçlar (her satıra bir ilaç)', type: 'textarea', full: true, value: 'Amoksisilin + Klavulanik asit 1000 mg — 2x1, 7 gün\nİbuprofen 400 mg — ağrı olduğunda, günde en fazla 3\nKlorheksidin gargara — 2x1, 10 gün' }, { name: 'doctor', label: 'Hekim', type: 'select', options: db.all('doctors').map((d) => ({ value: d.id, label: d.name })), value: myDoc() || 'd1' }, { name: 'erx', label: 'e-Reçete olarak sisteme yaz', type: 'checkbox', value: NS.integ && NS.integ.isOn('erecete') }], submitLabel: 'Yazdır' });
        let erxNo = '';
        if (v && v.erx && NS.integ) { const r = await NS.integ.call('erecete', 'recete-yaz', { tc: p.tc, name: p.name, diag: v.diag, meds: v.meds.split('\n').filter(Boolean), doctor: doc(v.doctor).name }); if (r && r.ok) { erxNo = r.ref; db.insert('prescriptions', { patient: id, no: erxNo, diag: v.diag, meds: v.meds, doctor: v.doctor, at: new Date().toISOString() }); } }
        if (v) NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><div>${esc(S().bizAddress)} · ${esc(S().bizPhone)}</div><hr><h3>REÇETE${erxNo ? ' — e-Reçete no: ' + esc(erxNo) : ''}</h3><p>Hasta: <b>${esc(p.name)}</b> · TC: ${esc(p.tc || '')} · Yaş: ${age(p)}<br>Tarih: ${NS.date(new Date())}</p><p><b>Tanı:</b> ${esc(v.diag)}</p><p><b>Rp/</b></p><ol>${v.meds.split('\n').filter(Boolean).map((m) => `<li>${esc(m)}</li>`).join('')}</ol>${(p.anamnez || []).length ? `<p style="color:#b91c1c">Dikkat: ${esc(p.anamnez.join(', '))}</p>` : ''}<p style="margin-top:60px;text-align:right">${esc(doc(v.doctor).name)}<br>İmza / Kaşe</p></div>`, { title: 'Reçete' });
      } else if (x === 'printplan') NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>TEDAVİ PLANI — ${esc(p.name)}</h3><div>${NS.date(new Date())}</div><table><tr><th>Diş</th><th>Tedavi</th><th>Hekim</th><th>Durum</th><th style="text-align:right">Ücret</th></tr>${plans.map((x2) => `<tr><td>${x2.tooth || 'Genel'}</td><td>${esc(trt(x2.treatment).name)}</td><td>${esc(doc(x2.doctor).name)}</td><td>${x2.status === 'done' ? 'Yapıldı' : 'Planlandı'}</td><td style="text-align:right">${money(x2.price)}</td></tr>`).join('')}<tr><td colspan="4"><b>TOPLAM</b></td><td style="text-align:right"><b>${money(sum(plans, (x2) => x2.price))}</b></td></tr></table><p>Ödenen: ${money(sum(db.all('payments', (y) => y.patient === id), (y) => y.amount))} · Kalan (yapılan işlemler için): ${money(bal)}</p><p style="margin-top:40px">Hasta onayı: __________________</p></div>`, { title: 'Tedavi planı' });
    });
  }

  // ---------- Randevu ----------
  async function apptForm(app, rec = {}) {
    const v = await formModal({ title: rec.id ? 'Randevu' : 'Yeni randevu', fields: [{ name: 'patient', label: 'Hasta', type: 'select', options: db.all('patients').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((p) => ({ value: p.id, label: `${p.name} · ${p.phone}` })) }, { name: 'doctor', label: 'Hekim', type: 'select', options: db.all('doctors').map((d) => ({ value: d.id, label: d.name })) }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'time', label: 'Saat', type: 'time', required: true }, { name: 'reason', label: 'Neden', value: 'Kontrol', full: true }], values: { date: today(), time: '10:00', doctor: myDoc() || 'd1', ...rec } });
    if (!v) return;
    if (db.find('appts', (a) => a.id !== rec.id && a.doctor === v.doctor && a.date === v.date && a.time === v.time && a.status !== 'iptal')) return toast('Hekimin bu saati dolu', 'err');
    if (rec.id) db.update('appts', rec.id, v); else db.insert('appts', { ...v, status: 'bekliyor' });
    if (NS.integ && NS.integ.isOn('takvim')) NS.integ.call('takvim', 'etkinlik', { title: `${pat(v.patient).name} — ${v.reason}`, start: `${v.date}T${v.time}`, minutes: Number(S().slot) || 30, calendar: doc(v.doctor).name }, { silent: true });
    if (!rec.id && pat(v.patient).phone && (await confirm('Hastaya randevu SMS’i gönderilsin mi?', { ok: 'Gönder', danger: false, title: 'SMS' }))) NS.smsLog(db, { to: pat(v.patient).phone, name: pat(v.patient).name, text: `Sayın ${pat(v.patient).name}, ${NS.date(v.date)} ${v.time} tarihinde ${doc(v.doctor).name} ile randevunuz oluşturulmuştur. ${S().bizName} ${S().bizPhone || ''}` });
    toast('Randevu kaydedildi', 'ok'); app.refresh();
  }
  let day = today();
  function calendarPage(el, p, app) {
    const s = S();
    const times = []; for (let t = NS.clamp(Number(s.open.slice(0, 2)), 0, 23) * 60; t < Number(s.close.slice(0, 2)) * 60; t += Number(s.slot) || 30) times.push(`${NS.pad(Math.floor(t / 60))}:${NS.pad(t % 60)}`);
    const docs = db.all('doctors', (d) => !myDoc() || d.id === myDoc());
    el.innerHTML = `<div class="row mb"><button class="btn icon" data-d="-1">${icon('left')}</button><button class="btn" data-d="0">Bugün</button><button class="btn icon" data-d="1">${icon('right')}</button><input type="date" class="input" id="dd" value="${day}" style="max-width:170px"><h2 class="grow">${NS.dateLong(day)}</h2><button class="btn primary" id="na">${icon('plus')} Randevu</button></div>
      <div class="grid" style="grid-template-columns:repeat(${docs.length}, minmax(240px,1fr));overflow-x:auto">${docs.map((d) => `<div class="card"><div class="card-h" style="border-top:4px solid ${d.color};border-radius:var(--r) var(--r) 0 0"><div class="avatar" style="background:${d.color}22;color:${d.color}">${esc(NS.initials(d.name))}</div><div class="grow"><b>${esc(d.name)}</b><div class="small faint">${esc(d.spec)}</div></div>${badge(db.all('appts', (a) => a.doctor === d.id && a.date === day && a.status !== 'iptal').length + ' hasta', 'acc')}</div>
        ${times.map((t) => { const a = db.find('appts', (x) => x.doctor === d.id && x.date === day && x.time === t && x.status !== 'iptal'); return `<div class="slot"><span class="tm">${t}</span>${a ? `<div class="ap" style="background:${a.status === 'gelmedi' ? 'var(--err)' : d.color};opacity:${a.status === 'geldi' ? .6 : 1}" data-ap="${a.id}"><b>${esc(pat(a.patient).name)}</b> · ${esc(a.reason)}${a.status !== 'bekliyor' ? ` · ${a.status}` : ''}${pat(a.patient).anamnez && pat(a.patient).anamnez.length ? ' ⚠' : ''}</div>` : `<span class="free" data-free="${d.id}|${t}">+ boş</span>`}</div>`; }).join('')}</div>`).join('')}</div>`;
    on(el, 'click', '[data-d]', (e, b) => { const n = Number(b.dataset.d); day = n === 0 ? today() : iso(addDays(day, n)); app.refresh(); });
    $('#dd', el).onchange = (e) => { day = e.target.value; app.refresh(); };
    $('#na', el).onclick = () => apptForm(app, { date: day });
    on(el, 'click', '[data-free]', (e, b) => { const [d, t] = b.dataset.free.split('|'); apptForm(app, { doctor: d, date: day, time: t }); });
    on(el, 'click', '[data-ap]', (e, b) => {
      const a = db.get('appts', b.dataset.ap); const pt = pat(a.patient);
      modal({ title: `${a.time} · ${pt.name}`, body: `<div class="list-item"><span class="grow muted">Neden</span><b>${esc(a.reason)}</b></div><div class="list-item"><span class="grow muted">Telefon</span>${esc(pt.phone)}</div><div class="list-item"><span class="grow muted">Durum</span>${badge(a.status, 'info')}</div>${(pt.anamnez || []).length ? `<div class="card pad mt" style="background:var(--err-soft);border:0">${icon('alert')} ${esc(pt.anamnez.join(', '))}</div>` : ''}`,
        actions: [{ label: 'Hasta kartı', icon: 'user', onClick: (c) => { c(); app.go('hasta', pt.id); } }, { label: 'Gelmedi', onClick: (c) => { a.status = 'gelmedi'; db.save(); c(); app.refresh(); } }, { label: 'İptal', cls: 'danger', onClick: (c) => { a.status = 'iptal'; db.save(); c(); app.refresh(); } }, { label: 'Geldi', cls: 'ok', onClick: (c) => { a.status = 'geldi'; db.save(); c(); app.refresh(); } }] });
    });
  }

  // ---------- Listeler / özet / rapor ----------
  function patientsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'patients', title: 'Hastalar', sub: 'Hasta dosyaları, bakiyeler ve risk uyarıları', single: 'Hasta', addLabel: 'Yeni hasta', emptyIcon: 'users', fields: PF,
      beforeSave: (v, rec) => { if (!rec) { v.no = String(20000 + db.all('patients').length + rand(100, 999)); v.anamnez = []; v.missing = []; } },
      onSave: (v, rec) => { if (!rec) { const n = db.all('patients').slice(-1)[0]; app.go('hasta', n.id); } },
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (x) => [x.name, x.phone, x.tc, x.no],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'b', label: 'Borçlu', test: (x) => balance(x.id) > 0 }, { value: 'r', label: 'Riskli anamnez', test: (x) => (x.anamnez || []).length > 0 }, { value: 'p', label: 'Bekleyen tedavi', test: (x) => planTotal(x.id, 'planned') > 0 }],
      columns: [{ key: 'name', label: 'Hasta', render: (x) => `<a href="#/hasta/${x.id}" class="row nw" style="color:inherit"><div class="avatar">${esc(NS.initials(x.name))}</div><div><b>${esc(x.name)}</b> ${(x.anamnez || []).length ? `<span title="${esc(x.anamnez.join(', '))}" style="color:var(--err)">⚠</span>` : ''}<div class="small faint">#${esc(x.no)} · ${esc(x.phone)}</div></div></a>` }, { label: 'Yaş', render: (x) => age(x) }, { label: 'Bekleyen tedavi', cls: 'right', render: (x) => money(planTotal(x.id, 'planned')) }, { label: 'Bakiye', cls: 'right', render: (x) => { const b = balance(x.id); return b > 0 ? `<b style="color:var(--err)">${money(b)}</b>` : '-'; } }],
      extraActions: [{ icon: 'eye', act: 'open', title: 'Hasta kartı' }], onAction: (a, x) => app.go('hasta', x.id),
    });
  }
  function dashboard(el, p, app) {
    const t = today();
    const todays = db.all('appts', (a) => a.date === t && a.status !== 'iptal' && (!myDoc() || a.doctor === myDoc())).sort((a, b) => a.time.localeCompare(b.time));
    const done30 = db.all('plans', (x) => x.status === 'done' && x.date >= iso(addDays(new Date(), -30)));
    const pay30 = db.all('payments', (x) => x.at >= addDays(new Date(), -30).toISOString());
    el.innerHTML = pageHead('Klinik Özeti', NS.dateLong(new Date()), `<button class="btn" id="np">${icon('user')} Yeni hasta</button><button class="btn primary" id="na">${icon('plus')} Randevu</button>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü hasta', todays.length, 'calendar', '', `<div class="small faint">${todays.filter((a) => a.status === 'geldi').length} geldi</div>`)}${kpi('30 gün tedavi', money(sum(done30, (x) => x.price)), 'tooth', 'ok')}${kpi('30 gün tahsilat', money(sum(pay30, (x) => x.amount)), 'wallet', 'info')}${kpi('Toplam alacak', money(sum(db.all('patients'), (x) => Math.max(0, balance(x.id)))), 'alert', 'err')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Bugünün hastaları</h3></div>${table({ rows: todays, empty: 'Bugün randevu yok', columns: [{ label: 'Saat', render: (a) => `<b>${a.time}</b>` }, { label: 'Hasta', render: (a) => `<a href="#/hasta/${a.patient}"><b>${esc(pat(a.patient).name)}</b></a>${(pat(a.patient).anamnez || []).length ? ' <span style="color:var(--err)">⚠</span>' : ''}` }, { label: 'Hekim', render: (a) => `<span style="color:${doc(a.doctor).color}">${esc(doc(a.doctor).name)}</span>` }, { label: 'Neden', key: 'reason' }, { label: 'Durum', render: (a) => badge(a.status, a.status === 'geldi' ? 'ok' : a.status === 'gelmedi' ? 'err' : 'info') }], actions: [{ label: 'Geldi', act: 'came', show: (a) => a.status === 'bekliyor' }] })}</div>
      <div class="card"><div class="card-h"><h3>En çok yapılan tedaviler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(done30, (x) => trt(x.treatment).name)).map(([label, v]) => ({ label, value: v.length })).sort((a, b) => b.value - a.value).slice(0, 7), { size: 130 })}</div></div></div>`;
    $('#na', el).onclick = () => apptForm(app, {});
    $('#np', el).onclick = () => app.go('hastalar');
    on(el, 'click', '[data-act=came]', (e, b) => { db.update('appts', b.dataset.id, { status: 'geldi' }); app.refresh(); });
  }
  function reportsPage(el) {
    const done = db.all('plans', (x) => x.status === 'done');
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return iso(d).slice(0, 7); });
    el.innerHTML = pageHead('Raporlar', 'Hekim performansı, tedavi ve tahsilat') + `
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Aylık tedavi cirosu</h3></div><div class="card-b">${chart.bars(months.map((m) => ({ label: NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3), value: sum(done.filter((x) => (x.date || '').startsWith(m)), (x) => x.price) })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Hekim bazlı ciro</h3></div><div class="card-b">${chart.bars(db.all('doctors').map((d) => ({ label: d.name.replace(/^(Dr\. )?Dt\. /, ''), value: sum(done.filter((x) => x.doctor === d.id), (x) => x.price), color: d.color })), { format: money })}</div></div></div>
      <div class="card">${table({ rows: db.all('treatments').map((t) => ({ ...t, n: done.filter((x) => x.treatment === t.id).length, r: sum(done.filter((x) => x.treatment === t.id), (x) => x.price), pl: db.all('plans', (x) => x.treatment === t.id && x.status === 'planned').length })).sort((a, b) => b.r - a.r), columns: [{ label: 'Tedavi', render: (t) => `<b>${esc(t.name)}</b>` }, { label: 'Yapılan', cls: 'right', key: 'n' }, { label: 'Planlanan (bekleyen)', cls: 'right', key: 'pl' }, { label: 'Ciro', cls: 'right', render: (t) => money(t.r) }] })}</div>`;
  }

  const ROLES = { admin: 'Yönetici hekim', hekim: 'Hekim', sekreter: 'Sekreter' };
  NS.shell({
    id: 'klinik', integrations: ['sms', 'whatsapp', 'email', 'pos', 'efatura', 'printer', 'payment', 'webhook', 'backup'], name: 'Klinik', tagline: 'Muayenehane & Diş Kliniği', icon: 'tooth', accent: '#2563eb', db, home: 'ozet', auth: { roles: ROLES }, titles: { hasta: 'Hasta kartı' },
    nav: [{ sec: 'Klinik' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'takvim', label: 'Randevu Takvimi', icon: 'calendar' }, { id: 'hastalar', label: 'Hastalar', icon: 'users' }, { sec: 'Yönetim' }, { id: 'tedaviler', label: 'Tedavi & Fiyat Listesi', icon: 'tag', roles: ['admin'] }, { id: 'hekimler', label: 'Hekimler', icon: 'user', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, takvim: calendarPage, hastalar: patientsPage, hasta: patientPage, raporlar: reportsPage,
      tedaviler: (el, p, a) => NS.crud(el, a, { col: 'treatments', title: 'Tedavi & Fiyat Listesi', single: 'Tedavi', addLabel: 'Yeni tedavi', fields: [{ name: 'name', label: 'Tedavi adı', required: true, full: true }, { name: 'price', label: 'Ücret (₺)', type: 'number', required: true }, { name: 'tooth', label: 'Diş bazlı uygulanır', type: 'checkbox' }], columns: [{ key: 'name', label: 'Tedavi', render: (x) => `<b>${esc(x.name)}</b>` }, { label: 'Tür', render: (x) => (x.tooth ? badge('Diş bazlı', 'acc') : badge('Genel')) }, { key: 'price', label: 'Ücret', cls: 'right', render: (x) => money(x.price) }] }),
      hekimler: (el, p, a) => NS.crud(el, a, { col: 'doctors', title: 'Hekimler', single: 'Hekim', addLabel: 'Yeni hekim', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'spec', label: 'Uzmanlık' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Hekim', render: (x) => `<b style="color:${x.color}">${esc(x.name)}</b>` }, { key: 'spec', label: 'Uzmanlık' }, { label: 'Bu ay hasta', cls: 'right', render: (x) => db.all('appts', (ap) => ap.doctor === x.id && ap.date.slice(0, 7) === today().slice(0, 7) && ap.status === 'geldi').length }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Takvim' }, { name: 'open', label: 'Açılış', type: 'time' }, { name: 'close', label: 'Kapanış', type: 'time' }, { name: 'slot', label: 'Randevu aralığı (dk)', type: 'select', options: ['15', '20', '30', '45', '60'] }] }),
    },
  });
})();
