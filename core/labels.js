/* NEBSOFT etiket tasarımcısı — raf, barkod ve fiyat etiketleri (POS, butik, eczane, toptan…)
   • Şablon: { id, name, w, h (mm), els: [{ id, f (alan), x, y, w, h (mm), size (pt), bold, align, color, bg }] }
   • Alanlar: ad, fiyat, eski fiyat, barkod (çizgi), barkod no, birim fiyat, birim, kategori, raf, tarih, işletme, serbest metin, kutu/çizgi
   • NS.labels.designer(el, db, sample) — sürükle-bırak, köşeden boyutlandır, özellik paneli, canlı önizleme, şablon kaydet/kopyala/sil
   • NS.labels.print(db, products, tplId) — seçilen şablonla A4 sayfaya dizerek ya da etiket yazıcısına (her etiket bir sayfa) yazdırır */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { esc, icon, money } = NS;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const FIELDS = { name: 'Ürün adı', price: 'Fiyat', old: 'Eski fiyat (üstü çizili)', barcode: 'Barkod (çizgiler)', code: 'Barkod numarası', unitPrice: 'Birim fiyat (kg/lt)', unit: 'Birim', cat: 'Kategori', shelf: 'Raf / reyon', date: 'Tarih', biz: 'İşletme adı', text: 'Serbest metin', box: 'Kutu / çizgi' };
  const E = (f, x, y, w, h, o = {}) => ({ id: uid(), f, x, y, w, h, size: 10, bold: false, align: 'left', color: '#000000', ...o });
  const PRESETS = [
    { id: 'raf', name: 'Raf etiketi 58×40', w: 58, h: 40, els: [E('name', 3, 2.5, 52, 9, { size: 10, bold: true }), E('price', 3, 12, 52, 13, { size: 26, bold: true, align: 'right' }), E('unitPrice', 3, 25.5, 30, 4, { size: 6.5 }), E('barcode', 3, 29, 34, 8), E('date', 38, 33, 17, 4, { size: 6, align: 'right' })] },
    { id: 'barkod', name: 'Barkod etiketi 40×30', w: 40, h: 30, els: [E('name', 2, 2, 36, 6, { size: 7.5, bold: true, align: 'center' }), E('barcode', 3, 9, 34, 12), E('code', 2, 21.5, 36, 3.5, { size: 6.5, align: 'center' }), E('price', 2, 25, 36, 4.5, { size: 9, bold: true, align: 'center' })] },
    { id: 'fiyat', name: 'Fiyat etiketi 70×45', w: 70, h: 45, els: [E('box', 0, 0, 70, 9, { bg: '#e11d48' }), E('text', 3, 1.5, 64, 6, { size: 11, bold: true, color: '#ffffff', text: 'İNDİRİM' }), E('name', 3, 11, 64, 8, { size: 11, bold: true }), E('old', 3, 20, 30, 6, { size: 11 }), E('price', 3, 25, 64, 15, { size: 30, bold: true, align: 'right', color: '#e11d48' }), E('unitPrice', 3, 40, 40, 4, { size: 6.5 })] },
    { id: 'buyuk', name: 'Büyük raf 100×50', w: 100, h: 50, els: [E('cat', 4, 3, 50, 4, { size: 7, color: '#555555' }), E('name', 4, 7, 92, 12, { size: 15, bold: true }), E('price', 40, 20, 56, 20, { size: 40, bold: true, align: 'right' }), E('barcode', 4, 24, 34, 13), E('code', 4, 37.5, 34, 3.5, { size: 6.5 }), E('unitPrice', 4, 43, 60, 4, { size: 7 }), E('shelf', 70, 43, 26, 4, { size: 7, align: 'right' })] },
    { id: 'mini', name: 'Mini 30×20', w: 30, h: 20, els: [E('name', 1.5, 1.5, 27, 5, { size: 6, bold: true }), E('barcode', 2, 6.5, 26, 7), E('price', 1.5, 14, 27, 5, { size: 9, bold: true, align: 'center' })] },
  ];
  const tpls = (db) => { if (!Array.isArray(db.data.labelTpls) || !db.data.labelTpls.length) { db.data.labelTpls = JSON.parse(JSON.stringify(PRESETS)); } return db.data.labelTpls; };
  const val = (f, p, ctx = {}) => {
    const unit = p.unit === 'kg' ? 'kg' : p.unit || 'adet';
    switch (f) {
      case 'name': return p.name || ''; case 'price': return money(p.price || 0).replace(',00', '') + (p.unit === 'kg' ? '/kg' : ''); case 'old': return p.oldPrice ? money(p.oldPrice) : money((p.price || 0) * 1.2);
      case 'code': return p.barcode || (p.plu ? 'PLU ' + p.plu : ''); case 'unitPrice': return p.unitPrice ? `Birim fiyat: ${p.unitPrice}` : `Birim fiyat: ${money(p.price || 0)} / ${unit}`;
      case 'unit': return unit; case 'cat': return ctx.cat || ''; case 'shelf': return p.shelf ? 'Raf ' + p.shelf : ''; case 'date': return new Date().toLocaleDateString('tr-TR'); case 'biz': return ctx.biz || ''; default: return '';
    }
  };
  // Tek etiketin HTML'i (mm ölçülerinde; ekranda ölçeklenir, baskıda gerçek boyut)
  function labelHtml(t, p, ctx = {}) {
    return `<div class="lb" style="width:${t.w}mm;height:${t.h}mm">${t.els.map((e) => {
      const st = `left:${e.x}mm;top:${e.y}mm;width:${e.w}mm;height:${e.h}mm;font-size:${e.size}pt;font-weight:${e.bold ? 800 : 500};text-align:${e.align};color:${e.color || '#000'};${e.bg ? `background:${e.bg};` : ''}justify-content:${e.align === 'right' ? 'flex-end' : e.align === 'center' ? 'center' : 'flex-start'}`;
      const inner = e.f === 'barcode' ? (p.barcode ? NS.barcodeSvg(String(p.barcode), { height: 40 }).replace('<svg', '<svg preserveAspectRatio="none" style="width:100%;height:100%"') : '') : e.f === 'box' ? '' : e.f === 'old' ? `<s>${esc(val('old', p, ctx))}</s>` : esc(e.f === 'text' ? e.text || '' : val(e.f, p, ctx));
      return `<div class="lb-e" data-e="${e.id}" style="${st}">${inner}</div>`; }).join('')}</div>`;
  }
  const CSS = '.lb{position:relative;overflow:hidden;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}.lb-e{position:absolute;display:flex;align-items:center;line-height:1.05;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;box-sizing:border-box}.lb-e svg{display:block}';

  function print(db, products, tplId, { roll } = {}) {
    const t = tpls(db).find((x) => x.id === tplId) || tpls(db)[0]; const s = db.settings ? db.settings() : {};
    const cats = Object.fromEntries((db.all ? db.all('cats') : []).map((c) => [c.id, c.name]));
    const items = products.flatMap((p) => Array.from({ length: Math.max(1, Number(p.copies) || 1) }, () => p));
    const body = roll ? items.map((p) => `<div class="pg">${labelHtml(t, p, { biz: s.bizName, cat: cats[p.cat] })}</div>`).join('')
      : `<div class="sheet">${items.map((p) => labelHtml(t, p, { biz: s.bizName, cat: cats[p.cat] })).join('')}</div>`;
    NS.printHtml(`<style>${CSS}@page{${roll ? `size:${t.w}mm ${t.h}mm;margin:0` : 'size:A4;margin:8mm'}}body{margin:0;padding:0}.pg{page-break-after:always}.sheet{display:flex;flex-wrap:wrap;gap:2mm}.sheet .lb{outline:.2mm dashed #bbb}</style>${body}`, { title: t.name });
  }

  // ---------- Tasarımcı ----------
  function designer(el, db, sample, onSaved) {
    const list = tpls(db); let t = JSON.parse(JSON.stringify(list[0])); let sel = null; const PX = 6; // ekranda 1 mm = 6 px
    const draw = () => {
      el.innerHTML = `<div class="ld"><aside class="ld-side">
          <div class="field"><label>Şablon</label><select class="input" id="ldt">${tpls(db).map((x) => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <div class="row" style="gap:6px"><button class="btn sm" data-ld="new">${icon('plus')} Yeni</button><button class="btn sm" data-ld="copy">${icon('copy')} Kopyala</button><button class="btn sm ghost" data-ld="del">${icon('trash')}</button></div>
          <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="field full"><label>Ad</label><input class="input" data-tp="name" value="${esc(t.name)}"></div><div class="field"><label>En (mm)</label><input class="input" type="number" data-tp="w" value="${t.w}"></div><div class="field"><label>Boy (mm)</label><input class="input" type="number" data-tp="h" value="${t.h}"></div></div>
          <div class="ld-sec">Öğe ekle</div><div class="ld-add">${Object.entries(FIELDS).map(([k, l]) => `<button class="btn sm" data-add="${k}">${esc(l)}</button>`).join('')}</div>
          <div class="ld-sec">Seçili öğe</div><div id="ldp">${sel ? props(t.els.find((e) => e.id === sel)) : '<p class="small muted">Etiket üzerinde bir öğeye tıklayın. Sürükleyerek taşıyın, sağ alt köşeden boyutlandırın; ok tuşlarıyla 0,5 mm kaydırın.</p>'}</div>
          <button class="btn primary block" data-ld="save">${icon('check')} Şablonu kaydet</button></aside>
        <section class="ld-stage"><div class="ld-canvas" style="width:${t.w * PX}px;height:${t.h * PX}px"><div class="ld-scale" style="transform:scale(${PX / 3.7795})">${labelHtml(t, sample)}</div>${t.els.map((e) => `<div class="ld-h${e.id === sel ? ' on' : ''}" data-h="${e.id}" style="left:${e.x * PX}px;top:${e.y * PX}px;width:${e.w * PX}px;height:${e.h * PX}px"><span class="ld-r" data-r="${e.id}"></span></div>`).join('')}</div>
          <p class="small muted center mt">Gerçek boyut: ${t.w} × ${t.h} mm · Önizleme ürünü: <b>${esc(sample.name || '')}</b></p></section></div>`;
    };
    const props = (e) => `<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px">
      <div class="field full"><label>Alan</label><select class="input" data-p="f">${Object.entries(FIELDS).map(([k, l]) => `<option value="${k}" ${k === e.f ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      ${e.f === 'text' ? `<div class="field full"><label>Metin</label><input class="input" data-p="text" value="${esc(e.text || '')}"></div>` : ''}
      <div class="field"><label>Yazı (pt)</label><input class="input" type="number" step="0.5" data-p="size" value="${e.size}"></div>
      <div class="field"><label>Hizalama</label><select class="input" data-p="align">${[['left', 'Sol'], ['center', 'Orta'], ['right', 'Sağ']].map(([v, l]) => `<option value="${v}" ${v === e.align ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Renk</label><input class="input" type="color" data-p="color" value="${e.color || '#000000'}" style="padding:3px"></div>
      <div class="field"><label>Zemin</label><input class="input" type="color" data-p="bg" value="${e.bg || '#ffffff'}" style="padding:3px"></div>
      <label class="check full"><input type="checkbox" data-p="bold" ${e.bold ? 'checked' : ''}> Kalın</label>
      <button class="btn sm danger full" data-ld="rm">${icon('trash')} Öğeyi sil</button></div>`;
    const cur = () => t.els.find((e) => e.id === sel);
    const snap = (v) => Math.round(v * 2) / 2;
    el.addEventListener('input', (ev) => { const x = ev.target; if (x.dataset.tp) { t[x.dataset.tp] = x.type === 'number' ? Number(x.value) || 1 : x.value; if (x.dataset.tp !== 'name') draw(); } if (x.dataset.p && cur()) { const e = cur(); e[x.dataset.p] = x.type === 'checkbox' ? x.checked : x.type === 'number' ? Number(x.value) : x.value; if (x.dataset.p === 'bg' && x.value === '#ffffff') delete e.bg; const s2 = el.querySelector('.ld-scale'); if (s2) s2.innerHTML = labelHtml(t, sample); if (x.dataset.p === 'f') draw(); } });
    el.addEventListener('change', (ev) => { if (ev.target.id === 'ldt') { t = JSON.parse(JSON.stringify(tpls(db).find((x) => x.id === ev.target.value))); sel = null; draw(); } });
    el.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.add) { const e = E(b.dataset.add, 2, 2, Math.min(t.w - 4, b.dataset.add === 'barcode' ? 30 : 30), b.dataset.add === 'barcode' ? 10 : 6, b.dataset.add === 'text' ? { text: 'Metin' } : {}); t.els.push(e); sel = e.id; draw(); }
      const a = b.dataset.ld;
      if (a === 'rm') { t.els = t.els.filter((e) => e.id !== sel); sel = null; draw(); }
      if (a === 'new') { t = { id: uid(), name: 'Yeni şablon', w: 50, h: 30, els: [E('name', 2, 2, 46, 7, { bold: true }), E('price', 2, 10, 46, 10, { size: 20, bold: true, align: 'right' }), E('barcode', 2, 21, 30, 7)] }; sel = null; draw(); }
      if (a === 'copy') { t = { ...JSON.parse(JSON.stringify(t)), id: uid(), name: t.name + ' (kopya)' }; sel = null; draw(); }
      if (a === 'del') { if (tpls(db).length < 2) return NS.toast('En az bir şablon kalmalı', 'err'); if (!(await NS.confirm(`"${t.name}" şablonu silinsin mi?`))) return; db.data.labelTpls = tpls(db).filter((x) => x.id !== t.id); db.save(); t = JSON.parse(JSON.stringify(tpls(db)[0])); sel = null; draw(); }
      if (a === 'save') { const L = tpls(db); const i = L.findIndex((x) => x.id === t.id); if (i >= 0) L[i] = JSON.parse(JSON.stringify(t)); else L.push(JSON.parse(JSON.stringify(t))); db.save(); NS.toast('Şablon kaydedildi', 'ok'); draw(); if (onSaved) onSaved(t.id); }
    });
    // Sürükle / boyutlandır
    let drag = null;
    el.addEventListener('pointerdown', (ev) => {
      const h = ev.target.closest('[data-h]'); if (!h) { return; } ev.preventDefault();
      sel = h.dataset.h; const e = cur(); const rs = ev.target.closest('[data-r]');
      drag = { e, rs: !!rs, x0: ev.clientX, y0: ev.clientY, ox: e.x, oy: e.y, ow: e.w, oh: e.h, moved: false };
      $$('.ld-h').forEach((x) => x.classList.toggle('on', x.dataset.h === sel)); el.querySelector('#ldp').innerHTML = props(e);
      h.setPointerCapture(ev.pointerId);
    });
    el.addEventListener('pointermove', (ev) => {
      if (!drag) return; const dx = (ev.clientX - drag.x0) / PX, dy = (ev.clientY - drag.y0) / PX; const e = drag.e; drag.moved = true;
      if (drag.rs) { e.w = Math.max(2, snap(drag.ow + dx)); e.h = Math.max(2, snap(drag.oh + dy)); } else { e.x = Math.max(0, Math.min(t.w - 1, snap(drag.ox + dx))); e.y = Math.max(0, Math.min(t.h - 1, snap(drag.oy + dy))); }
      const h = el.querySelector(`[data-h="${e.id}"]`); Object.assign(h.style, { left: e.x * PX + 'px', top: e.y * PX + 'px', width: e.w * PX + 'px', height: e.h * PX + 'px' });
      const s2 = el.querySelector('.ld-scale'); if (s2) s2.innerHTML = labelHtml(t, sample);
    });
    el.addEventListener('pointerup', () => { drag = null; });
    el.addEventListener('keydown', (ev) => { const e = cur(); if (!e || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return; const d = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, -0.5], ArrowDown: [0, 0.5] }[ev.key]; if (d) { ev.preventDefault(); e.x = Math.max(0, e.x + d[0]); e.y = Math.max(0, e.y + d[1]); draw(); } if (ev.key === 'Delete') { t.els = t.els.filter((x) => x.id !== sel); sel = null; draw(); } });
    el.tabIndex = -1; draw();
  }
  const $$ = (s) => [...document.querySelectorAll(s)];
  if (!document.getElementById('nv-lb-css')) { const st = document.createElement('style'); st.id = 'nv-lb-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
  NS.labels = { PRESETS, FIELDS, tpls, labelHtml, print, designer, CSS };
})();
