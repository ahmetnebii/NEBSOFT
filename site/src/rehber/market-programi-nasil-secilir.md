---
title: Market programı nasıl seçilir?
description: Market ve şarküteri için barkodlu satış programı seçerken kasa hızı, terazi, iskonto, iade, veresiye ve yazarkasa bağlantısında neleri sınamalısınız?
program: pos
keywords: market programı, barkodlu satış programı, küçük market için program nasıl seçilir
updated: 2026-10-30
faq:
S: Terazili ürünler barkod sistemine nasıl girer?
C: Barkodlu terazi, tartılan ürün için fiyat veya ağırlık içeren özel bir barkod üretir. Program bu barkodu tanıyıp doğru ürünü ve tutarı kasaya getirmelidir. Seçtiğiniz terazinin barkod biçimini programda deneyin.
S: Eski programımdaki ürünleri taşıyabilir miyim?
C: Çoğu program Excel veya benzeri dosya ile aktarım destekler. Taşımadan önce barkodları temizleyin ve aynı barkodun iki üründe olmadığını kontrol edin.
S: Yazarkasa olmadan program kullanılabilir mi?
C: Program stok ve satış takibi için kullanılabilir, ancak mali fiş zorunluluğu olan işletmede fiş yazarkasadan kesilmelidir. Programın verdiği fiş bilgi fişiyse bunu ayrıca bilmelisiniz.
S: Eksi stokla satış açık mı kalmalı?
C: Marketlerde kasayı durdurmamak için çoğu işletme açık tutar. Ancak açık kalırsa sayım farklarını düzenli izlemeniz gerekir. Karar işletmenizin stok disiplinine bağlıdır.
S: Birden fazla şube için uygun mu?
C: Çoklu şube ve merkezden fiyat yönetimi her programda yoktur. NEBSOFT Market'te bu özellik henüz yok. Birden çok şubeniz varsa bu başlığı satın almadan önce özellikle sorun.
---

Bir market programını değerlendirmenin en iyi yolu, tanıtım videosu izlemek değil, kasanın başına geçip elinize bir sepet almaktır. On beş kalemlik, içinde tartılı peynir, kampanyalı deterjan ve barkodu okunmayan bir poşet ekmek olan bir sepet. O sepeti kaç saniyede, kaç hatayla, kaç tuşla bitirdiğiniz program hakkında broşürden fazlasını söyler. Bu rehber o sepetten başlayarak seçimi adım adım anlatıyor.

## Kasa hızı: asıl ölçü

Market müşterisi bekleyen müşteridir. Kasada şunları sınayın:

- Barkod okutulunca ürün gecikmeden ekrana geliyor mu?
- Klavye ve hızlı tuşlarla işlem yapılabiliyor mu?
- Barkodu olmayan ürünler için hızlı ürün ve kategori düğmesi var mı?
- Ürün adıyla arama binlerce kayıtta akıcı mı?

Küçük bir dükkânda bile ürün sayısı birkaç bin olabilir. Demo verisiyle hızlı görünen bir ekran gerçek listede yavaşlayabilir. Bu yüzden denemede kendi ürün dosyanızı yüklemeye çalışın.

## Terazi barkodu

Şarküteri, manav ya da kuruyemiş satıyorsanız terazi konusu pazarlık dışıdır. Program terazi barkodunu tanımalı. NEBSOFT Market'te 27 önekli terazi barkodu destekleniyor. Kendi terazinizin hangi öneki ve biçimi kullandığını öğrenip denemenizi buna göre yapın.

## İskonto ve kampanya mantığı

Kampanya ekranı basit görünür ama hata burada para olur. Şu senaryoları tek tek deneyin:

1. Üç al iki öde kampanyası.
2. Kategori bazında yüzde indirim.
3. Kupon uygulanmış sepet.
4. Satır indirimi üstüne genel indirim.

Her birinde fiş toplamı ile kalem toplamı aynı mı? Kuruş farkı nereye gidiyor? Sektörde "iskonto yazarkasaya yansımıyor" şikâyeti bilinen bir konudur. Programınız indirimi satırlara dağıtabilmeli ki mali fiş ile sistem aynı tutarı göstersin.

## İade: kasadaki en riskli işlem

İade akışını mutlaka deneyin. Üç soru önemlidir:

- Müşteriye ödediği tutar mı iade ediliyor, yoksa bugünkü fiyat mı?
- İade tamamlanmadan fiş "iade edildi" görünüyor mu?
- Kasiyer tek başına fişsiz iade yapabiliyor mu?

NEBSOFT'ta fişten iadede satırlar ödenen net birim fiyatla gelir, fiş ancak iade ödemesi tamamlanınca işaretlenir. Kasiyerin yetkisini aşan işlemlerde yönetici PIN'i istenir ve yanlış PIN işlem geçmişine yazılır.

## Yetki ve kayıp kontrolü

Birden fazla kasiyeriniz varsa indirim sınırı koyabilmelisiniz. Örneğin kasiyer belirli bir yüzdeye kadar onaysız indirim yapsın, üstünde yönetici gelsin. Onaylı işlemlerin raporlanması da önemlidir. Fiş, kasiyer, onaylayan ve tutarı birlikte gören bir rapor, ayda bir değil haftada bir bakılacak bir ekrandır.

## Yazarkasa bağlantısı için doğru sorular

Mali fiş zorunluluğu olan işletmede bu en kritik başlıktır. GİB'in GMP-3 belgesine göre bağlantı Ethernet, RS232 veya USB gibi kablolu yollarla kurulur. Yazılımın ÖKC üreticisinin kütüphanesini kullanması ve üreticiyle güvenlik taahhütnamesi yapılması gerekir. Tarayıcıdan çalışan yazılımlar için bilgisayarda ayrı ara yazılım gerekir. Satıcıya sorun:

| Soru | Beklenen cevap |
|---|---|
| Hangi cihazlarla çalışıyorsunuz? | Marka ve model listesi |
| Üretici taahhüdü var mı? | Evet, belgesiyle |
| İndirim fişe yansıyor mu? | Canlı gösterim |
| Bağlantı koparsa ne olur? | Yazılı süreç |

Burada açık olalım: NEBSOFT Market'te ÖKC bağlantısı doğrulanmadı ve yalnızca TEST olarak çalışıyor. Bu nedenle fişimiz bilgi fişidir. Mali fiş zorunluysa bu sınırı bilerek karar vermelisiniz. Üretici kütüphanesi ve test cihazı olmadan bu bağlantıyı "var" diye sunmuyoruz.

## Veresiye ve müşteri takibi

Mahalle marketinin gerçeği veresiyedir. Müşteri bazında borç, ödeme ve limit tutulmalı. Limit aşıldığında kasa uyarmalı. Müşterinin ekstresini gösterebilmek tartışmayı kısa keser. Veresiye defterinden programa geçişi ayrı bir yazıda ele aldık.

## Stok tarafı

Satış programı stok tutmuyorsa yarım kalır. Alış faturası girişi, sayım, raf etiketi ve vardiya raporu temel beklentilerdir. Fiyat değişince etiketi yenileyebiliyor musunuz, sayım farkını görebiliyor musunuz? Eksi stokla satış ayarı açık mı kapalı mı, kararı siz verebiliyor musunuz?

## Geçiş gününü hesaba katın

Yeni program seçmek, eski programı bırakmak demektir. Geçişi yoğun bir güne denk getirmeyin. Ay başı, maaş günü ve bayram öncesi kötü seçimdir. Ürün listesini önce temizleyin, aynı barkodlu iki kaydı ayıklayın, artık satmadığınız ürünleri çıkarın. Kasiyerlere yarım saatlik bir deneme yaptırın ve onlara en çok kullanacakları beş işlemi gösterin: satış, indirim, iade, veresiye, gün sonu. Kasada çalışan kişi ekranı kabul etmezse en güçlü program bile verim vermez. Bu yüzden karar aşamasında kasiyerinizin de görüşünü alın. Hangi ekranda takıldığını size o söyler.

Destek konusunu da bu aşamada netleştirin. Sistem sorunlarında kasanın durması, marketin en pahalı anıdır. Sorun yaşadığınızda hangi kanaldan, hangi saatlerde yanıt alacağınızı satın almadan önce öğrenin.

## Kaçırılan küçük ayrıntılar

Program seçerken genellikle unutulan birkaç konu:

- Gün sonu raporu mali Z raporu ile karıştırılmayacak şekilde mi adlandırılmış?
- Vardiya değişiminde kasa nasıl devrediliyor?
- Verilerinizi dışarı alabiliyor musunuz?
- Yedekleme kim tarafından yapılıyor?

Tek şubeyle başlayıp büyümeyi planlıyorsanız çoklu şube desteğini baştan sorun. Bizim programımızda bu özellik henüz yok, sonraki aşamada.

## Kendi sepetinizi deneyin

Yazının başındaki on beş kalemlik sepeti gerçekten kurun. Bir kampanya tanımlayın, bir iade yapın, bir veresiye yazın, gün sonunu alın.

[NEBSOFT Market Programı](/marketprogrami) 7 gün ücretsiz denenebilir. Mali fiş sınırını bilerek, kendi ürünlerinizle deneyin ve kasanızın başında karar verin.
