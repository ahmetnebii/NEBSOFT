# Fotoğrafçı & Stüdyo: ürün spesifikasyonu

Program kimliği `fotograf`. Dal: `claude/rezervasyon-aile-faf00d`. Araştırma ve okuma tarihi 30.10.2026. Kullanıcı onayı bekliyor.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Etiket | Şimdiki davranış |
|---|---|---|---|
| 1 | Fotoğrafçıya özgü saklama süresi | DOĞRULANAMADI | Süreyi işletme yazar, sözleşmeye girer, sayaç uyarır. |
| 2 | Düğün fotoğrafı hizmetinin mesafeli cayma istisnasına girmesi | DOĞRULANAMADI | Şablonda cayma hükmü yok. |
| 3 | Ham dosya hakkı | DOĞRULANAMADI | Sözleşmede yazılacak, program karar vermez. |
| 4 | Sözleşme ve yayın izni metni | Örnek | "Örnek şablon" uyarısıyla gelir, avukat kontrolü gerekir. |
| 5 | Selfie ile yüz bulma | DOĞRULANAMADI | Eklenmedi, kapsam dışı. |
| 6 | Galeri fotoğrafları "acik" sınıfında | Risk, karar gerek | Müşteri oturum açmadan gördüğü için `gizli` sınıf kullanılamadı. Adres tahmin edilemez ve yalnız girişten sonra verilir, ama adresi bilen açabilir. Gizli sınıf için `/f/` ucuna müşteri belirteci gerekir. |
| 7 | Fotoğraflar yurt dışı depoya gitmez | Bilgi | Dosya deposu kendi sunucumuzdadır. Müşterinin yazdığı Drive bağlantısı onun sorumluluğundadır. |

Yükleme, adres saklama ve müşteri seçimi `server/test/rezervasyon-aile-uctan.test.js` ile gerçek sunucuda sınandı. Tarayıcıdan bulut kipinde yükleme denenmedi, tarayıcı küçültmesi yerel kipte denendi.

## Pazar araştırması

Ürünler denenmedi. Türk: [Weasist](https://www.weasist.com/ozellikler), [FotoAsist](https://fotoasist.com/), [ÇekimVar](https://www.cekimvar.com/), [Fotoup](https://fotoup.tr/), [Dijital Albüm](https://dijitalalbum.tr/). Karşılaştırma için yabancı: [Pixieset](https://pixieset.com/client-gallery/), [ShootProof](https://www.shootproof.com/features/), [HoneyBook](https://www.honeybook.com/photographers).

Türk ürünler albüm seçimi ve müşteri panelinde güçlü. Okunan sayfalarda teslim tarihi gecikme uyarısı, yedek ve silme teyidi, kişi bazlı izin az görüldü. Bu "üründe yok" demek değildir.

Türk fotoğrafçı yazılımına yönelik şikâyet bulunamadı. Aşağıdakiler müşteri şikâyetleridir, tek taraflı beyandır. Şikâyetvar kayıtlarının çoğu tek firmaya aittir, sektör geneli sayılmamalı.

| Tema | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Geç veya hiç teslim | [DüğünümüzVar](https://www.sikayetvar.com/dugunumuzvar/dugun-videomun-uzun-sure-gecikmesi-ve-album-setinin-geri-istenmesi), [Kayseri hakem heyeti haberi](https://www.haberler.com/3-sayfa/dugunde-cektigi-fotograf-ve-videolari-evli-cifte-18494464-haberi/) | Her işte teslim sözü, gecikme listesi, Teslim Takibi, müşteriye aşama görünümü | Var |
| Sonradan ek ücret | [DüğünümüzVar](https://www.sikayetvar.com/dugunumuzvar/odenen-dugun-fotografi-ve-video-paketi-teslim-edilmedi-ve-ekstra-ucret-isteniyor), [Peritozu](https://www.sikayetvar.com/peritozu-fotografcilik/dogum-fotografcisinin-soz-verdigi-videolari-vermemesi-ve-sozlesmeyi-ihlal-etmesi) | Donmuş paket fiyatı, kalem kalem kapsam, sözleşme | Var |
| Seçilen kare albümde yok | [DüğünümüzVar](https://www.sikayetvar.com/dugunumuzvar/24-bin-tllik-dugun-fotografciligina-ozensiz-cekim-ve-eksik-album) | Seçim kilidi, seçim listesi, albüme giren sayacı | Var |
| Dosya kaybı, teslimden önce silme | [CNN Türk](https://www.cnnturk.com/turkiye/yeni-evli-ciftin-dugun-videolari-silindi) | Yedek kontrol listesi, "kart silinebilir" yalnız iki kopya ve teslimden sonra | Var |
| İzinsiz kullanım | [Habertürk](https://www.haberturk.com/cektigi-dugun-fotografindan-izinsiz-album-yapti-yargitay-dan-emsal-karar-son-dakika-haber-3838431) (karar numarası yok, DOĞRULANAMADI) | Kişi bazlı, geri alınabilir yayın izni, imzalı form | Var |
| Kime teslim edildi | [Life Begins](https://www.sikayetvar.com/life-begins-photo/life-begins-photo-ne-dugun-fotograflarimizi-ne-de-video-kayitlarimizi-teslim-alabildik) | Teslim tutanağı: kişi, zaman, imza | Var |
| Yazılımda sürpriz arşiv ücreti | [ShootProof, Trustpilot](https://es.trustpilot.com/review/shootproof.com) | Fotoğraf kotası sabit, dolunca uyarı. Fiyat kararına bağlı. | Kısmen |

## Mevzuat

| İddia | Etiket | Kaynak |
|---|---|---|
| Portre, tasvir edilenin izni olmadan teşhir edilemez | DOĞRULANDI | [FSEK md. 86](https://www.mevzuat.gov.tr/MevzuatMetin/1.3.5846.pdf) |
| Her fotoğraf otomatik eser değildir | DOĞRULANDI | FSEK md. 1/B, 4 |
| Fotoğraf kişisel veridir, rızasız yayında tutmak aykırı bulunmuş | DOĞRULANDI | [KVKK 2021/422](https://www.kvkk.gov.tr/Icerik/7110/2021-422) |
| Süre veri sorumlusunca belirlenir, silme talebi en geç 30 gün | DOĞRULANDI | [Silme Yönetmeliği](https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK), [6698 md. 4, 7](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf) |
| Yazılı sözleşme en az 12 punto | DOĞRULANDI | [6502 md. 4/1](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6502.pdf) |

## Özellikler

| Özellik | Sınıf | Durum | Kaynak |
|---|---|---|---|
| Çekim takvimi, fotoğrafçı çakışması (yol süresi dahil) | Olmazsa olmaz | Var | Pazar |
| Paket, ek hizmet, donmuş fiyat | Olmazsa olmaz | Var | Pazar |
| Kapora, kalan ödeme, makbuz | Olmazsa olmaz | Var | Görev |
| Teslim sözü, aşamalar, geciken liste | Olmazsa olmaz | Var | Şikâyet |
| Sözleşme (NS.docs, 16 px) | Olmazsa olmaz | Var, örnek şablon | Pazar |
| Roller (sunucuda) | Olmazsa olmaz | Var | CLAUDE.md |
| Müşteri galerisi: kod, son gün, seçim, kilit | Beklenen | Var | Görev |
| Fotoğraflar dosya deposunda, belgede adres | Beklenen | Var. Sunucusuz kurulumda depo yok: en çok 8 küçük görsel. | Görev |
| SMS aşama bildirimi | Beklenen | Var, sağlayıcı yoksa TEST | Pazar |
| İndirme bağlantısı | Beklenen | Var, dosya başka hizmette | Pazar |
| Filigran | Beklenen | Yok | Pazar |
| Ekipman listesi, gider, e-Belge | Beklenen | Yok | Pazar |
| Birden çok çekimli iş | Olmazsa olmaz (pazarda) | Yok, her çekim ayrı kayıt | Pazar |
| Seçim-albüm eşleştirme, teslim kanıtı, yedek, yayın izni | Fark yaratan | Var | Şikâyet |
| Revizyon hakkı sayacı, indirme kaydı | Fark yaratan | Yok | Pazar |

## Roller

| Rol | Görür | Yazar |
|---|---|---|
| Yönetici | Her şey | Her şey |
| Asistan / Stüdyo | Tanımlar salt okunur | Çekim, ödeme, galeri. İptal yönetici PIN'i ister. |
| Fotoğrafçı | Kendi çekimleri ve galerileri. Fiyat, ödeme, sözleşme gitmez. | Aşama, yedek, kendi galerisi |
| Müşteri (galeri) | Kendi işi, açık galeri | Seçim, seçim bitirme |

## Sonraki dalga önerisi

Filigran, birden çok çekimli iş, ekipman, gizli sınıf için müşteri belirteciyle fotoğraf sunma.
