import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Plus, Star, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, MenuItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const addItem = useCartStore((state) => state.addItem);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notif-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return data || [];
    },
  });

  const { data: popularItems } = useQuery<MenuItem[]>({
    queryKey: ['menu-popular'],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_popular', true)
        .eq('is_available', true)
        .limit(10);
      return data || [];
    },
  });

  const { data: featuredItems } = useQuery<MenuItem[]>({
    queryKey: ['menu-featured'],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_featured', true)
        .eq('is_available', true)
        .limit(5);
      return data || [];
    },
  });

  const { data: items } = useQuery<MenuItem[]>({
    queryKey: ['menu-items', activeCategory],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*').eq('is_available', true);
      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }
      const { data } = await query.order('name');
      return data || [];
    },
  });

  const { data: discountItems } = useQuery<MenuItem[]>({
    queryKey: ['menu-discounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .not('discount_price', 'is', null)
        .eq('is_available', true)
        .limit(4);
      return data || [];
    },
  });

  const { data: activePromos } = useQuery({
    queryKey: ['active-promos'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', now)
        .or('valid_until.is.null,valid_until.gt.' + now)
        .order('created_at', { ascending: false });
      
      // Filter out promos that have reached their max uses
      return (data || []).filter(p => !p.max_uses || p.uses_count < p.max_uses);
    },
  });

  const mainPromo = activePromos?.[0];

  return (
    <div className="flex flex-col gap-8 p-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-card overflow-hidden border-2 border-white shadow-sm">
            <img 
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'Mr'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Good Day</p>
            <h3 className="font-serif text-lg leading-tight italic font-black">Ready for a Feast? 🥩</h3>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link to="/notifications" className="p-3 bg-white rounded-2xl shadow-sm relative active:scale-95 transition-transform">
            <Bell size={20} />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount! > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Promotional Billboard - DYNAMIC ROLL */}
      {activePromos && activePromos.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="horizontal-scroll gap-4 pb-2 -mx-6 px-6">
            {activePromos.map((promo) => (
              <div 
                key={promo.id}
                className="relative min-w-[280px] max-w-[280px] h-48 rounded-[32px] overflow-hidden bg-primary shadow-xl flex items-center p-6 group transition-all"
              >
                <div className="relative z-20 flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent">Special Offer</span>
                    <div className="h-[1px] w-6 bg-accent/30" />
                  </div>
                  
                  <div className="flex flex-col gap-0 mb-1">
                    <span className="text-3xl font-serif font-black text-white italic leading-none">
                      {promo.discount_type === 'percentage' ? `${Number(promo.discount_value)}%` : formatCurrency(Number(promo.discount_value))}
                    </span>
                    <span className="text-[10px] font-serif font-black text-accent italic">OFF YOUR ORDER</span>
                  </div>

                  <h2 className="text-[10px] font-bold text-white/90 leading-tight line-clamp-2">
                    {promo.title}
                  </h2>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                       <p className="text-white text-[8px] font-black uppercase tracking-widest">
                         CODE: <span className="text-accent">{promo.code}</span>
                       </p>
                    </div>
                    <button 
                      className="bg-accent text-white px-3 py-1.5 rounded-lg font-black text-[8px] uppercase shadow-lg shadow-accent/20 active:scale-95 transition-transform"
                    >
                      Use
                    </button>
                  </div>
                </div>
                
                {/* Image background with better visibility */}
                <div className="absolute right-0 top-0 bottom-0 w-3/5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/60 to-primary z-10" />
                    <img 
                      src={(promo as any).image_url || "https://images.unsplash.com/photo-1559739511-e12772a1cfdf?w=600&auto=format"} 
                      alt="Promo" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-40 group-hover:opacity-60"
                      referrerPolicy="no-referrer"
                    />
                </div>

                {/* Abstract Decorative Elements */}
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 -right-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Meals - Always Shown */}
      {popularItems && popularItems.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black italic">Popular Meals</h2>
            <Link to="/search" className="text-accent text-[10px] font-black uppercase tracking-widest bg-accent/5 px-4 py-2 rounded-full">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 pb-4">
            {popularItems.map((item) => (
              <div key={item.id} className="w-full">
                <MenuCard 
                  item={item} 
                  onAdd={() => {
                    addItem({ menuItem: item, quantity: 1 });
                    toast.success(`${item.name} added!`);
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Items / Chef's Selection - Always Shown */}
      {featuredItems && featuredItems.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-black italic">Chef's Selection</h2>
          <div className="flex flex-col gap-4 pb-4">
            {featuredItems.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic">Categories</h2>
            {activeCategory !== 'all' && (
              <button 
                onClick={() => setActiveCategory('all')}
                className="text-[10px] font-black uppercase text-accent tracking-widest bg-accent/10 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <X size={10} /> Reset
              </button>
            )}
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-5 py-2.5 rounded-[20px] text-xs font-bold transition-all whitespace-nowrap border-2",
              activeCategory === 'all' ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-gray-100 text-primary hover:border-accent/20"
            )}
          >
            All Items
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-[20px] text-xs font-bold transition-all whitespace-nowrap border-2",
                activeCategory === cat.id ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-gray-100 text-primary hover:border-accent/20"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Menu Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic">
            {activeCategory === 'all' ? 'Our Menu' : categories?.find(c => c.id === activeCategory)?.name}
          </h2>
        </div>
        
        {items?.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-[40px] opacity-50">
            <span className="text-4xl">🥩</span>
            <p className="text-xs font-black uppercase tracking-widest mt-4">Coming Soon to this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {items?.map((item) => (
              <div key={item.id} className="w-full">
                <MenuCard 
                  item={item} 
                  onAdd={() => {
                    addItem({ menuItem: item, quantity: 1 });
                    toast.success(`${item.name} added!`);
                  }} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special Items */}
      {discountItems && discountItems.length > 0 && activeCategory === 'all' && (
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-black italic">Special For You 🥩</h2>
          <div className="flex flex-col gap-4 pb-4">
            {discountItems.map((item) => (
              <DiscountCard 
                key={item.id}
                item={item} 
                onAdd={() => {
                  addItem({ menuItem: item, quantity: 1 });
                  toast.success(`${item.name} added!`);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ item }: { item: MenuItem; key?: string }) {
  const { data: ratingData } = useQuery({
    queryKey: ['item-rating', item.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('menu_item_id', item.id);
      if (!data || data.length === 0) return { avg: null, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg: avg.toFixed(1), count: data.length };
    }
  });

  return (
    <Link 
      to={`/item/${item.slug}`}
      className="relative w-full h-38 bg-white rounded-[32px] p-4 shadow-sm flex items-center gap-4 overflow-hidden group active:scale-95 transition-transform"
    >
      {/* Small Image with Badge */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-card shrink-0 relative z-10 shadow-md">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
          referrerPolicy="no-referrer"
        />
        {item.discount_price && (
          <div className="absolute top-1 right-1 bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-[6px] font-black italic shadow-lg">
            -{Math.round(((item.price - item.discount_price) / item.price) * 100)}%
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="flex items-center gap-0.5 text-[#FFB800]">
            <Star size={8} fill="currentColor" />
            <span className="text-[8px] font-black text-primary">{ratingData?.avg || '5.0'}</span>
          </div>
          <span className="text-[6px] text-muted font-bold uppercase tracking-widest bg-card px-1.5 py-0.5 rounded-full">Chef Choice</span>
        </div>
        
        <h3 className="font-serif text-sm font-black italic leading-tight line-clamp-2 text-primary mb-1">
          {item.name}
        </h3>

        <div className="flex items-center gap-1">
           <span className="text-base font-black text-accent">{formatCurrency(item.discount_price || item.price)}</span>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-accent/5 rounded-full blur-xl group-hover:bg-accent/10 transition-colors" />
    </Link>
  );
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  const { data: ratingData } = useQuery({
    queryKey: ['item-rating', item.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('menu_item_id', item.id);
      if (!data || data.length === 0) return { avg: null, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg: avg.toFixed(1), count: data.length };
    }
  });

  return (
    <div className="bg-white rounded-[32px] p-4 shadow-sm flex flex-col gap-4 group relative overflow-hidden active:scale-95 transition-transform">
      <Link to={`/item/${item.slug}`} className="flex flex-col gap-4">
        <div className="aspect-square rounded-[28px] overflow-hidden bg-card relative">
          <img 
            src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          {item.discount_price && (
            <div className="absolute top-3 left-3 bg-accent text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-accent/20">
              {Math.round(((item.price - item.discount_price) / item.price) * 100)}% OFF
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Star size={10} className="text-[#FFB800]" fill="currentColor" />
            <span className="text-[10px] font-black text-primary">{ratingData?.avg || '4.9'}</span>
          </div>
        </div>
        <div className="flex flex-col px-1">
          <h4 className="font-serif font-black text-base italic leading-tight truncate mb-1">{item.name}</h4>
          <div className="flex items-center justify-between">
            <span className="text-accent text-base font-black">{formatCurrency(item.discount_price || item.price)}</span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

function DiscountCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  const discountPercent = Math.round(((item.price - item.discount_price!) / item.price) * 100);
  
  return (
    <Link to={`/item/${item.slug}`} className="flex items-center gap-4 bg-white p-4 rounded-[28px] shadow-sm relative overflow-hidden group active:scale-[0.98] transition-transform">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-card shrink-0 shadow-inner relative">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-1 right-1 bg-accent text-white w-7 h-7 rounded-full flex items-center justify-center text-[7px] font-black italic shadow-lg">
          -{discountPercent}%
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-[9px] font-black text-accent uppercase tracking-widest mb-0.5 italic">Special Deal</span>
        <h4 className="font-serif font-black text-lg leading-tight truncate text-primary">{item.name}</h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-black text-accent">{formatCurrency(item.discount_price!)}</span>
          <span className="text-[10px] text-muted line-through font-bold">{formatCurrency(item.price)}</span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); onAdd(); }} 
        className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
      >
        <Plus size={20} />
      </button>
    </Link>
  );
}
