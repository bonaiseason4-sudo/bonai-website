-- Bunay database schema for Supabase PostgreSQL
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  image_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  drive_file_id text,
  video_url text,
  video_source text not null check (video_source in ('GOOGLE_DRIVE', 'DIRECT')),
  check (
    (video_source = 'GOOGLE_DRIVE' and char_length(trim(coalesce(drive_file_id, ''))) >= 10 and video_url is null)
    or (video_source = 'DIRECT' and char_length(trim(coalesce(video_url, ''))) >= 10 and drive_file_id is null)
  ),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_playlists_active_sort on public.playlists (is_active, sort_order, created_at);
create index if not exists idx_videos_playlist_active_sort on public.videos (playlist_id, is_active, sort_order, created_at);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  url text not null check (char_length(trim(url)) >= 10),
  file_type text not null default 'OTHER' check (file_type in ('PDF', 'POWERPOINT', 'WORD', 'SPREADSHEET', 'GOOGLE_FORM', 'GEMINI_QUIZ', 'LINK', 'OTHER')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_attachments_video_active_sort on public.attachments (video_id, is_active, sort_order, created_at);

alter table public.playlists enable row level security;
alter table public.videos enable row level security;
alter table public.attachments enable row level security;

-- Public visitors may only read active playlists.
drop policy if exists "Public can read active playlists" on public.playlists;
create policy "Public can read active playlists"
on public.playlists
for select
to anon, authenticated
using (is_active = true);

-- Public visitors may read active videos only when their parent playlist is also active.
drop policy if exists "Public can read active videos in active playlists" on public.videos;
create policy "Public can read active videos in active playlists"
on public.videos
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.playlists p
    where p.id = videos.playlist_id
      and p.is_active = true
  )
);

drop policy if exists "Public can read active attachments in active videos" on public.attachments;
create policy "Public can read active attachments in active videos"
on public.attachments
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.videos v
    join public.playlists p on p.id = v.playlist_id
    where v.id = attachments.video_id and v.is_active = true and p.is_active = true
  )
);

-- No INSERT / UPDATE / DELETE policies are intentionally created for anon/authenticated users.
-- Manage content from the Supabase Dashboard for v1. A future admin panel can add authenticated admin-only policies.
