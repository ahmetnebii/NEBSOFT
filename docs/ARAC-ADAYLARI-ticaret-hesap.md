# Ticaret ve hesap aracı adayları (31.10.2026)

## CANLIYA ÇIKMAYI ENGELLEYENLER

Kod tarafında engel yok. Oran taşıyan iki araç için bilinmesi gerekenler:

- **Personel Maliyeti 2026 değerleri taşır.** Oranlar, SGK sınırları ve kıdem tavanı Ocak 2027'de resmî kaynaktan yenilenmelidir. Değerler formda düzenlenebilir, sayfa bunu kullanıcıya söyler, ama güncelleme yapılmazsa sayfa eski değerle açılır.
- **İmalat için 5 puan indirimi DOĞRULANDI, süresi tam DOĞRULANAMADI.** ÇSGB tablosu 01.01.2026 - 31.12.2026 için %16,75 gösteriyor. "2026 sonuna kadar" ifadesini gördüğüm SGK teşvik sayfası doğrudan indirilemedi (404), yalnız arama özetinde okundu. 2027'de uzayıp uzamadığı kontrol edilmeli.
- `npm test` çalıştırılmadı. Paralel oturumlar test çalıştırırken MariaDB'yi paylaşmamak için yalnız ilgili iki test koşuldu: `server/test/araclar.test.js` (34 grup) ve `server/test/seo-sayfalar.test.js` (14 kontrol), ikisi de geçti. Sunucu ve çekirdek kodu değişmedi.
- Gerçek Chrome, Safari, Firefox ve gerçek telefon denenmedi. Deneme uygulama içi tarayıcıda yapıldı.

Bu dosya araç yazılmadan önce dolduruldu. Kapı soruları: tek cümlelik benzersiz iş, kim neden kullanır, en yakın mevcut araç ve neden kopyası değil, ilk çalıştırmada sonuç veriyor mu. Sonuç bölümü dosyanın sonundadır.

## Okunan Google kaynakları (okuma tarihi 31.10.2026)

| Sayfa | Sayfanın son güncellemesi | Bu seçime etkisi |
|---|---|---|
| [Spam politikaları](https://developers.google.com/search/docs/essentials/spam-policies?hl=tr) | 02.09.2026 | "Ölçeklendirilmiş içeriği kötüye kullanma" oluşturma biçiminden bağımsız olarak değerlendirilir, ölçüt sayfanın kullanıcıya kattığı değerdir. Bu yüzden sayı hedefi yok. "Yanıltıcı işlevler" başlığı gereği araç sayfada gerçekten sonuç verir. Benzer sorgular için ara sayfa açılmaz |
| [Yararlı içerik](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=tr) | 08.10.2026 | "Arama motoru odaklı içerik" soruları kapı olarak kullanıldı: konu mevcut kitlenin işi mi, başka kaynağı özetlemek dışında değer katıyor mu. Mali konular bu rehberde daha yüksek güven beklenen "Paranız ya da Hayatınız" kümesinde, bu yüzden her oranın resmî kaynağı sayfada yazılı |

## Kapıdan geçenler

| Aday | Tek cümlelik benzersiz iş | Kim, neden | En yakın araç, neden kopya değil | İlk çalıştırmada sonuç |
|---|---|---|---|---|
| Amortisman Hesaplama | Aynı kıymet için normal ve azalan bakiye planını yıl yıl yan yana çıkarır | Makine, araç, demirbaş alan işletme, usulü seçmeden önce; seçim sonradan geri alınamayabilir (VUK mük. 320) | Yakın araç yok. KDV ve tevkifat fatura tutarı ayrıştırır, bu araç yıllara yayar | Evet, örnek değerlerle |
| Zincirleme İskonto Hesaplama | "10+5+3" iskontoyu ve mal fazlasını tek eşdeğer orana çevirip teklifleri net birim fiyatla sıralar | Tedarikçi teklifi karşılaştıran toptancı, market, eczane, hırdavat alıcısı | Teklif Oluşturucu satır iskontosuyla müşteriye belge üretir. Bu araç belge üretmez, gelen teklifleri karşılaştırır | Evet, iki örnek teklifle |
| Ortalama Vade Hesaplama | Farklı tarihli çek ve senetleri tutar ağırlıklı tek vadeye indirir | Çek-senet alıp veren tüccar, muhasebe personeli, toplu ödeme veya vade farkı görüşen alıcı | Aidat Gecikme Tazminatı da tarih ve tutar kullanır, ama KMK yüzde 5 cezasını hesaplar, ortalama tarih üretmez | Evet, üç örnek çekle |
| Nakit Akışı Tablosu | Aylık tahsilat ve ödemeden kasanın eksiye düşeceği ayı ve gereken finansmanı bulur, tahsilat gecikirse aynı tabloyu yeniden kurar | Ödemesini tahsilatından önce planlamak isteyen KOBİ | Kâr Marjı kârlılığı ölçer. Kâr eden işletme kasada eksiye düşebilir, bu araç zamanlamaya bakar | Evet, altı aylık örnekle |
| Stok Devir Hızı Hesaplama | Stok devrini, stokta kalma gününü ve hedef güne inince boşalacak parayı verir | Rafta para bağlı kalan mağaza, market, toptancı | Yakın araç yok. Reçete Maliyeti birim maliyet çıkarır, stok hızını ölçmez | Evet |
| Personel Maliyeti Hesaplama | Brüt ücretten işverene toplam aylık ve yıllık maliyeti, karşılığında gereken ek ciroyu çıkarır | İşe alım kararı veren işveren | Kıdem, ihbar, fazla mesai çıkış veya ek ödeme tutarı hesaplar. Bu araç sürekli aylık yükü hesaplar, brütten nete bordro yapmaz | Evet, ÇSGB 2026 oranlarıyla |

## Elenenler

| Aday | Neden elendi |
|---|---|
| Başabaş noktası | Kâr Marjı ve Başabaş aracı bu işi yapıyor ve sayfa başlığında geçiyor. Ayrı sayfa aynı arama niyetini iki sayfaya böler |
| İndirim yapınca kaç adet fazla satmalıyım | Başabaş hesabının değişik yüzü. Ayrı sayfa açmak yerine Kâr Marjı sayfasına eklenebilir, o metin bu işin kapsamı dışında |
| Vade farkı hesaplama | Ortalama Vade sayfasında kullanıcının yazdığı aylık oranla karşılanır. Ayrı sayfa ince kalır |
| Yeniden sipariş noktası, ekonomik sipariş miktarı | Düzenli talep ve bilinen sipariş maliyeti varsayar. Küçük işletme bu girdileri çoğu zaman bilmez, ilk girişte güvenilir sonuç üretmez |
| Yatırım geri dönüş süresi | Tek bölme işlemi, faydalı açıklama için yeterli içerik çıkmıyor |
| Brütten nete maaş | Gelir vergisi dilimi, kümülatif matrah ve istisna ister. Doğruluk yükü yüksek, ay ay değişen sonuç tek sayfada yanıltır |
| Kredi taksit hesaplama | Bankacılık ürünü, işletme kararı aracı değil. Vergi ve fon oranları ayrıca doğrulama ister |
| Sektör veya şehir başına personel maliyeti | Doorway tanımına girer, tek sayfada karşılanır |

## Sonuç

Altı aday kapıdan geçti ve altısı da yazıldı. Araç sayısı 44'ten 50'ye çıktı. Hepsi `index,follow`, sitemap 198 adres.

| Araç | Özgün kelime | Başlık / açıklama | Resmî dayanak |
|---|---|---|---|
| `/araclar/amortisman-hesaplama/` | 400 | 63 / 150 | `mevzuat: true`. VUK 313, 315, mük. 315, 320, mük. 320 ve GVK 40/7 okundu. Faydalı ömür kullanıcıdan alınır, hazır oran yok |
| `/araclar/zincirleme-iskonto-hesaplama/` | 346 | 62 / 153 | Mevzuat oranı yok |
| `/araclar/ortalama-vade-hesaplama/` | 326 | 60 / 151 | Mevzuat oranı yok, vade farkı oranı kullanıcıdan |
| `/araclar/nakit-akisi-hesaplama/` | 366 | 67 / 156 | Mevzuat oranı yok |
| `/araclar/stok-devir-hizi-hesaplama/` | 366 | 60 / 154 | Mevzuat oranı yok |
| `/araclar/personel-maliyeti-hesaplama/` | 402 | 67 / 153 | `mevzuat: true`. ÇSGB 2026 tablosu, 5510 md. 81 ve 82, SGK prime esas kazanç sayfası, CSGB kıdem tavanı |

Doğrulanan oranlar (okuma tarihi 31.10.2026):

| Değer | Etiket | Kaynak |
|---|---|---|
| Azalan bakiye: normalin iki katı, en çok %50, son yıl bakiye silinir | DOĞRULANDI | [VUK mük. 315](https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.htm) |
| Binek: ay kesri tam ay, kalan son yıla | DOĞRULANDI | [VUK 320](https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.htm) |
| Süre tercihi: listeden kısa değil, iki katını ve 50 yılı aşamaz | DOĞRULANDI | [VUK 320](https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.htm) |
| İşveren payı 12 + 2,25 + 7,5 = %21,75; Hazine 2 puan | DOĞRULANDI | [5510 md. 81](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm) |
| %19,75, %16,75, işsizlik işveren %2 | DOĞRULANDI | [ÇSGB 2026 tablosu](https://www.csgb.gov.tr/Media/gm2fekds/asgari-%C3%BCcret-2026.pdf) |
| Aylık alt 33.030,00 ₺, üst 297.270,00 ₺ | DOĞRULANDI | [SGK](https://www.sgk.gov.tr/Content/Post/2e0c9e1a-2cfe-4456-af10-49d3de0c58ba/Prime-Esas-Kazanc-Miktarlari-2026-01-14-10-35-39) |
| 5 puan indiriminin 2027 durumu | DOĞRULANAMADI | Yukarıda |

Hesapların doğrulaması: `server/test/araclar.test.js` içinde elle hesaplanmış sayılar var. Personel Maliyeti ÇSGB'nin yayımladığı üç sonucu kuruşu kuruşuna verir (40.874,63, 40.214,03, 39.223,13 ₺). Sayfa metnindeki örnek sayılar da testte aranır.

Tarayıcıda denenenler: her araç örnek değerle, boş, yazı ve sınır dışı girişle açıldı. 375 genişlik ve koyu temada, masaüstü genişliğinde açık temada bakıldı. Konsol temiz, araç sayfalarından `/api` isteği görülmedi, girilen veri gönderilmedi.

Denemede bulunup düzeltilenler:

- Nakit Akışı 375 genişlikte 414 piksele taşıyordu, uzun durum metni satır kırmayan hücreye yazılıyordu. Metin etiket hücresine alındı.
- Stok ve Nakit araçlarında geçersiz açılış değeri sessizce 0 sayılıyordu. Alanlar zorunlu yapıldı.
- Yüzde 17,065 kayan nokta yüzünden 17,06'ya yuvarlanıyordu. Hesap düzeltildi.

Araçların bilerek yapmadığı işler sayfalarda yazılıdır: gün esaslı amortisman, enflasyon düzeltmesi, binek gider sınırı, asgari ücret desteği ve teşvikler, brütten nete bordro, kredi faizi, çek karşılıksız riski.

## SEO ve motor oturumuna aktarılacaklar

Kapsam gereği `build-araclar.js`, `site.css`, `araclar.css`, `sw.js` ve mevcut araç metinleri değiştirilmedi.

- `.ar-sonuc-t td` satır kırmıyor (`nowrap`). Uzun değer yazan araç dar ekranda taşar, mevcut araçlarda da gözden geçirilmeli.
- `server/test/araclar.test.js` araç sayısını 60 ile sınırlıyor. Belge ve veri oturumu 10'dan fazla eklerse sınır güncellenmeli.
- `KATEGORI` içindeki ticaret kategorisi "Ticaret ve kârlılık" adını taşıyor, amortisman ve nakit akışı da burada duruyor. Yeni kategori gerekmedi, istenirse ad genişletilebilir.
- Geçersiz sayı metni motor tarafından boş sayılıyor, isteğe bağlı alanda kullanıcı uyarı görmez. Bu iş kapsamında yalnız yeni araçların zorunlu alanları korundu.
- `araclar-hesap.js` değişti, ama `sw.js` `SHELL` listesinde yok. Birleştirmede `V` artırılmalı.
- Kâr Marjı sayfasına "indirim yapınca kaç adet fazla satmalıyım" eklenebilir, ayrı sayfa açılmadı.

Eklenen dosyalar: `site/src/araclar/` altında altı araç ve `_kaynak-ticaret.js`, `site/tools/araclar/hesap.js` içinde "İşletme kararları" bölümü.
