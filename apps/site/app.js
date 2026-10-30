/* NEBSOFT Apartman & Site Yönetimi — daireler, aidat tahakkuku, gider dağıtımı, tahsilat, duyuru ve talepler */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const SITE = window.SITE;
  const db = new NS.DB('site', SITE.seed);
  const S = () => db.settings({ baseDue: 1500, lateFee: 5, dueDay: 10 });
  const flat = (id) => db.get('flats', id) || { id: '-', owner: '-' };
  // Aynı çizimde binlerce borç kaydı için tek geçiş
  let DM = null; const debt = (id) => { if (!DM) { DM = {}; db.all('dues').forEach((d) => { DM[d.flat] = (DM[d.flat] || 0) + d.amount - (d.paid || 0); }); setTimeout(() => { DM = null; }, 0); } return Math.round((DM[id] || 0) * 100) / 100; };
  const fresh = () => { DM = null; };
  const r2 = (x) => Math.round(x * 100) / 100;
  const fin = () => !NS.currentUser || NS.currentUser.role !== 'gorevli';
  const resident = (f) => f.tenant || f.owner;
  const period = () => today().slice(0, 7);
  const perName = (p) => `${NS.MONTHS[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}`;
  const RQ = { acik: ['Açık', 'warn'], islemde: ['İşlemde', 'info'], cozuldu: ['Çözüldü', 'ok'] };
  const portalUrl = () => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'sakin.html';

  // Ödeme en eski borçtan kapatılır; dağılım makbuzda saklanır (iptal için), artan avans olur ve sonraki tahakkuktan düşer
  function pay(flatId, amount, type, ref, fee) {
    const f = flat(flatId); let left = r2(amount); const alloc = [];
    db.all('dues', (d) => d.flat === flatId && d.amount > (d.paid || 0)).sort((a, b) => a.period.localeCompare(b.period)).forEach((d) => { if (left <= 0) return; const p = r2(Math.min(d.amount - (d.paid || 0), left)); d.paid = r2((d.paid || 0) + p); d.paidAt = today(); left = r2(left - p); alloc.push({ due: d.id, amt: p }); });
    const feeRec = fee > 0 ? db.insert('dues', { flat: flatId, period: period(), type: 'faiz', desc: 'Gecikme tazminatı', amount: fee, paid: fee, paidAt: today() }, true) : null;
    if (left > 0) f.credit = r2((f.credit || 0) + left);
    const rc = db.insert('receipts', { flat: flatId, amount: r2(amount + (fee || 0)), type, ref, at: new Date().toISOString(), alloc, credit: left, feeDue: feeRec ? feeRec.id : null }, true); fresh(); return rc;
  }
  async function collect(app, flatId) {
    const f = flat(flatId); const open = db.all('dues', (d) => d.flat === flatId && d.amount > (d.paid || 0)).sort((a, b) => a.period.localeCompare(b.period)); const fee = SITE.lateFee(db, flatId);
    const v = await formModal({ title: `Tahsilat — ${f.block} Blok No ${f.no} (${resident(f)})`, fields: [{ name: 'amount', label: `Tutar (borç ${money(debt(flatId))})`, type: 'number', step: '0.01', value: debt(flatId), required: true }, { name: 'fee', label: `Gecikme tazminatı (hesaplanan ${money(fee)})`, type: 'number', step: '0.01', value: fee }, { name: 'type', label: 'Ödeme', type: 'select', options: [{ value: 'havale', label: 'Havale/EFT' }, { value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kredi kartı' }] }], submitLabel: 'Tahsil et', extra: `<div class="small muted mt">${open.length ? `Ödeme en eski borçtan başlayarak kapatılır: ${open.map((d) => esc(d.desc)).join(', ')}.` : 'Bu dairenin borcu yok.'} Borcu aşan tutar avans olarak kalır.</div>` });
    if (!v) return; const amt = r2(Number(v.amount) || 0), fv = r2(Number(v.fee) || 0); if (amt <= 0 && fv <= 0) return toast('Tutar girin', 'err'); if (amt < 0 || fv < 0) return toast('Tutar negatif olamaz', 'err');
    const rc = pay(flatId, amt, v.type, undefined, fv); db.log('Tahsilat', `${f.id} · ${money(rc.amount)}${fv < fee ? ` · tazminat ${money(fee)} yerine ${money(fv)} alındı` : ''}${rc.credit ? ` · avans ${money(rc.credit)}` : ''}`); db.save();
    toast(rc.credit ? `Tahsilat kaydedildi · ${money(rc.credit)} avans` : 'Tahsilat kaydedildi', 'ok'); printReceipt(f, rc); app.refresh();
  }
  // Tahsilat iptali: dağıtılan tutarlar borca geri döner; yönetici onayı gerekir, kayıt silinmez
  async function cancelReceipt(app, rc) {
    if (rc.canceled) return; if (!rc.alloc) return toast('Bu eski kayıtta dağılım bilgisi yok; borcu elle düzeltin', 'err'); const f = flat(rc.flat); if ((f.credit || 0) < (rc.credit || 0)) return toast('Bu ödemenin avansı kullanılmış; önce sonraki kayıtları iptal edin', 'err');
    const why = await NS.prompt('İptal nedeni', '', { title: `${money(rc.amount)} tahsilat iptali` }); if (!why) return; const by = await NS.approve(NS.app, `${rc.flat} tahsilat iptali`, ['admin']); if (!by) return;
    rc.alloc.forEach((a) => { const d = db.get('dues', a.due); if (d) { d.paid = r2((d.paid || 0) - a.amt); if (d.paid <= 0) { d.paid = 0; d.paidAt = null; } } }); if (rc.feeDue) db.remove('dues', rc.feeDue); f.credit = r2((f.credit || 0) - (rc.credit || 0));
    rc.canceled = { at: new Date().toISOString(), by: by.name || '', why }; db.log('Tahsilat iptali', `${rc.flat} · ${money(rc.amount)} · ${why}`); fresh(); db.save(); toast('Tahsilat iptal edildi', 'ok'); app.refresh();
  }
  // Banka hesap hareketleri: açıklamadaki daire no (A12, B 5...) veya sakin adıyla eşleştirilir
  async function bankSync(app) {
    if (!NS.integ) return;
    const r = await NS.integ.call('banka', 'hareketler', { iban: S().iban, since: S().bankSince || iso(addDays(new Date(), -7)) }); if (!r || !r.ok) return;
    let txs = r.data && Array.isArray(r.data.transactions) ? r.data.transactions : [];
    // Simülasyonda banka hareketi uydurulmaz (uydurma tahsilat aidat borcunu kapatıyordu)
    if (r.simulated) return toast('Banka TEST — hareket çekilmedi (simülasyon); tahsilatları elle girin', 'warn');
    const seen = new Set(db.all('receipts').map((x) => x.ref).filter(Boolean));
    const res = txs.filter((t) => t.amount > 0 && !seen.has(t.id)).map((t) => { const d = String(t.desc).toLocaleUpperCase('tr-TR').replace(/\s+/g, ''); const f = db.all('flats').find((x) => new RegExp(`(^|[^0-9A-ZÇĞİÖŞÜ])${`${x.block}${x.no}`.toLocaleUpperCase('tr-TR')}([^0-9]|$)`).test(d)) || db.all('flats').find((x) => d.includes(resident(x).toLocaleUpperCase('tr-TR').replace(/\s+/g, ''))); return { ...t, flat: f ? f.id : '' }; });
    if (!res.length) return toast('Yeni banka hareketi yok', '');
    modal({ title: `Banka hareketleri (${res.length})`, size: 'wide', body: table({ rows: res.map((t, i) => ({ ...t, i })), columns: [{ label: 'Tarih', render: (t) => NS.date(t.date) }, { label: 'Açıklama', render: (t) => `<span class="small">${esc(t.desc)}</span>` }, { label: 'Tutar', cls: 'right', render: (t) => `<b>${money(t.amount)}</b>` }, { label: 'Daire', render: (t) => `<select class="input" data-bf="${t.i}" style="width:150px"><option value="">Eşleşmedi</option>${db.all('flats').map((f) => `<option value="${f.id}" ${f.id === t.flat ? 'selected' : ''}>${esc(f.id)} · ${esc(resident(f))}</option>`).join('')}</select>` }] }) + '<p class="small muted mt">Otomatik eşleşmeyenleri elle seçin; boş bırakılanlar işlenmez.</p>',
      actions: [{ label: 'Vazgeç' }, { label: 'Tahsilatları işle', cls: 'primary', onClick: (close, b) => { let n = 0; $$('[data-bf]', b).forEach((s) => { if (!s.value) return; const t = res[Number(s.dataset.bf)]; pay(s.value, t.amount, 'havale', t.id); n++; }); db.saveSettings({ bankSince: today() }); db.log('Banka eşleştirme', `${n} tahsilat`); db.save(); close(); toast(`${n} tahsilat banka hareketinden işlendi`, 'ok'); app.refresh(); } }] });
  }
  async function debtSms() {
    const list = db.all('flats').filter((f) => debt(f.id) > 0 && (f.tenantPhone || f.ownerPhone));
    if (!list.length) return toast('Telefonu kayıtlı borçlu daire yok');
    if (!(await confirm(`${list.length} borçlu daireye SMS ile hatırlatma gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return;
    const s = S(); NS.smsBatch(db, list.map((f) => ({ to: f.tenantPhone || f.ownerPhone, name: resident(f), text: `Sayın ${resident(f)}, ${f.block} Blok ${f.no} nolu dairenizin ${money(debt(f.id))} aidat borcu bulunmaktadır. ${s.bank || ''} ${s.iban || ''} — ${s.bizName}` })), 'aidat hatırlatması');
    db.save();
  }
  const PT = { havale: 'Havale/EFT', nakit: 'Nakit', kart: 'Kredi kartı' };
  const receiptDoc = (f, rc) => ({ title: 'Tahsilat makbuzu', no: rc.ref || '', date: rc.at, party: { title: 'Ödeyen', name: resident(f), lines: [`${f.block} Blok, Daire ${f.no}`] }, info: [['Ödeme', PT[rc.type] || rc.type], ['Yönetici', S().manager || '']], totals: [['Tahsil edilen', rc.amount, true], ['Kalan borç', debt(f.id)], ...(f.credit ? [['Avans', f.credit]] : [])], ...(rc.canceled ? { note: `İPTAL EDİLDİ · ${NS.date(rc.canceled.at)}` } : {}) });
  const printReceipt = (f, rc) => NS.docs.print('makbuz', receiptDoc(f, rc));
  if (NS.docs) { NS.docs.define('site', 'makbuz', { label: 'Tahsilat makbuzu', sample: () => { const f = db.all('flats')[0]; return f ? receiptDoc(f, { amount: 1850, type: 'havale', at: new Date().toISOString() }) : {}; } }); NS.docs.define('site', 'ozet', { label: 'Gelir-gider özeti' }); }

  function dashboard(el, p, app) {
    if (!fin()) return app.go('talepler');
    const flats = db.all('flats');
    const per = period();
    const thisMonth = db.all('dues', (d) => d.period === per && d.type === 'aidat');
    const collected = sum(thisMonth, (d) => d.paid || 0), expected = sum(thisMonth, (d) => d.amount);
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return iso(d).slice(0, 7); });
    const inc = months.map((m) => sum(db.all('dues', (d) => (d.paidAt || '').slice(0, 7) === m), (d) => d.paid || 0));
    const exp = months.map((m) => sum(db.all('expenses', (e) => e.date.slice(0, 7) === m), (e) => e.amount));
    // Kasa: açılış + tahsilat + avans − gider. Açılış bakiyesi Ayarlar'dan girilir
    const cash = (Number(S().openingCash) || 0) + sum(db.all('dues'), (d) => d.paid || 0) + sum(flats, (f) => f.credit || 0) - sum(db.all('expenses'), (e) => e.amount);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="sakin.html" target="_blank">${icon('globe')} Sakin portalı</a><button class="btn primary" id="acc">${icon('plus')} ${perName(per)} aidatı</button>`) + `
      <div class="grid g4 mb">${kpi('Kasa / banka', money(cash), 'wallet', 'info')}${kpi(`${perName(per)} tahsilat`, `%${expected ? Math.round((collected / expected) * 100) : 0}`, 'percent', 'ok', `<div class="small faint">${money(collected)} / ${money(expected)}</div>`)}${kpi('Toplam alacak', money(sum(flats, (f) => debt(f.id))), 'alert', 'err', `<div class="small faint">${flats.filter((f) => debt(f.id) > 0).length} borçlu daire</div>`)}${kpi('Açık talep', db.all('requests', (r) => r.status !== 'cozuldu').length, 'wrench', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Gelir (tahsilat) / gider</h3></div><div class="card-b">${chart.line([{ name: 'Tahsilat', values: inc, color: '#16a34a' }, { name: 'Gider', values: exp, color: '#dc2626' }], months.map((m) => NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3)), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Duyurular</h3><a class="btn sm" href="#/duyurular">Tümü</a></div><div class="card-b">${db.all('announcements').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((n) => `<div class="list-item"><div class="grow"><b>${n.pinned ? '📌 ' : ''}${esc(n.title)}</b><div class="small muted">${NS.date(n.date)}</div></div></div>`).join('')}</div></div></div>
      <h2 class="mb">Daire durumu</h2><div class="blocks">${[...new Set(flats.map((f) => f.block))].map((b) => `<div class="card pad"><h3 class="mb">${b} Blok</h3><div class="bgrid">${flats.filter((f) => f.block === b).sort((x, y) => y.floor - x.floor || x.no - y.no).map((f) => { const d = debt(f.id); return `<div class="flat ${d > 0 ? 'debt' : 'ok'}" data-f="${f.id}"><b>${f.no}</b> · ${esc(resident(f).split(' ')[0])}<div>${d > 0 ? `<span style="color:var(--err);font-weight:700">${money(d)}</span>` : '✓ borç yok'}</div></div>`; }).join('')}</div></div>`).join('')}</div>`;
    on(el, 'click', '[data-f]', (e, b) => app.go('daire', b.dataset.f));
    $('#acc', el).onclick = () => accrue(app);
  }
  // Yeni borç açılırken dairenin avansı düşülür
  const dueOf = (f, amount) => { const use = r2(Math.min(f.credit || 0, amount)); if (use > 0) f.credit = r2(f.credit - use); return { amount, paid: use, paidAt: use ? today() : null }; };
  async function accrue(app) {
    const v = await formModal({ title: 'Toplu aidat tahakkuku', fields: [{ name: 'period', label: 'Dönem', type: 'month', value: period() }, { name: 'base', label: 'Aidat tutarı (₺)', type: 'number', value: S().baseDue, required: true }, { name: 'big', label: '120 m² üstü daireler için ek (₺)', type: 'number', value: 250 }] });
    if (!v) return;
    const exists = db.all('dues', (d) => d.period === v.period && d.type === 'aidat').length;
    if (exists && !(await confirm(`${perName(v.period)} için ${exists} aidat zaten var. Eksik daireler için oluşturulsun mu?`, { ok: 'Devam', danger: false }))) return;
    let n = 0;
    db.all('flats').forEach((f) => { if (db.find('dues', (d) => d.flat === f.id && d.period === v.period && d.type === 'aidat')) return; db.insert('dues', { flat: f.id, period: v.period, type: 'aidat', desc: `${perName(v.period)} aidatı`, ...dueOf(f, f.dueOverride || v.base + (f.m2 > 120 ? v.big || 0 : 0)) }, true); n++; });
    db.log('Aidat tahakkuku', `${perName(v.period)} · ${n} daire`); fresh(); db.save(); toast(`${n} daireye aidat tahakkuk ettirildi`, 'ok'); app.refresh();
  }
  function flatsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'flats', title: 'Daireler & Sakinler', sub: 'Malik, kiracı ve borç durumu', single: 'Daire', addLabel: 'Yeni daire', emptyIcon: 'home', readonly: false,
      fields: [{ name: 'block', label: 'Blok', required: true }, { name: 'no', label: 'Daire no', type: 'number', required: true }, { name: 'floor', label: 'Kat', type: 'number' }, { name: 'm2', label: 'm²', type: 'number' }, { name: 'share', label: 'Arsa payı', type: 'number', required: true }, { name: 'dueOverride', label: 'Özel aidat (boş = standart)', type: 'number' }, { name: 'owner', label: 'Malik', required: true }, { name: 'ownerPhone', label: 'Malik telefonu' }, { name: 'tenant', label: 'Kiracı' }, { name: 'tenantPhone', label: 'Kiracı telefonu' }, { name: 'plate', label: 'Araç plakası' }],
      beforeSave: (v, rec) => { v.no = Number(v.no); v.share = Number(v.share) || 0; v.block = String(v.block).trim().toLocaleUpperCase('tr-TR'); const id = `${v.block}${v.no}`; if (db.find('flats', (x) => x.id === id && (!rec || x.id !== rec.id))) return 'Bu blok ve daire numarası kayıtlı'; if (!rec) v.id = id; else if (rec.id !== id) return 'Blok ve daire numarası sonradan değiştirilemez'; },
      canDelete: (f) => (db.find('dues', (d) => d.flat === f.id) || db.find('receipts', (x) => x.flat === f.id) ? 'Bu dairenin hesap hareketi var; silinemez.' : true),
      sort: (a, b) => a.block.localeCompare(b.block) || a.no - b.no, searchFields: (f) => [f.id, f.owner, f.tenant, f.plate],
      filters: [{ value: 'all', label: 'Tümü' }, ...(fin() ? [{ value: 'd', label: 'Borçlu', test: (f) => debt(f.id) > 0 }] : []), { value: 'k', label: 'Kiracılı', test: (f) => !!f.tenant }],
      columns: [{ label: 'Daire', render: (f) => `<a href="#/daire/${f.id}"><b>${esc(f.block)} Blok · No ${f.no}</b></a><div class="small faint">${f.floor || '-'}. kat · ${f.m2 || '-'} m²</div>` }, { key: 'owner', label: 'Malik', render: (f) => `${esc(f.owner)}<div class="small faint">${esc(f.ownerPhone || '')}</div>` }, { key: 'tenant', label: 'Kiracı', render: (f) => (f.tenant ? `${esc(f.tenant)}<div class="small faint">${esc(f.tenantPhone || '')}</div>` : '<span class="faint">-</span>') }, ...(fin() ? [{ label: 'Borç', cls: 'right', render: (f) => (debt(f.id) > 0 ? `<b style="color:var(--err)">${money(debt(f.id))}</b>` : f.credit ? badge('Avans ' + money(f.credit), 'info') : badge('Yok', 'ok')) }] : [])],
      extraActions: fin() ? [{ icon: 'cash', act: 'col', title: 'Tahsilat', show: (f) => debt(f.id) > 0 }, { icon: 'globe', act: 'ptl', title: 'Sakin portalı kodu' }, { icon: 'eye', act: 'go', title: 'Detay' }] : [],
      onAction: (a, f) => (a === 'col' ? collect(app, f.id) : a === 'ptl' ? NS.portalShare(db, f, { title: 'Sakin portalı', url: portalUrl(), phone: f.tenantPhone || f.ownerPhone, name: resident(f), login: 'Blok ve daire', loginValue: `${f.block} Blok ${f.no}` }) : app.go('daire', f.id)),
    });
  }
  function flatPage(el, id, app) {
    const f = db.get('flats', id); if (!f || !fin()) return app.go('daireler');
    const dues = db.all('dues', (d) => d.flat === id).sort((a, b) => b.period.localeCompare(a.period));
    const s = S();
    const msg = `Sayın ${resident(f)}, ${f.block} Blok ${f.no} nolu dairenizin ${money(debt(id))} aidat borcu bulunmaktadır. ${s.bank} ${s.iban} hesabına ödeyebilirsiniz. ${s.bizName}`;
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/daireler">${icon('back')} Daireler</a><h1 class="grow">${esc(f.block)} Blok · Daire ${f.no}</h1>${debt(id) > 0 ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/90${String(f.tenantPhone || f.ownerPhone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(msg)}">${icon('message')} Borç hatırlat</a><button class="btn primary" id="col">${icon('cash')} Tahsilat</button>` : ''}<button class="btn" id="chg">${icon('plus')} Borç ekle</button></div>
      <div class="grid g4 mb">${kpi('Güncel borç', money(debt(id)), 'wallet', debt(id) > 0 ? 'err' : 'ok')}${kpi('Gecikme tazminatı', money(SITE.lateFee(db, id)), 'percent', 'warn')}${kpi('Toplam ödenen', money(sum(dues, (d) => d.paid || 0)), 'check', 'ok')}${kpi('Avans', money(f.credit || 0), 'home', 'info', `<div class="small faint">${f.m2 || '-'} m² · arsa payı ${f.share || '-'}</div>`)}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Hesap hareketleri</h3></div>${table({ rows: dues, columns: [{ label: 'Dönem', render: (d) => perName(d.period) }, { label: 'Açıklama', key: 'desc' }, { label: 'Tutar', cls: 'right', render: (d) => money(d.amount) }, { label: 'Ödenen', cls: 'right', render: (d) => money(d.paid || 0) }, { label: 'Durum', render: (d) => (d.paid >= d.amount ? badge('Ödendi' + (d.paidAt ? ' ' + NS.date(d.paidAt) : ''), 'ok') : d.paid > 0 ? badge('Kısmi', 'info') : badge('Ödenmedi', 'err')) }], actions: [{ icon: 'trash', act: 'dd', title: 'Borcu sil', show: (d) => !d.paid }] })}
        <div class="card-h"><h3>Tahsilatlar</h3></div>${table({ rows: db.all('receipts', (x) => x.flat === id).sort((a, b) => b.at.localeCompare(a.at)), empty: 'Tahsilat kaydı yok', columns: [{ label: 'Tarih', render: (x) => NS.dt(x.at) }, { label: 'Ödeme', render: (x) => esc(PT[x.type] || x.type || '') }, { label: 'Tutar', cls: 'right', render: (x) => money(x.amount) }, { label: 'Durum', render: (x) => (x.canceled ? badge('İptal', 'err') : '') }], actions: [{ icon: 'print', act: 'rp', title: 'Makbuz' }, { icon: 'x', act: 'rx', title: 'İptal et', show: (x) => !x.canceled }] })}</div>
      <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">Malik</h3><b>${esc(f.owner)}</b><div class="small muted">${esc(f.ownerPhone || '')}</div>${f.tenant ? `<h3 class="mb mt">Kiracı</h3><b>${esc(f.tenant)}</b><div class="small muted">${esc(f.tenantPhone || '')}</div>` : ''}${f.plate ? `<div class="mt">${icon('car')} ${esc(f.plate)}</div>` : ''}</div>
      <div class="card"><div class="card-h"><h3>Talepler</h3></div><div class="card-b">${db.all('requests', (r) => r.flat === id).map((r) => `<div class="list-item small"><span class="grow">${esc(r.title)}</span>${badge(RQ[r.status][0], RQ[r.status][1])}</div>`).join('') || '<div class="faint small">Talep yok</div>'}</div></div></div></div>`;
    if ($('#col', el)) $('#col', el).onclick = () => collect(app, id);
    $('#chg', el).onclick = async () => { const v = await formModal({ title: 'Borç ekle', fields: [{ name: 'desc', label: 'Açıklama', required: true }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'aidat', label: 'Aidat' }, { value: 'demirbas', label: 'Demirbaş' }, { value: 'diger', label: 'Diğer' }] }] }); if (v) { const amount = r2(Number(v.amount) || 0); if (amount <= 0) return toast('Tutar sıfırdan büyük olmalı', 'err'); db.insert('dues', { ...v, flat: id, period: period(), ...dueOf(f, amount) }); fresh(); app.refresh(); } };
    on(el, 'click', '[data-act=dd]', async (e, b) => { const d = db.get('dues', b.dataset.id); const why = await NS.prompt('Silme nedeni', '', { title: `${d.desc} silinsin mi?` }); if (!why) return; const by = await NS.approve(NS.app, `${id} borç silme`, ['admin']); if (!by) return; db.remove('dues', d.id); db.log('Borç silindi', `${id} · ${d.desc} · ${money(d.amount)} · ${why}`); fresh(); db.save(); app.refresh(); });
    on(el, 'click', '[data-act=rp]', (e, b) => printReceipt(f, db.get('receipts', b.dataset.id)));
    on(el, 'click', '[data-act=rx]', (e, b) => cancelReceipt(app, db.get('receipts', b.dataset.id)));
  }
  function duesPage(el, p, app) {
    let per = period(), f = 'all';
    const draw = () => {
      const rows = db.all('dues', (d) => d.period === per && (f === 'all' || (f === 'open' ? (d.paid || 0) < d.amount : (d.paid || 0) >= d.amount))).sort((a, b) => a.flat.localeCompare(b.flat, 'tr', { numeric: true }));
      const periods = [...new Set([...db.all('dues').map((d) => d.period), period()])].sort().reverse();
      el.innerHTML = pageHead('Aidat & Tahakkuk', 'Dönem bazında aidat ve borç takibi', `<select class="input" id="per" style="max-width:180px">${periods.map((x) => `<option value="${x}" ${x === per ? 'selected' : ''}>${perName(x)}</option>`).join('')}</select><button class="btn" id="ex">${icon('download')}</button><button class="btn" id="bnk">${icon('building')} Banka hareketlerini eşleştir</button><button class="btn" id="dsms">${icon('message')} Borçlulara SMS</button><button class="btn primary" id="acc">${icon('plus')} Toplu tahakkuk</button>`) + `
        <div class="grid g3 mb">${kpi('Tahakkuk', money(sum(rows, (d) => d.amount)), 'file')}${kpi('Tahsil edilen', money(sum(rows, (d) => d.paid || 0)), 'check', 'ok')}${kpi('Kalan', money(sum(rows, (d) => d.amount - (d.paid || 0))), 'alert', 'err')}</div>
        <div class="card"><div class="card-h"><div class="seg">${[['all', 'Tümü'], ['open', 'Ödenmemiş'], ['paid', 'Ödenmiş']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div>${table({ rows, columns: [{ label: 'Daire', render: (d) => `<a href="#/daire/${d.flat}"><b>${esc(d.flat)}</b></a> <span class="small faint">${esc(resident(flat(d.flat)))}</span>` }, { label: 'Açıklama', key: 'desc' }, { label: 'Tutar', cls: 'right', render: (d) => money(d.amount) }, { label: 'Ödenen', cls: 'right', render: (d) => money(d.paid || 0) }, { label: 'Durum', render: (d) => (d.paid >= d.amount ? badge('Ödendi', 'ok') : badge('Bekliyor', 'warn')) }], actions: [{ label: 'Tahsil et', act: 'col', show: (d) => (d.paid || 0) < d.amount }] })}</div>`;
      $('#per', el).onchange = (e) => { per = e.target.value; draw(); };
      $('#acc', el).onclick = () => accrue(app);
      $('#bnk', el).onclick = () => bankSync(app);
      $('#dsms', el).onclick = debtSms;
      $('#ex', el).onclick = () => NS.csv(`aidat-${per}`, rows, [{ key: 'flat', label: 'Daire' }, { label: 'Sakin', value: (d) => resident(flat(d.flat)) }, { key: 'amount', label: 'Tutar' }, { key: 'paid', label: 'Ödenen' }]);
    };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; draw(); });
    on(el, 'click', '[data-act=col]', (e, b) => collect(app, db.get('dues', b.dataset.id).flat));
    draw();
  }
  function expensesPage(el, p, app) {
    NS.crud(el, app, {
      col: 'expenses', title: 'Giderler', sub: 'Ortak giderler; olağanüstü giderleri arsa payına göre dairelere dağıtabilirsiniz', single: 'Gider', addLabel: 'Yeni gider', emptyIcon: 'receipt',
      fields: () => [{ name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'cat', label: 'Kategori', type: 'select', options: db.data.expCats }, { name: 'desc', label: 'Açıklama', required: true, full: true }, { name: 'vendor', label: 'Firma' }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'dist', label: 'Dairelere borç olarak yansıt', type: 'select', full: true, options: [{ value: '', label: 'Yansıtma (aidattan karşılanır)' }, { value: 'arsa', label: 'Arsa payına göre — bakım, onarım, sigorta, yönetici ücreti' }, { value: 'esit', label: 'Eşit — kapıcı, bahçıvan, bekçi gibi görevli giderleri' }] }],
      defaults: () => ({ date: today() }), sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      beforeSave: (v, rec) => { v.amount = r2(Number(v.amount) || 0); if (v.amount <= 0) return 'Tutar sıfırdan büyük olmalı'; if (v.dist && !rec && !SITE.split(db.all('flats'), v.amount, v.dist)) return 'Arsa payı girilmemiş; önce daire kartlarını tamamlayın'; if (rec) delete v.dist; },
      onSave: (v, rec) => {
        if (!v.dist || rec) return;
        const flats = db.all('flats'); const m = SITE.split(flats, v.amount, v.dist); flats.forEach((f) => db.insert('dues', { flat: f.id, period: period(), type: 'demirbas', desc: `${v.desc} payı`, ...dueOf(f, m[f.id]) }, true));
        db.log('Gider dağıtımı', `${v.desc} · ${money(v.amount)} · ${v.dist === 'esit' ? 'eşit' : 'arsa payı'}`); fresh(); db.save(); toast(`${flats.length} daireye pay dağıtıldı`, 'ok');
      },
      columns: [{ key: 'date', label: 'Tarih', render: (x) => NS.date(x.date) }, { key: 'cat', label: 'Kategori', render: (x) => badge(x.cat, 'acc') }, { key: 'desc', label: 'Açıklama' }, { key: 'vendor', label: 'Firma' }, { key: 'amount', label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b>` }],
    });
  }
  function announcementsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'announcements', title: 'Duyurular', sub: 'Sakin portalında ve WhatsApp ile paylaşılır', single: 'Duyuru', addLabel: 'Yeni duyuru', emptyIcon: 'bell',
      fields: [{ name: 'title', label: 'Başlık', required: true, full: true }, { name: 'text', label: 'Metin', type: 'textarea', required: true, full: true }, { name: 'date', label: 'Tarih', type: 'date' }, { name: 'pinned', label: 'Sabitle', type: 'checkbox' }],
      defaults: () => ({ date: today() }), sort: (a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || String(b.date).localeCompare(String(a.date)),
      columns: [{ key: 'title', label: 'Duyuru', render: (n) => `<b>${n.pinned ? '📌 ' : ''}${esc(n.title)}</b><div class="small muted">${esc(String(n.text || '').slice(0, 90))}</div>` }, { key: 'date', label: 'Tarih', render: (n) => NS.date(n.date) }],
      extraActions: [{ icon: 'message', act: 'wa', title: 'WhatsApp ile paylaş' }],
      onAction: (a, n) => window.open(`https://wa.me/?text=${encodeURIComponent(`📢 ${n.title}\n\n${n.text}\n\n${S().bizName}`)}`, '_blank', 'noopener'),
    });
  }
  function requestsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'requests', title: 'Talep & Arıza', sub: 'Sakinlerin portaldan veya telefonla ilettiği talepler', single: 'Talep', addLabel: 'Yeni talep', emptyIcon: 'wrench',
      fields: () => [{ name: 'flat', label: 'Daire', type: 'select', options: db.all('flats').map((f) => ({ value: f.id, label: `${f.id} — ${resident(f)}` })) }, { name: 'cat', label: 'Kategori', type: 'select', options: ['Elektrik', 'Su/Tesisat', 'Asansör', 'Bahçe', 'Temizlik', 'Güvenlik', 'Genel'] }, { name: 'title', label: 'Başlık', required: true, full: true }, { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(RQ).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'urgent', label: 'Acil', type: 'checkbox' }, { name: 'reply', label: 'Sakine yanıt (portalda görünür)', type: 'textarea', full: true }],
      defaults: { status: 'acik' }, beforeSave: (v, rec) => { if (!rec) v.at = new Date().toISOString(); },
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'o', label: 'Açık', test: (r) => r.status !== 'cozuldu' }],
      sort: (a, b) => ((a.status === 'cozuldu') - (b.status === 'cozuldu')) || ((b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)) || String(b.at).localeCompare(String(a.at)),
      columns: [{ key: 'title', label: 'Talep', render: (r) => `${r.urgent ? badge('Acil', 'err') + ' ' : ''}<b>${esc(r.title)}</b><div class="small muted">${esc(r.desc || '')}</div>${r.reply ? `<div class="small" style="color:var(--accent)">↳ ${esc(r.reply)}</div>` : ''}${r.rating === 'kotu' ? `<div class="small" style="color:var(--err)">Sakin: sorun devam ediyor</div>` : ''}` }, { key: 'flat', label: 'Daire' }, { key: 'cat', label: 'Kategori' }, { label: 'Tarih', render: (r) => NS.ago(r.at) }, { key: 'status', label: 'Durum', render: (r) => badge(RQ[r.status][0], RQ[r.status][1]) }],
    });
  }
  // Sakin portalından gelen ortak alan rezervasyonları
  function bookingsPage(el, p, app) {
    SITE.ensure(db);
    const facName = (id) => (SITE.FAC.find((x) => x.id === id) || { name: id }).name;
    NS.crud(el, app, {
      col: 'bookings', title: 'Ortak Alan Rezervasyonları', sub: 'Tenis kortu, toplantı salonu, barbekü ve fitness — sakin portalından veya telefonla', single: 'Rezervasyon', addLabel: 'Yeni rezervasyon', emptyIcon: 'calendar',
      fields: () => [{ name: 'flat', label: 'Daire', type: 'select', options: db.all('flats').map((f) => ({ value: f.id, label: `${f.id} — ${resident(f)}` })) }, { name: 'facility', label: 'Alan', type: 'select', options: SITE.FAC.map((x) => ({ value: x.id, label: x.name })) }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'slot', label: 'Saat', type: 'time', required: true }, { name: 'people', label: 'Kişi', type: 'number' }, { name: 'note', label: 'Not', full: true }],
      defaults: () => ({ date: today(), slot: '18:00', people: 2, status: 'aktif' }),
      beforeSave: (v, rec) => { if (v.date < today() && !rec) return 'Geçmiş tarihe rezervasyon yapılamaz'; if (db.find('bookings', (b) => b.status === 'aktif' && b.facility === v.facility && b.date === v.date && b.slot === v.slot && (!rec || b.id !== rec.id))) return 'Bu saat dolu'; if (!rec) { v.status = 'aktif'; v.at = new Date().toISOString(); } },
      filters: [{ value: 'up', label: 'Yaklaşan', test: (b) => b.status === 'aktif' && b.date >= today() }, { value: 'all', label: 'Tümü' }, { value: 'x', label: 'İptal', test: (b) => b.status === 'iptal' }],
      sort: (a, b) => (a.date + a.slot).localeCompare(b.date + b.slot),
      searchFields: (b) => [b.flat, facName(b.facility), b.note],
      columns: [{ key: 'date', label: 'Tarih', render: (b) => `<b>${NS.date(b.date)}</b> ${esc(b.slot)}` }, { key: 'facility', label: 'Alan', render: (b) => esc(facName(b.facility)), csv: (b) => facName(b.facility) }, { key: 'flat', label: 'Daire', render: (b) => `${esc(b.flat)} <span class="small muted">${esc(resident(flat(b.flat)))}</span>` }, { key: 'people', label: 'Kişi', cls: 'right' }, { key: 'note', label: 'Not' }, { key: 'status', label: 'Durum', render: (b) => (b.status === 'iptal' ? badge('İptal', 'err') : b.date < today() ? badge('Tamamlandı') : badge('Aktif', 'ok')) }],
      extraActions: [{ icon: 'x', act: 'cancel', title: 'İptal et' }],
      onAction: async (a, b, redraw) => { if (b.status === 'iptal') return toast('Zaten iptal'); if (await confirm(`${b.flat} dairesinin rezervasyonu iptal edilsin mi?`)) { db.update('bookings', b.id, { status: 'iptal' }); toast('İptal edildi'); redraw(); } },
    });
  }
  // Güvenlik: beklenen ziyaretçiler, kod ile giriş onayı
  function visitorsPage(el, p, app) {
    SITE.ensure(db);
    const VT = { misafir: 'Misafir', kargo: 'Kargo / kurye', servis: 'Teknik servis', taksi: 'Taksi', nakliye: 'Nakliye' };
    NS.crud(el, app, {
      col: 'visitors', title: 'Ziyaretçiler', sub: 'Sakinlerin bildirdiği misafir ve kuryeler — girişte kodu doğrulayın', single: 'Ziyaretçi', canAdd: false, emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ziyaretçi', required: true, full: true }, { name: 'plate', label: 'Plaka' }, { name: 'date', label: 'Tarih', type: 'date' }, { name: 'time', label: 'Saat', type: 'time' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'today', label: 'Bugün', test: (v) => v.date === today() && v.status !== 'iptal' }, { value: 'wait', label: 'Bekleniyor', test: (v) => v.status === 'bekleniyor' && v.date >= today() }, { value: 'all', label: 'Tümü' }],
      sort: (a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')),
      searchFields: (v) => [v.name, v.code, v.plate, v.flat],
      columns: [{ key: 'code', label: 'Kod', render: (v) => `<b class="mono">${esc(v.code)}</b>` }, { key: 'name', label: 'Ziyaretçi', render: (v) => `<b>${esc(v.name)}</b><div class="small muted">${esc(VT[v.type] || v.type || '')}${v.note ? ' · ' + esc(v.note) : ''}</div>` }, { key: 'flat', label: 'Daire', render: (v) => `${esc(v.flat)} <span class="small muted">${esc(resident(flat(v.flat)))}</span>` }, { key: 'plate', label: 'Plaka' }, { key: 'date', label: 'Beklenen', render: (v) => `${NS.date(v.date)} ${esc(v.time || '')}` }, { key: 'status', label: 'Durum', render: (v) => (v.status === 'geldi' ? badge('Giriş ' + NS.time(v.arrivedAt), 'ok') : v.status === 'iptal' ? badge('İptal', 'err') : badge('Bekleniyor', 'warn')) }],
      extraActions: [{ icon: 'check', act: 'in', title: 'Giriş yaptı' }],
      onAction: (a, v, redraw) => { if (v.status !== 'bekleniyor') return toast('Bu ziyaretçi bekleniyor durumunda değil'); db.update('visitors', v.id, { status: 'geldi', arrivedAt: new Date().toISOString() }); toast(`${v.name} girişi kaydedildi`, 'ok'); redraw(); },
    });
    // Girişte kodu hızlı doğrulama
    const bar = document.createElement('div'); bar.className = 'card pad mb row nw';
    bar.innerHTML = `${icon('qr')}<input class="input lg mono grow" id="vc" placeholder="Ziyaretçi kodunu yazın veya okutun" style="text-transform:uppercase"><button class="btn primary lg" id="vk">Doğrula</button>`;
    el.insertBefore(bar, el.children[1] || null);
    const check = () => {
      const c = $('#vc', el).value.trim().toUpperCase(); if (!c) return;
      db.load(); const v = db.find('visitors', (x) => x.code === c);
      if (!v) return toast('Bu koda ait bildirim yok', 'err');
      if (v.status !== 'bekleniyor') return toast(`Kod geçersiz: ${v.status === 'geldi' ? 'zaten kullanıldı' : 'iptal edilmiş'}`, 'err');
      if (v.date !== today()) return toast(`Bu ziyaret ${NS.date(v.date)} için bildirilmiş`, 'err');
      db.update('visitors', v.id, { status: 'geldi', arrivedAt: new Date().toISOString() }); $('#vc', el).value = '';
      toast(`${v.name} → ${v.flat} (${resident(flat(v.flat))}) girişi onaylandı`, 'ok'); app.refresh();
    };
    $('#vk', el).onclick = check; $('#vc', el).onkeydown = (e) => { if (e.key === 'Enter') check(); };
  }
  // Anketler: portalda daire başına bir oy
  function pollsPage(el, p, app) {
    SITE.ensure(db);
    const total = () => db.all('flats').length;
    NS.crud(el, app, {
      col: 'polls', title: 'Anketler', sub: 'Sakin portalında yayınlanır; her daire bir oy kullanır. Anket kat malikleri kurulu kararı yerine geçmez.', single: 'Anket', addLabel: 'Yeni anket', emptyIcon: 'list',
      fields: [{ name: 'title', label: 'Soru', required: true, full: true }, { name: 'opts', label: 'Seçenekler (her satıra bir seçenek)', type: 'textarea', required: true, full: true }, { name: 'until', label: 'Bitiş tarihi', type: 'date', required: true }, { name: 'active', label: 'Yayında', type: 'checkbox' }],
      defaults: () => ({ until: iso(addDays(new Date(), 14)), active: true, opts: 'Evet\nHayır\nFikrim yok' }),
      toForm: (r) => ({ ...r, opts: (r.options || []).join('\n') }),
      beforeSave: (v, rec) => { v.options = String(v.opts || '').split('\n').map((x) => x.trim()).filter(Boolean); delete v.opts; if (v.options.length < 2) { v.options.push('Evet', 'Hayır'); } if (!rec) { v.votes = {}; v.at = new Date().toISOString(); } },
      sort: (a, b) => ((b.active ? 1 : 0) - (a.active ? 1 : 0)) || String(b.at).localeCompare(String(a.at)),
      columns: [{ key: 'title', label: 'Anket', render: (r) => { const n = Object.keys(r.votes || {}).length; return `<b>${esc(r.title)}</b><div class="mt">${r.options.map((o, i) => { const c = Object.values(r.votes || {}).filter((v) => v === i).length; const pc = n ? Math.round((c / n) * 100) : 0; return `<div class="row nw small" style="gap:8px;margin:2px 0"><span style="width:140px" class="muted">${esc(o)}</span><div class="progress grow" style="height:6px"><i style="width:${pc}%"></i></div><b style="width:70px;text-align:right">${c} · %${pc}</b></div>`; }).join('')}</div>`; } }, { label: 'Katılım', cls: 'right', render: (r) => { const n = Object.keys(r.votes || {}).length; return `${n}/${total()}<div class="small muted">%${total() ? Math.round((n / total()) * 100) : 0}</div>`; } }, { key: 'until', label: 'Bitiş', render: (r) => NS.date(r.until) }, { key: 'active', label: 'Durum', render: (r) => (r.active && r.until >= today() ? badge('Yayında', 'ok') : badge('Kapalı')) }],
    });
  }

  function reportsPage(el) {
    const year = new Date().getFullYear();
    const byCat = NS.groupBy(db.all('expenses', (e) => e.date.startsWith(String(year))), (e) => e.cat);
    const inc = sum(db.all('dues', (d) => (d.paidAt || '').startsWith(String(year))), (d) => d.paid || 0), exp = sum(db.all('expenses', (e) => e.date.startsWith(String(year))), (e) => e.amount);
    const debtors = db.all('flats').map((f) => ({ ...f, d: debt(f.id), fee: SITE.lateFee(db, f.id) })).filter((f) => f.d > 0).sort((a, b) => b.d - a.d);
    el.innerHTML = pageHead('Raporlar', `${year} yılı gelir-gider, borçlu listesi ve gider dağılımı`, `<button class="btn" id="dl">${icon('download')} Borçlu listesi</button><button class="btn" id="pr">${icon('print')} Yazdır (pano için)</button>`) + `
      <div class="grid g4 mb">${kpi('Yıllık tahsilat', money(inc), 'trend', 'ok')}${kpi('Yıllık gider', money(exp), 'minus', 'err')}${kpi('Fark', money(inc - exp), 'wallet')}${kpi('Borçlu daire', debtors.length, 'alert', 'warn')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Gider dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).map(([label, v]) => ({ label, value: sum(v, (e) => e.amount) })).sort((a, b) => b.value - a.value), { format: money, size: 140 })}</div></div>
      <div class="card"><div class="card-h"><h3>Borçlu daireler</h3></div>${table({ rows: debtors, empty: 'Borçlu daire yok', columns: [{ label: 'Daire', render: (f) => `<b>${esc(f.id)}</b>` }, { label: 'Sakin', render: (f) => esc(resident(f)) }, { label: 'Borç', cls: 'right', render: (f) => money(f.d) }, { label: 'Tazminat', cls: 'right', render: (f) => money(f.fee) }] })}</div></div>`;
    $('#dl', el).onclick = () => NS.csv('borclu-listesi', debtors, [{ key: 'id', label: 'Daire' }, { label: 'Sakin', value: resident }, { key: 'd', label: 'Borç' }, { key: 'fee', label: 'Gecikme tazminatı' }]);
    $('#pr', el).onclick = () => NS.docs.print('ozet', { title: `${year} gelir-gider özeti`, lines: Object.entries(byCat).map(([k, v]) => ({ name: k, qty: v.length, total: sum(v, (e) => e.amount) })), totals: [['Toplam tahsilat', inc], ['Toplam gider', exp], ['Fark', inc - exp, true]], note: `Borçlu daire sayısı: ${debtors.length}` });
  }

  const ROLES = { admin: 'Yönetici', muhasebe: 'Muhasebe', gorevli: 'Görevli' };
  const appRef = NS.shell({
    id: 'site', integrations: ['sms', 'whatsapp', 'email', 'payment', 'efatura', 'printer', 'webhook', 'backup'], name: 'Site Yönetimi', tagline: 'Apartman & Site', icon: 'home', accent: '#059669', db, home: 'ozet', auth: { roles: ROLES }, titles: { daire: 'Daire' },
    nav: [{ sec: 'Yönetim' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['muhasebe'] }, { id: 'daireler', label: 'Daireler & Sakinler', icon: 'building' }, { id: 'aidat', label: 'Aidat & Tahakkuk', icon: 'wallet', roles: ['muhasebe'] }, { id: 'giderler', label: 'Giderler', icon: 'receipt', roles: ['muhasebe'] }, { sec: 'İletişim' }, { id: 'duyurular', label: 'Duyurular', icon: 'bell' }, { id: 'talepler', label: 'Talep & Arıza', icon: 'wrench' }, { id: 'ziyaretciler', label: 'Ziyaretçiler', icon: 'users' }, { id: 'rezervasyonlar', label: 'Rezervasyonlar', icon: 'calendar' }, { id: 'anketler', label: 'Anketler', icon: 'list' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['muhasebe'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, daireler: flatsPage, daire: flatPage, aidat: duesPage, giderler: expensesPage, duyurular: announcementsPage, talepler: requestsPage, ziyaretciler: visitorsPage, rezervasyonlar: bookingsPage, anketler: pollsPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Aidat ayarları' }, { name: 'baseDue', label: 'Standart aidat (₺)', type: 'number' }, { name: 'dueDay', label: 'Son ödeme günü', type: 'number' }, { name: 'lateFee', label: 'Aylık gecikme tazminatı (%) — kanuni oran %5 (634 KMK md. 20), geciken gün sayısıyla orantılı', type: 'number' }, { name: 'openingCash', label: 'Açılış kasa/banka bakiyesi (₺)', type: 'number', step: '0.01' }, { name: 'bank', label: 'Banka' }, { name: 'iban', label: 'IBAN', full: true }, { name: 'manager', label: 'Yönetici adı' }] }) },
  });
  if (!fin() && !location.hash) appRef.go('talepler');
})();
