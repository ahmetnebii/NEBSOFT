package tr.com.nebsoft.app;

// NEBSOFT Android — masaüstü sürümüyle aynı akış:
//  • İlk açılışta sunucu adresi sorulur ve /api/auth/me ile test edilir (NEBSOFT yanıtı, engelleme sayfası, zaman aşımı ayrı mesajlarla)
//  • Adres kaydedilir; sonraki açılışlarda doğrudan giriş ekranı (/#/giris) gelir, giriş sonrası lisanslı programlar listelenir
//  • Yalnızca kayıtlı sunucunun sayfaları uygulama içinde açılır; diğer bağlantılar tarayıcıda açılır
//  • Kamera izni yalnızca kayıtlı sunucunun sayfası barkod okutmak için isterse verilir
//  • Geri tuşu sayfada geri gider; en baştayken "Çıkış / Sunucu adresini değiştir" sorulur

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private static final String PREFS = "nebsoft";
    private static final String KEY_SERVER = "serverUrl";
    private static final String KEY_AUTO = "serverAuto"; // adres varsayılanlardan otomatik seçildiyse true
    private static final int REQ_CAMERA = 11;
    private static final int REQ_FILE = 12;
    private static final Pattern PLACEHOLDER = Pattern.compile("(^|\\.)(domain|example)\\.(com|org|net)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern BLOCKED = Pattern.compile("you have been blocked|attention required|access denied|cloudflare ray id", Pattern.CASE_INSENSITIVE);

    private static final int BG = Color.rgb(11, 12, 20), CARD = Color.rgb(22, 24, 36), LINE = Color.rgb(46, 49, 68);
    private static final int TEXT = Color.rgb(237, 238, 245), MUTED = Color.rgb(160, 164, 186), BRAND = Color.rgb(99, 102, 241), ERR = Color.rgb(248, 113, 113);

    private final Handler ui = new Handler(Looper.getMainLooper());
    private WebView web;
    private PermissionRequest pendingPerm;
    private ValueCallback<Uri[]> fileCb;

    private SharedPreferences prefs() { return getSharedPreferences(PREFS, MODE_PRIVATE); }
    private String server() { return prefs().getString(KEY_SERVER, ""); }

    private String userAgent(String base) { return base + " NEBSOFT-Android/" + BuildInfo.VERSION; }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        getWindow().getDecorView().setBackgroundColor(BG); // açılışta ve ekran geçişlerinde beyaz şerit görünmesin
        if (!server().isEmpty()) { openApp(server() + "/?app=android#/giris"); return; }
        // İlk açılış: varsayılan adresler (sunucu.json) sırayla denenir; çalışan ilki kaydedilir
        showWaiting();
        new Thread(() -> { String found = null; for (int i = 0; i < 4 && found == null; i++) { if (i > 0) try { Thread.sleep(2500); } catch (InterruptedException x) { break; } found = pickServer(null); } /* telefonun ağı açılışta birkaç saniye geç gelebilir */ final String u = found; ui.post(() -> { if (u != null) openApp(u + "/?app=android#/giris"); else showSetup(BuildInfo.SERVERS.length > 0 ? BuildInfo.SERVERS[0] : "", BuildInfo.SERVERS.length > 0 ? "Varsayılan NEBSOFT sunucusuna şu an ulaşılamadı. İnternet bağlantınızı kontrol edin ya da adresi elle yazın." : null); }); }).start();
    }

    // Varsayılanlardan ilk çalışan adres; skip: az önce açılamayan adres
    private String pickServer(String skip) {
        for (String u : BuildInfo.SERVERS) { if (u.equals(skip)) continue; if (testServer(u) == null) { prefs().edit().putString(KEY_SERVER, u).putBoolean(KEY_AUTO, true).apply(); return u; } }
        return null;
    }

    private void showWaiting() {
        LinearLayout l = new LinearLayout(this); l.setOrientation(LinearLayout.VERTICAL); l.setGravity(Gravity.CENTER); l.setBackgroundColor(BG);
        TextView b = text("NEBSOFT", 26, TEXT, true); b.setLetterSpacing(0.12f); l.addView(b);
        TextView t = text("Sunucuya bağlanılıyor…", 14, MUTED, false); t.setPadding(0, dp(10), 0, dp(16)); l.addView(t);
        l.addView(new ProgressBar(this));
        setContentView(l);
    }

    // ---------- Sunucu adresi ekranı ----------
    private int dp(float v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private GradientDrawable box(int fill, int stroke, float radius) {
        GradientDrawable g = new GradientDrawable(); g.setColor(fill); g.setCornerRadius(dp(radius)); if (stroke != 0) g.setStroke(dp(1), stroke); return g;
    }

    private TextView text(String s, float sp, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color); if (bold) t.setTypeface(Typeface.DEFAULT_BOLD); t.setLineSpacing(0, 1.25f); return t;
    }

    private void showSetup(String prefill, String error) {
        if (web != null) { web.destroy(); web = null; }
        ScrollView sv = new ScrollView(this); sv.setBackgroundColor(BG); sv.setFillViewport(true);
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER_VERTICAL); root.setPadding(dp(22), dp(40), dp(22), dp(40));
        sv.addView(root, new ViewGroup.LayoutParams(-1, -1));

        TextView brand = text("NEBSOFT", 26, TEXT, true); brand.setLetterSpacing(0.12f); brand.setGravity(Gravity.CENTER); root.addView(brand);
        TextView sub = text("İşletme programlarınız, tek hesapla", 14, MUTED, false); sub.setGravity(Gravity.CENTER); sub.setPadding(0, dp(6), 0, dp(26)); root.addView(sub);

        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setPadding(dp(20), dp(22), dp(20), dp(22)); card.setBackground(box(CARD, LINE, 20));
        root.addView(card, new LinearLayout.LayoutParams(-1, -2));
        card.addView(text("Sunucu adresi", 20, TEXT, true));
        TextView info = text("NEBSOFT hesabınızın bulunduğu adresi girin. Bu adres yalnızca bir kez sorulur; sonra uygulama doğrudan giriş ekranıyla açılır.", 14, MUTED, false);
        info.setPadding(0, dp(8), 0, dp(16)); card.addView(info);

        final EditText in = new EditText(this);
        in.setHint("ör. https://www.nebsoft.com.tr veya http://192.168.1.20:5050"); in.setHintTextColor(Color.rgb(110, 114, 138)); in.setTextColor(TEXT); in.setTextSize(15);
        in.setSingleLine(true); in.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI); in.setImeOptions(EditorInfo.IME_ACTION_GO);
        in.setBackground(box(BG, LINE, 12)); in.setPadding(dp(14), dp(12), dp(14), dp(12)); in.setText(prefill);
        card.addView(in, new LinearLayout.LayoutParams(-1, -2));

        final TextView err = text("", 13.5f, ERR, false); err.setPadding(0, dp(10), 0, 0); err.setVisibility(error == null ? View.GONE : View.VISIBLE); if (error != null) err.setText(error);
        card.addView(err);

        final Button go = new Button(this); go.setText("Bağlantıyı test et ve kaydet"); go.setAllCaps(false); go.setTextColor(Color.WHITE); go.setTextSize(15); go.setTypeface(Typeface.DEFAULT_BOLD);
        go.setBackground(box(BRAND, 0, 12));
        LinearLayout.LayoutParams gp = new LinearLayout.LayoutParams(-1, dp(50)); gp.topMargin = dp(16); card.addView(go, gp);

        final ProgressBar pb = new ProgressBar(this); pb.setVisibility(View.GONE); LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(-2, -2); pp.gravity = Gravity.CENTER_HORIZONTAL; pp.topMargin = dp(12); card.addView(pb, pp);

        TextView help = text("Kendi sunucunuzu kurduysanız bilgisayarınızın yerel adresini (ör. http://192.168.1.20:5050) yazabilirsiniz. Kamerayla barkod okutma için adresin https olması gerekir.", 12.5f, MUTED, false);
        help.setPadding(dp(4), dp(18), dp(4), 0); root.addView(help);

        View.OnClickListener submit = v -> {
            final String url = normalize(in.getText().toString());
            err.setVisibility(View.GONE); go.setEnabled(false); go.setAlpha(.6f); pb.setVisibility(View.VISIBLE);
            new Thread(() -> {
                final String problem = testServer(url);
                ui.post(() -> {
                    go.setEnabled(true); go.setAlpha(1f); pb.setVisibility(View.GONE);
                    if (problem != null) { err.setText(problem); err.setVisibility(View.VISIBLE); return; }
                    prefs().edit().putString(KEY_SERVER, url).putBoolean(KEY_AUTO, false).apply();
                    openApp(url + "/?app=android#/giris");
                });
            }).start();
        };
        go.setOnClickListener(submit);
        in.setOnEditorActionListener((v, id, ev) -> { if (id == EditorInfo.IME_ACTION_GO) { submit.onClick(go); return true; } return false; });
        setContentView(sv);
    }

    private static String normalize(String s) {
        s = s.trim(); if (s.isEmpty()) return s;
        if (!s.matches("(?i)^https?://.*")) s = "https://" + s;
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    // null = sorun yok; aksi halde kullanıcıya gösterilecek Türkçe açıklama
    private String testServer(String url) {
        URL u;
        try { u = new URL(url); if (u.getHost() == null || u.getHost().isEmpty()) throw new Exception(); } catch (Exception e) { return "Geçerli bir adres girin (ör. https://www.nebsoft.com.tr)"; }
        if (PLACEHOLDER.matcher(u.getHost()).find()) return "\"" + u.getHost() + "\" örnek bir adrestir, NEBSOFT sunucusu değildir. Kendi alan adınızı yazın.";
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url + "/api/auth/me").openConnection();
            c.setConnectTimeout(12000); c.setReadTimeout(12000);
            c.setRequestProperty("User-Agent", userAgent(System.getProperty("http.agent", "Android")));
            c.setRequestProperty("x-ns-csrf", "1"); c.setRequestProperty("Accept", "application/json");
            int code = c.getResponseCode();
            InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
            StringBuilder sb = new StringBuilder();
            if (is != null) { BufferedReader r = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8)); char[] buf = new char[4096]; int n; while ((n = r.read(buf)) > 0 && sb.length() < 200000) sb.append(buf, 0, n); r.close(); }
            String t = sb.toString().trim();
            if (t.startsWith("{") && t.contains("\"ok\"") && t.contains("\"mode\"")) return null;
            if (BLOCKED.matcher(t).find()) return "Sunucunun güvenlik duvarı (ör. Cloudflare) uygulamayı engelliyor (HTTP " + code + "). Barındırma panelinde \"NEBSOFT-Android\" tarayıcı kimliğine ve /api/ yoluna izin verin (DEPLOY.md → Mobil uygulama).";
            return "Bu adreste NEBSOFT bulunamadı (HTTP " + code + "). Adresi kontrol edin.";
        } catch (UnknownHostException e) {
            return "Sunucuya ulaşılamadı: \"" + u.getHost() + "\" adı bulunamadı. Adresi ve internet bağlantınızı kontrol edin.";
        } catch (SocketTimeoutException e) {
            return "Sunucuya ulaşılamadı: zaman aşımı. Adresi, portu ve aynı ağda olduğunuzu kontrol edin.";
        } catch (javax.net.ssl.SSLException e) {
            return "Güvenli bağlantı kurulamadı (SSL sertifikası). Sunucu https sertifikasını kontrol edin ya da yerel sunucu için http:// ile yazın.";
        } catch (Exception e) {
            return "Sunucuya ulaşılamadı: " + e.getMessage();
        } finally { if (c != null) c.disconnect(); }
    }

    // ---------- Uygulama (WebView) ----------
    private boolean sameOrigin(Uri a) {
        try { Uri s = Uri.parse(server()); return a.getScheme() != null && a.getScheme().equalsIgnoreCase(s.getScheme()) && a.getHost() != null && a.getHost().equalsIgnoreCase(s.getHost()) && a.getPort() == s.getPort(); } catch (Exception e) { return false; }
    }

    private void openApp(String url) {
        FrameLayout frame = new FrameLayout(this); frame.setBackgroundColor(BG);
        web = new WebView(this); web.setBackgroundColor(BG);
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(frame);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); s.setAllowFileAccess(false); s.setAllowContentAccess(false);
        s.setLoadWithOverviewMode(true); s.setUseWideViewPort(true); s.setSupportMultipleWindows(false);
        s.setUserAgentString(userAgent(s.getUserAgentString()));
        CookieManager.getInstance().setAcceptCookie(true); CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);

        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl(); String sc = u.getScheme() == null ? "" : u.getScheme();
                if (sameOrigin(u)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* açacak uygulama yok */ }
                return true; // tel:, mailto:, whatsapp ve dış siteler cihazın uygulamalarında açılır
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (!r.isForMainFrame()) return;
                final String desc = String.valueOf(e.getDescription());
                // Varsayılan adres açılmazsa sıradaki varsayılan denenir; kullanıcının kendi yazdığı adres değiştirilmez
                if (prefs().getBoolean(KEY_AUTO, false)) { final String bad = server(); new Thread(() -> { final String alt = pickServer(bad); ui.post(() -> { if (alt != null) openApp(alt + "/?app=android#/giris"); else showOffline(desc); }); }).start(); return; }
                showOffline(desc);
            }
            @Override public void onPageFinished(WebView v, String u) {
                v.evaluateJavascript("(document.title+' '+(document.body?document.body.innerText.slice(0,400):''))", (t) -> {
                    if (t != null && BLOCKED.matcher(t).find()) showSetup(server(), "Sunucunun güvenlik duvarı uygulamayı engelledi. Adres doğruysa barındırma panelinde \"NEBSOFT-Android\" tarayıcı kimliğine izin verin; adres yanlışsa düzeltin.");
                });
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest req) {
                ui.post(() -> {
                    if (!sameOrigin(req.getOrigin())) { req.deny(); return; }
                    boolean wantsCam = false; for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCam = true;
                    if (!wantsCam) { req.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else { pendingPerm = req; requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA); }
                });
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); } catch (Exception e) { fileCb = null; return false; }
                return true; // Excel içe aktarma, logo / ürün görseli yükleme
            }
        });
        web.loadUrl(url);
    }

    private void showOffline(String why) {
        if (web == null) return;
        String esc = why == null ? "" : why.replace("&", "&amp;").replace("<", "&lt;");
        String html = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0c14;color:#edeef5;font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}p{color:#a0a4ba;line-height:1.5}button{border:0;border-radius:12px;padding:14px 22px;font-size:15px;font-weight:700;margin:6px;width:100%;max-width:320px}.p{background:#6366f1;color:#fff}.s{background:#1f2233;color:#edeef5}</style></head><body><div><h2>Sunucuya bağlanılamıyor</h2><p>İnternet bağlantınızı kontrol edin.<br><small>" + esc + "</small></p><button class='p' onclick='location.href=\"nebsoft://tekrar\"'>Tekrar dene</button><br><button class='s' onclick='location.href=\"nebsoft://adres\"'>Sunucu adresini değiştir</button></div></body></html>";
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.equals("nebsoft://tekrar")) { openApp(server() + "/?app=android#/giris"); return true; }
                if (u.equals("nebsoft://adres")) { showSetup(server(), null); return true; }
                return true;
            }
        });
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        if (code == REQ_CAMERA && pendingPerm != null) {
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pendingPerm.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); else pendingPerm.deny();
            pendingPerm = null;
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code == REQ_FILE && fileCb != null) { fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data)); fileCb = null; return; }
        super.onActivityResult(code, result, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent e) {
        if (keyCode == KeyEvent.KEYCODE_BACK && web != null) {
            if (web.canGoBack()) { web.goBack(); return true; }
            new AlertDialog.Builder(this).setTitle("NEBSOFT")
                .setItems(new String[]{"Uygulamadan çık", "Sunucu adresini değiştir", "Vazgeç"}, (d, i) -> { if (i == 0) finish(); else if (i == 1) showSetup(server(), null); })
                .show();
            return true;
        }
        return super.onKeyDown(keyCode, e);
    }

    @Override protected void onPause() { super.onPause(); CookieManager.getInstance().flush(); if (web != null) web.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
}
