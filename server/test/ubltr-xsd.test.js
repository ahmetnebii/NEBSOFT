// core/ubltr.js çıktısını GİB'in resmî UBL-TR 1.2.1 XSD'leriyle doğrular (server/test/xsd/gib/xsdrt — UBL-TR1.2.1_Paketi.zip)
//   node server/test/ubltr-xsd.test.js   (.NET SDK gerekir; yoksa test atlanır ve bunu açıkça yazar)
// İmza (UBLExtensions) entegratör tarafından mali mühürle eklenir; doğrulamada yerine yer tutucu konur.
const fs = require('fs'); const path = require('path'); const os = require('os'); const { spawnSync } = require('child_process');
const U = require('../../core/ubltr');
const dir = path.join(__dirname, 'xsd'); const main = path.join(dir, 'gib', 'xsdrt', 'maindoc');
if (spawnSync('dotnet', ['--version'], { shell: true }).status !== 0) { console.log('⚠ .NET SDK yok — GİB XSD doğrulaması ATLANDI (bu test geçti sayılmaz)'); process.exit(0); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nb-xsd-'));
const EXT = '<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent><x:imza xmlns:x="urn:yer-tutucu"/></ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>';
const seller = { id: '1234567801', name: 'Deneme Ticaret A.Ş.', taxOffice: 'Kadıköy', street: 'Bağdat Cad. No:1', district: 'Kadıköy', city: 'İstanbul', phone: '0216 000 00 00', email: 'info@deneme.com.tr' };
const vkn = { id: '9876543210', name: 'Alıcı Ltd. Şti.', taxOffice: 'Çankaya', street: 'Atatürk Blv. No:5', district: 'Çankaya', city: 'Ankara' };
const tckn = { id: '12345678901', name: 'Ayşe Nur Demir', district: 'Konak', city: 'İzmir' };
const xslt = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'ebelge', 'general.xslt'), 'utf8');
const cases = {
  ticari: { profile: 'TICARIFATURA', id: 'NEB2026000000001', date: '2026-10-28', time: '14:30:00', seller, buyer: vkn, notes: ['Belge no: FT2026000001'], lines: [{ name: 'Süt', qty: 3, price: 30, vat: 1, unit: 'lt' }, { name: 'Deterjan', qty: 2, price: 50, disc: 10, vat: 20, code: 'DT-1' }] },
  temel: { profile: 'TEMELFATURA', id: 'NEB2026000000002', date: '2026-10-28', seller, buyer: vkn, lines: [{ name: 'Danışmanlık', qty: 4, price: 1500, vat: 20, unit: 'saat' }] },
  earsiv_usd: { profile: 'EARSIVFATURA', id: 'EAR2026000000003', date: '2026-10-28', currency: 'USD', rate: 49.6997, seller, buyer: tckn, lines: [{ name: 'Tişört', total: 600, vat: 10 }] },
  iade: { profile: 'TEMELFATURA', type: 'IADE', refundOf: 'NEB2026000000002', refundDate: '2026-10-28', id: 'NEB2026000000004', date: '2026-10-28', seller, buyer: vkn, lines: [{ name: 'İade', qty: 1, price: 1500, vat: 20 }] },
  istisna: { profile: 'TEMELFATURA', id: 'NEB2026000000005', date: '2026-10-28', seller, buyer: vkn, lines: [{ name: 'İhraç kayıtlı', qty: 1, price: 100, vat: 0, exemptionCode: '301', exemptionReason: '11/1-a Mal ihracatı' }] },
  gomulu_xslt: { profile: 'EARSIVFATURA', id: 'EAR2026000000006', date: '2026-10-28', seller, buyer: tckn, xslt, lines: [{ name: 'Ürün', qty: 1, price: 100, vat: 20 }] },
};
const files = Object.entries(cases).map(([k, doc]) => { const f = path.join(tmp, k + '.xml'); fs.writeFileSync(f, U.xml(doc).xml.replace('<cbc:UBLVersionID>', EXT + '<cbc:UBLVersionID>')); return f; });
files.push(path.join(dir, 'gib', 'TemelFaturaOrnegi.xml')); // GİB'in kendi örneği: doğrulayıcının doğru çalıştığının kanıtı
const r = spawnSync('dotnet', ['run', '-c', 'Release', '--project', path.join(dir, 'validator'), '--', main, ...files], { encoding: 'utf8', shell: false });
process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
fs.rmSync(tmp, { recursive: true, force: true });
if (r.status !== 0) { console.error(`✗ GİB XSD doğrulaması başarısız (${r.status} dosya)`); process.exit(1); }
console.log(`\n✓ ${files.length} belge GİB UBL-TR 1.2.1 XSD'sine uygun`);
