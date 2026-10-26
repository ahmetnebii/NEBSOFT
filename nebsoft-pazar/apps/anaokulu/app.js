/* NEBSOFT Anaokulu & Kreş — giriş/çıkış yoklaması (teslim alan kişiyle), günlük rapor (yemek, uyku, ruh hali),
   duyurular, yemek menüsü, aidat ve kardeş indirimi, servis listeleri, veli mesajları ve veli portalı */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const A = window.ANK;
  const db = new NS.DB('anaokulu', A.seed);
  const S = () => db.settings({});
  const cls = (id) => db.get('classes', id) || { name: '-', color: '#999' };
  const stu = (id) => db.get('students', id) || { name: '-', parents: [{}] };
  const att = (s, d = today()) => db.data.att[`${s.id}|${d}`];
  const rep = (s, d = today()) => db.data.reports[`${s.id}|${d}`];
  const myCls = () => (NS.currentUser && NS.currentUser.role === 'ogretmen' ? NS.currentUser.cls : null);
  const ini = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const av = (s) => `<span style="width:34px;height:34px;border-radius:50%;background:${cls(s.cls).color};color:#fff;display:inline-grid;place-items:center;font-weight:800;font-size:13px;flex:none">${esc(ini(s.name))}</span>`;
  const now = () => new Date().toTimeString().slice(0, 5);
  const balance = (s) => sum(db.all('fees', (f) => f.student === s.id), (f) => f.amount) - sum(db.all('payments', (p) => p.student === s.id), (p) => p.amount);
  const clsPick = (sel, cur) => `<div class="seg" id="cp">${db.all('classes').filter((c) => !myCls() || c.id === myCls()).map((c) => `<button data-c="${c.id}" class="${c.id === cur ? 'active' : ''}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.color};margin-right:6px"></span>${esc(c.name)}</button>`).join('')}</div>`;

  // ---------- Yoklama: giriş / çıkış ----------
  function attendancePage(el, p, app) {
    let c = myCls() || p || 's1';
    el.innerHTML = pageHead('Giriş & Çıkış', `${NS.dateLong(new Date())} — çocuğu teslim alan kişi kayıt altına alınır`) + `<div class="card pad mb">${clsPick('cp', c)}</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px" id="g"></div>`;
    const draw = () => {
      $('#g', el).innerHTML = db.all('students', (s) => s.cls === c).map((s) => { const a = att(s); const st = !a ? 'bekleniyor' : a.st === 'yok' ? 'yok' : a.out ? 'cikti' : 'okulda'; return `<div class="card pad"><div class="row">${av(s)}<div class="grow"><b>${esc(s.name)}</b><div class="small faint">${A.age(s.birth)}${s.allergy ? ' · ' + badge(s.allergy, 'err') : ''}</div></div></div>
        <div class="small mt">${st === 'okulda' ? `${badge('Okulda', 'ok')} geliş ${esc(a.in)}` : st === 'cikti' ? `${badge('Çıktı', '')} ${esc(a.out)} · ${esc(a.by || '')}` : st === 'yok' ? badge('Gelmedi · ' + (a.note || ''), 'err') : badge('Bekleniyor', 'warn')}</div>
        <div class="row mt" style="gap:6px">${st === 'bekleniyor' ? `<button class="btn sm primary" data-in="${s.id}">${icon('check')} Geldi</button><button class="btn sm" data-no="${s.id}">Gelmedi</button>` : st === 'okulda' ? `<button class="btn sm primary" data-out="${s.id}">${icon('logout')} Teslim et</button>` : `<button class="btn sm ghost" data-undo="${s.id}">Geri al</button>`}</div></div>`; }).join('');
    };
    const key = (id) => `${id}|${today()}`;
    on(el, 'click', '[data-c]', (e, b) => { c = b.dataset.c; $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-in]', (e, b) => { db.data.att[key(b.dataset.in)] = { st: 'var', in: now(), out: '', by: '' }; db.save(); draw(); });
    on(el, 'click', '[data-no]', async (e, b) => { const n = await NS.prompt('Neden gelmedi?', 'Hasta'); if (n === null) return; db.data.att[key(b.dataset.no)] = { st: 'yok', note: n }; db.save(); draw(); });
    on(el, 'click', '[data-undo]', (e, b) => { delete db.data.att[key(b.dataset.undo)]; db.save(); draw(); });
    on(el, 'click', '[data-out]', async (e, b) => {
      const s = stu(b.dataset.out); const allowed = [...s.parents, ...(s.pickup || [])];
      const v = await formModal({ title: `${s.name} — teslim`, fields: [{ name: 'by', label: 'Teslim alan', type: 'select', options: [...allowed.map((x) => ({ value: x.name, label: `${x.name} (${x.rel})` })), { value: 'servis', label: 'Servis' }, { value: '__', label: 'Listede olmayan kişi' }] }, { name: 'other', label: 'Listede olmayan kişinin adı ve TC (veliyi arayıp teyit edin)', full: true }, { name: 'notify', label: 'Veliye "teslim edildi" bildirimi gönder', type: 'checkbox' }], values: { notify: true } });
      if (!v) return; if (v.by === '__' && !v.other) return toast('Teslim alan kişiyi yazın', 'err');
      const by = v.by === '__' ? `${v.other} (yetkisiz — veli teyitli)` : v.by === 'servis' ? 'Servis' : v.by;
      db.data.att[key(s.id)] = { ...att(s), out: now(), by };
      if (v.notify) NS.smsLog(db, { to: s.parents[0].phone, name: s.parents[0].name, text: `${S().bizName}: ${s.name.split(' ')[0]} saat ${now()}'de ${by} tarafından teslim alındı.` }, true);
      db.save(); draw(); toast('Teslim kaydedildi', 'ok');
    });
    draw();
  }

  // ---------- Günlük rapor ----------
  function reportPage(el, p, app) {
    let c = myCls() || p || 's1';
    el.innerHTML = pageHead('Günlük Rapor', 'Tek dokunuşla doldurun — veliler portalda anında görür', `<button class="btn primary" id="pub">${icon('send')} Velilere bildir</button>`) + `<div class="card pad mb">${clsPick('cp', c)}</div><div class="col" style="gap:10px" id="l"></div>`;
    const seg = (sid, k, opts, cur) => `<div class="seg" style="flex-wrap:wrap">${Object.entries(opts).map(([v, l]) => `<button data-r="${sid}" data-k="${k}" data-v="${v}" class="${cur === v ? 'active' : ''}">${Array.isArray(l) ? l[0] : l}</button>`).join('')}</div>`;
    const draw = () => {
      const cc = cls(c);
      $('#l', el).innerHTML = db.all('students', (s) => s.cls === c && (att(s) || {}).st !== 'yok').map((s) => { const r = rep(s) || {}; return `<div class="card pad"><div class="row mb">${av(s)}<b class="grow">${esc(s.name)}</b>${s.allergy ? badge(s.allergy, 'err') : ''}${r.sent ? badge('Gönderildi', 'ok') : ''}</div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px">${Object.entries(A.MEALS).map(([k, l]) => `<div><div class="small muted mb">${l}</div>${seg(s.id, k, { hepsi: 'Hepsi', yarisi: 'Yarısı', az: 'Az', yemedi: 'Yemedi' }, r[k])}</div>`).join('')}<div><div class="small muted mb">Ruh hali</div>${seg(s.id, 'mood', Object.fromEntries(Object.entries(A.MOOD).map(([k, v]) => [k, v[0]])), r.mood)}</div>${cc.nap ? `<div><div class="small muted mb">Uyku</div><input class="input" data-t="${s.id}" data-k="sleep" value="${esc(r.sleep || '')}" placeholder="13:00–14:30"></div>` : ''}</div>
        <div class="row mt" style="gap:8px"><input class="input grow" data-t="${s.id}" data-k="note" value="${esc(r.note || '')}" placeholder="Öğretmen notu (bugün neler yaptı?)"><label class="btn sm" title="Fotoğraf ekle">${icon('upload')} ${r.photos ? r.photos + ' foto' : 'Foto'}<input type="file" accept="image/*" multiple hidden data-ph="${s.id}"></label></div></div>`; }).join('') || '<div class="card pad muted">Bugün sınıfta öğrenci yok.</div>';
    };
    const R = (id) => (db.data.reports[`${id}|${today()}`] = db.data.reports[`${id}|${today()}`] || { by: (NS.currentUser || {}).name });
    on(el, 'click', '[data-c]', (e, b) => { c = b.dataset.c; $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-r]', (e, b) => { R(b.dataset.r)[b.dataset.k] = b.dataset.v; db.save(); $$(`[data-r="${b.dataset.r}"][data-k="${b.dataset.k}"]`, el).forEach((x) => x.classList.toggle('active', x === b)); });
    on(el, 'change', '[data-t]', (e, b) => { R(b.dataset.t)[b.dataset.k] = b.value; db.save(); });
    on(el, 'change', '[data-ph]', (e, b) => { R(b.dataset.ph).photos = (R(b.dataset.ph).photos || 0) + b.files.length; db.save(); draw(); toast('Fotoğraflar eklendi', 'ok'); });
    $('#pub', el).onclick = () => { const L = db.all('students', (s) => s.cls === c && rep(s) && !rep(s).sent); L.forEach((s) => { rep(s).sent = true; NS.smsLog(db, { to: s.parents[0].phone, name: s.parents[0].name, text: `${S().bizName}: ${s.name.split(' ')[0]}'in günlük raporu hazır. Veli portalından bakabilirsiniz.` }, true); }); db.save(); draw(); toast(`${L.length} veliye bildirim gönderildi`, 'ok'); };
    draw();
  }

  // ---------- Öğrenciler ----------
  function studentsPage(el, p, app) {
    NS.crud(el, app, { col: 'students', title: 'Öğrenciler', sub: 'Veli, alerji/sağlık ve teslim yetkilisi bilgileri', single: 'Öğrenci', addLabel: 'Yeni kayıt', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'birth', label: 'Doğum tarihi', type: 'date', required: true }, { name: 'cls', label: 'Sınıf', type: 'select', options: db.all('classes').map((c) => ({ value: c.id, label: `${c.name} (${c.age})` })) }, { name: 'gender', label: 'Cinsiyet', type: 'select', options: ['Kız', 'Erkek'] }, { type: 'section', label: 'Veliler' }, { name: 'p1n', label: '1. veli ad soyad', required: true }, { name: 'p1r', label: 'Yakınlık', type: 'select', options: ['Anne', 'Baba', 'Vasi'] }, { name: 'p1p', label: '1. veli telefon', type: 'tel', required: true }, { name: 'p2n', label: '2. veli ad soyad' }, { name: 'p2r', label: 'Yakınlık', type: 'select', options: ['Baba', 'Anne', 'Vasi'] }, { name: 'p2p', label: '2. veli telefon', type: 'tel' }, { name: 'pk', label: 'Teslim alabilecek diğer kişiler (Ad - yakınlık - telefon; satır satır)', type: 'textarea', full: true }, { type: 'section', label: 'Sağlık' }, { name: 'allergy', label: 'Alerji', full: true }, { name: 'health', label: 'Kronik hastalık / ilaç', full: true }, { type: 'section', label: 'Ücret' }, { name: 'fee', label: 'Aylık ücret', type: 'number' }, { name: 'disc', label: 'İndirim %', type: 'number' }, { name: 'service', label: 'Servis', type: 'select', empty: 'Servis yok', options: db.all('routes').map((r) => ({ value: r.id, label: r.name })) }],
      defaults: () => ({ fee: S().fee, cls: 's1', p1r: 'Anne', p2r: 'Baba' }),
      toForm: (s) => ({ ...s, p1n: s.parents[0] && s.parents[0].name, p1r: s.parents[0] && s.parents[0].rel, p1p: s.parents[0] && s.parents[0].phone, p2n: s.parents[1] && s.parents[1].name, p2r: s.parents[1] && s.parents[1].rel, p2p: s.parents[1] && s.parents[1].phone, pk: (s.pickup || []).map((x) => `${x.name} - ${x.rel} - ${x.phone}`).join('\n') }),
      beforeSave: (v) => { v.parents = [{ name: v.p1n, rel: v.p1r, phone: v.p1p }, ...(v.p2n ? [{ name: v.p2n, rel: v.p2r, phone: v.p2p }] : [])]; v.pickup = String(v.pk || '').split('\n').map((l) => l.split('-').map((x) => x.trim())).filter((x) => x[0]).map(([name, rel, phone]) => ({ name, rel: rel || '', phone: phone || '' })); ['p1n', 'p1r', 'p1p', 'p2n', 'p2r', 'p2p', 'pk'].forEach((k) => delete v[k]); v.fee = Number(v.fee) || 0; v.disc = Number(v.disc) || 0; if (!v.start) v.start = today(); },
      searchFields: (s) => [s.name, ...s.parents.map((x) => x.name + ' ' + x.phone)],
      filters: [{ value: 'all', label: 'Tümü' }, ...db.all('classes').map((c) => ({ value: c.id, label: c.name, test: (s) => s.cls === c.id })), { value: 'alerji', label: 'Alerjisi olan', test: (s) => s.allergy || s.health }],
      columns: [{ key: 'name', label: 'Öğrenci', render: (s) => `<div class="row">${av(s)}<div><b>${esc(s.name)}</b><div class="small faint">${A.age(s.birth)} · ${esc(cls(s.cls).name)}</div></div></div>` }, { label: 'Veli', render: (s) => `${esc(s.parents[0].name)}<div class="small faint">${esc(s.parents[0].phone)}</div>` }, { label: 'Sağlık', render: (s) => [s.allergy && badge(s.allergy, 'err'), s.health && badge(s.health, 'warn')].filter(Boolean).join(' ') || '<span class="faint">—</span>' }, { label: 'Servis', render: (s) => (s.service ? badge((db.get('routes', s.service) || {}).name.split(' —')[0], 'info') : '') }, { label: 'Bakiye', cls: 'right', render: (s) => { const b = balance(s); return b > 0 ? `<b style="color:var(--err)">${money(b)}</b>` : badge('Güncel', 'ok'); } }, { label: 'Portal kodu', render: (s) => `<span class="mono small">${esc(A.code(s))}</span>` }],
      extraActions: [{ icon: 'globe', act: 'portal', title: 'Veli portalı bilgisini gönder' }], onAction: (a, s) => { NS.smsLog(db, { to: s.parents[0].phone, name: s.parents[0].name, text: `${S().bizName} veli portalı: ${location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '')}veli.html — telefonunuz + kod ${A.code(s)}` }, true); toast('Gönderildi', 'ok'); } });
  }

  // ---------- Duyurular, menü, servis ----------
  function postsPage(el, p, app) {
    NS.crud(el, app, { col: 'posts', title: 'Duyurular & Etkinlikler', sub: 'Veli portalında ve bildirimle yayınlanır', single: 'Duyuru', addLabel: 'Yeni duyuru', emptyIcon: 'bell',
      fields: [{ name: 'title', label: 'Başlık', required: true, full: true }, { name: 'body', label: 'Metin', type: 'textarea', required: true, full: true }, { name: 'cls', label: 'Kime', type: 'select', empty: 'Tüm okul', options: db.all('classes').map((c) => ({ value: c.id, label: c.name + ' sınıfı' })) }, { name: 'notify', label: 'Velilere SMS ile bildir', type: 'checkbox' }],
      beforeSave: (v, rec) => { if (!rec) v.at = new Date().toISOString(); if (v.notify) { db.all('students', (s) => !v.cls || s.cls === v.cls).forEach((s) => NS.smsLog(db, { to: s.parents[0].phone, name: s.parents[0].name, text: `${S().bizName}: ${v.title}` }, true)); } delete v.notify; },
      sort: (a, b) => b.at.localeCompare(a.at),
      columns: [{ key: 'title', label: 'Duyuru', render: (x) => `<b>${esc(x.title)}</b><div class="small faint">${esc(x.body.slice(0, 120))}</div>` }, { label: 'Kime', render: (x) => (x.cls ? badge(cls(x.cls).name, 'info') : badge('Tüm okul', 'acc')) }, { key: 'at', label: 'Tarih', render: (x) => NS.dt(x.at) }] });
  }
  function menuPage(el, p, app) {
    NS.crud(el, app, { col: 'menu', title: 'Yemek Menüsü', sub: 'Bu haftanın menüsü — alerjisi olan çocuklar için mutfak uyarısı', single: 'Gün', canAdd: false, emptyIcon: 'coffee',
      fields: [{ name: 'day', label: 'Gün', required: true }, { name: 'kahvalti', label: 'Kahvaltı', full: true }, { name: 'ogle', label: 'Öğle', full: true }, { name: 'ikindi', label: 'İkindi', full: true }], sort: () => 0,
      columns: [{ key: 'day', label: 'Gün', render: (m) => `<b>${esc(m.day)}</b>` }, { key: 'kahvalti', label: 'Kahvaltı' }, { key: 'ogle', label: 'Öğle' }, { key: 'ikindi', label: 'İkindi' }] });
    const al = db.all('students', (s) => s.allergy); if (al.length) el.insertAdjacentHTML('beforeend', `<div class="card pad mt"><b>${icon('alert')} Mutfak için alerji listesi</b><div class="small mt">${al.map((s) => `${esc(s.name)} (${esc(cls(s.cls).name)}): <b>${esc(s.allergy)}</b>`).join(' · ')}</div></div>`);
  }
  function servicePage(el, p, app) {
    el.innerHTML = pageHead('Servis', 'Rota listeleri — sabah biniş / akşam iniş') + `<div class="grid g2">${db.all('routes').map((r) => { const L = db.all('students', (s) => s.service === r.id); return `<div class="card"><div class="card-h"><div class="grow"><b>${esc(r.name)}</b><div class="small faint">${esc(r.driver)} · hostes ${esc(r.hostess)} · ${esc(r.plate)}</div></div><button class="btn sm" data-pr="${r.id}">${icon('print')}</button></div>${table({ rows: L, columns: [{ label: 'Öğrenci', render: (s) => `<b>${esc(s.name)}</b><div class="small faint">${esc(cls(s.cls).name)}</div>` }, { label: 'Veli', render: (s) => `<span class="small">${esc(s.parents[0].name)} · ${esc(s.parents[0].phone)}</span>` }, { label: 'Bugün', render: (s) => { const a = att(s); return !a ? badge('Bekleniyor', 'warn') : a.st === 'yok' ? badge('Gelmedi', 'err') : badge('Bindi', 'ok'); } }] })}</div>`; }).join('')}</div>`;
    on(el, 'click', '[data-pr]', (e, b) => { const r = db.get('routes', b.dataset.pr); const L = db.all('students', (s) => s.service === r.id); NS.printHtml(`<div class="doc"><h2>${esc(r.name)}</h2><div>${NS.dateLong(new Date())} · ${esc(r.driver)} · ${esc(r.plate)}</div><table><tr><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Telefon</th><th>Sabah</th><th>Akşam</th></tr>${L.map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(cls(s.cls).name)}</td><td>${esc(s.parents[0].name)}</td><td>${esc(s.parents[0].phone)}</td><td>☐</td><td>☐</td></tr>`).join('')}</table></div>`, { title: 'Servis' }); });
  }

  // ---------- Aidat ----------
  function feesPage(el, p, app) {
    const per = today().slice(0, 7);
    el.innerHTML = pageHead('Aidat & Tahsilat', `Aylık ücretler · kardeş indirimi %${S().siblingDisc}`, `<button class="btn primary" id="acc">${icon('receipt')} Bu ayın aidatını oluştur</button>`) + `<div class="grid g4 mb" id="k"></div><div class="card" id="t"></div>`;
    const draw = () => {
      const St = db.all('students'); const debt = St.filter((s) => balance(s) > 0);
      $('#k', el).innerHTML = `${kpi('Aylık beklenen', money(sum(St, (s) => s.fee * (1 - (s.disc || 0) / 100))), 'wallet')}${kpi('Bu ay tahsil', money(sum(db.all('payments', (x) => x.at.slice(0, 7) === per), (x) => x.amount)), 'cash', 'ok')}${kpi('Gecikmiş alacak', money(sum(debt, balance)), 'alert', debt.length ? 'err' : 'ok')}${kpi('Borçlu veli', debt.length, 'users', 'warn')}`;
      $('#t', el).innerHTML = table({ rows: St.map((s) => ({ id: s.id, s, b: balance(s) })).sort((a, b) => b.b - a.b), columns: [{ label: 'Öğrenci', render: (r) => `<b>${esc(r.s.name)}</b><div class="small faint">${esc(cls(r.s.cls).name)} · ${esc(r.s.parents[0].name)}</div>` }, { label: 'Aylık', cls: 'right', render: (r) => `${money(r.s.fee * (1 - (r.s.disc || 0) / 100))}${r.s.disc ? `<div class="small faint">%${r.s.disc} indirim</div>` : ''}` }, { label: 'Bakiye', cls: 'right', render: (r) => (r.b > 0 ? `<b style="color:var(--err)">${money(r.b)}</b>` : badge('Güncel', 'ok')) }], actions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat' }, { icon: 'message', act: 'rem', title: 'Hatırlat', show: (r) => r.b > 0 }] });
    };
    on(el, 'click', '[data-act=pay]', async (e, b) => { const s = stu(b.dataset.id); const v = await formModal({ title: `Tahsilat — ${s.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Havale', 'Kredi kartı', 'Nakit'] }], values: { amount: Math.max(0, balance(s)) } }); if (!v) return; db.insert('payments', { student: s.id, amount: Number(v.amount), method: v.method, at: today() }); draw(); toast('Tahsilat kaydedildi', 'ok'); });
    on(el, 'click', '[data-act=rem]', (e, b) => { const s = stu(b.dataset.id); NS.smsLog(db, { to: s.parents[0].phone, name: s.parents[0].name, text: `${S().bizName}: ${s.name.split(' ')[0]} için ${money(balance(s))} ödenmemiş aidat bulunuyor. IBAN: ${S().iban}` }, true); toast('Hatırlatma gönderildi', 'ok'); });
    $('#acc', el).onclick = async () => { const L = db.all('students', (s) => !db.find('fees', (f) => f.student === s.id && f.period === per)); if (!L.length) return toast('Bu ayın aidatları zaten oluşturuldu', 'ok'); if (!(await confirm(`${L.length} öğrenci için aidat oluşturulsun mu?`, { danger: false }))) return; L.forEach((s) => db.insert('fees', { student: s.id, period: per, amount: Math.round(s.fee * (1 - (s.disc || 0) / 100)) }, true)); db.save(); draw(); toast('Aidatlar oluşturuldu', 'ok'); };
    draw();
  }

  // ---------- Mesajlar ----------
  function messagesPage(el, p, app) {
    el.innerHTML = pageHead('Veli Mesajları', 'İzin bildirimleri, erken alma ve sorular') + `<div class="card" id="t"></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('messages', (m) => !myCls() || stu(m.student).cls === myCls()).sort((a, b) => b.at.localeCompare(a.at)), empty: 'Mesaj yok', emptyIcon: 'message', columns: [{ label: 'Öğrenci', render: (m) => `<b>${esc(stu(m.student).name)}</b><div class="small faint">${NS.dt(m.at)}</div>` }, { label: 'Tür', render: (m) => (m.from === 'okul' ? badge('Okul', 'acc') : badge(m.type === 'izin' ? 'İzin' : m.type === 'alma' ? 'Erken alma' : 'Mesaj', m.type === 'izin' ? 'warn' : 'info')) }, { label: 'Mesaj', render: (m) => esc(m.text) }], actions: [{ icon: 'send', act: 'r', title: 'Yanıtla', show: (m) => m.from === 'veli' }] }); };
    on(el, 'click', '[data-act=r]', async (e, b) => { const m = db.get('messages', b.dataset.id); const t = await NS.prompt('Yanıt', 'Bilgi için teşekkürler, not aldık.'); if (!t) return; db.insert('messages', { student: m.student, at: new Date().toISOString(), from: 'okul', text: t }); draw(); });
    draw();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const St = db.all('students', (s) => !myCls() || s.cls === myCls()); const here = St.filter((s) => (att(s) || {}).st === 'var' && !(att(s) || {}).out); const abs = St.filter((s) => (att(s) || {}).st === 'yok');
    const noRep = St.filter((s) => (att(s) || {}).st === 'var' && !rep(s)); const msgs = db.all('messages', (m) => m.from === 'veli' && iso(m.at) === today());
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/rapor">${icon('edit')} Günlük rapor</a><a class="btn primary" href="#/yoklama">${icon('check')} Giriş & çıkış</a>`) + `
      <div class="grid g4 mb">${kpi('Okulda', `${here.length}/${St.length}`, 'users', 'ok')}${kpi('Gelmeyen', abs.length, 'alert', abs.length ? 'warn' : 'ok', `<div class="small faint">${abs.map((s) => esc(s.name.split(' ')[0])).join(', ')}</div>`)}${kpi('Raporu eksik', noRep.length, 'edit', noRep.length ? 'info' : 'ok')}${kpi('Bugünkü veli mesajı', msgs.length, 'message', 'acc')}</div>
      <div class="grid g2 mb">${db.all('classes').filter((c) => !myCls() || c.id === myCls()).map((c) => { const L = St.filter((s) => s.cls === c.id); const h = L.filter((s) => (att(s) || {}).st === 'var' && !(att(s) || {}).out).length; return `<div class="card pad" style="border-left:5px solid ${c.color}"><div class="row"><b class="grow" style="font-size:17px">${esc(c.name)}</b><span class="small muted">${esc(c.age)} · ${esc(c.teacher)}</span></div><div class="row mt" style="gap:12px"><span><b style="font-size:24px">${h}</b> <span class="small muted">okulda</span></span><span class="small">${L.length} kayıtlı</span>${L.some((s) => s.allergy) ? badge(`${L.filter((s) => s.allergy).length} alerjili`, 'err') : ''}</div></div>`; }).join('')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('message')} Bugünkü veli mesajları</h3><a class="btn sm" href="#/mesajlar">Tümü</a></div>${table({ rows: msgs, empty: 'Mesaj yok', columns: [{ label: 'Öğrenci', render: (m) => `<b>${esc(stu(m.student).name)}</b>` }, { label: 'Mesaj', render: (m) => esc(m.text) }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('coffee')} Bugünün menüsü</h3></div><div class="card-b">${(() => { const d = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date().getDay()]; const m = db.find('menu', (x) => x.day === d); return m ? Object.entries(A.MEALS).map(([k, l]) => `<div class="list-item small"><b style="min-width:90px">${l}</b><span>${esc(m[k] || '')}</span></div>`).join('') : '<span class="small faint">Hafta sonu</span>'; })()}</div></div></div>`;
  }

  const ROLES = { admin: 'Müdür', ogretmen: 'Öğretmen', muhasebe: 'Muhasebe' };
  const app = NS.shell({
    id: 'anaokulu', integrations: ['sms', 'whatsapp', 'email', 'payment', 'efatura', 'pdks', 'webhook', 'backup'], name: 'Anaokulu & Kreş', tagline: 'Günlük rapor ve veli iletişimi', icon: 'heart', accent: '#ea580c', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Gün' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['ogretmen'] }, { id: 'yoklama', label: 'Giriş & Çıkış', icon: 'check', roles: ['ogretmen'] }, { id: 'rapor', label: 'Günlük Rapor', icon: 'edit', roles: ['ogretmen'] }, { id: 'mesajlar', label: 'Veli Mesajları', icon: 'message', badge: true, roles: ['ogretmen'] }, { sec: 'Okul' }, { id: 'ogrenciler', label: 'Öğrenciler', icon: 'users', roles: ['ogretmen', 'muhasebe'] }, { id: 'duyurular', label: 'Duyurular', icon: 'bell', roles: ['ogretmen'] }, { id: 'menu', label: 'Yemek Menüsü', icon: 'coffee', roles: ['ogretmen'] }, { id: 'servis', label: 'Servis', icon: 'truck', roles: ['ogretmen'] }, { id: 'aidat', label: 'Aidat & Tahsilat', icon: 'wallet', roles: ['muhasebe'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ mesajlar: db.all('messages', (m) => m.from === 'veli' && iso(m.at) === today()).length }),
    topActions: () => `<a class="btn sm" target="_blank" href="veli.html">${icon('globe')} Veli portalı</a>`,
    routes: { ozet: dashboard, yoklama: attendancePage, rapor: reportPage, mesajlar: messagesPage, ogrenciler: studentsPage, duyurular: postsPage, menu: menuPage, servis: servicePage, aidat: feesPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Ücret' }, { name: 'fee', label: 'Varsayılan aylık ücret', type: 'number' }, { name: 'siblingDisc', label: 'Kardeş indirimi %', type: 'number' }, { name: 'dueDay', label: 'Ödeme günü (ayın)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }] }) },
  });
  if (myCls() && !location.hash) app.go('yoklama');
})();
