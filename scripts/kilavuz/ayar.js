// Kılavuz üreticisinin tek ayar dosyası. Logo kesinleşince yalnız LOGO satırı değişir, sonra kılavuzlar yeniden üretilir.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
module.exports = {
  LOGO: path.join(ROOT, 'assets', 'nebsoft-logo.webp'),
  // Ekran: 1200 px genişlik A4 metin alanına sığar; ölçek keskinlik, kalite dosya boyutu içindir
  EKRAN: { en: 1200, boy: 760, olcek: 1.5, kalite: 68 },
  CIKTI: path.join(ROOT, 'indir', 'kilavuz'), // derleme çıktısı, depoya girmez (CLAUDE.md §4)
  ADRES: '/indir/kilavuz/', // herkese açık adres
  LISTE: path.join(ROOT, 'core', 'kilavuz.json'), // hangi programın kılavuzu var: site ve program buna bakar
  KAYNAK: path.join(ROOT, 'docs', 'kilavuz'), // program başına içerik dosyası: <id>.js
  SINIR_MB: 15,
  RENK: { isaret: '#e11d48', yazi: '#ffffff' },
};
