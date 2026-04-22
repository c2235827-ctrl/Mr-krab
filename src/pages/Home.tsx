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
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });
      return data || [];
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
            <h3 className="font-serif text-lg leading-tight italic font-black">Ready for a Feast? 🦀</h3>
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

      {/* Hero Search Entry */}
      <div 
        className="relative group active:scale-[0.98] transition-all cursor-pointer" 
        onClick={() => navigate('/explore')}
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-muted" />
        </div>
        <div className="w-full bg-white py-5 pl-12 pr-4 rounded-[28px] text-muted font-black border-2 border-gray-50 group-hover:border-accent transition-all shadow-sm">
          Search for crab, sides...
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-accent text-white p-2.5 rounded-xl shadow-lg">
           <Search size={16} />
        </div>
      </div>

      {/* Promotional Billboard - DYNAMIC */}
      {mainPromo && (
        <div className="flex flex-col gap-4">
          <div className="relative h-48 rounded-[40px] overflow-hidden bg-primary shadow-2xl flex items-center justify-between p-8 group">
            <div className="relative z-10 flex flex-col gap-2 max-w-[60%]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Special Offer</span>
              <h2 className="text-2xl font-serif font-black text-white leading-tight italic line-clamp-2">
                {mainPromo.title} 🏎️
              </h2>
              <p className="text-white/60 text-[10px] font-medium leading-relaxed line-clamp-2">
                Use code <span className="text-accent font-black">{mainPromo.code}</span> to get {mainPromo.discount_type === 'percentage' ? `${mainPromo.discount_value}%` : `₦${mainPromo.discount_value}`} off.
              </p>
              <button 
                onClick={() => navigate('/explore')}
                className="bg-accent text-white px-6 py-2 rounded-full font-black text-[10px] uppercase mt-2 w-fit active:scale-95 transition-transform"
              >
                Claim Now
              </button>
            </div>
            
            <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/80 to-primary z-10" />
                <img 
                  src={(mainPromo as any).image_url || "https://images.unsplash.com/photo-1559739511-e12772a1cfdf?w=600&auto=format"} 
                  alt="Promo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
            </div>

            <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
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
        <div className="horizontal-scroll gap-4 pb-2 -mx-6 px-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-6 py-3 rounded-[20px] text-sm font-bold transition-all whitespace-nowrap border-2",
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
                "px-6 py-3 rounded-[20px] text-sm font-bold transition-all whitespace-nowrap border-2",
                activeCategory === cat.id ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-gray-100 text-primary hover:border-accent/20"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Items - Only on 'All' */}
      {featuredItems && featuredItems.length > 0 && activeCategory === 'all' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-black italic">Chef's Selection</h2>
          <div className="horizontal-scroll gap-6 -mx-6 px-6 pb-4">
            {featuredItems.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Grid of Items */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic">
            {activeCategory === 'all' ? 'Popular Menu' : categories?.find(c => c.id === activeCategory)?.name}
          </h2>
          {activeCategory === 'all' && (
            <Link to="/explore" className="text-accent font-bold text-[10px] uppercase tracking-widest">See More</Link>
          )}
        </div>
        
        {items?.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-[40px] opacity-50">
            <span className="text-4xl">🦀</span>
            <p className="text-xs font-black uppercase tracking-widest mt-4">Coming Soon to this category</p>
          </div>
        ) : (
          <div className="horizontal-scroll gap-4 -mx-6 px-6 pb-4">
            {items?.map((item) => (
              <div key={item.id} className="min-w-[170px] max-w-[170px] snap-center">
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
          <h2 className="text-2xl font-black italic">Special For You 🦀</h2>
          <div className="flex flex-col gap-4">
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
  return (
    <div className="relative min-w-[300px] h-40 bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-4 overflow-hidden snap-center group">
      {/* Rectangular Image */}
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-card shrink-0 relative z-10 shadow-md">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10">
        <div className="flex items-center gap-1 text-[#FFB800] mb-1">
          <Star size={10} fill="currentColor" />
          <span className="text-[10px] font-black text-primary">4.8</span>
        </div>
        <Link to={`/item/${item.slug}`} className="font-serif text-lg font-black italic leading-tight line-clamp-2 text-primary">
          {item.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-2">
           <span className="text-base font-black text-accent">{formatCurrency(item.discount_price || item.price)}</span>
           {item.discount_price && (
             <span className="text-[10px] text-muted line-through font-bold">{formatCurrency(item.price)}</span>
           )}
        </div>
      </div>

      {/* Abstract Design Element to match billboard */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
    </div>
  );
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  return (
    <div className="bg-white rounded-[32px] p-3 shadow-sm flex flex-col gap-3 group relative overflow-hidden active:scale-95 transition-transform">
      <Link to={`/item/${item.slug}`} className="flex flex-col gap-3">
        <div className="aspect-square rounded-[24px] overflow-hidden bg-card relative">
          <img 
            src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          {item.discount_price && (
            <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter">
              Offer
            </div>
          )}
        </div>
        <div className="flex flex-col px-1">
          <h4 className="font-serif font-black text-sm italic leading-tight truncate mb-1">{item.name}</h4>
          <div className="flex items-center justify-between">
            <span className="text-accent text-sm font-black">{formatCurrency(item.discount_price || item.price)}</span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
              className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

function DiscountCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  return (
    <Link to={`/item/${item.slug}`} className="flex items-center gap-5 bg-white p-5 rounded-[32px] shadow-sm relative overflow-hidden group active:scale-[0.98] transition-transform">
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-card shrink-0 shadow-inner">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-[10px] font-black text-accent uppercase tracking-widest mb-1 italic">Special Deal</span>
        <h4 className="font-serif font-black text-xl leading-tight truncate text-primary">{item.name}</h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-black text-accent">{formatCurrency(item.discount_price!)}</span>
          <span className="text-xs text-muted line-through font-bold">{formatCurrency(item.price)}</span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); onAdd(); }} 
        className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform"
      >
        <Plus size={24} />
      </button>
    </Link>
  );
}
