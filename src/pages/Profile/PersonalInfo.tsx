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
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Personal Info</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-card py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-card py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                placeholder="+234 ..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 opacity-60">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email Address (ReadOnly)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-card py-4 pl-12 pr-4 rounded-2xl font-bold italic"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-[72px] flex items-center justify-center gap-3 text-lg disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
