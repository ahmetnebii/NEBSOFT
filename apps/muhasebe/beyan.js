/* NEBSOFT Ön Muhasebe — Beyanname & Mutabakat: KDV beyan taslağı (hesaplanan / indirilecek / devreden),
   Ba-Bs formları, cari mutabakat mektupları ve beyan takvimi. Mali müşavire hazır veri sağlar. */
window.MUHBEYAN = (function () {
  'use strict';
  const { esc, $, on, icon, money, toast, table, badge, kpi, pageHead, sum, iso, today } = NS;
  let X; // { db, invTotals, cari, cariBalance, S }
  const r2 = (n) => Math.round(n * 100) / 100;
  const ymName = (ym) => `${NS.MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
  const prevYm = (ym) => { const d = new Date(ym + '-15'); d.setMonth(d.getMonth() - 1); return iso(d).slice(0, 7); };
  const nextYm = (ym) => { const d = new Date(ym + '-15'); d.setMonth(d.getMonth() + 1); return iso(d).slice(0, 7); };
  const invs = (ym, kind) => X.db.all('invoices', (i) => i.kind === kind && (i.date || '').startsWith(ym));

  // KDV: oran bazında matrah ve vergi; devreden KDV yılbaşından zincirleme hesaplanır
  function vatOf(ym) {
    const by = (kind) => { const o = {}; invs(ym, kind).forEach((i) => { const t = X.invTotals(i); const rate = Number(i.rate) || 1; i.lines.forEach((l) => { const c = window.MUHCALC.line(l); const k = String(l.vat || 0); o[k] = o[k] || { base: 0, vat: 0 }; o[k].base += c.net * rate; o[k].vat += c.vat * rate; }); }); Object.values(o).forEach((v) => { v.base = r2(v.base); v.vat = r2(v.vat); }); return o; };
    const out = by('satis'), inp = by('alis');
    return { out, inp, calc: r2(sum(Object.values(out), (v) => v.vat)), ded: r2(sum(Object.values(inp), (v) => v.vat)) };
  }
  function vatChain(ym) {
    let carry = 0; let m = ym.slice(0, 4) + '-01'; let res;
    for (;;) { const v = vatOf(m); const total = r2(v.ded + carry); const pay = r2(Math.max(0, v.calc - total)); const next = r2(Math.max(0, total - v.calc)); res = { ...v, carryIn: carry, pay, carryOut: next }; if (m === ym) break; carry = next; m = nextYm(m); }
    return res;
  }
  // Ba (alış) / Bs (satış): aynı kişiden KDV hariç toplamı sınırı aşan belgeler, cari bazında
  function babs(ym, kind) {
    const lim = Number(X.S().babsLimit) || 5000;
    const g = {}; invs(ym, kind).forEach((i) => { const c = X.cari(i.cari); const k = c.taxNo || c.name; g[k] = g[k] || { id: k, c, n: 0, base: 0 }; g[k].n++; g[k].base += X.invTotals(i).net * (Number(i.rate) || 1); });
    return Object.values(g).map((x) => ({ ...x, base: Math.round(x.base) })).filter((x) => x.base >= lim).sort((a, b) => b.base - a.base);
  }

  function page(el, p, app) {
    let ym = prevYm(today().slice(0, 7)), tab = 'kdv';
    const draw = () => {
      X.db.load();
      const v = vatChain(ym);
      const ba = babs(ym, 'alis'), bs = babs(ym, 'satis');
      const deadline = (day) => `${String(day).padStart(2, '0')}.${nextYm(ym).slice(5)}.${nextYm(ym).slice(0, 4)}`;
      const lastDay = new Date(Number(nextYm(ym).slice(0, 4)), Number(nextYm(ym).slice(5)), 0).getDate();
      const muta = X.S().mutabakat || {};
      const caris = X.db.all('caris').map((c) => ({ id: c.id, c, bal: X.cariBalance(c.id), st: (muta[ym] || {})[c.id] })).filter((x) => Math.abs(x.bal) >= 1).sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal));
      el.innerHTML = pageHead('Beyanname & Mutabakat', `${ymName(ym)} dönemi · mali müşavire hazır KDV, Ba-Bs ve cari mutabakat`, `<button class="btn icon" data-m="-1" aria-label="Önceki ay">${icon('left')}</button><b>${ymName(ym)}</b><button class="btn icon" data-m="1" aria-label="Sonraki ay">${icon('right')}</button>`) + `
        <div class="grid g4 mb">${kpi('Ödenecek KDV', money(v.pay), 'percent', v.pay ? 'warn' : 'ok', `<div class="small faint">Beyan son gün ${deadline(28)}</div>`)}${kpi('Sonraki aya devreden', money(v.carryOut), 'refresh', 'info')}${kpi('Form Ba / Bs', `${ba.length} / ${bs.length} cari`, 'file', '', `<div class="small faint">Son gün ${deadline(lastDay)}</div>`)}${kpi('Mutabakat', `${caris.filter((x) => x.st === 'mutabik').length} / ${caris.length}`, 'check', 'ok')}</div>
        <div class="seg mb">${[['kdv', 'KDV beyan taslağı'], ['babs', 'Ba / Bs formları'], ['muta', 'Cari mutabakat'], ['takvim', 'Beyan takvimi']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
        ${tab === 'kdv' ? `<div class="grid g2"><div class="card"><div class="card-h"><h3>Hesaplanan KDV (satışlar)</h3></div>${table({ rows: Object.entries(v.out).map(([k, x]) => ({ id: k, k, ...x })), empty: 'Satış faturası yok', columns: [{ label: 'Oran', render: (r) => `%${r.k}` }, { label: 'Matrah', cls: 'right', render: (r) => money(r.base) }, { label: 'KDV', cls: 'right', render: (r) => `<b>${money(r.vat)}</b>` }] })}</div>
            <div class="card"><div class="card-h"><h3>İndirilecek KDV (alışlar)</h3></div>${table({ rows: Object.entries(v.inp).map(([k, x]) => ({ id: k, k, ...x })), empty: 'Alış faturası yok', columns: [{ label: 'Oran', render: (r) => `%${r.k}` }, { label: 'Matrah', cls: 'right', render: (r) => money(r.base) }, { label: 'KDV', cls: 'right', render: (r) => `<b>${money(r.vat)}</b>` }] })}</div></div>
          <div class="card mt"><div class="card-b"><div class="list-item"><span class="grow">Hesaplanan KDV</span><b>${money(v.calc)}</b></div><div class="list-item"><span class="grow">Bu dönem indirilecek KDV</span><b>−${money(v.ded)}</b></div><div class="list-item"><span class="grow">Önceki dönemden devreden KDV</span><b>−${money(v.carryIn)}</b></div><div class="list-item" style="font-size:18px"><span class="grow"><b>${v.pay ? 'Ödenecek KDV' : 'Sonraki döneme devreden KDV'}</b></span><b style="color:${v.pay ? 'var(--warn)' : 'var(--ok)'}">${money(v.pay || v.carryOut)}</b></div>
            <div class="row mt"><button class="btn" id="kx">${icon('download')} Excel</button><button class="btn" id="kp">${icon('print')} Mali müşavire yazdır</button></div><p class="small faint" style="margin-bottom:0">Taslaktır: tevkifat, istisna ve iade satırları mali müşavirce eklenir. Dövizli faturalar belge kuruyla TL'ye çevrilir.</p></div></div>`
        : tab === 'babs' ? `<p class="small muted">Aynı kişiden/kişiye ay içinde KDV hariç toplam ${money(Number(X.S().babsLimit) || 5000)} ve üzeri belgeler bildirilir (sınır Ayarlar'dan değiştirilebilir).</p><div class="grid g2">${[['Form Ba — mal ve hizmet alımları', ba, 'ba'], ['Form Bs — mal ve hizmet satışları', bs, 'bs']].map(([t, rows, k]) => `<div class="card"><div class="card-h"><h3>${t}</h3><button class="btn sm" data-bx="${k}">${icon('download')} Excel</button></div>${table({ rows, empty: 'Bildirilecek cari yok', columns: [{ label: 'Unvan', render: (r) => `<b>${esc(r.c.name)}</b><div class="small faint">${esc(r.c.taxOffice || '')}</div>` }, { label: 'VKN/TCKN', render: (r) => `<span class="mono small">${esc(r.c.taxNo || '-')}</span>` }, { label: 'Belge', cls: 'right', key: 'n' }, { label: 'Tutar (KDV hariç)', cls: 'right', render: (r) => `<b>${NS.num(r.base)}</b>` }] })}</div>`).join('')}</div>`
        : tab === 'muta' ? `<div class="card">${table({ rows: caris, empty: 'Bakiyeli cari yok', columns: [{ label: 'Cari', render: (r) => `<b>${esc(r.c.name)}</b><div class="small faint">${esc(r.c.email || '')}</div>` }, { label: 'Bakiye', cls: 'right', render: (r) => `<b>${money(Math.abs(r.bal))}</b> <span class="small faint">${r.bal > 0 ? '(B) alacağımız' : '(A) borcumuz'}</span>` }, { label: 'Durum', render: (r) => (r.st === 'mutabik' ? badge('Mutabık', 'ok') : r.st === 'degil' ? badge('Mutabık değil', 'err') : r.st === 'gonderildi' ? badge('Gönderildi', 'info') : badge('Gönderilmedi')) }], actions: [{ icon: 'mail', act: 'mail', title: 'Mutabakat mektubu gönder' }, { icon: 'print', act: 'mprint', title: 'Yazdır' }, { icon: 'check', act: 'ok', title: 'Mutabık' }, { icon: 'x', act: 'no', title: 'Mutabık değil' }] })}</div>`
        : `<div class="card"><div class="card-b">${[[deadline(26), 'Muhtasar ve prim hizmet beyannamesi', 'Bordro modülündeki gelir vergisi, damga vergisi ve SGK primleri'], [deadline(28), 'KDV beyannamesi (KDV-1)', money(v.pay) + ' ödenecek'], [deadline(lastDay), 'Form Ba / Bs', `${ba.length} Ba · ${bs.length} Bs bildirimi`], [deadline(lastDay), 'e-Defter berat yükleme', 'Önceki ayların beratları (e-Defter mükellefleri)']].map(([d, t, s]) => `<div class="list-item"><b class="mono" style="width:100px">${d}</b><span class="grow"><b>${t}</b><div class="small muted">${s}</div></span></div>`).join('')}<p class="small faint">Tarihler genel kuraldır; resmi tatil ve GİB duyurularına göre değişebilir.</p></div></div>`}`;
    };
    on(el, 'click', '[data-m]', (e, b) => { ym = Number(b.dataset.m) > 0 ? nextYm(ym) : prevYm(ym); draw(); });
    on(el, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; draw(); });
    on(el, 'click', '#kx', () => { const v = vatChain(ym); const rows = [...Object.entries(v.out).map(([k, x]) => ({ t: 'Hesaplanan', k, ...x })), ...Object.entries(v.inp).map(([k, x]) => ({ t: 'İndirilecek', k, ...x }))]; NS.csv(`kdv-${ym}`, rows, [{ key: 't', label: 'Tür' }, { label: 'Oran %', value: (r) => r.k }, { key: 'base', label: 'Matrah' }, { key: 'vat', label: 'KDV' }]); });
    on(el, 'click', '#kp', () => { const v = vatChain(ym); NS.printHtml(`<div class="doc"><h2>${esc(X.S().bizName || '')}</h2><h3>KDV BEYAN TASLAĞI — ${ymName(ym).toLocaleUpperCase('tr')}</h3><table><tr><th>Tür</th><th>Oran</th><th style="text-align:right">Matrah</th><th style="text-align:right">KDV</th></tr>${Object.entries(v.out).map(([k, x]) => `<tr><td>Hesaplanan</td><td>%${k}</td><td style="text-align:right">${money(x.base)}</td><td style="text-align:right">${money(x.vat)}</td></tr>`).join('')}${Object.entries(v.inp).map(([k, x]) => `<tr><td>İndirilecek</td><td>%${k}</td><td style="text-align:right">${money(x.base)}</td><td style="text-align:right">${money(x.vat)}</td></tr>`).join('')}</table><p>Hesaplanan ${money(v.calc)} · İndirilecek ${money(v.ded)} · Devreden (önceki) ${money(v.carryIn)}</p><h3>${v.pay ? 'Ödenecek KDV: ' + money(v.pay) : 'Sonraki döneme devreden: ' + money(v.carryOut)}</h3></div>`, { title: 'KDV taslağı' }); });
    on(el, 'click', '[data-bx]', (e, b) => { const k = b.dataset.bx; NS.csv(`form-${k}-${ym}`, babs(ym, k === 'ba' ? 'alis' : 'satis'), [{ label: 'Unvan', value: (r) => r.c.name }, { label: 'Ülke', value: () => 'TÜRKİYE' }, { label: 'VKN/TCKN', value: (r) => r.c.taxNo || '' }, { label: 'Belge sayısı', value: (r) => r.n }, { label: 'Mal ve hizmet toplam bedeli', value: (r) => r.base }]); });
    const letter = (c, bal) => `<div class="doc"><h2>${esc(X.S().bizName || '')}</h2><h3>CARİ HESAP MUTABAKAT MEKTUBU</h3><p>Sayın ${esc(c.name)},</p><p>${NS.date(new Date(Number(nextYm(ym).slice(0, 4)), Number(nextYm(ym).slice(5)) - 1, 0))} tarihi itibarıyla kayıtlarımızda firmanız cari hesabı <b>${money(Math.abs(bal))} ${bal > 0 ? 'borç (bize borçlusunuz)' : 'alacak (size borçluyuz)'}</b> bakiyesi vermektedir.</p><p>Mutabık olup olmadığınızı 15 gün içinde bildirmenizi rica ederiz. Aksi halde bakiye kabul edilmiş sayılacaktır.</p><p style="margin-top:30px">[ ] Mutabıkız &nbsp;&nbsp; [ ] Mutabık değiliz — bizim kayıtlarımıza göre bakiye: ................</p><p style="margin-top:40px;display:flex;justify-content:space-between"><span>${esc(X.S().bizName || '')}</span><span>Kaşe / imza</span></p></div>`;
    const setSt = (cid, st) => { const s = X.S(); const m = { ...(s.mutabakat || {}) }; m[ym] = { ...(m[ym] || {}), [cid]: st }; X.db.saveSettings({ mutabakat: m }); };
    on(el, 'click', '[data-act]', (e, b) => {
      const c = X.cari(b.dataset.id); const bal = X.cariBalance(c.id);
      if (b.dataset.act === 'mprint') return NS.printHtml(letter(c, bal), { title: 'Mutabakat' });
      if (b.dataset.act === 'mail') { location.href = `mailto:${encodeURIComponent(c.email || '')}?subject=${encodeURIComponent(`${X.S().bizName || ''} cari mutabakat · ${ymName(ym)}`)}&body=${encodeURIComponent(`Sayın ${c.name},\n\n${ymName(ym)} sonu itibarıyla cari hesap bakiyeniz ${money(Math.abs(bal))} ${bal > 0 ? '(borç)' : '(alacak)'} olarak görünmektedir. Mutabık olup olmadığınızı bildirmenizi rica ederiz.\n\nSaygılarımızla`)}`; setSt(c.id, 'gonderildi'); }
      else setSt(c.id, b.dataset.act === 'ok' ? 'mutabik' : 'degil');
      toast('Kaydedildi', 'ok'); draw();
    });
    draw();
  }
  return { init(ctx) { X = ctx; }, nav: { id: 'beyanname', label: 'Beyanname & Mutabakat', icon: 'percent', roles: ['muhasebe'] }, routes: { beyanname: page } };
})();
