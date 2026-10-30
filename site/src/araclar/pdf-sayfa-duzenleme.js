const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-sayfa-duzenleme', kategori: 'pdf', sira: 3, renk: '#b91c1c', guncelleme: GUNCELLEME, tek: true, ilgili: ['pdf-bolme', 'pdf-birlestirme', 'pdf-sayfa-numarasi-ekleme'],
  ad: 'PDF Sayfa Düzenleme', kisa: 'PDF sayfalarını görerek silin, sıralayın, döndürün',
  baslik: 'PDF Sayfa Düzenleme — Sayfa Silme, Sıralama, Döndürme | NEBSOFT',
  ozet: 'PDF sayfalarını küçük resimlerle görün; gereksiz sayfayı silin, sırasını değiştirin, yan duranı döndürün. Tek ekranda düzenleyin, dosya cihazınızdan çıkmaz.',
  sonucBaslik: 'Sayfalar', aciklamaBaslik: 'PDF\'te sayfa silme, sıralama ve döndürme nasıl yapılır?',
  program: { slug: 'onmuhasebeprogrami', metin: 'Fatura ve dekontlarla çalışıyorsanız Ön Muhasebe programı satış ve alış faturası, cari hesap, kasa, banka ve vade takibini tek panelde yürütür.' },
  alanlar: [{ ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin. Sayfalar küçük resim olarak açılır' }],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'Değişiklikleri kaydet')) : H.not('PDF seçtiğinizde her sayfa küçük resim olarak görünür.'); },
  hazirla: async function (v, H, c) { const d = await H.pdfAc(v.dosyalar[0]); const top = d.numPages; if (top > 300) { await H.pdfKapat(d); throw new Error(`Bu PDF ${top} sayfa. Küçük resimle düzenleme için en çok 300 sayfa desteklenir, önce PDF Bölme aracıyla parçalayın.`); } await H.sayfaIzgara(c, d); await H.pdfKapat(d); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const s = (c.durum.sayfalar || []).filter((p) => !p.sil); if (!s.length) throw new Error('En az bir sayfa bırakın.');
    const d = await H.pdfYukle(v.dosyalar[0]); const o = await L.PDFDocument.create(); const k = await o.copyPages(d, s.map((p) => p.i)); k.forEach((p, i) => { if (s[i].aci) p.setRotation(L.degrees((p.getRotation().angle + s[i].aci) % 360)); o.addPage(p); });
    const b = await H.pdfBlob(o); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(v.dosyalar[0].name, 'duzenlenmis', 'pdf'), b);
    return `${H.tablo([['Sayfa', `${c.durum.sayfalar.length} → ${s.length}`, 1], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'Bu araç bir PDF dosyasını küçük resimler hâlinde açar ve sayfalar üzerinde doğrudan çalışmanızı sağlar. Tarayıcıdan ters geçen bir sayfayı döndürmek, boş çıkan arka yüzleri atmak, karışmış sayfaları düzeltmek gibi işlerin hepsi aynı ekranda yapılır. PDF sayfa silme, PDF sıralama ve PDF döndürme genellikle aynı dosya üzerinde peş peşe gereken işlemler olduğu için bunları ayrı sayfalara bölmedik.',
    'Her küçük resmin altında dört düğme bulunur: sola al, sağa al, döndür, sil. Silinen sayfa hemen yok olmaz, soluk görünür ve tek dokunuşla geri alınabilir; böylece yanlış sayfayı attığınızı kaydetmeden önce fark edersiniz. Kaydet düğmesine basana kadar hiçbir şey değişmez. Sayfalar yeniden çizilmeden kopyalandığı için yazılar seçilebilir kalır, görüntü kalitesi düşmez.',
    'Döndürme PDF içindeki sayfa yönünü değiştirir, içeriği yeniden üretmez; bu nedenle işlem kayıpsızdır. Sayfaları sürükleyerek değil düğmeyle taşıdık, çünkü sürükleme telefonda hatalı çalışır ve ekran okuyucu kullanıcılar için erişilemez. En çok 300 sayfalık dosyayı küçük resimle açıyoruz; daha büyük belgeleri önce PDF Bölme aracıyla parçalayın. Düzenleme sonunda sayfa numarası gerekiyorsa sonucu PDF Sayfa Numarası Ekleme aracına verin.',
  ],
  ornek: { baslik: 'Kullanım örneği: çift taraflı tarama temizliği', metin: [
    'Bir sekreter altı sayfalık sözleşmeyi çift taraflı taradı, ortaya on iki sayfa çıktı ve arka yüzlerin üçü boş. Boş sayfaların altındaki × düğmesine basar. İkinci sayfanın ters olduğunu görüp iki kez döndür düğmesine dokunur. Kaydeder, dokuz sayfalık temiz dosya iner.',
    'Bir öğretmen sınav evrakının ek sayfasını başa almak istiyor. Son sayfanın sola al düğmesine basarak onu öne taşır. Her taşımada sıra anında yenilendiği için sonucu ekranda görür, sonra Değişiklikleri kaydet düğmesine basar.',
  ] },
  sss: [
    ['PDF\'ten sayfa nasıl silinir?', 'Sayfanın altındaki × düğmesine basın ve kaydedin. Yanlış sildiyseniz kaydetmeden önce ↺ ile geri alın.'],
    ['Döndürdüğüm sayfa kalıcı mı?', 'Evet. İndirdiğiniz yeni dosyada sayfa yönü değişmiş olur, tüm okuyucularda aynı görünür.'],
    ['Özgün dosya değişir mi?', 'Hayır. Yeni bir kopya iner, cihazınızdaki özgün dosya aynen durur.'],
    ['Sayfanın içindeki yazıyı düzenleyebilir miyim?', 'Hayır. Bu araç sayfa düzeyinde çalışır, sayfa içeriğini değiştirmez.'],
  ],
};
