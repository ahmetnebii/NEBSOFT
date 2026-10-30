# Kuyumcu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) başladı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/kuyumcu/` (+ `ekran.html` vitrin).

## 0. Yapılanlar
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | "Kur servisinden çek" tarayıcıdan doğrudan `fetch` yapıyordu: `/api/istek` köprüsünü atlıyordu (CLAUDE.md §4) ve CORS yüzünden çoğu toptancı servisinde çalışmazdı | `NS.integ.http` (köprü) ile çağrılır; hata ayrıntısı gösterilir | Tarayıcı: yerel JSON (kur alanı yok) → "Kur alınamadı: Kur alanları bulunamadı" |
| H2 | Sipariş hazır SMS'i sonucu beklemeden "SMS gönderildi" diyordu | Gerçek sonuç (TEST / gönderildi / hata) gösterilir (çekirdek `smsLog().result`) | Çekirdek commit'i |

## Karar gerektirenler
- **Altın satışında KDV / belge türü** (has altın, işlenmiş altın, işçilik): mevzuat karmaşık; mali müşavir görüşü olmadan e-Belge'de otomatik oran önerilmez.
- Kur servisi: bağlı olunan toptancının resmî JSON servisi ve alan adları (şu an `hasBuy/hasSell`, `alis/satis` veya `HAS.alis/satis` okunur).
