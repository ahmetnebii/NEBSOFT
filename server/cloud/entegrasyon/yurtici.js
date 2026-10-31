// Yurtiçi Kargo web servis istemcisi. WSDL açıktır, iş kuralı ve kod tabloları dokümanı bulunamadı.
// Kaynak (okundu 31.10.2026, WSDL'de sürüm yok): http://webservices.yurticikargo.com:8080/KOPSWebServices/ShippingOrderDispatcherServices?wsdl
// DİKKAT: WSDL'deki uç nokta düz http ve 8080 portudur, https adresi yayımlanmamıştır: kullanıcı adı ve şifre şifresiz gider. Raporun engelleyenler bölümünde yazılı.
// Zararsız deneme: queryShipment, kullanıcının verdiği gerçek gönderi numarasıyla. Başarı yalnız o numaranın kaydı dönerse yazılır. keyType anlamı WSDL'de yok: 0 ilk gerçek hesapta bakılacak.
const { SaglayiciHata, adres, istek, durumHata, xml, soapZarf, etiket, hataMetni } = require('./ortak');
const AD = 'Yurtiçi Kargo'; const NS_ = 'http://yurticikargo.com.tr/ShippingOrderDispatcherServices';
const url = () => adres('yurtici', 'http://webservices.yurticikargo.com:8080') + '/KOPSWebServices/ShippingOrderDispatcherServices';
const cagir = async (ad, ic) => { const r = await istek(AD, url(), { yontem: 'POST', baslik: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' }, govde: soapZarf(`<ship:${ad} xmlns:ship="${NS_}">${ic}</ship:${ad}>`) }); const f = hataMetni(r.metin); if (f) throw new SaglayiciHata(`Yurtiçi Kargo: ${f.slice(0, 200)}`, { kod: /şifre|sifre|password|kullan|user/i.test(f) ? 'yetki' : 'saglayici' }); if (!r.ok) throw durumHata(AD, r); return r.metin; };
const kim = (k, dil) => `<wsUserName>${xml(k.user)}</wsUserName><wsPassword>${xml(k.pass)}</wsPassword><${dil}>TR</${dil}>`;
async function takip(k, v) {
  const no = String(v.tracking || ''); if (!no) throw new SaglayiciHata('Gönderi numarası gerekli', { kod: 'bicim' });
  const m = await cagir('queryShipment', `${kim(k, 'wsLanguage')}<keys>${xml(no)}</keys><keyType>0</keyType><addHistoricalData>false</addHistoricalData><onlyTracking>true</onlyTracking>`);
  const c = etiket(m, 'errCode'); const e = etiket(m, 'errMessage'); if (c && c !== '0') throw new SaglayiciHata(`Yurtiçi Kargo: ${String(e || c).slice(0, 200)}`);
  if (etiket(m, 'cargoKey') !== no) throw new SaglayiciHata('Bu numarayla gönderi kaydı dönmedi', { kod: 'bulunamadi' }); return { tracking: no, durum: etiket(m, 'operationMessage'), url: etiket(m, 'trackingUrl') };
}
async function dene(k) { await takip(k, { tracking: k.denemeNo }); return { mesaj: 'Yurtiçi Kargo hesabı doğrulandı: gönderi kaydı okundu.' }; }
async function olustur(k, v) {
  const a = v.receiver || {}; const no = String(v.ref || v.tracking || ''); if (!no) throw new SaglayiciHata('Kargo anahtarı gerekli', { kod: 'bicim' });
  const m = await cagir('createShipment', `${kim(k, 'userLanguage')}<ShippingOrderVO><cargoKey>${xml(no)}</cargoKey><invoiceKey>${xml(no)}</invoiceKey><receiverCustName>${xml(a.name)}</receiverCustName><receiverAddress>${xml(a.address)}</receiverAddress><cityName>${xml(a.city)}</cityName><townName>${xml(a.district)}</townName><receiverPhone1>${xml(a.phone)}</receiverPhone1><cargoCount>${Number(v.pieces) || 1}</cargoCount></ShippingOrderVO>`);
  const c = etiket(m, 'errCode'); if (c && c !== '0') throw new SaglayiciHata(`Yurtiçi Kargo: ${String(etiket(m, 'errMessage') || c).slice(0, 200)}`); return { tracking: no, ref: etiket(m, 'jobId') };
}
async function iptal(k, v) { const m = await cagir('cancelShipment', `${kim(k, 'userLanguage')}<cargoKeys>${xml(v.tracking)}</cargoKeys>`); const c = etiket(m, 'errCode'); if (c && c !== '0') throw new SaglayiciHata(`Yurtiçi Kargo: ${String(etiket(m, 'errMessage') || c).slice(0, 200)}`); return { ref: String(v.tracking) }; }
module.exports = { ad: AD, anahtarlar: ['kargofirma:yurtici'], kaynak: ['http://webservices.yurticikargo.com:8080/KOPSWebServices/ShippingOrderDispatcherServices?wsdl'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Web servis kullanıcı adı', zorunlu: true }, pass: { ad: 'Web servis şifresi', zorunlu: true, gizli: true, kirp: false }, denemeNo: { ad: 'Deneme için gönderi numarası', zorunlu: true, parmakDisi: true } },
  dene, islemler: { 'durum-sorgu': takip, 'gonderi-olustur': olustur, iptal } };
