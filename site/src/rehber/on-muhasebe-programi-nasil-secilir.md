---
title: Ön muhasebe programı nasıl seçilir?
description: KOBİ için ön muhasebe programı seçerken fatura, cari, stok, banka ekstresi ve e-Belge başlıklarını gerçek iş akışınıza göre nasıl sınamalısınız?
program: muhasebe
keywords: ön muhasebe programı, KOBİ muhasebe programı, küçük işletme için ön muhasebe programı nasıl seçilir
updated: 2026-10-30
faq:
S: Ön muhasebe programı mali müşavirin yerini alır mı?
C: Hayır. Program fatura, cari ve kasa kayıtlarınızı düzenler. Resmî defterler, beyanların doğruluğu ve vergi yorumu için mali müşavirinizle çalışmaya devam etmeniz gerekir.
S: e-Fatura için ayrıca ne gerekir?
C: Bir özel entegratör hesabı veya uyumlu sağlayıcı gerekir. Bağlantı kurulduktan sonra canlıya geçmeden test yapılmalıdır. Hangi belgeyi kesmekle yükümlü olduğunuzu mali müşavirinizden öğrenin.
S: Başka programdan geçerken verilerimi taşıyabilir miyim?
C: NEBSOFT Ön Muhasebe'de cari ve stok kartları Excel veya CSV ile aktarılabilir. Açılış bakiyeleri de eklenebilir. Sütunlar otomatik eşleşir, var olan kayıtlar ezilmez ve hatalı satırlar listelenir.
S: Banka hareketleri otomatik gelir mi?
C: Banka bağlantısı doğrulanmadığı için doğrudan akış yoktur. Bunun yerine bankanızdan aldığınız ekstreyi Excel veya CSV olarak yükleyip önerilen eşleştirmeleri onaylarsınız.
S: Birden fazla kişi aynı anda kullanabilir mi?
C: Evet. Yönetici, Muhasebe, Satış ve Depo gibi rollerle kullanıcı açılabilir. Pasife alınan kullanıcının açık oturumu kapanır ve yapılan işlemler İşlem geçmişi sayfasında izlenir.
---

Çoğu işletme ön muhasebe programını iki durumdan birinde arar: ya e-Fatura zorunluluğu kapıya dayanmıştır ya da Excel dosyası artık kimsenin güvenmediği bir hale gelmiştir. Her iki durumda da aceleyle yapılan seçim, ay sonunda farklı bir sorun olarak geri döner. Bu rehber özellik listesi vermek yerine, bir ayınızda karşılaşacağınız olayları sırayla sınamanızı öneriyor. Çünkü ön muhasebe programını belirleyen şey ekran güzelliği değil, en karışık faturanızda ne yaptığıdır.

## 1. Fatura: kuruşu kuruşuna aynı mı?

İlk testiniz basittir. Birkaç satırlı, indirimli bir fatura kesin ve üç yerde toplama bakın: programdaki toplam, PDF ve e-Fatura. Satır satır yuvarlama ile sonda yuvarlama arasında kuruş farkı doğabilir. Bu fark küçük görünür ama cari bakiyeniz resmî belgeyle tutmaz. NEBSOFT Ön Muhasebe'de tutarlar e-Fatura ile aynı kuralla satır satır yuvarlanır ve bu otomatik testlerle denetlenir.

Ardından zor senaryoları sınayın:

- İade faturası (alış ve satış iadesi)
- İstisna kodlu fatura
- Tevkifatlı hizmet faturası
- Dövizli fatura
- Tekrarlayan aylık fatura, örneğin kira veya bakım

Dövizli faturada hangi kurun kullanılacağı konusunu mali müşavirinizle netleştirin. Kur politikası sizin kararınızdır.

## 2. Teklif ve irsaliye zinciri

İşiniz mal satıyorsa teklif, sipariş, irsaliye ve fatura bir zincir oluşturur. Her belgeyi baştan yazmak hataya davetiyedir. Programda bir teklifin faturaya dönüşmesini ve irsaliyeden toplu fatura kesilmesini deneyin. "Benzerini oluştur" ve proforma gibi küçük özellikler de günlük hızı belirler.

## 3. Cari: kim ne kadar borçlu?

Cari ekstre, alacak yaşlandırma ve mutabakat temel ihtiyaçtır. Bunların ötesinde bakmanız gerekenler:

| Başlık | Neden önemli |
|---|---|
| Risk limiti | Borcu büyüyen müşteriye satış uyarısı |
| Vade hatırlatma | Geciken tahsilatı azaltır |
| Excel aktarımı | Geçişi hızlandırır |
| Cari portalı | Müşteri ekstresini kendi görür |

Fatura seçmeden yapılan tahsilatın nereye gittiğini de deneyin. İyi bir program parayı en eski vadeli açık faturadan başlayarak dağıtmalıdır. Aksi halde faturalar açık görünmeye devam eder ve boşuna hatırlatma gönderirsiniz.

## 4. Stok ve depo

Mal satmıyorsanız bu bölümü atlayabilirsiniz. Satıyorsanız kritik stok, çoklu depo, transfer, sayım ve çoklu birim önemlidir. Koli ile alıp adetle satıyorsanız birim dönüşümünü sınayın. Bir koli on iki adetse stoğa on iki eklenmeli, fiyat doğru çarpılmalıdır. Fiyat listeleri, bayi ve perakende fiyatını ayırır. Stok raporunda yalnızca değer değil, hiç satılmayan ürünler de görünmelidir.

## 5. Kasa, banka ve nakit

Kârlı görünen işletmelerin para sıkıntısı çekmesi yeni bir hikâye değildir. Program yalnızca geçmişi değil, geleceği de göstermelidir. Nakit akışı tahmini önümüzdeki haftalarda kasanın eksiye düşüp düşmeyeceğini söyler. Ödeme takvimi vadesi gelen yükümlülükleri sıralar.

Banka tarafında dosya ile içe aktarma çoğu KOBİ için iyi bir başlangıçtır. Ekstreyi yüklersiniz, program fatura numarası, VKN, cari adı veya tutara göre öneri sunar, siz onaylarsınız. Aynı hareketin ikinci kez işlenmemesi önemlidir. Canlı banka bağlantısı bizim programımızda bulunmuyor, çünkü bu bağlantı doğrulanmadı.

## 6. Ay sonu ve mali müşavir

Program mali müşavirinizin işini kolaylaştırmalı. KDV beyan taslağı, Ba ve Bs formları ve beyan takvimi işinize yarar. Bu rakamlar taslaktır, son kontrol mali müşavirinizdedir. Beyan son günlerinde dikkatli olun: NEBSOFT'taki takvim hafta sonlarını ilk iş gününe kaydırır, ama dini bayram kaymalarını hesaplamaz. Bu yüzden ekrandaki GİB takvimi bağlantısından teyit edin. Mali müşavirinizle deneme aşamasında bir görüşme yapın ve hangi raporu, hangi biçimde istediğini sorun.

## 7. e-Belge: dürüst sorular

Satıcıya sorun: Hangi entegratörle çalışıyorsunuz, gönderilemeyen belge için ne yapılıyor? Toplu XML ve PDF arşivini indirebiliyor muyum? Veriniz sizindir, bir gün programı değiştirdiğinizde arşiviniz yanınızda gelmelidir. NEBSOFT'ta e-Belgeler bölümünden dönem arşivini tek ZIP olarak indirebilirsiniz.

Bizim tarafımızda e-Fatura ve e-Arşiv bağlantısı Uyumsoft ve Paraşüt üzerinden yapılıyor. Canlı kullanım öncesinde test hesabıyla deneme yapılması gerekiyor. e-İrsaliye, e-SMM ve e-İhracat gibi belgeler sağlayıcı desteğine bağlıdır, bugün için bu bağlantılar canlıda kapalıdır. Bu başlıklar işiniz için zorunluysa bunu baştan konuşun.

## 8. Güven: ayrılan çalışan, silinen kayıt

Yetki ve işlem geçmişi çoğu zaman ilk ihtiyaç listesinde yoktur, ta ki bir sorun çıkana kadar. Kim hangi faturayı değiştirdi, ayrılan çalışan hâlâ giriyor mu? Rollerinizi tanımlayın, işlem geçmişine bakın. Yedek alma ve geri yükleme adımını da mutlaka deneyin.

## 9. Büyüme başlıkları

Şu an gerekmeyebilir, ama üç yıl sonrasını düşünün: proje bazında kârlılık, şube, kullanıcı sayısı. Şubeli yapıda her kullanıcının yalnızca kendi şubesini görmesi önemlidir. Programımızda fatura ve kasa hareketleri için bu kısıtlama var, cari ve raporlar için rollerle ayrıca yetki kapatmak gerekir.

## Bir ayınızı provaya alın

Geçen ayın faturalarından beşini seçin, biri iade, biri tevkifatlı, biri dövizli olsun. Bir cari ekstre çıkarın, tahsilat girin ve ay sonu raporunu mali müşavirinize gösterin. [NEBSOFT Ön Muhasebe Programı](/onmuhasebeprogrami) 7 gün ücretsiz denenebilir. Kurulum sihirbazı işletme bilgisinden kullanıcı tanımına kadar sizi adım adım götürür.
