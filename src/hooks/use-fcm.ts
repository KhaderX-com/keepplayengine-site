'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { messaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase-client';

export function useFcmToken() {
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (typeof window === 'undefined') return null;
      
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted' && messaging) {
        if (!VAPID_KEY) {
            console.error("VAPID Key is missing in environment variables");
            return null;
        }

        const currentToken = await getToken(messaging, { 
            vapidKey: VAPID_KEY 
        });

        if (currentToken) {
          setToken(currentToken);
          
          if (session?.user) {
             try {
                // Send to backend via API
                await fetch('/api/admin/fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: currentToken,
                        userId: (session.user as any).id, // Expecting ID from session
                        email: session.user.email
                    })
                });
             } catch (error) {
                 console.error("Error saving FCM token:", error);
             }
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
        return currentToken;
      }
    } catch (error) {
      console.log('An error occurred while retrieving token. ', error);
      return null;
    }
  };

  useEffect(() => {
    if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            const { title, body } = payload.notification || {};
            if (title && body) {
                new Notification(title, { body });
            }
        });
        return () => unsubscribe();
    }
  }, []);

  return { token, notificationPermission, requestPermission };
}
