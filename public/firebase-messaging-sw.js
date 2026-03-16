// Firebase Cloud Messaging Service Worker
// Handles background push notifications for the admin panel (web + PWA)
//
// Strategy: fetch the Firebase config from a dedicated API endpoint at runtime.
// This avoids hardcoding secrets into a static file and works correctly in
// both web and PWA (installed) modes.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

let messaging = null;

/**
 * Fetch Firebase config from the app's API (public vars only, no secrets).
 * The endpoint returns NEXT_PUBLIC_FIREBASE_* values.
 */
async function initFirebase() {
  try {
    // Determine the app origin from the service worker location
    const swUrl = new URL(self.location.href);
    const origin = swUrl.origin;

    const response = await fetch(`${origin}/api/firebase-config`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[firebase-messaging-sw] Failed to fetch Firebase config:', response.status);
      return;
    }

    const config = await response.json();

    if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
      console.error('[firebase-messaging-sw] Incomplete Firebase config received');
      return;
    }

    // Initialize Firebase app (only once)
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw] Background message received:', payload);

      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationBody = payload.notification?.body || '';
      const notificationData = payload.data || {};

      const notificationOptions = {
        body: notificationBody,
        icon: '/keepplay-logo2.png',
        badge: '/keepplay-logo2.png',
        data: {
          ...notificationData,
          timestamp: Date.now(),
        },
        actions: notificationData.url
          ? [{ action: 'open', title: 'View' }]
          : [],
        requireInteraction: true,
        tag: notificationData.type || 'admin-notification',
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log('[firebase-messaging-sw] Firebase initialized successfully');
  } catch (err) {
    console.error('[firebase-messaging-sw] Initialization error:', err);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an admin panel window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus();
          if (urlToOpen && client.url !== urlToOpen) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // No window open — open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Initialize Firebase when the service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(initFirebase());
});

// Also initialize on install in case activate fires before messages arrive
self.addEventListener('install', () => {
  self.skipWaiting();
});
