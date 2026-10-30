# Spor Salonu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1–3. dalga tamamlandı (devir oturumu). Program: `apps/spor/` (+ `uye.html` üye portalı).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Turnike / kart okuyucu:** gerçek cihazla denenmedi (marka/model gerekir).
- **İade ve iptal kuralları hukuki değerlendirme değildir:** program öneri hesaplar; cayma hakkı (mesafeli üyelik) ve iptal bedeli için 6502 sayılı Kanun ile Mesafeli Sözleşmeler Yönetmeliği resmî metinden bu turda doğrulanmadı — DOĞRULANAMADI. İptal bedeli varsayılanı boştur (0).

## 0. Yapılanlar
### 1. dalga — kırık
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Dondurma sınırı tek seferlikti, üst üste dondurulabiliyordu; geçmiş tutulmuyordu (rakiplerde "dondurma kaydedilmedi" şikâyeti) | Sınır üyelik başına toplam; aşım yetkili PIN'i ister; her dondurma tarih, neden ve personelle kayda geçer; üye kartında ve portalda görünür | Tarayıcı: 25/30 kullanılmışken "kalan hak 5 / 30", 10 gün → aşım akışı, kayıt oluştu |
| H2 | Erken dönüş yoktu | "Dondurmayı bitir": kullanılmayan gün üyelik süresinden ve dondurma hakkından geri alınır | Tarayıcı: `frozen` 35 → 25, bitiş tarihi eski hâline döndü |
| H3 | **Üyelik iptali ve iade yoktu** (rakiplerde en sık şikâyet) | "Üyeliği iptal et": ödenen, kullanılan gün (dondurma hariç) ve ayardaki iptal bedeline göre öneri; iade tutarı düzenlenebilir; neden zorunlu, yetkili onayı; ödenmemiş taksitler iptal, iade negatif tahsilat; girişte "Üyelik … iptal edildi" | Tarayıcı: 14.400 ₺ ödenmiş, 308/368 gün → öneri 2.347,83 ₺, iade kaydı −2.347,83 ₺, turnikede RED |

### 2. dalga — beklenen
| Konu | Sonuç |
|---|---|
| Portal girişi | Telefon + rastgele kod; üye kartından "Üye portalı kodu" (kopyala, WhatsApp, SMS) |
| Portalda dondurma kayıtları | Üye kendi dondurma tarihlerini görür |

### 3. dalga — fark yaratan
| Konu | Sonuç | Kanıt |
|---|---|---|
| Kayıp riski | Raporlar: 14+ gündür gelmeyen aktif üyeler, "Hepsine SMS" (gerçek sonuçla) | Tarayıcı: 1 üye listelendi, "1 geri kazanma mesajı TEST — gönderilmedi" |

Kalite kapısı: `npm test` geçti; konsol hatası yok; 375 px'te 4 ekranda taşma yok. Koyu tema ve 5000 üyeyle hız ayrıca denenmedi. `sw.js` V artırıldı.

## 1. Kaynaklar (30.10.2026)
Rakip ihtiyaçları (tanıtım, doğrulanmadı): GymTekno PLUS ve Ultrasoft-PT (App Store: turnike, mobil QR), MemOps (`webrazzi.com/2024/11/05/spor-salonlari-icin-uyelik-yonetim-platformu-memops/`), Hursoft (`tamindir.com/indir/hursoft-spor-klup-yonetim-programi/`).
Şikâyetler (Şikâyetvar): GymFit dondurma kaydı (`sikayetvar.com/gymfit/uyelik-dondurma-islemi-kayit-edilmedi-sube-yardimci-olmadi`), MACFit sağlık raporu ve iptal (`sikayetvar.com/macfit-sakarya/saglik-raporu-olmasina-ragmen-uyelik-iptali-ve-cayma-bedeli-istisnasi`), Play Stüdyo iade (`sikayetvar.com/playstudyo/uyelik-iptali-ve-iade-hakkimin-engellenmesi-nedeniyle-magduriyet-yasiyorum`).

## 2. Karşılaştırma
| Özellik | Bizde | Sınıf |
|---|---|---|
| Paket, taksit, QR giriş, ders rezervasyonu, ölçüm | ✅ | O |
| Dondurma, iptal ve iade | ✅ (bu tur) | O |
| Turnike cihazı | 🟡 bağlayıcı var, cihazla denenmedi | E |
| PT seans ve eğitmen komisyonu | 🟡 eğitmen raporu var, komisyon yok | E — sonraki dalga |
| Kayıp riski ve geri kazanma | ✅ | F |
