# Telefon denetimi

Tarih: 2026-10-31. Taban: `devir/hepsi` `2fb3fb2`. Dal: `claude/telefon-183ca2`. Push ve merge yapılmadı.

**Sınır:** Bu denetim telefon öykünmesidir, gerçek cihaz değildir. Masaüstü Chrome 155, Playwright ile 375×812 ve 412×915, dokunma öykünmesi açık, mobil görünüm kipi. iOS Safari, gerçek Android Chrome ve gerçek ekran klavyesi hiç denenmedi.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Bu turda kodda açık engel kalmadı. Aşağıdakiler denenmediği için engel sayılır.

| # | Durum | Madde | Gereken |
|---|---|---|---|
| 1 | DOĞRULANAMADI | Gerçek telefon denemesi yok. iOS Safari motoru hiç çalıştırılmadı. Bu turda eklenen `100dvh`, `visualViewport`, `appearance: none` onay kutusu, `content-visibility` yalnız Chromium'da görüldü | Bir iPhone ve bir Android telefonda ana akışlar elle denenmeli |
| 2 | DOĞRULANAMADI | Android uygulaması (`android/`) derlenmedi, denenmedi. Bu ortamda öykünücü, cihaz, `adb` yok. Kod okumasında `onKeyDown` `web.goBack()` çağırıyor, bu turdaki geri tuşu çözümüyle uyumlu görünüyor, çalıştırılmadı | Cihazda geri tuşu denenmeli |
| 3 | DOĞRULANAMADI | Android uygulamasında yazdırma. `core.js` `printHtml` `window.open` kullanıyor, `MainActivity.java` `setSupportMultipleWindows(false)` ayarlıyor ve `PrintManager` içermiyor. Fiş ve belge yazdırmanın WebView'da çalışıp çalışmadığı bilinmiyor (hafızadan, doğrulanmadı: WebView `window.print` çalıştırmaz) | Cihazda denenmeli, gerekirse Android köprüsü yazılmalı |
| 4 | DOĞRULANAMADI | Sürükle-bırak dokunmatikte denenmedi: sipariş panosu, otel ve kiralama takvimi çubukları. Metin "sürükleyin" diyor. Panoda kartı açıp durum değiştirme yolu var, otel takvimi için doğrulanmadı | Gerçek telefonda denenmeli |
| 5 | Karar | İlk açılış Fast 3G + 4× işlemcide 4,5-4,9 s FCP. Bu tur öncesiyle aynı, gerileme yok, ama telefonda yavaş. Neden: ~28 engelleyici istek ve Google Fonts | Ayrı iş olarak ele alınmalı, aşağıda |

Önceki raporlardaki açık maddeler bu turda ele alınmadı: rol kuralları, çift rezervasyon, entegrasyon doğrulamaları (`docs/BIRLESTIRME-RAPORU.md`). Hiçbir sağlayıcı gerçek test hesabıyla denenmedi; e-ticaret ödemesi sahte iyzico ile denendi.

## Sonuç özeti

İlk ölçüm donmuş `2fb3fb2` kopyasında, son ölçüm bu dalda alındı. 51 program, 2 genişlik, 2 tema: 204 tarama, 3176 sayfa.

| Ölçüm | İlk | Son |
|---|---|---|
| Sayfa taşması olan sayfa | 4 | 0 |
| Menü dışarı dokununca kapanmıyor | 204/204 | 0 |
| Geri tuşunda modal açık kalıyor | 46/46 | 0/51 |
| Odakta iOS yakınlaşmasına yol açan alan türü | 6225 | 0 |
| 44 px altı dokunma hedefi (örnek sayısı) | 134.945 | 676 |
| Telefonda yatay kaydırılan tablo | 1778/2318 | 60/2321 |
| Konsol hatası (genel + HTTP 4xx) | 11 + 11 | 0 + 0 |
| Boş veriyle boş ya da hatalı sayfa (51 program, 794 sayfa) | ölçülmedi | 0 |
| Modal formda çift dokunmayla çift kayıt | 0 | 0 |

Ölçüm notu: ilk taramanın "koyu" yarısı yanlışlıkla açık temada çalıştı, çünkü programlar sistem tercihini izlemez (adisyon hariç, tasarım gereği). İlk taramanın kontrast sayısı animasyon sırasında ölçüldüğü için güvenilir değil, bu yüzden yazılmadı. Son taramada koyu tema `nebsoft:theme` ile gerçekten açıldı. Sayfa sayısı farkı, ilk taramada 6 derin taramanın test aracında takılmasındandır.

## Bulunan ve düzeltilen hatalar

| Önem | Yer | Sorun | Düzeltme |
|---|---|---|---|
| Yüksek | `apps/randevu/book.html` | Müşteri randevu sayfası saat adımında **1183 px** taşıyordu, saat düğmesi ve Devam çubuğu ekran dışındaydı, randevu alınamıyordu | Tek sütunlu ızgara `1fr` → `minmax(0, 1fr)` |
| Yüksek | `apps/adisyon/index.html` | Sipariş ekranı 459 px taşıyordu, adisyon ve ödeme ekran dışındaydı | Aynı kök neden |
| Yüksek | 23 dosya | Aynı kalıp başka müşteri sayfalarında duruyordu | 57 yer tek seferde düzeltildi, test `apps/` için yasakladı |
| Yüksek | `core/core.js` | Telefonun geri tuşu modalı kapatmıyor, modal başka sayfanın üstünde kalıyordu | `geriKayit`: modal ve menü geçmişe kayıt ekler, geri önce onları kapatır. Kapanışla aynı anda yönlendirme olursa yeni sayfa geri alınmaz |
| Yüksek | `core/core.js`, `core.css` | Menü dışarı dokununca kapanmıyordu, alt çubuk menünün son satırlarını örtüyordu | Karartma katmanı, menü alt çubuğun üstünde |
| Yüksek | `core/core.css` | Form alanları 14 px, iOS odakta sayfayı büyütür | Telefonda 16 px |
| Yüksek | `core/core.css` | Düğme 42, küçük düğme ve sekme 27-30, onay kutusu 16 px | 44 px; onay kutusu 22 px görünür, 44 px dokunma alanı |
| Orta | `core/core.js`, `core.css` | Tablolar yatay kaydırılıyordu | 10 sütuna kadar tablo telefonda satır kartı, yazdırma etkilenmez |
| Orta | `core/core.css` | Destek balonu formun üstündeydi (ölçüldü). Modal 100vh kullanıyordu; adres çubuğu ve klavye örtmesi kod okumasıyla bulundu, gerçek telefonda görülmedi | Alttan açılan pencere, `visualViewport` ölçüsü, balon altta |
| Orta | `core/core.js` | Modal açılınca klavye kendiliğinden açılıp formu örtüyordu | Dokunmatikte otomatik odak yok, alana dokununca ortalanır |
| Orta | `core/core.css` | Dar satırda başlık 19 px'e sıkışıp sayfayı 412 px'te 60 px açıyordu (klinik, randevu takvimi) | `.grow` sığmazsa alt satıra iner |
| Orta | `core/core.css` | Sayfa başlığı "Hastal/ar" diye bölünüyordu, üst çubuk başlığı kesiliyordu | Başlık tam satır, üst çubuk iki satır; menü düğmesi alt çubukta, tema menüde |
| Orta | `core/core.css` | Arama simgesi dokunmayı yutuyordu | `pointer-events: none` |
| Orta | `core/core.css` | Kontrast: soluk yazı 3:1, durum renkleri ve dolu düğme 3,2:1 | İki temada 4,5:1; koyu temada vurgu rengi yazı olarak açılır |
| Orta | `admin/index.html` | `#/ayarlar` 93 px taşıyordu | `.kv` kırılır |
| Orta | `apps/eticaret/magaza.html` | Vitrin düğmesi 5 px, bülten formu 31 px taşıyordu | Düğme ve alan daraltıldı |
| Düşük | `server/cloud/katalog-api.js` | Şablonu olmayan programda ayarlar sayfası 404 veriyordu | Boş liste döner, olmayan program yine 404 |
| Düşük | `core/katalog.js`, `apps/pos/app.js` | Demoda katalog istekleri 401 hatası yazıyordu | Demoda istek atılmaz |
| Düşük | `kurs`, `bilet`, `pos`, `yurt`, `site`, `eticaret`, `saha-ortak`, `siparisortak` | Yoklama, koltuk, kategori sekmesi, yatak, dar alanlar | Telefonda 44 px, koltuk haritası yatay kayar |

Denetimde benim değişikliğimden çıkan ve aynı turda giderilen iki yan etki:

- Alttan açılan modalda hızlı ikinci dokunuş yeni pencerenin düğmesine gelip ikinci modal açıyordu. Dokunmatikte modal ilk 350 ms girdi almaz.
- `:has()` seçicileri ve satır kartı 5000 satırlık listeyi 8,7 s'den 23,6 s'ye çıkarmıştı. Seçiciler kaldırıldı, `content-visibility` eklendi, sonuç aşağıda.

## Akış sonuçları

| Akış | Sonuç |
|---|---|
| E-ticaret kart ödemesi, sahte iyzico + MariaDB, bulut kipi | Ürün, beden, ödeme, T.C., sözleşme, sağlayıcı sayfası, dönüş. Başarılı ödeme `alindi`, TEST ibaresi görünür. Reddedilen ödeme `bekliyor`, "Ödemeyi yeniden dene" çalıştı |
| Ödemede çift dokunma | Tek sipariş |
| Ödemede bağlantı kopması | Sipariş oluşmadı, sahte başarı yok, "Lütfen biraz sonra tekrar deneyin" |
| Randevu sayfası | Hizmet, uzman, saat, bilgi, onay. Çift dokunma tek randevu |
| POS satış | Çift dokunma 35, 120, 300 ms: tek satış |
| Adisyon | Masa, sipariş, mutfağa gönder, ödeme, hesap kapandı. Tek ödeme |
| Sorgu sayfaları (11 program) | Demo koduyla sonuç geldi, taşma yok |
| Pazar yeri | Ana sayfa, Sektörler, ürün, sepet, iki adımlı kayıt, yanlış ve doğru şifreyle giriş. İşlevsel hata yok. Görünüm başka oturumda |
| Admin (bulut kipi) | Giriş, 29 menü sayfası, `#/kurulum`. Taşma yok |
| Klavye öykünmesi (görünen yükseklik 512 px) | 9 formun 9'unda son alan ve Kaydet görünür |
| Masaüstü 1366 px | 7 program: yan menü, tablo, ortalanmış modal, otomatik odak aynı, hata yok |

### Hız

Fast 3G (1,6 Mbit, 150 ms) + 4× işlemci, soğuk önbellek:

| Sayfa | FCP | Yükleme | Boyut |
|---|---|---|---|
| Ana sayfa | 4,9 s | 5,5 s | 462 kB |
| POS | 4,7 s | 6,3 s | 527 kB |
| Klinik | 4,6 s | 6,2 s | 498 kB |
| Randevu sayfası | 4,9 s | 7,6 s | 639 kB |
| Mağaza | 4,9 s | 13,4 s | 1700 kB, çoğu örnek fotoğraf |
| Admin demosu | 4,5 s | 8,9 s | 541 kB |

Çekirdek değişikliği açılışı yavaşlatmadı: POS 524 → 527 kB, FCP farkı ölçüm gürültüsü içinde.

### Büyük veri

4× yavaş işlemci, 5000 kayıt, telefon genişliği:

| Liste | İlk | Son |
|---|---|---|
| Klinik hastalar | 8,7 s | 2,1 s |
| POS müşteriler | 8,4 s | 2,1 s |
| POS ürünler | 10,4 s | 2,6 s |

## Program başına sonuç

Sayfa taşması ve konsol sütunları dört tarama toplamıdır. Form sütunu 375 açık temadaki derin taramadır: açılan form sayısı / kaydedilen form sayısı. Kaydedilmeyen formların nedeni, otomatik doldurmanın kuralı geçememesidir (T.C. kimlik, dolu saat, kapora): program doğru uyardı.

| Program | Menü sayfası | Sayfa taşması ilk → son | Konsol ilk → son | Form açıldı / kaydedildi | Geri tuşu | 44 px altı kalan tür | Sonuç |
|---|---|---|---|---|---|---|---|
| adisyon | 16 | 0 → 0 | 0 → 0 | 4 / 4 | kapanır | yok | geçti |
| anaokulu | 18 | 0 → 0 | 0 → 0 | 7 / 5 | kapanır | yok | geçti |
| bilet | 14 | 0 → 0 | 0 → 0 | 3 / 2 | kapanır | yok | geçti |
| butik | 15 | 0 → 0 | 1 → 0 | 2 / 2 | kapanır | yok | geçti |
| cicekci | 16 | 0 → 0 | 0 → 0 | 9 / 8 | kapanır | yok | geçti |
| ciftci | 15 | 0 → 0 | 0 → 0 | 5 / 2 | kapanır | yok | geçti |
| crm | 14 | 0 → 0 | 0 → 0 | 4 / 4 | kapanır | yok | geçti |
| danisan | 10 | 0 → 0 | 1 → 0 | 5 / 4 | kapanır | yok | geçti |
| dernek | 13 | 0 → 0 | 1 → 0 | 5 / 4 | kapanır | yok | geçti |
| dugun | 17 | 0 → 0 | 1 → 0 | 8 / 7 | kapanır | `cal>button.gun.dis` `cal>button.gun` `cal>button.gun.hs` +1 | geçti |
| eczane | 18 | 0 → 0 | 0 → 0 | 4 / 2 | kapanır | yok | geçti |
| egitim | 13 | 0 → 0 | 1 → 0 | 6 / 4 | kapanır | yok | geçti |
| emlak | 14 | 0 → 0 | 0 → 0 | 5 / 4 | kapanır | yok | geçti |
| eticaret | 21 | 0 → 0 | 0 → 0 | 5 / 3 | kapanır | yok | geçti |
| fabrika | 26 | 0 → 0 | 0 → 0 | 9 / 9 | kapanır | yok | geçti |
| fiyatrobotu | 12 | 0 → 0 | 0 → 0 | 2 / 2 | kapanır | yok | geçti |
| fotograf | 15 | 0 → 0 | 1 → 0 | 6 / 5 | kapanır | `cal>button.gun.dis` `cal>button.gun` `cal>button.gun.bugun` | geçti |
| galeri | 11 | 0 → 0 | 0 → 0 | 2 / 2 | kapanır | yok | geçti |
| hukuk | 14 | 0 → 0 | 0 → 0 | 5 / 5 | kapanır | yok | geçti |
| ik | 12 | 0 → 0 | 0 → 0 | 4 / 3 | kapanır | yok | geçti |
| kargo | 15 | 0 → 0 | 0 → 0 | 3 / 0 | kapanır | yok | geçti |
| kiralama | 13 | 0 → 0 | 0 → 0 | 7 / 7 | kapanır | yok | geçti |
| klinik | 14 | 2 → 0 | 0 → 0 | 6 / 5 | kapanır | yok | geçti |
| kurs | 17 | 0 → 0 | 0 → 0 | 7 / 7 | kapanır | yok | geçti |
| kurutemizleme | 14 | 0 → 0 | 0 → 0 | 8 / 0 | kapanır | yok | geçti |
| kuyumcu | 16 | 0 → 0 | 0 → 0 | 5 / 4 | kapanır | yok | geçti |
| lastik | 15 | 0 → 0 | 0 → 0 | 8 / 4 | kapanır | yok | geçti |
| matbaa | 13 | 0 → 0 | 1 → 0 | 7 / 3 | kapanır | yok | geçti |
| mobilya | 16 | 0 → 0 | 0 → 0 | 6 / 6 | kapanır | yok | geçti |
| muhasebe | 24 | 0 → 0 | 0 → 0 | 8 / 8 | kapanır | yok | geçti |
| musavir | 14 | 0 → 0 | 0 → 0 | 4 / 3 | kapanır | `center>button.badge.err` `center>button.badge.warn` `center>button.badge.ok` | geçti |
| nakliyat | 15 | 0 → 0 | 0 → 0 | 9 / 0 | kapanır | yok | geçti |
| okulservisi | 17 | 0 → 0 | 0 → 0 | 6 / 6 | kapanır | yok | geçti |
| otel | 14 | 0 → 0 | 0 → 0 | 5 / 5 | kapanır | yok | geçti |
| oto | 12 | 0 → 0 | 0 → 0 | 3 / 3 | kapanır | yok | geçti |
| otoservis | 13 | 0 → 0 | 0 → 0 | 4 / 4 | kapanır | yok | geçti |
| oyun | 17 | 0 → 0 | 1 → 0 | 9 / 9 | kapanır | yok | geçti |
| pastane | 18 | 0 → 0 | 0 → 0 | 11 / 7 | kapanır | yok | geçti |
| pazaryeri | 17 | 0 → 0 | 0 → 0 | 2 / 2 | kapanır | yok | geçti |
| peyzaj | 17 | 0 → 0 | 0 → 0 | 10 / 1 | kapanır | yok | geçti |
| pos | 20 | 0 → 0 | 1 → 0 | 8 / 5 | kapanır | yok | geçti |
| randevu | 16 | 2 → 0 | 0 → 0 | 6 / 3 | kapanır | yok | geçti |
| servis | 11 | 0 → 0 | 0 → 0 | 6 / 6 | kapanır | yok | geçti |
| site | 19 | 0 → 0 | 0 → 0 | 10 / 7 | kapanır | `a` | geçti |
| spor | 15 | 0 → 0 | 0 → 0 | 7 / 7 | kapanır | `small>a` | geçti |
| temizlik | 16 | 0 → 0 | 0 → 0 | 9 / 1 | kapanır | yok | geçti |
| terzi | 15 | 0 → 0 | 0 → 0 | 7 / 4 | kapanır | yok | geçti |
| toptan | 17 | 0 → 0 | 1 → 0 | 6 / 4 | kapanır | yok | geçti |
| usta | 18 | 0 → 0 | 0 → 0 | 10 / 0 | kapanır | yok | geçti |
| veteriner | 13 | 0 → 0 | 0 → 0 | 4 / 3 | kapanır | `a` | geçti |
| yurt | 19 | 0 → 0 | 1 → 0 | 9 / 8 | kapanır | yok | geçti |

## Kalan hatalar

| Yer | Sorun | Neden bırakıldı |
|---|---|---|
| `dugun`, `fotograf` takvimi | Gün hücresi 43 px geniş | 7 sütun 375 px'e sığmıyor, yükseklik 58 px |
| `musavir` evrak matrisi | Düğme 34×44 | Çok sütunlu tablo, yatay kayar |
| `site` aidat, `veteriner` sahipler, `spor` giriş | Kısa bağlantı 20-35×44 | Satır içi kısa metin |
| 60 tablo | Hâlâ yatay kayıyor | 10 sütundan fazla, kart çok uzar |
| Alt çubuk | Uzun etiket bölünür: "Rezervasyonl/ar" | 375 px'te 5 sekme dar, kesilme yok |
| Kontrast | `adisyon` gül rengi açık zeminde 3,95:1; Trendyol rozeti 2,77:1 (marka rengi); kişi renkleri ve yıldızlar veriden gelir; belge önizleme satır numarası 2,85:1 | Marka ve veri rengi, ürün kararı gerekir |
| Pazar yeri `market/market.css` | 14 yerde `1fr` kaldı, logo 30 px yüksek, `summary` 21 px | Başka oturumun alanı. Bu turda taşma ölçülmedi |
| `apps/*/*.html` müşteri sayfaları | 58'e kadar küçük hedef (`emlak/ilan.html` en yüksek) | Çoğu vitrin bağlantısı. Sayfa kendi CSS'iyle çiziyor, ayrı dalga |
| POS satış ekranı | Ürün ekledikten sonra Nakit düğmesi kaydırma gerektirir (y≈970) | Tasarım kararı. Sabit sepet özeti "Beklenen" dalgasına uygun |
| `muhasebe` e-Belge | Tek taramada XSLT konsol uyarısı çıktı, tekrarlanmadı | Chrome yerleşik XSLT, `core/integrations.js`; önceki taramalarda `klinik` ve `pos`ta da görüldü |

## Denenmeyenler

- iOS Safari, gerçek Android Chrome, gerçek ekran klavyesi, ekran okuyucu.
- Android uygulaması: derlenmedi, denenmedi. Electron masaüstü uygulaması denenmedi.
- Sürükle-bırak, kamera ile barkod, imza alanı dokunma, dosya yükleme.
- Gerçek yazdırma penceresi: 47 programda 218 yazdırma penceresi açıldı, otomatik kapatıldı, içeriği ve kâğıt çıktısı denetlenmedi.
- Otomatik gezinti her sayfada en çok 5 düğme dener, yıkıcı düğmelere basmaz. Her iç sekme ve alt sayfa ayrı ayrı açılmadı.
- Bulut kipinde panelin senkron hata çubuğu ve zayıf bağlantıda çift yazma denenmedi. Bulut kipinde yalnız `eticaret`, pazar yeri ve admin denendi, 51 programın taraması demo kipindedir.
- Test aracı notu: 50 dokunuşta Playwright dokunma onayı dönmedi. Her seferinde sayfa canlıydı, ürün donması değildir; o dokunuşlar programla tıklandı.

## Ekran görüntüleri

`docs/test/telefon-ekran/`: `once-*.png` ilk hâl, `sonra-*.png` son hâl: `tablo`, `modal`, `randevu-saat`, `adisyon-siparis`, `koyu-tablo`. Ödeme: `odeme-onay.png`, `odeme-sonuc.png`.

## Doğrulama

`npm test`: çıkış kodu 0, 1743 denetim, GİB XSD testi çalıştı (atlanmadı). Paralel oturumlarla port çakışmasını önlemek için testler kendi port değişkenleriyle ayrı portlarda çalıştırıldı, test kodu değişmedi. Veritabanı `nebsoft_test_m1`. `indir/kilavuz/` git'e girmediği için üç kılavuz PDF'i kardeş kopyadan alındı (birleştirme raporundaki bilinen durum). Yeni test: `server/test/telefon.test.js`, hiçbir test gevşetilmedi. `sw.js` `V` `nebsoft-v3-95`.

Tarama araçları depoya eklenmedi, ortak not klasöründe `telefon-arac/` altında durur.

## Senden gerekenler

1. Bir iPhone ve bir Android telefonda şunları dene: randevu alma, POS satışı, formda geri tuşu, klavye açıkken form.
2. Android uygulamasında fiş yazdırmayı dene, sonucu söyle.
3. Telefonda ilk açılışın hızlandırılmasını ayrı iş olarak isteyip istemediğine karar ver.
4. Dalı birleştirme kararı sende, push ve merge yapılmadı.
