# Temizlik & Tesis Hizmetleri — ürün spesifikasyonu

Program: `apps/temizlik/`, ortak saha motoru `apps/saha-ortak/`. Durum: **kullanıcı onayı bekliyor** (temel ve beklenen dalga geliştirildi, görev bunu istedi). Araştırma tarihi: 2026-10-30.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Etiket | Not |
|---|---|---|
| Örnek hizmet sözleşmesi metni | DOĞRULANAMADI | "Örnek şablon"dur, avukat incelemesi gerekir. |
| KDV oranı | Kullanıcı kararı | Varsayılan Ayarlar'dan gelir, işletme mali müşavirine göre girer. Program hizmet türüne göre oran önermez. |
| Ürün fiyatı | Kullanıcı kararı | Katalogdaki fiyat örnektir. |

Bu program için mevzuat iddiası yazılmadı; sektöre özel yükümlülük araştırılmadı.

## Pazar araştırması

Türkiye'de temizlik firmasına özel yerli ürün az bulundu; QR tabanlı tesis takip ürünleri öne çıktı: [Gir-in Temizlik](https://gir-in.com/qr-kodlu-temizlik-yonetim-sistemi), [temizliktakibi.com](http://www.temizliktakibi.com/), [ENAFEEDBACK](https://enainnovation.com/blog/enafeedback-temizlik-takip-programi-ile-dijital-hijyen?lang=en), [Karekod Yazılım](https://www.karekodyazilim.com/qr/kalite-kontrol-yazilimi/). Yabancı kıyas: [Connecteam](https://lp.connecteam.com/cleaning-company-app-aw), [CleanManager](https://cleanmanager.dk/en/base-module/cleaning-scheduling-software), [Planado](https://planado.app/industries/cleaning). Akademik örnek: [hastane karekod pilotu](https://dergipark.org.tr/tr/pub/iuyd/article/1539883). Satıcı sayfalarındaki iddialar bağımsız doğrulanmadı.

Şikâyet kaynakları (tek taraflı kullanıcı beyanı): [Evde Temizlik Var](https://www.sikayetvar.com/evde-temizlik-var), [Temizlikgonder.com](https://www.sikayetvar.com/temizlikgondercom/temizlik), [Temizlikyolda.com](https://www.sikayetvar.com/temizlikyoldacom), [Sil Süpür Temizlik](https://www.sikayetvar.com/sil-supur-temizlik/sil-supur-temizlikte-yetersiz-iscilik-cevapsiz-musteri-hizmeti-ve-iade-talebi).

| Şikâyet | Karşılayan özellik |
|---|---|
| Ekip gelmedi, ödenen para iade edilmedi | "Gelinmedi" kaydı, faturada eksik ziyaret görünür ve isteğe bağlı düşülür |
| "Ekip yolda" denilerek oyalanma | Yoldayım, başladı, bitti saatleri; müşteri bunları takip sayfasında görür |
| Yetersiz işçilik, temizlik yarım | Yere özel kontrol listesi, fotoğraf, müşteri puanı, düşük puan uyarısı |
| Eşya zarar gördü | Hasar notu ve fotoğraf iş kaydında kalır |
| Müşteri hizmetine ulaşılamıyor | Takip sayfasından puan ve görüş işletmeye düşer |

## Özellikler

| Sınıf | Özellik | Durum |
|---|---|---|
| Olmazsa olmaz | Sözleşmeli müşteri, yer (site) bilgisi | Var |
| Olmazsa olmaz | Periyodik plan: günlük, haftalık gün seçimi, iki haftalık, aylık, 3/6 aylık, yıllık | Var |
| Olmazsa olmaz | Planlardan ziyaret üretimi (tekrar basmaz) | Var |
| Olmazsa olmaz | Haftalık ekip takvimi, çakışma uyarısı | Var |
| Olmazsa olmaz | Aylık faturalama: sabit ücret veya ziyaret başı | Var |
| Olmazsa olmaz | Rol: saha ekibi yalnız kendi işini görür, ücret görmez (sunucu) | Var |
| Beklenen | Yere özel kontrol listesi | Var |
| Beklenen | Başladı, bitti saati, süre | Var |
| Beklenen | Müşteri sayfası: ziyaret geçmişi, rapor, puan (`takip.html`) | Var |
| Beklenen | Malzeme stoğu ve kritik seviye | Var |
| Beklenen | e-Belge (`NS.ebelge.create`), tahsilat, cari bakiye | Var |
| Beklenen | Sözleşme bitiş uyarısı | Var |
| Fark yaratan | Eksik ziyaretin faturadan düşülmesi | Var |
| Fark yaratan | Noktaya QR okutarak yoklama | Yok, sonraki dalga |
| Fark yaratan | Personel puantajı ve bordro bağlantısı | Yok: `apps/ik` ile bağlantı çekirdek işi |
| Fark yaratan | Konumla başlama doğrulaması | Yok, sonraki dalga |

## Yapılmayan veya doğrulanmayan

- Muhasebe programına otomatik aktarım yoktur; Muhasebe kaynaklı yalnız aylık faturalama mantığı örnek alındı.
- Pilot işletme denemesi yapılmadı.
