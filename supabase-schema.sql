-- =========================================================================
-- ISKCON Tour 2.0 Database Schema for Supabase
-- Project: https://supabase.com/dashboard/project/bjkvvfbzxprbqxoddtvm/sql/new
-- =========================================================================

-- 1. Tours Table
CREATE TABLE IF NOT EXISTS public.tour_tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  default_fee NUMERIC NOT NULL DEFAULT 0,
  budget NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Registrations Table
CREATE TABLE IF NOT EXISTS public.tour_registrations (
  id TEXT PRIMARY KEY,
  registration_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  date_of_birth TEXT,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  address TEXT,
  tour_name TEXT NOT NULL,
  registration_date TEXT NOT NULL,
  agreed_fee NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_amount NUMERIC NOT NULL DEFAULT 0,
  refund_amount NUMERIC DEFAULT 0,
  refund_status TEXT DEFAULT 'not_refunded',
  refund_reason TEXT,
  refund_date TEXT,
  refund_method TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  seat_number TEXT,
  vehicle_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Financial Transactions Table
CREATE TABLE IF NOT EXISTS public.tour_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tour_id TEXT NOT NULL,
  tour_name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_registrations_tour ON public.tour_registrations(tour_name);
CREATE INDEX IF NOT EXISTS idx_tour_registrations_seat ON public.tour_registrations(seat_number);
CREATE INDEX IF NOT EXISTS idx_tour_transactions_tour ON public.tour_transactions(tour_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tour_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access via anon key for the Tour application
DROP POLICY IF EXISTS "Allow anon all on tour_tours" ON public.tour_tours;
CREATE POLICY "Allow anon all on tour_tours" ON public.tour_tours FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on tour_registrations" ON public.tour_registrations;
CREATE POLICY "Allow anon all on tour_registrations" ON public.tour_registrations FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on tour_transactions" ON public.tour_transactions;
CREATE POLICY "Allow anon all on tour_transactions" ON public.tour_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enable Realtime sync across devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tour_tours'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_tours;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tour_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_registrations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tour_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_transactions;
  END IF;
END $$;
