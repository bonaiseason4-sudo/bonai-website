import type { Playlist, Video } from '../types/content'

const createdAt = '2026-09-21T00:00:00.000Z'

export const demoPlaylists: Playlist[] = [
  {
    id: 'seerah', title: 'السيرة النبوية', description: 'رحلة ممتعة نتعرّف فيها على سيرة نبينا ﷺ وأهم المواقف والدروس.',
    image_url: null, sort_order: 1, is_active: true, created_at: createdAt,
  },
  {
    id: 'aqeedah', title: 'العقيدة', description: 'مفاهيم الإيمان الأساسية بلغة سهلة وقريبة من الطفل.',
    image_url: null, sort_order: 2, is_active: true, created_at: createdAt,
  },
  {
    id: 'adab', title: 'الآداب', description: 'نتعلّم أخلاق المسلم وآدابه في البيت والمدرسة ومع الناس.',
    image_url: null, sort_order: 3, is_active: true, created_at: createdAt,
  },
  {
    id: 'stories', title: 'قصص الأنبياء', description: 'قصص مختارة تحمل معاني الصبر والثبات وحسن التوكل.',
    image_url: null, sort_order: 4, is_active: true, created_at: createdAt,
  },
]

export const demoVideos: Video[] = [
  { id: 's1', playlist_id: 'seerah', title: 'الهجرة', description: 'نبدأ مع أحداث الهجرة وما نتعلمه منها.', drive_file_id: 'DEMO_VIDEO_001', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 1, is_active: true, created_at: createdAt },
  { id: 's2', playlist_id: 'seerah', title: 'غزوة بدر', description: 'محطات من غزوة بدر وأبرز معانيها.', drive_file_id: 'DEMO_VIDEO_002', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 2, is_active: true, created_at: createdAt },
  { id: 's3', playlist_id: 'seerah', title: 'غزوة أحد', description: 'نتعرّف على أحداث أحد والدروس المستفادة.', drive_file_id: 'DEMO_VIDEO_003', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 3, is_active: true, created_at: createdAt },
  { id: 's4', playlist_id: 'seerah', title: 'صلح الحديبية', description: 'قصة الصلح وما فيها من حكمة وبعد نظر.', drive_file_id: 'DEMO_VIDEO_004', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 4, is_active: true, created_at: createdAt },
  { id: 's5', playlist_id: 'seerah', title: 'فتح مكة', description: 'كيف عاد النبي ﷺ إلى مكة في يوم الفتح.', drive_file_id: 'DEMO_VIDEO_005', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 5, is_active: true, created_at: createdAt },
  { id: 'a1', playlist_id: 'aqeedah', title: 'معرفة الله', description: 'مدخل بسيط لمعرفة الله سبحانه وتعالى.', drive_file_id: 'DEMO_VIDEO_101', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 1, is_active: true, created_at: createdAt },
  { id: 'a2', playlist_id: 'aqeedah', title: 'أركان الإيمان', description: 'نتعرّف على أركان الإيمان الستة.', drive_file_id: 'DEMO_VIDEO_102', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 2, is_active: true, created_at: createdAt },
  { id: 'a3', playlist_id: 'aqeedah', title: 'الإيمان بالملائكة', description: 'ماذا نعرف عن الملائكة؟', drive_file_id: 'DEMO_VIDEO_103', video_url: null, video_source: 'GOOGLE_DRIVE', sort_order: 3, is_active: true, created_at: createdAt },
]
