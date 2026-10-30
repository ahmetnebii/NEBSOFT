// Personel PIN'i belgede düz durmaz. 4 hane kaba kuvvetle saniyede çözüleceği için özet, veritabanında bulunmayan sunucu anahtarıyla alınır (HMAC):
// veritabanı dökümü PIN vermez. Özet tarayıcıya hiç gitmez, doğrulama sunucuda yapılır; istemciye yalnızca pinVar gider.
const crypto = require('crypto');
const cfg = require('./config');
const log = require('./log');

const SURUM = 'h1';
const turet = (ana) => Buffer.from(crypto.hkdfSync('sha256', ana, 'nebsoft-pin', 'pin', 32));
const hesap = (ana, tid, app, uid, tuz, pin) => crypto.createHmac('sha256', turet(ana)).update(`${tid}\n${app}\n${uid}\n${tuz}\n${pin}`).digest('hex');
const nesne = (x) => x && typeof x === 'object' && !Array.isArray(x);
const esit = (a, b) => { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function ozet(tid, app, uid, pin) { const tuz = crypto.randomBytes(12).toString('hex'); return `${SURUM}$${tuz}$${hesap(cfg.anahtar(), tid, app, uid, tuz, String(pin).trim())}`; }
function dogrula(tid, app, u, pin) {
  if (!nesne(u)) return false; const p = String(pin == null ? '' : pin).trim(); if (!p) return false;
  if (u.pin != null && u.pin !== '') return esit(String(u.pin).trim(), p); // geçişten önceki kayıt
  const [s, tuz, oz] = String(u.pinH || '').split('$'); if (s !== SURUM || !oz) return false;
  return [cfg.anahtar(), cfg.anahtarEski()].filter(Boolean).some((ana) => esit(hesap(ana, tid, app, u.id, tuz, p), oz));
}
// Kaydetmeden önce: gelen düz PIN özetlenir, gelmeyen özet sunucudaki kayıttan geri konur. İstemcinin gönderdiği özet dikkate alınmaz.
function yazimda(tid, app, gelen, onceki) {
  if (!nesne(gelen)) return gelen; const o = { ...gelen };
  if (nesne(o._meta) && 'ownerPin' in o._meta) { const { ownerPin, ...m } = o._meta; o._meta = m; }
  if (!Array.isArray(o.users)) return o;
  const eski = new Map(((onceki && Array.isArray(onceki.users)) ? onceki.users : []).filter(nesne).map((u) => [u.id, u]));
  o.users = o.users.map((u) => {
    if (!nesne(u)) return u; const { pin, pinH, pinVar, ...r } = u; const e = eski.get(u.id);
    if (pin != null && String(pin).trim() !== '') r.pinH = ozet(tid, app, u.id, pin);
    else if (e && e.pinH) r.pinH = e.pinH;
    else if (e && e.pin != null && e.pin !== '') r.pinH = ozet(tid, app, u.id, e.pin);
    return r;
  });
  return o;
}
// İstemciye giden görünüm
function gorunum(belge) {
  if (!nesne(belge)) return belge; const o = { ...belge };
  if (nesne(o._meta) && 'ownerPin' in o._meta) { const { ownerPin, ...m } = o._meta; o._meta = m; }
  if (Array.isArray(o.users)) o.users = o.users.map((u) => { if (!nesne(u)) return u; const { pin, pinH, ...r } = u; return (pinH || (pin != null && pin !== '')) ? { ...r, pinVar: true } : r; });
  return o;
}
// Açılış geçişi: düz PIN'ler özete çevrilir, sürüm artar (açık sekmeler eski belgeyi bırakır). 48 saatlik geçmişten düz PIN silinir.
async function gecis(db) {
  const belge = require('./belge'); let n = 0;
  for (const r of await db.q("SELECT tenant_id, app, version FROM app_data WHERE data LIKE '%\"pin\":%' OR data LIKE '%\"ownerPin\":%'")) {
    try {
      const s = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=? AND version=?', [r.tenant_id, r.app, r.version]); if (!s) continue;
      const d = JSON.parse(await belge.ac(r.tenant_id, r.app, s.data)); if (!nesne(d) || !Array.isArray(d.users)) continue;
      if (!d.users.some((u) => nesne(u) && u.pin != null) && !(d._meta && 'ownerPin' in d._meta)) continue;
      const yeni = await belge.kapat(r.tenant_id, r.app, JSON.stringify(yazimda(r.tenant_id, r.app, { ...d, users: d.users.map((u) => { if (!nesne(u)) return u; const { pin, ...x } = u; return x; }) }, d)));
      n += (await db.q('UPDATE app_data SET data=?, version=version+1 WHERE tenant_id=? AND app=? AND version=?', [yeni, r.tenant_id, r.app, r.version])).affectedRows || 0;
    } catch (e) { log.uygulama.hata('pin.gecis', { mesaj: e.message, app: r.app }); }
  }
  for (const r of await db.q("SELECT id, tenant_id, app FROM app_data_history WHERE data LIKE '%\"pin\":%' OR data LIKE '%\"ownerPin\":%'")) {
    try {
      const s = await db.one('SELECT data FROM app_data_history WHERE id=?', [r.id]); if (!s) continue;
      const d = JSON.parse(await belge.ac(r.tenant_id, r.app, s.data)); if (!nesne(d)) continue;
      await db.q('UPDATE app_data_history SET data=? WHERE id=?', [await belge.kapat(r.tenant_id, r.app, JSON.stringify(gorunum(d))), r.id]);
    } catch (e) { log.uygulama.hata('pin.gecis', { mesaj: e.message, app: r.app }); }
  }
  return n;
}

// Yetkili onayı belirteci: PIN sunucuda doğrulandığında verilir; hesaba, programa ve işlem türüne bağlıdır, 5 dakika geçerlidir, tek kullanımlıktır.
// Harcanan belirteç veritabanında durur (onay_harcanan): süreç yeniden başlayınca da geçmez, birden çok süreç aynı listeyi görür. Kayıt, belirtecin süresi bitince silinir.
const ONAY_SURE = 5 * 60e3;
const onayMac = (g) => cfg.mac(`yetkili-onay:${g}`);
function onayUret(tid, app, hesap, onaylayan, islem) { const g = Buffer.from(JSON.stringify({ t: tid, a: app, h: hesap, o: onaylayan, i: String(islem || ''), n: crypto.randomBytes(9).toString('base64url'), e: Date.now() + ONAY_SURE })).toString('base64url'); return `${g}.${onayMac(g)}`; }
function onayOku(belirtec, tid, app, hesap) {
  if (typeof belirtec !== 'string' || belirtec.length > 400 || !belirtec.includes('.')) return null;
  const [g, imza] = belirtec.split('.'); if (!esit(onayMac(g), imza)) return null;
  let o; try { o = JSON.parse(Buffer.from(g, 'base64url').toString('utf8')); } catch (e) { return null; }
  return o && o.t === tid && o.a === app && o.h === hesap && o.e > Date.now() && o.i ? o : null;
}
// İstemcinin gönderdiği listeden imzası doğru, süresi geçmemiş, harcanmamış belirteçler. sira: listedeki yeri (istemci harcananı bundan siler).
async function onayAyikla(db, liste, tid, app, hesap) {
  const adaylar = (Array.isArray(liste) ? liste : [liste]).slice(0, 10).map((b, sira) => { const o = onayOku(b, tid, app, hesap); return o ? { ...o, sira } : null; }).filter(Boolean); if (!adaylar.length) return [];
  const var_ = new Set((await db.q(`SELECT n FROM onay_harcanan WHERE n IN (${adaylar.map(() => '?').join(',')})`, adaylar.map((o) => o.n))).map((r) => r.n)); return adaylar.filter((o) => !var_.has(o.n));
}
// ek.harcanan: Map(işlem → adet). Harcanacak belirteçler döner.
const onaySec = (onaylar, harcanan) => { const sec = []; for (const [i, adet] of harcanan || []) sec.push(...onaylar.filter((o) => o.i === i).slice(0, adet)); return sec; };
// Kayıt yazılamadıysa (sürüm çakışması) belirteç boşa gitmesin
async function onayGeriVer(db, secilen) { for (const o of secilen) await db.q('DELETE FROM onay_harcanan WHERE n=?', [o.n]); }
// false: aynı anda başka istek aynı belirteci harcadı
async function onayHarca(db, secilen) {
  await db.q('DELETE FROM onay_harcanan WHERE bitis < ?', [Date.now()]); const yazilan = [];
  for (const o of secilen) { try { await db.q('INSERT INTO onay_harcanan (n, bitis) VALUES (?,?)', [o.n, o.e]); yazilan.push(o); } catch (e) { if (e.code !== 'ER_DUP_ENTRY') throw e; await onayGeriVer(db, yazilan); return false; } }
  return true;
}

module.exports = { ozet, dogrula, yazimda, gorunum, gecis, onayUret, onayOku, onayAyikla, onaySec, onayHarca, onayGeriVer };
