-- OverBerg Go — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables

-- ═══════════════════════════════════════════
-- PROFILES (extends Supabase auth.users)
-- ═══════════════════════════════════════════
create table public.profiles (
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

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Public profiles are viewable"
  on public.profiles for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════
-- RESTAURANTS
-- ═══════════════════════════════════════════
create table public.restaurants (
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

create policy "Restaurants are publicly viewable"
  on public.restaurants for select using (true);

create policy "Owners can update their restaurant"
  on public.restaurants for update using (auth.uid() = owner_id);


-- ═══════════════════════════════════════════
-- MENU ITEMS
-- ═══════════════════════════════════════════
create table public.menu_items (
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

create policy "Menu items are publicly viewable"
  on public.menu_items for select using (true);

create policy "Restaurant owners can manage menu items"
  on public.menu_items for all using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  customer_id uuid references public.profiles(id) not null,
  restaurant_id uuid references public.restaurants(id) not null,
  driver_id uuid references public.profiles(id),
  items jsonb not null, -- [{id, name, price, quantity, emoji}]
  subtotal numeric(8,2) not null,
  delivery_fee numeric(6,2) default 35,
  service_fee numeric(6,2) default 0,
  total numeric(8,2) not null,
  status text default 'placed' check (status in (
    'placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'
  )),
  delivery_address text,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  notes text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Customers can view their orders"
  on public.orders for select using (auth.uid() = customer_id);

create policy "Customers can create orders"
  on public.orders for insert with check (auth.uid() = customer_id);

create policy "Drivers can view assigned orders"
  on public.orders for select using (auth.uid() = driver_id);

create policy "Restaurant owners can view their orders"
  on public.orders for select using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = orders.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can update order status"
  on public.orders for update using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = orders.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Drivers can update assigned orders"
  on public.orders for update using (auth.uid() = driver_id);

-- Generate order number
create or replace function public.generate_order_number()
returns trigger as $$
begin
  new.order_number := 'OBG-' || to_char(nextval('order_number_seq'), 'FM0000');
  return new;
end;
$$ language plpgsql;

create sequence if not exists order_number_seq start 2850;

create trigger set_order_number
  before insert on public.orders
  for each row execute function public.generate_order_number();


-- ═══════════════════════════════════════════
-- DRIVERS
-- ═══════════════════════════════════════════
create table public.drivers (
  id uuid references public.profiles(id) on delete cascade primary key,
  vehicle_reg text,
  vehicle_type text default 'car',
  is_online boolean default false,
  current_area text default 'Struisbaai',
  latitude numeric(10,7),
  longitude numeric(10,7),
  rating numeric(3,2) default 5.00,
  total_trips int default 0,
  acceptance_rate numeric(5,2) default 100,
  completion_rate numeric(5,2) default 100,
  created_at timestamptz default now()
);

alter table public.drivers enable row level security;

create policy "Drivers can view own record"
  on public.drivers for select using (auth.uid() = id);

create policy "Drivers can update own record"
  on public.drivers for update using (auth.uid() = id);

create policy "Online drivers are visible to system"
  on public.drivers for select using (is_online = true);


-- ═══════════════════════════════════════════
-- DRIVER EARNINGS
-- ═══════════════════════════════════════════
create table public.driver_earnings (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  order_id uuid references public.orders(id),
  amount numeric(8,2) not null,
  type text default 'trip' check (type in ('trip', 'bonus', 'tip')),
  created_at timestamptz default now()
);

alter table public.driver_earnings enable row level security;

create policy "Drivers can view own earnings"
  on public.driver_earnings for select using (auth.uid() = driver_id);


-- ═══════════════════════════════════════════
-- EXPERIENCES
-- ═══════════════════════════════════════════
create table public.experiences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  emoji text,
  image_url text,
  bg_gradient text,
  badge text,
  duration text,
  price text,
  button_text text default 'Book Now',
  section text not null,
  section_color text,
  section_emoji text,
  area text default 'Struisbaai',
  rating numeric(2,1),
  available boolean default true,
  created_at timestamptz default now()
);

alter table public.experiences enable row level security;

create policy "Experiences are publicly viewable"
  on public.experiences for select using (true);


-- ═══════════════════════════════════════════
-- STAYS / ACCOMMODATION
-- ═══════════════════════════════════════════
create table public.stays (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  emoji text,
  image_url text,
  bg_gradient text,
  location text,
  area text,
  rating numeric(2,1),
  tag text,
  meta text,
  price text,
  available boolean default true,
  created_at timestamptz default now()
);

alter table public.stays enable row level security;

create policy "Stays are publicly viewable"
  on public.stays for select using (true);


-- ═══════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  restaurant_id uuid references public.restaurants(id),
  order_id uuid references public.orders(id),
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly viewable"
  on public.reviews for select using (true);

create policy "Users can create reviews"
  on public.reviews for insert with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text default 'system' check (type in ('order', 'promo', 'system', 'driver')),
  title text not null,
  message text,
  emoji text,
  read boolean default false,
  data jsonb, -- arbitrary payload (order_id, link, etc.)
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);


-- ═══════════════════════════════════════════
-- ENABLE REALTIME
-- ═══════════════════════════════════════════
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.drivers;


-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_restaurant on public.orders(restaurant_id);
create index idx_orders_driver on public.orders(driver_id);
create index idx_orders_status on public.orders(status);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_driver_earnings_driver on public.driver_earnings(driver_id);
create index idx_notifications_user on public.notifications(user_id, read);
create index idx_restaurants_area on public.restaurants(area);
create index idx_drivers_online on public.drivers(is_online, current_area);
