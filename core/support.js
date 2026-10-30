/* NEBSOFT canlı destek balonu — ücretsiz, harici API kullanmayan bilgi bankası asistanı.
   • Bilgi bankası: /core/kb.json (site/tools/build-kb.js ile üretilir; ~1.500 soru, her biri birkaç soruluş biçimiyle)
   • Eşleştirme: Türkçe karakter normalleştirme + ilk 5 harf kök (Türkçe eklerini tolere eder) + nadir kelimeye ağırlık (IDF)
     + bulunduğunuz programın sorularına öncelik. Tamamen tarayıcıda çalışır.
   • Yanıtlanamayan sorular ve "işe yaradı / yaramadı" geri bildirimleri sunucuya kaydedilir (/api/destek/kayit);
     yönetim panelinde "Destek asistanı" sayfasından görülür, ileride yapay zekâ eğitimi için JSONL olarak indirilebilir.
   • Kafe / Adisyon ve QR menü sayfalarında görünmez (bu modüllerin davranışı değişmesin diye). */
(function () {
  'use strict';
  if (!window.NS || window.__nsSupport) return; window.__nsSupport = 1;
  const P = location.pathname;
  if (/\/apps\/adisyon\/|\/admin\/|qr\.html|\/menu\//i.test(P) || window.self !== window.top) return;
  const NS = window.NS; const { esc, icon } = NS;
  const APP = (P.match(/\/apps\/([a-z0-9]+)\//) || [])[1] || '';
  const KEY = 'nebsoft:destek'; const ss = { get() { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { return []; } }, set(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v.slice(-40))); } catch (e) { /* yok */ } } };
  const STOP = new Set('ve ile icin bir bu su o da de mi mu mi mı nasil ne neden niye nerede nereden hangi kac var yok mu ben biz siz sen olarak gibi daha en cok cok ama veya ya ki ise bana benim bizim sizin icinde yapilir yaparim yapabilir miyim istiyorum lazim gerekiyor gerek'.split(' '));
  const fold = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a');
  const toks = (s) => fold(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => (w.length > 5 ? w.slice(0, 5) : w));
  let KB = null, IDF = null;
  const load = () => KB ? Promise.resolve(KB) : fetch((window.__NB_ASSETS ? window.__NB_ASSETS.replace(/assets\/?$/, '') : '/') + 'core/kb.json').then((r) => r.json()).then((j) => {
    KB = j.items.map((x) => ({ ...x, Q: new Set(toks(x.q)), A: new Set(toks(x.alt.join(' ') + ' ' + x.tags.join(' '))), B: new Set(toks(x.a)) }));
    const df = {}; KB.forEach((x) => new Set([...x.Q, ...x.A]).forEach((w) => { df[w] = (df[w] || 0) + 1; })); IDF = (w) => Math.log(1 + KB.length / (1 + (df[w] || 0)));
    return KB;
  }).catch(() => { KB = []; IDF = () => 1; return KB; });
  // Eşleştirme: her sorgu kelimesi için soru > diğer soruluşlar > cevap ağırlığı; kapsama oranı 0..1
  function search(q, n = 4) {
    const qt = [...new Set(toks(q))]; if (!qt.length || !KB.length) return [];
    const tot = qt.reduce((s, w) => s + IDF(w), 0);
    return KB.map((x) => {
      let s = 0; qt.forEach((w) => { const i = IDF(w); if (x.Q.has(w)) s += i; else if (x.A.has(w)) s += i * 0.85; else if (x.B.has(w)) s += i * 0.35; });
      let cov = s / tot; if (x.m === APP) cov *= 1.22; else if (x.m === 'genel') cov *= 1.08; else if (APP) cov *= 0.8;
      if (fold(x.q).includes(fold(q).trim()) && q.trim().length > 4) cov += 0.25;
      return { x, s: cov };
    }).filter((r) => r.s > 0.2).sort((a, b) => b.s - a.s).slice(0, n);
  }
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => /^(\/|https:\/\/|#|mailto:|tel:)/.test(u) ? `<a href="${u.replace(/&amp;/g, '&')}" ${/^https?:/.test(u) ? 'target="_blank" rel="noopener"' : ''}>${t}</a>` : t);
  const log = (kind, q, entry) => { try { fetch('/api/destek/kayit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, q: String(q || '').slice(0, 300), app: APP || 'site', entry: entry || '', page: location.hash.slice(0, 60) }), keepalive: true }).catch(() => {}); } catch (e) { /* yok */ } };
  const phone = () => (NS.cloud && NS.cloud.site && NS.cloud.site.phone) || '0850 555 00 34';
  const SUGGEST = { '': ['Ücretsiz deneme nasıl başlatılır?', 'Hangi ödeme yöntemleri var?', 'Paketler arasındaki fark nedir?', 'Telefona uygulama olarak nasıl eklerim?'], pos: ['Stok sayımı nasıl yapılır?', 'Hazır katalogdan ürün nasıl eklenir?', 'Etiket şablonu nasıl tasarlanır?', 'Barkod okuyucu nasıl bağlanır?'] };

  function mount() {
    if (document.querySelector('.nsd')) return;
    const w = document.createElement('div'); w.className = 'nsd' + (APP ? ' in-app' : '');
    w.innerHTML = `<button class="nsd-fab" aria-label="Canlı destek" aria-expanded="false">${icon('message')}<span class="nsd-x">${icon('x')}</span><i class="nsd-dot"></i></button>
      <section class="nsd-p" role="dialog" aria-label="NEBSOFT destek" hidden>
        <header class="nsd-h"><span class="nsd-av">${icon('message')}</span><div><b>NEBSOFT Destek</b><small><i></i> Asistan · anında yanıt</small></div><button class="nsd-c" data-nsd="close" aria-label="Kapat">${icon('x')}</button></header>
        <div class="nsd-log" aria-live="polite"></div>
        <form class="nsd-f"><input placeholder="Sorunuzu yazın…" aria-label="Sorunuz" maxlength="300" autocomplete="off"><button aria-label="Gönder">${icon('right')}</button></form>
        <div class="nsd-foot"><a href="tel:${phone().replace(/\s/g, '')}">${icon('phone')} ${esc(phone())}</a><a href="mailto:destek@nebsoft.com.tr">${icon('mail')} E-posta</a></div>
      </section>`;
    document.body.appendChild(w);
    const fab = w.querySelector('.nsd-fab'), pan = w.querySelector('.nsd-p'), L = w.querySelector('.nsd-log'), inp = w.querySelector('input');
    let hist = ss.get();
    const scroll = () => requestAnimationFrame(() => { L.scrollTop = L.scrollHeight; });
    const bubble = (m) => {
      if (m.me) return `<div class="nsd-m me">${esc(m.t)}</div>`;
      return `<div class="nsd-m bot">${md(m.t)}${m.e ? `<div class="nsd-fb" data-e="${esc(m.e)}" data-q="${esc(m.q || '')}">${m.fb ? `<span>${m.fb === 'ok' ? 'Teşekkürler!' : 'Not aldık, ekibimize ilettik.'}</span>` : `<span>İşe yaradı mı?</span><button data-fb="ok" aria-label="Evet">👍</button><button data-fb="no" aria-label="Hayır">👎</button>`}</div>` : ''}${m.rel && m.rel.length ? `<div class="nsd-rel">${m.rel.map((r) => `<button data-ask="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : ''}${m.help ? `<div class="nsd-help"><a class="btn sm" href="tel:${phone().replace(/\s/g, '')}">${icon('phone')} Bizi arayın</a><a class="btn sm" href="${APP ? '/' : ''}#/hesabim">${icon('message')} Destek talebi</a></div>` : ''}</div>`;
    };
    const render = () => {
      const intro = { t: `Merhaba! 👋 ${APP ? 'Bu programla' : 'NEBSOFT ile'} ilgili sorunuzu yazın, hemen yanıtlayayım. Yanıt bulamazsam sorunuzu ekibimize iletirim.`, rel: SUGGEST[APP] || (APP ? [] : SUGGEST['']) };
      L.innerHTML = [intro, ...hist].map(bubble).join(''); scroll();
      if (APP && !SUGGEST[APP] && !hist.length) load().then(() => { const s = KB.filter((x) => x.m === APP && /tanitim|sss|menu/.test(x.t)).slice(0, 4).map((x) => x.q); if (s.length) { intro.rel = s; L.innerHTML = [intro, ...hist].map(bubble).join(''); } });
    };
    const ask = async (q) => {
      q = String(q || '').trim(); if (!q) return;
      hist.push({ me: 1, t: q }); render(); L.insertAdjacentHTML('beforeend', '<div class="nsd-m bot nsd-typing"><i></i><i></i><i></i></div>'); scroll();
      await Promise.all([load(), new Promise((r) => setTimeout(r, 450))]);
      const r = search(q);
      if (r.length && r[0].s >= 0.5) hist.push({ t: r[0].x.a, e: r[0].x.id, q, rel: r.slice(1).filter((y) => y.s >= 0.35).map((y) => y.x.q).slice(0, 3) });
      else if (r.length && r[0].s >= 0.3) { hist.push({ t: 'Tam emin olamadım; şunlardan biri mi?', rel: r.map((y) => y.x.q).slice(0, 4), help: 1 }); log('belirsiz', q); }
      else { hist.push({ t: `Bu soruyu yanıtlayacak doğrulanmış bilgim yok, tahmin yürütmek istemem. Sorunuz kayda alındı; hızlı yanıt için ${phone()} numarasını arayabilir, destek@nebsoft.com.tr adresine yazabilir veya destek talebi açabilirsiniz. Kullanım rehberleri [Yardım merkezinde](/#/yardim${APP ? '/' + APP : ''}).`, help: 1 }); log('cevapsiz', q); }
      ss.set(hist); render();
    };
    const open = (v) => { pan.hidden = !v; w.classList.toggle('open', v); fab.setAttribute('aria-expanded', v); if (v) { render(); setTimeout(() => inp.focus(), 120); load(); } };
    fab.onclick = () => open(pan.hidden);
    w.addEventListener('click', (e) => {
      const t = e.target.closest('[data-ask],[data-fb],[data-nsd]'); if (!t) return;
      if (t.dataset.nsd === 'close') return open(false);
      if (t.dataset.ask) return ask(t.dataset.ask);
      if (t.dataset.fb) { const box = t.closest('.nsd-fb'); const m = hist.find((x) => x.e === box.dataset.e && !x.fb); if (m) { m.fb = t.dataset.fb; ss.set(hist); } log(t.dataset.fb === 'ok' ? 'olumlu' : 'olumsuz', box.dataset.q, box.dataset.e); if (t.dataset.fb === 'no') hist.push({ t: 'Üzgünüm. Sorunuzu biraz farklı yazmayı deneyin ya da ekibimize ulaşın.', help: 1 }); ss.set(hist); render(); }
    });
    w.querySelector('form').onsubmit = (e) => { e.preventDefault(); const q = inp.value; inp.value = ''; ask(q); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pan.hidden) open(false); });
    NS.support = { open: () => open(true), ask: (q) => { open(true); ask(q); }, search: (q) => load().then(() => search(q)) };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 600)); else setTimeout(mount, 600);
})();
