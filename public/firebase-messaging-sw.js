// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's implementation config object.
// https://firebase.google.com/docs/web/setup#config
// 
// REPLACE WITH YOUR FIREBASE CONFIG
// Since service workers can't access process.env at build time easily without webpack definedplugin,
// we might need to hardcode or inject these values during build.
// However, the messaging sender ID alone is usually enough for background handling if using compat?
// Actually, fetch implementation config is needed.

// We will fetch the config from an endpoint or use hardcoded values if provided.
// For now, let's assume usage of environment variables at build time or just standard init if supported.

// Since Next.js env vars are build-time for public ones, we should be able to see them if we rename this to .ts and compile it??
// No, SW is static file in public.

// Strategy: The Firebase SDK in the main thread (firebase-client.ts) will register the service worker
// and passing the config is tricky.
// Standard solution: Hardcode config here or fetch it.
// OR use `injectManifest` with Workbox to inject env vars.

// For simplicity in this demo, we'll placeholder it and ask user to fill it, 
// OR we can try to use `clients.matchAll` to get config from a window client? No, that's async.

// Let's use a placeholder and instruct the user.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_FIREBASE_APP_ID",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/admin-icon-192.png', // custom icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
