# Okul servisi / personel servisi yazılımı — ürün araştırması

Erişim tarihi (tüm kaynaklar): 30.10.2026. Kod yazılmadı. Rakip metni kopyalanmadı; yalnız karşılanan ihtiyaç çıkarıldı.
Etiketler: DOĞRULANDI (resmî sayfa/metin doğrudan okundu) · UYUMSUZ · DOĞRULANAMADI.

## CANLIYA ÇIKMAYI ENGELLEYENLER (başa alındı)
1. **Okul Servis Araçları Yönetmeliği'nin güncel (değişiklikli) birleşik metni okunamadı.** Okunan metin Resmî Gazete 25.10.2017 / 30221 özgün metnidir; yönetmelik sonradan değişmiştir (2024 ve 2025 değişiklikleri arama özetinde anılıyor). Madde numaraları/yaş sınırı/belge listesi değişmiş olabilir. mevzuat.gov.tr PDF'i ve tut.meb.gov.tr PDF'i sıkıştırılmış olduğundan okunamadı. → Yazılımın "mevzuata uygun" iddiası için birleşik metin elle doğrulanmalı. **Senden gerekli:** mevzuat.gov.tr (MevzuatNo=24022) güncel metnini yapıştır ya da onayla.
2. **MEB "Öğrenci Servisi Planlama, Takip, Kontrol, Bilgilendirme ve Yönetim Sistemi" Yönergesi**'nin resmî metni bulunamadı; yalnız CNN Türk haberi (24.07.2025, ikincil kaynak) var. Veri akışı/entegrasyon (MEB sistemine veri verme) varsayılamaz → DOĞRULANAMADI. Entegrasyon canlıda seçilemez, ürün şartnamesine yazılmaz.
3. **KVKK 6698 madde metinleri** (4, 5, 6, 10, 12) resmî sayfadan okunamadı (kvkk.gov.tr sayfası yalnız menü döndü, 404 resmigazete URL'si). Aşağıdaki KVKK maddeleri hafızadan, doğrulanmadı.
4. Sağlayıcı test hesabıyla canlı deneme (§1 "dokümanla uyum ≠ canlı test") yapılmadı; SMS/otomatik arama ve GPS cihaz entegrasyonları için resmî API dokümanı hiç incelenmedi.

## (a) İncelenen ürünler
Ürünlerin kendi siteleri açılmadı/bulunamadı; yalnız App Store sayfaları okundu. Tüm iddialar üretici beyanıdır, bağımsız doğrulama yok. Puan/yorum verisi çok az (aşağıda).

| Ad | URL | Tarih | Karşılanan ihtiyaç |
|---|---|---|---|
| Servis Map (Murat Uresin) | https://apps.apple.com/us/app/id1643281218 | v1.1, 10.05.2023 | Veliye SMS + otomatik arama ile yaklaşma uyarısı; öğrenci serviste unutulmasını önleme; biniş sırası/durak; iniş-biniş bilgisi; haritada konum; güzergâh tarifi; veli+okul+servis firması+şoför rolleri. Yorum: yetersiz. |
| PortAkıl (Sence Bilişim) | https://apps.apple.com/eg/app/portak%C4%B1l/id1662108763 | v2.5.9, 01.11.2024 | Anlık konum; biniş-iniş saatleri ve geçmiş kullanım; eve yaklaşınca otomatik bildirim; veliden "bugün binmeyecek" bildirimi; etüt için servis planı; veli-şoför/hostes mesaj/arama. Yorum: yetersiz. |
| ServisCell (Polar Teknoloji) | https://apps.apple.com/pk/app/serviscell/id1149819021 | v4.4.96 (15 Eki, yıl yok) | Veliye anlık bildirim ve rapor; çevrimiçi araç izleme; bildirim mesafesini veli ayarlar. Puan 4,3 (3 oy), yazılı yorum yok. |
| Okul Servisi Yönetim (Hasan Aylas) | https://apps.apple.com/us/app/id6444726010 | v1.0.6 (16 Eki, yıl yok) | Güzergâh/araç/şoför/rehber yönetimi ve eşleştirme; öğrenci kaydı, biniş-iniş, yoklama, izin; yetkili velilerle canlı konum; aidat/ödeme durumu takibi; mobil + web panel; isteğe bağlı GPS cihazı. Yorum: yetersiz. |
| Soykanlar, Okul Yolum-Veli, vitaQR, Yerlem Umay (yalnız arama sonucu özeti, sayfa açılmadı) | https://apps.apple.com/lb/app/soykanlar/id6478149349 · https://apps.apple.com/us/app/id1449846328 · https://apps.apple.com/tr/app/vitaqr/id6475682595 · https://apps.apple.com/kw/app/yerlem-umay/id1480813664 | 30.10.2026 (arama) | Soykanlar: taksit ödemesi uygulamadan; Okul Yolum: tahmini varış süresi; vitaQR: araç içi kontrol + veli bilgilendirme; Yerlem Umay: bölgeye giriş bildirimi. DOĞRULANAMADI (sayfa okunmadı). |
| MEB dijital takip sistemi (haber) | https://www.cnnturk.com/turkiye/tasimali-egitim-hizmetinde-dijital-takip-donemi-2314257 | 24.07.2025 | Konum/rota/hız, kapı hareketi, kapasite, iç ortam; veliye varış, biniş-iniş, okula giriş-çıkış mesajı+sesli uyarı; şoför-veli arası numara paylaşmadan iletişim; veli şikâyet kanalı. İkincil kaynak. |

Not: Şikâyetvar'da bu yazılımlara ait doğrudan şikâyet sayfası bulunmadı; yorumlar aşırı az olduğu için yazılım-düzeyi şikâyet analizi yapılamadı (DOĞRULANAMADI). Ayrıca "Servis Yönetim/okulservisi.com.tr" ürün sitelerine ulaşılmadı.

## (b) Özellik listesi
Kaynak kodu: [A]=ürün App Store sayfaları (a tablosu), [Y]=Okul Servis Araçları Yönetmeliği 2017 özgün metni (RG 30221), [U]=MEB Usul ve Esaslar haberi, [M]=MEB dijital takip haberi, [Ş]=Şikâyetvar teması (c).

**Olmazsa olmaz**
- Öğrenci/çocuk kartı: ad, okul/sınıf, adres/durak, veli iletişimi, yetkili alıcı kişiler, sağlık/özel durum notu (en aza indirilmiş) — [A][Y m.14]
- Araç, şoför, rehber kaydı; belge geçerlilik tarihleri ve süre dolum uyarısı (bkz. d) — [Y m.4,9]
- Güzergâh + durak sırası, öğrenci-güzergâh eşleştirme, sabah/akşam seferi, kapasite kontrolü (koltuk sayısı aşılamaz) — [A][Y m.3/n, Ş kapasite]
- Aylık tahsilat: aylık ücret, 9 aya kadar taksit planı, tahsilat/borç takibi, makbuz, ayrılan öğrenci için kalan ay iadesi hesabı — [U][Y m.5/2/e][A]
- Günlük yoklama/biniş-iniş kaydı (şoför/rehber tarafı, çevrimdışı çalışabilir) — [A][Y m.14][M]
- Veliye bildirim: servis yaklaşıyor, bindi/indi, gelmedi/değişiklik; kanal doğru etiketlenir (gönderilmeyen "gönderildi" görünmez) — [A][M][Ş geç gelme/iletişim]
- Veli "bugün binmeyecek" bildirimi — [A PortAkıl]
- Şoför/rehber/araç değişikliğini aynı gün okul yönetimine bildirme (kayıt + bildirim) — [Y m.5/2/f, U]
- Roller ve yetki: veli yalnız kendi çocuğunu görür; şoför yalnız kendi seferini — KVKK m.12 (hafızadan, doğrulanmadı)
- Aydınlatma metni + gerekli yerde ayrı açık rıza kaydı (e)

**Beklenen**
- Canlı konum paylaşımı (yalnız yetkili veliye, yalnız sefer süresince, geçmiş konum sınırlı) — [A][M]; hukuki durum (d)
- GPS/araç takip cihazı verisi içe alma; takip kayıtlarını ≥30 gün saklama ve istenince okul/kolluk/veliyle paylaşım — [Y m.4/ı][U]
- Veli-şoför arası numara paylaşmadan mesaj — [M][A PortAkıl]
- Şikâyet/talep kaydı (veli → servis firması → okul) durum ve geçmişiyle — [Ş iletişim/çözümsüzlük][M]
- Tahsilat hatırlatma (SMS/WhatsApp-dışı; kanal sağlayıcısı doğrulanana dek yalnız "TEST"), gecikme raporu, toplu makbuz
- Belge süresi dolum raporu: ehliyet, SRC/eğitim sertifikası, aile hekimi raporu (yıllık), psikoteknik (5 yıl), sigorta, muayene, özel izin belgesi — [Y m.9,10-12]
- Devamsızlık/yoklama raporu ve sefer raporları (gecikme dakikası) — [Ş geç gelme]
- Ücretsiz taşınacak muhtaç öğrenci işareti (araç başına 1) — [U]
- Çok okullu / çok araçlı servis firması paneli; okul paneli

**Fark yaratan**
- Güzergâh optimizasyonu ve yeni öğrenci eklenince durak önerisi (aynı kaynaklardan çıkarılan ihtiyaç; rakip algoritması yok)
- Sefer sonunda "araç boşaltıldı" kontrolü (rehber tüm koltukları taradı onayı) — [A Servis Map: serviste unutma ihtiyacı]
- Yedek şoför ataması ve değişiklikte velilere otomatik haber — [Ş: şoför değişince 1,5 saat bekleyen veli]
- Veliye açık "sorumluluk özeti": firma yasal belgeleri geçerli rozeti (veli doğrulama) — [Ş güvenlik]
- Gecikme tahmini ve toplu "15 dk gecikme" bildirimi
- Personel servisi modu: vardiya bazlı hat, kişi başı aylık bedel, firma faturası (e-Fatura `NS.ebelge`) — [Y kapsam dışı; D3/D4 şartları (d)]

## (c) Şikâyet temaları
Kaynak: Şikâyetvar liste sayfaları (yalnız ilk sayfa başlıkları okundu; sayılar yaklaşık, tüm site değil). Ana URL'ler: https://www.sikayetvar.com/okul/servis-soforu · https://www.sikayetvar.com/milli-egitim-bakanligi-meb/okul-servis · https://www.sikayetvar.com/hostes/okul-servis · https://www.sikayetvar.com/bestur-turizm-istanbul/okul-servisi-saatlerine-uyulmuyor-ve-ayakta-ogrenci-tasiniyor
Uygulama mağazası yorumu: anlamlı yorum yok (yukarıda).

| # | Tema | Sıklık / kaynak | Karşılayacak özellik |
|---|---|---|---|
| 1 | Sürücü davranışı, tehlikeli sürüş, hakaret | ~12, /okul/servis-soforu | Hız/ani fren uyarısı (GPS), veli şikâyet kaydı, şoför performans özeti |
| 2 | Geç gelme / çocuğu evden almama | ~8, aynı sayfa; Bestur başlığı | Yaklaşma bildirimi, gecikme bildirimi, sefer saatleri raporu |
| 3 | İletişim eksikliği, bilgilendirilmeme | ~6, aynı sayfa | Veli-şoför mesaj, gecikme/değişiklik otomatik duyuru |
| 4 | Şoför/araç değişince haber verilmemesi, 1,5 saat bekleme | arama özeti (Şikâyetvar) | Yedek şoför akışı + aynı gün bildirim ([Y m.5/2/f]) |
| 5 | Şikâyet şirkete/okula iletilir, yıllarca çözüm yok | arama özeti (aylık 3000 TL ödeyen veli) | Şikâyet takip kaydı, durum, yanıt süresi |
| 6 | Kapasite aşımı, ayakta taşıma | ~1-2, Bestur başlığı | Koltuk sayısı kontrolü; kayıt > kapasite engeli |
| 7 | Araç arızası, servis aksaması | ~3 | Yedek araç planı, bakım tarihi hatırlatması ([Y m.4/e]) |
| 8 | Ücret gecikmesi/anlaşmazlığı | ~1 | Şeffaf tahsilat dökümü, makbuz, kalan ay iadesi |
| 9 | Çocuğun yanlış servise binmesi / ailesinden habersiz binmesi | MEB haberi | Biniş doğrulama (QR/liste), yetkili alıcı listesi |
| 10 | Çocuğun serviste unutulması | Servis Map sayfası (ihtiyaç beyanı) | Sefer sonu araç boşaltma kontrolü |

Uyarı: Şikâyetvar sayfaları şikâyetçi tarafın beyanıdır, doğrulanmamış.

## (d) Mevzuat tablosu

| İddia | Etiket | Kaynak URL · madde · tarih |
|---|---|---|
| Okul Servis Araçları Yönetmeliği RG 25.10.2017 / 30221; 2007 tarihli Hizmet Yönetmeliği'ni yürürlükten kaldırdı | DOĞRULANDI | https://www.resmigazete.gov.tr/eskiler/2017/10/20171025-2.htm · özgün metin · 30.10.2026 |
| Güncel (değişiklikli) halin bu özgün metinle aynı olması | DOĞRULANAMADI | mevzuat.gov.tr PDF okunamadı. Değişiklik (2024, 2025) yalnız arama özetinde |
| Araç yaşı ≤ 12 (üretim yılını izleyen ilk takvim yılından) | DOĞRULANDI (özgün metin) | Yön. m.4/f |
| Araç takip sistemi zorunlu, kayıtlar ≥30 gün | DOĞRULANDI (özgün) | m.4/ı |
| İç/dış kamera, tüm koltukları kapsar, kayıt ≥30 gün | DOĞRULANDI (özgün) | m.4/m |
| Koltuk doluluk sensörü, 3 noktalı kemer, "OKUL TAŞITI" reflektif şerit, "DUR" lambası, ısıtma/soğutma, 6 ayda bir bakım, koltuk sayısı araç içinde gösterilir | DOĞRULANDI (özgün) | m.4/a-e,g,i,k,l,n,o |
| Yangın söndürücü | DOĞRULANAMADI (metinde geçmedi; başka mevzuatta olabilir) | — |
| Kapasite = ruhsattaki koltuk sayısı | DOĞRULANDI | m.3/n |
| Özel izin belgesi (EK-1: güzergâh, taşımacı, şoför, rehber, plaka, tip, kapasite); büyükşehir/ilçe belediyesi verir; süre bir eğitim yılı, komisyon kararıyla 3 yıla kadar | DOĞRULANDI | m.3/ğ, m.8 |
| Şoför: 26–66 yaş, D ehliyeti ≥5 yıl veya D1 ≥7 yıl, yıllık aile hekimi raporu, 5 yılda bir psikoteknik, son 5 yıl sicil temiz, mesleki yeterlilik + eğitim sertifikası, sabıka şartı | DOĞRULANDI (özgün; "9/1/f 3.9.2020'den itibaren" geçici hüküm var) | m.9/1, Geçici m.1-2 |
| Rehber: ≥22 yaş, ≥lise, eğitim sertifikası, yıllık aile hekimi raporu, sarı reflektif "REHBER" yeleği | DOĞRULANDI (özgün) + https://meb.gov.tr/okul-servis-araclari-yonetmeligi-resmi-gazetede-yayimlandi/haber/14808/tr | m.9/2, m.3/h |
| Zorunlu karayolu yolcu taşımacılığı mali sorumluluk sigortası; sigortasız araç öğrenci taşıyamaz | DOĞRULANDI (özgün) | m.10-12 |
| Sosyal güvenlik kaydı; saat uyumu; rehber temini | DOĞRULANDI | m.5 |
| Servis ücreti: Esnaf tarifesine uygun tarife | DOĞRULANDI (özgün) | m.5/2/d. Bir örnek: ücreti kimin belirlediği (komisyon mu, esnaf odası mı) ayrıntısı metinde yok → DOĞRULANAMADI |
| Ücret: yıllık veya ≤9 ay taksit; vazgeçen öğrencinin kalan ay ücreti iade; araç başına 1 muhtaç öğrenci ücretsiz; sözleşme devri komisyon onayı | DOĞRULANDI | https://www.meb.gov.tr/okul-servis-araclarina-iliskin-usul-ve-esaslar-belirlendi/haber/15496/tr (Usul ve Esaslar haberi, 20.01.2018; esas metin mevzuat.meb.gov.tr/dosyalar/1959.pdf açılmadı) |
| İade: öğrenci ayrılır/okul-adres değiştirir/uzun hastalık/izin iptali | DOĞRULANDI | m.5/2/e |
| Taşıma sözleşmesi mülki idare onayı; bir eğitim yılı, en çok 3 yıla uzatılabilir | DOĞRULANDI (MEB haberi) · madde no DOĞRULANAMADI | https://meb.gov.tr/.../haber/14808/tr |
| Genel öğrenci listesi zorunluluğu | DOĞRULANAMADI/yok: özgün metinde yalnız kreş/gündüz bakım için isim listesi ve imzalı günlük yoklama, devam etmeyen için veli bilgilendirme | m.14/1 |
| Araç takip verisi istenirse okul, kolluk ve velilerle paylaşılır | DOĞRULANDI (MEB haberi) | Usul ve Esaslar haberi |
| Sürücü/rehber/araç/plaka değişikliği aynı gün okul yönetimine bildirilir | DOĞRULANDI | m.5/2/f |
| Denetim: dönemde ≥1 kez komisyon; kolluk her an | DOĞRULANDI (özgün); 2024 komisyon tanımı eklenmiş olabilir | m.13 |
| Taşıma Yoluyla Eğitime Erişim Yön. (eski "Taşımalı") RG 11.09.2014 / 29116; 01.08.2024 / 32619 değişiklik; ihale 4734'e göre; taşınan özel eğitimde yaz dönemi | DOĞRULANAMADI (yalnız arama özeti; metin açılmadı) | https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=20040&MevzuatTertip=5 |
| MEB Öğrenci Servisi Takip Yönergesi'nin yürürlüğe girdiği | DOĞRULANAMADI (haber, yönerge metni yok) | CNN Türk 24.07.2025 |
| Karayolu Taşıma Yön. (RG 08.01.2018 / 30292) D3 = hususi (kendi personelini) taşıma; en az 1 özmal otobüs | DOĞRULANDI | https://resmigazete.gov.tr/eskiler/2018/01/20180108-1.htm · m.6(4)(c), 14(4)(c) · metnin ilk 100.000 karakteri okundu, 91.748 karakter okunmadı |
| D2 = otobüsle ticari tarifesiz yurt içi yolcu (75 koltuk, 30.000 TL); B2 = otobüsle ticari tarifesiz (uluslararası ağırlıklı; 90 koltuk, 50.000 TL) | DOĞRULANDI (2018 özgün; sonraki değişiklikler okunmadı → rakamlar DOĞRULANAMADI güncel) | aynı, m.6(4)(b), 6(2)(b), 14 |
| Ticari servis (okul/personel) taşımacılığı **D4** belgesi gerektirir; D2 ile servis yapanlar 31.12.2021'e kadar uyum | DOĞRULANDI | https://www.resmigazete.gov.tr/eskiler/2019/11/20191115-3.htm (RG 15.11.2019, değişiklik) · M.14, Geç.m.3(5) |
| Servis taşımalarının usul/esasları bu yönetmelikte değil, Bakanlıkça ayrıca düzenlenir; servis yolcu toplama noktası sınırı | DOĞRULANDI | 2018 metni m.2(2), m.4(uu); 2019 değişikliği m.41 |
| Kullanıcı notundaki "personel taşıma = D2/B2" | UYUMSUZ: personel taşıma kendi personelini taşıyan işletme için D3, ticari servis firması için D4. D2/B2 turizm/tarifesiz içindir | yukarıdaki iki kaynak |
| Taşıtta bulunması gereken belge: yetki belgesi aslı veya e-Devlet taşıt kartı (unvan, belge no, plaka vb.) | DOĞRULANDI | 2018 metni m.29 |
| Taşıma sözleşmesinde yolcu listesi zorunlu unsur | DOĞRULANDI | 2018 metni m.37(2) |
| **Canlı konum paylaşımına özel hüküm**: araç takip kaydı zorunluluğu ve izleme MEB sisteminde var; KVKK'da konum için ayrı madde yok | DOĞRULANAMADI (KVKK metni açılmadı; kvkk.gov.tr Çocuk sayfasında konum geçmiyor, o sayfa okundu) | https://www.kvkk.gov.tr/Icerik/6737/Cocuklarin-Kisisel-Verilerinin-Korunmasi-Bakimindan-Dikkat-Edilmesi-Gerekenler |
| KVKK: açık rıza belirli konuya, bilgilendirmeye dayalı, özgür; aydınlatma açık rızadan bağımsız yapılır, ayrı tutulur; Kurul 18.02.2026 / 2026/347 ilke kararı: açık rıza ve aydınlatma metinleri ayrı, 6 ay uyum | DOĞRULANAMADI (arama özeti; doğrudan sayfa okunmadı) | https://www.kvkk.gov.tr/Icerik/8710/... (başlık: 2026/347 kamuoyu duyurusu) |
| KVKK "Ürün ve hizmet geliştirenler" broşürü: çocuklara yönelik sade dil, görsel, ebeveyn iletişimine onay | DOĞRULANAMADI (PDF okunamadı; arama özeti) | https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/f506d8fe-9f36-4538-bce9-a05a5ca8d8e6.pdf |
| Kurul karar özeti 2020/255: eğitim kurumunun öğrenci (çocuk) özel nitelikli verisini hukuka aykırı işlemesi | DOĞRULANAMADI (arama özeti) | https://www.kvkk.gov.tr/Icerik/6894/2020-255 |
| KVKK m.10 aydınlatma, m.12 veri güvenliği, m.4 genel ilkeler (ölçülülük, amaçla sınırlı), m.5 işleme şartları, m.6 özel nitelikli (sağlık dahil), m.18 idari para cezası; 18 yaş altı için ayrı rıza yaşı hükmü yok | (hafızadan, doğrulanmadı) | mevzuat.gov.tr 6698 — okunamadı |

**Araç belgeleri listesi (araç + sürücü + rehber + firma)** — tümü [Y özgün metin] + [Karayolu Taşıma Yön. 2018]; güncel hâl doğrulanmalı:
- Özel izin belgesi (EK-1, belediyeden) · Karayolu yetki belgesi aslı/e-Devlet taşıt kartı (D4 veya D3) · Araç ruhsatı (koltuk/kapasite) · Zorunlu yolcu taşımacılığı sigortası · Periyodik muayene, 6 aylık bakım kaydı · Araç takip sistemi + kamera kayıtları (≥30 gün)
- Şoför: ehliyet (D ≥5 yıl / D1 ≥7 yıl), SRC/mesleki yeterlilik, MEB eğitim sertifikası, yıllık aile hekimi raporu, 5 yıllık psikoteknik, sabıka/sicil belgesi, 5 yıllık trafik sicili
- Rehber: lise diploması, eğitim sertifikası, yıllık aile hekimi raporu, sabıka belgesi, sosyal güvenlik kaydı
- Okul/komisyon: taşıma sözleşmesi, denetim kayıtları

Yazılım bunları "izleme ve süre hatırlatma" olarak tutar; belgelerin hukuki geçerliliğini yazılım onaylamaz.

## (e) Çocuk verisinde en aza indirme önerileri
Bunlar mühendislik önerileridir; hukuki dayanak (b)-(d) tablosunda DOĞRULANAMADI olanlara bağlı.
- Yalnız gerekli alan: ad-soyad, okul, durak adresi, veli telefonu. T.C. kimlik no, fotoğraf, sağlık bilgisi varsayılan olarak toplanmaz; sağlık/özel durum yalnız "rehber bilmeli" kısa not, ayrı yetki ve ayrı açık rıza ile.
- Aydınlatma ve açık rıza ayrı ekranlarda, sade dilde; rıza kaydı (kim, ne zaman, hangi metin sürümü) tutulur.
- Canlı konum yalnız araç konumudur, çocuğun cihaz konumu toplanmaz. Veliye yalnız sefer süresince ve yalnız kendi çocuğunun aracı için gösterilir; bitince kapanır.
- Konum/GPS geçmişi saklama süresi ayarlanır; yönetmelikteki 30 gün alt sınırı ile KVKK'nın "gerektiği kadar" ilkesi birlikte düşünülür (varsayılan 30 gün, süre dolunca otomatik silme).
- Bildirim mesajında minimum bilgi (ad + durum). Mesaj kanalı çalışmıyorsa "TEST" veya "gönderilemedi" görünür.
- Veli-şoför iletişimi uygulama içi; numara paylaşımı yok ([M]).
- Rol bazlı erişim; şoför yalnız o seferin listesi; her görüntüleme/dışa aktarım denetim kaydı.
- Sezon sonu / öğrenci ayrılınca anonimleştirme ya da silme, veli talebiyle silme akışı.
- Yurt dışı sunucu/SMS sağlayıcısı kullanılırsa ayrıca hukuki değerlendirme gerekir (KVKK m.9, hafızadan, doğrulanmadı).
- Kamera görüntüsü (araç içi) yazılıma alınmaz; yalnız cihaz üreticisinde kalır, yazılım "kayıt var / erişim talebi" kaydı tutar.

## (f) Erişilemeyen / doğrulanamayan kaynaklar
- mevzuat.gov.tr Okul Servis Araçları Yönetmeliği birleşik PDF (MevzuatNo=24022): sıkıştırılmış, okunamadı. tut.meb.gov.tr 2025 PDF: okunamadı.
- mevzuat.meb.gov.tr/dosyalar/1959.pdf (Usul ve Esaslar esas metni): açılmadı; MEB haber özeti kullanıldı.
- Karayolu Taşıma Yönetmeliği güncel birleşik (mevzuat.gov.tr 7.5.24299 PDF) okunamadı; 2018 RG metni ilk 100.000 karakter, 2019 değişikliği özeti kullanıldı. D4 son rakamlar (örn. 5.000 TL) güncel olmayabilir.
- Taşıma Yoluyla Eğitime Erişim Yönetmeliği metni açılmadı.
- KVKK 6698 Kanun metni, aydınlatma rehberi, açık rıza rehberi, ürün-hizmet geliştirenler broşürü, 2026/347 ilke kararı: sayfa/PDF okunamadı; yalnız arama özetleri.
- MEB Öğrenci Servisi Yönergesi resmî metni ve MEB yönerge tarihi bulunamadı.
- Rakip ürünlerin kendi web siteleri (özellik/fiyat sayfaları) incelenmedi; yalnız App Store. Google Play sayfaları açılmadı.
- Şikâyetvar: yalnız liste başlıkları; iade ve ayakta taşıma için doğrudan örnek bulunamadı.
