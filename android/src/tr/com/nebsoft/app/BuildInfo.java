package tr.com.nebsoft.app;

// Sürüm AndroidManifest.xml'deki versionName ile aynı tutulur (build.sh ikisini birlikte günceller)
final class BuildInfo {
    static final String VERSION = "3.0.1";
    // build.sh, nebsoft-pazar/sunucu.json içindeki "adresler" listesini buraya yazar
    static final String[] SERVERS = { "http://45.133.36.99:5050", "https://www.nebsoftapp.com" };
    private BuildInfo() { }
}
