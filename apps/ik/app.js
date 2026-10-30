/* NEBSOFT Personel & Puantaj — özlük, puantaj, vardiya, izin, avans, bordro dönemi, belge ve zimmet */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const PS = { C: 'Çalıştı', H: 'Hafta tatili', B: 'Resmi tatil', T: 'Tatilde çalıştı', I: 'Yıllık izin', R: 'Raporlu', U: 'Ücretsiz izin', D: 'Devamsız' };
  const CYCLE = ['C', 'I', 'R', 'U', 'D', 'H', 'B', 'T'];
  // Sabit günler — 2429 sayılı Kanun (mevzuat.gov.tr/mevzuatmetin/1.5.2429.htm, okundu 30.10.2026 — DOĞRULANDI). Dinî bayramlar her yıl değişir: Ayarlar'dan girilir.
  const HOLIDAYS = ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'];
  const LT = { I: 'Yıllık izin', R: 'Rapor', U: 'Ücretsiz izin' };
  const FM_YEAR = 270; // 4857 md. 41: yılda en çok 270 saat
  const r2 = (x) => Math.round(x * 100) / 100;
  const DAY3 = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

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
    db.data.shifts = [{ id: 'v1', name: 'Sabah', start: '08:00', end: '16:30', color: '#2563eb' }, { id: 'v2', name: 'Akşam', start: '16:00', end: '00:30', color: '#d97706' }, { id: 'v3', name: 'Gece', start: '00:00', end: '08:00', color: '#7c3aed' }];
    db.data.roster = {}; db.data.files = []; db.data.payClosed = [];
  }
  const db = new NS.DB('ik', seed);
  const S = () => db.settings({ otRate: 1.5, monthHours: 225 });
  const emp = (id) => db.get('employees', id) || { name: '-' };
  const cell = (eid, d) => db.data.ts[`${eid}|${d}`];
  const isSef = () => !!(NS.currentUser && NS.currentUser.role === 'sef');
  // Şefin departmanı yoksa hiçbir personeli görmez (önceden tüm şirketi görüyordu)
  const myDept = () => (isSef() ? NS.currentUser.dept || '' : null);
  const inScope = (e) => !isSef() || (!!myDept() && e.dept === myDept());
  const emps = () => db.all('employees', (e) => e.active !== false && inScope(e));

  // Tek geçişte özetler: izin, fazla mesai, avans, kapalı dönem (binlerce personel × gün). Aynı görevde bir kez kurulur, yazınca dirty().
  let TI = null, GF = null, BPC = null, AV = null, CM = null, HS = null;
  const dirty = () => { TI = null; GF = null; BPC = null; AV = null; CM = null; HS = null; };
  const later = () => setTimeout(dirty, 0);
  const tsIndex = () => { if (TI) return TI; const used = {}, fm = {}; let first = null; const ts = db.data.ts || {}; for (const k in ts) { const i = k.indexOf('|'); const eid = k.slice(0, i), d = k.slice(i + 1), v = ts[k]; if (!first || d < first) first = d; if (v.s === 'I') used[eid] = (used[eid] || 0) + 1; if (v.ot) { const y = eid + '|' + d.slice(0, 4); fm[y] = (fm[y] || 0) + v.ot; } } TI = { used, fm, first }; later(); return TI; };
  const balance = (e) => { const t = tsIndex(); return BORDRO.leaveBalance(e, { asOf: today(), used: t.used[e.id] || 0, trackFrom: t.first || today() }); };
  const fmYear = (eid, y) => tsIndex().fm[eid + '|' + y] || 0;
  const closedMap = () => { if (CM) return CM; CM = {}; db.all('payClosed').forEach((c) => { CM[c.ym] = { c, rows: Object.fromEntries((c.rows || []).map((r) => [r.emp, r])) }; }); later(); return CM; };
  const isClosed = (m) => !!closedMap()[m];
  const hols = () => { if (HS) return HS; HS = new Set(String(S().hol || '').split(/[\s,;]+/).filter(Boolean)); later(); return HS; };
  const isHol = (d) => HOLIDAYS.includes(d.slice(5)) || hols().has(d);
  const defaultStatus = (d) => (new Date(d + 'T12:00').getDay() === 0 ? 'H' : isHol(d) ? 'B' : 'C');
  const dates = (a, b) => { const out = []; for (let d = a; d <= b; d = iso(addDays(d + 'T12:00', 1))) out.push(d); return out; };
  const workDays = (a, b) => dates(a, b).filter((d) => defaultStatus(d) === 'C');
  const seniority = (e) => BORDRO.fullYears(e.start, e.end || today());
  const MD = {}; const monthDays = (m) => { if (MD[m]) return MD[m]; const [y, mo] = m.split('-').map(Number); return (MD[m] = Array.from({ length: new Date(y, mo, 0).getDate() }, (_, i) => `${m}-${NS.pad(i + 1)}`)); };
  // O ay bordroya/puantaja girenler: ay içinde ayrılan da girer (eskiden pasife alınan kişinin son maaşı listeden düşüyordu)
  const inMonth = (e, m) => { const days = monthDays(m); const a = days[0], b = days[days.length - 1]; return inScope(e) && e.start <= b && (e.end ? e.end >= a : e.active !== false); };
  const monthEmps = (m) => db.all('employees', (e) => inMonth(e, m));
  function monthStats(e, m) {
    const st = { C: 0, H: 0, B: 0, T: 0, I: 0, R: 0, U: 0, D: 0, ot: 0, empty: 0 }; const t = today();
    monthDays(m).forEach((d) => { const c = cell(e.id, d); if (!c) { if (d <= t) st.empty++; return; } st[c.s] = (st[c.s] || 0) + 1; st.ot += c.ot || 0; });
    return st;
  }
  // Bordro parametreleri: Ayarlar'da girilen değer yoksa bordro.js varsayılanı
  const BP = () => { if (BPC) return BPC; const s = S(); BPC = Object.fromEntries(Object.keys(BORDRO.DEFAULTS).map((k) => [k, s[k] === undefined || s[k] === '' ? BORDRO.DEFAULTS[k] : s[k]])); later(); return BPC; };
  const isNet = (e) => e.salaryType !== 'brut';
  const grossNet = (P, e, cum, mo) => { GF = GF || new Map(); if (!GF.size) later(); const k = `${e.salary}|${cum}|${mo}`; if (!GF.has(k)) GF.set(k, BORDRO.grossFromNet(P, e.salary, { cum, month: mo })); return GF.get(k); };
  function monthCalc(e, m, P, cum, mo) {
    const st = monthStats(e, m); const list = monthDays(m); const first = list[0], last = list[list.length - 1];
    if (e.start > last || (e.end && e.end < first)) return { ...BORDRO.month(P, { gross: 0, days: 0, cum, month: mo }), st, monthlyGross: 0, otPay: 0, holPay: 0, deduct: 0, lost: 0 };
    const gross = isNet(e) ? grossNet(P, e, cum, mo) : e.salary; const s = S();
    // Ay içinde işe giriş/çıkış ve ücretsiz izin/devamsızlık SGK gününden düşer (5510 md. 86: ücret ödenmeyen günler eksik gün bildirilir)
    const pre = e.start > first ? Number(e.start.slice(8)) - 1 : 0;
    const post = e.end && e.end < last ? 30 - Math.min(30, Number(e.end.slice(8))) : 0;
    const lost = st.U + st.D + (s.reportDeduct ? st.R : 0);
    const days = lost >= list.length ? 0 : Math.max(0, 30 - pre - post - lost);
    const otPay = r2(st.ot * (gross / s.monthHours) * s.otRate);
    const holPay = r2(st.T * (gross / 30)); // 4857 md. 47: tatilde çalışılan her gün için bir günlük ücret daha
    const r = BORDRO.month(P, { gross, days, extra: otPay + holPay, cum, month: mo });
    return { ...r, st, monthlyGross: gross, otPay, holPay, deduct: Math.round((gross * (30 - days)) / 30), lost };
  }
  const advOf = (eid, m) => { if (!AV) { AV = {}; db.all('advances').forEach((a) => { const k = `${a.emp}|${String(a.date).slice(0, 7)}`; AV[k] = (AV[k] || 0) + (Number(a.amount) || 0); }); later(); } return AV[`${eid}|${m}`] || 0; };
  function payroll(e, m) {
    const cm = closedMap(); const hit = cm[m] && cm[m].rows[e.id]; if (hit) return hit;
    const P = BP(); const y = m.slice(0, 4), mo = Number(m.slice(5));
    // Gelir vergisi kümülatif: yılbaşından bu aya kadarki matrahlar; kapatılmış ayın matrahı dondurulmuş kayıttan gelir
    let cum = 0;
    for (let k = 1; k < mo; k++) { const key = `${y}-${NS.pad(k)}`; const c = cm[key] && cm[key].rows[e.id]; cum = c ? c.cumAfter : monthCalc(e, key, P, cum, k).cumAfter; }
    const r = monthCalc(e, m, P, cum, mo);
    const adv = advOf(e.id, m);
    return { ...r, cumBefore: cum, base: r.base, adv, netSalary: r.net, net: r2(r.net - adv) };
  }

  // ---------- Belgeler (NS.docs: işletme şablonu seçer) ----------
  const monthName = (m) => `${NS.MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
  if (NS.docs) [['pusula', 'Bordro pusulası', { signLabels: 'İşveren|Personel' }], ['odeme', 'Maaş ödeme listesi', {}], ['tazminat', 'Tazminat hesap pusulası', { signLabels: 'İşveren|Personel' }], ['izin', 'İzin formu', { signLabels: 'İşveren|Personel' }], ['calisma', 'Çalışma belgesi', { signLabels: 'İşveren|Personel' }], ['vardiya', 'Vardiya planı', {}], ['zimmet', 'Zimmet tutanağı', { signLabels: 'Teslim eden|Teslim alan' }], ['puantaj', 'Puantaj cetveli', { signLabels: 'Hazırlayan|Onaylayan' }]].forEach(([k, label, defaults]) => NS.docs.define('ik', k, { label, defaults: { terms: '', footer: '', cols: { unit: false, disc: false }, ...defaults } }));
  const slipDoc = (r, m) => ({ title: 'Ücret bordrosu', no: monthName(m), party: { title: 'Personel', name: r.e.name, lines: [`TC ${r.e.tc || '-'}`, `${r.e.dept || ''} / ${r.e.title || ''}`, `İşe giriş ${NS.date(r.e.start)}`] }, info: [['SGK günü', r.days], ['SGK matrahı', money(r.sgkBase)], ['GV matrahı', money(r.base)], ['Kümülatif GV matrahı', money(r.cumAfter)]], lines: [{ name: `Aylık brüt ücret (${r.days} gün)`, qty: 1, total: r2(r.gross - r.otPay - (r.holPay || 0)) }, ...(r.otPay ? [{ name: `Fazla mesai (${r.st.ot} saat)`, qty: 1, total: r.otPay }] : []), ...(r.holPay ? [{ name: `Tatil çalışması (${r.st.T} gün)`, qty: 1, total: r.holPay }] : []), { name: 'SGK işçi payı', qty: 1, total: -r.sgk }, { name: 'İşsizlik işçi payı', qty: 1, total: -r.unemp }, { name: 'Gelir vergisi', note: `İstisna ${money(r.taxEx)} düşüldü`, qty: 1, total: -r.incomeTax }, { name: 'Damga vergisi', note: `İstisna ${money(r.stampEx)} düşüldü`, qty: 1, total: -r.stamp }, ...(r.adv ? [{ name: 'Avans', qty: 1, total: -r.adv }] : [])], totals: [['Toplam brüt', r.gross], ['Net ücret', r.netSalary], ['Net ödenecek', r.net, true]], note: `İşveren SGK ${money(r.sgkEr)} · İşveren işsizlik ${money(r.unempEr)} · İşveren maliyeti ${money(r.cost)}` });
  const leaveDoc = (l) => { const e = emp(l.emp); const n = workDays(l.from, l.to).length; const b = balance(e); let back = iso(addDays(l.to + 'T12:00', 1)); while (defaultStatus(back) !== 'C') back = iso(addDays(back + 'T12:00', 1)); return { title: 'İzin formu', no: LT[l.type] || 'İzin', party: { title: 'Personel', name: e.name, lines: [`TC ${e.tc || '-'}`, `${e.dept || ''} / ${e.title || ''}`] }, info: [['Başlangıç', NS.date(l.from)], ['Bitiş', NS.date(l.to)], ['İşe dönüş', NS.date(back)], ['İzin günü', `${n} iş günü`], ...(l.type === 'I' ? [['Yıllık hak', `${b.yearly} gün`], ['Kalan', `${b.left} gün`]] : [])], note: l.note || '' }; };
  const workDoc = (e) => { const end = e.end || today(); const y = BORDRO.fullYears(e.start, end); const mo = BORDRO.fullMonths(e.start, end) - y * 12; return { title: 'Çalışma belgesi', party: { title: 'Çalışan', name: e.name, lines: [`TC ${e.tc || '-'}`] }, info: [['İşin türü', e.title || '-'], ['Bölüm', e.dept || '-'], ['İşe giriş', NS.date(e.start)], ['İşten ayrılış', e.end ? NS.date(e.end) : 'Çalışmaya devam ediyor'], ['Çalışma süresi', `${y} yıl ${mo} ay`]], note: `Bu belge, 4857 sayılı İş Kanunu md. 28 uyarınca işin türünü ve süresini göstermek üzere düzenlenmiştir.` }; };
  const toDate = (s) => (s ? NS.date(s) : '-');

  // ---------- Puantaj ----------
  let ym = today().slice(0, 7);
  function timesheetPage(el, p, app) {
    const days = monthDays(ym); const closed = isClosed(ym); const canPdks = !isSef(); const y = ym.slice(0, 4);
    const list = monthEmps(ym).sort((a, b) => String(a.dept).localeCompare(String(b.dept), 'tr') || a.name.localeCompare(b.name, 'tr'));
    let otMode = false;
    const noHol = !String(S().hol || '').includes(y);
    el.innerHTML = pageHead('Puantaj', 'Hücreye dokunarak durumu değiştirin · fazla mesai için "Fazla mesai gir"i açın', `<button class="btn icon" data-m="-1" aria-label="Önceki ay">${icon('left')}</button><b>${monthName(ym)}</b><button class="btn icon" data-m="1" aria-label="Sonraki ay">${icon('right')}</button><button class="btn" id="otm">${icon('clock')} Fazla mesai gir</button><button class="btn" id="fill">${icon('check')} Bugünü "çalıştı" doldur</button>${canPdks ? `<button class="btn" id="pdks">${icon('clock')} PDKS’den aktar</button>` : ''}<button class="btn" id="prt" aria-label="Yazdır">${icon('print')}</button><button class="btn" id="ex" aria-label="Excel">${icon('download')}</button>`) + `
      ${closed ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('lock')} ${monthName(ym)} bordrosu kapatıldı; puantaj değiştirilemez. Değişiklik için Bordro ekranından dönemi açın.</div>` : ''}
      ${noHol ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} ${y} yılının dinî bayram günleri girilmedi: bu günler çalışma günü görünür. Ayarlar &gt; Tatil günleri.</div>` : ''}
      <div class="row mb small">${Object.entries(PS).map(([k, v]) => `<span class="badge s-${k}" style="border:0">${k} · ${v}</span>`).join('')}</div>
      ${list.length ? `<div class="card pt-wrap"><table class="pt"><thead><tr><th class="nm">Personel</th>${days.map((d) => { const dw = new Date(d + 'T12:00').getDay(); return `<th class="${dw === 0 || dw === 6 ? 'we' : ''}" title="${NS.DAYS[dw]}">${Number(d.slice(8))}<br><span style="font-weight:400">${NS.DAYS[dw].slice(0, 2)}</span></th>`; }).join('')}<th>Ç</th><th>İzin</th><th>Rapor</th><th>Dev.</th><th>FM</th></tr></thead>
      <tbody>${list.map((e) => { const st = monthStats(e, ym); const fy = fmYear(e.id, y); return `<tr><td class="nm"><b>${esc(e.name)}</b><div class="small faint">${esc(e.dept)} · ${esc(e.title || '')}</div></td>${days.map((d) => { const c = cell(e.id, d); return `<td class="d ${c ? 's-' + c.s : ''}" data-c="${e.id}|${d}">${c ? c.s : d <= today() ? '<span class="faint">·</span>' : ''}${c && c.ot ? `<span class="ot">+${c.ot}s</span>` : ''}</td>`; }).join('')}<td class="tot">${st.C + st.T}</td><td class="tot">${st.I}</td><td class="tot">${st.R}</td><td class="tot" style="color:var(--err)">${st.D + st.U}</td><td class="tot" title="${y} toplamı ${num(fy)} saat" style="color:${fy > FM_YEAR ? 'var(--err)' : 'var(--accent)'}">${st.ot}s${fy > FM_YEAR ? ' !' : ''}</td></tr>`; }).join('')}</tbody></table></div>` : `<div class="card"><div class="empty">${icon('users')}<div>${isSef() && !myDept() ? 'Hesabınıza departman atanmamış. Yöneticiniz Ayarlar’dan departman seçmeli.' : 'Bu ay için personel yok'}</div></div></div>`}`;
    const askOt = async (k) => {
      if (closed) return toast('Bu ay kapatıldı', 'err');
      const c = db.data.ts[k] || { s: 'C', ot: 0 }; const [eid, d] = k.split('|');
      const v = await NS.prompt(`Fazla mesai (saat) — ${emp(eid).name} ${NS.date(d)}`, c.ot || 0, { type: 'number', title: 'Fazla mesai' });
      if (v === null) return; const h = Math.max(0, Number(v) || 0);
      const after = fmYear(eid, d.slice(0, 4)) - (c.ot || 0) + h;
      if (after > FM_YEAR && !(await confirm(`${emp(eid).name} için ${d.slice(0, 4)} fazla mesaisi ${num(after)} saat olacak. Kanuni sınır yılda ${FM_YEAR} saattir (4857 md. 41). Yine de işlensin mi?`, { ok: 'İşle', danger: false }))) return;
      db.data.ts[k] = { ...c, s: c.s === 'T' ? 'T' : 'C', ot: h }; dirty(); db.save(); app.refresh();
    };
    on(el, 'click', '[data-m]', (e, b) => { const d = new Date(ym + '-15'); d.setMonth(d.getMonth() + Number(b.dataset.m)); ym = iso(d).slice(0, 7); app.refresh(); });
    on(el, 'click', '[data-c]', (e, td) => {
      const k = td.dataset.c; if (otMode) return askOt(k); if (closed) return toast('Bu ay kapatıldı', 'err');
      const [, d] = k.split('|'); const c = db.data.ts[k];
      const next = c ? CYCLE[(CYCLE.indexOf(c.s) + 1) % CYCLE.length] : defaultStatus(d);
      db.data.ts[k] = { s: next, ot: ['C', 'T'].includes(next) && c ? c.ot : 0 }; dirty(); db.save();
      td.className = 'd s-' + next; td.innerHTML = next + (db.data.ts[k].ot ? `<span class="ot">+${db.data.ts[k].ot}s</span>` : '');
    });
    el.addEventListener('contextmenu', (e) => { const td = e.target.closest('[data-c]'); if (!td) return; e.preventDefault(); askOt(td.dataset.c); });
    $('#otm', el).onclick = (e) => { otMode = !otMode; e.currentTarget.classList.toggle('primary', otMode); toast(otMode ? 'Fazla mesai modu açık: saat girmek için hücreye dokunun' : 'Fazla mesai modu kapalı'); };
    // PDKS cihazından giriş-çıkışlar alınır: giriş varsa "C", mesai saatini aşan süre fazla mesai olarak yazılır
    if ($('#pdks', el)) $('#pdks', el).onclick = async () => {
      if (!NS.integ) return; if (closed) return toast('Bu ay kapatıldı', 'err'); const r = await NS.integ.call('pdks', 'hareketler', { month: ym }); if (!r || !r.ok) return;
      let recs = r.data && Array.isArray(r.data.records) ? r.data.records : [];
      // Simülasyonda cihazdan kayıt okunmaz: uydurma giriş-çıkış puantaja (ve maaşa) yazılmaz
      if (r.simulated) return toast('PDKS TEST — cihaz bağlı değil (simülasyon), puantaja kayıt işlenmedi', 'warn');
      let n = 0; recs.forEach((x) => { const e = x.emp ? emp(x.emp) : db.find('employees', (y2) => y2.tc === x.tc); if (!e || !e.id) return; const hrs = (Number(x.out.split(':')[0]) + Number(x.out.split(':')[1]) / 60) - (Number(x.in.split(':')[0]) + Number(x.in.split(':')[1]) / 60) - 1; db.data.ts[`${e.id}|${x.date}`] = { s: 'C', ot: Math.max(0, Math.round((hrs - 8) * 2) / 2), in: x.in, out: x.out }; n++; });
      dirty(); db.save(); toast(`${n} giriş-çıkış kaydı puantaja işlendi`, 'ok'); app.refresh();
    };
    $('#fill', el).onclick = () => { if (closed) return toast('Bu ay kapatıldı', 'err'); const t = today(); let n = 0; emps().forEach((e) => { const k = `${e.id}|${t}`; if (!db.data.ts[k]) { db.data.ts[k] = { s: rosterOff(e.id, t) ? 'H' : defaultStatus(t), ot: 0 }; n++; } }); dirty(); db.save(); toast(`${n} personel için bugün işlendi`, 'ok'); app.refresh(); };
    $('#prt', el).onclick = () => { if (!NS.docs) return; NS.docs.print('puantaj', { title: 'Puantaj cetveli', no: monthName(ym), note: list.map((e) => { const st = monthStats(e, ym); return `${e.name} (${e.dept}): çalışılan ${st.C + st.T}, izin ${st.I}, rapor ${st.R}, ücretsiz ${st.U}, devamsız ${st.D}, resmi tatil ${st.B}, fazla mesai ${st.ot} saat`; }).join('\n') }); };
    $('#ex', el).onclick = () => NS.csv(`puantaj-${ym}`, list.map((e) => ({ e, st: monthStats(e, ym) })), [{ label: 'Personel', value: (r) => r.e.name }, { label: 'Departman', value: (r) => r.e.dept }, ...days.map((d) => ({ label: d.slice(8), value: (r) => (cell(r.e.id, d) || {}).s || '' })), { label: 'Çalışılan', value: (r) => r.st.C + r.st.T }, { label: 'İzin', value: (r) => r.st.I }, { label: 'Rapor', value: (r) => r.st.R }, { label: 'Devamsız', value: (r) => r.st.D }, { label: 'FM saat', value: (r) => r.st.ot }]);
  }

  // ---------- Vardiya ----------
  const roster = () => (db.data.roster = db.data.roster || {});
  const rosterOff = (eid, d) => roster()[`${eid}|${d}`] === 'off';
  const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  // Ara dinlenme 4857 md. 68 (4 saate kadar 15 dk, 7,5 saate kadar 30 dk, üstü 1 saat); gece 20:00–06:00 md. 69
  const shiftInfo = (s) => { const a = toMin(s.start), b = toMin(s.end); const span = (b > a ? b - a : b + 1440 - a) / 60; const brk = span > 7.5 ? 1 : span > 4 ? 0.5 : 0.25; let night = 0; for (let t = 0; t < span * 60; t += 15) { const m = (a + t) % 1440; if (m >= 1200 || m < 360) night += 0.25; } return { span, net: span - brk, night }; };
  let wk = null;
  const monday = (d) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); };
  function rosterPage(el, p, app) {
    wk = wk || monday(today()); const week = Array.from({ length: 7 }, (_, i) => iso(addDays(wk + 'T12:00', i)));
    const list = emps().sort((a, b) => String(a.dept).localeCompare(String(b.dept), 'tr') || a.name.localeCompare(b.name, 'tr')); const sh = db.all('shifts'); const smap = Object.fromEntries(sh.map((s) => [s.id, s]));
    const line = (e) => { let h = 0, off = false, gaps = 0; week.forEach((d) => { const v = roster()[`${e.id}|${d}`]; if (v === 'off') off = true; else if (v && smap[v]) h += shiftInfo(smap[v]).net; else gaps++; }); return { h, warn: h > 45 ? '45 saat üstü (fazla mesai)' : !off && !gaps ? 'Hafta tatili yok' : '' }; };
    const label = (v) => (v === 'off' ? 'T' : smap[v] ? smap[v].name.slice(0, 2) : '');
    const nightBad = sh.filter((s) => shiftInfo(s).night > 7.5);
    el.innerHTML = pageHead('Vardiya Planı', 'Hücreye dokunarak vardiya atayın · T: hafta tatili', `<button class="btn icon" data-w="-7" aria-label="Önceki hafta">${icon('left')}</button><b>${NS.date(week[0])} – ${NS.date(week[6])}</b><button class="btn icon" data-w="7" aria-label="Sonraki hafta">${icon('right')}</button><button class="btn" id="cp">${icon('layers')} Geçen haftayı kopyala</button><button class="btn" id="pr" aria-label="Yazdır">${icon('print')}</button><button class="btn" id="sm">${icon('message')} Personele SMS</button>`) + `
      ${nightBad.length ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} ${nightBad.map((s) => esc(s.name)).join(', ')}: gece çalışması 7,5 saati geçiyor (4857 md. 69). Sektör istisnası yoksa vardiyayı kısaltın.</div>` : ''}
      ${list.length ? `<div class="card pt-wrap"><table class="pt"><thead><tr><th class="nm">Personel</th>${week.map((d) => { const dw = new Date(d + 'T12:00').getDay(); return `<th title="${NS.DAYS[dw]}">${d.slice(8)}<br><span style="font-weight:400">${DAY3[dw]}</span></th>`; }).join('')}<th>Saat</th></tr></thead><tbody>${list.map((e) => { const l = line(e); return `<tr><td class="nm"><b>${esc(e.name)}</b><div class="small faint">${esc(e.dept)}</div></td>${week.map((d) => { const v = roster()[`${e.id}|${d}`]; const s = smap[v]; return `<td class="d" data-r="${e.id}|${d}" style="${s ? `background:${esc(s.color || '#475569')};color:#fff` : ''}">${esc(label(v))}</td>`; }).join('')}<td class="tot">${num(l.h)}${l.warn ? `<div class="small" style="color:var(--warn);font-weight:500">${esc(l.warn)}</div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : `<div class="card"><div class="empty">${icon('users')}<div>Personel yok</div></div></div>`}
      <p class="small faint mt">Saat: ara dinlenme düşülmüş çalışma süresi (4857 md. 63, 68). Hafta tatili: 7 günde en az 24 saat (md. 46).</p><div id="st" class="mt"></div>`;
    on(el, 'click', '[data-w]', (e, b) => { wk = iso(addDays(wk + 'T12:00', Number(b.dataset.w))); app.refresh(); });
    on(el, 'click', '[data-r]', (e, td) => { if (!sh.length) return toast('Önce aşağıdan vardiya türü ekleyin', 'err'); const k = td.dataset.r; const order = [...sh.map((s) => s.id), 'off', null]; const cur = roster()[k] || null; const next = order[(order.indexOf(cur) + 1) % order.length]; if (next) roster()[k] = next; else delete roster()[k]; db.save(); const s = smap[next]; td.textContent = label(next); td.style.background = s ? s.color || '#475569' : ''; td.style.color = s ? '#fff' : ''; });
    $('#cp', el).onclick = async () => { const prev = week.map((d) => iso(addDays(d + 'T12:00', -7))); let n = 0; const has = list.some((e) => week.some((d) => roster()[`${e.id}|${d}`])); if (has && !(await confirm('Bu haftadaki plan geçen haftanın planıyla değiştirilsin mi?', { ok: 'Kopyala', danger: false }))) return; list.forEach((e) => week.forEach((d, i) => { const v = roster()[`${e.id}|${prev[i]}`]; if (v) { roster()[`${e.id}|${d}`] = v; n++; } else delete roster()[`${e.id}|${d}`]; })); db.save(); toast(n ? `${n} vardiya kopyalandı` : 'Geçen hafta plan yok', n ? 'ok' : ''); app.refresh(); };
    const sumText = (e) => week.map((d) => { const v = roster()[`${e.id}|${d}`]; return `${DAY3[new Date(d + 'T12:00').getDay()]} ${v === 'off' ? 'tatil' : smap[v] ? `${smap[v].name} ${smap[v].start}` : '-'}`; }).join(', ');
    $('#pr', el).onclick = () => NS.docs && NS.docs.print('vardiya', { title: 'Vardiya planı', no: `${NS.date(week[0])} – ${NS.date(week[6])}`, note: list.map((e) => `${e.name} (${num(line(e).h)} saat): ${sumText(e)}`).join('\n') });
    $('#sm', el).onclick = async () => { const to = list.filter((e) => e.phone && week.some((d) => roster()[`${e.id}|${d}`])); if (!to.length) return toast('Planı olan ve telefonu kayıtlı personel yok', 'err'); if (await confirm(`${to.length} personele bu haftanın vardiyası SMS ile gönderilsin mi?`, { ok: 'Gönder', danger: false })) NS.smsBatch(db, to.map((e) => ({ to: e.phone, name: e.name, kind: 'vardiya', text: `${S().bizName} vardiyanız ${NS.date(week[0])}: ${sumText(e)}` })), 'vardiya mesajı'); };
    NS.crud($('#st', el), app, { col: 'shifts', title: 'Vardiya türleri', single: 'Vardiya', addLabel: 'Yeni vardiya', emptyIcon: 'clock', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'start', label: 'Başlangıç', type: 'time', required: true }, { name: 'end', label: 'Bitiş', type: 'time', required: true }, { name: 'color', label: 'Renk', type: 'color' }], defaults: { start: '08:00', end: '16:30', color: '#2563eb' }, canDelete: (s) => (Object.values(roster()).includes(s.id) ? 'Bu vardiya planda kullanılıyor; önce plandan kaldırın.' : true), columns: [{ key: 'name', label: 'Vardiya', render: (s) => `<b style="color:${esc(s.color || 'inherit')}">${esc(s.name)}</b>` }, { label: 'Saat', render: (s) => `${esc(s.start)} – ${esc(s.end)}` }, { label: 'Net çalışma', cls: 'right', render: (s) => `${num(shiftInfo(s).net)} saat` }, { label: 'Gece', cls: 'right', render: (s) => `${num(shiftInfo(s).night)} saat` }], onSave: () => app.refresh() });
  }

  // ---------- Personel ----------
  const deptList = () => [...new Set([...String(S().depts || 'Üretim, Satış, Lojistik, İdari').split(',').map((x) => x.trim()).filter(Boolean), ...db.all('employees').map((e) => e.dept).filter(Boolean)])];
  const EF = () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'tc', label: 'TC kimlik no' }, { name: 'dept', label: 'Departman', type: 'select', options: deptList() }, { name: 'title', label: 'Görev' }, { name: 'start', label: 'İşe giriş', type: 'date', required: true }, { name: 'salary', label: 'Maaş (₺)', type: 'number', required: true }, { name: 'salaryType', label: 'Maaş türü', type: 'select', options: [{ value: 'net', label: 'Net (anlaşılan ele geçen)' }, { value: 'brut', label: 'Brüt' }] }, { name: 'phone', label: 'Telefon' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'underground', label: 'Yer altı işlerinde çalışıyor (yıllık izne +4 gün)', type: 'checkbox' }, { name: 'leaveExtra', label: 'Sözleşmeyle ek yıllık izin (gün)', type: 'number' }, { name: 'leaveCarry', label: 'Önceki yıllardan devreden izin (gün)', type: 'number', hint: 'Programdan önce kullanılmayan izin; eksi de olabilir' }, { name: 'iban', label: 'IBAN', full: true }];
  const hasRecords = (e) => { const p = e.id + '|'; return Object.keys(db.data.ts || {}).some((k) => k.startsWith(p)) || db.find('leaves', (l) => l.emp === e.id) || db.find('advances', (a) => a.emp === e.id) || db.find('files', (f) => f.emp === e.id) || db.find('payClosed', (c) => (c.rows || []).some((r) => r.emp === e.id)); };
  function checkEmp(v, rec) {
    const tc = String(v.tc || '').trim(); if (tc && tc !== String((rec || {}).tc || '')) { if (!BORDRO.tcOk(tc)) return 'TC kimlik numarası geçersiz'; if (db.find('employees', (x) => x.tc === tc && (!rec || x.id !== rec.id))) return 'Bu TC kimlik numarasıyla kayıtlı personel var'; }
    const ib = String(v.iban || '').trim(); if (ib && ib !== String((rec || {}).iban || '') && !BORDRO.ibanOk(ib)) return 'IBAN geçersiz (kontrol hanesi tutmuyor)';
    if (v.end && v.end < v.start) return 'Çıkış tarihi girişten önce olamaz';
  }
  const sgkPush = (e, act, payload, field) => { if (!NS.integ || !NS.integ.isOn('sgk')) return; NS.integ.call('sgk', act, payload).then((r) => { if (r && r.ok && !r.simulated) { e[field] = r.ref; db.save(); } else if (r && r.simulated) { e[field + 'Test'] = true; db.save(); } }); };
  async function exitEmp(e, app) {
    const zm = db.all('files', (f) => f.emp === e.id && f.kind === 'zimmet' && !f.back);
    const v = await formModal({ title: `İşten çıkış — ${e.name}`, extra: zm.length ? `<div class="card pad mt small" style="border-color:var(--warn)">Üzerinde ${zm.length} zimmet var: ${esc(zm.map((f) => f.name).join(', '))}. Teslim alınca Belge &amp; Zimmet ekranından kapatın.</div>` : '', fields: [{ name: 'end', label: 'Son çalışma günü', type: 'date', required: true, value: today() }, { name: 'reason', label: 'Çıkış nedeni', type: 'select', options: ['İstifa', 'İşveren feshi', 'Karşılıklı anlaşma', 'Emeklilik', 'Deneme süresi', 'Diğer'] }, { name: 'sgkCode', label: 'SGK işten çıkış kodu', hint: 'e-Bildirge’deki kod. Yanlış kod tazminat ve işsizlik hakkını etkiler; mali müşavirinize danışın.' }, { name: 'note', label: 'Not', full: true }], submitLabel: 'Çıkışı kaydet' });
    if (!v) return; if (v.end < e.start) return toast('Çıkış tarihi girişten önce olamaz', 'err'); if (isClosed(v.end.slice(0, 7))) return toast('Bu ayın bordrosu kapatıldı. Önce dönemi açın.', 'err');
    e.end = v.end; e.active = false; e.exit = { reason: v.reason, code: v.sgkCode, note: v.note, at: today() }; db.log('İşten çıkış', e.name); db.save(); dirty();
    sgkPush(e, 'isten-cikis', { tc: e.tc, name: e.name, end: v.end, code: v.sgkCode }, 'sgkOut');
    toast(`Çıkış kaydedildi. SGK işten ayrılış bildirimi son gün ${NS.date(addDays(v.end + 'T12:00', 10))}`, 'ok'); app.refresh(); severanceModal(e, v.end);
  }
  function employeesPage(el, p, app) {
    const sef = isSef(); const portalUrl = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'calisan.html';
    NS.crud(el, app, {
      col: 'employees', title: 'Personel', sub: sef ? 'Departmanınızın personeli' : 'Özlük bilgileri, kıdem ve izin hakları', single: 'Personel', addLabel: 'Yeni personel', emptyIcon: 'users', fields: EF, defaults: () => ({ start: today(), active: true, dept: deptList()[0] }), readonly: sef,
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (e) => (sef ? [e.name, e.dept, e.title] : [e.name, e.tc, e.dept, e.title]),
      rowsFilter: inScope, exportRoles: ['admin'],
      filters: [{ value: 'all', label: 'Aktif', test: (e) => e.active !== false }, { value: 'x', label: 'Ayrılanlar', test: (e) => e.active === false }],
      extraActions: sef ? [] : [{ icon: 'file', act: 'sev', title: 'Kıdem / ihbar tazminatı hesapla' }, { icon: 'award', act: 'wrk', title: 'Çalışma belgesi' }, { icon: 'globe', act: 'ptl', title: 'Çalışan portalı kodu', show: (e) => e.active !== false && !!e.phone }, { icon: 'x', act: 'out', title: 'İşten çıkış', show: (e) => e.active !== false }, { icon: 'refresh', act: 'back', title: 'Yeniden işe al', show: (e) => e.active === false }],
      onAction: async (a, e) => {
        if (a === 'sev') return severanceModal(e, e.end);
        if (a === 'wrk') return NS.docs.print('calisma', workDoc(e));
        if (a === 'ptl') return NS.portalShare(db, e, { title: 'Çalışan portalı', url: portalUrl, phone: e.phone, name: e.name, login: 'Telefon numaranız', loginValue: e.phone });
        if (a === 'out') return exitEmp(e, app);
        if (a === 'back' && await confirm(`${e.name} yeniden aktif çalışan yapılsın mı? Yeni işe girişse giriş tarihini güncelleyin.`, { ok: 'Aktif yap', danger: false })) { e.active = true; delete e.end; delete e.exit; db.log('Yeniden işe alma', e.name); db.save(); dirty(); app.refresh(); }
      },
      beforeSave: (v, rec) => checkEmp(v, rec),
      canDelete: (e) => (hasRecords(e) ? 'Bu personelin puantaj veya bordro kaydı var; silinemez. "İşten çıkış" kullanın (5510 md. 86: kayıtlar 10 yıl saklanır).' : true),
      onSave: (v, rec) => {
        dirty(); if (rec) return; const e = db.all('employees').slice(-1)[0];
        sgkPush(e, 'ise-giris', { tc: e.tc, name: e.name, start: e.start, title: e.title, dept: e.dept }, 'sgkIn');
      },
      columns: [{ key: 'name', label: 'Personel', render: (e) => `<div class="row nw"><div class="avatar">${esc(NS.initials(e.name))}</div><div><b>${esc(e.name)}</b><div class="small faint">${esc(e.title || '')}${e.end ? ' · çıkış ' + NS.date(e.end) : ''}${e.sgkIn ? ' · SGK giriş ✓' : e.sgkInTest ? ' · SGK giriş TEST (bildirilmedi)' : ''}${e.sgkOut ? ' · SGK çıkış ✓' : e.sgkOutTest ? ' · SGK çıkış TEST (bildirilmedi)' : ''}</div></div></div>` }, { key: 'dept', label: 'Departman', render: (e) => badge(e.dept, 'acc') }, { key: 'start', label: 'Kıdem', render: (e) => `${NS.date(e.start)}<div class="small faint">${seniority(e)} yıl</div>` }, { label: 'Kalan izin', cls: 'right', render: (e) => { const b = balance(e); return `${b.left} gün<div class="small faint">yıllık ${b.yearly}</div>`; } }, ...(sef ? [] : [{ key: 'salary', label: 'Maaş', cls: 'right', render: (e) => `${money(e.salary)}<div class="small faint">${isNet(e) ? 'net' : 'brüt'}</div>` }])],
    });
  }

  // İşten çıkışta ödenecek kıdem, ihbar ve kullanılmayan izin ücreti
  function severanceModal(e, endAt) {
    const P = BP();
    const remain = Math.max(0, balance(e).left); let last = null;
    const draw = (b) => {
      const end = $('[name=end]', b).value || today();
      const pr = payroll(e, end.slice(0, 7));
      const r = BORDRO.severance(P, { start: e.start, end, gross: pr.monthlyGross || e.salary, notice: $('[name=notice]', b).checked, leaveDays: Number($('[name=leave]', b).value) || 0, cum: pr.cumAfter });
      const row = (l, v, strong) => `<tr><td>${l}</td><td class="right">${strong ? `<b>${money(v)}</b>` : money(v)}</td></tr>`;
      $('#sv', b).innerHTML = `<table class="tbl"><tbody>
        <tr><td colspan="2" class="small muted">Kıdem: ${num(r.years)} yıl · esas brüt ${money(r.kidemBase)}${r.capped ? ' (tavandan)' : ''}</td></tr>
        ${row('Kıdem tazminatı (brüt)', r.kidem)}${row('Damga vergisi', -r.kidemStamp)}${row('Kıdem tazminatı (net)', r.kidemNet, true)}
        <tr><td colspan="2" class="small muted">İhbar süresi: ${r.weeks} hafta${$('[name=notice]', b).checked ? '' : ' — süre kullandırıldı, ödeme yok'}</td></tr>
        ${row('İhbar tazminatı (brüt)', r.ihbar)}${row('Gelir + damga vergisi', -(r.ihbarTax + r.ihbarStamp))}${row('İhbar tazminatı (net)', r.ihbarNet, true)}
        <tr><td colspan="2" class="small muted">Kullanılmayan izin: ${r.leaveDays} gün</td></tr>${row('İzin ücreti (brüt)', r.leavePay)}${row('İzin ücreti (net)', r.leaveNet, true)}
        <tr><td><b>Toplam net ödeme</b></td><td class="right"><b style="font-size:20px">${money(r.kidemNet + r.ihbarNet + r.leaveNet)}</b></td></tr></tbody></table>
        ${BORDRO.fullYears(e.start, end) < 1 ? '<p class="small" style="color:var(--warn)">1 yılı doldurmayan çalışana kıdem tazminatı ödenmez.</p>' : ''}`;
      last = { r, end };
    };
    NS.modal({ title: `Tazminat hesabı — ${e.name}`, size: 'wide',
      body: `<div class="form-grid"><div class="field"><label>İşten ayrılış tarihi</label><input class="input" type="date" name="end" value="${endAt || today()}"></div><div class="field"><label>Kullanılmayan izin (gün)</label><input class="input" type="number" name="leave" value="${remain}" min="0"></div><label class="check full"><input type="checkbox" name="notice" checked> İhbar süresi kullandırılmadan çıkış (ihbar tazminatı ödenecek)</label></div><div id="sv" class="mt"></div><p class="small faint">Giriş: ${NS.date(e.start)} · Hesap, bordro parametreleri ve son ayın kümülatif matrahıyla yapılır. Giydirilmiş ücret (yol, yemek vb.) için brüt maaşı güncelleyin. Fesih nedeni tazminat hakkını etkiler; bu hesap hakkın varlığını belirlemez.</p>`,
      onOpen: (b) => { draw(b); b.addEventListener('input', () => draw(b)); b.addEventListener('change', () => draw(b)); },
      actions: [{ label: 'Kapat' }, { label: 'Yazdır', icon: 'print', cls: 'primary', onClick: () => { const { r, end } = last; NS.docs.print('tazminat', { title: 'Tazminat hesap pusulası', party: { title: 'Personel', name: e.name, lines: [`TC ${e.tc || '-'}`] }, info: [['İşe giriş', NS.date(e.start)], ['Çıkış', NS.date(end)], ['Kıdem', `${num(r.years)} yıl`], ['İhbar', `${r.weeks} hafta`], ['Kullanılmayan izin', `${r.leaveDays} gün`]], lines: [{ name: 'Kıdem tazminatı (net)', note: `Brüt ${money(r.kidem)} · damga ${money(r.kidemStamp)}`, qty: 1, total: r.kidemNet }, { name: 'İhbar tazminatı (net)', note: `Brüt ${money(r.ihbar)}`, qty: 1, total: r.ihbarNet }, { name: 'İzin ücreti (net)', note: `Brüt ${money(r.leavePay)}`, qty: 1, total: r.leaveNet }], totals: [['Toplam net ödeme', r2(r.kidemNet + r.ihbarNet + r.leaveNet), true]] }); } }] });
  }

  // ---------- İzin ----------
  const overlaps = (l) => db.find('leaves', (x) => x.id !== l.id && x.emp === l.emp && x.status === 'onay' && x.from <= l.to && x.to >= l.from);
  const smsLeave = (l, text) => { const e = emp(l.emp); if (S().smsLeave && e.phone) NS.smsLog(db, { to: e.phone, name: e.name, kind: 'izin', text: `${S().bizName}: ${text}` }, true).result.then((res) => toast(NS.smsText(res, 'İzin SMS'), NS.smsTone(res))); };
  async function approveLeave(l, app) {
    const days = workDays(l.from, l.to); const e = emp(l.emp);
    if (days.some((d) => isClosed(d.slice(0, 7)))) return toast('İzin kapatılmış bir ayı kapsıyor. Önce dönemi açın.', 'err');
    if (overlaps(l)) return toast(`${e.name} için bu tarihlerde onaylı izin var`, 'err');
    if (l.type === 'I') { const b = balance(e); if (days.length > b.left) { const msg = `Hak aşılıyor: ${b.left} gün kaldı, talep ${days.length} iş günü`; if (isSef()) { if (!(await NS.approve(app, msg, ['admin']))) return; } else if (!(await confirm(`${e.name}: ${msg}. Yine de onaylansın mı?`, { ok: 'Onayla', danger: false }))) return; } }
    l.status = 'onay'; l.prev = {}; days.forEach((d) => { const k = `${l.emp}|${d}`; l.prev[d] = db.data.ts[k] || null; db.data.ts[k] = { s: l.type, ot: 0 }; }); dirty();
    db.log('İzin onaylandı', e.name); db.save(); smsLeave(l, `${NS.date(l.from)} – ${NS.date(l.to)} izniniz onaylandı.`); app.refresh();
  }
  function cancelLeave(l, app) {
    const days = dates(l.from, l.to); if (days.some((d) => isClosed(d.slice(0, 7)))) return toast('İzin kapatılmış bir ayı kapsıyor. Önce dönemi açın.', 'err');
    days.forEach((d) => { const k = `${l.emp}|${d}`; const c = db.data.ts[k]; if (l.prev && d in l.prev) { if (l.prev[d]) db.data.ts[k] = l.prev[d]; else delete db.data.ts[k]; } else if (c && c.s === l.type) delete db.data.ts[k]; });
    delete l.prev; l.status = 'iptal'; dirty(); db.log('İzin iptal edildi', emp(l.emp).name); db.save(); smsLeave(l, `${NS.date(l.from)} – ${NS.date(l.to)} izniniz iptal edildi.`); app.refresh();
  }
  function leavesPage(el, p, app) {
    const ST = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi', 'err'], iptal: ['İptal edildi', ''] };
    const rows = db.all('leaves', (l) => inScope(emp(l.emp))).sort((a, b) => (a.status === 'bekliyor' ? -1 : 1) - (b.status === 'bekliyor' ? -1 : 1) || b.from.localeCompare(a.from));
    el.innerHTML = pageHead('İzin Yönetimi', 'Onaylanan izin puantaja işlenir; hafta tatili ve resmi tatil izinden düşmez (4857 md. 56)', `<button class="btn primary" id="nl">${icon('plus')} İzin talebi</button>`) + `
      <div class="grid g-21"><div class="card">${table({ rows, empty: 'İzin talebi yok', emptyIcon: 'calendar', columns: [{ label: 'Personel', render: (l) => `<b>${esc(emp(l.emp).name)}</b><div class="small faint">${esc(emp(l.emp).dept || '')}${l.source === 'portal' ? ' · portaldan' : ''}</div>` }, { label: 'Tür', render: (l) => badge(LT[l.type] || 'İzin', l.type === 'R' ? 'warn' : 'info') }, { label: 'Tarih', render: (l) => `${NS.date(l.from)} – ${NS.date(l.to)}<div class="small faint">${workDays(l.from, l.to).length} iş günü</div>` }, { label: 'Not', render: (l) => `<span class="small">${esc(l.note || '')}</span>` }, { label: 'Durum', render: (l) => badge(...(ST[l.status] || ST.bekliyor)) }], actions: [{ label: 'Onayla', act: 'ok', show: (l) => l.status === 'bekliyor' }, { label: 'Reddet', act: 'no', show: (l) => l.status === 'bekliyor' }, { label: 'İptal', act: 'cx', show: (l) => l.status === 'onay' }, { icon: 'print', act: 'pr', title: 'İzin formu', show: (l) => l.status === 'onay' }] })}</div>
      <div class="card"><div class="card-h"><h3>İzin bakiyeleri</h3></div><div class="card-b" style="max-height:520px;overflow:auto">${emps().map((e) => { const b = balance(e); const tot = b.earned + b.carry; return `<div class="list-item small"><div class="grow"><b>${esc(e.name)}</b><div class="progress mt"><i style="width:${tot > 0 ? Math.min(100, (b.used / tot) * 100) : 0}%"></i></div></div><span style="${b.left < 0 ? 'color:var(--err)' : ''}">${b.left} gün kaldı</span></div>`; }).join('') || '<div class="faint small">Personel yok</div>'}</div></div></div>
      <p class="small faint mt">Yıllık izin taraflar anlaşırsa bölünebilir; bir bölümü en az 10 gün olmalıdır. İzni başka yerde geçirecek çalışana istekte bulunursa 4 güne kadar ücretsiz yol izni verilir (4857 md. 56). İzin ücreti izne başlamadan ödenir (md. 57).</p>`;
    $('#nl', el).onclick = async () => {
      const v = await formModal({ title: 'İzin talebi', fields: [{ name: 'emp', label: 'Personel', type: 'select', options: emps().map((e) => ({ value: e.id, label: e.name })) }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(LT).map(([value, label]) => ({ value, label })) }, { name: 'from', label: 'Başlangıç', type: 'date', required: true, value: today() }, { name: 'to', label: 'Bitiş', type: 'date', required: true, value: today() }, { name: 'note', label: 'Açıklama', full: true }] }); if (!v) return;
      if (!v.emp) return toast('Personel seçin', 'err'); if (v.to < v.from) return toast('Bitiş tarihi başlangıçtan önce olamaz', 'err'); if (overlaps(v)) return toast('Bu tarihlerde onaylı izin var', 'err');
      if (v.type === 'I') { const e = emp(v.emp); const n = workDays(v.from, v.to).length; const b = balance(e); if (n > b.left && !(await confirm(`${e.name} için izin hakkı aşılıyor (${b.left} gün kaldı, talep ${n} iş günü). Yine de oluşturulsun mu?`, { ok: 'Oluştur', danger: false }))) return; }
      db.insert('leaves', { ...v, status: 'bekliyor' }); app.refresh();
    };
    on(el, 'click', '[data-act]', (e, b) => {
      const l = db.get('leaves', b.dataset.id); const a = b.dataset.act;
      if (a === 'ok') return approveLeave(l, app); if (a === 'cx') return confirm('Onaylı izin iptal edilip puantaj eski haline dönsün mü?', { ok: 'İptal et' }).then((y) => y && cancelLeave(l, app)); if (a === 'pr') return NS.docs.print('izin', leaveDoc(l));
      l.status = 'red'; db.log('İzin reddedildi', emp(l.emp).name); db.save(); smsLeave(l, `${NS.date(l.from)} – ${NS.date(l.to)} izin talebiniz reddedildi.`); app.refresh();
    });
  }

  // ---------- Bordro ----------
  function payrollPage(el, p, app) {
    const cl = closedMap()[ym]; const closed = cl ? cl.c : null;
    const rows = closed ? closed.rows.map((r) => ({ ...r, id: r.emp, e: emp(r.emp) })) : monthEmps(ym).map((e) => ({ id: e.id, e, ...payroll(e, ym) }));
    const P = BP(); const T = (k) => sum(rows, (r) => r[k] || 0);
    const gov = T('sgk') + T('unemp') + T('sgkEr') + T('unempEr') + T('incomeTax') + T('stamp');
    const repDays = sum(rows, (r) => r.st.R); const empties = sum(rows, (r) => r.st.empty); const negs = rows.filter((r) => r.net < 0); const unpaid = closed && !closed.paidAt;
    const advs = db.all('advances', (a) => String(a.date).startsWith(ym)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    el.innerHTML = pageHead('Bordro', `${monthName(ym)}${closed ? ' · kapatıldı' : ''}`, `<button class="btn icon" data-m="-1" aria-label="Önceki ay">${icon('left')}</button><button class="btn icon" data-m="1" aria-label="Sonraki ay">${icon('right')}</button>${closed ? '' : `<button class="btn" id="adv">${icon('plus')} Avans ver</button>`}<button class="btn" id="slips">${icon('print')} Bordro pusulaları</button><button class="btn" id="pr">${icon('print')} Ödeme listesi</button><button class="btn" id="ex">${icon('download')} Banka listesi (CSV)</button><button class="btn" id="bank">${icon('building')} Bankaya talimat</button><button class="btn" id="eb">${icon('mail')} e-Bordro gönder</button>${closed ? `${unpaid ? `<button class="btn" id="paid">${icon('check')} Ödendi işaretle</button>` : ''}<button class="btn" id="open">${icon('refresh')} Dönemi aç</button>` : `<button class="btn primary" id="cls">${icon('lock')} Dönemi kapat</button>`}`) + `
      ${closed ? `<div class="card pad mb small">${icon('lock')} ${monthName(ym)} ${NS.date(closed.at)} tarihinde kapatıldı (${esc(closed.by || '')}). Tutarlar donduruldu; maaş veya parametre değişse de değişmez.${closed.paidAt ? ` Ödeme: ${NS.date(closed.paidAt)}.` : ''}</div>` : ''}
      ${!closed && empties ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} ${empties} puantaj günü boş. Boş gün çalışılmış sayılır.</div>` : ''}
      ${!closed && repDays && !S().reportDeduct ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} ${repDays} raporlu gün tam ücretli sayıldı. Rapor süresinde ücret ödemiyorsanız Ayarlar'dan "Raporlu günler SGK gününden düşsün"ü açın; aksi halde prim günü fazla bildirilir.</div>` : ''}
      ${negs.length ? `<div class="card pad mb small" style="border-color:var(--err)">${icon('alert')} ${negs.length} personelde avans neti aşıyor: ${esc(negs.map((r) => r.e.name).join(', '))}.</div>` : ''}
      <div class="grid g4 mb">${kpi('Personele ödenecek', money(T('net')), 'wallet', 'ok')}${kpi('Toplam brüt', money(T('gross')), 'cash', 'info')}${kpi('İşveren maliyeti', money(T('cost')), 'building')}${kpi('SGK + vergi (muhtasar)', money(gov), 'percent', 'warn')}</div>
      <div class="card">${table({ rows, emptyIcon: 'wallet', empty: 'Bu ay için personel yok', columns: [
        { label: 'Personel', render: (r) => `<b>${esc(r.e.name)}</b><div class="small faint">${esc(r.e.dept || '')} · ${isNet(r.e) ? 'net ' + money(r.e.salary) : 'brüt'}${r.e.end && r.e.end.slice(0, 7) === ym ? ' · ay içinde ayrıldı' : ''}${r.monthlyGross && r.monthlyGross < P.minGross ? ' · <span style="color:var(--err)">asgari ücretin altında</span>' : ''}</div>` },
        { label: 'Gün', cls: 'right', render: (r) => `${r.days}${r.lost ? ` <span class="small" style="color:var(--err)">−${r.lost}</span>` : ''}${r.st.empty ? `<div class="faint small">${r.st.empty} boş</div>` : ''}` },
        { label: 'Brüt', cls: 'right', render: (r) => `${money(r.gross)}${r.otPay ? `<div class="small" style="color:var(--accent)">+${r.st.ot}s FM ${money(r.otPay)}</div>` : ''}${r.holPay ? `<div class="small" style="color:var(--accent)">+${r.st.T} gün tatil ${money(r.holPay)}</div>` : ''}` },
        { label: 'SGK + işsizlik', cls: 'right', render: (r) => money(r.sgk + r.unemp) },
        { label: 'Gelir v.', cls: 'right', render: (r) => `${money(r.incomeTax)}${r.taxEx ? `<div class="small faint">istisna ${money(r.taxEx)}</div>` : ''}` },
        { label: 'Damga v.', cls: 'right', render: (r) => money(r.stamp) },
        { label: 'Net', cls: 'right', render: (r) => money(r.netSalary) },
        { label: 'Avans', cls: 'right', render: (r) => (r.adv ? `<span style="white-space:nowrap">−${money(r.adv)}</span>` : '-') },
        { label: 'Ödenecek', cls: 'right', render: (r) => `<b style="${r.net < 0 ? 'color:var(--err)' : ''}">${money(r.net)}</b>` },
        { label: 'İşveren maliyeti', cls: 'right', render: (r) => money(r.cost) },
      ], actions: [{ icon: 'print', act: 'slip', title: 'Bordro pusulası' }], foot: `${rows.length} personel · kümülatif GV matrahı yılbaşından itibaren hesaplanır` })}</div>
      ${advs.length ? `<div class="card mt"><div class="card-h"><h3>Bu ayın avansları</h3></div>${table({ rows: advs, columns: [{ label: 'Tarih', render: (a) => NS.date(a.date) }, { label: 'Personel', render: (a) => esc(emp(a.emp).name) }, { label: 'Not', render: (a) => esc(a.note || '') }, { label: 'Tutar', cls: 'right', render: (a) => money(a.amount) }], actions: closed ? [] : [{ icon: 'trash', act: 'advd', title: 'Avansı sil' }] })}</div>` : ''}
      <p class="small faint mt">SGK günü puantajdan (ücretsiz izin, devamsızlık, ay içi giriş/çıkış) gelir; gelir vergisi yılbaşından kümülatif matrahla ve asgari ücret istisnası düşülerek hesaplanır. Tatilde çalışılan gün için bir günlük ücret eklenir (4857 md. 47). ${P.year} parametreleri: asgari ücret ${money(P.minGross)} brüt · SGK tavanı ${money(P.minGross * P.ceilingX)} · işveren SGK %${P.sgkEr} (teşvik −${P.incentive} puan). Değerler Ayarlar &gt; Bordro'dan güncellenir; resmi beyan öncesi mali müşavirinizle teyit edin.</p>
      ${(() => { const d = new Date(); const old = d.getFullYear() > Number(P.year); const cap = !S().severanceCap && (d.getFullYear() > 2026); return old || cap ? `<div class="card pad mt" style="border-color:var(--warn)"><b>Bordro parametreleri ${P.year} yılı içindir.</b> Asgari ücret, vergi dilimleri ve kıdem tavanı yeni dönemde değişir; Ayarlar &gt; Bordro'dan güncelleyin.</div>` : ''; })()}`;
    const go = (d) => { const x = new Date(ym + '-15'); x.setMonth(x.getMonth() + d); ym = iso(x).slice(0, 7); app.refresh(); };
    on(el, 'click', '[data-m]', (e, b) => go(Number(b.dataset.m)));
    on(el, 'click', '[data-act="slip"]', (e, b) => NS.docs.print('pusula', slipDoc(rows.find((x) => x.id === b.dataset.id), ym)));
    on(el, 'click', '[data-act="advd"]', async (e, b) => { const a = db.get('advances', b.dataset.id); if (await confirm(`${emp(a.emp).name} için ${money(a.amount)} avans silinsin mi?`)) { db.remove('advances', a.id); db.log('Avans silindi', `${emp(a.emp).name} · ${money(a.amount)}`); dirty(); app.refresh(); } });
    $('#slips', el).onclick = () => { if (!rows.length) return toast('Personel yok', 'err'); NS.printHtml(rows.map((r) => `<div style="page-break-after:always">${NS.docs.render('pusula', slipDoc(r, ym))}</div>`).join(''), { title: 'Bordro pusulaları' }); };
    if ($('#adv', el)) $('#adv', el).onclick = async () => {
      const v = await formModal({ title: 'Avans', fields: [{ name: 'emp', label: 'Personel', type: 'select', options: monthEmps(ym).map((e) => ({ value: e.id, label: e.name })) }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'note', label: 'Not' }] }); if (!v) return;
      const n = Number(v.amount); if (!v.emp || !(n > 0)) return toast('Personel ve tutar girin', 'err'); if (isClosed(String(v.date).slice(0, 7))) return toast('Bu ayın bordrosu kapatıldı', 'err');
      const left = payroll(emp(v.emp), String(v.date).slice(0, 7)).net; if (n > left && !(await confirm(`Avans, bu ayın kalan netini (${money(left)}) aşıyor. Yine de verilsin mi?`, { ok: 'Ver', danger: false }))) return;
      db.insert('advances', { ...v, amount: n }); db.log('Avans', `${emp(v.emp).name} · ${money(n)}`); dirty(); app.refresh();
    };
    if ($('#cls', el)) $('#cls', el).onclick = async () => {
      if (!rows.length) return toast('Bu ay için personel yok', 'err');
      if (!(await confirm(`${monthName(ym)} bordrosu kapatılsın mı?${empties ? ` ${empties} boş puantaj günü çalışılmış sayılacak.` : ''} Puantaj ve tutarlar dondurulur.`, { ok: 'Kapat', danger: false }))) return;
      const snap = rows.map(({ e, id, ...x }) => ({ emp: e.id, name: e.name, dept: e.dept, ...x }));
      db.insert('payClosed', { ym, at: new Date().toISOString(), by: (NS.currentUser || {}).name || '', rows: snap }); db.log('Bordro dönemi kapatıldı', ym); dirty(); toast('Dönem kapatıldı', 'ok'); app.refresh();
    };
    if ($('#open', el)) $('#open', el).onclick = async () => { if (!(await confirm(`${monthName(ym)} dönemi yeniden açılsın mı? Tutarlar güncel maaş ve puantajla yeniden hesaplanır; beyan edilmiş bir dönemse düzeltme beyanı gerekebilir.`, { ok: 'Dönemi aç' }))) return; db.remove('payClosed', closed.id); db.log('Bordro dönemi açıldı', ym); dirty(); app.refresh(); };
    if ($('#paid', el)) $('#paid', el).onclick = async () => { const v = await formModal({ title: 'Maaş ödemesi', fields: [{ name: 'date', label: 'Ödeme tarihi', type: 'date', required: true, value: today() }] }); if (v) { closed.paidAt = v.date; db.log('Maaş ödendi işaretlendi', ym); db.save(); app.refresh(); } };
    $('#pr', el).onclick = () => NS.docs.print('odeme', { title: 'Maaş ödeme listesi', no: monthName(ym), lines: rows.map((r) => ({ name: r.e.name, note: r.e.iban || 'IBAN yok', qty: 1, total: r.net })), totals: [['Toplam', sum(rows, (r) => r.net), true]] });
    $('#bank', el).onclick = async () => {
      const miss = rows.filter((r) => !r.e.iban); if (miss.length && !(await confirm(`${miss.length} personelin IBAN’ı yok, listeye alınmayacak. Devam edilsin mi?`, { ok: 'Devam', danger: false }))) return;
      const list = rows.filter((r) => r.e.iban && r.net > 0).map((r) => ({ name: r.e.name, iban: r.e.iban, amount: r.net, desc: `${ym} maaş` }));
      const r = NS.integ ? await NS.integ.call('bankamaas', 'toplu-odeme', { month: ym, total: sum(list, (x) => x.amount), list }) : null;
      if (r && r.simulated) toast('Banka TEST — maaş talimatı gönderilmedi (simülasyon); ödendi işaretlenmedi', 'warn');
      else if (r && r.ok) { db.saveSettings({ ['paid_' + ym]: r.ref }); if (closed) { closed.paidAt = today(); db.save(); } toast(`${list.length} kişilik maaş talimatı bankaya iletildi (${r.ref})`, 'ok'); }
    };
    $('#eb', el).onclick = async () => {
      const r = NS.integ ? await NS.integ.call('ebordro', 'gonder', { month: ym, list: rows.map((x) => ({ tc: x.e.tc, name: x.e.name, phone: x.e.phone, gross: x.gross, days: x.days, sgk: x.sgk, unemp: x.unemp, incomeTax: x.incomeTax, stamp: x.stamp, netSalary: x.netSalary, net: x.net, ot: x.otPay, adv: x.adv })) }) : null;
      if (r && r.simulated) toast('e-Bordro TEST — gönderilmedi (simülasyon)', 'warn'); else if (r && r.ok) toast(`${rows.length} personele e-bordro iletildi`, 'ok');
    };
    $('#ex', el).onclick = () => NS.csv(`maas-${ym}`, rows, [{ label: 'Ad Soyad', value: (r) => r.e.name }, { label: 'IBAN', value: (r) => r.e.iban }, { label: 'Tutar', value: (r) => r.net }, { label: 'Açıklama', value: () => `${ym} maaş` }]);
  }

  // ---------- Belge ve zimmet ----------
  function filesPage(el, p, app) {
    const soon = () => iso(addDays(new Date(), 30));
    NS.crud(el, app, {
      col: 'files', title: 'Belge & Zimmet', sub: 'Süreli belgeler (ehliyet, sağlık raporu, eğitim) ve personele teslim edilen eşya', single: 'Kayıt', addLabel: 'Yeni kayıt', emptyIcon: 'file',
      fields: () => [{ name: 'emp', label: 'Personel', type: 'select', options: db.all('employees').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((e) => ({ value: e.id, label: e.name })) }, { name: 'kind', label: 'Tür', type: 'select', options: [{ value: 'belge', label: 'Süreli belge' }, { value: 'zimmet', label: 'Zimmet' }] }, { name: 'name', label: 'Ad', required: true, placeholder: 'Ör. SRC belgesi, dizüstü bilgisayar' }, { name: 'no', label: 'Belge / seri no' }, { name: 'date', label: 'Veriliş tarihi', type: 'date' }, { name: 'due', label: 'Geçerlilik sonu', type: 'date' }, { name: 'back', label: 'İade tarihi (zimmet)', type: 'date' }, { name: 'note', label: 'Not', full: true }],
      defaults: () => ({ kind: 'belge', date: today() }), sort: (a, b) => String(a.due || '9').localeCompare(String(b.due || '9')), searchFields: (f) => [emp(f.emp).name, f.name, f.no],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'soon', label: '30 gün içinde dolan', test: (f) => f.kind === 'belge' && f.due && f.due <= soon() }, { value: 'z', label: 'Zimmette', test: (f) => f.kind === 'zimmet' && !f.back }],
      columns: [{ key: 'name', label: 'Kayıt', render: (f) => `<b>${esc(f.name)}</b><div class="small faint">${esc(f.no || '')}</div>` }, { label: 'Personel', render: (f) => esc(emp(f.emp).name) }, { key: 'kind', label: 'Tür', render: (f) => badge(f.kind === 'zimmet' ? 'Zimmet' : 'Belge', f.kind === 'zimmet' ? 'info' : 'acc') }, { key: 'due', label: 'Geçerlilik', render: (f) => (f.due ? (f.due < today() ? badge('Doldu ' + NS.date(f.due), 'err') : f.due <= soon() ? badge(NS.date(f.due), 'warn') : NS.date(f.due)) : '-') }, { key: 'back', label: 'İade', render: (f) => (f.kind === 'zimmet' ? (f.back ? NS.date(f.back) : badge('Personelde', 'warn')) : '-') }],
      extraActions: [{ icon: 'print', act: 'zt', title: 'Zimmet tutanağı', show: (f) => f.kind === 'zimmet' }],
      onAction: (a, f) => { const e = emp(f.emp); NS.docs.print('zimmet', { title: 'Zimmet tutanağı', no: f.no || '', party: { title: 'Teslim alan', name: e.name, lines: [`TC ${e.tc || '-'}`, `${e.dept || ''} / ${e.title || ''}`] }, info: [['Eşya', f.name], ['Seri no', f.no || '-'], ['Teslim tarihi', toDate(f.date)]], note: `${f.note ? f.note + '\n' : ''}Yukarıdaki eşyayı sağlam olarak teslim aldım. İşten ayrılırken iade edeceğim.` }); },
    });
  }

  function dashboard(el, p, app) {
    const es = emps(); const t = today(); const y = t.slice(0, 4);
    const todayC = es.map((e) => ({ e, c: cell(e.id, t) }));
    const absent = todayC.filter((x) => x.c && ['I', 'R', 'U', 'D'].includes(x.c.s));
    const pending = db.all('leaves', (l) => l.status === 'bekliyor' && inScope(emp(l.emp)));
    const week = [0, 1, 2, 3, 4, 5, 6].map((k) => iso(addDays(new Date(), k)).slice(5));
    const bdays = es.filter((e) => e.birth && week.includes(e.birth.slice(5)));
    const anniv = es.filter((e) => e.start.slice(5, 7) === t.slice(5, 7) && seniority(e) >= 1);
    const fmHigh = es.filter((e) => fmYear(e.id, y) >= FM_YEAR - 30);
    // Yasal yükümlülükler: işe giriş bildirimi girişten önce (5510 md. 8), ayrılış 10 gün içinde (md. 9)
    const inn = isSef() ? [] : es.filter((e) => !e.sgkIn && !e.sgkInDone && daysBetween(e.start, new Date()) <= 30 && daysBetween(e.start, new Date()) >= -30);
    const out = isSef() ? [] : db.all('employees', (e) => e.end && !e.sgkOut && !e.sgkOutDone && daysBetween(e.end, new Date()) <= 10);
    const docs = isSef() ? [] : db.all('files', (f) => f.kind === 'belge' && f.due && f.due <= iso(addDays(new Date(), 30)));
    const notice = !isSef() ? [...inn.map((e) => ({ k: `in|${e.id}`, tx: `${e.name}: SGK işe giriş bildirimi (giriş ${NS.date(e.start)}, en geç başlamadan önce)`, btn: 'Bildirdim' })), ...out.map((e) => ({ k: `out|${e.id}`, tx: `${e.name}: SGK işten ayrılış bildirimi, son gün ${NS.date(addDays(e.end + 'T12:00', 10))}`, btn: 'Bildirdim' })), ...docs.map((f) => ({ tx: `${emp(f.emp).name}: ${f.name} ${f.due < t ? 'süresi doldu' : 'bitiyor'} (${NS.date(f.due)})` }))] : [];
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/puantaj">${icon('grid')} Puantaj</a>`) + `
      <div class="grid g4 mb">${kpi('Aktif personel', es.length, 'users')}${kpi('Bugün işte', todayC.filter((x) => !x.c || x.c.s === 'C' || x.c.s === 'T').length, 'check', 'ok')}${kpi('Bugün izinli/raporlu', absent.length, 'calendar', 'warn')}${kpi('Onay bekleyen izin', pending.length, 'bell', 'info')}</div>
      ${notice.length ? `<div class="card mb"><div class="card-h"><h3>${icon('alert')} Yapılacaklar (${notice.length})</h3></div><div class="card-b">${notice.slice(0, 12).map((n) => `<div class="list-item small"><span class="grow">${esc(n.tx)}</span>${n.btn ? `<button class="btn sm" data-done="${esc(n.k)}">${n.btn}</button>` : ''}</div>`).join('')}</div></div>` : ''}
      ${fmHigh.length ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} ${y} fazla mesaisi ${FM_YEAR} saate yaklaşan veya aşan: ${fmHigh.map((e) => `${esc(e.name)} (${num(fmYear(e.id, y))} s)`).join(', ')}.</div>` : ''}
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>Bugün yok</h3></div><div class="card-b">${absent.map((x) => `<div class="list-item small"><b class="grow">${esc(x.e.name)}</b><span class="badge s-${x.c.s}" style="border:0">${PS[x.c.s]}</span></div>`).join('') || '<div class="faint small">Herkes işte</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('gift')} Doğum günleri (7 gün)</h3></div><div class="card-b">${bdays.map((e) => `<div class="list-item small"><b class="grow">${esc(e.name)}</b>${NS.date(e.birth).slice(0, 5)}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('award')} Bu ay iş yıldönümü</h3></div><div class="card-b">${anniv.map((e) => `<div class="list-item small"><b class="grow">${esc(e.name)}</b>${seniority(e)}. yıl</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Departman dağılımı</h3></div><div class="card-b">${es.length ? chart.donut(Object.entries(NS.groupBy(es, (e) => e.dept)).map(([label, v]) => ({ label, value: v.length })), { size: 130 }) : '<div class="faint small">Personel yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Bu ay devamsızlık (gün)</h3></div><div class="card-b">${es.length ? chart.bars(Object.entries(NS.groupBy(es, (e) => e.dept)).map(([label, v]) => ({ label, value: sum(v, (e) => { const st = monthStats(e, t.slice(0, 7)); return st.D + st.U + st.R; }) })), { color: '#dc2626' }) : '<div class="faint small">Personel yok</div>'}</div></div></div>`;
    on(el, 'click', '[data-done]', (e, b) => { const [k, id] = b.dataset.done.split('|'); const x = emp(id); x[k === 'in' ? 'sgkInDone' : 'sgkOutDone'] = today(); db.log('SGK bildirimi elle yapıldı', x.name); db.save(); app.refresh(); });
  }

  const ROLES = { admin: 'İK / Yönetici', sef: 'Departman şefi' };
  const F = (name, label, step) => ({ name, label, type: 'number', step, placeholder: String(BORDRO.DEFAULTS[name]) });
  function settingsRoute(el, p, a) {
    const sefs = db.all('users', (u) => u.role === 'sef');
    NS.settingsPage(el, a, { roles: ROLES, extra: `<div class="card"><div class="card-h"><h3>Şef departmanları</h3></div><div class="card-b">${sefs.map((u) => `<div class="list-item small"><b class="grow">${esc(u.name)}</b><select class="input" data-sd="${esc(u.id)}" style="max-width:200px"><option value="">Seçin (personel görünmez)</option>${deptList().map((d) => `<option ${u.dept === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>`).join('') || '<div class="faint small">Departman şefi rolünde kullanıcı yok</div>'}</div></div>`,
      fields: [{ type: 'section', label: 'Hesaplama' }, { name: 'depts', label: 'Departmanlar (virgülle)', full: true, placeholder: 'Üretim, Satış, Lojistik, İdari' }, { name: 'monthHours', label: 'Aylık çalışma saati', type: 'number' }, { name: 'otRate', label: 'Fazla mesai katsayısı', type: 'number', step: '0.1' }, { name: 'reportDeduct', label: 'Raporlu günler SGK gününden düşsün (rapor süresinde ücret ödenmiyor)', type: 'checkbox', full: true }, { name: 'smsLeave', label: 'İzin kararında personele SMS gönder', type: 'checkbox', full: true }, { type: 'section', label: 'Tatil günleri' }, { name: 'hol', label: 'Dinî bayram ve ek tatil günleri (YYYY-AA-GG, virgülle)', type: 'textarea', full: true, placeholder: 'Ör. 2027-03-10, 2027-03-11', hint: 'Sabit tatiller otomatik gelir. Arefe ve 28 Ekim yarım günleri ayrıca işlenmez.' }, { type: 'section', label: `Bordro parametreleri (boş bırakılan alanda ${BORDRO.DEFAULTS.year} varsayılanı kullanılır)` }, F('year', 'Parametre yılı'), F('minGross', 'Asgari ücret (brüt ₺)', '0.01'), F('ceilingX', 'SGK tavanı (asgari ücretin katı)', '0.5'), F('sgkEmp', 'SGK işçi payı %', '0.01'), F('unempEmp', 'İşsizlik işçi payı %', '0.01'), F('sgkEr', 'SGK işveren payı %', '0.01'), F('unempEr', 'İşsizlik işveren payı %', '0.01'), F('incentive', 'SGK prim indirimi (puan) — imalat 5, diğer sektörler 2', '0.01'), F('stampPermille', 'Damga vergisi (binde)', '0.01'), F('severanceCap', 'Kıdem tazminatı tavanı (₺)', '0.01'), { name: 'brackets', label: 'Gelir vergisi tarifesi (üst sınır:oran, son dilim 0:oran)', full: true, placeholder: BORDRO.DEFAULTS.brackets }] });
    $$('[data-sd]', el).forEach((s) => { s.onchange = () => { db.update('users', s.dataset.sd, { dept: s.value }); toast('Şef departmanı kaydedildi', 'ok'); }; });
  }
  NS.shell({
    id: 'ik', integrations: ['sms', 'whatsapp', 'email', 'printer', 'webhook', 'backup'], name: 'Personel & Puantaj', tagline: 'İnsan Kaynakları', icon: 'users', accent: '#475569', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'İK' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'puantaj', label: 'Puantaj', icon: 'grid' }, { id: 'vardiya', label: 'Vardiya Planı', icon: 'clock' }, { id: 'izinler', label: 'İzinler', icon: 'calendar' }, { id: 'personel', label: 'Personel', icon: 'users' }, { id: 'ozluk', label: 'Belge & Zimmet', icon: 'file', roles: ['admin'] }, { sec: 'Bordro' }, { id: 'maas', label: 'Bordro & Avans', icon: 'wallet', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, puantaj: timesheetPage, vardiya: rosterPage, izinler: leavesPage, personel: employeesPage, ozluk: filesPage, maas: payrollPage, ayarlar: settingsRoute },
  });
})();
