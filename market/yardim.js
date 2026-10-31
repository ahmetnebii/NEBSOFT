/* NEBSOFT pazar yeri eklentileri: yardım merkezi (#/yardim), güven kanıtı bölümü ve e-posta tercihi.
   Güven bölümü sunucudan gelen gerçek kayıtlarla dolar; kayıt yoksa yer tutucu gizli kalır, sayfada hiçbir iz bırakmaz. */
(function () {
  'use strict';
  const { esc, icon, toast } = window.NS;
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let V = null;
  const veri = () => V || (V = fetch('core/yardim.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch((e) => { V = null; throw e; }));
  async function sayfa(el, pid) {
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap" style="max-width:900px"><div id="yd">${window.NS.skeleton ? window.NS.skeleton(3) : '<p class="muted">Yükleniyor…</p>'}</div></div></section>`;
    const box = el.querySelector('#yd'); let d;
    try { d = await veri(); } catch (e) { box.innerHTML = `<div class="card pad empty">${icon('alert')}<div>Yardım içeriği yüklenemedi</div><a class="btn mt" href="#/iletisim">Bize ulaşın</a></div>`; return; }
    const p = pid && d.items.find((x) => x.id === pid);
    if (!p) {
      box.innerHTML = `<h1>Yardım merkezi</h1><p class="muted mb">Programınızı seçin; ilk kurulum adımları, kullanım rehberi ve sık sorulan sorular açılır.</p>
        <div class="row nw mb"><input class="input" id="yq" placeholder="Program ara" aria-label="Program ara"></div><div class="grid g3" id="yl"></div>`;
      const ciz = (q) => { const L = d.items.filter((x) => !q || window.NS.match(q, x.name, x.tagline)); el.querySelector('#yl').innerHTML = L.length ? L.map((x) => `<a class="card pad" href="#/yardim/${esc(x.id)}" style="color:inherit;text-decoration:none"><b>${esc(x.name)}</b><div class="small muted">${esc(x.tagline)}</div></a>`).join('') : `<div class="card pad empty" style="grid-column:1/-1">${icon('search')}<div>Program bulunamadı</div></div>`; };
      ciz(''); el.querySelector('#yq').oninput = (e) => ciz(e.target.value.trim()); return;
    }
    box.innerHTML = `<div class="row small muted mb"><a href="#/yardim">Yardım merkezi</a> / <span>${esc(p.name)}</span></div><h1>${esc(p.name)} rehberi</h1><p class="muted mb">${esc(p.tagline)}</p>
      <div class="card pad mb"><h2 class="mb">İlk kurulum</h2><ol style="margin:0;padding-left:20px">${p.kurulum.map((s) => `<li><b>${esc(s.t)}</b> <span class="muted">${esc(s.d)}</span></li>`).join('')}</ol></div>
      ${p.gorevler.map((g) => `<div class="card pad mb"><h2 class="mb">${esc(g.b)}</h2><ol style="margin:0;padding-left:20px">${g.a.map((x) => `<li>${md(x)}</li>`).join('')}</ol></div>`).join('')}
      <div class="card pad mb"><b>${icon('info')} İpucu</b><p class="mt">${esc(p.ipucu)}</p></div>
      <h2 class="mb">Sık sorulanlar</h2><div class="faq mb">${p.sss.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${md(a)}</p></details>`).join('')}</div>
      <div class="card pad center"><p class="muted">Aradığınızı bulamadınız mı?</p><div class="row mt" style="justify-content:center"><a class="btn" href="apps/${esc(p.id)}/index.html?demo=1" target="_blank" rel="noopener">${icon('play')} Canlı demo</a><a class="btn" id="ykl" target="_blank" rel="noopener" hidden>${icon('file')} Kullanım kılavuzu (PDF)</a><a class="btn primary" href="#/iletisim">${icon('message')} Bize ulaşın</a></div></div>`;
    if (window.NS && window.NS.kilavuzAdres) window.NS.kilavuzAdres(p.id).then((k) => { const a = el.querySelector('#ykl'); if (a && k) { a.href = k.url; a.hidden = false; } });
  }
  window.NB_YARDIM = { sayfa };
  // Güven bölümü: pid yoksa genel kayıtlar. Veri yoksa veya istek başarısızsa sayfa aynen kalır.
  window.NB_GUVEN = { mount(slot, pid) { if (!slot) return; fetch('/api/guven' + (pid ? '?p=' + encodeURIComponent(pid) : '')).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.html) { slot.innerHTML = j.html; slot.hidden = false; } }).catch(() => {}); } };
  // Hesabım → Profil: e-posta tercihleri
  window.NB_TERCIH = async (box) => {
    if (!box) return; let t; try { t = await window.NS.api('GET', '/api/mail-tercih'); } catch (e) { return; }
    const c = document.createElement('div'); c.className = 'card pad mt';
    c.innerHTML = `<h3 class="mb">E-posta tercihleri</h3><label class="check small"><input type="checkbox" id="td" ${t.deneme ? 'checked' : ''}> <span>Deneme süresince kurulum ve bitiş bilgilendirmeleri</span></label><label class="check small mt"><input type="checkbox" id="tp" ${t.pazarlama ? 'checked' : ''}> <span>Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı)</span></label><button class="btn mt" id="ts">Kaydet</button><p class="small muted mt">Doğrulama kodu, sipariş ve fatura e-postaları bu tercihten etkilenmez.</p>`;
    box.appendChild(c);
    c.querySelector('#ts').onclick = async () => { try { await window.NS.api('PUT', '/api/mail-tercih', { deneme: c.querySelector('#td').checked, pazarlama: c.querySelector('#tp').checked }); toast('Tercihiniz kaydedildi', 'ok'); } catch (e) { toast(e.message, 'err'); } };
  };
}());
