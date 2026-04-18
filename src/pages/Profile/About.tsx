import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Twitter, Globe, Info, Heart } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">About Mr. Krab</h1>
      </div>

      <div className="flex flex-col items-center gap-8 text-center mt-4">
        <div className="w-40 h-40 bg-primary rounded-[56px] shadow-2xl flex items-center justify-center p-8 relative rotate-[-2deg]">
           <img src="/logo.svg" alt="Mr. Krab Logo" className="w-full h-full object-contain invert" onError={(e) => (e.currentTarget.style.display = 'none')} />
           <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-serif font-black italic text-5xl">Mk</span>
           </div>
        </div>
        
        <div className="flex flex-col gap-3 max-w-[280px]">
           <h2 className="text-3xl font-serif font-black italic">Fresh From the Deep</h2>
           <p className="text-muted text-sm leading-relaxed">
             Mr. Krab was founded with one goal: to bring the ocean's freshest catches right to your doorstep. No shells, just pure taste. 🦀
           </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Connect With Us</h3>
           <div className="bg-white rounded-[32px] overflow-hidden shadow-sm p-2 flex justify-around">
             {[
               { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
               { icon: Twitter, label: 'Twitter', color: 'text-sky-500' },
               { icon: Globe, label: 'Website', color: 'text-accent' }
             ].map((social) => (
               <button key={social.label} className="flex flex-col items-center gap-2 p-4 rounded-3xl hover:bg-gray-50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl bg-card flex items-center justify-center ${social.color}`}>
                    <social.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{social.label}</span>
               </button>
             ))}
           </div>
        </div>

        <div className="bg-card p-6 rounded-[32px] text-center border-dashed border-2 border-muted/20">
           <div className="flex items-center justify-center gap-2 mb-2">
             <Heart size={14} className="text-red-500 fill-red-500" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Handcrafted for foodies</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted opacity-40">Version 1.0.0 (Build 2026.04.18)</p>
        </div>
      </div>
    </div>
  );
}
