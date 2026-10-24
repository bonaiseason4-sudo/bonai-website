// Bunay API: Express (MVC) running on Cloudflare Workers, backed by D1.
//
// GET /api/playlists                   Active playlists with lesson counts
// GET /api/playlists/:id               One active playlist
// GET /api/playlists/:id/videos        Active videos of an active playlist
// GET /api/videos/:id/attachments      Active attachments of an active video
//
// POST  /api/auth/register  {username, name, password, phone?} -> {user, token}
//       username: English letters, numbers, _ (unique); name: Arabic letters (not unique)
// POST  /api/auth/login     {username, password}         -> {user, token}
// GET   /api/auth/me        (Bearer token)               -> {user}
// POST  /api/auth/logout    (Bearer token)
// GET   /api/profile        (Bearer token)               -> {profile}
// PATCH /api/profile        (Bearer token) {name?, phone?} -> {profile}, only the given fields change
// PUT   /api/profile/password (Bearer token) {password}  -> 204, logs out other devices
//
// Attendance and streak (Bearer token, never cached). Rules and the Progress shape are in lib/progress.ts:
// POST   /api/attendance  {video_id, kind: 'LIVE'|'RECORDED'} -> {attendance, progress, events, points_gained}
//        marking again switches the kind; errors: 404 NOT_FOUND (missing, hidden or quiz lesson), 400 INVALID_KIND,
//        400 NOT_STARTED (before attend_from), 400 LIVE_CLOSED (LIVE after attend_until),
//        409 LOCKED (an on-time mark whose window has ended can't be changed)
//        events end with {type: 'BADGE_EARNED', badge} for each badge this mark earned
// DELETE /api/attendance/:videoId                 -> {progress}; 404 NOT_FOUND when there is no mark, 409 LOCKED
// GET    /api/progress                            -> {progress, unseen_badges}  streak, multiplier, shields, points,
//        per-playlist counts; unseen_badges: earned badges not celebrated yet (including ones awarded by this request)
// GET    /api/playlists/:id/my-attendance         -> {attendances}  the user's marks on that playlist's lessons
//
// Badges (Bearer token, never cached). Rules are in lib/badges.ts, the badges themselves are rows in the badges table.
// A badge is awarded on POST /api/attendance, GET /api/progress and GET /api/badges, and is never taken back:
// GET  /api/badges       -> {badges, summary: {earned, total}}  sorted by sort_order, then id; a secret badge
//      not earned yet shows as "وسام سري" without progress; badges of hidden or deleted playlists only once earned
// POST /api/badges/seen  {badge_ids: string[]} -> 204  marks those earned badges as celebrated (unknown IDs are ignored);
//      400 INVALID_BODY unless badge_ids is a list of at most 50 strings
// Badge JSON: {id, title, description, icon, color, tier, is_secret, earned_at, seen, progress: {current, target} | null}
//
// Admin only (Bearer token of a user with role 'admin'); reads include hidden lessons/attachments, not hidden playlists:
// GET  /api/admin/playlists | /api/admin/playlists/:id | /api/admin/playlists/:id/videos | /api/admin/videos/:id/attachments
// POST /api/admin/{playlists|videos|attachments}         create (the body carries the ID)
// PUT  /api/admin/{playlists|videos|attachments}/:id     replace; may change the ID
// DELETE /api/admin/{playlists|videos|attachments}/:id   delete, including children
// Videos carry attend_from and attend_until (ISO dates, both or neither; '' or null = outside the streak), 400 INVALID_WINDOW

import { httpServerHandler } from 'cloudflare:node'
import { app } from './app'

const PORT = 3000

app.listen(PORT)

export default httpServerHandler({ port: PORT })
