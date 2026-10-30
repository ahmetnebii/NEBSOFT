/* NEBSOFT işletme web sitesi — tek kaynaktan görüntüleme (sunucuda yayın, tarayıcıda canlı önizleme).
   BIZSITE.render(data, ctx) tam bir HTML belgesi döndürür: SEO etiketleri, Open Graph, schema.org LocalBusiness,
   slider, kampanyalar, ürün vitrini (isteğe bağlı sepet + sipariş), hakkımızda, çalışma saatleri, harita, iletişim.
   BIZSITE.clean(data) kullanıcıdan gelen veriyi doğrular (sunucu kaydetmeden önce çağırır). */
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.BIZSITE = m; })(this, function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const SDAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TEMPLATES = { modern: 'Modern — tam ekran slider, yumuşak kartlar', zarif: 'Zarif — serif başlıklar, sakin ve şık', canli: 'Canlı — renkli bloklar, iddialı tipografi' };
  const FONTS = { inter: ['Inter', 'Inter:wght@400;500;600;700;800'], serif: ['Playfair Display', 'Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600'], rounded: ['Nunito', 'Nunito:wght@400;600;700;800'] };
  const SECTIONS = { slider: 'Slider', campaigns: 'Kampanyalar', products: 'Ürünler / hizmetler', about: 'Hakkımızda', hours: 'Çalışma saatleri', map: 'Harita', contact: 'İletişim' };
  // İşletme türü → schema.org türü, görünen ad, sayfa türü (s: hizmet, p: ürün), sektör metni kalıbı, program kimlikleri.
  // Türler schema.org v30.1 sözlüğünden denetlendi. VeterinaryCare ve EducationalOrganization LocalBusiness alt türü DEĞİLDİR; bu yüzden dizi olarak yazılır.
  const BIZ_TYPES = {
    genel: ['LocalBusiness', 'İşletme', 's', null, []],
    kuafor: ['HairSalon', 'Kuaför ve berber', 's', /kuaför|berber/, []],
    guzellik: ['BeautySalon', 'Güzellik merkezi', 's', /güzellik/, []],
    tirnak: ['NailSalon', 'Tırnak stüdyosu', 's', /tırnak/, []],
    restoran: ['Restaurant', 'Restoran', 's', /restoran|lokanta/, ['adisyon']],
    kafe: ['CafeOrCoffeeShop', 'Kafe', 's', /kafe|kahve/, []],
    pastane: ['Bakery', 'Pastane ve fırın', 'p', /pastane|fırın/, []],
    fastfood: ['FastFoodRestaurant', 'Hızlı yemek', 's', /fast food/, []],
    dis: ['Dentist', 'Diş kliniği', 's', /diş/, []],
    klinik: ['MedicalClinic', 'Klinik', 's', /klinik|fizik tedavi|fizyoterapi/, ['klinik']],
    hekim: ['Physician', 'Muayenehane', 's', /muayenehane|doktor|hekim/, []],
    veteriner: [['VeterinaryCare', 'LocalBusiness'], 'Veteriner kliniği', 's', /veteriner|pet (otel|kuaför)/, ['veteriner']],
    emlak: ['RealEstateAgent', 'Emlak ofisi', 's', /emlak|gayrimenkul/, ['emlak']],
    otoservis: ['AutoRepair', 'Oto servis', 's', /oto tamir|kaporta|oto elektrik|lastik|yağ değişim|motosiklet servis/, ['otoservis', 'oto']],
    galeri: ['AutoDealer', 'Oto galeri', 'p', /galeri|otomotiv plaza/, ['galeri']],
    rentacar: ['AutoRental', 'Araç kiralama', 's', /rent a car|karavan|araç kiralama/, ['kiralama']],
    otel: ['Hotel', 'Otel ve konaklama', 's', /otel|pansiyon|apart|bungalov|hostel/, ['otel']],
    spor: ['ExerciseGym', 'Spor salonu', 's', /fitness|pilates|yoga|dövüş|yüzme/, ['spor']],
    eczane: ['Pharmacy', 'Eczane', 'p', /eczane/, ['eczane']],
    market: ['GroceryStore', 'Market', 'p', /market|bakkal|şarküteri/, []],
    butik: ['ClothingStore', 'Giyim mağazası', 'p', /butik|giyim|ayakkabı/, ['butik']],
    kuyumcu: ['JewelryStore', 'Kuyumcu', 'p', /kuyumcu|altın|gümüş/, ['kuyumcu']],
    magaza: ['Store', 'Mağaza', 'p', /mağaza|kırtasiye|petshop|elektronik/, ['pos', 'eticaret']],
    toptan: ['WholesaleStore', 'Toptan satış', 'p', /toptan|distribütör|bayi/, ['toptan']],
    hukuk: ['LegalService', 'Hukuk bürosu', 's', /avukat|hukuk|arabulucu/, ['hukuk']],
    musavir: ['AccountingService', 'Mali müşavir ve muhasebe', 's', /müşavir|muhasebe|ymm/, ['musavir']],
    anaokulu: ['ChildCare', 'Anaokulu ve kreş', 's', /anaokul|kreş|gündüz bakım/, ['anaokulu']],
    kurs: [['EducationalOrganization', 'LocalBusiness'], 'Kurs ve eğitim merkezi', 's', /kurs|dershane|etüt|okulu/, ['kurs']],
    profesyonel: ['ProfessionalService', 'Profesyonel hizmet', 's', /danışmanlık|ajans|yazılım|yönetim şirketi/, ['site']],
    etkinlik: ['EntertainmentBusiness', 'Etkinlik ve eğlence', 's', /konser|tiyatro|stand-up|festival/, ['bilet']],
  };
  const defaults = (t = {}) => ({
    tpl: 'modern', primary: '#4f46e5', accent: '#f59e0b', dark: false, font: 'inter', mode: 'vitrin',
    name: t.name || 'İşletmem', slogan: 'Kaliteli hizmet, güler yüz', logo: '', about: `${t.name || 'İşletmemiz'} olarak müşterilerimize en iyi hizmeti sunmak için çalışıyoruz.`,
    phone: t.phone || '', whatsapp: '', email: '', address: t.address || '', city: t.city || '', district: '', mapQuery: '', instagram: '', facebook: '',
    hours: DAYS.map((d, i) => ({ open: '09:00', close: i === 6 ? '17:00' : '19:00', closed: i === 6 })), hoursOk: false,
    slides: [{ img: '', title: t.name || 'Hoş geldiniz', text: 'Size özel kampanyalar ve ürünlerimizi keşfedin', cta: 'Bize ulaşın', link: '#iletisim' }],
    campaigns: [], products: [], delivery: { min: 0, fee: 0, note: 'Siparişiniz onaylandığında sizi arayacağız. Ödeme kapıda.' },
    seo: { title: '', desc: '', keywords: '', type: '', gbp: '', gsc: '' }, sections: Object.fromEntries(Object.keys(SECTIONS).map((k) => [k, true])),
  });
  // ---------- Doğrulama ----------
  const str = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const img = (v) => { v = String(v || '').trim(); if (/^https:\/\/[^\s"'<>]{4,600}$/.test(v)) return v; if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(v) && v.length < 420000) return v; return ''; };
  const color = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : d);
  const time = (v, d) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) ? String(v) : d);
  const url = (v) => { v = str(v, 300); return /^(https:\/\/|#|tel:|mailto:)/.test(v) ? v : ''; };
  const money = (v) => Math.max(0, Math.round(Number(v) * 100) / 100 || 0);
  // Google İşletme Profili bağlantısı: yalnızca Google'ın kısa/uzun profil adresleri
  const gbpUrl = (v) => { v = str(v, 300); try { const u = new URL(v); return u.protocol === 'https:' && /^(?:[a-z0-9-]+\.)*(?:google\.com(?:\.tr)?|g\.page|goo\.gl|share\.google|g\.co)$/i.test(u.hostname) ? v : ''; } catch (e) { return ''; } };
  // Search Console doğrulama kodu: kullanıcı meta etiketinin tamamını yapıştırsa da yalnızca kod alınır
  const gscCode = (v) => { v = str(v, 300); const m = /content\s*=\s*["']([^"']+)["']/i.exec(v); const c = m ? m[1].trim() : v; return /^[\w-]{10,100}$/.test(c) ? c : ''; };
  function clean(d) {
    d = d && typeof d === 'object' ? d : {}; const D = defaults();
    return {
      tpl: TEMPLATES[d.tpl] ? d.tpl : 'modern', primary: color(d.primary, D.primary), accent: color(d.accent, D.accent), dark: !!d.dark, font: FONTS[d.font] ? d.font : 'inter', mode: d.mode === 'siparis' ? 'siparis' : 'vitrin',
      name: str(d.name, 120) || D.name, slogan: str(d.slogan, 160), logo: img(d.logo), about: str(d.about, 3000),
      phone: str(d.phone, 30), whatsapp: str(d.whatsapp, 30).replace(/[^\d+]/g, ''), email: /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(str(d.email, 120)) ? str(d.email, 120) : '',
      address: str(d.address, 300), city: str(d.city, 60), district: str(d.district, 60), mapQuery: str(d.mapQuery, 200), instagram: str(d.instagram, 60).replace(/^@/, '').replace(/[^\w.]/g, ''), facebook: str(d.facebook, 80).replace(/[^\w.-]/g, ''),
      hours: DAYS.map((x, i) => { const h = (Array.isArray(d.hours) && d.hours[i]) || D.hours[i]; return { open: time(h.open, '09:00'), close: time(h.close, '19:00'), closed: !!h.closed }; }), hoursOk: !!d.hoursOk,
      slides: (Array.isArray(d.slides) ? d.slides : []).slice(0, 6).map((s) => ({ img: img(s.img), title: str(s.title, 90), text: str(s.text, 200), cta: str(s.cta, 30), link: url(s.link) })),
      campaigns: (Array.isArray(d.campaigns) ? d.campaigns : []).slice(0, 12).map((c) => ({ title: str(c.title, 90), text: str(c.text, 300), badge: str(c.badge, 20), img: img(c.img), until: /^\d{4}-\d{2}-\d{2}$/.test(c.until) ? c.until : '' })).filter((c) => c.title),
      products: (Array.isArray(d.products) ? d.products : []).slice(0, 300).map((p, i) => ({ id: str(p.id, 24) || 'p' + i, name: str(p.name, 120), price: money(p.price), img: img(p.img), desc: str(p.desc, 300), cat: str(p.cat, 40) })).filter((p) => p.name),
      delivery: { min: money(d.delivery && d.delivery.min), fee: money(d.delivery && d.delivery.fee), note: str(d.delivery && d.delivery.note, 300) },
      seo: { title: str(d.seo && d.seo.title, 70), desc: str(d.seo && d.seo.desc, 170), keywords: str(d.seo && d.seo.keywords, 200), type: d.seo && BIZ_TYPES[d.seo.type] ? d.seo.type : '', gbp: gbpUrl(d.seo && d.seo.gbp), gsc: gscCode(d.seo && d.seo.gsc) },
      sections: Object.fromEntries(Object.keys(SECTIONS).map((k) => [k, !(d.sections && d.sections[k] === false)])),
    };
  }
  const tl = (n) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₺';
  const initial = (s) => esc(String(s || '?').trim().charAt(0).toLocaleUpperCase('tr'));
  // ---------- Arama motoru kuralları ----------
  // Yayınlanmayacak dolgu metinler: defaults() ile gelen, işletmenin yazmadığı içerik
  const FILLER_ABOUT = /olarak müşterilerimize en iyi hizmeti sunmak için çalışıyoruz\.?$/;
  const FILLER_SLOGAN = 'Kaliteli hizmet, güler yüz'; const FILLER_SLIDE = 'Size özel kampanyalar ve ürünlerimizi keşfedin';
  const NAME_FAKE = /^(işletmem|işletmeniz|örnek işletme|deneme|demo|test)$|^(demo|test) /;
  const fakeName = (s) => NAME_FAKE.test(String(s || '').trim().toLocaleLowerCase('tr'));
  const fakePhone = (p) => { const x = String(p || '').replace(/\D/g, ''); return x.length < 10 || /0{6,}$/.test(x) || /(\d)\1{6,}/.test(x) || /1234567/.test(x); };
  const publicView = (d) => ({ ...d, about: FILLER_ABOUT.test(d.about) ? '' : d.about, slogan: d.slogan === FILLER_SLOGAN ? '' : d.slogan, phone: fakePhone(d.phone) ? '' : d.phone, whatsapp: fakePhone(d.whatsapp) ? '' : d.whatsapp, slides: d.slides.map((s) => ({ ...s, title: s.title === 'Hoş geldiniz' ? '' : s.title, text: s.text === FILLER_SLIDE ? '' : s.text })) });
  // Saatler: işletme onayladıysa ya da hazır değerleri değiştirdiyse gerçektir (eski kayıtlarda hoursOk yoktur)
  const DEF_HOURS = JSON.stringify(defaults().hours);
  const hoursReal = (d) => !!d.hoursOk || JSON.stringify(d.hours) !== DEF_HOURS;
  const slugify = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
  const telE164 = (p) => { let x = String(p || '').replace(/[^\d+]/g, ''); if (x.startsWith('+')) return x; x = x.replace(/^0/, '').replace(/^90(?=\d{10}$)/, ''); return x.length === 10 ? '+90' + x : ''; };
  const place = (d) => [d.district, d.city].filter(Boolean).join(', ');
  const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n - 1); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 30)).replace(/[\s,;:.—-]+$/, '') + '…'; };
  const MIN_DESC = 30; const MIN_ABOUT = 80; // bu uzunluğun altındaki metin arama sonucu için zayıf sayılır
  // Yayınlanan hizmet/ürünler: bölüm kapalıysa hiçbiri. strong: kendi sayfası dizine girecek kadar özgün içeriği var
  function services(d) {
    if (!d.sections.products) return []; const seen = new Set();
    return d.products.map((p, i) => { const b = slugify(p.name) || 'hizmet-' + (i + 1); let s = b, n = 2; while (seen.has(s)) s = `${b}-${n++}`; seen.add(s); return { ...p, slug: s, strong: p.desc.length >= MIN_DESC }; });
  }
  // Tür önceliği: işletmenin seçimi → kayıttaki sektör metni → lisanslı program → genel
  function bizType(d, ctx = {}) {
    if (d.seo.type) return d.seo.type; const sec = String(ctx.sector || '').toLocaleLowerCase('tr');
    if (sec) { const hit = Object.keys(BIZ_TYPES).find((k) => BIZ_TYPES[k][3] && BIZ_TYPES[k][3].test(sec)); if (hit) return hit; }
    return Object.keys(BIZ_TYPES).find((k) => (ctx.apps || []).some((a) => BIZ_TYPES[k][4].includes(a))) || 'genel';
  }
  // Sayfa başlığı ve açıklaması: işletme yazdıysa o; yazmadıysa gerçek alanlardan üretilir (ad + hizmet + il/ilçe)
  function metaOf(raw, ctx = {}) {
    const d = publicView(clean(raw)); const key = bizType(d, ctx); const label = key === 'genel' ? '' : BIZ_TYPES[key][1]; const loc = place(d); const sv = services(d);
    const what = label || (sv[0] && (sv[0].cat || sv[0].name)) || d.slogan;
    const title = d.seo.title || cut([d.name, what, loc].filter(Boolean).join(' · '), 70);
    const list = sv.slice(0, 4).map((p) => p.name).join(', ');
    const desc = d.seo.desc || cut([[d.name, loc, label].filter(Boolean).join(' · '), list, d.slogan, d.about].filter(Boolean).join('. '), 160);
    return { title, desc, type: key, label: BIZ_TYPES[key][1] };
  }
  // Dizine girsin mi? Gerekçeler kullanıcıya gösterilir ve testlerde denetlenir
  function seoCheck(raw, ctx = {}) {
    const d = publicView(clean(raw)); const S = d.sections; const why = [];
    if (fakeName(d.name)) why.push('İşletme adı gerçek bir ad değil');
    if (!((S.contact || S.map) && (d.address || d.city || d.district))) why.push('Adres veya il/ilçe yayında değil');
    if (!(S.contact && (d.phone || d.whatsapp || d.email))) why.push('Telefon, WhatsApp veya e-posta yayında değil');
    const strong = services(d).filter((p) => p.strong).length;
    if (!((S.about && d.about.length >= MIN_ABOUT) || strong >= 2)) why.push(`İçerik zayıf: en az ${MIN_ABOUT} karakterlik Hakkımızda metni ya da açıklamalı 2 hizmet gerekir`);
    return { index: !why.length && !ctx.preview, reasons: why };
  }
  // İşletme site haritası: yalnızca dizine girecek adresler (noindex sayfa haritaya yazılmaz)
  function sitemapUrls(raw, ctx = {}) { const d = publicView(clean(raw)); if (!ctx.url || !seoCheck(d, ctx).index) return []; return [ctx.url, ...services(d).filter((p) => p.strong).map((p) => `${ctx.url}hizmet/${p.slug}/`)]; }
  // İşletme bilgisi şeması: yalnızca yayında olan bölümlerin alanları
  function bizSchema(d, S, ctx, o) {
    const key = bizType(d, ctx); const hasAddr = (S.contact || S.map) && (d.address || d.city || d.district); const sv = S.products ? services(d).filter((p) => p.price > 0).slice(0, 30) : [];
    return { '@context': 'https://schema.org', '@type': BIZ_TYPES[key][0], '@id': ctx.url ? ctx.url + '#isletme' : undefined, name: d.name, description: o.desc || undefined, url: ctx.url || undefined, telephone: (S.contact && telE164(d.phone)) || undefined, email: (S.contact && d.email) || undefined, image: o.img && /^https:/.test(o.img) ? o.img : undefined,
      address: hasAddr ? { '@type': 'PostalAddress', streetAddress: d.address || undefined, addressLocality: d.district || d.city || undefined, addressRegion: d.district ? d.city || undefined : undefined, addressCountry: 'TR' } : undefined,
      openingHoursSpecification: S.hours ? d.hours.map((h, i) => (h.closed ? null : { '@type': 'OpeningHoursSpecification', dayOfWeek: SDAY[i], opens: h.open, closes: h.close })).filter(Boolean) : undefined,
      hasOfferCatalog: sv.length ? { '@type': 'OfferCatalog', name: 'Hizmetler ve fiyatlar', itemListElement: sv.map((p) => ({ '@type': 'Offer', price: p.price, priceCurrency: 'TRY', itemOffered: { '@type': BIZ_TYPES[key][2] === 'p' ? 'Product' : 'Service', name: p.name } })) } : undefined,
      sameAs: [d.instagram && `https://www.instagram.com/${d.instagram}/`, d.facebook && `https://www.facebook.com/${d.facebook}`, d.seo.gbp].filter(Boolean) };
  }
  const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
  // Belge başı: ana sayfa ve hizmet sayfaları aynı etiketleri kullanır
  const headOf = (d, F, o) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><meta name="robots" content="${o.index ? 'index,follow' : 'noindex,follow'}">${d.seo.keywords ? `<meta name="keywords" content="${esc(d.seo.keywords)}">` : ''}${o.url ? `<link rel="canonical" href="${esc(o.url)}">` : ''}${o.gsc ? `<meta name="google-site-verification" content="${esc(o.gsc)}">` : ''}<meta name="theme-color" content="${d.primary}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(d.name)}"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}">${o.url ? `<meta property="og:url" content="${esc(o.url)}">` : ''}${o.img && /^https:/.test(o.img) ? `<meta property="og:image" content="${esc(o.img)}">` : ''}<meta property="og:locale" content="tr_TR">
<link rel="icon" href="${d.logo && /^https:/.test(d.logo) ? esc(d.logo) : '/assets/favicon.svg'}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${F[1]}&display=swap">
${o.schemas.map(ld).join('')}<style>${cssOf(d, F)}</style></head><body class="t-${d.tpl}">`;
  const footOf = (d, ctx) => `<footer class="ft"><div class="w"><span>© ${new Date().getFullYear()} ${esc(d.name)}</span><span>Bu site <a href="${esc(ctx.ref || '/')}">NEBSOFT</a> ile hazırlandı</span></div></footer>`;
  // Hizmet/ürün sayfası: /hizmet/<slug>/ — betiksiz, tam HTML. Bulunamazsa null
  function renderService(raw, slug, ctx = {}) {
    const d = publicView(clean(raw)); const S = { ...d.sections, hours: d.sections.hours && hoursReal(d) }; const all = services(d); const p = all.find((x) => x.slug === slug); if (!p) return null;
    const F = FONTS[d.font]; const key = bizType(d, ctx); const m = metaOf(d, ctx); const loc = place(d); const tel = d.phone.replace(/[^\d+]/g, ''); const url = ctx.url ? `${ctx.url}hizmet/${p.slug}/` : '';
    const title = cut(`${p.name} · ${d.name}${loc ? ' · ' + loc : ''}`, 70); const desc = cut([p.desc, `${d.name}${loc ? ', ' + loc : ''}`, p.price ? tl(p.price) : ''].filter(Boolean).join('. '), 160); const img = p.img || d.logo;
    const offer = p.price ? { '@type': 'Offer', price: p.price, priceCurrency: 'TRY', url: url || undefined } : undefined; const kind = BIZ_TYPES[key][2] === 'p' ? 'Product' : 'Service';
    const item = { '@context': 'https://schema.org', '@type': kind, name: p.name, description: p.desc || undefined, category: p.cat || undefined, image: /^https:/.test(p.img) ? p.img : undefined, offers: offer, ...(kind === 'Service' ? { provider: { '@id': ctx.url ? ctx.url + '#isletme' : undefined, name: d.name } } : {}) };
    const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: d.name, item: ctx.url || undefined }, { '@type': 'ListItem', position: 2, name: p.name, item: url || undefined }] };
    const others = all.filter((x) => x.strong && x.slug !== p.slug).slice(0, 6);
    return `${headOf(d, F, { title, desc, url, img, index: p.strong && seoCheck(d, ctx).index, schemas: [bizSchema(d, S, ctx, { desc: m.desc, img: d.logo }), item, crumbs] })}
<header class="hd"><div class="w"><a class="lg" href="../../">${d.logo ? `<img src="${esc(d.logo)}" alt="${esc(d.name)} logosu">` : `<i>${initial(d.name)}</i>`}<span>${esc(d.name)}</span></a><nav aria-label="Menü"><a href="../../#urunler">Tümü</a><a href="../../#iletisim">İletişim</a></nav>${S.contact && tel ? `<a class="bt" href="tel:${esc(tel)}">Ara</a>` : ''}</div></header>
<main><section class="x"><div class="w"><nav aria-label="Konum" style="color:var(--m);font-size:14px;margin-bottom:14px"><a href="../../">${esc(d.name)}</a> › ${esc(p.name)}</nav><div class="${p.img ? 'ab' : ''}"><div>${p.cat ? `<span class="ey">${esc(p.cat)}</span>` : ''}<h1 style="font-size:clamp(30px,5vw,48px);margin-bottom:12px">${esc(p.name)}</h1>${p.price ? `<div class="pc" style="font:800 26px var(--hf);color:var(--p);margin-bottom:12px">${tl(p.price)}</div>` : ''}${p.desc ? `<p>${esc(p.desc)}</p>` : ''}${loc ? `<p style="font-size:15px">${esc(d.name)} · ${esc(loc)}</p>` : ''}${S.contact && tel ? `<a class="bt" href="tel:${esc(tel)}">Hemen arayın</a>` : ''}</div>${p.img ? `<div class="ph"><img src="${esc(p.img)}" alt="${esc(p.name)}"></div>` : ''}</div></div></section>
${others.length ? `<section class="x"><div class="w"><div class="hh"><div><h2>Diğer hizmetlerimiz</h2></div></div><div class="gr">${others.map((x) => `<article class="cd pr"><div class="bx"><a href="../${esc(x.slug)}/"><b>${esc(x.name)}</b></a><p>${esc(cut(x.desc, 90))}</p></div></article>`).join('')}</div></div></section>` : ''}</main>
${footOf(d, ctx)}</body></html>`;
  }
  // Arama hazırlığı listesi: yalnızca verilen gerçek durumdan hesaplanır. ok: true/false, null = denetlenemedi.
  // st: { published, addon, live } — live: sunucunun yayındaki sayfayı üretip okuduğu sonuç (noindex, adres sayısı, alan adı sınaması)
  function readiness(raw, ctx = {}, st = {}) {
    const d = publicView(clean(raw)); const S = d.sections; const sv = services(d); const strong = sv.filter((p) => p.strong).length; const m = metaOf(d, ctx); const chk = seoCheck(d, {}); const L = st.live; const out = [];
    const add = (k, ok, label, hint, tab) => out.push({ k, ok, label, hint: ok === true ? '' : hint, tab });
    add('addon', !!st.addon, 'İşletme Web Sitesi eklentisi etkin', 'Yayın için eklenti gerekir.', '');
    add('published', !!st.published, 'Site yayında', 'Yayınlanmamış site arama motorlarına kapalıdır.', '');
    add('live', !st.published ? false : L ? L.index === true : null, 'Yayındaki sayfa dizine açık', L && L.reasons && L.reasons.length ? L.reasons.join(' · ') : st.published ? 'Yayındaki sayfa sunucudan okunamadı.' : 'Önce siteyi yayınlayın.', 'seo');
    add('type', m.type !== 'genel', 'İşletme türü belli', 'Aşağıdan türünüzü seçin.', 'seo');
    add('place', !!((S.contact || S.map) && (d.city || d.district) && d.address), 'Açık adres ve il/ilçe yayında', 'Adres ve il/ilçe girin, İletişim bölümünü açık tutun.', 'iletisim');
    add('contact', !!(S.contact && d.phone), 'Telefon yayında', 'Gerçek telefon numaranızı girin.', 'iletisim');
    add('hours', !!(S.hours && hoursReal(d)), 'Çalışma saatleri onaylı', 'Hazır saatler yayınlanmaz: kendi saatlerinizi girin veya onaylayın.', 'iletisim');
    add('about', !!(S.about && d.about.length >= MIN_ABOUT), 'Özgün Hakkımızda metni', `En az ${MIN_ABOUT} karakter, kendi cümlelerinizle.`, 'icerik');
    add('services', strong >= 3, `Açıklamalı hizmet sayfaları (${strong}/${sv.length})`, `Açıklaması en az ${MIN_DESC} karakter olan hizmetler arama sonuçlarına açılır; en az 3 tane önerilir.`, 'urun');
    add('meta', m.title.length >= 20 && m.title.length <= 70 && m.desc.length >= 70 && m.desc.length <= 170, 'Başlık ve açıklama uygun uzunlukta', `Şu an başlık ${m.title.length}, açıklama ${m.desc.length} karakter.`, 'seo');
    add('image', !!(d.slides.some((s) => /^https:/.test(s.img)) || /^https:/.test(d.logo)), 'Paylaşım görseli var', 'Bağlantı (https) olarak eklenen bir görsel gerekir; yüklenen görseller paylaşım önizlemesine girmez.', 'icerik');
    add('gbp', !!d.seo.gbp, 'Google İşletme Profili bağlantısı girildi', 'Profilinizin bağlantısını aşağıya yapıştırın.', 'seo');
    add('gsc', !!d.seo.gsc, 'Search Console kodu girildi', 'Kod sayfaya eklenir; doğrulamayı Search Console’da siz tamamlarsınız.', 'seo');
    if (st.domain) add('domain', L && L.domain ? L.domain.ok : null, 'Alan adı bu sunucuya bağlı', (L && L.domain && L.domain.error) || 'Alan adı sınanamadı.', 'seo');
    return { items: out, done: out.filter((x) => x.ok === true).length, total: out.length, draft: chk };
  }
  // ---------- Görüntüleme ----------
  const cssOf = (d, F) => `:root{--p:${d.primary};--a:${d.accent};--bg:${d.dark ? '#0d0f17' : '#fbfbfd'};--s:${d.dark ? '#161925' : '#ffffff'};--t:${d.dark ? '#eef0f7' : '#12141c'};--m:${d.dark ? '#a3a9bd' : '#5d6375'};--b:${d.dark ? '#262a3a' : '#e8e9ef'};--r:${d.tpl === 'zarif' ? '6px' : d.tpl === 'canli' ? '26px' : '18px'};--hf:'${F[0]}',${d.font === 'serif' ? 'Georgia,serif' : 'system-ui,sans-serif'};--bf:${d.font === 'serif' ? "'Inter'" : `'${F[0]}'`},system-ui,-apple-system,'Segoe UI',sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--t);font:16px/1.65 var(--bf);-webkit-font-smoothing:antialiased}img{max-width:100%;display:block}a{color:inherit}
.w{width:min(1160px,100% - 32px);margin:0 auto}h1,h2,h3{font-family:var(--hf);line-height:1.15;letter-spacing:${d.font === 'serif' ? '0' : '-.02em'};margin:0}
.hd{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--b)}
.hd .w{display:flex;align-items:center;gap:18px;height:70px}.lg{display:flex;align-items:center;gap:11px;text-decoration:none;font:700 19px var(--hf)}.lg img{width:42px;height:42px;object-fit:contain;border-radius:11px}.lg i{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--p);color:#fff;font-style:normal}
.hd nav{margin-left:auto;display:flex;gap:4px}.hd nav a{padding:8px 13px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;color:var(--m)}.hd nav a:hover{color:var(--t);background:color-mix(in srgb,var(--t) 6%,transparent)}
.bt{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:calc(var(--r) * .7 + 4px);border:0;background:var(--p);color:#fff;font:700 15px var(--bf);text-decoration:none;cursor:pointer;box-shadow:0 12px 26px -12px var(--p);transition:transform .2s}.bt:hover{transform:translateY(-2px)}.bt.o{background:transparent;color:var(--t);border:1.5px solid var(--b);box-shadow:none}
.hero{position:relative;overflow:hidden;${d.tpl === 'canli' ? 'margin:16px;border-radius:calc(var(--r) + 8px);' : ''}}
.sl{position:relative;min-height:${d.tpl === 'zarif' ? '62vh' : '76vh'};display:grid;align-items:end;background:linear-gradient(135deg,var(--p),color-mix(in srgb,var(--p) 40%,#000));color:#fff;opacity:0;transition:opacity .9s;position:absolute;inset:0}.sl.on{opacity:1;position:relative}
.sl img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.06);transition:transform 7s linear}.sl.on img{transform:scale(1)}.sl::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 30%,rgba(0,0,0,.65))}
.sl .w{position:relative;z-index:1;padding:0 0 ${d.tpl === 'zarif' ? '70px' : '84px'};${d.tpl === 'zarif' ? 'text-align:center' : ''}}.sl h1{font-size:clamp(34px,6vw,68px);max-width:16ch;${d.tpl === 'zarif' ? 'margin:0 auto' : ''};text-shadow:0 2px 30px rgba(0,0,0,.25)}.sl p{font-size:clamp(16px,2vw,20px);max-width:52ch;opacity:.92;margin:14px ${d.tpl === 'zarif' ? 'auto' : '0'} 26px}
.sl .bt{background:#fff;color:#111;box-shadow:none}.dots{position:absolute;z-index:2;left:50%;bottom:26px;transform:translateX(-50%);display:flex;gap:8px}.dots b{width:9px;height:9px;border-radius:9px;background:rgba(255,255,255,.5);cursor:pointer;transition:width .3s}.dots b.on{width:28px;background:#fff}
section.x{padding:84px 0}section.x+section.x{padding-top:20px}.hh{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:28px}.hh h2{font-size:clamp(28px,4vw,42px)}.hh p{color:var(--m);margin:6px 0 0}.ey{display:inline-block;font:700 12.5px var(--bf);letter-spacing:.12em;text-transform:uppercase;color:var(--p);margin-bottom:8px}
.gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.cd{background:var(--s);border:1px solid var(--b);border-radius:var(--r);overflow:hidden;transition:transform .25s,box-shadow .25s}.cd:hover{transform:translateY(-4px);box-shadow:0 24px 50px -28px rgba(0,0,0,.35)}
.cm .im{aspect-ratio:16/9;background:linear-gradient(135deg,var(--a),var(--p));display:grid;place-items:center;color:#fff;font:800 40px var(--hf)}.cm .im img{width:100%;height:100%;object-fit:cover}.cm .bx{padding:18px 20px 20px}.cm .bg{display:inline-block;background:var(--a);color:#111;font-weight:800;font-size:12.5px;padding:3px 10px;border-radius:99px;margin-bottom:8px}.cm h3{font-size:20px}.cm p{color:var(--m);margin:6px 0 0;font-size:15px}.cm small{display:block;margin-top:10px;color:var(--m);font-size:13px}
.ch{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.ch button{border:1px solid var(--b);background:var(--s);color:var(--t);padding:8px 16px;border-radius:99px;font:600 14px var(--bf);cursor:pointer}.ch button.on{background:var(--p);border-color:var(--p);color:#fff}
.pr .im{aspect-ratio:1;background:color-mix(in srgb,var(--p) 8%,var(--s));display:grid;place-items:center;font:800 44px var(--hf);color:color-mix(in srgb,var(--p) 50%,transparent)}.pr .im img{width:100%;height:100%;object-fit:cover}.pr .bx{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px}.pr b{font-size:16px;line-height:1.3}.pr p{margin:0;color:var(--m);font-size:13.5px}.pr .rw{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.pr .pc{font:800 19px var(--hf);color:var(--p)}
.ad{width:40px;height:40px;border-radius:12px;border:0;background:var(--p);color:#fff;font-size:24px;cursor:pointer;line-height:1}
.ab{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center}.ab p{font-size:17px;color:var(--m);white-space:pre-line}.ab .ph{aspect-ratio:4/3;border-radius:var(--r);overflow:hidden;background:linear-gradient(135deg,var(--p),var(--a))}.ab .ph img{width:100%;height:100%;object-fit:cover}
.ct{display:grid;grid-template-columns:1fr 1fr;gap:20px}.bxp{background:var(--s);border:1px solid var(--b);border-radius:var(--r);padding:26px}.hr{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed var(--b)}.hr:last-child{border:0}.hr.td{font-weight:800;color:var(--p)}.st{display:inline-flex;gap:7px;align-items:center;font-weight:700;font-size:14px;padding:5px 12px;border-radius:99px;margin-bottom:12px}.st.op{background:#16a34a1f;color:#16a34a}.st.cl{background:#dc26261f;color:#dc2626}
.li{display:flex;flex-direction:column;gap:12px}.li a{display:flex;gap:12px;align-items:center;text-decoration:none;font-weight:600}.li a span{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--p) 12%,transparent);color:var(--p);font-size:19px}
.mp{border-radius:var(--r);overflow:hidden;border:1px solid var(--b);min-height:320px;background:var(--s)}.mp iframe{width:100%;height:100%;min-height:320px;border:0;display:block}.mp .ph2{height:320px;display:grid;place-items:center;text-align:center;color:var(--m);padding:20px}
.ft{padding:40px 0 60px;color:var(--m);font-size:14px;border-top:1px solid var(--b)}.ft .w{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between}.ft a{color:var(--p)}
.wa{position:fixed;left:18px;bottom:18px;z-index:40;width:56px;height:56px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 14px 30px -10px #25d366;text-decoration:none;font-size:28px}
.cb{position:fixed;right:18px;bottom:18px;z-index:40;display:none;align-items:center;gap:10px;padding:14px 20px;border-radius:99px;border:0;background:var(--t);color:var(--bg);font:700 15px var(--bf);cursor:pointer;box-shadow:0 18px 40px -14px rgba(0,0,0,.5)}.cb.on{display:inline-flex}.cb i{font-style:normal;background:var(--a);color:#111;border-radius:99px;padding:1px 9px}
.dr{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.45);display:none}.dr.on{display:block}.dr>div{position:absolute;right:0;top:0;bottom:0;width:min(440px,100%);background:var(--bg);display:flex;flex-direction:column;animation:in .28s ease-out}@keyframes in{from{transform:translateX(40px);opacity:0}}
.dr h3{padding:20px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between}.dr .ls{flex:1;overflow:auto;padding:12px 20px}.dr .it{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--b)}.dr .it b{flex:1;font-size:15px}.dr .q{display:flex;align-items:center;gap:6px}.dr .q button{width:30px;height:30px;border-radius:9px;border:1px solid var(--b);background:var(--s);color:var(--t);cursor:pointer}
.dr form{padding:16px 20px 22px;border-top:1px solid var(--b);display:grid;gap:10px}.dr input,.dr textarea{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--b);background:var(--s);color:var(--t);font:500 15px var(--bf)}.dr .tt{display:flex;justify-content:space-between;font-weight:800;font-size:18px}.dr .nt{font-size:13px;color:var(--m)}.ok{padding:30px 20px;text-align:center}
@media(max-width:820px){.hd nav{display:none}.ab,.ct{grid-template-columns:1fr}section.x{padding:56px 0}.sl{min-height:68vh}}`;
  function render(raw, ctx = {}) {
    const d = publicView(clean(raw)); const S = { ...d.sections, hours: d.sections.hours && hoursReal(d) }; const F = FONTS[d.font]; const orderable = !!ctx.orderable && d.mode === 'siparis' && d.products.length;
    const { title, desc } = metaOf(d, ctx); const sv = services(d); const strongOf = Object.fromEntries(sv.filter((p) => p.strong && !ctx.preview).map((p) => [p.id, p.slug]));
    const mapQ = d.mapQuery || [d.name, d.address, d.district, d.city].filter(Boolean).join(', ');
    const tel = d.phone.replace(/[^\d+]/g, '');
    const firstImg = (d.slides.find((s) => s.img) || {}).img || d.logo;
    const schema = bizSchema(d, S, ctx, { desc, img: firstImg });
    const nav = [S.campaigns && d.campaigns.length && ['#kampanyalar', 'Kampanyalar'], S.products && d.products.length && ['#urunler', orderable ? 'Sipariş ver' : 'Ürünler'], S.about && d.about && ['#hakkimizda', 'Hakkımızda'], (S.contact || S.hours || S.map) && ['#iletisim', 'İletişim']].filter(Boolean);
    const slides = d.slides.length ? d.slides : [{ img: '', title: d.name, text: d.slogan, cta: 'Bize ulaşın', link: '#iletisim' }];
    const cats = [...new Set(d.products.map((p) => p.cat).filter(Boolean))];
    const js = `(function(){var S=[].slice.call(document.querySelectorAll('.sl')),D=[].slice.call(document.querySelectorAll('.dots b')),i=0,T;function go(n){if(!S.length)return;S[i].classList.remove('on');D[i]&&D[i].classList.remove('on');i=(n+S.length)%S.length;S[i].classList.add('on');D[i]&&D[i].classList.add('on')}D.forEach(function(b,k){b.onclick=function(){go(k);clearInterval(T)}});if(S.length>1)T=setInterval(function(){go(i+1)},5500);
var h=${JSON.stringify(d.hours)},n=new Date(),di=(n.getDay()+6)%7,hm=('0'+n.getHours()).slice(-2)+':'+('0'+n.getMinutes()).slice(-2),st=document.getElementById('st'),r=document.querySelector('[data-d="'+di+'"]');if(r)r.classList.add('td');if(st){var o=!h[di].closed&&hm>=h[di].open&&hm<h[di].close;st.className='st '+(o?'op':'cl');st.textContent=o?'● Şu an açık':'● Şu an kapalı'}
[].slice.call(document.querySelectorAll('.ch button')).forEach(function(b){b.onclick=function(){[].slice.call(document.querySelectorAll('.ch button')).forEach(function(x){x.classList.toggle('on',x===b)});[].slice.call(document.querySelectorAll('.pr')).forEach(function(c){c.style.display=!b.dataset.c||c.dataset.c===b.dataset.c?'':'none'})}});
${orderable ? `var P=${JSON.stringify(Object.fromEntries(d.products.map((p) => [p.id, { n: p.name, p: p.price }]))).replace(/</g, '\\u003c')},K='nbsepet:${esc(ctx.slug || 'x')}',C={};try{C=JSON.parse(localStorage.getItem(K))||{}}catch(e){}var cb=document.querySelector('.cb'),dr=document.querySelector('.dr'),M=${d.delivery.min},FE=${d.delivery.fee};function f(x){return x.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₺'}function sv(){try{localStorage.setItem(K,JSON.stringify(C))}catch(e){}}
function dw(){var ks=Object.keys(C).filter(function(k){return P[k]&&C[k]>0}),q=0,t=0;ks.forEach(function(k){q+=C[k];t+=C[k]*P[k].p});cb.classList.toggle('on',q>0);cb.querySelector('i').textContent=q;cb.querySelector('em').textContent=f(t);document.querySelector('.dr .ls').innerHTML=ks.map(function(k){return '<div class="it"><b>'+P[k].n.replace(/</g,'&lt;')+'</b><span>'+f(P[k].p*C[k])+'</span><span class="q"><button type="button" data-m="'+k+'">−</button>'+C[k]+'<button type="button" data-p="'+k+'">+</button></span></div>'}).join('')||'<p>Sepetiniz boş</p>';var tt=t+(t>0?FE:0);document.querySelector('.dr .tt span').textContent=f(tt);var mn=document.querySelector('.dr .mn');mn.textContent=M&&t<M?'En az sipariş tutarı '+f(M)+'':'';return t}
document.addEventListener('click',function(e){var a=e.target.closest('[data-add],[data-p],[data-m]');if(!a)return;var k=a.dataset.add||a.dataset.p||a.dataset.m;C[k]=(C[k]||0)+(a.dataset.m?-1:1);if(C[k]<=0)delete C[k];sv();dw();if(a.dataset.add){a.textContent='✓';setTimeout(function(){a.textContent='+'},700)}});cb.onclick=function(){dr.classList.add('on')};dr.onclick=function(e){if(e.target===dr||e.target.closest('[data-x]'))dr.classList.remove('on')};
document.querySelector('.dr form').onsubmit=function(e){e.preventDefault();var t=dw();if(!t)return;if(M&&t<M)return alert('En az sipariş tutarı '+f(M));${ctx.preview ? "alert('Önizlemede sipariş gönderilmez. Siteniz yayındayken siparişler POS > Online Siparişler ekranına düşer.');return;" : ''}var fd=new FormData(e.target),b=e.target.querySelector('button');b.disabled=true;b.textContent='Gönderiliyor…';fetch('/api/w/${esc(ctx.slug || '')}/siparis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fd.get('ad'),phone:fd.get('tel'),address:fd.get('adres'),note:fd.get('not'),items:Object.keys(C).map(function(k){return{id:k,qty:C[k]}})})}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw new Error(j.error||'Gönderilemedi');C={};sv();dw();document.querySelector('.dr form').outerHTML='<div class="ok"><h3>Siparişiniz alındı 🎉</h3><p>Sipariş no: <b>'+j.no+'</b><br>İşletme siparişinizi onayladığında sizi arayacak.</p></div>'}).catch(function(x){alert(x.message);b.disabled=false;b.textContent='Siparişi gönder'})};dw();` : ''}})();`;
    return `${headOf(d, F, { title, desc, url: ctx.url, img: firstImg, index: seoCheck(d, ctx).index, gsc: d.seo.gsc, schemas: [schema] })}
<header class="hd"><div class="w"><a class="lg" href="#">${d.logo ? `<img src="${esc(d.logo)}" alt="${esc(d.name)} logosu">` : `<i>${initial(d.name)}</i>`}<span>${esc(d.name)}</span></a><nav aria-label="Menü">${nav.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>${tel ? `<a class="bt" href="tel:${esc(tel)}">Ara</a>` : ''}</div></header>
<main>${S.slider ? `<div class="hero">${slides.map((s, i) => `<div class="sl${i ? '' : ' on'}">${s.img ? `<img src="${esc(s.img)}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>` : ''}<div class="w">${i ? `<h2 style="font-size:clamp(34px,6vw,68px);max-width:16ch">${esc(s.title)}</h2>` : `<h1>${esc(s.title || d.name)}</h1>`}${s.text ? `<p>${esc(s.text)}</p>` : ''}${s.cta ? `<a class="bt" href="${esc(s.link || '#iletisim')}">${esc(s.cta)} →</a>` : ''}</div></div>`).join('')}${slides.length > 1 ? `<div class="dots">${slides.map((s, i) => `<b class="${i ? '' : 'on'}" aria-label="Slayt ${i + 1}"></b>`).join('')}</div>` : ''}</div>` : `<section class="x"><div class="w"><h1 style="font-size:clamp(34px,6vw,60px)">${esc(d.name)}</h1><p style="color:var(--m);font-size:19px">${esc(d.slogan)}</p></div></section>`}
${S.campaigns && d.campaigns.length ? `<section class="x" id="kampanyalar"><div class="w"><div class="hh"><div><span class="ey">Fırsatlar</span><h2>Kampanyalar</h2></div></div><div class="gr">${d.campaigns.map((c) => `<article class="cd cm"><div class="im">${c.img ? `<img src="${esc(c.img)}" alt="${esc(c.title)}" loading="lazy">` : '%'}</div><div class="bx">${c.badge ? `<span class="bg">${esc(c.badge)}</span>` : ''}<h3>${esc(c.title)}</h3>${c.text ? `<p>${esc(c.text)}</p>` : ''}${c.until ? `<small>Son gün: ${esc(c.until.split('-').reverse().join('.'))}</small>` : ''}</div></article>`).join('')}</div></div></section>` : ''}
${S.products && d.products.length ? `<section class="x" id="urunler"><div class="w"><div class="hh"><div><span class="ey">${orderable ? 'Online sipariş' : 'Vitrin'}</span><h2>${orderable ? 'Sipariş verin' : 'Ürünlerimiz'}</h2>${orderable && d.delivery.note ? `<p>${esc(d.delivery.note)}</p>` : ''}</div></div>${cats.length > 1 ? `<div class="ch"><button class="on" data-c="">Tümü</button>${cats.map((c) => `<button data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}<div class="gr">${d.products.map((p) => `<article class="cd pr" data-c="${esc(p.cat)}"><div class="im">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : initial(p.name)}</div><div class="bx"><b>${strongOf[p.id] ? `<a href="hizmet/${esc(strongOf[p.id])}/">${esc(p.name)}</a>` : esc(p.name)}</b>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}<div class="rw">${p.price ? `<span class="pc">${tl(p.price)}</span>` : '<span></span>'}${orderable && p.price ? `<button class="ad" data-add="${esc(p.id)}" aria-label="${esc(p.name)} sepete ekle">+</button>` : ''}</div></div></article>`).join('')}</div></div></section>` : ''}
${S.about && d.about ? `<section class="x" id="hakkimizda"><div class="w ab"><div><span class="ey">Hakkımızda</span><h2 style="font-size:clamp(28px,4vw,42px);margin-bottom:14px">${esc(d.name)}</h2><p>${esc(d.about)}</p></div><div class="ph">${(d.slides[1] || d.slides[0] || {}).img ? `<img src="${esc((d.slides[1] || d.slides[0]).img)}" alt="" loading="lazy">` : ''}</div></div></section>` : ''}
${S.contact || S.hours || S.map ? `<section class="x" id="iletisim"><div class="w"><div class="hh"><div><span class="ey">Bize ulaşın</span><h2>İletişim ve konum</h2></div></div><div class="ct">
  <div class="bxp">${S.hours ? `<span class="st" id="st"></span><h3 style="margin-bottom:8px">Çalışma saatleri</h3>${d.hours.map((h, i) => `<div class="hr" data-d="${i}"><span>${DAYS[i]}</span><span>${h.closed ? 'Kapalı' : `${h.open} – ${h.close}`}</span></div>`).join('')}` : ''}
  ${S.contact ? `<div class="li" style="margin-top:${S.hours ? '22px' : '0'}">${d.phone ? `<a href="tel:${esc(tel)}"><span>☎</span>${esc(d.phone)}</a>` : ''}${d.whatsapp ? `<a href="https://wa.me/${esc(d.whatsapp.replace(/^\+/, '').replace(/^0/, '90'))}" target="_blank" rel="noopener"><span>✆</span>WhatsApp ile yazın</a>` : ''}${d.email ? `<a href="mailto:${esc(d.email)}"><span>✉</span>${esc(d.email)}</a>` : ''}${d.address || d.city ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}" target="_blank" rel="noopener"><span>⌖</span>${esc([d.address, d.city].filter(Boolean).join(', '))}</a>` : ''}${d.instagram ? `<a href="https://www.instagram.com/${esc(d.instagram)}/" target="_blank" rel="noopener"><span>◎</span>@${esc(d.instagram)}</a>` : ''}${d.facebook ? `<a href="https://www.facebook.com/${esc(d.facebook)}" target="_blank" rel="noopener"><span>f</span>${esc(d.facebook)}</a>` : ''}</div>` : ''}</div>
  ${S.map && mapQ ? `<div class="mp">${ctx.preview ? `<div class="ph2"><div><b>Harita</b><br>"${esc(mapQ)}" konumu yayındaki sitede Google Haritalar ile gösterilir.</div></div>` : `<iframe title="${esc(d.name)} konumu" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(mapQ)}&output=embed"></iframe>`}</div>` : ''}
</div></div></section>` : ''}</main>
${footOf(d, ctx)}
${d.whatsapp ? `<a class="wa" href="https://wa.me/${esc(d.whatsapp.replace(/^\+/, '').replace(/^0/, '90'))}" target="_blank" rel="noopener" aria-label="WhatsApp">✆</a>` : ''}
${orderable ? `<button class="cb" aria-label="Sepet">Sepet <i>0</i><em></em></button><div class="dr" role="dialog" aria-label="Sepet"><div><h3>Sepetiniz <button type="button" data-x class="bt o" style="padding:4px 12px">✕</button></h3><div class="ls"></div><form><div class="tt"><b>Toplam${d.delivery.fee ? ` <small style="font-weight:500;color:var(--m)">(teslimat ${tl(d.delivery.fee)} dahil)</small>` : ''}</b><span></span></div><div class="nt mn" style="color:#dc2626"></div><input name="ad" placeholder="Adınız soyadınız" required maxlength="80"><input name="tel" type="tel" placeholder="Telefon" required pattern="[0-9+ ()-]{10,20}"><textarea name="adres" rows="2" placeholder="Teslimat adresi" required maxlength="300"></textarea><input name="not" placeholder="Not (isteğe bağlı)" maxlength="200"><div class="nt">${esc(d.delivery.note || 'Ödeme kapıda yapılır.')}</div><button class="bt" style="justify-content:center">Siparişi gönder</button></form></div></div>` : ''}
<script>${js}</script></body></html>`;
  }
  return { render, renderService, clean, defaults, metaOf, seoCheck, sitemapUrls, services, bizType, readiness, hoursReal, slugify, TEMPLATES, FONTS, SECTIONS, DAYS, BIZ_TYPES };
});
