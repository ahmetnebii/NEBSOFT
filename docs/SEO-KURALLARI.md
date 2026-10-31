# SEO kuralları: yeni sayfa eklerken

Tüm herkese açık statik sayfalar `node site/tools/build-sites.js` ile üretilir. Üretilen HTML'i elle düzenlemeyin; kaynağı değiştirip yeniden derleyin.
Derleme sonrası: `node site/tools/seo-denetim.js` kesin hata vermemeli, ardından `node server/test/seo-sayfalar.test.js`. Yeni üst klasör eklediyseniz sunucuyu yeniden başlatın (`SITES` listesi açılışta okunur).

## Denetim

`node site/tools/seo-denetim.js` tüm üretilmiş sayfaları okur. Kesin hata yayını durdurur, uyarı nedeniyle `docs/SEO-DENETIM.md` içinde yazılır. `--uyari`, `--benzerlik`, `--json dosya` seçenekleri vardır. Yeni uyarı türü testi düşürür.

| Kesin hata | Uyarı |
|---|---|
| Başlık veya açıklama yok, tekrar, 70/165 karakter aşımı | 60 karakteri aşan başlık, kısa açıklama, başlık kalıbı |
| H1 sayısı 1 değil, canonical yanlış, robots değeri geçersiz | Yönlenen iç bağlantı, `nofollow`, 3 tıklamadan derin sayfa |
| OG ve Twitter alanı eksik, `og:image` dosyası yok | `og:image` ölçüsü yok |
| JSON-LD bozuk, `aggregateRating` veya `review` var, SSS şeması sayfada görünmüyor | Aynı aramayı hedefleyen başlıklar |
| Görselde `alt`, `width`, `height` eksik, kırık bağlantı veya varlık | Tembel yüklenmeyen veya tembel yüklenen LCP görseli |
| Sitemap ile dosya uyumsuz, `noindex` sayfa sitemap'te, gelecek `lastmod` | %50 üstü metin benzerliği, düşük özgün oran |
| `domain.com` veya yerel adres kalıntısı | Büyük HTML, CSS, JS veya LCP görseli |
| Dizine açık yetim veya ana sayfadan ulaşılamayan sayfa, %85 üstü kopya | `noindex` yetim sayfa |

## Kaynaklar

| Ne | Nerede |
|---|---|
| Program sayfası | `site/src/products.js` + `market/catalog.js` |
| Anahtar kelime adayları | `products.js` sonundaki `ANAHTAR` |
| Yasal metin | `site/src/yasal/<ad>.md` (`kvkk`, `gizlilik`, `mesafeli-satis`, `iade`, `cerez`) |
| Rehber yazısı | `site/src/rehber/<slug>.md` |
| Hazır paket | `market/paketler.js` (liste) + `site/src/paketler.js` (metin) |
| Yenilikler | `site/src/yenilikler.json` (her kayıt bir commit'e bağlı) |
| Yol haritası | `site/src/yol-haritasi.json` (tarih verilmez) |
| Bayilik, veri taşıma, sistem durumu | `site/tools/guven-sayfalari.js` |
| Son değişiklik tarihi | `site/src/lastmod.json` (üretici yazar, elle değiştirmeyin). Özet görünen metinden alınır, tasarım değişikliği tarihi oynatmaz |
| Üst menü, alt bilgi | `market/kabuk.js`, `market/kabuk.css` (ana sayfa ve statik sayfalar aynı parçayı kullanır) |
| Statik sayfa stili | `site/src/tasarim.css`, `site/assets/site.css` üretilir, elle değiştirmeyin |
| Kart görselleri | `site/tools/gorsel.js`, ayrıntı `docs/TASARIM-BUTUNLUK.md` |

Rehber dosyası biçimi:

```
---
title: Market programı nasıl seçilir
description: Arama sonucunda görünecek 120-160 karakterlik özet.
program: pos
keywords: market programı, barkodlu satış
updated: 2026-10-30
faq:
S: Soru?
C: Cevap.
---

## Başlık

Gövde: başlık, liste, paragraf, tablo. Ham HTML kabul edilmez.
```

`program`, `products.js` içindeki `id` değeridir. Yazı ile program sayfası arasındaki karşılıklı bağlantı buradan kurulur.

## Her sayfada

- **Başlık ve açıklama eşsiz olur.** Başlık en çok 70, açıklama en çok 165 karakter. Bu proje kuralıdır: Google'da sayı sınırı yoktur, sonuçta cihaz genişliğine göre kesilir ([title-link, 2025-12-10](https://developers.google.com/search/docs/appearance/title-link), [snippet, 2026-04-20](https://developers.google.com/search/docs/appearance/snippet)). İlk 60 karaktere asıl konuyu koyun.
- **Tek H1.** Başlık ile aynı olmak zorunda değil; sayfanın ne olduğunu söylemeli.
- **Canonical tektir.** Program sayfaları ve `/programlar` sonda `/` olmadan, diğerleri sonda `/` ile. Yeni bir `/`li üst klasörü `server.js` içindeki `SLASHED` listesine ekleyin.
- **Görsel:** `width` + `height` zorunlu; ilk ekrandaki görsel hariç `loading="lazy"`.
- **Bağlantı:** Herkese açık sayfaya gerçek adresle bağlanın (`/fiyatlar/`). `#/` yalnız uygulama içi akışlar içindir (kayıt, giriş, sepet, ödeme, hesabım).

## Ücretsiz araç sayfası

Kaynak `site/src/araclar/<slug>.js`, derleme `node site/tools/build-araclar.js`, sonra `node site/tools/build-sites.js`.

- Yeni araç gerçekten farklı bir iş yapmalıdır. Aynı işin biçim, şehir veya sektör çeşidi için sayfa açılmaz; bu aramalar mevcut sayfada, doğal cümleyle karşılanır.
- Sayfada araç çalışır. Sonuç almak için kayıt, üyelik veya programa geçiş istenmez.
- Metin elle yazılır, aracın sınırını da söyler. Başka araçta geçen cümle özgün sayılmaz, 200 özgün kelime altı `noindex` olur.
- Dosya aracı dosyayı sunucuya göndermez. `isle` alanı olan araçlarda sayfa `connect-src` kuralı derleyiciden gelir, kaldırılmaz.
- Ayrıntı ve Google kaynakları: `docs/ARACLAR-DOSYA.md`.

### Yeni araç kontrol listesi

Yayından önce sırayla:

1. Bu iş mevcut bir sayfada karşılanmıyor mu? Biçim, şehir veya sektör çeşidiyse yeni sayfa açılmaz.
2. Araç sayfanın kendisinde üyeliksiz sonuç veriyor mu? Tarayıcıda baştan sona denendi mi?
3. `baslik` en çok 70, `ozet` en çok 165 karakter mi? Hazır kalıp değil, sayfanın yaptığı iş mi yazıyor?
4. Metin elle yazıldı mı, sınırı söylüyor mu? En az 200 özgün kelime kuralını geçiyor mu? Yapay zekâ taslağı kullanıldıysa başlık, açıklama ve şema dahil bir insan kontrol etti mi?
5. Mevzuat varsa resmî kaynak, adres ve okunma tarihi yazılı mı?
6. `site/tools/gorsel.js` içine aracın işini gösteren sahne yazıldı mı?
7. SSS gerçek davranışı mı anlatıyor? Yorum, puan, müşteri sayısı yok mu?
8. `program` alanı gerçekten ilgili programı mı gösteriyor? Program sayfasına bağlantı buradan kurulur.
9. Sırayla: `node site/tools/build-araclar.js`, `node site/tools/build-sites.js`, `node site/tools/seo-denetim.js`, `node server/test/araclar.test.js`. Kesin hata 0 olmalı, yeni `ayni-niyet` veya `benzer` uyarısının kararı yazılmalı.
10. 375 genişlikte ve koyu temada denendi mi?

### Aynı anda kaç araç yayınlanmalı

**Google'da sabit sayı kuralı yoktur.** Spam politikaları, yararlı içerik, üretken yapay zekâ ve tarama bütçesi sayfalarının hiçbiri günlük veya toplu sayfa sınırı vermez (okuma: 2026-10-31). Google sayıya değil amaca bakar: toplu içerik kötüye kullanımı, kullanıcıya yardım yerine sıralama için çok sayıda sayfa üretmektir, üretim yöntemi fark etmez ([spam politikaları, 2026-08-28](https://developers.google.com/search/docs/essentials/spam-policies)). Tarama bütçesi de bu site için konu değildir: rehber yaklaşık 1 milyon sayfa veya hızlı değişen 10 bin sayfa üstünü hedefler ve bu rakamların yaklaşık olduğunu söyler ([2026-07-22](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget)).

**Önerimiz, Google kuralı değil:** ilk yayında kalite kapısını geçen araçlar birlikte açılır, sonrasında **haftada en çok 5 yeni araç** eklenir. Nedenleri:

- Her aracı gerçek tarayıcıda denemek ve metni okumak zaman ister. Kısıt Google değil, kalite kontrolümüzdür.
- Tarama birkaç günden birkaç haftaya sürebilir ([2025-12-10](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)). Küçük grupta sorunun hangi sayfalardan geldiği görülür.
- Google yeni sayfaları genelde alan adının genel kalitesine göre varsayar. Zayıf toplu ekleme tüm siteyi etkileyebilir ([spam politikaları](https://developers.google.com/search/docs/essentials/spam-policies)).

Search Console gelince önceki grup izlenir: "Tarandı, dizine eklenmedi" payı büyükse yeni araç eklenmez, önce sebep çözülür. Sayı bu veriye göre gözden geçirilir. Tarih değiştirerek sayfayı yeni göstermek yasaktır.

## Anahtar kelime

- `keywords` listesi **adaydır**: hacim verisi yoktur, Search Console verisi gelince gözden geçirilir. Hacim veya sıra rakamı yazmayın.
- Sayfanın konusu birincil terimdir; ikincil terimler alt başlıkta ve bir doğal cümlede geçer, uzun kuyruk terimler SSS ve rehberlerde karşılanır.
- Doldurma yapmayın: aynı terimi art arda tekrarlamayın, terim listesini sayfaya basmayın, kullanıcıya yararı olmayan cümle yazmayın.

## İçerik doğruluğu

- Yorum, müşteri sayısı, puan, "1 numara" gibi kanıtsız iddia yazılmaz. Şemaya `aggregateRating` veya `review` uydurulmaz.
- SSS cevabı yalnızca `catalog.js` içindeki gerçek özelliğe dayanır.
- Sıralama garantisi verilmez.

## Kalite kontrolü (noindex)

Üretici her sayfayı denetler. Ana içerik 120 kelimenin (rehberde 200, hazır pakette 220) altındaysa ya da başlık, açıklama veya H1 eksikse sayfaya `noindex,follow` eklenir, sayfa `sitemap.xml` dışında kalır ve derleme çıktısında `!` ile uyarılır. Sayfa yayında kalır, yalnızca dizine girmez.

`noindex` sayfaları `robots.txt` ile kapatmayın: Google taramazsa `noindex` etiketini göremez ([Google, 2025-12-10](https://developers.google.com/search/docs/crawling-indexing/block-indexing)).

## Kullanım kılavuzu PDF'leri

Karar: PDF'ler herkese açık iner ama arama sonucuna girmez. `/indir/kilavuz/` altındaki yanıtlar `X-Robots-Tag: noindex` başlığı taşır (`server.js`).

Gerekçe:

- Kılavuzlarda roller, yedekleme ve entegrasyon gibi bölümler ortaktır, PDF'ler birbirine benzer. Dizine girerlerse kopya içerik gibi davranırlar.
- Aramadan gelen ziyaretçinin inmesi gereken sayfa program sayfasıdır. PDF'te fiyat, deneme düğmesi ve site içi gezinme yoktur.
- `rel=canonical` başlığı seçilmedi: Google bunu aynı içeriğin kopyaları için tanımlar, kılavuz program sayfasının kopyası değildir ([Google, 2026-07-10](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
- HTML olmayan dosyada `noindex` için yöntem yanıt başlığıdır ([Google, 2026-03-24](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)).

Kurallar:

- `/indir/` yolunu `robots.txt` ile kapatmayın: Google taramazsa `noindex` başlığını göremez ([Google, 2025-12-10](https://developers.google.com/search/docs/crawling-indexing/block-indexing)).
- PDF `sitemap.xml` dosyasına girmez.
- Program sayfasındaki bağlantı üreticide tek yerdedir (`kilavuz()`, `site/tools/build-sites.js`), yalnız `core/kilavuz.json` kaydı olan programda görünür.

## Yapısal veri (JSON-LD)

Şemadaki bilgi sayfada görünür olmalı, güncel olmalı, yanıltmamalı ([yapısal veri kuralları, 2026-07-10](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)). Denetleyici SSS sorularını ve cevaplarını görünen metinde arar.

| Sayfa | Şema |
|---|---|
| Hepsi | Organization, WebSite, BreadcrumbList |
| Program | SoftwareApplication (AggregateOffer), FAQPage |
| Rehber | BlogPosting, FAQPage (soru varsa) |
| Hazır paket (sektör sayfası da budur) | ItemList, FAQPage. Fiyat şemaya yazılmaz |
| Fiyatlar | FAQPage |
| Yasal | WebPage |

Bilinen sınırlar (2026-10-30 tarihinde resmî dokümandan okundu):

- Google, SSS zengin sonucunu kaldırdı ([FAQPage dokümanı değişiklik kaydı](https://developers.google.com/search/docs/appearance/structured-data/faqpage)). `FAQPage` geçerli şema olarak durur, Google sonuçlarında görsel fark beklemeyin.
- Yazılım uygulaması zengin sonucu için `aggregateRating` veya `review` gerekir ([2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/software-app)). Gerçek yorum olmadan bu alanlar eklenmez, bu yüzden program sayfaları bu zengin sonuca uygun değildir.

## Sitemap ve lastmod

Sitemap'te yalnız dizine açık, kanonik, mutlak adresler bulunur ([canonical, 2026-07-10](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)). robots.txt tarama içindir, sayfayı dizin dışında tutmaz ([2025-12-10](https://developers.google.com/search/docs/crawling-indexing/robots/intro)).

- `lastmod` yalnızca başlık, açıklama veya ana içerik değişince güncellenir; alt bilgi ve yıl değişikliği sayılmaz. Google yalnızca tutarlı ve doğru `lastmod` değerini kullanır; `priority` ve `changefreq` değerlerini yok sayar ([2026-07-08](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)). Bu yüzden ikisi de yazılmaz.
- Rehber ve yasal metinde `updated` alanı `lastmod` olur. Bu alanı yalnız anlamlı değişiklikte değiştirin.

## Hız

Eşikler: LCP 2,5 sn, INP 200 ms, CLS 0,1 ([Core Web Vitals, 2025-12-10](https://developers.google.com/search/docs/appearance/core-web-vitals)). Sayfa deneyimi tek bir sıralama sinyali değildir ([2026-09-22](https://developers.google.com/search/docs/appearance/page-experience)). Yeni program görseli eklenince küçük kopya da üretilir, yoksa telefon büyük görseli indirir.

- CSS değişince `site.css?v=<özet>` adresi kendiliğinden değişir; üreticiyi çalıştırmak yeterlidir.
- Program görseli değişince küçük kopyayı yenileyin: `node site/tools/kucult.js` (yüklü Chrome ve Node 22+ gerekir).
