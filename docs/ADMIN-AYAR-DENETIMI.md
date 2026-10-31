# Admin ayar denetimi

Tarih: 31.10.2026. Dal: `claude/saha-hizmet-f6a8f4`. Kural: kurulum sonrası kullanıcıdan istenen her şey panelden yapılır, dosya veya ortam değişkeni düzenletilmez.

Panel: `/admin/#/kurulum` (`admin/panel-kurulum.js`). Sunucu: `server/cloud/kurulum.js`, `server/cloud/isletim.js`. Test: `server/test/kurulum.test.js`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Bu çalışma panel ekledi, aşağıdakileri kapatmadı. Hepsi Kurulum ekranında "Eksik" görünür.

- Gerçek şirket bilgileri girilmedi. Hiçbir değer uydurulmadı, alanlar boş başlar.
- Yasal metinler avukat onaylı değil. Sitede kısa örnek metin yayında, `noindex`.
- `www.nebsoftapp.com` HTTPS kurulumu yok. Ölçüm gerçek adreste hiç çalıştırılmadı.
- `config/` fiyatları ve `market/catalog.js` fiyatları örnek değerdir. Panelde kaydedilene kadar "Eksik" sayılır.
- Hiçbir ödeme veya entegrasyon sağlayıcısı gerçek test hesabıyla denenmedi.

## Kaynak listesi

Okunanlar: `docs/DEVAM-NOTU.md`, `docs/YASAL-INCELEME.md` §5.3 ve §8, `docs/IDDIA-LISTESI.md`, `DEPLOY.md`, `docs/SEO-KURALLARI.md`, `docs/urun/ETICARET-ODEME.md`, `docs/urun/CEKIRDEK-ISTEKLERI-*.md`, `docs/urun/*.md` (grep). Birleşmemiş dallar: `claude/tam-denetim-be0ad8` (`docs/SEO-DENETIM.md`), `claude/sistem-arastirma-09634e` (`docs/pazarlama/KENDI-KENDINI-PAZARLAMA.md`), `claude/siparis-teslim-eea7dd`, `claude/saha-hizmet-743e04`, `claude/rezervasyon-aile-c6d113`, `claude/ticaret-tasima-0f4440`, `claude/uyelik-egitim-saglik-4305e7` (`docs/test/*.md`), `claude/belge-veri-7508d5`, `claude/ticaret-hesap-0b85c8`. Kod taraması: tüm `process.env.*`, `config/*.json`, `site/src/site.config.js`, `sunucu.json`, sabit telefon ve e-posta, fiyatlar, yer tutucular.

Durum kaynağı: **Ayar** panelde girilen değer, **Ölçüm** sunucunun gerçek denemesi, **Beyan** yöneticinin işareti. Ölçülemeyen şey "Tamam" yazılmaz.

## Tablo

### Şirket kimliği ve iletişim

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| Ticaret unvanı | `settings.sirket`, `settings.pazarlama` | admin | var | Tek giriş Kurulum. Tanıtım e-postası aynı değeri okur |
| Şirket türü | `settings.sirket` | admin | var | Yeni alan |
| MERSİS | `settings.sirket`, `settings.pazarlama` | admin | var | 16 hane sunucuda denetlenir |
| Vergi dairesi, vergi no | `settings.sirket` | admin | var | 10 veya 11 hane denetlenir |
| Ticaret sicil no | `settings.sirket` | admin | var | Yeni alan |
| Açık adres | `settings.site.address` | admin | var | Site Ayarları'ndan Kurulum'a taşındı |
| KEP, KVKK e-postası, hukuk e-postası | `settings.sirket` | admin | var | Biçim e-posta olarak denetlenir. KEP alan adı kuralı resmî kaynaktan okunmadı, denetlenmedi |
| Telefon | `settings.site.phone` + `onay` | admin | var | Örnek değer gerçek sayılmaz, sitede ve e-postada görünmez |
| E-posta | `settings.site.email` + `onay` | admin | var | Aynı kural |
| Destek saatleri, kanalları | `settings.sirket` | admin | var | Yeni alan. Alt bilgiye ve yasal metne yazılır |
| WhatsApp | `settings.site.whatsapp` | admin | var | Boşsa düğme yok |
| Marka adı | `settings.site.siteName` | admin | var | Site Ayarları'nda kaldı |
| VERBİS, ETBİS, İYS | Beyan `settings.kurulum_is`; İYS ayrıca `settings.pazarlama.iys` | admin | var | Dış iş listesi |
| Çalışan sayısı, bilanço (VERBİS istisnası) | Avukat görüşmesi | kullanıcı | yok | Ayar değil, VERBİS işinin notu |

### Alan adı, site, arama

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| Site adresi | `settings.site.siteUrl`; varsayılan `site/src/site.config.js` | admin | var | Kanonik adres, site haritası ve e-posta bağlantıları bu değeri kullanır, yeniden derleme gerekmez |
| Alan adı DNS | Alan adı sağlayıcısı | kullanıcı | kısmen | Panelde yönerge ve ölçüm. DNS panelden yapılamaz |
| HTTPS, sertifika | nginx, certbot | kullanıcı | kısmen | Panelde yönerge ve gerçek ölçüm (`robots.txt`, sertifika doğrulaması) |
| HTTP'den HTTPS'e yönlendirme | nginx | kullanıcı | kısmen | Gerçek ölçüm |
| Google doğrulama kodu | `settings.site.googleVerify` | admin | var | Sayfa üretilerek ölçülür |
| Search Console sahiplik, site haritası gönderimi | Google | kullanıcı | kısmen | Sunucu ölçemez, beyan |
| IndexNow | `settings.indexnow_son` | admin | var | Son bildirim ölçülür |
| Analitik | `settings` analitik ayarı | superadmin | var | Mevcut ekran, Kurulum'da durum |
| Saklama süreleri, alarm eşikleri | analitik ayarı | superadmin | var | Mevcut ekran |
| Hedef kitle, reklam, video kararları | Kullanıcı | kullanıcı | yok | Ürün ayarı değil. Hesap açma dış işlerde |
| Eş anlamlı paket başlıkları (`SEO-DENETIM`) | `site/src` | geliştirici | yok | Metin kararı, kod oturumu yapar |

### E-posta

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| SMTP, uygulama şifresi | `settings.mail`, şifre `cfg.encrypt` | admin | var | Mevcut ekran. Şifre tarayıcıya dönmez |
| Başarılı gönderim | `mail_log` | sistem | var | Ölçüm |
| Yönetici iki adımlı giriş | `user_totp` | her yönetici | var | Ölçüm, Yöneticiler ekranı |

### Fiyat, indirim, destek

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| Program ve Hepsi Bir Arada fiyatı | `settings.catalog`; varsayılan `market/catalog.js` | admin | var | Mevcut Ürünler & Fiyatlar. Kurulum'da beyan satırı |
| Eklenti fiyatları | `market/catalog.js` `addons` | geliştirici | **yok** | Kaldı, aşağıda |
| Plan adları, kullanıcı limitleri | `market/catalog.js` `plans` | geliştirici | **yok** | Kaldı, aşağıda |
| KDV oranı | `server/cloud/catalog.js` `VAT` | geliştirici | **yok** | Kaldı. Mali müşavir onayıyla karar |
| Yıllıkta 10 ay kuralı | `catalog.js`, `destek.js` | geliştirici | **yok** | Kaldı. Hesap kuralı |
| Toplu indirim kademeleri | `settings.fiyat_indirim`; varsayılan `config/toplu-indirim.json` | admin | var | Sunucuda `indirim.check`. Dosyaya dönüş düğmesi var |
| Kurumsal form eşiği | `settings.fiyat_indirim` | admin | var | |
| Kurumsal talep türleri | `config/toplu-indirim.json` | geliştirici | **yok** | Kaldı. Metin listesi |
| Destek paketi tutar ve süreleri | `settings.fiyat_destek`; varsayılan `config/destek-paketleri.json` | admin | var | Sunucuda `destek.check` |
| Destek takvimleri | `settings.fiyat_destek` | admin | var | |
| Kurulum hizmeti fiyatı | `settings.fiyat_destek` | admin | var | Boşsa görünmez |
| Bayi komisyonu | `settings.bayi_komisyon`; varsayılan `config/bayi.json` | admin | var | Boşsa görünmez |
| Deneme süresi | `settings.site.trialDays` | admin | var | Sayfadaki "N gün ücretsiz" sunucuda değişir |
| Tavsiye ödülü | `settings.site.referralDays` | admin | var | |
| Kupon | `coupons` | admin | var | Mevcut ekran |

### Yasal

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| KVKK, gizlilik, mesafeli satış, iade, çerez metni | `settings.yasal:<ad>`; şablon `site/src/yasal/` | admin | var | Metin panelde düzenlenir. TASLAK notu veya köşeli parantez kalırsa onay reddedilir. Onaylanan metin sayfaya yazılır, dizine açılır |
| Kullanım koşulları, veri işleme sözleşmesi, açık rıza | Aynı | admin | kısmen | Metin ve onay panelde. Sitede sayfası yok, sayfa kod işi |
| Şablondaki 12 şirket alanı | Panelden otomatik | admin | var | `doldur()` |
| Süreler, sağlayıcılar, ülke, mahkeme şehri (YASAL-INCELEME §5.3, §8) | Metnin içinde | admin | var | Metin ekranında elle doldurulur, onaydan önce listelenir |
| Avukat incelemesi | Beyan | kullanıcı | var | Dış iş |
| Cayma, sorumluluk tavanı, ihlal süresi kararları | Metnin içinde | kullanıcı + avukat | var | Metin ekranı |
| Sipariş ekranı metinleri (YASAL-INCELEME §9) | `market/market.js` | geliştirici | **yok** | Kaldı. Kod işi |

### Ödeme

| Ayar | Nerede duruyor | Kim değiştiriyor | Panelde | Karar |
|---|---|---|---|---|
| Banka hesabı, IBAN | `bank_accounts` | admin | var | Kontrol hanesi denetlenir, mevcut ekran |
| Shopier anahtarı, canlı onayı | `settings.shopier` | admin | var | Mevcut ekran, anahtar dönmez |
| `IYZICO_CANLI` | `settings.canli_kilit`; ortam değişkeni de çalışır | superadmin | var | Test onayı zorunlu, denetim kaydı, yöneticiye görünmez |
| `ETICARET_ODEME_TTL_MS` | `settings.isletim.odemeDk`; ortam önceliklidir | admin | var | Taşındı |
| İşletmenin iyzico anahtarı | İşletme entegrasyon kaydı | işletme | müşteri başına | Programın kendi ayarında kalır |
| iyzico webhook adresi gösterimi | `GET /api/eticaret/odeme/durum` | işletme | müşteri başına | Program ekranı entegrasyon oturumuna ait |

### Ortam değişkenleri

| Değişken | Nerede | Kim | Panelde | Karar |
|---|---|---|---|---|
| `NEBSOFT_SECRET`, `NEBSOFT_SECRET_ESKI` | Sunucu ortamı | kullanıcı | kısmen | Taşınmaz: veritabanı bağlantısını çözmek için açılışta gerekir. Panelde durum ve yönerge |
| `NEBSOFT_DATA`, `NEBSOFT_DOSYALAR` | Sunucu ortamı | kullanıcı | yok | Taşınmaz: açılışta gerekir |
| `NODE_ENV`, `TRUST_PROXY` | Sunucu ortamı | kullanıcı | kısmen | Taşınmaz: güvenlik sınırı. Durum gösterilir |
| `PORT`, `HOST`, `DB_POOL` | Sunucu ortamı | kullanıcı | yok | Taşınmaz: açılışta gerekir |
| Veritabanı bağlantısı | `data/config.enc` | superadmin | var | Mevcut Veritabanı ekranı |
| `NEBSOFT_DOSYA_KOTA_MB` | `settings.isletim.dosyaKotaMb`; ortam önceliklidir | admin | var | Taşındı |
| `NEBSOFT_WEBHOOK_TOKEN` | `data/webhook-token.txt` kendiliğinden üretilir | sistem | yok | Kullanıcıdan istenmez |
| `SHOPIER_SCAN_MS`, `SHOPIER_TIMEOUT_MS`, `IYZICO_TIMEOUT_MS`, `ETICARET_ODEME_TARA_MS` | Kod varsayılanı | geliştirici | yok | Teknik, kullanıcıdan istenmez |
| `IYZICO_API_BASE`, `SHOPIER_API_BASE`, `OFF_API_TABAN`, `NEBSOFT_MOCK` | Test | geliştirici | yok | Test amaçlı, panele konmaz |
| `SITE_OUT`, `SITE_MD`, `SITE_BASE`, `CHROME`, `NEBSOFT_URL` | Araç | geliştirici | yok | Derleme aracı |

### Sunucu, yedek, paketler

| Ayar | Nerede | Kim | Panelde | Karar |
|---|---|---|---|---|
| nginx, güvenlik duvarı, systemd | Sunucu | kullanıcı | kısmen | Panelde yönerge, `DEPLOY.md` |
| Gece yedeği, geri yükleme denemesi | Sunucu | kullanıcı | kısmen | Beyan. Sunucu ölçemez |
| `NEBSOFT_SECRET` yedeği | Sunucu dışı | kullanıcı | kısmen | Beyan |
| `sunucu.json` adresleri | Pakete derlenir | geliştirici | kısmen | Ölçülür, değişmesi yeniden derleme ister |
| exe ve apk derleme | `desktop/`, `android/` | geliştirici | kısmen | Beyan |
| Android imza anahtarı | `data/android-release.jks` | kullanıcı | yok | Yedek işi |
| Sunucu ve yedek sağlayıcısı bilgisi | Yasal metin alanı | kullanıcı | var | Metin ekranı |

### Dış işler

| İş | Kaynak | Panelde | Karar |
|---|---|---|---|
| Avukat, mali müşavir, kendi e-Belge sağlayıcısı | YASAL-INCELEME, siparis-teslim | var | Beyan |
| Marka tescili, VERBİS, ETBİS, İYS | YASAL-INCELEME, görev | var | Beyan |
| iyzico, Shopier, Trendyol, n11, e-Fatura, SMS test hesapları | DEVAM-NOTU, tüm `docs/test/` | var | Beyan |
| Sosyal hesaplar, Google İşletme Profili, pilot işletmeler | KENDI-KENDINI-PAZARLAMA | var | Beyan |

### Müşteri başına, panelde kalmayacaklar

Programın kendi ayar ekranında kalır: işletme entegrasyonları, KDV oranı (`Ayarlar > KDV oranı`), kapora, personel rolleri, rol atamalarında kişi seçimi.

### Oturumların bıraktığı kod kararları

Ayar değildir, panele konmaz. Kullanıcı onayı ve kod oturumu gerekir.

| Konu | Kaynak |
|---|---|
| Uyumsoft, WhatsApp Cloud, `emustahsil` canlıda kapatılsın mı | `siparis-teslim`, `ticaret-tasima` |
| U-ETDS, taşıma irsaliyesi, iş tutarı KDV dahil mi, kullanılmayan bağlantılar | `saha-hizmet` |
| Rol kuralı düzeltmeleri, `okulservisi` ve `ciftci` şifreleme | `saha-hizmet`, `ticaret-tasima`, `uyelik-egitim-saglik`, `rezervasyon-aile` |
| Çift rezervasyon, fotoğraf adresi, ayrılış borcu kuralı | `rezervasyon-aile` |
| Teslim sonrası iade akışı | `siparis-teslim` |
| Overpass ve Google Haritalar kaynağı | `KENDI-KENDINI-PAZARLAMA` |

## Değişen davranış

- **Örnek telefon ve e-posta artık görünmez.** Bulutta `0850 555 00 34` ve `destek@nebsoft.com.tr` panelden onaylanmadıkça sitede, şemada, e-posta alt bilgisinde, destek penceresinde ve sık sorulanlarda çıkmaz. Numara gerçekse Kurulum'a yazılıp kaydedilir.
- Site Ayarları'nda yalnız marka adı, deneme ve tavsiye kaldı. `PUT /api/admin/settings` gelmeyen alanı silmez, gelen telefon ve adresi denetler.
- Yönetici Site Ayarları'nda artık Search Console ve iletişim alanı görmez, Kurulum'a yönlendirilir.
- `scripts/hosting-paketi.js` yasal şablonları ve `site/tools/markdown.js` dosyasını pakete alır.
- Sipariş fişi ve alt bilgideki sabit "Yazılım A.Ş." kalktı, unvan yoksa marka adı yazılır.

## Kalan örnek değerler

Sitede görünmez, depoda durur:

- `site/src/site.config.js`, üretilmiş `site/**/index.html`: sunucu yanıtta değiştirir. Veritabanı yokken (yerel mod) örnek değer görünür.
- `core/kb.json`, `site/tools/kb-genel.js`: destek penceresi çizerken değiştirir. Kaynak metin aynı kalır.
- `market/market.js` satır 11 ve `admin/data.js`: yalnız demo verisi. Sahte adres, IBAN ve şirket adı içerir, demoda görünür.
- `server/cloud/katalog.js`, `scripts/katalog-off-al.js`: Open Food Facts isteğinin tarayıcı kimliğinde `destek@nebsoft.com.tr` kalır. Dış servise giden bir bilgidir, gerçek adresle değişmeli.
- Yer tutucular: `site/src/yasal/acik-riza.md` içindeki `[İŞLETME ADI]` ve `[AMAÇ]` gibi alanlar işletme başına doldurulur, onay ekranı bunları da eksik sayar. Bu metin için sayfa yok, onayı beklemesi gerekmez.

## Panelde olmayan kaldı mı

Evet. Tam liste:

**Sunucu açılmadan gereken veya panelin dışında yapılan, taşınmaz:** `NEBSOFT_SECRET`, `NEBSOFT_SECRET_ESKI`, `NEBSOFT_DATA`, `NEBSOFT_DOSYALAR`, `NODE_ENV`, `TRUST_PROXY`, `PORT`, `HOST`, `DB_POOL`, DNS, HTTPS, nginx, güvenlik duvarı, yedek kurulumu, exe ve apk derleme, Android imza anahtarının yedeği. Hepsinde panelde yönerge, ölçülebilenlerde durum var.

**Panele alınabilir, bu çalışmada alınmadı:**

| Konu | Neden kaldı |
|---|---|
| Eklenti fiyatları | Sunucu, pazar yeri ve sayfa üç yerde okuyor; panel geçersiz kılması yok |
| Plan adları ve kullanıcı limitleri | Lisans mantığına bağlı |
| KDV oranı, yıllıkta 10 ay kuralı | Hesap kuralı, mali müşavir onayı gerek |
| Kurumsal talep türleri | Az değişen metin listesi |
| Destek asistanı yanıtları | Panel hâlâ `site/tools/kb-genel.js` düzenlemeyi söylüyor. Bu, kullanıcı kuralına aykırıdır |
| Rehber yazıları, ürün metinleri | `site/src`, derleme ister. Ad, kısa açıklama ve fiyat panelde |
| Kullanım koşulları için site sayfası | Sayfa yok, metin panelde tutulur |
| Sipariş ekranı yasal metinleri | `market/market.js` kod işi |
| Open Food Facts tarayıcı kimliği | Sabit e-posta, koddan okunmalı |

## Doğrulama

- `node server/test/kurulum.test.js`: 35 kontrol geçti.
- Test zincirinin 67 adımı geçti, XSD testi .NET ile çalıştı. **Tek istisna:** `bilet-kural.test.js` bu dalda gece saatinde kırılıyor (`Online satış kapandı`, 02.06). Saatten bağımsız sürümü `dfeb4fc` başka dalda. Zincir, o dosyanın `dfeb4fc` sürümüyle tek tek çalıştırıldı. Bu dalda düz `npm test` gündüz saatlerinde veya `dfeb4fc` birleşince tamamlanır; gece denemesi orada durur.
- Tarayıcı, yerel sunucu + MariaDB: panel masaüstü 1280, telefon 375, koyu tema, yatay taşma yok, konsol hatasız. Hatalı MERSİS reddedildi. Şirket, telefon, destek tutarı (490'tan 777'ye), indirim (%5'ten %12'ye), bayi komisyonu panelden girildi; sitede, `/api/orders/quote` ve `/api/vitrin` yanıtında yeniden başlatmadan göründü. POS demo ve pazar yeri açıldı.
- Siparişte geçmişin korunması ve iyzico kilidinin vitrine etkisi uçtan uca testte gösterildi, tarayıcıda denenmedi.
- Yapılmayan: gerçek alan adında HTTPS ölçümü (sahte yanıtla sınandı), gerçek Chrome, büyük veri (ekran ayar okur, liste tutmaz).
