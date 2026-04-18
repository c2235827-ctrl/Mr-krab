import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Shield, Lock, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function Security() {
  const navigate = useNavigate();
  const { profile, user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const toggleBiometric = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ biometric_enabled: !profile?.biometric_enabled })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setAuth(user, data);
      toast.success(`Biometric login ${data.biometric_enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email 🦀');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Privacy & Security</h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* Security Settings */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Security</h3>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
            <button 
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full flex items-center justify-between p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm">Change Password</span>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Update your login credentials</span>
                </div>
              </div>
              {loading ? <Loader2 className="animate-spin text-muted" size={18} /> : <ChevronRight size={18} className="text-muted" />}
            </button>

            <div className="w-full flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm">Biometric Login</span>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">FaceID or Fingerprint</span>
                </div>
              </div>
              <button 
                onClick={toggleBiometric}
                className={cn(
                  "w-12 h-7 rounded-full p-1 transition-colors duration-200",
                  profile?.biometric_enabled ? "bg-accent" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                  profile?.biometric_enabled && "translate-x-5"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Privacy</h3>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/10 text-muted rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Privacy Policy</span>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">How we handle your data</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
