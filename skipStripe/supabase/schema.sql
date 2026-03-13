create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_secret_key text not null,
  stripe_webhook_secret text,
  stripe_account_id text,
  webhook_token text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  invoice_number text not null unique,
  payment_id text not null,
  customer_email text not null,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  pdf_url text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_user_payment_unique
on public.invoices(user_id, payment_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.stripe_connections enable row level security;
alter table public.invoices enable row level security;

create policy "Users can read their own profile"
on public.users
for select
using (auth.uid() = id);

create policy "Users can manage their own stripe connection"
on public.stripe_connections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own invoices"
on public.invoices
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
