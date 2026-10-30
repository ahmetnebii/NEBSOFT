// Belge ve veri araçları: metin, tablo, liste, IBAN, iş günü, XLSX okuma ve yazma
//   node server/test/araclar-veri.test.js
const assert = require('assert'); const path = require('path'); const fs = require('fs'); const zlib = require('zlib');
const H = require(path.join(__dirname, '../../site/tools/araclar/hesap.js')); const D = require(path.join(__dirname, '../../site/tools/araclar/dosya.js'));
const K = (s) => require(path.join(__dirname, `../../site/src/araclar/${s}.js`));
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const YENI = ['csv-excel-temizleme', 'liste-karsilastirma', 'iban-dogrulama', 'is-gunu-hesaplama', 'turkce-metin-duzenleme'];

(async () => {
  // --- Türkçe metin ---
  assert.strictEqual(H.trBuyuk('diyarbakır ışık'), 'DİYARBAKIR IŞIK'); assert.strictEqual(H.trKucuk('IŞIK İNŞAAT'), 'ışık inşaat');
  assert.strictEqual(H.kelimeBuyuk('IŞIK İNŞAAT SANAYİ VE TİCARET LTD. ŞTİ.'), 'Işık İnşaat Sanayi ve Ticaret Ltd. Şti.'); assert.strictEqual(H.kelimeBuyuk('VE ÖRNEK A.Ş.\nİLE T.C. DİYARBAKIR\'DA AYŞE-NUR'), 'Ve Örnek A.Ş.\nİle T.C. Diyarbakır\'da Ayşe-Nur');
  assert.strictEqual(H.cumleDuzeni('MERHABA DÜNYA. İYİ GÜNLER\nIŞIK SÖNDÜ'), 'Merhaba dünya. İyi günler\nIşık söndü');
  assert.strictEqual(H.ascii('Işık İğdır çöp ŞŞ üğ â'), 'Isik Igdir cop SS ug a');
  ok('Türkçe büyük küçük harf, kısaltma, ek ve ASCII çevirme');
  const o1 = H.turkceOnar('Ä°stanbul Ã¼rÃ¼n ÅŸirket KÄ±rmÄ±zÄ± Ã‡aydanlÄ±k'); assert.strictEqual(o1.metin, 'İstanbul ürün şirket Kırmızı Çaydanlık'); assert.strictEqual(o1.onarilan, 9); assert.strictEqual(o1.kayip, 0);
  const u = Buffer.from('çÇğĞıİöÖşŞüÜ', 'utf8'); const c1252 = new TextDecoder('windows-1252').decode(u); const c1254 = new TextDecoder('windows-1254').decode(u); assert.strictEqual(H.turkceOnar(c1252).metin, 'çÇğĞıİöÖşŞüÜ'); assert.strictEqual(H.turkceOnar(c1254).metin, 'çÇğĞıİöÖşŞüÜ');
  assert.strictEqual(H.turkceOnar('Ýzmir þehir ðol Þule').metin, 'İzmir şehir ğol Şule'); assert.strictEqual(H.turkceOnar('temiz metin çğş').onarilan, 0); assert.strictEqual(H.turkceOnar('kay�p').kayip, 1);
  ok('Bozuk harf: iki kod sayfasının tüm Türkçe harfleri, temiz metne dokunmaz, kayıp harf sayılır');

  // --- CSV ---
  assert.deepStrictEqual(H.csvOku('a;"b;c";d\r\n1;"x""y";\n\n"satır\nsonu";2', ';'), [['a', 'b;c', 'd'], ['1', 'x"y', ''], [''], ['satır\nsonu', '2']]); assert.deepStrictEqual(H.csvOku('﻿a,b', ','), [['a', 'b']]); assert.deepStrictEqual(H.csvOku('a;b\n', ';'), [['a', 'b']]);
  assert.strictEqual(H.ayracBul('ad;fiyat;adet\nçay;1,5;2\nkek;3,5;1'), ';'); assert.strictEqual(H.ayracBul('ad,fiyat\nçay,12'), ','); assert.strictEqual(H.ayracBul('a\tb\nc\td'), '\t'); assert.strictEqual(H.ayracBul('a|b|c\nc|d|e'), '|'); assert.strictEqual(H.ayracBul('tek sütun\nikinci'), ';');
  assert.strictEqual(H.csvYaz([['a;b', 'x"y', 1.5], ['ç', null, 'c\nd']], ';'), '"a;b";"x""y";1,5\r\nç;;"c\nd"'); assert.strictEqual(H.csvYaz([[1.5]], ','), '1.5');
  const gd = [['a', 'b;"c', 'satır\nsonu'], ['1', '', '3']]; assert.deepStrictEqual(H.csvOku(H.csvYaz(gd, ';'), ';'), gd);
  ok('CSV: tırnak, satır sonu, ayraç bulma, yazma ve geri okuma');

  // --- Temizleme ---
  const t = H.tabloTemizle([['Ad', 'Fiyat', ''], ['  KÄ±rmÄ±zÄ±  Kalem', '10', ''], ['', '', ''], ['kırmızı kalem', '10', ''], ['Silgi​', '5', ''], ['Eksik']], { onar: true, bosluk: true, bosSatir: true, bosSutun: true, tekrar: true });
  assert.deepStrictEqual(t.satirlar, [['Ad', 'Fiyat'], ['Kırmızı Kalem', '10'], ['Silgi', '5'], ['Eksik', '']]); assert.strictEqual(t.rapor.bosSatir, 1); assert.strictEqual(t.rapor.bosSutun, 1); assert.strictEqual(t.rapor.tekrar, 1); assert.deepStrictEqual(t.rapor.uyumsuz, [{ satir: 6, sutun: 1 }]); assert.strictEqual(t.rapor.gorunmez, 2);
  const s2 = [['Kod', 'Ad'], ['1', 'a'], ['1', 'b'], ['', 'c'], ['', 'd']]; assert.strictEqual(H.tabloTemizle(s2, { tekrar: true, tekrarSutun: 'kod' }).satirlar.length, 4); assert.strictEqual(H.tabloTemizle(s2, { tekrar: true, tekrarSutun: '2' }).rapor.tekrar, 0); assert.throws(() => H.tabloTemizle(s2, { tekrar: true, tekrarSutun: 'Yok' }), /bulunamadı/);
  assert.throws(() => H.tabloTemizle([], {}), /veri/); assert.throws(() => H.tabloTemizle([['']], { bosSatir: true }), /veri/); assert.deepStrictEqual(H.tabloTemizle([['a  b ']], {}).satirlar, [['a  b ']]);
  const bk = H.tabloTemizle([[1, 'ç'], [1, 'ç']], { tekrar: true }); assert.strictEqual(bk.rapor.tekrar, 0); assert.strictEqual(H.tabloTemizle([['b'], [1, 'ç'], [1, 'ç']], { tekrar: true }).rapor.tekrar, 1);
  ok('Tablo temizleme: harf, görünmez boşluk, boş satır ve sütun, yineleme, sütun sayısı uyarısı');
  const zaman = Date.now(); const buyuk = Array.from({ length: 200000 }, (_, i) => [`  ürün ${i % 150000} `, String(i), '']); const bt = H.tabloTemizle(buyuk, { onar: true, bosluk: true, bosSutun: true, bosSatir: true, tekrar: true, tekrarSutun: '1' }); assert.strictEqual(bt.satirlar.length, 150001); assert.ok(Date.now() - zaman < 5000, `${Date.now() - zaman} ms`);
  ok(`200 bin satır ${Date.now() - zaman} ms`);

  // --- Dosya kodlaması ---
  const iso = new Uint8Array([0xde, 0x65, 0x6d, 0x73, 0x69, 0x79, 0x65, 0x3b, 0xfe]); const e = D.metinCoz(iso); assert.strictEqual(e.metin, 'Şemsiye;ş'); assert.match(e.kodlama, /1254/);
  assert.strictEqual(D.metinCoz(new TextEncoder().encode('Şemsiye')).kodlama, 'UTF-8'); assert.strictEqual(D.metinCoz(new Uint8Array([0xff, 0xfe, 0x5f, 0x01])).metin, 'ş');
  ok('Kodlama: Windows-1254, UTF-8, UTF-16');

  // --- XLSX: kendi çıktımız geri okunur ---
  const giris = [['Ad', 'Barkod', 'Fiyat', 'Tarih', 'Not'], ['Çay & <Kek>', '08690000000012', '1.234,56', '31.10.2026', 'x'], ['Sayı', 8690000000012, 149.9, '', 'Tırnak "'], ['Uzun', '12345678901', '149,90', '32.13.2026', ' boşluk '], ['', '', '', '', 'ek']];
  const x = await D.xlsxOku(D.xlsxYaz(giris)); assert.deepStrictEqual(x.sayfalar, ['Temiz']); assert.deepStrictEqual(x.satirlar[1], ['Çay & <Kek>', '08690000000012', 1234.56, '31.10.2026', 'x']); assert.deepStrictEqual(x.satirlar[2], ['Sayı', 8690000000012, 149.9, '', 'Tırnak "']); assert.deepStrictEqual(x.satirlar[3], ['Uzun', '12345678901', 149.9, '32.13.2026', ' boşluk ']); assert.deepStrictEqual(x.satirlar[4], ['', '', '', '', 'ek']);
  assert.strictEqual(D.sayiMi('0123'), null); assert.strictEqual(D.sayiMi('12345678901'), null); assert.strictEqual(D.sayiMi('1.234'), 1234); assert.strictEqual(D.sayiMi('12.5'), null); assert.strictEqual(D.sayiMi('0,5'), 0.5); assert.strictEqual(D.tarihSeri('29.02.2026'), null); assert.strictEqual(D.tarihSeri('01.01.2026'), 46023);
  const bt2 = Array.from({ length: 5000 }, (_, i) => [`Ürün adı ${i % 50}`, 'Sabit açıklama metni', i]); const sk = await D.xlsxSikisik(bt2), ac = D.xlsxYaz(bt2); assert.ok(sk.length * 5 < ac.length, `${sk.length} / ${ac.length}`); assert.deepStrictEqual((await D.xlsxOku(sk)).satirlar, (await D.xlsxOku(ac)).satirlar); assert.deepStrictEqual((await D.xlsxOku(await D.xlsxSikisik(giris))).satirlar[1], x.satirlar[1]);
  ok('XLSX yazma ve okuma: Türkçe, kaçış, sayı, tarih, başı sıfırlı kod, sıkıştırma');

  // --- XLSX: dış üreticilerin biçimi (paylaşılan metin, deflate, biçim stilleri, boş hücre, zengin metin, formül) ---
  const paket = async (d) => { const P = Object.entries(d).map(([ad, m]) => { const v = zlib.deflateRawSync(Buffer.from(m, 'utf8')); return { ad, ham: new TextEncoder().encode(m), v }; }); const z = D.zip(P.map((p) => ({ ad: p.ad, veri: p.v }))); const w = new DataView(z.buffer, z.byteOffset); let c = w.getUint32(z.length - 6, true); P.forEach((p, i) => { w.setUint16(c + 10, 8, true); w.setUint32(c + 24, p.ham.length, true); const ad = new TextEncoder().encode(p.ad).length; c += 46 + ad; assert.ok(i >= 0); }); return z; };
  const NS = 'xmlns:r="urn:r"'; const px = await paket({
    'xl/workbook.xml': `<workbook ${NS}><workbookPr/><sheets><sheet name="Sayfa&amp;1" sheetId="1" r:id="rId1"/><sheet name="Gizli" sheetId="2" state="hidden" r:id="rId2"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
    'xl/sharedStrings.xml': '<sst><si><t>Ad</t></si><si><r><t>Kal</t></r><r><t xml:space="preserve">em </t></r><rPh sb="0" eb="1"><t>yok</t></rPh></si><si/><si><t>a_x000D_b &amp; c</t></si></sst>',
    'xl/styles.xml': '<styleSheet><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy;@"/><numFmt numFmtId="165" formatCode="#,##0.00\\ &quot;TL&quot;"/></numFmts><cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs></styleSheet>',
    'xl/worksheets/sheet1.xml': '<worksheet><cols><col min="1" max="2"/></cols><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Satır</t></is></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" s="1"><v>46326</v></c><c r="C2" s="2"><v>46326.5</v></c><c r="D2" s="3"><v>0.30000000000000004</v></c></row><row r="3"/><row r="4"><c r="B4" t="b"><v>1</v></c><c r="C4" t="str"><f>A1</f><v>Ad</v></c><c r="D4" t="e"><v>#REF!</v></c><c r="E4" t="s"><v>3</v></c></row></sheetData></worksheet>',
    'xl/worksheets/sheet2.xml': '<x:worksheet><x:sheetData><x:row><x:c><x:v>7</x:v></x:c><x:c t="inlineStr"><x:is><x:t>gizli</x:t></x:is></x:c></x:row></x:sheetData></x:worksheet>',
  });
  const r1 = await D.xlsxOku(px); assert.deepStrictEqual(r1.sayfalar, ['Sayfa&1', 'Gizli']); assert.deepStrictEqual(r1.satirlar, [['Ad', '', 'Satır', '', ''], ['Kalem ', '31.10.2026', '31.10.2026 12:00', 0.3, ''], ['', '', '', '', ''], ['', 'DOĞRU', 'Ad', '#REF!', 'ab & c']]); assert.strictEqual(r1.gizli, false);
  const r2 = await D.xlsxOku(px, 2); assert.deepStrictEqual(r2.satirlar, [[7, 'gizli']]); assert.strictEqual(r2.gizli, true); await assert.rejects(D.xlsxOku(px, 3), /3\. sayfa yok/);
  await assert.rejects(D.xlsxOku(new Uint8Array(100)), /açılamadı/); await assert.rejects(D.xlsxOku(D.zip([{ ad: 'a.txt', veri: new Uint8Array(3) }])), /gerçek bir Excel/);
  assert.strictEqual(D.excelTarih(1, 1, true), '02.01.1904'); assert.strictEqual(D.excelTarih(0.75, 2), '18:00');
  ok('XLSX okuma: deflate, paylaşılan ve zengin metin, tarih stilleri, gizli sayfa, ön ekli etiket, bozuk dosya');
  const fx = path.join(__dirname, 'fixtures/cari-baska-program.xlsx'); if (fs.existsSync(fx)) { const y = await D.xlsxOku(new Uint8Array(fs.readFileSync(fx))); assert.ok(y.satirlar.length > 0); assert.ok(y.satirlar.flat().some((c) => /\p{L}/u.test(String(c)))); ok(`Gerçek dosya: cari-baska-program.xlsx ${y.satirlar.length} satır`); }

  // --- Liste ---
  const l = H.listeKarsilastir({ a: K('liste-karsilastirma').alanlar[0].deger, b: K('liste-karsilastirma').alanlar[1].deger, kip: 'esnek' });
  assert.deepStrictEqual(l.ortak, ['Ayşe Yılmaz', 'MEHMET KAYA', 'Ali Çelik']); assert.deepStrictEqual(l.yalnizA, ['Fatma Şahin', 'Zeynep Demir']); assert.deepStrictEqual(l.yalnizB, ['Hasan Öztürk', 'Elif Arslan']); assert.strictEqual(l.tekrarA, 1); assert.strictEqual(l.farkli, 2);
  assert.deepStrictEqual(H.listeKarsilastir({ a: K('liste-karsilastirma').alanlar[0].deger, b: K('liste-karsilastirma').alanlar[1].deger, kip: 'tam' }).ortak, ['Ali Çelik']);
  assert.deepStrictEqual(H.listeKarsilastir({ a: '0532 111 22 33\n+90 (532) 444 55 66\n00905327778899', b: '5321112233\n05324445566\n532 777 88 99', kip: 'telefon' }).yalnizA, []);
  assert.strictEqual(H.listeKarsilastir({ a: 'IŞIK\nİZMİR', b: 'ışık\nizmir', kip: 'harf' }).ortak.length, 2); assert.strictEqual(H.listeKarsilastir({ a: 'a\tx\nb;y', b: 'a\nb', ilk: true, kip: 'tam' }).ortak.length, 2); assert.strictEqual(H.listeKarsilastir({ a: 'a ', b: 'a', kip: 'tam' }).ortak.length, 1);
  assert.throws(() => H.listeKarsilastir({ a: '', b: '' }), /İki listeye/); assert.throws(() => H.listeKarsilastir({ a: 'x', b: ' ' }), /İkinci liste boş/); assert.throws(() => H.listeKarsilastir({ a: '', b: 'x' }), /Birinci liste boş/);
  const zl = Date.now(); const bl = H.listeKarsilastir({ a: Array.from({ length: 100000 }, (_, i) => `müşteri ${i}`).join('\n'), b: Array.from({ length: 100000 }, (_, i) => `MÜŞTERİ ${i + 50000}`).join('\n'), kip: 'esnek' }); assert.strictEqual(bl.ortak.length, 50000); assert.ok(Date.now() - zl < 3000);
  ok('Liste karşılaştırma: dört eşleşme kipi, yineleme, boş liste, 100 bin satır');

  // --- IBAN ---
  assert.ok(H.ibanDenetle('TR33 0006 1005 1978 6457 8413 26').gecerli); assert.ok(H.ibanDenetle('tr33-0006-1005-1978-6457-8413-26').gecerli); assert.ok(H.ibanDenetle('IBAN: TR330006100519786457841326').gecerli); assert.strictEqual(H.ibanDenetle('TR330006100519786457841326').kod, '00061');
  assert.ok(H.ibanDenetle('TR29 9999 9000 0000 000A BCD1 23').gecerli, 'hesap alanında harf serbest');
  const hata = (s, re) => { const r = H.ibanDenetle(s); assert.ok(!r.gecerli && re.test(r.hata), `${s}: ${r.hata}`); };
  hata('', /boş/); hata('TR330006100519786457841327', /Kontrol/); hata('TR330006100519786475841326', /Kontrol/); hata('TR3300061005197864578413', /24 karakter/); hata('TR3300061005197864578413261', /27 karakter/); hata('DE89370400440532013000', /yalnız TR/); hata('TR33000610051978645784132Ş', /Türkçe/); hata('TR3300061_0519786457841326', /Harf ve rakam/); hata('TR33ABCDE00000000000000000', /İlk 10/);
  const rz = (() => { for (let c = 2; c < 99; c++) { const t = `TR${String(c).padStart(2, '0')}0006110000000000000001`; if (H.ibanMod(t) === 1) return t; } })(); hata(rz, /rezerv/);
  const ib = H.ibanListe(K('iban-dogrulama').alanlar[0].deger); assert.deepStrictEqual(ib.satirlar.map((x) => x.gecerli), [true, true, false, false, true, true]); assert.strictEqual(ib.satirlar[5].onceki, 1); assert.strictEqual(ib.tekrar, 1); assert.strictEqual(ib.satirlar[0].etiket, 'Örnek Personel 1'); assert.match(ib.satirlar[2].hata, /Kontrol/); assert.match(ib.satirlar[3].hata, /25 karakter/); assert.throws(() => H.ibanListe('  \n'), /En az bir/);
  assert.strictEqual(H.ibanListe('Ali\tTR33 0006 1005 1978 6457 8413 26\tMaaş').satirlar[0].etiket, 'Ali Maaş');
  ok('IBAN: MOD 97-10, tebliğ alanları, her hata türü, harfli hesap, toplu liste, tekrar');

  // --- İş günü ---
  const tk = H.tatilTakvim(2026); assert.strictEqual(tk['2026-03-19'].yarim, true); assert.strictEqual(tk['2026-03-22'].ad, 'Ramazan Bayramı 3. gün'); assert.strictEqual(tk['2026-03-23'], undefined); assert.strictEqual(tk['2026-05-30'].ad, 'Kurban Bayramı 4. gün'); assert.strictEqual(tk['2026-05-31'], undefined); assert.strictEqual(tk['2026-10-28'].yarim, true); assert.strictEqual(tk['2026-07-15'].yarim, false);
  assert.strictEqual(Object.keys(H.tatilTakvim(2026)).length, 8 + 4 + 5); const t27 = H.tatilTakvim(2027); assert.match(t27['2027-05-19'].ad, /Gençlik.*Kurban Bayramı 4\. gün/); assert.strictEqual(t27['2027-05-19'].yarim, false); assert.strictEqual(H.tatilTakvim(2028)['2028-02-26'].ad, 'Ramazan Bayramı 1. gün'); assert.strictEqual(H.tatilTakvim(2028)['2028-05-08'].ad, 'Kurban Bayramı 4. gün'); assert.throws(() => H.tatilTakvim(2029), /2029/);
  assert.deepStrictEqual(H.isGunuEkle({ bas: '2026-11-02', gun: 10 }).tarih, '2026-11-16'); const f = H.isGunuFark({ bas: '2026-10-26', bit: '2026-10-30' }); assert.strictEqual(f.isGunu, 3.5); assert.strictEqual(f.takvim, 5); assert.strictEqual(H.isGunuFark({ bas: '2026-10-26', bit: '2026-10-30', yarim: 'tam' }).isGunu, 4);
  assert.strictEqual(H.isGunuFark({ bas: '2026-10-26', bit: '2026-10-30', basDahil: false }).isGunu, 2.5); assert.strictEqual(H.isGunuFark({ bas: '2026-11-07', bit: '2026-11-08' }).isGunu, 0); assert.strictEqual(H.isGunuFark({ bas: '2026-11-07', bit: '2026-11-08', hafta: 'cmt' }).isGunu, 1); assert.strictEqual(H.isGunuFark({ bas: '2026-11-02', bit: '2026-11-02' }).isGunu, 1);
  assert.strictEqual(H.isGunuFark({ bas: '2027-03-08', bit: '2027-03-12' }).isGunu, 1.5); assert.strictEqual(H.isGunuFark({ bas: '2026-12-28', bit: '2027-01-04' }).isGunu, 5);
  assert.throws(() => H.isGunuFark({ bas: '2026-02-02', bit: '2026-02-01' }), /önce/); assert.throws(() => H.isGunuFark({ bas: '2026-01-01', bit: '2029-01-01' }), /2029/); assert.throws(() => H.isGunuEkle({ bas: '2028-12-29', gun: 5 }), /2029/); assert.throws(() => H.isGunuEkle({ bas: '2025-12-31', gun: 1 }), /2025/); assert.throws(() => H.isGunuEkle({ bas: '2026-01-02', gun: 0 }), /1 ile 1000/); assert.throws(() => H.isGunuEkle({ bas: '2026-01-02', gun: 1.5 }), /tam sayı/); assert.throws(() => H.isGunuEkle({ bas: 'x', gun: 1 }), /geçerli/);
  assert.strictEqual(H.isGunuEkle({ bas: '2026-11-16', gun: 10, yon: -1 }).tarih, '2026-11-02'); assert.strictEqual(H.isGunuEkle({ bas: '2026-10-27', gun: 1 }).tarih, '2026-10-30'); assert.strictEqual(H.isGunuEkle({ bas: '2026-10-27', gun: 2 }).tarih, '2026-11-02'); assert.strictEqual(H.gunAdi('2026-10-31'), 'Cumartesi');
  ok('İş günü: kanundaki günler, Diyanet tarihleri, yarım gün, hafta düzeni, yıl sınırı, sayfa örnekleri');

  // --- Sayfalar ---
  YENI.forEach((s) => { const a = K(s); assert.ok(a.baslik.length <= 70, `${s}: başlık ${a.baslik.length}`); assert.ok(a.ozet.length <= 165, `${s}: özet ${a.ozet.length}`); });
  const metin = K('is-gunu-hesaplama').ornek.metin.join(' '); assert.ok(metin.includes('16 Kasım 2026') && metin.includes('11 Kasım') && H.isGunuEkle({ bas: '2026-10-26', gun: 10 }).tarih === '2026-11-11' && metin.includes('3,5'));
  assert.ok(K('turkce-metin-duzenleme').ornek.metin[0].includes(H.kelimeBuyuk('IŞIK İNŞAAT SANAYİ VE TİCARET LTD. ŞTİ.')));
  const cs = K('csv-excel-temizleme'); const v = {}; cs.alanlar.forEach((f) => { v[f.ad] = f.tip === 'onay' ? !!f.deger : f.deger; }); const ct = H.tabloTemizle(H.csvOku(v.veri, H.ayracBul(v.veri)), v); assert.strictEqual(ct.satirlar.length, 4, 'başlık + 3 ürün'); assert.strictEqual(ct.satirlar[0].length, 3); assert.strictEqual(ct.satirlar[1][0], 'Kırmızı Çaydanlık'); assert.strictEqual(ct.satirlar[2][0], 'Bardak Takımı'); assert.strictEqual(ct.satirlar[3][0], 'Şemsiye');
  ok('Sayfa örnekleri hesapla tutarlı, başlık ve açıklama sınırı');
  console.log(`\nVeri araçları: ${n} test grubu geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
