# NEBSOFT güvenlik denetimi raporu

> **Dördüncü tur (30.10.2026, `guvenlik/ucuncu-tur`):** Platform yöneticisine uygulama tabanlı iki adımlı giriş (A6), `connect-src` daraltma (A4), eczane kalfa hesabında iade ve fiyat için sunucuda yetkili onayı belirteci (A1 kalanı), bilet koltuk kilidi sahibine bağlandı (A10), masaüstü `electron-updater` 6.8.11 ve `electron-builder` 26.18.0. Ayrıntı: Bölüm 6.

> **Üçüncü tur (30.10.2026, `guvenlik/sifreleme`):** Klinik, eczane, veteriner, İK, anaokulu ve entegrasyon belgeleri veritabanında AES-256-GCM ile şifrelidir (`server/cloud/belge.js`, işletme + program başına anahtar, şifreli metin başka satıra taşınırsa açılmaz). Personel PIN'i tüm programlarda sunucu anahtarıyla özetlenir (`server/cloud/pin.js`), özet tarayıcıya gitmez, doğrulama sunucudadır. Sunucusuz kurulumda PIN ilk başarılı girişte PBKDF2 özetine geçer. Eski kayıtlar açılışta taşınır. Korumanın sınırı: veritabanı dökümü, yedek ve veritabanı erişimi için geçerlidir. Sunucuya erişen yazılım veriyi açar, tarayıcıya inen veri ve çevrimdışı bekleyen değişiklikler şifresizdir, yedek anahtarla aynı yerdeyse koruma yoktur. Eski yedekler düz metindir.

Tarih: 30.10.2026 · Dal: `guvenlik/denetim` (temel: `devir/hepsi` 4ec51e1) · Kapsam: yerel kurulum (`PORT=5078`), dış sisteme denetim isteği atılmadı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Neden | Gereken |
|---|---|---|---|
| E1 | **Program rolleri sunucuda (A1): 20 programda GİDERİLDİ** (dallar `guvenlik/sunucu-rolleri`, `guvenlik/roller-tum`) | Ekip hesabına `team_roles` + `server/cloud/rol-kural.js`: okumada süzme, yazmada geri koyma, PIN sunucuda. Kural var: klinik, eczane, veteriner, ik, muhasebe, hukuk, musavir, crm, toptan, otoservis, pos, adisyon, kuyumcu, otel, randevu, kurs, anaokulu, site, galeri, eticaret. Rol atanmamış ekip hesabı eskisi gibi tam yetkili ve PIN'leri görür. Spor, kiralama: rol farkı yalnız menü, kural yok. Bilet, butik, emlak, fabrika, fiyatrobotu, kargo, oto, pazaryeri, servis: henüz kural yok, rol yalnızca arayüzde. | Üyelere rol atayın; kişiye bağlı rolde (temsilci, plasiyer, avukat, teknisyen, personel, öğretmen) kişiyi de seçin. Kalan 9 program için `RULES`e kayıt ekleyin |
| ~~E2~~ | **Kapandı 30.10.2026 (A2):** telefon tek başına giriş açmıyor | Randevu kodu yalnız o randevuyu, işletmenin verdiği portal kodu tüm randevuları açar. Başkasının numarasıyla randevu alan kişi müşteri bilgisini göremez. | Kodu olmayan eski müşteriye program **Müşteriler → Randevu portalı kodu** ile kod verir |
| ~~E3~~ | **Kapandı 30.10.2026:** mysql2 3.24.6, `npm audit --omit=dev` 0 açık | Masaüstü bağımlılıkları (Bölüm 3) ayrı duruyor. | exe yeniden derlenirken yükseltilecek |
| ~~E4~~ | **Kapandı 30.10.2026:** `cloud.test.js` gerçek MariaDB ile geçiyor (43 test) | — | — |
| E5 | **Varsayılan sunucu adresi şifresiz HTTP (A9)** | `sunucu.json` ilk adresi `http://45.133.36.99:5050`. Parola ve oturum çerezi ağda açık gider. | Adresi listeden çıkarın, exe ve APK'yı yeniden derleyin |

## Özet

- Doğrulanan bulgu: **18** (kritik 2, yüksek 5, orta 7, düşük 4). Hepsi düzeltildi, gerileme testi eklendi.
- Açık kalan, karar gerektiren: **11** (A bölümü).
- Sahte başarı metni: 9 yerde düzeltildi (Bölüm 4).
- KVKK teknik önlemleri: 3 programda eklendi (Bölüm 5). Hukuki sonuç yazılmadı.
- Testler: 28 güvenlik denetimi, 31 program duman testi. `cloud.test.js` dışındaki tüm takımlar geçti, GİB XSD testi çalıştı (atlanmadı).

## 1. Doğrulanan ve düzeltilen bulgular

Satır numaraları düzeltme öncesi 4ec51e1 içindir. "Yerel denendi" ifadesi, açığın düzeltmeden önce çalışan sunucuda yeniden üretildiğini belirtir. "Kodla doğrulandı" ifadesi, açığın kod okumayla belirlendiğini ve düzeltmenin testle sınandığını belirtir; açık düzeltmeden önce çalıştırılarak üretilmemiştir.

### Kritik

**D1. Dosya yolu aşımı: `data/`, sunucu kodu ve belgeler okunabiliyordu** — `server.js:121, 192-193` — yerel denendi
DENY deseni ham yola uygulanıyor, `path.normalize` sonra çalışıyordu. Şifreleme anahtarının bulunduğu `data/secret.key`, `data/config.enc` varsayılan kurulumda okunabilir. `NEBSOFT_DATA` kod klasörü dışındaysa `data/` kapsam dışı kalır, kaynak kod yine okunur. nginx örneği URI'siz `proxy_pass` kullandığı için kodlanmış yol ham iletilir (nginx belgesindeki davranış, gerçek nginx ile denenmedi).
```
GET /apps/../data/canary.txt          → 200 GIZLI-CANARY
GET /apps/%2e%2e/data/canary.txt      → 200
GET /data%5Ccanary.txt                → 200 (Windows)
GET /apps/../server/cloud/config.js   → 200
```
Düzeltme: `sec.safePath`, ayrıca `serve()` içinde çözülmüş yol üzerinde ikinci DENY denetimi.

**D2. Yerel köprü nginx arkasında internete açıktı** — `server.js:38, 47, 130` — yerel denendi (`X-Forwarded-For` ile nginx benzetimi)
`isLocal` soket adresine bakıyordu. nginx arkasında her istek 127.0.0.1'den görünür. Bulut yönlendiricisinde eşleşmeyen `/api/yazdir`, `/api/tcp-oku`, `/api/tcp-test`, `/api/modbus`, `/api/mqtt`, `/api/pos/satis` oturumsuz çalışıyordu: sunucunun iç ağına ham TCP yazma ve okuma. Veritabanı koptuğunda `/api/istek` da aynı yola düşüyordu.
```
POST /api/tcp-test  X-Forwarded-For: 8.8.8.8  {"host":"127.0.0.1","port":5078} → {"ok":true}
```
Düzeltme: `sec.bridgeDenied`. Bulut kurulumunda (`config.enc` varsa veya DB bağlıysa, DB kopukken de), `TRUST_PROXY=1` iken ve vekil başlığı varken köprü kapalı.

### Yüksek

**D3. Yerel köprü başka siteden ve DNS rebinding ile kullanılabiliyordu** — `server.js:47` — yerel denendi
Yerel sunucu açıkken ziyaret edilen herhangi bir site, `text/plain` POST ile yazıcıya veri, iç ağa istek gönderebiliyordu. `Host: evil.example` ile rebinding yanıtı okunabiliyordu, `/api/kanal` webhook belirtecini de veriyordu. Düzeltme: Host yerel ad olmalı, Origin varsa aynı kaynak olmalı.

**D4. İşletme, platformun alan adını sahiplenebiliyordu** — `routes.js:286-299`, `seo.js:115-120` — kodla doğrulandı
`PUT /api/websitem` ile `domain` alanına platform adresi yazan, web sitesi eklentisi etkin işletme, `GET /` yanıtını kendi sitesiyle değiştirebiliyordu. IP adresi de alan adı sayılıyordu. Düzeltme: platform adresi, alt alan adları ve IP reddedilir; `domainSite` eski kayıtları da platform adresinde yok sayar. DNS sahiplik doğrulaması yok (A7).

**D5. İşletme sitesinde saklı XSS** — `core/bizsite.js:94-95` — kodla doğrulandı
Ürün adı `<script>` içine kaçışsız yazılıyordu. `/t/<işletme>/` platformla aynı kökenden sunulduğu için, siparişe açık bir sitede `</script><script>...` adlı ürün, siteyi açan oturumlu kullanıcı adına API çağrısı yapabilirdi. Ürün kimliği de `innerHTML` içine kaçışsız giriyordu. Düzeltme: `<` kaçışı, kimlik beyaz listesi. **`core/bizsite.js` üzerinde çalışan ajanla birleştirirken bu iki satırı koruyun.**

**D6. Eczane: telefon numarasıyla başkasının reçeteleri okunabiliyordu** — `public-rules.js:543-554` — kodla doğrulandı
Reçete formuna başkasının telefonunu yazan kişiye o telefon için kimlik veriliyor, ad, e-reçete no, not ve takip kodları dönüyordu. Sağlık verisi, oturumsuz erişim. Düzeltme: gönderen yalnızca kendi kaydını görür; telefon görünümü için takip kodu zorunlu; kod kripto rastgele.

**D7. Teknik servis: sıralı kayıt noyla takip ve onay** — `public-rules.js:147` — kodla doğrulandı
`SRV1001` gibi tahmin edilebilir numara rastgele takip kodunun yerine geçiyordu; başkasının cihaz bilgisi görülebiliyor, tamir onayı verilebiliyordu. Düzeltme: yalnızca takip kodu (program ve sayfa zaten bunu kullanıyor).

### Orta

| # | Bulgu | Yer | Düzeltme |
|---|---|---|---|
| D8 | Doğrulama kodu `mail_log` tablosunda düz metin; yönetici, müşterinin sıfırlama kodunu görebiliyordu | `mail.js:93-94` | Konuda maskelenir |
| D9 | `/api/setup/status` oturumsuz DB adresi ve adını veriyordu | `routes.js:125` | Yalnızca yönetici oluşmadan önce |
| D10 | Ekip üyesi hesap sahibini silebiliyor, kullanıcı ekleyebiliyor, işletme bilgisini değiştirebiliyordu | `routes.js:431-450` | Yalnızca hesap sahibi (ilk kullanıcı) |
| D11 | Ürün havuzu oturumsuz yazılabiliyordu; tüm işletmelerin aramasını kirletir | `routes.js:282` | Bulutta oturum zorunlu |
| D12 | Bulut `/api/istek` DNS denetimi ile bağlantı arasında adres değişebiliyordu; yanıt boyutu sınırsızdı | `bridge.js:39-44` | `sec.safeFetch`: bağlantı anında denetim, 2 MB sınır |
| D13 | SSRF listesinde `fec0::/10`, `ff00::/8`, NAT64, 6to4, `192.0.0.0/24`, `198.18.0.0/15` eksikti | `security.js:41-44` | Eklendi |
| D14 | Klinik randevu nedeni (ör. "Dolgu") iCal ile dış takvim servisine gidiyordu | `routes.js:359` | "Hasta randevusu" yazılır. **Davranış değişikliği:** hekim takviminde neden görünmez |

### Düşük

| # | Bulgu | Yer | Düzeltme |
|---|---|---|---|
| D15 | `/server.js`, `/sunucu.json`, `.md`, `.test.js` sunuluyordu | `server.js:121` | DENY genişletildi |
| D16 | Bozuk çerez 500 üretiyordu | `security.js:38` | Yok sayılır |
| D17 | `/api/orders/quote` kupon denemesine sınırsızdı | `routes.js:406` | 10 dakikada 60 |
| D18 | Belirteç ve takvim imzası sabit süreli karşılaştırılmıyordu; `domCache` sınırsız büyüyordu | `public.js:21`, `routes.js:346`, `seo.js:117` | `safeEq`, önbellek sınırı |

### Güvenlik dışı hata

**Web sitesi siparişi hiç çalışmıyordu** — `routes.js:305`, `bizsite.js:97`. Sayfa `x-ns-csrf` başlığı göndermediği için her sipariş 403 alıyordu. Uç nokta çerez yetkisi kullanmadığından CSRF başlığı kaldırıldı, kaynak denetimi kondu.

## 2. Bulunmayanlar (bakıldı, açık görülmedi)

- SQL enjeksiyonu: sorgular parametreli, dinamik parçalar sabit.
- Kiracılar arası veri: `/api/data`, `/api/kanal`, `/api/inbox`, `secrets.resolve` hep oturumdaki `tenant_id` ile çalışıyor. Bu sonuç kod okumasına dayanır; iki işletmeyle uçtan uca denenmedi (`cloud.test.js` çalıştırılmadı).
- Parola saklama: scrypt N=16384, tuzlu, sabit süreli karşılaştırma. Oturum belirteci veritabanında özet olarak duruyor.
- Oturum: HttpOnly, SameSite=Lax, üretimde Secure; parola değişince oturumlar kapanıyor.
- Webhook belirteci, yönetici API yanıtlarından çıkarılıyor; SMTP parolası şifreli ve istemciye gitmiyor.
- CSRF: durum değiştiren API'lerde özel başlık + kaynak denetimi. CORS başlığı yok.
- XSS, yönetim paneli ve program ekranları: `NS.table`, `modal`, `toast`, `badge` kaçış yapıyor. Anonim girilen alanlar için sezgisel tarama 51 aday verdi, incelenenler yanlış alarm çıktı. **Bu tarama kanıt değildir:** tüm ekranlar elle okunmadı.
- `secrets.js` alan listesi, entegrasyon formlarındaki tüm parola alanlarını kapsıyor.

## 3. Bağımlılıklar

Araç: `npm audit` (npm kayıt defteri), 30.10.2026.

**30.10.2026 güncellemesi:** `electron-updater` 6.8.11 ve `electron-builder` 26.18.0 yüklendi. Masaüstü `npm audit`: 15 açıktan **2 yüksek** kaldı (`electron` 33.2.1 ve onun bağımlılığı `extract-zip`), kritik yok. Üretim bağımlılığı `electron-updater` temiz. Electron 45.1.0 büyük sürüm atlamasıdır, yapılmadı. Aşağıdaki tablo ilk denetimin kaydıdır.

| Paket | Sürüm | Durum | Gereken |
|---|---|---|---|
| mysql2 (doğrudan) | 3.11.5 | **Yüksek**: GHSA-3f6p-5ww8-9rcr, orta: GHSA-rgwj-5xj2-c3m3 | 3.24.6 (`package.json` + kilit dosyası) |
| electron-updater (masaüstü, üretim) | 6.3.9 | Yüksek (`builder-util-runtime`) | 6.8.11 |
| electron (masaüstü) | 33.2.1 | Yüksek | 45.1.0 (büyük sürüm atlaması, ayrı test ister) |
| electron-builder (derleme) | 25.1.8 | Yüksek, zincirde `tar` kritik | 26.18.0 |

Masaüstü toplamı: 15 açık (14 yüksek, 1 kritik). Üretim bağımlılığında 2 yüksek. Sunucunun diğer dolaylı bağımlılıklarında açık yok.

## 4. Sahte başarı ve duman testi

`server/test/program-duman.test.js` tarayıcısız çalışır. Sonuç: 118 betik derlendi, 31/31 program yüklendi, 396 yönlendirme, yaklaşık 13.800 tohum kaydı, yaklaşık 1.400 zorunlu alan denetlendi, 143 dosya tarandı. Tohum verisi rastgele olduğu için sayılar her çalıştırmada biraz değişir.

Düzeltilenler:

| Yer | Sorun |
|---|---|
| `apps/kurs/app.js` | Simülasyonda "MEB sistemine iletildi" |
| `apps/eczane/app.js` | Simülasyonda "deposuna sipariş iletildi" |
| `apps/pos/app.js` | Simülasyonda "pazaryerine iletildi" |
| `apps/adisyon/platform.js` | Bağlantı yokken "Yanıt gönderildi", yanıt gönderilmiş gibi kaydediliyordu; artık taslak |
| `apps/muhasebe/hatirlat.js` | Otomatik hatırlatma sayacı simülasyonu sayıyordu |
| `apps/eticaret/magaza.html` | Hiçbir e-posta gitmezken "e-posta adresinize gönderildi" (canlıda görünüyordu) |
| `market/market.js` | Aynı iddia (tarayıcı içi demo mağaza) |
| `apps/kiralama/kirala.html`, `apps/site/sakin.html` | Demoda "SMS gönderildi (demo)" artık TEST |
| `server.js`, `core/integrations.js` | POS test terminali sahte onay kodu üretmez, TEST görünür. Bulutta kapalı |

Pazaryeri ve fiyat robotu metinlerindeki "(demo)" ifadeleri "(TEST)" yapıldı.

Test sınırları: gerçek çizim ve tıklama denenmez; zorunlu alan denetimi yalnızca açılan `NS.crud` sayfalarını kapsar; metin taraması desene dayanır, izin listesi `TEXT_ALLOW` içinde gerekçeli tutulur.

**Bilinen eksik:** POS test terminali satışı programda kartlı satış olarak kaydetmeye devam eder (`r.test` çağıranlarca okunmuyor). Bu yalnızca veritabanısız yerel kurulumda ve POS modu elle "Demo terminal" seçilirse olur; varsayılan mod `manual`.

## 5. KVKK teknik önlemleri

Hukuki değerlendirme içermez. Veteriner, hayvan sahibinin kişisel verisi kapsamında listelendi.

| Önlem | Klinik | Eczane | Veteriner |
|---|---|---|---|
| Rol ayrımı (arayüz) | Önce: not, tanı, reçete sekretere kapalı. **Eklendi:** anamnez de kapalı, "note" işlemine sunucu değil kod içi engel | Eczacı / kalfa. **Eklendi:** hasta silme ve toplu aktarım eczacıda | Hekim / asistan. **Eklendi:** sahip silme ve toplu aktarım yöneticide |
| Rol ayrımı (sunucu) | **Eklendi:** sekreter hesabına tanı, anamnez, reçete, PIN gitmez, yazamaz | **Eklendi:** kalfa hesabına defter, kurum, PIN gitmez; defter yalnızca eklenir | **Eklendi:** asistan muayene ve aşıyı görür, değiştiremez; PIN gitmez |
| İşlem geçmişi | Önce 4 işlem. **Eklendi:** kart görüntüleme, silme, aktarma, anonimleştirme | Önce neredeyse yok. **Eklendi:** silme, aktarma, anonimleştirme | Önce neredeyse yok. **Eklendi:** kart görüntüleme, silme, aktarma, anonimleştirme |
| Sunucu güvenlik kaydı | **Eklendi:** "Sağlık verisi okundu" (kullanıcı/saat başına bir) | **Eklendi** | **Eklendi** |
| Toplu dışa aktarma | Önce tüm rollere açık. **Eklendi:** yalnızca yönetici + kayıt | Aynı | Aynı |
| Kişi bazında dışa aktarma | **Eklendi** (JSON) | **Eklendi** | **Eklendi** |
| Silme | Bağlı kaydı olan hasta pasif. **Eklendi:** yalnızca yönetici | **Eklendi:** satışı olan hasta silinmez | **Eklendi:** hayvanı olan sahip silinmez |
| Anonimleştirme | **Eklendi** | **Eklendi** | **Eklendi** |
| Dış takvim | **Eklendi:** randevu nedeni gitmez | Yok | Yok |

Tarayıcıda denendi (`?demo=1`): klinikte anonimleştirme uçtan uca çalıştı, ad ve telefon verinin hiçbir yerinde kalmadı, 9 bağlı kayıt temizlendi; sekreterde düğmeler, anamnez ve CSV görünmedi; eczanede satışlı hasta silinemedi; veterinerde düğmeler göründü; telefon genişliğinde taşma yok; konsolda hata yok. POS ve CRM açılışı denendi. Koyu tema doğrulanamadı (yeni düğmeler standart `.btn`).

Kalan teknik sınırlar:

- İşlem geçmişi (`_log`) istemcide tutulur, tüm veriyi yazabilen kullanıcı değiştirebilir. Değiştirilemez kayıt değildir.
- Anonimleştirme `app_data_history` (48 saat) ve gece yedeklerine (14 gün) uygulanmaz. e-Belge kayıtları da etkilenmez.
- Çevrimdışı bekleyen değişiklikler tarayıcıda şifresiz durur (`localStorage`). Çıkışta silinmez.
- Hekim diş şeması ve tedavi planı sekretere açık kaldı (tahsilat için gerekli mi, karar sizin).
- Yedek (tüm JSON) yöneticide, indirme işlem geçmişine yazılmıyor.

### Avukata sorulacaklar

1. Hasta, reçete ve muayene kayıtlarının saklama süresi nedir? Süre dolmadan anonimleştirme veya silme talebi nasıl karşılanır?
2. Anonimleştirmede muayene notu ve tanı silinmeli mi, yoksa saklama yükümlülüğü mü geçerli?
3. NEBSOFT'un rolü nedir (veri işleyen / veri sorumlusu)? İşletmelerle hangi sözleşme gerekir?
4. Sağlık verisini işleyen altyapının yeri ve yurt dışı aktarım koşulları nelerdir? (e-posta, SMS, takvim, CDN dahil)
5. Google/Apple takvime ad + soyadın baş harfiyle hasta randevusu göndermek kabul edilebilir mi?
6. Kart görüntüleme kaydı ne kadar tutulmalı? Bu kayıt personel verisi olarak ayrıca bildirim gerektirir mi?
7. Veteriner verisi ve eczane kronik ilaç bilgisi hangi kategoride değerlendirilir?
8. Yedeklerden silme için kabul edilebilir süre nedir?
9. İhlal bildirimi için hangi süreç ve kayıtlar gerekir?

## 6. Dördüncü tur

### A6: iki adımlı giriş

`server/cloud/totp.js`, `totp-api.js`, yeni tablo `user_totp`, panelde **Yöneticiler → İki adımlı giriş**.

- RFC 6238, SHA1, 30 saniye, 6 hane, pencere ±1. RFC 4226 Ek D ve RFC 6238 Ek B vektörleri testte (kaynak: rfc-editor.org/rfc/rfc6238, rfc-editor.org/rfc/rfc4226; vektörler hafızadan yazıldı, kod aynı değerleri üretti).
- Gizli anahtar `cfg.encrypt` ile şifreli ve kullanıcı kimliğine bağlı, başka satırda açılmaz. `NEBSOFT_SECRET_ESKI` ile anahtar değişiminde okunur.
- 8 kurtarma kodu sunucu anahtarıyla HMAC özeti olarak durur, bir kez gösterilir, tek kullanımlıktır.
- Aynı kod ikinci kez geçmez: `last_step` satır kilidi altında güncellenir, aynı anda gelen iki istekten biri düşer (testte denendi).
- 5 hatada 15 dakika kilit. Kilitteyken doğru kod ve kurtarma kodu da reddedilir.
- TOTP etkinse e-posta gönderilmez. Kapalıysa e-posta kodu aynen sürer.
- Etkinleştirme, yenileme ve kapatma hesap şifresi ister; yenileme ve kapatma ayrıca kod ister. Oturum tek başına korumayı kaldıramaz.
- Etkinleşince diğer oturumlar, bekleyen e-posta giriş kodları ve giriş bağlantıları düşer.
- **Görevde istenmeyen, kapatılan iki yol:** `/api/auth/reset` iki adımlı hesapta artık oturum açmaz (e-postayı ele geçiren ikinci adımı atlıyordu). Pazar yeri girişinden gelen yönetici `/admin/`e yönlendirilir, şifreyi orada yeniden yazar.
- Kilitlenen yönetici: `node scripts/totp-sifirla.js --eposta <adres> --evet` (sunucuda). Hosting paketine eklendi. Oturumları kapatır, denetime yazar, şifreye dokunmaz.

Sınırlar: QR görseli yok. Panelde dış kütüphane çalıştırmak gizli anahtarı üçüncü taraf kodla aynı sayfaya koyardı; `otpauth://` metni ve elle girilecek anahtar gösterilir. Gerçek telefon uygulamasıyla **denenmedi**: kodlar RFC algoritmasıyla test içinde ve tarayıcıda Web Crypto ile üretildi. Yönetici hesabı platformda iki adımlıyı zorunlu kılmaz, kişi kendisi açar. Platform yöneticisinin başka yöneticinin korumasını kaldırdığı panel ucu yok, yalnızca betik var. `/api/auth/link` (cihaz bağlantısı) ikinci adım istemez: bağlantıyı yalnızca açık oturum üretebilir.

### A4: CSP

`connect-src 'self' https:` → `connect-src 'self' https://api.emailjs.com`. Tarama sonucu tüm `fetch`, `XMLHttpRequest`, `EventSource`, `WebSocket`, `sendBeacon` çağrıları: yalnızca aynı köken, tek dış adres EmailJS (`core/integrations.js`, e-posta modu "emailjs"; REST ucu DOĞRULANDI, `emailjs.com/docs/rest-api/send/`, `docs/MUHASEBE-DOGRULAMA-RAPORU.md`). Service worker yalnızca aynı kökeni yakalar. `base-uri`, `form-action`, `object-src`, `frame-ancestors` iki ilkede de zaten vardı, değişmedi. `SITE_CSP` zaten `connect-src 'self'`, değişmedi.

Davranış değişikliği: `httpCall` içindeki "köprü yoksa doğrudan tarayıcıdan" yedeği http(s) sayfada artık CSP'ye takılır. Bu yedek yalnızca aynı kökene ağ hatası olduğunda çalışıyordu, kullanıcı bağlantı hatası görür. `file://` açılışta CSP yoktur, değişmedi.

Kalan: `img-src https:` görsel adresiyle veri çıkışına açıktır, `script-src 'unsafe-inline'` duruyor. XSS varsa `connect-src` tek başına durdurmaz.

Tarayıcıda (yerel sunucu, MariaDB): pazar yeri, POS, klinik, ön muhasebe, emlak ilan, e-ticaret mağaza, yönetim demosu, yönetim paneli (bulut), işletme sitesi `/t/<işletme>/`, bilet sayfası, eczane. Bilinçli yapılan bir `example.com` isteği dışında CSP ihlali yok; yani denetim ihlali yakalayabiliyor. XSLT polyfill (WASM) ve `general.xslt` bu ilkede çalıştı. Denenmeyen: gerçek EmailJS gönderimi, leaflet haritalı ilan ayrıntısı, kamera ile barkod, koyu temada tüm ekranlar.

### Yetkili onayı (A1 kalanı)

`NS.approve` 14 programda, 46 kod satırında kullanılıyor. Sunucu kuralı (`rol-kural.RULES`) 4 programda var; ikisinin kesişimi eczane ve ik. Bu yüzden yalnızca **eczane kalfa** için uygulandı:

- `POST /api/data/:app/pin` yetkili PIN doğrulanınca imzalı belirteç döner: hesaba ve programa bağlı, 5 dakika, korunan bir değişiklikte bir kez. PIN sahibinin rolüne sunucu karar verir, istemcinin gönderdiği `roles` belirteç vermez.
- Yeni kural alanı `onayli`: `sales.canceled` ve `drugs.price`. Belirteçsiz değişiklik sunucudaki değere döner, geri kalan belge kaydedilir, yanıtta `onayRed` gelir, denetime yazılır; arayüz hata gösterir ve sunucudaki değeri ekrana getirir. Satış kaydı silinemez (`silemez`).
- Program kodu değişmedi. `core/core.js` yalnızca belirteci saklar ve PUT'a ekler.

Sınırlar: Belirteç işleme özel değildir (`NS.approve` işlem kimliği almaz): 5 dakika içinde bir kayıtta herhangi bir korunan alanı açar. Tek kullanım bilgisi tek süreç belleğindedir. Çevrimdışı onaylanan iade geri alınır, kullanıcı hatayı görür. `lots` (stok) ve depo iade/imha sunucuda korunmuyor: kalfa satışta stok düşürdüğü için alan kuralı yetmez. Kontrole tabi satış onayı ve ik şefinin hak aşımı onayı hesaplanan koşuldur, sunucuda zorlanmıyor.

**Kalan 12 program (adisyon, anaokulu, bilet, emlak, eticaret, fiyatrobotu, kiralama, kurs, kuyumcu, pos, site, spor):** burada sunucu rolü olmadığı için onay arayüzdedir. Maliyet: her program için `RULES`e rol kaydı (ayrı iş) + `onayli` alan listesi, program başına küçük. Koşul hesaplı olanlar (kiralama liste fiyatı altı, kuyumcu kur sapması, POS indirim oranı) alan kuralına sığmaz, `sonra` adımında sunucu hesabı gerekir. Tüm programlar için işlem kimliği istenirse bu satırların hepsi değişir.

### A10: bilet koltuk kilidi

`holds` silme yalnızca sahibine veya süresi dolmuş kilide açık. Sahip kimliği önceden herkese açık görünümde gidiyordu, yani yetki sayılamazdı; artık yalnızca kendi kilidinde döner (`x.sahip`). `bilet.html` başkasının kilidine dokunmaz, kimlik `pubQuery` ile gönderilir. Tarayıcıda koltuk seçme, bırakma, iki koltukla rezervasyon uçtan uca çalıştı. Eski sürümde açık kalan sekme başkasının süresi dolmuş sayılan kilidini silmeye çalışırsa 403 alabilir; `sw.js` sürümü artırıldı.

### Masaüstü

Bağımlılıklar yükseltildi, `electron-builder --win --x64` geçici klasöre derlendi, `NEBSOFT-Kurulum.exe` üretildi, depoya konmadı, sonra silindi. Kurulum dosyası **çalıştırılmadı**, otomatik güncelleme denenmedi. Electron 33.2.1 durur; 45.1.0 ayrı test ister: `main.js` pencere, IPC, otomatik güncelleme, yazıcı köprüsü, `preload.js`. Uygulama sunucudan uzak sayfa yüklediği için audit'te kalan Electron danışmaları önemsenmeli.

## A. Açık kalanlar

| # | Önem | Konu | Yer | Öneri |
|---|---|---|---|---|
| A1 | Yüksek → **20 programda giderildi** | Rolü atanan hesapta veri sunucuda süzülür, PIN inmez, yazma geri konur (`rol-kural.js`, `routes.js`). Kalan: rolsüz ekip hesabı tam yetkili; 9 programda veri ayrımı henüz sunucuda değil (E1), 2 programda rol farkı yalnız menü; `NS.approve` yalnızca eczane kalfada, iade ve fiyatta sunucuda zorlanır (Bölüm 6) | `server/cloud/rol-kural.js`, `routes.js`, `core/core.js` | PIN özeti; yeni programlara kural |
| A2 | Yüksek | Randevuda telefonla giriş | `public-rules.js:106` | SMS kodu veya portal kodu |
| ~~A3~~ | Orta | **Kapandı 30.10.2026:** yer tutucu yalnız `core/integrations.js`, `integ-wizard.js`, `ubltr.js` içinde geçen sağlayıcı adresine veya o entegrasyonun kayıtlı adresine çözülür. Sınır: rolü atanmamış ekip üyesi entegrasyon adresini değiştirebilir | `secrets.js` | Rol atanan hesap `cfg` değiştiremez |
| A4 | Orta | **Kısmen kapandı 30.10.2026:** `connect-src` yalnız aynı köken + EmailJS. Kalan: `unsafe-inline`, `img-src https:` | `security.js` | Gömülü betikleri taşımak büyük iş, aşamalı |
| ~~A5~~ | Orta | **Kapandı 30.10.2026:** işletme ve program başına saatte 3000 yazma işlemi. Sınır tek süreç belleğinde | `public.js` | — |
| ~~A6~~ | Orta | **Kapandı 30.10.2026:** uygulama tabanlı iki adımlı giriş, e-posta altyapısına bağlı değil. Yönetici kendisi açar, zorunlu değildir. Gerçek telefon uygulamasıyla denenmedi | `totp.js` | Canlıda tüm yöneticiler açsın |
| ~~A7~~ | Orta | **Kapandı 30.10.2026:** yeni veya değişen alan adı `_nebsoft.<alan>` TXT kaydıyla doğrulanmadan yayınlanmaz, doğrulanmamış kayıt adı tutamaz. Eski kayıtlar doğrulanmış sayılır. Gerçek DNS ile denenmedi | `routes.js`, `seo.js` | Canlıda bir alan adıyla deneyin |
| A8 | Düşük | Hesap kilidi hedefli engellemeye açık; müşteri parolası en az 8 karakter; hız sınırları tek süreç belleğinde | `auth.js:54`, `security.js` | nginx `limit_req`, süreli kilit gözden geçirme |
| A9 | Yüksek | `sunucu.json` HTTP adresi; Android `usesCleartextTraffic=true` | `sunucu.json`, `AndroidManifest.xml:20` | HTTPS'e geçince kapatın |
| ~~A10~~ | Düşük | **Kapandı 30.10.2026:** kilidi yalnızca sahibi kaldırır, sahip kimliği herkese açık değil. Kilit satışı engellemez (değişmedi) | `public-rules.js` | — |
| A11 | Düşük | Audit tablosu için saklama süresi ve temizlik yok | `routes.js:28` | Süreyi avukat görüşüyle belirleyin |

Kapsam dışı kaldı: masaüstü ve Android tam denetimi yapılmadı (yalnızca pencere ayarları ve manifest okundu), gerçek nginx kurulumu, yük testi, sağlayıcılarla canlı entegrasyon. `sec.safeFetch` yerel sahte sunucuyla denendi; **gerçek SMS, e-Fatura ve WhatsApp sağlayıcılarıyla denenmedi**, canlıdan önce birer test gönderimi yapılmalı.

## Birleştirme notları

`package.json` scriptine eklenecekler (`cloud.test.js`'ten önce):

```
node server/test/guvenlik.test.js && node server/test/program-duman.test.js &&
```

`sw.js`: `V` sürümü artırılmalı, `SHELL` listesine `/core/kvkk.js` eklenmeli. Görev gereği dokunulmadı.

`DEPLOY.md` güncellendi. Davranış değişiklikleri:

- Veritabanlı kurulumda yerel köprü açılmaz. Yazıcı, terazi gibi donanım için veritabanısız yerel köprü veya masaüstü uygulaması gerekir.
- Ekip üyesi artık ekip yönetemez, işletme bilgisini değiştiremez; arayüz hata gösterir, düğmeler henüz gizlenmedi.
- Klinik takviminde randevu nedeni görünmez.

## Senden gerekenler

1. Sağlık ve İK kullanan işletmelerde mevcut ekip üyelerine rol atayın; atanmayan üye tam yetkili kalır.
2. Gerçek Chrome'da `sw.js` kaydını bir kez doğrulayın: tarayıcı panelinde en küçük service worker bile "unknown error" veriyor, bu yüzden hata panele özgü görünüyor.
3. Tüm yöneticiler panelden iki adımlı girişi açsın, gerçek telefon uygulamasıyla bir kez denesin, kurtarma kodlarını saklasın. E-posta altyapısı müşteri işlemleri için yine gerekir.
4. `sunucu.json` HTTP adresini kaldırıp paketleri yeniden derleme.
5. Canlıda `data/` kod klasöründe kaldıysa: **bu açık yayında bulunduysa `NEBSOFT_SECRET`, veritabanı parolası ve entegrasyon anahtarlarını değiştirin**, sunucu günlüklerinde `..` ve `%2e` içeren istekleri arayın.
6. Avukat soruları (Bölüm 5).
7. Electron 45.1.0 yükseltmesi için ayrı test dalı kararı (Bölüm 6, Masaüstü).
