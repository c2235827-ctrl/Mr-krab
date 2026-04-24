import { useEffect } from 'react';
import { requestNotificationPermission, messaging, onMessage } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const seenNotifs = new Set<string>();

export function usePushNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    let supabaseChannel: any = null;

    async function showNativeNotification(title: string, body: string, data?: any) {
      if (Notification.permission !== 'granted') return;
      
      const notifId = data?.id || `${title}-${body}`;
      if (seenNotifs.has(notifId)) return;
      
      seenNotifs.add(notifId);
      // Clean up seen notifications after 10 seconds
      setTimeout(() => seenNotifs.delete(notifId), 10000);

      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.warn('Audio playback blocked:', e));
      } catch (e) {
        console.warn('Audio play error:', e);
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            tag: data?.id || 'new-notif',
            renotify: true,
            silent: false,
            data: {
              url: data?.url || '/notifications'
            }
          } as any);
        } else {
          const notification = new Notification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            silent: false,
          } as any);
          notification.onclick = () => {
            window.focus();
            notification.close();
            if (data?.url) window.location.href = data.url;
          };
        }
      } catch (err) {
        console.error('Error showing native notification:', err);
      }
    }

    async function setup() {
      // 1. Setup Firebase Messaging (FCM)
      const token = await requestNotificationPermission();
      if (token) {
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
          
          showNativeNotification(title, body, payload.data);
          
          toast(body, { 
            icon: '🔔', 
            duration: 6000,
          });
        });
      }

      // 2. Setup Supabase Realtime Listener as fallback/parallel method
      // This ensures table-based notifications also trigger alerts globally
      const channelName = `global-notif-${user.id}`;
      supabaseChannel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('[Supabase] New notification received:', payload.new);
          const title = payload.new.title || 'Mr. Krab 🦀';
          const body = payload.new.body || 'You have a new update';
          
          showNativeNotification(title, body, { id: payload.new.id, url: '/notifications' });
          
          toast(body, { 
            icon: '🔔', 
            duration: 6000,
          });
        })
        .subscribe();
    }

    setup();

    return () => {
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [user]);
}
