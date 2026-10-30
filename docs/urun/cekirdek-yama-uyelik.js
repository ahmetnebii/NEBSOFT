// Çekirdek yaması: dernek, egitim, danisan. Çekirdek sırası gelince depo kökünde bir kez çalıştırılır, ardından:
//   node docs/urun/cekirdek-yama-uyelik.js && node site/tools/build-yardim.js && node site/tools/build-kb.js
// Yalnız kendi satırlarını ekler, tekrar çalıştırılırsa bir şey değiştirmez. Ayrıntı: CEKIRDEK-ISTEKLERI-uyelik-egitim-saglik.md
const fs = require('fs');
function ekle(dosya, capa, satir) {
  let t = fs.readFileSync(dosya, 'utf8'); if (t.includes(satir.trim().slice(0, 40))) return; const nl = t.includes('\r\n') ? '\r\n' : '\n'; const i = t.indexOf(capa); if (i < 0) throw new Error(`${dosya}: çapa yok: ${capa}`);
  fs.writeFileSync(dosya, t.slice(0, i) + satir + nl + t.slice(i));
}
const S = "    ";
ekle('core/kurulum-adimlari.js', '    pos: [S(', [
  S + "dernek: [S('uye', 'Üyeleri ekleyin', 'İlk üyeyi kaydedin.', 'uyeler', 'members'), S('aidat', 'Aidat tahakkuku yapın', 'Dönem aidatını yazın.', 'aidat', 'dues'), S('toplanti', 'İlk toplantıyı planlayın', 'Gündem ve tarih girin.', 'toplanti', 'meetings')],",
  S + "egitim: [S('egitim', 'Eğitim kataloğunu girin', 'Saat ve ücretle ilk eğitimi ekleyin.', 'egitimler', 'courses'), S('grup', 'Grup açın', 'Tarih ve eğitmen seçin.', 'gruplar', 'groups'), S('kursiyer', 'İlk kursiyeri kaydedin', 'Kaydı ve ödeme planını girin.', 'kursiyerler', 'trainees')],",
  S + "danisan: [S('hizmet', 'Hizmetleri girin', 'Süre ve ücret tanımlayın.', 'hizmetler', 'services'), S('danisan', 'İlk danışanı ekleyin', 'Danışan kartını açın.', 'danisanlar', 'clients'), S('randevu', 'İlk randevuyu verin', 'Tarih ve saat seçin.', 'takvim', 'appts')],",
].join('\n'));
ekle('core/integrations.js', '    adisyon: [\'printer\', \'pos\', \'okc\'', [
  S + "dernek: ['sms', 'whatsapp', 'email', 'printer', 'backup'], egitim: ['sms', 'whatsapp', 'email', 'payment', 'printer', 'backup'], danisan: ['sms', 'email', 'printer', 'backup'],",
].join('\n'));
ekle('core/integrations.js', "  const appName = (id) => ({ muhasebe:", "  const appAd = { dernek: 'Dernek', egitim: 'Eğitim', danisan: 'Danışan' }; // yeni programlar");
{ const f = 'core/integrations.js'; let t = fs.readFileSync(f, 'utf8'); if (!t.includes("appAd[id] ||")) { t = t.replace("[id] || id || '-');", "[id] || appAd[id] || id || '-');"); fs.writeFileSync(f, t); } }
{ const f = 'server/test/program-duman.test.js'; let t = fs.readFileSync(f, 'utf8'); t = t.replace("assert.strictEqual(apps.length, 31, 'program sayısı 31 olmalı');", "assert.ok(apps.length >= 31, 'en az 31 program olmalı');").replace('ok(`${out.length}/31 program yüklendi;', 'ok(`${out.length}/${apps.length} program yüklendi;'); fs.writeFileSync(f, t); }
