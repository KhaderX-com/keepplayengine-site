'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { messaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase-client';

export function useFcmToken() {
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);
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
    if (!session?.user) return;
    try {
      await fetch('/api/admin/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          userId: (session.user as { id?: string }).id,
          email: session.user.email,
        }),
      });
    } catch (error) {
      console.error('[useFcmToken] Error saving FCM token:', error);
    }
  }, [session]);

  /**
   * Get or refresh the FCM token and save it to the server.
   * Works in both web and PWA mode.
   */
  const getFcmToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !messaging) return null;
    if (!VAPID_KEY) {
      console.error('[useFcmToken] VAPID Key is missing');
      return null;
    }

    try {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        setToken(currentToken);
        await saveTokenToServer(currentToken);
      }
      return currentToken ?? null;
    } catch (error) {
      console.error('[useFcmToken] Error getting FCM token:', error);
      return null;
    }
  }, [saveTokenToServer]);

  /**
   * Request notification permission and then register the FCM token.
   * Call this when the user clicks "Enable Notifications".
   */
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted' && messaging) {
        return await getFcmToken();
      }
      return null;
    } catch (error) {
      console.error('[useFcmToken] requestPermission error:', error);
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

  return { token, notificationPermission, requestPermission };
}
