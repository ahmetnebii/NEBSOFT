/* NEBSOFT Ön Muhasebe — Tahsilat takibi ve vade hatırlatmaları
   Vadesi yaklaşan, bugün dolan ve geciken satış faturaları tek listede; cariye SMS / WhatsApp / e-posta ile hatırlatma.
   Otomatik gönderim yalnızca Entegrasyonlar'da gerçek gönderim yapan bir kanal ayarlıysa çalışır (SMS sağlayıcısı,
   WhatsApp Cloud API, EmailJS / e-posta API'si). Bağlantı (wa.me) ve mailto kanalları personel onayı ister, otomatik çalışmaz.
   Her hatırlatma faturaya kaydedilir; aynı aşama için ikinci kez gönderilmez. */
window.MUHHATIRLAT = (function () {
  'use strict';
  const { esc, $, on, icon, money, toast, confirm, table, badge, pageHead, today, daysBetween } = NS;
  let X; // { db, cari, invTotals, paidOf, invStatus, isSale, S }
  const STAGES = [['once', 'Vadesi yaklaşıyor'], ['gun', 'Bugün vadesi doluyor'], ['gec1', 'Vadesi geçti'], ['gec2', 'Vadesi geçti (2. hatırlatma)'], ['gec3', 'Vadesi geçti (3. hatırlatma)']];
  const cfgOf = () => ({ remindBefore: 3, remindAfter: 7, remindAuto: false, remindChannel: 'sms', ...X.S() });
  const remain = (i) => Math.round((X.invTotals(i).tl - X.paidOf(i)) * 100) / 100;
  // Faturanın şu anki hatırlatma aşaması (yoksa null): vadeden n gün önce, vade günü, sonra her "remindAfter" günde bir (en çok 3 kez)
  function stageOf(i, c = cfgOf()) {
    if (!X.isSale(i) || X.invStatus(i) === 'odendi' || remain(i) <= 0 || !i.due) return null;
    const t = today(); const d = daysBetween(t, i.due); // pozitif: vadeye kalan gün
    if (i.due > t) return d <= Number(c.remindBefore || 0) ? 'once' : null;
    if (i.due === t) return 'gun';
    const late = daysBetween(i.due, t); const n = Math.floor(late / Math.max(1, Number(c.remindAfter) || 7)); return ['gec1', 'gec2', 'gec3'][Math.min(2, n)] || null;
  }
  const sent = (i, st) => (i.reminders || []).some((r) => r.stage === st && r.ok);
  function text(i) {
    const c = X.cari(i.cari); const s = X.S(); const r = remain(i); const late = i.due < today();
    return `Sayın ${c.name}, ${i.no} numaralı ${NS.date(i.date)} tarihli faturanızın ${money(r)} tutarındaki ödemesinin vadesi ${late ? NS.date(i.due) + ' tarihinde dolmuştur' : NS.date(i.due) + ' tarihindedir'}.${s.iban ? ' IBAN: ' + s.iban + '.' : ''} Ödediyseniz bu mesajı dikkate almayınız. ${s.bizName || ''}`;
  }
  // Otomatik gönderebilen (insan onayı gerektirmeyen) kanallar
  const autoChannels = () => { const I = NS.integ; if (!I) return []; const out = []; const sm = I.cfg('sms'); if (sm.enabled && sm.provider && sm.provider !== 'sim') out.push('sms'); if (I.cfg('whatsapp').mode === 'cloud') out.push('whatsapp'); if (['emailjs', 'http'].includes(I.cfg('email').mode)) out.push('email'); return out; };
  async function send(i, ch, st) {
    const c = X.cari(i.cari); const I = NS.integ; let r = { ok: false, error: 'Kanal yok' };
    if (ch === 'sms') { if (!c.phone) return { ok: false, error: 'Carinin telefonu yok' }; r = await I.sms(c.phone, text(i), { silent: true }); }
    else if (ch === 'whatsapp') { if (!c.phone) return { ok: false, error: 'Carinin telefonu yok' }; r = (await I.whatsapp(c.phone, text(i))) || { ok: true }; }
    else if (ch === 'email') { if (!c.email) return { ok: false, error: 'Carinin e-postası yok' }; r = (await I.email(c.email, `${X.S().bizName || ''} — ${i.no} ödeme hatırlatması`, text(i))) || { ok: true }; }
    (i.reminders = i.reminders || []).push({ at: new Date().toISOString(), stage: st || stageOf(i) || 'elle', channel: ch, ok: !!r.ok, simulated: !!r.simulated, error: r.ok ? '' : r.error || '', user: NS.currentUser ? NS.currentUser.name : 'Otomatik' });
    X.db.save(); X.db.log('Ödeme hatırlatması', `${i.no} · ${c.name} · ${ch}${r.ok ? '' : ' · gönderilemedi'}`);
    return r;
  }
  // Otomatik tur: ayar açıksa ve otomatik kanal varsa, her faturaya her aşamada en çok bir hatırlatma
  async function auto() {
    const c = cfgOf(); if (!c.remindAuto) return 0; const ch = autoChannels(); const use = ch.includes(c.remindChannel) ? c.remindChannel : ch[0]; if (!use) return 0;
    let n = 0; for (const i of X.db.all('invoices')) { const st = stageOf(i, c); if (st && !sent(i, st)) { const r = await send(i, use, st); if (r.ok) n++; } }
    if (n) toast(`${n} ödeme hatırlatması gönderildi`, 'ok'); return n;
  }
  function page(el, p, app) {
    let f = p || 'hepsi';
    const draw = () => {
      const c = cfgOf(); const all = X.db.all('invoices', (i) => X.isSale(i) && X.invStatus(i) !== 'odendi' && remain(i) > 0);
      const rows = all.map((i) => ({ i, st: stageOf(i, c), id: i.id })).filter((x) => f === 'hepsi' || (f === 'gec' ? x.i.due < today() : f === 'yak' ? x.st === 'once' || x.st === 'gun' : x.st && !sent(x.i, x.st))).sort((a, b) => String(a.i.due).localeCompare(String(b.i.due)));
      const ch = autoChannels(); const late = all.filter((i) => i.due < today());
      el.innerHTML = pageHead('Tahsilat takibi', 'Vadesi yaklaşan ve geciken alacaklar, ödeme hatırlatmaları', `<button class="btn primary" id="ha" ${ch.length ? '' : 'disabled title="Otomatik gönderen kanal yok"'}>${icon('send')} Bekleyenlere hatırlatma gönder</button>`) + `
        <div class="grid g4 mb">${NS.kpi('Açık alacak', money(all.reduce((s, i) => s + remain(i), 0)), 'wallet')}${NS.kpi('Vadesi geçmiş', money(late.reduce((s, i) => s + remain(i), 0)), 'alert', 'err', `<div class="small faint">${late.length} fatura</div>`)}${NS.kpi('7 gün içinde', money(all.filter((i) => i.due >= today() && daysBetween(today(), i.due) <= 7).reduce((s, i) => s + remain(i), 0)), 'calendar', 'warn')}${NS.kpi('Hatırlatma bekleyen', rows.filter((x) => x.st && !sent(x.i, x.st)).length, 'bell', 'info')}</div>
        ${ch.length ? `<div class="small muted mb">Otomatik kanallar: <b>${ch.map((x) => ({ sms: 'SMS', whatsapp: 'WhatsApp Cloud', email: 'e-posta' })[x]).join(', ')}</b> · Otomatik gönderim ${c.remindAuto ? `<b>açık</b> (vadeden ${c.remindBefore} gün önce, vade günü, sonra ${c.remindAfter} günde bir)` : '<b>kapalı</b> — Ayarlar > Tahsilat hatırlatmaları'}</div>` : `<div class="card pad mb small" style="border-color:var(--warn)">Otomatik gönderen kanal ayarlı değil: SMS sağlayıcısı, WhatsApp Cloud API veya e-posta API'si bağlayın (Entegrasyonlar). O zamana kadar her satırdaki WhatsApp / e-posta düğmesiyle personel gönderir.</div>`}
        <div class="card"><div class="card-h"><div class="seg">${[['hepsi', 'Tümü'], ['bek', 'Hatırlatma bekleyen'], ['yak', 'Vadesi yaklaşan'], ['gec', 'Vadesi geçen']].map(([k, l]) => `<button data-f="${k}" class="${k === f ? 'active' : ''}">${l}</button>`).join('')}</div></div>${table({ rows: rows.slice(0, 300), foot: rows.length > 300 ? `İlk 300 / ${rows.length} gösteriliyor (vadesi en yakın) — filtre ile daraltın` : '', empty: 'Bu filtrede alacak yok', emptyIcon: 'check', columns: [
          { label: 'Fatura', render: (x) => `<b>${esc(x.i.no)}</b><div class="small faint">${esc(X.cari(x.i.cari).name)}</div>` },
          { label: 'Vade', render: (x) => `${NS.date(x.i.due)}<div class="small" style="color:${x.i.due < today() ? 'var(--err)' : 'var(--muted)'}">${x.i.due < today() ? daysBetween(x.i.due, today()) + ' gün gecikti' : x.i.due === today() ? 'bugün' : daysBetween(today(), x.i.due) + ' gün kaldı'}</div>` },
          { label: 'Kalan', cls: 'right', render: (x) => `<b>${money(remain(x.i))}</b>` },
          { label: 'Aşama', render: (x) => (x.st ? badge(STAGES.find((s) => s[0] === x.st)[1], x.st.startsWith('gec') ? 'err' : 'warn') + (sent(x.i, x.st) ? ' ' + badge('gönderildi', 'ok') : '') : '<span class="faint">—</span>') },
          { label: 'Son hatırlatma', render: (x) => { const r = (x.i.reminders || []).slice(-1)[0]; return r ? `<span class="small">${NS.dt(r.at)} · ${esc(r.channel)}${r.ok ? (r.simulated ? ' (test)' : '') : ' · <span style="color:var(--err)">' + esc(r.error || 'hata') + '</span>'}</span>` : '<span class="faint small">yok</span>'; } }],
          actions: [{ icon: 'message', act: 'h-sms', title: 'SMS ile hatırlat' }, { icon: 'phone', act: 'h-wa', title: 'WhatsApp ile hatırlat' }, { icon: 'mail', act: 'h-mail', title: 'E-posta ile hatırlat' }] })}</div>`;
      $('#ha', el).onclick = async () => { const c2 = cfgOf(); const chs = autoChannels(); const use = chs.includes(c2.remindChannel) ? c2.remindChannel : chs[0]; const list = rows.filter((x) => x.st && !sent(x.i, x.st)); if (!list.length) return toast('Hatırlatma bekleyen fatura yok'); if (!(await confirm(`${list.length} cariye ${use} ile ödeme hatırlatması gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return; let ok = 0; for (const x of list) { const r = await send(x.i, use, x.st); if (r.ok) ok++; } toast(`${ok} / ${list.length} hatırlatma gönderildi`, ok === list.length ? 'ok' : 'warn'); draw(); };
    };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; draw(); });
    on(el, 'click', '[data-act^="h-"]', async (e, b) => { const i = X.db.get('invoices', b.dataset.id); const ch = { 'h-sms': 'sms', 'h-wa': 'whatsapp', 'h-mail': 'email' }[b.dataset.act]; const r = await send(i, ch, stageOf(i)); toast(r.ok ? (r.simulated ? 'Test modunda: gönderilmedi, kayda geçti' : 'Hatırlatma gönderildi') : 'Gönderilemedi: ' + (r.error || ''), r.ok ? (r.simulated ? 'warn' : 'ok') : 'err'); draw(); });
    draw();
  }
  return { init(ctx) { X = ctx; }, page, auto, stageOf, text, autoChannels };
})();
