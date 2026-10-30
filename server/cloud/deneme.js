// Deneme dönüşümü: 7 günlük deneme boyunca e-posta dizisi (1., 3., 6. gün), süre bitmeden hatırlatma, çıkış bağlantısı, izin kaydı ve yönetici takibi.
// Hukuki çerçeve (Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik, RG 15.7.2015/29417; değişiklik RG 4.1.2020/30998):
//  • Dizi, md. 6 kapsamında üyelik durumu ve kullanım bilgilendirmesidir: içinde tanıtım/teşvik yer almaz. Yine de her iletide çıkış bağlantısı vardır.
//  • Tanıtım satırı yalnızca izin (mail_prefs.marketing) + İYS beyanı + ticaret unvanı + MERSİS tamamsa eklenir (md. 5, 7, 8).
//  • Gönderilemeyen e-posta "gönderildi" kaydı almaz; trial_mail tablosu gerçek sonucu tutar. WhatsApp yalnızca taslak ve wa.me bağlantısıdır.
const db = require('./db'); const cfg = require('./config'); const sec = require('./security'); const mail = require('./mail');
const { R, err, site, audit, J, mailSite, setting, setSetting, pnameOf } = require('./routes');
const Adim = require('../../core/kurulum-adimlari');

const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt, fn });
const G = 864e5; const H = 36e5;
const ADIMLAR = ['g1', 'g3', 'g6', 'son']; const ETIKET = { g1: '1. gün', g3: '3. gün', g6: '6. gün', son: 'Süre bitiyor' };
const AZAMI_DENEME = 3; const ARA = 20 * H; // aynı kişiye iki e-posta arasında en az 20 saat (hatırlatma hariç)

// Türkiye saatiyle 08.00–21.00 dışında gönderim yapılmaz. Hatırlatma penceresi (12 saat) kapalı aralıktan (11 saat) uzun olduğundan kaçırılmaz.
const uygunSaat = (now) => { const h = (new Date(now).getUTCHours() + 3) % 24; return h >= 8 && h < 21; };
// Bu lisans için şu anda sırası gelen e-posta. rows: trial_mail kayıtları ({step, status, attempts, at}). lastAt: alıcıya son başarılı gönderim.
function sonraki({ start, end, now, rows = [], trialOff = false, lastAt = null }) {
  if (trialOff) return null;
  const t = new Date(now).getTime(); const s = new Date(start).getTime(); const e = new Date(end).getTime();
  if (t >= e) return null;
  const gecen = t - s; const kalan = e - t;
  const sira = kalan <= 12 * H ? 'son' : gecen >= 6 * G ? 'g6' : gecen >= 3 * G ? 'g3' : gecen >= G ? 'g1' : null; // kaçırılan eski adımlar sonradan gönderilmez
  if (!sira) return null;
  const by = Object.fromEntries(rows.map((r) => [r.step, r]));
  if (ADIMLAR.slice(ADIMLAR.indexOf(sira)).some((k) => by[k] && (by[k].status === 'gönderildi' || by[k].status === 'gönderiliyor' || by[k].attempts >= AZAMI_DENEME))) return null;
  if (sira !== 'son' && lastAt && t - new Date(lastAt).getTime() < ARA) return null;
  return sira;
}

const fDate = (d) => new Date(d).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
const kalanGun = (end, now) => Math.max(1, Math.ceil((new Date(end) - new Date(now)) / G));
// E-posta içeriği. promo false ise (izin/İYS yoksa) tanıtım satırı hiç eklenmez.
function sablon(step, { pname, ad, biz, end, now, ilerleme: p, siteUrl = '', pid, promo = false, unvan = '', mersis = '' }) {
  const u = String(siteUrl).replace(/\/$/, ''); const merhaba = `Merhaba${ad ? ' ' + ad : ''}`;
  const kalanlar = p.steps.filter((x) => !x.ok).slice(0, 3).map((x) => `${x.t}: ${x.d}`);
  const durum = [['Program', pname], ['Kurulum', `${p.done}/${p.total} adım`], ['Deneme bitişi', fDate(end)]];
  const ac = { type: 'button', label: 'Programı aç', url: `${u}/#/programlarim` }; const yardim = { type: 'p', text: `Kullanım rehberi ve sık sorulanlar: ${u}/#/yardim/${pid}` };
  const liste = kalanlar.length ? [{ type: 'list', items: kalanlar }] : [];
  const ornek = p.sample ? [{ type: 'note', text: 'Programda gördüğünüz örnek kayıtlar kurulum adımlarına sayılmaz; yalnızca sizin eklediğiniz kayıtlar sayılır.' }] : [];
  const T = {
    g1: { subject: `${pname}: ilk adımlar`, title: 'İlk adımlarınız', intro: `${merhaba}, ${biz || 'işletmeniz'} için ${pname} denemeniz sürüyor. Başlamak için şu adımları izleyebilirsiniz.`, blocks: [{ type: 'kv', rows: durum }, ...liste, ...ornek, ac, yardim] },
    g3: { subject: `${pname}: kurulum durumunuz ${p.done}/${p.total}`, title: `Kurulum: ${p.done}/${p.total} adım`, intro: `${merhaba}, ${pname} denemenizin durumu aşağıda.`, blocks: [{ type: 'kv', rows: durum }, ...(kalanlar.length ? [{ type: 'p', text: 'Sıradaki adımlar:' }, ...liste] : [{ type: 'note', text: 'Tüm kurulum adımlarını tamamladınız.' }]), ...ornek, ac, yardim] },
    g6: { subject: `${pname} denemeniz için kontrol listesi`, title: 'Deneme süreniz bitmeden', intro: `${merhaba}, ${pname} denemeniz ${fDate(end)} tarihinde sona eriyor. Takıldığınız bir konu varsa yanıtlayarak bize yazabilirsiniz.`, blocks: [{ type: 'kv', rows: durum }, ...liste, { type: 'p', text: 'Süre dolduğunda program kilitlenir, verileriniz silinmez.' }, ac, yardim] },
    son: { subject: `${pname} denemeniz ${fDate(end)} tarihinde bitiyor`, title: `${kalanGun(end, now)} gün içinde bitiyor`, intro: `${merhaba}, ${biz || 'işletmeniz'} için ${pname} deneme süreniz ${fDate(end)} tarihinde sona eriyor.`, blocks: [{ type: 'kv', rows: durum }, { type: 'p', text: 'Süre dolduğunda program kilitlenir, verileriniz silinmez. Devam etmek isterseniz paket seçimini Hesabım sayfasından yapabilirsiniz.' }, { type: 'button', label: 'Hesabımı aç', url: `${u}/#/hesabim` }] },
  }[step];
  if (promo) { T.blocks.push({ type: 'note', tone: 'warn', text: 'Tanıtım: yıllık ödemede 2 ay ücretsizdir.' }); T.footer = `${unvan} · MERSİS ${mersis}`; }
  return { ...T, preheader: T.intro };
}

// Çıkış bağlantısı: imzalı, oturum gerektirmez
const imza = (uid) => cfg.mac(`cik:${uid}`).slice(0, 32);
const cikisUrl = (uid, siteUrl) => (siteUrl ? `${String(siteUrl).replace(/\/$/, '')}/api/abonelik/cik?u=${encodeURIComponent(uid)}&k=${imza(uid)}` : '');
const pazarlamaHazir = (pz) => !!(pz && pz.iys && pz.unvan && pz.mersis);

// wa.me bağlantısı: yalnızca Türkiye cep telefonu; otomatik gönderim yok, yönetici tıklayıp WhatsApp'ta kendisi gönderir
function waNo(phone) { let d = String(phone || '').replace(/\D/g, ''); if (d.startsWith('0090')) d = d.slice(2); if (d.startsWith('0')) d = '9' + d; else if (d.length === 10) d = '90' + d; return /^905\d{9}$/.test(d) ? d : null; }
const waTaslak = ({ ad, pname, end, ilerleme: p }) => `Merhaba${ad ? ' ' + ad : ''}, NEBSOFT'tan yazıyorum. ${pname} denemeniz ${fDate(end)} tarihinde bitiyor; kurulumda ${p.done}/${p.total} adımdasınız. Takıldığınız bir yer varsa yardımcı olabilirim.`;
const waLink = (phone, text) => { const n = waNo(phone); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null; };

async function appVeri(tid, app) { return require('./belge').oku(tid, app, await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [tid, app])); }
const SORGU = "SELECT l.id, l.tenant_id, l.product, l.start, l.end, t.name AS biz, t.phone AS tphone, u.id AS uid, u.email, u.name AS uname, u.phone AS uphone, p.trial_off, p.marketing FROM licenses l JOIN tenants t ON t.id=l.tenant_id JOIN users u ON u.id=(SELECT x.id FROM users x WHERE x.tenant_id=t.id AND x.role='customer' AND x.status='active' ORDER BY x.created LIMIT 1) LEFT JOIN mail_prefs p ON p.user_id=u.id WHERE l.status='deneme' AND l.end>UTC_TIMESTAMP() AND t.status='active' ORDER BY l.end LIMIT 300";
async function kayitlar(ids) { if (!ids.length) return {}; const rows = await db.q(`SELECT license_id, step, status, attempts, at FROM trial_mail WHERE license_id IN (${ids.map(() => '?').join(',')})`, ids); return rows.reduce((m, r) => ((m[r.license_id] = m[r.license_id] || []).push(r), m), {}); }

// Sıradaki e-postaları gönderir. Sonuç gerçek gönderim sonucudur; e-posta veya site adresi ayarlı değilse hiçbir şey kaydedilmez.
async function tick(now = new Date()) {
  if (!db.ready() || !(await mail.ready())) return { ok: false, reason: 'E-posta ayarı yapılmadı', sent: 0, failed: 0 };
  const s = await site(); if (!s.siteUrl) return { ok: false, reason: 'Site adresi girilmedi (çıkış bağlantısı üretilemez)', sent: 0, failed: 0 };
  if (!uygunSaat(now)) return { ok: true, reason: 'sessiz saat', sent: 0, failed: 0 };
  const rows = await db.q(SORGU); const hepsi = await kayitlar(rows.map((r) => r.id)); const pz = await setting('pazarlama', {}); const siteBilgi = await mailSite();
  const son = {}; (await db.q("SELECT to_addr, MAX(at) AS at FROM trial_mail WHERE status='gönderildi' GROUP BY to_addr")).forEach((x) => { son[x.to_addr] = x.at; });
  let sent = 0, failed = 0; const bu = new Set();
  for (const r of rows) {
    if (bu.has(r.email)) continue; // aynı kişiye bir turda tek e-posta
    const step = sonraki({ start: r.start, end: r.end, now, rows: hepsi[r.id] || [], trialOff: !!r.trial_off, lastAt: son[r.email] }); if (!step) continue;
    bu.add(r.email);
    await db.q("INSERT INTO trial_mail (license_id, step, to_addr, status, attempts, at) VALUES (?,?,?,'gönderiliyor',1,?) ON DUPLICATE KEY UPDATE status='gönderiliyor', attempts=attempts+1, at=VALUES(at)", [r.id, step, r.email, now]);
    const p = Adim.ilerleme(r.product, await appVeri(r.tenant_id, r.product));
    const tpl = sablon(step, { pname: pnameOf(r.product), ad: String(r.uname || '').split(' ')[0], biz: r.biz, end: r.end, now, ilerleme: p, siteUrl: s.siteUrl, pid: r.product, promo: !!r.marketing && pazarlamaHazir(pz), unvan: pz.unvan, mersis: pz.mersis });
    const x = await mail.send(r.email, tpl.subject, { ...tpl, unsub: cikisUrl(r.uid, s.siteUrl) }, siteBilgi);
    await db.q('UPDATE trial_mail SET status=?, detail=? WHERE license_id=? AND step=?', [x.ok ? 'gönderildi' : 'hata', String(x.ok ? x.id || '' : x.error || 'Gönderilemedi').slice(0, 250), r.id, step]);
    if (x.ok) sent++; else failed++;
  }
  return { ok: true, sent, failed };
}
setInterval(() => tick().catch(() => {}), 30 * 60e3).unref();
setTimeout(() => tick().catch(() => {}), 90e3).unref();

// ---------- Çıkış sayfası ----------
const cikisHtml = (u, k) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>E-posta tercihi</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:480px;margin:12vh auto;padding:0 16px;color:#171a26;background:#f5f6fa}button{font:inherit;font-weight:600;padding:12px 18px;border:0;border-radius:10px;background:#4f46e5;color:#fff;cursor:pointer}@media(prefers-color-scheme:dark){body{background:#0f1120;color:#eceef5}}</style></head><body><h1>E-posta tercihi</h1><p id="m">Deneme bilgilendirme ve tanıtım e-postalarını almayı durdurmak için onaylayın. Doğrulama kodu, sipariş ve fatura gibi işlem e-postaları sürer.</p><button id="b">E-postaları durdur</button><script>document.getElementById('b').onclick=function(){var b=this,m=document.getElementById('m');b.disabled=true;fetch('/api/abonelik/cik',{method:'POST',headers:{'Content-Type':'application/json','x-ns-csrf':'1'},body:JSON.stringify({u:${JSON.stringify(u)},k:${JSON.stringify(k)}})}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw 0;m.textContent='Tercihiniz kaydedildi. Bu e-postaları artık almayacaksınız.';b.remove()}).catch(function(){m.textContent='Kaydedilemedi. Lütfen destek ekibine yazın.';b.disabled=false})}</script></body></html>`;
const dogru = (u, k) => { const a = Buffer.from(imza(String(u))); const b = Buffer.from(String(k || '')); return a.length === b.length && require('crypto').timingSafeEqual(a, b); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
route('GET', '/api/abonelik/cik', { auth: 'none', limit: ['cik', 60, 600e3] }, async (c) => { const u = c.query.get('u') || ''; const k = c.query.get('k') || ''; if (!dogru(u, k)) throw err(404, 'Bağlantı geçersiz'); return { __raw: true, type: 'text/html; charset=utf-8', body: cikisHtml(esc(u).replace(/&#\d+;/g, ''), esc(k).replace(/&#\d+;/g, '')) }; });
route('POST', '/api/abonelik/cik', { auth: 'none', limit: ['cikp', 30, 600e3] }, async (c) => {
  const { u, k } = c.body || {}; if (!dogru(u, k)) throw err(404, 'Bağlantı geçersiz');
  await db.q('INSERT INTO mail_prefs (user_id, trial_off, marketing, updated) VALUES (?,1,0,?) ON DUPLICATE KEY UPDATE trial_off=1, marketing=0, updated=VALUES(updated)', [String(u), new Date()]);
  await audit({ ...c, user: { id: String(u) } }, 'E-posta çıkışı', 'Deneme ve tanıtım e-postaları durduruldu'); return { ok: true };
});

// Hesabım → Profil: tanıtım izni ve deneme e-postaları
route('GET', '/api/mail-tercih', { auth: 'user' }, async (c) => { const p = await db.one('SELECT trial_off, marketing, marketing_at FROM mail_prefs WHERE user_id=?', [c.user.id]); return { ok: true, deneme: !(p && p.trial_off), pazarlama: !!(p && p.marketing), izinTarihi: p ? p.marketing_at : null }; });
route('PUT', '/api/mail-tercih', { auth: 'user', limit: ['tercih', 20, 600e3] }, async (c) => {
  const b = c.body || {}; const on = b.pazarlama === true; const n = new Date();
  await db.q('INSERT INTO mail_prefs (user_id, trial_off, marketing, marketing_at, marketing_src, marketing_ip, updated) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE trial_off=VALUES(trial_off), marketing=VALUES(marketing), marketing_at=VALUES(marketing_at), marketing_src=VALUES(marketing_src), marketing_ip=VALUES(marketing_ip), updated=VALUES(updated)', [c.user.id, b.deneme === false ? 1 : 0, on ? 1 : 0, on ? n : null, on ? 'hesabim' : null, on ? c.ip : null, n]);
  await audit(c, 'E-posta tercihi', `tanıtım: ${on ? 'açık' : 'kapalı'}`); return { ok: true };
});

// ---------- Yönetim: deneme takibi ----------
route('GET', '/api/admin/deneme-takip', { auth: 'admin' }, async () => {
  const rows = await db.q(SORGU); const hepsi = await kayitlar(rows.map((r) => r.id)); const out = []; const now = new Date();
  for (const r of rows) {
    const p = Adim.ilerleme(r.product, await appVeri(r.tenant_id, r.product)); const ad = String(r.uname || '').split(' ')[0]; const pname = pnameOf(r.product); const text = waTaslak({ ad, pname, end: r.end, ilerleme: p });
    out.push({ id: r.id, biz: r.biz, uname: r.uname, email: r.email, phone: r.uphone || r.tphone || '', product: r.product, start: r.start, end: r.end, kalan: Math.ceil((new Date(r.end) - now) / G), done: p.done, total: p.total, sample: p.sample, cikti: !!r.trial_off, izin: !!r.marketing, mails: (hepsi[r.id] || []).map((m) => ({ step: ETIKET[m.step] || m.step, status: m.status, at: m.at })), wa: waLink(r.uphone || r.tphone, text), text });
  }
  const s = await site(); return { ok: true, rows: out, mailReady: await mail.ready(), siteUrl: !!s.siteUrl, pazarlama: await setting('pazarlama', {}) };
});
route('PUT', '/api/admin/pazarlama', { auth: 'admin' }, async (c) => {
  const b = c.body || {}; const v = { iys: b.iys === true, unvan: sec.clean(b.unvan, 200), mersis: String(b.mersis || '').replace(/\D/g, '').slice(0, 16) };
  if (v.iys && (!v.unvan || v.mersis.length !== 16)) throw err(400, 'Ticaret unvanı ve 16 haneli MERSİS numarası gerekli');
  await setSetting('pazarlama', v); await audit(c, 'Ticari ileti ayarı', `İYS beyanı: ${v.iys ? 'var' : 'yok'}`); return { ok: true };
});

module.exports = { sonraki, sablon, uygunSaat, tick, waNo, waLink, waTaslak, cikisUrl, imza, dogru, pazarlamaHazir, ADIMLAR };
