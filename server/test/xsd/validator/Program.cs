// GİB UBL-TR 1.2.1 XSD doğrulayıcısı (server/test/ubltr-xsd.test.js çağırır)
// kullanım: dotnet run -- <xsdrt/maindoc klasörü> <xml dosyaları...> · çıkış kodu: hatalı dosya sayısı
using System.Text; using System.Xml; using System.Xml.Schema;
Console.OutputEncoding = Encoding.UTF8;
var dir = args[0]; var bad = 0;
foreach (var f in args.Skip(1)) {
  var root = new XmlDocument(); root.Load(f); var name = root.DocumentElement.LocalName;
  var set = new XmlSchemaSet { XmlResolver = new XmlUrlResolver() };
  foreach (var x in Directory.GetFiles(Path.Combine(dir, "..", "common"), "*xmldsig*.xsd")) set.Add(null, XmlReader.Create(x, new XmlReaderSettings { DtdProcessing = DtdProcessing.Parse }));
  set.Add(null, Path.Combine(dir, $"UBL-{name}-2.1.xsd")); set.Compile();
  var errs = new List<string>();
  var st = new XmlReaderSettings { ValidationType = ValidationType.Schema, Schemas = set };
  st.ValidationEventHandler += (s, e) => errs.Add($"  [{e.Severity}] {e.Exception?.LineNumber}:{e.Exception?.LinePosition} {e.Message}");
  using (var r = XmlReader.Create(f, st)) while (r.Read()) { }
  if (errs.Count > 0) bad++;
  Console.WriteLine($"{Path.GetFileName(f)}: {(errs.Count == 0 ? "OK" : errs.Count + " HATA")}");
  errs.Take(12).ToList().ForEach(Console.WriteLine);
}
return bad;
