# Kuyumcu — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga geliştirildi, kullanıcı/pilot kabulü bekliyor. Program: `apps/kuyumcu/` (+ `ekran.html` vitrin). Mevzuat ve kur konularında aşağıdaki engelleyenler kapanmadan canlıya çıkılmaz.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Emanet altın (UYUMSUZ, kapatıldı):** Kuyum Ticareti Hakkında Yönetmelik md. 10/3: "Kuyum işletmesi, kuyum veya herhangi bir menkulü emanet alamaz ya da başka bir amaçla saklayamaz." Yeni emanet girişi kaldırıldı. Eski bakiyeler silinmedi; yalnızca teslim veya satışla kapanır. **Karar gerekli:** eski bakiyeler için hukukçu görüşü.
- **Çekirdekte kalan emanet metinleri:** `core/forms.js` "Emanet / tamir teslim tutanağı" imzalı belgesi ve `market/catalog.js` "emanet" tanıtımı hâlâ duruyor (bu oturum dokunamaz).
- **Kimlik tespiti sınırı (DOĞRULANAMADI):** RG 7.10.2026-33393, Karar 11845 ile Tedbirler Yönetmeliği değişikliği resmî fihristte görüldü; PDF taranmış olduğu için tutar okunamadı. Hukuk blogu 370.000 ₺ diyor (resmî değil). Varsayılan önceki sınır **185.000 ₺**, Ayarlar'dan değişir. Mali müşavir teyit etmeli.
- **e-Belge / KDV:** otomatik fatura yok. Fiş "mali belge yerine geçmez" yazar. KDV Kanunu md. 23/e dökümü bilgi amaçlıdır; KDV oranı ve tebliğdeki referans külçe fiyatı DOĞRULANAMADI, müşavir kararı gerekir.
- **Has kuru tanımı:** program kuru 1 gr saf altın sayar; 24 ayar 995 milyem hesaplanır (1 gr gram altın = 0,995 × kur). Toptancınız kuru 995 gram için veriyorsa gram altın %0,5 ucuz çıkar. **Karar gerekli.**
- **Toptancı kur servisi:** gerçek toptancı servisiyle denenmedi; alan adları varsayımdır (`hasBuy/hasSell`, `alis/satis`, `HAS.alis/satis`). Bilinmeyen biçim reddedilir, tahmin edilmez.
- **Sikke ağırlıkları:** 1,75 / 3,5 / 7 / 7,216 / 17,5 gr haber kaynaklıdır; Darphane sayfası içerik vermedi (DOĞRULANAMADI).

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | "Kur servisinden çek" tarayıcıdan doğrudan `fetch` yapıyordu: `/api/istek` köprüsünü atlıyordu (CLAUDE.md §4) ve CORS yüzünden çoğu toptancı servisinde çalışmazdı | `NS.integ.http` (köprü) ile çağrılır; hata ayrıntısı gösterilir | Tarayıcı: yerel JSON (kur alanı yok) → "Kur alınamadı: Kur alanları bulunamadı" |
| H2 | Sipariş hazır SMS'i sonucu beklemeden "SMS gönderildi" diyordu | Gerçek sonuç (TEST / gönderildi / hata) gösterilir (çekirdek `smsLog().result`) | Çekirdek commit'i |

## 1. Pazar araştırması ve mevzuat (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı.
- [MacGold](https://www.tamindir.com/indir/macgold/): şube, garanti sertifikası, stok kataloğu, hurda takibi, perakende/toptan, personel primi.
- [CetaSoft Kuyumcu 2005](https://www.tamindir.com/indir/cetasoft-kuyumcu-programi-2005/amp/): altın/gümüş/pırlanta/saat/döviz, geçmiş tarihli stok, hurdalaştırma, borçlu müşteri (ayrıca [mobil izleme](https://apps.apple.com/us/app/id6751603719)).
- [MskGold](https://www.tamindir.com/indir/mskgold-10/): cari kayıt ve müşteri takibi.
- [Kuyumex](https://apps.apple.com/us/app/id1211629132): döviz bürosu + kuyumcu, iPad.
- [Hasfiyat](https://www.capterra.com/p/10044507/Hasfiyat/) ve [tanıtım haberi](https://www.habergazetesi.com.tr/isinizi-cebinizden-yonetin-hasfiyat-modern-kuyumcu-yazilimi): canlı altın-döviz ekranı, gram bazlı stok-kasa, cari, toplu e-Fatura, QR vitrin.

**Kullanıcı şikâyeti: bulunamadı** (Şikâyetvar araması sonuç vermedi). Öncelikler özellik sayfalarına, mevzuata ve kod incelemesine dayanır.

**Mevzuat**
| Konu | Durum | Kaynak |
|---|---|---|
| Emanet yasağı md. 10/3; izinli işler (bakım-onarım, standart dışı hammadde alımı vb.) md. 10/1; başkası adına alım satım yasağı md. 10/2 | **DOĞRULANDI** (2021 metni) | [Ticaret Bakanlığı PDF](https://siirt.ticaret.gov.tr/data/618cc7f613b87685f45b5382/KUYUM%20T%C4%B0CARET%C4%B0%20HAKKINDA%20Y%C3%96NETMEL%C4%B0K%20(14%20Nisan%202021).pdf), RG 14.4.2021-31454, okundu 30.10.2026. Son değişiklik 24.6.2026; md. 10/3'ün değişmediği ikincil kaynakta ([Lexpera](https://www.lexpera.com.tr/mevzuat/yonetmelikler/kuyum-ticareti-hakkinda-yonetmelik)) görüldü, mevzuat.gov.tr konsolide metni açılamadı |
| Sentetik taş ayrı belirtilir md. 11/2-e | DOĞRULANAMADI (yalnızca ikincil: [Alomaliye](https://www.alomaliye.com/2021/04/14/kuyum-ticareti-hakkinda-yonetmelik/)) | Yine de sentetik taş fişte ve etikette yazılır |
| Ziynet ve sikke KDV matrahı, külçe bedeli düşülerek | **DOĞRULANDI** | [3065 s. Kanun md. 23/e](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.3065.pdf), okundu 30.10.2026 |
| Kimlik sınırı değişikliği | Varlığı DOĞRULANDI, tutarı DOĞRULANAMADI | [RG fihristi 7.10.2026](https://www.resmigazete.gov.tr/eskiler/2026/10/20261007.htm); [ikincil yorum](https://hukukcularevi.com/masak-kimlik-tespiti-siniri-370-000-tl-7-ekim-2026-elektronik-transfer-kripto-30-000-tl-sms-otp-tedbirler-yonetmeligi/) |
| Döviz kuru | **DOĞRULANDI** (servis yanıtı okundu) | [TCMB today.xml](https://www.tcmb.gov.tr/kurlar/today.xml), bülten 2026/203, 27.10.2026 |

## 2. Dalga 1b — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| K1 | Yönetmeliğe aykırı emanet: alıştan "altın hesabına ekle", müşteriden "emanet yatır" | Kaldırıldı; demo verisinde bakiye yok; eski bakiye uyarısı ve "Altın hesabını kapat" | Tarayıcı: yalnız Nakit/Havale, yön alanı yok, 10 → 5,42 has |
| K2 | Kur uydurmaydı ve "Kur güncel" diyordu | Kaynak her yerde görünür (bar, fiş, vitrin, kur günlüğü); demo kuru "ÖRNEK" ve gerçek işlemde reddedilir; TEST fişi | Tarayıcı: ?demo olmadan red, demoda fişte "TEST — ÖRNEK KUR"; `hesap.test.js` |
| K3 | Eski kurla satılabiliyordu; kur 0 iken 0 ₺'ye satılıyordu | Süresi dolan kur uyarı + yetkili onayı (süre ayardan); kur yoksa işlem yok | Tarayıcı (kur yok); eski kur Kod incelendi + test |
| K4 | Stoksuz sikke sepete giriyor, stok sessizce 0'a sabitleniyordu | Sepete girmez, ödemede tekrar denetlenir | Tarayıcı |
| K5 | Alışta nakit yetmezse hata verilmeden önce sikke stoğu ve bakiye artıyordu | Denetim önce; yan etki yok | Tarayıcı: stok değişmedi |
| K6 | "Brüt kâr" bugünkü kurla hesaplanıyor, emanet gramını kâr sayıyordu | İşlem anı kuru saklanır; emanet, sipariş, iptal kâr dışı | `hesap.test.js` |
| K7 | Altın hesabından satışta işçilik ve taş bedava gidiyordu | Hesap yalnız has karşılar, işçilik + taş nakit alınır | `hesap.test.js`; ekran akışı Kod incelendi |
| K8 | Satış iptali yoktu | Yetkili onayı + neden; stok, kasa, cari geri alınır; kayıt silinmez | Tarayıcı: -76.060 ₺, 2 sikke ve ürün geri |
| K9 | Kapora kasaya girmiyor, teslim satışa dönmüyordu | Kapora al, teslimde kalan tahsilat, iptalde kapora iadesi, kasa hareketi | Tarayıcı |
| K10 | Hurda stokta görünmüyordu; kasa hareketi kaydı yoktu | Hurda has stoğu; her TL hareketi nedeniyle `cashLog` | Tarayıcı |
| K11 | 50.000 ₺ eşiği dayanaksızdı, TC adı yerine yazılıp müşteri açıyordu | Ayarlanabilir sınır, bağlantılı işlem toplamı, ad + kimlik + telefon, T.C. denetim hanesi | Tarayıcı: 12345678900 red, geçerli no kaydı |
| K12 | Tezgâhtar kur, makas, stok gramı ve sayımı onaysız değiştiriyordu | `NS.approve` + kayıt; kârı ve raporu görmez | Tarayıcı: yanlış PIN red, doğru PIN kayıt |
| K13 | Bağlı kayıt silinebiliyordu (müşteri, kaporalı sipariş, toptancı) | Engellendi | Tarayıcı |
| K14 | Numara `kayıt sayısı` ile üretiliyordu | En büyük numara + 1 | `hesap.test.js` |
| K15 | Fiş "alınan altın test edilmiştir" ve iade koşulu iddia ediyordu | Kaldırıldı; not işletmenin yazdığı metin; `NS.docs` | Tarayıcı (fiş metni); kâğıtta denenmedi |
| K16 | Vitrin uçuna tüm ayarlar gidiyordu (`rateUrl`, kurallar, şablon) | Beyaz liste | `kuyumcu-kural.test.js` |
| K17 | Çok kayıtta yavaşlık (müşteri başına tüm işlemler taranıyordu) | Tek geçiş, 300 satır gösterim + arama | Tarayıcı: 8.000 ürün, 5.000 müşteri, 40.000 işlem: müşteri 43 ms, stok 76 ms, rapor 221 ms, özet 337 ms |

## 3. dalga 2 — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Karma ödeme ve cari | Nakit + kart + havale + cari; toplam tutmazsa red; tahsilat makbuzu | Cari ve tahsilat Tarayıcı; karma Kod incelendi |
| B2 | İndirim sınırı | Limit üstü yetkili onayı | Kod incelendi |
| B3 | Kasa sayfası ve gün sonu | Beklenen/sayılan, fark kaydı, `NS.docs` | Tarayıcı: -100 ₺ fark |
| B4 | Sipariş ve tamir | Tür, fiş, toplu "hazır" SMS (`NS.smsBatch`, gerçek sonuç) | Tarayıcı: "TEST — gönderilmedi" |
| B5 | Raporlar | Dönem, ödeme dağılımı, Excel | Tarayıcı (ekran); dosya açılmadı |
| B6 | Kur günlüğü ve TCMB döviz kuru | Tarih ve kaynak görünür; %5 üstü sıçramada onay | Tarayıcı: USD 49,7892 TCMB 27.10.2026; günlük grafiği Kod incelendi |
| B7 | Kur sayfası sıçrama denetimi, ters kur | Red ve onay | Kod incelendi + `hesap.test.js` (servis) |

## 4. dalga 3 — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Milyem işçilik ve taşlı ürün | ₺/gr veya milyem; taş ağırlığı hastan düşer; sentetik taş fişte ve etikette | `hesap.test.js`; ekran Kod incelendi |
| F2 | Toptancı has/TL borcu | Mal alındı, hurda ver (has borç düşer), TL ödeme | Tarayıcı |
| F3 | Has pozisyonu | Elde has - borçlu has, TL karşılığı | Tarayıcı + test |
| F4 | Özel matrah dökümü | Satış - külçe bedeli = kalan, Excel; vergi hesaplanmaz | Tarayıcı (ekran) + test |

## 5. Hesap kanıtı
`node apps/kuyumcu/hesap.test.js` (19 başlık): ayar → milyem → has, 10 gr 22 ayar + 100 ₺/gr = 37.640 ₺ (4.000 ₺ kur), milyem işçilik, taş, tam TL yuvarlama ve kalem toplamı, sikke makası, hurda kesintisi, kur durumu, servis ayrıştırma, TCMB, kâr, kimlik toplamı, has pozisyonu. `node server/test/kuyumcu-kural.test.js`: vitrin beyaz listesi.

## 6. Kalite kapısı
Satış, iptal, alış, cari, sipariş, kasa, toptancı, kur ve tezgâhtar onayları tarayıcıda; konsol hatası yok. 375 px'te 10 ekranda yatay taşma yok, vitrin ekranı görüldü. Boş veri ve kur yok durumu denendi. Koyu tema: yalnızca vitrin (kendi koyu tasarımı) ve renk değişkeni kullanımı; panel koyu temada ayrıca gezilmedi. Kâğıda baskı, gerçek SMS ve bulut vitrin (`/t/...`) denenmedi.

## 7. Yapılmadı
e-Fatura kesimi, kategori/şube, fotoğraflı katalog, garanti sertifikası, `NS.labels` etiket tasarımcısı (etiket basımı eski yazdırma ile), gümüş ve döviz alım satımı.
