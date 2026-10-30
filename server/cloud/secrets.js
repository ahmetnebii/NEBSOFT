// Entegrasyon kimlik bilgilerinin korunması (AES-256-GCM, anahtar: NEBSOFT_SECRET veya data/secret.key).
// Kapsam (program → gizli alanların bulunduğu grup):
//   entegrasyon → cfg.<tür>.<alan>      pazaryeri → channels.<kanal>.<alan>      pos → qcChannels.<kanal>.<alan>      eticaret → mpChannels.<kanal>.<alan>
// Akış:
//  • Yazarken (PUT /api/data/:app): gizli alanlar "enc:v1:<base64>" olarak şifrelenir. Program yer tutucuyu (aşağıda) geri gönderirse
//    mevcut şifreli değer korunur; yeni bir değer yazılmışsa o şifrelenir.
//  • Okurken (GET /api/data/:app, çakışma yanıtı): gizli değerin kendisi DEĞİL, "__nsg_<program>_<grup>_<alan>__" yer tutucusu döner.
//    Böylece şifre / anahtar hiçbir zaman tarayıcıya, cihazın yerel depolamasına veya ekran görüntüsüne gitmez.
//  • Dış servise istek (POST /api/istek, /api/kanal): istekteki yer tutucular sunucuda, o işletmenin şifreli değeriyle değiştirilir.
//    "Basic <base64>" başlıklarının içindeki yer tutucular da çözülüp yeniden kodlanır.
//  • Anahtar değişirse çözülemeyen alanlar boş kalır ve ilgili entegrasyon yeniden kurulmalıdır.
const cfg = require('./config');
const fs = require('fs');
const path = require('path');
const GROUPS = { entegrasyon: 'cfg', pazaryeri: 'channels', pos: 'qcChannels', eticaret: 'mpChannels' };
const SECRET = new Set(['pass', 'password', 'secret', 'token', 'apiSecret', 'apiKey', 'hash', 'key', 'clientSecret', 'clientId', 'merchantKey', 'merchantSalt', 'headers']);
const PFX = 'enc:v1:';
const TOKEN_RE = /__nsg_([a-z0-9]+)_([a-z0-9]+)_([A-Za-z0-9]+)__/g;
const token = (app, grp, field) => `__nsg_${app}_${grp}_${field}__`;
// "user" alanı sağlayıcıya göre değişir. Düz kalanlar kullanıcı adıdır: SMS (Netgsm, Verimor, Mutlucell), e-Fatura (Uyumsoft, Paraşüt), MQTT.
// Şifrelenenler API anahtarı olabilir: formu "Kullanıcı adı / API key" diyen bağlantılar (pazaryeri, kargo, e-Belge vb.) ve e-Fatura özel API.
const userKey = (app, grp, c) => app === 'entegrasyon' && (grp === 'efatura' ? c.provider === 'custom' : grp !== 'sms' && c.provider !== 'mqtt');
const isSecret = (k, v, app, grp, c) => typeof v === 'string' && v !== '' && (SECRET.has(k) || (k === 'user' && (v.startsWith(PFX) || /^__nsg_/.test(v) || userKey(app, grp, c)))); // sağlayıcı değişse de şifreli değer açığa çıkmaz
const enc = (v) => PFX + cfg.encrypt(v);
const dec = (v) => { if (typeof v !== 'string' || !v.startsWith(PFX)) return v; try { return cfg.decrypt(v.slice(PFX.length)); } catch (e) { return ''; } };
// data[grup][anahtar][alan] üzerinde gizli alanları dönüştürür
function walk(app, data, fn) {
  const g = GROUPS[app]; if (!g || !data || typeof data !== 'object' || !data[g] || typeof data[g] !== 'object') return data;
  const out = { ...data, [g]: {} };
  for (const [grp, c] of Object.entries(data[g])) {
    out[g][grp] = c && typeof c === 'object' && !Array.isArray(c) ? Object.fromEntries(Object.entries(c).map(([k, v]) => [k, isSecret(k, v, app, grp, c) ? fn(v, grp, k) : v])) : c;
  }
  return out;
}
const prevVal = (app, prev, grp, k) => { const g = GROUPS[app]; return prev && prev[g] && prev[g][grp] ? prev[g][grp][k] : undefined; };
// Kaydetmeden önce: yer tutucu → önceki şifreli değer; düz değer → şifreli
const seal = (app, data, prev) => walk(app, data, (v, grp, k) => {
  if (v.startsWith(PFX)) return v;
  if (v === token(app, grp, k) || /^__nsg_/.test(v)) { const p = prevVal(app, prev, grp, k); return typeof p === 'string' && p.startsWith(PFX) ? p : typeof p === 'string' && p && !/^__nsg_/.test(p) ? enc(p) : ''; }
  return enc(v);
});
// Sunucu içi kullanım (geçiş, sunucu tarafı işlemler): şifreli → düz
const open = (app, data) => walk(app, data, (v) => dec(v));
// İstemciye gönderilen görünüm: gizli alan yerine yer tutucu
const mask = (app, data) => walk(app, data, (v, grp, k) => token(app, grp, k));

// Gizli bilgi yalnızca entegrasyon kodunda geçen sağlayıcı adreslerine veya o entegrasyonun kayıtlı adresine gider.
// Liste kodun kendisinden okunur: yeni sağlayıcı eklenince elle güncelleme gerekmez.
const hostOf = (u) => { try { return new URL(String(u)).hostname.toLowerCase(); } catch (e) { return ''; } };
let KNOWN = null;
function knownHosts() {
  if (KNOWN) return KNOWN; KNOWN = new Set();
  for (const f of ['integrations.js', 'integ-wizard.js', 'ubltr.js']) { try { for (const m of fs.readFileSync(path.join(__dirname, '..', '..', 'core', f), 'utf8').matchAll(/https:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi)) KNOWN.add(hostOf(m[0])); } catch (e) { /* dosya yoksa yalnızca kayıtlı adresler geçerli */ } }
  return KNOWN;
}
const registered = (conf, host) => Object.values(conf || {}).some((v) => typeof v === 'string' && !v.startsWith(PFX) && (v.match(/https?:\/\/[^\s"'<>]+/g) || []).some((u) => hostOf(u) === host));

// İstekteki yer tutucuları o işletmenin gerçek değerleriyle değiştirir
async function resolve(db, tenantId, obj) {
  const s = JSON.stringify(obj || {}); const hasB64 = /Basic\s+[A-Za-z0-9+/=]{8,}/.test(s);
  if (!/__nsg_/.test(s) && !hasB64) return obj;
  const cache = {}; const used = new Set();
  const val = async (app, grp, field) => {
    if (!GROUPS[app]) return ''; used.add(`${app}\n${grp}`);
    if (!(app in cache)) { const r = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [tenantId, app]); cache[app] = await require('./belge').oku(tenantId, app, r); }
    const v = prevVal(app, cache[app], grp, field); return typeof v === 'string' ? dec(v) : '';
  };
  const sub = async (str) => {
    let out = ''; let last = 0; TOKEN_RE.lastIndex = 0; let m;
    const parts = []; while ((m = TOKEN_RE.exec(str))) parts.push([m.index, m[0], m[1], m[2], m[3]]);
    // XML öğesinin içindeki yer tutucu (ör. SOAP <o:Password>…</o:Password>): değer XML kaçışlı yazılır, şifredeki & < > belgeyi bozmaz
    const xmlEsc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    for (const [i, t, a, g, f] of parts) { const v = await val(a, g, f); const inXml = str[i - 1] === '>' && str.slice(i + t.length, i + t.length + 2) === '</'; out += str.slice(last, i) + (inXml ? xmlEsc(v) : v); last = i + t.length; }
    return out + str.slice(last);
  };
  const fix = async (x) => {
    if (typeof x === 'string') {
      let y = /__nsg_/.test(x) ? await sub(x) : x;
      // Basic <base64(kullanıcı:şifre)> içinde yer tutucu
      const bm = /^(Basic\s+)([A-Za-z0-9+/=]+)$/.exec(y);
      if (bm) { const raw = Buffer.from(bm[2], 'base64').toString('utf8'); if (/__nsg_/.test(raw)) y = bm[1] + Buffer.from(await sub(raw), 'utf8').toString('base64'); }
      // URL içinde kodlanmış yer tutucu (yer tutucu yalnızca harf, rakam ve "_" içerdiği için kodlamada değişmez)
      return y;
    }
    if (Array.isArray(x)) return Promise.all(x.map(fix));
    if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) o[k] = await fix(v); return o; }
    return x;
  };
  const out = await fix(obj);
  if (used.size && obj && obj.url) {
    const host = hostOf(obj.url); const kayitli = [...used].some((u) => { const [app, grp] = u.split('\n'); const g = cache[app] && cache[app][GROUPS[app]]; return g && registered(g[grp], host); });
    if (!knownHosts().has(host) && !kayitli) throw Object.assign(new Error('Kayıtlı bilgiler yalnızca entegrasyonun kendi adresine gönderilir'), { status: 400 });
  }
  return out;
}

// Bir kerelik geçiş: daha önce düz metin kaydedilmiş gizli alanları (ve son 48 saatlik geçmişi) şifreler
async function migrate(db) {
  let n = 0;
  for (const app of Object.keys(GROUPS)) {
    for (const table of ['app_data', 'app_data_history']) {
      const key = table === 'app_data' ? 'tenant_id' : 'id';
      const rows = await db.q(`SELECT ${key} AS k, data FROM ${table} WHERE app=?`, [app]);
      for (const r of rows) {
        let d; try { d = JSON.parse(r.data); } catch (e) { continue; } // şifreli belge zaten mühürlüdür
        const t = JSON.stringify(seal(app, d, d)); if (t === r.data) continue;
        await db.q(`UPDATE ${table} SET data=? WHERE ${key}=? AND app=?`, [t, r.k, app]); n++;
      }
    }
  }
  return n;
}
const covers = (app) => !!GROUPS[app];
module.exports = { seal, open, mask, resolve, hostOf, knownHosts, migrate, covers, token, SECRET, enc, dec };
