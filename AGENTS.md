# Bunay (بنيّ) — handoff for coding agents

> ملخص كامل للمشروع وكل اللي اتعمل واتقرر في الشات مع Claude، عشان أي agent (Codex أو غيره) يكمل كأنه كان في نفس السيشن، من غير ما يقرا كل الملفات.
> Read this first. It is the source of truth for decisions; open individual files only when you need to change them.

## 1. What the project is

An Arabic (RTL) website for kids: short Islamic educational video series ("playlists" of lessons), run with جمعية الترتيل. Visitors browse freely; registered students mark attendance, build a streak, earn points and badges. Admins manage content from inside the site.

- Live site: https://bonai-website.pages.dev (Cloudflare Pages, auto-builds on every push to `main`)
- Live API: https://bunay-api.bonai-season-4.workers.dev (Cloudflare Worker `bunay-api`)
- Repo: https://github.com/bonaiseason4-sudo/bonai-website (owner pushes as GitHub user `ashrafehaab`, added as collaborator)
- Cloudflare account: bonai.season.4@gmail.com. D1 database `bunay` (id in `worker/wrangler.jsonc`).
- Live admin account: username `ashrafehaab` (role admin). Admins are made only by SQL (see §6).
- Audience is children → encouraging copy, nothing that punishes or shames.

## 2. Stack and layout

- Frontend: React 19 + Vite + TypeScript, react-router 7, plain CSS (`src/styles/global.css`, Cairo font). No UI library.
- Backend: Express 5 on Cloudflare Workers (`httpServerHandler` from `cloudflare:node`, `nodejs_compat`), MVC folders, D1 (SQLite).
- Frontend talks to the Worker via `VITE_API_URL` (`.env`, local `http://localhost:8787`; Pages env var holds the live URL). If `VITE_API_URL` is empty the site runs in demo mode (`src/services/demoData.ts`).
- History: started on Supabase; moved to Workers + D1 (data imported from Supabase CSVs, `worker/seed/`). Playlist images are still hosted in Supabase Storage URLs. `supabase/` folder is old reference only.

```text
src/
  App.tsx                 routes + providers (Auth → Progress → Celebration → Toast)
  pages/                  HomePage, PlaylistPage, AuthPage (login/register), ProfilePage, AchievementsPage, NotFoundPage
  components/             Header (nav flame + logout confirm), VideoList (lesson rows), AttachmentList, PlaylistCard, VideoPlayer, Toast, CelebrationHost
  components/admin/       AdminMenu (⋮ edit/delete, portal), AddTile (dotted +), AdminEditor (config-driven forms + red delete confirm), Modal (portal), entityForms.ts (field configs)
  components/attendance/  AttendanceButtons, CelebrationModal (streak), icons.tsx (inline SVG)
  components/badges/      BadgeIcon, BadgeCelebration
  context/ + hooks/       auth, progress (streak state shared by nav/profile/cards), celebration queue, toast
  services/               api wrappers: contentService, authService, adminService, progressService, badgeService
  lib/                    api.ts (apiRequest, ApiError{status,code}, token in localStorage 'bunay.token'), dates.ts (ar-EG, device timezone), userFields.ts (username/name rules + hints), videoSource.ts
worker/
  wrangler.jsonc, migrations/0001..0005, scripts/*.test.mjs (node --test), seed/
  src/index.ts            entry + header comment listing ALL endpoints
  src/app.ts              CORS (GET POST PATCH PUT DELETE), json body, routes, error handler
  src/routes/index.ts     mounts; public /playlists & /videos are cacheFor(60); personal routes noStore
  src/lib/progress.ts     RULES + pure computeProgress/diffEvents (no imports → unit-testable in Node)
  src/lib/badges.ts       pure badge rule registry (no imports)
  src/lib/validate.ts     validators (ValidationError{code} → 400), crypto.ts (PBKDF2, tokens)
  src/models, views, controllers, services, middleware (auth.ts: requireAuth, requireRole)
```

## 3. Data model (D1)

- `playlists` (id TEXT PK typed by admin, title, description, image_url, sort_order, is_active, created_at)
- `videos` (id, playlist_id FK cascade, title, description, drive_file_id, video_url, video_source GOOGLE_DRIVE|DIRECT|null, sort_order, is_active, is_quiz, attend_from, attend_until, created_at). `is_quiz` rows are quizzes (attachments only, not counted as lessons).
- `attachments` (id, video_id FK cascade, title, description, url, file_type PDF|POWERPOINT|WORD|SPREADSHEET|GOOGLE_FORM|GEMINI_QUIZ|LINK|OTHER, sort_order, is_active)
- `users` (id uuid, username UNIQUE COLLATE NOCASE, name Arabic nullable for old accounts, phone, password_hash `pbkdf2-sha256$100000$salt$hash`, role user|admin, created_at)
- `sessions` (token_hash SHA-256 PK, user_id, created_at, expires_at +90 days) — kept on purpose (user chose DB sessions over JWT: logout/revocation work; cost is ~2 row reads).
- `attendances` (user_id, video_id, kind LIVE|RECORDED, marked_at; PK user+video)
- `badges` (id, title, description, icon key, color key, tier BRONZE|SILVER|GOLD|null, rule_type, rule_params JSON, is_secret, is_active, sort_order) + `user_badges` (user_id, badge_id, awarded_at, seen_at)
- All FKs cascade on delete; ids cascade on update (renaming an id moves its children).

## 4. API (see header of `worker/src/index.ts` for the full list)

Public (cached 60s): `GET /api/playlists`, `/api/playlists/:id`, `/api/playlists/:id/videos`, `/api/videos/:id/attachments`.
Auth: `POST /api/auth/register {username,name,password,phone?}`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` → bearer token.
Profile: `GET /api/profile`, `PATCH /api/profile {name?, phone?}` (only sent fields change), `PUT /api/profile/password {password}` (no old password needed; logs out other devices).
Admin (role admin): `GET/POST/PUT/DELETE /api/admin/{playlists|videos|attachments}`; admin reads include hidden lessons/attachments but NOT hidden playlists.
Attendance/progress: `POST /api/attendance {video_id, kind}` → `{attendance, progress, events, points_gained}`; `DELETE /api/attendance/:videoId`; `GET /api/progress` → `{progress, unseen_badges}`; `GET /api/playlists/:id/my-attendance` (registered before the cached /playlists mount).
Badges: `GET /api/badges` → `{badges, summary}`; `POST /api/badges/seen {badge_ids}`.
Error bodies: `{error, code}`; codes used by the UI for Arabic messages (USERNAME_TAKEN, INVALID_USERNAME, INVALID_NAME, DUPLICATE_ID, MISSING_PARENT, INVALID_WINDOW, NOT_FOUND, NOT_STARTED, LIVE_CLOSED, LOCKED, INVALID_KIND, INVALID_BODY).

## 5. Business rules and decisions (do not change without asking the owner)

Accounts
- Username: English letters/digits/_ only, unique (case-insensitive), used to log in. Name: Arabic letters only (diacritics OK), not unique, shown everywhere instead of the username. Phone optional, not unique, not verified. No password strength rules (weak passwords allowed on purpose).
- After login/register go to home (`/`), unless redirected from a protected page (then back there).
- Profile page = header card + separate rows with icons (الاسم / رقم الهاتف / تغيير كلمة المرور), tap a row to expand its form. Nav has a logout icon with a yes/no confirm.

Admin tools (in-site)
- ⋮ menu on each playlist/lesson/attachment → تعديل / حذف (red, with confirmation; deleting cascades). Dotted rounded square with + to add. Admin types IDs by hand (English, digits, _ -).
- Hidden playlists (`is_active=0`) are NOT shown to admins and can only be shown/hidden/edited in the database. Hidden lessons/attachments show to admins with a "مخفي" badge.
- Badges for a new playlist are NOT auto-created; add 3 rows by SQL (template in a comment in `worker/migrations/0005_badges.sql`).

Attendance, streak, points (numbers in `RULES`, `worker/src/lib/progress.ts`)
- Each lesson may have an attendance window (`attend_from`/`attend_until`), set by the admin in the lesson form (default for new lessons: now → +7 days). No window = outside the streak but still gives points. NOTE: existing live lessons had no windows at go-live; the admin must set them for the streak to move.
- Two buttons per lesson: "حضور مباشر" and "مسجّل" (one choice; tap again to remove; tap the other to switch). Before start: both disabled. After end: LIVE disabled, RECORDED = late catch-up. An on-time mark is LOCKED after the window ends. Trust-based: no verification (lectures are live on Zoom).
- Algorithm (recomputed from all marks every request, windowed lessons ordered by attend_until then id, site-wide): on-time LIVE → round(10 × (1 + 0.1 × min(run,5))) points, run+1; on-time RECORDED → 10 points, run unchanged; window passed with no on-time mark → consume a shield if any, else run=0; late mark → 5 points (miss still counts); no-window lesson → 10 points. Shield: every 4 consecutive lives, max 2. Earned points are never subtracted. No miss for lessons that ended before the account was created.
- UI: celebration modal right after a LIVE mark (flame grows, count up, +points, 5-cell bar, hint); RECORDED/late → small toast; nav flame 🔥 run (+🛡️ shields) pulses on increase and links to `/achievements`; profile stats card; "x من y" on home playlist cards.

Badges
- Data-driven: rule_type + rule_params JSON. Types: first_live, live_count{n}, streak_reached{n} (uses best_run), points_reached{n}, complete_playlist{playlist_id|null, tier} (BRONZE all marked; SILVER all marked and >half on-time live; GOLD all on-time live). New badge of an existing type = DB row only; new type (planned: Quran memorization, daily wird/أوراد) = one registry function.
- NO negative badges (nothing for absence, using a shield, or being late — owner was explicit). Badges are never revoked. Secret badge shows "وسام سري" until earned.
- `/achievements` album: earned in color with date, locked grey with progress "x من y". Badge celebration shows once (seen_at), also for badges earned while away; queued after the streak celebration.
- No leaderboard for now (owner agreed: kids compete with themselves).

## 6. How to run, test, deploy

```bash
npm install && (cd worker && npm install)
cd worker && npm run db:migrate:local && npx wrangler dev --port 8787   # API
npm run dev                                                             # site on 5173 (VITE_API_URL=http://localhost:8787)
cd worker && npx tsc --noEmit && npm test                               # unit tests (progress + badges)
npm run build && npx eslint src worker/src                              # must pass before committing
```

Go-live order (always): `cd worker && npm run db:migrate:remote` (if new migrations) → `npx wrangler deploy` → `git push origin main` (Pages rebuilds in ~1–3 min).
Make an admin: `npx wrangler d1 execute bunay --remote --command "UPDATE users SET role='admin' WHERE username='NAME'"`.

## 7. Working agreements with the owner (important)

- The owner (Ashraf) chats in Egyptian Arabic; reply in Arabic, keep explanations short and concrete.
- Never commit, deploy, or push unless asked in that message ("push" / "اعمل push" counts). Never touch `push.bat` (owner's untracked helper).
- Diagnose first; change code only when asked. Prefer simple solutions; numbers are tunable.
- Never edit old migrations; add a new numbered one. Don't edit live data without asking.
- Verify UI on desktop, 375px and 320px (no horizontal overflow; header must fit with flame + avatar + logout).
- Windows quirks: path contains Arabic (quote it); send Arabic test data from Node `fetch`, not curl args; local D1 state is keyed by database_id; stop dev servers you start.
- Modals/menus render through portals on `<body>` (the header's backdrop-filter traps fixed elements).
- UI copy is warm and kid-friendly; e.g. "قريبًا في ملفك إن شاء الله ✨".

## 8. Chat history (what was done, in order)

1. Moved backend Supabase → Cloudflare Worker + D1; imported all data (incl. inactive rows) from Supabase CSV export.
2. Refactored the Worker to Express MVC (owner's request).
3. Accounts: username/password (PBKDF2), phone optional, roles, profile; later change password; Arabic display name + English usernames with helper hints.
4. In-site admin tools (⋮ menu, dotted add tile, red delete confirm, typed IDs); later hid hidden playlists from admins.
5. Small UX: themed scrollbar, profile rows with icons, nav logout icon + confirm, redirect home after login.
6. Designed (in chat) and built attendance + streak + points (Phase 1) and badges + achievements (Phase 2), with multi-agent build/review/test; all tests passed; shipped in commit 28a9ecf (migrations 0004/0005 applied live).

## 9. Open items / ideas

- Set attendance windows on existing lessons (admin form) so streaks start.
- Add badge rows for any playlist created after migration 0005.
- Discussed, not built: "أسبوع كامل" badge, daily questions (profile "coming soon"), Quran memorization and awrad tracking (badge registry is ready for new rule types), moving playlist images off Supabase Storage (e.g. R2).
- Old backup in `git stash` ("WIP phase 1 attendance/streak") is obsolete and can be dropped.
