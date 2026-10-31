# Bağımsız denetim: dernek, egitim, danisan, seans paketi, oto kuaför ve vale

Denetim tarihi: 31.10.2026. Dal: `claude/uyelik-egitim-saglik-4305e7`. Denetçi yazar oturumlarının raporlarına dayanmadı; her sonuç burada yazılı denemeden gelir.

## CANLIYA ÇIKMAYI ENGELLEYENLER

### Sunucu kuralı (`server/cloud/`, bu dalda değiştirilmedi, sıradaki kural oturumu kapatmalı)

Hepsi gerçek sunucu + MariaDB ile kanıtlandı: `server/test/uyelik-uctan.test.js` her çalıştırmada `AÇIK` yazar, kural düzelince test kırılır ve işaret kaldırılır.

| # | Program | Hata | Etki |
|---|---|---|---|
| 1 | danisan | Uzman, kendi danışanının kilitli notundaki önceki ekleri silebilir ve değiştirebilir (`notKilit`, `adds: dizi(n.adds)`) | "Kilitli not değişmez, yalnız ek" vaadi tutmuyor |
| 2 | danisan | Uzman, kendi görmediği başka uzmanın danışanına not yazabilir | Başkasının sağlık kaydına yabancı yazı girer |
| 3 | danisan | Uzman, danışanın `owner` alanını değiştirip devredebilir | Yetkisiz kayıt taşıma |
| 4 | egitim | Eğitmene tüm kursiyerler gider (ad, telefon). Satır süzgeci yok | Başka grubun kişisel verisi |
| 5 | egitim | Eğitmene tüm sertifikalar ve doğrulama kodları gider | Başka grubun belge kodu |
| 6 | egitim | Eğitmene diğer eğitmenlerin telefonu gider | Gereksiz kişisel veri |

Önerilen kural yaması, `server/cloud/rol-kural.js`:

- `notKilit`: mevcut ekler sunucudan alınır, yalnız sona eklenen kabul edilir. `const eski = dizi(e.adds); adds: [...eski, ...dizi(n.adds).slice(eski.length)]`.
- `danisan.uzman`: `satir.notes` ve yeni kayıtlar için `client` sunucudaki kendi danışanında olmalı; `clients.owner` korunan alan olmalı.
- `egitim.egitmen`: `satir.trainees` kendi kayıtlı kursiyerleriyle, `satir.certs` kendi gruplarıyla sınırlanmalı; `teachers` yalnız kendi satırı veya `phone` gizli.

Arayüzde eğitmenin sertifika listesi kendi grubuyla süzüldü, ama bu güvenlik sınırı değildir: veri tarayıcıya gitmektedir.

### Satışa kapalılık

7. **danisan tanıtım sayfası var (UYUMSUZ).** `#/urun/danisan` açılıyor: özellik metni, modül listesi, fiyat planı. `#/programlar` listesinde "Yakında · Başlangıç ₺449/ay" kartı var. Kod yorumundaki "pazarlama sitesi sayfası yok" yalnız `site/` için doğru. Satın alma düğmesi yok, yalnız "Haber ver". Kaldırmak için `market/catalog.js` kaydına `hidden: true` veya pazar yeri filtresi gerekir; dosya bu oturumun kapsamı dışında. `hidden` ayarının sunucu `all()` tarafındaki etkisi denenmedi.
8. **danisan demosu herkese açık.** `/apps/danisan/?demo=1` lisanssız açılır, üst şeritte "Satın al" bağlantısı vardır. Yardım verisi de bu programı içerir (`core/yardim.json`, `core/kb.json`).
9. Satış yolları kapalı, aşağıda kanıtlı. Ancak avukat kontrolü, KVKK 2018/10 eşleştirmesi ve fiyat onayı `docs/urun/DANISAN.md` listesinde açıktır.

### Hukuk ve doğrulanamayanlar

10. **KVK Kurulu 2018/10 kararına tam uyum yok.** Karar okundu. "Tüm hareketlerin" loglanması isteniyor; sunucu toplu okumayı hesap başına saatte bir yazıyor, kart görüntüleme kaydı belge içinde ve yalnız klinik rollerde. Uzaktan erişimde iki kademeli doğrulama zorunlu; rol hesapları için zorunlu kılındığı doğrulanmadı.
11. **Kişisel Sağlık Verileri Yönetmeliği kapsamı avukat işi.** Yönetmelik yürürlükte; "özel hukuk gerçek ve tüzel kişileri" kapsamda, üç meslek adıyla geçmiyor. Spec'teki `MevzuatNo=24657` yanlıştı, doğrusu 32610.
12. **Vale fişi biçimi.** Yönetmelik md. 4/a "dipkoçanlı otokopili belge" der, md. 6/7 bastırılıp görevliye teslim edilmesini öngörür. Program iki nüshayı düz yazıcıdan basar. Uygun olup olmadığı DOĞRULANAMADI. Md. 7/b-c (adli sicil, trafik geçmişi) ve md. 6/2 levha programda izlenmez.
13. **Genel kurul "Salt çoğunluk" rozeti.** Yönetmelik md. 15 sayısal yeter sayı vermez. Kaynak Türk Medeni Kanunu olmalı, okunmadı: DOĞRULANAMADI. İkinci toplantı için farklı kural olabilir, rozet bunu ayırmaz.
14. **Canlı sağlayıcı testi yok.** Aşağıdaki entegrasyon tablosunda DOĞRULANDI yazanlar yalnız dokümanla uyumdur.
15. **Fiyatlar örnektir** (dernek, egitim, danisan), kullanıcı onayı bekliyor.

### Test durumu

`bilet-kural.test.js` gece yarısına yakın kırılıyor, `npm test` zincirde ilk hatada durduğu için sonrası koşmuyor. Bu yüzden testler tek tek çalıştırıldı, sonuç "Testler" bölümünde.

## Program sonuçları

Yöntem: yerel sunucu, `?demo=1`, tarayıcı içinde gerçek düğme ve form. Roller demoda kullanıcı değiştirilerek, sunucu tarafı gerçek MariaDB ile denendi. Bulut kipinde yalnız `uye.html` ve `dogrula.html` tarayıcıda açıldı; parola girilmedi, rol ekranları bulutta tarayıcıyla açılmadı.

### Dernek

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Üye + giriş aidatı 100 | Borç 100 | Tuttu |
| Tahakkuk 2027, 600 ₺ | 31 aktif − 9 fahri = 22 üye, 13.200 ₺ | Tuttu |
| Tahsilat 250 | Giriş 100 kapanır, 2027'den 150 | Tuttu |
| Mükerrer belge no A-1 | Reddedilir | Tuttu |
| Tahsilat 700 | 450 borç, 250 avans | Tuttu |
| Tahakkuk 2028, 200 | Avanstan 200, 50 kalır | Tuttu |
| Avansı kullanılmış tahsilat iptali | Reddedilir | Tuttu |
| 250 iptal | Borç 250, avans 50 | Tuttu |
| Yenileme sonrası | Aynı | Tuttu |
| Karar no | Sıradaki 3; genel kurul kendi sırasıyla 1 | Tuttu |
| İkinci toplantı 3 gün sonra | Reddedilir | Tuttu |
| 10 gün sonraya genel kurul | Süre uyarısı | Tuttu |
| Çağrı SMS (sağlayıcısız) | 22 kayıt "TEST — gönderilmedi", çağrı yapıldı yazılmaz | Tuttu |
| Portal, bulut | Kalan 500, ödenen 100 | **Düzeltildi**, önce hiç girilemiyordu |

Not: avans ve borç aynı anda durabilir (250 borç, 50 avans). Program avansı yalnız yeni tahakkukta düşer. Davranış olarak bırakıldı, karar ürün sahibinin.

### Eğitim

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Grup: 3 gün, her gün | 3 oturum | Tuttu |
| 10.000 ₺, 3 taksit | 3333,33 + 3333,33 + 3333,34 | Tuttu |
| Ücret boş | Eğitim ücreti 6.500 | Tuttu |
| Kontenjan, mükerrer kayıt | Onay sorar, reddeder | Tuttu |
| Devam 4/6 saat | %67, 80 altı, belge yok | Tuttu |
| Not 59,5 | Eksik görünür | Tuttu |
| Toplu belge | 1 belge, TEST SMS | Tuttu |
| Şartsız belge | Neden, onay, "Şartsız" etiketi | Tuttu |
| Tahsilat, makbuz | Taksit kapanır | Tuttu |
| Ayrılış, 1.000 iade | Kalan taksit iptal, −1.000 ödeme | Tuttu |
| Taksit sayfası | Toplam ve gecikmiş elle tuttu | Tuttu |
| Hakediş | 24 saat × 400 = 9.600 | Tuttu |
| Doğrulama, bulut | Geçerli, iptal, yok, boş, kısa kod | Tuttu |
| Özet "Geciken taksit" | Taksit sayfasıyla aynı | **Düzeltildi**, önce 4.000 / 15.000,01 |

### Danışan

| Akış | Elle hesap | Sonuç |
|---|---|---|
| Çakışma 10:30 (60 dk) | Reddedilir; 11:00 kabul | Tuttu |
| Seans 1.500, sonra ödeme 1.000 | Bakiye 500 | Tuttu |
| Paket 8.000 | Bakiye 8.500 | Tuttu |
| Paketten seans | 1/8, ücret 0, tahsilat yok | Tuttu |
| Gelmedi | Paket düşmez | Tuttu |
| Süresi dolan paket | Seçenek çıkmaz | Tuttu |
| Not, kilit, ek | Kilitli not düzenlenemez | Tuttu (arayüz); sunucu açığı üstte |
| SMS | "Randevunuz 01.11.2026 12:00. Denge Danışmanlık Merkezi", TEST | Tuttu; hizmet yazmıyor |
| Kişisel veri dışa aktarma | 7 koleksiyon tek kayıtta | Veri denendi; dosya indirilmedi |
| Anonimleştirme | Ad, telefon, not, plan, ek silinir, tutar kalır, iz yok | Tuttu |
| Sekreter | Not, ölçüm, plan sekmesi yok, sağlık alanı formda yok | Tuttu |
| Uzman | Yalnız kendi danışanı; başkasının kartı listeye döner | Tuttu |

### Sağlık verisi, sunucuda

Kanıt `uyelik-uctan.test.js`:

- Veritabanı satırı `nsdoc1:` ile başlar; ad, öykü, not, telefon ham satırda yok, rol yazımlarından sonra da şifreli.
- Hesap sahibinin okuması `audit` tablosunda "Sağlık verisi okundu".
- Sekretere not, ölçüm, plan, öykü, ilaç, hedef gitmez; yazamaz, silemez.
- Uzmana başkasının adı, notu, ödemesi gitmez; kilitli not metni değişmez, kilit açılmaz, taslak not silinmez.
- `POST /api/public/.../danisan/view` kapalı.
- Satış: kayıt formu lisans açmıyor, `/api/trial` 409, `/api/orders/quote` ve `/api/orders` reddediyor, lisanssız veri 402.

Spec'teki şu not doğrudur: şifre sunucuda çözülür, hesap sahibi kilitli notu değiştirebilir.

### Seans paketi (randevu)

- Eski kayıt (`created`, `expires`, `log`, `interval` yok): modül kapalı ve açık listelerde hatasız, "kalan 3".
- Modülü açmak `packages`, `appointments`, `customers` verisini değiştirmedi.
- Satış, elle düşme, geçmiş, geri alma, randevudan paketle ödeme (ücret 0, 1/4, kayıt bağlı), iptal + 500 ₺ iade gider kaydı: tuttu.
- Süre uzatma ve TEST hatırlatma yalnız kod okundu.

### Oto kuaför ve vale (oto)

- Modül kapalıyken menüde yok, varsayılan kapalı. Ayar kaydı yalnız `_settings` değiştirdi.
- Vale: fiş `VL-1001`, plaka `34 ABC 123`, mükerrer plaka reddi, getirme, doğru kodla iade, 150 ₺ kasada, hasar kaydı: tuttu.
- Fişte md. 4/a alanlarının hepsi var: işletme, sürücü, plaka, tarih saat, görevli adı ve telefonu, km. İki nüsha.
- Oto kuaför: 650 ₺ toplam, durum akışı, "hazır" TEST SMS, teslim, garanti ve bakım tarihi, kasa: tuttu.
- Eski oto verisiyle ayrı senaryo: demo veri kullanıldı, kuaför ve vale koleksiyonları yokken ekranlar boş listeyle açıldı.

## Düzeltilen hatalar

| Yer | Hata | Düzeltme |
|---|---|---|
| `apps/dernek/uye.html` | **Üye portalına bulutta doğru kodla bile girilemiyordu**: sunucu telefon göndermiyor, ekran telefonla arıyordu | Giriş sunucu yanıtına dayanır, çıkış belirteci siler |
| `apps/dernek/app.js` | Sayman toplantı, karar, evrak, duyuru yazıyor görünüyor, sunucu sessizce geri alıyordu (sahte başarı) | Düğmeler sayman için kapalı |
| dernek | Sekreterde borç bilgisi yok, borç kuralı açıkken hazirun eksik süzülmeden basılıyordu | Sayman veya başkana yönlendirir |
| dernek | Tutanakta 9 imza isteniyor, çekirdek 2 basıyordu | Katılanlar imza satırı olarak yazılır |
| 5 program | **Sertifika, sağlık planı, vale fişi, tutanak "Takılan parçalar garantilidir" yazıyordu** | Belge türü varsayılanı boş; ₺0,00 sütunları kaldırıldı |
| `apps/egitim/app.js` | Boş gün alanı pazar, "8,9" pazartesi-salı oluyordu | Reddedilir (`hesap.js`) |
| egitim | Geçersiz not sessizce yok sayılıp "kaydedildi" deniyordu | Hata gösterir |
| egitim | Belgesi verilen kursiyerin borcu özette yoktu, bugünün vadesi gecikmiş sayılıyordu | Tek kural |
| egitim | İptal edilen belgeden sonra yeni belge üretilemiyordu | Kilit kalkar |
| egitim | Grup düzenlenince oturumlar eski kalıyordu, hakediş yanlış eğitmene yazılıyordu | Yoklaması alınmayanlar yenilenir |
| egitim | Örnek veride mükerrer SRT numarası | Sayaçtan |
| egitim | Geçerlilik 365 ile çarpılıyordu | Takvim yılı |
| egitim | Eğitmen sunucunun geri alacağı "teslim edildi" düğmesini görüyordu | Kapalı |
| egitim, dernek | Çalışmayan e-Belge menüsü, POS, webhook | Listeden çıktı |
| 3 program | Telefonda başlık düğmelerin altında kalıyordu; simgeli düğmede ad yoktu | Düzeltildi |
| 3 program | 400 karakterlik adla sayfa 7.479 px taşıyordu | Sarar, 1.270 px |
| `apps/danisan/app.js` | Kasa 5.000 danışanda 2,4 sn, takvim 4,2 sn | 35 ms, 52 ms |
| danisan | Eksi kilo, eksi paket bedeli kabul ediliyordu | Reddedilir |
| danisan | Uzman, yetkisi olmayan dışa aktarma düğmesini görüyordu; anonim kart yeniden açılabiliyordu | Kapalı |
| `apps/oto/kuafor.js` | Ödemeden vazgeçince "fişsiz iade" kaydı kalıyordu; teslim km girişten küçük olabiliyordu | Düzeltildi |

Denetim sırasında kendi yamam bir kez danışan kartını bozdu: satır içi `//` satırın kalanını yuttu. Tarayıcı konsolu yakaladı, düzeltildi, test eklendi.

## Kalan hatalar (çekirdek, raporlandı)

| Yer | Hata |
|---|---|
| `core/docs.js` | Genel `terms` varsayılanı "garanti" metni: **tüm programlarda** aynı sorun olabilir, yalnız bu 5 program kapatıldı |
| `core/docs.js` | Yalnız tarih veren belge "31.10.2026 03:00" yazar; imza alanı en çok 2; tutarsız listede Miktar/Tutar başlıkları kalkmaz |
| `core/core.js` | Uygulama düzeyi doğrulamada form kapanır, girilen bilgi kaybolur (ör. TC 11 hane) |
| `core/core.css` | Telefonda `.seg` düğmesi 27 px, simge düğmesi 30 px genişlik; tablo başlığı ve uyarı rozeti kontrastı 2,9-3,0; koyu temada eğitim bağlantı rengi 2,9 |
| `server/cloud/routes.js` | `isOwner` `created` saniyesiyle sıralar: aynı saniyede eklenen ekip üyesi sahip sanılabilir. Testte yaşandı |
| `core/core.js` | `NS.iso(undefined)` bugünü döner: `created` alanı olmayan eski paket kasada bugün görünür |
| `core/integrations.js` `USED` | Aşağıdaki tablo |
| `apps/oto` | Kapalı modülün adresi elle yazılırsa açılır; yalnız menü gizli |
| dernek | Genel tahsilat listesi ilk 2.000 üye; sonrası üye kartından alınır |
| egitim | Sonradan kayıt olanın önceki oturumları devamsız sayılır |

## Durumlar

| Durum | Sonuç |
|---|---|
| 1280 ve 1920, açık tema | Üç programda menüdeki tüm ekranlarda taşma yok |
| 375, açık ve koyu | Üç programda yatay taşma yok; vale, kuaför, paket ekranları koyu temada taşmıyor |
| 1280 ve 1920, koyu tema | Denenmedi: emülasyon temayı uygulamadı. Koyu tema renk ve kontrastı 375 genişlikte ölçüldü |
| Boş liste | Üç programda anlaşılır metin, `undefined` yok, ekleme uyarısı doğru |
| Zorunlu alan, hatalı tutar, eksi tutar | Reddedildi |
| Çok uzun metin, HTML etiketi | Düzeltildi; betik çalışmadı |
| 5.000 kayıt | Dernek 12-334 ms, eğitim 35-54 ms, tahakkuk 165 ms; danışan 35-105 ms, özet 453 ms (günde 5.000 randevuyla) |
| Konsol | Hata yok (yamadan kalan önbellek dışında) |

Önbellek uyarısı: `sw.js` eski `app.js` dosyasını sunar, `V` bu dalda artırıldı. Birleştirmede en büyük değer + 1 yazılmalı.

## Entegrasyon

Okuma tarihi hepsi 31.10.2026. DOĞRULANDI yalnız dokümanla uyumdur, canlı test değildir.

| Program | Bağlantı | Karşılaştırma | Etiket | Kaynak |
|---|---|---|---|---|
| Hepsi | SMS: İleti Merkezi | Adres, `request/authentication/order`, `receipents`, `iys`, `iysList` aynı. Hash üretimi sayfada yok | DOĞRULANDI | https://www.toplusmsapi.com/sms/gonder/json |
| Hepsi | SMS: Verimor | Adres ve temel alanlar aynı. Doküman ticari gönderimde `is_commercial`, `iys_recipient_type` zorunlu der, kod göndermez | **UYUMSUZ** (ticari ileti) | https://github.com/verimor/SMS-API/blob/master/user_guide.md |
| Hepsi | SMS: Netgsm | Resmî sayfa bugün yalnız yer tutucu döndürdü. Kod yorumundaki 28.10.2026 okuması tekrarlanamadı | DOĞRULANAMADI | https://www.netgsm.com.tr/dokuman/ |
| Hepsi | SMS: Twilio | Adres, `To`, `From`, `Body` aynı. Kimlik doğrulama ham metinde okunamadı | DOĞRULANAMADI | https://www.twilio.com/docs/messaging/api/message-resource |
| Hepsi | SMS: Mutlucell | Kod `unverified`, seçilemez | Kural doğru | kod |
| dernek, egitim | WhatsApp Cloud | Adres, Bearer aynı. Doküman `recipient_type` zorunlu der, kod göndermez. `v23.0` sayfada yok. **Üstelik bu iki program WhatsApp çağırmıyor** | **UYUMSUZ** | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages |
| dernek, egitim, danisan | E-posta | Programda çağrı yok, listede var | **UYUMSUZ** (`USED`) | kod |
| egitim | Online ödeme | Programda çağrı yok, listede var. Sağlayıcı dokümanı bu denetimde okunmadı | **UYUMSUZ** (`USED`) | kod |
| dernek, egitim, danisan | Yazıcı | Belgeler tarayıcı yazdırmasıyla çıkar, ESC/POS ayarı etkilemez | DOĞRULANAMADI | kod |
| Hepsi | Yedek | Dış servis yok; geri yükleme denenmedi | DOĞRULANAMADI | kod |
| oto | ANPR (Hikvision, Dahua, Nedap) | `UNVERIFIED` listesinde değil, seçilebilir. Resmî doküman okunmadı | **DOĞRULANAMADI, canlıda seçilebiliyor** | kod |
| oto | ÖKC | `UNVERIFIED`, yalnız simülasyon | Kural doğru | kod |
| oto | POS | Manuel mod kasiyer onayı ister; köprü ve demo terminal denenmedi | DOĞRULANAMADI | kod |
| oto, randevu | SMS sonucu | "TEST — gönderilmedi" kayıtta ve bildirimde | DOĞRULANDI | tarayıcı |

Gerçek hesap kullanılmadı, gerçek ileti gönderilmedi, sağlayıcı parolası girilmedi.

## Mevzuat

| İddia | Program | Etiket | Kaynak |
|---|---|---|---|
| Olağan kurul en geç üç yılda bir | md. 13 | DOĞRULANDI | Dernekler Yönetmeliği: https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=8038&MevzuatTertip=5 (son atıf RG 21.10.2021-31635; md. 84-106 ham okunmadı) |
| Çağrı en az 15 gün, ikinci toplantı 7-60 gün | md. 14 | DOĞRULANDI | aynı |
| SMS ile çağrı | md. 14 "iletişim numarasına mesaj" | DOĞRULANDI | aynı |
| Hazirun, imza | md. 15 | DOĞRULANDI | aynı |
| Sonuç bildirimi 45 gün, EK-3 | md. 17 | DOĞRULANDI | aynı |
| Bilanço haddi 1.500.000 TL | md. 31 | Metin DOĞRULANDI, güncel tutar DOĞRULANAMADI | aynı |
| Dört defter | md. 32 | DOĞRULANDI | aynı |
| Elektronik defter izinli yazılımla | md. 32/b-2, 82 | Bilanço bendi için DOĞRULANDI. İşletme hesabı için DOĞRULANAMADI; md. 33 şartsız "bilgisayar ortamında da tutulabilir" der, avukat yorumlamalı | aynı |
| Dekont alındı yerine geçer | md. 38 | DOĞRULANDI | aynı |
| 5 yıl saklama | md. 39 | DOĞRULANDI | aynı |
| Elektronik alındı izinli yazılımla | md. 42 | DOĞRULANDI | aynı |
| Beyanname ilk dört ay, EK-21 | md. 83 | DOĞRULANDI | aynı |
| Salt çoğunluk rozeti | Yönetmelikte sayı yok | DOĞRULANAMADI | aynı |
| Vakıf, muhtarlık | Program süre uyarısı vermez | DOĞRULANAMADI, doğru davranış | yok |
| Vale fiş alanları, nüsha, iade | md. 4/a, 8 | DOĞRULANDI | https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=KurumVeKurulusYonetmeligi&MevzuatNo=38763&MevzuatTertip=5 (değişiklik kaydı sayfada yok) |
| MYK Seviye 3, sürücü belgesi, iki poliçe | md. 7, 6/8 | DOĞRULANDI | aynı |
| Fiş biçimi, adli sicil, levha | md. 4/a, 7, 6/2 | Program karşılamıyor, üstte | aynı |
| KVKK md. 6, 7499 sonrası, (e) bendi, 6/4 | Spec | DOĞRULANDI | https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=1&MevzuatNo=6698&MevzuatTertip=5 |
| Yeterli önlemler | Spec "okunmadı" diyordu | Okundu, kısmi uyum, üstte. Kararı değiştiren karar listenin 1. sayfasında yok, 2-3. sayfa okunmadı | https://www.kvkk.gov.tr/Icerik/4110/2018-10 |
| Kişisel Sağlık Verileri Yönetmeliği | Spec "doğrulanamadı" diyordu | Yürürlükte, RG 21.6.2019-30808, değişiklik 3.12.2025-33096 ve 4.7.2026-33300 DOĞRULANDI. Üç mesleğe uygulanması DOĞRULANAMADI | https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=32610&MevzuatTertip=5 |
| Sağlık Bakanlığı, e-Nabız, meslek yetkisi | Program içermiyor | DOĞRULANAMADI | Okunmadı |
| Sertifika resmî geçerliliği | Program iddia etmiyor, belge ve doğrulama açıkça yazıyor | İddia yok; kurum türüne göre mevzuat okunmadı | Yok |

## Testler

Çalıştırma, zincirdeki her dosya için ayrı: `TEST_DB_NAME=nebsoft_test_t5`, `TEST_DB_APP_USER=ns_test_t5`.

Zincirdeki 67 dosyanın 66'sı geçti. Kırmızı olan tek dosya `server/test/bilet-kural.test.js`: "Online satış kapandı", saate bağlı, bu dalın değişikliğinden gelmiyor, düzeltmesi ayrı dalda. `npm test` bu yüzden zincirde orada durur.

Atlanan test yok: dört dosyada görülen "atlanır" sözü senaryo adıdır. GİB XSD testi son satırı: `(Use node --trace-deprecation ... to show where the warning was created)`.

Yeni testler: `server/test/uyelik-arayuz.test.js` (21), `server/test/uyelik-uctan.test.js` (29 geçen + 6 bilinen açık). Mevcut test gevşetilmedi.

## Denenmeyenler

- Rol ekranları bulut kipinde tarayıcıda açılmadı (parola girilmedi); roller demoda ve API'de ayrı ayrı denendi.
- Gerçek SMS, WhatsApp, e-posta, kart çekimi, yazıcı, ANPR, ÖKC.
- Gerçek kâğıt çıktısı: belge HTML'i okundu, sayfa düzeni görülmedi. Yazdırma iletişim kutusu pencereyi kilitlediği için yakalandı.
- Masaüstü (Electron) ve Android kabuğu.
- İmzalı belgeler (`NS.forms`) akışı, onam imzası, üyelik belgesi dışındaki tüm şablon tasarımcısı.
- Kişisel veri dosyasının gerçekten inmesi.
- Danışan yaş veya veli akışı, seans düşmeyi geri alma: programda yok.
- Muhtarlık ve vakıf kipi ekranları: yalnız kod okundu.
- `kayit` rolü ekranı: yalnız sunucu okuması.
- Yedekten geri yükleme.
