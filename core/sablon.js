/* NEBSOFT Hazır şablonlar — sektöre özel menü, hizmet, ürün, form ve tema içe aktarma
   • Şablonlar content/sablonlar/<program>/<ad>.json dosyalarındadır, /api/sablon/<program> ile gelir.
   • İçe aktarma idempotenttir: her kayıt sablon_anahtar taşır, ikinci basış mükerrer açmaz; aynı adlı eski kayıt ezilmez, atlanır.
   • Eklenen kayıtlar kaynak:'sablon' ve onay:false işaretlidir: fiyatlar boş gelir, işletme onaylamadan müşteri sitesine çıkmaz (bizsite.publicView).
   • Saf motor (onizle, uygula, onayla) sunucuda ve testlerde de çalışır. */
(function () {
  'use strict';
  const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  const norm = (s) => String(s == null ? '' : s).toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => TR[c]).replace(/[^a-z0-9]+/g, ' ').trim();
  const adAlan = (s) => s.adAlan || (s.tur === 'form' ? 'label' : 'name');
  const anahtar = (s, k) => `${s.sablon}#${k.anahtar}`;
  const koleksiyon = (data, s) => (s.tur === 'form' ? (data.sablonFormlar = data.sablonFormlar || []) : (data[s.hedef] = data[s.hedef] || []));
  const etiket = (s, k) => k[adAlan(s)] || k.label || k.anahtar;
  function durum(data, s, k) {
    if (s.tur === 'tema') return ((data._settings || {}).bookTema === k.anahtar ? 'var' : 'yeni');
    const L = Array.isArray(s.tur === 'form' ? data.sablonFormlar : data[s.hedef]) ? (s.tur === 'form' ? data.sablonFormlar : data[s.hedef]) : []; const key = anahtar(s, k); const a = adAlan(s); const n = norm(k[a]);
    if (L.some((x) => x && x.sablon_anahtar === key)) return 'var';
    return L.some((x) => x && norm(x[a]) === n) ? 'ayni_ad' : 'yeni'; // işletmenin kendi kaydı: dokunulmaz, üstüne yazılmaz
  }
  const onizle = (data, s) => s.kayitlar.map((k) => ({ anahtar: k.anahtar, ad: etiket(s, k), durum: durum(data, s, k) }));
  // secilen: anahtar listesi (boşsa tümü). Veriyi yerinde değiştirir; kaydetmek çağıranın işidir.
  function uygula(data, s, secilen, o = {}) {
    const uid = o.uid || (() => 'x' + Math.random().toString(36).slice(2, 10)); const simdi = o.simdi || new Date().toISOString();
    const set = secilen && secilen.length ? new Set(secilen) : null; const r = { eklenen: 0, atlanan: 0, kayitlar: [] };
    const bag = (alan, ad) => { const b = s.baglar[alan]; const L = (data[b.koleksiyon] = data[b.koleksiyon] || []); const f = b.adAlan || 'name'; const hit = L.find((x) => norm(x[f]) === norm(ad)); if (hit) return hit.id; const x = { id: uid(), ...(b.varsayilan || {}), [f]: ad, kaynak: 'sablon', sablon_anahtar: `${s.sablon}#bag:${norm(ad)}` }; L.push(x); return x.id; };
    for (const k of s.kayitlar) {
      if (set && !set.has(k.anahtar)) continue; if (durum(data, s, k) !== 'yeni') { r.atlanan++; continue; }
      if (s.tur === 'tema') { data._settings = data._settings || {}; Object.assign(data._settings, k.ayarlar, { bookTema: k.anahtar }); r.eklenen++; continue; }
      const { anahtar: _a, ...alanlar } = JSON.parse(JSON.stringify(k));
      const rec = { id: s.tur === 'form' ? 'sb-' + k.anahtar : uid(), ...JSON.parse(JSON.stringify(s.varsayilan || {})), ...alanlar };
      Object.keys(s.baglar || {}).forEach((a) => { if (rec[a]) rec[a] = bag(a, rec[a]); });
      Object.assign(rec, { kaynak: 'sablon', sablon_anahtar: anahtar(s, k), sablon_surum: s.surum }); if (s.tur === 'form') rec.uyari = s.uyari; else rec.onay = false;
      koleksiyon(data, s).push(rec); r.kayitlar.push(rec); r.eklenen++;
    }
    if (r.eklenen) { const m = (data._meta = data._meta || {}); const g = (m.sablonlar = m.sablonlar || {}); g[s.sablon] = { surum: s.surum, at: simdi, eklenen: ((g[s.sablon] || {}).eklenen || 0) + r.eklenen }; }
    return r;
  }
  const kayitlari = (data, s) => (s.tur === 'tema' ? [] : (Array.isArray(s.tur === 'form' ? data.sablonFormlar : data[s.hedef]) ? (s.tur === 'form' ? data.sablonFormlar : data[s.hedef]) : []).filter((x) => x && String(x.sablon_anahtar || '').startsWith(s.sablon + '#')));
  // Onay: işletme kaydı inceledi. Fiyatlı şablonda fiyatı girilmemiş kayıt onaylanmaz: boş fiyatlı ürün sitede görünmesin.
  function onayla(data, s) {
    const r = { onaylanan: 0, fiyatsiz: 0 };
    kayitlari(data, s).forEach((x) => { if (x.onay) return; if (s.fiyatAlan && !(Number(x[s.fiyatAlan]) > 0)) { r.fiyatsiz++; return; } x.onay = true; r.onaylanan++; });
    return r;
  }
  const E = { norm, onizle, uygula, onayla, kayitlari, durum, anahtar };
  if (typeof module === 'object' && module.exports) module.exports = E;
  if (typeof window === 'undefined' || !window.NS) return;

  // ---------- Arayüz ----------
  const NS = window.NS; const { esc, icon, toast, modal } = NS;
  const TUR = { menu: 'Menü', hizmet: 'Hizmet listesi', urun: 'Ürün listesi', kategori: 'Kategoriler', duyuru: 'Duyurular', form: 'Sözleşme ve form', tema: 'Randevu sayfası teması' };
  const ETK = { yeni: '', var: 'Zaten aktarıldı', ayni_ad: 'Aynı adla kayıtlı' };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : null);
  const getir = async () => (await NS.api('GET', '/api/sablon/' + encodeURIComponent(appId()))).sablonlar;
  const uyariOf = (s) => (s.tur === 'form' ? s.uyari : s.fiyatAlan ? 'Fiyatlar boş gelir. Fiyat girip kaydı açmadan satışta ve sitenizde görünmez.' : '');
  const aktar = (s, secilen) => {
    const db = NS.app.db; const r = uygula(db.data, s, secilen, { uid: NS.uid }); if (!r.eklenen) return r;
    if (s.tur === 'form' && NS.forms && NS.forms.tanit) r.kayitlar.forEach((k) => NS.forms.tanit(appId(), k));
    db.save(); NS.api('POST', '/api/sablon/olay', { sablon: s.sablon, surum: s.surum, eklenen: r.eklenen, atlanan: r.atlanan }).catch(() => {}); return r;
  };
  const sonuc = (r) => toast(r.eklenen ? `${r.eklenen} kayıt eklendi${r.atlanan ? `, ${r.atlanan} kayıt atlandı` : ''}` : 'Eklenecek yeni kayıt yok: seçilenler zaten kayıtlı', r.eklenen ? 'ok' : 'info');
  function onizleModal(s, bitti) {
    const db = NS.app.db; const R = onizle(db.data, s); const yeni = R.filter((x) => x.durum === 'yeni'); const u = uyariOf(s);
    modal({ title: s.ad, size: 'wide', body: `<p class="muted small mb">${esc(s.aciklama)}</p>${u ? `<div class="ns-sablon-uyari small mb">${icon('alert')} <span>${esc(u)}</span></div>` : ''}
      <div class="row between mb"><label class="row small"><input type="checkbox" id="sbt" ${yeni.length ? 'checked' : 'disabled'}> Tümünü seç</label><span class="small faint">${yeni.length} yeni · ${R.length} kayıt</span></div>
      <div class="col" style="gap:4px;max-height:46vh;overflow:auto">${R.map((x) => `<label class="row small nw" style="padding:4px 2px"><input type="checkbox" data-sk="${esc(x.anahtar)}" ${x.durum === 'yeni' ? 'checked' : 'disabled'}><span class="grow">${esc(x.ad)}</span>${ETK[x.durum] ? `<span class="badge">${esc(ETK[x.durum])}</span>` : ''}</label>`).join('')}</div>`,
    actions: [{ label: 'Vazgeç' }, { label: 'Seçilenleri aktar', cls: 'primary', icon: 'check', onClick: (c, b) => { const seç = [...b.querySelectorAll('[data-sk]:checked')].map((i) => i.dataset.sk); if (!seç.length) return toast('Önce kayıt seçin', 'err'); const r = aktar(s, seç); sonuc(r); c(); bitti && bitti(r); } }],
    onOpen: (b) => { const all = b.querySelector('#sbt'); all.onchange = () => b.querySelectorAll('[data-sk]:not(:disabled)').forEach((i) => { i.checked = all.checked; }); } });
  }
  function sayfa(el, app) {
    const db = app.db; let L = null; let hata = null;
    const kart = (s) => { const n = kayitlari(db.data, s); const m = ((db.data._meta || {}).sablonlar || {})[s.sablon]; const bekl = s.fiyatAlan ? n.filter((x) => !x.onay).length : 0;
      return `<div class="card"><div class="card-b col" style="gap:8px"><div class="row between"><b>${esc(s.ad)}</b><span class="badge">${esc(TUR[s.tur] || s.tur)}</span></div><p class="small muted">${esc(s.aciklama)}</p>
        <div class="small faint">${s.kayitlar.length} kayıt · sürüm ${s.surum}${m ? ` · ${m.eklenen} kayıt aktarıldı` : ''}</div>
        <div class="row"><button class="btn sm primary" data-oz="${esc(s.sablon)}">${icon('eye')} Önizle ve aktar</button>${bekl ? `<button class="btn sm" data-on="${esc(s.sablon)}">${icon('check')} İnceledim, onayla (${bekl})</button>` : ''}</div></div></div>`; };
    const ciz = () => {
      const bas = NS.pageHead('Hazır şablonlar', 'Sektörünüze özel başlangıç içeriği: önizleyin, seçin, tek tıkla ekleyin. Eski kayıtlarınız değişmez.');
      if (hata) { el.innerHTML = bas + `<div class="empty">${icon('alert')}<div>${esc(hata)}</div><button class="btn mt" id="sbr">Tekrar dene</button></div>`; el.querySelector('#sbr').onclick = yukle; return; }
      if (!L) { el.innerHTML = bas + `<div class="grid g2">${'<div class="skel" style="height:140px;border-radius:14px"></div>'.repeat(4)}</div>`; return; }
      el.innerHTML = bas + (L.length ? `<div class="grid g2">${L.map(kart).join('')}</div>` : `<div class="empty">${icon('file')}<div>Bu program için henüz hazır şablon yok.</div></div>`);
    };
    const yukle = async () => { hata = null; L = null; ciz(); try { L = await getir(); } catch (e) { hata = e.message; } ciz(); };
    el.onclick = (e) => {
      const b = e.target.closest('[data-oz],[data-on]'); if (!b) return; const s = (L || []).find((x) => x.sablon === (b.dataset.oz || b.dataset.on)); if (!s) return;
      if (b.dataset.oz) return onizleModal(s, ciz);
      const r = onayla(db.data, s); db.save(); ciz(); toast(r.onaylanan ? `${r.onaylanan} kayıt onaylandı${r.fiyatsiz ? `, ${r.fiyatsiz} kaydın fiyatı eksik` : ''}` : `Önce fiyat girin: ${r.fiyatsiz} kaydın fiyatı eksik`, r.onaylanan ? 'ok' : 'err');
    };
    yukle();
  }
  // İlk kurulum: yöneticiye bir kez sorulur. Geçilirse Ayarlar → Hazır şablonlar'dan açılır.
  async function sihirbaz(zorla) {
    const app = NS.app; const db = app.db; const m = (db.data._meta = db.data._meta || {}); if (!zorla && m.sablonSoruldu) return; let L;
    try { L = (await getir()).filter((s) => s.tur !== 'tema'); } catch (e) { return; } if (!L.length || document.querySelector('.ns-modal')) return; m.sablonSoruldu = true; db.save();
    modal({ title: 'Hazır şablonlarla başlayın', size: 'wide', body: `<p class="muted small mb">Sektörünüze uygun içeriği tek tıkla ekleyin. Fiyatlar boş gelir; hepsini sonra düzenleyebilirsiniz.${m.sample ? ' Örnek verileri temizlerseniz şablon kayıtları da silinir: bu durumda buradan yeniden aktarın.' : ''}</p>
      <div class="col" style="gap:6px">${L.map((s, i) => `<label class="row nw small"><input type="checkbox" data-sz="${esc(s.sablon)}" ${L.findIndex((x) => x.tur === s.tur) === i ? 'checked' : ''}><span class="grow"><b>${esc(s.ad)}</b><br><span class="faint">${esc(TUR[s.tur] || s.tur)} · ${s.kayitlar.length} kayıt</span></span></label>`).join('')}</div>${L.some((s) => s.tur === 'form') ? `<div class="ns-sablon-uyari small mt">${icon('alert')} <span>${esc(L.find((s) => s.tur === 'form').uyari)}</span></div>` : ''}`,
    actions: [{ label: 'Şimdilik geç' }, { label: 'Seçilenleri kur', cls: 'primary', icon: 'check', onClick: (c, b) => { const seç = new Set([...b.querySelectorAll('[data-sz]:checked')].map((i) => i.dataset.sz)); let n = 0, y = 0; L.filter((s) => seç.has(s.sablon)).forEach((s) => { const r = aktar(s); n += r.eklenen; y += r.atlanan; }); c(); sonuc({ eklenen: n, atlanan: y }); if (NS.app.refresh) NS.app.refresh(); } }] });
  }
  const sihirbazBekle = () => { // PIN girişi bittikten sonra, başka pencere açık değilken
    const zorla = /[?&]sablon=1/.test(location.search); const oto = NS.app && NS.app.db && NS.app.db.cloud; if (!zorla && !oto) return; let n = 0;
    const t = setInterval(() => { if (++n > 240) return clearInterval(t); const a = NS.app; if (!a || !NS.currentUser || !a.can || !a.can('admin') || document.querySelector('.ns-modal')) return; clearInterval(t); sihirbaz(zorla); }, 1500);
  };
  const eski = NS.shell;
  NS.shell = function (opts) { if (opts && opts.routes && !opts.routes.sablonlar) opts.routes.sablonlar = (el, p, a) => sayfa(el, a); const r = eski.call(this, opts); sihirbazBekle(); return r; };
  NS.sablon = { ...E, sayfa, sihirbaz, getir };
})();
