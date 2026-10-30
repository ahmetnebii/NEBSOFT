# Güven ve dönüşüm sayfaları

Tarih: 30.10.2026 · Dal: `claude/guven-sayfalari-ad3e11`. Vaka sayfaları ve ürün videoları kapsam dışıdır (pilot işletme yok, video çekilmedi).

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Engel | Gereken | Durum |
|---|---|---|---|
| 1 | Sitede "Kurulum ve veri aktarımı ücretsizdir" cümlesi var (`site/tools/build-sites.js`, program sayfası ve `/programlar`). Görevde "ücretli kurulum hizmeti" geçiyor. İkisi çelişiyor, `docs/IDDIA-LISTESI.md` içinde dayanağı yok | Kullanıcı kararı: ücretsiz mi, ücretli mi | Açık. `/veri-tasima/` bu yüzden "kapsam ve varsa ücret yazılı bildirilir" diyor |
| 2 | `/kvkk/` geçici kısa metinle yayında, `site/src/yasal/kvkk.md` TASLAK. Formlar bu metne bağlanıyor, metin bayi başvurusu, veri taşıma talebi ve öneri kutusunu açıkça saymıyor olabilir. Bu kayıtların saklama süresi de tanımlı değil | Avukat onayı | Açık. Yasal metin onaylı sayılmaz |
| 3 | İş ortaklığı sözleşmesi yok, komisyon takibi programda yok | Sözleşme taslağı ve elle hesap kararı | Açık. Sayfa komisyonu sözleşmeye bağlıyor, otomatik hesap vaat etmiyor |
| 4 | Komisyon oranı boş | `config/bayi.json` içinde `komisyon.yuzde` | Bilerek boş, sayfada oran görünmez |
| 5 | Ticari ileti izni formda alınıyor, İYS'ye aktarım programda yok (`docs/IDDIA-LISTESI.md` ile aynı sınır) | İYS kaydı | Açık |

## Ne yapıldı

| İş | Adres | Kaynak | Yönetim |
|---|---|---|---|
| Bayilik ve mali müşavir | `/bayilik/` | `site/tools/guven-sayfalari.js` | Panel → İş ortakları |
| Veri taşıma | `/veri-tasima/` | Aynı dosya, `AKTARIM` tablosu | Panel → Satış Talepleri (tür `veri-tasima`) |
| Sistem durumu | `/sistem-durumu/` | `/api/sistem-durumu`, `site/assets/guven.js` | Panel → Bakım kayıtları |
| Yenilikler | `/yenilikler/` | `site/src/yenilikler.json` | Dosya düzenlenir, sayfalar üretilir |
| Yol haritası ve öneri kutusu | `/yol-haritasi/` | `site/src/yol-haritasi.json` | Panel → Öneri kutusu |
| WhatsApp düğmesi | Tüm `site/` sayfaları ve pazar yeri | `server/cloud/seo.js` `rewrite` | Panel → Site Ayarları |

Sunucu: `server/cloud/vitrin.js`. Tablolar: `bayi_basvuru`, `oneriler`, `bakim_kayit`, `leads.kvkk_at` sütunu. Panel: `admin/panel-guven.js`. Ayar: `config/bayi.json`.

## Karar ve dayanaklar

- **Komisyon:** `config/bayi.json` içinde `komisyon.yuzde` boş. `_ornek` alanı yalnız biçimi gösterir, program okumaz. Sayıyı girince `/api/vitrin` verir, sayfada yeniden başlatmadan görünür.
- **Kurulum fiyatı:** `config/destek-paketleri.json` destek paketlerini tutar, kurulum hizmeti fiyatı içermez. Bu yüzden fiyatsız talep formu yapıldı. Dosyaya `"kurulumHizmeti": { "ad": "...", "fiyat": sayı }` eklenirse fiyat sayfada görünür.
- **İçe aktarma tablosu:** `apps/*/app.js` içindeki `NS.readSheet`, `NS.parseCsv` ve `apps/muhasebe/aktar.js` okunarak yazıldı. Eczane yeni satışa kapalı olduğu için tabloda yok. Dosya biçimi `core/core.js` `NS.readSheet` ile aynıdır: `.xlsx`, `.csv`, `.txt`. Test her satırı kodda arar.
- **Sistem durumu:** Veritabanına `SELECT 1` gönderilir, 3 saniyede yanıt gelmezse sonuç "Yanıt vermiyor" olur. İstek durumu `analitik.pencere` ve `alarmHesapla` ile hesaplanır. Sonuç 15 saniye önbellekte tutulur, uç IP başına dakikada 60 istek alır. Dışarı yalnız durum sözcüğü, veritabanı yanıt süresi (ms), yayımlanan bakım kayıtları ve planlı bakımdaki program adları çıkar. `/api/durum` yerel köprünün adı olduğu için kullanılmadı.
- **Yenilikler:** Her kayıt bir commit'e bağlıdır, test commit'in varlığını ve tarihini denetler. `lastmod` üreticinin içerik özetinden gelir, yalnız sayfa içeriği değişince değişir. Bu dalın kendi işi listede yok: birleştirme sonrası commit numarasıyla eklenmelidir.
- **Yol haritası:** Maddeler `docs/DEVAM-NOTU.md`, `docs/pazarlama/PAZAR-GENISLEME.md` ve süren çalışmalardan alındı. Tarih verilmez, test yıl ve "yakında" gibi vaatleri reddeder.
- **Spam:** IP başına saatte 5, uç başına saatte 60 istek, CSRF başlığı, tuzak alan, 3 saniyeden kısa gönderimin reddi, en çok 2 bağlantı, öneride aynı metin tekrarı engeli. Tuzak alan da hata döner: sessiz "alındı" yazılmaz. Süre denetimi istemcinin gönderdiği zamana dayanır, elle yazılmış bir bot bunu aşabilir; asıl sınır hız sınırıdır. Sınırlar bellektedir, çok sunuculu kurulumda nginx `limit_req` gerekir (`server/cloud/security.js`).
- **WhatsApp:** Numara `Site Ayarları`ndan okunur, boşsa düğme HTML'e hiç girmez. Numara üretilen dosyalara gömülmez, ayar en geç 1 dakikada yansır. Pazar yeri gövdeyi yeniden çizdiği için düğme geri eklenir, sağ alttaki destek düğmesinin üstünde durur.

## Denemeler

Yerel sunucu 5077, `nebsoft_guven_ad3e11` veritabanı. Ortak MariaDB durdurulmadı: veritabanı kesilmesi, önüne konan test vekili kapatılarak denendi.

| Akış | Sonuç |
|---|---|
| Veritabanı yapılandırılmamış | Uygulama: Çalışıyor. Veritabanı: Bilinmiyor. Genel: Durum bilinmiyor. Form 503 iletisini gösterir |
| Veritabanı sağlam | Ölçülen bileşenler yanıt veriyor, 1–7 ms, bakım kaydı görünür |
| Veritabanı kesildi | 15 saniyelik önbellek sonrası "Sorun ölçüldü", Veritabanı: Yanıt vermiyor, bakım kayıtları: Bilinmiyor. Vekil geri gelince düzeldi |
| Sunucu kapatıldı, sayfa açık | Üç satır da Bilinmiyor, genel: Durum bilinmiyor |
| Bayi başvurusu → panel → onay → sitede listeleme | Çalıştı. Onaysız listeleme ve izinsiz listeleme reddedilir |
| Veri taşıma talebi | Satış Talepleri ekranında görünür |
| Öneri: hızlı gönderim, tekrar, tuzak alan, 6. istek | Sırayla: "çok hızlı", "daha önce alındı", "gönderilemedi", 429 |
| Öneri sayımı | Panelde program ve yeni program istek sayısı görünür |
| WhatsApp | Boşken yok; geçersiz numara reddedilir; kaydedince tüm sayfalarda, pazar yerinde sayfa geçişinden sonra da var |
| Telefon 375 px | Beş sayfada yatay kaydırma yok, düğme satın alma çubuğuyla ve destek düğmesiyle çakışmıyor |
| Boş durum | Bakım, başvuru ve öneri yokken sayfa ve panel boş iletisini gösterir, iş ortağı bölümü ve oran satırı gizli kalır |
| Koyu tema | Beş sayfa |
| Açık tema | Sistem durumu, bayilik ve yenilikler görüntüyle bakıldı; diğer ikisi aynı CSS değişkenlerini kullanır, ayrıca bakılmadı |

Büyük veri denemesi yapılmadı: bu sayfalar liste üretmez, panel listeleri 500 kayıtla sınırlıdır. Masaüstü (Electron) ve Android kabuğunda bu sayfalar açılmadı.

## Çekirdek ihtiyacı

`core/` değiştirilmedi. `core/support.js` destek düğmesinin konumu sabit olduğu için WhatsApp düğmesi `.nsd` varlığına bakarak yer değiştiriyor.

## Bilinen küçük konular

- `applyOrder` içinde `referralDays || 30` var: panelde 0 yazılırsa ödül yine 30 gün verilir. `/api/vitrin` 0 için süre göstermez.
- Üretilmiş sayfalar hepsi değişti (alt bilgi bağlantıları). Paralel dallarla birleşince `node site/tools/build-sites.js` yeniden çalıştırılmalıdır.
