# NEBSOFT kendi kendini pazarlama planı

Tarih: 31.10.2026 · Dal: `claude/sistem-arastirma-09634e` · Önceki belgeler: `ICERIK-TAKVIMI.md`, `PAZAR-GENISLEME.md`, `docs/PAZARLAMA-ARACI.md`.

Bu belge araştırma özetidir. Hukuki görüş değildir, başarı garantisi vermez. Kod yazılmadı, hesap açılmadı, gönderi ve mesaj atılmadı. Etiketler `CLAUDE.md` §1'e göredir. "Tahmin" yazan rakam ölçüm değildir.

## Tek sayfalık özet

**Ana sonuç:** Reels tek başına müşteri getirmez, ana kanal olarak görülmemeli. 31.10.2026'da bakılan yabancı ve yerli sektör yazılımlarında son 48 Short'un ortanca görüntülenmesi 208 ile 1.500 arasındaydı (§1.1). NEBSOFT'un güçlü yanı başka: 62 rehber, 44 ücretsiz araç, her programın demosu, müşteri sayfalarındaki "NEBSOFT ile hazırlandı" bağlantısı ve yüz yüze pilot. Video bu yolları destekler: arayan kişiye demoyu gösterir, satıcının elindeki kanıt olur.

**Selenium ile Instagram: önerilmez (UYUMSUZ).** Instagram Koşulları açık izin olmadan otomatik erişim ve bilgi toplamayı yasaklar, hesap kısıtlama nedenleri arasında izinsiz etkileşim aracı da vardır. Resmî ve ücretsiz yol bellidir: Meta Business Suite planlayıcısı, sonra gerekirse resmî içerik yayınlama API'si. Selenium veya Playwright'ın doğru yeri kendi demomuzu kaydetmektir.

### İlk 30 gün yapılacak 10 iş

| # | İş | Kim | Maliyet |
|---|---|---|---|
| 1 | Şirket kimliğini, gerçek telefonu ve iletişim e-postasını kesinleştir. Ticari hesap ve İYS bunlara bağlı | Sen | Şirket giderleri |
| 2 | 8 soruyu tek seferde avukata sor (§4.6) | Sen | Avukat ücreti, tutarı bilinmiyor |
| 3 | Instagram profesyonel hesabı, Facebook Sayfası, YouTube kanalı ve telefon doğrulaması, Google İşletme Profili aç | Sen | 0 TL |
| 4 | Ölçümü aç: Search Console, analitik, UTM kuralı, haftalık tek tablo (§5.5) | Oturum + sen | 0 TL |
| 5 | Takvimi düzelt: "31 program" geçen metinleri güncelle, yeni 20 programı sıraya ekle, reklam yönetmeliği değişikliğini işle | Oturum | 0 TL |
| 6 | Üretim hattını kur: OBS, DaVinci Resolve, Subtitle Edit, örnek veri kontrolü, iki küçük araç (UTM üretici, iddia denetleyici) | Oturum + sen | 0 TL |
| 7 | Dalga 1'den 3 program için 3 kullanım videosu ve bu belgedeki 5 senaryoyu çek | Sen | Tahmin: video başına 2 ile 4 saat |
| 8 | Haftada 3 kısa video yayınla, Meta Business Suite ve YouTube Studio ile zamanla. Toplam 9 ile 12 video | Sen | Tahmin: haftada 2 saat |
| 9 | 3 ile 5 pilot işletmeyi yüz yüze bul, `docs/VAKA-FORMU.md` ile izin ve ölçüm al | Sen | Yol ve zaman |
| 10 | 30. gün değerlendirmesi: hangi araç ve video demoya götürdü, neyin devam edeceğine karar ver. Telefon araması gerekirse İYS kaydı burada yapılır | Sen + oturum | 0 TL |

İş 1 ile 2 kapanmadan iş 8 başlamaz. `ICERIK-TAKVIMI.md` kapısı geçerlidir.

### Yapılmayacaklar

| Yapılmayacak | Neden | Durum |
|---|---|---|
| Selenium, bot veya otomatik beğeni, takip, yorum, DM | Instagram Koşulları md. 4.2, hesap kısıtlanır veya kapanır (md. 6) | UYUMSUZ |
| Instagram'dan veya Google Haritalar'dan otomatik veri çekme | Meta yazılı izin ister; Google şartları md. 3.2.3 kopyalamayı yasaklar | UYUMSUZ |
| İzinsiz toplu SMS ve e-posta | Tüketiciye önceden onay şart; cezası bir defada birden çok kişide on katına kadar artar | UYUMSUZ |
| Tacir ve esnafa İYS kontrolsüz ileti | Yönetmelik md. 6/6 | UYUMSUZ |
| WhatsApp'tan soğuk ileti ve toplu gönderim | WhatsApp politikası onay ister, toplu otomatik mesaja hukuki işlem başlatacağını söyler | UYUMSUZ |
| Müşteriden arkadaşının numarasını isteme | KVKK duyurusu 21.07.2026 ve Kurul kararı 2026/1183 (1.000.000 TL ceza) | UYUMSUZ |
| Sahte müşteri, uydurma rakam, başkasını müşteri gibi oynatma | Reklam Yönetmeliği md. 7, ekteki uygulama listesi, `docs/IDDIA-LISTESI.md` | UYUMSUZ |
| Popüler müzik kullanma | Instagram lisanslı kütüphanesi ticari olmayan kullanım içindir | UYUMSUZ |
| Rakip kancasını veya videosunu kopyalama | `CLAUDE.md` §2, yalnız yapı alınır | Kural |
| Yapay zekâ ile sahte kişi veya izinsiz taklit ses | 01.08.2026 kuralı, gerçek kişi kopyasıyla tavsiye yasak | UYUMSUZ |
| İlk 30 günde reklam bütçesi ve API otomasyonu | Dönüşüm verisi yok, haftada 3 video elle zamanlanır | Karar |
| 49 programın videosunu aynı anda üretme | Düzey C ve kapısı olan programlar satılamaz, test oturumları sürüyor | Karar |

### Senden gerekenler

1. Şirket unvanı, MERSİS veya esnaf kimliği, adres, gerçek telefon, gerçek e-posta.
2. Avukat görüşmesi ve 8 sorunun yanıtı.
3. Hesapları kendi adınla açman. Şifre veya kod bana verilmez.
4. Videolarda kendi sesini kullanıp kullanmayacağın kararı. Önerim: evet.
5. Pilot için 3 ile 5 tanıdık işletme.
6. Google Haritalar kaynağı kapalı kalsın mı, Overpass düşük hacimde sürsün mü kararı. Önerim: Google kapalı, Overpass yalnız keşif.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Engel | Durum | Gereken |
|---|---|---|---|
| 1 | Şirket kimliği, yasal metinler, satış akışı, ödeme, destek hattı | `PAZAR-GENISLEME.md` engel 1 ile 5, 8 hâlâ açık | Sen, avukat |
| 2 | Şahıs işletmesi cep telefonu pazarlama için hangi hukuki dayanakla işlenir | DOĞRULANAMADI. Hukuki dayanak kesinleşmeden liste aranmaz | Avukat, A1 |
| 3 | Doktor, avukat, mali müşavir gibi meslekler "tacir veya esnaf" sayılır mı | DOĞRULANAMADI. Bu gruba yalnız organik içerik | Avukat, A2 |
| 4 | WhatsApp iletisi 6563 kapsamında mı | DOĞRULANAMADI. Metin "gibi vasıtalar" diyor, WhatsApp'ı saymıyor. WhatsApp'ın kendi kuralı yine de soğuk iletiyi yasaklıyor | Avukat, A3 |
| 5 | Tavsiye ödülü alan müşterinin paylaşımı "reklam" ibaresi gerektirir mi | DOĞRULANAMADI. 01.08.2026 kuralının metni okunmadı, yalnız Bakanlık özeti okundu | Avukat, A4 |
| 6 | Google Places ile aday listesi | DOĞRULANAMADI. md. 3.2.3(d)(iii) "listings or directory service" ifadesi önceki raporda ele alınmamıştı | Avukat, A5. O zamana kadar kapalı |
| 7 | Genel Overpass sunucusunun ticari kullanımı | UYUMSUZ (`docs/PAZARLAMA-ARACI.md`) | Düşük hacim, sürekli kullanımda kendi sunucu |
| 8 | Eski belgelerdeki rakam: "31 program" | UYUMSUZ. Güncel sayı 51 (`danisan` satışa kapalı, `eczane` yeni satışa kapalı) | Takvim güncellemesi, iş 5 |
| 9 | Reels ve Instagram'ın gerçek izlenme verisi | DOĞRULANAMADI. Giriş yapılmadığı için yalnız YouTube sayıları okundu | Kendi hesabından ilk 30 gün verisi |

Önceki belgelerden kapananlar: alan adı artık `site/src/site.config.js` içinde `https://www.nebsoftapp.com`, `server.js` `DENY` satırında `ic-araclar` var. Rapor bunları açık gösteriyordu.

## 1. Reels ve kısa video

### 1.1 Rakamlar ne söylüyor

Kaynak: YouTube kanal sayfaları, 31.10.2026. Sayılar sayfadan okundu, örneklem her kanalın sayfada gelen son 48 Short'udur. Instagram sayıları okunamadı.

| Kanal | Kim | Son 48 Short ortanca | En yüksek |
|---|---|---|---|
| [Housecall Pro](https://www.youtube.com/@Housecallpro/shorts) | Saha hizmeti yazılımı, ABD | 208 | 821 |
| [Jobber](https://www.youtube.com/@Jobber/shorts) | Saha hizmeti yazılımı, Kanada | 556 | 3,4 bin |
| [Toast](https://www.youtube.com/@ToastTab/shorts) | Restoran yazılımı, ABD | 634 | 4,1 bin |
| [Square](https://www.youtube.com/@square/shorts) | Ödeme ve küçük işletme yazılımı | 743 | 3,2 bin |
| [Paraşüt](https://www.youtube.com/@Parasutcom/shorts) | Ön muhasebe, Türkiye | 1.500 | 5,3 milyon |

Paraşüt'ün en yüksek videosu ortancanın çok üstündedir. Görüntülenmenin reklamla gelip gelmediği sayfadan anlaşılmıyor: DOĞRULANAMADI. Bu yüzden organik başarı örneği sayılmaz.

Türkçe "kuaför randevu programı shorts" aramasında (31.10.2026) kısa videoların çoğu 13 ile 295 görüntülenme arasındaydı, en yükseği 1,1 bindi. 12 ile 74 bin görüntülenen aynı başlıklı uzun videoların reklamlı olup olmadığı DOĞRULANAMADI.

**Çıkarım:** Bu sayılar küçük hesapların az izlendiğini söylemez, büyük hesapların bile organik kısa videoda çok izlenmediğini söyler. Kısa videodan beklenti düşük tutulur. Hedef görüntülenme değil, demoya geçiştir.

### 1.2 İncelenen videolar

Yöntem: her videoda yaklaşık 0,6. saniye, 3. saniye ve son 1,5 saniye kareleri görüldü, üstveri okundu. Video baştan sona izlenmedi, ses dinlenmedi. Metin ve görüntü kopyalanmadı. "Neden çalışıyor" yorumu bu ekibin yargısıdır, ölçüm değildir.

| Video, tarih, süre | Görüntülenme (31.10.2026) | İlk 3 saniye | Kanca türü | Altyazı | Çağrı | Çıkarılan yapı |
|---|---|---|---|---|---|---|
| [Paraşüt, limited şirket](https://www.youtube.com/watch?v=f1ZuPqPOW7A), 06.03.2026, 46 sn | 5.332.777 (reklam durumu bilinmiyor) | Hareketli kişi, ekranı dolduran iki sözcük | Kimlik: izleyicinin şirket türünü söyler | Var | Sonda logo ve kullanım cümlesi | İlk karede hedef kitleyi adıyla söyle |
| [S-AI, berber randevu](https://www.youtube.com/watch?v=GUr2hejXN_Y), 21.10.2026, 27 sn | 1.122 | İş anı, kısa yazı, sonra sayılan telefon araması | Sahne: tanıdık kesinti | Gömülü ve sözcük vurgulu | Soru, tek işlem, numara | Tek sahne, tek dert, tek işlem |
| [Toast, müdavim](https://www.youtube.com/watch?v=ScmUS5_KsCw), 27.05.2026, 11 sn | 4.156 | Mekânda bir replik, tırnaklı yazı | Sektör içi şaka | Gömülü, otomatik yok | Yalnız açıklamada | Ürünü göstermeden sektör dilini konuş, ürünü açıklamada bağla |
| [Jobber, boyacı](https://www.youtube.com/watch?v=m01FEhUuLOw), 01.10.2026, 40 sn | 3.423 | Sabit başlık bandı, kameraya konuşan esnaf | Kazanç sorusu | Gömülü, sonra araya sahne | Görünür çağrı yok | Üstte sabit soru, altta altyazı, konuşmayı iş görüntüsüyle kes |
| [Square, SKU nedir](https://www.youtube.com/watch?v=D3v81jM9koM), 19.05.2026, 60 sn | 3.204 | Sunucu kavramı soruyor | Arama niyeti: "X nedir" | Gömülü | Açıklama | Kısa video da arama sonucu olabilir: tek kavram, tek cevap |
| [Housecall Pro, tesisatçı](https://www.youtube.com/watch?v=NxHbmg10Kmg), 05.08.2026, 61 sn | 430 | Sunucu kendini tanıtıyor | Yok denecek kadar zayıf | Gömülü | Seri, "Part 1" | Zayıf açılış örneği: kişi adıyla başlama, derdi söyle |

### 1.3 Ortak yapı

Bunlar gözlemdir, kanıtlanmış kural değildir. Her kural kendi videolarımızda ölçülür.

| Alan | Uygulama |
|---|---|
| İlk 3 saniye | Görüntü zaten dert anında başlar. Logo, selamlama, ad yok |
| Kanca | Dört tür dene: kimlik ("Sanayide iş emri yazanlar"), sahne, soru, tek kavram |
| Süre | Şaka 10 ile 15 sn, gösterim 25 ile 45 sn, kavram 45 ile 60 sn |
| Altyazı | Görüntüye gömülü, zorunlu. Sesi kapalı izleyen de anlar |
| Sabit başlık | Üstte tek cümle, video boyunca durur |
| Ses | Kendi sesin. Müzik yalnız Meta Ses Koleksiyonu veya YouTube Ses Kitaplığı |
| Çağrı | Tek işlem: "Demo bağlantısı profilde". Birden çok çağrı yok |
| Kapanış | Program adı, adres, "Görüntüler örnek verilerle hazırlanmıştır." |

Kaynaklı platform kuralları:

- Instagram lisanslı müzik kütüphanesi ticari olmayan kişisel kullanım içindir, bazı işletme hesaplarının erişimi kapalıdır. Meta Ses Koleksiyonu ticari amaçla kullanılabilir. DOĞRULANDI: [Instagram Yardım](https://help.instagram.com/402084904469945), [Müzik Kuralları](https://www.facebook.com/legal/music_guidelines) (yürürlük 26.03.2024).
- Başka hesaptan alınmış içerikte kenarlık, filigran veya hız değişikliği özgünlük için yeterli değildir, kurallara uymayan hesap tavsiyelerde daha az görünebilir. DOĞRULANDI: [Instagram özgün içerik kuralları](https://creators.instagram.com/original-content-guidelines).
- Reels teknik: MOV veya MP4, en çok 15 dk, 300 MB, 23 ile 60 kare, 9:16 önerilir. DOĞRULANDI: [Instagram API](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/).
- "İlk 3 saniye" için platformlardan sayısal resmî bilgi bulunamadı: DOĞRULANAMADI. YouTube'un kendi ölçütü ilk 30 saniyedir: [Önemli anlar](https://support.google.com/youtube/answer/9314415).

### 1.4 15 video fikri

Kaynak sütunu düğme ve ekran adının geldiği yeri gösterir. Kayıt sırasında akış tarayıcıda denenir (`ICERIK-TAKVIMI.md` kural 1). Hepsinde örnek veri notu vardır.

| # | Sektör | Kanca | Ekranda | Süre | Program | Durum |
|---|---|---|---|---|---|---|
| 1 | Kuaför | Gece on bir. Yarına randevu isteyen müşteri kime yazsın? | `book.html` | 30 sn | Randevu | Senaryo S1 |
| 2 | Kuaför | Personel primini ay sonunda kaç kez hesaplıyorsunuz? | `Personel & Prim` | 30 sn | Randevu | Hazır |
| 3 | Kuaför | On seanslık paketin kaçı bitti? | Seans paketi | 25 sn | Randevu | Hazır |
| 4 | Kuaför | Gelmeyen müşteriyi not ediyor musunuz? | `Gelmedi`, rapor | 20 sn | Randevu | Azalma vaadi yok |
| 5 | Kuaför | Profilinizdeki bağlantıda ne var? | Online randevu sayfası | 20 sn | Randevu | Hazır |
| 6 | Oto sanayi | "Ben bunu istemedim." | `onay.html` | 32 sn | Oto Servis | Senaryo S2 |
| 7 | Oto sanayi | Plakayı yazın, aracın geçmişi gelsin | `Servis Aç` | 20 sn | Oto Servis | Hazır |
| 8 | Oto sanayi | Muayenesi yaklaşan araçlar nerede yazıyor? | `Hatırlatmalar` | 20 sn | Oto Servis | SMS anlatılmaz |
| 9 | Oto sanayi | Teslim alırken aracın durumu yazılı mı? | Ücretsiz form | 30 sn | Araç | Senaryo S5 |
| 10 | Oto yıkama | "Arabam hazır mı?" | `Yıkama Kuyruğu`, `arac.html` | 25 sn | Oto Yıkama | Hazır (V06) |
| 11 | Market | İnternet gitti. Kasa ne olacak? | `Satış Ekranı` | 30 sn | Market POS | Senaryo S3 |
| 12 | Market | Veresiye defteri kimde kaldı? | `Müşteriler & Veresiye` | 30 sn | Market POS | Senaryo S4 |
| 13 | Market | Gün sonu kasa neden tutmadı? | `Kasa & Gün Sonu` | 25 sn | Market POS | Fark bulur demeden |
| 14 | Market | Raf etiketini elle mi yazıyorsunuz? | `Etiket Basımı` | 20 sn | Market POS | Hazır |
| 15 | Market | Yüzde 30 kâr koydum sanıyorsunuz. Hesap böyle değil | `kar-marji-hesaplama` | 30 sn | Araç | Kavram videosu |

Market POS Dalga 3'tedir: yazarkasa bağı yok. Market videolarında "mali fişi yazarkasanızdan kesersiniz" cümlesi durur, satış Dalga 3 açılmadan zorlanmaz.

### 1.5 Beş tam senaryo

Hepsi `docs/IDDIA-LISTESI.md` ve `ICERIK-TAKVIMI.md` kurallarıyla yazıldı: sonuç vaadi yok, mutlak ifade yok, müşteri yorumu yok, rakip adı yok, fiyat yok. Müzik isteğe bağlı ve düşük seviye, telifsiz kütüphaneden. Yazı sütunu ekrandaki sabit yazıdır, dış ses ayrıca gömülü altyazı olur. Dış ses saniyede 2 sözcükle hesaplandı.

#### S1 · Kuaför: gece gelen randevu (yaklaşık 30 sn)

Kayıt: `/apps/randevu/?demo=1`, telefon genişliği. Sınır: SMS hatırlatması anlatılmaz. `book.html` kapağındaki eski sayı kadraja girmez.

| Süre | Görüntü | Sabit yazı | Dış ses |
|---|---|---|---|
| 0–4 sn | Telefon ekranı, gece saati, salon kapalı görseli | Gece on bir | Gece on bir. Yarına randevu isteyen müşteri kime yazsın? |
| 4–13 sn | `book.html`: hizmet, personel, boş saat seçimi | Müşteri saatini seçer | Online randevu sayfasında müşteri hizmeti seçer, boş saatleri görür, kendine uygun olanı seçer. |
| 13–21 sn | `Takvim`: randevu ilgili personelin sütununda | Takvimde görünür | Sabah salonu açtığınızda randevu takvimde durur. Personelin gününü yan yana görürsünüz. |
| 21–30 sn | Program adı, `nebsoftapp.com/randevusistemi`, örnek veri notu | Demo bağlantısı profilde | Bağlantıyı Instagram profilinize ekleyebilirsiniz. Örnek verili demoyu kayıt olmadan açın. |

Çağrı: Demo. UTM: `utm_source=instagram&utm_medium=reels&utm_campaign=s1-randevu`.

#### S2 · Oto sanayi: "Ben bunu istemedim" (yaklaşık 32 sn)

Kayıt: `/apps/otoservis/?demo=1`. Sınır: onay bağlantısı elle paylaşılır, SMS ve e-Arşiv anlatılmaz. `onay.html` iş emrindeki bağlantıdan açılır. Tartışma bitecek denmez.

| Süre | Görüntü | Sabit yazı | Dış ses |
|---|---|---|---|
| 0–4 sn | Masa üstünde iş emri, ardından ekran | "Ben bunu istemedim." | Ben bunu istemedim. Bu cümleyi tanıyor musunuz? |
| 4–14 sn | `Servis Aç`: plaka, kilometre, şikâyet; `Servisi aç ve iş emrine geç` | Kalem kalem iş emri | Plakayı yazın, şikâyeti girin, iş emrini açın. Parçayı ve işçiliği kalem kalem ekleyin. |
| 14–24 sn | `onay.html` telefon görünümünde | Müşteri telefonundan görür | Onay bağlantısını müşteriye iletin. Müşteri kalemleri görür, istemediğini çıkarır, onaylar. Onay kayıtta durur. |
| 24–32 sn | Program adı, adres, örnek veri notu | Demo bağlantısı profilde | Örnek verili demoyu kayıt olmadan açın. Oto Servis programını yedi gün ücretsiz deneyin. |

#### S3 · Market: internet gitti (yaklaşık 30 sn)

Kayıt: `/apps/pos/?demo=1`. V21'in yeniden kurgusudur, yeni bir özellik iddiası yoktur. Sınır: bağlantı kesme kayıtta gerçekten denenir, "veri kaybı yok" denmez. Çevrimdışı giriş sınırı söylenir.

| Süre | Görüntü | Sabit yazı | Dış ses |
|---|---|---|---|
| 0–3 sn | Satış ekranı, bağlantı simgesi kapanır | İnternet gitti | İnternet gitti. Sıradaki müşteri bekliyor. |
| 3–13 sn | `Satış Ekranı`: barkod, sepete ekleme, durum yazısı | Satış ekranı açık | Satış ekranı tarayıcıda çalışmaya devam eder. Satışı girersiniz, değişiklikler önce bu cihazda bekler. |
| 13–21 sn | Bağlantı gelir, eşitleme yazısı | Bağlantı gelince | Bağlantı geri gelince veriler eşitlenir. Mali fişi yazarkasanızdan kesersiniz. |
| 21–30 sn | Program adı, adres, örnek veri notu | Önce demoya bakın | Çevrimdışı giriş yalnız o cihazda daha önce giriş yapan kullanıcıya açıktır. Demoyu kayıt olmadan açın. |

#### S4 · Market: veresiye defteri (yaklaşık 30 sn)

Kayıt: `/apps/pos/?demo=1`, `Müşteriler & Veresiye`. Sınır: tahsilat artar denmez. Müşteri adları örnektir. Kod dayanağı: `apps/pos/app.js` ödeme ekranı müşteri, limit ve borç gösterir.

| Süre | Görüntü | Sabit yazı | Dış ses |
|---|---|---|---|
| 0–4 sn | Kapalı defter, sonra ekran | Veresiye defteri kimde? | Veresiye defteri yine kimde kaldı? |
| 4–14 sn | `Satış Ekranı`: ödeme türü Veresiye, müşteri seçimi, Limit ve Borç | Satışta borcu görün | Satışta Veresiye'yi seçin, müşteriyi seçin. Limiti ve borcu aynı ekranda görürsünüz. |
| 14–22 sn | `Müşteriler & Veresiye` listesi | Müşteri başına borç | Kimin ne kadar borcu olduğu müşteri listesinde durur. Defteri aramak yerine ismi yazın. |
| 22–30 sn | Program adı, adres, örnek veri notu | Demo bağlantısı profilde | Market POS demosunu kayıt olmadan açın. Mali fişi yazarkasanızdan kesersiniz. |

#### S5 · Oto sanayi ve servis: ücretsiz kabul formu (yaklaşık 30 sn)

Kayıt: `/araclar/servis-kabul-formu/`, gerçek bilgi yazılmaz. Araç teknik servis için yazıldı, sanayi için alanlar kayıtta denenir, uymuyorsa video teknik servise yöneltilir. Yasal geçerlilik iddiası yok. "Kayıt gerekmez" ifadesi kayıt sırasında doğrulanır.

| Süre | Görüntü | Sabit yazı | Dış ses |
|---|---|---|---|
| 0–4 sn | Boş kâğıt üstünde kalem | Teslim alırken yazılı mı? | Teslim alırken durumu yazıya geçiriyor musunuz? |
| 4–14 sn | Araç sayfası: alan doldurma, önizleme | Ücretsiz form | Servis kabul formunu açın, adınızı ve cihaz bilgisini yazın. Önizlemeye bakın. |
| 14–21 sn | Yazdırma penceresi | Yazdır, imzalat | Yazdırın, müşteriye imzalatın. Bu araç ücretsizdir. |
| 21–30 sn | Araç sayfasının altındaki program bağlantısı, örnek veri notu | Bağlantı profilde | Kayıtlı takip isterseniz programı inceleyin. Bağlantı profilde. |

Ölçülecek: `gecis` olayı, yani araçtan programa geçiş.

## 2. YouTube

Rol: YouTube, satın almaya yakın kişinin "nasıl kullanılır" sorusuna cevap verir. `docs/video/<program>.md` içinde 51 programın yaklaşık 70 saniyelik metni zaten var. Bunlar temel alınır, uzun sürümü eklenir.

### 2.1 Kullanım videosu kurgusu

Önerilen yapı (öneridir, ölçülmemiştir):

| Bölüm | Süre (tahmin) | İçerik |
|---|---|---|
| Sonuç | 0:00–0:20 | Videonun sonunda neyin hazır olacağını ekranda göster |
| İlk ayar | 0:20–1:30 | Hizmet, ürün veya personel tanımı |
| Ana akış | 1:30–3:30 | Bir gerçekçi iş baştan sona |
| Müşteri sayfası | 3:30–4:30 | Müşterinin gördüğü bağlantı |
| Sınırlar | 4:30–5:00 | Olmayan bağlantılar açıkça söylenir |
| Kapanış | Son 20 sn | Demo bağlantısı, bitiş ekranı |

Ekran kaydı: yerel sunucu, `?demo=1`, tarayıcı yakınlaştırması artırılır, tarayıcı yer imleri ve bildirimler kapatılır. Yatay 1920×1080. İmleç yavaş hareket eder. Kısa video için aynı akışın telefon genişliği ayrıca kaydedilir, yatay görüntü dikey kırpılmaz. `market/market.js` örnek rakamları kadraja girmez.

### 2.2 Resmî kurallar

| Konu | Kural | Durum | Kaynak |
|---|---|---|---|
| Bölümler | İlk zaman damgası 00:00, en az 3 damga, en kısa bölüm 10 sn | DOĞRULANDI | [Video bölümleri](https://support.google.com/youtube/answer/9884579) |
| Bitiş ekranı | Son 5 ile 20 sn, video en az 25 sn | DOĞRULANDI | [Bitiş ekranı](https://support.google.com/youtube/answer/6388789) |
| Kartlar | En çok 5. Bağlantı kartı YouTube İş Ortağı Programı ister | DOĞRULANDI | [Kartlar](https://support.google.com/youtube/answer/6140493) |
| Shorts | 3 dakikaya kadar, en çok 1080p, dikey | DOĞRULANDI | [Shorts](https://support.google.com/youtube/answer/10059070) |
| Özellik erişimi | Bazı özellikler telefon doğrulaması ister, ileri düzey kanal geçmişi veya kimlik ister | DOĞRULANDI | [Özellik erişimi](https://support.google.com/youtube/answer/9890437?hl=tr) |
| Takip ölçütü | "Intro" ölçütü ilk 30 saniyeye bakar. Rapor en az 60 sn ve 100 izlenme ister | DOĞRULANDI | [Önemli anlar](https://support.google.com/youtube/answer/9314415) |
| Müzik | Ses Kitaplığı'ndaki telifsiz içerik Content ID ile talep edilmez, CC parçada atıf gerekir | DOĞRULANDI | [Ses Kitaplığı](https://support.google.com/youtube/answer/3376882) |

Sonuç: bağlantı kartı ilk aşamada yok. Demo bağlantısı açıklamanın ilk satırına yazılır.

### 2.3 Başlık ve açıklama şablonu

Başlık, aranan cümleyle başlar: `Kuaför randevu programı nasıl kullanılır? İlk randevu 5 dakikalık anlatım`. "5 dakikalık" videonun süresidir, kurulum süresi vaadi değildir. Sayfa arama hacmi Search Console verisi gelene kadar aday sayılır.

Açıklama:

```text
Bu videoda [program] ile [iş] adım adım gösterilir. Görüntüler örnek verilerle hazırlanmıştır.

Demo: https://www.nebsoftapp.com/[slug]?utm_source=youtube&utm_medium=video&utm_campaign=[program]-kullanim

00:00 Ne yapacağız
00:20 İlk ayar
01:30 Günlük kullanım
03:30 Müşterinin gördüğü sayfa
04:30 Programda olmayanlar

Rehber: https://www.nebsoftapp.com/rehber/[rehber]/
```

Rehber yolu üretimden önce sitede kontrol edilir. Rehber sayfasına video gömmek metin kalabalığı yapmadan yardımcı olabilir, sıralama etkisi ölçülmeden iddia edilmez.

### 2.4 Shorts ile ilişki

Her uzun videodan en çok üç kesit çıkar: bir dert, bir özellik, bir sınır. Kesit ayrı kancayla yeniden çekilir veya yeniden kurgulanır, yatay görüntü küçültülüp dikey ekrana konmaz. Shorts'ta uzun videoya bağ yerine tek çağrı verilir. Aynı dikey video Reels ve Shorts'a gider, başka uygulama filigranı taşımaz.

### 2.5 51 program için üretim sırası

`danisan` satışa kapalı ve `eczane` aktif satışta olmadığı için video üretilmez. Kalan 49 program şu sırayla gider. Sıra `PAZAR-GENISLEME.md` dalgalarını izler. Yeni 19 programın sırası öneridir: test oturumlarının sonucuna bağlıdır.

| Sıra | Grup | Programlar | Kapı |
|---|---|---|---|
| 1 | Dalga 1 (5) | servis, otoservis, randevu, spor, oto | Şirket ve yasal engeller |
| 2 | Dalga 2 açık kanal (4) | emlak, galeri, kiralama, kuyumcu | Belge taslaklarında hukukçu |
| 3 | Yeni, saha ve müşteri bağlantılı (8) | lastik, usta, temizlik, nakliyat, peyzaj, kurutemizleme, terzi, okulservisi | Program testi temiz, spec onayı |
| 4 | Dalga 2 okul ve serbest meslek (5) | kurs, anaokulu, veteriner, hukuk, musavir | Yalnız organik, çocuk verisi hukuku |
| 5 | Yeni, sipariş ve rezervasyon (8) | pastane, cicekci, matbaa, mobilya, fotograf, dugun, oyun, yurt | Program testi temiz |
| 6 | Yeni, üyelik ve kırsal (3) | egitim, dernek, ciftci | Program testi temiz |
| 7 | Dalga 3 (8) | adisyon, pos, butik, crm, ik, toptan, site, bilet | Destek kapasitesi. S3 ve S4 tanıtım olarak erken çıkabilir |
| 8 | Dalga 4 (8) | muhasebe, otel, klinik, kargo, fiyatrobotu, pazaryeri, eticaret, fabrika | Her programın kendi kapısı |

Tahmin: tek kişi, senaryo hazırsa uzun video başına yarım gün, kısa video başına 1 ile 2 saat. Haftada 1 uzun video ile 49 programın ilk turu yaklaşık bir yıl sürer. Kaydı otomatikleştirmek (§5.3) bu süreyi kısaltabilir, kazanç deneme yapılmadan bilinmez.

### 2.6 Araçlar

Fiyatlar 31.10.2026'da resmî sayfadan okundu, vergi durumu sayfaya göre değişir, satın almadan önce yeniden bakılmalı.

| İş | Önerilen | Fiyat | Lisans | Not |
|---|---|---|---|---|
| Ekran kaydı | [OBS Studio](https://obsproject.com/) | Ücretsiz | [GPL-2.0 veya sonrası](https://github.com/obsproject/obs-studio) | Yatay ve dikey sahne ayrı kurulur |
| Kendi demomuzun otomatik kaydı | [Playwright](https://playwright.dev/docs/videos) | Ücretsiz | [Apache-2.0](https://github.com/microsoft/playwright) | Yalnız kendi sitemizde |
| Kurgu | [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) | Ücretsiz sürüm, 8-bit ve Ultra HD | Sayfada ticari kullanım ifadesi yok: DOĞRULANAMADI | Studio sayfada 236 USD (eski 295) |
| Basit kurgu | [Clipchamp](https://clipchamp.com/en/pricing/) | 1080p filigransız ücretsiz | Lisans ifadesi okunmadı | Yedek seçenek |
| Açık kaynak kurgu | [Kdenlive](https://kdenlive.org/), [Shotcut](https://shotcut.org/) | Ücretsiz | Sayfada lisans adı yok: DOĞRULANAMADI | Yedek seçenek |
| Altyazı metni | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) veya [Whisper](https://github.com/openai/whisper) | Ücretsiz | MIT | Türkçe doğruluk ölçülmedi. Elde okunur |
| Altyazı düzeltme | [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) | Ücretsiz | MIT | |
| Ses temizleme | [Audacity](https://www.audacityteam.org/) | Ücretsiz | Sayfada lisans adı yok: DOĞRULANAMADI | |
| Müzik | YouTube Ses Kitaplığı, Meta Ses Koleksiyonu | Ücretsiz | Bkz. §1.3 | |
| Ücretli hepsi bir arada | [Descript](https://www.descript.com/pricing) | Aylık 16 ile 65 USD arası, sayfa metninde yıllık ve aylık ayrımı net değil | Ticari ifade yok | Gerek yok |
| Ücretli ekran kaydı | [Camtasia](https://www.techsmith.com/store/camtasia) | Yıllık 39 ile 599 USD, Starter'da editör çıktısı filigranlı | Abonelik kişisel | Gerek yok |
| Yapay ses | [ElevenLabs](https://elevenlabs.io/pricing) | Ücretsiz planda ticari lisans yok, Starter aylık 6 USD | Starter'da ticari lisans | Önerilmez, kendi sesin daha güven verir |
| Mobil kurgu | [CapCut](https://www.capcut.com/pricing) | Fiyat para birimi net değil | Dikkat, aşağıda | Önerilmez |
| Görsel | Canva | [Sayfa](https://www.canva.com/pricing/) 403 verdi | DOĞRULANAMADI | Fiyat yazılmadı |

CapCut için not: [Şartlar](https://www.capcut.com/clause/terms-of-service) (15.04.2026) kullanıcı içeriği için geniş lisans ister. [Malzeme Sözleşmesi](https://www.capcut.com/clause/material-license-agreement) (22.01.2026) seslerin ticari amaçla kullanılmamasını söyler. Ticari hesapta yerleşik ses ve şablon kullanılmaz.

## 3. Otomatik paylaşım

### 3.1 Meta resmî yayınlama

| Konu | Bilgi | Durum | Kaynak |
|---|---|---|---|
| Hesap | Instagram profesyonel hesap gerekir. Kişisel hesap belgelerde desteklenmiyor | DOĞRULANDI | [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/) |
| Hesap geçişi | Uygulamadan ücretsiz geçilir, istenince geri dönülür | DOĞRULANDI | [Instagram Yardım](https://help.instagram.com/502981923235522) |
| İzinler | Instagram girişiyle `instagram_business_basic`, `instagram_business_content_publish`. Facebook girişiyle `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` | DOĞRULANDI | Aynı sayfa |
| Erişim | Yalnız uygulamada rolü olan kişiler kullanıyorsa Standard Access yeterlidir. Rolü olmayanlar için App Review ve iş doğrulaması gerekir | DOĞRULANDI | [Erişim seviyeleri](https://developers.facebook.com/docs/graph-api/overview/access-levels/) |
| Sınır | 24 saatte 50 gönderi; aynı rehberin bir bölümü 100 diyor | UYUMSUZ, belge kendi içinde çelişiyor | [Limit başvurusu](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit.md) |
| Kapsayıcı | 24 saatte 400 kapsayıcı, kapsayıcı 24 saatte düşer | DOĞRULANDI | [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) |
| Reels | `media_type=REELS`, herkese açık `video_url` veya kaldırmalı yükleme | DOĞRULANDI | Aynı sayfa |
| Hikâye | `media_type=STORIES`, video 3 ile 60 sn | DOĞRULANDI | Aynı sayfa |
| API'de zamanlama | Instagram için parametre bulunamadı. Bizim taraftan yayın anında çağrılır | DOĞRULANAMADI | Aynı sayfa |
| Facebook Sayfası Reels | `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`. 3 ile 90 sn, 24 saatte 30 | DOĞRULANDI | [Reels Publishing](https://developers.facebook.com/docs/video-api/guides/reels-publishing/) |
| Facebook API zamanlama | `scheduled_publish_time`, en az 10 dk sonrası, en çok 29 gün | DOĞRULANDI | Aynı sayfa |
| Meta Business Suite | Gönderi taslağı, tarih ve saat planlama, Planlayıcı takvimi, "Aktif zamanlar". Planlananlar menüsü Reels'i de listeler | DOĞRULANDI. Reels planlama adımları ilk yayında denenir | [Planlama](https://www.facebook.com/business/help/2223502627919449?locale=tr_TR) |
| Planlama üst sınırı | Kaç gün ileri planlanır | DOĞRULANAMADI | Yardım sayfasında yok |

### 3.2 YouTube Data API

| Konu | Bilgi | Durum | Kaynak |
|---|---|---|---|
| Kota | Varsayılan günde 100 `videos.insert`, 100 `search.list`, diğerleri için 10.000 birim. Değişebilir | DOĞRULANDI | [Başlangıç](https://developers.google.com/youtube/v3/getting-started) |
| Yükleme izni | `youtube.upload` veya `youtube`, `youtubepartner`, `youtube.force-ssl` | DOĞRULANDI | [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), 15.10.2026 |
| Birim tutarı | Yükleme grubunda 1 birim; geçmiş kayıt 04.12.2025'te yaklaşık 100 birimden söz ediyor | Güncel sayfa esas alındı, Cloud Console'da doğrulanır | [Sürüm geçmişi](https://developers.google.com/youtube/v3/revision_history) |
| Doğrulanmamış proje | Güncel sayfa özel moda zorlanmadığını yazıyor, 2020 kaydı tersini | DOĞRULANAMADI. Bir test videosuyla denenir | Aynı sayfalar |
| Zamanlama | `status.publishAt`, yalnız `private` videoda | DOĞRULANDI | [Videos](https://developers.google.com/youtube/v3/docs/videos), 15.10.2026 |
| Ek kota | Uyum denetimi gerekir | DOĞRULANDI | [Denetim](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) |

Üçüncü taraf: [Buffer](https://buffer.com/pricing) ücretsiz 3 kanal ve kanal başına 10 planlı gönderi, işletme hesabında otomatik yayın (fiyat güncelleme Kasım 2025). [Later](https://later.com/pricing/) kalıcı ücretsiz plan vermiyor, yıllık faturada Starter aylık 18,75 USD. İlk aşamada gerek yok.

### 3.3 Selenium ve tarayıcı otomasyonu

Okunan metin: [Instagram Kullanım Koşulları](https://help.instagram.com/581066165581870), Türkçe, sayfada tarih görünmüyor, 31.10.2026.

| Madde | Söylediği | Etkisi |
|---|---|---|
| Giriş | "Meta Hizmet Koşulları, bu Hizmet için geçerli değildir" | Instagram için bu metin esastır |
| 4.2 | Hizmetin çalışma biçimine müdahale edilemez | Otomasyon bu kapsama girebilir |
| 4.2 | Hesaba giriş yapılmış olsa da açık izin olmadan otomatik erişim ve bilgi toplama yapılamaz | Selenium oturum açsa da kapsamdadır |
| 4.2 | Erişimi sınırlayan teknik önlemler aşılamaz | Bot algılamasını aşma yasaktır |
| 4.2 | Kullanıcı adı, şifre veya erişim belirteci istenemez, toplanamaz | Müşteri hesabı adına Selenium çalıştırma ek risk |
| 6 | İhlalde içerik kaldırılabilir, erişim sonlandırılabilir | Hesap kapatma yetkisi açık |
| 7.4 | Yetkisiz etkileşim için Meta dava hakkını saklı tutar | Hukuki risk |

Ek kaynaklar:

- [Hesap kısıtlama yardımı](https://help.instagram.com/740480200552298/): "Instagram ile izinsiz yollardan etkileşime geçmek için bir uygulama veya hizmet" kullanmak nedenler arasında.
- [Otomatik Veri Toplama Şartları](https://www.facebook.com/legal/automated_data_collection_terms) (07.10.2024): önceden yazılı izin ister.
- [Spam Standardı](https://transparency.meta.com/policies/community-standards/spam/): çok yüksek sıklıkta elle veya otomatik etkileşimi yasaklar, daha düşük sıklıkta da sahtelik işareti varsa kısıtlama olabilir.

**Sonuç: UYUMSUZ.** Metin "Selenium ile gönderi paylaşılamaz" diye tek tek yazmaz. Ancak otomatik erişimi açık izne bağlar, API yolu resmîdir, izinsiz araç hesap kısıtlama nedenidir. Yakalanma olasılığı ve hesap kapanma oranı yayınlanmamıştır: DOĞRULANAMADI. Tek ticari hesabın kaybı, kazanılacak birkaç dakikadan pahalıdır.

| | Yol | Karar |
|---|---|---|
| Önerilen | Meta Business Suite ve YouTube Studio ile elle planlama | İlk 30 gün |
| Önerilen | Haftada 8 videoyu geçince resmî API ile kendi kuyruk aracı, Standard Access, yalnız kendi hesaplar | 30. gün sonrası |
| Olabilir | Buffer, ancak ücretsiz sınır yetmezse | Gerek görülürse |
| Uygun değil | Selenium, Playwright, Puppeteer ile Instagram veya Facebook arayüzü sürme | Yapılmaz |
| Uygun değil | Müşterinin hesabına şifresiyle girip paylaşım yapma | Yapılmaz |
| Uygun değil | Otomatik takip, beğeni, yorum, DM | Yapılmaz |

Selenium fikrinin uygun kullanımı: kendi yerel `?demo=1` programımızda ekran kaydı (§5.3).

## 4. İşletme bulma ve hukuk

Bu bölüm hukuki yorum değil, okunan metnin özetidir. [AVUKAT] işareti onay gerektirir.

### 4.1 Google Places

Tamamı [Google Maps Platform Şartları](https://cloud.google.com/maps-platform/terms) (son değişiklik 26.08.2026) ve [Places Policies](https://developers.google.com/maps/documentation/places/web-service/policies) (30.10.2026).

| Konu | Bilgi | Durum |
|---|---|---|
| Kazıma | Google Maps içeriği dışa aktarılamaz; işletme adı, adres ve yorum kopyalanıp saklanamaz (3.2.3a) | DOĞRULANDI |
| Önbellek | İzin verilen istisna dışında önbelleğe alınamaz (3.2.3b) | DOĞRULANDI |
| İçerik üretme | Google içeriğine dayanarak içerik oluşturulamaz (3.2.3c) | DOĞRULANDI |
| Liste hizmeti | Temel hizmetler liste veya rehber hizmetinde kullanılamaz (3.2.3d-iii) | DOĞRULANDI. Kendi aday listemize uygulanıp uygulanmadığı DOĞRULANAMADI [AVUKAT] |
| place_id | Süresiz saklanabilir | DOĞRULANDI |
| Atıf | Haritasız gösterimde Google logosu gerekir | DOĞRULANDI. Araçta yok: UYUMSUZ |
| Fiyat | Text Search Enterprise ayda 1.000 ücretsiz, sonra 1.000 istekte 35 USD | DOĞRULANDI, [Fiyat](https://developers.google.com/maps/billing-and-pricing/pricing), 30.10.2026 |
| Enlem ve boylam | 30 gün önbellek | Önceki rapor 30.10.2026'da okudu, bu çalışmada yeniden okunmadı |

Karar: Google kaynağı kapalı kalır. Tarayıcı eklentisi veya bot ile Haritalar'dan liste çekilmez. El ile haritada bakmak sonuçları listeye kopyalamaya dönüşmemelidir.

### 4.2 Resmî ve kamuya açık kaynaklar

| Kaynak | Ne verir | Toplu liste için | Durum |
|---|---|---|---|
| [Ticaret Sicili Gazetesi](https://www.ticaretsicil.gov.tr/) | İlan görüntüleme, unvan sorgulama | Satış listesi için değil. Bir firmanın tacir olduğunu tek tek kontrol etmeye yarar | Toplu kullanım şartı DOĞRULANAMADI |
| [TOBB Sanayi Veritabanı](https://sanayi.org.tr/) | Üretici verisi, Fabrika ERP için keşif | Erişim ve kullanım şartı okunamadı | DOĞRULANAMADI |
| [MERSİS](https://mersis.ticaret.gov.tr/) | Giriş odaklı | Ana sayfada firma sorgusu görülmedi | DOĞRULANAMADI |
| [TESK](https://www.tesk.org.tr/) | Meslek ve mevzuat bilgisi | Ana sayfada kamuya açık esnaf listesi yok | DOĞRULANDI (sayfa) |
| OpenStreetMap | Keşif | Telefon oranı düşük, ODbL, Overpass ticari kullanımda UYUMSUZ | `docs/PAZARLAMA-ARACI.md` |
| Meslek odası ve dernek listeleri | Tanıtım izni istenebilir | Sitenin şartı ve kişisel veri ayrıca bakılır | Tek tek bakılır |

En güvenli "işletme bulma" yolu liste satın almak değildir: işletmenin kendi başvurduğu kanalları açmak (rehber, araç, demo, Google İşletme Profili) ve çarşıda yüz yüze ziyarettir. Yüz yüze görüşmede kişisel veri alınırsa aydınlatma gerekir.

### 4.3 6563 ve Yönetmelik

Kaynak: [6563 sayılı Kanun](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf) ve [Yönetmelik](https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5), PDF metni 31.10.2026'da çıkarıldı. Yönetmelik son değişiklik: RG 28.08.2020, 31227.

| Konu | Kural | Yer | Durum |
|---|---|---|---|
| Tanım | Telefon, çağrı merkezi, faks, otomatik arama, akıllı ses kaydı, e-posta, SMS "gibi vasıtalar" | Kanun 2/1-c | DOĞRULANDI |
| Genel kural | Önceden onay | Kanun 6/1 | DOĞRULANDI |
| Esnaf ve tacir | Önceden onay aranmaz | Kanun 6/2, Yön. 6/3 | DOĞRULANDI |
| Ret | Tacir veya esnaf reddederse onaysız gönderilemez | Yön. 6/3 | DOĞRULANDI |
| İYS kaydı | Göndermek isteyen İYS'ye kaydolur | Yön. 5/2 | DOĞRULANDI |
| Tacir ve esnaf adresi | Göndermeden önce İYS'ye kaydedilir, ret kontrol edilir | Yön. 6/6 | DOĞRULANDI |
| Onay isteme | İletiyle onay talebinde bulunulamaz | Yön. 7/4 | DOĞRULANDI |
| Kimlik | Tacirde MERSİS ve unvan, esnafta ad soyad ve T.C. veya vergi no | Yön. 8 | DOĞRULANDI |
| Ret yolu | Her iletide, aynı kanaldan, kolay ve ücretsiz | Yön. 9/3, 9/4 | DOĞRULANDI |
| Bilgilendirme | Tanıtım içeremez, onaysız gidebilir | Yön. 6/2 | DOĞRULANDI |
| Ceza 2026 | md. 12/1-a: 2.859 ile 14.309 TL | Kanun tablosu, RG 25.12.2025/33118 | DOĞRULANDI |
| Toplu gönderim | Bir defada birden çok kişiye aykırı gönderimde (a) cezası on katına kadar artar | Kanun 12/2 | DOĞRULANDI |
| Şikâyet | İletiden itibaren üç ay içinde | [Bakanlık](https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler) | DOĞRULANDI |

İYS: hizmet sağlayıcı başvurusu e-Devlet veya e-imzayla yapılır, Temel Hizmetler ücretsizdir, onay ve ret kaydı hizmet sağlayıcının beyanıyla oluşur, ispat yükü hizmet sağlayıcıdadır, kanallar sesli arama, kısa mesaj, e-postadır. DOĞRULANDI: [İYS](https://iys.org.tr/), [Temel Hizmetler](https://iys.org.tr/hizmet-saglayici/temel-hizmetler), [SSS](https://iys.org.tr/iys/sss).

### 4.4 KVKK

Kaynak: [6698 sayılı Kanun](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf).

| Konu | Kural | Durum |
|---|---|---|
| Kişisel veri | Belirli veya belirlenebilir gerçek kişiye ait her bilgi (md. 3) | DOĞRULANDI |
| Dayanak | Açık rıza veya md. 5/2 şartları; (d) ilgili kişinin alenileştirmesi, (f) meşru menfaat | DOĞRULANDI |
| Aydınlatma | Elde edilirken yapılır (md. 10). Veri kişiden alınmadıysa en geç ilk iletişimde | DOĞRULANDI, [KVKK duyurusu](https://www.kvkk.gov.tr/Icerik/8830/ucuncu-kisilerden-elde-edilen-kisisel-verilerin-reklam-ve-pazarlama-amacli-kullanilmasina-iliskin-kamuoyu-duyurusu), 21.07.2026 |
| Üçüncü kişiden veri | Pazarlama için kendiliğinden dayanak değildir. Görüşmeyi sürdürmek veya SMS'e ret vermemek rıza sayılmaz | DOĞRULANDI, aynı duyuru |
| Tavsiye programı | Marka elçisi yoluyla alınan numaralara izinsiz SMS ve aramada 1.000.000 TL ceza | DOĞRULANDI, [Karar 2026/1183](https://www.kvkk.gov.tr/Icerik/8887/2026-1183), yayın 10.08.2026 |
| Sık SMS | Aynı içeriğin sık gönderimi hakkın kötüye kullanımı sayıldı, 100.000 TL | DOĞRULANDI, [Karar 2024/1350](https://www.kvkk.gov.tr/Icerik/8882/2024-1350) |
| Kamuya açık numara | Alenileştirmenin pazarlama için kullanıma izin verip vermediği | DOĞRULANAMADI, karar özetlerinin ilk sayfasında bulunamadı [AVUKAT] |
| Şahıs işletmesi cep numarası | Açık ifade bulunamadı | DOĞRULANAMADI [AVUKAT] |
| 2026 KVKK ceza tablosu | Yeniden değerleme tutarı okunamadı | DOĞRULANAMADI |

Dikkat: esnaf ve tacir için 6563'teki onay istisnası KVKK dayanağı yerine geçmez. İkisi ayrı denetlenir.

### 4.5 İzinsiz toplu ileti yasal mı

| Kanal | Tüketici | Tacir ve esnaf | Serbest meslek | Uygun yol |
|---|---|---|---|---|
| Toplu SMS | Onaysız yasak | İYS kaydı, ret kontrolü, kimlik, ret yolu şartıyla önceden onay aranmaz. KVKK dayanağı [AVUKAT] | DOĞRULANAMADI, gönderilmez | Düşük hacim, kişiye özel. Tercihen hiç |
| Toplu e-posta | Onaysız yasak | Aynı | DOĞRULANAMADI, gönderilmez | Site üzerinden kendi kaydolanlara |
| Telefon | Onaysız yasak | Aynı, görüşme başında kimlik | DOĞRULANAMADI, aranmaz | Pilot ve küçük liste, `ilkTemas` metni |
| WhatsApp | UYUMSUZ | UYUMSUZ | UYUMSUZ | Sitede "WhatsApp'tan yazın" düğmesi, karşı taraf başlatır |
| Instagram DM | Spam riski | Spam riski | Spam riski | Gelen mesaja yanıt |

WhatsApp dayanağı: [İşletme Mesajlaşma Politikası](https://whatsappbusiness.com/policy/) (23.09.2026) kişinin numarasını vermesini ve opt-in iznini ister. [Toplu mesaj sayfası](https://faq.whatsapp.com/5957850900902049) ürünün çok sayıda veya otomatik mesaj için geliştirilmediğini ve yasal işlem başlatacağını yazar. WhatsApp Business uygulaması yayın listesi kuralı okunamadı: DOĞRULANAMADI.

`ic-araclar/nebsoftpazarlama` otomatik gönderim yapmaz, doğru olan budur. `ilkTemas` telefon metni görüşme başında tanıtım olduğunu ve ret yolunu söyler. Eksik: İYS ret kontrol alanı yok, `DURUMLAR` içinde "Ret" durumu yok (§5.3).

### 4.6 Avukat soruları

| # | Soru |
|---|---|
| A1 | Harita veya OSM'den edinilen şahıs işletmesi cep numarasını aramak için hukuki dayanak nedir? Alenileştirme, meşru menfaat, açık rıza? |
| A2 | Doktor, avukat, mali müşavir, veteriner, eczacı "esnaf ve tacir" sayılır mı? (S24) |
| A3 | WhatsApp ve Instagram DM 6563 kapsamında ticari elektronik ileti midir? |
| A4 | Tavsiye karşılığı 30 gün kullanım alan müşterinin paylaşımı "reklam" veya "tanıtım" ibaresi gerektirir mi? Davet bağlantısı ticari ileti midir? (S23) |
| A5 | Google Places sonucu ile tek kişilik satış aday takibi md. 3.2.3 kapsamında yasak mı? |
| A6 | Reklam Yönetmeliği B2B yazılım tanıtımına uygulanır mı? "Ücretsiz deneme", "kredi kartı gerekmez" ifadeleri nasıl yazılmalı? |
| A7 | 01.08.2026 yapay zekâ kuralı yapay ses ve otomatik altyazıya uygulanır mı? |
| A8 | "NEBSOFT ile hazırlandı" bağlantısı müşterinin sayfasında onay gerektirir mi? Sözleşmede nasıl yazılmalı? |

### 4.7 Reklam kuralları

[Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği](https://www.resmigazete.gov.tr/eskiler/2015/01/20150110-5.htm) (RG 10.01.2015/29232), temel metin okundu:

- Reklamın reklam olduğu açıkça anlaşılmalıdır (md. 6). Reklamlar doğru ve dürüst olmalıdır (md. 7).
- Doğrulanabilir iddia belgelenmelidir, denetimde belge sunulur (md. 9).
- Karşılaştırmalı reklam koşullara bağlıdır (md. 8). Rakip adı kullanılmaz.
- Gerçeğe aykırı olarak kendini tüketici gibi tanıtmak aldatıcı uygulama listesindedir.

[Bakanlık özeti](https://ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeliginde-yapilan-degisikliklerle-tuketicilerin-aldatici-reklam-ve-ticari-uygulamalara-karsi-korunmasi-guclendiriliyor) (01.07.2026, RG 33297, yürürlük 01.08.2026): kazanç veya indirim alan etkileyici paylaşımında "reklam" veya "tanıtım" ibaresi zorunlu, insandan ayırt edilemeyen yapay karakter belirtilir, gerçek kişinin yapay kopyasıyla tavsiye yasak. Değişiklik metninin kendisi okunmadı. Etkileyici kılavuzu da yalnız özetten biliniyor: DOĞRULANAMADI. Bu bölüm `ICERIK-TAKVIMI.md` engel 6'yı daraltır, kapatmaz.

## 5. Kendi kendini pazarlayan sistem

### 5.1 Döngü

```text
Arama ve kısa video  →  Ücretsiz araç veya rehber  →  Demo
                                                      ↓
Yenilik içeriği  ←  Ölçüm  ←  Müşteri sayfası  ←  Deneme ve kullanım
      ↓                            ↓
Yeni rehber ve video      Rozet, tavsiye bağlantısı → Yeni işletme
```

Otomatik olan parçalar: sayfa üretimi, analitik, rozet, tavsiye kodu. İnsan gerektiren parçalar: metin onayı, çekim, pilot, destek. Her dış yayın insan onayından geçer, çünkü iddia kontrolü sorumluluk ister.

### 5.2 Adımlar

Emek tek kişi için tahmindir.

| Adım | Bugün ne var | Yapılacak | Emek | Maliyet | Risk |
|---|---|---|---|---|---|
| Araçtan dönüşüm | 44 araç, her araçta program bağlantısı, `gecis` olayı | İlk 30 günde en çok geçiş veren 5 aracı bul, program metnini oraya göre düzelt | Haftada 1 saat | 0 TL | Rakam azsa karar verilmez |
| Rehberden dönüşüm | 62 rehber | Her rehberin sonuna uygun program demo bağlantısı, 5 Dalga 1 rehberine video gömme | Rehber başına 30 dk | 0 TL | Metin kalabalığı |
| Müşteri çıktısı | `book.html`, `takip.html`, `onay.html`, `arac.html`, `vitrin.html`, `ilan.html`, `karne.html`, `qr.html`, `/t/<slug>/`; `pubBadge` | Rozet kayıt sayısını ölç, işletmeye rozeti kapatma seçeneği için karar al | 2 saat, kod değişirse oturum | 0 TL | Müşteriye habersiz reklam, A8 |
| Tavsiye ağı | `/?ref=`, varsayılan 30 gün ek süre, "Tavsiye et, kazan" sekmesi | Yalnız bağlantı paylaşımı. Numara isteyen form eklenmez | 1 saat | Verilen süre | KVKK 2026/1183, A4 |
| Yeni özellikten içerik | `site/src/yenilikler.json` commit'e bağlı | Her kayıttan taslak çıkar: tek cümle, 15 saniyelik video fikri. İnsan onaylar | Kayıt başına 15 dk | 0 TL | Yapılmayan iş yazılır, commit denetimi korur |
| İçerik takvimi | 36 video metni | Haftalık tek tablo, yeni 19 program eklenir | Haftada 30 dk | 0 TL | Kapı geçilmeden yayın |
| Kanıt | `docs/VAKA-FORMU.md` | Pilot iznini baştan al, sonra tek vaka videosu | Vaka başına yarım gün | 0 TL | İzin ve ölçüm yoksa yayınlanmaz |
| Google İşletme Profili | Yok | Ücretsiz profil, sitede aynı unvan ve iletişim bilgisi | 1 saat, doğrulama bekler | 0 TL | Ev adresi kullanımı, kurallar açılışta okunur |
| Saha | Aday aracı var | Haftada bir sanayi veya çarşı turu, QR'lı demo kartı | Yarım gün | Baskı | Kişisel veri alınırsa aydınlatma |
| Mali müşavir ortaklığı | Bayi başvuru sayfası var | Kişisel tanıdıkla tek deneme | 2 saat | Karar sonrası | Soğuk ileti yok |

Google İşletme Profili: [işletme ücretsiz eklenir](https://support.google.com/business/answer/2911778?hl=tr). API erişimi 60 gün aktif doğrulanmış profil ve web sitesi ister: [Şartlar](https://developers.google.com/my-business/content/prereqs), 28.08.2026. Şimdilik API gerekmez.

### 5.3 `ic-araclar/nebsoftpazarlama` ile ne yapılır

Bugün yapabildikleri: OSM ve isteğe bağlı Google adayı, puan, CSV, durum takibi, ilk temas metni, saklama süresi. Sorumlu kullanım: en çok 20 adaylık küçük liste, önce yüz yüze, aranacaksa A1 yanıtından ve İYS'den sonra.

Eklenecek küçük araçlar. Hiçbiri yazılmadı, sıra önceliktir.

| # | Araç | Ne yapar | Emek (tahmin) | Risk |
|---|---|---|---|---|
| 1 | UTM bağlantı üretici | Kanal, video kodu, program seçilir, bağlantı ve QR çıkar | 2 saat | Düşük |
| 2 | İddia denetleyici | Metinde "hiçbir, asla, en iyi, sıfır, garanti, KVKK uyumlu" gibi ifadeleri ve TEST sınırına giren entegrasyon adlarını işaretler | 4 saat | Yanlış güven: yayın kararı yine insanda |
| 3 | Aday durumlarına "Ret" ve İYS alanı | Ret alan aday tekrar listelenmez, tarih tutulur | 2 saat | Yüksek değer, küçük iş |
| 4 | Yenilik taslağı | `yenilikler.json` kaydından başlık, kısa metin, video fikri üretir | 4 saat | Taslak, otomatik yayın yok |
| 5 | Demo kaydedici | Playwright ile yerel `?demo=1` akışını 1080×1920 kaydeder. Yalnız kendi sunucumuz | 1 ile 2 gün | Düğme değişince betik kırılır |
| 6 | Haftalık ölçüm sayfası | `/api` analitik toplamları ve elle girilen platform sayıları | 1 gün | Az veriyle yanlış karar |
| 7 | Yayın kuyruğu | Resmî Meta ve YouTube API'si, Standard Access, kendi hesaplar. Haftada 8 videoyu geçince | 3 ile 5 gün | Belirteç saklama, dışarıya açık medya adresi |

### 5.4 Maliyet özeti

Tahmin: ilk 30 günde yazılım maliyeti 0 TL ile yapılabilir. Gerçek gider avukat ücreti, şirket işleri, zamandır. Kullanıcının haftalık emeği 8 ile 12 saat. Bu sayılar ölçüm değildir, gelir tahmini yapılmadı.

### 5.5 Kanal başına tek metrik

Mevcut analitik `ziyaret` (kaynak, UTM), `sayfa`, `demo`, `gecis`, `modul` sayar, rıza yoksa saymaz. Hesap ve deneme kendi tablolarından okunur. Hedef rakam yazılmadı, ilk 30 gün taban veri toplanır.

| Kanal | Tek metrik | Kaynak |
|---|---|---|
| Arama (rehber, ürün) | Search Console tıklaması | Search Console |
| Ücretsiz araçlar | Araçtan programa `gecis` | Analitik |
| Instagram | `utm_source=instagram` ile demo açılan ziyaret | Analitik |
| Facebook | `utm_source=facebook` ile demo açılan ziyaret | Analitik |
| YouTube kullanım videosu | `utm_source=youtube` ile demo açılan ziyaret | Analitik |
| YouTube Shorts | Ortalama izleme yüzdesi | YouTube Studio |
| Rozet | `ref` kodlu yeni hesap | `tenants.referred_by` |
| Tavsiye | Ödüle dönüşen davet | `/api/referral` |
| Google İşletme Profili | Web sitesi tıklaması | Profil paneli |
| Saha | Ziyaret başına demo sözü, elle tablo | Tablo |
| Telefon | Görüşme başına deneme başlatma | Aday aracı |
| Pilot | Yedi gün içinde gerçek kayıt giren işletme | Analitik, `docs/VAKA-FORMU.md` |

Karar kuralı (öneri, kanıta dayanmıyor): 30 gün sonunda demoya hiç götürmeyen kanal durdurulmaz, kancası bir kez değiştirilir. İkinci 30 günde de sonuç yoksa emek kaydırılır.

## 6. Kaynak listesi

Okuma tarihi 31.10.2026, aksi yazmıyorsa. Sayfada sürüm veya tarih varsa yanında yazılıdır.

**Meta ve Instagram (resmî):** [Instagram Kullanım Koşulları](https://help.instagram.com/581066165581870) · [Veri kazıma kısıtlaması](https://help.instagram.com/740480200552298/) · [Tavsiye kuralları](https://help.instagram.com/313829416281232) · [Profesyonel hesap](https://help.instagram.com/502981923235522) · [Lisanslı müzik](https://help.instagram.com/402084904469945) · [Özgün içerik](https://creators.instagram.com/original-content-guidelines) · [Müzik Kuralları](https://www.facebook.com/legal/music_guidelines), 26.03.2024 · [Meta Hizmet Koşulları](https://www.facebook.com/terms), 01.01.2025, Instagram'a uygulanmaz · [Otomatik Veri Toplama](https://www.facebook.com/legal/automated_data_collection_terms), 07.10.2024 · [Spam Standardı](https://transparency.meta.com/policies/community-standards/spam/) · [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/) · [content_publishing_limit](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit.md) · [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) · [Facebook Reels](https://developers.facebook.com/docs/video-api/guides/reels-publishing/) · [Erişim seviyeleri](https://developers.facebook.com/docs/graph-api/overview/access-levels/) · [Meta Business Suite planlama](https://www.facebook.com/business/help/2223502627919449?locale=tr_TR)

**WhatsApp (resmî):** [İşletme Mesajlaşma Politikası](https://whatsappbusiness.com/policy/), 23.09.2026 · [Toplu mesaj SSS](https://faq.whatsapp.com/5957850900902049)

**YouTube ve Google (resmî):** [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), 15.10.2026 · [Videos](https://developers.google.com/youtube/v3/docs/videos), 15.10.2026 · [Başlangıç](https://developers.google.com/youtube/v3/getting-started), 15.10.2026 · [Denetim](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits), 15.10.2026 · [Sürüm geçmişi](https://developers.google.com/youtube/v3/revision_history) · [Bölümler](https://support.google.com/youtube/answer/9884579) · [Shorts](https://support.google.com/youtube/answer/10059070) · [Bitiş ekranı](https://support.google.com/youtube/answer/6388789) · [Kartlar](https://support.google.com/youtube/answer/6140493) · [Özellik erişimi](https://support.google.com/youtube/answer/9890437?hl=tr) · [Önemli anlar](https://support.google.com/youtube/answer/9314415) · [Ses Kitaplığı](https://support.google.com/youtube/answer/3376882) · [Maps Şartları](https://cloud.google.com/maps-platform/terms), 26.08.2026 · [Places Policies](https://developers.google.com/maps/documentation/places/web-service/policies), 30.10.2026 · [Maps fiyat](https://developers.google.com/maps/billing-and-pricing/pricing), 30.10.2026 · [İşletme Profili](https://support.google.com/business/answer/2911778?hl=tr) · [Business Profile API](https://developers.google.com/my-business/content/prereqs), 28.08.2026

**Türkiye mevzuatı (resmî):** [6563](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf), 2026 ceza tablosu RG 25.12.2025/33118 · [Yönetmelik](https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5), son değişiklik RG 28.08.2020/31227 · [6698](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf), son değişiklik 7499, yürürlük 01.06.2024 · [KVKK duyurusu](https://www.kvkk.gov.tr/Icerik/8830/ucuncu-kisilerden-elde-edilen-kisisel-verilerin-reklam-ve-pazarlama-amacli-kullanilmasina-iliskin-kamuoyu-duyurusu), 21.07.2026 · [Karar 2026/1183](https://www.kvkk.gov.tr/Icerik/8887/2026-1183) · [Karar 2024/1350](https://www.kvkk.gov.tr/Icerik/8882/2024-1350) · [Ticaret Bakanlığı genel bilgiler](https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler) · [İYS](https://iys.org.tr/) · [İYS Temel Hizmetler](https://iys.org.tr/hizmet-saglayici/temel-hizmetler) · [İYS SSS](https://iys.org.tr/iys/sss) · [Reklam Yönetmeliği](https://www.resmigazete.gov.tr/eskiler/2015/01/20150110-5.htm), RG 10.01.2015/29232 · [Bakanlık değişiklik özeti](https://ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeliginde-yapilan-degisikliklerle-tuketicilerin-aldatici-reklam-ve-ticari-uygulamalara-karsi-korunmasi-guclendiriliyor), 01.07.2026 · [Etkileyici kılavuzu duyurusu](https://tuketici.ticaret.gov.tr/duyurular/sosyal-medya-etkileyicileri-tarafindan-yapilan-ticari-reklam-ve-haksiz-ticari-uyg), yalnız arama özeti

**Veri kaynakları:** [Ticaret Sicili Gazetesi](https://www.ticaretsicil.gov.tr/) · [TOBB Sanayi](https://sanayi.org.tr/) · [MERSİS](https://mersis.ticaret.gov.tr/) · [TESK](https://www.tesk.org.tr/). TÜİK veri portalı açılmadı.

**Araç sayfaları:** §2.6 tablosundaki bağlantılar.

**Video örnekleri (doğrulanmış sayılmaz, yalnız fikir):** §1.1 ve §1.2 bağlantıları, sayılar 31.10.2026'da sayfadan.

**Okunamayanlar:** Canva fiyat sayfası (403). Maps Hizmete Özel Şartlar (bu çalışmada boş döndü, önceki rapor okudu). WhatsApp yayın listesi sayfası. Yönetmelik değişikliğinin 01.07.2026 tam metni. Etkileyici kılavuzunun tam metni. TÜİK. Instagram'ın uygulama içi planlama sınırı.

## Engelleyenler ve senden gerekenler

Engelleyenler: şirket kimliği ve yasal metinler; KVKK dayanağı ve serbest meslek soruları; WhatsApp kapsamı; tavsiye ödülü etiketi; Google kaynağı; takvimin 51 programa güncellenmesi.

Senden gerekenler: şirket bilgileri ve gerçek iletişim bilgisi, avukat görüşmesi, kendi adına hesap açılışları, kendi sesinle video kararı, 3 ile 5 pilot işletme, Google ve Overpass kararı.
