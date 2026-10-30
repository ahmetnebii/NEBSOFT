// NEBSOFT birinci taraf analitik: üçüncü taraf yok, çerez yok, ham olay yok. Olaylar bellekte toplanıp saatlik toplu tablolara yazılır.
//  • Tekil ziyaretçi: günlük değişen tuzla (IP + tarayıcı) özeti. Tuz gün dönünce atılır, özetler ertesi gün silinir; IP hiçbir yerde saklanmaz.
//  • Rıza yoksa (ve GPC / DNT açıksa) hiçbir şey sayılmaz. Kayıt, deneme, ödeme adımları olay değil, işletmenin kendi tablolarından okunur.
//  • Hata ve yavaşlık: istek sayaçları saatlik saklanır, alarm son dakikaların bellekteki penceresinden hesaplanır (DEPLOY: tek süreç).
const crypto = require('crypto');
const db = require('./db');
const log = require('./log');

const TR_FARK = 3 * 3600e3; // Türkiye UTC+3 (routes.js takvim hesabıyla aynı)
const yerel = (t = Date.now()) => { const d = new Date(t + TR_FARK); return { gun: d.toISOString().slice(0, 10), saat: d.getUTCHours() }; };
const gunBasi = (gun) => new Date(`${gun}T00:00:00+03:00`);
const geriGun = (n, t = Date.now()) => yerel(t - n * 864e5).gun;

// ---------- Ayar ----------
// Saklama süreleri avukatla netleştirilecek (docs/LOG-YAPISI.md); yönetim panelinden değiştirilir.
const VARSAYILAN = { acik: true, analitikGun: 365, uygulamaGun: 90, denetimGun: 3650, hataOrani: 5, yavasMs: 2000, yavasOrani: 20, minIstek: 30, pencereDk: 5, alarmEposta: false };
const SINIR = { analitikGun: [7, 1095], uygulamaGun: [7, 365], denetimGun: [30, 3650], hataOrani: [1, 100], yavasMs: [200, 60000], yavasOrani: [1, 100], minIstek: [5, 100000], pencereDk: [1, 15] };
const J = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
function ayarTemizle(b = {}) {
  const o = { ...VARSAYILAN };
  for (const [k, [a, z]] of Object.entries(SINIR)) { const n = Math.round(Number(b[k])); if (b[k] !== undefined && b[k] !== '' && Number.isFinite(n)) o[k] = Math.min(z, Math.max(a, n)); }
  if (b.acik !== undefined) o.acik = b.acik === true || b.acik === 'true' || b.acik === 'on' || b.acik === 1;
  if (b.alarmEposta !== undefined) o.alarmEposta = b.alarmEposta === true || b.alarmEposta === 'true' || b.alarmEposta === 'on' || b.alarmEposta === 1;
  return o;
}
let ayarOnbellek = { at: 0, v: { ...VARSAYILAN } };
async function ayar(tazele) {
  if (!tazele && Date.now() - ayarOnbellek.at < 30e3) return ayarOnbellek.v;
  if (db.ready()) { const r = await db.one("SELECT v FROM settings WHERE k='analitik'").catch(() => null); ayarOnbellek = { at: Date.now(), v: ayarTemizle(r ? J(r.v, {}) : {}) }; }
  return ayarOnbellek.v;
}
async function ayarKaydet(b) { const v = ayarTemizle(b); await db.q("INSERT INTO settings (k, v) VALUES ('analitik', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify(v)]); ayarOnbellek = { at: Date.now(), v }; return v; }
const acik = async () => db.ready() && (await ayar()).acik;

// ---------- Girdi temizleme ----------
const BOT = /bot|crawl|spider|slurp|scrape|headless|lighthouse|preview|facebookexternalhit|curl|wget|python-|go-http|java\//i;
const KIMLIK = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const kimlik = (v) => (typeof v === 'string' && KIMLIK.test(v) ? v : null);
// Yalnızca alan adı alınır: yol, sorgu ve parça saklanmaz. Sitenin kendisi kaynak sayılmaz.
function kaynakAlan(ref, host) {
  if (typeof ref !== 'string' || !ref || ref.length > 500) return null;
  let u; try { u = new URL(ref); } catch (e) { return null; }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  if (!/^[a-z0-9.-]{3,80}$/.test(h) || !h.includes('.') || h === String(host || '').split(':')[0].toLowerCase().replace(/^www\./, '')) return null;
  return h;
}
const UTM = (v) => { if (typeof v !== 'string') return ''; return v.trim().replace(/İ/g, 'i').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 40); };
function utmTemizle(u) { if (!u || typeof u !== 'object' || Array.isArray(u)) return null; const s = UTM(u.source); if (!s) return null; return { source: s, medium: UTM(u.medium), campaign: UTM(u.campaign) }; }
// İstemciden gelen gövdeyi beyaz listeye indirir; bilinmeyen tür veya biçim null döner
function olayDogrula(b, programVar) {
  if (!b || typeof b !== 'object' || Array.isArray(b) || typeof b.tur !== 'string') return null;
  const p = b.program === undefined || b.program === null || b.program === '' ? null : kimlik(b.program);
  if (b.program && !p) return null;
  if (p && !programVar(p)) return null;
  if (b.tur === 'ziyaret') return { tur: 'ziyaret', program: p, ref: typeof b.ref === 'string' ? b.ref : '', utm: utmTemizle(b.utm) };
  if (b.tur === 'sayfa') return { tur: 'sayfa', program: p };
  if (b.tur === 'demo') return p ? { tur: 'demo', program: p } : null;
  if (b.tur === 'gecis') { const a = kimlik(b.arac); return a && p ? { tur: 'gecis', arac: a, program: p } : null; }
  if (b.tur === 'modul') { const m = kimlik(b.modul); return m && p ? { tur: 'modul', program: p, modul: m } : null; }
  return null;
}

// ---------- Toplama tamponu ----------
const AZAMI_TAMPON = 20000; const AZAMI_ANAHTAR = 300; // serbest metinli türlerde günlük farklı değer sınırı (tablo şişirme saldırısına karşı)
const tampon = new Map(); let kaybolan = 0;
const sayac = (gun, saat, tur, anahtar, ek, n = 1) => { const k = JSON.stringify([gun, saat, tur, anahtar, ek]); if (!tampon.has(k) && tampon.size >= AZAMI_TAMPON) { kaybolan++; return; } tampon.set(k, (tampon.get(k) || 0) + n); };
let cesit = { gun: '', m: new Map() };
function sinirli(gun, tur, deger) { if (cesit.gun !== gun) cesit = { gun, m: new Map() }; let s = cesit.m.get(tur); if (!s) cesit.m.set(tur, s = new Set()); if (s.has(deger)) return deger; if (s.size >= AZAMI_ANAHTAR) return '(diğer)'; s.add(deger); return deger; }

// Sistem sayaçları: saatlik toplam + alarm için dakika penceresi
const sistem = new Map(); const dakikalar = new Map();
function istek(yol, durum, ms) {
  const y = yerel(); const k = `${y.gun}|${y.saat}|${yol}`; let s = sistem.get(k);
  if (!s) { if (sistem.size >= AZAMI_TAMPON) return; sistem.set(k, s = { gun: y.gun, saat: y.saat, yol: String(yol).slice(0, 120), n: 0, h5: 0, h4: 0, yavas: 0, top: 0, max: 0 }); }
  const yv = ms >= ayarOnbellek.v.yavasMs; s.n++; if (durum >= 500) s.h5++; else if (durum >= 400) s.h4++; if (yv) s.yavas++; s.top += ms; s.max = Math.max(s.max, ms);
  const d = Math.floor(Date.now() / 60e3); let m = dakikalar.get(d); if (!m) { dakikalar.set(d, m = { n: 0, h5: 0, yavas: 0 }); for (const x of dakikalar.keys()) if (x < d - 20) dakikalar.delete(x); }
  m.n++; if (durum >= 500) m.h5++; if (yv) m.yavas++;
}
function pencere(dk, simdi = Date.now()) { const d = Math.floor(simdi / 60e3); const t = { n: 0, h5: 0, yavas: 0 }; for (let i = 0; i < dk; i++) { const m = dakikalar.get(d - i); if (m) { t.n += m.n; t.h5 += m.h5; t.yavas += m.yavas; } } return t; }
// Saf hesap: az istekle tek hata alarm üretmesin diye en az istek eşiği aranır
function alarmHesapla(p, a) {
  if (p.n < a.minIstek) return [];
  const out = []; const hr = (p.h5 / p.n) * 100; const yr = (p.yavas / p.n) * 100;
  if (hr >= a.hataOrani) out.push({ tur: 'hata', deger: Math.round(hr * 10) / 10, esik: a.hataOrani, istek: p.n, sayi: p.h5 });
  if (yr >= a.yavasOrani) out.push({ tur: 'yavas', deger: Math.round(yr * 10) / 10, esik: a.yavasOrani, istek: p.n, sayi: p.yavas, ms: a.yavasMs });
  return out;
}
const ALARM_AD = { hata: 'Sunucu hata oranı yüksek', yavas: 'Yanıtlar yavaşladı' };
const alarmMetni = (x, dk) => (x.tur === 'hata' ? `Son ${dk} dakikada ${x.istek} isteğin %${x.deger} kadarı sunucu hatası verdi (eşik %${x.esik})` : `Son ${dk} dakikada ${x.istek} isteğin %${x.deger} kadarı ${x.ms} ms üstünde yanıtlandı (eşik %${x.esik})`);
const aktifAlarm = new Map(); const hook = { alarm: null };
async function alarmKontrol() {
  const a = await ayar(); const list = alarmHesapla(pencere(a.pencereDk), a); const su = new Set(list.map((x) => x.tur));
  for (const x of list) {
    if (aktifAlarm.has(x.tur)) { aktifAlarm.set(x.tur, { ...aktifAlarm.get(x.tur), ...x }); continue; }
    const k = { ...x, ad: ALARM_AD[x.tur], mesaj: alarmMetni(x, a.pencereDk), basladi: new Date().toISOString() }; aktifAlarm.set(x.tur, k);
    log.uygulama.uyari(`alarm.${x.tur}`, { mesaj: k.mesaj, veri: { deger: x.deger, esik: x.esik, istek: x.istek } });
    if (hook.alarm && a.alarmEposta) Promise.resolve(hook.alarm(k)).catch(() => {});
  }
  for (const t of [...aktifAlarm.keys()]) if (!su.has(t)) { aktifAlarm.delete(t); log.uygulama.bilgi(`alarm.${t}.kapandi`, { mesaj: `${ALARM_AD[t]} durumu sona erdi` }); }
  return [...aktifAlarm.values()];
}

// ---------- Tekil sayım ----------
let tuz = { gun: '', v: null }; let gorulen = { gun: '', s: new Set() };
async function tuzAl(gun) {
  if (tuz.gun === gun) return tuz.v;
  const r = await db.one("SELECT v FROM settings WHERE k='an_tuz'").catch(() => null); const x = r ? J(r.v, null) : null;
  if (x && x.gun === gun && x.tuz) { tuz = { gun, v: x.tuz }; return tuz.v; }
  tuz = { gun, v: crypto.randomBytes(24).toString('hex') }; // eski tuzun üzerine yazılır: dünün özetleri artık kimseyle eşleştirilemez
  await db.q("INSERT INTO settings (k, v) VALUES ('an_tuz', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify({ gun, tuz: tuz.v })]).catch(() => {});
  await db.q('DELETE FROM an_tekil WHERE gun < ?', [gun]).catch(() => {});
  return tuz.v;
}
async function ilkKez(gun, parca) {
  const t = await tuzAl(gun); const oz = crypto.createHmac('sha256', t).update(parca).digest('hex').slice(0, 32);
  if (gorulen.gun !== gun) gorulen = { gun, s: new Set() };
  if (gorulen.s.has(oz)) return false; if (gorulen.s.size < 500000) gorulen.s.add(oz);
  const r = await db.q('INSERT IGNORE INTO an_tekil (gun, ozet) VALUES (?, ?)', [gun, oz]); return r.affectedRows === 1;
}

// ---------- Olay kaydı ----------
// baglam: { ip, ua, host, gpc, isletme (yalnızca sunucu doğruladıysa) }. Dönüş: { kayit: true|false, neden }
async function kaydet(govde, baglam, programVar) {
  const e = olayDogrula(govde, programVar); if (!e) return { kayit: false, neden: 'gecersiz' };
  if (!db.ready() || !(await ayar()).acik) return { kayit: false, neden: 'kapali' };
  if (e.tur === 'modul') { if (!baglam.isletme) return { kayit: false, neden: 'yetki' }; }
  else { // anonim ziyaretçi: rıza şart, tarayıcının gizlilik sinyali rızadan önce gelir
    if (govde.riza !== true || baglam.gpc) return { kayit: false, neden: 'riza' };
    if (!baglam.ua || BOT.test(baglam.ua)) return { kayit: false, neden: 'bot' };
  }
  await log.analitik(e.tur, { ...e, _yerel: yerel(), _tekil: e.tur === 'modul' ? `m|${baglam.isletme}|${e.program}|${e.modul}` : `${baglam.ip}|${baglam.ua}`, _host: baglam.host });
  return { kayit: true };
}
// Analitik kanalının yazıcısı: kayıt tek tek saklanmaz, toplu sayaçlara işlenir
async function topla(k) {
  const v = k.veri; const { gun, saat } = v._yerel;
  if (v.tur === 'modul') {
    sayac(gun, saat, 'modul', v.program, v.modul);
    if (await ilkKez(gun, v._tekil)) sayac(gun, saat, 'modul_isletme', v.program, v.modul);
    return;
  }
  const ana = v._tekil;
  if (v.tur === 'ziyaret') {
    if (await ilkKez(gun, ana)) {
      sayac(gun, saat, 'ziyaret', '', '');
      const h = kaynakAlan(v.ref, v._host); sayac(gun, saat, 'kaynak', h ? sinirli(gun, 'kaynak', h) : '(doğrudan)', '');
      if (v.utm) sayac(gun, saat, 'utm', sinirli(gun, 'utm', v.utm.source), sinirli(gun, 'utmek', `${v.utm.medium}|${v.utm.campaign}`));
    }
  }
  if (v.tur === 'ziyaret' || v.tur === 'sayfa') { sayac(gun, saat, 'sayfa', '', ''); if (v.program) sayac(gun, saat, 'program', v.program, ''); }
  if (v.tur === 'demo') { // program tablosu program başına, huni kişi başına sayar (iki demo açan tek adımdır)
    if (await ilkKez(gun, `${ana}|demo|${v.program}`)) sayac(gun, saat, 'demo', v.program, '');
    if (await ilkKez(gun, `${ana}|demo`)) sayac(gun, saat, 'demo_tekil', '', '');
  }
  if (v.tur === 'gecis') sayac(gun, saat, 'gecis', sinirli(gun, 'gecis', v.arac), v.program);
}
log.kanal('analitik', topla);

// ---------- Günlük yazıcıları ----------
log.kanal('denetim', (k) => db.q('INSERT INTO audit (at, user_id, tenant_id, ip, action, detail) VALUES (?,?,?,?,?,?)', [new Date(k.zaman), k.kullanici || null, k.isletme || null, k.ip || null, k.olay.slice(0, 60), String(k.mesaj || '').slice(0, 500)]));
let dkYazilan = { d: 0, n: 0 };
log.kanal('uygulama', (k) => {
  if (log.SEVIYE[k.seviye] < log.SEVIYE.uyari || !db.ready()) return undefined;
  const d = Math.floor(Date.now() / 60e3); if (dkYazilan.d !== d) dkYazilan = { d, n: 0 }; if (++dkYazilan.n > 60) return undefined; // hata fırtınası veritabanını boğmasın (standart çıktıya yine yazılır)
  const { zaman, kanal, seviye, olay, mesaj, istek: ist, ...kalan } = k;
  return db.q('INSERT INTO log_kayit (at, kanal, seviye, olay, mesaj, istek, veri) VALUES (?,?,?,?,?,?,?)', [new Date(zaman), kanal, seviye, olay.slice(0, 80), String(mesaj || (k.hata && k.hata.ileti) || '').slice(0, 500), ist || null, JSON.stringify(kalan).slice(0, 8000)]);
});

// ---------- Veritabanına yazma ----------
async function bosalt() {
  if (!db.ready()) return;
  const r1 = [...tampon.entries()]; tampon.clear();
  for (let i = 0; i < r1.length; i += 200) {
    const p = r1.slice(i, i + 200);
    try { await db.q(`INSERT INTO an_toplam (gun, saat, tur, anahtar, ek, n) VALUES ${p.map(() => '(?,?,?,?,?,?)').join(',')} ON DUPLICATE KEY UPDATE n=n+VALUES(n)`, p.flatMap(([k, n]) => [...JSON.parse(k), n])); }
    catch (e) { p.forEach(([k, n]) => tampon.set(k, (tampon.get(k) || 0) + n)); log.uygulama.uyari('analitik.yazilamadi', { hata: e }); break; }
  }
  const r2 = [...sistem.values()]; sistem.clear();
  for (let i = 0; i < r2.length; i += 100) {
    const p = r2.slice(i, i + 100);
    try { await db.q(`INSERT INTO an_sistem (gun, saat, yol, n, h5, h4, yavas, ms_top, ms_max) VALUES ${p.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')} ON DUPLICATE KEY UPDATE n=n+VALUES(n), h5=h5+VALUES(h5), h4=h4+VALUES(h4), yavas=yavas+VALUES(yavas), ms_top=ms_top+VALUES(ms_top), ms_max=GREATEST(ms_max, VALUES(ms_max))`, p.flatMap((s) => [s.gun, s.saat, s.yol, s.n, s.h5, s.h4, s.yavas, Math.round(s.top), Math.round(s.max)])); }
    catch (e) { log.uygulama.uyari('analitik.yazilamadi', { hata: e }); break; }
  }
  if (kaybolan) { log.uygulama.uyari('analitik.tampon-doldu', { veri: { kaybolan } }); kaybolan = 0; }
}
async function parcaSil(sql, p) { let top = 0; for (let i = 0; i < 200; i++) { const r = await db.q(`${sql} LIMIT 5000`, p); top += r.affectedRows; if (r.affectedRows < 5000) break; } return top; }
// Saklama süresi dolanları siler. audit dahil: süre panelden ayarlanır. Denetim varsayılanı avukat görüşü gelene dek en yüksek sınırda tutulur.
async function temizle() {
  if (!db.ready()) return null; const a = await ayar(true); const bug = yerel().gun;
  const out = {
    toplam: await parcaSil('DELETE FROM an_toplam WHERE gun < ?', [geriGun(a.analitikGun)]), sistem: await parcaSil('DELETE FROM an_sistem WHERE gun < ?', [geriGun(a.analitikGun)]),
    tekil: await parcaSil('DELETE FROM an_tekil WHERE gun < ?', [bug]), uygulama: await parcaSil('DELETE FROM log_kayit WHERE at < ?', [new Date(Date.now() - a.uygulamaGun * 864e5)]), denetim: await parcaSil('DELETE FROM audit WHERE at < ?', [new Date(Date.now() - a.denetimGun * 864e5)]),
  };
  if (Object.values(out).some(Boolean)) log.uygulama.bilgi('saklama.temizlik', { veri: out });
  return out;
}

// ---------- Rapor ----------
async function huni(g) {
  const b = geriGun(g - 1); const t0 = gunBasi(b);
  const [[z], [d], [k], [de], [o]] = await Promise.all([
    db.q("SELECT COALESCE(SUM(n),0) AS n FROM an_toplam WHERE gun>=? AND tur='ziyaret'", [b]), db.q("SELECT COALESCE(SUM(n),0) AS n FROM an_toplam WHERE gun>=? AND tur='demo_tekil'", [b]),
    db.q('SELECT COUNT(*) AS n FROM tenants WHERE created>=?', [t0]),
    // Ödemeye dönen deneme de deneme sayılır; doğrudan satın alınan lisans (sipariş onayında açılır) sayılmaz. Bugüne kadar açılmış satırlardan okunur, geçmiş de görünür.
    db.q("SELECT COUNT(*) AS n FROM licenses l LEFT JOIN orders o ON o.id=l.order_id WHERE l.start>=? AND (l.status='deneme' OR (l.order_id IS NOT NULL AND l.start<o.created))", [t0]),
    db.q("SELECT COUNT(DISTINCT tenant_id) AS n FROM orders WHERE status='odendi' AND paid_at>=?", [t0]),
  ]);
  return [{ id: 'ziyaret', ad: 'Ziyaret', n: Number(z.n), kaynak: 'rıza veren tekil ziyaretçi' }, { id: 'demo', ad: 'Demo', n: Number(d.n), kaynak: 'rıza veren, demo açan' }, { id: 'kayit', ad: 'Kayıt', n: Number(k.n), kaynak: 'işletme kayıtları' }, { id: 'deneme', ad: 'Deneme', n: Number(de.n), kaynak: 'lisans kayıtları' }, { id: 'odeme', ad: 'Ödeme', n: Number(o.n), kaynak: 'onaylı siparişler' }];
}
async function rapor(g) {
  await bosalt(); const b = geriGun(g - 1);
  const [ts, saat, gunluk, h, ay] = await Promise.all([
    db.q('SELECT tur, anahtar, ek, SUM(n) AS n FROM an_toplam WHERE gun>=? AND tur IN (\'sayfa\',\'ziyaret\',\'program\',\'kaynak\',\'utm\',\'demo\',\'modul\',\'modul_isletme\',\'gecis\') GROUP BY tur, anahtar, ek ORDER BY n DESC LIMIT 2000', [b]),
    db.q("SELECT saat, tur, SUM(n) AS n FROM an_toplam WHERE gun>=? AND tur IN ('ziyaret','sayfa') GROUP BY saat, tur", [b]),
    db.q("SELECT DATE_FORMAT(gun,'%Y-%m-%d') AS gun, tur, SUM(n) AS n FROM an_toplam WHERE gun>=? AND tur IN ('ziyaret','sayfa') GROUP BY gun, tur ORDER BY gun", [b]),
    huni(g), ayar(),
  ]);
  const sec = (t) => ts.filter((x) => x.tur === t).map((x) => ({ anahtar: x.anahtar, ek: x.ek, n: Number(x.n) }));
  const top = (t) => sec(t).reduce((s, x) => s + x.n, 0);
  const mi = new Map(sec('modul_isletme').map((x) => [`${x.anahtar}|${x.ek}`, x.n]));
  const demo = new Map(sec('demo').map((x) => [x.anahtar, x.n]));
  return {
    gun: g, ziyaret: top('ziyaret'), sayfa: top('sayfa'), huni: h, saatler: Array.from({ length: 24 }, (_, i) => ({ saat: i, ziyaret: Number((saat.find((x) => x.saat === i && x.tur === 'ziyaret') || {}).n || 0), sayfa: Number((saat.find((x) => x.saat === i && x.tur === 'sayfa') || {}).n || 0) })),
    gunler: [...new Set(gunluk.map((x) => x.gun))].map((d) => ({ gun: d, ziyaret: Number((gunluk.find((x) => x.gun === d && x.tur === 'ziyaret') || {}).n || 0), sayfa: Number((gunluk.find((x) => x.gun === d && x.tur === 'sayfa') || {}).n || 0) })),
    programlar: sec('program').map((x) => ({ program: x.anahtar, n: x.n, demo: demo.get(x.anahtar) || 0 })), kaynaklar: sec('kaynak').map((x) => ({ kaynak: x.anahtar, n: x.n })),
    utm: sec('utm').map((x) => { const [medium, campaign] = x.ek.split('|'); return { source: x.anahtar, medium, campaign, n: x.n }; }),
    moduller: sec('modul').map((x) => ({ program: x.anahtar, modul: x.ek, n: x.n, isletme: mi.get(`${x.anahtar}|${x.ek}`) || 0 })), gecisler: sec('gecis').map((x) => ({ arac: x.anahtar, program: x.ek, n: x.n })), ayar: ay,
  };
}
async function sistemRaporu(g) {
  await bosalt(); const a = await ayar(); const b = geriGun(g - 1);
  const yollar = (await db.q('SELECT yol, SUM(n) AS n, SUM(h5) AS h5, SUM(h4) AS h4, SUM(yavas) AS yavas, SUM(ms_top) AS ms_top, MAX(ms_max) AS ms_max FROM an_sistem WHERE gun>=? GROUP BY yol ORDER BY h5 DESC, yavas DESC, n DESC LIMIT 100', [b])).map((x) => ({ yol: x.yol, n: Number(x.n), h5: Number(x.h5), h4: Number(x.h4), yavas: Number(x.yavas), ort: x.n ? Math.round(Number(x.ms_top) / Number(x.n)) : 0, enCok: Number(x.ms_max) }));
  const gecmis = await db.q("SELECT at, olay, mesaj FROM log_kayit WHERE olay LIKE 'alarm.%' ORDER BY id DESC LIMIT 50");
  return { gun: g, ayar: a, aktif: [...aktifAlarm.values()], gecmis, yollar, pencere: pencere(a.pencereDk) };
}
const kayitlar = (seviye) => db.q(`SELECT id, at, kanal, seviye, olay, mesaj, istek FROM log_kayit ${seviye ? 'WHERE seviye=?' : ''} ORDER BY id DESC LIMIT 300`, seviye ? [seviye] : []);

const zaman = [setInterval(() => bosalt().catch(() => {}), 10e3), setInterval(() => alarmKontrol().catch(() => {}), 60e3), setInterval(() => temizle().catch((e) => log.uygulama.uyari('saklama.hata', { hata: e })), 6 * 3600e3), setTimeout(() => temizle().catch(() => {}), 120e3)];
zaman.forEach((t) => t.unref());

module.exports = { VARSAYILAN, SINIR, ayar, ayarKaydet, ayarTemizle, acik, olayDogrula, kaynakAlan, utmTemizle, kaydet, istek, pencere, alarmHesapla, alarmKontrol, bosalt, temizle, rapor, sistemRaporu, kayitlar, huni, yerel, hook, BOT };
