---
title: Veteriner programı nasıl seçilir?
description: Veteriner kliniği için program seçerken hasta kartı, aşı takvimi, hatırlatma, stok, pet otel ve sahip portalı güvenliğini nasıl değerlendirmelisiniz?
program: veteriner
keywords: veteriner programı, veteriner klinik yazılımı, küçük klinik için veteriner programı nasıl seçilir
updated: 2026-10-30
faq:
S: VETBİS ve PETVET bağlantısı var mı?
C: NEBSOFT Veteriner'de bu bağlantılar yoktur, çünkü Bakanlık yetkisi ve resmî doküman gerekiyor. Düğmeler TEST sonucu gösterir ve kayda referans yazmaz. Resmî bildirimlerinizi yetkili sistemlerden yapmalısınız.
S: Hayvan sahibi aşı karnesini görebilir mi?
C: Dijital karne, klinikten verilen telefon ve kod ile açılır. Bulut kullanımında bu kod denetiminin sunucu tarafı henüz tamamlanmadı, bu nedenle karne yayına almadan önce durumu bizimle netleştirin.
S: Ölen hayvana aşı hatırlatması gitmesini nasıl önlerim?
C: Hasta kartında durumu Vefat etti olarak işaretleyin. Hayvan aşı listesinden düşer, kartı ve geçmişi korunur. Bu kayıt sahibine gönderilecek üzücü mesajları önler.
S: Pet otel ücreti nasıl takip edilir?
C: Konaklama kaydı tutulur, çıkışta gece sayısı ve günlük ücret üzerinden ödeme önerilir. Tutar düzenlenebilir. Ödeme alınmadan çıkış yapılırsa listede Ödenmedi rozeti görünür.
S: Stok sıfırın altına düşer mi?
C: NEBSOFT'ta satış stoğu sıfırın altına düşürmez. Stokta olmayan ürün sepete eklenemez. Düzeltme gerekiyorsa stok düzeltmesi ayrı yapılır.
---

Bir veteriner kliniğinin kaydı iki canlıya aittir: masada duran hasta ve bekleme salonundaki sahibi. Birinin tıbbi geçmişini, öbürünün iletişim tercihini ve ödeme bilgisini aynı anda taşırsınız. Ayrıca hasta sizinle konuşamaz, bu yüzden geçmiş kayıtlar başka alanlardakinden daha değerlidir. Program seçerken ekranın şıklığına değil, bir yıl sonra aynı hastayla karşılaştığınızda elinizde ne kaldığına bakın. Bu yazıda bir kliniğin karşılaşacağı günlük anları sırayla ele alıyoruz.

## Sabah randevuları

Gün randevu listesiyle başlar. Aynı hekime aynı saatte iki randevu verilip verilmediği kontrol edilmelidir. Basit görünen çakışma uyarısı, yoğun sabahlarda hastanın uzun süre beklemesini önler. Online randevu talebi varsa onayınıza düşmelidir. Onay mesajının gerçekten gidip gitmediği de görünmelidir. Programımızda SMS sonucu gerçek durumuyla gösterilir, bağlantı yoksa gönderilmiş sayılmaz.

## Hasta ve sahip kartı

Bir sahibin birden çok hayvanı olabilir. Kart yapısı bunu desteklemelidir. Tür, ırk, doğum tarihi, cinsiyet, çip numarası ve kilo kayıtlı olmalıdır. Sorulacak sorular:

- Telefon numarasıyla sahip ve tüm hayvanları hızlı bulunuyor mu?
- Kilo geçmişi görülebiliyor mu?
- Muayene, tanı ve tedavi geçmişi tek ekranda mı?
- Hayvan vefat ettiğinde kart nasıl korunuyor?

Son soru duygusal bir ayrıntıdır. Vefat etmiş bir hayvan için sahibine aşı hatırlatması göndermek, kliniğin yapabileceği en üzücü hatalardan biridir. Durum "Vefat etti" olarak işaretlenince hayvan aşı listesinden düşmeli, ama geçmişi kaybolmamalıdır.

## Aşı takvimi

Klinik gelirinin ve hasta devamlılığının önemli kısmı aşı düzeninden gelir. Tür bazlı aşı takvimi, yapılan aşının tekrar tarihini belirleyebilmelidir. Klinik protokolünü hekim belirler, program yalnızca takvimi tutar. Aşı listesini elle yenilemek gerekmemeli. Yaklaşan aşılar özette görünmelidir. Toplu hatırlatma konusunda "gönderildi" ile "TEST" ayrımının yapıldığından emin olun. NEBSOFT'ta "Hepsine SMS" düğmesi sağlayıcı yokken mesajların TEST olduğunu söyler ve hatırlatıldı saymaz. Bu sayede hangi sahibe gerçekten ulaştığınızı bilirsiniz. Aşı hatırlatma düzenini ayrı bir yazıda anlattık.

## Muayene kaydı

Muayene formu hekimi yavaşlatmamalıdır. Şikâyet, bulgu, tanı, tedavi ve ilaç hızlı girilmelidir. Kaydın sonraki muayenede kolayca okunması gerekir. Hazır metinler, hekimin aynı ifadeleri tekrar yazmasını önler. Ameliyat veya anestezi için imzalı onam ihtiyacınız varsa bunu özellikle sorun. Bizim planımızda bu form sıradaki çalışma olarak yer alıyor, bugün için programda hazır değil.

## Satış ve stok

Mama, aksesuar ve ilaç satışı kliniğin ikinci kolu olabilir. Barkodlu satış, stok takibi ve son kullanma tarihi yaklaşan ürünler önemlidir. Stok eksiye düşmüyorsa sayım farkı anında anlaşılır. Şu senaryoyu deneyin: stoğu 25 olan ürünü 26 kez eklemeye çalışın. Program durdurmalıdır. Satış ve muayene tahsilatının aynı kasada görünmesi, gün sonu takibini kolaylaştırır.

## Pet otel

Konaklama hizmeti sunuyorsanız giriş, çıkış, günlük ücret ve notlar kaydedilmelidir. Sık yaşanan sorun, çıkışta ücretin unutulmasıdır. Programda şunları kontrol edin:

| Durum | Beklenen davranış |
|---|---|
| Çıkış yapıldı | Ödeme penceresi açılır |
| Vazgeçildi | Listede Ödenmedi rozeti kalır |
| Ödeme alındı | Satış kaydı oluşur |
| Erken çıkış | Tutar elle düzeltilir |

Erken çıkışta önerilen tutar planlanan bitişe göre gelebilir. Ekip bunu bilmeli ve gerçek gece sayısına göre düzeltmelidir.

## Sahip portalı ve gizlilik

Dijital karne sahipleri için çekici bir hizmettir, ama güvenlik sorusu sormalısınız. Yalnızca telefon numarasıyla açılan bir sayfa, numarayı bilen birinin sahibin adını, hayvanların tanı ve tedavisini görmesine yol açar. Telefon ile birlikte klinikten verilen kod istenmelidir. NEBSOFT'ta program tarafında kod eklendi. Ancak bulut modunda sunucu kuralının da bu kodu zorunlu tutması gerekiyor ve bu iş henüz tamamlanmadı. Bu nedenle bulutta karne erişimini açmadan önce bizimle netleştirin. Sınırı açıkça yazıyoruz, çünkü kişisel verilerin korunması sizin de sorumluluğunuzdur.

## Resmî sistemler

Klinikler için VETBİS, e-reçete ve pet kayıt sistemleri gibi resmî süreçler vardır. Yazılım satıcısına "bağlantınız var mı" diye sorarken yetki belgesini ve canlı örneğini isteyin. NEBSOFT Veteriner'de bu bağlantılar Bakanlık yetkisi ve doküman gerektirdiği için kullanılamaz. Program bu konularda yalnızca TEST sonucu üretir ve kayda sahte referans yazmaz. Yasal yükümlülüklerinizi güncel mevzuattan ve meslek odanızdan takip edin. Bildirimlerinizi yetkili sistemden yapın.

## Klinik büyüklüğü

Tek hekimli muayenehanede hasta kartı, aşı takvimi ve kasa yeterli olabilir. Yatılı tedavi, birden fazla hekim ve pet otel eklendikçe yetki ve raporlar önem kazanır. Kendi hizmet listenize bakın ve kullanmayacağınız modülleri kapatılabilir olup olmadığını sorun. Sade menü, yeni personelin programı hızlı öğrenmesini sağlar.

Geçişte eski defterlerden tüm kayıtları aktarmaya çalışmayın. Aktif hastaları ve yaklaşan aşıları öncelikle girin. Diğerlerini geldikçe tamamlayın. Aşı tekrar tarihlerini doğru girmek, ilk ayın en önemli işidir.

## Bir günü deneyin

Karar vermeden önce ön masadaki çalışanınızın da görüşünü alın. Bir sahip ve iki hayvan açın, aşı yapın, tekrar tarihini görün, mama satın, pet otel kaydı oluşturup çıkış yapın. [NEBSOFT Veteriner Programı](/veterinerprogrami) bu akış için 7 gün ücretsiz denenebilir. Sonra ekibinizle birlikte gerçek bir sabah listesiyle sınayın.
