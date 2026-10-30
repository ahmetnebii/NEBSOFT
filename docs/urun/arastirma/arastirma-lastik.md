# Lastikçi ve Oto Yedek Parça Dükkânı Yazılımı — Pazar ve Mevzuat Araştırması

Erişim tarihi (tüm kaynaklar): 2026-10-30. Kod yazılmadı. Rakip metni kopyalanmadı; yalnızca karşılanan ihtiyaç çıkarıldı.
Not: Satıcı sayfaları pazarlama beyanıdır; "özellik var" demek canlıda denendiği anlamına gelmez.

## CANLIYA ÇIKMAYI ENGELLEYENLER / KARAR BEKLEYENLER
1. **TecDoc katalog bağlantısı:** Resmî TecAlliance sayfalarında Web Service API'nin varlığı görüldü, ama Türkiye'ye özel lisans, fiyat ve yeniden satıcı bilgisi DOĞRULANAMADI. Lisanssız (torrent/forum) TecDoc kopyası kullanılamaz. Lisans kararı sende: TecDoc lisansı mı, OEM/muadil verisini elle/Excel ile mi tutacağız? Karar gelene kadar "TecDoc'tan araç-parça uyumu" ekranı canlıda seçilemez.
2. **Lastik etiketleme (satıcı yükümlülüğü, md. 6):** Resmî Gazete'de yönetmeliğin varlığı doğrulandı; madde metni resmî kaynaktan açılamadı (yalnızca ikincil kaynak) → DOĞRULANAMADI. Etiketi yazdırma/gösterme özelliği hukuki doğrulama bitmeden "mevzuata uygun" diye sunulmaz.
3. **Satış Sonrası Hizmetler Yönetmeliği, lastik satırı:** Ek listede "Araç lastikleri" için servis gerekmediği ve azami tamir süresinin 20 gün olduğu okundu, ama tablo PDF'ten bozuk çıktı; kullanım ömrü sütunu DOĞRULANAMADI. Garanti/tamir süresi alanlarını koda koymadan önce resmî metin elle kontrol edilmeli.
4. **Kış lastiği zorunluluğunu dayandıran 2918 md. 65/A'nın güncel hâli** (arama özetinde 7574 sayılı Kanun ile değiştiği söylendi): DOĞRULANAMADI, kaynağa erişilmedi.
5. **Canlı test:** Hiçbir rakip ürün denenmedi (hesap açılmadı); karşılaştırma yalnızca herkese açık sayfalara dayanır.

---

## (a) İncelenen ürünler

| Ad | URL | Tarih | Karşılanan ihtiyaçlar (kendi ifademizle) |
|---|---|---|---|
| Lastsis | https://lastsis.com/en ; haber: https://www.ekonomim.com/sirketler/lastsisten-lastikcilere-depolama-takip-sistemi-haberi-718033 | 2026-10-30 (haber 2023-11-29) | Bulut tabanlı lastik oteli (raf, bölüm, diş derinliği, durum kaydı; süresi geçen/aşınmış lastiği ayıklama), iş emri → e-faturaya tek adım, barkodlu stok ve sayım, filo ve cari, B2B iskonto/risk limiti, SMS/e-posta ile süreç bildirimi, randevu, mobil servis uygulaması (Caresoft), 14 gün deneme. Sayfada araç geçmişi açıkça geçmiyor. |
| Servislet | https://apps.apple.com/cd/app/servislet/id1668207633 | 2026-10-30 (sürüm 1.1.1, 2023-08-24) | Müşteri tarafı uygulama: araca uygun lastik seçimi, servis noktası, randevu, uygulama içi ödeme, sökme-takma/rot balans/nitrojen/lastik oteli, servis geçmişi ve değişim tarihi hatırlatma. Lastik oteli ayrıntısı verilmiyor; mağazada yorum/puan yok. |
| AysimaPOS (yedek parça) | https://aysimapos.com/otomotiv-yedek-parca-programi | 2026-10-30 | OEM kodu altında muadil kodların tek üst üründe toplanması, kod/ad ile arama, Excel ile toplu yükleme, ağırlıklı ortalama maliyet, kritik/atıl stok, tamirhane başına limit ve vade (limit aşılınca satış engeli), cari ekstreyi WhatsApp'tan paylaşma, e-arşiv/e-fatura. TecDoc/VIN yalnızca karşılaştırma tablosunda bir satır; kapsamı açıklanmıyor → DOĞRULANAMADI. Yıllık 7.500 TL (sayfa beyanı). |
| Senkronix | https://senkronix.com/blog/oto-yedek-parca-tecdoc-yazilimi | 2026-10-30 | TecDoc ile araca uygun parça listeleme, OEM çapraz/muadil gösterme, otomatik katalog güncelleme (beyan); çok kanal, e-ticaret stok eşitleme, çok depo, B2B portal, ERP/kargo bağlantısı. API ve lisans ayrıntısı verilmiyor; lisans modeli ve güncelleme sıklığının seçim ölçütü olduğu belirtiliyor. |
| Vilyonix | https://www.vilyonix.com/ | 2026-10-30 | Bayi B4B portalı (plaka/VIN/OEM ile arama, ERP ile canlı eşitleme), WMS (barkod, el terminali, RFID), TecDoc veri temizleme ve OEM çapraz eşleştirme hizmeti, Logo Tiger/Netsis/SAP bağlantısı, emniyet stoğu ve satın alma. |

**TecDoc nasıl sunuluyor:** Türk ürünlerde TecDoc ya "entegrasyon" cümlesi (Senkronix), ya karşılaştırma tablosunda tek satır (AysimaPOS), ya veri danışmanlığı hizmeti (Vilyonix) olarak geçiyor; hiçbirinde lisans kapsamı/fiyat açık değil. Resmî tarafta TecAlliance, e-ticaret ve ERP sistemleri için TecDoc Web Service API ile gerçek zamanlı araç/ürün/bağlantı verisi sunduğunu söylüyor (https://www.tecalliance.net/products/cards/tecdoc-web-service, 2026-10-30; lisans/fiyat sayfada yok, Türkiye'ye özel sayfa bulunamadı). Forumlarda dolaşan lisanssız TecDoc DVD/torrent kopyaları kullanılmamalı. Arama sonuçlarında bu 5 ürünün dışında hazır "lastikçi + araç geçmişi" ürünü bulunamadı (DOĞRULANAMADI: yok demek değil, bulunamadı demek).

---

## (b) Özellik listesi (öneri; kullanıcı onayına kadar geliştirme yok)

Durum sütunu yok: mevcut programın ekranları bu görevde incelenmedi, "bizde var/yok" ayrı turda yazılacak.

### Olmazsa olmaz
| Özellik | Dayanak |
|---|---|
| Lastik oteli kaydı: müşteri + plaka, ebat, marka/model, DOT (hafta/yıl), diş derinliği (mm), 4 lastik tek tek durum, raf/bölüm, giriş-çıkış tarihi, teslim alan imzası/fotoğraf | Lastsis (haber + sayfa); şikayet teması 1-3 |
| Giriş fişi/teslim formu (NS.forms ile imzalı): hasar, durum, bırakılan parçalar (jant, kapak, bijon), ücret şartı | TBK md. 561-566 (saklayanın borçları); şikayet 1,2,9 |
| Rafa göre arama ve çıkışta "doğru müşteri-doğru lastik" doğrulaması (barkod/QR etiket) | Şikayet 1-2 (kayıp, yanlış lastik verildi) |
| Stok: ebat (205/55 R16 gibi) ayrıştırma, DOT/üretim yılı alanı, hız/yük indeksi, mevsim, marka; DOT'a göre satış uyarısı | Şikayet 4; Lastsis (süresi geçen lastik ayıklama) |
| Parça stoğu: parça kodu, OEM kodu, muadil kodlar, araç uyumu (elle), raf, alış/satış fiyatı | AysimaPOS (OEM-muadil tek üst ürün) |
| Cari: açık hesap, limit, vade, ekstre, tahsilat | AysimaPOS, Lastsis |
| Rot-balans/montaj iş emri: araç, km, yapılan işlem, ölçüm değerleri (önce/sonra), bijon tork, hava basıncı, çalışan, onay | Lastsis (iş emri); şikayet 6,7 |
| İş emrinden e-fatura/e-arşiv (mevcut NS.ebelge) | Lastsis; AysimaPOS |
| Müşteriye SMS: lastik otele alındı, iş hazır, sezon hatırlatma | Lastsis |

### Beklenen
| Özellik | Dayanak |
|---|---|
| Araç geçmişi: plaka bazlı geçmiş iş emirleri, takılan lastik DOT/seri, son rot-balans km | Servislet (servis geçmişi, uygulama tarafı); şikayet 7,8 |
| Sezon hatırlatma (kış lastiği dönemi öncesi toplu SMS/WhatsApp), randevu | Servislet, Lastsis; mevzuat tablosu satır 1 |
| Garanti kaydı: satılan lastiğe fatura, DOT, satış tarihi; arıza bildiriminin durum takibi | Şikayet 8; 6502 md. 8, 11, 12, 56 |
| Barkodlu sayım, kritik stok uyarısı, atıl stok raporu | Lastsis, AysimaPOS |
| Çok depo/şube, raf kapasitesi doluluk raporu | Senkronix, Vilyonix (WMS) |
| Muadil/OEM arama (kod yazınca eşdeğerleri ve stokları listeler) | AysimaPOS, Vilyonix |
| Eski (ömrünü tamamlamış) lastik kaydı: kaç adet alındı, yetkili taşıyıcıya teslim tarihi, 60 günlük bekleme sayacı | ÖTL Yönetmeliği md. 5(1)(f) (bkz. d) |
| Fiyat/ücret şeffaflığı: ek ücretler (sibop, balans ağırlığı, saklama) kalem kalem iş emrinde | Şikayet 9 |
| Alıcıya satış anında lastik etiketi (AB etiketi) gösterme/yazdırma ve DOT'u faturaya/teslim fişine yazma | Etiketleme Yönetmeliği (md. 6, DOĞRULANAMADI); şikayet 4 |

### Fark yaratan
| Özellik | Dayanak |
|---|---|
| "DOT yaşı" renk uyarısı (satışta 3 yıl+ sarı, 5 yıl+ kırmızı; eşikleri dükkân belirler) ve müşteriye belgeli üretim yılı beyanı. Resmî yaş sınırı yok, eşik sahibin tercihidir (bkz. d satır 8). | Şikayet 4 (en kalabalık tema: LastikPark sayfasında 27 şikayet); Continental/Michelin tavsiyeleri üretici görüşüdür, mevzuat değildir |
| Teslim anında müşteriye fotoğraflı dijital teslim belgesi (bağlantı/QR) | Şikayet 1,2; TBK 562-566 |
| Müşteri "lastiğim nerede" sorgu sayfası (raf, giriş tarihi, durum) | Şikayet 3 (Öztürk Oto Lastik: ödeme yapıldı, 2 ay teslim yok) |
| Lastik ömrü takibi: ebat-DOT-diş derinliği geçmişinden "değişim zamanı" önerisi | Servislet (değişim tarihi takibi) |
| Kamera/vale değil, giriş fişi fotoğrafı ile hasar tartışmasını kapatma | Şikayetvar otel/vale hasarı örnekleri (lastik oteli değil, kısmen ilgili) |
| TecDoc (lisanslı) araç-parça uyumu, VIN ile sorgu | Senkronix, Vilyonix; lisans kararı bekliyor |
| Tamirhane/filo B2B portalı: sipariş, açık hesap görünümü | Lastsis (B2B), Vilyonix (B4B) |

---

## (c) Şikayet temaları (en sık 10) → önerilen özellik

Sayım notu: Sayılar "sayfada gördüğümüz" ölçüdür, bilimsel örneklem değildir. Yalnızca ilk sayfa/arama özetleri okundu. Uygulama mağazası yorumu bulunamadı (Servislet'te yorum yok; Caresoft/Lastsis uygulama yorumları incelenmedi).

| # | Tema | Kaynak | Karşılayacak özellik |
|---|---|---|---|
| 1 | Lastik otelinde lastiğin kaybolması | https://www.sikayetvar.com/bridgestone/bridgestone-lastik-oteline-biraktigim-lastiklerim-kaybedildi ; https://www.sikayetvar.com/lastikpark/lastiklerimiz-kayboldu-yanlis-lastik-verildi-para-iadesi-yapilmiyor ; https://www.sikayetvar.com/aklas-oto-lastik-eskisehir/aklas-oto-lastik-eskisehir-kullanilmis-baska-lastik-takmaya-calisma (arama sonucu, sayfa açılmadı) | Tek tek lastik kaydı, QR raf etiketi, çıkışta doğrulama, sayım |
| 2 | Yanlış / başkasının / eski lastiğin teslim edilmesi, firmanın tazminatı reddetmesi | LastikPark ve Aklas bağlantıları (yukarıda); https://www.sikayetvar.com/lastik/otel | Fotoğraflı giriş fişi, imzalı teslim, hasar/kayıp prosedürü (TBK md. 561-566) |
| 3 | Ödeme yapıldığı hâlde teslim gecikmesi, oyalama | https://www.sikayetvar.com/ozturk-oto-lastik-ankara/ozturk-oto-lastik-ankara-oyalaniyorum-ve-lastikler-ortada-yok | Müşteri sorgu sayfası, SMS durum bildirimi, vadesi geçen iş emri uyarısı |
| 4 | Eski DOT'lu lastiğin yeni diye satılması / üretim yılının yanlış söylenmesi | https://www.sikayetvar.com/yilmaz-oto-lastik-denizli/yilmaz-oto-lastik-denizli-kis-lastiklerim-2022-degil-2019-yili-uretimi ; https://www.sikayetvar.com/kolayotocom/kolay-otoda-siparis-kargoya-verilmedi-ve-uretim-yili-yanlis-bilgilendirildi ; https://www.sikayetvar.com/lastikpark (sayfada 27 şikayet) | DOT alanı zorunlu, faturaya/teslim fişine DOT yazma, yaş uyarısı |
| 5 | Yanlış ürün: ölçü, mevsim (4 mevsim yaz diye), farklı ölçü takılması | https://www.sikayetvar.com/lastikpark ; https://www.sikayetvar.com/kolayotocom/idefixten-yanlis-lastik-gonderimi-ve-iade-butonunun-calismamasi | Ebat/endeks/mevsim alanı, araç ebat uyumu kontrolü, teslim öncesi kontrol listesi |
| 6 | Montajda bijon gevşekliği, jant/bijon hasarı; iade reddi | https://www.sikayetvar.com/lastikpark ; https://www.sikayetvar.com/bmw/borusan-otoda-teslim-edilen-aracta-guvenlik-acigi-lastik-basinclari-ve-bijon-sorunu | İş emrinde tork/basınç onay kutusu, önce-sonra fotoğraf, çalışan kaydı |
| 7 | Rot-balans yapılmadı veya titreme/yalpalama sürdü | https://www.sikayetvar.com/otopratik/lastik ; https://www.sikayetvar.com/goodyear/garanti-kapsaminda-goodyear-lastik-arizasi-ve-bayi-tarafindan-kotu-muamele | Önce/sonra ölçüm değerleri iş emrinde, araç geçmişi, tekrar gelen müşteri uyarısı |
| 8 | Garanti talebinin "kullanıcı hatası" diye reddi, uzun inceleme | https://www.sikayetvar.com/barum-lastik/barum-bravuris-6-lastiginde-yanak-yarilmasi-ve-kullanici-hatasi-iddiasi ; https://www.sikayetvar.com/lassa/lassa-transway-3-lastiklerde-guvenlik-tehlikesi-ve-garanti-reddi | Garanti kaydı (satış tarihi, DOT, fatura), arıza bildirim durumu, tedarikçiye iletim takibi |
| 9 | Sürpriz ek ücret, çift tahsilat (saklama ücreti iki kez) | https://www.sikayetvar.com/lastikpark (Gaziantep örneği ve ek ücret şikayetleri) | Kalem kalem ücret, otel ücreti için dönemsel tahsilat planı, mükerrer tahsilat uyarısı |
| 10 | Sipariş verilen/ödenen lastiğin gelmemesi, stokta yok iken satışa açık tutma, geç iade | https://www.sikayetvar.com/kolayotocom/michelin-crossclimate-2-stok-yok-aciklamasi-yaniltici-siparis-iptali-ve-tekrar-satisa-koyulmasi ; https://www.sikayetvar.com/lastik-burada/kargo-iptali-ve-iade-sorunu-lastik-siparisim-teslim-edilmedi | Gerçek stok/rezerv, ön sipariş durumu, iade-tahsilat takibi |

Not: Temalar çoğunlukla çevrim içi lastik satıcıları (LastikPark, Kolay Oto) ve zincir bayiler hakkındadır; küçük esnaf için aynı örüntü varsayımdır, ayrıca doğrulanmadı.

---

## (d) Mevzuat tablosu

Etiketler: DOĞRULANDI = resmî sitedeki metinden okundu · DOĞRULANAMADI = resmî metin açılamadı veya bölüm okunamadı.

| # | Konu | Hüküm (özet) | Etiket | Kaynak URL, madde, erişim |
|---|---|---|---|---|
| 1 | Kış lastiği zorunluluğu — dönem | Şehirlerarası karayolunda yolcu/eşya taşıyan araçlarda her yıl 15 Kasım – ertesi yıl 15 Nisan (beş ay); şehir içi uygulamayı valilik yerel sıcaklığa göre belirler; valilik öncesine/sonrasına 1'er ay ekleyebilir. Eski dönem 1 Aralık–1 Nisan idi (2017 metni); 4 Ekim 2025 değişikliğiyle değişti. Özel otomobil kapsamı: tebliğ "taşımacılıkta kullanılan taşıtlar" diyor; özel araç durumu ayrıca yorumlanmalı. | DOĞRULANDI | Kış Lastiği Kullanma Zorunluluğu ile İlgili Usul ve Esaslar Hakkında Tebliğ (Yürürlük 1/12/2017): https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=9&MevzuatNo=23474&MevzuatTertip=5 md. 5; değişiklik https://www.resmigazete.gov.tr/eskiler/2025/10/20251004-3.htm (RG 4/10/2025, 33037); eski metin https://www.resmigazete.gov.tr/eskiler/2017/04/20170401-14.htm (RG 1/4/2017, 30025). 2026-10-30 |
| 2 | Kış lastiği — diş derinliği ve yaptırım | Kamyon/çekici/tanker/otobüste en az 4 mm; kamyonet/minibüs/otomobilde en az 1,6 mm; ölçüm lastik sırtının ortasına en yakın dişlerden. Kullanmayan işletene 2918 md. 65/A para cezası (md. 8(a), dayanak md. 3). Not: Bu "Karayolları Trafik Yönetmeliği" değil, tebliğdir; KTY metninde lastik diş derinliği/kış lastiği hükmü bulunamadı. | DOĞRULANDI (tebliğ); KTY'de hüküm bulunamadı | 23474 sayfası, md. 6 ve 8; KTY: https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=8182&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 (metinde "lastik" araması yalnız tanım ve traktör maddelerinde sonuç verdi). 2026-10-30 |
| 3 | Kanun değişikliği (7574, 65/A) | Arama özeti 65/A'nın Şubat 2026'da değiştiğini söyledi | DOĞRULANAMADI | https://www.resmigazete.gov.tr/eskiler/2026/02/20260227-0.htm açılmadı |
| 4 | Ömrünü Tamamlamış Lastiklerin Kontrolü Yönetmeliği (RG 25/11/2006, 26357; son değişiklik RG 13/8/2026, 33339) — satıcı / lastik işletmesi | Md. 5(1)(f): lastik tamirhane, kaplamacı, perakende satış noktası, oto sanayi gibi yerlerde ÖTL açık alanda biriktirilemez, yangın ve haşere önlemi alınır, yetkili taşıyıcıya teslim edilene kadar en fazla 60 gün muhafaza edilebilir. Md. 5(1)(g): ÖTL üreticisi (araç sahibi) lastiğini değiştirince eskisini lastik dağıtım/satış işletmesine veya yetkili taşıyıcıya teslim eder. Md. 5(1)(ğ): ÖTL yetkili taşıyıcılara bedelsiz teslim edilir; yetkisiz kişi taşıyamaz. Md. 21(1) (13/8/2026): bu işletmelerin biriktirme yerleri için il müdürlüğü izni aranmaz. 2026 değişikliği: toplama faaliyeti için Bakanlıktan "yetkili toplayıcı" yetkisi gerekir (md. 5(1)(k), md. 6(1)(f)); kayıt/beyan Bakanlığın çevrim içi sistemlerinden yapılır (md. 13(d)). Satıcının tüketiciden eski lastiği geri alma zorunluluğu şeklinde açık bir cümle okunmadı; md. 5(1)(g) yalnızca araç sahibinin teslim yükümlülüğünü yazar. | DOĞRULANDI (maddeler); "satıcı geri almak zorundadır" yorumu DOĞRULANAMADI | https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.10799.pdf (PDF'ten çıkarılan metin, md. 5, 6, 13, 21) ; değişiklik özeti https://www.lexpera.com.tr/resmi-gazete/metin/omrunu-tamamlamis-lastiklerin-kontrolu-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-33339 (ikincil, yalnız değişiklik madde numaralarını teyit için). 2026-10-30 |
| 5 | Lastik etiketleme | Yönetmeliğin adı: Lastiklerin Yakıt Verimliliği ve Diğer Parametreler ile İlgili Etiketlenmesi Hakkında Yönetmelik (AB/2020/740), RG 17/4/2021, 31457 (Resmî Gazete sayısında bulunduğu görüldü). Satıcı yükümlülüğü (md. 6: satış noktasında etiketi görünür tutma, ürün bilgi formu, müşteri görmüyorsa satıştan önce kopya verme) yalnızca ikincil kaynakta var. | Varlık DOĞRULANDI; md. 6 içeriği DOĞRULANAMADI | https://www.resmigazete.gov.tr/eskiler/2021/04/20210417.htm ; ikincil: https://www.lexpera.com.tr/mevzuat/yonetmelikler/lastiklerin-yakit-verimliligi-ve-diger-parametreler-ile-ilgili-etiketlenmesi-hakkinda-yonetmelik-ab. İlgili bakanlık sanayi.gov.tr üzerinden açılmadı. 2026-10-30 |
| 6 | 6502 sayılı Kanun — ayıplı mal, seçimlik haklar, zamanaşımı, garanti | Md. 8: ayıplı mal tanımı. Md. 11: tüketici sözleşmeden dönme, indirim, ücretsiz onarım veya misli ile değiştirme haklarından birini seçer; satıcı yerine getirmekle yükümlü. Md. 12: ayıptan sorumluluk teslimden itibaren 2 yıl zamanaşımı; ikinci el satışta satıcının sorumluluğu 1 yıldan az olamaz; ağır kusur/hile ile gizlenen ayıpta zamanaşımı uygulanmaz. Md. 56: garanti süresi tesliminden itibaren asgari 2 yıl; belgenin düzenlenip verilmesi sorumluluğu satıcıya aittir (üretici/ithalatçı düzenler); onarım hakkı kullanılmışsa tekrar arızada diğer seçimlik haklara geçilebilir. | DOĞRULANDI | https://mevzuat.gov.tr/mevzuatmetin/1.5.6502.pdf (PDF'ten çıkarılan metin, md. 8, 11, 12, 56). 2026-10-30. Güncel değişiklik tarihleri bu görevde karşılaştırılmadı. |
| 7 | Satış Sonrası Hizmetler Yönetmeliği — yedek parça | Md. 12: üretici/ithalatçı tüketici talebi üzerine yedek parça satışından kaçınamaz; servis istasyonu yedek parça fiyat listesini görülebilir yere asar veya katalog/elektronik ortamda gösterir. Md. 13: yetkili servis, değiştirilen parçayı garanti süresi içinde tüketiciye göstermek, garanti dışında iade etmek zorundadır (Çevre Kanunu saklı). Ek liste 10.14 "Taşıt yedek parçaları": "Araç lastikleri" satırı için "servis gerekmez", azami tamir süresi 20 gün (tablo PDF'te bozuk çıktı, diğer sütunlar okunamadı). Md. 16: bilgi/belgeler 3 yıl saklanır. Not: Bu yönetmelik üretici/ithalatçı ve yetkili servisleri bağlar; bağımsız yedek parça dükkânına doğrudan uygulanma kapsamı hukuki görüş gerektirir. | Md. 12, 13, 16 DOĞRULANDI; ek liste kullanım ömrü sütunu DOĞRULANAMADI | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=19783&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 (değişiklik 12/2/2020, 31037). RG yayım tarih/sayısı bu görevde okunamadı. 2026-10-30 |
| 8 | Eşdeğer kalitede yedek parça / garantili parça | İstenen "motorlu araçlar servis/yedek parça tebliği" olarak Rekabet Kurumu'nun 2017/3 sayılı Motorlu Taşıtlar Sektöründeki Dikey Anlaşmalara İlişkin Grup Muafiyeti Tebliği bulundu; "eşdeğer kalitede yedek parça" tanımı içerir. Rekabet Kurumu, belirttiğin resmî alan adları listesinde yok ve tebliğ metni açılmadı. | DOĞRULANAMADI | Aday: https://www.rekabet.gov.tr/Dosya/tebligler/2017-3-20180219095528050.pdf (açılmadı). 2026-10-30. Karar sende: rekabet.gov.tr'yi resmî kaynak sayıyor muyuz? |
| 9 | DOT / lastik yaş sınırı | Okunan mevzuat metinlerinde (KTY, ÖTL, kış lastiği tebliği) satışta veya kullanımda lastik üretim tarihi / yaş sınırı hükmü bulunamadı; bu üç metinde DOT veya "üretim tarihi" araması sonuçsuzdu (KTY için). 6502 md. 8 gereği DOT'un yanlış söylenmesi ayıp/yanıltma tartışması doğurur; ayrı bir yaş sınırı kuralı değildir. Resmî hüküm bulunamadı. Üretici tavsiyeleri (6 yıl / 10 yıl) mevzuat değildir. | Resmî hüküm bulunamadı (kapsam: KTY, ÖTL, kış lastiği tebliği, 6502). Reklam Kurulu kararları ve Araç Muayene Yönetmeliği taranmadı → kesin "yok" DOĞRULANAMADI | Taranan: https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.10799.pdf ; https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=9&MevzuatNo=23474&MevzuatTertip=5 ; KTY PDF. 2026-10-30 |
| 10 | Saklanan malın sorumluluğu — TBK saklama sözleşmesi | Md. 561: saklayan, saklatanın bıraktığı taşınırı güvenli yerde koruma altına almayı üstlenir; ücret açıkça öngörülmüşse veya durum gerektiriyorsa istenebilir. Md. 562: saklatan masrafları öder, kusuru olmadığını ispatlamadıkça saklayanın saklamadan doğan zararını giderir. Md. 563: izinsiz kullanım yasağı. Md. 564: süre belirlenmiş olsa bile saklatan isterse saklayan hemen geri verir; saklatan süreye göre yapılan masrafı öder. Md. 565: süre dolmadan geri verilemez, belirsiz süreli sözleşmede istendiğinde geri verilebilir. Md. 566: geri verme saklananın korunduğu yerde, masraf ve hasar saklatana ait. Md. 567: birlikte saklayanlar müteselsil sorumlu. Not: Kayıp/hasar durumunda saklayanın tazminatı genel hükümlere (borca aykırılık) dayanır; bu maddeler tek başına tazminat tutarı vermez. | DOĞRULANDI (md. 561-567 metni) | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6098.pdf (PDF'ten çıkarılan metin). 2026-10-30 |

### (d) için notlar
- Lastik oteli işletmecisi için "ücret" TBK md. 561 gereği sözleşmede açıkça yazılmalı; sözleşme şablonu iş emriyle birlikte alınmalı (hukuki metin için avukat görüşü gerekir, bu rapor hukuki görüş değildir).
- Yazılım yaklaşımı: DOT ve ebat alanlarını zorunlu tut, ama "yaş sınırı" yasal diye sunma; eşik dükkân ayarı olsun.

---

## (e) Erişilemeyen / eksik kaynaklar
- Ticaret, Sanayi ve Çevre bakanlıkları kendi sitelerinden (ticaret.gov.tr, sanayi.gov.tr, csb.gov.tr) açılmadı; metinler mevzuat.gov.tr ve resmigazete.gov.tr üzerinden okundu. Lastik etiketleme yönetmeliğinin sanayi.gov.tr hâli açılmadı.
- mevzuat.gov.tr PDF'lerinin Türkçe karakterleri çıkarımda bozuldu; maddelerin anlamı okundu ama alıntı yapılmadı, madde numaraları ve sayılar teyit edildi.
- Satış Sonrası Hizmetler Yönetmeliği ek liste tablosu sütunları dağıldı (kullanım ömrü okunamadı).
- 2918 md. 65/A ve 7574 sayılı Kanun açılmadı.
- Rekabet Kurumu 2017/3 Tebliği açılmadı.
- Şikayetvar: yalnızca bazı liste sayfaları (lastik/otel, oto-lastik, lastikpark) ve arama özetleri okundu; Bridgestone ve Aklas şikayet sayfaları tek tek açılmadı, başlıkları arama sonucundan alındı.
- Uygulama mağazası yorumları: Servislet'te yorum yok; Google Play ve Caresoft yorumları incelenmedi. Arama araç sonuçlarının bir kısmı özetlenmiş çıktı olduğundan, rakip özellikleri sayfaları doğrudan açılan 5 üründe teyit edildi (Lastsis, Servislet, AysimaPOS, Senkronix, Vilyonix); haber sitesi, blog ve forum bilgisi doğrulanmış sayılmadı.
- Fiyatlar (AysimaPOS 7.500 TL/yıl) satıcı beyanı, KDV dahil denmiş, güncelliği teyit edilmedi.
- TecAlliance: Türkiye lisans/fiyat/yeniden satıcı bilgisi bulunamadı.
- Blog (arabam.com, Continental vb.), haber ve forum sayfaları yalnızca bağlam için tarandı; hiçbir mevzuat iddiası bunlara dayandırılmadı.
