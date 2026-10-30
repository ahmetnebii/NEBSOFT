// Ortak katalog kuralları (saf, veritabanısız): GTIN kontrolü, Türkçe ad karşılaştırma, kişisel veri süzgeci ve CSV okuma.
// Ortak kataloğa yalnız gtin, ad, marka, kategori girer. Bu dosyadaki süzgeçten geçmeyen kayıt ortak tabloya yazılmaz.
const log = require('./log');

// ---------- GTIN ----------
const rakam = (s) => String(s == null ? '' : s).replace(/\D/g, '');
function gtinDogru(s) { // GTIN-8/12/13/14: sağdan ağırlık 3,1,3,1...; son hane kontrol hanesidir
  const d = rakam(s); if (![8, 12, 13, 14].includes(d.length) || /^0+$/.test(d)) return false;
  let t = 0; for (let i = d.length - 2, k = 3; i >= 0; i--, k = 4 - k) t += Number(d[i]) * k;
  return (10 - (t % 10)) % 10 === Number(d[d.length - 1]);
}
const gtinKanon = (s) => (gtinDogru(s) ? rakam(s).padStart(14, '0') : null); // tablolarda tek biçim: 14 hane (aynı ürün UPC ve EAN ile okunabilir)
// İç kullanım barkodları (mağazanın kendi ürettiği, tartılı ürün): küresel ürün değildir, ortak kataloğa girmez.
// Önek aralığı hafızadan, GS1 metni okunamadı (docs/KATALOG-LISANS.md: DOĞRULANAMADI); yanlış pozitif yalnız öneriyi eler, veri bozmaz.
const icKullanim = (g14) => /^0[2]/.test(g14) || /^00[24]/.test(g14);
const gtinGoster = (g14) => { const g = String(g14 || ''); if (g.length !== 14) return g; return g.startsWith('000000') ? g.slice(6) : g[0] === '0' ? g.slice(1) : g; };

// ---------- Türkçe normalize ----------
const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
const adNorm = (s) => String(s == null ? '' : s).toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, (c) => TR[c]).replace(/(\d)[\s.,]*(ml|cl|lt|l|gr|g|kg|adet)\b/g, '$1$2').replace(/[^a-z0-9]+/g, ' ').trim();
// Benzerlik: ikili harf (bigram) Dice katsayısı; 0..1
function benzerlik(a, b) {
  const x = adNorm(a).replace(/ /g, ''), y = adNorm(b).replace(/ /g, ''); if (!x || !y) return 0; if (x === y) return 1; if (x.length < 2 || y.length < 2) return 0;
  const say = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
  const A = say(x), B = say(y); let ort = 0; A.forEach((n, k) => { ort += Math.min(n, B.get(k) || 0); });
  return (2 * ort) / (x.length + y.length - 2);
}

// ---------- Kişisel veri süzgeci ----------
// Sık Türkçe adlar: amaç kusursuz kişi tanıma değil, "Ahmet Yılmaz" gibi girilmiş veresiye/müşteri notlarının ortak kataloğa sızmasını önlemek.
const ADLAR = new Set('ahmet mehmet mustafa ali huseyin hasan ibrahim ismail osman yusuf murat omer ramazan halil suleyman abdullah mahmut recep salih kemal fatih emre hakan kadir burak serkan onur tolga cem can eren baris ufuk volkan sinan tuncay orhan erdal bulent cengiz yasin yakup enes furkan kerem berk arda deniz umut gokhan selim taner adem musa fatma ayse emine hatice zeynep elif meryem sultan hanife zehra merve esra ozlem yasemin sevgi leyla hacer gulsum kubra busra tugba seda sibel derya dilek aysel nurcan songul gul nur sena betul rabia melek ebru pinar cansu hande irem'.split(' '));
const UNVAN = /(^|[\s.,'’-])(bey|bay|bayan|hanım|hanim|sayın|sayin|sn|müşteri|musteri|veresiye|borç|borc|cari|abi|abla|amca|teyze|dayı|dayi|yenge)(?=$|[\s.,:;'’-])/iu;
const URUN = new Set('sabun sampuan kahve kahvesi cay su sut peynir zeytin yag cikolata biskuvi gofret kola gazoz seker tuz un makarna pirinc bulgur deterjan kolonya krem salca recel bal lokum helva'.split(' '));
function kisiAdiGibi(s) {
  const k = String(s).trim().split(/\s+/); if (k.length < 2 || k.length > 3 || /\d/.test(s)) return false;
  const n = k.map(adNorm); if (!ADLAR.has(n[0])) return false;
  return !n.slice(1).some((x) => URUN.has(x)) && k.slice(1).every((x) => /^\p{Lu}/u.test(x));
}
// Bulursa nedenini, temizse null döner
function kisiselVeri(s) {
  const t = String(s == null ? '' : s); if (!t.trim()) return null;
  if (/[^\s@]+@[^\s@]+/.test(t)) return 'e-posta';
  if (/https?:\/\/|www\./i.test(t)) return 'adres';
  if (/\bTR\s?\d{2}[\s\d]{10,}/i.test(t)) return 'iban';
  if (/(^|\D)\d{10,}(\D|$)/.test(t.replace(/[\s().-]/g, ''))) return 'telefon/kimlik'; // ayraçsız 10+ hane: telefon, TC veya kart. Ürün adında geçmez
  if (log.maskeMetin(t, { eposta: true }) !== t) return 'telefon/kimlik';
  if (/\b(tel|telefon|gsm|cep|tc|t\.c\.|kimlik)\b\s*[:.]?\s*\d/i.test(t)) return 'telefon/kimlik';
  if (UNVAN.test(t)) return 'kişi adı';
  if (kisiAdiGibi(t)) return 'kişi adı';
  return null;
}

// Öneri süzgeci: yalnız dört alan alınır, diğer her şey (fiyat, stok, işletme, müşteri) burada düşer
const metin = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
function oneriTemizle(x) {
  if (!x || typeof x !== 'object') return { neden: 'geçersiz' };
  const ham = x.gtin != null ? x.gtin : x.barcode; const ad = metin(x.ad != null ? x.ad : x.name, 200); const marka = metin(x.marka != null ? x.marka : x.brand, 120); const kategori = metin(x.kategori != null ? x.kategori : x.category, 80);
  const gtin = gtinKanon(ham); if (!gtin) return { neden: 'hatalı GTIN' }; if (icKullanim(gtin)) return { neden: 'iç kullanım barkodu' };
  if (ad.length < 2 || !/\p{L}/u.test(ad)) return { neden: 'ad yok' };
  for (const v of [ad, marka, kategori]) { const n = kisiselVeri(v); if (n) return { neden: 'kişisel veri: ' + n }; }
  return { kayit: { gtin, ad, ad_norm: adNorm(ad), marka: marka || null, kategori: kategori || null } };
}

// ---------- CSV (tedarikçi listesi) ----------
function csvOku(metinCsv) {
  const t = String(metinCsv || '').replace(/^﻿/, ''); const ilk = t.split(/\r?\n/, 1)[0] || ''; const ay = ['\t', ';', ','].map((c) => [c, ilk.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const sat = []; let s = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"' && !f) q = true; else if (c === ay) { s.push(f); f = ''; } else if (c === '\n') { s.push(f); sat.push(s); s = []; f = ''; } else if (c !== '\r') f += c; }
  if (f || s.length) { s.push(f); sat.push(s); }
  const b = (sat.shift() || []).map((x) => adNorm(x).replace(/ /g, ''));
  const es = { gtin: ['gtin', 'barkod', 'barcode', 'ean', 'ean13'], ad: ['ad', 'urunadi', 'urun', 'name', 'stokadi'], marka: ['marka', 'brand'], kategori: ['kategori', 'category', 'grup'] };
  const sut = Object.fromEntries(Object.entries(es).map(([k, v]) => [k, b.findIndex((x) => v.includes(x))]));
  return { sutunlar: sut, satirlar: sat.filter((r) => r.some((x) => String(x).trim())).map((r) => ({ gtin: r[sut.gtin], ad: r[sut.ad], marka: sut.marka >= 0 ? r[sut.marka] : '', kategori: sut.kategori >= 0 ? r[sut.kategori] : '' })) }; // fiyat ve stok sütunları hiç okunmaz
}

module.exports = { rakam, gtinDogru, gtinKanon, gtinGoster, icKullanim, adNorm, benzerlik, kisiselVeri, kisiAdiGibi, oneriTemizle, metin, csvOku };
