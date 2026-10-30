# NEBSOFT güvenlik denetimi raporu

Tarih: 30.10.2026 · Dal: `guvenlik/denetim` (temel: `devir/hepsi` 4ec51e1) · Kapsam: yerel kurulum (`PORT=5078`), dış sisteme denetim isteği atılmadı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Neden | Gereken |
|---|---|---|---|
| E1 | **Program rolleri sunucuda (A1): klinik, eczane, veteriner, ik için GİDERİLDİ** (dal `guvenlik/sunucu-rolleri`) | Ekip hesabına `team_roles` + `server/cloud/rol-kural.js`: okumada süzme, yazmada geri koyma, PIN sunucuda. Rol atanmamış ekip hesabı eskisi gibi tam yetkili ve PIN'leri görür. Diğer 27 programın rolleri yalnızca arayüzde. | Sağlık programı kullanan işletmelerde üyelere rol atayın; yeni programlar için `RULES`e kayıt ekleyin |
| E2 | **Randevu sayfasında yalnızca telefonla giriş (A2)** | Numarayı bilen kişi müşterinin adını, e-postasını, randevu notlarını görür, randevuyu iptal eder veya taşır. | Karar: SMS kodu veya portal kodu |
| E3 | **mysql2 3.11.5 açığı (B-Y)** | `npm audit`: yüksek önem, 3.24.6'da giderilmiş. `package.json` görev gereği değiştirilmedi. | Sürümü yükseltin, `cloud.test.js` çalıştırın |
| E4 | **`cloud.test.js` çalıştırılmadı** | Görev gereği. Bu dalın bulut düzeltmeleri gerçek MySQL ile uçtan uca denenmedi. | Test veritabanıyla bir kez çalıştırın |
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

## A. Açık kalanlar

| # | Önem | Konu | Yer | Öneri |
|---|---|---|---|---|
| A1 | Yüksek → **4 programda giderildi** | Rolü atanan hesapta veri sunucuda süzülür, PIN inmez, yazma geri konur (`rol-kural.js`, `routes.js`). Kalan: PIN hâlâ düz metin `users[].pin`; rolsüz ekip hesabı ve sahip PIN'i görür; 27 programda rol yalnızca arayüzde; onay kararı (`NS.approve`) sunucuda zorlanmaz | `server/cloud/rol-kural.js`, `routes.js`, `core/core.js` | PIN özeti; yeni programlara kural |
| A2 | Yüksek | Randevuda telefonla giriş | `public-rules.js:106` | SMS kodu veya portal kodu |
| A3 | Orta | Ekip üyesi kayıtlı gizli bilgiyi kendi sunucusuna gönderip okuyabilir: `/api/istek` yer tutucuyu her adres için çözer | `bridge.js:36` | Yer tutucuyu sağlayıcı alan adına bağlayın |
| A4 | Orta | CSP `unsafe-inline`; `connect-src https:` veri çıkışına izin verir | `security.js:16` | Gömülü betikleri taşımak büyük iş, aşamalı |
| A5 | Orta | Müşteri sayfası yazma kotası yok: IP başına dakikada 40 istek × 60 işlem işletme verisini şişirebilir | `public.js:104-105` | İşletme başına kota |
| A6 | Orta | Yönetici için 2 adımlı giriş zorunlu değil (e-posta ayarına bağlı) | `routes.js:206` | Yönetici rolünde zorunlu kılın |
| A7 | Orta | Özel alan adında DNS sahiplik doğrulaması yok; başkası önce yazarak gerçek sahibi engelleyebilir | `routes.js:297` | TXT doğrulaması |
| A8 | Düşük | Hesap kilidi hedefli engellemeye açık; müşteri parolası en az 8 karakter; hız sınırları tek süreç belleğinde | `auth.js:54`, `security.js` | nginx `limit_req`, süreli kilit gözden geçirme |
| A9 | Yüksek | `sunucu.json` HTTP adresi; Android `usesCleartextTraffic=true` | `sunucu.json`, `AndroidManifest.xml:20` | HTTPS'e geçince kapatın |
| A10 | Düşük | Bilet koltuk kilidini herkes silebilir; kilit satışı engellemediği için etkisi sınırlı | `public-rules.js:841` | Sahibine bağlayın |
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

1. E2 için karar: randevu girişi yöntemi. E1 kararı uygulandı (`guvenlik/sunucu-rolleri`).
2. `mysql2` yükseltmesi, `package.json` test satırı ve `sw.js` güncellemesi.
3. `cloud.test.js`'i test veritabanıyla çalıştırma.
4. `sunucu.json` HTTP adresini kaldırıp paketleri yeniden derleme.
5. Canlıda `data/` kod klasöründe kaldıysa: **bu açık yayında bulunduysa `NEBSOFT_SECRET`, veritabanı parolası ve entegrasyon anahtarlarını değiştirin**, sunucu günlüklerinde `..` ve `%2e` içeren istekleri arayın.
6. Avukat soruları (Bölüm 5).
