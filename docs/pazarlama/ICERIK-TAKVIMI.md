# NEBSOFT 12 haftalık içerik takvimi

Tarih: 30.10.2026 · Dal: `pazarlama/plan` (taban: `devir/hepsi` 7c5c352). Pazar sırası: `docs/pazarlama/PAZAR-GENISLEME.md`.

Bu belge kısa video, Instagram ve LinkedIn içeriğini içerir: 5 genel video, 31 program videosu, her biri için Instagram ve LinkedIn metni. Metinler yayın için yazıldı ama henüz hiçbiri yayınlanmadı ve hukuk incelemesinden geçmedi.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Aşağıdakiler kapanmadan Hafta 1 başlamaz. Takvim tarihe değil, bu kapıya bağlıdır.

| # | Engel | Kaynak | Gereken |
|---|---|---|---|
| 1 | Şirket kimliği yok: unvan, MERSİS, adres, KEP | `docs/YASAL-INCELEME.md` E1 | Sizden bilgi. Ticari içerik kimliği belli hesaptan yayınlanmalı |
| 2 | Site adresi yer tutucu: `site/src/site.config.js` `https://www.domain.com` | Kod, `docs/IDDIA-LISTESI.md` §3 | Gerçek alan adı. Metinlerde `[ALAN_ADI]` duruyor |
| 3 | Destek telefonu doğrulanmadı (`0850 555 00 34` varsayılan değer) | `docs/IDDIA-LISTESI.md` §3 | Bu belgede telefon kullanılmadı. Gerçek hat varsa siz ekleyin |
| 4 | Yasal metinler taslak; satış akışı mesafeli sözleşme kurallarına uymuyor | `docs/YASAL-INCELEME.md` E10, E11 | Avukat onayı, kod düzeltmesi |
| 5 | Yayın paketi güncel değil: hosting paketi, exe, apk yeniden derlenmeli | `docs/DEVIR.md` "Hâlâ açık" | Yayın |
| 6 | Reklam hukuku bu belgede doğrulanmadı | Ticari reklam kuralları (hafızadan, doğrulanmadı) | Yayından önce avukata 5 örnek metin gösterilmeli |

## Yayın durumu

| Etiket | Anlamı |
|---|---|
| HAZIR | Engeller kapanınca yayınlanabilir |
| KOŞULLU | Notta yazan koşul sağlanınca yayınlanır, anlatım sınırı aşılmaz |
| BEKLET | Çekim yapılabilir, yayınlanmaz. Önkoşul sizden onay alır |

## İçerik kuralları

1. **Yalnız kodda olan anlatılır.** Düğme adları `apps/<program>/` ve `core/` içinde arandı. Tüm videolarda ters tırnaklı ekran ve düğme adları bulundu (30.10.2026). Bu arama çalışma kanıtı değildir: kayıt sırasında akış tarayıcıda denenir, hata çıkarsa video çekilmez.
2. **SMS, WhatsApp API, e-Fatura, e-Arşiv, yazarkasa, kart ödeme, pazaryeri, kargo firması, portal, kurum servisleri anlatılmaz.** Dokümana uyum canlı test değildir (`CLAUDE.md` §1). Bunlar yalnız "yok" veya "yetkili sistemden" cümlesinde geçer.
3. **Sonuç vaadi yok.** Satış artar, gelmeyen azalır, zaman kazanırsınız denmez. Ölçüm gelmeden `docs/IDDIA-LISTESI.md` §2'deki ifadeler geri yazılmaz.
4. **Mutlak ifade yok:** hiçbir, asla, en iyi, sıfır, kayıp yok, unutulmaz. "Veri kaybı yok", "KVKK uyumlu", "yedekli", "Türkiye'de barındırılır", "ücretsiz kurulum", "256-bit SSL", "2 ay bedava" kullanılmaz.
5. **Uydurma kanıt yok:** yüzde, müşteri sayısı, işletme sayısı, puan, yorum, rakip adı yok. Gerçek yorum yalnız `docs/VAKA-FORMU.md` izniyle girer.
6. **Örnek veri belli olur.** Her videonun sonunda "Görüntüler örnek verilerle hazırlanmıştır." yazar. Gerçek ad, telefon, plaka, hasta, çocuk ve fotoğraf kullanılmaz. `market/market.js` ana sayfa örnek rakamları (312 Fiş, ₺48.320) kadraja girmez.
7. **Fiyat videoda söylenmez.** Fiyatlar panelden değişir (`docs/GELISTIRME-PLANI.md`). "Yedi gün" `TRIAL()` ayarına bağlıdır, süre değişirse metinler değişir.
8. **Serbest meslek ve sağlık:** hukuk, müşavir, klinik, veteriner, eczane içerikleri organik yayınlanır. Bu gruba soğuk ileti gönderilmez (`docs/PAZARLAMA-ARACI.md`, DOĞRULANAMADI).

## Üretim şablonu

- **Biçim:** dikey 1080×1920, 30–45 sn. Süreler dış sesin saniyede 2 sözcükle okunmasına ve sahne arası 1 saniyeye göre hesaplandı. Gerçek süre kayıtta ölçülür.
- **Kayıt:** yerel sunucu, adres `/apps/<program>/?demo=1`, telefon genişliği, açık tema.
- **Altyazı:** zorunlu. Dış ses metni birebir altyazı olur.
- **Kapanış kartı:** program adı, `[ALAN_ADI]/<sayfa>`, örnek veri notu.
- **Hesap:** Instagram, LinkedIn. YouTube Shorts ve TikTok aynı dikey videoyla kullanılabilir (karar sizde).
- **Ölçülecek:** gösterim, tıklama, demo açma, deneme başlatma. Hedef rakam konmadı, ilk veri gelince konacak. Yayın saatleri için kanıt yok: başlangıç önerisi Pazartesi, Çarşamba, Cuma; saatleri kendi verinizle ayarlayın.

## 12 haftalık takvim

Her gün aynı video Instagram Reels'e kendi metniyle, LinkedIn'e kendi metniyle gider.

| Hafta | Tema | Pazartesi | Çarşamba | Cuma |
|---|---|---|---|---|
| 1 | Tanışma ve randevulu işler | V01 NEBSOFT nedir? | V02 Randevu | V03 Teknik Servis |
| 2 | Araç ve servis | V04 Oto Servis | V05 Deneme nasıl başlar? | V06 Oto Yıkama & Otopark |
| 3 | Üyelik ve aracılık | V07 Spor Salonu | V08 Emlak Ofisi | V09 Oto Galeri |
| 4 | Araç ve kliniğe geçiş | V10 Araç Kiralama | V11 TEST yazısı neden var? | V12 Veteriner Kliniği |
| 5 | Eğitim | V13 Anaokulu & Kreş | V14 Kurs & Etüt | V15 Belgenizi kendiniz tasarlayın |
| 6 | Serbest meslek ve kuyumcu | V16 Kuyumcu | V17 Hukuk Bürosu | V18 Mali Müşavir Bürosu |
| 7 | Yeme içme ve mağaza | V19 Adisyon | V20 Butik & Giyim | V21 İnternet kesilirse |
| 8 | Kasa, etkinlik, site | V22 Market POS | V23 Etkinlik Bilet | V24 Apartman & Site |
| 9 | B2B ofis | V25 CRM | V26 Personel & Puantaj | V27 Toptancı & Plasiyer |
| 10 | Koşullu programlar 1 | V28 Ön Muhasebe (KOŞULLU) | V29 Otel & Pansiyon (KOŞULLU) | V30 Fabrika ERP (KOŞULLU) |
| 11 | Koşullu programlar 2 | V31 Kargo & Kurye (KOŞULLU) | V32 Klinik & Muayenehane (KOŞULLU) | V33 Kâr & Fiyat Robotu (KOŞULLU) |
| 12 | Bekleyen programlar | V34 Pazaryeri Satıcı Paneli (BEKLET) | V35 E-ticaret Mağazası (BEKLET) | V36 Eczane (BEKLET) |

**Yedek kuralı:** BEKLET veya KOŞULLU video yayınlanamıyorsa yerine aynı sektöre yakın bir HAZIR videonun yeni kancalı kısa kesimi konur. Haftalar kayarsa sıra korunur. Hafta 12'nin üç videosu büyük olasılıkla bekler: pazaryeri ve e-ticaret test hesabı ister, eczane resmî bağlantılar olmadan satışa uygun değildir.

## Genel videolar

### V01 · NEBSOFT nedir? (yaklaşık 33 sn)

Hedef: Tüm takipçiler. Durum: HAZIR.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–7 sn | Pazar yeri ana sayfası: ürün kartları | Tek programla her işi yapmak yerine sektörünüze göre yazılmış program seçin. |
| 7–16 sn | Ürün listesinde sektör filtresi | NEBSOFT, Türkiye’deki işletmeler için otuz bir sektörel program sunar. Kuaförden oto servise, anaokulundan toptancıya kadar. |
| 16–23 sn | Bir ürün sayfası; canlı demo düğmesi | Her programın örnek verili demosunu kayıt olmadan açın. Tarayıcıda çalışır, kurulum gerekmez. |
| 23–33 sn | NEBSOFT logosu, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Sektörünüzü seçin, programın ekranlarını gezin. Bir program size uymuyorsa aynı hesapla başka bir programa bakın. Adres açıklamada. |

**Instagram:**

> Kuaförün ihtiyacı başka, oto servisin ihtiyacı başka.
> 
> NEBSOFT’ta 31 sektörel program var. Örnek verili demoyu kayıt olmadan açın.
> 
> #nebsoft #kobi #esnaf #yazılım

**LinkedIn:**

> NEBSOFT, Türkiye’deki işletmeler için sektöre özel web programları geliştiriyor. Her programın örnek verili demosu var, kayıt gerektirmiyor. Bu hesapta ne yaptığımızı, ne yapmadığımızı ekranı göstererek anlatacağız.

### V05 · Deneme nasıl başlar? (yaklaşık 31 sn)

Hedef: Kararsız işletme sahibi. Durum: HAZIR.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | Kayıt ekranı (örnek e-posta) | Denemek için kart bilgisi vermeniz gerekmiyor. |
| 4–13 sn | Kısa kayıt formu; program seçimi | Kısa formu doldurun, programınızı seçin. Hesabınız süresiz ve ücretsizdir, seçtiğiniz programın yedi günlük denemesi hemen başlar. |
| 13–21 sn | Program açılışı; örnek veri ekranı | Önce kayıt olmadan demoya bakmak isterseniz ürün sayfasından açın. Aylık planlarda taahhüt yoktur. |
| 21–31 sn | NEBSOFT logosu, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Ödeme yapmadan önce kendi işinizde deneyin. Takıldığınız yerde yardım merkezine bakın ya da destek ekibimize yazın. Adres açıklamada. |

**Instagram:**

> Hesap ücretsiz, deneme yedi gün, kredi kartı gerekmez.
> 
> Önce demoya bakın, sonra karar verin.
> 
> #nebsoft #esnaf #kobi

**LinkedIn:**

> Yazılım seçmek zaman alır. NEBSOFT’ta hesap açmak ücretsizdir, her program için yedi günlük deneme ve kayıt gerektirmeyen demo vardır. Aylık planlarda taahhüt yoktur.

### V15 · Belgenizi kendiniz tasarlayın (yaklaşık 31 sn)

Hedef: Yazdırılan belge kullanan işletmeler. Durum: HAZIR.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–7 sn | Oto Servis: `Belge şablonları` sayfası | Fişiniz ve formunuz işletmenizin belgesi gibi görünsün. Başkasının şablonuna uymak zorunda kalmayın. |
| 7–13 sn | Şablon tasarımcısı: alanları açıp kapatma, önizleme | Şablon tasarımcısında alanları açıp kapatın, yazı boyutunu değiştirin, önizlemeye bakın. |
| 13–20 sn | Ekranda parmakla imza; yazdırma önizlemesi | Müşteriye belgeyi ekranda imzalatın, imzalı belgeyi yazdırın. Bu yapı programların çoğunda ortaktır. |
| 20–31 sn | NEBSOFT logosu, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Hazır şablonla başlayın. Logonuzu ekleyin, renkleri seçin, metinleri işletmenize göre yazın. Sonra aynı belgeyi her gün kullanın. Adres açıklamada. |

**Instagram:**

> Fiş, form ve tutanak sizin düzeninizde olsun.
> 
> NEBSOFT belge tasarımcısıyla alanları seçin, müşteriye ekranda imzalatın.
> 
> #nebsoft #dijitalimza #kobi

**LinkedIn:**

> İşletmelerin çoğu aynı belgeyi yıllardır elle düzenler. NEBSOFT’ta belge şablon tasarımcısı ve ekranda imza ortak yapı taşıdır. Elektronik imza değildir; yasal geçerlilik için hukukçunuza danışın.

### V21 · İnternet kesilirse (yaklaşık 31 sn)

Hedef: Kasa kullanan işletmeler. Durum: HAZIR.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | Market POS satış ekranı | İnternet gitti. Kasa ne olacak? |
| 4–12 sn | Tarayıcıda bağlantı kapalı; satış ekranı açık | Satış ekranı tarayıcıda çalışmaya devam eder. Satışlarınızı girmeyi sürdürürsünüz. Değişiklikler önce bu cihazda bekler. |
| 12–19 sn | Bağlantı geri gelir; eşitleme göstergesi | Bağlantı geri geldiğinde veriler eşitlenir. Telefonda ana ekrana ekleyip uygulama gibi açabilirsiniz. |
| 19–31 sn | NEBSOFT logosu, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Çevrimdışı çalışan cihazdaki değişiklikler bekler, ekranda durum yazısı görünür. Çevrimdışı giriş yalnız o cihazda daha önce giriş yapan kullanıcıya açıktır. Adres açıklamada. |

**Instagram:**

> İnternet kesintisinde satış ekranı çalışmaya devam eder, bağlantı gelince veriler eşitlenir.
> 
> #market #kasa #esnaf

**LinkedIn:**

> Kasa ekranı internete bağımlı olmamalı. NEBSOFT Market POS satış ekranı bağlantı kesilince çalışmayı sürdürür, bağlantı gelince eşitleme yapar.

### V11 · TEST yazısı neden var? (yaklaşık 31 sn)

Hedef: Tüm takipçiler, güven içeriği. Durum: HAZIR.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | Bir programda “TEST — gönderilmedi” uyarısı | Gönderilmeyen bir şeye gönderildi demiyoruz. |
| 4–12 sn | Entegrasyonlar sayfası: kart durumları | Sağlayıcı hesabı bağlı değilse program bunu söyler. Sonuç TEST görünür ve yapıldı diye kaydedilmez. |
| 12–20 sn | Ürün sayfasındaki SSS: “henüz yok” yanıtları | Bir bağlantı doğrulanmadıysa ürün sayfasında “henüz yok” yazar. Almadan önce neyin açık olduğunu görün. |
| 20–31 sn | NEBSOFT logosu, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Satın almadan önce sormak istediğiniz bir şey varsa bize yazın. Ürün sayfasındaki sık sorulan soruları da okuyun. Adres açıklamada. |

**Instagram:**

> Programda “TEST” görüyorsanız o işlem gerçekten yapılmamıştır.
> 
> Almadan önce neyin çalışıp neyin açık olmadığını bilmenizi istiyoruz.
> 
> #nebsoft #şeffaflık #kobi

**LinkedIn:**

> Yazılım tanıtımlarında en zor cümle “bu henüz yok” cümlesidir. NEBSOFT’ta doğrulanmayan bağlantılar canlıda seçilemez, simülasyon sonucu her yerde TEST diye görünür. Ürün sayfalarının SSS bölümünde hangi bağlantının açık olmadığını yazıyoruz.

## Program videoları

### V02 · Randevu (yaklaşık 38 sn)

- **Hedef:** Kuaför, berber, güzellik merkezi
- **Durum:** HAZIR
- **Kayıt:** `/apps/randevu/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/randevusistemi`
- **Sınır:** Hatırlatma anlatılmaz: SMS sağlayıcı hesabı gerekir ve hatırlatma yalnız panel açıkken çalışır (`docs/DEVIR.md`). Müşteri adları örnek veridir. `book.html` başlığındaki “288+ tamamlanan randevu” yazısı örnek sayıdır, kadraja girmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Takvim` ekranı, örnek randevularla dolu gün | Telefon çalınca işi bırakıp defteri açmak zorunda mısınız? |
| 5–15 sn | `Takvim`: boş saate tıklayın, müşteri ve hizmeti seçin, kaydedin; randevuyu sürükleyip taşıyın | Personelinizin gününü yan yana görün. Boş saate tıklayın, müşteriyi ve hizmeti seçin. Randevuyu sürükleyerek başka saate taşıyın. |
| 15–29 sn | `apps/randevu/book.html` telefon görünümünde; sonra `Müşteri geldi` ve `Tamamla ve ödeme al` | Online randevu bağlantınızı Instagram profilinize ekleyin, müşteri kendi saatini seçsin. Randevu bitince ödemeyi aynı ekrandan alın. Seans paketlerini ve personel primini de aynı programda izleyin. |
| 29–38 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Randevu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Randevular defterde, telefonda ve mesajlarda dağılmasın.
> 
> NEBSOFT Randevu ile personel takvimi, online randevu sayfası ve kasa tek yerde durur. Bağlantıyı profilinize ekleyin, müşteri boş saatlerden kendisine uygun olanı seçsin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #kuaför #berber #güzellikmerkezi #randevu #esnaf

**LinkedIn:**

> Küçük bir salonda randevu işi çoğu zaman çalışanın elindeki işi bölerek yapılır. NEBSOFT Randevu bu işi tek ekranda toplar: personel sütunlu takvim, müşterinin saat seçtiği online sayfa, tahsilat ve personel primi.
> 
> Örnek verilerle hazırlanmış demoyu kayıt olmadan açabilirsiniz.

### V03 · Teknik Servis (yaklaşık 34 sn)

- **Hedef:** Telefon, bilgisayar, beyaz eşya servisi
- **Durum:** HAZIR
- **Kayıt:** `/apps/servis/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/teknikservisprogrami`
- **Sınır:** `SMS Bildirimleri` ekranı gösterilmez. Takip bağlantısı elle paylaşılır. `takip.html` açılış sayfasındaki “90 gün garanti” ve “Onayladığınız an onarıma başlarız” yazıları sabit metindir, kadraja girmez; kayıt örnek takip koduyla sonuç ekranından başlar.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Servis Panosu` sütunları, kartlar kabulden teslime dizili | Müşteri cihazının durumunu sormak için aramak zorunda kalmasın. |
| 5–14 sn | `Servis Panosu`: `Yeni` ile cihaz kaydı; `Kabul fişi` önizlemesi | Cihazı teslim alırken arızayı ve aksesuarları kaydedin, kabul fişini yazdırın. Her iş panoda kabulden teslime ilerlesin. |
| 14–25 sn | `Takip linki` düğmesi; `apps/servis/takip.html` telefon görünümünde | Takip bağlantısını müşteriyle paylaşın. Müşteri cihazın hangi aşamada olduğunu görür, teklifi kalem kalem telefonundan onaylar. Kullanılan parça stoktan düşer. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Teknik Servis programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Cihaz serviste. Müşteri ne durumda olduğunu merak ediyor.
> 
> NEBSOFT Teknik Servis ile her cihaza takip bağlantısı verin. Müşteri aşamayı kendisi izlesin, teklifi telefonundan onaylasın.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #teknikservis #telefontamiri #beyazeşya #bilgisayarservisi #esnaf

**LinkedIn:**

> Teknik serviste işin büyük kısmı onarım kadar bilgi akışıdır: cihaz nerede, teklif onaylandı mı, parça kullanıldı mı?
> 
> NEBSOFT Teknik Servis kabul fişi, kanban pano, müşteri takip sayfası, kalem kalem teklif onayı ve parça stoğunu aynı kayıtta birleştirir.

### V04 · Oto Servis (yaklaşık 35 sn)

- **Hedef:** Oto tamirci, kaporta, oto elektrik
- **Durum:** HAZIR
- **Kayıt:** `/apps/otoservis/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/otoservisprogrami`
- **Sınır:** Onay bağlantısı SMS ile değil, elle paylaşılarak gösterilir. e-Arşiv ve yedek parça sorgusu gösterilmez. `onay.html` bağlantısız açılınca “Kayıt bulunamadı” der; sayfa iş emrindeki bağlantıdan açılır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Servis Aç`: plaka alanına örnek plaka yazılıyor | Plakayı yazın, aracın geçmişi gelsin. |
| 4–16 sn | `Servis Aç`: kilometre ve şikâyet girişi; `Servisi aç ve iş emrine geç` | Kayıtlı araçta son bakımlar ve müşteri bilgisi ekrana gelir. Kilometreyi ve şikâyeti girin, iş emrini açın. Parçayı ve işçiliği kalem kalem ekleyin. |
| 16–26 sn | `apps/otoservis/onay.html` telefon görünümünde; sonra `Hatırlatmalar` | Onay bağlantısını müşteriye iletin, müşteri istemediği kalemi çıkarıp onaylasın. Muayenesi ve bakımı yaklaşan araçları Hatırlatmalar ekranında görün. |
| 26–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Oto Servis programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> “Bunu yapmamıştık” tartışmasını kayda bağlayın.
> 
> NEBSOFT Oto Servis ile plakadan araç geçmişini açın, iş emrini kalem kalem yazın, müşteri teklifi telefonundan onaylasın.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #otoservis #tamirci #sanayi #kaporta #otoelektrik

**LinkedIn:**

> Oto serviste güven, yazılı kayıtla kurulur. NEBSOFT Oto Servis plakadan araç geçmişini getirir, parça ve işçiliği iş emrine işler, müşterinin kalem kalem onayını kayıt altına alır.
> 
> Muayene ve bakımı yaklaşan araçlar ayrı listede durur.

### V06 · Oto Yıkama & Otopark (yaklaşık 35 sn)

- **Hedef:** Oto yıkama, otopark, detailing
- **Durum:** HAZIR
- **Kayıt:** `/apps/oto/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/otoyikamaprogrami`
- **Sınır:** Plaka kamerası ve bariyer gösterilmez; plaka elle yazılır. `arac.html` plaka ve fiş koduyla açılır, örnek kaydın kodu önce programdan alınır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Giriş / Çıkış` ekranı, plaka alanı | Araç kaçta girdi? Ücret ne tutar? |
| 4–15 sn | `Giriş / Çıkış`: plaka yazılır, `Devam (Enter)`; çıkışta ücret görünür | Plakayı yazın, girişi kaydedin. Araç çıkarken program süreyi ve tarifenize göre ücreti hesaplar. Aylık aboneleri de aynı yerden izleyin. |
| 15–25 sn | `Yıkama Kuyruğu`: `Başla`, `Bitti`; `apps/oto/arac.html` telefon görünümünde | Yıkama işleri sırayla kuyrukta görünür. Müşteri plakasıyla sayfayı açar, aracının sırasını ve tahmini hazır olma saatini görür. |
| 25–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Oto Yıkama & Otopark programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> “Arabam hazır mı?” sorusunun cevabı telefonda dursun.
> 
> NEBSOFT Oto Yıkama & Otopark ile plakayla giriş-çıkış, tarifeye göre ücret ve yıkama kuyruğu tek yerde. Müşteri sırasını kendi telefonundan görür.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #otoyıkama #otopark #detailing #esnaf

**LinkedIn:**

> Oto yıkama ve otoparkta gün, plaka etrafında döner. NEBSOFT Oto Yıkama & Otopark plakayla giriş-çıkış, süreye göre ücret, yıkama kuyruğu, abonelik ve gün sonu kasasını birleştirir.
> 
> Plaka tanıma kamerası ve bariyer cihaz testinden sonra bağlanır; bugün plaka elle yazılır.

### V07 · Spor Salonu (yaklaşık 34 sn)

- **Hedef:** Fitness, pilates, yoga stüdyosu
- **Durum:** HAZIR
- **Kayıt:** `/apps/spor/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/sporsalonuprogrami`
- **Sınır:** Turnike gösterilmez. `uye.html` giriş ekranındaki “Turnikede QR” kartı kadraja girmez, kayıt örnek üye girişinden sonra başlar. Hatırlatma SMS’i anlatılmaz.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Giriş Kontrol` ekranı | Üyeliği biten üye girişte fark edilsin. |
| 4–16 sn | `Giriş Kontrol`: üye aranır veya QR okutulur, üyelik durumu görünür | Giriş Kontrol ekranında üyeyi arayın ya da QR kodunu okutun. Üyelik bitmişse durum ekranda görünür. Taksitleri ve borcu üye kartından izleyin. |
| 16–25 sn | `Ders Programı`; `apps/spor/uye.html` telefon görünümünde | Dersleri kontenjanla açın. Üye portaldan dersini ayırtır, ölçümlerini ve ödemelerini görür. Dondurma işlemini üye kartından yapın. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Spor Salonu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Üye kartı defterde kalmasın.
> 
> NEBSOFT Spor Salonu ile QR giriş, üyelik dondurma, taksit ve kontenjanlı ders tek yerde. Üye dersini kendi portalından ayırtır.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #sporsalonu #pilates #fitness #yoga #stüdyo

**LinkedIn:**

> Salon yönetiminde üç iş sürekli kesişir: üyelik süresi, tahsilat ve ders kontenjanı. NEBSOFT Spor Salonu bu üçünü aynı üye kartında toplar; üye portalı QR dijital kart, ders rezervasyonu ve ölçüm geçmişi sunar.

### V08 · Emlak Ofisi (yaklaşık 35 sn)

- **Hedef:** Emlak ofisi, gayrimenkul danışmanı
- **Durum:** HAZIR
- **Kayıt:** `/apps/emlak/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/emlakprogrami`
- **Sınır:** İlan portalı bağlantısı DOĞRULANAMADI: portal gönderimi gösterilmez, portal adı söylenmez. Belge taslakları hukukçu incelemesinden geçmedi, belge içeriği yakın plan çekilmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Portföy` listesi, örnek ilanlar | Gelen müşteriye uygun evi aklınızda mı tutuyorsunuz? |
| 5–15 sn | `Müşteri Talepleri`: talep açılır, `Eşleşen ilanlar` görünür | Müşterinin aradığını kaydedin. Program talebi portföyünüzle eşleştirir, uygun ilanları listeler. Gösterim planla ile yer göstermeyi takvime alın. |
| 15–26 sn | `Linki kopyala`; `apps/emlak/ilan.html` telefon görünümünde; sonra `Kira Takibi` | İlan bağlantısını kopyalayıp müşteriyle paylaşın. Kiraya verdiğiniz dairelerin aylık tahsilatını da Kira Takibi ekranından izleyin. Komisyonu satış kaydında hesaplayın. |
| 26–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Emlak Ofisi programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Portföy bir yerde, müşteri talebi başka yerde olmasın.
> 
> NEBSOFT Emlak ile talebi kaydedin, uygun ilanları görün, yer göstermeyi planlayın, kira tahsilatını izleyin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #emlak #gayrimenkul #emlakdanışmanı #portföy

**LinkedIn:**

> Emlak ofisinde değer, doğru müşteriyi doğru ilanla buluşturmaktan gelir. NEBSOFT Emlak portföy, müşteri talebi eşleştirme, gösterim ve kira takibini tek yerde tutar.
> 
> İlanı portala kendi hesabınızdan verirsiniz; otomatik portal gönderimi bugün açık değildir.

### V09 · Oto Galeri (yaklaşık 34 sn)

- **Hedef:** İkinci el oto galeri
- **Durum:** HAZIR
- **Kayıt:** `/apps/galeri/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/otogaleriprogrami`
- **Sınır:** Portal, TRAMER sorgusu ve satış faturası gösterilmez. `Uygun araçları gönder` düğmesine basılmaz, yalnız liste gösterilir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Araçlar` listesi, maliyet ve beklenen kâr sütunları | Bu arabadan ne kazandığınızı satmadan biliyor musunuz? |
| 5–15 sn | Araç kartı: `Masraf` ekleme, maliyet ve beklenen kâr | Alış fiyatını girin. Ekspertiz, boya, bakım ve noter masraflarını araca yazın. Gerçek maliyet ve beklenen kâr kartta görünür. |
| 15–25 sn | `Müşteri Talepleri`; `apps/galeri/vitrin.html` telefon görünümünde | Altmış günü geçen araçlar uyarı verir. Müşteri talebini kaydedin, stokla eşleştirin. Web vitrininde araçlarınızı ekspertiz bilgisiyle listeleyin. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Oto Galeri programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Masraflar kâğıtta kalınca kâr da tahmine döner.
> 
> NEBSOFT Oto Galeri ile her masrafı araca yazın, gerçek maliyeti ve beklenen kârı görün, bekleyen araçları izleyin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #otogaleri #ikincielaraç #galerici

**LinkedIn:**

> İkinci el araçta kâr, satış fiyatında değil masraf kaydında belli olur. NEBSOFT Oto Galeri araç başına maliyet, beklenen ve gerçekleşen kâr, stokta bekleme süresi ve konsinye takibini tek yerde gösterir.

### V10 · Araç Kiralama (yaklaşık 33 sn)

- **Hedef:** Rent a car firması
- **Durum:** HAZIR
- **Kayıt:** `/apps/kiralama/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/arackiralamaprogrami`
- **Sınır:** Emniyet bildirimi, HGS sorgusu ve online ödeme gösterilmez. Sözleşme metni yakın plan çekilmez (hukukçu incelemesi yok). Programda fotoğraf alanı yok.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Müsaitlik Takvimi`, araç ve gün ızgarası | Hangi araç hangi gün boş, tek bakışta görün. |
| 5–15 sn | `Kiralamalar`: yeni kiralama; `Teslim` adımı | Takvimden boş aracı seçin, kiralamayı açın, sözleşmeyi yazdırın. Teslimde ve iadede kilometreyi, yakıtı ve hasarı yazılı kaydedin. |
| 15–24 sn | `apps/kiralama/kirala.html` telefon görünümünde; sonra `Bakım & Masraf` | Müşteri online sayfadan müsaitliği görür, rezervasyon yapar, ödemeyi teslimde yapar. Bakım ve masrafları araç bazında izleyin. |
| 24–33 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Araç Kiralama programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Filo takvimi Excel’de, sözleşme kâğıtta, hasar notu telefonda olmasın.
> 
> NEBSOFT Araç Kiralama ile müsaitlik, sözleşme ve teslim kontrolü tek yerde.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #rentacar #araçkiralama #filo

**LinkedIn:**

> Araç kiralamada anlaşmazlıkların çoğu teslim anında yazılmayan bilgiden çıkar. NEBSOFT Araç Kiralama kilometre, yakıt ve hasarı teslim ve iadede kayda geçirir; müsaitlik takvimi ve online rezervasyon sayfası aynı programdadır. Online sayfada ödeme teslimde alınır.

### V12 · Veteriner Kliniği (yaklaşık 34 sn)

- **Hedef:** Veteriner kliniği, pet otel
- **Durum:** HAZIR
- **Kayıt:** `/apps/veteriner/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/veterinerprogrami`
- **Sınır:** VETBİS, PETVET ve toplu SMS gösterilmez. Serbest meslek için soğuk ileti hukuku DOĞRULANAMADI: bu video yalnız organik yayınlanır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Hastalar` listesi, örnek hayvan kartları | Aşı karnesi evde kaldı mı? |
| 4–14 sn | Hasta kartı: `Muayene kaydı`, `Aşı uygula` | Hasta kartında muayene geçmişi tek yerde durur. Yapılan aşıyı işleyin, aşı takvimi güncellensin, yaklaşan aşıları listede görün. |
| 14–25 sn | `apps/veteriner/karne.html` telefon görünümünde; sonra `Pet Otel` | Hayvan sahibi karne koduyla dijital karneyi telefonundan görür. Pet otel konaklamasını, ilaç ve mama satışını da aynı programda yürütün. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Veteriner Kliniği programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Patili hastaların karnesi kaybolmasın.
> 
> NEBSOFT Veteriner ile muayene geçmişi, aşı takvimi ve dijital karne tek yerde. Hayvan sahibi karneyi telefonundan görür.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #veteriner #veterinerkliniği #petotel #aşıkarnesi

**LinkedIn:**

> Veteriner kliniğinde hasta geçmişi, stok ve konaklama çoğu zaman ayrı defterlerde tutulur. NEBSOFT Veteriner bunları tek programda toplar ve hayvan sahibine dijital aşı karnesi sunar. Resmî bildirimler yetkili sistemlerden yapılmaya devam eder.

### V13 · Anaokulu & Kreş (yaklaşık 34 sn)

- **Hedef:** Özel anaokulu, kreş
- **Durum:** HAZIR
- **Kayıt:** `/apps/anaokulu/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/anaokuluprogrami`
- **Sınır:** Gerçek çocuk adı veya fotoğrafı kullanılmaz. Çocuk görseli yerine yalnız ekran kaydı. Teslim SMS’i anlatılmaz.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Günlük Rapor` ekranı, sınıf listesi | “Bugün yemeğini yedi mi?” sorusunun cevabı telefonda dursun. |
| 5–14 sn | `Günlük Rapor`: işaretleme; `Velilere bildir` | Öğretmen yemek, uyku ve ruh halini tek dokunuşla işaretler. Sınıfın raporunu tek ekrandan hazırlar, velilere yayınlar. |
| 14–24 sn | `Giriş & Çıkış`: `Teslim et`; `apps/anaokulu/veli.html` telefon görünümünde | Çıkışta çocuğu kimin aldığı kaydedilir, listede olmayan kişide uyarı çıkar. Veli günün raporunu, menüyü ve duyuruları telefonundan görür. |
| 24–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Anaokulu & Kreş programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Veli gününü merak eder, öğretmen sınıfla ilgilenir.
> 
> NEBSOFT Anaokulu ile günlük rapor tek ekrandan hazırlanır, veli portaldan görür. Çocuğu kimin teslim aldığı kayıt altındadır.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #anaokulu #kreş #okulöncesi #veli

**LinkedIn:**

> Anaokulunda veli iletişimi öğretmenin gününden zaman alır. NEBSOFT Anaokulu günlük raporu, teslim alan kaydını, duyuruları, yemek menüsünü ve aidatı tek programda toplar; veliler uygulama indirmeden portalı tarayıcıdan açar.

### V14 · Kurs & Etüt (yaklaşık 35 sn)

- **Hedef:** Etüt merkezi, dil kursu, müzik okulu
- **Durum:** HAZIR
- **Kayıt:** `/apps/kurs/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/kursprogrami`
- **Sınır:** Veli SMS’i anlatılmaz. Örnek öğrenci adları kullanılır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Deneme Sınavları` ekranı | Deneme sonuçlarını hâlâ elle mi karşılaştırıyorsunuz? |
| 4–12 sn | `Yoklama`: `Yoklama al`, `Hepsi var`; `Deneme Sınavları`: `Netleri kaydet` | Yoklamayı tek ekrandan alın. Deneme netlerini girin, program sınıf ortalamasını ve sırayı göstersin. |
| 12–25 sn | `apps/kurs/veli.html` telefon görünümünde; sonra `Taksit & Tahsilat` | Veli portal koduyla yoklamayı, deneme gelişimini ve taksit durumunu telefonundan görür. Geciken taksitleri ayrı listede izleyin. Ödevleri ve birebir etütleri de aynı programda planlayın. |
| 25–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Kurs & Etüt programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Yoklama, deneme ve taksit üç ayrı defterde olmasın.
> 
> NEBSOFT Kurs & Etüt ile hepsi tek programda. Veli gelişimi portaldan izler.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #etütmerkezi #dilkursu #kurs #veli

**LinkedIn:**

> Kurslarda veli güveni düzenli bilgiyle kurulur. NEBSOFT Kurs & Etüt yoklama, deneme analizi, ödev, etüt ve taksit takibini birleştirir; veli portalı öğrenciye ait bilgileri tek ekranda gösterir.

### V16 · Kuyumcu (yaklaşık 36 sn)

- **Hedef:** Kuyumcu, altın atölyesi
- **Durum:** HAZIR
- **Kayıt:** `/apps/kuyumcu/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/kuyumcuprogrami`
- **Sınır:** Emanet, kimlik sınırı, KDV ve kur servisi anlatılmaz. Kayıtta kur rakamları örnektir ve ekranda “örnek kur” yazısı durur; gerçek piyasa fiyatı gibi sunulmaz.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Kur & Fiyatlar` ekranı, örnek kur | Kur değişti. Fiyat listesini baştan mı yazacaksınız? |
| 5–13 sn | `Kur & Fiyatlar`: has alış ve satış girilir, `Kuru kaydet` | Has alış ve satışı girin. Çeyrek, yarım, tam ve gram fiyatları makasınıza göre hesaplansın. |
| 13–27 sn | `apps/kuyumcu/ekran.html` tam ekran; sonra `Satış` ve `Alış & Hurda` | Dükkândaki televizyonda kur ekranı yenilenir. Takı satışını ve hurda alışını has gram olarak kaydedin, gün sonunda kasayı kontrol edin. Özel siparişte kaporayı ve teslim tarihini kaydedin. |
| 27–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Kuyumcu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Kur yazdığınız anda vitrin ekranı da yenilensin.
> 
> NEBSOFT Kuyumcu ile sikke ve takı fiyatları makasınızla hesaplanır, satış ve hurda alış has gram olarak kaydedilir.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #kuyumcu #altın #sarraf #takı

**LinkedIn:**

> Kuyumcuda gün, kur girişiyle başlar ve has hesabıyla biter. NEBSOFT Kuyumcu has kurundan sikke ve ayar fiyatlarını üretir, takı stoğunu gram ve işçilikle izler, vitrin televizyonu için kur ekranı sunar.

### V17 · Hukuk Bürosu (yaklaşık 36 sn)

- **Hedef:** Avukat, hukuk bürosu
- **Durum:** HAZIR
- **Kayıt:** `/apps/hukuk/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/hukukburosuprogrami`
- **Sınır:** Yalnız organik yayın: serbest meslek için soğuk ileti hukuku DOĞRULANAMADI. e-SMM ve SMS gösterilmez. Süre hesabının kontrolü avukatta denir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Süre Takibi` ekranı | Tebliğ tarihi belli. Son gün ne zaman? |
| 5–17 sn | `Süre Takibi`: `Süre ekle`, sonuç; `Nasıl hesaplandı?` bağlantısı | Tebliğ tarihini girin. Program adli tatili ve resmî tatili hesaba katar, nasıl hesapladığını adım adım gösterir. Kesin süreyi siz kontrol edersiniz. |
| 17–27 sn | `Ajanda`; `apps/hukuk/muvekkil.html` telefon görünümünde | Duruşmalar ve son günler tek ajandada durur. Müvekkil portalda yalnız kendi dosyalarını, duruşma tarihlerini ve masraf dökümünü görür. |
| 27–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Hukuk Bürosu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Duruşma ve süre takibi tek ajandada dursun.
> 
> NEBSOFT Hukuk Bürosu süre hesabını adım adım gösterir, kontrol sizde kalır. Müvekkil kendi dosyasını portaldan izler.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #avukat #hukukbürosu #davatakip

**LinkedIn:**

> Büro düzeninde en kritik bilgi son gündür. NEBSOFT Hukuk Bürosu süre hesabını kuralıyla birlikte gösterir, duruşma ajandası, masraf avansı ve müvekkil portalını aynı dosyada toplar.
> 
> UYAP’a bağlanmaz; dosya bilgileri büroda girilir. Süre hesabını her zaman avukat doğrular.

### V18 · Mali Müşavir Bürosu (yaklaşık 35 sn)

- **Hedef:** SMMM, muhasebe bürosu
- **Durum:** HAZIR
- **Kayıt:** `/apps/musavir/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/malimusavirprogrami`
- **Sınır:** Yalnız organik yayın: serbest meslek için soğuk ileti hukuku DOĞRULANAMADI. Program beyanname göndermez, bu cümle videoda kalır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Beyanname Takvimi` ekranı | Bu hafta hangi mükellefin hangi beyannamesi bitiyor? |
| 5–14 sn | `Beyanname Takvimi`: `Hazırlanıyor`, `Verildi` işaretleme | Mükellef türüne göre beyannameler listelenir. Son güne kalan günü ve hazırlık durumunu önünüzde görün, bitenleri işaretleyin. |
| 14–25 sn | `Evrak Takibi`; `apps/musavir/portal.html` telefon görünümünde | Kimin hangi evrakı eksik, tek tabloda görün. Mükellef belgesini portaldan yükler. Beyanname gönderimi kendi programınız ve GİB üzerinden yapılır. |
| 25–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Mali Müşavir Bürosu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Ayın son haftası tablolarla geçmesin.
> 
> NEBSOFT Mali Müşavir Bürosu beyanname takvimini, evrak eksiklerini ve ücret tahsilatını tek ekranda toplar. Beyanname gönderimi GİB üzerinden sizde kalır.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #malimüşavir #smmm #muhasebe

**LinkedIn:**

> Büro işinin görünmeyen yükü takip işidir: hangi mükellef, hangi beyanname, hangi evrak. NEBSOFT Mali Müşavir Bürosu bunu tek ekranda toplar, mükellef portalı ile evrak yüklemeyi kolaylaştırır.
> 
> Beyanname hazırlama ve gönderme mevcut programınızda ve GİB’de kalır.

### V19 · Adisyon (yaklaşık 36 sn)

- **Hedef:** Restoran, kafe
- **Durum:** HAZIR
- **Kayıt:** `/apps/adisyon/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/adisyonprogrami`
- **Sınır:** Yemek platformları ve yazarkasa gösterilmez. Adisyonun bilgi fişi olduğu videoda söylenir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Masalar` planı, dolu ve boş masalar | Sipariş kâğıdı yerine ekrana yazılsın. |
| 4–13 sn | `Masalar`: boş masa, ürün seçimi; `Mutfak Ekranı` | Boş masaya dokunun, ürünleri seçin. Sipariş mutfak ekranında hazırlık süresiyle görünür. Reçete tanımlıysa malzeme stoğu düşer. |
| 13–27 sn | `apps/adisyon/qr.html?masa=a1-2` telefon görünümünde; sonra `Ödeme al`, `Kişiye böl` | Müşteri QR kodu okutup menüyü telefonundan açar. Hesabı kişiye bölerek alın. Adisyon bilgi fişidir, mali fişi yazarkasanızdan kesersiniz. Masa taşıma ve birleştirme de aynı ekranda. |
| 27–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Adisyon programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Masa, mutfak ve kasa aynı ekranda konuşsun.
> 
> NEBSOFT Adisyon ile masa planı, mutfak ekranı, QR menü ve hesap bölme tek sistemde. Mali fişi yazarkasanızdan kesersiniz.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #restoran #kafe #qrmenü #adisyon

**LinkedIn:**

> Restoranda sipariş akışı masadan mutfağa, oradan kasaya gider. NEBSOFT Adisyon bu akışı tek ekranda toplar: sürükle-bırak masa planı, mutfak ekranı, QR menü, hesap bölme ve reçeteli stok.
> 
> Yazarkasa bağlantısı yoktur; mali fiş cihazınızdan kesilir.

### V20 · Butik & Giyim (yaklaşık 34 sn)

- **Hedef:** Giyim mağazası, ayakkabı, aksesuar
- **Durum:** HAZIR
- **Kayıt:** `/apps/butik/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/butikprogrami`
- **Sınır:** Pazaryeri stok bağlantısı gösterilmez. Yazarkasa cümlesi videoda kalır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Ürünler & Stok`, beden ve renk tablosu | M beden kaldı mı diye depoya mı gidiyorsunuz? |
| 5–15 sn | `Ürünler & Stok`: `Yeni model`, beden ve renk seçimi | Modeli bir kez açın, bedenleri ve renkleri seçin. Her kombinasyonun stoğu tek tabloda görünür. Biten bedenleri raporda izleyin. |
| 15–24 sn | `Satış`: barkod; `Değişim & İade`: `Değiştir` | Barkodu okutup satın. Değişimde fişi bulun, yeni bedeni seçin, stoklar karşılıklı güncellensin. Mali fişi yazarkasanızdan kesersiniz. |
| 24–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Butik & Giyim programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Beden, renk ve değişim işi tek tabloda dursun.
> 
> NEBSOFT Butik ile beden × renk stoğunu görün, barkodla satın, fişle değişim yapın. Mali fişi yazarkasanızdan kesersiniz.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #butik #giyimmağazası #ayakkabı #esnaf

**LinkedIn:**

> Giyim perakendesinde stok ürün değil, beden ve renk düzeyinde izlenir. NEBSOFT Butik modeli bir kez açmanızı, kombinasyonları ve barkodları oluşturmanızı, değişimi fişten yürütmenizi sağlar. 60 gündür satmayan ürünler raporda görünür.

### V22 · Market POS (yaklaşık 35 sn)

- **Hedef:** Market, bakkal, şarküteri
- **Durum:** HAZIR
- **Kayıt:** `/apps/pos/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/marketprogrami`
- **Sınır:** Yazarkasa ve hızlı ticaret platformları gösterilmez. Kamera ile barkod https adreste çalışır, kayıt https üzerinden yapılır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Satış Ekranı`, örnek ürünler | Veresiye defteri kasanın altında mı duruyor? |
| 4–13 sn | `Satış Ekranı`: barkod okutma, ödeme türü seçimi | Barkodu okutun. Okuyucunuz yoksa telefon kamerasını kullanın. Nakit, kart, veresiye ve parçalı ödeme aynı ekranda. |
| 13–26 sn | `Müşteriler & Veresiye`; `Alış Faturaları`; `Kasa & Gün Sonu` | Müşteri borcunu kartından izleyin. Alış faturasını girin, stok güncellensin. Programın fişi bilgi fişidir, mali fişi yazarkasanızdan kesersiniz. Raf etiketi ve barkod basımı da programda. |
| 26–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Market POS programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Kasa, stok ve veresiye aynı yerde dursun.
> 
> NEBSOFT Market POS ile barkodla satın, veresiyeyi müşteri kartından izleyin, gün sonunu alın. Mali fişi yazarkasanızdan kesersiniz.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #market #bakkal #şarküteri #barkod #esnaf

**LinkedIn:**

> Küçük markette işin omurgası barkod, stok ve veresiyedir. NEBSOFT Market POS terazi barkodu, bekleyen fiş, kampanya, sayım ve gün sonu raporunu tek programda toplar.
> 
> Yazarkasa bağlantısı yoktur; programın fişi bilgi fişidir.

### V23 · Etkinlik Bilet (yaklaşık 36 sn)

- **Hedef:** Salon, tiyatro, konser organizatörü
- **Durum:** HAZIR
- **Kayıt:** `/apps/bilet/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/biletsatisprogrami`
- **Sınır:** Kartla online ödeme yoktur, “online satış” denmez, “online rezervasyon” denir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Salonlar`, koltuk planı | Koltuk planınız hâlâ kâğıtta mı? |
| 4–12 sn | `Salonlar`: `Yeni salon`; `Gişe`: koltuk seçimi | Salonunuzun koltuk planını oluşturun. Etkinliği açın, fiyat kategorilerini girin. Gişede koltuğa tıklayıp satın. |
| 12–27 sn | `apps/bilet/bilet.html` telefon görünümünde; sonra `Kapı Kontrol`, `Kamerayla okut` | İzleyici online sayfadan koltuğunu ayırtır, ödemeyi gişede veya kapıda yapar. Kapıda QR kodu okutun, ikinci okutmada uyarı çıkar. İndirim kodu tanımlayın, iade edilen koltuğu yeniden satışa açın. |
| 27–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Etkinlik Bilet programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Koltuğu seçsin, QR ile girsin.
> 
> NEBSOFT Etkinlik Bilet ile koltuk planı, gişe, online rezervasyon ve kapı kontrolü tek sistemde. Ödeme gişede veya kapıda alınır.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #etkinlik #tiyatro #konser #bilet

**LinkedIn:**

> Küçük salonlar için bilet işi çoğu zaman gişe defteriyle yürür. NEBSOFT Etkinlik Bilet koltuk planı oluşturucu, gişe, online rezervasyon ve QR kapı kontrolünü bir araya getirir. Online kartla ödeme bugün açık değildir.

### V24 · Apartman & Site (yaklaşık 37 sn)

- **Hedef:** Site yöneticisi, yönetim şirketi
- **Durum:** HAZIR
- **Kayıt:** `/apps/site/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/siteyonetimprogrami`
- **Sınır:** Sakin portalındaki kart formu gösterilmez (yalnız demoda çalışır). İhtar metni gösterilmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Aidat & Tahakkuk` ekranı | Aidat defteri kimde? |
| 4–14 sn | `Aidat & Tahakkuk`: `Toplu tahakkuk`; `Giderler` | Aidatı tüm dairelere tek seferde tahakkuk ettirin. Giderleri girin, arsa payına göre dağıtın. Borçlu listesini istediğiniz an alın. |
| 14–27 sn | `apps/site/sakin.html` telefon görünümünde | Sakin kendi koduyla borcunu, havale bilgisini ve duyuruları görür. Misafirini QR kodla bildirir, ortak alanı ayırtır. İşletme projesini ve duyuruları da buradan yönetin. |
| 27–37 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Apartman & Site programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Aidat, gider ve duyuru tek yerde dursun.
> 
> NEBSOFT Apartman & Site ile tahakkuk, gider dağıtımı ve sakin portalı bir arada. Sakin borcunu kendi ekranında görür.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #siteyönetimi #apartman #aidat

**LinkedIn:**

> Site yönetiminde güven, gelir-giderin görünür olmasıyla kurulur. NEBSOFT Apartman & Site toplu tahakkuk, arsa payına göre gider dağıtımı, işletme projesi ve sakin portalını tek programda sunar. Aidat bugün havaleyle alınır, ekstre elle işlenir.

### V25 · CRM (yaklaşık 35 sn)

- **Hedef:** B2B satış ekibi, ajans
- **Durum:** HAZIR
- **Kayıt:** `/apps/crm/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/crmprogrami`
- **Sınır:** Sonuç vaadi yok; “satışınız artar” denmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Satış Hunisi`, fırsat kartları | Teklifi gönderdiniz. Müşteri açtı mı? |
| 4–11 sn | `Satış Hunisi`: kart sürükleme; `Teklif hazırla` | Fırsatları hunide sürükleyin. Teklifi KDV ve iskontoyla hazırlayın. Takip için göreve yazın. |
| 11–26 sn | `Bağlantı / gönder`; `apps/crm/teklif.html` telefon görünümünde | Teklifi özel bağlantıyla gönderin. Müşteri açtığında görün. Müşteri onayladığında fırsat kazanılmış olarak işaretlenir. Görevler ekranı günün işlerini ve geciken takipleri tek listede gösterir. Teklif revizyonları da kayıtlı kalır. |
| 26–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. CRM programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Teklif e-postada kaybolmasın.
> 
> NEBSOFT CRM ile teklifi bağlantıyla gönderin, görüntülendiğini görün, onayı programdan izleyin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #crm #satış #teklif #kobi

**LinkedIn:**

> Küçük satış ekiplerinde sorun çoğu zaman yöntem değil takiptir. NEBSOFT CRM satış hunisi, görev ajandası, revizyonlu teklif ve müşterinin online onayını tek yerde toplar.

### V26 · Personel & Puantaj (yaklaşık 36 sn)

- **Hedef:** Personelli KOBİ
- **Durum:** HAZIR
- **Kayıt:** `/apps/ik/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/personeltakipprogrami`
- **Sınır:** SGK bildirimi, e-Bordro, banka ve PDKS gösterilmez. Mali müşavir kontrolü cümlesi videoda kalır. Çalışan adları örnektir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Puantaj` tablosu | Puantaj hâlâ Excel’de mi? |
| 4–13 sn | `Puantaj`: `Bugünü "çalıştı" doldur`; `İzinler` | Puantajı tek tuşla doldurun, istisna günleri düzeltin. İzin taleplerini ve kalan hakkı aynı programda izleyin. |
| 13–26 sn | `Bordro & Avans`; `Bordro pusulaları` | Bordro hesabı SGK, gelir vergisi ve asgari ücret istisnasıyla yapılır. Pusulayı yazdırın. Sonucu mali müşavirinizle kontrol edin. Avans ve kesintileri de personele işleyin. |
| 26–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Personel & Puantaj programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Puantaj, izin ve avans ayrı dosyalarda durmasın.
> 
> NEBSOFT Personel & Puantaj ile hepsi tek programda. Bordro sonucunu mali müşavirinizle kontrol edin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #insankaynakları #puantaj #bordro #kobi

**LinkedIn:**

> Personel takibi küçük işletmede genellikle Excel’dedir. NEBSOFT Personel & Puantaj aylık puantaj, izin, avans ve bordro hesabını birleştirir.
> 
> SGK bildirimleri e-Bildirge’den elle yapılır; program bu bildirimleri göndermez.

### V27 · Toptancı & Plasiyer (yaklaşık 36 sn)

- **Hedef:** Toptancı, distribütör
- **Durum:** HAZIR
- **Kayıt:** `/apps/toptan/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/toptanciprogrami`
- **Sınır:** e-İrsaliye ve muhasebe aktarımı gösterilmez. Bayi girişindeki SMS kodu anlatılmaz.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Plasiyer Ekranı` telefon görünümünde | Plasiyerin siparişi akşam mı geliyor? |
| 4–13 sn | `Plasiyer Ekranı`: rota, sipariş, tahsilat | Plasiyer telefonundan günün rotasını görür, siparişi ve tahsilatı sahadan girer. Limitini aşan müşteri yönetici onayına düşer. |
| 13–26 sn | `Sevkiyat`: yükleme listesi, `Yola çıkar`; `apps/toptan/bayi.html` | Araç bazında yükleme listesi hazırlanır. Bayi kendi fiyat listesiyle sipariş verir. Vadesi geçen alacakları yaşlandırma raporunda görün. Çek ve senetleri vadesine göre izleyin. |
| 26–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Toptancı & Plasiyer programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Sipariş sahadan merkeze aynı gün gelsin.
> 
> NEBSOFT Toptancı & Plasiyer ile rota, sipariş, tahsilat ve yükleme listesi tek sistemde.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #toptan #plasiyer #distribütör

**LinkedIn:**

> Dağıtımda riskin çoğu sahada verilen kararda oluşur. NEBSOFT Toptancı & Plasiyer risk limitini sipariş anında denetler, rotayı, tahsilatı ve yükleme listesini birleştirir, bayilere kendi fiyat listesiyle sipariş sayfası sunar.

### V28 · Ön Muhasebe (yaklaşık 34 sn)

- **Hedef:** KOBİ, serbest meslek
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/muhasebe/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/onmuhasebeprogrami`
- **Sınır:** Koşul: e-Fatura gerçek hesapla denenmedi (B1). Video yalnız cari, kasa ve taslak ekranlarını gösterir; e-Fatura, e-Arşiv ve banka bağlantısı anlatılmaz.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Cari Hesaplar` listesi | Kim ne kadar borçlu? Ekstreyi elle mi çıkarıyorsunuz? |
| 5–13 sn | `Cari Hesaplar`; `Faturalar`: `Satış faturası` | Müşterinizi ve tedarikçinizi ekleyin. Satış ve alış faturalarınızı kaydedin. Cari bakiye kendiliğinden güncellensin. |
| 13–25 sn | `Kasa & Banka`: `Tahsilat`; `Ekstre yazdır` | Tahsilatı işleyin, ekstreyi yazdırın. Ay sonunda KDV taslağını görün. Bu bir taslaktır, beyanı mali müşaviriniz verir. Çek ve senetlerinizi vadeye göre izleyin. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Ön Muhasebe programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Cari, kasa ve ekstre tek yerde dursun.
> 
> NEBSOFT Ön Muhasebe ile faturaları kaydedin, tahsilatı işleyin, ekstreyi yazdırın. KDV ekranı taslaktır, beyanı mali müşaviriniz verir.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #önmuhasebe #cari #kobi

**LinkedIn:**

> Ön muhasebede ihtiyaç basittir: kim ne kadar borçlu, kasada ne var. NEBSOFT Ön Muhasebe cari hesap, kasa-banka, çek-senet ve KDV taslağını tek yerde toplar. Banka hareketleri ekstre yüklenerek işlenir.

### V29 · Otel & Pansiyon (yaklaşık 36 sn)

- **Hedef:** Butik otel, pansiyon
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/otel/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/otelprogrami`
- **Sınır:** Koşul: KBS ve kanal bağlantısı yok; işletmenin bu işi başka yerden yürüttüğü açıkça söylenir. `rezervasyon.html` içindeki tahmini OTA fiyat satırı kadraja girmez (gerçek fiyat değil).

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Rezervasyon Takvimi`, oda ve gün ızgarası | Oda doluluğu tek bakışta görünsün. |
| 4–13 sn | `Rezervasyon Takvimi`: `Yeni rezervasyon`; `Odalar & Housekeeping` | Rezervasyonu takvime girin, oda temizlik durumunu aynı programda izleyin. Misafir gelince girişini yapın, harcamaları folyoya yazın. |
| 13–26 sn | `apps/otel/rezervasyon.html` telefon görünümünde; sonra `Ödeme al` | Web sitenize rezervasyon motorunu ekleyin. KBS bildirimini yetkili sistemden yaparsınız, program konaklayan listesini hazırlar. Gün sonunda gelen ve çıkan misafirleri tek listede kontrol edin. |
| 26–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Otel & Pansiyon programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Rezervasyon, oda durumu ve folyo tek takvimde.
> 
> NEBSOFT Otel & Pansiyon ile web rezervasyonu, ön büro ve housekeeping bir arada. KBS bildirimini yetkili sistemden yaparsınız.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #pansiyon #butikotel #otel

**LinkedIn:**

> Küçük tesislerde ön büro çoğu zaman tek kişidir. NEBSOFT Otel & Pansiyon rezervasyon takvimi, housekeeping, folyo ve web rezervasyon motorunu birleştirir. Kanal yöneticisi bağlantısı ve KBS bildirimi yoktur; gelen rezervasyon elle girilir.

### V30 · Fabrika ERP (yaklaşık 37 sn)

- **Hedef:** Gıda, kimya, ambalaj üreticisi
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/fabrika/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/fabrikaerp`
- **Sınır:** Koşul: kantar ve PLC gerçek cihazla denenmedi, gösterilmez. e-İrsaliye gösterilmez. Fabrika satışı pilot görüşmesiyle ilerler, video yalnız tanıtımdır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `İzlenebilirlik` ekranı | Bir lotta sorun çıktı. Hangi müşteriye gitti? |
| 5–14 sn | `Mal Kabul`; `İş Emirleri`; `MRP` | Mal kabulden sevkiyata her adım lot numarasıyla kaydedilir. İş emrini açın, ihtiyacı MRP ekranından kontrol edin. |
| 14–28 sn | `İzlenebilirlik`: lot arama, `Geri çağırma listesi`; `apps/fabrika/bayi.html` | Lot numarasını arayın. Hangi hammaddenin kullanıldığını, ürünün kime gittiğini tek ekranda görün. Geri çağırma listesini yazdırın. Kalite kontrol ve son kullanma tarihi de lot kaydında durur. |
| 28–37 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Fabrika ERP programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Hammaddeden müşteriye her lot izlenebilir olsun.
> 
> NEBSOFT Fabrika ERP ile mal kabul, kalite, reçete, iş emri ve sevkiyat tek zincirde.
> 
> Kayıt olmadan örnek verili demoyu açabilirsiniz.
> 
> #üretim #fabrika #erp #izlenebilirlik

**LinkedIn:**

> Üretimde izlenebilirlik geri çağırma gününde sınanır. NEBSOFT Fabrika ERP lot bazlı stok, kalite kontrol, çok seviyeli reçete, MRP ve geri çağırma listesini aynı veride toplar. Demo örnek bir bisküvi fabrikasıyla gelir.

### V31 · Kargo & Kurye (yaklaşık 36 sn)

- **Hedef:** Yerel kurye, kargo acentesi
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/kargo/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/kargotakipprogrami`
- **Sınır:** Koşul: kargo firması API’si ve GPS yok; video yalnız kendi kuryesiyle çalışan işletmeyi anlatır. Kurumsal fatura gösterilmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Gönderi Kabul` ekranı | Kurye çıktı. Hangi paket kimde? |
| 4–12 sn | `Gönderi Kabul`: `Kabul et ve etiket yazdır`; `Zimmet & Dağıtım`: `Seçilenleri zimmetle` | Gönderiyi kabul edin, etiketi yazdırın. Paketleri kuryeye zimmetleyin. Kurye telefonundan teslim kaydını girer. |
| 12–26 sn | `apps/kargo/takip.html` telefon görünümünde; sonra `KT Mutabakatı` | Alıcı takip sayfasından teslimat tercihini seçer. Kapıda tahsilatı kurye bazında mutabakat ekranında kapatın. Gönderileri bölgeye göre de zimmetleyebilirsiniz. Kurye telefonda sade bir teslimat ekranı görür. |
| 26–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Kargo & Kurye programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Paket, kurye ve kapıda tahsilat aynı listede.
> 
> NEBSOFT Kargo & Kurye ile gönderi kabul, zimmet, teslim kaydı ve mutabakat tek programda.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #kurye #kargo #motokurye

**LinkedIn:**

> Kendi kuryesiyle çalışan işletmelerde en sık sorun zimmet ve kapıda tahsilat kaydıdır. NEBSOFT Kargo & Kurye bunları tek akışta tutar. Büyük kargo firmalarına gönderi aktarımı yoktur, takip numarası elle girilir.

### V32 · Klinik & Muayenehane (yaklaşık 36 sn)

- **Hedef:** Diş kliniği, muayenehane
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/klinik/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/klinikprogrami`
- **Sınır:** Koşul: sağlık verisi için `docs/YASAL-INCELEME.md` E2, E3 ve avukat onayı. Yalnız organik yayın. e-Nabız, e-Reçete ve toplu SMS gösterilmez. Tedavi fiyatı gösterilmez. Hasta adları örnektir.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Hastalar` listesi, örnek hasta kartı | Tedavi planı kâğıtta mı kalıyor? |
| 4–13 sn | `Hastalar`: hasta kartı, diş şeması | Hasta kartında dişe tıklayarak tedavi planı oluşturun. Muayene notları ve onam kaydı aynı dosyada dursun. |
| 13–26 sn | `Ödeme planı`; `Kasa & Tahsilat`; `Hekim Hakedişi` | Ödeme planıyla taksitleri belirleyin. Laboratuvar işlerini izleyin. Ay sonunda hekim hakedişini görün. Resmî sistemler yetkili kanallardan yürür. Bekleyen tedaviler listesinde randevusu olmayan hastaları görün. |
| 26–36 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Klinik & Muayenehane programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Hasta dosyası, tedavi planı ve tahsilat tek yerde.
> 
> NEBSOFT Klinik ile diş şemasından plan oluşturun, ödeme planını izleyin, laboratuvar işlerini takip edin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #dişhekimi #diskliniği #muayenehane

**LinkedIn:**

> Muayenehanede hasta takibi kadar tahsilat takibi de zaman alır. NEBSOFT Klinik diş şeması, tedavi planı, ödeme planı, laboratuvar takibi ve hekim hakedişini tek programda toplar. e-Nabız ve e-Reçete bağlantısı yoktur.

### V33 · Kâr & Fiyat Robotu (yaklaşık 37 sn)

- **Hedef:** Pazaryeri satıcısı
- **Durum:** KOŞULLU
- **Kayıt:** `/apps/fiyatrobotu/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/pazaryerikarhesaplama`
- **Sınır:** Koşul: canlı fiyat gönderimi test hesabıyla denenmedi. Video yalnız hesaplama ve öneriyi gösterir, gönderim gösterilmez. Pazaryeri adı söylenmez. Oranların örnek olduğu ekranda yazar.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Hesaplayıcı` ekranı | Komisyon, kargo ve KDV düşünce elinizde ne kalıyor? |
| 5–16 sn | `Hesaplayıcı`: maliyet ve fiyat girişi, sonuç | Maliyeti ve fiyatı girin. Program başa baş fiyatı ve hedef marj için gereken fiyatı göstersin. Kendi sözleşmenizin oranlarını yazın. |
| 16–27 sn | `Kârlılık`; `Fiyat Robotu`: `Yeniden hesapla`, `Seçilenleri uygula` | Kârlılık ekranında zarar eden ürünleri görün. Robot belirlediğiniz en az marjın altına inmeyen fiyat önerir. Uygun olanı siz seçersiniz. |
| 27–37 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Kâr & Fiyat Robotu programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Satış var, peki kâr ne kadar?
> 
> NEBSOFT Kâr & Fiyat Robotu komisyon, desi kargo ve KDV sonrası kârı gösterir. Oranları kendi sözleşmenize göre girin.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #pazaryeri #eticaret #kârhesaplama

**LinkedIn:**

> Pazaryeri satıcısının ilk sorusu ciro değil, sipariş başına ne kaldığıdır. NEBSOFT Kâr & Fiyat Robotu KDV etkisini de hesaba katar, seçtiğiniz stratejiye göre fiyat önerir. Oranlar örnektir; kendi sözleşmenizi girmeniz gerekir.

### V34 · Pazaryeri Satıcı Paneli (yaklaşık 34 sn)

- **Hedef:** Pazaryeri satıcısı
- **Durum:** BEKLET
- **Kayıt:** `/apps/pazaryeri/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/pazaryeriprogrami`
- **Sınır:** Beklet: mağaza bağlantısı satıcı test hesabıyla denenmeden yayınlanmaz. Yayında bile pazaryeri adı ve “siparişler otomatik gelir” denmez.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `Hakediş & Kâr` ekranı, “örnek veri” yazısı | Çok satıyorum, peki ne kaldı? |
| 4–14 sn | `Toplama Listesi`; `Paketleme`: barkod, `Paketle + etiket` | Örnek siparişlerle gösteriyoruz. Toplama listesi raf sırasına göre çıkar. Paketlemede barkodu okutun, yanlış ürün okutulursa sesli uyarı alın. |
| 14–24 sn | `Hakediş & Kâr`; `Ürünler & Stok` | Komisyon, kargo ve ürün maliyetini girdiğiniz verilere göre sipariş başına net kârı görün. Stok tek yerde tutulur. |
| 24–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Pazaryeri Satıcı Paneli programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Toplama, paketleme ve kâr tek panelde.
> 
> NEBSOFT Pazaryeri Satıcı Paneli ile barkodla paketleyin, sipariş başına kârı görün.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #pazaryeri #eticaret #depo

**LinkedIn:**

> Pazaryeri satıcısının deposu hızdan önce doğruluk ister. NEBSOFT Pazaryeri Satıcı Paneli raf sırasına göre toplama, barkodlu paketleme ve sipariş başına kâr görünümü sunar. Mağaza bağlantısı satıcının test hesabıyla denendikten sonra açılır.

### V35 · E-ticaret Mağazası (yaklaşık 34 sn)

- **Hedef:** Kendi markasıyla satan KOBİ
- **Durum:** BEKLET
- **Kayıt:** `/apps/eticaret/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/eticaretpaketi`
- **Sınır:** Beklet: panelden fotoğraf yükleme tamamlanmadı, kartla ödeme yok. `magaza.html` içindeki sabit taksit ve iade yazıları kadraja girmez. `docs/video/eticaret.md` “Fotoğraf” diyor, bu kodla UYUMSUZ.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–4 sn | `apps/eticaret/magaza.html` telefon görünümünde | Kendi markanızla satmak ister misiniz? |
| 4–13 sn | `Ürünler & Stok`; `Kuponlar` | Ürünleri ve varyantları girin, beden ve renk bazında stok tutun. Kupon tanımlayın, ücretsiz kargo eşiğini belirleyin. |
| 13–25 sn | `Siparişler`; `Terk Edilen Sepetler` | Siparişleri tek listede izleyin, takip numarasını yazın. Terk edilen sepetleri görün. Mağazada kapıda ödeme ve havale çalışır. Müşteri siparişini kendisi takip eder. |
| 25–34 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. E-ticaret Mağazası programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Kendi mağazanız, kendi markanız.
> 
> NEBSOFT E-ticaret ile vitrin, varyantlı stok, kupon ve sipariş takibi tek panelde. Kapıda ödeme ve havale çalışır.
> 
> Yedi gün ücretsiz deneyin, kredi kartı gerekmez.
> 
> #eticaret #onlinemağaza #kobi

**LinkedIn:**

> Küçük markalar için kendi mağazası bağımsız bir satış kanalıdır. NEBSOFT E-ticaret hazır vitrin, varyantlı stok, kupon ve sipariş takibi sunar. Kartla ödeme bugün açık değildir; sanal POS doğrulanınca açılır.

### V36 · Eczane (yaklaşık 35 sn)

- **Hedef:** Serbest eczane
- **Durum:** BEKLET
- **Kayıt:** `/apps/eczane/?demo=1`
- **Bağlantı:** `[ALAN_ADI]/eczaneprogrami`
- **Sınır:** Beklet: MEDULA, İTS, ÜTS ve ÖKC bağlantısı yok, eczanede bu bildirimler yasal zorunluluktur. Sağlık verisi için avukat onayı gerekir. Yayınlanırsa yalnız yardımcı program diye anlatılır.

| Süre | Ekranda | Dış ses |
|---|---|---|
| 0–5 sn | `Stok & SKT` ekranı, yaklaşan tarihler | Son kullanma tarihi yaklaşan ürün rafta unutulmasın. |
| 5–15 sn | `Stok & SKT`: parti ve tarih görünümü | Stoğu parti ve son kullanma tarihiyle tutun. Yaklaşan ürünleri ekranda görün. Önce bitecek ürün önce satışa çıkar. |
| 15–26 sn | `Depo Siparişi`; `apps/eczane/recete.html` telefon görünümünde | Depo sipariş listesini kontrol edin. MEDULA ve İTS işlemlerini yetkili çözümünüzle sürdürürsünüz. Bu program stok ve takip için yardımcıdır. |
| 26–35 sn | Program adı, adres, “Görüntüler örnek verilerle hazırlanmıştır.” | Örnek verili demoyu kayıt olmadan açın. Eczane programını yedi gün ücretsiz deneyin. Kredi kartı gerekmez. |

**Instagram:**

> Son kullanma tarihi takibi tek ekranda.
> 
> NEBSOFT Eczane parti ve tarih bazlı stok tutar. MEDULA ve İTS işlemleri yetkili çözümünüzde kalır; bu program yardımcı takip içindir.
> 
> #eczane #eczacı #stoktakibi

**LinkedIn:**

> Eczanede resmî işlemler yetkili sistemlerden yürür. NEBSOFT Eczane bunların yerine geçmez; parti ve son kullanma tarihi takibi, depo siparişi ve hasta sayfası için yardımcı programdır.

## DOĞRULANAMADI kalanlar

| Konu | Durum | Ne gerekir |
|---|---|---|
| Videolardaki akışların kayıt anında çalışması | DOĞRULANAMADI. Düğme adları kodda arandı, `program-duman.test.js` 31/31 geçti. Tarayıcıda yalnız örnekleme yapıldı: Dalga 1'in 5 müşteri sayfası ile Randevu ve Teknik Servis ana ekranları açıldı, son açılan ekranda konsol hatası yoktu. Tıklama akışları denenmedi | Her video çekilirken baştan sona denenir |
| Ticari reklam kurallarına uygunluk | DOĞRULANAMADI | Avukat |
| "Yedi gün" ve "Kredi kartı gerekmez" | Kodla uyumlu (`market/market.js`), iş kararı değişirse metin değişir | Sizin onayınız |
| Hashtag ve yayın saatlerinin etkisi | DOĞRULANAMADI, ölçüm yok | Yayın verisi |
| Ekranda imzanın yasal niteliği (V15) | DOĞRULANAMADI. Metin elektronik imza olmadığını söyler | Avukat |

## Bulunan uyumsuzluklar

- `docs/video/eticaret.md` "Fotoğraf, fiyat ve stok girin" diyor; `apps/eticaret/app.js` içinde fotoğraf alanı yok, `market/catalog.js` de tamamlanmadığını yazıyor: UYUMSUZ.
- `docs/video/emlak.md` "Portallara gönderim için Portal ayarları" diyor; portal bağlantısı DOĞRULANAMADI ve canlıda seçilemez: UYUMSUZ.
- `apps/servis/takip.html` sabit "90 gün garanti" sözü veriyor, `apps/randevu/book.html` demoda "288+ tamamlanan randevu" gösteriyor. İkisi de kadraja alınmaz; garanti metni her işletme için doğru olmayabilir, ürün kararı gerekir.
- `docs/IDDIA-LISTESI.md` son temizliği yansıtmıyor (`docs/DEVIR.md`). Bu belge iki kaynağı da gözetti.

Bu belgeler bu görevin kapsamı dışında olduğu için değiştirilmedi.

## Senden gerekenler

1. Alan adı, şirket unvanı ve yayın yapacak hesaplar.
2. Yüzünüz veya sesiniz mi, yoksa yapay ses mi kullanılacak? Yapay ses sağlayıcısının ticari kullanım şartı ayrıca okunmalı.
3. Haftada üç video kapasitesi var mı? Yoksa takvim iki videoya inip 18 haftaya yayılır.
4. YouTube Shorts ve TikTok eklensin mi?
5. Avukata gösterilecek örnek metinler: V02, V17, V32, V11, V36.
