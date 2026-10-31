const { GUNCELLEME_T } = require('./_kaynak-ticaret');
module.exports = {
  slug: 'ortalama-vade-hesaplama', kategori: 'ticaret', sira: 8, renk: '#1d4ed8', guncelleme: GUNCELLEME_T, ilgili: ['nakit-akisi-hesaplama', 'zincirleme-iskonto-hesaplama', 'tahsilat-makbuzu-olusturucu'],
  ad: 'Ortalama Vade Hesaplama', kisa: 'Farklı tarihli çek ve senetleri tutar ağırlıklı tek vadeye indirin',
  baslik: 'Ortalama Vade Hesaplama: Çek ve Senet Vadesi Bulma | NEBSOFT',
  ozet: 'Çek ve senetlerin tutarını ve tarihini girin, tutar ağırlıklı ortalama vadeyi tarih olarak görün. Aylık oran yazarsanız basit vade farkı da hesaplanır.',
  sonucBaslik: 'Ortalama vade', aciklamaBaslik: 'Ortalama vade ne için kullanılır?',
  program: { slug: 'onmuhasebeprogrami', metin: 'Çek ve senetleriniz çoksa Ön Muhasebe programındaki portföy her evrakın vadesini tutar, tahsilat ve ödemeyi hatırlatır.' },
  alanlar: [
    { ad: 'tarih', etiket: 'Hesap tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'aylikFark', etiket: 'Aylık vade farkı (%, isteğe bağlı)', tip: 'yuzde', ipucu: 'Aranızda anlaştığınız oran, araçta hazır oran yok' },
    { ad: 'cekler', tip: 'satirlar', etiket: 'Çek ve senetler', ekle: 'Evrak ekle', sutunlar: [{ ad: 'tutar', etiket: 'Tutar (₺)', tip: 'para' }, { ad: 'vade', etiket: 'Vade tarihi', tip: 'tarih' }], satir: [{ tutar: '50000', vade: '2027-01-15' }, { tutar: '30000', vade: '2027-03-01' }, { tutar: '20000', vade: '2027-04-30' }] },
  ],
  hesap: function (v, H) {
    const r = H.ortalamaVade({ satirlar: v.cekler, tarih: v.tarih, aylikFark: v.aylikFark }); const gunYazi = (g) => (g < 0 ? `${H.sayi(-g, 1)} gün geçmiş` : `${H.sayi(g, 1)} gün sonra`);
    return H.tablo([['Ortalama vade tarihi', H.tarihTR(r.ortalamaTarih), 1], ['Hesap tarihine uzaklık', gunYazi(r.gun)], ['Toplam tutar', H.tl(r.toplam)], v.aylikFark > 0 ? [`Vade farkı (aylık %${H.sayi(v.aylikFark)})`, H.tl(r.vadeFarki)] : null])
      + `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Vade</th><th class="r">Tutar</th><th class="r">Gün</th></tr></thead><tbody>${r.satirlar.map((x) => `<tr><td>${H.tarihTR(x.vade)}</td><td class="r">${H.tl(x.tutar)}</td><td class="r">${H.sayi(x.gun, 0)}</td></tr>`).join('')}</tbody></table></div>`
      + (r.gun < 0 ? H.not('Ortalama vade hesap tarihinden önce kalıyor. Vade farkı yalnız ileri vade için hesaplanır, geçmiş vadede sıfır gösterilir.', 'uyari') : '');
  },
  aciklama: [
    'Bir müşteriden farklı tarihli dört çek aldınız, tedarikçiniz de “ortalama kaç günlük ödüyorsun” diye soruyor. Basit ortalama burada yanlış sonuç verir, çünkü 100.000 ₺’lik çek ile 5.000 ₺’lik senet aynı ağırlığı taşımaz. Ortalama vade her evrakın tutarını gün sayısıyla çarpar, toplamı toplam tutara böler. Çıkan gün, bütün ödemenin tek seferde yapıldığı varsayılsa geleceği tarihtir.',
    'Bu tarih üç yerde işe yarar. Toplu ödeme yaparken karşılığında tek çek yazacaksanız vadesini buradan bulursunuz. Alıcıya verdiğiniz ortalama vadeyle tedarikçinin size verdiği vadeyi karşılaştırır, aradaki günlerde kasanın kimi finanse ettiğini görürsünüz. Yeni bir sevkiyatta vade pazarlığında da elinizde somut bir gün sayısı olur.',
    'Aylık vade farkı alanı isteğe bağlıdır ve oranı siz yazarsınız. Araç bileşik faiz uygulamaz: toplam tutar, aylık oran ve otuza bölünmüş gün çarpılır. Hesap tarihini değiştirmek ortalama tarihi değiştirmez, yalnız kalan gün sayısını ve vade farkını değiştirir. Sonuç tam güne yuvarlanır. Araç evrakın karşılıksız kalma riskini, banka iskontosunu ve faturaya yansıyan vade farkının vergisini hesaba katmaz.',
  ],
  ornek: { baslik: 'Örnek: 100.000 ₺ tutarında üç evrak', metin: [
    '1 Kasım 2026 hesap tarihinde elinizde 50.000 ₺ 15 Ocak, 30.000 ₺ 1 Mart ve 20.000 ₺ 30 Nisan 2027 vadeli üç evrak olsun. Gün sayıları 75, 120 ve 180’dir. Tutarla çarpılan günlerin toplamı 10.950.000 eder, 100.000 ₺’ye bölününce 109,5 gün bulunur.',
    'Ortalama vade 19 Şubat 2027’ye denk gelir. Basit ortalama 125 gün çıkardı, yani büyük çekin yakın tarihli olması hesabı on beş gün öne çekiyor. Tarafların aylık yüzde 3 üzerinde anlaştığını varsayarsak basit vade farkı 100.000 × 0,03 × 109,5 ÷ 30 = 10.950 ₺ olur.',
  ] },
  sss: [
    ['Ortalama vade formülü nedir?', 'Her evrakta tutar ile gün çarpılır, çarpımlar toplanır ve toplam tutara bölünür.'],
    ['Geçmiş tarihli evrak girebilir miyim?', 'Evet. Gün sayısı eksi olur ve ortalamaya eksi olarak girer. Sonuç geçmişte kalırsa sayfa bunu belirtir.'],
    ['Hesap tarihi sonucu değiştirir mi?', 'Ortalama tarih aynı kalır. Değişen şey o tarihe kalan gün sayısı ve vade farkıdır.'],
    ['Vade farkı oranı kaç olmalı?', 'Oran taraflar arasında belirlenir, araç bir oran önermez. Hazır değer bulunmamasının nedeni de budur.'],
    ['Sonuç neden tam güne yuvarlanıyor?', 'Çek ve senet vadesi tam gündür. 109,5 gün gibi bir sonuç en yakın güne yuvarlanır, vade farkı ise küsuratlı gün üzerinden hesaplanır.'],
  ],
};
