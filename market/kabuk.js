/* NEBSOFT site kabuğu: üst menü ve alt bilgi tek kaynaktan gelir. Tarayıcıda window.NB_KABUK (market.js), Node'da require (site/tools/ortak.js).
   Ana sayfa bu parçayı çalışırken, statik sayfalar derlenirken çağırır; menüye yeni bağlantı buradan eklenir. */
(function (kok) {
  const MENU = [['/programlar', 'Ürünler', 'urunler'], ['/paketler/', 'Paketler', 'paketler'], ['/fiyatlar/', 'Fiyatlar', 'fiyatlar'], ['/rehber/', 'Rehber', 'rehber'], ['/araclar', 'Araçlar', 'araclar'], ['#/sektorler', 'Sektörler', 'sektorler'], ['#/indir', 'Masaüstü &amp; Mobil', 'indir'], ['#/iletisim', 'İletişim', 'iletisim']];
  const KURUMSAL = [['#/indir', 'Masaüstü sürümünü indir'], ['/paketler/', 'Hazır paketler'], ['/araclar', 'Ücretsiz araçlar'], ['/fiyatlar/', 'Fiyatlandırma'], ['/rehber/', 'Rehber'], ['#/sektorler', 'Sektörler'], ['#/yardim', 'Yardım merkezi'], ['/veri-tasima/', 'Veri taşıma'], ['/bayilik/', 'Bayilik ve mali müşavir'], ['/sistem-durumu/', 'Sistem durumu'], ['/yenilikler/', 'Yenilikler'], ['/yol-haritasi/', 'Yol haritası ve öneri'], ['#/iletisim', 'İletişim'], ['#/hesabim', 'Müşteri paneli'], ['/admin/', 'Yönetim paneli']];
  const YASAL = [['/kvkk/', 'KVKK Aydınlatma'], ['/mesafeli-satis/', 'Mesafeli Satış Sözleşmesi'], ['/iade/', 'İptal ve İade'], ['/gizlilik/', 'Gizlilik Politikası'], ['/cerez/', 'Çerez Politikası']];
  const bag = (h, u) => (u[0] === '#' ? h + u : u); // "#/" adresi statik sayfada ana sayfaya döner
  const misafir = (h, icon) => `<a class="btn mk-login" href="${h}#/giris">${icon('user')} Giriş yap</a><a class="btn primary mk-hide-s" href="${h}#/kayit">Ücretsiz başla ${icon('right')}</a>`;
  const misafirMobil = (h, icon) => `<a href="${h}#/giris">${icon('user')} Giriş yap</a><a class="btn primary block" href="${h}#/kayit">Ücretsiz hesap oluştur</a>`;
  const temaSatir = (ico) => `<a href="#" data-theme onclick="return false">${ico} Açık / koyu tema</a>`;
  // o: { h: statikte '/', ana sayfada '', ana: logo adresi, logo, icon, temaIkon, aktif, hesap, hesapMobil }
  const ust = (o) => `<header class="mk-nav"><div class="mk-wrap">
        <a class="mk-logo" href="${o.ana}" aria-label="NEBSOFT ana sayfa">${o.logo}</a>
        <nav class="mk-links" id="links" aria-label="Ana menü">${MENU.map(([u, ad, k]) => `<a href="${bag(o.h, u)}" data-l="${k}"${o.aktif === k ? ' class="active" aria-current="page"' : ''}>${ad}</a>`).join('')}<div class="mk-only-m" id="accm">${o.hesapMobil || ''}</div></nav>
        <span class="grow mk-hide-m"></span>
        <button class="btn ghost icon" type="button" data-theme title="Tema" aria-label="Tema" data-theme-ico>${o.temaIkon}</button>
        <a class="btn ghost icon cart-btn" href="${o.h}#/sepet" title="Sepet" aria-label="Sepet">${o.icon('cart')}<span class="cnt hide" id="cc"></span></a>
        <div class="mk-acc" id="acc">${o.hesap || ''}</div>
        <button class="btn ghost icon mk-burger" type="button" id="burger" aria-label="Menü" aria-expanded="false" aria-controls="links">${o.icon('menu')}</button>
      </div></header>`;
  // o: { h, ana, logo, icon, urunler: [[adres, ad]], tel, telHref, eposta, adres, unvan, ek }
  const alt = (o) => `<footer class="mk-foot"><div class="mk-wrap"><div class="cols">
        <div class="mk-foot-m"><a class="mk-logo" href="${o.ana}" aria-label="NEBSOFT ana sayfa">${o.logo}</a><p class="muted small mt">Türkiye'deki işletmeler için bulut tabanlı işletme yazılımları. Kurulum yok, taahhüt yok.</p><p class="small mt">${o.icon('phone')} ${o.telHref ? `<a class="sat" href="${o.telHref}">${o.tel}</a>` : o.tel}<br>${o.icon('mail')} ${o.eposta ? `<a class="sat" href="mailto:${o.eposta}">${o.eposta}</a>` : ''}${o.adres ? `<br>${o.icon('map')} ${o.adres}` : ''}</p></div>
        <div class="mk-foot-u"><h4>Ürünler</h4><div class="mk-foot-l">${o.urunler.map(([u, ad]) => `<a href="${u}">${ad}</a>`).join('')}</div><a href="/programlar">Tüm ürünler →</a></div>
        <div><h4>Kurumsal</h4>${KURUMSAL.map(([u, ad]) => `<a href="${bag(o.h, u)}">${ad}</a>`).join('')}</div>
        <div><h4>Yasal</h4>${YASAL.map(([u, ad]) => `<a href="${u}">${ad}</a>`).join('')}${o.ek || ''}</div>
      </div><hr><div class="row between small faint"><span>© ${new Date().getFullYear()} ${o.unvan}. Tüm hakları saklıdır.</span></div></div></footer>`;
  const api = { MENU, KURUMSAL, YASAL, ust, alt, misafir, misafirMobil, temaSatir };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else kok.NB_KABUK = api;
})(typeof window !== 'undefined' ? window : globalThis);
