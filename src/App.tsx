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
import PersonalInfo from './pages/Profile/PersonalInfo';
import Addresses from './pages/Profile/Addresses';
import MyReviews from './pages/Profile/Reviews';
import Security from './pages/Profile/Security';
import About from './pages/Profile/About';
import PrivacyPolicy from './pages/Profile/PrivacyPolicy';
import Wallet from './pages/Profile/Wallet';
import FoodDetail from './pages/FoodDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Notifications from './pages/Notifications';

// Components
import Layout from './components/Layout';

import { handleSupabaseError } from './lib/error-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry if it's a 404 or something that won't fixed by retrying
        if (error?.status === 404) return false;
        // Retry more for network issues
        if (error?.message?.toLowerCase().includes('failed to fetch')) return failureCount < 3;
        return failureCount < 1;
      },
    },
    mutations: {
      onError: (error: any) => {
        handleSupabaseError(error);
      }
    }
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  return <>{children}</>;
}

export default function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [configError, setConfigError] = React.useState<string | null>(null);

  useEffect(() => {
    try {
      // Initial session check
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('refresh_token_not_found') || 
              errMsg.includes('refresh token not found') || 
              errMsg.includes('invalid refresh token') ||
              errMsg.includes('invalid_grant')) {
            console.warn('Session expired or invalid, clearing local state...');
            // Use window.localStorage.clear() as a fallback to ensure everything is wiped
            window.localStorage.removeItem('supabase.auth.token');
            supabase.auth.signOut().finally(() => {
              setAuth(null, null);
              window.location.href = '/auth';
            });
            return;
          }
          throw error;
        }

        if (session) {
          fetchProfile(session.user.id, session.user);
        } else {
          setAuth(null, null);
        }
      }).catch(err => {
        const errMsg = err.message?.toLowerCase() || '';
        if (errMsg.includes('supabase configuration missing')) {
          setConfigError(err.message);
        } else if (errMsg.includes('failed to fetch')) {
          setConfigError('Could not connect to the server. Please check your internet connection.');
        } else if (
          errMsg.includes('refresh_token_not_found') || 
          errMsg.includes('refresh token not found') || 
          errMsg.includes('invalid refresh token')
        ) {
          supabase.auth.signOut().finally(() => setAuth(null, null));
        } else {
          console.error('Session check error:', err);
          setAuth(null, null);
        }
      });

      // Auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setAuth(null, null);
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            console.log('Session token refreshed');
          }

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
            <Route path="/profile/personal-info" element={<PersonalInfo />} />
            <Route path="/profile/addresses" element={<Addresses />} />
            <Route path="/profile/reviews" element={<MyReviews />} />
            <Route path="/profile/security" element={<Security />} />
            <Route path="/profile/about" element={<About />} />
            <Route path="/profile/wallet" element={<Wallet />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
