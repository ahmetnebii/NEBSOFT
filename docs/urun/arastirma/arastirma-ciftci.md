# Araştırma: Tarım kooperatifi, zirai bayi / tüccar (üretici alımı) ve çiftçi takip yazılımı

Erişim tarihi (tüm kaynaklar): 2026-10-30. Kod yazılmadı. Kısaltma: RG = Resmî Gazete.
Not: Araştırmada yerel olarak mevzuat.gov.tr PDF metinleri indirilip okundu; okunamayan yerler açıkça "DOĞRULANAMADI" yazıldı.

## CANLIYA ÇIKMAYI ENGELLEYENLER (kullanıcıya sorulacaklar)
1. **Kooperatifte zorunlu defter listesi ve muhasebe biçimi:** 1163 md. 89 TTK 6102 hükümlerine ve Ticaret Bakanlığı'nın çıkaracağı tebliğe yollama yapıyor. Tebliğ metni okunamadı. Defter listesi (ortaklar defteri, genel kurul, yönetim kurulu karar defterleri vb.) DOĞRULANAMADI. Bu çıkmadan "kooperatif defter modülü" resmî dayanaklı sayılmaz.
2. **KDV tevkifatı ve tarım ürünü KDV oranları:** KDV genel uygulama tebliği ve oran listeleri (I/II sayılı liste) okunamadı. Rakam verilmedi, DOĞRULANAMADI. Bu yüzden ürün alım/satış ekranında KDV oranı otomatik önerilemez.
3. **B-Reçete (bitki koruma ürünü reçetesi) canlı durumu:** 1 Temmuz 2026'da 81 ilde başlaması "planlanıyor" denilmiş. Gerçekten yürürlüğe girdiği, hangi etkin maddelerin kapsandığı ve bayiye açık bir web servis/API olup olmadığı DOĞRULANAMADI. Bayi programının B-Reçete'ye "bağlanıyor" gösterilmesi yasak (§1 sahte başarı yasağı); bağlantı yoksa "elle girildi" olarak etiketlenmeli.
4. **HKS bildirim eşik miktarı ve web servis şartnamesi:** Güncel eşik ve servis dokümanı okunamadı, DOĞRULANAMADI. HKS'ye "gönderildi" gösterilemez.
5. **Stopaj oranı güncelliği:** Oranlar GİB tablosundan ve 2009/14592 sayılı karardan okundu (aşağıda). Fakat 2025-2026'da bu kararı değiştiren yeni bir Cumhurbaşkanı Kararı olup olmadığı tüm mevzuat taranarak kesin görülemedi. GİB tablosu 2024 sonu değişikliğini (94/19) içerdiği için güncel görünüyor. Yazılımda oran **ayar olarak** tutulmalı, yürürlük tarihli yapılmalı.

---

## (a) İncelenen ürünler

Not: Türkiye'de bu alanda büyük, özellik sayfası ayrıntılı, sürüm tarihli 3-5 "lider" ürün bulunamadı. Bulunanlar küçük firma sayfaları ve eski indirme siteleridir. Ürünlerin pazar payı ve güncelliği DOĞRULANAMADI. Aşağıdaki tablo yalnızca ne okunduğunu gösterir.

| Ürün (ad) | URL | Tarih / güncellik | Karşılanan ihtiyaçlar (kendi ifademizle) |
|---|---|---|---|
| Eva Yazılım "Müstahsil Kooperatif Programı" | https://www.eva.com.tr/mustahsil-kooperatif-programi-yazilimi | Sayfada tarih yok, telif "2021", "güncelleniyor" notu var; fiyat yok (arama özetinde 6.000 TL+KDV geçiyor, sayfada doğrulanamadı) | Kooperatif/süt toplama için ön muhasebe, e-dönüşüm (e-fatura, e-müstahsil, e-irsaliye, e-arşiv), üye takibi ve resmî belge basımı, üretici ödeme listesi ve banka yükleme dosyası, SGK kesinti sorgusu |
| Comport ERP "Müstahsil Kesme Programı" | https://www.comport.com.tr/mustahsil-programi | Tarih yok | Çiftçiden alımda müstahsil makbuzu düzenleme, satın alma/stok/depo lokasyonu, cari takip ve geciken borç listesi, taksit planı. Sayfada "stopaj" ve kantar yok. |
| Aves Kooperatif Ön Muhasebe (satıcı sayfası) | https://www.fiyatucuz.com/urun/aves-kooperatif-kooperatif-on-muhasebe-programi-server-versiyon-full-surum/ | Sayfa açılamadı (sertifika hatası); yalnızca arama özetinden biliniyor | Kooperatif ve süt toplama merkezleri için ön muhasebe, müstahsil faturası, üyeye yem/kepek satışı (arama özeti; DOĞRULANAMADI) |
| OliveOS (zeytin alım ERP) | https://oliveos.com.tr/ | Tarih yok | Zeytin alımı, laboratuvar analizi, kantar tartımı, fatura. Aranan "üretici hesabı/avans/emanet/TAKEP" ifadeleri sayfanın okunan ilk 100 bin karakterinde bulunamadı (kalan 520 bin karakter okunmadı) |
| Tila Müstahsil Programı (TMP) | https://www.tamindir.com/indir/tila-mustahsil-programi-tmp/amp/ | Tamindir kaydı "20 yıl önce" güncellenmiş; eski | Müstahsilden alım yapan birlikler/işletmeler için müstahsil, stok, cari, fatura, banka, kasa, üretim maliyeti, araç takip |
| SBTPro Süt Birliği Programı (Kulaç Soft) | https://www.tamindir.com/indir/sbtpro-sut-birligi-programi/ | 13 Şubat 2008 (eski) | Üyenin aylık süt teslimi, ödeme ve üretici makbuzu, üye hareket raporları, aidat listesi, hayvan/üye sayısı grafiği |
| AKINSOFT Çiftçi Koruma 1.07 | https://www.tamindir.com/indir/akinsoft-ciftci-koruma-107/amp/ | "22 yıl önce" güncellenmiş (eski) | Belediye/tarım kooperatifi üye kaydı, üye hareketi, bakiye listeleri |
| Sütçü Mobil (iOS) | https://apps.apple.com/app/id6670253996 | Sürüm 1.5.4 (yıl sayfada belirtilmemiş); yeterli yorum yok | Süt toplamayı dijitale taşır: toplayıcı kaydı/rota, çiftçinin süt takibi, çevrimdışı mod, soğutma tankı durumu, bildirim |
| Tarla.pro (iOS) | https://apps.apple.com/py/app/tarla-pro/id6473836703 | Sürüm 1.1, 29/12/2025; yeterli yorum yok | Tarla/ürün kaydı, toprak analizi, ekim-hasat tarihi, gübre/sulama takvimi, makine bakımı, maliyet, yıllık verim karşılaştırma, görev ve bildirim |
| Tarım Cebimde (Bakanlık, kamu uygulaması; rakip değil, referans) | https://www.tarimorman.gov.tr/btgm/Haber/128/Tarimcebimde-4-2-0-Versiyonu-Yayinlandi | Sürüm 4.2.0 duyurusu (tarih okunmadı) | ÇKS belgesi gibi bakanlık hizmetlerine e-Devlet ile erişim (arama özeti; sayfa içeriği ayrıca okunmadı) |

Açıklanan boşluk (bizim için fırsat): okunan hiçbir ürün sayfasında şu birleşim görünmedi: (1) girdi veresiyesi + hasatta mahsup, (2) parsel/ürün deseniyle bağlı üretici kartı, (3) stopaj/müstahsil/e-müstahsil + HKS tek akış, (4) bayi için reçete/karekod kaydı. Bu "hiçbir sayfada görünmedi" bir pazar ispatı değildir; yalnızca okunan sayfalarda bulunamadığı anlamına gelir.

---

## (b) Özellik listesi (öneri) ve dayandığı kaynak

Bizde var/yok durumu bu araştırmada incelenmedi (mevcut program ekranları açılmadı); spec aşamasında doldurulacak.

### Olmazsa olmaz
| # | Özellik | Dayanak |
|---|---|---|
| 1 | Üretici/ortak kartı: kimlik, köy, telefon, IBAN, ortaklık durumu, payı | 1163 md. 16, 19; Eva ve AKINSOFT sayfaları (üye takibi) |
| 2 | Ürün alımı: kantar/miktar/kalite, fiyat, otomatik makbuz | Comport, TMP, OliveOS sayfaları; VUK md. 235 |
| 3 | Müstahsil makbuzu: VUK 235 asgari alanları (tarih, alıcı, satıcı, cins-miktar-bedel), iki nüsha, seri-sıra numarası kesintisiz | VUK md. 235 (aşağıda DOĞRULANDI) |
| 4 | Stopaj hesabı (GVK 94/11), oranlar ayardan, borsa tescilli / tescilsiz ayrımı, hayvansal / diğer ürün ayrımı | GVK md. 94/11; GİB tablosu; 2009/14592 |
| 5 | Üretici cari hesabı: borç (girdi veresiyesi, avans), alacak (ürün bedeli), mahsup kaydı, bakiye ve ekstre | Eva (ödeme listesi, hesap özeti), Comport (cari, taksit); 4572 md. 3 (bedel hesaplama/ödeme şekli ana sözleşmede); 235 (avans üzerine alımda makbuz teslimde verilir) |
| 6 | Yedekleme/geri alma, çok kullanıcı ve yetki, silinemeyen makbuz (iptal edilir, silinmez) | VUK 235 (seri-sıra); sektör sayfaları |
| 7 | Bayi için: bayi kontrol defteri kaydı, reçeteli ürünü reçetesiz satışı engelleyen uyarı, 5 yıl saklama | BKÜ Yönetmeliği RG 13/12/2025 md. 21/1-d, o |

### Beklenen
| # | Özellik | Dayanak |
|---|---|---|
| 8 | e-Müstahsil Makbuzu (GİB e-Belge): `NS.ebelge.create()` ile; zorunlu olanlar için hazır | 509 sıra no.lu VUK GT bölüm IV.5; GİB e-Belge sayfası |
| 9 | Hasatta otomatik mahsup önerisi: alım bedeli - stopaj - vadesi gelen girdi borcu = net ödenecek; kullanıcı onaylar | Eva ödeme listesi + Comport cari/taksit; Şekerbank Hasat Kart haberi (vadenin hasada bağlanması ihtiyacı) |
| 10 | Banka ödeme dosyası (toplu üretici ödemesi) | Eva "ödeme listesi / banka yükleme" |
| 11 | Parsel ve ürün kaydı: ada-parsel, alan, sulu/kuru, mülkiyet türü (malik / kira / tahsis), üretim yılı ürün deseni; ÇKS ile aynı alanlar | ÇKS Yönetmeliği md. 6, 7; Tarla.pro |
| 12 | Üretici Kayıt Defteri (ÜKD): bitki koruma ürünü uygulaması ve hasat kaydı | Tarım ve Orman Bakanlığı ÜKD SSS: https://www.tarim.gov.tr/GKGM/Belgeler/Uretici_Bilgi_Kosesi/Merak_Ettikleriniz/UKD_Sikca_Sorulan_Sorular.pdf (arama özetinden; sayfa ayrıca okunmadı) |
| 13 | Gelir-gider farkı (risturn benzeri) dağıtımı: ortak muamelesi oranında, yedek akçe ayrımı sonrası | 1163 md. 38, 39 |
| 14 | Dönem sonu raporları: stopaj bildirimi (muhtasar için döküm), alış listesi, üretici bazlı yıllık özet | GVK md. 94 (beyan biçimi okunmadı, sadece döküm) |

### Fark yaratan
| # | Özellik | Dayanak / gerekçe |
|---|---|---|
| 15 | Girdi veresiyesinde vade = hasat tarihi, tahmini verime göre risk limiti (parsel alanı x ürün) | Okunan ürünlerde yok (boşluk); parsel verisi ÇKS alanlarıyla geldiği için yapılabilir |
| 16 | Üretici telefonunda "bakiyem ne" sayfası/SMS-WhatsApp ekstresi (yalnızca gerçekten gönderilmişse "gönderildi") | Sütçü Mobil (çiftçi tarafı), Tarla.pro |
| 17 | Çevrimdışı kantar/alım (köyde internetsiz), sonra eşitleme | Sütçü Mobil sürüm notlarında çevrimdışı mod |
| 18 | HKS bildirim hazırlığı (künye, miktar) ve "bildirim yapıldı" yalnızca onay gelince | 5957 md. 4/1-g; HKS web servis kılavuzu (eşik DOĞRULANAMADI) |
| 19 | Lisanslı depo ürün senedi takibi (alınan ürünü depoya koyma, senet no, rehin/ciro) | 5300 md. 3/i; kapsam büyük, ikinci dalga |
| 20 | B-Reçete bağlantısı yoksa "elle reçete no gir + uyar" modu; resmî servis netleşirse bağlama | B-Reçete duyurusu 25.03.2026 (servis detayı DOĞRULANAMADI) |

---

## (c) Şikâyet temaları

Önemli sınırlama: Şikâyetvar'da ve Google Play'de bu ürünlere ait (Eva, Comport, Aves, Sütçü Mobil, Tarla.pro vb.) doğrudan şikâyet bulunamadı. Mağaza sayfalarında yeterli yorum yok. Google Play yorum sayfaları araç ile okunamadı. Aşağıdaki temalar bu yüzden **ürün şikâyeti değil**, okunabilen en yakın kaynaklardan (bayilerin B-Reçete eleştirisi, kamu sistemleri, ürün sayfalarındaki yokluklar) çıkarılmıştır. Güvenilirlik düşüktür; spec aşamasında pilot bayi/kooperatif görüşmesiyle doğrulanmalıdır.

| # | Tema | Kaynak (okunan) | Karşılayacak özellik |
|---|---|---|---|
| 1 | Resmî sistem sahadaki gerçek iş akışına uymuyor (bayiler: ticari ve operasyonel aksaklık, anketle uygulamadan memnuniyetsizlik) | Yeni Ankara, Dr. Mevlüt Şahin, 11 Şubat 2026: https://www.yeniankara.com.tr/yazarlar/dr-mevlut-sahin/b-recete-takip-sitemi-ile-ilgili-yasanan-sorunlar-1-155211 (yazı ayrıntı vermiyor; anket sonuçları Antalya-Manisa; yazar görüşü, resmî veri değil) | Reçete ve satış kaydını tek ekranda, elle de girilebilir tutmak; zorunlu olmayan adımı zorunlu yapmamak |
| 2 | Aynı etkin madde farklı ürünlerde farklı ürün-bitki izinlerine sahip, bayi ve çiftçide belirsizlik | Ekonomi Gazetesi (arama özeti, sayfa okunmadı): https://www.ekonomigazetesi.com/sehirler/b-recete-uygulamasi-geri-cekilsin-talebi-81269 (DOĞRULANAMADI, yalnızca arama özeti) | Ürün kartında ruhsat/etiket bilgisinin kullanıcıya hatırlatıcı notu (veri kaynağı resmî olmadıkça otomatik karar verme) |
| 3 | Kamu çiftçi sistemlerine giriş / erişim sorunları (örn. siber saldırı sonrası ÇKS'ye giriş) | Sözcü başlığı (sayfa okunmadı, yalnız başlıktan): https://www.sozcu.com.tr/siber-saldiri-ciftciyi-vurdu-kayit-sistemine-giremiyor-kredi-cekemiyor-wp6598225 (DOĞRULANAMADI) | Çevrimdışı çalışma, kendi parsel kopyamız, ÇKS'ye bağımlı olmayan veri |
| 4 | Saha hizmetinin gecikmesi, takip edilememesi (buzağı küpeleme 4 aydır gelinmemiş; 14 Haziran 2024) | Şikâyetvar: https://www.sikayetvar.com/tarim-ve-orman-bakanligi/bafra-ilce-tarim-sorunu | Randevu/iş emri takibi (bayi veya kooperatif saha ziyareti) – düşük öncelik |
| 5 | Eski, güncellenmeyen masaüstü programlar (2004-2008 tarihli indirmeler hâlâ listede) | Tamindir sayfaları (yukarıdaki tablo) | Web/bulut, sürekli güncelleme, e-Belge entegrasyonu |
| 6 | Fiyat ve demo bilgisi saklı, "teklif iste" (Eva sayfasında fiyat yok, demo formu var) | Eva sayfası | Açık fiyat, deneme sürümü (`?demo=1`) |
| 7 | Çiftçi kredisi/vadeli ödemede ücret ve risk şikâyetleri (hesap işletim ücreti iadesi, kredi risk notu) | Şikâyetvar çiftçi kredisi: https://www.sikayetvar.com/ciftci-kredisi (arama özeti; tek tek şikâyet okunmadı) | Vadenin ve faizin/komisyonun üretici kartında açıkça yazılması, mahsup öncesi onay |

Çıkarım (kaynaksız, varsayım olarak işaretli): tarım kooperatiflerinde en sık ihtiyaç "hasatta alacak-borç mahsubunun şeffaf olması"dır (hafızadan, doğrulanmadı). Bu varsayım pilot görüşmede sınanacak.

---

## (d) Mevzuat tablosu

Etiketler: DOĞRULANDI = metin yerelde indirilip okundu veya resmî sayfadan okundu. DOĞRULANAMADI = okunamadı, rakip kaynak/özetle yetinilemez.

| # | İddia | Etiket | Kaynak (URL) | Madde | Not |
|---|---|---|---|---|---|
| 1 | Kooperatif en az 7 ortakla kurulur; ana sözleşme gerekir | DOĞRULANDI | https://www.mevzuat.gov.tr/mevzuatmetin/1.5.1163.pdf (Kooperatifler Kanunu, 1163, değişiklikler 21/10/2021 – 7339'a kadar işlenmiş) | md. 2 | |
| 2 | Ortaklar defterine çıkarma kararı yazılır (ortaklar defterinin varlığı) | DOĞRULANDI | aynı | md. 16 | Metin "ortaklar defteri"ni yalnızca burada anıyor; tutulma biçimi tarifi bu metinde yok |
| 3 | Ortaklık payı: her giren en az bir pay alır; pay 100 TL; en çok 5.000 pay taahhüdü; pay bedeli ilgili Bakanlıkça artırılabilir | DOĞRULANDI (metne göre) | aynı | md. 19 | Güncel pay bedeli kooperatif türüne göre değişebilir; ana sözleşmeye bakılmalı |
| 4 | Gelir-gider farkı ortaklara dağıtılacaksa muamele oranında yapılır; farkın en az %50'si dağıtıldıktan sonra paya faiz ödenebilir; zarar varsa dağıtım yapılamaz | DOĞRULANDI | aynı | md. 38 | Kanun metninde "risturn" kelimesi doğrudan gelir-gider farkı dağıtımı için kullanılmıyor (yalnızca md. 56'da yönetim kurulu ödemeleri sayımında geçiyor). Dağıtım adı "gelir-gider farkı". |
| 5 | Gelir-gider farkının en az %10'u yedek akçeye ayrılmadan dağıtım yapılamaz (üst kuruluşlarda ek %5 fevkalade yedek) | DOĞRULANDI | aynı | md. 39 | |
| 6 | Yönetim kurulu üyelerine genel kurulun belirlediği aylık ücret, huzur hakkı, risturn ve yolluk dışında ödeme yapılamaz | DOĞRULANDI | aynı | md. 56 | |
| 7 | Muhasebe usulü ve zorunlu defterler için TTK 6102 hükümleri uygulanır; usul Ticaret Bakanlığı tebliğiyle belirlenir; VUK hükümleri saklı | DOĞRULANDI (yollama) / **zorunlu defter listesi DOĞRULANAMADI** | aynı | md. 89 | İlgili tebliğ okunamadı |
| 8 | 4572: kooperatif ürün alımı, alım bedelini hesaplama/ödeme şekli, kredi, gelir-gider farkı dağıtımı örnek ana sözleşmede gösterilir; ortaklardan ürünün tamamının/bir kısmının teslimi veya asgari miktar şartı konabilir | DOĞRULANDI | https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4572.pdf (RG 16/6/2000, 24081; PDF üst verisi 26/3/2024) | md. 3 | |
| 9 | 4572: ortakların kooperatifle işlemleri vergi/resim/harçtan muaf; ortak içi işlemlerden doğan olumlu gelir-gider farkı gelir ve kurumlar vergisinden muaf | DOĞRULANDI (a ve b bentleri okundu) | aynı | md. 6 | Diğer bentler (c-h) bu araştırmada özetlenmedi |
| 10 | Müstahsil makbuzu: I. ve II. sınıf tüccar, basit usul ve defter tutan çiftçi, gerçek usulde vergilendirilmeyen çiftçiden mal alırken bedeli öderken iki nüsha makbuz düzenler; avans üzerine alımda makbuz malın tesliminde verilir; makbuz fatura yerine geçer; en az tarih, alıcı, satıcı, mal cinsi-miktarı-bedeli bulunur; seri ve sıra numarası kesintisiz | DOĞRULANDI | https://www.mevzuat.gov.tr/ (VUK 213, bölüm indirildi; 1.4.213 PDF, güncel metin) | VUK md. 235 | Zorunluluk eşiği bu maddede yok |
| 11 | Stopaj (GVK 94/11): çiftçilerden satın alınan zirai mahsul ve hizmet bedellerinden gelir vergisi tevkifatı; ilgili tüzel kişi, kooperatif, ticaret şirketi, gerçek gelir beyan eden tüccar vb. tevkifata zorunlu | DOĞRULANDI | https://www.mevzuat.gov.tr/MevzuatMetin/1.4.193.pdf (GVK, 7587 sayılı 24/6/2026 değişikliğine kadar işlenmiş görünüyor) | GVK md. 94/1 ve 94/11 | Kooperatifler md. 94 girişinde sayılı |
| 12 | Stopaj oranları: hayvanlar-ürünleri-av: borsa tescilli %1, tescilsiz %2; diğer zirai mahsul: borsa tescilli %2, tescilsiz %4; zirai hizmet: orman idaresi %2, diğer %4; doğrudan gelir desteği %0 | DOĞRULANDI (iki resmî kaynakta aynı) | GİB: https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fyardim-kaynaklar%2Fyararli-bilgiler%2Fgelir-vergisi-kanununun-94uncu-maddesinde-yer-alan-kesinti-oranlari.pdf ; RG 3/2/2009 sayı 27130, Karar 2009/14592: https://www.resmigazete.gov.tr/eskiler/2009/02/20090203-3.htm | GVK md. 94/11 | GİB tablosu "arşiv" klasöründe, sayfa tarihi yok; tablo 2024 sonu karar (9284) notunu içerdiği için güncel görünüyor. 2025-26 değişikliği yok mu: kesin doğrulanamadı. Oran **ayar** olmalı. Cumhurbaşkanı md. 94'teki oranı sıfıra kadar indirme/bir katına kadar artırma yetkili (GVK md. 94 yetki fıkrası, okundu) |
| 13 | e-Müstahsil Makbuzu: kâğıt makbuzun elektronik hâli, yeni belge türü değil, aynı hukuki nitelik | DOĞRULANDI | 509 sıra no.lu VUK GT: https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=33905&mevzuatTur=Teblig&mevzuatTertip=5 ; GİB: https://ebelge.gib.gov.tr/emustahsilhakkinda.html | Teb. bölüm IV.5 | |
| 14 | e-Müstahsil zorunluluğu: genel olarak zorunlu değil, isteğe bağlı (e-Fatura'da olmak, hazırlık, başvuru şartıyla). Zorunlu olanlar: e-Fatura zorunluluğu olup aynı zamanda müstahsil makbuzu düzenlemek zorunda olan ve 5957 uyarınca komisyoncu/tüccar olarak sebze-meyve ticareti yapanlar; ayrıca Bakanlığın yazılı bildirim yaptığı riskli/uyum düzeyi düşük mükellefler (en az 3 ay hazırlık süresi) | DOĞRULANDI | aynı | IV.5.2, IV.5.4 | Geçiş tarihi 1/7/2020 (IV.5.5). Zorunluluğa uymayanlara kanunda öngörülen hükümler uygulanır |
| 15 | KDV: gerçek usulde vergiye tabi olmayan çiftçilerin teslim ve hizmetleri KDV'den istisna | DOĞRULANDI | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.3065.pdf (KDV Kanunu; 7587 değişikliğine kadar işlenmiş) | KDV md. 17/4-b | |
| 16 | KDV tevkifat oranı ve tarım ürünleri KDV oranları | **DOĞRULANAMADI** | okunamadı (KDV Genel Uygulama Tebliği, Cumhurbaşkanı kararı oran listeleri) | KDV md. 9, md. 29 yollamaları | Rakip/muhasebe sitelerinden alınmadı |
| 17 | 5957 Hal Kanunu: şu mallar bildirime tabi: sınai üretimde kullanılmak üzere alınanlar, ihraç edilecekler, ithal edilenler, organik sertifikalı ürünler, üretici örgütlerince hal dışında satılanlar, iyi tarım sertifikalı ürünler, fatura veya müstahsil makbuzu ile üreticiden satın alınan mallar | DOĞRULANDI | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5957.pdf (RG 26/3/2010, 27533) | md. 4/1 a-g | Yani kooperatif/tüccar müstahsil makbuzuyla sebze-meyve alıyorsa bildirim kapsamında olabilir. Bildirim yöntemi ve **eşik miktar** yönetmeliğe bırakılmış: **DOĞRULANAMADI** |
| 18 | Hal rüsumu: toptancı halinde satılandan %1, hal dışında %2 (Cumhurbaşkanı aksine karar verebilir) | DOĞRULANDI (kanun metni); güncel oran kararı DOĞRULANAMADI | aynı | md. 8 | |
| 19 | HKS: Ticaret Bakanlığı'nın elektronik kayıt sistemi, hal.gov.tr, çağrı merkezi 444 0 425; ürün künyesi; sistem amacı ticaretin elektronik izlenmesi | DOĞRULANDI | https://ticaret.gov.tr/ic-ticaret/bilgi-sistemleri/hal-kayit-sistemi-hks | | Sayfa "bildirimci" tanımını ve zorunluluk dayanağını vermiyor. Yönetmelik güncel metni okunmadı: DOĞRULANAMADI |
| 20 | 5300 Lisanslı Depoculuk: ürün senedi, ürünün mülkiyetini temsil eden ve rehin vermeye yarayan, lisanslı depo işletmesince nama/emre düzenlenen belge | DOĞRULANDI | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5300.pdf (RG 17/2/2005, 25730) | md. 3/i | Yazılımın hangi alanları tutacağı (senet no, depo, ürün, miktar) yönetmelik/tebliğe bırakılmış, okunmadı: DOĞRULANAMADI |
| 21 | ÇKS: çiftçi kayıt başvurusu ve güncelleme; tarım arazisinin tapu bilgisi beyanı (TAKBS ile eşleşir); kadastro geçmemiş yerler için köşe koordinatlı keşif raporu; kira/muvafakat/taahhütname; üretim alanı CBS tarım parseli alanını geçemez; sulu/kuru beyanı | DOĞRULANDI | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=19712&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 (ÇKS Yönetmeliği, RG 27/5/2014, 29012; değişiklikler 31/8/2025, 33003'e kadar işlenmiş) | md. 6 (3, 11), md. 7 | **EK-1 Çiftçi Kayıt Formu'ndaki tam alan listesi (ada, parsel, mevki, vb.) okunmadı**: DOĞRULANAMADI. Yazılımda ÇKS ile "eşleşme" iddiası kurulamaz, yalnızca benzer alanlar tutulur |
| 22 | ÇKS başvuru takvimi: üretim yılı başvurusu bir önceki yılın 1 Eylül - 31 Aralık; sonrası için 30 Haziran'a kadar; üretim bilgisi güncelleme 15 Mart - 15 Nisan | DOĞRULANDI | aynı | md. 6/2 | Hatırlatıcı özelliği için kullanılabilir |
| 23 | Bayi (BKÜ) yükümlülükleri: sayfaları numaralı ve il müdürlüğünce onaylı Bayi Kontrol Defteri bulundurma; Bakanlıkça reçeteli satılması zorunlu ürünü reçetesiz satamaz; reçeteli satış kayıtları düzenli tutulur; reçete ile ilgili fatura, fiş vb. kayıtlar beş yıl saklanır; karekodlu ürünler takip sistemine bildirilmeden stoğa alınamaz/çıkarılamaz (etiket/karekod bilgisi olmayan ürün bulundurulamaz) | DOĞRULANDI (RG 13/12/2025 metni) | https://www.resmigazete.gov.tr/eskiler/2025/12/20251213-4.htm (Bitki Koruma Ürünlerinin Toptan ve Perakende Satılması ile Depolanması Hakkında Yönetmelik, RG 13/12/2025, 33106) | md. 21/1 (b, c, d, o); md. 21/1-o için beş yıl | Karekod bildirim maddesinin numarası ayrıca okunmadı |
| 24 | Eski 2019 BKÜ bayi yönetmeliği (RG 13/2/2019, 30685) | UYUMSUZ (güncel değil) | https://www.resmigazete.gov.tr/eskiler/2019/02/20190213-1.htm | | 13/12/2025 yönetmeliği yeni; 2019 metni kullanılmamalı (yürürlükten kalktığı kesin okunmadı, ancak aynı konuda yeni yönetmelik var) |
| 25 | Reçete: Bakanlıkça reçeteli satılması zorunlu kılınan ürünler elektronik reçete sistemi üzerinden; reçete yazma yetki belgesi olanlar yazar; pilot 12/1/2026 (Mersin, Samsun, Ankara, Kırklareli), ülke geneli planı 1/7/2026 | DOĞRULANDI (planlama ifadesi) / **ülke geneli fiilen başladı mı: DOĞRULANAMADI** | https://bitkirecete.tarimorman.gov.tr/Duyuru/Detay/17781 (duyuru 25.03.2026); RG 13/12/2025 yönetmeliği | Reçete maddeleri aynı yönetmelikte | Hangi etkin maddelerin kapsandığı ve bayi API'si okunamadı |
| 26 | Bayi için reçete/karekod "takip sistemine" bildirim API'si var mı, bayi yazılımı bağlanabilir mi | **DOĞRULANAMADI** | okunamadı | | Bağlantı iddiası canlıda yapılmamalı |
| 27 | Stopaj ve müstahsil makbuzu için "alt sınır (tutar eşiği)" var mı | DOĞRULANMADI olarak işaretli | VUK md. 235'te eşik ifadesi yok (okundu) | | Bir arama özeti 509 tebliğinde tutar sınırı olmadığını söylüyor; tebliğ içinde ayrıca doğrulanmadı |

---

## (e) Erişilemeyen / doğrulanamayan kaynaklar
- Şikâyetvar'da ve Google Play'de ürünlere ait doğrudan şikâyet sayfaları bulunamadı; Google Play yorumları araçla okunamadı (sonuçlarda Google Play sayfası çıkmadı).
- Aves Kooperatif satıcı sayfası (fiyatucuz.com): sertifika hatası, açılamadı.
- OliveOS sayfası: ilk 100 bin karakter okundu, kalan 520 bin karakter okunmadı; üretici hesabı ibareleri bulunamadı.
- Ekonomi Gazetesi ve Sözcü haberleri: yalnızca arama başlığı/özeti, sayfa okunmadı.
- Tarım Cebimde sürüm sayfaları (4.0.1, 4.2.0): içerik okunmadı, yalnızca başlık.
- ÜKD SSS PDF (tarim.gov.tr): içerik okunmadı, arama özeti.
- Kooperatif zorunlu defter tebliği (1163 md. 89): bulunamadı, okunmadı.
- KDV Genel Uygulama Tebliği (tevkifat oranları) ve tarım ürünü KDV oranları: okunmadı.
- HKS web servis dokümanı, bildirim eşik miktarı, Sebze ve Meyve Ticareti ve Toptancı Halleri Yönetmeliği güncel metni: okunmadı (yalnızca ticaret.gov.tr genel sayfa).
- ÇKS Yönetmeliği EK-1 form alanları: okunmadı.
- 5300 sayılı kanunun uygulama yönetmeliği/tebliği (yazılımın tutacağı alanlar): okunmadı.
- B-Reçete bayi API/entegrasyon dokümanı ve kapsamdaki etkin madde listesi: bulunamadı.
- Blog, muhasebe sitesi ve haber kaynakları (alomaliye, muhasebetr, lexpera, birfatura, Sovos vb.) görüldü ama §1 gereği doğrulanmış sayılmadı; hiçbir mevzuat iddiası bunlara dayandırılmadı.
- Hafızadan (doğrulanmadı) olarak yazılan tek şey: "kooperatiflerde en sık ihtiyaç hasatta mahsubun şeffaflığıdır" varsayımı.
