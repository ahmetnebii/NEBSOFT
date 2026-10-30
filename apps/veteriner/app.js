/* NEBSOFT Veteriner — sahip/hayvan kartı, aşı takvimi, muayene, stok/satış, pet otel ve hatırlatma */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const SPECIES = { Kedi: '🐈', Köpek: '🐕', Kuş: '🦜', Tavşan: '🐇', Hamster: '🐹' };
  const VAX = { Kedi: [['Karma (FVRCP)', 365], ['Kuduz', 365], ['Lösemi (FeLV)', 365], ['İç parazit', 90], ['Dış parazit', 60]], Köpek: [['Karma (DHPPi+L)', 365], ['Kuduz', 365], ['Bronşin (KC)', 365], ['Lyme', 365], ['İç parazit', 90], ['Dış parazit', 60]], Kuş: [['İç parazit', 180]], Tavşan: [['RHD', 365], ['İç parazit', 90]], Hamster: [] };
  const BREEDS = { Kedi: ['Tekir', 'British Shorthair', 'Scottish Fold', 'Van kedisi', 'Ankara kedisi', 'İran'], Köpek: ['Golden Retriever', 'Labrador', 'Kangal', 'Pomeranian', 'Terrier', 'Melez'], Kuş: ['Muhabbet', 'Sultan papağanı'], Tavşan: ['Hollanda cücesi'], Hamster: ['Suriye hamsteri'] };
  const PET_NAMES = ['Pamuk', 'Boncuk', 'Duman', 'Zeytin', 'Karamel', 'Fıstık', 'Tarçın', 'Max', 'Luna', 'Leo', 'Bal', 'Mia', 'Çakıl', 'Paşa', 'Sarman', 'Minnoş', 'Rocky', 'Lokum', 'Şila', 'Oscar', 'Kömür', 'Cookie', 'Simba', 'Maya'];

  function seed(db) {
    db.data._settings = { bizName: 'Pati Veteriner Kliniği', bizPhone: '0216 666 77 88', bizAddress: 'Kadıköy, Moda Cad. No:42', hotelDaily: 450, exam: 800 };
    db.data.users = [{ id: 'u1', name: 'Vet. Hekim Zehra Ay', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Vet. Hekim Kaan Öz', role: 'hekim', pin: '1234', active: true }, { id: 'u3', name: 'Melis Asistan', role: 'asistan', pin: '1234', active: true }];
    db.data.owners = NS.NAMES.slice(0, 18).map((n, i) => ({ id: 'o' + i, name: n, phone: NS.phone(), email: NS.slug(n).replace('-', '.') + '@mail.com', address: pick(['Moda', 'Fenerbahçe', 'Göztepe', 'Acıbadem', 'Koşuyolu']) + ', Kadıköy' }));
    const pets = PET_NAMES.map((n, i) => { const sp = i % 5 === 4 ? pick(['Kuş', 'Tavşan', 'Hamster']) : i % 2 ? 'Köpek' : 'Kedi'; return { id: 'p' + i, name: n, owner: db.data.owners[i % 18].id, species: sp, breed: pick(BREEDS[sp]), gender: pick(['Dişi', 'Erkek']), birth: iso(addDays(new Date(), -rand(120, 4000))), chip: sp === 'Kedi' || sp === 'Köpek' ? String(rand(100000000, 999999999)) + rand(100000, 999999) : '', neutered: Math.random() < 0.6, allergy: i % 9 === 0 ? 'Penisilin alerjisi' : '', weights: [] }; });
    pets.forEach((p) => { const base = p.species === 'Köpek' ? rand(6, 32) : p.species === 'Kedi' ? rand(3, 6) : 0.4; for (let k = 4; k >= 0; k--) p.weights.push({ date: iso(addDays(new Date(), -k * 60)), kg: Math.round((base + (4 - k) * 0.15 + Math.random() * 0.3) * 10) / 10 }); });
    db.data.pets = pets;
    const vax = [];
    pets.forEach((p) => (VAX[p.species] || []).forEach(([type, every]) => { if (Math.random() < 0.2) return; const date = iso(addDays(new Date(), -rand(10, every + 30))); vax.push({ id: NS.uid(), pet: p.id, type, date, next: iso(addDays(date, every)), vet: pick(['u1', 'u2']) }); }));
    db.data.vaccines = vax;
    const complaints = [['Kusma, iştahsızlık', 'Akut gastrit', 'Sıvı tedavisi, mide koruyucu, 24 saat diyet'], ['Kulak kaşıma', 'Otitis externa', 'Kulak temizliği, damla 7 gün'], ['Topallama', 'Yumuşak doku travması', 'Antiinflamatuar, istirahat'], ['Rutin kontrol', 'Sağlıklı', 'Aşı takvimine devam'], ['Tüy dökülmesi', 'Dermatit', 'Şampuan, omega-3 takviyesi'], ['Diş taşı', 'Periodontal hastalık', 'Diş taşı temizliği planlandı'], ['Göz akıntısı', 'Konjonktivit', 'Göz damlası 5 gün']];
    db.data.visits = Array.from({ length: 40 }, () => { const p = pick(pets); const [c, d, t] = pick(complaints); return { id: NS.uid(), pet: p.id, date: addDays(new Date(), -rand(0, 90)).toISOString(), vet: pick(['u1', 'u2']), complaint: c, findings: `Ateş ${(38 + Math.random() * 1.5).toFixed(1)}°C, genel durum iyi`, diagnosis: d, treatment: t, fee: pick([800, 800, 1200, 1500, 2500]) }; });
    db.data.products = [['Royal Canin Kitten 2kg', 'Mama', 1250, 14], ['Pro Plan Adult Köpek 3kg', 'Mama', 1480, 10], ['Hill\'s i/d Konserve', 'Mama', 145, 40], ['Kedi kumu 10L', 'Aksesuar', 320, 25], ['Bravecto (köpek)', 'İlaç', 1350, 12], ['Frontline Combo (kedi)', 'İlaç', 420, 20], ['Drontal Plus', 'İlaç', 260, 30], ['Kulak damlası', 'İlaç', 210, 18], ['Tasma + kayış seti', 'Aksesuar', 380, 8], ['Kedi oyuncağı', 'Aksesuar', 95, 30]].map(([name, cat, price, stock], i) => ({ id: 'pr' + i, name, cat, price, stock, min: 5 }));
    db.data.sales = Array.from({ length: 30 }, () => { const pr = pick(db.data.products); const q = rand(1, 2); return { id: NS.uid(), owner: pick(db.data.owners).id, items: [{ pid: pr.id, name: pr.name, qty: q, price: pr.price }], total: pr.price * q, at: addDays(new Date(), -rand(0, 60)).toISOString(), pay: pick(['kart', 'nakit']) }; });
    db.data.stays = [{ id: 's1', pet: 'p3', from: iso(addDays(new Date(), -2)), to: iso(addDays(new Date(), 3)), daily: 450, note: 'Günde 2 öğün, ilaç sabah', status: 'konakliyor' }, { id: 's2', pet: 'p6', from: iso(addDays(new Date(), 4)), to: iso(addDays(new Date(), 10)), daily: 450, note: '', status: 'rezervasyon' }];
    db.data.appts = Array.from({ length: 12 }, (_, i) => ({ id: NS.uid(), pet: pick(pets).id, date: iso(addDays(new Date(), rand(0, 7))), time: pick(['10:00', '11:00', '12:30', '14:00', '15:30', '17:00']), reason: pick(['Aşı', 'Kontrol', 'Kısırlaştırma', 'Muayene', 'Tırnak kesimi']), vet: pick(['u1', 'u2']), status: 'bekliyor' }));
  }
  const db = new NS.DB('veteriner', seed);
  const S = () => db.settings({ hotelDaily: 450, exam: 800 });
  const pet = (id) => db.get('pets', id) || { name: '-', species: 'Kedi' };
  const owner = (id) => db.get('owners', id) || { name: '-', phone: '' };
  const usr = (id) => db.get('users', id) || { name: '-' };
  const av = (p, lg) => `<div class="pet-av ${lg ? 'lg' : ''}" style="background:${p.species === 'Kedi' ? '#fef3c7' : p.species === 'Köpek' ? '#dbeafe' : '#dcfce7'}">${SPECIES[p.species] || '🐾'}</div>`;
  const ageStr = (b) => { const m = Math.floor(daysBetween(b, new Date()) / 30.4); return m >= 12 ? `${Math.floor(m / 12)} yaş${m % 12 ? ' ' + (m % 12) + ' ay' : ''}` : `${m} aylık`; };
  // Vefat eden / kaybolan hayvana hatırlatma gitmez
  const alive = (p) => !p.status;
  const PST = { vefat: ['Vefat etti', ''], kayip: ['Kayıp', 'warn'] };
  const dueVax = (days = 14) => db.all('vaccines').filter((v) => alive(pet(v.pet)) && v.next <= iso(addDays(new Date(), days)) && !db.find('vaccines', (x) => x.pet === v.pet && x.type === v.type && x.date > v.date)).sort((a, b) => a.next.localeCompare(b.next));
  // Resmî sistem / e-belge / SMS sonucu: yalnızca gerçek başarı kalıcı kayıt bırakır; simülasyon TEST olarak bildirilir
  const realOk = (r, what) => { if (r && r.ok && !r.simulated) return true; if (r && r.simulated) toast(`TEST: ${what} — gerçek gönderim yapılmadı, kayda işlenmedi`, ''); return false; };
  async function smsOne(to, name, text, kind) {
    const r = NS.integ && NS.integ.sms ? await NS.integ.sms(to, text, { silent: true }) : { ok: false, error: 'SMS bağlantısı yok' };
    const k = r.simulated ? 'test' : r.ok ? 'ok' : 'err';
    db.insert('sms', { to, name, text, kind, at: new Date().toISOString(), status: k === 'ok' ? 'gönderildi' : k === 'test' ? 'TEST — gönderilmedi' : 'hata: ' + String(r.error || '').slice(0, 60) }, true);
    return k;
  }
  const smsSummary = (n) => [n.ok && `${n.ok} SMS gönderildi`, n.test && `${n.test} TEST (gönderilmedi — SMS sağlayıcısı bağlı değil)`, n.err && `${n.err} gönderilemedi`].filter(Boolean).join(' · ') || 'Gönderilecek mesaj yok';
  const karneUrl = () => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'karne.html';
  const wa = (o, text) => `https://wa.me/90${String(o.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(text)}`;
  const PF = () => [{ name: 'name', label: 'Hayvan adı', required: true }, { name: 'owner', label: 'Sahibi', type: 'select', options: db.all('owners').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((o) => ({ value: o.id, label: `${o.name} · ${o.phone}` })) }, { name: 'species', label: 'Tür', type: 'select', options: Object.keys(SPECIES) }, { name: 'breed', label: 'Irk' }, { name: 'gender', label: 'Cinsiyet', type: 'select', options: ['Dişi', 'Erkek'] }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'chip', label: 'Mikroçip no' }, { name: 'allergy', label: 'Alerji / kronik', full: true }, { name: 'neutered', label: 'Kısırlaştırılmış', type: 'checkbox' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: '', label: 'Aktif' }, { value: 'vefat', label: 'Vefat etti (hatırlatmalar durur)' }, { value: 'kayip', label: 'Kayıp (hatırlatmalar durur)' }] }];

  function dashboard(el, p, app) {
    const t = today();
    const appts = db.all('appts', (a) => a.date === t).sort((a, b) => a.time.localeCompare(b.time));
    const due = dueVax(7);
    const v30 = db.all('visits', (v) => v.date > addDays(new Date(), -30).toISOString()), s30 = db.all('sales', (s) => s.at > addDays(new Date(), -30).toISOString());
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<button class="btn" id="np">${icon('plus')} Yeni hasta</button><button class="btn primary" id="nv">${icon('heart')} Muayene kaydı</button>`) + `
      <div class="grid g4 mb">${kpi('Kayıtlı hasta', db.all('pets').length, 'paw')}${kpi('Bugün randevu', appts.length, 'calendar', 'info')}${kpi('Yaklaşan/geciken aşı (7 gün)', due.length, 'shield', 'warn')}${kpi('30 gün ciro', money(sum(v30, (v) => v.fee) + sum(s30, (s) => s.total)), 'wallet', 'ok')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>${icon('shield')} Aşı hatırlatmaları</h3>${due.filter((v) => !v.reminded).length ? `<button class="btn sm" id="vxall">${icon('send')} Hepsine SMS (${due.filter((v) => !v.reminded).length})</button>` : ''}</div>${table({ rows: due, empty: 'Yaklaşan aşı yok', columns: [{ label: 'Hasta', render: (v) => `<a href="#/hasta/${v.pet}" class="row nw" style="color:inherit">${av(pet(v.pet))}<div><b>${esc(pet(v.pet).name)}</b> ${v.reminded ? badge('Hatırlatıldı ' + NS.date(v.reminded), 'ok') : v.remindTest ? badge('TEST — gönderilmedi', 'warn') : ''}<div class="small faint">${esc(owner(pet(v.pet).owner).name)}</div></div></a>` }, { label: 'Aşı', key: 'type' }, { label: 'Tarih', render: (v) => (v.next < t ? badge(`${daysBetween(v.next, new Date())} gün gecikti`, 'err') : badge(NS.date(v.next), 'warn')) }], actions: [{ icon: 'message', act: 'wa', title: 'WhatsApp hatırlat' }, { label: 'Yapıldı', act: 'done' }] })}</div>
      <div class="card"><div class="card-h"><h3>Bugünün randevuları</h3></div><div class="card-b">${appts.map((a) => `<div class="list-item"><b style="min-width:46px">${a.time}</b>${av(pet(a.pet))}<div class="grow"><b>${esc(pet(a.pet).name)}</b><div class="small faint">${esc(a.reason)} · ${esc(usr(a.vet).name.replace('Vet. Hekim ', ''))}</div></div></div>`).join('') || '<div class="faint small">Bugün randevu yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Tür dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(db.all('pets'), (x) => x.species)).map(([label, v]) => ({ label: `${SPECIES[label]} ${label}`, value: v.length })), { size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Pet otel</h3><a class="btn sm" href="#/otel">Yönet</a></div><div class="card-b">${db.all('stays', (s) => s.status !== 'cikis').map((s) => `<div class="list-item">${av(pet(s.pet))}<div class="grow"><b>${esc(pet(s.pet).name)}</b><div class="small faint">${NS.date(s.from)} – ${NS.date(s.to)}</div></div>${badge(s.status === 'konakliyor' ? 'Konaklıyor' : 'Rezervasyon', s.status === 'konakliyor' ? 'ok' : 'info')}</div>`).join('') || '<div class="faint small">Konaklayan yok</div>'}</div></div></div>`;
    $('#np', el).onclick = () => newPet(app);
    $('#nv', el).onclick = () => visitForm(app);
    if ($('#vxall', el)) $('#vxall', el).onclick = async (e) => {
      e.target.disabled = true; const n = { ok: 0, test: 0, err: 0 };
      for (const v of due.filter((x) => !x.reminded)) {
        const pt = pet(v.pet), o = owner(pt.owner); if (!o.phone) continue;
        const k = await smsOne(o.phone, o.name, `Merhaba ${o.name}, ${pt.name} için ${v.type} aşısı zamanı ${v.next < today() ? 'geçti' : 'geldi'} (${NS.date(v.next)}). Randevu için: ${S().bizPhone || ''} ${S().bizName}`, 'asi');
        n[k]++; if (k === 'ok') { v.reminded = today(); delete v.remindTest; } else if (k === 'test') v.remindTest = true;
      }
      db.save(); toast(smsSummary(n), n.err ? 'err' : n.ok ? 'ok' : ''); app.refresh();
    };
    on(el, 'click', '[data-act]', (e, b) => {
      const v = db.get('vaccines', b.dataset.id); const pt = pet(v.pet); const o = owner(pt.owner);
      if (b.dataset.act === 'wa') return window.open(wa(o, `Merhaba ${o.name}, ${pt.name} için ${v.type} aşısı zamanı geldi (${NS.date(v.next)}). Randevu için bize ulaşabilirsiniz. ${S().bizName}`), '_blank', 'noopener');
      vaxDone(app, pt, v.type);
    });
  }
  async function vaxDone(app, pt, type) {
    const every = ((VAX[pt.species] || []).find((x) => x[0] === type) || [type, 365])[1];
    const v = await formModal({ title: `${pt.name} — aşı`, fields: [{ name: 'type', label: 'Aşı', type: 'select', options: (VAX[pt.species] || []).map((x) => x[0]).concat(type && !(VAX[pt.species] || []).some((x) => x[0] === type) ? [type] : []), value: type }, { name: 'date', label: 'Uygulama tarihi', type: 'date', value: today() }, { name: 'next', label: 'Sonraki tarih', type: 'date', value: iso(addDays(new Date(), every)) }, { name: 'lot', label: 'Seri / lot no' }, { name: 'karekod', label: 'Aşı karekodu (okutun)' }, { name: 'vetbis', label: 'VETBİS’e aşı bildirimi yap', type: 'checkbox', value: NS.integ && NS.integ.isOn('vetbis') }] });
    if (!v) return; const send = v.vetbis; delete v.vetbis;
    const rec = db.insert('vaccines', { ...v, pet: pt.id, vet: (NS.currentUser || {}).id });
    if (send && NS.integ) { const r = await NS.integ.call('vetbis', 'asi-bildirimi', { chip: pt.chip, species: pt.species, name: pt.name, owner: owner(pt.owner).name, vaccine: v.type, lot: v.lot, karekod: v.karekod, date: v.date }); if (realOk(r, 'VETBİS aşı bildirimi')) { rec.vetbis = r.ref; db.save(); } }
    toast('Aşı kaydedildi', 'ok'); app.refresh();
  }
  async function newPet(app) {
    let ownerId = null;
    if (await confirm('Sahibi kayıtlı mı?', { title: 'Yeni hasta', ok: 'Evet, listeden seç', danger: false })) ownerId = '';
    else { const o = await formModal({ title: 'Yeni sahip', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta' }, { name: 'address', label: 'Adres', full: true }] }); if (!o) return; ownerId = db.insert('owners', o).id; }
    const v = await formModal({ title: 'Yeni hasta', fields: PF(), values: { owner: ownerId, species: 'Kedi', gender: 'Dişi' } });
    if (!v) return; const p = db.insert('pets', { ...v, weights: [] }); app.go('hasta', p.id);
  }
  async function visitForm(app, petId) {
    const v = await formModal({ title: 'Muayene kaydı', size: 'wide', fields: [{ name: 'pet', label: 'Hasta', type: 'select', options: db.all('pets').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((p) => ({ value: p.id, label: `${SPECIES[p.species]} ${p.name} (${owner(p.owner).name})` })), value: petId }, { name: 'weight', label: 'Kilo (kg)', type: 'number', step: '0.1' }, { name: 'complaint', label: 'Şikâyet', required: true, full: true }, { name: 'findings', label: 'Bulgular (ateş, muayene)', type: 'textarea', full: true }, { name: 'diagnosis', label: 'Tanı', full: true }, { name: 'treatment', label: 'Tedavi / reçete', type: 'textarea', full: true }, { name: 'fee', label: 'Ücret (₺)', type: 'number', value: S().exam }, { name: 'erx', label: 'Tedavideki ilaçlar için VETBİS e-reçete yaz', type: 'checkbox', value: NS.integ && NS.integ.isOn('vetbis') }, { name: 'esmm', label: 'Ücret için e-SMM makbuzu kes', type: 'checkbox', value: NS.integ && NS.integ.isOn('esmm') }] });
    if (!v) return;
    const { erx, esmm } = v; delete v.erx; delete v.esmm;
    const vis = db.insert('visits', { ...v, date: new Date().toISOString(), vet: (NS.currentUser || {}).id });
    const pp = pet(v.pet);
    if (erx && v.treatment && NS.integ) { const r = await NS.integ.call('vetbis', 'e-recete', { chip: pp.chip, species: pp.species, owner: owner(pp.owner).name, diagnosis: v.diagnosis, drugs: v.treatment.split('\n').filter(Boolean) }); if (realOk(r, 'VETBİS e-reçete')) vis.erx = r.ref; }
    if (esmm && v.fee && NS.integ) { const r = await NS.integ.call('esmm', 'makbuz', { name: owner(pp.owner).name, amount: v.fee, desc: `${pp.name} muayene` }); if (realOk(r, 'e-SMM')) vis.esmm = r.ref; }
    db.save();
    if (v.weight) { const p = pet(v.pet); p.weights = [...(p.weights || []), { date: today(), kg: Number(v.weight) }]; db.save(); }
    toast('Muayene kaydedildi', 'ok'); app.go('hasta', v.pet);
  }
  function petsPage(el, p, app) {
    let q = '', sp = '';
    el.innerHTML = pageHead('Hastalar', 'Hayvan ve sahip kartları', `<button class="btn primary" id="np">${icon('plus')} Yeni hasta</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Hayvan adı, sahip, telefon, çip no...')}<div class="seg"><button data-s="" class="active">Tümü</button>${Object.keys(SPECIES).map((s) => `<button data-s="${s}">${SPECIES[s]} ${s}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { const rows = db.all('pets', (x) => (!sp || x.species === sp) && NS.match(q, x.name, owner(x.owner).name, owner(x.owner).phone, x.chip)).sort((a, b) => a.name.localeCompare(b.name, 'tr')); $('#t', el).innerHTML = table({ rows, emptyIcon: 'paw', columns: [{ label: 'Hasta', render: (x) => `<a href="#/hasta/${x.id}" class="row nw" style="color:inherit">${av(x)}<div><b>${esc(x.name)}</b>${x.allergy ? ' <span style="color:var(--err)">⚠</span>' : ''}<div class="small faint">${esc(x.breed)} · ${esc(x.gender)} · ${ageStr(x.birth)}</div></div></a>` }, { label: 'Sahibi', render: (x) => `${esc(owner(x.owner).name)}<div class="small faint">${esc(owner(x.owner).phone)}</div>` }, { label: 'Son ziyaret', render: (x) => { const v = db.all('visits', (y) => y.pet === x.id).sort((a, b) => b.date.localeCompare(a.date))[0]; return v ? NS.date(v.date) : '-'; } }, { label: 'Aşı durumu', render: (x) => { const d = dueVax(14).filter((v) => v.pet === x.id); return d.length ? badge(d.length + ' aşı yaklaşıyor', d.some((v) => v.next < today()) ? 'err' : 'warn') : badge('Güncel', 'ok'); } }], actions: [{ icon: 'eye', act: 'v' }], foot: `${rows.length} hasta` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-s]', (e, b) => { sp = b.dataset.s; $$('[data-s]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => app.go('hasta', b.dataset.id));
    $('#np', el).onclick = () => newPet(app);
    draw();
  }
  function petPage(el, id, app) {
    const pt = db.get('pets', id); if (!pt) return app.go('hastalar');
    const o = owner(pt.owner);
    const visits = db.all('visits', (v) => v.pet === id).sort((a, b) => b.date.localeCompare(a.date));
    const vax = db.all('vaccines', (v) => v.pet === id).sort((a, b) => b.date.localeCompare(a.date));
    const latest = {}; vax.forEach((v) => { if (!latest[v.type]) latest[v.type] = v; });
    const ws = (pt.weights || []).slice(-8);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/hastalar">${icon('back')} Hastalar</a></div>
      <div class="card pad mb row">${av(pt, true)}<div class="grow"><h1>${esc(pt.name)} ${pt.status ? badge(PST[pt.status][0], PST[pt.status][1]) : ''}</h1><div class="muted">${esc(pt.species)} · ${esc(pt.breed)} · ${esc(pt.gender)} · ${ageStr(pt.birth)} ${pt.neutered ? '· kısırlaştırılmış' : ''}</div>${pt.chip ? `<div class="small mono">Çip: ${esc(pt.chip)} ${pt.petvet ? badge('PETVET kayıtlı', 'ok') : `<button class="btn sm" id="pv">${icon('send')} PETVET’e kaydet</button>`}</div>` : ''}${pt.allergy ? `<div class="mt">${badge(pt.allergy, 'err')}</div>` : ''}</div>
        <div class="col"><button class="btn primary" id="nv">${icon('heart')} Muayene</button><button class="btn" id="vx">${icon('shield')} Aşı uygula</button><button class="btn" id="ed">${icon('edit')} Düzenle</button><a class="btn" target="_blank" rel="noopener" href="${wa(o, `Merhaba ${o.name}, ${pt.name} için dijital aşı karnesine buradan ulaşabilirsiniz (kayıtlı telefonunuzla giriş): ${location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '')}karne.html — ${S().bizName}`)}">${icon('message')} Karneyi gönder</a></div></div>
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Muayene geçmişi</h3></div><div class="card-b">${visits.length ? `<div class="tl">${visits.map((v) => `<div class="it"><div class="row between"><b>${esc(v.diagnosis || v.complaint)}</b><span class="small faint">${NS.dt(v.date)} · ${esc(usr(v.vet).name.replace('Vet. Hekim ', 'Vhk. '))}</span></div><div class="small"><b>Şikâyet:</b> ${esc(v.complaint)}</div>${v.findings ? `<div class="small muted">${esc(v.findings)}</div>` : ''}${v.treatment ? `<div class="small" style="color:var(--accent)">${icon('pill')} ${esc(v.treatment)}</div>` : ''}<div class="small faint">${money(v.fee || 0)}</div></div>`).join('')}</div>` : '<div class="faint small">Kayıt yok</div>'}</div></div>
        ${ws.length > 1 ? `<div class="card"><div class="card-h"><h3>Kilo takibi</h3></div><div class="card-b">${chart.line([{ name: 'Kilo', values: ws.map((w) => w.kg) }], ws.map((w) => NS.date(w.date).slice(0, 5)), { height: 160, format: (v) => num(v) + ' kg' })}</div></div>` : ''}
      </div><div class="col" style="gap:16px">
        <div class="card pad"><h3 class="mb">${icon('user')} Sahibi</h3><button class="btn sm" id="kk" style="float:right">${icon('lock')} Karne kodu</button><b>${esc(o.name)}</b><div class="small muted">${esc(o.phone)} · ${esc(o.email || '')}</div><div class="small muted">${esc(o.address || '')}</div><div class="row mt"><a class="btn sm" href="tel:${esc(String(o.phone).replace(/\s/g, ''))}">${icon('phone')}</a><a class="btn sm" target="_blank" rel="noopener" href="${wa(o, `Merhaba ${o.name}, ${S().bizName}'nden yazıyoruz.`)}">${icon('message')}</a></div>
          <div class="small mt">Diğer hayvanları: ${db.all('pets', (x) => x.owner === o.id && x.id !== id).map((x) => `<a href="#/hasta/${x.id}">${SPECIES[x.species]} ${esc(x.name)}</a>`).join(', ') || '-'}</div></div>
        <div class="card"><div class="card-h"><h3>Aşı karnesi</h3></div><div class="card-b">${(VAX[pt.species] || []).map(([type]) => { const v = latest[type]; return `<div class="list-item small"><span class="grow"><b>${esc(type)}</b><div class="faint">${v ? 'Son: ' + NS.date(v.date) : 'Hiç yapılmadı'}</div></span>${v ? (v.next < today() ? badge('Gecikti', 'err') : v.next <= iso(addDays(new Date(), 14)) ? badge(NS.date(v.next), 'warn') : badge(NS.date(v.next), 'ok')) : badge('Yapılmadı', 'err')}<button class="btn sm ghost icon" data-vx="${esc(type)}">${icon('plus')}</button></div>`; }).join('') || '<div class="faint small">Bu tür için aşı takvimi yok</div>'}<button class="btn sm block mt" id="pc">${icon('print')} Aşı karnesi yazdır</button></div></div></div></div>`;
    $('#nv', el).onclick = () => visitForm(app, id);
    // Pati karnesi girişi: telefon + klinikten verilen kod
    $('#kk', el).onclick = () => { const code = NS.portalCode(db, o); modal({ title: 'Pati karnesi giriş kodu', body: `<p>${esc(o.name)} için giriş kodu:</p><div class="mono" style="font-size:28px;font-weight:800;letter-spacing:.15em;margin:10px 0">${esc(code)}</div><p class="small muted">Sahip, <b>${esc(karneUrl())}</b> adresinde telefon numarası ve bu kodla girer. Kodu yalnızca sahibine verin.</p><div class="row mt"><a class="btn primary" target="_blank" rel="noopener" href="${wa(o, `Merhaba ${o.name}, ${S().bizName} pati karnesi: ${karneUrl()} — Giriş kodunuz: ${code}`)}">${icon('message')} WhatsApp ile gönder</a><button class="btn" id="kr">${icon('refresh')} Yeni kod üret</button></div>`, onOpen: (b, close) => { $('#kr', b).onclick = () => { delete o.portalCode; NS.portalCode(db, o); db.log('Karne kodu yenilendi', o.name); close(); $('#kk', el).click(); }; } }); };
    if ($('#pv', el)) $('#pv', el).onclick = async () => { const r = NS.integ ? await NS.integ.call('petkayit', 'cip-kayit', { chip: pt.chip, name: pt.name, species: pt.species, breed: pt.breed, gender: pt.gender, birth: pt.birth, owner: { name: o.name, phone: o.phone, address: o.address } }) : null; if (realOk(r, 'PETVET çip kaydı')) { pt.petvet = r.ref; db.save(); app.refresh(); } };
    $('#vx', el).onclick = () => vaxDone(app, pt, ((VAX[pt.species] || [])[0] || [''])[0]);
    on(el, 'click', '[data-vx]', (e, b) => vaxDone(app, pt, b.dataset.vx));
    $('#ed', el).onclick = async () => { const v = await formModal({ title: pt.name, fields: PF(), values: pt }); if (v) { db.update('pets', id, v); app.refresh(); } };
    $('#pc', el).onclick = () => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>AŞI KARNESİ</h3><p><b>${esc(pt.name)}</b> · ${esc(pt.species)} / ${esc(pt.breed)} · ${esc(pt.gender)} · Doğum ${NS.date(pt.birth)}<br>Çip: ${esc(pt.chip || '-')} · Sahibi: ${esc(o.name)} (${esc(o.phone)})</p><table><tr><th>Aşı</th><th>Uygulama</th><th>Sonraki</th><th>Lot</th></tr>${vax.map((v) => `<tr><td>${esc(v.type)}</td><td>${NS.date(v.date)}</td><td>${NS.date(v.next)}</td><td>${esc(v.lot || '')}</td></tr>`).join('')}</table><p style="margin-top:40px;text-align:right">Veteriner hekim kaşe / imza</p></div>`, { title: 'Aşı karnesi' });
  }
  function shopPage(el, p, app) {
    const cart = [];
    let ownerId = '';
    const draw = () => {
      el.innerHTML = pageHead('Satış & Stok', 'Mama, ilaç ve aksesuar satışı') + `<div class="grid g-21"><div class="card"><div class="card-h"><h3>Ürünler</h3><button class="btn sm" id="np">${icon('plus')} Ürün</button></div>${table({ rows: db.all('products').sort((a, b) => a.cat.localeCompare(b.cat, 'tr')), columns: [{ label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.cat)}</div>` }, { label: 'Fiyat', cls: 'right', render: (x) => money(x.price) }, { label: 'Stok', cls: 'right', render: (x) => (x.stock <= x.min ? badge(x.stock, 'err') : x.stock) }], actions: [{ icon: 'plus', act: 'add', title: 'Sepete ekle' }, { icon: 'edit', act: 'ed' }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('cart')} Sepet</h3></div><div class="card-b"><select class="input mb" id="ow"><option value="">Müşteri (isteğe bağlı)</option>${db.all('owners').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((o) => `<option value="${o.id}" ${o.id === ownerId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>
          ${cart.map((c, i) => `<div class="list-item small"><span class="grow">${c.qty} × ${esc(c.name)}</span><b>${money(c.qty * c.price)}</b><button class="btn sm ghost icon" data-rm="${i}">${icon('x')}</button></div>`).join('') || '<div class="faint small">Sepet boş</div>'}
          <div class="row between mt"><b>Toplam</b><b style="font-size:22px">${money(sum(cart, (c) => c.qty * c.price))}</b></div><div class="row mt"><button class="btn ok grow" data-pay="nakit" ${cart.length ? '' : 'disabled'}>${icon('cash')} Nakit</button><button class="btn primary grow" data-pay="kart" ${cart.length ? '' : 'disabled'}>${icon('card')} Kart</button></div></div></div></div>
        <div class="card mt"><div class="card-h"><h3>Son satışlar</h3></div>${table({ rows: db.all('sales').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15), columns: [{ label: 'Tarih', render: (s) => NS.dt(s.at) }, { label: 'Müşteri', render: (s) => esc(s.owner ? owner(s.owner).name : 'Perakende') }, { label: 'Ürünler', render: (s) => esc(s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')) }, { label: 'Tutar', cls: 'right', render: (s) => `<b>${money(s.total)}</b>` }] })}</div>`;
      $('#ow', el).onchange = (e) => { ownerId = e.target.value; };
      $('#np', el).onclick = async () => { const v = await formModal({ title: 'Ürün', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'cat', label: 'Kategori', type: 'select', options: ['Mama', 'İlaç', 'Aksesuar', 'Aşı'] }, { name: 'price', label: 'Fiyat', type: 'number', required: true }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'min', label: 'Kritik', type: 'number', value: 5 }] }); if (v) { db.insert('products', v); draw(); } };
    };
    on(el, 'click', '[data-act]', async (e, b) => { const x = db.get('products', b.dataset.id); if (b.dataset.act === 'add') { const c = cart.find((y) => y.pid === x.id); if ((c ? c.qty : 0) + 1 > (Number(x.stock) || 0)) return toast(`${x.name}: stokta ${Number(x.stock) || 0} adet var`, 'err'); if (c) c.qty++; else cart.push({ pid: x.id, name: x.name, qty: 1, price: x.price }); draw(); } else { const v = await formModal({ title: x.name, fields: [{ name: 'price', label: 'Fiyat', type: 'number' }, { name: 'stock', label: 'Stok', type: 'number' }], values: x }); if (v) { Object.assign(x, v); db.save(); draw(); } } });
    on(el, 'click', '[data-rm]', (e, b) => { cart.splice(b.dataset.rm, 1); draw(); });
    on(el, 'click', '[data-pay]', (e, b) => { db.load(); const short = cart.find((c) => c.qty > (Number((db.get('products', c.pid) || {}).stock) || 0)); if (short) return toast(`${short.name}: stok yetersiz (başka bir satışta azalmış olabilir)`, 'err'); cart.forEach((c) => { const x = db.get('products', c.pid); x.stock -= c.qty; }); db.insert('sales', { owner: ownerId || null, items: cart.slice(), total: sum(cart, (c) => c.qty * c.price), at: new Date().toISOString(), pay: b.dataset.pay }); toast('Satış tamamlandı', 'ok'); cart.length = 0; draw(); });
    draw();
  }
  function hotelPage(el, p, app) {
    const ST = { rezervasyon: ['Rezervasyon', 'info'], konakliyor: ['Konaklıyor', 'ok'], cikis: ['Çıkış yaptı', ''] };
    NS.crud(el, app, {
      col: 'stays', title: 'Pet Otel',
      // Çıkışta konaklama ücreti tahsil edilir ve satışlara (ciro raporu) yazılır
      onSave: async (v, rec) => {
        const s = rec ? db.get('stays', rec.id) : db.all('stays').slice(-1)[0];
        if (!s || s.status !== 'cikis' || s.paidAt) return;
        const nights = Math.max(1, daysBetween(s.from, s.to)), total = nights * (Number(s.daily) || 0);
        const pay = await formModal({ title: `Çıkış ödemesi — ${pet(s.pet).name}`, fields: [{ name: 'total', label: `Tutar (${nights} gece × ${money(s.daily)})`, type: 'number', value: total }, { name: 'pay', label: 'Ödeme', type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }, { value: 'havale', label: 'Havale' }] }], submitLabel: 'Tahsil et' });
        if (!pay) { s.unpaid = true; db.save(); app.refresh(); return toast('Ödeme alınmadı — konaklama "ödenmedi" olarak kaldı; kaydı tekrar kaydedince ödeme sorulur', ''); }
        db.insert('sales', { owner: pet(s.pet).owner, items: [{ name: `Pet otel ${nights} gece`, qty: 1, price: Number(pay.total) || 0 }], total: Number(pay.total) || 0, at: new Date().toISOString(), pay: pay.pay, stay: s.id });
        s.paidAt = new Date().toISOString(); delete s.unpaid; db.save(); toast('Konaklama ücreti tahsil edildi', 'ok'); app.refresh();
      }, sub: 'Konaklama, beslenme notları ve ücretlendirme', single: 'Konaklama', addLabel: 'Yeni konaklama', emptyIcon: 'home',
      fields: () => [{ name: 'pet', label: 'Hasta', type: 'select', options: db.all('pets').map((x) => ({ value: x.id, label: `${SPECIES[x.species]} ${x.name} (${owner(x.owner).name})` })) }, { name: 'from', label: 'Giriş', type: 'date', required: true }, { name: 'to', label: 'Çıkış', type: 'date', required: true }, { name: 'daily', label: 'Günlük ücret', type: 'number' }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(ST).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'note', label: 'Beslenme / ilaç notu', type: 'textarea', full: true }],
      defaults: () => ({ from: today(), to: iso(addDays(new Date(), 3)), daily: S().hotelDaily, status: 'rezervasyon' }), sort: (a, b) => a.from.localeCompare(b.from),
      columns: [{ label: 'Hasta', render: (s) => `<div class="row nw">${av(pet(s.pet))}<div><b>${esc(pet(s.pet).name)}</b><div class="small faint">${esc(owner(pet(s.pet).owner).name)}</div></div></div>` }, { label: 'Tarih', render: (s) => `${NS.date(s.from)} – ${NS.date(s.to)}<div class="small faint">${Math.max(1, daysBetween(s.from, s.to))} gece</div>` }, { key: 'note', label: 'Not', render: (s) => `<span class="small">${esc(s.note || '')}</span>` }, { label: 'Tutar', cls: 'right', render: (s) => money(Math.max(1, daysBetween(s.from, s.to)) * s.daily) }, { key: 'status', label: 'Durum', render: (s) => badge(ST[s.status][0], ST[s.status][1]) + (s.unpaid && !s.paidAt ? ' ' + badge('Ödenmedi', 'err') : s.paidAt ? ' ' + badge('Ödendi', 'ok') : '') }],
    });
  }
  function apptsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'appts', title: 'Randevular', single: 'Randevu', addLabel: 'Yeni randevu', emptyIcon: 'calendar',
      fields: () => [{ name: 'pet', label: 'Hasta', type: 'select', options: db.all('pets').map((x) => ({ value: x.id, label: `${SPECIES[x.species]} ${x.name} (${owner(x.owner).name})` })) }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'time', label: 'Saat', type: 'time', required: true }, { name: 'reason', label: 'Neden', required: true }, { name: 'vet', label: 'Hekim', type: 'select', options: db.all('users', (u) => u.role !== 'asistan').map((u) => ({ value: u.id, label: u.name })) }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'bekliyor', label: 'Bekliyor' }, { value: 'geldi', label: 'Geldi' }, { value: 'gelmedi', label: 'Gelmedi' }] }],
      defaults: () => ({ date: today(), time: '10:00', status: 'bekliyor' }), sort: (a, b) => (a.date + a.time).localeCompare(b.date + b.time),
      // Aynı hekim / aynı saat çakışması: NS.crud kaydı durduramadığı için kayıt sonrası açık uyarı verilir (çekirdek isteği Ç8)
      beforeSave: (v, rec) => { const c = db.find('appts', (a) => (!rec || a.id !== rec.id) && a.date === v.date && a.time === v.time && a.status !== 'iptal' && (!v.vet || !a.vet || a.vet === v.vet)); if (c) setTimeout(() => toast(`Dikkat: ${NS.date(v.date)} ${v.time} saatinde ${pet(c.pet).name} randevusu da var`, 'err'), 400); },
      filters: [{ value: 'up', label: 'Yaklaşan', test: (a) => a.date >= today() }, { value: 'req', label: 'Online istekler', test: (a) => a.status === 'talep' }, { value: 'all', label: 'Tümü' }],
      extraActions: [{ icon: 'check', act: 'confirm', title: 'Online isteği onayla' }],
      onAction: (a, x, redraw) => { if (x.status !== 'talep') return toast('Bu randevu zaten onaylı'); const pt2 = pet(x.pet), o2 = owner(pt2.owner); db.update('appts', x.id, { status: 'bekliyor', vet: x.vet || (NS.currentUser || {}).id }); redraw(); smsOne(o2.phone, o2.name, `${pt2.name} için ${NS.date(x.date)} ${x.time} randevunuz onaylandı. ${S().bizName} ${S().bizPhone || ''}`, 'randevu').then((k) => { db.save(); toast('Randevu onaylandı · ' + smsSummary({ [k]: 1 }), k === 'err' ? 'err' : k === 'ok' ? 'ok' : ''); }); },
      columns: [{ key: 'date', label: 'Tarih', render: (a) => `<b>${NS.date(a.date)} ${a.time}</b>` }, { label: 'Hasta', render: (a) => `${SPECIES[pet(a.pet).species]} <b>${esc(pet(a.pet).name)}</b> <span class="small faint">${esc(owner(pet(a.pet).owner).name)}</span>` }, { key: 'reason', label: 'Neden' }, { label: 'Hekim', render: (a) => esc(usr(a.vet).name) }, { key: 'status', label: 'Durum', render: (a) => (a.status === 'talep' ? `${badge('Online istek', 'warn')}<div class="small faint">${esc(owner(pet(a.pet).owner).phone)}</div>` : badge(a.status, a.status === 'geldi' ? 'ok' : a.status === 'gelmedi' ? 'err' : 'info')) }],
    });
  }
  function reportsPage(el) {
    const months = Array.from({ length: 3 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2 + i); return iso(d).slice(0, 7); });
    el.innerHTML = pageHead('Raporlar', 'Muayene, satış ve tanı analizleri') + `
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Aylık gelir</h3></div><div class="card-b">${chart.bars(months.flatMap((m) => [{ label: NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3) + ' muay.', value: sum(db.all('visits', (v) => v.date.startsWith(m)), (v) => v.fee || 0), color: '#b45309' }, { label: NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3) + ' satış', value: sum(db.all('sales', (s) => s.at.startsWith(m)), (s) => s.total), color: '#0d9488' }]), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>En sık tanılar</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(db.all('visits'), (v) => v.diagnosis || 'Belirtilmedi')).map(([label, v]) => ({ label, value: v.length })).sort((a, b) => b.value - a.value).slice(0, 7), { size: 140 })}</div></div></div>
      <div class="card"><div class="card-h"><h3>Hekim performansı</h3></div>${table({ rows: db.all('users', (u) => u.role !== 'asistan').map((u) => ({ id: u.id, u, n: db.all('visits', (v) => v.vet === u.id).length, f: sum(db.all('visits', (v) => v.vet === u.id), (v) => v.fee || 0), x: db.all('vaccines', (v) => v.vet === u.id).length })), columns: [{ label: 'Hekim', render: (r) => `<b>${esc(r.u.name)}</b>` }, { label: 'Muayene', cls: 'right', key: 'n' }, { label: 'Aşı', cls: 'right', key: 'x' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.f) }] })}</div>`;
  }

  const ROLES = { admin: 'Yönetici hekim', hekim: 'Veteriner hekim', asistan: 'Asistan' };
  NS.shell({
    id: 'veteriner', integrations: ['sms', 'whatsapp', 'email', 'pos', 'printer', 'label', 'barcode', 'efatura', 'webhook', 'backup'], name: 'Veteriner', tagline: 'Klinik & Pet Otel', icon: 'paw', accent: '#b45309', db, home: 'ozet', auth: { roles: ROLES }, titles: { hasta: 'Hasta kartı' },
    nav: [{ sec: 'Klinik' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'hastalar', label: 'Hastalar', icon: 'paw' }, { id: 'randevular', label: 'Randevular', icon: 'calendar' }, { id: 'otel', label: 'Pet Otel', icon: 'home' }, { sec: 'İşletme' }, { id: 'satis', label: 'Satış & Stok', icon: 'cart' }, { id: 'sahipler', label: 'Hayvan Sahipleri', icon: 'users' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, hastalar: petsPage, hasta: petPage, randevular: apptsPage, otel: hotelPage, satis: shopPage, raporlar: reportsPage,
      sahipler: (el, p, a) => NS.crud(el, a, { col: 'owners', title: 'Hayvan Sahipleri', single: 'Sahip', addLabel: 'Yeni sahip', emptyIcon: 'users', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta' }, { name: 'address', label: 'Adres', full: true }], sort: (x, y) => x.name.localeCompare(y.name, 'tr'), searchFields: (o) => [o.name, o.phone], columns: [{ key: 'name', label: 'Sahip', render: (o) => `<b>${esc(o.name)}</b><div class="small faint">${esc(o.phone)}</div>` }, { label: 'Hayvanları', render: (o) => db.all('pets', (x) => x.owner === o.id).map((x) => `<a href="#/hasta/${x.id}">${SPECIES[x.species]} ${esc(x.name)}</a>`).join(', ') }, { label: 'Harcama', cls: 'right', render: (o) => money(sum(db.all('visits', (v) => pet(v.pet).owner === o.id), (v) => v.fee || 0) + sum(db.all('sales', (s) => s.owner === o.id), (s) => s.total)) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Ücretler' }, { name: 'exam', label: 'Muayene ücreti', type: 'number' }, { name: 'hotelDaily', label: 'Pet otel günlük', type: 'number' }] }),
    },
  });
})();
