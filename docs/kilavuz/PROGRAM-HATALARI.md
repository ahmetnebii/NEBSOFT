# Kılavuz yazılırken bulunan program hataları

Tarih: 2026-10-31. Kaynak: beş kılavuz oturumunun devir notları. Kod okuması ve ekran gözlemidir, bu birleştirmede tek tek yeniden denenmedi. Kılavuzlar programın gerçek davranışını yazar, hata düzeltilince ilgili `docs/kilavuz/<id>.js` metni de değişmelidir.

Kapananlar: `scripts/kilavuz/ortak.js` "Henüz kullanılamıyor" metni, sihirbaz görüntüleri, `core/integ-guides.js` Paraşüt notu, `uret.js` paralel üretimde liste ezme. Açık: `kesif.js` portu sabit, `uret.js` roller tablosu rozet sayısını ada ekliyor.

## Grup 1: adisyon, butik, crm, fiyatrobotu, ik, kargo, kuyumcu, muhasebe, pazaryeri, toptan

1. Adisyon, Butik, Toptan, Kuyumcu, Kargo, CRM: `e-Belgeler` menüde, `efatura` `USED` listesinde yok. Entegratör bağlanamıyor, fatura TEST kalıyor. Toptan, Kargo ve CRM'de fatura düğmesi var.
2. Adisyon: `Mutfak fişini ayrıca yazdır` ayarı okunmuyor.
3. Adisyon, Yemek Platformları: `Bağlan` yalnız yerel bayrak.
4. Adisyon, Paket Servis: `Teslim et` yolunda `satis` webhook olayı yok.
5. Adisyon + `claude/sunucu-tanimlari-cffcb8`: Trendyol Go `siparis-cek` ham paket döndürür, program `data.orders` bekler. `menu-senkron`, `durum`, `restoran-durum`, `hazirlik-suresi`, `urun-durum`, `yorum-yanit` istemcide yok. Sipariş programa bu yolla düşmez, kılavuz webhook yolunu yazar.
6. Butik: POS, Fiş yazıcı ve Etiket yazıcı kartları işlem yapmıyor. Kredi kartı cihaza gitmiyor, fiş ve etiket `NS.printHtml` ile tarayıcıdan çıkıyor.
7. Pazaryeri: Etiket yazıcı kartı kargo etiketini etkilemiyor, `NS.printHtml` kullanılıyor.
8. Pazaryeri, Gelen Kutusu: bildirim adresi jetonuyla ekranda görünüyor. Kılavuzda `bulanik` ile gizlendi.
9. Kargo, Gönderi Kabul: ücret kutusunda tutar beyaz alan içinde okunmuyor (`.price-box .v`). Ekrandan görüldü, nedeni incelenmedi.
10. Kargo: WhatsApp kartı yönetim ekranında işlem yapmıyor, yalnız takip sayfasında `wa.me` bağlantısı var.
11. Fiyat Robotu, Senaryo: 1200 px genişlikte kutudaki tutar taşıyor.
12. Muhasebe: `e-İrsaliye gönder`, `eirsaliye` kapalıyken `sendEInvoice` yoluna düşüyor. Envanterde e-İrsaliye sağlayıcıları doküman kapalı.
13. CRM ve İK: `market/catalog.js` içinde `faq` yok.
14. `market/catalog.js` SSS metinleri yeni kurala aykırı ("Henüz hayır"). `sssHaric` ile çıkarıldı, kaynak düzeltilmeli.

## Grup 2: randevu, servis, otoservis, oto, kiralama, galeri, spor, kurs, anaokulu, emlak

- servis: e-Belgeler menüde, USED.servis içinde efatura yok; entegratör bağlanamaz, teslimde fatura seçeneği çıkmaz.
- randevu: Ödeme al > Belge listesinde ÖKC ve e-SMM var, Entegrasyonlar'da kartları yok, belge kesmez.
- randevu: personel kartında gün kısaltmaları karışık (Paz/Paz, Cum/Cum).
- randevu: webhook yalnız randevu_hatirlatma olayını gönderir.
- randevu: SECTOR metni takvim için "yazılır" diyor, gerçekte abonelik adresi (tek yönlü, bulut hesabı).

# Güncelleme: on programın içeriği commit'lendi (son commit 992edd9)
Ek bulgular:
- USED listesinde efatura yok ama e-Belgeler menüde: servis, kiralama, galeri, spor, kurs, anaokulu, emlak. "Fatura kes" TEST belge üretir.
- USED listesinde sms yok ama programda SMS düğmesi var: oto, kiralama, spor, emlak.
- otoservis Bildirimler: "Online ödeme alındı" olayı var, onay sayfasında ödeme yok.
- ortak.js nav etiketi rozet sayısını taşır: galeri "Müşteri Talepleri\n3", anaokulu "Veli Mesajları\n1". Roller tablosunda sayı görünür. Modülde baslik ile aşıldı, roller tablosu üreticide.
- ortak.js yeni kural için hâlâ "Henüz kullanılamıyor" yazıyor (etiket, kutu, özet tablo). kilavuz-altyapi'da düzeltilmeli; içerik dosyaları kapali metni "NEBSOFT ile iletişime geçerek açtırılır." veriyor.
- kesif.js portu 9472 sabit.

## Grup 3: klinik, eczane, veteriner, hukuk, musavir, otel, bilet, site, fabrika

1. klinik: tahsilattaki e-Fatura/e-Arşiv NS.integ.sendEInvoice eski yolunu kullanıyor, NS.ebelge.create değil. Belge e-Belgeler sayfasına düşmez (CLAUDE.md §4).
2. klinik: Reçete penceresi tanı ve ilaç alanlarını örnek tıbbi metinle dolu açıyor (app.js satır 136). Yanlışlıkla yazdırılabilir. Kılavuzda uyarıldı, görüntüde bulanık.
3. klinik: Tahsilattaki Taksit seçimi cihaza gitmiyor, cardPayment installment parametresini okumuyor.
4. klinik: core/notify.js `appointments` koleksiyonunu dinliyor, programda bu koleksiyon ve online randevu sayfası yok. Bildirim seçeneği işlevsiz görünüyor.
5. e-SMM: kodda Paraşüt doğrudan gönderimi var (directCall), sihirbaz rehberi hepsini "desteklenmiyor" gösteriyor. UYUMSUZ. Kılavuz "kullanılamaz" yazdı.
6. site/tools/yardim-icerik.js: "e-Nabız gönderimi hazır mı?" cevabı bağlantı varmış gibi okunuyor, kod yalnız simülasyona izin veriyor. Kılavuzda sssHaric ile çıkarıldı.
7. eczane: Hastalar penceresindeki "(katılım %10)" etiketi sabit, Ayarlar oranı değişse de güncellenmez.
8. eczane: demo verisinde reçete talebi yok, Online Reçeteler görüntüsü boş. Hata değil, kılavuzda belirtildi.

Veteriner hataları: app.js:98,114,143 VETBİS/PETVET öğeleri yalnız ?demo=1 ile görünür; integrations.js:838 USED efatura eksik; karne.html:106 v.batch, app.js:98 lot; app.js:63 karneUrl sorguyu silmez; app.js:108 Vazgeç işlemi bitirmez; app.js:152-154 karne artısı çalışmaz; app.js:156 onam hastaya bağlanmaz.
Hukuk hataları: app.js:265 Görevler süzgeci TypeError; integrations.js:832 esmm USED'de yok ama tahsilatta kutu var; app.js:12 yeni avukat listeye girmiyor; app.js:225 olmayan silme düğmesini söylüyor; kurulum-adimlari.js:53 duruşma adımı yanlış sayfa; uret.js:18 navHepsi rozet sayısını ada ekliyor; integ-guides.js:219 Paraşüt notu sendParasut koduyla çelişiyor.
- musavir e3c2bc0: 14 modül, 70 s, 45 ekran, 6,3 MB.
Müşavir hataları: portal.html:85 yalnız dosya adı kaydediliyor ama "iletildi" diyor (sahte başarı); catalog.js:296 SSS eski; portal.html:71 f.smm, app.js:162 pay.doc; app.js:183 esmm integrations.js:834'te yok; app.js:107 SMS gitmese de durum değişiyor; ortak.js:114 sssHaric K.sss'e de uygulanıyor.
- otel 4710863: 14 modül, 78 s, 53 ekran, 7,3 MB.
Otel: HotelRunner uyumsuz (app.js:103-110 ile hotelrunner.js:18, kod okundu); uret.js:18 kilit kısmi UNVERIFIED'i tümü sayar; ortak.js:51 rehbersiz POS markalarını kapalı basar; app.js:224 POS TEST folyoya ödeme yazar; app.js:174-175 Kapora folyoya işlemez; app.js:278-281 sendEInvoice; rezervasyon.html:101 yerelde 3D Secure yazısı; rezervasyon.html:78-81 sabit oda içeriği; app.js:580 +%-10; catalog.js:102 SSS eski.
- bilet e8fe53e: 14 modül, 78 s, 58 ekran, 8,0 MB.
Bilet: app.js:54,239 POS çağırır, integrations.js:828 USED'de pos yok; turnike UNVERIFIED'de değil; app.js:117 kapı açılmasa da kullanıldı; notify.js:76 holds izler; bilet.html:104 genel girişte kilit yok; bilet.html:98 tam iade, app.js:196 feeRefund; app.js:21 onlineUrl demo; catalog.js eski; app.js:198 indirim hakkı dönmez; data.js tohumunda pay yok (app.js:250 undefined).
- site ac9323b: 19 modül, 87 s, 57 ekran, 7,7 MB.
Site: sakin.html:298-324 yerelde her 16 hane kabul, kalıcı makbuz (sahte başarı); sakin.html:293 otomatik eşleşir; sakin.html:362 sabit 250 TL; sakin.html:292 iban; app.js:332 ile integrations.js:837 uyuşmuyor; app.js:23 paidAt; #py yıl 2.027; faiz/tazminat adı; payment kartlı sağlayıcılar sakin.html'den çağrılmıyor; ortak cümle "dokümanı herkese açık değil" bu sağlayıcılar için yanlış.
- fabrika fd718a0: 26 modül, 144 s, 91 ekran, 13,3 MB.
Fabrika: app.js:154-171 Karantina transferi; app.js:328 Seç→sipariş durumu; app.js:410 bildirim gitmez; app2.js:143 sayac-sifirla; bayi.html:53,58,66,75,97; app2.js:194,336; app.js:406; e-İrsaliye kartı akışı etkilemez; kantar yalnız mal kabul; PLC yalnız sayaç; banka USED'de yok.

## Grup 5: fotograf, oyun, mobilya, okulservisi, ciftci, lastik, dernek, egitim, danisan

- oyun: Ayarlar "IBAN (üye sayfasında görünür)" `kart.html`de kullanılmıyor. Kılavuz gerçek durumu yazar.
- ciftci: Alımda "e-Müstahsil gönder" işaretli, bağlantı kapalıysa `eMustahsil()` sessiz çıkıyor, kullanıcı uyarı almıyor.
- ciftci: SMS kartı var, programda SMS gönderen çağrı yok. Alım ve satışta fatura düğmesi yok.
- dernek, danisan: E-posta kartı var, gönderen düğme yok. egitim: WhatsApp ve e-posta kartı var, iş ekranında düğme yok. Terzi'deki sorunla aynı tür.
- ciftci: Özet kutusunda büyük tutar taşıyor, Hesap ekstresi penceresinde son sütun 1200 px'te kesik.
- lastik: Demo verisinde açık iş yok, İş Emirleri boş açılıyor. Kılavuz iş ekranı için üretim sırasında açık iş kaydı oluşturur.
- Katalog: ciftci "e-Müstahsil gönderilir mi?" metni yeni kurala aykırı, `sssHaric` ile çıkarıldı, yeni metin kılavuzda.

## Üretim sırasında bulunan

- oto: Demo yıkama kuyruğu rastgele dolar, sütunlar boş kalabilir. Kılavuz sahnesi eksik durumları kendi ekler.
- egitim: Üyelik denetimi `efatura` bağlantısını kaldırmıştı, kılavuzdan e-Belge modülü çıkarıldı.
