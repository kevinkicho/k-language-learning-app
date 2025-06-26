package com.lingoquiz.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for better audio support
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            
            // Enable JavaScript
            webSettings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            webSettings.setDomStorageEnabled(true);
            
            // Enable media playback
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            
            // Enable mixed content (if needed)
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        }
    }
}
