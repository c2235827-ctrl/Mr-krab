import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MenuItem, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Plus, Star, X } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const addItem = useCartStore((state) => state.addItem);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([0, 10000]);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);

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
    queryKey: ['explore-items', activeCategory, searchQuery, filterPriceRange, filterMinRating],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*').eq('is_available', true);
      
      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Applied Filters
      query = query.gte('price', filterPriceRange[0]).lte('price', filterPriceRange[1]);
      
      const { data } = await query.order('name');
      return data || [];
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6 relative">
      {/* Search Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Search your favorites..."
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
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl transition-colors",
              (filterPriceRange[0] > 0 || filterPriceRange[1] < 10000 || filterMinRating > 0) 
                ? "bg-accent text-white" 
                : "text-muted bg-white border border-gray-50"
            )}
          >
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
                  addItem({ menuItem: item, quantity: 1 });
                  toast.success(`${item.name} added to cart!`);
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && items?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="text-6xl mb-4 opacity-20">🦀</div>
             <h3 className="text-lg font-bold">No results found</h3>
             <p className="text-sm text-muted">Try searching for something else or browse all.</p>
             {(filterMinRating > 0 || filterPriceRange[0] > 0) && (
               <button 
                onClick={() => {
                  setFilterPriceRange([0, 10000]);
                  setFilterMinRating(0);
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 text-accent font-bold"
               >
                 Clear all filters
               </button>
             )}
          </div>
        )}
      </div>

      {/* Filter Modal/Sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsFilterOpen(false)}
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl flex flex-col gap-8 pb-12 sm:pb-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black italic">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-card rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Price Range</h3>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 bg-card p-4 rounded-2xl">
                      <span className="text-[10px] text-muted font-bold block uppercase mb-1">Min (₦)</span>
                      <input 
                        type="number" 
                        value={filterPriceRange[0]} 
                        onChange={(e) => setFilterPriceRange([Number(e.target.value), filterPriceRange[1]])}
                        className="bg-transparent font-black w-full"
                      />
                    </div>
                    <div className="flex-1 bg-card p-4 rounded-2xl">
                      <span className="text-[10px] text-muted font-bold block uppercase mb-1">Max (₦)</span>
                      <input 
                        type="number" 
                        value={filterPriceRange[1]} 
                        onChange={(e) => setFilterPriceRange([filterPriceRange[0], Number(e.target.value)])}
                        className="bg-transparent font-black w-full"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Minimum Rating</h3>
                  <div className="flex items-center gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilterMinRating(rating)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          filterMinRating === rating ? "bg-accent border-accent text-white shadow-lg" : "bg-white border-gray-100 text-primary"
                        )}
                      >
                        {rating === 0 ? 'Any' : `${rating}+ ★`}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setFilterPriceRange([0, 10000]);
                  setFilterMinRating(0);
                }}
                className="flex-1 py-4 font-bold text-muted hover:text-primary transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-2 btn-primary py-4"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ExploreCard({ item, onAdd }: { item: MenuItem, onAdd: () => void; key?: string }) {
  return (
    <div className="bg-white rounded-[32px] p-4 shadow-sm flex flex-col gap-3 group relative overflow-hidden">
      <Link to={`/item/${item.slug}`} className="flex flex-col gap-3">
        <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-card relative">
          <img 
            src={item.image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
            <Star size={10} className="text-accent" fill="currentColor" />
            <span className="text-[10px] font-black">4.9</span>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
            className="absolute bottom-3 right-3 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg active:opacity-75 transition-opacity"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex flex-col">
          <h4 className="font-serif font-black text-sm italic leading-tight mb-1 line-clamp-1">{item.name}</h4>
          <span className="text-accent text-sm font-black">{formatCurrency(item.discount_price || item.price)}</span>
        </div>
      </Link>
    </div>
  );
}
