# Mali Müşavir Bürosu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/musavir/` (+ `portal.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Beyanname son günleri:** kurallar Ön Muhasebe takvimiyle aynı; GİB yıllık vergi takvimi ve bayram/uzatma duyuruları otomatik izlenmez. Uzatmalar "Süre uzatma" ile, dinî bayramlar Ayarlar'dan elle girilir.
- **e-SMM:** gerçek gönderim sağlayıcı test hesabıyla denenmedi. Stopaj VKN'li alıcıda uygulanır (Hukuk ile aynı kural); mali müşavire sorulmalı.
- **Pazar araştırması:** bu turda ofis yazılımı özellik kaynağı bulunamadı; kapsam kod incelemesine dayanır.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Son gün hafta sonuna denk gelince kaymıyordu (VUK md. 18/4) | Cumartesi/pazar → ilk iş günü | Hesap: Ba-Bs Eylül 2026 → 31.10 (Cumartesi) yerine 02.11.2026 |
| H2 | e-Defter beratı yanlıştı (3 ay sonraki ayın son günü) | Dönemden 4 ay sonraki ayın 10'u (gelir vergisi mükellefi) / 14'ü (diğer) — Ön Muhasebe'de GİB vergi takvimine göre düzeltilmiş kuralla aynı | Hesap: Haziran 2026 → LTD 14.10, şahıs 12.10 (10.10 Cumartesi) |
| H3 | Portal kodu formülle üretiliyordu; SMS'lerde sonuçsuz "gönderildi" | Rastgele kod; gerçek sonuç | `portal-kod.test.js` |

## 2. dalga — güven ve beklenenler
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Ücret tahakkukunda makbuz kesilemese bile uydurma "SM..." numarası yazılıyordu; makbuz yanlış belge türüyle gidiyordu | Tahakkuk makbuz kesmez; tahsilatta isteğe bağlı e-SMM; numara yalnızca entegratörden gelirse yazılır, TEST ayrı görünür | Tarayıcı |
| B2 | Resmî tatiller son günü kaydırmıyordu | Sabit tatiller hesaplanır, dinî bayramlar Ayarlar'dan | `musavir-kural.test.js` |
| B3 | GİB uzatması girilemiyordu | Tür + ay için toplu yeni son gün; eski tarih ve duyuru no saklanır | Tarayıcı: yalnızca açık beyanname yok uyarısı görüldü; toplu değişim denenmedi |
| B4 | Geçici vergi "Nisan" görünüyordu | "2026 1. dönem" | Kod incelendi |
| B5 | Personel ücret ve bakiyeleri görüyordu | Gizlendi | Tarayıcı |
| B6 | Mükellef pasife alınamıyor, hareketli mükellef silinebiliyordu | Pasif, silme kısıtı; pasife beyanname açılmaz | Kod incelendi |
| B7 | Beyanname istisnası, sorumlu personel, ücret zammı, Excel aktarımı | Eklendi | Kod incelendi; Excel denenmedi |

## 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Süreli belgeler | Mali mühür, e-imza, KEP, sirküler; 30 gün uyarısı | Ekran açıldı |
| F2 | Ödeme listesi | Aylık tahakkuklar mükellefe toplu SMS | Kod incelendi |
| F3 | Raporlar | Personel iş yükü, son günden sonra verilenler, beyanname başına ücret | Ekran açıldı |
