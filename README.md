# بنيّ — Bunay

منصة عربية بسيطة للأطفال لعرض سلاسل فيديو تعليمية. الواجهة مبنية بـ React + Vite + TypeScript، البيانات من Supabase، والفيديوهات تُعرض من Google Drive بدون رفعها على استضافة الموقع.

## Stack

- React + Vite + TypeScript
- React Router
- Supabase PostgreSQL + Row Level Security
- Google Drive preview player
- Cloudflare Pages-ready
- Plain CSS (بدون UI framework ثقيل)

## كيف تعمل المنظومة؟

```text
Visitor -> React website -> Supabase (playlists + videos metadata)
                         -> Google Drive (actual video playback)
```

الموقع لا يخزن الفيديوهات. قاعدة البيانات تخزن نوع المصدر في `video_source` ومعلومات السلسلة/الدرس.

---

## 1) إنشاء Supabase

1. أنشئ مشروعًا جديدًا في Supabase.
2. افتح **SQL Editor**.
3. انسخ كل محتوى `supabase/schema.sql` وشغّله.
4. اختياري: شغّل `supabase/seed.sql` لإضافة بيانات تجريبية. غيّر `REPLACE_WITH_DRIVE_FILE_ID...` قبل الاعتماد عليها لتشغيل الفيديو.

### ما الذي يفعله schema.sql؟

- ينشئ `playlists` و`videos`.
- يضيف Foreign Key مع `ON DELETE CASCADE`.
- يضيف Indexes للقراءات والترتيب.
- يفعّل RLS.
- يسمح للزائر بقراءة **المحتوى النشط فقط**.
- لا يمنح Public أي صلاحيات INSERT / UPDATE / DELETE.

لهذا تستطيع استخدام الـanon key في الواجهة بأمان **طالما RLS مفعّل والسياسات لم يتم توسيعها بشكل غير آمن**.

> لا تضع `service_role` key في React أو Cloudflare Pages frontend. هذا Secret كامل الصلاحيات ويجب أن يبقى في بيئة Server موثوقة فقط.

---

## 2) Environment variables

انسخ:

```bash
cp .env.example .env
```

ثم من Supabase: **Project Settings > API** ضع:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_USE_DEMO_DATA=false
```

`VITE_SUPABASE_URL` وpublic `anon` key يظهران في Browser وهذا متوقع في Supabase. الحماية الفعلية تأتي من RLS.

إذا لم تضف هذه القيم، الموقع يدخل Demo mode تلقائيًا لتستطيع معاينة التصميم.

---

## 3) رفع الفيديو على Google Drive

1. ارفع الفيديو إلى Google Drive.
2. افتح **Share**.
3. غيّر General access إلى **Anyone with the link**.
4. اختر **Viewer**.
5. الرابط المعتاد يكون مثل:

```text
https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view?usp=sharing
```

لفيديو Google Drive، ضع File ID في `drive_file_id` واجعل `video_source` مساويًا لـ `GOOGLE_DRIVE`. لرابط MP4 مباشر مثل Vconnct، ضع الرابط في `video_url` واجعل `video_source` مساويًا لـ `DIRECT`.

الموقع يبني تلقائيًا:

```text
https://drive.google.com/file/d/{FILE_ID}/preview
```

### ملاحظات Google Drive

- إذا لم تجعل الملف قابلًا للمشاهدة بواسطة الرابط، قد يظهر طلب صلاحية داخل المشغّل.
- Google Drive مناسب لموقع صغير/تعليمي، لكنه ليس Video CDN متخصصًا. لو زاد الجمهور جدًا مستقبلًا، يمكن نقل الفيديوهات إلى منصة Streaming بدون تغيير بنية الـPlaylists كثيرًا.

---

## 4) إضافة Playlist من Supabase Dashboard

اذهب إلى **Table Editor > playlists > Insert row**.

مثال:

```text
title: السيرة النبوية
description: رحلة مبسطة في سيرة النبي ﷺ
image_url: null
sort_order: 1
is_active: true
```

`image_url` اختياري. إذا كان فارغًا يعرض الموقع Artwork لوني بدل الصورة.

## 5) إضافة Video

من **Table Editor > videos > Insert row**:

```text
playlist_id: اختر id الخاص بالسلسلة
title: صلح الحديبية
description: درس مبسط عن أحداث الصلح
drive_file_id: GOOGLE_DRIVE_FILE_ID
video_url: null
video_source: GOOGLE_DRIVE
sort_order: 3
is_active: true
```

بعد الحفظ وRefresh للموقع سيظهر الدرس. لا تحتاج تعديل HTML أو Deploy جديد.

---

## 6) تشغيل المشروع محليًا

المتطلبات: Node.js حديث يدعم Vite 7.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

الملفات النهائية تكون في:

```text
dist/
```

---

## 7) Deploy على Cloudflare Pages

### الطريقة المقترحة: GitHub + Cloudflare Pages

1. ارفع المشروع إلى GitHub repository.
2. في Cloudflare Dashboard افتح **Workers & Pages > Create > Pages > Connect to Git**.
3. اختر repository.
4. إعدادات الـbuild:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

5. أضف Environment variables في Cloudflare Pages:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_USE_DEMO_DATA=false
```

6. Deploy.

ملف `public/_redirects` موجود بالفعل حتى تعمل روابط React مثل `/playlist/:id` عند فتحها مباشرة أو عمل Refresh.

ستحصل على رابط شبيه بـ:

```text
https://your-project.pages.dev
```

---

## 8) Security checklist

- ✅ RLS enabled.
- ✅ Public SELECT محدود بالمحتوى النشط.
- ✅ لا توجد Public write policies.
- ✅ لا يوجد `service_role` key في المشروع.
- ✅ `.env` داخل `.gitignore`.
- ✅ بيانات الفيديو مجرد Drive IDs.

عند بناء `/admin` مستقبلًا: استخدم Supabase Auth، ثم أنشئ صلاحيات admin واضحة قبل إضافة سياسات الكتابة. لا تجعل وجود Login وحده كافيًا للكتابة.

---

## 9) Project structure

```text
src/
├── assets/
├── components/
├── hooks/
├── lib/
├── pages/
├── services/
├── styles/
└── types/

supabase/
├── schema.sql
└── seed.sql
```

## 10) Routes

```text
/                 Home
/playlist/:id     Playlist + player
*                 404
```

## 11) تعديل الشكل

الألوان الأساسية في `src/styles/global.css` داخل `:root`، واللوجو في:

```text
src/assets/bunay-logo.png
```

---

## الخطوات المختصرة بعد استلام المشروع

1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. أضف `.env` من `.env.example`.
4. ارفع فيديوهاتك على Drive واجعلها Anyone with the link / Viewer.
5. أضف Playlists وVideos من Supabase Table Editor.
6. `npm install`.
7. `npm run build`.
8. ارفع المشروع GitHub.
9. Deploy على Cloudflare Pages بإعداد `dist` ومفاتيح Supabase.
