/* NEBSOFT Adisyon — Yemek Platformu Merkezi: Yemeksepeti, Getir Yemek, Trendyol Yemek, Migros Yemek.
   Platform başına bağlantı, restoran aç/kapat ve yoğunluk modu, hazırlık süresi, menü fiyat farkı ve ürün kapatma,
   komisyon/hakediş, müşteri yorumları. app.js sayfa olarak kullanır. */
window.PLATHUB = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;
  const PL = {
    'Yemeksepeti': { key: 'ys', color: '#ea004b', commission: 25, payoutDays: 15 },
    'Getir Yemek': { key: 'getir', color: '#5d3ebc', commission: 22, payoutDays: 14 },
    'Trendyol Yemek': { key: 'ty', color: '#f27a1a', commission: 20, payoutDays: 7 },
    'Migros Yemek': { key: 'migros', color: '#f28c00', commission: 18, payoutDays: 14 },
  };
  const NAMES = Object.keys(PL);
  let db, totals;
  const cfg = (n) => ({ ...PL[n], ...((db.data.platforms || {})[n] || {}) });
  const tag = (n) => (PL[n] ? `<span class="badge" style="background:${PL[n].color};color:#fff;border:0">${esc(n)}</span>` : badge(n || 'Telefon'));
  const log = (n, a, d) => { db.data.platLog = db.data.platLog || []; db.data.platLog.unshift({ id: NS.uid(), at: new Date().toISOString(), p: n, a, d }); if (db.data.platLog.length > 200) db.data.platLog.length = 200; };
  const send = (n, action, payload) => { if (NS.integ && NS.integ.isOn('yemekplatform')) NS.integ.call('yemekplatform', action, { platform: n, ...payload }, { silent: true }); log(n, action, payload && payload.note ? payload.note : ''); };
  const pPrice = (m, n) => { const c = cfg(n); return Math.ceil(m.price * (1 + (Number(c.markup) || 0) / 100)); };

  function ensure(d, totalsFn) {
    db = d; totals = totalsFn;
    if (db.data.platforms) return;
    db.data.platforms = { 'Yemeksepeti': { connected: true, restId: 'ys-48211', open: true, prep: 25, markup: 15, auto: true }, 'Getir Yemek': { connected: true, restId: 'gt-90233', open: true, prep: 25, markup: 12, auto: true }, 'Trendyol Yemek': { connected: true, restId: 'tyg-3310', open: true, prep: 30, markup: 10, auto: false } };
    db.data.platOff = {};
    const R = [['Yemekler sıcak ve lezzetliydi, kurye çok hızlıydı.', 5], ['Porsiyon biraz küçüktü ama tadı güzel.', 4], ['Sipariş 50 dakikada geldi, soğumuştu.', 2], ['Her zamanki gibi harika!', 5], ['Sos eksik gönderildi.', 3], ['Paketleme çok özenliydi, teşekkürler.', 5]];
    db.data.platReviews = R.map(([text, stars], i) => ({ id: NS.uid(), p: NAMES[i % 3], text, stars, name: ['E*** K.', 'M*** A.', 'S*** T.', 'B*** Ö.', 'C*** D.', 'H*** Y.'][i], at: new Date(Date.now() - (i * 9 + 2) * 3600e3).toISOString(), reply: i > 3 ? 'Güzel yorumunuz için teşekkür ederiz, afiyet olsun!' : '' }));
    db.data.platLog = []; NAMES.slice(0, 3).forEach((n) => log(n, 'menu-senkron', `${db.all('menu').length} ürün`));
    db.save();
  }

  function hubPage(el, p, app) {
    const since = iso(addDays(new Date(), -30));
    const cs = db.all('checks', (c) => c.type === 'paket' && PL[c.source] && (c.opened || '').slice(0, 10) >= since && !c.cancelled);
    const rows = NAMES.map((n) => { const os = cs.filter((c) => c.source === n); const gross = sum(os, (c) => totals(c).total); const c = cfg(n); const com = Math.round(gross * (Number(c.commission) || 0)) / 100; const rv = db.all('platReviews', (r) => r.p === n); return { id: n, n, c, cnt: os.length, gross, com, net: gross - com, avg: rv.length ? sum(rv, (r) => r.stars) / rv.length : 0, off: Object.keys((db.data.platOff || {})[n] || {}).length }; });
    const todayCs = db.all('checks', (c) => c.type === 'paket' && PL[c.source] && (c.opened || '').slice(0, 10) === today());
    const open = rows.filter((r) => r.c.connected && r.c.open).length;
    el.innerHTML = pageHead('Yemek Platformları', 'Yemeksepeti, Getir, Trendyol Yemek ve Migros Yemek — tek ekrandan', `<button class="btn ${open ? 'danger' : 'primary'}" id="all">${icon(open ? 'x' : 'check')} ${open ? 'Tüm platformlarda kapat' : 'Tüm platformlarda aç'}</button><button class="btn" id="busy">${icon('clock')} Yoğunluk modu (+15 dk)</button>`) + `
      ${NS.integ && NS.integ.isOn('yemekplatform') ? '' : `<div class="card pad mb row" style="border-color:var(--warn)">${icon('info')}<span class="grow small">Demo / simülasyon modu: işlemler kaydedilir ama platforma gönderilmez. Canlı için <a href="#/entegrasyonlar">Entegrasyonlar &gt; Yemek platformları</a> bağlantısını açın.</span></div>`}
      <div class="grid g4 mb">${kpi('Bugün platform siparişi', todayCs.length, 'bag', 'info')}${kpi('Platform cirosu (30 gün)', money(sum(rows, (r) => r.gross)), 'wallet')}${kpi('Komisyon (30 gün)', money(sum(rows, (r) => r.com)), 'percent', 'warn')}${kpi('Açık platform', `${open} / ${rows.filter((r) => r.c.connected).length}`, 'store', open ? 'ok' : 'err')}</div>
      <div class="card mb">${table({ rows, columns: [
        { label: 'Platform', render: (r) => `${tag(r.n)}<div class="small faint mt">${r.c.connected ? 'Restoran no ' + esc(r.c.restId || '-') : 'Bağlı değil'}</div>` },
        { label: 'Durum', render: (r) => (r.c.connected ? `<button class="btn sm ${r.c.open ? 'ok' : 'danger'}" data-tg="${esc(r.n)}">${r.c.open ? 'Açık' : 'Kapalı'}</button>${r.c.auto ? ` ${badge('Oto kabul', 'info')}` : ''}` : badge('Pasif')) },
        { label: 'Hazırlık', render: (r) => (r.c.connected ? `${r.c.prep} dk` : '-') },
        { label: 'Fiyat farkı', render: (r) => (r.c.connected ? `+%${Number(r.c.markup) || 0}` : '-') },
        { label: 'Kapalı ürün', cls: 'right', render: (r) => (r.off ? `<span style="color:var(--warn)">${r.off}</span>` : '0') },
        { label: 'Sipariş (30g)', cls: 'right', key: 'cnt' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.gross) }, { label: 'Komisyon', cls: 'right', render: (r) => `${money(r.com)}<div class="small faint">%${Number(r.c.commission) || 0}</div>` }, { label: 'Net', cls: 'right', render: (r) => `<b>${money(r.net)}</b>` },
        { label: 'Puan', cls: 'right', render: (r) => (r.avg ? `<span style="white-space:nowrap;color:#f59e0b">★ <b style="color:var(--text)">${r.avg.toFixed(1)}</b></span>` : '-') },
      ], actions: [{ icon: 'settings', act: 'pcfg', title: 'Bağlantı ve ayarlar' }] })}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Menü: platformda kapat / aç</h3><span class="small muted">Malzemesi biten ürünü tüm platformlarda tek tıkla kapatın</span></div><div class="card-b" style="max-height:420px;overflow:auto">${db.all('menu', (m) => m.active !== false).map((m) => `<div class="list-item small"><span class="grow"><b>${esc(m.name)}</b><div class="faint">${money(m.price)} · ${NAMES.filter((n) => cfg(n).connected).map((n) => `${esc(n.split(' ')[0])} ${money(pPrice(m, n))}`).join(' · ')}</div></span>${NAMES.filter((n) => cfg(n).connected).map((n) => { const off = ((db.data.platOff || {})[n] || {})[m.id]; return `<button class="btn sm ${off ? '' : 'ghost'}" data-off="${esc(n)}|${m.id}" title="${esc(n)}" style="${off ? 'color:var(--err)' : ''}">${off ? 'Kapalı' : esc(n.split(' ')[0])}</button>`; }).join('')}</div>`).join('')}</div></div>
        <div class="card"><div class="card-h"><h3>Müşteri yorumları</h3></div><div class="card-b" style="max-height:420px;overflow:auto">${db.all('platReviews').sort((a, b) => (!!a.reply - !!b.reply) || b.at.localeCompare(a.at)).map((r) => `<div class="list-item" style="align-items:flex-start"><div class="grow"><div class="row nw" style="gap:6px">${tag(r.p)}<span style="color:#f59e0b">${'★'.repeat(r.stars)}</span><span class="small faint">${esc(r.name)} · ${NS.ago(r.at)}</span></div><div class="small mt">${esc(r.text)}</div>${r.reply ? `<div class="small" style="color:var(--accent)">↳ ${esc(r.reply)}</div>` : `<div class="row nw mt" style="gap:6px"><input class="input grow" id="rv-${r.id}" placeholder="${r.stars <= 3 ? 'Özür ve telafi yanıtı yazın' : 'Teşekkür yanıtı'}" value="${r.stars <= 3 ? 'Yaşadığınız sorun için özür dileriz; bir sonraki siparişinizde telafi etmek isteriz.' : 'Güzel yorumunuz için teşekkür ederiz, afiyet olsun!'}"><button class="btn sm primary" data-rv="${r.id}">Yanıtla</button></div>`}</div></div>`).join('')}</div></div></div>
      <div class="card mt"><div class="card-h"><h3>İşlem günlüğü</h3></div><div class="card-b small" style="max-height:220px;overflow:auto">${(db.data.platLog || []).slice(0, 30).map((x) => `<div class="list-item">${tag(x.p)}<span class="grow">${esc(x.a)}${x.d ? ' · ' + esc(x.d) : ''}</span><span class="faint">${NS.ago(x.at)}</span></div>`).join('') || '<span class="faint">Kayıt yok</span>'}</div></div>`;
    const refresh = () => { db.save(); app.refresh(); };
    on(el, 'click', '[data-tg]', (e, b) => { const n = b.dataset.tg; const c = db.data.platforms[n]; c.open = !c.open; send(n, 'restoran-durum', { open: c.open, note: c.open ? 'Açıldı' : 'Kapatıldı' }); toast(`${n}: restoran ${c.open ? 'açıldı' : 'kapatıldı'}`, c.open ? 'ok' : ''); refresh(); });
    $('#all', el).onclick = async () => { const to = !open; if (!to && !(await confirm('Tüm platformlarda restoran kapatılsın mı? Yeni sipariş gelmez.', { ok: 'Kapat' }))) return; NAMES.filter((n) => cfg(n).connected).forEach((n) => { db.data.platforms[n].open = to; send(n, 'restoran-durum', { open: to, note: to ? 'Açıldı' : 'Kapatıldı' }); }); refresh(); };
    $('#busy', el).onclick = () => { NAMES.filter((n) => cfg(n).connected).forEach((n) => { const c = db.data.platforms[n]; c.prep = (Number(c.prep) || 25) + 15; send(n, 'hazirlik-suresi', { minutes: c.prep, note: `${c.prep} dk` }); }); toast('Hazırlık süresi tüm platformlarda 15 dk artırıldı', 'ok'); refresh(); };
    on(el, 'click', '[data-off]', (e, b) => { const [n, mid] = b.dataset.off.split('|'); db.data.platOff = db.data.platOff || {}; const o = (db.data.platOff[n] = db.data.platOff[n] || {}); const m = db.get('menu', mid); if (o[mid]) delete o[mid]; else o[mid] = true; send(n, 'urun-durum', { item: mid, active: !o[mid], note: `${m.name} ${o[mid] ? 'kapatıldı' : 'açıldı'}` }); refresh(); });
    on(el, 'click', '[data-rv]', (e, b) => { const r = db.get('platReviews', b.dataset.rv); const t = $('#rv-' + r.id, el).value.trim(); if (t.length < 5) return toast('Yanıt yazın', 'err'); r.reply = t; send(r.p, 'yorum-yanit', { note: r.name }); toast('Yanıt gönderildi', 'ok'); refresh(); });
    on(el, 'click', '[data-act="pcfg"]', (e, b) => {
      const n = b.dataset.id; const c = cfg(n);
      modal({ title: `${n} bağlantısı`, body: `<div class="form-grid">${NS.fieldsHtml([{ name: 'restId', label: 'Restoran / şube no', value: c.restId || '' }, { name: 'apiKey', label: 'API anahtarı', value: c.apiKey || '' }, { name: 'prep', label: 'Hazırlık süresi (dk)', type: 'number', value: c.prep || 25 }, { name: 'markup', label: 'Menü fiyat farkı %', type: 'number', value: c.markup ?? 0 }, { name: 'commission', label: 'Komisyon % (sözleşmeye göre)', type: 'number', step: '0.01', value: c.commission }, { name: 'payoutDays', label: 'Hakediş vadesi (gün)', type: 'number', value: c.payoutDays }, { name: 'auto', label: 'Siparişleri otomatik kabul et ve mutfağa düşür', type: 'checkbox', value: c.auto }])}</div>`,
        actions: [{ label: 'Vazgeç' }, { label: c.connected ? 'Kaydet' : 'Bağlan', cls: 'primary', onClick: (close, bd) => { const v = NS.readForm(bd); if (!c.connected && !v.restId) return toast('Restoran no gerekli', 'err'); db.data.platforms[n] = { ...(db.data.platforms[n] || {}), ...v, connected: true, open: c.connected ? c.open : true }; if (!c.connected) log(n, 'Bağlantı', 'Kuruldu'); else send(n, 'ayar', { note: `hazırlık ${v.prep} dk, fiyat +%${v.markup}` }); close(); refresh(); } }] });
    });
  }
  return { PL, ensure, tag, nav: { id: 'platformlar', label: 'Yemek Platformları', icon: 'store', roles: ['admin', 'kasa'] }, routes: { platformlar: hubPage } };
})();
