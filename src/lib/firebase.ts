import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDHGeWQAAm_eGQTBzEreuEApKZnAbIeQ0c",
  authDomain: "mr-crabs-224d8.firebaseapp.com",
  projectId: "mr-crabs-224d8",
  storageBucket: "mr-crabs-224d8.firebasestorage.app",
  messagingSenderId: "123888954624",
  appId: "1:123888954624:web:cf1dfb15b710277562d7e5",
  measurementId: "G-XTXQV4ED9R"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: 'BC_Dm_mbM9znz8BB3033uUzzR47Wvghz7n7LBAADT7e9Lbbn5I5ngCSRh_N7DSCCqMjiJV3dZ1b6myOnNqUMiJQ',
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (err) {
    console.error('Push setup failed:', err);
    return null;
  }
}

export { onMessage };
