// PTT Kargo web servis istemcisi: takip. WSDL açıktır, gönderi kodları (gonderiTip, gonderiTur, ekhizmet) dokümanda yok, gönderi oluşturma yazılmadı.
// Kaynak (okundu 31.10.2026, WSDL'de sürüm yok): https://pttws.ptt.gov.tr/GonderiTakipV2/services/Sorgu?wsdl, test GonderiTakipV2Test
// Zararsız deneme: gonderiSorgu2, kullanıcının verdiği gerçek barkodla. Başarı yanıttaki BARNO istenen barkodla aynıysa yazılır. WSDL adresi http yazar, WSDL https'ten de açılır: istek https ile gider.
const { SaglayiciHata, adres, istek, durumHata, xml, soapZarf, etiket, hataMetni } = require('./ortak');
const AD = 'PTT Kargo'; const NS_ = 'http://takip.ptt.gov.tr'; const X = 'http://takip.ptt.gov.tr/xsd';
const url = (k) => adres(k.test ? 'ptt-test' : 'ptt', 'https://pttws.ptt.gov.tr') + (k.test ? '/GonderiTakipV2Test/services/Sorgu' : '/GonderiTakipV2/services/Sorgu');
async function takip(k, v) {
  const no = String(v.tracking || ''); if (!no) throw new SaglayiciHata('Barkod gerekli', { kod: 'bicim' });
  const r = await istek(AD, url(k), { yontem: 'POST', baslik: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '"urn:gonderiSorgu2"' }, govde: soapZarf(`<t:gonderiSorgu2 xmlns:t="${NS_}" xmlns:x="${X}"><t:input><x:barkod>${xml(no)}</x:barkod><x:kullanici>${xml(k.user)}</x:kullanici><x:sifre>${xml(k.pass)}</x:sifre></t:input></t:gonderiSorgu2>`) });
  const f = hataMetni(r.metin); if (f) throw new SaglayiciHata(`PTT Kargo: ${f.slice(0, 200)}`); if (!r.ok) throw durumHata(AD, r);
  if (etiket(r.metin, 'BARNO') !== no) throw new SaglayiciHata(`PTT Kargo: ${String(etiket(r.metin, 'sonucAciklama') || 'bu barkodla kayıt dönmedi').slice(0, 200)}`, { kod: 'bulunamadi' }); return { tracking: no, durum: etiket(r.metin, 'sonucAciklama') };
}
async function dene(k) { await takip(k, { tracking: k.denemeNo }); return { mesaj: 'PTT Kargo hesabı doğrulandı: gönderi kaydı okundu.', test: !!k.test }; }
module.exports = { ad: AD, anahtarlar: ['kargofirma:ptt'], kaynak: ['https://pttws.ptt.gov.tr/GonderiTakipV2/services/Sorgu?wsdl'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Kullanıcı', zorunlu: true }, pass: { ad: 'Şifre', zorunlu: true, gizli: true, kirp: false }, denemeNo: { ad: 'Deneme için barkod', zorunlu: true, parmakDisi: true }, test: { ad: 'Test ortamı', tur: 'onay' } },
  dene, islemler: { 'durum-sorgu': takip } };
