-- Optional demo data. Run after schema.sql.
-- Use GOOGLE_DRIVE with a Google Drive file ID, or DIRECT with a direct video URL.

insert into public.playlists (id, title, description, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'السيرة النبوية', 'رحلة نتعرّف فيها على سيرة نبينا ﷺ وأهم المواقف والدروس.', 1),
  ('22222222-2222-4222-8222-222222222222', 'العقيدة', 'مفاهيم الإيمان الأساسية بلغة سهلة وقريبة من الطفل.', 2),
  ('33333333-3333-4333-8333-333333333333', 'الآداب', 'نتعلّم أخلاق المسلم وآدابه في البيت والمدرسة ومع الناس.', 3)
on conflict (id) do nothing;

insert into public.videos (playlist_id, title, description, drive_file_id, video_url, video_source, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'الهجرة', 'نبدأ مع أحداث الهجرة وما نتعلمه منها.', 'REPLACE_WITH_DRIVE_FILE_ID_001', null, 'GOOGLE_DRIVE', 1);
