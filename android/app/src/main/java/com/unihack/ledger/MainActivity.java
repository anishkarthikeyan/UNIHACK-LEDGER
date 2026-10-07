package com.unihack.ledger;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    // No google-services.json in local dev (see android/app/build.gradle), so the Firebase SDK
    // never auto-initializes a default app. @capacitor/push-notifications' register() then throws
    // an uncaught IllegalStateException ("Default FirebaseApp is not initialized") on its own
    // handler thread, which crashes the whole app instead of surfacing as a catchable JS error —
    // defeating src/lib/push.ts's "fails silently" design. A placeholder FirebaseApp satisfies the
    // init check so that failure happens through the normal (catchable) Firebase error path
    // instead. Skipped when a real google-services.json already initialized the default app.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseApp.initializeApp(this, new FirebaseOptions.Builder()
                .setApplicationId("1:000000000000:android:0000000000000000000000")
                .setApiKey("local-dev-placeholder")
                .setProjectId("unihack-ledger-local")
                .build());
        }
        super.onCreate(savedInstanceState);
    }
}
