// Güven ve dönüşüm sayfalarının sunucu tarafı: bayi başvurusu, veri taşıma talebi, öneri kutusu, sistem durumu ve bakım kayıtları.
//  • Herkese açık yazma uçları: IP ve genel hız sınırı, CSRF başlığı, tuzak alan, en kısa doldurma süresi, bağlantı sınırı, KVKK onayı zorunlu. Tuzak alan dolarsa da hata döner: gönderilmeyen şey "alındı" görünmez.
//  • Komisyon oranı config/bayi.json dosyasındadır; boşsa dışarı hiç verilmez. Kurulum hizmeti fiyatı yalnız config/destek-paketleri.json içinde tanımlıysa verilir.
//  • Sistem durumu gerçek ölçümdür: sabit "her şey yolunda" yoktur, ölçülemeyen bileşen "bilinmiyor" döner.
//    Dışarı yalnız durum sözcüğü ve veritabanı yanıt süresi çıkar; sürüm, adres, veritabanı adı, hata metni ve istek sayısı çıkmaz.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const sec = require('./security');
const cat = require('./catalog');
const mail = require('./mail');
const log = require('./log');
const analitik = require('./analitik');
const destek = require('./destek');
const { R, route, A, err, site, audit, setting, mailTo, uid } = require('./routes');

const pub = (method, re, opt, fn) => R.push({ method, re, opt, fn }); // catalog eşitlemesine bağlı değil: veritabanı düşükken de yanıt verir

// ---------- Ayar dosyaları ----------
const BAYI_DOSYA = path.join(__dirname, '..', '..', 'config', 'bayi.json');
let bayiC = null; let bayiM = 0;
function bayiAyar() { try { const m = fs.statSync(BAYI_DOSYA).mtimeMs; if (!bayiC || m !== bayiM) { bayiC = JSON.parse(fs.readFileSync(BAYI_DOSYA, 'utf8')); bayiM = m; } return bayiC; } catch (e) { return {}; } }
// Boş veya geçersiz oran yok sayılır: sayfada oran satırı hiç görünmez
function komisyon(c = bayiAyar()) { const k = (c && c.komisyon) || {}; const y = k.yuzde; if (typeof y !== 'number' || !(y > 0 && y <= 100)) return null; return { yuzde: y, aciklama: sec.clean(k.aciklama, 200) }; }
function kurulum(c) { try { const k = (c || destek.load()).kurulumHizmeti; return k && typeof k.fiyat === 'number' && k.fiyat > 0 ? { ad: sec.clean(k.ad, 80) || 'Kurulum hizmeti', fiyat: k.fiyat } : null; } catch (e) { return null; } }

// ---------- Spam koruması ----------
const EN_KISA_MS = 3000; const BAGLANTI_UST = 2; const SAAT = 3600e3; const GENEL_UST = 60;
const baglanti = (s) => (String(s || '').match(/https?:\/\/|www\./gi) || []).length;
function spamDenetle(b, ad, metin) {
  if (!sec.limit(`${ad}:genel`, GENEL_UST, SAAT)) throw err(429, 'Şu an çok fazla başvuru alınıyor. Lütfen daha sonra tekrar deneyin.');
  if (b.web) throw err(400, 'Form gönderilemedi. Sayfayı yenileyip tekrar deneyin.');
  const acilis = Number(b.acilis); if (!Number.isFinite(acilis) || Date.now() - acilis < EN_KISA_MS) throw err(400, 'Form çok hızlı gönderildi. Birkaç saniye bekleyip tekrar deneyin.');
  if (baglanti(metin) > BAGLANTI_UST) throw err(400, 'Metinde en çok iki bağlantı olabilir');
}
const kvkkOnay = (b) => { if (b.kvkk !== true) throw err(400, 'KVKK aydınlatma metnini okuduğunuzu onaylayın'); };
const istegeBagliEposta = (v) => { const x = String(v || '').trim(); if (x && !sec.V.email(x)) throw err(400, 'Geçerli bir e-posta adresi yazın'); return x.toLowerCase() || null; };
async function yoneticiyeBildir(konu, title, intro, rows, yol) {
  try { const m = await mail.settings(); const s = await site(); if (!m.user) return; mailTo(m.replyTo || m.user, konu, { title, intro, blocks: [{ type: 'kv', rows }, { type: 'button', label: 'Panelde aç', url: `${s.siteUrl || ''}/admin/#/${yol}` }] }); } catch (e) { /* kayıt panelde görünür */ }
}

// ---------- Bayi ve mali müşavir başvurusu ----------
const BAYI_TUR = { bayi: 'Bayi', musavir: 'Mali müşavir' };
const BAYI_DURUM = ['yeni', 'gorusuluyor', 'onaylandi', 'reddedildi'];
route('POST', '/api/bayi-basvuru', { auth: 'none', limit: ['bayi', 5, SAAT], bodyMax: 20e3 }, async (c) => {
  const b = c.body; spamDenetle(b, 'bayi', b.not);
  if (!Object.prototype.hasOwnProperty.call(BAYI_TUR, b.tur)) throw err(400, 'Başvuru türünü seçin');
  if (!sec.V.str(b.unvan, 160, 2)) throw err(400, 'Firma veya büro adı gerekli');
  if (!sec.V.str(b.yetkili, 120, 2)) throw err(400, 'Yetkili adı gerekli');
  if (!sec.V.email(b.eposta)) throw err(400, 'Geçerli bir e-posta adresi yazın');
  if (!sec.V.phone(b.telefon)) throw err(400, 'Geçerli bir telefon numarası yazın');
  if (!sec.V.str(b.il, 60, 2)) throw err(400, 'İl gerekli');
  if (b.not !== undefined && b.not !== null && !sec.V.str(b.not, 2000)) throw err(400, 'Not en çok 2000 karakter olabilir');
  kvkkOnay(b);
  const an = new Date(); const izin = b.ticariIzin === true; const v = { unvan: sec.clean(b.unvan, 160), yetkili: sec.clean(b.yetkili, 120), il: sec.clean(b.il, 60) };
  await db.q('INSERT INTO bayi_basvuru (id, tur, unvan, yetkili, eposta, telefon, il, notu, vitrin_izin, kvkk_at, ticari_izin, ticari_izin_at, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [uid(), b.tur, v.unvan, v.yetkili, b.eposta.toLowerCase().trim(), sec.clean(b.telefon, 40), v.il, sec.clean(b.not, 2000) || null, b.vitrinIzni === true ? 1 : 0, an, izin ? 1 : 0, izin ? an : null, an]);
  log.uygulama.bilgi('bayi.basvuru', { istek: c.istek, veri: { tur: b.tur, ticariIzin: izin } });
  yoneticiyeBildir(`Yeni iş ortaklığı başvurusu: ${v.unvan}`, 'Yeni iş ortaklığı başvurusu', `${v.unvan} başvurdu.`, [['Tür', BAYI_TUR[b.tur]], ['Yetkili', v.yetkili], ['İl', v.il]], 'bayiler');
  return { ok: true };
});
A('GET', '/bayiler', async () => ({ ok: true, durumlar: BAYI_DURUM, turler: BAYI_TUR, rows: await db.q('SELECT * FROM bayi_basvuru ORDER BY created DESC LIMIT 500') }));
A('POST', '/bayiler/:id', async (c) => {
  const b = c.body; const r = await db.one('SELECT id, unvan, vitrin_izin FROM bayi_basvuru WHERE id=?', [c.params.id]); if (!r) throw err(404, 'Başvuru bulunamadı');
  if (!BAYI_DURUM.includes(b.durum)) throw err(400, 'Geçersiz durum');
  const vitrin = b.vitrin === true; if (vitrin && !r.vitrin_izin) throw err(400, 'Başvuru sahibi sitede listelenmeye izin vermedi');
  if (vitrin && b.durum !== 'onaylandi') throw err(400, 'Yalnız onaylanan başvuru sitede listelenir');
  await db.q('UPDATE bayi_basvuru SET durum=?, vitrin=? WHERE id=?', [b.durum, vitrin ? 1 : 0, r.id]);
  await audit(c, 'İş ortağı başvurusu güncellendi', `${r.unvan} · ${b.durum}${vitrin ? ' · sitede' : ''}`); return { ok: true };
});

// ---------- Veri taşıma talebi: mevcut Satış Talepleri ekranına düşer ----------
route('POST', '/api/veri-tasima', { auth: 'none', limit: ['tasima', 5, SAAT], bodyMax: 20e3 }, async (c) => {
  const b = c.body; spamDenetle(b, 'tasima', b.not);
  if (!sec.V.str(b.ad, 120, 2)) throw err(400, 'Ad soyad gerekli');
  if (!sec.V.str(b.isletme, 160, 2)) throw err(400, 'İşletme adı gerekli');
  if (!sec.V.phone(b.telefon)) throw err(400, 'Geçerli bir telefon numarası yazın');
  const eposta = istegeBagliEposta(b.eposta); const program = String(b.program || '');
  if (program && !cat.product(program)) throw err(400, 'Geçersiz program');
  if (!sec.V.str(b.eskiProgram, 160, 2)) throw err(400, 'Verinizin şu an nerede durduğunu yazın');
  if (b.not !== undefined && b.not !== null && !sec.V.str(b.not, 2000)) throw err(400, 'Not en çok 2000 karakter olabilir');
  kvkkOnay(b);
  const msg = [`Şu anki kaynak: ${sec.clean(b.eskiProgram, 160)}`, b.kayit ? `Yaklaşık kayıt: ${sec.clean(b.kayit, 40)}` : '', sec.clean(b.not, 2000)].filter(Boolean).join(' · ').slice(0, 2300);
  await db.q('INSERT INTO leads (id, name, phone, email, biz, type, product, msg, ip, kvkk_at, created) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [uid(), sec.clean(b.ad, 120), sec.clean(b.telefon, 40), eposta, sec.clean(b.isletme, 160), 'veri-tasima', program || null, msg, c.ip, new Date(), new Date()]);
  log.uygulama.bilgi('veri_tasima.talep', { istek: c.istek, veri: { program: program || null } });
  yoneticiyeBildir(`Veri taşıma talebi: ${sec.clean(b.isletme, 160)}`, 'Yeni veri taşıma talebi', `${sec.clean(b.isletme, 160)} veri taşıma desteği istedi.`, [['Yetkili', sec.clean(b.ad, 120)], ['Program', program ? cat.product(program).name : 'Belirtilmedi']], 'talepler');
  return { ok: true };
});

// ---------- Öneri kutusu ve yol haritası istekleri ----------
const ONERI_DURUM = ['yeni', 'degerlendiriliyor', 'planlandi', 'yapildi', 'reddedildi'];
const YENI = '_yeni';
const oneriOzet = (program, yeni, metin) => crypto.createHash('sha1').update([program, yeni, metin].map((x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()).join('|')).digest('hex');
route('POST', '/api/oneri', { auth: 'none', limit: ['oneri', 5, SAAT], bodyMax: 10e3 }, async (c) => {
  const b = c.body; spamDenetle(b, 'oneri', b.metin);
  if (!sec.V.str(b.metin, 1500, 10)) throw err(400, 'İsteğinizi en az 10 karakterle yazın');
  const sec0 = String(b.program || ''); let program = null; let yeni = null;
  if (sec0 === YENI) { if (!sec.V.str(b.yeniProgram, 120, 2)) throw err(400, 'İstediğiniz programın adını yazın'); yeni = sec.clean(b.yeniProgram, 120); } else if (sec0) { if (!cat.product(sec0)) throw err(400, 'Geçersiz program'); program = sec0; }
  const eposta = istegeBagliEposta(b.eposta); kvkkOnay(b);
  const metin = sec.clean(b.metin, 1500); const an = new Date();
  try { await db.q('INSERT INTO oneriler (id, program, yeni_program, metin, eposta, ozet, kvkk_at, created) VALUES (?,?,?,?,?,?,?,?)', [uid(), program, yeni, metin, eposta, oneriOzet(program, yeni, metin), an, an]); } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw err(409, 'Bu öneri daha önce alındı.'); throw e; }
  log.uygulama.bilgi('oneri.alindi', { istek: c.istek, veri: { program: program || (yeni ? 'yeni' : 'genel') } });
  return { ok: true };
});
const pad = (id) => (cat.kayitli(id) || {}).name || id;
A('GET', '/oneriler', async () => {
  const sayim = await db.q("SELECT program, yeni_program, COUNT(*) AS n FROM oneriler WHERE durum<>'reddedildi' GROUP BY program, yeni_program ORDER BY n DESC, program LIMIT 200");
  return { ok: true, durumlar: ONERI_DURUM, sayim: sayim.map((x) => ({ ad: x.yeni_program ? `${x.yeni_program} (yeni program)` : x.program ? pad(x.program) : 'Genel öneri', yeni: !!x.yeni_program, n: Number(x.n) })), rows: await db.q('SELECT id, program, yeni_program, metin, eposta, durum, created FROM oneriler ORDER BY created DESC LIMIT 500') };
});
A('POST', '/oneriler/:id', async (c) => {
  if (!ONERI_DURUM.includes(c.body.durum)) throw err(400, 'Geçersiz durum');
  const r = await db.q('UPDATE oneriler SET durum=? WHERE id=?', [c.body.durum, c.params.id]); if (!r.affectedRows) throw err(404, 'Öneri bulunamadı');
  await audit(c, 'Öneri güncellendi', `${c.params.id} · ${c.body.durum}`); return { ok: true };
});

// ---------- Bakım kayıtları ----------
const BAKIM_TUR = { planli: 'Planlı bakım', olay: 'Kesinti veya olay', guncelleme: 'Güncelleme' };
const zaman = (v) => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; };
function bakimOku(b) {
  if (!Object.prototype.hasOwnProperty.call(BAKIM_TUR, b.tur)) throw err(400, 'Kayıt türünü seçin');
  const baslik = sec.clean(b.baslik, 160); if (baslik.length < 3) throw err(400, 'Başlık gerekli');
  const bas = zaman(b.bas); const bit = zaman(b.bit); if (!bas) throw err(400, 'Başlangıç zamanı gerekli'); if (bit === undefined) throw err(400, 'Geçersiz bitiş zamanı');
  if (bit && bit < bas) throw err(400, 'Bitiş başlangıçtan önce olamaz');
  if (b.tur !== 'planli' && bas.getTime() > Date.now() + 60e3) throw err(400, 'Gelecekteki kayıt yalnız planlı bakım olabilir');
  return { tur: b.tur, baslik, aciklama: sec.clean(b.aciklama, 1000) || null, bas, bit: bit || null, yayinda: b.yayinda === true ? 1 : 0 };
}
A('GET', '/bakim', async () => ({ ok: true, turler: BAKIM_TUR, rows: await db.q('SELECT * FROM bakim_kayit ORDER BY bas DESC LIMIT 200') }));
A('POST', '/bakim', async (c) => {
  const v = bakimOku(c.body || {}); const k = Object.keys(v); durumTemizle();
  if (c.body.id) { const r = await db.q(`UPDATE bakim_kayit SET ${k.map((x) => `${x}=?`).join(', ')} WHERE id=?`, [...k.map((x) => v[x]), String(c.body.id)]); if (!r.affectedRows) throw err(404, 'Kayıt yok'); await audit(c, 'Bakım kaydı güncellendi', v.baslik); return { ok: true, id: c.body.id }; }
  const id = uid(); await db.q(`INSERT INTO bakim_kayit (id, yazan, created, ${k.join(', ')}) VALUES (?,?,?,${k.map(() => '?').join(',')})`, [id, c.user.id, new Date(), ...k.map((x) => v[x])]); await audit(c, 'Bakım kaydı eklendi', v.baslik); return { ok: true, id };
});
A('DELETE', '/bakim/:id', async (c) => { await db.q('DELETE FROM bakim_kayit WHERE id=?', [c.params.id]); durumTemizle(); await audit(c, 'Bakım kaydı silindi', c.params.id); return { ok: true }; });

// ---------- Sistem durumu ----------
const OLCUM_MS = 3000; const ONBELLEK_MS = 15e3;
const suresiyle = (p, ms = OLCUM_MS) => { let t; return Promise.race([p, new Promise((_, no) => { t = setTimeout(() => no(new Error('zaman aşımı')), ms); })]).finally(() => clearTimeout(t)); };
async function vtOlc() {
  if (!db.ready()) return { durum: 'bilinmiyor' };
  const t0 = Date.now();
  try { await suresiyle(db.q('SELECT 1')); return { durum: 'calisiyor', ms: Date.now() - t0 }; } catch (e) { return { durum: 'sorun' }; }
}
// Son dakikaların penceresi: analitik uyarısıyla aynı hesap. Az istekle sonuç çıkmaz, sayı dışarı verilmez.
async function istekOlc() {
  try { const a = await suresiyle(analitik.ayar()); const p = analitik.pencere(a.pencereDk); if (p.n < a.minIstek) return { durum: 'bilinmiyor' }; const L = analitik.alarmHesapla(p, a).map((x) => x.tur); return { durum: L.includes('hata') ? 'sorun' : L.includes('yavas') ? 'yavas' : 'calisiyor' }; } catch (e) { return { durum: 'bilinmiyor' }; }
}
function genelDurum(u, v, i) { const L = [u.durum, v.durum]; if (L.includes('sorun') || i.durum === 'sorun') return 'sorun'; if (L.includes('bilinmiyor')) return 'bilinmiyor'; return i.durum === 'yavas' ? 'yavas' : 'calisiyor'; }
async function olc() {
  const uygulama = { durum: 'calisiyor' }; const veritabani = await vtOlc(); const istekler = await istekOlc(); let bakimda = null; let bakim = null;
  if (veritabani.durum === 'calisiyor') {
    try { const m = ((await suresiyle(setting('platform', {}))) || {}).maintenance || {}; bakimda = Object.entries(m).filter(([, v]) => v && v.on).map(([k, v]) => ({ program: pad(k), mesaj: sec.clean(v.msg, 300) })); } catch (e) { bakimda = null; }
    try { bakim = await suresiyle(db.q('SELECT tur, baslik, aciklama, bas, bit FROM bakim_kayit WHERE yayinda=1 ORDER BY bas DESC LIMIT 5')); } catch (e) { bakim = null; }
  }
  return { ok: true, olcum: new Date().toISOString(), genel: genelDurum(uygulama, veritabani, istekler), uygulama, veritabani, istekler, bakimda, bakim };
}
let onbellek = null; let suren = null;
function durumTemizle() { onbellek = null; }
async function durum() {
  if (onbellek && Date.now() - onbellek.t < ONBELLEK_MS) return onbellek.v;
  if (!suren) suren = olc().then((v) => { onbellek = { t: Date.now(), v }; return v; }).finally(() => { suren = null; });
  return suren;
}
pub('GET', /^\/api\/sistem-durumu$/, { auth: 'none', db: false, limit: ['durum', 60, 60e3], metrik: false }, () => durum());

// Sayfalardaki yalnız gerçek ayardan gelen bilgiler: boşsa alan null döner, sayfada satır görünmez
pub('GET', /^\/api\/vitrin$/, { auth: 'none', db: false, limit: ['vitrin', 120, 60e3], metrik: false }, async () => {
  const out = { ok: true, komisyon: komisyon(), kurulum: kurulum(), tavsiyeGun: null, ortaklar: [] };
  if (db.ready()) { try { const s = await suresiyle(site()); const g = Number(s.referralDays); out.tavsiyeGun = g > 0 ? g : null; out.ortaklar = (await suresiyle(db.q("SELECT tur, unvan, il FROM bayi_basvuru WHERE vitrin=1 AND vitrin_izin=1 AND durum='onaylandi' ORDER BY il, unvan LIMIT 200"))).map((x) => ({ tur: BAYI_TUR[x.tur] || '', unvan: x.unvan, il: x.il })); } catch (e) { /* veritabanı okunamadı: bölüm görünmez */ } }
  return out;
});

module.exports = { komisyon, kurulum, spamDenetle, oneriOzet, bakimOku, vtOlc, istekOlc, genelDurum, durum, durumTemizle };
