# Database Setup Guide for Invoice Generator

## Overview
This guide will help you set up your Supabase database with all necessary tables, storage buckets, and Row Level Security (RLS) policies.

## 1. Create Tables

### Users Profile Table
```sql
-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('manager', 'executive');

-- Users profile table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'executive',
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Clients Table
```sql
-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company_name TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);
```

### Invoice Sequence Table (for auto-incrementing invoice numbers)
```sql
-- Invoice sequence table
CREATE TABLE public.invoice_sequences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_invoice_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT 'INV',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sequence"
  ON public.invoice_sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequence"
  ON public.invoice_sequences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sequence"
  ON public.invoice_sequences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Invoices Table
```sql
-- Create enum for invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  
  -- Company details (snapshot at time of invoice creation)
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_logo_url TEXT,
  
  -- Client details (snapshot)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  
  -- Financial details
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Additional details
  payment_method TEXT,
  notes TEXT,
  terms TEXT,
  
  -- PDF storage
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, invoice_number)
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Managers can view all invoices (optional - uncomment if needed)
-- CREATE POLICY "Managers can view all invoices"
--   ON public.invoices FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.user_profiles
--       WHERE id = auth.uid() AND role = 'manager'
--     )
--   );
```

### Invoice Items Table
```sql
-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_items
CREATE POLICY "Users can view items of their own invoices"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their own invoices"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their own invoices"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of their own invoices"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
```

## 2. Create Storage Buckets

### Company Logos Bucket
```sql
-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- RLS Policies for company-logos bucket
CREATE POLICY "Users can upload their own company logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own company logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own company logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');
```

### Invoice PDFs Bucket
```sql
-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-pdfs', 'invoice-pdfs', false);

-- RLS Policies for invoice-pdfs bucket
CREATE POLICY "Users can upload their own invoice PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoice-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own invoice PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoice-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own invoice PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoice-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 3. Create Functions

### Function to get next invoice number
```sql
-- Function to get and increment invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_sequence_record RECORD;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get or create sequence record
  SELECT * INTO v_sequence_record
  FROM public.invoice_sequences
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create new sequence
    INSERT INTO public.invoice_sequences (user_id, last_invoice_number, prefix)
    VALUES (p_user_id, 1, 'INV')
    RETURNING * INTO v_sequence_record;
    v_next_number := 1;
  ELSE
    -- Increment sequence
    v_next_number := v_sequence_record.last_invoice_number + 1;
    UPDATE public.invoice_sequences
    SET last_invoice_number = v_next_number,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Format invoice number (e.g., INV-00001)
  v_invoice_number := v_sequence_record.prefix || '-' || LPAD(v_next_number::TEXT, 5, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger to auto-update timestamps
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Setup Instructions

1. **Go to your Supabase Dashboard** (https://app.supabase.com)
2. **Select your project** or create a new one
3. **Go to SQL Editor** (left sidebar)
4. **Copy and paste each SQL block above** one by one and execute them
5. **Verify the tables** were created in the Table Editor
6. **Verify the storage buckets** were created in Storage section
7. **Get your credentials**:
   - Go to Project Settings → API
   - Copy the `Project URL` (REACT_APP_SUPABASE_URL)
   - Copy the `anon public` key (REACT_APP_SUPABASE_ANON_KEY)
8. **Update your `.env` file** with these credentials

## 5. Role Assignment

To assign roles to users:

```sql
-- After a user signs up, update their role
UPDATE public.user_profiles
SET role = 'manager'  -- or 'executive'
WHERE email = 'user@example.com';
```

Or you can create a function to do this automatically based on email domain or other criteria.

## Notes

- **Managers** have the same permissions as executives by default. If you want managers to see all invoices, uncomment the manager policy in the invoices table section.
- **Invoice numbers** are auto-generated using the `get_next_invoice_number()` function
- **All data is isolated** by user_id through RLS policies
- **Storage buckets** use folder structure: `{user_id}/{filename}` for organization
- **Company logos** are public (anyone can view), but only owners can upload/modify
- **Invoice PDFs** are private (only owners can view)

## Testing

After setup, test by:
1. Creating a new user account
2. Checking if user_profile is created
3. Creating a client
4. Generating an invoice
5. Verifying the invoice number auto-increments
