/* NEBSOFT ücretsiz araçlar — sayfa çalışma zamanı. Hesap tarayıcıda yapılır; bu dosya hiçbir ağ isteği atmaz, form verisi sunucuya gitmez. Dosya araçları: araclar-dosya.js.
   Hesap mantığı: araclar-hesap.js (kaynak site/tools/araclar/hesap.js). QR kodu: vendor/qrcode-generator-1.4.4 (MIT). */
(function () {
  'use strict';
  const H = window.ARACLAR_HESAP;

  // qrcode-generator bayt kipinde UTF-8 ister (core/docs.js ile aynı yöntem)
  H.qrSvg = (metin, { boyut = 280, duzeltme = 'M', kenar = 4 } = {}) => {
    const q = window.qrcode(0, duzeltme); q.addData(unescape(encodeURIComponent(String(metin))));
    try { q.make(); } catch (e) { throw new Error('Bu içerik bir QR koda sığmıyor: metni kısaltın veya hata düzeltme seviyesini düşürün'); }
    const n = q.getModuleCount(), T = n + kenar * 2; let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + kenar} ${y + kenar}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${boyut}" height="${boyut}" shape-rendering="crispEdges" role="img" aria-label="QR kod"><rect width="${T}" height="${T}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  };

  const SAYISAL = new Set(['para', 'sayi', 'yuzde']);
  const oku = (el) => { const t = el.dataset.tip; if (t === 'onay') return el.checked; const s = el.value.trim(); if (SAYISAL.has(t)) { const n = H.sayiOku(s); return Number.isNaN(n) ? undefined : n; } return s; };
  const degerler = (form) => {
    const v = {};
    form.querySelectorAll('[data-dosya]').forEach((k) => { v[k.dataset.dosya] = k._dosyalar || []; });
    form.querySelectorAll('[data-alan]:not(.ar-satirlar)').forEach((el) => { if (!el.closest('.ar-satir')) v[el.dataset.alan] = oku(el); });
    form.querySelectorAll('.ar-satirlar').forEach((kutu) => { v[kutu.dataset.alan] = [...kutu.querySelectorAll('.ar-satir')].map((s) => { const o = {}; s.querySelectorAll('[data-alan]').forEach((el) => { o[el.dataset.alan] = oku(el); }); return o; }); });
    return v;
  };
  const koşulluGuncelle = (form, v) => form.querySelectorAll('[data-goster]').forEach((el) => { const [a, d] = el.dataset.goster.split('='); const ac = d.split('|').includes(String(v[a])); el.hidden = !ac; });

  function indir(ad, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function svgPng(svg, ad, kat = 4) {
    const w = (Number(svg.getAttribute('width')) || 300) * kat, h = (Number(svg.getAttribute('height')) || 300) * kat;
    const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); c.toBlob((b) => indir(ad, b), 'image/png'); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  window.AR = {
    baslat(cfg) {
      const form = document.getElementById('ar-form'), sonuc = document.getElementById('sonuc'); if (!form || !sonuc) return;
      const bugun = new Date(); const yerel = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-${String(bugun.getDate()).padStart(2, '0')}`;
      form.querySelectorAll('[data-bugun]').forEach((el) => { if (!el.value) el.value = yerel; });
      const akis = cfg.dosyaAlan ? H.dosyaAkis(form, sonuc, cfg) : null; let sonV = null; if (akis) H.sonDeger = () => sonV;
      const ciz = () => {
        const v = degerler(form); sonV = v; koşulluGuncelle(form, v); H.dosya = null;
        const eksik = (cfg.gerekli || []).filter(([a]) => v[a] === undefined || v[a] === '').map(([, e]) => e);
        if (eksik.length) { sonuc.innerHTML = `<p class="ar-bos">Sonuç için ${H.esc(eksik.join(', '))} alanını doldurun.</p>`; return; }
        try { sonuc.innerHTML = cfg.hesap(v, H); } catch (e) { sonuc.innerHTML = H.not(H.esc(e.message), 'uyari'); }
        if (akis) akis(v);
      };
      if (akis) { H.dosyaBagla(form, ciz); H.imzaBagla(form, ciz); }
      form.addEventListener('input', ciz); form.addEventListener('change', ciz); form.addEventListener('submit', (e) => { e.preventDefault(); ciz(); });
      form.addEventListener('click', (e) => {
        const ekle = e.target.closest('[data-ekle]'); if (ekle) { const k = ekle.closest('.ar-satirlar'); const t = k.querySelector('template').content.cloneNode(true); k.querySelector('.ar-liste').append(t); ciz(); k.querySelector('.ar-liste').lastElementChild.querySelector('input,select')?.focus(); return; }
        const sil = e.target.closest('[data-sil]'); if (sil) { const s = sil.closest('.ar-satir'); const l = s.parentElement; if (l.children.length > 1) s.remove(); else s.querySelectorAll('input').forEach((i) => { i.value = ''; }); ciz(); }
      });
      sonuc.addEventListener('click', (e) => {
        const b = e.target.closest('[data-eylem]'); if (!b) return; const ey = b.dataset.eylem; const svg = sonuc.querySelector('svg'); const ad = cfg.dosyaAdi || 'nebsoft-arac';
        if (ey === 'yazdir') window.print();
        else if (ey === 'png' && svg) svgPng(svg, `${ad}.png`);
        else if (ey === 'svg' && svg) indir(`${ad}.svg`, new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
        else if (ey === 'kopyala') { const eski = b.textContent; navigator.clipboard.writeText(b.dataset.metin || sonuc.innerText).then(() => { b.textContent = 'Kopyalandı'; setTimeout(() => { b.textContent = eski; }, 1500); }, () => { b.textContent = 'Kopyalanamadı'; }); }
        else if (ey === 'dosya' && H.dosya) indir(H.dosya.ad, new Blob([H.dosya.icerik], { type: H.dosya.tur }));
        else if (ey === 'isle' && H.calistir) H.calistir();
        else if (ey === 'indir') { const c = H.ciktilar[Number(b.dataset.i)]; if (c) indir(c.ad, c.blob); }
        else if (ey === 'zip') H.zipIndir(ad);
      });
      ciz();
    },
  };
})();
