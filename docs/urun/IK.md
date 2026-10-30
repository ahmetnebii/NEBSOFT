# İK (Personel & Puantaj & Bordro) — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1. dalga (güven ve mevzuat) tamamlandı (devir oturumu). Program: `apps/ik/` (`bordro.js` hesap).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **SGK işe giriş/çıkış, banka toplu maaş, e-Bordro, PDKS:** resmî entegrasyon dokümanı yok → yalnızca simülasyon (TEST), gerçek gönderim yapılmaz.

## Doğrulananlar
- **Bordro parametreleri — DOĞRULANDI (30.10.2026):** asgari ücret günlük 1.101 ₺ = 33.030 ₺ (RG 26.12.2025/33119); SGK işçi %14, işsizlik işçi %1, işveren %21,75 + işsizlik %2, prim indirimi imalat 5 / diğer 2 puan (`csgb.gov.tr/poco-pages/asgari-ucret/`); SGK tavanı 9 kat (5510 md. 82); ücret gelir vergisi tarifesi (GV Genel Tebliği 332, RG 31.12.2025/33124 5. Mük.); damga binde 7,59 (488 s.K. tablo IV-1-b); kıdem tavanı 73.729,87 ₺ (01.07.2026, csgb.gov.tr Temmuz 2026 tablosu).
- **UYUMSUZ bulunup düzeltilen:** kıdem tavanı 64.948,77 → 73.729,87 ₺; prim indirimi 5 → 2 puan varsayılan (imalat işletmesi Ayarlar'dan 5 yapar).
- Not: Çalışma Bakanlığı sayfasının dipnotu 5510 md. 81/ı'ya 5 puan diyor, kanun metninde bu bent 2 puan; ayrıca 7590 s.K. (24/7/2026) md. 81'de bir fıkrayı yürürlükten kaldırmış, hangisi olduğu okunamadı. Mali müşavirin bir kez bakması yararlı.
- Yıllık ücretli izin — 4857 sayılı İş Kanunu md. 53 — **DOĞRULANDI** (`mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm`, okundu 30.10.2026): en az 1 yıl; 1–5 yıl (5 dahil) 14, 5'ten fazla 15'ten az 20, 15 ve üstü 26 gün; 18 yaş ve altı ile 50 yaş ve üstü en az 20 gün; yer altı işlerinde +4 gün (6552/5).

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **PDKS simülasyonu uydurma giriş-çıkış saatlerini puantaja yazıyordu** (fazla mesai → maaş) | Simülasyonda hiçbir kayıt işlenmez: "PDKS TEST — cihaz bağlı değil" | Tarayıcı: puantaj verisi değişmedi |
| H2 | SGK işe giriş/çıkış simülasyonu kartta "SGK giriş ✓" gösteriyordu | Yalnızca gerçek bildirimde ✓; simülasyonda "SGK giriş TEST (bildirilmedi)" | Kod incelendi |
| H3 | Banka toplu maaş simülasyonu "bankaya iletildi" deyip ayı ödendi işaretliyordu | "Banka TEST — gönderilmedi; ödendi işaretlenmedi" | Tarayıcı: `paid_*` ayarı yok |
| H4 | e-Bordro simülasyonu "iletildi" diyordu | "e-Bordro TEST — gönderilmedi" | Tarayıcı |
| H5 | Tam 5 yılını dolduran personele 20 gün izin veriliyordu (madde: "beş yıl dahil" 14); yaş alt sınırı ve yer altı eki yoktu — UYUMSUZ | Düzeltildi; personel kartına "yer altı" ve "sözleşmeyle ek izin" | Tarayıcı: 55 yaş/2 yıl → 20, 5 yıl → 14, 6 yıl yer altı → 24 |
| H6 | Bordro varsayılanları kaynaksız ve kısmen eskiydi | Resmî kaynaktan doğrulandı, eskiler düzeltildi; yıl değişince ekranda güncelleme uyarısı | Yukarıdaki kaynaklar |

Kalite kapısı: 11 ekran açıldı, konsol hatası yok; `npm test` (cloud.test.js hariç) geçti. Pazar araştırması, 2–3. dalga (ör. vardiya planı, izin talebi onay akışı, personel self-servis) bu turda yapılmadı — sıradaki.
