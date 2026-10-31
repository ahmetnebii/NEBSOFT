# Bağımsız test raporu: Düğün, Yurt, Fotoğrafçı, Oyun

Tarih 31.10.2026. Dal `claude/rezervasyon-aile-c6d113`, taban `d5f4e06`. Push ve merge yapılmadı. Denetçi önceki raporları kanıt saymadı; aşağıdaki her sonuç bu oturumda çalıştırıldı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Sorun | Kanıt | Kim çözer |
|---|---|---|---|
| E1 | **Çift rezervasyon sunucuda engellenmiyor.** Engel yalnız tarayıcıda. İki personel aynı salon, tarih ve seansı aynı anda alırsa birleştirme iki kaydı da tutar. Yurtta aynı yatak, fotoğrafta aynı fotoğrafçı, oyunda aynı alan da aynı yoldan geçer (kod okuması, denenmedi). | Gerçek sunucu ve MariaDB: ikinci PUT 409, istemci davranışıyla birleştirilip gönderilince 200. Aynı salon, tarih ve seansta **2 etkinlik** kaldı, müşteri takvimine de iki kez gitti. | Sunucu: `server/cloud/routes.js` yazma denetimi veya birleştirme sonrası program kuralı |
| E2 | **Rol atanmamış programda tam erişim.** Ekip üyesinin rolü yalnız bir programda tanımlıysa diğer programlarda filtre çalışmaz. Oyun görevlisi hesabı, aynı işletmede yurt açıksa öğrenci sağlık ve kimlik bilgisini okuyabilir. | Yurt `gorevli` hesabı `GET /api/data/oyun` çağrısında 200 ve filtresiz belge aldı. Neden `rolCoz` (`server/cloud/rol-kural.js:472`): rol yoksa `null`, yani kısıtsız. Yurt yönünü kod gösteriyor, yurt verisiyle ayrıca denenmedi. | Sunucu: rolü olan hesapta rolsüz programı reddet. Bugünkü davranışa güvenen var mı, karar gerekli |
| E3 | **Ç7: fotoğraf adresi kalıcı ve herkese açık.** Ayrıntı aşağıda. Bebek ve çocuk fotoğrafı da bu sınıfta. | Galeri kapatıldı, süresi bitirildi, çekim iptal edildi: `/f/...` girişsiz hâlâ 200, `public, max-age=31536000, immutable`, `noindex` yok. | Sunucu ve çekirdek, karar gerekli |
| E4 | **Kasiyerin sınır içi indirimi sessizce siliniyor.** Süre adisyonu açıkken indirim, sunucuda kalem toplamına göre sınanıyor; süre ücreti sayılmadığı için hesap 0 ₺ üzerinden yapılıyor. | `K.geriKoy('oyun','kasa',...)`: açık, kalemsiz adisyonda 5 ₺ indirim geri alındı, `redIslem: indirim`. | Sunucu: `rol-kural.js:293`, `ara` süre ücretini de saymalı |
| E5 | **Fotoğrafçı teslimi tutanaksız kalabilir.** Sunucu `status` alanını kabul ediyor, `delivered` alanını atıyor. Talep aşamasını kapora almadan atlamak da sunucuda açık. | `geriKoy`: durum `teslim`, tutanak `undefined`. Arayüzde bu iki düğme fotoğrafçıya kapatıldı (D13), sunucu açığı duruyor. | Sunucu: `izinli` listesi veya durum geçişi denetimi |
| E6 | SMS gerçek hesapla hiç denenmedi. Netgsm alan adları bu denetimde resmî kaynaktan okunamadı. Verimor'da ticari ileti alanları gönderilmiyor. | Entegrasyon tablosu | Sağlayıcı test hesabı, çekirdek |
| E7 | GSB yönetmeliği md. 37 metni bu denetimde okunamadı; %50 ve 15 Eylül oranı doğrulanamadı. | Entegrasyon tablosu | Elle okuma veya hukuk |
| E8 | Önceden bilinenler değişmedi: fiyatlar örnek, sözleşme ve taahhütname şablonları avukat kontrolü bekliyor, kapora iadesi ve cayma mevzuatı, oyun salonu yaş kuralı, e-Belge bağlı değil. | `docs/urun/RAPOR-rezervasyon-aile.md` | Kullanıcı, avukat |

### Ç7 değerlendirmesi

Gerçek sunucuda denendi.

| Soru | Sonuç |
|---|---|
| Girişsiz müşteri adresi öğrenebilir mi? | Hayır. Görünüm boş, adres yalnız kendi girişiyle gider. |
| Başka müşterinin galerisi görünür mü, seçim yazılır mı? | Hayır. Adres gelmedi, seçim 403. |
| Adres tahmin edilebilir mi? | Pratikte hayır: 128 bit rastgele kimlik. |
| Adresi bilen girişsiz açabilir mi? | **Evet.** Bağlantı iletilirse, sohbete yapıştırılırsa, ekran paylaşılırsa açılır. |
| Galeri kapanınca, süresi dolunca, çekim iptal olunca erişim kesilir mi? | **Hayır.** Müşteri ekranından kaybolur ama adres çalışır. |
| Silinince hemen gider mi? | **Hayır.** `sun()` yetim dosyayı kontrol etmiyor; dosya 7 gün bekler (`BEKLEME`). Kod okuması, denenmedi. `public` ve 1 yıl önbellek nedeniyle ara vekilde daha uzun kalabilir. |
| Arama motoru | `noindex` başlığı yok. Sayfada meta var, görsel adresinde yok. |

Sonuç: dış saldırgan için risk düşük, ama **geri alınamayan paylaşım** riski gerçek. KVKK silme talebinde "hemen kaldırıldı" denemez. Çocuk fotoğrafı için kabul edilmemeli.

Öneri, küçükten büyüğe: (1) `fotograf` için `private, no-store` ve `X-Robots-Tag: noindex`, yetim dosyayı sunma. (2) Asıl çözüm: `/f/` ucuna müşteri belirteciyle okuma; adres `<img>` ile yüklendiği için belirteç çerez veya kısa ömürlü imzalı adresle taşınır. Bu `core/core.js` NS.dosya ve `server/cloud/dosya.js` işidir, bu oturumda yapılmadı.

## Özet

| Program | Bulunan ve düzeltilen | Sunucu tarafında kalan | Sonuç |
|---|---|---|---|
| `dugun` | 9 | E1, ödeme tutarı değişebiliyor | Ana akış doğru, canlı için E1 şart |
| `yurt` | 6 | E1, E2 | Ana akış doğru, canlı için E2 şart |
| `fotograf` | 4 | E3, E5 | Ana akış doğru, canlı için E3 kararı şart |
| `oyun` | 7 | E4, bakiye eksiye düşebilir | Ana akış doğru |
| Müşteri sayfaları | Yanlış kodda uyarı çıkmıyordu, düzeltildi | | Dördü de bulut kipinde çalıştı |

## Test durumu

`npm test` zinciri tek tek, hata çıkınca durmadan çalıştırıldı: **65 adım, 64 geçti, 1 kaldı.**

- Kalan: `server/test/bilet-kural.test.js`. Görev notundaki bilinen gece kırılması, saat 01.28'de 400 verdi. Bu dalın dosyalarıyla ilgisi yok, düzeltmesi ayrı dalda. Bu yüzden "npm test geçti" denemez.
- GİB XSD testi .NET SDK ile çalıştı, atlanmadı. `dosya.test.js` çıktısındaki "atlandı", testin kendi bozuk görsel senaryosunun iletisidir.
- Eklenen testler `apps/*/hesap.test.js` içindedir: dugun 10, yurt 11, fotograf 6, oyun 12 kontrol. Mevcut test gevşetilmedi.
- `app.js` içindeki düzeltmelerin otomatik testi yok (DOM gerekir), tarayıcıda denendi. Hesap işlevine indirilebilenler `hesap.js` üzerinden sınanıyor.
- Yurt testine ilk yazdığım 25.000 ₺ beklentisi benim hesap hatamdı. Elle yeniden sayınca 30.000 ₺ çıktı, kod doğruydu, test beklentisi düzeltildi. Bu bir gevşetme değildir.
- Tüm düzeltmeler ayrıca tarayıcıda denendi: saat 01.31'de izinsiz çıkan öğrenci "Geç kaldı" listesine düştü, doğum günü 7.400 + ek fark 7.600, 13 çocuk 10.500 ₺, paket değişiminde 38.000 ₺, telefon değişince veli kodu düştü, aynı telefonda kaldı.

## Düzeltilen hatalar

| # | Program | Hata | Etki | Düzeltme |
|---|---|---|---|---|
| D1 | dugun | Yalnız not düzenlemek güncel fiyatı kayda yazıyordu (290.000 → 400.000 ₺) | Müşterinin donmuş fiyatı sessizce artıyordu | `H.fiyatKorunur` |
| D2 | dugun, fotograf | Kapora toplamı aşabiliyordu (Kalan -9,5 milyon ₺) | Kasa ve rapor bozuluyordu | Üst sınır |
| D3 | dugun | Tanımı olmayan ek hizmet düzenlemede siliniyordu | Sözleşme kapsamı kayboluyordu | Hizmet korunur, örnek veriye `ref` |
| D4 | dugun | İmzasız kayıtta tutar veya tarih değişince plan ve sözleşme eski kalıyordu | Plan toplamı borçla tutmuyordu | `H.planYenile`, imzasız sözleşme kaldırılır, uyarı çıkar |
| D5 | dugun | Operasyon rolü takvimden ve listeden yeni etkinlik açabiliyordu; sunucu kaydı atıyor, ekran "opsiyonlandı" diyordu | **Sahte başarı.** Sunucuda 200 döndü, kayıt yoktu | Düğme ve form role bağlandı |
| D6 | dugun | Opsiyonda tahsilat alındıysa kesinleştirme kaporayı ikinci kez alıyordu | Çift kapora | Varsayılan tutar ve işaret düzeltildi |
| D7 | dugun | Müşteri sayfası demosunda "fiyat gösterme" ayarı çalışmıyordu; telefon boşken metin bozuk çıkıyordu | Küçük | Düzeltildi |
| D8 | yurt | Öğrenci düzenlenince **veli kodu siliniyordu** | Veli portala giremiyordu | `H.veliGuncel`. Telefon değişirse kod bilerek düşer |
| D9 | yurt | Depozito iadesi sonradan ödenince barınma ödemesinden düşüyordu (37.333 → 25.333 ₺) | Ödenen yanlış görünüyordu | İki ayrı satır |
| D10 | yurt | Son giriş denetimi gece yarısında kapanıyordu | 00.00-06.00 arası dönmeyen öğrenci "geç kaldı" görünmüyordu | `H.geceMi` |
| D11 | yurt | Bahar veya yaz kaydında ayrılışa "15 Eylül: bir aylık ücret" uygulanıyordu | Kurum 30.000 ₺ yerine 10.000 ₺ öneriyordu | Yalnız 15 Eylül'ü kapsayan kayıtta |
| D12 | yurt | Telefonda yatak (23 px) ve yoklama (27 px) düğmeleri küçüktü; koyu temada "Boş yatak" okunmuyordu (2,9:1) | Nöbetçi telefondan kullanır | Program CSS'i |
| D13 | fotograf | Paket değişince ad değişiyor, **fiyat eski kalıyordu** (Düğün Tam Gün 12.000 ₺). İmzalı sözleşmede tutar sessizce değişebiliyordu. Fotoğrafçı kaporasız kesinleştirip tutanaksız teslim edebiliyordu | Yanlış fatura, kanıtsız teslim | Fiyat yenilenir, imzalıda engellenir, düğmeler role bağlandı |
| D14 | dugun, fotograf | Telefonda takvim şeridi 34x7 px, dokununca etkinlik yerine yeni kayıt formu açılıyordu | Telefondan kayıt açılamıyordu | Dar ekranda güne dokununca o günün listesi |
| D15 | oyun | Hesabı kapatmaktan vazgeçince duraklatma bitiyordu | Müşteri molası ücretlendiriliyordu | Duraklatma geri yüklenir |
| D16 | oyun | Stok alanı boş ürün satılamıyordu | Stok tutmayan ürün kapalı kalıyordu | `H.stokBitti` |
| D17 | oyun | Doğum günü düzenlemesi kesin kaydı güncel fiyata çekiyordu (7.300 → 9.800 ₺) | Müşteri fiyatı değişiyordu | `H.rezKorunur` |
| D18 | oyun | Kasa "Bugün" son 24 saati gösteriyordu | Günlük kasa yanlıştı | Gün başından sayılır |
| D19 | oyun | Gece yarısını aşan parti çakışması görülmüyordu | Çifte rezervasyon | `cakisan` |
| D20 | oyun | Görevli üye kartında "0 ₺ yükleme" ve boş defter görüyordu | Yanıltıcı | Bölüm gizlendi |
| D21 | oyun | Kart sayfası demosu geçmiş tarih kabul ediyordu | Sunucu zaten reddediyor, demo tutarsızdı | İstemci denetimi |
| D22 | dört sayfa | Bulutta yanlış kodla girişte **hiçbir uyarı çıkmıyordu** | Müşteri neden girilemediğini bilmiyordu | Hata iletisi. 429 durumunda iki ileti görünebilir |
| D23 | dugun, yurt, fotograf | Dışa aktarma düğmesinin adı yoktu | Ekran okuyucu | `aria-label` |

`sw.js` sürümü `nebsoft-v3-89` oldu.

## Program başına denenen akış

Tutarlar önce elle hesaplandı, sonra ekranla karşılaştırıldı. Yenileme sonrası veri `localStorage`dan okundu.

### Düğün

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Opsiyon: Salı, 200 kişi × 1.450 + DJ 18.000 - 8.000 | 300.000 ₺ | Doğru, bitiş bugün + 7 |
| Aynı salon-seans, tüm gün çakışması | Engel | Doğru, tek tarayıcıda |
| Kesinleştir: %20 kapora, 3 taksit, 7 gün önce biter | 60.000 + 3 × 80.000 (09.01, 09.02, 09.03) | Doğru |
| Sözleşme, gerçek imza kanvası | İmza kaydı, kontrol listesi | Doğru. Kanvas ilk kez gerçek fareyle denendi |
| Kısmi tahsilat 50.000,50 ₺, aşım | Taksitte 29.999,50 kalır, aşım reddedilir | Doğru |
| İmzasız ek protokol | Toplam değişmez | Doğru. İmzasız protokolü sonradan imzalatan düğme yok, kalan eksik |
| İptal: 136 gün kala, ödenen 110.000,50, %50 | 55.000,25 ₺ | Doğru, Bekleyen iadeler, makbuz |
| Tarih boşaldı mı | Aynı gün yeni opsiyon açılır | Doğru |
| Düzenleme, plan yenileme | 19.000 + 3 × 31.333,33 (son 31.333,34) | Doğru, düzeltmeden sonra |

### Yurt

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Kayıt: 31.10, 227 gün = 8 ay × 14.000 | 112.000 ₺, 3 taksit, son 37.333,34 | Doğru |
| Dolu yatak, boş form | Seçilemez, uyarı | Doğru |
| Ayrılış GSB: 1 ay + 7 ay %50 | 63.000 ₺, borç 25.666,67 | Doğru |
| Depozito: 14.000 - 2.000 kesinti | 12.000 ₺, son gün +1 ay | Doğru |
| Giriş, çıkış, yanlış no | Hareket yazılır, hata çıkar | Doğru |
| Veli SMS | "TEST — gönderilmedi" | Doğru, sahte başarı yok |
| Reşit öğrencinin velisi izinsiz | Giremez | Doğru, sunucuda da |
| Veli portalı: durum, izin, ödeme | Kendi çocuğu | Doğru, bulutta da |
| Yoklama, kimlik işaretleme | Kayıt, işlem günlüğü | Doğru |

Kalan: ayrılış borcu sonradan tahsil edilemiyor, tahsilat düğmesi yalnız aktif kayıtta. Depozito iadesi borçtan otomatik düşmüyor. İki konu da karar ister, uydurulmadı.

### Fotoğraf

| Akış | Elle hesap | Sonuç |
|---|---|---|
| 12.000 + 9.000 - 1.000 | 20.000 ₺, kapora 6.000 | Doğru |
| Yol süresi: 180 dk + 30 dk, 13.20 başlangıç | Çakışır | Doğru |
| Aşamalar, galeri, müşteri seçimi, sınır 2 | Üçüncü kare reddedilir, kilit | Doğru |
| Yanlış kod, başkasının kodu | Reddedilir | Doğru |
| Seçim listesi, teslim, tutanak | Belge çıkar | Doğru. İmzadan vazgeçilirse teslim imzasız kaydolur |
| **Bulutta tarayıcıdan gerçek yükleme** | 1600 px → 1280 px, depoya gider | Doğru. Önceki raporda denenmemişti |

### Oyun

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Bilardo 67 dk, 5 dk yuvarlama, 180 ₺/sa | 70 dk = 210 ₺ | Doğru |
| + 2 çay 50, - indirim 20, bakiye 525 | 240 ₺, kalan 285 | Doğru, defter satırı |
| Çocuk: kural onayı, kayıtsız teslim, küçük harf eşleşme | Onay ister, eşleşir | Doğru |
| Çocuk alanı en az 30 dk, 200 ₺/sa | 100 ₺ | Doğru |
| Doğum günü 12 çocuk | 6.500 + 2 × 400 = 7.300 ₺ | Doğru |
| Temizlik payı: 16.20 çakışır, 16.30 boş | | Doğru, bulutta 409 ve uyarı |
| Kart: 1.000 yükle, %10 bonus | 1.100 ₺ artış | Doğru |
| Nakit iade, aşım, kısmi iptal | Bakiye ve kasa tutar | Doğru |

Kalan: doğum günü "Tamamlandı" durumuna geçiren düğme yok. Doğum günü iadesi hep nakit yazılıyor. Bakiye sunucuda denetlenmiyor, iki kasa aynı anda eksiye düşürebilir (kod okuması).

## Arayüz

| Kontrol | Kapsam | Sonuç |
|---|---|---|
| 1280 ve 1920 açık | 4 programda 24 ekran | Yatay taşma yok, kırpık yazı yok, konsol hatası yok |
| Koyu tema | fotograf, oyun, yurt; 1280 | Düzeltilen dışında sorun yok. `dugun` denememde tema geç uygulandı, ölçüm açık temada kaldı; koyu görünüm yalnız ekran görüntüsüyle bakıldı |
| 375 genişlik | Program ekranları, 4 müşteri sayfası | Yatay taşma yok. `veli.html` yalnız 800 px'te elle kullanıldı, 375'te ölçülmedi |
| Boş veri | 4 programın tüm menüsü | Hata yok, `undefined/NaN` yok |
| Büyük veri | Düğün 6.046 etkinlik, 3.034 müşteri, 6.000 ödeme ile en yavaş ekran 344 ms; yurt 1.530 öğrenci, 20.000 hareket en yavaş 263 ms | Akıcı. Tarayıcı paneli gizliyken ölçüldü, süreler yaklaşık. Fotoğraf ve oyun yeniden ölçülmedi |
| XSS | Müşteri notuna `<img onerror>` | Sunucu kaydetti. Panelde tetiklenmediği yalnız `esc` kullanımının okunmasıyla görüldü, canlı denenmedi |

Çekirdek gözlemleri: hızlı sayfa geçişinde konsola `AbortError: Transition was skipped` düşüyor (yalnız betikle art arda gezinmede görüldü, işlevi etkilemiyor). `.seg` düğmeleri tüm programlarda telefonda 27 px, tablo başlığı karşıtlığı 3,0:1, `.badge warn` 2,9:1. `core/` değiştirilmedi. Bulutta müşteri işlemi reddedilince konsola yakalanmamış hata düşüyor (`_pubPush` tasarımı), kullanıcıya doğru ileti gidiyor.

## Roller ve gizlilik

Gerçek sunucu, gerçek ekip hesabı, MariaDB.

| Rol | Sonuç |
|---|---|
| dugun/operasyon | Fiyat, ödeme, kod gitmiyor. Yeni etkinlik PUT 200, kayıt yok |
| yurt/gorevli | Alanlar: id, no, name, phone, guardian, minor, veliAcik. Sağlık, TC, doğum tarihi, kod yok |
| yurt/kayit | Sağlık, hareket, yoklama gitmiyor. Kod ve TC görüyor (işi gereği). Düzenleme sağlık bilgisini silmiyor |
| fotograf/fotografci | Fiyat ve kod yok |
| oyun/gorevli | Ödeme ve bakiye yok |
| Yurt diskte | Şifreli, düz metin sağlık bilgisi yok |
| Veli portalı | Başka öğrenci, sağlık, TC, başka kod yok; başkası için izin 403 |
| Belirteç | Bozuk veya başka programın belirteci kimlik vermedi |
| Kaba kuvvet | İşletme + IP başına 20 hatadan sonra 429 |

Rol denetiminin eksikleri: `fotograf/asistan` ve `oyun/kasa` satırlarında bir rol atama isteği "yalnızca hesap sahibi" hatası verdi, hangisi olduğu ayrıştırılmadı. Bu iki satır güvenilir değildir, `geriKoy` birim denemesi sayılır. `dugun/satis` ödeme tutarını değiştirebiliyor (silemez, ama tutar serbest; `geriKoy` ile doğrulandı). Anonim talep telefon başına sınırlı, farklı telefonla sınır yalnız saatlik 3.000 işlem; 8 ardışık talep geçti. Kapasite üstü doğum günü talebi kabul ediliyor, işletme görür.

## Entegrasyon tablosu

`USED` listesi dört programda `sms` ve `backup`. Gerçek hesap ve gerçek ileti kullanılmadı. Okuma tarihi 31.10.2026.

| Bağlantı | Karşılaştırma | Etiket | Kaynak |
|---|---|---|---|
| SMS, sağlayıcı yok | Her yerde "TEST — gönderilmedi", kayıt da öyle | DOĞRULANDI (davranış) | Tarayıcı, `core/core.js` `smsText` |
| Verimor gönderim | URL, yöntem, `username`, `password`, `source_addr`, `messages[].msg/dest` eşleşiyor | DOĞRULANDI | [user_guide.md](https://github.com/verimor/SMS-API/blob/master/user_guide.md) |
| Verimor ticari ileti | Kod `is_commercial`, `iys_recipient_type` göndermiyor, seçili İYS ayarı yok sayılıyor | UYUMSUZ | Aynı belge. Bu dört programın mesajları bilgilendirme, yine de ayar yanıltıcı |
| İleti Merkezi gönderim | URL, kimlik, `sender`, `iys`, `iysList`, `receipents.number` eşleşiyor | DOĞRULANDI | [send-sms](https://www.iletimerkezi.com/docs/api/send-sms) |
| İleti Merkezi `sendDateTime: []` | Belge isteğe bağlı ve metin biçiminde diyor, kod boş dizi yolluyor | DOĞRULANAMADI | Aynı belge. Test hesabıyla denenmeli |
| Netgsm REST v2 | Sayfa içerik vermedi. GitHub paketi `filter` 11/12/0 değerlerini doğruluyor, `iysfilter` ve `messages[].no` adlarını doğrulamıyor | DOĞRULANAMADI | [dokuman](https://www.netgsm.com.tr/dokuman/), [netgsm1/sms](https://github.com/netgsm1/sms) |
| Mutlucell | `unverified: true`, canlıda seçilemez | Kural gereği kapalı | `core/integrations.js:81` |
| Yedekleme | Yerel dosya, dış servis yok | Dış kaynak gerekmez | Yedek dosyası geri yükleme bu denetimde denenmedi |

CLAUDE.md §1: dokümana uyum canlı test değildir. Hiçbir sağlayıcı test hesabıyla denenmedi.

### Mevzuat iddiaları

| İddia | Etiket | Kaynak |
|---|---|---|
| Öğrenci yurdu işleticisi kalanları ve çalışanları üç gün içinde kolluğa bildirir (1774 md. 6/c) | DOĞRULANDI | [1.5.1774.doc](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.1774.doc) |
| Ayrılışta da aynı şekil ve süre | DOĞRULANDI | Aynı metin. Hazırlık listesi `Ayrılış` satırı buna uygun |
| KBS'ye anlık bildirim madde 2'de sayılan konaklama tesisleri içindir (Ek md. 1) | DOĞRULANDI | Aynı metin |
| Madde 2 "pansiyon" sayar, "apart" geçmiyor | DOĞRULANDI | Aynı metin |
| Öğrenci pansiyonu ve apart md. 2 mi, md. 6/c mi | DOĞRULANAMADI | Metin ikisine de yorum bırakıyor. Program doğru olarak bildirim göndermiyor, kolluktan öğrenilmeli |
| MEB: 15 Eylül'e kadar %10, sonrası kalan ayların %30'u, depozito bir aylık, iade bir ayda | DOĞRULANDI (metin) | [RG 11.09.2020/31241 md. 21](https://www.resmigazete.gov.tr/eskiler/2020/09/20200911-2.htm). Sonraki değişiklik aranmadı |
| MEB md. 24/5: geçici kalanların kimlik bilgisi beş iş günü içinde il/ilçe müdürlüğüne | DOĞRULANDI (metin), programda yok | Aynı metin. Eksik özellik, uydurulmadı |
| GSB md. 37: bir aylık ücret, %50 üst sınırı, depozito | DOĞRULANAMADI | [RG 09.09.2022](https://www.resmigazete.gov.tr/eskiler/2022/09/20220909-1.htm) metni 34. maddede kesildi. Konsolide sayfa okunamadı |
| GSB 2024 değişikliği: md. 37/11-b'ye yatay geçiş ve değişim programı eklendi | DOĞRULANDI, karakter kodlaması bozuk okundu | [RG 30.10.2024](https://www.resmigazete.gov.tr/eskiler/2024/10/20241030-1.htm). Ayrılış etiketindeki "gibi" kapsıyor, metin eklenmedi |
| GSB 2026 değişikliği yalnız geçici madde süreleri | DOĞRULANDI, aynı not | [RG 07.08.2026](https://www.resmigazete.gov.tr/eskiler/2026/08/20260807-2.htm) |

Not: konsolide sayfa başlığında RG 12.06.2022/31864 görüldü, değişiklikler 09.09.2022/31948 metnine atıf yapıyor. Hangi metnin yürürlükte olduğu elle bakılmalı.

## Denenmeyenler

- Gerçek SMS, gerçek sağlayıcı test hesabı. Yazdırma çıktısının kâğıda dökümü (belge verisi kontrol edildi).
- Gerçek telefonda deneme: 375 ölçümü tarayıcı öykünmesidir. Android ve masaüstü kabuğu.
- `/f/` dosyasının silindikten sonraki davranışı canlı denenmedi, kod okundu. Çakışan yazma yalnız düğünde denendi.
- Yedekten geri yükleme. Fotoğraf ve oyunda binlerce kayıt. İmzalı akış yalnız sözleşmede denendi; ek protokol ve teslimde "Vazgeç" yolu denendi.
- Ç5 (hazır şablonlar) bu denetimde `server/cloud/sablon.js` içinde dört program için bulunamadı, kapsam dışı bırakıldı.

## Senden gerekenler

1. E1 ve E2 için sunucu değişikliğini onayla; ikisi de `core/` ve `server/` işi, program oturumu yapamaz.
2. Ç7 kararı: en azından önbellek ve `noindex` düzeltmesi, tercihen belirteçli fotoğraf sunumu.
3. E4 ve E5 sunucu kuralı düzeltmelerini çekirdek oturumuna ver.
4. SMS sağlayıcı test hesabı aç, bir bilgilendirme iletisi dene.
5. GSB md. 37 metnini ve yurt, pansiyon, apart bildirim yolunu resmî olarak teyit et.
6. Ayrılış borcu ve depozito mahsubu için iş kuralını belirle.
