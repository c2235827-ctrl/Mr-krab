import { useLocation, useNavigate } from 'react-router-dom';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore, getSubtotal } from '../store/useCartStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatCurrency, generateOrderNumber } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Wallet, CreditCard, Banknote, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { handleSupabaseError } from '../lib/error-handler';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { deliveryType, addressId, defaultAddress, deliveryFee, discount, total, appliedPromo } = location.state || {};
  
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  
  const items = useCartStore(s => s.items);
  const clearCart = useCartStore(s => s.clearCart);
  const subtotal = getSubtotal(items);
  

  const [paymentMethod, setPaymentMethod] = useState<'flutterwave'>('flutterwave');
  const [isProcessing, setIsProcessing] = useState(false);

  const fwConfig = {
    public_key: 'FLWPUBK-f85c96b107f477b6ac4805097fb77dbf-X', // Explicitly using live key provided
    tx_ref: `KRB-${Date.now()}`,
    amount: total,
    currency: 'NGN',
    payment_options: 'card,ussd,banktransfer',
    customer: {
      email: user?.email || '',
      phone_number: '', // Phone number removed by request, passing empty string for compatibility
      name: profile?.full_name || '',
    },
    customizations: {
      title: 'Mr. Krab',
      description: 'Food order payment',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MK&backgroundColor=111111',
    },
  };

  const handleFlutterwavePayment = useFlutterwave(fwConfig);

  async function createOrder(paymentData?: any) {
    setIsProcessing(true);
    
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          status: 'pending',
          delivery_type: deliveryType,
          address_id: addressId,
          delivery_address: deliveryType === 'delivery' && defaultAddress ? {
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            landmark: defaultAddress.landmark,
          } : null,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discount,
          total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.discount_price || item.menuItem.price,
        total_price: (item.menuItem.discount_price || item.menuItem.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Create Payment Record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          user_id: user?.id,
          amount: total,
          method: paymentMethod,
          status: 'success',
          flutterwave_tx_ref: paymentData?.tx_ref,
          flutterwave_tx_id: paymentData?.transaction_id?.toString(),
        });

      if (paymentError) throw paymentError;

      // 4. Wallet Deduction - REMOED
      
      // 5. Update Promo Uses if applicable
      if (appliedPromo) {
        await supabase.rpc('increment_promotion_uses', { promo_id: appliedPromo.id });
      }

      await queryClient.invalidateQueries({ queryKey: ['orders-history'] });

      toast.success('Order placed successfully! 🚢');
      clearCart();
      navigate(`/tracking/${order.id}`);
    } catch (err: any) {
      handleSupabaseError(err, 'Checkout');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleProcessOrder = () => {
    if (deliveryType === 'delivery' && !addressId) {
      toast.error('Please select a delivery address');
      navigate('/home');
      return;
    }

    setIsProcessing(true);
    console.log('[Checkout] Initiating payment with Live Key...');
    
    handleFlutterwavePayment({
      callback: (response) => {
        const status = response.status?.toLowerCase();
        // Handle all common success status strings from Flutterwave
        if (status === 'successful' || status === 'success' || status === 'completed') {
          createOrder(response);
        } else {
          console.error('[Checkout] Payment failed. Trace ID:', response.transaction_id || 'N/A', 'Status:', status);
          toast.error(`Payment ${status || 'failed'}. If you were debited, contact support with ref: ${response.tx_ref}`);
          setIsProcessing(false);
        }
        closePaymentModal();
      },
      onClose: () => {
        console.log('[Checkout] Payment modal closed by user');
        setIsProcessing(false);
        toast('Payment abandoned', { icon: 'ℹ️' });
      },
    });
  };

  if (!total) return <div className="p-10 text-center">Invalid checkout state</div>;

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/cart')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Checkout</h1>
        <div className="w-12 h-12" />
      </div>

      <div className="flex flex-col gap-6">
        <div>
           <h2 className="text-lg font-black italic mb-4">Payment Method</h2>
           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-5 rounded-[28px] border-2 border-primary bg-white shadow-md transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-accent bg-accent/10">
                      <CreditCard size={24} />
                   </div>
                   <span className="font-bold">Flutterwave (Card/USSD)</span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-accent bg-accent flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
           </div>
        </div>

        <div className="bg-primary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center opacity-70">
                <span className="font-bold uppercase tracking-widest text-[10px]">Order Total</span>
                <span className="font-bold text-sm">Secure Checkout</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{formatCurrency(total)}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-accent" size={20} />
                 <p className="text-xs font-medium opacity-80">Guaranteed secure encryption & safe transactions.</p>
              </div>
           </div>
           {/* Abstract graphics */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
          <h3 className="font-black italic">Order Summary</h3>
          <div className="flex justify-between text-muted text-sm font-medium">
            <span>Items Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted text-sm font-medium">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-accent text-sm font-medium">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleProcessOrder}
          disabled={isProcessing}
          className="btn-primary w-full h-[72px] flex items-center justify-center gap-3 text-lg mt-4 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : (
            <>
              Confirm & Pay {formatCurrency(total)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
