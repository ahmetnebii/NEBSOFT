/* NEBSOFT giriş deneyimi — site girişi/kaydı, yönetim paneli girişi ve programların personel PIN ekranı aynı sahneyi kullanır.
   Sahne: sinematik ışık yansımaları (flare), SVG ışık hüzmeleri, imleci izleyen spotlight, ince ızgara ve gren.
   Kart: cam efekti + kenarında dolaşan ışık hüzmesi (border beam), logonun arkasında dönen bulanık hale.
   Form: yüzen etiketler, şifre göster/gizle, Caps Lock uyarısı, yükleniyor/başarı durumlu düğme, hatada titreme.
   Hareket azaltma tercihi (prefers-reduced-motion) açık olan kullanıcıda animasyonlar kapanır. */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { esc, icon } = NS;

  // Arka plan sahnesi
  const beams = () => {
    const P = ['M-80 180 C 220 120, 380 380, 760 260 S 1180 120, 1600 300', 'M-80 520 C 260 420, 520 700, 900 560 S 1300 380, 1600 620', 'M-80 820 C 300 760, 600 900, 980 780 S 1340 640, 1600 860', 'M200 -60 C 260 240, 120 520, 360 980', 'M1180 -60 C 1080 260, 1280 560, 1120 980'];
    return `<svg class="ax-beams" viewBox="0 0 1520 960" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="axg" x1="0" x2="1"><stop offset="0" style="stop-color:var(--ax-b1, #22d3ee)" stop-opacity="0"/><stop offset=".5" style="stop-color:var(--ax-b2, #a5b4fc)"/><stop offset="1" style="stop-color:var(--ax-b3, #c084fc)" stop-opacity="0"/></linearGradient></defs>
      ${P.map((d, i) => `<path class="ax-track" d="${d}"/><path class="ax-run" d="${d}" style="animation-delay:${-i * 2.3}s;animation-duration:${9 + i * 1.7}s"/>`).join('')}</svg>`;
  };
  const scene = (variant = 'site', accent) => `<div class="ax-bg" aria-hidden="true" ${accent ? `style="--ax-acc:${esc(accent)}"` : ''}><div class="ax-flare f1"></div><div class="ax-flare f2"></div><div class="ax-flare f3"></div>${beams()}<div class="ax-gridbg"></div><div class="ax-spot"></div><div class="ax-grain"></div></div>`;
  const halo = (mark) => `<div class="ax-halo"><span class="ax-halo-spin"></span>${mark}</div>`;

  // Form parçaları
  const field = (name, label, { type = 'text', value = '', ac = '', req = true, hint = '', extra = '' } = {}) => `<label class="ax-field${type === 'password' ? ' pw' : ''}">
      <input name="${name}" type="${type}" placeholder=" " value="${esc(value)}" ${ac ? `autocomplete="${ac}"` : ''} ${req ? 'required' : ''} ${extra}><span>${esc(label)}</span>
      ${type === 'password' ? `<button type="button" class="ax-eye" data-ax-eye aria-label="Şifreyi göster">${icon('eye')}</button><em class="ax-caps" hidden>${icon('alert')} Caps Lock açık</em>` : ''}${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
  const select = (name, label, options, value = '') => `<label class="ax-field sel"><select name="${name}">${options.map((o) => (typeof o === 'object' ? o : { value: o, label: o })).map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select><span>${esc(label)}</span></label>`;
  const button = (id, label, ic = 'right') => `<button class="ax-btn" id="${id}" type="submit"><span class="ax-btn-l">${esc(label)} ${icon(ic)}</span><span class="ax-btn-s" aria-hidden="true"></span><span class="ax-btn-ok" aria-hidden="true">${icon('check')}</span></button>`;

  // Davranışlar: spotlight, kart eğimi, şifre göz, caps lock
  function bind(root) {
    const spot = root.querySelector('.ax-spot'); const card = root.querySelector('.ax-card');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.addEventListener('pointermove', (e) => {
      if (spot) { spot.style.setProperty('--x', e.clientX + 'px'); spot.style.setProperty('--y', e.clientY + 'px'); }
      if (!reduce) root.querySelectorAll('[data-ax-tilt]').forEach((el) => { const r = el.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight; el.style.transform = `perspective(900px) rotateY(${dx * 10}deg) rotateX(${-dy * 10}deg) translateZ(0)`; });
    });
    if (card) card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', e.clientX - r.left + 'px'); card.style.setProperty('--my', e.clientY - r.top + 'px'); });
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-ax-eye]'); if (!b) return; const i = b.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = icon(show ? 'lock' : 'eye'); b.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster'); i.focus(); });
    root.addEventListener('keyup', (e) => { const i = e.target; if (!i.matches || !i.matches('.ax-field.pw input')) return; const c = i.parentElement.querySelector('.ax-caps'); if (c && e.getModifierState) c.hidden = !e.getModifierState('CapsLock'); });
    // Sıradaki yazılar (ör. "Adisyonunuz", "Servisiniz")
    root.querySelectorAll('[data-ax-rotate]').forEach((el) => { const W = JSON.parse(el.dataset.axRotate); let i = 0; if (reduce || W.length < 2) return; setInterval(() => { if (!el.isConnected) return; i = (i + 1) % W.length; el.classList.add('out'); setTimeout(() => { el.textContent = W[i]; el.classList.remove('out'); }, 320); }, 2600); });
  }
  const busy = (btn, on) => { if (!btn) return; btn.classList.toggle('busy', !!on); btn.disabled = !!on; };
  const done = (btn) => new Promise((r) => { if (!btn) return r(); btn.classList.remove('busy'); btn.classList.add('ok'); setTimeout(r, 650); });
  const shake = (el) => { if (!el) return; el.classList.remove('ax-shake'); void el.offsetWidth; el.classList.add('ax-shake'); };
  const err = (root, msg) => { const box = root.querySelector('.ax-err'); if (box) { box.innerHTML = `${icon('alert')} <span>${esc(msg)}</span>`; box.hidden = false; } shake(root.querySelector('.ax-card')); };

  // 6 haneli kod kutuları: otomatik ilerleme, geri silme, yapıştırma, telefonda SMS/e-posta kodu önerisi
  const otp = () => `<div class="ax-otp" role="group" aria-label="Doğrulama kodu">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="${i + 1}. hane" ${i === 0 ? 'autocomplete="one-time-code" autofocus' : 'autocomplete="off"'}>`).join('')}</div>`;
  function bindOtp(root, onFull) {
    const I = [...root.querySelectorAll('.ax-otp input')]; if (!I.length) return () => '';
    const val = () => I.map((x) => x.value).join('');
    const fill = (s, from = 0) => { String(s).replace(/\D/g, '').slice(0, 6 - from).split('').forEach((ch, k) => { I[from + k].value = ch; }); const n = Math.min(5, from + String(s).replace(/\D/g, '').length); I[n].focus(); if (val().length === 6 && onFull) onFull(val()); };
    I.forEach((x, i) => {
      x.addEventListener('input', () => { const d = x.value.replace(/\D/g, ''); if (d.length > 1) return fill(d, i); x.value = d; if (d && i < 5) I[i + 1].focus(); x.classList.toggle('on', !!d); if (val().length === 6 && onFull) onFull(val()); });
      x.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !x.value && i) { I[i - 1].focus(); I[i - 1].value = ''; I[i - 1].classList.remove('on'); } if (e.key === 'ArrowLeft' && i) I[i - 1].focus(); if (e.key === 'ArrowRight' && i < 5) I[i + 1].focus(); });
      x.addEventListener('paste', (e) => { e.preventDefault(); fill((e.clipboardData || window.clipboardData).getData('text'), i); });
      x.addEventListener('focus', () => x.select());
    });
    setTimeout(() => I[0].focus(), 60);
    return val;
  }
  NS.auth = { scene, halo, field, select, button, bind, busy, done, shake, err, otp, bindOtp };
})();
