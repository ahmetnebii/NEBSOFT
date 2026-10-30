---
title: Hukuk bürosu programı nasıl seçilir?
description: Avukatlar için dava takip programı seçerken süre hesabı, ajanda, masraf, müvekkil portalı, gizlilik ve UYAP iddiaları nasıl değerlendirilmeli?
program: hukuk
keywords: hukuk bürosu programı, avukat dava takip programı, avukatlar için büro programı nasıl seçilir
updated: 2026-10-30
faq:
S: Program UYAP'tan otomatik veri çekiyor mu?
C: Hayır. Üçüncü taraf yazılımlara açık, belgeli bir UYAP API'si bulunamadığı için bağlantı yoktur. Dosya ve duruşma bilgisi elle girilir, takvim .ics olarak aktarılabilir.
S: Süre hesaplayıcıya güvenebilir miyim?
C: Hesap kanun maddeleriyle karşılaştırıldı ve test edildi. Sonuç ekranı uygulanan kuralı gösterir. Yine de kesin süreyi avukat kontrol etmelidir. Dini bayramlar Ayarlar'dan girilmelidir.
S: Avukatlık Asgari Ücret Tarifesi hesabı var mı?
C: Hayır. Güncel tarife metni doğrulanmadığı için AAÜT hesabı programda bulunmuyor. Büro kendi ücretini girer. Tarifeyi resmî metinden takip edin.
S: Müvekkil portalında ne görünür?
C: Dosyalar, duruşma tarihleri, sonuçlar, masraf dökümü ve mesajlar görünür. Dosya notları ve iç yazışmalar portala gitmez. Giriş rastgele 6 karakterlik kodla yapılır.
S: e-SMM kesebilir miyim?
C: Entegratör hesabıyla yapılabilir. Ancak bireysel müvekkil için stopaj konusunda bilinen bir düzeltme bekleniyor. Kesimden önce program uyarır. Mali müşavirinizle kontrol edin.
---

Bir avukat için yazılım hatası, başka mesleklerde olduğu gibi yalnızca verimlilik kaybı değildir. Yanlış hesaplanmış bir istinaf süresi, müvekkilin hakkını kalıcı olarak kaybettirebilir. Bu nedenle hukuk bürosu programı seçimi, güzel bir takvim seçmekten önce doğruluk ve gizlilik sınavıdır. Sonuç ekranında "son gün" yazan bir yazılıma neden güveneceğinizi sormalısınız. Bu rehber önce bu sınavı, sonra günlük işleri ele alıyor.

## Birinci sınav: süre hesabı

Tanıtımda "süre takibi" yazması yetmez. Hatırlatmayı değil, hesabı sınayın. Doğru bir hesaplayıcı şunları dikkate almalıdır:

- HMK adli tatil süresi 20 Temmuz – 31 Ağustos arasıdır (md. 102).
- Tatile rastlayan kanuni sürelerin bitişi, tatilin bittiği günden itibaren bir hafta uzar (md. 104).
- Ceza yargılamasında bu uzama üç gündür (CMK md. 331/4).
- İdari yargıda ara vermenin bittiği günü izleyen günden itibaren yedi gün uzar (İYUK md. 8).
- İcra dosyalarında İİK'da adli tatil hükmü bulunmaz.
- Adli tatilde görülen işler uzamadan yararlanmaz (HMK md. 103).
- Hafta, ay ve yıl sürelerinde karşılık gelen gün esas alınır (HMK md. 92).
- Son gün resmî tatile rastlarsa ilk iş günü esas alınır (HMK md. 93).

Bu maddelerin metinlerini mevzuat.gov.tr'den okuyabilirsiniz. Denemede kendi bildiğiniz sınır durumlarını sorun: 7 Eylül hafta sonuna denk gelirse ne oluyor? Bir yıllık süre 365 gün mü sayılıyor, karşılık gelen gün mü? İşçinin açtığı iş davasında uzatma ekleniyor mu? Sonuç ekranı neden o tarihin çıktığını açıklıyor mu?

NEBSOFT Hukuk Bürosu Programı'nda 16 kural için hesap vardır ve sonuç adım adım gösterilir, uygulanan madde yazılır. Bu hesaplar otomatik testlerle denetlenir. Dini bayram tarihleri tahminle girilmez, yıllık olarak Ayarlar'dan siz girersiniz. Girilmemişse hesaplayıcı uyarır. Arefe günü ve 28 Ekim yarım günü için de uyarı gösterilir. Ekranda "kesin süreyi avukat kontrol eder" notu kalır, çünkü yazılım mesleki sorumluluğun yerini almaz.

## İkinci sınav: gizlilik

Avukat ve müvekkil arasındaki gizlilik, yazılımda da karşılık bulmalıdır. Sorular:

| Soru | Beklenen |
|---|---|
| Dosya notu portala gider mi? | Asla, sunucu tarafında da silinir |
| Portal girişi nasıl? | Rastgele kod, tahmin edilemez |
| Avukat kimlerin dosyasını görür? | Rol bazlı, kendi dosyaları |
| Silinen kayıt iz bırakır mı? | Evet, işlem geçmişinde |

Avukatlık Kanunu ve meslek kurallarının getirdiği sır saklama yükümlülüğünü yazılım seçiminde de gözetin. Verilerin nerede saklandığını, kimin erişebildiğini ve yedekleme düzenini sorun. Tahmin edilebilir bir müvekkil kodu ciddi bir risktir, kimlik numarasının son haneleriyle portal açmak kabul edilmemelidir.

## Dosya ve safahat

Dava, icra, arabuluculuk, danışmanlık ve ceza dosyaları tek yapıda yönetilebilmelidir. Mahkeme adı serbest yazılabilmelidir. Sabit listeden seçim, gerçek büroyu kısıtlar. Geçmiş duruşmanın sonucu dosyadan girilebilmeli, safahat zaman çizelgesi oluşmalıdır. Danışmanlık dosyasını davaya dönüştürürken kayıtlar korunmalıdır.

## Ajanda ve görevler

Aylık takvim, duruşma ve son gün bilgisini birlikte göstermelidir. Aynı avukata aynı saatte ikinci duruşma eklenirken çakışma uyarısı çıkmalıdır. Takvim .ics dosyasıyla dışarı aktarılabilir. Yapılacaklar için görev atama, stajyer ve ekip takibini kolaylaştırır. Vekaletname tarih, noter, yevmiye ve geçerlilik takibi ise özellikle büyüyen bürolarda önem kazanır. 30 gün kala uyarı almak işe yarar.

## Para: avans, masraf, ücret

Müvekkil avansı ve masrafı tartışmasız bir kayıt ister. Avans, masraf, kalan bakiye ve eksiye düşen müvekkil listesi görünmelidir. Masraf tarih ve açıklamayla tutulmalıdır, düzeltilebilir olmalıdır. Vekâlet ücreti tahsilatı ayrı kayıt olarak saklanmalıdır. Zaman kaydından saatlik ücret dökümü çıkarabiliyorsanız danışmanlık işleriniz için güçlü bir araçtır.

Belge konusunda yanlış tür büyük sorun doğurur. Serbest meslek makbuzu yerine fatura kesen bir sistem kabul edilemez. Programımız e-SMM kullanır, entegratör hesabı gerekir. Bireysel müvekkil stopajıyla ilgili düzeltme beklendiği için kesim öncesi uyarı görünür. Avukatlık Asgari Ücret Tarifesi hesabı bulunmuyor, büro kendi tutarını girer.

## UYAP iddialarını sorgulayın

Bu konuda satıcıya net sorun. Resmî, belgeli API var mı? Yoksa bir XML veya robot yöntemi mi kullanılıyor? Avukat hakları konusunda çıkan değerlendirmeler, yoğun otomatik işlemlerin erişim kısıtına yol açabileceğini göstermektedir. Biz bu nedenle programda UYAP bağlantısı sunmuyoruz. Dosya bilgileri elle girilir. Resmî doküman gelene kadar bu tutumu koruyoruz. Vaat değil, gerçek işleyiş üzerinden karar verin.

## Müvekkil iletişimi

Müvekkil portalında dosya durumu, duruşma, masraf ve mesaj bulunur. Mesajlar büroya gerçekten ulaşmalı, yanıt portalda görünmelidir. Toplu duruşma hatırlatması SMS ile gönderilebilir, sonuçlar gerçek olarak görünür. Çıkar çatışması kontrolü de öne çıkan bir korumadır. Yeni dosyada karşı taraf büronun müvekkiliyse uyarı gelir.

## Büro ölçeğine göre öncelik

Tek avukatlı büroda süre hesabı, ajanda ve masraf takibi çoğu ihtiyacı karşılar. Ortaklı bürolarda rol ayrımı, görev atama, avukat bazında iş yükü ve tahsilat raporu öne çıkar. Sekreter ve stajyerin hangi dosyaları göreceğini baştan belirleyin. Yüksek hacimli icra takibi yapan bürolar için toplu işlem ihtiyacı doğabilir. Bu tür bir işiniz varsa programın dosya başına akışının size yetip yetmediğini gerçek bir hacimle deneyin. Programımız binlerce dosyada hızlı çalışacak şekilde ölçüldü, ancak toplu icra işlemi sunmuyor.

## Bir dosyayla deneyin

Gerçek bir dosyanın anonimleştirilmiş kopyasını girin, süre hesaplatın, duruşma ekleyin, avans ve masraf işleyin, portalı müvekkil gözüyle açın. [NEBSOFT Hukuk Bürosu Programı](/hukukburosuprogrami) 7 gün ücretsiz denenebilir. Süre hesabını kendi kontrol yönteminizle karşılaştırarak başlayın.
