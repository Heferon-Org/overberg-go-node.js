/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker.
 * Handles background push notifications when the app is not focused.
 */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey || "",
  projectId: self.__FIREBASE_CONFIG__?.projectId || "",
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || "",
  appId: self.__FIREBASE_CONFIG__?.appId || "",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;

  self.registration.showNotification(title, {
    body: body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: payload.data || {},
    tag: payload.data?.order_id || "overberg-go",
    renotify: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.link || "/orders";
  event.waitUntil(clients.openWindow(url));
});
