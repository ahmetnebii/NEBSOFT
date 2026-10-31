const T = '2026-10-31';
module.exports = {
  slug: 'iban-dogrulama', kategori: 'belge', sira: 22, renk: '#1d4ed8', guncelleme: T, mevzuat: true, tek: true, ilgili: ['csv-excel-temizleme', 'tahsilat-makbuzu-olusturucu', 'liste-karsilastirma'],
  ad: 'IBAN Doğrulama', kisa: 'TR IBAN\'ı kontrol basamağından denetleyin, ödeme listesindeki hatalı satırları tek seferde görün',
  baslik: 'IBAN Doğrulama — Toplu TR IBAN Kontrolü ve Hata Bulma | NEBSOFT',
  ozet: 'Tek IBAN veya bütün ödeme listesini yapıştırın. Araç 26 karakteri, rezerv alanı ve kontrol basamağını denetler, hatanın nedenini yazar. Bilgi cihazınızdan çıkmaz.',
  sonucBaslik: 'Denetim sonucu', aciklamaBaslik: 'IBAN doğrulama neyi söyler, neyi söyleyemez?',
  program: { slug: 'personeltakipprogrami', metin: 'Personel maaş listesini her ay yeniden hazırlamak yerine Personel Takip programında çalışan bilgilerini, izinleri ve bordroyu tek yerde tutabilirsiniz.' },
  kaynaklar: [
    { ad: 'TCMB, Uluslararası Banka Hesap Numarası Hakkında Tebliğ (Sayı: 2008/6)\'da Değişiklik Yapılmasına Dair Tebliğ (Sayı: 2021/5)', url: 'https://www.resmigazete.gov.tr/eskiler/2021/08/20210805-17.htm', tarih: T, not: 'Resmî Gazete 05.08.2021, sayı 31559: 26 karakter, alanlar ve kodları TCMB\'nin belirlemesi' },
    { ad: 'TCMB, IBAN Tebliği 2008/6 İngilizce metni', url: 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/Bottom+Menu/IBAN/Communique', tarih: T, not: 'madde 4: Türkçe harf yasağı, sıfır rezerv alan ve MOD 97-10 yöntemi' },
  ],
  alanlar: [
    { ad: 'liste', etiket: 'IBAN listesi (her satıra bir kayıt)', tip: 'cokmetin', ipucu: 'Excel\'den ad ve IBAN sütunlarını birlikte yapıştırabilirsiniz. Aşağıdaki kayıtlar uydurma örnektir.', deger: 'Örnek Personel 1;TR60 9999 9000 0000 0000 0012 34\nÖrnek Personel 2;TR61 9999 9000 0000 0000 0056 78\nÖrnek Tedarikçi;TR60 9999 9000 0000 0000 0012 43\nÖrnek Müşteri;TR29 9999 9000 0000 000A BCD1 2\nÖrnek Şirket;TR29 9999 9000 0000 000A BCD1 23\nÖrnek Personel 1 tekrar;TR609999900000000000001234' },
  ],
  hesap: function (v, H) {
    const r = H.ibanListe(v.liste); const G = r.satirlar.filter((x) => x.gecerli); const IZLE = 300; const gos = r.satirlar.slice(0, IZLE);
    H.dosya = { ad: 'iban-denetimi.csv', tur: 'text/csv;charset=utf-8', icerik: `﻿${H.csvYaz([['Satır', 'Ad', 'IBAN', 'Sonuç', 'Kod'], ...r.satirlar.map((x) => [x.satir, x.etiket, x.grup, x.gecerli ? (x.onceki ? `Geçerli, ${x.onceki}. satırla aynı` : 'Geçerli') : x.hata, x.kod])], ';')}` };
    const sat = gos.map((x) => `<tr><td>${x.satir}</td><td style="word-break:break-word">${x.etiket ? `<b>${H.esc(x.etiket)}</b><br>` : ''}<span style="font-family:ui-monospace,Consolas,monospace;font-size:13px">${H.esc(x.grup)}</span></td><td style="min-width:128px">${x.gecerli ? `<b style="color:#15803d">Geçerli</b>${x.onceki ? `<br><small>${x.onceki}. satırla aynı</small>` : ''}` : `<b style="color:#dc2626">Hatalı</b><br><small>${H.esc(x.hata)}</small>`}</td></tr>`).join('');
    return `${H.tablo([['Denetlenen', H.sayi(r.satirlar.length)], ['Geçerli', H.sayi(r.gecerli), 1], ['Hatalı', H.sayi(r.hatali)], r.tekrar ? ['Aynı IBAN tekrar ediyor', H.sayi(r.tekrar)] : null])}<div class="ar-tablo-k" style="margin-top:12px"><table class="ar-liste-t"><thead><tr><th>Satır</th><th>IBAN</th><th>Sonuç</th></tr></thead><tbody>${sat}</tbody></table></div>${r.satirlar.length > IZLE ? `<p class="ar-bos" style="margin:8px 0 0">İlk ${IZLE} satır gösteriliyor, indirilen dosyada hepsi var.</p>` : ''}${H.eylemler(H.btn('dosya', 'Sonucu CSV indir'), G.length ? H.btn('kopyala', 'Geçerlileri kopyala', ` data-metin="${H.esc(G.map((x) => x.iban).join('\n'))}"`) : '')}${H.not('Geçerli sonucu yalnız yazımın kurala uyduğunu gösterir. Hesabın açık olduğunu ve kime ait olduğunu göstermez.')}`;
  },
  aciklama: [
    'Toplu maaş, tedarikçi ödemesi veya iade listesi hazırlarken tek bir yanlış rakam bütün satırı geri çevirtebilir. IBAN içindeki iki kontrol basamağı bu tür yazım hatalarını yakalamak için vardır. Bu araç listedeki her satırı TCMB tebliğindeki kurallara göre denetler. Türkiye IBAN\'ı 26 karakterdir: TR, iki kontrol basamağı, beş haneli ödeme hizmeti sağlayıcı kodu, sıfır olması gereken bir rezerv alan ve 16 karakterlik hesap alanı. Kontrol basamakları MOD 97-10 yöntemiyle sınanır.',
    'Araç tek numarayla sınırlı değildir, bütün listeyi bir kerede denetler. Excel\'den ad ve IBAN sütunlarını birlikte yapıştırırsınız, araç IBAN hücresini kendisi bulur. Boşluk, tire ve küçük harf temizlenir. Her hatalı satır için neden yazılır: eksik karakter, Türkçe harf, sıfır olmayan rezerv alan ya da tutmayan kontrol basamağı. Aynı IBAN listede iki kez geçiyorsa önceki satır numarası gösterilir, böylece bir kişiye çift ödeme yapılması önlenebilir. Sonuç CSV olarak indirilebilir.',
    'Bu aracın söyleyemeyeceği şeyleri bilmek gerekir. Geçerli sonuç, numaranın yazım kuralına uyduğunu gösterir; hesabın gerçekten açık olduğunu, kapanmadığını veya verdiğiniz kişiye ait olduğunu göstermez. Bunu yalnız bankanız, ödeme talimatı sırasında alıcı adını eşleştirerek doğrulayabilir. Yüksek tutarlı ödemede ekranda alıcı adını kontrol edin. MOD 97-10 hataların çok büyük bölümünü yakalar ama her olasılığı yakalamaz. Araç banka adı da yazmaz, çünkü güncel resmî kod listesini doğrulayamadık. Yalnız TR ile başlayan numaralar denetlenir.',
  ],
  ornek: { baslik: 'Kullanım örneği: maaş listesinde iki hane yer değiştirince', metin: [
    'Bir muhasebeci 40 kişilik maaş listesini bankaya yüklemeden önce denetliyor. Excel\'de ad ve IBAN sütunlarını seçip kutuya yapıştırıyor. Sayfadaki örnekte üçüncü satırın son haneleri 1234 yerine 1243 yazılmış. Bu satır kontrol basamağı tutmuyor uyarısı alır, çünkü iki hanenin yer değiştirmesi hesabın sonucunu bozar.',
    'Dördüncü satır bir karakter eksik olduğu için 25 karakter uyarısı verir. Son satır geçerlidir ama birinci satırla aynı olduğu için ayrıca işaretlenir. Hesap alanında harf bulunabilir, tebliğ bu alanı sayısal ve alfabetik karakter olarak tanımlar, bu yüzden beşinci satırdaki harfli hesap numarası hata sayılmaz. Muhasebeci yalnız hatalı satırların doğrusunu çalışandan ister.',
  ] },
  sss: [
    ['IBAN\'dan hesap sahibinin adı öğrenilir mi?', 'Hayır. Numaranın içinde ad bilgisi yoktur. Alıcı adı yalnız bankanın ödeme ekranında eşleşir.'],
    ['IBAN\'dan banka anlaşılır mı?', 'Beşinci ile dokuzuncu karakterler ödeme hizmeti sağlayıcı kodudur ve bu kodları TCMB belirler. Araç güncel resmî listeyi doğrulayamadığı için banka adı yazmaz.'],
    ['Listeyi yapıştırmak güvenli mi?', 'Denetim tarayıcınızda yapılır, liste sunucuya gönderilmez ve kaydedilmez. Sayfayı kapatınca kaybolur.'],
    ['Yabancı IBAN denetlenir mi?', 'Hayır. Ülkelere göre uzunluk ve yapı değiştiği için bu araç yalnız Türkiye IBAN\'ını denetler.'],
    ['Geçerli çıkan IBAN\'a para kesin gider mi?', 'Bu garanti edilemez. Hesap kapanmış olabilir veya başka birine ait olabilir. Ödeme sırasında alıcı adını kontrol edin.'],
  ],
};
