// Hassas program belgeleri veritabanında şifreli durur (AES-256-GCM, işletme + program başına türetilmiş anahtar).
// Veritabanı dökümü veya yedek tek başına okunamaz; anahtar NEBSOFT_SECRET / secret.key içindedir ve veritabanına girmez.
// Şifre sunucuda çözülür: sunucuya erişen yazılım veriyi okuyabilir, müşteri sayfaları ve raporlar bu yüzden çalışmaya devam eder.
// Anahtar değiştirilecekse eskisi NEBSOFT_SECRET_ESKI ile verilir; açılışta belgeler yeni anahtara taşınır (DEPLOY.md).
const crypto = require('crypto');
const { promisify } = require('util');
const zlib = require('zlib');
const cfg = require('./config');
const log = require('./log');

const gzip = promisify(zlib.gzip); const gunzip = promisify(zlib.gunzip);
const PFX = 'nsdoc1:';
// Sağlık (klinik, eczane, veteriner), çocuk sağlığı ve izin raporları (anaokulu, ik), e-Nabız deneme yükleri (entegrasyon)
const SIFRELI = new Set(['klinik', 'eczane', 'veteriner', 'ik', 'anaokulu', 'entegrasyon']);
const sifreli = (app) => SIFRELI.has(app);
const acik = (raw) => typeof raw === 'string' && !raw.startsWith(PFX);
const turet = (ana, tid, app) => Buffer.from(crypto.hkdfSync('sha256', ana, String(tid), `nebsoft-belge:${app}`, 32));
const ek = (tid, app) => Buffer.from(`${tid}\n${app}`); // şifreli metin başka işletmenin satırına taşınırsa açılmaz

async function kapat(tid, app, text) {
  if (!sifreli(app)) return text;
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', turet(cfg.anahtar(), tid, app), iv); c.setAAD(ek(tid, app));
  const enc = Buffer.concat([c.update(await gzip(Buffer.from(text, 'utf8'))), c.final()]);
  return PFX + Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}
function coz(buf, ana, tid, app) {
  const d = crypto.createDecipheriv('aes-256-gcm', turet(ana, tid, app), buf.subarray(0, 12)); d.setAAD(ek(tid, app)); d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}
// Düz kayıt olduğu gibi döner (geçiş tamamlanana dek ve şifrelenmeyen programlar). Açılamayan belge boş sayılmaz: hata atılır, üzerine yazılmaz.
async function ac(tid, app, raw) {
  if (typeof raw !== 'string' || !raw.startsWith(PFX)) return raw;
  const buf = Buffer.from(raw.slice(PFX.length), 'base64'); let duz = null;
  for (const ana of [cfg.anahtar(), cfg.anahtarEski()]) { if (!ana) continue; try { duz = coz(buf, ana, tid, app); break; } catch (e) { /* sıradaki anahtar */ } }
  if (!duz) { log.uygulama.hata('belge.cozulemedi', { mesaj: 'Belge açılamadı (NEBSOFT_SECRET değişmiş olabilir)', app }); throw Object.assign(new Error('Kayıtlı veri açılamadı. Destek ile iletişime geçin.'), { status: 500 }); }
  return (await gunzip(duz)).toString('utf8');
}
async function oku(tid, app, row, yedek = null) {
  if (!row) return yedek; const t = await ac(tid, app, row.data);
  try { const d = JSON.parse(t); return d === null ? yedek : d; } catch (e) { return yedek; }
}

// Açılış geçişi: düz kayıtları ve eski anahtarla yazılanları şifreler. Yazmadan önce geri açılıp karşılaştırılır; sürüm değiştiyse satır atlanır, sonraki kayıt zaten şifreli yazılır.
async function gecis(db) {
  const list = [...SIFRELI]; const yer = list.map(() => '?').join(','); let n = 0;
  const eski = !!cfg.anahtarEski(); const kosul = eski ? '' : " AND data NOT LIKE 'nsdoc1:%'";
  const tek = async (tid, app, data, yaz) => {
    const duz = await ac(tid, app, data); const enc = await kapat(tid, app, duz);
    if ((await ac(tid, app, enc)) !== duz) throw new Error('Şifreleme doğrulanamadı');
    n += (await yaz(enc)).affectedRows || 0;
  };
  for (const r of await db.q(`SELECT tenant_id, app, version FROM app_data WHERE app IN (${yer})${kosul}`, list)) {
    try {
      const s = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=? AND version=?', [r.tenant_id, r.app, r.version]); if (!s) continue;
      await tek(r.tenant_id, r.app, s.data, (enc) => db.q('UPDATE app_data SET data=? WHERE tenant_id=? AND app=? AND version=?', [enc, r.tenant_id, r.app, r.version]));
    } catch (e) { log.uygulama.hata('belge.gecis', { mesaj: e.message, app: r.app }); }
  }
  for (const r of await db.q(`SELECT id, tenant_id, app FROM app_data_history WHERE app IN (${yer})${kosul}`, list)) {
    try {
      const s = await db.one('SELECT data FROM app_data_history WHERE id=?', [r.id]); if (!s) continue;
      await tek(r.tenant_id, r.app, s.data, (enc) => db.q('UPDATE app_data_history SET data=? WHERE id=?', [enc, r.id]));
    } catch (e) { log.uygulama.hata('belge.gecis', { mesaj: e.message, app: r.app }); }
  }
  return n;
}

module.exports = { kapat, ac, oku, gecis, sifreli, acik, PFX, SIFRELI };
