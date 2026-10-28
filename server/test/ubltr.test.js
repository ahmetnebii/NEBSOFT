// UBL-TR fatura üreticisi ve Uyumsoft SOAP zarfı
//   node server/test/ubltr.test.js                 → yerel testler
//   UYUMSOFT_LIVE=1 node server/test/ubltr.test.js → ek olarak Uyumsoft test sunucusuna sahte kullanıcıyla gerçek çağrı (yetki hatası beklenir)
// Not: üretilen SendInvoice gövdesi Uyumsoft'un yayımladığı şemalara (UBL 2.1 dahil) .NET XmlSchemaSet ile ayrıca doğrulanmıştır.
const assert = require('assert'); const U = require('../../core/ubltr');
const A = { district: 'Çankaya', city: 'Ankara' };
const seller = { id: '1234567801', name: 'Deneme Ticaret A.Ş.', taxOffice: 'Kadıköy', street: 'Bağdat Cad. No:1', district: 'Kadıköy', city: 'İstanbul' };
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
(async () => {
  assert.strictEqual(U.makeId('neb', 2026, 42), 'NEB2026000000042'); assert.ok(U.idOk('NEB2026000000042') && !U.idOk('NEB26000000042') && !U.idOk('ne2026000000042')); ok('Fatura no GİB biçimi: 3 karakter + yıl + 9 hane (16)');
  // Karışık satır biçimleri: KDV hariç fiyat + iskonto, KDV dahil toplam; KDV oranına göre gruplama
  let b = U.build({ profile: 'TICARIFATURA', id: 'NEB2026000000001', date: '2026-10-28', seller, buyer: { ...A, id: '9876543210', name: 'Alıcı Ltd.' }, lines: [{ name: 'Süt', qty: 3, price: 30, vat: 1 }, { name: 'Deterjan', qty: 2, price: 50, disc: 10, vat: 20 }, { name: 'Sabun', total: 24, vat: 20 }] });
  assert.deepStrictEqual(b.totals, { net: 200, vat: 22.9, gross: 222.9, wht: 0, payable: 222.9, currency: 'TRY', lines: 3 });
  assert.match(b.body, /<cbc:UBLVersionID>2\.1<\/cbc:UBLVersionID><cbc:CustomizationID>TR1\.2<\/cbc:CustomizationID><cbc:ProfileID>TICARIFATURA<\/cbc:ProfileID>/);
  assert.strictEqual((b.body.match(/<cac:TaxSubtotal>/g) || []).length, 2 + 3); ok('Toplamlar: KDV hariç 200,00 + KDV 22,90 = 222,90; %1 ve %20 ayrı alt toplam');
  assert.match(b.body, /<cbc:ID schemeID="VKN_TCKN">1234567801<\/cbc:ID>/); assert.match(b.body, /<cbc:URI>#Signature_NEB2026000000001<\/cbc:URI>/); assert.match(b.body, /schemeID="VKN">9876543210<\/cbc:ID><\/cac:PartyIdentification><cac:PartyName>/); ok('İmza bilgisi (VKN_TCKN, #Signature_) ve VKN’li alıcıda unvan');
  b = U.build({ profile: 'EARSIVFATURA', id: 'NEA2026000000007', seller, buyer: { ...A, id: '12345678901', name: 'Ayşe Nur Demir' }, lines: [{ name: 'Tişört', total: 600, vat: 10 }] });
  assert.match(b.body, /<cac:Person><cbc:FirstName>Ayşe Nur<\/cbc:FirstName><cbc:FamilyName>Demir<\/cbc:FamilyName><\/cac:Person>/); assert.ok(!/<cac:PartyName><cbc:Name>Ayşe/.test(b.body)); assert.deepStrictEqual([b.totals.net, b.totals.vat, b.totals.gross], [545.45, 54.55, 600]); ok('TCKN’li alıcı: Person (ad + soyad); KDV dahil 600 → 545,45 + 54,55');
  b = U.build({ id: 'NEB2026000000002', seller, buyer: { ...A, id: '9876543210', name: 'A' }, total: 110, vat: 10, lines: [{ name: 'Konaklama', total: 110 }] }); assert.strictEqual(b.totals.vat, 10); ok('Satırda oran yoksa belge KDV’sinden türetilir (110 / 10 → %10)');
  b = U.build({ type: 'IADE', refundOf: 'NEB2026000000001', id: 'NEB2026000000003', seller, buyer: { ...A, id: '9876543210', name: 'A' }, currency: 'USD', rate: 34.25, lines: [{ name: 'İade', qty: 1, price: 10, vat: 20 }] });
  assert.match(b.body, /<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>NEB2026000000001<\/cbc:ID>.*<cbc:DocumentTypeCode>IADE<\/cbc:DocumentTypeCode>/); assert.match(b.body, /<cac:PricingExchangeRate>.*<cbc:CalculationRate>34\.25<\/cbc:CalculationRate>/); ok('İade faturası: iade edilen faturaya referans; döviz + kur');
  const bad = (doc, re) => assert.throws(() => U.build({ id: 'NEB2026000000009', seller, buyer: { ...A, id: '9876543210', name: 'A' }, lines: [{ name: 'X', total: 10, vat: 20 }], ...doc }), re);
  bad({ lines: [{ name: 'X', total: 10 }] }, /KDV oranı belirtilmemiş/); bad({ lines: [{ name: 'X', total: 10, vat: 0 }] }, /istisna/); bad({ id: 'NEB26' }, /GİB biçiminde değil/);
  bad({ type: 'IADE' }, /16 haneli/); bad({ currency: 'EUR' }, /kur/); bad({ buyer: { ...A, id: '123', name: 'A' } }, /Alıcı VKN/); bad({ profile: 'TICARIFATURA', type: 'IADE', refundOf: 'NEB2026000000001' }, /TICARIFATURA/);
  ok('Tahmin yerine anlaşılır hata: oran yok, %0 istisna kodu yok, numara / iade / kur / kimlik hatalı');
  const env = U.UY.envelope('a&b', 'x<y', U.UY.systemDate()); assert.match(env, /<o:Username>a&amp;b<\/o:Username><o:Password>x&lt;y<\/o:Password>/); ok('SOAP zarfı: WS-Security kullanıcı adı / şifre XML kaçışlı');
  const p = U.UY.parse('<s:Envelope><s:Body><SendInvoiceResponse xmlns="http://tempuri.org/"><SendInvoiceResult IsSucceded="true" Message=""><Value Id="a1b2" Number="NEB2026000000001" InvoiceScenario="eInvoice"/></SendInvoiceResult></SendInvoiceResponse></s:Body></s:Envelope>');
  assert.ok(p.ok); assert.strictEqual(p.values[0].Number, 'NEB2026000000001');
  assert.strictEqual(U.UY.parse('<IsEInvoiceUserResult IsSucceded="true" Value="true"/>').flag, 'true');
  assert.deepStrictEqual(U.UY.parse('<GetUserAliassesResult IsSucceded="true"><Value><ReceiverboxAliases Alias="urn:mail:defaultpk@x.com" Type="1" Enabled="true"/></Value></GetUserAliassesResult>').aliases, [{ alias: 'urn:mail:defaultpk@x.com', enabled: true }]); ok('Yanıt çözümleme: SendInvoice numarası, e-Fatura mükellefi bayrağı, posta kutusu etiketi');
  // GİB UBL-TR XSD (xsdrt): PostalAddress içinde CitySubdivisionName + CityName zorunlu; imza bloğunda da yazılır
  bad({ buyer: { id: '9876543210', name: 'A', city: 'Ankara' } }, /Alıcı adresinde ilçe ve il zorunludur/);
  assert.throws(() => U.build({ id: 'NEB2026000000009', seller: { ...seller, district: '' }, buyer: { ...A, id: '9876543210', name: 'A' }, lines: [{ name: 'X', total: 10, vat: 20 }] }), /Satıcı adresinde ilçe ve il/);
  b = U.build({ id: 'NEB2026000000010', seller, buyer: { ...A, id: '9876543210', name: 'A' }, lines: [{ name: 'X', total: 12, vat: 20 }] });
  assert.match(b.body, /<cac:SignatoryParty>.*<cbc:CitySubdivisionName>Kadıköy<\/cbc:CitySubdivisionName><cbc:CityName>İstanbul<\/cbc:CityName>.*<\/cac:SignatoryParty>/); ok('Adres: ilçe + il zorunlu (satıcı, alıcı, imza bloğu)');
  // Görünüm şablonu: GİB örneklerindeki gibi AdditionalDocumentReference / DocumentType XSLT / Base64 gömülü dosya, imzadan önce
  b = U.build({ id: 'NEB2026000000011', seller, buyer: { ...A, id: '9876543210', name: 'A' }, lines: [{ name: 'X', total: 12, vat: 20 }], xslt: '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">ğ</xsl:stylesheet>' });
  const emb = (b.body.match(/<cbc:DocumentType>XSLT<\/cbc:DocumentType><cac:Attachment><cbc:EmbeddedDocumentBinaryObject characterSetCode="UTF-8" encodingCode="Base64" filename="NEB2026000000011\.xslt" mimeCode="application\/xml">([^<]+)</) || [])[1];
  assert.ok(emb && Buffer.from(emb, 'base64').toString('utf8').endsWith('ğ</xsl:stylesheet>')); assert.ok(b.body.indexOf('AdditionalDocumentReference') < b.body.indexOf('<cac:Signature>')); ok('XSLT görünüm şablonu faturaya gömülür (UTF-8, Base64)');
  assert.strictEqual(U.UY.cancelEArchive('abc', '2026-10-28T10:00:00Z'), '<CancelEArchiveInvoice xmlns="http://tempuri.org/"><request InvoiceId="abc" CancelDate="2026-10-28T10:00:00Z"/></CancelEArchiveInvoice>');
  assert.deepStrictEqual(['Approved', 'Declined', 'WaitingForAprovement', 'SentToGib', 'EArchivedCanceled', 'Error', 'Queued', 'Bilinmeyen'].map((s) => U.UY.status(s, false)), ['kabul', 'red', 'yanit-bekliyor', 'gonderildi', 'iptal', 'hata', 'kuyrukta', '']);
  assert.strictEqual(U.UY.status('SentToGib', true), 'raporlandi'); ok('Uyumsoft: e-Arşiv iptal zarfı ve durum eşlemesi (WSDL InvoiceStatus listesi)');
  // Tevkifat (GİB YTB_Tevkıfat_Efatura.xml yapısı): TaxTotal = KDV − tevkifat, WithholdingTaxTotal (TaxableAmount = KDV, Percent = pay×10), Payable = brüt − tevkifat
  b = U.build({ id: 'NEB2026000000012', seller, buyer: { ...A, id: '9876543210', name: 'A' }, lines: [{ name: 'Bahçe bakımı', qty: 15, price: 15, vat: 10, wht: 9, whtCode: '613', whtName: 'Çevre ve Bahçe Bakım Hizmetleri' }] });
  assert.strictEqual(b.type, 'TEVKIFAT'); assert.deepStrictEqual([b.totals.net, b.totals.vat, b.totals.wht, b.totals.gross, b.totals.payable], [225, 22.5, 20.25, 247.5, 227.25]);
  assert.match(b.body, /<cac:TaxTotal><cbc:TaxAmount currencyID="TRY">2\.25<\/cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="TRY">225\.00<\/cbc:TaxableAmount><cbc:TaxAmount currencyID="TRY">22\.50<\/cbc:TaxAmount>/);
  assert.match(b.body, /<cac:WithholdingTaxTotal><cbc:TaxAmount currencyID="TRY">20\.25<\/cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="TRY">22\.50<\/cbc:TaxableAmount><cbc:TaxAmount currencyID="TRY">20\.25<\/cbc:TaxAmount><cbc:Percent>90<\/cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:Name>Çevre ve Bahçe Bakım Hizmetleri<\/cbc:Name><cbc:TaxTypeCode>613<\/cbc:TaxTypeCode>/);
  assert.match(b.body, /<cbc:PayableAmount currencyID="TRY">227\.25<\/cbc:PayableAmount>/); assert.strictEqual((b.body.match(/<cac:WithholdingTaxTotal>/g) || []).length, 2);
  ok('Tevkifatlı fatura: GİB 2026 örneğiyle aynı tutarlar (225 + 22,50 KDV, 9/10 tevkifat 20,25 → ödenecek 227,25)');
  const T = (lines, extra = {}) => U.build({ id: 'NEB2026000000013', seller, buyer: { ...A, id: '9876543210', name: 'A' }, lines, ...extra }).type;
  assert.strictEqual(T([{ name: 'İhracat', qty: 1, price: 100, vat: 0, exemptionCode: '301', exemptionReason: '11/1-a Mal ihracatı' }]), 'ISTISNA');
  assert.strictEqual(T([{ name: 'Yansıtma', qty: 1, price: 100, vat: 0, exemptionCode: '351', exemptionReason: 'KDV - İstisna Olmayan Diğer' }]), 'SATIS');
  assert.strictEqual(T([{ name: 'İade', qty: 1, price: 100, vat: 20, wht: 5, whtCode: '604' }], { type: 'IADE', refundOf: 'NEB2026000000001' }), 'TEVKIFATIADE');
  assert.throws(() => T([{ name: 'a', qty: 1, price: 1, vat: 20, wht: 5, whtCode: '604' }, { name: 'b', qty: 1, price: 1, vat: 0, exemptionCode: '301' }]), /birlikte/);
  assert.throws(() => T([{ name: 'a', qty: 1, price: 1, vat: 20, wht: 12, whtCode: '604' }]), /tevkifat oranı/);
  ok('Fatura tipi kalemlerden: istisna → ISTISNA, 351 → SATIS, iade + tevkifat → TEVKIFATIADE; karışık kullanım reddedilir');
  if (process.env.UYUMSOFT_LIVE) {
    const call = async (op, inner) => { const r = await fetch(U.UY.url(true), { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `"${U.UY.action(op)}"` }, body: U.UY.envelope('nebsoft-test-yok', 'yanlis', inner) }); return U.UY.parse(await r.text()); };
    let r = await call('GetSystemDate', U.UY.systemDate()); assert.ok(r.fault && /yetkiniz yok/i.test(r.error), JSON.stringify(r)); ok('Uyumsoft test sunucusu: GetSystemDate → sahte kullanıcıya yetki hatası');
    const inv = U.build({ profile: 'EARSIVFATURA', id: 'NEA2026000000001', seller, buyer: { ...A, id: '12345678901', name: 'Ayşe Demir' }, lines: [{ name: 'Test', total: 12, vat: 20 }] });
    r = await call('SendInvoice', U.UY.sendInvoice([{ body: inv.body, scenario: 'eArchive', target: { vkn: '12345678901' } }])); assert.ok(r.fault && /yetkiniz yok/i.test(r.error), JSON.stringify(r)); ok('Uyumsoft test sunucusu: SendInvoice zarfı kabul edildi, sahte kullanıcıya yetki hatası');
  }
  console.log(`\n${n} test geçti`);
})().catch((e) => { console.error('✗', e); process.exit(1); });
