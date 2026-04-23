import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, ClipboardList, User, ShoppingCart, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCartStore, getTotalItems } from '../store/useCartStore';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: ClipboardList, label: 'Orders', path: '/orders' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function Layout() {
  const location = useLocation();
  const items = useCartStore((state) => state.items);
  const totalItems = getTotalItems(items);
  
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notif-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  // Hide bottom nav on specific screens if needed (e.g. food detail)
  const isDetailScreen = location.pathname.startsWith('/item/');
  const isCartScreen = location.pathname === '/cart' || location.pathname === '/checkout';

  return (
    <div className="min-h-screen bg-bg">
      {/* Main Content */}
      <main className="max-w-md mx-auto min-h-screen relative bg-bg shadow-sm pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Cart Button (only if not on cart/checkout and has items) */}
      {!isCartScreen && !isDetailScreen && totalItems > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <NavLink
            to="/cart"
            className="flex items-center gap-2 bg-accent text-white px-4 py-3 rounded-full shadow-xl"
          >
            <ShoppingCart size={20} />
            <span className="font-bold">{totalItems}</span>
          </NavLink>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      {!isCartScreen && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => 
                    cn(
                      "flex flex-col items-center gap-1 transition-colors relative",
                      isActive ? "text-primary" : "text-muted"
                    )
                  }
                >
                  <div className="relative">
                    <Icon size={24} className={cn("transition-transform", isActive && "scale-110")} />
                    {label === 'Alerts' && (unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount! > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
