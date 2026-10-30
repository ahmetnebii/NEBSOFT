/* Güven sayfaları: form gönderimi, ayardan gelen satırlar (/api/vitrin) ve canlı sistem durumu (/api/sistem-durumu).
   Başarı iletisi yalnız sunucu ok:true dönünce gösterilir. Ölçüm alınamazsa durum "Bilinmiyor" yazar. */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var acilis = Date.now();
  var yukle = function (u) { var c = new AbortController(); var t = setTimeout(function () { c.abort(); }, 8000); return fetch(u, { signal: c.signal, cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('durum'); return r.json(); }).finally(function () { clearTimeout(t); }); };

  // ---------- Formlar ----------
  document.querySelectorAll('form[data-uc]').forEach(function (f) {
    var msg = $('.msg', f), btn = $('button[type=submit]', f), etiket = btn.textContent;
    var yaz = function (t, c) { msg.textContent = t; msg.className = 'msg ' + (c || ''); };
    var sec = $('[data-yeni]', f);
    if (sec) { var alan = document.getElementById(sec.dataset.yeni), giris = $('input', alan); var goster = function () { var a = sec.value === '_yeni'; alan.hidden = !a; giris.required = a; }; sec.addEventListener('change', goster); goster(); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (!f.reportValidity()) return; yaz(''); btn.disabled = true; btn.textContent = 'Gönderiliyor…';
      var b = { acilis: acilis }; Array.prototype.forEach.call(f.elements, function (x) { if (x.name) b[x.name] = x.type === 'checkbox' ? x.checked : x.value; });
      fetch(f.dataset.uc, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1' }, body: JSON.stringify(b) })
        .then(function (r) { return r.json().catch(function () { return null; }); })
        .then(function (j) { if (j && j.ok) { f.reset(); if (sec) sec.dispatchEvent(new Event('change')); yaz(f.dataset.tamam, 'ok'); } else yaz((j && j.error) || 'Gönderilemedi. Lütfen tekrar deneyin.', 'err'); })
        .catch(function () { yaz('Bağlantı kurulamadı, gönderilemedi. Lütfen tekrar deneyin.', 'err'); })
        .then(function () { btn.disabled = false; btn.textContent = etiket; });
    });
  });

  // ---------- Ayardan gelen satırlar: ayar boşsa satır gizli kalır ----------
  var kom = $('[data-komisyon]'), tav = $('[data-tavsiye]'), kur = $('[data-kurulum]'), ort = $('[data-ortaklar]');
  if (kom || tav || kur || ort) yukle('/api/vitrin').then(function (j) {
    if (kom && j.komisyon) { kom.textContent = 'Güncel komisyon oranı: %' + j.komisyon.yuzde + (j.komisyon.aciklama ? ' (' + j.komisyon.aciklama + ')' : '') + '. Bağlayıcı olan, imzalanan sözleşmedeki orandır.'; kom.hidden = false; }
    if (tav && j.tavsiyeGun) { tav.textContent = ' Şu an uzatma süresi ' + j.tavsiyeGun + ' gündür.'; tav.hidden = false; }
    if (kur && j.kurulum) { kur.textContent = j.kurulum.ad + ': ' + new Intl.NumberFormat('tr-TR').format(j.kurulum.fiyat) + ' ₺ (KDV hariç).'; kur.hidden = false; }
    if (ort && j.ortaklar && j.ortaklar.length) { var ul = $('ul', ort); j.ortaklar.forEach(function (x) { var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('small'); b.textContent = x.unvan; s.textContent = x.tur + ' · ' + x.il; li.appendChild(b); li.appendChild(s); ul.appendChild(li); }); ort.hidden = false; }
  }).catch(function () { /* satırlar gizli kalır */ });

  // ---------- Sistem durumu ----------
  var genel = document.getElementById('genel'); if (!genel) return;
  var SINIF = { calisiyor: 'ok', yavas: 'uy', sorun: 'kt', bilinmiyor: 'bil' };
  var AD = { calisiyor: 'Çalışıyor', yavas: 'Yavaş', sorun: 'Yanıt vermiyor', bilinmiyor: 'Bilinmiyor' };
  var AD_ISTEK = { calisiyor: 'Normal', yavas: 'Yavaş', sorun: 'Hata oranı yüksek', bilinmiyor: 'Bilinmiyor (yeterli istek yok)' };
  var GENEL = { calisiyor: 'Ölçülen bileşenler yanıt veriyor', yavas: 'Yanıtlar yavaşladı', sorun: 'Sorun ölçüldü', bilinmiyor: 'Durum bilinmiyor' };
  var TUR = { planli: 'Planlı bakım', olay: 'Kesinti veya olay', guncelleme: 'Güncelleme' };
  var tarih = function (s) { return new Date(s).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' }); };
  var satir = function (id, d, ad, ek) { var k = $('#d-' + id + ' .dg'); var v = (d && d.durum) || 'bilinmiyor'; k.className = 'dg ' + SINIF[v]; k.textContent = ad[v] + (ek || ''); };
  var ozet = function (v, alt) { genel.className = 'ozet ' + SINIF[v]; $('b', genel).textContent = GENEL[v]; $('small', genel).textContent = alt; };
  var bakimYaz = function (L) {
    var k = document.getElementById('bakim'); k.textContent = '';
    if (!L) { var p = document.createElement('p'); p.className = 'note'; p.textContent = 'Bilinmiyor: bakım kayıtları şu an okunamıyor.'; k.appendChild(p); return; }
    if (!L.length) { var y = document.createElement('p'); y.className = 'note'; y.textContent = 'Yayımlanmış bakım kaydı yok.'; k.appendChild(y); return; }
    var ul = document.createElement('ul'); ul.className = 'yen';
    L.forEach(function (x) { var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span'); b.textContent = x.baslik; s.textContent = (TUR[x.tur] || '') + ' · ' + tarih(x.bas) + (x.bit ? ' – ' + tarih(x.bit) : ' · bitiş yazılmadı') + (x.aciklama ? ' · ' + x.aciklama : ''); li.appendChild(b); li.appendChild(s); ul.appendChild(li); });
    k.appendChild(ul);
  };
  var bakimdaYaz = function (L) { var k = document.getElementById('bakimda'), ul = $('ul', k); ul.textContent = ''; (L || []).forEach(function (x) { var li = document.createElement('li'); li.textContent = x.program + (x.mesaj ? ': ' + x.mesaj : ''); ul.appendChild(li); }); k.hidden = !(L && L.length); };
  var bilinmiyor = function () {
    ['uygulama', 'veritabani'].forEach(function (id) { satir(id, null, AD); }); satir('istekler', null, { bilinmiyor: 'Bilinmiyor' });
    ozet('bilinmiyor', 'Ölçüm alınamadı. Sunucuya ulaşılamıyor ya da bağlantınız kesilmiş olabilir.'); bakimYaz(null); bakimdaYaz(null);
  };
  var olc = function () {
    return yukle('/api/sistem-durumu').then(function (j) {
      if (!j || !j.ok || !j.olcum) throw new Error('yanıt');
      satir('uygulama', j.uygulama, AD); satir('veritabani', j.veritabani, AD, j.veritabani && j.veritabani.ms != null ? ' · ' + j.veritabani.ms + ' ms' : ''); satir('istekler', j.istekler, AD_ISTEK);
      ozet(SINIF[j.genel] ? j.genel : 'bilinmiyor', 'Son ölçüm: ' + tarih(j.olcum)); bakimYaz(j.bakim); bakimdaYaz(j.bakimda);
    }).catch(bilinmiyor);
  };
  olc(); setInterval(function () { if (!document.hidden) olc(); }, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) olc(); });
})();
