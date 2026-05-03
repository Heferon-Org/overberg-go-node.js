-- OverBerg Go — Phase 2 migration
-- Auth enhancements: auto-create profile on signup, KYC storage bucket,
-- profile completion tracking

-- ═══════════════════════════════════════════
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ═══════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, area)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    'customer',
    'Struisbaai'
  )
  on conflict (id) do update set
    phone = coalesce(excluded.phone, profiles.phone),
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════
-- UPDATE PROFILE TRIGGER (updated_at)
-- ═══════════════════════════════════════════
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

drop trigger if exists set_surge_zones_updated_at on public.surge_zones;
create trigger set_surge_zones_updated_at
  before update on public.surge_zones
  for each row execute function public.handle_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.handle_updated_at();

-- ═══════════════════════════════════════════
-- PROFILE UPSERT POLICY (users can update own profile)
-- ═══════════════════════════════════════════
do $$ begin
  create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own profile"
    on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════
-- KYC STORAGE BUCKET
-- ═══════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Storage policies for KYC bucket
do $$ begin
  create policy "Users can upload own KYC files"
    on storage.objects for insert
    with check (
      bucket_id = 'kyc-documents'
      and (storage.foldername(name))[1] = 'kyc'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can view own KYC files"
    on storage.objects for select
    using (
      bucket_id = 'kyc-documents'
      and (storage.foldername(name))[1] = 'kyc'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own KYC files"
    on storage.objects for update
    using (
      bucket_id = 'kyc-documents'
      and (storage.foldername(name))[1] = 'kyc'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;
