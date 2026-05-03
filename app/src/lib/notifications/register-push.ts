"use client";

/**
 * Client-side FCM push registration.
 * Call registerPushNotifications() after the user logs in.
 * Gracefully does nothing if Firebase config is not set.
 */

export async function registerPushNotifications(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    console.log("[push] Skipped — Firebase client config not set");
    return null;
  }

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const config = { apiKey, projectId, messagingSenderId, appId };

    // Pass config to SW
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      // Inject config into the service worker global
      if (reg.active) {
        reg.active.postMessage({ type: "FIREBASE_CONFIG", config });
      }
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[push] Notification permission denied");
      return null;
    }

    const swReg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await fetch("/api/notifications/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    return token;
  } catch (e) {
    console.warn("[push] Registration failed:", e);
    return null;
  }
}
