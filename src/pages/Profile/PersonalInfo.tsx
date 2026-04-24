import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { profile, user, setAuth } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setAuth(user, data);
      toast.success('Information updated successfully! 🦀');
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg flex flex-col">
      {/* Header */}
      <div className="h-24 px-6 flex items-center gap-4 bg-bg sticky top-0 z-20 border-b border-gray-100/50">
        <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Personal Profile</h1>
      </div>

      <form onSubmit={handleSave} className="p-6 flex flex-col gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl relative bg-card">
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'Mr'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[48px]">
               <span className="text-white text-[10px] font-black uppercase tracking-widest">Coming Soon</span>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Tap to change avatar</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-card py-5 pl-12 pr-4 rounded-3xl focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all font-bold text-primary placeholder:text-muted/50"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-card py-5 pl-12 pr-4 rounded-3xl focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all font-bold text-primary placeholder:text-muted/50"
                  placeholder="+234 ..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 opacity-80">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full bg-card/50 py-5 pl-12 pr-4 rounded-3xl font-bold italic text-muted cursor-not-allowed border-2 border-transparent"
                />
              </div>
              <p className="text-[10px] text-muted/60 ml-1 italic font-medium">* Email is linked to your account and cannot be changed.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
           <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-[76px] flex items-center justify-center gap-3 text-lg disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                   <Save size={16} />
                </div>
                Save Profile Updates
              </>
            )}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/profile')}
            className="w-full py-4 text-sm font-black text-muted uppercase tracking-widest hover:text-primary transition-colors"
          >
            Cancel Changes
          </button>
        </div>
      </form>
    </div>
  );
}
