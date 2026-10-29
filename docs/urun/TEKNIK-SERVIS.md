# Teknik Servis — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı. Dalgalar sırayla uygulanıyor; sonuç §0'da.

Tarih: 29.10.2026 · Dal: `claude/urun-servis-arac-a1f676` · Yöntem: `CLAUDE.md` §2 · Program: `apps/servis/` (panel + `takip.html` müşteri sayfası)

## 0. Uygulama durumu
| Dalga | Durum |
|---|---|
| 1 — Temel ve güven (H1–H8) | **tamamlandı** — takip sayfasındaki kart formu ve sahte ödeme kaldırıldı; SMS sonucu bekleniyor (gönderildi / TEST / gönderilemedi + WhatsApp), bildirim sayfasında durum sütunu; simülasyon Caller ID artık arayan göstermiyor; iade tesliminde parçalar stoğa döner, yalnızca ayarlanan tespit ücreti (varsayılan 0) istenir; onay/iade sürükle-bırakla değil kayıttan; teslim belgesi tarihi düzeldi; teklif ekranında tutarsız toplam gösterilmiyor; kilit kodu maskeli ve teslimde siliniyor. Kanıt: başsız Chrome akış denemesi + 12 sayfa × 3 görünüm turu, konsol hatası yok |
| 2 — Beklenenler | sırada |
| 3 — Fark yaratanlar | sırada |

---

## 1. Kaynaklar
Pazar araştırması 29.10.2026; arama aracı yalnızca tanıtım sayfaları ve mağaza açıklamaları döndürdü (rakip ürünlerin kendi sitelerine ayrıntılı erişilemedi):

| Kısaltma | Ürün | Kaynak | Öne çıkan |
|---|---|---|---|
| **B** | Bilsoft Online Teknik Servis | bilsoft.com/en/urunler/bulut-teknik-servis-programi · tamindir.com/indir/bilsoft-online-teknik-servis-takip-programi/ | Kayıt + teslim formu, marka/model/seri/garanti/şikâyet, bulut, telefondan erişim |
| **O** | Online Servis Takip (iOS) | apps.apple.com/am/app/online-servis-takip/id1627995925 | Kayıtta otomatik SMS + e-posta, takip numarasıyla durum sorgulama, A5 teslim alındı çıktısı |
| **SP** | Servis Pozitif (iOS) | apps.apple.com/us/app/id1494965284 | SMS / e-posta / WhatsApp bildirimi, saha görevleri, stok, anket |
| **H** | Yerel geliştirici ürünü (haber) | habergazetesi.com.tr/belediye-calisani-gelistirdigi-yazilim-ile-teknik-servislere-buyuk-kolaylik-sagladi | SMS ile fiyat onayı, barkod etiket, farklı formatta servis formu, hatırlatıcı |

**Şikâyetler:** Şikâyetvar'da teknik servis *yazılımı* şikâyeti bulunamadı; servis müşterisi şikâyetleri (ör. sikayetvar.com Arçelik/Beko servis kayıtları, akademik inceleme dergipark.org.tr/tr/download/article-file/834469): "haber vermeden ek ücret", "cihaz günlerce bekletildi", "aynı arıza tekrarladı". §4'e dönüştürüldü.

**Mevzuat:** Satış Sonrası Hizmetler Yönetmeliği md. 11 (servis fişi; 1.1.2021'den beri kalıcı veri saklayıcısıyla teslim, tüketici onayının ispatı serviste) yalnızca ikincil kaynaklarda okundu (alomaliye.com 05.11.2020, lexpera.com.tr) → **DOĞRULANAMADI**. Programa mevzuat iddiası yazılmadı.

**Bizim durumumuz:** 11 menü sayfası başsız Chrome ile masaüstü, 375 px ve koyu temada gezildi; kod ve müşteri takip sayfası satır satır incelendi.

---

## 2. Bulunan hatalar ve riskler
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Takip sayfası kart bilgisi istiyor ve ödeme almadan "Ödemeniz alındı" yazıyor** ("Demo: gerçek ödeme alınmaz" notuyla). Kalan borç kapanıyor. | Kod (`takip.html`) | Para alınmadan borç kapanır; müşterinin kart numarası ödeme altyapısı olmayan bir forma yazdırılıyor. **En ciddi hata.** |
| H2 | **Sahte "SMS gönderildi":** "Teklif SMS ile müşteriye iletildi" SMS kapalıyken de görünüyor; SMS Bildirimleri sayfası "(demo: simüle)" yazıyor ve gönderim durumunu göstermiyor. | Kod | `CLAUDE.md` §1 ihlali. |
| H3 | **Gelen çağrı (Caller ID) simülasyonda sahte arayan gösteriyor:** simülasyon sonucu gelince listedeki ilk müşteri "arıyor" diye açılıyor. | Kod | Yanlış müşteriye yanlış bilgi verilebilir. |
| H4 | **İade edilen cihazda parça stoğu ve ücret:** Eklenen parça stoktan hemen düşüyor; müşteri teklifi reddedince parça cihazda ve stokta düşülü kalıyor, "iade" tesliminde parça bedeli tahsil edilmek isteniyor. Takip sayfası ise "tespit ücreti alınmaz" diyor. | Kod | Stok yanlış, müşteriye çelişkili tutar. |
| H5 | **Panoda sürükle-bırak kuralları atlıyor:** kart "Müşteri onayı" sütununa sürüklenince teklif tutarı sorulmadan, "İade"ye sürüklenince neden sorulmadan durum değişiyor. | Kod | Teklifsiz onay SMS'i, nedeni bilinmeyen iade. |
| H6 | **Teslim belgesinde tarih:** belge `deliveredAt` alanını okuyor, kayıtta `delivered` var → tarih her yazdırmada "bugün". | Kod | Garanti belgesinde yanlış tarih. |
| H7 | **Teklif ekranında toplam çelişkisi:** takip sayfası parça satırlarını gösterip altına farklı bir sayı olan "teklif tutarı"nı "Toplam" diye yazıyor. | Kod | Müşteri kalemlerle toplamı tutturamaz. |
| H8 | **Ekran kilidi şifresi** teslimden sonra da açık metin olarak saklanıyor ve panelde herkes görüyor. | Kod | Kişisel veri riski (KVKK). |

---

## 3. Özellik karşılaştırması
**Bizde:** ✅ var · 🟡 kısmen · ❌ yok   **Sınıf:** **O** · **E** · **F**

| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Cihaz kabul (seri/IMEI, aksesuar, fiziksel durum, kilit kodu), kabul formu + imza | ✅ | B O | O |
| Kanban pano, teknisyen ataması, söz verilen tarih, gecikme | ✅ (H5) | SP | O |
| Takip kodu / QR ile müşteri durum sayfası | ✅ | O | O |
| Online fiyat onayı / ret | ✅ (H7) | H | E |
| Online ödeme | ❌ sahte (H1) — doğrulanmış sanal POS gelene kadar kapalı | — | E (§6) |
| Durum SMS'i (teklif, parça, hazır) | 🟡 (H2) | O SP H | O |
| Teslimde e-Arşiv fatura | ❌ (entegrasyon listede var, akış yok) | B | E |
| Müşteriyi telefonla arayıp bulma (kabulde) | 🟡 (yalnız açılır liste — binlerce müşteride kullanılamaz) | — | E |
| Garanti sorgulama, garanti dönüşü uyarısı (aynı seri/IMEI) | 🟡 (yalnız liste filtresi) | B | E |
| Teslim alınmayan cihaz hatırlatması (hazır ama X gündür bekliyor) | ❌ | H ("hatırlatıcı") | E |
| Parça bekleniyor → tedarik / sipariş listesi | ❌ | — | E |
| Cihaz geçmişi (aynı IMEI'nin tüm kayıtları) | ❌ | — | F |
| Müşteri memnuniyeti puanı | ✅ (takip sayfası) — raporu yok | SP (anket) | F |
| Teknisyen performansı: ciro, ort. süre, garanti dönüş oranı, puan | 🟡 (yalnız sayı/ciro) | — | F |
| Kilit kodunun teslimde silinmesi | ❌ (H8) | — | F (güven) |

---

## 4. Güven kuralları
1. Para alınmadan "ödendi" yazılmaz; kart bilgisi yalnızca doğrulanmış ödeme sağlayıcısının sayfasında girilir.
2. Gönderilmeyen SMS "gönderildi" görünmez (gönderildi / TEST / gönderilemedi + WhatsApp).
3. Müşteri onayı olmadan ücretli işlem yapılmaz; teklif ekranındaki toplam, ödenecek toplamla aynıdır.
4. Onarılamayan cihazda müşteriden yalnızca ayarlanmış "tespit ücreti" istenir (varsayılan 0); kullanılmayan parça stoğa döner.
5. Kişisel veri en kısa süre tutulur: ekran kilidi şifresi teslimde silinir, panelde maskeli görünür.

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1** | H1–H8 |
| **2** | Teslimde e-Arşiv; kabulde telefonla müşteri arama; aynı seri/IMEI için garanti dönüşü uyarısı; teslim alınmayan cihaz hatırlatması; parça sipariş listesi |
| **3** | Cihaz geçmişi (IMEI); teknisyen performans raporu (ort. süre, garanti dönüşü, memnuniyet puanı); memnuniyet raporu |

## 6. Sağlayıcı / karar gerektirenler
- **Online ödeme:** sanal POS hesabı + resmî API dokümanı; o zamana kadar kapalı.
- **Caller ID / santral:** sağlayıcı hesabı ile canlı test.
- **Tespit ücreti politikası:** işletme kararı (Ayarlar > "Onarılamayan cihazda tespit ücreti", varsayılan 0).
