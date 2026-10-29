# Kargo & Kurye — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı dalgaları önceden onayladı. **1. dalga tamamlandı.** 2. ve 3. dalga sırada.

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
