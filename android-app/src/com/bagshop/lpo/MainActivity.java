package com.bagshop.lpo;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

/**
 * Bag Shop LPO — thin wrapper around the LPO web app running on the shop's Mac.
 * If the server can't be reached (e.g. its address changed), a simple dialog
 * lets anyone type the new address; it is remembered on the phone.
 */
public class MainActivity extends Activity {
    private static final String DEFAULT_URL = "https://bagshop-app-production.up.railway.app";

    private WebView web;
    private SharedPreferences prefs;
    private boolean dialogShowing = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("app", MODE_PRIVATE);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && !dialogShowing) {
                    askForServer("Cannot reach the server.\n\nCheck that the shop computer is on, the phone is on the shop Wi-Fi, and the address below is correct.");
                }
            }
        });

        setContentView(web);
        web.loadUrl(prefs.getString("url", DEFAULT_URL));
    }

    private void askForServer(String message) {
        dialogShowing = true;
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(prefs.getString("url", DEFAULT_URL));
        new AlertDialog.Builder(this)
                .setTitle("Server address")
                .setMessage(message)
                .setView(input)
                .setCancelable(false)
                .setPositiveButton("Connect", (d, w) -> {
                    String url = input.getText().toString().trim();
                    if (!url.startsWith("http")) url = "http://" + url;
                    prefs.edit().putString("url", url).apply();
                    dialogShowing = false;
                    web.loadUrl(url);
                })
                .setNegativeButton("Retry", (d, w) -> {
                    dialogShowing = false;
                    web.reload();
                })
                .show();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
