# SEO kuralları: yeni sayfa eklerken

Tüm herkese açık statik sayfalar `node site/tools/build-sites.js` ile üretilir. Üretilen HTML'i elle düzenlemeyin; kaynağı değiştirip yeniden derleyin.
Derleme sonrası: `node server/test/seo-sayfalar.test.js`. Yeni üst klasör eklediyseniz sunucuyu yeniden başlatın (`SITES` listesi açılışta okunur).

## Kaynaklar

| Ne | Nerede |
|---|---|
| Program sayfası | `site/src/products.js` + `market/catalog.js` |
| Anahtar kelime adayları | `products.js` sonundaki `ANAHTAR` |
| Yasal metin | `site/src/yasal/<ad>.md` (`kvkk`, `gizlilik`, `mesafeli-satis`, `iade`, `cerez`) |
| Rehber yazısı | `site/src/rehber/<slug>.md` |
| Son değişiklik tarihi | `site/src/lastmod.json` (üretici yazar, elle değiştirmeyin) |

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

- **Başlık ve açıklama eşsiz olur.** Başlık en çok 70, açıklama en çok 165 karakter (program sayfalarında test denetler).
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

## Anahtar kelime

- `keywords` listesi **adaydır**: hacim verisi yoktur, Search Console verisi gelince gözden geçirilir. Hacim veya sıra rakamı yazmayın.
- Sayfanın konusu birincil terimdir; ikincil terimler alt başlıkta ve bir doğal cümlede geçer, uzun kuyruk terimler SSS ve rehberlerde karşılanır.
- Doldurma yapmayın: aynı terimi art arda tekrarlamayın, terim listesini sayfaya basmayın, kullanıcıya yararı olmayan cümle yazmayın.

## İçerik doğruluğu

- Yorum, müşteri sayısı, puan, "1 numara" gibi kanıtsız iddia yazılmaz. Şemaya `aggregateRating` veya `review` uydurulmaz.
- SSS cevabı yalnızca `catalog.js` içindeki gerçek özelliğe dayanır.
- Sıralama garantisi verilmez.

## Kalite kontrolü (noindex)

Üretici her sayfayı denetler. Ana içerik 120 kelimenin (rehberde 200) altındaysa ya da başlık, açıklama veya H1 eksikse sayfaya `noindex,follow` eklenir, sayfa `sitemap.xml` dışında kalır ve derleme çıktısında `!` ile uyarılır. Sayfa yayında kalır, yalnızca dizine girmez.

`noindex` sayfaları `robots.txt` ile kapatmayın: Google taramazsa `noindex` etiketini göremez ([Google, 2025-12-10](https://developers.google.com/search/docs/crawling-indexing/block-indexing)).

## Yapısal veri (JSON-LD)

| Sayfa | Şema |
|---|---|
| Hepsi | Organization, WebSite, BreadcrumbList |
| Program | SoftwareApplication (AggregateOffer), FAQPage |
| Rehber | BlogPosting, FAQPage (soru varsa) |
| Fiyatlar | FAQPage |
| Yasal | WebPage |

Bilinen sınırlar (2026-10-30 tarihinde resmî dokümandan okundu):

- Google, SSS zengin sonucunu kaldırdı ([FAQPage dokümanı değişiklik kaydı](https://developers.google.com/search/docs/appearance/structured-data/faqpage)). `FAQPage` geçerli şema olarak durur, Google sonuçlarında görsel fark beklemeyin.
- Yazılım uygulaması zengin sonucu için `aggregateRating` veya `review` gerekir ([2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/software-app)). Gerçek yorum olmadan bu alanlar eklenmez, bu yüzden program sayfaları bu zengin sonuca uygun değildir.

## Sitemap ve lastmod

- `lastmod` yalnızca başlık, açıklama veya ana içerik değişince güncellenir; alt bilgi ve yıl değişikliği sayılmaz. Google yalnızca tutarlı ve doğru `lastmod` değerini kullanır; `priority` ve `changefreq` değerlerini yok sayar ([2026-07-08](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)). Bu yüzden ikisi de yazılmaz.
- Rehber ve yasal metinde `updated` alanı `lastmod` olur. Bu alanı yalnız anlamlı değişiklikte değiştirin.

## Hız

- CSS değişince `site.css?v=<özet>` adresi kendiliğinden değişir; üreticiyi çalıştırmak yeterlidir.
- Program görseli değişince küçük kopyayı yenileyin: `node site/tools/kucult.js` (yüklü Chrome ve Node 22+ gerekir).
