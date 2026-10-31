// NEBSOFT PDF kullanım kılavuzu üreticisi. Tek komut:
//   node scripts/kilavuz/uret.js pos terzi eticaret       belirtilen programlar
//   node scripts/kilavuz/uret.js --hepsi                  docs/kilavuz/ altında içeriği olan tüm programlar
// Program ?demo=1 ile yerel sunucuda açılır, her sahnenin görüntüsü alınır, işaretler elementin seçicisinden çizilir, Chrome ile PDF basılır.
// Seçici bulunamazsa, işaretli element görünmüyorsa, anlatılan ad kodda veya ekranda yoksa, menü modülü atlanmışsa üretim hata verir ve PDF yazılmaz.
// Çıktı: indir/kilavuz/<id>.pdf + core/kilavuz.json (bağlantılar bu listeye bakar). Ayar: scripts/kilavuz/ayar.js. İçerik: docs/kilavuz/<id>.js. Rehber: docs/kilavuz/DURUM.md
const fs = require('fs'); const os = require('os'); const path = require('path'); const { execSync } = require('child_process');
const { chrome, sunucu, wait, ROOT } = require('./cdp'); const A = require('./ayar'); const { ekranBoyu } = require('./cizim'); const S = require('./sablon'); const DN = require('./denetim'); const { oku } = require('./pdfoku'); const Ort = require('./ortak');
const YARDIM = fs.readFileSync(path.join(__dirname, 'sayfa.js'), 'utf8');
const STIL = `.ns-toasts,.nsd,#nsdroot,.nsd-w,.ns-demo-bar{display:none!important}*{caret-color:transparent!important;animation:none!important;transition:none!important}`;
const dizge = JSON.stringify;
const urunler = () => { global.window = global.window || {}; require(path.join(ROOT, 'market', 'catalog.js')); return window.CATALOG.products; };
const KUR = require(path.join(ROOT, 'core', 'kurulum-adimlari.js')); const YI = require(path.join(ROOT, 'site', 'tools', 'yardim-icerik.js')); const CFG = require(path.join(ROOT, 'site', 'src', 'site.config.js'));

const TARAMA = `(() => { const I = NS.integ, G = window.NB_GUIDES, o = NS.app.opts; const list = ((I.USED || {})[o.id] || Object.keys(I.DEFS)).filter((k) => I.DEFS[k]);
  const prv = (k) => { const d = I.DEFS[k], c = I.cfg(k); if ((G.BRAND_KINDS || {})[k]) return G.forKind(k).map((g) => ({ value: g.key.split(':')[1], label: g.name })); const fs = d.fields(c); const f = fs.find((x) => x.name === 'provider') || fs.find((x) => x.name === 'mode' && x.type === 'select'); return f ? (typeof f.options === 'function' ? f.options() : f.options || []).map((x) => (typeof x === 'object' ? { value: x.value, label: x.label } : { value: x, label: x })) : G.forKind(k).map((g) => ({ value: g.key.split(':')[1], label: g.name })); };
  const kim = (g) => g && ({ name: g.name, status: g.status, sunucu: !!(g.test && g.test.type === 'sunucu'), kapali: G.kapali(g), summary: g.summary, limit: g.limit, verified: g.verified, sources: g.sources || [], prereq: g.prereq || [], where: g.where || [], fields: (g.fields || []).map((f) => ({ name: f.name, type: f.type, pattern: f.pattern, label: f.label, required: !!f.required, nereden: f.help && f.help.where, ne: f.help && f.help.what })), test: g.test && g.test.note, errors: (g.errors || []).map((e) => ({ title: e.title, fix: e.fix })) });
  return { id: o.id, ad: o.name, accent: o.accent, ikon: NS.icon(o.icon || 'grid'), roles: (o.auth && o.auth.roles) || {}, nav: o.nav.filter((n) => n.id).map((n) => ({ id: n.id, label: n.label, roles: n.roles || null })), navHepsi: [...document.querySelectorAll('.ns-nav a[data-nav]')].map((a) => [a.dataset.nav, a.innerText.trim()]), ent: list.map((k) => { const d = I.DEFS[k]; return { k, title: d.title, desc: d.desc, cat: d.cat || '', conn: !!d.conn, provs: prv(k).map((p) => ({ value: String(p.value), label: p.label, kilit: I.unverified(k, p.value), g: kim(G.get(k, p.value)) })) }; }) }; })()`;

function rect(kes, vw, vh) { const x = Math.max(0, kes.x); const y = Math.max(0, kes.y); return { x, y, width: Math.min(vw, kes.x + kes.w) - x, height: Math.min(vh, kes.y + kes.h) - y }; }

// Sahne çekimi: sayfa baştan açılır, ön eylemler yapılır, seçiciler çözülür, kişi verisi bulanıklaşır, görüntü alınır
async function cek(p, B, id, s, ctx) {
  const yer = `${id} / ${ctx.yer}`; const H = ctx.hatalar; let boy = s.boy || A.EKRAN.boy; const en = s.en || A.EKRAN.en; let uzadi = false;
  if (s.boy || s.en) await p.boyut(en, boy);
  try {
    const url = s.adres ? `${B}/apps/${id}/${s.adres}` : `${B}/apps/${id}/?demo=1#/${s.git || ''}`;
    await p.git(url); await wait(s.ilk || 450); await p.calistir(YARDIM + `;(()=>{const t=document.createElement('style');t.textContent=${dizge(STIL)};document.head.append(t)})()`);
    if (!s.adres && s.git) { const g = await p.calistir(`location.hash`); if (!g.startsWith('#/' + s.git)) H.push(`${yer}: ${s.git} adresine gidilemedi`); }
    for (const e of s.once || []) {
      const [t, a, b] = e; let ok = true;
      if (t === 'tikla') ok = await p.calistir(`__k.tikla(${dizge(a)})`); else if (t === 'yaz') ok = await p.calistir(`__k.yaz(${dizge(a)},${dizge(b)})`); else if (t === 'tus') ok = await p.calistir(`__k.tus(${dizge(a)},${dizge(b)})`); else if (t === 'js') await p.calistir(a); else if (t === 'bekle') await wait(a);
      if (!ok) { H.push(`${yer}: ön eylem yapılamadı, seçici yok: ${e.join(' ')}`); return null; }
      await wait(260);
    }
    await wait(s.son || 260);
    const isaretli = s.adimlar.filter((a) => a.sec);
    // İşaretli öğe ekranın altında kalıyorsa pencere içeriğe göre uzar: sahneye boy yazmak gerekmez
    const gerekli = ekranBoyu(await p.calistir(`${dizge(isaretli.map((a) => a.sec))}.map((x)=>__k.kutu(x)).filter(Boolean)`), boy); if (gerekli > boy) { boy = gerekli; uzadi = true; await p.boyut(en, boy); await wait(250); }
    if (isaretli.length) await p.calistir(`(()=>{const e=__k.bul(${dizge(isaretli[0].sec)});if(e){const r=e.getBoundingClientRect();if(r.bottom>innerHeight-10||r.top<0)e.scrollIntoView({block:'center'});}})()`);
    await wait(120);
    const kirp = s.kirp === 'tam' ? null : await p.calistir(`(()=>{const e=${s.kirp === 'pencere' ? `document.querySelector('.ns-overlay [role=dialog],.ns-overlay .modal,.ns-overlay>*')` : s.kirp && s.kirp !== 'ana' ? `__k.bul(${dizge(s.kirp)})` : `document.querySelector('.ns-main')||document.body`};if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height}})()`);
    if (s.kirp && s.kirp !== 'tam' && !kirp) { H.push(`${yer}: kırpma alanı bulunamadı: ${s.kirp}`); return null; }
    const alan = kirp ? rect(kirp, en, boy) : { x: 0, y: 0, width: en, height: boy };
    for (const a of s.adimlar) {
      if (!a.sec) continue; const k = await p.calistir(`__k.kutu(${dizge(a.sec)})`);
      if (!k) { H.push(`${yer}: seçici bulunamadı: ${a.sec}`); continue; }
      if (!k.ustte && !a.ortulu) H.push(`${yer}: element görünmüyor veya başka bir şeyin altında: ${a.sec}`);
      if (k.x + k.w < alan.x || k.y + k.h < alan.y || k.x > alan.x + alan.width || k.y > alan.y + alan.height) H.push(`${yer}: element görüntü alanının dışında: ${a.sec}`);
      if (a.metin.includes('{dugme}')) { const y = DN.dugmeYaz(a.metin, k.metin); if (y) a.metin = y; else H.push(`${yer}: beklenmeyen düğme adı: "${k.metin}"`); }
      a.kutu = { x: k.x - alan.x, y: k.y - alan.y, w: k.w, h: k.h }; a.bulunan = k.metin; a.isaretli = true; a.tur = a.tur || 'cerceve';
    }
    ctx.ekran.push(await p.calistir(`document.body.innerText + ' ' + [...document.querySelectorAll('[placeholder],[title],[aria-label],option')].map(e=>e.placeholder||e.title||e.getAttribute('aria-label')||e.textContent).join(' ') + ' ' + [...document.querySelectorAll('input[value],button')].map(e=>e.value||'').join(' ')`));
    for (const b of s.bulanik || []) if (!await p.calistir(`__k.bulanik(${dizge(b)})`)) H.push(`${yer}: bulanıklaştırılacak element yok: ${b}`);
    ctx.maske += await p.calistir('__k.maskele()'); await wait(60);
    const kay = await p.calistir(`[scrollX, scrollY]`); const j = await p.goruntu({ ...alan, x: alan.x + kay[0], y: alan.y + kay[1] }, A.EKRAN.kalite); // kırpma belge koordinatıdır, kutu ise pencereye göre
    const denet = await ctx.olcum.calistir(`(async()=>{const b=await (await fetch('data:image/jpeg;base64,${j.toString('base64')}')).blob();const i=await createImageBitmap(b);const k=new OffscreenCanvas(i.width,i.height).getContext('2d',{willReadFrequently:true});k.drawImage(i,0,0);const O=${A.EKRAN.olcek};return ${dizge(s.adimlar.filter((a) => a.kutu).map((a) => a.kutu))}.map((m)=>{const w=Math.max(4,Math.round(m.w*O)),h=Math.max(4,Math.round(m.h*O));const d=k.getImageData(Math.max(0,Math.round(m.x*O)),Math.max(0,Math.round(m.y*O)),w,h).data;let t=0,q=0,n=d.length/4;for(let x=0;x<d.length;x+=4){const y=(d[x]+d[x+1]+d[x+2])/3;t+=y;q+=y*y;}return Math.sqrt(Math.max(0,q/n-(t/n)**2));})})()`);
    s.adimlar.filter((a) => a.kutu).forEach((a, i) => { if (denet[i] < 2) H.push(`${yer}: işaret boş alana düşüyor: ${a.sec}`); });
    if (j.length / (alan.width * alan.height) < 0.012) H.push(`${yer}: görüntü boş görünüyor (${j.length} bayt)`);
    const dosya = path.join(ctx.dir, `e${String(++ctx.no).padStart(3, '0')}.jpg`); fs.writeFileSync(dosya, j); ctx.bayt += j.length;
    s.cekim = { dosya: 'file:///' + dosya.replace(/\\/g, '/'), w: Math.round(alan.width), h: Math.round(alan.height) };
    return s;
  } finally { if (s.boy || s.en || uzadi) await p.boyut(A.EKRAN.en, A.EKRAN.boy); }
}

// Dizi biçimli adımlar nesneye çevrilir: ['metin', 'seçici', 'ok']
const adimla = (s) => ({ ...s, adimlar: (s.adimlar || []).map((a) => (typeof a === 'string' ? { metin: a } : Array.isArray(a) ? { metin: a[0], sec: a[1] || null, tur: a[2] || null } : a)) });
const sahneler = (K) => { const L = []; const g = (x, yer) => (x || []).forEach((s, i) => { x[i] = adimla(s); L.push([x[i], `${yer} sahne ${i + 1}`]); }); K.moduller.forEach((m) => (m.gorevler || []).forEach((t) => g(t.sahneler, `${m.id} › ${t.baslik}`))); g(K.ekrantanitim, 'ekran tanıtımı'); (K.musteri || []).forEach((m) => g(m.sahneler, 'müşteri ' + m.ad)); g(K.entSahne, 'entegrasyon merkezi'); Object.entries(K.entegrasyon || {}).forEach(([k, e]) => g(e.sahneler, 'entegrasyon ' + k)); return L; };

async function program(id, B, ch, sira) {
  const dosya = path.join(A.KAYNAK, `${id}.js`); if (!fs.existsSync(dosya)) throw new Error(`İçerik yok: ${dosya}`);
  const urun = urunler().find((u) => u.id === id); if (!urun) throw new Error(`Katalogda yok: ${id}`);
  const K = require(dosya)(Ort); const p = await ch.yeni({ en: A.EKRAN.en, boy: A.EKRAN.boy, olcek: A.EKRAN.olcek });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `kilavuz-${id}-`)); const olcum = await ch.yeni({ en: 400, boy: 300, olcek: 1 }); const ctx = { olcum, dir, no: 0, bayt: 0, maske: 0, hatalar: [], ekran: [] };
  await p.git(`${B}/apps/${id}/?demo=1`); await p.calistir(`try{localStorage.clear();sessionStorage.clear()}catch(e){}`);
  await p.git(`${B}/apps/${id}/?demo=1`); await wait(700); const R = await p.calistir(TARAMA);
  const O = Ort.entegrasyonHazirla(K, R, id); // her bağlantıya sihirbaz görüntüsü eklenir
  const L = sahneler(K); const bas = Date.now();
  for (let i = 0; i < L.length; i++) { const [s, yer] = L[i]; ctx.yer = yer; await cek(p, B, id, s, ctx); if ((i + 1) % 10 === 0) console.log(`  ${id}: ${i + 1}/${L.length} ekran`); }
  // Denetimler: biri bile tutmazsa PDF yazılmaz
  const kod = DN.kodMetni(id); const ekran = ctx.ekran.join(' ');
  const H = [...ctx.hatalar, ...DN.kapsam(K, R.navHepsi), ...DN.entegrasyonKapsam(K, R.ent.map((e) => e.k)), ...DN.adlar(K, ekran, kod), ...DN.vaat(K), ...[...new Set(p.hatalar)].map((x) => 'Konsol hatası: ' + x.slice(0, 200))];
  const kisi = DN.kisiVerisi(ekran); if (kisi.length) console.log(`  uyarı: ${id} ekranında 11 haneli sayı: ${kisi.slice(0, 5).join(', ')} (bulanıklaştırıldı)`);
  if (H.length) { const e = new Error(`${id}: ${H.length} sorun, PDF yazılmadı\n - ` + [...new Set(H)].join('\n - ')); e.hatali = true; throw e; }
  const surum = `Sürüm ${require(path.join(ROOT, 'package.json')).version} · ${execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()}`;
  const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const logo = 'file:///' + A.LOGO.replace(/\\/g, '/');
  const D = { K, urun, surum, tarih, logo, ikon: R.ikon, alan: CFG.domain.replace('https://', ''), renk: urun.accent || R.accent || '#1D7BF5', bolumler: Ort.bolumler(K, R, { urun, kurulum: KUR.list(id), yardim: YI[id], CFG, id }), sayfa: null };
  const html = path.join(dir, 'k.html'); const bas2 = async () => { fs.writeFileSync(html, S.belge(D)); await p.git('file:///' + html.replace(/\\/g, '/')); await wait(250); return p.pdf({ printBackground: true, preferCSSPageSize: true, generateTaggedPDF: true, generateDocumentOutline: true }); };
  let pdf = await bas2(); let b = oku(pdf); D.sayfa = b.hedef; pdf = await bas2(); b = oku(pdf); // ikinci baskı: içindekiler gerçek sayfa numarasını alır
  const eksik = D.bolumler.flatMap((x) => [x.capa, ...(x.alt || []).map((a) => a.capa)]).filter((c) => !b.hedef[c]); if (eksik.length) throw new Error(`${id}: içindekiler hedefi PDF'te yok: ${eksik.join(', ')}`);
  fs.mkdirSync(A.CIKTI, { recursive: true }); const hedef = path.join(A.CIKTI, `${id}.pdf`); fs.writeFileSync(hedef, pdf);
  if (process.env.KILAVUZ_SAKLA) console.log('  görüntüler:', dir); else fs.rmSync(dir, { recursive: true, force: true }); await p.c.send('Page.close').catch(() => {}); await olcum.c.send('Page.close').catch(() => {});
  const mb = pdf.length / 1048576; if (mb > A.SINIR_MB) console.log(`  UYARI: ${id} ${mb.toFixed(1)} MB, sınır ${A.SINIR_MB} MB`);
  console.log(`✓ ${id}: ${b.sayfa} sayfa, ${ctx.no} ekran, ${mb.toFixed(1)} MB, ${ctx.maske} kişi bilgisi bulanık, ${b.bag} iç bağlantı, ${Math.round((Date.now() - bas) / 1000)} sn → ${path.relative(ROOT, hedef)}`);
  return { id, sayfa: b.sayfa, boyut: pdf.length, ekran: ctx.no, tarih: new Date().toLocaleDateString('sv-SE') };
}

(async () => {
  const a = process.argv.slice(2); const ids = a.includes('--hepsi') ? fs.readdirSync(A.KAYNAK).filter((f) => /^[a-z]+\.js$/.test(f)).map((f) => f.slice(0, -3)).filter((id) => !A.YAYIN_DISI.includes(id)) : a; if (!ids.length) throw new Error('Program verin: node scripts/kilavuz/uret.js pos terzi');
  const s = await sunucu(); const ch = await chrome(Number(process.env.KILAVUZ_CDP) || 9473); const liste = fs.existsSync(A.LISTE) ? JSON.parse(fs.readFileSync(A.LISTE, 'utf8')) : {}; let hata = 0;
  try {
    for (const id of ids) { try { const r = await program(id, s.adres, ch); if (!A.YAYIN_DISI.includes(id)) liste[id] = r; } catch (e) { hata++; console.error(e.hatali ? e.message : e); } }
    fs.writeFileSync(A.LISTE, JSON.stringify(Object.fromEntries(Object.keys(liste).filter((k) => !A.YAYIN_DISI.includes(k)).sort().map((k) => [k, liste[k]])), null, 1) + '\n');
  } finally { await ch.kapat(); await s.kapat(); }
  if (hata) process.exit(1);
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
