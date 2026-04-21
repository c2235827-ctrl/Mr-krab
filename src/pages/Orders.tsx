import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, Package, Truck, CheckCircle2, Search, ArrowLeft } from 'lucide-react';

export default function Orders() {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-700';
      default: return 'bg-accent/10 text-accent';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 size={16} />;
      case 'out_for_delivery': return <Truck size={16} />;
      default: return <Package size={16} />;
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading your order history...</div>;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black italic">My Orders</h1>
      </div>

      {orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mb-6">
            <ClipboardList size={48} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No orders yet</h3>
          <p className="text-muted mb-8">Ready to place your first order?</p>
          <button onClick={() => navigate('/home')} className="btn-primary px-10">Start Ordering</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-20">
          {orders?.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/tracking/${order.id}`)}
              className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4 text-left group transition-all hover:bg-white"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted">Order ID</span>
                  <span className="font-bold text-sm tracking-tighter">{order.order_number}</span>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5", getStatusStyle(order.status))}>
                  {getStatusIcon(order.status)}
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="h-px bg-gray-50" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted">Placed On</span>
                  <span className="text-sm font-bold text-primary">{format(new Date(order.created_at), 'MMM d, p')}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted">Total Paid</span>
                  <span className="text-sm font-black text-accent">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center text-[10px] font-bold text-muted uppercase tracking-widest gap-2 bg-card py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                View Tracking Details <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
