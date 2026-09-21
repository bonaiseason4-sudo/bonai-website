-- Replaces every existing playlist and video with the two supplied entries.
-- Requires public.videos.video_source (not drive_file_id).

begin;

delete from public.playlists;

with inserted_playlists as (
  insert into public.playlists (title, description, sort_order, is_active)
  values
    ('السيرة النبوية - المرحلة المدنية', null, 1, true),
    ('سعادة المؤمن', null, 2, true)
  returning id, title
)
insert into public.videos (playlist_id, title, drive_file_id, video_url, video_source, sort_order, is_active)
select
  id,
  title,
  case when title = 'السيرة النبوية - المرحلة المدنية' then '1f16HK7XEe-pBccw1rTc3r8TRG0VXydkB' end,
  case when title = 'سعادة المؤمن' then 'https://video.vconnct.us/xcrneybbaxbrcwmp/5c968bfc93_2024-11-03-19-20-36.mp4' end,
  case when title = 'السيرة النبوية - المرحلة المدنية' then 'GOOGLE_DRIVE' else 'DIRECT' end,
  1,
  true
from inserted_playlists;

commit;
