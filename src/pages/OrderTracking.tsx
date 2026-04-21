import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2, Truck, Flag, Loader2 } from 'lucide-react';

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

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
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
      <div className="bg-primary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Order Number</span>
                  <span className="text-xl font-black">{order.order_number}</span>
               </div>
               <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  <span className="font-bold text-sm">~{order.delivery_type === 'delivery' ? '35' : '15'} mins</span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl">
               <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <MapPin size={24} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Delivery Address</span>
                  <span className="text-sm font-bold line-clamp-1">
                     {formatDeliveryAddress(order.delivery_address)}
                  </span>
               </div>
            </div>
         </div>
      </div>

      {/* Tracking Stepper */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col gap-8">
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

      {/* Action Buttons */}
      <div className="flex gap-4 mb-10">
         <a 
           href="tel:+2348159376128"
           className="flex-1 btn-primary py-4 flex items-center justify-center p-0"
         >
           Call Restaurant
         </a>
         {order.status === 'delivered' && (
           <button 
             onClick={() => navigate('/orders')}
             className="flex-1 bg-accent text-white py-4 rounded-xl font-bold"
           >
             View All Orders
           </button>
         )}
      </div>
    </div>
  );
}
