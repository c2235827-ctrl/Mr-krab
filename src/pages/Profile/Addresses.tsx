import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Heart, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { Address } from '../../types';

export default function Addresses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted');
    }
  });

  const setAsDefault = useMutation({
    mutationFn: async (id: string) => {
      // 1. Reset all to false
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user?.id);
      // 2. Set target to true
      const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    }
  });

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return <Home size={20} />;
    if (l.includes('work') || l.includes('office')) return <Briefcase size={20} />;
    return <Heart size={20} />;
  };

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8 mb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black italic">My Addresses</h1>
        </div>
        <button className="p-3 bg-primary text-white rounded-2xl shadow-lg active:scale-95 transition-transform">
           <Plus size={24} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : addresses?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
            <MapPin size={48} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No addresses yet</h3>
          <p className="text-muted mb-8">Add your delivery location to get your catches faster! 🦀</p>
          <button className="btn-primary w-full max-w-[200px]">Add Address</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses?.map((addr) => (
            <div 
              key={addr.id}
              className={cn(
                "bg-white p-5 rounded-[32px] shadow-sm flex items-center justify-between border-2 transition-all",
                addr.is_default ? "border-accent/10 bg-accent/5" : "border-transparent"
              )}
            >
              <div className="flex items-center gap-4 flex-1" onClick={() => !addr.is_default && setAsDefault.mutate(addr.id)}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  addr.is_default ? "bg-accent text-white" : "bg-card text-muted"
                )}>
                  {getIcon(addr.label)}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-sm tracking-tight">{addr.label}</h4>
                  <p className="text-xs text-muted line-clamp-1">{addr.street}, {addr.city}</p>
                  {addr.is_default && <span className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">Default 🦀</span>}
                </div>
              </div>
              <button 
                onClick={() => deleteAddress.mutate(addr.id)}
                className="p-3 text-muted hover:text-red-500 active:scale-90 transition-all ml-4"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
