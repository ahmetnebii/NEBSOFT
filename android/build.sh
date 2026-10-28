#!/usr/bin/env bash
# NEBSOFT Android APK derlemesi (Gradle gerektirmez: Android SDK build-tools + JDK 17)
#   ANDROID_SDK  Android SDK klasörü (varsayılan: %LOCALAPPDATA%/Android/Sdk)
#   JAVA_HOME    JDK 17 klasörü (varsayılan: %LOCALAPPDATA%/Android/jdk-17*)
# Çıktı: ../indir/NEBSOFT.apk (indirme sayfası bu dosya varsa "APK dosyasını indir" düğmesini açar)
# İmza anahtarı ilk derlemede ../data/android-release.jks olarak üretilir; şifresi ../data/android-keystore.txt içindedir.
# Bu iki dosyayı güvenli bir yere yedekleyin: güncellemeler aynı anahtarla imzalanmazsa telefonlar yeni sürümü kurmaz.
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"; OUT="$ROOT/../indir"; DATA="$ROOT/../data"; B="$ROOT/build"
LA="${LOCALAPPDATA:-$HOME/AppData/Local}"
SDK="${ANDROID_SDK:-$LA/Android/Sdk}"
JH="${JAVA_HOME:-$(ls -d "$LA"/Android/jdk-17* 2>/dev/null | head -1)}"
BT="$SDK/build-tools/34.0.0"; AJ="$SDK/platforms/android-34/android.jar"
for f in "$BT/aapt2.exe" "$BT/zipalign.exe" "$BT/lib/d8.jar" "$BT/lib/apksigner.jar" "$AJ" "$JH/bin/javac.exe"; do [ -f "$f" ] || { echo "Eksik: $f"; exit 1; }; done
VER=$(grep -o 'android:versionName="[^"]*"' AndroidManifest.xml | cut -d'"' -f2)
sed -i "s/static final String VERSION = \"[^\"]*\"/static final String VERSION = \"$VER\"/" src/tr/com/nebsoft/app/BuildInfo.java

# Varsayılan sunucu adresleri tek yerden: ../sunucu.json
SRV=$(node -e "const a=require(process.argv[1]).adresler||[];process.stdout.write(a.map(x=>JSON.stringify(String(x).replace(/\\/$/,''))).join(', '))" "$ROOT/../sunucu.json")
sed -i "s|static final String\[\] SERVERS = {[^}]*};|static final String[] SERVERS = { $SRV };|" src/tr/com/nebsoft/app/BuildInfo.java
echo "   varsayılan sunucular: $SRV"
rm -rf "$B"; mkdir -p "$B/classes" "$B/dex" "$OUT" "$DATA"
echo "1/6 kaynaklar";   "$BT/aapt2.exe" compile --dir res -o "$B/res.zip"
echo "2/6 manifest";    "$BT/aapt2.exe" link -I "$AJ" --manifest AndroidManifest.xml -o "$B/base.apk" "$B/res.zip" --min-sdk-version 26 --target-sdk-version 34 --version-name "$VER"
echo "3/6 java";        "$JH/bin/javac.exe" -Xlint:none --release 8 -encoding UTF-8 -classpath "$AJ" -d "$B/classes" $(find src -name '*.java') # lambda'ları d8 Android'e çevirir
echo "4/6 dex";         (cd "$B/classes" && "$JH/bin/java.exe" -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 --release --min-api 26 --lib "$AJ" --output ../dex $(find . -name '*.class')) # göreli yollar: klasör adındaki boşluk bölünmesin
cp "$B/base.apk" "$B/unsigned.apk"; (cd "$B/dex" && "$JH/bin/jar.exe" -u -M -f ../unsigned.apk classes.dex)
echo "5/6 hizalama";    "$BT/zipalign.exe" -p -f 4 "$B/unsigned.apk" "$B/aligned.apk"
KS="$DATA/android-release.jks"; KP="$DATA/android-keystore.txt"
if [ ! -f "$KS" ]; then
  PASS=$(node -e "process.stdout.write(require('crypto').randomBytes(18).toString('base64url'))")
  "$JH/bin/keytool.exe" -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -alias nebsoft -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=NEBSOFT, O=NEBSOFT, C=TR" >/dev/null 2>&1
  printf 'keystore=android-release.jks\nalias=nebsoft\npassword=%s\n' "$PASS" > "$KP"
  echo "   yeni imza anahtarı üretildi: data/android-release.jks (YEDEKLEYİN)"
fi
PASS=$(grep '^password=' "$KP" | cut -d= -f2-)
echo "6/6 imza";        "$JH/bin/java.exe" -jar "$BT/lib/apksigner.jar" sign --ks "$KS" --ks-key-alias nebsoft --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --out "$OUT/NEBSOFT.apk" "$B/aligned.apk"
"$JH/bin/java.exe" -jar "$BT/lib/apksigner.jar" verify --print-certs "$OUT/NEBSOFT.apk" | head -3
rm -f "$OUT/NEBSOFT.apk.idsig"
ls -la "$OUT/NEBSOFT.apk"
