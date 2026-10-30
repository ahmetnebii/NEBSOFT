/* NEBSOFT birinci taraf ziyaret sayacı: rıza bandı ve olay gönderimi. Bağımlılıksız, tanıtım sitelerinde de çalışır.
   Sunucu bu dosyayı yalnızca bulut modunda ve analitik açıkken sayfaya ekler (server/cloud/seo.js).
   • Çerez yok. Tek yerel kayıt ziyaretçinin kararıdır (kabul / red); 180 gün sonra yeniden sorulur.
   • Karar verilmeden ve redde hiçbir olay gönderilmez. Tarayıcının GPC / DNT sinyali red sayılır, bant da çıkmaz.
   • Oturum açmış müşteriye bant gösterilmez; aydınlatma bağlantısı Hesabım sayfasındadır.
   Araçlar bölümü sözleşmesi: <a data-arac="kdv-hesap" data-program="onmuhasebe"> veya /araclar/<ad> sayfasındaki program bağlantıları geçiş sayılır. */
(function () {
  'use strict';
  if (window.NSOlay || !/^https?:$/.test(location.protocol)) return;
  var KEY = 'nebsoft:riza'; var SURE = 180 * 864e5; var betik = document.currentScript; var PROG = betik && betik.getAttribute('data-program');
  var bellek = null; var ref = document.referrer;
  var sinyal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  function oku() {
    if (sinyal) return 'red';
    if (bellek) return bellek;
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && (v.k === 'kabul' || v.k === 'red') && Date.now() - v.t < SURE) return v.k; } catch (e) { /* yok */ }
    return null;
  }
  function yaz(k) { bellek = k; try { localStorage.setItem(KEY, JSON.stringify({ k: k, t: Date.now() })); } catch (e) { /* gizli pencere: yalnızca bu sayfa için geçerli */ } }
  function gonder(o) {
    if (oku() !== 'kabul') return; o.riza = true;
    try { fetch('/api/olay', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1' }, credentials: 'same-origin', keepalive: true, body: JSON.stringify(o) }).catch(function () {}); } catch (e) { /* yok */ }
  }
  function program() { var m = /^#\/(?:urun|dene)\/([a-z0-9]+)/.exec(location.hash); return (m && m[1]) || PROG || null; }
  function utm() { try { var q = new URLSearchParams(location.search); return q.get('utm_source') ? { source: q.get('utm_source').slice(0, 80), medium: (q.get('utm_medium') || '').slice(0, 80), campaign: (q.get('utm_campaign') || '').slice(0, 80) } : null; } catch (e) { return null; } }
  function sayfa() {
    if (oku() !== 'kabul') return;
    var yeni = true; // sekme oturumunun ilk olayı ziyarettir (kaynak ve UTM onunla gider); günlük tekilliği sunucu sağlar
    try { if (sessionStorage.getItem('nebsoft:ziyaret')) yeni = false; else sessionStorage.setItem('nebsoft:ziyaret', '1'); } catch (e) { /* yok */ }
    if (yeni) gonder({ tur: 'ziyaret', program: program(), ref: ref, utm: utm() }); else gonder({ tur: 'sayfa', program: program() });
  }
  function aracAdi(a) { var d = a.getAttribute('data-arac'); if (d) return d; var m = /^\/araclar\/([a-z0-9-]+)/.exec(location.pathname) || /^#\/araclar\/([a-z0-9-]+)/.exec(location.hash); return m && m[1]; }
  function hedef(a, h) { var d = a.getAttribute('data-program'); if (d) return d; var m = /apps\/([a-z0-9]+)\//.exec(h) || /#\/(?:urun|dene|kayit)\/([a-z0-9]+)/.exec(h); return m && m[1]; }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-olay-tercih],a[href],[data-arac]') : null; if (!t) return;
    if (t.hasAttribute('data-olay-tercih')) { e.preventDefault(); bant(); return; }
    var h = t.getAttribute('href') || ''; var d = /apps\/([a-z0-9]+)\/[^#]*[?&]demo=1/.exec(h);
    if (d) gonder({ tur: 'demo', program: d[1] });
    var ar = aracAdi(t); var p = ar && hedef(t, h); if (ar && p) gonder({ tur: 'gecis', arac: ar, program: p });
  });
  addEventListener('hashchange', sayfa);

  function bant() {
    if (document.getElementById('ns-riza')) return;
    if (!document.getElementById('ns-riza-css')) {
      var st = document.createElement('style'); st.id = 'ns-riza-css';
      st.textContent = '#ns-riza{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;box-sizing:border-box;padding:16px 18px;border-radius:14px;border:1px solid #d9dce6;background:#fff;color:#1b1d2a;box-shadow:0 10px 30px rgba(15,18,40,.18);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}#ns-riza b{display:block;font-size:15px;margin-bottom:4px}#ns-riza p{margin:0}#ns-riza a{color:inherit;text-decoration:underline}#ns-riza .r{display:flex;gap:10px;margin-top:12px}#ns-riza button{flex:1 1 0;min-height:44px;border-radius:10px;border:1px solid #1b1d2a;background:#fff;color:#1b1d2a;font:600 14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer}#ns-riza button:focus-visible{outline:2px solid #4f46e5;outline-offset:2px}'
        + '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) #ns-riza{background:#1b1d2a;color:#f1f2f7;border-color:#3a3d50}:root:not([data-theme=light]) #ns-riza button{background:#1b1d2a;color:#f1f2f7;border-color:#f1f2f7}}:root[data-theme=dark] #ns-riza{background:#1b1d2a;color:#f1f2f7;border-color:#3a3d50}:root[data-theme=dark] #ns-riza button{background:#1b1d2a;color:#f1f2f7;border-color:#f1f2f7}';
      document.head.appendChild(st);
    }
    var d = document.createElement('section'); d.id = 'ns-riza'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Ziyaret istatistiği tercihi');
    d.innerHTML = '<b>Ziyaret istatistiği</b><p>Sitemizi geliştirmek için hangi sayfaların açıldığını anonim olarak saymak istiyoruz. Çerez kullanmıyoruz, IP adresinizi saklamıyoruz. Reddederseniz hiçbir kayıt alınmaz. <a href="/#/yasal/kvkk">Aydınlatma metni</a></p><div class="r"><button type="button" data-k="red">Reddet</button><button type="button" data-k="kabul">Kabul et</button></div>';
    d.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-k]'); if (!b) return;
      yaz(b.getAttribute('data-k')); d.remove();
      if (b.getAttribute('data-k') === 'kabul') sayfa(); else { try { sessionStorage.removeItem('nebsoft:ziyaret'); } catch (x) { /* yok */ } }
    });
    document.documentElement.appendChild(d); // pazar yeri açılışta body içeriğini yeniden yazar; bant gövdenin dışında durur
    var v = window.visualViewport; // sayfa yatayda taşarsa düzen alanı ekrandan geniştir: düğmeler ekran dışında kalmasın
    if (v && innerWidth > v.width + 1) { d.style.left = (v.offsetLeft + 16) + 'px'; d.style.right = 'auto'; d.style.width = (v.width - 32) + 'px'; d.style.bottom = (innerHeight - v.height - v.offsetTop + 16) + 'px'; }
  }
  window.NSOlay = { tercih: bant, gonder: gonder };

  var k = oku();
  if (k === 'kabul') sayfa();
  else if (k === null) fetch('/api/olay/durum', { headers: { 'x-ns-csrf': '1' }, credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (s) { if (s.acik && !s.kayitli) bant(); }).catch(function () {});
})();
