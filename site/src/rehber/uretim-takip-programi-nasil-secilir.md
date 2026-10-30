---
title: Üretim takip programı nasıl seçilir?
description: KOBİ üretim tesisi için üretim takip veya ERP programı seçerken reçete, iş emri, lot, maliyet, MRP ve cihaz bağlantısını nasıl değerlendirmelisiniz?
program: fabrika
keywords: üretim takip programı, KOBİ ERP, küçük fabrika için üretim takip programı nasıl seçilir
updated: 2026-10-30
faq:
S: Küçük atölye için ERP gerekir mi?
C: Her atölyenin tam bir ERP'ye ihtiyacı yoktur. Reçete, stok ve iş emri takibi çoğu ihtiyacı çözebilir. Lot izlenebilirliği, müşteri denetimi veya çok aşamalı üretim gerekiyorsa daha kapsamlı bir sistem gündeme gelir.
S: Kantar veya PLC bağlantısı var mı?
C: Bağlantı noktaları bulunuyor, ancak gerçek cihaz bağlantısının sahada denenmesi gerekir. Simülasyonda ağırlık okunmaz, tartım elle girilir. Cihazınızın marka ve modeliyle test yapılmalıdır.
S: Fason üretim destekleniyor mu?
C: Fason iş emri ve üretim bildiriminden otomatik malzeme düşümü henüz yok, sonraki aşamada planlanıyor. Bu başlıklar işiniz için zorunluysa kararınızı buna göre verin.
S: Maliyet nasıl hesaplanıyor?
C: Malzeme gerçek çıkıştan, işçilik ölçülen süreden gelir. Ölçülmeyen operasyon standart olarak ayrı gösterilir. Malzeme çıkışı eksikse lot standart maliyetle girer ve uyarı verilir.
S: Bayiler sipariş verebilir mi?
C: Evet, bayi portalında sipariş ve bakiye görülebilir. Sipariş onaylandığında SMS sonucu gerçek durumuyla gösterilir, bağlantı yoksa TEST yazılır.
---

Fabrikada iki gerçek vardır: ekrandaki stok ve depodaki stok. İkisi birbirinden uzaklaştığında üretim planı tahmine, maliyet hesabı ise umut etmeye dönüşür. KOBİ ölçeğindeki pek çok üretici ERP sözcüğünden çekinir, çünkü aylar süren kurulum projeleri ve kullanılmayan modüllerle ilgili hikâyeler duymuştur. Oysa asıl konu yazılımın büyüklüğü değil, tesisinizin gerçeğini ne kadar doğru tuttuğudur. Bu rehber, seçimi modül listesi yerine dört somut soru etrafında kuruyor.

## Soru 1: Elimde gerçekte ne var?

Doğru stok, her şeyin temelidir. Lot ve son kullanma tarihi, çoklu depo ve lokasyon, sayım, transfer ve fire kayıtları gerekir. FEFO mantığı, gıda ve kimya gibi sektörlerde yakın tarihli malzemenin önce kullanılmasını sağlar. Mal kabulde kantar tartısı, kalite kontrol ve karantina adımları işlenmelidir. Karantinadaki malzeme üretime verilmemelidir.

Tedarik zincirini baştan sona sınayın: satınalma talebi, teklif, sipariş, mal kabul, kalite, gerekirse tedarikçi iadesi. Kantar konusunda dikkatli olun. Rastgele bir ağırlığı simülasyon olarak forma yazan bir yazılım, gerçek olmayan miktarı stoğa ve tedarikçi borcuna ekler. NEBSOFT Fabrika ERP'de simülasyonda ağırlık okunmaz, program "tartımı elle girin" der. Cihaz bağlantısı sahada denenmeden çalışıyor varsaymayın.

## Soru 2: Bir ürünü nasıl yapıyorum?

Reçete ve rota yapınız programa uymalıdır. Çok seviyeli reçete, yarı mamulün başka bir reçetede kullanılmasını sağlar. Rota, operasyon sırasını ve iş istasyonlarını tanımlar. İş emri açıldığında malzeme çıkışı ve üretim bildirimi kayda geçer. Şu senaryoları deneyin:

1. Üç seviyeli bir ürün tanımlayın.
2. İş emri açıp eksik malzeme ile ne olacağını görün.
3. Üretimi fireli bildirin.
4. Lotun nereden geldiğini izleyin.

Geri bildirimli tüketim, yani üretim bildirilince malzemenin reçeteden otomatik düşmesi bugün programımızda yoktur. Malzeme çıkışı ayrıca yapılır. Sahada operatörün tablet üzerinden başla, bitir ve fire bildirmesi ise iş emri detayından yapılabilir, ayrı bir operatör ekranı sonraki aşamadadır. Fabrikanızın disiplini buna uygun mu değerlendirin.

## Soru 3: Gerçek maliyetim ne?

Üreticinin en kritik sorusu budur ve en çok yanıltan raporlar burada çıkar. Ölçülmemiş bir operasyona "ideal süre artı yüzde on beş" yazan sistem maliyeti tahmin ediyor, ama bunu gerçek gibi gösteriyordur. Şu ayrımları sorun:

| Kalem | Kaynağı |
|---|---|
| Malzeme | Gerçek çıkış |
| İşçilik | Ölçülen süre |
| Ölçülmeyen operasyon | Standart, ayrı etiketli |
| Eksik malzeme çıkışı | Standart maliyet ve uyarı |

Bir yaygın hata, malzeme çıkışından önce üretim bildirmektir. Çıkılan malzeme azken lot maliyeti neredeyse sıfıra düşebilir. Stok değeri ve satış kârlılığı yanlış çıkar. NEBSOFT'ta çıkılan malzeme reçetenin yüzde doksanından azsa lot standart maliyetle girer, uyarı verilir. İş emri maliyet kartında gerçek ve standart kısım ayrı gösterilir.

Genel üretim gideri dağıtımı, yani elektrik ve kira gibi giderlerin ürüne yansıtılması ile maliyet farkı analizi şu an yoktur. Lot değerleme yöntemi de mali müşavirinizle karara bağlanmalıdır.

## Soru 4: Yarın ne üreteceğim?

MRP, satış siparişleri ve stok üzerinden malzeme ihtiyacını ve satınalma önerisini çıkarır. Doğru çalışması için reçetelerin ve stokların doğru olması gerekir. Üretim planı kapasiteyi görmelidir. Alternatif makineye kaydırarak çizelgeleme gibi başlıklar bizde sınırlıdır, plan ekranı temel görünüm sunar. Bakım planı, OEE ve PLC sayaç bağlantısı da verimlilik tarafını destekler. OEE yalnızca süresi ölçülen operasyonlarla hesaplanmalıdır, aksi halde güzel ama anlamsız bir rakam çıkar.

## Satış, sevkiyat ve belgeler

Satış siparişi, sevkiyat, e-İrsaliye ve e-Fatura zincirini sorun. Belge numarası yalnızca entegratörden gelmelidir. Simülasyon sonucu belge numarası olarak kaydedilmemelidir. NEBSOFT'ta sevkiyatta bu belgeler simülasyondaysa listede "Test — gönderilmedi" görünür. Gerçek gönderim için entegratör seçimi ve test hesabı gerekir. e-Müstahsil gibi belgeler için de aynı şart geçerlidir.

Bayi portalı, telefonla gelen siparişleri azaltır. Bayi siparişini verir, bakiyesini görür. Onay ve mesaj sonuçları gerçek olarak izlenir.

## İzlenebilirlik

Gıda, kimya veya otomotiv yan sanayi gibi alanlarda bir lotun nereden gelip nereye gittiğini bilmek zorunluluk ya da müşteri şartı olabilir. Hammaddeden müşteriye iki yönlü izleme yapılabilmelidir. Sizin sektörünüzün standardı ve belgesi için güncel gereklilikleri belgelendirme kuruluşunuzdan öğrenin. Geri çağırma konusunu ayrı bir yazıda anlattık.

## Geçiş projesi nasıl yürütülmeli?

Her şeyi aynı anda açmayın. Önce malzeme kartlarını temizleyin, sonra stok sayımı yapın, ardından reçeteleri girin ve son olarak tek bir ürün hattında iş emrine geçin. İlk ay yalnızca bir hattı izleyin. Operatörleri sürece katın, çünkü veri onlardan gelir. Kâğıda yazıp sonra girmek, kısa sürede kaybolan bir veridir.

Satıcıya şu soruyu sorun: Yazılım değişince verim çıkış kaydımı alabiliyor muyum? Kurulum ve destek bütçesini lisans bedeliyle birlikte hesaplayın. Saha ziyareti ve eğitim dahil mi öğrenin.

## Tek ürünle deneyin

En sık ürettiğiniz ürünü seçin. Reçetesini girin, hammadde lotu açın, iş emri çalıştırın ve maliyet kartına bakın. [NEBSOFT Fabrika ERP](/fabrikaerp) 7 gün ücretsiz denenebilir. Tek bir ürünün hikâyesi programın tesisinize uyup uymadığını size gösterecektir.
