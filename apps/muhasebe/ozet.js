/* NEBSOFT Ön Muhasebe — Finansal özet (ana sayfa) ve akıllı uyarılar
   • Kartlar kullanıcı başına seçilir ve sıralanır ("Özelleştir"); ayar S().dash[kullanıcı] içinde, eşitlemeyle diğer cihazlara gider.
     Ayar yoksa varsayılan düzen (önceki özet ekranıyla aynı kartlar + uyarılar) gösterilir.
   • Akıllı uyarılar: mükerrer fatura şüphesi, risk limiti aşımı, kritik nakit (13 haftalık tahminde bakiye eksiye düşüyor),
     vadesi bugün dolanlar. Özette kart olarak; ayrıca günde bir kez bildirim (bildirim merkezi, 'akilli-uyari'). */
window.MUHOZET = (function () {
  'use strict';
  const { esc, $, on, icon, money, table, badge, pageHead, kpi, chart, sum, iso, today, addDays, daysBetween, toast, modal } = NS;
  let X; // { db, S, cari, acc, invTotals, paidOf, invStatus, isSale, isBuy, accBalance, tlNet, riskOver, docEditor, payModal }
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const B = () => window.MUHBOYUT;
  const inv = (pred) => X.db.all('invoices', (i) => B().pass(i) && pred(i));
  const rem = (i) => r2(X.invTotals(i).tl - X.paidOf(i));

  // ---------- Akıllı uyarılar ----------
  const pairKey = (a, b) => [a.id, b.id].sort().join('|');
  function duplicates() {
    const ok = new Set(X.S().dupOk || []); const from = iso(addDays(new Date(), -60)); const out = [];
    const list = inv((i) => !i.iade && (i.kind === 'satis' || i.kind === 'alis') && i.date >= from).sort((a, b) => a.date.localeCompare(b.date));
    const by = new Map(); list.forEach((i) => { const k = `${i.kind}|${i.cari}|${Math.round(X.invTotals(i).tl * 100)}`; if (!by.has(k)) by.set(k, []); by.get(k).push(i); });
    by.forEach((arr) => { for (let a = 0; a < arr.length; a++) for (let b = a + 1; b < arr.length; b++) { if (daysBetween(arr[a].date, arr[b].date) > 3) break; if (!ok.has(pairKey(arr[a], arr[b])) && !(arr[a].recurring || arr[b].recurring || arr[a].fromRecurring || arr[b].fromRecurring)) out.push([arr[a], arr[b]]); } });
    return out;
  }
  function alerts() {
    const out = []; const t = today();
    duplicates().forEach(([a, b]) => out.push({ key: 'dup', tone: 'warn', icon: 'layers', text: `Mükerrer olabilir: ${esc(X.cari(a.cari).name)} — ${esc(a.no)} ve ${esc(b.no)} (${money(X.invTotals(a).tl)}, ${NS.date(a.date)} / ${NS.date(b.date)})`, href: '#/faturalar/' + (a.kind === 'alis' ? 'alis' : 'satis'), dup: pairKey(a, b) }));
    X.db.all('caris').forEach((c) => { const o = X.riskOver(c); if (o > 0) out.push({ key: 'risk', tone: 'err', icon: 'alert', text: `Risk limiti aşıldı: <b>${esc(c.name)}</b> — limit ${money(c.riskLimit)}, aşım ${money(o)}`, href: '#/cariler/' + c.id }); });
    try {
      const cf = window.MUHANALIZ.cashflow(); const w = cf.weeks.find((x) => x.bal < 0);
      if (w) out.push({ key: 'nakit', tone: 'err', icon: 'wallet', text: `Kritik nakit: tahmine göre ${NS.date(w.from)} haftasında kasa+banka toplamı <b>${money(w.bal)}</b> olacak (açık fatura vadeleri, çek/senet ve tekrarlayan faturalara göre)`, href: '#/analiz/nakit' });
    } catch (e) { /* analiz modülü yoksa atlanır */ }
    const dueT = inv((i) => !i.iade && (X.isSale(i) || X.isBuy(i)) && i.due === t && X.invStatus(i) !== 'odendi' && rem(i) > 0);
    const inn = dueT.filter(X.isSale), outn = dueT.filter(X.isBuy);
    if (inn.length) out.push({ key: 'bugun', tone: 'info', icon: 'clock', text: `Bugün vadesi dolan ${inn.length} alacak: ${money(sum(inn, rem))}`, href: '#/faturalar/satis' });
    if (outn.length) out.push({ key: 'bugun', tone: 'warn', icon: 'clock', text: `Bugün vadesi dolan ${outn.length} ödeme: ${money(sum(outn, rem))}`, href: '#/faturalar/alis' });
    return out;
  }
  // Günde bir kez bildirim (aynı tür uyarı için); tarayıcı deposu kullanılamıyorsa bildirim gönderilmez (her açılışta tekrar etmesin)
  function notifyAlerts() {
    if (!NS.notify) return; const t = today(); const groups = {};
    alerts().forEach((a) => { (groups[a.key] = groups[a.key] || []).push(a); });
    const TT = { dup: 'Mükerrer fatura şüphesi', risk: 'Risk limiti aşımı', nakit: 'Kritik nakit uyarısı', bugun: 'Vadesi bugün dolanlar' };
    Object.entries(groups).forEach(([k, arr]) => { const sk = `nebsoft:muh:uyari:${k}`; let last = null; try { last = localStorage.getItem(sk); } catch (e) { return; } if (last === t) return; try { localStorage.setItem(sk, t); } catch (e) { return; }
      NS.notify('akilli-uyari', { title: TT[k], body: arr.map((a) => a.text.replace(/<[^>]+>/g, '')).join(' · ').slice(0, 240), href: arr[0].href }); });
  }

  // ---------- Kartlar ----------
  const CARDS = {
    hesaplar: { label: 'Kasa ve banka hesapları', html: () => { const accs = X.db.all('accounts', (a) => !B().current() || a.branch === B().current()); return accs.length ? `<div class="grid g4 mb">${accs.map((a) => `<div class="acc-card" style="background:linear-gradient(135deg,${a.color},color-mix(in srgb,${a.color} 60%,#000))"><div class="small" style="opacity:.85">${icon(a.type === 'kasa' ? 'cash' : a.type === 'kart' ? 'card' : 'building')} ${esc(a.name)}</div><div class="v">${money(X.accBalance(a.id))}</div></div>`).join('')}</div>` : ''; } },
    ozet: { label: 'Alacak, borç, satış, geciken', html: () => {
      const mo = today().slice(0, 7); const sales = inv((i) => X.isSale(i) && i.date.slice(0, 7) === mo); const overdue = inv((i) => X.isSale(i) && X.invStatus(i) === 'gecikti');
      // Şube seçiliyse alacak/borç o şubenin açık faturalarından; değilse cari bakiyelerinden (açılış, çek vb. dahil)
      let recv, pay; if (B().current()) { recv = sum(inv((i) => X.isSale(i) && X.invStatus(i) !== 'odendi'), rem); pay = sum(inv((i) => X.isBuy(i) && X.invStatus(i) !== 'odendi'), rem); }
      else { const bal = X.db.all('caris').map((c) => X.cariBalance(c.id)); recv = sum(bal.filter((x) => x > 0)); pay = -sum(bal.filter((x) => x < 0)); }
      return `<div class="grid g4 mb">${kpi('Toplam alacak', money(recv), 'trend', 'ok')}${kpi('Toplam borç', money(pay), 'minus', 'err')}${kpi('Bu ay satış', money(sum(sales, (i) => X.invTotals(i).tl)), 'receipt', 'info', `<div class="small faint">${sales.length} fatura</div>`)}${kpi('Vadesi geçen alacak', money(sum(overdue, rem)), 'alert', 'warn', `<div class="small faint">${overdue.length} fatura</div>`)}</div>`; } },
    uyarilar: { label: 'Akıllı uyarılar', html: () => { const a = alerts(); return `<div class="card mb"><div class="card-h"><h3>${icon('bell')} Uyarılar</h3><span class="small muted">${a.length ? a.length + ' uyarı' : ''}</span></div><div class="card-b">${a.length ? a.slice(0, 12).map((x) => `<div class="row" style="gap:10px;padding:6px 0;border-bottom:1px solid var(--border)"><span class="badge ${x.tone}">${icon(x.icon)}</span><a class="grow" href="${x.href}" style="color:inherit">${x.text}</a>${x.dup ? `<button class="btn sm ghost" data-dupok="${x.dup}" title="Bu iki fatura ayrı işlemdir">Mükerrer değil</button>` : ''}</div>`).join('') + (a.length > 12 ? `<div class="small muted mt">+${a.length - 12} uyarı daha</div>` : '') : '<div class="muted small">Uyarı yok — mükerrer fatura, risk limiti, nakit tahmini ve bugünkü vadeler kontrol edildi.</div>'}</div></div>`; } },
    grafik: { label: 'Gelir / gider grafiği (6 ay)', html: () => {
      const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return iso(d).slice(0, 7); });
      const tx = (type, m) => sum(X.db.all('txns', (t) => t.type === type && t.date.slice(0, 7) === m && B().pass(t)), (t) => t.amount);
      const incm = months.map((m) => sum(inv((i) => X.isSale(i) && i.date.slice(0, 7) === m), X.tlNet) - sum(inv((i) => i.iade && i.kind === 'alis' && i.date.slice(0, 7) === m), X.tlNet) + tx('gelir', m));
      const exp = months.map((m) => sum(inv((i) => X.isBuy(i) && i.date.slice(0, 7) === m), X.tlNet) - sum(inv((i) => i.iade && i.kind === 'satis' && i.date.slice(0, 7) === m), X.tlNet) + tx('gider', m));
      return `<div class="card mb"><div class="card-h"><h3>Gelir / gider (KDV hariç, 6 ay)</h3></div><div class="card-b">${chart.line([{ name: 'Gelir', values: incm, color: '#16a34a' }, { name: 'Gider', values: exp, color: '#dc2626' }], months.map((m) => NS.MONTHS[Number(m.slice(5)) - 1].slice(0, 3)), { format: money })}</div></div>`; } },
    geciken: { label: 'Vadesi geçen alacaklar', html: () => { const overdue = inv((i) => X.isSale(i) && X.invStatus(i) === 'gecikti'); return `<div class="card mb"><div class="card-h"><h3>${icon('alert')} Vadesi geçen alacaklar</h3></div>${table({ rows: overdue.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8), empty: 'Gecikmiş alacak yok', columns: [{ label: 'Cari', render: (i) => `<b>${esc(X.cari(i.cari).name)}</b><div class="small faint">${esc(i.no)}</div>` }, { label: 'Vade', render: (i) => `${NS.date(i.due)}<div class="small" style="color:var(--err)">${daysBetween(i.due, new Date())} gün</div>` }, { label: 'Kalan', cls: 'right', render: (i) => `<b>${money(rem(i))}</b>` }], actions: [{ label: 'Tahsil et', act: 'col' }] })}</div>`; } },
    odenecek: { label: '15 gün içinde ödenecekler', html: () => { const up = inv((i) => X.isBuy(i) && ['acik', 'kismi', 'gecikti'].includes(X.invStatus(i)) && i.due <= iso(addDays(new Date(), 15))); return `<div class="card mb"><div class="card-h"><h3>${icon('clock')} 15 gün içinde ödenecekler</h3></div>${table({ rows: up.sort((a, b) => a.due.localeCompare(b.due)), empty: 'Yaklaşan ödeme yok', columns: [{ label: 'Tedarikçi', render: (i) => `<b>${esc(X.cari(i.cari).name)}</b><div class="small faint">${esc(i.no)}</div>` }, { label: 'Vade', render: (i) => NS.date(i.due) }, { label: 'Tutar', cls: 'right', render: (i) => `<b>${money(rem(i))}</b>` }], actions: [{ label: 'Öde', act: 'pay' }] })}</div>`; } },
    nakit: { label: 'Nakit akışı tahmini (13 hafta)', html: () => { let cf; try { cf = window.MUHANALIZ.cashflow(); } catch (e) { return ''; } const low = cf.weeks.reduce((a, w) => (w.bal < a.bal ? w : a), cf.weeks[0]); return `<div class="card mb"><div class="card-h"><h3>${icon('wallet')} Nakit akışı tahmini</h3><a class="btn sm" href="#/analiz/nakit">Ayrıntı</a></div><div class="card-b"><div class="grid g3">${kpi('Bugün', money(cf.start), 'cash')}${kpi('13 hafta sonra', money(cf.weeks[12].bal), 'trend', cf.weeks[12].bal < 0 ? 'err' : 'ok')}${kpi('En düşük', money(low.bal), 'alert', low.bal < 0 ? 'err' : 'info', `<div class="small faint">${NS.date(low.from)} haftası</div>`)}</div><p class="small muted mt">Tahmindir: açık fatura vadeleri, portföydeki çek/senetler ve tekrarlayan faturalar. Tüm şubeler.</p></div></div>`; } },
    projeler: { label: 'Proje kârlılığı (bu yıl)', html: () => { const ps = B().projects(); if (!ps.length) return ''; const m = B().pnl('project', today().slice(0, 4) + '-01-01', today()); const rows = ps.map((p) => ({ id: p.id, p, r: m.get(p.id) || { inc: 0, exp: 0, profit: 0 } })).sort((a, b) => b.r.profit - a.r.profit).slice(0, 6); return `<div class="card mb"><div class="card-h"><h3>${icon('layers')} Projeler</h3><a class="btn sm" href="#/karlilik">Tümü</a></div>${table({ rows, columns: [{ label: 'Proje', render: (o) => `<b>${esc(o.p.name)}</b>` }, { label: 'Gelir', cls: 'right', render: (o) => money(o.r.inc) }, { label: 'Gider', cls: 'right', render: (o) => money(o.r.exp) }, { label: 'Kâr', cls: 'right', render: (o) => `<b style="color:var(${o.r.profit < 0 ? '--err' : '--ok'})">${money(o.r.profit)}</b>` }] })}</div>`; } },
  };
  const DEF = ['hesaplar', 'ozet', 'uyarilar', 'grafik', 'geciken', 'odenecek', 'nakit', 'projeler'];
  const uid = () => (NS.currentUser ? NS.currentUser.id : 'genel');
  // Kayıtlı düzen + sonradan eklenen kartlar (sona, görünür) — eski ayar bozulmaz
  function layout() { const d = (X.S().dash || {})[uid()]; if (!d) return { order: DEF.slice(), hidden: [] }; const order = (d.order || []).filter((k) => CARDS[k]); DEF.forEach((k) => { if (!order.includes(k)) order.push(k); }); return { order, hidden: (d.hidden || []).filter((k) => CARDS[k]) }; }
  function saveLayout(l) { const s = X.S(); s.dash = s.dash || {}; s.dash[uid()] = l; X.db.save(); }
  function customize(after) {
    const l = layout(); const half = ['geciken', 'odenecek'];
    const body = () => `<div id="dz">${l.order.map((k, i) => `<div class="row" style="gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><label class="row grow" style="gap:8px;cursor:pointer"><input type="checkbox" data-vis="${k}" ${l.hidden.includes(k) ? '' : 'checked'}> ${esc(CARDS[k].label)}</label><button class="btn sm ghost icon" data-mv="${i}" data-d="-1" ${i ? '' : 'disabled'} title="Yukarı">↑</button><button class="btn sm ghost icon" data-mv="${i}" data-d="1" ${i < l.order.length - 1 ? '' : 'disabled'} title="Aşağı">↓</button></div>`).join('')}</div><p class="small muted">Düzen yalnızca sizin kullanıcınız için saklanır.${half.length ? ' "Vadesi geçen alacaklar" ile "15 gün içinde ödenecekler" geniş ekranda yan yana durur.' : ''}</p>`;
    modal({ title: 'Özeti özelleştir', body: body(), onOpen: (b) => {
      on(b, 'change', '[data-vis]', (e, c) => { const k = c.dataset.vis; l.hidden = c.checked ? l.hidden.filter((x) => x !== k) : [...l.hidden, k]; });
      on(b, 'click', '[data-mv]', (e, t) => { const i = Number(t.dataset.mv), j = i + Number(t.dataset.d); [l.order[i], l.order[j]] = [l.order[j], l.order[i]]; $('#dz', b).outerHTML = body().replace(/<p[\s\S]*$/, ''); });
    }, actions: [{ label: 'Varsayılana dön', onClick: (c) => { const s = X.S(); if (s.dash) delete s.dash[uid()]; X.db.save(); c(); after(); } }, { label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', onClick: (c) => { saveLayout(l); c(); toast('Özet düzeni kaydedildi', 'ok'); after(); } }] });
  }

  function page(el, p, app) {
    const l = layout(); const vis = l.order.filter((k) => !l.hidden.includes(k));
    // Yan yana duran ikili: ardışık geciken + odenecek
    let html = ''; for (let i = 0; i < vis.length; i++) { const k = vis[i], n = vis[i + 1]; if ((k === 'geciken' && n === 'odenecek') || (k === 'odenecek' && n === 'geciken')) { html += `<div class="grid g2">${CARDS[k].html().replace('card mb', 'card')}${CARDS[n].html().replace('card mb', 'card')}</div><div class="mb"></div>`; i++; } else html += CARDS[k].html(); }
    el.innerHTML = pageHead('Finansal Özet', NS.dateLong(new Date()), `${B().filterHtml()}<button class="btn" id="cz" title="Kartları seç ve sırala">${icon('settings')} Özelleştir</button><button class="btn" data-n="alis">${icon('plus')} Alış faturası</button><button class="btn primary" data-n="satis">${icon('plus')} Satış faturası</button>`) + (html || '<div class="card pad muted">Tüm kartlar gizli — "Özelleştir" ile seçin.</div>');
    on(el, 'click', '[data-n]', (e, b) => X.docEditor(app, b.dataset.n));
    on(el, 'click', '[data-act]', (e, b) => { const i = X.db.get('invoices', b.dataset.id); X.payModal(app, { cariId: i.cari, invoice: i, type: b.dataset.act === 'col' ? 'tahsilat' : 'odeme' }); });
    on(el, 'click', '[data-dupok]', (e, b) => { e.preventDefault(); const s = X.S(); s.dupOk = [...(s.dupOk || []), b.dataset.dupok].slice(-500); X.db.save(); app.refresh(); });
    $('#cz', el).onclick = () => customize(() => app.refresh());
    B().bindFilter(el, () => app.refresh());
  }

  return { init(ctx) { X = ctx; }, page, alerts, notifyAlerts, duplicates };
})();
