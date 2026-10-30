const { GUNCELLEME, IS, DAMGA } = require('./_kaynak');
module.exports = {
  slug: 'ihbar-tazminati-hesaplama', kategori: 'calisma', sira: 2, mevzuat: true, renk: '#c2410c', guncelleme: GUNCELLEME, kaynaklar: [IS('madde 17', 'bildirim süreleri'), DAMGA], ilgili: ['kidem-tazminati-hesaplama', 'yillik-izin-hesaplama'],
  ad: 'İhbar Tazminatı Hesaplama', kisa: 'Çalışma süresine göre bildirim süresini ve ihbar tazminatını bulun',
  baslik: 'İhbar Tazminatı Hesaplama — 2, 4, 6, 8 Hafta Bildirim Süresi | NEBSOFT',
  ozet: 'İş Kanunu md. 17’ye göre çalışma sürenizden bildirim süresini bulun, brüt ücretten ihbar tazminatını hesaplayın. Gelir vergisi diliminizi girerek net tutarı da görün.',
  uyari: 'Araç, tarafın ihbar süresine uymadığı varsayımıyla tutarı hesaplar; tazminat hakkının doğup doğmadığını değerlendirmez. Sözleşmeniz daha uzun süre öngörüyorsa hesap değişir. Kesin sonuç için avukat veya bordro uzmanına danışın.',
  program: { slug: 'personeltakipprogrami', metin: 'Personel programında çıkış işlemi yaparken ihbar süresi ve tutarı çalışanın kaydından gelir, kıdem ve izin alacağıyla birlikte görünür.' },
  alanlar: [
    { ad: 'giris', etiket: 'İşe giriş tarihi', tip: 'tarih', deger: '2024-06-01', gerekli: true }, { ad: 'cikis', etiket: 'Fesih tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'brut', etiket: 'Aylık brüt ücret (₺)', tip: 'para', deger: '40000', gerekli: true }, { ad: 'yanHak', etiket: 'Düzenli yan haklar (aylık ₺)', tip: 'para' },
    { ad: 'gvOrani', etiket: 'Gelir vergisi diliminiz (%)', tip: 'yuzde', yer: 'Bordronuzdan', ipucu: 'Bordrodaki dilimi yazın. Boşsa vergi kesintisi düşülmez.' },
  ],
  hesap: function (v, H) {
    const r = H.ihbar(v);
    return H.tablo([['Çalışma süresi', `${r.sure.yil} yıl ${r.sure.ay} ay ${r.sure.gun} gün`], ['Bildirim süresi', `${r.hafta} hafta (${r.gun} gün)`, 1], ['Brüt ihbar tazminatı', H.tl(r.tazminat)], v.gvOrani > 0 && [`Gelir vergisi (%${H.sayi(v.gvOrani)})`, H.tl(r.gv)], ['Damga vergisi (binde 7,59)', H.tl(r.damga)], [v.gvOrani > 0 ? 'Net tutar' : 'Gelir vergisi öncesi tutar', H.tl(r.net), 1]]) + (v.gvOrani > 0 ? '' : H.not('Gelir vergisi diliminizi girmediniz. Gösterilen tutardan bordrodaki gelir vergisi ayrıca düşülebilir.', 'uyari'));
  },
  aciklama: [
    'Belirsiz süreli iş sözleşmesini sona erdirmek isteyen taraf, karşı tarafa önceden haber vermek zorundadır. İş Kanununun 17. maddesi bu süreleri çalışma süresine bağlar: altı aydan az çalışanda iki hafta, altı aydan bir buçuk yıla kadar dört hafta, bir buçuk yıldan üç yıla kadar altı hafta, üç yıldan fazla çalışanda sekiz hafta. Süreler asgari olduğundan sözleşmeyle uzatılabilir.',
    'Bildirim şartına uymayan taraf, süreye ait ücret tutarında ihbar tazminatı öder. Bu kural işçi için de geçerlidir: ansızın işi bırakan işçi de işverene tazminat borçlu olabilir. Araç, çalışma süresini tam ay ve gün olarak ayırır, sınır günlerini kanun metnine göre değerlendirir ve brüt tutarı hesaplar.',
    'Hesapta aylık ücret 30’a bölünerek günlük ücret bulunur, bildirim günü ile çarpılır. Kıdem tazminatının aksine bu ödeme için Gelir Vergisi Kanununun 25. maddesinde açık bir istisna bulunmaz, dolayısıyla araç gelir vergisi diliminizi ister. Dilimi kişiye ve yıl içindeki kümülatif matraha göre değiştiği için sayfaya sabit yazmadık; bordronuzdan okuyun.',
  ],
  ornek: { baslik: 'Kullanım örneği: iki yıl dört ay çalışan', metin: [
    'Bir çalışanın sözleşmesi Haziran 2024’te başlamış, Ekim 2026’da ihbarsız sona ermiştir. Süre bir buçuk yıl ile üç yıl arasında olduğu için bildirim süresi 6 hafta, yani 42 gündür. Aylık brüt 40.000 ₺ için günlük ücret 1.333,33 ₺, brüt tazminat 56.000 ₺ eder.',
    'Bordrosunda gelir vergisi dilimi yüzde 20 görünüyorsa bu oranı girer, araç vergi ile binde 7,59 damga vergisini düşer. Yan hak varsa aylık tutara eklenir ve sonuç orantılı olarak büyür. Oran bu örnekte yalnız anlatım içindir.',
  ] },
  sss: [
    ['İhbar süreleri kaç hafta?', 'İş Kanunu md. 17’ye göre çalışma süresine bağlı olarak 2, 4, 6 ve 8 haftadır. Sözleşmeyle uzatılabilir.'],
    ['Tam üç yıl çalışan kaç hafta alır?', 'Kanun sekiz haftayı üç yıldan fazla çalışanlara tanır. Tam üç yılda araç altı hafta gösterir, bir gün sonrası sekiz haftaya geçer.'],
    ['Belirli süreli sözleşmede ihbar var mı?', 'Madde 17 belirsiz süreli sözleşmeler içindir. Belirli süreli sözleşmeler için araç sonuç vermez, durumu danışmanınıza sorun.'],
    ['Gelir vergisi oranı neden boş?', 'Dilim kişiye ve yıl içindeki toplam kazanca göre değişir. Doğru oran bordronuzda yazar.'],
  ],
};
