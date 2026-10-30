/* Ticaret ve hesap araçlarının resmî kaynakları. "tarih" okunduğu gündür; oran değişince önce burası ve ilgili araç güncellenir. */
const T = '2026-10-31';
const VUK = 'https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.htm';
module.exports = {
  GUNCELLEME_T: T,
  VUK_AMORTISMAN: { ad: '213 sayılı Vergi Usul Kanunu, madde 313, 315, mükerrer 315, 320 ve mükerrer 320', url: VUK, tarih: T, not: 'normal ve azalan bakiye usulü, süre, binek otomobilde ilk yıl, usul değişikliği' },
  GVK_BINEK: { ad: '193 sayılı Gelir Vergisi Kanunu, madde 40/7', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.4.193.htm', tarih: T, not: 'binek otomobil amortismanının gider yazılabilecek kısmı' },
  GIB_OMUR: { ad: 'Gelir İdaresi Başkanlığı, amortisman oranları tablosu', url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fyardim-kaynaklar%2Fyararli-bilgiler%2FAmortismanOranlariTablosu.pdf', tarih: T, not: 'faydalı ömür listesi; sonraki tebliğlerle değişmiş olabilir, araç ömrü sizden alır' },
  SGK_81: { ad: '5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu, madde 81 ve 82', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm', tarih: T, not: 'işveren hissesi oranları, Hazine indirimi, prime esas kazanç sınırları' },
  CSGB_ASGARI: { ad: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Asgari Ücretin Net Hesabı ve İşverene Maliyeti 2026', url: 'https://www.csgb.gov.tr/Media/gm2fekds/asgari-%C3%BCcret-2026.pdf', tarih: T, not: '01.01.2026 - 31.12.2026 için %21,75, %19,75, %16,75 işveren payı ve %2 işsizlik primi' },
  SGK_PEK: { ad: 'Sosyal Güvenlik Kurumu, Prime Esas Kazanç Miktarları', url: 'https://www.sgk.gov.tr/Content/Post/2e0c9e1a-2cfe-4456-af10-49d3de0c58ba/Prime-Esas-Kazanc-Miktarlari-2026-01-14-10-35-39', tarih: T, not: '2026 özel sektör aylık alt sınır 33.030,00 ₺, üst sınır 297.270,00 ₺' },
};
