-- Run once in Supabase SQL Editor for the existing database.

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

alter table public.attachments enable row level security;

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
