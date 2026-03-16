'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { messaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase-client';

const SERVICE_WORKER_READY_TIMEOUT_MS = 10000;
const APP_SERVICE_WORKER_PATH = '/sw.js';

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'mobile';

  return 'desktop';
}

async function getActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration();
  const isAppWorkerActive =
    existingRegistration?.active?.scriptURL?.endsWith(APP_SERVICE_WORKER_PATH) ?? false;

  if (!isAppWorkerActive) {
    try {
      await navigator.serviceWorker.register(APP_SERVICE_WORKER_PATH);
    } catch (error) {
      console.error('[useFcmToken] Failed to register app service worker:', error);
    }
  }

  if (existingRegistration?.active && isAppWorkerActive) {
    return existingRegistration;
  }

  const readyRegistration = await Promise.race<ServiceWorkerRegistration | null>([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), SERVICE_WORKER_READY_TIMEOUT_MS);
    }),
  ]);

  return readyRegistration;
}

export function useFcmToken() {
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  // Read initial permission status synchronously (no effect needed)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  /**
   * Save FCM token to the server (admin_fcm_tokens table).
   */
  const saveTokenToServer = useCallback(async (fcmToken: string) => {
    if (!session?.user) {
      throw new Error('Session not ready');
    }

    const response = await fetch('/api/admin/fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        deviceType: getDeviceType(),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        payload && typeof payload.error === 'string'
          ? payload.error
          : `Failed to save FCM token (${response.status})`;
      throw new Error(message);
    }
  }, [session]);

  /**
   * Get or refresh the FCM token and save it to the server.
   * Works in both web and PWA mode.
   */
  const getFcmToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.');
      return null;
    }
    if (!messaging) {
      setError('Firebase Messaging is not available in this browser context.');
      return null;
    }
    if (!VAPID_KEY) {
      console.error('[useFcmToken] VAPID Key is missing');
      setError('Firebase VAPID key is missing.');
      return null;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const serviceWorkerRegistration = await getActiveServiceWorkerRegistration();
      if (!serviceWorkerRegistration) {
        throw new Error('Service worker is not ready. Reload the app and try again.');
      }

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration,
      });

      if (currentToken) {
        setToken(currentToken);
        await saveTokenToServer(currentToken);
        setError(null);
      } else {
        setToken(null);
        setError('Firebase did not return a device token.');
      }

      return currentToken ?? null;
    } catch (error) {
      console.error('[useFcmToken] Error getting FCM token:', error);
      setToken(null);
      setError(error instanceof Error ? error.message : 'Failed to register this device for notifications.');
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [saveTokenToServer]);

  /**
   * Request notification permission and then register the FCM token.
   * Call this when the user clicks "Enable Notifications".
   */
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        return await getFcmToken();
      }

      setError(
        permission === 'denied'
          ? 'Notifications are blocked in the browser for this app.'
          : 'Notification permission was not granted.',
      );
      return null;
    } catch (error) {
      console.error('[useFcmToken] requestPermission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to request notification permission.');
      return null;
    }
  }, [getFcmToken]);

  /**
   * Auto-register FCM token on mount if permission is already granted.
   * This is critical for PWA mode: when the app is re-opened after being
   * installed, the permission is already granted but the token may not
   * be registered yet (e.g., after a fresh install, browser restart, etc.).
   */
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      messaging &&
      session?.user
    ) {
      // Defer out of the effect body to avoid setState-in-effect lint warning.
      // Using a microtask (Promise) keeps it non-blocking.
      const timer = setTimeout(() => { void getFcmToken(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [session, getFcmToken]);

  /**
   * Handle foreground messages (app is in the foreground/active tab).
   */
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[useFcmToken] Foreground message received:', payload);
      const { title, body } = payload.notification || {};
      if (title && body && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/keepplay-logo2.png',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    token,
    notificationPermission,
    requestPermission,
    refreshToken: getFcmToken,
    error,
    isRegistering,
  };
}
