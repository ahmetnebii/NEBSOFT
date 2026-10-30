// Güven ve dönüşüm sayfaları: /bayilik/, /veri-tasima/, /sistem-durumu/, /yenilikler/, /yol-haritasi/. build-sites.js çağırır.
// Rakam, oran ve fiyat burada yazılmaz: komisyon, tavsiye süresi ve hizmet fiyatı /api/vitrin ile gerçek ayardan gelir, ayar boşsa satır görünmez (site/assets/guven.js).
// Veri taşıma tablosu koddaki gerçek içe aktarma ekranlarından çıkarıldı; server/test/vitrin.test.js her satırı programın kodunda arar.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');

// Program kimliği → aktarılan veri ve kural
const AKTARIM = [
  ['muhasebe', 'Cari hesaplar (açılış bakiyesiyle), stok ve hizmet kartları (açılış stoğuyla), banka ekstresi', 'Sütunlar kendiliğinden eşleşir, elle değiştirebilirsiniz. Aktarımdan önce önizleme ve hata listesi görünür.'],
  ['pos', 'Ürünler: barkod, ad, kategori, alış, satış, KDV, stok, birim', 'Yalnız CSV. Başlıklar sabittir: Barkod;Ürün;Kategori;Alış;Satış;KDV;Stok;Birim. Var olan barkod güncellenir.'],
  ['butik', 'Modeller, renk ve beden kırılımı, barkod, stok', 'Model kodu, Renk ve Beden sütunları gerekir.'],
  ['crm', 'Firmalar ve kişiler', 'Ad sütunu gerekir. Var olan kayıt güncellenir, önce özet gösterilir.'],
  ['eticaret', 'Ürünler, varyantlar, fiyat, stok', 'Stok kodu veya barkod sütunu gerekir. Önce özet gösterilir.'],
  ['fiyatrobotu', 'Ürünler, maliyetler, kanal listelemeleri', 'Programın şablon dosyasındaki sütunlarla çalışır.'],
  ['kargo', 'Toplu gönderi listesi', 'Alıcı, telefon ve adres sütunları gerekir. Aynı referans ikinci kez alınmaz.'],
  ['musavir', 'Mükellef listesi', 'Ünvan ve VKN sütunları gerekir.'],
  ['pazaryeri', 'Ürünler, fiyat, maliyet', 'Barkod veya stok kodu gerekir. Yeni kod için ad ve fiyat da gerekir.'],
  ['site', 'Daireler ve sakinler', 'Blok, daire, malik ve arsa payı sütunları gerekir.'],
  ['toptan', 'Müşteriler ve ürünler', 'Müşteride ünvan, üründe kod, ad ve fiyat sütunları gerekir.'],
];
const DURUM_AD = { calisiliyor: 'Üzerinde çalışılıyor', planlandi: 'Planlandı', bekliyor: 'Dış hesap bekliyor' };

module.exports = ({ DOC, esc, I, CFG, D, CAT, PRODUCTS, AKTIF, bas, tarihTr, SSS, faqHtml, SITE_SRC }) => {
  const dosya = (a) => fs.readFileSync(path.join(SITE_SRC, 'assets', a));
  const v = (a) => crypto.createHash('sha1').update(dosya(a)).digest('hex').slice(0, 10);
  const ek = `\n<link rel="stylesheet" href="/site/assets/guven.css?v=${v('guven.css')}">\n<script src="/site/assets/guven.js?v=${v('guven.js')}" defer></script>`;
  const JSONOKU = (f) => JSON.parse(fs.readFileSync(path.join(SITE_SRC, 'src', f), 'utf8'));
  const urun = (id) => CAT.products.find((x) => x.id === id);
  const programSec = AKTIF.map((p) => urun(p.id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const sayfa = (x) => ({ '@context': 'https://schema.org', '@type': 'WebPage', name: x.ad, url: x.url, description: x.desc, inLanguage: 'tr-TR', isPartOf: { '@id': D + '/#site' } });
  const kirinti = (ad, url) => [[CFG.brand, D + '/'], [ad, url]];
  const tuzak = '<div class="gz" aria-hidden="true"><label>Web sitesi<input name="web" tabindex="-1" autocomplete="off"></label></div>';
  const kvkk = (ne) => `<label class="sec tam"><input type="checkbox" name="kvkk" required><span><a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum. Bilgilerim ${ne} için işlenir.</span></label>`;
  const sonuc = (d) => `<p class="msg" role="status" aria-live="polite"></p><button class="btn p tam" type="submit">${d}</button>`;
  const L = [];

  // ---------- Bayilik ----------
  {
    const url = `${D}/bayilik/`; const title = `Bayilik ve Mali Müşavir İş Ortaklığı | ${CFG.brand}`;
    const desc = `${CFG.brand} programlarını müşterilerinize önermek isteyen bayi ve mali müşavirler için iş ortaklığı başvurusu. Süreç, komisyon düzeni ve tavsiye bağlantısı.`;
    const faq = [
      ['Başvurum kendiliğinden onaylanır mı?', 'Hayır. Her başvuru incelenir, yazdığınız telefon veya e-posta adresinden size dönülür.'],
      ['Komisyon oranı nedir, ne zaman ödenir?', 'Oran ve ödeme düzeni iş ortaklığı sözleşmesinde yazılır. Oran yayımlanmışsa bu sayfanın komisyon bölümünde görünür, yayımlanmamışsa görüşmede size bildirilir.'],
      ['Davet bağlantısı ile komisyon aynı şey mi?', 'Hayır. Davet bağlantısı her işletme hesabında vardır ve ödülü lisans süresidir. Komisyon yalnız onaylanmış iş ortakları içindir ve sözleşmeye bağlıdır.'],
      ['Mali müşavir olarak kendi büromda da program kullanabilir miyim?', 'Evet. Mali Müşavir programı ayrı bir üründür, başvurudan bağımsız olarak ücretsiz deneyebilirsiniz.'],
    ];
    const form = `<form data-uc="/api/bayi-basvuru" data-tamam="Başvurunuz alındı. İnceledikten sonra size döneceğiz." class="gf" novalidate>
    <label>Başvuru türü<select name="tur" required><option value="">Seçin</option><option value="bayi">Bayi</option><option value="musavir">Mali müşavir</option></select></label>
    <label>Firma veya büro adı<input name="unvan" required minlength="2" maxlength="160" autocomplete="organization"></label>
    <label>Yetkili adı soyadı<input name="yetkili" required minlength="2" maxlength="120" autocomplete="name"></label>
    <label>İl<input name="il" required minlength="2" maxlength="60" autocomplete="address-level1"></label>
    <label>E-posta<input name="eposta" type="email" required maxlength="190" autocomplete="email"></label>
    <label>Telefon<input name="telefon" type="tel" required maxlength="20" autocomplete="tel" placeholder="05xx xxx xx xx"></label>
    <label class="tam">Notunuz (isteğe bağlı)<textarea name="not" maxlength="2000" placeholder="Kaç işletmeyle çalıştığınızı ve hangi sektörlerde olduğunuzu yazabilirsiniz. Kimlik veya kart bilgisi yazmayın."></textarea></label>
    ${tuzak}${kvkk('bu başvuruyu değerlendirmek ve size dönmek')}
    <label class="sec tam"><input type="checkbox" name="vitrinIzni"><span>Başvurum onaylanırsa firma adım ve ilim bu sayfada listelenebilir (isteğe bağlı).</span></label>
    <label class="sec tam"><input type="checkbox" name="ticariIzin"><span>Kampanya ve duyurular için bana ticari elektronik ileti gönderilmesine izin veriyorum (isteğe bağlı).</span></label>
    ${sonuc('Başvuruyu gönder')}</form>`;
    const govde = `
  <h2>Kimler için</h2>
  <p>Bayilik, işletmelere yazılım veya kasa, barkod gibi ürünler satan firmalar içindir. Mali müşavir iş ortaklığı ise müşterilerine program öneren bürolar içindir. ${CFG.brand} tarafında sizinle tek kişi görüşür, hangi programların müşterilerinize uyduğunu birlikte belirlersiniz.</p>
  <h2>Nasıl işler</h2>
  <ol class="adim"><li><b>Başvuru.</b> Aşağıdaki formu doldurursunuz, kaydınız yönetim paneline düşer.</li><li><b>Görüşme.</b> Hangi bölgede ve sektörde çalıştığınızı konuşuruz. Başvurular kendiliğinden onaylanmaz.</li><li><b>Sözleşme.</b> Komisyon oranı, ödeme düzeni ve iki tarafın yükümlülükleri yazılı olarak belirlenir.</li><li><b>Tanıtım.</b> Onaydan sonra müşterilerinize programları önerirsiniz. Her program canlı demoyla hesap açmadan gösterilebilir.</li></ol>
  <h2 id="komisyon">Komisyon düzeni</h2>
  <p>Komisyon, sizin yönlendirdiğiniz işletmelerin ödediği lisans bedeli üzerinden hesaplanır. Oran, hesaplamanın kapsamı ve ödeme zamanı iş ortaklığı sözleşmesinde yazılır.</p>
  <p class="kutu" data-komisyon hidden></p>
  <h2>Davet bağlantısı: herkese açık tavsiye</h2>
  <p>İş ortağı olmadan da tavsiye edebilirsiniz. Her işletme hesabının kendi davet bağlantısı vardır. Bu bağlantıyla kayıt olan işletme ilk ödemesini yaptığında iki tarafın da süren lisansları uzatılır.<span data-tavsiye hidden></span> Bu ödül para değil, lisans süresidir.</p>
  <h2>Toplu lisans alan bayiler</h2>
  <p>Müşterileriniz adına toplu lisans almak istiyorsanız fiyat teklifle belirlenir. <a href="/kurumsal-teklif?tur=bayi">Kurumsal teklif formunu</a> kullanın. Çok programlı ve çok şubeli alımlarda geçerli indirimler <a href="/fiyatlar/">fiyatlar sayfasında</a> ve sepette görünür.</p>
  <p>Mali müşavirseniz kendi büronuz için <a href="/malimusavirprogrami">Mali Müşavir programını</a> inceleyebilirsiniz.</p>
  <div data-ortaklar hidden><h2>Onaylı iş ortakları</h2><p>Listede yalnız onaylanan ve görünmeye izin veren iş ortakları yer alır.</p><ul class="ortak"></ul></div>
  <h2 id="basvuru">Başvuru formu</h2>
  ${form}`;
    L.push({ yol: '/bayilik/', rel: 'bayilik', html: DOC({ title, desc, url, h1: 'Bayi ve mali müşavirler için iş ortaklığı', lead: `${CFG.brand} programlarını müşterilerinize önerin. Başvurunuzu bırakın, koşulları birlikte belirleyelim.`, kirinti: kirinti('Bayilik ve mali müşavir', url), govde, ek, schema: [sayfa({ ad: 'Bayilik ve mali müşavir iş ortaklığı', url, desc }), SSS(faq)], sonra: faqHtml(faq, 'İş ortaklığı hakkında merak edilenler') }) });
  }

  // ---------- Veri taşıma ----------
  {
    const url = `${D}/veri-tasima/`; const title = `Veri Taşıma: Excel'den ve Eski Programdan Geçiş | ${CFG.brand}`;
    const desc = `Cari, stok ve müşteri listelerinizi Excel veya CSV dosyasıyla ${CFG.brand} programına taşıyın. Hangi programda neyin aktarıldığını görün, gerekirse destek isteyin.`;
    const satir = AKTARIM.map(([id, ne, kural]) => { const c = urun(id); const p = PRODUCTS.find((x) => x.id === id); return `<tr><td>${p ? `<a href="/${p.slug}">${esc(c.name)}</a>` : esc(c.name)}</td><td>${esc(ne)}</td><td>${esc(kural)}</td></tr>`; }).join('');
    const faq = [
      ['Eski programımdan doğrudan aktarım yapılıyor mu?', `Hayır. ${CFG.brand} başka programların veritabanına bağlanmaz. Eski programınızdan Excel veya CSV listesi alırsınız, bu dosyayı içe aktarırsınız.`],
      ['Elimde eski .xls dosyası var, ne yapmalıyım?', 'Dosyayı Excel\'de açıp .xlsx veya CSV olarak yeniden kaydedin. Eski .xls biçimi doğrudan okunmaz.'],
      ['Hatalı satırlar ne olur?', 'Sütun başlıkları tanınmazsa aktarım başlamaz ve hangi sütunun eksik olduğu yazılır. Önizleme gösteren ekranlarda hatalı satır sayısı onaydan önce görünür, bu satırlar atlanır.'],
      ['Aynı dosyayı iki kez aktarırsam ne olur?', 'Çoğu ekranda barkod, stok kodu veya vergi numarası gibi bir anahtarla var olan kayıt bulunur ve güncellenir. Kargo programında aynı referans ikinci kez alınmaz.'],
      ['Satış geçmişim ve eski faturalarım taşınır mı?', 'Listedeki içe aktarma ekranları kart ve liste bilgilerini alır, geçmiş fişleri ve faturaları almaz. Ön Muhasebe programında açılış bakiyesi ve açılış stoğu ile devam edebilirsiniz.'],
    ];
    const form = `<form data-uc="/api/veri-tasima" data-tamam="Talebiniz alındı. Size yazdığınız telefondan döneceğiz." class="gf" novalidate>
    <label>Ad soyad<input name="ad" required minlength="2" maxlength="120" autocomplete="name"></label>
    <label>İşletme adı<input name="isletme" required minlength="2" maxlength="160" autocomplete="organization"></label>
    <label>Telefon<input name="telefon" type="tel" required maxlength="20" autocomplete="tel" placeholder="05xx xxx xx xx"></label>
    <label>E-posta (isteğe bağlı)<input name="eposta" type="email" maxlength="190" autocomplete="email"></label>
    <label>Geçeceğiniz program<select name="program"><option value="">Henüz seçmedim</option>${programSec}</select></label>
    <label>Veriniz şu an nerede?<input name="eskiProgram" required minlength="2" maxlength="160" placeholder="Excel, defter veya kullandığınız program"></label>
    <label class="tam">Yaklaşık kayıt sayısı (isteğe bağlı)<input name="kayit" maxlength="40" placeholder="Örneğin ürün ve cari sayısı"></label>
    <label class="tam">Notunuz (isteğe bağlı)<textarea name="not" maxlength="2000" placeholder="Taşınmasını istediğiniz listeleri yazın. Şifre, kimlik veya kart bilgisi yazmayın."></textarea></label>
    ${tuzak}${kvkk('bu talebi yanıtlamak')}${sonuc('Talep gönder')}</form>`;
    const govde = `
  <h2>Kendiniz üç adımda taşıyın</h2>
  <ol class="adim"><li><b>Listeyi alın.</b> Eski programınızdan veya elinizdeki dosyadan listeyi Excel (.xlsx) ya da CSV olarak kaydedin.</li><li><b>İçe aktarın.</b> Programda ilgili listeyi açıp <b>Excel'den al</b> veya <b>İçe aktar</b> düğmesine basın, dosyanızı seçin.</li><li><b>Özeti onaylayın.</b> Kaç kaydın ekleneceğini, güncelleneceğini ve atlanacağını görüp onay verin.</li></ol>
  <p>İşlem tarayıcınızda çalışır ve programın kendi özelliğidir. Başlıklar programın tanıdığı adlarla yazılmalıdır, örneğin ünvan, telefon, stok kodu ya da barkod.</p>
  <h2>Hangi programda neyi aktarabilirsiniz</h2>
  <div class="tablo"><table><thead><tr><th>Program</th><th>Aktarılan veri</th><th>Kural</th></tr></thead><tbody>${satir}</tbody></table></div>
  <p class="note">Bu tabloda olmayan programlarda toplu içe aktarma düğmesi yoktur, kayıtlar elle girilir. Dilerseniz aşağıdaki formdan bize yazın.</p>
  <h2>Sınırlar</h2>
  <ul><li>Eski programın veritabanına doğrudan bağlantı yoktur, geçiş dosyayla yapılır.</li><li>Dosya biçimi .xlsx, .csv veya .txt olmalıdır. Eski .xls biçimi okunmaz.</li><li>Market POS yalnız CSV dosyası alır.</li><li>Fotoğraflar ve geçmiş fişler dosyayla taşınmaz.</li></ul>
  <h2 id="destek">Taşımayı bize bırakın</h2>
  <p>Dosyanız karışıksa ya da listeyi kendiniz hazırlamak istemiyorsanız bize yazın. Elinizdeki veriye bakıp neyin taşınabileceğini söyleriz. Kapsam ve varsa ücret, iş başlamadan önce size yazılı olarak bildirilir.</p>
  <p class="kutu" data-kurulum hidden></p>
  ${form}`;
    L.push({ yol: '/veri-tasima/', rel: 'veri-tasima', html: DOC({ title, desc, url, h1: 'Excel\'den veya eski programdan veri taşıma', lead: desc, genis: true, kirinti: kirinti('Veri taşıma', url), govde, ek, schema: [sayfa({ ad: 'Veri taşıma', url, desc }), SSS(faq)], sonra: faqHtml(faq, 'Veri taşıma hakkında merak edilenler') }) });
  }

  // ---------- Sistem durumu ----------
  {
    const url = `${D}/sistem-durumu/`; const title = `Sistem Durumu: Canlı Ölçüm | ${CFG.brand}`;
    const desc = `${CFG.brand} uygulama ve veritabanı durumu sunucudan canlı ölçülür. Ölçüm alınamazsa sonuç bilinmiyor yazar. Son bakım kayıtları da burada.`;
    const satir = (id, ad, acik) => `<div class="drm" id="d-${id}"><div><b>${esc(ad)}</b><small>${esc(acik)}</small></div><span class="dg bil">Ölçülüyor…</span></div>`;
    const govde = `
  <div class="ozet bil" id="genel" role="status" aria-live="polite"><b>Ölçülüyor…</b><small id="zaman">Sonuç sunucudan bekleniyor.</small></div>
  <noscript><p class="kutu"><b>Durum bilinmiyor.</b> Canlı ölçüm için tarayıcıda JavaScript açık olmalıdır.</p></noscript>
  <div class="drm-l">${satir('uygulama', 'Uygulama', 'Sunucu bu ölçüme yanıt verdiyse çalışıyordur.')}${satir('veritabani', 'Veritabanı', 'Sunucu veritabanına sorgu gönderir, yanıt süresini ölçer.')}${satir('istekler', 'Son dakikaların istekleri', 'Hata ve yavaşlık oranı. Yeterli istek yoksa sonuç çıkmaz.')}</div>
  <div id="bakimda" hidden><h2>Şu an planlı bakımda</h2><ul></ul></div>
  <h2>Son bakım kayıtları</h2>
  <div id="bakim"><p class="note">Ölçülüyor…</p></div>
  <h2>Bu sayfa nasıl çalışır</h2>
  <p>Sayfadaki sonuçlar sabit yazı değildir. Sayfa açıkken tarayıcınız sunucudan ölçüm ister ve sonucu yarım dakikada bir yeniler. Ölçüm alınamazsa, sunucuya ulaşılamazsa veya bağlantınız kesilirse sonuç <b>Bilinmiyor</b> yazar. Bu, sorun olduğu anlamına da, her şeyin çalıştığı anlamına da gelmez.</p>
  <p>Sonuçlar bu anlık ölçümü gösterir, geçmişe dönük kesintisiz çalışma oranı değildir. Bu sayfada çalışma süresi taahhüdü verilmez. Bakım kayıtları yönetim panelinden elle girilir. Sorun yaşıyorsanız <a href="/#/iletisim">iletişim sayfasından</a> bize yazın.</p>`;
    L.push({ yol: '/sistem-durumu/', rel: 'sistem-durumu', html: DOC({ title, desc, url, h1: 'Sistem durumu', lead: 'Uygulama ve veritabanı durumu sunucudan canlı ölçülür.', kirinti: kirinti('Sistem durumu', url), govde, ek, schema: [sayfa({ ad: 'Sistem durumu', url, desc })] }) });
  }

  // ---------- Yenilikler ----------
  {
    const url = `${D}/yenilikler/`; const title = `Yenilikler: Programlarda Neler Değişti | ${CFG.brand}`;
    const desc = `${CFG.brand} programlarında yapılan gerçek değişiklikler. Yeni özellikler, güvenlik iyileştirmeleri ve duyurular tarih sırasıyla burada listelenir.`;
    const K = JSONOKU('yenilikler.json').kayitlar.slice().sort((a, b) => b.tarih.localeCompare(a.tarih));
    const gun = [...new Set(K.map((x) => x.tarih))];
    const madde = (x) => { const p = x.program && PRODUCTS.find((y) => y.id === x.program); return `<li><b>${esc(x.baslik)}</b><span>${esc(x.metin)}${p ? ` <a href="/${p.slug}">${esc(bas(p.kw))}</a>` : ''}</span></li>`; };
    const govde = `${gun.map((g) => `<h2><time datetime="${g}">${tarihTr(g)}</time></h2><ul class="yen">${K.filter((x) => x.tarih === g).map(madde).join('')}</ul>`).join('\n  ')}
  <h2>Sırada ne var</h2>
  <p>Planlanan işleri <a href="/yol-haritasi/">yol haritasında</a> görebilir, isteğinizi öneri kutusuna yazabilirsiniz. Sistemin şu anki hâli için <a href="/sistem-durumu/">sistem durumu</a> sayfasına bakın.</p>`;
    L.push({ yol: '/yenilikler/', rel: 'yenilikler', html: DOC({ title, desc, url, h1: 'Yenilikler', lead: 'Programlarda yapılan gerçek değişiklikler, en yenisi üstte.', kirinti: kirinti('Yenilikler', url), govde, ek, schema: [sayfa({ ad: 'Yenilikler', url, desc })] }) });
  }

  // ---------- Yol haritası ve öneri kutusu ----------
  {
    const url = `${D}/yol-haritasi/`; const title = `Yol Haritası ve Öneri Kutusu | ${CFG.brand}`;
    const desc = `${CFG.brand} için planlanan işleri görün, eksik bulduğunuz özelliği veya istediğiniz yeni programı yazın. İstekler sayılır, planlamada kullanılır.`;
    const M = JSONOKU('yol-haritasi.json').maddeler;
    const grup = Object.entries(DURUM_AD).map(([k, ad]) => { const S = M.filter((x) => x.durum === k); return S.length ? `<h3>${esc(ad)}</h3><ul class="yen">${S.map((x) => `<li><b>${esc(x.baslik)}</b><span>${esc(x.metin)}</span></li>`).join('')}</ul>` : ''; }).join('\n  ');
    const form = `<form data-uc="/api/oneri" data-tamam="Öneriniz alındı. Teşekkür ederiz." class="gf" novalidate>
    <label class="tam">Konu<select name="program" data-yeni="yeniAlan"><option value="">Genel öneri</option><option value="_yeni">Listede olmayan yeni bir program</option>${programSec}</select></label>
    <label class="tam" id="yeniAlan" hidden>İstediğiniz program<input name="yeniProgram" minlength="2" maxlength="120" placeholder="Hangi sektör veya iş için?"></label>
    <label class="tam">İsteğiniz<textarea name="metin" required minlength="10" maxlength="1500" placeholder="Neye ihtiyacınız var, şu an nasıl yapıyorsunuz? Sağlık, kimlik veya kart bilgisi yazmayın."></textarea></label>
    <label class="tam">E-posta (isteğe bağlı, size dönmemizi isterseniz)<input name="eposta" type="email" maxlength="190" autocomplete="email"></label>
    ${tuzak}${kvkk('bu öneriyi değerlendirmek ve istersem bana dönmek')}${sonuc('Öneriyi gönder')}</form>`;
    const govde = `
  <h2>Planlanan işler</h2>
  <p>Bu liste gerçek çalışma planından gelir. Tarih verilmez, plan değişebilir. Tamamlanan işler <a href="/yenilikler/">Yenilikler</a> sayfasına taşınır.</p>
  ${grup}
  <h2 id="oneri">Öneri kutusu</h2>
  <p>Programda eksik bulduğunuz bir şey ya da sektörünüz için istediğiniz yeni bir program varsa yazın. Hangi programın kaç kez istendiği ekibimize sayılarak görünür. Her isteğin yapılacağı anlamına gelmez, öneriler herkese açık yayımlanmaz.</p>
  ${form}`;
    L.push({ yol: '/yol-haritasi/', rel: 'yol-haritasi', html: DOC({ title, desc, url, h1: 'Yol haritası ve öneri kutusu', lead: 'Sırada ne olduğunu görün, sizin için neyin önemli olduğunu söyleyin.', kirinti: kirinti('Yol haritası', url), govde, ek, schema: [sayfa({ ad: 'Yol haritası ve öneri kutusu', url, desc })] }) });
  }
  return L;
};
module.exports.AKTARIM = AKTARIM;
