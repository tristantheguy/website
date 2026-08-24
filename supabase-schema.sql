-- Run manually in the Supabase SQL editor. This file does not execute anything.
-- Safe to re-run: it creates missing objects and replaces only this shop's policies/functions.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Collection',
  image_url text,
  price_cents integer not null default 0 check (price_cents >= 0),
  price_label text,
  badge_label text not null default 'Available',
  art_style text not null default 'blue' check (art_style in ('blue', 'violet', 'teal', 'coral')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add shop fields safely if an earlier products table already exists.
alter table public.products add column if not exists price_label text;
alter table public.products add column if not exists badge_label text not null default 'Available';
alter table public.products add column if not exists art_style text not null default 'blue';
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists is_active boolean not null default false;

alter table public.profiles enable row level security;
alter table public.products enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
  for select to anon, authenticated
  using (is_active = true);
drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products" on public.products
  for select to authenticated
  using (public.is_admin());
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products for delete to authenticated using (public.is_admin());

-- The browser never writes profiles. Manage this allowlist only in the SQL editor.
-- This optional policy lets a signed-in user read only their own profile row.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create or replace function public.set_products_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

-- Bootstrap only after creating mersontristan@gmail.com in Auth. Copy that user's UUID,
-- replace AUTH_USER_UUID below, and run the statement manually. Do not expose this operation
-- through client code and do not add other authenticated users unless they should be admins.
-- insert into public.profiles (id, email, is_admin)
-- values ('AUTH_USER_UUID', 'mersontristan@gmail.com', true)
-- on conflict (id) do update set email = excluded.email, is_admin = true;
