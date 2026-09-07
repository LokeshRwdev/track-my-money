-- Supabase Database Schema for Track My Money
-- Run this in the Supabase SQL Editor

-- Set up custom types (Enums)
CREATE TYPE account_type_enum AS ENUM ('BANK', 'CASH', 'CREDIT_CARD', 'BROKERAGE', 'INVESTMENT', 'OTHER');
CREATE TYPE income_type_enum AS ENUM ('SALARY', 'BUSINESS', 'STOCK_MARKET', 'INVESTMENT', 'FREELANCE', 'OTHER');
CREATE TYPE income_status_enum AS ENUM ('EXPECTED', 'RECEIVED', 'CANCELLED');
CREATE TYPE obligation_category_enum AS ENUM ('EMI', 'CREDIT_CARD', 'RENT', 'INSURANCE', 'SUBSCRIPTION', 'UTILITY', 'OTHER');
CREATE TYPE payment_status_enum AS ENUM ('UPCOMING', 'DUE', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'SKIPPED');
CREATE TYPE transaction_type_enum AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE reference_type_enum AS ENUM ('INCOME_RECORD', 'OBLIGATION_PAYMENT', 'NONE');

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type account_type_enum NOT NULL,
  institution TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INCOME SOURCES
CREATE TABLE IF NOT EXISTS public.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  income_type income_type_enum NOT NULL,
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INCOME RECORDS
CREATE TABLE IF NOT EXISTS public.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID NOT NULL REFERENCES public.income_sources(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  income_date DATE NOT NULL,
  month TEXT NOT NULL,
  description TEXT,
  status income_status_enum NOT NULL DEFAULT 'EXPECTED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FIXED OBLIGATIONS
CREATE TABLE IF NOT EXISTS public.fixed_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category obligation_category_enum NOT NULL,
  provider TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  original_amount NUMERIC,
  current_amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  due_day INTEGER,
  start_date DATE,
  end_date DATE,
  total_installments INTEGER,
  remaining_installments INTEGER,
  interest_rate NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- OBLIGATION PAYMENTS
CREATE TABLE IF NOT EXISTS public.obligation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.fixed_obligations(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC,
  paid_date DATE,
  status payment_status_enum NOT NULL DEFAULT 'UPCOMING',
  payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  transaction_type transaction_type_enum NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT,
  description TEXT,
  reference_type reference_type_enum NOT NULL DEFAULT 'NONE',
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to handle automatically updating the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers for updated_at on all tables
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_accounts BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_income_sources BEFORE UPDATE ON public.income_sources FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_income_records BEFORE UPDATE ON public.income_records FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_fixed_obligations BEFORE UPDATE ON public.fixed_obligations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_obligation_payments BEFORE UPDATE ON public.obligation_payments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES (Users can only see and modify their own data)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own income sources" ON public.income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON public.income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON public.income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON public.income_sources FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own income records" ON public.income_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income records" ON public.income_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income records" ON public.income_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income records" ON public.income_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fixed obligations" ON public.fixed_obligations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed obligations" ON public.fixed_obligations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed obligations" ON public.fixed_obligations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed obligations" ON public.fixed_obligations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own obligation payments" ON public.obligation_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own obligation payments" ON public.obligation_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own obligation payments" ON public.obligation_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own obligation payments" ON public.obligation_payments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger function that automatically creates a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, currency)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'USD');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
