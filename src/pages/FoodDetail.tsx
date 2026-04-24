import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Star, Clock, Minus, Plus, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';

export default function FoodDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  
  const [quantity, setQuantity] = useState(1);

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

  const { data: ratingData } = useQuery({
    queryKey: ['item-rating', item?.id],
    enabled: !!item?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('menu_item_id', item!.id);
      if (!data || data.length === 0) return { avg: null, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg: avg.toFixed(1), count: data.length };
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!item) return <div className="p-10 text-center">Item not found</div>;

  const currentPrice = item.discount_price || item.price;
  const total = currentPrice * quantity;

  const handleAddToCart = () => {
    addItem({
      menuItem: item,
      quantity,
    });
    toast.success('Added to cart!');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-bg pb-44">
      {/* Top Bar Overlay */}
      <div className="fixed top-0 left-0 right-0 z-[110] p-6 flex justify-between items-center max-w-md mx-auto">
        <button 
          onClick={() => navigate('/home')}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: item.name,
                  text: item.description,
                  url: window.location.href,
                });
              } catch (err: any) {
                // Ignore user cancellation errors
                if (err.name !== 'AbortError') {
                  toast.error('Could not share. Link copied instead!');
                  navigator.clipboard.writeText(window.location.href);
                }
              }
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Share link copied!');
            }
          }}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
        >
          <Share2 size={24} />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative w-full aspect-[4/5] max-h-[500px] overflow-hidden">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-bg" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-6 py-8"
      >
        {/* Info Header */}
        <div className="relative mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-2">
              <span className="text-accent text-[11px] font-black uppercase tracking-[0.2em] px-0 py-0 bg-transparent rounded-none w-fit">
                {item.tags?.[0] || 'CRAB SPECIAL'}
              </span>
              <h1 className="text-5xl font-serif font-black italic leading-[0.9] mt-1">{item.name}</h1>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-4xl font-black text-accent">{formatCurrency(currentPrice)}</span>
            {item.discount_price && (
              <div className="flex items-center gap-2">
                <span className="text-xl text-muted line-through font-bold">{formatCurrency(item.price)}</span>
                <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-black italic uppercase">
                  {Math.round(((item.price - item.discount_price) / item.price) * 100)}% 
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 py-8 border-y border-gray-200/60 mb-8">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center border border-gray-100">
                  <Clock size={20} className="text-muted" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-black uppercase tracking-wider">Ready In</span>
                  <span className="text-sm font-bold">~{item.prep_time_minutes} mins</span>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Star size={20} className="text-[#FFB800]" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-black uppercase tracking-wider">Rating</span>
                  <span className="text-sm font-bold">{ratingData?.avg ?? '—'} ({ratingData?.count ?? 0})</span>
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-4">The Secret Recipe</h3>
            <p className="text-lg text-primary/80 leading-relaxed font-medium">
              {item.description}
            </p>
          </div>

          {/* Ingredients */}
          {(item.allergens?.length > 0 || item.tags?.length > 0) && (
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-4">Core Ingredients</h3>
              <div className="flex flex-wrap gap-3">
                {(item.allergens?.length > 0 ? item.allergens : item.tags)?.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-sm font-bold capitalize">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[120] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Total Price</span>
              <span className="text-3xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-gray-100">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-white rounded-xl transition-colors text-primary active:scale-95"
              >
                <Minus size={20} />
              </button>
              <span className="text-lg font-black w-10 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 flex items-center justify-center hover:bg-white rounded-xl transition-colors text-accent active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="w-full bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all h-[72px] rounded-[24px] flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="font-black italic text-xl text-white uppercase tracking-wider relative z-10">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
