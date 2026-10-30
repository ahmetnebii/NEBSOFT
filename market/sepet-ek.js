/* NEBSOFT sepet eki: destek paketi seçimi, şube ve lisans sayısı, toplu indirim özeti, müşteri destek kartı.
   Yalnızca bulut modunda çalışır. Tutar ve süre burada hesaplanmaz; hepsi sunucudan (/api/orders/quote, /api/destek/paketler) gelir. */
window.NB_SEPET = (function () {
  'use strict';
  const { esc, $, on, icon, money, toast, badge } = NS;
  const donemAd = (p) => (p === 'yillik' ? 'yıllık' : 'aylık');
  const istek = (ctx) => { const c = ctx.cart(); return { items: c.items.map((i) => ({ pid: i.pid, plan: i.plan, period: i.period, qty: i.qty || 1 })), coupon: c.coupon || undefined, subeSayisi: c.sube || 1, ...(c.support ? { support: { plan: c.support, period: c.supportPeriod || 'aylik' } } : {}) }; };
  const quote = (ctx) => NS.api('POST', '/api/orders/quote', istek(ctx));
  const indirimYazi = (d) => (d.kural === 'kupon' ? `Kupon %${d.yuzde}` : d.kural === 'teklif' ? d.ad : `${d.ad} indirimi %${d.yuzde}`);
  const fiyatYazi = (p, donem) => (p.aylik ? (donem === 'yillik' ? `${money(p.yillik)} / yıl` : `${money(p.aylik)} / ay`) : 'Ücretsiz');
  const sureYazi = (p) => `İlk yanıt ${p.ilkYanitSaat} saat · Çözüm ${p.cozumSaat} saat`;
  const kalanYazi = (dk) => { const m = Math.abs(dk); const g = Math.floor(m / 1440), s = Math.floor((m % 1440) / 60); return g ? `${g} gün ${s} sa` : s ? `${s} sa ${m % 60} dk` : `${m} dk`; };
  const SLA = { zamaninda: ['Zamanında', 'ok'], yaklasti: ['Süre yaklaşıyor', 'warn'], asildi: ['Süre aşıldı', 'err'], 'gec-kapandi': ['Geç kapandı', 'err'], kapandi: ['Süresinde kapandı', 'ok'] };
  // Eski taleplerde süre alanı yoktur: rozet gösterilmez, sahte süre üretilmez
  function slaRozet(t) {
    const s = t.sla; if (!s || !SLA[s.durum]) return '';
    const son = t.first_reply_at ? t.resolve_due : t.first_due; const ac = !['kapandi', 'gec-kapandi'].includes(s.durum);
    return `${badge(SLA[s.durum][0], SLA[s.durum][1])}${ac && son ? `<span class="small faint" style="white-space:nowrap">${s.asama === 'cozum' ? 'Çözüm' : 'İlk yanıt'}: ${NS.dt(son)}${s.durum === 'asildi' ? '' : ` (${kalanYazi(s.kalanDk)} kaldı)`}</span>` : ''}`;
  }
  // Müşteri ekranı: geçerli paket ve yükseltme seçenekleri
  function paketKarti(d, list) {
    const ust = (list || []).filter((p) => p.oncelik < d.oncelik);
    return `<div class="card pad mb"><div class="row" style="flex-wrap:wrap;gap:12px"><div class="grow" style="min-width:220px"><b>${icon('shield')} ${esc(d.ad)} destek paketi</b>${d.bitis ? `<span class="small muted"> · ${NS.date(d.bitis)} tarihine kadar</span>` : ''}
      <div class="small muted mt">${esc((d.kanallar || []).join(', '))}</div><div class="small muted">${esc(sureYazi(d))} (çalışma saati: ${esc(d.takvim)})</div></div>
      ${ust.map((p) => `<button class="btn sm" data-dp="${esc(p.id)}">${esc(p.ad)} paketine geç · ${money(p.aylik)} / ay</button>`).join('')}${d.ucretli ? `<button class="btn sm" data-dp="${esc(d.id)}">Süreyi uzat</button>` : ''}</div></div>`;
  }
  function ozetHtml(q, sonraki) {
    const prog = q.lines.filter((l) => l.type !== 'support'); const dl = q.lines.find((l) => l.type === 'support'); const top = prog.reduce((s, l) => s + l.price, 0);
    return `${prog.length ? `<div class="list-item"><span class="grow muted">Programlar</span><b>${money(top)}</b></div>` : ''}
      ${dl ? `<div class="list-item"><span class="grow muted">${esc(dl.name)} (${donemAd(dl.period)})</span><b>${money(dl.price)}</b></div>` : ''}
      ${q.indirim ? `<div class="list-item" style="color:var(--ok)"><span class="grow">${esc(indirimYazi(q.indirim))}</span><b>-${money(q.discount)}</b></div>` : ''}
      <div class="list-item"><span class="grow muted">KDV</span><b>${money(q.vat)}</b></div>
      <div class="list-item"><span class="grow"><b>Toplam</b></span><b style="font-size:22px">${money(q.total)}</b></div>
      ${sonraki && q.sonraki ? `<p class="small muted mt">${icon('info')} ${q.sonraki.eksik} ${esc(q.sonraki.ad)} daha ekleyin, indiriminiz %${q.sonraki.yuzde} olsun.</p>` : ''}
      ${q.coupon === null && q.kuponGirildi ? '<p class="small muted mt">Toplu indirim daha yüksek olduğu için kupon uygulanmadı.</p>' : ''}`;
  }
  const teklifAdres = (ctx, q) => { const c = ctx.cart(); const u = new URLSearchParams(); if (q) { u.set('lisans', q.olcut.lisansSayisi); u.set('sube', q.olcut.subeSayisi); } const p = c.items.map((i) => i.pid); if (p.length) u.set('program', p.join(',')); const s = u.toString(); return `/kurumsal-teklif${s ? '?' + s : ''}`; };

  // Sepet sayfası: paket kartları ve şube girişi bir kez çizilir, tutar her değişimde sunucudan alınır
  async function sepet(el, ctx) {
    const kutu = $('#sp-ek', el); let P;
    try { P = await NS.api('GET', '/api/destek/paketler'); } catch (e) { P = { paketler: [], turler: {} }; }
    if (!kutu.isConnected) return;
    const c = ctx.cart(); const secili = c.support || P.varsayilan; const donem = c.supportPeriod || 'aylik';
    const lisans = c.items.reduce((s, i) => s + (i.qty || 1), 0); const yenile = ctx.yenile;
    kutu.innerHTML = `${P.paketler.length ? `<div class="card pad"><div class="row mb" style="flex-wrap:wrap"><h3 class="grow">Destek paketi</h3><select class="input" id="sp-do" style="max-width:190px;height:32px" aria-label="Destek dönemi"><option value="aylik" ${donem === 'aylik' ? 'selected' : ''}>Aylık</option><option value="yillik" ${donem === 'yillik' ? 'selected' : ''}>Yıllık (10 ay öde)</option></select></div>
        <div class="sp-paket">${P.paketler.map((p) => `<label class="card pad sp-p ${p.id === secili ? 'on' : ''}"><span class="row nw"><input type="radio" name="sp" value="${esc(p.id)}" ${p.id === secili ? 'checked' : ''}><b class="grow">${esc(p.ad)}</b><b>${fiyatYazi(p, donem)}</b></span>
          <span class="small muted">${esc(p.kanallar.join(', '))}</span><span class="small muted">${esc(sureYazi(p))}</span><span class="small faint">Çalışma saati: ${esc(p.takvim)}</span></label>`).join('')}</div>
        <p class="small faint mt">Süreler çalışma saati içinde sayılır. Paket ödeme onaylanınca açılır.${P.aktif && P.aktif.ucretli ? ` Geçerli paketiniz: ${esc(P.aktif.ad)} (${NS.date(P.aktif.bitis)} tarihine kadar). Ücretsiz seçenekte paketiniz değişmez. Aynı paket uzatılır; farklı ücretli paket bugün başlar, kalan süre aktarılmaz.` : ''}</p></div>` : ''}
      <div class="card pad"><h3 class="mb">Şube ve lisans</h3><div class="row" style="flex-wrap:wrap;gap:16px"><label class="small muted row nw">Şube sayısı <input class="input" type="number" min="1" max="1000" id="sp-su" value="${c.sube || 1}" style="width:84px;height:32px"></label><span class="small muted">Toplam lisans: <b>${lisans}</b> (adetleri ürün satırından değiştirin)</span></div>
        <p class="small faint mt">Şube sayısı beyanınızdır, sipariş kaydına yazılır. Oda, dernek, bayi veya büyük alımlar için <a href="${esc(teklifAdres(ctx))}" id="sp-kt">kurumsal teklif alın</a>.</p></div>`;
    const oz = $('#sp-oz', el); const git = $('#sp-git', el);
    const hesap = async () => {
      try {
        const q = await quote(ctx); if (!oz.isConnected) return; oz.innerHTML = ozetHtml(q, true);
        if (q.kurumsal) { git.innerHTML = `${icon('send')} Kurumsal teklif al`; git.href = teklifAdres(ctx, q); oz.insertAdjacentHTML('beforeend', `<p class="small muted mt">${icon('info')} Bu adet için fiyat teklifle belirlenir.</p>`); } else { git.innerHTML = `${icon('lock')} Ödemeye geç`; git.href = '#/odeme'; }
      } catch (e) { oz.innerHTML = `<p class="small" style="color:var(--err)">${icon('alert')} ${esc(e.message)}</p>`; git.href = '#/sepet'; if (e.status === 400 && ctx.cart().coupon) { ctx.cart().coupon = null; ctx.save(); yenile(); } }
    };
    on(kutu, 'change', '[name=sp]', (e, x) => { const ct = ctx.cart(); ct.support = x.value === P.varsayilan && !(P.paketler.find((p) => p.id === x.value) || {}).aylik ? null : x.value; ct.supportPeriod = ct.supportPeriod || 'aylik'; ctx.save(); yenile(); });
    if ($('#sp-do', kutu)) $('#sp-do', kutu).onchange = (e) => { ctx.cart().supportPeriod = e.target.value; ctx.save(); yenile(); };
    $('#sp-su', kutu).onchange = (e) => { ctx.cart().sube = Math.min(1000, Math.max(1, Math.floor(Number(e.target.value)) || 1)); ctx.save(); yenile(); };
    await hesap();
  }
  // Ödeme sayfası: özet sunucudan gelir, indirim özeti ve şube beyanı burada görünür
  async function odeme(el, ctx) {
    const oz = $('#od-oz', el); let q;
    try { q = await quote(ctx); } catch (e) { toast(e.message, 'err'); location.hash = '#/sepet'; return false; }
    if (q.kurumsal) { location.hash = '#/sepet'; return false; }
    oz.innerHTML = `${q.lines.map((l) => `<div class="list-item small"><span class="grow"><b>${esc(l.name)}</b><div class="faint">${l.type === 'support' ? '' : `${esc(ctx.planName(l.plan))} · `}${l.period === 'yillik' ? 'Yıllık' : 'Aylık'}${l.qty > 1 ? ` · ${l.qty} lisans` : ''}</div></span><b>${money(l.price)}</b></div>`).join('')}${ozetHtml({ ...q, lines: [] })}`;
    if (q.olcut.subeSayisi > 1) $('#od-beyan', el).innerHTML = `<label class="check small mt"><input type="checkbox" id="od-sube"> <span>Şube sayısını <b>${q.olcut.subeSayisi}</b> olarak beyan ediyorum. Bu beyan sipariş kaydına yazılır.</span></label>`;
    const pay = $('#pay', el); pay.disabled = !pay.dataset.acik; return true;
  }
  return { istek, sepet, odeme, paketKarti, slaRozet, indirimYazi, kalanYazi };
})();
