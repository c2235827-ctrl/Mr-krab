import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { handleSupabaseError } from '../lib/error-handler';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Give Supabase a moment to parse the hash from the URL
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
        setIsVerifying(false);
      } else {
        // If no session found immediately, wait for the state change event
        // which is how recovery hashes are often processed
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        setIsVerifying(false);
      }
    });

    // Timeout after 5 seconds if no session is detected
    const timeout = setTimeout(() => {
      if (isVerifying) {
        setIsVerifying(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [isVerifying]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully! Please sign in.');
      // Sign out to force re-login with new password for safety
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (error: any) {
      handleSupabaseError(error, 'Reset Password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-12 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <button 
        onClick={() => navigate('/auth')}
        className="mb-8 p-2 rounded-full hover:bg-white transition-colors self-start"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2 italic">Reset Password</h1>
        <p className="text-muted text-lg">
          {isVerifying ? 'Verifying your link...' : 
           hasSession ? 'Enter your new secure password below.' : 
           'This reset link is invalid or has expired.'}
        </p>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="animate-spin text-accent" size={40} />
        </div>
      ) : hasSession ? (
        <form onSubmit={handleReset} className="flex flex-col gap-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="password"
              placeholder="New Password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:opacity-75 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:opacity-75 flex items-center justify-center gap-2"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </div>
  );
}
