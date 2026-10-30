---
title: E-ticaret paketi nasıl seçilir?
description: Kendi mağazanızı açarken e-ticaret paketinde varyant, ödeme, kargo, fatura ve pazaryeri bağlantısı konularında hangi sorular sorulmalı?
program: eticaret
keywords: e-ticaret paketi, hazır e-ticaret sitesi, küçük işletme için e-ticaret paketi nasıl seçilir
updated: 2026-10-30
faq:
S: Pazaryerinde satıyorum, kendi siteme de ihtiyacım var mı?
C: Zorunlu değildir. Kendi site, müşteri ilişkisini ve fiyatı kendi elinizde tutmak için bir seçenektir. Ancak trafik getirmek ayrı bir iştir, bu yüzden siteyi açmadan önce ziyaretçiyi nasıl çekeceğinizi planlayın.
S: Kartla ödeme almak için ne gerekir?
C: Bir sanal POS veya ödeme sağlayıcısı hesabı gerekir. Hesap bağlanmadan vitrinde kart seçeneği gerçek ödeme almaz. Kullandığınız pakette bu durumun açıkça gösterildiğinden emin olun.
S: Kapıda ödeme ve havale nasıl takip edilir?
C: Havale siparişi ödeme gelene kadar bekliyor görünmeli, ödeme gelince elle onaylanmalıdır. Kapıda ödeme ise teslimde tahsil edilmiş sayılır. Ödemesi alınmamış sipariş hazırlanırken program uyarmalıdır.
S: Ürün fotoğraflarını yükleyebilir miyim?
C: Paketten pakete değişir, görsel sayısı ve boyut sınırlarını mutlaka sorun. NEBSOFT'ta panelden ürün fotoğrafı yükleme henüz tamamlanmadı, bu nedenle fotoğraf sizin için kritikse bu durumu kararınızdan önce bizimle netleştirin.
S: Pazaryerlerine ürün göndermek için ne hazırlamalıyım?
C: Her varyant için benzersiz barkod ve stok kodu, doğru KDV oranı ve pazaryerinin kategori bilgileri gerekir. Barkod düzeni baştan kurulmazsa sonradan stok karışıklığı yaşanır.
---

Bir e-ticaret paketi aldığınızda aslında bir web sitesi değil, bir iş akışı satın alıyorsunuz. Tema güzel olabilir, ama ilk ciddi sipariş geldiğinde asıl sınav başlar. Ödeme gerçekten alındı mı? Stok düştü mü? Fatura tutarı siparişle aynı mı? Kargo takip numarası doğru mu? Bu dört sorunun herhangi birinde program sizi yanıltırsa müşteri kaybetmekten önce para kaybedersiniz. Bu yüzden önce vitrini değil, siparişin arkasındaki akışı inceleyin.

## Bir siparişi baştan sona izleyin

Paketi değerlendirmenin pratik yolu tek bir test siparişidir. Şöyle bir sepet kurun: iki ürün, biri indirimli, kupon uygulanmış, kapıda ödemeli. Sonra şu sırayla ilerleyin:

1. Sipariş panele nasıl düştü?
2. Stok doğru varyanttan azaldı mı?
3. Fatura toplamı sipariş toplamıyla kuruşu kuruşuna aynı mı?
4. Kargoya verirken takip numarası nereden geldi?
5. Ürünlerden biri iade edilince stok ve ciro nasıl değişti?

Bu beş adım, satıcının anlattıklarından daha fazlasını gösterir.

## Varyant ve barkod düzeni

Giyim, ayakkabı ya da aksesuar satıyorsanız renk ve beden matrisi şarttır. Daha önemlisi, her varyantın kendi stok kodu ve barkodu olmalıdır. Pazaryerine ürün gönderecekseniz barkod zorunlu bir alandır. Sistem aynı barkodun iki üründe kullanılmasına izin veriyorsa ileride yanlış varyanta stok yazılır. NEBSOFT E-ticaret'te varyant başına stok kodu ve barkod alanı vardır, tüm ürünlerde benzersizlik denetimi yapılır.

## Ödeme yöntemlerinin dürüst gösterimi

Müşteri kart numarasını yazdıktan sonra para gerçekten çekilmediyse ortada büyük bir sorun var demektir. Satın almadan önce sorun: Ödeme sağlayıcısı bağlı değilken kart seçeneği nasıl davranıyor? Sipariş ödenmiş mi görünüyor, yoksa bekliyor mu? Bizim programımızda sanal POS bağlı değilken kart seçeneği "TEST" olarak görünür ve sipariş "ödeme alınmadı" diye işaretlenir. Havale siparişleri "ödeme bekleniyor" durumunda kalır, ödeme gelince siz onaylarsınız. Kartla gerçek tahsilat için kendi sanal POS hesabınız ve sağlayıcı bağlantısı gerekir.

## Kargo ve takip numarası

Takip numarası kargo firmasından gelir, yazılımın üreteceği bir şey değildir. Paketin kargo firmanızla nasıl konuştuğunu öğrenin. Otomatik gönderi oluşturma için çoğu firmada sözleşme ve API erişimi gerekir. NEBSOFT'ta kargo firması API'leri şu an bağlı değil. Bu yüzden takip numarası alanı boş gelir ve zorunludur, numara olmadan etiket basılmaz. Daha yavaş görünür, ama müşteriye geçersiz numara gitmesini önler.

Toplu çalışma da önemlidir. Günde üç sipariş ile günde üç yüz sipariş aynı ekranda yürümez. Çoklu seçimle durum değiştirme, paket fişi ve etiket basma, toplama listesi ve geciken sipariş uyarısı gibi başlıkların sizin hacminizde gerekli olup olmadığına karar verin. Bu başlıkları kendi planımızda da ikinci dalga işleri olarak sıraladık, bu nedenle güncel durumu denemede kontrol edin.

## Fatura ile tahsilatın tutması

e-Arşiv faturası siparişten bağımsız üretilirse fark kaçınılmazdır. Kupon indirimi kalemlere dağıtılmalı, kargo ve kapıda ödeme bedeli ayrı kalem olmalıdır. Ürün bazında KDV oranı girilebilmelidir, çünkü her ürün aynı oranda değildir. Kurumsal müşteri için vergi numarasıyla fatura kesilebilmelidir. Oranları mali müşavirinizle doğrulayın. Gerçek gönderim için bir e-Belge sağlayıcısı hesabı gerekir ve canlıya çıkmadan önce test edilmelidir.

## İade akışı

E-ticaretin kaçınılmaz parçası iadedir. Üç üründen birinin dönmesi durumunda siparişin tamamı iade görünmemeli. Program ürün ve adet seçtirmeli, iade tutarını sormalı, ürünün stoğa dönüp dönmeyeceğini size bırakmalıdır. Raporlarda net ciro görünmelidir.

## Pazaryeri bağlantısını sorgulayın

Tek panelden pazaryeri yönetimi güçlü bir vaattir, ama bağlantının durumu pazaryerine göre değişir. Satıcıya kanal kanal sorun ve kendi test hesabınızla deneyin.

| Kanal | NEBSOFT'taki durum |
|---|---|
| Trendyol | Resmî dokümanla doğrulandı, canlıdan önce satıcı test hesabıyla denenmeli |
| n11 | Resmî dokümanla doğrulandı, canlıdan önce test gerekli |
| Hepsiburada | Doküman doğrulanamadı, canlı seçilemiyor |

Rakamlar kadar dürüstlük de önemlidir. Simülasyon modunda ürün gönderimi "yayında" yazmamalı, sipariş uydurulmamalıdır. Aksi halde olmayan siparişi paketlersiniz.

## Küçük başlayın ama ölçekleyebilin

Hangi pakette olursanız olun şu soruları yanıtlayın:

- Verilerinizi dışarı alabiliyor musunuz?
- Ürün sayınız iki katına çıkınca ücret ne oluyor?
- Yöneticiyle aynı hesabı paylaşmadan çalışan ekleyebiliyor musunuz?
- Telefonda sipariş listesi okunuyor mu?

Son soru hafife alınmamalı. Küçük işletmede siparişe çoğunlukla telefondan bakılır. Sipariş listesi yana kayıyorsa tutarı görmek için ekranı sürüklersiniz. Raporlarda dönem seçimi de benzer bir ayrıntıdır. Bu ayı geçen ayla karşılaştıramıyorsanız büyüyüp büyümediğinizi anlayamazsınız.

## Müşteriyi geri getirme araçları

Bir site açmak, satışın başlangıcıdır. Sepetini bırakan müşteriye hatırlatma yapabiliyor musunuz, kuponlarınıza son tarih ve kullanım sınırı koyabiliyor musunuz, bunlara bakın. Terk edilen sepet hatırlatması programımızda WhatsApp üzerinden yapılabiliyor. Bu tür mesajlarda müşterinin iletişim iznini gözetin ve metni reklam gibi değil, yardım gibi yazın.

## Bir sipariş deneyerek karar verin

Yazının başındaki test siparişini gerçekten yapın. [NEBSOFT E-ticaret Paketi](/eticaretpaketi) 7 gün ücretsiz denenebilir. Bir ürün açın, kuponlu bir sipariş oluşturun, faturayı ve kısmi iadeyi görün. Paketi, akışın size söylediklerine göre değerlendirin.
