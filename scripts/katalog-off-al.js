// Open Food Facts toplu aktarımı: gece yayımlanan CSV dışa aktarım dosyasından Türkiye ürünlerini süzüp catalog_ext'e yazar.
// Elle çalıştırılır. API kullanmaz (OFF kuralı: 1 API çağrısı = 1 gerçek okutma; toplu veri için dışa aktarım dosyası).
// Dosya sıkıştırılmış yaklaşık 0,9 GB, açılmış yaklaşık 9 GB'tır: satır satır akışla işlenir, belleğe alınmaz.
//   node scripts/katalog-off-al.js --dosya en.openfoodfacts.org.products.csv.gz      (önceden indirilmiş dosya)
//   node scripts/katalog-off-al.js --indir                                           (dosyayı diske yazmadan akışla okur)
//   --kuru : veritabanına yazmaz, yalnız sayar · --limit N : ilk N Türkiye ürününde durur · --ayrinti : 100.000 satırda bir ilerleme yazar
// Kaynak: https://world.openfoodfacts.org/data  Lisans: ODbL 1.0 (veritabanı), DbCL 1.0 (içerik), CC BY-SA 3.0 (görseller).
// Değerler değiştirilmez; yalnız catalog_ext sütun boyuna göre kısaltılır. OFF'a hiçbir veri yazılmaz.
const fs = require('fs');
const zlib = require('zlib');
const https = require('https');
const readline = require('readline');

const URL_DOSYA = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';
const UA = 'NEBSOFT/3.1 (destek@nebsoft.com.tr)';
const GEREKLI = ['code', 'product_name', 'countries_tags'];

// Açılmış satır akışı → Türkiye ürünleri. Sütunlar başlıktan okunur; beklenen sütun yoksa dosya biçimi değişmiş demektir, durulur.
async function* suz(girdi, K, o = {}) {
  const rl = readline.createInterface({ input: girdi, crlfDelay: Infinity }); let bas = null; let n = 0; const say = o.say || {};
  for await (const satir of rl) {
    n++; if (o.ayrinti && n % 100000 === 0) console.error(`${n} satır, ${say.turkiye || 0} Türkiye ürünü`);
    const c = satir.split('\t');
    if (!bas) { bas = Object.fromEntries(c.map((x, i) => [x.trim(), i])); const eks = GEREKLI.filter((k) => !(k in bas)); if (eks.length) throw new Error('Dosyada beklenen sütun yok: ' + eks.join(', ')); continue; }
    const v = (k) => (k in bas ? c[bas[k]] || '' : '');
    if (!v('countries_tags').split(',').includes('en:turkey')) continue; const gtin = K.gtinKanon(v('code')); const ad = v('product_name');
    if (!gtin || !ad.trim()) { say.atlanan = (say.atlanan || 0) + 1; continue; }
    say.turkiye = (say.turkiye || 0) + 1; yield { gtin, ad, marka: v('brands'), kategori: v('categories_tags'), gorsel: v('image_small_url') || v('image_url'), kaynak_url: v('url') || undefined };
  }
  say.satir = n;
}

const indir = () => new Promise((ok, no) => { https.get(URL_DOSYA, { headers: { 'User-Agent': UA } }, (r) => { if (r.statusCode !== 200) { r.resume(); return no(new Error('İndirilemedi: HTTP ' + r.statusCode)); } ok(r); }).on('error', no); });
const argum = (a) => { const o = {}; for (let i = 0; i < a.length; i++) { const k = a[i]; if (k === '--dosya') o.dosya = a[++i]; else if (k === '--limit') o.limit = Number(a[++i]); else if (k === '--indir') o.indir = true; else if (k === '--kuru') o.kuru = true; else if (k === '--ayrinti') o.ayrinti = true; else throw new Error('Bilinmeyen seçenek: ' + k); } return o; };

async function main() {
  const o = argum(process.argv.slice(2)); if (!o.dosya && !o.indir) { console.error('Kullanım: node scripts/katalog-off-al.js --dosya <yol> | --indir [--kuru] [--limit N] [--ayrinti]'); process.exit(2); }
  const K = require('../server/cloud/katalog-kural'); const say = {}; let db = null; let katalog = null;
  if (!o.kuru) { const cfg = require('../server/cloud/config'); db = require('../server/cloud/db'); katalog = require('../server/cloud/katalog'); const c = cfg.load(); if (!c || !c.db) throw new Error('Veritabanı ayarı bulunamadı (data/config.enc). Sunucuyu kurduğunuz klasörde çalıştırın.'); await db.connect(c.db); }
  const kaynak = o.dosya ? fs.createReadStream(o.dosya) : await indir(); const acik = !o.dosya || /\.gz$/i.test(o.dosya) ? kaynak.pipe(zlib.createGunzip()) : kaynak;
  let yazilan = 0;
  for await (const r of suz(acik, K, { say, ayrinti: o.ayrinti })) { if (!o.kuru) await katalog.extYaz({ ...r, alindi: new Date() }); yazilan++; if (o.limit && yazilan >= o.limit) { kaynak.destroy(); break; } }
  console.log(JSON.stringify({ tamam: true, yazilan, ...say, kuru: !!o.kuru })); if (db) await db.close();
}
if (require.main === module) main().catch((e) => { console.error('Durdu: ' + e.message); process.exit(1); });
module.exports = { suz, argum, URL_DOSYA };
