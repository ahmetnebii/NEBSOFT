// Tüm programlarda aynı olan bölümler. Program içeriği (docs/kilavuz/<id>.js) buradaki modülleri çağırır, kendi modüllerini yazar.
// Entegrasyon bölümü çekirdekten üretilir: bağlantı listesi NS.integ.USED, doğrulama durumu UNVERIFIED ve core/integ-guides.js kayıtlarıdır; elle kopyalanmaz.
const { md, esc, tablo, liste, gorevHtml, modulHtml } = require('./sablon');
const ham = (s) => esc(String(s ?? '').replace(/<a\b[^>]*>|<\/a>/g, '')).replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/&lt;code&gt;|&lt;\/code&gt;/g, '').replace(/&amp;(\w+);/g, '&$1;');
const TEMEL = new Set(['sim', 'none', 'demo', 'manual']);

// ---------- Ortak modüller ----------
const belgeler = (o = {}) => ({ id: 'belgeler', ne: 'Yazdırdığınız belgelerin görünümünü burada ayarlarsınız: kâğıt boyu, logo, renk, hangi bölümlerin görüneceği ve belge altındaki metinler. Değişiklik sağdaki önizlemede anında görünür.', gorevler: [{ baslik: 'Belge şablonunu düzenleme', sahneler: [
  { git: 'belgeler', adimlar: [[o.tur ? `Üstten düzenleyeceğiniz belgeyi seçin, örneğin **${o.tur}**.` : 'Üstten düzenleyeceğiniz belgeyi seçin.', o.tur ? `button@${o.tur}` : null], ['**Kâğıt** alanından A4, A5, 80 mm veya 58 mm boyutunu seçin. Fiş yazıcısı kullanıyorsanız kâğıt rulonuzun genişliğini seçin.', '.field@Kâğıt'], ['İşiniz bitince **Şablonu kaydet** düğmesine basın.', 'button@Şablonu kaydet']] },
  { git: 'belgeler', adimlar: [['Sonucu görmek için **Deneme yazdır** düğmesini kullanın. Bu düğme örnek veriyle yazdırma penceresini açar.', 'button@Deneme yazdır']] }] }],
alanlar: [['Kâğıt', 'Belgenin basılacağı kâğıt boyu.'], ['Vurgu rengi', 'Başlık ve çizgilerde kullanılan renk.'], ['Yazı boyu', 'Belgedeki yazıların büyüklüğü.'], ['Logo', 'Belgenin başında görünen işletme logosu.'], ['Başlık altı not', 'Başlığın hemen altına yazılacak kısa metin.'], ['Şartlar / garanti metni', 'Belgenin altındaki koşul metni. Metni işletmeniz belirler.'], ['İmza başlıkları (| ile ayırın)', 'İmza kutularının başlıkları. Örneğin Teslim eden | Teslim alan.']],
hatalar: [['Değişiklik yazdırılan belgede görünmüyor.', '**Şablonu kaydet** düğmesine bastığınızdan emin olun, sonra belgeyi yeniden yazdırın.'], ['Logo görünmüyor.', 'Sayfadaki **Başlık (logo + işletme bilgisi)** bölümünün açık olduğunu kontrol edin.']] });

const ebelge = () => ({ id: 'ebelge', ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. Belgeyi bu sayfadan veya belge kesilen işlemden oluşturursunuz, durumunu buradan izlersiniz. Gerçek gönderim için önce Entegrasyonlar bölümünden entegratör hesabınızı bağlamanız gerekir. Bağlantı yokken oluşan belgeler TEST olarak görünür, GİB’e gitmez.', gorevler: [{ baslik: 'Belge kutularını izleme', sahneler: [
  { git: 'ebelge', en: 1500, adimlar: [['**Giden kutusu** kestiğiniz belgeleri, **Gelen kutusu** size kesilen belgeleri gösterir.', 'button@Giden kutusu'], ['Belge durumlarını yenilemek için **Durumları güncelle** düğmesini kullanın.', '#eb-bulk'], ['Vergi numarasının e-Fatura mükellefi olup olmadığını **Mükellef sorgula** ile öğrenin.', '#eb-q'], ['Faturasız bir satış için **Manuel e-Arşiv** ile belge oluşturun.', '#eb-new']] }] }],
hatalar: [['Belge TEST olarak görünüyor.', 'Entegratör bağlı değildir. **Entegrasyonlar** sayfasından e-Fatura bağlantısını kurun. TEST belgeler resmî belge değildir.'], ['Belge hata durumunda kaldı.', 'Satırdaki **Tekrar gönder** seçeneğini kullanın. Hata sürerse entegratör panelinizdeki bilgileri kontrol edin.']] });

const entegrasyonlar = () => ({ id: 'entegrasyonlar', ne: 'Bu programda kullanılan bağlantıların kurulduğu sayfadır. Sayfada yalnız bu programda çalışan bağlantılar listelenir. Kurulum adımları, her bağlantıda neyin değiştiği ve hangi bağlantıların henüz kullanılamadığı kılavuzun Entegrasyonlar bölümünde ayrıntılı yazılıdır.', gorevler: [] });

const bildirimler = () => ({ id: 'bildirimler', ne: 'Hangi olayda hangi sesin çalacağını seçtiğiniz sayfadır. Ayarlar bu cihaza özeldir, örneğin kasadaki bilgisayar ile depodaki tablet farklı ayarlanabilir.', gorevler: [{ baslik: 'Bildirim sesini ayarlama', sahneler: [{ git: 'bildirimler', adimlar: [['Ayarınızı denemek için **Deneme bildirimi** düğmesine basın.', 'button@Deneme bildirimi'], ['Program arka plandayken de uyarı almak için **Tarayıcı izni ver** düğmesini kullanın.', 'button@Tarayıcı izni ver']] }] }],
alanlar: [['Bildirimler açık', 'Kapalıysa bu cihazda ses çalmaz.'], ['Ses düzeyi', 'Bildirim sesinin yüksekliği.'], ['Onaylanana kadar tekrarla', 'Önemli olayda bildirimi görene kadar ses yinelenir.']],
hatalar: [['Ses gelmiyor.', 'Bilgisayarın sesini ve **Bildirimler açık** kutusunu kontrol edin. Tarayıcı sesi ancak sayfaya bir kez tıkladıktan sonra çalar.']] });

const imzali = () => ({ id: 'imzali', ne: 'Sözleşme, tutanak ve benzeri belgeleri karşı tarafa ekranda imzalatıp işletmenizin şablonuyla yazdırdığınız sayfadır. İmzalanan belgeler aynı sayfadaki **Arşiv** bölümünde saklanır.', gorevler: [{ baslik: 'Belge imzalatma', sahneler: [{ git: 'imzali', adimlar: [['Metinleri işletmenize göre değiştirmek için **Şablonları tasarla** düğmesini kullanın.', 'a@Şablonları tasarla'], ['Yukarıdaki belge türlerinden birini seçin, formu doldurun ve karşı tarafa ekranda imzalatın.', null]] }] }],
hatalar: [['Belge metni işletmeme uymuyor.', 'Metinler örnektir. **Şablonları tasarla** ile düzenleyin, gerekiyorsa hukuk danışmanınıza gösterin.']] });

const ayarlar = (o = {}) => ({ id: 'ayarlar', ne: 'İşletme bilgilerini, kullanıcıları, menüde görünecek bölümleri, temayı ve yedeklemeyi buradan yönetirsiniz.', gorevler: [{ baslik: 'İşletme bilgilerini girme', ne: 'Buraya yazdığınız bilgiler fişlerde, belgelerde ve müşteri sayfalarında görünür.', sahneler: [
  { git: 'ayarlar', kirp: '.card@İşletme Bilgileri', boy: 1900, adimlar: [['**İşletme adı** ve iletişim bilgilerinizi yazın.', '.field@İşletme adı'], ['**Kaydet** düğmesine basın.', '#ss']] }] },
{ baslik: 'Kullanıcı ekleme', ne: 'Her çalışana ayrı kullanıcı açın. Kullanıcının rolü menüde neleri göreceğini belirler. Rollerin ayrıntısı Roller ve yetkiler bölümündedir.', sahneler: [
  { git: 'ayarlar', once: [['tikla', '#ua']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın.', '.field@Ad soyad'], ['**Rol** seçin.', '.field@Rol'], ['Kullanıcının gireceği dört haneli **PIN (4 hane)** kodunu belirleyin.', '.field@PIN'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
{ baslik: 'Kullanmadığınız bölümü gizleme', sahneler: [
  { git: 'ayarlar', boy: 1500, kirp: '#navh', adimlar: [['**Menü ve modüller** listesinde kutuyu kaldırın. Bölüm menüden gizlenir, veriler silinmez. Kutuyu yeniden işaretleyince bölüm geri gelir.', null]] }] }],
alanlar: [['İşletme adı', 'Belgelerde ve müşteri sayfalarında görünen ad.'], ['Vergi no', 'Faturalarda kullanılan vergi numarası.'], ['Vergi dairesi', 'Faturalarda kullanılan vergi dairesi.'], ...(o.alanlar || [])],
hatalar: [['Kaydet düğmesi sonrası uyarı çıkıyor.', 'Yıldızlı alanlar zorunludur. Boş kalan alanı doldurun.'], ['PIN kabul edilmiyor.', 'PIN dört haneli rakam olmalıdır.'], ['Tema başka bilgisayarda farklı.', 'Tema seçimi cihaza özeldir. Her cihazda ayrı seçilir.']] });

// ---------- Hazır entegrasyon metinleri ----------
const E = {
  backup: () => ({ degisir: ['**Yedek al** bu programın verilerini JSON dosyası olarak bilgisayarınıza indirir. Dosya adı program adı ve tarihle başlar.', 'Hatırlatma süresi yedek almanızı hatırlatan ayardır. Otomatik yedek almaz.', 'Bu bağlantı dış bir servise veri göndermez.'], sorun: ['Yedek dosyası inmiyorsa tarayıcının indirme iznini kontrol edin.'] }),
  whatsappLink: (nerede) => ({ degisir: [`${nerede} WhatsApp’ı açar. Mesaj hazır gelir, siz gönderirsiniz.`, 'Bu düğme API bağlansa da WhatsApp’ı açar. Mesajı siz gönderirsiniz, otomatik gönderim olmaz.'], sorun: ['WhatsApp açılmıyorsa müşterinin telefon numarasını kontrol edin.'] }),
};

// ---------- Entegrasyon sınıflandırma ----------
// x: programın entegrasyon içeriği. kapali listesindeki sağlayıcı bu programda çalışmaz (koddan doğrulanır, nedeni yanında yazılır)
function durum(e, p, x) {
  const g = p.g;
  const kap = x && x.kapali && (x.kapali[p.value] || x.kapali['*']); if (kap && !TEMEL.has(p.value) && p.value !== 'custom') return ['no', 'Henüz kullanılamıyor', kap];
  if (e.kilit && !TEMEL.has(p.value)) return ['no', 'Henüz kullanılamıyor', 'Resmî, herkese açık doküman doğrulanmadı. Yalnız simülasyon seçilebilir.'];
  if (TEMEL.has(p.value)) return ['ki', 'Temel mod', 'Dış servise bağlanmaz.'];
  if (g && (g.status === 'yakinda' || g.status === 'desteklenmiyor')) return ['no', 'Henüz kullanılamıyor', g.status === 'yakinda' ? 'Yazılım onayı bekleniyor.' : 'Bu sürümde desteklenmiyor.'];
  if (g && g.limit && g.status !== 'erisim') return ['ki', 'Sınırlı', 'Bu sürümde bir bölümü çalışır, sınırı aşağıda yazar.'];
  if (g && g.status === 'dogrulandi') return ['ok', 'Hazır', `Resmî dokümanla doğrulandı (${g.verified || 'tarih yok'}).`];
  if (g && g.status === 'genel') return ['ok', 'Hazır', 'Standart protokol. Markaya özel menü yolu doğrulanmadı.'];
  if (g && g.status === 'erisim') return ['ki', 'Kısmen doğrulandı', 'Resmî dokümanın tamamına erişilemedi. Sağlayıcınızla deneyin.'];
  if (p.value === 'custom') return ['ki', 'Özel servis', 'Kendi servisinizi veya çözüm ortağınızı bağlamak içindir, teknik bilgi gerekir.'];
  return ['no', 'Henüz kullanılamıyor', 'Bu sağlayıcı için doğrulanmış kurulum rehberi yok.'];
}
const kullanilir = (d) => d[0] === 'ok' || d[0] === 'ki';

// Sihirbaz görüntüsü: her bağlantı için bir sahne. Tüm bağlantılar kilitliyse bile ayar ekranının gerçek hâli gösterilir.
function entegrasyonHazirla(K, R) {
  K.entSahne = [{ git: 'entegrasyonlar', kirp: 'ana', adimlar: [['Sol menüden **Entegrasyonlar** sayfasını açın. Üstteki kutular kaç bağlantının bağlı, hatalı veya kurulum beklediğini gösterir.', '.ic-kpi'], ['Bağlantıyı bulmak için arama kutusunu veya kategorileri kullanın.', '#icq'], ['Kurmak istediğiniz kartta **Kur** düğmesine basın. Kurulum sihirbazı açılır.', '[data-wz]']] }];
  R.ent.forEach((e) => { const x = K.entegrasyon[e.k] = K.entegrasyon[e.k] || {}; x.sahneler = x.sahneler || [{ git: 'entegrasyonlar', once: [['tikla', `[data-wz="${e.k}"]`]], kirp: 'pencere', adimlar: [['Sihirbazın üstünde kurulum adımları görünür: **Sağlayıcı**, **Ön koşullar**, **Bilgiler nereden?**, **Bağlantı ayarları**, **Bağlantı testi**, **Kaydet**.', '.wz-steps']] }]; });
  return null;
}
function entegrasyonBolum(K, R, baslangic) {
  const alt = R.ent.map((e) => ({ capa: `ent-${e.k}`, baslik: e.title }));
  const ozet = tablo(['Bağlantı', 'Durum'], R.ent.map((e) => { const D = e.provs.map((p) => durum(e, p, K.entegrasyon[e.k])); const var_ = D.some((d) => d[0] === 'ok'); const kis = D.some((d) => d[0] === 'ki' && !['Temel mod', 'Özel servis'].includes(d[1])); return [e.title, !e.provs.length ? 'Hazır' : var_ ? 'Hazır sağlayıcı var' : kis ? 'Sınırlı veya kısmen doğrulandı' : 'Henüz kullanılamıyor']; }));
  const parca = R.ent.map((e) => {
    const x = K.entegrasyon[e.k]; const satir = e.provs.map((p) => { const d = durum(e, p, x); return `<tr><td>${esc(p.label)}</td><td><span class="etk ${d[0]}">${esc(d[1])}</span></td><td>${esc(d[2])}</td></tr>`; }).join('');
    const uy = e.provs.filter((p) => kullanilir(durum(e, p, x)) && p.g).filter((p) => !TEMEL.has(p.value));
    // Aynı kurulum metnini paylaşan sağlayıcılar tek başlıkta toplanır (POS cihaz markaları gibi)
    const grup = new Map(); uy.forEach((p) => { const a = JSON.stringify([p.g.prereq, p.g.where, p.g.fields, p.g.test, p.g.errors, p.g.limit]); if (!grup.has(a)) grup.set(a, []); grup.get(a).push(p); });
    const prov = [...grup.values()].map((L) => { const p = L[0]; const g = p.g; return `<h4>${esc(L.map((x) => x.label).join(', '))}</h4>${g.summary && L.length === 1 ? `<p>${ham(g.summary)}</p>` : ''}${g.limit ? `<div class="uy"><b>Bu sürümdeki sınır:</b> ${ham(g.limit)}</div>` : ''}
      ${g.prereq.length ? `<p><b>Ön koşullar</b></p><ul>${g.prereq.map((y) => `<li>${ham(y)}</li>`).join('')}</ul>` : ''}${g.where.length ? `<p><b>Bilgiler nereden alınır</b></p><ol>${g.where.map((y) => `<li>${ham(y)}</li>`).join('')}</ol>` : ''}
      ${g.fields.length ? `<p><b>Nasıl girilir</b></p><table><thead><tr><th>Alan</th><th>Nereden alınır</th></tr></thead><tbody>${g.fields.map((f) => `<tr><td>${esc(f.label)}${f.required ? ' *' : ''}</td><td>${ham(f.nereden || f.ne || '')}</td></tr>`).join('')}</tbody></table>` : ''}
      ${g.test ? `<p><b>Nasıl test edilir:</b> ${ham(g.test)}</p>` : ''}${g.errors.length ? `<p><b>Sorun çıkarsa</b></p><table><thead><tr><th>Hata</th><th>Çözüm</th></tr></thead><tbody>${g.errors.map((h) => `<tr><td>${ham(h.title)}</td><td>${ham(h.fix)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${g.sources.length ? `<p><b>Resmî kaynak:</b> ${g.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>` : ''}`; }).join('');
    const hic = e.kilit || (e.provs.length && !e.provs.some((p) => !TEMEL.has(p.value) && p.value !== 'custom' && kullanilir(durum(e, p, x))));
    return `<section class="alt" id="ent-${e.k}"><h3>${esc(e.title)}</h3><p class="bag">${esc(e.desc)}.</p>${hic ? `<div class="yok"><b>Henüz kullanılamıyor.</b> ${e.kilit ? 'Bu bağlantının resmî, herkese açık dokümanı doğrulanmadı. Canlı bağlantı seçilemez, yalnız simülasyon çalışır ve hiçbir şey gönderilmez.' : 'Bu bağlantı için bu sürümde desteklenen sağlayıcı yoktur. Yalnız simülasyon veya kendi özel servisiniz seçilebilir.'}</div>` : ''}
      ${gorevHtml({ baslik: 'Nereden açılır', ne: `**Entegrasyonlar** sayfasında **${e.title}** kartının **Kur** düğmesine basın.`, sahneler: x.sahneler })}
      ${satir ? `<h4>Sağlayıcılar</h4><table><thead><tr><th>Sağlayıcı</th><th>Durum</th><th>Açıklama</th></tr></thead><tbody>${satir}</tbody></table>` : ''}
      <h4>Bağlandıktan sonra bu programda ne değişir</h4>${liste(x.degisir)}${x.sorun ? `<h4>Sorun çıkarsa ne yapılır</h4>${liste(x.sorun)}` : ''}${prov}</section>`;
  }).join('');
  return { capa: 'entegrasyon', baslik: 'Entegrasyonlar', alt, html: `<section class="b" id="entegrasyon"><h2>${baslangic}. Entegrasyonlar</h2>
    <p>Bağlantılar sihirbazla kurulur: sağlayıcıyı seçersiniz, ön koşulları okursunuz, bilgileri girersiniz, testi yaparsınız ve kaydedersiniz. Bu bölümde yalnız bu programda kullanılan bağlantılar anlatılır. Bir sağlayıcıyı canlıya almadan önce sağlayıcının test hesabıyla deneyin: resmî dokümana uygun olması canlı testin yerini tutmaz.</p>
    ${gorevHtml({ baslik: 'Entegrasyon Merkezi', sahneler: K.entSahne })}
    <h3>Bu programdaki bağlantılar</h3>${ozet}
    <div class="not">Durum sözcükleri: <b>Hazır</b> resmî dokümanla doğrulanmış veya standart protokolle çalışan sağlayıcıdır. <b>Sınırlı</b> sağlayıcının yalnız bir bölümü çalışır, sınır o sağlayıcının altında yazar. <b>Kısmen doğrulandı</b> dokümanın bir bölümüne erişilemeyen sağlayıcıdır, canlıya almadan önce sağlayıcınızla deneyin. <b>Henüz kullanılamıyor</b> canlıda kullanılamayan veya doğrulanmamış seçenektir.</div>
    ${parca}</section>` };
}

// ---------- Bölümler ----------
function bolumler(K, R, X) {
  const nav = Object.fromEntries(R.navHepsi); const B = []; let no = 0; const yeni = (b) => { no++; B.push(typeof b === 'function' ? b(no) : b); };
  yeni((n) => ({ capa: 'tanitim', baslik: `${X.urun.name} programını tanıyın`, html: `<section class="b" id="tanitim"><h2>${n}. ${esc(X.urun.name)} programını tanıyın</h2><h3>Ne işe yarar</h3><p>${md(K.ne)}</p><h3>Kimler için</h3><p>${md(K.kimler)}</p>
    ${gorevHtml({ baslik: 'Ekranı tanıyın', sahneler: K.ekrantanitim })}
    <h3>İlk kurulum adımları</h3><p>Programı ilk açtığınızda şu sırayla ilerleyin. Yeni hesaplar örnek veriyle açılır. Ürünü tanıdıktan sonra örnekleri temizleyip kendi kayıtlarınızı girin.</p>
    <ol>${X.kurulum.map((s) => `<li><b>${esc(s.t)}.</b> ${esc(s.d)} <span style="color:#6b7280">(${esc(nav[s.go] || s.go)} sayfası)</span></li>`).join('')}</ol>${K.ilkNot ? `<div class="not">${md(K.ilkNot)}</div>` : ''}</section>` }));
  K.moduller.filter((m) => m.id !== 'entegrasyonlar').forEach((m) => { m.baslik = m.baslik || nav[m.id] || m.id; m.capa = `m-${m.id}`; yeni((n) => ({ capa: m.capa, baslik: m.baslik, html: modulHtml(m, n) })); });
  yeni((n) => { const rol = Object.entries(R.roles); const mu = (N, r) => !N.roles || r === 'admin' || N.roles.includes(r);
    return { capa: 'roller', baslik: 'Roller ve yetkiler', html: `<section class="b" id="roller"><h2>${n}. Roller ve yetkiler</h2><p>Her kullanıcının bir rolü vardır. Rol, menüde hangi bölümlerin görüneceğini belirler. Kullanıcıları ${md('**Ayarlar**')} sayfasından eklersiniz. Yetkisiz kullanıcı o bölümü menüde görmez.</p>
    <table><thead><tr><th>Menü</th>${rol.map(([, ad]) => `<th>${esc(ad)}</th>`).join('')}</tr></thead><tbody>${R.nav.filter((N) => nav[N.id]).map((N) => `<tr><td>${esc(nav[N.id])}</td>${rol.map(([r]) => `<td>${mu(N, r) ? 'Görür' : '-'}</td>`).join('')}</tr>`).join('')}</tbody></table>${K.roller ? `<div class="not">${md(K.roller)}</div>` : ''}</section>` }; });
  yeni((n) => ({ capa: 'musteri', baslik: 'Müşteriye açık sayfalar', html: `<section class="b" id="musteri"><h2>${n}. Müşteriye açık sayfalar</h2>${(K.musteri || []).length ? (K.musteri).map((m) => `<h3>${esc(m.ad)}</h3><p>${md(m.ne)}</p>${m.sahneler ? gorevHtml({ baslik: 'Sayfanın görünümü', sahneler: m.sahneler }) : ''}${m.not ? `<div class="not">${md(m.not)}</div>` : ''}`).join('') : `<p>${md(K.musteriYok || 'Bu programda müşterinin kendisinin açtığı bir sayfa yoktur.')}</p>`}</section>` }));
  yeni((n) => ({ capa: 'yazdirma', baslik: 'Yazdırma ve belge işlemleri', html: `<section class="b" id="yazdirma"><h2>${n}. Yazdırma ve belge işlemleri</h2><p>${md(K.yazdirma.ne)}</p>${tablo(['Belge', 'Nereden yazdırılır'], K.yazdirma.belgeler)}<div class="not">Yazdırma tarayıcının yazdırma penceresiyle yapılır. Bu pencereden yazıcıyı seçer veya belgeyi PDF olarak kaydedersiniz. Görünümü **Belge şablonları** sayfasından ayarlarsınız.</div></section>`.replace('**Belge şablonları**', '<b class="ad">Belge şablonları</b>') }));
  yeni((n) => ({ capa: 'yedek', baslik: 'Yedekleme', html: `<section class="b" id="yedek"><h2>${n}. Yedekleme</h2><p>Verilerinizi düzenli olarak dosyaya alın. Yedek dosyası işletme verilerinizi içerir, güvenli bir yerde saklayın.</p><ol><li>${md('**Ayarlar** sayfasını açın.')}</li><li>${md('**Veri Yönetimi** kartında **Yedek al** düğmesine basın. JSON dosyası bilgisayarınıza iner.')}</li><li>${md('Dosyayı başka bir diske veya güvendiğiniz bir depolama alanına kopyalayın.')}</li></ol><h3>Yedekten geri dönme</h3><p>${md('**Yedekten yükle** seçilen dosyadaki veriyi programa yazar, mevcut verinin yerine geçer. Bu düğme bulut hesabında rolü sunucuda atanmış kullanıcılarda görünmez.')}</p><div class="uy">${md('**Demoyu sıfırla** tüm verileri siler ve örnek verileri yükler. Gerçek verilerle çalışırken bu düğmeyi kullanmayın, önce yedek alın.')}</div></section>` }));
  yeni((n) => entegrasyonBolum(K, R, n));
  yeni((n) => { const sss = [...(X.yardim ? X.yardim.sss : []), ...(X.urun.faq || []), ...(K.sss || [])].filter(([q]) => !(K.sssHaric || []).includes(q)); return { capa: 'sss', baslik: 'Sık sorulan sorular ve destek', html: `<section class="b" id="sss"><h2>${n}. Sık sorulan sorular ve destek</h2>${sss.map(([q, a]) => `<h4>${esc(q)}</h4><p>${md(a)}</p>`).join('')}<h3>Destek</h3><p>Takıldığınız yerde programın sağ altındaki destek balonuna yazabilir veya bize ulaşabilirsiniz.</p><ul><li>Telefon: ${esc(X.CFG.phone)}</li><li>E-posta: ${esc(X.CFG.email)}</li><li>Yardım merkezi: <a href="${X.CFG.domain}/#/yardim/${X.id}">${X.CFG.domain.replace('https://', '')}/#/yardim/${X.id}</a></li></ul></section>` }; });
  return B;
}
module.exports = { belgeler, ebelge, entegrasyonlar, bildirimler, imzali, ayarlar, E, durum, entegrasyonHazirla, entegrasyonBolum, bolumler };
