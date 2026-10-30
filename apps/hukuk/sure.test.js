/* Hukuk — usul süresi hesabı testi: node apps/hukuk/sure.test.js
   Beklenen değerler mevzuat metninden elle hesaplandı (HMK 92-93, 102-104; İİK 19; CMK 39, 331/4; İYUK 7-8). docs/urun/HUKUK.md §1 */
'use strict';
global.window = global;
require('./data.js');
const H = window.HKK; let fail = 0, n = 0;
const t = (served, id, want, opt, note) => { n++; const r = H.due(served, H.rule(id), opt || {}); if (r.date !== want) { fail++; console.error(`HATA ${note}: ${served} ${id} → ${r.date}, beklenen ${want}\n  ${r.steps.join('\n  ')}`); } };
const B26 = { holidays: ['2026-03-20', '2026-03-21', '2026-03-22', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'] }; // deneme için girilen bayram günleri

t('2026-07-10', 'hmk345', '2026-09-07', {}, 'HMK 104: adli tatile rastlayan istinaf 31 Ağu + 1 hafta');
t('2026-07-10', 'cmk273', '2026-09-03', {}, 'CMK 331/4: ceza süresi 31 Ağu + 3 gün');
t('2026-07-15', 'iyuk7v', '2026-09-07', {}, 'İYUK 8/3: vergi davası 30 gün, ara vermeye rastlar → +7 gün');
t('2026-07-10', 'iik62', '2026-07-17', {}, 'İİK: adli tatil yok');
t('2026-07-10', 'hmk345', '2026-07-24', { urgent: true }, 'HMK 103: adli tatilde görülen iş → uzama yok');
t('2025-07-10', 'hmk345', '2025-09-08', {}, 'HMK 104 + HMK 93: 7 Eylül 2025 Pazar → 8 Eylül');
t('2026-10-15', 'hmk345', '2026-10-30', {}, 'HMK 93: son gün 29 Ekim → 30 Ekim');
t('2026-12-18', 'hmk127', '2027-01-04', {}, '1 Ocak tatil + hafta sonu → 4 Ocak');
t('2026-01-31', 'iik68', '2026-07-31', {}, 'İİK 19: 6 ay, karşılık gelen gün');
t('2026-08-31', 'iik68', '2027-03-01', {}, 'İİK 19: 28 Şubat 2027 Pazar → 1 Mart');
t('2024-02-29', 'iik67', '2025-02-28', {}, 'İİK 19: karşılık gelen gün yoksa ayın son günü');
t('2026-05-13', 'hmk345', '2026-05-27', {}, 'Bayram girilmemişse kaydırılmaz (uyarı verilir)');
t('2026-05-13', 'hmk345', '2026-06-01', B26, 'Girilen Kurban Bayramı + hafta sonu → 1 Haziran');
t('2026-03-01', 'iyuk7i', '2026-04-30', {}, 'İYUK 7: 60 gün');
t('2026-10-20', 'hakim', '2026-11-03', { n: 2, u: 'h' }, 'Hâkimin verdiği 2 hafta');
// Uyarılar
const w1 = H.due('2026-05-13', H.rule('hmk345'), {}); if (!w1.warn.some((x) => /bayram/.test(x))) { fail++; console.error('HATA: bayram girilmemiş uyarısı yok'); } n++;
const w2 = H.due('2026-10-14', H.rule('hmk345'), B26); if (!w2.warn.some((x) => /yarım gün/.test(x))) { fail++; console.error('HATA: 28 Ekim yarım gün uyarısı yok'); } n++;
const w3 = H.due('2026-07-10', H.rule('hakim'), { n: 14, u: 'g', ...B26 }); if (!w3.warn.some((x) => /Hâkimin/.test(x))) { fail++; console.error('HATA: hâkim süresi adli tatil uyarısı yok'); } n++;
console.log(fail ? `Hukuk süre testi: ${fail}/${n} HATA` : `Hukuk süre testi: ${n}/${n} geçti`);
process.exit(fail ? 1 : 0);
