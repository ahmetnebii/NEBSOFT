# SEO denetim raporu (31.10.2026)

Kapsam: üretilmiş 199 herkese açık sayfa. Komut: `node site/tools/seo-denetim.js` (`--uyari`, `--benzerlik`, `--json dosya`). Test: `server/test/seo-denetim.test.js`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

1. **Beş yasal sayfa gerçek metinle yayınlanamıyor.** `/kvkk/`, `/gizlilik/`, `/mesafeli-satis/`, `/iade/`, `/cerez/` sayfalarında `site/src/yasal/*.md` kaynakları TASLAK işaretli ya da yer tutucu içeriyor. Üretici bu yüzden kısa yedek metni kullanıyor, sayfada "örnek şablondur" notu görünüyor ve zayıf içerik sayılıp `noindex` oluyor (30 ile 68 kelime). Metinlerin anlamına dokunulmadı. Avukat onayı ve şirket bilgisi gelince TASLAK notu kaldırılır, sayfalar kendiliğinden dizine açılır. SEO'dan önce hukuki engeldir.
2. **Search Console ve saha verisi yok.** Sayfaların dizine girip girmediği, gerçek Core Web Vitals değerleri ve hangi aramada çıkıldığı DOĞRULANAMADI. Yayında mülk doğrulanmalı, sitemap gönderilmeli.

## Sonuç sayıları

| Ölçüt | Önce | Sonra |
|---|---|---|
| Sayfa (dizine açık + noindex) | 199 (192 + 7) | 199 (192 + 7) |
| Kesin hata | 120 | **0** |
| Ana sayfadan ham HTML'de yolu olmayan sayfa | 45 | 0 |
| Kırık görsel | 40 | 0 |
| Kırık varlık (ön yükleme dahil) | 4 | 0 |
| Açıklaması 165 karakteri aşan | 22 | 0 |
| Başlığı 70 karakteri aşan | 9 | 0 |
| Uyarı | 134 | 94 |
| 375 genişlikte yatay taşan sayfa | 14 | 0 |
| `aggregateRating` veya `review` | 0 | 0 |

"Önce" sütunu denetleyicinin yanlış alarmları temizlendikten sonraki ölçümdür. Betik içinde metin olarak geçen `<title>` ve `<link>` etiketleri hata sayılmaz.

## Düzeltilenler

| Sorun | Düzeltme | Yer |
|---|---|---|
| `/araclar` ve 44 araca statik sayfaların hiçbirinden bağlantı yoktu. Bağlantı yalnız JS ile çizilen pazar yeri menüsündeydi | Üst menü, alt bilgi, ana sayfa statik bloğu. Program ve rehber sayfalarına o işin ücretsiz araçları eklendi | `build-sites.js`, `build-araclar.js` |
| Dört programda hiç ekran görüntüsü yoktu (kooperatif, lastikçi, mobilya, okul servisi), iki programda müşteri ekranı eksikti | Görseller `site/tools/screens.js` ile üretildi | `site/<slug>/img/` |
| Dört programda küçük kopya yoktu, telefon 1440 px görsel indiriyordu | `kucult.js` çalıştırıldı. Mobil en büyük LCP görseli 105 KB'tan 35 KB'a indi | `site/<slug>/img/pc-1-640.jpg` |
| Eski araçlarda 20 uzun açıklama, 7 uzun başlık | Anlam korunarak kısaltıldı. 70/165 sınır testi tüm araçlara yayıldı | `site/src/araclar/`, `araclar.test.js` |
| İki rehber başlığı uzundu | Kısaltıldı, `updated` tarihi değişmedi | `site/src/rehber/` |
| Ana sayfa ve `/programlar` açıklaması uzundu, ana sayfa H1'i başlıkla aynıydı (`|` karakteriyle) | Kısaltıldı, ayrı H1 yazıldı | `build-sites.js` |
| Metinler "50 program" diyordu, liste 49 satılan program gösteriyordu. Yeni satışa kapalı eczane ana sayfa ve `/programlar` açıklamasında geçiyordu | Sayılar satılan programdan alınır, eczane metinlerden ve alt bilgiden çıktı | `build-sites.js`, `build-araclar.js` |
| Eczane rehberinde satışa kapalı program için "7 gün ücretsiz deneyin" çağrısı vardı | Satış dışı programda bu çağrı çıkmaz | `build-sites.js` |
| Pazar yeri betiği çalışınca başlık statik başlıktan farklılaşıyordu | Ana sayfa başlığı aynı metne çekildi | `market/market.js` |
| 12 program sayfası ve kooperatif sayfası telefonda sağa taşıyordu, neden uzun adres çubuğuydu | Adres çubuğu kesilir, sütun genişlemez | `site/assets/site.css` |
| Ana sayfa üst barı telefonda 399 px genişliyordu | Boşluk ve taşma kuralı | `market/market.css` |
| Araç sayfalarında CSS sürümsüzdü, 5 dakikalık önbellek alıyordu | Adrese içerik özeti eklendi | `build-araclar.js` |
| 46 sayfada `og:image` ölçüsü yoktu | Eklendi | `build-araclar.js`, `kurumsal-teklif` |
| `/site/araclar/<slug>/` kopya adresi 200 dönüyordu | 301 ile asıl adrese gider, test eklendi | `server.js`, `seo-sayfalar.test.js` |

Araçların görünen "Son güncelleme" tarihi değiştirilmedi: yalnız başlık ve özet kısaldı, hesap ve açıklama aynı. Google, içerik önemli ölçüde değişmeden tarih değiştirmeyi uyarı işareti sayar.

## Toplu içerik ve doorway denetimi

Yöntem: ana içerikte 5 kelimelik parçalar, Jaccard benzerliği. Grubun en az %30'unda geçen parça şablon sayılır. Eşikler: %85 kesin hata, %50 uyarı.

| Grup | Sayfa | En yüksek çift benzerliği | Şablon dışı metin (en düşük) | Orta kelime |
|---|---:|---:|---:|---:|
| Program | 49 | %25 | %70 | 584 |
| Hazır paket | 24 | %22 | %71 | 410 |
| Araç | 44 | %9 | %93 | 501 |
| Rehber | 62 | %4 | %98 | 972 |

**Karar: hiçbir sayfa kopya sayılmadı, `noindex` veya birleştirme yapılmadı.** Bu ölçüm yalnız kelime tekrarını görür, içeriğin yararını ölçmez. Kararların dayanağı aşağıdadır.

| Sayfa grubu | Karar | Neden |
|---|---|---|
| Saha hizmeti programları (nakliyat, temizlik, usta, peyzaj) | Olduğu gibi | Benzerlik %25 ile en yüksek grup, sebebi ortak motor ve ortak bölümler. Her biri ayrı sektöre ayrı özellik anlatır |
| 44 araç | Olduğu gibi | Her sayfada ayrı çalışan iş var. Biçim veya şehir çeşidi yok. Doorway tanımındaki "kullanıcıyı başka sayfaya akıtma" durumu yok |
| "X programı nasıl seçilir" 29 rehber | Olduğu gibi, uyarı kaldı | Başlık kalıbı aynı, metinler en çok %4 örtüşüyor. Her soru başka sektörün gerçek sorusu |
| Paket sayfaları | Olduğu gibi | Kendi işlevi var: birlikte satın alma, fiyat, program rolleri. Ara sayfa değil |
| `/kuyumcuprogrami` ile `/paketler/kuyumcu/` | Paket başlığı "Kuyumcu Paketi" yapıldı | İkisi de "kuyumcu" aramasını hedefliyordu |
| `/siteyonetimprogrami` ile `/paketler/site-yonetimi/` | Paket başlığı "Apartman Yönetimi Paketi" yapıldı | Aynı neden |
| `/sporsalonuprogrami` ile `/paketler/spor/` | Paket başlığı anahtar kelimesine uyduruldu: "Pilates Stüdyosu Yazılımı" | Aynı neden |
| `/pazaryerikarhesaplama` ile `/araclar/pazaryeri-komisyon-hesaplama/` | Program başlığı "Pazaryeri Fiyat Robotu" yapıldı | Hesaplama aramasını ücretsiz araç karşılar, program sayfası robotu anlatır. Adres ve H1 değişmedi |
| `/araclar/yillik-izin-hesaplama/` ile yıllık izin rehberi | Olduğu gibi, uyarı kaldı | Biri hesaplar, biri anlatır. Rehberden araca bağlantı eklendi |

## Kalan uyarılar (94)

| Uyarı | Sayı | Neden kaldı |
|---|---:|---|
| `baslik-60` | 86 | 60 ile 70 karakter arası. Google'da sayı sınırı yok, sonuçta kesilebilir. Genelde yalnız sondaki marka kesilir |
| `baslik-kalip` | 2 | "nasıl seçilir" kalıbı, yukarıdaki rehber kararı |
| `gorsel-lazy` | 2 | `/programlar` ilk sıra kartları bilerek hemen yüklenir, LCP gecikmesin |
| `yetim` | 2 | `/kayit/` ve `/eczaneprogrami`: ikisi de `noindex`, listelerde görünmemesi istenir |
| `ayni-niyet` | 1 | Yıllık izin aracı ve rehberi, yukarıdaki karar |
| `hiz-js` | 1 | Ana sayfa JS'i, aşağıda |

## Hız

Ölçüm: üretim çıktısı, yerel sunucu, gerçek Chrome, 375 genişlik, yavaş 4G ve 4 kat işlemci yavaşlatma. Laboratuvar ölçümüdür, gerçek kullanıcı değeri değildir. Google'ın iyi eşikleri: LCP 2,5 sn, INP 200 ms, CLS 0,1. INP bu ölçümde yoktur.

| Sayfa | LCP | CLS | CSS gzip | JS gzip |
|---|---:|---:|---:|---:|
| `/` | 3,7 ile 4,0 sn | 0,002 | 35 KB | 229 KB |
| `/programlar` | 0,9 sn | 0,017 | 5 KB | 0 |
| Program sayfası | 1,1 ile 1,2 sn | 0,004 ile 0,017 | 5 KB | 0 |
| Paket sayfası | 0,9 sn | 0,03 | 5 KB | 0 |
| Araç sayfası | 0,7 ile 0,9 sn | 0 ile 0,001 | 9 KB | 11 ile 27 KB |
| Rehber | 0,8 sn | 0,011 | 5 KB | 0 |
| Yasal | 0,6 sn | 0,033 | 5 KB | 0 |

199 sayfa 375 genişlikte tek tek açıldı: yatay taşma, kırık görsel, 404 yanıtı ve konsol hatası yok. Koyu tema ana sayfa ve bir program sayfasında denendi. CSS ve JS boyutu sayfa bazında makul, çoğu sayfa JS yüklemez.

**Ana sayfa eşiği aşıyor.** 31 istek, 10 sıralı betik ve 229 KB JS yükleniyor, ilk içerik JS çizilince görünüyor. Düzeltmesi pazar yeri uygulamasını bölmek veya ilk ekranı statik üretmektir. Tasarım ve mimari kararı olduğu için bu işte yapılmadı.

## Doğrulanamayanlar

- Gerçek telefonda, gerçek ağda ve Safari ile deneme yapılmadı.
- Google'ın hangi başlığı göstereceği önceden bilinemez.
- Benzerlik ölçümü Türkçe kök çözümlemesi yapmaz, "aynı arama" denetimi başlık kelimelerinden tahmin yürütür. Anahtar kelimeler adaydır. Hacim, sıra ve rakip verisi kullanılmadı.
- `spam-policies` sayfasındaki site itibarı ve ince ortaklık bölümleri ile sayfa tarihi okuyucu özetinden geldi.
- `apps/mobilya/takip.html` görseli teslim edilmiş işi gösteriyor, altındaki yazı "teklifi onayladığı sayfa" diyor. Küçük bir uyumsuzluk, işin kapsamı dışında kaldı.

## Kullanıcı kararı gerekenler

1. **Yasal metinler:** avukat onayı ve şirket bilgisi.
2. **Eş anlamlı paket başlıkları:** "Avukat Yazılımı" ile "Hukuk Bürosu Programı", "SMMM Ofisi" ile "Mali Müşavir", "Kreş" ile "Anaokulu", "Emlak Ofisi" ile "Emlak", "Pansiyon" ile "Otel", "Etüt Merkezi" ile "Kurs". Aynı kitleye farklı kelimeyle gidiyorlar. Search Console verisi olmadan değiştirmedim. Veri gelince aynı aramada iki sayfa görünüyorsa paket başlığına "Paketi" eklenir.
3. **Eczane rehberleri:** satışa kapalı programın iki rehberi dizine açık. İçerik işe yarıyor, tutulması önerilir. Program kalıcı kapanırsa yeniden bakılmalı.
4. **Genel PDF ve görsel araçları:** yararlı içerik rehberi, işin ana konusundan uzak birçok konuda içerik üretmeyi uyarı işareti sayar. 19 dosya aracı küçük işletmenin günlük işine yarıyor ama sektör yazılımına en uzak kısım. Yeni araç eklerken öncelik sektör işine verilmeli.
5. **Ana sayfa hızı:** pazar yeri uygulamasını bölme işi açılsın mı?
6. **E-posta:** `destek@nebsoft.com.tr` alan adıyla uyumsuz, gerçekliği doğrulanmadı.

## Birleştirme notu

`site/src/araclar/` altına yeni araç ekleyen oturumlar birleşince `node site/tools/build-araclar.js`, `node site/tools/build-sites.js`, `node site/tools/seo-denetim.js` sırayla çalıştırılmalı. Başlık 70, açıklama 165 sınırı artık tüm araçlarda test edilir. Rapordaki sayılar 44 araç içindir.

## Engelleyenler ve senden gerekenler

- **Engelleyen:** avukat onaylı yasal metinler ve şirket bilgisi.
- **Senden gereken:** yayında Search Console doğrulaması ve sitemap gönderimi, yukarıdaki kararlar.

## Test durumu

`node site/tools/seo-denetim.js` kesin hata 0. `seo-sayfalar`, `seo-denetim`, `araclar`, `araclar-dosya`, `paket`, `guven` testleri geçti. `npm test` zinciri bu kopyada 66 testin 61'inde geçti, `guven` düzeltildi. Kalan dördü bu işten değil: `kanal`, `roller-son`, `siparis-bulut` temiz `d5f4e06` kopyasında da aynı şekilde kalıyor, hazır `data/` klasörü olan başka bir kopyada geçiyor. `bilet-kural` saat bağımlı, temiz kopyada da düşüyor. XSD testi için ayrıca "atlandı" denetimi yapılmadı.
