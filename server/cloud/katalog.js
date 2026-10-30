// Ortak ürün kataloğu. Lisans gereği iki veri ayrı tutulur ve hiçbir zaman tek tabloya yazılmaz:
//  • catalog_ext : dış kaynak (Open Food Facts) kayıtları, değiştirilmeden. Lisans: ODbL 1.0 / DbCL 1.0, görseller CC BY-SA 3.0.
//  • catalog_own : bizim kayıtlarımız; yalnız yönetici onayıyla girer. OFF kaydını düzeltmek gerekirse burada üstüne yazma kaydı açılır.
//  • catalog_suggest : müşteri ve tedarikçi önerileri (moderasyon kuyruğu). catalog_merge : geri alınabilir birleştirme kaydı.
// Barkod sırası: catalog_own → catalog_ext → (yalnız gerçek okutmada) OFF canlı. Open Food Facts kuralı: 1 API çağrısı = 1 gerçek okutma;
// arama ve toplu çekim API'ye gitmez, toplu veri scripts/katalog-off-al.js ile gece yayımlanan dosyadan alınır. Ayrıntı: docs/KATALOG-LISANS.md
const db = require('./db');
const log = require('./log');
const sec = require('./security');
const K = require('./katalog-kural');

const OFF_API = () => process.env.OFF_API_TABAN || 'https://world.openfoodfacts.org/api/v2/product/';
const UA = 'NEBSOFT/3.1 (destek@nebsoft.com.tr)';
const OFF_DAKIKA = 15; // resmî sınır: ürün okuma 15 istek/dakika/IP. İstekler tek sunucudan çıktığı için tüm sunucu için uygulanır
const LISANS = { off: 'ODbL-1.0', offIcerik: 'DbCL-1.0', offGorsel: 'CC-BY-SA-3.0', own: 'NEBSOFT-katalog' };
const URL_LISANS = { odbl: 'https://opendatacommons.org/licenses/odbl/1-0/', dbcl: 'https://opendatacommons.org/licenses/dbcl/1-0/', ccbysa: 'https://creativecommons.org/licenses/by-sa/3.0/' };
const CATS = { icecek: 'en:beverages', atistirmalik: 'en:snacks', sut: 'en:dairies', kahvalti: 'en:breakfasts', tatli: 'en:sweet-snacks', temel: 'en:cereals-and-potatoes', konserve: 'en:canned-foods', dondurulmus: 'en:frozen-foods', et: 'en:meats', meyve: 'en:plant-based-foods' };
const ham = (s, n) => (s == null ? '' : String(s)).slice(0, n); // dış kaynak değeri: yalnız sütun boyuna göre kısaltılır, başka değişiklik yapılmaz
const offUrun = (g) => `https://world.openfoodfacts.org/product/${K.gtinGoster(g)}`;
const atifOff = (g, gorsel) => ({ kaynak: 'Open Food Facts', kaynak_url: offUrun(g), metin: 'Open Food Facts verisi, Open Database License (ODbL) ile', lisans: 'ODbL 1.0', lisans_url: URL_LISANS.odbl, icerik_lisans_url: URL_LISANS.dbcl, ...(gorsel ? { gorsel_lisans: 'CC BY-SA 3.0', gorsel_lisans_url: URL_LISANS.ccbysa } : {}) });
const ownItem = (r) => ({ barcode: K.gtinGoster(r.gtin), gtin: r.gtin, name: r.ad, brand: r.marka || '', category: r.kategori || '', image: '', source: 'own', lisans: r.lisans, atif: null });
const sonEtiket = (s) => String(s || '').split(',').pop().replace(/^\w+:/, '').replace(/-/g, ' ').trim(); // gösterim için: tablodaki değer aynen kalır
const extItem = (r) => ({ barcode: K.gtinGoster(r.gtin), gtin: r.gtin, name: r.ad, brand: r.marka || '', category: sonEtiket(r.kategori), image: r.gorsel || '', source: r.kaynak, lisans: r.lisans, atif: atifOff(r.gtin, r.gorsel) });

// ---------- Open Food Facts kaydı → catalog_ext satırı (değerler aynen) ----------
const extSatir = ({ gtin, ad, marka, kategori, gorsel, alindi, kaynak_url }) => [gtin, 'off', ham(ad, 500), ham(marka, 300) || null, ham(kategori, 800) || null, ham(gorsel, 500) || null, LISANS.off, kaynak_url || offUrun(gtin), alindi || new Date()];
const EXT_SQL = 'INSERT INTO catalog_ext (gtin, kaynak, ad, marka, kategori, gorsel, lisans, kaynak_url, alindi) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE ad=VALUES(ad), marka=VALUES(marka), kategori=VALUES(kategori), gorsel=VALUES(gorsel), lisans=VALUES(lisans), kaynak_url=VALUES(kaynak_url), alindi=VALUES(alindi)';
const extYaz = (r) => db.q(EXT_SQL, extSatir(r));

// Bulunamayan barkod bir gün OFF'a tekrar sorulmaz: aynı ürünü art arda okutmak yeni API çağrısı üretmesin
const yok = new Map(); const YOK_SURE = 24 * 3600e3;
async function offCanli(gtin) {
  const y = yok.get(gtin); if (y && Date.now() - y < YOK_SURE) return null; if (y) yok.delete(gtin);
  if (!sec.limit('off:tum', OFF_DAKIKA, 60e3)) return null; // sınırda canlı sorgu yapılmaz; ürün elle eklenir
  const yaz = () => { yok.set(gtin, Date.now()); if (yok.size > 20000) yok.delete(yok.keys().next().value); return null; };
  let j; try { const r = await fetch(`${OFF_API()}${K.gtinGoster(gtin)}.json?fields=code,product_name,product_name_tr,brands,image_front_small_url,categories_tags`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }); if (r.status === 404) return yaz(); if (!r.ok) return null; j = await r.json(); } catch (e) { return null; } // geçici hata: tekrar denenmez, gereksiz çağrı üretilmez
  const p = j && j.status === 1 && j.product; const ad = p && (p.product_name_tr || p.product_name); if (!ad) return yaz();
  const kayit = { gtin, ad, marka: Array.isArray(p.brands) ? p.brands.join(', ') : p.brands, kategori: Array.isArray(p.categories_tags) ? p.categories_tags.join(',') : '', gorsel: p.image_front_small_url };
  await extYaz(kayit); return (await db.one('SELECT * FROM catalog_ext WHERE gtin=? AND kaynak=?', [gtin, 'off']));
}

// okutma: kullanıcı barkodu gerçekten okuttu (kamera, okuyucu ya da ürün formunda tek barkod). Yalnız o zaman OFF'a gidilir.
async function barkod(code, { okutma = false } = {}) {
  const gtin = K.gtinKanon(code); if (!gtin) return { hata: 'gtin' };
  const o = await db.one('SELECT * FROM catalog_own WHERE gtin=?', [gtin]); if (o) return { item: { ...ownItem(o), barcode: K.rakam(code) } };
  const e = await db.one('SELECT * FROM catalog_ext WHERE gtin=? ORDER BY kaynak LIMIT 1', [gtin]); if (e) return { item: { ...extItem(e), barcode: K.rakam(code) } };
  if (okutma && !K.icKullanim(gtin)) { const c = await offCanli(gtin); if (c) return { item: { ...extItem(c), barcode: K.rakam(code) } }; }
  return { item: null };
}

const LIKE = (s) => `%${String(s).replace(/[\\%_]/g, '\\$&')}%`;
async function ara({ q = '', cat = '', page = 1 }) {
  q = K.metin(q, 80); const n = 36; const p = Math.max(1, Math.min(50, Number(page) || 1)); const of = (p - 1) * n; const tag = CATS[cat] || '';
  const sart = (mar) => { const w = []; const a = []; if (q) { w.push(`(ad LIKE ? OR ${mar} LIKE ? OR gtin = ?)`); a.push(LIKE(q), LIKE(q), K.gtinKanon(q) || K.rakam(q).padStart(14, '0')); } return { w, a }; };
  const s = sart('marka'); const oW = s.w.slice(); const oA = s.a.slice(); if (cat) { oW.push('kategori = ?'); oA.push(cat); }
  const eW = s.w.slice(); const eA = s.a.slice(); if (tag) { eW.push('kategori LIKE ?'); eA.push(LIKE(tag)); }
  eW.push('gtin NOT IN (SELECT gtin FROM catalog_own)'); // üstüne yazma kaydı varsa dış kayıt gösterilmez
  const own = await db.q(`SELECT * FROM catalog_own ${oW.length ? 'WHERE ' + oW.join(' AND ') : ''} ORDER BY ad LIMIT ${n + 1} OFFSET ${of}`, oA);
  const kalan = Math.max(0, n + 1 - own.length); const ownSay = own.length ? 0 : (await db.one(`SELECT COUNT(*) AS n FROM catalog_own ${oW.length ? 'WHERE ' + oW.join(' AND ') : ''}`, oA)).n;
  const ext = kalan ? await db.q(`SELECT * FROM catalog_ext WHERE ${eW.join(' AND ')} ORDER BY ad LIMIT ${kalan} OFFSET ${Math.max(0, of - Number(ownSay))}`, eA) : [];
  const items = [...own.map(ownItem), ...ext.map(extItem)]; return { items: items.slice(0, n), more: items.length > n, page: p };
}

// ---------- Öneri ----------
const ONERI_SQL = 'INSERT INTO catalog_suggest (gtin, ad, ad_norm, marka, kategori, kaynak, lisans, kaynak_url, izin, alindi, bayrak) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE sayac=sayac+1';
// Müşteri önerisi: yalnız gtin, ad, marka, kategori. İşletme kimliği sütunu tabloda yoktur. OFF'tan gelmiş kayıt öneri sayılmaz: dış veri bizim tabloya sızmasın
async function oner(items) {
  const liste = (Array.isArray(items) ? items : []).slice(0, 200); const r = { eklenen: 0, atlanan: 0, reddedilen: 0 };
  for (const x of liste) {
    if (x && x.source === 'off') { r.atlanan++; continue; }
    const t = K.oneriTemizle(x); if (!t.kayit) { r.reddedilen++; continue; } const k = t.kayit;
    const e = await db.one('SELECT ad FROM catalog_ext WHERE gtin=? LIMIT 1', [k.gtin]); if (e && K.adNorm(e.ad) === k.ad_norm) { r.atlanan++; continue; }
    const o = await db.one('SELECT ad_norm FROM catalog_own WHERE gtin=?', [k.gtin]); if (o && o.ad_norm === k.ad_norm) { r.atlanan++; continue; }
    await db.q(ONERI_SQL, [k.gtin, k.ad, k.ad_norm, k.marka, k.kategori, 'musteri', LISANS.own, 'nebsoft:musteri-onerisi', null, new Date(), null]); r.eklenen++;
  }
  if (r.eklenen || r.reddedilen) log.uygulama.bilgi('katalog.oneri', { veri: r }); // yalnız sayılar: kim önerdiği ve ne önerdiği günlüğe de yazılmaz
  return r;
}

// Tedarikçi listesi: kaynak ve lisans/izin zorunlu. Fiyat, stok gibi sütunlar okunmaz. Hepsi moderasyondan geçer, doğrudan yayınlanmaz.
async function tedarikciAl(csv, { kaynak, lisans, kaynak_url, onizleme }) {
  const kay = K.metin(kaynak, 60); const lis = K.metin(lisans, 200); if (kay.length < 2 || lis.length < 3) throw Object.assign(new Error('Tedarikçi adı ve lisans/izin bilgisi zorunludur'), { status: 400 });
  const { sutunlar, satirlar } = K.csvOku(csv); if (sutunlar.gtin < 0 || sutunlar.ad < 0) throw Object.assign(new Error('Dosyada barkod ve ürün adı sütunu bulunamadı'), { status: 400 });
  const r = { toplam: satirlar.length, gecerli: 0, hataliGtin: 0, reddedilen: 0, ornek: [] };
  for (const s of satirlar.slice(0, 20000)) {
    const t = K.oneriTemizle(s); const hataliGtin = t.neden === 'hatalı GTIN' && K.adNorm(s.ad).length >= 2 && !K.kisiselVeri(s.ad);
    if (!t.kayit && !hataliGtin) { r.reddedilen++; continue; } // hatalı GTIN'li satır işaretlenip kuyruğa alınır; yönetici düzeltir veya reddeder
    const k = t.kayit || { gtin: K.rakam(s.gtin).slice(0, 32), ad: K.metin(s.ad, 200), ad_norm: K.adNorm(s.ad), marka: K.metin(s.marka, 120) || null, kategori: K.metin(s.kategori, 80) || null };
    if (hataliGtin) r.hataliGtin++; else r.gecerli++; if (r.ornek.length < 10) r.ornek.push({ gtin: k.gtin, ad: k.ad, marka: k.marka, kategori: k.kategori, hatali: hataliGtin });
    if (!onizleme) await db.q(ONERI_SQL, [k.gtin, k.ad, k.ad_norm, k.marka, k.kategori, 'tedarikci:' + kay, lis, K.metin(kaynak_url, 300) || 'nebsoft:tedarikci-listesi', lis, new Date(), hataliGtin ? 'hatali_gtin' : null]);
  }
  return r;
}

// ---------- Moderasyon ----------
async function durum() {
  const say = async (t, w = '') => Number((await db.one(`SELECT COUNT(*) AS n FROM ${t} ${w}`)).n);
  return { bekleyen: await say('catalog_suggest', "WHERE durum='bekliyor'"), own: await say('catalog_own'), ext: await say('catalog_ext'), birlestirme: await say('catalog_merge', 'WHERE geri_alindi IS NULL') };
}
async function kuyruk({ durum: d = 'bekliyor', filtre = '' } = {}) {
  const rows = await db.q('SELECT id, gtin, ad, ad_norm, marka, kategori, kaynak, lisans, kaynak_url, izin, sayac, durum, bayrak, neden, alindi FROM catalog_suggest WHERE durum=? ORDER BY sayac DESC, id LIMIT 200', [['bekliyor', 'onaylandi', 'reddedildi', 'birlesti'].includes(d) ? d : 'bekliyor']);
  for (const r of rows) {
    r.bayraklar = []; r.benzer = []; const g = K.gtinKanon(r.gtin);
    if (!g) r.bayraklar.push('hatali_gtin');
    else {
      const es = await db.q("SELECT 'oneri' AS nerede, id, ad FROM catalog_suggest WHERE gtin=? AND id<>? AND durum='bekliyor' UNION ALL SELECT 'own', NULL, ad FROM catalog_own WHERE gtin=? UNION ALL SELECT 'ext', NULL, ad FROM catalog_ext WHERE gtin=?", [r.gtin, r.id, g, g]);
      const farkli = es.filter((x) => K.adNorm(x.ad) !== r.ad_norm); if (farkli.length) { r.bayraklar.push('ayni_gtin_farkli_ad'); r.farkli = farkli.slice(0, 5); }
    }
    const tohum = r.ad_norm.split(' ')[0] || ''; if (tohum.length >= 3) {
      const ad = await db.q('SELECT gtin, ad FROM catalog_own WHERE ad_norm LIKE ? AND gtin<>? LIMIT 30', [tohum + '%', g || '']);
      r.benzer = ad.map((x) => ({ gtin: K.gtinGoster(x.gtin), ad: x.ad, oran: Math.round(K.benzerlik(x.ad, r.ad) * 100) / 100 })).filter((x) => x.oran >= 0.8).slice(0, 5); if (r.benzer.length) r.bayraklar.push('benzer_ad');
    }
  }
  const f = filtre && ['hatali_gtin', 'ayni_gtin_farkli_ad', 'benzer_ad'].includes(filtre) ? rows.filter((r) => r.bayraklar.includes(filtre)) : rows;
  return f.map(({ ad_norm, ...r }) => ({ ...r, gtin: K.gtinKanon(r.gtin) ? K.gtinGoster(r.gtin) : r.gtin }));
}
const hata = (status, m) => Object.assign(new Error(m), { status });
const oneriGetir = async (id, t = db) => { const s = await t.one('SELECT * FROM catalog_suggest WHERE id=?', [Number(id)]); if (!s) throw hata(404, 'Öneri bulunamadı'); return s; };
const ozet = (o) => (o ? { gtin: o.gtin, ad: o.ad, marka: o.marka || null, kategori: o.kategori || null, kaynak: o.kaynak, lisans: o.lisans, kaynak_url: o.kaynak_url, ust_kaynak: o.ust_kaynak || null, oneri_id: o.oneri_id || null, onaylayan: o.onaylayan || null } : null);
const degerler = (s, b) => { const ad = K.metin(b.ad != null ? b.ad : s.ad, 200); const marka = K.metin(b.marka !== undefined ? b.marka : s.marka, 120); const kategori = K.metin(b.kategori !== undefined ? b.kategori : s.kategori, 80); if (ad.length < 2) throw hata(400, 'Ürün adı gerekli'); for (const v of [ad, marka, kategori]) { const n = K.kisiselVeri(v); if (n) throw hata(400, `Kişisel veri içeriyor: ${n}`); } return { ad, marka, kategori }; };
async function ownYaz(t, gtin, v, s, yapan) {
  const ext = await t.q('SELECT gtin FROM catalog_ext WHERE gtin=? LIMIT 1', [gtin]); const ust = ext.length ? 'off' : null;
  await t.q('INSERT INTO catalog_own (gtin, ad, ad_norm, marka, kategori, kaynak, lisans, kaynak_url, alindi, ust_kaynak, oneri_id, onaylayan, guncel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE ad=VALUES(ad), ad_norm=VALUES(ad_norm), marka=VALUES(marka), kategori=VALUES(kategori), kaynak=VALUES(kaynak), lisans=VALUES(lisans), kaynak_url=VALUES(kaynak_url), alindi=VALUES(alindi), ust_kaynak=VALUES(ust_kaynak), oneri_id=VALUES(oneri_id), onaylayan=VALUES(onaylayan), guncel=VALUES(guncel)', [gtin, v.ad, K.adNorm(v.ad), v.marka || null, v.kategori || null, s.kaynak, s.lisans, s.kaynak_url, s.alindi, ust, s.id, yapan, new Date()]);
}
// Onay: öneri catalog_own'a girer. Aynı GTIN'de kayıt varsa onay yerine birleştirme kullanılır (eski kayıt geri alınabilir kalsın). OFF kaydı değiştirilmez.
async function onayla(id, b, yapan) {
  const s = await oneriGetir(id); if (s.durum !== 'bekliyor') throw hata(409, 'Bu öneri daha önce karara bağlanmış');
  const gtin = K.gtinKanon(b.gtin || s.gtin); if (!gtin) throw hata(400, 'GTIN hatalı: kontrol hanesi tutmuyor. Düzeltin ya da reddedin.'); if (K.icKullanim(gtin)) throw hata(400, 'İç kullanım barkodu ortak kataloğa girmez');
  if (await db.one('SELECT gtin FROM catalog_own WHERE gtin=?', [gtin])) throw hata(409, 'Bu GTIN katalogda var. Birleştirme kullanın.');
  const v = degerler(s, b);
  await db.tx(async (t) => { await ownYaz(t, gtin, v, s, yapan); await t.q("UPDATE catalog_suggest SET durum='onaylandi', karar_veren=?, karar_zamani=? WHERE id=?", [yapan, new Date(), s.id]); });
  return { gtin, ...v };
}
async function reddet(id, neden, yapan) { const s = await oneriGetir(id); if (s.durum !== 'bekliyor') throw hata(409, 'Bu öneri daha önce karara bağlanmış'); await db.q("UPDATE catalog_suggest SET durum='reddedildi', neden=?, karar_veren=?, karar_zamani=? WHERE id=?", [K.metin(neden, 200) || null, yapan, new Date(), s.id]); }
// Birleştirme: öneri, hedef GTIN'deki catalog_own kaydına işlenir. Önceki hâl catalog_merge'e yazılır; geri alınabilir.
async function birlestir(id, b, yapan) {
  const s = await oneriGetir(id); if (s.durum !== 'bekliyor') throw hata(409, 'Bu öneri daha önce karara bağlanmış');
  const hedef = K.gtinKanon(b.hedef_gtin || s.gtin); if (!hedef) throw hata(400, 'Hedef GTIN hatalı'); if (K.icKullanim(hedef)) throw hata(400, 'İç kullanım barkodu ortak kataloğa girmez');
  const v = degerler(s, b); const a = { kaynak: s.kaynak, lisans: s.lisans, kaynak_url: s.kaynak_url, alindi: s.alindi, id: s.id };
  const mid = await db.tx(async (t) => {
    const once = (await t.q('SELECT * FROM catalog_own WHERE gtin=? FOR UPDATE', [hedef]))[0] || null; if (once) { a.kaynak = once.kaynak; a.lisans = once.lisans; a.kaynak_url = once.kaynak_url; a.alindi = once.alindi; }
    await ownYaz(t, hedef, v, a, yapan); const son = (await t.q('SELECT * FROM catalog_own WHERE gtin=?', [hedef]))[0];
    await t.q("UPDATE catalog_suggest SET durum='birlesti', karar_veren=?, karar_zamani=? WHERE id=?", [yapan, new Date(), s.id]);
    const r = await t.q('INSERT INTO catalog_merge (oneri_id, hedef_gtin, onceki, sonraki, yapan, zaman) VALUES (?,?,?,?,?,?)', [s.id, hedef, JSON.stringify(once ? { ...ozet(once), alindi: once.alindi, guncel: once.guncel } : null), JSON.stringify(ozet(son)), yapan, new Date()]); return r.insertId;
  });
  return { id: Number(mid), hedef_gtin: hedef, ...v };
}
async function geriAl(mid, yapan) {
  const m = await db.one('SELECT * FROM catalog_merge WHERE id=?', [Number(mid)]); if (!m) throw hata(404, 'Birleştirme kaydı bulunamadı'); if (m.geri_alindi) throw hata(409, 'Bu birleştirme zaten geri alınmış');
  const son = await db.one('SELECT * FROM catalog_own WHERE gtin=?', [m.hedef_gtin]); const bek = JSON.parse(m.sonraki);
  if (!son || son.ad !== bek.ad || (son.marka || null) !== bek.marka || (son.kategori || null) !== bek.kategori) throw hata(409, 'Kayıt birleştirmeden sonra değişmiş; geri alınamaz. Önce sonraki birleştirmeyi geri alın.');
  const once = JSON.parse(m.onceki);
  await db.tx(async (t) => {
    if (once) await t.q('UPDATE catalog_own SET ad=?, ad_norm=?, marka=?, kategori=?, kaynak=?, lisans=?, kaynak_url=?, alindi=?, ust_kaynak=?, oneri_id=?, onaylayan=?, guncel=? WHERE gtin=?', [once.ad, K.adNorm(once.ad), once.marka, once.kategori, once.kaynak, once.lisans, once.kaynak_url, new Date(once.alindi), once.ust_kaynak, once.oneri_id, once.onaylayan, new Date(once.guncel), m.hedef_gtin]);
    else await t.q('DELETE FROM catalog_own WHERE gtin=?', [m.hedef_gtin]);
    await t.q("UPDATE catalog_suggest SET durum='bekliyor', karar_veren=NULL, karar_zamani=NULL WHERE id=?", [m.oneri_id]);
    await t.q('UPDATE catalog_merge SET geri_alindi=?, geri_alan=? WHERE id=?', [new Date(), yapan, m.id]);
  });
  return { hedef_gtin: m.hedef_gtin, oneri_id: Number(m.oneri_id) };
}
const birlestirmeler = async () => (await db.q('SELECT id, oneri_id, hedef_gtin, onceki, sonraki, yapan, zaman, geri_alindi FROM catalog_merge ORDER BY id DESC LIMIT 100')).map((r) => ({ ...r, hedef_gtin: K.gtinGoster(r.hedef_gtin) }));

// ---------- product_pool göçü ----------
// Bir kez çalışır (settings: katalog_goc_1). Kaynağı 'off' olanlar catalog_ext'e, işletme kaynaklılar öneri olarak moderasyona gider.
// Kişisel veri denetiminden geçemeyen satır taşınmaz. product_pool silinmez, yalnız artık okunmaz ve yazılmaz; kullanıcı inceleyip kaldırır.
async function gecis() {
  if (await db.one("SELECT v FROM settings WHERE k='katalog_goc_1'")) return null;
  const r = { off: 0, oneri: 0, atlanan: 0, hataliGtin: 0 }; let son = '';
  for (;;) {
    const rows = await db.q('SELECT * FROM product_pool WHERE barcode > ? ORDER BY barcode LIMIT 500', [son]); if (!rows.length) break; son = rows[rows.length - 1].barcode;
    for (const p of rows) {
      const g = K.gtinKanon(p.barcode); const pii = [p.name, p.brand, p.category].map(K.kisiselVeri).find(Boolean); if (pii) { r.atlanan++; continue; }
      if (p.source === 'off') { if (!g) { r.atlanan++; continue; } await db.q('INSERT IGNORE INTO catalog_ext (gtin, kaynak, ad, marka, kategori, gorsel, lisans, kaynak_url, alindi) VALUES (?,?,?,?,?,?,?,?,?)', extSatir({ gtin: g, ad: p.name, marka: p.brand, kategori: p.category, gorsel: p.image, alindi: p.updated })); r.off++; continue; }
      if (g && K.icKullanim(g)) { r.atlanan++; continue; }
      if (K.adNorm(p.name).length < 2) { r.atlanan++; continue; } if (!g) r.hataliGtin++;
      await db.q(ONERI_SQL.replace('sayac=sayac+1', 'sayac=sayac'), [g || K.rakam(p.barcode).slice(0, 32), K.metin(p.name, 200), K.adNorm(p.name), K.metin(p.brand, 120) || null, K.metin(p.category, 80) || null, 'havuz-goc', LISANS.own, 'nebsoft:product_pool', null, p.updated || new Date(), g ? null : 'hatali_gtin']); r.oneri++;
    }
  }
  await db.q("INSERT INTO settings (k, v) VALUES ('katalog_goc_1', ?)", [JSON.stringify({ ...r, at: new Date().toISOString() })]);
  log.uygulama.bilgi('katalog.gecis', { mesaj: 'product_pool ayrı tablolara taşındı', veri: r }); return r;
}
db.gocEkle(gecis);

module.exports = { barkod, ara, oner, tedarikciAl, durum, kuyruk, onayla, reddet, birlestir, geriAl, birlestirmeler, gecis, extYaz, extSatir, EXT_SQL, CATS, LISANS, atifOff };
