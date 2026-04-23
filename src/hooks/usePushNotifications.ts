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

      await supabase
        .from('push_tokens')
        .upsert({ user_id: user.id, token, platform: 'web' }, { onConflict: 'token' });

      onMessage(messaging, (payload) => {
        toast(payload.notification?.body || 'New notification', {
          icon: '🔔',
          duration: 5000,
        });
      });
    }

    setup();
  }, [user]);
}
