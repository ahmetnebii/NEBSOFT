const { GUNCELLEME, GIB_KDV } = require('./_kaynak');
module.exports = {
  slug: 'teklif-olusturucu', kategori: 'belge', sira: 1, tek: true, renk: '#1d4ed8', guncelleme: GUNCELLEME, kaynaklar: [GIB_KDV],
  ad: 'Teklif Oluşturucu', kisa: 'Kalem, iskonto ve KDV toplamlı fiyat teklifini PDF olarak hazırlayın',
  baslik: 'Ücretsiz Fiyat Teklifi Hazırlama — Online Teklif Formu, PDF | NEBSOFT',
  ozet: 'Fiyat teklifini kalem kalem hazırlayın: iskonto, KDV dökümü ve geçerlilik tarihi otomatik işlenir, PDF olarak kaydedip e-postayla iletebilirsiniz.',
  sonucBaslik: 'Teklif önizlemesi',
  program: { slug: 'crmprogrami', metin: 'Teklifleriniz çoğaldıysa CRM programında müşterinin online onayladığı teklif linki, takip hatırlatması ve satış hunisi aynı ekrandadır.' },
  alanlar: [
    { tip: 'ara', etiket: 'Teklifi veren' },
    { ad: 'firma', etiket: 'Firma adı', deger: 'Örnek Bilişim Ltd. Şti.', gerekli: true }, { ad: 'iletisim', etiket: 'Adres / telefon / e-posta' },
    { tip: 'ara', etiket: 'Teklif alan' },
    { ad: 'musteri', etiket: 'Müşteri', deger: 'Deneme Yapı A.Ş.' }, { ad: 'yetkili', etiket: 'İlgili kişi' },
    { ad: 'no', etiket: 'Teklif no', deger: 'T-2026-001' }, { ad: 'tarih', etiket: 'Teklif tarihi', tip: 'tarih', bugun: true },
    { ad: 'gecerlilik', etiket: 'Geçerlilik tarihi', tip: 'tarih' },
    { ad: 'kalemler', tip: 'satirlar', etiket: 'Kalemler', ekle: 'Kalem ekle', kolon: '2fr 70px 80px 110px 80px 90px', sutunlar: [{ ad: 'ad', etiket: 'Ürün / hizmet' }, { ad: 'miktar', etiket: 'Miktar', tip: 'sayi', deger: '1' }, { ad: 'birim', etiket: 'Birim', deger: 'Adet' }, { ad: 'fiyat', etiket: 'Birim fiyat', tip: 'para' }, { ad: 'iskonto', etiket: 'İsk. %', tip: 'yuzde' }, { ad: 'kdv', etiket: 'KDV', tip: 'secim', deger: '20', secenekler: [['20', '%20'], ['10', '%10'], ['1', '%1'], ['0', '%0']] }], satir: [{ ad: 'Yıllık bakım hizmeti', miktar: '1', fiyat: '48000' }, { ad: 'Yerinde kurulum', miktar: '3', birim: 'Gün', fiyat: '7500', iskonto: '10' }] },
    { ad: 'genel', etiket: 'Genel iskonto (%)', tip: 'yuzde' },
    { ad: 'kosul', etiket: 'Ödeme ve teslim koşulları', tip: 'cokmetin', deger: 'Ödeme: Sipariş onayında %50, teslimde %50.\nTeslim süresi: Sipariş onayından sonra 10 iş günü.' },
  ],
  hesap: function (v, H) {
    const K = v.kalemler.map((x) => ({ ...x, kdv: H.sayiOku(x.kdv) })); const T = H.teklifToplam(K, v.genel); if (!T.satirlar.length) return H.not('En az bir kalem girin.', 'uyari');
    const sat = T.satirlar.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.ad)}</td><td class="r">${H.sayi(x.miktar)} ${H.esc(x.birim)}</td><td class="r">${H.tl(x.fiyat)}</td><td class="r">${x.iskonto ? '%' + H.sayi(x.iskonto) : '-'}</td><td class="r">%${x.kdv}</td><td class="r">${H.tl(x.net)}</td></tr>`).join('');
    const kdv = Object.keys(T.gruplar).sort((a, b) => b - a).filter((o) => T.gruplar[o]).map((o) => `<tr><td colspan="6" class="r">KDV %${o}</td><td class="r">${H.tl(T.gruplar[o])}</td></tr>`).join('');
    return `${H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet'))}<div class="belge" style="margin-top:12px"><h2>FİYAT TEKLİFİ</h2><div class="ust"><div><b>${H.esc(v.firma)}</b><br>${H.esc(v.iletisim)}</div><div style="text-align:right">Teklif no: ${H.esc(v.no)}<br>Tarih: ${H.tarihTR(v.tarih)}${v.gecerlilik ? `<br>Geçerlilik: ${H.tarihTR(v.gecerlilik)}` : ''}</div></div><p><b>Sayın ${H.esc(v.musteri)}</b>${v.yetkili ? `, ${H.esc(v.yetkili)}` : ''}</p><p>Talebiniz üzerine hazırlanan fiyat teklifimiz aşağıdadır.</p><table><thead><tr><th>#</th><th>Ürün / hizmet</th><th class="r">Miktar</th><th class="r">Birim fiyat</th><th class="r">İsk.</th><th class="r">KDV</th><th class="r">Tutar</th></tr></thead><tbody>${sat}<tr><td colspan="6" class="r">Ara toplam</td><td class="r">${H.tl(T.ara)}</td></tr>${kdv}<tr><th colspan="6" class="r">Genel toplam</th><th class="r">${H.tl(T.toplam)}</th></tr></tbody></table><p><i>Yalnız ${H.esc(H.tutarYazi(T.toplam))}.</i></p>${v.kosul ? `<h3>Koşullar</h3><p style="white-space:pre-line">${H.esc(v.kosul)}</p>` : ''}<div class="imza"><div>${H.esc(v.firma)}<br>Kaşe / imza</div><div>Onaylayan<br>Ad, soyad, imza</div></div></div>`;
  },
  aciklama: [
    'Teklif, müşterinin karar verirken elinde tuttuğu tek belgedir; mesajla yazılan fiyat unutulur, karşılaştırılamaz. Bu araç satır bazında iskonto ve KDV hesaplar, farklı KDV oranlarını ayrı satırlarda gösterir, toplamı yazıyla da ekler. Sonucu tarayıcının yazdırma penceresinden PDF kaydedip gönderebilirsiniz.',
    'Geçerlilik tarihi özellikle dalgalı fiyatlarda önemlidir: tarih yazılmazsa aylar sonra aynı fiyattan iş istenebilir. Ödeme planını ve teslim süresini koşullar bölümüne açık yazmak, iş başladıktan sonraki anlaşmazlıkları azaltır. Altta bulunan onay imzası teklifin kabul edildiğini gösteren basit bir kayıt oluşturur.',
    'Satırdaki KDV seçenekleri GİB’in güncel oran listesindeki yüzde 1, 10 ve 20 oranlarıdır; istisna kapsamındaki işlemler için yüzde 0 seçilebilir. Ürününüzün hangi orana girdiğini mali müşavirinizle doğrulayın. Teklif fatura değildir, ödeme talebi yerine geçmez; iş gerçekleştiğinde fatura ayrıca düzenlenir.',
  ],
  ornek: { baslik: 'Kullanım örneği: bakım ve kurulum teklifi', metin: [
    'Bir bilişim firması yıllık bakım hizmetini 48.000 ₺, üç günlük kurulumu günlük 7.500 ₺ ve yüzde 10 iskontoyla yazar. Kurulum satırı 20.250 ₺ olur, ara toplam 68.250 ₺ çıkar. Yüzde 20 KDV 13.650 ₺ eklenince genel toplam 81.900 ₺ görünür.',
    'Geçerlilik tarihine 15 gün sonrasını girer, koşullara yarı peşin yarı teslimde ödeme yazar. PDF kaydedip e-postayla gönderir. Müşteri onaylı kopyayı geri ilettiğinde iş başlar ve fatura teslimde kesilir.',
  ] },
  sss: [
    ['Teklif fatura yerine geçer mi?', 'Hayır. Teklif satıcının önerisidir, vergi belgesi değildir. Mal teslimi veya hizmet tamamlandığında fatura düzenlenir.'],
    ['Dövizli teklif verebilir miyim?', 'Bu araç tutarları Türk lirası gösterir. Dövizli çalışıyorsanız birim fiyatı kur çevirisiyle yazıp koşullara kur tarihini ekleyebilirsiniz.'],
    ['Teklifim kaydediliyor mu?', 'Hayır. Hiçbir bilgi sunucuya gitmez. Saklamak için PDF kaydedin; sayfayı kapatınca form temizlenir.'],
    ['Logomu ekleyebilir miyim?', 'Bu sürümde logo yoktur. Kurumsal görünümlü, kayıtlı müşterilerle çalışan teklifler için CRM programını deneyebilirsiniz.'],
  ],
};
