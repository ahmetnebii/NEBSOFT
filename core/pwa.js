/* NEBSOFT PWA: telefona / bilgisayara "uygulama olarak yükle"
   • Sunucu modunda manifest (program adı, rengi, açılış adresi) ve service worker eklenir.
   • Android/Chrome'da yükleme isteği yakalanır; iOS'ta "Paylaş > Ana Ekrana Ekle" adımları gösterilir.
   • NS.pwa.prompt() — "Uygulamayı yükle" düğmeleri bunu çağırır. */
(function () {
  'use strict';
  // Müşteriye açık sayfalarda (randevu, takip, portal…) işletmenin müşterisine NEBSOFT uygulaması önerilmez
  const customer = /\/apps\/[a-z0-9]+\/(?!index\.html)[^/]+\.html$/.test(location.pathname);
  if (!window.NS || customer || !/^https?:$/.test(location.protocol)) { if (window.NS) window.NS.pwa = { can: () => false, prompt: () => {}, installed: () => false }; return; }
  const NS = window.NS;
  const app = (location.pathname.match(/\/apps\/([a-z0-9]+)\/(index\.html)?$/) || [])[1] || '';
  const head = document.head;
  const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); head.appendChild(el); };
  if (!document.querySelector('link[rel=manifest]')) add('link', { rel: 'manifest', href: '/manifest.webmanifest' + (app ? '?app=' + app : '') });
  if (!document.querySelector('meta[name=theme-color]')) add('meta', { name: 'theme-color', content: '#4f46e5' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
  add('link', { rel: 'apple-touch-icon', href: '/assets/icons/apple-touch-icon.png' });
  if ('serviceWorker' in navigator && !/[?&]demo=1/.test(location.search)) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

  let deferred = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; document.documentElement.classList.add('nv-can-install'); });
  addEventListener('appinstalled', () => { deferred = null; document.documentElement.classList.remove('nv-can-install'); NS.toast && NS.toast('Uygulama yüklendi — ana ekranınızdan açabilirsiniz', 'ok'); });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  async function prompt() {
    if (installed()) return NS.toast('Uygulama zaten yüklü', 'ok');
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; return r; }
    NS.modal({ title: 'Uygulamayı yükleyin', body: ios
      ? `<ol class="col" style="gap:10px;padding-left:18px"><li>Safari'nin altındaki <b>Paylaş</b> düğmesine dokunun (kare içinde yukarı ok).</li><li><b>Ana Ekrana Ekle</b>'yi seçin.</li><li>Sağ üstteki <b>Ekle</b>'ye dokunun. NEBSOFT simgesi ana ekranınıza gelir.</li></ol>`
      : `<ol class="col" style="gap:10px;padding-left:18px"><li>Tarayıcı menüsünü açın (⋮).</li><li><b>Uygulamayı yükle</b> veya <b>Ana ekrana ekle</b>'yi seçin.</li><li>Bilgisayarda adres çubuğunun sağındaki yükle simgesini de kullanabilirsiniz.</li></ol>`,
      actions: [{ label: 'Tamam', cls: 'primary' }] });
  }
  // Telefonda ilk girişten sonra (14 günde bir en fazla) alttan açılan "ana ekrana ekle" penceresi
  const mobile = () => matchMedia('(max-width: 820px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const android = /Android/i.test(navigator.userAgent);
  function offer({ force } = {}) {
    if (installed() || (!force && !mobile()) || document.querySelector('.nv-sheet')) return;
    let last = 0; try { last = Number(localStorage.getItem('nebsoft:installAsk')) || 0; } catch (e) { /* yok */ }
    if (!force && Date.now() - last < 14 * 864e5) return;
    const name = (document.title.split('·')[0] || 'NEBSOFT').trim();
    const share = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
    const plus = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    const el = document.createElement('div'); el.className = 'nv-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Uygulamayı ana ekrana ekle');
    el.innerHTML = `<div class="nv-sheet-bg" data-sx></div><div class="nv-sheet-in"><span class="nv-sheet-grab"></span>
      <div class="nv-sheet-h"><div class="nv-sheet-ic"><img src="/assets/icons/icon-128.png" alt="" width="60" height="60"></div><div><b>${NS.esc(name)} telefonunuzda</b><span>Ana ekrandan tek dokunuşla açın, tam ekran ve daha hızlı çalışsın.</span></div></div>
      ${ios ? `<div class="nv-guide">${[['Alttaki <b>Paylaş</b> düğmesine dokunun', 1], ['<b>Ana Ekrana Ekle</b>’yi seçin', 2], ['<b>Ekle</b>’ye dokunun — simge ana ekranda', 3]].map(([t, i]) => `<figure><img src="/assets/install/ios-${i}.png" alt="" width="214" height="152" loading="lazy"><figcaption><span>${i}</span>${t}</figcaption></figure>`).join('')}</div><ol class="nv-steps nv-steps-txt"><li><span>1</span><div>Safari'nin alt çubuğundaki <b>Paylaş</b> düğmesine dokunun <i>${share}</i></div></li><li><span>2</span><div>Listeyi kaydırıp <b>Ana Ekrana Ekle</b>'yi seçin <i>${plus}</i></div></li><li><span>3</span><div>Sağ üstteki <b>Ekle</b>'ye dokunun. Simge ana ekranınıza gelir.</div></li></ol><p class="nv-sheet-note">Chrome veya başka bir tarayıcı kullanıyorsanız bu adımlar için sayfayı Safari'de açın.</p>`
        : `<ul class="nv-benefits"><li>Ana ekranda kendi simgesiyle</li><li>Adres çubuğu olmadan tam ekran</li><li>Sipariş ve randevu bildirimleri</li></ul>`}
      <div class="nv-sheet-a">${ios ? '<button class="btn primary lg block" data-sx>Anladım</button>' : `<button class="btn primary lg block" data-si>${android && deferred ? 'Ana ekrana ekle' : 'Nasıl eklenir?'}</button>`}<button class="btn ghost block" data-sx>Şimdi değil</button></div></div>`;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
    const close = () => { try { localStorage.setItem('nebsoft:installAsk', String(Date.now())); } catch (e) { /* yok */ } el.classList.remove('on'); setTimeout(() => el.remove(), 300); };
    el.addEventListener('click', async (e) => { if (e.target.closest('[data-sx]')) close(); if (e.target.closest('[data-si]')) { close(); await prompt(); } });
  }
  NS.pwa = { can: () => !!deferred || ios, prompt, installed, ios, offer, mobile };
})();
