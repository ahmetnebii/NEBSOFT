# Sipariş ve Teslim grubu: bağımsız sınama raporu

Tarih: 2026-10-31. Kapsam: `kurutemizleme`, `matbaa`, `pastane`, `cicekci`, `terzi`, müşteri takip ve onay sayfaları. Dal: `claude/siparis-teslim-eea7dd`. Önceki raporlara güvenilmedi; aşağıdaki her sonuç bu oturumda elde edildi.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Engel | Kanıt | Kim çözer |
|---|---|---|---|
| E1 | **Kurye kendi işinde fiyat, ödeme ve durumu değiştirebiliyor, başka kuryeye yeni iş açabiliyor.** Sunucu rolü yalnız satır görünürlüğünü kısıtlıyor. | Gerçek HTTP: kurye hesabı `PUT /api/data/cicekci` ile `price: 1`, `payments: 9999`, `status: teslim` yazdı, yanıt 200, sahip hesabında bu değerler göründü. Yeni `orders` kaydı da kabul edildi. | `server/cloud/rol-kural.js` `sipKurye`. Kapsam dışı bir dosya, **karar sizde**. Arayüzdeki Düzenle ve İptal kuryeden gizlendi, ama bu yalnız arayüzdür. |
| E2 | **Matbaa üretim ve pastane usta rolleri de sipariş tutarını ve ödemeyi yazabiliyor.** | `rol-kural` sondası: üretim hesabı `lines.price` ve `payments` yazdı, sunucu geri koymadı. Tasarım gereği olabilir, spec'te açık değil. | Karar gerekli: bu roller fiyat görsün ve yazsın mı? |
| E3 | **Uyumsoft canlıda seçilebiliyor, resmî API dokümanı yok.** Yalnız WSDL var, WSDL bu oturumda okunmadı. | Entegrasyon tablosu. `EFAT_OK` listesinde. Kural gereği DOĞRULANAMADI olan seçilemez. | `core/integrations.js`. Sizden: WSDL ile karşılaştırma veya canlıda kapatma kararı. |
| E4 | **WhatsApp Cloud API canlıda seçilebiliyor, istek resmî zorunlu alanla uyuşmuyor.** Meta sayfası `recipient_type` alanını zorunlu yazıyor, kod göndermiyor. Metin ve şablon alanları ile 24 saat kuralı doğrulanamadı. | Entegrasyon tablosu. | `core/integrations.js` |
| E5 | **Hiçbir entegrasyon test hesabıyla denenmedi.** Dokümanla uyum canlı test yerine geçmez (`CLAUDE.md` §1). | Görev gereği gerçek hesap ve ileti kullanılmadı. | Sizden: Netgsm, Nilvera veya Paraşüt test hesabı. |
| E6 | **e-Belge KDV oranı varsayılan %20.** Bu hizmetler için doğru oran doğrulanamadı. Ayarda değiştirilebilir, boşsa 20 uygulanır. | `Ayarlar > KDV oranı`. Kaynak okunmadı. | Mali müşavir onayı. |
| E7 | **Fiş yazıcı ve etiket yazıcı komutları doğrulanamadı.** Epson sayfası 403, Zebra alan adı çözülemedi. Tarayıcıdan yazdırma varsayılandır, ağ ve seri kipleri canlıda seçilebilir. | Entegrasyon tablosu. | Gerçek cihazla deneme. |

`server/test/bilet-kural.test.js` bu sınamada da kaldı (`Online satış kapandı`, gece saati). Bu grupla ilgisi yok, düzeltmesi ayrı dalda.

## Özet

- 5 programın menüsündeki her ekran açıldı. Ana akışlar elle hesapla karşılaştırıldı.
- **28 hata bulundu ve düzeltildi.** Hepsi tarayıcıda yeniden sınandı, hesap olanlara test eklendi.
- En ağır üç bulgu: e-Belge tutarı fişle uyuşmuyordu; kesilemeyen fatura kayıtta kesilmiş görünüyordu; gizli gönderenin adı alıcının imzaladığı belgede yazıyordu.
- `core/` ve `server/cloud/` değişmedi. Değişenler: `apps/siparisortak/`, beş program klasörü, `server/test/siparis-kural.test.js`, `sw.js` (`V` sürümü).

## Test sonucu

- Test zinciri tek tek çalıştırıldı: **65 dosyanın 64'ü geçti**, kalan `bilet-kural` (yukarıda). Dosyaları tek tek çalıştırdım, tek `npm test` komutuyla değil: `npm test` ilk hatada durduğu için `bilet-kural` zinciri keserdi.
- `shopier` ve `katalog` ilk turda kaldı, sebebi paylaşılan port (5098) ve başka oturumların sunucularıydı. Kendi portlarıyla yeniden çalıştırıldı: 54 ve 57 denetim geçti.
- GİB XSD testi çalıştı, atlanmadı: 9 belge geçti.
- `siparis-kural`: 27 denetim (5'i bu raporla eklendi). `siparis-bulut`: 12 denetim.
- `siparis.js` üzerindeki son değişiklikten (e-Belge sonucu, VKN alanı) sonra tüm zincir yeniden çalıştırılmadı; `siparis-kural`, `siparis-bulut` ve tarayıcı denemesi yapıldı.

## Program başına sonuç

### Kuru Temizleme
Denenen: fiş açma, m² hesabı, düzenleme, durum ilerletme, hazır SMS'i, tahsilat, kısmi teslim, iptal ve iade, imza, üç belge, takip, puan, talep, Dağıtım, şoför rolü, arama, süzgeç, özet.
Elle hesap: 8 m² × 80 + 3 × 120 − 50 + 100 = 1.050 ₺, kapora 200, kalan 850. Ekranla aynı. Özet: 30 gün ciro 88.427,70 ₺ ve tahsil edilecek 55.644,88 ₺, kayıtlardan ayrıca hesaplandı, aynı çıktı.
Liste süzgeçleri kayıt sayısıyla tuttu (21 / 36 / 4 / 61). Yenileme sonrası veri kaldı.

### Matbaa
Denenen: iş açma, onaysız üretime geçiş engeli, sürüm ekleme, müşterinin düzeltme istemesi, ikinci sürüm, yüz yüze onay, baskı, son işlem, hazır, teslim, kontrol listesi, hata kaydı, teklif ve iş emri. Bulutta müşteri onayı gerçek arayüzden verildi, durum "Baskı" oldu.
Elle hesap: 4,5 m² × 180 + 1000 × 2 − 10,50 = 2.799,50 ₺. Ekranla aynı.

### Pastane
Denenen: sipariş, saat zorunluluğu, kapora kuralı, üretim planı, stok düşümü, reçete, malzeme, zayi, usta rolü.
Elle hesap: çikolatalı pasta reçetesi 251,60 ₺, ekranla aynı. Üretim stoktan doğru düştü (un 60 → 59,5, yumurta 300 → 294). 2 pasta zayi 503,20 ₺.

### Çiçekçi
Denenen: alıcı ve gönderen, bölge ücreti, kart notu, gizli gönderen, kurye fişi, teslim edilemedi, yeniden kuryeye verme, teslim kanıtı, teslim SMS'i, özel günler, çiçek stoğu, fire, kurye rolü.

### Terzi
Denenen: iş, etkinlik sonrası teslim uyarısı, prova ekleme, hatırlatma, prova sonucu, ölçü kaydı, ölçü farkı, askı fişi, iş fişi, şablonlar.

### Müşteri sayfaları
Bulutta (MariaDB, 5122) denendi: işletme adresli takip bağlantısı doğru (`/t/<işletme>/apps/...`), QR ve WhatsApp aynı adresi kullanıyor.

| Saldırı | Sonuç |
|---|---|
| Kodsuz görünüm, sıralı numarayla giriş | Sipariş gelmez, 401 |
| Yanıtta iç not, adres, satır notu, imza, fotoğraf, müşteri telefonu, gizli ayar | Yok, 8 dize tek tek arandı |
| A kodunun anahtarıyla B işine yorum | 403 |
| Teslim edilmemiş işe yorum, durum yazma, silme, ekleme, müşteri değiştirme | 403 |
| Başka işletmenin kodu | 401 |
| Kod tahmini | 20 denemeden sonra 429 |

Not: 429 alan müşteri "kayıt bulunamadı" görüyor, sebebi anlatılmıyor. `db.lookup` hatayı yutuyor (`core/`).

## Düzeltilen hatalar

| # | Hata | Kanıt (önce) | Düzeltme |
|---|---|---|---|
| 1 | Fazla tahsilat kabul ediliyordu | 9.999 ₺ yazıldı, kalan −9.149 ₺ | `H.tahsilHata` |
| 2 | Eksi tahsilat kabul ediliyordu | −100 ₺ kayda geçti | Aynı |
| 3 | Teslimde fazla tahsilat | Kalan −200,50 ₺ | Aynı, durum değişmez |
| 4 | Teslimden sonra kalan borç tahsil edilemiyordu | Kalan 450 ₺, Tahsilat düğmesi yok | Düğme borç varken görünür |
| 5 | Teslimdeki tahsilat geçmişe yazılmıyordu | Geçmişte satır yok | Yazılıyor |
| 6 | **e-Belge tutarı fişle uyuşmuyordu:** indirim ve teslimat satırlara girmiyordu | Kod incelemesi, `create` satır toplamını alır | `H.efSatirlar`: 1.090,00 ₺ fişle eşit, teslimat ayrı satır |
| 7 | **Kesilemeyen fatura "kesildi" yazıyordu:** `r.no` hata durumunda da dolu | Kod incelemesi; düzeltmeden sonra Nilvera seçili denemede `Fatura kesilemedi` | `r.ok` denetimi |
| 8 | Alıcı VKN'si hiç gönderilmiyordu, gerçek entegratörde her belge başarısız olurdu | Simülasyon bunu gizliyordu | Müşteriye `VKN / TCKN` alanı (`apps/saha-ortak` deseni) |
| 9 | **Gizli gönderen, alıcının imzaladığı teslim belgesinde yazıyordu.** Ad, telefon ve fiyat görünüyordu | Belge metni | `teslimDoc`: fiyat, takip kodu, QR kalktı; gizliyse gönderen de |
| 10 | Her belgede "Takılan parçalar ... garantilidir" metni çıkıyordu | Fiş, etiket, üretim planı metni | Bu programlarda varsayılan boş |
| 11 | En × boy fişte yoktu, spec "yazılır" diyor | Fişte yalnız `8 m²` | `2,5 × 3,2 m` yazılıyor |
| 12 | m² satırı ölçüsüz 1 m² sayılıyordu | Yün halı 130 ₺ kaydedildi | Ölçü girilmeden kaydedilmez |
| 13 | Kg satırı adet sayılıyordu | 5 kg → 5 etiket | `H.parcaAdet` |
| 14 | Adresten alma adressiz açılıyordu | Şoförde "Adres yok" | Adres zorunlu, adres ve kurye alanı açılır |
| 15 | Demo ve yerelde talep Siparişe çevrilemiyordu | Düğme sayısı 0 | Durum yazılır, eski kayıt da çalışır |
| 16 | Kapora kuralı sürükle bırakla atlanıyordu | Ödenen 0, durum Hazır | Pastane ve terzi, sonraki bütün aşamalar |
| 17 | Bölge ücreti toplamda görünmüyordu | Form 1.200 ₺, kayıt 1.400 ₺ | Bölge seçilince ücret gelir |
| 18 | Fire stoktan fazla yazılınca stok sessizce sıfırlanıyordu | 999.999 yazıldı, stok 120 → 0 | Reddedilir |
| 19 | İptal edilen işte "Kalan" görünüyordu (panel ve takip) | Kalan 1.700 ₺ | `H.borc` |
| 20 | Müşteri takip geçmişi tekrarlıyordu | "Hazır" 3 kez, "Teslim alındı" 3 kez | Ardışık aynı aşama birleşir |
| 21 | Usta "Yeni malzeme" ve "Sil" görüyordu, sunucu reddediyordu: görünen başarı sahteydi | `geriKoy` sondası | Usta yalnız stok yazar |
| 22 | Kurye dağıtımdan iş detayına gidemiyordu; teslim edilemedi ve fotoğraf yoktu | Kartta bağlantı yok | Bağlantı eklendi; kuryede Düzenle, İptal, kurye seçimi ve boş SMS menüsü kalktı |
| 23 | Çok uzun metin sayfayı taşırıyordu | Genişlik 4.607 px | Sözcük kırılır |
| 24 | Sıfır üretim, sıfır zayi kaydı, olmayan tarih (02-30) kabul ediliyordu | Plan 0, tarih kaydedildi | Reddedilir |
| 25 | Çiçekçide hazır SMS varsayılanı kapalıyken ayar kaydedilmemiş işletmede gidiyordu | Kod incelemesi | `ayar()` programın varsayılanını okur |
| 26 | Kapora toplamdan büyük yazılabiliyordu | Kod incelemesi | Reddedilir |
| 27 | Etiket, askı, kurye fişi ve üretim planında `₺0,00`, imza kutusu; teklifte "Teslim eden" imzası | Belge metni | Fiyatsız, imzasız |
| 28 | Ondalık nokta ile yazılıyordu (`4.5 m²`, `170.5`), eski kayıtta başlık hatası, "0 fiş kaydı var, silinemez", usta zayisinde maliyet ₺0, demo kurabiye reçetesi 40 adet ama kg satılıyor | Ekran | Düzeltildi; reçete alanına birim uyarısı eklendi |

Mobil: pano özet kartları iki sütun, liste süzgeci düğmeleri 27 px'ten 40 px'e çıktı.

**Yanlış alarm:** İlk denemede 2,5 × 3,2 için 800 m² çıktı. Sebep program değil, otomasyonumun çekirdeğin Türkçe sayı girişini atlamasıydı. Doğru girişle sonuç 8 m².

## Kalan hatalar ve eksikler

| Konu | Durum | Nerede |
|---|---|---|
| `min`, `max` form denetimi çalışmıyor; alanlara eksi ve sınır dışı yazılabiliyor. Bu gruptaki yerler tek tek korundu, diğer programlar da etkilenebilir | Çekirdek isteği | `NS.validate` |
| `NS.crud` `beforeSave` hatasında modal kapanıyor, kullanıcı yazdığını kaybediyor | Çekirdek isteği | `core/core.js` |
| Belge kalem tablosunda fiyatsız belgede de "Tutar" başlığı duruyor | Çekirdek isteği | `core/docs.js` |
| Takipte 429 hatası "bulunamadı" görünüyor | Çekirdek isteği | `core/core.js` |
| Liste satır düğmeleri mobilde 30 × 42 px | Çekirdek isteği | `NS.table` |
| Teslim edilmiş işte iade akışı yok; iptal sonrası kapora iadesi yapılamıyor | Eksik özellik | Karar gerekli |
| Fiyat listesindeki "Teslim süresi (gün)" alanı hiçbir yerde kullanılmıyor | Ölü alan | Karar gerekli |
| Sipariş silinemiyor, yalnız iptal var | Tasarım | Bilgi |
| Reçete ve üretim kaydı geri alınamıyor, tezgâh planı silinemiyor | Eksik özellik | Pastane |
| Çiçek stoğu siparişten düşmüyor | Spec'te "Yok" | Çiçekçi |
| Talep formundaki KVKK onayında aydınlatma metni bağlantısı yok | Hukuki kontrol | Takip sayfası |

## Entegrasyon tablosu

Okuma tarihi hepsinde 2026-10-31. "Doküman" sütunu istek biçimini anlatır. Hiçbiri gerçek hesapla denenmedi (E5). Bu programların `integrations` listesinde **ödeme yok**: tahsilat elle girilir, sanal POS bağlantısı bulunmaz.

| Bağlantı | İddia | Etiket | Kaynak |
|---|---|---|---|
| Netgsm SMS | `POST /sms/rest/v2/send`, Basic, `msgheader`, `messages[{msg,no}]`, `encoding`, `iysfilter` 11/12, `appname`; numara `510xxxxxxx`; HTTP GET kapalı | DOĞRULANDI | https://www.netgsm.com.tr/dokuman/ (tarayıcıda açıldı, sürüm notu 1.8) |
| İleti Merkezi SMS | Uç, JSON yapısı, `receipents`, `iys`, `iysList`, numara biçimi | DOĞRULANDI | https://www.toplusmsapi.com/sms/gonder/json (© 2013-2024) |
| Verimor SMS | Uç, `username`, `password`, `source_addr`, `messages[{msg,dest}]`, `905...` | DOĞRULANDI | https://github.com/verimor/SMS-API/blob/master/user_guide.md |
| Verimor ticari ileti | `is_commercial`, `iys_recipient_type` gönderilmiyor; yalnız bilgilendirme için yeterli | DOĞRULANDI | Aynı kaynak |
| Twilio SMS | `Messages.json`, Basic, `To`, `From`, `Body`, E.164 | DOĞRULANDI | https://www.twilio.com/docs/messaging/api/message-resource (2026-03-09) |
| Mutlucell SMS | Canlıda seçilemez, gönderim yapılmaz | DOĞRULANDI (kilit) | Kod: `SMS.mutlucell.unverified` |
| WhatsApp bağlantısı | `wa.me/90...?text=` | DOĞRULANAMADI | https://faq.whatsapp.com/5913398998672934 (içerik gelmedi) |
| WhatsApp Cloud API uç adresi | `POST /{Version}/{Phone-Number-ID}/messages`, Bearer | DOĞRULANDI | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages |
| WhatsApp Cloud API `recipient_type` | Doküman zorunlu diyor, kod göndermiyor | UYUMSUZ (E4) | Aynı kaynak |
| WhatsApp metin, şablon alanları, 24 saat kuralı | | DOĞRULANAMADI (E4) | Şema tabloları okunamadı |
| Nilvera e-Belge | `api.`/`apitest.nilvera.com`, Bearer, `/earchive/Send/Base64String`, `ZIPFileBase64`, yanıt `UUID`, `InvoiceNumber` | DOĞRULANDI | https://developer.nilvera.com/api/e-arsiv-api/e-fatura-goenderme/faturayi-base64string-olarak-gonderir.md (v1) |
| Nilvera `/einvoice/Send/Base64String` gövdesinde `Alias` | e-Arşiv sayfası okundu, e-Fatura sayfası okunmadı | DOĞRULANAMADI | Listede var, gövdesi okunmadı |
| Paraşüt uç adları | `api.parasut.com/v4`, `grant_type=password`, `sales_invoices`, `e_invoices`, `e_archives`, `e_invoice_inboxes`, `trackable_jobs` | DOĞRULANDI | https://apidocs.parasut.com/swagger.json (4.0.0) |
| Paraşüt alan düzeyi | Gönderilen öznitelikler karşılaştırılmadı | DOĞRULANAMADI | |
| Uyumsoft | Herkese açık doküman yok, WSDL okunmadı | DOĞRULANAMADI (E3) | https://efatura-test.uyumsoft.com.tr/services/integration |
| Logo, Sovos, Mysoft, EDM | Canlıda seçilemez | DOĞRULANDI (kilit) | Kod: `EFAT_OK` |
| İsimsiz nihai tüketici 11111111111 | `create` varsayılanı; GİB sayfasında bulunamadı | DOĞRULANAMADI | https://ebelge.gib.gov.tr/ ; kılavuz PDF'i okunmadı |
| KDV oranı | Varsayılan %20 | DOĞRULANAMADI (E6) | Kaynak okunmadı |
| ESC/POS | Fiş yazıcı komutları | DOĞRULANAMADI (E7) | Epson sayfası 403 |
| ZPL, TSPL | Etiket komutları (kuru temizleme) | DOĞRULANAMADI (E7) | Zebra sayfası çözülemedi |
| E-posta (EmailJS, köprü) | | DOĞRULANAMADI | Okunmadı; varsayılan `mailto` |
| Hazır SMS'i "bilgilendirme" sayılması | 6563 sayılı Kanun ve Yönetmelik metni | DOĞRULANAMADI | https://mevzuat.gov.tr (metne ulaşılamadı) |

Sahte başarı denetimi, tarayıcıda:

| Durum | Sonuç |
|---|---|
| SMS simülasyonu | Kayıt `TEST — gönderilmedi`, ekranda "TEST: gönderilmedi", geçmişte TEST |
| e-Arşiv simülasyonu | Fatura no `... (TEST)`, belge durumu `test` |
| Entegratör hatası | `Fatura kesilemedi`, kayıtta fatura yok |
| Müşteri yazma hatası | Çekirdek hata verir, başarı iletisi çıkmaz (kod incelemesi) |

## Arayüz, durumlar

| Denetim | Sonuç |
|---|---|
| 375 px | Terzi 8 ekran, detay ve form; yatay taşma yok, koyu tema okunaklı |
| 1280 px | Kuru temizleme, koyu tema, hizalama düzgün; 5 sütunlu pano yatay kayar |
| 1920 px | Matbaa ve terzi tüm menü, taşma ve hata yok |
| 5.000 kayıt | Pano 72 ms, liste 57 ms, özet 64 ms, kayıt 48 ms; 2,29 MB |
| Eski kayıt (`lines`, `log` yok, tanımsız durum) | Hatasız açılır |
| Konsol | Hata yok. Çalışma sırasında eklenen eksik kayıtta bir kez `reading '0'` görüldü, kaynağı bulunamadı, yeniden üretilemedi, yeni kayıt açılışında çıkmadı |

## Denenmeyenler

- Gerçek SMS, WhatsApp, e-Belge gönderimi, gerçek yazıcı ve etiket yazıcı, PDF çıktısı.
- Fotoğraf yükleme, CSV dışa aktarma, Belge şablonu düzenleyici, Ayarlar kaydetme (ekranlar açıldı, kayıt denenmedi). WhatsApp düğmesinde yalnız adres denetlendi.
- Teslim Takvimi tarih grupları elle sayılmadı.
- Dokunmatik sürükleme, gerçek telefon, imzanın parmakla atılması (imza olayla üretildi).
- 375 px ölçümü pastane, çiçekçi, matbaa özel ekranlarında ve takip sayfasında yapılmadı (motor ortak, terzide ölçüldü).
- 1920 px açık tema görsel olarak doğrulanamadı: ekran görüntüsü karanlık çıktı. Taşma ve hata ölçümü geçerli.
- Hiç veri girilmemiş yeni işletme ekranları tarayıcıda açılmadı. Boş liste yalnız Gelen Talepler ve Dağıtım'da görüldü.
- Sunucu rolleri HTTP ile yalnız çiçekçi kuryesinde denendi; tezgâh, üretim, usta `filtrele` ve `geriKoy` işlevleriyle sınandı.

## Olay notu

Kendi 5102 portlu sunucumu durdururken `Stop-Process` iki süreci birden sonlandırdı (PID 90944, 65788). Biri benimdi, diğerinin kime ait olduğunu doğrulayamadım. Başka bir oturumun sunucusu kapanmış olabilir; veri silinmedi. Ortak notlara yazıldı. Sonraki denemeler 5122 portunda yapıldı.

## Senden gerekenler

1. **E1 ve E2:** Kurye, üretim ve usta fiyat ile ödemeyi yazabilsin mi? Hayırsa `rol-kural.js` değişmeli.
2. **E3, E4:** Uyumsoft ve WhatsApp Cloud API düzelene kadar canlıda kapatılsın mı?
3. **E5:** Netgsm ile bir entegratörün test hesabı.
4. **E6:** Mali müşavirden KDV oranı.
5. Teslim edilmiş işte iade akışı eklensin mi?
