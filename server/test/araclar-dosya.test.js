// Dosya araçlarının saf mantığı ve gömülü pdf-lib ile gerçek PDF işlemleri
//   node server/test/araclar-dosya.test.js
const assert = require('assert'); const path = require('path'); const zlib = require('zlib');
const D = require(path.join(__dirname, '../../site/tools/araclar/dosya.js'));
const PDFLib = require(path.join(__dirname, '../../site/assets/vendor/pdf-lib-1.17.1/pdf-lib.min.js'));
let n = 0; const ok = (m) => { n++; console.log('✓', m); };
const te = (s) => new TextEncoder().encode(s);
const bir = (...p) => { const c = new Uint8Array(p.reduce((t, x) => t + x.length, 0)); let o = 0; p.forEach((x) => { c.set(x, o); o += x.length; }); return c; };

(async () => {
  // --- Sayfa aralığı ---
  assert.deepStrictEqual(D.sayfaAraligi('', 3), [0, 1, 2]); assert.deepStrictEqual(D.sayfaAraligi('1-2, 5, 4-', 6), [0, 1, 4, 3, 4, 5]); assert.deepStrictEqual(D.sayfaAraligi('3-1', 3), [2, 1, 0]); assert.deepStrictEqual(D.sayfaAraligi('-2', 3), [0, 1]);
  assert.throws(() => D.sayfaAraligi('9', 3), /dışında/); assert.throws(() => D.sayfaAraligi('a', 3), /geçerli/); assert.throws(() => D.sayfaAraligi('0', 3), /dışında/);
  assert.deepStrictEqual(D.bolmeGruplari(5, { kip: 'her', her: 2 }), [[0, 1], [2, 3], [4]]); assert.deepStrictEqual(D.bolmeGruplari(6, { kip: 'aralik', aralik: '1-3, 6' }), [[0, 1, 2], [5]]); assert.throws(() => D.bolmeGruplari(5, { kip: 'her', her: 0 })); assert.throws(() => D.bolmeGruplari(5, { kip: 'aralik', aralik: '' }));
  assert.strictEqual(D.sayfaNumarasi('sayfat', 3, 12), 'Sayfa 3 / 12'); ok('Sayfa aralığı, bölme, numara');

  // --- Ad ve boyut ---
  assert.strictEqual(D.dosyaAdi('C:\\x\\Fatura Ekim.PDF', 'kucuk', 'pdf'), 'Fatura Ekim-kucuk.pdf'); assert.strictEqual(D.dosyaKok('a<b>.jpg'), 'ab'); assert.strictEqual(D.boyutYaz(512), '512 B'); assert.strictEqual(D.boyutYaz(1536), '1,5 KB'); assert.deepStrictEqual(D.adlariAyir(['a.pdf', 'A.pdf', 'b.pdf']), ['a.pdf', 'A-2.pdf', 'b.pdf']); ok('Dosya adı ve boyut');

  // --- Ölçü ---
  let r = D.olcek(3000, 4000, { gen: 1000, yuk: 1000, kip: 'kenar' }); assert.deepStrictEqual([r.w, r.h, r.hedef.w, r.hedef.h, r.hedef.x, r.hedef.y], [1000, 1000, 750, 1000, 125, 0]);
  r = D.olcek(3000, 4000, { gen: 1000, yuk: 1000, kip: 'kapla' }); assert.deepStrictEqual([r.w, r.h, r.kaynak.x, r.kaynak.y, r.kaynak.w, r.kaynak.h], [1000, 1000, 0, 500, 3000, 3000]);
  r = D.olcek(3000, 4000, { gen: 1000, yuk: 1000, kip: 'sigdir' }); assert.deepStrictEqual([r.w, r.h], [750, 1000]); r = D.olcek(100, 50, { gen: 200 }); assert.deepStrictEqual([r.w, r.h], [200, 100]); r = D.olcek(100, 50, { yuk: 10 }); assert.deepStrictEqual([r.w, r.h], [20, 10]); r = D.olcek(100, 50, { gen: 30, yuk: 30, kip: 'esnet' }); assert.deepStrictEqual([r.w, r.h], [30, 30]);
  assert.deepStrictEqual(D.konum(100, 100, 10, 10, 'alt-sag', 5), { x: 85, y: 85 }); assert.deepStrictEqual(D.konum(100, 100, 10, 10, 'orta'), { x: 45, y: 45 }); assert.deepStrictEqual(D.konum(100, 100, 10, 10, 'ust-orta', 5), { x: 45, y: 5 });
  assert.ok(D.filigranIzgara(100, 100, 30, 30).length > 9); assert.throws(() => D.filigranIzgara(10, 10, 0, 5)); ok('Ölçü, konum, ızgara');

  // --- Hedef boyut arama ---
  let say = 0; const u = (q) => { say++; return { boyut: Math.round(q * 1000) }; }; let a = await D.kaliteAra(u, 500); assert.ok(a.uydu && a.boyut <= 500 && a.boyut > 470, a.boyut); assert.ok(say <= 10); a = await D.kaliteAra(u, 100); assert.strictEqual(a.uydu, false); a = await D.kaliteAra(u, 5000); assert.strictEqual(a.kalite, 0.92); ok('Hedef boyuta en yüksek kaliteyle iner, inemezse söyler');

  // --- EXIF ---
  const tiff = () => { // II*: IFD0(Make, Orientation, GPS ptr) + GPS IFD (N 41 1 12, E 29 2 0)
    const b = new Uint8Array(200); const v = new DataView(b.buffer); b.set([0x49, 0x49, 0x2a, 0], 0); v.setUint32(4, 8, true); v.setUint16(8, 3, true);
    const yaz = (o, t, ty, c, d) => { v.setUint16(o, t, true); v.setUint16(o + 2, ty, true); v.setUint32(o + 4, c, true); v.setUint32(o + 8, d, true); };
    yaz(10, 0x010f, 2, 6, 60); b.set(te('Apple\0'), 60); yaz(22, 0x0112, 3, 1, 6); yaz(34, 0x8825, 4, 1, 70);
    v.setUint16(70, 4, true); yaz(72, 1, 2, 2, 0); b[80] = 78; yaz(84, 2, 5, 3, 130); yaz(96, 3, 2, 2, 0); b[104] = 69; yaz(108, 4, 5, 3, 154);
    [[41, 1], [1, 1], [12, 1]].forEach(([p, q], i) => { v.setUint32(130 + i * 8, p, true); v.setUint32(134 + i * 8, q, true); }); [[29, 1], [2, 1], [0, 1]].forEach(([p, q], i) => { v.setUint32(154 + i * 8, p, true); v.setUint32(158 + i * 8, q, true); }); return b;
  };
  const seg = (m, g) => bir(new Uint8Array([0xff, m, ((g.length + 2) >> 8) & 255, (g.length + 2) & 255]), g);
  const app0 = seg(0xe0, te('JFIF\0ABCDEFGHI')); const dqt = seg(0xdb, new Uint8Array(67).fill(7)); const sos = bir(new Uint8Array([0xff, 0xda, 0, 2]), new Uint8Array([1, 2, 3, 0xff, 0, 4]), new Uint8Array([0xff, 0xd9]));
  const jpeg = bir(new Uint8Array([0xff, 0xd8]), app0, seg(0xe1, bir(te('Exif\0\0'), tiff())), seg(0xe1, te('http://ns.adobe.com/xap/1.0/\0<x/>')), seg(0xed, te('Photoshop 3.0\0abc')), seg(0xe2, te('ICC_PROFILE\0\x01\x01data')), seg(0xee, te('Adobe\0abcdefg')), seg(0xfe, te('gizli yorum')), dqt, sos);
  const m = D.metaOku(jpeg); assert.strictEqual(m.tur, 'jpeg'); assert.strictEqual(m.exif.marka, 'Apple'); assert.strictEqual(m.exif.yon, 6); assert.deepStrictEqual(m.exif.gps, { lat: 41.02, lon: 29.033333 }); assert.deepStrictEqual(m.bloklar, ['EXIF', 'XMP', 'IPTC', 'Yorum']); ok('EXIF: cihaz, yön ve GPS okunur');
  const t = D.jpegTemizle(jpeg); const tm = D.metaOku(t); const metin = Buffer.from(t).toString('latin1');
  assert.strictEqual(tm.exif.gps, undefined); assert.strictEqual(tm.exif.marka, undefined); assert.strictEqual(tm.exif.yon, 6, 'yön korunur'); assert.deepStrictEqual(tm.bloklar, ['EXIF']); for (const s of ['Apple', 'xap', 'Photoshop', 'gizli yorum']) assert.ok(!metin.includes(s), s); for (const s of ['JFIF', 'ICC_PROFILE', 'Adobe']) assert.ok(metin.includes(s), s);
  assert.ok(Buffer.from(t).subarray(-(sos.length)).equals(Buffer.from(sos)), 'görüntü verisi baytı baytına aynı'); assert.ok(Buffer.from(t).includes(Buffer.from(dqt)));
  const yonsuz = bir(new Uint8Array([0xff, 0xd8]), app0, seg(0xfe, te('not')), dqt, sos); const yt = D.jpegTemizle(yonsuz); assert.deepStrictEqual(D.metaOku(yt).bloklar, []); assert.strictEqual(yt.length, yonsuz.length - 7); ok('JPEG temizleme: bilgi gider, yön ve görüntü verisi kalır');
  assert.throws(() => D.metaOku(bir(new Uint8Array([0xff, 0xd8, 0x12, 0x34, 0, 2])))); assert.throws(() => D.temizle(te('merhaba dunya'))); const bozuk = bir(new Uint8Array([0xff, 0xd8]), seg(0xe1, bir(te('Exif\0\0'), new Uint8Array([0x49, 0x49, 0x2a, 0, 0xff, 0xff, 0xff, 0xff])))); assert.deepStrictEqual(D.metaOku(bir(bozuk, sos)).exif, {}); ok('Bozuk dosya: hata veya boş sonuç, askıda kalma yok');

  const parca = (ad, g) => { const b = new Uint8Array(12 + g.length); new DataView(b.buffer).setUint32(0, g.length); b.set(te(ad), 4); b.set(g, 8); new DataView(b.buffer).setUint32(8 + g.length, D.crc32(b.subarray(4, 8 + g.length))); return b; };
  const png = bir(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca('IHDR', new Uint8Array(13)), parca('tEXt', te('Author\0Ali')), parca('eXIf', tiff()), parca('tIME', new Uint8Array(7)), parca('IDAT', new Uint8Array([1, 2, 3])), parca('IEND', new Uint8Array(0)));
  const pm = D.metaOku(png); assert.deepStrictEqual(pm.exif.gps, { lat: 41.02, lon: 29.033333 }); const pt = D.pngTemizle(png); const pmt = D.metaOku(pt); assert.deepStrictEqual(pmt.bloklar, []); assert.ok(!Buffer.from(pt).toString('latin1').includes('Author')); assert.ok(Buffer.from(pt).toString('latin1').includes('IDAT')); ok('PNG temizleme');
  const wp = (ad, g) => { const p = g.length & 1; const b = new Uint8Array(8 + g.length + p); b.set(te(ad), 0); new DataView(b.buffer).setUint32(4, g.length, true); b.set(g, 8); return b; }; const icW = bir(te('WEBP'), wp('VP8X', new Uint8Array([0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0])), wp('VP8 ', new Uint8Array([9, 9, 9])), wp('EXIF', tiff()), wp('XMP ', te('<x/>'))); const rif = bir(te('RIFF'), new Uint8Array(4), icW); new DataView(rif.buffer).setUint32(4, icW.length, true);
  assert.deepStrictEqual(D.metaOku(rif).exif.gps, { lat: 41.02, lon: 29.033333 }); const wt = D.webpTemizle(rif); assert.deepStrictEqual(D.metaOku(wt).bloklar, []); assert.strictEqual(new DataView(wt.buffer).getUint32(4, true), wt.length - 8); assert.strictEqual(wt[20] & 0x0c, 0); ok('WebP temizleme: parça, bayrak ve RIFF boyutu doğru');

  // --- ZIP, ICO ---
  assert.strictEqual(D.crc32(te('123456789')), 0xcbf43926); const z = D.zip([{ ad: 'şirket.txt', veri: te('merhaba') }, { ad: 'şirket.txt', veri: te('dünya') }]); const zb = Buffer.from(z); const ucn = zb.length - 22; assert.strictEqual(zb.readUInt32LE(ucn), 0x06054b50); assert.strictEqual(zb.readUInt16LE(ucn + 10), 2); assert.ok(zb.includes(Buffer.from('şirket-2.txt'))); const mz = zb.readUInt32LE(ucn + 16); assert.strictEqual(zb.readUInt32LE(mz), 0x02014b50); ok('ZIP: CRC, Türkçe ad, aynı ad ayrımı');
  const ic = D.ico([{ boyut: 16, png: new Uint8Array(5) }, { boyut: 256, png: new Uint8Array(3) }]); const iv = new DataView(ic.buffer); assert.deepStrictEqual([iv.getUint16(2, true), iv.getUint16(4, true), ic[6], ic[22], iv.getUint32(14, true), iv.getUint32(18, true), iv.getUint32(34, true), ic.length], [1, 2, 16, 0, 5, 38, 43, 46]); ok('ICO başlığı');

  // --- Piksel ---
  const W = 6, H = 6; const px = new Uint8ClampedArray(W * H * 4).fill(255); const koy = (x, y, c) => px.set([...c, 255], (y * W + x) * 4); for (let y = 2; y < 4; y++) for (let x = 2; x < 4; x++) koy(x, y, [0, 0, 0]); koy(2, 2, [255, 255, 255]);
  assert.deepStrictEqual(D.kenarRengi(px, W, H), [255, 255, 255]); const m1 = D.arkaPlanMaske(px, W, H, { renk: [255, 255, 255], tol: 10 }); assert.strictEqual(m1[2 * W + 3], 0); assert.strictEqual(m1[0], 1); assert.strictEqual(m1[2 * W + 2], 1, 'köşeden bağlı');
  const halka = new Uint8ClampedArray(25 * 4).fill(255); [6, 7, 8, 11, 13, 16, 17, 18].forEach((i) => halka.set([0, 0, 0, 255], i * 4)); assert.strictEqual(D.arkaPlanMaske(halka, 5, 5, { renk: [255, 255, 255], tol: 10 })[12], 0, 'iç boşluk korunur'); assert.strictEqual(D.arkaPlanMaske(halka, 5, 5, { renk: [255, 255, 255], tol: 10, heryer: true })[12], 1, 'heryer iç boşluğu da siler');
  const a2 = D.arkaPlanUygula(new Uint8ClampedArray(px), m1, W, H, { renk: [255, 255, 255], tol: 10 }); assert.strictEqual(a2[3], 0); assert.strictEqual(a2[(2 * W + 3) * 4 + 3], 255);
  const mz2 = new Uint8ClampedArray(16).fill(0); mz2.set([100, 0, 0, 255], 0); mz2.set([200, 0, 0, 255], 4); mz2.set([100, 0, 0, 255], 8); mz2.set([200, 0, 0, 255], 12); D.mozaik(mz2, 2, 2, { x: 0, y: 0, w: 2, h: 2 }, 2); assert.ok(mz2[0] === 150 && mz2[4] === 150 && mz2[12] === 150); ok('Arka plan maskesi ve mozaik');

  // --- PDF yerleşim ---
  assert.deepStrictEqual(D.pdfYer(0, 200, 400, { x: 10, y: 20, w: 30, h: 40 }), { x: 10, y: 340, aci: 0 }); assert.deepStrictEqual(D.pdfYer(90, 200, 400, { x: 10, y: 20, w: 30, h: 40 }), { x: 60, y: 10, aci: 90 }); assert.deepStrictEqual(D.pdfYer(180, 200, 400, { x: 10, y: 20, w: 30, h: 40 }), { x: 190, y: 60, aci: 180 }); assert.deepStrictEqual(D.pdfYer(270, 200, 400, { x: 10, y: 20, w: 30, h: 40 }), { x: 140, y: 390, aci: 270 }); assert.deepStrictEqual(D.pdfYer(-90, 200, 400, { x: 10, y: 20, w: 30, h: 40 }).aci, 270); ok('Döndürülmüş PDF sayfasında konum');
  const satir = D.pdfSatirlar([{ str: 'dünya', transform: [10, 0, 0, 10, 60, 100], width: 30, height: 10 }, { str: 'Merhaba', transform: [10, 0, 0, 10, 10, 100], width: 40, height: 10 }, { str: 'Son', transform: [10, 0, 0, 10, 10, 80], width: 20, height: 10 }, { str: 'Sütun', transform: [10, 0, 0, 10, 200, 80], width: 20, height: 10 }]); assert.deepStrictEqual(satir, ['Merhaba dünya', 'Son   Sütun']); ok('PDF metni satırlara dizilir');

  // --- Gerçek PDF (gömülü pdf-lib) ---
  const { PDFDocument, degrees } = PDFLib; const pdf = async (n, w = 200) => { const d = await PDFDocument.create(); for (let i = 0; i < n; i++) { const p = d.addPage([w, 300]); p.drawText(`S${i + 1}`); } return d.save(); };
  const a1 = await PDFDocument.load(await pdf(2)), b1 = await PDFDocument.load(await pdf(3, 400)); const o = await PDFDocument.create(); for (const d of [a1, b1]) (await o.copyPages(d, d.getPageIndices())).forEach((p) => o.addPage(p)); const son = await PDFDocument.load(await o.save({ useObjectStreams: true })); assert.strictEqual(son.getPageCount(), 5); assert.strictEqual(son.getPage(4).getWidth(), 400);
  const g = D.bolmeGruplari(5, { kip: 'her', her: 2 }); const par = await PDFDocument.create(); (await par.copyPages(son, g[2])).forEach((p) => par.addPage(p)); assert.strictEqual((await PDFDocument.load(await par.save())).getPageCount(), 1);
  const dz = await PDFDocument.create(); const [k] = await dz.copyPages(son, [4]); k.setRotation(degrees(90)); dz.addPage(k); assert.strictEqual((await PDFDocument.load(await dz.save())).getPage(0).getRotation().angle, 90); ok('pdf-lib: birleştirme, bölme, döndürme');
  await assert.rejects(PDFDocument.load(te('%PDF-bozuk'))); ok('Bozuk PDF hata verir');
  assert.ok(zlib); console.log(`\nDosya araçları: ${n} test grubu geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
