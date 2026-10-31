// Entegrasyonun sunucu uçları. Anahtar tarayıcıya dönmez: bulutta kayıtlı değer sunucuda çözülür, istek sunucudan çıkar.
//  • POST /api/entegrasyon/dene   → "Bağlantıyı dene": yazılan alanlar + kayıtlı gizli değerlerle sağlayıcıya zararsız istek. Durum yalnız sağlayıcının yanıtından yazılır.
//  • POST /api/entegrasyon/islem  → iş akışı (SMS, e-posta...). Deneme geçmediyse çalışmaz: durum satırı yoksa veya kayıtlı bilgiler değiştiyse 409.
//  • GET  /api/entegrasyon/durum  → her tür için son deneme: Bağlı / hata / tarih.
const db = require('./db');
const belge = require('./belge');
const secrets = require('./secrets');
const log = require('./log');
const ent = require('./entegrasyon');
const { R, err, hesapRolu } = require('./routes');
const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt: { cloudOnly: true, ...opt }, fn });
const TUR = /^[a-z0-9]{2,20}$/; const SAG = /^[a-zA-Z0-9-]{2,30}$/;

async function kayitli(tid, tur) {
  const r = await db.one("SELECT data, version FROM app_data WHERE tenant_id=? AND app='entegrasyon'", [tid]); if (!r) return {};
  const d = await belge.oku(tid, 'entegrasyon', r); return (((d && secrets.open('entegrasyon', d)) || {}).cfg || {})[tur] || {};
}
// Sağlayıcı seçimi türe göre provider veya mode alanındadır
const saglayiciOf = (tur, c) => (tur === 'webhook' ? 'http' : String(c.provider || c.mode || ''));
// Boş veya yer tutuculu alanın yerine yalnız aynı türün aynı alanındaki kayıtlı değer konur: başka bir grubun gizli değeri bu yoldan okunamaz
function birlestir(s, govde, kayit) {
  const o = {}; for (const n of Object.keys(s.alanlar)) { const v = govde ? govde[n] : undefined; o[n] = v === undefined || v === null || v === '' || /^__nsg_/.test(String(v)) ? kayit[n] : v; } return o;
}
async function durumYaz(tid, tur, sag, r) {
  await db.q('INSERT INTO entegrasyon_durum (tenant_id, tur, saglayici, durum, mesaj, parmak, test, son_deneme) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE saglayici=VALUES(saglayici), durum=VALUES(durum), mesaj=VALUES(mesaj), parmak=VALUES(parmak), test=VALUES(test), son_deneme=VALUES(son_deneme)',
    [tid, tur, sag, r.ok ? 'bagli' : r.ilkIslem ? 'ilk-islem' : 'hata', String(r.ok ? r.mesaj : r.hata).slice(0, 400), r.parmak || '', r.test ? 1 : 0, new Date()]);
}
const durumRow = (x) => ({ tur: x.tur, saglayici: x.saglayici, durum: x.durum, mesaj: x.mesaj, test: !!x.test, sonDeneme: x.son_deneme });
const sahip = async (c) => { if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli'); if (await hesapRolu(c.user, 'entegrasyon')) throw err(403, 'Entegrasyonu yalnız hesap sahibi kurar'); };

route('POST', '/api/entegrasyon/dene', { auth: 'user', limit: ['entdene', 30, 60e3], bodyMax: 2e5 }, async (c) => {
  await sahip(c); const tur = String(c.body.tur || ''); const sag = String(c.body.saglayici || '');
  if (!TUR.test(tur) || !SAG.test(sag)) throw err(400, 'Geçersiz entegrasyon');
  const s = ent.bul(`${tur}:${sag}`); if (!s) throw err(404, 'Bu sağlayıcı için bağlantı kurulamıyor');
  const r = await ent.dene(`${tur}:${sag}`, birlestir(s, c.body.alanlar, await kayitli(c.user.tenant_id, tur)));
  await durumYaz(c.user.tenant_id, tur, sag, r); if (!r.ok) log.uygulama.hata('entegrasyon.dene', `${tur}:${sag} ${r.kod}`);
  const { parmak, ...acik } = r; return { ...acik, sonDeneme: new Date().toISOString() };
});
route('GET', '/api/entegrasyon/durum', { auth: 'user' }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli');
  const L = await db.q('SELECT tur, saglayici, durum, mesaj, test, son_deneme FROM entegrasyon_durum WHERE tenant_id=?', [c.user.tenant_id]);
  return { ok: true, liste: L.map(durumRow), saglayicilar: ent.ozet() };
});
route('POST', '/api/entegrasyon/islem', { auth: 'user', limit: ['entislem', 240, 60e3], bodyMax: 1e6 }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli'); const tid = c.user.tenant_id;
  const tur = String(c.body.tur || ''); const ad = String(c.body.islem || ''); if (!TUR.test(tur) || !/^[a-z-]{2,30}$/.test(ad)) throw err(400, 'Geçersiz işlem');
  const kayit = await kayitli(tid, tur); const sag = saglayiciOf(tur, kayit); const anahtar = `${tur}:${sag}`; const s = ent.bul(anahtar); if (!s) return { ok: false, kod: 'yok', hata: 'Bu sağlayıcı için bağlantı kurulmadı' };
  const d = await db.one('SELECT durum, parmak FROM entegrasyon_durum WHERE tenant_id=? AND tur=? AND saglayici=?', [tid, tur, sag]);
  const ilk = s.deneme === 'ilk-islem' && d && d.durum === 'ilk-islem';
  if (!d || (d.durum !== 'bagli' && !ilk) || d.parmak !== ent.parmakIzi(anahtar, kayit)) return { ok: false, kod: 'baglanmadi', hata: `${s.ad} bağlantısı denenmedi. Entegrasyonlar sayfasından Bağlantıyı dene adımını tamamlayın.` };
  const r = await ent.islem(anahtar, ad, kayit, c.body.veri);
  // Zararsız ucu olmayan sağlayıcıda başarı ilk gerçek işlemin yanıtından yazılır, hata da aynı satıra düşer
  if (s.deneme === 'ilk-islem') await db.q('UPDATE entegrasyon_durum SET durum=?, mesaj=?, son_deneme=? WHERE tenant_id=? AND tur=? AND saglayici=?', [r.ok ? 'bagli' : 'ilk-islem', r.ok ? 'İlk gerçek işlem başarılı' : String(r.hata).slice(0, 400), new Date(), tid, tur, sag]);
  return r;
});
