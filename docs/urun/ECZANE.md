# Eczane — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/eczane/` (+ `recete.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEDULA (SGK provizyon / dönem faturası), İTS (karekod satış/alım bildirimi), ÜTS, ÖKC:** resmî entegrasyon dokümanı bu projede doğrulanmadı → çekirdekte `UNVERIFIED`, yalnızca simülasyon. Eczanede bu bildirimler **yasal zorunluluktur**; gerçek kullanımda yetkili çözüm ortağı / SGK ve TİTCK dokümanı + test ortamı gerekir.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | MEDULA reçete sorgusu simülasyonu reçeteyi "MEDULA: reçete doğrulandı" işaretliyordu | Simülasyonda "MEDULA TEST — reçete sorgulanmadı" uyarısı, doğrulandı işareti yok | Kod incelendi |
| H2 | Satış sonrası MEDULA / İTS / ÖKC simülasyonu yeşil "MEDULA / İTS / ÖKC" rozetiyle gönderilmiş görünüyordu | Simülasyon "TEST" kaydedilir, turuncu "MEDULA TEST / İTS TEST / ÖKC TEST" rozeti | Kod incelendi |
| H3 | MEDULA dönem faturası simülasyonu fatura kaydı oluşturuyordu | Simülasyonda kayıt oluşturulmaz, "TEST — gönderilmedi" | Kod incelendi |

Kalite kapısı: tüm ekranlar açıldı, konsol hatası yok. `npm test` (cloud.test.js hariç) geçti.
