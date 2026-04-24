import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Review } from '../../types';
import { ArrowLeft, Star, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function MyReviews() {
  const navigate = useNavigate();

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*, menuItem:menu_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8 mb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">My Reviews</h1>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white p-5 rounded-[28px] shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-card border border-gray-100">
                    <img src={review.menuItem?.image_url} alt={review.menuItem?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black italic text-primary leading-tight">{review.menuItem?.name}</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < review.rating ? "text-[#FFB800]" : "text-gray-200"} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-muted uppercase">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              
              {review.comment && (
                <div className="bg-card p-4 rounded-2xl">
                  <p className="text-xs text-primary/70 leading-relaxed font-medium italic">
                    "{review.comment}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
            <MessageSquare size={48} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
          <p className="text-muted text-sm max-w-[200px]">You haven't reviewed any dishes yet. Start sharing your experiences!</p>
        </div>
      )}
    </div>
  );
}
