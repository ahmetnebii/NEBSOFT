# Oto Servis — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı. Dalgalar aşağıdaki sırayla uygulanıyor; her dalganın sonucu §0'a yazılır.

Tarih: 29.10.2026 · Dal: `claude/urun-servis-arac-a1f676` · Yöntem: `CLAUDE.md` §2 · Program: `apps/otoservis/`

## 0. Uygulama durumu
| Dalga | Durum |
|---|---|
| 1 — Temel ve güven (H1–H9) | **tamamlandı** — SMS sonucu bekleniyor (gönderildi / TEST / gönderilemedi + WhatsApp önerisi), onay sayfasındaki sahte ödeme kaldırıldı, satır indirimli tutar, satır satır yuvarlama ve satır bazında KDV (e-Arşiv ile aynı; 104 iş emrinde fark 0), cari bakiye kapora düzeltmesi, ciro teslim tarihine göre, doğrulanmamış tedarikçi/TRAMER bağlantıları kaldırıldı → sipariş listesi (CSV / kopyala / WhatsApp), iş emri no en büyük + 1, "İşlemsiz teslim". Kanıt: başsız Chrome ile kabul → tespit → kalem → onay → işlemsiz teslim akışı, konsol hatası yok |
| 2 — Beklenenler | **tamamlandı** — ek iş onayı (yeni kalem "onay bekliyor" gelir, "Ek işleri onaylat", müşteri sayfasında yalnızca bekleyenler seçilir, onaysız faturalamada uyarı), işçilik garantisi bitişi + kabulde "garanti dönüşü", hesap ekstresi (CSV / WhatsApp), sipariş listesi, geciken araç işareti ve özet sayfasında sayısı |
| 3 — Fark yaratanlar | **tamamlandı** — araç servis karnesi (belge şablonuyla yazdırılır), ortalama km'den tahmini bakım tarihi (hatırlatmalarda "tahmini"), tespit fotoğrafları iş emrinde eklenir ve onay sayfasında görünür |

---

## 1. Kaynaklar

**Pazar araştırması (29.10.2026).** Arama aracı Türkçe ürün sayfalarına sınırlı erişim verdi; bulunanlar çoğunlukla indirme sitelerindeki ürün tanıtımları ve uygulama mağazası açıklamaları. Bu yüzden rakip tablosu "bu ihtiyaç sektörde karşılanıyor mu" düzeyinde; ürün ürün ayrıntılı karşılaştırma **yapılamadı**.

| Kısaltma | Ürün / kaynak | Adres |
|---|---|---|
| **A** | 2008 Oto Servis Programı (masaüstü; plaka/şase ile arama, iş emri, parça+işçilik, fatura) | tamindir.com/indir/2008-oto-servis-programi/ |
| **D** | DemirSoft Oto Teknik Servis ve Müşteri Takibi (araç kaydı, stok, işlem, muhasebe) | tamindir.com/indir/oto-teknik-servis-ve-musteri-takibi-programi/ |
| **P** | Petronas OtoAsistanım (özel servisler için bakım kartı ve hatırlatma) | tr.motor1.com/news/451689/otoasistanim-servislere-yonelik-hosgeldiniz-kampanyasi/ (2020 haberi) |
| **Y** | Yabancı örnek: iş durumu değişince otomatik SMS, dijital muayene raporu + müşteri onayı, km/tarih bazlı hatırlatma | raftlabs.com/services/auto-repair-customer-support-automation |

**Kullanıcı şikâyetleri:** Şikâyetvar'da oto servis *yazılımı* adına kayıtlı şikâyet bulunamadı. Servis müşterisi şikâyetlerinin ortak teması (Şikâyetvar marka sayfaları, arama sonuçları): "haber verilmeden ek ücret çıkarıldı", "araç günlerce bekletildi, bilgi verilmedi", "aynı arıza tekrar etti". Bunlar §4 güven kurallarına dönüştürüldü.

**Mevzuat:** Servis fişi/iş emri içeriği için "Satış Sonrası Hizmetler Yönetmeliği" md. 11 (servis fişi, kalıcı veri saklayıcısıyla teslim, 1.1.2021) yalnızca ikincil kaynaklarda görüldü (alomaliye.com, lexpera.com.tr) → **DOĞRULANAMADI** (mevzuat.gov.tr metni okunamadı). Bu yönetmelik esas olarak sanayi malları ve yetkili servisler içindir; özel oto servislere uygulanıp uygulanmadığı da doğrulanmadı. Programa mevzuat iddiası yazılmadı.

**Bizim durumumuz:** 14 menü sayfası başsız Chrome ile masaüstü (1366 px), telefon (375 px) ve koyu temada otomatik gezildi: konsol hatası yok, sayfa taşması yok. Kod satır satır incelendi; hatalar aşağıda.

---

## 2. Bulunan hatalar ve riskler

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte "gönderildi":** SMS bağlantısı kapalıyken ya da simülasyondayken "Onay linki gönderildi", "SMS gönderildi" yazıyor; Hatırlatmalar sayfası gönderilmeyen mesajı kalıcı olarak "Gönderildi" diye işaretliyor. | Kod (`NS.smsLog` sonucu beklenmiyor) | `CLAUDE.md` §1 ihlali. Müşteri haberdar edildi sanılıyor. |
| H2 | **Ödeme almadan "ödendi":** Müşteri onay sayfasındaki "… öde" düğmesi hiçbir ödeme almadan işi ödenmiş yapıyor. | Kod (`onay.html`) | Para alınmadan borç kapanıyor. |
| H3 | **Onay sayfasında tutar farkı:** Satır tutarı indirimsiz (`miktar × fiyat`) gösteriliyor, alt toplam indirimli. | Kod | Müşteri kalem toplamı ile genel toplamı tutturamaz. |
| H4 | **Kuruş farkı:** Toplam, yuvarlanmamış satırların toplamından hesaplanıyor; e-Arşiv'e indirimli birim fiyat yuvarlanmadan gidiyor. | Kod | Program ile fatura arasında kuruş farkı (Ön Muhasebe H1 ile aynı tür). |
| H5 | **Cari bakiye hatası:** Teslimde önceden alınmış ödeme (ör. kapora) düşülmeden bakiye yazılıyor. | Kod (`deliver`) | Müşteri borcu fazla görünür. |
| H6 | **Ciro yanlış güne yazılıyor:** "30 gün ciro" ve günlük grafik teslim tarihi yerine araç kabul tarihini kullanıyor. | Kod | Raporlar kayıyor. |
| H7 | **Doğrulanmamış entegrasyonlar seçilebiliyor:** "Tedarikçiden sipariş" (Martaş / Başbuğ / Dinamik) ve TRAMER için resmî API dokümanı yok; genel köprüye "sipariş iletildi" denebiliyor. | Kod + `CLAUDE.md` §1 | Gönderilmeyen sipariş "iletildi" görünebilir. |
| H8 | **İş emri numarası** kayıt sayısından üretiliyor; bir kayıt silinir/aktarılırsa aynı numara tekrar verilebilir. | Kod | Çift numara. |
| H9 | **İşlemsiz çıkış yok:** Müşteri vazgeçince aracı "teslim" etmenin tek yolu tahsilat ekranı; iptal/işlemsiz teslim yok. | Ekran + kod | Açık iş emirleri birikiyor ya da sıfır tutarlı sahte teslim yapılıyor. |

---

## 3. Özellik karşılaştırması

**Bizde:** ✅ var · 🟡 kısmen · ❌ yok   **Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Kabul ve iş emri
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Plaka / şase / müşteri / telefonla arama, araç geçmişi | ✅ | A D | O |
| Araç kabul: km, yakıt, hasar krokisi, eşya, fotoğraf, müşteri imzası | ✅ | Y | O |
| Parça + işçilik + dış hizmet kalemleri, işçilik kataloğu, bakım paketleri | ✅ | A D | O |
| Müşteri onay linki (kalem kalem onay) | ✅ (H3 düzeltilecek) | Y | E |
| İşlemsiz teslim / iptal | ❌ (H9) | — | O |
| **Ek iş onayı:** tamirde yeni kalem çıkınca yeniden müşteri onayı | 🟡 (elle) | Y | E |
| Tespit fotoğraflarının onay sayfasında görünmesi | ❌ | Y ("dijital muayene raporu") | F |

### Müşteri iletişimi
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Durum değişince SMS, durum izleme linki | 🟡 (H1: gönderim sonucu doğru gösterilmiyor) | Y | O |
| SMS kapalıyken WhatsApp ile tek dokunuşla gönderme | 🟡 (yalnızca iş emri kartında) | — | E |
| Muayene / sigorta / km bakım / yıllık bakım hatırlatması | ✅ (H1) | P Y | E |
| **Tahmini bakım tarihi** (aracın günlük ortalama km'sinden) | ❌ | — | F |

### Para ve stok
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Teslimde tahsilat, cari (veresiye), e-Arşiv | ✅ (H4, H5) | A D | O |
| Müşteri hesap ekstresi (iş emirleri + tahsilatlar) | ❌ | D | E |
| Parça stoğu, kritik stok | ✅ | D | O |
| Tedarikçiye sipariş listesi (yazdır / WhatsApp / CSV) | ❌ (H7 yerine) | — | E |
| İşçilik garantisi takibi ("garanti dönüşü" uyarısı) | ❌ (ayar var, kullanılmıyor) | — | E |

### Rapor ve araç
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Özet: servisteki araç, onay bekleyen, ciro, teknisyen yükü | ✅ (H6) | — | E |
| **Araç servis karnesi** (tüm geçmiş tek sayfa, yazdırılır — ikinci el satışta değer) | ❌ | — | F |
| Bekleme süresi uyarısı (tahmini teslimi geçen araçlar) | ❌ | şikâyet teması | E |

---

## 4. Güven kuralları
1. **Gönderilmeyen "gönderildi" görünmez.** SMS sonucu beklenir: gerçek gönderim → "gönderildi"; simülasyon → "TEST — gönderilmedi"; kapalı → "SMS kapalı" + WhatsApp ile gönder seçeneği. Hatırlatma yalnızca gerçek gönderimde "gönderildi" işaretlenir.
2. **Para alınmadan borç kapanmaz.** Online ödeme ancak doğrulanmış ödeme sağlayıcısıyla açılır; o zamana kadar onay sayfası "ödemeyi teslimde yapabilirsiniz" der.
3. **Müşteri onaysız ek ücret görmez.** Onaydan sonra eklenen kalem "onay bekliyor" olarak gelir ve toplamı ayrıca gösterilir.
4. **Rakamlar her yerde aynı:** iş emri, onay sayfası, teslim formu ve e-Arşiv satır satır yuvarlanmış aynı tutarı gösterir.
5. **Bekleyen araç unutulmaz:** tahmini teslimi geçen iş emirleri panoda ve özet sayfasında işaretlenir.

---

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H9 |
| **2 — Beklenenler** | Ek iş onayı (onaydan sonra eklenen kalem), işçilik garantisi ve "garanti dönüşü" uyarısı, müşteri hesap ekstresi, tedarikçi sipariş listesi, geciken araç uyarısı |
| **3 — Fark yaratanlar** | Araç servis karnesi (yazdırılır), tahmini bakım tarihi (ortalama km), onay sayfasında tespit fotoğrafları |

## 6. Sağlayıcı / karar gerektirenler
- **SMS:** gerçek gönderim için Entegrasyonlar > SMS'te doğrulanmış sağlayıcı hesabı (Netgsm / İleti Merkezi).
- **Online ödeme (onay sayfası):** sanal POS hesabı ve resmî API dokümanı; gelene kadar kapalı.
- **Yedek parça tedarikçileri (Martaş, Başbuğ, Dinamik) ve TRAMER:** resmî, herkese açık API dokümanı bulunamadı → **DOĞRULANAMADI**, bu programda seçilemez. Tedarikçiden API dokümanı ve test hesabı gelirse yeniden değerlendirilir.
- **Servis fişi mevzuatı:** Satış Sonrası Hizmetler Yönetmeliği'nin özel oto servislere uygulanıp uygulanmadığı → mali müşavir / hukukçu görüşü.
