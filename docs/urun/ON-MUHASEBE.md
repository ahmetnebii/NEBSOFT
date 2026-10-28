# Ön Muhasebe — Ürün Spesifikasyonu (onay bekliyor)

Tarih: 29.10.2026 · Dal: `muhasebe/urun-spec` · Yöntem: `CLAUDE.md` §2

**Senden istenen:** §5'teki dalga planını onaylaman. İstemediğin maddenin üstünü çiz veya "çıkar" yaz, eklemek istediğin bir şey varsa yaz.
Onaydan sonra 1. dalgaya başlarım.

---

## 1. Kaynaklar

**Rakiplerin herkese açık özellik sayfaları** (28–29.10.2026'da okundu; yalnızca hangi ihtiyacı karşıladıklarına bakıldı, metin, tasarım ya da kod alınmadı):

| Kısaltma | Ürün | Sayfalar |
|---|---|---|
| **P** | Paraşüt | `parasut.com/on-muhasebe-programi`, `/cari-hesap-programi`, `/on-muhasebe-raporlari`, `/stok-ve-depo-takip-programi`, `/yapay-zeka-ozellikleri`, `/online-tahsilat-programi` |
| **B** | Bizim Hesap | `bizimhesap.com/ozellikler/fatura-takibi`, `/nakit-yonetimi`, `/raporlar`, `/cari-hesap-takibi` ve ana sayfa menüsü |
| **K** | KolayBi | `kolaybi.com/kolay-on-muhasebe-programi`, `/fatura-kesme-programi`, `/gelir-gider-takip-programi`, `/on-muhasebe-raporlama-programi` ve ana sayfa menüsü |
| **L** | Logo İşbaşı | `isbasi.com/cari-hesap-takibi`, `/gelir-gider-takibi` ve ana sayfa menüsü |

**Kullanıcı şikâyetleri:** Şikâyetvar → `sikayetvar.com/parasut`, `/bizim-hesap`, `/logo-isbasi` (29.10.2026, ilk sayfadaki başlıklar).

**Bizim durumumuz:** 19 ekranın tamamı tarayıcıda otomatik gezildi (konsol hatası çıkmadı). Ana ekranlar telefon genişliğinde (375 px) denendi. Kod incelendi.

---

## 2. Bulunan hatalar ve riskler (hepsi 1. dalgada düzeltilecek)

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Kuruş farkı:** Program toplamı yuvarlamadan toplayıp en sonda yuvarlıyor, e-Fatura (UBL) satır satır yuvarlıyor. Rastgele denemede program 893,55 ₺ iken giden e-Fatura 893,54 ₺ çıktı. | Kod + otomatik deneme | Cari bakiye ile resmî fatura tutmaz. Rakiplerde de şikâyet konusu (P: "Fatura tutarları 0,01 TL eksik"). |
| H2 | **Telefonda yeni fatura ekranı bozuk:** "Cari" seçimi çok daralıyor, tarih alanları ve kalem tablosu taşıyor. | 375 px tarayıcı denemesi | Telefondan fatura kesmek zor. |
| H3 | **İade faturası yok:** Belge türleri arasında iade yok. Kodda `kind === 'iade'` kontrolü var ama bu tür hiç oluşturulamıyor. e-Fatura'da iade için iade edilen faturanın numarası da gönderilmiyor. | Kod | Satış iadesi resmî olarak düzenlenemiyor. |
| H4 | **%0 KDV ve tevkifat:** Kalemde istisna kodu seçilemiyor; %0 KDV'li fatura entegratöre gönderilirken hata veriyor. KDV tevkifatı hiç yok (Paraşüt API'sinde `vat_withholding_params`, GİB paketinde `TEVKIFAT.xml` örneği var). | Kod + resmî doküman | İhracat, istisnalı satış ve tevkifatlı hizmet faturaları kesilemiyor. |
| H5 | **Eski kayıtlarda ilçe/il eksik:** Yeni kurala göre e-Fatura için ilçe ve il zorunlu, ama mevcut carilerde bu alan boş olabilir. | Kod | Kullanıcı fatura gönderirken ilk kez hata görür. Önceden uyarılmalı ve toplu tamamlanabilmeli. |
| H6 | **Yalnızca 2 rol** (Yönetici, Satış). Ayrıntılı yetki ve işlem geçmişi ekranı yok; arka planda kayıt tutuluyor ama görülemiyor. | Kod | Rakip şikâyetlerinde "eski çalışan hesaba erişmeye devam etti" geçiyor. |
| H7 | **Raporlarda tarih aralığı yok:** yalnızca yıl seçilebiliyor. | Ekran gezintisi | P'nin SSS'inde açıkça sorulan bir ihtiyaç. |
| H8 | **e-Belge arşivi dışarı alınamıyor:** toplu XML/PDF indirme yok. | Kod | B'de "yıllık XML indirme sorunu" şikâyeti var. Veri kullanıcınındır; her an tamamı indirilebilmeli. |

---

## 3. Özellik karşılaştırması

**Bizde:** ✅ var · 🟡 kısmen · ❌ yok
**Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Fatura ve teklif
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Satış/alış faturası, iskonto, dövizli fatura, barkodla satır ekleme | ✅ | P B K L | O |
| Teklif → sipariş → irsaliye → fatura zinciri, irsaliyeden toplu fatura | ✅ | P K | O |
| İade faturası | ❌ (H3) | — | O |
| İstisna kodu, KDV tevkifatı | ❌ (H4) | P (API) | O |
| Fatura kopyalama ("benzerini oluştur") | ❌ | K ("şablonla dakikalar içinde") | E |
| **Tekrarlayan fatura** (her ay otomatik: kira, abonelik, bakım) | ❌ | — | E |
| Çoklu seçimle toplu işlem (tahsil et, e-Fatura gönder, yazdır) | ❌ | B ("birden fazla faturayı aynı anda") | E |
| Proforma fatura (PDF) | ❌ | P'de eksikliği şikâyet konusu | E |
| Vade hatırlatma (otomatik SMS / e-posta / WhatsApp) | ❌ | K ("tahsilatı hızlandırın") | E |
| PDF'i e-postaya ek olarak gönderme | 🟡 (yalnızca metin) | P K | E |
| Online tahsilat linki (kartla ödeme) | ❌ | P K B | E — sanal POS hesabı gerekir (§6) |

### Cari
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Müşteri/tedarikçi, bakiye, ekstre, mutabakat, alacak yaşlandırma | ✅ | P B L | O |
| Excel'den toplu cari aktarımı + açılış bakiyesi | ❌ | L ("Excel'den toplu cari kart aktarımı"), K ("geçiş") | O (başka programdan geçiş için) |
| Kategori/etiket (bölge, segment) | ❌ | L ("kategorilendirin") | E |
| Risk (borç) limiti ve aşılınca uyarı | ❌ | — | E |
| En çok kazandıran müşteriler | ❌ | P | E |
| **Cari portalı:** müşteri kendi ekstresini ve faturalarını linkten görür, mutabakatı tek tıkla onaylar | ❌ | — | F |

### Stok
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Kart, barkod, kritik stok, çoklu depo, transfer, sayım, hareketler | ✅ | P B K | O |
| Excel'den toplu ürün aktarımı | ❌ | — | O (geçiş için) |
| Fiyat listeleri (bayi / perakende / döviz) | ❌ | — | E |
| Çoklu birim (koli = 12 adet) | ❌ | — | E |
| Stok raporu (değer, devir hızı, ölü stok) | 🟡 (yalnızca değer) | P K | E |

### Kasa, banka, gider
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Gelir/gider/virman, hesaplar, gider kategorileri, çek/senet | ✅ | P B K L | O |
| **Banka ekstresi içe aktarma** (Excel/CSV) + faturalarla otomatik eşleştirme | ❌ | P K B (API ile) | E — dosyayla yapılırsa banka hesabı gerekmez |
| Ödeme takvimi ve alarm (vergi, SGK, kira, çek vadesi) | 🟡 (beyan takvimi var) | K ("ödeme günlerine alarm kurun") | E |
| Kredi kartı hesabı, kredi/taksit takibi | ❌ | B | E |
| Fişin fotoğrafından gider kaydı | ❌ | P (yapay zekâ ile) | F — servis seçimi gerekir (§6) |

### Raporlar
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Aylık kâr-zarar, KDV, yaşlandırma, gider dağılımı, KDV beyan taslağı, Ba/Bs | ✅ | P K | O |
| Tarih aralığı seçimi (H7) | ❌ | P | O |
| Satış raporu (ürün / müşteri / satış temsilcisi) | ❌ | P B | E |
| **Nakit akışı** (geçmiş + gelecek 30/60/90 gün tahmini) | ❌ | P B | E |
| Tahsilat/ödeme, kasa-banka raporları | ❌ | P | E |
| Dönem karşılaştırma (bu ay / geçen ay / geçen yıl) | ❌ | K | E |
| Özelleştirilebilir ana sayfa (kartları seç, sırala) | ❌ | — | F |

### e-Belge
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| e-Fatura/e-Arşiv (Uyumsoft, Paraşüt), resmî görünüm, tasarım + logo | ✅ (bu turda) | P B K | O |
| Toplu XML/PDF arşiv indirme (H8) | ❌ | — | O |
| e-SMM, e-İhracat, e-İrsaliye | ❌ | P K B | E — entegratör desteği gerekir (§6) |

### Genel / güven
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Yedek alma/geri yükleme, Excel'e aktarma, sütun gizleme, geri alma, modül gizleme, belge şablonları, PWA (telefon) | ✅ | — | O |
| Ayrıntılı yetki (ekran bazında görme/ekleme/silme, tutar görme) + işlem geçmişi ekranı (H6) | ❌ | — | O |
| İlk kurulum sihirbazı (işletme bilgisi → hesaplar → açılış bakiyeleri → e-Fatura) | ❌ | K ("anahtar teslim kurulum") | E |
| Ekran içi yardım ("bu ne işe yarar?") | 🟡 (destek kutusu var) | P L (kılavuz/video) | E |
| Proje/etiket bazında kârlılık | ❌ | B K | F |
| Çoklu şube | ❌ | B | F |
| Akıllı uyarılar (aynı fatura iki kez girilmiş olabilir, risk limiti, kritik nakit) | ❌ | — | F |

---

## 4. Şikâyetlerden çıkan "güven" kuralları
Rakiplerin kullanıcıyı en çok kızdırdığı konular ve bizdeki karşılıkları:
1. **Tutarlar her yerde aynı:** program, PDF ve e-Fatura kuruşu kuruşuna eşit olacak. Bunun için otomatik test eklenecek (H1).
2. **Veri kullanıcınındır:** tüm veri ve e-Belge arşivi her an tek tıkla indirilebilecek (H8).
3. **Ayrılan çalışan erişemez:** kullanıcı pasife alınınca anında kilitlenecek, her işlem kayıt altında olacak (H6).
4. **Sessiz hata yok:** bir şey gönderilemezse kullanıcı nedenini ve ne yapacağını görecek (bu turda e-Belgede yapıldı, tüm modüllere yayılacak).
5. **Kesinti olsa da iş durmaz:** internet yokken fatura taslağı kaydedilebilecek, bağlantı gelince gönderilecek (çekirdekte çevrimdışı kuyruğu var, faturaya bağlanacak).

---

## 5. Dalga planı (onay bekliyor)

| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H8; Excel'den cari/ürün/açılış bakiyesi aktarımı |
| **2 — Beklenenler** | Tekrarlayan fatura, kopyalama, toplu işlem, proforma, vade hatırlatma, PDF eki; cari etiket ve risk limiti; fiyat listeleri, çoklu birim; banka ekstresi içe aktarma + eşleştirme; ödeme takvimi; satış, nakit akışı, tahsilat, kasa-banka ve stok raporları, dönem karşılaştırma; ilk kurulum sihirbazı, ekran içi yardım |
| **3 — Fark yaratanlar** | Cari portalı (link + mutabakat onayı), özelleştirilebilir ana sayfa, proje/etiket kârlılığı, akıllı uyarılar, çoklu şube |

Her dalga `CLAUDE.md` §3'teki kalite kapısından geçer: testler, tarayıcı denemesi, telefon görünümü, büyük veri. Sonunda sana denemen için bir özet sunulur.

---

## 6. Sağlayıcı / karar gerektirenler (dalgaları engellemez, sırası gelince sorulur)
- **Online tahsilat linki:** iyzico / PayTR vb. sanal POS hesabı ve resmî API dokümanı.
- **Banka API'leri:** banka veya açık bankacılık sağlayıcısı. Dalga 2'deki dosyadan içe aktarma bunu beklemez.
- **e-SMM / e-İhracat / e-İrsaliye:** entegratörün bu servisleri sunması ve resmî dokümanı.
- **Fişin fotoğrafından gider, yapay zekâ asistanı:** hangi servisin kullanılacağı ve maliyet kararı.
- **Dövizli fatura kuru:** mali müşavir görüşü (`docs/MUHASEBE-DOGRULAMA-RAPORU.md` B3).
