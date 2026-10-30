# Araç Kiralama — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/kiralama/` (+ `kirala.html`, ortak hesap `hesap.js`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Kiralık araç bildirimi (Emniyet / KABİS) — DOĞRULANAMADI:** yükümlülüğün varlığı resmî kaynakla doğrulandı ([KVKK Kurul Kararı 2020/335](https://www.kvkk.gov.tr/Icerik/6909/2020-335), dayanak 1774 sayılı Kanun Ek md. 3; erişim 30.10.2026). Entegrasyon için resmî teknik doküman bulunamadı → çekirdekte `UNVERIFIED`, yalnızca simülasyon. Bildirim yetkili sistemden elle yapılır; program numarasını kaydeder ve eksikleri özette listeler.
- **1774 sayılı Kanun Ek md. 3 metni — DOĞRULANAMADI:** mevzuat.gov.tr'den metin alınamadı; süre ve ceza tutarları programda yazılmadı.
- **HGS/OGS geçiş sorgusu — DOĞRULANAMADI:** resmî API dokümanı yok, yalnızca simülasyon; geçişler "Masraf ekle" ile elle girilir.
- **Online ödeme:** yerel sürümdeki sahte kart ekranı kaldırıldı; online kiralamada ödeme teslimde alınır. Sanal POS bağlanmadan online tahsilat yok.
- **KDV oranı:** ayardaki %20 varsayılanı (hafızadan, doğrulanmadı). İşletme mali müşavirine doğrulatmalı; fatura kesilmeden önce kontrol edilmeli.
- **Sözleşme metni:** hukukçu incelemesinden geçmedi (trafik cezası ve hasar hükümleri dâhil).
- **Şikâyet verisi sınırlı:** yalnızca Şikâyetvar başlık ve özetleri okundu, uygulama mağazası yorumu bulunamadı.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **HGS simülasyonu uydurma köprü/otoyol geçişleri üretiyordu** (Osmangazi 995 ₺, Kuzey Marmara 182,5 ₺ — rastgele) ve araç iadesinde müşteriye yansıyabiliyordu | Simülasyonda geçiş eklenmez; "HGS TEST — geçişler sorgulanmadı; elle ekleyin" | Kod incelendi |
| H2 | Emniyet kiralık araç bildirimi simülasyonu gerçek bildirim numarası gibi kaydediliyordu | Simülasyonda `TEST` ve "Emniyet’e bildirim YAPILMADI" uyarısı | Kod incelendi |

Kalite kapısı: 13 ekran açıldı, konsol hatası yok.

## Teslim/iade fotoğrafı (dal `urun/temel-eksikler`, 30.10.2026)
Teslim ve iade formunda fotoğraf alanı: 1280 px JPEG, taraf başına 4 (sözleşme başına en çok 8), tüm sözleşmeler için bulutta 10 MB, yerelde 3 MB toplam sınır. Sözleşme detayında görünür, "Fotoğraflar" ile eklenir/silinir. Müşteri sayfasına gitmez. Tutanak baskısına eklenmedi.

## 1. Pazar araştırması (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı.
- [Filorapor / Odak Yazılım](https://odakyazilim.com/en/blog/rent-a-car-software) (sayfada tarih yok, © 2025): şablondan sözleşme, TRY/EUR/USD, fotoğraflı hasar kaydı, KABİS bildirimi, kara liste, sigorta-muayene hatırlatması, çok şube, mobil uygulama. Depozito, HGS, trafik cezası: sayfada belirtilmiyor.
- [Data Çözüm Rent A Car](https://www.tamindir.com/indir/rent-a-car/): kayıt tabanlı ofis yazılımı. Ayrıntılı özellik listesi bulunamadı.
- [RentalSoft](https://intermedia.al.intermedia-dns.com/rentalsoft.html) (Türk ürünü değil): müsaitlik takvimi, sezona ve süreye göre fiyat.
- 4. ve 5. Türk ürünü için herkese açık ayrıntılı özellik sayfası: bulunamadı.

**Kullanıcı şikâyetleri** (firma yanıtı ve sonucu bilinmiyor, doğrulanmadı): [depozito iadesinde gecikme ve açıklanmayan kesinti](https://www.sikayetvar.com/everyday-rent-a-car/depozito-iadesinde-aylik-gecikme-ve-aciklanmayan-600-tl-temizlik-kesintisi), [taş vuruğu hasarı için yüksek ücret](https://www.sikayetvar.com/724rent/tas-vuruk-hasari-icin-yuksek-ucret-ve-yetersiz-bilgilendirme-magduriyeti), [rezervasyon karşılanmadı, iade yapılmadı](https://www.sikayetvar.com/724rent/rezervasyonum-karsilanmadi-depozito-ve-ekstra-ucret-iadesi-yapilmadi), [haksız masraf ve depozito](https://www.sikayetvar.com/caracas-rent-a-car/caracas-rent-a-carda-haksiz-masraflar-depozito-iadesi). Çıkarım: **depozito ve gerekçesiz kesinti** en büyük güven sorunu; 2. dalganın önceliği buna göre belirlendi.

**Mevzuat:** KVKK 2020/335 — kiralayan verisinin KABİS'e kaydı kanuni yükümlülük; açık rıza hizmetin ön şartı yapılamaz. Bu yüzden online formda rıza değil, "okudum" onayı ve bilgilendirme kullanıldı. Bu metin KVKK aydınlatma metni yerine geçmez.

## 2. Özellik sınıflaması
| Özellik | Sınıf | Durum | Kaynak |
|---|---|---|---|
| Müsaitlik, sözleşme, teslim/iade, hasar krokisi | Olmazsa olmaz | Var | Filorapor |
| Depozito yaşam döngüsü, gerekçeli kesinti | Olmazsa olmaz | Var (2. dalga) | Şikâyetvar |
| KABİS bildirim takibi | Olmazsa olmaz | Elle kayıt var; entegrasyon yok | KVKK, Filorapor |
| Sigorta/muayene engeli, kara liste | Beklenen | Var | Filorapor |
| Sezon fiyatı | Beklenen | Var (3. dalga) | RentalSoft |
| Dövizli sözleşme, çok şube, fotoğraflı hasar | Beklenen | **Yok** | Filorapor |
| Masraf/ceza takibi, gecikme, kârlılık | Fark yaratan | Var | Kod incelemesi |

## 3. 2. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| B1 | **Geç iade ücretlenmiyordu; süresi geçen araç takvimde boş görünüp yeniden kiralanabiliyordu** | Fiili iade saati alınır, tolerans (2 sa) sonrası başlayan her 24 saat bir gün; iade edilmeyen araç dolu kalır, iade edilen araç fiili günde boşalır | Tarayıcı: 53 saat gecikme → 3 gün, araç "(dolu)"; `kiralama-kural.test.js` |
| B2 | Erken iadede borç hesabı süreden önce yapılıyordu, fazla ödeme kayboluyordu | Kullanılan gün faturalanır; fazla ödeme görünür, onaylı iade makbuzuyla kapanır | Tarayıcı: 5 → 2 gün, 3.000 ₺ iade, kalan 0 |
| B3 | **Depozito yalnızca yazıydı** | Alınış, kesinti, iade ve bekleyen listesi; kesinti kalan borcu geçemez, gerekçesiz yapılamaz, yetkili onayı ister; belge üretilir | Tarayıcı: 3.900 ₺, gerekçesiz reddedildi, 1.000 kesinti + 2.900 iade |
| B4 | Tahsilat iptal edilince iade yarım kalıyor, tekrar iade alınca hasar çift yazılabiliyordu | Araç gelince kiralama kapanır; ödenmeyen tutar "Kalan" kalır | Tarayıcı |
| B5 | Ödeme tutarı denetlenmiyordu; tutarlar yuvarlanmıyordu; `outKm = 0` km aşımını sıfırlıyordu | Kalan borçla sınırlı, kuruş yuvarlaması tek hesapta | Tarayıcı + test |
| B6 | Online'da günlük fiyat yuvarlanıp toplam sapıyordu; panel indirimi yoktu | `hesap.js` panel, online sayfa ve sunucuda ortak; günlük × gün − indirim gösterilen tutara eşit | Test |
| B7 | **Satılan (pasif) araç panelde ve online kiralanabiliyordu**, KPI'lara giriyordu | Sunucu dâhil engellendi | Tarayıcı + test |
| B8 | Rezervasyon iptali onaysız, gerekçesiz, ödemeyi yok sayıyordu | Neden, iade, yetkili onayı; yanlış PIN'de işlem yok | Tarayıcı |
| B9 | Bağlı kayıt silinebiliyordu; plaka tekrar edebiliyordu | Kiralamalı araç/müşteri ve serviste kayıt silinemez | Tarayıcı (araç, müşteri); plaka: Kod incelendi |
| B10 | Ofis personeli ciroyu görüyordu | Özet, filo, müşteri ve raporda ciro gizli | Tarayıcı |
| B11 | Teslimde kara liste, evrak, başka kiralamada olan araç, küçük km denetlenmiyordu; ehliyet boş kalabiliyordu | Engel veya yetkili onayı; TC/ehliyet zorunlu | Tarayıcı (km, evrak onayı); diğerleri Kod incelendi |
| B12 | **Sahte başarı:** "Onay SMS ile gönderildi (demo)", yerelde sahte kart ve "ödendi" kaydı | Kaldırıldı; hatırlatma SMS'i gerçek sonucu gösterir (TEST) | Tarayıcı |
| B13 | 20.000 kiralamada liste 6 sn, arama 2,9 sn | Dizinle liste 164 ms, arama 534 ms; ilk 300 satır gösterilir | Tarayıcı (20.000 kiralama, 5.000 müşteri, 300 araç) |
| B14 | Fiyat altı kiralama, yaş ve ehliyet sınırı serbestti | `NS.approve` | Kod incelendi |
| B15 | Bakım kaydı kapanınca başka açık kayıt olsa da araç aktif oluyordu | Açık kayıt varsa bakımda kalır; kirada araç servise alınamaz | Kod incelendi |

## 4. 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Sezon fiyatları | Tarih + sınıf; panel, online, sunucu aynı | Tarayıcı: %25 → 1.625 ₺/gün; test |
| F2 | Bildirim takibi | Numara kaydı, eksikler listesi; simülasyon "TEST — bildirilmedi" | Tarayıcı (liste); kayıt formu Kod incelendi |
| F3 | Sonradan masraf | Ceza, HGS, hasar, temizlik sözleşmeye gerekçeli eklenir; ceza faturaya girmez | Tarayıcı |
| F4 | Fatura | `NS.ebelge.create`, sonuç TEST olarak işaretlenir | Tarayıcı: e-Arşiv TEST, gönderilmedi |
| F5 | Belgeler | Makbuz, depozito belgesi, teslim-iade tutanağı (`NS.docs`) | Tarayıcı (belge oluştu); kâğıtta denenmedi |
| F6 | Yarınki kiralama SMS'i | `NS.smsBatch` | Tarayıcı: "1 hatırlatma TEST — gönderilmedi" |
| F7 | Raporlar | Açık alacak, bekleyen depozito, Excel | Ekran Tarayıcı; Excel dosyası açılmadı |
| F8 | Ek sürücü bilgisi, saatli rezervasyon | Eklendi | Kod incelendi |

**Yapılmadı:** dövizli sözleşme, çok şube, fotoğraflı hasar kaydı, ek hizmet fiyatlarının ayardan değişmesi (`hesap.js` içinde sabit).

## 5. Kalite kapısı
- `kiralama-kural.test.js` 17 test geçti. `npm test` için `package.json`'a eklenmesi gerekir (bu oturumda dokunulmadı).
- Tarayıcı: ana akışlar baştan sona, konsol hatası kalmadı; 375 px'te 9 ekranda yatay taşma yok; boş liste ve koyu tema (özet) görüldü.
- **Denenmedi:** bulut modunda gerçek online kiralama (sunucu kuralı yalnızca birim testiyle), yazdırılmış kâğıt çıktısı.
- Statik dosya değişti: `sw.js` sürümü birleştirme sırasında artırılmalı.
- Çekirdek isteği: `core/notify.js` panelden girilen kiralamayı da "Yeni online kiralama" diye bildiriyor; `source === 'online'` filtresi gerekir.
