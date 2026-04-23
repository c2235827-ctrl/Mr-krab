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
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
  });
});
