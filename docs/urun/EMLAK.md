# Emlak Ofisi — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/emlak/` (+ `portal.js` ilan portalları, `ilan.html` ilan sitesi).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **İlan portalları (sahibinden.com, Hepsiemlak, Emlakjet) — DOĞRULANAMADI:** resmî ilan API dokümanı bulunamadı → çekirdekte `UNVERIFIED`, yalnızca simülasyon, canlıda seçilemez. Yerine **elle yayın kaydı** var: işletme portalda yayınlar, numarayı programa yazar.
- **EİDS — entegrasyon yok:** mal sahibinin e-Devlet'ten verdiği yetki sistemi resmî olarak doğrulandı ([Ticaret Bakanlığı](https://ticaret.gov.tr/kurumsal-haberler/elektronik-ilan-dogrulama-sistemi-eids-yetki-dogrulama-uygulamasi-hayata-gecirildi), [eids.ticaret.gov.tr](https://eids.ticaret.gov.tr/); erişim 30.10.2026), fakat işletmelere açık API bulunamadı. Program yalnızca bitiş tarihini takip eder. Duyuru 2024-2025 tarihli; güncel ayrıntı DOĞRULANAMADI.
- **Ödeme sistemi (Yönetmelik ek md. 1):** 1.12.2026'ya kadar zorunlu değil, Bakanlık üç aya kadar uzatabilir (geçici md. 1/10). Program yalnızca uyarı gösterir; entegrasyon yok.
- **Belge taslakları:** gösterme belgesi, yetkilendirme ve aracılık sözleşmeleri Yönetmelik md. 15-19 asgari bilgilerine göre üretilir; hukukçu incelemesinden geçmedi. "Taslak" olarak işaretli.
- **TÜFE oranı:** TÜİK'ten kullanıcı girer, programda sabit değer yok. Otomatik çekim için resmî uç nokta aranmadı.
- **Dövizli kira (TBK md. 344/4) ve 5 yıl sonrası hâkim tespiti (md. 344/3):** hesaplanmaz, yalnızca uyarı.
- **KDV %20 varsayılanı:** (hafızadan, doğrulanmadı). Ayardan değişir.
- **Eski veri uyarısı:** bu sürümden önce `PORTALHUB.ensure` gerçek kullanıcının ilanlarına rastgele `YB…` yetki numarası ve "yayında" portal kaydı yazıyordu. Yeni kayıt üretilmiyor, ama **önceden yazılanlar otomatik ayırt edilemediği için silinmedi**; kullanılmış gerçek veritabanı varsa elle kontrol edilmeli.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Portal yanıtı yok sayılıyordu:** ilan gönderilince rastgele portal ilan numarası uyduruluyor, 2,5 sn sonra kendiliğinden "Yayında" oluyordu | Yanıta göre: simülasyon "TEST — yayınlanmadı" (no uydurulmaz), hata, ya da "Onayda" (no portaldan); otomatik yayına alma kaldırıldı | Kod incelendi |
| H2 | Süresi dolanları yenileme ve satılanları kaldırma sonuçtan bağımsız başarılı sayılıyordu | Yalnızca portal onaylarsa tarih uzar / kaldırıldı olur; simülasyonda TEST | Tarayıcı: "TEST — 4 ilan yenilenmedi" |
| H3 | Doping kredisi portal yanıtı beklenmeden düşülüyordu | Kredi ve işaret ancak portal onaylarsa | Kod incelendi |
| H4 | İlan kartından portala gönderimde simülasyon "yayında" yazıyordu | "TEST" / "onayda" / "hata" | Kod incelendi |

Kalite kapısı: ekranlar açıldı, konsol hatası yok.

## 1. Pazar araştırması (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı.
- [REOS](https://apps.apple.com/ro/app/re-os-emlak-mls/id1425931907): arayan tanıma, portföy ve talep, MLS paylaşımı, EİDS uyumlu paylaşım, Hepsiemlak ve Emlakjet yayını, web sitesi, yapay zekâ metni. Mağazada yeterli yorum yok.
- [EmlakCRMx](https://www.hunted.space/product/emlakcrmx): portföy, komisyon, gösterim, ekip yetkisi, Sahibinden'den içe aktarma (ayrıntılı [Capterra sayfası](https://www.capterra.com/p/10043487/EmlakCRMx/) 403 döndü).
- Diğer Türk ürünleri için herkese açık ayrıntılı özellik sayfası: bulunamadı (arama Emlakofisim ve RE/MAX için sonuç vermedi).

**Kullanıcı şikâyetleri** (yalnızca başlık ve özet, doğrulanmadı): [yetki belgesi](https://www.sikayetvar.com/emlakci/yetki-belgesi), [yanıltıcı ilan nedeniyle komisyon iadesi](https://www.sikayetvar.com/emlak-komisyonculari-odasi/yaniltici-emlak-ilani-nedeniyle-komisyon-ve-eksper-ucretinin-iadesi-talebi), [sahibinden ilanında komisyon talebi](https://www.sikayetvar.com/sahibinden/emlakci-komisyonu/istiyor). Çıkarım: **yanıltıcı ilan ve yetki** en büyük güven sorunu; ilan sitesindeki uydurma bilgiler bu yüzden önce temizlendi.

**Mevzuat — DOĞRULANDI (metin okundu, 30.10.2026):**
- [Taşınmaz Ticareti Hakkında Yönetmelik](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.24645.pdf) (son değişiklik RG 1/10/2026-33387): md. 12/1 yanıltıcı ilan, 12/3 fiyat artışı, 14/2-h üç gün içinde ilan kaldırma, 14/2-i ilan zorunlu bilgileri, 14/2-k beş yıl dosya, 14/2-ş teklif sunma, 15 yetkilendirme sözleşmesi, 16-17 aracılık, 19 gösterme belgesi (ücretsiz), 20 hizmet bedeli (%4, bir aylık kira, eşit paylaşım, bertaraf), ek md. 1 ödeme sistemi.
- [6098 sayılı TBK](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6098.pdf): md. 342 güvence, 344 kira artışı, 345 bildirim, 346 ceza koşulu yasağı, 347 uzama ve fesih, 348 yazılı bildirim. Geçici md. 1'deki %25 sınırı konut kiralarında geçmiş dönem içindir, uygulanmadı.

**Bilinçli olarak yapılmayanlar:** geç kira cezası (TBK md. 346 geçersiz sayar), gösterme ücreti (md. 19/4).

## 2. Özellik sınıflaması
| Özellik | Sınıf | Durum | Kaynak |
|---|---|---|---|
| Portföy, talep eşleştirme, gösterim, komisyon | Olmazsa olmaz | Var | REOS, EmlakCRMx |
| Gösterme belgesi, yetkilendirme ve aracılık belgeleri | Olmazsa olmaz | Var (2. dalga) | Yönetmelik |
| Kira takibi, TBK artış sınırı | Beklenen | Var (2. dalga) | TBK |
| Ekip yetkisi, hakediş | Beklenen | Var | EmlakCRMx |
| Portala otomatik yayın, MLS | Beklenen | **Yok** (doğrulanamadı) | REOS |
| Teklif kaydı, mal sahibi ekstresi, uygunluk kartı | Fark yaratan | Var | Yönetmelik |
| Arayan tanıma, yapay zekâ metni | Fark yaratan | **Yok** | REOS |

## 3. 2. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| B1 | **Uydurma bilgi (ilan sitesi):** telefondan üretilen yetki belgesi no, rastgele "Metro 240 m", "%98 memnuniyet", herkese "Krediye uygun / Kat mülkiyeti", tahmini net alan, gerçek ilanda stok fotoğraf, sabit 3.250 ₺ masraf | Yalnızca girilen bilgi gösterilir; fotoğraf yoksa "Fotoğraf eklenmedi" | Tarayıcı; `emlak-kural.test.js` |
| B2 | **`ensure` gerçek veriye sahte kayıt yazıyordu** (yetki no, yayında ilan, görüntülenme, paket fiyatı) | Yalnızca demo ilanlarına; gerçek kullanıcıda boş başlar | Tarayıcı: işaretsiz veriyle 0 portal kaydı, 0 uydurma no, yetki uyarısı |
| B3 | "Yetki belgesi" ilan başına tutuluyordu; mevzuatta işletmenindir | Ayarlarda yetki belgesi no; ilanda yetkilendirme sözleşmesi ve EİDS | Tarayıcı |
| B4 | Hizmet bedeli tavanı yoktu; gösterme belgesi kirada da satış oranı yazıyordu | %4 ve bir aylık tavan engeli; belge md. 19 alanlarıyla, kimlik no sorulur | Tarayıcı: %2,5 × 2 ve %120 reddedildi |
| B5 | **Kirada ilk ay kendiliğinden "ödendi"**; geçmiş ay borcu izlenmiyordu; tutar ve tarih yoktu; süresi "365 gün" ile bitiyordu | Dönem defteri, kısmi ödeme, makbuz; ilk ay boş başlar; süre kendiliğinden uzar (md. 347) | Tarayıcı: 7.000,50 kısmi, 25.000 reddedildi |
| B6 | Eski kira kayıtlarında hayalî gecikme riski | Kayıtta ödeme izi yoksa geçmiş ay borç sayılmaz | Tarayıcı: eski biçimli 6 kirada gecikme 0 ₺; test |
| B7 | Kira artışı yoktu | TÜFE girilmeden hesaplanmaz, sınır aşılamaz; bildirim belgesi; arsada sınır yok; 5 yıl uyarısı | Tarayıcı: 26.000,01 reddedildi, 26.000 kabul; test |
| B8 | Güvence sınırı yoktu | 3 kira tavanı | Tarayıcı: 60.001 reddedildi |
| B9 | **Sahte başarı:** satışta `yayında` kontrolü hiç eşleşmiyordu, kaldırma yapılmadan "kaldırıldı" yazılabiliyordu | Kod kaldırıldı; 3 gün uyarısı, gecikme sayacı | Tarayıcı |
| B10 | İlan no çakışabilir, il "İzmir" sabitti | Sıralı no, il ayardan | Tarayıcı |
| B11 | Danışman tüm mal sahiplerini, cirolar ve başkasının ilanını görüp düzenleyebiliyordu | Kendi portföyü; mal sahibi gizli; komisyon ve portal kapalı; kullanıcı-danışman bağlantısı | Tarayıcı (simüle edilen rol) |
| B12 | Bağlı kayıt silme ve gösterim çakışması | Talep ve danışman korunur; aynı saat engellenir | Tarayıcı |
| B13 | Binlerce kayıtta yavaşlık | Dizin, sayfalama: portföy 28 ms, kira 157 ms, portal 532 ms, gösterim 11 ms; talepler en kötü durumda 1,1 sn | Tarayıcı (5.000 ilan, 5.000 talep, 9.000 portal kaydı) |
| B14 | Mal sahibi kimliği ilan sitesine sızabilirdi | `omit` genişletildi, ayarlar beyaz listede | Test |

## 4. 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Elle portal kaydı | No, tarih, istatistik; yetkisiz ilan kabul edilmez; kaldırma kaydı | Tarayıcı |
| F2 | İlan uygunluk kartı | md. 14-15 eksikleri ilanda | Tarayıcı |
| F3 | Teklif kaydı | Yeni → iletildi (tarihli) → kabul/red | Tarayıcı |
| F4 | Hakediş ve tahsilat | Danışman payı, tahsil durumu, Excel, işlem iptali | Tarayıcı; Excel dosyası açılmadı |
| F5 | Mal sahibi ekstresi | Tahsilat, yönetim bedeli, net | Tarayıcı (belge oluştu) |
| F6 | Toplu SMS | Geciken kira gerçek sonuç gösterir | Tarayıcı: "2 kira hatırlatması TEST"; ilan eşleşme SMS'i Kod incelendi |
| F7 | Özet | Yetki süresi, aranacaklar, bekleyen işler | Tarayıcı |
| F8 | Fatura | `NS.ebelge.create` | Tarayıcı: e-Arşiv TEST |
| F9 | Fiyat geçmişi | Artışta md. 12/3 uyarısı | Tarayıcı |

**Yapılmadı:** ortak portföy paylaşımı (md. 18), arayan tanıma, yapay zekâ metni, stopaj hesabı (mevzuat aranmadı).

## 5. Kalite kapısı
- `emlak-kural.test.js` geçti; `npm test` için `package.json`'a eklenmesi gerekir. Diğer sunucu testleri geçti, `cloud.test.js` istenmediği için çalıştırılmadı.
- Tarayıcı: ana akışlar baştan sona, konsol hatası yok; 375 px'te 11 ekran ve ilan sitesinde yatay taşma yok; boş liste ve koyu tema görüldü.
- **Denenmedi:** bulut modu, gerçek kâğıt çıktı, gerçek PIN ile danışman girişi (rol `NS.currentUser` değiştirilerek denendi), danışmanın kenar menüsü.
- İki değişiklik varsayılan görünümü etkiler: eski işlemler "Bekliyor" tahsilat görünür, örnek fotoğraflar gerçek ilanlardan kalkar.
- Statik dosya değişti: `sw.js` sürümü birleştirme sırasında artırılmalı.

## Portal tohumu bulut belgesine yazmıyor (31.10.2026)

**Sorun:** `apps/emlak/portal.js` `ensure()` gerçek işletmede de üç portalı `connected: true` yazıyordu. `CLAUDE.md` §1'e aykırı.

**Yapılan:**
- `ensure()` bulutta (`db.cloud`) hiçbir şey yazmaz. Demo ve yerel aynen kaldı, yerelde üç portal yine bağlı başlar.
- `portalCfg`, `portalListings` bulutta kullanıcı portal bağlayana kadar yoktur. Bağlı portal yokken "Bağlı portal yok" görünür, ilan listesi boşsa "Gösterilecek ilan yok" yazar.
- Portal tablosu bağlı olmayan portalı da satır olarak gösterir ("Bağlı değil"). Eskiden tablo yalnız bağlı portalları listelediği için bağlantıya ulaşılamazdı. Bağlarken mağaza no zorunlu.
- Doping bağlı portal yokken kırılmaz, kredisi girilmemiş portalda "undefined kredi" yazmaz.
- `draw()` bulutta `db.load()` çağırmaz. Bu çağrı gönderilmemiş kaydı sildiği için bulutta bu ekrandaki işlemler kayboluyordu.

Kanıt: `server/test/kanal-tohum.test.js` (üç programda 29 senaryo, eski kodda her programın ilk senaryosunda kırılır). Tarayıcı: gerçek sunucu, MariaDB ve başsız Chrome ile 22 denetim geçti. Yeni bulut hesabı, ilk açılış, yeniden açılış, arayüzden bağlama, 375 px, koyu tema, `?demo=1`; konsol hatası yok.

Daha önce tohumlanmış bulut belgeleri otomatik düzeltilmedi; düzeltme kararı işletme bazında verilmeli. Şu kayıtlar tohumdan gelmiş olabilir, bu kurallar kod incelemesine dayanır, gerçek müşteri belgesinde denenmedi: `storeNo` alanı olmayan `portalCfg.<portal>.connected = true` kayıtları. Kullanıcı ayar girmiş olabilir, bu yüzden silinmesi güvenli değildir. Yerel kipte üç portalın bağlı başlaması bilerek korundu.
