# Mobilya atölyesi / özel imalat yazılımı — pazar araştırması

Erişim tarihi (hepsi): 2026-10-30. Kod yazılmadı. Rakip metni kopyalanmadı; yalnız karşılanan ihtiyaç çıkarıldı.

## CANLIYA ÇIKMAYI ENGELLEYENLER / KULLANICIYA SORULACAKLAR
1. **Kapora/ön ödeme**: 6502 sayılı Kanun metninde (mevzuat.gov.tr PDF) genel bir "kapora" maddesi bulunamadı; kapora/cezai şart hükümleri Türk Borçlar Kanunu'ndadır ve bu araştırmada resmî kaynaktan **okunmadı** → DOĞRULANAMADI. Yazılımda "kapora iade edilmez" gibi sabit bir ifade/otomasyon, hukukçu onayı olmadan konmamalı.
2. **Satış Sonrası Hizmetler Yönetmeliği ek listesindeki "17 Ahşap ve metal mobilyalar" kullanım ömrü (10 yıl?)**: mevzuat.gov.tr PDF'i indirildi ama tablo metne düzgün dönmedi; 10 yıl değeri yalnız arama özetinde göründü → DOĞRULANAMADI. Garanti belgesine/uyarıya yazılmadan önce resmî tablodan elle doğrulanmalı.
3. Özel imalatta "ürünün **kendisini** satan atölye üretici mi, satıcı mı?" sorusu (garanti belgesi düzenleme yükümlülüğü m.56 üreticiye ait; verilmesi satıcıya ait) hukukçuyla netleşmeli.
4. Hiçbir ürünün canlı denemesi yapılmadı (yalnız herkese açık sayfalar okundu).

---

## (a) İncelenen ürünler

| Ad | URL | Tarih | Karşılanan ihtiyaçlar | Fiyat modeli |
|---|---|---|---|---|
| ÖzgürKod Mobilya CRM / Montaj CRM | https://ozgurkod.com/cozumler/mobilya , https://ozgurkod.com/cozumler/mobilya-montaj | 2026-10-30 | Keşif randevusu, ölçü formu + duvar krokisi (her ölçü ayrı sürüm); bağlantıyla gönderilen teklif, müşteri onayı/imzası → otomatik sipariş; teklif kalemlerinden atölye iş emri, aşama/sorumlu, malzeme ihtiyacı; montaj ekibi×gün planı, imzalı teslim tutanağı, eksik/hasar için servis kaydı; kapora/ödeme planı/senet izleme, vadesi gelene görev; telefon uyumlu panel, ekip uygulaması (çevrimdışı, koli sayımı, fotoğraf); WhatsApp/Instagram gelen kutusu | Aylık 2.500 TL'den; kurulum ücreti yok; 7 gün deneme (satıcı beyanı) |
| Mobilya Takip | https://www.mobilyatakip.com/ | 2026-10-30 | Teklif kaydı (aynı müşteriye farklı fiyatı önleme), SMS ile gönderme; siparişi üreticiye iletme; SSH (satış sonrası hizmet) takibi + formu; teslimat planı, depo kabul, teslimat fotoğrafı; stok/rezerv; cari-tahsilat bakiyesi; sevkiyat sonrası memnuniyet anketi; ay sonu kâr-zarar. Sayfada **ölçü, üretim, montaj modülü yok** (mağaza/bayi odaklı) | Yıllık abonelik, modüle göre, fiyat sayfada yok; yıllık TÜFE artışı; sınırsız kullanıcı; 1 ay deneme; 3 taksit |
| Delbig (Mobilya CRM / sipariş takip) | https://delbig.com/cozumler/mobilya-sektoru/mobilya-siparis-takip-programi/ | 2026-10-30 | Teklif → sipariş → sevkiyat tek akış; her satırın stok/üretim/tedarikçiden karşılanması; tedarikçi termin takibi; sipariş durumları (ödeme bekleniyor, üretimde, sevke hazır, teslim); müşteri kaydında teklif/not/WhatsApp/revizyon geçmişi; bayi portalı, MRP, API ek modül. Mağaza/üretici ağırlıklı, ölçü-montaj ekibi yok | Paket + ek modül + kullanıcı seçimiyle yıllık hesap; sabit liste sayfada yok (https://delbig.com/fiyatlar/ okunmadı) |
| ADeko (mutfak çizim programı) | https://www.cizimci.com/adeko_programi.php | 2026-10-30 | Yalnız arama özetinden: mutfak/ölçü-çizim, projeden teklif adımı. Sayfa açılamadı (bağlantı koptu) → özellikleri ve "45.00" lisans değeri DOĞRULANAMADI | DOĞRULANAMADI |
| Dekostil (iPad uygulaması, tek firmaya özel) | https://apps.apple.com/mx/app/dekostil/id6443469301 | 2026-10-30 | Sipariş onay/iptal, proje randevusu, ölçü ve montaj kaydı + fotoğraf. Ürün değil, tek işletmenin uygulaması; yorum/puan yok. Sürüm 1.2.2 (25/07/2024) | Ücretsiz |

Yalnız arama özeti, sayfası okunmadı (özellik iddiası DOĞRULANAMADI): Workcube eFurniture (kurumsal ERP), Blum Teowin (https://www.blum.com/tr/tr/services/industrial-production/cad-cam-interface/software-partners/teowin/ — CAD/CAM, donanım entegre).

Boşluk (kanıt): bakılan 3 CRM ürününün hiçbirinde **birlikte** ölçü + çizim onayı + kesim listesi/üretim + kapora + montaj + garanti/SSH yok; ÖzgürKod en geniş olanı ama kendi sayfasında sınırları belirsiz (ör. kesim listesi/CNC yok).

## (b) Özellik önerisi

**Olmazsa olmaz**
- Ölçü kaydı: tarih, ölçüyü alan kişi, oda krokisi/fotoğraf, sürümlü (her yeni ölçü yeni sürüm); müşteriye onaylatma. — Dayanak: ÖzgürKod sayfası + şikâyet teması 3 (ölçü hatası).
- Teklif kalemli, PDF/bağlantı, müşteri onayı (imza/OTP) ve onaylanan sürümün **dondurulması**. — ÖzgürKod, Mobilya Takip; tema 9 (fiyat farkı).
- Sözleşmede **yazılı teslim tarihi** ve kapora/ara ödeme/kalan planı; her tahsilat makbuzlu (NS.docs). — Tema 1, 2, 9; Mevzuat: 6502 m.8/3 (süresinde teslim edilmeme sözleşmeye aykırılık).
- Sipariş durumları: ölçü → teklif → onay/kapora → üretim → boyama/hazır → sevk → montaj → teslim tutanağı. — Delbig/ÖzgürKod.
- Montaj ekibi×gün planı + imzalı teslim/eksik-hasar tutanağı + fotoğraf. — ÖzgürKod; tema 4, 5.
- Teslim sonrası satış sonrası/ayıp kaydı (tarih, ne, çözüm, süre); teslim tarihinden 6 ay (ispat karinesi) ve 2 yıl (zamanaşımı) sayacı. — Mobilya Takip SSH; 6502 m.10, m.12.
- Garanti belgesi çıktısı (ahşap/metal mobilya 2 yıl, teslim tarihinden başlar). — Garanti Belgesi Yönetmeliği ek liste 17 (aşağıda).
- Ödeme/teslim kanıt paketi: dekont, onaylı ölçü, çizim, sözleşme, tutanak tek dosyada (şikâyet sürecinde istenen belgeler).

**Beklenen**
- Üretim iş emri, kesim/malzeme ihtiyaç listesi, aşama ve sorumlu. — ÖzgürKod.
- Gecikme uyarısı: söz verilen tarih yaklaşırken/geçerken müşteriye otomatik bilgi (SMS/WhatsApp). — Tema 2, 8.
- Tedarikçi (kapak, tezgâh, donanım) sipariş-termin takibi; eksik parça listesi sevkten önce kontrol. — Delbig; tema 4.
- Vadesi gelen ödeme görevi, cari bakiye. — ÖzgürKod, Mobilya Takip.
- Telefondan çevrimdışı çalışan ekip uygulaması (ölçü, fotoğraf, imza). — ÖzgürKod.
- Müşteri portalı (sipariş aşaması görüntüleme). — Ecosire özeti (arama özeti, DOĞRULANAMADI) + tema 8.

**Fark yaratan**
- "Sevk öncesi kontrol listesi": her kapı/kapak/aparat için koli sayımı ile teslim tutanağı eşleşmesi (eksik aparat şikâyetlerini keser; tema 4).
- Ölçü–üretim tutarlılık uyarısı: ölçü sürümü değişince üretimdeki iş emrini işaretle (tema 3).
- Müşteriye zaman çizelgeli "durum sayfası" bağlantısı (kapora yattı, ölçü onaylı, üretimde, sevke hazır) — iletişimsizlik şikâyetini azaltır (tema 8).
- Montaj sonrası memnuniyet anketi + eksik giderme takibi (Mobilya Takip'te anket var).
- Tek tıkla ayıp/talep dosyası (tema 7, 10).

## (c) Şikâyet temaları

Önemli sınır: Bulunan şikâyetler çoğunlukla **mağaza/fabrika markaları** (Kelebek, İstikbal vb.) hakkında; küçük atölye şikâyeti az. Yalnız "Kelebek teslim", "Osmanlı Mobilya" sayfaları tam okundu; diğerleri Şikâyetvar liste/arama özetindeki başlıktan alındı (içerik teyidi sınırlı). Şikâyet = tek taraflı iddia, kanıt değil; temaların sıklığı örneklemden (ilk sayfa, kapora/mobilya listesi 14 sayfa) yaklaşıktır, istatistik değildir.

| # | Tema | Kaynak | Karşılayacak özellik |
|---|---|---|---|
| 1 | Kapora verildi, teslim olmadı, iade edilmiyor | https://www.sikayetvar.com/kapora/mobilya ; https://www.sikayetvar.com/marka-mobilyam/marka-mobilya-siparisim-teslim-edilmedi-kaporam-iade-edilmiyor ; https://www.sikayetvar.com/didvani-mobilya/didvani-magazasinda-50000-tl-kaporanin-geri-odenmemesi-ve-yetkisiz-odeme-talebi ; arama özeti: ölçü + 20.000 TL kapora sonrası teslim/iade yok (Şikâyetvar arama sonucu, URL ayrı doğrulanmadı) | Makbuzlu kapora kaydı, sözleşmede iade koşulu, kanıt paketi |
| 2 | Teslim süresi aşımı, sürekli erteleme, ulaşılamama | https://www.sikayetvar.com/armenamobilya/armenamobilya-teslimat-surekli-erteleniyor-telefonla-ulasilamiyor ; https://www.sikayetvar.com/ozturk-mobilya-mimarlik-insaat/ozturk-mobilyada-soz-verilen-teslim-suresi-asimi-ve-kapora-iadesi-talebi ; https://www.sikayetvar.com/kelebek-mobilya/teslim-tarihi-gecikmesi-ve-eksik-mobilya-urunleri-nedeniyle-magdur-oldum (okundu: 18.12.2025 yerine 26.12.2025) | Yazılı teslim tarihi, gecikme uyarısı, durum sayfası |
| 3 | Ölçü hatası / ürün yerine oturmuyor | https://www.sikayetvar.com/dolap/mutfak-dolaplari-yanlis-olcude-ve-kullanilmis-geldi-cizik-ve-deforme ; https://www.sikayetvar.com/sakallioglu-mobilya/sakallioglu-mobilya-kapaklar-tam-acilmiyor ; https://www.sikayetvar.com/bosch/bosch-bayisinin-yanlis-olcu-bilgisi-evimizi-insaat-haline-getirdi | Sürümlü ölçü + müşteri onayı, ölçü değişince iş emri uyarısı |
| 4 | Eksik parça / aparat, kurulum yapılamadı | https://www.sikayetvar.com/kelebek-mobilya/orta-masa-parcasi-eksik-ve-montaj-gecikmesi ; https://www.sikayetvar.com/ekolay-mutfak/ekolay-mutfak-izmit-sanayi-subesinde-eksik-ve-hatali-urun-teslimati ; Kelebek teslim şikâyeti (üstteki, okundu) | Koli/parça sayımı, sevk öncesi kontrol listesi |
| 5 | Hatalı montaj, hasarlı kurulum | https://www.sikayetvar.com/kelebek-mobilya/kemalpasa-kelebek-mobilya-hasarli-kurulum-ve-saygisiz-tavir ; https://www.sikayetvar.com/larmina-mobilya/hasarli-ve-hatali-montajli-mobilyalar-icin-cozum-bekliyorum | Montaj tutanağı, öncesi/sonrası fotoğraf, ekip performansı |
| 6 | Hatalı proje + evde hasar/kirlilik + tazminat | https://www.sikayetvar.com/osmanli-mobilya/osmanli-mobilyanin-hatali-mutfak-projesi-ve-maddi-zararlari (okundu: 7 Haziran 2025, özel sipariş mutfak) | Onaylı çizim/proje kaydı, iş sonu teslim tutanağı |
| 7 | Tamir/garanti süreci uzuyor, garanti kapsamında ücret isteniyor | https://www.sikayetvar.com/ekolay-mutfak/ekolay-mutfakta-eksik-ve-hatali-dolaplar-uzayan-tamir-sureci ; https://www.sikayetvar.com/istikbal/garanti-kapsamindaki-kirik-koltuk-ayagi-icin-ucret-talebi-ve-sure-aksamasi | SSH kaydı, 30 iş günü sayacı, garanti belgesi |
| 8 | Bilgi verilmiyor, firmaya ulaşılamıyor | https://www.sikayetvar.com/gundogdu-mobilya/gundogdu-mobilyadan-odedigim-berjer-teslim-edilmedi-bilgi-saglanmadi ; Armena (tema 2) | Müşteri durum sayfası, otomatik bilgilendirme |
| 9 | Fiyat farkı / sözleşme şartlarına uymama | https://www.sikayetvar.com/gundogdu-mobilya/gundogdu-mobilyada-kapora-ve-fiyat-farki-nedeniyle-magduriyet ; https://www.sikayetvar.com/alitel-mobilya/istikbal-alitel-mobilyadan-sozlesme-sartlarina-uymama-ve-kapora-iadesi-talebi | Onaylı teklif/sözleşme sürümünü dondurma, değişiklik için ek onay |
| 10 | Yanlış ürün gönderimi + sözleşme feshi/iade talebi | https://www.sikayetvar.com/modern-evim-mobilya/teslimat-gecikmesi-ve-yanlis-urun-gonderimi-nedeniyle-sozlesme-feshi-ve-iade-talebi | Sipariş–üretim–sevk kalem eşleşmesi, ayıp/iade dosyası |

Yazılımın kendisi hakkındaki kullanıcı şikâyeti (Şikâyetvar yazılım sayfaları, Google Play/App Store yorumları): bulunamadı/bakılamadı, bkz. (e).

## (d) Mevzuat

Kaynak ana dosyalar mevzuat.gov.tr PDF'leri; indirilip metne çevrildi (Türkçe karakter bozuk çıktı, maddeler okunabildi). 6502 metni 24/3/2022-7392 sayılı değişiklikleri ve AYM'nin 12/2/2026 tarihli (E.2024/229, K.2026/35) iptalini dipnotta içeriyor.

| İddia | Etiket | Kaynak URL | Madde | Erişim |
|---|---|---|---|---|
| Ayıplı mal: sözleşmeye/modele uygun olmayan; süresinde teslim edilmemesi veya satıcının yaptığı/sorumlu olduğu montajın gereği gibi yapılmaması **sözleşmeye aykırı ifa** sayılır | DOĞRULANDI | https://mevzuat.gov.tr/mevzuatmetin/1.5.6502.pdf | 6502 m.8/1-3 | 2026-10-30 |
| Teslimden itibaren 6 ay içinde çıkan ayıp teslimde var sayılır; ayıpsızlığı ispat satıcıya aittir | DOĞRULANDI | aynı | 6502 m.10/1 | 2026-10-30 |
| Tüketici dört seçimlik hakkından birini seçer: sözleşmeden dönme, ayıp oranında indirim, ücretsiz onarım, ayıpsız misli ile değişim; satıcı yerine getirmek zorunda | DOĞRULANDI | aynı | 6502 m.11/1 | 2026-10-30 |
| Onarım/değişim talebi **azami 30 iş günü** içinde yerine getirilir; dönme/indirimde ödenen bedel derhal iade edilir; masraflar yerine getirene ait, ayrıca TBK tazminatı istenebilir | DOĞRULANDI | aynı | 6502 m.11/4-6 | 2026-10-30 |
| Ayıplı maldan sorumluluk teslimden itibaren **2 yıl** zamanaşımı (ağır kusur/hile hâlinde uygulanmaz) | DOĞRULANDI | aynı | 6502 m.12 | 2026-10-30 |
| Üretici/ithalatçı garanti belgesi düzenler, **tamamlanıp tüketiciye verilmesi satıcıya** aittir; garanti süresi teslimden başlar, asgari 2 yıl; onarım sonrası tekrar arıza/azami süre aşımında diğer seçimlik haklar kullanılır | DOĞRULANDI | aynı | 6502 m.56 | 2026-10-30 |
| İsteğe bağlı garanti taahhüdü yazılı veya kalıcı veri saklayıcıyla verilir; yasal hakları saklı kalmalıdır | DOĞRULANDI | aynı | 6502 m.57 | 2026-10-30 |
| Üretici/ithalatçı, Bakanlıkça belirlenen **kullanım ömrü** boyunca satış sonrası bakım-onarım sağlar | DOĞRULANDI | aynı | 6502 m.58/1 | 2026-10-30 |
| Mesafeli sözleşmede 14 gün cayma; tüketici isteğiyle hazırlanan mallarda teslim süresi 30 günle sınırlı değil (taahhüt edilen süre geçerli) | DOĞRULANDI | aynı ; https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.20237.pdf | 6502 m.48/3-4 ; Yön. m.16/1 | 2026-10-30 |
| **Tüketicinin istekleri/kişisel ihtiyaçları doğrultusunda hazırlanan mallarda** mesafeli sözleşmede (taraflarca aksi kararlaştırılmadıkça) **cayma hakkı kullanılamaz** | DOĞRULANDI | https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.20237.pdf | Mesafeli Söz. Yön. m.15/1-b | 2026-10-30 |
| Satıcı sözleşmeyi süresinde ifa etmezse tüketici feshedebilir; ödenenler fesih bildiriminden itibaren 14 gün içinde yasal faizle iade | DOĞRULANDI | aynı Yönetmelik | m.16/2-3 | 2026-10-30 |
| Garanti Belgesi Yön. ekli liste: "17 Ahşap ve metal mobilyalar" garanti süresi **2 yıl**; "18.1 Kapı ve pencereler" 2 yıl | DOĞRULANDI (tablo satırı okundu; tablo biçimi bozuk, ekte satır 17/18.1 görüldü) | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=19782&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 | Garanti Belgesi Yön. m.6 + ek liste | 2026-10-30 |
| Mobilya için Satış Sonrası Hizmetler ek listesinde kullanım ömrü 10 yıl, azami tamir 20 iş günü | DOĞRULANAMADI (PDF'te satır 17 değerleri okunamadı; yalnız arama özeti) | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=19783&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 | SSH Yön. m.5 + ek liste | 2026-10-30 |
| Kapora/ön ödeme: alınabilmesi, iadesi, cayma/vazgeçmede kapora hükmü | DOĞRULANAMADI (6502'de genel hüküm bulunamadı; TBK okunmadı. "Ön ödemeli" maddeleri 6502'de konut/devre tatil içindir, mobilya için geçerli değil) | — | — | 2026-10-30 |
| Cayma istisnası **mağazada/atölyede yüz yüze** yapılan özel sipariş için: cayma hakkı mesafeli/kapıdan satış dışında yasal olarak yok; vazgeçmede sözleşme/kapora hükümleri belirleyici | DOĞRULANAMADI (hafızadan, doğrulanmadı) | — | — | 2026-10-30 |
| Mesafeli satış (internet/telefon) ile özel ölçü satışında ön bilgilendirmenin ispatı satıcıdadır | DOĞRULANDI | 6502 PDF | m.48/2,4 | 2026-10-30 |

Yazılıma etkisi: (1) satış sözleşmesinde satış kanalı (mesafeli / yüz yüze) alanı ve kanal "mesafeli" ise "özel ölçü, cayma yok" bilgilendirme metni; (2) garanti belgesi şablonu (teslimden başlayan 2 yıl); (3) ayıp kaydında 6 ay / 30 iş günü / 2 yıl sayaçları; (4) iade/fesih hâlinde 14 gün + yasal faiz hatırlatması; (5) kapora metni **hukukçu onayına bağlı**.

## (e) Erişilemeyen / yapılamayan

- https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6502... sayfası içerik vermedi (yalnız menü); aynı kanunun PDF'i kullanıldı.
- Mevzuat PDF'lerinde tablo (SSH ek listesi, kullanım ömrü) bozuk çıktı → 10 yıl doğrulanamadı.
- Türk Borçlar Kanunu (kapora/cezai şart) resmî metinden okunmadı.
- ADeko sayfası (bağlantı koptu); Workcube, Teowin, Ecosire, Delbig fiyatlar sayfası okunmadı.
- Google Play/App Store yazılım yorumları: ilgili ürünler için yorum bulunamadı (Dekostil'de yok); Şikâyetvar'da bu yazılım firmalarına ait sayfalara bakılmadı.
- Şikâyetvar: bireysel şikâyetlerin çoğu başlık/arama özeti düzeyinde; "firma kapandı" şikâyeti örnekte görülmedi.
- Resmî Gazete (resmigazete.gov.tr) ve ticaret.gov.tr kopyaları ayrıca açılmadı (mevzuat.gov.tr PDF yeterli sayıldı); Mesafeli Söz. Yön. m.15/1-b dışındaki 2022 değişiklik ayrıntıları taranmadı.
- Hiçbir ürün canlı denenmedi (CLAUDE.md: dokümanla uyum ≠ canlı test).
