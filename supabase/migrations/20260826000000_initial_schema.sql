-- Create initial schema for Track My Money

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- BANK, CASH, CREDIT_CARD, BROKERAGE, INVESTMENT, OTHER
  institution TEXT,
  opening_balance NUMERIC(15,2) DEFAULT 0.00,
  current_balance NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. income_sources
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  income_type TEXT NOT NULL, -- SALARY, BUSINESS, STOCK_MARKET, INVESTMENT, FREELANCE, OTHER
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  expected_amount NUMERIC(15,2) DEFAULT 0.00,
  frequency TEXT, -- Monthly, Weekly, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. income_records
CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID NOT NULL REFERENCES income_sources(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  income_date DATE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  description TEXT,
  status TEXT NOT NULL, -- EXPECTED, RECEIVED, CANCELLED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. fixed_obligations
CREATE TABLE fixed_obligations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- EMI, CREDIT_CARD, RENT, INSURANCE, SUBSCRIPTION, UTILITY, OTHER
  provider TEXT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  original_amount NUMERIC(15,2),
  current_amount NUMERIC(15,2) NOT NULL,
  frequency TEXT NOT NULL, -- Monthly, Yearly, etc.
  due_day INTEGER, -- 1 to 31
  start_date DATE,
  end_date DATE,
  total_installments INTEGER,
  remaining_installments INTEGER,
  interest_rate NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. obligation_payments
CREATE TABLE obligation_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES fixed_obligations(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due NUMERIC(15,2) NOT NULL,
  amount_paid NUMERIC(15,2),
  paid_date DATE,
  status TEXT NOT NULL, -- UPCOMING, DUE, PAID, OVERDUE, PARTIALLY_PAID, SKIPPED
  payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- INCOME, EXPENSE, TRANSFER
  amount NUMERIC(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT,
  description TEXT,
  reference_type TEXT, -- INCOME_RECORD, OBLIGATION_PAYMENT, NONE
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_records_user_id ON income_records(user_id);
CREATE INDEX idx_income_records_month ON income_records(month);
CREATE INDEX idx_income_records_income_date ON income_records(income_date);
CREATE INDEX idx_fixed_obligations_user_id ON fixed_obligations(user_id);
CREATE INDEX idx_obligation_payments_user_id ON obligation_payments(user_id);
CREATE INDEX idx_obligation_payments_due_date ON obligation_payments(due_date);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_modtime BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_sources_modtime BEFORE UPDATE ON income_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_records_modtime BEFORE UPDATE ON income_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_obligations_modtime BEFORE UPDATE ON fixed_obligations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obligation_payments_modtime BEFORE UPDATE ON obligation_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Accounts Policies
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Income Sources Policies
CREATE POLICY "Users can view own income sources" ON income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON income_sources FOR DELETE USING (auth.uid() = user_id);

-- Income Records Policies
CREATE POLICY "Users can view own income records" ON income_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income records" ON income_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income records" ON income_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income records" ON income_records FOR DELETE USING (auth.uid() = user_id);

-- Fixed Obligations Policies
CREATE POLICY "Users can view own fixed obligations" ON fixed_obligations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed obligations" ON fixed_obligations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed obligations" ON fixed_obligations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed obligations" ON fixed_obligations FOR DELETE USING (auth.uid() = user_id);

-- Obligation Payments Policies
CREATE POLICY "Users can view own obligation payments" ON obligation_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own obligation payments" ON obligation_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own obligation payments" ON obligation_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own obligation payments" ON obligation_payments FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
