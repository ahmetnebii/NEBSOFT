/* NEBSOFT Adisyon — masa planı, sipariş, mutfak ekranı, paket servis, QR menü, rezervasyon, reçeteli stok */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, uid, addDays } = NS;

  const db = new NS.DB('adisyon', window.ADISYON_SEED);
  const PH = window.PLATHUB;
  PH.ensure(db, (c) => totals(c));
  const S = () => db.settings({ service: 0, qrOrder: true, receiptFooter: '' });
  const r2 = (n) => Math.round(n * 100) / 100;
  const PAY = { nakit: 'Nakit', kart: 'Kredi Kartı', yemekkarti: 'Yemek Kartı', online: 'Online Ödeme', havale: 'Havale' };
  const PST = { hazirlaniyor: ['Hazırlanıyor', 'warn'], yolda: ['Yolda', 'info'], teslim: ['Teslim edildi', 'ok'] };
  const ISTAT = { new: ['Gönderilmedi', 'warn'], sent: ['Mutfakta', 'info'], prep: ['Hazırlanıyor', 'acc'], ready: ['Hazır', 'ok'], served: ['Servis edildi', ''] };
  const M = (id) => db.get('menu', id);
  // Masa QR anahtarı: QR bağlantısına eklenir, bulut sunucusu masa + anahtar ister (eski QR'lar yeniden basılmalı)
  const qrKey = (t) => { if (!t.qrKey) { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; const b = new Uint8Array(8); crypto.getRandomValues(b); t.qrKey = [...b].map((v) => A[v % A.length]).join(''); db.save(); } return t.qrKey; };
  const T = (id) => db.get('tables', id);
  const userName = (id) => (db.get('users', id) || {}).name || '-';
  const openChecks = () => db.all('checks', (c) => c.status !== 'closed');
  const checkOf = (tableId) => openChecks().find((c) => c.table === tableId);
  const tName = (c) => (c.type === 'paket' ? `Paket · ${c.customer ? c.customer.name : ''}` : c.type === 'gelal' ? 'Gel-Al' : (T(c.table) || {}).name || '-');

  // ÖKC kalemleri: ikram düşülür, indirim satırlara dağıtılır, bahşiş ayrı kalem; kalem toplamı = hesap toplamı. KDV menü kaleminden (boşsa 10)
  function okcItems(c) {
    const t = totals(c); const act = c.items.filter((i) => !i.cancel && !i.comp); const base = sum(act, (i) => i.price * i.qty); const k = base ? (base - t.disc) / base : 1;
    let left = r2(t.total - t.service); const vatOf = (i) => { const m = db.get('menu', i.pid); return m && m.vat !== undefined && m.vat !== '' && Number.isFinite(Number(m.vat)) ? Number(m.vat) : 10; };
    const out = act.map((i, n) => { const amt = n === act.length - 1 ? left : r2(i.price * i.qty * k); left = r2(left - amt); return { name: i.name, qty: i.qty, price: r2(amt / (i.qty || 1)), amount: amt, listPrice: i.price, discount: r2(i.price * i.qty - amt), vat: vatOf(i) }; });
    if (t.service) out.push({ name: 'Bahşiş (gönüllü)', qty: 1, price: t.service, amount: t.service, discount: 0, vat: 0, tip: true });
    return out;
  }
  function totals(c) {
    const active = c.items.filter((i) => !i.cancel);
    const gross = sum(active, (i) => (i.comp ? 0 : i.price * i.qty));
    const comp = sum(active.filter((i) => i.comp), (i) => i.price * i.qty);
    let disc = 0;
    if (c.discount) disc = c.discount.type === 'pct' ? gross * c.discount.val / 100 : Math.min(gross, c.discount.val);
    // Zorunlu servis / masa / kuver ücreti alınamaz (Fiyat Etiketi Yönetmeliği değişikliği, Ticaret Bakanlığı duyurusu 30.01.2026 —
    // ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-fiyat-etiketi-yonetmeliginde-degisiklik-yapildi). Yalnızca müşterinin isteğiyle
    // eklenen gönüllü bahşiş (c.tip) ayrı satırda gösterilir. Eski kapalı hesapların kayıtlı toplamı değişmez.
    const service = Number(c.tip) > 0 ? Number(c.tip) : 0;
    const total = r2(gross - disc + service);
    const paid = r2(sum(c.payments || [], (p) => p.amount));
    return { gross: r2(gross), comp: r2(comp), disc: r2(disc), service: r2(service), total, paid, remain: r2(total - paid) };
  }
  function tableState(t) {
    const c = checkOf(t.id);
    if (c) {
      if (c.status === 'bill') return 'bill';
      if (c.items.some((i) => i.status === 'ready')) return 'ready';
      return 'busy';
    }
    const now = new Date();
    const r = db.find('reservations', (r) => r.table === t.id && r.date === NS.today() && r.status === 'bekliyor' && Math.abs(new Date(`${r.date}T${r.time}`) - now) < 2 * 3600000);
    return r ? 'resv' : 'free';
  }
  const mins = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 60000));

  function newCheck(extra) {
    const c = db.insert('checks', { no: db.nextNo('checks', 'A'), opened: new Date().toISOString(), items: [], payments: [], status: 'open', waiter: NS.currentUser && NS.currentUser.id, discount: null, ...extra });
    db.log('Adisyon açıldı', `${c.no} · ${tName(c)}`);
    return c;
  }

  // ---------- Masalar ----------
  let area = 'a1', editMode = false;
  function tablesPage(el, param, app) {
    db.all('checks', (c) => c.status !== 'closed' && c.type === 'masa' && !c.items.length && mins(c.opened) > 1).forEach((c) => db.remove('checks', c.id));
    const open = openChecks();
    const todayClosed = db.all('checks', (c) => c.status === 'closed' && NS.iso(c.closed) === NS.today());
    const pendingKitchen = sum(open, (c) => c.items.filter((i) => ['sent', 'prep'].includes(i.status)).length);
    const calls = db.all('calls', (c) => !c.done);
    el.innerHTML = pageHead('Masalar', `${NS.dateLong(new Date())}`, `
      <button class="btn" id="pk">${icon('truck')} Paket sipariş</button><button class="btn" id="ga">${icon('bag')} Gel-al</button>
      ${app.can('admin') ? `<button class="btn ${editMode ? 'primary' : ''}" id="ed">${icon('edit')} ${editMode ? 'Düzenlemeyi bitir' : 'Planı düzenle'}</button>` : ''}`) + `
      ${calls.length ? `<div class="card pad mb row" style="border-color:var(--warn);background:var(--warn-soft)">${icon('bell')}<b class="grow">QR menüden çağrı: ${calls.map((c) => `${esc((T(c.table) || {}).name)} (${c.type === 'hesap' ? 'hesap istiyor' : 'garson çağırıyor'})`).join(', ')}</b><button class="btn sm" id="cdone">Tamam</button></div>` : ''}
      <div class="grid g4 mb">${kpi('Dolu masa', `${open.filter((c) => c.type === 'masa').length} / ${db.all('tables').length}`, 'table')}${kpi('Açık hesap toplamı', money(sum(open, (c) => totals(c).remain)), 'wallet', 'warn')}${kpi('Bugünkü ciro', money(sum(todayClosed, (c) => c.total)), 'trend', 'ok')}${kpi('Mutfak kuyruğu', num(pendingKitchen) + ' kalem', 'chef', 'info')}</div>
      <div class="row between mb"><div class="seg" id="areas">${db.all('areas').map((a) => `<button data-area="${a.id}" class="${a.id === area ? 'active' : ''}">${esc(a.name)} <span class="faint">${db.all('tables', (t) => t.area === a.id && checkOf(t.id)).length}/${db.all('tables', (t) => t.area === a.id).length}</span></button>`).join('')}</div>
        <div class="legend-row"><span><i style="border-color:var(--border);background:var(--surface-2)"></i>Boş</span><span><i style="border-color:var(--accent)"></i>Dolu</span><span><i style="border-color:var(--ok)"></i>Sipariş hazır</span><span><i style="border-color:var(--warn);background:var(--warn-soft)"></i>Hesap istendi</span><span><i style="border-color:var(--info);border-style:dashed"></i>Rezerve</span></div></div>
      ${editMode ? `<div class="row mb"><span class="muted small grow">Masaları sürükleyerek yerleştirin. Masaya tıklayınca düzenleyebilirsiniz.</span><button class="btn sm" id="addt">${icon('plus')} Masa ekle</button><button class="btn sm" id="adda">${icon('plus')} Bölüm ekle</button></div>` : ''}
      <div class="floor ${editMode ? 'edit' : ''}" id="floor"></div>
      ${open.filter((c) => c.type !== 'masa').length ? `<h2 class="mt mb">Paket & Gel-al siparişleri</h2><div class="grid g-auto">${open.filter((c) => c.type !== 'masa').map((c) => `<div class="card pad" style="cursor:pointer" data-open="${c.id}"><div class="row between"><b>${esc(tName(c))}</b>${c.pstatus ? badge(PST[c.pstatus][0], PST[c.pstatus][1]) : ''}</div><div class="small muted">${esc(c.no)} · ${mins(c.opened)} dk · ${c.source ? esc(c.source) : ''}</div><div class="big mt">${money(totals(c).total)}</div></div>`).join('')}</div>` : ''}`;
    drawFloor(el, app);
    on(el, 'click', '[data-area]', (e, t) => { area = t.dataset.area; app.refresh(); });
    on(el, 'click', '[data-open]', (e, t) => app.go('siparis', t.dataset.open));
    $('#pk', el).onclick = () => newPackage(app);
    $('#ga', el).onclick = () => { const c = newCheck({ type: 'gelal', table: null, guests: 1 }); app.go('siparis', c.id); };
    if ($('#ed', el)) $('#ed', el).onclick = () => { editMode = !editMode; app.refresh(); };
    if ($('#cdone', el)) $('#cdone', el).onclick = () => { db.all('calls').forEach((c) => { c.done = true; }); db.save(); app.refresh(); };
    if ($('#addt', el)) $('#addt', el).onclick = async () => {
      const v = await formModal({ title: 'Yeni Masa', fields: [{ name: 'name', label: 'Masa adı', required: true }, { name: 'seats', label: 'Kişi', type: 'number', value: 4 }, { name: 'shape', label: 'Şekil', type: 'select', options: [{ value: 'square', label: 'Kare' }, { value: 'round', label: 'Yuvarlak' }, { value: 'wide', label: 'Uzun' }] }] });
      if (v) { db.insert('tables', { ...v, id: area + '-' + uid(), area, x: 50, y: 50 }); app.refresh(); }
    };
    if ($('#adda', el)) $('#adda', el).onclick = async () => { const n = await NS.prompt('Bölüm adı (ör. Kat 2)', '', { title: 'Yeni bölüm' }); if (n) { const a = db.insert('areas', { name: n }); area = a.id; app.refresh(); } };
  }
  function drawFloor(el, app) {
    const floor = $('#floor', el);
    const size = { square: [96, 84], round: [84, 84], wide: [150, 84] };
    floor.innerHTML = db.all('tables', (t) => t.area === area).map((t) => {
      const st = tableState(t); const c = checkOf(t.id); const [w, h] = size[t.shape] || size.square;
      const r = st === 'resv' ? db.find('reservations', (x) => x.table === t.id && x.date === NS.today() && x.status === 'bekliyor') : null;
      return `<div class="tbl-node ${t.shape === 'round' ? 'round' : ''} ${st}" data-t="${t.id}" style="left:${t.x}%;top:${t.y}%;width:${w}px;height:${h}px">
        <b>${esc(t.name)}</b>${c ? `<span class="s">${money(totals(c).total)}</span><span class="s">${mins(c.opened)} dk · ${c.guests || '-'} kişi</span>` : r ? `<span class="s">${esc(r.time)} ${esc(r.name.split(' ')[0])}</span>` : `<span class="s">${t.seats} kişilik</span>`}
        ${st === 'ready' ? `<span class="pill badge ok">Hazır</span>` : ''}${c && c.items.some((i) => i.status === 'new' && i.qr) ? `<span class="pill badge warn">QR</span>` : ''}</div>`;
    }).join('') || `<div class="empty">${icon('table')}<div>Bu bölümde masa yok</div></div>`;
    let drag = null, moved = false;
    on(floor, 'pointerdown', '[data-t]', (e, node) => { if (!editMode) return; drag = node; moved = false; node.setPointerCapture(e.pointerId); });
    floor.addEventListener('pointermove', (e) => {
      if (!drag) return; moved = true;
      const r = floor.getBoundingClientRect();
      drag.style.left = NS.clamp(((e.clientX - r.left) / r.width) * 100, 5, 95) + '%';
      drag.style.top = NS.clamp(((e.clientY - r.top) / r.height) * 100, 8, 92) + '%';
    });
    floor.addEventListener('pointerup', () => { if (drag && moved) { const t = T(drag.dataset.t); t.x = parseFloat(drag.style.left); t.y = parseFloat(drag.style.top); db.save(); } drag = null; });
    on(floor, 'click', '[data-t]', async (e, node) => {
      const t = T(node.dataset.t);
      if (editMode) {
        if (moved) return;
        const v = await formModal({ title: 'Masa', fields: [{ name: 'name', label: 'Masa adı', required: true }, { name: 'seats', label: 'Kişi', type: 'number' }, { name: 'shape', label: 'Şekil', type: 'select', options: [{ value: 'square', label: 'Kare' }, { value: 'round', label: 'Yuvarlak' }, { value: 'wide', label: 'Uzun' }] }, { name: 'del', label: 'Bu masayı sil', type: 'checkbox' }], values: t });
        if (v) { if (v.del) { if (checkOf(t.id)) return toast('Açık hesabı olan masa silinemez', 'err'); db.remove('tables', t.id); } else db.update('tables', t.id, v); app.refresh(); }
        return;
      }
      let c = checkOf(t.id);
      if (!c) {
        const g = await NS.prompt(`${t.name} — kaç kişi?`, t.seats, { title: 'Masa aç', type: 'number' });
        if (g === null) return;
        const r = db.find('reservations', (x) => x.table === t.id && x.date === NS.today() && x.status === 'bekliyor');
        if (r) r.status = 'geldi';
        c = newCheck({ type: 'masa', table: t.id, guests: Number(g) || 1 });
      }
      app.go('siparis', c.id);
    });
  }

  // ---------- Sipariş ekranı ----------
  let mcat = null;
  function orderPage(el, id, app) {
    const c = db.get('checks', id);
    if (!c || c.status === 'closed') { el.innerHTML = `<div class="empty">${icon('receipt')}<div>Adisyon bulunamadı veya kapatıldı.</div><a class="btn mt" href="#/masalar">Masalara dön</a></div>`; return; }
    mcat = mcat || (db.all('mcats')[0] || {}).id;
    el.innerHTML = `<div class="order"><div class="menu-side">
        <div class="row mb"><a class="btn" href="#/${c.type === 'paket' ? 'paket' : 'masalar'}">${icon('back')}</a><div class="grow"><h2>${esc(tName(c))}</h2><div class="small muted">${esc(c.no)} · ${c.guests || 1} kişi · ${esc(userName(c.waiter))} · ${mins(c.opened)} dk</div></div>${NS.searchBox('ms', 'Menüde ara...')}</div>
        <div class="mcats" id="mc"></div><div class="mgrid" id="mg"></div></div>
      <div class="check-side card" id="chk"></div></div>`;
    let q = '';
    const drawMenu = () => {
      $('#mc', el).innerHTML = db.all('mcats').map((k) => `<button data-mc="${k.id}" class="${k.id === mcat && !q ? 'active' : ''}" style="${k.id === mcat && !q ? `background:${k.color};border-color:${k.color}` : ''}">${esc(k.name)}</button>`).join('');
      const items = db.all('menu').filter((m) => (q ? NS.match(q, m.name) : m.cat === mcat));
      $('#mg', el).innerHTML = items.map((m) => `<button class="mi ${m.active ? '' : 'out'}" data-m="${m.id}"><span class="n">${esc(m.name)}</span><span class="row between"><span class="p">${money(m.price)}</span>${m.active ? `<span class="faint small">${m.station === 'bar' ? 'Bar' : 'Mutfak'}</span>` : badge('Tükendi', 'err')}</span></button>`).join('') || '<div class="empty">Ürün yok</div>';
    };
    const drawCheck = () => {
      const t = totals(c);
      const groups = [['new', 'Yeni (gönderilmedi)'], ['kitchen', 'Mutfakta / Hazırlanıyor'], ['ready', 'Hazır'], ['served', 'Servis edildi']];
      const grp = (i) => (i.status === 'new' ? 'new' : ['sent', 'prep'].includes(i.status) ? 'kitchen' : i.status);
      const hasNew = c.items.some((i) => i.status === 'new' && !i.cancel);
      $('#chk', el).innerHTML = `<div class="card-h"><h3>${icon('receipt')} Adisyon</h3>${badge(c.status === 'bill' ? 'Hesap istendi' : 'Açık', c.status === 'bill' ? 'warn' : 'acc')}<button class="btn sm ghost icon" data-a="more" title="Diğer işlemler">${icon('menu')}</button></div>
        ${c.type === 'paket' && c.customer ? `<div class="pad small" style="padding:10px 14px;border-bottom:1px solid var(--border)">${icon('user')} <b>${esc(c.customer.name)}</b> · ${esc(c.customer.phone)}<div class="muted">${icon('map')} ${esc(c.customer.address)}</div></div>` : ''}
        <div style="flex:1;overflow-y:auto">${c.items.length ? groups.map(([g, label]) => { const its = c.items.filter((i) => grp(i) === g); return its.length ? `<div class="sec-h">${label}</div>${its.map((i) => `<div class="ci ${i.status === 'new' ? 'new' : ''} ${i.cancel ? 'cancel' : ''} ${i.paid ? 'paid' : ''}" data-i="${i.id}" style="cursor:pointer"><span class="q">${i.qty}</span><span><b>${esc(i.name)}</b> ${i.comp ? badge('İkram', 'ok') : ''}${i.paid ? badge('Ödendi', 'ok') : ''}${i.qr ? badge('QR', 'warn') : ''}${i.cancel ? badge('İptal', 'err') : ''}</span><b>${money(i.comp ? 0 : i.price * i.qty)}</b>${i.note ? `<span class="note">${icon('message')} ${esc(i.note)}</span>` : ''}${i.cancel && i.cancelReason ? `<span class="note">İptal: ${esc(i.cancelReason)}</span>` : ''}</div>`).join('')}` : ''; }).join('') : `<div class="empty">${icon('fork')}<div>Menüden ürün ekleyin</div></div>`}</div>
        <div class="totals" style="padding:12px 14px;border-top:1px solid var(--border);background:var(--surface-2)">
          <div class="row between small muted"><span>Ara toplam</span><span>${money(t.gross + t.comp)}</span></div>
          ${t.comp ? `<div class="row between small" style="color:var(--ok)"><span>İkram</span><span>-${money(t.comp)}</span></div>` : ''}
          ${t.disc ? `<div class="row between small" style="color:var(--ok)"><span>İndirim</span><span>-${money(t.disc)}</span></div>` : ''}
          ${t.service ? `<div class="row between small muted"><span>Bahşiş (gönüllü)</span><span>${money(t.service)}</span></div>` : ''}
          ${t.paid ? `<div class="row between small" style="color:var(--info)"><span>Ödenen</span><span>-${money(t.paid)}</span></div>` : ''}
          <div class="row between"><span class="muted">${t.paid ? 'KALAN' : 'TOPLAM'}</span><span style="font-size:28px;font-weight:800">${money(t.remain)}</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px">
          <button class="btn lg ${hasNew ? 'primary' : ''}" data-a="send" ${hasNew ? '' : 'disabled'} style="grid-column:1/-1">${icon('send')} Mutfağa gönder${hasNew ? ` (${c.items.filter((i) => i.status === 'new' && !i.cancel).length})` : ''}</button>
          <button class="btn" data-a="bill">${icon('print')} Hesap fişi</button>
          <button class="btn ok" data-a="pay" ${c.items.length ? '' : 'disabled'}>${icon('wallet')} Ödeme al</button>
        </div>`;
    };
    $('#ms', el).oninput = (e) => { q = e.target.value; drawMenu(); };
    on(el, 'click', '[data-mc]', (e, t) => { mcat = t.dataset.mc; q = ''; $('#ms', el).value = ''; drawMenu(); });
    on(el, 'click', '[data-m]', (e, t) => {
      const m = M(t.dataset.m);
      if (!m.active) return toast(`${m.name} tükendi`, 'err');
      const ex = c.items.find((i) => i.pid === m.id && i.status === 'new' && !i.note && !i.comp && !i.cancel);
      if (ex) ex.qty++; else c.items.push({ id: uid(), pid: m.id, name: m.name, price: m.price, qty: 1, note: '', status: 'new', station: m.station, by: NS.currentUser && NS.currentUser.id });
      db.save(); NS.beep(1100, 40); drawCheck();
    });
    on(el, 'click', '[data-i]', (e, t) => itemModal(c, c.items.find((i) => i.id === t.dataset.i), () => { drawCheck(); }));
    on(el, 'click', '[data-a]', (e, t) => {
      const a = t.dataset.a;
      if (a === 'send') sendKitchen(c, drawCheck);
      else if (a === 'bill') { c.status = 'bill'; db.save(); printCheck(c, true); drawCheck(); }
      else if (a === 'pay') payModal(c, app, drawCheck);
      else if (a === 'more') moreModal(c, app, drawCheck);
    });
    drawMenu(); drawCheck();
  }
  function sendKitchen(c, done) {
    const batch = uid(), now = new Date().toISOString();
    const items = c.items.filter((i) => i.status === 'new' && !i.cancel);
    items.forEach((i) => {
      i.status = 'sent'; i.batch = batch; i.sentAt = now;
      const m = M(i.pid);
      (m && m.recipe || []).forEach((r) => { const ing = db.get('ingredients', r.iid); if (ing) ing.stock = r2(ing.stock - r.qty * i.qty); });
    });
    db.log('Mutfağa gönderildi', `${tName(c)} · ${items.length} kalem`);
    db.save(); toast(`${items.length} kalem mutfağa gönderildi`, 'ok'); done();
  }
  function itemModal(c, i, done) {
    const sent = i.status !== 'new';
    modal({
      title: i.name,
      body: `<div class="col">
        <div class="row"><span class="grow muted">Durum</span>${badge(ISTAT[i.status][0], ISTAT[i.status][1])}${i.sentAt ? `<span class="small faint">${NS.time(i.sentAt)}</span>` : ''}</div>
        <div class="field"><label>Adet</label><div class="row nw"><button class="btn icon" data-d="-1">${icon('minus')}</button><input class="input center" id="iq" type="number" value="${i.qty}" ${sent ? 'disabled' : ''} style="max-width:90px"><button class="btn icon" data-d="1" ${sent ? 'disabled' : ''}>${icon('plus')}</button></div>${sent ? '<span class="small faint">Gönderilmiş ürünün adedi değiştirilemez; iptal edip yeniden ekleyin.</span>' : ''}</div>
        <div class="field"><label>Not (mutfağa iletilir)</label><input class="input" id="in" value="${esc(i.note)}" placeholder="Az pişmiş, soğansız, acısız..."></div>
        <div class="row">${['Soğansız', 'Acısız', 'Az pişmiş', 'Çok pişmiş', 'Buzsuz', 'Şekersiz', 'Paket'].map((n) => `<button class="btn sm" data-n="${n}">${n}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="ic" ${i.comp ? 'checked' : ''}> İkram (ücretsiz)</label>
      </div>`,
      onOpen: (b) => {
        on(b, 'click', '[data-d]', (e, t) => { const inp = $('#iq', b); if (!inp.disabled) inp.value = Math.max(1, Number(inp.value) + Number(t.dataset.d)); });
        on(b, 'click', '[data-n]', (e, t) => { const inp = $('#in', b); inp.value = inp.value ? inp.value + ', ' + t.dataset.n : t.dataset.n; });
      },
      actions: [
        { label: i.cancel ? 'İptali geri al' : 'İptal et', cls: 'danger', icon: 'x', onClick: async (close) => {
          if (i.cancel) { i.cancel = false; db.save(); close(); return done(); }
          if (!sent) { c.items = c.items.filter((x) => x.id !== i.id); db.save(); close(); return done(); }
          close();
          const reason = await NS.prompt('İptal nedeni', '', { title: 'Ürün iptali' });
          if (reason === null) return;
          // Mutfağa gitmiş ürünün iptali: garson için yetkili (yönetici / kasiyer) PIN'i
          const by = await NS.approve(NS.app, `${i.name} iptali`, ['admin', 'kasa']); if (!by) return;
          i.cancel = true; i.cancelReason = reason || 'Belirtilmedi'; if (NS.currentUser && by.id && by.id !== NS.currentUser.id) i.cancelBy = by.name;
          db.log('Ürün iptal', `${tName(c)} · ${i.name} · ${i.cancelReason}${i.cancelBy ? ' · onaylayan ' + i.cancelBy : ''}`); db.save(); done();
        } },
        { label: 'Başka masaya taşı', icon: 'right', onClick: async (close) => {
          close();
          const busy = openChecks().filter((x) => x.id !== c.id);
          if (!busy.length) return toast('Taşınacak açık masa yok', 'err');
          const v = await formModal({ title: 'Ürünü taşı', fields: [{ name: 'to', label: 'Hedef adisyon', type: 'select', options: busy.map((x) => ({ value: x.id, label: `${tName(x)} (${x.no})` })) }] });
          if (!v) return;
          c.items = c.items.filter((x) => x.id !== i.id); db.get('checks', v.to).items.push(i); db.save(); toast('Ürün taşındı', 'ok'); done();
        } },
        { label: 'Kaydet', cls: 'primary', onClick: async (close, b) => { const comp = $('#ic', b).checked; const qty = Math.max(1, Number($('#iq', b).value) || 1);
          // İkram ve gönderilmiş üründe adet azaltma: yetkili onayı
          if ((comp && !i.comp) || (sent && qty < i.qty)) { const by = await NS.approve(NS.app, comp && !i.comp ? `${i.name} ikram` : `${i.name} adet azaltma`, ['admin', 'kasa']); if (!by) return; if (comp && !i.comp) { i.compBy = by.name || ''; db.log('İkram', `${tName(c)} · ${i.name}${by.name ? ' · onaylayan ' + by.name : ''}`); } }
          i.qty = qty; i.note = $('#in', b).value.trim(); i.comp = comp; if (i.status === 'ready') i.status = 'ready'; db.save(); close(); done(); } },
      ],
    });
  }
  function moreModal(c, app, done) {
    const ready = c.items.filter((i) => i.status === 'ready');
    modal({
      title: `${tName(c)} — işlemler`,
      body: `<div class="grid g2">
        ${ready.length ? `<button class="btn lg ok" data-x="served" style="grid-column:1/-1">${icon('check')} Hazır ürünler servis edildi (${ready.length})</button>` : ''}
        ${c.type === 'masa' ? `<button class="btn lg" data-x="move">${icon('right')} Masa taşı</button><button class="btn lg" data-x="merge">${icon('layers')} Masa birleştir</button>` : ''}
        <button class="btn lg" data-x="disc">${icon('percent')} İndirim uygula</button><button class="btn lg" data-x="tip" title="Yalnızca müşteri kendisi isterse">${icon('gift')} Bahşiş (müşteri isterse)</button><button class="btn lg" data-x="guests">${icon('users')} Kişi sayısı</button>
        <button class="btn lg" data-x="waiter">${icon('user')} Garson değiştir</button><button class="btn lg" data-x="print">${icon('print')} Adisyon yazdır</button>
        ${c.items.filter((i) => !i.cancel).length === 0 ? `<button class="btn lg danger" data-x="close" style="grid-column:1/-1">${icon('trash')} Boş adisyonu kapat</button>` : ''}
      </div>`,
      onOpen: (b, close) => on(b, 'click', '[data-x]', async (e, t) => {
        close();
        const x = t.dataset.x;
        if (x === 'served') { ready.forEach((i) => { i.status = 'served'; }); db.save(); done(); }
        else if (x === 'move') {
          const free = db.all('tables', (tt) => !checkOf(tt.id));
          const v = await formModal({ title: 'Masa taşı', fields: [{ name: 'to', label: 'Boş masa', type: 'select', options: free.map((tt) => ({ value: tt.id, label: `${tt.name} (${(db.get('areas', tt.area) || {}).name})` })) }] });
          if (v) { const from = tName(c); c.table = v.to; db.log('Masa taşındı', `${from} → ${tName(c)}`); db.save(); toast('Masa taşındı', 'ok'); app.refresh(); }
        } else if (x === 'merge') {
          const others = openChecks().filter((o) => o.id !== c.id && o.type === 'masa');
          if (!others.length) return toast('Birleştirilecek dolu masa yok', 'err');
          const v = await formModal({ title: 'Masa birleştir', fields: [{ name: 'from', label: 'Bu masaya aktarılacak masa', type: 'select', options: others.map((o) => ({ value: o.id, label: `${tName(o)} · ${money(totals(o).total)}` })) }] });
          if (v) { const o = db.get('checks', v.from); c.items.push(...o.items); c.payments.push(...o.payments); c.guests = (c.guests || 0) + (o.guests || 0); db.remove('checks', o.id); db.log('Masa birleştirildi', `${tName(o)} → ${tName(c)}`); toast('Masalar birleştirildi', 'ok'); done(); }
        } else if (x === 'disc') {
          const v = await formModal({ title: 'İndirim', fields: [{ name: 'type', label: 'Tür', type: 'select', options: [{ value: 'pct', label: 'Yüzde (%)' }, { value: 'tl', label: 'Tutar (₺)' }] }, { name: 'val', label: 'Değer', type: 'number' }, { name: 'reason', label: 'Neden' }], values: c.discount || { type: 'pct' } });
          if (v) { c.discount = v.val ? v : null; db.log('İndirim', `${tName(c)} · ${v.type === 'pct' ? '%' + v.val : money(v.val)}`); db.save(); done(); }
        } else if (x === 'tip') {
          const v = await formModal({ title: 'Gönüllü bahşiş', fields: [{ name: 'tip', label: 'Tutar (₺) — yalnızca müşterinin kendi isteğiyle; boş bırakırsanız kaldırılır', type: 'number', step: '0.01' }], values: { tip: c.tip || '' } });
          if (v) { const n = Number(v.tip) || 0; if (n > 0) c.tip = r2(n); else delete c.tip; db.log('Bahşiş', `${tName(c)} · ${money(n)}`); db.save(); done(); }
        } else if (x === 'guests') { const g = await NS.prompt('Kişi sayısı', c.guests, { type: 'number' }); if (g) { c.guests = Number(g); db.save(); app.refresh(); } }
        else if (x === 'waiter') { const v = await formModal({ title: 'Garson', fields: [{ name: 'w', label: 'Garson', type: 'select', options: db.all('users', (u) => ['garson', 'admin'].includes(u.role)).map((u) => ({ value: u.id, label: u.name })) }], values: { w: c.waiter } }); if (v) { c.waiter = v.w; db.save(); app.refresh(); } }
        else if (x === 'print') printCheck(c, false);
        else if (x === 'close') { db.remove('checks', c.id); app.go('masalar'); }
      }),
    });
  }
  function payModal(c, app, done) {
    const t = totals(c);
    if (t.remain <= 0) return closeCheck(c, app);
    const unpaid = c.items.filter((i) => !i.cancel && !i.paid && !i.comp);
    modal({
      title: `Ödeme — ${tName(c)}`, size: 'wide',
      body: `<div class="tabs"><button data-pm="all" class="active">Tamamı</button><button data-pm="split">Kişiye böl</button><button data-pm="items">Ürün seç</button><button data-pm="custom">Tutar gir</button></div>
        <div class="grid g2"><div>
          <div id="pmb"></div>
          <div class="card pad center mt"><div class="muted">Alınacak tutar</div><div style="font-size:38px;font-weight:800" id="amt">${money(t.remain)}</div><div class="small faint">Kalan: ${money(t.remain)} · Toplam: ${money(t.total)}</div></div>
        </div><div class="col">
          ${Object.entries(PAY).map(([k, v]) => `<button class="btn lg ${k === 'nakit' ? 'ok' : k === 'kart' ? 'primary' : ''}" data-pt="${k}">${icon(k === 'nakit' ? 'cash' : k === 'kart' ? 'card' : 'wallet')} ${v}</button>`).join('')}
          ${c.payments.length ? `<div class="small muted mt">Önceki ödemeler:</div>${c.payments.map((p) => `<div class="row small"><span class="grow">${PAY[p.type] || p.type} · ${NS.time(p.at)}</span><b>${money(p.amount)}</b></div>`).join('')}` : ''}
        </div></div>`,
      onOpen: (b, close) => {
        let amount = t.remain, selItems = [];
        const setAmt = (v) => { amount = r2(Math.min(t.remain, Math.max(0, v))); $('#amt', b).textContent = money(amount); };
        const mode = (m) => {
          $$('[data-pm]', b).forEach((x) => x.classList.toggle('active', x.dataset.pm === m));
          selItems = [];
          const box = $('#pmb', b);
          if (m === 'all') { box.innerHTML = '<p class="muted">Kalan tutarın tamamı tahsil edilir.</p>'; setAmt(t.remain); }
          else if (m === 'split') { box.innerHTML = `<div class="field"><label>Kaç kişiye bölünsün?</label><div class="row nw">${[2, 3, 4, 5, 6].map((n) => `<button class="btn" data-sp="${n}">${n}</button>`).join('')}</div></div><p class="small muted mt">Kişi başı tutar tahsil edilir; kalan diğer ödemelerle alınır.</p>`; setAmt(r2(t.remain / (c.guests || 2))); }
          else if (m === 'items') { box.innerHTML = `<div class="col gap-s" style="max-height:260px;overflow:auto">${unpaid.map((i) => `<label class="check card pad" style="padding:8px 12px"><input type="checkbox" data-si="${i.id}"><span class="grow">${i.qty} × ${esc(i.name)}</span><b>${money(i.price * i.qty)}</b></label>`).join('') || '<div class="faint">Ödenmemiş ürün yok</div>'}</div>`; setAmt(0); }
          else box.innerHTML = `<div class="field"><label>Tutar (₺)</label><input class="input lg" type="number" step="0.01" id="ca" value="${t.remain}"></div>`, setAmt(t.remain);
        };
        on(b, 'click', '[data-pm]', (e, x) => mode(x.dataset.pm));
        on(b, 'click', '[data-sp]', (e, x) => setAmt(r2(t.total / Number(x.dataset.sp))));
        on(b, 'change', '[data-si]', () => { selItems = $$('[data-si]:checked', b).map((x) => x.dataset.si); setAmt(sum(unpaid.filter((i) => selItems.includes(i.id)), (i) => i.price * i.qty) * (t.total / (t.gross || 1))); });
        on(b, 'input', '#ca', (e) => setAmt(Number(e.target.value)));
        on(b, 'click', '[data-pt]', async (e, x) => {
          if (amount <= 0) return toast('Tutar seçin', 'err');
          let ref = null;
          if (x.dataset.pt === 'kart' && NS.integ) { const r = await NS.integ.cardPayment(amount); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); ref = r.ref; }
          if (x.dataset.pt === 'nakit' && NS.integ) NS.integ.openDrawer();
          let brand = null;
          if (x.dataset.pt === 'yemekkarti') {
            const provs = NS.integ ? NS.integ.CONN.yemekkarti[4] : { multinet: 'Multinet', pluxee: 'Pluxee (Sodexo)', edenred: 'Edenred (Ticket)', metropol: 'Metropol', setcard: 'Setcard' };
            const v = await formModal({ title: 'Yemek kartı', fields: [{ name: 'brand', label: 'Kart', type: 'select', options: Object.values(provs) }, { name: 'last4', label: 'Kart son 4 hane (isteğe bağlı)' }] }); if (!v) return;
            brand = v.brand;
            if (NS.integ && NS.integ.isOn('yemekkarti')) { const r = await NS.integ.call('yemekkarti', 'provizyon', { brand, amount, check: c.no, last4: v.last4 }); if (!r || !r.ok) return toast('Yemek kartı provizyonu alınamadı', 'err'); ref = r.ref; }
          }
          c.payments.push({ type: x.dataset.pt, amount, ref, brand, at: new Date().toISOString(), user: NS.currentUser && NS.currentUser.id });
          selItems.forEach((id) => { const it = c.items.find((i) => i.id === id); if (it) it.paid = true; });
          db.save(); close();
          if (totals(c).remain <= 0.01) closeCheck(c, app); else { toast(`${money(amount)} alındı, kalan ${money(totals(c).remain)}`, 'ok'); done(); }
        });
        mode('all');
      },
    });
  }
  function closeCheck(c, app) {
    const t = totals(c);
    c.status = 'closed'; c.closed = new Date().toISOString(); c.total = t.total;
    if (c.type === 'paket') c.pstatus = 'teslim';
    db.log('Adisyon kapandı', `${c.no} · ${tName(c)} · ${money(t.total)}`);
    db.save();
    // Yazarkasa POS (ÖKC) bağlıysa mali fiş cihazdan kesilir; platform siparişlerinde teslim bildirilir
    if (NS.integ && NS.integ.isOn('okc')) NS.integ.call('okc', 'mali-fis', { no: c.no, total: t.total, items: okcItems(c), payments: c.payments.map((p) => ({ type: p.type, amount: p.amount })) }, { silent: true }).then((r) => { if (!r) return; c.okc = r.ok && !r.simulated ? r.ref : r.simulated ? 'TEST' : 'hata'; db.save(); if (r.unverified) toast('ÖKC bağlantısı doğrulanmadığı için mali fiş kesilmedi — adisyon bilgi fişidir', 'warn'); });
    if (c.platformNo && NS.integ && NS.integ.isOn('yemekplatform')) NS.integ.call('yemekplatform', 'durum', { platform: c.source, orderNo: c.platformNo, status: 'teslim' }, { silent: true });
    NS.integ && NS.integ.emit('satis', { no: c.no, total: t.total, type: c.type });
    modal({ title: 'Hesap kapandı', body: `<div class="center"><div style="font-size:38px;font-weight:800">${money(t.total)}</div><div class="muted">${esc(tName(c))} · ${esc(c.no)}</div><div class="small faint mt">${c.payments.map((p) => `${PAY[p.type] || p.type}: ${money(p.amount)}`).join(' · ')}</div></div>`, actions: [{ label: 'Fiş yazdır', icon: 'print', onClick: (cl) => { printCheck(c, false); cl(); app.go(c.type === 'paket' ? 'paket' : 'masalar'); } }, { label: 'Tamam', cls: 'primary', onClick: (cl) => { cl(); app.go(c.type === 'paket' ? 'paket' : 'masalar'); } }] });
  }
  function printCheck(c, pre) {
    const s = S(), t = totals(c);
    const items = c.items.filter((i) => !i.cancel);
    (NS.integ ? NS.integ.printReceipt : NS.printHtml)(`<div class="c"><div class="big">${esc(s.bizName)}</div><div>${esc(s.bizAddress || '')}</div><div>${esc(s.bizPhone || '')}</div></div><hr>
      <div class="r"><span>${pre ? 'HESAP ÖN FİŞİ' : 'ADİSYON'}</span><span>${esc(c.no)}</span></div><div class="r"><span>${esc(tName(c))}</span><span>${NS.dt(new Date())}</span></div><div>Garson: ${esc(userName(c.waiter))} · ${c.guests || 1} kişi</div><hr>
      ${items.map((i) => `<div class="r"><span>${i.qty} x ${esc(i.name)}${i.comp ? ' (İKRAM)' : ''}</span><span>${money(i.comp ? 0 : i.price * i.qty)}</span></div>`).join('')}<hr>
      ${t.disc ? `<div class="r"><span>İndirim</span><span>-${money(t.disc)}</span></div>` : ''}${t.service ? `<div class="r"><span>Bahşiş (gönüllü)</span><span>${money(t.service)}</span></div>` : ''}
      <div class="r big"><span>TOPLAM</span><span>${money(t.total)}</span></div>${t.paid ? `<div class="r"><span>Ödenen</span><span>${money(t.paid)}</span></div><div class="r big"><span>KALAN</span><span>${money(t.remain)}</span></div>` : ''}
      <hr>${s.wifi ? `<div class="c">Wi-Fi şifresi: ${esc(s.wifi)}</div>` : ''}<div class="c">${esc(s.receiptFooter || '')}</div><div class="c">Mali değeri yoktur</div>`, { title: c.no });
  }

  // ---------- Mutfak ekranı (KDS) ----------
  let station = 'all';
  function kitchenPage(el, param, app) {
    const tickets = {};
    openChecks().forEach((c) => c.items.forEach((i) => {
      if (!['sent', 'prep', 'ready'].includes(i.status) || i.cancel) return;
      if (station !== 'all' && i.station !== station) return;
      const k = c.id + ':' + (i.batch || 'x');
      (tickets[k] = tickets[k] || { c, batch: i.batch, sentAt: i.sentAt, items: [] }).items.push(i);
    }));
    const list = Object.values(tickets).sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
    const colOf = (t) => (t.items.every((i) => i.status === 'ready') ? 'ready' : t.items.some((i) => i.status !== 'sent') ? 'prep' : 'new');
    const cols = [['new', 'Yeni siparişler', 'bell', '#d97706'], ['prep', 'Hazırlanıyor', 'chef', '#4f46e5'], ['ready', 'Hazır — servis bekliyor', 'check', '#16a34a']];
    el.innerHTML = pageHead('Mutfak Ekranı', 'Siparişler canlı düşer · ürüne tıklayarak durumunu değiştirin', `<div class="seg">${[['all', 'Tümü'], ['mutfak', 'Mutfak'], ['bar', 'Bar']].map(([v, l]) => `<button data-st="${v}" class="${station === v ? 'active' : ''}">${l}</button>`).join('')}</div><button class="btn" id="full">${icon('grid')} Tam ekran</button>`) +
      `<div class="kds">${cols.map(([k, label, ic, color]) => { const ts = list.filter((t) => colOf(t) === k); return `<div class="kcol"><h3 style="color:${color}">${icon(ic)} ${label} <span class="badge">${ts.length}</span></h3>${ts.map((t) => { const m = mins(t.sentAt); const late = m >= 15 && k !== 'ready'; return `<div class="ticket"><div class="th" style="background:${late ? 'var(--err)' : color}"><b class="grow">${esc(tName(t.c))}</b><span>${icon('clock')} ${m} dk</span></div>
        ${t.items.map((i) => `<div class="ti ${i.status === 'ready' ? 'done' : ''}" data-ti="${t.c.id}|${i.id}"><b style="min-width:22px">${i.qty}×</b><div class="grow">${esc(i.name)}${i.note ? `<div class="small" style="color:var(--warn)">${esc(i.note)}</div>` : ''}</div>${i.station === 'bar' ? badge('Bar', 'info') : ''}${i.status === 'prep' ? badge('Hazırlanıyor', 'acc') : ''}</div>`).join('')}
        <div class="tf">${k === 'new' ? `<button class="btn sm primary block" data-tk="${t.c.id}|${t.batch}|prep">${icon('chef')} Hazırlamaya başla</button>` : k === 'prep' ? `<button class="btn sm ok block" data-tk="${t.c.id}|${t.batch}|ready">${icon('check')} Tümü hazır</button>` : `<button class="btn sm block" data-tk="${t.c.id}|${t.batch}|served">${icon('check')} Servis edildi</button>`}</div></div>`; }).join('') || '<div class="empty small">Boş</div>'}</div>`; }).join('')}</div>`;
    on(el, 'click', '[data-st]', (e, t) => { station = t.dataset.st; app.refresh(); });
    on(el, 'click', '[data-ti]', (e, t) => {
      const [cid, iid] = t.dataset.ti.split('|'); const i = db.get('checks', cid).items.find((x) => x.id === iid);
      i.status = i.status === 'sent' ? 'prep' : i.status === 'prep' ? 'ready' : 'prep';
      if (i.status === 'ready') { i.readyAt = new Date().toISOString(); NS.beep(1400, 120); }
      db.save(); app.refresh();
    });
    on(el, 'click', '[data-tk]', (e, t) => {
      const [cid, batch, st] = t.dataset.tk.split('|'); const c = db.get('checks', cid);
      c.items.filter((i) => i.batch === batch && !i.cancel && (station === 'all' || i.station === station)).forEach((i) => { i.status = st; if (st === 'ready') i.readyAt = new Date().toISOString(); });
      if (st === 'ready') NS.beep(1400, 150);
      db.save(); app.refresh();
    });
    $('#full', el).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  }

  // ---------- Paket servis ----------
  async function newPackage(app, preset = {}) {
    const prev = {};
    db.all('checks', (c) => c.customer).forEach((c) => { prev[c.customer.phone] = c.customer; });
    const known = preset.phone && prev[preset.phone];
    const v = await formModal({
      title: preset.phone ? `Gelen çağrı: ${preset.phone}${known ? ' — ' + known.name : ' (yeni müşteri)'}` : 'Yeni Paket Sipariş', size: 'wide', values: { ...(known || {}), ...preset },
      fields: [{ name: 'phone', label: 'Telefon', required: true, type: 'tel', hint: 'Kayıtlı müşteri ise bilgiler otomatik dolar' }, { name: 'name', label: 'Müşteri adı', required: true }, { name: 'address', label: 'Adres', type: 'textarea', full: true, required: true }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Telefon', 'Yemeksepeti', 'Getir Yemek', 'Trendyol Yemek', 'Web sitesi', 'WhatsApp'] }, { name: 'pay', label: 'Ödeme', type: 'select', options: [{ value: 'nakit', label: 'Kapıda nakit' }, { value: 'kart', label: 'Kapıda kart' }, { value: 'online', label: 'Online ödendi' }] }, { name: 'note', label: 'Sipariş notu', full: true }],
      onOpen: (b) => { $('[name=phone]', b).addEventListener('input', (e) => { const p = prev[e.target.value.trim()]; if (p) { $('[name=name]', b).value = p.name; $('[name=address]', b).value = p.address; toast('Kayıtlı müşteri bulundu'); } }); },
    });
    if (!v) return;
    const c = newCheck({ type: 'paket', table: null, guests: 1, source: v.source, customer: { name: v.name, phone: v.phone, address: v.address }, pstatus: 'hazirlaniyor', payOnDelivery: v.pay, paidOnline: v.pay === 'online', note: v.note });
    app.go('siparis', c.id);
  }
  function packagePage(el, param, app) {
    const list = db.all('checks', (c) => c.type === 'paket').sort((a, b) => b.opened.localeCompare(a.opened));
    const open = list.filter((c) => c.status !== 'closed');
    const todayL = list.filter((c) => NS.iso(c.opened) === NS.today());
    const bySrc = NS.groupBy(list.filter((c) => c.closed && c.closed > addDays(new Date(), -30).toISOString()), (c) => c.source || 'Diğer');
    el.innerHTML = pageHead('Paket Servis', 'Telefon ve platform siparişleri, kurye takibi', `<button class="btn" id="cid">${icon('phone')} Gelen çağrı</button><button class="btn" id="pf">${icon('download')} Platform siparişlerini al</button><button class="btn" id="ms">${icon('refresh')} Menü senkronu</button><button class="btn primary" id="np">${icon('plus')} Yeni paket sipariş</button>`) + `
      <div class="grid g4 mb">${kpi('Hazırlanıyor', open.filter((c) => c.pstatus === 'hazirlaniyor').length, 'chef', 'warn')}${kpi('Yolda', open.filter((c) => c.pstatus === 'yolda').length, 'truck', 'info')}${kpi('Bugün paket', todayL.length, 'bag')}${kpi('Bugün paket ciro', money(sum(todayL, (c) => totals(c).total)), 'trend', 'ok')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Aktif siparişler</h3></div>${table({
        rows: open, empty: 'Aktif paket sipariş yok', emptyIcon: 'truck',
        columns: [{ label: 'Sipariş', render: (c) => `<b>${esc(c.customer.name)}</b><div class="small faint">${esc(c.no)} · ${esc(c.source || '')} · ${mins(c.opened)} dk</div>` }, { label: 'Adres', render: (c) => `<span class="small">${esc(c.customer.address)}</span><div class="small faint">${esc(c.customer.phone)}</div>` }, { label: 'Kurye', render: (c) => esc((db.get('couriers', c.courier) || {}).name || '-') }, { label: 'Durum', render: (c) => badge(PST[c.pstatus][0], PST[c.pstatus][1]) }, { label: 'Tutar', cls: 'right', render: (c) => `<b>${money(totals(c).total)}</b><div class="small faint">${c.paidOnline ? 'Online ödendi' : PAY[c.payOnDelivery] || ''}</div>` }],
        actions: [{ icon: 'edit', act: 'open', title: 'Siparişi aç' }, { label: 'Yola çıkar', act: 'road', show: (c) => c.pstatus === 'hazirlaniyor' }, { label: 'Teslim et', act: 'done', show: (c) => c.pstatus === 'yolda' }],
      })}</div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Platform dağılımı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(bySrc).map(([k, v]) => ({ label: k, value: sum(v, (c) => c.total) })), { format: money, size: 140 })}</div></div>
      <div class="card"><div class="card-h"><h3>Kuryeler</h3><button class="btn sm" id="ac">${icon('plus')}</button></div><div class="card-b">${db.all('couriers').map((k) => `<div class="list-item"><div class="avatar">${esc(NS.initials(k.name))}</div><div class="grow"><b>${esc(k.name)}</b><div class="small faint">${esc(k.phone)}</div></div>${badge(open.filter((c) => c.courier === k.id && c.pstatus === 'yolda').length ? 'Dağıtımda' : 'Müsait', open.filter((c) => c.courier === k.id && c.pstatus === 'yolda').length ? 'info' : 'ok')}</div>`).join('')}</div></div></div></div>`;
    $('#np', el).onclick = () => newPackage(app);
    // Arayan numara tanıma: santral / Cidshow cihazından son çağrı alınır, kayıtlı müşteri otomatik dolar
    $('#cid', el).onclick = async () => { let phone = ''; if (NS.integ && NS.integ.isOn('callerid')) { const r = await NS.integ.call('callerid', 'son-arama', {}, { silent: true }); phone = r && r.data && r.data.phone ? r.data.phone : r && r.simulated ? (db.all('checks', (c) => c.customer).map((c) => c.customer.phone)[0] || '05321112233') : ''; } if (!phone) phone = await NS.prompt('Arayan numara', '05', { title: 'Gelen çağrı', type: 'tel' }); if (phone) newPackage(app, { phone }); };
    // Yemeksepeti / Getir / Trendyol siparişleri: bağlayıcıdan çekilir, adisyon ve mutfağa düşer
    $('#pf', el).onclick = async () => {
      // Canlı: platformların webhook ile gönderdiği siparişler (server.js gelen kutusu)
      let orders = [];
      if (NS.inbox && (await NS.inbox.online())) {
        const KEYS = { yemeksepeti: 'Yemeksepeti', getir: 'Getir Yemek', trendyolyemek: 'Trendyol Yemek', migrosyemek: 'Migros Yemek' };
        const low = (x) => String(x || '').toLocaleLowerCase('tr').trim();
        for (const [k, name] of Object.entries(KEYS)) { const got = (await NS.inbox.drain(k)) || []; got.forEach((o) => orders.push({ platform: name, orderNo: o.orderNo, customer: o.customer, paid: o.paid, note: o.note, items: o.items.map((it) => { const m = db.find('menu', (x) => x.id === it.code || (x.platformCodes || []).includes(it.code) || low(x.name) === low(it.name)); return m ? { id: m.id, qty: it.qty } : null; }).filter(Boolean), unmatched: o.items.filter((it) => !db.find('menu', (x) => x.id === it.code || low(x.name) === low(it.name))).map((it) => `${it.qty}× ${it.name || it.code}`) })); }
      }
      const r = orders.length ? { ok: true, data: { orders } } : NS.integ ? await NS.integ.call('yemekplatform', 'siparis-cek', { since: S().platformPull || '' }) : null; if (!r || !r.ok) return;
      if (!orders.length) orders = r.data && Array.isArray(r.data.orders) ? r.data.orders : [];
      if (r.simulated) { const menu = db.all('menu', (m) => m.active !== false); const openP = Object.keys(PH.PL).filter((n) => ((db.data.platforms || {})[n] || {}).connected && db.data.platforms[n].open); if (!openP.length) { toast('Açık platform yok — Yemek Platformları sayfasından açın', 'err'); return; } orders = [{ platform: NS.pick(openP), orderNo: String(NS.rand(10000000, 99999999)), customer: { name: NS.pick(['Ayşe K.', 'Mehmet D.', 'Zeynep A.', 'Can T.']), phone: NS.phone(), address: NS.pick(['Moda Cad. No:12 D:4 Kadıköy', 'Bağdat Cad. 210/7 Maltepe', 'Halitağa Cad. 33 Kadıköy']) }, paid: true, note: NS.pick(['', 'Zile basmayın', 'Bol sos']), items: [NS.pick(menu), NS.pick(menu)].map((m) => ({ id: m.id, qty: NS.rand(1, 2) })) }]; }
      let n = 0;
      orders.forEach((o) => { if (db.find('checks', (c) => c.platformNo === o.orderNo)) return; const c = newCheck({ type: 'paket', table: null, guests: 1, source: o.platform, platformNo: o.orderNo, customer: o.customer, pstatus: 'hazirlaniyor', payOnDelivery: o.paid ? 'online' : 'nakit', paidOnline: !!o.paid, note: [o.note, o.unmatched && o.unmatched.length ? 'MENÜDE EŞLEŞMEYEN: ' + o.unmatched.join(', ') : ''].filter(Boolean).join(' · ') }); o.items.forEach((it) => { const m = M(it.id); if (!m) return; c.items.push({ id: uid(), pid: m.id, name: m.name, price: m.price, qty: it.qty, note: '', status: 'new', station: m.station }); }); sendKitchen(c, () => {}); n++; if (S().autoAccept !== false && NS.integ) NS.integ.call('yemekplatform', 'durum', { platform: o.platform, orderNo: o.orderNo, status: 'onaylandi' }, { silent: true }); });
      db.saveSettings({ platformPull: new Date().toISOString() }); db.save(); if (n) NS.beep(1200, 200); toast(`${n} platform siparişi alındı ve mutfağa düştü`, n ? 'ok' : ''); app.refresh();
    };
    $('#ms', el).onclick = () => NS.integ && NS.integ.call('yemekplatform', 'menu-senkron', { items: db.all('menu').map((m) => ({ id: m.id, name: m.name, price: m.price, active: m.active !== false })) });
    $('#ac', el).onclick = async () => { const v = await formModal({ title: 'Kurye', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'phone', label: 'Telefon' }] }); if (v) { db.insert('couriers', v); app.refresh(); } };
    on(el, 'click', '[data-act]', async (e, t) => {
      const c = db.get('checks', t.dataset.id);
      if (t.dataset.act === 'open') app.go('siparis', c.id);
      else if (t.dataset.act === 'road') {
        const v = await formModal({ title: 'Kurye ata', fields: [{ name: 'courier', label: 'Kurye', type: 'select', options: db.all('couriers').map((k) => ({ value: k.id, label: k.name })) }] });
        if (v) { c.courier = v.courier; c.pstatus = 'yolda'; c.items.forEach((i) => { if (!i.cancel) i.status = 'served'; }); db.save(); if (c.platformNo && NS.integ && NS.integ.isOn('yemekplatform')) NS.integ.call('yemekplatform', 'durum', { platform: c.source, orderNo: c.platformNo, status: 'yolda' }, { silent: true }); app.refresh(); }
      } else if (t.dataset.act === 'done') {
        if (!c.paidOnline) c.payments.push({ type: c.payOnDelivery || 'nakit', amount: totals(c).remain, at: new Date().toISOString() });
        else c.payments.push({ type: 'online', amount: totals(c).remain, at: new Date().toISOString() });
        c.status = 'closed'; c.closed = new Date().toISOString(); c.total = totals(c).total; c.pstatus = 'teslim';
        db.log('Paket teslim', `${c.no} · ${c.customer.name}`); db.save();
        if (c.platformNo && NS.integ && NS.integ.isOn('yemekplatform')) NS.integ.call('yemekplatform', 'durum', { platform: c.source, orderNo: c.platformNo, status: 'teslim' }, { silent: true });
        if (NS.integ && NS.integ.isOn('okc')) NS.integ.call('okc', 'mali-fis', { no: c.no, total: c.total, items: okcItems(c), payments: c.payments.map((p) => ({ type: p.type, amount: p.amount })) }, { silent: true });
        toast('Sipariş teslim edildi', 'ok'); app.refresh();
      }
    });
  }

  // ---------- Rezervasyon ----------
  function reservationsPage(el, param, app) {
    let day = NS.today();
    const draw = () => {
      const list = db.all('reservations', (r) => r.date === day).sort((a, b) => a.time.localeCompare(b.time));
      const st = { bekliyor: ['Bekliyor', 'info'], geldi: ['Geldi', 'ok'], gelmedi: ['Gelmedi', 'err'], iptal: ['İptal', ''] };
      el.innerHTML = pageHead('Rezervasyonlar', 'Masa rezervasyonları ve misafir takibi', `<button class="btn primary" id="nr">${icon('plus')} Yeni rezervasyon</button>`) + `
        <div class="row mb"><button class="btn icon" data-dd="-1">${icon('left')}</button><input type="date" class="input" id="dd" value="${day}" style="max-width:180px"><button class="btn icon" data-dd="1">${icon('right')}</button><button class="btn" data-dd="0">Bugün</button><span class="muted">${NS.dateLong(day)} · ${list.length} rezervasyon · ${sum(list.filter((r) => r.status !== 'iptal'), (r) => r.guests)} kişi</span></div>
        <div class="card">${table({
          rows: list, empty: 'Bu tarihte rezervasyon yok', emptyIcon: 'calendar',
          columns: [{ label: 'Saat', render: (r) => `<b style="font-size:16px">${esc(r.time)}</b>` }, { label: 'Misafir', render: (r) => `<b>${esc(r.name)}</b><div class="small faint">${esc(r.phone)}</div>` }, { label: 'Kişi', cls: 'right', render: (r) => r.guests }, { label: 'Masa', render: (r) => esc((T(r.table) || {}).name || '-') }, { label: 'Not', render: (r) => `<span class="small">${esc(r.note || '')}</span>` }, { label: 'Durum', render: (r) => badge(st[r.status][0], st[r.status][1]) }],
          actions: [{ label: 'Geldi', act: 'came', show: (r) => r.status === 'bekliyor' }, { label: 'Gelmedi', act: 'no', show: (r) => r.status === 'bekliyor' }, { icon: 'edit', act: 'edit' }, { icon: 'trash', act: 'del' }],
        })}</div>`;
      $('#dd', el).onchange = (e) => { day = e.target.value; draw(); };
      $('#nr', el).onclick = () => edit(null);
    };
    on(el, 'click', '[data-dd]', (e, t) => { const n = Number(t.dataset.dd); day = n === 0 ? NS.today() : NS.iso(addDays(day, n)); draw(); });
    const fields = () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'time', label: 'Saat', type: 'time', required: true }, { name: 'guests', label: 'Kişi sayısı', type: 'number' }, { name: 'table', label: 'Masa', type: 'select', empty: 'Seçilmedi', options: db.all('tables').map((t) => ({ value: t.id, label: `${t.name} (${t.seats} kişilik)` })) }, { name: 'note', label: 'Not', full: true }];
    const edit = async (r) => { const v = await formModal({ title: r ? 'Rezervasyon' : 'Yeni rezervasyon', fields: fields(), values: r || { date: day, time: '20:00', guests: 2 } }); if (!v) return; if (r) db.update('reservations', r.id, v); else db.insert('reservations', { ...v, status: 'bekliyor' }); day = v.date; draw(); toast('Kaydedildi', 'ok'); };
    on(el, 'click', '[data-act]', async (e, t) => {
      const r = db.get('reservations', t.dataset.id); const a = t.dataset.act;
      if (a === 'edit') edit(r);
      else if (a === 'del') { if (await confirm('Rezervasyon silinsin mi?')) { db.remove('reservations', r.id); draw(); } }
      else if (a === 'no') { r.status = 'gelmedi'; db.save(); draw(); }
      else if (a === 'came') {
        r.status = 'geldi'; db.save();
        if (r.table && !checkOf(r.table)) { const c = newCheck({ type: 'masa', table: r.table, guests: r.guests, note: r.note }); app.go('siparis', c.id); } else draw();
      }
    });
    draw();
  }

  // ---------- Geçmiş adisyonlar ----------
  function historyPage(el) {
    let q = '', range = '1';
    el.innerHTML = pageHead('Adisyonlar', 'Kapanan hesaplar, iptaller ve ikramlar') + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Adisyon no, masa, garson...')}<div class="seg">${[['1', 'Bugün'], ['7', '7 gün'], ['30', '30 gün']].map(([v, l]) => `<button data-r="${v}" class="${v === range ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="tbl"></div></div>`;
    const draw = () => {
      const since = NS.iso(addDays(new Date(), -(Number(range) - 1)));
      const rows = db.all('checks', (c) => c.status === 'closed' && NS.iso(c.closed) >= since && NS.match(q, c.no, tName(c), userName(c.waiter))).sort((a, b) => b.closed.localeCompare(a.closed));
      $('#tbl', el).innerHTML = table({
        rows: rows.slice(0, 300), emptyIcon: 'receipt',
        columns: [{ label: 'No', render: (c) => `<b>${esc(c.no)}</b>` }, { label: 'Masa', render: (c) => esc(tName(c)) }, { label: 'Garson', render: (c) => esc(userName(c.waiter)) }, { label: 'Açılış', render: (c) => NS.dt(c.opened) }, { label: 'Süre', render: (c) => Math.round((new Date(c.closed) - new Date(c.opened)) / 60000) + ' dk' }, { label: 'Ödeme', render: (c) => c.payments.map((p) => badge(PAY[p.type] || p.type, p.type === 'nakit' ? 'ok' : 'info')).join(' ') }, { label: 'İptal/İkram', render: (c) => `${c.items.some((i) => i.cancel) ? badge('İptal', 'err') : ''} ${c.items.some((i) => i.comp) ? badge('İkram', 'ok') : ''}` }, { label: 'Tutar', cls: 'right', render: (c) => `<b>${money(c.total)}</b>` }],
        actions: [{ icon: 'eye', act: 'v' }, { icon: 'print', act: 'p' }],
        foot: `${rows.length} adisyon · Toplam ${money(sum(rows, (c) => c.total))} · Ortalama ${money(rows.length ? sum(rows, (c) => c.total) / rows.length : 0)}`,
      });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-r]', (e, t) => { range = t.dataset.r; $$('[data-r]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    on(el, 'click', '[data-act]', (e, t) => {
      const c = db.get('checks', t.dataset.id);
      if (t.dataset.act === 'p') return printCheck(c, false);
      modal({ title: `${c.no} · ${tName(c)}`, size: 'wide', body: table({ rows: c.items, columns: [{ label: 'Ürün', render: (i) => `${esc(i.name)} ${i.comp ? badge('İkram', 'ok') : ''}${i.cancel ? badge('İptal: ' + (i.cancelReason || ''), 'err') : ''}` }, { label: 'Adet', cls: 'right', render: (i) => i.qty }, { label: 'Fiyat', cls: 'right', render: (i) => money(i.price) }, { label: 'Tutar', cls: 'right', render: (i) => `<b>${money(i.comp || i.cancel ? 0 : i.price * i.qty)}</b>` }] }) + `<div class="right big mt">${money(c.total)}</div>` });
    });
    draw();
  }

  // ---------- Menü ----------
  function menuPage(el, param, app) {
    let cf = '';
    const fields = () => [{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'cat', label: 'Kategori', type: 'select', options: db.all('mcats').map((k) => ({ value: k.id, label: k.name })) }, { name: 'price', label: 'Fiyat (₺)', type: 'number', step: '0.01', required: true }, { name: 'vat', label: 'KDV % (boşsa 10 — oranı mali müşavirinize doğrulatın)', type: 'number', placeholder: '10' }, { name: 'station', label: 'Hazırlayan', type: 'select', options: [{ value: 'mutfak', label: 'Mutfak' }, { value: 'bar', label: 'Bar' }] }, { name: 'prepMin', label: 'Hazırlık süresi (dk)', type: 'number' }, { name: 'desc', label: 'Açıklama (QR menüde görünür)', type: 'textarea', full: true }, { name: 'active', label: 'Satışta (tükendiyse kapatın)', type: 'checkbox' }];
    const cost = (m) => sum(m.recipe || [], (r) => (db.get('ingredients', r.iid) || {}).cost * r.qty || 0);
    const draw = () => {
      el.innerHTML = pageHead('Menü', 'Ürünler, fiyatlar, reçeteler ve maliyet', `<button class="btn" id="cats">${icon('grid')} Kategoriler</button><button class="btn" id="bulk">${icon('percent')} Toplu fiyat</button><button class="btn primary" id="add">${icon('plus')} Yeni ürün</button>`) + `
        <div class="row mb"><div class="seg">${[{ id: '', name: 'Tümü' }, ...db.all('mcats')].map((k) => `<button data-cf="${k.id}" class="${cf === k.id ? 'active' : ''}">${esc(k.name)}</button>`).join('')}</div></div>
        <div class="card">${table({
          rows: db.all('menu', (m) => !cf || m.cat === cf),
          columns: [{ label: 'Ürün', render: (m) => `<b>${esc(m.name)}</b><div class="small faint">${esc((db.get('mcats', m.cat) || {}).name || '')} · ${m.station === 'bar' ? 'Bar' : 'Mutfak'}</div>` }, { label: 'Fiyat', cls: 'right', render: (m) => `<b>${money(m.price)}</b>` }, { label: 'Reçete maliyeti', cls: 'right', render: (m) => (m.recipe && m.recipe.length ? money(cost(m)) : '<span class="faint">-</span>') }, { label: 'Maliyet %', cls: 'right', render: (m) => { if (!m.recipe || !m.recipe.length) return '-'; const p = (cost(m) / m.price) * 100; return badge('%' + p.toFixed(0), p > 35 ? 'err' : p > 25 ? 'warn' : 'ok'); } }, { label: 'Durum', render: (m) => (m.active ? badge('Satışta', 'ok') : badge('Tükendi', 'err')) }],
          actions: [{ icon: 'layers', act: 'recipe', title: 'Reçete' }, { icon: 'zap', act: 'toggle', title: 'Tükendi / satışta' }, { icon: 'edit', act: 'edit' }, { icon: 'trash', act: 'del' }],
        })}</div>`;
      $('#add', el).onclick = async () => { const v = await formModal({ title: 'Yeni ürün', fields: fields(), values: { active: true, station: 'mutfak', cat: cf || (db.all('mcats')[0] || {}).id, prepMin: 10 }, size: 'wide' }); if (v) { db.insert('menu', { ...v, recipe: [] }); draw(); } };
      $('#cats', el).onclick = () => catModal(draw);
      $('#bulk', el).onclick = async () => { const v = await formModal({ title: 'Toplu fiyat', fields: [{ name: 'cat', label: 'Kategori', type: 'select', empty: 'Tüm menü', options: db.all('mcats').map((k) => ({ value: k.id, label: k.name })) }, { name: 'pct', label: 'Değişim %', type: 'number', required: true }, { name: 'round', label: '5 ₺ katlarına yuvarla', type: 'checkbox', value: true }] }); if (v) { db.all('menu', (m) => !v.cat || m.cat === v.cat).forEach((m) => { let p = m.price * (1 + v.pct / 100); if (v.round) p = Math.round(p / 5) * 5; m.price = p; }); db.save(); toast('Fiyatlar güncellendi', 'ok'); draw(); } };
    };
    on(el, 'click', '[data-cf]', (e, t) => { cf = t.dataset.cf; draw(); });
    on(el, 'click', '[data-act]', async (e, t) => {
      const m = M(t.dataset.id); const a = t.dataset.act;
      if (a === 'edit') { const v = await formModal({ title: m.name, fields: fields(), values: m, size: 'wide' }); if (v) { db.update('menu', m.id, v); draw(); } }
      else if (a === 'del') { if (await confirm(`${m.name} silinsin mi?`)) { db.remove('menu', m.id); draw(); } }
      else if (a === 'toggle') { m.active = !m.active; db.save(); toast(m.active ? 'Satışa açıldı' : 'Tükendi olarak işaretlendi'); draw(); }
      else if (a === 'recipe') recipeModal(m, draw);
    });
    draw();
  }
  function recipeModal(m, done) {
    const rec = (m.recipe || []).map((r) => ({ ...r }));
    modal({
      title: `Reçete — ${m.name}`, size: 'wide',
      body: '<p class="muted small mb">Ürün mutfağa gönderildiğinde bu malzemeler stoktan otomatik düşer.</p><div id="rl"></div><button class="btn mt" id="ra">' + icon('plus') + ' Malzeme ekle</button><div class="right big mt" id="rc"></div>',
      onOpen: (b) => {
        const draw = () => {
          $('#rl', b).innerHTML = rec.map((r, k) => `<div class="row nw mb"><select class="input" data-rk="${k}" data-f="iid">${db.all('ingredients').map((i) => `<option value="${i.id}" ${i.id === r.iid ? 'selected' : ''}>${esc(i.name)} (${i.unit})</option>`).join('')}</select><input class="input" style="max-width:120px" type="number" step="0.001" data-rk="${k}" data-f="qty" value="${r.qty}"><button class="btn icon ghost" data-rx="${k}">${icon('x')}</button></div>`).join('') || '<div class="faint">Malzeme yok</div>';
          $('#rc', b).textContent = 'Maliyet: ' + money(sum(rec, (r) => ((db.get('ingredients', r.iid) || {}).cost || 0) * r.qty)) + ' / Satış: ' + money(m.price);
        };
        on(b, 'change', '[data-rk]', (e, t) => { rec[t.dataset.rk][t.dataset.f] = t.dataset.f === 'qty' ? Number(t.value) : t.value; draw(); });
        on(b, 'click', '[data-rx]', (e, t) => { rec.splice(t.dataset.rx, 1); draw(); });
        $('#ra', b).onclick = () => { if (!db.all('ingredients').length) return toast('Önce Malzeme Stoku ekranından malzeme ekleyin', 'err'); rec.push({ iid: db.all('ingredients')[0].id, qty: 0.1 }); draw(); };
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', onClick: (c) => { m.recipe = rec; db.save(); c(); done(); toast('Reçete kaydedildi', 'ok'); } }],
    });
  }
  function catModal(done) {
    modal({
      title: 'Menü kategorileri',
      body: `<div id="kl"></div><div class="row mt"><input class="input grow" id="kn" placeholder="Yeni kategori"><input type="color" id="kc" value="#4f46e5" style="width:44px;height:38px;border:0;background:none"><button class="btn primary" id="ka">${icon('plus')}</button></div>`,
      onOpen: (b) => {
        const draw = () => { $('#kl', b).innerHTML = db.all('mcats').map((k) => `<div class="list-item"><span class="dot" style="background:${k.color};width:12px;height:12px"></span><span class="grow">${esc(k.name)}</span><span class="small faint">${db.all('menu', (m) => m.cat === k.id).length} ürün</span><button class="btn sm ghost icon" data-kd="${k.id}">${icon('trash')}</button></div>`).join(''); };
        $('#ka', b).onclick = () => { const n = $('#kn', b).value.trim(); if (!n) return; db.insert('mcats', { name: n, color: $('#kc', b).value }); $('#kn', b).value = ''; draw(); };
        on(b, 'click', '[data-kd]', (e, t) => { if (db.all('menu', (m) => m.cat === t.dataset.kd).length) return toast('Kategoride ürün var', 'err'); db.remove('mcats', t.dataset.kd); draw(); });
        draw();
      },
      onClose: done,
    });
  }

  // ---------- Malzeme stoku ----------
  function stockPage(el, param, app) {
    NS.crud(el, app, {
      col: 'ingredients', title: 'Malzeme Stoku', sub: 'Reçeteye bağlı malzemeler sipariş gönderildikçe otomatik düşer', single: 'Malzeme', addLabel: 'Yeni malzeme', emptyIcon: 'box',
      fields: [{ name: 'name', label: 'Malzeme', required: true }, { name: 'unit', label: 'Birim', type: 'select', options: ['kg', 'L', 'adet', 'paket'] }, { name: 'stock', label: 'Stok', type: 'number', step: '0.001' }, { name: 'min', label: 'Kritik seviye', type: 'number', step: '0.001' }, { name: 'cost', label: 'Birim maliyet (₺)', type: 'number', step: '0.01' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'low', label: 'Kritik', test: (i) => i.stock <= i.min }],
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      columns: [{ key: 'name', label: 'Malzeme', render: (i) => `<b>${esc(i.name)}</b>` }, { key: 'stock', label: 'Stok', cls: 'right', render: (i) => (i.stock <= i.min ? badge(num(i.stock) + ' ' + i.unit, 'err') : num(i.stock) + ' ' + i.unit) }, { key: 'min', label: 'Kritik', cls: 'right', render: (i) => num(i.min) + ' ' + i.unit }, { key: 'cost', label: 'Birim maliyet', cls: 'right', render: (i) => money(i.cost) }, { label: 'Stok değeri', cls: 'right', render: (i) => money(Math.max(0, i.stock) * i.cost) }, { label: 'Kullanıldığı ürün', cls: 'right', render: (i) => db.all('menu', (m) => (m.recipe || []).some((r) => r.iid === i.id)).length }],
      extraActions: [{ icon: 'plus', act: 'in', title: 'Stok girişi' }],
      onAction: async (a, i, draw) => { const v = await formModal({ title: `Stok girişi — ${i.name}`, fields: [{ name: 'qty', label: `Miktar (${i.unit})`, type: 'number', step: '0.001', required: true }, { name: 'cost', label: 'Birim maliyet', type: 'number', step: '0.01', value: i.cost }] }); if (v) { i.stock = r2(i.stock + v.qty); if (v.cost) i.cost = v.cost; db.log('Malzeme girişi', `${i.name} +${v.qty}`); db.save(); draw(); } },
    });
  }

  // ---------- QR menü ----------
  function qrPage(el, param, app) {
    const base = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '');
    el.innerHTML = pageHead('QR Menü', 'Müşteriler masadaki QR kodu okutarak menüyü görür, sipariş verir, garson çağırır', `<a class="btn primary" href="qr.html?masa=${(db.all('tables')[0] || {}).id || ''}&k=${db.all('tables')[0] ? qrKey(db.all('tables')[0]) : ''}" target="_blank">${icon('eye')} QR menüyü önizle</a><button class="btn" id="pa">${icon('print')} Tüm QR kodları yazdır</button>`) + `
      <div class="grid g-21 mb"><div class="card pad"><h3 class="mb">Nasıl çalışır?</h3><div class="col small muted"><div>1. Her masaya o masaya özel QR kodu yapıştırın.</div><div>2. Müşteri telefon kamerasıyla okutur, menü açılır (uygulama gerekmez).</div><div>3. Sipariş verirse adisyona <b>QR</b> etiketiyle düşer; garson onaylayıp mutfağa gönderir.</div><div>4. "Garson çağır" ve "Hesap iste" bildirimleri masalar ekranında görünür.</div></div>
        <label class="check mt"><input type="checkbox" id="qo" ${S().qrOrder ? 'checked' : ''}> QR menüden sipariş verilebilsin</label></div>
        <div class="card pad"><h3 class="mb">Bekleyen çağrılar</h3>${db.all('calls', (c) => !c.done).map((c) => `<div class="list-item">${icon('bell')}<span class="grow"><b>${esc((T(c.table) || {}).name)}</b> · ${c.type === 'hesap' ? 'Hesap istiyor' : 'Garson çağırıyor'}</span><span class="small faint">${NS.ago(c.at)}</span></div>`).join('') || '<div class="faint small">Çağrı yok</div>'}</div></div>
      <div class="grid g-auto">${db.all('tables').map((t) => `<div class="card pad center"><div style="display:inline-block">${NS.qrSvg(base + 'qr.html?masa=' + t.id + '&k=' + qrKey(t), 120)}</div><b style="display:block">${esc(t.name)}</b><a class="small" href="qr.html?masa=${t.id}&k=${qrKey(t)}" target="_blank">Menüyü aç →</a></div>`).join('')}</div>`;
    $('#qo', el).onchange = (e) => db.saveSettings({ qrOrder: e.target.checked });
    $('#pa', el).onclick = () => NS.printHtml(`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font-family:Arial">${db.all('tables').map((t) => `<div style="border:1px dashed #999;padding:12px;text-align:center">${NS.qrSvg(base + 'qr.html?masa=' + t.id + '&k=' + qrKey(t), 150)}<h2>${esc(t.name)}</h2><div>Menü ve sipariş için okutun</div><div style="font-size:11px">${esc(S().bizName)}</div></div>`).join('')}</div>`, { title: 'QR kodlar' });
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    let days = 30;
    el.innerHTML = pageHead('Raporlar', 'Ciro, ürün, garson ve saat analizleri', `<div class="seg">${[7, 30].map((d) => `<button data-d="${d}" class="${d === days ? 'active' : ''}">${d} gün</button>`).join('')}</div>`) + '<div id="rb"></div>';
    const draw = () => {
      const since = addDays(new Date(), -days).toISOString();
      const cs = db.all('checks', (c) => c.status === 'closed' && c.closed > since);
      const revenue = sum(cs, (c) => c.total);
      const items = cs.flatMap((c) => c.items.filter((i) => !i.cancel));
      const byItem = {}, byCat = {}, byWaiter = {};
      items.forEach((i) => { byItem[i.name] = byItem[i.name] || { n: 0, t: 0 }; byItem[i.name].n += i.qty; byItem[i.name].t += i.comp ? 0 : i.qty * i.price; const k = (db.get('mcats', (M(i.pid) || {}).cat) || {}).name || 'Diğer'; byCat[k] = (byCat[k] || 0) + (i.comp ? 0 : i.qty * i.price); });
      cs.forEach((c) => { const w = userName(c.waiter); byWaiter[w] = byWaiter[w] || { n: 0, t: 0, g: 0 }; byWaiter[w].n++; byWaiter[w].t += c.total; byWaiter[w].g += c.guests || 0; });
      const ser = NS.dailySeries(cs, days, 'closed', (c) => c.total);
      const hours = Array.from({ length: 15 }, (_, i) => i + 9).map((h) => ({ label: String(h), value: cs.filter((c) => new Date(c.opened).getHours() === h).length }));
      const payT = {}; cs.forEach((c) => c.payments.forEach((p) => { payT[PAY[p.type] || p.type] = (payT[PAY[p.type] || p.type] || 0) + p.amount; }));
      const cancels = cs.flatMap((c) => c.items.filter((i) => i.cancel || i.comp).map((i) => ({ ...i, c })));
      const avgMin = cs.filter((c) => c.type === 'masa').length ? sum(cs.filter((c) => c.type === 'masa'), (c) => (new Date(c.closed) - new Date(c.opened)) / 60000) / cs.filter((c) => c.type === 'masa').length : 0;
      $('#rb', el).innerHTML = `<div class="grid g4 mb">${kpi('Ciro', money(revenue), 'trend', 'ok')}${kpi('Adisyon', num(cs.length), 'receipt', 'info')}${kpi('Ortalama hesap', money(cs.length ? revenue / cs.length : 0), 'wallet')}${kpi('Ort. masa süresi', Math.round(avgMin) + ' dk', 'clock', 'warn')}</div>
        <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük ciro</h3></div><div class="card-b">${chart.line([{ name: 'Ciro', values: ser.values }], ser.labels, { format: money })}</div></div><div class="card"><div class="card-h"><h3>Kategori payı</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })), { format: money, size: 140 })}</div></div></div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Saatlere göre yoğunluk (adisyon)</h3></div><div class="card-b">${chart.bars(hours)}</div></div><div class="card"><div class="card-h"><h3>Ödeme türleri</h3></div><div class="card-b">${chart.donut(Object.entries(payT).map(([label, value]) => ({ label, value })), { format: money, size: 140 })}</div></div></div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>En çok satan ürünler</h3></div>${table({ rows: Object.entries(byItem).sort((a, b) => b[1].t - a[1].t).slice(0, 15).map(([n, v]) => ({ id: n, n, ...v })), columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.n)}</b>` }, { label: 'Adet', cls: 'right', render: (r) => num(r.n) }, { label: 'Ciro', cls: 'right', render: (r) => money(r.t) }] })}</div>
        <div class="card"><div class="card-h"><h3>Garson performansı</h3></div>${table({ rows: Object.entries(byWaiter).map(([n, v]) => ({ id: n, n, ...v })).sort((a, b) => b.t - a.t), columns: [{ label: 'Garson', render: (r) => `<b>${esc(r.n)}</b>` }, { label: 'Adisyon', cls: 'right', render: (r) => r.n }, { label: 'Misafir', cls: 'right', render: (r) => r.g }, { label: 'Ciro', cls: 'right', render: (r) => money(r.t) }, { label: 'Kişi başı', cls: 'right', render: (r) => money(r.g ? r.t / r.g : 0) }] })}</div></div>
        <div class="card"><div class="card-h"><h3>İptal ve ikramlar</h3><span class="small muted">${cancels.length} kalem · ${money(sum(cancels, (i) => i.qty * i.price))}</span></div>${table({ rows: cancels, empty: 'Bu dönemde iptal / ikram yok', columns: [{ label: 'Tarih', render: (i) => NS.dt(i.c.closed) }, { label: 'Masa', render: (i) => esc(tName(i.c)) }, { label: 'Ürün', render: (i) => `${esc(i.name)} ${i.cancel ? badge('İptal', 'err') : badge('İkram', 'info')}` }, { label: 'Neden', render: (i) => esc(i.cancel ? i.cancelReason || '-' : '-') }, { label: 'Garson / onaylayan', render: (i) => `${esc((db.get('users', i.by) || {}).name || '-')}${i.cancelBy || i.compBy ? ` · <b>${esc(i.cancelBy || i.compBy)}</b>` : ''}` }, { label: 'Tutar', cls: 'right', render: (i) => money(i.qty * i.price) }] })}</div>`;
    };
    on(el, 'click', '[data-d]', (e, t) => { days = Number(t.dataset.d); $$('[data-d]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    draw();
  }

  // ---------- Uygulama ----------
  const ROLES = { admin: 'Yönetici', garson: 'Garson', kasa: 'Kasiyer', mutfak: 'Mutfak' };
  const app = NS.shell({
    id: 'adisyon', integrations: ['printer', 'pos', 'efatura', 'barcode', 'sms', 'whatsapp', 'email', 'payment', 'webhook', 'backup'], name: 'Adisyon', tagline: 'Restoran & Kafe Yönetimi', icon: 'coffee', accent: '#e11d48', db, home: 'masalar',
    auth: { roles: ROLES },
    titles: { siparis: 'Sipariş' },
    nav: [
      { sec: 'Servis' },
      { id: 'masalar', label: 'Masalar', icon: 'table', roles: ['garson', 'kasa'] },
      { id: 'mutfak', label: 'Mutfak Ekranı', icon: 'chef', badge: true },
      { id: 'paket', label: 'Paket Servis', icon: 'truck', roles: ['garson', 'kasa'], badge: true },
      { id: 'rezervasyon', label: 'Rezervasyonlar', icon: 'calendar', roles: ['garson', 'kasa'] },
      { id: 'adisyonlar', label: 'Adisyonlar', icon: 'receipt', roles: ['kasa'] },
      PH.nav,
      { sec: 'Yönetim' },
      { id: 'menu', label: 'Menü & Reçeteler', icon: 'book', roles: ['admin'] },
      { id: 'stok', label: 'Malzeme Stoku', icon: 'box', roles: ['admin'] },
      { id: 'qr', label: 'QR Menü', icon: 'qr', roles: ['admin', 'garson'] },
      { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] },
      { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] },
    ],
    badges: () => ({ mutfak: sum(openChecks(), (c) => c.items.filter((i) => i.status === 'sent' && !i.cancel).length) || '', paket: openChecks().filter((c) => c.type === 'paket').length || '' }),
    routes: {
      ...PH.routes, masalar: tablesPage, siparis: orderPage, mutfak: kitchenPage, paket: packagePage, rezervasyon: reservationsPage, adisyonlar: historyPage, menu: menuPage, stok: stockPage, qr: qrPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Restoran ayarları' }, { type: 'section', label: 'Servis ücreti alınamaz — 30.01.2026 Fiyat Etiketi Yönetmeliği değişikliği (servis, masa, kuver ücreti yasak; yalnızca müşterinin isteğiyle gönüllü bahşiş). Hesapta “Bahşiş (müşteri isterse)” düğmesini kullanın.' }, { name: 'wifi', label: 'Wi-Fi şifresi (fişte yazar)' }, { name: 'receiptFooter', label: 'Fiş alt yazısı', full: true }] }),
    },
  });
  // Mutfak rolü giriş yaptıysa doğrudan mutfak ekranı
  if (NS.currentUser && NS.currentUser.role === 'mutfak' && !location.hash.includes('mutfak')) app.go('mutfak');
  // Diğer sekmelerden (QR menü, başka garson) gelen değişiklikleri canlı yansıt
  window.addEventListener('storage', (e) => {
    if (e.key !== db.key) return;
    db.load();
    if (['masalar', 'mutfak', 'paket', 'qr'].includes(app.route) && !document.querySelector('.ns-overlay')) app.refresh();
  });
  setInterval(() => { if (['masalar', 'mutfak'].includes(app.route) && !document.querySelector('.ns-overlay') && $('#view')) app.refresh(); }, 30000);
})();
