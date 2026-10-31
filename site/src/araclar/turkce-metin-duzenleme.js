module.exports = {
  slug: 'turkce-metin-duzenleme', kategori: 'belge', sira: 24, renk: '#be123c', guncelleme: '2026-10-31', tek: true, ilgili: ['csv-excel-temizleme', 'liste-karsilastirma', 'pdf-metin-cikarma'],
  ad: 'Türkçe Metin Düzenleme', kisa: 'I ve İ kuralına uygun büyük küçük harf, bozuk harf onarma ve Türkçe karakter çevirme',
  baslik: 'Türkçe Büyük Küçük Harf Çevirme ve Karakter Düzeltme | NEBSOFT',
  ozet: 'Metni I ve İ harflerini koruyarak büyük, küçük veya baş harfi büyük yazın. Bozuk Türkçe harfleri onarın, ş ve ğ harflerini s ve g yapın. Metin cihazınızda kalır.',
  sonucBaslik: 'Düzenlenmiş metin', aciklamaBaslik: 'Türkçe metin neden ayrı bir düzenleme ister?',
  program: { slug: 'onmuhasebeprogrami', metin: 'Cari unvanlarını her belgede yeniden düzenlemek yerine Ön Muhasebe programında bir kez doğru yazıp fatura ve mutabakat mektuplarında kullanabilirsiniz.' },
  alanlar: [
    { ad: 'metin', etiket: 'Metin', tip: 'cokmetin', deger: 'IŞIK İNŞAAT SANAYİ VE TİCARET LTD. ŞTİ.\nDİYARBAKIR\'DA ŞUBESİ OLAN ÖRNEK GIDA A.Ş.\nAYŞE-NUR ÇİÇEK' },
    { ad: 'islem', etiket: 'İşlem', tip: 'secim', deger: 'kelime', genis: true, secenekler: [['kelime', 'Her Kelimenin Baş Harfi Büyük'], ['cumle', 'Cümle düzeni: yalnız cümle başı büyük'], ['buyuk', 'TÜMÜ BÜYÜK HARF'], ['kucuk', 'tümü küçük harf'], ['onar', 'Bozuk Türkçe harfleri onar'], ['ascii', 'Türkçe harfleri kaldır: ş → s, ğ → g, ı → i']] },
    { ad: 'bosluk', etiket: 'Fazla boşlukları ve boş satırları da sil', tip: 'onay', deger: true },
  ],
  hesap: function (v, H) {
    if (!v.metin) throw new Error('Metin yazın veya yapıştırın'); let m = v.metin; let ek = '';
    if (v.bosluk) m = m.replace(/[  -  ]/g, ' ').replace(/[​-‍﻿­]/g, '').split(/\r?\n/).map((s) => s.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
    if (v.islem === 'kelime') m = H.kelimeBuyuk(m); else if (v.islem === 'cumle') m = H.cumleDuzeni(m); else if (v.islem === 'buyuk') m = H.trBuyuk(m); else if (v.islem === 'kucuk') m = H.trKucuk(m); else if (v.islem === 'ascii') m = H.ascii(m);
    else { const o = H.turkceOnar(m); m = o.metin; ek = H.not(o.onarilan ? `${H.sayi(o.onarilan)} bozuk harf onarıldı.` : 'Tanınan bir bozulma bulunamadı, metin aynı kaldı.'); if (o.kayip) ek += H.not(`${H.sayi(o.kayip)} harf (� işareti) geri getirilemez. Metni özgün kaynaktan yeniden alın.`, 'uyari'); }
    const satir = m.split('\n').length; const kelime = (m.match(/\S+/g) || []).length;
    return `<textarea class="ar-metin-c" readonly aria-label="Düzenlenmiş metin" style="min-height:150px">${H.esc(m)}</textarea>${H.eylemler(H.btn('kopyala', 'Metni kopyala', ` data-metin="${H.esc(m)}"`))}${H.tablo([['Karakter', H.sayi([...m].length)], ['Kelime', H.sayi(kelime)], ['Satır', H.sayi(satir)]])}${ek}`;
  },
  aciklama: [
    'Türkçe alfabesinde i harfinin büyüğü İ, ı harfinin büyüğü I\'dır. İngilizce kuralla çalışan programlar bu ayrımı bilmez: Excel\'in BÜYÜKHARF işlevi veya bir web sitesi dil ayarına göre “diyarbakır” sözcüğünü DIYARBAKIR, “IŞIK” sözcüğünü işik yapabilir. Bu araç çevirmeyi Türkçe dil kuralıyla yapar. Eski bir programdan BÜYÜK HARFLE gelen müşteri unvanını okunur hâle getirmek, ürün adlarını aynı biçime sokmak veya bir başlığı büyük harfe çevirmek için kullanılır.',
    'Her kelimenin baş harfini büyütürken ve, ile, veya, de gibi bağlaçlar küçük kalır. A.Ş. ve T.C. gibi noktalı kısaltmalar büyük kalır, kesme işaretinden sonraki ek küçük yazılır, tireyle bağlanan adlarda iki parça da büyür. Onarma seçeneği iki sık bozulmayı düzeltir: Ã¼ gibi görünen UTF-8 metinleri ve þ ile ý harfli eski Windows metinleri. Türkçe harfleri kaldırma seçeneği ise SMS, dosya adı, e-posta adresi veya banka açıklaması gibi yalnız İngilizce harf kabul eden alanlar içindir.',
    'Araç anlamı bilmez, yalnız harf kurallarını uygular. Cümle düzeninde özel adlar küçük kalır, çünkü hangisinin özel ad olduğunu ayırt edemez; Ankara yerine ankara çıkan yerleri elle düzeltin. Noktalı kısaltmadan sonra gelen kelime yeni cümle sanılabilir. Noktasız kısaltmalar da baş harfi büyük yazılır, örneğin KDV sözcüğü Kdv olur. Yazım denetimi yapmaz, yanlış yazılmış kelimeyi düzeltmez. Türkçe harfleri kaldırma işlemi geri alınamaz, sonuçtan özgün metne dönülmez. Tablo halindeki verilerde bütün dosyayı işlemek için CSV ve Excel Temizleme aracı daha uygundur.',
  ],
  ornek: { baslik: 'Kullanım örneği: büyük harfli cari listesi', metin: [
    'Bir muhasebe bürosu, eski programdan aldığı unvanları mutabakat mektubunda kullanacak. Sayfadaki örnekte üç satır büyük harfle yazılmış. Her kelimenin baş harfi büyük seçeneğiyle ilk satır Işık İnşaat Sanayi ve Ticaret Ltd. Şti. olur. I harfiyle başlayan Işık doğru kalır, Sanayi sonundaki i harfi noktalı çıkar.',
    'İkinci satırda Diyarbakır\'da ekindeki kesme işareti korunur, A.Ş. kısaltması bozulmaz. Üçüncü satır Ayşe-Nur Çiçek olur. Aynı metni dosya adında kullanmak isteyen kullanıcı Türkçe harfleri kaldır seçeneğine geçer ve ISIK INSAAT sonucunu alır. Fark, İ ve I harflerinin ikisinin de doğru İngilizce karşılığa dönmesidir.',
  ] },
  sss: [
    ['Excel\'de neden I harfi yanlış çıkıyor?', 'Excel ve birçok program bilgisayarın dil ayarına göre çevirir. İngilizce ayarda i harfi I olur, Türkçedeki noktalı İ kaybolur. Bu araç her zaman Türkçe kuralı kullanır.'],
    ['KDV ve NEBSOFT gibi kısaltmalar korunuyor mu?', 'Noktasız kısaltmaları araç ayıramaz, Kdv olarak yazar. Noktalı kısaltmalar korunur. Sonucu kopyalamadan önce bu kelimelere bakın.'],
    ['Kaç karaktere kadar çalışır?', 'Sabit sınır yok. Yazdıkça çalıştığı için çok uzun metinlerde kısa gecikme olabilir, karakter sayısı sonuçta görünür.'],
    ['Bozuk metnin hepsi onarılır mı?', 'Sık görülen kalıplar onarılır. Yerine � işareti gelmiş harfler kaybolmuştur. Bu durumda dosyayı doğru kodlamayla yeniden almak gerekir.'],
  ],
};
