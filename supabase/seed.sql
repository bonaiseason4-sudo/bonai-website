-- Optional demo data. Run after schema.sql.
-- Use GOOGLE_DRIVE with a Google Drive file ID, or DIRECT with a direct video URL.

insert into public.playlists (id, title, description, sort_order)
values
  ('AL_SEERAH', 'السيرة النبوية', 'رحلة نتعرّف فيها على سيرة نبينا ﷺ وأهم المواقف والدروس.', 1),
  ('AL_AQEEDAH', 'العقيدة', 'مفاهيم الإيمان الأساسية بلغة سهلة وقريبة من الطفل.', 2),
  ('AL_ADAB', 'الآداب', 'نتعلّم أخلاق المسلم وآدابه في البيت والمدرسة ومع الناس.', 3)
on conflict (id) do nothing;

insert into public.videos (id, playlist_id, title, description, drive_file_id, video_url, video_source, sort_order)
values
  ('AL_SEERAH_01', 'AL_SEERAH', 'الهجرة', 'نبدأ مع أحداث الهجرة وما نتعلمه منها.', 'REPLACE_WITH_DRIVE_FILE_ID_001', null, 'GOOGLE_DRIVE', 1);
