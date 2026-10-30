/* NEBSOFT Emlak — İlan Portalları Merkezi: sahibinden.com, Hepsiemlak, Emlakjet.
   Portföy × portal yayın tablosu, yetki belgesi kontrolü, ilan süresi ve yenileme, doping, kota,
   portal bazında görüntülenme/favori/mesaj ve talep başı maliyet. app.js sayfa olarak kullanır. */
window.PORTALHUB = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;
  const PT = {
    sahibinden: { name: 'sahibinden.com', label: 'sahibinden.com', bg: '#ffe800', fg: '#111', days: 60 },
    hepsiemlak: { name: 'Hepsiemlak', label: 'Hepsiemlak', bg: '#e31e24', fg: '#fff', days: 60 },
    emlakjet: { name: 'Emlakjet', label: 'Emlakjet', bg: '#00a650', fg: '#fff', days: 90 },
  };
  const ST = { yayinda: ['Yayında', 'ok'], onay: ['Onayda', 'warn'], hata: ['Hatalı', 'err'], bitiyor: ['Süresi doluyor', 'warn'], kaldirildi: ['Kaldırıldı', ''], test: ['TEST — yayınlanmadı', 'warn'], yok: ['Yok', ''] };
  let db;
  const cfg = (k) => ({ ...PT[k], ...((db.data.portalCfg || {})[k] || {}) });
  const tag = (k) => `<span class="badge" style="background:${PT[k].bg};color:${PT[k].fg};border:0">${esc(PT[k].name)}</span>`;
  // Tablo çizimi boyunca bir kez kurulan dizin: binlerce ilanda hücre başına tüm liste taranmaz
  let lix = null; const L = (pid, k) => { if (!lix) { lix = new Map(db.all('portalListings').map((x) => [x.pid + '|' + x.portal, x])); setTimeout(() => { lix = null; }, 0); } return lix.get(pid + '|' + k); };
  const status = (l) => (!l ? 'yok' : l.status === 'yayinda' && l.until && l.until <= iso(addDays(new Date(), 7)) ? 'bitiyor' : l.status);
  const send = (k, action, payload) => (NS.integ && NS.integ.isOn('ilan') ? NS.integ.call('ilan', action, { portal: k, ...payload }, { silent: true }) : Promise.resolve({ ok: true, simulated: true }));

  function ensure(d) {
    db = d;
    if (db.data.portalListings) return;
    // Gerçek kullanıcının verisine yayın kaydı, numara ve istatistik üretilmez: örnek kayıtlar yalnızca demo ilanlarına eklenir
    db.data.portalCfg = { sahibinden: { connected: true }, hepsiemlak: { connected: true }, emlakjet: { connected: true } };
    db.data.portalListings = [];
    const demo = db.all('props').some((p) => p.sample); if (!demo) { db.save(); return; }
    db.data.portalCfg = { sahibinden: { connected: true, storeNo: 'ÖRNEK-1', quota: 50, doping: 12, monthly: 4500 }, hepsiemlak: { connected: true, storeNo: 'ÖRNEK-2', quota: 40, doping: 6, monthly: 2900 }, emlakjet: { connected: true, storeNo: 'ÖRNEK-3', quota: 60, doping: 10, monthly: 1900 } };
    db.all('props', (p) => p.status === 'aktif').forEach((p, i) => {
      if (!p.authNo && i % 6 !== 5) { p.authNo = 'ÖRNEK-' + NS.rand(1000, 9999); p.authEnd = iso(addDays(new Date(), NS.rand(-5, 120))); p.eidsEnd = iso(addDays(new Date(), NS.rand(10, 120))); p.ada = String(NS.rand(100, 9999)); p.parsel = String(NS.rand(1, 40)); }
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
      const ks = Object.keys(PT).filter((k) => cfg(k).connected); const LV = new Set(db.all('portalListings', (l) => l.status !== 'kaldirildi').map((l) => l.pid)); const S = db.settings();
      const props = db.all('props').filter((x) => x.status === 'aktif' || LV.has(x.id));
      const rows = props.filter((x) => !flt || (flt === 'yetki' ? !x.authNo : flt === 'sorun' ? ks.some((k) => ['hata', 'bitiyor'].includes(status(L(x.id, k)))) || (x.status !== 'aktif') : ks.some((k) => !L(x.id, k) || L(x.id, k).status === 'kaldirildi')));
      const per = ks.map((k) => { const ls = db.all('portalListings', (l) => l.portal === k && l.status !== 'kaldirildi'); const c = cfg(k); const msgs = sum(ls, (l) => l.msgs); return { id: k, k, c, live: ls.filter((l) => l.status === 'yayinda').length, views: sum(ls, (l) => l.views), msgs, cpl: msgs && c.monthly ? c.monthly / msgs : 0 }; });
      const LY = new Set(db.all('portalListings', (l) => l.status === 'yayinda').map((l) => l.pid)); const soldLive = db.all('props', (x) => x.status !== 'aktif' && LY.has(x.id)); const overdue = soldLive.filter((x) => x.closedAt && NS.daysBetween(x.closedAt, today()) > 3);
      el.innerHTML = pageHead('İlan Portalları', 'sahibinden.com, Hepsiemlak ve Emlakjet ilanlarınızı tek tablodan izleyin. Otomatik yayın sağlayıcı anlaşması ve canlı test sonrası açılır.', `<button class="btn" id="ren">${icon('refresh')} Süresi dolanları yenile</button>${soldLive.length ? `<button class="btn danger" id="rmsold">${icon('x')} Satılan/kiralanan ${soldLive.length} ilanı kaldır</button>` : ''}`) + `
        ${NS.integ && NS.integ.isOn('ilan') ? '' : `<div class="card pad mb row" style="border-color:var(--warn)">${icon('info')}<span class="grow small">Portallara otomatik gönderim kapalı: resmî API dokümanı doğrulanmadı. İlanı portalda kendiniz yayınlayıp <b>Elle kaydet</b> ile numarasını burada takip edin. Portal ilan girişinde mal sahibinin e-Devlet'ten verdiği EİDS yetkisi gerekir.</span></div>`}
        ${soldLive.length ? `<div class="card pad mb row" style="border-color:var(--err)">${icon('alert')}<span class="grow small">${soldLive.length} satılan veya kiralanan ilan portalda yayında${overdue.length ? `, <b>${overdue.length} tanesi 3 günlük süreyi geçti</b>` : ''}. İlan faaliyetine sonucu izleyen üç gün içinde son verilir (Yönetmelik md. 14/2-h).</span></div>` : ''}${S.yetkiNo ? '' : `<div class="card pad mb" style="border-color:var(--err)"><span class="small">${icon('alert')} İşletmenin yetki belgesi numarası girilmedi: <a href="#/ayarlar">Ayarlar</a></span></div>`}
        <div class="card mb">${table({ rows: per, columns: [{ label: 'Portal', render: (r) => `${tag(r.k)}<div class="small faint mt">Mağaza ${esc(r.c.storeNo || '-')}</div>` }, { label: 'Kota', render: (r) => (r.c.quota ? `<b>${r.live}</b> / ${r.c.quota}<div class="progress mt" style="height:6px;max-width:120px"><i style="width:${Math.min(100, (r.live / r.c.quota) * 100)}%;${r.live >= r.c.quota ? 'background:var(--err)' : ''}"></i></div>` : `<b>${r.live}</b> yayında`) }, { label: 'Doping kredisi', cls: 'right', render: (r) => r.c.doping || 0 }, { label: 'Görüntülenme', cls: 'right', render: (r) => NS.num(r.views) }, { label: 'Mesaj / talep', cls: 'right', key: 'msgs' }, { label: 'Talep başı maliyet', cls: 'right', render: (r) => (r.cpl ? money(r.cpl) : '-') + (r.c.monthly ? `<div class="small faint">${money(r.c.monthly)}/ay paket</div>` : '') }], actions: [{ icon: 'settings', act: 'pc', title: 'Portal ayarları' }] })}</div>
        <div class="card"><div class="card-h"><div class="seg"><button data-pf="" class="${!flt ? 'active' : ''}">Tümü</button><button data-pf="eksik" class="${flt === 'eksik' ? 'active' : ''}">Eksik portalı olan</button><button data-pf="sorun" class="${flt === 'sorun' ? 'active' : ''}">Sorunlu</button><button data-pf="yetki" class="${flt === 'yetki' ? 'active' : ''}">Yetkilendirme yok</button></div><span class="grow"></span><span class="small muted">${sel.size} seçili</span>${ks.map((k) => `<button class="btn sm" data-pub="${k}" ${sel.size ? '' : 'disabled'}>${icon('upload')} ${esc(PT[k].name)}</button>`).join('')}<button class="btn sm" data-dop ${sel.size ? '' : 'disabled'}>${icon('zap')} Doping</button></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:32px"><input type="checkbox" id="pa" aria-label="Tümünü seç"></th><th>İlan</th><th>Yetkilendirme</th>${ks.map((k) => `<th>${tag(k)}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr><td><input type="checkbox" data-ps="${x.id}" ${sel.has(x.id) ? 'checked' : ''} aria-label="Seç"></td><td><a href="#/ilan/${x.id}"><b>${esc(x.title)}</b></a><div class="small faint">${esc(x.no)} · ${money(x.price)}${x.status !== 'aktif' ? ` · <span style="color:var(--err)">${esc(x.status)}</span>` : ''}</div></td><td>${x.authNo ? `<span class="small mono">${esc(x.authNo)}</span><div class="small ${x.authEnd && x.authEnd < today() ? '' : 'faint'}" style="${x.authEnd && x.authEnd < today() ? 'color:var(--err)' : ''}">${x.authEnd ? 'bitiş ' + NS.date(x.authEnd) : ''}</div>` : `<button class="btn sm" data-auth="${x.id}" style="color:var(--err)">${icon('alert')} Gir</button>`}</td>${ks.map((k) => { const l = L(x.id, k); const s = status(l); return `<td>${badge(ST[s][0], ST[s][1])}${l && l.doping ? ' ' + badge('Doping', 'acc') : ''}${l && l.status !== 'kaldirildi' ? `<div class="small faint">${NS.num(l.views)} gör. · ${l.favs} fav · ${l.msgs} mesaj</div><div class="small faint">bitiş ${NS.date(l.until)}</div>` : ''}${l && l.error ? `<div class="small" style="color:var(--err)">${esc(l.error)}</div>` : ''}${l && l.extNo ? `<div class="small faint">No ${esc(l.extNo)}${l.source === 'elle' ? ' · elle' : ''}</div>` : ''}<div class="row gap-s mt"><button class="btn sm" data-man="${x.id}|${k}">Elle kaydet</button>${l && ['yayinda', 'onay', 'test', 'hata'].includes(l.status) ? `<button class="btn sm ghost" data-off="${x.id}|${k}">Kaldırıldı</button>` : ''}</div></td>`; }).join('')}</tr>`).join('')}</tbody></table></div><div class="card-b small faint">İlanda işletmenin yetki belgesi numarası, işletme adı, il, ilçe, mahalle, ada ve parsel yazılır (Yönetmelik md. 14/2-i); her ilan için iş sahibiyle yetkilendirme sözleşmesi gerekir (md. 15). Satılan veya kiralanan ilan üç gün içinde kaldırılır (md. 14/2-h).</div></div>`;
    };
    // Olaylar el üzerinde bir kez bağlanır; draw yalnızca içeriği yeniler
    on(el, 'click', '[data-pf]', (e, b) => { flt = b.dataset.pf; draw(); });
    on(el, 'change', '[data-ps]', (e, c) => { c.checked ? sel.add(c.dataset.ps) : sel.delete(c.dataset.ps); draw(); });
    on(el, 'change', '#pa', (e, c) => { $$('[data-ps]', el).forEach((x) => { c.checked ? sel.add(x.dataset.ps) : sel.delete(x.dataset.ps); }); draw(); });
    on(el, 'click', '[data-auth]', async (e, b) => { const x = db.get('props', b.dataset.auth); const v = await NS.formModal({ title: `Yetkilendirme · ${x.no}`, fields: [{ name: 'authNo', label: 'Yetkilendirme sözleşmesi no', required: true }, { name: 'authEnd', label: 'Sözleşme bitiş tarihi', type: 'date', value: iso(addDays(new Date(), 90)) }, { name: 'eidsEnd', label: 'EİDS ilan yetkisi bitiş tarihi', type: 'date' }] }); if (!v) return; Object.assign(x, v); db.save(); draw(); });
    // Elle yayın kaydı: API doğrulanana kadar işletme portalda kendi yayınlar, sonucu buraya yazar. Yetkisiz ilan yayında sayılmaz.
    on(el, 'click', '[data-man]', async (e, b) => {
      const [pid, k] = b.dataset.man.split('|'); const x = db.get('props', pid); let l = L(pid, k);
      const err = !db.settings().yetkiNo ? 'İşletmenin yetki belgesi numarası girilmedi' : !x.authNo ? 'Yetkilendirme sözleşmesi yok' : x.authEnd && x.authEnd < today() ? 'Yetkilendirme sözleşmesinin süresi dolmuş' : x.status !== 'aktif' ? 'İlan aktif değil' : ''; if (err) return toast(err, 'err');
      const v = await NS.formModal({ title: `${PT[k].name} · ${x.no}`, fields: [{ name: 'extNo', label: 'Portal ilan numarası', value: (l && l.extNo) || '', required: true }, { name: 'start', label: 'Yayın tarihi', type: 'date', value: today(), required: true }, { name: 'until', label: 'Bitiş tarihi', type: 'date', value: iso(addDays(new Date(), PT[k].days)), required: true }, { name: 'views', label: 'Görüntülenme (isteğe bağlı)', type: 'number', value: (l && l.views) || 0 }, { name: 'msgs', label: 'Mesaj / talep (isteğe bağlı)', type: 'number', value: (l && l.msgs) || 0 }], submitLabel: 'Kaydet' }); if (!v) return;
      if (!l) { l = { id: NS.uid(), pid, portal: k, views: 0, favs: 0, msgs: 0 }; db.data.portalListings.push(l); } Object.assign(l, v, { views: Number(v.views) || 0, msgs: Number(v.msgs) || 0, status: 'yayinda', source: 'elle', error: '' }); x.portals = x.portals || {}; x.portals[PT[k].label] = 'yayında'; db.log('İlan elle kaydedildi', `${x.no} · ${PT[k].name} · ${v.extNo}`); db.save(); toast('Yayın kaydı eklendi', 'ok'); draw();
    });
    on(el, 'click', '[data-off]', async (e, b) => { const [pid, k] = b.dataset.off.split('|'); const l = L(pid, k), x = db.get('props', pid); if (!l || !(await confirm(`${x.no} ${PT[k].name} ilanını portaldan kaldırdınız mı?`, { ok: 'Kaldırıldı' }))) return; if (l.extNo && l.source !== 'elle' && NS.integ && NS.integ.isOn('ilan')) { const res = await send(k, 'kaldir', { extNo: l.extNo }); if (res && res.simulated) return toast('TEST — ilan portaldan kaldırılmadı (simülasyon)', 'warn'); if (!res || !res.ok) return toast('Portal kaldırmadı: ' + ((res && res.error) || 'hata'), 'err'); } l.status = 'kaldirildi'; if (x.portals) x.portals[PT[k].label] = 'kaldırıldı'; db.log('İlan portaldan kaldırıldı', `${x.no} · ${PT[k].name}`); db.save(); draw(); });
    on(el, 'click', '[data-pub]', async (e, b) => {
      const k = b.dataset.pub; const c = cfg(k); let ok = 0, bad = 0, test = 0;
      for (const id of [...sel]) {
        const x = db.get('props', id); let l = L(id, k);
        const live = db.all('portalListings', (y) => y.portal === k && y.status === 'yayinda').length;
        const err = !db.settings().yetkiNo ? 'İşletmenin yetki belgesi numarası girilmedi' : !x.authNo ? 'Yetkilendirme sözleşmesi yok' : x.authEnd && x.authEnd < today() ? 'Yetkilendirme sözleşmesinin süresi dolmuş' : x.status !== 'aktif' ? 'İlan aktif değil' : c.quota && live >= c.quota && (!l || l.status !== 'yayinda') ? 'Paket kotası dolu' : '';
        if (!l) { l = { id: NS.uid(), pid: id, portal: k, views: 0, favs: 0, msgs: 0 }; db.data.portalListings.push(l); }
        // Portal yanıtına göre: simülasyon TEST (yayınlanmadı, ilan no uydurulmaz), hata, ya da portal onayında (no portaldan)
        const res = err ? null : await send(k, l.extNo ? 'guncelle' : 'yayinla', { no: x.no, title: x.title, price: x.price, authNo: db.settings().yetkiNo });
        const e2 = err || (res && !res.ok ? res.error || 'Portal hatası' : '');
        if (res && res.simulated) { Object.assign(l, { status: 'test', error: '' }); test++; }
        else Object.assign(l, e2 ? { status: 'hata', error: e2 } : { status: 'onay', error: '', start: today(), until: iso(addDays(new Date(), PT[k].days)), extNo: l.extNo || String((res && (res.ref || (res.data && res.data.extNo))) || '') });
        x.portals = x.portals || {}; x.portals[PT[k].label] = res && res.simulated ? 'TEST' : e2 ? 'hata' : 'onayda';
        if (!(res && res.simulated)) e2 ? bad++ : ok++;
      }
      db.save(); sel.clear(); toast(test ? `${PT[k].name} TEST — ${test} ilan yayınlanmadı (portal bağlantısı simülasyonda)${bad ? `, ${bad} hatalı` : ''}` : `${PT[k].name}: ${ok} ilan gönderildi (portal onayı bekleniyor)${bad ? `, ${bad} hatalı` : ''}`, bad ? 'err' : test ? 'warn' : 'ok'); draw();
    });
    on(el, 'click', '[data-dop]', async () => {
      const ks = Object.keys(PT).filter((k) => cfg(k).connected);
      const v = await NS.formModal({ title: `Doping · ${sel.size} ilan`, fields: [{ name: 'k', label: 'Portal', type: 'select', options: ks.map((k) => ({ value: k, label: `${PT[k].name} (${cfg(k).doping} kredi)` })) }] }); if (!v) return;
      const c = db.data.portalCfg[v.k]; const pick = [...sel].map((id) => L(id, v.k)).filter((l) => l && l.status === 'yayinda' && !l.doping).slice(0, Math.max(0, c.doping));
      if (!pick.length) return toast('Uygun ilan veya kredi yok', 'err');
      // Kredi ve işaret ancak portal onaylarsa düşülür (simülasyonda değişiklik yok)
      const res = await send(v.k, 'doping', { count: pick.length, ids: pick.map((l) => l.extNo) });
      if (res && res.simulated) return toast(`TEST — ${pick.length} ilan öne çıkarılmadı (portal bağlantısı simülasyonda)`, 'warn');
      if (!res || !res.ok) return toast('Doping yapılamadı: ' + ((res && res.error) || 'portal hatası'), 'err');
      pick.forEach((l) => { l.doping = true; c.doping -= 1; }); db.save(); sel.clear(); toast(`${pick.length} ilan öne çıkarıldı`, 'ok'); draw();
    });
    on(el, 'click', '#ren', async () => { let n = 0, t2 = 0; for (const l of db.all('portalListings', (y) => status(y) === 'bitiyor')) { const res = await send(l.portal, 'yenile', { extNo: l.extNo }); if (res && res.ok && !res.simulated) { l.until = iso(addDays(new Date(), PT[l.portal].days)); n++; } else if (res && res.simulated) t2++; } db.save(); toast(t2 ? `TEST — ${t2} ilan yenilenmedi (portal bağlantısı simülasyonda)` : n ? `${n} ilan yenilendi` : 'Süresi dolan ilan yok', t2 ? 'warn' : n ? 'ok' : ''); draw(); });
    on(el, 'click', '#rmsold', async () => { const ls = db.all('portalListings', (y) => y.status === 'yayinda' && (db.get('props', y.pid) || {}).status !== 'aktif'); if (!(await confirm(`${ls.length} portal ilanı kaldırılsın mı?`, { ok: 'Kaldır' }))) return; let t3 = 0, e3 = 0; for (const l of ls) { const res = await send(l.portal, 'kaldir', { extNo: l.extNo }); if (res && res.simulated) { t3++; continue; } if (!res || !res.ok) { e3++; continue; } l.status = 'kaldirildi'; const x = db.get('props', l.pid); if (x && x.portals) x.portals[PT[l.portal].label] = 'kaldırıldı'; } db.save(); toast(t3 ? `TEST — ${t3} ilan portaldan kaldırılmadı (simülasyon)` : e3 ? `${e3} ilan kaldırılamadı` : 'Kaldırıldı', t3 ? 'warn' : e3 ? 'err' : 'ok'); draw(); });
    on(el, 'click', '[data-act="pc"]', (e, b) => { const k = b.dataset.id; const c = cfg(k); modal({ title: `${PT[k].name} ayarları`, body: `<div class="form-grid">${NS.fieldsHtml([{ name: 'storeNo', label: 'Mağaza / üye no', value: c.storeNo || '' }, { name: 'quota', label: 'Paket ilan kotası', type: 'number', value: c.quota || 0 }, { name: 'doping', label: 'Doping kredisi', type: 'number', value: c.doping || 0 }, { name: 'monthly', label: 'Aylık paket ücreti (₺)', type: 'number', value: c.monthly || 0 }])}</div>`, actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', onClick: (close, bd) => { db.data.portalCfg[k] = { ...(db.data.portalCfg[k] || {}), ...NS.readForm(bd), connected: true }; db.save(); close(); draw(); } }] }); });
    draw();
  }
  return { PT, ensure, nav: { id: 'portallar', label: 'İlan Portalları', icon: 'globe' }, routes: { portallar: page } };
})();
