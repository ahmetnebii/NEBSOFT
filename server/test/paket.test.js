// Hazır paketler: liste doğruluğu, sunucu fiyatı, sayfa metni ve adresler
//   node server/test/paket.test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const cat = require('../cloud/catalog');
const paket = require('../cloud/paket');
const indirim = require('../cloud/indirim');
const METIN = require('../../site/src/paketler');
const ROOT = path.join(__dirname, '..', '..');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

// ---------- Liste ----------
const BEKLENEN = { 'oto-sanayi': 'otoservis muhasebe crm', 'oto-bakim': 'oto muhasebe randevu', 'oto-ticaret': 'galeri kiralama muhasebe', 'teknik-servis': 'servis muhasebe crm', guzellik: 'randevu pos muhasebe', spor: 'spor randevu muhasebe', saglik: 'klinik muhasebe ik', veteriner: 'veteriner pos muhasebe', restoran: 'adisyon ik muhasebe', perakende: 'pos muhasebe crm', moda: 'butik eticaret muhasebe', 'e-ticaret': 'eticaret pazaryeri kargo fiyatrobotu', kuyumcu: 'kuyumcu muhasebe crm', toptan: 'toptan muhasebe kargo', uretim: 'fabrika toptan muhasebe ik', egitim: 'kurs muhasebe ik', 'okul-oncesi': 'anaokulu muhasebe ik', konaklama: 'otel adisyon muhasebe ik', etkinlik: 'bilet muhasebe crm', emlak: 'emlak crm muhasebe', 'hukuk-burosu': 'hukuk muhasebe ik', 'mali-musavir': 'musavir crm ik', 'site-yonetimi': 'site muhasebe', kurumsal: 'muhasebe crm ik servis' };
assert.deepStrictEqual(Object.fromEntries(paket.liste().map((p) => [p.id, p.programlar.join(' ')])), BEKLENEN); ok('24 paket ve program listesi istenen gibi');
assert.deepStrictEqual(paket.dogrula(), []); ok('Tüm paket programları satışta');
assert(!paket.liste().some((p) => p.programlar.includes('eczane'))); ok('Eczane hiçbir pakette yok');

// ---------- Fiyat ----------
const pk = (id) => paket.bul(id);
const f = paket.fiyat(pk('oto-sanayi')).planlar[1].aylik; const fiyatKatalog = (id, i) => cat.product(id).prices[i];
const liste = fiyatKatalog('otoservis', 1) + fiyatKatalog('muhasebe', 1) + fiyatKatalog('crm', 1);
const yuzde = indirim.kademe(indirim.load().programSayisi, 3).yuzde;
assert.strictEqual(f.liste, liste); assert.strictEqual(f.indirim.yuzde, yuzde); assert.strictEqual(f.net, liste - liste * yuzde / 100); assert.strictEqual(f.toplam, Math.round((f.net + f.kdv) * 100) / 100); ok('Üç program: katalog fiyatı ve yapılandırmadaki kademe');
assert.strictEqual(paket.fiyat(pk('e-ticaret')).planlar[0].aylik.indirim.yuzde, indirim.kademe(indirim.load().programSayisi, 4).yuzde); ok('Dört program: kademesini alır');
assert.strictEqual(paket.fiyat(pk('site-yonetimi')).planlar[0].aylik.indirim.yuzde, indirim.kademe(indirim.load().programSayisi, 2).yuzde); ok('İki program: kademesini alır');
{ const y = paket.fiyat(pk('spor')).planlar[0]; assert.strictEqual(y.yillik.liste, y.aylik.liste * 10); ok('Yıllık ödeme 10 ay üzerinden'); }
{ const r = paket.fiyat(pk('oto-sanayi'), { kurallar: { programSayisi: [{ min: 3, yuzde: 40 }], subeSayisi: [], lisansSayisi: [] } }).planlar[1].aylik; assert.strictEqual(r.indirim.yuzde, 40); ok('Tutar kuraldan gelir, koda yazılı oran yok'); }
{ // Sepetle aynı sonuç: paket fiyatı ile sepet hesabı arasında fark olamaz
  const items = pk('konaklama').programlar.map((pid) => ({ pid, plan: 2, period: 'yillik', qty: 1 }));
  const s = indirim.hesapla({ lines: cat.price(items).lines }, { kdv: cat.VAT }); const p = paket.fiyat(pk('konaklama')).planlar[2].yillik;
  assert.strictEqual(p.toplam, s.total); assert.strictEqual(p.kdv, s.vat); assert.strictEqual(p.indirim.tutar, s.discount); ok('Paket tutarı sepet hesabıyla kuruşu kuruşuna aynı');
  const sahte = cat.price(items.map((i) => ({ ...i, price: 1, prices: [1, 1, 1], total: 1 }))); assert.strictEqual(sahte.subtotal, cat.price(items).subtotal); ok('İstemciden gelen tutar yok sayılır');
}
{ cat.setOverrides({ crm: { prices: [1, 2, 3] } }); const m = paket.fiyat(pk('oto-sanayi')).planlar[1].aylik; assert.strictEqual(m.liste, liste - fiyatKatalogDefault('crm') + 2); cat.setOverrides({}); ok('Yönetim panelindeki fiyat değişikliği yansır'); }
function fiyatKatalogDefault(id) { return cat.load().products.find((p) => p.id === id).prices[1]; }
{ cat.setOverrides({ crm: { hidden: true } }); const m = paket.fiyat(pk('oto-sanayi')); assert.strictEqual(m.satista, false); assert.deepStrictEqual([...m.eksik], ['crm']); assert.deepStrictEqual(m.planlar, []); assert.ok(paket.dogrula().length); cat.setOverrides({}); ok('Program gizlenince paket satıştan düşer'); }
assert.strictEqual(paket.yazi(2583), '2.583'); assert.strictEqual(paket.yazi(1347.3), '1.347,30'); ok('Tutar yazımı');

// ---------- Sayfa metni ----------
const KELIME = (s) => s.toLocaleLowerCase('tr').match(/[\p{L}\d]+/gu) || [];
const anaMetin = (h) => ((/<main[\s\S]*?<\/main>/.exec(h) || [''])[0]).replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
const YASAK = /müşterimiz|memnun müşteri|\d+\+? işletme|1 numara|en iyi|entegre çalış|otomatik aktar(ıl|ıy)|sorunsuz|%100/i;
{
  const T = new Set(); const A = new Set();
  for (const p of paket.liste()) {
    const m = METIN[p.id]; assert(m, p.id + ' metni yok');
    assert(m.title.length <= 70, `${p.id} başlık ${m.title.length}`); assert(m.desc.length <= 165, `${p.id} açıklama ${m.desc.length}`); assert(!T.has(m.title) && !A.has(m.desc), p.id + ' başlık/açıklama tekrarı'); T.add(m.title); A.add(m.desc);
    assert.strictEqual(m.sorunlar.length, 3, p.id); assert(m.sss.length >= 3, p.id); assert.deepStrictEqual(Object.keys(m.roller).sort(), [...p.programlar].sort(), p.id + ' roller');
    assert(!YASAK.test(JSON.stringify(m)), p.id + ' kanıtsız iddia');
  }
  ok('Her paketin eşsiz başlık, açıklama, sorun, rol ve SSS metni var');
}
{
  const S = Object.fromEntries(paket.liste().map((p) => [p.id, fs.readFileSync(path.join(ROOT, 'site', 'paketler', p.id, 'index.html'), 'utf8')]));
  const K = Object.fromEntries(Object.entries(S).map(([id, h]) => [id, KELIME(anaMetin(h))]));
  // Üçlü kelime kümelerinin örtüşmesi: sayfalar birbirinin kopyası olmamalı
  const uc = (L) => new Set(L.slice(2).map((_, i) => `${L[i]} ${L[i + 1]} ${L[i + 2]}`));
  const U = Object.entries(K).map(([id, L]) => [id, uc(L)]); let enCok = 0; let cift = '';
  for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { const [a, x] = U[i]; const [b, y] = U[j]; const ort = [...x].filter((w) => y.has(w)).length; const b2 = ort / (x.size + y.size - ort); if (b2 > enCok) { enCok = b2; cift = `${a}/${b}`; } }
  assert(enCok < 0.35, `sayfalar çok benziyor: ${cift} ${enCok.toFixed(2)}`); ok(`Paket sayfaları birbirinin kopyası değil (en yüksek örtüşme ${cift} %${Math.round(enCok * 100)})`);
  for (const [id, L] of Object.entries(K)) assert(L.length >= 220, `${id} ${L.length} kelime`); ok('Her paket sayfası kalite eşiğinin üstünde');
  for (const [id, h] of Object.entries(S)) { assert(!/noindex/.test(h), id); assert(!/aggregateRating|"review"/.test(h), id + ' uydurma şema'); assert(/programlar arasında otomatik veri aktarımı yoktur/.test(h), id + ' aktarım notu'); }
  const xml = fs.readFileSync(path.join(ROOT, 'site', 'sitemap.xml'), 'utf8'); assert(xml.includes('/paketler/</loc>')); for (const id of Object.keys(S)) assert(xml.includes(`/paketler/${id}/</loc>`), id + ' sitemap'); ok('Liste ve paket sayfaları sitemap içinde, noindex yok');
}

// ---------- Sunucu ----------
const iste = (port, yol) => new Promise((tamam, no) => { http.get({ host: '127.0.0.1', port, path: yol }, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (d) => { b += d; }); r.on('end', () => tamam({ s: r.statusCode, h: r.headers, b })); }).on('error', no); });
(async () => {
  const port = 21000 + (process.pid % 20000); const data = fs.mkdtempSync(path.join(os.tmpdir(), 'paket-data-'));
  const ch = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NEBSOFT_DATA: data }, stdio: 'ignore' });
  try {
    for (let i = 0; i < 80; i++) { try { await iste(port, '/robots.txt'); break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }
    const r = await iste(port, '/api/paketler'); assert.strictEqual(r.s, 200); const j = JSON.parse(r.b); assert.strictEqual(j.paketler.length, 24); assert.deepStrictEqual(j.paketler.find((x) => x.id === 'oto-sanayi').planlar, paket.fiyat(pk('oto-sanayi')).planlar); ok('/api/paketler veritabanısız da fiyat döner');
    assert.strictEqual((await iste(port, '/paketler')).h.location, '/paketler/'); assert.strictEqual((await iste(port, '/paketler/oto-sanayi')).h.location, '/paketler/oto-sanayi/'); assert.strictEqual((await iste(port, '/site/paketler/oto-sanayi/')).h.location, '/paketler/oto-sanayi/'); ok('Kanonik olmayan adresler 301 ile yönlenir');
    const s = await iste(port, '/paketler/oto-sanayi/'); assert.strictEqual(s.s, 200); assert(s.b.includes(`data-pk="oto-sanayi:1:net">${paket.yazi(f.net)}<`)); assert((await iste(port, '/paketler/')).s === 200); ok('Sayfa sunucudan tutarıyla açılır');
    assert.strictEqual((await iste(port, '/market/paketler.js')).s, 200); assert((await iste(port, '/index.html')).b.includes('market/paket-ek.js')); ok('Pazar yeri paket dosyalarını yükler');
  } finally { ch.kill(); }
  console.log(`\n${n} kontrol geçti`);
})().catch((e) => { console.error(e); process.exit(1); });
