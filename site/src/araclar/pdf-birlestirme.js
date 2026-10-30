const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-birlestirme', kategori: 'pdf', sira: 1, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['pdf-bolme', 'pdf-sayfa-duzenleme', 'resimden-pdf-olusturma'],
  ad: 'PDF Birleştirme', kisa: 'Birden çok PDF dosyasını istediğiniz sırayla tek dosya yapın',
  baslik: 'PDF Birleştirme — PDF Dosyalarını Tek Dosyada Toplama | NEBSOFT',
  ozet: 'Birden çok PDF dosyasını sıralayıp tek PDF yapın. Sözleşme, fatura ve dekontlar tarayıcınızda birleşir; dosyalar internete yüklenmez, üyelik gerekmez.',
  sonucBaslik: 'Birleştirilmiş PDF', aciklamaBaslik: 'PDF dosyaları nasıl birleştirilir?',
  program: { slug: 'malimusavirprogrami', metin: 'Mükellef belgeleriyle uğraşıyorsanız Mali Müşavir programı evrak takibini, beyanname takvimini ve mükelleflerin evrak yüklediği portalı bir araya getirir.' },
  alanlar: [{ ad: 'dosyalar', etiket: 'PDF dosyalarını seçin', tip: 'dosya', kabul: '.pdf,application/pdf', coklu: true, sirali: true, ipucu: 'veya sürükleyin. Oklarla sırasını değiştirin' }],
  hesap: function (v, H) { if (!v.dosyalar.length) return H.not('En az iki PDF seçin. Listedeki sıra, yeni dosyadaki sıra olur.'); if (v.dosyalar.length < 2) return H.not('Birleştirmek için bir PDF daha ekleyin.'); return H.eylemler(H.btn('isle', `${v.dosyalar.length} PDF'i birleştir`)); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const o = await L.PDFDocument.create(); const n = v.dosyalar.length; let once = 0;
    for (let i = 0; i < n; i++) { const f = v.dosyalar[i]; c.ilerle(i / n, `${f.name} ekleniyor`); if (c.iptal()) return ''; const d = await H.pdfYukle(f); (await o.copyPages(d, d.getPageIndices())).forEach((p) => o.addPage(p)); once += f.size; }
    c.ilerle(1, 'Dosya hazırlanıyor'); const b = await H.pdfBlob(o); if (c.iptal()) return ''; H.cikti('birlesik.pdf', b);
    return `${H.tablo([['Dosya', n], ['Toplam sayfa', o.getPageCount(), 1], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'PDF birleştirme, ayrı ayrı duran dosyaları sayfaları bozulmadan tek bir PDF içinde toplar. İhale dosyası, kredi başvurusu, mali müşavire gönderilecek aylık fatura ve dekontlar ya da imzalı sözleşme ekleri çoğu zaman tek dosya olarak istenir. Dosyaları seçin, listede oklarla sıralayın, düğmeye basın. Yazılar seçilebilir kalır, görseller yeniden sıkıştırılmaz, form ve sayfa ölçüleri korunur.',
    'Bu sayfadaki fark şudur: dosyalarınız bir sunucuya hiç yüklenmez. Çevrimiçi PDF araçlarının birçoğu dosyayı kendi sunucusunda işler; imzalı sözleşme, kimlik fotokopisi veya banka dekontu gibi belgelerde bu kabul edilmesi zor bir risktir. Burada işlem cihazınızın belleğinde yapılır, bu nedenle hız da sizin bilgisayarınıza bağlıdır. Dosya sayısı için sınır koymadık, gerçek sınır cihazın belleğidir.',
    'Şifreli PDF dosyaları birleştirilemez: araç bunu dosya adıyla birlikte söyler, önce parolayı kaldırmanız gerekir. Yer imleri ve içindekiler tablosu birleşik dosyaya taşınmaz; sayfalar, metin ve görseller ise aynen geçer. Çok büyük sayıda taranmış sayfa birleştirildiğinde sonuç e-posta sınırını aşabilir, bu durumda dosyayı PDF Sıkıştırma aracından geçirin. Fotoğraf ekleyecekseniz önce Resimden PDF Oluşturma aracını kullanın.',
  ],
  ornek: { baslik: 'Kullanım örneği: aylık evrakı muhasebeciye göndermek', metin: [
    'Bir işletme sahibi ekim ayına ait dört e-Arşiv faturasını, iki dekontu ve bir kira sözleşmesini tek dosya hâlinde göndermek istiyor. Yedi PDF dosyasını sürükler, faturaları üste alır, sözleşmeyi en sona taşır. Birleştir düğmesine basar, tek PDF iner.',
    'Dosyalardan biri banka tarafından parolalı üretilmişse araç hangi dosya olduğunu yazar ve işlemi durdurur. Kullanıcı o dosyayı açıp parolasız kaydeder veya bankanın şifresiz çıktısını alır, sonra aynı listeyi yeniden dener.',
  ] },
  sss: [
    ['PDF\'lerim sunucuya yükleniyor mu?', 'Hayır. Birleştirme tarayıcınızda yapılır. Sayfanın güvenlik kuralı dış adreslere veri gönderimini de kapatır.'],
    ['Sayfaların sırasını değiştirebilir miyim?', 'Dosya sırasını listede oklarla değiştirebilirsiniz. Sayfa bazında sıralama için sonucu PDF Sayfa Düzenleme aracında açın.'],
    ['Birleştirince kalite düşer mi?', 'Hayır. Sayfalar yeniden çizilmez, olduğu gibi kopyalanır.'],
    ['Telefondan PDF birleştirebilir miyim?', 'Evet, telefon tarayıcısında çalışır. Çok büyük dosyalarda telefon belleği yetmeyebilir.'],
  ],
};
