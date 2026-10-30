// Acil geri dönüş: şifreli program belgelerini veritabanında düz metne çevirir. Yalnızca eski sürüme dönülecekse kullanılır.
//   node scripts/belge-coz.js --evet
// Önce veritabanı yedeği alın. Sunucuyu durdurun: yeni kod açılışta belgeleri yeniden şifreler.
const cfg = require('../server/cloud/config');
const db = require('../server/cloud/db');
const belge = require('../server/cloud/belge');

(async () => {
  if (!process.argv.includes('--evet')) { console.log('Bu betik sağlık verisini şifresiz yazar. Çalıştırmak için: node scripts/belge-coz.js --evet'); process.exit(1); }
  await db.connect(cfg.load()); let n = 0;
  for (const r of await db.q("SELECT tenant_id, app, version FROM app_data WHERE data LIKE 'nsdoc1:%'")) {
    const s = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=? AND version=?', [r.tenant_id, r.app, r.version]); if (!s) continue;
    n += (await db.q('UPDATE app_data SET data=? WHERE tenant_id=? AND app=? AND version=?', [await belge.ac(r.tenant_id, r.app, s.data), r.tenant_id, r.app, r.version])).affectedRows;
  }
  for (const r of await db.q("SELECT id, tenant_id, app FROM app_data_history WHERE data LIKE 'nsdoc1:%'")) {
    const s = await db.one('SELECT data FROM app_data_history WHERE id=?', [r.id]); if (!s) continue;
    n += (await db.q('UPDATE app_data_history SET data=? WHERE id=?', [await belge.ac(r.tenant_id, r.app, s.data), r.id])).affectedRows;
  }
  console.log(`${n} kayıt düz metne çevrildi`); process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
