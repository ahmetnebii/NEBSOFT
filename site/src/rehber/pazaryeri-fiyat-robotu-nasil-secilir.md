---
title: Pazaryeri fiyat robotu ve kâr hesaplama aracı nasıl seçilir?
description: Fiyat robotu ve kâr hesaplayıcı seçerken rakip fiyat kaynağı, zarar koruması, maliyet hesabı ve kanala gerçek gönderimde neler sorulmalı?
program: fiyatrobotu
keywords: pazaryeri fiyat robotu, kâr hesaplama aracı, Trendyol için fiyat robotu nasıl seçilir
updated: 2026-10-30
faq:
S: Fiyat robotu nedir?
C: Belirlediğiniz kurallara göre listeleme fiyatlarını değiştiren veya değişiklik öneren araçtır. Asıl değeri, kâr sınırınızın altına inmeden fiyat kararlarını hızlandırmasıdır.
S: Robot rakip fiyatını nereden öğrenir?
C: Bu en önemli sorudur. Pazaryerinin resmî servisi veya işletmenin kendi fiyat dosyası gerekir. NEBSOFT'ta rakip fiyat kaynağı henüz bağlı değildir, demo verisi kullanılır ve rakibe göre fiyat canlı kanala gönderilmez.
S: Zarar koruması nasıl çalışır?
C: Her ürün için maliyet ve hedef marja göre taban fiyat hesaplanır. Robot önerdiği fiyatı bu tabanın altına indirmez. Doğruluğu, maliyet verinizin doğruluğuna bağlıdır.
S: Kâr hesaplayıcı canlı kanal olmadan kullanılabilir mi?
C: Evet. Komisyon, kargo desisi, hizmet bedeli ve KDV bilgilerini girerek hesap yapabilirsiniz. Bu değerlerin güncel olduğunu pazaryeri panelinizden kontrol edin.
S: Otomatik fiyat değişikliği riskli mi?
C: Yanlış kuralla sınırı aşan bir robot hızlı zarar yazdırabilir. Önce öneri modunda kullanın, sonra güvendiğiniz ürünlerde otomatiğe geçin. Kanala gitmeyen fiyat için TEST uyarısına dikkat edin.
---

Önce kısa bir itiraf: bir fiyat robotu sihirli bir kutu değildir. Rakibinizi her saniye izleyip size kazandıran bir makine gibi anlatılır, ama temeli iki sıradan veriye dayanır. Ürününüzün gerçek maliyeti ve rakibin gerçek fiyatı. Bu iki veri yanlışsa robot, hata yapmayı hızlandıran bir araca dönüşür. Dolayısıyla seçim yaparken "kaç strateji var" sorusundan önce "bu rakamlar nereden geliyor" sorusunu sorun.

## Kâr hesabı robotun önünde gelir

Fiyat stratejisinden önce doğru kâr hesabı gerekir. Satış fiyatından şunlar düşülmelidir:

- Pazaryeri komisyonu
- Desiye göre kargo
- Hizmet bedeli
- Ürün maliyeti
- Paketleme
- KDV etkisi

Hesap aracı her kanal için başa baş fiyatı ve hedef marj için gereken fiyatı verebilmelidir. Listeleme bazında kârlılık ekranı, zarar eden ürünleri öne çıkarmalıdır. Komisyon oranları ve kargo tarifeleri değiştiği için kaynaklarını güncel tutmak sizin sorumluluğunuzdadır. Bir programın bu değerleri nasıl güncellediğini sorun. Gerçek kâr hesabını ayrı bir yazıda örnekledik.

## Rakip fiyat kaynağı

Fiyat robotu tartışmasının kalbi burasıdır. Satıcıya şu soruları sorun:

1. Rakip fiyatlarını hangi resmî servisten alıyorsunuz?
2. Veri ne sıklıkla güncelleniyor?
3. Veri alınamazsa robot ne yapıyor?
4. Pazaryeri kurallarına uygun mu?

Son soru hafife alınmamalı. Kanal kurallarını ihlal eden bir yöntem hesabınızı riske atabilir. Doğrulanmış bir kaynağı olmayan bir robot, rakip fiyatını tahmin ediyor olabilir.

Kendi durumumuzu açık yazalım. NEBSOFT Fiyat Robotu'nda rakip ve buybox fiyatları bugün demo verisidir. Pazaryerlerinin ilgili servisi veya işletmenizin fiyat dosyası bağlanana kadar buybox ve eşitleme stratejileri canlı kanala gönderilmez. Trendyol canlıyken program "rakip fiyatları gerçek bir kaynaktan alınmadı (demo) — gönderilmedi" hatası verir. Bu nedenle bugün aracımız rakip takibi için değil, kâr hesabı ve marj kuralları için değerlendirilmelidir.

## Stratejiler

Bir fiyat robotunda genellikle şu stratejiler bulunur:

| Strateji | Çalışma biçimi | Risk |
|---|---|---|
| Buybox | Rakibin altına iner | Fiyat savaşı |
| Eşitleme | Rakip fiyatına gelir | Rakip verisine bağlı |
| Marj | Hedef kâr oranını korur | Satış hızı düşebilir |
| Elle | Öneri sunar, onay ister | Zaman alır |

Bütün ürünlere tek strateji uygulamayın. Çok satan ürün, uzun kuyruk ürün ve yeni ürün için farklı kurallar gerekir.

## Zarar koruması

Robotların en kritik özelliği, nerede duracağıdır. Taban fiyat her ürün için tanımlanmalı, hiçbir strateji bunu aşmamalıdır. Taban hesabı maliyet, komisyon, kargo ve hedef marjdan çıkmalıdır. Maliyet boşsa robot ne yapıyor? Bazı sistemler sıfır kabul eder ve ürünü zararına satabilir. Boş maliyette durması gerekir. Aşağıdaki senaryoları deneyin:

- Maliyet alanını boş bırakın.
- Rakip fiyatı tabanın altına düşürün.
- Komisyonu değiştirin.
- Birden çok değişikliği topluca onaylayın.

## Fiyatın gerçekten gittiğini doğrulayın

Ekranda değişen fiyat ile kanalda görünen fiyat aynı şey değildir. Program kanal yanıtını beklemeli, sonucu göstermelidir. Demo kanalda "fiyat güncellendi" yazıyorsa ve "buybox kazanıldı" işareti çıkıyorsa, aldanırsınız. NEBSOFT'ta demo kanalda "TEST — canlı bağlı değil: fiyatlar yalnızca programda güncellendi" uyarısı çıkar, listede "Kanala gönderilmedi" rozeti görünür ve buybox işaretlenmez.

Kanal tarafında da sınırlar vardır. Trendyol resmî dokümanına göre fiyat ve stok güncellemesinde aynı istek belirli süre içinde tekrar edilemez. Bu nedenle saniye saniye fiyat değişikliği gerçekçi değildir. Bir robotun anlık iddialarını bu sınırlarla karşılaştırın.

## Hangi kanal, hangi durum

Trendyol ve n11 fiyat ve stok akışı resmî dokümanla doğrulandı, canlı öncesinde test hesabıyla denenmesi gerekir. Hepsiburada dokümanı doğrulanamadığı için canlı seçilemez. Amazon gibi diğer kanalların durumunu da ayrıca sorun. Bir sekme görmek, kanala bağlı olmak anlamına gelmez.

## Fiyat kararları kimde?

Yetki düzeni önemlidir. Fiyat değişikliğini kim onaylar? Değişiklik geçmişi tutuluyor mu? Yanlış bir toplu işlemi geri alabiliyor musunuz? Otomatik modda hata olduğunda uyarı geliyor mu? Küçük ekipte bile bu sorular önemlidir, çünkü tek bir yanlış kural yüzlerce ürünü etkileyebilir.

## Aşamalı kullanım

Robotu ilk gün tüm ürünlere açmayın. Sıralama şöyle olabilir:

1. Maliyetleri ve komisyonları doğru girin.
2. Kârlılık listesini inceleyin.
3. Zarar eden listelemeleri düzeltin.
4. Az sayıda üründe öneri modunu deneyin.
5. Doğrulanmış veri kaynağıyla otomatiğe geçin.

Fiyat dışı etkenleri unutmayın. Teslimat hızı, mağaza puanı ve iade oranı da satışı etkiler. Sürekli fiyat düşürmek bu sorunları çözmez, yalnızca marjınızı eritir.

## Ücret ve bağımlılık

Fiyat robotları genellikle aylık ücret veya ürün sayısına göre fiyatlanır. Robotun size sağladığı katkıyı, ödediğiniz bedelle karşılaştırın. Az ürünlü bir mağazada elle yapılan haftalık fiyat kontrolü yeterli olabilir. Yüzlerce ürünle çalışıyorsanız otomasyon anlamlı hale gelir. Ayrıca araçtan vazgeçerseniz maliyet ve kural verinizi dışarı alabiliyor musunuz, bunu sorun. Yıllarca girdiğiniz maliyet bilgisi işletmenizin değerli bir varlığıdır, başka bir programa taşınabilmelidir.

## Hesapla başlayın

İlk adım için rakip verisine ihtiyacınız yok. En çok sattığınız on ürünün gerçek kârını hesaplayın. [NEBSOFT Pazaryeri Kâr Hesaplama](/pazaryerikarhesaplama) aracı 7 gün ücretsiz denenebilir. Bir ürünün başa baş fiyatını çıkarın, ardından hedef marj için gereken fiyatı görün ve sonucu kendi panelinizdeki rakamlarla karşılaştırın.
