# Düğün Salonu & Organizasyon: ürün spesifikasyonu

Program kimliği `dugun`. Dal: `claude/rezervasyon-aile-faf00d`. Araştırma ve okuma tarihi 30.10.2026. Kullanıcı onayı bekliyor.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Etiket | Şimdiki davranış |
|---|---|---|---|
| 1 | Kapora iadesinin yasal oranı veya gün eşiği | DOĞRULANAMADI | Program yasal oran göstermez. İşletme kendi iptal kademelerini yazar, sonuç "öneri"dir, tutar elle değişir. |
| 2 | Yüz yüze imzalı sözleşmede cayma hakkı | DOĞRULANAMADI | Şablonda cayma hükmü yok. Avukata sorulacak. |
| 3 | Kapora + kalan planı taksitle satış (6502 md. 17-18, 7 gün cayma) sayılır mı | DOĞRULANAMADI | Avukata sorulacak. |
| 4 | Sözleşme şablonu | Örnek | Her yerde "Örnek şablon" uyarısıyla gelir. Avukat kontrolü olmadan bağlayıcı metin diye sunulmaz. |
| 5 | Ekranda atılan imzanın yazılı şekil yerine geçmesi | DOĞRULANAMADI | İncelenmedi. Çıktı alınıp ıslak imza atılabilir. |
| 6 | Ek hizmet SMS'i | Test edilmedi | SMS sağlayıcısı yoksa "TEST, gönderilmedi" yazar. |

Tarayıcıda denendi. Sunucu kuralları `server/test/rezervasyon-aile.test.js`, müşteri sayfası `server/test/rezervasyon-aile-uctan.test.js` ile gerçek sunucuda sınandı.

## Pazar araştırması

Ürün sayfaları (üretici beyanı, ürünler denenmedi): [Salon-Takip](https://www.salon-takip.com/), [DüğünApp](https://takvim.dugunapp.com/), [DüğünHaritası](https://dugunharitasi.com/), [Dugunrezervasyon.com](https://www.dugunrezervasyon.com/landing), [Düğün Takip](https://www.duguntakip.com/), [ATHENA Salon Takip](https://athenasalontakip.com/), [SalonNet](https://salonnet.net/).

Takvim, kapora ve sözleşme çıktısı herkeste var. Okunan sayfalarda iade takibi, kalem kalem değişiklik onayı ve etkinlik günü kalem kontrolü öne çıkmıyor. Bu "üründe yok" demek değildir.

Düğün salonu yazılımına yönelik şikâyet bulunamadı. Aşağıdakiler müşterilerin işletmelere şikâyetidir, tek taraflı beyandır, sıklık çıkarımı yapılamaz.

| Tema | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| İade gecikmesi, söylenenden fazla kesinti | [Rıhtım](https://www.sikayetvar.com/rihtim-dugun-ve-toplanti-mekanlari/rihtim-dugun-ve-toplanti-mekanlari-bizim-icin-cok-buyuk-bir-pismanlik-ve-hayal-kirikligi-oldu), [Velo](https://www.sikayetvar.com/velo-weddings-events/velo-weddings-events-almadigimiz-hizmetin-bedelini-geri-alamamak), [DüğünümüzVar](https://www.sikayetvar.com/dugunumuzvar/iptal-sonrasi-haksiz-kesinti-ve-geciken-iade) | Sözleşmede yazılı kademe, iptal hesabı, söz verilen iade tarihi, Bekleyen iadeler listesi, iade makbuzu | Var |
| Tarih veya salon değişimi | Rıhtım ve Velo kayıtları (aynı olay olabilir) | Çakışma engeli, tarih değişikliği geçmişi | Var. Çift rezervasyon şikâyeti doğrudan bulunamadı. |
| Söz verilen kapsam tutmuyor | [Nev-i Çeşni](https://www.sikayetvar.com/nev-i-cesni-davet/dugun-gunu-hayal-kirikligi-sozler-tutulmadi-hizmet-yetersiz-kaldi), [Aşk-ı Elif](https://www.sikayetvar.com/aski-elif-kir-dugunu/aski-elif-kir-dugunu-rezil-olduk) | Kalem kalem sözleşme, imzada oluşan etkinlik günü kontrol listesi, etkinlik föyü | Var |
| Beklenmeyen ek ücret | Aşk-ı Elif kaydı | Donmuş fiyat, imzalı sözleşmede yalnız ek protokol, imzasız protokol toplama girmez | Var |
| Tek taraflı sözleşme, belirsiz iptal şartı | [Tüketiciler Birliği haberi](https://www.ekonomist.com.tr/ekonomi-haberleri/evlenecek-ciftleri-ilgilendiriyor-tuketiciler-birligi-nden-dugun-salonu-sozlesmesi-uyarisi-geldi-76787) (görüş, mevzuat değil) | Düzenlenebilir şablon, iptal kademesi boşsa sözleşme hazırlanmaz | Var |
| Salonun çektiği görüntülerin kaybı | [DHA](https://www.dha.com.tr/gundem/dugun-goruntuleri-teslim-edilmeyen-cifte-200-bin-lira-manevi-tazminat-2909598) | Ek hizmet teslim takibi | Yok, sonraki dalga |

## Mevzuat

| İddia | Etiket | Kaynak |
|---|---|---|
| Yazılı sözleşme en az 12 punto, bir nüsha verilir | DOĞRULANDI | [6502 md. 4/1](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6502.pdf) (RG 28.11.2013/28835, 2026 dipnotlu) |
| Koşullar tüketici aleyhine değiştirilemez, ücret bilgisi ispatı düzenleyende | DOĞRULANDI | 6502 md. 4/2, 4/4 |
| Senet yalnız nama yazılı ve her taksit için ayrı | DOĞRULANDI | 6502 md. 4/5. Program senet basmaz. |
| Standart sözleşmedeki müzakere edilmemiş şart haksız şart denetimine tabi | DOĞRULANDI | 6502 md. 5, [Haksız Şartlar Yönetmeliği EK-1](https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=19798&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5) |
| Bağlanma ve cayma parası | DOĞRULANDI | [TBK md. 177-178](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6098.pdf) |
| "Kapora iade edilmez" Yargıtay kararı | DOĞRULANAMADI | Yalnız haber, esas no yok. Şablona konmadı. |

## Özellikler

| Özellik | Sınıf | Durum | Kaynak |
|---|---|---|---|
| Salon + tarih + seans takvimi, çakışma engeli | Olmazsa olmaz | Var | Pazar |
| Süreli opsiyon, süresi dolan tarih boşalır, kayıt kalır | Olmazsa olmaz | Var | Pazar |
| Müşteri, etkinlik türü, davetli | Olmazsa olmaz | Var | Pazar |
| Paket, kişi başı/sabit, hafta sonu ve sezon farkı, donmuş fiyat | Olmazsa olmaz | Var | Pazar, şikâyet |
| Kapora, ödeme planı, tahsilat, makbuz, gecikme listesi | Olmazsa olmaz | Var | Pazar |
| Sözleşme (NS.docs, 16 px), iptal şartı zorunlu | Olmazsa olmaz | Var, örnek şablon | Mevzuat |
| Roller (sunucuda) | Olmazsa olmaz | Var | CLAUDE.md |
| SMS ödeme hatırlatması | Beklenen | Var, sağlayıcı yoksa TEST | Pazar |
| Teklif talepleri, dolu tarihi bekleyen | Beklenen | Var | Pazar |
| Ek hizmetler, tedarikçi listesi | Beklenen | Var. Tedarikçi ödemesi yok. | Pazar |
| İptal, iade kaydı ve iade takibi | Beklenen | Var | Şikâyet |
| Müşteri sayfası: müsait gün, teklif, ödeme planı | Beklenen | Var | Pazar |
| Ek protokol | Fark yaratan | Var | Şikâyet |
| Etkinlik günü kontrol listesi | Fark yaratan | Var | Şikâyet |
| LCV, masa planı, etkinlik başına kâr | Fark yaratan | Yok, sonraki dalga | Pazar |
| e-Belge | Beklenen | Yok. `NS.ebelge` bağlanmadı. | Pazar |
| Salon gezisi randevusu | Beklenen | Yok | Pazar |

## Veri modeli

`halls`, `packages`, `extras`, `seasons`, `customers`, `events` (fiyat kayıtta donar: `pkgPrice`, `extras[]`; `plan[]`, `contract`, `addenda[]`, `tasks[]`, `log[]`, `cancel`), `payments` (iade eksi tutar), `leads`, `vendors`, `signedDocs`, `sms`.

Hesaplar `apps/dugun/hesap.js` içindedir; panel, müşteri sayfası ve sunucu aynı kodu kullanır.

## Roller

| Rol | Görür | Yazar |
|---|---|---|
| Yönetici | Her şey | Her şey |
| Satış temsilcisi | Tanımlar salt okunur | Etkinlik, tahsilat. İptal ve üst sınır üstü indirim yönetici PIN'i ister, sunucu belirteçsiz değişikliği geri alır. |
| Operasyon | Etkinlik, hazırlık. Fiyat, ödeme, sözleşme, talep sunucudan gitmez. | Yalnız hazırlık listesi ve operasyon notu |

## Sonraki dalga önerisi

LCV ve masa planı, tedarikçi ödemesi ve etkinlik kârı, e-Belge bağlantısı.
