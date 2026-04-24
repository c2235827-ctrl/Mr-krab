import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useEffect } from 'react';

export default function Splash() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/home');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="relative h-screen w-full bg-primary overflow-hidden flex flex-col items-center justify-between py-16 px-8 select-none">
      {/* Background Graphic/Image */}
      <div className="absolute inset-0 z-0 opacity-50">
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080" 
          alt="Diverse Food" 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/30 to-primary" />
      </div>

      <div className="relative z-10 flex flex-col items-center mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-7xl mb-4">🥩</div>
          <span className="text-accent text-sm font-bold tracking-[0.3em] uppercase mb-2 block">Boxed to Perfection</span>
          <h1 className="text-white text-6xl md:text-7xl font-black italic leading-tight">
            BEEF BOX
          </h1>
        </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <p className="text-gray-300 text-lg mb-10 leading-relaxed font-light">
            Real Food. <br />
            <span className="font-bold text-white">Delivered Fast.</span>
          </p>
          
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-white text-primary py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-white/10 transition-opacity active:opacity-90"
          >
            Get Started
          </button>
          
          <div className="mt-8 flex justify-center gap-1">
            <div className="w-8 h-1 bg-white rounded-full" />
            <div className="w-2 h-1 bg-white/30 rounded-full" />
            <div className="w-2 h-1 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Aesthetic Accents */}
      <div className="absolute top-10 right-10 text-white/10 font-serif text-8xl pointer-events-none select-none">
        🥩
      </div>
      <div className="absolute bottom-40 -left-10 text-white/5 font-serif text-[12rem] pointer-events-none select-none rotate-12">
        📦
      </div>
    </div>
  );
}
