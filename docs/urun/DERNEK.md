# Dernek, Vakıf & Muhtarlık (`apps/dernek`)

Durum: temel dalga ve beklenenler geliştirildi, spec kullanıcı onayı bekliyor. Tarih: 30.10.2026.

## CANLIYA ÇIKMAYI ENGELLEYENLER

- **Fiyat örnektir:** `[349, 690, 1290]` uydurma değil ama sizin onayınız yok. Satıştan önce kesinleşmeli.
- **Resmî defter değildir:** Yönetmelik md. 32 ve 42 elektronik defter ve alındı belgesini "Bakanlıkça oluşturulan veya izin verilen yazılım" şartına bağlar. NEBSOFT'un böyle bir izni yok. Program yardımcı kayıt tutar, her çıktı bunu yazar. Tanıtımda "e-defter", "resmî alındı" denemez.
- **Vakıf ve muhtarlık mevzuatı DOĞRULANAMADI:** Bu kurum türlerinde süre uyarısı gösterilmez, zorunluluk yazılmaz.
- **DERBİS bağlantısı yok:** Beyanname ve bildirimler dernekçe yapılır. Program yalnız tarihi hatırlatır.

## Doğrulanan mevzuat

Kaynak: Dernekler Yönetmeliği, mevzuat.gov.tr `mevzuatNo=8038`, metindeki son değişiklik RG 21.10.2021-31635, okundu 30.10.2026. Kaynak PDF'in metni çıkarılıp maddeler doğrudan okundu.

| Kural | Madde | Etiket | Programda |
|---|---|---|---|
| Çağrı en az 15 gün önce; ikinci toplantı 7-60 gün sonra | md. 14 | DOĞRULANDI | Uyarı, tarih kontrolü |
| Hazirun listesi, kimlik kontrolü, imza | md. 15 | DOĞRULANDI | Hazirun çıktısı |
| Olağan kurul en geç üç yılda bir | md. 13 | DOĞRULANDI | Özet hatırlatması |
| Sonuç bildirimi 45 gün içinde (EK-3) | md. 17 | DOĞRULANDI | Son gün uyarısı |
| Bilanço esası haddi metinde 1.500.000 TL | md. 31 | Metin DOĞRULANDI, güncel tutar DOĞRULANAMADI | Uyarı, il müdürlüğünden doğrulama notu |
| Karar, üye, evrak, işletme hesabı defterleri | md. 32 | DOĞRULANDI | Yardımcı kayıt ekranları |
| Elektronik defter yalnız izinli yazılımla | md. 32 | DOĞRULANDI | "Resmî değildir" notu |
| Banka dekontu alındı belgesi yerine geçer | md. 38 | DOĞRULANDI | Tahsilat formu ipucu |
| Belgeler 5 yıl saklanır | md. 39 | DOĞRULANDI | Bilgi; kayıt silme kısıtlı |
| Alındı belgesi elektronik ise izinli yazılımla | md. 42 | DOĞRULANDI | Program bilgi fişi üretir, numara elle yazılır |
| Beyanname ilk dört ayda (EK-21) | md. 83 | DOĞRULANDI | Özet hatırlatması |
| Vakıf / muhtarlık zorunlulukları | yok | DOĞRULANAMADI | Yazılmadı |

## Pazar araştırması

Kaynaklar üretici tanıtım sayfaları ve indirme sitesi özetleridir, bağımsız karşılaştırma bulunamadı. Fiyat toplanmadı. Rakip metni veya tasarımı kullanılmadı.

- Etkin Yazılım Dernek Takip: yıllık/aylık aidat, makbuz, ödeyen-ödemeyen listesine SMS. https://www.tamindir.com/indir/etkin-yazilim-dernek-takip/
- Proton Üye Takip: gruplara göre toplu aidat, karar ve evrak defterleri. https://www.tamindir.com/indir/proton-uye-takip/
- Hursoft Sendika Programı: toplu borçlandırma, gecikme cezası, alındı belgesi. https://www.tamindir.com/indir/hursoft-sendika-programi/amp/
- Loft Dernek Programı: üye, aidat, çek, kasa, cari. https://www.tamindir.com/windows/loft-dernek-programi/
- Dernekcell: üye aidat takibi ve ödeme uygulaması. https://apps.apple.com/bh/app/dernekcell/id6450138169

Şikâyet: dernek yazılımlarına özgü Şikâyetvar kaydı bulunamadı. Ürünlerin çoğu masaüstü deneme sürümü, sınırlı açıklamalı. Aşağıdaki sorunlar bu yüzden ürün sayfalarındaki boşluklardan çıkarılmıştır, kullanıcı şikâyeti değildir.

| Gözlenen sorun | Karşılayan özellik |
|---|---|
| Masaüstü programı tek bilgisayarda kalıyor | Bulut, telefonda çalışan arayüz |
| Üye borcunu sormak için yönetimi arıyor | Üye portalı |
| Çağrı süresi kaçırılıyor | Tarih uyarısı, çağrı kaydı |
| SMS gitmediği hâlde çağrı yapılmış sanılıyor | TEST sonucu çağrı kaydı oluşturmaz |

## Özellikler

| Özellik | Sınıf | Durum |
|---|---|---|
| Üye kartı, giriş-çıkış tarihi, kabul kararı | Olmazsa olmaz | Var |
| Dönem tahakkuku, mükerrer tahakkuk engeli | Olmazsa olmaz | Var |
| Tahsilat, kısmi ödeme, avans, onaylı iptal | Olmazsa olmaz | Var |
| Basılı alındı belgesi no, mükerrer no engeli | Olmazsa olmaz | Var |
| Gelir-gider, yıl sonu tablosu hazırlığı | Olmazsa olmaz | Var |
| Yönetim kurulu toplantısı, karar numarası | Olmazsa olmaz | Var |
| Genel kurul, çağrı, hazirun, tutanak | Olmazsa olmaz | Var |
| Evrak kaydı (silinmez) | Beklenen | Var |
| Toplu SMS hatırlatma | Beklenen | Var, sağlayıcı olmadan TEST |
| Üye portalı, yalnız okuma | Beklenen | Var |
| Rol: sayman, sekreter | Beklenen | Var, sunucu kuralıyla |
| Muhtarlık kipi, aidatsız | Beklenen | Var |
| Gecikme cezası | Beklenen | Yok: tüzüğe bağlı, kural doğrulanmadı |
| Demirbaş, ayni yardım teslim | Beklenen | Yok, sonraki dalga |
| Online aidat ödeme | Fark yaratan | Yok, ödeme altyapısı kararı gerekir |
| Üye mobil kimlik kartı | Fark yaratan | Yok |

## Çekirdek ihtiyacı

`docs/urun/CEKIRDEK-ISTEKLERI-uyelik-egitim-saglik.md`. İmzalı üyelik başvurusu ve ayrılma dilekçesi `NS.forms` ile programdan eklendi, metinleri örnektir.

## Deneme

`?demo=1`: tüm ekranlar, tahakkuk, avans, mükerrer belge, iptal yolu, çağrı TEST, karar, boş liste, 375 px, 5.000 üye. Konsol hatası yok. Bulut portal akışı gerçek sunucuda denenmedi, kural saf testle sınandı.
