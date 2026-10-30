---
title: Toptancı ve plasiyer programı nasıl seçilir?
description: Toptancı ve distribütörler için saha satış programı seçerken plasiyer yetkisi, risk limiti, stok, çek takibi ve bayi siparişine nasıl bakılmalı?
program: toptan
keywords: toptancı programı, plasiyer programı, distribütör için saha satış programı nasıl seçilir
updated: 2026-10-30
faq:
S: Sıcak satış destekleniyor mu?
C: Araç deposu ile sıcak satış henüz yok. Program sipariş toplama ve sevkiyat modeline göre çalışır. Ayrı araç stoğu tutuyorsanız bu sınırı karar sürecinizde dikkate alın.
S: Plasiyer tüm carileri görebilir mi?
C: Hayır. Plasiyer yalnızca kendisine bağlı carileri görür. Limit, vade, fiyat listesi ve plasiyer alanı onda bulunmaz, cari de silemez. Yönetici tüm tabloyu görür.
S: Mal fazlası kampanyası faturada nasıl görünür?
C: Bedelsiz ürün faturada yüzde yüz iskontolu satır olarak gider. KDV matrahı açısından doğruluğu doğrulanmadığı için canlı kullanımdan önce mali müşavirinize mutlaka sorun.
S: Bayiler kendi fiyatını görür mü?
C: Evet. Bayi sayfasında yalnızca kendi liste fiyatı gönderilir. En az sipariş tutarı ve stok sunucuda denetlenir. Bayi 7 gün 24 saat sipariş verebilir.
S: e-Fatura ve e-İrsaliye hazır mı?
C: Teslimden sonra fatura kesilebilir, ancak gerçek gönderim sağlayıcı test hesabıyla henüz denenmedi. Sevk fişi irsaliye yerine geçmez. Canlı kullanım öncesi test ve mali müşavir görüşü gerekir.
---

Toptancılık işi depoda değil, sokakta kazanılır. Plasiyer sabah yola çıkar, on beş müşteriye uğrar, sipariş toplar, tahsilat alır, bakkalın sözlü isteğini not eder. Akşam ofise döndüğünde o gün sokakta olanların ne kadarı doğru ve eksiksiz sisteme girer? Bu sorunun cevabı nakit akışınızı, stok doğruluğunuzu ve müşteri ilişkinizi belirler. Pazarda birçok mobil satış yazılımı var. Karşılaştırırken mobil ekranın güzelliğinden önce, sahadaki kuralların merkezdekiyle aynı olup olmadığına bakmalısınız.

## Saha modelinizi belirleyin

İlk ayrım çalışma modelinizdir:

| Model | Nasıl çalışır |
|---|---|
| Sipariş toplama | Plasiyer sipariş alır, depo hazırlar, araç sonra teslim eder |
| Sıcak satış | Araçta stok, anında teslim ve fatura |
| Bayi siparişi | Bayi kendi portalından verir |

NEBSOFT Toptancı Programı sipariş toplama ve bayi siparişi modelinde çalışır. Araç deposu ile sıcak satış ayrı bir stok modeli gerektirdiği için henüz yoktur. Rota haritası ve plasiyer primi de sonraki aşamalardadır. Sıcak satış yapıyorsanız bu programı öncelikli düşünmeyin. Başlangıçta bunu bilmek, sonradan yaşanacak bir hayal kırıklığını önler.

## Plasiyer yetkileri

Sahada verilen yetki merkeze döner. Şunları kontrol edin:

- Plasiyer yalnızca kendi carilerini mi görüyor?
- Limit, vade ve fiyat listesini değiştirebiliyor mu?
- Cari silebiliyor mu?
- Vazgeçilen sipariş ziyaret kaydı bırakıyor mu?
- Plasiyerin iskonto sınırı var mı?

İskonto sınırı aşılırsa sipariş gerekçeyle onaya düşmelidir. Sınır plasiyer bazında veya genel ayarla belirlenmelidir. Bu kural, fiyat disiplinini korur. Sahadaki pazarlık sizin marjınızla yapılıyor, unutmayın.

## Stok ve kullanılabilir miktar

Toptancıda en acı hata, satılmış ürünü bir daha satmaktır. Stok miktarı ile kullanılabilir stok farklıdır. Kullanılabilir stok, eldeki stoktan açık siparişler düşülerek bulunur. Formda bu rakam görünmelidir. Sevkte eski sipariş öncelikli olmalı, yetmeyen kalem eksik sevk edilmelidir, kalanı beklemede kalmalıdır. NEBSOFT'ta bu şekilde çalışır.

Kısmi teslim ve iade de günlük olaydır. Müşteri dört koliden birini kabul etmeyebilir. Teslimatta gerçek miktar girilmeli, fark stoğa dönmeli, borçtan düşmelidir. Hasarlı ürün stoğa girmemelidir. Ekstrede de görünmelidir.

## Risk yönetimi

Müşteri borcunun yalnızca bakiye olarak görülmesi yanıltıcıdır. Gerçek risk bakiye, açık sipariş ve tahsil olmamış çekin toplamıdır. Bu mantıkla sipariş anında limit kontrolü yapılmalıdır. Vadesi geçen borçlu bayi onaya düşmelidir. Bu konuyu ayrı bir yazıda örnekledik.

## Tahsilat ve çek senet

Plasiyer sahada nakit, kart, çek ve senet alır. Her biri doğru kayda geçmelidir. Çek ve senet için vade ve numara zorunlu olmalıdır. Bankaya verildi, tahsil edildi ve karşılıksız durumları izlenmelidir. Karşılıksız çek ödeme sayılmamalı, ekstrede borç satırı oluşmalıdır.

Gün sonu plasiyer kasası da kritiktir. Son kapanıştan beri alınan tahsilat, sayılan nakit ve fark açıklaması bulunmalıdır. Açıklamasız fark reddedilmelidir. Akşam kasa teslimi yazılı olursa ay sonunda açık çıkmaz.

## Sevkiyat

Siparişler rota bazında birleşmeli, araç yükleme listesi hazır gelmelidir. Hazırlanıyor durumu görünür olmalıdır. Sevk fişi ile irsaliye karıştırılmamalıdır. Programımızın yazdırdığı "Sevk fişi" başlığı ve "irsaliye yerine geçmez" notu bu nedenle vardır. Yasal irsaliye sürecinizi mali müşavirinizle kurun. e-İrsaliye bağlantısı bugün canlıda değildir.

## Bayi siparişi

Bayi portalı, telefon trafiğini azaltır. Bayi kendi fiyat listesiyle sipariş verir, ekstresini görür, vadesi geçen tutarını izler. Tarayıcıya yalnızca bayinin liste fiyatı gönderilmelidir. Aksi halde taban fiyatınız ortaya çıkar. Teknik görünen bu ayrıntı ticari olarak büyük önem taşır. En az sipariş ve stok denetimi sunucuda yapılmalıdır, bayinin tarayıcısında kalmamalıdır. Bulutta gerçek bayi girişinin kendi ortamınızda denenmesi gerekir.

Sipariş önerisi, tekrar siparişi kolaylaştırır. Son altı siparişin en az ikisinde geçen ürünler olağan miktarıyla önerilir.

## Kampanyalar

Mal fazlası, toptan sektörünün klasik yöntemidir. Elli alana iki bedava gibi kampanyalar siparişe ve bayi portalına otomatik yansımalı, bayinin kendi bedelsiz satır göndermesi engellenmelidir. Bedelsiz adet stoktan düşmelidir. Faturada bu ürünün nasıl gösterileceğini mali müşavirinize mutlaka sorun. Programda yüzde yüz iskontolu satır olarak gider, KDV matrahı açısından doğruluğu doğrulanmadı.

## Raporlar

Yönetici için önemli raporlar: alacak yaşlandırma, plasiyer performansı, ziyaret uyumu, kayıp müşteri riski. Kırk beş günden uzun süredir sipariş vermeyen müşteri listesi, plasiyerin haftalık planına girmelidir. Büyük veriyle performans da önemlidir. Binlerce cari ve on binlerce siparişte ekranlar akıcı kalmalıdır.

## Geçiş sırası

Ürün ve cari listesini Excel'den aktarın, başlıkları eşleştirin. Her cariyi plasiyere bağlayın, risk limitlerini girin. İlk hafta bir plasiyerle pilot yapın. Sahada internet zayıf yerleri olacaktır, o koşulda test edin. Gün sonu kasa kuralını ilk günden uygulayın.

Plasiyerleri programa ikna etmeyi de planlayın. Elle not tutmaya alışmış bir plasiyer için ilk hafta yavaş geçer. Sistemin ona kendi carilerini, hedefini ve bekleyen tahsilatını gösterdiğini anlatın.

## Bir rotayla deneyin

Bir plasiyer, beş cari ve on ürün girin. Sipariş alın, limit aşımı yaşatın, eksik sevk edin, tahsilat girip gün sonu yapın. [NEBSOFT Toptancı Programı](/toptanciprogrami) 7 gün ücretsiz denenebilir. Plasiyerinizin telefonundaki ilk gün, size en net cevabı verecektir.
