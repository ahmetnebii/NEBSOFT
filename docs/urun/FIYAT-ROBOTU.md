# Kâr & Fiyat Robotu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/fiyatrobotu/`.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Rakip fiyat kaynağı yok:** rakip / buybox fiyatları demo verisidir. Pazaryerlerinin rakip-buybox servisi ya da işletmenin fiyat dosyası (resmî doküman + test hesabı) bağlanana kadar rakibe göre fiyat (buybox, eşitle) canlı kanala gönderilmez.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Uydurma rakip fiyatıyla gerçek fiyat gönderimi:** kanal canlıyken demo rakip fiyatına göre hesaplanan fiyat Trendyol/Hepsiburada'ya gidebiliyordu | Rakip fiyatlarında kaynak (`comps[].source`) yoksa buybox/eşitle stratejili değişiklikler canlı kanala gönderilmez, açık hata | Tarayıcı: Trendyol canlı → "rakip fiyatları gerçek bir kaynaktan alınmadı (demo) — gönderilmedi", 15 listeleme değişmedi |
| H2 | **Demo kanalda "fiyat güncellendi" + buybox kazanıldı:** fiyat kanala gitmediği hâlde başarılı görünüyordu | "TEST — … canlı bağlı değil: fiyatlar yalnızca programda güncellendi"; listede "Kanala gönderilmedi" rozeti, buybox işaretlenmez; rakip fiyatı "(demo)" etiketli | Tarayıcı: 35 değişiklik → turuncu TEST uyarısı, 35 listeleme `notSynced` |

Kalite kapısı: ekranlar açıldı, konsol hatası yok.
