# Belge ve veri araçları: aday kapısı ve sonuç

Tarih: 31.10.2026. Dal: `claude/belge-veri-7508d5`.

## Okunan resmî kaynaklar (okuma tarihi 31.10.2026)

| Kaynak | Sürüm | Bu işte kullanıldığı yer |
|---|---|---|
| [Google spam politikaları](https://developers.google.com/search/docs/essentials/spam-policies) | 2026-08-28 | Toplu içerik, doorway, yanıltıcı işlev |
| [Google yararlı içerik rehberi](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | 2026-10-05 | Araç ana içeriktir; arama için üretim işaretleri; doğruluk |
| [2429 sayılı Kanun](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2429.htm) | RG 19.03.1981, 17284 | Genel tatil günleri, 28 Ekim ve arefe 13.00 |
| [Diyanet 2026](https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=2026), [2027](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154), [2028](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=185) | yıl tabloları | Ramazan ve Kurban Bayramı tarihleri |
| [TCMB Tebliğ 2021/5, Resmî Gazete](https://www.resmigazete.gov.tr/eskiler/2021/08/20210805-17.htm) | RG 05.08.2021, 31559 | IBAN yapısı: 26 karakter, alanlar, rezerv alan |
| [TCMB IBAN tebliği (İngilizce metin)](https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/Bottom+Menu/IBAN/Communique) | Tebliğ 2008/6 | MOD 97-10, Türkçe harf ve küçük harf yasağı |

Google'dan çıkarılan kapı soruları: araç sayfada gerçekten çalışıyor mu (yanıltıcı işlev), aynı işin çeşidi mi (doorway), değer katmadan çoğaltma mı (toplu içerik), kullanıcıyı başka yerde yeniden aramaya itiyor mu.

## Geçenler

| Aday | Tek cümlelik benzersiz iş | Kim, neden | En yakın mevcut araç, neden kopya değil | İlk çalıştırmada sonuç |
|---|---|---|---|---|
| CSV ve Excel Temizleme | Bozuk Türkçe harfli, görünmez boşluklu, yinelenen satırlı tabloyu temizleyip CSV ve XLSX olarak geri verir | Program değiştiren, e-ticaret ürün listesi yükleyen, muhasebeye dosya hazırlayan işletme: içe aktarma bu hatalar yüzünden reddedilir | `pdf-metin-cikarma`: o PDF'ten yazı alır. Tablo yapısı, kodlama ve yineleme ile ilgilenmez | Evet, kutuda örnek veri var, dosya istemez |
| Liste Karşılaştırma | İki listeden yalnız birinde olanları ve ortak olanları, yazım farklarını yok sayarak bulur | Sayım ile sistem stokunu, cari listesini, üye veya telefon listesini karşılaştıran çalışan: DÜŞEYARA hatası ve İ/ı farkı | `cari-mutabakat-mektubu`: mektup metni üretir, liste karşılaştırmaz | Evet, iki örnek liste dolu gelir |
| IBAN Doğrulama | TR IBAN'ın yapısını ve MOD 97-10 kontrolünü tek tek veya toplu liste halinde denetler | Toplu maaş, tedarikçi ödemesi ve iade listesi hazırlayan muhasebe: yanlış yazılmış IBAN ödemeyi geri çevirtir | Yok. `barkod-olusturucu` kontrol hanesi hesaplar ama başka veri ve başka iş | Evet, örnek satırlar dolu gelir |
| İş Günü Hesaplama | Tarihe iş günü ekler veya iki tarih arasındaki iş gününü resmî tatilleri düşerek sayar | Teslim tarihi, ödeme vadesi, proje takvimi veren işletme | `yillik-izin-hesaplama`: hak edilen izin gününü verir, takvim saymaz | Evet, bugünden 10 iş günü sonrasını gösterir |
| Türkçe Metin Düzenleme | Metni I/İ kuralına uygun büyük ve küçük harfe çevirir, bozuk Türkçe harfleri onarır, Türkçe harfleri İngilizce karşılıklarına çevirir | Eski programdan büyük harfli unvan alan, SMS veya dosya adı için harf çeviren, bozuk metin alan herkes | `pdf-metin-cikarma` ve CSV aracı: CSV aracı tabloyu işler, bu sayfa serbest metin içindir; harf çevirme orada yoktur | Evet, örnek metin dolu gelir |

## Elenenler

| Aday | Neden | Etiket |
|---|---|---|
| Vergi kimlik numarası ve T.C. kimlik numarası denetimi | Denetim hanesi formülü resmî kaynakta bulunamadı. Bakılanlar: 5490 sayılı Kanun (formül yok; metnin ilk 44 maddesi doğrudan, kalanı özet üzerinden okundu), `tckimlik.nvi.gov.tr` (yalnız başlık), `ivd.gib.gov.tr` ve `gib.gov.tr` (içerik okunamadı), `nvi.gov.tr` (HTTP 500). Bloglardaki formül CLAUDE.md §1 gereği doğrulanmış sayılmaz. Araç "geçerli" dese bile numaranın gerçek olduğunu söyleyemezdi | DOĞRULANAMADI |
| Rakamı yazıya çevirme | Kapıdan geçti, yapılmadı. İş `tahsilat-makbuzu-olusturucu`, `kira-makbuzu-olusturucu` ve teklif aracında yan ürün olarak var. Sayı hedef değil, ileride ihtiyaç görülürse `H.tutarYazi` ile yazılabilir | Ertelendi |
| SMS karakter sayacı | Türkçe harfli mesajın kaç parçaya bölüneceği operatöre ve hesap ayarına bağlı, resmî tek kural yok | DOĞRULANAMADI |
| Satır sıralama, yinelenen satır silme, boş satır silme (ayrı sayfalar) | Ayrı sayfa aynı metin kutusunun çeşidi olurdu: toplu içerik riski. Yinelenen ve boş satır CSV aracında var | Kapıdan geçmedi |
| Metin karşılaştırma (diff) | Liste karşılaştırma aynı aramayla çakışır, sözleşme karşılaştırma için güvenilir sonuç vermeden yanıltıcı olurdu | Kapıdan geçmedi |
| CSV'den Excel'e, Excel'den CSV'ye (ayrı sayfalar) | Aynı işin biçim çeşidi, doorway tanımı. Temizleme sayfasından iki biçimde de çıktı alınır | Kapıdan geçmedi |
| Büyük harf, küçük harf, Türkçe karakter çevirme (ayrı sayfalar) | Aynı şekilde biçim çeşidi. Tek sayfada seçenek | Kapıdan geçmedi |
| Banka adını IBAN'dan bulma | Tebliğ kodları TCMB'nin belirlediğini söylüyor, ancak resmî kod ve banka adı listesi okunamadı (TBB listesi dinamik, TCMB adresi 404). Araç kodu gösterir, banka adı yazmaz | DOĞRULANAMADI |

## Sonuç

### CANLIYA ÇIKMAYI ENGELLEYENLER

- Gerçek Chrome, Safari, Firefox ve gerçek telefonda denenmedi. Denemeler uygulama içi tarayıcıda, dosya seçici yerine `DataTransfer` ile yapıldı.
- Parola korumalı gerçek Excel dosyası denenmedi. Bozuk dosya denendi, aynı hata yolundan geçer.

### Eklenenler

Araç sayısı 44'ten 49'a çıktı. Hepsi `index,follow`, sitemap'te.

| Araç | Adres | Özgün kelime | Başlık / açıklama |
|---|---|---|---|
| CSV ve Excel Temizleme | `/araclar/csv-excel-temizleme/` | 418 | 66 / 164 |
| Liste Karşılaştırma | `/araclar/liste-karsilastirma/` | 368 | 60 / 163 |
| IBAN Doğrulama | `/araclar/iban-dogrulama/` | 379 | 63 / 162 |
| İş Günü Hesaplama | `/araclar/is-gunu-hesaplama/` | 415 | 65 / 157 |
| Türkçe Metin Düzenleme | `/araclar/turkce-metin-duzenleme/` | 389 | 62 / 161 |

Yeni dış kütüphane yok. Excel okuma ve yazma tarayıcının `DecompressionStream` ve `CompressionStream` özellikleriyle yapılır. `D.zip` sıkıştırılmış girdi kabul edecek şekilde genişledi, mevcut çağrılar değişmedi. Yalnız CSV aracı dosya aracıdır (`isle`), diğer dördü metin alır.

### Doğrulama

| Denetim | Sonuç |
|---|---|
| `node site/tools/build-araclar.js` | 49 araç, noindex 0 |
| `node server/test/araclar.test.js` | 27 grup geçti |
| `node server/test/araclar-veri.test.js` (yeni) | 13 grup geçti |
| `node server/test/araclar-dosya.test.js` | 16 grup geçti |
| `node server/test/seo-sayfalar.test.js` | 14 kontrol geçti |
| `npm test` tamamı | Çalıştırılmadı, MariaDB ve .NET ister |
| 375 genişlik, koyu tema, 5 araç | `scrollWidth` 375, geniş tablo kendi kutusunda kayar |
| Masaüstü, açık tema | CSV aracı, dizin ve iki eski araç açıldı |
| Konsol | Hata yok |
| Ağ kaydı | Yalnız sayfa ve kendi dosyalarımız, yükleme isteği yok |
| H1, canonical, robots, yapısal veri | CSV aracında sayfada, 5 aracın hepsinde testte doğrulandı. Liste aracında tarayıcıda da bakıldı |
| Bozuk veri | Boş alan, yanlış IBAN, `<script>` ve `<img onerror>` denemesi, ters tarih, 2025 ve 2029, bozuk `.xlsx`, eski `.xls`, boş CSV, yanlış uzantı: hepsi Türkçe hata verdi, HTML çalışmadı |
| Gerçek Excel | Üretilen XLSX, sıkıştırmalı ve sıkıştırmasız, onarım uyarısı vermeden açıldı. Sayılar sayı, tarihler tarih, başı sıfırlı barkod metin, `=1+1` düz metin kaldı. Excel'in kendi yazdığı dosya doğru okundu |
| Büyük veri | 150 bin satır 12 sütun CSV: Excel çıktısı dahil yaklaşık 9 sn, 6,7 MB. 200 bin satır temizleme Node'da 0,5 sn. 30 bin satır liste karşılaştırma 0,25 sn |

Denemede bulunup düzeltilenler: örnek IBAN'lar 26 yerine 28 karakterdi (test yakaladı), Excel'in yazmadığı sondaki boş hücreler yanlış sütun uyarısı veriyordu, tarih sütunu dar kalıp `####` görünüyordu, büyük XLSX sıkıştırmasız 119 MB çıkıyordu.

### Bilerek yapılmayanlar ve sınırlar

- Banka adı gösterilmez. Resmî kod listesi okunamadı.
- IBAN tebliğinin güncel Türkçe birleşik metni okunamadı. MOD 97-10 hükmü TCMB'nin 2008/6 İngilizce metninden, alan yapısı Resmî Gazete 2021/5 metninden alındı.
- İş günü aracı 2026-2028 dışını reddeder. 2029 için Diyanet tablosu okunup `AREFE` listesine eklenmeli.
- 2429 sayılı Kanun md. 2'deki, Cuma akşamı biten tatili izleyen Cumartesi hükmü uygulanmadı, çünkü metin kime uygulandığını açık yazmıyor. Sayfada sınır olarak yazıyor.
- Excel'de formülün yalnız son değeri alınır, biçim korunmaz.
- Excel'in İngilizce dil ayarında i harfini I yaptığı bilgisi sayfada "yapabilir" diye geçer ve burada denenmedi (hafızadan, doğrulanmadı).
- Sayıya çevirme yalnız kesin biçimlerde yapılır. `1.234` Türkçe binlik sayılır, `12.5` metin kalır.

### Motor ve SEO oturumundan istenenler

`build-araclar.js` değiştirilmedi. Şunlar gerekli:

1. **Dosya sürümü:** `/site/assets/araclar-*.js` adresleri sürümsüz ve 5 dakika önbellekte kalır (`max-age=300, must-revalidate`). Yayından sonraki bu sürede sayfa yeni, kod eski olursa yeni araçlar hata verebilir; denemede eski kodla çalışma yaşandı. `site.css?v=<özet>` gibi özet eklenmesi önerilir. `sw.js` içindeki `V` de değiştirilmedi, bu iş kapsamı dışındaydı, birleştirmede artırılmalı.
2. **Kategori:** Beş araç `belge` altında, ama dizin başlığı "Belge şablonları". `KATEGORI` listesine `['veri', 'Belge ve veri araçları', ...]` eklenmeli, sonra araçlarda `kategori: 'veri'` yazılmalı.
3. **`connect-src` kuralı** yalnız `isle` alanlı sayfada var. IBAN ve liste aracı veri alır, dosya almaz. Bu sayfalara da aynı kural eklenmesi önerilir. Kod ağ isteği atmıyor, ağ kaydında görülmedi.
4. **Araç sayısı üst sınırı:** `server/test/araclar.test.js:105` en çok 60 araç kabul eder. Üç oturum birleşince aşılabilir.

### Bu işin dışında kalan bulgu

`apps/ik/bordro.js:121` ve `server/cloud/security.js:113`, IBAN'ı `TR\d{24}` ile denetliyor. Tebliğ hesap alanını sayısal ve alfabetik tanımlıyor, harfli geçerli IBAN bu kodlarda reddedilir. Rezerv alan denetimi de yok.
