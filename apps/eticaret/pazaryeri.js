/* NEBSOFT Pazaryeri Merkezi — çok kanallı bağlantı, fiyat/stok kuralları, listeleme, kategori eşleştirme,
   hakediş mutabakatı, müşteri soruları ve senkron günlüğü. E-ticaret paneli (app.js) sayfa olarak kullanır. */
window.MPHUB = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;

  // Varsayılan oranlar örnektir; her mağaza kendi sözleşmesindeki komisyonu girer
  const CH = {
    trendyol: { name: 'Trendyol', color: '#f27a1a', commission: 21.5, fixedFee: 8.49, payoutDays: 7, ship: 'Trendyol Express / anlaşmalı kargo' },
    hepsiburada: { name: 'Hepsiburada', color: '#ff6000', commission: 19, fixedFee: 6.99, payoutDays: 10, ship: 'HepsiJET / anlaşmalı kargo' },
    n11: { name: 'n11', color: '#5b2d90', commission: 16, fixedFee: 5.5, payoutDays: 7, ship: 'Anlaşmalı kargo' },
    amazon: { name: 'Amazon TR', color: '#232f3e', commission: 15, fixedFee: 0, payoutDays: 14, ship: 'Amazon Lojistik (FBA) / satıcı gönderimi' },
    pazarama: { name: 'Pazarama', color: '#0094d8', commission: 12, fixedFee: 0, payoutDays: 7, ship: 'Anlaşmalı kargo' },
    ciceksepeti: { name: 'Çiçeksepeti', color: '#d81e5b', commission: 20, fixedFee: 4.99, payoutDays: 10, ship: 'Anlaşmalı kargo' },
  };
  // Kanal kategori ağaçlarından örnek yollar (gerçek bağlantıda API'den çekilir)
  const TREE = ['Kadın > Giyim > Elbise', 'Kadın > Giyim > Bluz', 'Kadın > Giyim > Gömlek', 'Kadın > Giyim > Tişört', 'Kadın > Giyim > Pantolon', 'Kadın > Giyim > Etek', 'Kadın > Giyim > Ceket', 'Kadın > Giyim > Mont & Kaban', 'Kadın > Aksesuar > Çanta', 'Kadın > Aksesuar > Şal & Eşarp', 'Kadın > Aksesuar > Şapka', 'Kadın > Ayakkabı > Sandalet', 'Kadın > Ayakkabı > Babet', 'Kadın > Ayakkabı > Spor Ayakkabı', 'Kadın > Ayakkabı > Çizme & Bot'];
  const GUESS = { elbise: 'Kadın > Giyim > Elbise', bluz: 'Kadın > Giyim > Bluz', pantolon: 'Kadın > Giyim > Pantolon', ceket: 'Kadın > Giyim > Ceket', aksesuar: 'Kadın > Aksesuar > Çanta', ayakkabi: 'Kadın > Ayakkabı > Spor Ayakkabı' };
  const LST = { yayinda: ['Yayında', 'ok'], onay: ['Onay bekliyor', 'warn'], hata: ['Hatalı', 'err'], pasif: ['Pasif', ''], yok: ['Gönderilmedi', ''] };

  let db;
  const chs = () => db.data.mpChannels;
  const ch = (k) => ({ ...CH[k], ...(chs()[k] || {}) });
  const connected = () => Object.keys(CH).filter((k) => ch(k).connected);
  const log = (k, action, detail, ok = true) => { db.data.mpLog = db.data.mpLog || []; db.data.mpLog.unshift({ id: NS.uid(), at: new Date().toISOString(), ch: k, action, detail, ok }); if (db.data.mpLog.length > 300) db.data.mpLog.length = 300; };
  const chBadge = (k) => (CH[k] ? `<span class="badge" style="background:${CH[k].color};color:#fff;border:0">${esc(CH[k].name)}</span>` : badge(String(k || '-'), 'acc'));
  // Eski kayıtlardaki görünen adları ("Trendyol") anahtara çevirir
  const keyOf = (v) => (CH[v] ? v : Object.keys(CH).find((k) => CH[k].name.toLocaleLowerCase('tr') === String(v || '').toLocaleLowerCase('tr')) || v);
  // Kanal fiyatı: mağaza fiyatı + fiyat farkı %, ,90 ile biten fiyat
  const chPrice = (p, k) => { const base = p.sale || p.price; const c = ch(k); const v = base * (1 + (Number(c.markup) || 0) / 100); return Math.max(1, Math.ceil(v) - 0.1); };
  const chStock = (p, k) => sum(p.variants, (v) => Math.max(0, v.stock - (Number(ch(k).buffer) || 0)));
  const listing = (pid, k) => db.find('listings', (x) => x.pid === pid && x.ch === k);
  // ---- Canlı bağlantı: server.js köprüsündeki adaptörler (server/connectors) ----
  // Canlı mod yalnızca resmî dokümanla doğrulanan adaptörlerde seçilebilir (docs/urun/ETICARET.md §6, 29.10.2026).
  // Hepsiburada: geliştirici dokümanına erişilemedi (DOĞRULANAMADI) → canlı seçilemez, kod korunur.
  const LIVE = ['trendyol', 'n11'];
  const UNVERIFIED = { hepsiburada: 'Hepsiburada API dokümanı doğrulanamadı (developers.hepsiburada.com erişilemedi); canlı mod kapalı.' };
  const vatOfP = (p) => { const v = (p || {}).vat; return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : Number(db.settings({}).vat ?? 20); };
  const isLive = (k) => LIVE.includes(k) && ch(k).connected && ch(k).mode === 'live';
  const anyLive = () => connected().some(isLive);
  async function live(k, action, payload = {}, credsOverride) {
    const c = { ...ch(k), ...(credsOverride || {}) };
    try {
      const r = await fetch('/api/kanal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: k, action, creds: { sellerId: c.sellerId, apiKey: c.apiKey, apiSecret: c.apiSecret, stage: !!c.stage, integrator: c.integrator || '' }, payload }) });
      const j = await r.json(); log(k, action + ' (canlı)', j.ok ? 'başarılı' : j.error || 'hata', !!j.ok); return j;
    } catch (e) { const j = { ok: false, error: 'Sunucu köprüsüne ulaşılamadı — uygulamayı "node server.js" ile açın' }; log(k, action + ' (canlı)', j.error, false); return j; }
  }
  // Varyant barkodu yoksa stok kodu (SKU) barkod olarak gönderilir
  const variantItems = (k, pairs) => pairs.map(({ p, v }) => ({ barcode: v.barcode || v.sku, sku: v.sku, hbSku: v.hbSku, stock: Math.max(0, v.stock - (Number(ch(k).buffer) || 0)), price: chPrice(p, k), listPrice: Math.max(chPrice(p, k), Math.ceil(p.price * (1 + (Number(ch(k).markup) || 0) / 100)) - 0.1) }));
  const listedPairs = (k) => db.all('products', (p) => (listing(p.id, k) || {}).status === 'yayinda').flatMap((p) => p.variants.map((v) => ({ p, v })));
  // Kod eşleşmesi: stok kodu, barkod veya daha önce elle eşleştirilen pazaryeri kodu (aliases)
  const findVariant = (code) => { const c = String(code || '').trim().toUpperCase(); if (!c) return null; for (const p of db.all('products')) { const v = p.variants.find((x) => [x.sku, x.barcode, ...(x.aliases || [])].some((k) => k && String(k).toUpperCase() === c)); if (v) return { p, v }; } return null; };
  // Sipariş başına komisyon, hizmet bedeli, kargo ve net hakediş
  const settle = (o) => {
    const c = ch(o.channel); const gross = o.total; const com = Math.round(gross * (Number(c.commission) || 0)) / 100; const fee = Number(c.fixedFee) || 0; const ship = o.channelShip ?? 0;
    const net = Math.round((gross - com - fee - ship) * 100) / 100;
    const base = o.deliveredAt || (o.status === 'teslim' ? addDays(new Date(o.at), 3).toISOString() : null);
    const due = base ? iso(addDays(new Date(base), Number(c.payoutDays) || 7)) : null;
    // "Ödendi" yalnızca pazaryerinden çekilen hakediş kaydıyla veya kullanıcının hesabını kontrol edip işaretlemesiyle olur; tahmini vade geçmesi ödeme sayılmaz
    const st = ['iptal', 'iade'].includes(o.status) ? 'iptal' : o.payout && o.payout.paid ? 'odendi' : !due ? 'teslim-bekliyor' : due <= today() ? 'vade-gecti' : 'vadede';
    return { gross, com, fee, ship, net, due, st };
  };

  // Demo verisi: bağlı kanallar, listelemeler, kanal siparişleri ve sorular (bir kez)
  function ensure(d) {
    db = d;
    let fix = false; (db.data.orders || []).forEach((o) => { if (o.channel && !CH[o.channel] && CH[keyOf(o.channel)]) { o.channel = keyOf(o.channel); fix = true; } }); if (fix) db.save();
    if (db.data.mpChannels) return;
    const rnd = NS.rand, pick = NS.pick;
    db.data.mpChannels = { trendyol: { connected: true, sellerId: '482913', markup: 18, buffer: 1, autoStock: true, autoPrice: true }, hepsiburada: { connected: true, sellerId: 'LINA-HB-2207', markup: 15, buffer: 1, autoStock: true, autoPrice: true }, n11: { connected: true, sellerId: 'linabutik', markup: 12, buffer: 2, autoStock: true, autoPrice: false } };
    db.data.mpCatMap = {};
    ['trendyol', 'hepsiburada'].forEach((k) => { db.data.mpCatMap[k] = { ...GUESS }; });
    db.data.mpCatMap.n11 = { elbise: GUESS.elbise, bluz: GUESS.bluz };
    db.data.listings = [];
    db.all('products').forEach((p, i) => {
      db.data.listings.push({ id: NS.uid(), pid: p.id, ch: 'trendyol', status: i % 11 === 3 ? 'hata' : i % 9 === 4 ? 'onay' : 'yayinda', error: i % 11 === 3 ? 'Görsel çözünürlüğü 1200x1800 altında' : '', syncedAt: addDays(new Date(), -rnd(0, 3)).toISOString(), extId: 'TY' + rnd(100000000, 999999999) });
      if (i % 3 !== 2) db.data.listings.push({ id: NS.uid(), pid: p.id, ch: 'hepsiburada', status: i % 13 === 5 ? 'hata' : 'yayinda', error: i % 13 === 5 ? 'Zorunlu özellik eksik: Kumaş tipi' : '', syncedAt: addDays(new Date(), -rnd(0, 3)).toISOString(), extId: 'HB' + rnd(10000000, 99999999) });
      if (['elbise', 'bluz'].includes(p.cat)) db.data.listings.push({ id: NS.uid(), pid: p.id, ch: 'n11', status: 'yayinda', error: '', syncedAt: addDays(new Date(), -rnd(0, 5)).toISOString(), extId: 'N' + rnd(1000000, 9999999) });
    });
    const conn = ['trendyol', 'trendyol', 'trendyol', 'hepsiburada', 'hepsiburada', 'n11'];
    db.all('orders').forEach((o, i) => { if (i % 5 < 2) { const k = pick(conn); o.source = o.channel; o.channel = k; o.channelNo = (k === 'trendyol' ? '1' : k === 'hepsiburada' ? '4' : '2') + rnd(10000000, 99999999); o.channelShip = rnd(45, 75); if (o.status === 'teslim') o.deliveredAt = addDays(new Date(o.at), rnd(2, 4)).toISOString(); } });
    const Q = ['Bu ürünün kumaşı terletir mi?', 'Boy 1.65, kilo 58 hangi bedeni almalıyım?', 'Ürün kalıbı dar mı, bol mu?', 'Siyah rengi ne zaman stoğa girer?', 'Astarlı mı?', 'Makinede yıkanabilir mi?', 'Kargoya ne zaman verilir?'];
    db.data.mpQuestions = Array.from({ length: 9 }, (_, i) => { const p = pick(db.all('products')); const at = new Date(Date.now() - rnd(1, 40) * 3600e3); return { id: NS.uid(), ch: pick(['trendyol', 'trendyol', 'hepsiburada', 'n11']), pid: p.id, text: Q[i % Q.length], customer: pick(['A*** K***', 'M*** T***', 'S*** Y***', 'E*** D***']), at: at.toISOString(), answer: i > 5 ? 'Merhaba, ürünümüz normal kalıptır; kendi bedeninizi tercih edebilirsiniz. İyi alışverişler dileriz.' : '', answeredAt: i > 5 ? new Date(at.getTime() + 3 * 3600e3).toISOString() : null }; });
    db.data.mpLog = [];
    ['trendyol', 'hepsiburada', 'n11'].forEach((k) => { log(k, 'Stok senkronu', `${rnd(80, 140)} varyant güncellendi`); log(k, 'Sipariş çekme', `${rnd(0, 4)} yeni sipariş`); });
    db.save();
  }

  // ---------- Kanallar & özet ----------
  function hubPage(el, p, app) {
    const since = iso(addDays(new Date(), -30));
    const orders = db.all('orders', (o) => CH[o.channel] && o.at.slice(0, 10) >= since && o.status !== 'iptal');
    const own = db.all('orders', (o) => !CH[o.channel] && o.at.slice(0, 10) >= since && o.status !== 'iptal');
    const rows = Object.keys(CH).map((k) => { const os = orders.filter((o) => o.channel === k); const st = os.map(settle); const ls = db.all('listings', (x) => x.ch === k); return { id: k, k, c: ch(k), n: os.length, gross: sum(st, (x) => x.gross), com: sum(st, (x) => x.com + x.fee), net: sum(st, (x) => x.net), live: ls.filter((x) => x.status === 'yayinda').length, err: ls.filter((x) => x.status === 'hata').length }; });
    const openQ = db.all('mpQuestions', (q) => !q.answer).length;
    el.innerHTML = pageHead('Pazaryeri Merkezi', 'Tüm pazaryerlerinizi tek panelden yönetin: ürün, stok, fiyat, sipariş, soru ve hakediş', `<button class="btn" id="pull">${icon('download')} Siparişleri çek</button><button class="btn" id="sync">${icon('refresh')} Stok & fiyat gönder</button>`) + `
      ${anyLive() ? `<div class="card pad mb row" style="border-color:var(--ok)">${icon('check')}<span class="grow small"><b>Canlı mod:</b> ${connected().filter(isLive).map((k) => esc(CH[k].name)).join(', ')} gerçek API ile çalışıyor. Diğer kanallar simülasyonda.</span></div>` : `<div class="card pad mb row" style="border-color:var(--warn)">${icon('info')}<span class="grow small">Tüm kanallar <b>simülasyon</b> modunda: işlemler kaydedilir ama pazaryerine gitmez. Canlıya almak için kanalın ⚙ ayarında <b>Canlı mod</b>'u seçip API bilgilerini girin (Trendyol ve n11 doğrudan bağlanır; uygulama <code>node server.js</code> ile çalışmalı). Hepsiburada'nın API dokümanı doğrulanamadığı için canlı mod kapalı.</span></div>`}
      <div class="grid g4 mb">${kpi('Pazaryeri cirosu (30 gün)', money(sum(rows, (r) => r.gross)), 'store', 'info')}${kpi('Komisyon + hizmet bedeli', money(sum(rows, (r) => r.com)), 'percent', 'warn')}${kpi('Kendi mağaza cirosu', money(sum(own, (o) => o.total)), 'globe', 'ok')}${kpi('Yanıt bekleyen soru', openQ, 'message', openQ ? 'err' : '')}</div>
      <div class="card mb"><div class="card-h"><h3>Kanallar</h3></div>${table({ rows, columns: [
        { label: 'Pazaryeri', render: (r) => `${chBadge(r.k)}<div class="small faint mt">${r.c.connected ? `Satıcı no ${esc(r.c.sellerId || '-')}` : 'Bağlı değil'}</div>` },
        { label: 'Durum', render: (r) => (r.c.connected ? `${isLive(r.k) ? badge('Canlı', 'ok') : badge('TEST (simülasyon)', 'warn')}${UNVERIFIED[r.k] ? ' ' + badge('API doğrulanamadı', 'err') : ''}${r.c.autoStock ? ' ' + badge('Oto stok', 'info') : ''}${r.c.autoPrice ? ' ' + badge('Oto fiyat', 'info') : ''}` : badge('Pasif')) },
        { label: 'Fiyat farkı / tampon', render: (r) => (r.c.connected ? `+%${Number(r.c.markup) || 0} · ${Number(r.c.buffer) || 0} adet` : '-') },
        { label: 'Listeleme', cls: 'right', render: (r) => (r.c.connected ? `${r.live} yayında${r.err ? ` · <span style="color:var(--err)">${r.err} hata</span>` : ''}` : '-') },
        { label: 'Sipariş (30g)', cls: 'right', key: 'n' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.gross) }, { label: 'Komisyon', cls: 'right', render: (r) => `${money(r.com)}<div class="small faint">%${Number(r.c.commission) || 0} + ${money(Number(r.c.fixedFee) || 0)}</div>` }, { label: 'Net', cls: 'right', render: (r) => `<b>${money(r.net)}</b>` },
      ], actions: [{ icon: 'settings', act: 'cfg', title: 'Bağlantı ve kurallar' }] })}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Senkron günlüğü</h3></div><div class="card-b" style="max-height:340px;overflow:auto">${(db.data.mpLog || []).slice(0, 40).map((x) => `<div class="list-item small">${chBadge(x.ch)}<span class="grow"><b>${esc(x.action)}</b> · ${esc(x.detail)}</span><span class="faint">${NS.ago(x.at)}</span>${x.ok ? '' : badge('Hata', 'err')}</div>`).join('') || '<div class="faint small">Kayıt yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Nasıl çalışır?</h3></div><div class="card-b small"><p style="margin-top:0"><b>1. Bağlayın:</b> her pazaryerinin satıcı paneli API bilgilerini girin.</p><p><b>2. Eşleştirin:</b> kategorilerinizi pazaryeri kategorileriyle bir kez eşleştirin.</p><p><b>3. Gönderin:</b> ürünleri seçip tek tıkla listeleyin; fiyat farkı ve stok tamponu kanala göre uygulanır.</p><p><b>4. Unutun:</b> siparişler mağaza siparişi gibi düşer, stok tüm kanallarda anında düşer, hakediş takip edilir.</p><p class="faint" style="margin-bottom:0">Gerçek gönderim Entegrasyonlar &gt; Pazaryerleri'nde tanımlı servis üzerinden yapılır; tanımlı değilse simülasyon modunda çalışır.</p></div></div></div>`;
    on(el, 'click', '[data-act="cfg"]', (e, b) => cfgModal(b.dataset.id, app));
    $('#sync', el).onclick = async () => {
      const ks = connected(); if (!ks.length) return toast('Bağlı pazaryeri yok', 'err');
      let bad = 0, sim = 0;
      for (const k of ks) {
        if (isLive(k)) {
          const items = variantItems(k, listedPairs(k)); if (!items.length) continue;
          const r = await live(k, 'stok-fiyat', { items }); if (!r.ok) { bad++; toast(`${CH[k].name}: ${r.error}`, 'err'); continue; }
          db.data.mpBatches = (db.data.mpBatches || []).concat((r.data.batches || []).filter(Boolean).map((id) => ({ ch: k, id, kind: 'stok', at: new Date().toISOString() })));
          await checkBatches(k);
        } else {
          const n = db.all('listings', (x) => x.ch === k && x.status === 'yayinda').length;
          log(k, 'TEST: stok & fiyat gönderilmedi (simülasyon)', `${n} ürün`, false); sim++;
        }
      }
      db.save(); const sent = ks.length - bad - sim; toast([sent ? `${sent} kanala stok ve fiyat gönderildi` : '', bad ? `${bad} kanal hatalı (günlüğe bakın)` : '', sim ? `${sim} kanal TEST (simülasyon): gönderilmedi` : ''].filter(Boolean).join(' · '), bad ? 'err' : sim ? 'warn' : 'ok'); app.refresh();
    };
    $('#pull', el).onclick = async () => { const n = await pullOrders(); toast(n.err ? n.err : `${n.count} yeni pazaryeri siparişi alındı`, n.err ? 'err' : n.count ? 'ok' : ''); app.refresh();
    };
  }
  function cfgModal(k, app) {
    const c = ch(k);
    modal({ title: `${CH[k].name} bağlantısı`, size: 'wide', body: `${UNVERIFIED[k] ? `<div class="card pad mb small" style="border-color:var(--err)">${icon('alert')} ${esc(UNVERIFIED[k])} Siparişleri ve stoğu bu kanalda pazaryeri panelinden yönetin.</div>` : !LIVE.includes(k) ? `<div class="card pad mb small" style="border-color:var(--warn)">${icon('info')} ${esc(CH[k].name)} için doğrudan API bağlantısı yok; bu kanal yalnızca TEST (simülasyon) modunda çalışır, pazaryerine hiçbir şey gönderilmez.</div>` : ''}<div class="form-grid">${NS.fieldsHtml([{ type: 'section', label: 'API bilgileri (satıcı paneli > entegrasyon)' }, ...(LIVE.includes(k) ? [{ name: 'mode', label: 'Çalışma modu', type: 'select', options: [{ value: 'sim', label: 'Simülasyon (pazaryerine gitmez)' }, { value: 'live', label: 'Canlı (gerçek API)' }], value: c.mode || 'sim' }, { name: 'stage', label: 'Test ortamı (stage / sit)', type: 'checkbox', value: !!c.stage }] : []), { name: 'sellerId', label: k === 'hepsiburada' ? 'Merchant ID' : k === 'n11' ? 'Mağaza adı' : 'Satıcı / mağaza no', value: c.sellerId }, { name: 'apiKey', label: k === 'hepsiburada' ? 'Servis kullanıcı adı' : k === 'n11' ? 'API anahtarı (appKey)' : 'API anahtarı', value: c.apiKey || '' }, { name: 'apiSecret', label: k === 'hepsiburada' ? 'Servis anahtarı' : k === 'n11' ? 'API şifresi (appSecret)' : 'API gizli anahtar', type: 'password', value: c.apiSecret || '' }, ...(k === 'trendyol' ? [{ name: 'brandId', label: 'Trendyol marka ID (ürün gönderimi için)', type: 'number', value: c.brandId || '' }] : []),
        { type: 'section', label: 'Kurallar' }, { name: 'markup', label: 'Fiyat farkı % (komisyonu karşılamak için)', type: 'number', value: c.markup ?? 0 }, { name: 'buffer', label: 'Stok tamponu (varyant başına düşülecek adet)', type: 'number', value: c.buffer ?? 0 }, { name: 'commission', label: 'Komisyon % (sözleşmenize göre)', type: 'number', step: '0.01', value: c.commission }, { name: 'fixedFee', label: 'Sipariş başı hizmet bedeli (₺)', type: 'number', step: '0.01', value: c.fixedFee }, { name: 'payoutDays', label: 'Hakediş vadesi (teslimden sonra gün)', type: 'number', value: c.payoutDays }, { name: 'autoStock', label: 'Stok değişince otomatik gönder', type: 'checkbox', value: c.autoStock }, { name: 'autoPrice', label: 'Fiyat değişince otomatik gönder', type: 'checkbox', value: c.autoPrice }])}</div><p class="small faint">Kargo: ${esc(CH[k].ship)}</p>`,
      actions: [...(c.connected ? [{ label: 'Bağlantıyı kes', cls: 'danger', onClick: async (close) => { if (!(await confirm(`${CH[k].name} bağlantısı kesilsin mi? Listelemeler pasife alınır.`))) return; db.data.mpChannels[k] = { ...(chs()[k] || {}), connected: false }; db.all('listings', (x) => x.ch === k).forEach((x) => { x.status = 'pasif'; }); log(k, 'Bağlantı', 'Kesildi'); db.save(); close(); app.refresh(); } }] : []), { label: 'Vazgeç' }, { label: c.connected ? 'Kaydet' : 'Bağlan ve test et', cls: 'primary', onClick: async (close, b) => {
        const v = NS.readForm(b); if (!LIVE.includes(k)) v.mode = 'sim';
        if (!v.sellerId || !v.apiKey) return toast('Satıcı no ve API anahtarı gerekli', 'err');
        // Canlı modda kayıttan önce gerçek bağlantı testi yapılır
        if (v.mode === 'live') { toast('Bağlantı test ediliyor…'); const r = await live(k, 'baglanti-test', {}, v); if (!r.ok) { db.save(); return toast(`${CH[k].name} bağlantısı kurulamadı: ${r.error}`, 'err'); } toast(`${CH[k].name} canlı bağlantı başarılı`, 'ok'); }
        db.data.mpChannels[k] = { ...(chs()[k] || {}), ...v, connected: true }; if (!c.connected) { log(k, 'Bağlantı', 'Kuruldu, test başarılı'); db.data.mpCatMap[k] = db.data.mpCatMap[k] || {}; }
        db.save(); close(); toast(`${CH[k].name} kaydedildi`, 'ok'); app.refresh();
      } }] });
  }

  // ---------- Listeleme (ürün × kanal) ----------
  function listingsPage(el, p, app) {
    let q = '', only = '', sel = new Set();
    const draw = () => {
      db.load(); const ks = connected();
      const prods = db.all('products', (x) => x.active).filter((x) => NS.match(q, x.name, x.cat)).filter((x) => !only || (only === 'hata' ? ks.some((k) => (listing(x.id, k) || {}).status === 'hata') : ks.some((k) => !listing(x.id, k))));
      $('#lt', el).innerHTML = `<div class="card-h">${NS.searchBox('lq', 'Ürün ara...', q)}<div class="seg"><button data-only="" class="${!only ? 'active' : ''}">Tümü</button><button data-only="eksik" class="${only === 'eksik' ? 'active' : ''}">Eksik kanalı olan</button><button data-only="hata" class="${only === 'hata' ? 'active' : ''}">Hatalı</button></div><span class="grow"></span><span class="small muted">${sel.size} seçili</span>${ks.map((k) => `<button class="btn sm" data-push="${k}" ${sel.size ? '' : 'disabled'}>${icon('upload')} ${esc(CH[k].name)}</button>`).join('')}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:32px"><input type="checkbox" id="la" aria-label="Tümünü seç"></th><th>Ürün</th><th class="right">Mağaza fiyatı</th>${ks.map((k) => `<th>${chBadge(k)}</th>`).join('')}</tr></thead><tbody>${prods.map((x) => `<tr><td><input type="checkbox" data-sel="${x.id}" ${sel.has(x.id) ? 'checked' : ''} aria-label="Seç"></td><td><b>${esc(x.name)}</b><div class="small faint">${esc(x.cat)} · ${x.variants.length} varyant · ${sum(x.variants, (v) => v.stock)} stok</div></td><td class="right">${money(x.sale || x.price)}</td>${ks.map((k) => { const l = listing(x.id, k); const s = l ? l.status : 'yok'; return `<td><div>${badge(LST[s][0], LST[s][1])}</div><div class="small">${money(chPrice(x, k))} · ${chStock(x, k)} adet</div>${l && l.error ? `<div class="small" style="color:var(--err)">${esc(l.error)}</div>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><div class="card-b small faint">${prods.length} ürün · Kanal fiyatı = mağaza fiyatı + kanal fiyat farkı · Kanal stoğu = varyant stoğu − tampon</div>`;
    };
    el.innerHTML = pageHead('Ürün Listeleme', 'Hangi ürün hangi pazaryerinde yayında, hangi fiyatla, hangi hatayla — tek tabloda') + '<div class="card" id="lt"></div>';
    on(el, 'input', '#lq', (e, i) => { q = i.value; const pos = i.selectionStart; draw(); const n = $('#lq', el); n.focus(); n.setSelectionRange(pos, pos); });
    on(el, 'click', '[data-only]', (e, b) => { only = b.dataset.only; draw(); });
    on(el, 'change', '[data-sel]', (e, c) => { c.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel); draw(); });
    on(el, 'change', '#la', (e, c) => { $$('[data-sel]', el).forEach((x) => { c.checked ? sel.add(x.dataset.sel) : sel.delete(x.dataset.sel); }); draw(); });
    on(el, 'click', '[data-push]', async (e, b) => {
      const k = b.dataset.push; const map = db.data.mpCatMap[k] || {}; let ok = 0, bad = 0;
      const items = [...sel].map((id) => db.get('products', id));
      // Canlı: Trendyol'a ürün kartı + varyantlar, Hepsiburada'ya stok/fiyat (katalog eşleşmesi HB panelinde yapılır)
      let liveErr = '', batches = [];
      // Simülasyonda ürün gönderilmez; yalnızca eksikler (kategori, açıklama) kontrol edilir, durum "yayında/onay" yapılmaz
      if (!isLive(k)) {
        let okN = 0, badN = 0;
        items.forEach((x) => { const err = !map[x.cat] ? 'Kategori eşleştirmesi yok' : !x.desc || x.desc.length < 30 ? 'Açıklama çok kısa' : ''; if (err) { let l = listing(x.id, k); if (!l) { l = { id: NS.uid(), pid: x.id, ch: k, status: 'yok' }; db.data.listings.push(l); } Object.assign(l, { status: 'hata', error: err }); badN++; } else okN++; });
        log(k, 'TEST: ürün gönderilmedi (simülasyon)', `${okN} ürün kontrolden geçti${badN ? `, ${badN} eksik` : ''}`, false); db.save(); sel.clear();
        toast(`TEST: ${CH[k].name} simülasyonda — ${okN} ürün kontrolden geçti ama pazaryerine gönderilmedi${badN ? `, ${badN} üründe eksik var` : ''}`, 'warn'); return draw();
      }
      if (isLive(k)) {
        const ok2 = items.filter((x) => map[x.cat] && x.desc && x.desc.length >= 30);
        let r;
        if (k === 'trendyol') r = await live(k, 'urun-gonder', { items: ok2.flatMap((x) => x.variants.map((v) => ({ barcode: v.barcode || v.sku, stockCode: v.sku, title: `${x.name} ${v.color} ${v.size}`, productMainId: x.id, brandId: ch(k).brandId, categoryId: ((db.data.mpCatId || {})[k] || {})[x.cat], stock: Math.max(0, v.stock - (Number(ch(k).buffer) || 0)), price: chPrice(x, k), listPrice: Math.max(chPrice(x, k), Math.ceil(x.price * (1 + (Number(ch(k).markup) || 0) / 100)) - 0.1), vat: vatOfP(x), desc: x.desc, images: (window.SHOP && SHOP.PHOTOS && SHOP.PHOTOS[x.id] ? SHOP.PHOTOS[x.id].map((id) => `https://images.unsplash.com/photo-${id}?w=1200&h=1800&fit=crop`) : []), attributes: [] }))) });
        else r = await live(k, 'stok-fiyat', { items: variantItems(k, ok2.flatMap((p) => p.variants.map((v) => ({ p, v })))) });
        if (r && !r.ok) liveErr = r.error; else batches = (r.data && r.data.batches) || [];
      }
      items.forEach((x) => {
        let l = listing(x.id, k); if (!l) { l = { id: NS.uid(), pid: x.id, ch: k }; db.data.listings.push(l); }
        const err = !map[x.cat] ? 'Kategori eşleştirmesi yok' : !x.desc || x.desc.length < 30 ? 'Açıklama çok kısa' : liveErr;
        Object.assign(l, { status: err ? 'hata' : 'onay', error: err, syncedAt: new Date().toISOString(), batch: batches[0] || null }); err ? bad++ : ok++;
      });
      log(k, 'Ürün gönderimi', `${ok} ürün onaya gönderildi${bad ? `, ${bad} hatalı` : ''}`, !bad);
      if (batches.length) db.data.mpBatches = (db.data.mpBatches || []).concat(batches.filter(Boolean).map((id) => ({ ch: k, id, kind: 'urun', at: new Date().toISOString() })));
      db.save(); sel.clear();
      toast(`${CH[k].name}: ${ok} ürün onaya gönderildi${bad ? `, ${bad} hatalı (Kategori Eşleştirme'ye bakın)` : ''}`, bad ? 'err' : 'ok'); draw();
    });
    draw();
  }

  // ---------- Kategori eşleştirme ----------
  function catMapPage(el, p, app) {
    const ks = connected(); const cats = db.all('cats');
    el.innerHTML = pageHead('Kategori Eşleştirme', 'Kendi kategorilerinizi her pazaryerinin kategori ağacıyla bir kez eşleştirin', `<button class="btn" id="auto">${icon('sparkles')} Boşları otomatik öner</button>`) + `
      <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mağaza kategorisi</th>${ks.map((k) => `<th>${chBadge(k)}</th>`).join('')}</tr></thead><tbody>${cats.map((c) => `<tr><td><b>${esc(c.name)}</b><div class="small faint">${db.all('products', (x) => x.cat === c.id).length} ürün</div></td>${ks.map((k) => { const v = (db.data.mpCatMap[k] || {})[c.id] || ''; const idv = ((db.data.mpCatId || {})[k] || {})[c.id] || ''; return `<td><select class="input" data-map="${k}|${c.id}" style="min-width:220px;${v ? '' : 'border-color:var(--warn)'}"><option value="">— Eşleştirilmedi —</option>${TREE.map((t) => `<option ${t === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${isLive(k) && k === 'trendyol' ? `<input class="input mt" data-catid="${k}|${c.id}" type="number" placeholder="Trendyol kategori ID" value="${esc(idv)}" style="max-width:220px">` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="card-b small faint">Eşleşmeyen kategorideki ürünler o pazaryerine gönderilemez. Zorunlu özellikler (kumaş, kalıp, yaka tipi…) ürün açıklamasından ve varyantlardan doldurulur.</div></div>`;
    on(el, 'change', '[data-catid]', (e, i) => { const [k, c] = i.dataset.catid.split('|'); db.data.mpCatId = db.data.mpCatId || {}; db.data.mpCatId[k] = db.data.mpCatId[k] || {}; db.data.mpCatId[k][c] = Number(i.value) || ''; db.save(); toast('Kategori ID kaydedildi', 'ok'); });
    on(el, 'change', '[data-map]', (e, s) => { const [k, c] = s.dataset.map.split('|'); db.data.mpCatMap[k] = db.data.mpCatMap[k] || {}; db.data.mpCatMap[k][c] = s.value; s.style.borderColor = s.value ? '' : 'var(--warn)'; db.save(); toast('Eşleştirme kaydedildi', 'ok'); });
    $('#auto', el).onclick = () => { let n = 0; ks.forEach((k) => { db.data.mpCatMap[k] = db.data.mpCatMap[k] || {}; cats.forEach((c) => { if (!db.data.mpCatMap[k][c.id] && GUESS[c.id]) { db.data.mpCatMap[k][c.id] = GUESS[c.id]; n++; } }); }); db.save(); toast(`${n} eşleştirme önerildi — kontrol edin`, n ? 'ok' : ''); app.refresh(); };
  }

  // ---------- Hakediş mutabakatı ----------
  function payoutPage(el, p, app) {
    let k = '', ym = today().slice(0, 7);
    const draw = () => {
      const os = db.all('orders', (o) => CH[o.channel] && (!k || o.channel === k) && o.at.slice(0, 7) === ym).sort((a, b) => b.at.localeCompare(a.at)).map((o) => ({ id: o.id, o, s: settle(o) }));
      const live = os.filter((x) => x.s.st !== 'iptal');
      const T = (f) => sum(live, (x) => x.s[f]);
      const S2 = { odendi: ['Ödendi', 'ok'], vadede: ['Vadede (tahmini)', 'info'], 'vade-gecti': ['Vade geçti — ödemeyi kontrol edin', 'warn'], 'teslim-bekliyor': ['Teslim bekleniyor', 'warn'], iptal: ['İptal / iade', 'err'] };
      $('#po', el).innerHTML = `<div class="grid g4 mb">${kpi('Satış (KDV dahil)', money(T('gross')), 'wallet')}${kpi('Komisyon + hizmet', money(T('com') + T('fee')), 'percent', 'warn')}${kpi('Kargo kesintisi', money(T('ship')), 'truck', 'warn')}${kpi('Net hakediş (tahmini)', money(T('net')), 'check', 'ok', `<div class="small faint">${money(sum(live.filter((x) => x.s.st === 'odendi'), (x) => x.s.net))} ödendi · ${money(sum(live.filter((x) => x.s.st !== 'odendi'), (x) => x.s.net))} bekliyor</div>`)}</div><p class="small faint mb">Komisyon ve vade kanal ayarındaki oranlardan tahmin edilir. Kesin tutar için Trendyol canlıysa "Hakedişleri çek" ile pazaryerinin kaydını alın; diğerlerinde hesabınızı kontrol edip "Ödendi" işaretleyin.</p>
        <div class="card">${table({ rows: os, empty: 'Bu dönemde pazaryeri siparişi yok', columns: [{ label: 'Sipariş', render: (x) => `<b>${esc(x.o.no)}</b><div class="small faint">${chBadge(x.o.channel)} ${esc(x.o.channelNo || '')}</div>` }, { label: 'Tarih', render: (x) => NS.date(x.o.at) }, { label: 'Satış', cls: 'right', render: (x) => money(x.s.gross) }, { label: 'Komisyon', cls: 'right', render: (x) => `−${money(x.s.com)}` }, { label: 'Hizmet', cls: 'right', render: (x) => (x.s.fee ? `−${money(x.s.fee)}` : '-') }, { label: 'Kargo', cls: 'right', render: (x) => (x.s.ship ? `−${money(x.s.ship)}` : '-') }, { label: 'Net', cls: 'right', render: (x) => `<b>${money(x.s.net)}</b>` }, { label: 'Vade', render: (x) => (x.s.due ? NS.date(x.s.due) : '-') }, { label: 'Durum', render: (x) => `${badge(S2[x.s.st][0], S2[x.s.st][1])}${x.o.payout && x.o.payout.paid ? `<div class="small faint">${x.o.payout.source === 'elle' ? 'Elle işaretlendi' : esc(CH[x.o.channel].name) + ' kaydı'}</div>` : ''}` }], actions: [{ label: 'Ödendi', act: 'paid', show: (x) => ['vade-gecti', 'vadede'].includes(x.s.st) }] })}</div>`;
      on($('#po', el), 'click', '[data-act=paid]', async (e, b) => { const o = db.get('orders', b.dataset.id); if (!(await confirm(`${o.no} hakedişinin hesabınıza geçtiğini kontrol ettiniz mi?`))) return; o.payout = { paid: true, at: new Date().toISOString(), source: 'elle', by: (NS.currentUser || {}).name || '' }; db.save(); draw(); });
      $('#ex', el).onclick = () => NS.csv(`hakedis-${ym}`, os, [{ label: 'Sipariş', value: (x) => x.o.no }, { label: 'Kanal', value: (x) => CH[x.o.channel].name }, { label: 'Kanal sipariş no', value: (x) => x.o.channelNo }, { label: 'Tarih', value: (x) => x.o.at.slice(0, 10) }, { label: 'Satış', value: (x) => x.s.gross }, { label: 'Komisyon', value: (x) => x.s.com }, { label: 'Hizmet bedeli', value: (x) => x.s.fee }, { label: 'Kargo', value: (x) => x.s.ship }, { label: 'Net', value: (x) => x.s.net }, { label: 'Vade', value: (x) => x.s.due || '' }]);
    };
    el.innerHTML = pageHead('Hakediş Mutabakatı', 'Sipariş bazında komisyon, hizmet bedeli, kargo kesintisi ve ödeme vadesi', `<select class="input" id="pk" style="width:auto"><option value="">Tüm kanallar</option>${Object.keys(CH).filter((x) => db.all('orders', (o) => o.channel === x).length).map((x) => `<option value="${x}">${esc(CH[x].name)}</option>`).join('')}</select><input class="input" type="month" id="pm" value="${ym}" style="width:auto">${isLive('trendyol') ? `<button class="btn" id="hpull">${icon('download')} Hakedişleri çek</button>` : ''}<button class="btn" id="ex">${icon('download')} Excel</button>`) + '<div id="po"></div>';
    // Trendyol hakediş kaydı (reference/getsettlements, 15 günlük aralık): sipariş no ile eşlenir, satıcı geliri ve ödeme tarihi yazılır
    if ($('#hpull', el)) $('#hpull', el).onclick = async () => { const r = await live('trendyol', 'hakedis-cek', { since: addDays(new Date(), -14).toISOString() }); if (!r.ok) return toast(`Trendyol: ${r.error}`, 'err'); let n = 0; (r.data.rows || []).forEach((x) => { const o = db.find('orders', (y) => y.channel === 'trendyol' && y.channelNo === x.orderNo); if (!o) return; o.payout = { paid: !!x.paymentDate && x.paymentDate.slice(0, 10) <= today(), at: x.paymentDate, net: x.sellerRevenue, commission: x.commission, source: 'trendyol' }; n++; }); db.save(); toast(`${n} siparişin hakediş kaydı alındı`, n ? 'ok' : ''); draw(); };
    $('#pk', el).onchange = (e) => { k = e.target.value; draw(); }; $('#pm', el).onchange = (e) => { ym = e.target.value || today().slice(0, 7); draw(); };
    draw();
  }

  // ---------- Müşteri soruları ----------
  function questionsPage(el, p, app) {
    const TPL = ['Merhaba, ürünümüz normal kalıptır; kendi bedeninizi tercih edebilirsiniz. İyi alışverişler dileriz.', 'Merhaba, siparişiniz aynı gün kargoya verilir. İyi günler dileriz.', 'Merhaba, ürünümüz 30 derecede makinede yıkanabilir. İyi alışverişler.', 'Merhaba, ilgili renk önümüzdeki hafta stoklarımıza girecektir; ürünü favorilerinize ekleyebilirsiniz.'];
    const draw = () => {
      db.load(); const qs = db.all('mpQuestions').sort((a, b) => (!!a.answer - !!b.answer) || b.at.localeCompare(a.at));
      el.innerHTML = pageHead('Müşteri Soruları', 'Pazaryerlerinden gelen ürün soruları — hızlı yanıt mağaza puanınızı yükseltir', anyLive() ? `<button class="btn" id="qpull">${icon('download')} Soruları çek</button>` : '') + `<div class="card"><div class="card-b">${qs.map((q) => { const pr = db.get('products', q.pid) || { name: q.product || '' }; const age = (Date.now() - new Date(q.at)) / 3600e3; return `<div class="list-item" style="align-items:flex-start"><div class="grow"><div class="row nw" style="gap:8px">${chBadge(q.ch)}<b>${esc(pr.name || '')}</b><span class="small faint">${esc(q.customer)} · ${NS.ago(q.at)}</span>${!q.answer && age > 24 ? badge('24 saati geçti', 'err') : !q.answer ? badge(`${Math.max(0, Math.round(24 - age))} sa kaldı`, 'warn') : badge('Yanıtlandı', 'ok')}</div><div class="mt">${esc(q.text)}</div>${q.answer ? `<div class="small mt" style="color:var(--accent)">↳ ${esc(q.answer)}</div>` : `<div class="row nw mt" style="gap:6px"><select class="input" data-tpl="${q.id}" style="max-width:200px"><option value="">Hazır yanıt…</option>${TPL.map((t, i) => `<option value="${i}">${esc(t.slice(9, 50))}…</option>`).join('')}</select><input class="input grow" id="a-${q.id}" placeholder="Yanıtınız" value="${esc(q.draft || '')}"><button class="btn primary" data-ans="${q.id}">Gönder</button></div>`}</div></div>`; }).join('') || '<div class="empty">Soru yok</div>'}</div></div>`;
    };
    on(el, 'click', '#qpull', async () => {
      let n = 0;
      for (const k of connected().filter(isLive)) {
        const r = await live(k, 'soru-cek'); if (!r.ok) { if (!r.unsupported) toast(`${CH[k].name}: ${r.error}`, 'err'); continue; }
        (r.data.questions || []).forEach((x) => { if (db.find('mpQuestions', (q) => q.ch === k && q.extId === x.id)) return; const fv = findVariant(x.barcode || ''); db.data.mpQuestions.push({ id: NS.uid(), extId: x.id, ch: k, pid: fv ? fv.p.id : '', text: x.text, product: x.product, customer: x.customer || 'Müşteri', at: x.at || new Date().toISOString(), answer: '' }); n++; });
      }
      db.save(); toast(`${n} yeni soru alındı`, n ? 'ok' : ''); draw();
    });
    on(el, 'change', '[data-tpl]', (e, s) => { if (s.value !== '') $('#a-' + s.dataset.tpl, el).value = TPL[Number(s.value)]; });
    on(el, 'click', '[data-ans]', async (e, b) => {
      const q = db.get('mpQuestions', b.dataset.ans); const a = $('#a-' + q.id, el).value.trim(); if (a.length < 10 || a.length > 2000) return toast('Yanıt 10–2000 karakter olmalı', 'err');
      // Simülasyonda yanıt pazaryerine gitmez: taslak olarak saklanır, soru "yanıtlandı" sayılmaz
      if (!(isLive(q.ch) && q.extId)) { q.draft = a; db.save(); toast(`TEST: ${CH[q.ch].name} canlı bağlı değil, yanıt gönderilmedi (taslak saklandı)`, 'warn'); return draw(); }
      const r = await live(q.ch, 'soru-yanitla', { question: q.extId, answer: a }); if (!r.ok) return toast(`Yanıt gönderilemedi: ${r.error}`, 'err');
      q.answer = a; q.draft = ''; q.answeredAt = new Date().toISOString(); log(q.ch, 'Soru yanıtı', (db.get('products', q.pid) || {}).name || ''); db.save(); toast('Yanıt pazaryerine gönderildi', 'ok'); draw();
    });
    draw();
  }

  // Mağazada stok değişince bağlı kanallara otomatik stok gönderimi (app.js çağırır)
  // items: [{ vid }] — değişen varyantların güncel stoğu otomatik stok açık kanallara gider
  function stockChanged(items) {
    const vids = new Set(items.map((i) => i.vid));
    const pairs = db.all('products').flatMap((p) => p.variants.filter((v) => vids.has(v.id)).map((v) => ({ p, v })));
    connected().filter((k) => ch(k).autoStock).forEach((k) => { if (isLive(k)) live(k, 'stok-fiyat', { items: variantItems(k, pairs) }); else log(k, 'TEST: otomatik stok gönderilmedi (simülasyon)', `${pairs.length} varyant`, false); });
  }
  // Toplu işlemlerin (batch) sonucunu sorgular, listeleme durumlarını günceller
  async function checkBatches(k) {
    const open = (db.data.mpBatches || []).filter((b) => b.ch === k && !b.done);
    for (const b of open) {
      const r = await live(k, 'batch-durum', { batchId: b.id }); if (!r.ok) continue;
      const st = String(r.data.status || '').toUpperCase(); if (!/COMPLETED|DONE|SUCCESS/.test(st)) continue;
      b.done = true;
      (r.data.items || []).forEach((it) => { const fv = findVariant(it.barcode); if (!fv) return; const l = listing(fv.p.id, k); if (!l) return; if (/SUCCESS/i.test(it.status)) { l.status = 'yayinda'; l.error = ''; } else { l.status = 'hata'; l.error = (it.reasons || []).join(', ') || 'Pazaryeri reddetti'; } });
      if (!(r.data.items || []).length) db.all('listings', (x) => x.ch === k && x.batch === b.id && x.status === 'onay').forEach((x) => { x.status = 'yayinda'; });
    }
  }
  // Canlı kanallardan yeni siparişleri çeker, mağaza siparişi olarak kaydeder ve stoğu düşer
  async function pullOrders() {
    const ks = connected().filter(isLive); if (!ks.length) return { count: 0, err: 'Canlı modda kanal yok' };
    let count = 0; const touched = []; let err = '';
    for (const k of ks) {
      const r = await live(k, 'siparis-cek', { since: ch(k).lastPull }); if (!r.ok) { err = `${CH[k].name}: ${r.error}`; continue; }
      (r.data.orders || []).forEach((o) => { if (importOrder(k, o, touched)) count++; });
      db.data.mpChannels[k].lastPull = new Date().toISOString();
    }
    db.save();
    if (touched.length) stockChanged(touched);
    return { count, err };
  }
  // Pazaryeri siparişini kaydeder; kalemler stok kodu / barkod / eşleştirilmiş kodla varyanta bağlanır, bulunamayan kalem "eşleşmedi" kalır
  function importOrder(k, o, touched) {
    if (!o || !o.orderNo || db.find('orders', (x) => x.channel === k && x.channelNo === o.orderNo)) return false;
    const items = (o.items || []).map((i) => { const code = i.sku || i.barcode || ''; const fv = findVariant(i.sku) || findVariant(i.barcode); if (fv) { fv.v.stock = Math.max(0, fv.v.stock - i.qty); touched.push({ vid: fv.v.id }); } return { pid: fv ? fv.p.id : null, vid: fv ? fv.v.id : null, name: fv ? fv.p.name : i.name || code, variant: fv ? `${fv.v.color} / ${fv.v.size}` : code, code, qty: Number(i.qty) || 1, price: Number(i.price) || 0, lineId: i.lineId }; });
    const total = Math.round(items.reduce((t, i) => t + i.qty * i.price, 0) * 100) / 100; const c = o.customer || {};
    db.insert('orders', { no: 'PY' + db.nextNo('mp'), at: o.at || new Date().toISOString(), channel: k, channelNo: o.orderNo, packageId: o.packageId || null, channelShip: 0, ship: { name: c.name || '', phone: c.phone || '', city: c.city || '', district: c.district || '', address: [c.address, c.district].filter(Boolean).join(', ') }, items, subtotal: total, shipping: 0, discount: 0, total: o.total || total, pay: 'kart', payStatus: 'alindi', status: 'yeni', unmatched: items.some((i) => !i.pid), history: [{ at: new Date().toISOString(), st: 'yeni', note: `${CH[k] ? CH[k].name : k} siparişi alındı`, user: '' }], note: `${CH[k] ? CH[k].name : k} sipariş no ${o.orderNo}` }, true);
    return true;
  }
  // Genel pazaryeri servisinden (Entegrasyonlar) gelen gerçek sipariş listesi
  function importOrders(list) { const touched = []; let n = 0; (list || []).forEach((o) => { if (importOrder(keyOf(o.channel), o, touched)) n++; }); db.save(); if (touched.length) stockChanged(touched); return n; }
  const unmatchedOrders = () => db.all('orders', (o) => o.unmatched && !['iptal', 'iade'].includes(o.status));
  // ---------- Eşleşmeyen ürünler (pazaryeri kodu → varyant) ----------
  function unmatchedPage(el, p, app) {
    const os = unmatchedOrders(); const opts = db.all('products').flatMap((x) => x.variants.map((v) => `<option value="${v.id}">${esc(`${x.name} · ${v.color} / ${v.size} · ${v.sku || ''}`)}</option>`)).join('');
    const rows = os.flatMap((o) => o.items.map((i, n) => ({ o, i, n })).filter((r) => !r.i.pid));
    el.innerHTML = pageHead('Eşleşmeyen Ürünler', 'Pazaryeri siparişinde stok kodu veya barkodu tanınmayan kalemler. Bir kez eşleştirin; aynı kod sonraki siparişlerde otomatik tanınır.') + `<div class="card">${rows.length ? `<div class="card-b">${rows.map((r) => `<div class="list-item" style="flex-wrap:wrap"><div class="grow"><b>${esc(r.i.name)}</b> ${chBadge(r.o.channel)}<div class="small faint">Sipariş ${esc(r.o.no)} · kod <span class="mono">${esc(r.i.code || r.i.variant || '-')}</span> · ${r.i.qty} adet</div></div><select class="input" data-pick="${r.o.id}|${r.n}" style="max-width:340px"><option value="">Varyant seçin…</option>${opts}</select><button class="btn primary sm" data-match="${r.o.id}|${r.n}">Eşleştir</button></div>`).join('')}</div>` : '<div class="empty">Eşleşmeyen ürün yok</div>'}</div>`;
    on(el, 'click', '[data-match]', (e, b) => {
      const [oid, n] = b.dataset.match.split('|'); const vid = $(`[data-pick="${b.dataset.match}"]`, el).value; if (!vid) return toast('Varyant seçin', 'err');
      const o = db.get('orders', oid); const i = o.items[Number(n)]; const pr = db.all('products').find((x) => x.variants.some((v) => v.id === vid)); const v = pr.variants.find((x) => x.id === vid);
      if (i.code && ![v.sku, v.barcode, ...(v.aliases || [])].includes(i.code)) { if (findVariant(i.code)) return toast(`${i.code} kodu başka bir varyanta bağlı`, 'err'); v.aliases = [...(v.aliases || []), i.code]; }
      Object.assign(i, { pid: pr.id, vid, name: pr.name, variant: `${v.color} / ${v.size}` }); v.stock = Math.max(0, v.stock - i.qty);
      o.unmatched = o.items.some((x) => !x.pid); (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note: `Eşleştirildi: ${i.code || ''} → ${pr.name} ${v.color}/${v.size}`, user: (NS.currentUser || {}).name || '' });
      db.save(); stockChanged([{ vid }]); toast('Eşleştirildi, stok düşüldü', 'ok'); app.refresh();
    });
  }
  // Kargo/fatura bilgisini pazaryerine bildirir (sipariş kargoya verilince app.js çağırır)
  async function shipNotify(o) {
    if (!o.channel || !CH[o.channel]) return;
    if (isLive(o.channel)) { const r = await live(o.channel, 'kargo-bildir', { packageId: o.packageId, lines: o.items.filter((i) => i.lineId).map((i) => ({ lineId: i.lineId, qty: i.qty })), status: 'Invoiced', invoiceNo: (o.ebelge && !o.ebelge.test && o.ebelge.no) || o.invoiceNo || '', tracking: o.tracking, ownCargo: !!o.tracking }); if (!r.ok && !r.unsupported) toast(`${CH[o.channel].name} kargo bildirimi: ${r.error}`, 'err'); else if (r.unsupported) toast(`${CH[o.channel].name}: kargo bilgisi otomatik bildirilemiyor, pazaryeri panelinden girin`, 'warn'); else if (r.data && r.data.trackingNotSent) toast(`${CH[o.channel].name}: paket "faturalandı" bildirildi; takip numarasını pazaryeri panelinden girin`, 'warn'); db.save(); }
    else log(o.channel, 'TEST: kargo bildirimi gönderilmedi (simülasyon)', o.channelNo || '', false);
  }

  return { CH, ensure, settle, chBadge, stockChanged, pullOrders, importOrders, unmatchedOrders, shipNotify, isLive, nav: [{ sec: 'Pazaryeri' }, { id: 'pazaryeri', label: 'Pazaryeri Merkezi', icon: 'store', roles: ['admin'] }, { id: 'listeleme', label: 'Ürün Listeleme', icon: 'upload', roles: ['admin'] }, { id: 'eslesmeyen', label: 'Eşleşmeyen Ürünler', icon: 'alert', badge: true }, { id: 'eslestirme', label: 'Kategori Eşleştirme', icon: 'link', roles: ['admin'] }, { id: 'hakedis', label: 'Hakediş', icon: 'wallet', roles: ['admin'] }, { id: 'sorular', label: 'Müşteri Soruları', icon: 'message' }],
    routes: { eslesmeyen: unmatchedPage, pazaryeri: hubPage, listeleme: listingsPage, eslestirme: catMapPage, hakedis: payoutPage, sorular: questionsPage } };
})();
