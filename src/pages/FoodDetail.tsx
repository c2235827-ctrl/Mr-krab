import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MenuItem, MenuItemVariant, Addon } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Star, Clock, Minus, Plus, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';

export default function FoodDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  // Fetch Item
  const { data: item, isLoading } = useQuery<MenuItem>({
    queryKey: ['menu-item', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch Variants
  const { data: variants } = useQuery<MenuItemVariant[]>({
    queryKey: ['item-variants', item?.id],
    enabled: !!item?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', item?.id)
        .eq('is_available', true);
      return data || [];
    },
  });

  useEffect(() => {
    if (variants && Array.isArray(variants) && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  // Fetch Addons
  const { data: addons } = useQuery<Addon[]>({
    queryKey: ['item-addons', item?.id],
    enabled: !!item?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_item_addons')
        .select('addons(*)')
        .eq('menu_item_id', item?.id);
      return (data?.map(d => (d as any).addons) as Addon[]) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!item) return <div className="p-10 text-center">Item not found</div>;

  const currentPrice = (item.discount_price || item.price) + (selectedVariant?.price_modifier || 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const total = (currentPrice + addonsTotal) * quantity;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev => 
      prev.find(a => a.id === addon.id) 
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    addItem({
      menuItem: item,
      variant: selectedVariant,
      selectedAddons,
      quantity,
    });
    toast.success('Added to cart!');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Top Bar Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-md mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <Share2 size={24} />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative w-full aspect-[4/5] max-h-[500px] overflow-hidden">
        <img 
          src={item.image_url || undefined} 
          alt={item.name} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-bg" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-8 -mt-10 relative z-10"
      >
        {/* Info Header */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-accent text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-accent/10 rounded-full w-fit">
                {item.tags?.[0] || 'CRAB SPECIAL'}
              </span>
              <h1 className="text-4xl font-serif font-black italic leading-none mt-2">{item.name}</h1>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-[#FFB800]">
                <Star size={18} fill="currentColor" />
                <span className="text-primary font-black">4.9</span>
              </div>
              <span className="text-xs text-muted">(120+ reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-black text-accent">{formatCurrency(currentPrice)}</span>
            {item.discount_price && (
              <span className="text-lg text-muted line-through font-bold">{formatCurrency(item.price + (selectedVariant?.price_modifier || 0))}</span>
            )}
          </div>

          <div className="flex items-center gap-6 py-4 border-y border-gray-100 mb-6">
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                  <Clock size={20} className="text-muted" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Ready In</span>
                  <span className="text-sm font-bold">~{item.prep_time_minutes} mins</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                  <Star size={20} className="text-[#FFB800]" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Rating</span>
                  <span className="text-sm font-bold">4.9 / 5</span>
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-black italic mb-2">The Secret Behind it</h3>
            <p className="text-muted leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Ingredients/Allergens */}
          <div className="mb-8">
            <h3 className="text-lg font-black italic mb-4">Core Ingredients</h3>
            <div className="flex flex-wrap gap-4">
               {['Seaweed', 'Fresh Crab', 'Avocado', 'Vinegar'].map((ing, i) => (
                 <div key={i} className="flex items-center gap-2 bg-card pl-1 pr-4 py-1 rounded-full border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
                      {['🍙', '🦀', '🥑', '🍶'][i]}
                    </div>
                    <span className="text-sm font-bold">{ing}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Variants Selector */}
          {variants && variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-black italic mb-4">Choose Size</h3>
              <div className="flex gap-4">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "flex-1 py-3 rounded-2xl border-2 transition-all font-bold",
                      selectedVariant?.id === v.id 
                        ? "border-primary bg-primary text-white" 
                        : "border-gray-100 bg-white text-muted"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Addons Checklist */}
          {addons && addons.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-black italic mb-4">Add Extra Toppings</h3>
              <div className="flex flex-col gap-3">
                {addons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      selectedAddons.find(a => a.id === addon.id)
                        ? "border-accent bg-accent/5"
                        : "border-gray-100 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                        selectedAddons.find(a => a.id === addon.id) ? "bg-accent border-accent" : "border-gray-200"
                      )}>
                        {selectedAddons.find(a => a.id === addon.id) && <Plus size={14} className="text-white" />}
                      </div>
                      <span className="font-bold">{addon.name}</span>
                    </div>
                    <span className="text-accent font-black">+{formatCurrency(addon.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-2xl">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-primary"
            >
              <Minus size={20} />
            </button>
            <span className="text-xl font-black w-6 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center text-accent"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="flex-1 btn-primary flex items-center justify-between"
          >
            <span>Add to Cart</span>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
