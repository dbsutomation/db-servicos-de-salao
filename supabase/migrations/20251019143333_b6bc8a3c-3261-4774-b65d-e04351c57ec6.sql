-- =============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Fixes: CLIENT_SIDE_AUTH, PUBLIC_DATA_EXPOSURE, INPUT_VALIDATION
-- =============================================

-- ===========================================
-- 0. CLEAN UP INVALID DATA BEFORE APPLYING CONSTRAINTS
-- ===========================================

-- Fix any services with empty or invalid names
UPDATE public.services
SET name = 'Serviço sem nome'
WHERE name IS NULL OR trim(name) = '' OR length(name) > 200;

-- Fix any expenses with empty or invalid names
UPDATE public.expenses
SET name = 'Despesa'
WHERE name IS NULL OR trim(name) = '' OR length(name) > 200;

-- Fix any clients with empty or invalid names
UPDATE public.clients
SET name = 'Cliente'
WHERE name IS NULL OR trim(name) = '' OR length(name) > 200;

-- Fix any users with invalid emails
UPDATE public.users
SET email = LOWER(trim(email))
WHERE email IS NOT NULL;

-- Fix any users with empty or invalid names
UPDATE public.users
SET name = 'Usuário'
WHERE name IS NULL OR trim(name) = '' OR length(name) > 200;

-- Fix any negative or invalid values in services
UPDATE public.services
SET price = 0
WHERE price < 0;

UPDATE public.services
SET commission = 0
WHERE commission < 0 OR commission > 100;

UPDATE public.services
SET duration = 60
WHERE duration IS NULL OR duration <= 0;

-- Fix any negative values in service_records
UPDATE public.service_records
SET service_value = 0
WHERE service_value < 0;

UPDATE public.service_records
SET commission_amount = 0
WHERE commission_amount < 0;

UPDATE public.service_records
SET tip_amount = 0
WHERE tip_amount < 0;

-- Fix any negative amounts in expenses
UPDATE public.expenses
SET amount = 0
WHERE amount < 0;

-- ===========================================
-- 1. CREATE ROLE-BASED ACCESS CONTROL SYSTEM
-- ===========================================

-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('manager', 'professional');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing role data from users table to user_roles
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT id, 'manager'::public.app_role, id
FROM public.users
WHERE is_manager = true
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, created_by)
SELECT id, 'professional'::public.app_role, id
FROM public.users
WHERE is_manager = false
ON CONFLICT (user_id, role) DO NOTHING;

-- ===========================================
-- 2. DROP OLD INSECURE RLS POLICIES
-- ===========================================

-- Drop all overly permissive policies on users table
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can create users" ON public.users;
DROP POLICY IF EXISTS "Users can update users" ON public.users;
DROP POLICY IF EXISTS "Users can delete users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update professionals" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert professionals" ON public.users;
DROP POLICY IF EXISTS "Allow user to access their data" ON public.users;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Gerentes podem gerenciar todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view all professionals" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to delete professionals" ON public.users;

-- Drop overly permissive policies on other tables
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os clientes" ON public.clients;
DROP POLICY IF EXISTS "Usuários autenticados podem adicionar clientes" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

DROP POLICY IF EXISTS "Usuários autenticados podem ver todas as despesas" ON public.expenses;

DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os registros de serviço" ON public.service_records;
DROP POLICY IF EXISTS "Usuários autenticados podem adicionar registros de serviço" ON public.service_records;

DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Users can create services" ON public.services;
DROP POLICY IF EXISTS "Users can update services" ON public.services;
DROP POLICY IF EXISTS "Users can delete services" ON public.services;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os serviços" ON public.services;

-- ===========================================
-- 3. CREATE SECURE RLS POLICIES USING has_role()
-- ===========================================

-- USERS TABLE: Restrict PII access
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Managers can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Managers can manage all users"
ON public.users FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- CLIENTS TABLE: Restrict to authenticated users and managers
CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage all clients"
ON public.clients FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- SERVICE_RECORDS TABLE: Restrict financial data
CREATE POLICY "Professionals can view their own records"
ON public.service_records FOR SELECT
TO authenticated
USING (professional_id = auth.uid());

CREATE POLICY "Managers can view all service records"
ON public.service_records FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can create service records"
ON public.service_records FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage all service records"
ON public.service_records FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- EXPENSES TABLE: Managers only
CREATE POLICY "Managers can view all expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage expenses"
ON public.expenses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- SERVICES TABLE: Authenticated users can view, managers can manage
CREATE POLICY "Authenticated users can view services"
ON public.services FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- USER_ROLES TABLE: Managers only
CREATE POLICY "Managers can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- ===========================================
-- 4. ADD INPUT VALIDATION CONSTRAINTS
-- ===========================================

-- SERVICES TABLE: Validate business rules
ALTER TABLE public.services
ADD CONSTRAINT services_price_positive CHECK (price >= 0),
ADD CONSTRAINT services_commission_valid CHECK (commission >= 0 AND commission <= 100),
ADD CONSTRAINT services_duration_positive CHECK (duration > 0),
ADD CONSTRAINT services_name_length CHECK (length(trim(name)) > 0 AND length(name) <= 200);

-- SERVICE_RECORDS TABLE: Validate financial data
ALTER TABLE public.service_records
ADD CONSTRAINT service_records_value_positive CHECK (service_value >= 0),
ADD CONSTRAINT service_records_commission_positive CHECK (commission_amount >= 0),
ADD CONSTRAINT service_records_tip_positive CHECK (tip_amount >= 0);

-- EXPENSES TABLE: Validate amounts
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_amount_positive CHECK (amount >= 0),
ADD CONSTRAINT expenses_name_length CHECK (length(trim(name)) > 0 AND length(name) <= 200);

-- CLIENTS TABLE: Validate data
ALTER TABLE public.clients
ADD CONSTRAINT clients_name_length CHECK (length(trim(name)) > 0 AND length(name) <= 200);

-- USERS TABLE: Validate data
ALTER TABLE public.users
ADD CONSTRAINT users_name_length CHECK (length(trim(name)) > 0 AND length(name) <= 200),
ADD CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ===========================================
-- 5. UPDATE is_manager FUNCTION TO USE NEW SYSTEM
-- ===========================================

-- Update the existing is_manager() function to use the new role system
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'manager');
$$;