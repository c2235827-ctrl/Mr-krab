import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';

export default function MyReviews() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8 mb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">My Reviews</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
        <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
          <Star size={48} className="text-muted" />
        </div>
        <h3 className="text-xl font-bold mb-2">Coming Soon 🦀</h3>
        <p className="text-muted">We're working on a way for you to share your food experiences soon!</p>
      </div>
    </div>
  );
}
