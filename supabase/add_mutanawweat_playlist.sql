-- Adds the "متنوع" playlist without changing any existing rows.
-- Safe to re-run: existing ids are left untouched.

begin;

insert into public.playlists (id, title, description, sort_order, is_active)
values ('MUTANAWWEAT', 'متنوع', null, 4, true)
on conflict (id) do nothing;

insert into public.videos (id, playlist_id, title, drive_file_id, video_url, video_source, sort_order, is_active)
values
  ('MUTANAWWEAT_01', 'MUTANAWWEAT', 'كيف نستقبل رمضان؟', '1oEQikL7wUXkQRNbx91fEdeF7dFti1Gtc', null, 'GOOGLE_DRIVE', 1, true),
  ('MUTANAWWEAT_02', 'MUTANAWWEAT', 'ماذا نظن في الله؟', '1-905P7EbXrAVTSySxsLEChhOQva2j59d', null, 'GOOGLE_DRIVE', 2, true),
  ('MUTANAWWEAT_03', 'MUTANAWWEAT', 'قصة سيدنا نوح - عليه السلام -', '1B7WYM72xKonIBSbMSd7zTWMue0kybvbG', null, 'GOOGLE_DRIVE', 3, true),
  ('MUTANAWWEAT_04', 'MUTANAWWEAT', 'سورة الحجرات - 1', '1B5FxYLBzFPVDgwZBtDJn9liJLwAXRnG4', null, 'GOOGLE_DRIVE', 4, true)
on conflict (id) do nothing;

insert into public.attachments (id, video_id, title, url, file_type, sort_order, is_active)
values
  ('MUTANAWWEAT_01_ATTACHMENT', 'MUTANAWWEAT_01', 'ملف درس كيف نستقبل رمضان؟', 'https://drive.google.com/file/d/1vb70WyE29JwYFYMRCVf2rEaplsCma-aC/view?usp=sharing', 'PDF', 1, true),
  ('MUTANAWWEAT_03_QUIZ', 'MUTANAWWEAT_03', 'اختبار قصة سيدنا نوح', 'https://forms.gle/h4U4UsTfWj1FRpw1A', 'GOOGLE_FORM', 1, true),
  ('MUTANAWWEAT_03_ATTACHMENT', 'MUTANAWWEAT_03', 'ملف قصة سيدنا نوح', 'https://drive.google.com/file/d/1gn3oXVbzcotkUS0F4IqrooZokYkvNXGo/view?usp=sharing', 'PDF', 2, true)
on conflict (id) do nothing;

commit;
