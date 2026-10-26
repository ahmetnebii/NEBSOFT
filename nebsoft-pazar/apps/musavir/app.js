/* NEBSOFT Mali Müşavir Bürosu — beyanname takvimi, evrak takibi, mükellef kartları, ücret ve tahsilat,
   görevler, mükellef portalı mesajları */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const M = window.MSV;
  const db = new NS.DB('musavir', M.seed);
  const S = () => db.settings({});
  const cli = (id) => db.get('clients', id) || { name: '-', phone: '' };
  const ym = (d) => iso(d).slice(0, 7);
  const thisM = () => ym(new Date());
  const tB = (k) => `<span class="badge" style="background:${M.T[k].color};color:#fff;border:0">${esc(M.T[k].name)}</span>`;
  const stB = (s) => badge(M.ST[s][0], M.ST[s][1]);
  const perTxt = (p) => (p.length === 4 ? p + ' yılı' : `${NS.MONTHS[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}`);
  const daysLeft = (d) => Math.floor((new Date(d + 'T23:59') - Date.now()) / 864e5);
  const dueB = (f) => { if (['verildi', 'odendi'].includes(f.status)) return `<span class="small faint">${NS.date(f.due)}</span>`; const n = daysLeft(f.due); return n < 0 ? badge('Gecikti!', 'err') : n <= 3 ? badge(n === 0 ? 'Bugün son gün' : `${n} gün kaldı`, 'err') : n <= 7 ? badge(`${n} gün`, 'warn') : `<span class="small">${NS.date(f.due)}</span>`; };
  const balance = (c) => sum(db.all('fees', (f) => f.client === c.id), (f) => f.amount) - sum(db.all('payments', (p) => p.client === c.id), (p) => p.amount);
  const docsOf = (c, m) => db.data.docs[`${c.id}|${m}`] || (db.data.docs[`${c.id}|${m}`] = M.DOCS.reduce((o, d) => ({ ...o, [d]: 'yok' }), {}));
  const missing = (c, m) => Object.entries(docsOf(c, m)).filter(([, v]) => v !== 'geldi').map(([k]) => k);
  // Yeni ay açıldığında beyanname listesi kendiliğinden oluşur
  function ensureMonth(m) {
    let n = 0;
    db.all('clients', (c) => !c.passive).forEach((c) => M.forMonth(c, m).forEach((x) => { if (!db.find('filings', (f) => f.client === c.id && f.type === x.type && f.period === x.period)) { db.insert('filings', { client: c.id, ...x, status: 'bekliyor', amount: null }, true); n++; } }));
    if (n) db.save();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    ensureMonth(thisM()); ensureMonth(ym(addDays(new Date(), 31)));
    const open = db.all('filings', (f) => !['verildi', 'odendi'].includes(f.status));
    const week = open.filter((f) => daysLeft(f.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
    const late = open.filter((f) => daysLeft(f.due) < 0);
    const lastM = ym(addDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -1));
    const wait = db.all('clients').filter((c) => missing(c, lastM).length);
    const recv = sum(db.all('clients'), (c) => Math.max(0, balance(c)));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()) + ` · ${db.all('clients').length} mükellef`, `<a class="btn" href="#/evrak">${icon('file')} Evrak takibi</a><a class="btn primary" href="#/takvim">${icon('calendar')} Beyanname takvimi</a>`) + `
      <div class="grid g4 mb">${kpi('Bu hafta son gün', week.length, 'clock', week.length ? 'warn' : 'ok', '<div class="small faint">Verilmemiş beyanname</div>')}${kpi('Geciken', late.length, 'alert', late.length ? 'err' : 'ok')}${kpi('Evrakı eksik mükellef', wait.length, 'file', 'info', `<div class="small faint">${perTxt(lastM)} dönemi</div>`)}${kpi('Alacak (ücret)', money(recv), 'wallet', recv ? 'err' : 'ok')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>${icon('alert')} Önümüzdeki 7 gün</h3><a class="btn sm" href="#/takvim">Tümü</a></div>${table({ rows: week.slice(0, 12), empty: 'Bu hafta son günü olan beyanname yok', emptyIcon: 'check', columns: [{ label: 'Beyanname', render: (f) => tB(f.type) }, { label: 'Mükellef', render: (f) => `<b>${esc(cli(f.client).name)}</b><div class="small faint">${perTxt(f.period)}</div>` }, { label: 'Durum', render: (f) => stB(f.status) }, { label: 'Son gün', render: dueB }], actions: [{ icon: 'check', act: 'done', title: 'Verildi' }] })}</div>
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
    const v = await formModal({ title: `${M.T[f.type].name} — ${cli(f.client).name} · ${perTxt(f.period)}`, fields: [{ name: 'amount', label: 'Tahakkuk eden vergi (₺)', type: 'number', step: '0.01', hint: 'Beyanname sonrası ödenecek tutar; mükellefe bildirilir' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'verildi', label: 'Verildi (ödeme bekleniyor)' }, { value: 'odendi', label: 'Verildi ve ödendi' }] }, { name: 'notify', label: 'Mükellefe SMS ile tahakkuku bildir', type: 'checkbox' }], values: { amount: f.amount || '', status: 'verildi', notify: true } });
    if (!v) return;
    Object.assign(f, { amount: Number(v.amount) || 0, status: v.status, at: today(), user: (NS.currentUser || {}).name });
    if (v.notify && f.amount) { const c = cli(f.client); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: ${perTxt(f.period)} ${M.T[f.type].name} beyannameniz verildi. Ödenecek: ${money(f.amount)} — son ödeme ${NS.date(f.due)}.` }, true); }
    db.save(); toast('Kaydedildi', 'ok'); app.refresh();
  }

  // ---------- Beyanname takvimi ----------
  function calendarPage(el, p, app) {
    let m = p || thisM(), type = '', st = 'acik', q = '';
    ensureMonth(m);
    el.innerHTML = pageHead('Beyanname Takvimi', 'Mükellef bazında tüm beyannameler — son güne göre sıralı', `<button class="btn" id="pv">${icon('left')}</button><b id="ml" style="min-width:130px;text-align:center"></b><button class="btn" id="nx">${icon('right')}</button>`) + `
      <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Mükellef ara...')}<select class="input" id="ty" style="max-width:220px"><option value="">Tüm beyannameler</option>${Object.entries(M.T).map(([k, t]) => `<option value="${k}">${esc(t.name)}</option>`).join('')}</select><div class="seg">${[['acik', 'Verilmeyen'], ['evrak', 'Evrak bekleyen'], ['bitti', 'Verilen'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === st ? 'active' : ''}">${l}</button>`).join('')}</div></div><div class="card-h hide" id="bulk" style="background:var(--app-accent-soft)"><b id="bn"></b><span class="grow"></span><button class="btn sm" data-b="hz">Hazırlanıyor</button><button class="btn sm primary" data-b="vr">${icon('check')} Verildi</button></div><div id="t"></div></div>`;
    const sel = new Set();
    const rows = () => db.all('filings', (f) => f.due.slice(0, 7) === m && (!type || f.type === type) && (st === 'all' || (st === 'acik' ? !['verildi', 'odendi'].includes(f.status) : st === 'bitti' ? ['verildi', 'odendi'].includes(f.status) : f.status === 'evrak')) && NS.match(q, cli(f.client).name)).sort((a, b) => a.due.localeCompare(b.due) || cli(a.client).name.localeCompare(cli(b.client).name));
    const draw = () => {
      $('#ml', el).textContent = `${NS.MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
      const r = rows();
      $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'check', empty: 'Bu filtrede beyanname yok', columns: [{ label: '', render: (f) => (['verildi', 'odendi'].includes(f.status) ? '' : `<input type="checkbox" data-sel="${f.id}" ${sel.has(f.id) ? 'checked' : ''} aria-label="Seç">`) }, { label: 'Son gün', render: dueB }, { label: 'Beyanname', render: (f) => `${tB(f.type)}<div class="small faint mt">${perTxt(f.period)}</div>` }, { label: 'Mükellef', render: (f) => `<b>${esc(cli(f.client).name)}</b><div class="small faint">${esc(M.TYPES[cli(f.client).type] || '')}</div>` }, { label: 'Evrak', render: (f) => { const n = missing(cli(f.client), f.period.length === 7 ? f.period : thisM()).length; return n ? badge(`${n} eksik`, 'warn') : badge('Tam', 'ok'); } }, { label: 'Durum', render: (f) => stB(f.status) }, { label: 'Tahakkuk', cls: 'right', render: (f) => (f.amount != null ? money(f.amount) : '-') }, { label: 'Yapan', render: (f) => `<span class="small faint">${esc(f.user || '')}</span>` }], actions: [{ icon: 'check', act: 'done', title: 'Verildi', show: (f) => !['verildi', 'odendi'].includes(f.status) }, { icon: 'cash', act: 'paid', title: 'Ödendi', show: (f) => f.status === 'verildi' }], foot: `${r.length} beyanname · tahakkuk ${money(sum(r, (f) => f.amount || 0))}` });
      $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} seçili`;
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#ty', el).onchange = (e) => { type = e.target.value; draw(); };
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
      $('#t', el).innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mükellef</th>${M.DOCS.map((d) => `<th class="center" style="font-size:11px">${esc(d)}</th>`).join('')}<th class="right">Eksik</th></tr></thead><tbody>${db.all('clients').map((c) => { const d = docsOf(c, m); const n = missing(c, m).length; return `<tr><td><b>${esc(c.name)}</b><div class="small faint">${esc(c.contact || '')}</div></td>${M.DOCS.map((k) => `<td class="center"><button class="badge ${SYM[d[k]][1]}" data-c="${c.id}" data-d="${esc(k)}" style="cursor:pointer;min-width:34px;justify-content:center;border:0">${SYM[d[k]][0]}</button></td>`).join('')}<td class="right">${n ? badge(n, 'err') : badge('Tam', 'ok')}</td></tr>`; }).join('')}</tbody></table></div>`;
    };
    on(el, 'click', '[data-c]', (e, b) => { const d = docsOf(cli(b.dataset.c), m); const k = b.dataset.d; d[k] = d[k] === 'geldi' ? 'eksik' : d[k] === 'eksik' ? 'yok' : 'geldi'; const c = cli(b.dataset.c); if (!missing(c, m).length) db.all('filings', (f) => f.client === c.id && f.status === 'evrak').forEach((f) => { f.status = 'hazirlaniyor'; }); db.save(); draw(); });
    $('#rem', el).onclick = async () => {
      const L = db.all('clients').filter((c) => missing(c, m).length); if (!L.length) return toast('Eksik evrak yok', 'ok');
      if (!(await confirm(`${L.length} mükellefe eksik evrak hatırlatması (SMS) gönderilsin mi?`))) return;
      L.forEach((c) => { NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: ${perTxt(m)} dönemi için eksik evraklarınız: ${missing(c, m).join(', ')}. Mükellef portalından yükleyebilirsiniz.` }, true); db.all('filings', (f) => f.client === c.id && f.period === m && f.status === 'bekliyor').forEach((f) => { f.status = 'evrak'; }); });
      db.save(); toast(`${L.length} hatırlatma gönderildi`, 'ok'); draw();
    };
    draw();
  }

  // ---------- Mükellefler ----------
  function clientsPage(el, p, app) {
    NS.crud(el, app, { col: 'clients', title: 'Mükellefler', sub: 'Mükellef kartları ve portal giriş kodları', single: 'Mükellef', addLabel: 'Yeni mükellef', emptyIcon: 'building',
      fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(M.TYPES).map(([value, label]) => ({ value, label })) }, { name: 'defter', label: 'Defter', type: 'select', options: [{ value: 'isletme', label: 'İşletme defteri' }, { value: 'bilanco', label: 'Bilanço' }, { value: 'serbest', label: 'Serbest meslek kazanç defteri' }] }, { name: 'kdv', label: 'KDV dönemi', type: 'select', options: [{ value: 'aylik', label: 'Aylık' }, { value: 'uc', label: '3 aylık' }, { value: 'yok', label: 'KDV mükellefi değil' }] }, { name: 'edefter', label: 'e-Defter mükellefi', type: 'checkbox' }, { name: 'vkn', label: 'VKN / TCKN', required: true }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'staff', label: 'Personel sayısı', type: 'number' }, { name: 'fee', label: 'Aylık ücret (₺)', type: 'number' }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'note', label: 'Not', full: true }],
      defaults: { type: 'sahis', defter: 'isletme', kdv: 'aylik', staff: 0 },
      onSave: () => ensureMonth(thisM()),
      searchFields: (c) => [c.name, c.vkn, c.contact],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'sirket', label: 'Şirketler', test: (c) => ['ltd', 'as'].includes(c.type) }, { value: 'sahis', label: 'Şahıs / serbest', test: (c) => ['sahis', 'serbest'].includes(c.type) }, { value: 'borc', label: 'Ücret borcu olan', test: (c) => balance(c) > 0 }],
      columns: [{ key: 'name', label: 'Mükellef', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(M.TYPES[c.type])} · VKN ${esc(c.vkn)} · ${esc(c.taxOffice || '')}</div>` }, { label: 'Defter', render: (c) => `${c.defter === 'bilanco' ? 'Bilanço' : c.defter === 'serbest' ? 'Serbest meslek' : 'İşletme'}${c.edefter ? ' ' + badge('e-Defter', 'info') : ''}` }, { key: 'staff', label: 'Personel', cls: 'right' }, { key: 'fee', label: 'Ücret', cls: 'right', render: (c) => money(c.fee || 0) }, { label: 'Bakiye', cls: 'right', render: (c) => { const b = balance(c); return b > 0 ? `<b style="color:var(--err)">${money(b)}</b>` : '<span class="faint">0</span>'; } }, { label: 'Portal', render: (c) => `<span class="mono small">${esc(M.code(c))}</span>` }],
      extraActions: [{ icon: 'globe', act: 'portal', title: 'Portal bilgisini gönder' }],
      onAction: (a, c) => { NS.portalCode(db, c); const url = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'portal.html'; NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName} mükellef portalı: ${url} — VKN: ${c.vkn}, giriş kodu: ${M.code(c)}` }, true); toast('Portal bilgileri SMS ile gönderildi', 'ok'); } });
  }

  // ---------- Ücret & tahsilat ----------
  function feesPage(el, p, app) {
    const m = thisM();
    el.innerHTML = pageHead('Ücret & Tahsilat', 'Aylık müşavirlik ücretleri, serbest meslek makbuzu ve tahsilat', `<button class="btn primary" id="acc">${icon('receipt')} ${NS.MONTHS[Number(m.slice(5)) - 1]} ücretlerini tahakkuk et</button>`) + `<div class="grid g4 mb" id="k"></div><div class="card"><div id="t"></div></div>`;
    const draw = () => {
      const C = db.all('clients'); const recv = sum(C, (c) => Math.max(0, balance(c))); const mp = db.all('payments', (x) => x.at.slice(0, 7) === m);
      $('#k', el).innerHTML = `${kpi('Aylık ücret toplamı', money(sum(C, (c) => c.fee || 0)), 'wallet')}${kpi('Bu ay tahsilat', money(sum(mp, (x) => x.amount)), 'cash', 'ok')}${kpi('Toplam alacak', money(recv), 'alert', recv ? 'err' : 'ok')}${kpi('Borçlu mükellef', C.filter((c) => balance(c) > 0).length, 'users', 'warn')}`;
      $('#t', el).innerHTML = table({ rows: C.map((c) => ({ id: c.id, c, b: balance(c), last: db.all('payments', (x) => x.client === c.id).sort((a, b) => b.at.localeCompare(a.at))[0] })).sort((a, b) => b.b - a.b), columns: [{ label: 'Mükellef', render: (r) => `<b>${esc(r.c.name)}</b>` }, { label: 'Aylık', cls: 'right', render: (r) => money(r.c.fee || 0) }, { label: 'Son ödeme', render: (r) => (r.last ? `${NS.date(r.last.at)} · ${money(r.last.amount)}` : '-') }, { label: 'Bakiye', cls: 'right', render: (r) => (r.b > 0 ? `<b style="color:var(--err)">${money(r.b)}</b><div class="small faint">${Math.round(r.b / (r.c.fee || 1))} aylık</div>` : badge('Güncel', 'ok')) }], actions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat' }, { icon: 'message', act: 'rem', title: 'Hatırlat', show: (r) => r.b > 0 }] });
    };
    on(el, 'click', '[data-act=pay]', async (e, b) => { const c = cli(b.dataset.id); const v = await formModal({ title: `Tahsilat — ${c.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Havale', 'Nakit', 'Kredi kartı'] }], values: { amount: Math.max(0, balance(c)) } }); if (!v) return; db.insert('payments', { client: c.id, amount: Number(v.amount), method: v.method, at: today() }); draw(); toast('Tahsilat kaydedildi', 'ok'); });
    on(el, 'click', '[data-act=rem]', (e, b) => { const c = cli(b.dataset.id); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: Müşavirlik ücreti bakiyeniz ${money(balance(c))}. IBAN: ${S().iban || ''}` }, true); toast('Hatırlatma gönderildi', 'ok'); });
    $('#acc', el).onclick = async () => {
      const C = db.all('clients', (c) => !db.find('fees', (f) => f.client === c.id && f.period === m)); if (!C.length) return toast('Bu ayın ücretleri zaten tahakkuk etti', 'ok');
      if (!(await confirm(`${C.length} mükellef için ${money(sum(C, (c) => c.fee || 0))} ücret tahakkuk edilsin ve serbest meslek makbuzu kesilsin mi?`))) return;
      for (const c of C) { let no = null; if (NS.ebelge) { const r = await NS.ebelge.create({ docType: 'e-Arşiv', buyer: c.name, buyerVkn: c.vkn, lines: [{ name: `${perTxt(m)} mali müşavirlik hizmet bedeli`, total: c.fee }], note: 'Serbest meslek makbuzu' }); no = r && r.no; } db.insert('fees', { client: c.id, period: m, amount: c.fee, smm: no || 'SM' + m.replace('-', '') }, true); }
      db.save(); toast('Ücretler tahakkuk etti', 'ok'); draw();
    };
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
    nav: [{ sec: 'Büro' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['personel'] }, { id: 'takvim', label: 'Beyanname Takvimi', icon: 'calendar', roles: ['personel'] }, { id: 'evrak', label: 'Evrak Takibi', icon: 'file', roles: ['personel'] }, { id: 'mukellefler', label: 'Mükellefler', icon: 'building', roles: ['personel'] }, { id: 'mesajlar', label: 'Mesajlar', icon: 'message', badge: true, roles: ['personel'] }, { sec: 'Finans' }, { id: 'ucret', label: 'Ücret & Tahsilat', icon: 'wallet', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ mesajlar: db.all('messages', (m) => m.from === 'mukellef' && m.at > addDays(new Date(), -3).toISOString()).length }),
    routes: { ozet: dashboard, takvim: calendarPage, evrak: docsPage, mukellefler: clientsPage, mesajlar: messagesPage, ucret: feesPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Büro' }, { name: 'smmNo', label: 'Ruhsat / oda sicil no' }, { name: 'docDay', label: 'Evrak teslim günü (ayın)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }] }) },
  });
})();
