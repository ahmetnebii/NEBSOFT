# Kâr & Fiyat Robotu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga geliştirildi, kullanıcı/pilot kabulü bekliyor. Program: `apps/fiyatrobotu/`. Aşağıdaki engelleyenler kapanmadan canlı fiyat gönderilmez.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Canlı test yok:** Trendyol ve n11 gönderimi yalnızca sahte sunucuyla (`server/test/mock-pazaryeri.js`) denendi. Sağlayıcının test hesabıyla denenmeden canlıya alınmaz (CLAUDE.md §1).
- **Hepsiburada ve Amazon TR canlı seçilemez (DOĞRULANAMADI):** Pazaryeri programıyla aynı karar (`docs/urun/PAZARYERI.md` P4). Eski kayıtta "canlı" kalmışsa da canlı sayılmaz.
- **Stok birlikte gider:** `/api/kanal` `stok-fiyat` işlemi stoksuz fiyat göndermez; stok boşsa 0 yazardı. Resmî doküman (Trendyol V2, 7.8.2026) yalnız fiyat göndermeye izin verir. Program stok bilgisi boş ürünü göndermez, onay penceresi uyarır; yine de programdaki stok eskiyse pazaryeri stoğunun üstüne yazılır. **Bağlayıcı isteği aşağıda.**
- **API anahtarları:** şifresiz saklama giderildi (31.10.2026). `channels` içindeki `apiKey` ve `apiSecret` veritabanına şifreli yazılır, tarayıcıya `__nsg_fiyatrobotu_<kanal>_<alan>__` iner; `/api/kanal` ve `/api/istek` sunucuda çözer. Buybox isteği çalışsın diye `server/connectors/endpoints.json` adresleri bilinen adres listesine girdi. İzleyici rolüne alanlar gitmez, kanal kaydı salt okunurdur. Kanıt: `server/test/eticaret-anahtar.test.js`, `server/test/rol-kural.test.js`. Gerçek hesapla denenmedi. Daha önce düz metin girilmiş anahtar eski veritabanı yedeklerinde durur, o işletmede anahtar pazaryeri panelinden yenilenmeli.
- **Buybox servisi:** resmî dokümana uygun, tarayıcı köprüsüyle (`NS.integ.http`) çağrılır; gerçek hesapla denenmedi. Hepsiburada ve n11 için rakip kaynağı yok: yalnızca fiyat dosyası.
- **"En ucuz rakiple eşitle" kararı:** Rekabet Kurumu duyurusuna göre Trendyol kendi otomatik fiyat mekanizmasından "Buybox Fiyatına Eşitle" seçeneğini çıkarmayı taahhüt etti. Üçüncü taraf yazılımlara uygulanıp uygulanmadığı DOĞRULANAMADI. Strateji silinmedi, hukuk görüşüne kadar canlıda kullanılmaması önerilir. **Karar gerekli.**
- **Komisyon tabanı (DOĞRULANAMADI):** kaynaklar çelişiyor, Trendyol'un `getSettlements` dokümanı belirtmiyor. %20 KDV'li üründe sonuç aynı; %1 ve %10'da ayrışır. Varsayılan eski davranış; Ayarlar'da "Komisyon KDV hariç fiyata uygulanır" seçilir. Satıcı sözleşmesiyle teyit edilmeli.
- **Oranlar örnektir:** komisyon, kargo ve hizmet bedeli satıcı kaydedene kadar her ekranda "örnek" uyarısı çıkar.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Uydurma rakip fiyatıyla gerçek fiyat gönderimi:** kanal canlıyken demo rakip fiyatına göre hesaplanan fiyat Trendyol/Hepsiburada'ya gidebiliyordu | Rakip fiyatlarında kaynak (`comps[].source`) yoksa buybox/eşitle stratejili değişiklikler canlı kanala gönderilmez, açık hata | Tarayıcı: Trendyol canlı → "rakip fiyatları gerçek bir kaynaktan alınmadı (demo) — gönderilmedi", 15 listeleme değişmedi |
| H2 | **Demo kanalda "fiyat güncellendi" + buybox kazanıldı:** fiyat kanala gitmediği hâlde başarılı görünüyordu | "TEST — … canlı bağlı değil: fiyatlar yalnızca programda güncellendi"; listede "Kanala gönderilmedi" rozeti, buybox işaretlenmez; rakip fiyatı "(demo)" etiketli | Tarayıcı: 35 değişiklik → turuncu TEST uyarısı, 35 listeleme `notSynced` |

## 1. Pazar araştırması ve kaynaklar (30.10.2026)
Satıcı tanıtımları ve kullanıcı beyanlarıdır; bağımsız doğrulanmadı.
- [Sentos Hepsiburada](https://apps.shopify.com/hepsiburada-entegrasyonu) ve [Trendyol uygulaması](https://apps.shopify.com/trendyol-pazaryeri): stok/fiyat eşitleme; otomatik fiyat üst pakette.
- [AnalyzerPRO](https://analyzertr.com/stok-takibi): ürün sayfalarından fiyat/stok verisi, geçmiş fiyat grafiği.
- [Avantajlı Fiyatlar uzantısı](https://extscope.org/extension/cbncejedlhjnmdfhcablglmadfnddgnc): rakip fiyat görme.
- [ikas](https://ikas.com/tr/trendyol-komisyon-hesaplama), [Ticimax](https://ticimax.com/trendyol-komisyon-hesaplama), [Zunapro](https://www.zunapro.com/turkey/tr/komisyon-hesaplama): ücretsiz komisyon hesaplayıcıları.
- Dopigo ve Entegra dinamik fiyat ayrıntısı: **bulunamadı**.

**Şikâyetler:** [Sentos](https://www.sikayetvar.com/sentos): hatalı toplu fiyat değişikliği, yetersiz destek. [Sopyo](https://www.sikayetvar.com/sopyo): nokta/virgül ayrımı yüzünden yanlış fiyat. [Dopigo](https://www.sikayetvar.com/dopigo): fiyat ve sipariş eşitlenmemesi. Karşılığı: büyük değişiklik sınırı (B2), belirsiz sayı reddi (B3), gönderim sonucu sorgulama (B5).

**Resmî dokümanlar**
| Konu | Durum | Kaynak |
|---|---|---|
| Trendyol buybox servisi: POST `buybox-information`, en çok 10 barkod, dakikada 1000 istek, `buyboxOrder`, `buyboxPrice`, `secondBuyboxPrice`, `thirdBuyboxPrice`, `hasMultipleSeller` | **DOĞRULANDI** | [developers.trendyol.com](https://developers.trendyol.com/docs/ürün-buybox-kontrol-servisi-1.md), güncelleme 20.7.2026 |
| Trendyol fiyat/stok: 1000 SKU, yalnız fiyat gönderilebilir, sonuç `getBatchRequestResult` ile, aynı gövde 15 dk tekrar edilemez | **DOĞRULANDI** | [developers.trendyol.com](https://developers.trendyol.com/docs/stok-ve-fiyat-güncelleme-updatepriceandinventory-1.md), güncelleme 7.8.2026 |
| Komisyonun KDV tabanı | DOĞRULANAMADI | [getSettlements](https://developers.trendyol.com/reference/getsettlements.md) belirtmiyor; [Paraşüt](https://www.parasut.com/blog/trendyol-magaza-komisyon-oranlari) ve [Zunapro](https://www.zunapro.com/turkey/tr/komisyon-hesaplama) çelişiyor |
| Trendyol taahhüdü: "Buybox Fiyatına Eşitle" kaldırılır | **DOĞRULANDI** (kapsamı yalnız Trendyol mekanizması) | [Rekabet Kurumu duyurusu](https://rekabet.gov.tr/Dosya/trendyol-duyurusu-20241128134225533.pdf) |
| Hepsiburada taahhüdü | DOĞRULANAMADI (duyuru okunmadı, ikincil: [Paratic](https://paratic.com/rekabet-kurulu-hepsiburada-sorusturmasini-sonlandirdi/)) | [Rekabet Kurumu](https://rekabet.gov.tr/Dosya/hb-internet-duyurusu-20241204141258702.pdf) |

## 2. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| K1 | "Taban fiyatın altına inmez" yanlıştı: tavan < tabanda, marj imkânsızken veya maliyet boşken koruma kapanıyordu | Öneri yapılmaz, nedeniyle listelenir | `hesap.test.js` |
| K2 | Hepsiburada canlı seçilebiliyordu; n11 canlı değildi | Canlı liste Pazaryeri ile aynı; canlıya API bilgisi zorunlu | Tarayıcı |
| K3 | Canlıda buybox "kazanıldı" sayılıyordu (yalnızca fiyata bakarak) | Buybox yalnız pazaryeri yanıtından; demo veri "(demo)" | Tarayıcı + `hesap.test.js` |
| K4 | `listPrice` olarak tavan gönderiliyordu: gerçek olmayan üstü çizili fiyat | Mevcut liste fiyatı, yoksa satış fiyatı | Kod incelendi |
| K5 | Pazaryeri isteği kabul edince "gönderildi" deniyordu, sonuç sorulmuyordu | "İletildi, sonucu sorgulayın"; red gelen fiyat geri alınır | Tarayıcı (sahte sunucu): 1 canlı, onaylandı; red yolu `hesap.test.js` |
| K6 | Barkodu veya stoğu boş ürün sessizce atlanıyor ya da 0 stok gidiyordu | Gönderilmez, nedeniyle listelenir | Kod incelendi |
| K7 | Listeleme ekleme yoktu: gerçek kullanıcı programı kullanamıyordu | Kanala ekle, sil; varsayılan strateji "Fiyatı değiştirme" | Tarayıcı |
| K8 | Bağlı ürün silinince kayıtlar bozuluyordu; stok kodu çakışıyordu | Engellendi | Tarayıcı |
| K9 | Tek rol vardı | Yönetici, Fiyat uzmanı, İzleyici; taban altı fiyat `NS.approve`; kanal ve API yalnız yönetici | Tarayıcı: yanlış PIN red, izleyicide düğme yok, kanal sayfası kapalı |
| K10 | "Sözleşme oranını girin" deniyordu ama kargo ve hizmet bedeli girilemiyordu; hesaplayıcı girilen oranları yok sayıyordu | Düzenlenebilir; hesaplayıcı aynı oranlarla | Tarayıcı |
| K11 | Elle fiyatta TEST sonucu "Fiyat güncellendi" görünüyordu | Ortak gerçek sonuç metni | Tarayıcı |
| K12 | Binlerce kayıtta yavaş (her satırda ürün araması, geçmiş sınırsız) | Tur içi dizin, 300 satır gösterim, günlük tek geçmiş, 200 çalışma | Tarayıcı: 6.000 ürün, 18.000 listeleme: kârlılık 206 ms, robot 118 ms, ürünler 88 ms, arama 250 ms |
| K13 | Rakip yokken "rakip ₺0" | Gösterilmez | Kod incelendi |

## 3. dalga 2 — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Excel içe aktarma | Ürün + maliyet + listeleme; şablon; hatalı satır numarasıyla atlanır | Tarayıcı (dosya seçimi taklit edildi); gerçek dosya denenmedi |
| B2 | Büyük değişiklik sınırı | %20 üstü otomatik seçilmez, rozetli | Tarayıcı: 43 öneri, 40 seçili |
| B3 | Türkçe sayı | "1.234,56" doğru; "1.234" ve "1,234" belirsiz, reddedilir | `hesap.test.js`, tarayıcı |
| B4 | Rakip fiyat dosyası | Kaynak ve tarih kaydedilir, 24 saatten eski rakip canlıya gitmez | Tarayıcı + test |
| B5 | Robot geçmişi | Sonuç sorgulama, geri alma, `NS.docs` raporu | Tarayıcı; sahte sunucu onayı; kâğıtta denenmedi |
| B6 | Reklam gideri, Excel kârlılık | Kâra girer | `hesap.test.js`; Excel Kod incelendi |

`NS.smsBatch`: programda SMS senaryosu yok, eklenmedi.

## 4. dalga 3 — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Trendyol buybox bilgisi | Sıra ve 1-3. fiyat; kendi sıramız rakip sayılmaz | `hesap.test.js`; gerçek servis denenmedi. Demo kanalda "TEST" görüldü (Tarayıcı) |
| F2 | Senaryo | Maliyet/komisyon/kargo artışında zarara geçenler, başa baş fiyat | Tarayıcı + test |
| F3 | Kampanya indirimi | Hesaplayıcıda indirimli kâr | Tarayıcı |

## 5. Hesap kanıtı
`node apps/fiyatrobotu/hesap.test.js` (25 başlık): kâr, komisyon tabanı, reklam, `priceFor` ↔ `calc` tutarlılığı, kargo, taban ve tavan, fiyat sonu, rakip tazeliği, buybox yanıtı ve isteği, sayı ayrıştırma, dosya, gönderim sonucu, senaryo, canlı kanal listesi.

## 6. Kalite kapısı
Robot uygulama, TEST sonucu, sahte sunucuya gönderim, sonuç sorgulama, geri alma, roller, ürün, listeleme, içe aktarma, oranlar tarayıcıda; konsol hatası yok. 375 px'te 8 ekranda yatay taşma yok; Robot ve Kârlılık telefonda kart. Boş veri denendi. Koyu tema bu programda açılmadı (Kuyumcu'da aynı çekirdek stil görüldü). Kâğıda baskı ve gerçek pazaryeri denenmedi.

## 7. Çekirdek ve bağlayıcı istekleri
- `server/connectors/trendyol.js` ve `n11.js` `stok-fiyat`: `stock` verilmezse `quantity` hiç gönderilmesin.
- `trendyol.js`: `buybox` işlemi (şu an tarayıcıdan `NS.integ.http`).
- Pazaryerinden ürün ve fiyat çekme işlemi; listeleme elle veya Excel ile giriliyor.

Yapılmadı: otomatik zamanlı çalışma, n11/Hepsiburada rakip servisi, iade oranı gideri, pazaryeri hakediş verisiyle gerçekleşen kâr.
