# PDF kullanım kılavuzu: durum raporu

Tarih: 2026-10-31. Durum: üretici kuruldu, üç örnek çıktı, kullanıcı onayı bekleniyor. Kalan 48 program onaydan sonra üretilecek.

## CANLIYA ÇIKMAYI ENGELLEYENLER

1. **PDF'ler depoda değil.** `core/kilavuz.json` commit'lidir, PDF'ler bu çalışma kopyasının `indir/kilavuz/` klasöründedir ve `.gitignore` nedeniyle birleştirmeyle taşınmaz. Birleştirmeden sonra ana klasörde `node scripts/kilavuz/uret.js pos terzi eticaret` çalıştırılmalı veya üç dosya kopyalanmalıdır. PDF eksikse `scripts/hosting-paketi.js` durur, kırık bağlantı yayına çıkmaz.
2. **Destek bilgileri teyit bekliyor.** Kılavuzda telefon `0850 555 00 34`, e-posta `destek@nebsoft.com.tr` yazar (`site/src/site.config.js`). Alan adı `nebsoftapp.com`, e-posta alanı `nebsoft.com.tr`. Gerçek olduğu kullanıcıdan doğrulanmalı.
3. **Logo kesin değil.** Şimdilik `assets/nebsoft-logo.webp`. Kesinleşince `scripts/kilavuz/ayar.js` içindeki `LOGO` değişir, kılavuzlar yeniden üretilir.
4. **Entegrasyonlar gerçek hesapla denenmedi.** Kılavuz `claude/sunucu-tanimlari-cffcb8` akışını anlatır: Entegre et, Bağlantıyı dene, Bağlı. "Bağlı" yalnız deneme geçince görünür. Açık kararlar `docs/ENTEGRASYON-ENVANTERI.md` başındadır (canlı ödeme kilidi, Yurtiçi düz http, Param, Stripe).
5. **Canlı kart ödemesi kapalı.** Sunucuda `IYZICO_CANLI=1` yoksa işletme test kutusunu kaldırsa bile kart seçeneği mağazada görünmez. Kılavuz böyle yazar.
6. **Katalog SSS metinleri eski (`market/catalog.js`).** `sssHaric` ile çıkarıldı: eticaret fotoğraf, kartla ödeme, Trendyol/Hepsiburada; pos Getir ve Yazarkasa. Katalog düzeltilmeli, site sayfalarında hâlâ eski metin var.
7. **E-ticaret e-İrsaliye kartı:** programda e-İrsaliye kesen çağrı yoktur, kılavuz böyle yazar.

## Çıktılar

| Program | PDF | Sayfa | Ekran | Boyut |
|---|---|---|---|---|
| Market POS | `indir/kilavuz/pos.pdf` | 80 | 52 | 7,1 MB |
| Terzi & Tadilat | `indir/kilavuz/terzi.pdf` | 66 | 36 | 5,2 MB |
| E-ticaret | `indir/kilavuz/eticaret.pdf` | 88 | 41 | 6,9 MB |

Üçü toplam 19,2 MB. Yeni tasarımla 51 program için tahmini toplam 330 MB. Hedef 15 MB'ın altında.

## Kararlar

- **PDF nerede durur:** `indir/kilavuz/<id>.pdf`. CLAUDE.md §4'e göre derleme çıktısıdır, depoya girmez. 51 PDF her üretimde değişir, git geçmişini şişirirdi. Depoya yalnız `core/kilavuz.json` girer, site ve program bağlantıyı buna bakarak gösterir.
- **Hosting:** `scripts/hosting-paketi.js` `KLASORLER` listesine `indir/kilavuz` eklendi. Ölçüm: üç PDF ile paket 1003 dosya, 62,5 MB. Yeni tasarımla tüm kılavuzlar paketi yaklaşık 390 MB yapar. PDF kaydı olup dosyası olmayan programda paket durur.
- **Erişim:** `DENY` listesi `/indir/` yolunu kapatmaz, üyelik gerekmez. `docs/` ve `scripts/` kapalı kalır (404 denendi). `server.js` `.pdf` türünü ve `X-Robots-Tag: noindex` başlığını verir. `sw.js` `V` değeri 88 oldu, `/indir/` service worker dışında bırakıldı.
- **SEO:** PDF herkese açık, dizine kapalı. Gerekçe `docs/SEO-KURALLARI.md`.
- **Üretilmiş sayfalar:** SEO oturumu `build-sites.js` üzerinde çalıştığı için yalnız üç program sayfası commit'lendi, diğer üretilmiş dosyalar geri alındı. Yeni kılavuz eklenince sayfalar `node site/tools/build-sites.js` ile yenilenir.
- **Çekirdek:** `USED` listesine terzi, cicekci, pastane, matbaa, kurutemizleme eklendi. Bu beş programda Entegrasyon Merkezi çalışmayan 55 kart gösteriyordu. `NS.integ.UNVERIFIED` ve `NS.kilavuzAdres` dışa açıldı.
- **Program içi bağlantı:** sol menünün altı, destek balonu ve yardım merkezi. Kayıt yoksa üçü de gizli. Adisyonda destek balonu olmadığı için menü bağlantısı yeterlidir.

## Doğrulama

- Her PDF sayfaya çevrildi, sayfalar okundu. Ekran görüntüsü boş değil, işaretler doğru elementte, Türkçe karakterler sağlam, içindekiler gerçek sayfa numarası gösteriyor. PDF iç bağlantısı: pos 36, terzi 27, eticaret 34.
- Üretim sırasında otomatik denetim: seçici yoksa, element örtülüyse veya alan dışındaysa, işaret boş alana düşüyorsa, kalın yazılan ad ekranda ve kodda yoksa, menü modülü atlanmışsa, entegrasyonun etkisi yazılmamışsa, vaat cümlesi varsa veya konsol hatası çıkarsa PDF yazılmaz.
- Telefon, e-posta ve kimlik numarası biçimindeki metin görüntüde bulanıktır: demo telefonları rastgele üretilir, gerçek bir numaraya denk gelebilir. Kişi adları tohum listesindeki kurgu adlardır.
- Bağlantılar tarayıcıda denendi: market, terzi ve eticaret sayfasında görünür, kılavuzu olmayan adisyonda görünmez. 390 px genişlikte yatay kayma yok. Program menüsü, destek balonu, yardım merkezi çalışıyor, konsol hatası yok.
- `server/test/kilavuz.test.js`: 13 kontrol geçti.
- Tüm test zinciri tek tek çalıştırıldı: 66 dosyadan 65'i geçti. **Düşen:** `server/test/bilet-kural.test.js` ("Online satış kapandı"). Test saate bağlıdır, gece çalıştırıldı, bu işin dosyalarına dokunmaz, ayrı oturumda ele alınıyor. `npm test` zincirde burada durduğu için tek tek çalıştırıldı. XSD testi .NET ile çalıştı, atlanmadı.

## İçerik yazarken

- Sahne ve içerik biçimi değişmedi. Entegrasyon metni `degisir` ve `sorun` alanlarında kalır. `kapali` listesi "NEBSOFT ile iletişime geçerek açtırılır" yazdırır.
- "Henüz kullanılamıyor", "kesin çalışır" ve "gerçek hesapla denendi" ifadeleri üretimi durdurur. Yerine "NEBSOFT ile iletişime geçerek açtırılır" yazılır.
- Düğme adları: **Entegre et**, **Bağlantıyı dene**, **İletişim talebi**. **Kur** artık yok.
- Katalog SSS maddesi eskiyse `sssHaric` ile çıkarılır, doğrusu `sss` ile yazılır.
- Logo: `KILAVUZ_LOGO=<dosya>` veya `scripts/kilavuz/ayar.js`.

## Yeni program için kullanım

1. `node scripts/kilavuz/kesif.js <id>` menüyü ve düğmeleri çıkarır. Pencere için: `node scripts/kilavuz/kesif.js <id> urunler --tikla "#add"`
2. `docs/kilavuz/<id>.js` yazılır, örnek: `docs/kilavuz/terzi.js`. Ortak modüller `O.belgeler()`, `O.ayarlar()`, `O.ebelge()`, `O.entegrasyonlar()`, `O.imzali()`, `O.bildirimler()` hazırdır. Kurulum adımları, roller tablosu, yedekleme ve sağlayıcı rehberleri çekirdekten otomatik gelir.
3. Sahne: `{ git, once, kirp, boy, en, adimlar: [[metin, seçici, 'ok']] }`. Seçici CSS'tir, `button@Yeni ürün` metinle arar. `kirp`: `ana`, `pencere`, `tam` veya seçici. `once`: `['tikla', seçici]`, `['yaz', seçici, değer]`.
4. `**ad**` ekrandaki veya koddaki birebir addır. Entegrasyonda `degisir` zorunludur, koddan doğrulanır. Çalışmayan sağlayıcı `kapali` ile işaretlenir.
5. `node scripts/kilavuz/uret.js <id>` üretir. Hata listesi düzeltilir.
6. `python scripts/kilavuz/sayfalar.py <klasör> indir/kilavuz/<id>.pdf <önek>` sayfaları görsele çevirir, hepsi okunur.
7. `node site/tools/build-sites.js`, sonra `node server/test/kilavuz.test.js`.

Demo verisi üretimde sabit tohumla oluşur, aynı örnekler gelir. İşaretli öğe ekranın altındaysa pencere kendiliğinden uzar, `boy` yazmak gerekmez. Öğe yatayda taşıyorsa `en: 1500` verilir.

## Süre ve bölüştürme

Tahmin: program başına üretim 1–1,5 dakika makine süresi. İçerik, koddan doğrulama ve sayfa okuma büyük programda 60–90 dakika, aile programında 30–45 dakika. Bu rakam üç örneğin deneyiminden çıkan tahmindir, ölçüm değildir.

Öneri: 48 program, 10 oturum. Her oturum yalnız `docs/kilavuz/` yazar, `core/` değiştirmez, çekirdek ihtiyacını raporlar. Kod incelemesi aile içinde tekrarlandığı için aileler birlikte gider.

| Oturum | Programlar | Adet |
|---|---|---:|
| 1 Sipariş | cicekci, pastane, matbaa, kurutemizleme | 4 |
| 2 Saha | nakliyat, temizlik, usta, peyzaj | 4 |
| 3 Rezervasyon | dugun, yurt, fotograf, oyun | 4 |
| 4 İmalat, taşıma | mobilya, okulservisi, ciftci, lastik | 4 |
| 5 Üyelik, eğitim | dernek, egitim, danisan, kurs, spor, anaokulu | 6 |
| 6 Perakende | adisyon, butik, eczane, kuyumcu, toptan, pazaryeri, fiyatrobotu | 7 |
| 7 Servis, araç | servis, otoservis, oto, galeri, kiralama | 5 |
| 8 Konaklama, etkinlik | otel, bilet, site, emlak | 4 |
| 9 Profesyonel | klinik, veteriner, hukuk, musavir, muhasebe, ik, crm, randevu | 8 |
| 10 Üretim, kargo | fabrika, kargo | 2 |

`danisan` satışa kapalı, `eczane` yeni satışa kapalıdır. İkisi için kılavuz gerekip gerekmediği kullanıcıya sorulmalı.

## Bilinen küçük sorunlar

- Demo modunda üstteki mavi şerit sol menünün altını birkaç piksel taşırıyor. Program içi kılavuz bağlantısı görünür kalıyor, en alttaki düğme kısmen kesiliyor.
- Demoda **Hazır katalogdan ekle** penceresi 401 konsol hatası veriyor, katalog oturum ister. Kılavuz bu pencereyi açmaz, demoda boş göründüğünü yazar.
- Uzun ayar formlarında (eticaret) görüntü sayfaya sığsın diye küçülür, alanlar ayrıca tabloda anlatılır.

## Senden gerekenler

1. Üç PDF'i incele, biçimi onayla veya değişiklik iste.
2. Destek telefonu ve e-postasını doğrula.
3. Logo kesinleşince haber ver.
4. Yukarıdaki uyuşmazlıklarda karar ver: sihirbaz düzeltilsin mi, yoksa bu sağlayıcılar kapatılsın mı?
5. `danisan` ve `eczane` kılavuzu istiyor musun?
6. Onaylarsan 48 program için 10 oturum başlatılır.
