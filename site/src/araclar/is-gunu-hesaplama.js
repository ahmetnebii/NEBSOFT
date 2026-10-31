const T = '2026-10-31';
module.exports = {
  slug: 'is-gunu-hesaplama', kategori: 'belge', sira: 23, renk: '#b45309', guncelleme: T, mevzuat: true, ilgili: ['yillik-izin-hesaplama', 'fazla-mesai-hesaplama', 'teklif-olusturucu'],
  ad: 'İş Günü Hesaplama', kisa: 'Tarihe iş günü ekleyin veya iki tarih arasını resmî tatilleri düşerek sayın',
  baslik: 'İş Günü Hesaplama — Resmî Tatilleri Düşerek Tarih Bulma | NEBSOFT',
  ozet: 'Bir tarihe iş günü ekleyin, geriye sayın veya iki tarih arasındaki iş gününü bulun. Hafta sonu, resmî tatil ve yarım günler 2026-2028 takvimine göre düşülür.',
  sonucBaslik: 'Sonuç', aciklamaBaslik: 'İş günü nasıl sayılır?',
  program: { slug: 'teknikservisprogrami', metin: 'Teslim tarihi verdiğiniz işleri tek tek takip etmek yerine Teknik Servis programında kayıt, durum ve müşteri bilgilendirmesini bir arada yürütebilirsiniz.' },
  kaynaklar: [
    { ad: '2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun, madde 1 ve 2', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2429.htm', tarih: T, not: 'genel tatil günleri, 28 Ekim ve arefe günü saat 13.00' },
    { ad: 'Diyanet İşleri Başkanlığı, 2026 dinî günler', url: 'https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=2026', tarih: T, not: 'Ramazan Bayramı 20 Mart, Kurban Bayramı 27 Mayıs' },
    { ad: 'Diyanet İşleri Başkanlığı, 2027 dinî günler', url: 'https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154', tarih: T, not: 'Ramazan Bayramı 9 Mart, Kurban Bayramı 16 Mayıs' },
    { ad: 'Diyanet İşleri Başkanlığı, 2028 dinî günler', url: 'https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=185', tarih: T, not: 'Ramazan Bayramı 26 Şubat, Kurban Bayramı 5 Mayıs' },
  ],
  alanlar: [
    { ad: 'mod', etiket: 'Ne hesaplanacak?', tip: 'secim', deger: 'ileri', genis: true, secenekler: [['ileri', 'Tarihe iş günü ekle: teslim tarihi'], ['geri', 'Tarihten iş günü çıkar: en geç başlama'], ['fark', 'İki tarih arasındaki iş günü']] },
    { ad: 'bas', etiket: 'Başlangıç tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'bit', etiket: 'Bitiş tarihi', tip: 'tarih', bugun: true, goster: 'mod=fark' },
    { ad: 'gun', etiket: 'İş günü sayısı', tip: 'sayi', deger: '10', goster: 'mod=ileri|geri' },
    { ad: 'hafta', etiket: 'Çalışma düzeni', tip: 'secim', deger: 'cts', secenekler: [['cts', 'Pazartesi - Cuma'], ['cmt', 'Pazartesi - Cumartesi']] },
    { ad: 'yarim', etiket: 'Arife ve 28 Ekim', tip: 'secim', deger: 'yarim', secenekler: [['yarim', 'Yarım gün say'], ['tam', 'Tam iş günü say']] },
    { ad: 'basDahil', etiket: 'Başlangıç günü de sayılsın', tip: 'onay', deger: true, goster: 'mod=fark' },
  ],
  hesap: function (v, H) {
    const o = { hafta: v.hafta, yarim: v.yarim }; const tat = (l) => (l.length ? `<h3 style="margin:16px 0 6px;font-size:15px">Düşülen resmî günler</h3><div class="ar-tablo-k"><table class="ar-liste-t"><tbody>${l.map((x) => `<tr><td style="white-space:nowrap">${H.tarihTR(x.tarih)}</td><td>${H.esc(x.ad)}${x.yarim ? ' (13.00 sonrası)' : ''}</td></tr>`).join('')}</tbody></table></div>` : H.not('Bu aralıkta hafta içine denk gelen resmî tatil yok.'));
    if (v.mod === 'fark') { if (!v.bit) throw new Error('Bitiş tarihi seçin'); const r = H.isGunuFark({ bas: v.bas, bit: v.bit, basDahil: v.basDahil, ...o }); return `${H.tablo([['İş günü', H.sayi(r.isGunu, 1), 1], ['Takvim günü', H.sayi(r.takvim)], ['Hafta tatili', H.sayi(r.haftaSonu)], ['Resmî tatil', H.sayi(r.tatilGun)], r.yarimGun ? ['Yarım gün', H.sayi(r.yarimGun)] : null])}${tat(r.tatiller)}`; }
    if (v.gun === undefined) throw new Error('İş günü sayısını yazın'); const r = H.isGunuEkle({ bas: v.bas, gun: v.gun, yon: v.mod === 'geri' ? -1 : 1, ...o });
    return `${H.tablo([[v.mod === 'geri' ? 'En geç başlama' : 'Teslim tarihi', H.tarihTR(r.tarih), 1], ['Gün', H.gunAdi(r.tarih)], ['Takvim günü farkı', H.sayi(r.takvim)]])}${tat(r.tatiller)}`;
  },
  aciklama: [
    'Müşteriye “10 iş günü içinde teslim” demek kolaydır, ama araya bayram girince doğru tarihi bulmak için takvim açmak gerekir. Bu araç üç soruyu yanıtlar: bir tarihten belirli iş günü sonrası hangi güne düşer, işe en geç ne zaman başlanmalıdır ve iki tarih arasında kaç iş günü vardır. Hesapta hafta tatili atılır, 2429 sayılı Kanun\'daki genel tatiller düşülür. Sonuçta hangi resmî günlerin çıkarıldığı listelenir, böylece hesabı kendiniz de izleyebilirsiniz.',
    'Takvimde 1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim ile Ramazan ve Kurban bayramları vardır. Kanuna göre 28 Ekim ve arefe günleri saat 13.00\'te tatile başlar, bu yüzden varsayılan olarak yarım iş günü sayılır. O günü tam çalışıyorsanız ayarı değiştirin. Dinî bayram tarihleri Ay takvimine bağlı olduğu için her yıl değişir ve Diyanet yıl tablolarından alınmıştır. Tablosu okunmamış bir yıl için tarih tahmin edilmez, araç açıkça uyarır: şu an 2026, 2027 ve 2028 yılları yüklüdür.',
    'Kendi işletmenizin takvimi farklı olabilir. Araç yalnız kanunda sayılan günleri bilir; yönetimin ayrıca ilan ettiği idari izinleri, köprü günlerini, yıllık kapanışınızı ve vardiya düzeninizi hesaba katmaz. Cumartesi çalışılan düzende Kanun\'un 2. maddesindeki, Cuma akşamı biten tatilden sonraki Cumartesiye ilişkin hüküm uygulanmaz; böyle bir hafta varsa sonucu elle kontrol edin. Dava, itiraz, tebligat ve vergi süreleri kendi kurallarına göre işler. Hak kaybı doğurabilecek bir süre için bu aracın sonucuna güvenmeyin, uzmanına danışın.',
  ],
  ornek: { baslik: 'Kullanım örneği: bayrama denk gelen teslim tarihi', metin: [
    'Bir matbaa, 2 Kasım 2026 Pazartesi günü aldığı işe 10 iş günü süre veriyor. Araya resmî tatil girmediği için teslim 16 Kasım 2026 Pazartesi günü olur, takvimde 14 gün eder. Aynı iş 26 Ekim 2026 Pazartesi başlasaydı 28 Ekim yarım gün, 29 Ekim tam tatil sayılacağı için teslim 9 Kasım yerine 11 Kasım Çarşamba gününe kayardı.',
    'Fark kipinde 26 Ekim ile 30 Ekim 2026 arasına bakıldığında takvimde 5 gün görünür, iş günü ise 3,5 çıkar. İşletme 28 Ekim\'de tam gün çalışıyorsa ayarı değiştirir, sonuç 4 olur. Ramazan Bayramı\'na denk gelen 2027 Mart ayında aynı fark çok daha büyüktür, çünkü arife ve üç gün birlikte düşer.',
  ] },
  sss: [
    ['Cumartesi iş günü sayılır mı?', 'İşletmenin düzenine bağlıdır. Çalışma düzeni seçeneğinden Pazartesi - Cumartesi işaretlenirse yalnız Pazar hafta tatili sayılır.'],
    ['Başlangıç günü hesaba katılıyor mu?', 'Tarihe ekleme ve çıkarmada başlangıç günü sayılmaz. İki tarih arası kipinde seçenekle belirlenir, bitiş günü her zaman sayılır.'],
    ['Hafta sonuna gelen bayram ayrıca düşülür mü?', 'Hayır. O gün zaten çalışılmadığı için iki kez düşülmez. Pazar gününe gelen tatil bir sonraki güne de taşınmaz.'],
    ['Köprü izni hesaba katılıyor mu?', 'Hayır. İdari izinler yıl içinde ayrı kararla ilan edilir ve özel işyerlerini kapsamayabilir. Bu günler için sonucu kendiniz düzeltin.'],
    ['Neden 2029 tarihi seçemiyorum?', 'O yılın bayram tarihleri henüz bu araca yüklenmedi. Tahmini tarih kullanmak yerine araç hata mesajı verir.'],
  ],
};
