/* NEBSOFT Personel & Puantaj — özlük, aylık puantaj, fazla mesai, izin, avans ve maaş özeti */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const PS = { C: 'Çalıştı', H: 'Hafta tatili', B: 'Resmi tatil', I: 'Yıllık izin', R: 'Raporlu', U: 'Ücretsiz izin', D: 'Devamsız' };
  const CYCLE = ['C', 'I', 'R', 'U', 'D', 'H', 'B'];
  const HOLIDAYS = ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'];

  function seed(db) {
    db.data._settings = { bizName: 'Kale Mobilya San. Tic.', weekend: [0], otRate: 1.5, monthHours: 225 };
    db.data.users = [{ id: 'u1', name: 'Pelin İK Müdürü', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Okan Şef', role: 'sef', pin: '1234', active: true, dept: 'Üretim' }];
    const depts = [['Üretim', ['Usta', 'Kalfa', 'Operatör', 'Montaj elemanı']], ['Satış', ['Satış danışmanı', 'Mağaza müdürü']], ['Lojistik', ['Şoför', 'Depo sorumlusu']], ['İdari', ['Muhasebe uzmanı', 'İK uzmanı']]];
    db.data.employees = NS.NAMES.slice(0, 22).map((n, i) => { const [dept, titles] = depts[i % 4 === 3 && i > 10 ? 3 : i % 3]; return { id: 'e' + i, name: n, tc: String(rand(10000000000, 99999999999)), dept, title: pick(titles), start: iso(addDays(new Date(), -rand(60, 4000))), salary: pick([28075.5, 30000, 32500, 36000, 42000, 50000, 62000]), salaryType: i % 5 === 4 ? 'brut' : 'net', phone: NS.phone(), iban: `TR${rand(10, 99)} 0001 ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(10, 99)}`, birth: `${rand(1970, 2003)}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, active: true }; });
    const ts = {};
    const start = new Date(); start.setDate(1); start.setMonth(start.getMonth() - 1);
    for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = iso(d); const dow = d.getDay(); const hol = HOLIDAYS.includes(key.slice(5));
      db.data.employees.forEach((e) => { let s = dow === 0 ? 'H' : hol ? 'B' : 'C'; if (s === 'C') { const r = Math.random(); s = r < 0.03 ? 'I' : r < 0.045 ? 'R' : r < 0.05 ? 'D' : r < 0.055 ? 'U' : 'C'; } ts[`${e.id}|${key}`] = { s, ot: s === 'C' && e.dept === 'Üretim' && Math.random() < 0.15 ? pick([1, 2, 2, 3]) : 0 }; });
    }
    db.data.ts = ts;
    db.data.leaves = [{ id: 'l1', emp: 'e3', type: 'I', from: iso(addDays(new Date(), 5)), to: iso(addDays(new Date(), 9)), note: 'Aile ziyareti', status: 'bekliyor' }, { id: 'l2', emp: 'e8', type: 'I', from: iso(addDays(new Date(), 14)), to: iso(addDays(new Date(), 20)), note: 'Yaz tatili', status: 'bekliyor' }, { id: 'l3', emp: 'e1', type: 'R', from: iso(addDays(new Date(), -6)), to: iso(addDays(new Date(), -5)), note: 'Grip — doktor raporu', status: 'onay' }];
    db.data.advances = db.data.employees.filter(() => Math.random() < 0.3).map((e) => ({ id: NS.uid(), emp: e.id, date: iso(addDays(new Date(), -rand(0, 20))), amount: pick([2000, 3000, 5000]), note: 'Avans' }));
  }
  const db = new NS.DB('ik', seed);
  const S = () => db.settings({ otRate: 1.5, monthHours: 225 });
  const emp = (id) => db.get('employees', id) || { name: '-' };
  const cell = (eid, d) => db.data.ts[`${eid}|${d}`];
  const defaultStatus = (d) => (new Date(d + 'T12:00').getDay() === 0 ? 'H' : HOLIDAYS.includes(d.slice(5)) ? 'B' : 'C');
  const seniority = (e) => Math.floor(daysBetween(e.start, new Date()) / 365);
  const entitlement = (e) => { const y = seniority(e); return y < 1 ? 0 : y < 5 ? 14 : y < 15 ? 20 : 26; };
  const usedLeave = (e) => Object.entries(db.data.ts).filter(([k, v]) => k.startsWith(e.id + '|') && k.split('|')[1].startsWith(String(new Date().getFullYear())) && v.s === 'I').length;
  const myDept = () => (NS.currentUser && NS.currentUser.role === 'sef' ? NS.currentUser.dept : null);
  const emps = () => db.all('employees', (e) => e.active !== false && (!myDept() || e.dept === myDept()));
  const monthDays = (ym) => { const [y, m] = ym.split('-').map(Number); return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => `${ym}-${NS.pad(i + 1)}`); };
  function monthStats(e, ym) {
    const st = { C: 0, H: 0, B: 0, I: 0, R: 0, U: 0, D: 0, ot: 0, empty: 0 };
    monthDays(ym).forEach((d) => { const c = cell(e.id, d); if (!c) { if (d <= today()) st.empty++; return; } st[c.s]++; st.ot += c.ot || 0; });
    return st;
  }
  // Bordro parametreleri: Ayarlar'da girilen değer yoksa bordro.js varsayılanı
  const BP = () => { const s = S(); return Object.fromEntries(Object.keys(BORDRO.DEFAULTS).map((k) => [k, s[k] === undefined || s[k] === '' ? BORDRO.DEFAULTS[k] : s[k]])); };
  const isNet = (e) => e.salaryType !== 'brut';
  function monthCalc(e, ym, P, cum, mo) {
    const st = monthStats(e, ym);
    const first = ym + '-01', last = monthDays(ym).slice(-1)[0];
    if (e.start > last || (e.end && e.end < first)) return { ...BORDRO.month(P, { gross: 0, days: 0, cum, month: mo }), st, monthlyGross: 0, otPay: 0, deduct: 0, lost: 0 };
    const gross = isNet(e) ? BORDRO.grossFromNet(P, e.salary, { cum, month: mo }) : e.salary;
    // Ay içinde işe giriş/çıkış ve ücretsiz izin/devamsızlık SGK gününden düşer
    const pre = e.start > first ? Number(e.start.slice(8)) - 1 : 0;
    const post = e.end && e.end < last ? 30 - Math.min(30, Number(e.end.slice(8))) : 0;
    const lost = st.U + st.D;
    const days = Math.max(0, 30 - pre - post - lost);
    const otPay = Math.round(st.ot * (gross / S().monthHours) * S().otRate * 100) / 100;
    const m = BORDRO.month(P, { gross, days, extra: otPay, cum, month: mo });
    return { ...m, st, monthlyGross: gross, otPay, deduct: Math.round((gross * (30 - days)) / 30), lost };
  }
  function payroll(e, ym) {
    const P = BP(); const y = ym.slice(0, 4), mo = Number(ym.slice(5));
    // Gelir vergisi kümülatif: yılbaşından bu aya kadarki matrahlar
    let cum = 0;
    for (let k = 1; k < mo; k++) cum = monthCalc(e, `${y}-${NS.pad(k)}`, P, cum, k).cumAfter;
    const r = monthCalc(e, ym, P, cum, mo);
    const adv = sum(db.all('advances', (a) => a.emp === e.id && a.date.startsWith(ym)), (a) => a.amount);
    return { ...r, cumBefore: cum, base: r.monthlyGross, adv, netSalary: r.net, net: Math.round((r.net - adv) * 100) / 100 };
  }

  // ---------- Puantaj ----------
  let ym = today().slice(0, 7);
  function timesheetPage(el, p, app) {
    const days = monthDays(ym);
    const list = emps().sort((a, b) => a.dept.localeCompare(b.dept, 'tr') || a.name.localeCompare(b.name, 'tr'));
    el.innerHTML = pageHead('Puantaj', 'Hücreye tıklayarak durumu değiştirin · sağ tık ile fazla mesai girin', `<button class="btn icon" data-m="-1">${icon('left')}</button><b>${NS.MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}</b><button class="btn icon" data-m="1">${icon('right')}</button><button class="btn" id="fill">${icon('check')} Bugünü "çalıştı" doldur</button><button class="btn" id="pdks">${icon('clock')} PDKS’den aktar</button><button class="btn" id="ex">${icon('download')}</button>`) + `
      <div class="row mb small">${Object.entries(PS).map(([k, v]) => `<span class="badge s-${k}" style="border:0">${k} · ${v}</span>`).join('')}</div>
      <div class="card pt-wrap"><table class="pt"><thead><tr><th class="nm">Personel</th>${days.map((d) => { const dw = new Date(d + 'T12:00').getDay(); return `<th class="${dw === 0 || dw === 6 ? 'we' : ''}" title="${NS.DAYS[dw]}">${Number(d.slice(8))}<br><span style="font-weight:400">${NS.DAYS[dw].slice(0, 2)}</span></th>`; }).join('')}<th>Ç</th><th>İzin</th><th>Rapor</th><th>Dev.</th><th>FM</th></tr></thead>
      <tbody>${list.map((e) => { const st = monthStats(e, ym); return `<tr><td class="nm"><b>${esc(e.name)}</b><div class="small faint">${esc(e.dept)} · ${esc(e.title)}</div></td>${days.map((d) => { const c = cell(e.id, d); return `<td class="d ${c ? 's-' + c.s : ''}" data-c="${e.id}|${d}">${c ? c.s : d <= today() ? '<span class="faint">·</span>' : ''}${c && c.ot ? `<span class="ot">+${c.ot}s</span>` : ''}</td>`; }).join('')}<td class="tot">${st.C}</td><td class="tot">${st.I}</td><td class="tot">${st.R}</td><td class="tot" style="color:var(--err)">${st.D + st.U}</td><td class="tot" style="color:var(--accent)">${st.ot}s</td></tr>`; }).join('')}</tbody></table></div>`;
    on(el, 'click', '[data-m]', (e, b) => { const d = new Date(ym + '-15'); d.setMonth(d.getMonth() + Number(b.dataset.m)); ym = iso(d).slice(0, 7); app.refresh(); });
    on(el, 'click', '[data-c]', (e, td) => {
      const k = td.dataset.c; const [, d] = k.split('|'); const c = db.data.ts[k];
      const next = c ? CYCLE[(CYCLE.indexOf(c.s) + 1) % CYCLE.length] : defaultStatus(d);
      db.data.ts[k] = { s: next, ot: next === 'C' && c ? c.ot : 0 }; db.save();
      td.className = 'd s-' + next; td.innerHTML = next + (db.data.ts[k].ot ? `<span class="ot">+${db.data.ts[k].ot}s</span>` : '');
    });
    el.addEventListener('contextmenu', async (e) => {
      const td = e.target.closest('[data-c]'); if (!td) return; e.preventDefault();
      const k = td.dataset.c; const c = db.data.ts[k] || { s: 'C', ot: 0 };
      const v = await NS.prompt(`Fazla mesai (saat) — ${emp(k.split('|')[0]).name} ${NS.date(k.split('|')[1])}`, c.ot || 0, { type: 'number', title: 'Fazla mesai' });
      if (v === null) return; db.data.ts[k] = { s: 'C', ot: Math.max(0, Number(v) || 0) }; db.save(); app.refresh();
    });
    // PDKS cihazından giriş-çıkışlar alınır: giriş varsa "C", mesai saatini aşan süre fazla mesai olarak yazılır
    $('#pdks', el).onclick = async () => {
      if (!NS.integ) return; const r = await NS.integ.call('pdks', 'hareketler', { month: ym }); if (!r || !r.ok) return;
      let recs = r.data && Array.isArray(r.data.records) ? r.data.records : [];
      if (r.simulated) recs = emps().flatMap((e) => days.filter((d) => d <= today() && defaultStatus(d) === 'C' && !cell(e.id, d)).map((d) => { const out = 17 + (Math.random() < 0.2 ? NS.rand(1, 3) : 0); return { tc: e.tc, emp: e.id, date: d, in: '08:' + String(NS.rand(0, 15)).padStart(2, '0'), out: out + ':' + String(NS.rand(0, 59)).padStart(2, '0') }; })).filter(() => Math.random() > 0.03);
      let n = 0; recs.forEach((x) => { const e = x.emp ? emp(x.emp) : db.find('employees', (y) => y.tc === x.tc); if (!e || !e.id) return; const hrs = (Number(x.out.split(':')[0]) + Number(x.out.split(':')[1]) / 60) - (Number(x.in.split(':')[0]) + Number(x.in.split(':')[1]) / 60) - 1; db.data.ts[`${e.id}|${x.date}`] = { s: 'C', ot: Math.max(0, Math.round((hrs - 8) * 2) / 2), in: x.in, out: x.out }; n++; });
      db.save(); toast(`${n} giriş-çıkış kaydı puantaja işlendi`, 'ok'); app.refresh();
    };
    $('#fill', el).onclick = () => { const t = today(); let n = 0; emps().forEach((e) => { const k = `${e.id}|${t}`; if (!db.data.ts[k]) { db.data.ts[k] = { s: defaultStatus(t), ot: 0 }; n++; } }); db.save(); toast(`${n} personel için bugün işlendi`, 'ok'); app.refresh(); };
    $('#ex', el).onclick = () => NS.csv(`puantaj-${ym}`, list.map((e) => ({ e, st: monthStats(e, ym) })), [{ label: 'Personel', value: (r) => r.e.name }, { label: 'Departman', value: (r) => r.e.dept }, ...days.map((d) => ({ label: d.slice(8), value: (r) => (cell(r.e.id, d) || {}).s || '' })), { label: 'Çalışılan', value: (r) => r.st.C }, { label: 'İzin', value: (r) => r.st.I }, { label: 'Rapor', value: (r) => r.st.R }, { label: 'Devamsız', value: (r) => r.st.D }, { label: 'FM saat', value: (r) => r.st.ot }]);
  }

  // ---------- Personel ----------
  const EF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'tc', label: 'TC kimlik no' }, { name: 'dept', label: 'Departman', type: 'select', options: ['Üretim', 'Satış', 'Lojistik', 'İdari'] }, { name: 'title', label: 'Görev' }, { name: 'start', label: 'İşe giriş', type: 'date', required: true }, { name: 'salary', label: 'Maaş (₺)', type: 'number', required: true }, { name: 'salaryType', label: 'Maaş türü', type: 'select', options: [{ value: 'net', label: 'Net (anlaşılan ele geçen)' }, { value: 'brut', label: 'Brüt' }] }, { name: 'phone', label: 'Telefon' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'iban', label: 'IBAN', full: true }, { name: 'active', label: 'Aktif çalışan', type: 'checkbox' }];
  let wasActive = true;
  function employeesPage(el, p, app) {
    NS.crud(el, app, {
      col: 'employees', title: 'Personel', sub: 'Özlük bilgileri, kıdem ve izin hakları', single: 'Personel', addLabel: 'Yeni personel', emptyIcon: 'users', fields: EF, defaults: () => ({ start: today(), active: true, dept: 'Üretim' }),
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (e) => [e.name, e.tc, e.dept, e.title],
      rowsFilter: (e) => !myDept() || e.dept === myDept(),
      filters: [{ value: 'all', label: 'Aktif', test: (e) => e.active !== false }, { value: 'x', label: 'Ayrılanlar', test: (e) => e.active === false }],
      extraActions: [{ icon: 'file', act: 'sev', title: 'Kıdem / ihbar tazminatı hesapla' }],
      onAction: (a, e) => severanceModal(e),
      beforeSave: (v, rec) => { wasActive = rec ? rec.active !== false : true; },
      onSave: (v, rec) => {
        // SGK: yeni personelde işe giriş, pasife alınanda işten çıkış bildirimi
        if (!NS.integ || !NS.integ.isOn('sgk')) return;
        const e = rec ? db.get('employees', rec.id) : db.all('employees').slice(-1)[0];
        if (!rec) NS.integ.call('sgk', 'ise-giris', { tc: e.tc, name: e.name, start: e.start, title: e.title, dept: e.dept }).then((r) => { if (r && r.ok) { e.sgkIn = r.ref; db.save(); } });
        else if (wasActive && v.active === false) NS.integ.call('sgk', 'isten-cikis', { tc: e.tc, name: e.name, end: today(), code: '04' }).then((r) => { if (r && r.ok) { e.sgkOut = r.ref; e.end = today(); db.save(); } });
      },
      columns: [{ key: 'name', label: 'Personel', render: (e) => `<div class="row nw"><div class="avatar">${esc(NS.initials(e.name))}</div><div><b>${esc(e.name)}</b><div class="small faint">${esc(e.title || '')}${e.sgkIn ? ' · SGK giriş ✓' : ''}${e.sgkOut ? ' · SGK çıkış ✓' : ''}</div></div></div>` }, { key: 'dept', label: 'Departman', render: (e) => badge(e.dept, 'acc') }, { key: 'start', label: 'Kıdem', render: (e) => `${NS.date(e.start)}<div class="small faint">${seniority(e)} yıl</div>` }, { label: 'Yıllık izin', render: (e) => `${usedLeave(e)} / ${entitlement(e)} gün` }, { key: 'salary', label: 'Net maaş', cls: 'right', render: (e) => money(e.salary) }],
    });
  }

  // İşten çıkışta ödenecek kıdem, ihbar ve kullanılmayan izin ücreti
  function severanceModal(e) {
    const P = BP();
    const remain = Math.max(0, entitlement(e) - usedLeave(e));
    const draw = (b) => {
      const end = $('[name=end]', b).value || today();
      const ym2 = end.slice(0, 7); const pr = payroll(e, ym2);
      const r = BORDRO.severance(P, { start: e.start, end, gross: pr.monthlyGross || e.salary, notice: $('[name=notice]', b).checked, leaveDays: Number($('[name=leave]', b).value) || 0, cum: pr.cumAfter });
      const row = (l, v, strong) => `<tr><td>${l}</td><td class="right">${strong ? `<b>${money(v)}</b>` : money(v)}</td></tr>`;
      $('#sv', b).innerHTML = `<table class="tbl"><tbody>
        <tr><td colspan="2" class="small muted">Kıdem: ${r.years} yıl · esas brüt ${money(r.kidemBase)}${r.capped ? ' (tavandan)' : ''}</td></tr>
        ${row('Kıdem tazminatı (brüt)', r.kidem)}${row('Damga vergisi', -r.kidemStamp)}${row('Kıdem tazminatı (net)', r.kidemNet, true)}
        <tr><td colspan="2" class="small muted">İhbar süresi: ${r.weeks} hafta${$('[name=notice]', b).checked ? '' : ' — süre kullandırıldı, ödeme yok'}</td></tr>
        ${row('İhbar tazminatı (brüt)', r.ihbar)}${row('Gelir + damga vergisi', -(r.ihbarTax + r.ihbarStamp))}${row('İhbar tazminatı (net)', r.ihbarNet, true)}
        <tr><td colspan="2" class="small muted">Kullanılmayan izin: ${r.leaveDays} gün</td></tr>${row('İzin ücreti (brüt)', r.leavePay)}${row('İzin ücreti (net)', r.leaveNet, true)}
        <tr><td><b>Toplam net ödeme</b></td><td class="right"><b style="font-size:20px">${money(r.kidemNet + r.ihbarNet + r.leaveNet)}</b></td></tr></tbody></table>
        ${seniority(e) < 1 ? '<p class="small" style="color:var(--warn)">1 yılı doldurmayan çalışana kıdem tazminatı ödenmez.</p>' : ''}`;
      b._r = r;
    };
    NS.modal({ title: `Tazminat hesabı — ${e.name}`, size: 'wide',
      body: `<div class="form-grid"><div class="field"><label>İşten ayrılış tarihi</label><input class="input" type="date" name="end" value="${today()}"></div><div class="field"><label>Kullanılmayan izin (gün)</label><input class="input" type="number" name="leave" value="${remain}" min="0"></div><label class="check full"><input type="checkbox" name="notice" checked> İhbar süresi kullandırılmadan çıkış (ihbar tazminatı ödenecek)</label></div><div id="sv" class="mt"></div><p class="small faint">Giriş: ${NS.date(e.start)} · Hesap, bordro parametreleri ve son ayın kümülatif matrahıyla yapılır. Giydirilmiş ücret (yol, yemek vb.) için brüt maaşı güncelleyin.</p>`,
      onOpen: (b) => { draw(b); b.addEventListener('input', () => draw(b)); b.addEventListener('change', () => draw(b)); },
      actions: [{ label: 'Kapat' }, { label: 'Yazdır', icon: 'print', cls: 'primary', onClick: (close, b) => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>KIDEM / İHBAR TAZMİNATI HESAP PUSULASI</h3><p><b>${esc(e.name)}</b> · TC ${esc(e.tc || '-')} · Giriş ${NS.date(e.start)} · Çıkış ${NS.date($('[name=end]', b).value)}</p>${$('#sv', b).innerHTML}</div>`, { title: 'Tazminat' }) }] });
  }

  // ---------- İzin ----------
  function leavesPage(el, p, app) {
    const ST = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi', 'err'] };
    const T = { I: 'Yıllık izin', R: 'Rapor', U: 'Ücretsiz izin' };
    const rows = db.all('leaves', (l) => !myDept() || emp(l.emp).dept === myDept()).sort((a, b) => (a.status === 'bekliyor' ? -1 : 1) - (b.status === 'bekliyor' ? -1 : 1) || b.from.localeCompare(a.from));
    el.innerHTML = pageHead('İzin Yönetimi', 'Talepler onaylandığında puantaja otomatik işlenir', `<button class="btn primary" id="nl">${icon('plus')} İzin talebi</button>`) + `
      <div class="grid g-21"><div class="card">${table({ rows, empty: 'İzin talebi yok', columns: [{ label: 'Personel', render: (l) => `<b>${esc(emp(l.emp).name)}</b><div class="small faint">${esc(emp(l.emp).dept)}</div>` }, { label: 'Tür', render: (l) => badge(T[l.type], l.type === 'R' ? 'warn' : 'info') }, { label: 'Tarih', render: (l) => `${NS.date(l.from)} – ${NS.date(l.to)}<div class="small faint">${daysBetween(l.from, l.to) + 1} gün</div>` }, { label: 'Not', render: (l) => `<span class="small">${esc(l.note || '')}</span>` }, { label: 'Durum', render: (l) => badge(ST[l.status][0], ST[l.status][1]) }], actions: [{ label: 'Onayla', act: 'ok', show: (l) => l.status === 'bekliyor' }, { label: 'Reddet', act: 'no', show: (l) => l.status === 'bekliyor' }] })}</div>
      <div class="card"><div class="card-h"><h3>İzin bakiyeleri</h3></div><div class="card-b" style="max-height:520px;overflow:auto">${emps().map((e) => { const u = usedLeave(e), t = entitlement(e); return `<div class="list-item small"><div class="grow"><b>${esc(e.name)}</b><div class="progress mt"><i style="width:${t ? Math.min(100, (u / t) * 100) : 0}%"></i></div></div><span>${t - u} gün kaldı</span></div>`; }).join('')}</div></div></div>`;
    $('#nl', el).onclick = async () => { const v = await formModal({ title: 'İzin talebi', fields: [{ name: 'emp', label: 'Personel', type: 'select', options: emps().map((e) => ({ value: e.id, label: e.name })) }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(T).map(([value, label]) => ({ value, label })) }, { name: 'from', label: 'Başlangıç', type: 'date', required: true, value: today() }, { name: 'to', label: 'Bitiş', type: 'date', required: true, value: today() }, { name: 'note', label: 'Açıklama', full: true }] }); if (v) { if (v.to < v.from) return toast('Bitiş tarihi başlangıçtan önce olamaz', 'err'); if (v.type === 'I') { const e = emp(v.emp); const n = daysBetween(v.from, v.to) + 1; if (usedLeave(e) + n > entitlement(e) && !(await confirm(`${e.name} için izin hakkı aşılıyor (${entitlement(e) - usedLeave(e)} gün kaldı). Yine de oluşturulsun mu?`, { ok: 'Oluştur', danger: false }))) return; } db.insert('leaves', { ...v, status: 'bekliyor' }); app.refresh(); } };
    on(el, 'click', '[data-act]', (e, b) => {
      const l = db.get('leaves', b.dataset.id);
      l.status = b.dataset.act === 'ok' ? 'onay' : 'red';
      if (l.status === 'onay') for (let d = l.from; d <= l.to; d = iso(addDays(d, 1))) if (defaultStatus(d) === 'C') db.data.ts[`${l.emp}|${d}`] = { s: l.type, ot: 0 };
      db.log('İzin ' + (l.status === 'onay' ? 'onaylandı' : 'reddedildi'), emp(l.emp).name); db.save(); app.refresh();
    });
  }

  // ---------- Maaş ----------
  function payrollPage(el, p, app) {
    const rows = emps().map((e) => ({ id: e.id, e, ...payroll(e, ym) }));
    const P = BP(); const T = (k) => sum(rows, (r) => r[k]);
    const gov = T('sgk') + T('unemp') + T('sgkEr') + T('unempEr') + T('incomeTax') + T('stamp');
    el.innerHTML = pageHead('Bordro', `${NS.MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`, `<button class="btn icon" data-m="-1" aria-label="Önceki ay">${icon('left')}</button><button class="btn icon" data-m="1" aria-label="Sonraki ay">${icon('right')}</button><button class="btn" id="adv">${icon('plus')} Avans ver</button><button class="btn" id="slips">${icon('print')} Bordro pusulaları</button><button class="btn" id="pr">${icon('print')} Ödeme listesi</button><button class="btn" id="ex">${icon('download')} Banka listesi (CSV)</button><button class="btn" id="bank">${icon('building')} Bankaya talimat</button><button class="btn" id="eb">${icon('mail')} e-Bordro gönder</button>`) + `
      <div class="grid g4 mb">${kpi('Personele ödenecek', money(T('net')), 'wallet', 'ok')}${kpi('Toplam brüt', money(T('gross')), 'cash', 'info')}${kpi('İşveren maliyeti', money(T('cost')), 'building')}${kpi('SGK + vergi (muhtasar)', money(gov), 'percent', 'warn')}</div>
      <div class="card">${table({ rows, columns: [
        { label: 'Personel', render: (r) => `<b>${esc(r.e.name)}</b><div class="small faint">${esc(r.e.dept)} · ${isNet(r.e) ? 'net ' + money(r.e.salary) : 'brüt'}${r.monthlyGross && r.monthlyGross < P.minGross ? ' · <span style="color:var(--err)">asgari ücretin altında</span>' : ''}</div>` },
        { label: 'Gün', cls: 'right', render: (r) => `${r.days}${r.lost ? ` <span class="small" style="color:var(--err)">−${r.lost}</span>` : ''}${r.st.empty ? `<div class="faint small">${r.st.empty} boş</div>` : ''}` },
        { label: 'Brüt', cls: 'right', render: (r) => `${money(r.gross)}${r.otPay ? `<div class="small" style="color:var(--accent)">+${r.st.ot}s FM ${money(r.otPay)}</div>` : ''}` },
        { label: 'SGK + işsizlik', cls: 'right', render: (r) => money(r.sgk + r.unemp) },
        { label: 'Gelir v.', cls: 'right', render: (r) => `${money(r.incomeTax)}${r.taxEx ? `<div class="small faint">istisna ${money(r.taxEx)}</div>` : ''}` },
        { label: 'Damga v.', cls: 'right', render: (r) => money(r.stamp) },
        { label: 'Net', cls: 'right', render: (r) => money(r.netSalary) },
        { label: 'Avans', cls: 'right', render: (r) => (r.adv ? `<span style="white-space:nowrap">−${money(r.adv)}</span>` : '-') },
        { label: 'Ödenecek', cls: 'right', render: (r) => `<b>${money(r.net)}</b>` },
        { label: 'İşveren maliyeti', cls: 'right', render: (r) => money(r.cost) },
      ], actions: [{ icon: 'print', act: 'slip', title: 'Bordro pusulası' }], foot: `${rows.length} personel · kümülatif GV matrahı yılbaşından itibaren hesaplanır` })}</div>
      <p class="small faint mt">SGK günü puantajdan (ücretsiz izin, devamsızlık, ay içi giriş/çıkış) gelir; gelir vergisi yılbaşından kümülatif matrahla ve asgari ücret istisnası düşülerek hesaplanır. ${P.year} parametreleri: asgari ücret ${money(P.minGross)} brüt · SGK tavanı ${money(P.minGross * P.ceilingX)} · işveren SGK %${P.sgkEr} (teşvik −${P.incentive} puan). Değerler Ayarlar &gt; Bordro'dan güncellenir; resmi beyan öncesi mali müşavirinizle teyit edin.</p>`;
    const slip = (r) => `<div class="doc" style="page-break-after:always"><h2>${esc(S().bizName)}</h2><h3>ÜCRET BORDROSU — ${NS.MONTHS[Number(ym.slice(5)) - 1].toLocaleUpperCase('tr')} ${ym.slice(0, 4)}</h3>
      <p><b>${esc(r.e.name)}</b> · TC ${esc(r.e.tc || '-')} · ${esc(r.e.dept)} / ${esc(r.e.title || '')} · İşe giriş ${NS.date(r.e.start)}</p>
      <table><tr><th>Kazançlar</th><th style="text-align:right">Tutar</th><th>Kesintiler</th><th style="text-align:right">Tutar</th></tr>
      <tr><td>Aylık brüt ücret (${r.days} gün)</td><td style="text-align:right">${money(r.gross - r.otPay)}</td><td>SGK işçi payı (%${P.sgkEmp})</td><td style="text-align:right">${money(r.sgk)}</td></tr>
      <tr><td>Fazla mesai (${r.st.ot} saat)</td><td style="text-align:right">${money(r.otPay)}</td><td>İşsizlik işçi payı (%${P.unempEmp})</td><td style="text-align:right">${money(r.unemp)}</td></tr>
      <tr><td></td><td></td><td>Gelir vergisi (istisna ${money(r.taxEx)} düşüldü)</td><td style="text-align:right">${money(r.incomeTax)}</td></tr>
      <tr><td></td><td></td><td>Damga vergisi (istisna ${money(r.stampEx)} düşüldü)</td><td style="text-align:right">${money(r.stamp)}</td></tr>
      <tr><td></td><td></td><td>Avans</td><td style="text-align:right">${money(r.adv)}</td></tr>
      <tr><th>Toplam brüt</th><th style="text-align:right">${money(r.gross)}</th><th>Net ödenecek</th><th style="text-align:right">${money(r.net)}</th></tr></table>
      <p style="font-size:12px">SGK matrahı ${money(r.sgkBase)} · GV matrahı ${money(r.base)} · Kümülatif GV matrahı ${money(r.cumAfter)} · İşveren SGK ${money(r.sgkEr)} · İşveren işsizlik ${money(r.unempEr)} · İşveren maliyeti ${money(r.cost)}</p>
      <p style="margin-top:36px;display:flex;justify-content:space-between"><span>İşveren</span><span>Personel imzası</span></p></div>`;
    on(el, 'click', '[data-act="slip"]', (e, b) => { const r = rows.find((x) => x.id === b.dataset.id); NS.printHtml(slip(r), { title: 'Bordro pusulası' }); });
    $('#slips', el).onclick = () => NS.printHtml(rows.map(slip).join(''), { title: 'Bordro pusulaları' });
    on(el, 'click', '[data-m]', (e, b) => { const d = new Date(ym + '-15'); d.setMonth(d.getMonth() + Number(b.dataset.m)); ym = iso(d).slice(0, 7); app.refresh(); });
    $('#adv', el).onclick = async () => { const v = await formModal({ title: 'Avans', fields: [{ name: 'emp', label: 'Personel', type: 'select', options: emps().map((e) => ({ value: e.id, label: e.name })) }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'note', label: 'Not' }] }); if (v) { db.insert('advances', v); app.refresh(); } };
    $('#pr', el).onclick = () => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>MAAŞ ÖDEME LİSTESİ — ${NS.MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}</h3><table><tr><th>Personel</th><th>IBAN</th><th style="text-align:right">Tutar</th><th>İmza</th></tr>${rows.map((r) => `<tr><td>${esc(r.e.name)}</td><td style="font-family:monospace">${esc(r.e.iban || '')}</td><td style="text-align:right">${money(r.net)}</td><td style="width:120px"></td></tr>`).join('')}<tr><td colspan="2"><b>TOPLAM</b></td><td style="text-align:right"><b>${money(sum(rows, (r) => r.net))}</b></td><td></td></tr></table></div>`, { title: 'Maaş listesi' });
    $('#bank', el).onclick = async () => {
      const miss = rows.filter((r) => !r.e.iban); if (miss.length && !(await confirm(`${miss.length} personelin IBAN’ı yok, listeye alınmayacak. Devam edilsin mi?`, { ok: 'Devam', danger: false }))) return;
      const list = rows.filter((r) => r.e.iban && r.net > 0).map((r) => ({ name: r.e.name, iban: r.e.iban, amount: r.net, desc: `${ym} maaş` }));
      const r = NS.integ ? await NS.integ.call('bankamaas', 'toplu-odeme', { month: ym, total: sum(list, (x) => x.amount), list }) : null;
      if (r && r.ok) { db.saveSettings({ ['paid_' + ym]: r.ref }); toast(`${list.length} kişilik maaş talimatı bankaya iletildi (${r.ref})`, 'ok'); }
    };
    $('#eb', el).onclick = async () => {
      const r = NS.integ ? await NS.integ.call('ebordro', 'gonder', { month: ym, list: rows.map((x) => ({ tc: x.e.tc, name: x.e.name, phone: x.e.phone, gross: x.gross, days: x.days, sgk: x.sgk, unemp: x.unemp, incomeTax: x.incomeTax, stamp: x.stamp, netSalary: x.netSalary, net: x.net, ot: x.otPay, adv: x.adv })) }) : null;
      if (r && r.ok) toast(`${rows.length} personele e-bordro iletildi`, 'ok');
    };
    $('#ex', el).onclick = () => NS.csv(`maas-${ym}`, rows, [{ label: 'Ad Soyad', value: (r) => r.e.name }, { label: 'IBAN', value: (r) => r.e.iban }, { label: 'Tutar', value: (r) => r.net }, { label: 'Açıklama', value: () => `${ym} maaş` }]);
  }

  function dashboard(el, p, app) {
    const es = emps(); const t = today();
    const todayC = es.map((e) => ({ e, c: cell(e.id, t) }));
    const absent = todayC.filter((x) => x.c && ['I', 'R', 'U', 'D'].includes(x.c.s));
    const pending = db.all('leaves', (l) => l.status === 'bekliyor');
    const bdays = es.filter((e) => e.birth && [0, 1, 2, 3, 4, 5, 6].some((k) => iso(addDays(new Date(), k)).slice(5) === e.birth.slice(5)));
    const anniv = es.filter((e) => e.start.slice(5, 7) === t.slice(5, 7) && seniority(e) >= 1);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/puantaj">${icon('grid')} Puantaj</a>`) + `
      <div class="grid g4 mb">${kpi('Aktif personel', es.length, 'users')}${kpi('Bugün işte', todayC.filter((x) => !x.c || x.c.s === 'C').length, 'check', 'ok')}${kpi('Bugün izinli/raporlu', absent.length, 'calendar', 'warn')}${kpi('Onay bekleyen izin', pending.length, 'bell', 'info')}</div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>Bugün yok</h3></div><div class="card-b">${absent.map((x) => `<div class="list-item small"><b class="grow">${esc(x.e.name)}</b><span class="badge s-${x.c.s}" style="border:0">${PS[x.c.s]}</span></div>`).join('') || '<div class="faint small">Herkes işte</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('gift')} Doğum günleri (7 gün)</h3></div><div class="card-b">${bdays.map((e) => `<div class="list-item small"><b class="grow">${esc(e.name)}</b>${NS.date(e.birth).slice(0, 5)}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('award')} Bu ay iş yıldönümü</h3></div><div class="card-b">${anniv.map((e) => `<div class="list-item small"><b class="grow">${esc(e.name)}</b>${seniority(e)}. yıl</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Departman dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(es, (e) => e.dept)).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Bu ay devamsızlık (gün)</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(es, (e) => e.dept)).map(([label, v]) => ({ label, value: sum(v, (e) => { const st = monthStats(e, t.slice(0, 7)); return st.D + st.U + st.R; }) })), { color: '#dc2626' })}</div></div></div>`;
  }

  const ROLES = { admin: 'İK / Yönetici', sef: 'Departman şefi' };
  NS.shell({
    id: 'ik', integrations: ['sms', 'whatsapp', 'email', 'printer', 'webhook', 'backup'], name: 'Personel & Puantaj', tagline: 'İnsan Kaynakları', icon: 'users', accent: '#475569', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'İK' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'puantaj', label: 'Puantaj', icon: 'grid' }, { id: 'izinler', label: 'İzinler', icon: 'calendar' }, { id: 'personel', label: 'Personel', icon: 'users' }, { sec: 'Bordro' }, { id: 'maas', label: 'Bordro & Avans', icon: 'wallet', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, puantaj: timesheetPage, izinler: leavesPage, personel: employeesPage, maas: payrollPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Hesaplama' }, { name: 'monthHours', label: 'Aylık çalışma saati', type: 'number' }, { name: 'otRate', label: 'Fazla mesai katsayısı', type: 'number', step: '0.1' }, { type: 'section', label: `Bordro parametreleri (boş bırakılan alanda ${BORDRO.DEFAULTS.year} varsayılanı kullanılır)` }, { name: 'year', label: 'Parametre yılı', type: 'number', placeholder: String(BORDRO.DEFAULTS.year) }, { name: 'minGross', label: 'Asgari ücret (brüt ₺)', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.minGross) }, { name: 'ceilingX', label: 'SGK tavanı (asgari ücretin katı)', type: 'number', step: '0.5', placeholder: String(BORDRO.DEFAULTS.ceilingX) }, { name: 'sgkEmp', label: 'SGK işçi payı %', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.sgkEmp) }, { name: 'unempEmp', label: 'İşsizlik işçi payı %', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.unempEmp) }, { name: 'sgkEr', label: 'SGK işveren payı %', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.sgkEr) }, { name: 'unempEr', label: 'İşsizlik işveren payı %', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.unempEr) }, { name: 'incentive', label: 'Hazine teşviki (puan)', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.incentive) }, { name: 'stampPermille', label: 'Damga vergisi (binde)', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.stampPermille) }, { name: 'severanceCap', label: 'Kıdem tazminatı tavanı (₺)', type: 'number', step: '0.01', placeholder: String(BORDRO.DEFAULTS.severanceCap) }, { name: 'brackets', label: 'Gelir vergisi tarifesi (üst sınır:oran, son dilim 0:oran)', full: true, placeholder: BORDRO.DEFAULTS.brackets }] }) },
  });
})();
