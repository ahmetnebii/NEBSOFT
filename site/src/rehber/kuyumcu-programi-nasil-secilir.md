---
title: Kuyumcu programı nasıl seçilir?
description: Kuyumcu için program seçerken has kuru ve makas, sikke fiyatları, işçilikli takı satışı, hurda alış, emanet ve gün sonu kontrolüne nasıl bakılmalı?
program: kuyumcu
keywords: kuyumcu programı, kuyumcu stok takip programı, kuyumcu için altın takip programı nasıl seçilir
updated: 2026-10-30
faq:
S: Kur bilgisi otomatik gelir mi?
C: Bağlı olduğunuz toptancının resmî JSON servisi tanımlanırsa program kur çekebilir. Servis yoksa has alış ve satışı elle girersiniz. Hangi kaynağı kullandığınızı ve güncelliğini kontrol edin.
S: Programdaki fiyatlar müşteriye gösterilebilir mi?
C: Evet. Dükkân TV'sindeki kur ekranı girdiğiniz has ve makas üzerinden güncellenir. Ekranın doğruluğu sizin girdiğiniz kura bağlıdır, bu nedenle kur güncellemeyi günlük rutin yapın.
S: Altın satışında fatura ve KDV nasıl düzenlenir?
C: Has altın, işlenmiş altın ve işçilik için belge ve vergi uygulaması karmaşıktır. Program otomatik oran önermez. Bu konuda mutlaka mali müşavirinizin görüşünü alın.
S: Emanet altın nasıl tutulur?
C: Müşteri hesabı has gram olarak tutulur, kur değişse de gram değişmez. Hareketler tarih ve açıklama ile kaydedilir. Ayrıntılar için emanet takibi yazımıza bakabilirsiniz.
S: Sipariş hazır SMS'i gönderilebilir mi?
C: Evet, SMS sağlayıcısı bağlıysa gönderilir. Program gerçek sonucu gösterir. TEST, gönderildi veya hata ayrımı yapılır, gönderilmeyen mesaj gönderilmiş sayılmaz.
---

Kuyumculuk, sabah kapı açıldığında fiyatların zaten değişmiş olduğu bir iştir. Vitrindeki bilezik aynı bilezik, ama gramı dünkü fiyat değil. Bu nedenle kuyumcuda program seçimi, sabit fiyatlı ürün satan bir mağazadan tamamen farklı bir sorudur. Marketlerde stok adet ve lira ile tutulur. Kuyumcuda ise iki ayrı para birimi gibi iki hesap yürür: nakit ve has gram. Kayıt bu iki hesabı aynı anda doğru tutmuyorsa gün sonunda kasa tutsa da has tutmayabilir.

## Temel ayrım: has üzerinden düşünen program

Değerlendirmeye bu soruyla başlayın: Program gramı mı, lirayı mı temel alıyor? Kuyumcu mantığında yirmi iki ayar 10 gram bir ürünün has karşılığı, ayar çarpanıyla hesaplanır. Fiyat buradan türer. Kur değişince fiyat değişmeli, ama müşterinin hesabındaki gram değişmemelidir. Liralık bir stok sistemiyle çalışırsanız her fiyat değişiminde ürün kartlarını elle düzeltmek zorunda kalırsınız.

## Kur ve makas

Sabah ilk iş kur girilir. Has alış ve satışı yazıldığında tüm fiyatlar hesaplanmalıdır: çeyrek, yarım, tam, gram ve ayar bazlı fiyatlar. Makasınızı kendiniz belirleyebilmelisiniz. Şunları sınayın:

- Sikke türleri için ayrı alış ve satış makası verebiliyor musunuz?
- Ayar bazında çarpanlar doğru mu?
- Kur ekranı TV'de nasıl görünüyor?
- Kur değişince önceki satışlar etkileniyor mu?

Son soru önemlidir. Geçmiş satış, o günkü kurla kayıtlı kalmalıdır. Kur servisi bağlıyorsa toptancınızın resmî JSON servisinin alan adlarını sorun. NEBSOFT Kuyumcu'da kur servisi istekleri güvenli köprü üzerinden geçer. Kaynak alınamazsa "Kur alınamadı" hatası ayrıntısıyla gösterilir, uydurma fiyat oluşmaz. Toptancınızın desteklemediği bir servis varsa kur elle girilir.

## Takı satışı ve işçilik

İşçilikli takı satışı gram, ayar, güncel kur ve işçilik bileşeninden oluşur. Formül programda görünür olmalıdır. Müşteri "neden bu fiyat?" diye sorduğunda tek tek gösterebilmelisiniz. İşçilik gram başına mı yoksa adet başına mı hesaplanıyor? Toptan işçilik ile perakende işçiliği ayrı tanımlayabiliyor musunuz? Taşlı ürünlerde taş ağırlığı ve bedeli nasıl ayrılıyor? Bu ayrıntılar programda eksikse kasada hesap makinesine dönersiniz.

Müşteri pazarlığında yapılan indirim de kayıt altına alınmalıdır. Çalışanın sınırı olmalıdır. Kuyumcu marjları hassastır, küçük indirimler günlük kârı doğrudan etkiler.

## Hurda alış

Hurda altın alımı, kuyumcuda hem fırsat hem risktir. Alış sırasında ayar, gram, fire ve alış kuru kaydedilmelidir. Kimden alındığı bilgisi saklanmalıdır. Hurda alımında yükümlülükleriniz için güncel mevzuatı ve meslek kuruluşunuzu kontrol edin. Müşteri kimlik kaydı gibi konularda kişisel verileri güvenli tutun. Bu konudaki resmî gereklilikleri tahmin etmeyin, doğrudan kaynağından öğrenin.

Hurda stoğu has gram olarak ayrı izlenmelidir. Rafineriye veya toptancıya verilirken çıkan fire kârı etkiler. Program bu hareketleri günlük kapanışta görünür kılmalıdır.

## Emanet ve müşteri hesabı

Birçok kuyumcu, müşteri adına altın saklar veya gram üzerinden hesap tutar. Bu kayıt defterde kaldığında tartışma doğurur. Hesap has gram üzerinden tutulmalı, kur değişmesi gramı etkilememelidir. Bu konuya ayrı bir yazıda değindik. Emanet kaydı güvenli olmalı, kimlerin görüp değiştirebileceği sınırlanmalıdır.

## Gün sonu

Kuyumcu için gün sonu iki hesaplıdır. Nakit ve kart toplamı yanında has giriş ve çıkış da görünmelidir. Gün sonu raporu şu bilgileri vermelidir:

| Başlık | Örnek soru |
|---|---|
| Nakit | Kasadaki para tutuyor mu? |
| Kart | Slip toplamı aynı mı? |
| Has girişi | Hurda ve alışlar ne kadar? |
| Has çıkışı | Satışta kaç has gitti? |
| Emanet | Bugün hareket var mı? |

Has tutmadığında fark çoğu zaman bir kayıt hatasıdır: yanlış ayar girilmiştir veya emanet işlemi satış gibi yazılmıştır. Raporun kalem bazında detaya inebilmesi gerekir.

## Sipariş takibi

Özel sipariş veren müşteri için ölçü, kapora, teslim tarihi ve hazır bilgisi izlenmelidir. Sipariş hazır olduğunda SMS gönderilebilir. Gönderim sonucu gerçek durumla görünür. Bizim programımızda da bu şekilde çalışır.

## Güvenlik ve yetki

Kuyumcu verisi yüksek risklidir. Çalışan kullanıcı adı ile girmeli, işlem geçmişi izlenmelidir. Kur değiştirme ve makas ayarı yönetici yetkisinde olmalıdır. Yedekleme ve erişim kontrolünü ciddiye alın. Stok değeri bilgisi herkesin ekranında görünmemelidir.

## Vergi ve belge sınırı

Altın satışında KDV ve belge türü konusu karmaşıktır. Has altın, işlenmiş altın ve işçilik farklı değerlendirilebilir. NEBSOFT Kuyumcu bu nedenle e-Belge'de otomatik oran önermez. Mali müşaviriniz görüş vermeden oran seçmeyin. Bu programın hukuki veya vergisel bir danışmanlık yapmadığını unutmayın.

Bir not: kuyumcu programı için pazar araştırmamız henüz sürüyor, program da gelişiyor. Bu nedenle sizin için kritik olan bir ayrıntıyı satın almadan önce kendi senaryonuzla denemenizi öneririz.

Geçişte vitrin stoğunuzu sayın, her parçanın gram ve ayarını kontrol edin. İlk hafta program ile defteri yan yana tutup günlük has toplamını karşılaştırın.

## Bir sabah deneyin

Bugünkü kurları girin, makasınızı tanımlayın, bir bilezik satışı, bir hurda alışı ve bir emanet kaydı yapın, sonra gün sonuna bakın. [NEBSOFT Kuyumcu Programı](/kuyumcuprogrami) 7 gün ücretsiz denenebilir. TV ekranını da dükkân televizyonunda açarak müşterinin gördüğünü görün.
