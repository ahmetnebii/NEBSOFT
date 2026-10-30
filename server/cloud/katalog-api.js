// Ortak katalog ve şablon uç noktaları. Katalog yalnız oturumlu kullanıcıya açıktır: herkese açık barkod listeleme yoktur.
const db = require('./db');
const auth = require('./auth');
const log = require('./log');
const katalog = require('./katalog');
const sablon = require('./sablon');
const { route, A, err, audit } = require('./routes');

// Demo ve yerel modda veritabanı yoktur: 503 yerine açık bir ileti dönsün diye oturum burada denetlenir
async function oturum(c) {
  if (!db.ready()) throw err(401, 'Ürün kataloğu oturum açmış işletmelere açıktır. Demoda ürünü elle ekleyin.', { code: 'auth' });
  c.user = await auth.current(c.req); if (!c.user) throw err(401, 'Oturum açmanız gerekiyor', { code: 'auth' });
  if (c.user.tenant_id) { const t = await db.one('SELECT status FROM tenants WHERE id=?', [c.user.tenant_id]); if (!t || t.status !== 'active') throw err(403, 'İşletme hesabı askıda. Destek ile iletişime geçin.'); }
}
const O = { auth: 'none', db: false };

route('GET', '/api/katalog/ara', { ...O, limit: ['kat', 120, 60e3] }, async (c) => { await oturum(c); return { ok: true, ...(await katalog.ara({ q: c.query.get('q') || '', cat: c.query.get('kat') || '', page: c.query.get('sayfa') || 1 })) }; });
route('GET', '/api/katalog/barkod/:gtin', { ...O, limit: ['katb', 240, 60e3] }, async (c) => {
  await oturum(c); const r = await katalog.barkod(c.params.gtin, { okutma: c.query.get('okutma') === '1' });
  if (r.hata) throw err(400, 'Barkod geçersiz: kontrol hanesi tutmuyor'); return { ok: true, item: r.item };
});
const oneri = async (c) => { await oturum(c); return { ok: true, ...(await katalog.oner(c.body.items)) }; };
route('POST', '/api/katalog/oneri', { ...O, limit: ['katk', 30, 60e3] }, oneri);
route('POST', '/api/katalog/katki', { ...O, limit: ['katk', 30, 60e3] }, oneri); // önbellekteki eski istemciler için

// ---------- Yönetici: moderasyon ----------
A('GET', '/katalog/durum', async () => ({ ok: true, ...(await katalog.durum()) }));
A('GET', '/katalog/oneriler', async (c) => ({ ok: true, rows: await katalog.kuyruk({ durum: c.query.get('durum') || 'bekliyor', filtre: c.query.get('filtre') || '' }) }));
A('POST', '/katalog/oneri/:id/onay', async (c) => { const r = await katalog.onayla(c.params.id, c.body, c.user.id); await audit(c, 'katalog.onay', `GTIN ${r.gtin}`); return { ok: true, ...r }; });
A('POST', '/katalog/oneri/:id/ret', async (c) => { await katalog.reddet(c.params.id, c.body.neden, c.user.id); await audit(c, 'katalog.ret', `Öneri ${c.params.id}`); return { ok: true }; });
A('POST', '/katalog/oneri/:id/birlestir', async (c) => { const r = await katalog.birlestir(c.params.id, c.body, c.user.id); await audit(c, 'katalog.birlestirme', `Öneri ${c.params.id} → GTIN ${r.hedef_gtin}`); return { ok: true, ...r }; });
A('GET', '/katalog/birlestirmeler', async () => ({ ok: true, rows: await katalog.birlestirmeler() }));
A('POST', '/katalog/birlestirme/:id/geri-al', async (c) => { const r = await katalog.geriAl(c.params.id, c.user.id); await audit(c, 'katalog.birlestirme', `Geri alındı: ${c.params.id} (GTIN ${r.hedef_gtin})`); return { ok: true, ...r }; });
A('POST', '/katalog/tedarikci', async (c) => { const r = await katalog.tedarikciAl(c.body.csv, { kaynak: c.body.kaynak, lisans: c.body.lisans, kaynak_url: c.body.kaynak_url, onizleme: !!c.body.onizleme }); if (!c.body.onizleme) await audit(c, 'katalog.tedarikci', `${c.body.kaynak}: ${r.gecerli} geçerli, ${r.hataliGtin} hatalı GTIN`); return { ok: true, ...r }; }, { bodyMax: 8e6 });

// ---------- Şablon kütüphanesi ----------
// Şablonlar gizli değildir ve işletme verisi içermez; demo ve yerel modda da açılır
route('GET', '/api/sablon/:program', { ...O, limit: ['sbl', 120, 60e3] }, async (c) => { if (!sablon.programVar(c.params.program)) throw err(404, 'Program bulunamadı'); return { ok: true, sablonlar: sablon.liste(c.params.program) }; });
// İçe aktarma tarayıcıda işletmenin kendi verisinde yapılır; sunucu yalnız olayı kaydeder
route('POST', '/api/sablon/olay', { ...O, bodyMax: 2048, limit: ['sblo', 60, 60e3] }, async (c) => {
  const u = db.ready() ? await auth.current(c.req).catch(() => null) : null; const b = c.body || {};
  if (!sablon.bul(String(b.sablon || ''))) throw err(400, 'Şablon bulunamadı');
  log.uygulama.bilgi('sablon.iceri_aktarildi', { istek: c.istek, kullanici: u && u.id, isletme: u && u.tenant_id, veri: { sablon: b.sablon, surum: Number(b.surum) || 0, eklenen: Number(b.eklenen) || 0, atlanan: Number(b.atlanan) || 0 } });
  return { ok: true };
});
