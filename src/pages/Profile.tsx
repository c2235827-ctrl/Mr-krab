import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { 
  User, 
  Wallet, 
  MapPin, 
  Bell, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Star, 
  History, 
  PlusCircle, 
  UserCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const sections = [
    {
      title: 'Finance',
      items: [
        { icon: Wallet, label: 'Wallet Balance', value: formatCurrency(profile?.wallet_balance || 0), path: '#', color: 'text-accent bg-accent/10' },
        { icon: History, label: 'Transaction History', path: '#', color: 'text-primary bg-primary/10' },
        { icon: PlusCircle, label: 'Add Funds', path: '#', color: 'text-green-600 bg-green-50' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { icon: UserCircle, label: 'Personal Information', path: '#' },
        { icon: MapPin, label: 'My Addresses', path: '#' },
        { icon: Star, label: 'My Reviews', path: '#' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', path: '#' },
        { icon: Smartphone, label: 'Biometric Login', path: '#', toggle: true, checked: profile?.biometric_enabled },
        { icon: Shield, label: 'Privacy & Security', path: '#' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: Info, label: 'About Mr. Krab', path: '#' },
      ]
    }
  ];

  return (
    <div className="p-6 flex flex-col gap-8 mb-20">
      {/* Header / Hero */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="relative group">
           <div className="w-32 h-32 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl relative">
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'Mr'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
           </div>
           <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent text-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center active:scale-95 transition-transform">
             <PlusCircle size={20} />
           </button>
        </div>
        <div className="text-center">
           <h2 className="text-3xl font-serif font-black italic">{profile?.full_name || 'Mr. Customer'}</h2>
           <p className="text-muted text-sm font-medium">{profile?.phone || 'No phone number'}</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm text-center">
              <span className="block text-[10px] text-muted font-black uppercase tracking-widest">Orders</span>
              <span className="font-serif font-black text-lg">12</span>
           </div>
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm text-center">
              <span className="block text-[10px] text-muted font-black uppercase tracking-widest">Reviews</span>
              <span className="font-serif font-black text-lg">5</span>
           </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">{section.title}</h3>
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  className={cn(
                    "w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                  )}
                >
                  <div className="flex items-center gap-4">
                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color || "bg-card text-muted")}>
                        <item.icon size={20} />
                     </div>
                     <span className="font-bold text-sm text-primary">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.value && <span className="font-black text-accent text-sm">{item.value}</span>}
                    {item.toggle ? (
                      <div className={cn("w-10 h-6 rounded-full p-1 transition-colors", item.checked ? "bg-accent" : "bg-gray-200")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", item.checked && "translate-x-4")} />
                      </div>
                    ) : (
                      <ChevronRight size={18} className="text-muted" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 py-5 bg-white text-red-500 rounded-[32px] font-bold shadow-sm transition-all active:scale-95 mt-4"
      >
        <LogOut size={20} />
        Log out
      </button>

      <div className="text-center mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-30 italic">Mr. Krab v1.0.0</p>
      </div>
    </div>
  );
}
