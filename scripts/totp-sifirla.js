// Kendini kilitleyen platform yöneticisi için iki adımlı girişi sıfırlar. Yalnızca sunucuda, kod klasöründen çalıştırılır; web üzerinden erişilemez.
//   node scripts/totp-sifirla.js                         → yöneticiler ve iki adımlı giriş durumu
//   node scripts/totp-sifirla.js --eposta a@b.com --evet → o hesabın anahtarını ve kurtarma kodlarını siler, oturumlarını kapatır
// Sunucuyla aynı ortam değişkenleri gerekir (NEBSOFT_DATA, NEBSOFT_SECRET). Şifre değişmez; sonraki girişte e-posta altyapısı kuruluysa e-posta kodu istenir.
const cfg = require('../server/cloud/config');
const db = require('../server/cloud/db');
const log = require('../server/cloud/log');

const ek = process.argv.slice(2); const deger = (ad) => { const i = ek.indexOf(ad); return i >= 0 ? ek[i + 1] : null; };

(async () => {
  const conf = cfg.load(); if (!conf || !conf.db) throw new Error('Veritabanı ayarı bulunamadı. NEBSOFT_DATA ve NEBSOFT_SECRET sunucudakiyle aynı mı?');
  await db.connect(conf.db);
  const eposta = String(deger('--eposta') || '').toLowerCase().trim();
  if (!eposta) {
    for (const u of await db.q("SELECT u.email, u.role, COALESCE(t.enabled, 0) AS etkin FROM users u LEFT JOIN user_totp t ON t.user_id=u.id WHERE u.role IN ('admin','superadmin') ORDER BY u.created")) console.log(`${u.etkin ? 'açık ' : 'kapalı'}  ${u.role.padEnd(10)}  ${u.email}`);
    console.log('\nSıfırlamak için: node scripts/totp-sifirla.js --eposta <adres> --evet'); return;
  }
  const u = await db.one("SELECT id, email FROM users WHERE email=? AND role IN ('admin','superadmin')", [eposta]);
  if (!u) throw new Error('Bu e-postayla platform yöneticisi bulunamadı');
  if (!ek.includes('--evet')) throw new Error(`Onay yok: ${u.email} sıfırlanmadı. Komutu --evet ile yeniden çalıştırın.`);
  const r = await db.q('DELETE FROM user_totp WHERE user_id=?', [u.id]); await db.q('DELETE FROM sessions WHERE user_id=?', [u.id]);
  await db.q('INSERT INTO audit (at, user_id, ip, action, detail) VALUES (?,?,?,?,?)', [new Date(), u.id, 'sunucu', 'İki adımlı giriş sunucuda sıfırlandı', u.email]);
  console.log(r.affectedRows ? `${u.email}: iki adımlı giriş sıfırlandı, oturumlar kapatıldı.` : `${u.email}: iki adımlı giriş zaten kapalıydı, oturumlar kapatıldı.`);
})().then(() => db.close().then(() => process.exit(0))).catch((e) => { console.error('Hata: ' + e.message); db.close().catch(() => {}).then(() => process.exit(1)); });
