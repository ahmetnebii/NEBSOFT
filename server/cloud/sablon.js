// Sektörel şablon kütüphanesi: content/sablonlar/<program>/<ad>.json dosyalarını okur ve şemasını doğrular.
// Şablonlar sürümlüdür ve işletme verisi içermez. Fiyat alanları boş gelir: şablonda fiyat uydurulmaz, işletme kendi fiyatını girer.
const fs = require('fs');
const path = require('path');
const log = require('./log');

const KOK = path.join(__dirname, '..', '..', 'content', 'sablonlar');
const PROGRAMLAR = 'adisyon anaokulu bilet butik crm eczane emlak eticaret fabrika fiyatrobotu galeri hukuk ik kargo kiralama klinik kurs kuyumcu muhasebe musavir otel oto otoservis pazaryeri pos randevu servis site spor toptan veteriner'.split(' ');
PROGRAMLAR.push('nakliyat', 'temizlik', 'usta', 'peyzaj');
const TURLER = ['menu', 'hizmet', 'urun', 'kategori', 'duyuru', 'form', 'tema'];
const AD = /^[a-z0-9-]{2,60}$/;
// Bu alanlarda sıfırdan büyük değer bulunamaz (fiyat yasağı)
const FIYAT = /^(price|fiyat|ucret|ücret|fee|cost|buy|sale|daily|cph|rate|labor|amount|tutar|bedel|buyPrice|listPrice)$/i;
const YER_TUTUCU = /\{\{(\w+)\}\}/g;
const STANDART = new Set(['musteri', 'isletme', 'tarih']);
const ONAY_UYARI = /avukat/i;

function fiyatBul(o, yol = '') {
  const b = []; if (Array.isArray(o)) o.forEach((x, i) => b.push(...fiyatBul(x, `${yol}[${i}]`)));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (FIYAT.test(k) && (typeof v === 'number' ? v !== 0 : v !== '' && v !== null && typeof v !== 'object')) b.push(`${yol}.${k}`); b.push(...fiyatBul(v, `${yol}.${k}`)); });
  return b;
}
// Hataların listesini döner; boş liste geçerli demektir
function dogrula(s, dosya = {}) {
  const h = []; const ek = (m) => h.push(m); if (!s || typeof s !== 'object') return ['JSON nesnesi değil'];
  if (!PROGRAMLAR.includes(s.program)) ek('program bilinmiyor: ' + s.program); if (dosya.program && dosya.program !== s.program) ek('program klasörle uyuşmuyor');
  if (!/^[a-z0-9]+\/[a-z0-9-]+$/.test(s.sablon || '') || s.sablon.split('/')[0] !== s.program) ek('sablon kimliği hatalı'); if (dosya.ad && dosya.ad !== String(s.sablon).split('/')[1]) ek('sablon kimliği dosya adıyla uyuşmuyor');
  if (!Number.isInteger(s.surum) || s.surum < 1) ek('surum pozitif tam sayı olmalı'); if (!TURLER.includes(s.tur)) ek('tur bilinmiyor: ' + s.tur);
  if (!s.ad || !s.aciklama) ek('ad ve aciklama gerekli'); if (s.kaynak !== 'sablon') ek("kaynak 'sablon' olmalı");
  if (!Array.isArray(s.kayitlar) || !s.kayitlar.length) { ek('kayitlar boş'); return h; }
  if (s.tur === 'form' && !ONAY_UYARI.test(s.uyari || '')) ek('form şablonunda avukat uyarısı zorunlu');
  if (!['form', 'tema'].includes(s.tur) && !/^[a-zA-Z]+$/.test(s.hedef || '')) ek('hedef koleksiyon gerekli');
  if (s.program === 'eczane' && s.tur !== 'form') ek('eczane yalnız form şablonu alır');
  const adAlan = s.adAlan || 'name'; const say = new Set();
  s.kayitlar.forEach((k, i) => {
    const y = `kayitlar[${i}]`; if (!AD.test(k.anahtar || '')) ek(`${y}: anahtar hatalı`); if (say.has(k.anahtar)) ek(`${y}: anahtar tekrar ediyor`); say.add(k.anahtar);
    if (s.tur === 'form') {
      if (!k.label || !Array.isArray(k.sign) || k.sign.length !== 2 || !k.body || !Array.isArray(k.fields)) ek(`${y}: form alanları eksik`);
      else { const adlar = new Set(k.fields.map((f) => f.name)); [...String(k.body).matchAll(YER_TUTUCU)].forEach((m) => { if (!STANDART.has(m[1]) && !adlar.has(m[1])) ek(`${y}: metinde tanımsız alan {{${m[1]}}}`); }); }
    } else if (s.tur === 'tema') { if (!k.label || !k.ayarlar || typeof k.ayarlar !== 'object') ek(`${y}: tema alanları eksik`); }
    else if (!String(k[adAlan] || '').trim()) ek(`${y}: ${adAlan} boş`);
  });
  fiyatBul({ varsayilan: s.varsayilan, kayitlar: s.kayitlar }).forEach((x) => ek('fiyat içeremez: ' + x));
  return h;
}

let bellek = null;
function yukle() {
  if (bellek) return bellek; const m = new Map(); if (!fs.existsSync(KOK)) return (bellek = m);
  for (const p of fs.readdirSync(KOK)) {
    const d = path.join(KOK, p); if (!PROGRAMLAR.includes(p) || !fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
      try { const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); const h = dogrula(s, { program: p, ad: f.replace(/\.json$/, '') }); if (h.length) { log.uygulama.uyari('sablon.gecersiz', { mesaj: `${p}/${f}: ${h[0]}` }); continue; } m.set(s.sablon, s); } // bozuk şablon müşteriye gösterilmez
      catch (e) { log.uygulama.uyari('sablon.okunamadi', { mesaj: `${p}/${f}`, hata: e }); }
    }
  }
  return (bellek = m);
}
const liste = (program) => [...yukle().values()].filter((s) => s.program === program);
const bul = (id) => yukle().get(id) || null;
const programVar = (p) => PROGRAMLAR.includes(p);
module.exports = { KOK, PROGRAMLAR, TURLER, dogrula, liste, bul, programVar, fiyatBul, sifirla: () => { bellek = null; } };
