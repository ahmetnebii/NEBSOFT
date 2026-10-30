---
title: E-ticarette kısmi iade nasıl yönetilir?
description: Üç üründen biri döndüğünde stok, ciro ve fatura kayıtları karışmasın. Kısmi iade için depo, kasa ve müşteri tarafında işleyen bir düzen kurun.
program: eticaret
keywords: kısmi iade, e-ticaret iade süreci, e-ticarette kısmi iade stok ve ciro nasıl yönetilir
updated: 2026-10-30
faq:
S: Kısmi iade ile tam iade arasındaki fark nedir?
C: Tam iadede siparişteki tüm ürünler geri döner. Kısmi iadede yalnızca bir bölümü döner, kalan ürünler müşteride kalır. Kayıtlarda da siparişin yalnızca dönen kısmı düzeltilmelidir.
S: İade edilen ürün hemen stoğa eklenmeli mi?
C: Hayır. Önce ürünü kontrol edin. Satılabilir durumdaysa stoğa alın, hasarlıysa ayrı tutun. Program bu kararı size bırakmalı, her iadeyi otomatik stoğa eklememelidir.
S: Kuponlu siparişte iade tutarı nasıl hesaplanır?
C: Kupon indiriminin ürünlere dağıtılmış payını düşmeniz gerekir. Müşteriye ürünün liste fiyatı değil, ödediği tutar geri verilir. Hesabınızı iade öncesi kontrol edin.
S: İade faturası gerekiyor mu?
C: Belge düzeni işletmenizin durumuna ve müşterinin faturalı olup olmadığına göre değişir. Doğru belge akışını mali müşavirinizle belirleyin ve her işlemde aynı yolu izleyin.
S: Kargo ücreti de iade edilir mi?
C: Bu durum iade nedenine ve mağaza koşullarınıza bağlıdır. Yasal hakları hukuk danışmanınızla gözden geçirin, mağaza politikanızı sitede açıkça yazın.
---

Müşteri üç ürün aldı, gömleği beğendi, pantolonu tuttu, ayakkabıyı geri gönderdi. Kâğıt üstünde basit bir olay. Ama iade yazılımda "siparişi iptal et" düğmesinden ibaretse sonuç kötü olur: gömlek ve pantolon stoğa geri eklenir, ciro sıfırlanır, müşteriye fazla para dönme riski doğar. Ay sonunda depodaki sayım ile ekran birbirini tutmaz. Kısmi iade, e-ticaretin en sıradan ama en çok kayıt bozan işlemidir. Düzeni kurmak için depodaki adımdan başlayalım.

## İade kaç adımdan oluşur?

Tek bir "iade" işlemi aslında dört ayrı karardır ve her birinin sorumlusu olmalıdır:

| Adım | Soru | Sorumlu |
|---|---|---|
| Talep | Müşteri ne iade ediyor, neden? | Müşteri hizmetleri |
| Kabul | Paket geldi mi, içerik doğru mu? | Depo |
| Kontrol | Ürün tekrar satılabilir mi? | Depo |
| Geri ödeme | Ne kadar, hangi yöntemle? | Muhasebe veya mağaza sahibi |

Küçük işletmede bu dört rolü aynı kişi üstlenebilir. Yine de adımları ayrı düşünmek gerekir. Paketi açmadan para iadesi yapmak en sık yapılan hatadır.

## Depoda paket açma düzeni

İade gelen paketi rafa koymadan önce masaya alın. Sipariş numarasını bulun ve şunları kontrol edin:

- Gelen ürün, siparişteki ürünle aynı mı?
- Adet doğru mu?
- Etiket yerinde mi, ürün kullanılmış görünüyor mu?
- Hasar varsa kargodan mı kaynaklanmış?

Hasar veya içerik uyuşmazlığı varsa fotoğraf çekin ve tarihle saklayın. Tartışma çıktığında bu kayıt işinize yarar. Ürünün durumunu üç gruba ayırın: satılabilir, indirimli satılabilir, satılamaz. Yalnızca ilk grup normal stoğa girmelidir.

## Programda doğru kayıt

Burada iki şey aynı anda doğru olmalıdır: stok ve para. Doğru bir kısmi iade kaydında şunlar yapılır:

1. Siparişteki ürün ve adet seçilir.
2. İade tutarı girilir veya kontrol edilir.
3. "Stoğa ekle" seçeneği ürünün durumuna göre işaretlenir.
4. Sipariş durumu "Kısmi iade" olur, tüm ürünler dönerse "İade edildi" olur.

NEBSOFT E-ticaret bu akışla çalışır. Sipariş detayından ürün ve adet seçilir, iade tutarı girilir, stoğa dönüp dönmeyeceği ayrıca sorulur. Raporlarda brüt ciro yerine net ciro görünür. Bu ayrım önemlidir, çünkü iadeleri düşmeyen ciro sizi olduğunuzdan başarılı gösterir.

## Doğru tutarı hesaplamak

En sinsi sorun indirimli siparişlerde çıkar. Örnek bir hesap yapalım. Müşteri 300 TL ve 700 TL'lik iki ürün aldı, 100 TL kupon kullandı ve 900 TL ödedi. 300 TL'lik ürünü iade ediyor. Kuponu ürünlere tutarlarına göre dağıtırsanız bu ürüne 30 TL indirim düşer, iade tutarı 270 TL olur. 300 TL iade ederseniz müşteriye fazla ödeme yapmış olursunuz.

Bu hesap kendi kuponu politikanıza göre değişebilir, önemli olan tek bir kuralı seçip her seferinde uygulamaktır. Kapıda ödeme bedeli ve kargo ücreti gibi kalemlerde de ne yapacağınızı önceden yazın. Mağaza iade koşullarınızı sitede gösterin, yasal yükümlülükler için hukuk danışmanınızdan görüş alın.

## Fatura ve muhasebe tarafı

Fatura kesilmiş bir siparişte iade yalnızca stok konusu değildir. Hangi belgeyi düzenleyeceğiniz müşterinin bireysel ya da kurumsal olmasına göre değişebilir. Bunu her iadede yeniden düşünmemek için mali müşavirinizle bir kez oturup kısa bir yönerge hazırlayın: hangi durumda ne yapılacak, hangi belge saklanacak. Fatura toplamı ile tahsilatın kuruşu kuruşuna eşleşmesi temel kuraldır. Fark oluştuğunda ay sonunda nedenini bulmak saatler alır.

## Müşteriye ne söylemeli?

İade sürecinde müşterinin en büyük kaygısı parasının ne zaman döneceğidir. Her aşamada kısa bilgi verin: paket ulaştı, kontrol edildi, ödeme başlatıldı. Sektör genelinde şikâyetler çoğunlukla sessizlikten doğar. Müşteri nerede olduğunu bilirse beklemeye razı olur. Şablon metin hazırlayın ama her müşteriye kopyala yapıştır olduğu belli olmasın, ad ve ürün bilgisini ekleyin.

Müşteri sitesinden iade talebi açabiliyorsa işiniz kolaylaşır, çünkü bilgi yazılı gelir. Telefonla alınan taleplerde ise ürün, adet ve nedeni mutlaka kaydedin.

## Pazaryerinden gelen iadeler

Aynı ürünü hem sitenizde hem pazaryerinde satıyorsanız iadeleri tek stokta birleştirmeniz gerekir. Pazaryeri iadesi kendi panelinde kapanırken stoğunuz güncellenmezse fazla satış riskiyle karşılaşırsınız. Bizim programımızda pazaryeri iadesini otomatik çekme özelliği sonraki aşamalardan biridir. Şimdilik pazaryerinden gelen iadeyi panelden elle işlemeniz gerekir, bunu haftalık bir kontrol listesine ekleyin.

## İade nedenlerini veriye çevirin

Her iadeye bir neden kodu verin: beden uymadı, görsel farklı, kusurlu, yanlış ürün, vazgeçti. Bir süre sonra örüntü görünür. Belirli bir üründe sürekli "beden uymadı" geliyorsa ölçü tablonuz eksiktir. "Görsel farklı" geliyorsa fotoğrafı değiştirin. "Yanlış ürün" artıyorsa sorun depoda, paketleme aşamasındadır. İade maliyetini azaltmanın yolu bu listeyi okumaktan geçer.

Bu veriyi ay sonunda küçük bir toplantıda paylaşın. Ürün sayfası, depo ve müşteri hizmetleri aynı listeye baktığında sorun kişilerin değil, sürecin konusu olur.

## Politika metnini sade yazın

Müşteri iade sayfasını genellikle sinirli ya da endişeliyken okur. Hukuki dille yazılmış uzun bir metin yerine kısa maddeler kullanın: nasıl başvurulur, paket nereye gönderilir, para ne zaman döner, hangi ürünler kapsam dışıdır. Metni hukuk danışmanınıza kontrol ettirin, sonra sade bir dille sitenize koyun. Destek ekibiniz de aynı metinden çalışsın ki iki kişi iki farklı cevap vermesin.

## Bir test iadesiyle başlayın

Politikanızı yazın, sonra gerçek bir senaryoyu deneyin. [NEBSOFT E-ticaret Paketi](/eticaretpaketi) ile 7 gün ücretsiz deneme yaparak üç kalemli kuponlu bir sipariş oluşturun, tek ürünü iade edin ve stok ile net cironun nasıl değiştiğini kendi gözünüzle görün.
