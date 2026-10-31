// MySQL / MariaDB bağlantı havuzu ve tablo şeması. Tüm sorgular parametreli (SQL enjeksiyonuna kapalı).
// mysql2 yalnızca veritabanı bağlanırken yüklenir: masaüstü sürümündeki yerel köprü (server.js) paket olmadan da çalışır
let mysqlMod = null; const mysql = { createConnection: (...a) => (mysqlMod = mysqlMod || require('mysql2/promise')).createConnection(...a), createPool: (...a) => (mysqlMod = mysqlMod || require('mysql2/promise')).createPool(...a) };

let pool = null; let info = null;
const opts = (c) => ({ host: c.host, port: Number(c.port) || 3306, user: c.user, password: c.password, database: c.database, charset: 'utf8mb4', timezone: 'Z', dateStrings: false, supportBigNumbers: true, connectTimeout: 8000, ...(c.ssl ? { ssl: { rejectUnauthorized: c.sslVerify !== false } } : {}) });

async function test(c) {
  const conn = await mysql.createConnection(opts(c));
  try {
    const [[v]] = await conn.query('SELECT VERSION() AS v, DATABASE() AS d');
    // Şema oluşturma yetkisi var mı?
    await conn.query('CREATE TABLE IF NOT EXISTS _ns_probe (id INT) ENGINE=InnoDB'); await conn.query('DROP TABLE _ns_probe');
    return { version: v.v, database: v.d };
  } finally { await conn.end(); }
}
async function connect(c) {
  if (pool) await pool.end().catch(() => {});
  pool = mysql.createPool({ ...opts(c), connectionLimit: Number(process.env.DB_POOL) || 10, waitForConnections: true, enableKeepAlive: true });
  const [[v]] = await pool.query('SELECT VERSION() AS v'); info = { host: c.host, database: c.database, version: v.v };
  await migrate(); return info;
}
const ready = () => !!pool;
const q = async (sql, params = []) => { if (!pool) throw Object.assign(new Error('Veritabanı yapılandırılmadı'), { code: 'NO_DB' }); const [rows] = await pool.execute(sql, params); return rows; };
const one = async (sql, params) => (await q(sql, params))[0] || null;
async function tx(fn) { const c = await pool.getConnection(); try { await c.beginTransaction(); const r = await fn({ q: async (s, p = []) => (await c.execute(s, p))[0] }); await c.commit(); return r; } catch (e) { await c.rollback(); throw e; } finally { c.release(); } }

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tenants (id CHAR(16) PRIMARY KEY, name VARCHAR(160) NOT NULL, slug VARCHAR(80) NOT NULL UNIQUE, tax_no VARCHAR(20), tax_office VARCHAR(80), city VARCHAR(60), address VARCHAR(255), phone VARCHAR(40), sector VARCHAR(60), ref_code VARCHAR(16) NOT NULL UNIQUE, referred_by CHAR(16) NULL, referral_rewarded TINYINT NOT NULL DEFAULT 0, webhook_token CHAR(32) NOT NULL, status VARCHAR(16) NOT NULL DEFAULT 'active', note TEXT, created DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS users (id CHAR(16) PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, name VARCHAR(120) NOT NULL, phone VARCHAR(40), role VARCHAR(16) NOT NULL DEFAULT 'customer', tenant_id CHAR(16) NULL, status VARCHAR(16) NOT NULL DEFAULT 'active', failed INT NOT NULL DEFAULT 0, locked_until DATETIME NULL, kvkk_at DATETIME NULL, created DATETIME NOT NULL, last_login DATETIME NULL, last_ip VARCHAR(64), INDEX (tenant_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS sessions (id CHAR(64) PRIMARY KEY, user_id CHAR(16) NOT NULL, created DATETIME NOT NULL, expires DATETIME NOT NULL, ip VARCHAR(64), ua VARCHAR(255), INDEX (user_id), INDEX (expires)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS licenses (id CHAR(16) PRIMARY KEY, tenant_id CHAR(16) NOT NULL, product VARCHAR(40) NOT NULL, plan TINYINT NOT NULL DEFAULT 1, period VARCHAR(10) NOT NULL DEFAULT 'aylik', branches INT NOT NULL DEFAULT 1, status VARCHAR(16) NOT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, lic_key VARCHAR(40) NOT NULL, order_id CHAR(16) NULL, UNIQUE KEY tp (tenant_id, product), INDEX (end)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS orders (id CHAR(16) PRIMARY KEY, no VARCHAR(20) NOT NULL UNIQUE, tenant_id CHAR(16) NOT NULL, user_id CHAR(16) NOT NULL, items LONGTEXT NOT NULL, subtotal DECIMAL(12,2) NOT NULL, discount DECIMAL(12,2) NOT NULL DEFAULT 0, vat DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL, coupon VARCHAR(40), status VARCHAR(20) NOT NULL, billing LONGTEXT, note VARCHAR(255), created DATETIME NOT NULL, paid_at DATETIME NULL, approved_by CHAR(16) NULL, INDEX (status), INDEX (tenant_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS bank_accounts (id CHAR(16) PRIMARY KEY, holder VARCHAR(160) NOT NULL, iban VARCHAR(34) NOT NULL, bank VARCHAR(80) NOT NULL, active TINYINT NOT NULL DEFAULT 1, created DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS app_data (tenant_id CHAR(16) NOT NULL, app VARCHAR(40) NOT NULL, data LONGTEXT NOT NULL, version INT NOT NULL, updated DATETIME NOT NULL, updated_by CHAR(16) NULL, PRIMARY KEY (tenant_id, app)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS app_data_history (id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id CHAR(16) NOT NULL, app VARCHAR(40) NOT NULL, version INT NOT NULL, data LONGTEXT NOT NULL, at DATETIME NOT NULL, INDEX (tenant_id, app, version)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS coupons (code VARCHAR(40) PRIMARY KEY, pct INT NOT NULL, active TINYINT NOT NULL DEFAULT 1, uses INT NOT NULL DEFAULT 0, max_uses INT NULL, expires DATE NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS leads (id CHAR(16) PRIMARY KEY, name VARCHAR(120), phone VARCHAR(40), email VARCHAR(190), biz VARCHAR(160), type VARCHAR(30), product VARCHAR(40), msg TEXT, status VARCHAR(16) NOT NULL DEFAULT 'yeni', ip VARCHAR(64), created DATETIME NOT NULL, INDEX (created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS tickets (id CHAR(16) PRIMARY KEY, tenant_id CHAR(16) NOT NULL, user_id CHAR(16) NOT NULL, subject VARCHAR(200) NOT NULL, product VARCHAR(40), status VARCHAR(16) NOT NULL, messages LONGTEXT NOT NULL, created DATETIME NOT NULL, updated DATETIME NOT NULL, INDEX (tenant_id), INDEX (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS audit (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, user_id CHAR(16) NULL, tenant_id CHAR(16) NULL, ip VARCHAR(64), action VARCHAR(60) NOT NULL, detail VARCHAR(500), INDEX (at), INDEX (tenant_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS settings (k VARCHAR(60) PRIMARY KEY, v TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS product_pool (barcode VARCHAR(32) PRIMARY KEY, name VARCHAR(200) NOT NULL, brand VARCHAR(120), image VARCHAR(400), category VARCHAR(80), uses INT NOT NULL DEFAULT 1, source VARCHAR(16), updated DATETIME NOT NULL, FULLTEXT KEY ft (name, brand)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Ortak katalog: dış kaynak ve kendi kayıtlarımız lisans gereği ayrı tablolarda; catalog_suggest'te işletme kimliği sütunu bilerek yoktur. product_pool artık okunmaz (göç: katalog.js)
  `CREATE TABLE IF NOT EXISTS catalog_ext (gtin CHAR(14) NOT NULL, kaynak VARCHAR(16) NOT NULL, ad VARCHAR(500) NOT NULL, marka VARCHAR(300), kategori VARCHAR(800), gorsel VARCHAR(500), lisans VARCHAR(40) NOT NULL, kaynak_url VARCHAR(300) NOT NULL, alindi DATETIME NOT NULL, PRIMARY KEY (gtin, kaynak), KEY ad (ad(60))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS catalog_own (gtin CHAR(14) PRIMARY KEY, ad VARCHAR(200) NOT NULL, ad_norm VARCHAR(200) NOT NULL, marka VARCHAR(120), kategori VARCHAR(80), kaynak VARCHAR(80) NOT NULL, lisans VARCHAR(200) NOT NULL, kaynak_url VARCHAR(300) NOT NULL, alindi DATETIME NOT NULL, ust_kaynak VARCHAR(16) NULL, oneri_id BIGINT NULL, onaylayan CHAR(16) NULL, guncel DATETIME NOT NULL, KEY an (ad_norm(60))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS catalog_suggest (id BIGINT AUTO_INCREMENT PRIMARY KEY, gtin VARCHAR(32) NOT NULL, ad VARCHAR(200) NOT NULL, ad_norm VARCHAR(200) NOT NULL, marka VARCHAR(120), kategori VARCHAR(80), kaynak VARCHAR(80) NOT NULL, lisans VARCHAR(200) NOT NULL, kaynak_url VARCHAR(300) NOT NULL, izin VARCHAR(200) NULL, alindi DATETIME NOT NULL, sayac INT NOT NULL DEFAULT 1, durum VARCHAR(12) NOT NULL DEFAULT 'bekliyor', bayrak VARCHAR(40) NULL, neden VARCHAR(200) NULL, karar_veren CHAR(16) NULL, karar_zamani DATETIME NULL, UNIQUE KEY tekil (gtin, ad_norm, kaynak), KEY d (durum, sayac)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS catalog_merge (id BIGINT AUTO_INCREMENT PRIMARY KEY, oneri_id BIGINT NOT NULL, hedef_gtin CHAR(14) NOT NULL, onceki LONGTEXT, sonraki LONGTEXT NOT NULL, yapan CHAR(16) NULL, zaman DATETIME NOT NULL, geri_alindi DATETIME NULL, geri_alan CHAR(16) NULL, KEY h (hedef_gtin)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS kb_log (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, kind VARCHAR(12) NOT NULL, q VARCHAR(300) NOT NULL, app VARCHAR(40), entry VARCHAR(16), page VARCHAR(60), done TINYINT NOT NULL DEFAULT 0, KEY k (kind, done)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS biz_sites (tenant_id CHAR(16) PRIMARY KEY, data LONGTEXT NOT NULL, published TINYINT NOT NULL DEFAULT 0, domain VARCHAR(190) NULL UNIQUE, orders INT NOT NULL DEFAULT 0, updated DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS email_codes (id CHAR(64) PRIMARY KEY, email VARCHAR(190) NOT NULL, purpose VARCHAR(16) NOT NULL, code_hash CHAR(64) NOT NULL, meta TEXT, expires DATETIME NOT NULL, attempts INT NOT NULL DEFAULT 0, INDEX (email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS mail_log (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, to_addr VARCHAR(190), subject VARCHAR(200), status VARCHAR(20), detail VARCHAR(255), INDEX (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS login_links (id CHAR(64) PRIMARY KEY, user_id CHAR(16) NOT NULL, created DATETIME NOT NULL, expires DATETIME NOT NULL, used DATETIME NULL, ip VARCHAR(64), INDEX (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // İki adımlı giriş (totp.js): secret şifreli, recovery yalnızca özet, last_step aynı kodun tekrarını engeller
  `CREATE TABLE IF NOT EXISTS onay_harcanan (n VARCHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY, bitis BIGINT NOT NULL, INDEX (bitis))`,
  `CREATE TABLE IF NOT EXISTS user_totp (user_id CHAR(16) PRIMARY KEY, secret TEXT NOT NULL, enabled TINYINT NOT NULL DEFAULT 0, last_step BIGINT NOT NULL DEFAULT 0, failed INT NOT NULL DEFAULT 0, locked_until DATETIME NULL, recovery TEXT NULL, created DATETIME NOT NULL, enabled_at DATETIME NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Analitik: yalnızca toplu sayaçlar (ham olay yok). an_tekil günlük tuzlu özet tutar, gün dönünce silinir. log_kayit: uygulama kanalının uyarı ve hataları.
  `CREATE TABLE IF NOT EXISTS an_toplam (gun DATE NOT NULL, saat TINYINT NOT NULL, tur VARCHAR(16) NOT NULL, anahtar VARCHAR(100) NOT NULL DEFAULT '', ek VARCHAR(100) NOT NULL DEFAULT '', n INT NOT NULL DEFAULT 0, PRIMARY KEY (gun, saat, tur, anahtar, ek), KEY tg (tur, gun)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS an_tekil (gun DATE NOT NULL, ozet CHAR(32) NOT NULL, PRIMARY KEY (gun, ozet)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS an_sistem (gun DATE NOT NULL, saat TINYINT NOT NULL, yol VARCHAR(120) NOT NULL, n INT NOT NULL DEFAULT 0, h5 INT NOT NULL DEFAULT 0, h4 INT NOT NULL DEFAULT 0, yavas INT NOT NULL DEFAULT 0, ms_top BIGINT NOT NULL DEFAULT 0, ms_max INT NOT NULL DEFAULT 0, PRIMARY KEY (gun, saat, yol)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS log_kayit (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, kanal VARCHAR(12) NOT NULL, seviye VARCHAR(8) NOT NULL, olay VARCHAR(80) NOT NULL, mesaj VARCHAR(500), istek VARCHAR(16), veri TEXT, INDEX (at), INDEX (seviye, at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS inbox (id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id CHAR(16) NOT NULL, channel VARCHAR(40) NOT NULL, payload MEDIUMTEXT NOT NULL, at DATETIME NOT NULL, INDEX (tenant_id, channel)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // E-ticaret kart ödemesi: yarım kalan siparişi bulmak ve iade kilidi için (sipariş belgesi şifreli olabilir, SQL ile aranamaz)
  `CREATE TABLE IF NOT EXISTS eticaret_odeme (tenant_id CHAR(16) NOT NULL, order_id VARCHAR(40) NOT NULL, durum VARCHAR(20) NOT NULL, kilit DATETIME NULL, created DATETIME NOT NULL, updated DATETIME NOT NULL, PRIMARY KEY (tenant_id, order_id), INDEX (durum, created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Borç tahsilatı (tahsilat-odeme.js): sonuç gelene kadar durum burada, kişisel bilgi yok. Belge şifreli olabilir, SQL ile aranamaz
  `CREATE TABLE IF NOT EXISTS online_tahsilat (tenant_id CHAR(16) NOT NULL, app VARCHAR(30) NOT NULL, id VARCHAR(40) NOT NULL, sahip VARCHAR(60) NOT NULL, tutar DECIMAL(12,2) NOT NULL, durum VARCHAR(20) NOT NULL, test TINYINT NOT NULL DEFAULT 0, saglayici VARCHAR(20) NOT NULL, veri MEDIUMTEXT NOT NULL, kilit DATETIME NULL, created DATETIME NOT NULL, updated DATETIME NOT NULL, PRIMARY KEY (tenant_id, id), INDEX (durum, created), INDEX (tenant_id, app, created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Bağlantıyı dene sonucu (entegrasyon-api.js): durum yalnız sağlayıcının yanıtından yazılır. parmak: denemenin geçtiği bilgilerin HMAC'i, bilgi değişirse iş akışı durur
  `CREATE TABLE IF NOT EXISTS entegrasyon_durum (tenant_id CHAR(16) NOT NULL, tur VARCHAR(20) NOT NULL, saglayici VARCHAR(30) NOT NULL, durum VARCHAR(12) NOT NULL, mesaj VARCHAR(400), parmak CHAR(64) NOT NULL DEFAULT '', test TINYINT NOT NULL DEFAULT 0, son_deneme DATETIME NOT NULL, PRIMARY KEY (tenant_id, tur, saglayici)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Shopier: sipariş başına tek ödeme ürünü · işlenen her Shopier siparişi (tekrar işlemeyi önler) · alınan webhook kimlikleri
  `CREATE TABLE IF NOT EXISTS shopier_payments (order_id CHAR(16) PRIMARY KEY, product_id VARCHAR(64) NULL UNIQUE, product_url VARCHAR(400) NULL, amount DECIMAL(12,2) NOT NULL, status VARCHAR(20) NOT NULL, shop_order_id VARCHAR(64) NULL, alert VARCHAR(255) NULL, closed TINYINT NOT NULL DEFAULT 0, created DATETIME NOT NULL, updated DATETIME NOT NULL, last_check DATETIME NULL, INDEX (closed)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS shopier_orders (shop_id VARCHAR(64) PRIMARY KEY, order_id CHAR(16) NOT NULL, product_id VARCHAR(64) NOT NULL, total VARCHAR(20), currency VARCHAR(8), result VARCHAR(20) NOT NULL, detail VARCHAR(255), at DATETIME NOT NULL, INDEX (order_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS shopier_events (id VARCHAR(80) PRIMARY KEY, event VARCHAR(40) NOT NULL, at DATETIME NOT NULL, INDEX (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS trial_mail (id BIGINT AUTO_INCREMENT PRIMARY KEY, license_id CHAR(16) NOT NULL, step VARCHAR(8) NOT NULL, to_addr VARCHAR(190), status VARCHAR(20) NOT NULL, attempts INT NOT NULL DEFAULT 1, detail VARCHAR(255), at DATETIME NOT NULL, UNIQUE KEY ls (license_id, step), INDEX (to_addr, at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS mail_prefs (user_id CHAR(16) PRIMARY KEY, trial_off TINYINT NOT NULL DEFAULT 0, marketing TINYINT NOT NULL DEFAULT 0, marketing_at DATETIME NULL, marketing_src VARCHAR(40), marketing_ip VARCHAR(64), updated DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS reviews (id CHAR(16) PRIMARY KEY, product VARCHAR(40) NULL, author VARCHAR(120) NOT NULL, biz VARCHAR(160), city VARCHAR(60), text VARCHAR(1200) NOT NULL, review_at DATE NOT NULL, consent TINYINT NOT NULL, consent_at DATE NOT NULL, proof VARCHAR(200), published TINYINT NOT NULL DEFAULT 0, created DATETIME NOT NULL, INDEX (product, published)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS case_studies (id CHAR(16) PRIMARY KEY, product VARCHAR(40) NULL, biz VARCHAR(160) NOT NULL, sector VARCHAR(80), city VARCHAR(60), title VARCHAR(200) NOT NULL, problem VARCHAR(1500) NOT NULL, solution VARCHAR(1500) NOT NULL, result VARCHAR(1500) NOT NULL, period VARCHAR(80) NOT NULL, case_at DATE NOT NULL, consent TINYINT NOT NULL, consent_at DATE NOT NULL, proof VARCHAR(200), published TINYINT NOT NULL DEFAULT 0, created DATETIME NOT NULL, INDEX (product, published)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Kurumsal teklif: oda, dernek, bayi ve toplu alım talepleri. kvkk_at aydınlatma onayıdır; ticari_izin ayrı ve isteğe bağlıdır.
  // Dosya deposu (dosya.js): bayt diskte, burada sahibi ve sınıfı. ozet tekrar çalışan geçişte aynı dosyayı bulur; yetim: belgede referansın ilk yok görüldüğü an
  `CREATE TABLE IF NOT EXISTS dosyalar (id CHAR(32) PRIMARY KEY, tenant_id CHAR(16) NOT NULL, app VARCHAR(40) NOT NULL, sinif VARCHAR(8) NOT NULL, tur VARCHAR(16) NOT NULL, boyut INT NOT NULL, ozet CHAR(64) NOT NULL, yukleyen CHAR(16) NULL, created DATETIME NOT NULL, yetim DATETIME NULL, KEY ts (tenant_id, sinif, ozet)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Güven sayfaları (vitrin.js): iş ortağı başvurusu, öneri kutusu, herkese açık bakım kaydı. vitrin_izin başvuranın kendi onayıdır, vitrin panelden açılır; ozet aynı önerinin tekrarını engeller
  `CREATE TABLE IF NOT EXISTS bayi_basvuru (id CHAR(16) PRIMARY KEY, tur VARCHAR(12) NOT NULL, unvan VARCHAR(160) NOT NULL, yetkili VARCHAR(120) NOT NULL, eposta VARCHAR(190) NOT NULL, telefon VARCHAR(40) NOT NULL, il VARCHAR(60) NOT NULL, notu TEXT, durum VARCHAR(16) NOT NULL DEFAULT 'yeni', vitrin_izin TINYINT NOT NULL DEFAULT 0, vitrin TINYINT NOT NULL DEFAULT 0, kvkk_at DATETIME NOT NULL, ticari_izin TINYINT NOT NULL DEFAULT 0, ticari_izin_at DATETIME NULL, created DATETIME NOT NULL, INDEX (durum), INDEX (created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS oneriler (id CHAR(16) PRIMARY KEY, program VARCHAR(40) NULL, yeni_program VARCHAR(120) NULL, metin VARCHAR(1500) NOT NULL, eposta VARCHAR(190) NULL, ozet CHAR(40) NOT NULL UNIQUE, durum VARCHAR(20) NOT NULL DEFAULT 'yeni', kvkk_at DATETIME NOT NULL, created DATETIME NOT NULL, INDEX (program), INDEX (created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS bakim_kayit (id CHAR(16) PRIMARY KEY, tur VARCHAR(12) NOT NULL, baslik VARCHAR(160) NOT NULL, aciklama VARCHAR(1000), bas DATETIME NOT NULL, bit DATETIME NULL, yayinda TINYINT NOT NULL DEFAULT 0, yazan CHAR(16) NULL, created DATETIME NOT NULL, INDEX (yayinda, bas)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS quotes (id CHAR(16) PRIMARY KEY, no VARCHAR(20) NOT NULL UNIQUE, kurum VARCHAR(160) NOT NULL, tur VARCHAR(20) NOT NULL, yetkili VARCHAR(120) NOT NULL, eposta VARCHAR(190) NOT NULL, telefon VARCHAR(40) NOT NULL, program_listesi TEXT NOT NULL, lisans INT NOT NULL DEFAULT 1, sube INT NOT NULL DEFAULT 1, \`not\` TEXT, durum VARCHAR(20) NOT NULL DEFAULT 'yeni', teklif_tutari DECIMAL(12,2) NULL, gecerlilik DATE NULL, kvkk_at DATETIME NOT NULL, ticari_izin TINYINT NOT NULL DEFAULT 0, ticari_izin_at DATETIME NULL, order_id CHAR(16) NULL, created DATETIME NOT NULL, INDEX (durum), INDEX (created)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];
// Var olan kurulumlara sütun ekleme: CREATE TABLE IF NOT EXISTS eski tabloyu değiştirmez. Sütun varsa dokunulmaz, eski satırlar NULL/varsayılan kalır.
const COLUMNS = [
  ['biz_sites', 'domain_tok', 'VARCHAR(40) NULL'], ['biz_sites', 'domain_ok', 'TINYINT NULL'], ['tenants', 'support_plan', 'VARCHAR(20) NULL'], ['tenants', 'support_until', 'DATETIME NULL'], ['orders', 'indirim', 'TEXT NULL'],
  ['tickets', 'plan', 'VARCHAR(20) NULL'], ['tickets', 'priority', 'TINYINT NULL'], ['tickets', 'first_due', 'DATETIME NULL'], ['tickets', 'resolve_due', 'DATETIME NULL'], ['tickets', 'first_reply_at', 'DATETIME NULL'], ['tickets', 'closed_at', 'DATETIME NULL'], ['tickets', 'breached', 'TINYINT NOT NULL DEFAULT 0'],
  ['leads', 'kvkk_at', 'DATETIME NULL'], // yalnız aydınlatma onayı alan formlarda dolar
  ['users', 'team_roles', 'TEXT NULL'], // ekip hesabının program rolleri (rol-kural.js); NULL: tam yetki
];
async function addColumns() {
  for (const [tablo, sutun, tip] of COLUMNS) {
    if ((await q('SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?', [tablo, sutun])).length) continue;
    try { await q(`ALTER TABLE \`${tablo}\` ADD COLUMN \`${sutun}\` ${tip}`); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; } // iki süreç aynı anda açılırsa ikincisi hata vermesin
  }
}
// Tablo kurulduktan sonra çalışan veri göçleri (modüller kaydeder; her biri kendi kez-kontrolünü yapar)
const goc = []; const gocEkle = (fn) => goc.push(fn);
async function migrate() { for (const s of SCHEMA) await q(s); await addColumns(); for (const fn of goc) await fn(); }

// Yöneticinin MySQL sunucusunda çalıştıracağı veritabanı + kullanıcı + yetki SQL'i
function setupSql({ database = 'nebsoft', user = 'nebsoft_app', host = '%', password }) {
  const id = (x) => String(x).replace(/[^A-Za-z0-9_]/g, '');
  const h = String(host).replace(/[^A-Za-z0-9_.%:-]/g, '') || '%';
  const pw = String(password).replace(/'/g, "''");
  return [
    `-- NEBSOFT veritabanı kurulumu (MySQL 8 / MariaDB 10.4+). root veya yetkili kullanıcıyla çalıştırın.`,
    `CREATE DATABASE IF NOT EXISTS \`${id(database)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `CREATE USER IF NOT EXISTS '${id(user)}'@'${h}' IDENTIFIED BY '${pw}';`,
    `-- Uygulama kullanıcısına yalnızca kendi veritabanında gereken yetkiler verilir (sunucu geneli yetki verilmez)`,
    `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON \`${id(database)}\`.* TO '${id(user)}'@'${h}';`,
    `FLUSH PRIVILEGES;`,
    `-- Uzak sunucudan bağlanacaksanız: my.cnf içinde bind-address ayarını ve güvenlik duvarında 3306 portunu yalnız uygulama sunucusunun IP'sine açın.`,
    `-- SSL önerilir: ALTER USER '${id(user)}'@'${h}' REQUIRE SSL;`,
  ].join('\n');
}
module.exports = { test, connect, ready, q, one, tx, migrate, gocEkle, setupSql, info: () => info, close: async () => { if (pool) await pool.end(); pool = null; } };
