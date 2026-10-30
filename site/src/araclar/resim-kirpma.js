const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resim-kirpma', kategori: 'gorsel', sira: 4, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, tek: true, ilgili: ['resim-boyutlandirma', 'fotograf-bulaniklastirma', 'favicon-olusturucu'],
  ad: 'Resim Kırpma ve Döndürme', kisa: 'Fotoğrafı fareyle veya parmakla kırpın, döndürün, aynalayın',
  baslik: 'Resim Kırpma ve Döndürme — Fotoğraf Kesme, Çevirme | NEBSOFT',
  ozet: 'Fotoğrafın istediğiniz bölümünü seçip kesin, 1:1 veya 16:9 gibi oran kilitleyin, 90 derece döndürün, aynalayın. Yan çıkan görseli düzeltin. Dosya gönderilmez.',
  sonucBaslik: 'Kırpılacak alanı seçin', aciklamaBaslik: 'Fotoğraf nasıl kırpılır ve döndürülür?',
  program: { slug: 'otogaleriprogrami', metin: 'Araç fotoğraflarını galerinizin vitrininde yayınlıyorsanız Oto Galeri programı alış ve masrafla gerçek kârı, ilan takibini ve web vitrinini birlikte yönetir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', ipucu: 'veya sürükleyin. Kırpılacak tek görsel' },
    { ad: 'oran', etiket: 'Oran', tip: 'secim', deger: '0', secenekler: [['0', 'Serbest'], ['1', 'Kare (1:1)'], ['1.3333', 'Yatay (4:3)'], ['0.75', 'Dikey (3:4)'], ['1.7778', 'Geniş (16:9)'], ['0.5625', 'Hikâye (9:16)']] },
    { ad: 'aci', etiket: 'Döndür', tip: 'secim', deger: '0', secenekler: [['0', 'Döndürme'], ['90', 'Sağa 90°'], ['180', '180°'], ['270', 'Sola 90°']] },
    { ad: 'ayna', etiket: 'Yatay aynala', tip: 'onay', deger: false },
    { ad: 'bicim', etiket: 'Çıktı', tip: 'secim', deger: 'image/jpeg', secenekler: [['image/jpeg', 'JPG'], ['image/png', 'PNG'], ['image/webp', 'WebP']] },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Seçim hazırlanıyor.</p>' : H.not('Fotoğraf seçtiğinizde üzerinde sürüklenebilir bir kırpma alanı açılır.'); },
  hazirla: async function (v, H, c) { const f = v.dosyalar[0]; const b = await H.gorselAc(f); const t = H.dolu(b.width, b.height, ''); t.getContext('2d').drawImage(b, 0, 0); b.close(); c.durum.t = t; c.durum.s = H.alanSecici(c.duzen, t, { baslangic: { x: t.width * 0.1, y: t.height * 0.1, w: t.width * 0.8, h: t.height * 0.8 }, degisti: c.degisti }); c.durum.oran = '0'; },
  isle: async function (v, H, c) {
    const d = c.durum; if (!d.s) return ''; if (d.oran !== v.oran) { d.oran = v.oran; d.s.oran(Number(v.oran)); } const a = d.s.alanlar()[0]; const w = Math.round(a.w), h = Math.round(a.h); const aci = Number(v.aci); const yan = aci === 90 || aci === 270;
    const t = H.dolu(yan ? h : w, yan ? w : h, v.bicim === 'image/jpeg' ? '#fff' : ''); const x = t.getContext('2d'); x.translate(t.width / 2, t.height / 2); x.rotate(aci * Math.PI / 180); if (v.ayna) x.scale(-1, 1); x.drawImage(d.t, a.x, a.y, a.w, a.h, -w / 2, -h / 2, w, h);
    const blob = await H.kaydet(t, v.bicim, 0.92); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(v.dosyalar[0].name, 'kirpilmis', H.turUzanti(blob.type)), blob);
    return `<img class="ar-onizle" src="${H.adres(blob)}" alt="Kırpılmış görsel" width="${t.width}" height="${t.height}">${H.tablo([['Yeni ölçü', `${t.width} × ${t.height} px`, 1], ['Boyut', H.boyutYaz(blob.size)]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'Kırpma, görselin dışında kalmasını istediğiniz kısımları atar; piksel ölçüsü küçülür ama kalan bölümün keskinliği değişmez. Fotoğraf seçilince üzerinde bir çerçeve açılır. Çerçeveyi ortasından tutup taşıyın, köşelerinden büyütüp küçültün. Telefonda parmakla da çalışır. Sonuç hemen altında görünür, beğenmezseniz çerçeveyi kaydırmanız yeterlidir.',
    'Oran kilidi, çıktının belirli bir şekilde olmasını garanti eder. Profil resmi ve katalog görseli için kare, sunum için 16:9, telefon ekranı için 9:16 seçilebilir. Serbest modda oran sınırı yoktur. Burada amaç şekil vermektir: belirli bir piksel değerine ulaşmak gerekiyorsa sonucu Resim Boyutlandırma aracından geçirin, çünkü iki adım ayrı işlerdir.',
    'Döndürme ve aynalama aynı ekrandadır, çünkü çoğu zaman fotoğraf kırpılmadan önce düzeltilmek istenir. Yan çıkan bir belge fotoğrafını sağa veya sola 90 derece çevirebilir, ters tutulmuş bir görseli 180 derece döndürebilirsiniz. Yatay aynalama ise ön kamerayla çekilmiş ters yazıları düzeltir. Dönüş kayıpsız değildir, yeniden kaydedilir; ama açılı düzeltme yapılmadığı için ek bulanıklık oluşmaz.',
  ],
  ornek: { baslik: 'Kullanım örneği: kimlik fotokopisinden gereksiz alanı atmak', metin: [
    'Bir galerici aracı geniş açıyla çekmiş; karede komşu araç ve duvar da görünüyor. Oranı 4:3 seçer, çerçeveyi yalnız satılık aracı içine alacak şekilde sürükler. Aynı oranla çektiği tüm görseller vitrinde hizalı görünür.',
    'Bir ofis çalışanı ise telefonla çektiği faturanın yan durduğunu ve masanın da kareye girdiğini fark eder. Sağa 90 derece çevirir, çerçeveyi kâğıdın kenarlarına oturtur ve PNG olarak indirir. Yazılar özgün çözünürlükte kalır.',
  ] },
  sss: [
    ['Telefondan kırpma yapabilir miyim?', 'Evet. Çerçeve parmakla taşınır, köşelerden büyür. Sayfa kaymasın diye çerçeve alanında dokunma kaydırma yerine kırpma yapar.'],
    ['Kırpınca kalite düşer mi?', 'Kalan pikseller aynı kalır, yalnız dosya yeniden kaydedilir. PNG seçerseniz kayıp olmaz.'],
    ['Fotoğrafı 5 derece gibi küçük açıyla döndürebilir miyim?', 'Hayır, bu araç 90 derecenin katlarında çalışır. Küçük açıda köşeler boş kalır ve görüntü yeniden örneklenir.'],
    ['Birden çok fotoğraf kırpabilir miyim?', 'Her fotoğrafın kırpılacak yeri farklı olduğu için araç tek dosyayla çalışır. Aynı ölçüye toplu indirmek için Resim Boyutlandırma aracını kullanın.'],
  ],
};
