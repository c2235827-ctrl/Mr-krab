import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  ArrowLeft, 
  History, 
  TrendingDown, 
  Loader2,
  Clock,
  CreditCard,
  CreditCard as PaymentIcon
} from 'lucide-react';
import { format } from 'date-fns';

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['real-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_number
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="bg-bg flex flex-col pb-20">
      {/* Header */}
      <div className="h-24 px-6 flex items-center gap-4 bg-bg sticky top-0 z-20 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">Transaction History</h1>
      </div>

      <div className="p-6 flex flex-col gap-6">

      {/* Summary Card */}
      <div className="bg-primary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center opacity-70">
            <span className="font-bold uppercase tracking-widest text-[10px]">Financial Overview</span>
            <History size={20} className="text-accent" />
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold opacity-60 italic">Total Lifetime Spending</span>
            <span className="text-4xl font-black">
              {formatCurrency(transactions?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0)}
            </span>
          </div>
        </div>

        {/* Abstract graphics */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* List */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black italic">Recent Payments</h2>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {transactions?.length || 0} Records
          </span>
        </div>

        <div className="flex flex-col gap-4 min-h-[300px]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-50">
              <Loader2 className="animate-spin text-accent" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Fetching records...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div 
                key={tx.id} 
                className="bg-white p-6 rounded-[34px] shadow-sm flex items-center justify-between group transition-all hover:bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-card text-muted group-hover:bg-accent/5 group-hover:text-accent transition-colors"
                  )}>
                    <CreditCard size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif font-black italic text-primary">
                      Order #{tx.orders?.order_number || 'N/A'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] text-muted font-bold flex items-center gap-1 uppercase tracking-tight">
                        <Clock size={10} />
                        {format(new Date(tx.created_at), 'MMM d, yyyy • p')}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-accent uppercase tracking-widest mt-1">
                      via {tx.method}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-black text-lg text-primary">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                    tx.status === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-card rounded-[32px] flex items-center justify-center mb-6 opacity-30">
                <History size={40} className="text-muted" />
              </div>
              <h3 className="text-lg font-black italic mb-2">No transactions yet</h3>
              <p className="text-muted text-xs font-medium max-w-[200px]">When you order, your payment history will appear here! 🦀</p>
            </div>
          )}
        </div>
      </div>
     </div>
    </div>
  );
}
