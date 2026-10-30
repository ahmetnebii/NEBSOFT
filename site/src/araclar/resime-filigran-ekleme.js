const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resime-filigran-ekleme', kategori: 'gorsel', sira: 5, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, ilgili: ['pdf-filigran-ekleme', 'fotograf-bulaniklastirma', 'resim-sikistirma'],
  ad: 'Resime Filigran Ekleme', kisa: 'Fotoğrafa yazı veya logo koyun, izinsiz kullanımı zorlaştırın',
  baslik: 'Resime Filigran Ekleme — Fotoğrafa Yazı ve Logo Koyma | NEBSOFT',
  ozet: 'Fotoğrafa yazı veya logo filigranı ekleyin: köşeye tek sefer ya da tüm görsele tekrarlı. Saydamlık ve açı ayarı, toplu işlem. Dosyalar cihazınızdan çıkmaz.',
  sonucBaslik: 'Filigranlı görsel', aciklamaBaslik: 'Fotoğrafa filigran neden ve nasıl eklenir?',
  program: { slug: 'emlakprogrami', metin: 'İlan fotoğraflarınızı filigranlıyorsanız Emlak Ofisi programı portföyü, müşteri eşleştirmeyi, ilan takibini ve kira tahsilatını tek yerde tutar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', coklu: true, ipucu: 'veya sürükleyin. Aynı filigran hepsine uygulanır' },
    { ad: 'tur', etiket: 'Filigran', tip: 'secim', deger: 'metin', genis: true, secenekler: [['metin', 'Yazı'], ['logo', 'Logo görseli']] },
    { ad: 'metin', etiket: 'Yazı', deger: 'Örnek Emlak · 0212 000 00 00', genis: true, goster: 'tur=metin' },
    { ad: 'logo', etiket: 'Logo seçin (saydam PNG önerilir)', tip: 'dosya', kabul: 'image/png,image/jpeg,image/webp', goster: 'tur=logo' },
    { ad: 'renk', etiket: 'Yazı rengi', tip: 'renk', deger: '#ffffff', goster: 'tur=metin' },
    { ad: 'yer', etiket: 'Yerleşim', tip: 'secim', deger: 'tekrar', secenekler: [['tekrar', 'Tüm görsele tekrarlı'], ['orta', 'Ortada tek'], ['alt-sag', 'Sağ alt köşe'], ['alt-sol', 'Sol alt köşe'], ['ust-sag', 'Sağ üst köşe'], ['ust-sol', 'Sol üst köşe']] },
    { ad: 'boyut', etiket: 'Filigran büyüklüğü', tip: 'kaydirici', min: 3, max: 40, deger: '12' },
    { ad: 'opak', etiket: 'Görünürlük', tip: 'kaydirici', min: 10, max: 100, deger: '45' },
    { ad: 'aci', etiket: 'Açı', tip: 'kaydirici', min: 0, max: 60, adim: 5, deger: '30' },
  ],
  hesap: function (v, H) { if (!v.dosyalar.length) return H.not('Fotoğraf seçtiğinizde filigranın önizlemesi burada görünür.'); if (v.tur === 'logo' && !v.logo.length) return H.not('Logo görselini de seçin.'); if (v.tur === 'metin' && !v.metin) return H.not('Filigran yazısını girin.'); return '<p class="ar-bos">Filigran uygulanıyor.</p>'; },
  isle: async function (v, H, c) {
    if ((v.tur === 'logo' && !v.logo.length) || (v.tur === 'metin' && !v.metin)) return H.not('Filigran içeriğini girin.'); const logo = v.tur === 'logo' ? await H.gorselAc(v.logo[0]) : null; const n = v.dosyalar.length; let on = ''; const op = Number(v.opak) / 100, aci = Number(v.aci);
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; if (n > 1) c.ilerle(i / n, `${f.name} işleniyor`); if (c.iptal()) return ''; const b = await H.gorselAc(f); const t = H.dolu(b.width, b.height, '#fff'); const x = t.getContext('2d'); x.drawImage(b, 0, 0); b.close();
      const oranlar = Number(v.boyut) / 100 * Math.min(t.width, t.height); let m;
      if (logo) { const l = oranlar * 2; const lh = l * logo.height / logo.width; const r = aci * Math.PI / 180; const W = Math.ceil(Math.abs(l * Math.cos(r)) + Math.abs(lh * Math.sin(r))), Y = Math.ceil(Math.abs(l * Math.sin(r)) + Math.abs(lh * Math.cos(r))); m = H.tuval(W, Y); const y = m.getContext('2d'); y.globalAlpha = op; y.translate(W / 2, Y / 2); y.rotate(-r); y.drawImage(logo, -l / 2, -lh / 2, l, lh); } else m = H.metinTuval(v.metin, { boyut: Math.max(10, oranlar * 0.45), renk: v.renk, opak: op, aci });
      if (v.yer === 'tekrar') H.filigranIzgara(t.width, t.height, m.width * 1.35, m.height * 1.6 + oranlar * 0.5).forEach((p) => x.drawImage(m, p.x, p.y)); else { const p = H.konum(t.width, t.height, m.width, m.height, v.yer, Math.round(oranlar * 0.3)); x.drawImage(m, p.x, p.y); }
      const blob = await H.kaydet(t, 'image/jpeg', 0.9); H.cikti(H.dosyaAdi(f.name, 'filigranli', 'jpg'), blob); if (!i) on = `<img class="ar-onizle" src="${H.adres(blob)}" alt="Filigranlı görsel" width="${t.width}" height="${t.height}">`;
    }
    if (logo) logo.close(); return `${on}${H.ciktiListe()}`;
  },
  aciklama: [
    'Filigran, görselin üzerine yerleştirilen yazı veya logodur. İki farklı amaçla kullanılır. Emlak ilanı, araç ve ürün fotoğrafında görselin başkası tarafından kendi ilanı gibi kullanılmasını zorlaştırır ve iletişim bilginizi fotoğrafla birlikte taşır. Kimlik veya belge fotokopisinde ise başka bir amaç görür: "Yalnız X bankası başvurusu içindir" yazısı, görüntünün başka yerde kullanılmasını anlamsız kılar.',
    'Yerleşim koruma düzeyini belirler. Köşedeki küçük bir logo temiz görünür ama fotoğrafın kırpılmasıyla kolayca silinir. Tekrarlı filigran görselin tamamına yayılır, kırpılarak atılamaz; karşılığında görüntü biraz daha kalabalık olur. Belge korumada tekrarlı, marka imzası için köşe seçeneği daha uygundur. Görünürlük ayarını, filigran hem okunacak hem de ana görüntüyü kapatmayacak değere getirin.',
    'Filigran bir engeldir, kesin koruma değildir: yeterli çabayla görüntüden silinebilir ve tek başına bir hak doğurmaz. Yazı rengini fotoğrafa göre seçin, açık zeminde beyaz yazı görünmez. Logo için saydam PNG en iyi sonucu verir; JPG logoda beyaz kutu da görsele biner. Çıktı JPG olarak üretilir ve EXIF bilgisi taşımaz, yani özgün fotoğraftaki konum kaydı bu dosyaya geçmez.',
  ],
  ornek: { baslik: 'Kullanım örneği: emlak ofisi ve kimlik fotokopisi', metin: [
    'Bir emlak ofisi, daire için çektiği on iki fotoğrafı birlikte seçer. Yazıya ofis adını ve telefonunu yazar, tekrarlı yerleşimi ve yüzde 35 görünürlüğü seçer. İlk fotoğrafta sonucu kontrol edip hepsini ZIP olarak indirir.',
    'Bir kişi kimlik fotokopisini bir kuruma göndermek zorunda. Yazıya "Yalnız 30.10.2026 tarihli başvuru için" yazar, koyu gri renk ve 30 derece açı seçer. Filigran sayfanın tamamına yayıldığı için görüntü başka amaçla kullanılmaya uygun olmaz.',
  ] },
  sss: [
    ['Filigran sonradan silinebilir mi?', 'Köşedeki küçük filigran kırpılarak atılabilir. Tekrarlı olan çok daha zordur ama hiçbir filigran kesin koruma sağlamaz.'],
    ['Logomun etrafında beyaz kutu çıkıyor, neden?', 'Logo dosyanız saydam değildir. Saydam PNG kullanın. Resim Arka Plan Silme aracı düz zeminli logoyu saydam yapabilir.'],
    ['Türkçe karakter sorunu olur mu?', 'Hayır. Yazı doğrudan görselin üstüne çizildiği için ş, ğ, ı ve İ harfleri doğru görünür.'],
    ['Kimlik fotokopisine neden filigran eklenir?', 'Görüntünün hangi kurum ve amaç için verildiğini üzerine yazmak, başka bir yerde kullanılmasını zorlaştırır.'],
  ],
};
