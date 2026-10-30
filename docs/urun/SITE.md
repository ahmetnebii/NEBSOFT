# Site Yönetimi — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1., 2. ve 3. dalga tamamlandı. Program: `apps/site/` (+ `sakin.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Online aidat ödemesi:** sakin portalındaki kart formu yalnızca demoda çalışır; bulutta havale bilgisi gösterilir. Sanal POS doğrulanmadı.
- **Banka hareketleri:** `banka` bağlantısı DOĞRULANAMADI; ekstre elle işlenir.
- **Hukuki metinler:** ihtar ve borcu yoktur yazısı örnek metindir; canlıdan önce avukata gösterilmeli.
- **Mevcut sakinler:** giriş yöntemi değişti; her daireye yeni kod dağıtılmalı.
- **Şikâyet verisi:** bu turda kullanıcı şikâyeti toplanmadı; öncelikler özellik sayfalarına ve kod incelemesine dayanır.

## 1. Kaynaklar (30.10.2026)
**Mevzuat — DOĞRULANDI:** [634 sayılı Kat Mülkiyeti Kanunu](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.634.htm); md. 20, 22, 29–33, 35–37, 39, 41. Metin bozuk kodlamayla okundu; ayrıntıda Resmî Gazete ile karşılaştırılmalı. md. 37 Kanun 7579 (yürürlük 22.05.2026) ile değişmiş.

| Ürün | Karşıladığı ihtiyaç | Kaynak (satıcı tanıtımı) |
|---|---|---|
| Apsiyon | Aidat, tahsilat, raporlama; sakin uygulaması; kartla ödeme | [App Store](https://apps.apple.com/py/app/apsiyon/id742594884) |
| Norma Yönetim | Aidat, sayaç okuma, online ödeme, gelir-gider | [uygulama sayfası](https://apps.appfollow.io/ios/norma-yonetim/1538550013?country=us) |
| Yonetimcell | Daire ve üye bazlı hesap, toplu SMS/e-posta | [haber](https://webrazzi.com/2017/06/08/yonetimcell/) |
| Site Plus Smart | Borç görme ve kartla ödeme | [App Store](https://apps.apple.com/py/app/site-plus-smart/id1568856772) |

## 2. Özellik karşılaştırması
**O** olmazsa olmaz · **B** beklenen · **F** fark yaratan

| Özellik | Bizde (başlangıç) | Sınıf | Dalga |
|---|---|---|---|
| Aidat, tahsilat, gider, duyuru, talep | var | O | — |
| Doğru kasa, fazla ödeme, tahsilat iptali | kırık | O | 1 |
| Güvenli sakin girişi | zayıf | O | 1 |
| Kanuna uygun gider paylaşımı | eksik | O | 1 |
| İşletme projesi | yok | B | 2 |
| Borç ihtarı, borcu yoktur yazısı | yok | B | 2 |
| Dönem hesabı | kısmen | B | 2 |
| Excel'den daire aktarımı | yok | B | 2 |
| Talep yanıtında bildirim | yok | B | 2 |
| Sayaç okuma | yok | F | 3 |
| Kat malikleri kurulu ve karar defteri | yok | F | 3 |

## 3. Yapılanlar

### 1. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| S1 | Panoda kasaya sabit 250.000 ₺ ekleniyordu | Açılış bakiyesi Ayarlar'dan girilir | Kod incelendi |
| S2 | Borcu aşan ödeme kayboluyordu (elle ve banka eşleştirmede) | Artan tutar avans olur, sonraki borçtan düşer | Tarayıcı: 2.100 ₺ borca 2.600 ₺, avans 500 ₺ |
| S3 | Tahsilat ve borç geri alınamıyordu | Tahsilat iptali ve borç silme: neden + yönetici onayı, kayıt izlenir | Tarayıcı: iptal sonrası borç 2.100 ₺, avans 0 |
| S4 | Sakin portalına telefonun son 4 hanesiyle girilebiliyordu | Yönetimin verdiği 6 haneli rastgele kod; sunucuda eski yol kapalı | `portal-kod.test.js` |
| S5 | Gider paylaşımı yalnızca arsa payıydı, yuvarlama toplamı bozuyordu; arsa payı boşsa tutar bozuluyordu | Arsa payı veya eşit (KMK md. 20); toplam kuruşu kuruşuna tutar; eksik payda uyarı | Tarayıcı: 1.000,01 ₺ ve 360,50 ₺ 36 daireye tam dağıldı |
| S6 | Aynı blok ve daire iki kez açılabiliyordu; hareketli daire silinebiliyordu | Engellendi | Kod incelendi |
| S7 | Son ödeme günü 31 iken kısa aylarda tarih bozuluyordu | Ayın son gününe çekilir | Kod incelendi |
| S8 | Görevli tüm borçları ve kasayı görüyordu | Görevli borç sütunu, daire hesabı ve özeti görmez | Tarayıcı |
| S9 | Panelde aynı saate iki rezervasyon girilebiliyordu | Çakışma ve geçmiş tarih engeli | Kod incelendi |
| S10 | Banka eşleştirmede A1 açıklaması A12'yi de yakalıyordu | Daire no tam eşleşir | Kod incelendi; banka bağlantısı DOĞRULANAMADI |
| S11 | Makbuz ve rapor belge şablonundan geçmiyordu | `NS.docs` | Şablon sayfası açıldı; çıktı kâğıtta denenmedi |
| S12 | Binlerce daire ve borçta tekrar eden tarama | Tek geçişte borç özeti | Kod incelendi |

### 2. dalga — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | İşletme projesi (md. 37) | Kalem, paylaşım (eşit/arsa), daire payı ve aylık avans; taslak, geçici, kabul; geçici projede yeniden değerleme sınırı; projeden aidat tahakkuku; yazdırma | Tarayıcı, `site-kural.test.js` |
| B2 | Borç ihtarı, borcu yoktur yazısı | Daire kartından `NS.docs`; metinler değiştirilebilir, hukukça gözden geçirilmedi | Tarayıcı (belge oluştu); çıktı kâğıtta denenmedi |
| B3 | Dönem hesabı (md. 39) | Yıl seçimi, aylık hesap, yönetici hesabı belgesi | Tarayıcı |
| B4 | Excel'den daire aktarımı | Özet onayı; eksik arsa payı atlanır | Tarayıcı (`NS.readSheet` taklit edilerek); gerçek dosyayla denenmedi |
| B5 | Talep yanıtı SMS | İsteğe bağlı; gerçek sonuç gösterilir | Kod incelendi |

### 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Sayaç okuma | Su ve ısınma; endeks; tüketim × birim fiyat borca yansır; endeks geri gidemez; ilk okuma borç oluşturmaz; iki kez yansımaz | Tarayıcı |
| F2 | Kat malikleri kurulu | Toplantı, katılım, vekâlet; sayı ve arsa payı yeter sayısı, üçte bir oy ve vekâlet sınırı; tarih uyarıları; kararlar; tutanak. Noter onaylı defterin yerine geçmez | `site-kural.test.js`, tarayıcı |

Yapılmadı: online aidat ödemesi (sanal POS), kiracı borç sınırı (md. 22), personel bordrosu, malik değişimi geçmişi. Karar yeter sayıları karar türüne göre değişir (ör. md. 42–45); program yalnızca toplantı yeter sayısını hesaplar.
