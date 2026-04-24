import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2, Truck, Flag, Loader2, Star } from 'lucide-react';

const steps: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  { status: 'pending', label: 'Order Placed', icon: ClipboardList, description: 'We have received your order' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Chef is reviewing your order' },
  { status: 'preparing', label: 'Preparing', icon: Utensils, description: 'Your food is being cooked' },
  { status: 'ready', label: 'Order Ready', icon: Package, description: 'Order prepared and packed' },
  { status: 'out_for_delivery', label: 'On its way', icon: Truck, description: 'Rider is bringing your order' },
  { status: 'delivered', label: 'Delivered', icon: Flag, description: 'Enjoy your meal! 🦀' },
];

import { Utensils, ClipboardList } from 'lucide-react';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper function
  const formatDeliveryAddress = (addr: any) => {
    if (!addr) return 'Delivery Address';
    if (typeof addr === 'string') return addr;
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  };

  const { data: order, isLoading } = useQuery<Order & { order_items: any[] }>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          queryClient.setQueryData(['order', orderId], payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  if (!order) return <div className="p-10 text-center">Order not found</div>;

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/home')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Order Tracking</h1>
        <div className="w-12 h-12" />
      </div>

      {/* Summary Card */}
      <div className="bg-primary text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Order Number</span>
                  <span className="text-lg font-black">{order.order_number}</span>
               </div>
               <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Clock size={14} className="text-accent" />
                  <span className="font-bold text-xs">~{order.delivery_type === 'delivery' ? '35' : '15'} mins</span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl">
               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <MapPin size={20} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Delivery Address</span>
                  <span className="text-xs font-bold line-clamp-1">
                     {formatDeliveryAddress(order.delivery_address)}
                  </span>
               </div>
            </div>
         </div>
      </div>

      {/* Tracking Stepper */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-6">
         {steps.map((step, index) => {
           const isCompleted = index < currentStepIndex;
           const isCurrent = index === currentStepIndex;
           const isLast = index === steps.length - 1;
           const Icon = step.icon;

           return (
             <div key={step.status} className="flex gap-6 relative">
                {/* Line */}
                {!isLast && (
                  <div className={cn(
                    "absolute left-6 top-10 bottom-[-32px] w-0.5 transition-colors duration-500",
                    isCompleted ? "bg-accent" : "bg-gray-100"
                  )} />
                )}

                {/* Icon Container */}
                <div className={cn(
                  "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isCurrent ? "bg-accent text-white shadow-lg shadow-accent/30 scale-110" : 
                  isCompleted ? "bg-primary text-white" : "bg-card text-muted"
                )}>
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-2xl bg-accent/20 -z-10"
                    />
                  )}
                  <Icon size={24} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1">
                  <h4 className={cn(
                    "font-black text-lg italic transition-colors",
                    isCurrent || isCompleted ? "text-primary" : "text-muted"
                  )}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-muted">
                    {step.description}
                  </p>
                </div>

                {/* Timestamp placeholder */}
                {(isCurrent || isCompleted) && (
                  <div className="ml-auto flex items-center">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      {isCurrent ? 'Now' : 'Done'}
                    </span>
                  </div>
                )}
             </div>
           );
         })}
      </div>

      {/* Transaction Details (Items) */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-5">
         <div className="flex items-center justify-between">
           <h3 className="text-lg font-black italic">Order Summary</h3>
           <span className="text-accent font-black text-sm">{formatCurrency(order.total)}</span>
         </div>
         
         <div className="flex flex-col gap-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-card p-3 rounded-xl">
                <div className="flex items-center gap-3">
                   <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-black">
                     {item.quantity}x
                   </div>
                   <span className="font-bold text-xs line-clamp-1">{item.menu_item?.name}</span>
                </div>
                <span className="font-bold text-[10px] text-muted">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
         </div>

         <div className="h-px bg-gray-100" />

         <div className="flex flex-col gap-2">
           <div className="flex justify-between text-xs font-medium text-muted">
             <span>Subtotal</span>
             <span>{formatCurrency(order.subtotal)}</span>
           </div>
           {order.delivery_fee > 0 && (
             <div className="flex justify-between text-xs font-medium text-muted">
               <span>Delivery Fee</span>
               <span>{formatCurrency(order.delivery_fee)}</span>
             </div>
           )}
           {order.discount_amount > 0 && (
             <div className="flex justify-between text-xs font-medium text-accent">
               <span>Discount</span>
               <span>-{formatCurrency(order.discount_amount)}</span>
             </div>
           )}
         </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mb-20">
         {order.status === 'delivered' && (
           <button 
             onClick={() => navigate('/home')} // Or better, scroll him to the items list below to click one
             className="w-full bg-[#FFB800] text-white py-5 rounded-2xl font-black italic text-lg shadow-xl shadow-[#FFB800]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
           >
             <Star size={20} fill="currentColor" />
             Rate the Food
           </button>
         )}
         
         <div className="flex gap-4">
           <a 
             href="mailto:mrkrab@ozsaip.com"
             className="flex-1 border-2 border-primary text-primary py-4 rounded-xl flex items-center justify-center font-bold text-sm"
           >
             Contact Support
           </a>
           {order.status === 'delivered' && (
             <button 
               onClick={() => navigate('/orders')}
               className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm"
             >
               View History
             </button>
           )}
         </div>
      </div>
    </div>
  );
}
