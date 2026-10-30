// Dosya deposu: yüklenen fotoğraflar belgeye gömülmez, sunucu diskinde durur (NEBSOFT_DOSYALAR, varsayılan NEBSOFT_DATA/dosyalar/<işletme>/<rastgele-id>.<uzantı>).
// Belgede yalnız /f/<işletme>/<id> adresi kalır. "acik" sınıfı herkese açık ve uzun önbellekli (ürün, araç vitrini); "gizli" sınıfı diskte belge.js anahtarıyla
// şifreli, yalnız aynı işletmenin oturumu okur (kiralama teslim ve hasar fotoğrafları). Tür uzantıdan veya başlıktan değil baytlardan bulunur.
const fs = require('fs'); const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const cfg = require('./config');
const sec = require('./security');
const auth = require('./auth');
const belge = require('./belge');
const log = require('./log');
const kural = require('./rol-kural');
const { route, err, canUseApp, hesapRolu, setting, audit } = require('./routes');

const KOK = process.env.NEBSOFT_DOSYALAR || path.join(cfg.DATA, 'dosyalar');
const MAX = 1e6; // tek dosya; tarayıcı 1280 px JPEG'e küçülttüğü için normalde 200-500 KB gelir
const GECIS_MAX = 10e6; // eski belgede sınırsız kalmış görsel de taşınabilsin
const KOTA = (Number(process.env.NEBSOFT_DOSYA_KOTA_MB) || 2048) * 1048576; // işletme başına
const BEKLEME = 7 * 864e5; // referansı kalkan dosya bu süre durur: yanlış silme geri alınabilir, belge geçmişi (48 saat) bu sürenin içinde kalır
const TUR = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const TID = /^[0-9a-f]{16}$/; const ID = /^[0-9a-f]{32}$/;
// Program, fotoğrafın durduğu alanlar ve sınıf. Burada olmayan program yükleyemez: depo genel dosya barındırma değildir.
const PROG = { eticaret: { kol: 'products', alan: ['photos'], sinif: 'acik' }, galeri: { kol: 'vehicles', alan: ['photos'], sinif: 'acik' }, kiralama: { kol: 'rents', alan: ['outPhotos', 'inPhotos'], sinif: 'gizli' } };
const prog = (app) => (Object.hasOwn(PROG, app) ? PROG[app] : null);

// ---------- İçerik doğrulama ----------
function jpeg(b) { // işaretçiler yürünür, boyut bilgisi (SOF) bulunamayan dosya görsel sayılmaz
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return null;
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1]; if (m === 0xff) { i++; continue; }
    if (m >= 0xd0 && m <= 0xd9) { i += 2; continue; }
    const uz = b.readUInt16BE(i + 2); if (uz < 2) return null;
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { en: b.readUInt16BE(i + 7), boy: b.readUInt16BE(i + 5) };
    i += 2 + uz;
  }
  return null;
}
function png(b) {
  if (b.length < 33 || !b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { en: b.readUInt32BE(16), boy: b.readUInt32BE(20) };
}
function webp(b) {
  if (b.length < 30 || b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  if (b.readUInt32LE(4) + 8 > b.length) return null;
  const k = b.toString('latin1', 12, 16);
  if (k === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return { en: b.readUInt16LE(26) & 0x3fff, boy: b.readUInt16LE(28) & 0x3fff };
  if (k === 'VP8L' && b[20] === 0x2f) { const v = b.readUInt32LE(21); return { en: (v & 0x3fff) + 1, boy: ((v >> 14) & 0x3fff) + 1 }; }
  if (k === 'VP8X') return { en: b.readUIntLE(24, 3) + 1, boy: b.readUIntLE(27, 3) + 1 };
  return null;
}
// Baytlardan tür: yalnız JPEG, PNG, WebP. SVG (betik taşır), HTML ve diğerleri reddedilir.
function turBul(b) {
  if (!Buffer.isBuffer(b)) return null;
  for (const [tur, f] of [['image/jpeg', jpeg], ['image/png', png], ['image/webp', webp]]) { const o = f(b); if (o) return o.en > 0 && o.boy > 0 && o.en <= 16384 && o.boy <= 16384 ? tur : null; }
  return null;
}

// ---------- Disk ----------
function yol(tid, id, tur, sinif) {
  if (!TID.test(tid) || !ID.test(id)) throw err(400, 'Geçersiz dosya');
  const f = path.join(KOK, tid, `${id}.${sinif === 'gizli' ? 'enc' : TUR[tur]}`);
  if (!path.resolve(f).startsWith(path.resolve(KOK) + path.sep)) throw err(400, 'Geçersiz dosya');
  return f;
}
const adres = (tid, id) => `/f/${tid}/${id}`;
const ozetle = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gb = (n) => (n >= 1073741824 ? `${Math.round(n / 107374182.4) / 10} GB` : `${Math.round(n / 1048576)} MB`);
// Yarım yazım görünmesin: önce geçici ad, sonra taşıma. Geride kalan geçici dosya temizlikte silinir.
async function diskeYaz(f, b) {
  await fsp.mkdir(path.dirname(f), { recursive: true, mode: 0o700 });
  const g = `${f}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try { await fsp.writeFile(g, b, { mode: 0o600 }); await fsp.rename(g, f); } catch (e) { await fsp.unlink(g).catch(() => {}); throw e; }
}
const icerik = (tid, id, sinif, b) => (sinif === 'gizli' ? belge.dosyaKapat(tid, id, b) : b);
async function oku(tid, id, tur, sinif) { const b = await fsp.readFile(yol(tid, id, tur, sinif)); return sinif === 'gizli' ? belge.dosyaAc(tid, id, b) : b; }

// Kota işletme satırı kilitlenerek denetlenir: aynı anda gelen yüklemeler sınırı birlikte aşamaz. Silinmeyi bekleyen dosya kullanımdan düşer,
// ama diskteki toplam kotanın iki katını aşamaz (yükle-sil döngüsü diski dolduramasın).
async function kaydet(tid, app, sinif, tur, b, yukleyen) {
  const id = crypto.randomBytes(16).toString('hex'); const f = yol(tid, id, tur, sinif); const ozet = ozetle(b);
  try { await diskeYaz(f, icerik(tid, id, sinif, b)); } catch (e) { if (e.code === 'ENOSPC') throw err(507, 'Sunucu deposu dolu. Destek ile iletişime geçin.'); throw e; }
  try {
    const kullanilan = await db.tx(async (t) => {
      await t.q('SELECT id FROM tenants WHERE id=? FOR UPDATE', [tid]);
      const r = (await t.q('SELECT COALESCE(SUM(boyut),0) AS hepsi, COALESCE(SUM(IF(yetim IS NULL, boyut, 0)),0) AS etkin FROM dosyalar WHERE tenant_id=?', [tid]))[0];
      const etkin = Number(r.etkin); if (etkin + b.length > KOTA || Number(r.hepsi) + b.length > KOTA * 2) throw err(507, `Fotoğraf alanınız doldu (${gb(KOTA)}). Kullanılmayan fotoğrafları silin veya destek ile görüşün.`);
      await t.q('INSERT INTO dosyalar (id, tenant_id, app, sinif, tur, boyut, ozet, yukleyen, created) VALUES (?,?,?,?,?,?,?,?,?)', [id, tid, app, sinif, tur, b.length, ozet, yukleyen, new Date()]);
      return etkin + b.length;
    });
    return { id, kullanilan };
  } catch (e) { await fsp.unlink(f).catch(() => {}); throw e; }
}

// ---------- Uç noktalar ----------
// Yazma denetimi PUT /api/data ile aynı: lisans, planlı bakım, hesap rolü
async function yazabilir(c, app) {
  const p = prog(app); if (!p) throw err(400, 'Bu program dosya yüklemeyi desteklemiyor');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Lisans süresi doldu, fotoğraf yüklenemez', { code: 'license', app });
  const mt = ((await setting('platform', {})).maintenance || {})[app]; if (mt && mt.on && mt.block) throw err(503, 'Program planlı bakımda, kısa süre sonra tekrar deneyin', { code: 'maintenance', app });
  const k = await hesapRolu(c.user, app); if (k && !k.ortak && !kural.yazabilir(app, k.rol, p.kol)) throw err(403, 'Bu rolde fotoğraf değiştirme yetkiniz yok');
  return p;
}
route('POST', '/api/dosya', { auth: 'user', raw: true, bodyMax: MAX, buyukHata: 'Fotoğraf çok büyük (en fazla 1 MB)', limit: ['dosya', 120, 60e3], cloudOnly: true }, async (c) => {
  const app = String(c.query.get('app') || ''); const p = await yazabilir(c, app);
  const tur = turBul(c.raw); if (!tur) throw err(415, 'Yalnızca JPEG, PNG veya WebP fotoğraf yüklenebilir');
  const sinif = c.query.get('sinif') === 'gizli' ? 'gizli' : p.sinif; // kişisel içerikli program istemci isteğiyle herkese açık olamaz
  const k = await kaydet(c.user.tenant_id, app, sinif, tur, c.raw, c.user.id);
  return { ok: true, id: k.id, url: adres(c.user.tenant_id, k.id), boyut: c.raw.length, kullanilan: k.kullanilan, kota: KOTA };
});

// Fotoğrafı arayan: işletmenin güncel belgeleri (şifreli programlar dahil). Açılamayan belge varsa hata atar, çağıran hiçbir şey silmez.
async function referanslar(tid) {
  const ids = new Set(); const re = new RegExp(`/f/${tid}/([0-9a-f]{32})`, 'g'); const ekle = (t) => { for (const m of String(t).matchAll(re)) ids.add(m[1]); };
  const uyg = await db.q('SELECT app FROM app_data WHERE tenant_id=?', [tid]);
  for (const r of uyg) { const s = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [tid, r.app]); if (s) ekle(await belge.ac(tid, r.app, s.data)); }
  const site = await db.one('SELECT data FROM biz_sites WHERE tenant_id=?', [tid]); if (site) ekle(site.data);
  return { ids, belge: uyg.length };
}
// Silme hemen diskten gitmez: bekleme başlar, kullanımdan düşer. Belgede duran dosya silinemez.
route('DELETE', '/api/dosya/:id', { auth: 'user', limit: ['dosyasil', 120, 60e3], cloudOnly: true }, async (c) => {
  const id = c.params.id; const tid = c.user.tenant_id; if (!ID.test(id) || !tid) throw err(404, 'Dosya bulunamadı');
  const r = await db.one('SELECT app FROM dosyalar WHERE id=? AND tenant_id=?', [id, tid]); if (!r) throw err(404, 'Dosya bulunamadı');
  await yazabilir(c, r.app);
  if ((await referanslar(tid)).ids.has(id)) throw err(409, 'Bu fotoğraf bir kayıtta kullanılıyor');
  await db.q('UPDATE dosyalar SET yetim=COALESCE(yetim, ?) WHERE id=? AND tenant_id=?', [new Date(), id, tid]);
  await audit(c, 'Fotoğraf silindi', `${r.app} · ${id}`);
  return { ok: true, silinecek: new Date(Date.now() + BEKLEME).toISOString() };
});

// GET /f/<işletme>/<id>. Yetkisiz okumada dosyanın varlığı da söylenmez: 404.
async function sun(req, res, tid, id) {
  const yok = (kod = 404, m = 'Bulunamadı') => { res.writeHead(kod, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(m); };
  if (!TID.test(tid) || !ID.test(id) || !db.ready()) return yok();
  if (!sec.limit('f:' + sec.ip(req), 6000, 60e3)) return yok(429, 'Çok fazla istek');
  const r = await db.one('SELECT d.tur, d.sinif, t.status FROM dosyalar d JOIN tenants t ON t.id=d.tenant_id WHERE d.id=? AND d.tenant_id=?', [id, tid]);
  if (!r || r.status !== 'active' || !TUR[r.tur]) return yok();
  const gizli = r.sinif === 'gizli';
  if (gizli) { const u = await auth.current(req); if (!u || u.tenant_id !== tid) return yok(); }
  const h = { 'Content-Type': r.tur, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': gizli ? 'private, no-store' : 'public, max-age=31536000, immutable', ...(gizli ? { 'X-Robots-Tag': 'noindex' } : { ETag: `"${id}"` }) };
  if (!gizli && req.headers['if-none-match'] === h.ETag) { res.writeHead(304, h); return res.end(); }
  let b; try { b = await oku(tid, id, r.tur, r.sinif); } catch (e) { if (e.code !== 'ENOENT') log.uygulama.hata('dosya.okunamadi', { mesaj: 'Dosya okunamadı', veri: { sinif: r.sinif } }); return yok(); }
  res.writeHead(200, { ...h, 'Content-Length': b.length }); res.end(req.method === 'HEAD' ? undefined : b);
}

// ---------- Temizlik ----------
// Önce referans taranır; belge açılamazsa veya işletmenin hiç belgesi yoksa o işletmede hiçbir şey silinmez.
async function temizle(simdi = new Date()) {
  const o = { isaret: 0, geri: 0, silinen: 0 };
  for (const { tenant_id: tid } of await db.q('SELECT DISTINCT tenant_id FROM dosyalar')) {
    try {
      const { ids, belge: n } = await referanslar(tid); if (!n) continue;
      for (const d of await db.q('SELECT id, tur, sinif, yetim FROM dosyalar WHERE tenant_id=?', [tid])) {
        if (ids.has(d.id)) { if (d.yetim) { await db.q('UPDATE dosyalar SET yetim=NULL WHERE id=?', [d.id]); o.geri++; } continue; }
        if (!d.yetim) { await db.q('UPDATE dosyalar SET yetim=? WHERE id=?', [simdi, d.id]); o.isaret++; continue; }
        if (simdi - new Date(d.yetim) < BEKLEME) continue;
        await fsp.unlink(yol(tid, d.id, d.tur, d.sinif)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
        await db.q('DELETE FROM dosyalar WHERE id=?', [d.id]); o.silinen++;
      }
      const klasor = path.join(KOK, tid);
      for (const a of await fsp.readdir(klasor).catch(() => [])) if (a.endsWith('.tmp')) { const f = path.join(klasor, a); const st = await fsp.stat(f).catch(() => null); if (st && simdi - st.mtimeMs > 864e5) await fsp.unlink(f).catch(() => {}); }
    } catch (e) { log.uygulama.hata('dosya.temizlik', { mesaj: e.message }); }
  }
  return o;
}

// ---------- Eski kayıt geçişi ----------
// Belgeye gömülü data: görselleri dosyaya taşır. Yazılan dosya geri okunup karşılaştırılır, belge şifreli programda belge.oku/kapat ile açılıp kapanır,
// UPDATE okunan sürüme koşulludur. Sürüm tutmazsa satır atlanır; sonraki çalışmada aynı içerik özetle bulunduğu için dosya çoğalmaz. Görsel olmayan veri olduğu gibi kalır.
const DATA_RE = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
async function gecisDosyasi(tid, app, sinif, tur, b) {
  const ozet = ozetle(b); const eski = await db.one('SELECT id FROM dosyalar WHERE tenant_id=? AND sinif=? AND ozet=? LIMIT 1', [tid, sinif, ozet]);
  if (eski) {
    const d = await oku(tid, eski.id, tur, sinif).catch(() => null);
    if (d && d.equals(b)) { await db.q('UPDATE dosyalar SET yetim=NULL WHERE id=?', [eski.id]); return eski.id; }
    await db.q('DELETE FROM dosyalar WHERE id=?', [eski.id]); // diskteki dosya kayıpsa kayıt baştan yazılır
  }
  const id = crypto.randomBytes(16).toString('hex'); await diskeYaz(yol(tid, id, tur, sinif), icerik(tid, id, sinif, b));
  const geri = await oku(tid, id, tur, sinif); if (!geri.equals(b)) throw new Error('Dosya doğrulanamadı');
  await db.q('INSERT INTO dosyalar (id, tenant_id, app, sinif, tur, boyut, ozet, created) VALUES (?,?,?,?,?,?,?,?)', [id, tid, app, sinif, tur, b.length, ozet, new Date()]); // geçiş kotaya takılmaz: veri kaybı olmasın
  return id;
}
async function belgeTasi(tid, app, surum, o) {
  const s = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=? AND version=?', [tid, app, surum]); if (!s) return;
  const doc = await belge.oku(tid, app, s); if (!doc) return; const p = PROG[app]; let n = 0;
  for (const kayit of Array.isArray(doc[p.kol]) ? doc[p.kol] : []) {
    for (const alan of p.alan) {
      const L = kayit && kayit[alan]; if (!Array.isArray(L)) continue;
      for (let i = 0; i < L.length; i++) {
        if (typeof L[i] !== 'string' || !L[i].startsWith('data:image/')) continue;
        const m = DATA_RE.exec(L[i]); const b = m ? Buffer.from(m[1], 'base64') : null; const tur = b && b.length <= GECIS_MAX ? turBul(b) : null;
        if (!tur) { o.atlanan++; continue; } // bozuk veya desteklenmeyen görsel olduğu gibi kalır, ekranda eskisi gibi görünür
        L[i] = adres(tid, await gecisDosyasi(tid, app, p.sinif, tur, b)); n++;
      }
    }
  }
  if (!n) return;
  const metin = JSON.stringify(doc); const enc = await belge.kapat(tid, app, metin); if ((await belge.ac(tid, app, enc)) !== metin) throw new Error('Belge doğrulanamadı');
  const r = await db.q('UPDATE app_data SET data=?, version=version+1, updated=? WHERE tenant_id=? AND app=? AND version=?', [enc, new Date(), tid, app, surum]);
  if (r.affectedRows) { o.belge++; o.gorsel += n; } else o.surum++;
}
async function gecis() {
  const o = { belge: 0, gorsel: 0, atlanan: 0, surum: 0, hata: 0 };
  for (const app of Object.keys(PROG)) {
    // LIKE yalnız hız içindir; şifreli programın belgesinde düz metin aranamaz, tümü açılır
    for (const r of await db.q(`SELECT tenant_id, version FROM app_data WHERE app=?${belge.sifreli(app) ? '' : " AND data LIKE '%data:image/%'"}`, [app])) {
      try { await belgeTasi(r.tenant_id, app, r.version, o); } catch (e) { o.hata++; log.uygulama.hata('dosya.gecis', { mesaj: e.message, app }); }
    }
  }
  if (o.belge || o.hata || o.surum) log.uygulama.bilgi('dosya.gecis', { mesaj: `${o.belge} belgede ${o.gorsel} görsel dosyaya taşındı, ${o.atlanan} atlandı, ${o.surum} sürüm çakışması, ${o.hata} hata` });
  return o;
}
// Anahtar değişimi: gizli dosyalar da yeni anahtara taşınır, NEBSOFT_SECRET_ESKI bundan sonra kaldırılabilir (DEPLOY.md)
async function anahtarGecis() {
  if (!cfg.anahtarEski()) return 0; let n = 0;
  for (const d of await db.q("SELECT id, tenant_id, tur, sinif FROM dosyalar WHERE sinif='gizli'")) {
    try { const b = await oku(d.tenant_id, d.id, d.tur, d.sinif); await diskeYaz(yol(d.tenant_id, d.id, d.tur, d.sinif), belge.dosyaKapat(d.tenant_id, d.id, b)); n++; } catch (e) { log.uygulama.hata('dosya.anahtar', { mesaj: e.message }); }
  }
  return n;
}
db.gocEkle(async () => { try { await gecis(); await anahtarGecis(); } catch (e) { log.uygulama.hata('dosya.gecis', { mesaj: e.message }); } });

// Altı saatte bir: eski sekmeden gelen gömülü görsel taşınır, yetim dosyalar işlenir
let saat = null;
function zamanla() { if (saat) return; saat = setInterval(() => { if (db.ready()) gecis().then(() => temizle()).catch((e) => log.uygulama.hata('dosya.temizlik', { mesaj: e.message })); }, 6 * 3600e3); saat.unref(); }

module.exports = { sun, zamanla, temizle, gecis, anahtarGecis, turBul, kaydet, referanslar, KOK, MAX, BEKLEME, PROG };
