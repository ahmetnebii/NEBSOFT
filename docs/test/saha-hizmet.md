# Saha hizmeti programları: bağımsız denetim raporu

Kapsam: `nakliyat`, `temizlik`, `usta`, `peyzaj`, `takip.html` müşteri sayfaları. Tarih: 2026-10-31 (gece 00:50–01:30 TR). Yöntem: yerel sunucu (5102), `?demo=1`, tarayıcı panelinde gerçek tıklama ve form doldurma; tutarlar elle hesaplandı. Dal: `claude/saha-hizmet-743e04`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Etiket | Neden engel | Senden gereken |
|---|---|---|---|---|
| E1 | Nakliyat: U-ETDS kaydı yok | DOĞRULANDI (2018 metni), güncel hâli DOĞRULANAMADI | Karayolu Taşıma Yönetmeliği md. 40/6, C3 ve K3 sahiplerinin eşya bilgilerini kabulden en geç 6 saat sonrasına kadar U-ETDS'ye işlemesini istiyor. Program yapmıyor; spec'te "doğrulanamadı" yazıyordu, artık yükümlülük metinde okundu. | Program U-ETDS'yi işletmenin ayrıca yapacağını açıkça söylesin mi, yoksa entegrasyon istiyor musun? |
| E2 | Nakliyat: taşıma irsaliyesi yok | DOĞRULANDI (2018 metni), güncel hâli DOĞRULANAMADI | md. 39/1 "taşıma irsaliyesi ve taşıma senedi düzenlenir" der; md. 39/2 irsaliyede sürücü adı, plaka, seri ve sıra no ister. Program yalnız senet basıyor. | Yeni belge türü: onayın gerekir (eksik özellik, uydurulmadı). |
| E3 | Karayolu Taşıma Yönetmeliği'nin bugünkü metni | DOĞRULANAMADI | mevzuat.gov.tr adresi 404, okunan metin 8.1.2018 arşivi. Sonraki değişiklikler denetlenemedi. | Avukat veya güncel metin. |
| E4 | Ücret gizliliği saha ekibinde eksik | UYUMSUZ (spec ile) | `sahaEkip` kuralı `services.price`, `items.price`, `_settings.rateM3/rateKm/rateFloor/ratePacking` ve `_settings.taxNo` alanlarını ekibe gönderiyor. Ekran göstermiyor ama API yanıtında var. Nakliyat, temizlik, peyzaj için "ücret görmez" iddiası tam değil. | `server/cloud/rol-kural.js` değişikliği, kapsam dışı (R1). |
| E5 | Usta rolü onaylı fiyatı değiştirebilir | UYUMSUZ (spec ile) | Sonda: usta hesabının PUT'u `lines` ve `accepted` değerini 1'e çekti, sunucu kabul etti. "Onaylanan tutar değişmez" kilidi yalnız arayüzde. | Sunucu kuralı (R2). |
| E6 | Beş bağlantının kartı var, programda çağrısı yok | UYUMSUZ | `pos`, `email`, `whatsapp`, `webhook`, `callerid` ve fiş yazıcı dört programda hiç çağrılmıyor (`emit`, `cardPayment`, `printReceipt`, `whatsapp`, `email` aramasında sonuç yok). Kullanıcı kurar, hiçbir şey olmaz. | `USED` listesinden çıkarılsın mı, yoksa programa bağlansın mı? (R3) |
| E7 | Hiçbir sağlayıcı test hesabıyla denenmedi | DOĞRULANAMADI | Görev gereği gerçek hesap kullanılmadı. CLAUDE.md §1: dokümanla uyum canlı test değildir. SMS, e-Belge dahil tümü. | Sağlayıcı test hesapları. |
| E8 | e-Belge tutarı KDV dahil kabul edildi | Kullanıcı kararı | Bu denetimde iş tutarı KDV dahil sayıldı (aşağıda D5). İşletme fiyatları hariç giriyorsa yanlış olur. | Onayla veya hariç olsun de. |
| E9 | `sw.js` `V` artırılmadı | Bekliyor | Görev `apps/` dışını yasakladı; artırılmazsa kullanıcılar eski dosyayı görür. | Birleştirmede artırılmalı (şu an `nebsoft-v3-87`). |
| E10 | Spec'lerdeki eski engeller | DOĞRULANAMADI | Örnek sözleşme metinleri avukat görmedi; peyzaj kapsamı, saklama süresi, bakanlık bildirim sistemi ve Danıştay notlarının güncel durumu açık. | Avukat, il müdürlüğü. |

`bilet-kural.test.js` gece kırılıyor, `npm test` zinciri orada durur; sonuç için aşağıdaki "Kalite kapısı" bölümüne bakın.

## Özet

| Program | Sonuç | Düzeltilen | Kalan |
|---|---|---|---|
| nakliyat | Ana akış sonuna kadar çalışıyor | D1, D2, D3, D4, D5, D6, D7, D9, D10, D13, D15 | E1, E2, E3 |
| temizlik | Ana akış çalışıyor | D2, D6, D8, D11, D14 | K1, K2 |
| usta | Ana akış çalışıyor | D2, D5, D7 | E5, K5 |
| peyzaj | Ana akış çalışıyor, Ek-1 alanları resmî ekle aynı | D4, D7, D12 | Mevzuat engelleri |
| takip.html | Onay, red, puan, bildirim çalışıyor; XSS yok | D2, D16 | Bulutta tarayıcıyla denenmedi |

## Düzeltilen hatalar

| # | Hata | Kanıt (önce) | Düzeltme | Kanıt (sonra) |
|---|---|---|---|---|
| D1 | Keşifte "Teklifi müşteriye aç" kullanılırsa müşteri onayından sonra iş keşifte kilitlenir | Durum `kesif`, `accepted 7530`, ekranda "Eşya ekleyip teklifi hesaplayın", Takvime al yok | Düğme teklif aşamasında gizlendi; `teklifCevap` keşifteki eski kayıtları da ilerletir | Düğme yok, testle: durum `onay` |
| D2 | Onaysız ek kalem toplama giriyordu ("müşteri onaylamadan toplama girmez" yazarken) | 7.530 onaylı + 1.500 ek: Toplam 9.030, tahsilat önerisi şişiyor; usta 3.300 + 400: tahsilat 3.700 | `H.gecerli`, `toplam` yalnız onaylıları sayar; belge, e-Belge, dönem kaydı aynı | 910 onaylı + 1.500 ek: Toplam 910, satır "Onay bekleyen ek (toplama girmez)", tahsilat 910. Portal: Onaylanan 910, Ek onaylanırsa toplam 2.410 |
| D3 | Saha ekibinin bastığı taşıma senedinde "Taşıma ücreti ₺0,00" | Ekip rolüyle basılan senet | Ekipte satır gösterilmez, "Taşıma ücreti işletme nüshasında yazılıdır." yazar | Ekip senedinde ₺ yok, "işletme nüshasında yazılıdır" var |
| D4 | Çekirdek şablonun "Takılan parçalar… garantilidir" metni taşıma senedi, hasar tutanağı, resmî Ek-1 ve dönem özetine giriyordu | Basılan metinlerde görüldü | Tüm saha belgelerinde `defaults: { terms: '' }` | Senet çıktısında yok |
| D5 | e-Belge iş tutarına KDV ekliyordu | Müşteriye 3.700, belgede 4.440 | Tutar KDV dahil sayılır, `H.kdvsiz` ile satıra hariç yazılır | 500 ₺ iş: satır 416,67 + 83,33, toplam 500. TEST etiketi korunuyor |
| D6 | Sözleşme başlamadan önceki aya dönem kaydı açılıyordu | 2 Kasım başlangıçlı sözleşmeye Ekim için 14.400 ₺ | `H.donemKapsar` | Ekimde yok, Kasımda var |
| D7 | Eksi adet ve fiyat kabul ediliyordu | Adet -1 ile toplam 2.800'e düştü | Kalem, stok, eşya, ürün miktarında denetim | Eksi kayıt reddedildi |
| D8 | Tekrar süresi tanımsızken "ücretsiz süre içinde" yazıyordu | NK1041 geçmişi | Süre yoksa ifade yazılmaz | "Tekrar ziyareti · NK1001" |
| D9 | Teklif beklerken eşya ve teklif yeniden hesaplanabiliyordu, `offer.total` eski kalıyordu | Kod incelemesi | Bekleyen teklifte kilit | Teklif sonrası düğme listesi boş |
| D10 | Taşıma senedi ve tutanakta eşya satırları "₺0,00" görünüyordu | Basılan metin | Eşya listesi not bölümüne numaralı yazılır | Senet çıktısı |
| D11 | Demo verisi UTC ile üretiliyordu: gece 00:00–03:00 arası bugünkü işler dün sayılıyordu | Bugünkü iş 0, Geciken 2 | `NS.today()` | Peyzaj örnek verisinde bugünkü kayıt 1 |
| D12 | Peyzaj ürününde stok yetersizken sessizce eksiye düşüyordu | Kod incelemesi | Onay sorulur | "stokta yetersiz (18)" soruldu, eksi miktar reddedildi |
| D13 | Teklif aşamasındaki talep "Bugünkü Taşımalar" ve KPI'da görünüyordu | Tarih varsayılanı bugün | Liste ve KPI'dan çıkarıldı | Yeni talep listede yok |
| D14 | Boşluksuz uzun metin yatay taşma yapıyordu | 1920'de genişlik 5441 | `overflow-wrap` | 375'te detay, liste, Bugün 375 |
| D15 | Metinler: "Ekip Sinan ekibimiz", "5.2 m³", ödeme "nakit" | Ekran | Düzeltildi | Ekran |
| D16 | Portalda durum rozeti rengi `undefined` | Ekran | Varsayılan renk | Kodla (renk ölçülmedi) |
| D17 | Telefonda filtre düğmeleri 27 px, başlık sıkışık | Ölçüm | 40 px, başlık tam satır | Ölçüm: 40 px |
| D18 | Ekip rolü `#/faturalar` ve `#/sozlesmeler` açabiliyordu, takvimde sürükleyebiliyordu | Ekranda açıldı | Yönlendirme, sürükleme kapalı | İki adres `#/bugun`a döndü, sürüklenebilir kart yok |

Testler: `server/test/saha-kural.test.js` içine 8 yeni kontrol eklendi. Mevcut hiçbir test gevşetilmedi.

## Program başına denenen akış

### nakliyat
Talep, zorunlu alan (müşteri yok, başlık yok), keşif, eşya (aynı eşya birleşir), keşif bilgisi, teklif hesabı, teklif, onay, kapora, fazla iade reddi, takvime alma ve çakışma uyarısı, ek teklif ve red, yola çıkış, başlangıç, hasar, açık hasar uyarısı, bitirme, kısmi tahsilat, imza, senet, sözleşme, tutanak, teslim formu, müşteri puanı, sorun bildirimi, tekrar ziyareti, tüm filtreler, telefonla ve başlıkla arama, boş arama, takvimde taşıma, Excel çıktısı, fotoğraf, yenileme sonrası veri.

Elle hesap: 5,2 m³ × 650 = 3.380; 18 km × 25 = 450; 3 kat × 400 = 1.200; paketleme 2.500; toplam 7.530. Ekran 7.530. Sonraki deneme: 1,4 × 650 = 910. Ekran 910. Özet kartı açık alacak elle 3.530, ekran 3.530; ortalama puan elle 4,22, ekran 4.2.

### temizlik
Sözleşme, gün yazım hatası, haftalık Pzt-Per üretimi (13 ziyaret, tarihler takvimle aynı, ikinci üretim tekrar basmadı), bitirme, gelinmedi, ertele, iptal, dönem kaydı, kısmi tahsilat, yazdırma, hatırlatma.

Elle hesap (Kasım, 9 ziyaret, 1 gelinmedi, 2 iptal/ertele, sabit 12.000): planlı 7; düşüm 12.000 / 7 = 1.714,29; ücret 10.285,71; ek kalem 2 × 150 = 300; net 10.585,71; KDV %20 2.117,14; toplam 12.702,85. Ekran 12.702,85. Kalan 5.000 sonrası 7.702,85, ekran aynı. Demo dört sözleşme de elle aynı.

Boş veri: tüm ekranlar açıldı, hata yok. Büyük veri: 11.978 iş, 3.022 müşteri, 305 sözleşme: Özet 273 ms, Takvim 75, Faturalar 34, Liste 33, Müşteriler 230 ms (sayfalama yok, 3.023 satır çiziyor), kayıt 25 ms. Belge 4,1 MB; demo `localStorage` sınırına yakın.

### usta
Periyodik bakım listesi, SMS hatırlatma (TEST, "hatırlatıldı" kaydı bırakmıyor), bakımdan iş emri, stoktan parça (stok 6→4), yetersiz stok uyarısı, eksi adet, kalem silme, müşteri onayı, yola çıkış, ek kalem, onaysız bitirme, garanti tarihi (+90 gün), cihaz son bakım tarihi, e-Belge (simülasyon, TEST).

### peyzaj
İlaçlama ziyareti, ürünsüz bitirme engeli, ürün ekleme (stok 18→16), yer bilgisi, güvenlik notu, bitirme, ücretsiz tekrar tarihi, Ek-1 çıktısı.

### takip.html
Bilinmeyen kod, kutu işaretlemeden onay reddi, onay, puansız gönderim, puan, HTML içeren görüş (kaçışlı, çalışmadı), sorun bildirimi, tamamlanmış işte ek teklif, telefon genişliği ve koyu tema. Bulut tarafı `saha-uctan.test.js` ile (gerçek MariaDB): sıralı no ile giriş yok, iç bilgi gitmez, tutar yazılamaz, başka işe yazılamaz: 3 test geçti.

### Roller
Ekip rolüyle Bugünkü Taşımalar, işi açma, yola çıkış, başlama, bitirme denendi; kalem ve ödeme kartı görünmüyor; yönetim sayfaları kapalı. Sunucu kuralı doğrudan sınandı: başka ekibin işi ve müşterisi gitmiyor, sözleşme ve fatura boş, `cost` ve `taxNo` (müşteri) gizli, ekip atanmamış hesap iş görmüyor. Ücret ve kapsam açıkları için E4, E5, R1, R2.

### Arayüz
375, 1280, 1920 genişlik; açık ve koyu tema; dört programın tüm ekranları ve iş detayı: yatay taşma yok, konsolda uygulama hatası yok, `undefined/NaN` yazısı yok. Etiketsiz düğme yalnız `#/ayarlar` ve `#/ebelge`de (çekirdek). Konsoldaki iki `ERR_FAILED` hangi kaynağa ait, belirlenemedi; sunucu günlüğünde hata yok.

## Entegrasyon tablosu

Okuma tarihi hepsinde 2026-10-31. Dokümanla uyum canlı test değildir (E7).

| Bağlantı | İddia | Etiket | Kaynak |
|---|---|---|---|
| SMS Netgsm | `POST /sms/rest/v2/send`, Basic, `msgheader`, `messages[{msg,no}]`, `encoding`, `iysfilter` 0/11/12, `appname`, başarı `00` | DOĞRULANDI | [netgsm.com.tr/dokuman](https://www.netgsm.com.tr/dokuman/) |
| SMS İleti Merkezi | Uç, `key/hash`, `iys`, `iysList`, `receipents`, başarı `200` | DOĞRULANDI | [toplusmsapi.com](https://www.toplusmsapi.com/sms/gonder/json) |
| SMS Verimor | Uç, alanlar, 2xx | DOĞRULANDI | [SMS-API user_guide](https://github.com/verimor/SMS-API/blob/master/user_guide.md) |
| SMS Verimor, ticari ileti | Ticari gönderimde `is_commercial`, `iys_recipient_type` gerekir, kod göndermiyor | UYUMSUZ | Aynı. Saha mesajları işlem bildirimi; "bakım zamanı geldi" mesajının ticari sayılıp sayılmadığı DOĞRULANAMADI |
| SMS Twilio | Uç, To/From/Body | DOĞRULANDI | [Message resource](https://www.twilio.com/docs/messaging/api/message-resource), 2026-03-09 |
| SMS Twilio | Basic kimlik ve başarı kodu | DOĞRULANAMADI | Yalnız özetle okundu |
| SMS Mutlucell | Resmî doküman yok | DOĞRULANAMADI | Kodda `unverified`, canlıda seçilemiyor |
| WhatsApp bağlantısı | wa.me biçimi | DOĞRULANAMADI | [faq.whatsapp.com](https://faq.whatsapp.com/5913398998672934) içeriği okunamadı |
| WhatsApp Cloud API | Uç, Bearer, metin ve şablon gövdesi | DOĞRULANDI | [send-messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages), [templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview) |
| WhatsApp Cloud API | `recipient_type` kodda yok, dokümanda var | UYUMSUZ (küçük) | Aynı. Serbest metin yalnız 24 saat penceresinde |
| E-posta EmailJS | Uç, `service_id`, `template_id`, `user_id`, `template_params` | DOĞRULANDI | [rest-api/send](https://www.emailjs.com/docs/rest-api/send/) |
| E-posta mailto, http | Standart ve kullanıcı adresi | Doğrulanacak sağlayıcı yok | - |
| e-Belge Nilvera | Sunucu, Bearer, `/einvoice|earchive/Send/Base64String` | DOĞRULANDI | [developer.nilvera.com](https://developer.nilvera.com/) (v1) |
| e-Belge Paraşüt | v4, `grant_type=password`, jeton 2 saat, 10 sn'de 10 istek | DOĞRULANDI | [apidocs.parasut.com](https://apidocs.parasut.com/) |
| e-Belge Uyumsoft | WSDL erişilir, `SendInvoice`, UsernameToken | DOĞRULANDI (WSDL var), kod karşılaştırması yapılmadı | [WSDL](https://efatura.uyumsoft.com.tr/services/integration?wsdl) |
| e-Belge simülasyon | Sonuç (TEST), durum `test`, gönderilmiş görünmüyor | DOĞRULANDI (ekranda) | Bu denetim |
| POS | Üretici entegrasyonu yok, programda çağrı yok | UYUMSUZ (E6) | Kod |
| Fiş yazıcı | Belgeler tarayıcı yazdırma; `printReceipt` çağrılmıyor | UYUMSUZ (E6) | Kod |
| Webhook | `emit` çağrılmıyor | UYUMSUZ (E6) | Kod |
| Arayan numara (usta) | Rehber "desteklenmiyor", spec "eklenmedi", kart "Kurulum gerekli" gösteriyor | UYUMSUZ (E6) | `core/integ-guides-ek.js:86` |
| Yedekleme | Çekirdek işlevi, bu denetimde denenmedi | DOĞRULANAMADI | - |
| Sahte başarı | Her SMS `TEST — gönderilmedi`; `reminded` yazılmıyor | DOĞRULANDI (ekranda) | Bu denetim |

## Mevzuat tablosu

| İddia | Etiket | Kaynak |
|---|---|---|
| Biyosidal Yönetmelik künyesi: RG 04.07.2019/30821 (spec'te yoktu) | DOĞRULANDI | [mevzuat.gov.tr 32642](https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=32642&MevzuatTur=7&MevzuatTertip=5) |
| Ücretli uygulama için il müdürlüğü izni (md. 5/1) | DOĞRULANDI | [Metin](https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=32642&MevzuatTertip=5) |
| Ek-1 tüm alanları, UZEM 114, 112, iki nüsha notu | DOĞRULANDI: program formu ile tek tek karşılaştırıldı, eşleşiyor | [Ek dosyası](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.32642-Ek.docx) |
| Bir nüsha yetkiliye verilir (md. 9/3-c), kayıt ayrı dosyada (md. 19), izinli ürün ve bilgi formu (md. 16) | DOĞRULANDI | Metin |
| Uygulamadan önce elektronik bildirim (md. 8/2-i), başka ilde 1 iş günü önce (md. 8/2-j) | DOĞRULANDI. Program bildirim yapmıyor, sistem arayüzü DOĞRULANAMADI | Metin |
| Uygulamadan önce mahalde duyuru (md. 21/4) | DOĞRULANDI. Programda alan yok, spec'te geçmiyor | Metin |
| Ek-1 saklama süresi | Metinde sayısal süre yok (md. 19) | Metin |
| Danıştay: md. 4/1-j ve 8/1 yürütmeyi durdurma (biyomühendislik), md. 17/1 kısmi iptal | DOĞRULANDI (not metinde), güncel durumu DOĞRULANAMADI | Metin dipnotu |
| Taşıma senedi alanları (md. 39/2): program hepsini basıyor | DOĞRULANDI (2018 metni) | [RG 8.1.2018/30295](https://www.resmigazete.gov.tr/eskiler/2018/01/20180108-1.htm) |
| Taşıma senetsiz yapılamaz (40/8), süre taahhüdü (40/7), sorumluluk (40/9), hasar tutanağı (40/14) | DOĞRULANDI (2018 metni) | Aynı |
| C3, K3 yetki belgesi (md. 6) | DOĞRULANDI (2018 metni) | Aynı |
| Zorunlu yük sigortası | Metinde "yük/emtia sigortası" araması sonuç vermedi, DOĞRULANAMADI | Aynı |
| Bitki koruma ürünü yönetmeliği | Bu denetimde yeniden okunmadı, DOĞRULANAMADI | - |

## Kalan hatalar (çekirdek veya sunucu)

| # | Yer | Sorun |
|---|---|---|
| R1 | `server/cloud/rol-kural.js` | `SAHA_FIYAT` genişletilmeli: `services.price`, `items.price`, `_settings` birim ücretleri ve `taxNo` (E4). |
| R2 | `server/cloud/rol-kural.js` | Usta için onaylı `lines` ve `accepted` sunucuda korunmalı (E5). Ekip kendi işinin `team` alanını da değiştirebiliyor. |
| R3 | `core/integrations.js` | `USED` saha satırları gerçek kullanıma indirilmeli veya programa bağlanmalı (E6). |
| R4 | `NS.crud` | `beforeSave` metin dönünce modal kapanıyor, 20 alanlı sözleşme formu kayboluyor. |
| R5 | `NS.csv` | "CSV" düğmesi Excel dosyası (zip) üretiyor; etiket yanıltıcı. |
| R6 | `core/docs.js` | Yalnız tarih içeren belgede saat "03:00" görünüyor (senet, Ek-1). Tutar sütunu kapatılamıyor. |
| R7 | `sw.js` | `V` artırılmalı (E9). |
| R8 | `server/test/*` | Sabit portlar (`MOCK_PORT` 5098, `TEST_PORT`) paralel oturumda çakışıyor: `kanal.test.js` yanlış 404 verdi. `MOCK_PORT=5302 TEST_PORT=5310` ile çözüldü. |

## Kalan hatalar ve kararlar (program)

| # | Sorun |
|---|---|
| K1 | Durdurulan veya silinen sözleşmenin üretilmiş gelecek ziyaretleri takvimde kalıyor. Silme için `canDelete` yalnız faturaya bakıyor. |
| K2 | Sözleşme ay ortası başlıyorsa sabit ücret tam yazılıyor, oranlanmıyor. Ürün kararı. |
| K3 | Takvimde taşıma yalnız fareyle; telefonda sürükleme yok. Yeni tarih "Ertele" ile verilebiliyor. |
| K4 | Müşteri listesinde sayfalama yok (çekirdek `NS.crud`), 3.000 kayıtta 230 ms. |
| K5 | Usta "Onaysız bitir" sonrası müşteri ek teklifi işi kapandıktan sonra da onaylayabiliyor; kasıtlı mı karar verilmeli. |

## Denenmeyen

- Bulut oturumunda gerçek ekip hesabıyla tarayıcı akışı: istemci davranışı demo ile, sunucu kuralı doğrudan ve `saha-uctan.test.js` ile sınandı. Demo denemesinde sunucu filtresi elle taklit edildi.
- Gerçek SMS, WhatsApp, e-posta, e-Belge gönderimi (görev yasağı). Gerçek yazıcı çıktısı: `NS.printHtml` yakalanıp içerik okundu.
- Gerçek telefon ve dokunmatik; 375 genişlik öykünmesi kullanıldı. Tarayıcı paneli gizliyken çalışıldı.
- Yedekleme, imzalı belgeler ekranında form doldurma, belge şablonu tasarımcısı.
- Temizlik ve peyzajda düzeltme sonrası tam akış tekrarı. Nakliyat ana akışı, usta e-Belge, temizlik dönem kapsamı ve peyzaj stok ile Ek-1 çıktısı tekrarlandı.
- Mobil Android ve masaüstü Electron kabukları.
- Pilot işletme.

## Kalite kapısı

Zincirdeki 65 adım, kırılan test sonrakileri durdurmasın diye tek tek çalıştırıldı (`MOCK_PORT=5302 TEST_PORT=5310`, `TEST_DB_NAME=nebsoft_test_t2`, MariaDB açık, .NET 10.0.401 kurulu).

- 64 adım geçti. `katalog.test.js` ilk çalıştırmada 5098 portu başka oturumda dolu olduğu için kırıldı, `TEST_KATALOG_PORT` ile ayrılmadan yeniden çalıştırılınca geçti (57 denetim). Testte değişiklik yapılmadı.
- **Kırmızı: `bilet-kural.test.js`** ("Online satış kapandı", satır 26). Görevde bildirilen gece hatası, düzeltmesi ayrı dalda. Bu nedenle düz `npm test` zinciri bu dalda ve bu saatte **geçmez**; bu denetimin değiştirdiği dosyalarla ilgisi yok.
- `saha-kural.test.js` 26 test (8'i yeni), `saha-uctan.test.js` 3 test geçti. Mevcut test gevşetilmedi.

## Senden gerekenler

1. E1, E2: U-ETDS ve taşıma irsaliyesi için karar.
2. E8: iş tutarları KDV dahil mi?
3. E6: kullanılmayan bağlantılar kaldırılsın mı, bağlansın mı?
4. E4, E5, R1, R2: sunucu kuralı düzeltmesini ayrı oturuma ver.
5. E7: sağlayıcı test hesapları.
6. E3, E10: hukuk incelemesi.
