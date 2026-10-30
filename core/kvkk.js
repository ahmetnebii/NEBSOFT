/* NEBSOFT kişisel veri araçları (klinik, eczane, veteriner): kişi bazında dışa aktarma, anonimleştirme, kart görüntüleme kaydı.
   Teknik araçtır: hangi verinin ne kadar saklanacağına işletme hukukçusuyla karar verir. Program verisi tarayıcıdadır, sunucu tarafı rol
   ayrımı değildir (bkz. docs/GUVENLIK-RAPORU.md). Anonimleştirme geri alınamaz; 48 saatlik sunucu geçmişi ve yedekler ayrıca süresi dolunca silinir. */
(function () {
  'use strict';
  // Hesap ve tutarlar kalır; kişiyi tanıtan serbest metin ve imza alanları temizlenir
  const FREE = /^(name|ad|soyad|phone|tel|tc|tckn|email|address|adres|birth|text|note|notes|desc|description|reason|msg|message|body|diagnosis|complaint|treatment|icd|allergy|meds|medication|anamnez|chronic|photo|img|image|file|signer)$/i;
  const SIGN = /sign|imza|consent|onam|kvkk|kps|enabiz/i;
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  // Kayıtta kişi kimliğini taşıyan alan ve kişiye bağlı alt kayıtlar (veterinerde sahip → hayvan → muayene)
  function related(data, plan, id) {
    const ids = { [plan.link]: new Set([id]) };
    (plan.sub || []).forEach((s) => { ids[s.as] = new Set((data[s.col] || []).filter((r) => r[s.link] === id).map((r) => r.id)); });
    return ids;
  }
  // Saf işlev (test edilir): yeni veri nesnesi ve özet döner
  function anonymizeData(data, plan, id) {
    const src = (data[plan.col] || []).find((r) => r.id === id); if (!src) return null;
    const keep = new Set(['id', 'no', 'created', 'updated', ...(plan.keep || [])]); const tag = 'Anonim-' + String(id).slice(-6);
    const secrets = uniq([src.name, src.phone, src.tc, src.email, src.address]).map(String).filter((s) => s.length >= 5);
    const ids = related(data, plan, id); let touched = 0;
    const rec = {}; Object.keys(src).forEach((k) => { if (keep.has(k)) rec[k] = src[k]; });
    Object.assign(rec, { name: tag, anonAt: new Date().toISOString(), passive: true });
    const out = { ...data, [plan.col]: data[plan.col].map((r) => (r.id === id ? rec : r)) };
    Object.keys(out).forEach((col) => {
      if (col === plan.col || col === 'users' || col.startsWith('_') || !Array.isArray(out[col])) return;
      const subOf = (plan.sub || []).find((s) => s.col === col);
      out[col] = out[col].map((r) => {
        if (!r || typeof r !== 'object') return r;
        const own = (subOf && ids[subOf.as].has(r.id)) || Object.keys(ids).some((k) => ids[k].has(r[k]));
        if (!own) return r; touched++; const n = {};
        Object.entries(r).forEach(([k, v]) => { if (SIGN.test(k)) return; n[k] = typeof v === 'string' && FREE.test(k) ? '' : Array.isArray(v) && FREE.test(k) ? [] : v; });
        if (subOf && 'name' in n) n.name = tag;
        return n;
      });
    });
    // Kalan izler (SMS metni, işlem geçmişi): ad, telefon ve kimlik no metin içinde de geçebilir
    let s = JSON.stringify(out); secrets.forEach((x) => { s = s.split(JSON.stringify(x).slice(1, -1)).join(tag); });
    return { data: JSON.parse(s), touched, tag };
  }
  const allowed = (app) => { if (app.can('admin')) return true; NS.toast('Bu işlem yalnızca yöneticiye açıktır', 'err'); return false; };
  // Bir kişinin tüm kayıtları tek dosyada (ilgili kişinin başvurusu için)
  function collect(data, plan, id) {
    const ids = related(data, plan, id); const out = { kisi: (data[plan.col] || []).find((r) => r.id === id) || null };
    Object.keys(data).forEach((col) => {
      if (col === plan.col || col === 'users' || col.startsWith('_') || !Array.isArray(data[col])) return;
      const subOf = (plan.sub || []).find((s) => s.col === col);
      const rows = data[col].filter((r) => r && ((subOf && ids[subOf.as].has(r.id)) || Object.keys(ids).some((k) => ids[k].has(r[k])))); if (rows.length) out[col] = rows;
    });
    return out;
  }
  function exportPerson(app, plan, rec) {
    if (!allowed(app)) return; const body = JSON.stringify({ tarih: new Date().toISOString(), ...collect(app.db.data, plan, rec.id) }, null, 1);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.download = `kisisel-veri-${rec.no || rec.id}.json`; a.click();
    app.db.log('Kişisel veri dışa aktarıldı', `kayıt ${rec.no || rec.id}`); app.db.save(); NS.toast('Dosya indirildi. İşlem geçmişine yazıldı.', 'ok');
  }
  async function anonymize(app, plan, rec) {
    if (!allowed(app)) return false;
    const v = await NS.formModal({ title: 'Kişisel veriyi anonimleştir', fields: [{ type: 'section', label: 'Ad, telefon, kimlik no, adres, notlar ve imzalar silinir; tutar ve tarihler kalır. Geri alınamaz. Saklama yükümlülüğünüz olan kayıtlar için önce hukukçunuza danışın. Sunucu yedeklerinden süresi dolunca silinir.' }, { name: 'ok', label: 'Onay için ANONİM yazın', required: true }] });
    if (!v) return false; if (String(v.ok).trim().toLocaleUpperCase('tr') !== 'ANONİM') { NS.toast('Onay metni eşleşmedi, işlem yapılmadı', 'err'); return false; }
    const r = anonymizeData(app.db.data, plan, rec.id); if (!r) return false;
    app.db.data = r.data; app.db.log('Kişisel veri anonimleştirildi', `${r.tag} · ${r.touched} bağlı kayıt`); app.db.save(); NS.toast('Anonimleştirildi', 'ok'); return true;
  }
  // Sağlık bilgisi içeren kartın açılması: kim, ne zaman (aynı kayıt için 10 dakikada bir yazılır)
  const seen = new Map();
  function viewed(db, what, rec) {
    const u = NS.currentUser ? NS.currentUser.id : '-'; const k = `${u}:${what}:${rec.id}`; if (Date.now() - (seen.get(k) || 0) < 600e3) return; seen.set(k, Date.now());
    db.log('Kart görüntülendi', `${what} ${rec.no || rec.id}`); db.save();
  }
  NS.kvkk = { anonymizeData, collect, exportPerson, anonymize, viewed };
})();
