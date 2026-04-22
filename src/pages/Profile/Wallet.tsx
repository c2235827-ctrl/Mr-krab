import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  PlusCircle, 
  History, 
  TrendingDown, 
  TrendingUp, 
  Loader2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function Wallet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, user } = useAuthStore();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Wallet Balance
  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_wallet_balance');
      if (error) throw error;
      return data ?? 0;
    }
  });

  // Fetch Transaction History
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
         // If table doesn't exist, fallback to empty
         console.warn('wallet_transactions table failing or missing:', error.message);
         return [];
      }
      return data || [];
    }
  });

  // Top up Mutation (Placeholder - would usually call an RPC after successful payment)
  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.rpc('top_up_wallet', { 
        amount,
        description: 'Wallet Top-up via Flutterwave'
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Wallet topped up successfully! 🦀');
      setIsModalOpen(false);
      setTopUpAmount('');
    },
    onError: (err: any) => {
      toast.error(`Top up failed: ${err.message}`);
    }
  });

  const fwConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-bada1e713350586cc6e1d8e165d8b064-X',
    tx_ref: `TOP-${Date.now()}`,
    amount: Number(topUpAmount),
    currency: 'NGN',
    payment_options: 'card,ussd,banktransfer',
    customer: {
      email: user?.email || '',
      phone_number: profile?.phone || '',
      name: profile?.full_name || '',
    },
    customizations: {
      title: 'Mr. Krab Wallet',
      description: 'Funding your Mr. Krab wallet',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MK&backgroundColor=111111',
    },
  };

  const handleFlutterwavePayment = useFlutterwave(fwConfig);

  const handleTopUp = () => {
    const amount = Number(topUpAmount);
    if (isNaN(amount) || amount < 100) {
      toast.error('Minimum top-up is ₦100');
      return;
    }

    handleFlutterwavePayment({
      callback: (response) => {
        const status = response.status?.toLowerCase();
        // Handle all common success status strings from Flutterwave
        if (status === 'successful' || status === 'success' || status === 'completed') {
          topUpMutation.mutate(amount);
        } else {
          console.error('[Wallet] Payment failed. Trace ID:', response.transaction_id || 'N/A', 'Status:', status);
          toast.error(`Payment ${status || 'failed'}. If you were debited, contact support with ref: ${response.tx_ref}`);
        }
        closePaymentModal();
      },
      onClose: () => {
        toast('Payment abandoned', { icon: 'ℹ️' });
      },
    });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col gap-6 p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black italic">My Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="bg-primary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-center opacity-70">
            <span className="font-bold uppercase tracking-widest text-[10px]">Total Balance</span>
            <ShieldCheck size={20} className="text-accent" />
          </div>
          
          <div className="flex flex-col gap-1">
            {isBalanceLoading ? (
              <Loader2 className="animate-spin text-white/50" size={32} />
            ) : (
              <span className="text-5xl font-black">{formatCurrency(balance ?? 0)}</span>
            )}
            <span className="text-xs font-bold opacity-60">Ready to spend on your next meal</span>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-primary py-4 rounded-2xl font-bold transition-all active:scale-95"
          >
            <PlusCircle size={20} />
            Top Up Wallet
          </button>
        </div>

        {/* Abstract graphics */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Transaction History */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black italic flex items-center gap-2">
            <History size={18} className="text-accent" />
            Transaction History
          </h2>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Recent</span>
        </div>

        <div className="flex flex-col gap-3 min-h-[300px]">
          {isTransactionsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-50">
              <Loader2 className="animate-spin text-accent" size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">Loading history...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div 
                key={tx.id} 
                className="bg-white p-5 rounded-[32px] shadow-sm flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    tx.type === 'credit' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.type === 'credit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-primary">{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Order Payment')}</span>
                    <span className="text-[10px] text-muted font-bold flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(tx.created_at), 'MMM d, p')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "font-black text-sm",
                    tx.type === 'credit' ? "text-green-600" : "text-primary"
                  )}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-50">
              <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-4">
                <History size={32} className="text-muted" />
              </div>
              <p className="text-sm font-bold text-muted uppercase tracking-widest">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black italic mb-2">Top Up Wallet</h2>
            <p className="text-sm text-muted mb-6">Enter the amount you wish to add to your Mr. Krab wallet.</p>
            
            <div className="flex flex-col gap-6">
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-accent text-xl">₦</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-card py-6 pl-10 pr-6 rounded-[24px] text-2xl font-black focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  autoFocus
                />
             </div>

             <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                  <button 
                    key={amt}
                    onClick={() => setTopUpAmount(amt.toString())}
                    className={cn(
                      "py-3 rounded-xl text-xs font-black transition-all border-2",
                      topUpAmount === amt.toString() ? "bg-primary border-primary text-white" : "border-gray-100 hover:border-accent"
                    )}
                  >
                    +₦{amt.toLocaleString()}
                  </button>
                ))}
             </div>

             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleTopUp}
                  disabled={!topUpAmount || Number(topUpAmount) < 100 || topUpMutation.isPending}
                  className="btn-primary w-full py-5 flex items-center justify-center gap-2"
                >
                  {topUpMutation.isPending ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm text-muted font-bold py-2"
                >
                  Cancel
                </button>
             </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
