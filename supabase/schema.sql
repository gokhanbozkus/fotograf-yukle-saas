-- Tables
create table if not exists public.tenants (
  slug text primary key,
  name text not null,
  logo_url text,
  cover_url text,
  theme_color text default '#8b5cf6',
  created_at timestamp with time zone default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null references public.tenants(slug) on delete cascade,
  path text not null,
  public_url text not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.tenants enable row level security;
alter table public.photos enable row level security;

-- Anyone can read tenants and photos (public gallery); writes go via anon key
create policy if not exists "read_tenants_public" on public.tenants for select using (true);
create policy if not exists "read_photos_public" on public.photos for select using (true);
create policy if not exists "insert_photos_anon" on public.photos for insert with check (true);

-- Storage bucket: create `photos` and make it public via dashboard (or SQL if using storage API).
-- Ensure files are publicly readable but only uploaded via anon key.
