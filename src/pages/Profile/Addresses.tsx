import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Heart, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { Address } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Addresses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home', street: '', city: 'Lagos', state: 'Lagos', landmark: '', is_default: false
  });

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

  const addAddress = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('addresses').insert([{
        ...newAddress,
        user_id: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added!');
      setIsAddingAddress(false);
      setNewAddress({ label: 'Home', street: '', city: 'Lagos', state: 'Lagos', landmark: '', is_default: false });
    },
    onError: (err: any) => toast.error(err.message)
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
    <div className="flex flex-col mb-20 bg-bg">
      {/* Header - Fixed Height & Solid Background */}
      <div className="h-24 shrink-0 px-6 flex items-center justify-between sticky top-0 bg-bg z-20 border-b border-gray-100/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-all">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black italic">Saved Locations</h1>
        </div>
        <button 
          onClick={() => setIsAddingAddress(true)}
          className="p-3 bg-accent text-white rounded-2xl shadow-lg active:scale-90 transition-all"
        >
           <Plus size={24} />
        </button>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="animate-spin text-accent" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Locating your spots...</p>
          </div>
        ) : addresses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-40 h-40 bg-card rounded-[48px] flex items-center justify-center mb-8 shadow-inner">
              <MapPin size={64} className="text-muted/30" />
            </div>
            <h3 className="text-2xl font-black italic mb-2">No spots saved yet</h3>
            <p className="text-muted text-sm font-medium mb-12 max-w-[240px] mx-auto leading-relaxed">Add your home or office address to make ordering as fast as a racing crab! 🦀</p>
            <button 
              onClick={() => setIsAddingAddress(true)}
              className="btn-primary w-full max-w-[240px] h-16"
            >
              Add New Address
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">{addresses.length} SAVED ADDRESSES</span>
            </div>
            {addresses?.map((addr) => (
              <motion.div 
                layout
                key={addr.id}
                className={cn(
                  "bg-white p-6 rounded-[34px] shadow-sm flex items-center justify-between border-2 transition-all cursor-pointer group",
                  addr.is_default ? "border-accent/10 bg-white" : "border-transparent"
                )}
                onClick={() => !addr.is_default && setAsDefault.mutate(addr.id)}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={cn(
                    "w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 transition-all",
                    addr.is_default ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-card text-muted group-hover:bg-accent/5"
                  )}>
                    {getIcon(addr.label)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-serif font-black text-lg italic tracking-tight flex items-center gap-2">
                       {addr.label}
                       {addr.is_default && <span className="text-[8px] bg-accent text-white px-1.5 py-0.5 rounded-full not-italic">DEFAULT</span>}
                    </h4>
                    <p className="text-xs text-muted font-medium truncate mt-0.5">{addr.street}</p>
                    <p className="text-[10px] text-muted/60 font-medium uppercase tracking-wider mt-1">{addr.city}, {addr.state}</p>
                  </div>
                </div>
                {!addr.is_default && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteAddress.mutate(addr.id); }}
                    className="p-3 text-muted/30 hover:text-red-500 active:scale-90 transition-all ml-4"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddingAddress && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingAddress(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-[48px] sm:rounded-[48px] p-8 pb-12 relative z-10 shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-serif font-black italic tracking-tight">Add Address 🦀</h2>
                <button onClick={() => setIsAddingAddress(false)} className="p-3 hover:bg-card rounded-full transition-colors font-bold text-muted">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-2">Label your location</span>
                   <div className="flex gap-3">
                    {['Home', 'Work', 'Other'].map(l => (
                      <button
                        key={l}
                        onClick={() => setNewAddress(prev => ({ ...prev, label: l }))}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-black italic text-sm border-4 transition-all active:scale-95",
                          newAddress.label === l ? "border-primary/5 bg-primary text-white shadow-xl shadow-primary/20" : "border-gray-100 bg-white text-muted hover:border-accent/10"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-2">Address details</span>
                    <input
                      type="text"
                      placeholder="Street Address or Building Name"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full bg-card border-none py-5 px-6 rounded-3xl focus:ring-4 focus:ring-accent/10 font-bold placeholder:text-muted/40 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-card border-none py-5 px-6 rounded-3xl focus:ring-4 focus:ring-accent/10 font-bold placeholder:text-muted/40 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-card border-none py-5 px-6 rounded-3xl focus:ring-4 focus:ring-accent/10 font-bold placeholder:text-muted/40 transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Landmark (Optional e.g. blue gate)"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full bg-card border-none py-5 px-6 rounded-3xl focus:ring-4 focus:ring-accent/10 font-bold placeholder:text-muted/40 transition-all"
                  />
                  
                  <label className="flex items-center gap-4 mt-2 cursor-pointer group p-2">
                    <input
                      type="checkbox"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="w-6 h-6 rounded-lg border-gray-300 text-accent focus:ring-accent transition-all cursor-pointer"
                    />
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-primary group-hover:text-accent transition-colors">Set as Primary</span>
                       <span className="text-[10px] text-muted font-medium">Use this for all future orders by default.</span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                   <button 
                    onClick={() => addAddress.mutate()}
                    disabled={addAddress.isPending || !newAddress.street || !newAddress.city}
                    className="btn-primary w-full h-20 text-lg shadow-xl shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {addAddress.isPending ? <Loader2 className="animate-spin" /> : (
                      <>
                        <MapPin size={24} />
                        Confirm Location
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsAddingAddress(false)}
                    className="w-full py-4 text-xs font-black text-muted uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
