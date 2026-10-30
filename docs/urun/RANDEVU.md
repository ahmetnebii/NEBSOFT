# Randevu (Salon & Klinik Randevu) — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini önceden onayladı ("atlama yok"). Dalgalar bu belgedeki sırayla uygulanıyor; her dalganın sonucu §0'a yazılır.

Tarih: 29.10.2026 · Dal: `claude/urun-randevu-uyelik-cfb186` · Yöntem: `CLAUDE.md` §2

## 0. Uygulama durumu
| Dalga | Durum | Kanıt (tarayıcı, 29.10.2026, masaüstü + 375 px) |
|---|---|---|
| 1. dalga (H1–H7) | **Tamam** | Toplu hatırlatma: "21 TEST (gönderilmedi) · 1 müşteri istemediği için atlandı", rozetler "TEST — gönderilmedi" / "Müşteri istemiyor"; süresi dolmuş pakette "+1 seans" yok; online sayfada pazar 11:00–18:00; aydınlatma metni penceresi |
| 2. dalga (B1–B5) | **Tamam** | 4 haftalık tekrar → 3 randevu + "dolu olduğu için eklenmedi: 09.11.2026"; bekleme listesi → "Randevu ver" → kayıt `randevu` durumuna geçti; seans geçmişi + geri alma (used 2→1); hatırlatma zamanı/otomatik gönderim ayarı |
| 3. dalga (F1–F3) | **Tamam** | Müşteri "Randevumu sorgula" > Taşı → yeni saat, not "Müşteri online taşıdı (eski: …)", onay bekliyor; telefonda takvim varsayılan "Liste", tıklayınca detay; Müşteriler > Geri kazanma (izinli müşteriye SMS, diğerlerine WhatsApp) |

Ek düzeltme: "Randevumu sorgula" bugünün saati geçmiş randevularını da listeliyordu.
Bilinmesi gerekenler: otomatik hatırlatma yalnızca panel açıkken çalışır (sunucu zamanlayıcısı çekirdek isteği Ç3). Bulut modunda müşteri sayfası yeni alanları (`noReminder`, taşıma notu) ancak `public-rules.js` izin verirse yazabilir (Ç4). `npm test`: 6 dosya geçti; `cloud.test.js` lisans akışında (`'talep' == 'deneme'`) bu dalın başlangıcında da başarısız — program dosyalarıyla ilgisi yok, `server/` sahibine bildirildi.

---

## 1. Kaynaklar

**Rakip / benzer ürünlerin herkese açık sayfaları** (29.10.2026'da arandı; yalnızca karşıladıkları ihtiyaçlara bakıldı, metin, tasarım ya da kod alınmadı):

| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **SR** | Salon Randevu | `apps.apple.com/us/app/id1413695973`, `tamindir.com/indir/salon-randevu/` (randevu sonrası ve öncesi SMS, işletme linkinden online randevu, adisyon/paket satışı, stok, prim) |
| **RN** | RandevuNet | `capterra.ae/software/1099627/RandevuNet`, `softwareadvice.com.au/software/551804/RandevuNet` (çok personelli takvim, prim, paket/üyelik satışı, SMS/WhatsApp/sesli hatırlatma) |
| **KY** | Kuaförüm Yanımda | `apps.apple.com/tr/app/kuaf%C3%B6r%C3%BCm-yan%C4%B1mda/id1516248277` (7/24 online randevu) |
| **CS** | ColavoSalon | `apps.apple.com/tr/app/colavosalon/id1158916249` (kullanıcı yorumu: hatırlatma SMS'inde saat eksikliği) |
| **R3** | Randevu345 | `apps.apple.com/dk/app/randevu345/id6743093049` (randevu takibi, personel primi, rapor) |

**Kullanıcı şikâyetleri:** `sikayetvar.com/salon-randevu` (kategori sayfası, 1.212 şikâyet; 29.10.2026, ilk sayfa başlıkları). Tekrarlayan temalar: **son dakika randevu iptali / gecikme**, **paket seanslarının eksik kullanılması / iade**, **kapora iadesi**, üyelik sözleşmesi ve icra.

**Bizim durumumuz:** 16 ekranın tamamı tarayıcıda otomatik gezildi (masaüstü + 375 px); konsol hatası ve sayfa taşması çıkmadı. Online randevu sayfası (`book.html`) ve kod satır satır incelendi.

---

## 2. Bulunan hatalar ve riskler (1. dalgada düzeltilecek)

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte "SMS gönderildi":** `sendSms` sağlayıcının cevabını beklemeden "SMS gönderildi" der ve randevuyu "hatırlatıldı" işaretler. SMS kapalı ya da simülasyonda olsa da hatırlatma listesinde yeşil "Gönderildi" görünür; geçmiş tablosunda durum ne olursa olsun yeşil rozet. | Kod (`apps/randevu/app.js` `sendSms`, `remindersPage`) | `CLAUDE.md` §1 ihlali. İşletme müşteriye hatırlatıldı sanıyor, müşteri gelmiyor. |
| H2 | **Müşterinin "hatırlatma istemiyorum" seçimi yok sayılıyor:** online randevuda işaret kaldırılınca `noReminder` kaydediliyor ama "hepsine gönder" bu müşterilere de gönderiyor. | Kod | Müşterinin açık tercihine aykırı mesaj (İYS/KVKK açısından da risk). |
| H3 | **Sahte "Google İşletme / Instagram bağlandı":** simülasyonda da "randevu butonu bağlandı" deyip tarih kaydediyor. Google'a veya Instagram'a hiçbir şey gönderilmiyor; böyle bir resmî API bağlantımız yok. | Kod + `core/integrations.js` `call()` | Sahte başarı. İşletme butonun yayında olduğunu sanıyor. |
| H4 | **Süresi dolmuş paket kullanılabiliyor:** ödeme ekranı ve "+1 seans kullan" son kullanım tarihine bakmıyor; paket sayfasında kullanım hangi randevuya ait görünmüyor. | Kod | Şikâyetlerin ana konusu (eksik/fazla seans tartışması). |
| H5 | **Online sayfada yanlış çalışma saatleri:** "Pazar kapalı" ve tüm günler için tek saat sabit yazıyor; oysa personelin pazar mesaisi var ve pazar günü randevu alınabiliyor. "Şu an açık" da aynı hatalı kurala bakıyor. | Kod (`book.html` `nowOpen`, `.hrs`) | Müşteri açık günü kapalı görüyor ya da tersi. |
| H6 | **Online sayfada boş vaat:** "Randevunuzdan önce SMS ile hatırlatma göndereceğiz" yazıyor; otomatik hatırlatma yok, SMS kapalı olabilir. | Kod | Sahte vaat. |
| H7 | **KVKK onayı metinsiz:** online randevuda onay kutusu var ama aydınlatma metni gösterilmiyor. | Kod | KVKK md. 10 aydınlatma yükümlülüğü (hafızadan, doğrulanmadı — metin işletmeye aittir; biz yalnızca gösterme yerini sağlarız). |

---

## 3. Özellik karşılaştırması

O = Olmazsa olmaz · E = Beklenen · F = Fark yaratan. Durum: ✅ var · ⚠️ kırık/eksik · ❌ yok.

| Özellik | Sınıf | Rakipte | Bizde | Not |
|---|---|---|---|---|
| Çok personelli gün/hafta takvimi, sürükle-bırak | O | SR, RN | ✅ | |
| Personel çalışma saati, kapalı saat | O | SR, RN | ✅ | |
| Online randevu sayfası (link, QR) | O | SR, KY | ✅ | H5, H6, H7 düzeltilecek |
| Randevu hatırlatma (SMS/WhatsApp) | O | SR, RN | ⚠️ | H1, H2 |
| Gelmeyen müşteri işaretleme | O | RN | ✅ | Kural yok → B1 |
| Paket / seans satışı ve takibi | O | SR, RN | ⚠️ | H4; seans geçmişi → B2 |
| Kasa, ödeme türleri, prim | O | SR, R3 | ✅ | |
| Müşteri kartı, geçmiş, not/alerji | O | SR | ✅ | |
| Gelmeme kuralı (n kez gelmeyen online'da onaya düşer) | E | RN (no-show azaltma) | ❌ | B1 |
| Paket seans geçmişi (hangi randevuda düşüldü, kim düştü) | E | şikâyet teması | ❌ | B2 |
| Bekleme listesi (dolu güne talep, iptalde haber) | E | — | ❌ | B3 |
| Tekrarlayan randevu (her n haftada bir, k kez) | E | — | ⚠️ | yalnız "+28 gün" var → B4 |
| Hatırlatma zamanı gelenlerin otomatik listesi / tek tık gönderim | E | SR | ⚠️ | B5 |
| Online randevu iptal kuralı (son X saat) | E | — | ✅ | |
| Müşterinin online randevuyu taşıması | F | — | ❌ | F1 |
| Kayıp müşteri geri kazanma listesi (60+ gün) ve toplu mesaj | F | SR (risk grubu kampanya) | ⚠️ | filtre var, mesaj yok → F2 |
| Telefonda "gündem" görünümü (takvim yerine liste) | F | — | ❌ | F3 |
| Kapora / online ön ödeme | E | şikâyet teması | ❌ | Ödeme sağlayıcı hesabı gerekir → §6 |
| Otomatik (sunucudan) zamanlanmış hatırlatma | E | SR | ❌ | Sunucu zamanlayıcı gerekir → çekirdek isteği |

---

## 4. Güven kuralları (şikâyetlerden ve `CLAUDE.md` §1'den)
1. Gönderilmeyen mesaj "gönderildi" görünmez; simülasyon her yerde **TEST** yazar ve randevuyu "hatırlatıldı" yapmaz.
2. Müşterinin hatırlatma tercihine uyulur; toplu gönderim bu müşterileri atlar ve kaç kişinin atlandığını söyler.
3. Paket seansı yalnızca geçerli (süresi dolmamış, hakkı kalan) pakettten düşer; her düşüm kim/ne zaman/hangi randevu olarak kaydedilir ve geri alınabilir.
4. Online sayfadaki saatler personel mesaisinden hesaplanır; işletmenin söylemediği bir şeyi vaat etmez.
5. Kişisel veri: online formda aydınlatma metni gösterilir (metni işletme girer); müşteri notu (alerji vb.) yalnızca panelde görünür.

## 5. Dalga planı
**1. dalga (kırık ve temel):** H1–H7.
**2. dalga (beklenen):** B1 gelmeme kuralı · B2 paket seans geçmişi + geri alma · B3 bekleme listesi · B4 tekrarlayan randevu · B5 hatırlatma zamanı gelenler (ayara göre saat) ve panel açıkken otomatik gönderim seçeneği (açıkça "panel açıkken" diye).
**3. dalga (fark yaratan):** F1 müşterinin online randevuyu taşıması · F2 kayıp müşteri geri kazanma mesajı (İYS uyarısıyla) · F3 telefonda gündem görünümü.

## 6. Karar / hesap gerektirenler
- **Kapora / online ön ödeme:** iyzico/PayTR vb. üye işyeri hesabı ve iade politikası (işletme kararı). Hesap olmadan yapılmaz.
- **Sunucudan otomatik hatırlatma** (panel kapalıyken): sunucuda zamanlayıcı gerekir → `docs/urun/CEKIRDEK-ISTEKLERI-randevu-uyelik.md`.
- **Google "Rezervasyon" / Instagram butonu:** resmî bir API bağlantımız yok. İşletme, Google İşletme Profili'nde randevu bağlantısı alanına kendi online randevu linkini elle girebilir (Google yardım sayfası bu oturumda doğrulanmadı — DOĞRULANAMADI; ekranda yalnızca "linki kopyalayıp profilinize ekleyin" denir, menü yolu yazılmaz).
- **SMS sağlayıcı hesabı** (Netgsm / İleti Merkezi): Entegrasyonlar > SMS; gerçek gönderim testi işletmenin numarasıyla yapılır.

## Modül: Güzellik seans paketi (30.10.2026)

Varsayılan kapalı. Ayarlar > Seans paketi modülü ile açılır. Kapalıyken paket ekranı ve eski kayıtlar değişmez.

**Mevcut durum:** Paket satışı, seans düşümü, kalan seans, son kullanım ve seans geçmişi zaten vardı. Modül yalnız eksikleri ekler.

Şikâyetler ve karşılayan özellik:

| Şikâyet | Kaynak | Özellik |
|---|---|---|
| Sözleşme süresi bitti denip kalan seanslar iptal edildi | https://www.sikayetvar.com/avis-vip-guzellik/sozlesme-suresi-bitti-diye-kalan-seanslarim-iptal-edildi | Süre uzatma kaydı, "Süresi dolan" görünümü, bitmeden hatırlatma |
| Seanslar düzensiz, geç tarihlere verildi | https://www.sikayetvar.com/lara-guzellik-merkezi/lara-guzellik-merkezi-lazer-epilasyon-sikayeti | Seans aralığı, sıradaki seans, "Seansı geçen" görünümü |
| Paketler silindi, iade yapılmadı | https://www.sikayetvar.com/nez-demir | Paket silinmez, iptal yetkili onaylı, iade kasaya gider yazılır |
| Kalan seans tartışması | https://www.sikayetvar.com/alanya-mag-plusta-satin-alinan-bolgesel-incelme-paketi-icin-randevu-saglanmamasi-ve-iade-reddi | Müşteriye verilen paket belgesi, seans tarihleri listeli |

Not: Şikâyetler işletmelerin hizmetine aittir, belirli bir yazılıma değil.

| Özellik | Sınıf | Durum |
|---|---|---|
| Paket sat, seans düş, kalan seans | Olmazsa olmaz | Vardı |
| Seans notu (bölge, ayar) | Beklenen | Var |
| Sıradaki seans, süre uzatma, hatırlatma | Beklenen | Var, SMS sağlayıcı olmadan TEST |
| İptal ve iade, paket belgesi | Beklenen | Var, iade tutarı elle |
| Taksitli paket ödemesi | Beklenen | Yok, sonraki dalga |
| Müşterinin kalan seansı online görmesi | Fark yaratan | Yok, `public-rules.js` ve `book.html` işi |

**DOĞRULANAMADI:** Paket iadesinin tüketici mevzuatına göre hesabı incelenmedi, program hesap yapmaz. Koşul metnini işletme hukukçusu yazar.

Deneme: `?demo=1`, modül kapalı ve açık, seans düşme, belge, süre uzatma, iptal ve iade kaydı. Konsol hatası yok.
