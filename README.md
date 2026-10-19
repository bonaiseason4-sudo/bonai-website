# بنيّ — Bunay

منصة عربية بسيطة للأطفال لعرض سلاسل فيديو تعليمية. الواجهة مبنية بـ React + Vite + TypeScript، والبيانات تأتي من Cloudflare Worker متصل بقاعدة Cloudflare D1، والفيديوهات تُعرض من Google Drive أو روابط MP4 مباشرة بدون رفعها على استضافة الموقع.

## Stack

- React + Vite + TypeScript
- React Router
- Express.js (MVC) على Cloudflare Workers + Cloudflare D1 (SQLite)
- Cloudflare Pages (الواجهة)
- Google Drive preview player / Direct MP4
- Plain CSS (بدون UI framework ثقيل)

## كيف تعمل المنظومة؟

```text
Visitor -> React website (Cloudflare Pages)
             -> Worker API (worker/)  -> D1 (playlists + videos + attachments)
             -> Google Drive / MP4    (actual video playback)
```

الموقع لا يخزن الفيديوهات. قاعدة البيانات لا يصل إليها المتصفح مباشرة؛ كل القراءة تمر عبر الـWorker، ولا يوجد أي Secret في الواجهة.

## API

```text
GET /api/playlists                  السلاسل النشطة مع عدد الدروس
GET /api/playlists/:id              سلسلة واحدة
GET /api/playlists/:id/videos       دروس السلسلة (تشمل الاختبارات isQuiz)
GET /api/videos/:id/attachments     مرفقات الدرس
```

المحتوى يُعرض للجميع بدون تسجيل دخول، ويظهر المحتوى النشط فقط (`is_active = 1`).

### الحسابات

```text
POST  /api/auth/register   {username, name, password, phone?}  إنشاء حساب
POST  /api/auth/login      {username, password}          تسجيل الدخول
GET   /api/auth/me                                       المستخدم الحالي
POST  /api/auth/logout                                   تسجيل الخروج
GET   /api/profile                                       الملف الشخصي
PATCH /api/profile         {name, phone}                 تعديل الاسم ورقم الهاتف
PUT   /api/profile/password {password}                  تغيير كلمة المرور (بدون القديمة، ويسجّل الخروج من الأجهزة الأخرى)
```

- اسم المستخدم بالإنجليزية فقط (حروف وأرقام و `_`)، وهو فريد (بدون تفرقة بين الحروف الكبيرة والصغيرة) ويُستخدم لتسجيل الدخول.
- الاسم بالعربية فقط وغير فريد، ويظهر في الموقع بدلًا من اسم المستخدم.
- لا توجد شروط على كلمة المرور، وتُحفظ مشفّرة (PBKDF2-SHA256 مع salt) ولا تُحفظ أبدًا كنص.
- رقم الهاتف اختياري، غير فريد، ولا يتم التحقق منه.
- بعد تسجيل الدخول يحصل المتصفح على token يُرسل في `Authorization: Bearer <token>`، وصلاحيته 90 يومًا.
- كل حساب جديد يكون `role = 'user'`. لجعل مستخدم مشرفًا:

```bash
cd worker
npx wrangler d1 execute bunay --remote --command "UPDATE users SET role = 'admin' WHERE username = 'USERNAME'"
```

في الكود، استخدم `requireAuth` ثم `requireRole('admin')` لحماية أي endpoint خاص بالمشرفين.

### لوحة المشرف داخل الموقع

عند تسجيل الدخول بحساب مشرف تظهر أدوات الإدارة مباشرة في صفحات الموقع:

- زر **⋮** بجانب كل سلسلة ودرس ومرفق ← **تعديل** أو **حذف** (الحذف باللون الأحمر ويطلب تأكيدًا).
- مربع منقّط بعلامة **+** لإضافة سلسلة (في الرئيسية) أو درس (في قائمة الدروس) أو مرفق (تحت الدرس).
- الـID يكتبه المشرف بنفسه (حروف إنجليزية وأرقام و `_` أو `-`). يمكن تغييره عند التعديل، والدروس والمرفقات التابعة تنتقل معه تلقائيًا.
- حذف سلسلة يحذف كل دروسها ومرفقاتها، وحذف درس يحذف مرفقاته.
- المحتوى المخفي (غير ظاهر للزوار) يظهر للمشرف فقط بشارة «مخفي».

```text
GET    /api/admin/playlists                  كل السلاسل (مع المخفية)
GET    /api/admin/playlists/:id              سلسلة
GET    /api/admin/playlists/:id/videos       دروس السلسلة (مع المخفية)
GET    /api/admin/videos/:id/attachments     مرفقات الدرس (مع المخفية)
POST   /api/admin/{playlists|videos|attachments}        إضافة
PUT    /api/admin/{playlists|videos|attachments}/:id    تعديل
DELETE /api/admin/{playlists|videos|attachments}/:id    حذف
```

---

## 1) إعداد الـWorker وD1

من مجلد `worker/`:

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create bunay
```

انسخ `database_id` الذي يظهر وضعه في `worker/wrangler.jsonc` مكان `REPLACE_WITH_D1_DATABASE_ID`.

ثم أنشئ الجداول وأضف المحتوى:

```bash
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

ستحصل على رابط مثل `https://bunay-api.<subdomain>.workers.dev`.

### ما الذي يوجد في worker/؟

- `migrations/0001_init.sql`: الجداول `playlists` و`videos` و`attachments` مع Foreign Keys وCascade وIndexes.
- `seed/csv/`: ملفات CSV المصدّرة من Supabase (كل المحتوى، النشط وغير النشط).
- `seed/data.sql`: المحتوى بصيغة D1، يُولَّد من ملفات CSV بالأمر `npm run seed:from-csv`.
- `scripts/csv-to-seed.mjs`: يحوّل ملفات CSV إلى `seed/data.sql`.
- `scripts/export-supabase.mjs`: تصدير مباشر من Supabase API (يحتاج service_role key لتصدير المحتوى غير النشط).
- `src/`: كود الـAPI بنمط MVC باستخدام Express:

```text
src/
├── index.ts         نقطة البداية: تشغيل Express على Workers
├── app.ts           إعداد Express (CORS، الـmiddleware، الـroutes)
├── config/          الاتصال بـD1 والإعدادات
├── models/          استعلامات قاعدة البيانات (Model)
├── views/           شكل الـJSON المرسل للواجهة (View)
├── controllers/     منطق كل endpoint (Controller)
├── routes/          ربط الروابط بالـcontrollers
└── middleware/      cache، 404، 405، معالجة الأخطاء
```

في `wrangler.jsonc` يمكن تحديد `ALLOWED_ORIGINS` (مثل `https://your-project.pages.dev`) بدل `*` لتقييد من يستطيع استدعاء الـAPI من المتصفح.

---

## 2) Environment variables (الواجهة)

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8787
VITE_USE_DEMO_DATA=false
```

إذا لم تضف `VITE_API_URL`، الموقع يدخل Demo mode تلقائيًا لتستطيع معاينة التصميم.

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

---

## 4) إضافة وتعديل المحتوى

أسهل طريقة: سجّل الدخول بحساب مشرف واستخدم أدوات الإدارة داخل الموقع (انظر «لوحة المشرف» أعلاه). أو يمكنك استخدام **Cloudflare Dashboard > Storage & Databases > D1 > bunay > Console**، أو من الطرفية:

```bash
cd worker
npx wrangler d1 execute bunay --remote --command "INSERT INTO playlists (id, title, sort_order) VALUES ('SEERAH', 'السيرة النبوية', 1)"
```

مثال درس:

```sql
INSERT INTO videos (id, playlist_id, title, drive_file_id, video_source, sort_order)
VALUES ('SEERAH_01', 'SEERAH', 'صلح الحديبية', 'GOOGLE_DRIVE_FILE_ID', 'GOOGLE_DRIVE', 1);
```

مثال اختبار (يظهر في قائمة الدروس كاختبار):

```sql
INSERT INTO videos (id, playlist_id, title, sort_order, is_quiz)
VALUES ('SEERAH_QUIZ', 'SEERAH', 'اختبار السيرة', 99, 1);
```

مثال مرفق:

```sql
INSERT INTO attachments (id, video_id, title, url, file_type)
VALUES ('SEERAH_01_PDF', 'SEERAH_01', 'ملخص الدرس', 'https://drive.google.com/file/d/.../view', 'PDF');
```

القيم المنطقية في D1 هي `1` و`0` (مثل `is_active`، `is_quiz`). التغييرات تظهر خلال دقيقة تقريبًا (الـAPI يضع cache لمدة 60 ثانية).

---

## 5) تشغيل المشروع محليًا

المتطلبات: Node.js حديث يدعم Vite 7.

في طرفية أولى (الـWorker مع D1 محلية):

```bash
cd worker
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

في طرفية ثانية (الواجهة):

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

---

## 6) Deploy الواجهة على Cloudflare Pages

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
VITE_API_URL=https://bunay-api.bonai-season-4.workers.dev
VITE_USE_DEMO_DATA=false
```

6. Deploy.

ملف `public/_redirects` موجود بالفعل حتى تعمل روابط React مثل `/playlist/:id` عند فتحها مباشرة أو عمل Refresh.

---

## 7) Security checklist

- ✅ المتصفح لا يتصل بقاعدة البيانات مباشرة.
- ✅ الـAPI للقراءة فقط (GET).
- ✅ المحتوى غير النشط لا يظهر.
- ✅ لا توجد Secrets في الواجهة.
- ✅ `.env` داخل `.gitignore`.

عند بناء `/admin` مستقبلًا: أضف endpoints للكتابة في الـWorker محمية بتسجيل دخول (مثل Cloudflare Access) قبل السماح بأي تعديل.

---

## 8) Project structure

```text
src/                React app
worker/
├── migrations/     D1 schema
├── seed/           D1 content
├── scripts/        Supabase export
└── src/            Express API (MVC)
supabase/           SQL القديم (مرجع فقط)
```

## 9) Routes

```text
/                 Home
/playlist/:id     Playlist + player
/login            تسجيل الدخول
/register         إنشاء حساب
/profile          الملف الشخصي (للمسجلين فقط)
*                 404
```

## 10) تعديل الشكل

الألوان الأساسية في `src/styles/global.css` داخل `:root`، واللوجو في:

```text
src/assets/bunay-logo.png
```
