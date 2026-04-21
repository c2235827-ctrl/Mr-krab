import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { formatRelative } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Tag, Info, ArrowLeft, CheckCircle2, MoreVertical, Trash2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-notif-count'] });
        toast(`🔔 ${payload.new.title}`, { duration: 5000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Fetch Notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Mark all as read mutation
  const markAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification removed');
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update': return <ShoppingBag size={20} className="text-primary" />;
      case 'promo': return <Tag size={20} className="text-accent" />;
      default: return <Info size={20} className="text-muted" />;
    }
  };

  if (isLoading) return <div className="p-10 text-center">Checking your crab alerts...</div>;

  return (
    <div className="p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black italic">Alerts 🦀</h1>
        <button 
          onClick={() => markAsRead.mutate()}
          className="p-3 bg-white rounded-2xl shadow-sm text-accent active:opacity-75 transition-opacity"
        >
          <CheckCircle2 size={24} />
        </button>
      </div>

      {notifications?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
            <Bell size={48} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">Staying Quiet</h3>
          <p className="text-muted">No new alerts yet. We'll ping you here for order updates!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {notifications?.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "bg-white p-5 rounded-[32px] shadow-sm flex gap-4 transition-all relative group",
                  !notif.is_read && "border-l-4 border-accent pl-4"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <h4 className={cn("font-bold text-sm", !notif.is_read ? "text-primary" : "text-muted")}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-tight">
                      {formatRelative(new Date(notif.created_at), new Date()).replace('at', '')}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                </div>
                <button 
                  onClick={() => deleteNotification.mutate(notif.id)}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 bg-red-50 text-red-500 rounded-full transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
