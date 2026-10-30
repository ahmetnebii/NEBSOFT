---
title: Toptan satışta risk limiti nasıl uygulanır?
description: Vadesi geçen alacak büyümeden önce müşteri riskini ölçün. Bakiye, açık sipariş ve çeki birlikte hesaplayarak toptan satışta risk limitini uygulayın.
program: toptan
keywords: risk limiti, toptan satış alacak takibi, toptan satışta risk limiti nasıl uygulanır
updated: 2026-10-30
faq:
S: Risk limiti ile kredi limiti aynı mı?
C: Günlük dilde çoğu zaman aynı anlamda kullanılır. Burada kastedilen, müşteriye vereceğiniz toplam borç ve açık alışveriş sınırıdır. Sınır aşılınca yeni sevkiyat onaya düşer.
S: Yeni müşteriye limit ne kadar verilmeli?
C: Sabit rakam yoktur. Ticari geçmişini, sipariş büyüklüğünü ve ödeme şeklini değerlendirin. Düşük başlayıp ödeme düzeni oturdukça artırmak yaygın ve güvenli bir yaklaşımdır.
S: Müşterinin çeki risk hesabına girer mi?
C: Tahsil edilmemiş çek, henüz para değildir. Bu yüzden risk hesabına eklenmelidir. Çek tahsil edilince risk düşer, karşılıksız çıkarsa borç satırı açılır.
S: Plasiyer limiti değiştirebilmeli mi?
C: Hayır. Limit kararı muhasebe veya yönetimde olmalıdır. Plasiyer müşteriyle pazarlık yapan taraf olduğundan bu alanda yetkisi olmaması fiyat ve risk disiplinini korur.
S: İyi müşteri limit aşarsa ne yapılmalı?
C: Onaya düşen siparişi yönetici değerlendirir. Müşteriyle konuşup ödeme alınabilir veya limit geçici olarak artırılabilir. Kararın gerekçesi not edilmelidir.
---

Bir bakkalın borcu aylardır küçük görünüyordu. Ufak ufak büyüdü, her seferinde "bu ay kapatırım" dendi, plasiyer de müşteriyi kaybetmemek için yükledi. Sonra çek geri geldi, dükkân el değiştirdi ve siz bir kalem zararla kaldınız. Toptancının en büyük riski malı satamamak değil, satıp parasını alamamaktır. Risk limiti soğuk bir muhasebe kuralı gibi görünür, ama aslında büyüyen ilişkileri sağlıklı tutan bir emniyet kemeridir. Uygulaması ise sanıldığından kolaydır, yeter ki doğru rakama bakın.

## Bakiye gerçek riski göstermez

En yaygın hata, müşterinin riskini cari bakiyesinden okumaktır. Örnek bir müşteriyi inceleyelim:

| Kalem | Tutar |
|---|---|
| Cari bakiye | 80.000 TL |
| Sevk edilmemiş açık sipariş | 35.000 TL |
| Tahsil olmamış çek | 50.000 TL |
| **Gerçek risk** | **165.000 TL** |

Sadece bakiyeye baksaydınız 80.000 TL diyecektiniz. Oysa açık sipariş yarın borca dönüşecek, çek ise henüz para değil. Karşılıksız çıkarsa aynı tutar geri dönecek. Gerçek risk, bu üçünün toplamıdır. NEBSOFT Toptancı Programı'nda risk bakiye, açık sipariş ve tahsil olmamış çek toplamı olarak hesaplanır.

## Müşterileri sınıflayın

Her müşteriye aynı limiti vermek ne kadar yanlışsa, kişisel yakınlığa göre vermek de o kadar risklidir. Basit bir sınıflandırma yapın. Örneğin:

| Sınıf | Tanım | Yaklaşım |
|---|---|---|
| A | Uzun süredir düzenli öder | Geniş limit, standart vade |
| B | Ödüyor, ara sıra sarkıyor | Makul limit, yakın takip |
| C | Yeni veya düzensiz | Düşük limit veya peşin |
| D | Sorunlu | Yalnızca peşin |

Sınıflandırma için geçmiş ödeme alışkanlığına, ortalama sipariş tutarına ve ticari durumuna bakın. Müşteri hakkında dışarıdan bilgi edinmek istiyorsanız hangi kaynakları kullanabileceğinizi hukuk danışmanınızla konuşun. Sınıfı yılda birkaç kez gözden geçirin. Yeni müşterinin ilk aylarını yakından izleyin, çünkü ödeme alışkanlığı en çok bu dönemde görünür.

## Limit tutarını belirleme

Pratik bir başlangıç şu olabilir: müşterinin aylık ortalama alımı, vade süresi ile çarpılır. Aylık 100.000 TL alan ve 45 gün vadeli çalışan bir müşteri için normal risk düzeyi yaklaşık 150.000 TL civarındadır. Bu sayıyı sınıfa göre ayarlayın. Sabit bir kural değildir, kendi sektörünüz ve nakit gücünüze göre düşünün. Her müşteriye verdiğiniz toplam limiti de hesaplayın. Toplam dışarıdaki riskiniz, işletmenizin taşıyabileceğinden fazla olmamalıdır.

## Kuralı siparişe bağlayın

Limit bir Excel sütununda duruyorsa işe yaramaz. Sipariş anında çalışmalıdır. Akış şöyle kurulabilir:

1. Plasiyer sipariş girer.
2. Sistem yeni riski hesaplar.
3. Limit içindeyse sipariş ilerler.
4. Limit aşılıyorsa onaya düşer.
5. Yönetici ödeme alma, kısma veya onaylama kararı verir.

Bayi portalından gelen siparişler de aynı kuraldan geçmelidir. Vadesi geçmiş borcu olan bayinin siparişi onaya düşürülür. Sunucu aynı kuralı uygular, böylece tarayıcıda atlanamaz.

Plasiyere limit değiştirme yetkisi vermeyin. NEBSOFT'ta plasiyer limit, vade ve fiyat listesini göremez, değiştiremez. Bu yetkiyi sınırlamak, plasiyeri de korur. Müşteri baskısına karşı "karar merkezde" diyebilmesi, ona güçlü bir cevap verir.

## Çek ve senet disiplini

Toptancıda çek, nakitten sonra en çok kullanılan araçtır, ama kendi riskini getirir. Kurallarınız net olsun:

- Vade ve çek numarası olmadan kayıt alınmaz.
- Keşideci bilgisi yazılır.
- Bankaya verme ve tahsil durumu izlenir.
- Karşılıksız çek ödeme sayılmaz.

Programımızda karşılıksız durumuna geçen çek ödeme olmaktan çıkar, ekstrede borç satırı oluşur. Bu nokta önemlidir, çünkü bazı sistemlerde karşılıksız çek ödeme sayılmaya devam eder ve müşteri limitine yeniden yer açar. Hukuki süreçler için avukatınıza başvurun.

## Erken uyarı işaretleri

Limit aşımından önce bazı sinyaller görülür:

- Ödeme günü sarkıyor.
- Çek vadesi uzuyor.
- Sipariş tutarı aniden artıyor.
- Ürün çeşidi daralıyor.
- Yetkili kişi telefona çıkmıyor.
- Tanıdığınız dükkânın işi el değiştiriyor.

Plasiyer sahada bu sinyalleri ilk görendir. Onu bilgilendirici olarak kullanın. Ziyaret notuna kısa bir gözlem yazması, yönetim için değerlidir. Kayıp müşteri riski raporu da sipariş kesen müşteriyi gösterir. Bazen sipariş kesmek ödeme sorununun ilk habercisidir.

## Yaşlandırma raporunu okuyun

Haftada bir alacak yaşlandırma raporuna bakın. Vadesi yeni gelen, biraz geçen ve uzun geçen alacakları ayırın. Uzayan gruplarda büyüyen bakiyeyi aramaya öncelik verin. Plasiyerin haftalık planına tahsilat hedefi de ekleyin. Satış hedefi yalnızca cironun peşinden koştuğunda, risk limiti iç çatışmaya dönüşür. Tahsil edilmiş ciro ölçütü, plasiyerin çıkarını şirketinkiyle hizalar.

## Müşteriyle konuşma

Limit aşımını müşteriye söylerken suçlayıcı olmayın. "Sistem onaya düşürdü, cari tarafta küçük bir kapatma yapabilirsek bugün yükleyelim" cümlesi kırıcı değildir. Tahsilatı ikna için fırsat olarak kullanın. Ödeme planı yazılı olsun, tarih verilsin ve takip edilsin. İyi bir müşteri için geçici limit artışı mümkündür, ama her istisnanın kim tarafından ve neden verildiği yazılmalıdır.

## Bir müşteriyi deneyin

Limit kurallarını bir kez yazıp bırakmayın, her dönem başında gözden geçirin. En büyük on müşterinizin gerçek riskini bakiye, açık sipariş ve çek toplamıyla hesaplayın. Sonuç muhtemelen şaşırtacaktır. [NEBSOFT Toptancı Programı](/toptanciprogrami) riski sipariş anında kontrol eder ve limitini aşan siparişi onaya düşürür. 7 gün ücretsiz deneyin ve örnek bir aşımın nasıl yönetildiğini görün.
