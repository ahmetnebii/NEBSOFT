# Deneme dönüşümü, e-posta ve ileti kuralları

Tarih: 2026-10-30

## CANLIYA ÇIKMAYI ENGELLEYENLER
1. **İYS:** İzinlerin İYS'ye aktarımı programda yok. Bu yüzden tanıtım içerikli gönderim varsayılan olarak kapalıdır. Yönetim panelinde İYS beyanı, ticaret unvanı ve MERSİS girilmeden tanıtım satırı ve toplu e-posta gitmez.
2. **Hukuk kontrolü:** Dizi e-postalarının md. 6 kapsamında bilgilendirme sayılıp sayılmadığı avukata sorulmalıdır. Özellikle "paket seçimini Hesabım sayfasından yapabilirsiniz" cümlesi.
3. **Gerçek SMTP ve MySQL denemesi:** Gönderim SMTP'si ve SQL sorguları bu çalışmada gerçek sunucuyla denenmedi.

## Dizi
| Adım | Zaman | İçerik |
|---|---|---|
| g1 | Başlangıçtan 24 saat sonra | Sıradaki kurulum adımları |
| g3 | 3. gün | Gerçek ilerleme ve kalan adımlar |
| g6 | 6. gün | Kontrol listesi, süre dolunca ne olacağı |
| son | Bitişe 12 saat kala | Bitiş tarihi, verilerin silinmediği, Hesabım bağlantısı |

Gönderim TSİ 08.00–21.00 arasında, 30 dakikada bir kontrolle yapılır. Kaçırılan eski adım sonradan gönderilmez. Hata durumunda en çok 3 deneme yapılır. Aynı kişiye iki e-posta arasında en az 20 saat vardır, hatırlatma hariç. Kurulum ilerlemesi `app_data` içindeki gerçek kayıtlardan hesaplanır; örnek veriler sayılmaz.

Deneme lisansları eski 7/3/1 günlük hatırlatmadan çıkarıldı; o hatırlatma artık yalnız ücretli lisanslar içindir.

## Kaynaklar
| İddia | Durum | Kaynak |
|---|---|---|
| Üyelik durumu, kullanım ve bilgilendirme iletileri onaysız gönderilebilir, tanıtım içeremez (md. 6) | DOĞRULANDI (asıl metin) | https://www.resmigazete.gov.tr/eskiler/2015/07/20150715-4.htm · RG 15.7.2015/29417 |
| Tacir ve esnafa onaysız gönderim, ret hâlinde onay gerekir (md. 6) | DOĞRULANDI (asıl metin) | Aynı kaynak; https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler (erişim 2026-10-30) |
| Onay kutusu önceden seçili olamaz, ispat gönderene aittir (md. 7) | DOĞRULANDI (asıl metin) | Aynı kaynak |
| Her iletide ret imkânı; ret üç iş günü içinde uygulanır (md. 9–10) | DOĞRULANDI (asıl metin) | Aynı kaynak |
| İYS kaydı; tacir ve esnaf adresleri de İYS'ye kaydedilip kontrol edilir (md. 5, 6) | DOĞRULANDI (2020 değişikliği) | https://www.resmigazete.gov.tr/eskiler/2020/01/20200104-2.htm · RG 4.1.2020/30998 |
| 2020 sonrası değişiklikler ve yürürlükteki birleşik metin | DOĞRULANAMADI | mevzuat.gov.tr sayfaları bu çalışmada okunamadı |
| 6563 sayılı Kanun metni (md. 6, 8) | DOĞRULANAMADI | https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6563.pdf indirildi, metni çözülemedi |

Çıkış bağlantısı tacir ve esnaf kuralından bağımsız olarak her dizi e-postasında vardır. Görev kuralı gereği tanıtımda tacir istisnası kullanılmadı: izin yoksa gönderilmez.

## WhatsApp
Otomatik gönderim yok. Yönetim panelindeki **Deneme takibi** sayfası taslak metinli `wa.me` bağlantısı verir; gönderimi yönetici kendisi yapar ve sistemde "gönderildi" kaydı oluşmaz.
