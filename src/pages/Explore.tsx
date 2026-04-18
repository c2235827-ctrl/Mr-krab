import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MenuItem, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Plus, Star, X } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const addItem = useCartStore((state) => state.addItem);

  // Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  // Fetch Search Results
  const { data: items, isLoading } = useQuery<MenuItem[]>({
    queryKey: ['explore-items', activeCategory, searchQuery],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*').eq('is_available', true);
      
      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query.order('name');
      return data || [];
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Search Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Search fresh catches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="horizontal-scroll gap-4 -mx-6 px-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-6 py-3 rounded-full text-sm font-bold transition-all border border-gray-100 whitespace-nowrap",
            activeCategory === 'all' ? "bg-primary text-white" : "bg-white text-primary"
          )}
        >
          All
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-bold transition-all border border-gray-100 whitespace-nowrap",
              activeCategory === cat.id ? "bg-primary text-white" : "bg-white text-primary"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="flex flex-col gap-4 mb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic">Found {items?.length || 0} items</h2>
          <button className="flex items-center gap-2 text-sm font-bold text-muted">
            <Filter size={16} /> Filter
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-[32px] p-4 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items?.map((item) => (
              <ExploreCard 
                key={item.id} 
                item={item} 
                onAdd={() => {
                  addItem({ menuItem: item, variant: null, selectedAddons: [], quantity: 1 });
                  toast.success(`${item.name} added to cart!`);
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && items?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="text-6xl mb-4 opacity-20">🦀</div>
             <h3 className="text-lg font-bold">No seafood found</h3>
             <p className="text-sm text-muted">Try searching for something else or browse all.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreCard({ item, onAdd }: { item: MenuItem, onAdd: () => void; key?: string }) {
  return (
    <div className="bg-white rounded-[32px] p-4 shadow-sm flex flex-col gap-3 group">
      <Link to={`/item/${item.slug}`} className="flex flex-col gap-3">
        <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-card relative">
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
            <Star size={10} className="text-accent" fill="currentColor" />
            <span className="text-[10px] font-black">4.9</span>
          </div>
        </div>
        <div className="flex flex-col">
          <h4 className="font-serif font-black text-sm leading-tight mb-1 line-clamp-1">{item.name}</h4>
          <span className="text-accent text-sm font-black">{formatCurrency(item.discount_price || item.price)}</span>
        </div>
      </Link>
      <button 
        onClick={(e) => { e.preventDefault(); onAdd(); }}
        className="btn-accent border-4 border-white absolute -bottom-1 -right-1 z-10"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
