/* NEBSOFT Ön Muhasebe — Analizler: nakit akışı tahmini, satış, tahsilat & ödeme, kasa & banka, stok, dönem karşılaştırma
   Tüm tutarlar TL (dövizli belgeler belge kuruyla çevrilir). Tahmin; açık faturaların vadeleri, portföydeki çek/senetler ve
   tekrarlayan fatura şablonlarından hesaplanır — gerçekleşen değil, beklenen nakit hareketidir ve sayfada böyle yazar. */
window.MUHANALIZ = (function () {
  'use strict';
  const { esc, $, on, icon, money, num, table, badge, pageHead, kpi, chart, sum, iso, today, addDays, daysBetween } = NS;
  let X; // { db, cari, acc, invTotals, paidOf, invStatus, isSale, isBuy, accBalance, tlNet, stockOf, isStock, PERIODS }
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const TABS = [['nakit', 'Nakit akışı'], ['satis', 'Satış'], ['tahsil', 'Tahsilat & ödeme'], ['kasa', 'Kasa & banka'], ['stok', 'Stok'], ['karsi', 'Dönem karşılaştırma']];
  const rem = (i) => r2(X.invTotals(i).tl - X.paidOf(i));

  function cashflow() {
    const start = sum(X.db.all('accounts'), (a) => X.accBalance(a.id)); const t = today();
    const weeks = Array.from({ length: 13 }, (_, k) => ({ from: iso(addDays(t, k * 7)), to: iso(addDays(t, k * 7 + 6)), inn: 0, out: 0, items: [] }));
    const put = (date, amt, label) => { const w = weeks.find((x) => date >= x.from && date <= x.to); if (w) { if (amt > 0) w.inn += amt; else w.out -= amt; w.items.push([label, amt]); } };
    let lateIn = 0, lateOut = 0;
    X.db.all('invoices', (i) => X.invStatus(i) !== 'odendi' && rem(i) > 0).forEach((i) => { const sign = X.isSale(i) || (i.iade && i.kind === 'satis') ? 1 : -1; const a = rem(i) * sign; if ((i.due || i.date) < t) { if (sign > 0) lateIn += a; else lateOut -= a; } else put(i.due || i.date, a, `${i.no} · ${X.cari(i.cari).name}`); });
    X.db.all('cheques', (c) => c.status === 'portfoy').forEach((c) => put(c.due < t ? t : c.due, (c.dir === 'alinan' ? 1 : -1) * Number(c.amount || 0), `${c.kind === 'senet' ? 'Senet' : 'Çek'} ${c.no}`));
    X.db.all('recurring', (r) => r.active !== false).forEach((r) => { let d = r.next; let g = 0; while (d && d <= weeks[12].to && (!r.end || d <= r.end) && g++ < 20) { put(d, window.MUHCALC.totals(r).payable * (Number(r.rate) || 1), `Tekrarlayan · ${X.cari(r.cari).name}`); d = window.MUHTEKRAR.step(d, r.period, r.day); } });
    let bal = start; weeks.forEach((w) => { bal += w.inn - w.out; w.bal = r2(bal); });
    return { start: r2(start), weeks, lateIn: r2(lateIn), lateOut: r2(lateOut) };
  }

  function page(el, p, app) {
    let tab = TABS.some((x) => x[0] === p) ? p : 'nakit'; let per = 'yil'; let [from, to] = X.PERIODS()[per].slice(1);
    const draw = () => {
      const inR = (x) => x.date >= from && x.date <= to;
      const head = pageHead('Analizler', tab === 'nakit' ? 'Önümüzdeki 13 hafta için beklenen nakit hareketi' : `${NS.date(from)} – ${NS.date(to)} · tutarlar TL`, tab === 'nakit' ? '' : `<div class="seg">${Object.entries(X.PERIODS()).map(([k, [l]]) => `<button data-p="${k}" class="${k === per ? 'active' : ''}">${l}</button>`).join('')}</div><input class="input" type="date" id="af" value="${from}" style="max-width:150px"><input class="input" type="date" id="at" value="${to}" style="max-width:150px">`)
        + `<div class="tabs mb">${TABS.map(([k, l]) => `<a href="#/analiz/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div>`;
      let body = '';
      if (tab === 'nakit') {
        const cf = cashflow(); const low = cf.weeks.find((w) => w.bal < 0);
        body = `<div class="grid g4 mb">${kpi('Bugünkü kasa + banka', money(cf.start), 'wallet')}${kpi('13 hafta giriş', money(sum(cf.weeks, (w) => w.inn)), 'trend', 'ok')}${kpi('13 hafta çıkış', money(sum(cf.weeks, (w) => w.out)), 'minus', 'err')}${kpi('13. hafta sonu', money(cf.weeks[12].bal), 'chart', cf.weeks[12].bal < 0 ? 'err' : 'ok')}</div>
          ${low ? `<div class="card pad mb" style="border-color:var(--err)">${icon('alert')} <b>${NS.date(low.from)} haftasında</b> nakit eksiye düşüyor (${money(low.bal)}). Tahsilatları hızlandırmayı veya ödemeleri ertelemeyi değerlendirin.</div>` : ''}
          ${cf.lateIn || cf.lateOut ? `<div class="small muted mb">Hesaba katılmayan gecikmiş tutarlar: tahsil edilecek ${money(cf.lateIn)}, ödenecek ${money(cf.lateOut)} (tarihi belirsiz).</div>` : ''}
          <div class="card mb"><div class="card-h"><h3>Haftalık bakiye tahmini</h3></div><div class="card-b">${chart.line([{ name: 'Bakiye', values: cf.weeks.map((w) => w.bal) }], cf.weeks.map((w) => NS.date(w.from).slice(0, 5)), { format: money })}</div></div>
          <div class="card">${table({ rows: cf.weeks.map((w, i) => ({ id: i, ...w })), columns: [{ label: 'Hafta', render: (w) => `${NS.date(w.from)} – ${NS.date(w.to)}` }, { label: 'Giriş', cls: 'right', render: (w) => `<span style="color:var(--ok)">${money(w.inn)}</span>` }, { label: 'Çıkış', cls: 'right', render: (w) => `<span style="color:var(--err)">${money(w.out)}</span>` }, { label: 'Bakiye', cls: 'right', render: (w) => `<b style="color:${w.bal < 0 ? 'var(--err)' : 'inherit'}">${money(w.bal)}</b>` }, { label: 'Kalemler', render: (w) => `<span class="small faint">${w.items.slice(0, 3).map(([l]) => esc(l)).join(' · ')}${w.items.length > 3 ? ` +${w.items.length - 3}` : ''}</span>` }] })}</div>
          <p class="small muted mt">Tahmin; açık fatura vadeleri, portföydeki çek / senetler ve tekrarlayan fatura şablonlarından hesaplanır. Gerçekleşen değil, beklenen tutardır.</p>`;
      } else if (tab === 'satis') {
        const inv = X.db.all('invoices', (i) => X.isSale(i) && inR(i)); const ret = X.db.all('invoices', (i) => i.iade && i.kind === 'alis' && inR(i));
        const byC = {}, byI = {}, byU = {};
        inv.forEach((i) => { const k = X.cari(i.cari).name; byC[k] = byC[k] || { n: 0, v: 0 }; byC[k].n++; byC[k].v += X.tlNet(i); const u = i.createdBy || '—'; byU[u] = byU[u] || { n: 0, v: 0 }; byU[u].n++; byU[u].v += X.tlNet(i); const rate = Number(i.rate) || 1; i.lines.forEach((l) => { const k2 = l.name || '—'; const c = window.MUHCALC.line(l); byI[k2] = byI[k2] || { q: 0, v: 0, cost: 0 }; byI[k2].q += (Number(l.qty) || 0) * (Number(l.factor) || 1); byI[k2].v += c.net * rate; const it = l.item && X.db.get('items', l.item); if (it && Number(it.buy) > 0) byI[k2].cost += Number(it.buy) * (Number(l.qty) || 0) * (Number(l.factor) || 1); }); });
        const total = sum(inv, X.tlNet), rtotal = sum(ret, X.tlNet);
        const top = (o, f) => Object.entries(o).map(([k, v]) => ({ id: k, k, ...v })).sort((a, b) => b[f] - a[f]);
        body = `<div class="grid g4 mb">${kpi('Satış (KDV hariç)', money(total), 'trend', 'ok')}${kpi('Fatura sayısı', inv.length, 'file')}${kpi('Ortalama fatura', money(inv.length ? total / inv.length : 0), 'chart')}${kpi('Müşteri iadeleri', money(rtotal), 'back', 'warn')}</div>
          <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>En çok satış yapılan müşteriler</h3></div>${table({ rows: top(byC, 'v').slice(0, 15), columns: [{ label: 'Müşteri', render: (r) => esc(r.k) }, { label: 'Fatura', cls: 'right', render: (r) => r.n }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.v)}</b>` }, { label: 'Pay', cls: 'right', render: (r) => (total ? Math.round((r.v / total) * 100) : 0) + '%' }] })}</div>
          <div class="card"><div class="card-h"><h3>Ürün / hizmet bazında</h3></div>${table({ rows: top(byI, 'v').slice(0, 20), columns: [{ label: 'Kalem', render: (r) => esc(r.k) }, { label: 'Miktar', cls: 'right', render: (r) => num(r.q) }, { label: 'Satış', cls: 'right', render: (r) => money(r.v) }, { label: 'Brüt kâr', cls: 'right', render: (r) => (r.cost ? `<span style="color:${r.v - r.cost >= 0 ? 'var(--ok)' : 'var(--err)'}">${money(r.v - r.cost)} (${Math.round(((r.v - r.cost) / (r.v || 1)) * 100)}%)</span>` : '<span class="faint small">alış fiyatı yok</span>') }] })}</div></div>
          <div class="card"><div class="card-h"><h3>Satışı yapan kullanıcı</h3></div>${table({ rows: top(byU, 'v'), empty: 'Kayıt yok', columns: [{ label: 'Kullanıcı', render: (r) => esc(r.k) }, { label: 'Fatura', cls: 'right', render: (r) => r.n }, { label: 'Tutar', cls: 'right', render: (r) => money(r.v) }] })}<div class="small faint pad">Kullanıcı bilgisi bu sürümden sonra kesilen faturalarda tutulur.</div></div>`;
      } else if (tab === 'tahsil') {
        const tx = X.db.all('txns', (t) => ['tahsilat', 'odeme'].includes(t.type) && inR(t)); const tin = tx.filter((t) => t.type === 'tahsilat'), tout = tx.filter((t) => t.type === 'odeme');
        const paidInv = X.db.all('invoices', (i) => X.isSale(i) && X.invStatus(i) === 'odendi' && inR(i));
        const dso = (() => { const rows = X.db.all('txns', (t) => t.type === 'tahsilat' && t.invoice && inR(t)).map((t) => { const i = X.db.get('invoices', t.invoice); return i ? daysBetween(i.date, t.date) : null; }).filter((x) => x != null && x >= 0); return rows.length ? Math.round(sum(rows, (x) => x) / rows.length) : null; })();
        body = `<div class="grid g4 mb">${kpi('Tahsilat', money(sum(tin, (t) => t.amount)), 'trend', 'ok', `<div class="small faint">${tin.length} işlem</div>`)}${kpi('Ödeme', money(sum(tout, (t) => t.amount)), 'minus', 'err', `<div class="small faint">${tout.length} işlem</div>`)}${kpi('Net', money(sum(tin, (t) => t.amount) - sum(tout, (t) => t.amount)), 'wallet')}${kpi('Ortalama tahsil süresi', dso == null ? '—' : dso + ' gün', 'clock', 'info', `<div class="small faint">${paidInv.length} fatura kapandı</div>`)}</div>
          <div class="card">${table({ rows: tx.sort((a, b) => b.date.localeCompare(a.date)), empty: 'Bu dönemde tahsilat / ödeme yok', columns: [{ label: 'Tarih', render: (t) => NS.date(t.date) }, { label: 'Tür', render: (t) => badge(t.type === 'tahsilat' ? 'Tahsilat' : 'Ödeme', t.type === 'tahsilat' ? 'ok' : 'err') }, { label: 'Cari', render: (t) => esc(X.cari(t.cari).name) }, { label: 'Hesap', render: (t) => esc(X.acc(t.account).name) }, { label: 'Fatura', render: (t) => (t.invoice ? esc((X.db.get('invoices', t.invoice) || {}).no || '') : t.alloc ? `<span class="small">${t.alloc.map((a) => esc(a.no)).join(', ')}</span>` : '<span class="faint small">cari</span>') }, { label: 'Tutar', cls: 'right', render: (t) => `<b>${money(t.amount)}</b>` }] })}</div>`;
      } else if (tab === 'kasa') {
        const tx = X.db.all('txns', inR);
        const rows = X.db.all('accounts').map((a) => { const m = tx.filter((t) => t.account === a.id || t.account2 === a.id); const inn = sum(m.filter((t) => ['tahsilat', 'gelir'].includes(t.type) && t.account === a.id), (t) => t.amount) + sum(m.filter((t) => t.type === 'virman' && t.account2 === a.id), (t) => t.amount); const out = sum(m.filter((t) => ['odeme', 'gider'].includes(t.type) && t.account === a.id), (t) => t.amount) + sum(m.filter((t) => t.type === 'virman' && t.account === a.id), (t) => t.amount); return { id: a.id, a, inn, out, bal: X.accBalance(a.id), n: m.length }; });
        body = `<div class="grid g3 mb">${kpi('Dönem girişi', money(sum(rows, (r) => r.inn)), 'trend', 'ok')}${kpi('Dönem çıkışı', money(sum(rows, (r) => r.out)), 'minus', 'err')}${kpi('Toplam güncel bakiye', money(sum(rows, (r) => r.bal)), 'wallet')}</div>
          <div class="card">${table({ rows, columns: [{ label: 'Hesap', render: (r) => `<b>${esc(r.a.name)}</b><div class="small faint">${esc(r.a.type === 'banka' ? 'Banka' : 'Kasa')}${r.a.iban ? ' · ' + esc(r.a.iban) : ''}</div>` }, { label: 'Hareket', cls: 'right', render: (r) => r.n }, { label: 'Giriş', cls: 'right', render: (r) => money(r.inn) }, { label: 'Çıkış', cls: 'right', render: (r) => money(r.out) }, { label: 'Güncel bakiye', cls: 'right', render: (r) => `<b>${money(r.bal)}</b>` }] })}</div>`;
      } else if (tab === 'stok') {
        const items = X.db.all('items', X.isStock); const sold = {}; X.db.all('invoices', (i) => X.isSale(i) && inR(i)).forEach((i) => i.lines.forEach((l) => { if (l.item) sold[l.item] = (sold[l.item] || 0) + (Number(l.qty) || 0) * (Number(l.factor) || 1); }));
        const days = Math.max(1, daysBetween(from, to) + 1);
        const rows = items.map((it) => { const s = X.stockOf(it.id); const q = sold[it.id] || 0; const val = s * (Number(it.buy) || Number(it.price) || 0); return { id: it.id, it, s, q, val, cover: q > 0 ? Math.round(s / (q / days)) : null }; }).sort((a, b) => b.val - a.val);
        const dead = rows.filter((r) => r.s > 0 && !r.q);
        body = `<div class="grid g4 mb">${kpi('Stok değeri (alış)', money(sum(rows, (r) => r.val)), 'box')}${kpi('Kritik stok', rows.filter((r) => r.s <= (Number(r.it.min) || 0)).length, 'alert', 'warn')}${kpi('Dönemde hiç satılmayan', dead.length, 'clock', 'err', `<div class="small faint">${money(sum(dead, (r) => r.val))} bağlı</div>`)}${kpi('Kalem', rows.length, 'layers')}</div>
          <div class="card">${table({ rows, columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.it.name)}</b><div class="small faint">${esc(r.it.code || '')}</div>` }, { label: 'Stok', cls: 'right', render: (r) => `${num(r.s)} ${esc(r.it.unit || '')}${r.s <= (Number(r.it.min) || 0) ? ' ' + badge('kritik', 'warn') : ''}` }, { label: 'Dönem satışı', cls: 'right', render: (r) => num(r.q) }, { label: 'Kaç gün yeter', cls: 'right', render: (r) => (r.cover == null ? (r.s > 0 ? badge('satış yok', 'err') : '—') : r.cover + ' gün') }, { label: 'Değer', cls: 'right', render: (r) => money(r.val) }] })}</div>`;
      } else {
        const len = daysBetween(from, to) + 1; const pFrom = iso(addDays(from, -len)), pTo = iso(addDays(from, -1)); const yFrom = String(Number(from.slice(0, 4)) - 1) + from.slice(4), yTo = String(Number(to.slice(0, 4)) - 1) + to.slice(4);
        const calc = (a, b) => { const R = (x) => x.date >= a && x.date <= b; const s = sum(X.db.all('invoices', (i) => X.isSale(i) && R(i)), X.tlNet) - sum(X.db.all('invoices', (i) => i.iade && i.kind === 'alis' && R(i)), X.tlNet); const g = sum(X.db.all('invoices', (i) => X.isBuy(i) && R(i)), X.tlNet) - sum(X.db.all('invoices', (i) => i.iade && i.kind === 'satis' && R(i)), X.tlNet) + sum(X.db.all('txns', (t) => t.type === 'gider' && R(t)), (t) => t.amount); const gl = sum(X.db.all('txns', (t) => t.type === 'gelir' && R(t)), (t) => t.amount); const th = sum(X.db.all('txns', (t) => t.type === 'tahsilat' && R(t)), (t) => t.amount); return { s: s + gl, g, k: s + gl - g, th, n: X.db.all('invoices', (i) => X.isSale(i) && R(i)).length }; };
        const A = calc(from, to), P = calc(pFrom, pTo), Y = calc(yFrom, yTo);
        const d = (a, b) => (b ? `<span style="color:${a >= b ? 'var(--ok)' : 'var(--err)'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round(((a - b) / Math.abs(b)) * 100))}%</span>` : '<span class="faint">—</span>');
        body = `<div class="card">${table({ rows: [['Gelir', 's'], ['Gider', 'g'], ['Kâr / zarar', 'k'], ['Tahsilat', 'th'], ['Satış faturası (adet)', 'n']].map(([l, k]) => ({ id: k, l, k })), columns: [{ label: 'Kalem', render: (r) => `<b>${r.l}</b>` }, { label: `Bu dönem<div class="small faint">${NS.date(from)}–${NS.date(to)}</div>`, cls: 'right', render: (r) => (r.k === 'n' ? A[r.k] : money(A[r.k])) }, { label: `Önceki dönem<div class="small faint">${NS.date(pFrom)}–${NS.date(pTo)}</div>`, cls: 'right', render: (r) => `${r.k === 'n' ? P[r.k] : money(P[r.k])}<div class="small">${d(A[r.k], P[r.k])}</div>` }, { label: `Geçen yıl aynı dönem<div class="small faint">${NS.date(yFrom)}–${NS.date(yTo)}</div>`, cls: 'right', render: (r) => `${r.k === 'n' ? Y[r.k] : money(Y[r.k])}<div class="small">${d(A[r.k], Y[r.k])}</div>` }] })}</div>`;
      }
      el.innerHTML = head + body;
      if ($('#af', el)) { $('#af', el).onchange = (e) => { if (e.target.value) { from = e.target.value; per = ''; if (from > to) to = from; draw(); } }; $('#at', el).onchange = (e) => { if (e.target.value) { to = e.target.value; per = ''; if (to < from) from = to; draw(); } }; }
    };
    on(el, 'click', '[data-p]', (e, b) => { per = b.dataset.p; [from, to] = X.PERIODS()[per].slice(1); draw(); });
    draw();
  }
  return { init(ctx) { X = ctx; }, page, cashflow };
})();
