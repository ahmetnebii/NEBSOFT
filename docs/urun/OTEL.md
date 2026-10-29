# Otel & Pansiyon — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı ("atlama yok").
> Dalgalar sırayla uygulanıyor; her dalganın sonucu aşağıdaki "Yapılanlar" bölümüne yazılır.

Tarih: 29.10.2026 · Dal: `claude/urun-konaklama-etkinlik-8b3b84` · Yöntem: `CLAUDE.md` §2

---

## 1. Kaynaklar

**Rakipler** (29.10.2026'da okundu; yalnızca hangi ihtiyacı karşıladıklarına bakıldı, metin/tasarım/kod alınmadı):

| Kısaltma | Ürün | Kaynak |
|---|---|---|
| **H** | HotelRunner (kanal yöneticisi, rezervasyon motoru, HMS) | `hotelrunner.com/en/lp/hotel-management-system-hms/`, `hotelrunner.com/en/partner-experiences`; bağımsız özet: `hoteltechreport.com/operations/property-management-systems/hotelrunner-pms`, `softwareadvice.com/hotel-management/hotelrunner-profile/` |
| **M** | HMS Otel Programı (yerli PMS + kanal + KBS) | `karekod.org/blog/?p=32027` (üretici tanıtımı) |
| **K** | Kimlik bildirim programları (E.B.S. Otel, LKBS, 3T Kimbil) | `tamindir.com/indir/ebs-otel-kimlik-bildirim-v105`, `/lkbs-lider-kimlik-bildirim-sistemi`, `/3t-kimbil-kimlik-bildirim-yazilimi` |

**Kullanıcı şikâyetleri:** `sikayetvar.com/hotelrunner` (26 şikâyet; onaysız abonelik yenileme, destek yanıtsızlığı, **kanal fiyat eşitleme sorunu**),
sektör geneli: DHA haberi "Şikayetvar bungalov dolandırıcılığı şikâyetleri %114 arttı" (`dha.com.tr/ekonomi/...-2901230`): **onaylı rezervasyonun tesise ulaşmaması**, geciken iade.

**Mevzuat:** Konaklama vergisi oranı 01.05.2026'dan itibaren 31.12.2026'ya kadar %1 (11263 sayılı Cumhurbaşkanı Kararı, 6802 sayılı Kanun m.34) —
**DOĞRULANAMADI** (Resmî Gazete metni okunmadı; ikincil kaynak: `kpmgvergi.com/.../konaklama-vergisi-orani-11263-...`, `pwc.com.tr/.../2026/konaklama-vergisi-orani-1e-indirildi.pdf`).
Konaklama hizmetinde KDV %10 — (hafızadan, doğrulanmadı).

**Bizim durumumuz:** 10 ekranın tamamı tarayıcıda gezildi (`?demo=1`, konsol hatası yok), telefon genişliğinde (375 px) özet ve takvim denendi, kod satır satır okundu.

---

## 2. Bulunan hatalar ve riskler (1. dalgada düzeltilir)

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte başarı — KBS, kart kodlama, santral:** Bağlantı "simülasyon"dayken dönen sahte referans rezervasyona kalıcı olarak yazılıyor ve "KBS giriş: KBS123…" diye **başarılı** görünüyor. | Kod (`kbsSend`, `card`, `pbx`) | Polis bildirimi yapılmamışken yapılmış sanılır — yasal risk. |
| H2 | **Sahte OTA rezervasyonu:** "OTA rezervasyonlarını çek" simülasyonda **gerçek veriye uydurma bir misafir ve rezervasyon ekliyor**; "Müsaitlik gönder" simülasyonda "Son gönderim" tarihini kaydediyor. | Kod (`channelPage`) | Takvimde var olmayan misafir oda kapatır; gönderilmeyen fiyat gönderilmiş görünür. |
| H3 | **Web rezervasyon motorunda sahte kart ödemesi:** Kart numarası/CVC formu var, hiçbir ödeme alınmadan folyoya "Online kapora (kart)" ödemesi yazılıyor; ekranda "Onay e-posta ve SMS ile gönderildi (demo)" yazıyor ama gönderilmiyor. | Kod (`rezervasyon.html`) | Ödenmemiş kapora ödenmiş görünür; kart bilgisi toplanması (PCI) riski. |
| H4 | **Konaklama faturası yanlış KDV ile kesiliyor:** Kalemler KDV oranı olmadan gönderiliyor, e-Belge merkezi %20 varsayıyor. Ayrıca KDV elle `toplam − toplam/1,1` hesaplanıp yok sayılıyor. Konaklama vergisi ayarı (`tax`) hiçbir yerde kullanılmıyor; UBL üreticisi konaklama vergisini desteklemiyor. | Kod + `core/ubltr.js` (yalnızca 0015 KDV) | Resmî fatura yanlış vergiyle çıkar. |
| H5 | **Erken çıkış / tarih değişikliği folyoya yansımıyor:** Girişte "Konaklama N gece" borcu yazılıyor; misafir erken çıkınca ya da rezervasyon uzatılınca tutar değişmiyor. | Kod (`checkOut`, `resForm`) | Misafirden fazla/eksik ücret alınır. |
| H6 | **Doluluk iki yerde farklı hesaplanıyor:** Özet arızalı odayı saymıyor, raporlar sayıyor. | Ekran + kod | Aynı gün için iki ayrı doluluk oranı. |
| H7 | **Gelmeyen misafir (no-show) yok:** Giriş günü geçmiş "rezerve" kayıtlar sonsuza kadar odayı kapatıyor; gün sonu işlemi yok. | Kod | Satılabilir oda boş görünmez, raporlar şişer. |
| H8 | **İptalde kapora kayboluyor:** İptal edilen rezervasyonun kaporası folyoda ödeme olarak kalıyor; iade mi, iptal ücreti mi belli değil; iptal nedeni yok. | Kod | Kasa ile folyo tutmaz. |
| H9 | **Oda değiştirme yok:** Konaklayan misafiri başka odaya almak için rezervasyonu düzenlemek gerekiyor (girişten sonra form tüm alanları açıyor, folyo güncellenmiyor). | Kod | Günlük ön büro işi zor ve hataya açık. |
| H10 | **Misafir seçimi aranamıyor:** Rezervasyon formunda yüzlerce misafir düz liste. | Ekran | Telefonda rezervasyon almak yavaş. |

---

## 3. Özellik karşılaştırması

**Bizde:** ✅ var · 🟡 kısmen · ❌ yok · **Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Rezervasyon ve ön büro
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Oda × gün rezervasyon takvimi, boş hücreden rezervasyon | ✅ | H M | O |
| Check-in (kimlik, refakatçiler, plaka) / check-out | ✅ | H M | O |
| No-show ve gün sonu (H7) | ❌ | M | O |
| Oda değiştirme, konaklamayı uzatma/kısaltma (H5, H9) | ❌ | H M | O |
| İptal nedeni, iptal ücreti / kapora iadesi (H8) | ❌ | H | O |
| Grup rezervasyonu (tek seferde birden çok oda) | ❌ | H | E |
| Takvimde sürükle-bırak ile oda/tarih değiştirme | ❌ | H | E |
| Rezervasyon onayını misafire WhatsApp / e-posta ile gönderme | ❌ | H | E |
| Online ön check-in (misafir kimliği varıştan önce girer) | ❌ | H ("online check-in") | F |

### Oda ve kat hizmetleri
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Temiz / kirli / arızalı durumu, kat filtresi | ✅ | H M | O |
| Konaklanan odaların her sabah "kirli"ye dönmesi (gün sonu) | ❌ | M | E |
| Kat görevlisine oda atama, telefondan "temizlendi" | 🟡 (rol var, atama yok) | — | E |
| Satışa kapalı oda (bakım tarih aralığı) | 🟡 (yalnızca "arızalı") | H | E |

### Fiyat ve kanal
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Baz fiyat + sezon artışı, ekstra hizmetler | ✅ | H | O |
| Kanal yöneticisi (müsaitlik/fiyat gönderme, rezervasyon çekme) | 🟡 (yalnızca genel köprü; sağlayıcı API'si doğrulanmadı — §6) | H M | O |
| Hafta sonu farkı, minimum konaklama | ❌ | H | E |
| Ek kişi / çocuk ücreti | ❌ | H | E |
| Doğrudan rezervasyon motoru (web sitesi) | ✅ (H3 düzeltilecek) | H | E |
| Doluluğa göre fiyat önerisi | ❌ | — | F |

### Folyo, ödeme ve fatura
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Folyo, harcama, ödeme, folyo yazdırma | ✅ | H M | O |
| Doğru KDV ile e-Fatura/e-Arşiv (H4) | ❌ | M | O |
| Şirket/acente adına fatura (VKN, adres) | ❌ | M | E |
| Kasa raporu (ödeme yöntemine göre gün sonu) | ❌ | M | E |

### Resmî bildirim (KBS)
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| KBS giriş/çıkış bildirimi | 🟡 (genel köprü; resmî servis dokümanı yok — §6) | M K | O |
| Bildirimin gerçekten yapıldığının dürüst gösterimi (H1) | ❌ | — | O |
| Konaklayan listesi (KBS'ye elle girmek / yedek için yazdırılabilir liste) | ❌ | K | E |

### Raporlar
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Doluluk, ADR, RevPAR, kanal, uyruk, oda tipi | ✅ (H6 düzeltilecek) | H | O |
| İleriye dönük doluluk ("defterdeki" rezervasyonlar) | 🟡 (yalnızca 14 gün grafiği) | H | E |
| Gün sonu raporu (giriş, çıkış, no-show, tahsilat) | ❌ | M | E |

---

## 4. Şikâyetlerden çıkan "güven" kuralları
1. **Bildirilmeyen şey bildirilmiş görünmez:** KBS, kart, OTA, e-Fatura simülasyonda her yerde "TEST" etiketiyle görünür, kalıcı "yapıldı" kaydı bırakmaz (H1–H3).
2. **Rezervasyon kaybolmaz:** Web motorundan gelen rezervasyon ön büroda hemen görünür; kanal eşitlemesi başarısızsa nedeni yazılır.
3. **Para tutarı tek yerde hesaplanır:** Folyo, fatura ve rapor aynı konaklama tutarını kullanır (H5); kapora ya iade edilir ya iptal geliri olur (H8).
4. **Fatura vergisi doğru ya da hiç:** Konaklama vergisi desteklenmeden e-Fatura gerçek entegratöre gönderilmez (H4).

---

## 5. Dalga planı

| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H10 |
| **2 — Beklenenler** | Grup rezervasyonu; takvimde sürükle-bırak; gün sonu (kirli oda + no-show + gün sonu raporu); kat görevlisi atama ve telefon görünümü; satışa kapalı oda aralığı; hafta sonu farkı, minimum konaklama, ek kişi ücreti; şirket/acente faturası; kasa raporu; konaklayan listesi yazdırma; rezervasyon onayı mesajı (WhatsApp/e-posta, bağlantı yoksa açıkça "gönderilmedi") |
| **3 — Fark yaratanlar** | Online ön check-in (rezervasyon motorundaki "Rezervasyonum" sayfası); doluluğa göre fiyat önerisi; akıllı uyarılar (VIP geliyor, açık bakiyeyle çıkış, çakışma, uzun süredir kirli oda); ileriye dönük doluluk raporu |

Her dalga `CLAUDE.md` §3 kalite kapısından geçer.

---

## 6. Sağlayıcı / karar gerektirenler — CANLIYA ÇIKMAYI ENGELLEYENLER
- **KBS (Emniyet / Jandarma):** Resmî web servis dokümanı herkese açık değil; tesis kodu ve yazılım firması yetkilendirmesi gerekiyor. **DOĞRULANAMADI** → KBS gerçek bildirim olarak kullanılmamalı. Senden: Emniyet/Jandarma'dan alınan servis dokümanı veya anlaşmalı bir KBS aracısı (adı + dokümanı).
- **Kanal yöneticisi (HotelRunner, SiteMinder, Booking Connectivity…):** Program yalnızca genel bir JSON köprüsüne istek atıyor; hiçbir sağlayıcının resmî API'sine göre yazılmadı. **DOĞRULANAMADI.** Senden: hangi kanal yöneticisiyle çalışılacağı + geliştirici hesabı.
- **Konaklama vergisi:** Oran ve faturada gösterimi (UBL'de ayrı vergi kodu) için çekirdek desteği gerekiyor (`CEKIRDEK-ISTEKLERI-konaklama-etkinlik.md`); ayrıca oda fiyatının KDV ve konaklama vergisi dahil mi hariç mi girildiği bir **mali müşavir kararı**.
- **Kapı kilidi, santral:** Marka/model ve resmî SDK gerekir. DOĞRULANAMADI.
- **Online kapora (sanal POS):** iyzico/PayTR vb. hesap ve resmî doküman. Bu dalgada kart formu kaldırılır.

---

## Yapılanlar

### 1. dalga (29.10.2026)
| # | Sonuç | Kanıt |
|---|---|---|
| H1 | KBS, kart kodlama, santral simülasyonda: rezervasyona yalnızca TEST izi yazılıyor, rozet "TEST — bildirilmedi"; santral simülasyonu folyoya **uydurma görüşme eklemiyor**; toplu KBS bildirimi gerçek sayıyı söylüyor | Tarayıcı: check-in (KBS + kart açık, simülasyon) → "TEST: … bildirim YAPILMADI", `r.kbs` boş |
| H2 | OTA çekme/gönderme simülasyonda veriye dokunmuyor ("TEST: … takvime bir şey eklenmedi"); gerçek çekimde odası bulunamayan rezervasyon sessizce düşmüyor, "Yerleştirilemeyen OTA rezervasyonları" listesi açılıyor | Kod + tarayıcı |
| H3 | Web rezervasyon motorundan kart formu kaldırıldı; "kapora ile garantile" seçilirse rezervasyon **opsiyonlu** ve "Kapora (henüz ödenmedi)" olarak kaydediliyor, folyoya ödeme yazılmıyor; "onay gönderildi (demo)" yazısı kaldırıldı; "Rezervasyonumu yönet" opsiyonlu kaydı "Otel onayı bekleniyor" gösteriyor | Tarayıcı: W1001, `folio: []`, `status: opsiyon` |
| H4 | Fatura kalemleri kendi KDV oranıyla gidiyor (konaklama %10, ekstra hizmet %20 varsayılan; ayarlardan ve ekstra hizmet kartından değiştirilebilir). Konaklama vergisi ayarlıysa: gerçek entegratöre fatura **gönderilmiyor** (açık hata mesajı), simülasyonda uyarıyla TEST faturası. Şirket adına fatura için `billTo` alanı hazır (ekranı 2. dalgada) | Tarayıcı: TEST e-Arşiv, satır %10, matrah 13.454,55 + KDV 1.345,45 = 14.800 |
| H5 | Folyodaki konaklama satırı tek kaynaktan (`syncStay`): erken çıkışta soruluyor ("6 gece yerine 4 gece…"), konaklama düzenlenince ve oda değişince güncelleniyor | Tarayıcı: R3005 22.200 → 14.800 |
| H6 | Doluluk her yerde satılabilir oda (arızalı hariç) tabanıyla | Kod |
| H7 | Yeni durum **No-show**; özet ekranında "Gelmeyenler — giriş tarihi geçti" kartı; rezervasyon detayında "Gelmedi" düğmesi; listede filtre | Tarayıcı |
| H8 | İptal / no-show penceresi: neden, açıklama; kapora "ücret olarak tut" ya da "misafire iade et" (folyoda `iade` satırı, bakiye sıfır); kimin ne zaman iptal ettiği görünüyor | Tarayıcı: R3002 kapora 1.000 → iade 1.000 |
| H9 | "Oda değiştir": boş odalar, yeni fiyat, neden; eski oda kirliye alınıyor; KBS açıksa oda değişikliği bildirimi; detayda değişiklik geçmişi. Not: takvimde konaklamanın tamamı yeni odada görünür (gün bazında bölme 2. dalgada) | Tarayıcı: 204 → 103 |
| H10 | Rezervasyon formunda misafir araması (ad, telefon, kimlik); tek eşleşme otomatik seçiliyor; "Yeni misafir" aranan adı/telefonu doldurarak açılıyor. Yeni rezervasyonda "Konaklıyor" seçilemiyor (check-in'den geçmeli) | Tarayıcı, 375 px |

Kalite kapısı: konsol hatası yok; 375 px'te özet, takvim ve rezervasyon formu denendi. `npm test`: kanal, proto, takvim, ubltr, **ubltr-xsd (9 belge XSD'ye uygun)**, muhasebe-calc geçti; `cloud.test.js` bu daldan bağımsız bir sunucu hatasıyla düşüyor (`CEKIRDEK-ISTEKLERI-konaklama-etkinlik.md` Ç6). `sw.js` sürümü bu oturumda artırılamadı (Ç1).
