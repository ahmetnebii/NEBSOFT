const { GUNCELLEME, K1475, GVK, DAMGA, TAVAN } = require('./_kaynak');
module.exports = {
  slug: 'kidem-tazminati-hesaplama', kategori: 'calisma', sira: 1, mevzuat: true, renk: '#b91c1c', guncelleme: GUNCELLEME, kaynaklar: [K1475, TAVAN, GVK, DAMGA], ilgili: ['ihbar-tazminati-hesaplama', 'yillik-izin-hesaplama', 'fazla-mesai-hesaplama'],
  ad: 'Kıdem Tazminatı Hesaplama', kisa: 'Çalışma süresi ve brüt ücretten dönem tavanlı kıdem tazminatını hesaplayın',
  baslik: 'Kıdem Tazminatı Hesaplama 2026 — Tavan, Damga Vergisi, Net Tutar | NEBSOFT',
  ozet: 'İşe giriş ve çıkış tarihi ile giydirilmiş brüt ücrete göre kıdem tazminatını hesaplayın. 2026 dönem tavanı ÇSGB tablosundan seçilir, damga vergisi düşülerek net tutar gösterilir.',
  uyari: 'Araç tutarı hesaplar, hak kazanıp kazanmadığınızı değerlendirmez. Kıdem tazminatına hak kazanma, fesih nedenine bağlıdır. Sonuç bilgilendirme amaçlıdır; kesin tutar için avukat, mali müşavir veya bordro uzmanına danışın.',
  program: { slug: 'personeltakipprogrami', metin: 'Personel programında giriş tarihi ve ücret kayıtlı olduğu için kıdem ve ihbar karşılığını her çalışan için tek tıkla görebilirsiniz; aynı ekranda puantaj ve bordro da vardır.' },
  alanlar: [
    { ad: 'giris', etiket: 'İşe giriş tarihi', tip: 'tarih', deger: '2019-03-15', gerekli: true }, { ad: 'cikis', etiket: 'İşten çıkış tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'brut', etiket: 'Son aylık brüt ücret (₺)', tip: 'para', deger: '45000', gerekli: true },
    { ad: 'yanHak', etiket: 'Düzenli yan haklar (aylık ₺)', tip: 'para', ipucu: 'Yol, yemek, düzenli prim gibi para ve parayla ölçülebilen menfaatler' },
    { ad: 'tavan', etiket: 'Tavanı elle gir (₺)', tip: 'para', ipucu: 'Boşsa çıkış tarihine göre tablodan seçilir' },
  ],
  hesap: function (v, H) {
    H.sure(v.giris, v.cikis); const T = [['2026-01-01', '2026-06-30', 64948.77], ['2026-07-01', '2026-12-31', 73729.87]]; const d = T.find(([a, b]) => v.cikis >= a && v.cikis <= b); const tavan = v.tavan > 0 ? v.tavan : d ? d[2] : null;
    if (!tavan) throw new Error('Bu çıkış tarihi için tavan tablomuzda yok. O döneme ait tavanı Çalışma Bakanlığı tablosundan alıp “Tavanı elle gir” alanına yazın.');
    const r = H.kidem({ giris: v.giris, cikis: v.cikis, brut: v.brut, yanHak: v.yanHak, tavan });
    return H.tablo([['Çalışma süresi', `${r.sure.yil} yıl ${r.sure.ay} ay ${r.sure.gun} gün`], ['Esas aylık ücret', H.tl(r.esas)], [`Uygulanan tavan${v.tavan > 0 ? ' (elle)' : ''}`, H.tl(tavan)], ['Hesaba giren ücret', H.tl(r.uygulanan)], ['Brüt kıdem tazminatı', H.tl(r.tazminat)], ['Damga vergisi (binde 7,59)', H.tl(r.damga)], ['Net kıdem tazminatı', H.tl(r.net), 1]]) + (r.tavanli ? H.not('Ücretiniz tavanı aştığı için hesap tavan üzerinden yapıldı.') : '') + (r.hak ? '' : H.not('Çalışma süresi bir tam yılı doldurmadığı için tutar sıfır gösterildi.', 'uyari'));
  },
  aciklama: [
    'Kıdem tazminatı, 1475 sayılı Kanunun yürürlükte kalan 14. maddesine göre her tam çalışma yılı için 30 günlük ücret tutarında ödenir. Bir yıldan artan süreler de aynı oranda hesaba katılır. Bu araç işe giriş ve çıkış tarihi arasındaki süreyi tam yıl ve kalan gün olarak ayırır, kalan günleri 365’e bölerek orantılar.',
    'Hesaba son brüt ücret girer; ücrete ek olarak sağlanan para ve parayla ölçülebilen menfaatler de dikkate alınır. Bu yüzden düzenli yol, yemek ve benzeri ödemeleri ayrı alana yazın. Kanun yıllık tazminat için bir tavan koyar: Çalışma ve Sosyal Güvenlik Bakanlığı tablosuna göre tavan 01.01.2026–30.06.2026 döneminde 64.948,77 ₺, 01.07.2026–31.12.2026 döneminde 73.729,87 ₺’dir. Araç çıkış tarihine uygun dönemi kendisi seçer. Tablo dışında kalan tarihler için tutar uydurmaz, tavanı elle girmenizi ister.',
    'Gelir Vergisi Kanunu md. 25/7 uyarınca kıdem tazminatı gelir vergisinden istisnadır; bu nedenle yalnız binde 7,59 damga vergisi düşülür. Düzenli olmayan ikramiye veya prim varsa hesabı yetkiliye doğrulatın, çünkü kanun değişken ücrette son bir yıl ortalamasını esas alır.',
  ],
  ornek: { baslik: 'Kullanım örneği: yedi yılı aşkın çalışan', metin: [
    'Bir çalışan 15 Mart 2019’da başlamış, 31 Ekim 2026’da ayrılmıştır. Son brüt ücreti 45.000 ₺, düzenli yan hakkı 5.000 ₺’dir. Esas ücret 50.000 ₺ olur ve tavanın altındadır. Süre 7 tam yıl ve 230 gündür, tazminat yaklaşık 7,63 aylık ücrete karşılık gelir.',
    'Brüt tutardan binde 7,59 damga vergisi düşülür, gelir vergisi kesilmez. Aylık esas ücret 80.000 ₺ olsaydı hesap, ekim ayındaki dönem için 73.729,87 ₺ tavan üzerinden yapılırdı. Bu nedenle çıkış tarihini doğru girmek sonucu değiştirebilir.',
  ] },
  sss: [
    ['Kıdem tazminatı tavanı ne kadar?', 'Çalışma Bakanlığı tablosuna göre 01.07.2026–31.12.2026 döneminde 73.729,87 ₺, 01.01.2026–30.06.2026 döneminde 64.948,77 ₺’dir. Araç çıkış tarihine göre seçer.'],
    ['Kıdem tazminatından hangi kesintiler yapılır?', 'Gelir vergisi istisnası nedeniyle yalnız binde 7,59 damga vergisi kesilir.'],
    ['Bir yıldan az çalışana ödenir mi?', 'Kanun her geçen tam yıl için ödeme öngörür. Araç bir tam yıl dolmamışsa sıfır gösterir.'],
    ['İstifa eden kıdem alır mı?', 'Hak kazanma fesih nedenine bağlıdır ve araç bunu değerlendirmez. Durumunuzu bir avukata veya işverenin bordro birimine danışın.'],
  ],
};
