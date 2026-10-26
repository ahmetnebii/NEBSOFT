/* NEBSOFT Kurs & Etüt — öğrenci, sınıf, ders programı, yoklama, sınav, taksit ve öğretmen hakedişi */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today } = NS;
  const SUBJ = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'];
  const SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];
  const DAYSW = [1, 2, 3, 4, 5, 6];
  const AT = { v: 'Var', y: 'Yok', g: 'Geç', i: 'İzinli' };

  function seed(db) {
    db.data._settings = { bizName: 'Başarı Akademi Etüt Merkezi', bizPhone: '0262 333 44 55', bizAddress: 'İzmit, Kocaeli', smsAbsence: true, term: '2026-2027' };
    db.data.users = [{ id: 'u1', name: 'Selma Müdür', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Emre Öğretmen', role: 'ogretmen', pin: '1234', active: true, teacher: 't2' }, { id: 'u3', name: 'Nilay Kayıt', role: 'kayit', pin: '1234', active: true }];
    db.data.teachers = [['Ayten Öz', 'Türkçe', 450, '#e11d48'], ['Emre Kılınç', 'Matematik', 500, '#2563eb'], ['Gül Ateş', 'Fen Bilimleri', 480, '#16a34a'], ['Serdar Uz', 'Sosyal Bilgiler', 420, '#d97706'], ['Jale Tunç', 'İngilizce', 470, '#7c3aed'], ['Hamza Er', 'Din Kültürü', 380, '#0d9488']].map(([name, branch, rate, color], i) => ({ id: 't' + (i + 1), name, branch, rate, color, phone: NS.phone() }));
    db.data.classes = [{ id: 'k1', name: '8-A (LGS)', level: '8. sınıf', room: 'Derslik 1', capacity: 14, fee: 48000 }, { id: 'k2', name: '8-B (LGS)', level: '8. sınıf', room: 'Derslik 2', capacity: 14, fee: 48000 }, { id: 'k3', name: '7-A', level: '7. sınıf', room: 'Derslik 3', capacity: 12, fee: 38000 }, { id: 'k4', name: '12-SAY (YKS)', level: '12. sınıf', room: 'Derslik 4', capacity: 16, fee: 62000 }];
    const lessons = [];
    db.data.classes.forEach((c, ci) => DAYSW.forEach((d) => { const n = d === 6 ? 3 : 2; for (let k = 0; k < n; k++) { const slot = SLOTS[(ci + k * 2 + d) % SLOTS.length]; if (lessons.some((l) => l.cls === c.id && l.day === d && l.time === slot)) continue; const subj = SUBJ[(ci + d + k) % (c.id === 'k4' ? 3 : SUBJ.length)]; lessons.push({ id: NS.uid(), cls: c.id, day: d, time: slot, subject: subj, teacher: db.data.teachers.find((t) => t.branch === subj).id }); } }));
    db.data.lessons = lessons;
    const students = NS.NAMES.map((n, i) => { const c = db.data.classes[i % 4]; const surname = n.split(' ')[1]; const parent = pick(['Ali', 'Hasan', 'Fatma', 'Emine', 'Mehmet', 'Hülya']) + ' ' + surname; const inst = 8; const fee = c.fee - pick([0, 0, 2000, 5000]); const start = new Date(); start.setMonth(start.getMonth() - 2); start.setDate(5); return { id: 's' + i, no: String(3000 + i), name: n, cls: c.id, school: pick(['Atatürk Ortaokulu', 'Cumhuriyet Ortaokulu', 'Fen Lisesi', 'Anadolu Lisesi']), phone: NS.phone(), parent, parentPhone: NS.phone(), birth: `${c.level.startsWith('12') ? 2008 : c.level.startsWith('8') ? 2012 : 2013}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, fee, installments: Array.from({ length: inst }, (_, k) => { const due = addDays(start, k * 30); return { id: NS.uid(), due: iso(due), amount: Math.round(fee / inst), paid: due < new Date() && Math.random() < 0.85 }; }) }; });
    db.data.students = students;
    const att = [];
    for (let d = 21; d >= 1; d--) { const date = iso(addDays(new Date(), -d)); const dow = new Date(date + 'T12:00').getDay(); lessons.filter((l) => l.day === dow).forEach((l) => students.filter((s) => s.cls === l.cls).forEach((s) => att.push({ id: NS.uid(), lesson: l.id, date, student: s.id, st: Math.random() < 0.9 ? 'v' : pick(['y', 'g', 'i']) }))); }
    db.data.attendance = att;
    const exams = [];
    for (let k = 0; k < 3; k++) { const date = iso(addDays(new Date(), -k * 14 - 3)); db.data.classes.forEach((c) => { const subs = c.id === 'k4' ? ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler'] : SUBJ; const scores = {}; students.filter((s) => s.cls === c.id).forEach((s) => { scores[s.id] = Object.fromEntries(subs.map((x) => [x, Math.max(0, Math.round((rand(8, 19) + k * 0.6 + (Number(s.no) % 5) * 0.4) * 4) / 4)])); }); exams.push({ id: NS.uid(), name: `${c.level.startsWith('12') ? 'TYT' : 'LGS'} Deneme ${3 - k}`, date, cls: c.id, subjects: subs, max: 20, scores }); }); }
    db.data.exams = exams;
    db.data.payments = students.flatMap((s) => s.installments.filter((i) => i.paid).map((i) => ({ id: NS.uid(), student: s.id, amount: i.amount, at: new Date(i.due + 'T12:00').toISOString(), type: pick(['havale', 'kart', 'nakit']) })));
    db.data.sms = [];
  }
  const db = new NS.DB('kurs', seed);
  const S = () => db.settings({});
  const cls = (id) => db.get('classes', id) || { name: '-' };
  const tch = (id) => db.get('teachers', id) || { name: '-', color: '#64748b' };
  const stu = (id) => db.get('students', id) || { name: '-' };
  const lsn = (id) => db.get('lessons', id) || {};
  const debt = (s) => sum(s.installments.filter((i) => !i.paid && i.due <= today()), (i) => i.amount);
  const remaining = (s) => sum(s.installments.filter((i) => !i.paid), (i) => i.amount);
  const absences = (sid) => db.all('attendance', (a) => a.student === sid && a.st === 'y').length;
  const myTeacher = () => (NS.currentUser && NS.currentUser.role === 'ogretmen' ? NS.currentUser.teacher : null);
  const examTotal = (e, sid) => sum(Object.values(e.scores[sid] || {}));

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const ss = db.all('students');
    const dow = new Date().getDay();
    const todayL = db.all('lessons', (l) => l.day === dow && (!myTeacher() || l.teacher === myTeacher())).sort((a, b) => a.time.localeCompare(b.time));
    const att30 = db.all('attendance', (a) => a.date >= iso(addDays(new Date(), -30)));
    const rate = att30.length ? Math.round((att30.filter((a) => a.st === 'v' || a.st === 'g').length / att30.length) * 100) : 0;
    const late = ss.filter((s) => debt(s) > 0);
    el.innerHTML = pageHead(S().bizName, `${NS.dateLong(new Date())} · ${esc(S().term)} dönemi`, `<button class="btn" id="att">${icon('check')} Yoklama al</button><button class="btn primary" id="ns">${icon('plus')} Öğrenci kaydı</button>`) + `
      <div class="grid g4 mb">${kpi('Öğrenci', ss.length, 'users')}${kpi('Devam oranı (30 gün)', '%' + rate, 'check', 'ok')}${kpi('Bugünkü ders', todayL.length, 'book', 'info')}${kpi('Gecikmiş taksit', money(sum(late, debt)), 'alert', 'err', `<div class="small faint">${late.length} öğrenci</div>`)}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Bugünün dersleri</h3></div>${table({ rows: todayL, empty: 'Bugün ders yok', columns: [{ label: 'Saat', render: (l) => `<b>${l.time}</b>` }, { label: 'Sınıf', render: (l) => esc(cls(l.cls).name) }, { label: 'Ders', render: (l) => esc(l.subject) }, { label: 'Öğretmen', render: (l) => `<span style="color:${tch(l.teacher).color}">${esc(tch(l.teacher).name)}</span>` }, { label: 'Yoklama', render: (l) => (db.find('attendance', (a) => a.lesson === l.id && a.date === today()) ? badge('Alındı', 'ok') : badge('Bekliyor', 'warn')) }], actions: [{ label: 'Yoklama', act: 'att' }] })}</div>
      <div class="card"><div class="card-h"><h3>Sınıflar</h3></div><div class="card-b">${db.all('classes').map((c) => { const n = ss.filter((s) => s.cls === c.id).length; return `<div class="list-item"><div class="grow"><b>${esc(c.name)}</b><div class="small faint">${esc(c.room)}</div><div class="progress mt"><i style="width:${(n / c.capacity) * 100}%"></i></div></div><b>${n}/${c.capacity}</b></div>`; }).join('')}</div></div></div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Devamsızlığı yüksek öğrenciler</h3></div>${table({ rows: ss.map((s) => ({ ...s, ab: absences(s.id) })).filter((s) => s.ab >= 3).sort((a, b) => b.ab - a.ab), empty: 'Yok', columns: [{ label: 'Öğrenci', render: (s) => `<a href="#/ogrenci/${s.id}"><b>${esc(s.name)}</b></a>` }, { label: 'Sınıf', render: (s) => esc(cls(s.cls).name) }, { label: 'Veli', render: (s) => `${esc(s.parent)} · ${esc(s.parentPhone)}` }, { label: 'Devamsızlık', cls: 'right', render: (s) => badge(s.ab + ' ders', 'err') }] })}</div>`;
    $('#ns', el).onclick = () => newStudent(app);
    $('#att', el).onclick = () => app.go('yoklama');
    on(el, 'click', '[data-act=att]', (e, b) => app.go('yoklama', b.dataset.id));
  }

  // ---------- Öğrenci ----------
  const SF = () => [{ name: 'name', label: 'Öğrenci adı', required: true }, { name: 'cls', label: 'Sınıf', type: 'select', options: db.all('classes').map((c) => ({ value: c.id, label: c.name })) }, { name: 'school', label: 'Okulu' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'phone', label: 'Öğrenci telefonu' }, { name: 'parent', label: 'Veli adı', required: true }, { name: 'parentPhone', label: 'Veli telefonu', required: true }];
  async function newStudent(app) {
    const v = await formModal({ title: 'Öğrenci kaydı', size: 'wide', fields: [...SF(), { type: 'section', label: 'Ücret ve taksit' }, { name: 'fee', label: 'Dönem ücreti (₺)', type: 'number', hint: 'Boşsa sınıf ücreti' }, { name: 'inst', label: 'Taksit sayısı', type: 'select', options: ['1', '2', '4', '6', '8', '10'] }, { name: 'first', label: 'İlk taksit tarihi', type: 'date', value: today() }] });
    if (!v) return;
    const fee = v.fee || cls(v.cls).fee; const n = Number(v.inst) || 1;
    if (db.all('students', (s) => s.cls === v.cls).length >= cls(v.cls).capacity && !(await confirm('Sınıf kontenjanı dolu. Yine de kaydedilsin mi?', { ok: 'Kaydet', danger: false }))) return;
    const s = db.insert('students', { name: v.name, cls: v.cls, school: v.school, birth: v.birth, phone: v.phone, parent: v.parent, parentPhone: v.parentPhone, no: String(3000 + db.all('students').length + rand(50, 900)), fee, installments: Array.from({ length: n }, (_, k) => ({ id: NS.uid(), due: iso(addDays(v.first, k * 30)), amount: Math.round(fee / n), paid: false })) });
    db.log('Öğrenci kaydı', `${s.name} · ${cls(s.cls).name}`); toast('Öğrenci kaydedildi', 'ok'); app.go('ogrenci', s.id);
  }
  function studentsPage(el, p, app) {
    let q = '', c = '';
    el.innerHTML = pageHead('Öğrenciler', 'Öğrenci ve veli kartları', `<button class="btn" id="ex">${icon('download')}</button><button class="btn primary" id="ns">${icon('plus')} Öğrenci kaydı</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ad, veli, telefon...')}<select class="input" id="c" style="max-width:200px"><option value="">Tüm sınıflar</option>${db.all('classes').map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div><div id="t"></div></div>`;
    const rows = () => db.all('students', (s) => (!c || s.cls === c) && NS.match(q, s.name, s.parent, s.parentPhone, s.no)).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'users', columns: [{ label: 'Öğrenci', render: (s) => `<a href="#/ogrenci/${s.id}" class="row nw" style="color:inherit"><div class="avatar">${esc(NS.initials(s.name))}</div><div><b>${esc(s.name)}</b><div class="small faint">#${s.no} · ${esc(s.school || '')}</div></div></a>` }, { label: 'Sınıf', render: (s) => esc(cls(s.cls).name) }, { label: 'Veli', render: (s) => `${esc(s.parent)}<div class="small faint">${esc(s.parentPhone)}</div>` }, { label: 'Devamsızlık', cls: 'right', render: (s) => { const a = absences(s.id); return a >= 3 ? badge(a, 'err') : a; } }, { label: 'Kalan borç', cls: 'right', render: (s) => (debt(s) > 0 ? `<b style="color:var(--err)">${money(remaining(s))}</b>` : money(remaining(s))) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} öğrenci` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#c', el).onchange = (e) => { c = e.target.value; draw(); };
    on(el, 'click', '[data-act=v]', (e, b) => app.go('ogrenci', b.dataset.id));
    $('#ns', el).onclick = () => newStudent(app);
    $('#ex', el).onclick = () => NS.csv('ogrenciler', rows(), [{ key: 'no', label: 'No' }, { key: 'name', label: 'Ad' }, { label: 'Sınıf', value: (s) => cls(s.cls).name }, { key: 'parent', label: 'Veli' }, { key: 'parentPhone', label: 'Veli tel' }, { label: 'Kalan', value: remaining }]);
    draw();
  }
  function studentPage(el, id, app) {
    const s = db.get('students', id); if (!s) return app.go('ogrenciler');
    const att = db.all('attendance', (a) => a.student === id);
    const exams = db.all('exams', (e) => e.scores[id]).sort((a, b) => a.date.localeCompare(b.date));
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/ogrenciler">${icon('back')} Öğrenciler</a></div>
      <div class="card pad mb row"><div class="avatar lg" style="width:60px;height:60px;font-size:20px">${esc(NS.initials(s.name))}</div><div class="grow"><h1>${esc(s.name)}</h1><div class="muted">#${s.no} · ${esc(cls(s.cls).name)} · ${esc(s.school || '')}</div><div class="small mt">Veli: <b>${esc(s.parent)}</b> · ${esc(s.parentPhone)}</div></div><button class="btn" id="ed">${icon('edit')} Düzenle</button><button class="btn" id="kr">${icon('print')} Karne</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/90${String(s.parentPhone).replace(/\D/g, '').replace(/^0/, '')}">${icon('message')} Veliye yaz</a></div>
      <div class="grid g4 mb">${kpi('Devam', att.length ? '%' + Math.round((att.filter((a) => a.st !== 'y').length / att.length) * 100) : '-', 'check', 'ok')}${kpi('Devamsızlık', att.filter((a) => a.st === 'y').length + ' ders', 'x', 'err')}${kpi('Son deneme', exams.length ? num(examTotal(exams[exams.length - 1], id)) + ' net' : '-', 'award', 'info')}${kpi('Kalan ödeme', money(remaining(s)), 'wallet', debt(s) ? 'err' : '')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Deneme sınavları</h3></div><div class="card-b">${exams.length > 1 ? chart.line([{ name: 'Toplam net', values: exams.map((e) => examTotal(e, id)) }], exams.map((e) => e.name.replace(/.*Deneme /, 'D'))) : ''}${table({ rows: exams.slice().reverse(), columns: [{ label: 'Sınav', render: (e) => `<b>${esc(e.name)}</b><div class="small faint">${NS.date(e.date)}</div>` }, ...(exams[0] ? exams[0].subjects.map((x) => ({ label: x.slice(0, 3), cls: 'right', render: (e) => num((e.scores[id] || {})[x] || 0) })) : []), { label: 'Toplam', cls: 'right', render: (e) => `<b>${num(examTotal(e, id))}</b>` }] })}</div></div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Taksitler</h3></div>${table({ rows: s.installments, columns: [{ label: 'Vade', render: (i) => NS.date(i.due) }, { label: 'Tutar', cls: 'right', render: (i) => money(i.amount) }, { label: 'Durum', render: (i) => (i.paid ? badge('Ödendi', 'ok') : i.due < today() ? badge('Gecikti', 'err') : badge('Bekliyor', 'warn')) }], actions: [{ label: 'Tahsil et', act: 'pay', show: (i) => !i.paid }] })}</div>
      <div class="card"><div class="card-h"><h3>Son yoklamalar</h3></div><div class="card-b">${att.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((a) => `<div class="list-item small"><span class="grow">${NS.date(a.date)} · ${esc(lsn(a.lesson).subject || '')}</span>${badge(AT[a.st], { v: 'ok', y: 'err', g: 'warn', i: 'info' }[a.st])}</div>`).join('') || '<div class="faint small">Kayıt yok</div>'}</div></div></div></div>`;
    on(el, 'click', '[data-act=pay]', async (e, b) => { const i = s.installments.find((x) => x.id === b.dataset.id); const v = await formModal({ title: `Tahsilat ${money(i.amount)}`, fields: [{ name: 'type', label: 'Ödeme', type: 'select', options: ['havale', 'kart', 'nakit'] }] }); if (v) { i.paid = true; db.insert('payments', { student: id, amount: i.amount, at: new Date().toISOString(), type: v.type }); toast('Tahsil edildi', 'ok'); app.refresh(); } });
    $('#ed', el).onclick = async () => { const v = await formModal({ title: 'Öğrenci', fields: SF(), values: s }); if (v) { db.update('students', id, v); app.refresh(); } };
    $('#kr', el).onclick = () => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>ÖĞRENCİ GELİŞİM KARNESİ — ${esc(S().term)}</h3><p><b>${esc(s.name)}</b> · ${esc(cls(s.cls).name)} · No ${s.no}</p><p>Devam: ${att.length ? Math.round((att.filter((a) => a.st !== 'y').length / att.length) * 100) : 0}% · Devamsızlık: ${att.filter((a) => a.st === 'y').length} ders</p><table><tr><th>Sınav</th>${(exams[0] ? exams[0].subjects : []).map((x) => `<th>${esc(x)}</th>`).join('')}<th>Toplam</th></tr>${exams.map((e) => `<tr><td>${esc(e.name)}</td>${e.subjects.map((x) => `<td>${num((e.scores[id] || {})[x] || 0)}</td>`).join('')}<td><b>${num(examTotal(e, id))}</b></td></tr>`).join('')}</table><p style="margin-top:40px">Rehber öğretmen: __________ &nbsp;&nbsp; Veli: __________</p></div>`, { title: 'Karne' });
  }

  // ---------- Ders programı ----------
  function schedulePage(el, p, app) {
    let c = (db.all('classes')[0] || {}).id;
    const draw = () => {
      el.innerHTML = pageHead('Ders Programı', 'Haftalık program; boş hücreye tıklayarak ders ekleyin', `<select class="input" id="c" style="max-width:220px">${db.all('classes').map((x) => `<option value="${x.id}" ${x.id === c ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><button class="btn" id="pr">${icon('print')}</button>`) +
        `<div class="card pad"><div class="tt"><div></div>${DAYSW.map((d) => `<div class="h">${NS.DAYS[d]}</div>`).join('')}${SLOTS.map((t) => `<div class="tm">${t}</div>${DAYSW.map((d) => { const l = db.find('lessons', (x) => x.cls === c && x.day === d && x.time === t); return l ? `<div class="ls" style="background:${tch(l.teacher).color}" data-l="${l.id}"><b>${esc(l.subject)}</b><div>${esc(tch(l.teacher).name)}</div></div>` : `<div class="em" data-e="${d}|${t}"></div>`; }).join('')}`).join('')}</div></div>`;
      $('#c', el).onchange = (e) => { c = e.target.value; draw(); };
      $('#pr', el).onclick = () => NS.printHtml(`<div class="doc"><h2>${esc(cls(c).name)} — Haftalık Ders Programı</h2><table><tr><th></th>${DAYSW.map((d) => `<th>${NS.DAYS[d]}</th>`).join('')}</tr>${SLOTS.map((t) => `<tr><td><b>${t}</b></td>${DAYSW.map((d) => { const l = db.find('lessons', (x) => x.cls === c && x.day === d && x.time === t); return `<td>${l ? `${esc(l.subject)}<br><small>${esc(tch(l.teacher).name)}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</table></div>`, { title: 'Program' });
    };
    const form = async (rec, d, t) => {
      const v = await formModal({ title: rec ? 'Dersi düzenle' : 'Ders ekle', fields: [{ name: 'subject', label: 'Ders', type: 'select', options: SUBJ }, { name: 'teacher', label: 'Öğretmen', type: 'select', options: db.all('teachers').map((x) => ({ value: x.id, label: `${x.name} (${x.branch})` })) }, ...(rec ? [{ name: 'del', label: 'Bu dersi programdan kaldır', type: 'checkbox' }] : [])], values: rec || { subject: SUBJ[0] } });
      if (!v) return;
      if (v.del) { db.remove('lessons', rec.id); return draw(); }
      const day = rec ? rec.day : Number(d), time = rec ? rec.time : t;
      const busy = db.find('lessons', (x) => x.teacher === v.teacher && x.day === day && x.time === time && (!rec || x.id !== rec.id));
      if (busy) return toast(`${tch(v.teacher).name} bu saatte ${cls(busy.cls).name} sınıfında`, 'err');
      if (rec) db.update('lessons', rec.id, { subject: v.subject, teacher: v.teacher }); else db.insert('lessons', { cls: c, day, time, subject: v.subject, teacher: v.teacher });
      draw();
    };
    on(el, 'click', '[data-e]', (e, b) => { const [d, t] = b.dataset.e.split('|'); form(null, d, t); });
    on(el, 'click', '[data-l]', (e, b) => form(db.get('lessons', b.dataset.l)));
    draw();
  }

  // ---------- Yoklama ----------
  function attendancePage(el, lessonId, app) {
    const dow = new Date().getDay();
    const todays = db.all('lessons', (l) => l.day === dow && (!myTeacher() || l.teacher === myTeacher())).sort((a, b) => a.time.localeCompare(b.time));
    let L = lessonId ? db.get('lessons', lessonId) : todays[0] || db.find('lessons', (l) => !myTeacher() || l.teacher === myTeacher());
    let date = today();
    const draw = () => {
      const opts = db.all('lessons', (l) => !myTeacher() || l.teacher === myTeacher()).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
      if (!L) { el.innerHTML = pageHead('Yoklama') + '<div class="empty">Ders bulunamadı</div>'; return; }
      const studs = db.all('students', (s) => s.cls === L.cls).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      const cur = {}; db.all('attendance', (a) => a.lesson === L.id && a.date === date).forEach((a) => { cur[a.student] = a.st; });
      el.innerHTML = pageHead('Yoklama', `${esc(cls(L.cls).name)} · ${esc(L.subject)} · ${NS.DAYS[L.day]} ${L.time} · ${esc(tch(L.teacher).name)}`, `<select class="input" id="ls" style="max-width:320px">${opts.map((l) => `<option value="${l.id}" ${l.id === L.id ? 'selected' : ''}>${NS.DAYS[l.day].slice(0, 3)} ${l.time} · ${esc(cls(l.cls).name)} · ${esc(l.subject)}</option>`).join('')}</select><input type="date" class="input" id="dt" value="${date}" style="max-width:170px">`) + `
        <div class="card"><div class="card-h"><b class="grow">${studs.length} öğrenci</b><button class="btn sm" id="all">${icon('check')} Hepsi var</button><button class="btn primary" id="sv">${icon('check')} Yoklamayı kaydet</button></div>
        ${studs.map((s) => `<div class="list-item" style="padding:10px 18px"><div class="avatar">${esc(NS.initials(s.name))}</div><div class="grow"><b>${esc(s.name)}</b><div class="small faint">Toplam devamsızlık: ${absences(s.id)}</div></div><div class="att" data-s="${s.id}">${Object.entries(AT).map(([k, v]) => `<button class="${k} ${cur[s.id] === k ? 'on' : ''}" data-v="${k}">${v}</button>`).join('')}</div></div>`).join('')}</div>
        ${S().smsAbsence ? '<p class="small muted mt">"Yok" işaretlenen öğrencilerin velilerine otomatik SMS gönderilir (demo: simüle).</p>' : ''}`;
      $('#ls', el).onchange = (e) => { L = db.get('lessons', e.target.value); draw(); };
      $('#dt', el).onchange = (e) => { date = e.target.value; draw(); };
      $('#all', el).onclick = () => { $$('.att', el).forEach((g) => $$('button', g).forEach((b) => b.classList.toggle('on', b.dataset.v === 'v'))); };
      $('#sv', el).onclick = () => {
        let absent = 0;
        $$('.att', el).forEach((g) => {
          const on2 = $('button.on', g); if (!on2) return;
          const sid = g.dataset.s; const ex = db.find('attendance', (a) => a.lesson === L.id && a.date === date && a.student === sid);
          if (ex) ex.st = on2.dataset.v; else db.insert('attendance', { lesson: L.id, date, student: sid, st: on2.dataset.v }, true);
          if (on2.dataset.v === 'y' && S().smsAbsence && (!ex || ex.st !== 'y')) { const s = stu(sid); absent++; NS.smsLog(db, { to: s.parentPhone, name: s.parent, text: `Sayın ${s.parent}, öğrenciniz ${s.name} ${NS.date(date)} ${L.time} ${L.subject} dersine katılmamıştır. ${S().bizName}`, at: new Date().toISOString() }, true); }
        });
        db.save(); toast(`Yoklama kaydedildi${absent ? ` · ${absent} veliye SMS` : ''}`, 'ok');
        // MEB e-Yaygın / MEBBİS devam bildirimi
        if (NS.integ && NS.integ.isOn('meb')) NS.integ.call('meb', 'devam-bildirimi', { cls: cls(L.cls).name, subject: L.subject, date, time: L.time, teacher: tch(L.teacher).name, list: db.all('attendance', (a) => a.lesson === L.id && a.date === date).map((a) => ({ tc: stu(a.student).tc, name: stu(a.student).name, st: a.st })) }, { silent: true }).then((r) => { if (r) toast(r.ok ? 'Devam bilgisi MEB sistemine iletildi' : 'MEB bildirimi gönderilemedi', r.ok ? 'ok' : 'err'); });
      };
      if (!$('#ol', el)) $('#sv', el).insertAdjacentHTML('beforebegin', `<button class="btn sm" id="ol">${icon('play')} Online ders</button>`);
      $('#ol', el).onclick = async () => {
        const studs2 = db.all('students', (s) => s.cls === L.cls);
        const r = NS.integ && NS.integ.isOn('onlineders') ? await NS.integ.call('onlineders', 'toplanti-olustur', { title: `${cls(L.cls).name} · ${L.subject}`, start: `${date}T${L.time}`, minutes: 40, teacher: tch(L.teacher).name }) : null;
        const link = r && r.data && r.data.url ? r.data.url : `https://meet.jit.si/nebsoft-${NS.slug(cls(L.cls).name)}-${date}`;
        if (!(await confirm(`Ders bağlantısı: ${link}\n${studs2.length} öğrencinin velisine SMS ile gönderilsin mi?`, { ok: 'Gönder', danger: false, title: 'Online ders' }))) return;
        studs2.forEach((s) => NS.smsLog(db, { to: s.parentPhone, name: s.parent, text: `${s.name} için ${NS.date(date)} ${L.time} ${L.subject} online dersi: ${link} ${S().bizName}` }, true));
        toast(`${studs2.length} veliye ders bağlantısı gönderildi`, 'ok');
      };
    };
    on(el, 'click', '.att button', (e, b) => { $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b)); });
    draw();
  }

  // ---------- Sınavlar ----------
  function examsPage(el, id, app) {
    if (id) return examDetail(el, id, app);
    el.innerHTML = pageHead('Deneme Sınavları', 'Sonuç girişi, sınıf sıralaması ve karne', `<button class="btn primary" id="ne">${icon('plus')} Yeni sınav</button>`) + `<div class="card" id="t"></div>`;
    $('#t', el).innerHTML = table({ rows: db.all('exams').sort((a, b) => b.date.localeCompare(a.date)), emptyIcon: 'award', columns: [{ label: 'Sınav', render: (e) => `<a href="#/sinavlar/${e.id}"><b>${esc(e.name)}</b></a>` }, { label: 'Tarih', render: (e) => NS.date(e.date) }, { label: 'Sınıf', render: (e) => esc(cls(e.cls).name) }, { label: 'Katılım', cls: 'right', render: (e) => Object.keys(e.scores).length }, { label: 'Sınıf ortalaması', cls: 'right', render: (e) => { const ids = Object.keys(e.scores); return ids.length ? num(sum(ids, (sid) => examTotal(e, sid)) / ids.length) + ' net' : '-'; } }], actions: [{ icon: 'eye', act: 'v' }] });
    on(el, 'click', '[data-act=v]', (e, b) => app.go('sinavlar', b.dataset.id));
    $('#ne', el).onclick = async () => { const v = await formModal({ title: 'Yeni sınav', fields: [{ name: 'name', label: 'Sınav adı', required: true, value: 'Deneme ' }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'cls', label: 'Sınıf', type: 'select', options: db.all('classes').map((c) => ({ value: c.id, label: c.name })) }, { name: 'max', label: 'Ders başına soru', type: 'number', value: 20 }] }); if (v) { const e2 = db.insert('exams', { ...v, subjects: cls(v.cls).level.startsWith('12') ? SUBJ.slice(0, 4) : SUBJ, scores: {} }); app.go('sinavlar', e2.id); } };
  }
  function examDetail(el, id, app) {
    const e = db.get('exams', id);
    const studs = db.all('students', (s) => s.cls === e.cls);
    const ranked = studs.map((s) => ({ ...s, t: examTotal(e, s.id) })).sort((a, b) => b.t - a.t);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/sinavlar">${icon('back')} Sınavlar</a><h1 class="grow">${esc(e.name)} · ${esc(cls(e.cls).name)}</h1><button class="btn primary" id="sv">${icon('check')} Netleri kaydet</button></div>
      <div class="grid g3 mb">${kpi('Ortalama', num(sum(ranked, (r) => r.t) / Math.max(1, ranked.length)) + ' net', 'chart')}${kpi('En yüksek', ranked[0] ? num(ranked[0].t) : '-', 'award', 'ok')}${kpi('Ders başına soru', e.max, 'hash', 'info')}</div>
      <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Öğrenci</th>${e.subjects.map((x) => `<th class="right">${esc(x)}</th>`).join('')}<th class="right">Toplam</th></tr></thead><tbody>${ranked.map((s, i) => `<tr><td>${i + 1}${i < 3 ? ' 🏅' : ''}</td><td><b>${esc(s.name)}</b></td>${e.subjects.map((x) => `<td class="right"><input class="input" type="number" step="0.25" min="0" max="${e.max}" style="width:76px;text-align:right" data-s="${s.id}" data-x="${esc(x)}" value="${(e.scores[s.id] || {})[x] ?? ''}"></td>`).join('')}<td class="right"><b>${num(s.t)}</b></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card mt"><div class="card-h"><h3>Ders ortalamaları</h3></div><div class="card-b">${chart.bars(e.subjects.map((x) => ({ label: x.slice(0, 6), value: sum(Object.values(e.scores), (sc) => sc[x] || 0) / Math.max(1, Object.keys(e.scores).length) })), { format: num })}</div></div>`;
    $('#sv', el).onclick = () => { $$('[data-s]', el).forEach((i) => { if (i.value === '') return; (e.scores[i.dataset.s] = e.scores[i.dataset.s] || {})[i.dataset.x] = NS.clamp(Number(i.value), 0, e.max); }); db.save(); toast('Sonuçlar kaydedildi', 'ok'); app.refresh(); };
  }

  // ---------- Taksitler / hakediş ----------
  function feesPage(el, p, app) {
    const ss = db.all('students');
    const rows = ss.flatMap((s) => s.installments.filter((i) => !i.paid).map((i) => ({ ...i, s }))).sort((a, b) => a.due.localeCompare(b.due));
    const pay30 = db.all('payments', (x) => x.at > addDays(new Date(), -30).toISOString());
    el.innerHTML = pageHead('Taksit & Tahsilat', 'Vadesi gelen ve geciken taksitler') + `
      <div class="grid g4 mb">${kpi('Gecikmiş', money(sum(rows.filter((r) => r.due < today()), (r) => r.amount)), 'alert', 'err')}${kpi('Bu ay vadesi gelen', money(sum(rows.filter((r) => r.due.slice(0, 7) === today().slice(0, 7)), (r) => r.amount)), 'calendar', 'warn')}${kpi('30 gün tahsilat', money(sum(pay30, (x) => x.amount)), 'wallet', 'ok')}${kpi('Toplam kalan', money(sum(rows, (r) => r.amount)), 'clock', 'info')}</div>
      <div class="card">${table({ rows: rows.slice(0, 200), empty: 'Bekleyen taksit yok', columns: [{ label: 'Vade', render: (r) => `${NS.date(r.due)}${r.due < today() ? `<div class="small" style="color:var(--err)">${NS.daysBetween(r.due, new Date())} gün gecikti</div>` : ''}` }, { label: 'Öğrenci', render: (r) => `<a href="#/ogrenci/${r.s.id}"><b>${esc(r.s.name)}</b></a><div class="small faint">${esc(cls(r.s.cls).name)}</div>` }, { label: 'Veli', render: (r) => `${esc(r.s.parent)}<div class="small faint">${esc(r.s.parentPhone)}</div>` }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.amount)}</b>` }], actions: [{ label: 'Tahsil et', act: 'pay' }, { icon: 'message', act: 'wa', title: 'Veliye hatırlat' }] })}</div>`;
    on(el, 'click', '[data-act]', async (e, b) => {
      const r = rows.find((x) => x.id === b.dataset.id);
      if (b.dataset.act === 'wa') return window.open(`https://wa.me/90${String(r.s.parentPhone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Sayın ${r.s.parent}, ${r.s.name} için ${NS.date(r.due)} vadeli ${money(r.amount)} taksit ödemesini hatırlatırız. ${S().bizName}`)}`, '_blank', 'noopener');
      const v = await formModal({ title: `Tahsilat — ${r.s.name}`, fields: [{ name: 'type', label: 'Ödeme', type: 'select', options: ['havale', 'kart', 'nakit'] }] });
      if (v) { r.s.installments.find((i) => i.id === r.id).paid = true; db.insert('payments', { student: r.s.id, amount: r.amount, at: new Date().toISOString(), type: v.type }); toast('Tahsil edildi', 'ok'); app.refresh(); }
    });
  }
  function teachersPage(el, p, app) {
    const weeks = 4.3;
    el.innerHTML = '<div id="a"></div><div class="card mt"><div class="card-h"><h3>Aylık hakediş tahmini (haftalık ders × 4,3 hafta × ders ücreti)</h3></div><div id="b"></div></div>';
    NS.crud($('#a', el), app, { col: 'teachers', title: 'Öğretmenler', single: 'Öğretmen', addLabel: 'Yeni öğretmen', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'branch', label: 'Branş', type: 'select', options: SUBJ }, { name: 'rate', label: 'Ders ücreti (₺)', type: 'number' }, { name: 'phone', label: 'Telefon' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Öğretmen', render: (t) => `<b style="color:${t.color}">${esc(t.name)}</b>` }, { key: 'branch', label: 'Branş' }, { key: 'rate', label: 'Ders ücreti', cls: 'right', render: (t) => money(t.rate) }, { label: 'Haftalık ders', cls: 'right', render: (t) => db.all('lessons', (l) => l.teacher === t.id).length }] });
    $('#b', el).innerHTML = table({ rows: db.all('teachers'), columns: [{ label: 'Öğretmen', render: (t) => esc(t.name) }, { label: 'Haftalık', cls: 'right', render: (t) => db.all('lessons', (l) => l.teacher === t.id).length }, { label: 'Aylık hakediş', cls: 'right', render: (t) => `<b>${money(db.all('lessons', (l) => l.teacher === t.id).length * weeks * t.rate)}</b>` }] });
  }
  function smsPage(el, p, app) {
    const msgs = db.all('parentMsgs').sort((a, b) => (a.status === 'yeni' ? -1 : 1) - (b.status === 'yeni' ? -1 : 1) || b.at.localeCompare(a.at));
    const fresh = msgs.filter((m) => m.status === 'yeni').length;
    el.innerHTML = pageHead('Veli İletişimi', 'Veli portalından gelen mesaj ve mazeretler, gönderilen SMS bildirimleri', `<a class="btn" href="veli.html" target="_blank" rel="noopener">${icon('globe')} Veli portalı</a>`) + `
      <div class="card mb"><div class="card-h"><h3>Veli mesajları</h3>${fresh ? badge(fresh + ' yeni', 'warn') : ''}</div>${table({ rows: msgs, empty: 'Veli portalından mesaj yok', emptyIcon: 'message', columns: [{ label: 'Zaman', render: (m) => NS.dt(m.at) }, { label: 'Öğrenci / veli', render: (m) => `<b>${esc(stu(m.student).name)}</b><div class="small faint">${esc(m.from || '')} · ${esc(m.phone || '')}</div>` }, { label: 'Konu', render: (m) => (m.type === 'mazeret' ? badge('Mazeret · ' + NS.date(m.date), 'info') : badge(m.type === 'soru' ? 'Soru' : 'Mesaj')) }, { label: 'Mesaj', render: (m) => `<span class="small">${esc(m.text)}</span>${m.reply ? `<div class="small" style="color:var(--accent)">↳ ${esc(m.reply)}</div>` : ''}` }, { label: 'Durum', render: (m) => (m.status === 'yeni' ? badge('Yeni', 'warn') : badge('Yanıtlandı', 'ok')) }], actions: [{ icon: 'send', act: 'reply', title: 'Yanıtla' }] })}</div>
      <div class="card"><div class="card-h"><h3>Gönderilen SMS bildirimleri</h3></div>${table({ rows: db.all('sms').slice().reverse(), empty: 'Henüz bildirim yok — yoklamada "Yok" işaretleyin', columns: [{ label: 'Zaman', render: (x) => NS.dt(x.at || x.created) }, { label: 'Veli', render: (x) => `${esc(x.name || '')}<div class="small faint">${esc(x.to)}</div>` }, { label: 'Mesaj', render: (x) => `<span class="small">${esc(x.text)}</span>` }] })}</div>`;
    on(el, 'click', '[data-act="reply"]', async (e, b) => {
      const m = db.get('parentMsgs', b.dataset.id);
      const v = await formModal({ title: `Yanıt — ${stu(m.student).name}`, fields: [{ name: 'reply', label: 'Yanıtınız (veliye SMS ile gider)', type: 'textarea', required: true, full: true, value: m.type === 'mazeret' ? 'Mazeretiniz alındı, geçmiş olsun.' : '' }, ...(m.type === 'mazeret' ? [{ name: 'excuse', label: `${NS.date(m.date)} yoklamasını "İzinli" olarak işle`, type: 'checkbox', value: true }] : [])] });
      if (!v) return;
      m.reply = v.reply; m.status = 'yanit'; m.repliedAt = new Date().toISOString();
      if (v.excuse) { const s = stu(m.student); const dow = new Date(m.date + 'T12:00').getDay(); db.all('lessons', (l) => l.cls === s.cls && l.day === dow).forEach((l) => { const a = db.find('attendance', (x) => x.lesson === l.id && x.date === m.date && x.student === s.id); if (a) a.st = 'i'; else db.insert('attendance', { lesson: l.id, date: m.date, student: s.id, st: 'i' }, true); }); }
      NS.smsLog(db, { to: m.phone, name: m.from, text: `${S().bizName}: ${v.reply}`, kind: 'veli' }, true);
      db.save(); toast('Yanıt gönderildi', 'ok'); app.refresh();
    });
  }

  const ROLES = { admin: 'Müdür', ogretmen: 'Öğretmen', kayit: 'Kayıt / Muhasebe' };
  NS.shell({
    id: 'kurs', integrations: ['sms', 'whatsapp', 'email', 'pos', 'payment', 'efatura', 'printer', 'webhook', 'backup'], name: 'Kurs & Etüt', tagline: 'Eğitim Kurumu Yönetimi', icon: 'school', accent: '#7c3aed', db, home: 'ozet', auth: { roles: ROLES }, titles: { ogrenci: 'Öğrenci kartı' },
    nav: [{ sec: 'Eğitim' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'yoklama', label: 'Yoklama', icon: 'check' }, { id: 'program', label: 'Ders Programı', icon: 'calendar' }, { id: 'sinavlar', label: 'Deneme Sınavları', icon: 'award' }, { id: 'ogrenciler', label: 'Öğrenciler', icon: 'users' }, { sec: 'Yönetim' }, { id: 'taksitler', label: 'Taksit & Tahsilat', icon: 'wallet', roles: ['kayit'] }, { id: 'siniflar', label: 'Sınıflar', icon: 'grid', roles: ['admin'] }, { id: 'ogretmenler', label: 'Öğretmenler', icon: 'user', roles: ['admin'] }, { id: 'bildirimler', label: 'Veli İletişimi', icon: 'message' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, yoklama: attendancePage, program: schedulePage, sinavlar: examsPage, ogrenciler: studentsPage, ogrenci: studentPage, taksitler: feesPage, ogretmenler: teachersPage, bildirimler: smsPage,
      siniflar: (el, p, a) => NS.crud(el, a, { col: 'classes', title: 'Sınıflar', single: 'Sınıf', addLabel: 'Yeni sınıf', fields: [{ name: 'name', label: 'Sınıf adı', required: true }, { name: 'level', label: 'Seviye' }, { name: 'room', label: 'Derslik' }, { name: 'capacity', label: 'Kontenjan', type: 'number' }, { name: 'fee', label: 'Dönem ücreti', type: 'number' }], columns: [{ key: 'name', label: 'Sınıf', render: (c) => `<b>${esc(c.name)}</b>` }, { key: 'level', label: 'Seviye' }, { key: 'room', label: 'Derslik' }, { label: 'Öğrenci', cls: 'right', render: (c) => `${db.all('students', (s) => s.cls === c.id).length}/${c.capacity}` }, { key: 'fee', label: 'Ücret', cls: 'right', render: (c) => money(c.fee) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Kurum ayarları' }, { name: 'term', label: 'Eğitim dönemi' }, { name: 'smsAbsence', label: 'Devamsızlıkta veliye otomatik SMS', type: 'checkbox' }] }),
    },
  });
})();
