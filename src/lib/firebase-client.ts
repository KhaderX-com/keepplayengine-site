import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Only initialize messaging if supported (service workers)
  if ("serviceWorker" in navigator) {
    try {
        messaging = getMessaging(app);
    } catch (e) {
        console.error("Firebase Messaging failed to initialize", e);
    }
  }
}

export { messaging, getToken, onMessage };
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
