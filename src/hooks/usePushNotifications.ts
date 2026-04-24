import { useEffect } from 'react';
import { requestNotificationPermission, messaging, onMessage } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

export function usePushNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    async function setup() {
      const token = await requestNotificationPermission();
      if (!token) return;

      try {
        await supabase
          .from('push_tokens')
          .upsert({ user_id: user.id, token, platform: 'web' }, { onConflict: 'token' });
      } catch (err) {
        console.error('Failed to save push token:', err);
      }

      onMessage(messaging, (payload) => {
        console.log('[Push] Foreground message received:', payload);
        const title = payload.notification?.title || 'Mr. Krab 🦀';
        const body = payload.notification?.body || 'You have a new notification';

        // Check if we should show a manual notification
        // Note: Browsers usually DON'T show a notification for foreground messages automatically
        if (Notification.permission === 'granted') {
          try {
            const notification = new Notification(title, {
              body,
              icon: '/icon.svg',
              badge: '/icon.svg',
              vibrate: [200, 100, 200],
              silent: false,
            } as any);

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (e) {
            // Some mobile browsers don't support "new Notification" constructor in foreground
            // They expect you to use serviceWorkerRegistration.showNotification
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, {
                body,
                icon: '/icon.svg',
                badge: '/icon.svg',
              } as NotificationOptions);
            });
          }
        }

        // Also show the toast as a backup and immediate feedback
        toast(body, { 
          icon: '🔔', 
          duration: 6000,
          style: {
            border: '1px solid #accent',
            padding: '16px',
          }
        });
      });
    }

    setup();
  }, [user]);
}
