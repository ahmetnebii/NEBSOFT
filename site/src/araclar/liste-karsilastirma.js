module.exports = {
  slug: 'liste-karsilastirma', kategori: 'belge', sira: 21, renk: '#7c3aed', guncelleme: '2026-10-31', tek: true, ilgili: ['csv-excel-temizleme', 'cari-mutabakat-mektubu', 'turkce-metin-duzenleme'],
  ad: 'Liste Karşılaştırma', kisa: 'İki listeden yalnız birinde olanları ve ortak olanları yazım farkını yok sayarak bulun',
  baslik: 'Liste Karşılaştırma — İki Listedeki Farkları Bulma | NEBSOFT',
  ozet: 'İki listeyi yapıştırın, yalnız birinde olanları ve ortakları görün. Büyük küçük harf, Türkçe harf ve telefon yazım farkı eşleşmeyi bozmaz. Liste cihazınızda kalır.',
  sonucBaslik: 'Karşılaştırma sonucu', aciklamaBaslik: 'İki liste nasıl karşılaştırılır?',
  program: { slug: 'crmprogrami', metin: 'Müşteri listelerini dosyalar arasında karşılaştırmak yerine tek yerde tutmak isterseniz CRM programı kişileri, görüşmeleri ve satış aşamalarını bir arada izler.' },
  alanlar: [
    { ad: 'a', etiket: 'Birinci liste (her satıra bir değer)', tip: 'cokmetin', deger: 'Ayşe Yılmaz\nMEHMET KAYA\nFatma Şahin\nAli Çelik\nZeynep Demir\nali çelik' },
    { ad: 'b', etiket: 'İkinci liste (her satıra bir değer)', tip: 'cokmetin', deger: 'ayse yilmaz\nMehmet Kaya\nHasan Öztürk\nAli Çelik\nElif Arslan' },
    { ad: 'kip', etiket: 'Nasıl eşleşsin?', tip: 'secim', deger: 'esnek', genis: true, secenekler: [['esnek', 'Esnek: büyük küçük harf, Türkçe harf, noktalama önemsiz'], ['harf', 'Normal: yalnız büyük küçük harf ve boşluk önemsiz'], ['tam', 'Tam: harfi harfine aynı olmalı'], ['telefon', 'Telefon: başındaki 0, +90 ve boşluklar önemsiz']] },
    { ad: 'ilk', etiket: 'Excel\'den yapıştırdım, yalnız ilk sütuna bak', tip: 'onay' },
  ],
  hesap: function (v, H) {
    const r = H.listeKarsilastir(v); const liste = (ad, l) => `<h3 style="margin:16px 0 6px;font-size:15px">${ad} (${H.sayi(l.length)})</h3>${l.length ? `<textarea class="ar-metin-c" readonly aria-label="${ad}" style="min-height:110px">${H.esc(l.join('\n'))}</textarea>${H.eylemler(H.btn('kopyala', 'Kopyala', ` data-metin="${H.esc(l.join('\n'))}"`))}` : '<p class="ar-bos" style="margin:0">Kayıt yok.</p>'}`;
    H.dosya = { ad: 'liste-karsilastirma.csv', tur: 'text/csv;charset=utf-8', icerik: `﻿${H.csvYaz([['Durum', 'Değer'], ...r.yalnizA.map((x) => ['Yalnız birinci listede', x]), ...r.yalnizB.map((x) => ['Yalnız ikinci listede', x]), ...r.ortak.map((x) => ['İki listede de', x])], ';')}` };
    return `${H.tablo([['Birinci liste', `${H.sayi(r.adetA)} satır`], ['İkinci liste', `${H.sayi(r.adetB)} satır`], ['İki listede de olan', H.sayi(r.ortak.length), 1], r.farkli ? ['Farklı yazılmış ama eşleşen', H.sayi(r.farkli)] : null, r.tekrarA ? ['Birinci listede yinelenen', H.sayi(r.tekrarA)] : null, r.tekrarB ? ['İkinci listede yinelenen', H.sayi(r.tekrarB)] : null])}${liste('Yalnız birinci listede', r.yalnizA)}${liste('Yalnız ikinci listede', r.yalnizB)}${liste('İki listede de', r.ortak)}${H.eylemler(H.btn('dosya', 'Tümünü CSV indir'))}`;
  },
  aciklama: [
    'Sayım sonrası elinizde iki liste olur: rafta bulunanlar ve sistemde görünenler. Aynı durum bayram kargosu gönderilen müşteriler, aidat ödeyen üyeler ya da eski ve yeni tedarikçi listesi için de geçerlidir. Soru hep aynıdır: hangisi birinde var, ötekinde yok? Bu araç iki listeyi satır satır eşleştirir ve üç sonuç verir: yalnız birinci listede olanlar, yalnız ikinci listede olanlar, ikisinde de olanlar. Her sonucu ayrı kopyalayabilir, hepsini tek CSV dosyasında indirebilirsiniz.',
    'Excel\'in DÜŞEYARA işlevinde sık karşılaşılan sorun, gözle aynı görünen değerlerin eşleşmemesidir. Sonda kalan bir boşluk, MEHMET ile Mehmet farkı veya Yılmaz yerine Yilmaz yazılması sonucu bozar. Esnek eşleşme bu farkları yok sayar. Türkçede I ve İ kuralı dikkate alındığı için IŞIK ile ışık aynı kabul edilir. Telefon eşleşmesi 0532, +90 532 ve 532 ile başlayan yazımları, parantezleri ve boşlukları tek biçime indirger. Excel\'den iki sütunlu veri yapıştırdıysanız ilk sütuna bakma seçeneğini işaretleyin.',
    'Bu araç benzerlik tahmini yapmaz. Mehmet ile Mehmed veya kısaltılmış bir firma unvanı farklı değer sayılır, çünkü yakın olanı otomatik eşleştirmek yanlış müşteriyi doğru göstermeye yol açabilir. Esnek kipte Ayşe ile Ayse aynıdır, ancak bu ayrı iki kişi de olabilir. Aynı ada sahip kişilerde telefon veya kimlik numarası gibi tekil bir değerle karşılaştırmak daha sağlıklıdır. Yinelenen satırlar sonuçta bir kez gösterilir ve kaç tane olduğu ayrıca yazılır.',
  ],
  ornek: { baslik: 'Kullanım örneği: etkinliğe gelen üyeler', metin: [
    'Bir dernek, davetiye gönderdiği üyelerle yoklama listesini karşılaştırmak istiyor. Sayfadaki örnekte birinci listede 6 satır, ikinci listede 5 satır var. Esnek eşleşmede ayse yilmaz ile Ayşe Yılmaz aynı kişi sayılır, Ali Çelik birinci listede iki kez yazıldığı için yinelenen olarak bildirilir.',
    'Sonuç olarak üç kişi iki listede de bulunur. Fatma Şahin ile Zeynep Demir yalnız birinci listede, Hasan Öztürk ile Elif Arslan yalnız ikinci listede kalır. Dernek böylece davet edilip gelmeyenleri ve davetsiz gelenleri ayrı ayrı görür. Eşleşme kipini tam yaparsa yazım farkları yüzünden yalnız Ali Çelik ortak kalır, aradaki fark da yazım hatalarını ortaya çıkarır.',
  ] },
  sss: [
    ['Kaç satırlık liste karşılaştırabilirim?', 'Sabit bir sınır yok. On binlerce satır cihazda rahat çalışır, çok büyük listelerde yazarken kısa bir bekleme olabilir.'],
    ['Listenin sırası önemli mi?', 'Hayır. Satırlar konumuna göre değil, içeriğine göre eşleştirilir. Sonuçta birinci listedeki sıra korunur.'],
    ['İki sütuna göre karşılaştırma yapabilir miyim?', 'Hayır, her satır tek değer sayılır. İlk sütun seçeneği işaretli değilse tüm satır tek metin olarak karşılaştırılır.'],
    ['Telefon numaraları nasıl eşleşiyor?', 'Rakam dışındaki karakterler atılır, başta kalan 0, 90 veya 0090 çıkarılır. Geriye kalan numaralar karşılaştırılır.'],
  ],
};
