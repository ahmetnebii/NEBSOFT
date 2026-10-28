/* NEBSOFT Belge şablonları + dijital imza
   • NS.docs.define(appId, tür, { label, sample }) — ürün, yazdırdığı belge türünü tanımlar (iş emri, teslim formu, fiş…)
   • NS.docs.print(tür, veri) — işletmenin seçtiği şablonla yazdırır (A4 / A5 / 80 mm / 58 mm)
   • NS.docs.designer(el) — "Belge şablonları" sayfası: blok aç/kapa, sıra, renk, logo, metinler, canlı önizleme
   • NS.sign({ title, label }) — parmak/kalem/fare ile imza; { img (PNG dataURL), name, at } döner
   Şablonlar ürünün kendi verisinde (_settings.docTemplates) saklanır; bulutta tüm cihazlara eşitlenir.
   Veri biçimi: { no, date, title, party:{title,name,phone,lines:[]}, info:[[etiket,değer]], lines:[{name,qty,unit,price,disc,total,note}],
                  totals:[[etiket,tutar,kalın]], note, damage:{svg,marks}, signatures:[{label,img,name,at}], qr:{url,label} } */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { esc, icon, money } = NS;
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : null);

  // ---------- Taranabilir QR kod ----------
  // qrcode-generator (MIT) gerektiğinde cdnjs'ten yüklenir; yüklenene kadar ve çevrimdışıyken eski desen + metin bağlantı gösterilir.
  // Böylece tüm ürünlerdeki NS.qrSvg kullanımları (QR menü, takip linkleri, belgeler) telefon kamerasıyla okunabilir hale gelir.
  const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  const fakeQr = NS.qrSvg;
  const loadQr = () => new Promise((res) => { if (window.qrcode) return res(true); if (typeof document === 'undefined' || !document.head) return res(false); const s = document.createElement('script'); s.src = QR_SRC; s.async = true; s.crossOrigin = 'anonymous'; s.onload = () => res(!!window.qrcode); s.onerror = () => res(false); document.head.appendChild(s); });
  NS.qrSvg = (text, size = 140) => {
    if (!window.qrcode) return fakeQr ? fakeQr(text, size) : '';
    try {
      const q = window.qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(String(text)))); q.make(); const n = q.getModuleCount(); let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      return `<svg class="ns-qr" width="${size}" height="${size}" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" role="img" aria-label="QR kod"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    } catch (e) { return fakeQr ? fakeQr(text, size) : ''; }
  };
  NS.qrReady = loadQr;
  if (typeof document !== 'undefined' && document.head) setTimeout(loadQr, 1200);

  // ---------- Dijital imza ----------
  function sign({ title = 'İmza', label = 'Ad soyad', name = '', text = '' } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const m = NS.modal({
        title, size: 'wide',
        body: `${text ? `<div class="card pad mb small" style="background:var(--surface-2)">${text}</div>` : ''}
          <div class="field mb"><label>${esc(label)}</label><input class="input lg" id="sg-n" value="${esc(name)}" autocomplete="off"></div>
          <div class="nv-sign"><canvas id="sg-c"></canvas><span class="nv-sign-hint">${icon('edit')} Buraya imzalayın</span><button class="btn sm ghost nv-sign-clr" id="sg-x">${icon('refresh')} Temizle</button></div>
          <p class="small faint mt">İmza; tarih, saat ve cihaz bilgisiyle birlikte belgeye eklenir.</p>`,
        actions: [{ label: 'Vazgeç' }, { label: 'İmzayı kaydet', cls: 'primary', icon: 'check', onClick: (cl) => {
          if (empty) return NS.toast('Lütfen imza atın', 'err');
          const n = m.root.querySelector('#sg-n').value.trim(); if (!n) return NS.toast(label + ' gerekli', 'err');
          done = true; resolve({ img: trim(cv), name: n, at: new Date().toISOString(), ua: navigator.userAgent.slice(0, 120) }); cl();
        } }],
        onClose: () => { if (!done) resolve(null); },
      });
      const cv = m.root.querySelector('#sg-c'); const box = cv.parentElement; const g = cv.getContext('2d');
      let empty = true; let last = null; let w = 1.2;
      const fit = () => { const r = box.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0b1a3a'; };
      setTimeout(fit, 30);
      const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), p: e.pressure || 0.5 }; };
      cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); last = pt(e); empty = false; box.classList.add('on'); });
      cv.addEventListener('pointermove', (e) => {
        if (!last) return; const p = pt(e); const v = Math.hypot(p.x - last.x, p.y - last.y) / Math.max(1, p.t - last.t);
        const target = Math.max(1.1, Math.min(3.4, 3.6 - v * 1.6)) * (e.pointerType === 'pen' ? 0.6 + p.p : 1); w = w * 0.6 + target * 0.4; // hız/basınca göre çizgi kalınlığı
        g.lineWidth = w; g.beginPath(); g.moveTo(last.x, last.y); g.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2); g.lineTo(p.x, p.y); g.stroke(); last = p;
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cv.addEventListener(ev, () => { last = null; }));
      m.root.querySelector('#sg-x').onclick = () => { g.clearRect(0, 0, cv.width, cv.height); empty = true; box.classList.remove('on'); };
    });
  }
  // İmzanın boş kenarlarını kırpar (belgede düzgün durması için)
  function trim(cv) {
    const g = cv.getContext('2d'); const { width: W, height: H } = cv; const d = g.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return cv.toDataURL('image/png');
    const pad = 12; const c2 = document.createElement('canvas'); c2.width = Math.min(W, x1 - x0 + pad * 2); c2.height = Math.min(H, y1 - y0 + pad * 2);
    c2.getContext('2d').drawImage(cv, Math.max(0, x0 - pad), Math.max(0, y0 - pad), c2.width, c2.height, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/png');
  }

  // ---------- Şablonlar ----------
  const TYPES = {}; // appId → { tür: { label, sample } }
  const BLOCKS = {
    baslik: 'Başlık (logo + işletme bilgisi)', bilgi: 'Belge bilgileri', taraf: 'Müşteri / karşı taraf', kalemler: 'Kalem tablosu', toplam: 'Toplamlar',
    not: 'Açıklama / not', hasar: 'Hasar krokisi ve kontroller', kosullar: 'Şartlar ve garanti metni', imza: 'İmza alanları', qr: 'QR kod (takip linki)', alt: 'Alt bilgi',
  };
  const DEF = { paper: 'A4', accent: '#4f46e5', font: 13, logo: '', order: Object.keys(BLOCKS), hide: [], headerNote: '', terms: 'Takılan parçalar ve verilen hizmet, belgede belirtilen süre boyunca garantilidir. Garanti; kullanıcı hatası, kaza ve yetkisiz müdahalelerde geçersizdir.', footer: 'Bizi tercih ettiğiniz için teşekkür ederiz.', signLabels: 'Teslim eden|Teslim alan', cols: { unit: true, disc: true } };
  const store = () => { const db = NS.app && NS.app.db; if (!db) return {}; const s = db.settings(); return (s.docTemplates = s.docTemplates || {}); };
  // Varsayılanlar: genel şablon ← belge türünün kendi varsayılanları (define(..., { defaults })) ← işletmenin kaydettiği şablon
  const tdef = (type) => (((TYPES[appId()] || {})[type] || {}).defaults || {});
  const tplOf = (type) => ({ ...DEF, ...tdef(type), ...(store()[type] || {}), cols: { ...DEF.cols, ...(tdef(type).cols || {}), ...((store()[type] || {}).cols || {}) } });
  const saveTpl = (type, t) => { store()[type] = t; NS.app.db.save(); };
  const biz = () => { const s = (NS.app && NS.app.db && NS.app.db.settings()) || {}; return { name: s.bizName || 'İşletme', address: s.bizAddress || '', phone: s.bizPhone || '', tax: [s.taxOffice, s.taxNo].filter(Boolean).join(' · ') }; };
  const PAPER = { A4: { w: '210mm', pad: '14mm', css: '@page{size:A4;margin:0}' }, A5: { w: '148mm', pad: '10mm', css: '@page{size:A5;margin:0}' }, '80mm': { w: '72mm', pad: '3mm', css: '@page{size:80mm auto;margin:0}', slim: true }, '58mm': { w: '50mm', pad: '2mm', css: '@page{size:58mm auto;margin:0}', slim: true } };

  function render(type, d, tpl = tplOf(type)) {
    const P = PAPER[tpl.paper] || PAPER.A4; const slim = P.slim; const b = biz(); const A = tpl.accent;
    const money = typeof d.money === 'function' ? d.money : NS.money; // dövizli belgeler kendi para biçimini verir
    const hide = new Set(tpl.hide || []); const [sl1, sl2] = String(tpl.signLabels || DEF.signLabels).split('|');
    const kv = (rows) => rows.filter((r) => r && r[1] !== undefined && r[1] !== '').map(([k, v]) => `<div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>`).join('');
    const parts = {
      baslik: () => `<div class="hd"><div class="hd-l">${tpl.logo ? `<img src="${tpl.logo}" alt="" class="logo">` : ''}<div><div class="bn">${esc(b.name)}</div><div class="sm">${esc(b.address)}</div><div class="sm">${esc([b.phone, b.tax].filter(Boolean).join(' · '))}</div></div></div>
        <div class="hd-r"><div class="dt">${esc(d.title || (TYPES[appId()] || {})[type]?.label || 'Belge')}</div>${d.no ? `<div class="no">${esc(d.no)}</div>` : ''}<div class="sm">${esc(d.date ? NS.dt(d.date) : NS.dt(new Date().toISOString()))}</div></div></div>${tpl.headerNote ? `<div class="hn">${esc(tpl.headerNote)}</div>` : ''}`,
      bilgi: () => (d.info && d.info.length ? `<div class="kv">${kv(d.info)}</div>` : ''),
      taraf: () => (d.party ? `<div class="box"><div class="bt">${esc(d.party.title || 'Müşteri')}</div><b>${esc(d.party.name || '')}</b>${(d.party.lines || []).filter(Boolean).map((l) => `<div class="sm">${esc(l)}</div>`).join('')}</div>` : ''),
      kalemler: () => (d.lines && d.lines.length ? `<table class="tb"><thead><tr><th>#</th><th>Açıklama</th><th class="r">Miktar</th>${tpl.cols.unit && !slim ? '<th class="r">Birim</th>' : ''}${tpl.cols.disc && !slim && d.lines.some((l) => l.disc) ? '<th class="r">İnd.</th>' : ''}<th class="r">Tutar</th></tr></thead><tbody>
        ${d.lines.map((l, i) => `<tr><td class="n">${i + 1}</td><td>${esc(l.name)}${l.note ? `<div class="sm">${esc(l.note)}</div>` : ''}</td><td class="r">${esc(l.qty)}${l.unit ? ' ' + esc(l.unit) : ''}</td>${tpl.cols.unit && !slim ? `<td class="r">${money(l.price || 0)}</td>` : ''}${tpl.cols.disc && !slim && d.lines.some((x) => x.disc) ? `<td class="r">${l.disc ? '%' + l.disc : ''}</td>` : ''}<td class="r">${money(l.total != null ? l.total : (l.qty || 0) * (l.price || 0))}</td></tr>`).join('')}</tbody></table>` : ''),
      toplam: () => (d.totals && d.totals.length ? `<div class="tt">${d.totals.map(([k, v, bold]) => `<div class="${bold ? 'b' : ''}"><span>${esc(k)}</span><span>${typeof v === 'number' ? money(v) : esc(v)}</span></div>`).join('')}</div>` : ''),
      not: () => (d.note ? `<div class="nt">${esc(d.note).replace(/\n/g, '<br>')}</div>` : ''),
      hasar: () => (d.damage ? `<div class="dm"><div class="bt">Araç durumu</div><div class="dm-in">${d.damage.svg || ''}<div class="sm">${(d.damage.marks || []).map((x, i) => `<div><b>${i + 1}.</b> ${esc(x)}</div>`).join('') || 'Hasar işaretlenmedi'}</div></div></div>` : ''),
      kosullar: () => (tpl.terms ? `<div class="tr">${esc(tpl.terms).replace(/\n/g, '<br>')}</div>` : ''),
      imza: () => { const S = d.signatures || []; const sg = (lab, i) => { const s = S[i] || {}; return `<div class="sg"><div class="sg-i">${s.img ? `<img src="${s.img}" alt="İmza">` : ''}</div><div class="sg-l">${esc(s.label || lab)}</div>${s.name ? `<div class="sm">${esc(s.name)}${s.at ? ' · ' + NS.dt(s.at) : ''}</div>` : ''}</div>`; }; return `<div class="sgs">${sg(sl1, 0)}${sg(sl2, 1)}</div>`; },
      qr: () => (d.qr && d.qr.url ? `<div class="qr">${NS.qrSvg ? NS.qrSvg(d.qr.url, 84) : ''}<div class="sm">${esc(d.qr.label || 'Durumu takip edin')}<br><span class="u">${esc(d.qr.url)}</span></div></div>` : ''),
      alt: () => (tpl.footer ? `<div class="ft">${esc(tpl.footer)}</div>` : ''),
    };
    const body = (tpl.order || DEF.order).filter((k) => parts[k] && !hide.has(k)).map((k) => parts[k]()).join('');
    const css = `.nd{--a:${A};width:${P.w};padding:${P.pad};box-sizing:border-box;margin:0 auto;font:${slim ? 11 : tpl.font}px/1.45 Inter,Arial,sans-serif;color:#111;background:#fff}
      .nd .sm{font-size:.82em;color:#555}.nd .hd{display:flex;justify-content:space-between;gap:12px;${slim ? 'flex-direction:column;text-align:center;align-items:center' : ''};padding-bottom:10px;border-bottom:3px solid var(--a);margin-bottom:12px}
      .nd .hd-l{display:flex;gap:10px;align-items:center;${slim ? 'flex-direction:column' : ''}}.nd .logo{max-height:${slim ? 40 : 56}px;max-width:160px}.nd .bn{font-weight:800;font-size:1.25em}
      .nd .hd-r{text-align:${slim ? 'center' : 'right'}}.nd .dt{font-weight:800;color:var(--a);font-size:1.2em;text-transform:uppercase;letter-spacing:.04em}.nd .no{font-family:ui-monospace,Consolas,monospace;font-weight:700}
      .nd .hn{background:color-mix(in srgb,var(--a) 8%,#fff);padding:6px 10px;border-radius:6px;margin-bottom:10px}
      .nd .kv{display:grid;grid-template-columns:${slim ? 'auto 1fr' : 'auto 1fr auto 1fr'};gap:3px 12px;margin-bottom:10px}.nd .k{color:#666}.nd .v{font-weight:600}
      .nd .box,.nd .dm{border:1px solid #ddd;border-radius:8px;padding:8px 10px;margin-bottom:10px}.nd .bt{font-size:.75em;text-transform:uppercase;letter-spacing:.06em;color:var(--a);font-weight:700;margin-bottom:3px}
      .nd .tb{width:100%;border-collapse:collapse;margin:6px 0}.nd .tb th{background:color-mix(in srgb,var(--a) 10%,#fff);color:#222;text-align:left;font-size:.8em;padding:5px 6px}.nd .tb td{padding:5px 6px;border-bottom:1px solid #eee;vertical-align:top}.nd .r{text-align:right;white-space:nowrap}.nd .n{color:#999;width:18px}
      .nd .tt{margin:6px 0 10px auto;width:${slim ? '100%' : '46%'}}.nd .tt div{display:flex;justify-content:space-between;padding:2px 0}.nd .tt .b{border-top:2px solid #111;margin-top:4px;padding-top:5px;font-weight:800;font-size:1.15em}
      .nd .nt,.nd .tr{margin:8px 0;padding:8px 10px;background:#fafafa;border-radius:6px}.nd .tr{font-size:.82em;color:#444}
      .nd .dm-in{display:flex;gap:12px;align-items:flex-start}.nd .dm-in svg{width:${slim ? 120 : 190}px;flex:none}
      .nd .sgs{display:grid;grid-template-columns:${slim ? '1fr' : '1fr 1fr'};gap:16px;margin-top:14px}.nd .sg-i{height:64px;border-bottom:1px solid #333;display:flex;align-items:flex-end;justify-content:center}.nd .sg-i img{max-height:60px;max-width:100%}.nd .sg-l{font-weight:700;margin-top:4px;text-align:center}.nd .sg .sm{text-align:center}
      .nd .qr{display:flex;gap:10px;align-items:center;margin-top:12px}.nd .qr svg{width:84px;height:84px}.nd .u{font-family:ui-monospace,Consolas,monospace;word-break:break-all}
      .nd .ft{text-align:center;margin-top:14px;color:#666;font-size:.85em}${P.css}`;
    return `<style>${css}</style><div class="nd">${body}</div>`;
  }
  function print(type, data) { NS.printHtml(render(type, data), { title: data.no || 'Belge' }); }

  // ---------- Hasar krokisi (araç üstten görünüm) ----------
  const CAR = `<svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#9aa3b2" stroke-width="2.5" stroke-linejoin="round"><path d="M60 22 Q100 4 140 22 L160 70 Q170 110 168 180 Q170 250 160 300 L140 340 Q100 356 60 340 L40 300 Q30 250 32 180 Q30 110 40 70 Z"/><path d="M58 92 Q100 76 142 92 L136 136 Q100 128 64 136 Z"/><path d="M64 236 Q100 244 136 236 L142 280 Q100 294 58 280 Z"/><path d="M64 140 L64 232 M136 140 L136 232"/><rect x="18" y="74" width="16" height="44" rx="6"/><rect x="166" y="74" width="16" height="44" rx="6"/><rect x="18" y="246" width="16" height="44" rx="6"/><rect x="166" y="246" width="16" height="44" rx="6"/></g><text x="100" y="16" font-size="11" text-anchor="middle" fill="#9aa3b2">ÖN</text><text x="100" y="358" font-size="11" text-anchor="middle" fill="#9aa3b2">ARKA</text></svg>`;
  const DMG = { cizik: ['Çizik', '#f59e0b'], gocuk: ['Göçük', '#ef4444'], kirik: ['Kırık', '#7c3aed'], boya: ['Boya farkı', '#0ea5e9'] };
  const carSvg = (marks = []) => CAR.replace('</svg>', marks.map((m, i) => `<g><circle cx="${m.x}" cy="${m.y}" r="9" fill="${(DMG[m.t] || DMG.cizik)[1]}" opacity=".9"/><text x="${m.x}" y="${m.y + 4}" font-size="10" font-weight="700" text-anchor="middle" fill="#fff">${i + 1}</text></g>`).join('') + '</svg>');
  // Tıkla-işaretle düzenleyici; marks dizisini yerinde günceller
  function damageEditor(host, marks, onChange) {
    let tool = 'cizik';
    const draw = () => {
      host.innerHTML = `<div class="nv-dmg"><div class="nv-dmg-car" title="Hasarlı noktaya tıklayın">${carSvg(marks)}</div><div class="col" style="gap:8px;min-width:0;flex:1">
        <div class="seg">${Object.entries(DMG).map(([k, [l, c]]) => `<button type="button" data-dt="${k}" class="${tool === k ? 'active' : ''}"><span class="dot" style="background:${c}"></span> ${l}</button>`).join('')}</div>
        <div class="small muted">Aracın üzerinde hasarlı noktaya tıklayın. İşarete tekrar tıklarsanız silinir.</div>
        ${marks.map((m, i) => `<div class="row nw small"><b>${i + 1}.</b><span class="dot" style="background:${(DMG[m.t] || DMG.cizik)[1]}"></span><input class="input" style="height:32px" data-mn="${i}" value="${esc(m.note || '')}" placeholder="${(DMG[m.t] || DMG.cizik)[0]} — açıklama (ör. sağ ön çamurluk)"></div>`).join('')}</div></div>`;
    };
    host.addEventListener('click', (e) => {
      const t = e.target.closest('[data-dt]'); if (t) { tool = t.dataset.dt; draw(); return; }
      const svg = e.target.closest('.nv-dmg-car svg'); if (!svg) return;
      const r = svg.getBoundingClientRect(); const x = Math.round(((e.clientX - r.left) / r.width) * 200), y = Math.round(((e.clientY - r.top) / r.height) * 360);
      const hit = marks.findIndex((m) => Math.hypot(m.x - x, m.y - y) < 12);
      if (hit >= 0) marks.splice(hit, 1); else marks.push({ x, y, t: tool, note: '' });
      draw(); onChange && onChange(marks);
    });
    host.addEventListener('input', (e) => { const i = e.target.dataset.mn; if (i != null) { marks[i].note = e.target.value; onChange && onChange(marks); } });
    draw();
  }
  const damageText = (marks = []) => marks.map((m) => `${(DMG[m.t] || DMG.cizik)[0]}${m.note ? ': ' + m.note : ''}`);

  // ---------- Şablon tasarımcısı ----------
  function designer(el) {
    const types = TYPES[appId()] || {}; const keys = Object.keys(types);
    if (!keys.length) { el.innerHTML = NS.pageHead('Belge şablonları') + '<div class="card pad empty">Bu üründe tasarlanabilir belge yok</div>'; return; }
    let type = keys[0]; let t = tplOf(type);
    const draw = () => {
      const sample = types[type].sample ? types[type].sample() : { title: types[type].label };
      el.innerHTML = NS.pageHead('Belge şablonları', 'Yazdırdığınız belgeleri işletmenize göre tasarlayın: kâğıt boyu, logo, renk, bölümler ve metinler. Değişiklik önizlemede anında görünür.', `<button class="btn" data-dz="test">${icon('print')} Deneme yazdır</button><button class="btn primary" data-dz="save">${icon('check')} Şablonu kaydet</button>`) + `
        <div class="seg mb">${keys.map((k) => `<button data-dtp="${k}" class="${k === type ? 'active' : ''}">${esc(types[k].label)}</button>`).join('')}</div>
        <div class="nv-dz"><div class="col" style="gap:14px">
          <div class="card pad col"><h3>Sayfa</h3><div class="form-grid">
            <div class="field"><label>Kâğıt</label><select class="input" data-t="paper">${Object.keys(PAPER).map((p) => `<option ${p === t.paper ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            <div class="field"><label>Vurgu rengi</label><input class="input" type="color" data-t="accent" value="${esc(t.accent)}" style="padding:4px"></div>
            <div class="field"><label>Yazı boyu</label><input class="input" type="number" min="10" max="16" data-t="font" value="${t.font}"></div>
            <div class="field"><label>Logo</label><div class="row nw"><label class="btn sm">${icon('upload')} Yükle<input type="file" accept="image/*" data-logo hidden></label>${t.logo ? `<button class="btn sm ghost" data-dz="nologo">Kaldır</button>` : ''}</div></div></div></div>
          <div class="card"><div class="card-h"><h3>Bölümler</h3><span class="small faint">Sırayı oklarla değiştirin</span></div>
            ${t.order.map((k, i) => `<div class="list-item" style="padding:8px 14px"><label class="check grow"><input type="checkbox" data-blk="${k}" ${t.hide.includes(k) ? '' : 'checked'}> ${esc(BLOCKS[k])}</label><button class="btn sm icon ghost" data-up="${i}" ${i ? '' : 'disabled'} title="Yukarı">↑</button><button class="btn sm icon ghost" data-dn="${i}" ${i < t.order.length - 1 ? '' : 'disabled'} title="Aşağı">↓</button></div>`).join('')}</div>
          <div class="card pad col"><h3>Metinler</h3>
            <div class="field"><label>Başlık altı not</label><input class="input" data-t="headerNote" value="${esc(t.headerNote)}" placeholder="ör. Yetkili servis · 7/24 yol yardım"></div>
            <div class="field"><label>Şartlar / garanti metni</label><textarea class="input" rows="4" data-t="terms">${esc(t.terms)}</textarea></div>
            <div class="field"><label>İmza başlıkları (| ile ayırın)</label><input class="input" data-t="signLabels" value="${esc(t.signLabels)}"></div>
            <div class="field"><label>Alt bilgi</label><input class="input" data-t="footer" value="${esc(t.footer)}"></div>
            <label class="check small"><input type="checkbox" data-col="unit" ${t.cols.unit ? 'checked' : ''}> Birim fiyat sütunu</label><label class="check small"><input type="checkbox" data-col="disc" ${t.cols.disc ? 'checked' : ''}> İndirim sütunu</label></div>
        </div><div class="nv-dz-prev"><div class="nv-dz-paper">${render(type, sample, t)}</div></div></div>`;
    };
    const prev = () => { const p = el.querySelector('.nv-dz-paper'); if (p) p.innerHTML = render(type, types[type].sample ? types[type].sample() : {}, t); };
    el.addEventListener('input', (e) => { const k = e.target.dataset.t; if (k) { t[k] = e.target.type === 'number' ? Number(e.target.value) : e.target.value; prev(); } });
    el.addEventListener('change', (e) => {
      const x = e.target;
      if (x.dataset.t === 'paper') { t.paper = x.value; prev(); }
      if (x.dataset.blk) { t.hide = x.checked ? t.hide.filter((k) => k !== x.dataset.blk) : [...t.hide, x.dataset.blk]; prev(); }
      if (x.dataset.col) { t.cols[x.dataset.col] = x.checked; prev(); }
      if (x.dataset.logo !== undefined && x.files && x.files[0]) {
        const f = x.files[0]; if (f.size > 400e3) return NS.toast('Logo en fazla 400 KB olmalı', 'err');
        const r = new FileReader(); r.onload = () => { t.logo = r.result; draw(); }; r.readAsDataURL(f);
      }
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.dtp) { type = b.dataset.dtp; t = tplOf(type); draw(); }
      const mv = (i, j) => { const o = [...t.order]; [o[i], o[j]] = [o[j], o[i]]; t.order = o; draw(); };
      if (b.dataset.up) mv(+b.dataset.up, +b.dataset.up - 1);
      if (b.dataset.dn) mv(+b.dataset.dn, +b.dataset.dn + 1);
      if (b.dataset.dz === 'nologo') { t.logo = ''; draw(); }
      if (b.dataset.dz === 'save') { saveTpl(type, t); NS.toast('Şablon kaydedildi — bundan sonraki belgeler bu tasarımla yazdırılır', 'ok'); }
      if (b.dataset.dz === 'test') NS.printHtml(render(type, types[type].sample ? types[type].sample() : {}, t), { title: 'Deneme' });
    });
    draw();
  }

  // Belge türü tanımlayan ürünlere "Belge şablonları" sayfası
  const origShell = NS.shell;
  NS.shell = function (opts) {
    if (opts && TYPES[opts.id] && !opts.routes.belgeler) {
      opts.routes.belgeler = (el) => designer(el);
      const k = opts.nav.findIndex((n) => n.id === 'ayarlar');
      const item = { id: 'belgeler', label: 'Belge şablonları', icon: 'print', roles: ['admin'] };
      if (k >= 0) opts.nav.splice(k, 0, item); else opts.nav.push(item);
    }
    return origShell.call(this, opts);
  };

  // Hasar krokisi penceresi: işaretleri döndürür (vazgeçilirse null)
  function damageModal(marks = [], title = 'Araç durumu') {
    const M = marks.map((m) => ({ ...m }));
    return new Promise((res) => { let done = false; const m = NS.modal({ title, size: 'wide', body: '<div id="dmx"></div>', actions: [{ label: 'Hasar yok', onClick: (cl) => { done = true; res([]); cl(); } }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (cl) => { done = true; res(M); cl(); } }], onClose: () => { if (!done) res(null); } }); damageEditor(m.root.querySelector('#dmx'), M); });
  }
  // Kayıtta imza yoksa önce imzalatır (vazgeçilirse imzasız devam), sonra işletmenin şablonuyla yazdırır
  async function signAndPrint({ rec, field, db, sign, type, data }) {
    if (rec && field && !rec[field] && sign) { const s = await NS.sign(sign); if (s) { rec[field] = s; if (db) db.save(); } }
    print(type, data());
  }
  NS.docs = { define: (app, type, def) => { (TYPES[app] = TYPES[app] || {})[type] = def; }, render, print, designer, tplOf, damageEditor, damageModal, carSvg, damageText, signAndPrint, BLOCKS };
  NS.sign = sign;
})();
