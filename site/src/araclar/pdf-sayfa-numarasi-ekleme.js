const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'pdf-sayfa-numarasi-ekleme', kategori: 'pdf', sira: 8, renk: '#b91c1c', guncelleme: GUNCELLEME, ilgili: ['pdf-sayfa-duzenleme', 'pdf-birlestirme', 'pdf-filigran-ekleme'],
  ad: 'PDF Sayfa Numarası Ekleme', kisa: 'PDF\'e "Sayfa 3 / 12" gibi numara ekleyin, başlangıcı seçin',
  baslik: 'PDF Sayfa Numarası Ekleme — PDF\'e Numara Yazdırma | NEBSOFT',
  ozet: 'PDF sayfalarına numara ekleyin: konum, biçim ve başlangıç numarasını seçin, kapak sayfasını atlayın. Dilekçe ve dosya ekleri için. Belge sunucuya gönderilmez.',
  sonucBaslik: 'Numaralı PDF', aciklamaBaslik: 'PDF sayfalarına numara nasıl eklenir?',
  program: { slug: 'hukukburosuprogrami', metin: 'Dilekçe ve dosya ekleri hazırlıyorsanız Hukuk Bürosu programı dosyaları, duruşma ajandasını ve süreleri birlikte takip eder.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'bicim', etiket: 'Biçim', tip: 'secim', deger: 'sayfat', secenekler: [['s', '3'], ['st', '3 / 12'], ['sayfa', 'Sayfa 3'], ['sayfat', 'Sayfa 3 / 12'], ['tire', '- 3 -']] },
    { ad: 'yer', etiket: 'Konum', tip: 'secim', deger: 'alt-orta', secenekler: [['alt-orta', 'Alt orta'], ['alt-sag', 'Alt sağ'], ['alt-sol', 'Alt sol'], ['ust-orta', 'Üst orta'], ['ust-sag', 'Üst sağ'], ['ust-sol', 'Üst sol']] },
    { ad: 'bas', etiket: 'Başlangıç numarası', tip: 'sayi', deger: '1' },
    { ad: 'atla', etiket: 'Baştan atlanacak sayfa', tip: 'sayi', deger: '0', ipucu: 'Kapak için 1 yazın' },
    { ad: 'boyut', etiket: 'Yazı boyutu', tip: 'sayi', deger: '10' },
    { ad: 'renk', etiket: 'Renk', tip: 'renk', deger: '#111111' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'Numara ekle')) : H.not('PDF seçtiğinizde düğme burada görünür.'); },
  isle: async function (v, H, c) {
    const L = await H.pdfLib(); const f = v.dosyalar[0]; const d = await H.pdfYukle(f); const s = d.getPages(); const atla = Math.max(0, Math.floor(v.atla || 0)); if (atla >= s.length) throw new Error(`Bu dosyada ${s.length} sayfa var, ${atla} sayfa atlanamaz.`); const bas = Math.floor(v.bas ?? 1); const son = bas + s.length - atla - 1; const pt = Math.min(36, Math.max(6, v.boyut || 10)); const say = (v.yer.startsWith('ust') ? 28 : 28);
    const gom = new Map();
    for (let i = atla; i < s.length; i++) { if (i % 25 === 0) c.ilerle(i / s.length, `Sayfa ${i + 1}`); if (c.iptal()) return ''; const m = H.sayfaNumarasi(v.bicim, bas + i - atla, son); const t = H.metinTuval(m, { boyut: pt * 4, renk: v.renk, kalin: false }); const g = await d.embedPng(await H.tuvalPng(t)); gom.set(i, g); const w = t.width / 4, h = t.height / 4; const p = s[i]; const u = H.pdfOlcu(p); const q = H.konum(u.w, u.h, w, h, v.yer, say); H.pdfGorsel(L, p, g, { x: q.x, y: q.y, w, h }); }
    const b = await H.pdfBlob(d); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(f.name, 'numarali', 'pdf'), b); return `${H.tablo([['Numaralanan sayfa', s.length - atla, 1], ['Numaralar', `${bas} - ${son}`], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}`;
  },
  aciklama: [
    'Dosya ekleri, dilekçeler, tezler ve ihale evrakı sayfa numarası olmadan hem okunması hem de incelenmesi zor belgelerdir. Bir sayfa kaybolduğunda bunu anlamak için numara gerekir, bir eke atıf yapmak için de öyle. Birleştirilen farklı dosyaların kendi numaraları birbirini tutmaz; bu yüzden numaralandırma çoğu zaman son adımdır. Araç mevcut her sayfanın üstüne, kenar boşluğuna yakın küçük bir yazı ekler.',
    'Biçimler ihtiyaca göre seçilir. Tek rakam akademik çalışmalarda ve kitaplarda yaygındır, "Sayfa 3 / 12" ise toplam sayfayı gösterdiği için resmî evrakta ve sözleşmede eksik sayfayı belli eder. Başlangıç numarasını değiştirmek, ek dosyanın ana belgenin devamı gibi sürmesini sağlar: asıl dosyanız 40 sayfaysa eke 41 yazmanız yeterlidir. Baştan atlanacak sayfa sayısı kapak ve içindekiler sayfalarına numara basılmasını önler.',
    'Numaralar sayfanın üstüne eklendiği için mevcut içeriği kaydırmaz. Belgenizin kenar boşluğu çok darsa numara yazının üstüne denk gelebilir; bunu indirdikten sonra kontrol edin ve gerekirse konumu değiştirin. Numaranın önündeki yazıyı Türkçe olarak sayfaya görsel şeklinde yerleştiriyoruz, böylece her PDF okuyucuda aynı görünür. Araç yan çevrilmiş sayfalarda da numarayı ekrandaki alt kenara koyar.',
  ],
  ornek: { baslik: 'Kullanım örneği: dilekçe eki ve kapaklı rapor', metin: [
    'Bir avukat 14 sayfalık dilekçesine 28 sayfalık bir ek hazırlıyor ve ekin sayfalarının 15 ile başlamasını istiyor. Başlangıç numarasına 15 yazar, "Sayfa 15 / 42" biçimi yerine düz rakam seçer ve sonucu dosyaya koyar.',
    'Bir mühendis 30 sayfalık raporunda kapak sayfasını numarasız bırakmak istiyor. Baştan atlanacak sayfa alanına 1 yazar. İkinci sayfa "Sayfa 1 / 29" olarak başlar, kapak temiz kalır.',
  ] },
  sss: [
    ['Numaraya 1\'den farklı bir sayıyla başlayabilir miyim?', 'Evet, başlangıç numarası alanına istediğiniz sayıyı yazın.'],
    ['Kapak sayfası numarasız kalabilir mi?', 'Evet. Baştan atlanacak sayfa alanına 1 yazın. Numara ikinci sayfadan başlar.'],
    ['Mevcut numaralar silinir mi?', 'Hayır. Araç üzerine ekler. Belgede eski numara varsa farklı bir konum seçin.'],
    ['Numara yazının üstüne biner mi?', 'Kenar boşluğu çok darsa binebilir. Sonucu kontrol edin, konumu veya yazı boyutunu değiştirin.'],
  ],
};
