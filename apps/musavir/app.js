/* NEBSOFT Mali Müşavir Bürosu — beyanname takvimi, evrak takibi, mükellef kartları, ücret ve tahsilat,
   görevler, mükellef portalı mesajları */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const M = window.MSV;
  const db = new NS.DB('musavir', M.seed);
  const S = () => db.settings({});
  (S().holidays ? String(S().holidays).split(/\s+/).filter(Boolean) : []).forEach((d) => M.hol.add(d));
  let CM = null; const cli = (id) => { if (!CM) { CM = new Map(db.all('clients').map((c) => [c.id, c])); setTimeout(() => { CM = null; }, 0); } return CM.get(id) || { name: '-', phone: '' }; };
  const fin = () => !NS.currentUser || NS.currentUser.role !== 'personel';
  const r2 = (x) => Math.round(x * 100) / 100;
  const active = () => db.all('clients', (c) => !c.passive);
  const ym = (d) => iso(d).slice(0, 7);
  const thisM = () => ym(new Date());
  const tB = (k) => `<span class="badge" style="background:${M.T[k].color};color:#fff;border:0">${esc(M.T[k].name)}</span>`;
  const stB = (s) => badge(M.ST[s][0], M.ST[s][1]);
  const perTxt = (p) => (p.length === 4 ? p + ' yılı' : `${NS.MONTHS[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}`);
  // Geçici vergi ve 3 aylık KDV dönem olarak gösterilir: nisan beyanı değil, 1. dönem
  const perF = (f) => (['gecici', 'kdv3'].includes(f.type) && f.period.length === 7 ? `${f.period.slice(0, 4)} ${Math.ceil(Number(f.period.slice(5)) / 3)}. dönem` : perTxt(f.period));
  const daysLeft = (d) => Math.floor((new Date(d + 'T23:59') - Date.now()) / 864e5);
  const dueB = (f) => { if (['verildi', 'odendi'].includes(f.status)) return `<span class="small faint">${NS.date(f.due)}</span>`; const n = daysLeft(f.due); return n < 0 ? badge('Gecikti!', 'err') : n <= 3 ? badge(n === 0 ? 'Bugün son gün' : `${n} gün kaldı`, 'err') : n <= 7 ? badge(`${n} gün`, 'warn') : `<span class="small">${NS.date(f.due)}</span>`; };
  let BL = null; const balance = (c) => { if (!BL) { BL = {}; db.all('fees').forEach((f) => { BL[f.client] = (BL[f.client] || 0) + f.amount; }); db.all('payments').forEach((p) => { BL[p.client] = (BL[p.client] || 0) - p.amount; }); setTimeout(() => { BL = null; }, 0); } return BL[c.id] || 0; };
  const fresh = () => { BL = null; };
  const docsOf = (c, m) => db.data.docs[`${c.id}|${m}`] || (db.data.docs[`${c.id}|${m}`] = M.DOCS.reduce((o, d) => ({ ...o, [d]: 'yok' }), {}));
  const missing = (c, m) => Object.entries(docsOf(c, m)).filter(([, v]) => v !== 'geldi').map(([k]) => k);
  // Yeni ay açıldığında beyanname listesi kendiliğinden oluşur
  function ensureMonth(m) {
    let n = 0; const has = new Set(db.all('filings').map((f) => `${f.client}|${f.type}|${f.period}`));
    active().forEach((c) => M.forMonth(c, m).forEach((x) => { if (c['skip_' + x.type] || has.has(`${c.id}|${x.type}|${x.period}`)) return; db.insert('filings', { client: c.id, ...x, status: 'bekliyor', amount: null }, true); n++; }));
    if (n) db.save();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    ensureMonth(thisM()); ensureMonth(ym(addDays(new Date(), 31)));
    const open = db.all('filings', (f) => !['verildi', 'odendi'].includes(f.status));
    const week = open.filter((f) => daysLeft(f.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
    const late = open.filter((f) => daysLeft(f.due) < 0);
    const lastM = ym(addDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -1));
    const wait = active().filter((c) => missing(c, lastM).length);
    const recv = sum(db.all('clients'), (c) => Math.max(0, balance(c))); const exp = db.all('expiries', (x) => x.date <= iso(addDays(new Date(), 30)) && !x.done).sort((a, b) => a.date.localeCompare(b.date));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()) + ` · ${db.all('clients').length} mükellef`, `<a class="btn" href="#/evrak">${icon('file')} Evrak takibi</a><a class="btn primary" href="#/takvim">${icon('calendar')} Beyanname takvimi</a>`) + `
      <div class="grid g4 mb">${kpi('Bu hafta son gün', week.length, 'clock', week.length ? 'warn' : 'ok', '<div class="small faint">Verilmemiş beyanname</div>')}${kpi('Geciken', late.length, 'alert', late.length ? 'err' : 'ok')}${kpi('Evrakı eksik mükellef', wait.length, 'file', 'info', `<div class="small faint">${perTxt(lastM)} dönemi</div>`)}${fin() ? kpi('Alacak (ücret)', money(recv), 'wallet', recv ? 'err' : 'ok') : kpi('Süresi dolan belge', exp.length, 'clock', exp.length ? 'warn' : 'ok')}</div>
      ${exp.length ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} <b>30 gün içinde süresi dolan belgeler:</b> ${exp.slice(0, 6).map((x) => `${esc(cli(x.client).name)} · ${esc(x.kind)} · ${NS.date(x.date)}`).join(' — ')} <a href="#/sureler">Tümü</a></div>` : ''}
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>${icon('alert')} Önümüzdeki 7 gün</h3><a class="btn sm" href="#/takvim">Tümü</a></div>${table({ rows: week.slice(0, 12), empty: 'Bu hafta son günü olan beyanname yok', emptyIcon: 'check', columns: [{ label: 'Beyanname', render: (f) => tB(f.type) }, { label: 'Mükellef', render: (f) => `<b>${esc(cli(f.client).name)}</b><div class="small faint">${perF(f)}</div>` }, { label: 'Durum', render: (f) => stB(f.status) }, { label: 'Son gün', render: dueB }], actions: [{ icon: 'check', act: 'done', title: 'Verildi' }] })}</div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Görevler</h3><button class="btn sm" id="nt">${icon('plus')}</button></div><div class="card-b col" style="gap:6px" id="tk"></div></div>
      <div class="card"><div class="card-h"><h3>${icon('message')} Mükellef mesajları</h3></div><div class="card-b col" style="gap:8px">${db.all('messages', (m) => m.from === 'mukellef').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4).map((m) => `<div class="small"><b>${esc(cli(m.client).name)}</b> <span class="faint">${NS.dt(m.at)}</span><div>${esc(m.text)}</div></div>`).join('') || '<span class="small faint">Mesaj yok</span>'}</div></div></div></div>
      <div class="card"><div class="card-h"><h3>Bu ayın beyannameleri</h3></div><div class="card-b">${chart.bars(Object.keys(M.T).map((k) => ({ label: M.T[k].name.split(' ')[0], value: db.all('filings', (f) => f.type === k && f.due.slice(0, 7) === thisM()).length })).filter((x) => x.value))}</div></div>`;
    const tasks = () => { $('#tk', el).innerHTML = db.all('tasks', (t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).map((t) => `<label class="list-item small" style="gap:8px"><input type="checkbox" data-t="${t.id}"><span class="grow"><b>${esc(t.title)}</b><div class="faint">${esc(cli(t.client).name)} · ${NS.date(t.due)}</div></span></label>`).join('') || '<span class="small faint">Açık görev yok</span>'; };
    on(el, 'change', '[data-t]', (e, b) => { db.update('tasks', b.dataset.t, { done: true }); tasks(); toast('Görev tamamlandı', 'ok'); });
    $('#nt', el).onclick = async () => { const v = await formModal({ title: 'Yeni görev', fields: [{ name: 'title', label: 'Görev', required: true, full: true }, { name: 'client', label: 'Mükellef', type: 'select', options: db.all('clients').map((c) => ({ value: c.id, label: c.name })) }, { name: 'due', label: 'Tarih', type: 'date', required: true }], values: { due: iso(addDays(new Date(), 3)) } }); if (v) { db.insert('tasks', { ...v, done: false }); tasks(); } };
    on(el, 'click', '[data-act=done]', (e, b) => markDone(app, db.get('filings', b.dataset.id)));
    tasks();
  }
  async function markDone(app, f) {
    const v = await formModal({ title: `${M.T[f.type].name} — ${cli(f.client).name} · ${perF(f)}`, fields: [{ name: 'amount', label: 'Tahakkuk eden vergi (₺)', type: 'number', step: '0.01', hint: 'Beyanname sonrası ödenecek tutar; mükellefe bildirilir' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'verildi', label: 'Verildi (ödeme bekleniyor)' }, { value: 'odendi', label: 'Verildi ve ödendi' }] }, { name: 'notify', label: 'Mükellefe SMS ile tahakkuku bildir', type: 'checkbox' }], values: { amount: f.amount || '', status: 'verildi', notify: true } });
    if (!v) return;
    Object.assign(f, { amount: Number(v.amount) || 0, status: v.status, at: today(), user: (NS.currentUser || {}).name });
    db.save(); toast('Kaydedildi', 'ok'); app.refresh();
    if (v.notify && f.amount) { const c = cli(f.client); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: ${perF(f)} ${M.T[f.type].name} beyannameniz verildi. Ödenecek: ${money(f.amount)} — son ödeme ${NS.date(f.due)}.` }, true).result.then((res) => toast(NS.smsText(res, 'Tahakkuk SMS'), NS.smsTone(res))); }
  }

  // ---------- Beyanname takvimi ----------
  function calendarPage(el, p, app) {
    let m = p || thisM(), type = '', st = 'acik', q = '', mineOnly = false; const uid = (NS.currentUser || {}).id;
    ensureMonth(m);
    el.innerHTML = pageHead('Beyanname Takvimi', 'Mükellef bazında tüm beyannameler — son güne göre sıralı', `${fin() ? `<button class="btn" id="ext">${icon('calendar')} Süre uzatma</button><button class="btn" id="lst">${icon('send')} Ödeme listesi gönder</button>` : ''}<button class="btn" id="pv">${icon('left')}</button><b id="ml" style="min-width:130px;text-align:center"></b><button class="btn" id="nx">${icon('right')}</button>`) + `
      <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Mükellef ara...')}<label class="small row nw" style="gap:6px"><input type="checkbox" id="mine"> Bana atananlar</label><select class="input" id="ty" style="max-width:220px"><option value="">Tüm beyannameler</option>${Object.entries(M.T).map(([k, t]) => `<option value="${k}">${esc(t.name)}</option>`).join('')}</select><div class="seg">${[['acik', 'Verilmeyen'], ['evrak', 'Evrak bekleyen'], ['bitti', 'Verilen'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === st ? 'active' : ''}">${l}</button>`).join('')}</div></div><div class="card-h hide" id="bulk" style="background:var(--app-accent-soft)"><b id="bn"></b><span class="grow"></span><button class="btn sm" data-b="hz">Hazırlanıyor</button><button class="btn sm primary" data-b="vr">${icon('check')} Verildi</button></div><div id="t"></div></div>`;
    const sel = new Set();
    const rows = () => db.all('filings', (f) => f.due.slice(0, 7) === m && (!mineOnly || cli(f.client).owner === uid) && (!type || f.type === type) && (st === 'all' || (st === 'acik' ? !['verildi', 'odendi'].includes(f.status) : st === 'bitti' ? ['verildi', 'odendi'].includes(f.status) : f.status === 'evrak')) && NS.match(q, cli(f.client).name)).sort((a, b) => a.due.localeCompare(b.due) || cli(a.client).name.localeCompare(cli(b.client).name));
    const draw = () => {
      $('#ml', el).textContent = `${NS.MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
      const r = rows();
      $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'check', empty: 'Bu filtrede beyanname yok', columns: [{ label: '', render: (f) => (['verildi', 'odendi'].includes(f.status) ? '' : `<input type="checkbox" data-sel="${f.id}" ${sel.has(f.id) ? 'checked' : ''} aria-label="Seç">`) }, { label: 'Son gün', render: dueB }, { label: 'Beyanname', render: (f) => `${tB(f.type)}<div class="small faint mt">${perF(f)}</div>` }, { label: 'Mükellef', render: (f) => `<b>${esc(cli(f.client).name)}</b><div class="small faint">${esc(M.TYPES[cli(f.client).type] || '')}</div>` }, { label: 'Evrak', render: (f) => { const n = missing(cli(f.client), f.period.length === 7 ? f.period : thisM()).length; return n ? badge(`${n} eksik`, 'warn') : badge('Tam', 'ok'); } }, { label: 'Durum', render: (f) => stB(f.status) }, { label: 'Tahakkuk', cls: 'right', render: (f) => (f.amount != null ? money(f.amount) : '-') }, { label: 'Yapan', render: (f) => `<span class="small faint">${esc(f.user || '')}</span>` }], actions: [{ icon: 'check', act: 'done', title: 'Verildi', show: (f) => !['verildi', 'odendi'].includes(f.status) }, { icon: 'cash', act: 'paid', title: 'Ödendi', show: (f) => f.status === 'verildi' }], foot: `${r.length} beyanname · tahakkuk ${money(sum(r, (f) => f.amount || 0))}` });
      $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} seçili`;
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#ty', el).onchange = (e) => { type = e.target.value; draw(); };
    $('#mine', el).onchange = (e) => { mineOnly = e.target.checked; draw(); };
    // GİB süre uzatması: seçilen türün açık beyannamelerinin son günü toplu değişir
    if ($('#ext', el)) $('#ext', el).onclick = async () => { const v = await formModal({ title: `Süre uzatma — ${$('#ml', el).textContent}`, fields: [{ name: 'type', label: 'Beyanname', type: 'select', options: Object.entries(M.T).map(([value, t]) => ({ value, label: t.name })) }, { name: 'date', label: 'Yeni son gün', type: 'date', required: true }, { name: 'ref', label: 'GİB duyurusu / sirküler no', required: true, full: true }] }); if (!v) return; const L = db.all('filings', (f) => f.type === v.type && f.due.slice(0, 7) === m && !['verildi', 'odendi'].includes(f.status)); if (!L.length) return toast('Bu ayda açık beyanname yok', 'warn'); if (!(await confirm(`${L.length} beyannamenin son günü ${NS.date(v.date)} yapılsın mı?`, { danger: false }))) return; L.forEach((f) => { f.dueOld = f.dueOld || f.due; f.due = v.date; f.extRef = v.ref; }); db.log('Süre uzatma', `${M.T[v.type].name} · ${L.length} · ${NS.date(v.date)} · ${v.ref}`); db.save(); toast(`${L.length} beyanname güncellendi`, 'ok'); draw(); };
    if ($('#lst', el)) $('#lst', el).onclick = async () => { const by = NS.groupBy(db.all('filings', (f) => f.due.slice(0, 7) === m && f.status === 'verildi' && f.amount > 0), (f) => f.client); const L = Object.entries(by); if (!L.length) return toast('Ödenecek tahakkuk yok', 'warn'); if (!(await confirm(`${L.length} mükellefe ödeme listesi SMS ile gönderilsin mi?`, { danger: false }))) return; NS.smsBatch(db, L.map(([id, fs]) => { const c = cli(id); return { to: c.phone, name: c.name, text: `${S().bizName}: ödenecek vergileriniz: ${fs.map((f) => `${M.T[f.type].name} ${money(f.amount)} (${NS.date(f.due)})`).join(', ')}. Toplam ${money(sum(fs, (f) => f.amount))}.` }; }), 'ödeme listesi'); };
    $('#pv', el).onclick = () => { const d = new Date(m + '-01'); d.setMonth(d.getMonth() - 1); m = ym(d); ensureMonth(m); sel.clear(); draw(); };
    $('#nx', el).onclick = () => { const d = new Date(m + '-01'); d.setMonth(d.getMonth() + 1); m = ym(d); ensureMonth(m); sel.clear(); draw(); };
    on(el, 'click', '[data-f]', (e, b) => { st = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'change', '[data-sel]', (e, b) => { b.checked ? sel.add(b.dataset.sel) : sel.delete(b.dataset.sel); $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} seçili`; });
    on(el, 'click', '[data-b]', (e, b) => { sel.forEach((id) => { const f = db.get('filings', id); f.status = b.dataset.b === 'vr' ? 'verildi' : 'hazirlaniyor'; if (b.dataset.b === 'vr') { f.at = today(); f.user = (NS.currentUser || {}).name; } }); db.save(); toast(`${sel.size} beyanname güncellendi`, 'ok'); sel.clear(); draw(); });
    on(el, 'click', '[data-act=done]', (e, b) => markDone(app, db.get('filings', b.dataset.id)));
    on(el, 'click', '[data-act=paid]', (e, b) => { db.update('filings', b.dataset.id, { status: 'odendi' }); draw(); });
    draw();
  }

  // ---------- Evrak takibi ----------
  function docsPage(el, p, app) {
    let m = ym(addDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -1));
    const SYM = { geldi: ['✓', 'ok'], eksik: ['½', 'warn'], yok: ['—', 'err'] };
    el.innerHTML = pageHead('Evrak Takibi', `Mükelleflerden gelmesi gereken belgeler — her ayın ${S().docDay || 10}'una kadar`, `<button class="btn primary" id="rem">${icon('send')} Eksiklere hatırlatma gönder</button>`) + `<div class="card"><div class="card-h"><b id="ml"></b><span class="grow"></span><span class="small muted">Hücreye tıklayın: geldi → eksik → yok</span></div><div id="t"></div></div>`;
    const draw = () => {
      $('#ml', el).textContent = `${perTxt(m)} dönemi evrakları`;
      $('#t', el).innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mükellef</th>${M.DOCS.map((d) => `<th class="center" style="font-size:11px">${esc(d)}</th>`).join('')}<th class="right">Eksik</th></tr></thead><tbody>${active().map((c) => { const d = docsOf(c, m); const n = missing(c, m).length; return `<tr><td><b>${esc(c.name)}</b><div class="small faint">${esc(c.contact || '')}</div></td>${M.DOCS.map((k) => `<td class="center"><button class="badge ${SYM[d[k]][1]}" data-c="${c.id}" data-d="${esc(k)}" style="cursor:pointer;min-width:34px;justify-content:center;border:0">${SYM[d[k]][0]}</button></td>`).join('')}<td class="right">${n ? badge(n, 'err') : badge('Tam', 'ok')}</td></tr>`; }).join('')}</tbody></table></div>`;
    };
    on(el, 'click', '[data-c]', (e, b) => { const d = docsOf(cli(b.dataset.c), m); const k = b.dataset.d; d[k] = d[k] === 'geldi' ? 'eksik' : d[k] === 'eksik' ? 'yok' : 'geldi'; const c = cli(b.dataset.c); if (!missing(c, m).length) db.all('filings', (f) => f.client === c.id && f.status === 'evrak').forEach((f) => { f.status = 'hazirlaniyor'; }); db.save(); draw(); });
    $('#rem', el).onclick = async () => {
      const L = active().filter((c) => missing(c, m).length && c.phone); if (!L.length) return toast('Eksik evrak yok', 'ok');
      if (!(await confirm(`${L.length} mükellefe eksik evrak hatırlatması (SMS) gönderilsin mi?`))) return;
      NS.smsBatch(db, L.map((c) => ({ to: c.phone, name: c.name, text: `${S().bizName}: ${perTxt(m)} dönemi için eksik evraklarınız: ${missing(c, m).join(', ')}. Mükellef portalından bildirebilirsiniz.` })), 'evrak hatırlatması'); L.forEach((c) => { db.all('filings', (f) => f.client === c.id && f.period === m && f.status === 'bekliyor').forEach((f) => { f.status = 'evrak'; }); });
      db.save(); draw();
    };
    draw();
  }

  // ---------- Mükellefler ----------
  function clientsPage(el, p, app) {
    const types = Object.entries(M.T).map(([k, t]) => ({ name: 'skip_' + k, label: `${t.name} takip edilmesin`, type: 'checkbox' }));
    NS.crud(el, app, { canDelete: (c) => (db.find('fees', (f) => f.client === c.id) || db.find('payments', (x) => x.client === c.id) ? 'Bu mükellefin hareketi var; silmek yerine pasife alın.' : true), col: 'clients', title: 'Mükellefler', sub: 'Mükellef kartları ve portal giriş kodları', single: 'Mükellef', addLabel: 'Yeni mükellef', emptyIcon: 'building',
      fields: () => [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(M.TYPES).map(([value, label]) => ({ value, label })) }, { name: 'defter', label: 'Defter', type: 'select', options: [{ value: 'isletme', label: 'İşletme defteri' }, { value: 'bilanco', label: 'Bilanço' }, { value: 'serbest', label: 'Serbest meslek kazanç defteri' }] }, { name: 'kdv', label: 'KDV dönemi', type: 'select', options: [{ value: 'aylik', label: 'Aylık' }, { value: 'uc', label: '3 aylık' }, { value: 'yok', label: 'KDV mükellefi değil' }] }, { name: 'edefter', label: 'e-Defter mükellefi', type: 'checkbox' }, { name: 'vkn', label: 'VKN / TCKN', required: true }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'staff', label: 'Personel sayısı', type: 'number' }, ...(fin() ? [{ name: 'fee', label: 'Aylık ücret (₺)', type: 'number' }] : []), { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'owner', label: 'Sorumlu personel', type: 'select', options: [{ value: '', label: 'Atanmadı' }, ...db.all('users').map((u) => ({ value: u.id, label: u.name }))] }, { name: 'note', label: 'Not', full: true }, { name: 'passive', label: 'Pasif (hizmet bitti)', type: 'checkbox' }, { type: 'section', label: 'Beyanname istisnaları' }, ...types],
      defaults: { type: 'sahis', defter: 'isletme', kdv: 'aylik', staff: 0 },
      onSave: () => ensureMonth(thisM()),
      searchFields: (c) => [c.name, c.vkn, c.contact],
      filters: [{ value: 'all', label: 'Aktif', test: (c) => !c.passive }, { value: 'sirket', label: 'Şirketler', test: (c) => !c.passive && ['ltd', 'as'].includes(c.type) }, { value: 'sahis', label: 'Şahıs / serbest', test: (c) => !c.passive && ['sahis', 'serbest'].includes(c.type) }, ...(fin() ? [{ value: 'borc', label: 'Ücret borcu olan', test: (c) => balance(c) > 0 }] : []), { value: 'pas', label: 'Pasif', test: (c) => c.passive }],
      columns: [{ key: 'name', label: 'Mükellef', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(M.TYPES[c.type])} · VKN ${esc(c.vkn)} · ${esc(c.taxOffice || '')}</div>` }, { label: 'Defter', render: (c) => `${c.defter === 'bilanco' ? 'Bilanço' : c.defter === 'serbest' ? 'Serbest meslek' : 'İşletme'}${c.edefter ? ' ' + badge('e-Defter', 'info') : ''}` }, { key: 'staff', label: 'Personel', cls: 'right' }, { label: 'Sorumlu', render: (c) => esc((db.get('users', c.owner) || {}).name || '') }, ...(fin() ? [{ key: 'fee', label: 'Ücret', cls: 'right', render: (c) => money(c.fee || 0) }, { label: 'Bakiye', cls: 'right', render: (c) => { const b = balance(c); return b > 0 ? `<b style="color:var(--err)">${money(b)}</b>` : '<span class="faint">0</span>'; } }, { label: 'Portal', render: (c) => `<span class="mono small">${esc(M.code(c))}</span>` }] : [])],
      extraActions: fin() ? [{ icon: 'globe', act: 'portal', title: 'Portal bilgisini gönder' }] : [],
      onAction: (a, c) => { NS.portalCode(db, c); const url = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'portal.html'; NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName} mükellef portalı: ${url} — VKN: ${c.vkn}, giriş kodu: ${M.code(c)}` }, true).result.then((res) => toast(NS.smsText(res, 'Portal bilgisi SMS'), NS.smsTone(res))); } });
    if (fin()) { const b = $('[data-export]', el); if (b) { b.insertAdjacentHTML('beforebegin', `<button class="btn" id="imp">${icon('upload')} Excel'den al</button>`); $('#imp', el).onclick = () => importClients(app); } }
  }
  const nrm = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
  async function importClients(app) {
    let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada satır yok', 'err');
    const C = { name: ['ünvan', 'unvan', 'mükellef', 'firma', 'ad'], vkn: ['vkn', 'tckn', 'vergino', 'vergikimlikno'], taxOffice: ['vergidairesi'], contact: ['yetkili'], phone: ['telefon', 'tel', 'gsm'], email: ['eposta', 'email', 'mail'], fee: ['ücret', 'aylıkücret'], staff: ['personel', 'personelsayısı'] };
    const keys = Object.keys(f.rows[0]); const col = {}; Object.entries(C).forEach(([k, al]) => { const h = keys.find((x) => al.includes(nrm(x))); if (h) col[k] = h; }); if (!col.name || !col.vkn) return toast('Gerekli sütunlar: Ünvan, VKN', 'err');
    const errs = []; const plan = []; f.rows.forEach((r, i) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : ''); const vkn = g('vkn').replace(/\D/g, ''); if (!g('name') || ![10, 11].includes(vkn.length)) return errs.push(`Satır ${i + 2}: ünvan veya VKN/TCKN hatalı`); const v = { name: g('name'), vkn }; ['taxOffice', 'contact', 'phone', 'email'].forEach((k) => { if (g(k)) v[k] = g(k); }); ['fee', 'staff'].forEach((k) => { if (g(k)) v[k] = Number(g(k).replace(',', '.')) || 0; }); plan.push({ v, ex: db.find('clients', (c) => String(c.vkn) === vkn) }); });
    const upd = plan.filter((x) => x.ex).length; if (!(await confirm(`${plan.length - upd} yeni, ${upd} güncelleme${errs.length ? `, ${errs.length} hatalı satır atlanacak (ilki: ${errs[0]})` : ''}. Aktarılsın mı?`))) return;
    plan.forEach((x) => { if (x.ex) Object.assign(x.ex, x.v); else db.data.clients.push({ id: NS.uid(), created: new Date().toISOString(), type: x.v.vkn.length === 11 ? 'sahis' : 'ltd', defter: 'isletme', kdv: 'aylik', staff: 0, fee: 0, ...x.v }); }); db.log('Excel aktarımı', `Mükellef: ${plan.length}`); db.save(); ensureMonth(thisM()); toast(`${plan.length} mükellef aktarıldı`, 'ok'); app.refresh();
  }
  // Mali mühür, e-imza, KEP, imza sirküleri gibi süreli belgeler
  function expiriesPage(el, p, app) {
    NS.crud(el, app, { col: 'expiries', title: 'Süreli Belgeler', sub: 'Mali mühür, e-imza, KEP, imza sirküleri ve vekâletnameler', single: 'Belge', addLabel: 'Belge ekle', emptyIcon: 'clock', fields: () => [{ name: 'client', label: 'Mükellef', type: 'select', options: active().sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => ({ value: c.id, label: c.name })) }, { name: 'kind', label: 'Belge', type: 'select', options: ['Mali mühür', 'e-İmza', 'KEP', 'İmza sirküleri', 'Vekâletname', 'Faaliyet belgesi', 'Diğer'] }, { name: 'date', label: 'Son geçerlilik', type: 'date', required: true }, { name: 'note', label: 'Not', full: true }, { name: 'done', label: 'Yenilendi', type: 'checkbox' }], sort: (a, b) => String(a.date).localeCompare(String(b.date)), filters: [{ value: 'o', label: 'Açık', test: (x) => !x.done }, { value: 'all', label: 'Tümü' }], searchFields: (x) => [cli(x.client).name, x.kind], columns: [{ key: 'date', label: 'Son gün', render: (x) => (x.done ? NS.date(x.date) : x.date < today() ? badge(NS.date(x.date), 'err') : x.date <= iso(addDays(new Date(), 30)) ? badge(NS.date(x.date), 'warn') : NS.date(x.date)) }, { label: 'Mükellef', render: (x) => `<b>${esc(cli(x.client).name)}</b>` }, { key: 'kind', label: 'Belge' }, { key: 'note', label: 'Not' }] });
  }
  function reportsPage(el, p, app) {
    let mo = thisM();
    const draw = () => { const F = db.all('filings', (f) => f.due.slice(0, 7) === mo); const late = (f) => f.at && f.at > f.due; const us = db.all('users').map((u) => { const L = F.filter((f) => f.user === u.name && ['verildi', 'odendi'].includes(f.status)); return { id: u.id, u, n: L.length, late: L.filter(late).length, cl: db.all('clients', (c) => c.owner === u.id && !c.passive).length }; }); const load = active().map((c) => ({ id: c.id, c, n: db.all('filings', (f) => f.client === c.id && f.due.slice(0, 4) === mo.slice(0, 4)).length })).map((x) => ({ ...x, per: x.n ? r2(((x.c.fee || 0) * 12) / x.n) : 0 })).sort((a, b) => a.per - b.per).slice(0, 15);
      el.innerHTML = pageHead('Raporlar', 'Personel iş yükü ve mükellef başına ücret', `<input class="input" type="month" id="mo" value="${mo}" style="max-width:170px">`) + `<div class="grid g2"><div class="card"><div class="card-h"><h3>Personel (seçilen ay)</h3></div>${table({ rows: us, columns: [{ label: 'Personel', render: (x) => `<b>${esc(x.u.name)}</b>` }, { label: 'Mükellef', cls: 'right', key: 'cl' }, { label: 'Verilen', cls: 'right', key: 'n' }, { label: 'Son günden sonra', cls: 'right', render: (x) => (x.late ? badge(x.late, 'err') : 0) }] })}</div><div class="card"><div class="card-h"><h3>Beyanname başına ücret (en düşük 15)</h3></div>${table({ rows: load, empty: 'Mükellef yok', columns: [{ label: 'Mükellef', render: (x) => `<b>${esc(x.c.name)}</b>` }, { label: 'Yıllık beyanname', cls: 'right', key: 'n' }, { label: 'Beyanname başına', cls: 'right', render: (x) => money(x.per) }] })}</div></div>`; $('#mo', el).onchange = (e) => { mo = e.target.value || thisM(); draw(); }; };
    draw();
  }

  // ---------- Ücret & tahsilat ----------
  function feesPage(el, p, app) {
    const m = thisM();
    el.innerHTML = pageHead('Ücret & Tahsilat', 'Aylık müşavirlik ücretleri, serbest meslek makbuzu ve tahsilat', `<button class="btn" id="zam">${icon('percent')} Ücretlere zam</button><button class="btn primary" id="acc">${icon('receipt')} ${NS.MONTHS[Number(m.slice(5)) - 1]} ücretlerini tahakkuk et</button>`) + `<div class="grid g4 mb" id="k"></div><div class="card"><div id="t"></div></div>`;
    const draw = () => {
      const C = active(); const recv = sum(db.all('clients'), (c) => Math.max(0, balance(c))); const mp = db.all('payments', (x) => x.at.slice(0, 7) === m);
      $('#k', el).innerHTML = `${kpi('Aylık ücret toplamı', money(sum(C, (c) => c.fee || 0)), 'wallet')}${kpi('Bu ay tahsilat', money(sum(mp, (x) => x.amount)), 'cash', 'ok')}${kpi('Toplam alacak', money(recv), 'alert', recv ? 'err' : 'ok')}${kpi('Borçlu mükellef', C.filter((c) => balance(c) > 0).length, 'users', 'warn')}`;
      const lastP = {}; db.all('payments').forEach((x) => { if (!lastP[x.client] || x.at > lastP[x.client].at) lastP[x.client] = x; });
      $('#t', el).innerHTML = table({ rows: C.map((c) => ({ id: c.id, c, b: balance(c), last: lastP[c.id] })).sort((a, b) => b.b - a.b), columns: [{ label: 'Mükellef', render: (r) => `<b>${esc(r.c.name)}</b>` }, { label: 'Aylık', cls: 'right', render: (r) => money(r.c.fee || 0) }, { label: 'Son ödeme', render: (r) => (r.last ? `${NS.date(r.last.at)} · ${money(r.last.amount)}${r.last.doc ? `<div class="small faint">${esc(r.last.doc)}</div>` : ''}` : '-') }, { label: 'Bakiye', cls: 'right', render: (r) => (r.b > 0 ? `<b style="color:var(--err)">${money(r.b)}</b><div class="small faint">${Math.round(r.b / (r.c.fee || 1))} aylık</div>` : badge('Güncel', 'ok')) }], actions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat' }, { icon: 'message', act: 'rem', title: 'Hatırlat', show: (r) => r.b > 0 }] });
    };
    on(el, 'click', '[data-act=pay]', async (e, b) => { const c = cli(b.dataset.id); const v = await formModal({ title: `Tahsilat — ${c.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', step: '0.01', required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Havale', 'Nakit', 'Kredi kartı'] }, { name: 'smm', label: 'e-SMM düzenle', type: 'checkbox' }], values: { amount: Math.max(0, balance(c)) } }); if (!v) return; const amt = r2(Number(v.amount) || 0); if (amt <= 0) return toast('Tutar sıfırdan büyük olmalı', 'err');
      const pay = db.insert('payments', { client: c.id, amount: amt, method: v.method, at: today(), doc: '' }); fresh(); db.log('Tahsilat', `${c.name} · ${money(amt)}`); draw(); toast('Tahsilat kaydedildi', 'ok'); if (!v.smm) return;
      // Makbuz tahsilatta düzenlenir; numara yalnızca entegratörden gelirse yazılır. Stopaj yalnızca kurumsal alıcıda (Hukuk ile aynı kural).
      const cfg = NS.integ ? NS.integ.cfg('esmm') : {}; const corp = String(c.vkn || '').length === 10; if (!corp && Number(cfg.stopaj) > 0) { pay.doc = 'e-SMM düzenlenmedi'; db.save(); draw(); return toast('e-SMM düzenlenmedi: gerçek kişide stopaj olmaz, ama e-SMM ayarlarında stopaj oranı girili. Makbuzu entegratör ekranından düzenleyin.', 'err'); }
      const r = NS.integ ? await NS.integ.call('esmm', 'makbuz', { name: c.name, tc: c.vkn, vkn: c.vkn, address: c.address, amount: amt, desc: `Mali müşavirlik hizmet bedeli — ${c.name}`, withholding: corp }, { silent: true }) : { ok: false, error: 'Entegrasyon modülü yok' };
      pay.doc = r.simulated ? 'TEST — e-SMM simülasyon (düzenlenmedi)' : r.ok ? `e-SMM ${r.ref || ''}` : ''; db.save(); draw(); toast(r.simulated ? 'TEST — e-SMM simülasyonda, gerçek makbuz düzenlenmedi' : r.ok ? 'e-SMM düzenlendi' : `e-SMM düzenlenemedi: ${r.disabled ? 'Entegrasyonlar > e-SMM kapalı' : r.error || 'hata'}`, r.ok && !r.simulated ? 'ok' : 'err'); });
    on(el, 'click', '[data-act=rem]', (e, b) => { const c = cli(b.dataset.id); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: Müşavirlik ücreti bakiyeniz ${money(balance(c))}. IBAN: ${S().iban || ''}` }, true).result.then((res) => toast(NS.smsText(res, 'Hatırlatma SMS'), NS.smsTone(res))); });
    $('#acc', el).onclick = async () => {
      const has = new Set(db.all('fees', (f) => f.period === m).map((f) => f.client)); const C = active().filter((c) => !has.has(c.id) && (c.fee || 0) > 0); if (!C.length) return toast('Bu ayın ücretleri zaten tahakkuk etti', 'ok');
      if (!(await confirm(`${C.length} mükellef için ${money(sum(C, (c) => c.fee || 0))} ücret tahakkuk edilsin mi? Makbuz tahsilatta düzenlenir.`, { danger: false }))) return;
      C.forEach((c) => db.insert('fees', { client: c.id, period: m, amount: c.fee }, true)); db.log('Ücret tahakkuku', `${m} · ${C.length} mükellef`); fresh(); db.save(); toast('Ücretler tahakkuk etti', 'ok'); draw();
    };
    $('#zam', el).onclick = async () => { const v = await formModal({ title: 'Ücretlere zam', fields: [{ name: 'pct', label: 'Artış (%)', type: 'number', step: '0.01', required: true }, { name: 'round', label: 'Yuvarlama (₺)', type: 'number', value: 50 }] }); if (!v) return; const pc = Number(v.pct) || 0; if (pc <= 0) return toast('Oran girin', 'err'); const st = Number(v.round) || 1; const C = active().filter((c) => c.fee > 0); if (!(await confirm(`${C.length} mükellefin ücreti %${pc} artsın mı? Yeni aylık toplam ${money(sum(C, (c) => Math.round((c.fee * (1 + pc / 100)) / st) * st))}`, { danger: false }))) return; C.forEach((c) => { c.fee = Math.round((c.fee * (1 + pc / 100)) / st) * st; }); db.log('Ücret zammı', `%${pc} · ${C.length} mükellef`); db.save(); toast('Ücretler güncellendi', 'ok'); draw(); };
    draw();
  }

  // ---------- Mesajlar ----------
  function messagesPage(el, p, app) {
    el.innerHTML = pageHead('Mükellef Mesajları', 'Portal üzerinden gelen mesaj ve belgeler') + `<div class="card" id="t"></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('messages').sort((a, b) => b.at.localeCompare(a.at)), empty: 'Mesaj yok', emptyIcon: 'message', columns: [{ label: 'Mükellef', render: (m) => `<b>${esc(cli(m.client).name)}</b><div class="small faint">${NS.dt(m.at)}</div>` }, { label: 'Kimden', render: (m) => (m.from === 'mukellef' ? badge('Mükellef', 'info') : badge('Büro', 'acc')) }, { label: 'Mesaj', render: (m) => `${esc(m.text)}${m.file ? `<div class="small mt">${icon('file')} ${esc(m.file)}</div>` : ''}` }], actions: [{ icon: 'send', act: 'r', title: 'Yanıtla', show: (m) => m.from === 'mukellef' }] }); };
    on(el, 'click', '[data-act=r]', async (e, b) => { const m = db.get('messages', b.dataset.id); const t = await NS.prompt(`${cli(m.client).name} için yanıt`, ''); if (!t) return; db.insert('messages', { client: m.client, at: new Date().toISOString(), from: 'buro', text: t }); draw(); toast('Yanıt portala iletildi', 'ok'); });
    draw();
  }

  const ROLES = { admin: 'Mali müşavir', personel: 'Büro personeli' };
  NS.shell({
    id: 'musavir', integrations: ['sms', 'email', 'whatsapp', 'efatura', 'esmm', 'edefter', 'webhook', 'backup'], name: 'Mali Müşavir', tagline: 'Beyanname & mükellef takibi', icon: 'book', accent: '#1d4ed8', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Büro' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['personel'] }, { id: 'takvim', label: 'Beyanname Takvimi', icon: 'calendar', roles: ['personel'] }, { id: 'evrak', label: 'Evrak Takibi', icon: 'file', roles: ['personel'] }, { id: 'mukellefler', label: 'Mükellefler', icon: 'building', roles: ['personel'] }, { id: 'sureler', label: 'Süreli Belgeler', icon: 'clock', roles: ['personel'] }, { id: 'mesajlar', label: 'Mesajlar', icon: 'message', badge: true, roles: ['personel'] }, { sec: 'Finans' }, { id: 'ucret', label: 'Ücret & Tahsilat', icon: 'wallet', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ mesajlar: db.all('messages', (m) => m.from === 'mukellef' && m.at > addDays(new Date(), -3).toISOString()).length }),
    routes: { ozet: dashboard, takvim: calendarPage, evrak: docsPage, mukellefler: clientsPage, sureler: expiriesPage, raporlar: reportsPage, mesajlar: messagesPage, ucret: feesPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Büro' }, { name: 'smmNo', label: 'Ruhsat / oda sicil no' }, { name: 'docDay', label: 'Evrak teslim günü (ayın)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }, { name: 'holidays', label: 'Dinî bayram ve idari izin günleri (YYYY-AA-GG, boşlukla ayırın)', type: 'textarea', full: true }] }) },
  });
})();
