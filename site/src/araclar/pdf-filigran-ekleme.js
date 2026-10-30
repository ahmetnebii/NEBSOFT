const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-filigran-ekleme', kategori: 'pdf', sira: 7, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['resime-filigran-ekleme', 'pdf-sayfa-numarasi-ekleme', 'pdf-imza-ekleme'],
  ad: 'PDF Filigran Ekleme', kisa: 'PDF sayfalarına "Taslak", "Gizli" gibi yazı veya logo basın',
  baslik: 'PDF Filigran Ekleme — PDF\'e Taslak, Gizli Yazısı Basma | NEBSOFT',
  ozet: 'PDF\'in her sayfasına Türkçe karakterli yazı veya logo filigranı ekleyin: TASLAK, GİZLİ, firma adı. Çapraz ya da tekrarlı. Belge tarayıcınızda işlenir, gönderilmez.',
  sonucBaslik: 'Filigranlı PDF', aciklamaBaslik: 'PDF dosyasına filigran neden ve nasıl eklenir?',
  program: { slug: 'onmuhasebeprogrami', metin: 'Teklif ve fatura gönderiyorsanız Ön Muhasebe programı teklif, fatura, cari hesap ve tahsilat takibini tek panelde yönetir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'tur', etiket: 'Filigran', tip: 'secim', deger: 'metin', genis: true, secenekler: [['metin', 'Yazı'], ['logo', 'Logo görseli']] },
    { ad: 'metin', etiket: 'Yazı', deger: 'TASLAK', genis: true, goster: 'tur=metin' },
    { ad: 'logo', etiket: 'Logo seçin (saydam PNG önerilir)', tip: 'dosya', kabul: 'image/png,image/jpeg,image/webp', goster: 'tur=logo' },
    { ad: 'renk', etiket: 'Renk', tip: 'renk', deger: '#b91c1c', goster: 'tur=metin' },
    { ad: 'yer', etiket: 'Yerleşim', tip: 'secim', deger: 'orta', secenekler: [['orta', 'Ortada çapraz'], ['tekrar', 'Tüm sayfaya tekrarlı'], ['ust-sag', 'Sağ üst köşe'], ['alt-sag', 'Sağ alt köşe']] },
    { ad: 'boyut', etiket: 'Büyüklük', tip: 'kaydirici', min: 10, max: 90, deger: '45' },
    { ad: 'opak', etiket: 'Görünürlük', tip: 'kaydirici', min: 5, max: 100, deger: '22' },
    { ad: 'aralik', etiket: 'Sayfalar', yer: 'Tümü', ipucu: 'Boşsa tüm sayfalar. Örnek: 1-3, 5' },
  ],
  hesap: function (v, H) { if (!v.dosyalar.length) return H.not('PDF seçtiğinizde filigran düğmesi burada görünür.'); if (v.tur === 'logo' && !v.logo.length) return H.not('Logo görselini de seçin.'); if (v.tur === 'metin' && !v.metin) return H.not('Filigran yazısını girin.'); return H.eylemler(H.btn('isle', 'Filigran ekle')); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const f = v.dosyalar[0]; const d = await H.pdfYukle(f); const s = d.getPages(); const l = H.sayfaAraligi(v.aralik, s.length); const op = Number(v.opak) / 100; const col = v.yer === 'orta' ? 40 : 0; let t;
    if (v.tur === 'logo') { const b = await H.gorselAc(v.logo[0]); const r = col * Math.PI / 180; const W = Math.ceil(b.width * Math.abs(Math.cos(r)) + b.height * Math.abs(Math.sin(r))), Y = Math.ceil(b.width * Math.abs(Math.sin(r)) + b.height * Math.abs(Math.cos(r))); t = H.tuval(W, Y); const x = t.getContext('2d'); x.globalAlpha = op; x.translate(W / 2, Y / 2); x.rotate(-r); x.drawImage(b, -b.width / 2, -b.height / 2); b.close(); } else t = H.metinTuval(v.metin, { boyut: 160, renk: v.renk, opak: op, aci: col });
    const g = await d.embedPng(await H.tuvalPng(t)); const oran = t.height / t.width;
    l.forEach((i, k) => { if (k % 20 === 0) c.ilerle(k / l.length, `Sayfa ${i + 1}`); const p = s[i]; const u = H.pdfOlcu(p); const w = u.w * Number(v.boyut) / 100; const h = w * oran; if (v.yer === 'tekrar') { const kw = w * 0.5, kh = h * 0.5; H.filigranIzgara(u.w, u.h, kw * 1.5, kh * 2.4 + 20).forEach((n) => H.pdfGorsel(L, p, g, { x: n.x, y: n.y, w: kw, h: kh })); } else { const q = H.konum(u.w, u.h, w, h, v.yer, 24); H.pdfGorsel(L, p, g, { x: q.x, y: q.y, w, h }); } });
    const b = await H.pdfBlob(d); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(f.name, 'filigranli', 'pdf'), b); return `${H.tablo([['İşlenen sayfa', l.length, 1], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}${H.not('Filigran sayfanın üstüne eklenen görseldir. Yazılar seçilebilir kalır, ama belge içeriği şifrelenmez.')}`;
  },
  aciklama: [
    'PDF filigranı, sayfanın üstüne binen yarı saydam bir yazı veya logodur. Belgenin durumunu bildirir ya da kaynağını gösterir. Henüz imzalanmamış sözleşmede TASLAK, kurum içi raporda GİZLİ, müşteriye gönderilen teklifte firma adı, fotokopisi verilen belgede "ASLI GİBİDİR DEĞİLDİR" gibi ifadeler en bilinen kullanımlardır. Yazı sayfanın hem baskısında hem ekranında görünür, kırpılarak kolayca atılamaz.',
    'PDF araçlarında sık karşılaşılan sorun Türkçe karakterdir: gömülü yazı tipleri ş, ğ, ı ve İ harflerini yazamaz, bu yüzden GİZLİ kelimesi bozuk çıkabilir. Burada yazıyı önce yüksek çözünürlüklü saydam görsele çizip sayfaya yerleştiriyoruz. Böylece Türkçe harfler her zaman doğru görünür ve yazı tipi belgeye eklenmez. Logo seçerseniz aynı mantıkla görselin kendisi kullanılır.',
    'Görünürlük ayarı burada önemlidir: çok koyu bir filigran belgeyi okunmaz yapar, yüzde 15 ile 30 arası genellikle yazıların arkasında kalır. Ortada çapraz tek filigran taslak ve gizlilik uyarıları için, tüm sayfaya tekrarlı olan ise fotokopi korumasına uygundur. Sayfa aralığı yazarak yalnız belirli sayfaları işaretleyebilirsiniz. Araç yan çevrilmiş sayfalarda da yazıyı ekrandaki yöne göre yerleştirir. Filigran dosyayı şifrelemez ve kopyalamayı engellemez.',
  ],
  ornek: { baslik: 'Kullanım örneği: taslak sözleşme ve kimlik kopyası', metin: [
    'Bir danışman müşteriye henüz bitmemiş sözleşmeyi gönderecek. Yazıya TASLAK yazar, yüzde 20 görünürlük ve ortada çapraz yerleşimi seçer. Yazıların arkasında kalan kırmızı filigran, belgenin bağlayıcı olmadığını her sayfada hatırlatır.',
    'Bir kişi kimlik fotokopisini PDF olarak bir kuruma verecek. "YALNIZ X BAŞVURUSU İÇİNDİR" yazar, tüm sayfaya tekrarlı seçeneğini ve açık gri rengi seçer. Filigran tüm sayfaya dağıldığı için görüntünün başka amaçla kullanılması zorlaşır.',
  ] },
  sss: [
    ['Türkçe karakterler bozulur mu?', 'Hayır. Yazı görsel olarak yerleştirildiği için ş, ğ, ı ve İ doğru görünür.'],
    ['Filigran sonradan kaldırılabilir mi?', 'Belirli PDF düzenleyicilerle kaldırılabilir. Filigran caydırıcıdır, kesin koruma değildir.'],
    ['Yalnız ilk sayfaya ekleyebilir miyim?', 'Evet, sayfalar alanına 1 yazın.'],
    ['Belgedeki yazılar seçilebilir kalır mı?', 'Evet. Filigran üstüne eklenir, mevcut metin katmanı değişmez.'],
  ],
};
