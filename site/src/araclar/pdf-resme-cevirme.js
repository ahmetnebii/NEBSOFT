const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-resme-cevirme', kategori: 'pdf', sira: 5, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['resimden-pdf-olusturma', 'pdf-bolme', 'fotograf-bulaniklastirma'],
  ad: 'PDF\'i Resme Çevirme', kisa: 'PDF sayfalarını JPG veya PNG görsele dönüştürün',
  baslik: 'PDF\'i Resme Çevirme — PDF\'ten JPG ve PNG Çıkarma | NEBSOFT',
  ozet: 'PDF sayfalarını JPG veya PNG görsele çevirin. Çözünürlüğü ve sayfa aralığını seçin, sonuçları ZIP indirin. Belge sunucuya yüklenmez, işlem tarayıcınızda yapılır.',
  sonucBaslik: 'Sayfa görselleri', aciklamaBaslik: 'PDF nasıl JPG veya PNG yapılır?',
  program: { slug: 'emlakprogrami', metin: 'Tapu, plan ve broşürlerle çalışıyorsanız Emlak Ofisi programı portföy, ilan takibi, kira sözleşmesi ve tahsilatı tek yerde yönetir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'bicim', etiket: 'Görsel biçimi', tip: 'secim', deger: 'image/jpeg', secenekler: [['image/jpeg', 'JPG (fotoğraflı sayfa, küçük dosya)'], ['image/png', 'PNG (yazı, keskin çizgi)']] },
    { ad: 'dpi', etiket: 'Çözünürlük', tip: 'secim', deger: '150', secenekler: [['96', '96 DPI (ekran)'], ['150', '150 DPI (genel)'], ['300', '300 DPI (baskı)']] },
    { ad: 'aralik', etiket: 'Sayfalar', yer: 'Tümü', genis: true, ipucu: 'Boş bırakırsanız tüm sayfalar. Örnek: 1-3, 5' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'Görsele çevir')) : H.not('PDF seçtiğinizde dönüştürme düğmesi burada görünür.'); },
  isle: async function (v, H, c) {
    const d = await H.pdfAc(v.dosyalar[0]); const l = H.sayfaAraligi(v.aralik, d.numPages); const uz = v.bicim === 'image/png' ? 'png' : 'jpg'; const o = Number(v.dpi) / 72; let on = '';
    for (let i = 0; i < l.length; i++) { c.ilerle(i / l.length, `Sayfa ${l[i] + 1} çiziliyor (${i + 1}/${l.length})`); if (c.iptal()) { await H.pdfKapat(d); return ''; } const t = await H.sayfaCiz(d, l[i] + 1, o); const b = await H.kaydet(t, v.bicim, 0.88); H.cikti(H.dosyaAdi(v.dosyalar[0].name, `sayfa-${l[i] + 1}`, uz), b); if (!i) on = `<img class="ar-onizle" src="${H.adres(b)}" alt="İlk sayfanın görseli" width="${t.width}" height="${t.height}">`; t.width = 0; }
    const top = H.ciktilar.reduce((n, x) => n + x.blob.size, 0); await H.pdfKapat(d); return `${on}${H.tablo([['Görsel', l.length, 1], ['Toplam boyut', H.boyutYaz(top)]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'PDF sayfasını görsele çevirmek, belgeyi PDF kabul etmeyen yerlere taşımanın en kısa yoludur. Bir sayfayı WhatsApp durumuna koymak, sunuma görsel olarak eklemek, web sitesine broşür kapağı yerleştirmek ya da başvuru formunun yalnız JPG kabul eden alanına belge yüklemek gibi işlerde kullanılır. Araç her sayfayı gerçek yazı tipleriyle çizer ve seçtiğiniz biçimde kaydeder.',
    'Çözünürlük, sayfanın kaç piksele dönüşeceğini belirler. A4 bir sayfa 96 DPI ile yaklaşık 794 × 1123 piksel, 150 DPI ile 1240 × 1754 piksel, 300 DPI ile 2480 × 3508 piksel olur. Ekranda okumak için 150 DPI yeterlidir; baskıya gidecek görselde 300 DPI seçin. Çözünürlüğü iki katına çıkarmak işlem süresini ve bellek kullanımını yaklaşık dört katına çıkarır, bu yüzden yüz sayfalık bir belgede gerekmedikçe en yükseği seçmeyin.',
    'Biçim seçimi sayfanın içeriğine bağlıdır. Yazı, tablo ve çizim ağırlıklı sayfada PNG kenarları keskin tutar; fotoğraflı broşür ve taranmış sayfada JPG çok daha küçük dosya verir. Görsele dönüşen sayfanın yazıları artık seçilemez ve kopyalanamaz. Bunu bilinçli kullanmak da mümkündür: hassas bir bilgiyi kapatmadan önce sayfayı görsele çevirirseniz alttaki metin katmanı kalmaz, ardından Fotoğraf Bulanıklaştırma aracıyla bilgiyi kapatabilirsiniz.',
  ],
  ornek: { baslik: 'Kullanım örneği: broşürü sosyal medyaya taşımak', metin: [
    'Bir kurs sekiz sayfalık tanıtım broşürünü PDF olarak hazırlamış ve yalnız ilk iki sayfayı paylaşmak istiyor. Sayfalar alanına 1-2 yazar, JPG ve 150 DPI seçer. İki görsel oluşur, önizlemede ilk sayfayı kontrol eder.',
    'Bir mimar proje paftasını müşterinin telefonunda keskin görünecek şekilde göndermek istiyor. Çizgiler ince olduğu için PNG ve 300 DPI seçer. Dosya büyür ama çizgiler net kalır.',
  ] },
  sss: [
    ['PDF\'in yalnız bir sayfası görsel yapılabilir mi?', 'Evet. Sayfalar alanına o sayfanın numarasını yazın.'],
    ['Şifreli PDF\'i görsele çevirebilir miyim?', 'Hayır. Araç parola korumalı dosyayı açmaz. Önce parolayı kaldırmanız gerekir.'],
    ['Kaç DPI seçmeliyim?', 'Ekran için 150, baskı için 300 seçin. 96 DPI küçük önizleme içindir.'],
    ['Görseldeki yazıyı kopyalayabilir miyim?', 'Hayır. Metni almak için önce PDF Metin Çıkarma aracını kullanın.'],
  ],
};
