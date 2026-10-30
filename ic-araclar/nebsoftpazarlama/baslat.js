// NEBSOFT Pazarlama: kullanıcıya özel yerel araç. Çalıştır: node ic-araclar/nebsoftpazarlama/baslat.js  (http://127.0.0.1:5090)
// Yalnızca 127.0.0.1'e bağlanır; toplu SMS/e-posta gönderen hiçbir kod yoktur. Hukuk ve kaynaklar: docs/PAZARLAMA-ARACI.md
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const c = require('./cekirdek');

const HOST = '127.0.0.1'; // bilinçli olarak ayarlanamaz
const OVERPASS_URL = process.env.PAZARLAMA_OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const UA = 'NEBSOFT-Pazarlama/1.0 (tek kullanicili yerel arac; +https://www.nebsoft.com.tr)';
const GOOGLE_METIN = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_AYRINTI = 'https://places.googleapis.com/v1/places/';
const ONBELLEK_MS = 24 * 3600e3, BEKLEME_MS = 30e3, OVERPASS_GUNLUK = 100, ZAMAN_ASIMI = 60e3;
const VARSAYILAN_AYAR = { googleAnahtar: '', googleOnay: false, saklamaGun: 180, gonderen: { unvan: '', kimlik: '', telefon: '', retYolu: '', aydinlatma: '', site: '' } };

// Tüm veri dosyalarının adı noktayla başlar: ana server.js yanlışlıkla bu klasörü sunsa bile DENY kuralı (/\.[^/]+$) gizli dosyayı vermez.
function depoAc(dizin) {
  const yol = (ad) => path.join(dizin, ad);
  fs.mkdirSync(dizin, { recursive: true });
  const oku = (ad, v) => { try { return { ...v, ...JSON.parse(fs.readFileSync(yol(ad), 'utf8')) }; } catch (e) { return v; } };
  const yaz = (ad, o) => { const g = yol(ad + '.gecici'); fs.writeFileSync(g, JSON.stringify(o), { mode: 0o600 }); fs.renameSync(g, yol(ad)); };
  const ayarHam = oku('.ayar.json', {});
  const d = {
    ayar: { ...VARSAYILAN_AYAR, ...ayarHam, gonderen: { ...VARSAYILAN_AYAR.gonderen, ...(ayarHam.gonderen || {}) } },
    adaylar: oku('.adaylar.json', { liste: [] }).liste,
    sayac: oku('.sayac.json', { gun: '', overpass: 0, ay: '', googleArama: 0, googleAyrinti: 0 }),
    ayarYaz() { yaz('.ayar.json', d.ayar); }, adayYaz() { yaz('.adaylar.json', { liste: d.adaylar }); }, sayacYaz() { yaz('.sayac.json', d.sayac); },
    onbellekOku(a) { const f = yol('.onbellek-' + a + '.json'); try { const o = JSON.parse(fs.readFileSync(f, 'utf8')); if (Date.now() - o.t < ONBELLEK_MS) return o.v; fs.unlinkSync(f); } catch (e) { /* yok */ } return null; },
    onbellekYaz(a, v) { fs.writeFileSync(yol('.onbellek-' + a + '.json'), JSON.stringify({ t: Date.now(), v }), { mode: 0o600 }); },
    onbellekTemizle(hepsi) { for (const f of fs.readdirSync(dizin)) { if (!f.startsWith('.onbellek-')) continue; const p = yol(f); try { if (hepsi || Date.now() - fs.statSync(p).mtimeMs > ONBELLEK_MS) fs.unlinkSync(p); } catch (e) { /* yarış */ } } },
  };
  return d;
}

function olustur({ veriDizini = path.join(__dirname, 'veri'), fetchFn = fetch, simdi = () => new Date() } = {}) {
  const d = depoAc(veriDizini);
  let overpassMesgul = false, overpassBekle = 0;
  const hata = (code, mesaj, ek) => Object.assign(new Error(mesaj), { code, ek });
  const saklama = () => { const r = c.saklamaUygula(d.adaylar, d.ayar.saklamaGun, simdi()); if (r.silinen || r.kisilen) { d.adaylar = r.kalan; d.adayYaz(); } d.onbellekTemizle(false); return r; };
  const sayacTazele = () => { const t = simdi().toISOString(), gun = t.slice(0, 10), ay = t.slice(0, 7); if (d.sayac.gun !== gun) { d.sayac.gun = gun; d.sayac.overpass = 0; } if (d.sayac.ay !== ay) { d.sayac.ay = ay; d.sayac.googleArama = 0; d.sayac.googleAyrinti = 0; } return d.sayac; };
  const googleHazir = () => !!(d.ayar.googleAnahtar && d.ayar.googleOnay);

  async function zamanli(url, secenek) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ZAMAN_ASIMI);
    try { return await fetchFn(url, { ...secenek, signal: ctrl.signal }); }
    catch (e) { throw hata(502, e.name === 'AbortError' ? 'Servis zamanında yanıt vermedi. Daha sonra yeniden deneyin.' : 'Servise bağlanılamadı. İnternet bağlantınızı kontrol edin.'); }
    finally { clearTimeout(t); }
  }

  // Overpass adil kullanım: aynı anda tek istek, sonuç 24 saat önbellekte, 429/406'da 30 sn bekleme, günlük üst sınır (düzenli kullanım için 10.000/100)
  async function overpassAra(arama) {
    const sorgu = c.overpassSorgu(arama), a = crypto.createHash('sha256').update(sorgu).digest('hex').slice(0, 32);
    const hazir = d.onbellekOku(a); if (hazir) return { ...hazir, onbellek: true };
    const kalan = overpassBekle - Date.now();
    if (kalan > 0) throw hata(429, `Overpass yoğun. ${Math.ceil(kalan / 1000)} saniye sonra yeniden deneyin.`);
    if (overpassMesgul) throw hata(429, 'Bir Overpass sorgusu sürüyor. Bitmesini bekleyin.');
    const s = sayacTazele(); if (s.overpass >= OVERPASS_GUNLUK) throw hata(429, `Günlük Overpass sınırına (${OVERPASS_GUNLUK}) ulaşıldı. Önbellekteki aramalar çalışmaya devam eder.`);
    overpassMesgul = true;
    try {
      s.overpass++; d.sayacYaz();
      const r = await zamanli(OVERPASS_URL, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(sorgu) });
      if (r.status === 429 || r.status === 406) { overpassBekle = Date.now() + BEKLEME_MS; throw hata(429, 'Overpass şu an sınırda. 30 saniye bekleyip yeniden deneyin.'); }
      if (!r.ok) throw hata(502, `Overpass yanıt vermedi (${r.status}). Sunucu yoğun olabilir; biraz sonra deneyin.`);
      let veri; try { veri = await r.json(); } catch (e) { throw hata(502, 'Overpass geçersiz yanıt verdi.'); }
      if (veri.remark && /runtime error|timed out|out of memory/i.test(veri.remark)) throw hata(502, 'Sorgu Overpass zaman sınırını aştı. İlçe seçerek aramayı daraltın.');
      const sonuc = c.overpassCoz(veri, arama);
      if (!sonuc.ilVar) throw hata(422, `${arama.il} için sınır kaydı bulunamadı.`);
      if (!sonuc.ilceVar) throw hata(422, `"${arama.ilce}" ilçesi ${arama.il} içinde bulunamadı. Yazımı kontrol edin.`);
      d.onbellekYaz(a, sonuc);
      return sonuc;
    } finally { overpassMesgul = false; }
  }

  // Yanıt yalnızca tarayıcıya aktarılır; diske ve önbelleğe yazılmaz. Anahtar hata metnine sızmaz.
  async function googleIstek(url, secenek) {
    const r = await zamanli(url, secenek);
    let j = {}; try { j = await r.json(); } catch (e) { /* gövde yok */ }
    if (r.ok) return j;
    const m = String((j.error && j.error.message) || '').split(d.ayar.googleAnahtar).join('***').slice(0, 200);
    if (r.status === 403 || r.status === 401) throw hata(502, 'Google anahtarı reddedildi. Anahtarı, Places API (New) iznini ve faturalandırmayı kontrol edin.');
    if (r.status === 429) throw hata(429, 'Google kotası doldu.');
    if (r.status === 404) throw hata(404, 'Bu place_id artık geçerli değil.');
    throw hata(502, `Google hatası (${r.status}). ${m}`);
  }
  async function googleAra(arama, sayfaToken) {
    const j = await googleIstek(GOOGLE_METIN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': d.ayar.googleAnahtar, 'X-Goog-FieldMask': c.GOOGLE_MASKE_ARAMA }, body: JSON.stringify(c.googleGovde(arama, sayfaToken)) });
    const s = sayacTazele(); s.googleArama++; d.sayacYaz();
    return c.googleCoz(j, arama);
  }
  async function googleAyrinti(placeId) {
    if (!/^[\w-]{10,300}$/.test(placeId)) throw hata(400, 'Geçersiz place_id.');
    const j = await googleIstek(GOOGLE_AYRINTI + encodeURIComponent(placeId) + '?languageCode=tr&regionCode=TR', { method: 'GET', headers: { 'X-Goog-Api-Key': d.ayar.googleAnahtar, 'X-Goog-FieldMask': c.GOOGLE_MASKE_AYRINTI } });
    const s = sayacTazele(); s.googleAyrinti++; d.sayacYaz();
    return c.googleKaydi(j);
  }

  const indeks = () => ({ an: new Set(d.adaylar.map((a) => a.anahtar)), ret: new Set(d.adaylar.filter((a) => a.ret).map((a) => a.anahtar)), osm: d.adaylar.filter((a) => a.kaynak === 'osm' && a.ad) });
  // Ret bilgisi kaynaktan bağımsızdır: OSM'de reddeden işletme Google'dan aynı telefonla gelirse de aranmaz
  const sus = (k, s, x) => { const es = [k.anahtar, ...(k.eslesen || [])], m = x.osm.find((a) => c.ayniIsletme(a, k)); return { ...k, ...c.puanla(k, s), kayitli: !!m || es.some((e) => x.an.has(e)), ret: !!(m && m.ret) || es.some((e) => x.ret.has(e)) }; };
  const durum = () => {
    const s = sayacTazele();
    return { ok: true, googleKayitli: !!d.ayar.googleAnahtar, googleOnay: d.ayar.googleOnay, googleHazir: googleHazir(), saklamaGun: d.ayar.saklamaGun, gonderen: d.ayar.gonderen, sayac: { overpass: s.overpass, overpassSinir: OVERPASS_GUNLUK, googleArama: s.googleArama, googleAyrinti: s.googleAyrinti, ay: s.ay }, adaySayisi: d.adaylar.length };
  };

  async function apiIsle(p, b) {
    if (p === '/api/baslangic') return { ...durum(), sektorler: c.sektorAcik(), iller: c.ILLER, durumlar: c.DURUMLAR, osmLisans: c.OSM_LISANS };
    if (p === '/api/ayar') {
      if (typeof b.googleAnahtar === 'string' && b.googleAnahtar.trim()) { const k = b.googleAnahtar.trim(); if (!/^[\w-]{20,100}$/.test(k)) throw hata(400, 'Anahtar biçimi geçersiz.'); d.ayar.googleAnahtar = k; }
      if (b.googleSil) { d.ayar.googleAnahtar = ''; d.ayar.googleOnay = false; }
      if (b.googleOnay !== undefined) { if (b.googleOnay && !d.ayar.googleAnahtar) throw hata(400, 'Önce anahtarı kaydedin.'); d.ayar.googleOnay = !!b.googleOnay; }
      if (b.saklamaGun !== undefined) { const g = Math.round(Number(b.saklamaGun)); if (!(g >= 7 && g <= 1095)) throw hata(400, 'Saklama süresi 7 ile 1095 gün arasında olmalı.'); d.ayar.saklamaGun = g; }
      if (b.gonderen && typeof b.gonderen === 'object') for (const a of Object.keys(VARSAYILAN_AYAR.gonderen)) if (b.gonderen[a] !== undefined) d.ayar.gonderen[a] = String(b.gonderen[a]).trim().slice(0, 300);
      d.ayarYaz();
      return { ...durum(), saklama: saklama() };
    }
    if (p === '/api/ara') {
      const ar = c.aramaDogrula(b); if (ar.hata) throw hata(400, ar.hata);
      const kaynak = ['osm', 'google', 'ikisi'].includes(b.kaynak) ? b.kaynak : 'osm';
      if (kaynak !== 'osm' && !googleHazir()) throw hata(400, 'Google kaynağı kapalı. Ayarlar sekmesinden anahtarı girip koşulları onaylayın.');
      const onceki = Array.isArray(b.onceki) ? b.onceki.slice(0, 1000) : [];
      let yeni = [], sonrakiToken = ''; const u = [], k = {};
      if (b.sayfaToken) { const g = await googleAra(ar, String(b.sayfaToken)); yeni = g.kayitlar; sonrakiToken = g.sonrakiToken; k.google = g.kayitlar.length; } else {
        if (kaynak !== 'google') {
          try { const o = await overpassAra(ar); yeni.push(...o.kayitlar); k.osm = o.kayitlar.length; if (o.onbellek) u.push('OpenStreetMap sonucu önbellekten geldi (24 saatten yeni).'); if (o.kesildi) u.push(`OpenStreetMap sonucu ${c.OVERPASS_LIMIT} kayıtla kesildi; ilçe seçerek daraltın.`); if (o.adsiz) u.push(`${o.adsiz} adsız veya kamu kaydı gösterilmedi.`); } catch (e) { if (kaynak === 'osm') throw e; u.push('OpenStreetMap: ' + e.message); }
        }
        if (kaynak !== 'osm') { const g = await googleAra(ar); yeni.push(...g.kayitlar); sonrakiToken = g.sonrakiToken; k.google = g.kayitlar.length; if (g.ilDisi) u.push(`${g.ilDisi} Google sonucu seçilen il dışında olduğu için gösterilmedi.`); }
      }
      const x = indeks(), liste = c.tekillestir([...onceki, ...yeni]).map((r) => sus(r, ar.sektor, x)).sort((p, q) => q.puan - p.puan);
      const elenen = onceki.length + yeni.length - liste.length; if (elenen > 0) u.push(`${elenen} mükerrer kayıt elendi.`);
      if (!liste.length) u.push('Bu aramada işletme bulunamadı. OpenStreetMap Türkiye\'de eksik olabilir; ilçeyi kaldırmayı veya başka kaynağı deneyin.');
      return { ok: true, kayitlar: liste, uyarilar: u, adetler: k, sonrakiToken, sayac: durum().sayac, arama: { il: ar.il, ilce: ar.ilce, sektorId: ar.sektor.id } };
    }
    if (p === '/api/google/ayrinti') { if (!googleHazir()) throw hata(400, 'Google kaynağı kapalı.'); const a = d.adaylar.find((x) => x.placeId === b.placeId); const k = await googleAyrinti(String(b.placeId || '')); if (!k) throw hata(404, 'İşletme kalıcı olarak kapanmış görünüyor.'); const s = a && c.sektorGetir(a.sektorId); return { ok: true, kayit: { ...k, ...c.puanla(k, s) }, sayac: durum().sayac }; }
    if (p === '/api/adaylar') { saklama(); return { ok: true, adaylar: d.adaylar.map((a) => { const s = c.sektorGetir(a.sektorId); return { ...a, ...(a.kaynak === 'osm' && a.ad ? c.puanla(a, s) : {}), harita: a.kaynak === 'google' ? c.googleHaritaBag(a.placeId, [a.ilce, a.il].filter(Boolean).join(' ')) : a.harita }; }), ...durum() }; }
    if (p === '/api/aday/ekle') {
      const yeni = (Array.isArray(b.kayitlar) ? b.kayitlar : [b.kayit]).filter(Boolean).slice(0, 500); let eklenen = 0;
      const an = new Set(d.adaylar.map((a) => a.anahtar)), osm = d.adaylar.filter((a) => a.kaynak === 'osm' && a.ad);
      for (const k of yeni) { const a = c.adayKaydi(k, b, simdi()); if (!a || an.has(a.anahtar) || (k.eslesen || []).some((e) => an.has(e)) || (a.kaynak === 'osm' && osm.some((x) => c.ayniIsletme(x, a)))) continue; d.adaylar.push(a); an.add(a.anahtar); if (a.kaynak === 'osm') osm.push(a); eklenen++; }
      if (eklenen) d.adayYaz(); return { ok: true, eklenen, ...durum() };
    }
    if (p === '/api/aday/guncelle') { const i = d.adaylar.findIndex((a) => a.anahtar === b.anahtar); if (i < 0) throw hata(404, 'Aday bulunamadı.'); const y = c.adayGuncelle(d.adaylar[i], b, simdi()); if (!y) throw hata(400, 'Geçersiz değer.'); d.adaylar[i] = y; d.adayYaz(); return { ok: true, aday: y }; }
    if (p === '/api/aday/sil') { const n = d.adaylar.length; d.adaylar = d.adaylar.filter((a) => a.anahtar !== b.anahtar); d.adayYaz(); return { ok: true, silinen: n - d.adaylar.length }; }
    if (p === '/api/temizle') { if (b.onay !== 'SİL') throw hata(400, 'Onay metni eksik.'); d.adaylar = []; d.adayYaz(); d.onbellekTemizle(true); return { ok: true, ...durum() }; }
    if (p === '/api/temas') { const s = c.sektorGetir(b.sektorId); if (!s) throw hata(400, 'Sektör bilinmiyor.'); return { ok: true, ...c.ilkTemas(b.kayit || {}, s, d.ayar.gonderen), serbestMeslek: !!s.serbestMeslek }; }
    throw hata(404, 'Bilinmeyen uç nokta.');
  }

  // Yerel araçlara yönelik saldırılara karşı: başka site tarayıcı üzerinden bu porta istek atamaz, DNS rebinding işe yaramaz.
  const izinliMi = (req, gercekPort) => {
    const h = String(req.headers.host || ''); if (h !== `127.0.0.1:${gercekPort}` && h !== `localhost:${gercekPort}`) return false;
    if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return false;
    const o = req.headers.origin; return !o || o === `http://${h}`;
  };
  const gonder = (res, code, tur, govde, ek = {}) => { res.writeHead(code, { 'Content-Type': tur, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', ...ek }); res.end(govde); };
  const json = (res, code, o) => gonder(res, code, 'application/json; charset=utf-8', JSON.stringify(o));
  const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'";

  const sunucu = http.createServer(async (req, res) => {
    const gercekPort = sunucu.address().port;
    if (!izinliMi(req, gercekPort)) return gonder(res, 403, 'text/plain; charset=utf-8', 'Yalnızca bu bilgisayardan erişilebilir.');
    const p = req.url.split('?')[0];
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) return fs.readFile(path.join(__dirname, 'arayuz.html'), (e, t) => e ? gonder(res, 500, 'text/plain; charset=utf-8', 'Arayüz okunamadı') : gonder(res, 200, 'text/html; charset=utf-8', t, { 'Content-Security-Policy': CSP }));
    if (req.method === 'GET' && p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (req.method === 'GET' && p === '/api/csv') { saklama(); return gonder(res, 200, 'text/csv; charset=utf-8', c.csvUret(d.adaylar), { 'Content-Disposition': `attachment; filename="nebsoft-adaylar-${simdi().toISOString().slice(0, 10)}.csv"` }); }
    if (req.method !== 'POST' || !p.startsWith('/api/')) return p === '/api/baslangic' || p === '/api/adaylar' ? yanit(req, res, p, {}) : json(res, 404, { ok: false, hata: 'Bulunamadı.' });
    if (!/^application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { ok: false, hata: 'JSON bekleniyor.' }); // basit form gönderimiyle tetiklenemez
    let boyut = 0; const par = [];
    req.on('data', (x) => { boyut += x.length; if (boyut > 5e6) req.destroy(); else par.push(x); });
    req.on('end', async () => { let b; try { b = JSON.parse(Buffer.concat(par).toString('utf8') || '{}'); } catch (e) { return json(res, 400, { ok: false, hata: 'Geçersiz istek.' }); } yanit(req, res, p, b); });
  });
  async function yanit(req, res, p, b) {
    try { json(res, 200, await apiIsle(p, b)); }
    catch (e) { if (!e.code || typeof e.code !== 'number') console.error('[pazarlama]', e.message); json(res, typeof e.code === 'number' ? e.code : 500, { ok: false, hata: typeof e.code === 'number' ? e.message : 'Beklenmeyen bir hata oluştu.' }); }
  }
  return { sunucu, depo: d };
}

if (require.main === module) {
  const a = process.argv.find((x) => /^--port=\d+$/.test(x));
  const port = Number(a ? a.split('=')[1] : process.env.PAZARLAMA_PORT) || 5090;
  const { sunucu } = olustur();
  sunucu.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} kullanımda. Başka port için: --port=5091` : e.message); process.exit(1); });
  sunucu.listen(port, HOST, () => console.log(`NEBSOFT Pazarlama hazır: http://127.0.0.1:${port}\nBu araç yalnızca bu bilgisayardan erişilebilir. Durdurmak için Ctrl+C.`));
}
module.exports = { olustur, HOST };
