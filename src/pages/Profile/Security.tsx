import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function Security() {
  const navigate = useNavigate();
  const { profile, user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // 2. Update with new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully! 🎉');
      
      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg flex flex-col min-h-screen">
      {/* Header */}
      <div className="h-24 px-6 flex items-center gap-4 bg-bg sticky top-0 z-20 border-b border-gray-100/50">
        <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Settings & Security</h1>
      </div>

      <div className="p-6 flex flex-col gap-10">
        {/* Security Settings */}
        <div className="flex flex-col gap-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Update Password</h3>
          
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col gap-5">
              {/* Current Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Existing Password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-bg border border-gray-50 py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-bold"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                  >
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-bg border border-gray-50 py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-bold"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                  >
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Repeat new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg border border-gray-50 py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Other Settings */}
        <div className="flex flex-col gap-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Other Preferences</h3>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
            <div className="w-full flex items-center justify-between p-6 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div className="flex flex-col items-start text-left">
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

            <button 
              onClick={() => navigate('/privacy-policy')}
              className="w-full flex items-center justify-between p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left"
            >
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
