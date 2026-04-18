import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Truck, ShoppingBag, Utensils, Tag, ChevronRight } from 'lucide-react';
import { Address, Promotion } from '../types';
import { toast } from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const profile = useAuthStore((state) => state.profile);
  
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dine_in'>('delivery');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);

  // Fetch Delivery Address
  const { data: addresses } = useQuery<Address[]>({
    queryKey: ['addresses', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', profile?.id)
        .order('is_default', { ascending: false });
      return data || [];
    },
  });

  const defaultAddress = addresses?.find(a => a.is_default) || addresses?.[0];

  const deliveryFee = subtotal > 5000 || deliveryType !== 'delivery' ? 0 : 500;
  
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      discount = (subtotal * appliedPromo.discount_value) / 100;
    } else {
      discount = appliedPromo.discount_value;
    }
  }

  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const { data: promo, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promo) {
        toast.error('Invalid promo code');
        return;
      }

      const now = new Date().toISOString();
      if (promo.valid_from > now || promo.valid_until < now) {
        toast.error('Promo code expired');
        return;
      }

      if (subtotal < promo.min_order_amount) {
        toast.error(`Minimum order value is ${formatCurrency(promo.min_order_amount)}`);
        return;
      }

      setAppliedPromo(promo);
      toast.success('Promo code applied! 🎁');
    } catch (e) {
      toast.error('Error applying promo code');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-48 h-48 bg-card rounded-full flex items-center justify-center mb-8">
           <ShoppingBag size={80} className="text-muted" />
        </div>
        <h2 className="text-3xl font-serif font-black italic mb-4">Your cart is empty</h2>
        <p className="text-muted mb-10">Add some fresh catches to start your order journey!</p>
        <Link to="/home" className="btn-primary w-full">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-44 px-6 pt-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Your Cart</h1>
        <div className="w-12 h-12" /> {/* alignment */}
      </div>

      {/* Delivery Type Toggle */}
      <div className="bg-card p-1.5 rounded-[28px] flex gap-2">
        {(['delivery', 'pickup', 'dine_in'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setDeliveryType(type)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[24px] text-sm font-bold transition-all",
              deliveryType === type ? "bg-white shadow-sm text-primary" : "text-muted"
            )}
          >
            {type === 'delivery' && <Truck size={18} />}
            {type === 'pickup' && <ShoppingBag size={18} />}
            {type === 'dine_in' && <Utensils size={18} />}
            <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-4 rounded-[32px] shadow-sm flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-card shrink-0">
                <img 
                  src={item.menuItem.image_url} 
                  alt={item.menuItem.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <h4 className="font-serif font-black text-lg leading-tight">{item.menuItem.name}</h4>
                <p className="text-xs text-muted mb-2">
                  {item.variant?.name || 'Standard'} 
                  {item.selectedAddons.length > 0 && ` • ${item.selectedAddons.map(a => a.name).join(', ')}`}
                </p>
                <span className="text-accent font-black">
                  {formatCurrency(((item.menuItem.discount_price || item.menuItem.price) + (item.variant?.price_modifier || 0) + item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0)) * item.quantity)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-500">
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-3 bg-card px-2 py-1 rounded-xl">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1">
                    <Plus size={14} className="text-accent" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Address Selector */}
      {deliveryType === 'delivery' && (
        <div className="bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <MapPin size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Delivery To</span>
              <span className="font-bold text-sm line-clamp-1">{defaultAddress ? `${defaultAddress.label}: ${defaultAddress.street}` : 'Add your address'}</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* Promo Code */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Promo Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold uppercase"
          />
        </div>
        <button 
          onClick={handleApplyPromo}
          className="bg-primary text-white px-8 rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Apply
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center text-muted font-medium">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {deliveryType === 'delivery' && (
          <div className="flex justify-between items-center text-muted font-medium">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between items-center text-accent font-medium">
            <span>Discount ({appliedPromo?.code})</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between items-center text-xl font-black">
          <span>Total</span>
          <span className="text-accent">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button 
          onClick={() => navigate('/checkout', { state: { deliveryType, addressId: defaultAddress?.id, deliveryFee, discount, total, appliedPromo } })}
          className="max-w-md mx-auto btn-primary w-full flex items-center justify-between"
        >
          <span>Proceed to Payment</span>
          <motion.div 
            initial={{ x: 0 }}
            animate={{ x: 5 }}
            transition={{ repeat: Infinity, duration: 0.6, repeatType: 'reverse' }}
          >
            <ChevronRight size={24} />
          </motion.div>
        </button>
      </div>
    </div>
  );
}
