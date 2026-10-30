# Pazaryeri Satıcı Paneli — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı dalgaları önceden onayladı. **1. dalga tamamlandı.** 2. ve 3. dalga sırada.

Tarih: 29.10.2026 · Dal: `claude/urun-eticaret-uretim-38c2a2` · Yöntem: `CLAUDE.md` §2 · Program: `apps/pazaryeri`
(E-ticaret içindeki "Pazaryeri Merkezi" kendi vitrini olan mağaza içindir; bu program yalnızca pazaryerinde satan satıcının depo/operasyon panelidir.)

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| P1 | Takip numarası | Uydurulmuyor; pazaryerinden gelen numara kullanılıyor, yoksa etiket/kargoya verme öncesi toplu "Takip numarası gerekli" penceresi | Tarayıcı |
| P2 | Fatura no | `NS.ebelge` yoksa fatura kesilmiyor; simülasyon faturası "TEST fatura" ve Trendyol'a fatura no olarak gitmiyor; "Faturayı yeniden kes"; KDV ürün kartından / ayardan; il-ilçe ayrı | Tarayıcı (TEST fatura EAR…0002) |
| P3 | Simülasyon | Demo kanalda sipariş uydurulmuyor ("5 kanal demo (TEST): sipariş alınmadı"); stok gönderilmiyor ve listeleme durumu değişmiyor; soru yanıtı gönderilmedi uyarısı; ürün/stok kaydı gerçek sonucu yazıyor | Tarayıcı: 424 → 424 sipariş |
| P4 | Hepsiburada | Canlı seçilemez, "API doğrulanamadı" rozeti; n11 canlı | Kod |
| P5 | Eşleşmeyen ürün | Sipariş listesinde rozet, menü sayacında; detayda ürün seçip eşleştirme (stok düşer, kod ürüne bağlanır); eşleşmeden paketlenemez | Tarayıcı: stok 84 → 83, kod kaydedildi |
| P6 | İtiraz | "İtirazı pazaryeri panelinden açın; buradan gönderilmedi" | Kod |
| P7 | Barkod çakışması | Kayıtta barkod/stok kodu benzersizlik denetimi | Kod |
| P8 | Hakediş | "tahmini" etiketleri ve açıklama | Tarayıcı |
| P9 | Telefon | Sipariş kart listesi (seçim kutusu, tutar, durum, fatura) | 375 px |

---

## 1. Kaynaklar

**Rakiplerin herkese açık sayfaları** (29.10.2026; yalnızca karşılanan ihtiyaçlara bakıldı, metin/tasarım/kod alınmadı):

| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **S** | Sentos | `apps.shopify.com/sentos` (ürün, stok, sipariş yönetimi; Excel ile toplu işlem); `zunapro.com/turkey/tr/blog/sentos-alternatifi` (paket karşılaştırması: otomatik stok senkronu üst pakette) |
| **D** | Dopigo | `kobitime.com/pazaryeri-entegrasyon-firmalari-karsilastirmasi-2026/` (toplu listeleme, anlık stok/fiyat, muhasebe ve e-Fatura bağlantısı, dinamik fiyat) |
| **E** | Entegra, Sopyo, Yengeç | aynı karşılaştırma sayfası (piyasadaki başlıca firmalar, aylık 200–2.000 ₺ aralığı) |

**Kullanıcı şikâyetleri** (Şikâyetvar, 29.10.2026):
- `sikayetvar.com/sentos`: "ilk günden beri stok senkronizasyonunda tekrar eden sorunlar"; fatura, kargo durumu ve indirim modülü şikâyetleri.
- `sikayetvar.com/sopyo`: Çiçeksepeti siparişlerinde hatalı kargo kodu; fiyat ve stok hataları.
- `sikayetvar.com/entegra`: görünen şikâyetlerin çoğu çözülmüş; stok konusu öne çıkmıyor.

**Bizim durumumuz:** 10 ekran tarayıcıda gezildi, kod incelendi. API doğrulaması E-ticaret spesifikasyonu §6 ile ortak (`server/connectors`).

---

## 2. Bulunan hatalar ve riskler (1. dalga)

| # | Sorun | Etkisi |
|---|---|---|
| P1 | **Sahte takip numarası:** etiket basılırken veya "Kargoya verildi" denince takip no yoksa rastgele 12 haneli numara üretiliyor ve barkodu basılıyor. | Kargo firması etiketi tanımaz; müşteri yanlış numarayla takip eder. |
| P2 | **Sahte fatura no:** e-Belge modülü yoksa `EAR…` numarası uyduruluyor; simülasyondaki e-Arşiv gerçek fatura gibi "Kesildi" görünüyor ve Trendyol'a fatura no olarak bildirilebiliyor. KDV boşsa %20 varsayılıyor. | Resmî olmayan fatura no pazaryerine gider. |
| P3 | **Simülasyonda uydurma sipariş:** canlı olmayan kanalda "Siparişleri çek" rastgele sipariş üretip stoğu düşüyor; stok senkronu "güncellendi" yazıyor; soru yanıtı "gönderildi" diyor; ürün kaydı "kanallara gönderildi" diyor. | `CLAUDE.md` §1 ihlali. |
| P4 | **Hepsiburada canlı seçilebiliyor** ama resmî dokümanı doğrulanamadı (E-ticaret §6). | Doğrulanmamış servise sipariş/stok işlemi. |
| P5 | **Eşleşmeyen ürün:** barkodu bulunamayan kalem stoktan düşmüyor, hiçbir yerde uyarı yok, paketlemede "Elle onayla" ile geçilebiliyor. | Fazla satış (Sentos şikâyetinin karşılığı). |
| P6 | **Sahte itiraz:** hasarlı iade reddedilince "itiraz kaydı oluşturuldu" yazıyor; pazaryerine hiçbir şey gitmiyor. | Satıcı itirazın açıldığını sanır, süre geçer. |
| P7 | **Barkod çakışması:** aynı barkod/stok kodu iki üründe kayıtlı olabiliyor. | Sipariş yanlış ürüne düşer, yanlış stok gider. |
| P8 | **Hakediş tahmini "ödeme" gibi:** "Beklenen ödeme" ve ödeme takvimi tahmini vade, tahmin olduğu yazmıyor. | Nakit planı yanıltıcı. |
| P9 | **Telefonda sipariş listesi** yatay kayıyor; çoklu seçim ve tutar görünmüyor. | Depoda telefonla çalışmak zor. |

---

## 3. Özellik karşılaştırması
**Bizde:** ✅ var · 🟡 kısmen · ❌ yok · **Sınıf:** O / E / F

| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Tüm kanalların siparişi tek listede, SLA (kargoya kalan süre) | ✅ | S D | O |
| Tek stok → tüm kanallar, kanal tamponu | ✅ (simülasyonda gönderilmez, P3) | S D | O |
| Toplama listesi (raf sırası), barkodla paketleme, toplu etiket/fatura | ✅ | S D | O |
| Doğru takip no / fatura no (P1, P2) | ❌ | S D | O |
| Eşleşmeyen ürün uyarısı ve eşleştirme (P5) | ❌ | — | O |
| Barkod benzersizliği (P7) | ❌ | — | O |
| Sipariş kâr hesabı (komisyon + kargo + maliyet), zarar eden siparişler | ✅ | D (dinamik fiyat) | E |
| Canlı Trendyol / n11 (sipariş, stok-fiyat, soru) | ✅ Trendyol, 🟡 n11 (sipariş + stok) | S D | O |
| Pazaryeri iade (claim) çekme | ❌ | S D | E |
| Müşteri iptali / durum değişikliğini çekme (Created dışı statüler) | ❌ | S D | E |
| Tedarik edilemedi bildirimi (Trendyol) | ❌ (adaptörde var) | — | E |
| Excel'den ürün/stok aktarımı | ❌ | S | E |
| Varyantlı ürün (renk/beden) | ❌ (ürün = tek barkod) | S D | E |
| Fiyat kuralı (minimum kâr marjının altına düşmeyen kanal fiyatı) | ❌ | D | F |
| Stok tükenme tahmini ("kaç günde biter") ve sipariş önerisi | ❌ | — | F |

---

## 4. Güven kuralları
1. **Stok tek gerçek kaynaktan:** her sipariş kalemi bir ürüne eşlenir; eşlenemeyen kalem paketlenemez.
2. **Uydurma numara yok:** takip no, fatura no, itiraz yalnızca gerçek kaynaktan; simülasyon "TEST".
3. **Her gönderim sonucu görünür:** stok/soru/kargo bildirimi başarısızsa nedeniyle günlükte ve ekranda.

---

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | P1–P9 |
| **2 — Beklenenler** | Müşteri iptali/durum güncellemesi çekme, Trendyol "tedarik edilemedi" bildirimi (neden kodlarının adları resmî dokümandan doğrulanınca), Excel'den ürün/stok aktarımı, kritik stok + tükenme tahmini |
| **3 — Fark yaratanlar** | Pazaryeri iade (claim) çekme (alan adları doğrulanınca), varyant grubu (aynı model farklı beden), minimum marj fiyat kuralı |

## 6. Karar / hesap gerektirenler
- **Hepsiburada:** geliştirici portalı erişimi olan satıcı hesabı (doküman doğrulaması).
- **Trendyol / n11 test (stage) hesabı:** canlı deneme.
- **Trendyol tedarik edilemedi neden kodları (500–506):** kodların anlamı resmî sayfada okunduktan sonra seçim listesi yapılır.
