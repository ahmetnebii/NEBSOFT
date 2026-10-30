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
  // Analitik: yalnızca toplu sayaçlar (ham olay yok). an_tekil günlük tuzlu özet tutar, gün dönünce silinir. log_kayit: uygulama kanalının uyarı ve hataları.
  `CREATE TABLE IF NOT EXISTS an_toplam (gun DATE NOT NULL, saat TINYINT NOT NULL, tur VARCHAR(16) NOT NULL, anahtar VARCHAR(100) NOT NULL DEFAULT '', ek VARCHAR(100) NOT NULL DEFAULT '', n INT NOT NULL DEFAULT 0, PRIMARY KEY (gun, saat, tur, anahtar, ek), KEY tg (tur, gun)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS an_tekil (gun DATE NOT NULL, ozet CHAR(32) NOT NULL, PRIMARY KEY (gun, ozet)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS an_sistem (gun DATE NOT NULL, saat TINYINT NOT NULL, yol VARCHAR(120) NOT NULL, n INT NOT NULL DEFAULT 0, h5 INT NOT NULL DEFAULT 0, h4 INT NOT NULL DEFAULT 0, yavas INT NOT NULL DEFAULT 0, ms_top BIGINT NOT NULL DEFAULT 0, ms_max INT NOT NULL DEFAULT 0, PRIMARY KEY (gun, saat, yol)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS log_kayit (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, kanal VARCHAR(12) NOT NULL, seviye VARCHAR(8) NOT NULL, olay VARCHAR(80) NOT NULL, mesaj VARCHAR(500), istek VARCHAR(16), veri TEXT, INDEX (at), INDEX (seviye, at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS inbox (id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id CHAR(16) NOT NULL, channel VARCHAR(40) NOT NULL, payload MEDIUMTEXT NOT NULL, at DATETIME NOT NULL, INDEX (tenant_id, channel)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  // Shopier: sipariş başına tek ödeme ürünü · işlenen her Shopier siparişi (tekrar işlemeyi önler) · alınan webhook kimlikleri
  `CREATE TABLE IF NOT EXISTS shopier_payments (order_id CHAR(16) PRIMARY KEY, product_id VARCHAR(64) NULL UNIQUE, product_url VARCHAR(400) NULL, amount DECIMAL(12,2) NOT NULL, status VARCHAR(20) NOT NULL, shop_order_id VARCHAR(64) NULL, alert VARCHAR(255) NULL, closed TINYINT NOT NULL DEFAULT 0, created DATETIME NOT NULL, updated DATETIME NOT NULL, last_check DATETIME NULL, INDEX (closed)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS shopier_orders (shop_id VARCHAR(64) PRIMARY KEY, order_id CHAR(16) NOT NULL, product_id VARCHAR(64) NOT NULL, total VARCHAR(20), currency VARCHAR(8), result VARCHAR(20) NOT NULL, detail VARCHAR(255), at DATETIME NOT NULL, INDEX (order_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS shopier_events (id VARCHAR(80) PRIMARY KEY, event VARCHAR(40) NOT NULL, at DATETIME NOT NULL, INDEX (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];
// Tablo kurulduktan sonra çalışan veri göçleri (modüller kaydeder; her biri kendi kez-kontrolünü yapar)
const goc = []; const gocEkle = (fn) => goc.push(fn);
async function migrate() { for (const s of SCHEMA) await q(s); for (const fn of goc) await fn(); }

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
