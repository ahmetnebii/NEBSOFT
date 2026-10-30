# Entegrasyon altyapısı — analiz ve araştırma raporu

Tarih: 27.10.2026 · Kapsam: `core/integrations.js`, `server.js` (yerel köprü), `server/connectors/*`, `server/cloud/bridge.js`, `apps/*`.

## 1. Mevcut envanter

**13 genel tür** (`DEFS`): SMS, WhatsApp, e-posta, fiş yazıcı, etiket yazıcı, terazi, POS/ödeme terminali, e-Fatura/e-Arşiv, online ödeme, barkod okuyucu, webhook, yedekleme.
**41 sektörel bağlayıcı** (`CONN`), yaklaşık 150 firma adı: e-İrsaliye, e-SMM, e-Müstahsil, e-Defter, ÖKC (Ingenico, Beko, Hugin, Profilo, Pavo, Verifone, PayGo), yemek platformları, yemek kartları, Caller ID, pazaryerleri (Trendyol, Hepsiburada, n11, Amazon, Pazarama, Çiçeksepeti, İdefix), kargo (Yurtiçi, Aras, MNG, Sürat, PTT, HepsiJet, …), MEDULA, İTS, ÜTS, ecza depoları, e-Nabız, e-Reçete, KPS, VETBİS, PETVET, KBS, OTA kanal yöneticileri, kartlı kilitler, santral, araç bildirimi, HGS/OGS, GPS, turnike, MEB, online ders, SGK, PDKS, e-Bordro, banka, muhasebe aktarımı, takvim, Google İşletme, ilan portalları, TRAMER, yedek parça, ANPR, kantar, PLC.
Her programda yalnızca o programın kodunda kullanılan türler gösterilir (`USED`).

## 2. Gerçekte ne çalışıyor?

| Tür | Durum |
|---|---|
| Trendyol, Hepsiburada | **Gerçek API adaptörü** (`server/connectors`), bağlantı testi, sipariş/stok/fiyat. |
| SMS (Netgsm, İleti Merkezi, Verimor, Mutlucell, Twilio) | İstek oluşturucu var; test gerçek SMS gönderir. Ücretsiz doğrulama (bakiye) yok. |
| WhatsApp Cloud API | Gönderim kodu var. |
| Fiş yazıcı | Tarayıcı yazdırma, Web Serial ESC/POS, ağ yazıcısı (TCP 9100, yerel köprü) — gerçek. |
| Etiket yazıcı | Tarayıcı; ZPL/TSPL ağ yazıcısı (köprü). |
| Terazi | Etiketli terazi barkodu çözümleme; Web Serial ile okuma (CAS/Dibal, Toledo, otomatik). |
| Barkod | Klavye (HID) okuyucu; kamera (`core/scan.js`). |
| POS terminali | Manuel, kullanıcı tanımlı "terminal servis adresi" veya demo. **Üretici entegrasyonu yok.** |
| e-Fatura | Yalnızca simülasyon ve "Özel API". Paraşüt/Uyumsoft/Logo/Sovos/Mysoft/EDM seçildiğinde fatura **gönderilmiyordu ama "kuyruğa alındı" diye başarılı gösteriliyordu** → düzeltildi (artık başarısız döner ve açıkça söyler). |
| Online ödeme (iyzico, PayTR, Param, Stripe) | iyzico: E-ticaret vitrininde Checkout Form var, canlı mod test hesabıyla doğrulanana kadar kapalı (`docs/urun/ETICARET-ODEME.md`). PayTR, Param, Stripe: yalnızca anahtar saklama, ödeme kodu yok. |
| 41 sektörel bağlayıcı | "Simülasyon" veya kullanıcının verdiği ara servis adresine `{action, payload}` JSON. **Firmaya özel adaptör yok.** |

**Bağlantı yöntemleri:** REST (köprü `/api/istek`), ham TCP (`/api/yazdir`, yeni `/api/tcp-test`), Web Serial (yalnızca Chromium), HID klavye, kamera, webhook gelen kutusu (`/api/webhook/<kanal>`), masaüstü uygulamasında yerel köprü (`nebsoftDesktop.bridge` → 127.0.0.1:5051'de `server.js`).

**Eksikler:** firma rehberi yoktu; test davranışı tutarsızdı (kimi gerçek gönderim, kimi sahte başarı); durum takibi yoktu; yarım kurulum saklanmıyordu; gizli alanlar ayar deposunda düz metin (cihazda localStorage, bulutta `app_data`) — sunucu tarafı şifreleme önerilir (bkz. 5).

## 3. Firma araştırması (bu sürüm)

| Firma | Ürün | Yöntem | Gerekli bilgiler | Kaynak | Doğrulama | Test | Kısıt |
|---|---|---|---|---|---|---|---|
| Trendyol | Satıcı API | REST, Basic Auth | Satıcı ID, API Key, API Secret, User-Agent “SatıcıID - SelfIntegration” (alfanümerik, ≤30) | [Yetkilendirme](https://developers.trendyol.com/v2.0/docs/authorization), [Başlarken](https://developers.trendyol.com/tr/v3.0/docs/getting-started-1) | **Doğrulandı** (menü: Hesap Bilgilerim → Entegrasyon Bilgileri; yalnızca ana kullanıcı görür; test/canlı bilgileri farklı; 401/403/429; 10 sn'de 50 istek) | Gerçek: son 1 sipariş (salt okuma) | Köprü gerekir |
| Netgsm | SMS API | REST | Kullanıcı kodu, şifre, mesaj başlığı | [Doküman](https://www.netgsm.com.tr/dokuman/) (dinamik sayfa, okunamadı), [resmî GitHub](https://github.com/netgsm1/sms) | **Kısmen** (yalnızca 00 başarı, 30 kimlik/API yetkisi/IP, 40 başlık tanımsız) | Gerçek: kendi numaraya 1 SMS (ücretli) | API kullanıcısı menü yolu doğrulanamadı |
| İleti Merkezi | SMS API | REST (JSON), key + hash | API anahtarı, API hash, gönderici adı | [Bakiye (JSON)](https://www.toplusmsapi.com/en/hesap/bakiye/json), [resmî PHP SDK](https://github.com/iletimerkezi/iletimerkezi-php) | **Doğrulandı** (key/hash panelin ayarlar bölümünde; 200/400/401/404; sabit IP kısıtı 401 verir). Ayarlar içindeki alt menü adı dokümanda yok, yazılmadı | Gerçek, ücretsiz: `POST api.iletimerkezi.com/v1/get-balance/json` → kalan SMS kredisi | Köprü gerekir |
| Verimor | SMS API | REST, kullanıcı adı + API şifresi | 12 haneli kullanıcı adı (90…), API şifresi, başlık | [SMS API dokümanı](https://github.com/verimor/SMS-API/blob/master/user_guide.md) | **Doğrulandı** (API şifresi ve izinli IP: OİM → SMS Ayarlarım, oim.verimor.com.tr/sms_settings/edit; IP girilmezse 401) | Gerçek, ücretsiz: `v2/balance` + `v2/headers`; girilen başlık hesapta yoksa uyarır | Sunucu IP’si izinli listede olmalı |
| WhatsApp Cloud API (Meta) | Business Cloud API | REST, Bearer jeton | Phone number ID, kalıcı erişim jetonu, Graph sürümü, şablon | [Get started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), [Access tokens](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/) | **Doğrulandı** (Phone number ID: App Dashboard → WhatsApp → API Setup; kalıcı jeton: Business Settings → System users → Assign Assets → Generate token; izinler business_management, whatsapp_business_messaging, whatsapp_business_management) | Gerçek, ücretsiz: numara bilgisi okunur (`GET /{phone-number-id}`). **Bu geliştirme ağında Meta’ya TLS bağlantısı kurulamadığı için gerçek Meta yanıtıyla denenemedi** | 24 saat penceresi dışında şablon zorunlu |
| Hepsiburada | Satıcı API (listeleme, sipariş) | REST, Basic Auth | Merchant ID (GUID), kullanıcı adı, şifre / servis anahtarı | [Servis anahtarı](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&product=api-authentication&version=v1.0&guide=entegratore-servis-anahtari-eklemegoruntuleme&view=guide), [SSS](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&product=entegrasyonda-sikca-sorulan-sorular&version=v1.0&guide=sikca-sorulan-sorular&view=guide), [Listeleme](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=listeleme&product=listeleme&version=v1&guide=listing-bilgilerini-guncelleme-1&view=guide) | **Kısmen doğrulandı** (servis anahtarı: Bilgilerim → Entegrasyon → Entegratör Bilgileri → Servis Anahtarı; kendi yazılımı için Yardım Merkezi → Talepler → Yeni talep → API ENTEGRASYON – API Entegratör Yetkilendirme İşlemleri; test adresleri “-sit”; dakikada ~240 istek). Kullanıcı adı/şifrenin hangi değere karşılık geldiği dokümanda genel olarak yazmıyor, varsayım yapılmadı. Portal otomatik okumaya kapalı, tarayıcıyla okundu | Gerçek: 1 listeleme kaydı (salt okuma). Sahte bilgiyle 401 “Merchant api authorization failed” alındı | Köprü gerekir |
| n11 | REST API | REST, appKey + appSecret başlıkları | API anahtarı, API şifresi | [API hesapları](https://magazadestek.n11.com/satis-surecleri/api-hesaplarina-nereden-ulasilir-2285), [Satıcı ürün sorgulama](https://developer.n11.com/documentation/n11-marketplace-entegrasyonu/satici-urun-sorgulama/) | **Doğrulandı** (Satıcı Ofisi → Hesabım → Api Hesapları → Yeni Hesap Oluştur; şifre kayıtlı e-postaya gelir; Authorization kullanılmaz) | Gerçek: `GET api.n11.com/ms/product-query?size=1`. Sahte bilgiyle 401 “SellerApiUserUnauthorizedException” alındı | NEBSOFT’ta n11 sipariş/stok adaptörü henüz yok |
| Ağ fiş yazıcısı | ESC/POS | Ham TCP (çoğunlukla 9100) | IP, port | Endüstri standardı | **Standart protokol** (markaya özel menü yolu verilmedi) | Gerçek: TCP bağlantısı aç-kapat (kâğıt harcamaz) | Tarayıcı bağlanamaz; yerel köprü |
| USB/BT barkod okuyucu | HID | Klavye | Sonek (Enter/Tab) | Standart | **Standart protokol** | Gerçek: karakter hızı + sonek ölçümü | — |
| Paraşüt | e-Fatura / e-Arşiv (API v4) | OAuth2 (password grant) | CLIENT_ID, CLIENT_SECRET (destek@parasut.com), e-posta, şifre, firma no | [API v4](https://apidocs.parasut.com/) | **Doğrulandı** (jeton 2 saat, 10 sn’de 10 istek, adres /v4/<firma_no>) | Gerçek: jeton + /me ile firmalar listelenir. Sahte bilgiyle 401 invalid_client alındı | **Fatura gönderimi henüz yok** (kısmi destek olarak işaretli) |
| iyzico | Ödeme API | REST, IYZWSv2 HMAC-SHA256 imza | API Anahtarı, Güvenlik Anahtarı | [Sandbox](https://docs.iyzico.com/on-hazirliklar/sandbox), [HMACSHA256](https://docs.iyzico.com/on-hazirliklar/kimlik-dogrulama/hmacsha256-kimlik-dogrulama) | **Doğrulandı** (sandbox kaydı; Ayarlar → Firma Ayarları → API Anahtarları → Görüntüle) | Gerçek: imzalı BIN sorgusu. Sahte anahtarla 1001 “api bilgileri bulunamadı” alındı | Ödeme formu oluşturma henüz yok |
| Stripe | Payments API | REST, Bearer gizli/kısıtlı anahtar | sk_/rk_ anahtar | [API keys](https://docs.stripe.com/keys), [Balance](https://docs.stripe.com/api/balance/balance_retrieve) | **Doğrulandı** (Dashboard → API keys; kısıtlı anahtar önerilir) | Gerçek: GET /v1/balance. Sahte anahtarla 401 alındı | Ödeme formu oluşturma henüz yok |
| PayTR | Ödeme | REST, imza | merchant_id, merchant_key, merchant_salt | [dev.paytr.com](https://dev.paytr.com/) | **Kısmen** (alanlar resmî kod örneklerinden; panel yolu doğrulanamadı) | Yok (ödeme oluşturmadan doğrulanmış test isteği bulunamadı) | — |
| Param | Sanal POS | SOAP | CLIENT_CODE, CLIENT_USERNAME, CLIENT_PASSWORD, GUID | [dev.param.com.tr](https://dev.param.com.tr/) (bu ağdan erişim engelli) | **Kısmen** (bilgiler Param verir; test ortamı için IP bildirimi) | Yok | SOAP bağlantısı henüz yok |
| Twilio | SMS | REST, Basic (SID + Auth Token) | Account SID, Auth Token, gönderen numara | [Account resource](https://www.twilio.com/docs/iam/api/account) | **Doğrulandı** | Gerçek: hesap bilgisi (durum, Trial/Full). Sahte bilgiyle 401 / 20003 alındı | Trial hesap yalnızca doğrulanmış numaralara gönderir |
| Mutlucell | SMS | XML | kullanıcı adı, şifre, başlık | [resmî PHP paketi](https://packagist.org/packages/mutlucell/api) | **Kısmen** (resmî doküman bulunamadı) | Gerçek SMS gönderimi (ücretli) | — |
| Yurtiçi, Aras, MNG/DHL, Sürat, PTT, HepsiJet | Kargo | SOAP / REST, sözleşmeli | Firma tarafından verilen servis bilgileri | Açık resmî doküman yok (HepsiJet: Developer Portal, X-Auth-Token) | **Desteklenmiyor** — bulunan ön koşullar rehberde, kurulum etkinleştirilemez | Yok | Sözleşme + NEBSOFT’ta adaptör gerekir |
| Uyumsoft, Logo, Sovos, Mysoft, EDM | e-Fatura | — | — | — | **Desteklenmiyor** | Yok | Kurulum etkinleştirilemez |
| Ingenico, Beko, Hugin, Profilo, Pavo, Verifone, PayGo | ÖKC (GMP3) | SDK / anlaşma | — | — | **Desteklenmiyor** | Yok | Üretici SDK'sı + yerel köprü servisi gerekir |
| Diğer ~130 firma | — | — | — | — | **Araştırılmadı** — sihirbaz "Rehber hazırlanıyor" der, menü yolu uydurmaz, test yoksa başarı göstermez | — | — |

## 4. Yapılanlar

- **Entegrasyon Merkezi** (`core/integ-wizard.js`): 7 kategori, arama, kart başına durum (Bağlı / Kurulum gerekli / Bağlantı hatası / Test ediliyor / Desteklenmiyor; dürüstçe Simülasyon / Test edilmedi / Hazır-temel mod), yeniden kontrol düğmesi. Eski ekran "Kayıtlar ve gelişmiş ayarlar"da duruyor.
- **6 adımlı sihirbaz:** sağlayıcı → ön koşullar → bilgiler nereden → dinamik form (alan yardımı: ne / neden / nereden / biçim / yanlışsa; şifre göster-gizle; kopyalanabilir örnek; doğrulama) → gerçek test (anlaşılır sonuç + çözüm, teknik ayrıntı ayrı, kimlik bilgisi maskeli) → kaydet. "Kaydet ve sonra devam et"; kapatıp açınca kaldığı yerden sürer.
- **Rehber kaydı** (`core/integ-guides.js`): arayüzden ayrı, firma eklemek için yalnızca kayıt eklenir.
- **Yerel köprü** `/api/tcp-test`: yalnızca özel ağ IP'lerine bağlantı denemesi.
- **e-Fatura sahte başarısı kaldırıldı.**

## 5. Önerilen sonraki altyapı

1. **Gizli alanların sunucuda şifrelenmesi:** entegrasyon kimlik bilgileri `app_data` yerine `NEBSOFT_SECRET` ile şifrelenen ayrı bir tabloda; istemciye yalnızca "kayıtlı" bilgisi dönsün, istekler sunucuda kimlikle birleştirilsin.
2. **Local Device Agent:** masaüstü uygulamasındaki köprü (`127.0.0.1:5051`) cihaz sürücü eklentileriyle genişletilsin: seri port (Web Serial olmayan tarayıcılar için), ÖKC üretici SDK'ları (GMP3), kapı kilidi ve PDKS cihazları. Tarayıcı ↔ ajan arasında yerel eşleştirme anahtarı.
3. **Firma rehberlerinin genişletilmesi** (öncelik sırası): Yurtiçi/Aras/MNG (sözleşme gerekir), Paraşüt (OAuth), iyzico/PayTR (sunucu tarafı ödeme oluşturma ile birlikte).
4. Her yeni firma için aynı kural: resmî dokümanla doğrulanmadan menü yolu yazılmaz, gerçek test yoksa başarı gösterilmez.

## 6. Güncelleme — 27.10.2026 (2. tur)

- İleti Merkezi, Verimor ve WhatsApp Cloud API rehberleri eklendi; üçünde de bağlantı testi ücretsizdir (SMS/mesaj gönderilmez).
- İleti Merkezi ve Verimor testleri gerçek sunuculara karşı denendi: sahte bilgilerle dokümandaki yanıtlar birebir alındı (401 “Üyelik bilgileri hatalı”, 401 “Geçersiz kullanıcı adı/şifre”) ve sihirbaz doğru çözümü gösterdi.
- WhatsApp varsayılan Graph API sürümü v19.0’dan v23.0’a alındı (eski sürümler belirli süre sonra kapatılır; alan düzenlenebilir).
- Köprü hataları artık nedeni (ör. sertifika, DNS) içeriyor; sihirbaz sertifika/proxy ve DNS sorunlarını ayrıca açıklıyor.

## 7. Güncelleme — 27.10.2026 (3. tur)

- Hepsiburada rehberi gerçek kurulum akışıyla yeniden yazıldı; n11 rehberi eklendi. İkisinde de bağlantı testi salt okumadır.
- Merchant ID için GUID biçim kontrolü eklendi (biçimsiz kimlikte Hepsiburada 400 döndürüyor).
- Sağlayıcı hata yanıtında geri yazılan gizli alanlar (ör. Hepsiburada kullanıcı adı) teknik ayrıntıda maskeleniyor.
- Önerilen sonraki iş: n11 için sipariş/stok aktarım adaptörü (resmî sipariş listeleme ve fiyat-stok güncelleme servisleri developer.n11.com’da mevcut).

## 8. Güncelleme — 27.10.2026 (4. tur: kalan sağlayıcılar)

- **n11 adaptörü** (server/connectors/n11.js): bağlantı testi, sipariş çekme (/rest/delivery/v1/shipmentPackages, 15 gün, sayfa 100), fiyat-stok gönderme (/ms/product/tasks/price-stock-update, 1000’lik parti), görev sonucu (/ms/product/task-details/page-query). Pazaryeri programında n11 canlı moda alınabiliyor; ürünler satıcı stok kodu (SKU, yoksa barkod) ile eşleniyor.
- Yeni rehberler: Paraşüt, iyzico, Stripe, PayTR, Param, Twilio, Mutlucell ve 6 kargo firması. Toplam 34 firma/cihaz rehberi.
- Kısmi destek: Paraşüt (fatura gönderimi yok) ve online ödeme (ödeme formu yok) kartta “Kısmi destek”, sihirbazda “Bu sürümdeki sınır” notuyla gösteriliyor.
- Tüm gerçek testler bu ağdan canlı sunuculara karşı sahte bilgilerle denendi; her biri dokümandaki hata yanıtını döndürdü ve doğru açıklandı.

**Kalan iş (bilerek yapılmadı):** Paraşüt üzerinden fatura gönderme akışı (müşteri → satış faturası → e-Fatura/e-Arşiv iş takibi), online ödeme formu ve sonuç bildirimi, kargo adaptörleri (sözleşme ve test hesabı gerekir), ÖKC üretici SDK servisleri. Bunlar gerçek test hesabı olmadan “çalışıyor” denemeyecek işlerdir.

## 9. Güncelleme — 27.10.2026 (5. tur: güvenlik, cihazlar, kalan firmalar)

**Kimlik bilgilerinin şifrelenmesi (yapıldı)**
- `server/cloud/secrets.js`: "entegrasyon" verisindeki gizli alanlar (şifre, anahtar, jeton, secret, hash, client id/secret, mağaza anahtarları, başlık JSON'u) veritabanına yazılırken AES-256-GCM ile şifrelenir (`enc:v1:` önekli). Anahtar mevcut sunucu anahtarıdır (`NEBSOFT_SECRET` veya `data/secret.key`).
- Şifreli tutulan yerler: `app_data` ve `app_data_history`. Çözme yalnızca o işletmenin oturum açmış kullanıcısına yapılan okuma ve çakışma yanıtında olur.
- Önceden düz metin kaydedilmiş veriler sunucu açılışında bir kez şifrelenir (tekrar çalıştırmak bir şey değiştirmez).
- Kurulum sihirbazı yarım kalan taslağa gizli alan yazmaz; devam ederken yeniden ister.
- Sınır: Program istekleri tarayıcıda hazırladığı için çözülmüş bilgiler oturum açmış kullanıcının cihazında bulunur. Tamamen sunucuda tutmak için isteklerin sunucu tarafında imzalanması gerekir (sonraki adım).

**POS Cihazı Entegrasyonu eklentisi (düzeltildi)**
- "Yakında" olarak işaretlendi: Mağazada satın alınamaz, sunucu siparişi reddeder ("Geçersiz ürün veya paket"). Müşteri "Hazır olunca haber ver" ile talep bırakabilir (yönetimde talep olarak düşer).

**Terazi ve POS cihazı: marka → cihaz türü → bağlantı yöntemi (yapıldı)**
- Terazi: Mettler Toledo (MT-SICS; `SI` komutu), CAS (PD-II; 9600 7E1 ve `W` komutu, topluluk kaynağı), Dibal, DIGI, Bizerba, diğer. Cihaz türleri etiket basan, kasaya bağlı ve ikisi birden. Yöntemler etiket barkodu (GS1 20–29 ön ekleri) ve seri port.
  - Testler gerçek: Etiket barkodunda PLU ve ağırlık çözülür; seri portta Web Serial ile teraziden ağırlık okunur.
  - Seri bağlantıya veri biti, parite ve dur biti ayarı eklendi (7E1 cihazlar için).
- POS cihazı: Ingenico, Verifone, Beko, Hugin, Pavo, PayGo ve diğer. Cihaz türleri bağımsız banka POS'u, yazarkasa POS (ÖKC) ve üretici servisli terminal. Yöntemler manuel onay, terminal servisi ve doğrudan GMP3.
  - Doğrudan GMP3 bağlantısı "desteklenmiyor" olarak gösterilir ve kaydedilemez.

**Kalan firmalar (araştırıldı ve işaretlendi)**
- Kurulum bağlayıcılarındaki 150 sağlayıcının tamamı ile genel türlerin yöntemleri için toplam **196 rehber** var.
  - 9 sağlayıcı resmî dokümanla doğrulandı ve gerçek testli.
  - 26 sağlayıcı kısmen doğrulandı.
  - 11 kayıt standart protokol veya temel mod.
  - 150 sağlayıcı "Henüz desteklenmiyor": neyin gerektiği, kimden alınacağı ve bulunan kaynaklarla birlikte.
- Bulunan resmî / birincil kaynaklar:
  - SGK MEDULA web servis kılavuzu (Basic Authentication, eczane kullanıcı adı / şifresi)
  - TİTCK İTS (GLN + şifre, eczaneler için sabit IP)
  - Jandarma KBS uygulama dokümanı (otel programlarından web servisle bildirim)
  - HotelRunner Custom Apps (PMS sandbox)
  - Booking.com Connectivity
  - Hikvision ISAPI (digest, dinleme modu)
  - İş Bankası API portalı
  - Google Calendar OAuth
- Gerçek bağlantıya en yakın olanlar:
  - Yemek platformları ile Amazon, Pazarama ve Çiçeksepeti: NEBSOFT'un webhook gelen kutusu siparişleri alabilir. Platformların güncel programı resmî kaynaktan doğrulanamadığı için "kısmen doğrulandı" olarak işaretlendi.
- Erişilemeyen: NVİ KPSPublic (MERNİS doğrulama) bu ağdan hata sayfası döndürdü.

**Hâlâ gerçek bağlantısı olmayan büyük işler (sözleşme veya yetki gerekir):** resmî kurum servisleri (MEDULA, İTS, KBS, e-Nabız, SGK), kanal yöneticileri, banka API'leri, kartlı kilit ve PDKS cihazları, kargo adaptörleri, Paraşüt fatura gönderimi, ödeme formu, ÖKC SDK servisi.

## 10. Güncelleme — 27.10.2026 (6. tur)

**Gizli bilgiler artık tarayıcıya hiç gitmiyor (bulut)**
- Okumada (`GET /api/data/:app`) gizli alanların yerine `__nsg_<program>_<grup>_<alan>__` yer tutucusu döner. Kapsam:
  - entegrasyon → `cfg`
  - pazaryeri → `channels` (önceden düz metin duruyordu)
  - POS hızlı ticaret → `qcChannels` (önceden düz metin duruyordu)
- Dış servis isteklerinde (`/api/istek`, `/api/kanal`) yer tutucular sunucuda, yalnızca o işletmenin şifreli değeriyle değiştirilir. URL, başlık, gövde ve `Basic` base64 içindeki yer tutucular da çözülür.
- Program ayarları yer tutucuyla geri kaydederse mevcut şifreli değer korunur; yeni değer yazılırsa o şifrelenir.
- Webhook imzası anahtar tarayıcıda olmadığında sunucuda hesaplanır (`X-Nebsoft-Sign` → `X-Nebsoft-Signature`).
- Masaüstü uygulamasında yer tutucu içeren istekler yerel köprü yerine bulut sunucusuna gider.
- Sınır: iyzico imzası tarayıcıda hesaplandığı için kayıtlı anahtarla test edilemez; sihirbaz anahtarların yeniden girilmesini ister.
- Sahte veritabanıyla uçtan uca doğrulandı:
  - Okumada değer yok.
  - Geri kaydetmede değer korunuyor.
  - URL, Bearer, Basic ve gövde çözülüyor.
  - Başka işletme değeri alamıyor.

**Kantar (gerçek okuma)**
- Seri port (Web Serial) ve ağ indikatörü (TCP, yerel köprü `/api/tcp-oku`, yalnızca özel ağ adresleri).
- Gelen metinden ağırlık çözülür; kantarda tam sayılar kilogram kabul edilir.
- Fabrika programının "Kantar" tartımı artık gerçek cihazdan okur.
- Sahte bir indikatörle denendi: sihirbaz testi ve uygulama çağrısı 12.540 kg okudu; yanlış portta "İndikatöre erişilemiyor" açıklaması alındı.

**Randevu takvim aboneliği (iCal)**
- `GET /api/takvim-adres` işletmeye ve her personele özel imzalı adresleri verir. `GET /api/takvim/<işletme>.ics` son 30 gün ve sonraki 180 günün randevularını yayınlar (iptaller hariç, Türkiye saati UTC'ye çevrilir).
- Etkinlikte yalnızca hizmet ve müşteri adı + soyadının baş harfi bulunur; telefon yok.
- Yanlış veya başka personelin imzası 404 döner.
- Google / Outlook / Apple takvimine "URL ile abone ol" ile eklenir; tek yönlüdür.

## 11. Güncelleme — 28.10.2026 (7. tur: herkese açık belgesi olan entegrasyonlar)

Durum sayıları: doğrulandı 10 · kısmen doğrulandı 26 · standart protokol 28 · henüz desteklenmiyor 132 (önceki tur: 147).

| Entegrasyon | Ne yapılıyor (gerçek) | Nasıl test edildi | Sınır |
|---|---|---|---|
| Modbus TCP (`plc:modbus`) | Yerel köprü `/api/modbus`: fn 1/2/3/4 okuma, 32 bit sayaç; Fabrika → Bakım & OEE → “Makine sayaçlarını oku” değeri istasyon kartına yazar | `server/test/proto.test.js` sahte PLC (okuma, yazma, istisna 2 ve 11, kapalı port, internet adresi reddi); tarayıcıda sihirbaz + Fabrika ekranı | Yalnızca yerel ağ adresi; PLC'ye yazılmaz |
| MQTT (`plc:mqtt`) | Yerel köprü `/api/mqtt`: MQTT 3.1.1 bağlan / abone ol / tutulan mesaj, JSON alan yolu, TLS 8883 | Sahte aracı (CONNACK 4, joker konu) + gerçek `broker.emqx.io` yayın→okuma ve TLS | Cihaz değeri sürekli yayınlamıyorsa “retained” gerekir |
| OPC-UA | — | — | Desteklenmiyor; ağ geçidi MQTT / Modbus yayınlıyorsa o seçenek önerilir |
| Kargo takip (8 firma) | Gönderide “Takip et”: Yurtiçi, Aras, Sürat, HepsiJet, UPS doğrudan numarayla; PTT, MNG/DHL eCommerce, Kolay Gelsin numarayı adresle almadığı için numara panoya kopyalanıp takip sayfası açılır | Her firmanın sitesinde örnek numarayla tarayıcıda denendi (Yurtiçi/Aras “bulunamadı”, Sürat/UPS sonuç, HepsiJet “numara hatalı” yanıtı) | Gönderi oluşturma / barkod sözleşmeli API ister; bağlı değil ve uygulama bunu söyler, takip numarası elle girilir |
| Zoom (`onlineders:zoom`) | Server-to-Server OAuth ile her derse ayrı toplantı (`POST /v2/users/me/meetings`) veya kalıcı oda bağlantısı | Gerçek `zoom.us/oauth/token` uç noktası: sahte bilgiye `invalid_client` → Türkçe hata | Toplantı uygulamayı oluşturan kullanıcı adına açılır |
| Google Meet / Teams | Kalıcı toplantı bağlantısı velilere gönderilir; bağlantı biçimi doğrulanır | Biçim denetimi (meet.google.com/xxx-xxxx-xxx, teams.microsoft.com/l/meetup-join, teams.live.com/meet) | Ders başına oda açmak Google / Microsoft OAuth ister; yok |
| Google Takvim / Outlook | İmzalı iCal aboneliği; artık Randevu + Klinik (hekim bazında) + CRM görevleri | `server/test/takvim.test.js` (Randevu imzası eskisiyle aynı, iptaller hariç, telefon yok, yanlış imza 404) | Tek yönlü; yenileme sıklığını takvim uygulaması belirler |

Ayrıca: iCal / Google / Outlook seçiliyken randevu kaydında görülen “servis adresi tanımlı değil” hatası giderildi (takvim akışla çalışır, ayrıca gönderim yapılmaz). Online ders API'si başarısız olursa artık başka bir bağlantı sessizce gönderilmez.
