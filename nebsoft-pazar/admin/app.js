/* NEBSOFT Yönetim Merkezi — işletmeler, lisanslar, kullanıcılar, merkezi log takibi, güvenlik uyarıları,
   tahsilat/abonelik, destek, duyuru ve bakım modu, bayiler. Pazar yeri lisanslarıyla eşitlenir. */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const Y = window.YON; const C = window.CATALOG;
  const db = new NS.DB('yonetim', Y.seed);
  const S = () => db.settings({ trialDays: 7, graceDays: 7, warnDays: 30 });
  const me = () => (NS.currentUser || {}).name || 'Sistem';
  const ten = (id) => db.get('tenants', id) || { name: '-', code: '' };
  const prod = Y.prod;
  const planName = (p) => (Y.PLANS[p] || {}).name || '-';
  const now = () => new Date().toISOString();
  // Etkin lisans durumu: tarih geçmişse "süresi doldu"
  const lst = (l) => (['aktif', 'deneme'].includes(l.status) && l.end < now() ? 'suresi-doldu' : l.status);
  const leftDays = (l) => daysBetween(new Date(), l.end);
  const monthly = (l) => (['aktif'].includes(lst(l)) ? (l.period === 'yillik' ? l.price / 12 : l.price) : 0);
  const tLic = (tid) => db.all('licenses', (l) => l.tenant === tid);
  const tUsers = (tid) => db.all('accounts', (a) => a.tenant === tid);
  const productOpts = () => [...C.products.filter((p) => p.ready).map((p) => ({ value: p.id, label: p.name })), { value: 'bundle', label: 'Hepsi Bir Arada' }];

  // ---------- Merkezi log ----------
  const readAudit = () => { try { return JSON.parse(localStorage.getItem('nebsoft:audit') || '[]'); } catch (e) { return []; } };
  function adminLog(action, detail, tenant) {
    db.log(action, detail);
    if (NS.auditFlush) NS.auditFlush();
    const all = readAudit(); const t = tenant ? ten(tenant) : null;
    all.unshift({ id: NS.uid(), at: now(), app: 'yonetim', tenant: tenant || '', tenantName: t ? t.name : 'NEBSOFT', user: me(), role: (NS.currentUser || {}).role || '', type: /lisans/i.test(action) ? 'lisans' : /sil|askı|iptal|kilit/i.test(action) ? 'silme' : 'ayar', action, detail: String(detail || ''), level: /askı|iptal|sil|kilit/i.test(action) ? 'uyari' : 'bilgi', device: 'Yönetim Merkezi', sid: 'admin' });
    try { localStorage.setItem('nebsoft:audit', JSON.stringify(all.slice(0, 6000))); } catch (e) { /* kota */ }
  }
  // Güvenlik kuralları: art arda hatalı PIN, mesai dışı giriş, kısa sürede çok silme, kilitli hesap
  function alerts(au) {
    const out = []; const by = {};
    au.filter((e) => e.action === 'Hatalı PIN denemesi').forEach((e) => { const k = e.tenant + '|' + e.user + '|' + e.at.slice(0, 13); (by[k] = by[k] || []).push(e); });
    Object.values(by).filter((x) => x.length >= 3).forEach((x) => out.push({ id: 'pin' + x[0].id, level: 'err', at: x[0].at, tenant: x[0].tenant, user: x[0].user, title: `${x.length} hatalı PIN denemesi`, text: `${x[0].user} · ${NS.dt(x[x.length - 1].at)} – ${NS.time(x[0].at)}`, app: x[0].app }));
    au.filter((e) => e.action === 'Oturum açıldı' && Number(NS.time(e.at).slice(0, 2)) < 6).forEach((e) => out.push({ id: 'ng' + e.id, level: 'warn', at: e.at, tenant: e.tenant, user: e.user, title: 'Mesai dışı giriş', text: `${e.user} · ${NS.dt(e.at)} · ${e.device}`, app: e.app }));
    const del = {}; au.filter((e) => e.type === 'silme').forEach((e) => { const k = e.tenant + '|' + e.user + '|' + e.at.slice(0, 13); (del[k] = del[k] || []).push(e); });
    Object.values(del).filter((x) => x.length >= 8).forEach((x) => out.push({ id: 'dl' + x[0].id, level: 'err', at: x[0].at, tenant: x[0].tenant, user: x[0].user, title: `1 saatte ${x.length} silme işlemi`, text: `${x[0].user} · ${NS.dt(x[0].at)}`, app: x[0].app }));
    db.all('accounts', (a) => a.status === 'kilitli').forEach((a) => out.push({ id: 'lk' + a.id, level: 'warn', at: a.lockedAt || now(), tenant: a.tenant, user: a.name, title: 'Hesap kilitli', text: `${a.name} · ${a.failed || 0} hatalı deneme`, app: '' }));
    const seen = db.data.alertSeen || [];
    return out.filter((a) => !seen.includes(a.id)).sort((a, b) => b.at.localeCompare(a.at));
  }
  const appName = (id) => (id === 'yonetim' ? 'Yönetim Merkezi' : id === 'pazar' ? 'Pazar yeri' : prod(id).name);
  const TYPES = { oturum: ['Oturum', 'info'], islem: ['İşlem', ''], silme: ['Silme / iptal', 'err'], ayar: ['Ayar / yetki', 'warn'], ebelge: ['e-Belge', 'acc'], entegrasyon: ['Entegrasyon', 'acc'], lisans: ['Lisans', 'ok'] };

  // ---------- Pazar yeri eşitleme ----------
  function syncMarket(silent) {
    let m; try { m = JSON.parse(localStorage.getItem('nebsoft:market') || 'null'); } catch (e) { m = null; }
    if (!m) { if (!silent) toast('Pazar yeri verisi bulunamadı (pazar yeri hiç açılmamış)', 'err'); return; }
    let nt = 0, nl = 0, changed = false;
    (m.licenses || []).forEach((ml) => {
      // Otomatik yenilemeli abonelik dönemi geçmişse (kayıtlı karttan çekim yapılmış sayılır) bitiş ileri taşınır
      if (ml.autoRenew && ml.status === 'aktif' && ml.end < now()) { const e = new Date(ml.end); while (e < new Date()) e.setMonth(e.getMonth() + (ml.period === 'yillik' ? 12 : 1)); ml.end = e.toISOString(); changed = true; }
      let l = db.find('licenses', (x) => x.key === ml.key);
      if (!l) {
        const c = (m.customers || []).find((x) => x.id === ml.customer) || { name: 'Pazar yeri müşterisi', email: '' };
        let t = db.find('tenants', (x) => x.email && c.email && x.email === c.email);
        if (!t) { t = db.insert('tenants', { code: 'NB-' + db.nextNo('tenant').slice(-4), name: c.company || c.name, type: 'sahis', sector: '', city: '', contact: c.name, phone: c.phone || '', email: c.email || '', status: 'aktif', tags: ['Pazar yeri'], branches: 1, notes: [], apiKeys: [] }, true); db.insert('accounts', { tenant: t.id, name: c.name, email: c.email, phone: c.phone, role: 'sahip', status: 'aktif', products: [] }, true); nt++; }
        const pl = Y.PLANS[ml.plan] || Y.PLANS[1];
        db.insert('licenses', { key: ml.key, tenant: t.id, pid: ml.pid, plan: ml.plan, period: ml.period, start: ml.start, end: ml.end, status: ml.status === 'aktif' ? 'aktif' : ml.status, price: Y.price(ml.pid, ml.plan, ml.period), maxUsers: pl.users, branches: ml.branches || 1, maxDevices: pl.devices, devices: [], autoRenew: ml.autoRenew, grace: S().graceDays, features: { ebelge: ml.plan > 0, entegrasyon: ml.plan > 0, api: ml.plan === 2, cokSube: ml.plan === 2 }, src: 'market', history: [{ at: ml.start, what: 'Pazar yerinden satın alındı', by: 'Pazar yeri' }] }, true); nl++;
      } else if (l.src === 'market' && (l.status !== ml.status || l.end !== ml.end)) { ml.status = l.status === 'suresi-doldu' ? 'aktif' : l.status; ml.end = l.end; changed = true; }
    });
    db.save(); if (changed) try { localStorage.setItem('nebsoft:market', JSON.stringify(m)); } catch (e) { /* kota */ }
    if (!silent) toast(`Pazar yeri eşitlendi: ${nt} yeni işletme, ${nl} yeni lisans`, 'ok');
  }
  // Panelde lisans değişince pazar yerindeki karşılığı da güncellenir
  function pushMarket(l) { if (l.src !== 'market') return; try { const m = JSON.parse(localStorage.getItem('nebsoft:market') || 'null'); const ml = m && (m.licenses || []).find((x) => x.key === l.key); if (ml) { ml.status = ['askida', 'iptal'].includes(l.status) ? 'askida' : 'aktif'; ml.end = l.end; ml.plan = l.plan; localStorage.setItem('nebsoft:market', JSON.stringify(m)); } } catch (e) { /* yok */ } }

  // ---------- Lisans işlemleri ----------
  function licHist(l, what) { (l.history = l.history || []).push({ at: now(), what, by: me() }); pushMarket(l); }
  async function extend(app, l, months) {
    if (!months) { const v = await formModal({ title: `${l.key} — süre uzat`, fields: [{ name: 'm', label: 'Süre', type: 'select', options: [{ value: 1, label: '1 ay' }, { value: 3, label: '3 ay' }, { value: 6, label: '6 ay' }, { value: 12, label: '1 yıl' }, { value: 24, label: '2 yıl' }] }, { name: 'pay', label: 'Tahsilat kaydı oluştur', type: 'checkbox', value: true }, { name: 'inv', label: 'e-Fatura / e-Arşiv kes', type: 'checkbox', value: false }] }); if (!v) return; months = Number(v.m); if (v.pay) addPayment(l, months, v.inv); }
    const base = new Date(l.end > now() ? l.end : now()); base.setMonth(base.getMonth() + months); l.end = base.toISOString();
    if (['suresi-doldu', 'deneme', 'odeme-bekliyor'].includes(l.status) || lst(l) === 'suresi-doldu') l.status = 'aktif';
    licHist(l, `${months} ay uzatıldı → ${NS.date(l.end)}`); adminLog('Lisans uzatıldı', `${l.key} · ${months} ay`, l.tenant); db.save(); app && app.refresh();
  }
  async function addPayment(l, months, inv) {
    const amount = (l.period === 'yillik' ? l.price / 12 : l.price) * months; const t = ten(l.tenant);
    const p = db.insert('payments', { no: 'TH' + db.nextNo('pay'), tenant: l.tenant, license: l.id, pid: l.pid, amount: Math.round(amount * 1.2 * 100) / 100, net: Math.round(amount * 100) / 100, at: now(), method: 'kart', status: 'odendi', invoice: '' }, true);
    if (inv && NS.integ) { const r = await NS.integ.sendEInvoice({ buyer: t.name, buyerVkn: t.taxNo, buyerTaxOffice: t.taxOffice, buyerEmail: t.email, address: `${t.address || ''} ${t.district || ''}/${t.city || ''}`, no: p.no, lines: [{ name: `${prod(l.pid).name} ${planName(l.plan)} lisansı (${months} ay) — ${l.key}`, qty: 1, price: p.net, vat: 20 }] }); if (r && r.ok) { p.invoice = r.no; p.ebelge = r.id; } }
    db.save(); return p;
  }
  async function setLicStatus(app, l, st) {
    const labels = { askida: 'askıya alınsın', aktif: 'yeniden etkinleştirilsin', iptal: 'iptal edilsin' };
    if (st !== 'aktif' && !(await confirm(`${prod(l.pid).name} lisansı (${ten(l.tenant).name}) ${labels[st]} mı? Uygulama kullanıcılara kilitlenir.`, { ok: 'Onayla' }))) return;
    l.status = st; licHist(l, { askida: 'Askıya alındı', aktif: 'Yeniden etkinleştirildi', iptal: 'İptal edildi' }[st]);
    adminLog(st === 'askida' ? 'Lisans askıya alındı' : st === 'iptal' ? 'Lisans iptal edildi' : 'Lisans etkinleştirildi', l.key, l.tenant); db.save(); app.refresh();
  }
  function licEditor(app, rec, preset) {
    const pl = Y.PLANS[(rec || preset || {}).plan !== undefined ? (rec || preset).plan : 1];
    const v0 = rec ? { ...rec, start: rec.start.slice(0, 10), end: rec.end.slice(0, 10), ebelge: rec.features.ebelge, entegrasyon: rec.features.entegrasyon, api: rec.features.api, cokSube: rec.features.cokSube } : { pid: 'pos', plan: 1, period: 'aylik', start: today(), end: iso(addDays(new Date(), 30)), maxUsers: pl.users, branches: 1, maxDevices: pl.devices, autoRenew: true, grace: S().graceDays, status: 'aktif', ebelge: true, entegrasyon: true, ...(preset || {}) };
    formModal({ title: rec ? `Lisans — ${rec.key}` : 'Yeni lisans', size: 'wide', values: v0,
      fields: [{ name: 'tenant', label: 'İşletme', type: 'select', required: true, options: db.all('tenants').map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` })) }, { name: 'pid', label: 'Ürün', type: 'select', options: productOpts() }, { name: 'plan', label: 'Plan', type: 'select', options: Object.entries(Y.PLANS).map(([value, p]) => ({ value, label: p.name })), num: true }, { name: 'period', label: 'Periyot', type: 'select', options: [{ value: 'aylik', label: 'Aylık' }, { value: 'yillik', label: 'Yıllık (2 ay bedava)' }] },
        { name: 'status', label: 'Durum', type: 'select', options: Object.entries(Y.LST).filter(([k]) => k !== 'suresi-doldu').map(([value, v]) => ({ value, label: v[0] })) }, { name: 'start', label: 'Başlangıç', type: 'date' }, { name: 'end', label: 'Bitiş', type: 'date' }, { name: 'price', label: 'Fiyat (₺, KDV hariç, periyot başına)', type: 'number', step: '0.01' }, { name: 'maxUsers', label: 'Kullanıcı limiti', type: 'number' }, { name: 'branches', label: 'Şube limiti', type: 'number' }, { name: 'maxDevices', label: 'Cihaz limiti', type: 'number' }, { name: 'grace', label: 'Ek süre (gün)', type: 'number' },
        { type: 'section', label: 'Özellikler' }, { name: 'ebelge', label: 'e-Belge (e-Fatura / e-Arşiv)', type: 'checkbox' }, { name: 'entegrasyon', label: 'Donanım & sektörel entegrasyonlar', type: 'checkbox' }, { name: 'api', label: 'API erişimi', type: 'checkbox' }, { name: 'cokSube', label: 'Çok şube', type: 'checkbox' }, { name: 'autoRenew', label: 'Otomatik yenileme', type: 'checkbox' }],
      onOpen: (b) => { const pr = () => { const p = $('[name=pid]', b).value, plan = Number($('[name=plan]', b).value), per = $('[name=period]', b).value; $('[name=price]', b).value = Y.price(p, plan, per); const L = Y.PLANS[plan]; $('[name=maxUsers]', b).value = L.users; $('[name=maxDevices]', b).value = L.devices; }; ['pid', 'plan', 'period'].forEach((n) => $(`[name=${n}]`, b).addEventListener('change', pr)); if (!rec && !(preset && preset.price)) pr(); },
    }).then((v) => {
      if (!v) return;
      const data = { tenant: v.tenant, pid: v.pid, plan: Number(v.plan), period: v.period, status: v.status, start: new Date(v.start + 'T09:00').toISOString(), end: new Date(v.end + 'T23:59').toISOString(), price: Number(v.price) || 0, maxUsers: Number(v.maxUsers) || 1, branches: Number(v.branches) || 1, maxDevices: Number(v.maxDevices) || 1, grace: Number(v.grace) || 0, autoRenew: v.autoRenew, features: { ebelge: v.ebelge, entegrasyon: v.entegrasyon, api: v.api, cokSube: v.cokSube } };
      if (data.end <= data.start) return toast('Bitiş tarihi başlangıçtan sonra olmalı', 'err');
      if (rec) { Object.assign(rec, data); licHist(rec, 'Lisans bilgileri güncellendi'); adminLog('Lisans güncellendi', rec.key, rec.tenant); }
      else { const l = db.insert('licenses', { ...data, key: Y.licKey(data.pid), devices: [], src: 'panel', history: [{ at: now(), what: 'Lisans oluşturuldu', by: me() }] }, true); adminLog('Lisans oluşturuldu', `${l.key} · ${prod(l.pid).name}`, l.tenant); toast(`Lisans oluşturuldu: ${l.key}`, 'ok'); }
      db.save(); app.refresh();
    });
  }
  function licDoc(l) {
    const t = ten(l.tenant); const s = S();
    NS.printHtml(`<div class="doc" style="max-width:720px"><h2>${esc(s.bizName)}</h2><h3>YAZILIM KULLANIM LİSANS BELGESİ</h3><table><tr><td>Lisans sahibi</td><td><b>${esc(t.name)}</b> (${esc(t.code)})<br>VKN: ${esc(t.taxNo || '-')} · ${esc(t.city || '')}</td></tr><tr><td>Ürün</td><td><b>${esc(prod(l.pid).name)}</b> — ${planName(l.plan)} (${l.period === 'yillik' ? 'Yıllık' : 'Aylık'})</td></tr><tr><td>Lisans anahtarı</td><td style="font-family:monospace;font-size:16px"><b>${esc(l.key)}</b></td></tr><tr><td>Geçerlilik</td><td>${NS.date(l.start)} – ${NS.date(l.end)}</td></tr><tr><td>Limitler</td><td>${l.maxUsers >= 999 ? 'Sınırsız' : l.maxUsers} kullanıcı · ${l.branches} şube · ${l.maxDevices >= 99 ? 'sınırsız' : l.maxDevices} cihaz</td></tr><tr><td>Özellikler</td><td>${Object.entries({ ebelge: 'e-Belge', entegrasyon: 'Entegrasyonlar', api: 'API', cokSube: 'Çok şube' }).filter(([k]) => l.features[k]).map(([, v]) => v).join(', ') || '-'}</td></tr></table><div style="text-align:center;margin-top:20px">${NS.qrSvg(l.key, 120)}</div><p style="font-size:11px;color:#666">Bu belge ${NS.dt(new Date())} tarihinde düzenlenmiştir. Lisans anahtarı devredilemez.</p></div>`, { title: l.key });
  }
  function licDetail(app, l) {
    const t = ten(l.tenant); const st = lst(l);
    modal({ title: `${prod(l.pid).name} · ${t.name}`, size: 'wide', body: `<div class="row mb">${badge(Y.LST[st][0], Y.LST[st][1])} ${badge(planName(l.plan), 'acc')} ${badge(l.period === 'yillik' ? 'Yıllık' : 'Aylık')} ${l.src === 'market' ? badge('Pazar yeri', 'info') : ''}</div>
      <div class="card pad mb center" style="font:700 20px monospace;letter-spacing:.06em">${esc(l.key)}</div>
      <div class="grid g4 mb">${kpi('Kalan', leftDays(l) + ' gün', 'clock', leftDays(l) < 7 ? 'err' : 'info')}${kpi('Kullanıcı', `${tUsers(l.tenant).filter((a) => a.status !== 'pasif').length} / ${l.maxUsers >= 999 ? '∞' : l.maxUsers}`, 'users')}${kpi('Cihaz', `${(l.devices || []).length} / ${l.maxDevices >= 99 ? '∞' : l.maxDevices}`, 'phone')}${kpi('Aylık değer', money(monthly(l)), 'wallet', 'ok')}</div>
      <h3 class="mb">Aktive edilmiş cihazlar</h3>${table({ rows: l.devices || [], empty: 'Cihaz yok', columns: [{ label: 'Cihaz', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.device)}</div>` }, { label: 'İlk aktivasyon', render: (x) => NS.dt(x.first) }, { label: 'Son görülme', render: (x) => NS.ago ? NS.ago(x.last) : NS.dt(x.last) }], actions: [{ icon: 'trash', act: 'dev', title: 'Cihazı kaldır' }] })}
      <h3 class="mb mt">Lisans geçmişi</h3>${table({ rows: (l.history || []).slice().reverse().map((h, i) => ({ ...h, id: i })), columns: [{ label: 'Zaman', render: (h) => NS.dt(h.at) }, { label: 'İşlem', render: (h) => esc(h.what) }, { label: 'Yapan', render: (h) => esc(h.by || '') }] })}`,
      onOpen: (b, close) => on(b, 'click', '[data-act=dev]', (e, x) => { l.devices = l.devices.filter((d) => d.id !== x.dataset.id); licHist(l, 'Cihaz aktivasyonu kaldırıldı'); adminLog('Lisans cihazı kaldırıldı', l.key, l.tenant); db.save(); close(); licDetail(app, l); }),
      actions: [{ label: 'Belge', icon: 'print', onClick: () => licDoc(l) }, { label: 'Anahtarı yenile', icon: 'refresh', onClick: async (c) => { if (!(await confirm('Eski anahtar geçersiz olur ve tüm cihazların yeniden aktive edilmesi gerekir. Devam edilsin mi?'))) return; const old = l.key; l.key = Y.licKey(l.pid); l.devices = []; licHist(l, `Anahtar yenilendi (eski: ${old})`); adminLog('Lisans anahtarı yenilendi', `${old} → ${l.key}`, l.tenant); db.save(); c(); licDetail(app, l); } }, { label: 'Düzenle', icon: 'edit', onClick: (c) => { c(); licEditor(app, l); } }, { label: 'Süre uzat', cls: 'primary', icon: 'plus', onClick: (c) => { c(); extend(app, l); } }] });
  }

  // ---------- Sayfalar ----------
  function dashboard(el, p, app) {
    const L = db.all('licenses'); const T = db.all('tenants'); const au = readAudit(); const al = alerts(au);
    const mrr = sum(L, monthly); const w = S().warnDays || 30;
    const exp = L.filter((l) => ['aktif', 'deneme'].includes(lst(l)) && leftDays(l) <= w).sort((a, b) => a.end.localeCompare(b.end));
    const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 11 + i); return iso(d).slice(0, 7); });
    const rev = months.map((m) => ({ label: NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3), value: sum(db.all('payments', (x) => x.status === 'odendi' && x.at.slice(0, 7) === m), (x) => x.net) }));
    const byProd = {}; L.filter((l) => lst(l) === 'aktif').forEach((l) => { byProd[prod(l.pid).name] = (byProd[prod(l.pid).name] || 0) + 1; });
    const days = Array.from({ length: 14 }, (_, i) => iso(addDays(new Date(), i - 13)));
    const dau = days.map((d) => new Set(au.filter((e) => e.at.slice(0, 10) === d && e.action === 'Oturum açıldı').map((e) => e.tenant + e.user)).size);
    el.innerHTML = pageHead('Yönetim Merkezi', `${NS.dateLong(new Date())} · NEBSOFT platform durumu`, `<button class="btn" id="sy">${icon('refresh')} Pazar yeri ile eşitle</button><button class="btn primary" id="nt">${icon('plus')} Yeni işletme</button>`) + `
      <div class="grid g4 mb">${kpi('Aktif işletme', T.filter((t) => t.status === 'aktif').length, 'building', 'ok', `<div class="small faint">${T.filter((t) => t.status === 'deneme').length} deneme · ${T.filter((t) => t.status === 'askida').length} askıda</div>`)}${kpi('Aktif lisans', L.filter((l) => lst(l) === 'aktif').length, 'key', 'info', `<div class="small faint">${L.filter((l) => lst(l) === 'suresi-doldu').length} süresi dolmuş</div>`)}${kpi('Aylık tekrarlayan gelir', money(mrr), 'refresh', 'acc', `<div class="small faint">Yıllık ${money(mrr * 12)}</div>`)}${kpi('Güvenlik uyarısı', al.length, 'shield', al.length ? 'err' : 'ok', `<div class="small faint">${db.all('tickets', (t) => ['acik', 'islemde'].includes(t.status)).length} açık destek</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Aylık lisans geliri (KDV hariç)</h3></div><div class="card-b">${chart.bars(rev, { format: money })}</div></div><div class="card"><div class="card-h"><h3>Günlük aktif kullanıcı (14 gün)</h3></div><div class="card-b">${chart.line([{ name: 'Aktif kullanıcı', values: dau, color: '#0d9488' }], days.map((d) => d.slice(8)))}</div></div></div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>${icon('clock')} ${w} gün içinde bitecek</h3><a class="btn sm" href="#/lisanslar/bitecek">Tümü</a></div>${table({ rows: exp.slice(0, 8), empty: 'Yakında bitecek lisans yok', columns: [{ label: 'İşletme', render: (l) => `<a href="#/isletme/${l.tenant}"><b>${esc(ten(l.tenant).name)}</b></a><div class="small faint">${esc(prod(l.pid).name)}</div>` }, { label: 'Kalan', render: (l) => badge(leftDays(l) + ' gün', leftDays(l) <= 3 ? 'err' : 'warn') + (l.autoRenew ? '<div class="small faint">otomatik yenileme</div>' : '') }], actions: [{ label: 'Uzat', act: 'ext' }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('shield')} Güvenlik uyarıları</h3><a class="btn sm" href="#/loglar/uyarilar">Tümü</a></div><div class="card-b">${al.slice(0, 7).map((a) => `<div class="list-item small"><span class="dot ${a.level}"></span><div class="grow"><b>${esc(a.title)}</b><div class="faint">${esc(ten(a.tenant).name)} · ${esc(a.text)}</div></div></div>`).join('') || '<div class="faint small">Uyarı yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Aktif lisans dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })), { size: 130 })}</div></div></div>
      <div class="card mt"><div class="card-h"><h3>Son olaylar (tüm ürünler)</h3><a class="btn sm" href="#/loglar">Log takibi</a></div>${table({ rows: au.slice(0, 10), columns: [{ label: 'Zaman', render: (e) => NS.dt(e.at) }, { label: 'İşletme', render: (e) => esc(e.tenantName || ten(e.tenant).name) }, { label: 'Kullanıcı', render: (e) => esc(e.user) }, { label: 'Ürün', render: (e) => esc(appName(e.app)) }, { label: 'İşlem', render: (e) => `${badge((TYPES[e.type] || [e.type])[0], (TYPES[e.type] || [])[1])} ${esc(e.action)}` }, { label: 'Detay', render: (e) => `<span class="small">${esc(e.detail)}</span>` }] })}</div>`;
    $('#sy', el).onclick = () => { syncMarket(); app.refresh(); };
    $('#nt', el).onclick = () => tenantEditor(app);
    on(el, 'click', '[data-act=ext]', (e, b) => extend(app, db.get('licenses', b.dataset.id)));
  }

  // İşletme ekle / düzenle (yenide deneme lisansı ve sahip kullanıcısı opsiyonel)
  async function tenantEditor(app, rec) {
    const v = await formModal({ title: rec ? `${rec.code} düzenle` : 'Yeni işletme', size: 'wide', values: rec ? { ...rec, tagsStr: (rec.tags || []).join(', ') } : { type: 'ltd', status: 'deneme', branches: 1, trial: true, ownerCreate: true },
      fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'type', label: 'Şirket türü', type: 'select', options: [{ value: 'sahis', label: 'Şahıs işletmesi' }, { value: 'ltd', label: 'Limited şirket' }, { value: 'as', label: 'Anonim şirket' }, { value: 'dernek', label: 'Dernek / vakıf' }] }, { name: 'sector', label: 'Sektör', type: 'select', options: Y.SECTORS }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'city', label: 'Şehir' }, { name: 'district', label: 'İlçe' }, { name: 'address', label: 'Adres', full: true }, { name: 'contact', label: 'Yetkili kişi', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'reseller', label: 'Bayi', type: 'select', empty: 'Doğrudan', options: db.all('resellers').map((r) => ({ value: r.id, label: r.name })) }, { name: 'branches', label: 'Şube sayısı', type: 'number' }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(Y.TST).map(([value, x]) => ({ value, label: x[0] })) }, { name: 'tagsStr', label: 'Etiketler (virgülle)', full: true },
        ...(rec ? [] : [{ type: 'section', label: 'Hızlı kurulum' }, { name: 'trial', label: `Sektörün ürünü için ${S().trialDays} günlük deneme lisansı başlat`, type: 'checkbox', full: true }, { name: 'ownerCreate', label: 'Yetkiliyi "İşletme sahibi" kullanıcısı olarak ekle ve davet e-postası gönder', type: 'checkbox', full: true }])] });
    if (!v) return;
    v.tags = String(v.tagsStr || '').split(',').map((x) => x.trim()).filter(Boolean); delete v.tagsStr;
    if (rec) { Object.assign(rec, v); adminLog('İşletme güncellendi', rec.name, rec.id); db.save(); return app.refresh(); }
    const { trial, ownerCreate } = v; delete v.trial; delete v.ownerCreate;
    if (db.find('tenants', (t) => v.taxNo && t.taxNo === v.taxNo)) return toast('Bu VKN ile kayıtlı işletme var', 'err');
    const t = db.insert('tenants', { ...v, code: 'NB-' + (1000 + db.all('tenants').length + 1), notes: [], apiKeys: [] }, true);
    if (ownerCreate) { db.insert('accounts', { tenant: t.id, name: v.contact, email: v.email, phone: v.phone, role: 'sahip', status: 'aktif', twoFA: false, failed: 0, products: [] }, true); if (NS.integ) NS.integ.email(v.email, 'NEBSOFT hesabınız oluşturuldu', `Merhaba ${v.contact},\n\n${v.name} için NEBSOFT hesabınız açıldı. Giriş bağlantınız: ${location.origin}/index.html#/hesabim\n\nİyi çalışmalar.`); }
    if (trial) { const pid = Y.SEC_PID[v.sector] || 'pos'; const pl = Y.PLANS[1]; db.insert('licenses', { tenant: t.id, key: Y.licKey(pid), pid, plan: 1, period: 'aylik', start: now(), end: addDays(new Date(), S().trialDays).toISOString(), status: 'deneme', price: Y.price(pid, 1, 'aylik'), maxUsers: pl.users, branches: v.branches || 1, maxDevices: pl.devices, devices: [], autoRenew: false, grace: 0, features: { ebelge: true, entegrasyon: true, api: false, cokSube: false }, src: 'panel', history: [{ at: now(), what: 'Deneme lisansı oluşturuldu', by: me() }] }, true); }
    adminLog('İşletme eklendi', `${t.code} · ${t.name}`, t.id); db.save(); toast(`${t.name} eklendi`, 'ok'); app.go('isletme', t.id);
  }
  function tenantsPage(el, p, app) {
    let q = '', f = p || 'all', sec = '';
    el.innerHTML = pageHead('İşletmeler', 'Müşteri şirketler, lisansları ve kullanıcıları', `<button class="btn primary" id="nt">${icon('plus')} Yeni işletme</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ünvan, kod, VKN, yetkili, e-posta...')}<select class="input" id="sec" style="max-width:180px"><option value="">Tüm sektörler</option>${Y.SECTORS.map((s) => `<option>${s}</option>`).join('')}</select><div class="seg">${[['all', 'Tümü'], ['aktif', 'Aktif'], ['deneme', 'Deneme'], ['askida', 'Askıda'], ['kapali', 'Kapalı']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const au = readAudit(); const lastAct = {}; au.forEach((e) => { if (!lastAct[e.tenant]) lastAct[e.tenant] = e.at; });
    const draw = () => { const rows = db.all('tenants', (t) => (f === 'all' || t.status === f) && (!sec || t.sector === sec) && NS.match(q, t.name, t.code, t.taxNo, t.contact, t.email, t.city, ...(t.tags || []))).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      $('#t', el).innerHTML = table({ rows, emptyIcon: 'building', columns: [{ label: 'Kod', render: (t) => `<span class="mono small">${esc(t.code)}</span>` }, { label: 'İşletme', render: (t) => `<a href="#/isletme/${t.id}"><b>${esc(t.name)}</b></a> ${(t.tags || []).map((g) => badge(g, 'acc')).join(' ')}<div class="small faint">${esc(t.sector || '')} · ${esc(t.city || '')}</div>` }, { label: 'Yetkili', render: (t) => `${esc(t.contact || '')}<div class="small faint">${esc(t.phone || '')}</div>` }, { label: 'Lisans', cls: 'right', render: (t) => { const ls = tLic(t.id); return `${ls.filter((l) => lst(l) === 'aktif').length} / ${ls.length}`; } }, { label: 'Kullanıcı', cls: 'right', render: (t) => tUsers(t.id).length }, { label: 'Aylık değer', cls: 'right', render: (t) => money(sum(tLic(t.id), monthly)) }, { label: 'Son aktivite', render: (t) => (lastAct[t.id] ? NS.dt(lastAct[t.id]) : '<span class="faint">-</span>') }, { label: 'Durum', render: (t) => badge(Y.TST[t.status][0], Y.TST[t.status][1]) }],
        actions: [{ icon: 'eye', act: 'v', title: 'Detay' }, { icon: 'edit', act: 'ed' }, { label: 'Askıya al', act: 'sus', show: (t) => t.status !== 'askida' && t.status !== 'kapali' }, { label: 'Aktifleştir', act: 'act', show: (t) => t.status === 'askida' || t.status === 'kapali' }], foot: `${rows.length} işletme · aylık ${money(sum(rows.flatMap((t) => tLic(t.id)), monthly))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); }; $('#sec', el).onchange = (e) => { sec = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nt', el).onclick = () => tenantEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => { const t = db.get('tenants', b.dataset.id); const a = b.dataset.act; if (a === 'v') app.go('isletme', t.id); else if (a === 'ed') tenantEditor(app, t); else if (a === 'sus') { if (!(await confirm(`${t.name} askıya alınsın mı? Tüm ürünlerde kullanıcıların erişimi kilitlenir.`))) return; t.status = 'askida'; adminLog('İşletme askıya alındı', t.name, t.id); db.save(); draw(); } else { t.status = 'aktif'; adminLog('İşletme etkinleştirildi', t.name, t.id); db.save(); draw(); } });
    draw();
  }
  function tenantPage(el, id, app) {
    const t = db.get('tenants', id); if (!t) return app.go('isletmeler');
    let tab = 'lisans'; const au = readAudit().filter((e) => e.tenant === id);
    const ins = (() => { try { return JSON.parse(localStorage.getItem('nebsoft:install') || 'null'); } catch (e) { return null; } })();
    const draw = () => {
      const ls = tLic(id), us = tUsers(id), pays = db.all('payments', (x) => x.tenant === id).sort((a, b) => b.at.localeCompare(a.at)), tk = db.all('tickets', (x) => x.tenant === id);
      el.innerHTML = `<div class="row mb"><a class="btn" href="#/isletmeler">${icon('back')} İşletmeler</a><span class="grow"></span><button class="btn" id="bind">${icon('link')} ${ins && ins.tenant === id ? 'Bu tarayıcıya bağlı ✓' : 'Bu tarayıcıya bağla'}</button><button class="btn" id="ed">${icon('edit')} Düzenle</button><button class="btn" id="msg">${icon('bell')} Duyuru</button><button class="btn ${t.status === 'askida' ? 'ok' : 'danger'}" id="st">${t.status === 'askida' ? 'Aktifleştir' : 'Askıya al'}</button></div>
        <div class="card pad mb row"><div class="avatar lg" style="width:60px;height:60px;font-size:20px">${esc(NS.initials(t.name))}</div><div class="grow"><h1>${esc(t.name)}</h1><div class="muted">${esc(t.code)} · ${esc(t.sector || '-')} · ${esc(t.district || '')} ${esc(t.city || '')} · VKN ${esc(t.taxNo || '-')} (${esc(t.taxOffice || '-')})</div><div class="small mt">${esc(t.contact || '')} · ${esc(t.phone || '')} · ${esc(t.email || '')}${t.reseller ? ' · Bayi: ' + esc((db.get('resellers', t.reseller) || {}).name || '') : ''}</div></div>${badge(Y.TST[t.status][0], Y.TST[t.status][1])}</div>
        <div class="grid g4 mb">${kpi('Aktif lisans', ls.filter((l) => lst(l) === 'aktif').length + ' / ' + ls.length, 'key', 'info')}${kpi('Kullanıcı', us.length, 'users')}${kpi('Toplam tahsilat', money(sum(pays.filter((x) => x.status === 'odendi'), (x) => x.amount)), 'wallet', 'ok')}${kpi('30 gün olay', au.filter((e) => e.at >= addDays(new Date(), -30).toISOString()).length, 'zap', 'acc')}</div>
        <div class="tabs">${[['lisans', 'Lisanslar'], ['kullanici', 'Kullanıcılar'], ['odeme', 'Tahsilatlar'], ['log', 'Log kayıtları'], ['destek', 'Destek'], ['api', 'API anahtarları'], ['not', 'Notlar']].map(([k, l]) => `<button data-tb="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tb"></div>`;
      const tb = $('#tb', el);
      if (tab === 'lisans') tb.innerHTML = `<div class="row mb"><button class="btn sm primary" id="nl">${icon('plus')} Lisans ekle</button></div><div class="card">${licTable(ls)}</div>`;
      else if (tab === 'kullanici') tb.innerHTML = `<div class="row mb"><button class="btn sm primary" id="nu">${icon('plus')} Kullanıcı ekle</button>${ls.length ? `<span class="small muted">Lisans kullanıcı limiti: ${Math.max(...ls.map((l) => l.maxUsers)) >= 999 ? 'sınırsız' : Math.max(...ls.map((l) => l.maxUsers))}</span>` : ''}</div><div class="card">${userTable(us)}</div>`;
      else if (tab === 'odeme') tb.innerHTML = `<div class="card">${payTable(pays)}</div>`;
      else if (tab === 'log') tb.innerHTML = `<div class="card">${auditTable(au.slice(0, 300))}</div>`;
      else if (tab === 'destek') tb.innerHTML = `<div class="row mb"><button class="btn sm primary" id="ntk">${icon('plus')} Destek kaydı</button></div><div class="card">${ticketTable(tk)}</div>`;
      else if (tab === 'api') tb.innerHTML = `<div class="row mb"><button class="btn sm primary" id="nk">${icon('plus')} API anahtarı oluştur</button></div><div class="card">${table({ rows: t.apiKeys || [], empty: 'API anahtarı yok', columns: [{ label: 'Etiket', render: (k) => `<b>${esc(k.label)}</b>` }, { label: 'Anahtar', render: (k) => `<span class="mono small">${esc(k.key.slice(0, 12))}••••••••</span>` }, { label: 'Oluşturma', render: (k) => NS.date(k.created) }, { label: 'Son kullanım', render: (k) => (k.last ? NS.dt(k.last) : '-') }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('İptal', 'err')) }], actions: [{ label: 'İptal et', act: 'kx', show: (k) => k.active }] })}</div>`;
      else tb.innerHTML = `<div class="card pad"><textarea class="input" id="nn" placeholder="Not ekleyin (görüşme, teklif, şikâyet...)"></textarea><button class="btn primary mt" id="an">${icon('plus')} Not ekle</button></div><div class="card mt">${table({ rows: (t.notes || []).slice().reverse(), empty: 'Not yok', columns: [{ label: 'Zaman', render: (n) => NS.dt(n.at) }, { label: 'Not', render: (n) => esc(n.text) }, { label: 'Yazan', render: (n) => esc(n.by) }] })}</div>`;
      bindCommon(el, app, draw);
      const nl = $('#nl', el); if (nl) nl.onclick = () => licEditor(app, null, { tenant: id, pid: Y.SEC_PID[t.sector] || 'pos' });
      const nu = $('#nu', el); if (nu) nu.onclick = () => userEditor(app, null, id);
      const ntk = $('#ntk', el); if (ntk) ntk.onclick = () => ticketEditor(app, id);
      const nk = $('#nk', el); if (nk) nk.onclick = async () => { const lbl = await NS.prompt('Anahtar etiketi (nerede kullanılacak?)', 'Entegrasyon', { title: 'Yeni API anahtarı' }); if (!lbl) return; const key = 'nk_live_' + Array.from(crypto.getRandomValues(new Uint8Array(12))).map((x) => x.toString(16).padStart(2, '0')).join(''); (t.apiKeys = t.apiKeys || []).push({ id: NS.uid(), key, label: lbl, created: now(), last: null, active: true }); adminLog('API anahtarı oluşturuldu', lbl, id); db.save(); modal({ title: 'API anahtarı', body: `<p class="small muted mb">Anahtar yalnızca bir kez gösterilir, güvenli bir yere kaydedin.</p><div class="card pad mono" style="word-break:break-all">${key}</div>`, actions: [{ label: 'Kopyala', icon: 'copy', onClick: () => { navigator.clipboard && navigator.clipboard.writeText(key); toast('Kopyalandı', 'ok'); } }, { label: 'Tamam', cls: 'primary' }] }); draw(); };
      on(el, 'click', '[data-act=kx]', (e, b) => { const k = t.apiKeys.find((x) => x.id === b.dataset.id); k.active = false; adminLog('API anahtarı iptal edildi', k.label, id); db.save(); draw(); });
      const an = $('#an', el); if (an) an.onclick = () => { const v = $('#nn', el).value.trim(); if (!v) return; (t.notes = t.notes || []).push({ at: now(), text: v, by: me() }); db.save(); draw(); };
      on(el, 'click', '[data-tb]', (e, b) => { tab = b.dataset.tb; draw(); });
      $('#ed', el).onclick = () => tenantEditor(app, t);
      $('#st', el).onclick = async () => { if (t.status !== 'askida' && !(await confirm(`${t.name} askıya alınsın mı?`))) return; t.status = t.status === 'askida' ? 'aktif' : 'askida'; adminLog(t.status === 'askida' ? 'İşletme askıya alındı' : 'İşletme etkinleştirildi', t.name, id); db.save(); draw(); };
      $('#msg', el).onclick = () => annEditor(app, null, { tenants: [id] });
      // Bu tarayıcıdaki ürünler bu işletmenin lisansıyla çalışır (lisans/askı/duyuru denetimini denemek için)
      $('#bind', el).onclick = () => { const cur = (() => { try { return JSON.parse(localStorage.getItem('nebsoft:install') || 'null'); } catch (x) { return null; } })(); if (cur && cur.tenant === id) { localStorage.removeItem('nebsoft:install'); toast('Bağlantı kaldırıldı', 'ok'); } else { localStorage.setItem('nebsoft:install', JSON.stringify({ tenant: id, name: t.name, at: now() })); adminLog('Kurulum işletmeye bağlandı', t.name, id); toast(`Bu tarayıcıdaki ürünler artık ${t.name} lisansıyla çalışır`, 'ok'); } app.refresh(); };
    };
    draw();
  }
  // Ortak tablo eylemleri (lisans, kullanıcı, tahsilat, destek) — farklı sayfalarda aynı davranış
  function licTable(rows) { return table({ rows, emptyIcon: 'key', empty: 'Lisans yok', columns: [{ label: 'Anahtar', render: (l) => `<span class="mono small"><b>${esc(l.key)}</b></span>${l.src === 'market' ? `<div>${badge('Pazar yeri', 'info')}</div>` : ''}` }, { label: 'İşletme', render: (l) => `<a href="#/isletme/${l.tenant}">${esc(ten(l.tenant).name)}</a>` }, { label: 'Ürün / plan', render: (l) => `<b>${esc(prod(l.pid).name)}</b><div class="small faint">${planName(l.plan)} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'} · ${money(l.price)}</div>` }, { label: 'Limit', render: (l) => `<span class="small">${tUsers(l.tenant).filter((a) => a.status !== 'pasif').length}/${l.maxUsers >= 999 ? '∞' : l.maxUsers} kullanıcı · ${(l.devices || []).length}/${l.maxDevices >= 99 ? '∞' : l.maxDevices} cihaz</span>` }, { label: 'Geçerlilik', render: (l) => `${NS.date(l.start)} – ${NS.date(l.end)}<div class="small" style="color:${leftDays(l) < 0 ? 'var(--err)' : leftDays(l) <= 14 ? 'var(--warn)' : 'var(--text-3)'}">${leftDays(l) < 0 ? -leftDays(l) + ' gün önce bitti' : leftDays(l) + ' gün kaldı'}${l.autoRenew ? ' · oto. yenileme' : ''}</div>` }, { label: 'Durum', render: (l) => badge(Y.LST[lst(l)][0], Y.LST[lst(l)][1]) }],
    actions: [{ icon: 'eye', act: 'ld', title: 'Detay' }, { label: 'Uzat +1 ay', act: 'l1' }, { label: 'Askıya al', act: 'lsus', show: (l) => ['aktif', 'deneme', 'suresi-doldu'].includes(lst(l)) }, { label: 'Aktifleştir', act: 'lact', show: (l) => ['askida', 'iptal'].includes(l.status) }, { icon: 'edit', act: 'le' }] }); }
  function userTable(rows) { const au = readAudit(); const last = {}; au.forEach((e) => { const k = e.tenant + '|' + e.user; if (!last[k] && e.action === 'Oturum açıldı') last[k] = e; }); const US = { aktif: ['Aktif', 'ok'], pasif: ['Pasif', ''], kilitli: ['Kilitli', 'err'], davet: ['Davet gönderildi', 'info'] };
    return table({ rows, emptyIcon: 'users', empty: 'Kullanıcı yok', columns: [{ label: 'Kullanıcı', render: (u) => `<div class="row nw"><div class="avatar">${esc(NS.initials(u.name))}</div><div><b>${esc(u.name)}</b><div class="small faint">${esc(u.email || '')}</div></div></div>` }, { label: 'İşletme', render: (u) => `<a href="#/isletme/${u.tenant}">${esc(ten(u.tenant).name)}</a>` }, { label: 'Rol', render: (u) => badge(Y.UROLES[u.role] || u.role, 'acc') + (u.twoFA ? ' ' + badge('2FA', 'ok') : '') }, { label: 'Son giriş', render: (u) => { const e = last[u.tenant + '|' + u.name]; return e ? `${NS.dt(e.at)}<div class="small faint">${esc(e.device)} · ${esc(appName(e.app))}</div>` : (u.lastLogin ? NS.dt(u.lastLogin) : '<span class="faint">Hiç</span>'); } }, { label: 'Durum', render: (u) => badge(US[u.status][0], US[u.status][1]) + (u.failed ? `<div class="small" style="color:var(--err)">${u.failed} hatalı deneme</div>` : '') }],
      actions: [{ icon: 'search', act: 'ulog', title: 'Kullanıcı logları' }, { label: 'Kilidi aç', act: 'uun', show: (u) => u.status === 'kilitli' }, { label: 'Şifre sıfırla', act: 'upw' }, { label: 'Oturumları sonlandır', act: 'uso', show: (u) => u.status === 'aktif' }, { label: 'Pasif yap', act: 'upas', show: (u) => u.status === 'aktif' }, { label: 'Aktif yap', act: 'uact', show: (u) => u.status === 'pasif' }, { icon: 'edit', act: 'ue' }, { icon: 'trash', act: 'udel', title: 'Sil' }] }); }
  function payTable(rows) { return table({ rows, emptyIcon: 'wallet', empty: 'Tahsilat yok', columns: [{ label: 'No', render: (x) => `<b>${esc(x.no)}</b><div class="small faint">${NS.dt(x.at)}</div>` }, { label: 'İşletme', render: (x) => `<a href="#/isletme/${x.tenant}">${esc(ten(x.tenant).name)}</a>` }, { label: 'Ürün', render: (x) => esc(prod(x.pid).name) }, { label: 'Yöntem', render: (x) => esc({ kart: 'Kredi kartı', havale: 'Havale/EFT', otomatik: 'Otomatik çekim' }[x.method] || x.method) }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b><div class="small faint">KDV hariç ${money(x.net)}</div>` }, { label: 'Fatura', render: (x) => (x.ebelge && NS.ebelge ? `<a href="#" data-ebv="${x.ebelge}">${NS.ebelge.statusBadge(x.ebelge)}</a>` : x.invoice ? `<span class="mono small">${esc(x.invoice)}</span>` : '<span class="faint">-</span>') }, { label: 'Durum', render: (x) => badge(x.status === 'odendi' ? 'Ödendi' : x.status === 'iade' ? 'İade' : 'Ödeme bekliyor', x.status === 'odendi' ? 'ok' : x.status === 'iade' ? 'err' : 'warn') }], actions: [{ label: 'Onayla', act: 'pok', show: (x) => x.status === 'bekliyor' }, { label: 'Faturala', act: 'pinv', show: (x) => x.status === 'odendi' && !x.ebelge && !!NS.ebelge }] }); }
  const TKS = { acik: ['Açık', 'warn'], islemde: ['İşlemde', 'info'], cozuldu: ['Çözüldü', 'ok'], kapali: ['Kapalı', ''] }; const PRIO = { dusuk: ['Düşük', ''], normal: ['Normal', 'info'], yuksek: ['Yüksek', 'warn'], acil: ['Acil', 'err'] };
  function ticketTable(rows) { return table({ rows: rows.sort((a, b) => (['acik', 'islemde'].includes(b.status) - ['acik', 'islemde'].includes(a.status)) || b.created.localeCompare(a.created)), emptyIcon: 'message', empty: 'Destek kaydı yok', columns: [{ label: 'No', render: (x) => `<b>${esc(x.no)}</b><div class="small faint">${NS.dt(x.created)}</div>` }, { label: 'İşletme', render: (x) => `<a href="#/isletme/${x.tenant}">${esc(ten(x.tenant).name)}</a>` }, { label: 'Konu', render: (x) => `<b>${esc(x.subject)}</b><div class="small faint">${esc(prod(x.pid).name)} · ${x.messages.length} mesaj</div>` }, { label: 'Öncelik', render: (x) => badge(PRIO[x.prio][0], PRIO[x.prio][1]) }, { label: 'Atanan', render: (x) => esc((db.get('users', x.assignee) || {}).name || '-') }, { label: 'SLA', render: (x) => { const h = Math.round((Date.now() - new Date(x.created)) / 36e5); const lim = { acil: 4, yuksek: 24, normal: 48, dusuk: 96 }[x.prio]; return ['cozuldu', 'kapali'].includes(x.status) ? '<span class="faint">-</span>' : badge(`${h} sa / ${lim} sa`, h > lim ? 'err' : 'ok'); } }, { label: 'Durum', render: (x) => badge(TKS[x.status][0], TKS[x.status][1]) }], actions: [{ icon: 'message', act: 'tko', title: 'Aç' }, { label: 'Çözüldü', act: 'tkc', show: (x) => ['acik', 'islemde'].includes(x.status) }] }); }
  function auditTable(rows) { return table({ rows, emptyIcon: 'zap', empty: 'Kayıt yok', columns: [{ label: 'Zaman', render: (e) => `${NS.dt(e.at)}` }, { label: 'İşletme', render: (e) => (e.tenant ? `<a href="#/isletme/${e.tenant}">${esc(e.tenantName || ten(e.tenant).name)}</a>` : esc(e.tenantName || '-')) }, { label: 'Kullanıcı', render: (e) => `<b>${esc(e.user)}</b><div class="small faint">${esc(Y.UROLES[e.role] || e.role || '')}</div>` }, { label: 'Ürün', render: (e) => esc(appName(e.app)) }, { label: 'Tür', render: (e) => badge((TYPES[e.type] || [e.type])[0], (TYPES[e.type] || [])[1]) }, { label: 'İşlem', render: (e) => `${e.level === 'uyari' ? '<span style="color:var(--err)">⚠</span> ' : ''}${esc(e.action)}` }, { label: 'Detay', render: (e) => `<span class="small">${esc(e.detail)}</span>` }, { label: 'Cihaz', render: (e) => `<span class="small faint">${esc(e.device || '')}</span>` }] }); }
  // Tüm sayfalardaki ortak satır eylemleri
  function bindCommon(el, app, redraw) {
    on(el, 'click', '[data-ebv]', (e, b) => { e.preventDefault(); NS.ebelge.view(b.dataset.ebv); });
    on(el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act; const id = b.dataset.id; const rd = () => (redraw ? redraw() : app.refresh());
      if (a.startsWith('l')) { const l = db.get('licenses', id); if (!l) return; if (a === 'ld') licDetail(app, l); else if (a === 'l1') await extend({ refresh: rd }, l, 1); else if (a === 'lsus') await setLicStatus({ refresh: rd }, l, 'askida'); else if (a === 'lact') await setLicStatus({ refresh: rd }, l, 'aktif'); else if (a === 'le') licEditor({ refresh: rd }, l); return; }
      if (a.startsWith('u')) {
        const u = db.get('accounts', id); if (!u) return;
        if (a === 'ulog') return app.go('loglar', 'kullanici:' + u.tenant + '|' + u.name);
        if (a === 'ue') return userEditor({ refresh: rd }, u, u.tenant);
        if (a === 'uun') { u.status = 'aktif'; u.failed = 0; adminLog('Kullanıcı kilidi açıldı', u.name, u.tenant); }
        else if (a === 'upw') { const tmp = Math.random().toString(36).slice(2, 10); adminLog('Şifre sıfırlandı', u.name, u.tenant); if (NS.integ && u.email) NS.integ.email(u.email, 'NEBSOFT şifre sıfırlama', `Merhaba ${u.name},\n\nGeçici şifreniz: ${tmp}\nİlk girişte değiştirmeniz istenecek.`); toast(`Geçici şifre ${u.email || 'kullanıcıya'} gönderildi`, 'ok'); u.mustChange = true; }
        else if (a === 'uso') { u.sessionsRevoked = now(); adminLog('Kullanıcı oturumları sonlandırıldı', u.name, u.tenant); toast('Tüm cihazlardaki oturumlar sonlandırıldı', 'ok'); }
        else if (a === 'upas' || a === 'uact') { u.status = a === 'upas' ? 'pasif' : 'aktif'; adminLog(a === 'upas' ? 'Kullanıcı pasif yapıldı' : 'Kullanıcı aktif yapıldı', u.name, u.tenant); }
        else if (a === 'udel') { if (!(await confirm(`${u.name} silinsin mi?`))) return; adminLog('Kullanıcı silindi', u.name, u.tenant); db.remove('accounts', u.id); return rd(); }
        db.save(); return rd();
      }
      if (a === 'pok' || a === 'pinv') { const p = db.get('payments', id); const l = db.get('licenses', p.license); if (a === 'pok') { p.status = 'odendi'; p.at = now(); if (l) { l.status = 'aktif'; licHist(l, 'Havale onaylandı, lisans aktif'); } adminLog('Ödeme onaylandı', `${p.no} · ${money(p.amount)}`, p.tenant); } else { const t = ten(p.tenant); const r = await NS.integ.sendEInvoice({ buyer: t.name, buyerVkn: t.taxNo, buyerTaxOffice: t.taxOffice, buyerEmail: t.email, address: t.city, no: p.no, lines: [{ name: `${prod(p.pid).name} yazılım lisansı${l ? ' — ' + l.key : ''}`, qty: 1, price: p.net, vat: 20 }] }); if (r && r.ok) { p.invoice = r.no; p.ebelge = r.id; } } db.save(); return rd(); }
      if (a === 'tko') return ticketView({ refresh: rd }, db.get('tickets', id));
      if (a === 'tkc') { const tk = db.get('tickets', id); tk.status = 'cozuldu'; tk.messages.push({ from: 'destek', text: 'Talebiniz çözüldü olarak işaretlendi.', at: now(), by: me() }); adminLog('Destek talebi çözüldü', tk.no, tk.tenant); db.save(); return rd(); }
    });
  }
  function licensesPage(el, p, app) {
    let q = '', f = p || 'all', pr = '';
    el.innerHTML = pageHead('Lisanslar', 'Ürün lisansları, süreler, limitler ve cihaz aktivasyonları', `<button class="btn" id="chk">${icon('search')} Anahtar doğrula</button><button class="btn primary" id="nl">${icon('plus')} Yeni lisans</button>`) + `
      <div class="grid g4 mb">${kpi('Aktif', db.all('licenses', (l) => lst(l) === 'aktif').length, 'key', 'ok')}${kpi('Deneme', db.all('licenses', (l) => lst(l) === 'deneme').length, 'clock', 'info')}${kpi('Süresi dolmuş', db.all('licenses', (l) => lst(l) === 'suresi-doldu').length, 'alert', 'err')}${kpi('Aylık değer', money(sum(db.all('licenses'), monthly)), 'wallet', 'acc')}</div>
      <div class="card"><div class="card-h">${NS.searchBox('q', 'Anahtar, işletme...')}<select class="input" id="pr" style="max-width:200px"><option value="">Tüm ürünler</option>${productOpts().map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select><div class="seg">${[['all', 'Tümü'], ['aktif', 'Aktif'], ['deneme', 'Deneme'], ['bitecek', `${S().warnDays || 30} günde bitecek`], ['suresi-doldu', 'Süresi dolmuş'], ['askida', 'Askıda'], ['odeme-bekliyor', 'Ödeme bekliyor']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { const rows = db.all('licenses', (l) => (f === 'all' || (f === 'bitecek' ? ['aktif', 'deneme'].includes(lst(l)) && leftDays(l) <= (S().warnDays || 30) : lst(l) === f)) && (!pr || l.pid === pr) && NS.match(q, l.key, ten(l.tenant).name, ten(l.tenant).code)).sort((a, b) => a.end.localeCompare(b.end)); $('#t', el).innerHTML = licTable(rows); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); }; $('#pr', el).onchange = (e) => { pr = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nl', el).onclick = () => licEditor(app);
    $('#chk', el).onclick = async () => { const k = await NS.prompt('Lisans anahtarı', 'NEB-', { title: 'Lisans doğrulama' }); if (!k) return; const l = db.find('licenses', (x) => x.key.toUpperCase() === k.trim().toUpperCase()); if (!l) return toast('Geçersiz lisans anahtarı', 'err'); licDetail(app, l); };
    bindCommon(el, app, draw); draw();
  }
  async function userEditor(app, rec, tenantId) {
    const v = await formModal({ title: rec ? rec.name : 'Yeni kullanıcı', values: rec || { tenant: tenantId, role: 'personel', status: 'davet' }, fields: [{ name: 'tenant', label: 'İşletme', type: 'select', options: db.all('tenants').map((t) => ({ value: t.id, label: t.name })) }, { name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'role', label: 'Rol', type: 'select', options: Object.entries(Y.UROLES).map(([value, label]) => ({ value, label })) }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'davet', label: 'Davet gönder' }, { value: 'aktif', label: 'Aktif' }, { value: 'pasif', label: 'Pasif' }, { value: 'kilitli', label: 'Kilitli' }] }, { name: 'twoFA', label: 'İki adımlı doğrulama zorunlu', type: 'checkbox' }] });
    if (!v) return;
    if (!rec) { const ls = tLic(v.tenant).filter((l) => ['aktif', 'deneme'].includes(lst(l))); const lim = ls.length ? Math.max(...ls.map((l) => l.maxUsers)) : 0; const cnt = tUsers(v.tenant).filter((u) => u.status !== 'pasif').length; if (lim && cnt >= lim && !(await confirm(`İşletmenin kullanıcı limiti (${lim}) dolu. Yine de eklensin mi? (Plan yükseltmesi önerilir)`, { ok: 'Ekle', danger: false }))) return; }
    if (rec) { Object.assign(rec, v); adminLog('Kullanıcı güncellendi', v.name, v.tenant); }
    else { db.insert('accounts', { ...v, failed: 0, products: [] }, true); adminLog('Kullanıcı eklendi', `${v.name} (${Y.UROLES[v.role]})`, v.tenant); if (v.status === 'davet' && NS.integ) NS.integ.email(v.email, 'NEBSOFT daveti', `Merhaba ${v.name},\n\n${ten(v.tenant).name} sizi NEBSOFT'a davet etti.`); }
    db.save(); app.refresh();
  }
  function usersPage(el, p, app) {
    let q = '', f = 'all', rl = '';
    el.innerHTML = pageHead('Kullanıcılar', 'Tüm işletmelerin kullanıcıları, roller, kilitli hesaplar ve oturumlar', `<button class="btn primary" id="nu">${icon('plus')} Yeni kullanıcı</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ad, e-posta, işletme...')}<select class="input" id="rl" style="max-width:170px"><option value="">Tüm roller</option>${Object.entries(Y.UROLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><div class="seg">${[['all', 'Tümü'], ['aktif', 'Aktif'], ['kilitli', 'Kilitli'], ['pasif', 'Pasif'], ['davet', 'Davetli']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = userTable(db.all('accounts', (u) => (f === 'all' || u.status === f) && (!rl || u.role === rl) && NS.match(q, u.name, u.email, ten(u.tenant).name))); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); }; $('#rl', el).onchange = (e) => { rl = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nu', el).onclick = () => userEditor(app, null, (db.all('tenants')[0] || {}).id);
    bindCommon(el, app, draw); draw();
  }

  // ---------- Log takibi ----------
  function logsPage(el, p, app) {
    const tab0 = p && !p.includes(':') ? p : 'liste';
    const st = { tab: tab0, range: '7', from: '', to: '', tenant: '', user: '', app: '', type: '', level: '', q: '' };
    if (p && p.startsWith('kullanici:')) { const [t, u] = p.slice(10).split('|'); st.tenant = t; st.user = u; st.range = '30'; }
    if (p && p.startsWith('isletme:')) { st.tenant = p.slice(8); st.range = '30'; }
    let live = null;
    const draw = () => {
      const all = readAudit(); const al = alerts(all);
      const fromD = st.range === 'ozel' ? st.from : st.range === 'bugun' ? today() : iso(addDays(new Date(), -Number(st.range)));
      const toD = st.range === 'ozel' && st.to ? st.to : '9999';
      const rows = all.filter((e) => e.at.slice(0, 10) >= fromD && e.at.slice(0, 10) <= toD && (!st.tenant || e.tenant === st.tenant) && (!st.user || e.user === st.user) && (!st.app || e.app === st.app) && (!st.type || e.type === st.type) && (!st.level || e.level === st.level) && NS.match(st.q, e.action, e.detail, e.user, e.tenantName, e.device));
      const users = [...new Set(all.filter((e) => !st.tenant || e.tenant === st.tenant).map((e) => e.user))].sort((a, b) => a.localeCompare(b, 'tr'));
      const apps = [...new Set(all.map((e) => e.app))];
      el.innerHTML = pageHead('Log Takibi', 'Tüm ürünlerden merkezi olay kaydı — işletme, kullanıcı, ürün ve tür bazında', `<label class="check small"><input type="checkbox" id="live" ${live ? 'checked' : ''}> Canlı izle</label><button class="btn" id="clr">${icon('x')} Filtreleri temizle</button>`) + `
        <div class="card pad mb"><div class="form-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">
          <div class="field"><label>Tarih</label><select class="input" id="f-range">${[['bugun', 'Bugün'], ['1', 'Son 24 saat'], ['7', 'Son 7 gün'], ['30', 'Son 30 gün'], ['90', 'Son 90 gün'], ['ozel', 'Özel aralık']].map(([v, l]) => `<option value="${v}" ${st.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          ${st.range === 'ozel' ? `<div class="field"><label>Başlangıç</label><input type="date" class="input" id="f-from" value="${st.from}"></div><div class="field"><label>Bitiş</label><input type="date" class="input" id="f-to" value="${st.to}"></div>` : ''}
          <div class="field"><label>İşletme</label><select class="input" id="f-tenant"><option value="">Tümü</option>${db.all('tenants').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((t) => `<option value="${t.id}" ${st.tenant === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}<option value="" disabled>──────</option></select></div>
          <div class="field"><label>Kullanıcı</label><select class="input" id="f-user"><option value="">Tümü</option>${users.map((u) => `<option ${st.user === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>
          <div class="field"><label>Ürün</label><select class="input" id="f-app"><option value="">Tümü</option>${apps.map((a) => `<option value="${a}" ${st.app === a ? 'selected' : ''}>${esc(appName(a))}</option>`).join('')}</select></div>
          <div class="field"><label>Olay türü</label><select class="input" id="f-type"><option value="">Tümü</option>${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${st.type === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
          <div class="field"><label>Seviye</label><select class="input" id="f-level"><option value="">Tümü</option><option value="uyari" ${st.level === 'uyari' ? 'selected' : ''}>Uyarı</option><option value="bilgi" ${st.level === 'bilgi' ? 'selected' : ''}>Bilgi</option></select></div>
          <div class="field" style="grid-column:span 2"><label>Ara</label><div class="search">${icon('search')}<input class="input" id="f-q" value="${esc(st.q)}" placeholder="İşlem, detay, cihaz..."></div></div></div></div>
        <div class="grid g4 mb">${kpi('Olay', num(rows.length), 'zap', 'info')}${kpi('Tekil kullanıcı', new Set(rows.map((e) => e.tenant + e.user)).size, 'users')}${kpi('Oturum açma', rows.filter((e) => e.action === 'Oturum açıldı').length, 'key', 'ok', `<div class="small faint">${rows.filter((e) => e.action === 'Hatalı PIN denemesi').length} hatalı deneme</div>`)}${kpi('Uyarı seviyesi', rows.filter((e) => e.level === 'uyari').length, 'alert', 'err')}</div>
        <div class="tabs">${[['liste', 'Olay listesi'], ['zaman', 'Zaman çizelgesi'], ['isi', 'Saat ısı haritası'], ['kullanici', 'Kullanıcı özeti'], ['isletme', 'İşletme özeti'], ['uyarilar', `Güvenlik uyarıları (${al.length})`]].map(([k, l]) => `<button data-tb="${k}" class="${k === st.tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="lv"></div>`;
      const lv = $('#lv', el);
      if (st.tab === 'liste') lv.innerHTML = `<div class="card">${auditTable(rows.slice(0, 500))}${rows.length > 500 ? `<div class="tbl-foot">İlk 500 olay gösteriliyor (toplam ${num(rows.length)}) — filtreleri daraltın veya Excel’e aktarın</div>` : ''}</div>`;
      else if (st.tab === 'zaman') { const byDay = NS.groupBy(rows.slice(0, 800), (e) => e.at.slice(0, 10)); lv.innerHTML = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([d, es]) => `<div class="card mb"><div class="card-h"><h3>${NS.dateLong(d)}</h3>${badge(es.length + ' olay', 'acc')}</div><div class="card-b"><div class="tl">${es.slice(0, 60).map((e) => `<div class="it"><div class="row between"><b>${e.level === 'uyari' ? '⚠ ' : ''}${esc(e.action)}</b><span class="small faint">${NS.time(e.at)}</span></div><div class="small">${esc(e.user)} · ${esc(e.tenantName || ten(e.tenant).name)} · ${esc(appName(e.app))}</div>${e.detail ? `<div class="small muted">${esc(e.detail)}</div>` : ''}</div>`).join('')}</div></div></div>`).join('') || '<div class="empty">Kayıt yok</div>'; }
      else if (st.tab === 'isi') { const grid = Array.from({ length: 7 }, () => Array(24).fill(0)); rows.forEach((e) => { const d = new Date(e.at); grid[(d.getDay() + 6) % 7][d.getHours()]++; }); const mx = Math.max(1, ...grid.flat()); lv.innerHTML = `<div class="card pad"><div class="small muted mb">Haftanın günü × saat — hangi saatlerde yoğun kullanım var, mesai dışı hareket var mı?</div><div style="overflow:auto"><table style="border-collapse:separate;border-spacing:3px"><tr><td></td>${Array.from({ length: 24 }, (_, h) => `<td class="small faint" style="text-align:center">${h}</td>`).join('')}</tr>${grid.map((r, i) => `<tr><td class="small"><b>${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</b></td>${r.map((v, h) => `<td title="${v} olay" style="width:26px;height:26px;border-radius:5px;background:${v ? `color-mix(in srgb, var(--accent) ${Math.round(15 + (v / mx) * 85)}%, transparent)` : 'var(--bg-2)'};${(h < 7 || h > 22) && v ? 'outline:2px solid var(--err)' : ''}"></td>`).join('')}</tr>`).join('')}</table></div><div class="small muted mt">Kırmızı çerçeve: mesai dışı (22:00–07:00) hareket</div></div>`; }
      else if (st.tab === 'kullanici') { const g = NS.groupBy(rows, (e) => e.tenant + '|' + e.user); const ur = Object.entries(g).map(([k, es]) => ({ id: k, tenant: es[0].tenant, tenantName: es[0].tenantName, user: es[0].user, n: es.length, login: es.filter((e) => e.action === 'Oturum açıldı').length, fail: es.filter((e) => e.action === 'Hatalı PIN denemesi').length, del: es.filter((e) => e.type === 'silme').length, last: es[0].at, apps: [...new Set(es.map((e) => appName(e.app)))].join(', '), dev: [...new Set(es.map((e) => e.device))].length })).sort((a, b) => b.n - a.n);
        lv.innerHTML = `<div class="card">${table({ rows: ur, columns: [{ label: 'Kullanıcı', render: (x) => `<b>${esc(x.user)}</b><div class="small faint">${esc(x.tenantName || ten(x.tenant).name)}</div>` }, { label: 'Olay', cls: 'right', render: (x) => num(x.n) }, { label: 'Giriş', cls: 'right', render: (x) => x.login }, { label: 'Hatalı PIN', cls: 'right', render: (x) => (x.fail ? badge(x.fail, 'err') : 0) }, { label: 'Silme', cls: 'right', render: (x) => (x.del > 5 ? badge(x.del, 'warn') : x.del) }, { label: 'Cihaz', cls: 'right', render: (x) => x.dev }, { label: 'Ürünler', render: (x) => `<span class="small">${esc(x.apps)}</span>` }, { label: 'Son olay', render: (x) => NS.dt(x.last) }], actions: [{ icon: 'search', act: 'fu', title: 'Bu kullanıcının logları' }] })}</div>`; }
      else if (st.tab === 'isletme') { const g = NS.groupBy(rows, (e) => e.tenant); const tr = Object.entries(g).map(([k, es]) => ({ id: k || 'x', tenant: k, name: es[0].tenantName || ten(k).name, n: es.length, users: new Set(es.map((e) => e.user)).size, warn: es.filter((e) => e.level === 'uyari').length, eb: es.filter((e) => e.type === 'ebelge' || e.type === 'entegrasyon').length, last: es[0].at })).sort((a, b) => b.n - a.n);
        lv.innerHTML = `<div class="card">${table({ rows: tr, columns: [{ label: 'İşletme', render: (x) => (x.tenant ? `<a href="#/isletme/${x.tenant}"><b>${esc(x.name)}</b></a>` : esc(x.name || 'Bağlı olmayan kurulum')) }, { label: 'Olay', cls: 'right', render: (x) => num(x.n) }, { label: 'Aktif kullanıcı', cls: 'right', render: (x) => x.users }, { label: 'Entegrasyon / e-Belge', cls: 'right', render: (x) => x.eb }, { label: 'Uyarı', cls: 'right', render: (x) => (x.warn ? badge(x.warn, 'warn') : 0) }, { label: 'Son olay', render: (x) => NS.dt(x.last) }], actions: [{ icon: 'search', act: 'ft', title: 'Bu işletmenin logları' }] })}</div>`; }
      else lv.innerHTML = `<div class="card">${table({ rows: al, empty: 'Açık güvenlik uyarısı yok', emptyIcon: 'shield', columns: [{ label: 'Zaman', render: (a) => NS.dt(a.at) }, { label: 'Uyarı', render: (a) => `${badge(a.level === 'err' ? 'Kritik' : 'Uyarı', a.level)} <b>${esc(a.title)}</b>` }, { label: 'İşletme', render: (a) => `<a href="#/isletme/${a.tenant}">${esc(ten(a.tenant).name)}</a>` }, { label: 'Ayrıntı', render: (a) => `<span class="small">${esc(a.text)}</span>` }], actions: [{ label: 'İncelendi', act: 'seen' }, { icon: 'search', act: 'au', title: 'Kullanıcı logları' }] })}</div>`;
      // Filtreler
      const set = (k) => (e) => { st[k] = e.target.value; if (k === 'tenant') st.user = ''; draw(); };
      ['range', 'tenant', 'user', 'app', 'type', 'level'].forEach((k) => { const x = $('#f-' + k, el); if (x) x.onchange = set(k); });
      ['from', 'to'].forEach((k) => { const x = $('#f-' + k, el); if (x) x.onchange = set(k); });
      let qt; $('#f-q', el).oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value; draw(); const i = $('#f-q', el); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
      $('#clr', el).onclick = () => { Object.assign(st, { range: '7', from: '', to: '', tenant: '', user: '', app: '', type: '', level: '', q: '' }); draw(); };
      $('#live', el).onchange = (e) => { clearInterval(live); live = e.target.checked ? setInterval(() => { if (!document.body.contains(el) || NS.app.route !== 'loglar') return clearInterval(live); if (!document.querySelector('.ns-overlay,.ns-menu,.ns-picker') && document.activeElement.id !== 'f-q') draw(); }, 3000) : null; };
    };
    on(el, 'click', '[data-tb]', (e, b) => { st.tab = b.dataset.tb; draw(); });
    on(el, 'click', '[data-act]', (e, b) => {
      const a = b.dataset.act; const id = b.dataset.id;
      if (a === 'fu') { const [t, u] = id.split('|'); Object.assign(st, { tenant: t, user: u, tab: 'liste' }); draw(); }
      else if (a === 'ft') { Object.assign(st, { tenant: id === 'x' ? '' : id, user: '', tab: 'liste' }); draw(); }
      else if (a === 'seen') { db.data.alertSeen = [...(db.data.alertSeen || []), id]; adminLog('Güvenlik uyarısı incelendi', id); db.save(); draw(); }
      else if (a === 'au') { const al = alerts(readAudit()).find((x) => x.id === id); if (al) Object.assign(st, { tenant: al.tenant, user: al.user, tab: 'liste', range: '30' }); draw(); }
    });
    addEventListener('storage', (e) => { if (e.key === 'nebsoft:audit' && live && NS.app.route === 'loglar') draw(); });
    draw();
  }

  // ---------- Tahsilatlar ----------
  function paymentsPage(el, p, app) {
    let f = 'all';
    const P = db.all('payments'); const mo = today().slice(0, 7);
    const L = db.all('licenses'); const mrr = sum(L, monthly);
    const churn = L.filter((l) => ['iptal', 'suresi-doldu'].includes(lst(l)) && l.end >= iso(addDays(new Date(), -30))).length;
    el.innerHTML = pageHead('Tahsilat & Abonelik', 'Lisans ödemeleri, bekleyen havaleler, gelir göstergeleri ve faturalama', `<button class="btn" id="ren">${icon('refresh')} Otomatik yenilemeleri çalıştır</button>`) + `
      <div class="grid g4 mb">${kpi('MRR', money(mrr), 'refresh', 'acc', `<div class="small faint">ARR ${money(mrr * 12)}</div>`)}${kpi('Bu ay tahsilat', money(sum(P.filter((x) => x.status === 'odendi' && x.at.slice(0, 7) === mo), (x) => x.amount)), 'wallet', 'ok')}${kpi('Bekleyen ödeme', money(sum(P.filter((x) => x.status === 'bekliyor'), (x) => x.amount)), 'clock', 'warn')}${kpi('30 gün kayıp (churn)', churn, 'minus', 'err')}</div>
      <div class="card"><div class="card-h"><div class="seg">${[['all', 'Tümü'], ['bekliyor', 'Bekleyen'], ['odendi', 'Ödenen'], ['faturasiz', 'Faturasız']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = payTable(db.all('payments', (x) => f === 'all' || (f === 'faturasiz' ? x.status === 'odendi' && !x.ebelge : x.status === f)).sort((a, b) => b.at.localeCompare(a.at))); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    // Otomatik yenileme açık ve süresi dolmuş/dolmak üzere (3 gün) lisanslar için kayıtlı karttan çekim (simülasyon) ve uzatma
    $('#ren', el).onclick = async () => { const due = db.all('licenses', (l) => l.autoRenew && ['aktif', 'suresi-doldu'].includes(lst(l)) && leftDays(l) <= 3); if (!due.length) return toast('Yenilenecek lisans yok', ''); if (!(await confirm(`${due.length} lisans kayıtlı karttan yenilensin mi?`, { ok: 'Yenile', danger: false }))) return; for (const l of due) { const m = l.period === 'yillik' ? 12 : 1; await addPayment(l, m, false); const b = new Date(l.end > now() ? l.end : now()); b.setMonth(b.getMonth() + m); l.end = b.toISOString(); l.status = 'aktif'; licHist(l, 'Otomatik yenilendi'); } adminLog('Otomatik yenileme çalıştı', `${due.length} lisans`); db.save(); toast(`${due.length} lisans yenilendi`, 'ok'); app.refresh(); };
    bindCommon(el, app, draw); draw();
  }

  // ---------- Destek ----------
  async function ticketEditor(app, tenantId) {
    const v = await formModal({ title: 'Yeni destek kaydı', values: { tenant: tenantId, prio: 'normal', assignee: 'a3' }, fields: [{ name: 'tenant', label: 'İşletme', type: 'select', options: db.all('tenants').map((t) => ({ value: t.id, label: t.name })) }, { name: 'pid', label: 'Ürün', type: 'select', options: productOpts() }, { name: 'subject', label: 'Konu', required: true, full: true }, { name: 'text', label: 'Açıklama', type: 'textarea', required: true, full: true }, { name: 'prio', label: 'Öncelik', type: 'select', options: Object.entries(PRIO).map(([value, x]) => ({ value, label: x[0] })) }, { name: 'assignee', label: 'Atanan', type: 'select', options: db.all('users').map((u) => ({ value: u.id, label: u.name })) }] });
    if (!v) return; const tk = db.insert('tickets', { no: 'DST' + db.nextNo('dst'), tenant: v.tenant, pid: v.pid, subject: v.subject, prio: v.prio, assignee: v.assignee, status: 'acik', messages: [{ from: 'destek', text: v.text, at: now(), by: me() }] }, true); adminLog('Destek kaydı açıldı', tk.no, v.tenant); db.save(); app.refresh();
  }
  function ticketView(app, tk) {
    modal({ title: `${tk.no} · ${tk.subject}`, size: 'wide', body: `<div class="row mb">${badge(TKS[tk.status][0], TKS[tk.status][1])} ${badge(PRIO[tk.prio][0], PRIO[tk.prio][1])} ${badge(ten(tk.tenant).name, 'acc')} ${badge(prod(tk.pid).name)}</div>${tk.messages.map((m) => `<div class="card pad mb" style="${m.from === 'destek' ? 'background:var(--accent-soft);margin-left:40px' : 'margin-right:40px'}"><div class="small faint">${m.from === 'destek' ? esc(m.by || 'Destek') : esc(ten(tk.tenant).name)} · ${NS.dt(m.at)}</div><div>${esc(m.text)}</div></div>`).join('')}<textarea class="input" id="rp" placeholder="Yanıt yazın (müşteriye e-posta ile iletilir)"></textarea><div class="row mt"><select class="input" id="ts" style="max-width:200px">${Object.entries(TKS).map(([k, v]) => `<option value="${k}" ${k === tk.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><select class="input" id="ta" style="max-width:200px">${db.all('users').map((u) => `<option value="${u.id}" ${u.id === tk.assignee ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>`,
      actions: [{ label: 'Kapat' }, { label: 'Kaydet / yanıtla', cls: 'primary', onClick: (c, b) => { const t = $('#rp', b).value.trim(); if (t) { tk.messages.push({ from: 'destek', text: t, at: now(), by: me() }); const e = ten(tk.tenant).email; if (NS.integ && e) NS.integ.email(e, `${tk.no} · ${tk.subject}`, t); } tk.status = $('#ts', b).value === 'acik' && t ? 'islemde' : $('#ts', b).value; tk.assignee = $('#ta', b).value; adminLog('Destek kaydı güncellendi', tk.no, tk.tenant); db.save(); c(); app.refresh(); } }] });
  }
  function supportPage(el, p, app) {
    let f = 'aktif';
    el.innerHTML = pageHead('Destek', 'Müşteri destek talepleri, atama ve SLA takibi', `<button class="btn primary" id="nt">${icon('plus')} Destek kaydı</button>`) + `<div class="grid g4 mb">${kpi('Açık', db.all('tickets', (t) => t.status === 'acik').length, 'message', 'warn')}${kpi('İşlemde', db.all('tickets', (t) => t.status === 'islemde').length, 'clock', 'info')}${kpi('Acil', db.all('tickets', (t) => t.prio === 'acil' && ['acik', 'islemde'].includes(t.status)).length, 'alert', 'err')}${kpi('Bu ay çözülen', db.all('tickets', (t) => t.status === 'cozuldu').length, 'check', 'ok')}</div><div class="card"><div class="card-h"><div class="seg">${[['aktif', 'Aktif'], ['acik', 'Açık'], ['islemde', 'İşlemde'], ['cozuldu', 'Çözüldü'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = ticketTable(db.all('tickets', (t) => f === 'all' || (f === 'aktif' ? ['acik', 'islemde'].includes(t.status) : t.status === f))); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nt', el).onclick = () => ticketEditor(app);
    bindCommon(el, app, draw); draw();
  }

  // ---------- Duyurular & bakım ----------
  async function annEditor(app, rec, preset) {
    const v = await formModal({ title: rec ? 'Duyuru düzenle' : 'Yeni duyuru', size: 'wide', values: rec ? { ...rec, productsStr: (rec.products || []).join(','), tenantsStr: (rec.tenants || []).join(',') } : { level: 'info', active: true, until: iso(addDays(new Date(), 14)), tenantsStr: ((preset || {}).tenants || []).join(',') },
      fields: [{ name: 'title', label: 'Başlık', required: true, full: true }, { name: 'body', label: 'Mesaj', type: 'textarea', full: true }, { name: 'level', label: 'Tür', type: 'select', options: [{ value: 'info', label: 'Bilgi' }, { value: 'ok', label: 'Yenilik' }, { value: 'warn', label: 'Uyarı' }, { value: 'err', label: 'Kritik' }] }, { name: 'until', label: 'Yayın bitişi', type: 'date' }, { name: 'productsStr', label: 'Ürünler (boş = tümü)', type: 'select', options: [{ value: '', label: 'Tüm ürünler' }, ...productOpts()] }, { name: 'tenantsStr', label: 'İşletme (boş = tümü)', type: 'select', options: [{ value: '', label: 'Tüm işletmeler' }, ...db.all('tenants').map((t) => ({ value: t.id, label: t.name }))] }, { name: 'active', label: 'Yayında', type: 'checkbox' }, { name: 'email', label: 'Hedef işletmelere e-posta ile de gönder', type: 'checkbox' }] });
    if (!v) return;
    const data = { title: v.title, body: v.body, level: v.level, until: v.until, active: v.active, products: v.productsStr ? [v.productsStr] : [], tenants: v.tenantsStr ? [v.tenantsStr] : [] };
    if (rec) Object.assign(rec, data); else db.insert('announcements', data, true);
    if (v.email && NS.integ) db.all('tenants', (t) => (!data.tenants.length || data.tenants.includes(t.id)) && t.status === 'aktif' && t.email).slice(0, 50).forEach((t) => NS.integ.email(t.email, data.title, data.body));
    adminLog(rec ? 'Duyuru güncellendi' : 'Duyuru yayınlandı', data.title); db.save(); app.refresh && app.refresh();
  }
  function announcePage(el, p, app) {
    const mt = db.data.maintenance || (db.data.maintenance = {});
    el.innerHTML = pageHead('Duyurular & Bakım', 'Ürünlerin üstünde görünen duyuru bantları ve planlı bakım modu', `<button class="btn primary" id="na">${icon('plus')} Duyuru</button>`) + `
      <div class="card mb"><div class="card-h"><h3>Duyurular</h3></div>${table({ rows: db.all('announcements').sort((a, b) => b.created.localeCompare(a.created)), empty: 'Duyuru yok', columns: [{ label: 'Başlık', render: (a) => `<b>${esc(a.title)}</b><div class="small faint">${esc(a.body || '')}</div>` }, { label: 'Hedef', render: (a) => `<span class="small">${a.products.length ? a.products.map((x) => esc(prod(x).name)).join(', ') : 'Tüm ürünler'} · ${a.tenants.length ? a.tenants.map((x) => esc(ten(x).name)).join(', ') : 'tüm işletmeler'}</span>` }, { label: 'Bitiş', render: (a) => (a.until ? NS.date(a.until) : '-') }, { label: 'Durum', render: (a) => (a.active && (!a.until || a.until >= today()) ? badge('Yayında', 'ok') : badge('Pasif')) }], actions: [{ icon: 'edit', act: 'ae' }, { icon: 'trash', act: 'ad', title: 'Sil' }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('wrench')} Bakım modu</h3><span class="small muted">Açıkken ürünün üstünde bakım bandı gösterilir; "erişimi kapat" seçilirse ürün kilitlenir.</span></div>${table({ rows: productOpts().map((o) => ({ id: o.value, name: o.label, ...(mt[o.value] || {}) })), columns: [{ label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b>` }, { label: 'Durum', render: (x) => (x.on ? badge(x.block ? 'Bakımda · erişim kapalı' : 'Bakım bandı açık', x.block ? 'err' : 'warn') : badge('Normal', 'ok')) }, { label: 'Mesaj', render: (x) => `<span class="small">${esc(x.msg || '')}</span>` }], actions: [{ label: 'Bakım', act: 'mon', show: (x) => !x.on }, { label: 'Bitir', act: 'moff', show: (x) => x.on }] })}</div>`;
    $('#na', el).onclick = () => annEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act; const id = b.dataset.id;
      if (a === 'ae') return annEditor(app, db.get('announcements', id));
      if (a === 'ad') { if (await confirm('Duyuru silinsin mi?')) { db.remove('announcements', id); app.refresh(); } return; }
      if (a === 'mon') { const v = await formModal({ title: `${prod(id).name} — bakım modu`, fields: [{ name: 'msg', label: 'Kullanıcılara gösterilecek mesaj', full: true, value: 'Bu gece 02:00–04:00 arasında planlı bakım yapılacaktır.' }, { name: 'block', label: 'Bakım süresince erişimi kapat', type: 'checkbox' }] }); if (!v) return; mt[id] = { on: true, msg: v.msg, block: v.block, at: now(), by: me() }; adminLog('Bakım modu açıldı', prod(id).name); }
      else { mt[id] = { on: false }; adminLog('Bakım modu kapatıldı', prod(id).name); }
      db.save(); app.refresh();
    });
  }
  function resellersPage(el, p, app) {
    NS.crud(el, app, { col: 'resellers', title: 'Bayiler', sub: 'Bayi ağı, bağlı işletmeler ve komisyon', single: 'Bayi', addLabel: 'Yeni bayi', emptyIcon: 'users', fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'city', label: 'Şehir' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'pct', label: 'Komisyon (%)', type: 'number' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { pct: 20, active: true },
      columns: [{ key: 'name', label: 'Bayi', render: (r) => `<b>${esc(r.name)}</b><div class="small faint">${esc(r.city || '')}</div>` }, { label: 'İşletme', cls: 'right', render: (r) => db.all('tenants', (t) => t.reseller === r.id).length }, { label: 'Aylık ciro', cls: 'right', render: (r) => money(sum(db.all('tenants', (t) => t.reseller === r.id).flatMap((t) => tLic(t.id)), monthly)) }, { label: 'Aylık komisyon', cls: 'right', render: (r) => `<b>${money(sum(db.all('tenants', (t) => t.reseller === r.id).flatMap((t) => tLic(t.id)), monthly) * (r.pct || 0) / 100)}</b>` }, { key: 'pct', label: 'Oran', cls: 'right', render: (r) => '%' + r.pct }, { label: 'Durum', render: (r) => (r.active ? badge('Aktif', 'ok') : badge('Pasif')) }] });
  }

  const ROLES = { admin: 'Süper yönetici', satis: 'Satış', destek: 'Destek', finans: 'Finans' };
  syncMarket(true);
  NS.shell({
    id: 'yonetim', integrations: ['efatura', 'email', 'sms', 'whatsapp', 'payment', 'webhook', 'backup'], name: 'Yönetim Merkezi', tagline: 'Lisans · İşletme · Log', icon: 'shield', accent: '#4f46e5', db, home: 'ozet', auth: { roles: ROLES }, demo: false, backUrl: '../index.html', titles: { isletme: 'İşletme' },
    nav: [{ sec: 'Genel' }, { id: 'ozet', label: 'Kontrol Paneli', icon: 'home' },
      { sec: 'Müşteriler' }, { id: 'isletmeler', label: 'İşletmeler', icon: 'building' }, { id: 'lisanslar', label: 'Lisanslar', icon: 'key', roles: ['admin', 'satis', 'finans'] }, { id: 'kullanicilar', label: 'Kullanıcılar', icon: 'users', roles: ['admin', 'destek'] },
      { sec: 'İzleme' }, { id: 'loglar', label: 'Log Takibi', icon: 'zap', roles: ['admin', 'destek'] }, { id: 'destek', label: 'Destek', icon: 'message' },
      { sec: 'Finans' }, { id: 'tahsilat', label: 'Tahsilat & Abonelik', icon: 'wallet', roles: ['admin', 'finans'] }, { id: 'bayiler', label: 'Bayiler', icon: 'store', roles: ['admin', 'satis', 'finans'] },
      { sec: 'Sistem' }, { id: 'duyuru', label: 'Duyurular & Bakım', icon: 'bell', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, isletmeler: tenantsPage, isletme: tenantPage, lisanslar: licensesPage, kullanicilar: usersPage, loglar: logsPage, destek: supportPage, tahsilat: paymentsPage, bayiler: resellersPage, duyuru: announcePage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Lisans politikası' }, { name: 'trialDays', label: 'Deneme süresi (gün)', type: 'number' }, { name: 'graceDays', label: 'Süre bitiminden sonra ek süre (gün)', type: 'number' }, { name: 'warnDays', label: 'Bitiş uyarısı (gün önce)', type: 'number' }, { name: 'autoSuspend', label: 'Ek süre bitince lisansı otomatik askıya al', type: 'checkbox', full: true }, { type: 'section', label: 'Güvenlik' }, { name: 'maxFailedPin', label: 'Hesap kilidi için hatalı deneme sayısı', type: 'number' }, { name: 'sessionHours', label: 'Oturum süresi (saat)', type: 'number' }, { name: 'supportPhone', label: 'Destek hattı (kilit ekranında görünür)' }] }),
    },
  });
})();
