import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';

// Pages - to be created
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Orders from './pages/Orders';
import ProfilePage from './pages/Profile';
import FoodDetail from './pages/FoodDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Notifications from './pages/Notifications';

// Components
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  return <>{children}</>;
}

export default function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [configError, setConfigError] = React.useState<string | null>(null);

  useEffect(() => {
    try {
      // Initial session check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetchProfile(session.user.id, session.user);
        } else {
          setAuth(null, null);
        }
      }).catch(err => {
        if (err.message.includes('Supabase configuration missing')) {
          setConfigError(err.message);
        }
      });

      // Auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            fetchProfile(session.user.id, session.user);
          } else {
            setAuth(null, null);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (err: any) {
      if (err.message.includes('Supabase configuration missing')) {
        setConfigError(err.message);
      } else {
        console.error('Auth initialization error:', err);
      }
    }
  }, [setAuth]);

  async function fetchProfile(userId: string, user: any) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setAuth(user, profile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setAuth(user, null);
    }
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8 text-center">
        <div className="max-w-md bg-white p-8 rounded-[40px] shadow-xl border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-black italic mb-4">Configuration Required</h1>
          <p className="text-muted leading-relaxed mb-8">
            {configError}
          </p>
          <div className="bg-card p-4 rounded-2xl text-left text-xs font-mono break-all opacity-70">
            Check your .env.example for required variables.
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/item/:slug" element={<FoodDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/tracking/:orderId" element={<OrderTracking />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
