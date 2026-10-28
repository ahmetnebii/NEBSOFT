# Ön Muhasebe — Entegrasyon Doğrulama ve Canlıya Hazırlık Raporu

Tarih: 28.10.2026 (2. tur) · Kapsam: `apps/muhasebe/*` ve kullandığı ortak modüller (`core/integrations.js`, `core/ubltr.js`, `core/docs.js`, `core/core.js`, `sw.js`, `server/cloud/security.js`).

**Web erişimi: VAR.** Resmi kaynaklar bu oturumda indirildi/açıldı ve kodla karşılaştırıldı. Her bulgunun kaynağı aşağıda. Hafızadan gelen bilgi kullanılmadı; kullanıldığı yerde "(hafızadan, doğrulanmadı)" yazıyor.

İlke: **doğrulanan entegrasyonlar açık kaldı; doğrulanamayanlar canlıda seçilemez hale getirildi** (veriler ve kod silinmedi).

---

## 1. CANLIYA ÇIKMAYI ENGELLEYENLER (sizden gerekenler)

| # | Konu | Durum | Ne gerekli |
|---|---|---|---|
| B1 | Uyumsoft / Paraşüt ile **gerçek** gönderim | Kod resmi dokümana uygun, kayıtlı yanıtlarla test edildi; gerçek hesapla **denenmedi** | Entegratör **test ortamı hesabı** (Uyumsoft: test kullanıcı/şifre; Paraşüt: client_id/secret + test firması). 6.2'deki listeyi bu hesapla yürütün. |
| B2 | GİB Schematron (iş kuralları) doğrulaması | **DOĞRULANAMADI** — GİB paketinde ISO Schematron derleyicisi (iskelet XSLT) yok | Entegratör test ortamına belge göndermek (entegratör Schematron'u uygular) veya bir Schematron aracı. |
| B3 | Dövizli faturada kur türü ve tarihi | Teknik kısım doğrulandı; **hangi kurun** kullanılacağı mevzuat metninde yazmıyor (VUK md. 280 "borsa rayici" der) | Mali müşavir görüşü. Program artık kur türünü (alış/satış/efektif) ve bülten tarihini **seçtiriyor**; seçim kaydedilir. |
| B4 | e-İrsaliye, e-Defter, banka hareketleri, Logo/Mikro/… aktarımı | Kodda sağlayıcı adaptörü yok → **canlıda kapatıldı** (muhasebe menüsünde görünmez) | Hangi sağlayıcı/banka kullanılacak? Her biri için resmi API dokümanı + test hesabı. e-Defter için ayrıca karar: bu program yevmiye/kebir tutmuyor. |
| B5 | Mutlucell SMS | Resmi API dokümanı bulunamadı (mutlucell.com.tr/api sayfasında uç nokta yok; GitHub'da yalnızca üçüncü taraf paketler) → **canlıda seçilemez** | Mutlucell'den resmi API dokümanı (PDF) veya başka sağlayıcı. |
| B6 | Logo e-Dönüşüm, Sovos, Mysoft, EDM (e-Fatura) | Adaptör yok → **seçilemez** | Kullanılacaksa o firmanın resmi API dokümanı + test hesabı. |
| B7 | Gelen fatura alma ve kabul/red yanıtı (Uyumsoft/Paraşüt) | Bu sürümde yok; program bunu açıkça söylüyor, sahte veri üretmiyor | İstenirse sonraki iş: Uyumsoft `GetInboxInvoices` ile alma. |
| B8 | Bulut testi `server/test/cloud.test.js` | **Bu çalışmadan önce de** başarısız: lisans kaydı `'talep'` döndürüyor, test `'deneme'` bekliyor (`server/cloud/routes.js:394-397`) | Hangisi doğru — yeni lisans "talep" mi "deneme" mi başlamalı? Karar sizin. |

---

## 2. Bu turda yapılanlar

### 2.1 e-Fatura / e-Arşiv gönderim yolu (önceki raporun E1–E6 maddeleri)
- **E1 düzeltildi:** Muhasebe faturaları artık seçilen entegratöre gidiyor. e-Belge merkezi (`core/integrations.js` `send()`), Uyumsoft ve Paraşüt adaptörlerini (`I.sendDirect`) çağırıyor; entegratörün verdiği numara, ETTN, kimlik ve XML kayda yazılıyor.
- "Kuyruğa alındı" diye **başarılı gösterme kaldırıldı:** adres yoksa / adaptör yoksa belge `Hata` olur, nedeni yazılır.
- **Simülasyon** artık `Test — gönderilmedi` durumunda kalıyor; "GİB'e raporlandı" yazmıyor. Görünümde "TEST — resmî belge değildir" etiketi var. e-Defter ve aktarım simülasyonları kalıcı "yapıldı" kaydı bırakmıyor.
- **E4 düzeltildi:** Mükellef sorgusu yalnızca simülasyonda sahte kural kullanıyor; Uyumsoft'ta `IsEInvoiceUser` + `GetUserAliasses`, Paraşüt'te `e_invoice_inboxes?filter[vkn]`. Önbellek entegratöre göre ayrılıyor. Sorgu başarısızsa belge türü tahmin edilmiyor.
- **E5/E6 düzeltildi:** Durum sorgusu Uyumsoft `QueryOutboxInvoiceStatus` ile yapılıyor (durumlar WSDL'deki `InvoiceStatus` listesinden eşlendi). e-Arşiv iptali Uyumsoft `CancelEArchiveInvoice` ile. e-Fatura iptali programdan yapılamıyor; program bunu söylüyor ve yalnızca not düşüyor. Rastgele durum üretimi yalnızca simülasyonda.

### 2.2 UBL-TR XML (E2, E3)
- Geçersiz XML üreten eski e-Belge üreticisi kaldırıldı. Tüm belgeler `core/ubltr.js` ile üretiliyor.
- `core/ubltr.js`: adreste **ilçe ve il zorunlu** (GİB XSD'si), imza bloğu da dahil. Eksikse anlaşılır hata veriyor.
- Cari kartına ve işletme ayarlarına **İlçe / İl** alanları eklendi.
- **Yeni kalıcı test:** `server/test/ubltr-xsd.test.js` — 6 belge türü (ticari, temel, dövizli e-Arşiv, iade, %0 istisna, gömülü XSLT) **GİB UBL-TR 1.2.1 XSD'sinden geçiyor.** GİB'in kendi örneği de aynı doğrulamadan geçiyor (doğrulayıcının kanıtı). `npm test` içinde. .NET SDK gerektirir; yoksa açıkça "ATLANDI" yazar.

### 2.3 e-Fatura görünümü ve tasarımı (sorduğunuz "basit fatura ekranı")
- **Eskiden:** e-Belge "Görüntüle" programın kendi basit HTML'ini açıyordu, resmî görünüm değildi.
- **Şimdi:** GİB'in resmî şablonu (`general.xslt`, UBL-TR 1.2.1 paketi → `core/ebelge/general.xslt`) ile **resmî e-Fatura / e-Arşiv görünümü** açılıyor: GİB logosu, karekod, senaryo ve tip tablosu. Gelen faturada belgeye gömülü şablon varsa o kullanılıyor. Görünüm yalıtılmış çerçevede açılıyor, yani gelen belgelerin şablonu programa erişemiyor.
- **Yeni sekme e-Belgeler > Fatura görünümü:**
  - GİB şablonu + **logonuz** (PNG/JPG, en fazla 150 KB), ya da kendi **.xslt** dosyanız
  - canlı önizleme ve deneme yazdırma
  - "faturaya göm" seçeneği: alıcı faturayı bu tasarımla görür. GİB örneklerindeki gibi `AdditionalDocumentReference` / `DocumentType XSLT` / Base64 olarak gömülüyor.
- **Kritik bulgu (resmi kaynak):** Tarayıcıların yerleşik XSLT'si kaldırılıyor. `chromestatus.com/feature/4709671889534976`: "From Chrome 158, XSLT will stop functioning on Stable releases". Chrome 158'in erken kararlı sürüm tarihi **04.11.2026** (chromiumdash takvimi). Bu yüzden dönüşüm Chrome ekibinin resmi **xslt-polyfill 1.0.31** kütüphanesiyle (BSD-3, libxslt/WASM) yapılıyor. Kütüphane npm bütünlük özetiyle doğrulandı ve projeye gömüldü (`core/vendor/xslt-polyfill-1.0.31/`), internet gerekmiyor. Bunun için CSP'ye yalnızca WebAssembly'ye izin veren `'wasm-unsafe-eval'` eklendi (`server/cloud/security.js`). JavaScript `eval`'i hâlâ kapalı.
- Basit önizleme yalnızca resmî görünüm üretilemezse, "resmî değildir" uyarısıyla gösteriliyor.

### 2.4 Yazdırma şablonları ve özelleştirme
- Muhasebedeki fatura, sipariş ve teklif yazdırması mevcut **Belge şablonları** tasarımcısına bağlandı. Kullanıcı şunları ayarlayabiliyor:
  - kâğıt boyu (A4 / A5 / 80 mm / 58 mm)
  - logo ve renk
  - bölüm aç/kapa ve sırası
  - metinler
- Dövizli belgeler kendi para birimiyle yazılıyor.
- Belge türüne özel varsayılanlar eklendi (faturada "garanti" metni yok).

### 2.5 Modül / menü gizleme
- **Ayarlar > Menü ve modüller:** kullanılmayan bölümler tek tıkla gizlenir, veri silinmez. Ana sayfa ve Ayarlar gizlenemez. Gizli bölüme adresle gidilirse nasıl açılacağı yazılır. Bu özellik tüm NEBSOFT programlarında çalışır.

### 2.6 Diğer
- **TCMB kurları:** kur türü seçimi ve geçmiş tarihli bülten (`kurlar/YYYYAA/GGAAYYYY.xml`, denendi). Tatil ve hafta sonu için anlaşılır mesaj var, birim (Unit) hesaba katılıyor.
- **Servis çalışanı:** önbellek sürümü `nebsoft-v3-17` oldu, kullanıcılar güncellemeyi alacak. `.xslt` dosyaları çevrimdışı için önbelleğe alınıyor.

---

## 3. Entegrasyon durumu (muhasebe programı)

| Entegrasyon | Etiket | Kaynak (28.10.2026) | Not |
|---|---|---|---|
| e-Fatura/e-Arşiv — Uyumsoft | **DOĞRULANDI** (istek yapısı) | `efatura-test.uyumsoft.com.tr/Services/Integration?wsdl` + `?xsd=xsd0…8` | SOAPAction'lar, `InvoiceInfo` sırası, `InternetSalesInfo`, `CancelEArchiveInvoice`, `InvoiceStatus` listesi XSD ile aynı. Kayıtlı yanıtlarla uçtan uca denendi. Sahte kullanıcıyla gerçek test sunucusu "yetkiniz yok" döndürdü ve program bunu hata olarak gösterdi. **Gerçek hesapla denenmedi (B1).** |
| e-Fatura/e-Arşiv — Paraşüt v4 | **DOĞRULANDI** (uç noktalar) | `apidocs.parasut.com/swagger.json` (4.0.0) | `oauth/token` password grant, contacts, sales_invoices, e_invoice_inboxes, e_invoices (scenario/to), e_archives (internet_sale/shipment), e_smms, trackable_jobs (running/done/error). **Gerçek hesapla denenmedi (B1).** |
| UBL-TR XML | **DOĞRULANDI** (XSD) · Schematron **DOĞRULANAMADI** | `ebelge.gib.gov.tr/dosyalar/kilavuzlar/UBL-TR1.2.1_Paketi.zip` | Otomatik test: `server/test/ubltr-xsd.test.js` (B2). |
| e-Fatura görünümü (XSLT) | **DOĞRULANDI** | GİB `general.xslt` (UBL-TR 1.2.1 paketi) + xslt-polyfill 1.0.31 (npm, bütünlük doğrulandı) | Tarayıcıda denendi. libxslt "xsl:version: only 1.1 features are supported" uyarısı veriyor (şablon version="2.0"); şablonda 2.0'a özgü XSLT işlevi yok, çıktı eksiksiz. |
| Netgsm SMS | **UYUMSUZDU → düzeltildi, DOĞRULANDI** | `netgsm.com.tr/dokuman` (sürüm notu 1.8, 19.04.2022: "SMS gönderimlerinde HTTP GET metodu desteklenmemektedir") | Artık `POST /sms/rest/v2/send`, HTTP Basic, numara `5xxxxxxxxx`, başarı `{"code":"00"}`, İYS filtresi (`iysfilter` 0/11/12) ayardan. |
| İleti Merkezi SMS | **DOĞRULANDI**, 2 düzeltme | `toplusmsapi.com/sms/gonder/json` | Numara biçimi `505xxxxxxx`'e çevrildi. `iys` sabit "1" (ticari) gidiyordu; artık ayardan (bilgilendirme / ticari bireysel / ticari tacir). |
| Verimor SMS | **DOĞRULANDI** | `github.com/verimor/SMS-API/blob/master/user_guide.md` | — |
| Twilio SMS | **DOĞRULANDI** | `twilio.com/docs/messaging/api/message-resource` | — |
| Mutlucell SMS | **DOĞRULANAMADI → kapatıldı** | Resmi doküman bulunamadı | B5 |
| WhatsApp Cloud API | **DOĞRULANDI** | Meta: text-messages, templates/overview, graph-api/changelog/versions | Metin ve şablon (positional parametre) gövdesi aynı. v23.0'ın bitiş tarihi 08.10.2027. Şablon dil kodu artık ayarlanabiliyor (önceden sabit "tr"). |
| EmailJS | **DOĞRULANDI** | `emailjs.com/docs/rest-api/send/` | — |
| TCMB kurları | Teknik **DOĞRULANDI**, kur seçimi **DOĞRULANAMADI** | `tcmb.gov.tr/kurlar/today.xml`, `…/202610/27102026.xml`; VUK 213 (mevzuat.gov.tr) md. 280 | B3 |
| e-İrsaliye / e-Defter / banka / muhasebe aktarımı | **DOĞRULANAMADI → kapatıldı** | Uyumsoft WSDL'inde ve Paraşüt swagger'ında irsaliye yok; diğerlerinde adaptör yok | B4. Muhasebe aktarımı CSV indirme ile çalışmaya devam ediyor. |
| Logo/Sovos/Mysoft/EDM e-Fatura | **DOĞRULANAMADI → seçilemez** | Adaptör yok | B6 |
| e-Arşiv raporu (GİB) | Kapsam dışı | e-Arşiv Teknik Kılavuzu v1.19 | Raporu özel entegratör hazırlar. Programın gönderdiği `DeliveryType` (Electronic) kılavuzdaki `gonderimSekli` alanına karşılık gelir. |

---

## 4. Testler

| Test | Sonuç |
|---|---|
| `kanal.test.js`, `proto.test.js`, `takvim.test.js` | Geçti (12 + 12 + 5) |
| `ubltr.test.js` | Geçti (12). Yeni: adres zorunluluğu, XSLT gömme, Uyumsoft iptal zarfı ve durum eşlemesi. |
| `ubltr-xsd.test.js` (yeni) | Geçti. 7 belge GİB XSD'sine uygun. Hatalı XML'de başarısız olduğu ayrıca denendi. |
| `cloud.test.js` | **Başarısız**, bu çalışmadan bağımsız (B8). Güvenlik başlıkları testi geçiyor. |
| Tarayıcı (yerel sunucu, demo veri) | Simülasyonda gönderim "Test" olarak kalıyor. GİB görünümü açılıyor. Uyumsoft akışı (sorgu → gönder → durum → iptal) kayıtlı yanıtlarla çalışıyor. Logo seçilince açık hata veriyor. Tasarım sekmesi ve logo, menü gizleme, belge şablonu çalışıyor. Pos, fabrika, otoservis, e-ticaret, hukuk, klinik ve adisyon programları hatasız açılıyor. |

---

## 5. Kodda olmayan, değerlendirilmesi gerekenler (eklenmedi)
e-SMM / e-Müstahsil (muhasebede), KEP, e-Dekont, açık bankacılık / MT940 ekstre içe aktarma, sanal POS / ödeme linki, ÖKC, GİB vergi levhası sorgusu, Uyumsoft'tan gelen fatura alma ve uygulama yanıtı, e-İrsaliye için UBL DespatchAdvice üretimi (GİB `irsaliye.xslt` pakette mevcut), %0 KDV satırları için istisna kodu seçimi (şu an istisna kodu girilmeyen %0 satırda entegratöre gönderim açık hatayla durur).

---

## 6. Test stratejisi

### 6.1 Canlı olmadan
- `npm test` (XSD testi dahil). Her değişiklikte çalıştırın.
- Uyumsoft için kayıtlı yanıtlarla akış testi (bu turda tarayıcıda yapıldı). Kalıcı test olarak `server/test` altına alınabilir.

### 6.2 Canlı öncesi manuel test listesi (entegratör test hesabıyla)

| # | Adım | Hesap | Beklenen |
|---|---|---|---|
| 1 | Entegrasyonlar > e-Fatura > Uyumsoft, "Test ortamı" açık, sihirbazı tamamlayın, "Test" düğmesi | Uyumsoft test | Bağlantı başarılı |
| 2 | Cari kartında VKN + ilçe + il dolu, e-Fatura mükellefi alıcıya fatura → e-Fatura gönder | Uyumsoft test | Durum "Gönderildi"; numara/ETTN Uyumsoft panelindekiyle aynı |
| 3 | TCKN'li alıcıya → e-Arşiv | Uyumsoft test | e-Arşiv olarak gider |
| 4 | Dövizli (USD) fatura | Uyumsoft test | Kabul; TL karşılığı doğru |
| 5 | İlçe/il boş cariye gönder | — | "Alıcı adresinde ilçe ve il zorunludur" hatası; fatura gönderilmiş sayılmaz |
| 6 | e-Belgeler > Durum sorgula | Uyumsoft test | Paneldeki durumla aynı |
| 7 | e-Arşiv iptal | Uyumsoft test | Panelde iptal görünür |
| 8 | Fatura görünümü: logo yükle, "faturaya göm" açık, gönder | Uyumsoft test | Alıcı tarafında (Uyumsoft görüntüleyici) logolu görünüm |
| 9 | 2–7'yi Paraşüt ile | Paraşüt test firması | Paraşüt'te resmileşmiş belge |
| 10 | Netgsm / İleti Merkezi / Verimor: kendi numaraya 1 SMS ("Bilgilendirme" türü) | Sağlayıcı hesabı (ücretli) | SMS ulaşır; yanlış şifrede anlaşılır hata |
| 11 | WhatsApp Cloud API şablonlu mesaj | Meta test numarası | Mesaj ulaşır |
| 12 | Kurlar: geçmiş tarih + "Döviz alış" | yerel `node server.js` | TCMB bülteniyle aynı değer |
| 13 | Chrome 158 (04.11.2026 sonrası) veya `chrome://flags/#xslt` kapalıyken e-Belge görüntüle | — | Resmî görünüm yine açılır (polyfill) |
| 14 | Masaüstü (Electron) ve Android sürümünde e-Belge görüntüle | — | Aynı (WASM CSP'si dahil) |

---

## 7. Güvenlik notu
`data/` dizininde `secret.key`, `android-release.jks`, `android-keystore.txt`, `setup-token.txt`, `webhook-token.txt` duruyor. `.gitignore` bunları dışlıyor, ama klasörü paylaşırken veya sunucuya kopyalarken bu dizinin dışarıda kaldığından emin olun.
