-- ═══════════════════════════════════════════════════════════════════════════
-- OVERBERG GO — Full Schema + Seed (Phase 1 complete)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/fmdtdpqdtsjezjmyltgn/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PROFILES ───────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'driver', 'vendor', 'admin')),
  address text,
  area text default 'Struisbaai',
  smart_shopper_points int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Public profiles viewable" on public.profiles;
create policy "Public profiles viewable" on public.profiles for select using (true);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RESTAURANTS ───────────────────────────────────────────────────────
create table if not exists public.restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  emoji text,
  image_url text,
  bg_gradient text,
  rating numeric(2,1) default 0,
  review_count int default 0,
  delivery_time text,
  delivery_fee numeric(6,2),
  tag text,
  subtitle text,
  location text,
  area text default 'Struisbaai',
  is_open boolean default true,
  opens_at time,
  closes_at time,
  owner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.restaurants enable row level security;
drop policy if exists "Restaurants public" on public.restaurants;
create policy "Restaurants public" on public.restaurants for select using (true);
drop policy if exists "Owners manage restaurants" on public.restaurants;
create policy "Owners manage restaurants" on public.restaurants for update using (auth.uid() = owner_id);

-- ─── MENU ITEMS ────────────────────────────────────────────────────────
create table if not exists public.menu_items (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(8,2) not null,
  emoji text,
  image_url text,
  category text not null,
  available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.menu_items enable row level security;
drop policy if exists "Menu public" on public.menu_items;
create policy "Menu public" on public.menu_items for select using (true);
drop policy if exists "Owners manage menu" on public.menu_items;
create policy "Owners manage menu" on public.menu_items for all using (
  exists (select 1 from public.restaurants where restaurants.id = menu_items.restaurant_id and restaurants.owner_id = auth.uid())
);

-- ─── ORDERS ────────────────────────────────────────────────────────────
create sequence if not exists order_number_seq start 2850;

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null default ('OBG-' || lpad(nextval('order_number_seq')::text, 4, '0')),
  customer_id uuid references public.profiles(id) not null,
  restaurant_id uuid references public.restaurants(id),
  driver_id uuid references public.profiles(id),
  items jsonb not null,
  subtotal numeric(8,2) not null,
  delivery_fee numeric(6,2) default 35,
  service_fee numeric(6,2) default 0,
  total numeric(8,2) not null,
  status text default 'placed' check (status in ('placed','confirmed','preparing','ready','picked_up','on_the_way','delivered','cancelled')),
  delivery_address text,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  notes text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
drop policy if exists "Customers view orders" on public.orders;
create policy "Customers view orders" on public.orders for select using (auth.uid() = customer_id);
drop policy if exists "Customers create orders" on public.orders;
create policy "Customers create orders" on public.orders for insert with check (auth.uid() = customer_id);
drop policy if exists "Drivers view assigned" on public.orders;
create policy "Drivers view assigned" on public.orders for select using (auth.uid() = driver_id);
drop policy if exists "Owners view restaurant orders" on public.orders;
create policy "Owners view restaurant orders" on public.orders for select using (
  exists (select 1 from public.restaurants where restaurants.id = orders.restaurant_id and restaurants.owner_id = auth.uid())
);
drop policy if exists "Owners update orders" on public.orders;
create policy "Owners update orders" on public.orders for update using (
  exists (select 1 from public.restaurants where restaurants.id = orders.restaurant_id and restaurants.owner_id = auth.uid())
);
drop policy if exists "Drivers update orders" on public.orders;
create policy "Drivers update orders" on public.orders for update using (auth.uid() = driver_id);

-- ─── DRIVERS ───────────────────────────────────────────────────────────
create table if not exists public.drivers (
  id uuid references public.profiles(id) on delete cascade primary key,
  vehicle_reg text,
  vehicle_type text default 'car',
  is_online boolean default false,
  current_area text default 'Struisbaai',
  latitude numeric(10,7),
  longitude numeric(10,7),
  rating numeric(2,1) default 5.0,
  total_rides int default 0,
  total_earnings numeric(10,2) default 0,
  bank_account_holder text,
  bank_name text,
  bank_account_number text,
  bank_branch_code text,
  kyc_status text default 'pending' check (kyc_status in ('pending','verified','rejected')),
  created_at timestamptz default now()
);
alter table public.drivers enable row level security;
drop policy if exists "Drivers view own" on public.drivers;
create policy "Drivers view own" on public.drivers for select using (auth.uid() = id);
drop policy if exists "Drivers update own" on public.drivers;
create policy "Drivers update own" on public.drivers for update using (auth.uid() = id);
drop policy if exists "Customers view assigned driver" on public.drivers;
create policy "Customers view assigned driver" on public.drivers for select using (
  exists (select 1 from public.orders where orders.driver_id = drivers.id and orders.customer_id = auth.uid())
);

-- ─── DRIVER EARNINGS ───────────────────────────────────────────────────
create table if not exists public.driver_earnings (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade,
  amount numeric(8,2) not null,
  type text check (type in ('delivery','tip','bonus','adjustment')),
  payout_status text default 'pending' check (payout_status in ('pending','paid')),
  payout_date timestamptz,
  created_at timestamptz default now()
);
alter table public.driver_earnings enable row level security;
drop policy if exists "Drivers view own earnings" on public.driver_earnings;
create policy "Drivers view own earnings" on public.driver_earnings for select using (auth.uid() = driver_id);

-- ─── EXPERIENCES, STAYS, REVIEWS, NOTIFICATIONS ───────────────────────
create table if not exists public.experiences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  category text,
  emoji text,
  image_url text,
  bg_gradient text,
  description text,
  price numeric(8,2),
  duration text,
  rating numeric(2,1) default 0,
  review_count int default 0,
  location text,
  area text default 'Cape Agulhas',
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.experiences enable row level security;
drop policy if exists "Experiences public" on public.experiences;
create policy "Experiences public" on public.experiences for select using (true);

create table if not exists public.stays (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  emoji text,
  image_url text,
  bg_gradient text,
  description text,
  price_per_night numeric(8,2),
  rooms int,
  rating numeric(2,1) default 0,
  review_count int default 0,
  location text,
  area text default 'Struisbaai',
  amenities text[],
  is_active boolean default true,
  owner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.stays enable row level security;
drop policy if exists "Stays public" on public.stays;
create policy "Stays public" on public.stays for select using (true);

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  order_id uuid references public.orders(id),
  restaurant_id uuid references public.restaurants(id),
  experience_id uuid references public.experiences(id),
  stay_id uuid references public.stays(id),
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
drop policy if exists "Reviews public" on public.reviews;
create policy "Reviews public" on public.reviews for select using (true);
drop policy if exists "Users create reviews" on public.reviews;
create policy "Users create reviews" on public.reviews for insert with check (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text,
  type text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1 EXTENDED TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PAYMENTS ──────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(10,2) not null,
  currency text default 'ZAR',
  type text not null check (type in ('order_payment','wallet_topup','driver_payout','merchant_payout','refund','adjustment')),
  status text default 'pending' check (status in ('pending','processing','completed','failed','refunded','cancelled')),
  provider text check (provider in ('payfast','wallet','cash','manual')),
  provider_ref text,
  provider_response jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_status on public.payments(status);
alter table public.payments enable row level security;
drop policy if exists "Users view own payments" on public.payments;
create policy "Users view own payments" on public.payments for select using (auth.uid() = user_id);

-- ─── DISPATCH LOGS ─────────────────────────────────────────────────────
create table if not exists public.dispatch_logs (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  driver_id uuid references public.drivers(id),
  status text not null check (status in ('offered','accepted','rejected','timed_out','cancelled')),
  distance_km numeric(6,2),
  estimated_eta_min int,
  offered_at timestamptz default now(),
  responded_at timestamptz,
  response_time_seconds int,
  reason text
);
create index if not exists idx_dispatch_order on public.dispatch_logs(order_id);
create index if not exists idx_dispatch_driver on public.dispatch_logs(driver_id);
alter table public.dispatch_logs enable row level security;
drop policy if exists "Drivers see dispatch history" on public.dispatch_logs;
create policy "Drivers see dispatch history" on public.dispatch_logs for select using (auth.uid() = driver_id);

-- ─── SURGE ZONES ───────────────────────────────────────────────────────
create table if not exists public.surge_zones (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  area text default 'Struisbaai',
  min_lat numeric(10,7) not null,
  max_lat numeric(10,7) not null,
  min_lng numeric(10,7) not null,
  max_lng numeric(10,7) not null,
  multiplier numeric(3,2) default 1.0 check (multiplier between 1.0 and 2.5),
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text,
  created_at timestamptz default now()
);
alter table public.surge_zones enable row level security;
drop policy if exists "Surge zones public" on public.surge_zones;
create policy "Surge zones public" on public.surge_zones for select using (active = true);

-- ─── DRIVER RATINGS ────────────────────────────────────────────────────
create table if not exists public.driver_ratings (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  rating int check (rating between 1 and 5) not null,
  tags text[],
  comment text,
  created_at timestamptz default now()
);
alter table public.driver_ratings enable row level security;
drop policy if exists "Driver ratings public" on public.driver_ratings;
create policy "Driver ratings public" on public.driver_ratings for select using (true);
drop policy if exists "Customers create driver ratings" on public.driver_ratings;
create policy "Customers create driver ratings" on public.driver_ratings for insert with check (auth.uid() = customer_id);

-- ─── MERCHANT RATINGS ──────────────────────────────────────────────────
create table if not exists public.merchant_ratings (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  food_rating int check (food_rating between 1 and 5) not null,
  packaging_rating int check (packaging_rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
alter table public.merchant_ratings enable row level security;
drop policy if exists "Merchant ratings public" on public.merchant_ratings;
create policy "Merchant ratings public" on public.merchant_ratings for select using (true);
drop policy if exists "Customers create merchant ratings" on public.merchant_ratings;
create policy "Customers create merchant ratings" on public.merchant_ratings for insert with check (auth.uid() = customer_id);

-- ─── PROMO CODES ───────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed','free_delivery')),
  discount_value numeric(8,2) not null,
  min_order_value numeric(8,2) default 0,
  max_discount numeric(8,2),
  service text check (service in ('food','ride','groceries','stays','experiences','all')),
  usage_limit int,
  usage_count int default 0,
  user_limit int default 1,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.promo_codes enable row level security;
drop policy if exists "Promo codes public" on public.promo_codes;
create policy "Promo codes public" on public.promo_codes for select using (active = true);

-- ─── SUPPORT TICKETS ───────────────────────────────────────────────────
create sequence if not exists support_ticket_seq start 10001;

create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number text unique not null default ('OBG-T-' || lpad(nextval('support_ticket_seq')::text, 5, '0')),
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('order_issue','payment','driver','merchant','app_bug','account','other')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  subject text not null,
  description text,
  resolution text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table public.support_tickets enable row level security;
drop policy if exists "Users see own tickets" on public.support_tickets;
create policy "Users see own tickets" on public.support_tickets for select using (auth.uid() = user_id);
drop policy if exists "Users create own tickets" on public.support_tickets;
create policy "Users create own tickets" on public.support_tickets for insert with check (auth.uid() = user_id);

-- ─── KYC DOCUMENTS ─────────────────────────────────────────────────────
create table if not exists public.kyc_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  document_type text not null check (document_type in (
    'sa_id','drivers_license','prdp','vehicle_reg','vehicle_insurance','roadworthy',
    'business_registration','tax_clearance','banking_proof','food_handling_cert','liquor_license','other'
  )),
  file_url text not null,
  file_name text,
  status text default 'pending' check (status in ('pending','verified','rejected','expired')),
  rejection_reason text,
  expires_at date,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_kyc_user on public.kyc_documents(user_id);
create index if not exists idx_kyc_status on public.kyc_documents(status);
alter table public.kyc_documents enable row level security;
drop policy if exists "Users see own KYC docs" on public.kyc_documents;
create policy "Users see own KYC docs" on public.kyc_documents for select using (auth.uid() = user_id);
drop policy if exists "Users upload own KYC docs" on public.kyc_documents;
create policy "Users upload own KYC docs" on public.kyc_documents for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — Real Overberg merchants + experiences
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── RESTAURANTS ───────────────────────────────────────────────────────
insert into public.restaurants (slug, name, emoji, bg_gradient, rating, review_count, delivery_time, delivery_fee, tag, subtitle, location, area) values
  ('harbour-cafe', 'Harbour Café', '🦐', 'linear-gradient(160deg,#0a1e2a,#061420)', 4.8, 312, '20 min', 35, 'Seafood', 'Seafood platter · Calamari · Hake · Harbour views', 'Struisbaai Harbour', 'Struisbaai'),
  ('michael-collins', 'Michael Collins Irish Pub', '🍺', 'linear-gradient(160deg,#1a0d05,#0d0800)', 4.5, 187, '25 min', 35, 'Irish Pub', 'Tapas · Burgers · Pizza · Beer garden', null, 'Struisbaai'),
  ('fish-and-more', 'Fish & More', '🐟', 'linear-gradient(160deg,#061e1a,#031510)', 4.7, 243, '15 min', 25, 'Takeaway', 'Yellowtail · Snoek · Hake · Fresh daily catch', '66 Main Road', 'Struisbaai'),
  ('gavins-trattoria', 'Gavin''s Trattoria Agulhas', '🍕', 'linear-gradient(160deg,#1a1005,#100a00)', 4.6, 156, '30 min', 38, 'Italian', 'Yellowtail · Fettuccine · Brisket pizza · Family run', 'L''Agulhas', 'L''Agulhas'),
  ('pret-restaurant', 'Pret Restaurant', '🍝', 'linear-gradient(160deg,#0f1a2a,#08111a)', 4.9, 98, '35 min', 40, 'Italian', 'Coastal Italian · Attentive service · L''Agulhas', null, 'L''Agulhas'),
  ('lagulhas-seafoods', 'L''Agulhas Seafoods', '🦞', 'linear-gradient(160deg,#0a1e2a,#061420)', 4.7, 201, '20 min', 30, 'Seafood', 'Fresh local seafood · Daily catch', 'L''Agulhas', 'L''Agulhas'),
  ('beach-bum-shack', 'Beach Bum Shack', '🍹', 'linear-gradient(160deg,#1a0d20,#0d0510)', 4.5, 89, '15 min', 28, 'Beach Bar', 'Cocktails · Beach snacks · Sunset spot', 'Struisbaai Beach', 'Struisbaai'),
  ('the-shipwreck', 'The Shipwreck', '⚓', 'linear-gradient(160deg,#1a1505,#0f0e05)', 4.6, 134, '25 min', 32, 'Pub & Grill', 'Burgers · Steaks · Local craft beer', null, 'Struisbaai'),
  ('coffee-full-stop', 'Coffee & Fish & More', '☕', 'linear-gradient(160deg,#1a1208,#10080a)', 4.7, 167, '15 min', 25, 'Café', 'Coffee · Fresh fish · Light meals', null, 'Struisbaai'),
  ('nelris-kitchen', 'Nelri''s Kitchen', '👨‍🍳', 'linear-gradient(160deg,#0a1a10,#061005)', 4.8, 78, '30 min', 35, 'Home Style', 'Traditional cooking · Comfort food', null, 'Struisbaai'),
  ('butterblock', 'Butterblock', '🧈', 'linear-gradient(160deg,#1a1505,#100e02)', 4.9, 145, '20 min', 30, 'Bakery', 'Fresh pastries · Sourdough · Cakes', null, 'Struisbaai'),
  ('coffee-and-blues', 'Coffee & Blues', '🎵', 'linear-gradient(160deg,#0d0820,#06051a)', 4.6, 92, '20 min', 28, 'Café & Music', 'Coffee · Live music · Local vibes', null, 'Struisbaai'),
  ('freshstop', 'FreshStop', '🛒', 'linear-gradient(160deg,#0a1a10,#06120a)', 4.4, 55, '15 min', 20, 'Convenience', 'Quick essentials · Snacks · Drinks', null, 'Struisbaai')
on conflict (slug) do nothing;

-- ─── MENU ITEMS ────────────────────────────────────────────────────────
insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r, (values
  ('Calamari Rings', 'Lightly battered, with tartare sauce.', 89, '🍤', 'Starters', 1),
  ('Prawn Cocktail', 'Tiger prawns, lettuce, Marie Rose sauce', 110, '🥗', 'Starters', 2),
  ('Crayfish Bisque', 'West Coast rock lobster soup, cream, brandy', 78, '🍜', 'Starters', 4),
  ('Grilled Yellowtail', 'Fresh line fish, lemon butter, seasonal veg', 165, '🐟', 'Mains', 6),
  ('Fish & Chips', 'Beer-battered hake, hand-cut chips, tartare', 115, '🍟', 'Mains', 7),
  ('Seafood Platter for 2', 'Prawns, calamari, fish, mussels, rice, chips', 380, '🦐', 'Seafood', 8),
  ('Castle Lager', '330ml ice cold', 32, '🍺', 'Drinks', 10),
  ('Malva Pudding', 'With custard and vanilla ice cream', 55, '🍮', 'Desserts', 11)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'harbour-cafe';

insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r, (values
  ('Loaded Nachos', 'Cheese, jalapeños, guac, sour cream', 85, '🌮', 'Starters', 1),
  ('Classic Burger', '200g patty, cheddar, bacon, hand-cut chips', 120, '🍔', 'Mains', 2),
  ('Margherita Pizza', 'Tomato, mozzarella, fresh basil', 95, '🍕', 'Mains', 3),
  ('Guinness Draught', '440ml pint', 65, '🍺', 'Drinks', 4)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'michael-collins';

insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r, (values
  ('Yellowtail Fillet', 'Fresh daily catch, chips, salad', 130, '🐟', 'Mains', 1),
  ('Snoek & Chips', 'Local smoked snoek, hand-cut chips', 95, '🐠', 'Mains', 2),
  ('Hake & Chips', 'Beer-battered hake, tartare sauce', 85, '🍟', 'Mains', 3)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'fish-and-more';

insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r, (values
  ('Yellowtail Carpaccio', 'Fresh yellowtail, capers, olive oil, lemon', 115, '🐟', 'Starters', 1),
  ('Fettuccine Alfredo', 'Cream, parmesan, mushrooms', 125, '🍝', 'Mains', 2),
  ('Brisket Pizza', '12-hour smoked brisket, mozzarella, BBQ glaze', 140, '🍕', 'Mains', 3)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'gavins-trattoria';

-- ─── EXPERIENCES ───────────────────────────────────────────────────────
insert into public.experiences (name, slug, category, emoji, bg_gradient, description, price, duration, rating, review_count, location, area) values
  ('Southern Tip Sea Adventures', 'sea-adventures', 'On the Water', '⛵', 'linear-gradient(160deg,#061e2e,#04131f)', 'Boat trips from Struisbaai Harbour — whale watching, seal colonies, sunsets.', 380, '2-4 hrs', 4.9, 187, 'Struisbaai Harbour', 'Struisbaai'),
  ('Awesome Charters Fishing', 'awesome-charters', 'On the Water', '🎣', 'linear-gradient(160deg,#041520,#020d17)', 'Deep sea & surf fishing at the southernmost tip of Africa.', 650, 'Half/full day', 4.8, 134, 'Struisbaai', 'Struisbaai'),
  ('Dive Struisbaai', 'dive-struisbaai', 'On the Water', '🤿', 'linear-gradient(160deg,#071a28,#041018)', 'PADI dive courses, snorkelling, underwater tours.', 420, '3 hrs', 4.7, 98, 'Struisbaai', 'Struisbaai'),
  ('Swim with Stingrays', 'stingrays', 'On the Water', '🐠', 'linear-gradient(160deg,#041e2a,#021218)', 'Famous harbour stingrays — Parrie and friends. Daily 9-11am.', 0, '30 min', 5.0, 412, 'Struisbaai Harbour', 'Struisbaai'),
  ('Robbie''s Surf School', 'surf-school', 'On the Water', '🏄', 'linear-gradient(160deg,#0a1a2a,#061018)', 'Learn to surf on Struisbaai''s gentle Indian Ocean waves.', 350, '2 hrs', 4.6, 76, 'Struisbaai Beach', 'Struisbaai'),
  ('Beach Dog Walker', 'dog-walker', 'Pet Services', '🐕', 'linear-gradient(160deg,#1a1005,#100800)', 'Daily walks on SA''s longest beach. GPS tracked, fully insured.', 120, '1 hr', 4.9, 89, 'Struisbaai', 'Struisbaai'),
  ('E-Bike & Bicycle Hire', 'bike-hire', 'Explore', '🚴', 'linear-gradient(160deg,#0a1a08,#061005)', 'Explore the Agulhas Plain on quality bikes. Route maps included.', 150, 'Full day', 4.8, 145, 'Struisbaai', 'Struisbaai'),
  ('Agulhas National Park Hiking', 'hiking', 'Explore', '🥾', 'linear-gradient(160deg,#0d1a06,#081005)', 'Shipwreck trail, Rasperpunt hike, lighthouse trail.', 80, '2-5 hrs', 4.7, 234, 'L''Agulhas', 'L''Agulhas'),
  ('Horse Riding Beach', 'horse-riding', 'Explore', '🐴', 'linear-gradient(160deg,#1a0a05,#0f0500)', 'Sunrise & sunset rides on white sand beach.', 280, '1.5 hrs', 4.7, 92, 'Struisbaai', 'Struisbaai'),
  ('Cape Agulhas Lighthouse Museum', 'lighthouse', 'Culture', '💡', 'linear-gradient(160deg,#1a1505,#0f0e05)', 'Africa''s only lighthouse museum. Built 1848.', 60, '45 min', 4.9, 567, 'L''Agulhas', 'L''Agulhas'),
  ('Shipwreck Museum Bredasdorp', 'shipwreck-museum', 'Culture', '🚢', 'linear-gradient(160deg,#1a0a14,#0f0510)', '150 ships wrecked here. Maritime artifacts.', 50, '1-2 hrs', 4.7, 198, 'Bredasdorp', 'Bredasdorp'),
  ('Cape Agulhas Wine Route', 'wine-route', 'Wine Route', '🍷', 'linear-gradient(160deg,#1a0520,#0d0318)', 'Cool-climate Elim wines. Guided tastings.', 450, 'Half day', 4.8, 123, 'Elim', 'Elim')
on conflict (slug) do nothing;

-- ─── STAYS ─────────────────────────────────────────────────────────────
insert into public.stays (name, slug, emoji, bg_gradient, description, price_per_night, rooms, rating, review_count, location, area, amenities) values
  ('Chateau de Marine Boutique Hotel', 'chateau-de-marine', '🌊', 'linear-gradient(160deg,#0a1e2a,#061420)', '9 luxury sea-facing rooms, private pool, 50m from beach.', 2800, 9, 4.9, 234, 'Struisbaai', 'Struisbaai', ARRAY['Pool','Sea View','Breakfast','WiFi']),
  ('Agulhas Country Lodge', 'agulhas-country-lodge', '🌿', 'linear-gradient(160deg,#061a10,#04120a)', 'Local limestone, hilltop, both oceans visible.', 1800, 8, 4.8, 156, 'L''Agulhas', 'L''Agulhas', ARRAY['Breakfast','Ocean View','WiFi','Restaurant']),
  ('The Arniston Hotel', 'arniston-hotel', '⛵', 'linear-gradient(160deg,#1a1008,#100a05)', 'Historic hotel in national monument village.', 2200, 12, 4.9, 312, 'Arniston', 'Arniston', ARRAY['Pool','Restaurant','Beach Access','Bar']),
  ('Casa Pescador Self-Catering', 'casa-pescador', '🏡', 'linear-gradient(160deg,#0a1a12,#061210)', 'Fisherman''s House, 2 min walk to beach. 6-sleeper.', 1400, 3, 4.7, 89, 'Struisbaai', 'Struisbaai', ARRAY['Self-Catering','Braai','Garden','WiFi']),
  ('House of 2 Oceans', 'house-2-oceans', '🌾', 'linear-gradient(160deg,#1a1a06,#10100a)', 'Where the Atlantic meets the Indian.', 1600, 2, 4.8, 78, 'L''Agulhas', 'L''Agulhas', ARRAY['Self-Catering','Ocean View','Balcony','WiFi']),
  ('Struisbaai Caravan Park', 'caravan-park', '🏕️', 'linear-gradient(160deg,#0a1510,#06100c)', 'Direct beach access. Powered sites, ablutions, braai.', 280, 60, 4.6, 345, 'Struisbaai', 'Struisbaai', ARRAY['Beach Access','Braai','Power','Ablutions'])
on conflict (slug) do nothing;

-- ─── PROMO CODES ───────────────────────────────────────────────────────
insert into public.promo_codes (code, description, discount_type, discount_value, min_order_value, max_discount, service, usage_limit, valid_until) values
  ('NEWUSER', '40% off your first order', 'percent', 40, 0, 100, 'all', 1000, now() + interval '90 days'),
  ('SEA20', '20% off boat experiences', 'percent', 20, 200, 100, 'experiences', 500, now() + interval '60 days'),
  ('FRESHFISH', 'R30 off fresh fish delivery', 'fixed', 30, 100, 30, 'food', null, now() + interval '30 days'),
  ('FREEDEL50', 'Free delivery on orders over R150', 'free_delivery', 0, 150, 50, 'food', null, now() + interval '60 days'),
  ('LOYAL10', '10% off for repeat customers', 'percent', 10, 0, 50, 'all', null, now() + interval '180 days'),
  ('WEEKEND15', '15% off weekends', 'percent', 15, 100, 75, 'food', null, now() + interval '60 days')
on conflict (code) do nothing;

-- ─── SURGE ZONES ───────────────────────────────────────────────────────
insert into public.surge_zones (name, area, min_lat, max_lat, min_lng, max_lng, multiplier, active, reason) values
  ('Struisbaai Harbour Peak', 'Struisbaai', -34.8050, -34.7950, 20.0450, 20.0550, 1.3, false, 'Weekend evening peak'),
  ('L''Agulhas Lighthouse', 'L''Agulhas', -34.8350, -34.8250, 20.0050, 20.0150, 1.5, false, 'Tourist hotspot'),
  ('Bredasdorp Town', 'Bredasdorp', -34.5400, -34.5300, 20.0350, 20.0450, 1.0, true, 'Standard zone');

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Run `select count(*) from public.restaurants;` to verify (should be 13)
-- ═══════════════════════════════════════════════════════════════════════════
