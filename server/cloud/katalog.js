// Hazır ürün kataloğu: merkezi ürün havuzu (NEBSOFT işletmelerinin kaydettiği ürünler) + Open Food Facts (açık veri, ücretsiz)
//  • Arama: önce havuz (Türkiye'deki gerçek mağazalardan gelen, en çok kullanılan ürünler), sonra Open Food Facts (Türkiye filtresi)
//  • Barkod sorgusu: havuz → Open Food Facts (tüm ülkeler)
//  • Katkı: işletme katalogdan veya elle ürün kaydettikçe barkod/ad/marka/görsel havuza eklenir; havuz zamanla büyür
// Open Food Facts verileri ODbL lisanslıdır (kaynak gösterilerek kullanılabilir); görseller CC BY-SA.
const db = require('./db');
const OFF_SEARCH = 'https://search.openfoodfacts.org/search';
const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product/';
const UA = 'NEBSOFT/3.1 (urun-katalogu; destek@nebsoft.com.tr)';
const CATS = { icecek: 'en:beverages', atistirmalik: 'en:snacks', sut: 'en:dairies', kahvalti: 'en:breakfasts', tatli: 'en:sweet-snacks', temel: 'en:cereals-and-potatoes', konserve: 'en:canned-foods', dondurulmus: 'en:frozen-foods', et: 'en:meats', meyve: 'en:plant-based-foods' };
const cache = new Map(); const TTL = 6 * 3600e3;
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const offHit = (h) => ({ barcode: String(h.code || ''), name: clean(h.product_name_tr || h.product_name, 200), brand: clean(Array.isArray(h.brands) ? h.brands[0] : h.brands, 120), image: h.image_front_small_url || h.image_front_url || '', category: Array.isArray(h.categories_tags) ? String(h.categories_tags[h.categories_tags.length - 1] || '').replace(/^\w+:/, '') : '', source: 'off' });
async function getJson(url) { const c = cache.get(url); if (c && Date.now() - c.at < TTL) return c.j; // Open Food Facts ara sıra 502/503 döndürür: geçici hatalarda iki kez daha denenir
  let r; for (let i = 0; i < 3; i++) { try { r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) }); if (r.ok || r.status < 500) break; } catch (e) { if (i === 2) throw new Error('Katalog servisine bağlanılamadı'); } await new Promise((ok) => setTimeout(ok, 700 * (i + 1))); }
  if (!r || !r.ok) throw new Error('Katalog servisi yanıt vermedi (' + (r ? r.status : 'bağlantı yok') + ')'); const j = await r.json(); cache.set(url, { at: Date.now(), j }); if (cache.size > 500) cache.delete(cache.keys().next().value); return j; }
async function search({ q = '', cat = '', page = 1 }) {
  q = clean(q, 80); page = Math.max(1, Math.min(50, Number(page) || 1)); const out = []; const seen = new Set();
  if (db.ready() && page === 1) { try { const rows = q ? await db.q('SELECT barcode, name, brand, image, category, uses FROM product_pool WHERE name LIKE ? OR brand LIKE ? OR barcode = ? ORDER BY uses DESC LIMIT 24', [`%${q}%`, `%${q}%`, q]) : await db.q('SELECT barcode, name, brand, image, category, uses FROM product_pool ORDER BY uses DESC LIMIT 24'); rows.forEach((r) => { if (!seen.has(r.barcode)) { seen.add(r.barcode); out.push({ ...r, source: 'havuz' }); } }); } catch (e) { /* tablo yok */ } }
  const parts = ['countries_tags:"en:turkey"']; if (CATS[cat]) parts.push(`categories_tags:"${CATS[cat]}"`); if (q) parts.unshift(q.replace(/[":]/g, ' '));
  let more = false;
  try {
    const u = `${OFF_SEARCH}?${new URLSearchParams({ q: parts.join(' AND '), page_size: '36', page: String(page), fields: 'code,product_name,product_name_tr,brands,image_front_small_url,image_front_url,categories_tags' })}`;
    const j = await getJson(u); (j.hits || []).map(offHit).filter((h) => h.barcode && h.name && /^\d{8,14}$/.test(h.barcode)).sort((x, y) => (!x.image - !y.image) || (!x.brand - !y.brand)).forEach((h) => { if (!seen.has(h.barcode)) { seen.add(h.barcode); out.push(h); } }); more = (j.page_count || 0) > page;
  } catch (e) { if (!out.length) throw e; }
  return { items: out, more, page };
}
async function barcode(code) {
  code = String(code || '').replace(/\D/g, '').slice(0, 14); if (code.length < 8) return null;
  if (db.ready()) { try { const r = await db.one('SELECT barcode, name, brand, image, category FROM product_pool WHERE barcode=?', [code]); if (r) return { ...r, source: 'havuz' }; } catch (e) { /* yok */ } }
  try { const j = await getJson(`${OFF_PRODUCT}${code}.json?fields=code,product_name,product_name_tr,brands,image_front_small_url,image_front_url,categories_tags`); if (j.status === 1 && j.product) { const h = offHit({ ...j.product, code }); if (h.name) return h; } } catch (e) { /* yok */ }
  return null;
}
async function contribute(items) {
  if (!db.ready()) return 0; let n = 0;
  for (const it of (items || []).slice(0, 500)) {
    const code = String(it.barcode || '').replace(/\D/g, ''); const name = clean(it.name, 200); if (!/^\d{8,14}$/.test(code) || name.length < 2) continue;
    const img = /^https:\/\/images\.openfoodfacts\.org\//.test(it.image || '') ? String(it.image).slice(0, 400) : null;
    await db.q('INSERT INTO product_pool (barcode, name, brand, image, category, uses, source, updated) VALUES (?,?,?,?,?,1,?,?) ON DUPLICATE KEY UPDATE uses=uses+1, updated=VALUES(updated), image=COALESCE(image, VALUES(image)), brand=COALESCE(brand, VALUES(brand))', [code, name, clean(it.brand, 120) || null, img, clean(it.category, 80) || null, it.source === 'off' ? 'off' : 'isletme', new Date()]); n++;
  }
  return n;
}
module.exports = { search, barcode, contribute, CATS };
