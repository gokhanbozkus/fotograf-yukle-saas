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

-- 2. seviye çoklu müşteri: ortaklar (satış yaptığınız müşteriler)
create table if not exists public.partners (
  slug text primary key,
  name text not null,
  email text,
  admin_key text not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);

alter table if exists public.partners enable row level security;
create policy if not exists "read_partners_public" on public.partners for select using (true);

-- App tabloları
create table if not exists public.tenants (
  slug text primary key,
  name text not null,
  logo_url text,
  cover_url text,
  theme_color text default '#8b5cf6',
  -- yeni: partner bağlılığı ve son kullanıcı kişiselleştirme
  partner_slug text references public.partners(slug) on delete set null,
  owner_first_name text,
  owner_last_name text,
  owner_photo_url text,
  created_at timestamp with time zone default now()
);
create index if not exists idx_tenants_partner_slug on public.tenants(partner_slug);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null references public.tenants(slug) on delete cascade,
  path text not null,
  public_url text not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table if exists public.tenants enable row level security;
alter table if exists public.photos enable row level security;

create policy if not exists "read_tenants_public"
on public.tenants for select using (true);

create policy if not exists "read_photos_public"
on public.photos for select using (true);

create policy if not exists "insert_photos_anon"
on public.photos for insert with check (true);

