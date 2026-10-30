/* Araç sayfalarında geçen resmî kaynaklar. Oran değiştiğinde önce burası ve ilgili araç güncellenir, "tarih" okunduğu gündür. */
const T = '2026-10-30';
module.exports = {
  GUNCELLEME: T,
  KMK: { ad: '634 sayılı Kat Mülkiyeti Kanunu, madde 20', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.634.htm', tarih: T, not: 'gider paylaşımı ve aylık yüzde beş gecikme tazminatı' },
  TBK: { ad: '6098 sayılı Türk Borçlar Kanunu, madde 344', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.htm', tarih: T, not: 'kira bedelinin belirlenmesi' },
  IS: (m, not) => ({ ad: `4857 sayılı İş Kanunu, ${m}`, url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm', tarih: T, not }),
  K1475: { ad: '1475 sayılı İş Kanunu, madde 14', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.1475.htm', tarih: T, not: 'yürürlükteki tek maddesi: kıdem tazminatı' },
  GVK: { ad: '193 sayılı Gelir Vergisi Kanunu, madde 25/7', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.4.193.htm', tarih: T, not: 'kıdem tazminatı istisnası' },
  DAMGA: { ad: '488 sayılı Damga Vergisi Kanunu, (1) sayılı tablo IV-1-b', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.488.htm', tarih: T, not: 'ücret makbuzlarında binde 7,59' },
  TAVAN: { ad: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Ücret ve Sendikal İstatistikler E-Bülteni, Eylül 2026', url: 'https://csgb.gov.tr/yayinlar/calisma-hayati-istatistikleri-e-bulteni/eylul-2026/ucret-ve-sendikal-istatistikler.html', tarih: T, not: 'kıdem tazminatı tavanı tablosu' },
  GIB_KDV: { ad: 'Gelir İdaresi Başkanlığı, Güncel KDV Oranları (2007/13033 sayılı Karar, 7346 sayılı Kararla değişik)', url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fyardim-kaynaklar%2Fyararli-bilgiler%2Fkdv-oranlari.pdf', tarih: T, not: 'yüzde 1, 10 ve 20 oranları' },
  KOD: { ad: 'Gelir İdaresi Başkanlığı, UBL-TR Kod Listeleri V 1.43 (27.07.2026)', url: 'https://ebelge.gib.gov.tr/dosyalar/kilavuzlar/UBLTR_1.2.1_Kilavuzlar.zip', tarih: '2026-10-28', not: 'tevkifat işlem kodları ve oranları' },
  TEBLIG: { ad: 'Katma Değer Vergisi Genel Uygulama Tebliği, bölüm I/C-2.1.3', url: 'https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=9&MevzuatNo=19631&MevzuatTertip=5', tarih: T, not: 'kısmi tevkifat kapsamı' },
  EIMZA: { ad: '5070 sayılı Elektronik İmza Kanunu, madde 3, 4 ve 5', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5070.htm', tarih: T, not: 'güvenli elektronik imzanın koşulları, hukuki sonucu ve kapsam dışı işlemler' },
  TUIK: { ad: 'Türkiye İstatistik Kurumu, Veri Portalı', url: 'https://veriportali.tuik.gov.tr/tr', tarih: T, not: 'TÜFE on iki aylık ortalamalara göre değişim oranı buradan alınır' },
};
