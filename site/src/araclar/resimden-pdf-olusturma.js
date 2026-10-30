const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resimden-pdf-olusturma', kategori: 'pdf', sira: 4, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['pdf-birlestirme', 'pdf-resme-cevirme', 'resim-sikistirma'],
  ad: 'Resimden PDF Oluşturma', kisa: 'JPG ve PNG fotoğrafları sıralayıp A4 PDF yapın',
  baslik: 'Resimden PDF Oluşturma — JPG, PNG Dosyasını PDF Yapma | NEBSOFT',
  ozet: 'Telefonla çektiğiniz belge fotoğraflarını sıralayıp tek PDF yapın. A4 veya görsel ölçüsü, kenar boşluğu seçin. Fotoğraflar cihazınızdan çıkmaz, üyelik gerekmez.',
  sonucBaslik: 'Oluşan PDF', aciklamaBaslik: 'Fotoğraf nasıl PDF yapılır?',
  program: { slug: 'malimusavirprogrami', metin: 'Mükelleflerden gelen belge fotoğraflarını yönetiyorsanız Mali Müşavir programı evrak takibini ve mükelleflerin evrak yükleyebildiği portalı sağlar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', coklu: true, sirali: true, ipucu: 'veya sürükleyin. Oklarla sıralayın' },
    { ad: 'kagit', etiket: 'Sayfa', tip: 'secim', deger: 'a4', secenekler: [['a4', 'A4'], ['gorsel', 'Görsel ölçüsünde']] },
    { ad: 'yon', etiket: 'Yön', tip: 'secim', deger: 'oto', goster: 'kagit=a4', secenekler: [['oto', 'Görsele göre'], ['dikey', 'Dikey'], ['yatay', 'Yatay']] },
    { ad: 'kenar', etiket: 'Kenar boşluğu (mm)', tip: 'sayi', deger: '10', goster: 'kagit=a4' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', `${v.dosyalar.length} görselden PDF yap`)) : H.not('Fotoğraf seçtiğinizde PDF düğmesi burada görünür. Her görsel bir sayfa olur.'); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const o = await L.PDFDocument.create(); const n = v.dosyalar.length; const k = Math.max(0, v.kenar || 0) * 72 / 25.4;
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; c.ilerle(i / n, `${f.name} ekleniyor`); if (c.iptal()) return ''; const bm = await H.gorselAc(f); const w = bm.width, h = bm.height; let g; const by = await H.bayt(f); const m = f.type === 'image/jpeg' && H.turBul(by) === 'jpeg' ? H.metaOku(by) : null;
      if (m && !(m.exif.yon > 1)) g = await o.embedJpg(by); else if (f.type === 'image/png' && H.turBul(by) === 'png') g = await o.embedPng(by); else { const t = H.dolu(w, h, '#fff'); t.getContext('2d').drawImage(bm, 0, 0); g = await o.embedJpg(await H.bayt(await H.kaydet(t, 'image/jpeg', 0.92))); } bm.close();
      if (v.kagit === 'gorsel') { const pw = w * 72 / 96, ph = h * 72 / 96; o.addPage([pw, ph]).drawImage(g, { x: 0, y: 0, width: pw, height: ph }); continue; }
      const yatay = v.yon === 'yatay' || (v.yon === 'oto' && w > h); const PW = yatay ? 841.89 : 595.28, PH = yatay ? 595.28 : 841.89; const iw = PW - 2 * k, ih = PH - 2 * k; if (iw < 36 || ih < 36) throw new Error('Kenar boşluğu sayfaya sığmıyor.'); const s = Math.min(iw / w, ih / h); const dw = w * s, dh = h * s; o.addPage([PW, PH]).drawImage(g, { x: (PW - dw) / 2, y: (PH - dh) / 2, width: dw, height: dh });
    }
    c.ilerle(1, 'Dosya hazırlanıyor'); const b = await H.pdfBlob(o); if (c.iptal()) return ''; H.cikti(`${H.dosyaKok(v.dosyalar[0].name)}.pdf`, b);
    return `${H.tablo([['Sayfa', n, 1], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}${b.size > 10485760 ? H.not('Dosya büyük çıktı. E-posta için PDF Sıkıştırma aracından geçirin.') : ''}`;
  },
  aciklama: [
    'Kurumların büyük bölümü belgeyi fotoğraf olarak değil PDF olarak ister. Telefonla çektiğiniz kimlik, fatura, dekont veya formu bu araçta tek bir dosyada toplayabilirsiniz. Her fotoğraf bir sayfa olur, sırasını oklarla değiştirirsiniz. JPG ve PNG dosyaları yeniden sıkıştırılmadan gömülür, bu yüzden kalite düşmez; WebP ve döndürme etiketi taşıyan fotoğraflar ise uygun biçime çevrilerek eklenir.',
    'Sayfa seçeneği belgenin nasıl yazdırılacağını belirler. A4 seçilirse görsel kâğıda oranı bozulmadan ortalanır ve kenar boşluğu bırakılır; resmî başvurularda ve yazıcıdan çıkacak belgelerde doğrusu budur. Yön otomatik seçildiğinde yatay fotoğraf yatay sayfaya oturur. Görsel ölçüsü seçeneğinde ise sayfa fotoğrafla aynı boyutta olur, kenar kalmaz; ekranda okunacak katalog veya portfolyo için uygundur.',
    'Telefonla belge çekerken en büyük kazanç araçtan değil çekimden gelir: kâğıdı düz bir yüzeye koyun, gölgeyi önleyin, yukarıdan çekin. Yan çıkan fotoğrafı önce Resim Kırpma ve Döndürme aracında düzeltin. Oluşan PDF yalnız görüntü içerir, yani yazıları seçilemez ve aranamaz. Fotoğraflar çok yüksek çözünürlüklüyse dosya büyür, gönderim sınırı varsa PDF Sıkıştırma aracını kullanın.',
  ],
  ornek: { baslik: 'Kullanım örneği: başvuru evrakını telefonla hazırlamak', metin: [
    'Bir başvuru sahibi kimliğinin ön ve arka yüzünü, ikametgâh belgesini ve bir dilekçeyi telefonla çekti. Dört fotoğrafı seçer, A4 ve 10 mm kenar boşluğu bırakır. Dilekçeyi oklarla en üste alır. Dört sayfalık tek PDF iner, kuruma e-postayla gönderir.',
    'Bir mimar proje fotoğraflarını ekranda sunacak. Görsel ölçüsü seçeneğini seçer, böylece sayfalarda beyaz kenar kalmaz. Yatay ve dikey fotoğraflar kendi ölçüsüyle sayfa olur.',
  ] },
  sss: [
    ['JPG dosyası PDF\'e nasıl çevrilir?', 'Dosyayı seçin, sayfa türünü belirleyin ve düğmeye basın. Tek görselden de PDF oluşur.'],
    ['Fotoğrafların kalitesi düşer mi?', 'JPG ve PNG yeniden sıkıştırılmaz. WebP gibi biçimler dönüştürülürken çok az ayrıntı kaybolabilir.'],
    ['PDF\'teki yazılar seçilebilir olur mu?', 'Hayır. Sayfa görüntüden oluşur. Bu araç metin tanıma (OCR) yapmaz.'],
    ['Telefondan galeriyle seçebilir miyim?', 'Evet. Dosya seçme düğmesi telefonda galeriyi açar, birden çok fotoğraf seçilebilir.'],
  ],
};
