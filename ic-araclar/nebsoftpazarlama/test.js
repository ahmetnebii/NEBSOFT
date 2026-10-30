// NEBSOFT Pazarlama testleri. Ağa çıkmaz; tüm dış yanıtlar sahtedir. Çalıştır: node ic-araclar/nebsoftpazarlama/test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const c = require('./cekirdek');
const { SEKTORLER, ILLER } = require('./esleme');
const urunler = require('../../site/src/products.js');
const { olustur } = require('./baslat');

let gecen = 0; const hatalar = [];
const dene = async (ad, f) => { try { await f(); gecen++; } catch (e) { hatalar.push(`${ad}: ${e.message}`); } };
const ANAHTAR = 'AIzaTEST_anahtar_gizli_1234567890';

const osmEl = (id, tags, ek = {}) => ({ type: 'node', id, lat: 40.99, lon: 29.03, tags, ...ek });
const sahteOverpass = { elements: [
  { type: 'relation', id: 1, tags: { boundary: 'administrative', admin_level: '4', name: 'İstanbul' } },
  { type: 'relation', id: 2, tags: { boundary: 'administrative', admin_level: '6', name: 'Kadıköy' } },
  osmEl(10, { name: 'Ali Kuaför', shop: 'hairdresser', phone: '+90 216 555 11 22', 'addr:street': 'Bahariye Caddesi', 'addr:housenumber': '5', 'addr:city': 'İstanbul' }),
  osmEl(11, { name: 'Sitesi Olan Berber', shop: 'hairdresser', website: 'www.ornekberber.com', 'contact:phone': '0532 111 22 33' }),
  osmEl(12, { shop: 'hairdresser' }),
  { type: 'way', id: 13, center: { lat: 40.98, lon: 29.02 }, tags: { name: 'Zincir Saç', brand: 'Zincir', shop: 'hairdresser' } },
] };
const sahteGoogle = { places: [
  { id: 'ChIJgoogle00001', displayName: { text: 'Ali Kuaför Salonu' }, formattedAddress: 'Bahariye Cd. 5, Kadıköy/İstanbul', location: { latitude: 40.99001, longitude: 29.03001 }, businessStatus: 'OPERATIONAL', nationalPhoneNumber: '0216 555 11 22', rating: 3.5, userRatingCount: 150, googleMapsUri: 'https://maps.google.com/?cid=1' },
  { id: 'ChIJgoogle00002', displayName: { text: 'GizliAdBurada' }, formattedAddress: 'Moda Cd. 1, Kadıköy/İstanbul', businessStatus: 'OPERATIONAL', nationalPhoneNumber: '0216 999 88 77' },
  { id: 'ChIJgoogle00003', displayName: { text: 'Kapanmış' }, formattedAddress: 'Kadıköy/İstanbul', businessStatus: 'CLOSED_PERMANENTLY' },
  { id: 'ChIJgoogle00004', displayName: { text: 'Başka İl' }, formattedAddress: 'Merkez/Ankara', businessStatus: 'OPERATIONAL' },
], nextPageToken: 'SAYFA2' };

(async () => {
  // ---- Eşleme ----
  await dene('her program en az bir sektöre bağlı', () => {
    const bagli = new Set(SEKTORLER.flatMap((s) => [...s.programlar, ...(s.dolayli || [])]));
    for (const u of urunler) assert(bagli.has(u.id), 'eşlemesiz program: ' + u.id);
  });
  await dene('eşlemedeki her program products.js içinde var', () => { const v = new Set(urunler.map((u) => u.id)); for (const s of SEKTORLER) for (const id of [...s.programlar, ...(s.dolayli || [])]) assert(v.has(id), id); });
  await dene('program adı products.js alanından gelir', () => { const s = c.sektorAcik().find((x) => x.id === 'kuafor'); assert.strictEqual(s.programlar[0].ad, 'randevu sistemi'); assert.strictEqual(s.programlar[0].slug, 'randevusistemi'); });
  await dene('81 il, plaka sırası', () => { assert.strictEqual(ILLER.length, 81); assert.strictEqual(new Set(ILLER).size, 81); assert.strictEqual(ILLER[33], 'İstanbul'); assert.strictEqual(ILLER[5], 'Ankara'); assert.strictEqual(ILLER[34], 'İzmir'); assert.strictEqual(ILLER[80], 'Düzce'); });

  // ---- Arama ve sorgu ----
  await dene('ilçe büyük/küçük harf düzeltilir', () => { assert.strictEqual(c.aramaDogrula({ il: 'İstanbul', ilce: 'KADIKÖY', sektorId: 'kuafor' }).ilce, 'Kadıköy'); assert.strictEqual(c.trBaslik('ataşehir'), 'Ataşehir'); });
  await dene('sorgu dışına kaçış engellenir', () => { assert(c.aramaDogrula({ il: 'İstanbul', ilce: 'a"];out;', sektorId: 'kuafor' }).hata); assert(c.aramaDogrula({ il: 'Yok', sektorId: 'kuafor' }).hata); assert(c.aramaDogrula({ il: 'Ankara', sektorId: 'x' }).hata); });
  await dene('Overpass sorgusu il kodu ve etiket içerir', () => { const q = c.overpassSorgu(c.aramaDogrula({ il: 'İstanbul', ilce: 'Kadıköy', sektorId: 'restoran' })); assert(q.includes('"TR-34"') && q.includes('["name"="Kadıköy"]') && q.includes('nwr["amenity"="fast_food"](area.a)') && q.includes(`out center tags ${c.OVERPASS_LIMIT}`)); });
  await dene('Google maskesi joker içermez, sayfa jetonu vardır', () => { assert(!c.GOOGLE_MASKE_ARAMA.includes('*') && c.GOOGLE_MASKE_ARAMA.includes('nextPageToken') && !/\s/.test(c.GOOGLE_MASKE_ARAMA)); const g = c.googleGovde(c.aramaDogrula({ il: 'Ankara', sektorId: 'kuafor' }), 'T'); assert.strictEqual(g.pageSize, 20); assert.strictEqual(g.pageToken, 'T'); assert.strictEqual(g.regionCode, 'TR'); });

  // ---- Yanıt eşleme ----
  const ar = c.aramaDogrula({ il: 'İstanbul', ilce: 'Kadıköy', sektorId: 'kuafor' });
  const os_ = c.overpassCoz(sahteOverpass, ar), go = c.googleCoz(sahteGoogle, ar);
  await dene('OSM eşleme', () => {
    assert.strictEqual(os_.kayitlar.length, 3); assert.strictEqual(os_.adsiz, 1); assert(os_.ilVar && os_.ilceVar);
    const a = os_.kayitlar[0]; assert.strictEqual(a.anahtar, 'osm:node/10'); assert.strictEqual(a.telefon, '0216 555 11 22'); assert.strictEqual(a.adres, 'Bahariye Caddesi 5, İstanbul'); assert.strictEqual(a.webTur, 'yok'); assert.strictEqual(a.cep, false);
    assert.strictEqual(os_.kayitlar[1].web, 'https://www.ornekberber.com/'); assert.strictEqual(os_.kayitlar[1].cep, true); assert.strictEqual(os_.kayitlar[2].lat, 40.98); assert.strictEqual(os_.kayitlar[2].zincir, true);
  });
  await dene('OSM: ilçe sınırı yoksa bildirilir, kamu kurumu elenir', () => {
    assert.strictEqual(c.overpassCoz({ elements: [sahteOverpass.elements[0]] }, ar).ilceVar, false);
    assert.strictEqual(c.osmKaydi(osmEl(1, { name: 'Devlet Anaokulu', 'operator:type': 'public' })), null);
  });
  await dene('Google eşleme: kapalı ve il dışı elenir', () => { assert.strictEqual(go.kayitlar.length, 2); assert.strictEqual(go.ilDisi, 1); assert.strictEqual(go.sonrakiToken, 'SAYFA2'); assert.strictEqual(go.kayitlar[0].puanYildiz, 3.5); assert.strictEqual(go.kayitlar[0].telefon, '0216 555 11 22'); });
  await dene('telefon biçimleri', () => { for (const h of ['+90 532 111 22 33', '905321112233', '0090 532 1112233', '0532 111 22 33', '532-111-22-33']) assert.strictEqual(c.telefonCoz(h).anahtar, '5321112233', h); assert.strictEqual(c.telefonCoz('0212 111 22 33; 0212 444 55 66').goster, '0212 111 22 33'); assert.strictEqual(c.telefonCoz('').goster, ''); });
  await dene('web sınıflama ve güvenli adres', () => { assert.strictEqual(c.webCoz('javascript:alert(1)').url, ''); assert.strictEqual(c.webCoz('https://instagram.com/ali').tur, 'sosyal'); assert.strictEqual(c.webCoz('https://randevuonline.com').tur, 'platform'); assert.strictEqual(c.webCoz('https://www.ali.com.tr').alan, 'ali.com.tr'); assert.strictEqual(c.webCoz('').tur, 'yok'); });

  // ---- Puanlama ----
  const kuafor = c.sektorGetir('kuafor'), restoran = c.sektorGetir('restoran'), kobi = c.sektorGetir('kobi');
  await dene('Google web yok + randevu sektörü yüksek', () => { const p = c.puanla({ kaynak: 'google', webTur: 'yok', telefon: '0216 1' }, kuafor); assert.strictEqual(p.puan, 90); assert.strictEqual(p.seviye, 'yuksek'); assert.strictEqual(p.tahmin, true); assert(p.nedenler.some((n) => /çıkarım/.test(n))); });
  await dene('OSM eksikliği Google kadar güçlü sayılmaz', () => { const o = c.puanla({ kaynak: 'osm', webTur: 'yok', telefon: 'x' }, restoran), g = c.puanla({ kaynak: 'google', webTur: 'yok', telefon: 'x' }, restoran); assert(o.puan < g.puan); assert(o.nedenler.some((n) => /zayıf/.test(n))); });
  await dene('web sitesi olan düşük, platform kullanan daha düşük', () => { const v = c.puanla({ kaynak: 'google', webTur: 'var', telefon: 'x' }, kuafor), p = c.puanla({ kaynak: 'google', webTur: 'platform', telefon: 'x' }, kuafor); assert.strictEqual(v.seviye, 'orta'); assert(p.puan < v.puan); assert(v.nedenler.some((n) => /incelenmedi/.test(n))); });
  await dene('zincir, dolaylı ve telefonsuz kayıt düşer; aralık korunur', () => { const p = c.puanla({ kaynak: 'osm', webTur: 'var', zincir: true }, kobi); assert.strictEqual(p.puan, 0); assert.strictEqual(p.seviye, 'dusuk'); assert(p.puan >= 0); assert(c.puanla({ kaynak: 'google', webTur: 'yok', telefon: 'x', puanYildiz: 3, yorumSayisi: 500 }, kuafor).puan <= 100); });
  await dene('düşük puan ve çok yorum nedene yazılır', () => { const p = c.puanla({ kaynak: 'google', webTur: 'var', telefon: 'x', puanYildiz: 3.5, yorumSayisi: 150 }, restoran); assert(p.nedenler.some((n) => /3.5/.test(n)) && p.nedenler.some((n) => /150/.test(n))); });

  // ---- Mükerrer ----
  await dene('OSM ve Google aynı işletmeyi tekler, alan kopyalamaz', () => { const t = c.tekillestir([...os_.kayitlar, ...go.kayitlar]); assert.strictEqual(t.length, 4); const a = t.find((k) => k.ad.startsWith('Ali')); assert.strictEqual(a.kaynak, 'google'); assert.deepStrictEqual(a.eslesen, ['osm:node/10']); });
  await dene('aynı adlı uzak şubeler ayrı kalır', () => { const a = { anahtar: 'a', ad: 'Ali Kuaför', lat: 40, lon: 29 }, b = { anahtar: 'b', ad: 'Ali Kuaför', lat: 41, lon: 29 }; assert.strictEqual(c.tekillestir([a, b]).length, 2); });
  await dene('yakın ve kısmi ad birleşir', () => { assert(c.ayniIsletme({ anahtar: 'a', ad: 'Gültekin', lat: 40, lon: 29 }, { anahtar: 'b', ad: 'Gültekin Güzellik', lat: 40.0001, lon: 29 })); });
  await dene('aynı alan adlı, farklı adlı zincir şubeleri ayrı kalır', () => { assert(!c.ayniIsletme({ anahtar: 'a', ad: 'Zincir Moda', webTur: 'var', webAlan: 'z.com', lat: 40, lon: 29 }, { anahtar: 'b', ad: 'Zincir Beşiktaş', webTur: 'var', webAlan: 'z.com', lat: 41, lon: 29 })); });
  await dene('ortak çağrı merkezi numarası aynı işletme sayılmaz', () => { assert(!c.ayniIsletme({ anahtar: 'a', ad: 'Şube Bir', telAnahtar: '8505551122' }, { anahtar: 'b', ad: 'Şube İki', telAnahtar: '8505551122' })); assert(c.ayniIsletme({ anahtar: 'a', ad: 'Bir', telAnahtar: '2165551122' }, { anahtar: 'b', ad: 'İki', telAnahtar: '2165551122' })); });

  // ---- Aday ve saklama ----
  await dene('Google adayı yalnızca place_id ve kullanıcı alanı içerir', () => { const a = c.adayKaydi(go.kayitlar[0], { sektorId: 'kuafor', il: 'İstanbul', ilce: 'Kadıköy' }); for (const y of ['ad', 'adres', 'telefon', 'web', 'lat', 'lon', 'puanYildiz', 'yorumSayisi', 'harita', 'telAnahtar']) assert(!(y in a), y); assert.strictEqual(a.placeId, 'ChIJgoogle00001'); });
  await dene('geçersiz kimlikli kayıt reddedilir', () => { assert.strictEqual(c.adayKaydi({ anahtar: 'osm:node/1;x', kaynak: 'osm' }, {}), null); assert.strictEqual(c.adayKaydi({ anahtar: 'g:../x y', kaynak: 'google' }, {}), null); });
  await dene('durum güncelleme doğrulanır', () => { const a = c.adayKaydi(os_.kayitlar[0], { sektorId: 'kuafor' }); assert.strictEqual(c.adayGuncelle(a, { durum: 'teklif' }).durum, 'teklif'); assert.strictEqual(c.adayGuncelle(a, { durum: 'gecersiz' }), null); assert.strictEqual(c.adayGuncelle(a, { sonrakiArama: '12.05.2026' }), null); assert.strictEqual(c.adayGuncelle(a, { ret: true }).ret, true); });
  await dene('saklama süresi: eski silinir; kazanılan ve ileri tarihli kalır; ret kimlik siler', () => {
    const simdi = new Date('2026-10-30T10:00:00Z'), eski = '2026-01-01T00:00:00Z', tem = c.adayKaydi(os_.kayitlar[0], {}, new Date(eski));
    const l = [{ ...tem, anahtar: 'osm:node/1' }, { ...tem, anahtar: 'osm:node/2', durum: 'kazanildi' }, { ...tem, anahtar: 'osm:node/3', sonrakiArama: '2026-12-01' }, { ...tem, anahtar: 'osm:node/4', ret: true }, { ...tem, anahtar: 'osm:node/5', guncelleme: '2026-10-29T00:00:00Z' }];
    const r = c.saklamaUygula(l, 180, simdi); assert.strictEqual(r.silinen, 1); assert.strictEqual(r.kisilen, 1); assert.strictEqual(r.kalan.length, 4);
    const k = r.kalan.find((a) => a.anahtar === 'osm:node/4'); assert.strictEqual(k.ad, ''); assert.strictEqual(k.telefon, ''); assert.strictEqual(k.ret, true);
  });

  // ---- CSV ----
  await dene('CSV: Excel uyumlu, Google içeriği yok, atıf var', () => {
    const a = c.adayKaydi(os_.kayitlar[0], { sektorId: 'kuafor', il: 'İstanbul', ilce: 'Kadıköy' }), g = c.adayKaydi(go.kayitlar[1], { sektorId: 'kuafor', il: 'İstanbul', ilce: 'Kadıköy' });
    const s = c.csvUret([{ ...a, not: 'iki;nokta "tırnak"\nsatır' }, g]);
    assert(s.startsWith('﻿Durum;')); assert(!s.includes('GizliAdBurada') && !s.includes('999 88 77')); assert(s.includes('ChIJgoogle00002')); assert(s.includes('OpenStreetMap') && s.includes('ODbL')); assert(s.includes('"iki;nokta ""tırnak""\nsatır"')); assert(s.includes('randevu sistemi'));
  });
  await dene('CSV formül enjeksiyonu engellenir', () => { assert.strictEqual(c.csvHucre('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`); assert.strictEqual(c.csvHucre('+905321112233'), "'+905321112233"); assert.strictEqual(c.csvHucre('@a'), "'@a"); assert.strictEqual(c.csvHucre('Normal'), 'Normal'); });

  // ---- İlk temas ----
  await dene('temas metni yasal öğeleri içerir, boşlar yer tutucu kalır', () => { const t = c.ilkTemas({ ad: 'Ali Kuaför', webTur: 'yok' }, kuafor, {}); assert(t.telefon.startsWith('Bu bir tanıtım aramasıdır')); assert(t.yazili.startsWith('Tanıtım:')); assert(t.yazili.includes('[MERSİS') && t.yazili.includes('[ücretsiz ret yolu') && t.yazili.includes('randevusistemi')); assert(t.telefon.includes('Ali Kuaför') && t.telefon.includes('web sitesi göremedim')); });
  await dene('gönderen bilgileri metne girer; web varsa iddia edilmez', () => { const t = c.ilkTemas({ ad: 'X', webTur: 'var' }, restoran, { unvan: 'NEB A.Ş.', kimlik: '0123', telefon: '0212', retYolu: '0850', site: 'https://a.com/', aydinlatma: 'https://a.com/k' }); assert(t.yazili.includes('NEB A.Ş. (0123)') && t.yazili.includes('https://a.com/adisyonprogrami')); assert(!t.yazili.includes('göremedim') && !t.yazili.includes('[')); });

  await dene('sosyal medyası olana "web sitesi yok" denmez', () => { const t = c.ilkTemas({ ad: 'X', webTur: 'sosyal' }, kuafor, {}); assert(t.telefon.includes('sosyal medya') && !t.telefon.includes('göremedim')); });

  // ---- Toplu gönderim yok ----
  await dene('kodda SMS/e-posta gönderimi yok', () => { for (const f of ['baslat.js', 'cekirdek.js', 'arayuz.html']) { const k = fs.readFileSync(path.join(__dirname, f), 'utf8'); assert(!/nodemailer|smtp|net\.createConnection|mailto:|sms:|wa\.me\/\d|api\.whatsapp/i.test(k), f); } });

  // ---- Sunucu (sahte fetch) ----
  const dizin = fs.mkdtempSync(path.join(os.tmpdir(), 'pazarlama-test-'));
  const istekler = []; let cagri = { overpass: 0, google: 0 }, overpassKod = 200;
  const sahteFetch = async (url, s) => {
    istekler.push({ url, s });
    const yanit = (status, o) => ({ status, ok: status < 400, json: async () => o });
    if (url.includes('overpass')) { cagri.overpass++; return overpassKod === 200 ? yanit(200, sahteOverpass) : yanit(overpassKod, {}); }
    if (url.includes('places:searchText')) { cagri.google++; return yanit(200, sahteGoogle); }
    if (url.includes('places/ChIJ')) return url.includes('ChIJyokyok0') ? yanit(404, { error: { message: 'yok' } }) : yanit(200, sahteGoogle.places[1]);
    throw new Error('beklenmeyen adres ' + url);
  };
  const { sunucu, depo } = olustur({ veriDizini: dizin, fetchFn: sahteFetch });
  await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
  const port = sunucu.address().port, taban = `http://127.0.0.1:${port}`;
  const post = async (p, b, h = {}) => { const r = await fetch(taban + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...h }, body: JSON.stringify(b) }); return { d: r.status, j: await r.json().catch(() => null) }; };
  const diskte = (m) => fs.readdirSync(dizin).some((f) => fs.readFileSync(path.join(dizin, f), 'utf8').includes(m));
  const arama = { il: 'İstanbul', ilce: 'Kadıköy', sektorId: 'kuafor' };

  await dene('yalnızca 127.0.0.1 ve dış köken reddi', async () => {
    assert.strictEqual(sunucu.address().address, '127.0.0.1');
    assert.strictEqual((await post('/api/baslangic', {}, { Origin: 'https://kotu.example' })).d, 403);
    assert.strictEqual((await post('/api/baslangic', {}, { 'Sec-Fetch-Site': 'cross-site' })).d, 403);
    const r = await fetch(taban + '/api/aday/sil', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }); assert.strictEqual(r.status, 415);
  });
  await dene('Host başlığı denetlenir (DNS rebinding)', () => new Promise((tam, red) => { require('http').get({ host: '127.0.0.1', port, path: '/', headers: { Host: 'kotu.example' } }, (r) => { r.resume(); r.statusCode === 403 ? tam() : red(new Error('kod ' + r.statusCode)); }).on('error', red); }));
  await dene('arayüz sunulur, CSP var', async () => { const r = await fetch(taban + '/'); assert.strictEqual(r.status, 200); assert(r.headers.get('content-security-policy').includes("default-src 'none'")); assert((await r.text()).includes('NEBSOFT Pazarlama')); });
  await dene('OSM araması, 24 saat önbellek, tanıtıcı User-Agent', async () => {
    const r = await post('/api/ara', { ...arama, kaynak: 'osm' }); assert.strictEqual(r.d, 200); assert.strictEqual(r.j.kayitlar.length, 3); assert(r.j.kayitlar[0].nedenler.length && r.j.kayitlar[0].tahmin); assert.strictEqual(cagri.overpass, 1); assert(/NEBSOFT/.test(istekler[0].s.headers['User-Agent']));
    const r2 = await post('/api/ara', { ...arama, kaynak: 'osm' }); assert.strictEqual(cagri.overpass, 1); assert(r2.j.uyarilar.some((u) => /önbellek/.test(u)));
  });
  await dene('429 sonrası 30 sn beklenir ve ağa çıkılmaz', async () => {
    overpassKod = 429; const b = { ...arama, ilce: 'Üsküdar' };
    assert.strictEqual((await post('/api/ara', { ...b, kaynak: 'osm' })).d, 429); const n = cagri.overpass;
    const r = await post('/api/ara', { ...b, kaynak: 'osm' }); assert.strictEqual(r.d, 429); assert(/saniye/.test(r.j.hata)); assert.strictEqual(cagri.overpass, n); overpassKod = 200;
  });
  await dene('günlük Overpass sınırı uygulanır', async () => {
    // Ayrı sunucu: üstteki 429 testinin 30 sn beklemesi bu testi yanıltmasın
    const dz = fs.mkdtempSync(path.join(os.tmpdir(), 'pazarlama-sinir-')); let ag = 0;
    const s2 = olustur({ veriDizini: dz, fetchFn: async () => { ag++; throw new Error('ağa çıkılmamalı'); } });
    await new Promise((r) => s2.sunucu.listen(0, '127.0.0.1', r));
    s2.depo.sayac.gun = new Date().toISOString().slice(0, 10); s2.depo.sayac.overpass = 100;
    const r = await fetch(`http://127.0.0.1:${s2.sunucu.address().port}/api/ara`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...arama, kaynak: 'osm' }) }), j = await r.json();
    await new Promise((t) => { s2.sunucu.close(t); s2.sunucu.closeAllConnections(); }); fs.rmSync(dz, { recursive: true, force: true });
    assert.strictEqual(r.status, 429); assert(/Günlük/.test(j.hata), j.hata); assert.strictEqual(ag, 0);
  });
  await dene('Google varsayılan kapalı; anahtar yetmez, onay gerekir', async () => {
    assert.strictEqual((await post('/api/ara', { ...arama, kaynak: 'google' })).d, 400); assert.strictEqual(cagri.google, 0);
    assert.strictEqual((await post('/api/ayar', { googleOnay: true })).d, 400);
    const r = await post('/api/ayar', { googleAnahtar: ANAHTAR }); assert.strictEqual(r.j.googleKayitli, true); assert.strictEqual(r.j.googleHazir, false); assert(!JSON.stringify(r.j).includes(ANAHTAR));
    assert.strictEqual((await post('/api/ara', { ...arama, kaynak: 'google' })).d, 400);
    assert.strictEqual((await post('/api/ayar', { googleOnay: true })).j.googleHazir, true);
  });
  await dene('Google araması: maske, başlık; içerik diske yazılmaz', async () => {
    const r = await post('/api/ara', { ...arama, kaynak: 'google' }); assert.strictEqual(r.d, 200); assert.strictEqual(r.j.kayitlar.length, 2); assert.strictEqual(r.j.sonrakiToken, 'SAYFA2');
    const g = istekler.find((i) => i.url.includes('searchText')); assert.strictEqual(g.s.headers['X-Goog-Api-Key'], ANAHTAR); assert.strictEqual(g.s.headers['X-Goog-FieldMask'], c.GOOGLE_MASKE_ARAMA); assert(!g.url.includes(ANAHTAR));
    assert(!diskte('GizliAdBurada') && !diskte('999 88 77'));
  });
  await dene('Google adayı eklenince diskte yalnız place_id kalır; CSV temiz', async () => {
    const r = await post('/api/ara', { ...arama, kaynak: 'google' }); const k = r.j.kayitlar.find((x) => x.ad === 'GizliAdBurada');
    assert.strictEqual((await post('/api/aday/ekle', { kayitlar: [k], ...arama })).j.eklenen, 1);
    assert(diskte('ChIJgoogle00002') && !diskte('GizliAdBurada') && !diskte('Moda Cd'));
    assert.strictEqual((await post('/api/aday/ekle', { kayitlar: [k], ...arama })).j.eklenen, 0);
    const csv = await (await fetch(taban + '/api/csv')).text(); assert(csv.includes('ChIJgoogle00002') && !csv.includes('GizliAdBurada'));
  });
  await dene('kayıtlı Google adayı canlı getirilir, yine saklanmaz', async () => { const r = await post('/api/google/ayrinti', { placeId: 'ChIJgoogle00002' }); assert.strictEqual(r.j.kayit.ad, 'GizliAdBurada'); assert(r.j.kayit.nedenler.length); assert(!diskte('GizliAdBurada')); assert.strictEqual((await post('/api/google/ayrinti', { placeId: 'ChIJyokyok0' })).d, 404); });
  await dene('aday akışı: ekle, güncelle, ret, sil', async () => {
    const r = await post('/api/ara', { ...arama, kaynak: 'osm' }); const k = r.j.kayitlar.find((x) => x.anahtar === 'osm:node/11');
    await post('/api/aday/ekle', { kayitlar: [k], ...arama }); assert(diskte('Sitesi Olan Berber')); // OSM verisi saklanabilir
    assert.strictEqual((await post('/api/aday/guncelle', { anahtar: k.anahtar, durum: 'teklif', not: 'Salı aranacak', sonrakiArama: '2026-11-03', ret: true })).j.aday.durum, 'teklif');
    const ar2 = await post('/api/ara', { ...arama, kaynak: 'osm' }), k2 = ar2.j.kayitlar.find((x) => x.anahtar === k.anahtar); assert.strictEqual(k2.kayitli, true); assert.strictEqual(k2.ret, true);
    const l = await post('/api/adaylar', {}); assert.strictEqual(l.j.adaylar.length, 2); assert(/query_place_id=ChIJgoogle00002/.test(l.j.adaylar.find((a) => a.kaynak === 'google').harita));
    assert.strictEqual((await post('/api/aday/guncelle', { anahtar: 'yok', durum: 'teklif' })).d, 404);
    assert.strictEqual((await post('/api/aday/sil', { anahtar: k.anahtar })).j.silinen, 1); assert(!fs.readFileSync(path.join(dizin, '.adaylar.json'), 'utf8').includes('Sitesi Olan Berber'));
  });
  await dene('OSM reddi aynı telefonlu Google sonucuna da işler', async () => {
    const o = (await post('/api/ara', { ...arama, kaynak: 'osm' })).j.kayitlar.find((x) => x.anahtar === 'osm:node/10');
    await post('/api/aday/ekle', { kayitlar: [o], ...arama }); await post('/api/aday/guncelle', { anahtar: o.anahtar, ret: true });
    const g = (await post('/api/ara', { ...arama, kaynak: 'google' })).j.kayitlar.find((x) => x.anahtar === 'g:ChIJgoogle00001');
    assert.strictEqual(g.ret, true); assert.strictEqual(g.kayitli, true); await post('/api/aday/sil', { anahtar: o.anahtar });
  });
  await dene('büyük veri: 5.000 aday ve 300 sonuç akıcı kalır', async () => {
    const yedek = depo.adaylar, tar = new Date().toISOString();
    depo.adaylar = Array.from({ length: 5000 }, (_, i) => ({ anahtar: `osm:node/${900000 + i}`, kaynak: 'osm', ad: `Örnek İşletme ${i}`, adres: '', telefon: '', telAnahtar: String(2160000000 + i), webTur: 'yok', lat: 40 + i / 1e4, lon: 29, durum: 'yeni', guncelleme: tar, sektorId: 'kuafor', il: 'İstanbul', ilce: 'Kadıköy' }));
    const onceki = Array.from({ length: 300 }, (_, i) => ({ anahtar: `osm:node/${i + 100}`, kaynak: 'osm', ad: `Yeni Salon ${i}`, adres: '', telefon: '', telAnahtar: '', webTur: 'yok', lat: 41 + i / 1e3, lon: 30 }));
    const t = Date.now(), r = await post('/api/ara', { ...arama, kaynak: 'osm', onceki }), l = await post('/api/adaylar', {}); const ms = Date.now() - t;
    depo.adaylar = yedek; assert.strictEqual(r.d, 200); assert.strictEqual(l.j.adaylar.length, 5000); assert(ms < 1500, ms + ' ms');
  });
  await dene('tümünü sil: aday ve önbellek gider, onaysız çalışmaz', async () => {
    assert.strictEqual((await post('/api/temizle', {})).d, 400); assert.strictEqual((await post('/api/temizle', { onay: 'SİL' })).j.adaySayisi, 0);
    assert.strictEqual(fs.readdirSync(dizin).filter((f) => f.startsWith('.onbellek-')).length, 0); assert(!diskte('Ali Kuaför'));
  });
  await dene('bozuk gövde sunucuyu düşürmez', async () => { const r = await fetch(taban + '/api/ara', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bozuk' }); assert.strictEqual(r.status, 400); });
  await dene('anahtar silinince Google kapanır', async () => { const r = await post('/api/ayar', { googleSil: true }); assert.strictEqual(r.j.googleHazir, false); assert(!diskte(ANAHTAR)); });
  await new Promise((r) => { sunucu.close(r); sunucu.closeAllConnections(); });

  // ---- Ana sunucudan koruma ----
  let denyUyari = '';
  await dene('veri dosyaları ana server.js DENY kuralına takılır', () => {
    const k = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8'); const m = k.match(/const DENY = (\/.+\/i);/); assert(m, 'DENY bulunamadı');
    const DENY = eval(m[1]); for (const f of ['.ayar.json', '.adaylar.json', '.sayac.json', '.onbellek-abc.json']) assert(DENY.test('/ic-araclar/nebsoftpazarlama/veri/' + f), f);
    if (!DENY.test('/ic-araclar/nebsoftpazarlama/arayuz.html')) denyUyari = 'server.js DENY listesinde ic-araclar yok: araç kodu ana sunucudan görülebilir (docs/PAZARLAMA-ARACI.md).';
  });
  fs.rmSync(dizin, { recursive: true, force: true });

  console.log(`\n${gecen} test geçti, ${hatalar.length} başarısız.`); if (denyUyari) console.log('UYARI: ' + denyUyari);
  for (const h of hatalar) console.log('  HATA ' + h);
  process.exit(hatalar.length ? 1 : 0);
})();
