const { GUNCELLEME, TBK, TUIK } = require('./_kaynak');
module.exports = {
  slug: 'kira-artis-hesaplama', kategori: 'emlak', sira: 1, mevzuat: true, renk: '#047857', guncelleme: GUNCELLEME, kaynaklar: [TBK, TUIK], ilgili: ['kira-makbuzu-olusturucu', 'aidat-paylasimi-hesaplama'],
  ad: 'Kira Artış Hesaplama', kisa: 'TÜİK’in açıkladığı TÜFE oranıyla yeni kira tavanını hesaplayın',
  baslik: 'Kira Artış Oranı Hesaplama — TÜFE On İki Aylık Ortalama, TBK 344 | NEBSOFT',
  ozet: 'Mevcut kiranızı ve kira döneminiz için TÜİK’in açıkladığı on iki aylık ortalama TÜFE değişimini girin; TBK md. 344 sınırına göre yeni kirayı ve aylık farkı hesaplayın.',
  uyari: 'Araç genel kuralı uygular. Beş yılı aşan kiralar, yabancı para kira ve sözleşmenizdeki özel hükümler farklı sonuç verebilir. Uyuşmazlıkta avukata danışın.',
  program: { slug: 'emlakprogrami', metin: 'Portföyünüzdeki kira sözleşmelerinin artış tarihini Emlak programı takip eder, yaklaşan yenilemeleri önünüze getirir.' },
  alanlar: [
    { ad: 'kira', etiket: 'Mevcut aylık kira (₺)', tip: 'para', deger: '20000', gerekli: true },
    { ad: 'oran', etiket: 'TÜFE on iki aylık ortalama değişim (%)', tip: 'yuzde', gerekli: true, yer: 'TÜİK verisi', ipucu: 'Kira yılınızın başladığı aydan önceki ay için TÜİK’in açıkladığı oranı yazın.' },
    { ad: 'onerilen', etiket: 'Önerilen yeni kira (₺)', tip: 'para', ipucu: 'İsteğe bağlı: istenen tutar sınırı aşıyor mu?' },
  ],
  hesap: function (v, H) {
    const r = H.kiraArtis(v);
    return H.tablo([['Yeni kira üst sınırı', H.tl(r.yeni), 1], ['Aylık artış', H.tl(r.fark)], ['Yıllık fark', H.tl(r.yillikFark)]]) + (v.onerilen > 0 ? H.not(r.asiyor ? `Önerilen ${H.tl(v.onerilen)} tutarı girdiğiniz orana göre hesaplanan sınırın üzerindedir.` : `Önerilen ${H.tl(v.onerilen)} tutarı sınırın içindedir.`, r.asiyor ? 'uyari' : 'bilgi') : '');
  },
  aciklama: [
    'Türk Borçlar Kanununun 344. maddesi, yenilenen kira dönemleri için tarafların kira bedeli üzerinde anlaşmasını serbest bırakır, ancak bir sınır koyar: anlaşma, bir önceki kira yılında tüketici fiyat endeksindeki on iki aylık ortalamalara göre değişim oranını geçmediği sürece geçerlidir. Bu kural bir yıldan uzun süreli sözleşmelerde de uygulanır. Anlaşma yoksa hâkim, aynı sınırı gözeterek kiralananın durumuna göre bedeli belirler.',
    'Oranı sayfaya sabit yazmadık, çünkü her ay değişir ve kira döneminize göre farklıdır. TÜİK’in Veri Portalında yayımlanan tüketici fiyat endeksi bültenlerinden on iki aylık ortalamalara göre değişim oranını alıp alana girin. Yanlış ayın oranı veya aylık ya da yıllık enflasyon oranını kullanmak, sonucu değiştirir; “on iki aylık ortalama” ifadesine dikkat edin.',
    'Beş yıldan uzun süreli sözleşmelerde ve beş yıl sonra yenilenen dönemlerde, yeni kira yılı için bedel hâkim tarafından TÜFE oranı, kiralananın durumu ve emsal kiralar dikkate alınarak belirlenebilir. Yabancı para kiralarda da özel kural vardır. Bu durumlar için araç yalnız başlangıç noktası verir.',
  ],
  ornek: { baslik: 'Kullanım örneği: kira yenilemesi', metin: [
    'Aylık 20.000 ₺ kira ödeyen bir kiracının sözleşmesi yenilenecektir. TÜİK verisinden ilgili ay için on iki aylık ortalama değişim oranı alınır. Anlatım amacıyla oranın yüzde 30 olduğunu varsayalım: yeni kira üst sınırı 26.000 ₺, aylık fark 6.000 ₺ çıkar. Sizin döneminizin oranı farklı olacaktır.',
    'Mal sahibi 28.000 ₺ önerdiyse önerilen tutar alanına yazılır ve araç bu tutarın hesaplanan sınırı aştığını gösterir. Taraflar sınırın altında da anlaşabilir. Anlaşma yazılı yapıldığında yeni tutar ve dönem başlangıcı sözleşmeye eklenir.',
  ] },
  sss: [
    ['Kira artış oranı neden sayfada yazmıyor?', 'Oran her ay değişir ve dönemize göre farklıdır. Yanlış ay riskini önlemek için TÜİK verisinden kendiniz girersiniz.'],
    ['Hangi oranı kullanmalıyım?', 'TBK md. 344, tüketici fiyat endeksindeki on iki aylık ortalamalara göre değişim oranını esas alır. Aylık veya yıllık enflasyon başka bir orandır.'],
    ['Bu oranın üzerinde anlaşabilir miyiz?', 'Kanun, anlaşmanın bu oranı geçmediği sürece geçerli olacağını söyler. Özel durumunuz için hukukçuya danışın.'],
    ['Beş yılı geçen kiralarda ne olur?', 'Beş yıl sonra yenilenen dönemlerde bedel hâkim tarafından emsal kira ve kiralananın durumuna göre de belirlenebilir.'],
  ],
};
