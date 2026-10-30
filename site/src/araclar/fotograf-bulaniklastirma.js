const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'fotograf-bulaniklastirma', kategori: 'gorsel', sira: 6, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, tek: true, ilgili: ['exif-konum-bilgisi-silme', 'resime-filigran-ekleme', 'resim-kirpma'],
  ad: 'Fotoğraf Bulanıklaştırma ve Bilgi Gizleme', kisa: 'Plaka, yüz, telefon ve kimlik numarasını kapatın',
  baslik: 'Fotoğraf Bulanıklaştırma — Yüz, Plaka, Yazı Kapatma | NEBSOFT',
  ozet: 'Fotoğraftaki plakayı, yüzü, telefon veya TC kimlik numarasını seçip kapatın: düz bant, mozaik ya da bulanık. Fotoğraf cihazınızdan çıkmaz, sunucuya gönderilmez.',
  sonucBaslik: 'Gizlenecek alanları işaretleyin', aciklamaBaslik: 'Fotoğraftaki kişisel bilgi nasıl güvenle kapatılır?',
  program: { slug: 'otogaleriprogrami', metin: 'Araç ilanlarında plaka kapatıyorsanız Oto Galeri programı araç alışı, masraf, ekspertiz kaydı ve web vitrinini birlikte takip eder.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', ipucu: 'veya sürükleyin. Tek görsel' },
    { ad: 'kip', etiket: 'Gizleme yöntemi', tip: 'secim', deger: 'kapat', secenekler: [['kapat', 'Düz bant (en güvenli)'], ['mozaik', 'Mozaik'], ['bulanik', 'Bulanık']] },
    { ad: 'renk', etiket: 'Bant rengi', tip: 'renk', deger: '#000000', goster: 'kip=kapat' },
    { ad: 'guc', etiket: 'Güç', tip: 'kaydirici', min: 2, max: 10, deger: '6', goster: 'kip=mozaik|bulanik' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Alan seçimi hazırlanıyor.</p>' : H.not('Fotoğraf seçin, sonra gizlenecek yerin üzerinde sürükleyerek alan çizin.'); },
  hazirla: async function (v, H, c) { const b = await H.gorselAc(v.dosyalar[0]); const t = H.dolu(b.width, b.height, '#fff'); t.getContext('2d').drawImage(b, 0, 0); b.close(); c.durum.ilk = t; const g = H.tuval(t.width, t.height); g.getContext('2d').drawImage(t, 0, 0); c.durum.s = H.alanSecici(c.duzen, g, { coklu: true, degisti: c.degisti }); },
  isle: async function (v, H, c) {
    const d = c.durum; if (!d.s) return ''; const al = d.s.alanlar(); if (!al.length) return H.not('Fotoğraf üzerinde sürükleyerek gizlenecek alanı çizin. İstediğiniz kadar alan ekleyebilirsiniz.');
    const t = H.dolu(d.ilk.width, d.ilk.height, '#fff'); const x = t.getContext('2d'); x.drawImage(d.ilk, 0, 0); const guc = Number(v.guc); const blok = Math.max(6, Math.min(t.width, t.height) * guc / 250);
    al.forEach((a) => {
      if (v.kip === 'kapat') { x.fillStyle = v.renk; x.fillRect(a.x, a.y, a.w, a.h); }
      else if (v.kip === 'mozaik') { const ax = Math.floor(a.x), ay = Math.floor(a.y), aw = Math.max(1, Math.ceil(a.w)), ah = Math.max(1, Math.ceil(a.h)); const g = x.getImageData(ax, ay, aw, ah); H.mozaik(g.data, aw, ah, { x: 0, y: 0, w: aw, h: ah }, blok); x.putImageData(g, ax, ay); }
      else { const o = 1 / Math.max(4, blok); const k = H.tuval(Math.max(1, Math.round(a.w * o)), Math.max(1, Math.round(a.h * o))); const y = k.getContext('2d'); y.imageSmoothingEnabled = true; y.drawImage(t, a.x, a.y, a.w, a.h, 0, 0, k.width, k.height); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(k, a.x, a.y, a.w, a.h); }
    });
    const blob = await H.kaydet(t, 'image/jpeg', 0.92); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(v.dosyalar[0].name, 'gizli', 'jpg'), blob);
    return `<img class="ar-onizle" src="${H.adres(blob)}" alt="Gizlenmiş görsel" width="${t.width}" height="${t.height}">${H.ciktiListe()}${v.kip !== 'kapat' ? H.not('Mozaik ve bulanıklık yazıyı tamamen yok etmeyebilir. Kimlik numarası ve parola gibi bilgilerde düz bant kullanın.', 'uyari') : ''}`;
  },
  aciklama: [
    'Araç ilanındaki plaka, sosyal medyaya konan fotoğrafta tanımadığınız bir kişinin yüzü, ekran görüntüsündeki telefon numarası veya paylaşılan belgede TC kimlik numarası kapatılması gereken bilgilerdir. Bu araçta fotoğrafın üzerinde sürükleyerek bir alan çizersiniz, alan seçtiğiniz yöntemle kapatılır. İstediğiniz kadar alan ekleyebilir, köşelerinden düzeltebilir, gerekmeyeni silebilirsiniz.',
    'Yöntem seçimi önemsiz değildir. Düz bant altındaki pikselleri tamamen ortadan kaldırır ve tek gerçekten güvenli yöntemdir. Mozaik ile bulanıklık ise görsel olarak daha yumuşaktır, fakat küçük ve düzenli yazılarda özellikle zayıf ayarlarda içerik tahmin edilebilir. Bu yüzden yüz ve plaka gibi görünüşü kapatmak için mozaik kullanılabilir, kimlik numarası, IBAN ve parola gibi bilgiler için düz bant seçin.',
    'Fotoğrafın üzerine başka bir programda çizilen şekil, dosya katmanlı saklanıyorsa kaldırılabilir. Burada sonuç tek düz görüntü olarak yeniden yazılır, altta başka katman kalmaz. Yeni dosya EXIF bilgisi de taşımaz; böylece gizlediğiniz fotoğraf çekim konumunu ele vermez. Önizlemeyi büyütüp kontrol edin: yansımalar, aynalar ve kâğıt arkasından görünen yazılar da aynı bilgiyi taşıyabilir.',
  ],
  ornek: { baslik: 'Kullanım örneği: plaka ve dekont fotoğrafı', metin: [
    'Bir galerici ilan fotoğrafındaki plakayı kapatacak. Fotoğrafı seçer, mozaiği açar, plakanın üzerinde sürükleyerek alan çizer. Aynı karede arkadaki aracın plakası da görünüyorsa ikinci bir alan çizer. Sonuç anında altta görünür.',
    'Bir işletme sahibi muhasebecisine dekont fotoğrafı yollayacak ama hesap numarasının tamamı görünsün istemiyor. Düz bant seçip numaranın üzerini kapatır. Bant altındaki pikseller yok olduğu için dosya başka biri tarafından geri açılamaz.',
  ] },
  sss: [
    ['Mozaikli yazı geri okunabilir mi?', 'Küçük ve düzenli yazılarda tahmin edilebilir. Hassas numara ve parolalarda düz bant kullanın.'],
    ['Yüzleri otomatik buluyor mu?', 'Hayır. Alanları siz çizersiniz. Bu sayede fotoğraf hiçbir yüz tanıma sistemine girmez, ama kontrol sizdedir.'],
    ['Fotoğrafımın EXIF ve konum bilgisi de silinir mi?', 'Evet. Çıktı yeniden kodlandığı için özgün EXIF bilgisi yeni dosyaya geçmez.'],
    ['PDF içindeki bilgiyi de kapatabilir miyim?', 'Bu araç görselle çalışır. Metin içeren PDF\'te bant çizmek altındaki yazıyı silmeyebilir. Sayfayı önce görsele çevirip burada kapatın.'],
  ],
};
