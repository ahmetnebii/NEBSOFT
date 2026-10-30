/* NEBSOFT hazır paketler: pazar yeri içindeki liste ve paket ekranı (#/paketler, #/paket/<id>).
   Tutar burada hesaplanmaz; hepsi sunucudan (/api/paketler) gelir. Herkese açık tanıtım sayfaları /paketler/ altında üretilir (site/tools/build-sites.js). */
window.NB_PAKET = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money } = NS;
  const L = () => (window.PAKETLER || {}).liste || [];
  const bul = (id) => L().find((p) => p.id === id);
  const PLAN = () => (window.PAKETLER || {}).plan ?? 1;
  const para = (n) => money(n).replace(',00', '');
  let bellek = null; let at = 0;
  async function fiyatlar() {
    if (bellek && Date.now() - at < 30e3) return bellek;
    const r = await NS.api('GET', '/api/paketler');
    bellek = Object.fromEntries(r.paketler.map((x) => [x.id, x])); at = Date.now(); return bellek;
  }
  const hata = (mesaj) => `<div class="card pad empty" style="grid-column:1/-1">${icon('alert')}<div>${esc(mesaj)}</div><button class="btn mt" data-tekrar>${icon('refresh')} Yeniden dene</button></div>`;
  const programlar = (p, ctx) => p.programlar.map((x) => ctx.prod(x)).filter(Boolean);
  const satir = (t) => (t.indirim ? `<span class="old">${para(t.liste)}</span> ` : '');

  // Ana sayfa bölümü: fiyat gerektirmez, tanıtım sayfalarına gerçek adresle bağlanır
  const vitrin = () => `<section class="sec" style="padding-top:0"><div class="mk-wrap">
      <div class="sec-h reveal"><span class="eyebrow">Hazır paketler</span><h2>İşinize uygun programlar bir arada</h2><p>Sektörünüzü seçin, gereken programlar tek tıkla sepete gelsin. Toplu indirim sepette kendiliğinden uygulanır.</p></div>
      <div class="pk-mini-l">${L().slice(0, 8).map((p) => `<a class="pk-mini reveal" href="/paketler/${esc(p.id)}/" style="--pc:${p.accent}"><span class="pk-ic">${icon(p.icon)}</span><span class="grow"><b>${esc(p.ad)}</b><small>${esc(p.kim)}</small></span>${icon('right')}</a>`).join('')}</div>
      <div class="row mt reveal" style="justify-content:center"><a class="btn primary lg" href="/paketler/hangi-program/">${icon('sparkles')} Bana hangi program uygun?</a><a class="btn lg" href="/paketler/">${L().length} paketin tümünü görün ${icon('right')}</a></div></div></section>`;
  // Sepet satırındaki küçük etiket; paket listeden kaldırıldıysa görünmez
  const etiket = (id) => { const p = id && bul(id); return p ? ` <span class="badge acc">${esc(p.ad)} paketi</span>` : ''; };

  // Sihirbaz sonucu: #/paket-sepet/<paket>/<plan>/<program,program>. Tutar sepette sunucudan gelir, burada yalnız program listesi taşınır
  function sepet(param, ctx) {
    const [id, pl, liste] = String(param || '').split('/'); const p = bul(id); const plan = [0, 1, 2].includes(Number(pl)) ? Number(pl) : PLAN();
    const ids = String(liste || '').split(',').filter((x) => { const u = ctx.prod(x); return u && u.ready; });
    if (!p || !ids.length) { location.hash = '#/paketler'; return; }
    if (ids.length === 1) ctx.addCart(ids[0], plan, 'aylik'); else ctx.addPaket({ ...p, programlar: ids }, plan, 'aylik');
    location.hash = '#/sepet';
  }

  // ---------- Liste ----------
  function liste(el, ctx) {
    let q = '';
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap">
      <div class="page-h"><div class="grow"><h1>Hazır paketler</h1><p>Sektörünüze uygun programlar. Fiyatlar aylık ve KDV hariçtir, toplu indirim dahil gösterilir.</p></div>${NS.searchBox('pk-q', 'Sektör ara... (ör. kuaför)')}</div>
      <div class="pk-l" id="pk-l"><div class="card pad empty" style="grid-column:1/-1">${icon('clock')}<div>Fiyatlar hesaplanıyor...</div></div></div>
      <p class="small faint mt">Karar veremediyseniz <a href="/paketler/hangi-program/">üç soruda size uygun paketi bulun</a>. Tüm programları istiyorsanız <a href="#/fiyatlar">Hepsi Bir Arada</a> aboneliğine bakın. Tek program için <a href="/programlar">programlar</a> sayfasına dönün.</p></div></section>`;
    const kutu = $('#pk-l', el); let F = null;
    const kart = (p) => { const t = F[p.id].planlar[PLAN()].aylik; return `<div class="card pk-k" style="--pc:${p.accent}"><a class="pk-kb" href="#/paket/${esc(p.id)}"><span class="pk-ic">${icon(p.icon)}</span><span class="grow"><b>${esc(p.ad)}</b><small>${esc(p.kim)}</small></span></a>
        <div class="pk-ps">${programlar(p, ctx).map((x) => `<span>${esc(x.name)}</span>`).join('')}</div>
        <div class="pk-f"><div class="small muted">${esc(ctx.plans[PLAN()].name)} planı</div><div>${satir(t)}<b>${para(t.net)}</b><span class="small muted"> /ay</span></div>${t.indirim ? `<div class="small" style="color:var(--ok)">%${t.indirim.yuzde} toplu indirim dahil</div>` : ''}</div>
        <div class="row nw"><a class="btn sm grow" href="#/paket/${esc(p.id)}">İncele</a><button class="btn primary sm grow" data-ekle="${esc(p.id)}">${icon('cart')} Sepete ekle</button></div></div>`; };
    const draw = () => {
      const G = L().filter((p) => F[p.id] && F[p.id].satista && NS.match(q, p.ad, p.kim, ...programlar(p, ctx).map((x) => x.name)));
      kutu.innerHTML = G.length ? G.map(kart).join('') : `<div class="card pad empty" style="grid-column:1/-1">${icon('search')}<div>${q ? `“${esc(q)}” için paket bulunamadı` : 'Şu an satışta paket yok'}</div><a class="btn mt" href="#/iletisim">Bize sorun, size uygun programları seçelim</a></div>`;
    };
    const yukle = async () => { try { F = await fiyatlar(); if (kutu.isConnected) draw(); } catch (e) { if (kutu.isConnected) kutu.innerHTML = hata('Paket fiyatları şu an alınamıyor.'); } };
    $('#pk-q', el).oninput = (e) => { q = e.target.value; if (F) draw(); };
    on(el, 'click', '[data-ekle]', (e, b) => { const p = bul(b.dataset.ekle); if (p && ctx.addPaket(p, PLAN(), 'aylik')) location.hash = '#/sepet'; });
    on(el, 'click', '[data-tekrar]', () => { kutu.innerHTML = `<div class="card pad empty" style="grid-column:1/-1">${icon('clock')}<div>Fiyatlar hesaplanıyor...</div></div>`; yukle(); });
    yukle();
  }

  // ---------- Paket ekranı ----------
  function detay(el, param, ctx) {
    const [id, pl] = String(param || '').split('/'); const p = bul(id);
    if (!p) { location.hash = '#/paketler'; return; }
    let plan = [0, 1, 2].includes(Number(pl)) && pl !== undefined && pl !== '' ? Number(pl) : PLAN(); let donem = 'aylik'; let F = null;
    el.innerHTML = `<section class="sec" style="padding-top:32px"><div class="mk-wrap">
      <p class="small mb"><a href="#/paketler">Hazır paketler</a> / ${esc(p.ad)}</p>
      <div class="grid g-21"><div class="col" style="gap:16px;min-width:0">
        <div class="pk-bas" style="--pc:${p.accent}"><span class="pk-ic lg">${icon(p.icon, 'ico-lg')}</span><div><h1>${esc(p.ad)} paketi</h1><p class="muted">${esc(p.kim)} için ${p.programlar.length} program</p></div></div>
        <div class="card">${programlar(p, ctx).map((x) => `<a class="list-item pk-pr" href="${ctx.urunHref(x)}"><span class="avatar lg" style="background:${x.accent}22;color:${x.accent}">${icon(x.icon)}</span><span class="grow"><b>${esc(x.name)}</b><span class="small muted" style="display:block">${esc(x.tagline)}</span></span>${icon('right')}</a>`).join('')}</div>
        <div class="card pad small muted"><p>${icon('info')} Her program kendi lisansıyla açılır ve kendi verisini tutar, programlar arasında otomatik veri aktarımı yoktur. Hepsine aynı hesapla girersiniz.</p><p class="mt">Hesabınızda zaten olan programı sepetten çıkarabilirsiniz, indirim kalan programlara göre yeniden hesaplanır. Her programı ${ctx.trial()} gün ücretsiz deneyebilirsiniz.</p><p class="mt"><a href="/paketler/${esc(p.id)}/">Paket hakkında ayrıntılı bilgi</a></p></div>
      </div>
      <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">Plan seçin</h3>
        <div class="pk-plan" role="radiogroup" aria-label="Plan">${ctx.plans.map((x, i) => `<label class="${i === plan ? 'on' : ''}"><input type="radio" name="pk-pl" value="${i}" ${i === plan ? 'checked' : ''}><b>${esc(x.name)}</b><small>${esc(x.users)}</small></label>`).join('')}</div>
        <label class="small muted row nw mt">Ödeme dönemi <select class="input" id="pk-do" style="height:32px"><option value="aylik">Aylık</option><option value="yillik">Yıllık (2 ay bedava)</option></select></label>
        <div id="pk-oz" class="mt"><p class="small muted">Fiyat hesaplanıyor...</p></div>
        <button class="btn primary lg block mt" id="pk-ek" disabled>${icon('cart')} Paketi sepete ekle</button>
        ${ctx.bulut() ? '' : `<p class="small faint mt">${icon('info')} Bu kurulumda sepet yerel çalışır ve toplu indirimi göstermez. İndirim gerçek siparişte sunucuda uygulanır.</p>`}
        <p class="small faint center mt">Kesin tutar sepette hesaplanır, kupon veya daha yüksek bir toplu indirim varsa o geçerlidir.</p></div></div></div></div></section>`;
    const oz = $('#pk-oz', el); const btn = $('#pk-ek', el);
    const draw = () => {
      const d = F[p.id]; if (!oz.isConnected) return;
      if (!d || !d.satista) { oz.innerHTML = `<p class="small">${icon('alert')} Bu paket şu an satışta değil. Programları tek tek inceleyebilirsiniz.</p>`; btn.disabled = true; return; }
      const t = d.planlar[plan][donem]; const ek = donem === 'yillik' ? 'yıl' : 'ay';
      oz.innerHTML = `<div class="list-item"><span class="grow muted">${p.programlar.length} program</span><b>${money(t.liste)}</b></div>
        ${t.indirim ? `<div class="list-item" style="color:var(--ok)"><span class="grow">${esc(t.indirim.ad)} indirimi %${t.indirim.yuzde}</span><b>-${money(t.indirim.tutar)}</b></div>` : ''}
        <div class="list-item"><span class="grow muted">KDV</span><b>${money(t.kdv)}</b></div>
        <div class="list-item"><span class="grow"><b>Toplam</b></span><b style="font-size:22px">${money(t.toplam)}</b></div><p class="small faint">KDV dahil, ${ek}lık tutar.</p>`;
      btn.disabled = false;
    };
    const yukle = async () => { try { F = await fiyatlar(); draw(); } catch (e) { if (oz.isConnected) { oz.innerHTML = hata('Paket fiyatı şu an alınamıyor.'); btn.disabled = true; } } };
    on(el, 'change', '[name=pk-pl]', (e, x) => { plan = Number(x.value); $$('.pk-plan label', el).forEach((l) => l.classList.toggle('on', l.contains(x))); if (F) draw(); });
    $('#pk-do', el).onchange = (e) => { donem = e.target.value; if (F) draw(); };
    on(el, 'click', '[data-tekrar]', () => { oz.innerHTML = '<p class="small muted">Fiyat hesaplanıyor...</p>'; yukle(); });
    btn.onclick = () => { if (ctx.addPaket(p, plan, donem)) location.hash = '#/sepet'; };
    yukle();
  }
  return { vitrin, etiket, liste, detay, sepet };
})();
