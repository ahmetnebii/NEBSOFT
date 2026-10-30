# Mobil Usta & Tesisat — ürün spesifikasyonu

Program: `apps/usta/`, ortak saha motoru `apps/saha-ortak/`. Durum: **kullanıcı onayı bekliyor** (temel ve beklenen dalga geliştirildi, görev bunu istedi). Araştırma tarihi: 2026-10-30.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Etiket | Not |
|---|---|---|
| Bakım aralığı | DOĞRULANAMADI | Üretici veya mevzuat aralığı doğrulanmadı. Aralığı işletme girer, program önermez. |
| Garanti süresi metni | Kullanıcı kararı | Süre Ayarlar'dan gelir. Boşsa müşteriye gösterilmez. |
| Ürün fiyatı | Kullanıcı kararı | Katalogdaki fiyat örnektir. |

Gaz, elektrik ve yetkili servis yükümlülükleri araştırılmadı; program bu konuda iddia yazmaz.

## Pazar araştırması

Ürünler: [Evobulut Servis Takip](https://www.evobulut.com/servis-takip-programi), [Servira](https://servira.com.tr/klima-servis-programi-hvac-teknik-servis-yazilimi/), [Servis Pozitif](https://www.servispozitif.com/), [Takip Online](https://takiponline.com/), [Livo Yazılım](https://www.livoyazilim.com/saha-servis-takip-programi/). Hepsi satıcının kendi sayfası; iddialar bağımsız doğrulanmadı.

Şikâyet kaynakları (tek taraflı beyan ve haber): [DHA kombi şikâyetleri](https://www.dha.com.tr/kurumsal/sikayetvar-kombi-sikayetleri-1-haftada-yuzde-43-artti-2747339), [DHA klima şikâyetleri](https://www.dha.com.tr/ekonomi/sikayetvar-klima-sikayetleri-haziranda-yuzde-320-artti-2907138), [Dağlı Teknik](https://www.sikayetvar.com/dagli-teknik), [Vestel klima servis ücreti](https://www.sikayetvar.com/vestel/garanti-kapsamindaki-vestel-klimamda-haksiz-servis-ucreti-iptali-talebi).

| Şikâyet | Karşılayan özellik |
|---|---|
| Randevu saatine uyulmuyor, usta gelmiyor | Varış saat aralığı, "yoldayım" bildirimi, geciken iş listesi |
| Onay alınmadan iş yapıldı, beklenmedik ücret | Yerinde teklif ve müşteri onayı; onaysız kalem işi bitirmeden uyarır |
| Garantide ücret istendi | Önceki iş ve garanti bitişi iş kaydında görünür |
| Yapılan iş belirsiz | İmzalı servis formu, kalem kalem tutar, müşteri takip sayfası |

## Özellikler

| Sınıf | Özellik | Durum |
|---|---|---|
| Olmazsa olmaz | Çağrı ve randevu, varış aralığı, usta atama | Var |
| Olmazsa olmaz | Saha iş emri: yoldayım, başladı, bitti | Var |
| Olmazsa olmaz | Parça ve işçilik kalemleri, tahsilat | Var |
| Olmazsa olmaz | Cihaz kartı: kombi, klima, tesisat; müşteri bazında geçmiş | Var |
| Olmazsa olmaz | Periyodik bakım: aralık, yaklaşan liste, tek tuşla iş ve SMS | Var |
| Olmazsa olmaz | Rol: usta yalnız kendi işini görür, alış fiyatı görmez (sunucu) | Var |
| Beklenen | İmzalı servis formu (NS.docs) | Var |
| Beklenen | Yerinde teklif, müşteri onayı (takip sayfası veya imza) | Var |
| Beklenen | Garanti bitişi | Var |
| Beklenen | Parça stoğu ve kritik seviye | Var |
| Beklenen | e-Belge, fotoğraf, müşteri puanı | Var |
| Fark yaratan | Telefon numarasından müşteri bulma | Var |
| Fark yaratan | Cihaza QR yapıştırıp geçmişi açma | Yok, sonraki dalga |
| Fark yaratan | Usta araç stoğu ve günlük kârlılık | Yok, sonraki dalga |

## Yapılmayan veya doğrulanmayan

- Arayan numara entegrasyonu eklenmedi; numara elle aranır.
- Pilot işletme denemesi yapılmadı.
