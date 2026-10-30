/* NEBSOFT ücretsiz araçlar — dosya araçlarının tarayıcı tarafı. Dosyalar File nesnesi olarak bellekte kalır; bu dosyada yükleme yapan hiçbir istek yoktur.
   Yalnız kendi sitemizden kütüphane dosyası alınır. pdf-lib 1.17.1 (MIT), pdf.js 6.4.299 (Apache-2.0): site/assets/vendor altında, gerektiğinde yüklenir. */
(function () {
  'use strict';
  const H = window.ARACLAR_HESAP; Object.assign(H, window.ARACLAR_DOSYA);
  const PL = '/site/assets/vendor/pdf-lib-1.17.1/pdf-lib.min.js'; const PJ = '/site/assets/vendor/pdfjs-6.4.299/';
  const bekle = () => new Promise((r) => setTimeout(r));

  // ---------- Kütüphaneler ----------
  let plS, pjS;
  H.pdfLib = () => plS || (plS = new Promise((ok, no) => { const s = document.createElement('script'); s.src = PL; s.onload = () => ok(window.PDFLib); s.onerror = () => { plS = null; no(new Error('PDF motoru yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.')); }; document.head.append(s); }));
  H.pdfjs = () => pjS || (pjS = import(`${PJ}pdf.min.js`).then((m) => { m.GlobalWorkerOptions.workerSrc = `${PJ}pdf.worker.min.js`; return m; }).catch(() => { pjS = null; throw new Error('PDF görüntüleyici yüklenemedi. Tarayıcınızı güncelleyip yeniden deneyin.'); }));
  const bayt = async (f) => new Uint8Array(await f.arrayBuffer());
  H.bayt = bayt;
  // Görüntüleme için açar. Şifreli dosyada açık mesaj verir, kullanıcıdan parola istenmez
  H.pdfAc = async (f) => { const j = await H.pdfjs(); try { return await j.getDocument({ data: await bayt(f), standardFontDataUrl: `${PJ}standard_fonts/`, wasmUrl: `${PJ}wasm/`, iccUrl: `${PJ}iccs/`, isEvalSupported: false, useSystemFonts: true }).promise; } catch (e) { throw pdfHata(e, f); } };
  const pdfHata = (e, f) => (e && /password|encrypt/i.test(`${e.name} ${e.message}`) ? new Error(`${f.name}: dosya parola korumalı. Bu araç şifreli PDF'i işleyemez; önce PDF'i açtığınız programda parolayı kaldırın.`) : new Error(`${f.name}: PDF okunamadı. Dosya bozuk veya gerçek bir PDF değil.`));
  // Düzenleme için açar: pdf-lib şifreli dosyayı bozuk çıktıyla yazabildiği için reddedilir
  H.pdfYukle = async (f) => { const L = await H.pdfLib(); try { return await L.PDFDocument.load(await bayt(f), { updateMetadata: false }); } catch (e) { throw pdfHata(e, f); } };
  H.pdfKapat = (d) => d.loadingTask.destroy();
  H.pdfBlob = async (d) => new Blob([await d.save({ useObjectStreams: true })], { type: 'application/pdf' });
  // Ekranda görünen ölçü ve sol üstten kutuya görsel çizme: döndürülmüş ve kırpma kutulu sayfada da doğru yere düşer
  H.pdfOlcu = (p) => { const r = ((p.getRotation().angle % 360) + 360) % 360; const k = p.getCropBox(); return r === 90 || r === 270 ? { w: k.height, h: k.width } : { w: k.width, h: k.height }; };
  H.pdfGorsel = (L, p, g, k) => { const c = p.getCropBox(); const y = H.pdfYer(p.getRotation().angle, c.width, c.height, k); p.drawImage(g, { x: c.x + y.x, y: c.y + y.y, width: k.w, height: k.h, rotate: L.degrees(y.aci) }); };
  H.tuvalPng = async (t) => bayt(await H.kaydet(t, 'image/png'));
  // print kipi requestAnimationFrame kullanmaz: sekme arka plandayken çizim durmaz
  H.sayfaCiz = async (doc, n, olcek) => { const s = await doc.getPage(n); const vp = s.getViewport({ scale: olcek }); const t = H.tuval(Math.ceil(vp.width), Math.ceil(vp.height)); const x = t.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, t.width, t.height); await s.render({ canvasContext: x, canvas: t, viewport: vp, intent: 'print' }).promise; s.cleanup(); return t; };

  // ---------- Görsel ----------
  H.tuval = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  H.gorselAc = async (f) => {
    if (/hei[cf]$/i.test(f.type) || /\.hei[cf]$/i.test(f.name)) { try { return await createImageBitmap(f); } catch (e) { throw new Error(`${f.name}: bu tarayıcı HEIC fotoğrafı açamıyor. Telefonda JPG olarak paylaşın veya Safari ile deneyin.`); } }
    try { return await createImageBitmap(f); } catch (e) { throw new Error(`${f.name}: görsel açılamadı. Dosya bozuk veya desteklenmeyen bir biçimde.`); }
  };
  H.kaydet = (t, tur, kalite) => new Promise((ok, no) => t.toBlob((b) => (b ? ok(b) : no(new Error('Görsel bu cihazın belleğine sığmadı. Ölçüsünü küçültüp yeniden deneyin.'))), tur, kalite));
  // Tarayıcı istenen biçimi yazamazsa (Safari WebP) sessizce PNG üretir: bunu gizlemeyiz
  H.turUzanti = (t) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[t] || 'png');
  H.dolu = (w, h, renk) => { const t = H.tuval(w, h); const x = t.getContext('2d'); if (renk) { x.fillStyle = renk; x.fillRect(0, 0, w, h); } return t; };
  // Metni saydam PNG'ye çizer: PDF'e görsel olarak gömülür, böylece ş, ğ, ı, İ harfleri font sorunu çıkarmaz
  H.metinTuval = (metin, { boyut, renk, opak = 1, aci = 0, kalin = true }) => {
    const o = H.tuval(1, 1).getContext('2d'); const f = `${kalin ? '700' : '500'} ${boyut}px Arial, sans-serif`; o.font = f; const w = Math.ceil(o.measureText(metin).width) + 4, h = Math.ceil(boyut * 1.35);
    const r = (aci * Math.PI) / 180; const W = Math.ceil(Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r))), Y = Math.ceil(Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)));
    const t = H.tuval(W, Y); const x = t.getContext('2d'); x.translate(W / 2, Y / 2); x.rotate(-r); x.font = f; x.fillStyle = renk; x.globalAlpha = opak; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(metin, 0, 0); return t;
  };

  // ---------- Çıktılar ----------
  H.ciktilar = []; let adresler = [];
  H.adres = (b) => { const u = URL.createObjectURL(b); adresler.push(u); return u; };
  H.ciktiSifirla = () => { H.ciktilar = []; adresler.forEach((u) => URL.revokeObjectURL(u)); adresler = []; };
  H.cikti = (ad, blob) => { H.ciktilar.push({ ad, blob }); return H.ciktilar.length - 1; };
  H.ciktiListe = () => { const c = H.ciktilar; if (!c.length) return ''; return `<ul class="ar-ciktilar">${c.map((x, i) => `<li><span title="${H.esc(x.ad)}">${H.esc(x.ad)}</span><small>${H.boyutYaz(x.blob.size)}</small><button type="button" class="btn sm" data-eylem="indir" data-i="${i}">İndir</button></li>`).join('')}</ul>${c.length > 1 ? H.eylemler(H.btn('zip', `Hepsini ZIP olarak indir (${c.length})`)) : ''}`; };
  H.indir = (ad, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  H.zipIndir = async (kok) => { const p = await Promise.all(H.ciktilar.map(async (x) => ({ ad: x.ad, veri: await bayt(x.blob) }))); H.indir(`${kok}.zip`, new Blob([H.zip(p)], { type: 'application/zip' })); };
  H.karsilastir = (once, sonra) => { const f = once ? Math.round((1 - sonra / once) * 100) : 0; return H.tablo([['Önce', H.boyutYaz(once)], ['Sonra', H.boyutYaz(sonra), 1], f > 0 ? ['Kazanç', `%${f}`] : ['Değişim', f === 0 ? 'Aynı' : `%${-f} büyüdü`]]); };

  // ---------- Dosya seçme alanı ----------
  const liste = (k) => { const ul = k.querySelector('.ar-dosyalar'); const d = k._dosyalar; ul.innerHTML = d.map((f, i) => `<li><span title="${H.esc(f.name)}">${H.esc(f.name)}</span><small>${H.boyutYaz(f.size)}</small>${k.dataset.sirali && d.length > 1 ? `<button type="button" data-tas="-1" data-i="${i}" aria-label="Yukarı taşı"${i ? '' : ' disabled'}>↑</button><button type="button" data-tas="1" data-i="${i}" aria-label="Aşağı taşı"${i < d.length - 1 ? '' : ' disabled'}>↓</button>` : ''}<button type="button" data-kaldir="${i}" aria-label="Listeden çıkar">×</button></li>`).join(''); };
  const uygun = (k, f) => { const kabul = (k.dataset.kabul || '').split(',').map((x) => x.trim()).filter(Boolean); if (!kabul.length) return true; const ad = f.name.toLocaleLowerCase('en'); return kabul.some((x) => (x.startsWith('.') ? ad.endsWith(x) : x.endsWith('/*') ? f.type.startsWith(x.slice(0, -1)) : f.type === x)); };
  H.dosyaBagla = (form, degisti) => form.querySelectorAll('[data-dosya]').forEach((k) => {
    k._dosyalar = []; const inp = k.querySelector('input[type=file]'); const uyari = k.querySelector('.ar-dosya-u');
    const ekle = (yeni) => { const hepsi = [...yeni]; const iyi = hepsi.filter((f) => uygun(k, f)); uyari.textContent = iyi.length < hepsi.length ? `${hepsi.length - iyi.length} dosya bu araç için uygun değil, eklenmedi.` : ''; if (!iyi.length) return; k._dosyalar = k.dataset.coklu ? [...k._dosyalar, ...iyi] : iyi.slice(0, 1); liste(k); degisti(); };
    inp.addEventListener('change', (e) => { e.stopPropagation(); ekle(inp.files); inp.value = ''; }); inp.addEventListener('input', (e) => e.stopPropagation());
    const kutu = k.querySelector('.ar-birak'); ['dragenter', 'dragover'].forEach((t) => kutu.addEventListener(t, (e) => { e.preventDefault(); kutu.classList.add('ust'); })); ['dragleave', 'drop'].forEach((t) => kutu.addEventListener(t, () => kutu.classList.remove('ust')));
    kutu.addEventListener('drop', (e) => { e.preventDefault(); ekle(e.dataTransfer.files); });
    k.addEventListener('click', (e) => { const s = e.target.closest('[data-kaldir]'); const t = e.target.closest('[data-tas]'); if (s) { k._dosyalar.splice(Number(s.dataset.kaldir), 1); liste(k); degisti(); } else if (t) { const i = Number(t.dataset.i), j = i + Number(t.dataset.tas); [k._dosyalar[i], k._dosyalar[j]] = [k._dosyalar[j], k._dosyalar[i]]; liste(k); degisti(); } });
  });

  // ---------- İmza çizim alanı ----------
  H.imzaBagla = (form, degisti) => form.querySelectorAll('[data-imza]').forEach((k) => {
    const c = k.querySelector('canvas'); const x = c.getContext('2d'); let ciziyor = false, son = null; k._dolu = false;
    const nokta = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    const renk = () => (form.querySelector('[data-alan="imzaRenk"]') || {}).value || '#0b2a6b';
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); c.setPointerCapture(e.pointerId); ciziyor = true; son = nokta(e); });
    c.addEventListener('pointermove', (e) => { if (!ciziyor) return; const n = nokta(e); x.strokeStyle = renk(); x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(...son); x.lineTo(...n); x.stroke(); son = n; k._dolu = true; });
    const bit = () => { if (ciziyor) { ciziyor = false; degisti(); } }; c.addEventListener('pointerup', bit); c.addEventListener('pointercancel', bit);
    k.querySelector('[data-imza-sil]').addEventListener('click', () => { x.clearRect(0, 0, c.width, c.height); k._dolu = false; degisti(); });
  });
  // Çizilen veya yüklenen imzayı boş kenarlarından kırpılmış, saydam tuval olarak verir
  H.imzaTuvali = async (v) => {
    let k; if ((v.imzaDosya || []).length) { const b = await H.gorselAc(v.imzaDosya[0]); k = H.tuval(b.width, b.height); const x = k.getContext('2d'); x.drawImage(b, 0, 0); b.close(); const d = x.getImageData(0, 0, k.width, k.height); const r = H.kenarRengi(d.data, k.width, k.height); const sinir = d.data.some((n, i) => i % 4 === 3 && n < 128); if (!sinir) { H.arkaPlanUygula(d.data, H.arkaPlanMaske(d.data, k.width, k.height, { renk: r, tol: 40, heryer: true }), k.width, k.height, { renk: r, tol: 40 }); x.putImageData(d, 0, 0); } }
    else { const e = document.querySelector('[data-imza]'); if (!e || !e._dolu) return null; k = e.querySelector('canvas'); }
    const d = k.getContext('2d').getImageData(0, 0, k.width, k.height).data; let x0 = k.width, y0 = k.height, x1 = -1, y1 = -1;
    for (let y = 0; y < k.height; y++) for (let x = 0; x < k.width; x++) if (d[(y * k.width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null; const t = H.tuval(x1 - x0 + 1, y1 - y0 + 1); t.getContext('2d').drawImage(k, -x0, -y0); return t;
  };

  // ---------- Alan seçici: kırpma, gizleme, imza yeri ----------
  // Görsel tuvalin üstünde yüzde ile konumlanan kutular. Koordinatlar her zaman görselin gerçek pikseli
  H.alanSecici = (kutu, t, { coklu = false, oran = 0, baslangic = null, degisti = () => {} } = {}) => {
    const W = t.width, Y = t.height; let alanlar = baslangic ? [baslangic] : []; let hedefOran = oran;
    const sar = document.createElement('div'); sar.className = 'ar-secim'; t.classList.add('ar-tuval'); sar.append(t); kutu.append(sar); let kaplama = '';
    const yerlestir = (el, a) => { el.style.left = `${a.x / W * 100}%`; el.style.top = `${a.y / Y * 100}%`; el.style.width = `${a.w / W * 100}%`; el.style.height = `${a.h / Y * 100}%`; };
    const ciz = () => { sar.querySelectorAll('.ar-kutu').forEach((e) => e.remove()); alanlar.forEach((a, i) => { const e = document.createElement('div'); e.className = 'ar-kutu'; e.dataset.i = i; if (kaplama) e.style.backgroundImage = `url(${kaplama})`; e.innerHTML = `${['ua', 'us', 'as', 'aa'].map((k) => `<i data-k="${k}"></i>`).join('')}${coklu ? `<button type="button" data-sil-alan="${i}" aria-label="Alanı sil">×</button>` : ''}`; yerlestir(e, a); sar.append(e); }); };
    const nokta = (e) => { const r = t.getBoundingClientRect(); return [Math.min(W, Math.max(0, (e.clientX - r.left) * W / r.width)), Math.min(Y, Math.max(0, (e.clientY - r.top) * Y / r.height))]; };
    let sur = null; const asg = Math.max(8, Math.min(W, Y) * 0.02);
    sar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-sil-alan]')) return; const [x, y] = nokta(e); const k = e.target.closest('.ar-kutu'); const uc = e.target.dataset.k; sar.setPointerCapture(e.pointerId); e.preventDefault();
      if (k) { const i = Number(k.dataset.i); sur = { i, uc, x, y, ilk: { ...alanlar[i] } }; }
      else if (coklu) { alanlar.push({ x, y, w: 1, h: 1 }); sur = { i: alanlar.length - 1, uc: 'as', x, y, ilk: { x, y, w: 1, h: 1 }, yeni: true }; ciz(); }
      else if (alanlar[0]) { const a = alanlar[0]; a.x = Math.min(W - a.w, Math.max(0, x - a.w / 2)); a.y = Math.min(Y - a.h, Math.max(0, y - a.h / 2)); sur = { i: 0, x, y, ilk: { ...a } }; ciz(); }
    });
    sar.addEventListener('pointermove', (e) => {
      if (!sur) return; const [x, y] = nokta(e); const a = alanlar[sur.i], b = sur.ilk; const dx = x - sur.x, dy = y - sur.y;
      if (!sur.uc) { a.x = Math.min(W - a.w, Math.max(0, b.x + dx)); a.y = Math.min(Y - a.h, Math.max(0, b.y + dy)); }
      else {
        const sol = sur.uc[1] === 'a', ust = sur.uc[0] === 'u'; let nw = Math.max(asg, sol ? b.w - dx : b.w + dx), nh = Math.max(asg, ust ? b.h - dy : b.h + dy); if (hedefOran) nh = nw / hedefOran;
        const sagK = b.x + b.w, altK = b.y + b.h; const azW = sol ? sagK : W - b.x, azH = ust ? altK : Y - b.y; if (nw > azW) { nw = azW; if (hedefOran) nh = nw / hedefOran; } if (nh > azH) { nh = azH; if (hedefOran) nw = nh * hedefOran; }
        a.w = nw; a.h = nh; a.x = sol ? sagK - nw : b.x; a.y = ust ? altK - nh : b.y;
      }
      const el = sar.querySelector(`.ar-kutu[data-i="${sur.i}"]`); if (el) yerlestir(el, a);
    });
    const bit = () => { if (!sur) return; if (sur.yeni && (alanlar[sur.i].w < asg || alanlar[sur.i].h < asg)) alanlar.splice(sur.i, 1); sur = null; ciz(); degisti(); }; sar.addEventListener('pointerup', bit); sar.addEventListener('pointercancel', bit);
    sar.addEventListener('click', (e) => { const s = e.target.closest('[data-sil-alan]'); if (s) { alanlar.splice(Number(s.dataset.silAlan), 1); ciz(); degisti(); } });
    ciz();
    return { alanlar: () => alanlar, ayarla: (l) => { alanlar = l; ciz(); }, oran: (o) => { hedefOran = o; if (o && alanlar[0]) { const a = alanlar[0]; let w = a.w, h = w / o; if (h > Y - a.y) { h = Y - a.y; w = h * o; } if (w > W - a.x) { w = W - a.x; h = w / o; } a.w = w; a.h = h; ciz(); } }, kapla: (u) => { kaplama = u; ciz(); }, W, Y };
  };

  // ---------- Sayfa ızgarası: PDF sayfası sırala, döndür, sil. Küçük resim adresi H.adres'ten geçmez, ciktiSifirla silmesin ----------
  H.sayfaIzgara = async (c, doc) => {
    const n = doc.numPages; const s = Array.from({ length: n }, (_, i) => ({ i, aci: 0, sil: false })); c.durum.sayfalar = s; const iz = document.createElement('div'); iz.className = 'ar-izgara'; c.duzen.append(iz); const res = new Array(n);
    const ciz = () => { iz.innerHTML = ''; s.forEach((p, k) => { const e = document.createElement('figure'); e.className = `ar-sayfa${p.sil ? ' sil' : ''}`; e.innerHTML = `<div class="ar-kucuk"></div><figcaption>Sayfa ${p.i + 1}</figcaption><div class="ar-sb"><button type="button" data-y="-1" data-k="${k}" aria-label="Sayfa ${p.i + 1} öne al"${k ? '' : ' disabled'}>←</button><button type="button" data-y="1" data-k="${k}" aria-label="Sayfa ${p.i + 1} geriye al"${k < n - 1 ? '' : ' disabled'}>→</button><button type="button" data-d="${k}" aria-label="Sayfa ${p.i + 1} döndür">↻</button><button type="button" data-s="${k}" aria-label="Sayfa ${p.i + 1} ${p.sil ? 'geri al' : 'sil'}">${p.sil ? '↺' : '×'}</button></div>`; const u = e.querySelector('.ar-kucuk'); if (res[p.i]) { const g = new Image(); g.src = res[p.i]; g.alt = ''; g.style.transform = `rotate(${p.aci}deg)`; u.append(g); } iz.append(e); }); };
    iz.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.y) { const k = Number(b.dataset.k), j = k + Number(b.dataset.y); [s[k], s[j]] = [s[j], s[k]]; } else if (b.dataset.d) { const p = s[Number(b.dataset.d)]; p.aci = (p.aci + 90) % 360; } else if (b.dataset.s) { const p = s[Number(b.dataset.s)]; p.sil = !p.sil; } ciz(); c.degisti(); });
    ciz(); for (let i = 0; i < n; i++) { if (c.iptal()) return; const sayfa = await doc.getPage(i + 1); const o = 130 / sayfa.getViewport({ scale: 1 }).width; const t = await H.sayfaCiz(doc, i + 1, o); res[i] = URL.createObjectURL(await H.kaydet(t, 'image/jpeg', 0.7)); if (i % 6 === 5 || i === n - 1) { ciz(); await bekle(); } }
  };

  // ---------- Akış ----------
  H.ilerleme = (m, o) => `<div class="ar-yukleniyor" role="status"><span>${H.esc(m)}</span>${o != null ? `<progress max="1" value="${o}"></progress>` : '<i></i>'}</div>`;
  H.dosyaAkis = (form, sonuc, cfg) => {
    const duzen = document.getElementById('ar-duzen'); let anahtar = null, jeton = 0, zaman = 0, hazirJ = 0; const durum = {};
    const c = { durum, duzen, iptal: () => false, degisti: () => form.dispatchEvent(new Event('change')) };
    const calistir = async () => {
      const j = ++jeton; const v = H.sonDeger(); H.ciktiSifirla(); const b = { ...c, iptal: () => j !== jeton, ilerle: (o, m) => { if (j === jeton) sonuc.innerHTML = H.ilerleme(m || 'İşleniyor', o); } }; sonuc.innerHTML = H.ilerleme('İşleniyor');
      try { const h = await cfg.isle(v, H, b); if (j === jeton) sonuc.innerHTML = h; } catch (e) { if (j === jeton) sonuc.innerHTML = H.not(H.esc(e.message || 'İşlem tamamlanamadı'), 'uyari'); }
    };
    H.calistir = calistir;
    return async (v) => {
      const d = v[cfg.dosyaAlan] || []; const k = d.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join('|'); jeton++; clearTimeout(zaman);
      if (k !== anahtar) {
        anahtar = k; const hj = ++hazirJ; H.ciktiSifirla(); Object.keys(durum).forEach((x) => delete durum[x]); H.degisimKanca = null; if (duzen) duzen.innerHTML = ''; durum.hazir = false;
        if (cfg.hazirla && d.length) { const b = { ...c, iptal: () => hj !== hazirJ }; sonuc.innerHTML = H.ilerleme('Dosya açılıyor'); try { await cfg.hazirla(v, H, b); if (hj !== hazirJ) return; durum.hazir = true; form.dispatchEvent(new Event('change')); } catch (e) { if (hj === hazirJ) { sonuc.innerHTML = H.not(H.esc(e.message), 'uyari'); durum.hata = e.message; } } return; }
      }
      if (H.degisimKanca && d.length) H.degisimKanca(v);
      if (cfg.canli && d.length && !durum.hata) zaman = setTimeout(calistir, 300);
    };
  };
})();
