-- ==========================================================
-- BEEF BOX WALLET & SYSTEM FUNCTIONS
-- Run this in your Supabase SQL Editor to fix the Wallet errors.
-- ==========================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Create Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Function to calculate current wallet balance
CREATE OR REPLACE FUNCTION public.get_my_wallet_balance()
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO balance
  FROM public.wallet_transactions
  WHERE user_id = auth.uid();
  
  RETURN balance;
END;
$$;

-- 3. Function to top up wallet (Credit)
CREATE OR REPLACE FUNCTION public.top_up_wallet(amount DECIMAL, description TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (auth.uid(), ABS(amount), 'credit', description);
END;
$$;

-- 4. Function to deduct from wallet (Debit)
-- Returns true if successful, false if insufficient funds
CREATE OR REPLACE FUNCTION public.deduct_wallet(deduct_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT public.get_my_wallet_balance() INTO current_balance;
  
  IF current_balance < deduct_amount THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (auth.uid(), -ABS(deduct_amount), 'debit', 'Order Payment');
  
  RETURN TRUE;
END;
$$;

-- 5. Helper function for Profile order count
CREATE OR REPLACE FUNCTION public.get_my_order_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.orders
    WHERE user_id = auth.uid()
  );
END;
$$;

-- 6. Helper function to increment promo usage
CREATE OR REPLACE FUNCTION public.increment_promotion_uses(promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.promotions
  SET uses_count = uses_count + 1
  WHERE id = promo_id;
END;
$$;
