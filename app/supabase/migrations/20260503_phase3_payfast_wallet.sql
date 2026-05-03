-- OverBerg Go — Phase 3 migration
-- PayFast payments + wallet ledger.

-- ═══════════════════════════════════════════
-- WALLET TRANSACTIONS (immutable ledger)
-- ═══════════════════════════════════════════
create table if not exists public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in (
    'topup', 'payment', 'refund', 'cashback', 'referral', 'withdrawal', 'adjustment'
  )),
  amount numeric(10,2) not null,
  balance_after numeric(10,2) not null,
  description text not null,
  reference text,
  payment_id uuid references public.payments(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.wallet_transactions enable row level security;

create policy "Users can view own wallet transactions"
  on public.wallet_transactions for select using (auth.uid() = user_id);

create index if not exists idx_wallet_user on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_wallet_payment on public.wallet_transactions(payment_id);
create index if not exists idx_wallet_order on public.wallet_transactions(order_id);

-- ═══════════════════════════════════════════
-- WALLET BALANCE COLUMN ON PROFILES
-- ═══════════════════════════════════════════
alter table public.profiles
  add column if not exists wallet_balance numeric(10,2) default 0 not null;

-- ═══════════════════════════════════════════
-- LEDGER FUNCTIONS (atomic balance update)
-- ═══════════════════════════════════════════
create or replace function public.wallet_credit(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text,
  p_reference text default null,
  p_payment_id uuid default null,
  p_order_id uuid default null,
  p_metadata jsonb default null
)
returns table(transaction_id uuid, new_balance numeric)
language plpgsql
security definer
as $$
declare
  v_new_balance numeric;
  v_tx_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'wallet_credit amount must be positive';
  end if;

  update public.profiles
    set wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    where id = p_user_id
    returning wallet_balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'profile not found';
  end if;

  insert into public.wallet_transactions (
    user_id, type, amount, balance_after, description,
    reference, payment_id, order_id, metadata
  ) values (
    p_user_id, p_type, p_amount, v_new_balance, p_description,
    p_reference, p_payment_id, p_order_id, p_metadata
  ) returning id into v_tx_id;

  return query select v_tx_id, v_new_balance;
end;
$$;

create or replace function public.wallet_debit(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text,
  p_reference text default null,
  p_payment_id uuid default null,
  p_order_id uuid default null,
  p_metadata jsonb default null
)
returns table(transaction_id uuid, new_balance numeric)
language plpgsql
security definer
as $$
declare
  v_current_balance numeric;
  v_new_balance numeric;
  v_tx_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'wallet_debit amount must be positive';
  end if;

  select wallet_balance into v_current_balance
    from public.profiles where id = p_user_id for update;

  if v_current_balance is null then
    raise exception 'profile not found';
  end if;

  if v_current_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  update public.profiles
    set wallet_balance = wallet_balance - p_amount,
        updated_at = now()
    where id = p_user_id
    returning wallet_balance into v_new_balance;

  insert into public.wallet_transactions (
    user_id, type, amount, balance_after, description,
    reference, payment_id, order_id, metadata
  ) values (
    p_user_id, p_type, -p_amount, v_new_balance, p_description,
    p_reference, p_payment_id, p_order_id, p_metadata
  ) returning id into v_tx_id;

  return query select v_tx_id, v_new_balance;
end;
$$;

grant execute on function public.wallet_credit to authenticated, service_role;
grant execute on function public.wallet_debit to authenticated, service_role;

-- ═══════════════════════════════════════════
-- REALTIME for wallet_transactions
-- ═══════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.wallet_transactions;
exception when duplicate_object then null; end $$;
