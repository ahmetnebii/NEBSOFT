/* NEBSOFT Emlak — İlan Portalları Merkezi: sahibinden.com, Hepsiemlak, Emlakjet.
   Portföy × portal yayın tablosu, yetki belgesi kontrolü, ilan süresi ve yenileme, doping, kota,
   portal bazında görüntülenme/favori/mesaj ve talep başı maliyet. app.js sayfa olarak kullanır. */
window.PORTALHUB = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;
  const PT = {
    sahibinden: { name: 'sahibinden.com', label: 'sahibinden.com', bg: '#ffe800', fg: '#111', days: 60, quota: 50, monthly: 4500 },
    hepsiemlak: { name: 'Hepsiemlak', label: 'Hepsiemlak', bg: '#e31e24', fg: '#fff', days: 60, quota: 40, monthly: 2900 },
    emlakjet: { name: 'Emlakjet', label: 'Emlakjet', bg: '#00a650', fg: '#fff', days: 90, quota: 60, monthly: 1900 },
  };
  const ST = { yayinda: ['Yayında', 'ok'], onay: ['Onayda', 'warn'], hata: ['Hatalı', 'err'], bitiyor: ['Süresi doluyor', 'warn'], kaldirildi: ['Kaldırıldı', ''], yok: ['Yok', ''] };
  let db;
  const cfg = (k) => ({ ...PT[k], ...((db.data.portalCfg || {})[k] || {}) });
  const tag = (k) => `<span class="badge" style="background:${PT[k].bg};color:${PT[k].fg};border:0">${esc(PT[k].name)}</span>`;
  const L = (pid, k) => db.find('portalListings', (x) => x.pid === pid && x.portal === k);
  const status = (l) => (!l ? 'yok' : l.status === 'yayinda' && l.until && l.until <= iso(addDays(new Date(), 7)) ? 'bitiyor' : l.status);
  const send = (k, action, payload) => (NS.integ && NS.integ.isOn('ilan') ? NS.integ.call('ilan', action, { portal: k, ...payload }, { silent: true }) : Promise.resolve({ ok: true, simulated: true }));

  function ensure(d) {
    db = d;
    if (db.data.portalListings) return;
    db.data.portalCfg = { sahibinden: { connected: true, storeNo: 'SHB-882134', quota: 50, doping: 12 }, hepsiemlak: { connected: true, storeNo: 'HE-55102', quota: 40, doping: 6 }, emlakjet: { connected: true, storeNo: 'EJ-2290', quota: 60, doping: 10 } };
    db.data.portalListings = [];
    db.all('props', (p) => p.status === 'aktif').forEach((p, i) => {
      if (!p.authNo && i % 6 !== 5) { p.authNo = 'YB' + NS.rand(1000000, 9999999); p.authEnd = iso(addDays(new Date(), NS.rand(-5, 120))); }
      if (!p.authNo) return;
      Object.keys(PT).forEach((k, j) => {
        if ((i + j) % 4 === 3) return;
        const start = addDays(new Date(), -NS.rand(3, 55));
        db.data.portalListings.push({ id: NS.uid(), pid: p.id, portal: k, status: (i + j) % 9 === 4 ? 'hata' : 'yayinda', error: (i + j) % 9 === 4 ? 'Yetki belgesi numarası doğrulanamadı' : '', start: iso(start), until: iso(addDays(start, PT[k].days)), views: NS.rand(80, 2400), favs: NS.rand(2, 60), msgs: NS.rand(0, 9), doping: (i + j) % 7 === 0, extNo: String(NS.rand(1000000000, 1999999999)) });
      });
    });
    db.save();
  }

  function page(el, p, app) {
    let flt = '', sel = new Set();
    const draw = () => {
      db.load();
      const ks = Object.keys(PT).filter((k) => cfg(k).connected);
      const props = db.all('props').filter((x) => x.status === 'aktif' || db.all('portalListings', (l) => l.pid === x.id && l.status !== 'kaldirildi').length);
      const rows = props.filter((x) => !flt || (flt === 'yetki' ? !x.authNo : flt === 'sorun' ? ks.some((k) => ['hata', 'bitiyor'].includes(status(L(x.id, k)))) || (x.status !== 'aktif') : ks.some((k) => !L(x.id, k) || L(x.id, k).status === 'kaldirildi')));
      const per = ks.map((k) => { const ls = db.all('portalListings', (l) => l.portal === k && l.status !== 'kaldirildi'); const c = cfg(k); const msgs = sum(ls, (l) => l.msgs); return { id: k, k, c, live: ls.filter((l) => l.status === 'yayinda').length, views: sum(ls, (l) => l.views), msgs, cpl: msgs ? c.monthly / msgs : 0 }; });
      const soldLive = db.all('props', (x) => x.status !== 'aktif').filter((x) => db.all('portalListings', (l) => l.pid === x.id && l.status === 'yayinda').length);
      el.innerHTML = pageHead('İlan Portalları', 'Portföyünüz sahibinden.com, Hepsiemlak ve Emlakjet’te — tek tablodan yayınlayın, yenileyin, kaldırın', `<button class="btn" id="ren">${icon('refresh')} Süresi dolanları yenile</button>${soldLive.length ? `<button class="btn danger" id="rmsold">${icon('x')} Satılan/kiralanan ${soldLive.length} ilanı kaldır</button>` : ''}`) + `
        ${NS.integ && NS.integ.isOn('ilan') ? '' : `<div class="card pad mb row" style="border-color:var(--warn)">${icon('info')}<span class="grow small">Demo / simülasyon modu. Canlı için <a href="#/entegrasyonlar">Entegrasyonlar &gt; İlan portalları</a> bağlantısını açın.</span></div>`}
        <div class="card mb">${table({ rows: per, columns: [{ label: 'Portal', render: (r) => `${tag(r.k)}<div class="small faint mt">Mağaza ${esc(r.c.storeNo || '-')}</div>` }, { label: 'Kota', render: (r) => `<b>${r.live}</b> / ${r.c.quota}<div class="progress mt" style="height:6px;max-width:120px"><i style="width:${Math.min(100, (r.live / r.c.quota) * 100)}%;${r.live >= r.c.quota ? 'background:var(--err)' : ''}"></i></div>` }, { label: 'Doping kredisi', cls: 'right', render: (r) => r.c.doping }, { label: 'Görüntülenme', cls: 'right', render: (r) => NS.num(r.views) }, { label: 'Mesaj / talep', cls: 'right', key: 'msgs' }, { label: 'Talep başı maliyet', cls: 'right', render: (r) => (r.cpl ? money(r.cpl) : '-') + `<div class="small faint">${money(r.c.monthly)}/ay paket</div>` }], actions: [{ icon: 'settings', act: 'pc', title: 'Portal ayarları' }] })}</div>
        <div class="card"><div class="card-h"><div class="seg"><button data-pf="" class="${!flt ? 'active' : ''}">Tümü</button><button data-pf="eksik" class="${flt === 'eksik' ? 'active' : ''}">Eksik portalı olan</button><button data-pf="sorun" class="${flt === 'sorun' ? 'active' : ''}">Sorunlu</button><button data-pf="yetki" class="${flt === 'yetki' ? 'active' : ''}">Yetki belgesi yok</button></div><span class="grow"></span><span class="small muted">${sel.size} seçili</span>${ks.map((k) => `<button class="btn sm" data-pub="${k}" ${sel.size ? '' : 'disabled'}>${icon('upload')} ${esc(PT[k].name)}</button>`).join('')}<button class="btn sm" data-dop ${sel.size ? '' : 'disabled'}>${icon('zap')} Doping</button></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:32px"><input type="checkbox" id="pa" aria-label="Tümünü seç"></th><th>İlan</th><th>Yetki belgesi</th>${ks.map((k) => `<th>${tag(k)}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr><td><input type="checkbox" data-ps="${x.id}" ${sel.has(x.id) ? 'checked' : ''} aria-label="Seç"></td><td><a href="#/ilan/${x.id}"><b>${esc(x.title)}</b></a><div class="small faint">${esc(x.no)} · ${money(x.price)}${x.status !== 'aktif' ? ` · <span style="color:var(--err)">${esc(x.status)}</span>` : ''}</div></td><td>${x.authNo ? `<span class="small mono">${esc(x.authNo)}</span><div class="small ${x.authEnd && x.authEnd < today() ? '' : 'faint'}" style="${x.authEnd && x.authEnd < today() ? 'color:var(--err)' : ''}">${x.authEnd ? 'bitiş ' + NS.date(x.authEnd) : ''}</div>` : `<button class="btn sm" data-auth="${x.id}" style="color:var(--err)">${icon('alert')} Gir</button>`}</td>${ks.map((k) => { const l = L(x.id, k); const s = status(l); return `<td>${badge(ST[s][0], ST[s][1])}${l && l.doping ? ' ' + badge('Doping', 'acc') : ''}${l && l.status !== 'kaldirildi' ? `<div class="small faint">${NS.num(l.views)} gör. · ${l.favs} fav · ${l.msgs} mesaj</div><div class="small faint">bitiş ${NS.date(l.until)}</div>` : ''}${l && l.error ? `<div class="small" style="color:var(--err)">${esc(l.error)}</div>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><div class="card-b small faint">İlan yayınlamak için yetki belgesi numarası zorunludur (Taşınmaz Ticareti Hakkında Yönetmelik). Satılan veya kiralanan ilanlar portallardan kaldırılmalıdır.</div></div>`;
    };
    // Olaylar el üzerinde bir kez bağlanır; draw yalnızca içeriği yeniler
    on(el, 'click', '[data-pf]', (e, b) => { flt = b.dataset.pf; draw(); });
    on(el, 'change', '[data-ps]', (e, c) => { c.checked ? sel.add(c.dataset.ps) : sel.delete(c.dataset.ps); draw(); });
    on(el, 'change', '#pa', (e, c) => { $$('[data-ps]', el).forEach((x) => { c.checked ? sel.add(x.dataset.ps) : sel.delete(x.dataset.ps); }); draw(); });
    on(el, 'click', '[data-auth]', async (e, b) => { const x = db.get('props', b.dataset.auth); const v = await NS.formModal({ title: `Yetki belgesi · ${x.no}`, fields: [{ name: 'authNo', label: 'Yetki belgesi no', required: true }, { name: 'authEnd', label: 'Bitiş tarihi', type: 'date', value: iso(addDays(new Date(), 90)) }] }); if (!v) return; Object.assign(x, v); db.save(); draw(); });
    on(el, 'click', '[data-pub]', async (e, b) => {
      const k = b.dataset.pub; const c = cfg(k); let ok = 0, bad = 0;
      for (const id of [...sel]) {
        const x = db.get('props', id); let l = L(id, k);
        const live = db.all('portalListings', (y) => y.portal === k && y.status === 'yayinda').length;
        const err = !x.authNo ? 'Yetki belgesi numarası yok' : x.authEnd && x.authEnd < today() ? 'Yetki belgesinin süresi dolmuş' : x.status !== 'aktif' ? 'İlan aktif değil' : live >= c.quota && (!l || l.status !== 'yayinda') ? 'Paket kotası dolu' : '';
        if (!l) { l = { id: NS.uid(), pid: id, portal: k, views: 0, favs: 0, msgs: 0 }; db.data.portalListings.push(l); }
        if (!err) await send(k, l.extNo ? 'guncelle' : 'yayinla', { no: x.no, title: x.title, price: x.price, authNo: x.authNo });
        Object.assign(l, err ? { status: 'hata', error: err } : { status: 'onay', error: '', start: today(), until: iso(addDays(new Date(), PT[k].days)), extNo: l.extNo || String(NS.rand(1000000000, 1999999999)) });
        x.portals = x.portals || {}; x.portals[PT[k].label] = err ? 'hata' : 'yayında';
        err ? bad++ : ok++;
      }
      db.save(); sel.clear(); toast(`${PT[k].name}: ${ok} ilan gönderildi${bad ? `, ${bad} hatalı` : ''}`, bad ? 'err' : 'ok'); draw();
      setTimeout(() => { db.load(); db.all('portalListings', (y) => y.status === 'onay').forEach((y) => { y.status = 'yayinda'; }); db.save(); if (document.body.contains(el)) draw(); }, 2500);
    });
    on(el, 'click', '[data-dop]', async () => {
      const ks = Object.keys(PT).filter((k) => cfg(k).connected);
      const v = await NS.formModal({ title: `Doping · ${sel.size} ilan`, fields: [{ name: 'k', label: 'Portal', type: 'select', options: ks.map((k) => ({ value: k, label: `${PT[k].name} (${cfg(k).doping} kredi)` })) }] }); if (!v) return;
      const c = db.data.portalCfg[v.k]; let n = 0;
      [...sel].forEach((id) => { const l = L(id, v.k); if (l && l.status === 'yayinda' && !l.doping && c.doping > 0) { l.doping = true; c.doping -= 1; n++; } });
      if (n) send(v.k, 'doping', { count: n }); db.save(); sel.clear(); toast(n ? `${n} ilan öne çıkarıldı` : 'Uygun ilan veya kredi yok', n ? 'ok' : 'err'); draw();
    });
    on(el, 'click', '#ren', async () => { let n = 0; for (const l of db.all('portalListings', (y) => status(y) === 'bitiyor')) { await send(l.portal, 'yenile', { extNo: l.extNo }); l.until = iso(addDays(new Date(), PT[l.portal].days)); n++; } db.save(); toast(n ? `${n} ilan yenilendi` : 'Süresi dolan ilan yok', n ? 'ok' : ''); draw(); });
    on(el, 'click', '#rmsold', async () => { const ls = db.all('portalListings', (y) => y.status === 'yayinda' && (db.get('props', y.pid) || {}).status !== 'aktif'); if (!(await confirm(`${ls.length} portal ilanı kaldırılsın mı?`, { ok: 'Kaldır' }))) return; for (const l of ls) { await send(l.portal, 'kaldir', { extNo: l.extNo }); l.status = 'kaldirildi'; const x = db.get('props', l.pid); if (x && x.portals) x.portals[PT[l.portal].label] = 'kaldırıldı'; } db.save(); toast('Kaldırıldı', 'ok'); draw(); });
    on(el, 'click', '[data-act="pc"]', (e, b) => { const k = b.dataset.id; const c = cfg(k); modal({ title: `${PT[k].name} ayarları`, body: `<div class="form-grid">${NS.fieldsHtml([{ name: 'storeNo', label: 'Mağaza / üye no', value: c.storeNo || '' }, { name: 'apiKey', label: 'API anahtarı', value: c.apiKey || '' }, { name: 'quota', label: 'Paket ilan kotası', type: 'number', value: c.quota }, { name: 'doping', label: 'Doping kredisi', type: 'number', value: c.doping }, { name: 'monthly', label: 'Aylık paket ücreti (₺)', type: 'number', value: c.monthly }])}</div>`, actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', onClick: (close, bd) => { db.data.portalCfg[k] = { ...(db.data.portalCfg[k] || {}), ...NS.readForm(bd), connected: true }; db.save(); close(); draw(); } }] }); });
    draw();
  }
  return { PT, ensure, nav: { id: 'portallar', label: 'İlan Portalları', icon: 'globe' }, routes: { portallar: page } };
})();
