# Bilet / Etkinlik — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı; etkinlik/bilet programını özellikle andı.
> Dalgalar sırayla uygulanıyor; sonuçlar "Yapılanlar" bölümünde.

Tarih: 29.10.2026 · Dal: `claude/urun-konaklama-etkinlik-8b3b84` · Yöntem: `CLAUDE.md` §2

---

## 1. Kaynaklar

**Rakipler** (29.10.2026; yalnızca hangi ihtiyacı karşıladıklarına bakıldı):

| Kısaltma | Ürün | Kaynak |
|---|---|---|
| **BB** | Bubilet (organizatör paneli uygulaması) | `apps.apple.com/bw/app/bubilet-panel/id1617820141` |
| **BX** | Biletix | `help.biletix.com/hc/en-us/articles/360008084673` (GİB'e uygun e-bilet şirketi, 20.02.2020) |
| **BC** | Bilet.com QR Okuyucu | `apps.apple.com/bm/app/id1505520951` (girişte okutma ve doğrulama) |
| **Y** | Yurt dışı organizatör kapı uygulamaları (karşılaştırma için) | `bilietai.lt/en/generalinfo/for-promoters/23-66-11/access-control-app`, `korraldaja.piletilevi.ee/en/ticket-control`, `organizatori.bilete.ro/en/ticket-control`, `pro.passpass.be/platform/access-control` (çevrimdışı tarama, çoklu cihaz, yalnızca telefonla tarama) |
| **D** | Davetiye / RSVP sistemleri | `inviton.eu/blog/rsvp-invitations-guest-registration-and-entry-control-at-event` |

Biletinial ve Passo'nun organizatör özellik sayfaları aramada bulunamadı (bulunamayan şey "var" sayılmadı).

**Kullanıcı şikâyetleri** (`sikayetvar.com/biletinialcom`, `/biletino`, 29.10.2026): **iade gecikmesi** ("iade sürecinde gecikme — param nerede"), iptal edilen etkinlikte iade yapılmaması,
**bildirimsiz tarih değişikliği** ("kapıda mağduriyet"), bildirimsiz **koltuk değişikliği**, e-posta/WhatsApp/telefon taleplerinin yanıtsız kalması (Biletino memnuniyet 26/100, en sık çözüm tam iade).

**Bizim durumumuz:** 9 ekranın tamamı, etkinlik detayı ve online satış sayfası tarayıcıda gezildi (`?demo=1`, konsol hatası yok); gişe ve kapı telefon genişliğinde (375 px) denendi; kod satır satır okundu.

---

## 2. Bulunan hatalar ve riskler (1. dalgada düzeltilir)

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Ödeme alınmadan geçerli bilet:** Online satış sayfası (yerel/kendi sunucu modunda) hiçbir ödeme almadan bileti "Geçerli" ve ödeme yöntemini "kart" kaydediyor; ekranda "Biletleriniz SMS ile de gönderildi (demo)" yazıyor, SMS gönderilmiyor. | Kod (`bilet.html` satın alma) | Bedava giriş; hasılat raporu sahte; sahte başarı. |
| H2 | **Ödenmemiş rezervasyonun süresi yok:** "Ödeme bekliyor" biletler koltuğu sonsuza kadar kapatıyor. | Kod | Satılabilir koltuk boş görünmez; etkinlik "dolu" görünürken salon boş kalır. |
| H3 | **Etkinlik iptalinde sahte bildirim:** SMS sonucu kontrol edilmeden "N alıcıya SMS gönderildi" yazıyor; ödenmemiş rezervasyonlar da "iade edildi" sayılıyor; iade tutarı/yöntemi kaydı yok. | Kod | Alıcı haber almaz, organizatör aldı sanır (şikâyetlerin 1 numarası). |
| H4 | **Kapı ekranında geçerli bilet kodları açıkça yazıyor** ("Deneme kodları"). | Ekran | Kapı ekranını gören biri geçerli kodu okutup girebilir. |
| H5 | **Telefon kamerasıyla QR okutma yok:** Kapı yalnızca klavye/okuyucu ile çalışıyor; çekirdekte hazır kamera okuyucu (`NS.scan`) var ama programa eklenmemiş. | Kod | Kapı görevlisi ek cihaz olmadan çalışamaz. |
| H6 | **Hizmet bedeli kaydedilmiyor:** Online alıcıdan bilet başı hizmet bedeli gösteriliyor, bilete yazılmıyor. | Kod | Hasılat ve iade tutarı yanlış. |
| H7 | **İade kaydı eksik:** İadede tutar/yöntem/gerekçe tutulmuyor; ödenmemiş rezervasyonun iptali "iade" gibi görünüyor; indirim kodu kullanım sayısı geri alınmıyor. | Kod | Kasa ile rapor tutmaz. |
| H8 | **İndirim kodu kötüye kullanıma açık:** Kullanım sınırı, geçerlilik tarihi, etkinlik kısıtı yok; **%100'lük "SPONSOR" kodu online sayfada herkesçe kullanılabiliyor**. | Kod + demo verisi | Sınırsız bedava bilet. |
| H9 | **Gişede "Kart" ödemesi POS'a gitmiyor:** POS bağlantısı açık olsa da çekim yapılmadan satış tamamlanıyor. | Kod (Otel'de aynı akış `cardPayment` ile yapılıyor) | Kartla çekim ile satış ayrı kalır. |
| H10 | **Satış zamanı sınırı yok:** Etkinlik saati geçtiği halde aynı gün online/gişe satışı sürüyor; satış başlangıç tarihi yok. | Kod (`upcoming` yalnızca tarihe bakıyor) | Başlamış/bitmiş etkinliğe bilet satılır. |

---

## 3. Özellik karşılaştırması

**Bizde:** ✅ var · 🟡 kısmen · ❌ yok · **Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Etkinlik ve salon
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Etkinlik oluşturma, tür, afiş, kategori fiyatları | ✅ | BB BX | O |
| Numaralı koltuk planı, genel giriş (ayakta) alanlar | ✅ (genel giriş salonu yalnızca demo verisinde; arayüzden oluşturulamıyor) | BX | O |
| Satış başlangıç/bitiş zamanı (H10) | ❌ | BX | O |
| Etkinlik tarihi/saati değişince alıcılara bildirim | ❌ | (şikâyet konusu) | O |
| Aynı etkinliğin yeni seansını kopyalayarak açma | ❌ | BX | E |
| Salon düzenleyici: koridor, kullanılamaz koltuk, genel giriş salonu | ❌ | — | E |
| Bilet türleri (tam / öğrenci / çocuk) | 🟡 (yalnızca indirim koduyla) | BX | E |

### Satış
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Gişe satışı, koltuk seçimi, bilet yazdırma | ✅ | BB | O |
| Online satış sayfası, koltuk tutma (8 dk) | ✅ (H1 düzeltilecek) | BX | O |
| Online kartla ödeme (sanal POS) | ❌ (§6) | BX | O |
| Ödenmemiş rezervasyon süresi (H2) | ❌ | — | O |
| İndirim kodu: sınır, tarih, etkinlik (H8) | 🟡 | BX | O |
| **Davetiye ve kontenjan** (protokol/sponsor/basın koltukları, davetli listesi, toplu davetiye) | ❌ | D | E |
| Bileti WhatsApp/SMS/e-posta ile gönderme | ❌ | BX | E |
| Bilet devri (başka isme), koltuk değiştirme | ❌ | — | E |
| Bekleme listesi (tükenince, iade olunca haber) | ❌ | — | F |
| Erken kuş fiyat basamakları (tarihe göre otomatik) | ❌ | — | F |

### Kapı
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Kod/okuyucu ile giriş, tekrar kullanım uyarısı, canlı sayaç | ✅ | BC Y | O |
| Telefon kamerasıyla QR (H5) | ❌ | Y (PassPass: yalnızca telefon) | O |
| Çoklu kapı (kapı adı, kapı bazında sayım) | ❌ | Y | E |
| Çıkış-yeniden giriş izni | ❌ | Y | E |
| Bağlantı koparsa kapıda çalışmaya devam | 🟡 (aynı cihazda yerel veri) | Y | E |

### İade ve güven
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Bilet iadesi, iade süresi ayarı | ✅ (H7 eksik) | BX | O |
| Etkinlik iptalinde toplu iade + gerçek bildirim (H3) | 🟡 | — | O |
| İade kaydı: tutar, yöntem, gerekçe; iade raporu | ❌ | — | O |

### Raporlar
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Etkinlik hasılatı, doluluk, katılım, türe göre | ✅ | BB | O |
| Kanal, indirim kodu, kategori, kasiyer bazında gün sonu | ❌ | BB | E |
| Organizatör/sanatçı hesap kesimi (hasılat payı, hizmet bedeli ayrı) | ❌ | — | F |
| Canlı doluluk / giriş ekranı (TV modu) | ❌ | — | F |

---

## 4. Şikâyetlerden çıkan "güven" kuralları
1. **Ödenmeyen bilet geçerli olmaz:** Ödeme alınmadan bilet "Ödeme bekliyor"dur, süresi dolunca koltuk açılır (H1, H2).
2. **İade izlenebilir:** Her iadenin tutarı, yöntemi, tarihi ve gerekçesi kayıtlıdır; alıcıya bilgi gerçekten gittiyse "gitti" denir (H3, H7).
3. **Değişiklik habersiz olmaz:** Tarih/saat/salon değişince etkilenen alıcılar listelenir ve bildirim gönderimi istenir (2. dalga).
4. **Kapı güvenliği:** Kapı ekranı geçerli kod göstermez; aynı bilet ikinci kez girmez (H4).

---

## 5. Dalga planı

| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H10 |
| **2 — Beklenenler** | Davetiye ve kontenjan; bilet türleri (tam/öğrenci/çocuk); etkinlik değişikliğinde alıcı bildirimi; seans kopyalama; salon düzenleyici (koridor, kapalı koltuk, genel giriş salonu); bileti mesajla gönderme; bilet devri/koltuk değiştirme; çoklu kapı + yeniden giriş; kanal/kod/kasiyer raporları |
| **3 — Fark yaratanlar** | Bekleme listesi; erken kuş fiyat basamakları; organizatör hesap kesimi; canlı giriş ekranı (TV modu) |

---

## 6. Sağlayıcı / karar gerektirenler — CANLIYA ÇIKMAYI ENGELLEYENLER
- **Online kartla ödeme (sanal POS: iyzico, PayTR, Param, Stripe):** Ayar ekranında seçenek var ama satış sayfasında ödeme akışı yok. Resmî doküman + üye işyeri hesabı gerekir. Bu dalgada online satış "rezervasyon — gişede/kapıda öde" olarak çalışır. **DOĞRULANAMADI.**
- **e-Bilet / e-Arşiv:** Biletix "GİB'e uygun e-bilet şirketi" (BX). Bilet satışında hangi belgenin düzenleneceği (e-Bilet, e-Arşiv fatura, gider pusulası) **mali müşavir kararı**; GİB e-Bilet dokümanı okunmadı. DOĞRULANAMADI.
- **SMS / WhatsApp sağlayıcısı:** bildirimler yalnızca bağlantı açıksa gider; yoksa program "gönderilmedi" der.
- **Turnike:** marka/model ve resmî SDK. DOĞRULANAMADI.

---

## Yapılanlar

### 1. dalga (29.10.2026)
| # | Sonuç | Kanıt |
|---|---|---|
| H1 | Online satış her modda **"Ödeme bekliyor"** rezervasyonu oluşturuyor; "ödeme yap" ve "SMS ile gönderildi (demo)" yazıları kaldırıldı; sayfa ödeme son tarihini söylüyor | Tarayıcı: B4030 `reserved`, hizmet bedeli 15, son ödeme 31.10 21:59 |
| H2 | Rezervasyona son ödeme zamanı yazılıyor (ayar: saat, varsayılan 48; en geç etkinlikten 2 saat önce); süresi dolan rezervasyon program açılışında ve dakikada bir **"Süresi doldu (ödenmedi)"** olup koltuğu bırakıyor. Sunucu kuralıyla uyum için durum `refunded` + `void` nedeni (para iadesi yok) | Tarayıcı: geçmiş tarihli rezervasyon → `void: expired` |
| H3 | Etkinlik iptali penceresi: neden (alıcıya gider), iade yöntemi, SMS seçimi; ödenmişler iade kaydıyla, ödenmemişler "İptal (ödenmemişti)"; bildirim sonucu gerçek sayılarla ("0 gönderildi, 71 TEST (gönderilmedi)"); online sayfada iptal nedeni görünüyor | Tarayıcı |
| H4 | Kapıda deneme kodları yalnızca `?demo=1` açılışında görünüyor | Tarayıcı + kod |
| H5 | Kapıda **"Kamerayla okut"**: çekirdekteki `NS.scan` ile ardışık okutma; her okutmanın sonucu ekranda | Düğme tarayıcıda görüldü; kamera gerçek telefonla denenmedi |
| H6 | Hizmet bedeli bilete yazılıyor; raporlarda ayrı sütun; gişede tahsil edilecek tutara ekleniyor; iadede ayara göre iade ediliyor | Tarayıcı |
| H7 | İade penceresi: tutar (ödenenden fazla olamaz), yöntem, gerekçe, "iade ödemesi yapıldı mı"; "İadesi yapılacak" filtresi ve "İade ödendi" teyidi; ödenmemiş rezervasyon için ayrı "İptal"; indirim kodu kullanımı geri alınıyor; raporda iade tutarı | Tarayıcı: 900 ₺ nakit iade |
| H8 | İndirim kodu: en fazla kullanım, geçerlilik tarihleri, tek etkinlik, online'da kullanılabilir mi; **%100 kodlar online'da hiçbir zaman kullanılamıyor** | Tarayıcı: SPONSOR → "Bu kod online satışta kullanılamaz" |
| H9 | Gişede "Kart": POS bağlantısı açıksa önce çekim, onaylanmazsa satış yok; satışı yapan kasiyer bilete yazılıyor | Kod |
| H10 | Satış penceresi: etkinliğe online satış başlangıç/bitiş (boşsa etkinlik saati); gişe etkinlikten 1 saat sonrasına kadar; online sayfa "Online satış kapandı / Satış … başlıyor" diyor. Ek: etkinlik formunda afiş görseli kaydedilmiyordu, düzeltildi | Kod + tarayıcı |

Gişeye **"Ödeme bekleyen rezervasyonlar"** listesi eklendi (nakit/kart tek tıkla tahsil, bilet yazdırılır).

**Bulutta (müşteri sitesi) eksik kalanlar** — sunucu kuralı değişmeden çalışmaz (`CEKIRDEK-ISTEKLERI-konaklama-etkinlik.md` Ç8): indirim kodu sınırları ve %100 kod engeli, hizmet bedeli, son ödeme zamanı, satış penceresi.
