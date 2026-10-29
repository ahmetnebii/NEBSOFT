# Oto Galeri — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı. Dalgalar sırayla uygulanıyor; sonuç §0'da.

Tarih: 29.10.2026 · Dal: `claude/urun-servis-arac-a1f676` · Yöntem: `CLAUDE.md` §2 · Program: `apps/galeri/` (panel + `vitrin.html`)

## 0. Uygulama durumu
| Dalga | Durum |
|---|---|
| 1 — Temel ve güven (H1–H7) | **tamamlandı** — sahte ilan numarası kaldırıldı (ilan metni + kopyala + kullanıcının girdiği ilan no); ilan portalı / TRAMER / KPS bağlantıları bu programda seçilemez; SMS sonucu bekleniyor (TEST / WhatsApp); ekspertiz formu (13 parça, Tramer, rapor notu), yeni araç "ekspertiz girilmedi" ve vitrinde öyle görünür; satış sözleşmesi belge şablonundan; stok no en büyük + 1; sıfır fiyatla satış engellendi; vitrinde doğrulanmamış "garantili" ifadesi kaldırıldı. Kanıt: başsız Chrome akış denemesi + tur |
| 2 — Beklenenler | sırada |
| 3 — Fark yaratanlar | sırada |

---

## 1. Kaynaklar
Pazar araştırması 29.10.2026 (arama aracı ürünlerin kendi sitelerine erişim vermedi; bulunanlar indirme siteleri ve rehberler):

| Kısaltma | Kaynak | Öne çıkan |
|---|---|---|
| **H** | Hursoft Oto Galeri Takip (tamindir.com/indir/hursoft-oto-galeri-takip-programi/) | Cari, araç kaydı, satılınca stoktan düşme |
| **M** | Microm Oto Galeri 2.5 (tamindir.com/indir/microm-oto-galeri-25/) | Alım-satım, kredili satışta otomatik senet, taksit takibi, stok |
| **A** | arabam.com alıcı rehberi (arabam.com/blog/?p=138764) | Alıcının baktıkları: ekspertiz raporu, km, muayene, HGS, Tramer, ruhsattaki şase no |
| **Y** | Yabancı örnek (zunapro.com) | Pazar yerlerine XML/CSV stok aktarımı, 360° fotoğraf |

**Şikâyetler:** Galeri *yazılımı* için Şikâyetvar kaydı bulunamadı. Galerici şikâyet temaları (arama özetleri): "ekspertizde söylenmeyen boya/değişen", "kapora alındı, araç başkasına satıldı", "konsinye araç satıldı, para geç ödendi". §4'e dönüştürüldü.

**Mevzuat (DOĞRULANAMADI — yalnız ikincil kaynak):** İkinci el motorlu kara taşıtı ticaretinde yetki belgesi, 6 ay / 6.000 km kuralı, ekspertiz ve garanti şartları 2024'te yeni yönetmelikle değişmiş görünüyor (cumhuriyet.com.tr 31.08.2024, milliyet.com.tr haberleri); kaynaklar garanti süresinde çelişiyor. Resmî metin okunmadı → programa mevzuat iddiası yazılmadı; vitrin sayfasındaki "garantili" ifadesi kaldırıldı (işletme garanti veriyorsa ayardan yazar).

**Bizim durumumuz:** 6 menü sayfası + vitrin başsız Chrome ile masaüstü, 375 px ve koyu temada gezildi; kod incelendi.

---

## 2. Bulunan hatalar ve riskler
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte ilan:** "İlana çıkar" bağlantı kapalıyken rastgele bir sahibinden.com ilan numarası üretip "ilan kaydı oluşturuldu" diyor; görüntülenme/favori sayıları da uydurma. | Kod | Kullanıcı aracın yayında olduğunu sanır (`CLAUDE.md` §1). |
| H2 | **Doğrulanmamış entegrasyonlar seçilebiliyor:** İlan portalları (sahibinden / arabam), TRAMER, KPS — herkese açık resmî API dokümanı bulunamadı. | Kod + araştırma | Gönderilmeyen ilan/sorgu "tamam" görünebilir. |
| H3 | **Sahte "SMS gönderildi":** talep eşleşmesi ve konsinye satış bildirimi SMS kapalıyken de gönderildi diyor. | Kod | Müşteri/araç sahibi bilgilendirildi sanılıyor. |
| H4 | **Ekspertiz düzenlenemiyor:** boya/değişen bilgisi yalnız demo verisinde var, yeni araçta hep "orijinal" kalıyor ve vitrinde öyle yayınlanıyor. | Kod + ekran | Müşteriye yanlış "boyasız" bilgisi — en ağır güven sorunu. |
| H5 | **Satış belgesi işletme şablonundan geçmiyor** (`NS.docs` yerine sabit HTML). | Kod | Logo, renk, koşullar uygulanmıyor. |
| H6 | **Stok numarası kayıt sayısından** üretiliyor; çakışma riski. | Kod | Çift numara. |
| H7 | **Satışta tutar doğrulaması yok** (0 veya boş fiyatla satılabiliyor); kapora tahsilatı hiçbir yere yazılmıyor. | Kod | Kâr ve kasa yanlış. |

---

## 3. Özellik karşılaştırması
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Araç stoğu, alış + masraf = maliyet, araç başı kâr | ✅ | H M | O |
| Ekspertiz (parça parça), Tramer tutarı | 🟡 (H4) | A | O |
| Konsinye araç, komisyon | ✅ — sahibine ödeme takibi yok | — | E |
| Satış, kapora, satış sözleşmesi | 🟡 (H5, H7) | H M | O |
| Opsiyon (kime, ne zamana kadar, kapora) | 🟡 (yalnız durum) | şikâyet teması | E |
| Fotoğraflar (panel + vitrin) | ❌ | Y | E |
| Takaslı satışta takas aracını stoğa alma | ❌ | — | E |
| İlan portalına aktarım | ❌ (H1, H2) — yerine ilan metni + elle ilan no | Y (XML) | E (§6) |
| Müşteri talebi ↔ stok eşleştirme | ✅ | — | F |
| Yeni araç girişinde eşleşen talepleri haber verme | ❌ | — | F |
| Bekleme maliyeti, fiyat düşürme önerisi | ✅ | — | F |
| Kârlılık raporu (marka / geliş şekli / ortalama satış günü) | ❌ | — | F |

## 4. Güven kuralları
1. Ekspertizde girilmeyen bilgi "orijinal" diye yayınlanmaz: yeni araçta ekspertiz "girilmedi" görünür.
2. Yayında olmayan ilan "yayında" görünmez; ilan numarası yalnız kullanıcı girerse yazılır.
3. Opsiyonlu araç başkasına satılırken uyarı verilir; kapora kayda geçer.
4. Konsinye araç satılınca sahibine ödenecek tutar "ödenmedi" olarak izlenir.

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1** | H1–H7 |
| **2** | Fotoğraflar (panel + vitrin), opsiyon ayrıntısı (kime, bitiş, kapora, süresi geçen uyarısı), konsinye sahibine ödeme takibi, takas aracını stoğa alma |
| **3** | Yeni araç girişinde eşleşen talepler ve bildirim, kârlılık raporu |

## 6. Sağlayıcı / karar gerektirenler
- **sahibinden.com / arabam.com ilan aktarımı:** kurumsal entegrasyon dokümanı ve hesap → **DOĞRULANAMADI**, bu programda seçilemez.
- **TRAMER sorgusu, KPS kimlik doğrulama:** resmî erişim yetkisi/dokümanı → **DOĞRULANAMADI**.
- **İkinci el araç KDV'si (özel matrah) ve kâr hesabı:** mali müşavir görüşü; program şu an kârı KDV'siz gösteriyor.
- **Galeri garanti ve ekspertiz zorunlulukları:** yönetmeliğin resmî metni.
