// NEBSOFT Pazarlama: saf iş mantığı (ağ ve dosya yok; test.js sahte yanıtlarla sınar).
// Hukuk ve lisans kuralları burada kodlanır, ayrıntı ve kaynaklar: docs/PAZARLAMA-ARACI.md
const { SEKTORLER, ILLER } = require('./esleme');
const urunler = require('../../site/src/products.js');

const DURUMLAR = [['yeni', 'Yeni'], ['arandi', 'Arandı'], ['teklif', 'Teklif'], ['kazanildi', 'Kazanıldı'], ['kayip', 'Kayıp']];
const DURUM_ID = new Set(DURUMLAR.map((d) => d[0]));
const OSM_LISANS = '© OpenStreetMap katkıda bulunanlar, ODbL';
// Google alan maskesi: yalnızca listede gösterilen alanlar. Telefon, web, puan Enterprise katmanını açar (kaynak: dokümandaki data-fields)
const GOOGLE_ALAN = ['id', 'displayName', 'formattedAddress', 'location', 'businessStatus', 'nationalPhoneNumber', 'websiteUri', 'rating', 'userRatingCount', 'googleMapsUri'];
const GOOGLE_MASKE_ARAMA = GOOGLE_ALAN.map((a) => 'places.' + a).join(',') + ',nextPageToken';
const GOOGLE_MASKE_AYRINTI = GOOGLE_ALAN.join(',');
const OVERPASS_LIMIT = 300;

// ---------- Metin ---------------------------------------------------------
const trKucuk = (s) => String(s || '').toLocaleLowerCase('tr');
const trSade = (s) => trKucuk(s).replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const trBaslik = (s) => trKucuk(s).trim().replace(/\s+/g, ' ').split(' ').map((k) => k.charAt(0).toLocaleUpperCase('tr') + k.slice(1)).join(' ');
const AD_EK = new Set(['ltd', 'sti', 'limited', 'sirketi', 'as', 'san', 'tic', 've', 'sanayi', 'ticaret', 'anonim', 'kuafor', 'kuaforu', 'berber', 'cafe', 'kafe', 'restoran', 'restaurant', 'magazasi', 'eczanesi', 'eczane']);
const adOnbellek = new Map(); // binlerce adayla karşılaştırmada aynı ad tekrar tekrar sadeleştirilmesin
const adKok = (s) => { let k = adOnbellek.get(s); if (k === undefined) { if (adOnbellek.size > 50000) adOnbellek.clear(); k = trSade(s).split(' ').filter((x) => x && !AD_EK.has(x)).join(' '); adOnbellek.set(s, k); } return k; };

// Türkiye numarası: 0XXX XXX XX XX biçimi; anahtar 10 hanedir. Birden çok numara yazılmışsa ilki alınır.
function telefonCoz(ham) {
  const ilk = String(ham || '').split(/[;,/]/)[0].trim();
  if (!ilk) return { goster: '', anahtar: '', cep: false };
  let r = ilk.replace(/\D/g, '');
  if (r.startsWith('0090')) r = r.slice(4); else if (r.startsWith('90') && r.length === 12) r = r.slice(2); else if (r.startsWith('0') && r.length === 11) r = r.slice(1);
  if (r.length !== 10) return { goster: ilk, anahtar: r, cep: false };
  return { goster: `0${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`, anahtar: r, cep: r[0] === '5' };
}

const SOSYAL = ['instagram.com', 'facebook.com', 'fb.com', 'fb.me', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com', 'linktr.ee', 'wa.me', 'whatsapp.com', 't.me', 'linkedin.com'];
const PLATFORM = ['booksy.com', 'fresha.com', 'setmore.com', 'calendly.com', 'planity.com', 'doktortakvimi.com', 'booking.com', 'airbnb.com'];
const alanAdi = (h, liste) => liste.some((d) => h === d || h.endsWith('.' + d));
// Yalnızca http(s) adresi güvenli bağlantı olur; alan adı mükerrer eleme ve web durumu için kullanılır
function webCoz(ham) {
  const s = String(ham || '').trim(); if (!s) return { url: '', alan: '', tur: 'yok' };
  let u; try { u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s.replace(/^\/+/, '')); } catch (e) { return { url: '', alan: '', tur: 'yok' }; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return { url: '', alan: '', tur: 'yok' };
  const alan = u.hostname.replace(/^www\./, '').toLowerCase();
  const tur = alanAdi(alan, SOSYAL) ? 'sosyal' : (alanAdi(alan, PLATFORM) || alan.includes('randevu')) ? 'platform' : 'var';
  return { url: u.href, alan, tur };
}

// ---------- Sektör ve program --------------------------------------------
const urunGetir = (id) => urunler.find((u) => u.id === id);
const urunOzet = (id, dolayli) => { const u = urunGetir(id); return u ? { id, ad: u.kw, baslik: u.title.split(' — ')[0], slug: u.slug, dolayli: !!dolayli } : null; };
const sektorProgramlari = (s) => [...s.programlar.map((id) => urunOzet(id, false)), ...(s.dolayli || []).map((id) => urunOzet(id, true))].filter(Boolean);
const sektorGetir = (id) => SEKTORLER.find((s) => s.id === id);
const sektorAcik = () => SEKTORLER.map((s) => ({ id: s.id, ad: s.ad, randevu: !!s.randevu, serbestMeslek: !!s.serbestMeslek, dolayliEslesme: !s.programlar.length, programlar: sektorProgramlari(s) }));

// ---------- Overpass ------------------------------------------------------
function aramaDogrula({ il, ilce, sektorId }) {
  const ilNo = ILLER.indexOf(il) + 1; if (!ilNo) return { hata: 'Geçerli bir il seçin.' };
  const sektor = sektorGetir(sektorId); if (!sektor) return { hata: 'Geçerli bir sektör seçin.' };
  const yazili = String(ilce || '').trim();
  if (yazili && !/^[\p{L}][\p{L} .'-]{1,40}$/u.test(yazili)) return { hata: 'İlçe adında yalnızca harf kullanın.' };
  return { il, ilNo, ilce: yazili ? trBaslik(yazili) : '', sektor };
}
function overpassSorgu({ ilNo, ilce, sektor }) {
  const kod = 'TR-' + String(ilNo).padStart(2, '0');
  const sat = [`[out:json][timeout:40];`, `rel["boundary"="administrative"]["admin_level"="4"]["ISO3166-2"="${kod}"]->.il;`, '.il out tags;'];
  if (ilce) sat.push('.il map_to_area->.ilAlan;', `rel(area.ilAlan)["boundary"="administrative"]["admin_level"="6"]["name"="${ilce}"]->.ilce;`, '.ilce out tags;', '.ilce map_to_area->.a;');
  else sat.push('.il map_to_area->.a;');
  sat.push('(' + sektor.osm.map((t) => { const [k, v] = t.split('='); return `nwr["${k}"="${v}"](area.a);`; }).join('') + ');', `out center tags ${OVERPASS_LIMIT};`);
  return sat.join('\n');
}
function osmKaydi(el) {
  const t = el.tags || {};
  const ad = t.name || t['name:tr'] || ''; if (!ad.trim()) return null;
  if (['public', 'government'].includes(t['operator:type'])) return null; // kamu kurumu müşteri adayı değildir
  const tel = telefonCoz(t.phone || t['contact:phone'] || t.mobile || t['contact:mobile']);
  const sosyal = t['contact:instagram'] || t['contact:facebook'] || '';
  const w = webCoz(t.website || t['contact:website'] || t.url || (/^https?:/i.test(sosyal) ? sosyal : sosyal ? 'instagram.com/' + sosyal.replace(/^@/, '') : ''));
  const adres = [[t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), t['addr:neighbourhood'] || t['addr:suburb'], t['addr:district'], t['addr:city'], t['addr:postcode']].filter(Boolean).join(', ');
  const lat = el.lat ?? (el.center && el.center.lat), lon = el.lon ?? (el.center && el.center.lon);
  return { anahtar: `osm:${el.type}/${el.id}`, kaynak: 'osm', ad: ad.trim(), adres, telefon: tel.goster, telAnahtar: tel.anahtar, cep: tel.cep, web: w.url, webAlan: w.alan, webTur: w.tur, puanYildiz: null, yorumSayisi: null, lat: lat ?? null, lon: lon ?? null, zincir: !!(t.brand || t['brand:wikidata']), harita: `https://www.openstreetmap.org/${el.type}/${el.id}` };
}
// Dönen öğelerden işletmeleri ayırır; il/ilçe sınır kayıtları "alan bulundu mu" denetimidir
function overpassCoz(veri, { ilce }) {
  const el = (veri && veri.elements) || [];
  const sinir = el.filter((e) => e.type === 'relation' && e.tags && e.tags.boundary === 'administrative');
  const ilVar = sinir.some((e) => e.tags.admin_level === '4'), ilceVar = sinir.some((e) => e.tags.admin_level === '6');
  const isl = el.filter((e) => !sinir.includes(e));
  const kayitlar = isl.map(osmKaydi).filter(Boolean);
  return { ilVar, ilceVar: !ilce || ilceVar, kesildi: isl.length >= OVERPASS_LIMIT, adsiz: isl.length - kayitlar.length, kayitlar };
}

// ---------- Google Places (New) ------------------------------------------
const googleGovde = ({ il, ilce, sektor }, sayfaToken) => { const g = { textQuery: `${sektor.metin} ${ilce ? ilce + ' ' : ''}${il}`, languageCode: 'tr', regionCode: 'TR', pageSize: 20 }; if (sayfaToken) g.pageToken = sayfaToken; return g; };
const googleHaritaBag = (id, sorgu) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sorgu || 'işletme')}&query_place_id=${encodeURIComponent(id)}`;
function googleKaydi(p) {
  if (!p || !p.id || p.businessStatus === 'CLOSED_PERMANENTLY') return null;
  const tel = telefonCoz(p.nationalPhoneNumber), w = webCoz(p.websiteUri);
  return { anahtar: 'g:' + p.id, kaynak: 'google', placeId: p.id, ad: (p.displayName && p.displayName.text) || '(adsız)', adres: p.formattedAddress || '', telefon: tel.goster, telAnahtar: tel.anahtar, cep: tel.cep, web: w.url, webAlan: w.alan, webTur: w.tur, puanYildiz: p.rating ?? null, yorumSayisi: p.userRatingCount ?? null, lat: (p.location && p.location.latitude) ?? null, lon: (p.location && p.location.longitude) ?? null, zincir: false, harita: p.googleMapsUri || googleHaritaBag(p.id) };
}
function googleCoz(veri, { il }) {
  const ilSade = trSade(il);
  const hepsi = ((veri && veri.places) || []).map(googleKaydi).filter(Boolean);
  const kayitlar = hepsi.filter((k) => !k.adres || trSade(k.adres).includes(ilSade)); // metin araması başka ili de getirebilir
  return { kayitlar, ilDisi: hepsi.length - kayitlar.length, sonrakiToken: (veri && veri.nextPageToken) || '' };
}

// ---------- Fırsat puanı (tahmin) ----------------------------------------
// Yalnızca gözlenebilir işaret kullanılır. OSM'de alanın boş olması zayıf kanıttır, bu yüzden Google'dan az puanlıdır.
function puanla(k, sektor) {
  const n = []; let p = 25; const google = k.kaynak === 'google', ad = google ? 'Google' : 'OpenStreetMap';
  const ekle = (d, m) => { p += d; n.push(m); };
  const tur = k.webTur || 'yok';
  if (tur === 'yok') ekle(google ? 40 : 20, google ? 'Google kaydında web sitesi yok.' : 'OpenStreetMap kaydında web sitesi yok. OSM çoğu zaman eksik olduğu için bu zayıf bir işarettir.');
  else if (tur === 'sosyal') ekle(google ? 30 : 25, `Web adresi olarak yalnızca sosyal medya görünüyor (${ad}).`);
  else if (tur === 'platform') { if (sektor && sektor.randevu) ekle(-10, 'Hazır bir randevu veya rezervasyon platformu kullanıyor görünüyor; rakip ürünle çalışıyor olabilir.'); else n.push('Web adresi bir platform sayfası.'); } else n.push('Web sitesi var; bu işaret fırsat puanı eklemiyor.');
  if (sektor && sektor.randevu) { if (tur === 'yok' || tur === 'sosyal') ekle(15, 'Kendi sitesi görünmediği için online randevu da görünmüyor (çıkarım; işletmeye sorulmalı).'); else if (tur === 'var') n.push('Sitesinde online randevu olup olmadığı incelenmedi.'); }
  if (k.telefon) ekle(10, 'Kayıtlı bir telefon var.'); else ekle(-10, 'Kayıtlı telefon yok; ulaşmak zor olabilir.');
  if (k.puanYildiz != null && k.yorumSayisi >= 10 && k.puanYildiz < 4) ekle(10, `Müşteri puanı düşük (${k.puanYildiz}, ${k.yorumSayisi} yorum); hizmet düzenine ihtiyaç olabilir.`);
  if (k.yorumSayisi >= 100) ekle(10, `Yorum sayısı yüksek (${k.yorumSayisi}); yoğun çalışan bir işletme olabilir.`);
  if (k.zincir) ekle(-20, 'Zincir marka görünüyor; karar büyük olasılıkla merkezde veriliyor.');
  if (sektor && !sektor.programlar.length) ekle(-10, 'Sektör ile program eşleşmesi dolaylı; ihtiyaç doğrudan gözlenemiyor.');
  const puan = Math.max(0, Math.min(100, p));
  return { puan, seviye: puan >= 60 ? 'yuksek' : puan >= 35 ? 'orta' : 'dusuk', seviyeAd: puan >= 60 ? 'Yüksek' : puan >= 35 ? 'Orta' : 'Düşük', nedenler: n, tahmin: true };
}

// ---------- Mükerrer eleme -----------------------------------------------
function mesafeM(a, b) {
  if (a.lat == null || b.lat == null || a.lon == null || b.lon == null) return null;
  const r = Math.PI / 180, x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371000;
}
function ayniIsletme(a, b) {
  if (a.anahtar === b.anahtar) return true;
  if (a.telAnahtar && a.telAnahtar.length === 10 && !a.telAnahtar.startsWith('850') && a.telAnahtar === b.telAnahtar) return true; // 0850 zincirin ortak hattı olabilir
  const ka = adKok(a.ad), kb = adKok(b.ad), m = mesafeM(a, b);
  if (a.webTur === 'var' && a.webAlan && a.webAlan === b.webAlan && ka === kb) return true; // zincirin şubeleri aynı alanı paylaşır, ad da aranır
  if (!ka || !kb) return false;
  if (ka === kb) return m != null ? m <= 200 : !!(a.adres && trSade(a.adres) === trSade(b.adres));
  return m != null && m <= 100 && Math.min(ka.length, kb.length) >= 5 && (ka.includes(kb) || kb.includes(ka));
}
const dolulukPuan = (k) => [k.telefon, k.web, k.adres, k.puanYildiz].filter((x) => x != null && x !== '').length;
// Kayıtlar birleştirilmez: Google alanı OSM kaydına kopyalanmaz (saklama yasağı). Dolu olan kayıt kalır, diğerinin anahtarı eslesen listesine girer.
function tekillestir(liste) {
  const kalan = [];
  for (const k of liste) {
    const i = kalan.findIndex((x) => ayniIsletme(x, k));
    if (i < 0) { kalan.push({ ...k, eslesen: k.eslesen || [] }); continue; }
    const x = kalan[i], yeniKazanir = dolulukPuan(k) > dolulukPuan(x);
    const a = yeniKazanir ? k : x, b = yeniKazanir ? x : k;
    kalan[i] = { ...a, eslesen: [...new Set([...(a.eslesen || []), ...(b.eslesen || []), b.anahtar])].filter((e) => e !== a.anahtar) };
  }
  return kalan;
}

// ---------- Aday kaydı ve saklama ----------------------------------------
// Google içeriği diske yazılmaz: yalnızca place_id ve kullanıcının kendi girdileri kalır. Burası tek kapıdır; test.js bunu sınar.
function adayKaydi(k, { sektorId, il, ilce }, simdi = new Date()) {
  const ortak = { sektorId: sektorId || '', il: il || '', ilce: ilce || '', durum: 'yeni', not: '', sonrakiArama: '', ret: false, eklenme: simdi.toISOString(), guncelleme: simdi.toISOString() };
  if (k.kaynak === 'google' || String(k.anahtar).startsWith('g:')) {
    const placeId = k.placeId || String(k.anahtar).slice(2);
    if (!/^[\w-]{10,300}$/.test(placeId)) return null;
    return { anahtar: 'g:' + placeId, kaynak: 'google', placeId, ...ortak };
  }
  if (!/^osm:(node|way|relation)\/\d+$/.test(String(k.anahtar))) return null;
  const s = (x, n) => String(x == null ? '' : x).slice(0, n);
  const tel = telefonCoz(k.telefon), w = webCoz(k.web);
  return { anahtar: k.anahtar, kaynak: 'osm', ...ortak, ad: s(k.ad, 200), adres: s(k.adres, 300), telefon: tel.goster, telAnahtar: tel.anahtar, cep: tel.cep, web: w.url, webAlan: w.alan, webTur: w.tur, lat: Number.isFinite(k.lat) ? k.lat : null, lon: Number.isFinite(k.lon) ? k.lon : null, zincir: !!k.zincir, harita: /^https:\/\/www\.openstreetmap\.org\//.test(k.harita) ? k.harita : '' };
}
function adayGuncelle(a, d, simdi = new Date()) {
  const y = { ...a };
  if (d.durum !== undefined) { if (!DURUM_ID.has(d.durum)) return null; y.durum = d.durum; }
  if (d.not !== undefined) y.not = String(d.not).slice(0, 4000);
  if (d.sonrakiArama !== undefined) { if (d.sonrakiArama && !/^\d{4}-\d{2}-\d{2}$/.test(d.sonrakiArama)) return null; y.sonrakiArama = d.sonrakiArama; }
  if (d.ret !== undefined) y.ret = !!d.ret;
  y.guncelleme = simdi.toISOString();
  return y;
}
// Süresi dolan aday silinir. Kazanılan müşteri ve ileri tarihli arama kalır.
// İletişim istemeyenlerin kimlik alanları silinir, anahtar kalır: yoksa aynı işletme tekrar "yeni" görünür ve aranırdı.
function saklamaUygula(adaylar, gun, simdi = new Date()) {
  const sinir = simdi.getTime() - gun * 864e5, bugun = simdi.toISOString().slice(0, 10);
  let silinen = 0, kisilen = 0; const kalan = [];
  for (const a of adaylar) {
    if (a.durum === 'kazanildi' || (a.sonrakiArama && a.sonrakiArama >= bugun) || new Date(a.guncelleme).getTime() >= sinir) { kalan.push(a); continue; }
    if (a.ret) { if (a.kaynak === 'osm' && a.ad) { kisilen++; kalan.push({ ...a, ad: '', adres: '', telefon: '', telAnahtar: '', cep: false, web: '', webAlan: '', webTur: 'yok', lat: null, lon: null, not: '', harita: '' }); } else kalan.push(a); continue; }
    silinen++;
  }
  return { kalan, silinen, kisilen };
}

// ---------- CSV ----------------------------------------------------------
// Excel formül enjeksiyonu engellenir: OSM verisini herkes düzenleyebilir, "=" ile başlayan ad kötü niyetli olabilir
const csvHucre = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function csvUret(adaylar) {
  const bas = ['Durum', 'Sonraki arama', 'Not', 'İletişim istemiyor', 'Sektör', 'Program', 'İl', 'İlçe', 'Ad', 'Adres', 'Telefon', 'Web', 'Kaynak', 'place_id', 'Veri lisansı'];
  const durum = Object.fromEntries(DURUMLAR);
  const sat = adaylar.map((a) => {
    const s = sektorGetir(a.sektorId), g = a.kaynak === 'google', pr = s ? sektorProgramlari(s).map((p) => p.ad).join(', ') : '';
    return [durum[a.durum] || a.durum, a.sonrakiArama, a.not, a.ret ? 'Evet' : '', s ? s.ad : '', pr, a.il, a.ilce, g ? '' : a.ad, g ? '' : a.adres, g ? '' : a.telefon, g ? '' : a.web, g ? 'Google Maps' : 'OpenStreetMap', g ? a.placeId : '', g ? 'Ad ve iletişim bilgisi Google şartları gereği dışa aktarılmaz' : OSM_LISANS];
  });
  return '﻿' + [bas, ...sat].map((r) => r.map(csvHucre).join(';')).join('\r\n') + '\r\n';
}

// ---------- İlk temas metni ----------------------------------------------
// Yönetmelik md. 8 gereği kimlik, niteliği belirten ibare ve md. 9 gereği ret yolu metinde yer alır. Boş ayar köşeli yer tutucu kalır.
function ilkTemas(k, sektor, g = {}) {
  const pr = sektorProgramlari(sektor)[0], u = pr ? urunGetir(pr.id) : null;
  const unvan = g.unvan || '[ticaret unvanınız veya esnafsanız adınız soyadınız]';
  const kimlik = g.kimlik || '[MERSİS no; esnafsanız T.C. kimlik veya vergi no]';
  const ret = g.retYolu || '[ücretsiz ret yolu: numara veya bağlantı]';
  const aydin = g.aydinlatma || '[aydınlatma metni bağlantısı]';
  const site = g.site ? `${g.site.replace(/\/$/, '')}/${pr ? pr.slug : ''}` : `[site adresiniz]/${pr ? pr.slug : ''}`;
  const ad = k.ad && !k.ad.startsWith('(') ? k.ad : '[işletme adı]';
  const tur = k.webTur || 'yok', webYok = tur === 'yok' || tur === 'sosyal';
  const gozlem = tur === 'sosyal' ? 'Haritadaki kaydınızda web adresi olarak yalnızca sosyal medya hesabınızı gördüm.' : tur === 'yok' ? 'Haritada işletmenize ait bir web sitesi göremedim.' : 'Haritadaki kaydınızdan işletmenizi gördüm.';
  const dert = u && u.pains && u.pains[0] ? u.pains[0][0] : 'günlük işleriniz';
  const urunAd = pr ? pr.ad : 'işletme yazılımı';
  const telefon = `Bu bir tanıtım aramasıdır. Merhaba, ben ${unvan} adına arıyorum. ${ad} ile görüşüyor muyum?\n\nNumaranızı herkese açık harita kaydından aldım. Bir daha aranmak istemezseniz hemen söyleyin, kaydınızı kapatırım. Kişisel verilerinizle ilgili bilgi metni: ${aydin}\n\n${gozlem} ${sektor.ad} işletmelerinin sık yaşadığı "${dert}" sorunu için ${urunAd} sunuyoruz. Size uygun olur mu, iki dakikada anlatayım?`;
  const yazili = `Tanıtım: ${unvan} (${kimlik})\n\nMerhaba ${ad},\n${gozlem} "${dert}" sorununu çözmek için ${urunAd} sunuyoruz. Ayrıntı: ${site}\n\nİletişim: ${g.telefon || '[telefon numaranız]'}\nBu tür iletileri almak istemiyorsanız: ${ret}\nKişisel verilerle ilgili bilgi metni: ${aydin}`;
  return { telefon, yazili, program: urunAd, webYok };
}

module.exports = { DURUMLAR, OSM_LISANS, GOOGLE_MASKE_ARAMA, GOOGLE_MASKE_AYRINTI, OVERPASS_LIMIT, ILLER, trSade, trBaslik, telefonCoz, webCoz, sektorAcik, sektorGetir, sektorProgramlari, aramaDogrula, overpassSorgu, osmKaydi, overpassCoz, googleGovde, googleHaritaBag, googleKaydi, googleCoz, puanla, ayniIsletme, tekillestir, adayKaydi, adayGuncelle, saklamaUygula, csvHucre, csvUret, ilkTemas };
