# Peyzaj & İlaçlama — ürün spesifikasyonu

Program: `apps/peyzaj/`, ortak saha motoru `apps/saha-ortak/`. Durum: **kullanıcı onayı bekliyor** (temel ve beklenen dalga geliştirildi, görev bunu istedi). Araştırma tarihi: 2026-10-30.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Etiket | Not |
|---|---|---|
| Ek-1 formunun saklama süresi | DOĞRULANAMADI | Yönetmelik gövdesinde süre bulunamadı. Program süre yazmaz, kayıt silinmez. |
| Peyzaj ve park alanına bitki koruma ürünü kuralları | DOĞRULANAMADI | Yönetmelikte peyzaj, park, yeşil alan ifadesi yok. Kapsam ticari üretim yerleri. Program peyzaj işinde zorunluluk iddia etmez, il/ilçe tarım müdürlüğüne sorulmalı. |
| Bakanlık elektronik bildirimi | DOĞRULANAMADI | Yönetmelik uygulama öncesi elektronik bildirim istiyor (md. 8/2-i). Sistemin arayüzü ve API'si doğrulanmadı. Program bildirim yapmaz, yalnız işletmenin elle işaretlediği alanı tutar ve "bildirildi" diye göstermez. |
| Danıştay yürütmeyi durdurma notu | DOĞRULANAMADI | Madde 8 ve 9'daki bazı kısımlar için metinde not var, kapsam ve güncel durumu okunmadı. Mesul müdür ve ekip sorumlusu nitelik şartı programda denetlenmez. |
| Örnek sözleşme metni | DOĞRULANAMADI | "Örnek şablon"dur, avukat incelemesi gerekir. |
| Ürün fiyatı | Kullanıcı kararı | Katalogdaki fiyat örnektir. |

## Mevzuat

Künye: RG 04.07.2019/30821 (DOĞRULANDI, mevzuat.gov.tr, 2026-10-31). Uygulama yerinde önceden duyuru (md. 21/4) programda alan olarak yok.

| İddia | Etiket | Kaynak |
|---|---|---|
| Halk sağlığı alanında biyosidal uygulama için il müdürlüğü izni (md. 5, Ek-2) | DOĞRULANDI | [mevzuat.gov.tr, Biyosidal Ürünlerin Kullanım Usul ve Esasları Hakkında Yönetmelik](https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=32642&MevzuatTertip=5), 2026-10-30 |
| Ekip sorumlusu Ek-1 Uygulama İşlem Formu düzenler, bir nüshası yetkiliye verilir (md. 9/3-c) | DOĞRULANDI | Aynı |
| Ek-1 alanları: firma, adres, mesul müdür, uygulayıcılar, telefon, izin tarih ve sayısı, ekip sorumlusu; ürün ticari adı, ruhsat tarih ve sayısı, uygulama şekli, aktif madde, antidot, ambalaj miktarı; yer adresi, hedef zararlı, tarih, başlangıç ve bitiş saati, mesken/işyeri, daire sayısı, alan, güvenlik önlemleri; iki imza; UZEM 114 ve 112 notu | DOĞRULANDI | Aynı metnin [ek dosyası](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.32642-Ek.docx). Program formu bu alanlarla basar. |
| Uygulama kayıtları Ek-1 ile ayrı dosyada tutulur, denetime açıktır (md. 19) | DOĞRULANDI | Aynı |
| Bakanlık izinli olmayan ürün kullanılamaz; güvenlik bilgi formu bulundurulur (md. 16) | DOĞRULANDI | Aynı. Ürün kartında ruhsat ve bilgi formu alanı var. |
| Bitki Koruma Ürünlerinin Uygulanması ve Denetimine İlişkin Yönetmelik: reçete (md. 11), kayıt 3 gün içinde (md. 15), kapsam ticari üretim yerleri (md. 2, 5) | DOĞRULANDI | [RG 13.12.2025/33106](https://www.resmigazete.gov.tr/eskiler/2025/12/20251213-5.htm). Peyzaj işine uygulanması DOĞRULANAMADI. |
| Kayıtların 5 yıl saklanması | DOĞRULANAMADI | md. 15/5 cümlesi kaza ve zehirlenme bilgileriyle birlikte geçiyor, kapsamı metinden kesin çıkmıyor. |

Eski 2005 yönetmeliğine dayanan site ve blog anlatımları kullanılmadı.

## Pazar araştırması

Ürünler: [PCO Yönetimi](https://www.pcoyonetimi.com/) (müşteri, saha, rapor, kat planı ve istasyon), [Digipestcontrol](https://digiwise.tr/?id=3&lang=tr&page=blog-ayrinti) (CRM, saha takibi, kemirgen planı), [Eka İlaçlama Scripti](https://www.ekasunucu.com/yazilim/eka-ilaclama-hasere-kontrol-yonetim-scripti) (periyodik sözleşme, randevu, ekip). Yabancı kıyas: [GorillaDesk](https://gorilladesk.com/pest-control-software/) (kimyasal uygulama geçmişi dışa aktarımı). Peyzaj için Türkçe özel ürün bulunamadı. Satıcı iddiaları bağımsız doğrulanmadı.

Şikâyet kaynakları (tek taraflı kullanıcı beyanı): [Prestij İlaçlama](https://www.sikayetvar.com/prestij-ilaclama), [Avrasya İlaçlama](https://www.sikayetvar.com/avrasya-ilaclama/avrasya-ilaclama-pismanligi), [Anadolu İlaçlama](https://www.sikayetvar.com/anadolu-ilaclama/yuksek-ucretli-ilaclama-sonrasi-bocek-sorunum-cozulmedi-parami-geri-istiyorum), [Mikrosav](https://www.sikayetvar.com/mikrosav/ilaclama-sonrasi-bocek-sorunu-daha-da-artti), [ilaclama.com.tr](https://www.sikayetvar.com/ilaclamacomtr).

| Şikâyet | Karşılayan özellik |
|---|---|
| "Bitti" denilen sorun sürüyor, ikinci ziyaret ücretli | Yazılı ücretsiz tekrar süresi ve hakkı, tek tuşla tekrar ziyareti |
| Sözlü garanti, koşul belirsiz | Tekrar koşulu sözleşme ve raporda yazar |
| Söylenen yöntem uygulanmadı | Ek-1 raporunda ürün ve uygulama şekli, müşteri sayfasında görünür |
| Ulaşılamıyor | Takip sayfasından tekrar talebi işletmeye düşer |

## Özellikler

| Sınıf | Özellik | Durum |
|---|---|---|
| Olmazsa olmaz | Sözleşmeli müşteri, yer bilgisi (mesken/işyeri, daire, alan) | Var |
| Olmazsa olmaz | Periyodik plan, ziyaret üretimi, ekip takvimi | Var |
| Olmazsa olmaz | Uygulama kaydı: ürün, miktar, hedef zararlı, saat, önlem | Var |
| Olmazsa olmaz | Ek-1 alanlarıyla imzalı Uygulama İşlem Formu (NS.docs) | Var |
| Olmazsa olmaz | Ürün kartı: ruhsat tarih ve sayısı, aktif madde, antidot, stok | Var |
| Olmazsa olmaz | Rol: saha ekibi yalnız kendi işini görür (sunucu) | Var |
| Beklenen | Personel belge bitiş takibi (sertifika, sağlık raporu) | Var |
| Beklenen | Peyzaj işi: çim, budama, sulama kontrol listesi, rapor | Var |
| Beklenen | Müşteri sayfası: rapor, puan, tekrar talebi (`takip.html`) | Var |
| Beklenen | Aylık faturalama, e-Belge | Var |
| Beklenen | Uygulama defteri ve CSV dışa aktarım | Var |
| Fark yaratan | Ücretsiz tekrar hakkı takibi | Var |
| Fark yaratan | Kat planı üzerinde istasyon işaretleme | Yok, sonraki dalga |
| Fark yaratan | Bakanlık sistemine otomatik bildirim | Yok: doğrulanmış arayüz yok |

## Yapılmayan veya doğrulanmayan

- Program izin, sertifika veya nitelik şartını denetlemez; işletmenin girdiği bilgiyi basar.
- Pilot işletme denemesi yapılmadı.
