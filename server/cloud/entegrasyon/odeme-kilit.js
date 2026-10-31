// Sanal POS canlı kilidi. Gerçek para çektiği için canlı işlem sunucu ortam değişkeni açılmadan yapılmaz.
// iyzico'nun IYZICO_CANLI kilidiyle aynı kural: PAYTR_CANLI=1, PAPARA_CANLI=1 ... Bağlantıyı dene zararsızdır, kilide takılmaz.
const { SaglayiciHata } = require('./ortak');
const canliAcik = (ad) => process.env[`${ad}_CANLI`] === '1';
function kilit(ad, gorunen, test) { if (!test && !canliAcik(ad)) throw new SaglayiciHata(`${gorunen} canlı ödeme bu sunucuda kapalı. Test modunu kullanın.`, { kod: 'kilit' }); }
module.exports = { kilit, canliAcik };
