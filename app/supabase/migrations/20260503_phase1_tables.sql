-- OverBerg Go — Phase 1 migration
-- Adds 8 new tables: payments, dispatch_logs, surge_zones, driver_ratings,
-- merchant_ratings, promo_codes, support_tickets, kyc_documents.
-- Enables RLS on all of them with appropriate policies.

-- ═══════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  amount numeric(10,2) not null,
  currency text default 'ZAR' not null,
  provider text default 'payfast' check (provider in ('payfast', 'wallet', 'cash', 'card')),
  provider_ref text,
  status text default 'pending' check (status in (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select using (auth.uid() = user_id);

create policy "Users can create own payments"
  on public.payments for insert with check (auth.uid() = user_id);

create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);


-- ═══════════════════════════════════════════
-- DISPATCH LOGS
-- ═══════════════════════════════════════════
create table if not exists public.dispatch_logs (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete set null,
  attempt_number int default 1 not null,
  action text not null check (action in (
    'offered', 'accepted', 'rejected', 'timed_out', 'cancelled', 'completed'
  )),
  distance_km numeric(6,2),
  notes text,
  created_at timestamptz default now()
);

alter table public.dispatch_logs enable row level security;

create policy "Drivers can view own dispatch logs"
  on public.dispatch_logs for select using (auth.uid() = driver_id);

create policy "Customers can view dispatch logs for their orders"
  on public.dispatch_logs for select using (
    exists (
      select 1 from public.orders
      where orders.id = dispatch_logs.order_id
      and orders.customer_id = auth.uid()
    )
  );

create index if not exists idx_dispatch_order on public.dispatch_logs(order_id);
create index if not exists idx_dispatch_driver on public.dispatch_logs(driver_id);


-- ═══════════════════════════════════════════
-- SURGE ZONES
-- ═══════════════════════════════════════════
create table if not exists public.surge_zones (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  area text not null,
  -- bounding box for cheap geo lookup
  lat_min numeric(10,7) not null,
  lat_max numeric(10,7) not null,
  lng_min numeric(10,7) not null,
  lng_max numeric(10,7) not null,
  multiplier numeric(3,2) default 1.00 not null check (multiplier between 1.00 and 2.50),
  active boolean default false,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.surge_zones enable row level security;

create policy "Active surge zones are publicly viewable"
  on public.surge_zones for select using (active = true);

create index if not exists idx_surge_active on public.surge_zones(active);


-- ═══════════════════════════════════════════
-- DRIVER RATINGS (customer rating the driver)
-- ═══════════════════════════════════════════
create table if not exists public.driver_ratings (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating int check (rating between 1 and 5) not null,
  tags text[] default '{}',
  comment text,
  created_at timestamptz default now()
);

alter table public.driver_ratings enable row level security;

create policy "Driver ratings publicly viewable"
  on public.driver_ratings for select using (true);

create policy "Customers can submit ratings for own orders"
  on public.driver_ratings for insert with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.orders
      where orders.id = driver_ratings.order_id
      and orders.customer_id = auth.uid()
    )
  );

create index if not exists idx_driver_ratings_driver on public.driver_ratings(driver_id);


-- ═══════════════════════════════════════════
-- MERCHANT RATINGS (customer rating the restaurant/vendor)
-- ═══════════════════════════════════════════
create table if not exists public.merchant_ratings (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating int check (rating between 1 and 5) not null,
  food_quality int check (food_quality between 1 and 5),
  packaging int check (packaging between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.merchant_ratings enable row level security;

create policy "Merchant ratings publicly viewable"
  on public.merchant_ratings for select using (true);

create policy "Customers can submit merchant ratings for own orders"
  on public.merchant_ratings for insert with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.orders
      where orders.id = merchant_ratings.order_id
      and orders.customer_id = auth.uid()
    )
  );

create index if not exists idx_merchant_ratings_restaurant on public.merchant_ratings(restaurant_id);


-- ═══════════════════════════════════════════
-- PROMO CODES
-- ═══════════════════════════════════════════
create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  description text,
  discount_type text default 'percent' check (discount_type in ('percent', 'fixed', 'free_delivery')),
  discount_value numeric(8,2) not null default 0,
  min_order_amount numeric(8,2) default 0,
  max_discount numeric(8,2),
  applies_to text default 'all' check (applies_to in ('all', 'food', 'ride', 'shop', 'sea', 'stays')),
  usage_limit int,
  usage_count int default 0,
  per_user_limit int default 1,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.promo_codes enable row level security;

create policy "Active promo codes are publicly viewable"
  on public.promo_codes for select using (active = true);

create index if not exists idx_promo_active on public.promo_codes(active, code);


-- ═══════════════════════════════════════════
-- SUPPORT TICKETS
-- ═══════════════════════════════════════════
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  subject text not null,
  description text,
  category text default 'general' check (category in (
    'general', 'order_issue', 'payment_issue', 'driver_issue', 'merchant_issue', 'app_bug', 'refund_request'
  )),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.support_tickets enable row level security;

create policy "Users can view own tickets"
  on public.support_tickets for select using (auth.uid() = user_id);

create policy "Users can create own tickets"
  on public.support_tickets for insert with check (auth.uid() = user_id);

create policy "Users can update own open tickets"
  on public.support_tickets for update using (
    auth.uid() = user_id and status in ('open', 'waiting_user')
  );

create sequence if not exists support_ticket_seq start 1000;

create or replace function public.generate_ticket_number()
returns trigger as $$
begin
  new.ticket_number := 'OBG-T-' || to_char(nextval('support_ticket_seq'), 'FM00000');
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_ticket_number on public.support_tickets;
create trigger set_ticket_number
  before insert on public.support_tickets
  for each row execute function public.generate_ticket_number();

create index if not exists idx_tickets_user on public.support_tickets(user_id);
create index if not exists idx_tickets_status on public.support_tickets(status);


-- ═══════════════════════════════════════════
-- KYC DOCUMENTS
-- ═══════════════════════════════════════════
create table if not exists public.kyc_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  applicant_role text not null check (applicant_role in ('driver', 'vendor')),
  document_type text not null check (document_type in (
    'sa_id', 'drivers_license', 'vehicle_registration', 'vehicle_photo',
    'business_registration', 'owner_id', 'bank_proof', 'tax_clearance',
    'food_handlers_cert', 'insurance'
  )),
  file_url text not null,
  verification_status text default 'pending' check (verification_status in (
    'pending', 'approved', 'rejected', 'expired'
  )),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  expires_at date,
  created_at timestamptz default now()
);

alter table public.kyc_documents enable row level security;

create policy "Users can view own KYC documents"
  on public.kyc_documents for select using (auth.uid() = user_id);

create policy "Users can upload own KYC documents"
  on public.kyc_documents for insert with check (auth.uid() = user_id);

create index if not exists idx_kyc_user on public.kyc_documents(user_id);
create index if not exists idx_kyc_status on public.kyc_documents(verification_status);


-- ═══════════════════════════════════════════
-- REALTIME for new ops tables
-- ═══════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.payments;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.dispatch_logs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.support_tickets;
exception when duplicate_object then null; end $$;
