const { GUNCELLEME, EIMZA } = require('./_kaynak');
module.exports = {
  slug: 'pdf-imza-ekleme', kategori: 'pdf', sira: 10, renk: '#b91c1c', guncelleme: GUNCELLEME, tek: true, mevzuat: true, kaynaklar: [EIMZA], ilgili: ['resim-arka-plan-silme', 'pdf-filigran-ekleme', 'pdf-sayfa-duzenleme'],
  ad: 'PDF İmza Ekleme', kisa: 'PDF\'e çizdiğiniz veya yüklediğiniz imzayı yerleştirin',
  baslik: 'PDF İmza Ekleme — PDF\'e Elle İmza Görseli Koyma | NEBSOFT',
  ozet: 'PDF\'e parmağınızla çizdiğiniz imzayı yerleştirin veya taranmış imza yükleyin. Belge sunucuya gitmez. Bu görsel imzadır, güvenli elektronik imza değildir.',
  sonucBaslik: 'İmzanın yerini seçin', aciklamaBaslik: 'PDF\'e imza nasıl eklenir, hukuki durumu nedir?',
  uyari: 'Bu araçla eklenen imza, sayfaya yerleştirilmiş bir görseldir. Nitelikli elektronik sertifikaya dayanmadığı için 5070 sayılı Kanun madde 4 anlamında güvenli elektronik imza değildir. Bu sayfa hukuki danışmanlık değildir; bağlayıcı işlemlerde danışmanınıza sorun.',
  program: { slug: 'hukukburosuprogrami', metin: 'Sözleşme ve vekâlet işleriyle uğraşıyorsanız Hukuk Bürosu programı dosya, süre, masraf ve müvekkil portalını birlikte yönetir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'PDF seçin', tip: 'dosya', kabul: '.pdf,application/pdf', ipucu: 'veya sürükleyin' },
    { ad: 'kaynak', etiket: 'İmza', tip: 'secim', deger: 'ciz', genis: true, secenekler: [['ciz', 'Burada çizeyim'], ['dosya', 'İmza fotoğrafı yükleyeyim']] },
    { ad: 'imza', etiket: 'İmzanızı çizin', tip: 'imza', goster: 'kaynak=ciz' },
    { ad: 'imzaDosya', etiket: 'İmza görseli seçin', tip: 'dosya', kabul: 'image/png,image/jpeg,image/webp', goster: 'kaynak=dosya', ipucu: 'Beyaz kâğıttaki imzanın zemini temizlenir' },
    { ad: 'imzaRenk', etiket: 'Kalem rengi', tip: 'renk', deger: '#0b2a6b', goster: 'kaynak=ciz' },
    { ad: 'tumu', etiket: 'Tüm sayfalara aynı yere koy (paraf)', tip: 'onay', deger: false },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', 'İmzayı ekle')) : H.not('PDF seçin, sonra imzanızı çizip sayfa üzerinde yerini belirleyin.'); },
  hazirla: async function (v, H, c) {
    const d = await H.pdfAc(v.dosyalar[0]); const u = c.durum; u.doc = d; u.n = 1; const ust = document.createElement('div'); ust.className = 'ar-eylem'; ust.style.margin = '0 0 10px'; ust.innerHTML = `<button type="button" class="btn sm" data-g="-1">← Önceki</button><span style="align-self:center"></span><button type="button" class="btn sm" data-g="1">Sonraki →</button>`; const kutu = document.createElement('div'); c.duzen.append(ust, kutu);
    let imza = ''; const goster = async (n) => { const eski = u.s && u.s.alanlar()[0] ? { ...u.s.alanlar()[0] } : null; const eW = u.s ? u.s.W : 0; const y = d.numPages; const s = await d.getPage(n); const o = 900 / s.getViewport({ scale: 1 }).width; const t = await H.sayfaCiz(d, n, o); kutu.innerHTML = ''; const k = eW ? t.width / eW : 1; const ba = eski ? { x: eski.x * k, y: Math.min(eski.y * k, t.height - eski.h * k), w: eski.w * k, h: eski.h * k } : { x: t.width * 0.55, y: t.height * 0.8, w: t.width * 0.3, h: t.width * 0.1 }; u.s = H.alanSecici(kutu, t, { baslangic: ba }); if (imza) u.s.kapla(imza); u.n = n; ust.querySelector('span').textContent = `Sayfa ${n} / ${y}`; ust.querySelector('[data-g="-1"]').disabled = n < 2; ust.querySelector('[data-g="1"]').disabled = n >= y; };
    ust.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) goster(u.n + Number(b.dataset.g)); }); await goster(1);
    H.degisimKanca = async (x) => { const t = await H.imzaTuvali(x.kaynak === 'ciz' ? {} : x); imza = t ? t.toDataURL('image/png') : ''; if (u.s) u.s.kapla(imza); };
  },
  isle: async function (v, H, c) {
    const u = c.durum; const a = u.s && u.s.alanlar()[0]; const t = await H.imzaTuvali(v.kaynak === 'ciz' ? {} : v); if (!t) throw new Error('Önce imzanızı çizin veya imza görseli yükleyin.'); if (!a) throw new Error('İmzanın yerini seçin.');
    const L = await H.pdfLib(); const d = await H.pdfYukle(v.dosyalar[0]); const g = await d.embedPng(await H.tuvalPng(t)); const s = d.getPages(); const liste = v.tumu ? s.map((_, i) => i) : [u.n - 1];
    liste.forEach((i) => { const p = s[i]; const o = H.pdfOlcu(p); const k = o.w / u.s.W; const bw = a.w * k, bh = a.h * k; const f = Math.min(bw / t.width, bh / t.height); const w = t.width * f, h = t.height * f; H.pdfGorsel(L, p, g, { x: a.x * k + (bw - w) / 2, y: Math.min(a.y * k, o.h - bh) + (bh - h) / 2, w, h }); });
    const b = await H.pdfBlob(d); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(v.dosyalar[0].name, 'imzali', 'pdf'), b); return `${H.tablo([['İmzalanan sayfa', v.tumu ? `Tümü (${s.length})` : u.n, 1], ['Boyut', H.boyutYaz(b.size)]])}${H.ciktiListe()}${H.not('Bu bir görsel imzadır, güvenli elektronik imza değildir.', 'uyari')}`;
  },
  aciklama: [
    'Bu araç, yazdırıp imzalamak ve yeniden taramak zorunda kalmadan PDF sayfasına imzanızı koymanızı sağlar. İmzanızı parmakla, kalemle veya fareyle çizebilir ya da beyaz kâğıda atıp fotoğrafını yükleyebilirsiniz; zemin otomatik temizlenir. PDF sayfası ekranda açılır, imza kutusunu istediğiniz yere taşıyıp köşelerinden boyutlandırırsınız. Paraf için tüm sayfalara aynı konumda koyma seçeneği vardır. İmzanız ve belgeniz bilgisayarınızdan çıkmaz.',
    'Hukuki durumu açıkça bilmek gerekir. 5070 sayılı Kanun madde 4, güvenli elektronik imzayı imza sahibine münhasıran bağlı olan, güvenli imza aracıyla oluşturulan, nitelikli elektronik sertifikaya dayanan ve sonradan değişikliği tespit edilebilen imza olarak tanımlar. Madde 5 ise yalnız bu imzanın elle atılan imzayla aynı hukuki sonucu doğurduğunu söyler. Sayfaya konan bir imza görseli bu koşulları taşımaz. Yani bu araç e-imza değildir ve yerine geçmez.',
    'Peki ne işe yarar? Taraflar arasında görsel imzayla yürüyen günlük işler için pratik bir çözümdür: iç onay, ön kabul, teslim tutanağı veya imzalı kopyanın ıslak imzalı aslı sonradan gönderilecek belgeler gibi. Kanunun resmî şekle bağladığı işlemlerde, kefalet senetleri ve banka teminat mektupları dışındaki teminat sözleşmelerinde ise güvenli elektronik imza bile kullanılamaz; bu işler için uygun yöntemi danışmanınızdan öğrenin. Karşı taraf imzayı kabul edecek mi, işlemi yapmadan önce sorun.',
  ],
  ornek: { baslik: 'Kullanım örneği: teslim tutanağı ve parafla kopya', metin: [
    'Bir servis yöneticisi müşteriye gönderilecek teslim tutanağını imzalayacak. PDF dosyasını açar, telefonda parmağıyla imzasını atar, kutuyu sayfa sonundaki imza çizgisinin üstüne taşır. Sonraki düğmesiyle ikinci sayfaya geçip orada da kontrol eder ve dosyayı indirir.',
    'Bir yönetici ise 12 sayfalık iç prosedürün her sayfasına paraf atmak istiyor. Tüm sayfalara aynı yere koy seçeneğini işaretler, kutuyu sayfanın sağ alt köşesine getirir. Sayfalar farklı ölçüde olsa bile konum sayfaya göre ölçeklenir.',
  ] },
  sss: [
    ['Bu e-imza mıdır?', 'Hayır. Bu bir imza görselidir. Güvenli elektronik imza için nitelikli elektronik sertifika ve güvenli imza aracı gerekir.'],
    ['İmzam kaydediliyor mu?', 'Hayır. Çizim yalnız bu sayfada, tarayıcı belleğinde durur. Sayfayı kapatınca kaybolur.'],
    ['Belgeyi imzaladıktan sonra değiştirilebilir mi?', 'Evet, görsel imza değişikliği engellemez. Güvenli elektronik imzanın farkı budur.'],
    ['Birden çok sayfaya imza atabilir miyim?', 'Tüm sayfalara aynı yere koyabilirsiniz. Farklı yerler için aracı çıkan dosyayla yeniden kullanın.'],
  ],
};
