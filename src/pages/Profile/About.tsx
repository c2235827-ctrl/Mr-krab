import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Utensils, Clock, MapPin, Mail } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  const menu_highlights = [
    { emoji: '🍛', label: 'Jollof Rice' },
    { emoji: '🍗', label: 'Grilled Chicken' },
    { emoji: '🍕', label: 'Pizza' },
    { emoji: '🌯', label: 'Shawarma' },
    { emoji: '🍔', label: 'Burgers' },
    { emoji: '🍝', label: 'Pasta' },
    { emoji: '🥩', label: 'Peppered Meat' },
    { emoji: '🥤', label: 'Cold Drinks' },
  ];

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-10 mb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">About Mr. Krab</h1>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center mt-2">
        <div className="w-36 h-36 bg-primary rounded-[48px] shadow-2xl flex items-center justify-center rotate-[-2deg]">
          <span className="text-white font-serif font-black italic text-5xl">Mk</span>
        </div>

        <div className="flex flex-col gap-3 max-w-[300px]">
          <h2 className="text-3xl font-serif font-black italic leading-tight">
            Real Food. <br />Real Flavour.
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            At Mr. Krab, we're all about serving the food you love every day — 
            from smoky jollof rice and crispy grilled chicken to loaded shawarmas, 
            fresh pizzas, and everything in between. 🦀
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="bg-white p-7 rounded-[40px] shadow-sm flex flex-col gap-4">
        <h3 className="text-xl font-serif font-black italic">Our Story</h3>
        <p className="text-muted text-sm leading-relaxed">
          Mr. Krab started with a simple mission — make great food accessible to everyone. 
          We cook the meals Nigerians grew up on, plus the international favourites that 
          have become part of our everyday life.
        </p>
        <p className="text-muted text-sm leading-relaxed">
          Every dish is prepared fresh, with quality ingredients and the kind of care 
          that makes you feel at home with every bite. Whether you're ordering jollof 
          for the family or grabbing a quick shawarma, we've got you covered.
        </p>
      </div>

      {/* What We Serve */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">
          What We Serve
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {menu_highlights.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-[24px] p-3 shadow-sm flex flex-col items-center gap-2 text-center"
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-muted leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted font-medium mt-1">
          ...and much more on the menu 🔥
        </p>
      </div>

      {/* Why Choose Us */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">
          Why Mr. Krab
        </h3>
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
          {[
            { icon: Utensils, title: 'Freshly Cooked', desc: 'Every order is made fresh — no reheating, ever.' },
            { icon: Clock, title: 'Fast Delivery', desc: 'Hot food at your door in 30–45 minutes.' },
            { icon: MapPin, title: 'Straight to You', desc: 'Fast delivery from our kitchen to your home.' },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`flex items-center gap-4 p-5 ${i < 2 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <item.icon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">{item.title}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">
          Get In Touch
        </h3>
        <div className="bg-white p-5 rounded-[32px] shadow-sm flex flex-col gap-4">
          <a href="mailto:mrkrab@ozsaip.com" className="flex items-center gap-4 hover:opacity-75 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">Email Us</p>
              <p className="font-bold text-sm">mrkrab@ozsaip.com</p>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">Find Us</p>
              <p className="font-bold text-sm">All over Nigeria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card p-6 rounded-[32px] text-center border-dashed border-2 border-muted/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={14} className="text-red-500 fill-red-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Made with love in Nigeria
          </span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted opacity-40">
          Mr. Krab v1.0.0 · 2026
        </p>
      </div>
    </div>
  );
}
