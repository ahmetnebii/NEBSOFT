# Kurs & Etüt — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/kurs/` (+ `veli.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEBBİS / e-Yaygın:** resmî entegrasyon dokümanı yok (`meb` → yalnızca simülasyon).
- **Ayrılışta iade:** özel öğretim kurumlarında iade mevzuata bağlıdır; bu turda resmî metinden doğrulanmadı — DOĞRULANAMADI. Program yalnızca süreye göre öneri hesaplar, tutar elle değiştirilir.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Öğrencinin kurstan ayrılma akışı yoktu | "Kurstan ayrıl": ödenen, geçen süre, öneri iade ve kalan borç; yetkili onayı; ödenmemiş taksitler iptal, kalan borç ayrı taksit; iade negatif tahsilat; öğrenci sınıf ve yoklama listelerinden çıkar | Tarayıcı: 12.000 ₺ ödenmiş, 86/240 gün → iade 0, 8 taksit iptal, yoklamada görünmedi |
| H2 | Veli girişi yalnızca telefonla yapılıyordu | Telefon + rastgele kod; öğrenci kartında "Veli portalı kodu" | `portal-kod.test.js`, tarayıcı |
| H3 | Toplu ders bağlantısı ve yanıtlarda sonuçsuz "gönderildi" | Gerçek sonuç (n gönderildi / TEST / hata) | Çekirdek `smsBatch` |

Kalite kapısı: `npm test` geçti; konsol hatası yok. Telefon, koyu tema ve büyük veri ayrıca denenmedi.
