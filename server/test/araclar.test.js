// Ücretsiz araçlar: hesap fonksiyonları (mevzuat sınır değerleri dahil), sayfa üretimi ve noindex kuralı
//   node server/test/araclar.test.js
const assert = require('assert'); const path = require('path'); const fs = require('fs'); const vm = require('vm');
const H = require(path.join(__dirname, '../../site/tools/araclar/hesap.js'));
const B = require(path.join(__dirname, '../../site/tools/build-araclar.js'));
const KOD = require(path.join(__dirname, '../../core/ebelge/kodlar.js'));
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const yakin = (a, b, e = 0.005) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);

// --- Sayı ve tarih ---
assert.strictEqual(H.sayiOku('1.234,56'), 1234.56); assert.strictEqual(H.sayiOku('1234,5'), 1234.5); assert.strictEqual(H.sayiOku('1234.56'), 1234.56); assert.strictEqual(H.sayiOku('1.234'), 1234); assert.strictEqual(H.sayiOku('12.5'), 12.5); assert.strictEqual(H.sayiOku('1.234.567'), 1234567); assert.strictEqual(H.sayiOku(' 7.500 ₺'), 7500); assert.ok(Number.isNaN(H.sayiOku(''))); assert.ok(Number.isNaN(H.sayiOku('abc')));
ok('sayı okuma: Türkçe ve noktalı biçimler');
assert.deepStrictEqual(H.sure('2019-03-15', '2026-10-31'), { yil: 7, ay: 7, gun: 16, kalanGun: 230, toplamGun: 2787 }); assert.strictEqual(H.sure('2024-02-29', '2025-02-28').yil, 0); assert.throws(() => H.sure('2026-01-02', '2026-01-01'), /önce/); assert.strictEqual(H.tarihOku('2026-02-30'), null);
ok('süre: tam yıl, kalan gün, ters tarih reddi, geçersiz tarih');

// --- KDV, tevkifat ---
assert.deepStrictEqual(H.kdv({ tutar: 1000, oran: 20, dahil: false }), { matrah: 1000, kdv: 200, toplam: 1200 }); assert.deepStrictEqual(H.kdv({ tutar: 1200, oran: 20, dahil: true }), { matrah: 1000, kdv: 200, toplam: 1200 }); assert.deepStrictEqual(H.kdv({ tutar: 1100, oran: 10, dahil: true }), { matrah: 1000, kdv: 100, toplam: 1100 });
ok('KDV: dahil ve hariç yön');
const tv = H.tevkifat({ matrah: 10000, oran: 20, pay: 9 }); assert.deepStrictEqual(tv, { kdv: 2000, tevkif: 1800, saticiKdv: 200, saticiyaOdenen: 10200, faturaToplam: 12000 }); assert.throws(() => H.tevkifat({ matrah: 1, oran: 20, pay: 11 }), /10\/10/);
ok('Tevkifat: 9/10 temizlik örneği, geçersiz pay');
const TV = require(path.join(__dirname, '../../site/src/araclar/kdv-tevkifat-hesaplama.js')).alanlar.find((a) => a.ad === 'islem').secenekler.filter(([v]) => v !== 'elle');
TV.forEach(([v]) => { const [k, p] = v.split('|'); const g = KOD.tevkifat.find((x) => x[0] === k); assert.ok(g, k); assert.strictEqual(Number(p), g[2]); assert.ok(/^6/.test(k)); });
assert.strictEqual(TV.length, KOD.tevkifat.filter(([k]) => /^6/.test(k)).length);
const pay = (k) => KOD.tevkifat.find((x) => x[0] === k)[2]; assert.strictEqual(pay('601'), 4); assert.strictEqual(pay('606'), 9); assert.strictEqual(pay('612'), 9);
ok('Tevkifat listesi GİB kod listesiyle aynı; tebliğle okunan 3 oran (4/10, 9/10, 9/10)');

// --- Kıdem (1475 md. 14) ---
const K = (o) => H.kidem({ giris: '2020-01-01', cikis: '2023-01-01', brut: 30000, tavan: 73729.87, ...o });
assert.strictEqual(K().tazminat, 90000); assert.strictEqual(K().damga, 683.1); assert.strictEqual(K().net, 89316.9);
assert.strictEqual(K({ brut: 100000 }).tazminat, 221189.61); assert.ok(K({ brut: 100000 }).tavanli);
assert.strictEqual(K({ brut: 70000, yanHak: 10000 }).uygulanan, 73729.87);
assert.strictEqual(K({ cikis: '2020-12-31' }).hak, false); assert.strictEqual(K({ cikis: '2020-12-31' }).tazminat, 0);
const k2 = H.kidem({ giris: '2019-03-15', cikis: '2026-10-31', brut: 45000, yanHak: 5000, tavan: 73729.87 }); yakin(k2.katsayi, 7.63, 0.001); assert.strictEqual(k2.tazminat, H.yuvarla(50000 * (7 + 230 / 365)));
ok('Kıdem: tam yıl, kalan gün orantısı, tavan, damga binde 7,59, bir yıl altı');
const kt = require(path.join(__dirname, '../../site/src/araclar/kidem-tazminati-hesaplama.js')).hesap; const kv = { giris: '2020-01-01', cikis: '2027-01-02', brut: 30000 };
assert.throws(() => kt(kv, H), /tavanı/); assert.ok(kt({ ...kv, cikis: '2026-10-01' }, H).includes('73.729,87')); assert.ok(kt({ ...kv, cikis: '2026-06-30' }, H).includes('64.948,77')); assert.ok(kt({ ...kv, cikis: '2026-07-01' }, H).includes('73.729,87')); assert.ok(kt({ ...kv, tavan: 90000 }, H).includes('90.000,00'));
ok('Kıdem tavanı: dönem seçimi; tablo dışı tarihte tutar uydurmaz');

// --- İhbar (4857 md. 17): sınır günleri ---
const sh = (b, s) => H.ihbarHafta(H.sure(b, s));
assert.strictEqual(sh('2026-01-01', '2026-06-30'), 2); assert.strictEqual(sh('2026-01-01', '2026-07-01'), 4); assert.strictEqual(sh('2025-01-01', '2026-07-01'), 4); assert.strictEqual(sh('2025-01-01', '2026-07-02'), 6); assert.strictEqual(sh('2023-01-01', '2026-01-01'), 6); assert.strictEqual(sh('2023-01-01', '2026-01-02'), 8);
const ih = H.ihbar({ giris: '2024-06-01', cikis: '2026-10-30', brut: 40000, gvOrani: 20 }); assert.strictEqual(ih.gun, 42); assert.strictEqual(ih.tazminat, 56000); assert.strictEqual(ih.gv, 11200); assert.strictEqual(ih.damga, 425.04); assert.strictEqual(ih.net, 44374.96);
ok('İhbar: 2/4/6/8 hafta sınır günleri ve tutar');

// --- Yıllık izin (4857 md. 53) ---
const iz = (g, t, e = {}) => H.yillikIzin({ giris: g, tarih: t, ...e });
assert.strictEqual(iz('2026-01-01', '2026-12-31').gun, 0); assert.strictEqual(iz('2025-01-01', '2026-01-01').gun, 14); assert.strictEqual(iz('2021-01-01', '2026-01-01').gun, 14); assert.strictEqual(iz('2020-01-01', '2026-01-01').gun, 20); assert.strictEqual(iz('2012-01-01', '2026-01-01').gun, 20); assert.strictEqual(iz('2011-01-01', '2026-01-01').gun, 26);
assert.strictEqual(iz('2024-01-01', '2026-02-01', { yas: 17 }).gun, 20); assert.strictEqual(iz('2024-01-01', '2026-02-01', { yas: 51 }).gun, 20); assert.strictEqual(iz('2024-01-01', '2026-02-01', { yas: 50 }).gun, 14); assert.strictEqual(iz('2024-01-01', '2026-02-01', { yerAlti: true }).gun, 18);
const iz8 = iz('2018-09-03', '2026-10-30', { kullanilan: 110 }); assert.strictEqual(iz8.toplam, 130); assert.strictEqual(iz8.kalan, 20); assert.strictEqual(iz8.sonrakiHakedis, '2027-09-03');
ok('Yıllık izin: 14/20/26 sınırları, yaş kuralı, yer altı, bakiye');

// --- Fazla mesai (md. 41, 47) ---
const fm = H.fazlaMesai({ brut: 36000, saat50: 12, tatilGun: 1 }); assert.strictEqual(fm.saatUcret, 160); assert.strictEqual(fm.t50, 2880); assert.strictEqual(fm.tatil, 1200); assert.strictEqual(fm.toplam, 4080); assert.strictEqual(fm.serbestZaman, 18);
assert.strictEqual(H.fazlaMesai({ brut: 36000, saat25: 10 }).t25, 2000); assert.ok(H.fazlaMesai({ brut: 1, saat50: 11, yilToplam: 260 }).sinirAsildi); assert.ok(!H.fazlaMesai({ brut: 1, saat50: 10, yilToplam: 260 }).sinirAsildi);
ok('Fazla mesai: %50, %25, tatil, 270 saat sınırı');
const KD = [{ esik: 0, oran: 1 }, { esik: 200000, oran: 2 }]; const pk = H.prim({ satis: 320000, kademeler: KD }); assert.strictEqual(pk.prim, 4400); assert.strictEqual(pk.etkin, 1.38); assert.strictEqual(H.prim({ satis: 320000, kademeler: KD, mod: 'tum' }).prim, 6400); assert.strictEqual(H.prim({ satis: 100, kademeler: [{ esik: 200, oran: 5 }], mod: 'tum' }).prim, 0);
ok('Prim: kademeli ve baraj');

// --- Kira, aidat ---
assert.deepStrictEqual(H.kiraArtis({ kira: 20000, oran: 30, onerilen: 28000 }), { yeni: 26000, fark: 6000, yillikFark: 72000, asiyor: true }); assert.strictEqual(H.kiraArtis({ kira: 20000, oran: 30, onerilen: 26000 }).asiyor, false);
ok('Kira artışı ve sınır kontrolü');
const gt = H.gecikmeTazminati({ tarih: '2026-10-30', satirlar: [{ tutar: 1500, vade: '2026-08-10' }, { tutar: 1500, vade: '2026-09-10' }, { tutar: 1500, vade: '2026-11-10' }, {}] });
assert.deepStrictEqual(gt.satirlar.map((x) => x.gun), [81, 50, 0]); assert.strictEqual(gt.tazminat, 327.5); assert.strictEqual(gt.anapara, 4500); assert.strictEqual(gt.toplam, 4827.5);
ok('Gecikme tazminatı: aylık %5, gün bazlı, bileşik değil, vadesi gelmemiş satır');
// Site programıyla aynı sonuç (apps/site/data.js lateFee: tutar × oran/100 × gün/30)
global.window = {}; global.NS = { pad: (n2) => String(n2).padStart(2, '0') }; require(path.join(__dirname, '../../apps/site/data.js')); const S = window.SITE;
const F = [{ id: 'a', share: 1 }, { id: 'b', share: 2 }, { id: 'c', share: 3 }]; assert.deepStrictEqual(H.dagit([1, 2, 3], 100), Object.values(S.split(F, 100, 'pay')));
const ap = H.aidatPaylas({ daireler: [{ ad: 'D1', arsaPayi: 20 }, { ad: 'D2', arsaPayi: 20 }, { ad: 'D3', arsaPayi: 30 }, { ad: 'D4', arsaPayi: 30 }], esitGider: 360000, arsaGider: 240000, ay: 12 }); assert.deepStrictEqual(ap.satirlar.map((x) => x.toplam), [138000, 138000, 162000, 162000]); assert.deepStrictEqual(ap.satirlar.map((x) => x.aylik), [11500, 11500, 13500, 13500]); assert.strictEqual(ap.toplam, 600000);
const kr = H.aidatPaylas({ daireler: [{ ad: 'a', arsaPayi: 1 }, { ad: 'b', arsaPayi: 1 }, { ad: 'c', arsaPayi: 1 }], esitGider: 100, arsaGider: 100 }); assert.strictEqual(kr.toplam, 200); assert.throws(() => H.aidatPaylas({ daireler: [{ ad: 'a' }], arsaGider: 100 }), /arsa payı/);
ok('Aidat paylaşımı: eşit + arsa payı, kuruş farkı yok, Site programıyla aynı dağıtım');

// --- Ticaret ---
assert.deepStrictEqual(H.desi({ en: 40, boy: 30, yukseklik: 20, bolen: 3000, adet: 2, kg: 4 }), { tek: 8, toplam: 16, kgToplam: 8, buyuk: 16 }); assert.throws(() => H.desi({ en: 1, boy: 1, yukseklik: 1 }), /Bölen/);
ok('Desi: bölen zorunlu, varsayılan yok');
assert.strictEqual(H.altin({ gram: 10, ayar: 22 }).has, 9.167); assert.strictEqual(H.altin({ gram: 10, ayar: 22, milyem: 916 }).has, 9.16); assert.strictEqual(H.altin({ gram: 10, ayar: 24, hasFiyat: 1000, iscilik: 50 }).toplam, 10500); assert.throws(() => H.altin({ gram: 1, milyem: 1200 }), /1000/);
ok('Altın: ayar ÷ 24, milyem önceliği');
const pz = H.pazaryeri({ fiyat: 599.9, kdv: 20, maliyet: 250, komisyon: 15, kargo: 70, kesintiKdv: 20 }); assert.strictEqual(pz.netSatis, 499.92); assert.strictEqual(pz.komisyonTutar, 89.99); assert.strictEqual(pz.kesinti, 133.32); assert.strictEqual(pz.kar, 116.6);
const hf = H.pazaryeriHedef({ marj: 30, kdv: 20, maliyet: 250, komisyon: 15, kargo: 70, kesintiKdv: 20 }); const dg = H.pazaryeri({ fiyat: hf, kdv: 20, maliyet: 250, komisyon: 15, kargo: 70, kesintiKdv: 20 }); yakin(dg.marj, 30, 0.05); assert.throws(() => H.pazaryeriHedef({ marj: 80, kdv: 20, komisyon: 50, kesintiKdv: 20 }), /ulaşılabilir/);
// Fiyat robotu calc ile aynı model (kesinti KDV'si %20 iken)
global.window = {}; require(path.join(__dirname, '../../apps/fiyatrobotu/data.js')); const FRB = global.window.FRB; const cf = FRB.calc({ price: 599.9, cost: 250, vat: 20, com: 15, cargo: 70 }); assert.strictEqual(cf.profit, pz.kar);
ok('Pazaryeri: net kâr, hedef fiyat, Fiyat Robotu ile aynı sonuç');
assert.deepStrictEqual(H.karMarji({ maliyet: 80, satis: 120 }), { kar: 40, marj: 33.33, markup: 50 }); assert.strictEqual(H.hedefFiyat({ maliyet: 80, marj: 35 }), 123.08); assert.strictEqual(H.basabas({ sabit: 60000, fiyat: 120, degisken: 80 }).adet, 1500); assert.throws(() => H.basabas({ sabit: 1, fiyat: 5, degisken: 5 }), /değişken/);
ok('Kâr marjı, hedef fiyat, başabaş');
const rc = H.recete({ malzemeler: [{ miktar: 2, fiyat: 180, fire: 10 }, { miktar: 1, fiyat: 75 }, { miktar: 0.2, fiyat: 420 }], porsiyon: 10, hedefOran: 30, kdv: 10 }); assert.strictEqual(rc.toplam, 559); assert.strictEqual(rc.birim, 55.9); assert.strictEqual(rc.fiyat, 186.33); assert.strictEqual(rc.kdvli, 204.96);
ok('Reçete: fire ve menü fiyatı');
const tk = H.teklifToplam([{ ad: 'A', miktar: 1, fiyat: 48000, kdv: 20 }, { ad: 'B', miktar: 3, fiyat: 7500, iskonto: 10, kdv: 20 }, { ad: 'C', miktar: 1, fiyat: 100, kdv: 10 }, {}]); assert.strictEqual(tk.ara, 68350); assert.deepStrictEqual(tk.gruplar, { 10: 10, 20: 13650 }); assert.strictEqual(tk.toplam, 82010);
ok('Teklif: satır iskontosu ve KDV grupları');
assert.strictEqual(H.tutarYazi(25000), 'Yirmi beş bin Türk lirası'); assert.strictEqual(H.tutarYazi(1234.5), 'Bin iki yüz otuz dört Türk lirası elli kuruş'); assert.strictEqual(H.tutarYazi(1101), 'Bin yüz bir Türk lirası'); assert.strictEqual(H.tutarYazi(2000000), 'İki milyon Türk lirası'); assert.strictEqual(H.sayiYazi(0), 'sıfır');
ok('Tutarı yazıyla');

// --- Barkod (standart örnekler) ---
assert.strictEqual(H.eanKontrol('400638133393'), 1); assert.strictEqual(H.eanKontrol('9638507'), 4);
assert.strictEqual(H.ean13('400638133393').metin, '4006381333931'); assert.strictEqual(H.ean13('4006381333931').bit.length, 95); assert.throws(() => H.ean13('4006381333930'), /son rakam 1/); assert.throws(() => H.ean13('abc'), /12 veya 13/);
assert.strictEqual(H.ean8('9638507').metin, '96385074'); assert.strictEqual(H.ean8('96385074').bit.length, 67);
assert.ok(H.ean13('4006381333931').bit.startsWith('101') && H.ean13('4006381333931').bit.endsWith('101'));
// Küme B elle: 104 + 48·1 + 42·2 + 42·3 + 17·4 + 18·5 + 19·6 + 35·7 = 879; 879 mod 103 = 55
assert.strictEqual(H.code128Kontrol('PJJ123C'), 55); const cb = H.code128('PJJ123C'); assert.strictEqual(cb.bit.length, 11 * 9 + 13); assert.ok(cb.bit.startsWith('11010010000') && cb.bit.endsWith('1100011101011')); assert.throws(() => H.code128('ŞİŞ'), /Türkçe/);
assert.ok(H.barkodSvg(H.ean13('400638133393')).startsWith('<svg')); assert.ok(H.barkodSvg({ bit: '101', metin: '<x>' }).includes('&lt;x&gt;'));
ok('Barkod: EAN-13, EAN-8, Code 128 kontrol ve desen');
assert.strictEqual(H.wifiMetni({ ad: 'Kafe;1', sifre: 'a:b', tip: 'WPA' }), 'WIFI:T:WPA;S:Kafe\\;1;P:a\\:b;;'); assert.strictEqual(H.wifiMetni({ ad: 'A', tip: 'nopass' }), 'WIFI:T:nopass;S:A;;'); assert.ok(H.vcardMetni({ ad: 'Ali', soyad: 'Can', tel: '0555 111 22 33' }).includes('TEL;TYPE=CELL:05551112233')); assert.strictEqual(H.adresMetni('ornek.com/menu'), 'https://ornek.com/menu'); assert.throws(() => H.adresMetni('yanlış adres')); assert.strictEqual(H.masaLinki('https://a.co/m', 3), 'https://a.co/m?masa=3'); assert.strictEqual(H.masaLinki('https://a.co/m?x=1', 3), 'https://a.co/m?x=1&masa=3');
assert.deepStrictEqual(H.satirlarOku('Havlu\t869\t10\nKupa;870', 3), [['Havlu', '869', '10'], ['Kupa', '870', '']]);
ok('QR içerikleri ve etiket listesi');

// --- Sayfalar ---
const hepsi = B.yukle(); assert.ok(hepsi.length >= 20 && hepsi.length <= 60, `${hepsi.length} araç`);
const varsayilan = (a) => { const v = {}; const oku = (f, d) => { const x = d ?? f.deger; if (f.tip === 'onay') return !!x; if (['para', 'sayi', 'yuzde'].includes(f.tip)) { const s = H.sayiOku(x); return Number.isNaN(s) ? undefined : s; } return x == null ? (f.bugun ? '2026-10-30' : '') : String(x); }; (a.alanlar || []).forEach((f) => { if (f.tip === 'ara') return; if (f.tip === 'satirlar') v[f.ad] = (f.satir || [{}]).map((r) => { const o = {}; f.sutunlar.forEach((c) => { o[c.ad] = oku(c, r[c.ad]); }); return o; }); else v[f.ad] = oku(f); }); return v; };
const H2 = { ...H, qrSvg: () => '<svg></svg>' };
hepsi.forEach((a) => {
  assert.ok(B.ozgunKelime(a, hepsi) >= B.ASG_KELIME, `${a.slug}: ${B.ozgunKelime(a, hepsi)} kelime`); assert.ok(B.indekslenir(a, hepsi), a.slug); assert.ok(a.sss.length >= 3, a.slug);
  const v = varsayilan(a); (a.alanlar || []).filter((f) => f.gerekli && v[f.ad] === undefined).forEach((f) => { v[f.ad] = f.tip === 'tarih' ? '2026-10-30' : 10; });
  const h = a.hesap(v, H2); assert.strictEqual(typeof h, 'string', a.slug); assert.ok(h.length > 20 && !/undefined|NaN/.test(h), `${a.slug}: ${h.slice(0, 200)}`);
  const s = B.sayfa(a, hepsi); assert.ok(s.startsWith('<!doctype html>')); assert.ok(s.includes(`<link rel="canonical" href="https://www.nebsoftapp.com/araclar/${a.slug}/">`)); assert.ok(s.includes('content="index,follow"'));
  const ldler = [...s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']); assert.deepStrictEqual(ldler, ['WebApplication', 'Organization', 'WebSite', 'BreadcrumbList', 'FAQPage']);
  assert.ok(s.includes(`href="/${a.program.slug}"`), a.slug); assert.ok(s.includes('Son güncelleme')); assert.ok(a.baslik.length <= 70 && a.ozet.length <= 165, `${a.slug}: başlık ${a.baslik.length}, özet ${a.ozet.length}`); if (a.isle) { assert.ok(s.includes("connect-src 'self' blob: data:"), a.slug); assert.ok(s.includes('araclar-dosya.js') && s.includes('sunucuya yüklenmez'), a.slug); assert.ok(!/https?:\/\/(?!www\.nebsoftapp|schema\.org|developers\.google|www\.mevzuat)/.test(s.match(/<script>AR\.baslat[\s\S]*<\/script>/)[0]), `${a.slug}: dış adres`); } else assert.ok(!s.includes('araclar-dosya.js'), a.slug); new vm.Script(s.match(/<script>AR\.baslat\(([\s\S]*)\);<\/script>/)[0].replace(/<\/?script>/g, ''));
  if (a.mevzuat) { assert.ok(a.kaynaklar.length, a.slug); a.kaynaklar.forEach((k) => { assert.ok(/gov\.tr/.test(k.url), `${a.slug}: resmî kaynak değil ${k.url}`); assert.ok(s.includes(k.url.replace(/&/g, '&amp;')), a.slug); }); }
});
ok(`${hepsi.length} araç: 200+ özgün kelime, şema, canonical, kaynak, örnek değerlerle hesap`);
// Sayfa metnindeki hesap örnekleri
const met = (s) => { const a = hepsi.find((x) => x.slug === s); return a.ornek.metin.join(' '); };
assert.ok(met('pazaryeri-komisyon-hesaplama').includes('116,60')); assert.ok(met('aidat-gecikme-tazminati-hesaplama').includes('327,50')); assert.ok(met('recete-maliyeti-hesaplama').includes('204,96'));
ok('Sayfa örnekleri hesapla tutarlı');

// Zayıf açıklama → noindex; kaynaksız mevzuat aracı → noindex; kopya metin özgün sayılmaz
const taban = hepsi[0]; const ince = { ...taban, slug: 'ince', aciklama: ['Kısa açıklama.'], ornek: { baslik: 'x', metin: ['Örnek.'] }, sss: [['s?', 'c.']] };
assert.strictEqual(B.indekslenir(ince, [ince]), false); assert.ok(B.sayfa({ ...ince, ilgili: [] }, [ince]).includes('content="noindex,follow"'));
assert.strictEqual(B.indekslenir({ ...taban, mevzuat: true, kaynaklar: [] }, [taban]), false);
const kopya = { ...taban, slug: 'kopya' }; assert.strictEqual(B.ozgunKelime(kopya, [taban, kopya]), 0); assert.strictEqual(B.indekslenir(kopya, [taban, kopya]), false);
ok('Zayıf, kaynaksız ve kopya içerik noindex olur');

// Üretilen dosyalar kaynakla aynı (derleme atlanmamış)
const liste = JSON.parse(fs.readFileSync(path.join(__dirname, '../../site/araclar/liste.json'), 'utf8')); assert.strictEqual(liste.araclar.length, hepsi.length); assert.ok(liste.araclar.every((x) => x.index && x.yol === `/araclar/${x.slug}/` && x.kelime >= 200));
// Git'in satır sonu çevirisi ve alt bilgideki yıl karşılaştırmayı bozmasın
const duz = (s) => s.replace(/\r\n/g, '\n').replace(/© \d{4}/g, '© YIL');
hepsi.forEach((a) => assert.strictEqual(duz(fs.readFileSync(path.join(__dirname, `../../site/araclar/${a.slug}/index.html`), 'utf8')), duz(B.sayfa(a, [...hepsi].sort((x, y) => liste.araclar.findIndex((l) => l.slug === x.slug) - liste.araclar.findIndex((l) => l.slug === y.slug)))), `${a.slug} eski: node site/tools/build-araclar.js`));
assert.strictEqual(duz(fs.readFileSync(path.join(__dirname, '../../site/assets/araclar-hesap.js'), 'utf8')), duz(fs.readFileSync(path.join(__dirname, '../../site/tools/araclar/hesap.js'), 'utf8'))); assert.strictEqual(duz(fs.readFileSync(path.join(__dirname, '../../site/assets/araclar-dosya-saf.js'), 'utf8')), duz(fs.readFileSync(path.join(__dirname, '../../site/tools/araclar/dosya.js'), 'utf8')));
ok('Üretilen sayfalar ve liste.json güncel');
console.log(`\nAraçlar: ${n} test grubu geçti`);
