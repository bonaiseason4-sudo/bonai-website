-- Run in Supabase SQL Editor. Adds the two videos and the Hudaybiyyah link.
-- Existing lesson videos and attachments are preserved; safe to re-run.
begin;

do $$
begin
  if not exists (
    select 1 from public.videos
    where id = 'AL_SEERAH_MADANIYYAH_04'
      and playlist_id = 'AL_SEERAH_MADANIYYAH'
      and title = 'صلح الحديبية'
  ) then
    raise exception 'Expected Hudaybiyyah lesson was not found; no changes applied.';
  end if;
end $$;

insert into public.videos
  (id, playlist_id, title, drive_file_id, video_url, video_source, sort_order, is_active)
values
  ('AL_SEERAH_MADANIYYAH_05', 'AL_SEERAH_MADANIYYAH', 'براءة أم المؤمنين', '1ae3hQ7aSNhdns_Io2MPRPKuyn-qaip1R', null, 'GOOGLE_DRIVE', 5, true),
  ('AL_SEERAH_MADANIYYAH_06', 'AL_SEERAH_MADANIYYAH', 'ما قبل فتح مكة', '1qij8oGwt2lxyTTiiQjYOcB0m9UxgyE4D', null, 'GOOGLE_DRIVE', 6, true)
on conflict (id) do nothing;

insert into public.attachments
  (id, video_id, title, url, file_type, sort_order, is_active)
select
  'AL_SEERAH_MADANIYYAH_04_NOTEBOOKLM',
  'AL_SEERAH_MADANIYYAH_04',
  'صلح الحديبية — NotebookLM',
  'https://notebook.google.com/notebook/855df63f-5530-4bae-b0ab-d42e51b31c0a/artifact/4acc6d02-a2e2-445f-813a-4f60c2a657f1',
  'LINK',
  coalesce(max(sort_order), 0) + 1,
  true
from public.attachments
where video_id = 'AL_SEERAH_MADANIYYAH_04'
on conflict (id) do nothing;

commit;
