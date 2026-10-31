/* Statik sayfaların üst menü davranışı: mobil menü, tema seçimi, sepet ve hesap özeti, sayfa içi arama. ortak.js temalar ve simgelerle birlikte site/assets/kabuk.js olarak yazar; o dosya elle düzenlenmez. */
(function () {
  var TEMALAR = [{"id":"kurumsal","label":"Kurumsal","mode":"light","c":["#f4f7fc","#0b1f45","#1f5fd6"]},{"id":"light","label":"Açık","mode":"light","c":["#f7f7f9","#ffffff","#4f46e5"]},{"id":"beyaz","label":"Klasik beyaz","mode":"light","c":["#f7f7f9","#ffffff","#4f46e5"],"white":1},{"id":"dark","label":"Koyu","mode":"dark","c":["#09090b","#131316","#6366f1"]},{"id":"ocean","label":"Okyanus","mode":"light","c":["#f2f8f9","#ffffff","#0e7490"]},{"id":"forest","label":"Orman","mode":"light","c":["#f4f8f3","#ffffff","#15803d"]},{"id":"sunset","label":"Gün batımı","mode":"light","c":["#fbf6f2","#ffffff","#e8590c"]},{"id":"midnight","label":"Gece mavisi","mode":"dark","c":["#070b16","#0d1424","#3b82f6"]},{"id":"grape","label":"Mor","mode":"dark","c":["#0d0814","#150e20","#a855f7"]},{"id":"graphite","label":"Grafit","mode":"dark","c":["#0e0f11","#16181b","#f59e0b"]}]; var IC = {"sun":"<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/>","moon":"<path d=\"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z\"/>","user":"<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>","grid":"<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/>"};
  var d = document, kok = d.documentElement, $ = function (s, k) { return (k || d).querySelector(s); }, $$ = function (s, k) { return [].slice.call((k || d).querySelectorAll(s)); };
  var oku = function (a) { try { return localStorage.getItem(a); } catch (e) { return null; } }, yaz = function (a, v) { try { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); } catch (e) { /* yok */ } };
  var ic = function (ad) { return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[ad] + '</svg>'; };
  var mod = function () { return kok.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; };
  var temaId = function () { return kok.getAttribute('data-palette') || mod(); };
  // Üst menü
  var bg = $('#burger'), lk = $('#links');
  if (bg && lk) { bg.addEventListener('click', function () { bg.setAttribute('aria-expanded', lk.classList.toggle('open')); }); lk.addEventListener('click', function (e) { if (e.target.closest('a') && !e.target.closest('[data-theme]')) { lk.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); } }); }
  var ust = $('.mk-nav'), sc = function () { if (ust) ust.classList.toggle('scrolled', scrollY > 8); }; addEventListener('scroll', sc, { passive: true }); sc();
  // Sepet sayısı ve hesap: ana sayfa son durumu localStorage'a yazar
  var S = {}; try { S = JSON.parse(oku('nebsoft:kabuk') || '{}'); } catch (e) { S = {}; }
  var cc = $('#cc'); if (cc && S.n) { cc.textContent = S.n; cc.classList.remove('hide'); }
  var acc = $('#acc'), accm = $('#accm');
  if (acc && S.ad) {
    var ad = String(S.ad).replace(/[<>&"']/g, '');
    acc.innerHTML = '<a class="btn primary mk-hide-m" href="/#/programlarim">' + ic('grid') + ' Programlarım</a><a class="btn ghost mk-user-b" href="/#/hesabim" title="Hesabım"><span class="avatar">' + ad.slice(0, 1).toLocaleUpperCase('tr') + '</span><span class="mk-hide-m">' + ad + '</span></a>';
    if (accm) accm.innerHTML = '<a href="/#/programlarim">' + ic('grid') + ' Programlarım</a><a href="/#/hesabim">' + ic('user') + ' Hesabım</a>';
  }
  if (accm) accm.insertAdjacentHTML('beforeend', '<a href="#" data-theme>' + ic(mod() === 'dark' ? 'sun' : 'moon') + ' Açık / koyu tema</a>');
  // Tema: ana sayfayla aynı anahtarlar, aynı menü
  function uygula(id) {
    var th = TEMALAR.filter(function (x) { return x.id === id; })[0] || TEMALAR[0], pal = id === 'light' || id === 'dark' ? '' : th.id;
    var git = function () { yaz('nebsoft:palette:' + th.mode, th.id); yaz('nebsoft:theme', th.mode); yaz('nebsoft:palette', pal || null); kok.setAttribute('data-theme', th.mode); if (pal) kok.setAttribute('data-palette', pal); else kok.removeAttribute('data-palette'); $$('[data-theme-ico]').forEach(function (b) { b.innerHTML = ic(th.mode === 'dark' ? 'sun' : 'moon'); }); var kut = $('.nv-theme-box'); if (kut) kut.outerHTML = kutu(th.mode); };
    if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(git); else git();
  }
  function kutu(m) { var sec = temaId(); return '<div class="nv-theme-box"><div class="nv-tmode" role="tablist" aria-label="Açık veya koyu tema">' + [['light', 'sun', 'Açık'], ['dark', 'moon', 'Koyu']].map(function (x) { return '<button type="button" role="tab" class="' + (m === x[0] ? 'on' : '') + '" aria-selected="' + (m === x[0]) + '" data-tmode="' + x[0] + '">' + ic(x[1]) + ' ' + x[2] + '</button>'; }).join('') + '</div><div class="nv-themes">' + TEMALAR.filter(function (t) { return t.mode === m; }).map(function (t) { return '<button class="nv-theme' + (sec === t.id ? ' on' : '') + '" data-th="' + t.id + '" type="button" aria-label="' + t.label + ' tema"><span class="nv-theme-sw' + (t.white ? ' white' : '') + '" style="background:' + t.c[0] + '"><i style="background:' + t.c[1] + '"></i><b style="background:' + t.c[2] + '"></b></span><span>' + t.label + '</span></button>'; }).join('') + '</div></div>'; }
  function menu(btn) {
    var es = $('.nv-theme-pop'); if (es) { es.remove(); return; }
    var m = d.createElement('div'); m.className = 'ns-menu nv-theme-pop'; m.innerHTML = '<div class="ns-menu-h">Tema</div>' + kutu(mod()); d.body.appendChild(m);
    var r = btn.getBoundingClientRect(), gen = Math.min(300, innerWidth - 16); m.style.width = gen + 'px'; m.style.top = r.bottom + 6 + 'px'; m.style.left = Math.max(8, Math.min(r.right - gen, innerWidth - gen - 8)) + 'px';
    var kapat = function () { m.remove(); d.removeEventListener('pointerdown', dis, true); d.removeEventListener('keydown', tus, true); btn.focus(); };
    var dis = function (e) { if (!m.isConnected) return kapat(); if (!m.contains(e.target) && !e.target.closest('[data-theme]:not(html)')) kapat(); };
    var tus = function (e) { if (e.key === 'Escape') { e.stopPropagation(); kapat(); } };
    d.addEventListener('pointerdown', dis, true); d.addEventListener('keydown', tus, true);
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme]:not(html)'); if (b) { e.preventDefault(); return menu(b); }
    var th = e.target.closest('[data-th]'); if (th) return uygula(th.dataset.th);
    var md = e.target.closest('[data-tmode]'); if (md) { var k = md.dataset.tmode, son = oku('nebsoft:palette:' + k), t = TEMALAR.filter(function (x) { return x.id === son && x.mode === k; })[0]; uygula(t ? t.id : (k === 'light' ? 'kurumsal' : 'dark')); }
  });
  // Sayfa içi arama ve kategori süzgeci (programlar, araçlar, rehber)
  var suz = $('[data-suz]');
  if (suz) {
    var gir = $('input', suz), cip = $$('.chip', suz), grup = $$('[data-grup]'), bos = $('#suz-bos'), sec = 'hepsi', kk = function (s) { return String(s).toLocaleLowerCase('tr'); };
    var isle = function () { var q = kk(gir.value.trim()), top = 0; grup.forEach(function (g) { var acik = sec === 'hepsi' || g.dataset.grup === sec, n = 0; $$('[data-kart]', g).forEach(function (x) { var on = acik && (!q || kk(x.textContent).indexOf(q) > -1); x.hidden = !on; if (on) n++; }); g.hidden = !n; top += n; }); if (bos) bos.hidden = top > 0; };
    gir.addEventListener('input', isle);
    cip.forEach(function (b) { b.addEventListener('click', function () { sec = b.dataset.k; cip.forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); }); isle(); }); });
    var q0 = new URLSearchParams(location.search).get('q'); if (q0) { gir.value = q0; isle(); }
  }
})();
