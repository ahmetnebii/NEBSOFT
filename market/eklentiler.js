/* NEBSOFT müşteri paneli: Eklenti Mağazası (#/eklentiler) ve İşletme Web Sitesi düzenleyicisi (#/websitem).
   market.js bu modülü ctx ile çağırır: { cloud() → /api/auth/me yanıtı veya null, addCart(pid), me() }.
   Web sitesi verisi bulutta /api/websitem'de, demo modunda bu tarayıcıda saklanır. Önizleme ve yayın aynı
   görüntüleyiciyi (core/bizsite.js) kullanır; kaydetmeden önce sunucu veriyi yeniden doğrular. */
(function () {
  'use strict';
  const NS = window.NS; const { esc, icon, money, toast, $, $$, on } = NS; const C = window.CATALOG; const B = window.BIZSITE;
  const ADD = () => C.addons || [];
  const LS = 'nebsoft:websitem';
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } };
  const lsSet = (v) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) { toast('Tarayıcı depolaması dolu: görselleri bağlantı olarak eklemeyi deneyin', 'err'); } };
  const active = (ctx, id) => { const cl = ctx.cloud(); return !!(cl && (cl.licenses || []).some((l) => l.product === id && l.valid)); };

  // Henüz satışa açılmamış eklenti: özellikleri ve neden kapalı olduğu görünür, satın alınamaz
  const soonCard = (a) => `<article class="ek-card soon" style="--ac:${a.accent}"><div class="ek-top"><span class="ek-ic">${icon(a.icon)}</span><span class="badge warn">${icon('clock')} Yakında</span></div><h3>${esc(a.name)}</h3><p>${esc(a.tagline)}</p><div class="ek-soon">${icon('info')}<span>${esc(a.soonNote || '')}</span></div><div class="ek-f"><div><b>${money(a.price).replace(',00', '')}</b><span>/ay + KDV · planlanan</span></div><button class="btn" data-notify="${a.id}">${icon('bell')} Hazır olunca haber ver</button></div></article>`;
  // ---------- Eklenti Mağazası ----------
  function store(el, ctx) {
    const cl = ctx.cloud();
    el.innerHTML = `<section class="sec ek" style="padding-top:40px"><div class="mk-wrap">
      <div class="sec-h" style="text-align:left;margin-bottom:26px"><span class="eyebrow">Eklenti Mağazası</span><h2>İhtiyacınız olanı ekleyin, aylık ödeyin</h2><p>Programınıza dilediğiniz zaman eklenti ekleyin veya bırakın. Taahhüt yok; eklenti süresi dolduğunda yalnızca o özellik kapanır, verileriniz kalır.</p></div>
      <div class="ek-free">${icon('heart')}<span>${esc(C.addonNote || '')}</span></div>
      <div class="ek-grid">${ADD().map((a) => { if (a.soon) return soonCard(a); const on1 = active(ctx, a.id); const need = a.requires && !active(ctx, a.requires) && !on1; return `<article class="ek-card${on1 ? ' on' : ''}" style="--ac:${a.accent}">
        <div class="ek-top"><span class="ek-ic">${icon(a.icon)}</span>${on1 ? `<span class="badge ok">${icon('check')} Etkin</span>` : ''}</div>
        <h3>${esc(a.name)}</h3><p>${esc(a.tagline)}</p>
        <ul>${a.features.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
        <div class="ek-f"><div><b>${money(a.price).replace(',00', '')}</b><span>/ay + KDV</span></div>
          ${on1 ? (a.id === 'eklenti-web' || a.id === 'eklenti-siparis' ? `<a class="btn primary" href="#/websitem">${icon('edit')} Siteyi düzenle</a>` : `<span class="small muted">Programınızın Entegrasyonlar sayfasından kurun</span>`)
            : `<button class="btn ${need ? '' : 'primary'}" data-add="${a.id}">${icon('cart')} ${need ? 'Web sitesiyle birlikte ekle' : 'Sepete ekle'}</button>`}</div>
        ${a.requires ? `<div class="small faint mt">${esc((ADD().find((x) => x.id === a.requires) || {}).name || '')} eklentisi gerektirir</div>` : ''}
        ${a.id === 'eklenti-web' && !on1 ? '<a class="small ek-try" href="#/websitem">Satın almadan önce sitenizi tasarlayıp önizleyin →</a>' : ''}</article>`; }).join('')}</div>
      ${!cl ? `<div class="card pad mt row" style="gap:12px">${icon('info')}<span class="grow small">Eklentiler bulut hesabınıza tanımlanır. Bu demo ortamında sepete ekleyip akışı inceleyebilirsiniz.</span></div>` : ''}
    </div></section>`;
    on(el, 'click', '[data-notify]', (e, b) => { try { const L = JSON.parse(localStorage.getItem('nebsoft:eklenti-haber') || '[]'); if (!L.includes(b.dataset.notify)) L.push(b.dataset.notify); localStorage.setItem('nebsoft:eklenti-haber', JSON.stringify(L)); } catch (x) { /* yok */ } const cl = ctx.cloud(); const u = cl && cl.user; if (u) NS.api('POST', '/api/leads', { name: u.name, phone: u.phone || (cl.tenant && cl.tenant.phone) || '', email: u.email, biz: cl.tenant ? cl.tenant.name : '', type: 'eklenti', product: b.dataset.notify, msg: 'Eklenti satışa açılınca haber verilsin' }).catch(() => {}); b.disabled = true; b.innerHTML = `${icon('check')} Listeye eklendiniz`; toast('Eklenti hazır olduğunda size haber vereceğiz', 'ok'); });
    on(el, 'click', '[data-add]', (e, b) => { const a = ADD().find((x) => x.id === b.dataset.add); if (a.requires && !active(ctx, a.requires)) ctx.addCart(a.requires); ctx.addCart(a.id); location.hash = '#/sepet'; });
  }

  // ---------- Web sitesi düzenleyici ----------
  async function builder(el, ctx) {
    const cl = ctx.cloud(); el.innerHTML = `<section class="sec" style="padding-top:30px"><div class="mk-wrap">${NS.skeleton ? NS.skeleton(4) : ''}</div></section>`;
    let srv = null, data, pub = false, domain = '', web = false, sip = false, slug = 'isletmeniz', dirty = false;
    try {
      if (cl) { srv = await NS.api('GET', '/api/websitem'); slug = srv.tenant.slug; web = srv.web; sip = srv.siparis; if (srv.site) { data = srv.site.data; pub = srv.site.published; domain = srv.site.domain; } else data = B.defaults(srv.tenant); }
      else { const l = lsGet(); data = l ? l.data : B.defaults({ name: (ctx.me() || {}).company || 'Lezzet Durağı', city: 'İstanbul', phone: '0212 000 00 00' }); domain = l ? l.domain || '' : ''; }
    } catch (e) { el.innerHTML = `<section class="sec"><div class="mk-wrap"><div class="card pad empty">${icon('alert')}<div>${esc(e.message)}</div></div></div></section>`; return; }
    data = B.clean(data);
    const url = cl ? `${location.origin}/t/${slug}/` : '';
    const TABS = [['tasarim', 'Tasarım', 'palette'], ['icerik', 'Slider & içerik', 'image'], ['urun', 'Ürünler & sipariş', 'bag'], ['iletisim', 'İletişim & saatler', 'clock'], ['seo', 'SEO & yayın', 'globe']];
    let tab = 'tasarim', device = 'pc', tmr, hz = null;
    // Arama hazırlığı: sunucu yayındaki sayfayı üretip okur (hz); formdaki alanlar BIZSITE.readiness ile anında yeniden hesaplanır
    const mctx = () => ({ sector: hz ? hz.sector : '', apps: hz ? hz.apps : (cl ? (cl.licenses || []).filter((l) => l.valid).map((l) => l.product) : []) });
    const loadHz = async () => { if (!cl) return; try { hz = await NS.api('GET', '/api/websitem/hazirlik'); } catch (e) { hz = null; } if (tab === 'seo') { drawChk(); typeOpt(); } };
    const typeOpt = () => { const o = $('[data-k="seo.type"] option[value=""]', el); if (o) o.textContent = `Otomatik (${B.BIZ_TYPES[B.bizType(B.clean({ ...data, seo: { ...data.seo, type: '' } }), mctx())][1]})`; };
    const drawChk = () => {
      const box = $('#wchk', el); if (!box) return; const r = B.readiness(data, mctx(), { published: pub, addon: web, live: hz && hz.live, domain }); const L = hz && hz.live;
      box.innerHTML = `<div class="wb-chk-h"><b>Arama hazırlığı</b><span>${r.done} / ${r.total}</span></div>${dirty ? `<div class="small muted">Kaydedilmemiş değişiklikler yayındaki sayfaya henüz yansımadı.</div>` : ''}<ul class="wb-chk">${r.items.map((x) => `<li class="${x.ok === true ? 'ok' : x.ok === null ? 'na' : 'no'}">${icon(x.ok === true ? 'check' : x.ok === null ? 'info' : 'x')}<div><b>${esc(x.label)}</b>${x.hint ? `<span>${esc(x.hint)}</span>` : ''}</div>${x.ok !== true && x.tab && x.tab !== 'seo' ? `<button type="button" class="btn sm ghost" data-wt="${x.tab}">Düzelt</button>` : ''}</li>`).join('')}</ul>
        ${L && L.sitemap ? `<div class="small muted">Site haritanız: <span class="mono">${esc(L.sitemap)}</span> (${L.urls} adres). Bu adresi Search Console’a siz eklersiniz.</div>` : ''}${!cl ? '<div class="small muted">Demo modunda site yayınlanmaz; yayın maddeleri bu yüzden eksik görünür.</div>' : ''}
        <div class="small muted">Bu liste sitenizin hazırlığını gösterir. Google’da çıkıp çıkmadığınızı ve sıranızı yalnızca Search Console gösterir; dizine alınma garanti edilemez.</div>`;
    };
    el.innerHTML = `<section class="wb"><header class="wb-h"><div class="wb-t"><a class="btn ghost sm" href="#/hesabim">${icon('left')}</a><div><b>Web sitem</b><span id="wst"></span></div></div>
        <div class="seg wb-dev"><button data-dev="pc" class="active">${icon('monitor')} Masaüstü</button><button data-dev="m">${icon('phone')} Telefon</button></div>
        <div class="row nw" style="gap:8px"><button class="btn" id="wsv">${icon('check')} Kaydet</button><button class="btn primary" id="wpb"></button></div></header>
      <div class="wb-b"><aside class="wb-side"><nav class="wb-tabs">${TABS.map(([k, l, i]) => `<button data-wt="${k}" class="${k === tab ? 'active' : ''}">${icon(i)}<span>${l}</span></button>`).join('')}</nav><div class="wb-form" id="wf"></div></aside>
        <div class="wb-stage"><div class="wb-frame pc" id="wfr"><div class="wb-bar"><i></i><i></i><i></i><span>${esc(domain || (url || 'isletmeniz.nebsoft.com.tr').replace(/^https?:\/\//, ''))}</span></div><iframe id="wif" title="Site önizlemesi" sandbox="allow-scripts allow-same-origin"></iframe></div></div></div></section>`;
    const status = () => { $('#wst', el).innerHTML = pub ? `<span class="dot ok"></span> Yayında${url ? ` · <a href="${esc(domain ? 'https://' + domain + '/' : url)}" target="_blank" rel="noopener">${esc((domain || url).replace(/^https?:\/\//, ''))}</a>` : ''}` : `<span class="dot"></span> Taslak${dirty ? ' · kaydedilmemiş değişiklik' : ''}`; $('#wpb', el).innerHTML = pub ? `${icon('eye')} Yayından kaldır` : `${icon('rocket')} Yayınla`; };
    const preview = () => { clearTimeout(tmr); tmr = setTimeout(() => { const f = $('#wif', el); const y = f.contentWindow ? f.contentWindow.scrollY : 0; f.srcdoc = B.render(data, { preview: true, orderable: data.mode === 'siparis', slug }); f.onload = () => { try { f.contentWindow.scrollTo(0, y); } catch (e) { /* yok */ } }; }, 250); };
    const touch = () => { dirty = true; status(); preview(); if (!cl) lsSet({ data, domain }); drawChk(); };
    const fld = (k, label, val, o = {}) => `<div class="field ${o.full === false ? '' : 'full'}"><label>${label}${o.help ? ` <span class="faint small">· ${o.help}</span>` : ''}</label>${o.area ? `<textarea class="input" rows="${o.rows || 4}" data-k="${k}" maxlength="${o.max || 3000}" placeholder="${esc(o.ph || '')}">${esc(val)}</textarea>` : `<input class="input" data-k="${k}" value="${esc(val)}" ${o.type ? `type="${o.type}"` : ''} maxlength="${o.max || 200}" placeholder="${esc(o.ph || '')}">`}</div>`;
    const imgF = (k, val, label) => `<div class="field full"><label>${label}</label><div class="wb-img">${val ? `<img src="${esc(val)}" alt="">` : `<span>${icon('image')}</span>`}<input class="input" data-k="${k}" value="${esc(/^data:/.test(val) ? '(yüklenen görsel)' : val)}" placeholder="https://… görsel bağlantısı"><button type="button" class="btn sm" data-up="${k}">${icon('upload')} Yükle</button>${val ? `<button type="button" class="btn sm ghost" data-clr="${k}">${icon('x')}</button>` : ''}</div></div>`;
    const getK = (k) => k.split('.').reduce((o, x) => (o == null ? o : o[x]), data);
    const setK = (k, v) => { const ps = k.split('.'); const last = ps.pop(); const o = ps.reduce((a, x) => a[x], data); o[last] = v; };
    const list = (key, items, render, addLabel, blank) => `<div class="wb-list">${items.map((it, i) => `<div class="wb-li"><div class="wb-li-h"><b>${i + 1}.</b><span class="grow">${esc(it.title || it.name || '')}</span><button type="button" class="btn ghost icon sm" data-mv="${key}|${i}|-1" title="Yukarı">${icon('up')}</button><button type="button" class="btn ghost icon sm" data-del="${key}|${i}" title="Sil">${icon('trash')}</button></div>${render(it, i)}</div>`).join('')}<button type="button" class="btn block" data-new="${key}" data-blank='${esc(JSON.stringify(blank))}'>${icon('plus')} ${addLabel}</button></div>`;
    const form = () => {
      const f = $('#wf', el); const d = data;
      if (tab === 'tasarim') f.innerHTML = `<h4>Şablon</h4><div class="wb-tpl">${Object.entries(B.TEMPLATES).map(([k, l]) => `<button type="button" data-tpl="${k}" class="${d.tpl === k ? 'on' : ''}"><span class="wb-tp t-${k}"><i></i><i></i><i></i></span><b>${esc(l.split(' — ')[0])}</b><small>${esc(l.split(' — ')[1])}</small></button>`).join('')}</div>
        <h4>Renkler</h4><div class="wb-colors">${['#4f46e5', '#0ea5e9', '#16a34a', '#e11d48', '#ea580c', '#7c3aed', '#0f172a', '#b45309'].map((c) => `<button type="button" data-col="${c}" style="background:${c}" class="${d.primary === c ? 'on' : ''}" aria-label="${c}"></button>`).join('')}<label class="wb-cc">Ana <input type="color" data-k="primary" value="${d.primary}"></label><label class="wb-cc">Vurgu <input type="color" data-k="accent" value="${d.accent}"></label></div>
        <div class="form-grid"><div class="field"><label>Yazı tipi</label><select class="input" data-k="font">${[['inter', 'Modern (Inter)'], ['serif', 'Zarif (Playfair)'], ['rounded', 'Yumuşak (Nunito)']].map(([v, l]) => `<option value="${v}" ${d.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="field"><label>Görünüm</label><select class="input" data-k="dark"><option value="0" ${d.dark ? '' : 'selected'}>Açık</option><option value="1" ${d.dark ? 'selected' : ''}>Koyu</option></select></div></div>
        ${imgF('logo', d.logo, 'Logo')}${fld('name', 'İşletme adı', d.name, { max: 120 })}${fld('slogan', 'Slogan', d.slogan, { max: 160 })}
        <h4>Bölümler</h4><div class="wb-sec">${Object.entries(B.SECTIONS).map(([k, l]) => `<label class="check"><input type="checkbox" data-sec="${k}" ${d.sections[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
      else if (tab === 'icerik') f.innerHTML = `<h4>Slider</h4><p class="small muted">Ana sayfanın en üstünde dönen büyük görseller. Yatay (16:9) ve en az 1600 px genişliğinde fotoğraflar en iyi sonucu verir.</p>${list('slides', d.slides, (s, i) => `${imgF(`slides.${i}.img`, s.img, 'Görsel')}${fld(`slides.${i}.title`, 'Başlık', s.title, { max: 90 })}${fld(`slides.${i}.text`, 'Alt metin', s.text, { max: 200 })}<div class="form-grid">${fld(`slides.${i}.cta`, 'Düğme yazısı', s.cta, { max: 30, full: false })}${fld(`slides.${i}.link`, 'Düğme bağlantısı', s.link, { max: 300, full: false, ph: '#iletisim veya https://…' })}</div>`, 'Slayt ekle', { img: '', title: 'Yeni slayt', text: '', cta: '', link: '' })}
        <h4>Kampanyalar</h4>${list('campaigns', d.campaigns, (c, i) => `${fld(`campaigns.${i}.title`, 'Başlık', c.title, { max: 90 })}${fld(`campaigns.${i}.text`, 'Açıklama', c.text, { area: true, rows: 2, max: 300 })}<div class="form-grid">${fld(`campaigns.${i}.badge`, 'Etiket', c.badge, { max: 20, full: false, ph: '%20' })}${fld(`campaigns.${i}.until`, 'Son gün', c.until, { type: 'date', full: false })}</div>${imgF(`campaigns.${i}.img`, c.img, 'Görsel')}`, 'Kampanya ekle', { title: 'Yeni kampanya', text: '', badge: '', img: '', until: '' })}
        <h4>Hakkımızda</h4>${fld('about', 'Metin', d.about, { area: true, rows: 6 })}`;
      else if (tab === 'urun') f.innerHTML = `<h4>Site türü</h4><div class="wb-mode"><button type="button" data-mode="vitrin" class="${d.mode === 'vitrin' ? 'on' : ''}">${icon('eye')}<b>Vitrin</b><small>Ürünler ve fiyatlar görünür, sipariş alınmaz</small></button><button type="button" data-mode="siparis" class="${d.mode === 'siparis' ? 'on' : ''}">${icon('bag')}<b>Online sipariş</b><small>Sepet ve sipariş formu; siparişler POS’a düşer</small></button></div>
        ${d.mode === 'siparis' ? `${cl && !sip ? `<div class="wb-warn">${icon('info')}<span>Siparişlerin alınması için <a href="#/eklentiler">Web Sitesinden Online Sipariş</a> eklentisi gerekir. O zamana kadar ziyaretçiler ürünleri vitrin olarak görür.</span></div>` : ''}<div class="form-grid">${fld('delivery.min', 'En az sipariş (₺)', d.delivery.min, { type: 'number', full: false })}${fld('delivery.fee', 'Teslimat ücreti (₺)', d.delivery.fee, { type: 'number', full: false })}</div>${fld('delivery.note', 'Sipariş notu', d.delivery.note, { max: 300 })}<p class="small muted">Gelen siparişler <b>Market POS → Online Siparişler</b> ekranında “Web siteniz” kanalıyla listelenir; e-posta ile de bildirilir.</p>` : ''}
        <h4>Ürünler <span class="faint small">(${d.products.length})</span></h4><div class="row mb" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" id="wimp">${icon('download')} Programımdaki ürünleri içe aktar</button></div>
        ${list('products', d.products, (p, i) => `<div class="form-grid">${fld(`products.${i}.name`, 'Ad', p.name, { max: 120, full: false })}${fld(`products.${i}.price`, 'Fiyat (₺)', p.price, { type: 'number', full: false })}${fld(`products.${i}.cat`, 'Kategori', p.cat, { max: 40, full: false })}</div>${fld(`products.${i}.desc`, 'Kısa açıklama', p.desc, { max: 300, help: 'en az 30 karakter yazarsanız bu hizmetin arama sonuçlarına açık kendi sayfası olur' })}${imgF(`products.${i}.img`, p.img, 'Görsel')}`, 'Ürün ekle', { id: '', name: 'Yeni ürün', price: 0, cat: '', desc: '', img: '' })}`;
      else if (tab === 'iletisim') f.innerHTML = `<h4>İletişim</h4><div class="form-grid">${fld('phone', 'Telefon', d.phone, { max: 30, full: false })}${fld('whatsapp', 'WhatsApp', d.whatsapp, { max: 30, full: false, ph: '05xx xxx xx xx' })}${fld('email', 'E-posta', d.email, { max: 120, full: false })}${fld('city', 'İl', d.city, { max: 60, full: false })}${fld('district', 'İlçe', d.district, { max: 60, full: false })}</div>${fld('address', 'Açık adres', d.address, { area: true, rows: 2, max: 300 })}${fld('mapQuery', 'Harita konumu', d.mapQuery, { help: 'boş bırakırsanız adres kullanılır', ph: 'Google Haritalar’daki işletme adı veya adres' })}
        <div class="form-grid">${fld('instagram', 'Instagram kullanıcı adı', d.instagram, { max: 60, full: false, ph: 'isletmeniz' })}${fld('facebook', 'Facebook sayfa adı', d.facebook, { max: 80, full: false })}</div>
        <h4>Çalışma saatleri</h4>${B.hoursReal(d) ? '' : `<div class="wb-warn">${icon('info')}<span>Bunlar hazır saatlerdir, sitenizde gösterilmez. Değiştirin veya doğruysa onaylayın.</span></div>`}<label class="check"><input type="checkbox" data-hok ${d.hoursOk ? 'checked' : ''}> Bu saatler doğru, yayınlansın</label><div class="wb-hours">${B.DAYS.map((g, i) => { const h = d.hours[i]; return `<div class="wb-hr"><b>${g}</b><label class="check"><input type="checkbox" data-hc="${i}" ${h.closed ? '' : 'checked'}> Açık</label><input class="input" type="time" data-k="hours.${i}.open" value="${h.open}" ${h.closed ? 'disabled' : ''}><span>–</span><input class="input" type="time" data-k="hours.${i}.close" value="${h.close}" ${h.closed ? 'disabled' : ''}></div>`; }).join('')}<button type="button" class="btn sm" id="wcp">${icon('copy')} Pazartesi saatlerini hafta içine uygula</button></div>`;
      else if (tab === 'seo') { const m = B.metaOf(d, mctx()); f.innerHTML = `<div class="wb-chkbox" id="wchk"></div><h4>Arama motoru (Google) görünümü</h4><div class="wb-serp"><small>${esc((domain || url || 'isletmeniz.nebsoft.com.tr').replace(/^https?:\/\//, ''))}</small><b>${esc(m.title)}</b><span>${esc(m.desc)}</span></div>
        <div class="field full"><label>İşletme türü <span class="faint small">· Google’a bildirilen tür</span></label><select class="input" data-k="seo.type"><option value=""></option>${Object.entries(B.BIZ_TYPES).filter(([k]) => k !== 'genel').map(([k, v]) => `<option value="${k}" ${d.seo.type === k ? 'selected' : ''}>${esc(v[1])}</option>`).join('')}</select></div>
        <div class="form-grid">${fld('city', 'İl', d.city, { max: 60, full: false })}${fld('district', 'İlçe', d.district, { max: 60, full: false })}</div>
        ${fld('seo.title', 'Sayfa başlığı', d.seo.title, { max: 70, help: 'boş bırakırsanız ad + hizmet + il/ilçe kullanılır', ph: m.title })}${fld('seo.desc', 'Açıklama', d.seo.desc, { area: true, rows: 3, max: 170, help: '150–160 karakter' })}${fld('seo.keywords', 'Anahtar kelimeler', d.seo.keywords, { max: 200, ph: 'fırın, pastane, kadıköy' })}
        <h4>Google</h4>${fld('seo.gbp', 'Google İşletme Profili bağlantısı', d.seo.gbp, { max: 300, ph: 'https://maps.app.goo.gl/… veya https://g.page/…' })}${fld('seo.gsc', 'Search Console doğrulama kodu', d.seo.gsc, { max: 300, help: 'HTML etiketi yöntemi; etiketin tamamını da yapıştırabilirsiniz', ph: '<meta name="google-site-verification" content="…">' })}
        <h4>Adres</h4><div class="wb-addr"><div><b>NEBSOFT adresiniz</b><span>${esc(url || `${location.origin}/t/isletmeniz/`)}</span></div>${url ? `<button type="button" class="btn sm" id="wcu">${icon('copy')} Kopyala</button>` : ''}</div>
        ${fld('_domain', 'Kendi alan adınız (isteğe bağlı)', domain, { max: 190, ph: 'www.isletmeniz.com' })}
        <details class="wb-help"><summary>${icon('info')} Kendi alan adımı nasıl bağlarım?</summary><ol><li>Alan adınızı aldığınız firmanın (ör. GoDaddy, Natro, İsimtescil) <b>DNS yönetimi</b> sayfasını açın.</li><li><b>www</b> için bir <b>CNAME</b> kaydı ekleyin; hedef olarak <b>${esc(location.host)}</b> yazın. Kök alan adı (isletmeniz.com) için firmanızın “yönlendirme / forwarding” özelliğiyle www adresine yönlendirin.</li><li>Yukarıdaki kutuya <b>www.isletmeniz.com</b> yazıp kaydedin. DNS değişikliğinin yayılması birkaç saat sürebilir.</li><li>Sunucunuzda bu alan adı için SSL sertifikası (https) tanımlı olmalıdır; NEBSOFT bulut kurulumunda bu adım sistem yöneticisi tarafından yapılır.</li></ol></details>
        <details class="wb-help"><summary>${icon('map')} Google İşletme Profili rehberi</summary><ol><li><a href="https://www.google.com/business/" target="_blank" rel="noopener">google.com/business</a> adresinden Google hesabınızla giriş yapıp işletmenizi ekleyin veya mevcut kaydı sahiplenin.</li><li>İşletme adı, kategori, adres ve telefonu bu sitedekiyle <b>birebir aynı</b> yazın (tutarlılık sıralamaya yardımcı olur).</li><li>Google’ın sunduğu yöntemle (telefon, e-posta, video vb.) doğrulamayı tamamlayın.</li><li>Profilin <b>Web sitesi</b> alanına site adresinizi ekleyin; çalışma saatlerinizi ve fotoğraflarınızı girin.</li><li>Search Console’a site adresinizi ekleyin, “HTML etiketi” yöntemindeki kodu yukarıdaki alana yapıştırıp kaydedin, sonra Search Console’da <b>Doğrula</b>’ya basın ve site haritası adresini gönderin.</li></ol></details>`; drawChk(); typeOpt(); }
    };
    const redraw = () => { form(); $$('[data-wt]', el).forEach((b) => b.classList.toggle('active', b.dataset.wt === tab)); };
    // Olaylar
    el.addEventListener('input', (e) => {
      const t = e.target; const k = t.dataset.k; if (!k) return;
      if (k === '_domain') { domain = t.value.trim(); dirty = true; status(); if (!cl) lsSet({ data, domain }); drawChk(); return; }
      if (/\.img$|^logo$/.test(k) && t.value === '(yüklenen görsel)') return;
      let v = t.value; if (t.type === 'number') v = Number(v) || 0; if (k === 'dark') v = v === '1';
      setK(k, v); if (/^hours\./.test(k)) data.hoursOk = true; touch();
      const li = t.closest('.wb-li'); if (li && /\.(title|name)$/.test(k)) li.querySelector('.wb-li-h span').textContent = v;
      if (tab === 'seo') { const sp = $('.wb-serp', el); const m = B.metaOf(data, mctx()); sp.querySelector('b').textContent = m.title; sp.querySelector('span').textContent = m.desc; }
    });
    el.addEventListener('change', (e) => { const t = e.target; if (t.dataset.sec) { data.sections[t.dataset.sec] = t.checked; touch(); } if (t.dataset.hc) { data.hours[t.dataset.hc].closed = !t.checked; data.hoursOk = true; touch(); form(); } if ('hok' in t.dataset) { data.hoursOk = t.checked; touch(); form(); } if (t.tagName === 'SELECT' && t.dataset.k) { setK(t.dataset.k, t.dataset.k === 'dark' ? t.value === '1' : t.value); touch(); } if (/\.img$|^logo$/.test(t.dataset.k || '')) form(); });
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.wt) { tab = b.dataset.wt; redraw(); return; }
      if (b.dataset.dev) { device = b.dataset.dev; $$('[data-dev]', el).forEach((x) => x.classList.toggle('active', x === b)); $('#wfr', el).className = 'wb-frame ' + device; return; }
      if (b.dataset.tpl) { data.tpl = b.dataset.tpl; if (b.dataset.tpl === 'zarif' && data.font === 'inter') data.font = 'serif'; touch(); form(); return; }
      if (b.dataset.col) { data.primary = b.dataset.col; touch(); form(); return; }
      if (b.dataset.mode) { data.mode = b.dataset.mode; touch(); form(); return; }
      if (b.dataset.new) { const arr = getK(b.dataset.new); arr.push({ ...JSON.parse(b.dataset.blank), ...(b.dataset.new === 'products' ? { id: NS.uid() } : {}) }); touch(); form(); const ls = $$('.wb-li', el); if (ls.length) ls[ls.length - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      if (b.dataset.del) { const [k, i] = b.dataset.del.split('|'); getK(k).splice(Number(i), 1); touch(); form(); return; }
      if (b.dataset.mv) { const [k, i] = b.dataset.mv.split('|'); const a = getK(k); const n = Number(i); if (n > 0) { [a[n - 1], a[n]] = [a[n], a[n - 1]]; touch(); form(); } return; }
      if (b.dataset.clr) { setK(b.dataset.clr, ''); touch(); form(); return; }
      if (b.dataset.up) { const k = b.dataset.up; const u = await pickImage(k === 'logo' ? 400 : 1600); if (u) { setK(k, u); touch(); form(); } return; }
      if (b.id === 'wcp') { const m = data.hours[0]; for (let i = 1; i < 5; i++) data.hours[i] = { ...m }; data.hoursOk = true; touch(); form(); return; }
      if (b.id === 'wcu') { try { await navigator.clipboard.writeText(url); toast('Kopyalandı', 'ok'); } catch (x) { NS.prompt('Site adresiniz', url); } return; }
      if (b.id === 'wimp') { importProducts(ctx).then((ps) => { if (!ps) return; const have = new Set(data.products.map((p) => p.name.toLocaleLowerCase('tr'))); const add = ps.filter((p) => !have.has(p.name.toLocaleLowerCase('tr'))); data.products.push(...add.slice(0, 300 - data.products.length)); touch(); form(); toast(`${add.length} ürün eklendi`, 'ok'); }); return; }
      if (b.id === 'wsv' || b.id === 'wpb') {
        const want = b.id === 'wpb' ? !pub : pub;
        if (!cl) { lsSet({ data, domain }); dirty = false; status(); if (b.id === 'wpb') toast('Demo modunda yayınlanmaz. Bulut hesabınızda “İşletme Web Sitesi” eklentisiyle tek tıkla yayınlanır.', 'err'); else toast('Taslak bu tarayıcıya kaydedildi', 'ok'); return; }
        b.disabled = true;
        try { await NS.api('PUT', '/api/websitem', { data, published: want, domain }); pub = want; dirty = false; status(); loadHz(); toast(b.id === 'wpb' ? (pub ? 'Siteniz yayında 🎉' : 'Site yayından kaldırıldı') : 'Kaydedildi', 'ok'); }
        catch (x) { if (x.status === 402) { await NS.api('PUT', '/api/websitem', { data, published: false, domain }).catch(() => {}); dirty = false; status(); const go = await NS.confirm(x.message, { title: 'Eklenti gerekli', ok: 'Eklenti Mağazası’na git', danger: false }); if (go) location.hash = '#/eklentiler'; } else toast(x.message, 'err'); }
        b.disabled = false;
      }
    });
    window.addEventListener('beforeunload', (e) => { if (dirty && cl && location.hash.startsWith('#/websitem')) { e.preventDefault(); e.returnValue = ''; } });
    status(); redraw(); preview(); loadHz();
  }
  // Görsel seç → tarayıcıda küçült (JPEG/WebP), veri adresi olarak sakla
  function pickImage(max) {
    return new Promise((res) => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
      i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = 0.82, u = c.toDataURL('image/jpeg', q); while (u.length > 400000 && q > 0.4) { q -= 0.12; u = c.toDataURL('image/jpeg', q); } if (u.length > 400000) { toast('Görsel çok büyük; daha küçük bir görsel seçin', 'err'); return res(null); } res(u); }; im.onerror = () => res(null); im.src = r.result; }; r.readAsDataURL(f); };
      i.click();
    });
  }
  // Programdaki ürünler: POS, butik, eczane, toptan, e-ticaret (bulutta lisanslı olanlar, demoda bu tarayıcıdakiler)
  async function importProducts(ctx) {
    const APPS = ['pos', 'butik', 'eticaret', 'toptan', 'eczane']; const cl = ctx.cloud(); const out = []; let sampleOnly = false;
    for (const a of APPS) {
      let d = null;
      if (cl) { if (!(cl.licenses || []).some((l) => l.product === a && l.valid)) continue; try { d = (await NS.api('GET', '/api/data/' + a)).data; } catch (e) { continue; } }
      else { try { d = JSON.parse(localStorage.getItem('nebsoft:' + a)); } catch (e) { d = null; } }
      const ps = d && (d.products || d.urunler); if (!Array.isArray(ps)) continue; if (d._meta && d._meta.sample) { sampleOnly = true; continue; }
      const cats = Object.fromEntries((d.cats || d.categories || []).map((c) => [c.id, c.name]));
      ps.slice(0, 300).forEach((p) => { if (p && p.name) out.push({ id: NS.uid(), name: String(p.name).slice(0, 120), price: Number(p.price) || 0, cat: cats[p.cat] || '', desc: '', img: /^https:/.test(p.image || '') ? p.image : '' }); });
      if (out.length) break;
    }
    if (!out.length) { toast(sampleOnly ? 'Programınızda yalnızca örnek ürünler var. Örnek veriler sitenize aktarılmaz: önce kendi ürünlerinizi girin.' : cl ? 'İçe aktarılacak ürün bulunamadı (Market POS, Butik, E-Ticaret, Toptan veya Eczane programında ürün olmalı)' : 'Bu tarayıcıda ürün bulunamadı. Önce Market POS demosunu açın.', 'err'); return null; }
    return (await NS.confirm(`${out.length} ürün bulundu. Sitenize eklensin mi? (Aynı adlı ürünler atlanır.)`, { title: 'Ürünleri içe aktar', ok: 'Ekle', danger: false })) ? out : null;
  }
  window.NB_EK = { store, builder };
})();
