/**
 * PWA Push Notification Utilities
 * Handles Web Push API subscription and notification management
 */

// VAPID public key - You need to generate this and set it in environment
// Generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
    if (!isPushSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('Error getting push subscription:', error);
        return null;
    }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return null;
    }

    if (!VAPID_PUBLIC_KEY) {
        console.error('VAPID public key not configured');
        return null;
    }

    try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            return subscription;
        }

        // Create new subscription
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource
        });

        // Save subscription to server
        await saveSubscriptionToServer(subscription);

        return subscription;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const subscription = await getCurrentPushSubscription();

        if (!subscription) {
            return true;
        }

        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server (we need to store the subscription ID)
        // This would require storing the subscription ID locally

        return true;
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return false;
    }
}

/**
 * Save push subscription to server
 */
async function saveSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
        const response = await fetch('/api/notifications/push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                deviceInfo: {
                    deviceName: getDeviceName(),
                    deviceType: getDeviceType(),
                    userAgent: navigator.userAgent
                }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error saving subscription to server:', error);
        return false;
    }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Get device name (basic detection)
 */
function getDeviceName(): string {
    const ua = navigator.userAgent;

    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
        const match = ua.match(/Android.*;\s*([^)]+)/);
        return match ? match[1].split(';')[0].trim() : 'Android Device';
    }
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux PC';

    return 'Unknown Device';
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;

    if (/Mobile|Android|iPhone|iPod/.test(ua)) return 'mobile';
    if (/iPad|Tablet/.test(ua)) return 'tablet';

    return 'desktop';
}

/**
 * Request notification permission and optionally subscribe to push
 */
export async function enablePushNotifications(): Promise<{
    permissionGranted: boolean;
    subscription: PushSubscription | null;
    error?: string;
}> {
    // Check support
    if (!isPushSupported()) {
        return {
            permissionGranted: false,
            subscription: null,
            error: 'Push notifications are not supported in this browser'
        };
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return {
            permissionGranted: false,
            subscription: null,
            error: 'Notification permission was denied'
        };
    }

    // Subscribe to push
    const subscription = await subscribeToPush();

    return {
        permissionGranted: true,
        subscription,
        error: subscription ? undefined : 'Failed to subscribe to push notifications'
    };
}

/**
 * Get push notification status
 */
export async function getPushStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
    subscribed: boolean;
}> {
    if (!isPushSupported()) {
        return {
            supported: false,
            permission: 'unsupported',
            subscribed: false
        };
    }

    const subscription = await getCurrentPushSubscription();

    return {
        supported: true,
        permission: Notification.permission,
        subscribed: !!subscription
    };
}
