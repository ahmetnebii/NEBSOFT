/* NEBSOFT ücretsiz araçlar — hesap mantığı (saf fonksiyonlar). Hem tarayıcıda hem Node'da çalışır, DOM ve ağ kullanmaz.
   Tarayıcıya site/assets/araclar-hesap.js olarak build-araclar.js kopyalar (site/tools dışarı sunulmaz); bu dosya dışında elle değiştirmeyin.
   Mevzuat dayanakları (okundu 30.10.2026, DOĞRULANDI):
   KMK md. 20  mevzuat.gov.tr/mevzuatmetin/1.5.634.htm · TBK md. 344  mevzuat.gov.tr/mevzuatmetin/1.5.6098.htm
   4857 md. 17, 41, 47, 53, 63  mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm · 1475 md. 14  mevzuat.gov.tr/mevzuatmetin/1.5.1475.htm
   GVK md. 25/7  mevzuat.gov.tr/mevzuatmetin/1.4.193.htm · Damga binde 7,59  mevzuat.gov.tr/mevzuatmetin/1.5.488.htm (1) s. tablo IV-1-b
   Desi böleni, komisyon, TÜFE oranı, milyem kullanıcıdan alınır: bu dosyada varsayılan oran yoktur. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.ARACLAR_HESAP = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const H = {};

  // ---------- Sayı, tarih ----------
  H.yuvarla = (n, d = 2) => { const k = 10 ** d; return Math.round((Number(n) + (n >= 0 ? Number.EPSILON : -Number.EPSILON)) * k) / k; };
  // "1.234,56", "1234,56", "1234.56", "1.234" (Türkçe binlik) okunur; boş veya geçersizse NaN
  H.sayiOku = (s) => {
    if (typeof s === 'number') return s;
    let t = String(s == null ? '' : s).replace(/[\s₺%]|TL/gi, ''); if (!t) return NaN;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return /^-?\d*\.?\d+$/.test(t) ? Number(t) : NaN;
  };
  H.tarihOku = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCMonth() === +m[2] - 1 ? d : null; };
  const zorunluTarih = (s, ad) => { const d = H.tarihOku(s); if (!d) throw new Error(`${ad} geçerli bir tarih olmalı`); return d; };
  H.gunFark = (a, b) => Math.round((zorunluTarih(b, 'Tarih') - zorunluTarih(a, 'Tarih')) / 864e5);
  // İki tarih arası takvim süresi: tam yıl + ay + gün; kalanGun son yıl dönümünden sonraki gün sayısı
  H.sure = (bas, bit) => {
    const a = zorunluTarih(bas, 'Başlangıç tarihi'), b = zorunluTarih(bit, 'Bitiş tarihi'); if (b < a) throw new Error('Bitiş tarihi başlangıçtan önce olamaz');
    let y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), g = b.getUTCDate() - a.getUTCDate();
    if (g < 0) { m--; g += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    const donum = Date.UTC(a.getUTCFullYear() + y, a.getUTCMonth(), a.getUTCDate());
    return { yil: y, ay: m, gun: g, kalanGun: Math.round((b - donum) / 864e5), toplamGun: Math.round((b - a) / 864e5) };
  };
  H.tarihTR = (s) => { const d = H.tarihOku(s); return d ? `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}` : ''; };
  const pozitif = (n, ad) => { if (!(n > 0)) throw new Error(`${ad} sıfırdan büyük olmalı`); return n; };
  const sifirVeyaUstu = (n, ad) => { if (n != null && (Number.isNaN(n) || n < 0)) throw new Error(`${ad} negatif olamaz`); return n || 0; };

  // ---------- KDV ve tevkifat ----------
  H.kdv = ({ tutar, oran, dahil }) => {
    pozitif(tutar, 'Tutar'); sifirVeyaUstu(oran, 'KDV oranı');
    const matrah = dahil ? tutar / (1 + oran / 100) : tutar; const toplam = dahil ? tutar : tutar * (1 + oran / 100);
    return { matrah: H.yuvarla(matrah), kdv: H.yuvarla(toplam - matrah), toplam: H.yuvarla(toplam) };
  };
  // Tevkifat: KDV'nin pay/10'unu alıcı sorumlu sıfatıyla beyan eder, kalanını satıcıya öder
  H.tevkifat = ({ matrah, oran, pay }) => {
    pozitif(matrah, 'Matrah'); pozitif(oran, 'KDV oranı'); if (!(pay >= 1 && pay <= 10)) throw new Error('Tevkifat oranı 1/10 ile 10/10 arasında olmalı');
    const kdv = H.yuvarla((matrah * oran) / 100); const tevkif = H.yuvarla((kdv * pay) / 10);
    return { kdv, tevkif, saticiKdv: H.yuvarla(kdv - tevkif), saticiyaOdenen: H.yuvarla(matrah + kdv - tevkif), faturaToplam: H.yuvarla(matrah + kdv) };
  };

  // ---------- Çalışma hayatı ----------
  // 1475 md. 14: her tam yıl için 30 günlük ücret, artan süre orantılı (kalan gün / 365); tavan aşılamaz. GVK md. 25/7: gelir vergisinden istisna; yalnız damga vergisi kesilir.
  H.kidem = ({ giris, cikis, brut, yanHak = 0, tavan, damgaBinde = 7.59 }) => {
    pozitif(brut, 'Brüt ücret'); sifirVeyaUstu(yanHak, 'Yan haklar'); const s = H.sure(giris, cikis);
    const esas = brut + (yanHak || 0); const tavanli = tavan > 0 && esas > tavan; const uygulanan = tavanli ? tavan : esas;
    const hak = s.yil >= 1; const katsayi = s.yil + s.kalanGun / 365;
    const tazminat = hak ? H.yuvarla(uygulanan * katsayi) : 0; const damga = H.yuvarla((tazminat * damgaBinde) / 1000);
    return { sure: s, esas: H.yuvarla(esas), uygulanan: H.yuvarla(uygulanan), tavanli, hak, katsayi, tazminat, damga, net: H.yuvarla(tazminat - damga) };
  };
  H.ihbarHafta = (s) => { const ay = s.yil * 12 + s.ay; const tamSinir = (n) => ay < n || (ay === n && s.gun === 0); return ay < 6 ? 2 : tamSinir(18) ? 4 : tamSinir(36) ? 6 : 8; };
  // 4857 md. 17: <6 ay 2 hafta, 6 ay–1,5 yıl 4, 1,5–3 yıl 6, 3 yıldan fazla 8 hafta. Gelir vergisi oranı işveren bordrosundan alınır.
  H.ihbar = ({ giris, cikis, brut, yanHak = 0, gvOrani = 0, damgaBinde = 7.59 }) => {
    pozitif(brut, 'Brüt ücret'); const s = H.sure(giris, cikis); const hafta = H.ihbarHafta(s); const gun = hafta * 7;
    const tazminat = H.yuvarla(((brut + (yanHak || 0)) / 30) * gun); const gv = H.yuvarla((tazminat * (gvOrani || 0)) / 100); const damga = H.yuvarla((tazminat * damgaBinde) / 1000);
    return { sure: s, hafta, gun, tazminat, gv, damga, net: H.yuvarla(tazminat - gv - damga) };
  };
  // 4857 md. 53: 1–5 yıl (5 dahil) 14, 5'ten çok 15'ten az 20, 15 ve üstü 26 gün; 18 altı / 50 üstü en az 20; yer altında +4 gün
  H.izinGunu = (yil) => (yil < 1 ? 0 : yil <= 5 ? 14 : yil < 15 ? 20 : 26);
  H.yillikIzin = ({ giris, tarih, yas, yerAlti, kullanilan = 0 }) => {
    const s = H.sure(giris, tarih); let gun = H.izinGunu(s.yil);
    if (gun && (yas < 18 || yas > 50)) gun = Math.max(gun, 20);
    if (gun && yerAlti) gun += 4;
    let toplam = 0; for (let y = 1; y <= s.yil; y++) toplam += H.izinGunu(y) + (yerAlti ? 4 : 0);
    const g = H.tarihOku(giris); const sonraki = new Date(Date.UTC(g.getUTCFullYear() + s.yil + 1, g.getUTCMonth(), g.getUTCDate())).toISOString().slice(0, 10);
    return { sure: s, gun, toplam, kalan: toplam - (kullanilan || 0), sonrakiHakedis: sonraki };
  };
  // 4857 md. 41: fazla çalışma saat ücreti %50 zamlı; fazla sürelerle çalışma %25 zamlı; yıllık 270 saat sınırı. md. 47: genel tatilde çalışılan gün için ek bir günlük ücret.
  H.fazlaMesai = ({ brut, aylikSaat = 225, saat50 = 0, saat25 = 0, tatilGun = 0, yilToplam = 0 }) => {
    pozitif(brut, 'Brüt ücret'); pozitif(aylikSaat, 'Aylık çalışma saati');
    const saatUcret = brut / aylikSaat; const t50 = H.yuvarla(saatUcret * 1.5 * (saat50 || 0)); const t25 = H.yuvarla(saatUcret * 1.25 * (saat25 || 0)); const tatil = H.yuvarla((brut / 30) * (tatilGun || 0));
    return { saatUcret: H.yuvarla(saatUcret, 4), t50, t25, tatil, toplam: H.yuvarla(t50 + t25 + tatil), serbestZaman: H.yuvarla((saat50 || 0) * 1.5 + (saat25 || 0) * 1.25), sinirAsildi: ((yilToplam || 0) + (saat50 || 0)) > 270 };
  };
  // Prim: "kademeli" her dilim kendi oranıyla, "tum" ulaşılan en üst kademenin oranı tüm satışa
  H.prim = ({ satis, kademeler, mod = 'kademeli', sabit = 0 }) => {
    pozitif(satis, 'Satış tutarı'); const K = (kademeler || []).filter((k) => k.esik >= 0 && k.oran >= 0).sort((a, b) => a.esik - b.esik); if (!K.length) throw new Error('En az bir prim kademesi girin');
    const detay = []; let prim = 0;
    if (mod === 'tum') { const k = K.filter((x) => satis >= x.esik).pop(); if (k) { prim = (satis * k.oran) / 100; detay.push({ taban: satis, oran: k.oran, tutar: H.yuvarla(prim) }); } }
    else K.forEach((k, i) => { const ust = K[i + 1] ? K[i + 1].esik : Infinity; const taban = Math.min(satis, ust) - k.esik; if (taban > 0) { const t = (taban * k.oran) / 100; prim += t; detay.push({ taban: H.yuvarla(taban), oran: k.oran, tutar: H.yuvarla(t) }); } });
    return { prim: H.yuvarla(prim), toplam: H.yuvarla(prim + (sabit || 0)), etkin: H.yuvarla((prim / satis) * 100), detay };
  };

  // ---------- Gayrimenkul ----------
  H.kiraArtis = ({ kira, oran, onerilen }) => {
    pozitif(kira, 'Mevcut kira'); sifirVeyaUstu(oran, 'Artış oranı'); const yeni = H.yuvarla(kira * (1 + oran / 100));
    return { yeni, fark: H.yuvarla(yeni - kira), yillikFark: H.yuvarla((yeni - kira) * 12), asiyor: onerilen > 0 ? onerilen > yeni : false };
  };
  // KMK md. 20: geciken günler için aylık %5; bileşik değil, 1 ay = 30 gün (apps/site/data.js lateFee ile aynı)
  H.gecikmeTazminati = ({ satirlar, tarih, oran = 5 }) => {
    const sat = (satirlar || []).filter((x) => x.tutar > 0 && x.vade); if (!sat.length) throw new Error('En az bir borç satırı girin');
    const list = sat.map((x) => { const gun = Math.max(0, H.gunFark(x.vade, tarih)); return { ...x, gun, tazminat: H.yuvarla((x.tutar * oran * gun) / 3000) }; });
    const anapara = H.yuvarla(list.reduce((t, x) => t + x.tutar, 0)); const tazminat = H.yuvarla(list.reduce((t, x) => t + x.tazminat, 0));
    return { satirlar: list, anapara, tazminat, toplam: H.yuvarla(anapara + tazminat) };
  };
  // Kuruş farkı kalmasın: en büyük küsurlara dağıtılır (apps/site/data.js split ile aynı yöntem)
  H.dagit = (agirliklar, toplam) => {
    const W = agirliklar.reduce((a, b) => a + b, 0); if (!W) return null; const kr = Math.round(toplam * 100); const ham = agirliklar.map((x) => (kr * x) / W); const taban = ham.map(Math.floor); let kalan = kr - taban.reduce((a, b) => a + b, 0);
    ham.map((x, i) => [x - taban[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (kalan > 0) { taban[i]++; kalan--; } }); return taban.map((x) => x / 100);
  };
  // KMK md. 20: kapıcı, kaloriferci, bahçıvan, bekçi eşit; sigorta, bakım, onarım, yönetici ücreti ve diğerleri arsa payına göre (yönetim planında aksi yoksa)
  H.aidatPaylas = ({ daireler, esitGider = 0, arsaGider = 0, ay = 1 }) => {
    const D = (daireler || []).filter((x) => x.ad || x.arsaPayi > 0); if (!D.length) throw new Error('En az bir daire girin');
    if ((arsaGider || 0) > 0 && !D.every((x) => x.arsaPayi > 0)) throw new Error('Arsa payına göre gider varsa her dairenin arsa payı girilmeli');
    if (!((esitGider || 0) + (arsaGider || 0) > 0)) throw new Error('En az bir gider tutarı girin');
    const e = H.dagit(D.map(() => 1), esitGider || 0) || D.map(() => 0); const a = (arsaGider || 0) > 0 ? H.dagit(D.map((x) => x.arsaPayi), arsaGider) : D.map(() => 0);
    const satir = D.map((x, i) => ({ ad: x.ad || `Daire ${i + 1}`, esit: e[i], arsa: a[i], toplam: H.yuvarla(e[i] + a[i]), aylik: H.yuvarla((e[i] + a[i]) / (ay || 1)) }));
    return { satirlar: satir, toplam: H.yuvarla(satir.reduce((t, x) => t + x.toplam, 0)) };
  };

  // ---------- Ticaret ----------
  // Desi = en × boy × yükseklik / bölen. Bölen taşıyıcıya göre değişir; varsayılan yoktur.
  H.desi = ({ en, boy, yukseklik, bolen, adet = 1, kg = 0 }) => {
    pozitif(en, 'En'); pozitif(boy, 'Boy'); pozitif(yukseklik, 'Yükseklik'); pozitif(bolen, 'Bölen');
    const tek = H.yuvarla((en * boy * yukseklik) / bolen); const n = adet > 0 ? adet : 1;
    return { tek, toplam: H.yuvarla(tek * n), kgToplam: H.yuvarla((kg || 0) * n), buyuk: H.yuvarla(Math.max(tek, kg || 0) * n) };
  };
  // Has = gram × saflık. Saflık: milyem verilirse binde; verilmezse ayar ÷ 24
  H.altin = ({ gram, ayar, milyem, hasFiyat, iscilik = 0 }) => {
    pozitif(gram, 'Gram'); const saflik = milyem > 0 ? milyem / 1000 : pozitif(ayar, 'Ayar') / 24; if (saflik > 1) throw new Error('Saflık binde 1000 üzerinde olamaz');
    const has = H.yuvarla(gram * saflik, 3); const sonuc = { saflik: H.yuvarla(saflik, 4), has };
    if (hasFiyat > 0) { sonuc.deger = H.yuvarla(gram * saflik * hasFiyat); sonuc.iscilik = H.yuvarla(gram * (iscilik || 0)); sonuc.toplam = H.yuvarla(sonuc.deger + sonuc.iscilik); }
    return sonuc;
  };
  // Aynı model apps/fiyatrobotu/data.js calc: komisyon KDV dahil fiyattan, kesintilerin KDV'si düşülür; maliyet KDV hariç
  H.pazaryeri = ({ fiyat, kdv = 0, maliyet = 0, komisyon = 0, kargo = 0, hizmet = 0, paket = 0, kesintiKdv = 0 }) => {
    pozitif(fiyat, 'Satış fiyatı'); const netSatis = fiyat / (1 + kdv / 100); const komisyonTutar = (fiyat * komisyon) / 100; const kesinti = (komisyonTutar + hizmet + kargo) / (1 + kesintiKdv / 100); const kar = netSatis - maliyet - kesinti - paket;
    return { netSatis: H.yuvarla(netSatis), satisKdv: H.yuvarla(fiyat - netSatis), komisyonTutar: H.yuvarla(komisyonTutar), kesinti: H.yuvarla(kesinti), kar: H.yuvarla(kar), marj: H.yuvarla((kar / netSatis) * 100, 1), roi: maliyet ? H.yuvarla((kar / maliyet) * 100, 1) : 0 };
  };
  // Hedef marj (net satışa göre) için KDV dahil fiyat
  H.pazaryeriHedef = ({ marj, kdv = 0, maliyet = 0, komisyon = 0, kargo = 0, hizmet = 0, paket = 0, kesintiKdv = 0 }) => {
    const v = 1 + kdv / 100, h = 1 + kesintiKdv / 100; const b = (1 - marj / 100) / v - komisyon / 100 / h; if (!(b > 0)) throw new Error('Bu komisyon ve marjla ulaşılabilir bir fiyat yok');
    return H.yuvarla((maliyet + paket + (hizmet + kargo) / h) / b);
  };
  H.karMarji = ({ maliyet, satis }) => { pozitif(maliyet, 'Maliyet'); pozitif(satis, 'Satış fiyatı'); return { kar: H.yuvarla(satis - maliyet), marj: H.yuvarla(((satis - maliyet) / satis) * 100), markup: H.yuvarla(((satis - maliyet) / maliyet) * 100) }; };
  H.hedefFiyat = ({ maliyet, marj }) => { pozitif(maliyet, 'Maliyet'); if (!(marj < 100)) throw new Error('Marj yüzde 100 veya üstü olamaz'); return H.yuvarla(maliyet / (1 - marj / 100)); };
  H.basabas = ({ sabit, fiyat, degisken }) => { pozitif(sabit, 'Sabit gider'); pozitif(fiyat, 'Birim fiyat'); const k = fiyat - degisken; if (!(k > 0)) throw new Error('Birim fiyat değişken maliyetin üstünde olmalı'); return { adet: Math.ceil(sabit / k), ciro: H.yuvarla(Math.ceil(sabit / k) * fiyat), katki: H.yuvarla(k) }; };
  // Reçete: fire yüzdesi kadar fazla alınmış kabul edilir
  H.recete = ({ malzemeler, porsiyon, hedefOran, kdv = 0 }) => {
    pozitif(porsiyon, 'Porsiyon sayısı'); const L = (malzemeler || []).filter((x) => x.miktar > 0 && x.fiyat > 0); if (!L.length) throw new Error('En az bir malzeme girin');
    const satir = L.map((x) => { const f = Math.min(sifirVeyaUstu(x.fire, 'Fire'), 95); return { ...x, tutar: H.yuvarla((x.miktar * x.fiyat) / (1 - f / 100)) }; });
    const toplam = H.yuvarla(satir.reduce((t, x) => t + x.tutar, 0)); const birim = H.yuvarla(toplam / porsiyon); const sonuc = { satirlar: satir, toplam, birim };
    if (hedefOran > 0) { sonuc.fiyat = H.yuvarla(birim / (hedefOran / 100)); sonuc.kdvli = H.yuvarla(sonuc.fiyat * (1 + kdv / 100)); }
    return sonuc;
  };
  H.teklifToplam = (kalemler, genelIskonto = 0) => {
    const L = (kalemler || []).filter((x) => x.ad || x.miktar > 0); const satir = L.map((x) => { const m = x.miktar > 0 ? x.miktar : 0, f = x.fiyat > 0 ? x.fiyat : 0; const brut = m * f; const net = brut * (1 - (x.iskonto || 0) / 100) * (1 - (genelIskonto || 0) / 100); return { ...x, miktar: m, fiyat: f, net: H.yuvarla(net), kdvTutar: H.yuvarla((net * (x.kdv || 0)) / 100) }; });
    const ara = H.yuvarla(satir.reduce((t, x) => t + x.net, 0)); const gruplar = {}; satir.forEach((x) => { const o = x.kdv || 0; gruplar[o] = H.yuvarla((gruplar[o] || 0) + x.kdvTutar); });
    const kdv = H.yuvarla(Object.values(gruplar).reduce((a, b) => a + b, 0)); return { satirlar: satir, ara, gruplar, kdv, toplam: H.yuvarla(ara + kdv) };
  };

  // ---------- Tutarı yazıyla ----------
  const BIR = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], ON = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const uclu = (n) => [n >= 200 ? BIR[Math.floor(n / 100)] : '', n >= 100 ? 'yüz' : '', ON[Math.floor((n % 100) / 10)], BIR[n % 10]].filter(Boolean).join(' ');
  H.sayiYazi = (n) => {
    n = Math.floor(n); if (n === 0) return 'sıfır'; const grup = ['', 'bin', 'milyon', 'milyar', 'trilyon']; const p = []; let i = 0;
    while (n > 0) { const u = n % 1000; if (u) p.unshift(i === 1 && u === 1 ? 'bin' : `${uclu(u)}${grup[i] ? ' ' + grup[i] : ''}`); n = Math.floor(n / 1000); i++; }
    return p.join(' ');
  };
  H.tutarYazi = (t) => { const kr = Math.round(t * 100); const tl = Math.floor(kr / 100), k = kr % 100; const m = `${H.sayiYazi(tl)} Türk lirası${k ? ` ${H.sayiYazi(k)} kuruş` : ''}`; return m.charAt(0).toLocaleUpperCase('tr-TR') + m.slice(1); };

  // ---------- Barkod ----------
  H.eanKontrol = (s) => { const d = String(s).split('').reverse().map(Number); return (10 - (d.reduce((t, x, i) => t + x * (i % 2 ? 1 : 3), 0) % 10)) % 10; };
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const G = L.map((x) => x.split('').reverse().map((c) => (c === '0' ? '1' : '0')).join('')); const R = L.map((x) => x.split('').map((c) => (c === '0' ? '1' : '0')).join(''));
  const EAN_ILK = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  // 12 hane verilirse kontrol hanesi eklenir; 13 hanede kontrol doğrulanır
  H.ean13 = (s) => {
    let t = String(s).replace(/\s/g, ''); if (!/^\d{12,13}$/.test(t)) throw new Error('EAN-13 için 12 veya 13 rakam girin');
    const k = H.eanKontrol(t.slice(0, 12)); if (t.length === 13 && Number(t[12]) !== k) throw new Error(`Kontrol hanesi hatalı: son rakam ${k} olmalı`);
    t = t.slice(0, 12) + k; const ilk = EAN_ILK[+t[0]]; let bit = '101'; for (let i = 1; i <= 6; i++) bit += (ilk[i - 1] === 'L' ? L : G)[+t[i]]; bit += '01010'; for (let i = 7; i <= 12; i++) bit += R[+t[i]]; return { metin: t, bit: bit + '101' };
  };
  H.ean8 = (s) => {
    let t = String(s).replace(/\s/g, ''); if (!/^\d{7,8}$/.test(t)) throw new Error('EAN-8 için 7 veya 8 rakam girin');
    const k = H.eanKontrol(t.slice(0, 7)); if (t.length === 8 && Number(t[7]) !== k) throw new Error(`Kontrol hanesi hatalı: son rakam ${k} olmalı`);
    t = t.slice(0, 7) + k; let bit = '101'; for (let i = 0; i < 4; i++) bit += L[+t[i]]; bit += '01010'; for (let i = 4; i < 8; i++) bit += R[+t[i]]; return { metin: t, bit: bit + '101' };
  };
  const C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  H.code128Kontrol = (t) => { let c = 104; [...t].forEach((ch, i) => { c += (ch.charCodeAt(0) - 32) * (i + 1); }); return c % 103; };
  // Code 128 kod kümesi B: boşluk–~ arası ASCII
  H.code128 = (s) => {
    const t = String(s); if (!t) throw new Error('Kod boş olamaz'); if (t.length > 40) throw new Error('Code 128 için en fazla 40 karakter girin'); if (!/^[\x20-\x7e]+$/.test(t)) throw new Error('Code 128 Türkçe harf taşımaz: yalnız İngilizce harf, rakam ve işaret kullanın');
    const kod = [104, ...[...t].map((ch) => ch.charCodeAt(0) - 32), H.code128Kontrol(t), 106]; let bit = ''; kod.forEach((c) => { [...C128[c]].forEach((w, i) => { bit += (i % 2 ? '0' : '1').repeat(+w); }); }); return { metin: t, bit };
  };
  H.barkodSvg = (b, { yukseklik = 70, modul = 2, metin = true, kenar = 11 } = {}) => {
    let x = kenar * modul, r = '', i = 0; const bit = b.bit; while (i < bit.length) { if (bit[i] === '1') { let n = 1; while (bit[i + n] === '1') n++; r += `<rect x="${x + i * modul}" y="0" width="${n * modul}" height="${yukseklik}"/>`; i += n; } else i++; }
    const W = (bit.length + kenar * 2) * modul, Y = yukseklik + (metin ? 20 : 0);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Y}" width="${W}" height="${Y}" role="img" aria-label="Barkod ${H.esc(b.metin)}"><rect width="${W}" height="${Y}" fill="#fff"/><g fill="#000">${r}</g>${metin ? `<text x="${W / 2}" y="${yukseklik + 16}" text-anchor="middle" font-family="monospace" font-size="15" fill="#000">${H.esc(b.metin)}</text>` : ''}</svg>`;
  };

  // ---------- QR içerik metinleri ----------
  const wifiKacis = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');
  H.wifiMetni = ({ ad, sifre, tip = 'WPA', gizli }) => { if (!ad) throw new Error('Ağ adı girin'); return `WIFI:T:${tip === 'nopass' ? 'nopass' : tip};S:${wifiKacis(ad)};${tip === 'nopass' ? '' : `P:${wifiKacis(sifre || '')};`}${gizli ? 'H:true;' : ''};`; };
  const vkKacis = (s) => String(s || '').replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
  H.vcardMetni = ({ ad, soyad, firma, unvan, tel, eposta, web, adres }) => { if (!ad && !firma) throw new Error('Ad veya firma girin'); return ['BEGIN:VCARD', 'VERSION:3.0', `N:${vkKacis(soyad)};${vkKacis(ad)};;;`, `FN:${vkKacis([ad, soyad].filter(Boolean).join(' ') || firma)}`, firma && `ORG:${vkKacis(firma)}`, unvan && `TITLE:${vkKacis(unvan)}`, tel && `TEL;TYPE=CELL:${String(tel).replace(/[^\d+]/g, '')}`, eposta && `EMAIL:${eposta}`, web && `URL:${web}`, adres && `ADR:;;${vkKacis(adres)};;;;`, 'END:VCARD'].filter(Boolean).join('\r\n'); };
  // Başına https:// koyar; boşluklu veya alan adı olmayan metni reddeder
  H.adresMetni = (s) => { const t = String(s || '').trim(); if (!t) throw new Error('Adres girin'); const u = /^https?:\/\//i.test(t) ? t : `https://${t}`; if (/\s/.test(u) || !/^https?:\/\/[^/]+\.[^/]{2,}/i.test(u)) throw new Error('Geçerli bir web adresi girin'); return u; };
  H.masaLinki = (u, n) => `${u}${u.includes('?') ? '&' : '?'}masa=${n}`;
  // Excel'den yapıştırma: sekme veya noktalı virgül ayraçlı satırlar
  H.satirlarOku = (metin, n) => String(metin || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).map((x) => { const p = x.split(/\t|;/).map((y) => y.trim()); while (p.length < n) p.push(''); return p; });

  // ---------- Görünüm yardımcıları (tarayıcı + test) ----------
  H.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  H.sayi = (n, d = 2) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n);
  H.tl = (n) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} ₺`;
  H.tablo = (sat) => `<table class="ar-sonuc-t"><tbody>${sat.filter(Boolean).map(([a, b, v]) => `<tr${v ? ' class="v"' : ''}><th scope="row">${a}</th><td>${b}</td></tr>`).join('')}</tbody></table>`;
  H.not = (m, tur = 'bilgi') => `<p class="ar-not ${tur}">${m}</p>`;
  H.btn = (eylem, ad, ek = '') => `<button type="button" class="btn sm" data-eylem="${eylem}"${ek}>${ad}</button>`;
  H.eylemler = (...b) => `<div class="ar-eylem">${b.filter(Boolean).join('')}</div>`;
  return H;
});
