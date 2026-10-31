// Panelden yönetilen çalışma ayarları (settings: 'isletim', 'canli_kilit'). Bellekte tutulur, kayıtta ve eşitlemede güncellenir; tek süreç kuralı DEPLOY.md §5.
// Ortam değişkeni verilmişse o geçerlidir: mevcut kurulum değişmez, panel ortamı aşamaz.
let I = {}; let K = {};
const ata = (isletim, kilit) => { I = isletim && typeof isletim === 'object' ? isletim : {}; K = kilit && typeof kilit === 'object' ? kilit : {}; };
const iyzicoOrtam = () => process.env.IYZICO_CANLI === '1';
const iyzicoPanel = () => !!(K.iyzico && K.iyzico.acik === true);
const iyzicoCanli = () => iyzicoOrtam() || iyzicoPanel();
const kotaMb = () => Number(process.env.NEBSOFT_DOSYA_KOTA_MB) || Number(I.dosyaKotaMb) || 2048;
const odemeMs = () => Number(process.env.ETICARET_ODEME_TTL_MS) || (Number(I.odemeDk) || 30) * 60e3;
module.exports = { ata, iyzicoOrtam, iyzicoPanel, iyzicoCanli, kotaMb, odemeMs };
