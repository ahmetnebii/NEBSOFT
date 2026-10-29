/* NEBSOFT Hukuk Bürosu — dosyalar (dava/icra/arabuluculuk), duruşma ajandası, süre takibi ve hesaplayıcı
   (HMK/İİK/CMK/İYUK kuralları, data.js), masraf/avans, vekalet ücreti ve e-SMM, zaman kaydı, müvekkil portalı ve mesajlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const H = window.HKK;
  const db = new NS.DB('hukuk', H.seed);
  const S = () => db.settings({});
  const file = (id) => db.get('files', id) || { no: '-', subject: '' };
  const cli = (id) => db.get('clients', id) || { name: '-' };
  const stB = (s) => badge((H.ST[s] || [s, ''])[0], (H.ST[s] || [s, ''])[1]);
  const lawyers = () => db.all('users', (u) => u.lawyer).map((u) => u.name);
  const daysTo = (d) => Math.floor((new Date(d + 'T23:59') - Date.now()) / 864e5);
  const dueB = (d, done) => { if (done) return badge('Tamamlandı', 'ok'); const n = daysTo(d); return n < 0 ? badge('SÜRE GEÇTİ', 'err') : n === 0 ? badge('Bugün son gün', 'err') : n <= 3 ? badge(`${n} gün`, 'err') : n <= 7 ? badge(`${n} gün`, 'warn') : `<span class="small">${NS.date(d)}</span>`; };
  const balance = (cid) => sum(db.all('advances', (a) => a.client === cid), (a) => a.amount) - sum(db.all('expenses', (e) => e.client === cid), (e) => e.amount);
  const mine = () => (NS.currentUser && NS.currentUser.role === 'avukat' ? NS.currentUser.name : null);
  const isOpen = (f) => !['kapali', 'kesin'].includes(f.status);
  const holOpt = () => ({ holidays: H.list(S().holidays), half: H.list(S().halfDays) });
  const unread = () => db.all('messages', (m) => m.from === 'muvekkil' && !m.read).length;
  const me = () => (NS.currentUser || {}).name || '';
  // Menü rozetlerini sayfa yenilemeden güncelle
  const badgeSync = () => { const v = { sureler: db.all('deadlines', (d) => !d.done && daysTo(d.due) <= 3).length, mesajlar: unread() }; Object.entries(v).forEach(([k, n]) => $$(`[data-badge="${k}"]`).forEach((b) => { b.textContent = n; b.classList.toggle('hide', !n); })); };

  // Eski kayıtlar: formülle türetilen tahmin edilebilir portal kodu yerine her müvekkile rastgele kod
  (function migrate() { let ch = false; db.all('clients').forEach((c) => { if (!c.portalCode) { c.portalCode = H.newCode(); ch = true; } }); if (ch) db.save(); })();

  // Serbest metin alanına öneri listesi (mahkeme adı gibi): formModal açıldıktan sonra input'a datalist bağlanır
  const suggest = (name, values) => setTimeout(() => {
    const inp = [...document.querySelectorAll(`input[name="${name}"]`)].pop(); if (!inp) return;
    const id = 'dl-' + name; let dl = document.getElementById(id); if (!dl) { dl = document.createElement('datalist'); dl.id = id; document.body.appendChild(dl); }
    dl.innerHTML = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')).map((v) => `<option value="${esc(v)}">`).join(''); inp.setAttribute('list', id);
  }, 0);

  // Müvekkile SMS: sonuç beklenir; simülasyonda "TEST — gönderilmedi" yazar (sahte başarı yok)
  async function smsTo(c, text, what) {
    if (!c.phone) { toast(`${what}: ${c.name} için telefon kayıtlı değil`, 'err'); return { ok: false }; }
    const rec = db.insert('sms', { to: c.phone, name: c.name, text, status: 'gönderiliyor' }, true);
    const r = NS.integ ? await NS.integ.sms(c.phone, text, { silent: true }) : { ok: true, simulated: true };
    rec.status = r.simulated ? 'simülasyon' : r.ok ? 'gönderildi' : 'hata: ' + String(r.error || '').slice(0, 60); db.save();
    toast(r.simulated ? `TEST — ${what} gönderilmedi (SMS simülasyonda)` : r.ok ? `${what} SMS ile gönderildi` : `${what} gönderilemedi: ${r.error || 'SMS hatası'}`, r.ok && !r.simulated ? 'ok' : 'err');
    return r;
  }

  // ---------- Duruşma sonucu (bugün veya geçmiş) ----------
  async function hearingResult(app, h) {
    const f = file(h.file);
    const r = await formModal({ title: `Duruşma sonucu — ${NS.date(h.date)} ${h.time}`, fields: [{ name: 'result', label: 'Ara karar / sonuç', type: 'textarea', full: true, required: true }, { name: 'next', label: 'Sonraki duruşma tarihi', type: 'date' }, { name: 'time', label: 'Saat', type: 'time' }, { name: 'sms', label: 'Müvekkile SMS ile bilgi ver', type: 'checkbox' }], values: { result: h.result || '', time: h.time, sms: false } });
    if (!r) return; h.result = r.result; h.done = true;
    if (r.next) { const clash = clashOf(r.next, r.time || '10:00', f.lawyer, null); if (clash) toast(`Dikkat: ${f.lawyer} için aynı saatte başka duruşma var (${file(clash.file).court})`, 'err'); db.insert('hearings', { file: h.file, date: r.next, time: r.time || '10:00', kind: 'Devam duruşması', done: false }); }
    db.save(); app.refresh();
    if (r.sms) await smsTo(cli(f.client), `${S().bizName}: ${f.esas} dosyanızın duruşması yapıldı. ${r.result.slice(0, 90)}${r.next ? ` Sonraki duruşma: ${NS.date(r.next)} ${r.time || ''}` : ''}`, 'Duruşma bilgisi');
  }
  // Aynı avukatın aynı gün ve saatte başka duruşması
  const clashOf = (date, time, lawyer, exceptId) => db.find('hearings', (x) => x.id !== exceptId && !x.done && x.date === date && x.time === time && file(x.file).lawyer === lawyer);

  // ---------- Dosya detay ----------
  function fileModal(app, f) {
    const c = cli(f.client); const hs = db.all('hearings', (h) => h.file === f.id).sort((a, b) => b.date.localeCompare(a.date)); const dl = db.all('deadlines', (d) => d.file === f.id).sort((a, b) => a.due.localeCompare(b.due));
    const ex = db.all('expenses', (e) => e.file === f.id).sort((a, b) => String(b.at).localeCompare(String(a.at))); const adv = db.all('advances', (a) => a.file === f.id); const tm = db.all('times', (t) => t.file === f.id); const pays = db.all('payments', (p) => p.file === f.id);
    const m = modal({ title: `${f.no} · ${f.subject}`, size: 'wide', body: `<div class="grid g2"><div class="col">
        <div class="row">${badge(H.TYPES[f.type] || f.type, 'acc')} ${stB(f.status)} ${f.urgent ? badge('Adli tatilde görülür', 'warn') : ''} <span class="small muted">${esc(f.lawyer)}</span></div>
        <div class="card pad"><div class="small muted">Müvekkil (${esc(f.role || '')})</div><b>${esc(c.name)}</b> <span class="small">${esc(c.phone || '')}</span><div class="small muted mt">Karşı taraf</div><b>${esc(f.opponent || '-')}</b><div class="small muted mt">Mahkeme / daire</div>${esc(f.court)} · <span class="mono">${esc(f.esas)}</span><div class="small mt">Dava değeri ${money(f.value || 0)} · açılış ${NS.date(f.opened)}</div></div>
        <div class="card pad"><div class="list-item small"><span class="grow muted">Vekalet ücreti</span>${f.fee.type === 'yuzde' ? `%${f.fee.amount} (sonuca göre ≈ ${money((f.value * f.fee.amount) / 100)})` : money(f.fee.amount)}</div><div class="list-item small"><span class="grow muted">Tahsil edilen</span>${money(f.fee.paid || 0)}</div><div class="list-item small"><span class="grow muted">Avans / masraf</span>${money(sum(adv, (a) => a.amount))} / ${money(sum(ex, (e) => e.amount))}</div><div class="list-item small"><span class="grow muted">Harcanan süre</span>${sum(tm, (t) => t.hours)} saat</div></div>
        <div class="card"><div class="card-h"><h3>Notlar</h3><span class="small faint">müvekkil göremez</span></div><div class="card-b col" style="gap:6px">${(f.notes || []).slice().reverse().map((n) => `<div class="small"><b>${esc(n.user)}</b> <span class="faint">${NS.dt(n.at)}</span><div>${esc(n.text)}</div></div>`).join('') || '<span class="small faint">Not yok</span>'}</div></div>
        ${pays.length ? `<div class="card"><div class="card-h"><h3>${icon('cash')} Ücret tahsilatları</h3></div>${table({ rows: pays, columns: [{ label: 'Tarih', render: (p) => NS.date(p.at) }, { label: 'Belge', render: (p) => `<span class="small">${esc(p.doc || '—')}</span>` }, { label: 'Tutar', cls: 'right', render: (p) => money(p.amount) }], actions: [{ icon: 'trash', act: 'delpay', title: 'Tahsilatı sil' }] })}</div>` : ''}</div>
      <div class="col"><div class="card"><div class="card-h"><h3>${icon('calendar')} Duruşmalar</h3></div>${table({ rows: hs, empty: 'Duruşma yok', columns: [{ label: 'Tarih', render: (h) => `<b>${NS.date(h.date)}</b> ${esc(h.time)}` }, { label: 'Tür / sonuç', render: (h) => `${esc(h.kind)}${h.result ? `<div class="small faint">${esc(h.result)}</div>` : h.date < today() ? `<div>${badge('Sonuç girilmedi', 'warn')}</div>` : ''}` }], actions: [{ icon: 'check', act: 'hres', title: 'Sonuç gir', show: (h) => h.date <= today() }, { icon: 'trash', act: 'hdel', title: 'Sil' }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('clock')} Süreler</h3></div>${table({ rows: dl, empty: 'Süre yok', columns: [{ label: 'Süre', render: (d) => esc(d.kind) }, { label: 'Son gün', render: (d) => dueB(d.due, d.done) }], actions: [{ icon: 'trash', act: 'ddel', title: 'Sil' }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('wallet')} Avans ve masraflar</h3></div>${table({ rows: [...adv.map((a) => ({ ...a, k: 'a' })), ...ex.map((e) => ({ ...e, k: 'e' }))].sort((a, b) => String(b.at).localeCompare(String(a.at))), empty: 'Kayıt yok', columns: [{ label: 'Kalem', render: (x) => (x.k === 'a' ? `<b>Avans</b>` : esc(x.type)) + (x.desc ? `<div class="small faint">${esc(x.desc)}</div>` : '') }, { label: 'Tarih', render: (x) => NS.date(x.at) }, { label: 'Tutar', cls: 'right', render: (x) => (x.k === 'a' ? `<span style="color:var(--ok)">+${money(x.amount)}</span>` : `−${money(x.amount)}`) }], actions: [{ icon: 'trash', act: 'xdel', title: 'Sil' }] })}</div></div></div>`,
      actions: [{ label: 'Not', icon: 'edit', onClick: async () => { const t = await NS.prompt('Dosya notu (müvekkil göremez)', ''); if (!t) return; (f.notes = f.notes || []).push({ at: new Date().toISOString(), user: me(), text: t }); db.save(); m.close(); fileModal(app, f); } },
        { label: 'Duruşma', icon: 'calendar', onClick: () => addHearing(app, f, m) }, { label: 'Süre', icon: 'clock', onClick: () => addDeadline(app, f.id, m) }, { label: 'Masraf', icon: 'cash', onClick: () => addExpense(app, f, m) }, { label: 'Avans', icon: 'wallet', onClick: () => addAdvance(app, f, m) }, { label: 'Süre kaydı', icon: 'clock', onClick: () => addTime(f, m, app) },
        { label: 'Düzenle', cls: 'primary', icon: 'edit', onClick: (cl) => { cl(); editFile(app, f); } }] });
    const re = () => { m.close(); app.refresh(); fileModal(app, db.get('files', f.id)); };
    on(m.root, 'click', '[data-act]', async (e, b) => {
      const id = b.dataset.id; const a = b.dataset.act;
      if (a === 'hres') { m.close(); await hearingResult(app, db.get('hearings', id)); return fileModal(app, db.get('files', f.id)); }
      if (a === 'hdel' && await confirm('Duruşma silinsin mi?')) { db.remove('hearings', id); re(); }
      if (a === 'ddel' && await confirm('Süre kaydı silinsin mi?')) { db.remove('deadlines', id); re(); }
      if (a === 'xdel' && await confirm('Kayıt silinsin mi? Müvekkil bakiyesi yeniden hesaplanır.')) { if (db.get('advances', id)) db.remove('advances', id); else db.remove('expenses', id); db.log('Avans/masraf silindi', f.no); re(); }
      if (a === 'delpay' && await confirm('Tahsilat silinsin mi? Kesilen makbuz varsa entegratör üzerinden ayrıca iptal edilmelidir.')) { const p = db.get('payments', id); f.fee.paid = Math.max(0, (f.fee.paid || 0) - p.amount); db.remove('payments', id); db.log('Ücret tahsilatı silindi', `${f.no} ${money(p.amount)}`); re(); }
    });
  }
  async function addHearing(app, f, m) {
    const v = await formModal({ title: 'Duruşma ekle', fields: [{ name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'time', label: 'Saat', type: 'time', required: true }, { name: 'kind', label: 'Tür', type: 'select', options: ['Ön inceleme', 'Tahkikat', 'Tanık dinlenmesi', 'Bilirkişi incelemesi', 'Keşif', 'Karar duruşması', 'e-Duruşma'] }, { name: 'sms', label: 'Müvekkile SMS ile bildir', type: 'checkbox' }], values: { time: '10:00', sms: false } });
    if (!v) return; const clash = clashOf(v.date, v.time, f.lawyer, null);
    if (clash && !(await confirm(`${f.lawyer} için ${NS.date(v.date)} ${v.time}'da başka duruşma var (${file(clash.file).court}). Yine de eklensin mi?`))) return;
    db.insert('hearings', { file: f.id, date: v.date, time: v.time, kind: v.kind, done: false }); db.save(); m && m.close(); app.refresh(); toast('Duruşma eklendi', 'ok');
    if (v.sms) await smsTo(cli(f.client), `${S().bizName}: ${f.esas} sayılı dosyanızın duruşması ${NS.date(v.date)} saat ${v.time}, ${f.court}.`, 'Duruşma bildirimi');
  }
  async function addDeadline(app, fid, m, preset) {
    const v = await formModal({ title: 'Süre ekle', fields: [{ name: 'file', label: 'Dosya', type: 'select', options: db.all('files', isOpen).map((f) => ({ value: f.id, label: `${f.no} · ${f.subject} · ${cli(f.client).name}` })), full: true }, { name: 'rule', label: 'Süre türü', type: 'select', options: H.RULES.map((r) => ({ value: r.id, label: H.ruleLabel(r) })), full: true }, { name: 'served', label: 'Tebliğ / tefhim tarihi', type: 'date', required: true }, { name: 'n', label: 'Hâkimin verdiği süre', type: 'number', hint: 'Yalnızca "Hâkimin verdiği süre" için' }, { name: 'u', label: 'Birim', type: 'select', options: [{ value: 'g', label: 'gün' }, { value: 'h', label: 'hafta' }, { value: 'a', label: 'ay' }] }], values: { file: fid, served: today(), rule: 'hmk127', n: 14, u: 'g', ...(preset || {}) } });
    if (!v) return; const r = H.rule(v.rule); const f = file(v.file);
    const res = H.due(v.served, r, { ...holOpt(), urgent: !!f.urgent, ...(r.custom ? { n: Number(v.n) || 14, u: v.u } : {}) });
    const label = r.custom ? `${r.label} — ${Number(v.n) || 14} ${H.UNIT[v.u]}` : H.ruleLabel(r);
    db.insert('deadlines', { file: v.file, rule: r.id, kind: label, served: v.served, due: res.date, done: false, steps: res.steps, warn: res.warn, note: '' }); db.save();
    toast(`Son gün: ${NS.date(res.date)}${res.warn.length ? ' — uyarıları kontrol edin' : ''}`, res.warn.length ? 'err' : 'ok'); m && m.close(); app.refresh();
  }
  async function addExpense(app, f, m) {
    const v = await formModal({ title: 'Masraf', fields: [{ name: 'type', label: 'Masraf', type: 'select', options: ['Başvuru / peşin harç', 'Tebligat gideri', 'Bilirkişi ücreti', 'Keşif harcı', 'Tanık ücreti', 'İcra harcı', 'Arabuluculuk ücreti', 'Yol / konaklama', 'Diğer'] }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'at', label: 'Tarih', type: 'date', required: true }, { name: 'desc', label: 'Açıklama', full: true }], values: { at: today() } });
    if (!v) return; db.insert('expenses', { file: f.id, client: f.client, type: v.type, amount: Number(v.amount), at: v.at, desc: v.desc, user: me() }); const b = balance(f.client); if (b < 0) toast(`Müvekkilin avansı ${money(-b)} eksiye düştü — avans isteyin`, 'err'); db.save(); m && m.close(); app.refresh(); if (m) fileModal(app, f);
  }
  async function addAdvance(app, f, m) {
    const v = await formModal({ title: 'Masraf avansı alındı', fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'at', label: 'Tarih', type: 'date', required: true }, { name: 'desc', label: 'Açıklama (havale, nakit…)', full: true }], values: { at: today() } });
    if (!v) return; db.insert('advances', { client: f.client, file: f.id, amount: Number(v.amount), at: v.at, desc: v.desc, user: me() }); db.save(); m && m.close(); app.refresh(); if (m) fileModal(app, f); toast('Avans kaydedildi', 'ok');
  }
  async function addTime(f, m, app) { const v = await formModal({ title: 'Çalışma süresi', fields: [{ name: 'hours', label: 'Saat', type: 'number', step: '0.25', required: true }, { name: 'at', label: 'Tarih', type: 'date', required: true }, { name: 'desc', label: 'Yapılan iş', required: true, full: true }], values: { at: today() } }); if (!v) return; db.insert('times', { file: f.id, at: v.at, hours: Number(v.hours), desc: v.desc, user: me() }); m && m.close(); app.refresh(); }
  const nextNo = () => { const y = new Date().getFullYear(); const max = Math.max(99, ...db.all('files').map((f) => String(f.no || '')).filter((n) => n.startsWith(y + '/')).map((n) => Number(n.split('/')[1]) || 0)); return `${y}/${max + 1}`; };
  async function editFile(app, f) {
    const courts = [...H.COURTS, ...db.all('files').map((x) => x.court)];
    const p = formModal({ title: f ? `${f.no} düzenle` : 'Yeni dosya', size: 'wide', fields: [{ name: 'type', label: 'Tür', type: 'select', options: Object.entries(H.TYPES).map(([value, label]) => ({ value, label })) }, { name: 'client', label: 'Müvekkil', type: 'select', options: db.all('clients').map((c) => ({ value: c.id, label: c.name })) }, { name: 'role', label: 'Müvekkilin sıfatı', type: 'select', options: ['Davacı', 'Davalı', 'Alacaklı', 'Borçlu', 'Müşteki', 'Sanık', 'Katılan', 'Başvurucu', 'Danışan'] }, { name: 'subject', label: 'Konu', required: true, full: true }, { name: 'court', label: 'Mahkeme / icra dairesi', placeholder: 'ör. Ankara 3. İş Mahkemesi' }, { name: 'esas', label: 'Esas / dosya no' }, { name: 'opponent', label: 'Karşı taraf' }, { name: 'value', label: 'Dava değeri (₺)', type: 'number' }, { name: 'lawyer', label: 'Sorumlu avukat', type: 'select', options: lawyers() }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(H.ST).map(([value, s]) => ({ value, label: s[0] })) }, { name: 'feeType', label: 'Ücret', type: 'select', options: [{ value: 'sabit', label: 'Sabit ücret' }, { value: 'yuzde', label: 'Yüzde (sonuca göre)' }] }, { name: 'feeAmount', label: 'Ücret tutarı / yüzdesi', type: 'number' }, { name: 'urgent', label: 'Adli tatilde görülen iş (HMK 103: işçinin açtığı iş davası, nafaka, velayet, ihtiyati tedbir/haciz, çekişmesiz yargı, ivedi işler) — süreler adli tatilde uzamaz', type: 'checkbox', full: true }], values: f ? { ...f, feeType: f.fee.type, feeAmount: f.fee.amount } : { type: 'dava', role: 'Davacı', status: 'derdest', feeType: 'sabit', lawyer: me() } });
    suggest('court', courts); const v = await p;
    if (!v) return; if (!db.all('clients').length) return toast('Önce müvekkil ekleyin', 'err');
    const fee = { type: v.feeType, amount: Number(v.feeAmount) || 0, paid: f ? f.fee.paid : 0 }; delete v.feeType; delete v.feeAmount; v.value = Number(v.value) || 0;
    if (f) Object.assign(f, v, { fee }); else db.insert('files', { ...v, fee, no: nextNo(), opened: today(), notes: [] });
    db.save(); toast('Kaydedildi', 'ok'); app.refresh();
  }

  // ---------- Dosyalar ----------
  function filesPage(el, p, app) {
    let f = p || 'acik', q = '';
    el.innerHTML = pageHead('Dosyalar', 'Dava, icra, arabuluculuk ve danışmanlık dosyaları', `<button class="btn primary" id="add">${icon('plus')} Yeni dosya</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Dosya no, esas, müvekkil, karşı taraf...')}<div class="seg">${[['acik', 'Açık'], ['dava', 'Davalar'], ['icra', 'İcra'], ['ust', 'İstinaf / Yargıtay'], ['kapali', 'Kapanan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('files', (x) => (!mine() || x.lawyer === mine()) && NS.match(q, x.no, x.esas, x.subject, x.opponent, x.court, cli(x.client).name) && (f === 'all' || (f === 'acik' ? isOpen(x) : f === 'ust' ? ['istinaf', 'yargitay'].includes(x.status) : f === 'kapali' ? !isOpen(x) : x.type === f))).sort((a, b) => b.opened.localeCompare(a.opened));
    const next = (x) => db.all('hearings', (h) => h.file === x.id && h.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'file', empty: q ? 'Aramaya uyan dosya yok' : 'Henüz dosya yok — "Yeni dosya" ile başlayın', columns: [{ label: 'Dosya', render: (x) => `<b class="mono">${esc(x.no)}</b> ${badge(H.TYPES[x.type] || x.type, 'acc')}<div class="small">${esc(x.subject)}</div>` }, { label: 'Müvekkil / karşı taraf', render: (x) => `<b>${esc(cli(x.client).name)}</b> <span class="small faint">(${esc(x.role || '')})</span><div class="small faint">vs ${esc(x.opponent || '-')}</div>` }, { label: 'Mahkeme', render: (x) => `<span class="small">${esc(x.court || '')}</span><div class="small faint mono">${esc(x.esas || '')}</div>` }, { label: 'Sonraki duruşma', render: (x) => { const h = next(x); return h ? `${daysTo(h.date) <= 3 ? badge(NS.date(h.date), 'warn') : NS.date(h.date)} <span class="small">${esc(h.time)}</span>` : '<span class="faint">—</span>'; } }, { label: 'Avukat', render: (x) => `<span class="small">${esc(x.lawyer)}</span>` }, { label: 'Durum', render: (x) => stB(x.status) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} dosya` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => fileModal(app, db.get('files', b.dataset.id)));
    $('#add', el).onclick = () => editFile(app, null);
    draw();
  }

  // ---------- Ajanda ----------
  function agendaPage(el, p, app) {
    const days = 21; const H2 = db.all('hearings', (h) => h.date >= today() && h.date <= iso(addDays(new Date(), days)) && (!mine() || file(h.file).lawyer === mine())).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const D = db.all('deadlines', (d) => !d.done && d.due <= iso(addDays(new Date(), days)) && (!mine() || file(d.file).lawyer === mine()));
    const by = NS.groupBy([...H2.map((h) => ({ ...h, k: 'h', d: h.date })), ...D.map((d) => ({ ...d, k: 'd', d: d.due }))], (x) => x.d);
    el.innerHTML = pageHead('Ajanda', `Önümüzdeki ${days} gün — duruşmalar ve süreler`, `<button class="btn" id="ics">${icon('calendar')} Takvime aktar (.ics)</button>`) + `<div class="col" style="gap:12px">${Object.keys(by).sort().map((d) => `<div class="card"><div class="card-h"><b>${NS.dateLong(new Date(d + 'T12:00'))}</b>${d === today() ? badge('Bugün', 'acc') : ''}<span class="grow"></span><span class="small faint">${by[d].length} kayıt</span></div><div class="card-b col" style="gap:8px">${by[d].sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99'))).map((x) => { const f = file(x.file); return x.k === 'h' ? `<div class="list-item" data-f="${f.id}" style="cursor:pointer"><b style="min-width:52px">${esc(x.time)}</b>${badge('Duruşma', 'info')}<span class="grow"><b>${esc(f.court)}</b> · <span class="mono small">${esc(f.esas)}</span><div class="small muted">${esc(cli(f.client).name)} — ${esc(f.subject)} · ${esc(x.kind)}</div></span><span class="small">${esc(f.lawyer)}</span></div>` : `<div class="list-item" data-f="${f.id}" style="cursor:pointer"><b style="min-width:52px">—</b>${badge('Süre', 'err')}<span class="grow"><b>${esc(x.kind)}</b><div class="small muted">${esc(f.no)} · ${esc(cli(f.client).name)}</div></span>${dueB(x.due, false)}</div>`; }).join('')}</div></div>`).join('') || '<div class="card pad muted">Önümüzdeki 21 günde duruşma veya süre yok.</div>'}</div>`;
    on(el, 'click', '[data-f]', (e, b) => fileModal(app, db.get('files', b.dataset.f)));
    // Duruşmalar + son günler tek takvim dosyasında (son günler tüm gün etkinliği)
    $('#ics', el).onclick = () => {
      const esc2 = (s) => String(s || '').replace(/[,;\\]/g, (c) => '\\' + c);
      const ev = [...H2.map((h) => { const f = file(h.file); const dt = h.date.replace(/-/g, '') + 'T' + h.time.replace(':', '') + '00'; return `BEGIN:VEVENT\nUID:${h.id}@nebsoft\nDTSTAMP:${dt}\nDTSTART:${dt}\nSUMMARY:${esc2(`Duruşma - ${f.esas} ${cli(f.client).name}`)}\nLOCATION:${esc2(f.court)}\nEND:VEVENT`; }), ...D.map((d) => { const f = file(d.file); const dt = d.due.replace(/-/g, ''); return `BEGIN:VEVENT\nUID:${d.id}@nebsoft\nDTSTAMP:${dt}T000000\nDTSTART;VALUE=DATE:${dt}\nSUMMARY:${esc2(`SON GÜN: ${d.kind} - ${f.no}`)}\nEND:VEVENT`; })].join('\n');
      const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NEBSOFT//Hukuk//TR\n${ev}\nEND:VCALENDAR`.replace(/\n/g, '\r\n')], { type: 'text/calendar' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ajanda.ics'; a.click();
    };
  }

  // ---------- Süreler ----------
  function deadlinesPage(el, p, app) {
    let flt = 'acik';
    el.innerHTML = pageHead('Süre Takibi', 'Usul süreleri — HMK, İİK, CMK, İYUK kurallarıyla', `<button class="btn primary" id="add">${icon('plus')} Süre ekle</button>`) + `<div class="card pad mb" id="calc"><h3 class="mb">Süre hesaplayıcı</h3><div class="form-grid">${NS.fieldsHtml([{ name: 'rule', label: 'Süre', type: 'select', options: H.RULES.map((r) => ({ value: r.id, label: H.ruleLabel(r) })), full: true }, { name: 'served', label: 'Tebliğ / tefhim tarihi', type: 'date' }, { name: 'urgent', label: 'Adli tatilde görülen iş (HMK 103)', type: 'checkbox' }, { name: 'n', label: 'Hâkimin verdiği süre', type: 'number' }, { name: 'u', label: 'Birim', type: 'select', options: [{ value: 'g', label: 'gün' }, { value: 'h', label: 'hafta' }, { value: 'a', label: 'ay' }] }], { served: today(), rule: 'hmk127', n: 14, u: 'g' })}</div><div id="cr" class="mt"></div><p class="small muted mt">Program kuralı ve maddeyi yazar; kesin süreyi dosyanın özelliğine göre avukat kontrol eder. Bayram günlerini her yıl Ayarlar'dan girin.</p></div><div class="card"><div class="card-h"><div class="seg">${[['acik', 'Bekleyen'], ['bitti', 'Tamamlanan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === flt ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('deadlines', (d) => (!mine() || file(d.file).lawyer === mine()) && (flt === 'all' || (flt === 'acik' ? !d.done : d.done))).sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due)), emptyIcon: 'clock', empty: flt === 'acik' ? 'Bekleyen süre yok' : 'Kayıt yok', columns: [{ label: 'Son gün', render: (d) => `<b>${NS.date(d.due)}</b><div>${dueB(d.due, d.done)}</div>` }, { label: 'Süre', render: (d) => `<b>${esc(d.kind)}</b><div class="small faint">tebliğ ${NS.date(d.served)}${d.note ? ' · ' + esc(d.note) : ''}</div>${(d.warn || []).length ? `<div class="small" style="color:var(--err)">${icon('alert')} ${esc(d.warn[0])}</div>` : ''}` }, { label: 'Dosya', render: (d) => `<span class="mono small">${esc(file(d.file).no)}</span><div class="small">${esc(cli(file(d.file).client).name)}</div>` }], actions: [{ icon: 'info', act: 'why', title: 'Nasıl hesaplandı?' }, { icon: 'check', act: 'ok', title: 'Tamamlandı', show: (d) => !d.done }] }); };
    const calc = () => {
      const v = NS.readForm($('#calc', el)); if (!v.served) return; const r = H.rule(v.rule);
      $$('[name=n],[name=u]', el).forEach((x) => { x.closest('.field').style.display = r.custom ? '' : 'none'; });
      const res = H.due(v.served, r, { ...holOpt(), urgent: v.urgent, ...(r.custom ? { n: Number(v.n) || 14, u: v.u } : {}) });
      $('#cr', el).innerHTML = `<div class="card pad" style="background:var(--app-accent-soft)"><div class="small muted">Son gün</div><b style="font-size:24px">${NS.dateLong(new Date(res.date + 'T12:00'))}</b><div class="small mt">${daysTo(res.date) >= 0 ? `${daysTo(res.date)} gün kaldı` : 'Süre geçmiş'}</div><ol class="small mt" style="padding-left:18px">${res.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${res.warn.map((w) => `<div class="small mt" style="color:var(--err)">${icon('alert')} ${esc(w)}</div>`).join('')}</div>`;
    };
    on(el, 'click', '[data-f]', (e, b) => { flt = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ok]', (e, b) => { db.update('deadlines', b.dataset.id, { done: true, doneAt: today(), doneBy: me() }); draw(); badgeSync(); });
    on(el, 'click', '[data-act=why]', (e, b) => { const d = db.get('deadlines', b.dataset.id); modal({ title: d.kind, body: `<p><b>Son gün: ${NS.dateLong(new Date(d.due + 'T12:00'))}</b></p>${(d.steps || []).length ? `<ol class="small" style="padding-left:18px">${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '<p class="small muted">Bu kayıt eski sürümde hesaplandı; gerekçe kaydı yok. Hesaplayıcıyla yeniden kontrol edin.</p>'}${(d.warn || []).map((w) => `<div class="small mt" style="color:var(--err)">${icon('alert')} ${esc(w)}</div>`).join('')}` }); });
    $('#calc', el).addEventListener('change', calc); $('#calc', el).addEventListener('input', calc);
    $('#add', el).onclick = () => addDeadline(app, null, null, NS.readForm($('#calc', el)));
    draw(); calc();
  }

  // ---------- Mesajlar (müvekkil portalı) ----------
  function messagesPage(el, p, app) {
    let sel = p || null;
    const threads = () => Object.entries(NS.groupBy(db.all('messages'), (m) => m.client)).map(([cid, ms]) => ({ cid, ms: ms.sort((a, b) => a.at.localeCompare(b.at)), last: ms.reduce((x, m) => (m.at > x ? m.at : x), ''), un: ms.filter((m) => m.from === 'muvekkil' && !m.read).length })).filter((t) => !mine() || db.all('files', (f) => f.client === t.cid && f.lawyer === mine()).length).sort((a, b) => b.un - a.un || b.last.localeCompare(a.last));
    const draw = () => {
      let T = threads(); if (!sel && T[0]) sel = T[0].cid;
      const unr = db.all('messages', (m) => m.client === sel && m.from === 'muvekkil' && !m.read); if (unr.length) { unr.forEach((m) => { m.read = true; m.readBy = me(); }); db.save(); badgeSync(); T = threads(); }
      const t = T.find((x) => x.cid === sel);
      el.innerHTML = pageHead('Müvekkil mesajları', 'Müvekkil portalından gelen sorular ve yanıtlarınız') + (T.length ? `<div class="grid g2"><div class="card">${T.map((x) => `<div class="list-item" data-c="${x.cid}" style="cursor:pointer;${x.cid === sel ? 'background:var(--app-accent-soft)' : ''}"><span class="grow"><b>${esc(cli(x.cid).name)}</b><div class="small faint">${NS.dt(x.last)}</div></span>${x.un ? badge(String(x.un), 'err') : ''}</div>`).join('')}</div>
        <div class="card"><div class="card-h"><h3>${esc(cli(sel).name)}</h3><span class="small faint">${esc(cli(sel).phone || '')}</span></div><div class="card-b col" style="gap:10px">${t.ms.map((m) => `<div style="align-self:${m.from === 'muvekkil' ? 'flex-start' : 'flex-end'};max-width:85%;background:${m.from === 'muvekkil' ? 'var(--surface-2,#f1f5f9)' : 'var(--app-accent-soft)'};padding:8px 12px;border-radius:12px"><div class="small faint">${m.from === 'muvekkil' ? 'Müvekkil' : esc(m.user || 'Büro')} · ${NS.dt(m.at)}</div><div style="white-space:pre-wrap">${esc(m.text)}</div></div>`).join('')}
          <textarea class="input" id="rx" rows="3" placeholder="Yanıtınız — müvekkil portalda görür"></textarea><label class="check small"><input type="checkbox" id="rs"> Müvekkile "yanıt var" SMS'i gönder</label><div class="row"><button class="btn primary" id="rb">${icon('send')} Yanıtla</button></div></div></div></div>` : `<div class="card pad muted">Henüz mesaj yok. Müvekkiller portaldan yazdığında burada görünür.</div>`);
      on(el, 'click', '[data-c]', (e, b) => { sel = b.dataset.c; draw(); });
      const rb = $('#rb', el); if (rb) rb.onclick = async () => { const tx = $('#rx', el).value.trim(); if (!tx) return; const sms = $('#rs', el).checked; db.insert('messages', { client: sel, from: 'buro', user: me(), text: tx, at: new Date().toISOString() }); db.save(); draw(); toast('Yanıt portala eklendi', 'ok'); if (sms) await smsTo(cli(sel), `${S().bizName}: Müvekkil portalında size bir yanıt var.`, 'Bildirim'); };
    };
    draw();
  }

  // ---------- Müvekkiller & finans ----------
  function clientsPage(el, p, app) {
    // Dosyası olan müvekkil silinemez (dosyalar sahipsiz kalmasın) — crud'un silme işleyicisinden önce yakalanır
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-act=del]'); if (!b) return; const n = db.all('files', (f) => f.client === b.dataset.id).length; if (n) { e.stopImmediatePropagation(); e.preventDefault(); toast(`Bu müvekkilin ${n} dosyası var; önce dosyaları başka müvekkile aktarın veya silin`, 'err'); } }, true);
    NS.crud(el, app, { col: 'clients', title: 'Müvekkiller', sub: 'Avans bakiyesi, dosyalar ve portal erişimi', single: 'Müvekkil', addLabel: 'Yeni müvekkil', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad / ünvan', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'bireysel', label: 'Bireysel' }, { value: 'kurumsal', label: 'Kurumsal' }] }, { name: 'idNo', label: 'TCKN / VKN', required: true }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'address', label: 'Adres', full: true }, { name: 'retainer', label: 'Aylık sözleşme ücreti (kurumsal)', type: 'number' }],
      searchFields: (c) => [c.name, c.idNo, c.phone],
      beforeSave: (v, rec) => { v.idNo = String(v.idNo || '').replace(/\s/g, ''); if (!rec) v.portalCode = H.newCode(); },
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'avans', label: 'Avansı eksiye düşen', test: (c) => balance(c.id) < 0 }, { value: 'kurumsal', label: 'Kurumsal', test: (c) => c.type === 'kurumsal' }],
      columns: [{ key: 'name', label: 'Müvekkil', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone || '')}</div>` }, { label: 'Dosya', cls: 'right', render: (c) => db.all('files', (f) => f.client === c.id && isOpen(f)).length }, { label: 'Avans bakiyesi', cls: 'right', render: (c) => { const b = balance(c.id); return `<b style="color:var(--${b < 0 ? 'err' : 'text'})">${money(b)}</b>`; } }, { label: 'Ücret alacağı', cls: 'right', render: (c) => money(sum(db.all('files', (f) => f.client === c.id && f.fee.type === 'sabit'), (f) => f.fee.amount - (f.fee.paid || 0))) }, { label: 'Portal kodu', render: (c) => `<span class="mono small">${esc(H.code(c))}</span>` }],
      extraActions: [{ icon: 'cash', act: 'adv', title: 'Avans / ücret tahsilatı' }, { icon: 'globe', act: 'portal', title: 'Portal bilgisini gönder' }, { icon: 'refresh', act: 'newcode', title: 'Portal kodunu yenile' }],
      onAction: async (a, c, draw) => {
        if (a === 'newcode') { if (!(await confirm(`${c.name} için yeni portal kodu üretilsin mi? Eski kod çalışmaz.`))) return; c.portalCode = H.newCode(); db.save(); db.log('Portal kodu yenilendi', c.name); draw(); return toast('Yeni kod üretildi — müvekkile gönderin', 'ok'); }
        if (a === 'portal') return smsTo(c, `${S().bizName} müvekkil portalı: ${location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '').replace(/\?.*$/, '')}muvekkil.html — Giriş: TCKN/VKN + kod ${H.code(c)}`, 'Portal bilgisi');
        const fs = db.all('files', (f) => f.client === c.id); if (!fs.length) return toast('Bu müvekkilin dosyası yok', 'err');
        const v = await formModal({ title: `Tahsilat — ${c.name}`, fields: [{ name: 'kind', label: 'Tür', type: 'select', options: [{ value: 'avans', label: 'Masraf avansı' }, { value: 'ucret', label: 'Vekalet ücreti' }] }, { name: 'file', label: 'Dosya', type: 'select', options: fs.map((f) => ({ value: f.id, label: `${f.no} · ${f.subject}` })) }, { name: 'amount', label: 'Tutar (KDV dahil)', type: 'number', required: true }, { name: 'at', label: 'Tarih', type: 'date', required: true }, { name: 'smm', label: 'e-SMM (serbest meslek makbuzu) düzenle — yalnızca vekalet ücretinde', type: 'checkbox', full: true }], values: { kind: 'avans', smm: false, at: today() } });
        if (!v) return; const amt = Number(v.amount); if (!(amt > 0)) return toast('Tutar girin', 'err');
        if (v.kind === 'avans') { db.insert('advances', { client: c.id, file: v.file, amount: amt, at: v.at, user: me() }); db.save(); draw(); return toast('Avans kaydedildi', 'ok'); }
        const f = db.get('files', v.file); f.fee.paid = (f.fee.paid || 0) + amt;
        const pay = db.insert('payments', { client: c.id, file: f.id, amount: amt, at: v.at, user: me(), doc: '' }); db.save(); draw(); toast('Ücret tahsilatı kaydedildi', 'ok');
        if (v.smm) {
          const cfg = NS.integ ? NS.integ.cfg('esmm') : {};
          // GVK 94: stopajı vergi kesintisi yapmakla yükümlü alıcı keser; bireysel müvekkilde stopaj yoktur. Çekirdek her makbuza stopaj uyguladığı için engellenir.
          if (c.type !== 'kurumsal' && Number(cfg.stopaj) > 0) { pay.doc = 'e-SMM düzenlenmedi'; db.save(); return toast('e-SMM düzenlenmedi: bireysel müvekkilde stopaj olmaz, ama e-SMM ayarlarında stopaj oranı girili. Bu durumda makbuzu entegratör ekranından düzenleyin.', 'err'); }
          const r = NS.integ ? await NS.integ.call('esmm', 'makbuz', { name: c.name, tc: c.idNo, vkn: c.idNo, address: c.address, amount: amt, desc: `Avukatlık ücreti — ${f.no} ${f.subject}` }, { silent: true }) : { ok: false, error: 'Entegrasyon modülü yok' };
          pay.doc = r.simulated ? 'TEST — e-SMM simülasyon (düzenlenmedi)' : r.ok ? 'e-SMM ' + (r.ref || '') : ''; db.save(); draw();
          toast(r.simulated ? 'TEST — e-SMM simülasyonda, gerçek makbuz düzenlenmedi' : r.ok ? 'e-SMM düzenlendi' : `e-SMM düzenlenemedi: ${r.disabled ? 'Entegrasyonlar > e-SMM kapalı' : r.error || 'hata'}`, r.ok && !r.simulated ? 'ok' : 'err');
        }
      } });
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const F = db.all('files', (f) => !mine() || f.lawyer === mine()); const ids = new Set(F.map((f) => f.id));
    const todayH = db.all('hearings', (h) => h.date === today() && ids.has(h.file)).sort((a, b) => a.time.localeCompare(b.time));
    const weekH = db.all('hearings', (h) => h.date >= today() && h.date <= iso(addDays(new Date(), 7)) && ids.has(h.file));
    const pastOpen = db.all('hearings', (h) => h.date < today() && !h.done && ids.has(h.file)).sort((a, b) => b.date.localeCompare(a.date));
    const crit = db.all('deadlines', (d) => !d.done && ids.has(d.file) && daysTo(d.due) <= 3).sort((a, b) => a.due.localeCompare(b.due));
    const neg = db.all('clients').filter((c) => balance(c.id) < 0); const un = unread();
    const noHol = !H.list(S().holidays).some((d) => d.startsWith(String(new Date().getFullYear())));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/ajanda">${icon('calendar')} Ajanda</a><button class="btn primary" id="nf">${icon('plus')} Yeni dosya</button>`) +
      (noHol ? `<div class="card pad mb" style="border-color:var(--warn)">${icon('alert')} <b>Bu yılın bayram günleri girilmemiş.</b> Süre hesabı bayrama denk gelen son günü kaydıramaz. <a href="#/ayarlar">Ayarlar'dan girin</a>.</div>` : '') +
      (un ? `<a class="card pad mb" href="#/mesajlar" style="display:block">${icon('message')} <b>${un} okunmamış müvekkil mesajı</b> — yanıtlamak için tıklayın</a>` : '') + `
      <div class="grid g4 mb">${kpi('Bugün duruşma', todayH.length, 'calendar', 'info')}${kpi('Bu hafta duruşma', weekH.length, 'clock', '')}${kpi('Kritik süre (3 gün)', crit.length, 'alert', crit.length ? 'err' : 'ok')}${kpi('Açık dosya', F.filter(isOpen).length, 'file', 'acc', `<div class="small faint">${F.filter((f) => f.type === 'icra' && isOpen(f)).length} icra</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>${icon('calendar')} Bugünün duruşmaları</h3></div>${table({ rows: todayH, empty: 'Bugün duruşma yok', columns: [{ label: 'Saat', render: (h) => `<b>${esc(h.time)}</b>` }, { label: 'Mahkeme', render: (h) => `<b>${esc(file(h.file).court)}</b><div class="small faint">${esc(file(h.file).esas)} · ${esc(cli(file(h.file).client).name)}</div>` }, { label: 'Avukat', render: (h) => `<span class="small">${esc(file(h.file).lawyer)}</span>` }], actions: [{ icon: 'check', act: 'res', title: 'Duruşma sonucu' }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Kaçırılmaması gereken süreler</h3><a class="btn sm" href="#/sureler">Tümü</a></div>${table({ rows: crit, empty: 'Kritik süre yok', columns: [{ label: 'Son gün', render: (d) => dueB(d.due, d.done) }, { label: 'Süre', render: (d) => `<b>${esc(d.kind)}</b><div class="small faint">${esc(file(d.file).no)} · ${esc(cli(file(d.file).client).name)}</div>` }] })}</div></div>
      ${pastOpen.length ? `<div class="card mb"><div class="card-h"><h3>${icon('list')} Sonucu girilmemiş duruşmalar</h3><span class="small faint">${pastOpen.length}</span></div>${table({ rows: pastOpen.slice(0, 8), columns: [{ label: 'Tarih', render: (h) => `<b>${NS.date(h.date)}</b> ${esc(h.time)}` }, { label: 'Dosya', render: (h) => `${esc(file(h.file).court)}<div class="small faint">${esc(file(h.file).esas)} · ${esc(cli(file(h.file).client).name)}</div>` }], actions: [{ icon: 'check', act: 'res', title: 'Sonuç gir' }] })}</div>` : ''}
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Dosya dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(F.filter(isOpen), (f) => f.type)).map(([k, v]) => ({ label: H.TYPES[k] || k, value: v.length })), { size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Avansı biten müvekkiller</h3><a class="btn sm" href="#/muvekkiller">Müvekkiller</a></div>${table({ rows: neg, empty: 'Avansı eksiye düşen müvekkil yok', columns: [{ label: 'Müvekkil', render: (c) => `<b>${esc(c.name)}</b>` }, { label: 'Bakiye', cls: 'right', render: (c) => `<b style="color:var(--err)">${money(balance(c.id))}</b>` }] })}</div></div>`;
    on(el, 'click', '[data-act=res]', (e, b) => hearingResult(app, db.get('hearings', b.dataset.id)));
    $('#nf', el).onclick = () => editFile(app, null);
  }

  const ROLES = { admin: 'Kurucu avukat', avukat: 'Avukat', sekreter: 'Sekreter' };
  NS.shell({
    id: 'hukuk', integrations: ['sms', 'email', 'whatsapp', 'takvim', 'esmm', 'efatura', 'webhook', 'backup'], name: 'Hukuk Bürosu', tagline: 'Dosya, duruşma ve süre takibi', icon: 'shield', accent: '#334155', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Büro' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['avukat', 'sekreter'] }, { id: 'ajanda', label: 'Ajanda', icon: 'calendar', roles: ['avukat', 'sekreter'] }, { id: 'dosyalar', label: 'Dosyalar', icon: 'file', roles: ['avukat', 'sekreter'] }, { id: 'sureler', label: 'Süre Takibi', icon: 'clock', badge: true, roles: ['avukat', 'sekreter'] }, { id: 'muvekkiller', label: 'Müvekkiller', icon: 'users', roles: ['avukat', 'sekreter'] }, { id: 'mesajlar', label: 'Mesajlar', icon: 'message', badge: true, roles: ['avukat', 'sekreter'] }, { sec: 'Yönetim' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ sureler: db.all('deadlines', (d) => !d.done && daysTo(d.due) <= 3).length, mesajlar: unread() }),
    routes: { ozet: dashboard, ajanda: agendaPage, dosyalar: filesPage, sureler: deadlinesPage, muvekkiller: clientsPage, mesajlar: messagesPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Büro' }, { name: 'baroNo', label: 'Baro / sicil no' }, { name: 'hourly', label: 'Saatlik ücret (₺)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }, { type: 'section', label: 'Süre hesabı — tatil günleri' }, { name: 'holidays', label: 'Bayram ve ek tatil günleri (tam gün) — YYYY-AA-GG, virgülle', full: true, hint: 'Ramazan ve Kurban Bayramı günlerini Diyanet takviminden her yıl girin. Sabit resmî tatiller (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim) otomatik.' }, { name: 'halfDays', label: 'Arefe günleri (yarım gün) — YYYY-AA-GG, virgülle', full: true, hint: 'Son gün arefeye denk gelirse program uyarır.' }] }) },
  });
})();
