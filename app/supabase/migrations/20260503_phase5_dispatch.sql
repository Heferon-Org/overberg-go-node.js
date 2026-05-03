-- OverBerg Go — Phase 5 — Dispatch engine + surge pricing
-- Adds geo columns, dispatch trigger, surge zone calc

-- ═══════════════════════════════════════════
-- DRIVERS: kyc_status (denormalized for fast dispatch queries)
-- ═══════════════════════════════════════════
alter table public.drivers
  add column if not exists kyc_status text
    default 'pending'
    check (kyc_status in ('pending', 'verified', 'rejected', 'suspended'));

create index if not exists idx_drivers_dispatch
  on public.drivers(is_online, kyc_status)
  where is_online = true;

-- ═══════════════════════════════════════════
-- RESTAURANTS: pickup coords
-- ═══════════════════════════════════════════
alter table public.restaurants
  add column if not exists latitude numeric(10,7);
alter table public.restaurants
  add column if not exists longitude numeric(10,7);

-- Seed pickup coords for the existing 13 restaurants (centred on Struisbaai harbour)
update public.restaurants
  set latitude = -34.7731, longitude = 20.0507
  where latitude is null and area = 'Struisbaai';

update public.restaurants
  set latitude = -34.5328, longitude = 20.0408
  where latitude is null and area = 'Bredasdorp';

update public.restaurants
  set latitude = -34.8246, longitude = 20.0089
  where latitude is null and area = 'L''Agulhas';

-- Fallback: anything still null gets Struisbaai harbour
update public.restaurants
  set latitude = -34.7731, longitude = 20.0507
  where latitude is null;

-- ═══════════════════════════════════════════
-- ORDERS: delivery coords + surge tracking
-- ═══════════════════════════════════════════
alter table public.orders
  add column if not exists delivery_latitude numeric(10,7);
alter table public.orders
  add column if not exists delivery_longitude numeric(10,7);
alter table public.orders
  add column if not exists surge_multiplier numeric(3,2) default 1.00;
alter table public.orders
  add column if not exists surge_zone_id uuid references public.surge_zones(id) on delete set null;
alter table public.orders
  add column if not exists dispatch_status text
    default 'idle'
    check (dispatch_status in ('idle', 'searching', 'assigned', 'failed'));
alter table public.orders
  add column if not exists delivery_code text;

-- ═══════════════════════════════════════════
-- HAVERSINE DISTANCE FUNCTION
-- ═══════════════════════════════════════════
create or replace function public.haversine_km(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
) returns numeric
language plpgsql immutable as $$
declare
  r constant numeric := 6371; -- Earth radius (km)
  dlat numeric;
  dlng numeric;
  a numeric;
begin
  if lat1 is null or lat2 is null or lng1 is null or lng2 is null then
    return null;
  end if;
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat / 2) ^ 2
       + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ^ 2;
  return r * 2 * asin(sqrt(a));
end;
$$;

-- ═══════════════════════════════════════════
-- SURGE ZONE LOOKUP — find active surge for a coord
-- ═══════════════════════════════════════════
create or replace function public.find_surge_zone(p_lat numeric, p_lng numeric)
returns table (zone_id uuid, multiplier numeric)
language sql stable as $$
  select id, multiplier
    from public.surge_zones
    where active = true
      and p_lat between lat_min and lat_max
      and p_lng between lng_min and lng_max
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    order by multiplier desc
    limit 1;
$$;

-- ═══════════════════════════════════════════
-- ORDER CREATED → APPLY SURGE + GENERATE DELIVERY CODE
-- ═══════════════════════════════════════════
create or replace function public.handle_order_created()
returns trigger as $$
declare
  v_zone record;
begin
  -- Generate 4-digit delivery code
  if new.delivery_code is null then
    new.delivery_code := lpad((floor(random() * 10000))::text, 4, '0');
  end if;

  -- Apply surge multiplier if delivery coords inside an active zone
  if new.delivery_latitude is not null and new.delivery_longitude is not null then
    select * into v_zone
      from public.find_surge_zone(new.delivery_latitude, new.delivery_longitude);
    if v_zone.zone_id is not null then
      new.surge_zone_id := v_zone.zone_id;
      new.surge_multiplier := v_zone.multiplier;
      new.delivery_fee := round(new.delivery_fee * v_zone.multiplier, 2);
      new.total := new.subtotal + new.delivery_fee + coalesce(new.service_fee, 0);
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_order_created on public.orders;
create trigger trg_order_created
  before insert on public.orders
  for each row execute function public.handle_order_created();

-- ═══════════════════════════════════════════
-- DISPATCH SUPPORT: nearest available drivers
-- ═══════════════════════════════════════════
create or replace function public.find_nearest_drivers(
  p_lat numeric, p_lng numeric, p_max_km numeric default 10, p_limit int default 5
)
returns table (driver_id uuid, distance_km numeric)
language sql stable as $$
  select d.id,
         public.haversine_km(d.latitude, d.longitude, p_lat, p_lng) as distance_km
    from public.drivers d
   where d.is_online = true
     and d.kyc_status = 'verified'
     and d.latitude is not null
     and d.longitude is not null
     and public.haversine_km(d.latitude, d.longitude, p_lat, p_lng) <= p_max_km
     -- Exclude drivers currently busy with another active order
     and not exists (
       select 1 from public.orders o
        where o.driver_id = d.id
          and o.status in ('confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way')
     )
   order by distance_km asc
   limit p_limit;
$$;

-- ═══════════════════════════════════════════
-- ORDER CONFIRMED → INVOKE DISPATCH EDGE FUNCTION
-- (Uses pg_net if available; otherwise sets dispatch_status='searching'
--  and the API/cron picks it up.)
-- ═══════════════════════════════════════════
create or replace function public.handle_order_confirmed()
returns trigger as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    update public.orders
      set dispatch_status = 'searching'
      where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_order_confirmed on public.orders;
create trigger trg_order_confirmed
  after update of status on public.orders
  for each row execute function public.handle_order_confirmed();

-- ═══════════════════════════════════════════
-- REALTIME: ensure dispatch_logs broadcasts
-- ═══════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.dispatch_logs;
exception when duplicate_object then null; end $$;
