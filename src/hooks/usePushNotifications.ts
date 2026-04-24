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
      console.log('[Push] Attempting to show native notification:', { title, body, data });
      
      if (Notification.permission !== 'granted') {
        console.warn('[Push] Notification permission not granted');
        return;
      }
      
      const notifId = data?.id || `${title}-${body}-${Date.now()}`;
      if (seenNotifs.has(notifId)) {
        console.log('[Push] Notification already seen, skipping:', notifId);
        return;
      }
      
      seenNotifs.add(notifId);
      setTimeout(() => seenNotifs.delete(notifId), 30000);

      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => {
          console.warn('[Push] Audio playback failed (likely browser policy):', e);
          // Don't toast here to avoid cluttering if audio fails
        });
      } catch (e) {
        console.warn('[Push] Audio init error:', e);
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] SW Ready for notification');
        
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            tag: notifId,
            renotify: true,
            silent: false,
            data: {
              url: data?.url || '/notifications'
            }
          } as any);
          console.log('[Push] Native SW notification triggered');
        } else {
          console.log('[Push] No SW showNotification support, falling back to new Notification');
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
        console.error('[Push] Error showing native notification:', err);
      }
    }

    async function setup() {
      console.log('[Push] Setting up listeners for user:', user.id);
      
      // 1. Setup Firebase Messaging (FCM)
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('[Push] FCM Token obtained:', token);
          const { error } = await supabase
            .from('push_tokens')
            .upsert({ 
              user_id: user.id, 
              token, 
              platform: 'web',
            }, { onConflict: 'token' });
          
          if (error) console.error('[Push] Failed to save push token to Supabase:', error);
          else console.log('[Push] Push token saved to Supabase');

          onMessage(messaging, (payload) => {
            console.log('[Push] Foreground message (FCM) received:', payload);
            const title = payload.notification?.title || 'Mr. Krab 🦀';
            const body = payload.notification?.body || 'You have a new notification';
            showNativeNotification(title, body, payload.data);
            toast(body, { icon: '🔔', duration: 6000 });
          });
        }
      } catch (err) {
        console.error('[Push] Firebase Messaging setup failed:', err);
      }

      // 2. Setup Unified Supabase Realtime Listener
      const channelName = `push-listener-${user.id}-${Math.floor(Math.random() * 1000)}`;
      console.log('[Push] Subscribing to unified channel:', channelName);
      
      supabaseChannel = supabase.channel(channelName)
        // Listener for personal notifications
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('[Push] New notification (Supabase) inserted:', payload.new);
          const title = payload.new.title || 'Mr. Krab 🦀';
          const body = payload.new.body || 'You have a new update';
          showNativeNotification(title, body, { id: payload.new.id, url: '/notifications' });
          toast(body, { icon: '🔔', duration: 6000 });
        })
        // Listener for global promotions
        .subscribe((status: string) => {
          console.log(`[Push] Unified channel status:`, status);
        });
    }

    setup();

    return () => {
      if (supabaseChannel) {
        console.log('[Push] Removing unified channel...');
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [user]);
}
