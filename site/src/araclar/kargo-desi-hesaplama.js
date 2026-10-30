const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'kargo-desi-hesaplama', kategori: 'ticaret', sira: 2, renk: '#0891b2', guncelleme: GUNCELLEME, ilgili: ['pazaryeri-komisyon-hesaplama'],
  ad: 'Kargo Desi Hesaplama', kisa: 'Paket ölçüsünden desiyi bulun, taşıyıcınızın böleniyle hesaplayın',
  baslik: 'Kargo Desi Hesaplama — En, Boy, Yükseklikten Desi Bulma | NEBSOFT',
  ozet: 'Paketin en, boy ve yüksekliğini santimetre olarak girin, taşıyıcınızın bölenini yazın; koli başına ve toplam desiyi, gerçek ağırlıkla karşılaştırmayı anında görün.',
  uyari: 'Bölen değeri taşıyıcıya, sözleşmeye ve gönderi türüne göre değişebilir. Kargo firmalarının bağlayıcı bir değerini resmî olarak doğrulayamadığımız için sayfada hazır bölen yoktur; değeri sözleşmenizden veya fiyat listenizden girin.',
  program: { slug: 'kargotakipprogrami', metin: 'Kargo şubesi veya kurye işletiyorsanız Kargo programı gönderi kabulünde desi ve tarife kademesini kendisi uygular, etiket ve takibi üretir.' },
  alanlar: [
    { ad: 'en', etiket: 'En (cm)', tip: 'sayi', deger: '40', gerekli: true }, { ad: 'boy', etiket: 'Boy (cm)', tip: 'sayi', deger: '30', gerekli: true },
    { ad: 'yukseklik', etiket: 'Yükseklik (cm)', tip: 'sayi', deger: '20', gerekli: true },
    { ad: 'bolen', etiket: 'Taşıyıcının böleni', tip: 'sayi', gerekli: true, yer: 'Sözleşmenizden', ipucu: 'Fiyat listenizde veya sözleşmenizde yazar.' },
    { ad: 'adet', etiket: 'Koli adedi', tip: 'sayi', deger: '1' }, { ad: 'kg', etiket: 'Koli başına ağırlık (kg)', tip: 'sayi', ipucu: 'İsteğe bağlı, karşılaştırma için' },
  ],
  hesap: function (v, H) {
    const r = H.desi(v);
    return H.tablo([['Koli başına desi', H.sayi(r.tek), v.adet > 1 ? 0 : 1], v.adet > 1 && ['Toplam desi', H.sayi(r.toplam), 1], v.kg > 0 && ['Toplam gerçek ağırlık', `${H.sayi(r.kgToplam)} kg`], v.kg > 0 && ['Büyük olan değer', H.sayi(r.buyuk)]]) + H.not('Kısa kenarda birkaç santimetre fazla ölçülen koli daha yüksek kademeye geçebilir. Ölçüyü paketin en geniş yerinden alın.');
  },
  aciklama: [
    'Desi, kargo firmalarının paketin kapladığı hacmi ücrete çevirmek için kullandığı birimdir. Hafif ama büyük bir koli, kamyonda ağır bir paket kadar yer tutar; bu yüzden fiyatlandırma yalnız kiloya göre yapılmaz. Hesap en, boy ve yüksekliğin çarpılıp taşıyıcının belirlediği bölene bölünmesiyle bulunur.',
    'Bölen sayfada hazır gelmez, çünkü bu değer firmaya, sözleşmeye, yurt içi veya yurt dışı gönderiye göre farklı olabilir. Satıcı panelinizde, kargo sözleşmenizde ya da fiyat tablonuzda yazan değeri girmeniz gerekir. Yanlış bölenle yapılan hesap, kargo faturası geldiğinde sürpriz yaratır.',
    'Uygulamada taşıyıcılar çoğunlukla desi ile gerçek ağırlığı karşılaştırıp yüksek olanı esas alır, ama kesin kural sözleşmenizdedir. Bu nedenle ağırlık girerseniz iki değer yan yana gösterilir. Çok koliden oluşan gönderilerde koli adedini de yazın: toplam desi tarife kademesini belirleyebilir. Ambalajınızı birkaç santimetre küçültmek bazen bir alt kademeye düşmenizi sağlar ve her siparişte kazanç bırakır.',
  ],
  ornek: { baslik: 'Kullanım örneği: 40 × 30 × 20 cm koli', metin: [
    'Bir e-ticaret satıcısı 40 cm en, 30 cm boy ve 20 cm yüksekliğinde koli kullanıyor. Ölçülerin çarpımı 24.000 eder. Sözleşmesinde bölenin 3000 olarak yazdığını varsayalım: koli başına sonuç 8 desi olur. Sizin böleniniz farklıysa sonuç da değişir.',
    'Koli 4 kg geliyorsa desi daha yüksek çıktığı için ücret büyük olasılıkla desi üzerinden yansır. Satıcı yüksekliği 15 cm’e indiren bir kutuya geçerse aynı bölenle 6 desiye düşer. Fark, her siparişte kargo faturasına yansır ve Pazaryeri Komisyon aracında kârı doğrudan artırır.',
  ] },
  sss: [
    ['Desi nasıl hesaplanır?', 'En, boy ve yükseklik santimetre olarak çarpılır, sonuç taşıyıcının böleniyle bölünür. Bölen sözleşmenizde yazar.'],
    ['Bölen neden boş geliyor?', 'Değer firmaya ve gönderi türüne göre değişebildiği ve bağlayıcı resmî bir değer doğrulayamadığımız için kendiniz girersiniz. Böylece sonuç gerçek sözleşmenize uyar.'],
    ['Kilo mu desi mi esas alınır?', 'Birçok taşıyıcı yüksek olanı esas alır, ancak kesin kural sözleşmenizde yazar. Araç iki değeri yan yana gösterir.'],
    ['Küsuratlı desi yuvarlanır mı?', 'Yuvarlama kuralı taşıyıcıya göre değişir. Araç iki ondalıkla gösterir; faturadaki kademe için tarifenize bakın.'],
  ],
};
