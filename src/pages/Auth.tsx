import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, ArrowLeft, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back! 🦀');
        navigate('/home');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <button 
        onClick={() => navigate('/')}
        className="mb-8 p-2 rounded-full hover:bg-white transition-colors self-start"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2 italic">
          {isLogin ? 'Welcome Back' : 'Join the Family'}
        </h1>
        <p className="text-muted text-lg">
          {isLogin ? 'Fresh seafood is just a tap away.' : 'Start your seafood journey with Mr. Krab.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="flex-1 flex flex-col gap-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="tel"
                  placeholder="Phone (e.g. +234...)"
                  required={!isLogin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        {isLogin && (
          <button type="button" className="text-sm font-semibold text-accent self-end">
            Forgot Password?
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
        </button>

        <div className="mt-8 text-center">
          <p className="text-muted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-accent"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
