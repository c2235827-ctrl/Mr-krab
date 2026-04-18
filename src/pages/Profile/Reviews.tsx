import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, Star, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Review, MenuItem } from '../../types';

export default function MyReviews() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: reviews, isLoading } = useQuery<(Review & { menu_item: MenuItem })[]>({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, menu_item:menu_items(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8 mb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">My Reviews</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : reviews?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
            <Star size={48} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
          <p className="text-muted">Rate your meals and help others find the best catches! 🦀</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews?.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-card">
                    <img src={review.menu_item.image_url} alt={review.menu_item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm">{review.menu_item.name}</h4>
                    <div className="flex items-center gap-1 text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{format(new Date(review.created_at || Date.now()), 'MMM d, yyyy')}</span>
              </div>
              {review.comment && (
                <div className="bg-bg p-4 rounded-3xl relative">
                  <MessageSquare size={14} className="absolute -top-1 -right-1 text-accent/20" />
                  <p className="text-xs text-primary leading-relaxed italic">"{review.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
