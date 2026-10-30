const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'altin-ayar-hesaplama', kategori: 'emlak', sira: 4, renk: '#a16207', guncelleme: GUNCELLEME,
  ad: 'Altın Ayar ve Has Hesaplama', kisa: 'Gram ve ayardan has altını, güncel fiyatınızla değerini bulun',
  baslik: 'Altın Ayar Hesaplama — Gramdan Has Altın, Milyem ve Değer | NEBSOFT',
  ozet: 'Altının gramını ve ayarını girin, saf altın miktarını bulun; has gram fiyatınızı ve işçiliği ekleyerek değeri hesaplayın. Damgada yazan milyemi de doğrudan kullanabilirsiniz.',
  uyari: 'Fiyat bilgisi içermez; has gram fiyatını kendiniz girersiniz. Gerçek alış ve satış tutarı kuyumcunun kesintisine, işçiliğe ve ürünün durumuna göre değişir. Yatırım tavsiyesi değildir.',
  program: { slug: 'kuyumcuprogrami', metin: 'Kuyumcuysanız Kuyumcu programı kur tablosunu, ayar fiyatlarını, gramlı satışı ve hurda alışını has üzerinden tek ekranda yürütür.' },
  alanlar: [
    { ad: 'gram', etiket: 'Ağırlık (gram)', tip: 'sayi', deger: '10', gerekli: true },
    { ad: 'ayar', etiket: 'Ayar', tip: 'secim', deger: '22', secenekler: [['24', '24 ayar'], ['22', '22 ayar'], ['21', '21 ayar'], ['18', '18 ayar'], ['14', '14 ayar'], ['8', '8 ayar']] },
    { ad: 'milyem', etiket: 'Damgadaki milyem (‰)', tip: 'sayi', yer: 'Damgada yazıyorsa', ipucu: 'Doluysa ayar yerine bu saflık kullanılır.' },
    { ad: 'hasFiyat', etiket: 'Has altın gram fiyatı (₺)', tip: 'para', yer: 'Kendi fiyatınız', ipucu: 'Değer hesabı için, kuyumcunuzdan veya piyasadan alın' },
    { ad: 'iscilik', etiket: 'Gram başına işçilik (₺)', tip: 'para' },
  ],
  hesap: function (v, H) {
    const r = H.altin({ gram: v.gram, ayar: H.sayiOku(v.ayar), milyem: v.milyem, hasFiyat: v.hasFiyat, iscilik: v.iscilik });
    return H.tablo([['Saflık', `%${H.sayi(r.saflik * 100, 2)} (binde ${H.sayi(r.saflik * 1000, 1)})`], ['Has altın', `${H.sayi(r.has, 3)} gram`, 1], r.deger != null && ['Altın değeri', H.tl(r.deger)], r.iscilik > 0 && ['İşçilik', H.tl(r.iscilik)], r.toplam != null && ['Toplam', H.tl(r.toplam), 1]]) + (r.toplam == null ? H.not('Değer hesabı için has altın gram fiyatını girin.') : '');
  },
  aciklama: [
    'Ayar, altının içindeki saf altın oranını 24 üzerinden gösterir. 22 ayar, 24 parçanın 22’sinin saf altın olduğu anlamına gelir. Bu yüzden 10 gram 22 ayar bileziğin içinde 10 gram değil, yaklaşık 9,17 gram saf altın vardır. Kuyumcular buna has der ve alışverişte fiyat çoğunlukla has üzerinden konuşulur. Bu araç gram ve ayardan has miktarını bulur.',
    'Araç hesapta ayarı 24’e böler. Ancak piyasada bazı ayarlar yuvarlanmış milyem ile damgalanır; örneğin 14 ayarda 583 ve 585 değerlerine rastlanır. Kaynaklar bu konuda farklı değerler gösterdiği ve geçerli bir resmî tablo doğrulayamadığımız için sayfaya kendi tablomuzu koymadık. Ürünün damgasında milyem yazıyorsa alana yazın, hesap o değere göre yapılsın.',
    'Sayfada canlı fiyat yoktur; fiyat bilgisini kendiniz girersiniz. Bunun iki nedeni var: sayfa hiçbir dış servise istek atmaz ve gösterilen fiyatın kuyumcunuzun fiyatıyla aynı olması beklenemez. Değer hesabı ürünün geri satış tutarını garanti etmez, çünkü işçilik genellikle geri alınmaz ve kuyumcu kesinti uygular.',
  ],
  ornek: { baslik: 'Kullanım örneği: 10 gram 22 ayar bilezik', metin: [
    'Bir müşteri 10 gram 22 ayar bileziğinin has karşılığını merak ediyor. Hesap 10 çarpı 22 bölü 24 ile 9,167 gram has altın verir. Bileziğin damgasında 916 yazıyorsa milyem alanına yazıldığında sonuç 9,160 gram olur.',
    'Kuyumcudan öğrendiği has gram fiyatını yazınca altın değeri çıkar. Gram başına işçilik girerse satış fiyatına yakın bir toplam görür. Elindeki eski ürünü bozdururken işçilik alanını boş bırakmak, daha gerçekçi bir karşılaştırma sağlar.',
  ] },
  sss: [
    ['Has altın ne demek?', 'Alaşımdan arındırılmış saf altın miktarıdır. Takının gramı ile ayar oranının çarpımıyla bulunur.'],
    ['22 ayar altında yüzde kaç altın var?', 'Ayar 24 üzerinden okunur: 22 bölü 24 yaklaşık yüzde 91,67 eder. Damgadaki milyem farklıysa o değeri girin.'],
    ['14 ayar 583 mü 585 mi?', 'Kaynaklarda iki değer de geçer. Araç ayarı 24’e böler; ürününüzde 585 yazıyorsa milyem alanını kullanın.'],
    ['Altın fiyatı neden otomatik gelmiyor?', 'Sayfa dış servise bağlanmaz. Doğru sonuç için alış yapacağınız yerin fiyatını kendiniz girersiniz.'],
  ],
};
