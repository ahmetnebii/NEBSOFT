/* NEBSOFT İmzalı belgeler — her ürünün sektörüne özel sözleşme, onam, tutanak ve makbuzları
   • Programın "İmzalı belgeler" sayfasında: tür seç → kişiyi listeden seç (ya da elle yaz) → alanları doldur → metni gerekirse düzenle
     → karşı tarafa ekranda imzalat → işletmenin şablonuyla yazdır. Belgeler arşivlenir, sonradan yeniden yazdırılır.
   • Metindeki {{musteri}}, {{isletme}}, {{tarih}} ve alan adları ({{ucret}} gibi) yazdırırken doldurulur.
   • Görünüm "Belge şablonları" sayfasından (kâğıt, logo, renk, bölümler) her tür için ayrı tasarlanır. */
(function () {
  'use strict';
  if (!window.NS || !window.NS.docs) return;
  const NS = window.NS; const { esc, icon, money } = NS;
  const T = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra });
  const LINES = (label = 'Kalemler') => T('lines', label + ' — her satır: açıklama ; miktar ; tutar', 'lines');
  const DAMAGE = T('damage', 'Hasar krokisi', 'damage');
  // coll: kişi listesi (yoksa elle yazılır) · party: karşı tarafın başlığı · sign: imza başlıkları [işletme, karşı taraf]
  const FORMS = {
    otel: { coll: 'guests', party: 'Misafir', kinds: [
      { id: 'konaklama', label: 'Konaklama kayıt formu', sign: ['Resepsiyon', 'Misafir'], fields: [T('oda', 'Oda no'), T('giris', 'Giriş tarihi', 'date'), T('cikis', 'Çıkış tarihi', 'date'), T('kisi', 'Kişi sayısı', 'number'), T('kimlik', 'Kimlik / pasaport no')],
        body: 'Ben {{musteri}}, {{giris}} – {{cikis}} tarihleri arasında {{oda}} numaralı odada konaklayacağımı; tesis kurallarına uyacağımı, odada ve ortak alanlarda vereceğim zararları ödeyeceğimi, kimlik bilgilerimin yasal bildirim (KBS) amacıyla işlenmesine onay verdiğimi beyan ederim.' },
      { id: 'emanet', label: 'Emanet / eşya teslim tutanağı', sign: ['Teslim alan (tesis)', 'Teslim eden'], fields: [LINES('Eşyalar')], body: 'Aşağıda listelenen eşyalar {{tarih}} tarihinde emanet olarak teslim alınmıştır. Değerli eşyalar için tesis kasası önerilir.' }] },
    spor: { coll: 'members', party: 'Üye', kinds: [
      { id: 'uyelik', label: 'Üyelik sözleşmesi', sign: ['Tesis', 'Üye'], fields: [T('paket', 'Üyelik paketi'), T('baslangic', 'Başlangıç', 'date'), T('bitis', 'Bitiş', 'date'), T('ucret', 'Toplam ücret (₺)', 'number'), T('taksit', 'Ödeme / taksit planı')],
        body: '{{musteri}}, {{baslangic}} – {{bitis}} tarihleri arasında geçerli "{{paket}}" üyeliğini {{ucret}} ₺ bedelle satın almıştır. Üyelik kişiye özeldir, devredilemez. Dondurma hakkı tesis kurallarına tabidir. Tesis içindeki kişisel eşyalardan tesis sorumlu değildir.' },
      { id: 'saglik', label: 'Sağlık beyan formu', sign: ['Eğitmen', 'Üye'], fields: [T('rahatsizlik', 'Bilinen rahatsızlıklar', 'textarea'), T('ilac', 'Kullandığı ilaçlar')],
        body: 'Spor yapmama engel bir sağlık sorunum bulunmadığını; belirttiğim rahatsızlıklar dışında bir durum olursa tesisi bilgilendireceğimi, egzersizleri kendi sorumluluğumda yaptığımı beyan ederim.' }] },
    kurs: { coll: 'students', party: 'Öğrenci / veli', kinds: [
      { id: 'kayit', label: 'Kayıt sözleşmesi', sign: ['Kurum', 'Veli / öğrenci'], fields: [T('program', 'Program / sınıf'), T('donem', 'Dönem'), T('ucret', 'Toplam ücret (₺)', 'number'), T('taksit', 'Taksit planı')],
        body: '{{musteri}} için {{donem}} dönemi "{{program}}" programına {{ucret}} ₺ bedelle kayıt yapılmıştır. Ödemeler belirtilen taksit planına göre yapılır. Dönem başladıktan sonra yapılan ayrılmalarda iade, yasal mevzuat ve kurum yönetmeliğine göre hesaplanır.' },
      { id: 'izin', label: 'Veli izin formu', sign: ['Kurum', 'Veli'], fields: [T('etkinlik', 'Etkinlik / gezi'), T('etkinlikTarih', 'Tarih', 'date')], body: 'Velisi bulunduğum {{musteri}} adlı öğrencinin {{etkinlikTarih}} tarihindeki "{{etkinlik}}" etkinliğine katılmasına izin veriyorum.' }] },
    anaokulu: { coll: 'students', party: 'Öğrenci / veli', kinds: [
      { id: 'kayit', label: 'Kayıt sözleşmesi', sign: ['Okul', 'Veli'], fields: [T('sinif', 'Sınıf'), T('donem', 'Eğitim dönemi'), T('ucret', 'Aylık ücret (₺)', 'number')],
        body: '{{musteri}} adlı öğrencinin {{donem}} döneminde {{sinif}} sınıfına aylık {{ucret}} ₺ ücretle kaydı yapılmıştır. Ücret her ayın ilk haftası ödenir. Çocuğun sağlık durumu ve alerjileri veli tarafından okula bildirilmiştir.' },
      { id: 'teslim', label: 'Teslim alma yetki formu', sign: ['Okul', 'Veli'], fields: [T('yetkili', 'Teslim almaya yetkili kişiler (ad, yakınlık, telefon)', 'textarea')], body: 'Çocuğumu okul çıkışında yalnızca aşağıda belirttiğim kişilerin teslim almasına izin veriyorum. Bu kişiler dışında kimseye teslim edilmemesini talep ederim.' },
      { id: 'foto', label: 'Fotoğraf / video izin formu', sign: ['Okul', 'Veli'], fields: [], body: 'Çocuğumun okul etkinliklerinde çekilen fotoğraf ve videolarının yalnızca veli portalı ve okul içi paylaşımlarda kullanılmasına izin veriyorum. Bu iznimi dilediğim zaman geri alabilirim.' }] },
    veteriner: { coll: 'owners', party: 'Hayvan sahibi', kinds: [
      { id: 'onam', label: 'Operasyon / anestezi onam formu', sign: ['Veteriner hekim', 'Hayvan sahibi'], fields: [T('hayvan', 'Hayvanın adı / türü'), T('islem', 'Yapılacak işlem'), T('ucret', 'Tahmini ücret (₺)', 'number')],
        body: '{{hayvan}} için planlanan "{{islem}}" işlemi, anestezinin ve operasyonun olası riskleri hakkında bilgilendirildim. İşlemin yapılmasına ve gerekli görülen ek müdahalelere onay veriyorum. Tahmini ücret {{ucret}} ₺’dir.' },
      { id: 'otel', label: 'Pet otel teslim formu', sign: ['Klinik', 'Hayvan sahibi'], fields: [T('hayvan', 'Hayvanın adı / türü'), T('giris', 'Giriş', 'date'), T('cikis', 'Çıkış', 'date'), T('mama', 'Mama ve bakım notları', 'textarea')], body: '{{hayvan}} {{giris}} – {{cikis}} tarihleri arasında pet otelde kalacaktır. Aşıları günceldir; acil durumda hekimin gerekli müdahaleyi yapmasına onay veriyorum.' }] },
    hukuk: { coll: 'clients', party: 'Müvekkil', kinds: [
      { id: 'ucret', label: 'Avukatlık ücret sözleşmesi', sign: ['Avukat', 'Müvekkil'], fields: [T('dosya', 'Dava / iş konusu'), T('ucret', 'Vekalet ücreti (₺)', 'number'), T('odeme', 'Ödeme şekli')],
        body: '{{musteri}}, "{{dosya}}" işinin takibi için avukatlık hizmeti almaktadır. Vekalet ücreti {{ucret}} ₺ olup {{odeme}} şeklinde ödenecektir. Yargılama giderleri ve masraflar ücrete dahil değildir; masraf avansı ayrıca talep edilir.' },
      { id: 'avans', label: 'Masraf avansı makbuzu', sign: ['Avukat', 'Müvekkil'], fields: [T('dosya', 'Dosya'), LINES('Masraflar')], body: '"{{dosya}}" dosyası için aşağıdaki masraf avansı teslim alınmıştır. Kullanılmayan tutar dosya sonunda iade edilir.' }] },
    musavir: { coll: 'clients', party: 'Mükellef', kinds: [
      { id: 'hizmet', label: 'Mali müşavirlik hizmet sözleşmesi', sign: ['Mali müşavir', 'Mükellef'], fields: [T('kapsam', 'Hizmet kapsamı', 'textarea'), T('ucret', 'Aylık ücret (₺)', 'number'), T('baslangic', 'Başlangıç', 'date')],
        body: '{{musteri}} ile {{baslangic}} tarihinden itibaren geçerli olmak üzere aylık {{ucret}} ₺ ücretle mali müşavirlik hizmeti sözleşmesi yapılmıştır. Belgelerin zamanında teslimi mükellefin, beyannamelerin süresinde verilmesi müşavirin sorumluluğundadır.' },
      { id: 'evrak', label: 'Evrak teslim tutanağı', sign: ['Teslim alan', 'Teslim eden'], fields: [T('donem', 'Dönem'), LINES('Evraklar')], body: '{{donem}} dönemine ait aşağıdaki evraklar {{tarih}} tarihinde teslim alınmıştır.' }] },
    ik: { coll: 'employees', party: 'Personel', kinds: [
      { id: 'zimmet', label: 'Zimmet tutanağı', sign: ['Teslim eden', 'Teslim alan personel'], fields: [LINES('Zimmetlenen malzemeler')], body: 'Aşağıda listelenen malzemeler {{tarih}} tarihinde {{musteri}} adlı personele zimmetlenmiştir. Personel malzemeleri özenle kullanacağını, işten ayrılırken eksiksiz iade edeceğini kabul eder.' },
      { id: 'izin', label: 'Yıllık izin formu', sign: ['Yönetici', 'Personel'], fields: [T('baslangic', 'İzin başlangıcı', 'date'), T('bitis', 'İşe dönüş', 'date'), T('gun', 'İzin günü', 'number'), T('vekil', 'Yerine bakacak kişi')], body: '{{musteri}}, {{baslangic}} tarihinden itibaren {{gun}} gün yıllık izin kullanacak ve {{bitis}} tarihinde işbaşı yapacaktır.' },
      { id: 'kvkk', label: 'KVKK aydınlatma ve açık rıza', sign: ['İşveren', 'Personel'], fields: [], body: 'Kişisel verilerimin iş sözleşmesinin kurulması ve ifası, yasal yükümlülükler (SGK, vergi) ve iş sağlığı güvenliği amaçlarıyla işleneceği konusunda aydınlatıldım; gerekli hallerde açık rızamı veriyorum.' }] },
    galeri: { coll: 'vehicles', party: 'Araç', subject: true, kinds: [
      { id: 'satis', label: 'Araç satış sözleşmesi', sign: ['Satıcı', 'Alıcı'], fields: [T('alici', 'Alıcı adı soyadı'), T('aliciTc', 'Alıcı TC kimlik no'), T('aliciTel', 'Alıcı telefon'), T('bedel', 'Satış bedeli (₺)', 'number'), T('kapora', 'Alınan kapora (₺)', 'number'), T('km', 'Km', 'number')],
        body: 'Yukarıda bilgileri yazılı araç {{bedel}} ₺ bedelle {{alici}} adlı alıcıya satılmıştır. Alıcı aracı görerek, ekspertiz ve tramer kaydını inceleyerek satın almıştır. Noter devri sırasında kalan bedel ödenir.' },
      { id: 'teslim', label: 'Araç teslim tutanağı', sign: ['Teslim eden', 'Teslim alan'], fields: [T('alici', 'Teslim alan'), T('km', 'Km', 'number'), DAMAGE], body: 'Araç işaretlenen hasarlar dışında sağlam, anahtarları, ruhsatı ve aksesuarlarıyla birlikte {{tarih}} tarihinde teslim edilmiştir.' }] },
    kuyumcu: { coll: 'customers', party: 'Müşteri', kinds: [
      { id: 'alis', label: 'Altın / eşya alış makbuzu', sign: ['Kuyumcu', 'Satan'], fields: [T('kimlik', 'TC kimlik no'), LINES('Alınan ürünler (ayar, gram)')], body: 'Aşağıda belirtilen ürünler {{musteri}} tarafından kendi malı olarak satılmış, bedeli peşin ödenmiştir. Satıcı ürünlerin çalıntı veya rehinli olmadığını beyan eder.' },
      { id: 'emanet', label: 'Emanet / tamir teslim tutanağı', sign: ['Teslim alan', 'Müşteri'], fields: [LINES('Ürünler'), T('teslimTarih', 'Teslim tarihi', 'date')], body: 'Aşağıdaki ürünler tamir / emanet için teslim alınmıştır; {{teslimTarih}} tarihinde bu belge ile teslim edilecektir.' }] },
    site: { coll: 'flats', party: 'Daire', subject: true, kinds: [
      { id: 'teslim', label: 'Daire / anahtar teslim tutanağı', sign: ['Yönetim', 'Teslim alan'], fields: [T('kisi', 'Teslim alan (malik / kiracı)'), T('tel', 'Telefon'), LINES('Teslim edilenler (anahtar, kart, kumanda)')], body: 'Daire ve listelenen anahtar / kartlar {{tarih}} tarihinde {{kisi}} adlı kişiye teslim edilmiştir.' },
      { id: 'taahhut', label: 'Aidat ödeme taahhütnamesi', sign: ['Yönetim', 'Malik / kiracı'], fields: [T('kisi', 'Taahhüt eden'), T('borc', 'Toplam borç (₺)', 'number'), T('plan', 'Ödeme planı', 'textarea')], body: '{{kisi}}, dairesine ait {{borc}} ₺ birikmiş aidat borcunu aşağıdaki plana göre ödemeyi taahhüt eder. Taksitlerin aksaması halinde kalan borcun tamamı muaccel olur.' }] },
    randevu: { coll: 'customers', party: 'Danışan', kinds: [
      { id: 'onam', label: 'Uygulama onam formu', sign: ['Uzman', 'Danışan'], fields: [T('islem', 'Uygulama (lazer, cilt bakımı, boya…)'), T('alerji', 'Bilinen alerji / hassasiyet')], body: '"{{islem}}" uygulamasının içeriği, olası yan etkileri ve sonrası bakım önerileri hakkında bilgilendirildim. Belirttiğim alerjiler dışında bir sağlık sorunum yoktur; uygulamayı kendi isteğimle yaptırıyorum.' },
      { id: 'paket', label: 'Paket / seans sözleşmesi', sign: ['İşletme', 'Danışan'], fields: [T('paket', 'Paket'), T('seans', 'Seans sayısı', 'number'), T('ucret', 'Ücret (₺)', 'number'), T('gecerlilik', 'Son kullanım', 'date')], body: '{{musteri}}, {{seans}} seanslık "{{paket}}" paketini {{ucret}} ₺ bedelle satın almıştır. Seanslar {{gecerlilik}} tarihine kadar kullanılmalıdır. Randevuya 24 saat önceden haber verilmeden gelinmezse seans kullanılmış sayılır.' }] },
    crm: { coll: 'contacts', party: 'Müşteri', kinds: [
      { id: 'nda', label: 'Gizlilik sözleşmesi (NDA)', sign: ['Firma', 'Karşı taraf'], fields: [T('konu', 'Görüşme konusu'), T('sure', 'Gizlilik süresi (yıl)', 'number')], body: 'Taraflar, "{{konu}}" kapsamında paylaşılan tüm ticari ve teknik bilgileri {{sure}} yıl süreyle gizli tutmayı, üçüncü kişilerle paylaşmamayı kabul eder.' },
      { id: 'kabul', label: 'Hizmet kabul / teslim formu', sign: ['Firma', 'Müşteri'], fields: [T('proje', 'Proje / hizmet'), LINES('Teslim edilen işler')], body: '"{{proje}}" kapsamında aşağıdaki işler eksiksiz teslim edilmiş ve müşteri tarafından kabul edilmiştir.' }] },
    pos: { coll: 'customers', party: 'Müşteri', kinds: [
      { id: 'veresiye', label: 'Veresiye / cari hesap taahhüdü', sign: ['İşletme', 'Müşteri'], fields: [T('limit', 'Kredi limiti (₺)', 'number'), T('vade', 'Ödeme günü')], body: '{{musteri}}, işletmeden {{limit}} ₺ limite kadar veresiye alışveriş yapabilir; borcunu her ay {{vade}} ödemeyi taahhüt eder.' },
      { id: 'iade', label: 'İade / değişim formu', sign: ['İşletme', 'Müşteri'], fields: [LINES('İade edilen ürünler'), T('neden', 'İade nedeni')], body: 'Aşağıdaki ürünler "{{neden}}" nedeniyle iade alınmıştır.' }] },
    butik: { coll: 'customers', party: 'Müşteri', kinds: [{ id: 'iade', label: 'İade / değişim formu', sign: ['Mağaza', 'Müşteri'], fields: [LINES('Ürünler (beden, renk)'), T('neden', 'İade / değişim nedeni')], body: 'Aşağıdaki ürünler "{{neden}}" nedeniyle iade / değişim için teslim alınmıştır.' }, { id: 'terzi', label: 'Tadilat / terzi teslim fişi', sign: ['Mağaza', 'Müşteri'], fields: [LINES('Tadilat yapılacak ürünler'), T('teslimTarih', 'Teslim tarihi', 'date')], body: 'Ürünler tadilat için teslim alınmış olup {{teslimTarih}} tarihinde teslim edilecektir.' }] },
    eticaret: { coll: 'customers', party: 'Müşteri', kinds: [{ id: 'iade', label: 'İade teslim tutanağı', sign: ['Mağaza', 'Müşteri'], fields: [T('siparis', 'Sipariş no'), LINES('İade edilen ürünler'), T('neden', 'İade nedeni')], body: '{{siparis}} numaralı siparişe ait ürünler "{{neden}}" nedeniyle iade alınmıştır.' }] },
    toptan: { coll: 'customers', party: 'Bayi / müşteri', kinds: [{ id: 'teslim', label: 'Mal teslim tutanağı', sign: ['Teslim eden', 'Teslim alan'], fields: [T('irsaliye', 'İrsaliye no'), LINES('Teslim edilen ürünler')], body: '{{irsaliye}} numaralı irsaliyeye ait aşağıdaki ürünler sayılarak, hasarsız teslim alınmıştır.' }, { id: 'mutabakat', label: 'Cari mutabakat', sign: ['Firma', 'Müşteri'], fields: [T('donem', 'Dönem sonu', 'date'), T('bakiye', 'Bakiye (₺)', 'number')], body: '{{donem}} itibarıyla cari hesap bakiyemizin {{bakiye}} ₺ olduğunu mutabık olarak kabul ederiz.' }] },
    fabrika: { coll: 'customers', party: 'Müşteri', kinds: [{ id: 'teslim', label: 'Sevkiyat teslim tutanağı', sign: ['Sevk eden', 'Teslim alan'], fields: [T('irsaliye', 'İrsaliye no'), T('plaka', 'Araç plakası'), LINES('Ürünler / lotlar')], body: '{{irsaliye}} numaralı sevkiyat {{plaka}} plakalı araçla gönderilmiş, ürünler eksiksiz ve hasarsız teslim alınmıştır.' }] },
    muhasebe: { coll: 'accounts', party: 'Cari', kinds: [{ id: 'mutabakat', label: 'Cari mutabakat mektubu', sign: ['Firma', 'Cari'], fields: [T('donem', 'Dönem sonu', 'date'), T('bakiye', 'Bakiye (₺)', 'number'), T('yon', 'Bakiye yönü (borç / alacak)')], body: '{{donem}} tarihi itibarıyla kayıtlarımızda {{musteri}} hesabı {{bakiye}} ₺ {{yon}} bakiye vermektedir. Mutabık olduğunuzu imzanızla bildirmenizi rica ederiz.' }, { id: 'makbuz', label: 'Tahsilat makbuzu', sign: ['Tahsil eden', 'Ödeyen'], fields: [LINES('Tahsilatlar')], body: 'Aşağıdaki tutarlar {{tarih}} tarihinde tahsil edilmiştir.' }] },
    eczane: { coll: 'patients', party: 'Hasta', kinds: [{ id: 'teslim', label: 'İlaç teslim beyanı (hasta yakını)', sign: ['Eczacı', 'Teslim alan'], fields: [T('alan', 'Teslim alan kişi ve yakınlığı'), T('kimlik', 'Teslim alanın TC no'), LINES('İlaçlar')], body: '{{musteri}} adına yazılan aşağıdaki ilaçları hastanın bilgisi dahilinde teslim aldım.' }] },
    adisyon: { party: 'Personel', kinds: [{ id: 'kasa', label: 'Kasa devir tutanağı', sign: ['Devreden', 'Devralan'], fields: [T('devralan', 'Devralan personel'), T('nakit', 'Kasadaki nakit (₺)', 'number'), T('kart', 'Kart toplamı (₺)', 'number'), T('not', 'Not', 'textarea')], body: '{{tarih}} itibarıyla kasa {{nakit}} ₺ nakit ile devredilmiştir.' }, { id: 'zimmet', label: 'Kurye / personel zimmet tutanağı', sign: ['Teslim eden', 'Teslim alan'], fields: [LINES('Zimmet (motor, çanta, POS cihazı)')], body: 'Aşağıdaki malzemeler {{musteri}} adlı personele zimmetlenmiştir.' }] },
    kargo: { coll: 'couriers', party: 'Kurye', kinds: [{ id: 'zimmet', label: 'Kurye zimmet tutanağı', sign: ['Şube', 'Kurye'], fields: [LINES('Zimmet (araç, el terminali, çanta)')], body: 'Aşağıdaki malzemeler {{musteri}} adlı kuryeye zimmetlenmiştir.' }, { id: 'hasar', label: 'Hasarlı teslim tutanağı', sign: ['Kurye', 'Alıcı'], fields: [T('takip', 'Gönderi no'), T('alici', 'Alıcı'), T('hasar', 'Hasar açıklaması', 'textarea')], body: '{{takip}} numaralı gönderi alıcıya hasarlı olarak teslim edilmiş, durum taraflarca tespit edilmiştir.' }] },
    oto: { party: 'Müşteri', kinds: [{ id: 'teslim', label: 'Araç kabul / teslim tutanağı', sign: ['İşletme', 'Araç sahibi'], fields: [T('plaka', 'Plaka'), T('sahip', 'Araç sahibi'), DAMAGE], body: '{{plaka}} plakalı araç işaretlenen hasarlarla teslim alınmıştır; araçta bırakılan değerli eşyalardan işletme sorumlu değildir.' }] },
    bilet: { party: 'Katılımcı', kinds: [{ id: 'iade', label: 'Bilet iade formu', sign: ['Gişe', 'Katılımcı'], fields: [T('etkinlik', 'Etkinlik'), T('bilet', 'Bilet no'), T('tutar', 'İade tutarı (₺)', 'number')], body: '{{etkinlik}} etkinliğine ait {{bilet}} numaralı bilet iade alınmış, {{tutar}} ₺ iade edilmiştir.' }] },
  };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : null);
  const nameOf = (r) => (r ? r.name || r.fullName || r.title || [r.firstName, r.lastName].filter(Boolean).join(' ') || r.plate || r.no || '' : '');
  const phoneOf = (r) => (r ? r.phone || r.parentPhone || r.tel || '' : '');
  const fill = (s, v) => String(s || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (v[k] != null && v[k] !== '' ? String(v[k]) : '……'));
  const parseLines = (s) => String(s || '').split('\n').map((l) => l.split(';').map((x) => x.trim())).filter((a) => a[0]).map(([name, qty, total]) => ({ name, qty: qty || 1, total: Number(String(total || '').replace(/\./g, '').replace(',', '.')) || 0 }));

  function docOf(F, k, d) {
    const db = NS.app.db; const s = db.settings(); const p = F.coll && d.party ? db.get(F.coll, d.party) : null;
    const pname = d.partyName || nameOf(p); const vars = { ...d.v, musteri: pname, isletme: s.bizName || '', tarih: NS.date(d.at) };
    const info = k.fields.filter((f) => !['lines', 'damage', 'textarea'].includes(f.type) && d.v[f.name] !== undefined && d.v[f.name] !== '').map((f) => [f.label.replace(/ \(.*\)$/, ''), f.type === 'date' ? NS.date(d.v[f.name]) : f.type === 'number' && /₺/.test(f.label) ? money(Number(d.v[f.name])) : d.v[f.name]]);
    const lines = d.v.lines ? parseLines(d.v.lines) : [];
    const texts = k.fields.filter((f) => f.type === 'textarea' && d.v[f.name]).map((f) => `${f.label}: ${d.v[f.name]}`);
    return { title: k.label, no: d.no, date: d.at, info, party: { title: F.party, name: pname, lines: [d.partyPhone || phoneOf(p)] }, lines,
      totals: lines.some((l) => l.total) ? [['Toplam', lines.reduce((a, l) => a + l.total, 0), true]] : [], note: [fill(d.body || k.body, vars), ...texts].join('\n\n'),
      damage: d.v.damage ? { svg: NS.docs.carSvg(d.v.damage), marks: NS.docs.damageText(d.v.damage) } : null,
      signatures: [{ label: k.sign[0], name: d.staff || '', ...(d.staffSign || {}) }, { label: k.sign[1], ...(d.sign || {}) }] };
  }

  async function create(F, k, preset = {}) {
    const db = NS.app.db; const people = F.coll ? db.all(F.coll).slice(0, 500) : [];
    const fields = [
      ...(F.coll ? [{ name: 'party', label: F.party, type: 'select', full: true, empty: F.subject ? 'Seçin…' : 'Listede yok — aşağıya yazın', options: people.map((r) => ({ value: r.id, label: [nameOf(r), phoneOf(r)].filter(Boolean).join(' · ') })) }] : []),
      ...(!F.subject ? [{ name: 'partyName', label: `${F.party} adı (listede yoksa)` }, { name: 'partyPhone', label: 'Telefon', type: 'tel' }] : []),
      ...k.fields.filter((f) => f.type !== 'damage').map((f) => (f.type === 'lines' ? { name: 'lines', label: f.label, type: 'textarea', full: true, placeholder: 'Laptop Dell 5440 ; 1 ; 0' } : { name: f.name, label: f.label, type: f.type, full: f.type === 'textarea' })),
      { name: 'body', label: 'Belge metni (gerekirse düzenleyin)', type: 'textarea', full: true },
    ];
    const v = await NS.formModal({ title: k.label, fields, values: { body: k.body, ...preset } }); if (!v) return null;
    if (F.coll && F.subject && !v.party) return NS.toast(`${F.party} seçin`, 'err'), null;
    if (!F.subject && !v.party && !v.partyName) return NS.toast(`${F.party} seçin veya adını yazın`, 'err'), null;
    const d = { id: NS.uid(), kind: k.id, at: new Date().toISOString(), no: db.nextNo ? db.nextNo('signedDocs', 'BLG') : 'BLG' + Date.now().toString().slice(-6), party: v.party || null, partyName: v.partyName || '', partyPhone: v.partyPhone || '', body: v.body, staff: (NS.currentUser || {}).name || '', v: {} };
    k.fields.forEach((f) => { if (f.type !== 'damage') d.v[f.name] = v[f.name]; });
    if (k.fields.some((f) => f.type === 'damage')) { const mk = await NS.docs.damageModal([], 'Hasar krokisi'); if (mk) d.v.damage = mk; }
    const who = d.partyName || nameOf(F.coll ? db.get(F.coll, d.party) : null) || '';
    const sg = await NS.sign({ title: `${k.label} — ${k.sign[1]} imzası`, label: `${k.sign[1]} adı soyadı`, name: F.subject ? (v.alici || v.kisi || v.sahip || '') : who, text: esc(fill(d.body, { ...d.v, musteri: who, isletme: (db.settings().bizName || ''), tarih: NS.date(d.at) })).slice(0, 900) });
    if (sg) d.sign = sg;
    (db.data.signedDocs = db.data.signedDocs || []).unshift(d); db.save();
    NS.docs.print('imza-' + k.id, docOf(F, k, d)); NS.toast(`${k.label} kaydedildi${sg ? ' ve imzalandı' : ''}`, 'ok');
    return d;
  }

  function page(el) {
    const F = FORMS[appId()]; const db = NS.app.db;
    const draw = () => {
      const L = db.data.signedDocs || []; const K = Object.fromEntries(F.kinds.map((k) => [k.id, k]));
      el.innerHTML = NS.pageHead('İmzalı belgeler', 'Sözleşme, onam, tutanak ve makbuzlar — karşı tarafa ekranda imzalatın, işletmenizin şablonuyla yazdırın', `<a class="btn" href="#/belgeler">${icon('print')} Şablonları tasarla</a>`) + `
        <div class="nv-forms">${F.kinds.map((k) => `<button class="nv-form-k" data-new="${k.id}"><span>${icon('edit', 'ico-lg')}</span><b>${esc(k.label)}</b><small>${esc(k.sign.join(' · '))} imzalı</small></button>`).join('')}</div>
        <div class="card mt"><div class="card-h"><h3>Arşiv</h3><span class="small faint">${L.length} belge</span></div>${NS.table({ rows: L, empty: 'Henüz belge yok — yukarıdan bir tür seçin', emptyIcon: 'file', columns: [{ label: 'No', render: (d) => `<span class="mono">${esc(d.no)}</span>` }, { label: 'Belge', render: (d) => `<b>${esc((K[d.kind] || {}).label || d.kind)}</b>` }, { label: F.party, render: (d) => esc(d.partyName || nameOf(F.coll ? db.get(F.coll, d.party) : null) || '-') }, { label: 'Tarih', render: (d) => NS.dt(d.at) }, { label: 'İmza', render: (d) => (d.sign ? NS.badge('İmzalı', 'ok') : NS.badge('İmzasız', 'warn')) }], actions: [{ icon: 'print', act: 'pr', title: 'Yazdır' }, { icon: 'edit', act: 'sg', title: 'İmzalat', show: (d) => !d.sign }, { icon: 'trash', act: 'rm' }] })}</div>`;
    };
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-new],[data-act]'); if (!b) return;
      if (b.dataset.new) { if (await create(F, F.kinds.find((k) => k.id === b.dataset.new))) draw(); return; }
      const d = (db.data.signedDocs || []).find((x) => x.id === b.dataset.id); if (!d) return; const k = F.kinds.find((x) => x.id === d.kind);
      if (b.dataset.act === 'pr' && k) NS.docs.print('imza-' + k.id, docOf(F, k, d));
      if (b.dataset.act === 'sg' && k) { const s = await NS.sign({ title: `${k.label} — imza`, label: `${k.sign[1]} adı soyadı`, name: d.partyName || nameOf(F.coll ? db.get(F.coll, d.party) : null) }); if (s) { d.sign = s; db.save(); draw(); } }
      if (b.dataset.act === 'rm' && (await NS.confirm('Belge arşivden silinsin mi?'))) { db.data.signedDocs = db.data.signedDocs.filter((x) => x.id !== d.id); db.save(); draw(); }
    });
    draw();
  }

  // Belge türlerini şablon tasarımcısına tanıt ve programa "İmzalı belgeler" sayfası ekle
  Object.entries(FORMS).forEach(([app, F]) => F.kinds.forEach((k) => NS.docs.define(app, 'imza-' + k.id, { label: k.label, sample: () => docOf(F, k, { no: 'BLG0001', at: new Date().toISOString(), partyName: 'Örnek Kişi', partyPhone: '0532 000 00 00', staff: 'Yetkili', v: Object.fromEntries(k.fields.map((f) => [f.name, f.type === 'lines' ? 'Örnek kalem ; 1 ; 1500' : f.type === 'number' ? 1500 : f.type === 'date' ? new Date().toISOString().slice(0, 10) : f.type === 'damage' ? [] : 'Örnek']) ) }) })));
  const origShell = NS.shell;
  NS.shell = function (opts) {
    if (opts && FORMS[opts.id] && !opts.routes.imzali) {
      opts.routes.imzali = (el) => page(el);
      const k = opts.nav.findIndex((n) => n.id === 'belgeler' || n.id === 'ayarlar');
      const item = { id: 'imzali', label: 'İmzalı belgeler', icon: 'edit' };
      if (k >= 0) opts.nav.splice(k, 0, item); else opts.nav.push(item);
    }
    return origShell.call(this, opts);
  };
  NS.forms = { FORMS, create, page, docOf };
})();
