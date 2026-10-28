/* NEBSOFT Ön Muhasebe — Excel / CSV'den toplu aktarım (cari, stok kartı, açılış bakiyesi ve stoğu)
   Başka programdan geçişte: dosya seçilir → sütunlar otomatik eşleştirilir (kullanıcı değiştirebilir) → satırlar doğrulanır
   → önizleme ve hata listesi → aktarım. Var olan kayıtlar VKN / stok kodu / barkod / ad ile bulunur; isteğe göre yalnızca boş alanları doldurulur. */
window.MUHAKTAR = (function () {
  'use strict';
  const { esc, $, $$, icon, money, toast, modal, badge, iso, today } = NS;
  let X; // { db, isStock, depots }
  const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
  const numOf = (v) => { if (v === '' || v == null) return null; let s = String(v).trim().replace(/[₺\s]/g, ''); if (/,\d{1,4}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); const n = Number(s); return Number.isFinite(n) ? n : NaN; };
  const digits = (v) => String(v || '').replace(/\D/g, '');

  const TYPES = {
    cari: {
      title: 'Cari hesapları içe aktar', col: 'caris',
      fields: [
        { k: 'name', l: 'Ünvan / ad soyad', req: true, al: ['ünvan', 'unvan', 'cariadı', 'cariadi', 'firma', 'firmaadı', 'adsoyad', 'adı', 'ad', 'müşteri', 'tedarikçi', 'name'] },
        { k: 'type', l: 'Tür (müşteri / tedarikçi / ikisi)', al: ['tür', 'tur', 'caritürü', 'tip', 'type'] },
        { k: 'taxNo', l: 'VKN / TCKN', al: ['vkn', 'tckn', 'vergino', 'vergikimlikno', 'vergino/tckn', 'vkntckn', 'tc', 'tckimlikno', 'taxno'] },
        { k: 'taxOffice', l: 'Vergi dairesi', al: ['vergidairesi', 'vd', 'taxoffice'] },
        { k: 'phone', l: 'Telefon', al: ['telefon', 'tel', 'gsm', 'cep', 'ceptelefonu', 'phone'] },
        { k: 'email', l: 'E-posta', al: ['eposta', 'email', 'mail', 'epostaadresi'] },
        { k: 'address', l: 'Adres', al: ['adres', 'açıkadres', 'address'] },
        { k: 'district', l: 'İlçe', al: ['ilçe', 'ilce', 'district'] },
        { k: 'city', l: 'İl', al: ['il', 'şehir', 'sehir', 'city'] },
        { k: 'term', l: 'Vade (gün)', num: true, al: ['vade', 'vadegün', 'vadegun', 'ödemevadesi', 'term'] },
        { k: 'opening', l: 'Açılış bakiyesi (+ bize borçlu, − biz borçluyuz)', num: true, al: ['bakiye', 'açılışbakiyesi', 'acilisbakiyesi', 'devir', 'devirbakiye', 'balance'] },
        { k: 'debit', l: 'veya Borç (bize borçlu)', num: true, al: ['borç', 'borc', 'debit'] },
        { k: 'credit', l: 'veya Alacak (biz borçluyuz)', num: true, al: ['alacak', 'credit'] },
      ],
      check(r) {
        const e = []; const t = digits(r.taxNo); if (r.taxNo && t.length !== 10 && t.length !== 11) e.push('VKN 10, TCKN 11 hane olmalı');
        const ty = norm(r.type); r.type = !ty ? 'musteri' : /tedar/.test(ty) ? 'tedarikci' : /ikisi|her|both/.test(ty) ? 'ikisi' : /müş|mus|alıcı|alici|cust/.test(ty) ? 'musteri' : (e.push(`Tür anlaşılamadı: "${r.type}"`), 'musteri');
        r.taxNo = t; if (r.email && !/^\S+@\S+\.\S+$/.test(r.email)) e.push('E-posta biçimi hatalı');
        if (r.opening == null && (r.debit != null || r.credit != null)) r.opening = (r.debit || 0) - (r.credit || 0); delete r.debit; delete r.credit;
        return e;
      },
      match: (r) => X.db.find('caris', (c) => (r.taxNo && String(c.taxNo || '') === r.taxNo) || norm(c.name) === norm(r.name)),
      make: (r) => ({ term: 30, ...r }),
      template: [['Ünvan', 'Tür', 'VKN/TCKN', 'Vergi dairesi', 'Telefon', 'E-posta', 'Adres', 'İlçe', 'İl', 'Vade', 'Açılış bakiyesi'], ['Örnek Ticaret Ltd. Şti.', 'Müşteri', '1234567890', 'Kavaklıdere', '0312 000 00 00', 'muhasebe@ornek.com.tr', 'Atatürk Blv. No:1', 'Çankaya', 'Ankara', 30, 12500]],
    },
    urun: {
      title: 'Stok ve hizmet kartlarını içe aktar', col: 'items',
      fields: [
        { k: 'code', l: 'Stok kodu', al: ['stokkodu', 'kod', 'ürünkodu', 'urunkodu', 'code', 'sku'] },
        { k: 'barcode', l: 'Barkod', al: ['barkod', 'barcode', 'ean', 'gtin'] },
        { k: 'name', l: 'Ad', req: true, al: ['ad', 'adı', 'ürünadı', 'urunadi', 'stokadı', 'stokadi', 'ürün', 'hizmet', 'açıklama', 'name'] },
        { k: 'kind', l: 'Tür (stok / hizmet)', al: ['tür', 'tur', 'tip', 'kind'] },
        { k: 'unit', l: 'Birim', al: ['birim', 'unit', 'ölçübirimi'] },
        { k: 'buy', l: 'Alış fiyatı (KDV hariç)', num: true, al: ['alış', 'alis', 'alışfiyatı', 'alisfiyati', 'maliyet', 'buy', 'cost'] },
        { k: 'price', l: 'Satış fiyatı (KDV hariç)', num: true, req: true, al: ['satış', 'satis', 'satışfiyatı', 'satisfiyati', 'fiyat', 'price'] },
        { k: 'vat', l: 'KDV %', num: true, al: ['kdv', 'kdvoranı', 'kdvorani', 'vat', 'kdv%'] },
        { k: 'min', l: 'Kritik stok', num: true, al: ['kritikstok', 'minstok', 'minimum', 'min'] },
        { k: 'group', l: 'Grup', al: ['grup', 'kategori', 'group', 'category'] },
        { k: 'stock', l: 'Açılış stoğu (miktar)', num: true, al: ['stok', 'miktar', 'açılışstoğu', 'acilisstogu', 'mevcut', 'qty', 'stock'] },
      ],
      check(r) {
        const e = []; const k = norm(r.kind); r.kind = !k ? 'stok' : /hiz|serv/.test(k) ? 'hizmet' : 'stok';
        if (r.vat == null) r.vat = 20; else if (![0, 1, 10, 20].includes(r.vat)) e.push(`KDV %${r.vat} geçerli değil (0, 1, 10, 20)`);
        r.unit = r.unit ? String(r.unit).toLocaleLowerCase('tr-TR') : 'adet'; if (r.stock != null && r.kind === 'hizmet') e.push('Hizmet kartına stok girilemez');
        if (r.price != null && r.price < 0) e.push('Fiyat eksi olamaz');
        return e;
      },
      match: (r) => X.db.find('items', (i) => (r.code && i.code === r.code) || (r.barcode && i.barcode === r.barcode) || norm(i.name) === norm(r.name)),
      make: (r) => ({ min: 5, ...r }),
      after(rec, r) { if (r.stock && X.isStock(rec)) X.db.data.moves.push({ id: NS.uid(), date: today(), item: rec.id, depot: X.depots()[0].id, qty: r.stock, type: 'acilis', refNo: 'Açılış (içe aktarım)' }); },
      template: [['Stok kodu', 'Barkod', 'Ad', 'Tür', 'Birim', 'Alış fiyatı', 'Satış fiyatı', 'KDV', 'Kritik stok', 'Grup', 'Açılış stoğu'], ['STK-001', '8690000000001', 'A4 fotokopi kağıdı (koli)', 'Stok', 'koli', 600, 850, 20, 5, 'Kırtasiye', 40]],
    },
  };

  function open(app, kind) {
    const T = TYPES[kind];
    modal({ title: T.title, size: 'wide', body: `<p class="mb">Excel (.xlsx) veya CSV dosyası seçin. İlk satır sütun başlıkları olmalı; sütun sırası önemli değil, bir sonraki adımda eşleştirirsiniz.</p>
      <div class="row wrap" style="gap:8px"><button class="btn primary" id="ia-f">${icon('upload')} Dosya seç</button><button class="btn" id="ia-t">${icon('download')} Örnek şablonu indir</button></div>
      <p class="small muted mt">Paraşüt, Logo, Mikro, Excel vb. programlardan aldığınız listeler doğrudan kullanılabilir. Hiçbir kayıt siz "Aktar" demeden değişmez.</p>`,
      actions: [{ label: 'Kapat' }],
      onOpen: (b, close) => {
        $('#ia-t', b).onclick = () => NS.xlsx(`${kind}-sablon`, T.template[0], T.template.slice(1));
        $('#ia-f', b).onclick = async () => { let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada veri satırı yok', 'err'); (close || (() => { const m = b.closest('.ns-modal-wrap, .ns-modal'); if (m) m.remove(); }))(); mapStep(app, kind, f); };
      } });
  }

  function guess(T, heads) {
    const used = new Set(); const map = {};
    T.fields.forEach((f) => { const h = heads.find((x) => !used.has(x) && f.al.includes(norm(x))) || heads.find((x) => !used.has(x) && f.al.some((a) => a.length > 3 && norm(x).includes(a))); if (h) { map[f.k] = h; used.add(h); } });
    return map;
  }

  function mapStep(app, kind, file) {
    const T = TYPES[kind]; const heads = Object.keys(file.rows[0]); const map = guess(T, heads); let upd = true;
    const build = () => file.rows.map((src, i) => { const r = {}; T.fields.forEach((f) => { const h = map[f.k]; if (!h) return; const v = String(src[h] == null ? '' : src[h]).trim(); if (v === '') return; r[f.k] = f.num ? numOf(v) : v; }); const e = []; T.fields.forEach((f) => { if (f.num && Number.isNaN(r[f.k])) { e.push(`${f.l}: sayı değil`); delete r[f.k]; } if (f.req && (r[f.k] == null || r[f.k] === '')) e.push(`${f.l} boş`); }); if (!e.length) e.push(...T.check(r)); return { n: i + 2, r, e, ex: e.length ? null : T.match(r) }; });
    modal({ title: `${T.title} — ${esc(file.name)}`, size: 'xl', body: `<div class="grid g2"><div><h3 class="mb">1. Sütunları eşleştirin</h3><div class="col" style="gap:6px">${T.fields.map((f) => `<label class="row between" style="gap:8px"><span class="small">${esc(f.l)}${f.req ? ' *' : ''}</span><select class="input" data-m="${f.k}" style="max-width:220px"><option value="">— Yok —</option>${heads.map((h) => `<option ${map[f.k] === h ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`).join('')}</div>
      <label class="row mt"><input type="checkbox" id="ia-u" checked> <span class="small">Var olan kayıtların yalnızca <b>boş</b> alanlarını doldur (işaretsizse var olanlar atlanır)</span></label></div><div><h3 class="mb">2. Kontrol</h3><div id="ia-s"></div></div></div><h3 class="mt mb">3. Önizleme (ilk 20 satır)</h3><div id="ia-p" class="tbl-wrap"></div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Aktar', cls: 'primary', icon: 'check', onClick: (close) => { const res = commit(T, build(), upd); close(); toast(`${res.add} yeni, ${res.upd} güncellendi, ${res.skip} atlandı`, res.err ? 'warn' : 'ok'); X.db.log(`İçe aktarım: ${T.title}`, `${file.name} · ${res.add} yeni, ${res.upd} güncellendi, ${res.skip} atlandı`); app.refresh(); } }],
      onOpen: (b) => {
        const draw = () => {
          const rows = build(); const bad = rows.filter((x) => x.e.length), ex = rows.filter((x) => !x.e.length && x.ex), nw = rows.filter((x) => !x.e.length && !x.ex);
          $('#ia-s', b).innerHTML = `<div class="col" style="gap:6px"><div>${badge(`${nw.length} yeni`, 'ok')} ${badge(`${ex.length} zaten var`, 'info')} ${badge(`${bad.length} hatalı`, bad.length ? 'err' : '')}</div>${bad.length ? `<div class="small" style="max-height:180px;overflow:auto">${bad.slice(0, 50).map((x) => `<div><b>Satır ${x.n}:</b> ${esc(x.e.join(' · '))}</div>`).join('')}${bad.length > 50 ? `<div>… ${bad.length - 50} satır daha</div>` : ''}<div class="muted mt">Hatalı satırlar aktarılmaz; dosyayı düzeltip tekrar yükleyebilirsiniz.</div></div>` : '<div class="small muted">Tüm satırlar geçerli.</div>'}</div>`;
          const cols = T.fields.filter((f) => map[f.k]);
          $('#ia-p', b).innerHTML = `<table class="tbl"><thead><tr><th>Satır</th><th>Durum</th>${cols.map((f) => `<th>${esc(f.l.split(' (')[0])}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, 20).map((x) => `<tr><td>${x.n}</td><td>${x.e.length ? badge('Hata', 'err') : x.ex ? badge('Var', 'info') : badge('Yeni', 'ok')}</td>${cols.map((f) => `<td class="small">${esc(x.r[f.k] == null ? '' : f.num ? NS.num(x.r[f.k]) : x.r[f.k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        };
        $$('[data-m]', b).forEach((s) => { s.onchange = () => { map[s.dataset.m] = s.value || undefined; draw(); }; });
        $('#ia-u', b).onchange = (e) => { upd = e.target.checked; };
        draw();
      } });
  }

  function commit(T, rows, upd) {
    const res = { add: 0, upd: 0, skip: 0, err: 0 };
    rows.forEach((x) => {
      if (x.e.length) { res.skip++; res.err++; return; }
      if (x.ex) { if (!upd) { res.skip++; return; } let ch = false; Object.entries(x.r).forEach(([k, v]) => { if (k === 'stock') return; if (x.ex[k] == null || x.ex[k] === '') { x.ex[k] = v; ch = true; } }); if (ch) res.upd++; else res.skip++; return; }
      const { stock, ...data } = x.r; const rec = X.db.insert(T.col, T.make(data), true); if (T.after) T.after(rec, x.r); res.add++;
    });
    X.db.save(); return res;
  }

  return { init(ctx) { X = ctx; }, open, TYPES, numOf, guess };
})();
