/* NEBSOFT ilk kurulum kartı: yalnızca bulutta, deneme lisansıyla açılan programda görünür. İlerleme programın gerçek verisinden hesaplanır
   (core/kurulum-adimlari.js); elle "tamamlandı" işareti yoktur. Tüm adımlar bitince veya kullanıcı kapatınca bu cihazda gizlenir. */
(function () {
  'use strict';
  if (!window.NS || !window.NS_KURULUM || window.__nsKurulum) return; window.__nsKurulum = 1;
  const NS = window.NS; const { esc, icon } = NS; const K = window.NS_KURULUM;
  const key = (pid) => 'nebsoft:kurulum:' + pid;
  const gizli = (pid) => { try { return localStorage.getItem(key(pid)) === '1'; } catch (e) { return false; } };
  const gizle = (pid) => { try { localStorage.setItem(key(pid), '1'); } catch (e) { /* yok */ } };
  const css = `.nsk{position:fixed;left:16px;bottom:16px;z-index:60;font-size:14px;color:var(--text)}
    .nsk-chip{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:99px;border:1px solid var(--border);background:var(--surface);color:var(--text);box-shadow:var(--shadow-lg);cursor:pointer;font:inherit;font-weight:600}
    .nsk-p{width:min(340px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-lg);padding:14px}
    .nsk-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.nsk-h b{flex:1}.nsk-x{background:none;border:0;color:var(--text-3);cursor:pointer;padding:4px}
    .nsk-b{height:6px;border-radius:9px;background:var(--bg-2);overflow:hidden;margin:6px 0 10px}.nsk-b i{display:block;height:100%;background:var(--app-accent,var(--accent))}
    .nsk-s{display:flex;gap:10px;padding:8px 6px;border-radius:10px;color:inherit;text-decoration:none}.nsk-s:hover{background:var(--bg-2)}.nsk-s small{display:block;color:var(--text-3)}.nsk-s.ok b{text-decoration:line-through;color:var(--text-3)}
    .nsk-d{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid var(--border);display:grid;place-items:center;color:#fff}.nsk-s.ok .nsk-d{background:var(--ok,#16a34a);border-color:transparent}.nsk-d .ico{width:13px;height:13px}
    .nsk-n{margin-top:8px;font-size:12.5px;color:var(--text-3)}
    @media(max-width:640px){.nsk{left:12px;bottom:76px}}`;
  function mount(app, opt) {
    const pid = opt.pid; if (!K.list(pid).length || gizli(pid) || document.querySelector('.nsk')) return null;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const w = document.createElement('div'); w.className = 'nsk'; document.body.appendChild(w); let open = false;
    const draw = () => {
      const p = K.ilerleme(pid, app.db.data);
      if (p.done === p.total) { w.remove(); gizle(pid); NS.toast('Kurulum adımları tamamlandı', 'ok'); return; }
      w.innerHTML = open ? `<section class="nsk-p" role="dialog" aria-label="İlk kurulum"><div class="nsk-h"><b>İlk kurulum · ${p.done}/${p.total}</b><button class="nsk-x" data-k="min" aria-label="Küçült" title="Küçült">${icon('x')}</button></div><div class="nsk-b"><i style="width:${p.pct}%"></i></div>
        ${p.steps.map((s) => `<a class="nsk-s${s.ok ? ' ok' : ''}" href="#/${esc(s.go)}" data-k="go"><span class="nsk-d">${s.ok ? icon('check') : ''}</span><span><b>${esc(s.t)}</b><small>${esc(s.d)}</small></span></a>`).join('')}
        ${p.sample ? '<p class="nsk-n">Örnek kayıtlar sayılmaz; yalnızca sizin eklediğiniz kayıtlar adımı tamamlar.</p>' : ''}<p class="nsk-n"><a href="/#/yardim/${esc(pid)}" target="_blank" rel="noopener">Kullanım rehberi</a> · <a href="#" data-k="kapat">Bir daha gösterme</a></p></section>`
        : `<button class="nsk-chip" data-k="ac" aria-expanded="false">${icon('rocket')} İlk kurulum ${p.done}/${p.total}</button>`;
    };
    w.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === 'ac') { open = true; draw(); } else if (k === 'min') { open = false; draw(); } else if (k === 'kapat') { e.preventDefault(); gizle(pid); w.remove(); }
    });
    let t = null; app.db.onChange(() => { clearTimeout(t); t = setTimeout(() => { if (document.body.contains(w)) draw(); }, 400); });
    open = !!opt.acik; draw(); return w;
  }
  NS.kurulum = { mount };
}());
