// Sanal POS canlı kilidi. Gerçek para çektiği için canlı işlem sunucu ortam değişkeni açılmadan yapılmaz.
// iyzico panelden süper yönetici (settings.canli_kilit) veya IYZICO_CANLI=1 ile açılır, diğerleri PAYTR_CANLI=1, PAPARA_CANLI=1 ... ile. Bağlantıyı dene zararsızdır, kilide takılmaz.
const { SaglayiciHata } = require('./ortak');
const isletim = require('../isletim');
const canliAcik = (ad) => (ad === 'IYZICO' ? isletim.iyzicoCanli() : process.env[`${ad}_CANLI`] === '1');
function kilit(ad, gorunen, test) { if (!test && !canliAcik(ad)) throw new SaglayiciHata(`${gorunen} canlı ödeme bu sunucuda kapalı. Test modunu kullanın.`, { kod: 'kilit' }); }
module.exports = { kilit, canliAcik };
