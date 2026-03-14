// Push Notification Handlers for Service Worker
// This file contains the push notification event handlers
// Import this in your main service worker (sw.js)

// Handle incoming push notifications
self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            // M09: Validate push data schema before using
            if (!data || typeof data !== 'object') return;
            const title = (typeof data.title === 'string' ? data.title : 'New Notification').substring(0, 100);
            const body = (typeof data.body === 'string' ? data.body : typeof data.message === 'string' ? data.message : '').substring(0, 500);
            const priority = ['urgent', 'high', 'normal', 'low'].includes(data.priority) ? data.priority : 'normal';
            const tag = (typeof data.tag === 'string' ? data.tag : 'notification-' + Date.now()).substring(0, 100);
            const notificationId = typeof data.notificationId === 'string' ? data.notificationId.substring(0, 50) : undefined;
            // Validate URL — only allow relative paths or same-origin
            let url = '/admin/notifications';
            if (typeof data.url === 'string' && data.url.startsWith('/')) {
                url = data.url.substring(0, 200);
            }

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
                body: body,
                icon: '/admin-icon-192.png',
                badge: '/admin-icon-192.png',
                vibrate: config.vibrate,
                tag: tag,
                requireInteraction: config.requireInteraction,
                data: {
                    url: url,
                    notificationId: notificationId,
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
                    `${config.badge} ${title}`,
                    options
                )
            );

        } catch (error) {
            // L05: Don't log error details that may contain URLs or PII
            console.error('[Service Worker] Error parsing push data');

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
    event.notification.close();

    // Handle action buttons
    if (event.action === 'dismiss') {
        return;
    }

    // Open or focus the app — validate URL stays within /admin/ scope
    let urlToOpen = event.notification.data?.url || '/admin/notifications';
    try {
        const parsed = new URL(urlToOpen, self.location.origin);
        if (parsed.origin !== self.location.origin || !parsed.pathname.startsWith('/admin/')) {
            urlToOpen = '/admin/notifications';
        }
    } catch {
        urlToOpen = '/admin/notifications';
    }
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (windowClients) {
            // Check if there's already a window open to the admin panel
            for (const client of windowClients) {
                if (client.url.includes('/admin') && 'focus' in client) {
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
                return clients.openWindow(fullUrl);
            }
        })
    );
});

// Handle notification close events (for analytics)
self.addEventListener('notificationclose', function (event) {
    // Optional: Send analytics about notification dismissal
    // You could track which notifications users dismiss without opening
});

// Background sync for offline notifications (optional enhancement)
self.addEventListener('sync', function (event) {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            // Fetch any missed notifications while offline
            fetch('/api/notifications?limit=10')
                .then(response => response.json())
                .then(() => {})
                .catch(error => {
                    console.error('[Service Worker] Failed to sync notifications:', error);
                })
        );
    }
});
