// Kurumsal teklif: herkese açık form (/kurumsal-teklif/) → quotes tablosu → panelde durum ve tutar → siparişe çevirme.
//  • Form: IP başına saatte 5 istek, CSRF başlığı, KVKK onayı zorunlu, ticari ileti izni ayrı ve isteğe bağlı.
//  • Olay kaydında yalnızca teklif no, tür ve adetler yer alır. Kişi ve iletişim bilgisi, serbest not kayda girmez.
//  • Sipariş tutarı panelde yazılan teklif tutarıdır (KDV hariç); ödeme yine havale onayı veya Shopier ile gerçekleşir, lisans ödenince açılır.
const db = require('./db');
const sec = require('./security');
const auth = require('./auth');
const cat = require('./catalog');
const mail = require('./mail');
const log = require('./log');
const indirim = require('./indirim');
const { route, A, err, site, audit, J, setting, mailTo, fmtTL } = require('./routes');

const DURUM = ['yeni', 'inceleniyor', 'teklif-verildi', 'kabul', 'siparis', 'kayip'];
const ADET_UST = 100000;
const now = () => new Date();
const turler = () => (indirim.load().kurumsal || {}).turler || {};
const adet = (x) => { const n = Math.floor(Number(x)); return Number.isFinite(n) && n >= 1 && n <= ADET_UST ? n : 0; };
const has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

async function nextQuoteNo(t) {
  const r = (await t.q("SELECT v FROM settings WHERE k='quote_seq' FOR UPDATE"))[0];
  const n = (r ? Number(J(r.v, 1000)) : 1000) + 1;
  await t.q("INSERT INTO settings (k, v) VALUES ('quote_seq', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify(n)]);
  return 'KT' + n;
}
async function adminBildir(no, b) {
  try { const m = await mail.settings(); const s = await site(); if (!m.user) return; mailTo(m.replyTo || m.user, `Yeni kurumsal teklif talebi: ${no}`, { title: 'Yeni kurumsal teklif talebi', intro: `${b.kurum} teklif istedi.`, blocks: [{ type: 'kv', rows: [['Tür', turler()[b.tur] || b.tur], ['Yetkili', b.yetkili], ['Lisans', String(b.lisans)], ['Şube', String(b.sube)]] }, { type: 'button', label: 'Teklifi aç', url: `${s.siteUrl || ''}/admin/#/teklifler` }] }); } catch (e) { /* kayıt panelde görünür */ }
}

route('POST', '/api/kurumsal-teklif', { auth: 'none', limit: ['teklif', 5, 3600e3], bodyMax: 20e3 }, async (c) => {
  const b = c.body;
  if (!sec.V.str(b.kurum, 160, 2)) throw err(400, 'Kurum adı gerekli');
  if (!has(turler(), b.tur)) throw err(400, 'Kurum türünü seçin');
  if (!sec.V.str(b.yetkili, 120, 2)) throw err(400, 'Yetkili adı gerekli');
  if (!sec.V.email(b.eposta)) throw err(400, 'Geçerli bir e-posta adresi yazın');
  if (!sec.V.phone(b.telefon)) throw err(400, 'Geçerli bir telefon numarası yazın');
  const lisans = adet(b.lisans), sube = adet(b.sube); if (!lisans || !sube) throw err(400, 'Lisans ve şube sayısı 1 veya daha büyük olmalı');
  if (b.program_listesi !== undefined && !Array.isArray(b.program_listesi)) throw err(400, 'Geçersiz program listesi');
  const programlar = [...new Set(b.program_listesi || [])]; if (programlar.length > 40 || programlar.some((p) => typeof p !== 'string' || !cat.product(p))) throw err(400, 'Geçersiz program listesi');
  if (b.not !== undefined && b.not !== null && !sec.V.str(b.not, 2000)) throw err(400, 'Not en çok 2000 karakter olabilir');
  if (b.kvkk !== true) throw err(400, 'KVKK aydınlatma metnini okuduğunuzu onaylayın');
  const izin = b.ticariIzin === true; const an = now(); const id = auth.uid();
  const v = { kurum: sec.clean(b.kurum, 160), tur: b.tur, yetkili: sec.clean(b.yetkili, 120), lisans, sube };
  const no = await db.tx(async (t) => {
    const n = await nextQuoteNo(t);
    await t.q('INSERT INTO quotes (id, no, kurum, tur, yetkili, eposta, telefon, program_listesi, lisans, sube, `not`, durum, kvkk_at, ticari_izin, ticari_izin_at, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, n, v.kurum, v.tur, v.yetkili, b.eposta.toLowerCase().trim(), sec.clean(b.telefon, 40), JSON.stringify(programlar), lisans, sube, sec.clean(b.not, 2000) || null, 'yeni', an, izin ? 1 : 0, izin ? an : null, an]);
    return n;
  });
  log.uygulama.bilgi('teklif.olusturuldu', { istek: c.istek, ip: c.ip, veri: { teklif: no, tur: v.tur, lisans, sube, programAdedi: programlar.length, ticariIzin: izin } });
  adminBildir(no, v);
  return { ok: true, no };
});

const pub = (q) => ({ ...q, teklif_tutari: q.teklif_tutari === null ? null : Number(q.teklif_tutari), program_listesi: J(q.program_listesi, []) });
A('GET', '/quotes', async () => ({ ok: true, durumlar: DURUM, turler: turler(), quotes: (await db.q('SELECT * FROM quotes ORDER BY created DESC LIMIT 500')).map(pub) }));
A('POST', '/quotes/:id', async (c) => {
  const b = c.body; const q = await db.one('SELECT * FROM quotes WHERE id=?', [c.params.id]); if (!q) throw err(404, 'Teklif bulunamadı');
  if (!DURUM.includes(b.durum) || b.durum === 'siparis') throw err(400, 'Geçersiz durum');
  if (q.order_id) throw err(400, 'Siparişe çevrilen teklif değiştirilemez');
  const tutar = b.teklif_tutari === '' || b.teklif_tutari === null || b.teklif_tutari === undefined ? null : Number(b.teklif_tutari);
  if (tutar !== null && !(tutar > 0 && tutar <= 1e9)) throw err(400, 'Geçersiz tutar');
  const g = b.gecerlilik ? String(b.gecerlilik) : null; if (g && (!/^\d{4}-\d{2}-\d{2}$/.test(g) || Number.isNaN(new Date(g).getTime()))) throw err(400, 'Geçersiz tarih');
  await db.q('UPDATE quotes SET durum=?, teklif_tutari=?, gecerlilik=? WHERE id=?', [b.durum, tutar === null ? null : Math.round(tutar * 100) / 100, g, q.id]);
  await audit(c, 'Teklif güncellendi', `${q.no} · ${b.durum}`); return { ok: true };
});
// Teklif tutarı kalemlere liste fiyatı oranında dağıtılır; toplam kuruşu kuruşuna teklif tutarıdır.
function dagit(lines, tutar) {
  const top = lines.reduce((s, l) => s + l.price, 0); const hedef = Math.round(tutar * 100); let kalan = hedef;
  return lines.map((l, i) => { const k = i === lines.length - 1 ? kalan : Math.floor((hedef * l.price) / top); kalan -= k; return k / 100; });
}
A('POST', '/quotes/:id/siparis', async (c) => {
  const b = c.body; const plan = Number(b.plan); const period = b.period === 'yillik' ? 'yillik' : 'aylik';
  if (![0, 1, 2].includes(plan)) throw err(400, 'Geçersiz paket');
  const sonuc = await db.tx(async (t) => {
    const q = (await t.q('SELECT * FROM quotes WHERE id=? FOR UPDATE', [c.params.id]))[0]; if (!q) throw err(404, 'Teklif bulunamadı');
    if (q.order_id) throw err(400, 'Bu teklif zaten siparişe çevrildi');
    const tutar = Number(q.teklif_tutari); if (!(tutar > 0)) throw err(400, 'Önce teklif tutarını girin');
    if (q.gecerlilik && new Date(q.gecerlilik).getTime() + 864e5 < Date.now()) throw err(400, 'Teklifin geçerlilik süresi dolmuş');
    const email = String(b.eposta || q.eposta).toLowerCase().trim();
    const u = (await t.q('SELECT * FROM users WHERE email=? AND tenant_id IS NOT NULL', [email]))[0]; if (!u) throw err(400, 'Bu e-postayla müşteri hesabı yok. Müşteri önce hesap açmalı veya hesabın e-postasını yazın.');
    const ids = J(q.program_listesi, []); if (!ids.length) throw err(400, 'Teklifte program seçili değil');
    const base = cat.price(ids.map((pid) => ({ pid, plan, period, qty: 1 }))).lines; const pay = dagit(base, tutar);
    const items = base.map((l, i) => ({ ...l, qty: q.lisans, price: pay[i] }));
    const kdv = Math.round(tutar * cat.VAT) / 100; const total = Math.round((tutar + kdv) * 100) / 100;
    const ten = (await t.q('SELECT * FROM tenants WHERE id=?', [u.tenant_id]))[0];
    const billing = { name: q.yetkili, company: q.kurum, taxNo: ten.tax_no || '', taxOffice: ten.tax_office || '', address: ten.address || '', city: ten.city || '', email, phone: q.telefon };
    const r = (await t.q("SELECT v FROM settings WHERE k='order_seq' FOR UPDATE"))[0]; const n = (r ? Number(J(r.v, 24000)) : 24000) + 1;
    await t.q("INSERT INTO settings (k, v) VALUES ('order_seq', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify(n)]);
    const no = 'NS' + n; const id = auth.uid();
    await t.q('INSERT INTO orders (id, no, tenant_id, user_id, items, subtotal, discount, vat, total, coupon, status, billing, indirim, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, no, u.tenant_id, u.id, JSON.stringify(items), tutar, 0, kdv, total, null, 'odeme-bekliyor', JSON.stringify(billing), JSON.stringify({ kural: 'teklif', ad: `Kurumsal teklif ${q.no}`, yuzde: 0, tutar: 0, olcut: { lisansSayisi: q.lisans, subeSayisi: q.sube }, beyan: null }), now()]);
    await t.q("UPDATE quotes SET durum='siparis', order_id=? WHERE id=?", [id, q.id]);
    return { id, no, q, total, email, tenant: u.tenant_id };
  });
  await audit(c, 'Teklif siparişe çevrildi', `${sonuc.q.no} → ${sonuc.no}`, sonuc.tenant);
  const s = await site();
  mailTo(sonuc.email, `Teklifiniz siparişe çevrildi — ${sonuc.no}`, { title: 'Siparişiniz hazır', intro: `${sonuc.q.no} numaralı teklifiniz ${sonuc.no} numaralı siparişe çevrildi. Ödeme tamamlanınca lisanslarınız açılır.`, blocks: [{ type: 'kv', rows: [['Ödenecek (KDV dahil)', fmtTL(sonuc.total)]] }, { type: 'button', label: 'Siparişlerime git', url: `${s.siteUrl || ''}/#/hesabim/siparisler` }] });
  return { ok: true, order: { id: sonuc.id, no: sonuc.no, total: sonuc.total } };
});

module.exports = { DURUM };
