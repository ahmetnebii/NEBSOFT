# Kargo & Kurye — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1., 2. ve 3. dalga yapıldı; ilk bölümdeki engeller kaldırılmadan canlıya çıkılamaz.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Kargo firması gönderi API'leri** (Yurtiçi, Aras, MNG/DHL, Sürat, PTT, HepsiJET): resmî doküman yok — DOĞRULANAMADI. Firmanın panelinde oluşturulur, takip numarası elle girilir. Simülasyon referansı kabul edilmez.
- **GPS / araç takip:** sağlayıcı ve resmî doküman yok; konum gösterilmez.
- **e-Fatura / e-Arşiv:** gerçek sağlayıcıyla denenmedi. Kurumsal aylık fatura tarayıcıda TEST sonucu verdi (`auto` seçimi simülasyonda e-Arşiv döndü); mükellef sorgusu gerçek hesapla denenmeli.
- **Gönderi ücreti KDV oranı %20** (hafızadan, doğrulanmadı): mali müşavir onayı gerekir.
- **Kurye primi:** yalnızca teslim × birim tutar. Bordro, vergi, SGK hesabı yoktur.
- **Teslim fotoğrafı:** tarayıcı deposunda; yoğun kullanımda dosya deposu gerekir (Ç7).

## 2-3. dalga — yapılanlar (30.10.2026)
Kanıt: **Tarayıcı** = başsız Chrome'da sayfa gerçekten çalıştırıldı (`?demo=1`); **Test** = otomatik test; **Kod incelendi** = çalıştırılmadı.

### Kırık temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| K8 | **Kişisel veri sızıntısı:** takip numarasını bilen herkes hareket notlarında teslim alanın adını, teslim konumunu ve personel adını görüyordu | Bulut görünümü notları süzer, personel adı gitmez; kanıt yalnızca var/yok. Süzülmüş geçmişle yeniden teslimat isteği çalışmaya devam eder | `kargo-kural.test.js` (6) |
| K9 | Bulutta takip sayfası "teslim kanıtı" satırını hiç gösteremiyordu (konum alanı gönderilmiyor) | `proof` alanı | `kargo-kural.test.js`; sayfa: Kod incelendi |
| K10 | Anlaşmalı firma teslim edince kapıda tahsilat hiçbir yere yazılmıyordu; aktarılan gönderi zimmet havuzunda kalıyordu | Tutar firmadan alınacak olarak mutabakata düşer ("Anlaşmalı kargo"), havuza girmez; elle "Firma teslim etti" | Kod incelendi |
| K11 | Boş ölçü desiyi `NaN` yapıyordu; eksik telefon, eksi tutar kabul ediliyordu; cari seçilince ödeyen değişmiyordu | Denetimler; cari seçilince ödeyen "cari" | Kod incelendi |
| K12 | Takip numarası saniyede çakışabiliyordu | Sayaç + benzersizlik denetimi | Tarayıcı: aynı anda açılan numaralar farklı |
| K13 | KT ödemesi kim, ne kadar, nasıl kaydı tutmuyordu | Yöntem, dekont no, tutar kaydı ve döküm | Tarayıcı: 20.100 ₺ |
| K14 | Kuryede "üzerimdeki KT" alıcı ödemeli ücreti saymıyordu; kasa hesabında havale nakit sayılıyordu | Kuryedeki toplam para; havale nakitten ayrıldı | Tarayıcı (beklenen 500 ₺), Kod incelendi (havale) |
| K15 | Hareketli cari ve kurye silinebiliyordu | Silme kısıtı | Tarayıcı: cari silinmedi. Kurye: Kod incelendi |
| K16 | Aylık fatura yalnızca içinde bulunulan ay kesilebiliyordu, peşin gönderi "bu ay tutar"a giriyordu | Dönem seçimi (bu ay, geçen ay); tutarlar yalnızca cari ödemeli | Tarayıcı: 64 gönderi 14.320,17 ₺ TEST |
| K17 | Kabul personeli fatura kesebiliyordu | Fatura yalnızca yöneticide | Tarayıcı (rol sayfada taklit edilerek); PIN girişiyle denenmedi |
| K18 | Müşteri × gönderi taraması | Tek geçiş | Tarayıcı: 6.000 gönderi, 300 cari: gönderiler 103 ms, cariler 102 ms, mutabakat 31 ms, raporlar 27 ms |

### 2. dalga — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Kurumsal fatura ve ekstre | Dönemli fatura, açık fatura tutarı, ödendi kaydı (TEST fatura ödenemez), `NS.docs` döküm | Tarayıcı |
| B2 | Excel'den toplu gönderi | Başlık eşleştirme, ücret ve bölge seçimi, tekrar referans atlanır, özet, toplu etiket | Tarayıcı (`NS.readSheet` taklit edilerek): 2 açıldı, 1 tekrar, 1 hatalı; gerçek dosyayla denenmedi |
| B3 | E-ticaret'ten gönderi alma | Doğrudan bağ yerine dosya: E-ticaret "Kargo listesi" → bu ekrandan aktarım. Bulutta da çalışır, takip no E-ticaret'e geri yazılmaz | E-ticaret tarafı Kod incelendi; aynı sütunlar Tarayıcı |
| B4 | Yeniden teslimat | Alıcının istediği gün gelince gönderi zimmet havuzuna düşer, "Yeniden teslimat" rozeti; isteğe bağlı dağıtım SMS'i (`NS.smsBatch`) | Kod incelendi |

### 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Rota önerisi | Aynı gün/ekspres, istenen gün, kurye bölge sırası, adres; elle yukarı alma. **Harita mesafesi yok:** gönderide koordinat yok | Tarayıcı: sıra değişti, dağıtım listesi aynı sırayla |
| F2 | Kurye primi | Kurye veya genel birim tutar, aylık tablo, `NS.docs` döküm | Tarayıcı |
| F3 | Şube raporu | Ayarda şube listesi, kabulde seçim, gönderi/ciro/teslim başarısı/KT; eski kayıt göndericinin ilçesi | Tarayıcı (şube tanımsız hali); şubeli kabul: Kod incelendi |

Kalite kapısı: 10 ekran konsol hatasız; 375 px koyu temada 9 ekran taşmasız; boş liste görüldü. Uçtan uca: Excel → zimmet → kurye → imzalı teslim → kasa → göndericiye ödeme. Kamera, konum izni ve kâğıt çıktısı denenmedi.

Tarih: 29.10.2026 · Dal: `claude/urun-eticaret-uretim-38c2a2` · Yöntem: `CLAUDE.md` §2 · Program: `apps/kargo` (operasyon paneli `index.html`, alıcı takip sayfası `takip.html`)
Hedef kullanıcı: şehir içi kurye / bölgesel kargo işletmesi (gönderi kabul eden, kendi kuryesiyle dağıtan, şehir dışını anlaşmalı firmaya aktaran).

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| K1 | Kurye konumu | Uydurulmuyor; servis kapalı/simülasyonsa açık uyarı | Tarayıcı: "Araç takip (GPS) bağlantısı kapalı" |
| K2 | SMS sonucu | Gerçek sonuç yazılıyor (gönderildi / TEST / gönderilmedi + neden) | Kod |
| K3 | Anlaşmalı kargo takip no | Simülasyon referansı kabul edilmiyor; firmanın verdiği numara elle giriliyor | Kod |
| K4 | Ücret ve fatura | Kabulde "ücreti kim öder" (peşin nakit/kart/havale, kurumsal cari, alıcı öder); alıcı ödemeli ücret kurye kasasına giriyor; gönderi başına e-Arşiv; kurumsala aylık toplu fatura (VKN zorunlu, aynı ay ikinci kez kesilmez, TEST yeniden kesilebilir); KDV oranı ayarda (varsayılan %20, doğrulanmadı) | Tarayıcı: alıcı ödemeli 140 ₺ + KT 500 ₺ = 640 ₺; kurumsal 61 gönderi tek e-Arşiv (TEST) |
| K5 | Teslim kanıtı | İmza + konum (izin verilirse) + isteğe bağlı fotoğraf (480 px'e küçültülür); "edilemedi"de de konum; sipariş detayında harita bağlantısı; takip sayfasında "teslim kanıtı kayıtlı" | Tarayıcı (pane konuma izin vermedi → "konum alınamadı" yazıldı) |
| K6 | Kasa sayımı | "Say ve teslim al": beklenen nakit/kart, sayılan tutar, fark ve açıklama zorunlu; "Kurye teslim kayıtları" tablosu | Tarayıcı: 640 beklenen / 100 sayılan → −540 fark kaydı |
| K7 | İade önerisi, telefon | 3. başarısız denemede "İade önerilir"; telefonda gönderi kart listesi | 375 px |

Not: teslim fotoğrafları tarayıcı deposunda tutulur; yoğun kullanımda dosya deposu gerekir (`CEKIRDEK-ISTEKLERI-eticaret-uretim.md` Ç7).

---

## 1. Kaynaklar
Kurye işletmesine yönelik Türk yazılımlarının herkese açık özellik sayfası bu turda bulunamadı (arama sonuçları gönderen tarafı anlatıyor). Bu yüzden ihtiyaçlar gönderen tarafı ve şikâyetlerden çıkarıldı (29.10.2026):

| Kaynak | Çıkan ihtiyaç |
|---|---|
| `ideasoft.com.tr/kapida-odeme-sistemi-ve-avantajlari/`, `birfatura.com/kapida-odeme-uygulamasinin-avantaj-ve-dezavantajlari/` | Kapıda tahsilatta sözleşme: tahsilat türü (nakit/kart), komisyon, aktarım süresi (genelde 3–7 iş günü); ödenmeyen gönderide iade ve kesinti |
| `birfatura.com/ofis-kargo-entegrasyonu/` | Gönderenin istediği: durumun anlık görünmesi, takip numarasının mağazaya otomatik eklenmesi, kapıda ödeme mutabakat raporu |
| `memurlar.net/haber/1163382/...` | Kayıt dışı nakit tahsilat riski → her tahsilatın kaydı ve makbuzu |

**Şikâyetler** (Şikâyetvar, 29.10.2026): `sikayetvar.com/ptt-kargo/ptt-kargo-teslim-edildi-gorunmesine-ragmen-aliciya-ulasmadi`, `/surat-kargo/teslim-edildigi-gosterilen-kargo-gercekten-aliciya-ulasmadi`, `/trendyol-express/kapiya-teslim-edildi-olarak-gorunen-kargo-bulunamadi-...`, `/cargo-x/acil-kargo-teslim-edilemedi-olarak-isaretlendi-ama-kapiya-gelmedi` → **en sık şikâyet: "teslim edildi" görünen ama ulaşmayan gönderi** ve "kapıya gelmeden edilemedi işaretlemek".

**Bizim durumumuz:** 11 ekran + takip sayfası gezildi, kod incelendi. Kargo firması gönderi API'leri (Yurtiçi, Aras, MNG, Sürat, PTT, HepsiJET) `docs/ENTEGRASYON-RAPORU.md`'de "açık resmî doküman yok, sözleşme gerekir" → DOĞRULANAMADI; yalnızca takip sayfası bağlantısı var. Bu durum değişmedi.

---

## 2. Bulunan hatalar ve riskler (1. dalga)
| # | Sorun | Etkisi |
|---|---|---|
| K1 | **Uydurma kurye konumu:** GPS servisi simülasyondaysa kurye konumları rastgele üretilip haritada gösteriliyor. | Operasyon yanlış kuryeye iş verir. `CLAUDE.md` §1 ihlali. |
| K2 | **"Alıcıya SMS gönderildi"** her zaman yazıyor (SMS kapalı/simülasyon olsa da). | Alıcı bilgilendirildi sanılır. |
| K3 | **Anlaşmalı kargoya aktarımda sahte takip no:** kargo bağlantısı simülasyondaysa dönen iç referans (`KAR…`) takip numarası olarak kaydediliyor. | Alıcı geçersiz numarayla takip eder. |
| K4 | **Gönderi ücretinin tahsilatı ve faturası yok:** bireysel gönderide ücretin alınıp alınmadığı, kurumsalda aylık faturanın kesilip kesilmediği izlenmiyor; e-Arşiv/e-Fatura bağlantısı yok. | Gelir kaçağı; yasal belge eksik. |
| K5 | **Teslim kanıtı zayıf:** yalnızca imza; teslim anının konumu ve fotoğrafı yok. "Teslim edilemedi" işaretinde de konum yok. | Şikâyetlerin 1 numarası ("teslim edildi görünüyor ama gelmedi") cevaplanamaz. |
| K6 | **Kapıda tahsilat mutabakatında sayım yok:** "Teslim aldım" kuryeden sayılan tutarı sormuyor; eksik/fazla görünmüyor. | Kasa açığı fark edilmez. |
| K7 | **Çok denemede iade önerisi yok;** telefonda gönderi listesi yatay kayıyor. | Paket depoda unutulur; sahada liste okunmaz. |

---

## 3. Özellik karşılaştırması
**Bizde:** ✅ / 🟡 / ❌ · **Sınıf:** O / E / F

| Özellik | Bizde | Sınıf |
|---|---|---|
| Gönderi kabul, desi/kg, tarife kademeleri, kurumsal indirim, etiket + QR takip | ✅ | O |
| Bölgeye göre zimmet, dağıtım listesi, kurye ekranı (ara, yol tarifi, teslim/edilemedi) | ✅ | O |
| Alıcı takip sayfası (telefon son 4 hane doğrulaması, teslimat tercihi, puan) | ✅ | O |
| Ücret tahsilatı ve fatura (K4) | ❌ | O |
| Teslim kanıtı: imza + konum + fotoğraf (K5) | 🟡 (imza) | O (şikâyet) |
| KT mutabakatında sayım farkı (K6) | ❌ | O |
| Kurumsal müşteriye aylık fatura (e-Fatura/e-Arşiv) ve ekstre | 🟡 (döküm yazdırma) | E |
| Kurumsal müşterinin Excel'den toplu gönderi yüklemesi | ❌ | E |
| Gönderen için e-ticaret entegrasyonu (E-ticaret programından otomatik gönderi) | ❌ | E |
| Teslim edilemedi → alıcıya otomatik yeniden teslimat bağlantısı | 🟡 (SMS'te takip linki) | E |
| Dağıtım sırası önerisi (rota) | 🟡 (ilçe sırası) | F |
| Kurye hakedişi (paket başı prim) | ❌ | F |

---

## 4. Güven kuralları
1. **Teslim kanıtsız teslim olmaz:** imza zorunlu; konum ve fotoğraf (izin verilirse) kayda girer, takip sayfasında "teslim kanıtı var" görünür.
2. **Para izi:** gönderi ücreti ve kapıda tahsilat her adımda kim/ne zaman/ne kadar kaydıyla; mutabakatta fark gösterilir.
3. **Uydurma veri yok:** konum, takip no, SMS sonucu yalnızca gerçek kaynaktan.

---

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | K1–K7 |
| **2 — Beklenenler** | Kurumsal aylık e-Fatura + ekstre, Excel'den toplu gönderi, E-ticaret programından gönderi alma (aynı cihazda), "edilemedi" sonrası otomatik yeniden teslimat bağlantısı |
| **3 — Fark yaratanlar** | Rota önerisi, kurye primi/hakedişi, şube bazında rapor |

## 6. Karar / hesap gerektirenler
- **Kargo firması gönderi API'leri** (Yurtiçi, Aras, MNG/DHL, Sürat, PTT, HepsiJET): sözleşme + test hesabı + resmî doküman. O zamana kadar aktarım "firmanın panelinde oluştur, takip no gir" ile yapılır.
- **GPS / araç takip sağlayıcısı:** hangi servis; resmî API dokümanı.
- **Gönderi ücretinin KDV oranı:** varsayılan %20 (hafızadan, doğrulanmadı) — mali müşavir onayı; ayarlardan değiştirilebilir.
