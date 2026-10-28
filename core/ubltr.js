/* NEBSOFT UBL-TR fatura üreticisi (tarayıcı + Node, bağımlılıksız)
   Kaynak: GİB e-Fatura Paketi (ebelge.gib.gov.tr/dosyalar/kilavuzlar/e-FaturaPaketi.zip) —
   UBL-TR_Common_Schematron.xml kuralları ve xml/1_TEMEL_FATURA.xml örneği; UBL 2.1 eleman sırası (Invoice-2 şeması).
   Kurallar: UBLVersionID 2.1 · CustomizationID TR1.2 · ProfileID TEMELFATURA / TICARIFATURA (e-Fatura) veya EARSIVFATURA (e-Arşiv)
   · ID ^[A-Z0-9]{3}20\d{2}\d{9}$ (16 hane) · VKN (10) ile PartyName, TCKN (11) ile Person (ad + soyad) zorunlu
   · cac:Signature: ID schemeID="VKN_TCKN", URI "#" ile başlar · KDV vergi kodu 0015 · birimler UN/ECE (C62 adet, KGM kg …).
   İmza (UBLExtensions) entegratör tarafından mali mühürle eklenir; burada üretilmez. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.NB_UBLTR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const NS = {
    cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    ext: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  };
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const a2 = (n) => r2(n).toFixed(2);
  const num = (n, d = 4) => String(Number(Number(n).toFixed(d)));
  // Ürün birimleri (UBL-TR kod listesi UnitCodeList ile doğrulandı)
  const UNIT = { adet: 'C62', ad: 'C62', kg: 'KGM', gr: 'GRM', g: 'GRM', lt: 'LTR', l: 'LTR', litre: 'LTR', m: 'MTR', metre: 'MTR', m2: 'MTK', saat: 'HUR', gun: 'DAY', 'gün': 'DAY', ay: 'MON', kwh: 'KWH', paket: 'PA', koli: 'CS', set: 'SET' };
  const unitOf = (u) => UNIT[String(u || 'adet').toLocaleLowerCase('tr')] || 'C62';
  const ID_RE = /^[A-Z0-9]{3}20\d{2}\d{9}$/;
  const idOk = (id) => ID_RE.test(String(id || ''));
  const makeId = (prefix, year, seq) => `${String(prefix || '').toUpperCase()}${year}${String(seq).padStart(9, '0')}`;
  const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const b64 = (s) => (typeof Buffer !== 'undefined' ? Buffer.from(String(s), 'utf8').toString('base64') : btoa(unescape(encodeURIComponent(String(s)))));

  // Satırları KDV hariç tutar + KDV'ye çevirir. İki giriş biçimi: {qty, price(KDV hariç), disc} veya {total (KDV dahil)}.
  // KDV oranı bilinmiyorsa tahmin edilmez; vatHint yalnızca belgenin toplam KDV'sinden tek oran türetilebiliyorsa kullanılır.
  function lines(doc) {
    const src = Array.isArray(doc.lines) && doc.lines.length ? doc.lines : doc.total ? [{ name: doc.title || 'Hizmet bedeli', total: doc.total }] : [];
    if (!src.length) throw new Error('Faturada satır yok');
    let hint = null;
    if (doc.vat !== undefined && doc.total) { const net = Number(doc.total) - Number(doc.vat); if (net > 0) hint = Math.round((Number(doc.vat) / net) * 100); }
    return src.map((l, i) => {
      let rate = l.vat !== undefined && l.vat !== null && l.vat !== '' ? Number(l.vat) : hint;
      if (rate === null || !Number.isFinite(rate)) throw new Error(`${i + 1}. satırın (${l.name || '-'}) KDV oranı belirtilmemiş`);
      const qty = Number(l.qty) || 1;
      let net;
      if (l.price !== undefined && l.total === undefined) net = qty * Number(l.price) * (1 - (Number(l.disc) || 0) / 100);
      else net = Number(l.total) / (1 + rate / 100);
      net = r2(net); if (!(net >= 0)) throw new Error(`${i + 1}. satırın tutarı geçersiz`);
      if (rate === 0 && !l.exemptionCode) throw new Error(`${i + 1}. satır KDV %0: GİB istisna / muafiyet kodu (TaxExemptionReasonCode) gerekli`);
      const vat = r2(net * rate / 100);
      const pay = l.whtCode ? Number(l.wht) : 0;
      if (l.whtCode && !(pay >= 1 && pay <= 10)) throw new Error(`${i + 1}. satırın tevkifat oranı geçersiz (1/10 – 10/10)`);
      if (l.whtCode && rate === 0) throw new Error(`${i + 1}. satır: KDV %0 iken tevkifat uygulanamaz`);
      return { n: i + 1, name: String(l.name || 'Ürün').slice(0, 250), code: l.code || '', qty, unit: unitOf(l.unit), net, rate, vat, exemptionCode: l.exemptionCode, exemptionReason: l.exemptionReason,
        whtCode: l.whtCode ? String(l.whtCode) : '', whtName: l.whtName || '', pay, wht: pay ? r2(vat * pay / 10) : 0 };
    });
  }

  // GİB UBL-TR XSD'sinde (xsdrt) PostalAddress içinde CitySubdivisionName (ilçe) ve CityName (il) zorunludur
  function address(p, role) {
    if (!String(p.district || '').trim() || !String(p.city || '').trim()) throw new Error(`${role} adresinde ilçe ve il zorunludur (GİB UBL-TR şeması)`);
    return `<cac:PostalAddress>${p.street ? `<cbc:StreetName>${esc(p.street)}</cbc:StreetName>` : ''}<cbc:CitySubdivisionName>${esc(p.district)}</cbc:CitySubdivisionName><cbc:CityName>${esc(p.city)}</cbc:CityName><cac:Country><cbc:Name>${esc(p.country || 'Türkiye')}</cbc:Name></cac:Country></cac:PostalAddress>`;
  }
  function party(p, role) {
    const id = digits(p.id); const isV = id.length === 10, isT = id.length === 11;
    if (!isV && !isT) throw new Error(`${role} VKN (10 hane) veya TCKN (11 hane) geçersiz`);
    if (!String(p.name || '').trim()) throw new Error(`${role} unvanı / adı boş`);
    const nm = String(p.name).trim().split(/\s+/); const fam = nm.length > 1 ? nm.pop() : nm[0]; const first = nm.join(' ') || fam;
    const addr = address(p, role);
    return `<cac:Party><cac:PartyIdentification><cbc:ID schemeID="${isV ? 'VKN' : 'TCKN'}">${id}</cbc:ID></cac:PartyIdentification>`
      + (isV ? `<cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>` : '') + addr
      + (p.taxOffice ? `<cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>${esc(p.taxOffice)}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>` : '')
      + (p.phone || p.email ? `<cac:Contact>${p.phone ? `<cbc:Telephone>${esc(p.phone)}</cbc:Telephone>` : ''}${p.email ? `<cbc:ElectronicMail>${esc(p.email)}</cbc:ElectronicMail>` : ''}</cac:Contact>` : '')
      + (isT ? `<cac:Person><cbc:FirstName>${esc(first)}</cbc:FirstName><cbc:FamilyName>${esc(fam)}</cbc:FamilyName></cac:Person>` : '') + '</cac:Party>';
  }

  const taxBlock = (cur, groups, wht = 0) => {
    const total = r2(groups.reduce((s, g) => s + g.vat, 0) - wht);
    return `<cac:TaxTotal><cbc:TaxAmount currencyID="${cur}">${a2(total)}</cbc:TaxAmount>${groups.map((g, i) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="${cur}">${a2(g.net)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${cur}">${a2(g.vat)}</cbc:TaxAmount><cbc:CalculationSequenceNumeric>${i + 1}</cbc:CalculationSequenceNumeric><cbc:Percent>${num(g.rate, 2)}</cbc:Percent><cac:TaxCategory>${g.exemptionCode ? `<cbc:TaxExemptionReasonCode>${esc(g.exemptionCode)}</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>${esc(g.exemptionReason || g.exemptionCode)}</cbc:TaxExemptionReason>` : ''}<cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>`).join('')}</cac:TaxTotal>`;
  };

  // WithholdingTaxTotal: koda göre gruplar; TaxableAmount = KDV, Percent = pay × 10 (GİB örnekleri)
  const whtBlock = (cur, items) => {
    const g = []; items.filter((x) => x.whtCode).forEach((x) => { let o = g.find((y) => y.code === x.whtCode && y.pay === x.pay); if (!o) { o = { code: x.whtCode, name: x.whtName, pay: x.pay, vat: 0, wht: 0 }; g.push(o); } o.vat = r2(o.vat + x.vat); o.wht = r2(o.wht + x.wht); });
    if (!g.length) return '';
    return `<cac:WithholdingTaxTotal><cbc:TaxAmount currencyID="${cur}">${a2(g.reduce((s, o) => s + o.wht, 0))}</cbc:TaxAmount>${g.map((o) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="${cur}">${a2(o.vat)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${cur}">${a2(o.wht)}</cbc:TaxAmount><cbc:Percent>${o.pay * 10}</cbc:Percent><cac:TaxCategory><cac:TaxScheme>${o.name ? `<cbc:Name>${esc(o.name)}</cbc:Name>` : ''}<cbc:TaxTypeCode>${esc(o.code)}</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>`).join('')}</cac:WithholdingTaxTotal>`;
  };
  // Fatura tipi kalemlerden: tevkifat → TEVKIFAT(IADE), istisna kodu (351 / 555 hariç) → ISTISNA (GİB şematron: GeneralWithholdingTaxTotalCheck, TaxExemptionReasonCode kuralları)
  const NON_EXEMPT = ['351', '555'];
  function typeOf(base, L) {
    const hasW = L.some((l) => l.whtCode); const hasE = L.some((l) => l.exemptionCode && !NON_EXEMPT.includes(String(l.exemptionCode)));
    if (hasW && hasE) throw new Error('Aynı faturada tevkifat ve istisna birlikte kullanılamaz; ayrı fatura kesin');
    if (base === 'IADE') return hasW ? 'TEVKIFATIADE' : 'IADE';
    return hasW ? 'TEVKIFAT' : hasE ? 'ISTISNA' : 'SATIS';
  }

  /* doc: { profile, type ('SATIS' | 'IADE'), id, uuid, date (YYYY-AA-GG), time, currency ('TRY'), rate (kur), notes[],
            seller {id, name, taxOffice, street, district, city, phone, email}, buyer {aynı alanlar}, lines[], refundOf, refundDate }
     Dönüş: { body: <Invoice> içeriği (UBL elemanları, sırayla), id, uuid, totals } */
  function build(doc) {
    const profile = doc.profile || 'TEMELFATURA';
    if (!['TEMELFATURA', 'TICARIFATURA', 'EARSIVFATURA'].includes(profile)) throw new Error('Desteklenen senaryolar: TEMELFATURA, TICARIFATURA, EARSIVFATURA');
    const base = doc.type || 'SATIS'; if (!['SATIS', 'IADE'].includes(base)) throw new Error('Fatura tipi SATIS veya IADE olmalı');
    if (base === 'IADE' && !idOk(doc.refundOf)) throw new Error('İade faturası için iade edilen faturanın 16 haneli numarası gerekli');
    if (base === 'IADE' && profile === 'TICARIFATURA') throw new Error('İade faturası TICARIFATURA senaryosunda kesilemez (GİB kuralı)');
    if (!idOk(doc.id)) throw new Error(`Fatura numarası "${doc.id}" GİB biçiminde değil (ör. ABC2026000000001)`);
    const cur = String(doc.currency || 'TRY').toUpperCase(); if (cur !== 'TRY' && !(Number(doc.rate) > 0)) throw new Error('TRY dışı para biriminde kur bilgisi zorunludur');
    const date = doc.date || new Date().toISOString().slice(0, 10); const id = doc.id; const u = doc.uuid || uuid();
    const L = lines(doc); const groups = []; const type = typeOf(base, L);
    L.forEach((l) => { const k = l.rate + '|' + (l.exemptionCode || ''); let g = groups.find((x) => x.k === k); if (!g) { g = { k, rate: l.rate, net: 0, vat: 0, exemptionCode: l.exemptionCode, exemptionReason: l.exemptionReason }; groups.push(g); } g.net = r2(g.net + l.net); g.vat = r2(g.vat + l.vat); });
    const net = r2(L.reduce((s, l) => s + l.net, 0)); const vat = r2(groups.reduce((s, g) => s + g.vat, 0)); const gross = r2(net + vat);
    const wht = r2(L.reduce((s, l) => s + l.wht, 0)); const payable = r2(gross - wht);
    const sellerId = digits(doc.seller && doc.seller.id);
    const body = [
      '<cbc:UBLVersionID>2.1</cbc:UBLVersionID>', '<cbc:CustomizationID>TR1.2</cbc:CustomizationID>', `<cbc:ProfileID>${profile}</cbc:ProfileID>`,
      `<cbc:ID>${esc(id)}</cbc:ID>`, '<cbc:CopyIndicator>false</cbc:CopyIndicator>', `<cbc:UUID>${esc(u)}</cbc:UUID>`, `<cbc:IssueDate>${esc(date)}</cbc:IssueDate>`,
      doc.time ? `<cbc:IssueTime>${esc(doc.time)}</cbc:IssueTime>` : '', `<cbc:InvoiceTypeCode>${type}</cbc:InvoiceTypeCode>`,
      ...(doc.notes || []).filter(Boolean).map((n) => `<cbc:Note>${esc(n)}</cbc:Note>`),
      `<cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode>`, `<cbc:LineCountNumeric>${L.length}</cbc:LineCountNumeric>`,
      base === 'IADE' ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${esc(doc.refundOf)}</cbc:ID><cbc:IssueDate>${esc(doc.refundDate || date)}</cbc:IssueDate><cbc:DocumentTypeCode>IADE</cbc:DocumentTypeCode></cac:InvoiceDocumentReference></cac:BillingReference>` : '',
      // Görünüm şablonu: GİB örneklerindeki gibi DocumentType XSLT + Base64 gömülü dosya (alıcı faturayı bu tasarımla görür)
      doc.xslt ? `<cac:AdditionalDocumentReference><cbc:ID>${esc(u)}</cbc:ID><cbc:IssueDate>${esc(date)}</cbc:IssueDate><cbc:DocumentType>XSLT</cbc:DocumentType><cac:Attachment><cbc:EmbeddedDocumentBinaryObject characterSetCode="UTF-8" encodingCode="Base64" filename="${esc(id)}.xslt" mimeCode="application/xml">${b64(doc.xslt)}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>` : '',
      `<cac:Signature><cbc:ID schemeID="VKN_TCKN">${sellerId}</cbc:ID><cac:SignatoryParty><cac:PartyIdentification><cbc:ID schemeID="${sellerId.length === 11 ? 'TCKN' : 'VKN'}">${sellerId}</cbc:ID></cac:PartyIdentification>${address(doc.seller, 'Satıcı')}</cac:SignatoryParty><cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#Signature_${esc(id)}</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment></cac:Signature>`,
      `<cac:AccountingSupplierParty>${party(doc.seller, 'Satıcı')}</cac:AccountingSupplierParty>`,
      `<cac:AccountingCustomerParty>${party(doc.buyer, 'Alıcı')}</cac:AccountingCustomerParty>`,
      cur !== 'TRY' ? `<cac:PricingExchangeRate><cbc:SourceCurrencyCode>${cur}</cbc:SourceCurrencyCode><cbc:TargetCurrencyCode>TRY</cbc:TargetCurrencyCode><cbc:CalculationRate>${num(doc.rate, 6)}</cbc:CalculationRate></cac:PricingExchangeRate>` : '',
      taxBlock(cur, groups, wht), whtBlock(cur, L),
      `<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${cur}">${a2(net)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${cur}">${a2(net)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="${cur}">${a2(gross)}</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="${cur}">0.00</cbc:AllowanceTotalAmount><cbc:PayableAmount currencyID="${cur}">${a2(payable)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`,
      ...L.map((l) => `<cac:InvoiceLine><cbc:ID>${l.n}</cbc:ID><cbc:InvoicedQuantity unitCode="${l.unit}">${num(l.qty, 4)}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="${cur}">${a2(l.net)}</cbc:LineExtensionAmount>${taxBlock(cur, [l], l.wht)}${whtBlock(cur, [l])}<cac:Item><cbc:Name>${esc(l.name)}</cbc:Name>${l.code ? `<cac:SellersItemIdentification><cbc:ID>${esc(l.code)}</cbc:ID></cac:SellersItemIdentification>` : ''}</cac:Item><cac:Price><cbc:PriceAmount currencyID="${cur}">${num(l.net / l.qty, 6)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`),
    ].filter(Boolean).join('');
    return { body, id, uuid: u, profile, type, totals: { net, vat, gross, wht, payable, currency: cur, lines: L.length } };
  }
  // Bağımsız UBL belgesi (önizleme / dosya olarak indirme / testler için)
  const wrap = (body) => `<?xml version="1.0" encoding="UTF-8"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="${NS.cac}" xmlns:cbc="${NS.cbc}" xmlns:ext="${NS.ext}">${body}</Invoice>`;
  const xml = (doc) => { const b = build(doc); return { ...b, xml: wrap(b.body) }; };
  /* ---- Uyumsoft e-Fatura entegrasyon servisi (SOAP 1.1 + WS-Security UsernameToken) ----
     Kaynak: Uyumsoft'un herkese açık WSDL'i https://efatura.uyumsoft.com.tr/Services/Integration?wsdl
     (test: efatura-test.uyumsoft.com.tr). İşlem adları ve SOAPAction değerleri WSDL'den alınmıştır. */
  const UY = {
    url: (test) => `https://efatura${test ? '-test' : ''}.uyumsoft.com.tr/Services/Integration`,
    action: (op) => `http://tempuri.org/${op === 'GetSystemDate' ? 'ICustomerServiceBase' : 'IIntegration'}/${op}`,
    envelope: (user, pass, inner) => `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken><o:Username>${esc(user)}</o:Username><o:Password>${esc(pass)}</o:Password></o:UsernameToken></o:Security></s:Header><s:Body>${inner}</s:Body></s:Envelope>`,
    // info: { body (build().body), scenario 'eInvoice' | 'eArchive', target {vkn, alias, title}, delivery 'Electronic' | 'Paper', internet {web, payType, payDate, payBroker, sendDate, carrierVkn, carrierName}, localId }
    sendInvoice: (infos) => `<SendInvoice xmlns="http://tempuri.org/"><invoices>${infos.map((x) => {
      const it = x.internet;
      const ea = x.scenario === 'eArchive' ? `<EArchiveInvoiceInfo DeliveryType="${x.delivery === 'Paper' ? 'Paper' : 'Electronic'}">${it ? `<InternetSalesInfo><WebAddress>${esc(it.web)}</WebAddress>${it.payBroker ? `<PaymentMidierName>${esc(it.payBroker)}</PaymentMidierName>` : ''}<PaymentType>${esc(it.payType)}</PaymentType><PaymentDate>${esc(it.payDate || it.sendDate)}T00:00:00</PaymentDate><ShipmentInfo><SendDate>${esc(it.sendDate)}T00:00:00</SendDate><Carier SenderTcknVkn="${esc(it.carrierVkn)}" SenderName="${esc(it.carrierName)}"/></ShipmentInfo></InternetSalesInfo>` : ''}</EArchiveInvoiceInfo>` : '';
      return `<InvoiceInfo${x.localId ? ` LocalDocumentId="${esc(x.localId)}"` : ''}><Invoice xmlns:cbc="${NS.cbc}" xmlns:cac="${NS.cac}" xmlns:ext="${NS.ext}">${x.body}</Invoice>${x.target ? `<TargetCustomer VknTckn="${esc(x.target.vkn)}"${x.target.alias ? ` Alias="${esc(x.target.alias)}"` : ''}${x.target.title ? ` Title="${esc(x.target.title)}"` : ''}/>` : ''}${ea}<Scenario>${x.scenario}</Scenario><CreateDateUtc>${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</CreateDateUtc></InvoiceInfo>`;
    }).join('')}</invoices></SendInvoice>`,
    isEInvoiceUser: (vkn) => `<IsEInvoiceUser xmlns="http://tempuri.org/"><vknTckn>${esc(digits(vkn))}</vknTckn></IsEInvoiceUser>`,
    getUserAliasses: (vkn) => `<GetUserAliasses xmlns="http://tempuri.org/"><vknTckn>${esc(digits(vkn))}</vknTckn></GetUserAliasses>`,
    // e-Arşiv iptali (WSDL: CancelEArchiveInvoice · request InvoiceId + CancelDate öznitelikleri)
    cancelEArchive: (invoiceId, at) => `<CancelEArchiveInvoice xmlns="http://tempuri.org/"><request InvoiceId="${esc(invoiceId)}" CancelDate="${esc(at || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))}"/></CancelEArchiveInvoice>`,
    // InvoiceStatus listesi (XSD) → e-Belge merkezi durumları
    status: (s, earsiv) => ({ Approved: 'kabul', Declined: 'red', Return: 'red', WaitingForAprovement: 'yanit-bekliyor', SentToGib: earsiv ? 'raporlandi' : 'gonderildi', Canceled: 'iptal', EArchivedCanceled: 'iptal', Error: 'hata', Queued: 'kuyrukta', Processing: 'kuyrukta', NotSend: 'kuyrukta', Draft: 'kuyrukta', NotPrepared: 'kuyrukta' }[s] || ''),
    queryStatus: (ids) => `<QueryOutboxInvoiceStatus xmlns="http://tempuri.org/"><invoiceIds>${ids.map((i) => `<string>${esc(i)}</string>`).join('')}</invoiceIds></QueryOutboxInvoiceStatus>`,
    systemDate: () => '<GetSystemDate xmlns="http://tempuri.org/"/>',
    // Yanıt çözümleme (DOMParser gerektirmez): SOAP hatası, IsSucceded / Message, öznitelikler
    parse(text) {
      const t = String(text || ''); const fault = (t.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/) || [])[1];
      if (fault) return { ok: false, fault: true, error: fault.replace(/&amp;/g, '&').trim() };
      const res = (t.match(/<(\w+Result)\b([^>]*)>/) || t.match(/<(\w+Result)\b([^>]*)\/>/) || []);
      const att = (s, n) => (String(s || '').match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1];
      const ok = att(res[2], 'IsSucceded'); const msg = att(res[2], 'Message');
      return { ok: ok === 'true', error: ok === 'true' ? '' : (msg || 'Uyumsoft yanıtı başarısız'), message: msg, raw: t,
        values: [...t.matchAll(/<Value\b([^>]*)\/?>/g)].map((m) => Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]))),
        aliases: [...t.matchAll(/<ReceiverboxAliases\b([^>]*)\/?>/g)].map((m) => ({ alias: att(m[1], 'Alias'), enabled: att(m[1], 'Enabled') !== 'false' })).filter((a) => a.alias),
        flag: att(res[2], 'Value'), date: att(res[2], 'Value') };
    },
  };
  return { build, xml, wrap, lines, makeId, idOk, unitOf, esc, r2, NS, UY };
});
