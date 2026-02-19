-- Enable useful extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]+$'),
  display_name text,
  avatar_url text,
  profile_public boolean not null default false,
  default_item_public boolean not null default false,
  default_review_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collection
create type public.collection_status as enum ('wishlist', 'currently_watching', 'completed');

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  status public.collection_status not null default 'wishlist',
  is_public boolean not null default false,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create table if not exists public.item_overrides (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null unique references public.collection_items(id) on delete cascade,
  custom_title text,
  custom_creator text,
  custom_release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_notes (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null unique references public.collection_items(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  tags text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  review_text text not null,
  star_rating integer not null check (star_rating between 1 and 5),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create or replace view public.public_reviews as
select
  r.id,
  r.tmdb_id,
  r.media_type,
  r.review_text,
  r.star_rating,
  r.updated_at,
  p.username
from public.item_reviews r
join public.profiles p on p.user_id = r.user_id
join public.collection_items ci
  on ci.user_id = r.user_id
 and ci.tmdb_id = r.tmdb_id
 and ci.media_type = r.media_type
where p.profile_public = true
  and r.is_public = true
  and ci.is_public = true;

alter table public.profiles enable row level security;
alter table public.collection_items enable row level security;
alter table public.item_overrides enable row level security;
alter table public.item_notes enable row level security;
alter table public.item_reviews enable row level security;

-- Profiles policies
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
for select using (auth.uid() = user_id);

drop policy if exists "read public profiles" on public.profiles;
create policy "read public profiles" on public.profiles
for select using (profile_public = true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
for insert with check (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Collection policies
drop policy if exists "crud own collection" on public.collection_items;
create policy "crud own collection" on public.collection_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read public collection" on public.collection_items;
create policy "read public collection" on public.collection_items
for select using (
  is_public = true and exists (
    select 1 from public.profiles p where p.user_id = collection_items.user_id and p.profile_public = true
  )
);

-- Overrides and notes are owner-only through collection ownership
drop policy if exists "crud own overrides" on public.item_overrides;
create policy "crud own overrides" on public.item_overrides
for all using (
  exists (
    select 1 from public.collection_items c
    where c.id = item_overrides.collection_item_id and c.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.collection_items c
    where c.id = item_overrides.collection_item_id and c.user_id = auth.uid()
  )
);

drop policy if exists "crud own notes" on public.item_notes;
create policy "crud own notes" on public.item_notes
for all using (
  exists (
    select 1 from public.collection_items c
    where c.id = item_notes.collection_item_id and c.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.collection_items c
    where c.id = item_notes.collection_item_id and c.user_id = auth.uid()
  )
);

-- Reviews
drop policy if exists "crud own reviews" on public.item_reviews;
create policy "crud own reviews" on public.item_reviews
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read public reviews" on public.item_reviews;
create policy "read public reviews" on public.item_reviews
for select using (
  is_public = true
  and exists (
    select 1
    from public.profiles p
    where p.user_id = item_reviews.user_id and p.profile_public = true
  )
  and exists (
    select 1
    from public.collection_items c
    where c.user_id = item_reviews.user_id
      and c.tmdb_id = item_reviews.tmdb_id
      and c.media_type = item_reviews.media_type
      and c.is_public = true
  )
);
