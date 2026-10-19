// Bunay API: Express (MVC) running on Cloudflare Workers, backed by D1.
//
// GET /api/playlists                   Active playlists with lesson counts
// GET /api/playlists/:id               One active playlist
// GET /api/playlists/:id/videos        Active videos of an active playlist
// GET /api/videos/:id/attachments      Active attachments of an active video
//
// POST  /api/auth/register  {username, password, phone?} -> {user, token}
// POST  /api/auth/login     {username, password}         -> {user, token}
// GET   /api/auth/me        (Bearer token)               -> {user}
// POST  /api/auth/logout    (Bearer token)
// GET   /api/profile        (Bearer token)               -> {profile}
// PATCH /api/profile        (Bearer token) {phone}       -> {profile}
// PUT   /api/profile/password (Bearer token) {password}  -> 204, logs out other devices

import { httpServerHandler } from 'cloudflare:node'
import { app } from './app'

const PORT = 3000

app.listen(PORT)

export default httpServerHandler({ port: PORT })
