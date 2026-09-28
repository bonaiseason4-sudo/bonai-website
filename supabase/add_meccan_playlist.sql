-- Adds "السيرة النبوية - المرحلة المكية" with eight ordered videos and attachments.
-- It replaces only a playlist with this exact title, so it can be safely re-run.

with removed_playlist as (
  delete from public.playlists where title = 'السيرة النبوية - المرحلة المكية'
),
new_playlist as (
  insert into public.playlists (id, title, description, sort_order, is_active)
  values ('AL_SEERAH_MAKKIYYAH', 'السيرة النبوية - المرحلة المكية', 'حلقات السيرة النبوية في المرحلة المكية.', 3, true)
  returning id
),
new_videos as (
  insert into public.videos (id, playlist_id, title, video_url, video_source, sort_order, is_active)
  select 'AL_SEERAH_MAKKIYYAH_' || episode_number,
    new_playlist.id,
    'الحلقة ' || case episode_number
      when 1 then 'الأولى' when 2 then 'الثانية' when 3 then 'الثالثة' when 4 then 'الرابعة'
      when 5 then 'الخامسة' when 6 then 'السادسة' when 7 then 'السابعة' when 8 then 'الثامنة'
    end,
    video_url, 'DIRECT', episode_number, true
  from new_playlist
  cross join (
    values
      (1, 'https://classroom.vconnct.com/playback/video/b5bb078499b1a0c1090fbe75ae2b63d63be6afc1-1731261399772/'),
      (2, 'https://classroom.vconnct.com/playback/video/c1024f2df4603e4129225984100cbde738c493a2-1732467343722/'),
      (3, 'https://classroom.vconnct.com/playback/video/138affc392f3f4a0c76c6be5ea85e7817a891ab4-1733680571331/'),
      (4, 'https://classroom.vconnct.com/playback/video/6436266cf0352b6427c9f74a23ec0f3d97ca316a-1734890138107/'),
      (5, 'https://classroom.vconnct.com/playback/video/9194be1014401436928c6a1822ae47b7aa2586ec-1736058222918/'),
      (6, 'https://classroom.vconnct.com/video/f0edf9e5485b4acc1bd5314ea2f0db14ce15fe65-1739876442556/'),
      (7, 'https://classroom.vconnct.com/video/0a9a943de52c0fe2069ddf7b31406e69157bc319-1743966670660/'),
      (8, 'https://rec.vconnct.us/RM_aKeb3nkanFaQ/RM_aKeb3nkanFaQ-1745773822923.mp4')
  ) as source(episode_number, video_url)
  returning id, sort_order
)
insert into public.attachments (id, video_id, title, url, file_type, sort_order, is_active)
select new_videos.id || '_ATTACHMENT', new_videos.id,
  'مرفق الحلقة ' || case new_videos.sort_order
    when 1 then 'الأولى' when 2 then 'الثانية' when 3 then 'الثالثة' when 4 then 'الرابعة'
    when 5 then 'الخامسة' when 6 then 'السادسة' when 7 then 'السابعة' when 8 then 'الثامنة'
  end,
  source.url, 'OTHER', 1, true
from new_videos
join (
  values
    (1, 'https://drive.google.com/file/d/1xdPscqphNUidiPj2OO7ge6XZQAK47TyC/view?usp=sharing'),
    (2, 'https://drive.google.com/file/d/1ge17QXao9lIEUCUVWCWSutpmRGvLQmrB/view?usp=sharing'),
    (3, 'https://drive.google.com/file/d/1Gcvtb-BhJM_qmuVN59Vd8bAm-rMlnWDM/view?usp=drivesdk'),
    (4, 'https://drive.google.com/file/d/1Yhoo34fhRATMsF8zzGnb2VkVw8Mw-7J6/view?usp=sharing'),
    (5, 'https://drive.google.com/file/d/1eFLAe9P8S2gNVQEutKyLeW35aRPvACT1/view?usp=drivesdk'),
    (6, 'https://drive.google.com/file/d/1XPjy6CWLwSYnvmzrkQePxwoKxopAtXf8/view?usp=drivesdk'),
    (7, 'https://drive.google.com/file/d/1PyeoSWo8dk1u7MzHpiggVjHQBD9uzbTA/view?usp=drivesdk'),
    (8, 'https://drive.google.com/file/d/1xQTJJGO8XQ5wCsC_FPjGxe0svLN-sKm5/view?usp=sharing')
  ) as source(episode_number, url)
  on source.episode_number = new_videos.sort_order;
