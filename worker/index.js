/* global firebase */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

let messaging = null;
let initPromise = null;

function normalizeNotificationUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.startsWith("/")) {
    return "/admin";
  }

  if (rawUrl === "/admin/withdrawals") {
    return "/admin/keepplay-engine/withdrawals";
  }

  return rawUrl;
}

function getNotificationTargetUrl(data) {
  return normalizeNotificationUrl(data?.url);
}

function showBackgroundNotification(payload) {
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationBody = payload.notification?.body || "";
  const notificationData = payload.data || {};

  return self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: "/admin-icon-192.png",
    badge: "/admin-icon-192.png",
    data: {
      ...notificationData,
      url: getNotificationTargetUrl(notificationData),
      timestamp: Date.now(),
    },
    actions: notificationData.url ? [{ action: "open", title: "View" }] : [],
    requireInteraction: true,
    tag: notificationData.type || "admin-notification",
  });
}

async function initFirebaseMessaging() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const response = await fetch("/api/firebase-config", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config (${response.status})`);
    }

    const config = await response.json();
    if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
      throw new Error("Incomplete Firebase config received");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      void showBackgroundNotification(payload);
    });

    return messaging;
  })().catch((error) => {
    initPromise = null;
    console.error("[worker] Firebase messaging init failed:", error);
    return null;
  });

  return initPromise;
}

void initFirebaseMessaging();

self.addEventListener("activate", (event) => {
  event.waitUntil(initFirebaseMessaging());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = getNotificationTargetUrl(data);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.focus();
          if (client.url !== urlToOpen && "navigate" in client) {
            return client.navigate(urlToOpen);
          }
          return undefined;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

      return undefined;
    }),
  );
});
