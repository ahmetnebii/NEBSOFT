const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-sikistirma', kategori: 'pdf', sira: 6, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['resim-sikistirma', 'pdf-bolme', 'pdf-birlestirme'],
  ad: 'PDF Sıkıştırma', kisa: 'PDF dosyasının boyutunu küçültün, e-posta sınırına indirin',
  baslik: 'PDF Sıkıştırma — PDF Boyutu Küçültme, MB Düşürme | NEBSOFT',
  ozet: 'PDF boyutunu tarayıcıda küçültün: yazıları koruyan hafif yöntem veya taranmış belgeler için güçlü yöntem. Belge sunucuya gitmez, sonucu önce ve sonra görün.',
  sonucBaslik: 'Sıkıştırma sonucu', aciklamaBaslik: 'PDF boyutu nasıl küçültülür?',
  program: { slug: 'hukukburosuprogrami', metin: 'Sık sık evrak gönderiyorsanız Hukuk Bürosu programı dosya, duruşma, süre ve masraf takibini müvekkil portalıyla birlikte sunar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'kip', etiket: 'Yöntem', tip: 'secim', deger: 'guclu', genis: true, secenekler: [['guclu', 'Güçlü: sayfalar görsele çevrilir (taranmış belge için)'], ['hafif', 'Hafif: yazılar korunur, kazanç az olabilir']] },
    { ad: 'dpi', etiket: 'Çözünürlük', tip: 'secim', deger: '120', goster: 'kip=guclu', secenekler: [['72', '72 DPI (en küçük)'], ['120', '120 DPI (ekran, dengeli)'], ['150', '150 DPI (okunaklı baskı)']] },
    { ad: 'kalite', etiket: 'Görsel kalitesi', tip: 'kaydirici', min: 30, max: 85, deger: '60', goster: 'kip=guclu' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'Sıkıştır')) : H.not('PDF seçtiğinizde sıkıştırma düğmesi burada görünür.'); },
  isle: async function (v, H, c) {
    const f = v.dosyalar[0]; const L = await H.pdfLib(); let b; const notlar = [];
    if (v.kip === 'hafif') { const d = await H.pdfYukle(f); c.ilerle(0.5, 'Dosya yeniden yazılıyor'); b = await H.pdfBlob(d); }
    else {
      const d = await H.pdfAc(f); const o = await L.PDFDocument.create(); const k = Number(v.dpi) / 72; const n = d.numPages;
      for (let i = 1; i <= n; i++) { c.ilerle((i - 1) / n, `Sayfa ${i} / ${n}`); if (c.iptal()) { await H.pdfKapat(d); return ''; } const s = await d.getPage(i); const vp = s.getViewport({ scale: 1 }); const t = await H.sayfaCiz(d, i, k); const g = await o.embedJpg(await H.bayt(await H.kaydet(t, 'image/jpeg', Number(v.kalite) / 100))); o.addPage([vp.width, vp.height]).drawImage(g, { x: 0, y: 0, width: vp.width, height: vp.height }); t.width = 0; }
      await H.pdfKapat(d); b = await H.pdfBlob(o); notlar.push('Sayfalar görsele çevrildi: yazılar artık seçilemez ve aranamaz, bağlantılar çalışmaz.');
    }
    if (c.iptal()) return ''; if (b.size >= f.size) { return `${H.tablo([['Dosya', H.boyutYaz(f.size)], ['Sonuç', 'Küçülmedi', 1]])}${H.not(v.kip === 'hafif' ? 'Bu dosyada kazanç bulunamadı. Taranmış belgeyse güçlü yöntemi deneyin.' : 'Bu ayarla dosya büyüyordu, çıktı üretilmedi. Dosya zaten sıkıştırılmış olabilir, düşük çözünürlük deneyin.', 'uyari')}`; }
    H.cikti(H.dosyaAdi(f.name, 'kucuk', 'pdf'), b); return `${H.karsilastir(f.size, b.size)}${H.ciktiListe()}${notlar.map((x) => H.not(x)).join('')}`;
  },
  aciklama: [
    'PDF dosyasının büyük olmasının nedeni çoğunlukla içindeki görsellerdir. Tarayıcıdan veya telefondan gelen belgelerde her sayfa aslında yüksek çözünürlüklü bir fotoğraftır; on sayfalık basit bir evrak bu yüzden e-posta sınırını aşabilir. Bu araç böyle dosyaları e-postaya, kurum başvurusuna veya iş takip programına sığacak boyuta indirmek için hazırlandı.',
    'İki yöntem sunuyoruz ve aralarındaki fark gizlenmemeli. Güçlü yöntem her sayfayı seçtiğiniz çözünürlükte görsele çevirip yeniden oluşturur. Taranmış belgelerde belirgin kazanç sağlar, fakat metin katmanını yok eder: yazılar seçilemez, arama yapılamaz, bağlantılar çalışmaz. Hafif yöntem ise içeriğe dokunmaz, yalnız dosyanın iç yapısını sade biçimde yeniden yazar. Yazılar korunur, ama kazanç küçük kalabilir veya hiç olmayabilir.',
    'Hangisini seçeceğiniz belgenin türüne bağlıdır. Word\'den üretilmiş, görsel içermeyen bir PDF zaten küçüktür ve güçlü yöntem onu büyütebilir; bu durumda araç çıktı vermez ve size söyler. Resmî bir belgede yazıların okunaklı kaldığını önizlemeden kontrol edin, küçük puntolu metin 72 DPI ile okunmaz hâle gelebilir. e-Fatura, e-imza taşıyan veya mali değeri olan özgün PDF dosyalarını sıkıştırmayın; imza içeren belge değiştirildiğinde imza geçersiz görünür.',
  ],
  ornek: { baslik: 'Kullanım örneği: taranmış belgeyi e-postaya sığdırmak', metin: [
    'Bir kullanıcı tarayıcıdan çıkan on iki sayfalık sözleşmeyi e-postayla gönderemiyor, dosya sınırı aşıyor. Güçlü yöntemi 120 DPI ve varsayılan kaliteyle dener, sonuç ekranında önce ve sonra boyutunu görür. Sonuç hâlâ büyükse kaliteyi düşürüp yeniden çalıştırır.',
    'Bir akademisyen ise 200 sayfalık kaynak listesini sıkıştırmak istiyor ama metin arama çalışmaya devam etmeli. Hafif yöntemi seçer. Dosya çok küçülmezse çalışmasını PDF Bölme aracıyla parçalara ayırmayı tercih eder.',
  ] },
  sss: [
    ['PDF\'in yazıları bozulur mu?', 'Hafif yöntemde değişmez. Güçlü yöntemde yazılar görüntüye dönüşür, düşük çözünürlükte bulanıklaşabilir.'],
    ['Yüzde kaç küçülür?', 'Belgeye bağlıdır. Taranmış belgelerde kazanç yüksektir, yazı ağırlıklı PDF\'te az olur. Sonucu ekranda görürsünüz, garanti edilmiş bir oran yoktur.'],
    ['Dosya neden küçülmedi?', 'Zaten sıkıştırılmış olabilir. Araç büyüyen çıktıyı vermez, başka ayar denemenizi önerir.'],
    ['e-Fatura PDF\'ini sıkıştırabilir miyim?', 'Görünümü küçültür ama resmî kayıt XML dosyasıdır. Saklama yükümlülüğü için özgün dosyayı koruyun.'],
  ],
};
