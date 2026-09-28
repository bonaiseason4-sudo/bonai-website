-- One-time migration: UUID ids -> readable text ids.
-- Reviewed against the current production rows on 2026-09-28.
-- It changes ONLY id / foreign-key columns. Titles, URLs, video sources,
-- descriptions, ordering, active flags, and timestamps are left unchanged.
-- The preflight checks deliberately stop the transaction if the data differs.

begin;

do $$
begin
  if (select count(*) from public.playlists) <> 3 then
    raise exception 'Migration stopped: expected 3 playlists.';
  end if;
  if (select count(*) from public.videos) <> 10 then
    raise exception 'Migration stopped: expected 10 videos.';
  end if;
  if (select count(*) from public.attachments) <> 10 then
    raise exception 'Migration stopped: expected 10 attachments.';
  end if;
  if not exists (
    select 1 from public.playlists
    where id::text not in ('AL_SEERAH_MAKKIYYAH', 'AL_SEERAH_MADANIYYAH', 'SAADAT_AL_MUMIN')
  ) then
    raise exception 'Migration already applied. Do not run this file again.';
  end if;
  if exists (
    select 1 from public.playlists
    where id::text not in (
      'cb5df8cc-d3a9-4e64-baa2-e5b56bbf1f5f',
      '30db8d7c-d2c8-40d0-8683-e9655a656e54',
      '4f6dba85-a1f2-4b5c-9a36-db90507f849f'
    )
  ) then
    raise exception 'Migration stopped: unexpected playlist id found.';
  end if;
  if exists (
    select 1 from public.videos
    where id::text not in (
      '37c97f85-b74b-41c8-a78b-11ebc33ba97a', '4e9410e1-f1d5-444e-89f8-6905c9c9aad1',
      'adfafaa8-1043-44f7-bb42-0efc78657a98', 'b39cfc4c-2561-40f4-829d-4772869336e7',
      '48274671-89b7-4008-9188-e3ae25612777', '1180df01-69b5-43e7-81b1-9d3bd046b324',
      'bf4e8ef7-07ee-4f23-a5c8-f0c36ca200e7', 'aafbe9a4-f3f7-4cbd-a13a-2e56a6899e12',
      'a5220678-b0ae-4bde-b846-7f6e62fac177', '4767ee5b-1c0d-4cda-8e16-dd19027335c6'
    )
  ) then
    raise exception 'Migration stopped: unexpected video id found.';
  end if;
  if exists (
    select 1 from public.attachments
    where id::text not in (
      'c6d3ca08-57c0-4f58-8a59-51792a91361e', 'ee5b2fb4-a90e-42d3-ae0a-142bf2910121',
      '1bc3593a-f622-44c3-b342-a3bbca3f2cf2', '91195353-d8f9-4d0c-938c-fb605d68cf5d',
      '9f334f01-8cb1-4a38-a124-bc6c566548d3', '59d06412-4077-4415-8c97-5921f61a64c2',
      'f62d52cb-c775-4a43-acb2-53547f464054', '720d73e4-a1b8-4dff-b17b-e6cb5ef24799',
      '9ce02277-5ad9-4dc2-85dc-7c0ef2f22e8d', '1b497ab3-52c7-4f0e-bf44-e7b67f007687'
    )
  ) then
    raise exception 'Migration stopped: unexpected attachment id found.';
  end if;
end $$;

-- Policies reference the UUID relations, so recreate them after conversion.
drop policy if exists "Public can read active attachments in active videos" on public.attachments;
drop policy if exists "Public can read active videos in active playlists" on public.videos;
drop policy if exists "Public can read active playlists" on public.playlists;

alter table public.attachments drop constraint if exists attachments_video_id_fkey;
alter table public.videos drop constraint if exists videos_playlist_id_fkey;

alter table public.playlists alter column id drop default;
alter table public.videos alter column id drop default;
alter table public.attachments alter column id drop default;

alter table public.attachments alter column video_id type text using video_id::text;
alter table public.videos alter column playlist_id type text using playlist_id::text;
alter table public.attachments alter column id type text using id::text;
alter table public.videos alter column id type text using id::text;
alter table public.playlists alter column id type text using id::text;

-- Update foreign keys first, then their parent ids. No URL or content column is updated.
update public.videos
set playlist_id = case playlist_id
  when 'cb5df8cc-d3a9-4e64-baa2-e5b56bbf1f5f' then 'AL_SEERAH_MAKKIYYAH'
  when '30db8d7c-d2c8-40d0-8683-e9655a656e54' then 'AL_SEERAH_MADANIYYAH'
  when '4f6dba85-a1f2-4b5c-9a36-db90507f849f' then 'SAADAT_AL_MUMIN'
end;

update public.attachments
set video_id = case video_id
  when '37c97f85-b74b-41c8-a78b-11ebc33ba97a' then 'AL_SEERAH_MAKKIYYAH_01'
  when '4e9410e1-f1d5-444e-89f8-6905c9c9aad1' then 'AL_SEERAH_MAKKIYYAH_02'
  when 'adfafaa8-1043-44f7-bb42-0efc78657a98' then 'AL_SEERAH_MAKKIYYAH_03'
  when 'b39cfc4c-2561-40f4-829d-4772869336e7' then 'AL_SEERAH_MAKKIYYAH_04'
  when '48274671-89b7-4008-9188-e3ae25612777' then 'AL_SEERAH_MAKKIYYAH_05'
  when '1180df01-69b5-43e7-81b1-9d3bd046b324' then 'AL_SEERAH_MAKKIYYAH_06'
  when 'bf4e8ef7-07ee-4f23-a5c8-f0c36ca200e7' then 'AL_SEERAH_MAKKIYYAH_07'
  when 'aafbe9a4-f3f7-4cbd-a13a-2e56a6899e12' then 'AL_SEERAH_MAKKIYYAH_08'
  when 'a5220678-b0ae-4bde-b846-7f6e62fac177' then 'AL_SEERAH_MADANIYYAH_01'
end;

update public.playlists
set id = case id
  when 'cb5df8cc-d3a9-4e64-baa2-e5b56bbf1f5f' then 'AL_SEERAH_MAKKIYYAH'
  when '30db8d7c-d2c8-40d0-8683-e9655a656e54' then 'AL_SEERAH_MADANIYYAH'
  when '4f6dba85-a1f2-4b5c-9a36-db90507f849f' then 'SAADAT_AL_MUMIN'
end;

update public.videos
set id = case id
  when '37c97f85-b74b-41c8-a78b-11ebc33ba97a' then 'AL_SEERAH_MAKKIYYAH_01'
  when '4e9410e1-f1d5-444e-89f8-6905c9c9aad1' then 'AL_SEERAH_MAKKIYYAH_02'
  when 'adfafaa8-1043-44f7-bb42-0efc78657a98' then 'AL_SEERAH_MAKKIYYAH_03'
  when 'b39cfc4c-2561-40f4-829d-4772869336e7' then 'AL_SEERAH_MAKKIYYAH_04'
  when '48274671-89b7-4008-9188-e3ae25612777' then 'AL_SEERAH_MAKKIYYAH_05'
  when '1180df01-69b5-43e7-81b1-9d3bd046b324' then 'AL_SEERAH_MAKKIYYAH_06'
  when 'bf4e8ef7-07ee-4f23-a5c8-f0c36ca200e7' then 'AL_SEERAH_MAKKIYYAH_07'
  when 'aafbe9a4-f3f7-4cbd-a13a-2e56a6899e12' then 'AL_SEERAH_MAKKIYYAH_08'
  when 'a5220678-b0ae-4bde-b846-7f6e62fac177' then 'AL_SEERAH_MADANIYYAH_01'
  when '4767ee5b-1c0d-4cda-8e16-dd19027335c6' then 'SAADAT_AL_MUMIN_01'
end;

update public.attachments
set id = case id
  when 'c6d3ca08-57c0-4f58-8a59-51792a91361e' then 'AL_SEERAH_MAKKIYYAH_01_ATTACHMENT'
  when 'ee5b2fb4-a90e-42d3-ae0a-142bf2910121' then 'AL_SEERAH_MAKKIYYAH_02_ATTACHMENT'
  when '1bc3593a-f622-44c3-b342-a3bbca3f2cf2' then 'AL_SEERAH_MAKKIYYAH_03_ATTACHMENT'
  when '91195353-d8f9-4d0c-938c-fb605d68cf5d' then 'AL_SEERAH_MAKKIYYAH_04_ATTACHMENT'
  when '9f334f01-8cb1-4a38-a124-bc6c566548d3' then 'AL_SEERAH_MAKKIYYAH_05_ATTACHMENT'
  when '59d06412-4077-4415-8c97-5921f61a64c2' then 'AL_SEERAH_MAKKIYYAH_06_ATTACHMENT'
  when 'f62d52cb-c775-4a43-acb2-53547f464054' then 'AL_SEERAH_MAKKIYYAH_07_ATTACHMENT'
  when '720d73e4-a1b8-4dff-b17b-e6cb5ef24799' then 'AL_SEERAH_MAKKIYYAH_08_ATTACHMENT'
  when '9ce02277-5ad9-4dc2-85dc-7c0ef2f22e8d' then 'AL_SEERAH_MADANIYYAH_01_ATTACHMENT'
  when '1b497ab3-52c7-4f0e-bf44-e7b67f007687' then 'AL_SEERAH_MADANIYYAH_01_QUIZ'
end;

alter table public.videos
  add constraint videos_playlist_id_fkey
  foreign key (playlist_id) references public.playlists(id) on update cascade on delete cascade;
alter table public.attachments
  add constraint attachments_video_id_fkey
  foreign key (video_id) references public.videos(id) on update cascade on delete cascade;

create policy "Public can read active playlists"
on public.playlists for select to anon, authenticated
using (is_active = true);

create policy "Public can read active videos in active playlists"
on public.videos for select to anon, authenticated
using (
  is_active = true and exists (
    select 1 from public.playlists p
    where p.id = videos.playlist_id and p.is_active = true
  )
);

create policy "Public can read active attachments in active videos"
on public.attachments for select to anon, authenticated
using (
  is_active = true and exists (
    select 1 from public.videos v
    join public.playlists p on p.id = v.playlist_id
    where v.id = attachments.video_id and v.is_active = true and p.is_active = true
  )
);

commit;
