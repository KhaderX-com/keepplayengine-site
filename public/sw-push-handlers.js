// Push Notification Handlers for Service Worker
// This file contains the push notification event handlers
// Import this in your main service worker (sw.js)

// Handle incoming push notifications
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push notification received:', event);

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push data:', data);

            // Map notification priority to visual style
            const priorityConfig = {
                urgent: {
                    badge: '🚨',
                    vibrate: [200, 100, 200, 100, 200],
                    requireInteraction: true
                },
                high: {
                    badge: '⚠️',
                    vibrate: [100, 50, 100],
                    requireInteraction: false
                },
                normal: {
                    badge: '🔔',
                    vibrate: [100],
                    requireInteraction: false
                },
                low: {
                    badge: '💬',
                    vibrate: [50],
                    requireInteraction: false
                }
            };

            const priority = data.priority || 'normal';
            const config = priorityConfig[priority];

            const options = {
                body: data.body || data.message,
                icon: '/admin-icon-192.png',
                badge: '/admin-icon-192.png',
                vibrate: config.vibrate,
                tag: data.tag || 'notification-' + Date.now(),
                requireInteraction: config.requireInteraction,
                data: {
                    url: data.url || '/admin/notifications',
                    notificationId: data.notificationId,
                    priority: priority,
                    timestamp: Date.now()
                },
                actions: [
                    {
                        action: 'open',
                        title: 'Open',
                        icon: '/icon-192.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss'
                    }
                ]
            };

            event.waitUntil(
                self.registration.showNotification(
                    `${config.badge} ${data.title || 'New Notification'}`,
                    options
                )
            );

        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);

            // Fallback notification if parsing fails
            event.waitUntil(
                self.registration.showNotification('New Notification', {
                    body: 'You have a new notification',
                    icon: '/admin-icon-192.png',
                    badge: '/admin-icon-192.png',
                    data: { url: '/admin/notifications' }
                })
            );
        }
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click received:', event);

    event.notification.close();

    // Handle action buttons
    if (event.action === 'dismiss') {
        console.log('[Service Worker] Notification dismissed');
        return;
    }

    // Open or focus the app
    const urlToOpen = event.notification.data?.url || '/admin/notifications';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (windowClients) {
            console.log('[Service Worker] Looking for existing windows...');

            // Check if there's already a window open to the admin panel
            for (const client of windowClients) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    console.log('[Service Worker] Focusing existing window:', client.url);
                    return client.focus().then(function () {
                        // Navigate to the notification URL
                        if ('navigate' in client) {
                            return client.navigate(fullUrl);
                        }
                    });
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                console.log('[Service Worker] Opening new window:', fullUrl);
                return clients.openWindow(fullUrl);
            }
        })
    );
});

// Handle notification close events (for analytics)
self.addEventListener('notificationclose', function (event) {
    console.log('[Service Worker] Notification closed:', event.notification.tag);

    // Optional: Send analytics about notification dismissal
    // You could track which notifications users dismiss without opening
});

// Background sync for offline notifications (optional enhancement)
self.addEventListener('sync', function (event) {
    if (event.tag === 'sync-notifications') {
        console.log('[Service Worker] Syncing notifications...');

        event.waitUntil(
            // Fetch any missed notifications while offline
            fetch('/api/notifications?limit=10')
                .then(response => response.json())
                .then(data => {
                    console.log('[Service Worker] Synced notifications:', data);
                })
                .catch(error => {
                    console.error('[Service Worker] Failed to sync notifications:', error);
                })
        );
    }
});

console.log('[Service Worker] Push notification handlers loaded');
