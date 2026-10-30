/* NEBSOFT Sipariş ve Teslim ortak motoru: kuru temizleme, matbaa, pastane, çiçekçi ve terzi aynı akışı kullanır.
   Akış: sipariş/fiş → durum panosu → "hazır" bildirimi → adrese veya tezgâhta teslim → tahsilat. Program yalnızca yapılandırma ve kendi sayfalarını verir.
   SIPARIS.kur(C) alanları: id, ad, tagline, icon, accent, prefix, seed, status [{ id, name, color, icon }] (hazir ve teslim şart), roles, single ("Fiş"), hazirKelime,
   menu [{ id, label }] menü adları, lineExtra [{ name, label, list }], orderFields(o), pickup, delivery, adresBaslik, signIn/signOut (imza metni), photos, talep, docInfo(o), docNote(o), beforeTeslim(o), onStatus(o, st, app),
   canStatus(o, st, ctx) durum kapısı, check(f, o, ctx) kayıt öncesi denetim, mapForm(f, o), docs [[tür, { label, data(o, ctx) }]] ek belgeler, cards(o, ctx) + bind(el, o, ctx) detay kartları, dash(ctx) özet kartları, nav, routes, settings, integrations,.
   Veri: orders, customers, services, staff, sms, requests. Eski kayıtta dizi ve alanlar eksik olabilir: norm() tamamlar. */
window.SIPARIS = (function () {
  'use strict';
  const H = window.SIPHESAP;
  const WAIT = 3; // teslim alınmayan iş uyarısı (gün)
  const LIST_MAX = 200; // uzun listeler parça parça çizilir
  const IPTAL = { id: 'iptal', name: 'İptal', color: '#dc2626', icon: 'x' };
  const PAY = [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }, { value: 'havale', label: 'Havale' }];
  const PAYN = { nakit: 'Nakit', kart: 'Kart', havale: 'Havale', iade: 'İade' };
  const dg = (s) => String(s || '').replace(/\D/g, '').slice(-10);
  const ALF = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const yeniKod = () => { const a = new Uint8Array(8); if (self.crypto && self.crypto.getRandomValues) self.crypto.getRandomValues(a); else a.forEach((_, i) => { a[i] = Math.random() * 256; }); return [...a].map((b) => ALF[b % ALF.length]).join(''); };
  const waLink = (phone, text) => `https://wa.me/90${dg(phone)}?text=${encodeURIComponent(text)}`;
  const haritaLink = (adr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adr)}`;

  function kur(C) {
    const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
    const db = new NS.DB(C.id, C.seed);
    const S = () => db.settings({});
    const ALL = [...C.status, IPTAL]; const ST = Object.fromEntries(ALL.map((s) => [s.id, s]));
    const FLOW = C.status.filter((s) => s.id !== C.pickupStatus); const WORD = C.single || 'Sipariş'; const word = WORD.toLocaleLowerCase('tr');
    const norm = (o) => { ['lines', 'payments', 'log', 'photos'].forEach((k) => { if (!Array.isArray(o[k])) o[k] = []; }); if (!ST[o.status]) o.status = C.status[0].id; return o; };
    db.all('orders').forEach(norm);
    const cust = (id) => db.get('customers', id) || { name: '-', phone: '' };
    const staff = (id) => db.get('staff', id) || { name: '' };
    const acik = (o) => !['teslim', 'iptal'].includes(o.status);
    const orders = (f) => db.all('orders', f);
    const openO = () => orders(acik);
    const simdi = () => new Date().toTimeString().slice(0, 5);
    const gec = (o) => acik(o) && o.status !== 'hazir' && H.geciktiMi(o, today(), simdi());
    const dueText = (o) => (o.due ? NS.date(o.due) + (o.dueTime ? ' ' + o.dueTime : '') : '-');
    const baslik = (o) => (C.title ? C.title(o) : (o.lines[0] ? o.lines[0].name + (o.lines.length > 1 ? ` +${o.lines.length - 1}` : '') : WORD));
    const noteOf = (l) => [...(C.lineExtra || []).map((x) => l[x.name]).filter(Boolean), l.note].filter(Boolean).join(' · ');
    const trackUrl = (o) => location.href.replace(/index\.html.*$/, '').replace(/[?#].*$/, '') + 'takip.html?kod=' + o.code;
    const addLog = (o, status, note) => o.log.push({ at: new Date().toISOString(), status, note, user: (NS.currentUser && NS.currentUser.name) || '' });
    const hazirGun = (o) => { const l = o.log.filter((x) => x.status === 'hazir').pop(); return Math.floor((Date.now() - new Date((l || o).at)) / 864e5); };
    const pill = (o) => `<span class="badge" style="background:${ST[o.status].color};color:#fff;border:0">${esc(ST[o.status].name)}</span>`;

    // SMS sonucu kayda aynen yazılır: gönderilmeyen "gönderildi" görünmez, simülasyon TEST yazar
    async function tell(o, text, what) {
      const c = cust(o.customer); if (!c.phone) { addLog(o, o.status, `${what}: müşterinin telefonu yok`); db.save(); return toast('Müşterinin telefonu yok', 'err'); }
      const res = await NS.smsLog(db, { to: c.phone, name: c.name, text, kind: what, order: o.id, at: new Date().toISOString() }, true).result;
      const msg = NS.smsText(res, what); addLog(o, o.status, msg); db.save(); toast(msg, NS.smsTone(res)); return res;
    }
    const hazirMetni = (o) => (C.hazirMetni ? C.hazirMetni(o, S()) : `${S().bizName}: ${o.no} numaralı ${word}iniz hazır. Takip: ${trackUrl(o)}`);
    const setStatus = (o, status, note, app) => {
      o.status = status; addLog(o, status, note || ST[status].name); db.log('Durum', `${o.no} → ${ST[status].name}`); db.save();
      if (status === 'hazir' && S().smsHazir !== false) tell(o, hazirMetni(o), C.hazirKelime || 'Hazır SMS’i');
      if (C.onStatus) C.onStatus(o, status, ctx);
    };

    const kapi = (o, st) => { const m = C.canStatus ? C.canStatus(o, st, ctx) : ''; if (m) toast(m, 'err'); return !m; }; // üretime geçiş şartı (ör. onaysız tasarım baskıya inmez)

    // ---------- Fiş ve belgeler ----------
    const fisDoc = (o, kind) => { const c = cust(o.customer); const tes = kind === 'teslim'; const k = H.kalan(o);
      return { title: tes ? 'Teslim belgesi' : C.docLabel || `${WORD} fişi`, no: o.no, date: tes ? o.delivered || new Date().toISOString() : o.at,
        info: [['Teslim', dueText(o)], ...(o.mode === 'adres' ? [[C.adresBaslik || 'Teslim adresi', o.address || '-']] : []), ['Takip kodu', o.code], ...(o.condition ? [['Teslim alınırken durum', o.condition]] : []), ...(C.docInfo ? C.docInfo(o) : [])],
        party: { title: 'Müşteri', name: c.name, lines: [c.phone] }, lines: o.lines.map((l) => ({ name: l.name, note: noteOf(l), qty: l.qty, unit: l.unit || '', price: l.price, total: H.satir(l) })),
        totals: [...(o.disc ? [['İndirim', -Number(o.disc)]] : []), ...(o.fee ? [['Teslimat', Number(o.fee)]] : []), ['Toplam', H.toplam(o), true], ...(H.odenen(o) ? [['Ödenen', H.odenen(o)]] : []), ...(k > 0 ? [['Kalan', k]] : [])],
        note: [o.note, C.docNote ? C.docNote(o) : ''].filter(Boolean).join('\n'), signatures: tes ? [{ label: 'Teslim eden' }, { label: 'Teslim alan', ...(o.signOut || {}) }] : [{ label: 'İşletme' }, { label: 'Müşteri', ...(o.signIn || {}) }], qr: { url: trackUrl(o), label: `${WORD} durumunu buradan izleyin` } }; };
    if (NS.docs) (C.docs || []).forEach(([k, d]) => NS.docs.define(C.id, k, { label: d.label, defaults: d.defaults, sample: () => (orders()[0] ? d.data(orders()[0], ctx) : {}) }));
    if (NS.docs) { const ilk = () => orders()[0]; const smp = (k) => () => (ilk() ? fisDoc(ilk(), k) : {}); NS.docs.define(C.id, 'fis', { label: C.docLabel || `${WORD} fişi`, sample: smp('fis') }); NS.docs.define(C.id, 'teslim', { label: 'Teslim belgesi', sample: smp('teslim') }); }
    const printFis = (o) => { if (!C.signIn) return NS.docs.print('fis', fisDoc(o, 'fis')); return NS.docs.signAndPrint({ rec: o, field: 'signIn', db, type: 'fis', data: () => fisDoc(o, 'fis'), sign: { title: `${WORD} — müşteri imzası`, label: 'Müşteri adı soyadı', name: cust(o.customer).name, text: C.signIn } }); };
    const printTeslim = (o) => { if (!C.signOut) return NS.docs.print('teslim', fisDoc(o, 'teslim')); return NS.docs.signAndPrint({ rec: o, field: 'signOut', db, type: 'teslim', data: () => fisDoc(o, 'teslim'), sign: { title: 'Teslim — müşteri imzası', label: 'Teslim alan adı soyadı', name: cust(o.customer).name, text: C.signOut } }); };

    // ---------- Sipariş formu ----------
    const svcList = () => db.all('services').slice(0, 400);
    const cFind = (ph) => { const d = dg(ph); return d.length === 10 ? db.find('customers', (c) => dg(c.phone) === d) : null; };
    function lineRow(l, i) {
      const ex = (C.lineExtra || []).map((x) => `<input class="input sm" data-l="${x.name}" data-i="${i}" list="${x.list ? 'sl-' + x.name : ''}" placeholder="${esc(x.label)}" aria-label="${esc(x.label)}" value="${esc(l[x.name] || '')}">`).join('');
      const m2 = l.unit === 'm²' ? `<input class="input sm" type="number" step="0.01" min="0" data-l="en" data-i="${i}" placeholder="En (m)" aria-label="En" value="${esc(l.en || '')}"><input class="input sm" type="number" step="0.01" min="0" data-l="boy" data-i="${i}" placeholder="Boy (m)" aria-label="Boy" value="${esc(l.boy || '')}">` : '';
      return `<div class="sp-l" data-row="${i}"><div class="sp-l1"><input class="input" data-l="name" data-i="${i}" list="sl-svc" placeholder="Ürün / hizmet" aria-label="Ürün veya hizmet" value="${esc(l.name || '')}"><input class="input" type="number" step="0.01" min="0" data-l="qty" data-i="${i}" aria-label="Miktar" value="${esc(l.qty ?? 1)}" ${l.unit === 'm²' ? 'readonly' : ''}><span class="small faint sp-u">${esc(l.unit || 'adet')}</span><input class="input" type="number" step="0.01" min="0" data-l="price" data-i="${i}" aria-label="Birim fiyat" placeholder="Fiyat" value="${esc(l.price ?? '')}"><b class="sp-t" data-t="${i}">${money(H.satir(l))}</b><button class="btn sm icon ghost" data-rm="${i}" title="Satırı sil" aria-label="Satırı sil">${icon('x')}</button></div><div class="sp-l2">${m2}${ex}<input class="input sm" data-l="note" data-i="${i}" placeholder="Not" aria-label="Satır notu" value="${esc(l.note || '')}"></div></div>`;
    }
    function orderForm(app, o, preset) {
      const yeni = !o; const P = preset || {}; const lines = (o ? o.lines : P.lines || []).map((l) => ({ ...l })); if (!lines.length) lines.push({ qty: 1 });
      const c0 = o ? cust(o.customer) : P.customer || {}; const mod = o ? o.mode : P.mode || C.defaultMode || 'magaza';
      const ekF = C.orderFields ? C.orderFields(o || P) : [];
      const delF = [...(C.delivery ? [{ name: 'mode', label: 'Teslim şekli', type: 'select', options: [{ value: 'magaza', label: 'Mağazadan teslim' }, { value: 'adres', label: 'Adrese teslim' }] }, { name: 'address', label: C.adresBaslik || 'Teslim adresi', full: true }, { name: 'fee', label: 'Teslimat ücreti (₺)', type: 'number', step: '0.01', min: 0 }, { name: 'courier', label: 'Kurye', type: 'select', empty: 'Atanmadı', options: db.all('staff', (s) => s.kurye).map((s) => ({ value: s.id, label: s.name })) }] : [])];
      modal({ title: yeni ? `Yeni ${word}` : `${o.no} düzenle`, size: 'wide',
        body: `<datalist id="sl-svc">${svcList().map((s) => `<option value="${esc(s.name)}">`).join('')}</datalist>${(C.lineExtra || []).filter((x) => x.list).map((x) => `<datalist id="sl-${x.name}">${x.list.map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`).join('')}
          <div class="form-grid"><div class="field"><label>Telefon *</label><input class="input" id="sp-ph" type="tel" autocomplete="off" placeholder="05…" value="${esc(c0.phone || '')}"><div class="small faint" id="sp-phm"></div></div>
          <div class="field"><label>Müşteri adı *</label><input class="input" id="sp-cn" autocomplete="off" value="${esc(c0.name || '')}"><div id="sp-cl"></div></div></div>
          <h3 class="mt">Kalemler</h3><div id="sp-ls"></div><button class="btn sm mt" id="sp-add" type="button">${icon('plus')} Satır ekle</button>
          ${NS.fieldsHtml([{ name: 'due', label: C.dueLabel || 'Teslim tarihi', type: 'date', required: true }, { name: 'dueTime', label: C.timeLabel || 'Teslim saati', placeholder: '14:00 veya 14:00-16:00' }, ...(C.pickup ? [{ name: 'pickup', label: 'Adresten alınacak', type: 'checkbox' }] : []), ...delF, ...ekF, { name: 'staff', label: C.staffLabel || 'Sorumlu', type: 'select', empty: 'Atanmadı', options: db.all('staff', (s) => !s.kurye).map((s) => ({ value: s.id, label: s.name })) }, ...(C.conditionLabel ? [{ name: 'condition', label: C.conditionLabel, full: true, hint: 'Müşteriyle birlikte kaydedin; fişe yazılır, sonradan çıkan anlaşmazlıkta dayanak olur.' }] : []), { name: 'note', label: 'Müşteriye görünen not', type: 'textarea', full: true }, { name: 'internal', label: 'İç not (müşteri görmez)', type: 'textarea', full: true }, { name: 'disc', label: 'İndirim (₺)', type: 'number', step: '0.01', min: 0 }, ...(yeni ? [{ name: 'deposit', label: C.depositLabel || 'Kapora (₺)', type: 'number', step: '0.01', min: 0 }, { name: 'depType', label: 'Ödeme şekli', type: 'select', options: PAY }] : [])], { mode: mod, due: iso(addDays(new Date(), Number(S().defaultDays) || 2)), ...(o || P) })}
          <div class="row between mt"><span class="muted">Toplam</span><b id="sp-tot" style="font-size:20px"></b></div>`,
        onOpen: (b) => {
          const ls = $('#sp-ls', b); const draw = () => { ls.innerHTML = lines.map(lineRow).join(''); tot(); };
          const tot = () => { const f = NS.readForm(b); $('#sp-tot', b).textContent = money(H.toplam({ lines, disc: f.disc, fee: f.mode === 'adres' ? f.fee : 0 })); };
          const adrShow = () => { const m = $('[name=mode]', b); if (!m) return; const a = m.value === 'adres'; ['address', 'fee', 'courier'].forEach((n) => { const x = $(`[name=${n}]`, b); if (x) x.closest('.field').style.display = a ? '' : 'none'; }); };
          adrShow(); draw(); b.addEventListener('input', (e) => { if (e.target.name) { if (e.target.name === 'mode') adrShow(); tot(); } });
          if ($('[name=mode]', b)) $('[name=mode]', b).onchange = () => { adrShow(); tot(); };
          ls.addEventListener('input', (e) => { const x = e.target; if (!x.dataset.l) return; const i = Number(x.dataset.i); const l = lines[i]; l[x.dataset.l] = x.value;
            if (x.dataset.l === 'name') { const s = db.find('services', (r) => r.name === x.value); if (s) { Object.assign(l, { sid: s.id, name: s.name, unit: s.unit || 'adet', price: s.price }); if (l.unit !== 'm²') { delete l.en; delete l.boy; } draw(); return; } }
            if (x.dataset.l === 'en' || x.dataset.l === 'boy') { l.qty = H.m2(l.en, l.boy); const q = $(`[data-l=qty][data-i="${i}"]`, ls); if (q) q.value = l.qty; }
            const t = $(`[data-t="${i}"]`, ls); if (t) t.textContent = money(H.satir(l)); tot(); });
          ls.addEventListener('click', (e) => { const r = e.target.closest('[data-rm]'); if (!r) return; lines.splice(Number(r.dataset.rm), 1); if (!lines.length) lines.push({ qty: 1 }); draw(); });
          $('#sp-add', b).onclick = () => { lines.push({ qty: 1 }); draw(); $$('[data-l=name]', ls).pop().focus(); };
          const fill = (c) => { $('#sp-ph', b).value = c.phone || ''; $('#sp-cn', b).value = c.name || ''; $('#sp-cl', b).innerHTML = ''; $('#sp-phm', b).textContent = `Kayıtlı müşteri · ${orders((x) => x.customer === c.id).length} ${word}`; const a = $('[name=address]', b); if (a && !a.value && c.address) a.value = c.address; };
          $('#sp-ph', b).oninput = (e) => { const c = cFind(e.target.value); if (c) fill(c); else $('#sp-phm', b).textContent = dg(e.target.value).length === 10 ? 'Yeni müşteri, kaydederken eklenir' : ''; };
          $('#sp-cn', b).oninput = (e) => { const q = e.target.value; const R = q.length < 2 ? [] : db.all('customers', (c) => NS.match(q, c.name)).slice(0, 5); $('#sp-cl', b).innerHTML = R.map((c) => `<button type="button" class="btn sm ghost" data-c="${c.id}">${esc(c.name)} · ${esc(c.phone)}</button>`).join(''); };
          $('#sp-cl', b).onclick = (e) => { const x = e.target.closest('[data-c]'); if (x) fill(db.get('customers', x.dataset.c)); };
        },
        actions: [{ label: 'Vazgeç' }, { label: yeni ? 'Kaydet' : 'Değişiklikleri kaydet', cls: 'primary', icon: 'check', onClick: async (close, b) => {
          const name = $('#sp-cn', b).value.trim(); const phone = $('#sp-ph', b).value.trim();
          if (!name || !phone) return toast('Müşteri adı ve telefon gerekli', 'err');
          if (dg(phone).length !== 10) return toast('Telefon numarası 10 hane olmalı', 'err');
          if (!NS.validate(b)) return;
          const clean = lines.filter((l) => String(l.name || '').trim()); if (!clean.length) return toast('En az bir kalem girin', 'err');
          if (clean.some((l) => H.n(l.qty) <= 0)) return toast('Miktar sıfırdan büyük olmalı', 'err');
          if (clean.some((l) => H.n(l.price) < 0)) return toast('Fiyat eksi olamaz', 'err');
          const v = NS.readForm(b); if (yeni && v.due < today()) return toast('Teslim tarihi geçmişte olamaz', 'err');
          if (!C.delivery || v.mode !== 'adres') { v.fee = 0; v.courier = v.courier || ''; }
          if (v.mode === 'adres' && !String(v.address || '').trim()) return toast('Teslim adresini yazın', 'err');
          if (Number(v.deposit) < 0 || Number(v.disc) < 0) return toast('Tutar eksi olamaz', 'err');
          const ld = clean.map((l) => ({ ...l, qty: H.r2(l.qty), price: H.r2(l.price) }));
          let c = cFind(phone); if (!c) c = db.insert('customers', { name, phone, address: v.address || '' }, true); else if (c.name !== name && yeni && !(await confirm(`Bu telefon ${c.name} adına kayıtlı. Kayıt bu müşteriye açılsın mı?`, { ok: 'Evet', danger: false }))) return;
          const f = { ...v, lines: ld, customer: c.id, disc: H.r2(v.disc), fee: H.r2(v.fee) }; delete f.deposit; delete f.depType;
          if (C.mapForm) C.mapForm(f, o);
          const cap = Number(S().slotCap) || 0; if (cap && f.due) { const n = orders((x) => acik(x) && x.id !== (o && o.id) && x.due === f.due && (x.dueTime || '') === (f.dueTime || '')).length; if (n >= cap && !(await confirm(`${NS.date(f.due)} ${f.dueTime || ''} için ${n} iş var, sınırınız ${cap}. Yine de eklensin mi?`, { ok: 'Ekle', danger: false }))) return; }
          if (C.check && (await C.check(f, o, ctx)) === false) return;
          if (yeni) {
            const first = f.pickup && C.pickupStatus ? C.pickupStatus : FLOW[0].id;
            const n = norm(db.insert('orders', { ...f, no: db.nextNo('orders', C.prefix), code: yeniKod(), at: new Date().toISOString(), status: first, payments: [], log: [], photos: [] }));
            if (Number(v.deposit) > 0) n.payments.push({ type: v.depType, amount: H.r2(v.deposit), at: n.at, kind: 'kapora' });
            addLog(n, first, `${WORD} açıldı · toplam ${money(H.toplam(n))}${Number(v.deposit) > 0 ? ` · kapora ${money(v.deposit)}` : ''}`); db.log(WORD, n.no); db.save();
            if (P.request) { const r = db.get('requests', P.request); if (r) { r.status = 'siparis'; r.order = n.id; db.save(); } }
            close(); toast(`${n.no} kaydedildi`, 'ok'); app.go('siparis', n.id); if (S().autoPrint !== false) printFis(n);
          } else {
            const oT = H.toplam(o), oD = dueText(o); Object.assign(o, f); const nT = H.toplam(o), nD = dueText(o); // tutar ve söz verilen tarih değişikliği iz bırakır (ölçü/ücret anlaşmazlığı)
            if (oT !== nT) addLog(o, o.status, `Tutar değişti: ${money(oT)} → ${money(nT)}`); if (oD !== nD) addLog(o, o.status, `Teslim sözü değişti: ${oD} → ${nD}`); addLog(o, o.status, 'Kayıt düzenlendi');
            db.save(); close(); toast('Kaydedildi', 'ok'); app.refresh();
          }
        } }] });
    }

    // ---------- Teslim ve tahsilat ----------
    async function teslimEt(o, app) {
      if (C.beforeTeslim && (await C.beforeTeslim(o, ctx)) === false) return;
      const due = H.kalan(o); const fat = !!(NS.ebelge && NS.integ && NS.integ.isOn('efatura') && H.toplam(o) > 0);
      const adr = o.mode === 'adres';
      const fields = [...(due > 0 ? [{ name: 'amount', label: 'Tahsil edilen (₺)', type: 'number', step: '0.01', min: 0 }, { name: 'type', label: 'Ödeme', type: 'select', options: PAY }] : []), ...(adr ? [{ name: 'recv', label: 'Teslim alan kişi', required: true }, { name: 'recvNote', label: 'Teslim notu', placeholder: 'Komşuya bırakıldı…' }] : []), ...(fat ? [{ name: 'inv', label: 'e-Arşiv / e-Fatura kes', type: 'checkbox' }] : [])];
      let v = {}; if (fields.length) { v = await formModal({ title: due > 0 ? `Teslim: kalan ${money(due)}` : 'Teslim', fields, values: { amount: due, type: 'nakit', inv: fat && !o.invoice, recv: adr ? o.recipient || '' : '' }, submitLabel: 'Teslim et' }); if (!v) return; }
      if (due > 0 && Number(v.amount) > 0) o.payments.push({ type: v.type, amount: H.r2(v.amount), at: new Date().toISOString(), kind: 'tahsilat' });
      if (v.inv) { const r = await NS.ebelge.create({ docType: 'auto', buyer: cust(o.customer).name, no: o.no, lines: o.lines.map((l) => ({ name: l.name, qty: l.qty, total: H.satir(l), vat: Number(S().vat) || 20 })), note: o.no }); if (r && r.no) { o.invoice = r.no + (r.simulated ? ' (TEST)' : ''); addLog(o, o.status, 'Fatura ' + o.invoice); } else if (r && r.error) toast('Fatura kesilemedi: ' + r.error, 'err'); }
      o.delivered = new Date().toISOString(); if (adr) o.proof = { name: v.recv, note: v.recvNote || '', at: o.delivered, by: (NS.currentUser && NS.currentUser.name) || '' };
      setStatus(o, 'teslim', adr ? `Teslim edildi: ${v.recv}${v.recvNote ? ' · ' + v.recvNote : ''}` : 'Teslim edildi', app); printTeslim(o); app.refresh();
    }
    async function iptal(o, app) {
      const p = H.odenen(o); const v = await formModal({ title: `${o.no} iptal`, fields: [{ name: 'why', label: 'İptal nedeni', required: true, full: true }, ...(p > 0 ? [{ name: 'back', label: `İade edilen (₺) · alınan ${money(p)}`, type: 'number', step: '0.01', min: 0, hint: 'İade yapılmadıysa 0 yazın; kapora kasada kalır.' }, { name: 'type', label: 'İade şekli', type: 'select', options: PAY }] : [])], values: { back: 0, type: 'nakit' }, submitLabel: 'İptal et' });
      if (!v) return; const b = H.r2(v.back); if (b > p) return toast('İade, alınan tutarı aşamaz', 'err');
      if (b > 0) o.payments.push({ type: v.type, amount: -b, at: new Date().toISOString(), kind: 'iade' });
      setStatus(o, 'iptal', `İptal: ${v.why}${b > 0 ? ` · ${money(b)} iade` : ''}`, app); app.refresh();
    }
    async function tahsilat(o, app) {
      const k = H.kalan(o); const v = await formModal({ title: 'Tahsilat', fields: [{ name: 'amount', label: 'Tutar (₺)', type: 'number', step: '0.01', min: 0.01, required: true }, { name: 'type', label: 'Ödeme', type: 'select', options: PAY }], values: { amount: k > 0 ? k : '', type: 'nakit' } });
      if (!v) return; o.payments.push({ type: v.type, amount: H.r2(v.amount), at: new Date().toISOString(), kind: 'tahsilat' }); addLog(o, o.status, `Tahsilat ${money(v.amount)} (${PAYN[v.type]})`); db.save(); app.refresh();
    }

    // ---------- Sipariş detayı ----------
    const nextOf = (o) => { const i = FLOW.findIndex((s) => s.id === o.status); return o.status === C.pickupStatus ? FLOW[0] : FLOW[i + 1]; };
    function detailPage(el, id, app) {
      const o = db.get('orders', id); if (!o) return app.go('siparisler'); norm(o);
      const c = cust(o.customer); const idx = FLOW.findIndex((s) => s.id === o.status); const nx = acik(o) ? nextOf(o) : null; const K = H.kalan(o);
      const sonraki = !nx ? '' : nx.id === 'teslim' ? `<button class="btn primary" data-x="teslim">${icon('user')} Teslim et</button>` : `<button class="btn ${nx.id === 'hazir' ? 'ok' : 'primary'}" data-st="${nx.id}">${icon(nx.id === 'hazir' ? 'check' : nx.icon)} ${esc(nx.name)}</button>`;
      el.innerHTML = `<div class="row mb"><a class="btn" href="#/${C.home || 'pano'}" aria-label="Panoya dön">${icon('back')}</a><h1 class="grow">${esc(o.no)} · ${esc(baslik(o))}</h1>${gec(o) ? badge('Gecikti', 'err') : ''}${pill(o)}</div>
        <div class="card pad mb"><div class="sp-steps">${FLOW.map((s, i) => `<div><i style="background:${i <= idx ? s.color : 'var(--border)'}"></i><span class="${s.id === o.status ? '' : 'faint'}" ${s.id === o.status ? 'style="font-weight:700"' : ''}>${esc(s.name)}</span></div>`).join('')}</div>
          <div class="row mt">${sonraki}${acik(o) && o.status === 'hazir' ? `<button class="btn" data-x="tekrar">${icon('send')} Hazır SMS’i gönder</button>` : ''}<span class="grow"></span><button class="btn" data-x="print">${icon('print')} Fiş</button>${o.status === 'teslim' ? `<button class="btn" data-x="printT">${icon('print')} Teslim belgesi</button>` : ''}${(C.docs || []).map(([k, d]) => `<button class="btn" data-doc="${k}">${icon('print')} ${esc(d.label)}</button>`).join('')}<button class="btn" data-x="wa">${icon('message')} WhatsApp</button><button class="btn" data-x="track">${icon('globe')} Takip</button>${acik(o) ? `<button class="btn" data-x="edit">${icon('edit')} Düzenle</button><button class="btn danger" data-x="iptal">İptal</button>` : ''}</div></div>
        <div class="grid g-21"><div class="col" style="gap:16px">
          <div class="card"><div class="card-h"><h3>Kalemler</h3></div>${table({ rows: o.lines.map((l, i) => ({ ...l, id: i })), empty: 'Kalem yok', columns: [{ label: 'Kalem', render: (l) => `<b>${esc(l.name)}</b>${noteOf(l) ? `<div class="small faint">${esc(noteOf(l))}</div>` : ''}` }, { label: 'Miktar', cls: 'right', render: (l) => `${esc(l.qty)} ${esc(l.unit || '')}` }, { label: 'Fiyat', cls: 'right', render: (l) => money(l.price) }, { label: 'Tutar', cls: 'right', render: (l) => `<b>${money(H.satir(l))}</b>` }] })}</div>
          <div class="card"><div class="card-h"><h3>Bilgiler</h3></div><div class="card-b grid g2">
            <div><div class="small muted">Müşteri</div><b>${esc(c.name)}</b><div class="small"><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div></div>
            <div><div class="small muted">${esc(C.dueLabel || 'Teslim tarihi')}</div><b>${esc(dueText(o))}</b></div>
            ${o.mode === 'adres' ? `<div class="full" style="grid-column:1/-1"><div class="small muted">${esc(C.adresBaslik || 'Teslim adresi')}</div><a target="_blank" rel="noopener" href="${haritaLink(o.address)}">${esc(o.address)}</a>${o.courier ? `<div class="small">Kurye: ${esc(staff(o.courier).name)}</div>` : ''}</div>` : ''}
            ${o.staff ? `<div><div class="small muted">${esc(C.staffLabel || 'Sorumlu')}</div>${esc(staff(o.staff).name)}</div>` : ''}${o.note ? `<div><div class="small muted">Not</div>${esc(o.note)}</div>` : ''}${o.internal ? `<div><div class="small muted">İç not</div>${esc(o.internal)}</div>` : ''}
            ${o.condition ? `<div class="full" style="grid-column:1/-1"><div class="small muted">${esc(C.conditionLabel || 'Durum')}</div>${esc(o.condition)}</div>` : ''}${o.proof ? `<div class="full" style="grid-column:1/-1"><div class="small muted">Teslim kaydı</div>${esc(o.proof.name)} · ${NS.dt(o.proof.at)}${o.proof.note ? ' · ' + esc(o.proof.note) : ''}</div>` : ''}</div></div>
          ${C.photos ? `<div class="card"><div class="card-h"><h3>${icon('image')} ${esc(C.photos)}</h3><label class="btn sm">${icon('plus')} Fotoğraf<input type="file" accept="image/*" id="sp-ph-f" hidden></label></div><div class="card-b sp-photos">${o.photos.length ? o.photos.map((p, i) => `<figure><img src="${esc(p.url)}" alt="${esc(p.note || 'Fotoğraf')}" loading="lazy" width="120" height="120"><figcaption class="small faint">${NS.date(p.at)}</figcaption><button class="btn sm icon ghost" data-ph="${i}" aria-label="Fotoğrafı sil">${icon('x')}</button></figure>`).join('') : '<span class="small muted">Henüz fotoğraf yok</span>'}</div></div>` : ''}
          ${C.cards ? C.cards(o, ctx) : ''}
        </div><div class="col" style="gap:16px">
          <div class="card"><div class="card-h"><h3>Ödeme</h3>${acik(o) ? `<button class="btn sm" data-x="pay">${icon('plus')} Tahsilat</button>` : ''}</div><div class="card-b">
            ${o.disc ? `<div class="row between small"><span>İndirim</span><span>-${money(o.disc)}</span></div>` : ''}${o.fee ? `<div class="row between small"><span>Teslimat</span><span>${money(o.fee)}</span></div>` : ''}
            <div class="row between"><span>Toplam</span><b style="font-size:20px">${money(H.toplam(o))}</b></div><div class="row between small muted"><span>Ödenen</span><span>${money(H.odenen(o))}</span></div><div class="row between"><span>Kalan</span><b style="color:${K > 0 ? 'var(--err)' : 'var(--ok)'}">${money(K)}</b></div>
            ${o.payments.map((p) => `<div class="small faint">${NS.date(p.at)} · ${esc(PAYN[p.type] || p.type)} · ${money(p.amount)}${p.kind === 'kapora' ? ' · kapora' : p.kind === 'iade' ? ' · iade' : ''}</div>`).join('')}${o.invoice ? `<div class="small mt">Fatura: ${esc(o.invoice)}</div>` : ''}</div></div>
          <div class="card"><div class="card-h"><h3>Geçmiş</h3></div><div class="card-b"><div class="sp-tl">${o.log.slice().reverse().map((l) => `<div class="tl" style="--c:${(ST[l.status] || {}).color || 'var(--accent)'}"><b>${esc((ST[l.status] || {}).name || l.status)}</b><div class="small">${esc(l.note || '')}</div><div class="small faint">${NS.dt(l.at)}${l.user ? ' · ' + esc(l.user) : ''}</div></div>`).join('')}</div>
            <div class="row nw mt"><input class="input" id="sp-nt" placeholder="Not ekle (verilen söz, görüşme…)" aria-label="Not ekle"><button class="btn" id="sp-nts" aria-label="Notu kaydet">${icon('plus')}</button></div></div></div>
          ${o.review ? `<div class="card pad"><div class="small muted">Müşteri değerlendirmesi</div><div style="font-size:20px;color:#f59e0b">${'★'.repeat(o.review.stars)}</div>${o.review.text ? `<div class="small mt">${esc(o.review.text)}</div>` : ''}</div>` : ''}
          <div class="card pad center"><div class="small muted mb">Takip kodu</div><div class="mono" style="font-size:20px;font-weight:800;letter-spacing:.1em">${esc(o.code)}</div><div class="mt">${NS.qrSvg(trackUrl(o), 110)}</div></div>
        </div></div>`;
      on(el, 'click', '[data-st]', (e, b) => { if (!kapi(o, b.dataset.st)) return; setStatus(o, b.dataset.st, null, app); app.refresh(); });
      on(el, 'click', '[data-x]', (e, b) => { const x = b.dataset.x;
        if (x === 'teslim') teslimEt(o, app); else if (x === 'iptal') iptal(o, app); else if (x === 'pay') tahsilat(o, app); else if (x === 'edit') orderForm(app, o); else if (x === 'print') printFis(o); else if (x === 'printT') printTeslim(o);
        else if (x === 'tekrar') tell(o, hazirMetni(o), C.hazirKelime || 'Hazır SMS’i').then(() => app.refresh());
        else if (x === 'wa') window.open(waLink(c.phone, o.status === 'hazir' ? hazirMetni(o) : `${S().bizName}: ${o.no} takip: ${trackUrl(o)}`), '_blank', 'noopener');
        else if (x === 'track') { if (navigator.clipboard) navigator.clipboard.writeText(trackUrl(o)).catch(() => {}); window.open(trackUrl(o), '_blank'); toast('Takip linki kopyalandı', 'ok'); } });
      on(el, 'click', '[data-doc]', (e, b) => { const d = Object.fromEntries(C.docs)[b.dataset.doc]; NS.docs.print(b.dataset.doc, d.data(o, ctx)); });
      $('#sp-nts', el).onclick = () => { const v = $('#sp-nt', el).value.trim(); if (!v) return; addLog(o, o.status, v); db.save(); app.refresh(); };
      const fi = $('#sp-ph-f', el); if (fi) fi.onchange = async () => { const f = fi.files[0]; if (!f) return; try { const h = await NS.dosya.hazirla(db, f); o.photos.push({ url: await h.yukle(), at: new Date().toISOString(), by: (NS.currentUser && NS.currentUser.name) || '' }); addLog(o, o.status, 'Fotoğraf eklendi'); db.save(); app.refresh(); } catch (x) { toast(x.message, 'err'); } };
      on(el, 'click', '[data-ph]', async (e, b) => { if (await confirm('Fotoğraf silinsin mi?')) { o.photos.splice(Number(b.dataset.ph), 1); addLog(o, o.status, 'Fotoğraf silindi'); db.save(); app.refresh(); } });
      if (C.bind) C.bind(el, o, ctx);
    }

    // ---------- Pano ----------
    function boardPage(el, p, app) {
      let q = ''; const COLS = [...C.status].filter((s) => s.id !== 'teslim'); const MAX = 60;
      const draw = () => {
        const list = openO().filter((o) => !q || NS.match(q, o.no, o.code, baslik(o), cust(o.customer).name, cust(o.customer).phone)).sort(H.sira); const O = openO();
        el.innerHTML = pageHead(C.panoBaslik || `${WORD} Panosu`, 'Kartı sürükleyin veya açıp durumunu değiştirin', `${NS.searchBox('q', 'No, müşteri, telefon...', q)}<button class="btn primary" id="ni">${icon('plus')} Yeni ${esc(word)}</button>`) +
          `<div class="grid g4 mb">${kpi('Açık iş', O.length, 'list')}${kpi('Bugün teslim', O.filter((o) => o.due === today()).length, 'calendar', 'info')}${kpi('Hazır bekleyen', O.filter((o) => o.status === 'hazir').length, 'check', 'ok')}${kpi('Geciken', O.filter(gec).length, 'alert', 'err')}</div>
          <div class="sp-kanban">${COLS.map((s) => { const cards = list.filter((o) => o.status === s.id); return `<div class="sp-col" data-col="${s.id}"><h4 style="color:${s.color}">${icon(s.icon)} ${esc(s.name)} <span class="badge">${cards.length}</span></h4>${cards.slice(0, MAX).map((o) => `<div class="sp-card ${gec(o) ? 'late' : ''}" draggable="true" tabindex="0" role="link" data-o="${o.id}" style="--c:${s.color}"><b>${esc(baslik(o))}</b><div class="muted">${esc(cust(o.customer).name)}</div><div class="small faint">${esc(o.no)} · ${esc(dueText(o))}${o.mode === 'adres' ? ' · adrese' : ''}</div></div>`).join('')}${cards.length > MAX ? `<div class="small faint center">+${cards.length - MAX} iş daha, aramayla bulun</div>` : ''}</div>`; }).join('')}</div>`;
        $('#q', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#q', el); i.focus(); i.setSelectionRange(pos, pos); };
        $('#ni', el).onclick = () => orderForm(app);
      };
      let drag = null;
      el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-o]'); if (c) { drag = c.dataset.o; e.dataTransfer.effectAllowed = 'move'; } });
      el.addEventListener('dragover', (e) => { const col = e.target.closest('[data-col]'); if (col && drag) { e.preventDefault(); $$('.sp-col', el).forEach((k) => k.classList.toggle('over', k === col)); } });
      el.addEventListener('drop', (e) => { const col = e.target.closest('[data-col]'); if (!col || !drag) return; e.preventDefault(); const o = db.get('orders', drag); drag = null; if (o.status !== col.dataset.col && kapi(o, col.dataset.col)) { setStatus(o, col.dataset.col, null, app); toast(`${o.no} → ${ST[col.dataset.col].name}`, 'ok'); } draw(); });
      el.addEventListener('dragend', () => $$('.sp-col', el).forEach((k) => k.classList.remove('over')));
      on(el, 'click', '[data-o]', (e, c) => app.go('siparis', c.dataset.o));
      on(el, 'keydown', '[data-o]', (e, c) => { if (e.key === 'Enter') app.go('siparis', c.dataset.o); });
      draw();
    }

    // ---------- Liste ----------
    function listPage(el, p, app) {
      let q = '', f = 'acik', max = LIST_MAX;
      el.innerHTML = pageHead(C.listeBaslik || `${WORD} Kayıtları`, 'Arama, durum süzgeci ve Excel’e aktarma', `<button class="btn" id="ex">${icon('download')} Excel (CSV)</button><button class="btn primary" id="ni">${icon('plus')} Yeni ${esc(word)}</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'No, müşteri, telefon, kalem...')}<div class="seg">${[['acik', 'Açık'], ['teslim', 'Teslim edilen'], ['iptal', 'İptal'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
      const rows = () => orders((o) => (f === 'all' || (f === 'acik' ? acik(o) : o.status === f)) && NS.match(q, o.no, o.code, baslik(o), cust(o.customer).name, cust(o.customer).phone)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const draw = () => { const r = rows(); const v = r.slice(0, max); $('#t', el).innerHTML = table({ rows: v, emptyIcon: 'list', empty: 'Bu görünümde kayıt yok', mobileCard: (o) => `<b>${esc(o.no)}</b> ${pill(o)}<div>${esc(cust(o.customer).name)}</div><div class="small faint">${esc(baslik(o))} · ${esc(dueText(o))} · ${money(H.toplam(o))}</div>`, columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b>` }, { label: 'Müşteri', render: (o) => `${esc(cust(o.customer).name)}<div class="small faint">${esc(cust(o.customer).phone)}</div>` }, { label: 'İş', render: (o) => esc(baslik(o)) }, { label: 'Teslim', render: (o) => esc(dueText(o)) }, { label: 'Durum', render: (o) => pill(o) + (gec(o) ? ' ' + badge('Gecikti', 'err') : '') }, { label: 'Tutar', cls: 'right', render: (o) => money(H.toplam(o)) }, { label: 'Kalan', cls: 'right', render: (o) => money(H.kalan(o)) }], actions: [{ icon: 'eye', act: 'v', title: 'Aç' }], foot: `${r.length} kayıt` }) + (r.length > max ? `<div class="center pad"><button class="btn" id="more">${r.length - max} kayıt daha göster</button></div>` : ''); const m = $('#more', el); if (m) m.onclick = () => { max += LIST_MAX; draw(); }; };
      $('#q', el).oninput = (e) => { q = e.target.value; max = LIST_MAX; draw(); };
      on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; max = LIST_MAX; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
      on(el, 'click', '[data-act=v]', (e, b) => app.go('siparis', b.dataset.id));
      $('#ni', el).onclick = () => orderForm(app);
      $('#ex', el).onclick = () => NS.csv(`${C.id}-kayitlari`, rows(), [{ key: 'no', label: 'No' }, { label: 'Müşteri', value: (o) => cust(o.customer).name }, { label: 'Telefon', value: (o) => cust(o.customer).phone }, { label: 'İş', value: baslik }, { label: 'Teslim', value: dueText }, { label: 'Durum', value: (o) => ST[o.status].name }, { label: 'Tutar', value: H.toplam }, { label: 'Kalan', value: H.kalan }]);
      draw();
    }

    // ---------- Teslim takvimi ve dağıtım ----------
    function takvimPage(el, p, app) {
      const gun = iso(new Date()); const Gs = Array.from({ length: 7 }, (_, i) => iso(addDays(new Date(gun + 'T12:00'), i))); const O = openO();
      const gecen = O.filter((o) => o.due && o.due < gun).sort(H.sira);
      const blok = (t, L, tone) => `<div class="card mb"><div class="card-h"><h3>${esc(t)}</h3>${badge(L.length, tone)}</div>${table({ rows: L.slice(0, 100), foot: L.length > 100 ? `${L.length} işin ilk 100 tanesi` : '', empty: 'Teslim yok', columns: [{ label: 'Saat', render: (o) => esc(o.dueTime || '-') }, { label: 'No', render: (o) => `<a href="#/siparis/${o.id}"><b>${esc(o.no)}</b></a>` }, { label: 'İş', render: (o) => esc(baslik(o)) }, { label: 'Müşteri', render: (o) => esc(cust(o.customer).name) }, { label: 'Teslim', render: (o) => (o.mode === 'adres' ? 'Adrese' : 'Mağazadan') }, { label: 'Durum', render: pill }] })}</div>`;
      el.innerHTML = pageHead('Teslim Takvimi', 'Önümüzdeki 7 günün teslimleri, saate göre sıralı') + (gecen.length ? blok('Tarihi geçen', gecen, 'err') : '') + Gs.map((g, i) => blok(i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : NS.dateLong(g), O.filter((o) => o.due === g).sort(H.sira), i === 0 ? 'warn' : '')).join('');
    }
    function dagitimPage(el, p, app) {
      const me = NS.currentUser && NS.currentUser.role === 'kurye' ? NS.currentUser.courier || '' : ''; let kf = me;
      const draw = () => { const O = openO().filter((o) => (o.mode === 'adres' && (o.status === 'hazir' || (C.dagitimDurum || []).includes(o.status))) || (C.pickupStatus && o.status === C.pickupStatus)).filter((o) => !kf || o.courier === kf).sort(H.sira);
        const kurye = db.all('staff', (s) => s.kurye);
        el.innerHTML = pageHead('Dağıtım', 'Alınacak ve teslim edilecek adresler, teslim saatine göre', me ? '' : `<select class="input" id="kf" aria-label="Kurye" style="max-width:200px"><option value="">Tüm kuryeler</option>${kurye.map((s) => `<option value="${s.id}" ${s.id === kf ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`) +
          (O.length ? `<div class="grid g2">${O.slice(0, 100).map((o) => { const c = cust(o.customer); const al = o.status === C.pickupStatus; const adr = o.address || c.address || ''; const tel = o.recipientPhone || c.phone; return `<div class="card pad"><div class="row between nw"><b>${esc(o.no)}</b>${badge(al ? 'Alınacak' : 'Teslim edilecek', al ? 'info' : 'ok')}</div><div class="mt"><b>${esc(o.recipient || c.name)}</b></div><div class="small"><a target="_blank" rel="noopener" href="${haritaLink(adr)}">${esc(adr || 'Adres yok')}</a></div><div class="small faint mt">${esc(baslik(o))} · ${esc(dueText(o))}${H.kalan(o) > 0 ? ' · tahsil: ' + money(H.kalan(o)) : ''}</div>${o.cardNote ? `<div class="small mt">Kart: ${esc(o.cardNote)}</div>` : ''}<div class="row mt"><a class="btn sm" href="tel:${esc(tel)}">${icon('phone')} Ara</a><select class="input sm" data-kurye="${o.id}" aria-label="Kurye ata" style="max-width:150px"><option value="">Kurye seç</option>${kurye.map((s) => `<option value="${s.id}" ${s.id === o.courier ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select><span class="grow"></span><button class="btn sm primary" data-d="${o.id}">${al ? 'Teslim aldım' : 'Teslim ettim'}</button></div></div>`; }).join('')}</div>` : `<div class="card"><div class="empty">${icon('truck')}<div>Bekleyen adres yok</div></div></div>`);
        const k = $('#kf', el); if (k) k.onchange = (e) => { kf = e.target.value; draw(); }; };
      on(el, 'change', '[data-kurye]', (e, s) => { const o = db.get('orders', s.dataset.kurye); o.courier = s.value; addLog(o, o.status, `Kurye: ${staff(s.value).name || 'atanmadı'}`); db.save(); toast('Kurye atandı', 'ok'); });
      on(el, 'click', '[data-d]', async (e, b) => { const o = db.get('orders', b.dataset.d); if (o.status === C.pickupStatus) { setStatus(o, FLOW[0].id, 'Adresten teslim alındı', app); return draw(); } await teslimEt(o, { refresh: draw, go: app.go }); });
      draw();
    }

    // ---------- Özet ----------
    function dashboard(el, p, app) {
      const O = openO(); const done = orders((o) => o.status === 'teslim' && o.delivered); const d30 = addDays(new Date(), -30).toISOString();
      const rev = sum(done.filter((o) => o.delivered > d30), H.toplam); const alacak = sum(orders((o) => o.status !== 'iptal' && H.kalan(o) > 0), H.kalan);
      const ser = NS.dailySeries(done.map((o) => ({ ...o, _d: o.delivered })), 30, '_d', H.toplam);
      const bekleyen = O.filter((o) => o.status === 'hazir' && hazirGun(o) >= WAIT).sort((a, b) => hazirGun(b) - hazirGun(a)); const geciken = O.filter(gec).sort(H.sira);
      const rv = orders((o) => o.review); const puan = rv.length ? sum(rv, (o) => o.review.stars) / rv.length : 0;
      el.innerHTML = pageHead('Özet', NS.dateLong(new Date()), `<button class="btn primary" id="ni">${icon('plus')} Yeni ${esc(word)}</button>`) + `
        <div class="grid g4 mb">${kpi('Açık iş', O.length, 'list')}${kpi('30 gün ciro', money(rev), 'trend', 'ok')}${kpi('Tahsil edilecek', money(alacak), 'wallet', 'warn')}${kpi('Müşteri puanı', puan ? puan.toFixed(1) + ' / 5' : '-', 'star', 'info')}</div>
        <div class="card mb"><div class="card-h"><h3>Günlük teslim cirosu</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: 3 })}</div></div>
        ${C.dash ? C.dash(ctx) : ''}
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>${icon('alert')} Geciken işler</h3></div>${table({ rows: geciken.slice(0, 12), empty: 'Geciken iş yok', columns: [{ label: 'No', render: (o) => `<a href="#/siparis/${o.id}"><b>${esc(o.no)}</b></a>` }, { label: 'İş', render: (o) => esc(baslik(o)) }, { label: 'Söz', render: (o) => esc(dueText(o)) }, { label: 'Durum', render: (o) => esc(ST[o.status].name) }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('bell')} Teslim alınmayanlar (${WAIT}+ gün)</h3></div>${table({ rows: bekleyen.slice(0, 12), empty: 'Bekleyen iş yok', columns: [{ label: 'No', render: (o) => `<a href="#/siparis/${o.id}"><b>${esc(o.no)}</b></a>` }, { label: 'Müşteri', render: (o) => esc(cust(o.customer).name) }, { label: 'Bekliyor', cls: 'right', render: (o) => badge(hazirGun(o) + ' gün', hazirGun(o) >= 30 ? 'err' : 'warn') }, { label: 'Hatırlatma', render: (o) => (o.remindedAt ? NS.date(o.remindedAt) : '-') }], actions: [{ icon: 'send', act: 'rem', title: 'Hatırlat' }] })}</div></div>`;
      $('#ni', el).onclick = () => orderForm(app);
      on(el, 'click', '[data-act=rem]', async (e, b) => { const o = db.get('orders', b.dataset.id); o.remindedAt = new Date().toISOString(); await tell(o, `${S().bizName}: ${o.no} numaralı ${word}iniz ${hazirGun(o)} gündür teslim almanızı bekliyor. ${S().bizPhone || ''}`, 'Teslim hatırlatması'); app.refresh(); });
      if (C.dashBind) C.dashBind(el, ctx);
    }

    // ---------- Müşteri, fiyat, personel, SMS, talep ----------
    const CF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'address', label: 'Adres', full: true }, { name: 'note', label: 'Not', full: true }, ...(C.customerFields || [])];
    function customersPage(el, p, app) {
      const stat = {}; orders().forEach((o) => { const s = stat[o.customer] || (stat[o.customer] = { n: 0, t: 0, k: 0 }); if (o.status === 'iptal') return; s.n++; s.t += H.toplam(o); s.k += Math.max(0, H.kalan(o)); });
      NS.crud(el, app, { col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: CF, sort: (a, b) => String(a.name).localeCompare(String(b.name), 'tr'), searchFields: (c) => [c.name, c.phone, c.address],
        beforeDelete: (c) => (stat[c.id] ? `${c.name} için ${stat[c.id].n} ${word} kaydı var, silinemez` : true),
        columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b>` }, { key: 'phone', label: 'Telefon' }, { label: WORD, cls: 'right', render: (c) => (stat[c.id] || {}).n || 0 }, { label: 'Harcama', cls: 'right', render: (c) => money((stat[c.id] || {}).t || 0) }, { label: 'Borç', cls: 'right', render: (c) => { const k = (stat[c.id] || {}).k || 0; return k ? badge(money(k), 'warn') : '-'; } }, ...(C.customerColumns ? C.customerColumns(ctx) : [])], extraActions: C.customerActions, onAction: C.customerAction ? (a, c, draw) => C.customerAction(a, c, draw, ctx) : undefined });
    }
    function servicesPage(el, p, app) {
      NS.crud(el, app, { col: 'services', title: C.fiyatBaslik || 'Fiyat Listesi', sub: 'Siparişte seçilen hazır ürün ve hizmetler', single: 'Kalem', addLabel: 'Yeni kalem', emptyIcon: 'tag', sort: (a, b) => String(a.cat || '').localeCompare(String(b.cat || ''), 'tr') || String(a.name).localeCompare(String(b.name), 'tr'), searchFields: (s) => [s.name, s.cat],
        fields: [{ name: 'name', label: 'Ad', required: true, full: true }, { name: 'cat', label: 'Kategori' }, { name: 'unit', label: 'Birim', type: 'select', options: C.units || ['adet', 'm²', 'kg', 'takım'] }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01', required: true }, ...(C.serviceFields || []), { name: 'days', label: 'Teslim süresi (gün)', type: 'number' }],
        columns: [{ key: 'name', label: 'Ad', render: (s) => `<b>${esc(s.name)}</b><div class="small faint">${esc(s.cat || '')}</div>` }, { key: 'unit', label: 'Birim' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (s) => (s.price ? money(s.price) : badge('Fiyat girin', 'warn')) }, ...(C.serviceColumns || [])] });
    }
    function staffPage(el, p, app) {
      NS.crud(el, app, { col: 'staff', title: C.staffBaslik || 'Personel', single: 'Personel', addLabel: 'Yeni personel', emptyIcon: 'user', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'skill', label: 'Görev' }, ...(C.delivery || C.pickup ? [{ name: 'kurye', label: 'Kurye / şoför', type: 'checkbox' }] : [])], columns: [{ key: 'name', label: 'Ad', render: (s) => `<b>${esc(s.name)}</b>` }, { key: 'skill', label: 'Görev' }, { key: 'phone', label: 'Telefon' }, { label: 'Açık iş', cls: 'right', render: (s) => openO().filter((o) => o.staff === s.id || o.courier === s.id).length }] });
    }
    function smsPage(el) {
      const R = db.all('sms').slice().reverse().slice(0, 500);
      el.innerHTML = pageHead('Müşteri Bildirimleri', 'Program müşteriye SMS’i yalnız Entegrasyonlar’dan sağlayıcı bağlandığında gerçekten gönderir. Bağlı değilse kayıt TEST görünür.') + `<div class="card">${table({ rows: R, empty: 'Henüz bildirim yok', emptyIcon: 'message', columns: [{ label: 'Zaman', render: (s) => NS.dt(s.at || s.created) }, { label: 'Alıcı', render: (s) => `${esc(s.name)}<div class="small faint">${esc(s.to)}</div>` }, { label: 'Mesaj', render: (s) => `<span class="small">${esc(s.text)}</span>` }, { label: 'Durum', render: (s) => (s.status === 'gönderildi' ? badge('Gönderildi', 'ok') : String(s.status || '').startsWith('TEST') ? badge('TEST: gönderilmedi', 'warn') : `<span class="small" style="color:var(--err)">${esc(s.status || 'Bilinmiyor')}</span>`) }] })}</div>`;
    }
    function taleplerPage(el, p, app) {
      const R = db.all('requests').slice().sort((a, b) => String(b.created).localeCompare(String(a.created)));
      el.innerHTML = pageHead('Gelen Talepler', 'Müşterinin takip sayfanızdan gönderdiği talepler. Siparişe çevirmeden hiçbir iş başlamaz.') + `<div class="card">${table({ rows: R, emptyIcon: 'message', empty: 'Henüz talep yok', columns: [{ label: 'Tarih', render: (r) => NS.dt(r.created) }, { label: 'Müşteri', render: (r) => `<b>${esc(r.name)}</b><div class="small faint">${esc(r.phone)}</div>` }, { label: 'Talep', render: (r) => `${esc(r.note || '')}${r.address ? `<div class="small faint">${esc(r.address)}</div>` : ''}${r.date ? `<div class="small faint">İstenen: ${NS.date(r.date)} ${esc(r.time || '')}</div>` : ''}` }, { label: 'Durum', render: (r) => (r.status === 'siparis' ? badge('Siparişe çevrildi', 'ok') : r.status === 'red' ? badge('Reddedildi', 'err') : badge('Yeni', 'warn')) }], actions: [{ icon: 'plus', act: 'cv', title: 'Siparişe çevir', show: (r) => r.status === 'yeni' }, { icon: 'x', act: 'rd', title: 'Reddet', show: (r) => r.status === 'yeni' }] })}</div>`;
      on(el, 'click', '[data-act=cv]', (e, b) => { const r = db.get('requests', b.dataset.id); orderForm(app, null, { customer: { name: r.name, phone: r.phone, address: r.address }, mode: r.address ? 'adres' : 'magaza', address: r.address, due: r.date, dueTime: r.time, note: r.note, request: r.id, pickup: !!(C.pickup && r.address) }); });
      on(el, 'click', '[data-act=rd]', (e, b) => { const r = db.get('requests', b.dataset.id); r.status = 'red'; db.save(); app.refresh(); });
    }

    const ctx = { C, db, S, ST, H, fisDoc, cust, staff, orders, openO, acik, gec, dueText, baslik, addLog, setStatus, tell, orderForm, trackUrl, printFis, noteOf };
    if (NS.notify && NS.notify.define) NS.notify.define(C.id, [{ key: 'review', label: 'Müşteri puan verdi', desc: 'Takip sayfasından puan geldiğinde', sound: 'ding', count: (d) => d.all('orders').filter((o) => o.review).length, title: () => 'Müşteri puan verdi' }, ...(C.talep ? [{ key: 'talep', label: 'Yeni müşteri talebi', desc: 'Takip sayfasındaki formdan', sound: 'marimba', urgent: true, coll: 'requests', title: (r) => `Yeni talep: ${r.name || ''}`, href: '#/talepler' }] : []), ...(C.events || [])]);
    const ROLES = C.roles; const R = C.navRoles || {};
    const nav = (id, label, ic) => ({ id, label: ((C.menu || []).find((m) => m.id === id) || {}).label || label, icon: ic, ...(R[id] ? { roles: R[id] } : {}) });
    const bolum = C.bolum || 'İşler';
    const base = [{ sec: bolum }, nav('ozet', 'Özet', 'home'), nav('pano', C.panoBaslik || `${WORD} Panosu`, 'kanban'), nav('siparisler', C.listeBaslik || `${WORD} Kayıtları`, 'list'), nav('takvim', 'Teslim Takvimi', 'calendar'), ...(C.delivery || C.pickup ? [nav('dagitim', 'Dağıtım', 'truck')] : []), ...(C.talep ? [nav('talepler', 'Gelen Talepler', 'message')] : []), ...(C.nav || []), { sec: 'Yönetim' }, nav('musteriler', 'Müşteriler', 'users'), nav('fiyatlar', C.fiyatBaslik || 'Fiyat Listesi', 'tag'), nav('personel', C.staffBaslik || 'Personel', 'user'), nav('bildirimler', 'SMS Bildirimleri', 'message'), { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }];
    const set = [{ type: 'section', label: 'Sipariş ayarları' }, { name: 'defaultDays', label: 'Varsayılan teslim süresi (gün)', type: 'number' }, { name: 'slotCap', label: 'Aynı tarih ve saate en çok iş (boşsa sınır yok)', type: 'number' }, { name: 'smsHazir', label: 'İş hazır olunca müşteriye otomatik SMS', type: 'checkbox' }, { name: 'autoPrint', label: 'Kayıttan sonra fişi yazdır', type: 'checkbox' }, { name: 'vat', label: 'KDV oranı (%)', type: 'number', hint: 'e-Belge satırlarına yazılır. Hizmetinize uyan oranı muhasebecinize doğrulatın.' }, ...(C.settings || [])];
    const app = NS.shell({ id: C.id, integrations: C.integrations || ['sms', 'whatsapp', 'email', 'printer', 'backup'], name: C.ad, tagline: C.tagline, icon: C.icon, accent: C.accent, db, home: C.home || 'pano', auth: { roles: ROLES }, titles: { siparis: WORD },
      nav: base, routes: { ozet: dashboard, pano: boardPage, siparisler: listPage, siparis: detailPage, takvim: takvimPage, dagitim: dagitimPage, talepler: taleplerPage, musteriler: customersPage, fiyatlar: servicesPage, personel: staffPage, bildirimler: smsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: set, defaults: { smsHazir: true, autoPrint: true, ...(C.settingDefaults || {}) } }), ...(C.routes ? C.routes(ctx) : {}) } });
    return ctx;
  }
  return { kur, yeniKod };
})();
