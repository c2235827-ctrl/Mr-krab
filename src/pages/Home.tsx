import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Plus, Star, MapPin } from 'lucide-react';
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
    refetchInterval: 30000, // refresh every 30 seconds
  });

  // Fetch Categories
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

  // Fetch Featured Items
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

  // Fetch Items by Category
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

  // Fetch Discount Items
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
        .select('id, code, title, discount_type, discount_value, min_order_amount, valid_until')
        .eq('is_active', true)
        .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
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
            <h3 className="font-serif text-lg leading-tight">What would you like to order? 🦀</h3>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link to="/explore" className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <Search size={20} />
          </Link>
          <Link to="/notifications" className="p-3 bg-white rounded-2xl shadow-sm relative">
            <Bell size={20} />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount! > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Hero Search Placeholder (Visual only) */}
      <div className="relative group" onClick={() => navigate('/explore')}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-muted" />
        </div>
        <div className="w-full bg-card py-4 pl-12 pr-4 rounded-2xl text-muted font-medium cursor-pointer">
          Find your favorite dishes...
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex flex-col gap-4">
        <div className="horizontal-scroll gap-4 pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap border border-gray-100",
              activeCategory === 'all' ? "bg-primary text-white" : "bg-white text-primary"
            )}
          >
            All Items
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap border border-gray-100",
                activeCategory === cat.id ? "bg-primary text-white" : "bg-white text-primary"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions Banner */}
      {activePromos && activePromos.length > 0 && activeCategory === 'all' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-black italic">🎁 Active Offers</h2>
          <div className="horizontal-scroll gap-4 -mx-6 px-6 pb-2">
            {activePromos.map((promo) => (
              <div
                key={promo.id}
                className="min-w-[260px] bg-primary text-white p-5 rounded-[32px] shadow-xl relative overflow-hidden snap-center flex flex-col gap-2"
              >
                {/* Background glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent/20 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    Limited Offer
                  </span>
                  <h3 className="font-serif font-black text-xl leading-tight mt-1">
                    {promo.title}
                  </h3>
                  <p className="text-sm opacity-80 mt-1">
                    {promo.discount_type === 'percentage'
                      ? `${promo.discount_value}% off`
                      : `₦${promo.discount_value.toLocaleString()} off`}
                    {promo.min_order_amount > 0
                      ? ` orders above ₦${promo.min_order_amount.toLocaleString()}`
                      : ''}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-2">
                  <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl">
                    <span className="font-black font-mono tracking-widest text-accent text-sm">
                      {promo.code}
                    </span>
                  </div>
                  {promo.valid_until && (
                    <span className="text-[10px] opacity-50 font-bold">
                      Ends {new Date(promo.valid_until).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Horizontal Scroll */}
      {featuredItems && featuredItems.length > 0 && activeCategory === 'all' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-black italic">Chef's Selection</h2>
          <div className="horizontal-scroll gap-6 -mx-6 px-6 pb-4">
            {featuredItems.map((item) => (
              <FeaturedCard 
                key={item.id} 
                item={item} 
                onAdd={() => {
                  addItem({ menuItem: item, quantity: 1 });
                  toast.success(`${item.name} added to cart!`);
                }}
              />
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
            <Link to="/explore" className="text-accent font-bold text-sm">View All</Link>
          )}
        </div>
        <div className="horizontal-scroll gap-4 -mx-6 px-6 pb-4">
          {items?.map((item) => (
            <div key={item.id} className="min-w-[160px] max-w-[160px] snap-center">
              <MenuCard 
                item={item} 
                onAdd={() => {
                  addItem({ menuItem: item, quantity: 1 });
                  toast.success(`${item.name} added to cart!`);
                }} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Special for You Section */}
      {discountItems && discountItems.length > 0 && (
        <div className="flex flex-col gap-4 mt-4 mb-20">
          <h2 className="text-2xl font-black italic">Special For You 🦀</h2>
          <div className="flex flex-col gap-4">
            {discountItems.map((item) => (
              <DiscountCard 
                key={item.id} 
                item={item} 
                onAdd={() => {
                  addItem({ menuItem: item, quantity: 1 });
                  toast.success(`${item.name} added to cart!`);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  return (
    <div className="relative min-w-[300px] bg-white rounded-[40px] p-8 shadow-sm flex flex-col justify-between overflow-hidden snap-center">
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full overflow-hidden border-4 border-bg shadow-xl bg-card">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="flex flex-col gap-1 mt-32">
        <div className="flex items-center gap-1 text-accent">
          <Star size={14} fill="currentColor" />
          <span className="text-xs font-bold">4.8</span>
        </div>
        <Link to={`/item/${item.slug}`} className="font-serif text-2xl font-black leading-tight max-w-[130px] line-clamp-2">
          {item.name}
        </Link>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-accent">{formatCurrency(item.discount_price || item.price)}</span>
          {item.discount_price && (
            <span className="text-sm text-muted line-through">{formatCurrency(item.price)}</span>
          )}
        </div>
        <button 
          onClick={(e) => { e.preventDefault(); onAdd(); }} 
          className="btn-accent"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  return (
    <div className="bg-white rounded-[32px] p-4 shadow-sm flex flex-col gap-3 group relative overflow-hidden">
      <Link to={`/item/${item.slug}`} className="flex flex-col gap-3">
        <div className="h-36 rounded-[24px] overflow-hidden bg-card relative">
          <img 
            src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          {item.discount_price && (
            <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded-lg text-[10px] font-bold">
              OFFER
            </div>
          )}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
            className="absolute bottom-2 right-2 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg active:opacity-70 transition-opacity z-10"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          <h4 className="font-serif font-black text-sm italic leading-tight line-clamp-1 truncate">{item.name}</h4>
          <span className="text-accent text-sm font-black">{formatCurrency(item.discount_price || item.price)}</span>
        </div>
      </Link>
    </div>
  );
}

function DiscountCard({ item, onAdd }: { item: MenuItem; onAdd: () => void; key?: string }) {
  return (
    <Link to={`/item/${item.slug}`} className="flex items-center gap-4 bg-white p-4 rounded-[24px] shadow-sm relative overflow-hidden group">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-card shrink-0">
        <img 
          src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <h4 className="font-serif font-black text-lg leading-tight truncate">{item.name}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-accent font-black">{formatCurrency(item.discount_price!)}</span>
          <span className="text-xs text-muted line-through">{formatCurrency(item.price)}</span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); onAdd(); }} 
        className="p-3 bg-primary text-white rounded-full active:opacity-80 transition-opacity"
      >
        <Plus size={20} />
      </button>
    </Link>
  );
}
