// Danışan Takibi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js danisan
// Program satışa kapalıdır: indirme bağlantısı açılmaz, core/kilavuz.json kaydı yapılmaz. Ekrandaki kişi ve notlar kurgu demo verisidir. Bu dosyaya tıbbi tavsiye yazılmaz.
const KART = [['tikla', '[data-act=v]']]; // Listedeki ilk danışan: demo verisinde diyetisyene bağlıdır
// Pazar günü demo randevusu yoktur: takvim bekleyen randevusu olan ilk güne alınır
const BEKLEYEN = [['js', "(()=>{const a=NS.app.opts.db.all('appts').filter((x)=>x.status==='bekliyor').sort((x,y)=>x.date.localeCompare(y.date))[0];const i=document.querySelector('#dd');i.value=a.date;i.dispatchEvent(new Event('change',{bubbles:true}));})()"], ['bekle', 300]];
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında **Entegre et** düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, **Bağlantıyı dene** ile deneyin. ${deneme} Sonuç başarılıysa kart **Bağlı** görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz **Bağlantıyı dene** adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Danışan Takibi, diyetisyen, psikolog ve fizyoterapist gibi uzmanların randevusunu, danışan kartını, seans notunu, ölçümünü, planını ve ödemesini tutar. Program bir sağlık bilgi sistemi değildir: e-Nabız, reçete ve tanı kodu yoktur, program değerlendirme veya öneri üretmez. Kayıtları uzman kendi mesleki kararıyla girer.',
  kimler: 'Diyetisyen, psikolog ve fizyoterapist çalışan danışmanlık merkezleri ve serbest çalışan uzmanlar.',
  ilkNot: 'Seans notu ve ölçüm özel nitelikli kişisel veridir. Önce **Aydınlatma ve açık rıza metni** alanını hukuk danışmanınızla hazırlayın, sonra danışanlardan onam alın.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Bugünkü seansları, bu ay gelen ve gelmeyen sayısını, onamı eksik danışanları gösterir. Uzman yalnız kendi randevularını görür.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', adimlar: [['Üstteki kutular **Bugünkü seans**, **Bu ay gelen**, **Bu ay gelmeyen** ve **Onamı eksik** değerleridir.', '.kpi'], ['**Danışan** yeni kart açar.', '#nc'], ['**Randevu** randevu formunu açar.', '#na'], ['**Bugünün randevuları** günün listesidir. **Kapat** seans sonucunu yazar.', '.card@Bugünün randevuları']] }] }] },

    { id: 'takvim', ne: 'Günlük randevu listesini gösterir. Aynı uzmana çakışan saat kabul edilmez. Hatırlatma mesajında yalnız tarih, saat ve işletme adı yer alır, hizmet ve uzmanlık alanı yazılmaz.',
      gorevler: [
        { baslik: 'Randevu verme', sahneler: [
          { git: 'takvim', kirp: 'ana', adimlar: [['Günü seçin veya oklarla geçin.', '#dd'], ['**Randevu** formu açar.', '#na'], ['**Yarınkilere hatırlat** yarınki randevulara SMS gönderir.', '#rm']] },
          { git: 'takvim', once: [['tikla', '#na']], kirp: 'pencere', adimlar: [['**Danışan** ve **Uzman** seçin.', '.field@Danışan'], ['**Hizmet** seçin. Süre hizmetten gelir.', '.field@Hizmet'], ['**Tarih** ve **Saat** girin.', '.field@Saat'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Seansı kapatma', ne: 'Durum **Geldi**, **Gelmedi** veya **İptal** seçilir. Danışanın geçerli paketi varsa **Paketten düş** seçeneği çıkar. Gelmedi ve İptal seçilirse ücret yazılmaz.', sahneler: [{ git: 'takvim', once: [...BEKLEYEN, ['tikla', '[data-act=close]']], kirp: 'pencere', adimlar: [['**Durum** seçin.', '.field@Durum'], ['**Ücret (₺)** hizmet fiyatıyla gelir.', '.field@Ücret'], ['**Tahsilat** ödeme türüdür. **Sonra alınacak** seçilirse tutar bakiyede kalır.', '.field@Tahsilat'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Uzman bu saatte dolu uyarısı çıkıyor.', 'Saati veya uzmanı değiştirin.'], ['Önce danışan ekleyin uyarısı çıkıyor.', '**Danışanlar** sayfasından kart açın.'], ['Yarın için hatırlatılacak randevu yok uyarısı çıkıyor.', 'Yarın bekleyen ve telefonu kayıtlı randevu yoktur.']] },

    { id: 'danisanlar', ne: 'Danışan kartlarını tutar. Uzman yalnız kendine bağlı danışanları görür. Sekreter sağlık bilgisi, not, ölçüm ve plan görmez. Danışan kaydı silinmez, pasife alınır.',
      gorevler: [
        { baslik: 'Danışan ekleme', sahneler: [
          { git: 'danisanlar', kirp: 'ana', adimlar: [['**Danışan** yeni kart açar.', '#nc'], ['**Aktif** ve **Pasif** ile listeyi süzün.', '[data-f=pasif]'], ['**Onam** sütunu imzanın alınıp alınmadığını gösterir.', 'th@ONAM'], ['Karta girmek için bu simgeye basın.', '[data-act=v]']] },
          { git: 'danisanlar', once: [['tikla', '#nc']], kirp: 'pencere', boy: 950, adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Sorumlu uzman** zorunludur.', '.field@Sorumlu uzman'], ['**Sağlık bilgisi** bölümünü yalnız uzman ve yönetici görür.', '.field@Hedef'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Danışan kartı', ne: 'Kartta **Onam al** aydınlatma metnini gösterir ve imza alır. Yukarıdaki simgeler kişisel veriyi dışa aktarır ve kaydı anonimleştirir. **Pasife al** kaydı aktif listeden çıkarır.', sahneler: [{ git: 'danisanlar', once: KART, kirp: 'ana', adimlar: [['Üstte **Gelinen seans**, **Gelmediği** ve **Bakiye** görünür.', '.kpi'], ['Bölümler sekmelerdedir.', '.seg'], ['**Not ekle** seans notu yazar.', '#nn'], ['**Pasife al** kaydı pasife alır.', '#pv']] }] },
        { baslik: 'Seans notu', ne: 'Yeni not **Taslak** kalır, düzenlenebilir. **Kilitle** ile not sabitlenir, değiştirilemez, yalnız **Ek yaz** ile ek eklenir. Notu yalnız danışanın uzmanı ve yönetici görür.', sahneler: [{ git: 'danisanlar', once: [...KART, ['tikla', '#nn']], kirp: 'pencere', adimlar: [['**Tarih** ve **Not** zorunludur.', '.field@Not'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Ölçüm ve plan', ne: 'Ölçüler uzmanın yazdığı kayıttır, program yorumlamaz. **Özet** yazdırılır ve üzerinde tıbbi rapor olmadığı yazar. Psikolog kartında **Ölçümler** sekmesi görünmez. Planı uzman kendisi yazar, program plan önermez.', sahneler: [
          { git: 'danisanlar', once: [...KART, ['tikla', '[data-tab=olcum]']], kirp: 'ana', adimlar: [['**Ölçüm** yeni kayıt açar.', '#nm'], ['**Özet** ölçüm özetini yazdırır.', '#mp']] },
          { git: 'danisanlar', once: [...KART, ['tikla', '[data-tab=plan]']], kirp: 'ana', adimlar: [['**Plan** başlık, tarih ve metin sorar. Satırdaki **Yazdır** simgesi planı basar.', '#np']] }] },
        { baslik: 'Ödeme ve paket', ne: 'Paket satışı seans sayısı, bedel ve son kullanım tarihini yazar. Seans kapatılırken paketten düşülür.', sahneler: [{ git: 'danisanlar', once: [...KART, ['tikla', '[data-tab=odeme]']], kirp: 'ana', adimlar: [['**Tahsilat** ödeme alır, makbuz açılır.', '#tp'], ['**Paket sat** yeni paket yazar.', '#sp']] }] }],
      alanlar: [['Doğum tarihi', 'Kart bilgisi.'], ['Cinsiyet', 'Belirtilmedi seçilebilir.'], ['Hedef', 'Kartın üstünde görünür. Yalnız uzman ve yönetici görür.'], ['Öykü', 'Uzmanın yazdığı metin.'], ['Alerji / kısıt', 'Kartın üstünde uyarı rengiyle görünür.'], ['Kullandığı ilaçlar', 'Kartın üstünde uyarı rengiyle görünür.']],
      hatalar: [['Önce onam metnini girin uyarısı çıkıyor.', '**Ayarlar** sayfasında metni yazın. Metni hukuk danışmanınız hazırlar.'], ['Ağrı 0-10 arası olmalı uyarısı çıkıyor.', 'Bu alana 0 ile 10 arasında sayı yazın.'], ['Danışan kartı açılmıyor, listeye dönüyor.', 'Uzman yalnız kendine bağlı danışanı açar.']],
      not: 'Bu kılavuz sağlık bilgisi vermez. Değerlendirme ve karar uzmana aittir.' },

    { id: 'kasa', ne: 'Seçilen ayın tahsilatlarını ve açık bakiyeleri gösterir. Uzman yalnız kendi tahsilatını görür.',
      gorevler: [{ baslik: 'Ay tahsilatını görme', sahneler: [{ git: 'kasa', kirp: 'ana', adimlar: [['Ayı buradan seçin.', '#m'], ['Üstte **Tahsilat**, **Nakit**, **Kart** ve **Havale** toplamları görünür.', '.kpi'], ['**Açık bakiyeler** borcu kalan danışanlardır.', '.card@Açık bakiyeler']] }] }] },

    { id: 'uzmanlar', ne: 'Uzmanları, alanını ve rengini tutar. Danışanı olan uzman silinemez. Burada eklenen kişi programa giriş yapamaz, giriş için Ayarlar sayfasından kullanıcı açın. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Uzman ekleme', sahneler: [{ git: 'uzmanlar', kirp: 'ana', adimlar: [['**Yeni uzman** düğmesine basın, **Ad**, **Alan** ve **Renk** girin.', 'button@Yeni uzman']] }] }] },

    { id: 'hizmetler', ne: 'Hizmetleri, süreyi ve ücreti tutar. Süre çakışma kontrolünde, ücret seans kapatmada kullanılır. Randevusu olan hizmet silinemez. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Hizmet ekleme', sahneler: [{ git: 'hizmetler', once: [['tikla', 'button@Yeni hizmet']], kirp: 'pencere', adimlar: [['**Hizmet** adını yazın, **Alan** seçin.', '.field@Alan'], ['**Süre (dk)** ve **Ücret (₺)** girin.', '.field@Süre'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    O.belgeler({ tur: 'Tahsilat makbuzu' }),
    O.ayarlar({ alanlar: [['Aydınlatma ve açık rıza metni', 'Danışan kartında **Onam al** ile gösterilir ve imzalatılır. Metni hukuk danışmanınız hazırlar.']] }),
    O.bildirimler(),
    O.entegrasyonlar(),
  ],

  roller: 'Uzman yalnız kendi danışanını ve randevusunu görür. Sekreter randevu, kart ve ödeme işlerini yapar. Seans notu, ölçüm, plan ve sağlık alanları sekretere gönderilmez. Danışan kaydı silinmez, pasife alınır.',
  musteriYok: 'Danışan Takibi programında danışanın kendisinin açtığı bir sayfa yoktur.',
  yazdirma: { ne: 'Belgeler danışan kartından yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Tahsilat makbuzu', 'Tahsilatta açılır. Sonradan **Makbuz** simgesiyle.'], ['Beslenme / egzersiz planı', '**Planlar** sekmesinde **Yazdır** simgesi.'], ['Ölçüm özeti', '**Ölçümler** sekmesinde **Özet** düğmesi.']] },

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bağlandıktan sonra **Yarınkilere hatırlat** danışanlara SMS gönderir. Mesajda yalnız tarih, saat ve işletme adı yer alır.', 'Bağlantı yokken gönderim **TEST** kalır, danışana bir şey gitmez.'], sorun: [...DENEME_HATA, 'Hata görünüyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.'] },
    email: { degisir: [AKIS('E-posta', 'Deneme hesap bilgisini okur, e-posta göndermez.'), 'Bu programın ekranlarında e-posta gönderen düğme yoktur.'], sorun: DENEME_HATA },
    printer: { degisir: ['Belgeler tarayıcının yazdırma penceresiyle basılır, yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını görmenizi sağlar.'], sorun: ['Kâğıt boyu yanlışsa **Belge şablonları** sayfasından değiştirin.'] },
    backup: O.E.backup(),
  },
});
