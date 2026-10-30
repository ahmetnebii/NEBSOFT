// Güven kanıtı: yorum, vaka çalışması ve "kaç işletme kullanıyor" sayacı. Hepsi yalnızca yönetim panelinden girilen gerçek kayıtlardan gelir;
// kayıt yoksa bölüm hiç üretilmez. Sayaç ödenmiş, süresi geçmemiş lisanslardan hesaplanır ve belirlenen eşiğin altında dışarı verilmez.
// Doğrulanmış kaynağı olmadığı için Review / AggregateRating şeması üretilmez; yorumlarda puan alanı da yoktur.
const db = require('./db'); const sec = require('./security');
const { R, err, audit, setting, setSetting, uid } = require('./routes');
const cat = require('./catalog');

const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt, fn });
const VARSAYILAN_ESIK = 50;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tarih = (s) => { const x = String(s || ''); const d = new Date(x + 'T00:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x && d.getTime() <= Date.now() ? x : null; };
const urun = (p) => { const v = String(p || ''); if (!v) return null; if (!cat.product(v) || v === 'bundle') throw err(400, 'Geçersiz program'); return v; };
const ortak = (b) => {
  if (b.consent !== true) throw err(400, 'Yayın izni onay kutusu işaretlenmeden kayıt yapılamaz');
  const consent_at = tarih(b.consent_at); if (!consent_at) throw err(400, 'İzin tarihi gerekli (gelecek tarih olamaz)');
  return { consent: 1, consent_at, proof: sec.clean(b.proof, 200), published: b.published === true ? 1 : 0, product: urun(b.product), city: sec.clean(b.city, 60) };
};
function yorum(b) {
  const o = ortak(b); const review_at = tarih(b.review_at); if (!review_at) throw err(400, 'Yorum tarihi gerekli (gelecek tarih olamaz)');
  const author = sec.clean(b.author, 120); const text = sec.clean(b.text, 1200);
  if (author.length < 3 || text.length < 10) throw err(400, 'Yorum sahibi ve yorum metni gerekli');
  return { ...o, review_at, author, text, biz: sec.clean(b.biz, 160) };
}
function vaka(b) {
  const o = ortak(b); const case_at = tarih(b.case_at); if (!case_at) throw err(400, 'Vaka tarihi gerekli (gelecek tarih olamaz)');
  const v = { biz: sec.clean(b.biz, 160), sector: sec.clean(b.sector, 80), title: sec.clean(b.title, 200), problem: sec.clean(b.problem, 1500), solution: sec.clean(b.solution, 1500), result: sec.clean(b.result, 1500), period: sec.clean(b.period, 80) };
  if (v.biz.length < 2 || v.title.length < 5 || v.problem.length < 10 || v.solution.length < 10 || v.result.length < 5) throw err(400, 'İşletme, başlık, sorun, çözüm ve ölçülen sonuç gerekli');
  if (!/\d/.test(v.result)) throw err(400, 'Sonuç ölçülebilir olmalı: rakam içeren, kaynağı belli bir ölçüm yazın');
  if (v.period.length < 3) throw err(400, 'Ölçüm dönemini yazın (ör. Mart–Mayıs 2026)');
  return { ...o, ...v, case_at };
}

// Herkese açık veri: yalnızca yayında + izinli kayıtlar; izin belgesi bilgisi (proof) dışarı verilmez. Sayaç eşiğin altındaysa hiç dönmez.
async function sayac(pid) {
  const esik = Math.max(1, Number((await setting('guven', {})).esik) || VARSAYILAN_ESIK);
  const r = await db.one(`SELECT COUNT(DISTINCT l.tenant_id) AS n FROM licenses l JOIN tenants t ON t.id=l.tenant_id WHERE l.status='aktif' AND l.end>UTC_TIMESTAMP() AND l.order_id IS NOT NULL AND t.status='active'${pid ? ' AND l.product=?' : ''}`, pid ? [pid] : []);
  const n = Number(r && r.n) || 0; return n > esik ? n : null;
}
const onbellek = new Map();
const temizle = () => onbellek.clear();
async function veri(pid) {
  const bos = { reviews: [], cases: [], count: null }; if (!db.ready()) return bos;
  const k = pid || '_'; const c = onbellek.get(k); if (c && Date.now() - c.t < 60e3) return c.v;
  const w = pid ? 'AND (product=? OR product IS NULL)' : ''; const p = pid ? [pid] : [];
  const v = {
    reviews: await db.q(`SELECT id, product, author, biz, city, text, DATE_FORMAT(review_at, '%Y-%m-%d') AS review_at FROM reviews WHERE published=1 AND consent=1 ${w} ORDER BY review_at DESC LIMIT 6`, p),
    cases: await db.q(`SELECT id, product, biz, sector, city, title, problem, solution, result, period, DATE_FORMAT(case_at, '%Y-%m-%d') AS case_at FROM case_studies WHERE published=1 AND consent=1 ${w} ORDER BY case_at DESC LIMIT 3`, p),
    count: await sayac(pid),
  };
  onbellek.set(k, { t: Date.now(), v }); return v;
}
const gun = (s) => { const [y, m, d] = String(s).split('-'); return `${d}.${m}.${y}`; };
// Tek gösterim kaynağı: pazar yeri ve tanıtım siteleri aynı HTML'i kullanır. Kayıt yoksa boş metin döner.
function html(v, name) {
  if (!v || (!v.reviews.length && !v.cases.length && !v.count)) return '';
  const kutu = 'border:1px solid rgba(127,127,127,.28);border-radius:14px;padding:16px';
  return `<section id="guven" style="padding:32px 16px"><div style="max-width:1080px;margin:0 auto"><h2 style="margin:0 0 14px">Kullanan işletmelerden</h2>
    ${v.count ? `<p style="margin:0 0 16px"><b>${Number(v.count).toLocaleString('tr-TR')}</b> işletme ${name ? esc(name) + ' için ' : ''}ücretli lisansla kullanıyor.</p>` : ''}
    ${v.reviews.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:16px">${v.reviews.map((r) => `<figure style="${kutu};margin:0"><blockquote style="margin:0 0 10px">${esc(r.text)}</blockquote><figcaption style="font-size:13.5px;opacity:.75">${esc(r.author)}${r.biz ? ' · ' + esc(r.biz) : ''}${r.city ? ', ' + esc(r.city) : ''} · ${gun(r.review_at)}</figcaption></figure>`).join('')}</div>` : ''}
    ${v.cases.map((c) => `<article style="${kutu};margin-bottom:12px"><h3 style="margin:0 0 6px">${esc(c.title)}</h3><p style="margin:0 0 8px;font-size:13.5px;opacity:.75">${esc(c.biz)}${c.sector ? ' · ' + esc(c.sector) : ''}${c.city ? ', ' + esc(c.city) : ''}</p><p style="margin:0 0 6px"><b>Sorun:</b> ${esc(c.problem)}</p><p style="margin:0 0 6px"><b>Çözüm:</b> ${esc(c.solution)}</p><p style="margin:0 0 6px"><b>Sonuç:</b> ${esc(c.result)}</p><p style="margin:0;font-size:13.5px;opacity:.75">Ölçüm dönemi: ${esc(c.period)}. Sonuç bu işletmeye aittir; her işletmede aynı olmayabilir.</p></article>`).join('')}
  </div></section>`;
}
// Tanıtım sitesi sayfası: /site/<slug>/index.html → programın kaydı varsa alt bilgiden önce eklenir; yoksa sayfa hiç değişmez
let SLUG = null;
const slugMap = () => { if (!SLUG) { SLUG = {}; try { require('../../site/src/products').forEach((p) => { SLUG[p.slug] = p.id; }); } catch (e) { /* tanıtım kaynağı yok */ } } return SLUG; };
async function inject(text, p) {
  try {
    const m = /^\/site\/([a-z0-9-]+)\/index\.html$/.exec(p); const pid = m && slugMap()[m[1]]; if (!pid || !db.ready()) return text;
    const h = html(await veri(pid), (cat.product(pid) || {}).name); if (!h) return text;
    const i = text.lastIndexOf('<footer'); return i < 0 ? text : text.slice(0, i) + h + text.slice(i);
  } catch (e) { return text; }
}

route('GET', '/api/guven', { auth: 'none', db: false, limit: ['guven', 120, 60e3] }, async (c) => {
  const p = String(c.query.get('p') || ''); const pid = p && cat.product(p) ? p : null;
  const v = await veri(pid); return { ok: true, ...v, html: html(v, pid ? cat.product(pid).name : '') };
});
const kaydet = async (tablo, v, id) => {
  const k = Object.keys(v);
  if (id) { const r = await db.q(`UPDATE ${tablo} SET ${k.map((x) => `${x}=?`).join(', ')} WHERE id=?`, [...k.map((x) => v[x]), id]); if (!r.affectedRows) throw err(404, 'Kayıt yok'); return id; }
  const yeni = uid(); await db.q(`INSERT INTO ${tablo} (id, created, ${k.join(', ')}) VALUES (?,?,${k.map(() => '?').join(',')})`, [yeni, new Date(), ...k.map((x) => v[x])]); return yeni;
};
route('GET', '/api/admin/guven', { auth: 'admin' }, async () => {
  const f = (a) => `DATE_FORMAT(${a}, '%Y-%m-%d') AS ${a}`;
  return { ok: true, reviews: await db.q(`SELECT id, product, author, biz, city, text, proof, consent, published, ${f('review_at')}, ${f('consent_at')} FROM reviews ORDER BY created DESC LIMIT 300`), cases: await db.q(`SELECT id, product, biz, sector, city, title, problem, solution, result, period, proof, consent, published, ${f('case_at')}, ${f('consent_at')} FROM case_studies ORDER BY created DESC LIMIT 300`), esik: Math.max(1, Number((await setting('guven', {})).esik) || VARSAYILAN_ESIK), gosterilen: await sayac(null) };
});
route('POST', '/api/admin/guven/yorum', { auth: 'admin' }, async (c) => { const id = await kaydet('reviews', yorum(c.body || {}), c.body.id ? String(c.body.id) : null); temizle(); await audit(c, 'Yorum kaydedildi', id); return { ok: true, id }; });
route('POST', '/api/admin/guven/vaka', { auth: 'admin' }, async (c) => { const id = await kaydet('case_studies', vaka(c.body || {}), c.body.id ? String(c.body.id) : null); temizle(); await audit(c, 'Vaka kaydedildi', id); return { ok: true, id }; });
route('DELETE', '/api/admin/guven/yorum/:id', { auth: 'admin' }, async (c) => { await db.q('DELETE FROM reviews WHERE id=?', [c.params.id]); temizle(); await audit(c, 'Yorum silindi', c.params.id); return { ok: true }; });
route('DELETE', '/api/admin/guven/vaka/:id', { auth: 'admin' }, async (c) => { await db.q('DELETE FROM case_studies WHERE id=?', [c.params.id]); temizle(); await audit(c, 'Vaka silindi', c.params.id); return { ok: true }; });
route('PUT', '/api/admin/guven/ayar', { auth: 'admin' }, async (c) => { const esik = Math.round(Number((c.body || {}).esik)); if (!(esik >= 1 && esik <= 100000)) throw err(400, 'Eşik 1 veya üzeri bir sayı olmalı'); await setSetting('guven', { esik }); temizle(); await audit(c, 'Sayaç eşiği', String(esik)); return { ok: true }; });

module.exports = { yorum, vaka, html, inject, veri, sayac, tarih, temizle };
