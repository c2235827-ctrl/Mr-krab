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
        const title = payload.notification?.title || 'Mr. Krab 🦀';
        const body = payload.notification?.body || 'You have a new notification';

        // Use the real Notification API so the OS shows a popup with sound
        if (Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            silent: false, // let the OS play its default notification sound
          });

          // Clicking the notification focuses the app
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        // Also show the toast as a backup
        toast(body, { icon: '🔔', duration: 5000 });
      });
    }

    setup();
  }, [user]);
}
