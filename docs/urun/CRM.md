# CRM — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. Program: `apps/crm/` (+ `teklif.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **e-Fatura:** gerçek gönderim sağlayıcı test hesabıyla denenmedi (`docs/DEVIR.md` B1).
- **Santral (arayan numara):** `callerid` için doğrulanmış sağlayıcı yok; numara elle girilir.
- **Şikâyet verisi:** Türkçe kullanıcı şikâyeti bulunamadı; öncelikler özellik sayfalarına ve kod incelemesine dayanır.

## 1. Pazar araştırması (30.10.2026)
Satıcı veya tanıtım kaynaklarıdır; iddialar bağımsız doğrulanmadı.

| Ürün | Karşıladığı ihtiyaç | Kaynak |
|---|---|---|
| Logo CRM | Fırsat, ihale ve proje takibi; geçmiş fiyat kontrolü; alternatif teklif | [broşür](https://cdn.logo.com.tr/files/logocomtr/Uploads/Documents/logo-crm-tanitim-brosuru-tr.pdf) |
| Turkcell (rehber) | Takipsiz kalan teklif ve aramanın işaretlenmesi; kazanma oranı ve kayıp noktası | [yazı](https://www.turkcell.com.tr/blog/crm-nedir) |
| Paraşüt (rehber) | Teklif, hatırlatma ve takip e-postası otomasyonu | [yazı](https://www.parasut.com/blog/crm-kullanmanin-sirketinize-sagladigi-avantajlar) |
| Planports CRM+ | Teklif, süreç, ön muhasebe ve sipariş bir arada | [haber](https://www.dha.com.tr/ekonomi/crm-i-masraf-kalemi-degil-itici-guc-olarak-goren-kobi-ler-buyuyor-1857595) |

## 2. Özellik karşılaştırması
**O** olmazsa olmaz · **B** beklenen · **F** fark yaratan

| Özellik | Bizde (başlangıç) | Sınıf | Dalga |
|---|---|---|---|
| Huni, fırsat, görev, firma, kişi | var; görev ve kapanış hataları vardı | O | 1 |
| Online teklif onayı | var; zayıf anahtar, çift kabul | O | 1 |
| Temsilci yetki sınırı | eksik | O | 1 |
| Dövizli teklif | yok | B | 2 |
| Ürün/hizmet kataloğu | yok | B | 2 |
| Kabul edilen tekliften fatura | yok | B | 2 |
| Excel'den firma ve kişi aktarımı | yok | B | 2 |
| Temsilci hedefi | yok (tek hedef) | B | 2 |
| Takip önerileri (görülen teklif, sessiz fırsat) | kısmen | F | 3 |
| Sözleşme yenileme hatırlatması | yok | F | 3 |
| Dönemli kayıp ve temsilci raporu | kısmen | F | 3 |

## 3. Yapılanlar

### 1. dalga — kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| C1 | Son tarihsiz görev veya tarihsiz fırsat Satış Panosu'nu düşürüyordu | Tarih boş olabilir; sıralama ve görünüm güvenli | Tarayıcı: tarihsiz görev ve fırsatla 9 ekran hatasız |
| C2 | Kapanan fırsat yeniden açılınca kapanış tarihi ve kayıp nedeni kalıyordu, raporda kapalı sayılıyordu | Yeniden açılınca ikisi de silinir | Tarayıcı |
| C3 | Kayıp nedeni serbest metindi, formda zorunlu değildi | Seçim listesi; kaybedildiyse zorunlu; ek açıklama aktiviteye yazılır | Tarayıcı |
| C4 | Reddedilmiş veya revize edilmiş teklif kabul işaretlenebiliyordu; kabul edilen revize edilebiliyordu | Yanıtlanmış teklif değişmez | Tarayıcı: "Bu teklif reddedildi; değiştirilemez" |
| C5 | Aynı fırsatta birden çok açık teklif kalıyordu; biri kabul edilse diğeri de kabul edilebilirdi | Yeni teklif ve kabul, diğer açık sürümleri kapatır (panel, teklif sayfası, sunucu) | `crm-kural.test.js` |
| C6 | Teklif bağlantısı anahtarı `Math.random` ile üretiliyordu | Güvenli rastgele 32 hane; eski bağlantılar çalışır | `crm-kural.test.js`, kod incelendi |
| C7 | Temsilci başkasının fırsatını adresle açabiliyordu; firma kartında tüm fırsatları görüyordu | Fırsat sayfası ve firma kartı kendi fırsatlarıyla sınırlı | Tarayıcı: huniye yönlendi |
| C8 | Yetkili listesi tüm firmaların kişilerini gösteriyordu | Seçilen firmayla sınırlı | Tarayıcı |
| C9 | Fırsatı olan firma ve kişi silinebiliyordu; aynı adla firma açılabiliyordu | Silme kısıtı, mükerrer ad engeli | Kod incelendi |
| C10 | Görev eklemek ve bitirmek "son temas"ı güncellemiyordu, fırsat sessiz görünüyordu | Görev işlemleri son temas sayılır | Kod incelendi |
| C11 | Teklif belge şablonundan geçmiyordu | `NS.docs` "teklif" | Şablon sayfası açıldı; çıktı kâğıtta denenmedi |
| C12 | Hedef girilmezse panoda Infinity çıkıyordu; firma listesi ve huni binlerce kayıtta yavaştı | Hedef uyarısı; gruplama; huni aşamasında 100 kart | Kod incelendi |
