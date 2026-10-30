const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-bolme', kategori: 'pdf', sira: 2, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['pdf-birlestirme', 'pdf-sayfa-duzenleme', 'pdf-resme-cevirme'],
  ad: 'PDF Bölme', kisa: 'PDF dosyasını sayfa aralıklarına veya eşit parçalara ayırın',
  baslik: 'PDF Bölme — PDF Sayfa Ayırma ve Parçalara Bölme | NEBSOFT',
  ozet: 'PDF\'ten istediğiniz sayfaları ayırın veya dosyayı her 10 sayfada bir bölün. Her aralık ayrı dosya olur, ZIP olarak iner. PDF internete yüklenmez, üyelik gerekmez.',
  sonucBaslik: 'Oluşan dosyalar', aciklamaBaslik: 'PDF dosyası nasıl bölünür, sayfalar nasıl ayrılır?',
  program: { slug: 'hukukburosuprogrami', metin: 'Dosya ve duruşma takibi yapıyorsanız Hukuk Bürosu programı dava ve icra dosyalarını, süreleri, masrafları ve müvekkil portalını tek yerde tutar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'kip', etiket: 'Bölme şekli', tip: 'secim', deger: 'aralik', genis: true, secenekler: [['aralik', 'Yazdığım aralıklara göre'], ['her', 'Her N sayfada bir dosya']] },
    { ad: 'aralik', etiket: 'Sayfa aralıkları', deger: '1-3, 4-', genis: true, goster: 'kip=aralik', ipucu: 'Her virgül ayrı dosyadır. Örnek: 1-3, 7, 10-' },
    { ad: 'her', etiket: 'Dosya başına sayfa', tip: 'sayi', deger: '1', goster: 'kip=her', ipucu: '1 yazarsanız her sayfa ayrı dosya olur' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'PDF\'i böl')) : H.not('PDF seçtiğinizde bölme düğmesi burada görünür.'); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const f = v.dosyalar[0]; const d = await H.pdfYukle(f); const top = d.getPageCount(); const g = H.bolmeGruplari(top, { kip: v.kip, aralik: v.aralik, her: v.her }); if (g.length > 500) throw new Error(`${g.length} dosya oluşacak. Daha büyük parçalar seçin.`);
    for (let i = 0; i < g.length; i++) { c.ilerle(i / g.length, `Dosya ${i + 1} / ${g.length}`); if (c.iptal()) return ''; const o = await L.PDFDocument.create(); (await o.copyPages(d, g[i])).forEach((p) => o.addPage(p)); const a = g[i][0] + 1, b = g[i][g[i].length - 1] + 1; H.cikti(H.dosyaAdi(f.name, a === b ? `s${a}` : `s${a}-${b}`, 'pdf'), await H.pdfBlob(o)); }
    return `${H.tablo([['Kaynak sayfa', top], ['Oluşan dosya', g.length, 1]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'PDF bölme, tek bir dosyanın belirli sayfalarını çıkarıp yeni dosya yapar. Yüz sayfalık bir taramadan yalnız üç sayfalık sözleşmeyi almak, toplu çekilen e-Devlet çıktısını kişilere ayırmak ya da e-posta sınırına takılan büyük bir dosyayı parçalamak için kullanılır. Özgün PDF değişmez, her parça yeni bir dosya olarak oluşur ve adında hangi sayfaları içerdiği yazar.',
    'İki bölme yolu vardır. Aralık yönteminde virgülle ayırdığınız her bölüm ayrı bir dosya olur: "1-3, 7, 10-" yazarsanız birinci dosya ilk üç sayfa, ikincisi yalnız yedinci sayfa, üçüncüsü onuncu sayfadan sona kadar olan kısımdır. Sondaki tire "dosyanın sonuna kadar" anlamına gelir. Eşit parça yönteminde ise her N sayfada bir yeni dosya başlar; 1 yazmak bütün sayfaları tek tek ayırır.',
    'Sayfaları ayırmak ile silmek farklı işlerdir. Tek bir dosyadan birkaç sayfayı atıp kalanını tek dosya olarak tutmak istiyorsanız PDF Sayfa Düzenleme aracı daha uygundur, çünkü sayfaları görerek çalışırsınız. Bu aracın işlemi sayfaları yeniden çizmez, olduğu gibi kopyalar, bu yüzden yazılar seçilebilir kalır. Parçaların toplam boyutu özgün dosyadan biraz büyük çıkabilir, çünkü ortak yazı tipleri her parçaya ayrı kopyalanır.',
  ],
  ornek: { baslik: 'Kullanım örneği: tarayıcıdan çıkan toplu dosya', metin: [
    'Bir ofiste 24 sayfalık tek bir tarama var; içinde her biri 2 sayfa olan on iki personel sözleşmesi bulunuyor. Her N sayfada bir seçeneğine 2 yazılır. Araç on iki dosya üretir, adları sayfa numarasını taşır, hepsi ZIP olarak iner.',
    'Bir avukat 80 sayfalık dosyadan yalnız 12-14 ve 30. sayfaları mahkemeye sunacak. Aralığa "12-14, 30" yazarsa iki dosya alır. Bunların tek dosyada olmasını isterse iki sonucu PDF Birleştirme aracında birleştirir.',
  ] },
  sss: [
    ['PDF\'ten tek sayfa nasıl çıkarılır?', 'Aralık alanına yalnız o sayfa numarasını yazın, örneğin 5. Yalnız o sayfadan oluşan bir dosya iner.'],
    ['Her sayfayı ayrı PDF yapabilir miyim?', 'Evet. Her N sayfada bir seçeneğini seçip 1 yazın.'],
    ['Özgün dosyam değişir mi?', 'Hayır. Araç cihazınızdaki dosyaya yazmaz, yeni dosyalar üretir.'],
    ['Şifreli PDF bölünür mü?', 'Hayır. Araç parola korumalı dosyayı işlemez ve bunu size söyler. Önce parolayı kaldırmanız gerekir.'],
  ],
};
