/* NEBSOFT Spor Salonu — üyelik, giriş kontrol, ders programı, tahsilat/taksit, ölçüm ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;

  function seed(db) {
    db.data._settings = { bizName: 'Power Fit Spor Merkezi', bizPhone: '0232 444 12 34', bizAddress: 'Alsancak, Kıbrıs Şehitleri Cad. No:88 İzmir', openHour: 6, closeHour: 24, maxFreeze: 30 };
    db.data.users = [{ id: 'u1', name: 'Barış Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Gamze Danışma', role: 'danisma', pin: '1234', active: true }, { id: 'u3', name: 'Ozan Eğitmen', role: 'egitmen', pin: '1234', active: true }];
    db.data.plans = [
      { id: 'pk1', name: 'Aylık Fitness', months: 1, price: 1800, color: '#16a34a' }, { id: 'pk2', name: '3 Aylık Fitness', months: 3, price: 4800, color: '#0284c7' },
      { id: 'pk3', name: '6 Aylık Fitness', months: 6, price: 8400, color: '#7c3aed' }, { id: 'pk4', name: 'Yıllık Fitness + Grup Dersleri', months: 12, price: 14400, color: '#ea580c' },
      { id: 'pk5', name: 'Öğrenci Aylık', months: 1, price: 1300, color: '#db2777' }, { id: 'pk6', name: 'Pilates 8 Ders', months: 2, price: 3600, sessions: 8, color: '#0d9488' },
    ];
    db.data.trainers = [{ id: 't1', name: 'Ozan Demir', branch: 'Fitness & PT', color: '#16a34a' }, { id: 't2', name: 'Melis Ak', branch: 'Pilates & Yoga', color: '#db2777' }, { id: 't3', name: 'Kaan Er', branch: 'Crossfit & Boks', color: '#ea580c' }];
    const C = (day, time, name, trainer, capacity, dur = 50) => ({ id: NS.uid(), day, time, name, trainer, capacity, dur });
    db.data.classes = [C(1, '07:30', 'Sabah Yogası', 't2', 15), C(1, '19:00', 'Crossfit', 't3', 12), C(1, '20:00', 'Pilates Mat', 't2', 14), C(2, '18:00', 'Boks', 't3', 10), C(2, '19:30', 'Zumba', 't2', 20), C(3, '07:30', 'Sabah Yogası', 't2', 15), C(3, '19:00', 'Crossfit', 't3', 12), C(3, '20:00', 'Pilates Reformer', 't2', 8), C(4, '18:00', 'Boks', 't3', 10), C(4, '19:30', 'Spinning', 't1', 16, 45), C(5, '19:00', 'HIIT', 't1', 16, 40), C(5, '20:00', 'Pilates Mat', 't2', 14), C(6, '10:00', 'Hafta Sonu Yogası', 't2', 18, 60), C(6, '12:00', 'Crossfit', 't3', 12), C(0, '11:00', 'Stretching', 't1', 20, 40)];
    const members = NS.NAMES.map((n, i) => {
      const plan = pick(db.data.plans);
      const start = addDays(new Date(), -rand(0, plan.months * 30 + 25));
      const end = addDays(start, plan.months * 30);
      const total = plan.price;
      const inst = rand(0, 2) === 0 && plan.months >= 3 ? 3 : 1;
      const installments = Array.from({ length: inst }, (_, k) => ({ id: NS.uid(), due: iso(addDays(start, k * 30)), amount: Math.round(total / inst), paid: addDays(start, k * 30) < new Date() && Math.random() < 0.85 }));
      return { id: 'm' + i, no: String(10000 + i), name: n, phone: NS.phone(), gender: NS.sampleGender(n), birth: `${rand(1975, 2006)}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, plan: plan.id, start: iso(start), end: iso(end), frozen: 0, sessionsLeft: plan.sessions || null, installments, emergency: NS.phone(), note: i % 7 === 0 ? 'Bel fıtığı — ağır squat yok' : '', measurements: Array.from({ length: rand(1, 5) }, (_, k) => ({ date: iso(addDays(start, k * 20)), weight: 78 - k * 1.2 + rand(-2, 2), fat: 24 - k * 0.8, muscle: 34 + k * 0.4, waist: 90 - k * 1.5 })).filter((x) => x.date <= today()) };
    });
    db.data.members = members;
    const entries = [];
    for (let d = 20; d >= 0; d--) {
      const n = rand(40, 90);
      for (let k = 0; k < n; k++) { const m = pick(members); if (m.end < iso(addDays(new Date(), -d))) continue; const at = addDays(new Date(), -d); at.setHours(pick([7, 7, 8, 12, 13, 17, 18, 18, 19, 19, 19, 20, 20, 21]), rand(0, 59)); if (at > new Date()) continue; entries.push({ id: NS.uid(), member: m.id, at: at.toISOString(), ok: true }); }
    }
    db.data.entries = entries.sort((a, b) => a.at.localeCompare(b.at));
    db.data.bookings = [];
    db.data.payments = members.flatMap((m) => m.installments.filter((i) => i.paid).map((i) => ({ id: NS.uid(), member: m.id, amount: i.amount, at: new Date(i.due + 'T12:00').toISOString(), type: pick(['kart', 'kart', 'nakit']), desc: (db.data.plans.find((p) => p.id === m.plan) || {}).name })));
    db.data.products = [{ id: 'pr1', name: 'Protein tozu 1kg', price: 1450, stock: 12 }, { id: 'pr2', name: 'Su 0,5L', price: 15, stock: 120 }, { id: 'pr3', name: 'Enerji içeceği', price: 55, stock: 48 }, { id: 'pr4', name: 'Havlu kiralama', price: 30, stock: 99 }, { id: 'pr5', name: 'Kişisel antrenman (1 seans)', price: 900, stock: 999 }];
  }
  const db = new NS.DB('spor', seed);
  const S = () => db.settings({ maxFreeze: 30 });
  const plan = (id) => db.get('plans', id) || { name: '-', months: 1, price: 0 };
  const trainer = (id) => db.get('trainers', id) || { name: '-', color: '#64748b' };
  const mem = (id) => db.get('members', id) || { name: '-' };
  const daysLeft = (m) => daysBetween(new Date(), m.end);
  const status = (m) => (m.canceled ? 'iptal' : m.freezeUntil && m.freezeUntil >= today() ? 'donduruldu' : m.end < today() ? 'bitti' : daysLeft(m) <= 7 ? 'bitiyor' : 'aktif');
  const STS = { aktif: ['Aktif', 'ok'], bitiyor: ['Süresi bitiyor', 'warn'], bitti: ['Süresi doldu', 'err'], donduruldu: ['Donduruldu', 'info'], iptal: ['İptal edildi', 'err'] };
  const debt = (m) => sum(m.installments.filter((i) => !i.paid && !i.canceled && i.due <= today()), (i) => i.amount);
  const totalDebt = (m) => sum(m.installments.filter((i) => !i.paid && !i.canceled), (i) => i.amount);
  // Üyelik iptali hesabı: kullanılan gün (dondurma hariç) oranında bedel + ayardaki iptal bedeli düşülür; kalan iade önerisidir, tutar elle değiştirilebilir
  function cancelCalc(m) {
    const total = sum(m.installments, (i) => i.amount); const paid = sum(m.installments.filter((i) => i.paid), (i) => i.amount); const fz = m.frozen || 0;
    const days = Math.max(1, daysBetween(m.start, m.end) - fz); const used = NS.clamp(daysBetween(m.start, new Date()) - fz, 0, days);
    const usedVal = Math.round(total * used / days * 100) / 100; const fee = Number(S().cancelFee) || 0;
    return { total, paid, days, used, usedVal, fee, refund: Math.max(0, Math.round((paid - usedVal - fee) * 100) / 100), owe: Math.max(0, Math.round((usedVal + fee - paid) * 100) / 100) };
  }
  const insideNow = () => { const lim = new Date(Date.now() - 90 * 60000).toISOString(); return new Set(db.all('entries', (e) => e.ok && e.at > lim).map((e) => e.member)).size; };

  // ---------- Giriş kontrol ----------
  let lastGate = null;
  function gatePage(el, p, app) {
    const todays = db.all('entries', (e) => iso(e.at) === today()).sort((a, b) => b.at.localeCompare(a.at));
    const g = lastGate;
    el.innerHTML = pageHead('Giriş Kontrol', 'Üye kartı okutun, üye no veya telefon girin', `<span class="badge acc" style="font-size:13px;padding:6px 12px">${icon('users')} Şu an içeride ~${insideNow()} kişi</span>`) + `
      <div class="gate"><div class="col">
        <div class="search">${icon('qr')}<input class="input lg" id="gi" placeholder="Kart / üye no / telefon okutun + Enter" autocomplete="off" style="height:60px;font-size:20px"></div>
        <div class="gate-card ${g ? (g.ok ? 'ok' : 'err') : 'idle'}">${g ? `<div class="big-av">${esc(NS.initials(g.m.name))}</div><h1 style="color:inherit">${esc(g.m.name)}</h1><div style="font-size:18px;font-weight:700">${g.ok ? '✓ GİRİŞ ONAYLANDI' : '✕ GİRİŞ REDDEDİLDİ'}</div><div>${esc(g.msg)}</div>${g.m.note ? `<div class="badge" style="background:rgba(255,255,255,.2);color:#fff;border:0">${icon('alert')} ${esc(g.m.note)}</div>` : ''}` : `${icon('qr', 'ico-lg')}<h2>Kart okutmayı bekliyor</h2><p>Turnike entegrasyonunda kapı otomatik açılır.</p>`}</div>
        <div class="small muted">Hızlı deneme: ${db.all('members').slice(0, 6).map((m) => `<a href="#" data-try="${m.no}">${m.no}</a>`).join(' · ')}</div>
      </div>
      <div class="card"><div class="card-h"><h3>Bugünkü girişler (${todays.length})</h3></div><div class="card-b" style="max-height:520px;overflow:auto">${todays.slice(0, 60).map((e) => `<div class="list-item small"><span class="dot ${e.ok ? 'ok' : 'err'}"></span><span class="grow"><b>${esc(mem(e.member).name)}</b>${e.ok ? '' : ` <span style="color:var(--err)">${esc(e.reason || '')}</span>`}</span><span class="faint">${NS.time(e.at)}</span></div>`).join('') || '<div class="faint">Henüz giriş yok</div>'}</div></div></div>`;
    const inp = $('#gi', el); setTimeout(() => inp.focus(), 50);
    const check = (raw) => {
      raw = String(raw || '').trim(); if (!raw) return;
      const m = db.find('members', (x) => x.no === raw || x.phone.replace(/\D/g, '').endsWith(raw.replace(/\D/g, '')) && raw.replace(/\D/g, '').length >= 7);
      if (!m) { NS.beep(200, 300); toast('Üye bulunamadı', 'err'); return; }
      const st = status(m);
      let ok = ['aktif', 'bitiyor'].includes(st), msg = '';
      if (st === 'iptal') msg = `Üyelik ${NS.date(m.canceled.at)} tarihinde iptal edildi`;
      else if (st === 'bitti') msg = `Üyelik ${NS.date(m.end)} tarihinde sona erdi`;
      else if (st === 'donduruldu') msg = `Üyelik ${NS.date(m.freezeUntil)} tarihine kadar dondurulmuş`;
      else if (debt(m) > 0) { ok = false; msg = `Vadesi geçmiş borç: ${money(debt(m))}`; }
      else if (m.sessionsLeft === 0) { ok = false; msg = 'Ders hakkı bitti'; }
      else msg = `${plan(m.plan).name} · ${daysLeft(m)} gün kaldı${m.sessionsLeft ? ` · ${m.sessionsLeft} ders` : ''}`;
      db.insert('entries', { member: m.id, at: new Date().toISOString(), ok, reason: ok ? '' : msg });
      NS.beep(ok ? 1300 : 220, ok ? 120 : 400);
      // Turnike bağlıysa geçiş izni cihaza iletilir (röle açılır)
      if (ok && NS.integ && NS.integ.isOn('turnike')) NS.integ.call('turnike', 'kapi-ac', { member: m.no, name: m.name, relay: Number(NS.integ.cfg('turnike').relay) || 3 }, { silent: true });
      lastGate = { m, ok, msg };
      app.refresh();
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter') check(inp.value); };
    on(el, 'click', '[data-try]', (e, a) => { e.preventDefault(); check(a.dataset.try); });
    // Turnike / yüz tanıma cihazındaki okumaları periyodik çek (cihaz kartı okuttuğunda kontrol burada yapılır)
    if (NS.integ && NS.integ.isOn('turnike')) {
      const poll = async () => { if (app.route !== 'giris') return clearInterval(gatePoll); const r = await NS.integ.call('turnike', 'okumalar', { since: S().gateSince || new Date(Date.now() - 60000).toISOString() }, { silent: true }); db.saveSettings({ gateSince: new Date().toISOString() }); (r && r.data && Array.isArray(r.data.reads) ? r.data.reads : []).forEach((x) => check(x.card || x.member)); };
      clearInterval(gatePoll); gatePoll = setInterval(poll, 5000);
    }
  }
  let gatePoll = null;

  // ---------- Üyeler ----------
  const MEM_FIELDS = () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'gender', label: 'Cinsiyet', type: 'select', options: [{ value: 'K', label: 'Kadın' }, { value: 'E', label: 'Erkek' }] }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'emergency', label: 'Acil durum telefonu' }, { name: 'note', label: 'Sağlık notu', full: true }];
  async function newMember(app) {
    const v = await formModal({ title: 'Yeni üye kaydı', size: 'wide', fields: [...MEM_FIELDS(), { type: 'section', label: 'Üyelik' }, { name: 'plan', label: 'Paket', type: 'select', options: db.all('plans').map((p) => ({ value: p.id, label: `${p.name} — ${money(p.price)}` })) }, { name: 'start', label: 'Başlangıç', type: 'date', value: today() }, { name: 'inst', label: 'Taksit sayısı', type: 'select', options: ['1', '2', '3', '4', '6'] }, { name: 'disc', label: 'İndirim (₺)', type: 'number', value: 0 }, { name: 'payType', label: 'İlk ödeme', type: 'select', options: [{ value: 'kart', label: 'Kart' }, { value: 'nakit', label: 'Nakit' }, { value: 'havale', label: 'Havale' }] }] });
    if (!v) return;
    const p = plan(v.plan); const n = Number(v.inst) || 1; const total = p.price - (v.disc || 0);
    const installments = Array.from({ length: n }, (_, k) => ({ id: NS.uid(), due: iso(addDays(v.start, k * 30)), amount: Math.round(total / n), paid: k === 0 }));
    const m = db.insert('members', { name: v.name, phone: v.phone, gender: v.gender, birth: v.birth, emergency: v.emergency, note: v.note, no: String(10000 + db.all('members').length + rand(100, 900)), plan: p.id, start: v.start, end: iso(addDays(v.start, p.months * 30)), frozen: 0, sessionsLeft: p.sessions || null, installments, measurements: [] });
    db.insert('payments', { member: m.id, amount: installments[0].amount, at: new Date().toISOString(), type: v.payType, desc: p.name });
    db.log('Yeni üye', `${m.name} · ${p.name}`);
    toast(`${m.name} kaydedildi · Üye no ${m.no}`, 'ok'); app.go('uye', m.id);
  }
  function membersPage(el, p, app) {
    let q = '', f = 'all';
    el.innerHTML = pageHead('Üyeler', 'Üyelik durumları, borçlar ve iletişim', `<button class="btn" id="ex">${icon('download')}</button><button class="btn primary" id="nm">${icon('plus')} Yeni üye</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ad, telefon, üye no...')}<div class="seg">${[['all', 'Tümü'], ['aktif', 'Aktif'], ['bitiyor', 'Bitiyor'], ['bitti', 'Süresi dolan'], ['borc', 'Borçlu'], ['donduruldu', 'Dondurulan']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('members', (m) => (f === 'all' || (f === 'borc' ? debt(m) > 0 : status(m) === f)) && NS.match(q, m.name, m.phone, m.no)).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'users', columns: [{ label: 'Üye', render: (m) => `<div class="row nw"><div class="avatar">${esc(NS.initials(m.name))}</div><div><b>${esc(m.name)}</b><div class="small faint">#${m.no} · ${esc(m.phone)}</div></div></div>` }, { label: 'Paket', render: (m) => esc(plan(m.plan).name) }, { label: 'Bitiş', render: (m) => `${NS.date(m.end)}<div class="small faint">${daysLeft(m) >= 0 ? daysLeft(m) + ' gün' : ''}</div>` }, { label: 'Durum', render: (m) => badge(STS[status(m)][0], STS[status(m)][1]) }, { label: 'Borç', cls: 'right', render: (m) => (totalDebt(m) ? `<b style="color:${debt(m) ? 'var(--err)' : 'var(--warn)'}">${money(totalDebt(m))}</b>` : '-') }, { label: 'Son giriş', render: (m) => { const e = db.all('entries', (x) => x.member === m.id && x.ok).pop(); return e ? NS.ago(e.at) : '-'; } }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} üye` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => app.go('uye', b.dataset.id));
    $('#nm', el).onclick = () => newMember(app);
    $('#ex', el).onclick = () => NS.csv('uyeler', rows(), [{ key: 'no', label: 'No' }, { key: 'name', label: 'Ad' }, { key: 'phone', label: 'Telefon' }, { label: 'Paket', value: (m) => plan(m.plan).name }, { key: 'end', label: 'Bitiş' }, { label: 'Borç', value: totalDebt }]);
    draw();
  }
  function memberPage(el, id, app) {
    const m = db.get('members', id);
    if (!m) return app.go('uyeler');
    const st = status(m);
    const ent = db.all('entries', (e) => e.member === m.id && e.ok);
    const ms = m.measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/uyeler">${icon('back')} Üyeler</a><span class="grow"></span><button class="btn" id="ptl">${icon('globe')} Üye portalı kodu</button></div>
      <div class="card pad mb row"><div class="avatar lg" style="width:64px;height:64px;font-size:22px">${esc(NS.initials(m.name))}</div><div class="grow"><h1>${esc(m.name)}</h1><div class="muted">#${m.no} · ${esc(m.phone)} · ${m.gender === 'K' ? 'Kadın' : 'Erkek'}${m.birth ? ' · ' + (new Date().getFullYear() - Number(m.birth.slice(0, 4))) + ' yaş' : ''}</div>${m.note ? `<div class="mt">${badge(m.note, 'warn')}</div>` : ''}</div>
        <div class="col center">${NS.qrSvg('MEMBER:' + m.no, 90)}<span class="small faint">Giriş kartı</span></div></div>
      <div class="grid g4 mb">${kpi('Durum', STS[st][0], 'shield', STS[st][1])}${kpi('Kalan gün', Math.max(0, daysLeft(m)), 'calendar', 'info')}${kpi('Bu ay giriş', ent.filter((e) => e.at.slice(0, 7) === today().slice(0, 7)).length, 'zap')}${kpi('Borç', money(totalDebt(m)), 'wallet', totalDebt(m) ? 'err' : 'ok')}</div>
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Üyelik</h3><button class="btn sm" data-x="renew">${icon('refresh')} Yenile / paket değiştir</button>${st === 'donduruldu' ? `<button class="btn sm" data-x="unfreeze">${icon('refresh')} Dondurmayı bitir</button>` : st === 'iptal' ? '' : `<button class="btn sm" data-x="freeze">${icon('lock')} Dondur</button>`}${st === 'iptal' ? '' : `<button class="btn sm danger" data-x="cancel">${icon('x')} Üyeliği iptal et</button>`}</div><div class="card-b">
          <div class="list-item"><span class="grow muted">Paket</span><b>${esc(plan(m.plan).name)}</b></div><div class="list-item"><span class="grow muted">Dönem</span><b>${NS.date(m.start)} – ${NS.date(m.end)}</b></div>
          ${m.sessionsLeft !== null && m.sessionsLeft !== undefined ? `<div class="list-item"><span class="grow muted">Kalan ders hakkı</span><b>${m.sessionsLeft}</b></div>` : ''}${m.freezeUntil >= today() ? `<div class="list-item"><span class="grow muted">Dondurma</span><b>${NS.date(m.freezeUntil)} tarihine kadar</b></div>` : ''}${(m.freezes || []).length || m.frozen ? `<div class="list-item"><span class="grow muted">Kullanılan dondurma</span><b>${m.frozen || 0} / ${S().maxFreeze} gün</b></div>${(m.freezes || []).map((f) => `<div class="small muted" style="padding:2px 0">${NS.date(f.from)} – ${NS.date(f.to)} · ${f.days} gün${f.reason ? ' · ' + esc(f.reason) : ''}${f.by ? ' · ' + esc(f.by) : ''}</div>`).join('')}` : ''}${m.canceled ? `<div class="list-item"><span class="grow muted">İptal</span><b>${NS.date(m.canceled.at)}${m.canceled.refund ? ' · iade ' + money(m.canceled.refund) : ''}</b></div><div class="small muted">${esc(m.canceled.reason || '')}</div>` : ''}
          <div class="progress mt"><i style="width:${NS.clamp((daysBetween(m.start, new Date()) / Math.max(1, daysBetween(m.start, m.end))) * 100, 0, 100)}%"></i></div></div></div>
        <div class="card"><div class="card-h"><h3>Taksitler</h3></div>${table({ rows: m.installments, columns: [{ label: 'Vade', render: (i) => NS.date(i.due) }, { label: 'Tutar', cls: 'right', render: (i) => money(i.amount) }, { label: 'Durum', render: (i) => (i.paid ? badge('Ödendi', 'ok') : i.due < today() ? badge('Gecikti', 'err') : badge('Bekliyor', 'warn')) }], actions: [{ label: 'Tahsil et', act: 'pay', show: (i) => !i.paid && !i.canceled }] })}</div>
        <div class="card"><div class="card-h"><h3>Vücut ölçümleri</h3><button class="btn sm" data-x="meas">${icon('plus')} Ölçüm ekle</button></div><div class="card-b">${ms.length > 1 ? chart.line([{ name: 'Kilo (kg)', values: ms.map((x) => x.weight) }, { name: 'Yağ %', values: ms.map((x) => x.fat) }, { name: 'Kas (kg)', values: ms.map((x) => x.muscle) }], ms.map((x) => NS.date(x.date).slice(0, 5)), { height: 180 }) : ''}
          ${table({ rows: ms.slice().reverse().map((x, i) => ({ ...x, id: i })), empty: 'Ölçüm yok', columns: [{ label: 'Tarih', render: (x) => NS.date(x.date) }, { label: 'Kilo', cls: 'right', render: (x) => num(x.weight) }, { label: 'Yağ %', cls: 'right', render: (x) => num(x.fat) }, { label: 'Kas', cls: 'right', render: (x) => num(x.muscle) }, { label: 'Bel', cls: 'right', render: (x) => num(x.waist) }] })}</div></div>
      </div><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Son girişler</h3></div><div class="card-b">${ent.slice(-12).reverse().map((e) => `<div class="list-item small"><span class="grow">${NS.dateLong(e.at)}</span><b>${NS.time(e.at)}</b></div>`).join('') || '<div class="faint small">Giriş yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Bilgiler</h3><button class="btn sm" data-x="edit">${icon('edit')}</button></div><div class="card-b small"><div class="list-item"><span class="grow muted">Acil durum</span>${esc(m.emergency || '-')}</div><div class="list-item"><span class="grow muted">Doğum</span>${NS.date(m.birth)}</div></div></div>
        <a class="btn" target="_blank" rel="noopener" href="https://wa.me/90${String(m.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${m.name}, ${S().bizName} üyeliğiniz ${NS.date(m.end)} tarihinde sona eriyor. Yenileme için bize ulaşabilirsiniz.`)}">${icon('message')} WhatsApp hatırlatma</a>
      </div></div>`;
    const re = () => app.refresh();
    $('#ptl', el).onclick = () => NS.portalShare(db, m, { title: 'Üye portalı', url: location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'uye.html', phone: m.phone, name: m.name, login: 'Telefon numaran', loginValue: m.phone });
    on(el, 'click', '[data-act=pay]', async (e, b) => {
      const i = m.installments.find((x) => x.id === b.dataset.id);
      const v = await formModal({ title: `Tahsilat — ${money(i.amount)}`, fields: [{ name: 'type', label: 'Ödeme', type: 'select', options: [{ value: 'kart', label: 'Kart' }, { value: 'nakit', label: 'Nakit' }, { value: 'havale', label: 'Havale' }] }] });
      if (!v) return; i.paid = true; db.insert('payments', { member: m.id, amount: i.amount, at: new Date().toISOString(), type: v.type, desc: `${plan(m.plan).name} taksit` }); toast('Tahsil edildi', 'ok'); re();
    });
    on(el, 'click', '[data-x]', async (e, b) => {
      const x = b.dataset.x;
      if (x === 'freeze') {
        // Sınır üyelik başına toplamdır (tek seferlik değil); aşım yetkili onayı ister. Her dondurma kayda geçer.
        const lim = Number(S().maxFreeze) || 30, usedF = m.frozen || 0; const v = await formModal({ title: 'Üyelik dondur', fields: [{ name: 'days', label: `Gün (kalan hak ${Math.max(0, lim - usedF)} / ${lim})`, type: 'number', value: Math.min(14, Math.max(1, lim - usedF)) }, { name: 'reason', label: 'Neden (sağlık, seyahat…)' }] });
        if (!v) return; const d = Math.max(1, Math.floor(Number(v.days) || 0)); if (usedF + d > lim && !(await NS.approve(NS.app, `${m.name} dondurma hakkı aşımı (${usedF + d}/${lim} gün)`))) return;
        const from = today(), to = iso(addDays(new Date(), d)); m.freezeUntil = to; m.end = iso(addDays(m.end, d)); m.frozen = usedF + d; (m.freezes = m.freezes || []).push({ from, to, days: d, reason: v.reason || '', by: (NS.currentUser || {}).name || '', at: new Date().toISOString() });
        db.log('Dondurma', `${m.name} · ${d} gün`); db.save(); toast(`Üyelik ${d} gün donduruldu, bitiş ${NS.date(m.end)}`, 'ok'); re();
      } else if (x === 'unfreeze') {
        // Erken dönüş: kullanılmayan dondurma günleri üyelik süresinden ve dondurma hakkından geri düşülür
        const left = Math.max(0, daysBetween(new Date(), m.freezeUntil)); const f = (m.freezes || []).slice(-1)[0]; if (f) { f.to = today(); f.days = Math.max(0, f.days - left); }
        m.end = iso(addDays(m.end, -left)); m.frozen = Math.max(0, (m.frozen || 0) - left); m.freezeUntil = null; db.log('Dondurma bitirildi', `${m.name} · ${left} gün geri alındı`); db.save(); toast(`Dondurma bitti, ${left} gün geri alındı`, 'ok'); re();
      } else if (x === 'cancel') {
        const c = cancelCalc(m);
        const v = await formModal({ title: `Üyelik iptali — ${m.name}`, size: 'wide', extra: `<div class="card pad mt small"><div class="row between"><span>Üyelik bedeli</span><b>${money(c.total)}</b></div><div class="row between"><span>Ödenen</span><b>${money(c.paid)}</b></div><div class="row between"><span>Kullanılan (${c.used} / ${c.days} gün, dondurma hariç)</span><b>${money(c.usedVal)}</b></div>${c.fee ? `<div class="row between"><span>İptal bedeli (ayar)</span><b>${money(c.fee)}</b></div>` : ''}${c.owe ? `<div class="row between" style="color:var(--err)"><span>Üyenin kalan borcu</span><b>${money(c.owe)}</b></div>` : ''}<p class="muted mt">Hesap öneridir; iade tutarını sözleşmenize göre değiştirebilirsiniz.</p></div>`, fields: [{ name: 'refund', label: 'İade tutarı (₺)', type: 'number', step: '0.01', value: c.refund }, { name: 'type', label: 'İade yöntemi', type: 'select', options: [{ value: 'kart', label: 'Kart' }, { value: 'nakit', label: 'Nakit' }, { value: 'havale', label: 'Havale' }] }, { name: 'reason', label: 'İptal nedeni', required: true, full: true }], submitLabel: 'İptal et' });
        if (!v || !(await NS.approve(NS.app, `${m.name} üyelik iptali`))) return; const refund = Math.max(0, Number(v.refund) || 0);
        m.installments.forEach((i) => { if (!i.paid) i.canceled = true; }); if (refund > 0) db.insert('payments', { member: m.id, amount: -refund, at: new Date().toISOString(), type: v.type, desc: `${plan(m.plan).name} üyelik iptali iadesi` });
        m.canceled = { at: today(), reason: v.reason, refund, by: (NS.currentUser || {}).name || '' }; m.end = today(); m.freezeUntil = null; db.log('Üyelik iptali', `${m.name} · iade ${money(refund)}`); db.save(); toast(refund ? `Üyelik iptal edildi, ${money(refund)} iade kaydedildi` : 'Üyelik iptal edildi', 'ok'); re();
      } else if (x === 'renew') {
        const v = await formModal({ title: 'Üyelik yenile', fields: [{ name: 'plan', label: 'Paket', type: 'select', options: db.all('plans').map((p) => ({ value: p.id, label: `${p.name} — ${money(p.price)}` })), value: m.plan }, { name: 'inst', label: 'Taksit', type: 'select', options: ['1', '2', '3', '4', '6'] }, { name: 'disc', label: 'İndirim', type: 'number', value: 0 }, { name: 'type', label: 'İlk ödeme', type: 'select', options: [{ value: 'kart', label: 'Kart' }, { value: 'nakit', label: 'Nakit' }] }] });
        if (!v) return; const p = plan(v.plan); const start = m.end > today() ? m.end : today(); const n = Number(v.inst) || 1; const tot = p.price - (v.disc || 0);
        const inst = Array.from({ length: n }, (_, k) => ({ id: NS.uid(), due: iso(addDays(new Date(), k * 30)), amount: Math.round(tot / n), paid: k === 0 }));
        Object.assign(m, { canceled: null, plan: p.id, start, end: iso(addDays(start, p.months * 30)), sessionsLeft: p.sessions || null, freezeUntil: null }); m.installments.push(...inst);
        db.insert('payments', { member: m.id, amount: inst[0].amount, at: new Date().toISOString(), type: v.type, desc: `${p.name} yenileme` }); db.log('Yenileme', `${m.name} · ${p.name}`); toast('Üyelik yenilendi', 'ok'); re();
      } else if (x === 'meas') {
        const last = m.measurements[m.measurements.length - 1] || {};
        const v = await formModal({ title: 'Ölçüm', fields: [{ name: 'weight', label: 'Kilo', type: 'number', step: '0.1', value: last.weight }, { name: 'fat', label: 'Yağ %', type: 'number', step: '0.1', value: last.fat }, { name: 'muscle', label: 'Kas (kg)', type: 'number', step: '0.1', value: last.muscle }, { name: 'waist', label: 'Bel (cm)', type: 'number', value: last.waist }] });
        if (v) { m.measurements.push({ ...v, date: today() }); db.save(); re(); }
      } else if (x === 'edit') { const v = await formModal({ title: 'Üye bilgileri', fields: MEM_FIELDS(), values: m }); if (v) { db.update('members', m.id, v); re(); } }
    });
  }

  // ---------- Ders programı ----------
  let weekOff = 0;
  function classesPage(el, p, app) {
    const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7) + weekOff * 7);
    const days = Array.from({ length: 7 }, (_, i) => iso(addDays(monday, i)));
    el.innerHTML = pageHead('Ders Programı', 'Grup derslerine tıklayarak katılımcı ekleyin', `<button class="btn icon" data-w="-1">${icon('left')}</button><button class="btn" data-w="0">Bu hafta</button><button class="btn icon" data-w="1">${icon('right')}</button>${app.can('admin') ? `<button class="btn primary" id="nc">${icon('plus')} Ders ekle</button>` : ''}`) +
      `<div class="week">${days.map((d) => { const dow = new Date(d + 'T12:00').getDay(); const cls = db.all('classes', (c) => c.day === dow).sort((a, b) => a.time.localeCompare(b.time)); return `<div class="wday"><h4 class="${d === today() ? 'td' : ''}">${NS.DAYS[dow]}<br><span class="small" style="font-weight:500">${NS.date(d).slice(0, 5)}</span></h4>${cls.map((c) => { const bk = db.all('bookings', (b) => b.cls === c.id && b.date === d).length; return `<div class="cls" style="background:${trainer(c.trainer).color}" data-c="${c.id}|${d}"><b>${esc(c.name)}</b>${c.time} · ${c.dur} dk<div>${esc(trainer(c.trainer).name)}</div><div style="margin-top:4px">${bk}/${c.capacity} ${bk >= c.capacity ? '· DOLU' : ''}</div></div>`; }).join('') || '<div class="faint small center">Ders yok</div>'}</div>`; }).join('')}</div>`;
    on(el, 'click', '[data-w]', (e, b) => { const n = Number(b.dataset.w); weekOff = n === 0 ? 0 : weekOff + n; app.refresh(); });
    if ($('#nc', el)) $('#nc', el).onclick = async () => { const v = await formModal({ title: 'Yeni ders', fields: [{ name: 'name', label: 'Ders adı', required: true }, { name: 'day', label: 'Gün', type: 'select', options: [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: d, label: NS.DAYS[d] })), num: true }, { name: 'time', label: 'Saat', type: 'time', value: '19:00' }, { name: 'dur', label: 'Süre (dk)', type: 'number', value: 50 }, { name: 'trainer', label: 'Eğitmen', type: 'select', options: db.all('trainers').map((t) => ({ value: t.id, label: t.name })) }, { name: 'capacity', label: 'Kontenjan', type: 'number', value: 12 }] }); if (v) { v.day = Number(v.day); db.insert('classes', v); app.refresh(); } };
    on(el, 'click', '[data-c]', (e, b) => {
      const [cid, d] = b.dataset.c.split('|'); const c = db.get('classes', cid);
      const draw = (body) => { const list = db.all('bookings', (x) => x.cls === cid && x.date === d); body.innerHTML = `<div class="row mb"><b class="grow">${list.length} / ${c.capacity} katılımcı</b>${badge(trainer(c.trainer).name, 'acc')}</div>${list.map((x) => `<div class="list-item"><div class="avatar">${esc(NS.initials(mem(x.member).name))}</div><span class="grow">${esc(mem(x.member).name)}</span><label class="check small"><input type="checkbox" data-att="${x.id}" ${x.attended ? 'checked' : ''}> Katıldı</label><button class="btn sm ghost icon" data-rm="${x.id}">${icon('x')}</button></div>`).join('') || '<div class="faint small">Henüz kayıt yok</div>'}
        ${list.length < c.capacity ? `<div class="row nw mt"><select class="input" id="am"><option value="">Üye ekle...</option>${db.all('members', (m) => ['aktif', 'bitiyor'].includes(status(m)) && !list.some((x) => x.member === m.id)).sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select><button class="btn primary" id="ab">Ekle</button></div>` : `<div class="mt">${badge('Kontenjan dolu', 'err')}</div>`}`;
        if ($('#ab', body)) $('#ab', body).onclick = () => { const mid = $('#am', body).value; if (!mid) return; const m = mem(mid); if (m.sessionsLeft === 0) return toast('Üyenin ders hakkı yok', 'err'); db.insert('bookings', { cls: cid, date: d, member: mid }); if (m.sessionsLeft) m.sessionsLeft--; db.save(); draw(body); };
      };
      modal({ title: `${c.name} · ${NS.date(d)} ${c.time}`, body: '<div id="bb"></div>', onOpen: (body) => { const bb = $('#bb', body); draw(bb); on(bb, 'click', '[data-rm]', (e2, x) => { const bk = db.get('bookings', x.dataset.rm); const m = mem(bk.member); if (m.sessionsLeft !== null && m.sessionsLeft !== undefined) m.sessionsLeft++; db.remove('bookings', bk.id); draw(bb); }); on(bb, 'change', '[data-att]', (e2, x) => { db.update('bookings', x.dataset.att, { attended: x.checked }); }); }, onClose: () => app.refresh(), actions: [...(app.can('admin') ? [{ label: 'Dersi sil', cls: 'danger', onClick: async (cl) => { cl(); if (await confirm('Ders programdan kaldırılsın mı?')) { db.remove('classes', cid); app.refresh(); } } }] : []), { label: 'Kapat', cls: 'primary' }] });
    });
  }

  // ---------- Özet / Tahsilat / Raporlar ----------
  function dashboard(el, p, app) {
    const ms = db.all('members');
    const ent = db.all('entries', (e) => iso(e.at) === today() && e.ok);
    const pay30 = db.all('payments', (x) => x.at > addDays(new Date(), -30).toISOString());
    const hours = Array.from({ length: 18 }, (_, i) => i + 6).map((h) => ({ label: String(h), value: db.all('entries', (e) => e.ok && new Date(e.at).getHours() === h && e.at > addDays(new Date(), -14).toISOString()).length / 14 }));
    const expiring = ms.filter((m) => status(m) === 'bitiyor').sort((a, b) => a.end.localeCompare(b.end));
    const late = ms.filter((m) => debt(m) > 0);
    el.innerHTML = pageHead('Salon Özeti', NS.dateLong(new Date()), `<a class="btn" href="uye.html" target="_blank" rel="noopener">${icon('globe')} Üye portalı</a><a class="btn" href="#/giris">${icon('qr')} Giriş kontrol</a><button class="btn primary" id="nm">${icon('plus')} Yeni üye</button>`) + `
      <div class="grid g4 mb">${kpi('Aktif üye', ms.filter((m) => ['aktif', 'bitiyor'].includes(status(m))).length, 'users', 'ok')}${kpi('Bugün giriş', ent.length, 'zap', 'info', `<div class="small faint">İçeride ~${insideNow()}</div>`)}${kpi('30 gün tahsilat', money(sum(pay30, (x) => x.amount)), 'wallet')}${kpi('Vadesi geçmiş', money(sum(late, debt)), 'alert', 'err', `<div class="small faint">${late.length} üye</div>`)}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Saatlik ortalama yoğunluk</h3></div><div class="card-b">${chart.bars(hours, { format: (v) => num(v) + ' kişi' })}</div></div>
      <div class="card"><div class="card-h"><h3>Paket dağılımı</h3></div><div class="card-b">${chart.donut(db.all('plans').map((p2) => ({ label: p2.name, value: ms.filter((m) => m.plan === p2.id && status(m) !== 'bitti').length, color: p2.color })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('clock')} 7 gün içinde bitecek (${expiring.length})</h3></div>${table({ rows: expiring, empty: 'Yok', columns: [{ label: 'Üye', render: (m) => `<a href="#/uye/${m.id}"><b>${esc(m.name)}</b></a>` }, { label: 'Bitiş', render: (m) => NS.date(m.end) }, { label: 'Kalan', render: (m) => badge(daysLeft(m) + ' gün', 'warn') }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('wallet')} Vadesi geçmiş borçlar</h3></div>${table({ rows: late, empty: 'Gecikmiş borç yok', columns: [{ label: 'Üye', render: (m) => `<a href="#/uye/${m.id}"><b>${esc(m.name)}</b></a>` }, { label: 'Telefon', render: (m) => esc(m.phone) }, { label: 'Borç', cls: 'right', render: (m) => `<b style="color:var(--err)">${money(debt(m))}</b>` }] })}</div></div>`;
    $('#nm', el).onclick = () => newMember(app);
  }
  function paymentsPage(el, p, app) {
    let days = 30;
    const draw = () => {
      const list = db.all('payments', (x) => x.at > addDays(new Date(), -days).toISOString()).sort((a, b) => b.at.localeCompare(a.at));
      const ser = NS.dailySeries(list, Math.min(days, 31), 'at', (x) => x.amount);
      el.innerHTML = pageHead('Tahsilatlar', 'Üyelik, taksit ve ürün satışları', `<div class="seg">${[7, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'active' : ''}">${d} gün</button>`).join('')}</div><button class="btn primary" id="sale">${icon('cart')} Ürün / PT satışı</button>`) + `
        <div class="grid g4 mb">${kpi('Toplam', money(sum(list, (x) => x.amount)), 'wallet', 'ok')}${kpi('Kart', money(sum(list.filter((x) => x.type === 'kart'), (x) => x.amount)), 'card', 'info')}${kpi('Nakit', money(sum(list.filter((x) => x.type === 'nakit'), (x) => x.amount)), 'cash')}${kpi('İşlem', list.length, 'receipt', 'warn')}</div>
        <div class="card mb"><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: Math.ceil(ser.labels.length / 10) })}</div></div>
        <div class="card">${table({ rows: list, columns: [{ label: 'Tarih', render: (x) => NS.dt(x.at) }, { label: 'Üye', render: (x) => esc(x.member ? mem(x.member).name : 'Misafir') }, { label: 'Açıklama', key: 'desc' }, { label: 'Ödeme', render: (x) => badge(x.type, x.type === 'kart' ? 'info' : 'ok') }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b>` }] })}</div>`;
      $('#sale', el).onclick = async () => { const v = await formModal({ title: 'Satış', fields: [{ name: 'pr', label: 'Ürün / hizmet', type: 'select', options: db.all('products').map((x) => ({ value: x.id, label: `${x.name} — ${money(x.price)}` })) }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }, { name: 'member', label: 'Üye', type: 'select', empty: 'Misafir', options: db.all('members').map((m) => ({ value: m.id, label: m.name })) }, { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit'] }] }); if (v) { const pr = db.get('products', v.pr); pr.stock -= v.qty; db.insert('payments', { member: v.member || null, amount: pr.price * v.qty, at: new Date().toISOString(), type: v.type, desc: `${pr.name} ×${v.qty}` }); toast('Satış kaydedildi', 'ok'); draw(); } };
    };
    on(el, 'click', '[data-d]', (e, b) => { days = Number(b.dataset.d); draw(); });
    draw();
  }
  function reportsPage(el) {
    const ms = db.all('members');
    const lastIn = new Map(); db.all('entries', (e) => e.ok).forEach((e) => { if (!lastIn.has(e.member) || e.at > lastIn.get(e.member)) lastIn.set(e.member, e.at); });
    const idle = ms.filter((m) => ['aktif', 'bitiyor'].includes(status(m))).map((m) => ({ id: m.id, m, last: lastIn.get(m.id) || m.start })).filter((x) => daysBetween(x.last, new Date()) >= 14).sort((a, b) => a.last.localeCompare(b.last));
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
    const rev = months.map((mo) => sum(db.all('payments', (x) => x.at.slice(0, 7) === mo), (x) => x.amount));
    const newM = months.map((mo) => ms.filter((m) => m.start.slice(0, 7) === mo).length);
    const dow = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: NS.DAYS[d].slice(0, 3), value: db.all('entries', (e) => e.ok && new Date(e.at).getDay() === d).length }));
    const tr = db.all('trainers').map((t) => ({ t, n: db.all('bookings', (b) => (db.get('classes', b.cls) || {}).trainer === t.id).length, c: db.all('classes', (c) => c.trainer === t.id).length }));
    const renewRate = ms.length ? Math.round((ms.filter((m) => m.installments.length > 1 || m.end > today()).length / ms.length) * 100) : 0;
    el.innerHTML = pageHead('Raporlar', 'Gelir, üye kazanımı, yoğunluk ve eğitmen performansı') + `
      <div class="grid g4 mb">${kpi('Toplam üye', ms.length, 'users')}${kpi('Aktif oran', '%' + Math.round((ms.filter((m) => status(m) !== 'bitti').length / ms.length) * 100), 'percent', 'ok')}${kpi('Devam oranı', '%' + renewRate, 'refresh', 'info')}${kpi('Ort. aylık gelir', money(sum(rev) / 6), 'wallet', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Aylık gelir</h3></div><div class="card-b">${chart.bars(months.map((mo, i) => ({ label: NS.MONTHS[Number(mo.slice(5)) - 1].slice(0, 3), value: rev[i] })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Yeni üye kazanımı</h3></div><div class="card-b">${chart.line([{ name: 'Yeni üye', values: newM }], months.map((mo) => NS.MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)))}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Günlere göre giriş</h3></div><div class="card-b">${chart.bars(dow)}</div></div>
      <div class="card mb"><div class="card-h"><h3>Kayıp riski: 14+ gündür gelmeyen aktif üyeler (${idle.length})</h3>${idle.length ? `<button class="btn sm" id="idl">${icon('message')} Hepsine SMS</button>` : ''}</div>${table({ rows: idle.slice(0, 50), empty: 'Risk altında üye yok', columns: [{ label: 'Üye', render: (x) => `<a href="#/uye/${x.m.id}"><b>${esc(x.m.name)}</b></a><div class="small faint">${esc(x.m.phone)}</div>` }, { label: 'Son giriş', render: (x) => NS.date(x.last) }, { label: 'Gün', cls: 'right', render: (x) => daysBetween(x.last, new Date()) }, { label: 'Paket', render: (x) => esc(plan(x.m.plan).name) }] })}</div>
      <div class="card"><div class="card-h"><h3>Eğitmenler</h3></div>${table({ rows: tr.map((x) => ({ ...x, id: x.t.id })), columns: [{ label: 'Eğitmen', render: (x) => `<b style="color:${x.t.color}">${esc(x.t.name)}</b><div class="small faint">${esc(x.t.branch)}</div>` }, { label: 'Haftalık ders', cls: 'right', render: (x) => x.c }, { label: 'Toplam katılım', cls: 'right', render: (x) => x.n }] })}</div></div>`;
    if ($('#idl', el)) $('#idl', el).onclick = async () => { if (!(await confirm(`${idle.length} üyeye “sizi özledik” SMS'i gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return; NS.smsBatch(db, idle.map((x) => ({ to: x.m.phone, name: x.m.name, text: `Merhaba ${x.m.name.split(' ')[0]}, sizi bir süredir salonda göremedik. Programınızı birlikte güncelleyelim. ${S().bizName || ''}`, kind: 'geri-kazanma' })), 'geri kazanma mesajı'); };
  }

  const ROLES = { admin: 'Yönetici', danisma: 'Danışma', egitmen: 'Eğitmen' };
  NS.shell({
    id: 'spor', integrations: ['sms', 'whatsapp', 'email', 'pos', 'payment', 'barcode', 'printer', 'efatura', 'webhook', 'backup'], name: 'Spor Salonu', tagline: 'Üyelik & Giriş Kontrol', icon: 'dumbbell', accent: '#16a34a', db, home: 'ozet', auth: { roles: ROLES }, titles: { uye: 'Üye kartı' },
    nav: [{ sec: 'Salon' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'giris', label: 'Giriş Kontrol', icon: 'qr' }, { id: 'uyeler', label: 'Üyeler', icon: 'users' }, { id: 'dersler', label: 'Ders Programı', icon: 'calendar' }, { id: 'tahsilat', label: 'Tahsilat & Satış', icon: 'wallet', roles: ['danisma'] }, { sec: 'Yönetim' }, { id: 'paketler', label: 'Paketler', icon: 'gift', roles: ['admin'] }, { id: 'egitmenler', label: 'Eğitmenler', icon: 'user', roles: ['admin'] }, { id: 'urunler', label: 'Ürünler', icon: 'box', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, giris: gatePage, uyeler: membersPage, uye: memberPage, dersler: classesPage, tahsilat: paymentsPage, raporlar: reportsPage,
      paketler: (el, p, a) => NS.crud(el, a, { col: 'plans', title: 'Üyelik Paketleri', single: 'Paket', addLabel: 'Yeni paket', emptyIcon: 'gift', fields: [{ name: 'name', label: 'Paket adı', required: true }, { name: 'months', label: 'Süre (ay)', type: 'number', required: true }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'sessions', label: 'Ders hakkı (boş = sınırsız)', type: 'number' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Paket', render: (x) => `<div class="row nw"><span class="dot" style="background:${x.color};width:12px;height:12px"></span><b>${esc(x.name)}</b></div>` }, { key: 'months', label: 'Süre', render: (x) => x.months + ' ay' }, { key: 'sessions', label: 'Ders', render: (x) => x.sessions || 'Sınırsız' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (x) => `<b>${money(x.price)}</b>` }, { label: 'Aylık', cls: 'right', render: (x) => money(x.price / x.months) }, { label: 'Üye', cls: 'right', render: (x) => db.all('members', (m) => m.plan === x.id && status(m) !== 'bitti').length }] }),
      egitmenler: (el, p, a) => NS.crud(el, a, { col: 'trainers', title: 'Eğitmenler', single: 'Eğitmen', addLabel: 'Yeni eğitmen', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'branch', label: 'Branş' }, { name: 'phone', label: 'Telefon' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Eğitmen', render: (x) => `<b style="color:${x.color}">${esc(x.name)}</b>` }, { key: 'branch', label: 'Branş' }, { label: 'Ders', cls: 'right', render: (x) => db.all('classes', (c) => c.trainer === x.id).length }] }),
      urunler: (el, p, a) => NS.crud(el, a, { col: 'products', title: 'Ürünler & Hizmetler', single: 'Ürün', addLabel: 'Yeni ürün', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'price', label: 'Fiyat', type: 'number', required: true }, { name: 'stock', label: 'Stok', type: 'number' }], columns: [{ key: 'name', label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b>` }, { key: 'price', label: 'Fiyat', cls: 'right', render: (x) => money(x.price) }, { key: 'stock', label: 'Stok', cls: 'right' }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Salon ayarları' }, { name: 'maxFreeze', label: 'Üyelik başına toplam dondurma hakkı (gün)', type: 'number' }, { name: 'cancelFee', label: 'Üyelik iptal bedeli (₺, yoksa boş)', type: 'number' }] }),
    },
  });
})();
