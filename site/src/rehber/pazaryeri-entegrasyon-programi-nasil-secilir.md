---
title: Pazaryeri entegrasyon programı nasıl seçilir?
description: Birden çok pazaryerinde satan işletme için entegrasyon programı seçerken stok senkronu, eşleşmeyen ürün, paketleme ve kâr raporunda sorulacak sorular.
program: pazaryeri
keywords: pazaryeri entegrasyon programı, pazaryeri stok senkronizasyonu, Trendyol ve n11 için entegrasyon programı nasıl seçilir
updated: 2026-10-30
faq:
S: Pazaryeri entegrasyonuna ne zaman ihtiyaç duyulur?
C: Tek kanalda ve az siparişte panel yeterli olabilir. İkinci kanal açıldığında ortak stok sorunu başlar. Elle stok düzeltmeye vakit ayırmaya başladıysanız değerlendirme zamanı gelmiştir.
S: Entegrasyon programı stoğu anında günceller mi?
C: Güncelleme sıklığı pazaryerinin kurallarına bağlıdır. Örneğin Trendyol resmî dokümanı aynı isteğin 15 dakika içinde tekrarlanamayacağını belirtir. Bu yüzden anlık ifadesinin ne anlama geldiğini sorun.
S: Hepsiburada bağlantısı var mı?
C: NEBSOFT'ta Hepsiburada resmî dokümanı doğrulanamadığı için canlı seçilemiyor. Trendyol ve n11 canlı açık, ancak canlı kullanım öncesi test hesabıyla denenmelidir.
S: Varyantlı ürünler nasıl yönetilir?
C: Her varyantın kendi barkodu olmalıdır. NEBSOFT Pazaryeri programında şu an ürün tek barkod olarak tutuluyor, varyant grubu sonraki aşamada. Beden ve renk ağırlıklı satıyorsanız E-ticaret programına da bakın.
S: Fatura numarası pazaryerine otomatik gider mi?
C: Yalnızca gerçek e-Belge kesildiyse gitmelidir. Test faturası numarasının pazaryerine bildirilmemesi gerekir. Program bu ayrımı açıkça göstermelidir.
---

Pazaryerinde büyümenin ilk işareti sevindirici, ikincisi yorucudur. Yeni kanal açınca sipariş artar, sonra aynı ürünün son adedi iki ayrı panelde aynı anda satılır. İptal, müşteri şikâyeti, belki yaptırım. Entegrasyon programları bu noktada devreye girer ve neredeyse hepsi aynı şeyi vaat eder: tek panel. Oysa seçim tek panelin varlığıyla değil, işler ters gittiğinde ne olduğuyla ilgilidir. O yüzden bu rehberde tanıtım başlıklarını değil, sorunlu anları sıralıyoruz.

## Birinci sorun anı: tanınmayan barkod

Sipariş geldi, ama içindeki barkod programdaki hiçbir ürünle eşleşmiyor. Zayıf bir sistem bunu sessizce geçer. Stok düşmez, ürün satışta görünmeye devam eder, ertesi gün aynı ürün tekrar satılır. Şikâyetlerde sık geçen stok hatalarının önemli bir kısmı bu tür sessiz eşleşme sorunlarından doğabilir.

Satıcıya sorun: Eşleşmeyen ürün olursa nerede görürüm? NEBSOFT Pazaryeri'nde sipariş listesinde rozet ve menüde sayaç çıkar. Sipariş detayından ürünü seçip eşleştirirsiniz, stok düşer ve kod ürüne bağlanır. Eşleşmeden paketleme yapılamaz. Aynı barkodun iki ürüne kaydedilmesi de benzersizlik denetimiyle engellenir.

## İkinci sorun anı: stok gönderimi başarısız

"Otomatik senkron" dendiğinde sorun: Gönderim başarısız olursa ekranda ne görürüm? Hata nedeni yazıyor mu? Yeniden deneniyor mu? Pazaryeri tarafında da kurallar vardır. Örneğin Trendyol resmî geliştirici dokümanına göre fiyat ve stok güncellemesinde aynı istek 15 dakika içinde tekrar edilemez ve tek seferde gönderilebilecek kayıt sayısı sınırlıdır. Yani hiçbir program sınırsız anlık güncelleme yapamaz.

Bu sınırı yönetmenin yolu tampon stoktur. Son birkaç adedi pazaryerine kapatmak fazla satışı azaltır. Programda kanal bazında tampon tanımlayabiliyor musunuz, buna bakın.

## Üçüncü sorun anı: yanlış paket

Hacim artınca depo hatası kaçınılmaz olur. Program depoyu da yönetmelidir:

- Toplama listesi raf sırasına göre geliyor mu?
- Paketleme barkod okutmadan kapanmıyor mu?
- Yanlış ürün okutulunca uyarı veriyor mu?
- Toplu etiket ve fatura basılabiliyor mu?

Bunlar küçük ayrıntı değildir, çünkü iade ve müşteri şikâyetlerinin önemli bölümü deponun içinde başlar. Yanlış ürün gönderimini önlemek için ayrı bir yazı da hazırladık.

## Dördüncü sorun anı: test ile gerçeğin karışması

Kurulum aşamasında program simülasyonda çalışır. Tehlike, simülasyonun gerçek gibi görünmesidir. Şunları kontrol edin:

| Durum | Doğru davranış |
|---|---|
| Canlı olmayan kanalda sipariş çekme | Sipariş uydurulmaz, TEST yazar |
| Stok gönderimi | Durum değişmez, gönderilmediği söylenir |
| Soru yanıtı | Gönderilmedi uyarısı çıkar |
| Fatura | TEST fatura pazaryerine no olarak gitmez |
| Takip numarası | Rastgele üretilmez |

Bir programın kurulumda size söylediği doğruyu canlıda da söyleyeceğini varsayabilirsiniz. Kurulumda sahte başarı gösteren program canlıda da hatayı gizleyebilir.

## Beşinci sorun anı: para hesabı tutmuyor

Çok satıp az kazanmak pazaryerinin klasik tuzağıdır. Komisyon, kargo, hizmet bedeli ve ürün maliyeti düşüldükten sonra sipariş başına ne kaldığını görmelisiniz. Zarar eden siparişler ayrı listelenmeli. Hakediş tutarı ise tahmin ve gerçekleşen olarak ayrılmalıdır. Vadesi geçen bir ödemenin "ödendi" görünmesi nakit planınızı bozar. NEBSOFT'ta hakediş ekranı tahmini tutarları etiketle gösterir.

## Kanal durumunu netleştirin

Bir kanalın "desteklenmesi" ile canlı doğrulanmış olması farklıdır. Bizim durumumuz şöyledir:

- **Trendyol:** Sipariş, stok-fiyat ve soru akışları resmî dokümanla karşılaştırıldı. Canlıya çıkmadan satıcının test hesabıyla denenmesi gerekir.
- **n11:** Sipariş ve stok akışı resmî dokümanla doğrulandı. Aynı test şartı geçerli.
- **Hepsiburada:** Doküman doğrulanamadı, canlı seçilemez.

Her firmaya aynı soruyu sorun: Hangi kanal, hangi işlem, hangi doküman sürümü? Soru-cevap, iade çekme ve tedarik edilemedi bildirimi gibi işlemler kanal bazında değişebilir.

## Sizin ölçeğiniz için neler gerekli?

Küçük satıcı ile büyük satıcının sorusu farklıdır. Günde on sipariş işleyen işletme için barkod denetimi ve stok tamponu yeterli olabilir. Günde yüzlerce sipariş işleyen depo için toplama sırası, toplu etiket ve kullanıcı yetkileri belirleyicidir. Kaç kişinin aynı anda çalışacağını, depo telefonuyla mı bilgisayarla mı okutma yapılacağını düşünün. Telefonda sipariş listesinin kart şeklinde görünmesi, depoda ayakta çalışan kişi için ciddi kolaylıktır.

Fiyatlandırma modelini de sorun. Sipariş başına ücret mi, aylık sabit mi, kanal başına mı? Büyüdükçe faturanız nasıl değişecek, hesap edin. Excel'den ürün aktarımı ve varyant yönetimi gibi başlıklar sizin için kritikse bunların güncel durumunu da teyit edin. Biz bu iki konuyu sonraki dalgalarımıza aldık, bugün için elle giriş gerekir.

## Geçiş planı

Mevcut ürün listenizdeki barkodları temizlemeden entegrasyona başlamayın. Önce tek kanalı bağlayın, az sayıda ürünle bir hafta test edin, sonra diğerlerini ekleyin. Stok sayımını geçişten hemen önce yapın, çünkü programa başlangıçta yanlış rakam girerseniz sonradan tüm kanallara yanlış stok yayarsınız.

## Destek ve bağımlılık

Entegrasyon programı, siparişlerinizin geçtiği yol olduğu için bir kesinti doğrudan satış kaybıdır. Pazaryeri bir servisini değiştirdiğinde güncellemeyi kim, ne kadar sürede yapıyor, öğrenin. Programdan ayrılmak isterseniz ürün ve sipariş verinizi dışarı alabiliyor musunuz, bunu da sorun. Kampanya günlerinde destek ekibine ulaşılabiliyor mu sorusu, sakin bir salı günü sorulduğunda değersiz görünür, ama cevabını en çok o gün ararsınız.

## Sorunlu anları deneyin

Tanıtımı değil, sorunu sınayın. [NEBSOFT Pazaryeri Programı](/pazaryeriprogrami) ile 7 gün ücretsiz deneme yaparak eşleşmeyen ürün, yanlış barkod ve zarar eden sipariş senaryolarını örnek verilerde kendiniz görün, sonra kendi kanal hesabınızla ilerleyin.
