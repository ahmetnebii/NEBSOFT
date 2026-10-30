# Mali Müşavir Bürosu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/musavir/` (+ `portal.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Beyanname son günleri:** kurallar Ön Muhasebe takvimiyle aynı; GİB yıllık vergi takvimi ve bayram/uzatma duyuruları otomatik izlenmez. Kanuni uzatmalarda takvim elle kontrol edilmelidir.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Son gün hafta sonuna denk gelince kaymıyordu (VUK md. 18/4) | Cumartesi/pazar → ilk iş günü | Hesap: Ba-Bs Eylül 2026 → 31.10 (Cumartesi) yerine 02.11.2026 |
| H2 | e-Defter beratı yanlıştı (3 ay sonraki ayın son günü) | Dönemden 4 ay sonraki ayın 10'u (gelir vergisi mükellefi) / 14'ü (diğer) — Ön Muhasebe'de GİB vergi takvimine göre düzeltilmiş kuralla aynı | Hesap: Haziran 2026 → LTD 14.10, şahıs 12.10 (10.10 Cumartesi) |
| H3 | Portal kodu formülle üretiliyordu; SMS'lerde sonuçsuz "gönderildi" | Rastgele kod; gerçek sonuç | `portal-kod.test.js` |
