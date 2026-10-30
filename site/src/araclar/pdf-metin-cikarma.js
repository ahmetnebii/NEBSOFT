const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-metin-cikarma', kategori: 'pdf', sira: 9, renk: '#b91c1c', guncelleme: GUNCELLEME, canli: true, ilgili: ['pdf-resme-cevirme', 'pdf-bolme'],
  ad: 'PDF Metin Çıkarma', kisa: 'PDF\'teki yazıyı kopyalanabilir metne veya TXT dosyasına alın',
  baslik: 'PDF Metin Çıkarma — PDF\'ten Yazı Kopyalama, TXT Yapma | NEBSOFT',
  ozet: 'PDF\'teki yazıyı düz metin olarak alın, kopyalayın veya TXT indirin. Sayfa aralığı seçilebilir. Taranmış sayfalar için uyarı verir. Belge cihazınızdan çıkmaz.',
  sonucBaslik: 'Çıkarılan metin', aciklamaBaslik: 'PDF\'ten yazı nasıl çıkarılır?',
  program: { slug: 'malimusavirprogrami', metin: 'Mükellef belgelerinden sık sık bilgi alıyorsanız Mali Müşavir programı beyanname takvimi, evrak takibi ve ücret tahakkukunu bir araya getirir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'aralik', etiket: 'Sayfalar', yer: 'Tümü', ipucu: 'Boşsa tüm sayfalar' },
    { ad: 'ayrac', etiket: 'Sayfa başlıklarını ekle', tip: 'onay', deger: true },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Metin okunuyor.</p>' : H.not('PDF seçtiğinizde metin burada görünür.'); },
  isle: async function (v, H, c) {
    const d = await H.pdfAc(v.dosyalar[0]); const l = H.sayfaAraligi(v.aralik, d.numPages); const p = []; let bos = 0;
    for (let i = 0; i < l.length; i++) { if (i % 10 === 0) c.ilerle(i / l.length, `Sayfa ${l[i] + 1} okunuyor`); if (c.iptal()) { await H.pdfKapat(d); return ''; } const s = await d.getPage(l[i] + 1); const t = await s.getTextContent(); const m = H.pdfSatirlar(t.items).join('\n').trim(); if (m.replace(/\s/g, '').length < 5) bos++; p.push(v.ayrac ? `--- Sayfa ${l[i] + 1} ---\n${m}` : m); s.cleanup(); }
    await H.pdfKapat(d); const m = p.join('\n\n'); const kel = (m.match(/\S+/g) || []).length; if (bos === l.length) return `${H.not('Bu PDF\'te metin katmanı bulunamadı. Taranmış belge veya fotoğraftan oluşuyor olabilir. Bu araç metin tanıma (OCR) yapmaz.', 'uyari')}`;
    H.cikti(H.dosyaAdi(v.dosyalar[0].name, '', 'txt'), new Blob([`﻿${m}`], { type: 'text/plain;charset=utf-8' }));
    return `${H.tablo([['Sayfa', l.length], ['Kelime', H.sayi(kel), 1]])}<textarea class="ar-metin-c" readonly aria-label="Çıkarılan metin" style="margin-top:12px">${H.esc(m)}</textarea>${H.eylemler(H.btn('kopyala', 'Tümünü kopyala', ` data-metin="${H.esc(m)}"`))}${H.ciktiListe()}${bos ? H.not(`${bos} sayfada metin bulunamadı, bu sayfalar görüntü olabilir.`, 'uyari') : ''}`;
  },
  aciklama: [
    'Bir PDF içindeki yazı seçilip kopyalanabiliyorsa, dosyada görüntünün yanında gerçek bir metin katmanı var demektir. Bu araç o katmanı okur, sayfaları sırasıyla düz metne çevirir. Uzun bir sözleşmeden madde almak, tablodaki değerleri bir programa aktarmak, belgeyi çeviriye vermek ya da içinde hızlı arama yapmak için kullanılır. Sonucu ekranda kopyalayabilir veya TXT dosyası olarak indirebilirsiniz; dosya Türkçe karakterler bozulmasın diye UTF-8 kaydedilir.',
    'En önemli sınır şudur: taranmış belgede veya fotoğraftan yapılmış PDF\'te metin katmanı yoktur, sayfa yalnız görüntüdür. Böyle bir durumda araç boş sonuç göstermez, metin bulunamadığını açıkça yazar. Karışık belgelerde hangi sayfaların boş kaldığını sayısıyla bildirir. Metin tanıma (OCR) bu araçta yoktur, çünkü Türkçe için doğruluk düşük kaldığında yanlış rakamı doğru gibi göstermek hatalı veri riski taşır.',
    'PDF bir yazı dosyası değil, karakterlerin sayfadaki konumlarını tutan bir baskı biçimidir. Araç aynı yükseklikteki parçaları soldan sağa satırlara dizer, büyük boşluklarda sütun aralığı bırakır. Tek sütunlu belgelerde sonuç temizdir. İki sütunlu dergi düzeninde satırlar yan yana gelebilir, karmaşık tablolarda hücre sırası bozulabilir. Bazı PDF\'lerde yazı tipi karakter eşleşmesi eksik olduğunda harfler anlamsız çıkabilir; bu dosyanın üretim şeklinden kaynaklanır.',
  ],
  ornek: { baslik: 'Kullanım örneği: sözleşmeden madde kopyalamak', metin: [
    'Bir insan kaynakları uzmanı 40 sayfalık yönetmelikten yalnız izinle ilgili sayfaları özetlemek istiyor. Sayfalar alanına 18-22 yazar. Metin anında görünür, Tümünü kopyala düğmesiyle kendi notuna geçirir.',
    'Bir kullanıcı tarayıcıdan çıkmış fatura PDF dosyasını yüklediğinde araç metin bulunamadı uyarısı verir. Bu, faturanın görüntü olarak saklandığını anlatır. Kullanıcı yazı içeren özgün e-Arşiv PDF dosyasını satıcıdan isteyerek işini çözer.',
  ] },
  sss: [
    ['Taranmış PDF\'ten yazı alınır mı?', 'Hayır. Bu araç metin tanıma yapmaz. Yalnız PDF içinde gerçek yazı katmanı varsa çalışır.'],
    ['Türkçe karakterler doğru çıkar mı?', 'Yazı tipi doğru hazırlanmış PDF\'lerde evet. Karakter eşleşmesi eksik dosyalarda harfler bozuk çıkabilir.'],
    ['Tablolar korunur mu?', 'Tablo yapısı korunmaz, değerler satır satır gelir. Basit tablolarda sütunlar boşlukla ayrılır.'],
    ['Metin nereye kaydediliyor?', 'Hiçbir yere. Yalnız bu sayfada gösterilir, TXT dosyasını siz indirirseniz cihazınıza kaydolur.'],
  ],
};
