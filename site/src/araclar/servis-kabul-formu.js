const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'servis-kabul-formu', kategori: 'belge', sira: 6, renk: '#b45309', guncelleme: GUNCELLEME,
  ad: 'Servis Kabul Formu', kisa: 'Teknik serviste cihaz teslim alırken durumu ve onayı kayda geçirin',
  baslik: 'Teknik Servis Kabul Formu Örneği — Ücretsiz Yazdır | NEBSOFT',
  ozet: 'Tamire gelen cihaz için servis kabul formu hazırlayın: müşteri, seri no, arıza, aksesuar, fiziksel durum ve tahmini ücret tek sayfada, imzalı ve iki nüsha yazdırılır.',
  sonucBaslik: 'Form önizlemesi',
  program: { slug: 'teknikservisprogrami', metin: 'Teknik Servis programında aynı form müşteriye durum takip linkiyle gider, parça ve işçilik kaydı forma bağlanır, tamir bitince haber verilir.' },
  alanlar: [
    { ad: 'firma', etiket: 'Servis adı', deger: 'Örnek Teknik Servis', gerekli: true }, { ad: 'no', etiket: 'Fiş no', deger: 'S-1042' },
    { ad: 'tarih', etiket: 'Kabul tarihi', tip: 'tarih', bugun: true }, { ad: 'teslim', etiket: 'Tahmini teslim', tip: 'tarih' },
    { ad: 'musteri', etiket: 'Müşteri', deger: 'Ali Demir', gerekli: true }, { ad: 'tel', etiket: 'Telefon' },
    { ad: 'cihaz', etiket: 'Cihaz / marka / model', deger: 'Dizüstü bilgisayar', gerekli: true }, { ad: 'seri', etiket: 'Seri no / IMEI' },
    { ad: 'ariza', etiket: 'Müşterinin bildirdiği arıza', tip: 'cokmetin', deger: 'Açılmıyor, şarj ışığı yanmıyor.' },
    { ad: 'durum', etiket: 'Fiziksel durum', tip: 'cokmetin', deger: 'Kapakta çizik var, ekran sağlam.' },
    { ad: 'aksesuar', etiket: 'Teslim alınan aksesuar', deger: 'Şarj adaptörü', genis: true },
    { ad: 'ucret', etiket: 'Tahmini ücret (₺)', tip: 'para' }, { ad: 'muayene', etiket: 'Arıza tespit ücreti (₺)', tip: 'para' },
    { ad: 'yedek', etiket: 'Veri yedeği müşterinin sorumluluğundadır maddesini ekle', tip: 'onay', deger: true },
  ],
  hesap: function (v, H) {
    const e = H.esc; const n = (b) => `<div class="belge" style="margin-top:12px"><h2>SERVİS KABUL FORMU</h2><div class="ust"><div><b>${e(v.firma)}</b></div><div style="text-align:right">Fiş no: ${e(v.no)} · ${b}<br>Kabul: ${H.tarihTR(v.tarih)}${v.teslim ? ` · Tahmini teslim: ${H.tarihTR(v.teslim)}` : ''}</div></div><table><tbody><tr><th>Müşteri</th><td>${e(v.musteri)} ${e(v.tel)}</td></tr><tr><th>Cihaz</th><td>${e(v.cihaz)}${v.seri ? ` · Seri: ${e(v.seri)}` : ''}</td></tr><tr><th>Bildirilen arıza</th><td style="white-space:pre-line">${e(v.ariza)}</td></tr><tr><th>Fiziksel durum</th><td style="white-space:pre-line">${e(v.durum)}</td></tr><tr><th>Aksesuar</th><td>${e(v.aksesuar) || '-'}</td></tr>${v.ucret != null ? `<tr><th>Tahmini ücret</th><td>${H.tl(v.ucret)} (kesin tutar arıza tespitinden sonra müşteriye bildirilir)</td></tr>` : ''}${v.muayene != null ? `<tr><th>Arıza tespit ücreti</th><td>${H.tl(v.muayene)}</td></tr>` : ''}</tbody></table>${v.yedek ? '<p>Cihazdaki verilerin yedeği müşterinin sorumluluğundadır. Onarım öncesinde yedek alınması önerilir.</p>' : ''}<p>Ek maliyet doğuran işlemler müşteri onayı alındıktan sonra yapılır.</p><div class="imza"><div>Teslim eden (müşteri)<br>İmza</div><div>Teslim alan (servis)<br>İmza</div></div></div>`;
    return H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet')) + n('Müşteri nüshası') + n('Servis nüshası');
  },
  aciklama: [
    'Serviste en sık yaşanan anlaşmazlık, cihazın teslim alındığı andaki durumudur. Çizik önceden mi vardı, adaptör bırakılmış mıydı, müşteri hangi arızayı söylemişti? Kabul formu bu soruları cihaz daha tezgâhtan geçmeden yazılı hale getirir ve iki tarafın da imzasını alır.',
    'Form telefon tamircisi, beyaz eşya, bilgisayar ve küçük ev aleti servisleri için uygundur. Müşterinin anlattığı arıza ile servisin gördüğü fiziksel durum ayrı alanlardadır; böylece bildirilen sorun ile ilk inceleme birbirine karışmaz. Seri numarası veya IMEI kaydı, cihazın doğru kişiye geri verilmesini sağlar.',
    'Tahmini ücreti yazmak beklentiyi yönetir, ancak “kesin tutar” değildir; form bunu metinde belirtir. Arıza tespit ücreti alıyorsanız cihazı almadan önce söylemek ve forma yazmak iptal durumundaki tartışmayı önler. Yedekleme maddesi veri kaybı riski olan cihazlar içindir, gerekli değilse işareti kaldırın.',
  ],
  ornek: { baslik: 'Kullanım örneği: açılmayan dizüstü bilgisayar', metin: [
    'Müşteri açılmayan bilgisayarını adaptörüyle getirir. Çalışan seri numarasını okur, “kapakta çizik var, ekran sağlam” notunu fiziksel duruma yazar, aksesuar alanına adaptörü ekler. Arıza tespit ücretini söyler ve forma işler.',
    'Form iki nüsha çıkar: biri müşteride, diğeri cihazın yanında kalır. Tamir sırasında anakart değişimi gerektiğinde servis müşteriyi arar ve onay alır, çünkü formda ek maliyet için onay şartı yazılıdır. Teslimde müşteri nüshasıyla cihaz eşleştirilir.',
  ] },
  sss: [
    ['Form yasal zorunluluk mudur?', 'Bu araç işletmenizin kayıt düzeni için hazırlanmıştır. Sektörünüze özel belge yükümlülüklerini ilgili mevzuattan veya danışmanınızdan kontrol edin.'],
    ['Müşteri cihazını almaya gelmezse ne olur?', 'Bu forma bir bekletme süresi veya ücret yazılmamıştır. Kendi koşulunuzu eklemek isterseniz çıktıyı düzenleyin ve hukukçuya danışın.'],
    ['Fotoğraf ekleyebilir miyim?', 'Bu sürümde fotoğraf yoktur. Teknik Servis programında kabul sırasında fotoğraf ve imza alınabilir.'],
    ['Formu telefonda doldurabilir miyim?', 'Evet. Sayfa telefonda çalışır; bilgiler telefondan çıkmaz. Yazdırmak yerine PDF kaydedip müşteriye gönderebilirsiniz.'],
  ],
};
