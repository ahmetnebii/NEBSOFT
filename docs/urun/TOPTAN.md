# Toptancı & Plasiyer — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1., 2. ve 3. dalga tamamlandı. Program: `apps/toptan/` (+ `bayi.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **e-Fatura / e-İrsaliye:** gerçek gönderim sağlayıcı test hesabıyla denenmedi (`docs/DEVIR.md` B1, B4).
- **Mal fazlası faturası:** bedelsiz ürün faturada %100 iskontolu satır olarak gider. KDV matrahı açısından doğruluğu resmî kaynaktan doğrulanmadı — DOĞRULANAMADI; canlıdan önce mali müşavire sorulmalı.
- **Şikâyet verisi:** Şikâyetvar ve mağaza yorumlarında plasiyer yazılımlarına dair kaynak bulunamadı; öncelikler özellik sayfalarına ve kod incelemesine dayanır.

## 1. Pazar araştırması (30.10.2026)
Yalnızca hangi ihtiyacın karşılandığı çıkarıldı; satıcı tanıtım sayfaları olduğu için iddialar bağımsız doğrulanmadı.

| Ürün | Karşıladığı ihtiyaç | Kaynak |
|---|---|---|
| Logo B2B | Bayi ve merkez siparişi, tahsilat modülü, cari ekstre, sipariş durumu ve tahsilat raporları | [broşür](https://cdn.logo.com.tr/files/logocomtr/Uploads/Documents/logo-b2b-tanitim-brosuru-tr.pdf) |
| Bakiyem (İş Bankası) | Sahada tahsilat, bayi tahsilat portalı, bayi bazında fiyat ve promosyon, cari takibi | [ürün sayfası](https://www.isbank.com.tr/is-ticari/bakiyem-b2b-bayi-tahsilat-ve-satis-cozumu) |
| Repzone | Sipariş toplama, harita üzerinde ziyaret takibi | [haber](https://webrazzi.com/2021/02/02/yapay-zeka-destekli-saha-satis-yonetimi-platformu-repzone/) |
| MobilRut | Sıcak ve soğuk satış çalışma modelleri | [App Store](https://apps.apple.com/us/app/id1590990807) |
| Logo Mobile Sales | Her kullanıcının bir plasiyere bağlanması | [kılavuz](https://docs.logo.com.tr/download/attachments/22802588/MOB%C4%B0LE%20SALES%20KULLANICI%20TANIMLARI.pdf?api=v2) |

## 2. Özellik karşılaştırması
**O** olmazsa olmaz · **B** beklenen · **F** fark yaratan

| Özellik | Bizde (başlangıç) | Sınıf | Dalga |
|---|---|---|---|
| Saha, ofis ve bayi siparişi | var | O | — |
| Fiyat listesi, risk limiti, vade | var; risk açık siparişi ve çeki saymıyordu | O | 1 |
| Stok kontrolü | yok; stok eksiye düşüyordu | O | 1 |
| Kısmi teslim ve iade | yok | O | 1 |
| Çek/senet takibi | kırık (vadesiz çek sayfayı düşürüyordu) | O | 1 |
| Plasiyer tanımı ve yetki sınırı | yok | O | 1 |
| Fatura kesme | yok | O | 2 |
| Satır iskontosu ve plasiyer sınırı | yok | B | 2 |
| Gün sonu plasiyer kasası | yok | B | 2 |
| Bayi portalında ekstre | yok | B | 2 |
| Excel'den ürün ve cari aktarımı | yok | B | 2 |
| Mal fazlası kampanyası | yok | F | 3 |
| Sipariş önerisi (sık alınanlar) | yok | F | 3 |
| Kayıp müşteri ve ziyaret uyumu raporu | yok | F | 3 |
| Araç deposu ile sıcak satış | yok | F | sonraki aşama |

## 3. Yapılanlar
Dalga sonuçları aşağıya eklenir.

### 1. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| T1 | Stok denetimi yoktu, sevkte stok eksiye düşüyordu | Formda kullanılabilir stok (stok − açık sipariş); sevkte eski sipariş önce, yetmeyen kalem eksik sevk, kalanı beklemede | Tarayıcı: stok 8, sipariş 4 + 12 → 4 + 4 sevk, stok 0 |
| T2 | Risk yalnızca bakiyeye bakıyordu | Risk = bakiye + açık sipariş + tahsil olmamış çek; bayi portalında vadesi geçen borç da onaya düşürür; sunucu aynı kuralı uygular | `toptan-kural.test.js` |
| T3 | Kısmi teslim ve iade yoktu | Teslimatta gerçek miktar; fark stoğa döner, borçtan düşer; hiç alınmadıysa iptal. Teslim edilen siparişten iade; miktar aşılamaz, hasarlı ürün stoğa girmez; ekstrede görünür | Tarayıcı: 4 sevk → 1 teslim, 360 ₺ düştü; 5 adet iade reddedildi, 1 adet 120 ₺ iade |
| T4 | Vadesiz çek Tahsilat sayfasını düşürüyordu; karşılıksız çek ödeme sayılmaya devam ediyordu; bankadaki çek tahsil edilemiyordu | Vade ve numara zorunlu; eski kayıt sayfayı düşürmez; bankaya ver, tahsil edildi, karşılıksız (bankadayken de); karşılıksız çek ödeme sayılmaz, ekstrede borç satırı | Tarayıcı, `toptan-kural.test.js` |
| T5 | Plasiyer eklenemiyordu; plasiyer tüm carileri görüp limit değiştirebiliyordu | Plasiyerler ekranı (araç, hedef, kullanıcı bağı); plasiyer yalnızca kendi carilerini görür; limit, vade, liste ve plasiyer alanı onda yok; cari silemez | Tarayıcı: 22 cariden 8'i göründü |
| T6 | Vazgeçilen siparişte "Sipariş alındı" ziyareti yazılıyordu | Ziyaret yalnızca sipariş kaydedilince yazılır | Tarayıcı: vazgeçince 0 kayıt |
| T7 | Bayi tarayıcısına taban (A) fiyat gidiyordu; en az sipariş yalnızca tarayıcıda uygulanıyordu | Sunucu yalnızca bayinin liste fiyatını gönderir; en az sipariş ve stok sunucuda denetlenir | `toptan-kural.test.js` |
| T8 | Sipariş numarası kayıt sayısından üretiliyordu | En büyük numaradan devam eder (panel, bayi, sunucu) | `toptan-kural.test.js` |
| T9 | Hazırlanıyor durumuna geçilemiyordu | Sipariş detayında "Hazırlamaya al" | Kod incelendi |
| T10 | Hareketli cari silinebiliyordu; yeni caride harita bağlantısı bozuktu; eksik liste bilgisi ekranı düşürebiliyordu | Silme kısıtları; konum yoksa ad ve bölgeyle arama; listesiz cari C listesi sayılır | Kod incelendi |
| T11 | Yazdırılan fiş "SEVK İRSALİYESİ" diyordu, belge şablonundan geçmiyordu | `NS.docs` (sipariş/sevk fişi, ekstre, makbuz); başlık "Sevk fişi", "irsaliye yerine geçmez" notu | Belge şablonları sayfası açıldı; çıktı kâğıtta denenmedi |
| T12 | Binlerce kayıtta iç içe döngüler donma yapıyordu | Cari ve hesap tek geçişte gruplanır | 5000 cari, 30.000 sipariş: özet 511 ms, raporlar 187 ms, siparişler 237 ms, cariler 1,7 sn |

Kalite kapısı: telefon genişliğinde 10 ekranda taşma yok, koyu tema tek ekranda bakıldı, konsolda yeni hata yok. Boş liste: İadeler. Bulutta gerçek bayi girişi denenmedi.

### 2. dalga — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Fatura | Teslimden sonra `NS.ebelge.create` ile fatura; "Faturasız" filtresi ve toplu kesme; TEST sonucu faturalı sayılmaz, yeniden kesilebilir. Satış faturası gerçekse iade faturası kesilir | Tarayıcı: TEST fatura NBS2026000000001, "gönderilmedi" uyarısı. İade faturası ve toplu kesme tarayıcıda denenmedi |
| B2 | İskonto | Satır iskontosu; plasiyer sınırı (plasiyer bazında veya genel ayar); aşılırsa sipariş gerekçesiyle onaya düşer | Tarayıcı: sınır %3, %10 iskonto onaya düştü, onaylandı |
| B3 | Plasiyer gün sonu | Son kapanıştan beri tahsilat; sayılan nakit; fark açıklaması zorunlu; Tahsilat ekranında geçmiş | Tarayıcı: açıklamasız fark reddedildi, açıklamalı kaydedildi |
| B4 | Bayi hesabı | Ekstre, vadesi geçen tutar, yazdırma; bakiye panelle aynı hesaptan (`T.moves`) | Tarayıcı |
| B5 | Excel aktarımı | Ürün ve cari; başlık eşleştirme, özet onayı, hatalı satır atlanır, var olan güncellenir | Tarayıcı (`NS.readSheet` taklit edilerek); gerçek dosyayla denenmedi |

### 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Mal fazlası kampanyası | Kampanyalar ekranı; siparişe ve bayi portalına kendiliğinden yansır; sunucu hesaplar, bayi bedelsiz satır gönderemez; bedelsiz adet stoktan düşer | Tarayıcı: 50 adette 2 bedelsiz; `toptan-kural.test.js` |
| F2 | Sipariş önerisi | Son 6 siparişin en az ikisinde geçen ürünler, olağan miktarıyla | Tarayıcı: 14 ürün önerildi |
| F3 | Saha raporları | Kayıp müşteri riski (45+ gün); plasiyer ziyaret uyumu ve iade | Tarayıcı |

Yapılmadı: araç deposu ile sıcak satış (ayrı stok modeli gerekir), rota haritası, plasiyer prim hesabı.
