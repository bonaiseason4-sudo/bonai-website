-- Run once after migrate_existing_database.sql.
-- This changes only foreign-key behavior; it does not update or delete any data.

begin;

alter table public.attachments drop constraint if exists attachments_video_id_fkey;
alter table public.videos drop constraint if exists videos_playlist_id_fkey;

alter table public.videos
  add constraint videos_playlist_id_fkey
  foreign key (playlist_id)
  references public.playlists(id)
  on update cascade
  on delete cascade;

alter table public.attachments
  add constraint attachments_video_id_fkey
  foreign key (video_id)
  references public.videos(id)
  on update cascade
  on delete cascade;

commit;
