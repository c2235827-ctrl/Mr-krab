importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDHGeWQAAm_eGQTBzEreuEApKZnAbIeQ0c",
  authDomain: "mr-crabs-224d8.firebaseapp.com",
  projectId: "mr-crabs-224d8",
  storageBucket: "mr-crabs-224d8.firebasestorage.app",
  messagingSenderId: "123888954624",
  appId: "1:123888954624:web:cf1dfb15b710277562d7e5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Mr. Krab 🦀';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new alert',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    silent: false,
    data: {
      url: '/notifications'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
