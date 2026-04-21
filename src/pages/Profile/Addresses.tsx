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
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8 mb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black italic">My Addresses</h1>
        </div>
        <button 
          onClick={() => setIsAddingAddress(true)}
          className="p-3 bg-primary text-white rounded-2xl shadow-lg active:opacity-80 transition-opacity"
        >
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
          <p className="text-muted mb-8">Add your delivery location to get your food faster! 🦀</p>
          <button 
            onClick={() => setIsAddingAddress(true)}
            className="btn-primary w-full max-w-[200px]"
          >
            Add Address
          </button>
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
                className="p-3 text-muted hover:text-red-500 active:opacity-75 transition-opacity ml-4"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddingAddress && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingAddress(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic">New Address 🦀</h2>
                <button onClick={() => setIsAddingAddress(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex gap-3">
                  {['Home', 'Work', 'Other'].map(l => (
                    <button
                      key={l}
                      onClick={() => setNewAddress(prev => ({ ...prev, label: l }))}
                      className={cn(
                        "flex-1 py-3 rounded-2xl font-bold border-2 transition-all",
                        newAddress.label === l ? "border-primary bg-primary text-white" : "border-gray-100 bg-white"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full bg-bg border-none py-4 px-6 rounded-2xl focus:ring-2 focus:ring-accent/20"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-bg border-none py-4 px-6 rounded-2xl focus:ring-2 focus:ring-accent/20"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-bg border-none py-4 px-6 rounded-2xl focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full bg-bg border-none py-4 px-6 rounded-2xl focus:ring-2 focus:ring-accent/20"
                  />
                  
                  <label className="flex items-center gap-3 mt-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span className="text-sm font-bold text-muted group-hover:text-primary transition-colors">Set as default location</span>
                  </label>
                </div>

                <button 
                  onClick={() => addAddress.mutate()}
                  disabled={addAddress.isPending || !newAddress.street || !newAddress.city}
                  className="btn-primary w-full py-5 disabled:opacity-50 mt-4 h-[64px]"
                >
                  {addAddress.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Save Address'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
