/* NEBSOFT kamera ile barkod okuma — telefonda ve kameralı bilgisayarda.
   • Tarayıcının yerleşik BarcodeDetector'ü (Android Chrome, Edge) varsa doğrudan; yoksa html5-qrcode (cdnjs) yüklenir (iPhone Safari).
   • NS.scan({ title, continuous, onCode(code) }) → tam ekran kamera. Ardışık okutmada aynı barkod 1,5 sn içinde tekrar sayılmaz.
   • onCode true/undefined dönerse tek okumalı modda kapanır; sesli ve titreşimli geri bildirim verir. */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { icon, esc } = NS;
  const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
  const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'];
  const loadLib = () => new Promise((res, rej) => { if (window.Html5Qrcode) return res(); const s = document.createElement('script'); s.src = LIB; s.onload = () => res(); s.onerror = () => rej(new Error('Kamera kütüphanesi yüklenemedi (internet bağlantısını kontrol edin)')); document.head.appendChild(s); });
  const can = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));

  function scan({ title = 'Barkod okut', hint = 'Barkodu çerçevenin içine getirin', continuous = false, onCode } = {}) {
    if (!can()) { NS.toast('Kamera için güvenli bağlantı (https) gerekir', 'err'); return { close() {} }; }
    const ov = document.createElement('div'); ov.className = 'nv-scan';
    ov.innerHTML = `<div class="nv-scan-top"><b>${esc(title)}</b><span class="grow"></span><button class="nv-scan-b" data-torch hidden title="Fener">${icon('zap')}</button><button class="nv-scan-b" data-x title="Kapat">${icon('x')}</button></div>
      <div class="nv-scan-stage"><video playsinline muted></video><div id="nvScanLib"></div><div class="nv-scan-frame"><i></i><i></i><i></i><i></i><span class="nv-scan-line"></span></div></div>
      <div class="nv-scan-foot"><span class="nv-scan-hint">${esc(hint)}</span><span class="nv-scan-last" hidden></span></div>`;
    document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
    let stream = null, timer = null, lib = null, closed = false, busy = false; let last = { code: '', at: 0 };
    const video = ov.querySelector('video');
    const close = async () => { if (closed) return; closed = true; clearInterval(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); if (lib) { try { await lib.stop(); } catch (e) { /* yok */ } } ov.classList.remove('on'); setTimeout(() => ov.remove(), 250); };
    const hit = (raw) => {
      const code = String(raw || '').trim(); if (!code || busy) return; const now = Date.now();
      if (code === last.code && now - last.at < 1500) return; last = { code, at: now };
      try { NS.beep(1250, 70); } catch (e) { /* yok */ } if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate(60); } catch (e) { /* yok */ }
      ov.classList.add('flash'); setTimeout(() => ov.classList.remove('flash'), 180);
      const l = ov.querySelector('.nv-scan-last'); l.hidden = false; l.textContent = code;
      const r = onCode ? onCode(code, ov) : undefined;
      if (r && typeof r.then === 'function') { busy = true; ov.classList.add('busy'); r.then((v) => { busy = false; ov.classList.remove('busy'); last = { code, at: Date.now() }; if (!continuous && v !== false) close(); }); return; }
      if (!continuous && r !== false) close();
    };
    ov.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) close(); });
    (async () => {
      try {
        if ('BarcodeDetector' in window) {
          const det = new window.BarcodeDetector({ formats: (await window.BarcodeDetector.getSupportedFormats()).filter((f) => FORMATS.includes(f)) });
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
          if (closed) return close(); video.srcObject = stream; await video.play();
          const track = stream.getVideoTracks()[0]; const caps = track.getCapabilities ? track.getCapabilities() : {};
          if (caps.torch) { const b = ov.querySelector('[data-torch]'); b.hidden = false; let on = false; b.onclick = () => { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }); b.classList.toggle('on', on); }; }
          timer = setInterval(async () => { if (video.readyState < 2) return; try { const r = await det.detect(video); if (r[0]) hit(r[0].rawValue); } catch (e) { /* kare atla */ } }, 180);
        } else {
          video.remove(); await loadLib(); if (closed) return;
          lib = new window.Html5Qrcode('nvScanLib', { verbose: false });
          await lib.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => ({ width: Math.min(w * 0.8, 340), height: Math.min(h * 0.45, 200) }) }, (t) => hit(t), () => {});
        }
      } catch (e) { NS.toast(/Permission|NotAllowed/i.test(e.name + e.message) ? 'Kamera izni verilmedi. Tarayıcı ayarlarından kameraya izin verin.' : 'Kamera açılamadı: ' + e.message, 'err'); close(); }
    })();
    return { close, el: ov };
  }
  NS.scan = scan; NS.scan.available = can;
})();
