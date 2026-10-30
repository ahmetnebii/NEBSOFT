# Anaokulu & Kreş — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven ve çocuk güvenliği) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/anaokulu/` (+ `veli.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEB bildirimleri:** resmî entegrasyon dokümanı yok (`meb` → yalnızca simülasyon).

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Listede olmayan kişiye teslim** serbest metinle yapılabiliyordu | Ad, 11 haneli TC, "veliyi aradım" onayı ve müdür PIN'i zorunlu; veliye her durumda bildirim; TC yalnızca işlem geçmişinde (SMS ve veli portalının okuduğu kayıtta yok) | Tarayıcı: eksik TC reddedildi; Elif Öğretmen → PIN → "onay Zeynep Müdür" kaydı. TC'nin kayıttan çıkarılması kodda yapıldı, bu son hâl tarayıcıda ayrıca denenmedi |
| H2 | Menüde alerji eşleşmesi yoktu (yalnızca genel liste) | Her gün için alerji uyarısı sütunu: çocuğun alerji metni + yaygın ürün eşleşmesi (laktoz/süt, yumurta, gluten, fındık, fıstık, ceviz, balık). Yardımcıdır, mutfak kontrolünün yerine geçmez | Tarayıcı: laktoz intoleranslı Zeynep, Göktuğ, İpek pazartesi menüsünde uyarıldı |
| H3 | Ödeme kaydı olan öğrenci silinebiliyordu | `canDelete` ile engellenir | Kod incelendi |
| H4 | Portal girişi formülle üretilen kodla yapılabiliyordu; bildirimler sonuçsuz "gönderildi" diyordu | Rastgele kod; gerçek SMS sonucu | `portal-kod.test.js`, tarayıcı |

Kalite kapısı: `npm test` geçti; konsol hatası yok. Telefon, koyu tema ve büyük veri ayrıca denenmedi.
