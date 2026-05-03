-- OverBerg Go — Phase 3 (part b) — Earnings, payouts, refunds
-- Driver earnings calc, merchant commission, weekly payout payloads,
-- refund flow.

-- ═══════════════════════════════════════════
-- EXTEND driver_earnings: payout tracking
-- ═══════════════════════════════════════════
alter table public.driver_earnings
  add column if not exists payout_status text
    default 'pending'
    check (payout_status in ('pending', 'paid', 'cancelled'));

alter table public.driver_earnings
  add column if not exists payout_id uuid;

alter table public.driver_earnings
  alter column type drop default;
alter table public.driver_earnings
  alter column type type text using type::text;

-- Replace narrow check with broader allowed types
do $$ begin
  alter table public.driver_earnings drop constraint if exists driver_earnings_type_check;
exception when undefined_object then null; end $$;

alter table public.driver_earnings
  add constraint driver_earnings_type_check
  check (type in ('trip', 'bonus', 'tip', 'delivery', 'adjustment'));

create index if not exists idx_driver_earnings_payout
  on public.driver_earnings(driver_id, payout_status);

-- ═══════════════════════════════════════════
-- MERCHANT EARNINGS LEDGER
-- ═══════════════════════════════════════════
create table if not exists public.merchant_earnings (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  gross_amount numeric(10,2) not null,
  commission_rate numeric(4,3) not null,
  commission_amount numeric(10,2) not null,
  net_amount numeric(10,2) not null,
  payout_status text default 'pending' check (payout_status in ('pending', 'paid', 'cancelled')),
  payout_id uuid,
  created_at timestamptz default now()
);

alter table public.merchant_earnings enable row level security;

create policy "Vendors can view own merchant earnings"
  on public.merchant_earnings for select using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = merchant_earnings.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create index if not exists idx_merchant_earnings_payout
  on public.merchant_earnings(restaurant_id, payout_status);

-- ═══════════════════════════════════════════
-- PAYOUTS (driver + merchant)
-- ═══════════════════════════════════════════
create table if not exists public.payouts (
  id uuid default gen_random_uuid() primary key,
  recipient_type text not null check (recipient_type in ('driver', 'merchant')),
  recipient_id uuid not null,
  period_start date not null,
  period_end date not null,
  total_amount numeric(10,2) not null,
  status text default 'draft' check (status in ('draft', 'processing', 'paid', 'failed', 'cancelled')),
  invoice_url text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payouts enable row level security;

create policy "Drivers can view own payouts"
  on public.payouts for select using (
    recipient_type = 'driver' and recipient_id = auth.uid()
  );

create policy "Merchants can view own payouts"
  on public.payouts for select using (
    recipient_type = 'merchant' and exists (
      select 1 from public.restaurants
      where restaurants.id = payouts.recipient_id
      and restaurants.owner_id = auth.uid()
    )
  );

create index if not exists idx_payouts_recipient
  on public.payouts(recipient_type, recipient_id, status);

-- ═══════════════════════════════════════════
-- ORDER DELIVERED → EARNINGS TRIGGER
-- ═══════════════════════════════════════════
create or replace function public.handle_order_delivered()
returns trigger as $$
declare
  v_driver_trip_count int;
  v_driver_share numeric(10,2);
  v_commission_rate numeric(4,3);
  v_monthly_gmv numeric;
  v_commission_amount numeric(10,2);
  v_net_amount numeric(10,2);
begin
  -- Only fire when transitioning to 'delivered'
  if new.status <> 'delivered' or old.status = 'delivered' then
    return new;
  end if;

  -- DRIVER EARNINGS
  if new.driver_id is not null then
    select count(*) into v_driver_trip_count
      from public.driver_earnings
      where driver_id = new.driver_id and type = 'delivery';

    -- First 100 trips: 100% to driver, after that: 80% of delivery fee
    if v_driver_trip_count < 100 then
      v_driver_share := new.delivery_fee;
    else
      v_driver_share := round(new.delivery_fee * 0.80, 2);
    end if;

    insert into public.driver_earnings (driver_id, order_id, amount, type, payout_status)
    values (new.driver_id, new.id, v_driver_share, 'delivery', 'pending');
  end if;

  -- MERCHANT EARNINGS — 15% commission, 12% if monthly GMV > R50k
  select coalesce(sum(gross_amount), 0) into v_monthly_gmv
    from public.merchant_earnings
    where restaurant_id = new.restaurant_id
      and created_at >= date_trunc('month', now());

  if v_monthly_gmv > 50000 then
    v_commission_rate := 0.12;
  else
    v_commission_rate := 0.15;
  end if;

  v_commission_amount := round(new.subtotal * v_commission_rate, 2);
  v_net_amount := new.subtotal - v_commission_amount;

  insert into public.merchant_earnings (
    restaurant_id, order_id, gross_amount, commission_rate,
    commission_amount, net_amount, payout_status
  ) values (
    new.restaurant_id, new.id, new.subtotal, v_commission_rate,
    v_commission_amount, v_net_amount, 'pending'
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_order_delivered on public.orders;
create trigger trg_order_delivered
  after update on public.orders
  for each row execute function public.handle_order_delivered();

-- ═══════════════════════════════════════════
-- ORDER CANCELLED → REFUND
-- ═══════════════════════════════════════════
create or replace function public.handle_order_cancelled()
returns trigger as $$
declare
  v_payment record;
begin
  if new.status <> 'cancelled' or old.status = 'cancelled' then
    return new;
  end if;

  -- Find a completed payment for this order (most recent first)
  select * into v_payment
    from public.payments
    where order_id = new.id and status = 'completed'
    order by created_at desc
    limit 1;

  if v_payment.id is null then
    return new; -- nothing to refund
  end if;

  -- Insert refund payment record
  insert into public.payments (
    order_id, user_id, amount, currency, provider,
    status, payload
  ) values (
    new.id, v_payment.user_id, v_payment.amount, v_payment.currency, 'wallet',
    'completed', jsonb_build_object('refund_for', v_payment.id::text)
  );

  -- Credit wallet
  if v_payment.user_id is not null then
    perform public.wallet_credit(
      v_payment.user_id,
      v_payment.amount,
      'refund',
      'Refund for cancelled order',
      v_payment.id::text,
      v_payment.id,
      new.id,
      jsonb_build_object('original_provider', v_payment.provider)
    );
  end if;

  -- Mark original payment refunded
  update public.payments
    set status = 'refunded', updated_at = now()
    where id = v_payment.id;

  -- Cancel any pending earnings
  update public.driver_earnings
    set payout_status = 'cancelled'
    where order_id = new.id and payout_status = 'pending';

  update public.merchant_earnings
    set payout_status = 'cancelled'
    where order_id = new.id and payout_status = 'pending';

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_order_cancelled on public.orders;
create trigger trg_order_cancelled
  after update on public.orders
  for each row execute function public.handle_order_cancelled();

-- ═══════════════════════════════════════════
-- REALTIME for new tables
-- ═══════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.merchant_earnings;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.payouts;
exception when duplicate_object then null; end $$;
