-- UUID için
create extension if not exists pgcrypto;

-- Storage bucket (public)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Storage policies: public read + anon insert (ilk sürüm için pratik)
create policy if not exists "photos public read"
on storage.objects for select
using (bucket_id = 'photos');

create policy if not exists "photos anon insert"
on storage.objects for insert
to public
with check (bucket_id = 'photos');

-- App tabloları
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

create policy if not exists "read_tenants_public"
on public.tenants for select using (true);

create policy if not exists "read_photos_public"
on public.photos for select using (true);

create policy if not exists "insert_photos_anon"
on public.photos for insert with check (true);
