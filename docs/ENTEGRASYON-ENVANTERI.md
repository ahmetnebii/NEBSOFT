# NEBSOFT entegrasyon envanteri

Tarih: 31.10.2026. Dal: `claude/sunucu-tanimlari-cffcb8`. Tablo kod ve okuma notlarından üretildi: `core/integ-guides*.js`, `server/cloud/entegrasyon/`.

Hiçbir sağlayıcıya gerçek hesapla istek atılmadı, gerçek ileti gönderilmedi, para çekilmedi. Testler sahte sunucuyla dokümana uyumu gösterir, gerçek çalışmayı kanıtlamaz.

## CANLIYA ÇIKMAYI ENGELLEYENLER

**Karar bekleyenler**

1. **Canlı ödeme kilidi.** `IYZICO_CANLI` ve panel kilidi (`/admin/#/kurulum`) açılmadı. `PAYTR_CANLI`, `PAPARA_CANLI`, `PAYNET_CANLI`, `CRAFTGATE_CANLI`, `STRIPE_CANLI` kilidi de var. Açılmadan gerçek kart çekilmez. Seçenek: ilk gerçek hesapta test modu geçince kilit sağlayıcı bazında açılır. Tümünü kaldırmak önerilmez.
2. **`CLAUDE.md` §1 metni.** Dosya değiştirilmedi, önerilen metin aşağıda.
3. **Yurtiçi Kargo düz http.** WSDL'deki adres `http://webservices.yurticikargo.com:8080`. Kullanıcı adı ve şifre şifresiz gider, https adresi yayımlanmamış. Rehberde yazılı. Yurtiçi'nden https adresi istenmeli, verilmezse seçenek kapatılmalı.
4. **Param.** `dev.param.com.tr` bu ağdan 403 verdi. Hash formülü, test adresi ve dönüş doğrulaması okunamadı. Kod yazılmadı, ekranda iletişim talebi çıkar. Dokümanı PDF olarak alabilirseniz yazılır.
5. **Pazarama ve Çiçeksepeti.** Doküman erişime kapalı. Satıcı panelindeki doküman gerekir.
6. **Stripe.** Dokümanı açık, ama `stripe.com/global` listesinde Türkiye yok. Türkiye'de kurulu işletme doğrudan hesap açamaz, TRY desteği doğrulanamadı. Ekranda "yurt dışı şirketi" diye yazar.

**Kod yazıldı, gerçek hesapla bakılacaklar**

7. **Online ödeme.** iyzico, PayTR, Papara, Paynet ve Craftgate e-ticaret vitrinine, kurs, spor ve site portalına, eğitim ödeme bağlantısına bağlandı. Moka ve Sipay yalnız Bağlantıyı dene: Moka dönüş imzasının algoritması, Sipay ödeme hash alanları dokümanda yok. PayTR'de işletme verilen Bildirim URL'sini panele yazmalı, yazmazsa sonuç durum sorgusuyla geç gelir. Paynet iadesi panelden yapılır, Craftgate iadesi yalnız tam tutar. Borç tahsilatında iade yalnız tam tutar ve program içinden yapılır; kısmi iade sağlayıcı panelinden yapılır ve programa elle işlenir. iyzico borç tahsilatında adres alanı işletme adresiyle, şehir "Türkiye" ile gider: gerçek test hesabında kabul edildiğine bakılmalı.
8. **Mevcut müşteriler.** Sunucu istemcisi olan bir sağlayıcıyı önceden kurmuş işletme, Bağlantıyı dene adımını bir kez yapana kadar SMS, WhatsApp, e-posta, Nilvera/Paraşüt faturası, webhook ve vitrin kart ödemesi kullanamaz, açık hata alır. Bu bilinçli: deneme geçmeden iş akışı çalışmaz.
9. **Uyumsoft.** Bu turda sunucuya taşınmadı. WSDL `BasicIntegration` kimliği gövdede `userInfo` ile ister, kod `Integration` ucu ve WS-Security kullanıyor. Test hesabıyla bakılmalı, deneme tarayıcı akışında kaldı.
10. **Dokümanda tam yazmayan noktalar.** Her dosyanın başında işaretli: PayTR dönüş adresinin çerçeveden çıkışı, Paynet tutar biçimi ve `xact_id`, Craftgate sonuç alan adları, İdefix `vendor` alanı, Paynet Basic biçimi, Yurtiçi `keyType`, Trendyol Go Base64 yazımı, DHL canlıda 404 varsayımı, Microsoft UTC saat dilimi, Google servis hesabı paylaşımı, Aras DataSet sütunları, Geliver şehir kodu (`cityCode` program kaydında yok).
11. **Webhook olayları.** Artık sunucudan imzalı gider, Bağlantıyı dene geçmeden gönderilmez ve kayda hata düşer. Önceden webhook kurmuş işletme bir kez denemeli.
12. **Pazaryeri programı.** `pazaryeri` ve `pos` programlarının kanal ayarları kendi `channels` grubunda durur, `/api/kanal` ile gider. Merkezdeki deneme durumu bu akışı kapatmaz.
13. **`bilet-kural.test.js` saate bağlı.** Bu işle ilgisi yok, ayrı oturum açılmış. Gecenin bazı saatlerinde düşer ve `npm test` zincirini durdurur.

## İlk gerçek müşteride izlenecekler

Sırayla, her sağlayıcı için bir kez:

1. Test ortamı varsa önce onunla Bağlantıyı dene. Yanıt ekrandaki mesajla uyuşmalı.
2. Yanlış şifreyle dene: sade Türkçe hata çıkmalı, durum Bağlantı hatası olmalı.
3. Kendi numaraya tek SMS, kendi adrese tek e-posta. Sağlayıcı panelinde göründüğüne bakılmalı.
4. Ödemede test kartıyla tek işlem, sonra iade. Bildirim imzası ve tutar eşleşmesi kontrol edilmeli.
5. Sunucu çıkış IP'si: Verimor zorunlu, Sipay ve Paynet sabit IP ister. Bulut sunucunun IP'si müşteriye yazılı verilmeli.
6. Log'da anahtar olmadığına bakılmalı.
7. PayTR'de Bildirim URL yazılı mı, ödeme sonrası sipariş "Ödeme alındı" oldu mu, dönüşte sayfa çerçeveden çıktı mı bakılmalı.
8. Borç tahsilatında tek taksit öde: taksit kapanmalı, panelde Online ödemeler listesinde görünmeli, iade edince taksit yeniden açılmalı.

## Özet

- doküman kapalı, sözleşme gerekir: 137
- yazıldı: 33
- yazıldı (cihaz veya yerel): 31
- kaldı: 11
- yalnız Bağlantıyı dene: 5
- yazıldı (tarayıcı): 1

"Yazıldı" kod yazıldı demektir, canlı denendi demek değildir. "Doküman kapalı" satırlarının çoğu 27.10.2026 araştırmasına dayanır (resmî kurumlar, banka, cihaz, ÖKC). Yedek parça, ilaç deposu ve ÖKC bu turda yeniden araştırılmadı.

## Test sonucu (31.10.2026)

- `server/test/entegrasyon.test.js`: 57 test geçti. 35 sağlayıcı anahtarı için başarı, yetki hatası, zaman aşımı, bozuk yanıt, anahtar sızıntısı; ayrıca gönderim, imza, canlı kilit, parmak izi.
- `server/test/entegrasyon-bulut.test.js`: 12 test geçti (MariaDB + sahte Netgsm).
- `server/test/odeme-saglayici.test.js`: 20 kontrol geçti (MariaDB + sahte PayTR, Papara, Paynet, Craftgate): imza, tutar, TEST işareti, tekrar bildirim, iade, canlı kilit.
- `server/test/eticaret-odeme.test.js`: iyzico akışı yeni katmanda geçti.
- `server/test/tahsilat-odeme.test.js`: 29 kontrol geçti (MariaDB + sahte PayTR, Papara): sahiplik, sunucu tutarı, TEST borç kapatmaz, sahte imza, tekrar bildirim, çift ödeme, tutar uyuşmazlığı, tam iade, spor yenileme, site tazminatı, eğitim bağlantısı, kişisel bilgi ve anahtar sızıntısı. Süresi dolan ödemenin taraması bu testte denenmedi.
- Test dosyaları tek tek çalıştırıldı: 70 dosyanın 70'i geçti, atlanan yok.
- Tarayıcı: yerel sunucu 5131 + sahte Netgsm. SMS akışı baştan sona. E-ticarette Online ödeme kartı, sağlayıcı listesi, PayTR alanları. Sözleşme gerektiren sağlayıcıda iletişim talebi. Vitrin sayfası açıldı. Kart ödemesinin tarayıcıdan uçtan ucu denenmedi: bulut kipi gerekir, sunucu tarafı testle sınandı, PayTR çerçevesi tarayıcıda görülmedi. Kurs portalı ve eğitim bağlantısı yerel bulut kipinde ve sahte Papara ile baştan sona tarayıcıda denendi (telefon genişliği, koyu tema dahil). Site ve spor penceresi açıldı, tutarlar doğru, son ödeme adımı bu ikisinde yalnız sunucu testinde denendi. Konsoldaki 404 satırı `/favicon.ico`; deneme bölmesinde servis çalışanı kaydı da hata veriyor (`sw.js` 200 dönüyor, sözdizimi temiz), gerçek tarayıcıda bakılmalı.
- Bu sonuçlar dokümana uyumu gösterir, gerçek çalışmayı kanıtlamaz.

## Nasıl çalışır

- Tek akış: Entegre et → sağlayıcı → alanlar ve nereden alınacağı → Bağlantıyı dene → sonuç.
- Bağlantıyı dene sunucudan sağlayıcıya gerçek, zararsız istek atar: bakiye, hesap bilgisi, kimlik jetonu. Kargo SOAP servislerinde zararsız uç olmadığı için müşterinin verdiği gerçek gönderi numarası sorgulanır, başarı yalnız kayıt dönerse yazılır.
- Durum `entegrasyon_durum` tablosunda: Bağlı, hata, son deneme tarihi, test mi, bilgilerin HMAC parmak izi. Bilgi değişince iş akışı durur.
- Yerelde (veritabanı yok) parmak izi kurulum kaydında durur, sunucu doğrular.
- Yer tutucu yalnız aynı türün aynı alanından çözülür, başka grubun gizli değeri okunamaz.
- Yazma işlemleri yeniden denenmez. Hata başarı gibi dönmez, kuyruğa alındı denmez.
- Zararsız ucu olmayan sağlayıcı için `deneme: 'ilk-islem'` kipi hazır: başarı ilk gerçek işlemden yazılır. Şu an bu kipi kullanan sağlayıcı yok.

## `CLAUDE.md` §1 için önerilen metin

> **Kabul:** Müşteri kendi hesabıyla bağlanır, geliştirmede gerçek hesap yoktur. Resmî dokümanı açık olan entegrasyon sunucu istemcisiyle yazılır ve ekranda "Entegre et" olarak görünür, doğrulama etiketi gösterilmez. Dokümanı kapalı olan yazılmaz, ekranda iletişim talebi çıkar, envantere "doküman kapalı, sözleşme gerekir" yazılır. "Bağlı" yalnız müşterinin anahtarıyla yapılan gerçek denemeden yazılır, deneme geçmeden iş akışı çalışmaz. Dokümanla uyum canlı test değildir: ilk gerçek müşteride `docs/ENTEGRASYON-ENVANTERI.md` listesi izlenir ve raporda yazılır. Gerçek para çeken işlem sağlayıcı bazlı sunucu kilidi (`<SAGLAYICI>_CANLI=1`) açılmadan yapılmaz.

## Pazarlama dili

Site ve kılavuzda: "Entegrasyon desteklenir, kendi hesabınızla bağlarsınız." "Kesin çalışır" ve "garantili" yazılmaz, sıralama veya başarı iddiası yok. Site metni bu dalda değiştirilmedi, `kilavuz-altyapi` oturumu `core/`da yardım bağlantısı ekliyor. Çakışma beklenen dosyalar: `core/integ-wizard.js`, `core/integ-guides*.js`. Sihirbazın adım sayısı 6'dan 3'e indi, yardım bağlantısı adım numarasına bağlıysa elle birleştirilmeli.

## Tam liste

| Tür | Sağlayıcı | Programlar | Durum | Not | Doküman |
|---|---|---|---|---|---|
| anpr | Dahua ITC | oto | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Dahua ITC  | - |
| anpr | Hikvision ANPR | oto | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Hikvision  | partner.hikvision.com/TrafficViolationDetection |
| anpr | Nedap ANPR | oto | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Nedap ANPR | - |
| anpr | Röle kartı (HTTP) | oto | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. HTTP ile k | - |
| aracbildirim | Emniyet kiralık araç bildirimi | kiralama | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| banka | Akbank | site, fabrika | kaldı | Portalda yalnız kur, faiz ve ödeme planı var, hesap hareketi yok | apiportal.akbank.com |
| banka | Garanti BBVA | site, fabrika | kaldı | API Store var, portal bu ağdan açılmadı | garantibbva.com.tr/isim-icin/dijital-bankacilik/garanti-bbva-api-store |
| banka | İş Bankası | site, fabrika | doküman kapalı, sözleşme gerekir | Portal okunamadı | developer.isbank.com.tr |
| banka | QNB | site, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Banka hesa | - |
| banka | VakıfBank | site, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Banka hesa | - |
| banka | Yapı Kredi | site, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Banka hesa | - |
| banka | Ziraat Bankası | site, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Banka hesa | - |
| bankamaas | Akbank | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| bankamaas | Garanti BBVA | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| bankamaas | İş Bankası | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| bankamaas | VakıfBank | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| bankamaas | Yapı Kredi | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| bankamaas | Ziraat Bankası | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Toplu maaş | - |
| barcode | USB / Bluetooth barkod okuyucu | butik, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| callerid | Cidshow USB cihaz | usta, adisyon, crm, servis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. USB Caller | - |
| callerid | Netgsm Bulut Santral | usta, adisyon, crm, servis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Netgsm Bul | - |
| callerid | Sanal santral (webhook) | usta, adisyon, crm, servis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Sanal sant | - |
| callerid | Verimor Santral | usta, adisyon, crm, servis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Verimor Sa | - |
| ebordro | EDM e-Bordro | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. e-Bordro g | - |
| ebordro | KEP ile gönderim | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Kayıtlı El | - |
| eczadeposu | Alliance Healthcare | eczane | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Alliance H | - |
| eczadeposu | Farmazon | eczane | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Farmazon s | - |
| eczadeposu | Hedef Ecza | eczane | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Hedef Ecza | - |
| eczadeposu | Nevzat Ecza | eczane | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Nevzat Ecz | - |
| eczadeposu | Selçuk Ecza | eczane | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Selçuk Ecz | - |
| edefter | EDM | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. EDM üzerin | - |
| edefter | Logo e-Dönüşüm | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Logo e-Dön | - |
| edefter | Mysoft | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Mysoft üze | - |
| edefter | Paraşüt | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Paraşüt üz | apidocs.parasut.com/ |
| edefter | Sovos | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Sovos üzer | - |
| edefter | Uyumsoft | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Uyumsoft ü | - |
| efatura | EDM Bilişim | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | kaldı | WSDL açık, kılavuz yok; SendInvoice içerik öğesi okunamadı | portal2.edmbilisim.com.tr/EFaturaEDM/EFaturaEDM.svc?wsdl |
| efatura | Logo e-Dönüşüm | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | doküman kapalı, sözleşme gerekir | docs.logo.com.tr bu ağdan açılmadı | docs.logo.com.tr |
| efatura | Mysoft | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | doküman kapalı, sözleşme gerekir | Açık doküman yok | - |
| efatura | Nilvera | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | yalnız Bağlantıyı dene | Deneme sunucuda. Fatura NS.ebelge ile gider | developer.nilvera.com/ |
| efatura | Paraşüt | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | yalnız Bağlantıyı dene | Deneme sunucuda. Fatura NS.ebelge ile gider | apidocs.parasut.com/ |
| efatura | Sovos (Foriba) | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | doküman kapalı, sözleşme gerekir | Portal var, gönderim dokümanı okunamadı | api.fitbulut.com/servis/ |
| efatura | Uyumsoft | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | yazıldı (tarayıcı) | Tarayıcıda SOAP, /api/istek ile. WSDL BasicIntegration gövdede userInfo yazıyor, kod Integration/WS-Security kullanıyor: test hesabıyla bakılacak | efatura.uyumsoft.com.tr/Services/Integration?wsdl |
| eirsaliye | EDM | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. EDM üzerin | - |
| eirsaliye | Logo e-Dönüşüm | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Logo e-Dön | - |
| eirsaliye | Mysoft | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Mysoft üze | - |
| eirsaliye | Paraşüt | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Paraşüt üz | apidocs.parasut.com/ |
| eirsaliye | Sovos | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Sovos üzer | - |
| eirsaliye | Uyumsoft | eticaret, fabrika, kargo | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Uyumsoft ü | - |
| email | Brevo | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı | Sunucu: gonder. Deneme: Hesap bilgisi okunur. E-posta gönderilmez. | developers.brevo.com/reference/sendtransacemail |
| email | Mailgun | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı | Sunucu: gonder. Deneme: Alan adı bilgisi okunur. E-posta gönderilmez. | documentation.mailgun.com/docs/mailgun/api-reference/mg-auth |
| email | E-posta istemcisini aç | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| email | Postmark | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı | Sunucu: gonder. Deneme: Sunucu bilgisi okunur. E-posta gönderilmez. | postmarkapp.com/developer/api/email-api |
| email | Resend | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı | Sunucu: gonder. Deneme: Alan adları okunur. E-posta gönderilmez. Yalnız gönderim yetkili anahtarda alan adı denetlenemez. | resend.com/docs/api-reference/introduction |
| email | SendGrid | dernek, egitim, danisan, nakliyat, temizlik, usta +4 | yazıldı | Sunucu: gonder. Deneme: Anahtarın izinleri okunur. E-posta gönderilmez. | www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send |
| emustahsil | EDM | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. EDM üzerin | - |
| emustahsil | Logo e-Dönüşüm | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Logo e-Dön | - |
| emustahsil | Mysoft | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Mysoft üze | - |
| emustahsil | Paraşüt | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Paraşüt üz | apidocs.parasut.com/ |
| emustahsil | Sovos | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Sovos üzer | - |
| emustahsil | Uyumsoft | ciftci, fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Uyumsoft ü | - |
| enabiz | Yetkili çözüm ortağı (USS) | klinik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Bakanlıkça | - |
| enabiz | Sağlık Bakanlığı USS / e-Nabız | klinik | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| erecete | MEDULA Hastane | klinik | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | www.saglikaktuel.com/d/file/sagliktesisireceteveraporwebservisleri.20210730151145.pdf |
| erecete | Sağlık Bakanlığı e-Reçete | klinik | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | www.saglikaktuel.com/d/file/sagliktesisireceteveraporwebservisleri.20210730151145.pdf |
| esmm | EDM | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. EDM üzerin | - |
| esmm | Logo e-Dönüşüm | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Logo e-Dön | - |
| esmm | Mysoft | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Mysoft üze | - |
| esmm | Paraşüt | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Paraşüt üz | apidocs.parasut.com/ |
| esmm | Sovos | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Sovos üzer | - |
| esmm | Uyumsoft | klinik, veteriner, randevu, kurs | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Uyumsoft ü | - |
| googleisletme | Google İşletme Profili | randevu | doküman kapalı, sözleşme gerekir | API açık ama onaylı erişim ister | developers.google.com/my-business/content/prereqs |
| googleisletme | Instagram “Randevu al” | randevu | doküman kapalı, sözleşme gerekir | Instagram profilinize online randevu sayfanızın bağlantısını elle ekleyebilirsiniz; NEBSOFT’ta Instagram API b | - |
| gps | Arvento | kargo, kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Arvento ar | - |
| gps | GZC | kargo, kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. GZC araç t | - |
| gps | Mobiliz | kargo, kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Mobiliz ar | - |
| gps | Trio Mobil | kargo, kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Trio Mobil | - |
| hgs | Banka OGS | kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. OGS geçiş  | - |
| hgs | PTT HGS | kiralama | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. HGS geçiş  | - |
| ilan | Emlakjet | emlak, galeri | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Açık bir i | - |
| ilan | Hepsiemlak | emlak, galeri | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Açık bir i | - |
| ilan | sahibinden.com | emlak, galeri | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Kurumsal i | - |
| its | TİTCK İTS | eczane | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | titck.gov.tr/storage/announcement/HfaB2tiC.pdf |
| kanal | Airbnb | otel | doküman kapalı, sözleşme gerekir | Onaylı iş ortağı | - |
| kanal | Booking.com (Connectivity) | otel | doküman kapalı, sözleşme gerekir | Connectivity Partner şartı | developers.booking.com/connectivity/docs |
| kanal | Expedia | otel | doküman kapalı, sözleşme gerekir | Lisans sözleşmesi, tekil tesis kabul edilmiyor | developers.expediagroup.com/supply/lodging |
| kanal | HotelRunner | otel | yazıldı | Sunucu: rezervasyon-cek, musaitlik-fiyat. Deneme: Oda tipleri okunur (salt okuma). Günlük 250 istek sınırı vardır. | developers.hotelrunner.com |
| kanal | SiteMinder | otel | doküman kapalı, sözleşme gerekir | İmzalı iş ortaklığı | developer.siteminder.com |
| kantar | Elle giriş | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| kantar | Seri port (RS-232 / USB) | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| kantar | Ağ indikatörü (TCP) | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| kapikilit | Onity | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Onity kart | - |
| kapikilit | Orbita | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Orbita kar | - |
| kapikilit | Salto | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Salto kart | - |
| kapikilit | Assa Abloy VingCard | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Assa Abloy | - |
| kargofirma | Aras Kargo | eticaret, kargo | yazıldı | Sunucu: durum-sorgu. Deneme: Girdiğiniz gerçek gönderi numarası sorgulanır. Gönderi oluşturulmaz. Başarı, kayıt dönerse yazılır. | customerws.araskargo.com.tr/arascargoservice.asmx?wsdl |
| kargofirma | DHL Express | eticaret, kargo | yazıldı | Sunucu: durum-sorgu. Deneme: Takip servisi kimlik bilgilerinizle sorgulanır. Gönderi oluşturulmaz. | developer.dhl.com/api-reference/dhl-express-mydhl-api |
| kargofirma | Geliver | eticaret, kargo | yazıldı | Sunucu: gonderi-olustur, durum-sorgu, iptal. Deneme: Adres listesi okunur. Gönderi oluşturulmaz. | docs.geliver.io/llms-full.txt |
| kargofirma | HepsiJet | eticaret, kargo | doküman kapalı, sözleşme gerekir | Geliştirici sayfası yok | hepsijet.com |
| kargofirma | Kolay Gelsin | eticaret, kargo | doküman kapalı, sözleşme gerekir | Geliştirici sayfası yok | kolaygelsin.com/support |
| kargofirma | MNG / DHL eCommerce | eticaret, kargo | doküman kapalı, sözleşme gerekir | apizone.mngkargo.com.tr bağlantı reddetti; 0212 366 55 55 | dhlecommerce.com.tr |
| kargofirma | PTT Kargo | eticaret, kargo | yazıldı | Sunucu: durum-sorgu. Deneme: Girdiğiniz gerçek gönderi numarası sorgulanır. Gönderi oluşturulmaz. Başarı, kayıt dönerse yazılır. | pttws.ptt.gov.tr/GonderiTakipV2/services/Sorgu?wsdl |
| kargofirma | Sürat Kargo | eticaret, kargo | kaldı | WSDL açık ama yanıt biçimi yazmıyor, başarı ölçütü yok. Takip sayfası çalışır | webservices.suratkargo.com.tr/services.asmx?wsdl |
| kargofirma | UPS | eticaret, kargo | yazıldı | Sunucu: durum-sorgu, iptal. Deneme: Erişim jetonu alınır. Gönderi oluşturulmaz. | github.com/UPS-API/api-documentation |
| kargofirma | Yurtiçi Kargo | eticaret, kargo | yazıldı | Sunucu: durum-sorgu, gonderi-olustur, iptal. Deneme: Girdiğiniz gerçek gönderi numarası sorgulanır. Gönderi oluşturulmaz. Başarı, kayıt dönerse yazılır. | webservices.yurticikargo.com:8080/KOPSWebServices/ShippingOrderDispatcherServices?wsdl |
| kbs | Bulut KBS hizmeti | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Bir bulut  | - |
| kbs | Emniyet KBS (GİYKİMBİL) | otel | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | www.jandarma.gov.tr/kurumlar/jandarma.gov.tr/Jandarma/Uygulamalar/KBS/KBS_Tesis_2_Uygulama_TD.pdf |
| kbs | Jandarma KBS | otel | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | www.jandarma.gov.tr/kurumlar/jandarma.gov.tr/Jandarma/Uygulamalar/KBS/KBS_Tesis_2_Uygulama_TD.pdf |
| kps | MERNİS kimlik doğrulama | klinik, kiralama, spor, emlak, bilet | doküman kapalı, sözleşme gerekir | NVİ’nin herkese açık TC kimlik doğrulama servisi (KPSPublic) bu araştırmada bu ağdan hata sayfası döndürdü; bu | - |
| kps | NVİ KPS | klinik, kiralama, spor, emlak, bilet | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| label | Tarayıcı yazdırma | butik, fabrika, pazaryeri, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| label | TSC / Argox TSPL ağ etiket yazıcısı | butik, fabrika, pazaryeri, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| label | Zebra ZPL ağ etiket yazıcısı | butik, fabrika, pazaryeri, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| meb | e-Yaygın | kurs | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| meb | MEBBİS | kurs | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| medula | SGK MEDULA | eczane | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | www.saglikaktuel.com/d/file/sagliktesisireceteveraporwebservisleri.20210730151145.pdf |
| muhasebeaktar | ETA | pos, adisyon, servis, otel, site, oto +1 | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. ETA progra | - |
| muhasebeaktar | Logo | pos, adisyon, servis, otel, site, oto +1 | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Logo progr | docs.logo.com.tr |
| muhasebeaktar | Luca | pos, adisyon, servis, otel, site, oto +1 | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Luca progr | - |
| muhasebeaktar | Mikro | pos, adisyon, servis, otel, site, oto +1 | kaldı | Doküman açık, müşteri sunucusunda Mikro Desktop API ve başvuru gerekir | apidocs.mikro.com.tr |
| muhasebeaktar | Netsis | pos, adisyon, servis, otel, site, oto +1 | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Netsis pro | - |
| muhasebeaktar | Zirve | pos, adisyon, servis, otel, site, oto +1 | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Zirve prog | - |
| okc | Beko 300TR / 400TR | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | Hugin | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | Ingenico (GMP3) | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | Pavo | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | PayGo Android ÖKC | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | Profilo | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| okc | Verifone (ÖKC) | adisyon, oto, pos, eczane | doküman kapalı, sözleşme gerekir | Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyon | - |
| onlineders | Google Meet | kurs | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | support.google.com/meet/answer/9302870 |
| onlineders | Microsoft Teams | kurs | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | support.microsoft.com/office/schedule-a-meeting-in-microsoft-teams-943507a9-8583-4c58-b5d2-8ec8265e04e5 |
| onlineders | Zoom | kurs | yazıldı | Sunucu: toplanti-olustur. Deneme: API bilgileri girildiyse Zoom’dan gerçek erişim jetonu alınır (toplantı açılmaz); yalnızca bağlantı girildiyse bağlantının biçimi kontrol edilir. | developers.zoom.us/docs/internal-apps/s2s-oauth/ |
| parca | Başbuğ | otoservis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Başbuğ içi | - |
| parca | Bosch Car Service | otoservis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Bosch Car  | - |
| parca | Dinamik Oto | otoservis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Dinamik Ot | - |
| parca | Martaş | otoservis | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Martaş içi | - |
| payment | Craftgate | egitim, eticaret, kurs, site, spor | yazıldı | Sunucu: odeme-baslat, odeme-sorgu, iade. Deneme: BIN sorgusu yapılır. Para çekilmez. | github.com/craftgate/craftgate-node-client |
| payment | iyzico | egitim, eticaret, kurs, site, spor | yalnız Bağlantıyı dene | Deneme sunucuda. Vitrin ödemesi yok | docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth |
| payment | Moka United | egitim, eticaret, kurs, site, spor | yalnız Bağlantıyı dene | Deneme sunucuda. Vitrin ödemesi yok | developer.mokaunited.com |
| payment | Papara | egitim, eticaret, kurs, site, spor | yazıldı | Sunucu: odeme-baslat, odeme-sorgu, iade. Deneme: Hesap bilgisi okunur. Para çekilmez. | merchant-api.papara.com |
| payment | Param | egitim, eticaret, kurs, site, spor | doküman kapalı, sözleşme gerekir | dev.param.com.tr WAF 403. Yalnız WSDL okundu; hash, test adresi, dönüş doğrulaması yok | dev.param.com.tr |
| payment | Paynet | egitim, eticaret, kurs, site, spor | yazıldı | Sunucu: odeme-baslat, odeme-sorgu. Deneme: Oran tablosu okunur. Para çekilmez. | doc.paynet.com.tr/authentication |
| payment | PayTR | egitim, eticaret, kurs, site, spor | yazıldı | Sunucu: odeme-baslat, odeme-sorgu, iade. Deneme: PayTR işlem dökümü örnek veriyle sorgulanır. Para çekilmez. Deneme geçince Bildirim URL adresiniz ekranda yazar. | dev.paytr.com/iframe-api/iframe-api-1-adim |
| payment | Sipay | egitim, eticaret, kurs, site, spor | yalnız Bağlantıyı dene | Deneme sunucuda. Vitrin ödemesi yok | apidocs.sipay.com.tr/getting-started-1699520m0.md |
| payment | Stripe | egitim, eticaret, kurs, site, spor | yazıldı | Sunucu: odeme-baslat, iade. Deneme: Bakiye okunur. Para çekilmez. | docs.stripe.com/api/balance/balance_retrieve |
| pazaryeri | Amazon TR | butik, eticaret, pos | yazıldı | Sunucu: siparis-cek. Deneme: Satıcı hesabının pazaryerleri okunur (salt okuma). | developer-docs.amazon/sp-api/docs/connecting-to-the-selling-partner-api |
| pazaryeri | Çiçeksepeti | butik, eticaret, pos | doküman kapalı, sözleşme gerekir | apis.ciceksepeti.com okunamadı | - |
| pazaryeri | Hepsiburada | butik, eticaret, pos | yazıldı | Sunucu: siparis-cek, stok-fiyat, batch-durum. Deneme: Listeleme servisinden 1 kayıt istenir (salt okuma). | developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&product=api-authentication&version=v1.0&guide=entegratore-servis-anahtari-eklemegoruntuleme&view=guide |
| pazaryeri | İdefix | butik, eticaret, pos | yazıldı | Sunucu: siparis-cek, stok-fiyat, stok-guncelle. Deneme: Sipariş listesi istenir (salt okuma). | developer.idefix.com/authorization |
| pazaryeri | n11 | butik, eticaret, pos | yazıldı | Sunucu: siparis-cek, stok-fiyat, batch-durum. Deneme: Ürün listesinden 1 kayıt istenir (salt okuma). | magazadestek.n11.com/satis-surecleri/api-hesaplarina-nereden-ulasilir-2285 |
| pazaryeri | Pazarama | butik, eticaret, pos | doküman kapalı, sözleşme gerekir | isortagimgiris.pazarama.com WAF engeli; kullanıcıdan panel dokümanı istenecek | isortagimgiris.pazarama.com |
| pazaryeri | Trendyol | butik, eticaret, pos | yazıldı | Sunucu: siparis-cek, stok-fiyat, batch-durum, urun-gonder, kargo-bildir, tedarik-edilemedi, soru-cek, soru-yanitla, hakedis-cek, iade-cek, kategori-cek. Deneme: Son 1 sipariş istenir (salt okuma). | developers.trendyol.com/v2.0/docs/authorization |
| pdks | Hikvision | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Hikvision  | partner.hikvision.com/TrafficViolationDetection |
| pdks | Meyer | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Meyer PDKS | - |
| pdks | Perkotek | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Perkotek P | - |
| pdks | ZKTeco | ik | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. ZKTeco PDK | - |
| petkayit | PETVET | veteriner | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| plc | Operatör girişi | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| plc | Modbus TCP | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf |
| plc | MQTT | fabrika | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html |
| plc | OPC-UA ağ geçidi | fabrika | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. OPC-UA ist | - |
| pos | Beko | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | Diğer marka | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | Hugin | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | Ingenico | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | Pavo | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | PayGo / Android POS | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| pos | Verifone | terzi, nakliyat, temizlik, usta, peyzaj, adisyon +7 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| printer | Tarayıcı yazdırma | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +16 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| printer | Ağ fiş yazıcısı (ESC/POS) | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +16 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| printer | USB / seri fiş yazıcısı (ESC/POS) | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +16 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| santral | Alcatel | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Alcatel sa | - |
| santral | Karel | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Karel sant | - |
| santral | Panasonic | otel | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Panasonic  | - |
| scale | Bizerba | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf |
| scale | CAS | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | cdn11.bigcommerce.com/s-novopaarpb/content/brochure/p/d/pd-2e_3.pdf |
| scale | Dibal | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf |
| scale | Diğer marka | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf |
| scale | DIGI | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf |
| scale | Mettler Toledo | fabrika, pos | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | b2b.wagnermunz.com/download/Mettler-Toledo GmbH/Reference_Manual_MT-SICS-XPR_EN.pdf |
| sgk | SGK e-Bildirge / işe giriş-çıkış | ik | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| sms | İleti Merkezi | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +34 | yazıldı | Sunucu: gonder. Deneme: Hesap bakiyesi okunur. İleti gönderilmez, kredi harcanmaz. Gönderici adı hesapta aranır. | www.toplusmsapi.com/sms/gonder/json |
| sms | Mutlucell | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +34 | yazıldı | Sunucu: gonder. Deneme: Hesap bakiyesi okunur. İleti gönderilmez, kredi harcanmaz. Başlık hesapta aranır. | www.mutlucell.com.tr/toplusmsapi/ |
| sms | Netgsm | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +34 | yazıldı | Sunucu: gonder. Deneme: Hesap bakiyesi okunur. İleti gönderilmez, kredi harcanmaz. Mesaj başlığı hesapta aranır. | www.netgsm.com.tr/dokuman/ |
| sms | Twilio | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +34 | yazıldı | Sunucu: gonder. Deneme: Hesap bakiyesi okunur. İleti gönderilmez, ücret oluşmaz. | www.twilio.com/docs/messaging/api/message-resource |
| sms | Verimor | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +34 | yazıldı | Sunucu: gonder. Deneme: Hesap bakiyesi okunur. İleti gönderilmez, kredi harcanmaz. Başlık hesapta aranır. | github.com/verimor/SMS-API/blob/master/user_guide.md |
| takvim | Google Takvim | crm, klinik, randevu, servis, veteriner, spor | yazıldı | Sunucu: etkinlik, etkinlik-ekle. Deneme: Takvim bilgisi okunur. Etkinlik eklenmez, davet gitmez. | developers.google.com/identity/protocols/oauth2/service-account |
| takvim | iCal takvim aboneliği | crm, klinik, randevu, servis, veteriner, spor | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | www.rfc-editor.org/rfc/rfc5545 |
| takvim | Outlook / Microsoft 365 | crm, klinik, randevu, servis, veteriner, spor | yazıldı | Sunucu: etkinlik, etkinlik-ekle. Deneme: Takvim bilgisi okunur. Etkinlik eklenmez, davet gitmez. | learn.microsoft.com/en-us/graph/api/user-post-events |
| tramer | TRAMER çözüm ortağı | - | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Yetkili bi | - |
| tramer | SBM TRAMER | - | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| turnike | Hikvision yüz tanıma | bilet, spor | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Hikvision  | partner.hikvision.com/TrafficViolationDetection |
| turnike | Perkotek | bilet, spor | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Perkotek c | - |
| turnike | QR turnike (HTTP) | bilet, spor | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. HTTP ile k | - |
| turnike | ZKTeco | bilet, spor | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. ZKTeco cih | - |
| uts | TİTCK ÜTS | eczane | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| vetbis | Tarım ve Orman Bakanlığı VETBİS | veteriner | doküman kapalı, sözleşme gerekir | Yakında: bu bağlantı için işletmenin anahtar alması yetmez; NEBSOFT’un yazılım firması olarak ilgili kuruma ba | - |
| webhook | Webhook | nakliyat, temizlik, usta, peyzaj, adisyon, eczane +4 | yazıldı | Sunucu: gonder. Deneme: Adresinize imzalı bir test olayı gönderilir. Başarı, adres 2xx dönerse yazılır. | - |
| whatsapp | WhatsApp Cloud API | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +24 | yazıldı | Sunucu: gonder. Deneme: Numara bilgisi okunur. Mesaj gönderilmez. | developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api |
| whatsapp | WhatsApp bağlantısı (wa.me) | cicekci, kurutemizleme, matbaa, pastane, terzi, dernek +24 | yazıldı (cihaz veya yerel) | Sunucu istemcisi gerekmez, yerel köprü veya tarayıcı | - |
| yemekkarti | Edenred (Ticket) | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Edenred (T | - |
| yemekkarti | Metropol | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Metropol k | - |
| yemekkarti | Multinet | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Multinet k | - |
| yemekkarti | Pluxee (Sodexo) | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Pluxee (So | - |
| yemekkarti | Setcard | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Setcard ka | - |
| yemekkarti | Token Flex | adisyon | doküman kapalı, sözleşme gerekir | NEBSOFT’ta bu sağlayıcı için doğrudan bağlantı kodu henüz yok; bu seçenekle hiçbir şey gönderilmez. Token Flex | - |
| yemekplatform | Getir Yemek | adisyon | doküman kapalı, sözleşme gerekir | GetirYemek başvuruları kapandı, Trendyol Go yolu kullanılır | developers.getir.com |
| yemekplatform | Migros Yemek | adisyon | doküman kapalı, sözleşme gerekir | Açık doküman yok | - |
| yemekplatform | Uber Eats Trendyol Go (Yemek) | adisyon | yazıldı | Sunucu: siparis-cek, kabul, fiyat. Deneme: Restoran listesi okunur (salt okuma). | developers.tgoapps.com/docs/authorization |
| yemekplatform | Yemeksepeti | adisyon | kaldı | Partner API yalnız market; spesifikasyon foodpanda adresi, Yemeksepeti canlı adresi doğrulanmadı | developer.yemeksepeti.com |
| efatura | Turkcell e-Şirket | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | kaldı | Doküman açık; e-Arşiv UBL yolu okunmadı, sözleşme sonrası | developer.turkcellesirket.com |
| efatura | KolayBi | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | kaldı | Doküman ve sandbox açık; Content-Type çelişkisi, müşteri/ürün eşlemesi gerekir | developer.kolaybi.com |
| efatura | İzibiz | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | kaldı | Yalnız test adresleri var, canlı adres yok | github.com/izibiz/ws-client-dotnet |
| efatura | BizimHesap | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | kaldı | Muhasebe kaydı ekler, GİB gönderimi yok | apidocs.bizimhesap.com |
| efatura | QNB eSolutions | cicekci, kurutemizleme, matbaa, pastane, terzi, nakliyat +18 | doküman kapalı, sözleşme gerekir | Açık doküman yok | - |
| payment | Lidio | egitim, eticaret, kurs, site, spor | kaldı | Doküman açık; istek alanları tam okunmadı, canlı adres belirsiz | developer.lidio.com |
| payment | PayU Türkiye | egitim, eticaret, kurs, site, spor | doküman kapalı, sözleşme gerekir | Siteye bağlantı kurulamadı | - |
| kargofirma | Sendeo | eticaret, kargo | doküman kapalı, sözleşme gerekir | Geliver üzerinden kullanılabilir | - |
