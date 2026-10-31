// Aras Kargo web servis istemcisi: takip. WSDL açıktır, sütun adları ve kod tabloları bulunamadı.
// Kaynak (okundu 31.10.2026, WSDL'de sürüm yok): https://customerws.araskargo.com.tr/arascargoservice.asmx?wsdl, test https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx?wsdl
// Zararsız deneme: GetCargoInfo, kullanıcının verdiği gerçek entegrasyon koduyla. Başarı yanıtta IrsDataDataTable satırı varsa yazılır (DataSet şeması: IrsaliyeData.xsd). Gönderi oluşturma yazılmadı: ResultCode anlamları dokümanda yok.
const { SaglayiciHata, adres, istek, durumHata, xml, soapZarf, hataMetni } = require('./ortak');
const AD = 'Aras Kargo';
const url = (k) => (k.test ? adres('aras-test', 'https://customerservicestest.araskargo.com.tr') + '/arascargoservice/arascargoservice.asmx' : adres('aras', 'https://customerws.araskargo.com.tr') + '/arascargoservice.asmx');
async function takip(k, v) {
  const no = String(v.tracking || ''); if (!no) throw new SaglayiciHata('Entegrasyon kodu gerekli', { kod: 'bicim' });
  const r = await istek(AD, url(k), { yontem: 'POST', baslik: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '"http://tempuri.org/GetCargoInfo"' }, govde: soapZarf(`<GetCargoInfo xmlns="http://tempuri.org/"><username>${xml(k.user)}</username><password>${xml(k.pass)}</password><customerCode>${xml(k.customerCode)}</customerCode><integrationCode>${xml(no)}</integrationCode></GetCargoInfo>`) });
  const f = hataMetni(r.metin); if (f) throw new SaglayiciHata(`Aras Kargo: ${f.slice(0, 200)}`); if (!r.ok) throw durumHata(AD, r);
  if (!/IrsDataDataTable/.test(r.metin.replace(/<xs:schema[\s\S]*?<\/xs:schema>/, ''))) throw new SaglayiciHata('Bu kodla gönderi kaydı dönmedi. Kullanıcı bilgilerini ve kodu kontrol edin.', { kod: 'bulunamadi' }); return { tracking: no };
}
async function dene(k) { await takip(k, { tracking: k.denemeNo }); return { mesaj: 'Aras Kargo hesabı doğrulandı: gönderi kaydı okundu.', test: !!k.test }; }
module.exports = { ad: AD, anahtarlar: ['kargofirma:aras'], kaynak: ['https://customerws.araskargo.com.tr/arascargoservice.asmx?wsdl'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Web servis kullanıcı adı', zorunlu: true }, pass: { ad: 'Web servis şifresi', zorunlu: true, gizli: true, kirp: false }, customerCode: { ad: 'Müşteri kodu', zorunlu: true }, denemeNo: { ad: 'Deneme için entegrasyon kodu', zorunlu: true, parmakDisi: true }, test: { ad: 'Test ortamı', tur: 'onay' } },
  dene, islemler: { 'durum-sorgu': takip } };
