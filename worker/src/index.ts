// Bunay public read API: Express (MVC) running on Cloudflare Workers, backed by D1.
//
// GET /api/playlists                   Active playlists with lesson counts
// GET /api/playlists/:id               One active playlist
// GET /api/playlists/:id/videos        Active videos of an active playlist
// GET /api/videos/:id/attachments      Active attachments of an active video

import { httpServerHandler } from 'cloudflare:node'
import { app } from './app'

const PORT = 3000

app.listen(PORT)

export default httpServerHandler({ port: PORT })
