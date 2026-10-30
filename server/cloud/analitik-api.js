// Analitik uç noktaları: herkese açık olay kaydı (boyut ve oran sınırlı) ve yönetim paneli raporları.
const db = require('./db');
const auth = require('./auth');
const cat = require('./catalog');
const mail = require('./mail');
const log = require('./log');
const sec = require('./security');
const analitik = require('./analitik');
const { route, A, err, audit, valid } = require('./routes');

const programVar = (id) => id !== 'bundle' && !!cat.product(id);
const gpc = (req) => req.headers['sec-gpc'] === '1' || req.headers.dnt === '1';

// Deneme lisansı önbelleği: her ekran geçişinde veritabanına gitmemek için 5 dakika
const denemeBellek = new Map();
async function denemede(tid, pid) {
  const k = `${tid}|${pid}`; const x = denemeBellek.get(k); if (x && Date.now() - x.t < 300e3) return x.v;
  const l = await db.one('SELECT status, end FROM licenses WHERE tenant_id=? AND product=?', [tid, pid]); const v = !!l && l.status === 'deneme' && valid(l);
  if (denemeBellek.size > 5000) denemeBellek.clear(); denemeBellek.set(k, { t: Date.now(), v }); return v;
}

// csrf açık kalır (aynı kaynak + özel başlık); gövde 2 KB, IP başına dakikada 120 olay, tüm sunucuda dakikada 20.000 olay
route('POST', '/api/olay', { auth: 'none', db: false, bodyMax: 2048, limit: ['olay', 120, 60e3], metrik: false }, async (c) => {
  if (!sec.limit('olay:tum', 20000, 60e3)) throw err(429, 'Çok fazla istek. Biraz sonra tekrar deneyin.');
  const b = c.body; const ctx = { ip: c.ip, ua: String(c.req.headers['user-agent'] || '').slice(0, 300), host: c.req.headers.host, gpc: gpc(c.req) };
  if (b && b.tur === 'modul') { // sunucu kimliği ve deneme lisansını kendisi doğrular; istemcinin beyanına güvenmez
    const p = typeof b.program === 'string' ? b.program : ''; const u = db.ready() ? await auth.current(c.req) : null;
    if (u && u.tenant_id && p && await denemede(u.tenant_id, p)) ctx.isletme = u.tenant_id;
  }
  const r = await analitik.kaydet(b, ctx, programVar);
  if (r.neden === 'gecersiz') throw err(400, 'Geçersiz olay');
  return { ok: true, kayit: r.kayit };
});
// Bant yalnızca oturumu olmayan ziyaretçiye gösterilir
route('GET', '/api/olay/durum', { auth: 'none', db: false, limit: ['olayd', 120, 60e3], metrik: false }, async (c) => {
  if (!db.ready()) return { ok: true, acik: false, kayitli: false };
  const u = await auth.current(c.req).catch(() => null); return { ok: true, acik: await analitik.acik(), kayitli: !!u };
});

const gunSec = (c) => { const g = Math.round(Number(c.query.get('gun')) || 30); return [1, 7, 30, 90, 365].includes(g) ? g : 30; };
A('GET', '/analitik', async (c) => ({ ok: true, ...(await analitik.rapor(gunSec(c))) }));
A('GET', '/sistem', async (c) => ({ ok: true, ...(await analitik.sistemRaporu(gunSec(c))) }));
A('GET', '/loglar', async (c) => { const s = c.query.get('seviye'); return { ok: true, rows: await analitik.kayitlar(['uyari', 'hata'].includes(s) ? s : null) }; });
A('PUT', '/analitik/ayar', async (c) => {
  if (c.user.role !== 'superadmin') throw err(403, 'Yalnız süper yönetici');
  const v = await analitik.ayarKaydet(c.body || {}); await audit(c, 'Analitik ve saklama ayarları', JSON.stringify(v)); return { ok: true, ayar: v };
});

// Alarm e-postası (ayarda açıksa): aynı alarm türü için saatte en fazla bir
const sonMail = {};
analitik.hook.alarm = async (k) => {
  if (Date.now() - (sonMail[k.tur] || 0) < 3600e3 || !(await mail.ready())) return; sonMail[k.tur] = Date.now();
  const m = await mail.settings(); const r = await mail.send(m.replyTo || m.user, `Sistem uyarısı: ${k.ad}`, { title: k.ad, intro: k.mesaj, blocks: [{ type: 'p', text: 'Ayrıntılar yönetim panelinde: Analitik → Hata ve yavaşlık.' }] }, {});
  if (!r.ok) log.uygulama.uyari('eposta.alarm-gitmedi', { mesaj: r.error });
};
