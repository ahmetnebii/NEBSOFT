// Kurulum ve ayarlar: satışa açılmadan önce yöneticiden istenen her şeyin tek yeri. Uçlar yalnız admin ve süper yöneticiye açıktır, her değişiklik denetim kaydına yazılır.
// Ayrıntılı liste: docs/ADMIN-AYAR-DENETIMI.md
// Kurallar:
//  • Değerler settings tablosundadır, kayıtta hemen geçerli olur, yeniden başlatma istemez. Kayıt yoksa config/*.json ve kod varsayılanı kullanılır.
//  • Doğrulama sunucudadır. Biçimi bozuk değer kaydedilmez.
//  • Durum üç kaynaktan gelir: ayar (panelde girilen değer), olcum (sunucunun gerçek denemesi), beyan (yöneticinin işareti). Ölçülemeyen şey "tamam" yazılmaz.
//  • Gizli değer burada tutulmaz ve yanıta konmaz: e-posta şifresi ve Shopier anahtarı kendi modüllerinde şifreli durur, burada yalnız var/yok görünür.
//  • iyzico canlı kilidini yalnız süper yönetici görür ve değiştirir. IYZICO_CANLI=1 ortam değişkeni çalışmaya devam eder.
const fs = require('fs');
const path = require('path');
const db = require('./db');
const sec = require('./security');
const mail = require('./mail');
const cat = require('./catalog');
const destek = require('./destek');
const indirim = require('./indirim');
const vitrin = require('./vitrin');
const analitik = require('./analitik');
const isletim = require('./isletim');
const seo = require('./seo');
const { A, err, site, audit, setting, setSetting, syncCatalog, telefon, eposta, siteAdresi, googleCode, waNumara } = require('./routes');

const ROOT = path.join(__dirname, '..', '..');
const SIRKET_TUR = ['Şahıs', 'Limited', 'Anonim', 'Diğer'];
const YASAL = [
  { ad: 'kvkk', baslik: 'KVKK Aydınlatma Metni', yol: '/kvkk/' }, { ad: 'gizlilik', baslik: 'Gizlilik Politikası', yol: '/gizlilik/' }, { ad: 'mesafeli-satis', baslik: 'Mesafeli Satış Sözleşmesi', yol: '/mesafeli-satis/' }, { ad: 'iade', baslik: 'İptal ve İade Koşulları', yol: '/iade/' }, { ad: 'cerez', baslik: 'Çerez Politikası', yol: '/cerez/' },
  { ad: 'kullanim-kosullari', baslik: 'Kullanım Koşulları', yol: null }, { ad: 'veri-isleme-sozlesmesi', baslik: 'Veri İşleme Sözleşmesi', yol: null }, { ad: 'acik-riza', baslik: 'Açık Rıza Örnekleri', yol: null },
];
// Dış işler: yazılımın ölçemediği, yöneticinin yapıp işaretlediği adımlar. Kaynak: docs/ADMIN-AYAR-DENETIMI.md
const ISLER = [
  ['fiyat-onay', 'fiyat', 'Program fiyatları gözden geçirildi', 'market/catalog.js fiyatları başlangıç değeridir. Ürünler & Fiyatlar ekranında gerçek fiyatları kontrol edin.'],
  ['sitemap', 'arama', 'Site haritası Search Console\'a eklendi', 'Search Console > Site haritaları ekranına /sitemap.xml adresini bir kez ekleyin. Sunucu bunu ölçemez.'],
  ['sc-mulk', 'arama', 'Search Console sahiplik doğrulaması tamam', 'Doğrulama kodu sitede yayında olduktan sonra Search Console\'da Doğrula düğmesine basın.'],
  ['yedek', 'sunucu', 'Gece yedeği kuruldu', 'Veritabanı ve dosya klasörü için DEPLOY.md §9. Sunucu kendi yedeğini ölçemez.'],
  ['geri-yukleme', 'sunucu', 'Yedekten geri yükleme bir kez denendi', 'Boş bir veritabanına yükleyip bir kaydı açın.'],
  ['anahtar-yedek', 'sunucu', 'NEBSOFT_SECRET ayrı bir yere yedeklendi', 'Anahtar kaybolursa şifreli veri geri gelmez. Veritabanı yedeğiyle aynı yere koymayın.'],
  ['uygulama', 'sunucu', 'Masaüstü ve Android paketleri yeni adresle derlendi', 'HTTPS geldikten sonra sunucu.json güncellenip paketler yeniden derlenir. Adres pakete derleme anında gömüldüğü için panelden değişmez.'],
  ['avukat', 'dis', 'Avukat yasal metinleri ve YASAL-INCELEME sorularını inceledi', 'docs/YASAL-INCELEME.md §7 ve docs/pazarlama/KENDI-KENDINI-PAZARLAMA.md §4.6 soruları. Danışan programı bu onaya kadar satışa kapalı.'],
  ['musavir', 'dis', 'Mali müşavir KDV oranı ve fatura düzenini onayladı', 'NEBSOFT\'un kendi faturaları ve programlardaki KDV varsayılanı için.'],
  ['efatura-kendi', 'dis', 'NEBSOFT kendi e-Belge sağlayıcısını seçti', 'Müşteriye kesilecek faturalar için. Ödeme e-postalarında "fatura iletilecek" yazıyor.'],
  ['marka', 'dis', 'Marka tescil başvurusu yapıldı', 'NEBSOFT adı için Türk Patent. Başvuruyu siz yaparsınız.'],
  ['verbis', 'dis', 'VERBİS durumu netleşti', 'Kayıt yükümlülüğü veya istisna kararı.'],
  ['etbis', 'dis', 'ETBİS kaydı yapıldı', 'Elektronik ticaret bilgi sistemi.'],
  ['iys', 'dis', 'İYS kaydı yapıldı', 'Tanıtım iletisi için gerekir. Beyan Deneme takibi ekranında ayrıca işaretlenir.'],
  ['test-iyzico', 'dis', 'iyzico test hesabıyla ödeme, iade ve iptal denendi', 'docs/urun/ETICARET-ODEME.md listesi. Canlı kilit bu denemeden önce açılmamalı.'],
  ['test-shopier', 'dis', 'Shopier gerçek hesapla denendi', 'Kartla Ödeme ekranındaki deneme müşterisiyle düşük tutarlı ödeme.'],
  ['test-pazaryeri', 'dis', 'Trendyol stage ve n11 test hesabı denendi', 'Dokümanla uyum canlı test yerine geçmez.'],
  ['test-efatura', 'dis', 'e-Fatura test hesabı denendi', 'En az bir entegratörün test ortamı.'],
  ['test-sms', 'dis', 'SMS sağlayıcı test hesabı denendi', 'Netgsm veya başka bir sağlayıcı ile bir bilgilendirme iletisi.'],
  ['hesaplar', 'dis', 'Sosyal medya ve işletme hesapları açıldı', 'Instagram, Facebook, YouTube, Google İşletme Profili. Hesaplar sizin adınıza açılır, şifre paylaşılmaz.'],
  ['pilot', 'dis', 'Pilot işletmeler belirlendi', '3 ile 5 işletme. Geri bildirim sonraki dalgaya girer.'],
];
const IS_ID = new Set(ISLER.map((x) => x[0]));
const VAR = (ad) => !!process.env[ad];
const metin = (v, n) => sec.clean(v, n);
const tamSayi = (v, alt, ust, ad) => { const n = Number(v); if (!Number.isInteger(n) || n < alt || n > ust) throw err(400, `${ad} ${alt} ile ${ust} arasında tam sayı olmalı`); return n; };

// ---------- Okuma ----------
async function sirketOku() { const k = await setting('sirket', {}); const pz = await setting('pazarlama', {}); return { ...k, unvan: k.unvan || pz.unvan || '', mersis: k.mersis || pz.mersis || '' }; }

// ---------- Ölçüm: alan adı, HTTPS, yönlendirme. fetch testte değiştirilir ----------
const dis = { fetch: (...a) => fetch(...a), publicUrl: sec.publicUrl };
let olcumAra = { at: 0, url: '', v: null };
async function olc(siteUrl, zorla) {
  if (!zorla && olcumAra.v && olcumAra.url === siteUrl && Date.now() - olcumAra.at < 300e3) return olcumAra.v;
  const v = { at: new Date().toISOString(), dns: null, https: null, yonlendirme: null, not: '' };
  if (!siteUrl) { v.not = 'Site adresi girilmedi, ölçülemedi.'; return v; }
  const u = new URL(siteUrl); v.dns = !!(await dis.publicUrl(siteUrl).catch(() => false));
  if (!v.dns) { v.not = 'Alan adı DNS\'te bulunamadı veya dış adrese çözülmüyor.'; olcumAra = { at: Date.now(), url: siteUrl, v }; return v; }
  try {
    const r = await dis.fetch(`https://${u.host}/robots.txt`, { redirect: 'manual', signal: AbortSignal.timeout(6000) }); const x = r.status === 200 ? (await r.text()).slice(0, 2000) : '';
    v.https = /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(x) && x.includes('/sitemap.xml'); if (!v.https) v.not = `HTTPS yanıt verdi (HTTP ${r.status}) ama bu sunucuya bağlı görünmüyor.`;
  } catch (e) { v.https = false; v.not = 'HTTPS ile bağlanılamadı: sertifika veya DNS eksik olabilir.'; }
  try { const r = await dis.fetch(`http://${u.host}/robots.txt`, { redirect: 'manual', signal: AbortSignal.timeout(6000) }); v.yonlendirme = r.status >= 300 && r.status < 400 && /^https:/i.test(String(r.headers.get('location') || '')); } catch (e) { v.yonlendirme = false; }
  olcumAra = { at: Date.now(), url: siteUrl, v }; return v;
}
const sunucuJson = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'sunucu.json'), 'utf8')).adresler || []; } catch (e) { return []; } };
// Yayın dosyası hâlâ örnek mi: panelde kayıt varsa dosyanın önüne geçer
const satir = (ad, durum, kaynak, not = '', git = '') => ({ ad, durum, kaynak, not, git });
const dolu = (ad, v, not = '') => satir(ad, v ? 'tamam' : 'eksik', 'ayar', v ? String(v) : not);
const bool = (ad, v, not, kaynak = 'olcum', git = '') => satir(ad, v === null ? 'olculemedi' : v ? 'tamam' : 'eksik', kaynak, not, git);

async function durum(c, zorla) {
  const s = await site(); const k = await sirketOku(); const is = await setting('kurulum_is', {}); const olcum = await olc(String(s.siteUrl || ''), zorla);
  const mc = await mail.settings(); const mailHazir = await mail.ready(); const sonMail = await db.one("SELECT MAX(at) AS at FROM mail_log WHERE status<>'hata'").catch(() => null);
  const yon = await db.q("SELECT u.id, COALESCE(t.enabled, 0) AS totp FROM users u LEFT JOIN user_totp t ON t.user_id=u.id WHERE u.role IN ('admin','superadmin') AND u.status='active'").catch(() => []);
  const banka = await db.one('SELECT COUNT(*) AS n FROM bank_accounts WHERE active=1').catch(() => ({ n: 0 })); const sh = await setting('shopier', {}); const inx = await setting('indexnow_son', null);
  const kAyar = await setting('fiyat_indirim', null); const dAyar = await setting('fiyat_destek', null); const adres = sunucuJson(); const an = await analitik.acik().catch(() => false);
  const yasal = []; for (const y of YASAL) { const r = await setting(`yasal:${y.ad}`, null); yasal.push({ ...y, onay: !!(r && r.onay), at: r && r.at, by: r && r.by, kayitli: !!(r && r.metin) }); }
  const isSatir = (grup) => ISLER.filter((x) => x[1] === grup).map(([id, , ad, not]) => ({ ...satir(ad, is[id] && is[id].tamam ? 'tamam' : 'eksik', 'beyan', not), id, at: is[id] && is[id].at, by: is[id] && is[id].by, notu: (is[id] && is[id].not) || '' }));
  const http = /^http:/i.test(String(s.siteUrl || ''));
  const gruplar = [
    { id: 'kimlik', baslik: 'Şirket kimliği', satirlar: [dolu('Ticaret unvanı', k.unvan), dolu('Şirket türü', k.tur), dolu('MERSİS numarası', k.mersis, 'Şahıs işletmesinde yoksa vergi numarası yeterlidir'), dolu('Vergi dairesi', k.vergiDairesi), dolu('Vergi numarası', k.vergiNo), dolu('Ticaret sicil numarası', k.ticaretSicil), dolu('Adres', s.address), dolu('KEP adresi', k.kep), dolu('KVKK e-postası', k.kvkkEposta), dolu('Hukuk ve içerik e-postası', k.hukukEposta)] },
    { id: 'iletisim', baslik: 'İletişim', satirlar: [dolu('Telefon', s.phone, 'Girilene kadar sitede telefon görünmez'), dolu('E-posta', s.email, 'Girilene kadar sitede e-posta görünmez'), dolu('Destek saatleri', k.destekSaat), dolu('Destek kanalları', k.destekKanal), dolu('WhatsApp', s.whatsapp, 'Boşsa düğme görünmez')] },
    { id: 'alan', baslik: 'Alan adı ve site adresi', satirlar: [dolu('Site adresi', s.siteUrl), bool('Alan adı dış adrese çözülüyor', olcum.dns, olcum.not), bool('HTTPS aktif ve bu sunucuya bağlı', olcum.https, olcum.not), bool('HTTP adresi HTTPS\'e yönleniyor', olcum.yonlendirme, ''), bool('Site adresi https ile başlıyor', s.siteUrl ? !http : null, http ? 'Şu an http adresi kayıtlı' : ''), bool('Uygulamaların ilk adresi https', adres.length ? /^https:/i.test(adres[0]) : null, adres[0] || 'sunucu.json okunamadı')] },
    { id: 'arama', baslik: 'Search Console ve arama motorları', satirlar: [dolu('Google doğrulama kodu', s.googleVerify), bool('Doğrulama etiketi sayfalarda', s.googleVerify ? /<meta name="google-site-verification"/.test(await seo.rewrite('<head></head>', { headers: {}, socket: {}, url: '/' })) : false, 'Sayfa üretilerek denendi'), ...isSatir('arama'), satir('IndexNow bildirimi', inx ? 'tamam' : 'eksik', 'olcum', inx ? `${inx.n} adres · ${new Date(inx.at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}` : 'Site adresinden sonra Site Ayarları\'ndaki düğmeyle gönderilir', 'ayarlar')] },
    { id: 'analitik', baslik: 'Analitik', satirlar: [bool('Ziyaret analitiği açık', !!an, 'Birinci taraf, çerezsiz. Süper yönetici Hata & Yavaşlık ekranından değiştirir.', 'ayar', 'sistem')] },
    { id: 'eposta', baslik: 'E-posta altyapısı', satirlar: [bool('SMTP ayarlı', !!mailHazir, mc.user || 'Ayarlanmadı', 'ayar', 'eposta'), bool('Başarılı gönderim kaydı var', !!(sonMail && sonMail.at), sonMail && sonMail.at ? new Date(sonMail.at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : 'Test e-postası gönderin', 'olcum', 'eposta'), bool('Tüm yöneticilerde iki adımlı giriş açık', yon.length ? yon.every((x) => Number(x.totp)) : null, `${yon.filter((x) => Number(x.totp)).length} / ${yon.length}`, 'olcum', 'yoneticiler')] },
    { id: 'fiyat', baslik: 'Fiyat, indirim ve destek', satirlar: [...isSatir('fiyat'), satir('Toplu indirim kademeleri', kAyar ? 'tamam' : 'eksik', 'ayar', kAyar ? 'Panelde kaydedildi' : 'Dosyadaki örnek değerler kullanılıyor'), satir('Destek paketleri', dAyar ? 'tamam' : 'eksik', 'ayar', dAyar ? 'Panelde kaydedildi' : 'Dosyadaki örnek değerler kullanılıyor'), satir('Bayi komisyonu', vitrin.komisyon() ? 'tamam' : 'eksik', 'ayar', vitrin.komisyon() ? `%${vitrin.komisyon().yuzde}` : 'Boş kaldıkça sitede oran görünmez')] },
    { id: 'yasal', baslik: 'Yasal metin onayı', satirlar: yasal.map((y) => ({ ...satir(y.baslik, y.onay ? 'tamam' : 'eksik', 'beyan', y.onay ? `Onaylayan: ${y.by || '-'}` : y.yol ? 'Sitede kısa örnek metin yayında' : 'Sitede sayfası yok, kayıt için tutulur'), yasal: y.ad })) },
    { id: 'odeme', baslik: 'Ödeme', satirlar: [bool('Aktif banka hesabı', Number(banka.n) > 0, `${banka.n} hesap. Yoksa sipariş alınmaz.`, 'olcum', 'bankalar'), bool('Shopier gerçek hesapla denendi', !!sh.verifiedAt, sh.verifiedAt ? 'Müşterilere açık' : 'Kartla ödeme müşterilere kapalı', 'beyan', 'shopier'), bool('iyzico test denemesi', !!(is['test-iyzico'] && is['test-iyzico'].tamam), 'İşletme vitrinleri için. Yapılacaklar listesinden işaretlenir.', 'beyan')] },
    { id: 'sunucu', baslik: 'Sunucu', satirlar: [bool('Veritabanı bağlı', db.ready(), (db.info() || {}).version || ''), bool('NEBSOFT_SECRET ortamdan veriliyor', VAR('NEBSOFT_SECRET'), VAR('NEBSOFT_SECRET') ? '' : 'Anahtar data/secret.key dosyasında. Sunucu ortamına taşıyın.'), bool('NODE_ENV=production', process.env.NODE_ENV === 'production', ''), bool('TRUST_PROXY=1 (nginx arkasında)', process.env.TRUST_PROXY === '1', 'Proxy yoksa kapalı kalmalı'), ...isSatir('sunucu')] },
    { id: 'dis', baslik: 'Dış işler', satirlar: isSatir('dis') },
  ];
  const hepsi = gruplar.flatMap((g) => g.satirlar); const say = (d) => hepsi.filter((x) => x.durum === d).length;
  const out = {
    ok: true, ozet: { toplam: hepsi.length, tamam: say('tamam'), eksik: say('eksik'), olculemedi: say('olculemedi') }, gruplar, olcum,
    site: { siteName: s.siteName, siteUrl: s.siteUrl, phone: s.phone, email: s.email, address: s.address, whatsapp: s.whatsapp, googleVerify: s.googleVerify, trialDays: s.trialDays, referralDays: s.referralDays },
    sirket: k, sirketTur: SIRKET_TUR, isletim: { dosyaKotaMb: isletim.kotaMb(), odemeDk: Math.round(isletim.odemeMs() / 60e3), ortamKota: VAR('NEBSOFT_DOSYA_KOTA_MB'), ortamOdeme: VAR('ETICARET_ODEME_TTL_MS') },
    indirim: indirim.load(), destek: destek.load(), bayi: vitrin.bayiAyar().komisyon || { yuzde: null, aciklama: '' }, panelde: { indirim: !!kAyar, destek: !!dAyar, bayi: !!(await setting('bayi_komisyon', null)) },
  };
  if (c.user.role === 'superadmin') { const K = await setting('canli_kilit', {}); out.iyzico = { acik: isletim.iyzicoCanli(), panel: isletim.iyzicoPanel(), ortam: isletim.iyzicoOrtam(), kayit: K.iyzico || null }; }
  return out;
}
A('GET', '/kurulum', (c) => durum(c, false));
A('POST', '/kurulum/olc', (c) => durum(c, true), { limit: ['kurolc', 30, 3600e3] });

// ---------- Kayıt ----------
const kaydet = async (c, ne, ayrinti) => { seo.tazele(); await syncCatalog(true); await audit(c, `Kurulum: ${ne}`, ayrinti); return { ok: true }; };
A('PUT', '/kurulum/sirket', async (c) => {
  const b = c.body || {}; const v = { unvan: metin(b.unvan, 200), tur: SIRKET_TUR.includes(b.tur) ? b.tur : '', vergiDairesi: metin(b.vergiDairesi, 100), vergiNo: String(b.vergiNo || '').replace(/\s/g, ''), mersis: String(b.mersis || '').replace(/\s/g, ''), ticaretSicil: metin(b.ticaretSicil, 40), kep: eposta(b.kep), kvkkEposta: eposta(b.kvkkEposta), hukukEposta: eposta(b.hukukEposta) };
  if (v.mersis && !/^\d{16}$/.test(v.mersis)) throw err(400, 'MERSİS numarası 16 haneli olmalı');
  if (v.vergiNo && !/^\d{10,11}$/.test(v.vergiNo)) throw err(400, 'Vergi numarası 10, T.C. kimlik numarası 11 haneli olmalı');
  const eski = await setting('sirket', {}); await setSetting('sirket', { ...eski, ...v });
  const s = await setting('site', {}); await setSetting('site', { ...s, address: metin(b.address, 300) });
  const pz = await setting('pazarlama', {}); await setSetting('pazarlama', { ...pz, unvan: v.unvan, mersis: v.mersis }); // tanıtım e-postası alt bilgisi aynı değeri kullanır
  return kaydet(c, 'şirket kimliği', v.unvan);
});
A('PUT', '/kurulum/iletisim', async (c) => {
  const b = c.body || {}; const v = { phone: telefon(b.phone), email: eposta(b.email), whatsapp: waNumara(b.whatsapp) };
  const s = await setting('site', {}); await setSetting('site', { ...s, ...v, onay: { phone: v.phone, email: v.email } }); // buraya yazılan değer yöneticinin kendi değeridir, örnek değerle aynı olsa da gerçek sayılır
  const k = await setting('sirket', {}); await setSetting('sirket', { ...k, destekSaat: metin(b.destekSaat, 120), destekKanal: metin(b.destekKanal, 120) });
  return kaydet(c, 'iletişim', `${v.phone} · ${v.email}`);
});
A('PUT', '/kurulum/site', async (c) => {
  const b = c.body || {}; const s = await setting('site', {}); const v = { siteUrl: siteAdresi(b.siteUrl), googleVerify: googleCode(b.googleVerify) };
  await setSetting('site', { ...s, ...v }); olcumAra = { at: 0, url: '', v: null }; return kaydet(c, 'site adresi', v.siteUrl);
});
A('PUT', '/kurulum/satis', async (c) => {
  const b = c.body || {}; const s = await setting('site', {}); const trialDays = tamSayi(b.trialDays, 1, 60, 'Deneme süresi'); const referralDays = tamSayi(b.referralDays, 0, 365, 'Tavsiye ödülü');
  const i = await setting('isletim', {}); const yeni = { ...i, odemeDk: tamSayi(b.odemeDk, 5, 1440, 'Ödeme bekleme süresi'), dosyaKotaMb: tamSayi(b.dosyaKotaMb, 100, 102400, 'Fotoğraf alanı') };
  await setSetting('site', { ...s, trialDays, referralDays }); await setSetting('isletim', yeni);
  return kaydet(c, 'satış kuralları', `deneme ${trialDays} gün, tavsiye ${referralDays} gün, ödeme ${yeni.odemeDk} dk, alan ${yeni.dosyaKotaMb} MB`);
});
const kademeler = (x) => (Array.isArray(x) ? x : []).filter((t) => t && (t.min !== '' && t.min !== null && t.min !== undefined)).map((t) => ({ min: Number(t.min), yuzde: Number(t.yuzde) })).sort((a, b) => a.min - b.min);
A('PUT', '/kurulum/indirim', async (c) => {
  const b = c.body || {}; const taban = indirim.dosya(); const v = { programSayisi: kademeler(b.programSayisi), subeSayisi: kademeler(b.subeSayisi), lisansSayisi: kademeler(b.lisansSayisi), kurumsal: { ...taban.kurumsal, formEsigi: tamSayi(b.formEsigi, 1, 100000, 'Kurumsal form eşiği') } };
  try { indirim.check(v); } catch (e) { throw err(400, 'İndirim kademesi geçersiz: en az 1 adet, yüzde 1 ile 99 arası olmalı'); }
  await setSetting('fiyat_indirim', v); return kaydet(c, 'toplu indirim', JSON.stringify(v).slice(0, 300));
});
A('DELETE', '/kurulum/indirim', async (c) => { await db.q("DELETE FROM settings WHERE k='fiyat_indirim'"); indirim.panelAta(null); return kaydet(c, 'toplu indirim varsayılana döndü', ''); });
A('PUT', '/kurulum/destek', async (c) => {
  const b = c.body || {}; const taban = destek.dosya(); const v = { ...taban, takvimler: {}, paketler: {} };
  for (const [id, t] of Object.entries(taban.takvimler)) { const n = (b.takvimler || {})[id] || t; v.takvimler[id] = { gunler: (Array.isArray(n.gunler) ? n.gunler : []).map(Number).filter((x) => Number.isInteger(x) && x >= 0 && x <= 6), bas: Number(n.bas), bit: Number(n.bit) }; }
  for (const [id, p] of Object.entries(taban.paketler)) { const n = (b.paketler || {})[id] || p; v.paketler[id] = { ...p, aylik: Number(n.aylik), ilkYanitSaat: Number(n.ilkYanitSaat), cozumSaat: Number(n.cozumSaat), takvim: String(n.takvim || p.takvim) }; }
  const ks = b.kurulumHizmeti || {}; const fiyat = Number(ks.fiyat); if (ks.fiyat !== undefined && ks.fiyat !== '' && !(fiyat >= 0)) throw err(400, 'Kurulum hizmeti fiyatı geçersiz');
  if (fiyat > 0) v.kurulumHizmeti = { ad: metin(ks.ad, 80) || 'Kurulum hizmeti', fiyat }; else delete v.kurulumHizmeti;
  try { destek.check(v); } catch (e) { throw err(400, 'Destek paketi geçersiz: süre sıfırdan büyük, çözüm süresi ilk yanıttan uzun, fiyat eksi olmamalı, takvimde en az bir gün ve başlangıç bitişten önce olmalı'); }
  if (Object.values(v.takvimler).some((t) => t.bas < 0 || t.bit > 24)) throw err(400, 'Takvim saatleri 0 ile 24 arasında olmalı');
  await setSetting('fiyat_destek', v); return kaydet(c, 'destek paketleri', JSON.stringify(v.paketler).slice(0, 300));
});
A('DELETE', '/kurulum/destek', async (c) => { await db.q("DELETE FROM settings WHERE k='fiyat_destek'"); destek.panelAta(null); return kaydet(c, 'destek paketleri varsayılana döndü', ''); });
A('PUT', '/kurulum/bayi', async (c) => {
  const b = c.body || {}; const bos = b.yuzde === '' || b.yuzde === null || b.yuzde === undefined; const y = Number(b.yuzde); if (!bos && !(y > 0 && y <= 100)) throw err(400, 'Komisyon yüzdesi 0 ile 100 arasında olmalı');
  await setSetting('bayi_komisyon', { komisyon: { yuzde: bos ? null : y, aciklama: metin(b.aciklama, 200) } }); return kaydet(c, 'bayi komisyonu', bos ? 'boş' : `%${y}`);
});
A('POST', '/kurulum/is/:id', async (c) => {
  if (!IS_ID.has(c.params.id)) throw err(404, 'Yapılacak iş bulunamadı');
  const is = await setting('kurulum_is', {}); const tamam = c.body.tamam === true; is[c.params.id] = { tamam, at: new Date().toISOString(), by: c.user.email || c.user.id, not: metin(c.body.not, 300) };
  await setSetting('kurulum_is', is); return kaydet(c, `iş ${tamam ? 'tamamlandı' : 'geri alındı'}`, c.params.id);
});

// ---------- Yasal metin ----------
const yasalBul = (ad) => { const y = YASAL.find((x) => x.ad === ad); if (!y) throw err(404, 'Metin bulunamadı'); return y; };
const sablon = (ad) => { try { return fs.readFileSync(path.join(ROOT, 'site', 'src', 'yasal', `${ad}.md`), 'utf8').replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n+/, ''); } catch (e) { return ''; } };
// Panelde bilinen değerler yer tutucuya yazılır, kalanı yönetici metinde doldurur
function doldur(m, s, k) {
  const v = { 'TİCARET UNVANI': k.unvan, 'MERSİS NO': k.mersis, ADRES: s.address, 'KEP ADRESİ': k.kep, 'KVKK E-POSTA': k.kvkkEposta, 'HUKUK E-POSTA': k.hukukEposta, 'E-POSTA': s.email, TELEFON: s.phone, 'SİTE ADRESİ': s.siteUrl, 'VERGİ DAİRESİ VE NO': [k.vergiDairesi, k.vergiNo].filter(Boolean).join(' '), 'DESTEK SAATLERİ': k.destekSaat, 'DESTEK KANALLARI': k.destekKanal };
  return String(m).replace(/\[([^\]\n]{2,90})\](?!\()/g, (t, a) => v[a] || t);
}
const kalanlar = (m) => [...new Set([...String(m).matchAll(/\[([^\]\n]{2,90})\](?!\()/g)].map((x) => x[1]))];
A('GET', '/kurulum/yasal/:ad', async (c) => {
  const y = yasalBul(c.params.ad); const r = await setting(`yasal:${y.ad}`, null); const s = await site(); const k = await sirketOku(); const m = doldur((r && r.metin) || sablon(y.ad), s, k);
  return { ok: true, ...y, metin: m, onay: !!(r && r.onay), at: r && r.at, by: r && r.by, kalan: kalanlar(m), taslak: /\*\*TASLAK/.test(m) };
});
A('PUT', '/kurulum/yasal/:ad', async (c) => {
  const y = yasalBul(c.params.ad); const b = c.body || {}; const onay = b.onay === true; const s = await site(); const k = await sirketOku(); const m = doldur(String(b.metin || '').replace(/\r\n/g, '\n').trim(), s, k);
  if (!m) throw err(400, 'Metin boş olamaz'); if (Buffer.byteLength(JSON.stringify(m)) > 60000) throw err(400, 'Metin çok uzun (en çok 60 KB)');
  if (onay) { if (/\*\*TASLAK/.test(m)) throw err(400, 'Metnin başındaki TASLAK notunu silmeden onaylanamaz'); const kalan = kalanlar(m); if (kalan.length) throw err(400, `Doldurulmamış alanlar var: ${kalan.slice(0, 8).join(', ')}${kalan.length > 8 ? ` ve ${kalan.length - 8} alan daha` : ''}`); }
  await setSetting(`yasal:${y.ad}`, { metin: m, onay, at: new Date().toISOString(), by: c.user.email || c.user.id }); return kaydet(c, `yasal metin ${onay ? 'onaylandı' : 'taslak kaydedildi'}`, y.ad);
}, { bodyMax: 200e3 });

// ---------- iyzico canlı kilidi: yalnız süper yönetici ----------
A('PUT', '/kurulum/iyzico', async (c) => {
  if (c.user.role !== 'superadmin') throw err(403, 'Bu ayarı yalnız süper yönetici değiştirebilir');
  const acik = c.body.acik === true; if (acik && c.body.testOnay !== true) throw err(400, 'Önce test hesabıyla ödeme denemesinin yapıldığını onaylayın');
  const K = await setting('canli_kilit', {}); await setSetting('canli_kilit', { ...K, iyzico: { acik, testOnay: acik, at: new Date().toISOString(), by: c.user.email || c.user.id } });
  return kaydet(c, acik ? 'iyzico canlı mod açıldı' : 'iyzico canlı mod kapatıldı', acik ? 'test denemesi yöneticinin beyanıyla onaylandı' : '');
});

module.exports = { olc, dis, doldur, kalanlar, YASAL, ISLER, cat };
