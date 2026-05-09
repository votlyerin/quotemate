-- QuoteMate Database Schema
-- Run this in the Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  owner_name text,
  phone text,
  email text,
  service_area text,
  min_price numeric default 125,
  target_margin numeric default 45,
  labor_rate numeric default 35,
  default_crew_size integer default 2,
  default_travel_fee numeric default 25,
  quote_expiry_days integer default 7,
  truckload_pricing jsonb default '{"min":95,"eight":145,"qtr":225,"half":325,"three":475,"full":625}'::jsonb,
  item_surcharges jsonb default '{}'::jsonb,
  complexity_fees jsonb default '{"stairs":25,"basement":25,"longCarry":25,"heavy":25,"rush":50}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- QUOTES TABLE
-- ═══════════════════════════════════════════════════════════════

create table public.quotes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quote_number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  source text,
  load_size text,
  job_type text,
  complexity_factors jsonb default '[]'::jsonb,
  labor_hours numeric,
  crew_size integer,
  dump_fee numeric default 0,
  travel_fee numeric default 0,
  addons numeric default 0,
  discount numeric default 0,
  notes text,
  photos_reviewed boolean default false,
  recommended_price numeric,
  final_price numeric,
  total_cost numeric,
  profit numeric,
  margin_pct numeric,
  margin_status text check (margin_status in ('excellent','good','risky','underpriced')),
  status text default 'draft' check (status in ('draft','sent','accepted','declined','expired')),
  override_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.quotes enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can view own quotes"
  on public.quotes for select
  using (auth.uid() = user_id);

create policy "Users can insert own quotes"
  on public.quotes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quotes"
  on public.quotes for update
  using (auth.uid() = user_id);

create policy "Users can delete own quotes"
  on public.quotes for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, owner_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- QUOTE NUMBER SEQUENCE
-- ═══════════════════════════════════════════════════════════════

create sequence if not exists quote_number_seq start 1000;

create or replace function public.generate_quote_number()
returns trigger as $$
begin
  if new.quote_number is null then
    new.quote_number := 'QM-' || nextval('quote_number_seq')::text;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_quote_number
  before insert on public.quotes
  for each row execute procedure public.generate_quote_number();

-- ═══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute procedure public.update_updated_at();
