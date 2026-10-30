// NEBSOFT e-posta: bağımlılıksız SMTP istemcisi (465 SSL / 587 STARTTLS), şık HTML şablon ve işlem e-postaları.
//  • Ayar yönetim panelinden girilir: gönderen adres + uygulama şifresi (Gmail, Outlook, Yandex vb.). Şifre AES-256-GCM ile saklanır.
//  • Şablon: tablo tabanlı, satır içi stilli (Gmail / Outlook / Apple Mail uyumlu), koyu mod dostu, düz metin yedeği.
//  • Doğrulama kodları: kayıt ve giriş (6 haneli, 10 dk, 5 deneme), yalnızca özet saklanır.
const net = require('net'); const tls = require('tls'); const crypto = require('crypto');
const db = require('./db'); const cfg = require('./config');

const PRESETS = { gmail: { host: 'smtp.gmail.com', port: 465 }, outlook: { host: 'smtp.office365.com', port: 587 }, yandex: { host: 'smtp.yandex.com', port: 465 }, yaani: { host: 'smtp.yaani.com', port: 465 }, custom: {} };
const J = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
async function settings() { const r = await db.one("SELECT v FROM settings WHERE k='mail'"); return r ? J(r.v, {}) : {}; }
async function getConfig() { const s = await settings(); let pass = ''; try { pass = s.pass ? cfg.decrypt(s.pass).p : ''; } catch (e) { pass = ''; } return { ...s, pass }; }
async function saveConfig(b) {
  const cur = await settings(); const pre = PRESETS[b.provider] || {};
  const out = { provider: b.provider || 'custom', host: String(b.host || pre.host || '').trim().slice(0, 120), port: Number(b.port || pre.port) || 465, user: String(b.user || '').trim().slice(0, 190), from: String(b.from || b.user || '').trim().slice(0, 190), fromName: String(b.fromName || 'NEBSOFT').slice(0, 80), replyTo: String(b.replyTo || '').trim().slice(0, 190), enabled: b.enabled !== false, twoFactorLogin: !!b.twoFactorLogin, verifySignup: b.verifySignup !== false, pass: cur.pass || '' };
  if (b.pass) out.pass = cfg.encrypt({ p: String(b.pass).replace(/\s+/g, '') }); // Gmail uygulama şifresi boşluklu gösterilir
  await db.q("INSERT INTO settings (k, v) VALUES ('mail', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify(out)]);
  return { ...out, pass: !!out.pass };
}
async function ready() { if (!db.ready()) return false; const c = await getConfig(); return !!(c.enabled && c.host && c.user && c.pass); }

// ---------- SMTP ----------
const b64 = (s) => Buffer.from(String(s), 'utf8').toString('base64');
const encHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
function smtpSend(c, { to, subject, html, text, replyTo, unsub }) {
  return new Promise((resolve, reject) => {
    const implicit = Number(c.port) === 465 && c.tls !== false; // tls:false yalnızca yerel test/röle sunucusu için
    let sock = implicit ? tls.connect({ host: c.host, port: c.port, servername: c.host }) : net.connect({ host: c.host, port: c.port });
    sock.setTimeout(20000, () => { sock.destroy(); reject(new Error('E-posta sunucusu yanıt vermedi (zaman aşımı)')); });
    let buf = ''; let step = 0; let upgraded = implicit;
    const boundary = 'nb' + crypto.randomBytes(8).toString('hex'); const id = `<${crypto.randomBytes(12).toString('hex')}@${String(c.from).split('@')[1] || 'nebsoft'}>`;
    const msg = [`From: ${encHeader(c.fromName || 'NEBSOFT')} <${c.from}>`, `To: <${to}>`, ...(replyTo || c.replyTo ? [`Reply-To: <${replyTo || c.replyTo}>`] : []), `Subject: ${encHeader(subject)}`, `Date: ${new Date().toUTCString()}`, `Message-ID: ${id}`, ...(unsub ? [`List-Unsubscribe: <${unsub}>`] : []), 'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`, '',
      `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(text || '').replace(/.{76}/g, '$&\r\n'),
      `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(html).replace(/.{76}/g, '$&\r\n'), `--${boundary}--`, ''].join('\r\n');
    const send = (l) => sock.write(l + '\r\n');
    const fail = (m) => { try { send('QUIT'); } catch (e) { /* yok */ } sock.destroy(); reject(new Error(m)); };
    const onLine = (code, line) => {
      const ok = (exp) => { if (!exp.includes(code)) { fail(code === 535 || code === 534 ? 'E-posta girişi reddedildi — adres veya uygulama şifresi hatalı (Gmail için 2 adımlı doğrulama + uygulama şifresi gerekir)' : `E-posta sunucusu hatası: ${line}`); return false; } return true; };
      switch (step) {
        case 0: if (ok([220])) { step = 1; send('EHLO nebsoft'); } break;
        case 1: if (ok([250])) { if (!upgraded && c.tls !== false) { step = 2; send('STARTTLS'); } else { step = 3; send('AUTH LOGIN'); } } break;
        case 2: if (ok([220])) { sock.removeAllListeners('data'); sock = tls.connect({ socket: sock, servername: c.host }, () => { upgraded = true; step = 1; send('EHLO nebsoft'); }); sock.on('data', onData); sock.on('error', (e) => reject(e)); } break;
        case 3: if (ok([334])) { step = 4; send(b64(c.user)); } break;
        case 4: if (ok([334])) { step = 5; send(b64(c.pass)); } break;
        case 5: if (ok([235])) { step = 6; send(`MAIL FROM:<${c.from}>`); } break;
        case 6: if (ok([250])) { step = 7; send(`RCPT TO:<${to}>`); } break;
        case 7: if (ok([250, 251])) { step = 8; send('DATA'); } break;
        case 8: if (ok([354])) { step = 9; sock.write(msg.replace(/\r\n\./g, '\r\n..') + '\r\n.\r\n'); } break;
        case 9: if (ok([250])) { step = 10; send('QUIT'); resolve({ ok: true, id }); } break;
        default: break;
      }
    };
    // Çok satırlı yanıtlarda (250-…) yalnızca son satır işlenir
    function onData(d) { buf += d.toString('utf8'); let i; while ((i = buf.indexOf('\r\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 2); const m = /^(\d{3})([ -])/.exec(line); if (m && m[2] === ' ') onLine(Number(m[1]), line); } }
    sock.on('data', onData); sock.on('error', (e) => reject(new Error('E-posta sunucusuna bağlanılamadı: ' + e.message)));
  });
}

// ---------- Şablon ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// blocks: [{ type:'p'|'code'|'button'|'kv'|'note'|'list', ... }]
function render({ brand = 'NEBSOFT', site = {}, preheader = '', title, intro, blocks = [], footer = '', unsub = '' }) {
  const B = '#4f46e5'; const url = site.siteUrl || '';
  const part = (b) => {
    if (b.type === 'code') return `<tr><td style="padding:8px 40px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#f4f4ff;border:1px solid #e0e0ff;border-radius:14px;padding:22px 10px"><div style="font:600 12px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6b6f8a;margin-bottom:12px">${esc(b.label || 'Doğrulama kodu')}</div><div style="font:800 38px/1 'SF Mono',Consolas,Menlo,monospace;letter-spacing:.32em;color:#111327;padding-left:.32em">${esc(b.code)}</div><div style="font:13px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6b6f8a;margin-top:12px">${esc(b.hint || '10 dakika geçerlidir')}</div></td></tr></table></td></tr>`;
    if (b.type === 'button') return `<tr><td align="center" style="padding:18px 40px 6px"><a href="${esc(b.url)}" style="display:inline-block;background:${B};background-image:linear-gradient(135deg,#6366f1,#4f46e5 50%,#7c3aed);color:#ffffff;text-decoration:none;font:700 15px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:16px 30px;border-radius:12px;box-shadow:0 10px 24px -10px rgba(79,70,229,.8)">${esc(b.label)} &rarr;</a></td></tr>`;
    if (b.type === 'kv') return `<tr><td style="padding:10px 40px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececf3;border-radius:12px">${b.rows.map(([k, v], i) => `<tr><td style="padding:11px 16px;font:14px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6b6f8a;${i ? 'border-top:1px solid #ececf3;' : ''}">${esc(k)}</td><td align="right" style="padding:11px 16px;font:600 14px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111327;${i ? 'border-top:1px solid #ececf3;' : ''}">${esc(v)}</td></tr>`).join('')}</table></td></tr>`;
    if (b.type === 'note') return `<tr><td style="padding:10px 40px"><div style="background:${b.tone === 'warn' ? '#fff7e6' : '#f0fdf4'};border-radius:12px;padding:14px 16px;font:14px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${b.tone === 'warn' ? '#92400e' : '#166534'}">${esc(b.text)}</div></td></tr>`;
    if (b.type === 'list') return `<tr><td style="padding:6px 40px">${b.items.map((x) => `<div style="font:15px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#30344d;padding:3px 0">&#10003;&nbsp; ${esc(x)}</div>`).join('')}</td></tr>`;
    if (b.type === 'html') return `<tr><td style="padding:8px 40px;font:15px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#30344d">${b.html}</td></tr>`;
    return `<tr><td style="padding:8px 40px;font:15px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#30344d">${esc(b.text).replace(/\n/g, '<br>')}</td></tr>`;
  };
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(title)}</title>
<style>@media (max-width:620px){.wrap{width:100%!important}.px{padding-left:22px!important;padding-right:22px!important}}@media (prefers-color-scheme:dark){.card{background:#16172a!important}.t{color:#f2f2fa!important}}</style></head>
<body style="margin:0;padding:0;background:#f1f1f7;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader || intro || title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f1f7"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px">
 <tr><td style="border-radius:20px 20px 0 0;background:#0b0b1a;background-image:radial-gradient(120% 140% at 0% 0%,#4f46e5 0%,rgba(79,70,229,0) 55%),radial-gradient(120% 140% at 100% 0%,#06b6d4 0%,rgba(6,182,212,0) 50%);padding:30px 40px 34px" class="px">
  <table role="presentation" width="100%"><tr><td style="font:400 20px/1 'Michroma',-apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.14em;color:#ffffff">${url ? `<img src="${esc(url.replace(/\/$/, ''))}/assets/icons/icon-128.png" width="44" height="44" alt="" style="vertical-align:middle;border-radius:11px;margin-right:12px;border:0">` : ''}${brand.toUpperCase() === 'NEBSOFT' ? 'NEB<span style="color:#a5b4fc">SOFT</span>' : esc(brand)}</td></tr>
  <tr><td style="padding-top:22px;font:800 26px/1.2 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#ffffff;letter-spacing:-.02em">${esc(title)}</td></tr>${intro ? `<tr><td style="padding-top:10px;font:15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#c9cbe4">${esc(intro)}</td></tr>` : ''}</table></td></tr>
 <tr><td class="card" style="background:#ffffff;border-radius:0 0 20px 20px;padding:18px 0 30px;box-shadow:0 30px 60px -30px rgba(17,19,39,.25)"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${blocks.map(part).join('')}</table></td></tr>
 <tr><td style="padding:22px 30px 0;text-align:center;font:12px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#8a8ca8">${footer ? esc(footer) + '<br>' : ''}${esc(site.siteName || brand)} · ${esc(site.phone || '')} · ${esc(site.email || '')}${url ? `<br><a href="${esc(url)}" style="color:#6366f1;text-decoration:none">${esc(url.replace(/^https?:\/\//, ''))}</a>` : ''}<br><span style="color:#b0b2c8">Bu e-posta hesabınızla ilgili bir işlem nedeniyle gönderildi.</span>${unsub ? `<br><a href="${esc(unsub)}" style="color:#6366f1">Bu e-postaları almak istemiyorum</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, intro, ...blocks.map((b) => (b.type === 'code' ? `${b.label || 'Kod'}: ${b.code}` : b.type === 'button' ? `${b.label}: ${b.url}` : b.type === 'kv' ? b.rows.map(([k, v]) => `${k}: ${v}`).join('\n') : b.type === 'list' ? b.items.map((x) => '- ' + x).join('\n') : b.text || '')), footer, `${site.siteName || brand} ${site.phone || ''}`, unsub ? `E-postaları almak istemiyorsanız: ${unsub}` : ''].filter(Boolean).join('\n\n');
  return { html, text };
}

// ---------- Gönderim + kayıt ----------
async function send(to, subject, tpl, site) {
  const c = await getConfig();
  if (!(c.enabled && c.host && c.user && c.pass)) return { ok: false, skipped: true, error: 'E-posta ayarı yapılmadı' };
  const { html, text } = render({ ...tpl, site, title: tpl.title || subject });
  try { const r = await smtpSend(c, { to, subject, html, text, unsub: tpl.unsub }); await db.q('INSERT INTO mail_log (at, to_addr, subject, status, detail) VALUES (?,?,?,?,?)', [new Date(), to, subject.slice(0, 200), 'gönderildi', r.id]).catch(() => {}); return r; }
  catch (e) { await db.q('INSERT INTO mail_log (at, to_addr, subject, status, detail) VALUES (?,?,?,?,?)', [new Date(), to, subject.slice(0, 200), 'hata', e.message.slice(0, 250)]).catch(() => {}); return { ok: false, error: e.message }; }
}

// ---------- Doğrulama kodları ----------
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
async function issueCode(email, purpose, meta = {}) {
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0'); const ticket = crypto.randomBytes(18).toString('base64url');
  await db.q('DELETE FROM email_codes WHERE email=? AND purpose=?', [email, purpose]);
  await db.q('INSERT INTO email_codes (id, email, purpose, code_hash, meta, expires, attempts) VALUES (?,?,?,?,?,?,0)', [sha(ticket), email, purpose, sha(ticket + code), JSON.stringify(meta).slice(0, 2000), new Date(Date.now() + 10 * 60e3)]);
  return { code, ticket };
}
async function checkCode(ticket, code, purpose) {
  const r = await db.one('SELECT * FROM email_codes WHERE id=? AND purpose=?', [sha(String(ticket || '')), purpose]);
  if (!r || new Date(r.expires) < new Date()) return { ok: false, error: 'Kodun süresi doldu. Yeni kod isteyin.' };
  if (r.attempts >= 5) return { ok: false, error: 'Çok fazla hatalı deneme. Yeni kod isteyin.' };
  if (sha(String(ticket) + String(code || '').replace(/\D/g, '')) !== r.code_hash) { await db.q('UPDATE email_codes SET attempts=attempts+1 WHERE id=?', [r.id]); return { ok: false, error: `Kod hatalı. Kalan deneme: ${4 - r.attempts}` }; }
  await db.q('DELETE FROM email_codes WHERE id=?', [r.id]);
  return { ok: true, email: r.email, meta: J(r.meta, {}) };
}

module.exports = { PRESETS, settings, getConfig, saveConfig, ready, send, render, issueCode, checkCode, smtpSend };
