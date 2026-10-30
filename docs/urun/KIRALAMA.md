# Araç Kiralama — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/kiralama/` (+ `kirala.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Kiralık araç bildirimi (Emniyet), HGS/OGS geçiş sorgusu:** resmî entegrasyon dokümanı yok → çekirdekte `UNVERIFIED`, yalnızca simülasyon. Kiralık araç bildirimi yasal yükümlülüktür; gerçek kullanımda yetkili sistemden elle yapılmalı.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **HGS simülasyonu uydurma köprü/otoyol geçişleri üretiyordu** (Osmangazi 995 ₺, Kuzey Marmara 182,5 ₺ — rastgele) ve araç iadesinde müşteriye yansıyabiliyordu | Simülasyonda geçiş eklenmez; "HGS TEST — geçişler sorgulanmadı; elle ekleyin" | Kod incelendi |
| H2 | Emniyet kiralık araç bildirimi simülasyonu gerçek bildirim numarası gibi kaydediliyordu | Simülasyonda `TEST` ve "Emniyet’e bildirim YAPILMADI" uyarısı | Kod incelendi |

Kalite kapısı: 13 ekran açıldı, konsol hatası yok.
