/* NEBSOFT Entegrasyon Merkezi ve kurulum sihirbazı.
   • Kartlar kategoriye ayrılır, her kartta bağlantı durumu görünür: Bağlı / Bağlantı hatası / Entegre edilmedi / Sözleşme gerekir; TEST modu ayrıca yazılır.
   • Tek akış: Entegre et → sağlayıcı → alanlar ve nereden alınacağı → Bağlantıyı dene → sonuç.
   • Bağlı yalnız gerçek denemeden yazılır. Sunucu istemcisi olan sağlayıcıda (test.type 'sunucu') durum sunucudadır, iş akışı da denemesiz çalışmaz.
   • Firma rehberleri core/integ-guides*.js'ten gelir; sahte test sonucu üretilmez.
   • Yarım kalan kurulum bu cihazda saklanır, gizli alanlar taslağa yazılmaz. Ayarların kendisi integrations.js deposunda tutulur. */
(function () {
  'use strict';
  const NS = window.NS; if (!NS) return;
  const { esc, $, $$, icon, toast, modal, badge } = NS;
  const GU = () => window.NB_GUIDES || { get: () => null, STATUS: {} };
  const st = new NS.DB('entegrasyon-kurulum', (db) => { db.data.state = {}; db.data.drafts = {}; });
  const S = () => (st.load(), st.data.state || (st.data.state = {}));
  const D = () => (st.load(), st.data.drafts || (st.data.drafts = {}));
  const CATS = [
    ['ebelge', 'E-Belge ve Muhasebe', 'file', ['efatura', 'eirsaliye', 'esmm', 'emustahsil', 'edefter', 'muhasebeaktar', 'banka', 'ebordro']],
    ['odeme', 'Ödeme Sistemleri ve POS Cihazları', 'card', ['pos', 'okc', 'payment', 'yemekkarti', 'bankamaas', 'hgs']],
    ['barkod', 'Barkod Okuyucular ve Yazıcılar', 'barcode', ['barcode', 'printer', 'label']],
    ['terazi', 'Elektronik Teraziler', 'layers', ['scale', 'kantar']],
    ['kargo', 'Kargo ve Lojistik', 'truck', ['kargofirma', 'gps', 'aracbildirim']],
    ['eticaret', 'E-Ticaret ve Pazaryerleri', 'store', ['pazaryeri', 'yemekplatform', 'kanal', 'ilan']],
  ];
  const catOf = (k) => (CATS.find((c) => c[3].includes(k)) || ['diger'])[0];
  const provField = (kind, c) => { const d = NS.integ.DEFS[kind]; const fs = d.fields(c); return fs.find((f) => f.name === 'provider') || fs.find((f) => f.name === 'mode' && f.type === 'select') || null; };
  const optionsOf = (f) => (f ? (typeof f.options === 'function' ? f.options() : f.options || []).map((o) => (typeof o === 'object' ? o : { value: o, label: o })) : []);
  // Sağlayıcı seçimi olmayan türlerde (ör. barkod okuyucu) o türün ilk rehberi varsayılan sağlayıcıdır
  const defProv = (kind) => { const g = (GU().forKind ? GU().forKind(kind) : [])[0]; return g ? g.key.split(':')[1] : ''; };
  // Marka bazlı türler (terazi, POS cihazı): sağlayıcı = marka (cfg.brand); ardından cihaz türü (model) ve bağlantı yöntemi seçilir
  const BK = (kind) => !!(GU().BRAND_KINDS || {})[kind];
  const curProv = (kind) => { const c = NS.integ.cfg(kind); if (BK(kind)) return c.brand || ''; const f = provField(kind, c); return f ? c[f.name] : defProv(kind); };
  // Sözleşme gerektiren sağlayıcı: API dokümanı herkese açık değil, Entegre et yerine iletişim talebi gösterilir
  const kapali = (g) => (GU().kapali ? GU().kapali(g) : false);
  const sunucu = (g) => !!(g && g.test && g.test.type === 'sunucu');
  // Sunucudaki son deneme sonucu (bulut). Yerelde durum bu cihazda tutulur, o da yalnız gerçek denemeden yazılır
  let SR = null;
  const srYukle = async () => { try { const L = await NS.integ.ent.durum(); SR = L ? Object.fromEntries(L.map((x) => [x.tur, x])) : null; } catch (e) { SR = null; } };
  const sonDeneme = (k) => { const p = curProv(k); if (SR && SR[k] && SR[k].saglayici === p) return SR[k].sonDeneme; const s = S()[k]; return s && s.prov === p ? s.at : ''; };
  // ---------- Durum: Bağlı yalnız gerçek denemeden yazılır ----------
  function statusOf(kind) {
    const s = S()[kind]; const c = NS.integ.cfg(kind); const d = NS.integ.DEFS[kind]; const p = curProv(kind); const g = GU().get(kind, p);
    const pf0 = provField(kind, c); const mode = BK(kind) ? (pf0 ? c[pf0.name] : '') : p;
    if (kapali(g)) return ['Sözleşme gerekir', 'acc', 'mail'];
    if (s && s.testing) return ['Deneniyor', 'info', 'refresh'];
    if (SR && sunucu(g)) { const r = SR[kind]; if (r && r.saglayici === p) { if (r.durum === 'bagli') return ['Bağlı', 'ok', 'check']; if (r.durum === 'ilk-islem') return ['İlk işlem bekleniyor', 'info', 'clock']; return ['Bağlantı hatası', 'err', 'alert']; } return ['Entegre edilmedi', 'acc', 'plus']; }
    if (s && s.prov === p) { if (s.status === 'ok') return ['Bağlı', 'ok', 'check']; if (s.status === 'ilk-islem') return ['İlk işlem bekleniyor', 'info', 'clock']; if (s.status === 'manual') return ['Hazır (manuel onay)', 'info', 'check']; if (s.status === 'fail') return ['Bağlantı hatası', 'err', 'alert']; if (s.status === 'untested') return ['Denenmedi', 'warn', 'clock']; }
    if (d.conn) return !c.enabled ? ['Entegre edilmedi', 'acc', 'plus'] : p === 'sim' ? ['TEST', 'warn', 'info'] : ['Denenmedi', 'warn', 'clock'];
    if (mode === 'sim' || mode === 'none' || mode === 'demo') return ['TEST', 'warn', 'info'];
    if (kind === 'webhook') return c.url ? ['Denenmedi', 'warn', 'clock'] : ['Entegre edilmedi', 'acc', 'plus'];
    if (['browser', 'link', 'mailto', 'manual'].includes(mode) || (kind === 'scale' && mode === 'barcode') || ['barcode', 'backup'].includes(kind)) return ['Hazır (temel mod)', 'info', 'check'];
    return ['Entegre edilmedi', 'acc', 'plus'];
  }
  // ---------- Merkez ----------
  function center(el, app, kinds, legacy) {
    const DEFS = NS.integ.DEFS; const used = (NS.integ.USED || {})[NS.app && NS.app.opts ? NS.app.opts.id : ''];
    let list = used || Object.keys(DEFS); list = list.filter((k) => DEFS[k]);
    let cat = '', q = '';
    const draw = () => {
      const cats = CATS.filter((c) => list.some((k) => catOf(k) === c[0])).concat(list.some((k) => catOf(k) === 'diger') ? [['diger', 'Diğer Entegrasyonlar', 'zap']] : []);
      const rows = list.filter((k) => (!cat || catOf(k) === cat) && (!q || NS.match(q, DEFS[k].title, DEFS[k].desc)));
      const cnt = (lab) => list.filter((k) => statusOf(k)[0] === lab).length;
      el.innerHTML = `<div class="ic-head"><div><h1>Entegrasyon Merkezi</h1><p>Servislerinizi kendi hesabınızla bağlayın: Entegre et, bilgileri girin, Bağlantıyı dene.</p></div><button class="btn" id="icl">${icon('list')} Kayıtlar ve gelişmiş ayarlar</button></div>
        <div class="ic-kpi">${[['Bağlı', 'ok'], ['Bağlantı hatası', 'err'], ['Entegre edilmedi', 'acc']].map(([l, t]) => `<div class="ic-k ${t}"><b>${cnt(l)}</b><span>${l}</span></div>`).join('')}</div>
        <div class="ic-bar"><div class="search grow">${icon('search')}<input class="input" id="icq" placeholder="Entegrasyon ara: yazıcı, Trendyol, e-Fatura…" value="${esc(q)}"></div></div>
        <div class="chips mb"><button class="chip ${cat ? '' : 'active'}" data-ic="">Tümü <span class="faint">${list.length}</span></button>${cats.map((c) => `<button class="chip ${cat === c[0] ? 'active' : ''}" data-ic="${c[0]}">${icon(c[2])} ${esc(c[1])}</button>`).join('')}</div>
        ${(cat ? cats.filter((c) => c[0] === cat) : cats).map((c) => { const ks = rows.filter((k) => catOf(k) === c[0]); return ks.length ? `<h3 class="ic-h3">${icon(c[2])} ${esc(c[1])}</h3><div class="ic-grid">${ks.map(card).join('')}</div>` : ''; }).join('') || `<div class="card pad empty">${icon('search')}<div>Sonuç yok</div></div>`}`;
      $('#icq', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#icq', el); i.focus(); i.setSelectionRange(pos, pos); };
      $('#icl', el).onclick = () => legacy(el, app, kinds);
    };
    const card = (k) => { const d = NS.integ.DEFS[k]; const [lab, tone, ic] = statusOf(k); const p = curProv(k); const g = GU().get(k, p); const dr = D()[k]; const son = sonDeneme(k); const hazir = lab === 'Bağlı' || lab.startsWith('Hazır');
      return `<article class="ic-card"><div class="ic-top"><span class="ic-logo" ${g ? `style="--lc:${g.color}"` : ''}>${g ? esc(g.mark) : icon(d.icon)}</span><span class="ic-st ${tone}">${icon(ic)} ${lab}</span></div>
        <b>${esc(d.title)}</b><p>${esc(d.desc)}</p>${p && p !== 'sim' ? `<small class="faint">Sağlayıcı: ${esc((optionsOf(provField(k, NS.integ.cfg(k))).find((o) => String(o.value) === String(p)) || {}).label || (g && g.name) || p)}</small>` : ''}${son ? `<small class="faint">Son deneme: ${esc(NS.dt(son))}</small>` : ''}
        <div class="ic-act">${dr ? `<button class="btn primary sm" data-wz="${k}">${icon('play')} Devam et</button>` : `<button class="btn ${hazir ? '' : 'primary'} sm" data-wz="${k}">${icon(hazir ? 'edit' : kapali(g) ? 'mail' : 'zap')} ${hazir ? 'Yönet' : kapali(g) ? 'İletişim talebi' : 'Entegre et'}</button>`}${S()[k] && S()[k].prov === p ? `<button class="btn ghost sm" data-rt="${k}" title="Bağlantıyı yeniden dene" aria-label="Bağlantıyı yeniden dene">${icon('refresh')}</button>` : ''}</div></article>`; };
    el.onclick = (e) => { const b = e.target.closest('[data-ic],[data-wz],[data-rt]'); if (!b) return; if (b.dataset.ic !== undefined) { cat = b.dataset.ic; draw(); } else if (b.dataset.wz) wizard(b.dataset.wz, draw); else if (b.dataset.rt) retest(b.dataset.rt, draw); };
    draw(); srYukle().then(draw);
  }
  // ---------- Bağlantı testleri (yalnızca gerçek kontroller) ----------
  const br = async (p, body) => { if (window.nebsoftDesktop && window.nebsoftDesktop.bridge && !/__nsg_/.test(JSON.stringify(body))) return window.nebsoftDesktop.bridge(p, body); const r = await fetch('/api' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({ ok: false, error: 'Yanıt okunamadı' })); return { ...j, httpStatus: r.status }; };
  async function runTest(g, v, kind, prov) {
    const t = g && g.test ? g.test.type : 'none';
    try {
      if (t === 'sunucu') { const r = await NS.integ.ent.dene(kind, prov, v); return r.ok ? { ok: true, msg: r.mesaj, test: r.test, at: r.sonDeneme, parmak: r.parmak } : { ok: false, raw: r.hata, ilkIslem: !!r.ilkIslem, parmak: r.parmak }; }
      if (t === 'trendyol') { const r = await br('/kanal', { channel: 'trendyol', action: 'baglanti-test', creds: { sellerId: v.sellerId, apiKey: v.apiKey, apiSecret: v.apiSecret, stage: !!v.stage, integrator: v.integrator || undefined } }); return r.ok ? { ok: true, msg: 'Trendyol kimlik bilgileri doğrulandı; sipariş listesine erişilebiliyor.' } : { ok: false, raw: `${r.status || r.httpStatus || ''} ${r.error || ''}` }; }
      if (t === 'hepsiburada') { const r = await br('/kanal', { channel: 'hepsiburada', action: 'baglanti-test', creds: { sellerId: String(v.sellerId).trim(), apiKey: String(v.apiKey).trim(), apiSecret: String(v.apiSecret).trim(), stage: !!v.stage, integrator: v.integrator || undefined } }); return r.ok ? { ok: true, msg: 'Hepsiburada kimlik bilgileri doğrulandı; listeleme servisine erişilebiliyor.' } : { ok: false, raw: `${r.status || r.httpStatus || ''} ${r.error || ''}` }; }
      if (t === 'n11') { const r = await NS.integ.http({ url: 'https://api.n11.com/ms/product-query?page=0&size=1', method: 'GET', headers: { appKey: String(v.apiKey).trim(), appSecret: String(v.apiSecret).trim() } }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } if (r.ok && j && ('totalElements' in j || Array.isArray(j.content))) return { ok: true, msg: `n11 anahtarları doğrulandı. Mağazanızda ${j.totalElements ?? '?'} ürün görünüyor.` }; return { ok: false, raw: `${r.status || ''} ${r.error || String(r.body || '').slice(0, 200)}` }; }
      if (t === 'parasut') {
        const tk = await NS.integ.http({ url: 'https://api.parasut.com/oauth/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'password', client_id: String(v.clientId).trim(), client_secret: String(v.clientSecret).trim(), username: String(v.user).trim(), password: v.pass, redirect_uri: 'urn:ietf:wg:oauth:2.0:oob' }).toString() });
        let j = {}; try { j = JSON.parse(tk.body); } catch (e) { /* yok */ } if (!tk.ok || !j.access_token) return { ok: false, raw: `${tk.status || ''} ${j.error || ''} ${j.error_description || tk.error || ''}` };
        const me = await NS.integ.http({ url: 'https://api.parasut.com/v4/me?include=companies', method: 'GET', headers: { Authorization: 'Bearer ' + j.access_token, Accept: 'application/json' } });
        let m = {}; try { m = JSON.parse(me.body); } catch (e) { /* yok */ } if (!me.ok) return { ok: false, raw: `${me.status || ''} ${String(me.body || me.error || '').slice(0, 200)}` };
        const cos = (m.included || []).filter((x) => x.type === 'companies').map((x) => ({ id: String(x.id), name: (x.attributes && (x.attributes.name || x.attributes.legal_name)) || '' }));
        if (v.companyId && cos.length && !cos.some((x) => x.id === String(v.companyId))) return { ok: false, raw: `firma ${v.companyId} bu hesapta yok. Hesaptaki firmalar: ${cos.map((x) => `${x.id} (${x.name})`).join(', ')}` };
        return { ok: true, msg: `Paraşüt bağlantısı doğrulandı.${cos.length ? ` Firmalar: ${cos.map((x) => `${x.id} — ${x.name}`).join(', ')}.` : ''}` };
      }
      if (t === 'iyzico') {
        if (/__nsg_/.test(String(v.secret) + String(v.apiKey))) return { ok: false, raw: 'yer tutucu: iyzico imzası tarayıcıda hesaplandığı için kayıtlı anahtarla test edilemez' };
        if (!(window.crypto && crypto.subtle)) return { ok: false, raw: 'Tarayıcı güvenli bağlam dışında (https gerekli) — imza üretilemedi' };
        const host = v.sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'; const path = '/payment/bin/check'; const body = JSON.stringify({ locale: 'tr', binNumber: '535805', conversationId: 'nebsoft-test' }); const rnd = String(Date.now()) + Math.random().toString(36).slice(2, 8);
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(v.secret).trim()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rnd + path + body)))].map((b) => b.toString(16).padStart(2, '0')).join('');
        const auth = 'IYZWSv2 ' + btoa(`apiKey:${String(v.apiKey).trim()}&randomKey:${rnd}&signature:${sig}`);
        const r = await NS.integ.http({ url: host + path, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: auth, 'x-iyzi-rnd': rnd }, body }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ }
        return j.status === 'success' ? { ok: true, msg: `iyzico anahtarları doğrulandı (${v.sandbox ? 'sandbox' : 'canlı'}). Örnek BIN: ${j.bankName || ''} ${j.cardAssociation || ''}` } : { ok: false, raw: `${r.status || ''} ${j.errorCode || ''} ${j.errorMessage || r.error || String(r.body || '').slice(0, 200)}` };
      }
      if (t === 'stripe') { const r = await NS.integ.http({ url: 'https://api.stripe.com/v1/balance', method: 'GET', headers: { Authorization: 'Bearer ' + String(v.secret).trim() } }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } return r.ok && j.object === 'balance' ? { ok: true, msg: `Stripe anahtarı doğrulandı (${j.livemode ? 'canlı' : 'sandbox'}).` } : { ok: false, raw: `${r.status || ''} ${j.error ? j.error.message : r.error || ''}` }; }
      if (t === 'twilio') { const sid = String(v.sid).trim(); const r = await NS.integ.http({ url: `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, method: 'GET', headers: { Authorization: 'Basic ' + btoa(sid + ':' + String(v.token).trim()) } }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } if (r.ok && j.sid) return j.status === 'active' ? { ok: true, msg: `Twilio hesabı doğrulandı: ${j.friendly_name || ''} · ${j.type || ''}${j.type === 'Trial' ? ' (deneme hesabı: yalnızca doğrulanmış numaralara gönderir)' : ''}` } : { ok: false, raw: `hesap durumu: ${j.status}` }; return { ok: false, raw: `${r.status || ''} ${j.code || ''} ${j.message || r.error || ''}` }; }
      if (t === 'ical') { const ca = ['randevu', 'klinik', 'crm'].includes((NS.app && NS.app.opts && NS.app.opts.id) || '') ? NS.app.opts.id : 'randevu'; const r = await fetch('/api/takvim-adres?app=' + ca); const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) return { ok: false, raw: `${r.status} ${j.error || 'bulut hesabı gerekli'}` }; const ics = await fetch(j.all); const txt = await ics.text(); if (!ics.ok || !/BEGIN:VCALENDAR/.test(txt)) return { ok: false, raw: `${ics.status} takvim dosyası okunamadı` }; const abs = (u) => location.origin + u; const n = (txt.match(/BEGIN:VEVENT/g) || []).length; return { ok: true, msg: `Takvim hazır (${j.title || 'Randevular'}): önümüzdeki 6 ay ve son 30 günden ${n} kayıt yayınlanıyor.`, html: `<div class="wz-ical">${[[j.app === 'crm' ? 'Tüm görevler' : 'Tüm randevular', abs(j.all)], ...j.staff.map((s) => [s.name, abs(s.url)])].map(([l, u]) => `<div><b>${esc(l)}</b><code>${esc(u)}</code><button type="button" class="btn ghost sm" data-copy="${esc(u)}">${icon('copy')} Kopyala</button></div>`).join('')}</div>` }; }
      if (t === 'uyumsoft') {
        const U = await NS.integ.ubl(); const c = g.map(v);
        const d = await NS.integ.uyCall(c, 'GetSystemDate', U.UY.systemDate()); if (d.fault || !d.ok) return { ok: false, raw: d.error || 'Uyumsoft yanıt vermedi' };
        const q = await NS.integ.uyCall(c, 'IsEInvoiceUser', U.UY.isEInvoiceUser(c.vkn));
        return { ok: true, msg: `Uyumsoft ${c.test ? 'test' : 'canlı'} servisine bağlanıldı (sunucu saati: ${String(d.date || '').replace('T', ' ').slice(0, 16)}). Firmanız GİB e-Fatura listesinde ${q.flag === 'true' ? 'kayıtlı görünüyor' : q.flag === 'false' ? 'görünmüyor — yalnızca e-Arşiv kesebilirsiniz' : 'sorgulanamadı'}.` };
      }
      if (t === 'modbus' || t === 'mqtt') {
        const pts = await NS.integ.readPlc(g.map(v));
        const rows = pts.map((p) => `<div><b>${esc(p.code)}</b><code>${p.value === null || p.value === undefined ? (p.missing ? 'mesaj gelmedi' : 'sayı değil: ' + esc(p.raw || '')) : esc(p.value.toLocaleString('tr-TR'))}</code></div>`).join('');
        const got = pts.filter((p) => p.value !== null && p.value !== undefined).length;
        if (!got) return { ok: false, raw: t === 'mqtt' ? 'Konulardan mesaj gelmedi' : 'Değer okunamadı' };
        return { ok: true, msg: `${got} / ${pts.length} okuma noktasından gerçek değer alındı.`, html: `<div class="wz-ical">${rows}</div>` };
      }
      if (t === 'track') {
        const no = await NS.prompt('Elinizdeki bir takip numarası (takip sayfası bu numarayla açılır)', '', { title: g.name + ' takip sayfası' }); if (!no) return { skipped: true };
        const r = await NS.integ.trackShipment(g.key.split(':')[1], no); return r.ok ? { ok: true, msg: `${g.name} takip sayfası açıldı. Sonucu açılan sekmede görebilirsiniz.` } : { ok: false, raw: r.error };
      }
      if (t === 'meeting') { const prov = g.key.split(':')[1]; return NS.integ.meetingLinkOk(prov, v.link) ? { ok: true, msg: `Bağlantı ${g.name} biçiminde. Odayı bir kez açıp çalıştığını kontrol edin.` } : { ok: false, raw: 'Bağlantı biçimi geçersiz' }; }
      if (t === 'zoom') {
        if (v.accountId || v.clientId || v.clientSecret) {
          if (!(v.accountId && v.clientId && v.clientSecret)) return { ok: false, raw: 'invalid_request: Account ID, Client ID ve Client Secret üçü birlikte gerekli' };
          if (!v.hostEmail) return { ok: false, raw: 'Toplantı sahibi e-posta gerekli' }; const r = await NS.integ.ent.dene(kind, prov, v); return r.ok ? { ok: true, msg: r.mesaj, parmak: r.parmak } : { ok: false, raw: r.hata };
        }
        return NS.integ.meetingLinkOk('zoom', v.link) ? { ok: true, msg: 'Kalıcı Zoom bağlantısı biçimi geçerli. Odayı bir kez açıp kontrol edin.' } : { ok: false, raw: 'API bilgisi yok ve bağlantı biçimi geçersiz' };
      }
      if (t === 'kantar') { const prev = NS.integ.cfg('kantar'); NS.integ.setCfg('kantar', { ...prev, ...g.map(v) }); try { const kg = await NS.integ.readKantar({ ask: true }); return { ok: true, msg: `Kantardan okunan ağırlık: ${kg.toLocaleString('tr-TR')} kg` }; } catch (e) { return { ok: false, raw: e.message }; } finally { NS.integ.setCfg('kantar', prev); } }
      if (t === 'scale-serial') { const prev = NS.integ.cfg('scale'); NS.integ.setCfg('scale', { ...prev, ...g.map(v) }); try { const kg = await NS.integ.readScale({ ask: true }); return { ok: true, msg: `Teraziden okunan ağırlık: ${kg.toLocaleString('tr-TR')} kg` }; } catch (e) { return { ok: false, raw: e.message }; } finally { NS.integ.setCfg('scale', prev); } }
      if (t === 'tcp') { const r = await br('/tcp-test', { host: v.host, port: Number(v.port) || 9100 }); return r.ok ? { ok: true, msg: `Yazıcıya bağlanıldı (${r.ms} ms). İsterseniz deneme fişi basabilirsiniz.` } : { ok: false, raw: `${r.code || r.httpStatus || ''} ${r.error || ''}` }; }
      if (t === 'iletimerkezi') { const r = await NS.integ.http({ url: 'https://api.iletimerkezi.com/v1/get-balance/json', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { authentication: { key: String(v.key).trim(), hash: String(v.hash).trim() } } }) }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* düz metin */ } const st = j.response && j.response.status; if (st && Number(st.code) === 200) { const b = j.response.balance || {}; return { ok: true, msg: `İleti Merkezi bağlantısı doğrulandı. Kalan: ${b.sms ?? '?'} SMS kredisi${b.amount && b.amount !== '0' ? `, ${b.amount} ₺` : ''}.` }; } return { ok: false, raw: st ? `${st.code} ${st.message}` : `${r.status || ''} ${r.error || String(r.body || '').slice(0, 200)}` }; }
      if (t === 'verimor') { const q = `username=${encodeURIComponent(String(v.user).trim())}&password=${encodeURIComponent(v.pass)}`; const r = await NS.integ.http({ url: 'https://sms.verimor.com.tr/v2/balance?' + q, method: 'GET', headers: {} }); if (!r.ok) return { ok: false, raw: `${r.status || ''} ${r.error || String(r.body || '').slice(0, 200)}` }; const h = await NS.integ.http({ url: 'https://sms.verimor.com.tr/v2/headers?' + q, method: 'GET', headers: {} }); let hs = []; try { hs = JSON.parse(h.body); } catch (e) { /* yok */ } if (v.header && hs.length && !hs.includes(v.header)) return { ok: false, raw: `başlık "${v.header}" yok. Hesaptaki başlıklar: ${hs.join(', ')}` }; return { ok: true, msg: `Verimor bağlantısı doğrulandı. Kalan kredi: ${String(r.body).trim()}.${hs.length ? ` Hesabınızdaki başlıklar: ${hs.join(', ')}.` : ''}` }; }
      if (t === 'whatsapp') { const r = await NS.integ.http({ url: `https://graph.facebook.com/${v.version || 'v23.0'}/${encodeURIComponent(String(v.phoneId).trim())}?fields=verified_name,display_phone_number,quality_rating`, method: 'GET', headers: { Authorization: 'Bearer ' + String(v.token).trim() } }); let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } if (r.ok && j.id) return { ok: true, msg: `Numara doğrulandı: ${j.verified_name || ''} ${j.display_phone_number || ''}${j.quality_rating ? ` · kalite: ${j.quality_rating}` : ''}` }; return { ok: false, raw: `${r.status || ''} ${j.error ? JSON.stringify(j.error) : r.error || String(r.body || '').slice(0, 200)}` }; }
      if (t === 'sms') { const to = await NS.prompt('Test SMS’i gönderilecek kendi numaranız (paketinizden 1 SMS düşer)', '05', { title: 'Gerçek SMS testi', type: 'tel' }); if (!to) return { skipped: true }; const prev = NS.integ.cfg('sms'); NS.integ.setCfg('sms', { ...prev, ...g.map(v) }); const r = await NS.integ.sms(to, `NEBSOFT bağlantı testi ${NS.time(new Date())}`, { silent: true }); if (!r.ok) NS.integ.setCfg('sms', prev); return r.ok && !r.simulated ? { ok: true, msg: 'Sağlayıcı mesajı kabul etti. Telefonunuza ulaştığını kontrol edin.' } : { ok: false, raw: String((r.response && (r.response.body || r.response.error)) || r.error || '') }; }
    } catch (e) { return { ok: false, raw: e.message }; }
    return { none: true };
  }
  // Her sağlayıcıda ortak ağ sorunları: sertifika (araya giren proxy / güvenlik yazılımı) ve DNS
  const NET = [{ match: 'CERT|certificate|SELF_SIGNED|UNABLE_TO_VERIFY', title: 'Güvenli bağlantı doğrulanamadı', fix: 'Sunucunun bulunduğu ağdaki bir güvenlik yazılımı veya proxy HTTPS bağlantısının sertifikasını değiştiriyor. Güvenlik yazılımında bu servis için HTTPS denetimini kapatın ya da kurumun kök sertifikasını sunucuya tanıtın.' }, { match: 'ENOTFOUND|EAI_AGAIN', title: 'Servis adresi çözümlenemedi', fix: 'Sunucunun DNS / internet bağlantısını kontrol edin.' }];
  const explain = (g, raw) => { const e = NET.concat((g && g.errors) || []).find((x) => new RegExp(x.match, 'i').test(raw)); return e || { title: g && g.test && g.test.type === 'sunucu' ? String(raw).slice(0, 200) : 'Bağlantı kurulamadı', fix: 'Bilgileri kontrol edip yeniden deneyin. Sorun sürerse teknik ayrıntıyı destek ekibimize iletin.' }; };
  async function retest(kind, done) {
    const p = curProv(kind); const g = GU().get(kind, p); const c = NS.integ.cfg(kind);
    if (!g || !g.test || ['none', 'sms', 'hid', 'track'].includes(g.test.type)) return toast('Bu bağlantı otomatik yeniden denenemiyor; Entegre et adımından deneyin', 'err');
    S()[kind] = { ...(S()[kind] || {}), testing: true }; st.save(); done();
    const r = await runTest(g, c, kind, p); S()[kind] = { prov: p, status: r.ok ? 'ok' : 'fail', test: !!r.test, parmak: r.parmak || '', at: new Date().toISOString(), msg: r.ok ? r.msg : explain(g, r.raw).title }; st.save(); await srYukle(); done();
    toast(r.ok ? `${g.name}: bağlantı sağlıklı` : `${g.name}: ${explain(g, r.raw).title}`, r.ok ? 'ok' : 'err');
  }
  // ---------- Sihirbaz ----------
  const STEPS = ['Sağlayıcı', 'Bilgiler', 'Bağlantıyı dene'];
  function wizard(kind, done) {
    const d = NS.integ.DEFS[kind]; const cur = NS.integ.cfg(kind); const isB = BK(kind);
    const pf = isB ? null : provField(kind, cur);
    const provs = isB ? GU().forKind(kind).map((g) => ({ value: g.key.split(':')[1], label: g.name })) : optionsOf(pf);
    let w = D()[kind] || { step: provs.length > 1 ? 0 : 1, prov: isB ? String(cur.brand || '') : pf ? String(cur[pf.name] ?? '') : defProv(kind), v: isB && cur.model ? { model: cur.model } : {}, test: null };
    if (!pf && !isB && !w.prov) w.prov = defProv(kind);
    // Taslaktan dönülürken gizli alanlar saklanmadığı için eksikse ayar adımına geri dönülür
    if (w.step > 2) w.step = 1; // eski taslak (6 adımlı sihirbaz)
    { const g0 = GU().get(kind, w.prov); if (w.step > 1 && g0 && g0.fields.some((f) => f.secret && f.required && !w.v[f.name] && !cur[f.name])) { w.step = 1; w.test = null; } }
    // Taslak bu cihazda düz saklanır: şifre / anahtar gibi gizli alanlar taslağa yazılmaz (devam ederken yeniden istenir)
    const saveDraft = () => { const g = GU().get(kind, w.prov); const hide = new Set(((g && g.fields) || []).filter((f) => f.secret).map((f) => f.name).concat(['pass', 'secret', 'token', 'apiSecret', 'hash', 'clientSecret'])); D()[kind] = { ...w, v: Object.fromEntries(Object.entries(w.v || {}).filter(([k]) => !hide.has(k))) }; st.save(); };
    // Seçilen cihaz türü / yönteme göre rehberin görünümü: yalnızca o yöntemin alanları ve testi
    const guide = () => { const g = GU().get(kind, w.prov); if (!g || !g.models) return g; const m = w.v.method;
      return { ...g, fields: g.fields.filter((f) => !f.methods || f.methods.includes(m)), test: g.test && g.test[m] ? g.test[m] : { type: 'none' }, unsupported: (g.unsupportedMethods || []).includes(m) }; };
    const modelOf = (g) => (g && g.models ? g.models.find((x) => x.id === w.v.model) : null);
    const MN = () => GU().METHOD_NAMES || {};
    const m = modal({ title: `${d.title} entegrasyonu`, size: 'xl', body: '<div class="wz" id="wz"></div>', onClose: () => { if (!w.finished && (w.step > 0 || Object.keys(w.v).length)) { saveDraft(); } else { delete D()[kind]; st.save(); } done && done(); } });
    const B = m.root; B.parentElement.classList.add('wz-modal');
    if (D()[kind] && w.step > 0) setTimeout(() => toast('Yarım kalan kurulumunuz açıldı — kaldığınız yerden devam edebilirsiniz'), 200);
    const help = (f) => f.help ? `<button type="button" class="wz-q" data-help="${esc(f.name)}" aria-label="${esc(f.label)} hakkında yardım">?</button>` : '';
    const helpBox = (f) => `<div class="wz-help" id="h-${esc(f.name)}" hidden><dl>${[['Bu bilgi nedir?', f.help.what], ['Neden gerekiyor?', f.help.why], ['Nereden alınır?', f.help.where], ['Biçim', f.help.format], ['Yanlış girilirse', f.help.wrong]].filter((x) => x[1]).map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl>${f.example ? `<div class="wz-ex"><code>${esc(f.example)}</code><button type="button" class="btn ghost sm" data-copy="${esc(f.example)}">${icon('copy')} Kopyala</button></div>` : ''}</div>`;
    const fieldHtml = (f) => {
      const old = cur[f.name]; const val = w.v[f.name] !== undefined ? w.v[f.name] : f.secret ? '' : old ?? '';
      const inp = f.type === 'checkbox' ? `<label class="check"><input type="checkbox" data-f="${f.name}" ${val ? 'checked' : ''}> ${esc(f.label)}</label>`
        : f.type === 'select' ? `<select class="input" data-f="${f.name}">${f.options.map((o) => `<option value="${o.value}" ${String(o.value) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
        : f.type === 'textarea' ? `<textarea class="input wz-ta" data-f="${f.name}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}" spellcheck="false">${esc(val)}</textarea>`
        : `<div class="wz-in"><input class="input" data-f="${f.name}" ${f.secret ? 'type="password" autocomplete="new-password"' : f.type === 'number' ? 'type="number"' : 'type="text"'} value="${esc(val)}" placeholder="${esc(f.secret && old ? '•••••••• kayıtlı — değiştirmek için yazın' : f.placeholder || '')}" spellcheck="false">${f.secret ? `<button type="button" class="wz-eye" data-eye="${f.name}" aria-label="Göster / gizle">${icon('eye')}</button>` : ''}</div>`;
      return `<div class="wz-f">${f.type === 'checkbox' ? '' : `<label>${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ''} ${help(f)}</label>`}${f.type === 'checkbox' ? `<div class="row nw">${inp}${help(f)}</div>` : inp}<span class="wz-err" id="e-${f.name}"></span>${f.help ? helpBox(f) : ''}</div>`;
    };
    const values = () => { const g = guide(); const o = { ...w.v }; (g ? g.fields : []).forEach((f) => { if (f.secret && !o[f.name] && cur[f.name]) o[f.name] = cur[f.name]; if (o[f.name] === undefined && !f.secret && cur[f.name] !== undefined) o[f.name] = cur[f.name]; }); return o; };
    const validate = () => { const g = guide(); if (!g || !g.fields.length) return true; const v = values(); let ok = true; g.fields.forEach((f) => { const e = $(`#e-${f.name}`, B); let msg = ''; if (f.required && !String(v[f.name] ?? '').trim()) msg = 'Bu alan zorunlu'; else if (f.pattern && v[f.name] && !new RegExp(f.pattern).test(String(v[f.name]).trim())) msg = 'Biçim hatalı — yardım (?) simgesine bakın'; if (e) e.textContent = msg; if (msg) ok = false; }); return ok; };
    // Deneme geçmeden ağ bağlantısı kaydedilmez. Cihaz bağlantısı (yazıcı, terazi) hatalı denemeyle de kaydedilebilir, kartta hata yazar
    const agBag = (g) => !!g && ['rest', 'soap', 'oauth'].includes(g.method);
    const saveOk = (g) => { if (w.finished || kapali(g) || (g && g.unsupported)) return false; if (sunucu(g)) return !!(w.test && w.test.ilkIslem); return !(agBag(g) && g.test && g.test.type !== 'none' && !(w.test && w.test.ok)); };
    async function kaydet() {
      const g = guide(); const v = values();
      const conf = g && g.map ? { ...cur, ...g.map(v, w.v) } : { ...cur, ...v, ...(pf ? { [pf.name]: pf.num ? Number(w.prov) : w.prov } : {}), ...(d.conn ? { enabled: true } : {}) };
      NS.integ.setCfg(kind, conf);
      S()[kind] = { prov: String(pf ? conf[pf.name] ?? w.prov : w.prov), status: w.v.method === 'manual' ? 'manual' : w.test ? (w.test.ok ? 'ok' : w.test.ilkIslem ? 'ilk-islem' : 'fail') : 'untested', test: !!(w.test && w.test.test), parmak: (w.test && w.test.parmak) || '', at: new Date().toISOString() }; st.save();
      NS.integ.log(kind, '', `${d.title} kurulumu`, w.test && w.test.ok ? 'bağlandı' : 'kaydedildi', g ? g.name : w.prov); // gizli alan yazılmaz
      w.finished = true; delete D()[kind]; st.save(); await srYukle(); draw();
    }
    async function talep(g) {
      const o = await NS.formModal({ title: `${g.name} için iletişim talebi`, submitLabel: 'Talebi gönder', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta' }] }); if (!o) return;
      try { await NS.api('POST', '/api/leads', { ...o, type: 'entegrasyon', product: NS.app && NS.app.opts ? NS.app.opts.id : '', msg: `${d.title}: ${g.name}` }); toast('Talebiniz alındı', 'ok'); } catch (e) { toast('Talep gönderilemedi: ' + e.message, 'err'); }
    }
    const draw = () => {
      const g = guide();
      const body = (() => {
        switch (w.step) {
          case 0: return `<h2>Hangi sağlayıcıyı entegre edeceksiniz?</h2><p class="muted">Kendi hesabınızla bağlanırsınız. Gereken bilgiler seçiminize göre değişir.</p><div class="wz-provs">${provs.map((o) => { const gg = GU().get(kind, o.value); return `<button type="button" class="wz-prov ${String(o.value) === w.prov ? 'on' : ''}" data-prov="${esc(o.value)}"><span class="ic-logo" ${gg ? `style="--lc:${gg.color}"` : ''}>${gg ? esc(gg.mark) : icon(o.value === 'sim' ? 'info' : d.icon)}</span><b>${esc(o.label)}</b>${kapali(gg) ? badge('Sözleşme gerekir', 'acc') : o.value === 'sim' ? badge('TEST', 'warn') : o.value === 'custom' ? badge('Kendi ara servisiniz', 'info') : ''}</button>`; }).join('')}</div>${(() => {
            const gm = GU().get(kind, w.prov); if (!gm || !gm.models) return ''; const md = modelOf(gm);
            return `<div class="wz-model"><div class="wz-f"><label>Cihaz türü / model <span class="req">*</span></label><select class="input" id="wzm"><option value="">Seçin…</option>${gm.models.map((x) => `<option value="${esc(x.id)}" ${x.id === w.v.model ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
              ${md ? `<div class="wz-f"><label>Bağlantı yöntemi <span class="req">*</span></label><div class="wz-meth">${md.methods.map((mt) => `<button type="button" class="wz-mt ${w.v.method === mt ? 'on' : ''}${(gm.unsupportedMethods || []).includes(mt) ? ' no' : ''}" data-meth="${mt}">${esc(MN()[mt] || mt)}${(gm.unsupportedMethods || []).includes(mt) ? ' · desteklenmiyor' : ''}</button>`).join('')}</div></div><div class="wz-note">${icon('info')}<span>${esc(md.note || '')}</span></div>` : ''}</div>`; })()}`;
          case 1: { if (kapali(g)) return `<h2>${esc(g.name)}</h2><p class="muted">${esc(g.summary)}</p><div class="wz-note">${icon('mail')}<span>Bu sağlayıcının API dokümanı herkese açık değil, bağlantı için sözleşme gerekir. Talep bırakın, birlikte değerlendirelim.</span></div>${g.prereq && g.prereq.length ? `<ul class="wz-pre">${g.prereq.map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>` : ''}${g.sources && g.sources.length ? `<div class="wz-src"><b>Kaynaklar</b>${g.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${icon('right')} ${esc(s.label)}</a>`).join('')}</div>` : ''}<button class="btn primary" id="wztalep">${icon('mail')} İletişim talebi bırak</button>`;
            return `<h2>${esc(g ? g.name : 'Bağlantı bilgileri')}</h2>${g ? `<p class="muted">${esc(g.summary)}</p>` : ''}${g && g.limit ? `<div class="wz-note">${icon('info')}<span><b>Kapsam:</b> ${esc(g.limit)}</span></div>` : ''}${g && g.prereq.length ? `<ul class="wz-pre">${g.prereq.map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>` : w.prov === 'sim' ? `<div class="wz-note">${icon('info')}<span>TEST modunda hiçbir yere bağlanılmaz; işlemler kayıtlara “simülasyon” olarak yazılır.</span></div>` : ''}${g && (g.method === 'tcp' || (g.method === 'sdk' && w.v.method !== 'manual')) ? `<div class="wz-note">${icon('info')}<span>Tarayıcılar ağdaki veya üretici yazılımı gerektiren cihazlara doğrudan bağlanamaz. Bu bağlantı <b>NEBSOFT masaüstü uygulamasındaki yerel köprü</b> veya üreticinin kasa bilgisayarındaki servisi üzerinden çalışır.</span></div>` : ''}${w.v.method === 'serial' ? `<div class="wz-note">${icon('info')}<span>Seri port bağlantısı tarayıcının <b>Web Serial</b> özelliğiyle çalışır: Chrome veya Edge kullanın.</span></div>` : ''}${g && g.where.length ? `<h3 class="ic-h3">Bilgileri nereden alırım?</h3><ol class="wz-where">${g.where.map((x) => `<li>${x}</li>`).join('')}</ol>` : ''}${g && g.envs ? `<div class="wz-envs">${Object.entries(g.envs).map(([k, x]) => `<div><b>${k === 'test' ? 'Test ortamı' : 'Canlı ortam'}</b><span>${esc(x)}</span></div>`).join('')}</div>` : ''}${g && g.sources.length ? `<div class="wz-src"><b>Sağlayıcının sayfaları</b>${g.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${icon('right')} ${esc(s.label)}</a>`).join('')}</div>` : ''}${g && g.fields.length ? `<h3 class="ic-h3">Bilgileriniz</h3><p class="muted small">Alanların yanındaki <b>?</b> simgesi bilginin ne olduğunu ve nereden alınacağını açıklar.</p><form class="wz-form" onsubmit="return false">${g.fields.map(fieldHtml).join('')}</form>` : w.prov === 'sim' ? '' : `<form class="wz-form" id="wzg" onsubmit="return false">${NS.fieldsHtml(d.fields({ ...cur, ...w.v, ...(pf ? { [pf.name]: w.prov } : {}) }).filter((f) => !pf || f.name !== pf.name), { ...cur, ...w.v })}</form>`}`; }
          case 2: { if (w.finished) { const ok = w.test && w.test.ok; const ilk = w.test && w.test.ilkIslem; return `<div class="wz-done">${icon(ok ? 'check' : 'info')}<h2>${ok ? (w.test.test ? 'Bağlı (test ortamı)' : 'Bağlı') : ilk ? 'Kaydedildi: ilk işlem bekleniyor' : 'Kaydedildi'}</h2><p class="muted">${ok ? esc(w.test.msg || '') : ilk ? 'İlk gerçek işlem başarılı olunca durum Bağlı olur.' : `${esc(d.title)} ayarları kaydedildi.`}</p></div>`; }
            const T = g && g.test ? g.test : { type: 'none' }; const r = w.test;
            return `<h2>Bağlantıyı dene</h2><p class="muted">${esc(T.note || '')}</p>${T.type === 'scale-barcode' ? `<div class="wz-hid"><input class="input" id="wzsb" placeholder="Terazi etiketinin barkodunu okutun veya yazıp Enter’a basın" autocomplete="off" inputmode="numeric"><span class="small muted">Örnek biçim: ön ek (27) + PLU (5 hane) + ağırlık gram (5 hane) + kontrol hanesi.</span></div>` : T.type === 'hid' ? `<div class="wz-hid"><input class="input" id="wzh" placeholder="Buraya tıklayıp bir barkod okutun" autocomplete="off"><span class="small muted">Okuyucu karakterleri çok hızlı (genellikle 30 ms’den kısa aralıkla) gönderir; elle yazım ayırt edilir.</span></div>` : T.type === 'none' || w.prov === 'sim' ? `<div class="wz-note">${icon('info')}<span>${w.prov === 'sim' ? 'TEST modunda gerçek bağlantı olmadığı için deneme yapılmaz.' : 'Bu seçenekte otomatik deneme yok. Ayarları kaydedebilirsiniz; ilk kullanımda sonucu kayıtlardan kontrol edin.'}</span></div>` : `<button class="btn primary lg" id="wzt">${icon('zap')} ${r ? 'Yeniden dene' : 'Bağlantıyı dene'}</button>`}
              <div id="wzr">${r ? resultHtml(g, r) : ''}</div>`; }
        }
        return '';
      })();
      B.querySelector('#wz').innerHTML = `<ol class="wz-steps">${STEPS.map((s, i) => `<li class="${i < w.step ? 'done' : i === w.step ? 'cur' : ''}"><i>${i < w.step ? icon('check') : i + 1}</i><span>${s}</span></li>`).join('')}</ol>
        <div class="wz-body">${body}</div>
        <footer class="wz-foot">${w.step > 0 && !w.finished ? `<button class="btn" data-nav="back">${icon('left')} Geri</button>` : '<span></span>'}<span class="grow"></span>${!w.finished ? `<button class="btn ghost" data-nav="later">Sonra devam et</button>` : ''}${w.finished ? `<button class="btn primary" data-nav="close">Kapat</button>` : w.step === 2 ? (saveOk(g) ? `<button class="btn primary" data-nav="save">${icon('check')} Kaydet</button>` : '') : kapali(g) && w.step === 1 ? '' : `<button class="btn primary" data-nav="next" ${w.step === 0 && (!w.prov || ((GU().get(kind, w.prov) || {}).models && (!w.v.model || !w.v.method))) ? 'disabled' : ''}>Devam ${icon('right')}</button>`}</footer>`;
      const hid = $('#wzh', B); if (hid) bindHid(hid);
      const sb = $('#wzsb', B); if (sb) { sb.focus(); sb.onkeydown = (e) => { if (e.key !== 'Enter') return; e.preventDefault(); const code = sb.value.trim(); sb.value = ''; if (!code) return; const g = guide(); const o = g.map(values()); const r = NS.integ.parseScaleBarcode(code, o); w.test = r ? { ok: true, msg: `Barkod çözüldü: PLU ${r.plu} · ${r.kg !== undefined ? r.kg.toLocaleString('tr-TR') + ' kg' : r.price.toLocaleString('tr-TR') + ' ₺'}. Bu PLU kodunu ilgili ürün kartına girin.` } : { ok: false, raw: `barkod çözülemedi: ${code} (ön ek ${o.prefix}, PLU ${o.pluLen} hane, değer ${o.valLen} hane)` }; saveDraft(); $('#wzr', B).innerHTML = resultHtml(g, w.test); }; }
      const wb = B.querySelector('.wz-body'); if (wb) wb.scrollTop = 0;
    };
    const resultHtml = (g, r) => r.ok ? `<div class="wz-res ok">${icon('check')}<div><b>${r.test ? 'Bağlı (test ortamı)' : 'Bağlı'}</b><p>${esc(r.msg || '')}</p>${r.html || ''}</div></div>`
      : r.ilkIslem ? `<div class="wz-res">${icon('info')}<div><b>İlk gerçek işlem gerekiyor</b><p>${esc(r.raw || '')}. Bilgileri kaydedin; ilk işlem başarılı olunca durum Bağlı olur.</p></div></div>`
      : (() => { const e = explain(g, r.raw || ''); const v = values(); let raw = String(r.raw || '').replace(/(Basic|Bearer)\s+\S+/g, '$1 ***');
        // Sağlayıcı yanıtı gizli alanları geri yazabilir (ör. kullanıcı adı): teknik ayrıntıda maskelenir
        ((g && g.fields) || []).filter((f) => f.secret && String(v[f.name] || '').length >= 2).forEach((f) => { raw = raw.split(String(v[f.name]).trim()).join('***'); });
        return `<div class="wz-res err">${icon('alert')}<div><b>${esc(e.title)}</b><p>${esc(e.fix)}</p><details><summary>Teknik ayrıntı</summary><code>${esc(raw.slice(0, 400))}</code></details></div></div>`; })();
    const bindHid = (inp) => { let ts = [], v0 = ''; inp.focus(); inp.onkeydown = (e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); const val = inp.value.trim(); const gaps = ts.slice(1).map((t, i) => t - ts[i]); const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 999; ts = []; inp.value = ''; if (val.length < 4) return; w.v.suffix = e.key === 'Tab' ? 'tab' : 'enter'; w.test = avg < 50 ? { ok: true, msg: `Okunan barkod: ${val} · ${val.length} karakter · ortalama ${Math.round(avg)} ms · sonek: ${e.key}` } : { ok: false, raw: `yavaş giriş: ortalama ${Math.round(avg)} ms` }; saveDraft(); $('#wzr', B).innerHTML = resultHtml(guide(), w.test); return; } if (e.key.length === 1) ts.push(performance.now()); }; };
    B.addEventListener('input', (e) => { const f = e.target.dataset.f; if (f) { w.v[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; const er = $(`#e-${f}`, B); if (er) er.textContent = ''; } });
    B.addEventListener('change', (e) => { if (e.target.id === 'wzm') { w.v.model = e.target.value; const md = modelOf(GU().get(kind, w.prov)); if (!md || !md.methods.includes(w.v.method)) w.v.method = md && md.methods.length === 1 ? md.methods[0] : ''; w.test = null; draw(); return; } const f = e.target.dataset.f; if (f) w.v[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
    B.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.prov !== undefined) { if (w.prov !== b.dataset.prov) { w.prov = b.dataset.prov; w.v = {}; w.test = null; } draw(); return; }
      if (b.dataset.meth) { w.v.method = b.dataset.meth; w.test = null; draw(); return; }
      if (b.dataset.help) { const h = $(`#h-${b.dataset.help}`, B); h.hidden = !h.hidden; return; }
      if (b.dataset.eye) { const i = $(`[data-f="${b.dataset.eye}"]`, B); i.type = i.type === 'password' ? 'text' : 'password'; return; }
      if (b.dataset.copy) { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Kopyalandı', 'ok'); } catch (x) { /* yok */ } return; }
      if (b.id === 'wztalep') { await talep(guide()); return; }
      if (b.id === 'wzt') { b.disabled = true; b.innerHTML = `${icon('refresh')} Deneniyor…`; const r = await runTest(guide(), values(), kind, w.prov); if (r.skipped) { draw(); return; } w.test = r.none ? null : r; saveDraft(); if (r.ok && guide().test.type === 'sunucu') await kaydet(); else draw(); return; }
      const nav = b.dataset.nav; if (!nav) return;
      if (nav === 'back') { w.step = Math.max(0, w.step - 1); draw(); return; }
      if (nav === 'later') { if ($('#wzg', B)) Object.assign(w.v, NS.readForm($('#wzg', B), d.fields({ ...cur, ...w.v }).filter((f) => !pf || f.name !== pf.name))); saveDraft(); w.keep = true; m.close(); toast('Kurulum kaydedildi; karttan “Kuruluma devam et” ile sürdürebilirsiniz'); return; }
      if (nav === 'close') { m.close(); return; }
      if (nav === 'next') {
        if (w.step === 1 && kapali(guide())) return;
        if (w.step === 1) { if ($('#wzg', B)) Object.assign(w.v, NS.readForm($('#wzg', B), d.fields({ ...cur, ...w.v }).filter((f) => !pf || f.name !== pf.name))); else if (!validate()) return; }
        w.step = Math.min(2, w.step + 1); saveDraft(); draw(); return;
      }
      if (nav === 'save') await kaydet();
    });
    draw();
  }
  // integrations.js yüklendikten sonra eski sayfanın yerine merkezi koy (eski görünüm "Kayıtlar ve gelişmiş ayarlar"da)
  const install = () => { if (!NS.integ || NS.integ.__wz) return; const legacy = NS.integ.page; NS.integ.page = (el, app, kinds) => center(el, app, kinds, legacy); NS.integ.wizard = wizard; NS.integ.__wz = 1; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install, 0);
})();
