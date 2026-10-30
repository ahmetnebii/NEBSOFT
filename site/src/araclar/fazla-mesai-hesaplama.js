const { GUNCELLEME, IS } = require('./_kaynak');
module.exports = {
  slug: 'fazla-mesai-hesaplama', kategori: 'calisma', sira: 3, mevzuat: true, renk: '#0f766e', guncelleme: GUNCELLEME, kaynaklar: [IS('madde 41', 'fazla çalışma ücreti, 270 saat sınırı'), IS('madde 47', 'genel tatil ücreti'), IS('madde 63', 'haftalık 45 saat')], ilgili: ['satis-primi-hesaplama', 'kidem-tazminati-hesaplama'],
  ad: 'Fazla Mesai Hesaplama', kisa: 'Yüzde 50 ve yüzde 25 zamlı saat ücreti ile genel tatil ücretini hesaplayın',
  baslik: 'Fazla Mesai Hesaplama — Yüzde 50 Zamlı Saat Ücreti, 270 Saat | NEBSOFT',
  ozet: 'Brüt ücret ve fazla çalışma saatinden mesai ücretini İş Kanunu md. 41’e göre hesaplayın: yüzde 50 ve yüzde 25 zamlı saatler, genel tatil günü ve yıllık 270 saat sınırı uyarısı.',
  uyari: 'Sonuç brüt tutardır, net ücret için bordrodaki kesintiler gerekir. Toplu sözleşmeniz veya iş sözleşmeniz daha yüksek zam öngörebilir. Hafta tatili çalışması ve vardiya özel durumları bu araçta yoktur.',
  program: { slug: 'personeltakipprogrami', metin: 'Personel programında puantajdaki fazla mesai saatleri bordroya kendiliğinden işlenir, her ay aynı hesabı elle yapmanız gerekmez.' },
  alanlar: [
    { ad: 'brut', etiket: 'Aylık brüt ücret (₺)', tip: 'para', deger: '36000', gerekli: true },
    { ad: 'aylikSaat', etiket: 'Aylık çalışma saati', tip: 'sayi', deger: '225', ipucu: '45 saatlik haftada 30 gün × 7,5 saat. Sözleşmeniz farklıysa değiştirin.' },
    { ad: 'saat50', etiket: 'Fazla çalışma saati (%50)', tip: 'sayi', deger: '12', ipucu: 'Haftalık 45 saati aşan süre' },
    { ad: 'saat25', etiket: 'Fazla sürelerle çalışma (%25)', tip: 'sayi', ipucu: 'Haftalık süre 45’ten azsa, 45’e kadar olan kısım' },
    { ad: 'tatilGun', etiket: 'Çalışılan genel tatil günü', tip: 'sayi' },
    { ad: 'yilToplam', etiket: 'Bu yıl önceki fazla çalışma (saat)', tip: 'sayi', ipucu: '270 saat kontrolü için' },
  ],
  hesap: function (v, H) {
    const r = H.fazlaMesai({ ...v, aylikSaat: v.aylikSaat || 225 });
    return H.tablo([['Normal saat ücreti', H.tl(r.saatUcret)], ['%50 zamlı saat ücreti', H.tl(r.saatUcret * 1.5)], v.saat50 > 0 && ['Fazla çalışma ücreti', H.tl(r.t50)], v.saat25 > 0 && ['Fazla sürelerle çalışma ücreti', H.tl(r.t25)], v.tatilGun > 0 && ['Genel tatil ek ücreti', H.tl(r.tatil)], ['Toplam ek brüt ücret', H.tl(r.toplam), 1], r.serbestZaman > 0 && ['Serbest zaman karşılığı', `${H.sayi(r.serbestZaman)} saat`]]) + (r.sinirAsildi ? H.not('Yıllık fazla çalışma 270 saati aşıyor. Kanundaki sınırı aşmamalısınız.', 'uyari') : '');
  },
  aciklama: [
    'İş Kanununa göre haftalık çalışma süresi en çok 45 saattir ve bunu aşan her saat fazla çalışmadır. Madde 41, fazla çalışılan her saatin normal saat ücretinin yüzde 50 fazlasıyla ödenmesini ister. Sözleşmede haftalık süre 45 saatin altında kararlaştırılmışsa, 45 saate kadar olan kısım fazla sürelerle çalışma sayılır ve yüzde 25 zamlı ödenir.',
    'Saat ücreti için aylık brüt, aylık çalışma saatine bölünür. Alandaki 225 değeri, 30 günlük ayın 7,5 saatlik çalışmayla çarpımından gelen uygulama varsayımıdır; sözleşmeniz farklıysa değiştirin. Araç işveren bordrosu için ek ücreti brüt gösterir, gelir vergisi ve sigorta kesintilerini yapmaz.',
    'Kanun fazla çalışmayı yılda 270 saatle sınırlar. Önceki saatleri yazarsanız sınır aşımı uyarısı alırsınız. Çalışan isterse ücret yerine serbest zaman kullanabilir: her fazla saat için 1,5 saat, fazla süreli saat için 1,25 saat. Araç bu karşılığı da gösterir. Genel tatil gününde çalışanlara ise madde 47 gereği çalıştıkları her gün için ek bir günlük ücret ödenir.',
  ],
  ornek: { baslik: 'Kullanım örneği: ay sonu mesai', metin: [
    'Aylık brüt ücreti 36.000 ₺ olan bir kasiyer 12 saat fazla çalışmıştır. 225 saate bölünen saat ücreti 160 ₺, yüzde 50 zamlı saat 240 ₺ olur. On iki saat için ek brüt ücret 2.880 ₺ çıkar.',
    'Aynı ay bir genel tatilde de çalıştıysa 1.200 ₺ ek günlük ücret eklenir, toplam 4.080 ₺ görünür. Ücret yerine serbest zaman tercih ederse 18 saat izin karşılığı hesaplanır. Yıl içindeki önceki saatleri yazınca 270 saat sınırına yaklaşılıp yaklaşılmadığı kontrol edilir.',
  ] },
  sss: [
    ['Fazla mesai saat ücreti nasıl hesaplanır?', 'Aylık brüt ücret aylık çalışma saatine bölünür, çıkan saat ücreti 1,5 ile çarpılır.'],
    ['Yılda en fazla kaç saat fazla mesai yapılır?', 'İş Kanunu md. 41’e göre yıllık sınır 270 saattir.'],
    ['Yüzde 25 ne zaman uygulanır?', 'Sözleşmedeki haftalık süre 45 saatin altındaysa, sözleşme süresini aşan ve 45 saate kadar olan çalışmada uygulanır.'],
    ['Net ödeme neden farklı?', 'Araç brüt tutarı gösterir. Bordroda sigorta primi ve vergi kesintileri uygulandıktan sonra net tutar belli olur.'],
  ],
};
