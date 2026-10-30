/* NEBSOFT Ön Muhasebe — Proje ve şube boyutları
   • Fatura ve gelir/gider kayıtlarına proje (iş, şantiye, kampanya…) ve şube atanır; "Proje & Şube" sayfası dönem içi gelir − gider = kâr.
   • Şube: depo ve kasa/banka hesabı şubeye bağlanır; yeni belge şubeyi kullanıcının şubesinden, yoksa depodan / hesaptan alır.
   • Şube yetkisi: şubeye atanan kullanıcı (yönetici hariç) yalnızca o şubenin fatura ve kasa hareketlerini görür. Hiç kullanıcı
     atanmamışsa kısıt yoktur — mevcut kurulumlar etkilenmez. Eski kayıtlarda proje/şube alanı yoktur ("Projesiz" / "Şubesiz"). */
window.MUHBOYUT = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, table, badge, pageHead, kpi, sum, toast, formModal, modal, iso, today } = NS;
  let X; // { db, isSale, isBuy, tlNet, depots }
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const branches = () => X.db.all('branches');
  const projects = (all) => X.db.all('projects', (p) => all || p.active !== false).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const branchName = (id) => (X.db.get('branches', id) || {}).name || '';
  const projectName = (id) => (X.db.get('projects', id) || {}).name || '';

  // Kullanıcının şube kısıtı: null = kısıt yok
  function myBranches() { const u = NS.currentUser; if (!u || u.role === 'admin') return null; const bs = branches().filter((b) => (b.users || []).includes(u.id)); return bs.length ? bs.map((b) => b.id) : null; }
  const visible = (rec) => { const m = myBranches(); return !m || m.includes(rec.branch); };
  // Seçili şube filtresi (oturum boyunca hatırlanır); kısıtlı kullanıcıda kendi şubesine zorlanır
  let cur = ''; try { cur = sessionStorage.getItem('nebsoft:muh:branch') || ''; } catch (e) { /* yok */ }
  const current = () => { const m = myBranches(); if (m && !m.includes(cur)) return m.length === 1 ? m[0] : cur && m.includes(cur) ? cur : ''; return branches().some((b) => b.id === cur) ? cur : ''; };
  const pass = (rec) => visible(rec) && (!current() || rec.branch === current());
  function setCurrent(v) { cur = v; try { sessionStorage.setItem('nebsoft:muh:branch', v); } catch (e) { /* yok */ } }
  // Sayfa başlığına konan şube seçimi (şube yoksa boş)
  function filterHtml() {
    const bs = branches(); if (!bs.length) return ''; const m = myBranches(); const list = m ? bs.filter((b) => m.includes(b.id)) : bs;
    return `<select class="input" data-brf style="max-width:180px" title="Şube">${m && m.length === 1 ? '' : `<option value="">Tüm şubeler</option>`}${list.map((b) => `<option value="${b.id}" ${b.id === current() ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`;
  }
  const bindFilter = (el, after) => on(el, 'change', '[data-brf]', (e, s) => { setCurrent(s.value); after(); });

  // Yeni kayıt için varsayılan şube: kullanıcının şubesi → depo / hesap şubesi → seçili filtre
  function defBranch({ depot, account } = {}) { const m = myBranches(); if (m) return m.includes(current()) ? current() : m[0]; const d = depot && X.db.get('depots', depot); if (d && d.branch) return d.branch; const a = account && X.db.get('accounts', account); if (a && a.branch) return a.branch; return current(); }
  // formModal alanları (proje / şube tanımlıysa)
  function fields(rec = {}) {
    const out = []; const ps = projects(); const bs = branches(); const m = myBranches();
    if (ps.length || rec.project) out.push({ name: 'project', label: 'Proje', type: 'select', value: rec.project || '', options: [{ value: '', label: '— Projesiz —' }, ...projects(true).filter((p) => p.active !== false || p.id === rec.project).map((p) => ({ value: p.id, label: p.name }))] });
    if (bs.length) out.push({ name: 'branch', label: 'Şube', type: 'select', value: rec.branch || defBranch(rec), options: [...(m ? [] : [{ value: '', label: '— Şubesiz —' }]), ...bs.filter((b) => !m || m.includes(b.id)).map((b) => ({ value: b.id, label: b.name }))] });
    return out;
  }
  // Fatura düzenleyicisine eklenen seçimler
  function editorHtml(doc) {
    const f = fields(doc); if (!f.length) return '';
    if (!doc.id && doc.branch === undefined && branches().length) doc.branch = defBranch(doc);
    return `<div class="row mb small wrap" style="gap:12px">${f.map((x) => `<label class="muted">${x.label}</label><select class="input" data-dim="${x.name}" style="max-width:220px">${x.options.map((o) => `<option value="${esc(o.value)}" ${o.value === (doc[x.name] || '') ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`).join('')}</div>`;
  }
  const bindEditor = (b, doc) => on(b, 'change', '[data-dim]', (e, s) => { if (s.value) doc[s.dataset.dim] = s.value; else delete doc[s.dataset.dim]; });
  const tags = (rec) => [rec.project && projectName(rec.project) ? badge(projectName(rec.project), 'acc') : '', rec.branch && branchName(rec.branch) && !current() ? badge(branchName(rec.branch)) : ''].filter(Boolean).join(' ');

  // Dönem içi gelir / gider (Özet grafiğiyle aynı kural): satış − müşteri iadesi + gelir; alış − alış iadesi + gider
  function pnl(key, from, to) {
    const m = new Map(); const g = (k) => { if (!m.has(k)) m.set(k, { inc: 0, exp: 0, n: 0 }); return m.get(k); };
    const inRange = (d) => d >= from && d <= to;
    X.db.all('invoices', (i) => inRange(i.date) && visible(i)).forEach((i) => { const r = g(i[key] || ''); const v = X.tlNet(i); r.n++;
      if (X.isSale(i)) r.inc += v; else if (i.iade && i.kind === 'alis') r.inc -= v; else if (X.isBuy(i)) r.exp += v; else if (i.iade && i.kind === 'satis') r.exp -= v; });
    X.db.all('txns', (t) => (t.type === 'gelir' || t.type === 'gider') && inRange(t.date) && visible(t)).forEach((t) => { const r = g(t[key] || ''); r.n++; if (t.type === 'gelir') r.inc += Number(t.amount) || 0; else r.exp += Number(t.amount) || 0; });
    m.forEach((r) => { r.inc = r2(r.inc); r.exp = r2(r.exp); r.profit = r2(r.inc - r.exp); r.margin = r.inc ? Math.round((r.profit / r.inc) * 1000) / 10 : null; });
    return m;
  }

  async function editProject(rec, after) {
    const v = await formModal({ title: rec ? rec.name : 'Yeni proje', fields: [{ name: 'name', label: 'Proje / etiket adı', required: true, value: rec ? rec.name : '' }, { name: 'code', label: 'Kod', value: rec ? rec.code || '' : '' }, { name: 'budget', label: 'Bütçe (gider, TL)', type: 'number', step: '0.01', value: rec ? rec.budget || '' : '' }, { name: 'note', label: 'Not', full: true, value: rec ? rec.note || '' : '' }, ...(rec ? [{ name: 'active', label: 'Açık (yeni kayıtlarda seçilebilir)', type: 'checkbox', value: rec.active !== false }] : [])] });
    if (!v) return; v.name = v.name.trim(); if (X.db.find('projects', (p) => p.name.toLocaleLowerCase('tr-TR') === v.name.toLocaleLowerCase('tr-TR') && (!rec || p.id !== rec.id))) return toast('Bu adla bir proje var', 'err');
    if (rec) X.db.update('projects', rec.id, v); else X.db.insert('projects', { ...v, active: true }); X.db.save(); toast('Kaydedildi', 'ok'); after();
  }
  function branchModal(after) {
    const users = X.db.all('users', (u) => u.active !== false); const deps = X.depots(); const accs = X.db.all('accounts');
    const body = () => table({ rows: branches(), empty: 'Henüz şube yok', columns: [{ label: 'Şube', render: (b) => `<b>${esc(b.name)}</b>` }, { label: 'Depolar', render: (b) => esc(deps.filter((d) => d.branch === b.id).map((d) => d.name).join(', ') || '-') }, { label: 'Kasa / banka', render: (b) => esc(accs.filter((a) => a.branch === b.id).map((a) => a.name).join(', ') || '-') }, { label: 'Yalnızca bu şubeyi gören', render: (b) => esc(users.filter((u) => (b.users || []).includes(u.id)).map((u) => u.name).join(', ') || 'Kısıt yok') }], actions: [{ icon: 'edit', act: 'ed' }] });
    const edit = async (b, box) => {
      const v = await formModal({ title: b ? b.name : 'Yeni şube', size: 'wide', fields: [{ name: 'name', label: 'Şube adı', required: true, value: b ? b.name : '', full: true },
        ...deps.map((d) => ({ name: 'd_' + d.id, label: `Depo: ${d.name}`, type: 'checkbox', value: !!b && d.branch === b.id })),
        ...accs.map((a) => ({ name: 'a_' + a.id, label: `Hesap: ${a.name}`, type: 'checkbox', value: !!b && a.branch === b.id })),
        ...users.filter((u) => u.role !== 'admin').map((u) => ({ name: 'u_' + u.id, label: `Kullanıcı yalnızca bu şubeyi görsün: ${u.name}`, type: 'checkbox', value: !!b && (b.users || []).includes(u.id) }))] });
      if (!v) return; const rec = b || X.db.insert('branches', { name: v.name.trim(), users: [] }); rec.name = v.name.trim();
      deps.forEach((d) => { if (v['d_' + d.id]) d.branch = rec.id; else if (d.branch === rec.id) delete d.branch; });
      accs.forEach((a) => { if (v['a_' + a.id]) a.branch = rec.id; else if (a.branch === rec.id) delete a.branch; });
      rec.users = users.filter((u) => v['u_' + u.id]).map((u) => u.id); X.db.save(); box.innerHTML = body(); toast('Şube kaydedildi', 'ok'); after();
    };
    modal({ title: 'Şubeler', size: 'wide', body: `<div id="brl">${body()}</div><p class="small muted">Depo ve kasa/banka hesabı şubeye bağlanınca yeni fatura ve gelir/gider o şubeye yazılır. Bir kullanıcıyı şubeye kısıtlarsanız (yönetici hariç) yalnızca o şubenin fatura ve kasa hareketlerini görür; kısıtlanmayan kullanıcılar tüm şubeleri görür.</p>`,
      onOpen: (b) => on(b, 'click', '[data-act=ed]', (e, t) => edit(X.db.get('branches', t.dataset.id), $('#brl', b))),
      actions: [{ label: 'Kapat' }, { label: 'Yeni şube', cls: 'primary', icon: 'plus', onClick: (c, b) => edit(null, $('#brl', b)) }] });
  }

  // "Proje & Şube" sayfası: dönem içi kârlılık
  function page(el, p, app) {
    let tab = p === 'sube' ? 'sube' : 'proje'; let from = today().slice(0, 4) + '-01-01', to = today();
    const draw = () => {
      const key = tab === 'proje' ? 'project' : 'branch'; const m = pnl(key, from, to);
      const list = tab === 'proje' ? projects(true).map((x) => ({ ...x, kind: 'p' })) : branches().map((x) => ({ ...x, kind: 'b' }));
      const rows = [...list.map((x) => ({ x, r: m.get(x.id) || { inc: 0, exp: 0, profit: 0, margin: null, n: 0 } })), ...(m.has('') ? [{ x: { id: '', name: tab === 'proje' ? 'Projesiz kayıtlar' : 'Şubesiz kayıtlar', none: true }, r: m.get('') }] : [])].map((o) => ({ id: o.x.id || '-', ...o }));
      const tot = { inc: sum(rows, (o) => o.r.inc), exp: sum(rows, (o) => o.r.exp) };
      $('#pb', el).innerHTML = `<div class="grid g3 mb">${kpi('Gelir', money(tot.inc), 'trend', 'ok')}${kpi('Gider', money(tot.exp), 'minus', 'err')}${kpi('Kâr', money(tot.inc - tot.exp), 'wallet', tot.inc - tot.exp >= 0 ? 'info' : 'err')}</div>
        <div class="card">${table({ rows, empty: tab === 'proje' ? 'Henüz proje yok — "Yeni proje" ile ekleyin, sonra faturalarda proje seçin' : 'Henüz şube yok — "Şubeleri yönet" ile ekleyin', columns: [
          { label: tab === 'proje' ? 'Proje' : 'Şube', render: (o) => `<b>${esc(o.x.name)}</b>${o.x.code ? ` <span class="small faint mono">${esc(o.x.code)}</span>` : ''}${o.x.active === false ? ' ' + badge('Kapalı') : ''}${o.x.none ? '<div class="small faint">proje/şube atanmamış eski veya genel kayıtlar</div>' : ''}` },
          { label: 'Kayıt', cls: 'right', render: (o) => o.r.n },
          { label: 'Gelir', cls: 'right', render: (o) => money(o.r.inc) },
          { label: 'Gider', cls: 'right', render: (o) => money(o.r.exp) + (o.x.budget ? `<div class="small ${o.r.exp > o.x.budget ? '' : 'faint'}" style="${o.r.exp > o.x.budget ? 'color:var(--err)' : ''}">bütçe ${money(o.x.budget)}${o.r.exp > o.x.budget ? ' — aşıldı' : ''}</div>` : '') },
          { label: 'Kâr', cls: 'right', render: (o) => `<b style="color:var(${o.r.profit < 0 ? '--err' : '--ok'})">${money(o.r.profit)}</b>` },
          { label: 'Marj', cls: 'right', render: (o) => (o.r.margin == null ? '-' : (o.r.margin < 0 ? '-' : '') + '%' + String(Math.abs(o.r.margin)).replace('.', ',')) }],
          actions: tab === 'proje' ? [{ icon: 'edit', act: 'pe', show: (o) => !o.x.none }] : [] })}</div>
        <p class="small muted mt">Gelir: satış faturaları (KDV hariç, TL) − müşteri iadeleri + gelir kayıtları. Gider: alış faturaları − alış iadeleri + gider kayıtları. Stok maliyeti satışa dağıtılmaz (alış, alındığı dönemde gider sayılır). Dövizli belgeler belge kuruyla TL'ye çevrilir.</p>`;
    };
    el.innerHTML = pageHead('Proje & Şube kârlılığı', 'Proje veya şube bazında gelir, gider ve kâr', `<div class="seg"><button data-tab="proje" class="${tab === 'proje' ? 'active' : ''}">Projeler</button><button data-tab="sube" class="${tab === 'sube' ? 'active' : ''}">Şubeler</button></div><input class="input" type="date" id="pf" value="${from}" style="max-width:150px"><input class="input" type="date" id="pt" value="${to}" style="max-width:150px"><button class="btn" id="br">${icon('building')} Şubeleri yönet</button><button class="btn primary" id="np">${icon('plus')} Yeni proje</button>`) + '<div id="pb"></div>';
    on(el, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#pf', el).onchange = (e) => { from = e.target.value || '0000'; draw(); }; $('#pt', el).onchange = (e) => { to = e.target.value || '9999'; draw(); };
    $('#np', el).onclick = () => editProject(null, draw); $('#br', el).onclick = () => { if (!app.can('admin')) return toast('Şubeleri yalnızca yönetici düzenler', 'err'); branchModal(draw); };
    on(el, 'click', '[data-act=pe]', (e, b) => editProject(X.db.get('projects', b.dataset.id), draw));
    if (!app.can('admin')) $('#br', el).style.display = 'none';
    draw();
  }

  return { init(ctx) { X = ctx; }, page, fields, editorHtml, bindEditor, tags, pass, visible, filterHtml, bindFilter, current, defBranch, branches, projects, pnl, branchModal, projectName, branchName };
})();
