const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'favicon-olusturucu', kategori: 'gorsel', sira: 9, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, ilgili: ['resim-boyutlandirma', 'resim-arka-plan-silme', 'resim-kirpma'],
  kaynaklar: [{ ad: 'Google Search Central, Google Arama\'da favicon gösterme kılavuzu (güncelleme 2026-10-27)', url: 'https://developers.google.com/search/docs/appearance/favicon-in-search', tarih: GUNCELLEME, not: 'kare oran, en az 8 piksel, 48 pikselden büyük önerisi, desteklenen biçimler' }],
  ad: 'Favicon Oluşturucu', kisa: 'Logodan ICO ve PNG site simgesi seti üretin',
  baslik: 'Favicon Oluşturucu — Logodan ICO ve PNG Site Simgesi | NEBSOFT',
  ozet: 'Logonuzu yükleyin; favicon.ico, 16-512 piksel PNG simgeler ve Apple dokunmatik simgesi tek pakette hazır olsun. Sayfaya eklenecek HTML kodu da verilir. Üyelik yok.',
  sonucBaslik: 'Simge seti', aciklamaBaslik: 'Favicon nedir, doğru favicon nasıl hazırlanır?',
  program: { slug: 'eticaretpaketi', metin: 'Kendi markanızla online satış yapacaksanız E-ticaret paketi mağaza vitrini, ürün varyantları ve sipariş yönetimini hazır sunar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Logo seçin', tip: 'dosya', kabul: 'image/png,image/jpeg,image/webp,image/svg+xml', ipucu: 'veya sürükleyin. Kare ve en az 512 piksel önerilir' },
    { ad: 'kip', etiket: 'Kare değilse', tip: 'secim', deger: 'kenar', secenekler: [['kenar', 'Kenar ekle, tamamı görünsün'], ['kapla', 'Ortadan kırp']] },
    { ad: 'bosluk', etiket: 'İç boşluk (%)', tip: 'kaydirici', min: 0, max: 25, deger: '6' },
    { ad: 'zemin', etiket: 'Zemin', tip: 'secim', deger: 'seffaf', secenekler: [['seffaf', 'Saydam'], ['renk', 'Renkli']] },
    { ad: 'renk', etiket: 'Zemin rengi', tip: 'renk', deger: '#ffffff', goster: 'zemin=renk' },
    { ad: 'kose', etiket: 'Köşe yuvarlama (%)', tip: 'kaydirici', min: 0, max: 50, deger: '0', goster: 'zemin=renk' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Simgeler üretiliyor.</p>' : H.not('Logonuzu seçtiğinizde simgelerin küçük boyutlardaki görünümü burada çıkar.'); },
  isle: async function (v, H, c) {
    const b = await H.gorselAc(v.dosyalar[0]); const ciz = async (n) => {
      const t = H.tuval(n, n); const x = t.getContext('2d'); if (v.zemin === 'renk') { const r = n * Number(v.kose) / 100; x.fillStyle = v.renk; x.beginPath(); x.roundRect(0, 0, n, n, r); x.fill(); }
      const ic = n * (1 - 2 * Number(v.bosluk) / 100); const p = (n - ic) / 2; const o = H.olcek(b.width, b.height, { gen: ic, yuk: ic, kip: v.kip }); x.imageSmoothingQuality = 'high'; x.drawImage(b, o.kaynak.x, o.kaynak.y, o.kaynak.w, o.kaynak.h, p + o.hedef.x, p + o.hedef.y, o.hedef.w, o.hedef.h); return H.kaydet(t, 'image/png');
    };
    const ol = [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png'], [48, 'favicon-48x48.png'], [180, 'apple-touch-icon.png'], [192, 'android-chrome-192x192.png'], [512, 'android-chrome-512x512.png']]; const png = {}; for (const [n, ad] of ol) { if (c.iptal()) return ''; png[n] = await ciz(n); H.cikti(ad, png[n]); } const ufak = Math.min(b.width, b.height); b.close();
    const ico = H.ico(await Promise.all([16, 32, 48].map(async (n) => ({ boyut: n, png: await H.bayt(png[n]) })))); H.ciktilar.unshift({ ad: 'favicon.ico', blob: new Blob([ico], { type: 'image/x-icon' }) });
    const kod = '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">';
    return `<div class="ar-kod" style="gap:14px;align-items:center;flex-wrap:wrap">${[16, 32, 48, 180].map((n) => `<img src="${H.adres(png[n])}" width="${Math.min(n, 96)}" height="${Math.min(n, 96)}" alt="${n} piksel simge">`).join('')}</div>${H.ciktiListe()}<p><b>Sayfanın &lt;head&gt; bölümüne ekleyin:</b></p><textarea class="ar-metin-c" style="min-height:96px" readonly aria-label="HTML kodu">${H.esc(kod)}</textarea>${H.eylemler(H.btn('kopyala', 'Kodu kopyala', ` data-metin="${H.esc(kod)}"`))}${ufak < 192 ? H.not('Logonuz küçük olduğu için büyük simgeler bulanık görünebilir. Daha büyük dosya kullanın.', 'uyari') : ''}`;
  },
  aciklama: [
    'Favicon, tarayıcı sekmesinde sitenizin adının yanında duran küçük simgedir. Yer imlerinde, telefon ana ekranına eklenen kısayollarda ve Google arama sonuçlarında sitenizin adının yanında da görünebilir. Küçük bir ayrıntıdır, ama kullanıcının açık sekmeler arasında sitenizi bulmasını sağlar. Siteniz için tek bir simge yeterli olsa da farklı ekranlar farklı ölçüler ister, bu yüzden araç tek logodan altı PNG ve bir ICO üretir.',
    'Google, favicon için kare oran ister, en az 8 piksel şartı koyar ve 48 pikselden büyük dosya önerir. ICO ve PNG desteklenen biçimler arasındadır. Görselin görünmesi için ana sayfada link etiketiyle belirtilmesi, adresinin tarama engeli taşımaması ve sabit kalması gerekir. Google, uygun simgeyi göstermeyi garanti etmez ve simgenin görünmesi sitenin sıralamasını iyileştirmez, yalnız aramada tanınmasına yardım eder.',
    'En sık hata, ayrıntılı logoyu olduğu gibi küçültmektir. 16 piksele inince ince yazılar okunmaz olur; simge için logodaki tek bir harf veya işaret çok daha iyi sonuç verir. Araç üretilen simgeleri gerçek ölçüleriyle gösterir, böylece karar vermeden önce görürsünüz. İç boşluk ayarı logonun kenara yapışmasını önler. Koyu tema sekmesinde koyu logo kaybolabileceği için zemin rengi eklemek işe yarar.',
  ],
  ornek: { baslik: 'Kullanım örneği: yeni açılan pastane sitesi', metin: [
    'Bir pastane sahibi uzun yazılı logosunu yüklediğinde 16 piksellik simgede yazının okunmadığını görüyor. Logonun yalnız baş harfinden oluşan kare bir kesimini Resim Kırpma aracında çıkarıp buraya yüklüyor, zemini marka rengi yapıp köşeyi biraz yuvarlıyor.',
    'Dosyaları ZIP olarak indirip sitesinin kök klasörüne yüklüyor, verilen üç satırlık kodu sayfanın başına ekliyor. Sekmede simge görünüyor. Google arama sonucundaki simgenin yenilenmesi ise taramaya bağlı olduğu için hemen olmayabilir.',
  ] },
  sss: [
    ['ICO mu PNG mi kullanmalıyım?', 'İkisini de koymak en güvenlisidir. Paket her ikisini içerir, kod da ikisini tanımlar.'],
    ['Favicon Google sonuçlarında neden görünmüyor?', 'Google taramaya bağlı olarak günceller, gösterimi garanti etmez. Dosyanın engellenmediğinden ve ana sayfada tanımlı olduğundan emin olun.'],
    ['SVG logo yükleyebilir miyim?', 'Evet. Tarayıcı SVG dosyasını açabiliyorsa araç onu PNG ve ICO olarak üretir.'],
    ['Logom kare değil, ne yapmalıyım?', 'Kenar ekleme seçeneği logonun tamamını korur, ortadan kırpma ise kareyi doldurur. Küçük ölçüde hangisinin okunduğuna bakarak seçin.'],
  ],
};
