# Eczane — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/eczane/` (`calc.js` hesap, `recete.html` hasta sayfası). Kabul (kullanıcı/pilot eczane) bekliyor.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEDULA (SGK provizyon / dönem faturası), İTS (karekod satış/alım/iade bildirimi), ÜTS, ÖKC — DOĞRULANAMADI:** resmî entegrasyon dokümanı bu projede doğrulanmadı → çekirdekte `UNVERIFIED`, yalnızca simülasyon. Eczanede bu bildirimler **yasal zorunluluktur**; gerçek kullanımda yetkili çözüm ortağı / SGK ve TİTCK dokümanı + test ortamı gerekir. Bu hâliyle program **eczanenin tek sistemi olamaz**; yardımcı stok, hasta ve kasa aracıdır. Uydurma alan, kod veya adres eklenmedi.
- **Satış iadesi:** program yalnızca kendi kaydını ve stoğu düzeltir. MEDULA/İTS iptali ilgili sistemden elle yapılır.
- **Eşdeğer fark ücreti — DOĞRULANAMADI:** SGK sayfasında hesap kuralı okunamadı; ilaç kartına eczacı girer. EK-4/D muafiyeti listeyle denetlenmez, eczacı satırda "Muaf" der.
- **Kontrole tabi ilaç defteri:** kırmızı ve yeşil reçeteli satışları kaydeder; **resmî defter biçimi, renkli reçete kuralları ve saklama süresi doğrulanmadı**, mevzuattaki defterin yerine geçmez. Mor ve turuncu reçete özel kuralları da doğrulanmadı.
- **Özel sigorta hasta payı** (%10 varsayılan) kaynaksızdır; poliçeye göre değişir, Ayarlar'dan girilir.
- **Karekod:** GS1 alan yapısı doğrulandı; İTS'e özel kurallar DOĞRULANAMADI. Gerçek karekod okuyucu ve gerçek kutu ile denenmedi (okuyucunun GS karakterini nasıl gönderdiği cihaza bağlı).
- **KVKK:** hasta verisi özel nitelikli kişisel veridir. Şifreli saklama, saklama süresi ve aydınlatma metni hukukçu tarafından değerlendirilmeli. Yerel kurulumda `data/` korunmalıdır.
- **Şikâyet verisi:** tek şikâyet okunabildi, istatistik yapılamaz.

## Doğrulananlar
- **Reçete başına katılım — DOĞRULANDI:** 3 kutuya kadar 3,76 ₺, ilave her kutu 1,25 ₺ ([RG 31.12.2025/33124, SUT değişiklik tebliği md. 2](https://www.resmigazete.gov.tr/eskiler/2025/12/20251231-11.htm), yürürlük 1.1.2026, okundu 30.10.2026).
- **İlaç katılım payı — DOĞRULANDI:** gelir/aylık alan ve bakmakla yükümlü olunan %10, diğer %20; enjektabl, serum, beslenme ürünü ve majistral kalem başına 1 kutu; EK-4/D raporlu ilaç muaf ve kutu hesabına girmez ([SGK İlaç Katılım Payı](https://www.sgk.gov.tr/Content/Post/21a07e94-9ba8-4c83-8dc7-3b6901ed8d3c/Ilac-Katilim-Payi-2026-01-09-03-53-21), sayfada yayın tarihi yok, okundu 30.10.2026). Tahsil yetkisi 5510 md. 68, muafiyetler md. 69 ([mevzuat.gov.tr](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm)).
- **UYUMSUZ bulunup düzeltilen:** reçete katılımı sabit 5 ₺'ydi ve kutu sayısına bakmıyordu. Yeni varsayılan 3,76 + 1,25; eski kurulumda 5 ₺ elle değiştirilmediyse otomatik güncellenir, geçmiş satışlar değişmez.
- **GS1 karekod — DOĞRULANDI (alan yapısı):** (01) GTIN 14, (17) SKT YYAAGG, (10) parti, (21) seri ([GS1 DataMatrix Guideline](https://www.gs1.org/docs/barcodes/GS1_DataMatrix_Guideline.pdf), [GS1 Application Identifiers](https://www.gs1.org/sites/default/files/docs/barcodes/GS1%20Application%20Identifiers.pdf)).

## 1. Pazar araştırması (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı. Yalnızca hangi ihtiyacın karşılandığı çıkarıldı.
- [İLON Eczane](https://ilonnext.com/eczane-programi.html): reçete, stok, ÜTS, e-Fatura, Medula; raf ve depo stoğu, sayım fark raporu.
- [Gelecek Yazılım](https://gelecekyazilim.com.tr/cozumler/eczane-otomasyonu.html): İTS/karekod, SGK provizyon, stok ve miad uyarı listeleri, cari, raporlar.
- [Eczane.io](https://mwm.ai/apps/eczaneio/6779976940) (uygulama tanıtımı): karekod sorgu, renk kodlu SKT.
- [Eczanem Mobil Satış](https://apps.apple.com/app/id1563628391): mobil satış; özellik ayrıntısı bulunamadı.
- Botanik, Farmakom: resmî özellik sayfası aramada **bulunamadı**.

**Şikâyetler:** [Şikâyetvar — Botanik Ecza](https://www.sikayetvar.com/botanik-ecza): "botanik programı" kategorisinde 26 şikâyet görünüyor, yalnızca biri okunabildi (31.12.2024): geri dönme tuşu kaldırıldığı için okutulan karekodlara ulaşılamıyor, kesintide kaldığı yerden devam edilemiyor. Sayfanın programla mı ticari satışla mı ilgili olduğu kesin değil. Diğer ürünler için şikâyet **bulunamadı**. Çıkarım: okutulan kutular listede görünmeli, yarıda kalan satış kaybolmamalı (ilki yapıldı, ikincisi yapılmadı).

| Özellik | Sınıf | Rakipte | Bizde (önce → sonra) |
|---|---|---|---|
| MEDULA, İTS | Olmazsa olmaz | Var | Simülasyon, **engelleyici** |
| Karekod okuma | Olmazsa olmaz | Var | Kırık → çözülüyor, bildirim yok |
| Parti/SKT, FEFO | Olmazsa olmaz | Var | Uydurma parti → düzeltildi |
| Satış iadesi, gün sonu | Olmazsa olmaz | Var | Yok → var |
| Sayım ve fark | Beklenen | Var | Yok → var |
| İlaç listesi aktarımı | Beklenen | Belirtilmemiş | Yok → Excel |
| Depo siparişi | Beklenen | Var | Kısmi → takip + belge |
| Kronik hatırlatma | Fark yaratan | Belirtilmemiş | Kısmi → ilaç bazlı, rıza ile |
| Hasta reçete ön hazırlığı | Fark yaratan | Belirtilmemiş | Var, iyileştirildi |
| Ölü stok raporu | Fark yaratan | Belirtilmemiş | Yok → var |
| Raf/depo ayrı stok, cari hesap | Beklenen | Var | Yok |

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | MEDULA reçete sorgusu simülasyonu reçeteyi "MEDULA: reçete doğrulandı" işaretliyordu | Simülasyonda "MEDULA TEST — reçete sorgulanmadı" uyarısı, doğrulandı işareti yok | Kod incelendi |
| H2 | Satış sonrası MEDULA / İTS / ÖKC simülasyonu yeşil "MEDULA / İTS / ÖKC" rozetiyle gönderilmiş görünüyordu | Simülasyon "TEST" kaydedilir, turuncu "MEDULA TEST / İTS TEST / ÖKC TEST" rozeti | Kod incelendi |
| H3 | MEDULA dönem faturası simülasyonu fatura kaydı oluşturuyordu | Simülasyonda kayıt oluşturulmaz, "TEST — gönderilmedi" | Kod incelendi |

## 2. dalga — kırık temel ve beklenenler
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| B1 | **Hasta güvenliği: muadil yalnızca etken maddeye bakıyordu**, 20 mg yerine 40 mg öneriyordu; reçete türü farklı ilaç da önerilebiliyordu | Aynı etken + form + doz + reçete türü; reçeteli satışta değişim eczacı onaylı | `calc.test.js`; tarayıcı: 40 mg çıkmadı, 20 mg çıktı |
| B2 | **Teslim alırken parti no ve SKT rastgele üretiliyordu**; mal kabulde hazır değer vardı; maliyet sabit %75 varsayımıydı | Parti, SKT gerekli; kutudan okunur veya elle girilir; SKT'si geçmiş stoğa alınmaz; kısmi teslim | Tarayıcı: boş alan reddedildi, karekodla 2029-06-30 geldi |
| B3 | **Sahte başarı:** "Bildirimleri yeniden gönder" simülasyon referansını gerçek gibi yazıyordu; depo simülasyonu "iletildi" diyordu; MEDULA kapalıyken "Dönem faturası gönder" uydurma `EL-` referansı üretiyordu; kapalı entegrasyonda sipariş "Yolda" görünüyordu | TEST / hata / gerçek ayrımı; elle fatura numarası girilir; sipariş "Kaydedildi · depoya iletilmedi" | Tarayıcı (sipariş, fatura); yeniden gönderme kod incelendi |
| B4 | **Karekod okutmak çalışmıyordu** (ekran "karekod okutun" diyordu, yalnızca düz barkod eşleşiyordu) | GS1 çözümü; SKT geçmiş kutu reddedilir, aynı kutu iki kez okunmaz, parti ve seri satışa işlenir | `calc.test.js`; tarayıcıda metinle benzetildi, gerçek okuyucu yok |
| B5 | Ciro hatası: eşdeğer fark toplama girmiyordu (hasta + kurum ≠ toplam); kuruş kayıyordu | Toplam = hasta + kurum, her satışta | `calc.test.js` (500 karışık reçete) |
| B6 | Katılım payı kutu kuralı ve muafiyet yoktu; özel sigorta oranı koda gömülüydü | Yukarıdaki kaynaklara göre; "Muaf" düğmesi; ayar | `calc.test.js`; tarayıcı: 4 kutu 5,01 ₺ |
| B7 | + düğmesi stoğu aşabiliyor, satış eksik düşüyordu | Ekleme ve ödemede denetim; hangi partiden düştüğü saklanır | Tarayıcı |
| B8 | Satış iadesi yoktu | Eczacı onayı, neden, isteğe bağlı aynı partiye stok dönüşü; ciro ve kurum alacağından düşer | Tarayıcı: kalfa PIN ile, parti stoğu geri geldi |
| B9 | Kalfa imha, iade, fiyat değişikliği yapabiliyor; bağlı ilaç/hasta/depo silinebiliyordu | `NS.approve` ve silme engeli | Tarayıcı |
| B10 | İmha/iade yalnızca adedi sıfırlıyor, kaydı kalmıyordu; sayım yoktu | Kısmi adet, stok hareketleri, tutanak (`NS.docs`), sayım düzeltmesi | Tarayıcı |
| B11 | **Sağlık verisi aracı servislere gidiyordu:** eksik ilaç SMS'inde ve WhatsApp hatırlatmasında ilaç adı vardı | Mesajlarda ilaç adı yok; işlem geçmişine hasta adı, TC, reçete no yazılmaz | Tarayıcı: SMS metni ve `_log` tarandı, sızıntı yok |
| B12 | SMS sonucu gizliydi ("Güncellendi") | Gerçek sonuç gösterilir, varsayılan "Yarın 14:00" kalktı | Tarayıcı: "TEST — gönderilmedi" |
| B13 | Reçete takip kodu `Math.random` ile 5 karakterdi | Sunucuda `rxCode()`: 6 karakter `crypto`; gönderen tarayıcı yalnızca kendi kaydını görür (güvenlik denetimi düzeltmesi) | `eczane-kural.test.js` |
| B14 | Hasta sayfasında uydurma açık saatler ve "depodan aynı gün temin" sözü vardı; satış ekranında demo barkod yazısı vardı | Saat ayardan, yoksa iddia yok; söz ve yazı kalktı; muadil bilgisi dozla | Tarayıcı |
| B15 | Depo eklenemiyordu (yeni eczanede sipariş verilemiyordu) | Depo yönetimi; örnekteki gerçek firma adları kaldırıldı | Kod incelendi (ekran açıldı) |
| B16 | Kurum tahsilatında kesinti yoktu; TEST reçeteler "provizyonlu" sayılıyordu | Tahsil edilen tutar, kesinti, TEST "doğrulanmadı" | Tarayıcı: 100 ₺ kesinti |
| B17 | Binlerce kayıtta her satırda tüm partiler taranıyordu; hasta seçimi tüm hastaları açılır listeye basıyordu | Tek geçiş özet, hasta arama | Tarayıcı: 8.000 ilaç, 16.000 parti, 5.000 hasta, 30.000 satış: Satış 34 ms, Kurum 19 ms, Sipariş 39 ms, SKT 293 ms, Özet 0,9 sn, Hastalar 1,5 sn, Raporlar 1,8 sn, **İlaç listesi 4,9 sn** (çekirdek tablo sayfalamıyor) |
| B18 | Kritik yazdırmalar elle HTML'di | Fiş, gün sonu, icmal, sipariş, tutanak, defter `NS.docs`; yazıcı bağlıysa termal yol korunur | Tarayıcı (belge üretildi); kâğıt ve termal yazıcıda denenmedi |
| B19 | TC denetimi, mükerrer barkod, mükerrer reçete uyarısı yoktu | Eklendi; alerjili hastada ödeme öncesi onay | Tarayıcı (alerji), kod incelendi (diğerleri) |

## 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Kontrole tabi ilaç defteri | Kırmızı/yeşilde hekim adı ve eczacı PIN'i zorunlu; ay filtresi, yazdırma; onaylayan kişi yazılır | Tarayıcı: hekimsiz ve yanlış PIN reddedildi |
| F2 | Kronik takip | İlaç başına kalan gün, kutu süresi kartta; rıza alınmış hastalara toplu SMS (`NS.smsBatch`) | Tarayıcı: 1 hasta süzüldü, "TEST — gönderilmedi" |
| F3 | Excel ilaç aktarımı | Barkoda göre güncelleme, Türkçe sayı, hatalı satır atlanır; reçete türü yoksa reçeteli sayılır | Tarayıcı (dosya penceresi benzetildi): türü bilinmeyen ilacın elden satışı engellendi |
| F4 | Raporlar | Ciro, en çok satanlar, ölü stok, imha kaybı | Tarayıcı |
| F5 | Online reçeteyi satışa aktarma | Reçete no ve kayıtlı hasta dolu gelir | Tarayıcı |
| F6 | Gün sonu | Nakit, kart, kurum, iade | Tarayıcı |

**Yapılmadı:** gerçek MEDULA/İTS/ÜTS/ÖKC; yarıda kalan satışı saklama; satış sonrası reçete görüntüsü; raf/depo ayrımı; cari hesap; hasta bazlı ilaç etkileşimi (kaynak ve veri yok, tıbbi içerik uydurulmadı); alerjinin etken maddeyle otomatik eşleşmesi (yalnızca hatırlatma); yetkilerin sunucuda zorlanması.

Birleştirme notu: KVKK araçları (`core/kvkk.js`: hasta verisi dışa aktarma, anonimleştirme, `exportRoles`) korundu. Anonimleştirme `sales` ve `ctrl` kayıtlarındaki kişi alanlarını kapsar; `rxOrders` hasta kimliğine bağlı değildir, kapsam dışında kalır (bkz. çekirdek istekleri).

Kalite kapısı: 13 ekran + hasta sayfası açıldı, konsol hatası yok; 375 px genişlikte yatay taşma yok; boş liste bakıldı. Koyu tema yalnızca İK'da görsel olarak bakıldı, Eczane'de ayrıca bakılmadı. Kâğıda basım denenmedi.

> **Durum (30.10.2026):** Aktif satış kullanıcı kararıyla durduruldu. MEDULA, İTS ve ÜTS bağlantısı yok. Mevcut lisanslar çalışır ve yenilenir, kod ve veri korunur. Yeniden açmak için `market/catalog.js` içinde `ready: true`, `site/src/products.js` içinde `satisDisi` kaldırılır.
