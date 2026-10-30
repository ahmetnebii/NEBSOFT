module.exports = {
  slug: 'csv-excel-temizleme', kategori: 'belge', sira: 20, renk: '#0f766e', guncelleme: '2026-10-31', canli: true, tek: true, ilgili: ['liste-karsilastirma', 'turkce-metin-duzenleme', 'iban-dogrulama'],
  ad: 'CSV ve Excel Temizleme', kisa: 'Bozuk Türkçe harfleri, görünmez boşlukları ve yinelenen satırları tablodan temizleyin',
  baslik: 'CSV ve Excel Temizleme — Bozuk Karakter, Yinelenen Satır | NEBSOFT',
  ozet: 'CSV veya Excel dosyasındaki bozuk Türkçe harfleri, fazla boşlukları, boş ve yinelenen satırları temizleyin, CSV ya da Excel olarak indirin. Dosya cihazınızda kalır.',
  sonucBaslik: 'Temiz tablo', aciklamaBaslik: 'Tablo dosyası neden bozulur, araç neyi düzeltir?',
  program: { slug: 'marketprogrami', metin: 'Ürün listenizi temizledikten sonra Market programına Excel veya CSV dosyasıyla aktarabilirsiniz. Barkodlu satış, stok ve kâr raporları aynı listeden çalışır.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'CSV veya Excel dosyası seçin', tip: 'dosya', kabul: '.csv,.tsv,.txt,.xlsx,.xls' },
    { ad: 'veri', etiket: 'Ya da tabloyu buraya yapıştırın', tip: 'cokmetin', ipucu: 'Dosya seçilince bu kutu kullanılmaz.', deger: 'Ürün Adı;Barkod;Fiyat;\nKÄ±rmÄ±zÄ± Ã‡aydanlÄ±k;08690000000012;149,90;\n  Bardak  Takımı ;08690000000029;89,50;\n\nKÄ±rmÄ±zÄ± Ã‡aydanlÄ±k;08690000000012;149,90;\nÞemsiye;08690000000036;210;' },
    { ad: 'onar', etiket: 'Bozuk Türkçe harfleri onar', tip: 'onay', deger: true },
    { ad: 'bosluk', etiket: 'Fazla ve görünmez boşlukları sil', tip: 'onay', deger: true },
    { ad: 'bosSatir', etiket: 'Boş satırları sil', tip: 'onay', deger: true },
    { ad: 'bosSutun', etiket: 'Boş sütunları sil', tip: 'onay', deger: true },
    { ad: 'tekrar', etiket: 'Yinelenen satırları sil', tip: 'onay', deger: true },
    { ad: 'tekrarSutun', etiket: 'Yineleme için bakılacak sütun', yer: 'Boşsa satırın tamamı', ipucu: 'Başlık adı veya sütun sırası. Örnek: Barkod', goster: 'tekrar=true' },
    { ad: 'bicim', etiket: 'İndirme biçimi', tip: 'secim', deger: 'xlsx', secenekler: [['xlsx', 'Excel (.xlsx)'], ['csv', 'CSV']] },
    { ad: 'ayrac', etiket: 'CSV ayracı', tip: 'secim', deger: 'noktali', goster: 'bicim=csv', secenekler: [['noktali', 'Noktalı virgül (Türkçe Excel)'], ['virgul', 'Virgül'], ['sekme', 'Sekme']] },
    { ad: 'sayfa', etiket: 'Excel sayfa numarası', tip: 'sayi', deger: '1', ipucu: 'Excel dosyasında birden çok sayfa varsa.' },
  ],
  hesap: function (v, H) {
    if (v.dosyalar.length) return '<p class="ar-bos">Dosya okunuyor.</p>'; if (!v.veri) throw new Error('Dosya seçin veya tabloyu kutuya yapıştırın');
    const a = H.ayracBul(v.veri); return H.temizGoster(H.tabloTemizle(H.csvOku(v.veri, a), v), v, 'tablo', { ayrac: H.ayracAd(a) });
  },
  isle: async function (v, H, c) {
    const f = v.dosyalar[0]; if (f.size > 52428800) throw new Error('Dosya 50 MB sınırını aşıyor. Tarayıcıda güvenle işlenebilmesi için dosyayı parçalara ayırın.'); if (/\.xls$/i.test(f.name)) throw new Error('Eski .xls biçimi okunamıyor. Dosyayı Excel\'de açıp .xlsx olarak kaydedin, sonra yeniden seçin.');
    const no = v.sayfa >= 1 ? Math.floor(v.sayfa) : 1; const k = `t${/\.xlsx$/i.test(f.name) ? no : 1}`;
    if (!c.durum[k]) { const b = await H.bayt(f); if (/\.xlsx$/i.test(f.name)) c.durum[k] = await H.xlsxOku(b, no); else { const m = H.metinCoz(b); const a = H.ayracBul(m.metin); c.durum[k] = { satirlar: H.csvOku(m.metin, a), kodlama: m.kodlama, ayrac: H.ayracAd(a) }; } }
    if (c.iptal()) return ''; const d = c.durum[k]; const s = d.sayfalar || [];
    const t = H.tabloTemizle(d.satirlar, v); const h = H.temizGoster(t, v, H.dosyaKok(f.name), { kodlama: d.kodlama, ayrac: d.ayrac, not: s.length > 1 ? H.not(`Dosyada ${s.length} sayfa var: ${s.map(H.esc).join(', ')}. Şu an "${H.esc(d.secili)}" işleniyor${d.gizli ? ' (gizli sayfa)' : ''}.`) : '' }); const u = H.dosya;
    if (v.bicim === 'xlsx') { const b = await H.xlsxSikisik(t.satirlar); if (c.iptal()) return ''; H.dosya = { ad: u.ad, tur: u.tur, icerik: b }; } return h;
  },
  aciklama: [
    'Bir tabloyu başka programa aktarırken çıkan hataların çoğu verinin kendisinden değil, dosyanın taşınma biçiminden gelir. Eski bir programdan alınan CSV dosyası Windows-1254 ile yazılmış olabilir, yeni program onu UTF-8 sanınca ş ve ğ harfleri bozulur. Tersi olduğunda KÄ±rmÄ±zÄ± gibi yazılar çıkar. Web sayfasından kopyalanan hücrelerde gözle görünmeyen bölünmez boşluk bulunur; iki hücre aynı görünse de eşleşmez. Bu araç bu tür kusurları hücre hücre bulur ve kaç hücreye dokunduğunu sayıyla yazar.',
    'Dosya seçtiğinizde kodlama, ayraç ve sütunlar otomatik okunur. CSV, TSV, TXT ve XLSX dosyaları kabul edilir. Dosya yoksa tabloyu kutuya yapıştırmanız yeterlidir. Sonuç hemen ekranda önizlenir, istediğiniz biçimde indirilir. CSV indirilirken Türkçe Excel doğru açsın diye noktalı virgül ve UTF-8 işareti kullanılır. Excel çıktısında başı sıfırlı barkodlar ve 10 haneden uzun numaralar metin olarak korunur, sayılar ve GG.AA.YYYY tarihleri gerçek sayı ve tarih olarak yazılır.',
    'Aracın sınırlarını bilmek önemlidir. Formüllerin yalnız son hesaplanmış değeri alınır, renk ve yazı biçimi gibi görünüş ayarları ile birleştirilmiş hücreler korunmaz. Parola korumalı Excel dosyaları ve eski .xls biçimi açılmaz. Daha önce Excel\'e kaydedilirken baştaki sıfırı veya harfi kaybolmuş bilgi geri getirilemez, çünkü o bilgi dosyada artık yoktur. Sütun sayısı tutmayan satırlar otomatik kaydırılmaz; satır numarasıyla bildirilir ve düzeltme kararı size kalır. Bu uyarı, kayan bir fiyatın yanlış ürüne yazılmasını önlemek içindir.',
  ],
  ornek: { baslik: 'Kullanım örneği: eski programdan alınan ürün listesi', metin: [
    'Bir hırdavatçı, kapanan programından 4.000 satırlık ürün listesini CSV olarak alıyor. Dosyayı açınca Şemsiye yerine Þemsiye yazıyor, bazı ürünler iki kez geçiyor, sonda boş bir sütun var. Dosyayı seçtiğinde araç kodlamayı bulur, harfleri onarır. Yineleme sütununa Barkod yazınca aynı barkodlu satırların yalnız ilki kalır.',
    'Sayfadaki örnek veride beş veri satırı var. Temizlikten sonra üç ürün kalır: boş satır ve tekrar eden Kırmızı Çaydanlık silinir, sondaki boş sütun kalkar, Bardak Takımı hücresindeki bölünmez boşluk düzeltilir. Sonucu Excel olarak indirip önce birkaç satırını kontrol etmek, ardından yeni programa aktarmak en güvenli yoldur.',
  ] },
  sss: [
    ['Excel dosyam sunucuya gidiyor mu?', 'Hayır. Dosya tarayıcınızda açılır ve işlenir, sayfa dış adrese veri göndermeyi de engeller. Müşteri ve fiyat listeleri için bu yüzden elverişlidir.'],
    ['Türkçe karakter sorunu neden çıkıyor?', 'Dosyayı yazan ve okuyan programlar farklı harf tablosu kullandığında aynı baytlar başka harfe dönüşür. Araç sık görülen iki bozulmayı geri çevirir. Yerinde � işareti görünen harfler ise dosyada kaybolmuştur, bunlar onarılamaz.'],
    ['Yinelenen satırları nasıl bulur?', 'Büyük ve küçük harf farkına bakmadan satırın tamamını karşılaştırır. Sütun adı yazarsanız yalnız o sütuna bakar ve ilk satırı bırakır. O sütunu boş olan satırlar yinelenen sayılmaz. İlk satır başlık kabul edilir ve hiç silinmez.'],
    ['Birden çok sayfası olan Excel dosyasını işler mi?', 'Her seferinde tek sayfa işlenir. Sayfa numarasını değiştirerek diğerine geçebilirsiniz, sayfa adları sonuçta listelenir.'],
    ['Kaç satıra kadar çalışır?', 'Sınır 50 MB dosyadır. Yüz binlerce satır cihazın belleğine göre birkaç saniye sürebilir.'],
  ],
};
