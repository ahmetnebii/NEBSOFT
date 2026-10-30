const { GUNCELLEME, IS } = require('./_kaynak');
module.exports = {
  slug: 'yillik-izin-hesaplama', kategori: 'calisma', sira: 5, mevzuat: true, renk: '#2563eb', guncelleme: GUNCELLEME, kaynaklar: [IS('madde 53', 'yıllık ücretli izin süreleri')], ilgili: ['kidem-tazminati-hesaplama', 'ihbar-tazminati-hesaplama'],
  ad: 'Yıllık İzin Hesaplama ve İzin Formu', kisa: 'Kıdeme göre izin hakkını bulun, izin talep formunu yazdırın',
  baslik: 'Yıllık İzin Hesaplama — 14, 20, 26 Gün ve İzin Formu | NEBSOFT',
  ozet: 'İşe giriş tarihinden yıllık izin hakkınızı İş Kanunu md. 53’e göre hesaplayın: 14, 20 veya 26 gün, yaşa bağlı en az 20 gün, kalan izin ve yazdırılabilir yıllık izin talep formu.',
  uyari: 'Araç en az kanuni süreleri gösterir; iş sözleşmeniz veya toplu sözleşmeniz daha uzun izin verebilir. Aynı işverende geçen süreler ve kesintiler için kayıtlarınızı kontrol edin.',
  program: { slug: 'personeltakipprogrami', metin: 'Personel programı her çalışanın izin bakiyesini giriş tarihinden hesaplar, izin talebini onaya sunar ve puantaja kendisi işler.' },
  alanlar: [
    { ad: 'giris', etiket: 'İşe giriş tarihi', tip: 'tarih', deger: '2018-09-03', gerekli: true }, { ad: 'tarih', etiket: 'Hesap tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'yas', etiket: 'Yaş', tip: 'sayi', ipucu: '18 yaşından küçük, 50 yaşından büyükse en az 20 gün' }, { ad: 'kullanilan', etiket: 'Bugüne kadar kullanılan (gün)', tip: 'sayi' },
    { ad: 'yerAlti', etiket: 'Yer altı işlerinde çalışıyor (+4 gün)', tip: 'onay' },
    { tip: 'ara', etiket: 'İzin talep formu (isteğe bağlı)' },
    { ad: 'personel', etiket: 'Personel adı' }, { ad: 'firma', etiket: 'İşyeri' }, { ad: 'bas', etiket: 'İzin başlangıcı', tip: 'tarih' }, { ad: 'bit', etiket: 'İşe dönüş tarihi', tip: 'tarih' }, { ad: 'gun', etiket: 'Talep edilen gün', tip: 'sayi' },
  ],
  hesap: function (v, H) {
    const r = H.yillikIzin(v); const s = H.tablo([['Kıdem', `${r.sure.yil} yıl ${r.sure.ay} ay ${r.sure.gun} gün`], ['Bu yılki izin hakkı', `${r.gun} gün`, 1], ['Toplam hak edilen', `${r.toplam} gün`], v.kullanilan > 0 && ['Kalan izin', `${r.kalan} gün`, 1], ['Sonraki hak ediş', H.tarihTR(r.sonrakiHakedis)]]) + (r.sure.yil < 1 ? H.not('Yıllık izin için bir yıllık çalışma süresinin dolması gerekir.', 'uyari') : '');
    const form = v.personel ? `<div class="belge" style="margin-top:14px"><h2>YILLIK ÜCRETLİ İZİN TALEP FORMU</h2><table><tbody><tr><th>Personel</th><td>${H.esc(v.personel)}</td></tr><tr><th>İşyeri</th><td>${H.esc(v.firma)}</td></tr><tr><th>İşe giriş</th><td>${H.tarihTR(v.giris)}</td></tr><tr><th>İzin hakkı</th><td>${r.gun} gün</td></tr><tr><th>Kalan izin</th><td>${r.kalan} gün</td></tr><tr><th>Talep edilen</th><td>${v.gun != null ? H.sayi(v.gun, 0) + ' gün' : ''}</td></tr><tr><th>Başlangıç</th><td>${H.tarihTR(v.bas)}</td></tr><tr><th>İşe dönüş</th><td>${H.tarihTR(v.bit)}</td></tr></tbody></table><p>Yukarıda belirtilen tarihler arasında yıllık ücretli iznimi kullanmak istiyorum.</p><div class="imza"><div>Personel<br>İmza</div><div>Yönetici onayı<br>İmza</div></div></div>${H.eylemler(H.btn('yazdir', 'Formu yazdır'))}` : '';
    return s + form;
  },
  aciklama: [
    'İş Kanununun 53. maddesi yıllık ücretli izni çalışma süresine bağlar. Hizmet süresi bir yıldan beş yıla kadar olanlara en az 14 gün, beş yıldan fazla on beş yıldan az olanlara en az 20 gün, on beş yıl ve daha fazla olanlara en az 26 gün verilir. Bu haktan vazgeçilemez. Araç işe giriş tarihinden tamamlanan yılları sayar ve o yıl için geçerli süreyi gösterir.',
    'On sekiz yaşından küçük ve elli yaşından büyük çalışanlarda süre 20 günden az olamaz; yaş alanını doldurduğunuzda bu kural kendiliğinden uygulanır. Yer altı işlerinde çalışanların süreleri dört gün artırılır, ilgili kutu işaretlenince her dönem için eklenir.',
    'İzin hakkı, çalışma yılı tamamlandığında doğar. Bu yüzden araç sonraki hak ediş tarihini de gösterir: planlamada hangi tarihten sonra yeni izin kullanılabileceği görünür. Toplam hak edilen gün, kıdem boyunca biriken temel süredir; yaş kuralı geçmiş yıllara yansıtılmaz. Bugüne kadar kullandığınız günü yazarsanız kalan izin çıkar. Ad ve tarih alanlarını doldurursanız aynı bilgilerle yazdırılabilir bir izin talep formu oluşur.',
  ],
  ornek: { baslik: 'Kullanım örneği: sekiz yıllık çalışan', metin: [
    'Eylül 2018’de işe başlayan bir çalışan Ekim 2026’da 8 tam yılını tamamlamıştır. Beş yılı aştığı için bu yılki hakkı 20 gündür. İlk beş yıl 14’er, sonraki üç yıl 20’şer gün eklenerek toplam 130 gün eder.',
    'Bugüne kadar 110 gün kullandıysa kalan izin 20 gün görünür. Çalışan adını ve tarihleri girerek yönetici onayına sunulacak formu yazdırır. Elli yaşını geçmiş biri için ilk yıllarda da en az 20 gün uygulanacağından yaş alanını doldurmayı unutmayın.',
  ] },
  sss: [
    ['Yıllık izin kaç gün?', 'İş Kanunu md. 53’e göre kıdeme bağlı olarak en az 14, 20 veya 26 gündür.'],
    ['Tam beş yıl dolunca izin artar mı?', 'Kanun 14 günü beş yıl dahil verir. Araç 20 günü, altıncı çalışma yılı tamamlandığında gösterir.'],
    ['Bir yıldan az çalışan izin alabilir mi?', 'Yıllık izin hakkı bir yıllık çalışmadan sonra doğar. İşveren daha önce izin verebilir, bu araç bunu hesaplamaz.'],
    ['Hafta tatilleri izne dahil mi?', 'Bu araç hak edilen gün sayısını gösterir. Takvimdeki gün sayımı için işyeri uygulamanıza ve yönetmeliğe bakın.'],
  ],
};
