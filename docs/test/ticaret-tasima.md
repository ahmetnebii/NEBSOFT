# Bağımsız test raporu: mobilya, okul servisi, çiftçi, lastik

Tarih: 31.10.2026. Dal: `claude/ticaret-tasima-0f4440`. Yöntem: yazar raporlarına güvenilmedi. Başsız Chrome (CDP) ile `?demo=1` üzerinde gerçek tıklama ve form akışı, gerçek MariaDB'li sunucuda rol ve müşteri sayfası denemesi, entegrasyonlarda resmî kaynak karşılaştırması.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Bu dalda çözülemeyenler. `core/` ve `server/` kapsam dışı olduğu için değiştirilmedi.

| # | Engel | Kanıt | Gereken |
|---|---|---|---|
| 1 | **Çocuk verisi şifreli değil.** `okulservisi`, belge şifreleme listesinde yok. Çocuk adı, sınıf, durak, veli telefonu ve yoklama `app_data` içinde düz JSON durur | `server/cloud/belge.js:14` `SIFRELI`: klinik, eczane, veteriner, ik, anaokulu, yurt, entegrasyon, danisan | Listeye `okulservisi` eklensin, `gecis` ile mevcut belgeler dönüştürülsün. Aynı karar `ciftci` için de verilmeli: üretici TCKN ve IBAN'ı da düz durur |
| 2 | **e-Müstahsil canlıda seçilebiliyor, doğrulanmadı.** `emustahsil`, `UNVERIFIED` listesinde yok. `custom`/sağlayıcı seçilip adres girilince genel JSON gider, karşı taraf numara dönmese bile `EMU…` diye yerelde üretilmiş numara "başarı" olarak döner | `core/integrations.js:194`, `:212`, `:216`; rehber aynı sağlayıcıları "desteklenmiyor" diyor: `core/integ-guides-ek.js:92` | `emustahsil: '*'` eklensin. `ciftci` içinde gönderim kapatıldı, **`fabrika` hâlâ açık** |
| 3 | **e-Fatura mükellefi kooperatif kâğıt makbuzla çalışamaz.** Spec "isteğe bağlı" diyordu, UYUMSUZ. GİB: e-Fatura mükellefi olup müstahsil makbuzu düzenleyenler ve HKS kapsamındaki sebze meyve tüccarları e-Müstahsil düzenlemek zorunda. Program yalnız yazdırılan makbuz üretiyor | [GİB e-Müstahsil](https://ebelge.gib.gov.tr/emustahsilhakkinda.html), 31.10.2026 | Gerçek e-Müstahsil (GİB kılavuzu V1.1 + entegratör) yapılana kadar `ciftci` e-Fatura mükellefi alıcıya satılmamalı. Ürün kararı senin |
| 4 | **Üç rol sızıntısı sunucu kuralında.** Aşağıdaki "Roller" tablosunda | `server/test/ticaret-tasima-uctan.test.js` her çalışmada `! AÇIK` satırıyla yazar | `server/cloud/rol-kural.js` düzeltmesi |
| 5 | **Hiçbir bağlantı canlı denenmedi.** SMS, WhatsApp, e-Fatura sağlayıcı test hesabıyla denenmedi; görev gereği gerçek hesap ve ileti kullanılmadı | CLAUDE.md §1 | Test hesabıyla deneme |
| 6 | **Okul servisi belge listesi güncel mevzuata karşı doğrulanmadı.** Yönetmelik 2021, 2023, 2024, 2025'te değişti; birleşik metin bu ortamdan okunamadı | Entegrasyon tablosu | Hukuk veya kullanıcı teyidi. Ekrandaki uyarı bunu söylüyor |
| 7 | **Sezon hatırlatma SMS'inin ticari ileti sayılıp sayılmadığı doğrulanmadı.** Mesaj randevuya çağırıyor; İYS onayı denetimi yok | 6563 sayılı Kanun ve İYS metni okunmadı | Hukuk teyidi |
| 8 | **`npm test` geceleri kırmızı.** `bilet-kural.test.js` "Online satış kapandı" ile duruyor, zincir orada kesilir. Bu dalın işi değil, düzeltmesi ayrı dalda | 01:32'de çalıştırıldı | Ayrı dal birleşince tekrar çalıştırılmalı |

## Sonuç özeti

- Tarayıcı senaryoları: **221 kontrol geçti, 2 işaret kaldı.** İkisi de hata değil: biri testimin yanlış alarmı (genel toplam 0 iken eksi görünen şey beklenen brüt kâr), biri küçük kusur (montaj rolü takvim yerine İşler'de açılıyor, Kalan hatalar K4).
- Bulut uçtan uca: **13 senaryo geçti.**
- Görsel tarama: 4 program, 51 ekran, 6 görünüm, 306 sayfa açılışı. Konsol hatası **0**, yatay taşma **0**, `undefined/NaN` metni **0**.
- 5.000 alım satırı: açılış 923 ms, "Tüm geçerli" 38 ms, arama 5 ms, özet 11 ms, rapor 18 ms, kaydet 440 ms (350 ms test bekleyişi dahil). Veri 1,3 MB. Yeterli. `CEKIRDEK-ISTEKLERI` belgesindeki "ilk çizim 2 saniye" notu artık geçersiz, `NS.crud` sayfalıyor.
- Düzeltilen hata: **21**. Hepsi yeniden denendi.

### `npm test`

Zincir iki kez çalıştırıldı. `bilet-kural.test.js` geceye bağlı kırıldı (engel 8), bu yüzden kalan 65 test tek tek çalıştırıldı.

- 62 test zincirde geçti; `ubltr-xsd` .NET 10.0.401 ile çalıştı, atlanmadı.
- `roller-son` ve `siparis-bulut` ilk turda kaldı, tek başına tekrar çalıştırılınca geçti (45 ve 12 denetim). Eşzamanlı çalışan oturumlarla çakışma olduğunu düşünüyorum ama nedeni doğrulamadım.
- `cloud.test.js` 43 test geçti.
- Yani **`npm test` tek parça yeşil görülmedi.** "Geçti" denmemeli; gündüz, ayrı dal birleştikten sonra tek parça çalıştırılmalı.

## Düzeltilen hatalar

| # | Program | Hata | Kanıt (önce) | Düzeltme |
|---|---|---|---|---|
| 1 | Mobilya | İndirim ara toplamı aşınca teklif eksi çıkıyordu | Genel toplam −84.598,80 | `totals` sınırlar, ekran uyarır |
| 2 | Mobilya | Linkten onaylanan teklifin sürüm kopyası kaybolurdu | Sürüm 1 yok, yalnız sürüm 2 | `keepQuote`: kapora ve revizede tamamlanır |
| 3 | Mobilya | Sürüm 2, gönderilmeden müşteri linkinde onaylanabilirdi | `quoteSent` dolu kalıyordu | Revizede temizlenir |
| 4 | Mobilya | İş geçmişinde tahsil tutarı yazıyordu, usta ve montaj görüyordu | "Üretime alındı · alınan ₺10.260,00" | Not tutarsız, eski not ekranda kırpılır (sunucu sızıntısı engel 4) |
| 5 | Mobilya | **Genel indirim e-Belgeye yazılmıyor, fatura fazla çıkıyordu** | Satırlarda indirim yok | `invoiceLines` indirimi satırlara dağıtır, matrah kuruşu kuruşuna eşit |
| 6 | Mobilya | İade alınan ödemeyi aşabiliyordu, teslimde eksi tahsilat yazılabiliyordu | Kod incelemesi | Reddedilir |
| 7 | Mobilya | Usta ekranı sunucunun yok saydığı yazmaları sunuyordu (eksik, ölçü, fotoğraf): "kaydedildi" görünüp kayboluyordu | `izinli` listesi | Düğmeler kaldırıldı |
| 8 | Mobilya | Yüz yüze onaylı işte takip sayfası "teklifiniz hazırlanınca" diyordu | Kod ve sunucu kuralı farkı | Sunucuyla aynı koşul |
| 9 | Mobilya | Kullanılmayan `webhook` bağlantısı menüdeydi | `USED` ile fark | Kaldırıldı |
| 10 | Okul | **Fazla ödemede para kayboluyordu** | 6.000 alındı, 3.000 işlendi, iade sonrası 3.000 izsiz | Borçtan fazlası reddedilir, kayıt yazılmaz |
| 11 | Okul | **KDV oranı girilmemişse fatura %0 ve istisnasız kesiliyordu** | `vat: 0` | Oran girilmeden e-Belge kesilmez (veli ve kurum) |
| 12 | Okul | Şoförün Sabah/Akşam düğmesi 27 px | Tarama | 44 px |
| 13 | Çiftçi | **Fire %150 ile eksi makbuz kesiliyordu** | Kayıt oluştu | `checkBuy` |
| 14 | Çiftçi | Kesinti bedeli aşınca eksi ödenecek, fiyat 0 ile makbuz | Kayıt oluştu | `checkBuy` |
| 15 | Çiftçi | **e-Müstahsil işaretli, bağlantı kapalıyken uyarı yoktu**; kullanıcı gitti sanıyordu | Yalnız "makbuzu oluştu" | Uyarı; gerçek sağlayıcıda gönderim kapalı, seçenek TEST yazar |
| 16 | Çiftçi | Örnek süt alımı `kg` görünüyordu | Kayıtta birim yok | Birim yazılır |
| 17 | Çiftçi | Kantarda Borçlu/Alacaklı süzgeçleri vardı; sunucu ödemeyi gizlediği için yanlış liste verirdi | Ekran | Kaldırıldı |
| 18 | Çiftçi | ÇKS tarihleri kesin gibi yazıyordu; il müdürlükleri çelişiyor | Entegrasyon tablosu | İl müdürlüğü teyidi yazıyor |
| 19 | Lastik | **Gelecek tarihli DOT kabul ediliyordu** (2430) | Kayıt oluştu | `dotOk` |
| 20 | Lastik | Aynı plaka iki kez açılıyordu | "34 TST 123" ve "34TST123" | Plaka normalize, mükerrer ret |
| 21 | Lastik | **Usta Özet'te günlük ciro grafiği görüyordu**; usta stok kartı açabiliyordu (sunucu yok sayıyor); usta çıkışta ücret alınca ödeme kaydı kayboluyordu; maliyet iş kalemine kopyalanıyordu; koyu temada vurgu rengi okunmuyordu (1,88:1) | Tarama ve kurallar | Hepsi düzeltildi; usta ücreti cariye yazar; vurgu `#64748b` |

Boş veri düzeltmeleri de eklendi: raf, üretici, ürün veya ekip yokken form açılıp çıkışsız kalmıyor, ne yapılacağını söylüyor. İlk "boş liste" denemem geçersizdi (veri sayfa kapanırken geri yazılıyordu), yeniden yapıldı.

## Program başına

### Mobilya
Denenen: 13 ekran. Talep → ölçü → imza → teklif → gönderim → müşteri linki → onay → kapora → stok düşümü → değişiklik teklifi → atölye 6 aşama → montaj → teslim → e-Arşiv TEST → yenileme.
Elle hesap: (3×6.500 + 5×2.000 − 1.000) × 1,20 = **34.200,00** ekranla aynı. %30 kapora 10.260, kalan 28.740 doğru. Değişiklikte stoktan yalnız fark düştü (12→7→5). 1.234,56 indirimli işte e-Arşiv matrahı işle birebir aynı, toplam kuruş içinde.

### Okul servisi
Denenen: 14 ekran. Güzergâh, aynı saatte aynı araç reddi, kapasite reddi (10/10), öğrenci, tahakkuk, tahsilat, ayrılış ve iade, hatırlatma, duyuru, gelmeyecek bildirimi, şoför yoklaması, boşaltma onayı, veli portalı.
Elle hesap: 31 öğrenci tahakkuku, 3 kardeş grubu %10, **95.120,00** aynı. Ücretsiz öğrenciye tahakkuk yok, ikinci tahakkuk çift yazmıyor. Toplu SMS "0 SMS gönderildi · 30 TEST".

### Çiftçi
Denenen: 12 ekran. Alım, stopaj, iptal, girdi veresiye, reçete zorunluluğu, mahsup, ekstre, üretici portalı, gelir-gider dağıtımı, toplu ödeme, kantar rolü.
Elle hesap: 10.000 − 200 = 9.800; fire %2 → 9.604; ×14 = **134.456,00**; stopaj %4 **5.378,24**; 100 kesinti; ödenecek **128.977,76**. Üç alım + girdi mahsubu **155.307,76** alacaklı, ekstre ve yenileme sonrası aynı. Makbuz numarası iptalden sonra yeniden kullanılmıyor. Dağıtım: 100.000, %10 yedek → 10.000 + 90.000, paylar toplamı 90.000.

### Lastik
Denenen: 12 ekran. Lastik oteli, müşteri sayfası, teslim talebi, doğrulamalı çıkış, iş emri, ebattan stok, DOT uyarısı, teslim, cari, araç geçmişi, sezon SMS, eski lastik defteri.
Elle hesap: (4×2.000 + 4×150) × 1,20 = **10.320,00**. Cari 10.320 + 1.500 − 5.000 = **6.820,00**, ekstreyle aynı. Stok 10→6, eski lastik +4.

### Müşteri sayfaları
`takip`, `veli`, `uretici`, `lastigim`: giriş, hatalı kod, yazma ve 375 px denendi, taşma yok.

## Roller ve gizlilik (gerçek sunucu)

| Soru | Sonuç |
|---|---|
| Şoför yalnız kendi güzergâhını görüyor mu | Evet. Personel seçilmemişse hiç görmüyor |
| Şoför veli telefonu, kod, ücret görüyor mu | Hayır |
| Usta maliyet görüyor mu (mobilya) | Hayır, fiyat ve ödeme de gitmez |
| Usta maliyet görüyor mu (lastik) | Ekranda hayır. **Eski iş kalemlerinde API yanıtına gidiyor**, aşağıda |
| Veli başka çocuğun verisini görebiliyor mu | Hayır: kod, çocuk, ödeme, mesaj, yoklama süzülüyor. Başka çocuk adına yazamıyor (403), ödeme kaydını değiştiremiyor |
| Üretici başkasını görüyor mu | Hayır, TCKN ve maliyet de gitmez |
| Çocuk verisi şifreli mi | **Hayır. Engel 1** |

Açık sunucu kusurları (`server/cloud/rol-kural.js`), üçü de çalıştırılarak görüldü:

1. Şoför API ile başka güzergâha yeni sefer kaydı yazabiliyor (`satir` yeni kaydı serbest bırakıyor).
2. Kantar API ile eski alımın fiyatını ve durumunu değiştirebiliyor ("yalnız alım fişi yazar" tutmuyor). `purchases` için yeni kayıt dışı yazma kapatılmalı.
3. Mobilyada eski iş geçmişi notundaki tutar ustaya gidiyor; lastikte eski `jobs[].items[].cost` ustaya gidiyor (`K.filtrele` çıktısı: 1500). Yeni kayıtlar temiz, eski kayıt ve sunucu süzgeci açık.

## Entegrasyon tablosu

Kaynak erişim tarihi hepsinde 31.10.2026. Kanun metinleri ve bazı GİB PDF'leri bu ortamda metin olarak okunamadı; arama aracının sayfa metni üzerinden okunanlar belirtildi.

| Konu | İddia | Sonuç | Kaynak |
|---|---|---|---|
| `emustahsil` | Sağlayıcı ile gönderim | **UYUMSUZ** (engel 2): gönderim biçimi GİB kılavuzuna göre yazılmamış | [Mevzuat ve teknik mimari](https://ebelge.gib.gov.tr/emustahsilmevzuat.html) |
| e-Müstahsil kapsamı | Spec: isteğe bağlı | **UYUMSUZ** (engel 3), spec düzeltildi | [GİB](https://ebelge.gib.gov.tr/emustahsilhakkinda.html) |
| Uyumsoft, EDM, Logo e-MM izni | Listede | DOĞRULANDI | [e-MM entegratörleri](https://ebelge.gib.gov.tr/emustahsilozelentegratorlistesi.html) |
| Stopaj oranları | Hayvansal %1/%2, diğer %2/%4 | DOĞRULANDI (GİB özelge ve GVK 94 tablo sayfasının arama metni; PDF doğrudan okunamadı; 2026 tablosu ayrıca görülmedi) | [Özelge](https://gib.gov.tr/mevzuat/kanun/433/ozelge/23062), [Kesinti oranları](https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fyardim-kaynaklar%2Fyararli-bilgiler%2Fgelir-vergisi-kanununun-94uncu-maddesinde-yer-alan-kesinti-oranlari.pdf) |
| Makbuzda Bağ-Kur, borsa kesintisi | Programda ayrı kesinti yok, "diğer kesinti" | DOĞRULANAMADI: zirai rehber okunamadı | [2025 rehber](https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2F2025_zirai_kazanc.pdf) |
| `efatura` | Satır iskontosu, TEST işareti | Programdan beklenen davranış doğrulandı; sağlayıcı canlı denenmedi, **DOĞRULANAMADI** | `core` yerel deneme |
| Kooperatif yedek akçe | En az %10 (m.39) | DOĞRULANDI (ikincil: Bakanlık yayını ve Manisa İl Md. metni özeti; kanun PDF'i okunamadı) | [mevzuat 1163](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.1163.pdf), [Manisa](https://manisa.csb.gov.tr/1163-sayili-kooperatifler-kanunu-i-3496) |
| Kooperatif dağıtım | Muamele oranında (m.38) | DOĞRULANDI aynı kayıtla. **Ek bulgu:** ana sözleşmede aksi yoksa fark yedek akçeye eklenir; program dağıtımı varsayılan gösteriyor, önizleme ana sözleşmeye bağlıdır diyor | Aynı |
| ÇKS dönemi | 1 Eylül – 31 Aralık | Yıla bağlı; 2027 için [Karabük](https://karabuk.tarimorman.gov.tr/Sayfalar/Detay.aspx?OgeId=272&Liste=Duyuru) | DOĞRULANDI (yıl bazında) |
| ÇKS güncelleme | 15 Mart – 15 Nisan | **DOĞRULANAMADI**, [Muş](https://mus.tarimorman.gov.tr/Duyuru/357/2026-Uretim-Yili-Cks-Urun-Guncelleme-Basvurulari-Basliyor) ve [Kocaeli](https://kocaeli.tarimorman.gov.tr/Haber/607/2026-Yili-Uretim-Sezonu-Ciftci-Kayit-Sistemi-_cks_-Basvurulari-Basladi) çelişiyor; ekran metni düzeltildi | |
| Okul Servis Yönetmeliği belge listesi | 2017 metni | **DOĞRULANAMADI**. 2024 değişikliği şoför şartını değiştirdi (D/D1 süresi, yıllık aile hekimi raporu, UKOME isterse mesleki yeterlilik); psikoteknik ve eğitim bu metinde geçmiyor | [RG 29.11.2024](https://www.resmigazete.gov.tr/eskiler/2024/11/20241129-3.htm) |
| Kış lastiği | 15 Kasım başlangıç | DOĞRULANDI: 15 Kasım – 15 Nisan, valilik birer ay uzatabilir. Hususi araçta tavsiye | [Bakanlık, 05.10.2025](https://www.uab.gov.tr/haberler/zorunlu-kis-lastigi-uygulamasi-5-aya-cikti) |
| 6502 m.10, m.12 | 6 ay, 2 yıl | DOĞRULANDI | [6502](https://mevzuat.gov.tr/mevzuatmetin/1.5.6502.pdf) |
| 6502, 30 iş günü | Onarım süresi | DOĞRULANAMADI: bu oturumda metinde görülmedi | Aynı |
| Mesafeli Yön. m.15/1-b | Kişiye özel malda cayma yok | DOĞRULANDI | [Yönetmelik](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.20237.pdf) |
| `sms` Verimor | `POST /v2/send.json`, alanlar | DOĞRULANDI: kodla birebir | [Verimor](https://github.com/verimor/SMS-API/blob/master/user_guide.md) |
| `sms` Twilio | Messages.json, To/From/Body | Doküman okundu; kod bu oturumda karşılaştırılmadı, **DOĞRULANAMADI** | [Twilio](https://www.twilio.com/docs/messaging/api/message-resource) |
| `sms` Netgsm | REST v2 | **DOĞRULANAMADI**: resmî doküman bu oturumda açılmadı, SDK uç adresi vermiyor. Önceki rapor "kısmen" | [SDK](https://github.com/netgsm1/sms) |
| `sms` İleti Merkezi | `send-sms/json` | **DOĞRULANAMADI**: gönderim dokümanı bu oturumda okunmadı | [Bakiye](https://www.toplusmsapi.com/en/hesap/bakiye/json) |
| `whatsapp` | `wa.me` bağlantısı, personel gönderir | **DOĞRULANAMADI**: resmî sayfa içerik vermedi. Gönderim yapmadığı için "gönderildi" kaydı üretmiyor | [WhatsApp SSS](https://faq.whatsapp.com/5913398998672934) |
| `printer`, `backup` | Tarayıcı yazdırma, yedek | Resmî doküman gerekmeyen yerel işlev; yazdırma HTML'i üretildi, **fiziksel yazıcı denenmedi** | |
| Sahte başarı | TEST her yerde | DOĞRULANDI: SMS günlüğü, toplu sonuç, fatura no, e-Müstahsil rozeti TEST; kapalı SMS "gönderildi" demiyor | Tarayıcı |

## Kalan hatalar (çekirdek veya küçük)

| # | Yer | Hata |
|---|---|---|
| K1 | `core` `NS.crud` | `beforeSave` hata dönünce form kapanıyor, yazılan her şey gidiyor (güzergâh durakları dahil). Form açık kalmalı |
| K2 | `core` KPI | Milyonluk tutar 1280 px'te kart sınırını aşıyor (₺10.149.418,66) |
| K3 | `core` `chart.donut` | 1280 px'te ad ve değer birbirine değiyor; değer yuvarlandı, tam çözülmedi |
| K4 | Mobilya | Montaj rolü takvim yerine İşler'de açılıyor; satır zamanlaması yüzünden işlemiyor. Kendi işleri görünüyor |
| K5 | `core` 375 px | Liste başlığı iki düğmeyle daralıyor, arama kutusu küçülüyor; tablo yatay kaydırmalı, Bedel ve Ödenecek ilk bakışta görünmüyor (kantar). Kartlı görünüm önerilir |
| K6 | `core` 375 px | Dokunma hedefi: `btn sm icon` 30×42, sekme çipleri 27 px, grup başlığı 32 px |
| K7 | `core` | Açık tema soluk metin 2,9–3,0:1, `Ayarlar` ve `e-Belgeler`de başlıksız ikon düğmeler |
| K8 | `core` `notify` | Müşteri linkten onaylayınca panel bildirimi yok (`CEKIRDEK-ISTEKLERI` istek listesinde) |
| K9 | Çiftçi | Kantar makbuzunda TCKN boş çıkar (sunucu gizliyor). Makbuz düzenleyen rolün TCKN'yi görmesi gerekip gerekmediği karar ister |
| K10 | Lastik | İş emri iptal düğmesi yok, `iptal` durumu tanımlı ama ulaşılamıyor. Eksik özellik, eklenmedi |
| K11 | Mobilya | İptalde üretime giren malzeme stoğa dönmüyor (kesilmiş olabilir). Karar ister |
| K12 | Mobilya | İptal edilen işin kaporası ekstrede var, bakiyede yok |
| K13 | Lastik | Plakada telefonu kayıtlı müşteriyi girince ad uyarısız değişiyor |
| K14 | Okul | Veli iki çocukta mesajı hep ilk çocuğa yazıyor |
| K15 | Okul | Personel servisi güzergâhı Sefer ekranında yok, yoklama alınamaz |
| K16 | Mobilya | Her durum değişiminde SMS kapalıysa WhatsApp sorusu açılıyor, sık işte yorucu |
| K17 | Sunucu | `/api/team` sahibi `created` sıralamasıyla buluyor; aynı saniyede açılan ekip üyesi sahip sanılabiliyor. Testte görüldü, canlıda ihtimali düşük |

## Denenmeyenler

- Gerçek SMS, WhatsApp, e-Fatura, e-Müstahsil; gerçek hesap ve parola kullanılmadı.
- Gerçek imza çizimi: `NS.sign` testte taklit edildi, imza kaydı ve akış denendi, kanvas denenmedi.
- Yazdırma görünümü: üretilen HTML'in içeriği denetlendi, kâğıt düzeni ve QR okutma denenmedi.
- Masaüstü (Electron) ve Android kabuğu. Tarayıcıda 375 px emülasyon, gerçek telefon yok.
- Çevrimdışı kullanım, iki kişinin aynı anda yazması (`merge3`), PWA güncellemesi.
- Binlerce kayıt yalnız çiftçi alımlarında; diğer üç programda denenmedi.
- Çok uzun metin yalnız üretici adı ve köyde.
- Koyu ve açık tema 306 sayfada otomatik tarandı, bir kısmı gözle bakıldı.
- Rehber rolü ayrı denenmedi (şoförle aynı rol).
- Pilot işletme denemesi yok.

## Senden gerekenler

1. `okulservisi` ve `ciftci` şifreleme listesine girsin mi (engel 1)?
2. `emustahsil` `UNVERIFIED` listesine alınsın (engel 2); `fabrika` da etkilenir.
3. e-Fatura mükellefi kooperatife satış gerçek e-Müstahsil gelene kadar kapalı mı kalsın (engel 3)?
4. `rol-kural.js` için üç düzeltme onayı (engel 4).
5. SMS ve e-Fatura sağlayıcı test hesabı (engel 5).
