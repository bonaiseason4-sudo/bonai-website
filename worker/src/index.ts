// Bunay public read API backed by Cloudflare D1.
//
// GET /api/playlists                   Active playlists with lesson counts
// GET /api/playlists/:id               One active playlist
// GET /api/playlists/:id/videos        Active videos of an active playlist
// GET /api/videos/:id/attachments      Active attachments of an active video

export interface Env {
  DB: D1Database
  ALLOWED_ORIGINS: string
}

type Row = Record<string, unknown>

const CACHE_SECONDS = 60

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, cors)

    const path = new URL(request.url).pathname.replace(/\/+$/, '')
    const segments = path.split('/').filter(Boolean).map(decodeURIComponent)

    try {
      if (segments[0] !== 'api') return json({ error: 'Not found' }, 404, cors)
      const [, resource, id, sub] = segments

      if (resource === 'playlists' && !id) return json(await listPlaylists(env.DB), 200, cors, true)
      if (resource === 'playlists' && id && !sub) {
        const playlist = await getPlaylist(env.DB, id)
        return playlist ? json(playlist, 200, cors, true) : json({ error: 'Playlist not found' }, 404, cors)
      }
      if (resource === 'playlists' && id && sub === 'videos' && segments.length === 4) return json(await listVideos(env.DB, id), 200, cors, true)
      if (resource === 'videos' && id && sub === 'attachments' && segments.length === 4) return json(await listAttachments(env.DB, id), 200, cors, true)

      return json({ error: 'Not found' }, 404, cors)
    } catch (error) {
      console.error(error)
      return json({ error: 'Internal server error' }, 500, cors)
    }
  },
} satisfies ExportedHandler<Env>

async function listPlaylists(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT p.*, (
         SELECT COUNT(*) FROM videos v WHERE v.playlist_id = p.id AND v.is_active = 1 AND v.is_quiz = 0
       ) AS video_count
       FROM playlists p
       WHERE p.is_active = 1
       ORDER BY p.sort_order, p.created_at`,
    )
    .all<Row>()
  return results.map(toPlaylist)
}

async function getPlaylist(db: D1Database, id: string) {
  const row = await db.prepare('SELECT * FROM playlists WHERE id = ? AND is_active = 1').bind(id).first<Row>()
  return row ? toPlaylist(row) : null
}

async function listVideos(db: D1Database, playlistId: string) {
  const { results } = await db
    .prepare(
      `SELECT v.* FROM videos v
       JOIN playlists p ON p.id = v.playlist_id
       WHERE v.playlist_id = ? AND v.is_active = 1 AND p.is_active = 1
       ORDER BY v.sort_order, v.created_at`,
    )
    .bind(playlistId)
    .all<Row>()
  return results.map(toVideo)
}

async function listAttachments(db: D1Database, videoId: string) {
  const { results } = await db
    .prepare(
      `SELECT a.* FROM attachments a
       JOIN videos v ON v.id = a.video_id
       JOIN playlists p ON p.id = v.playlist_id
       WHERE a.video_id = ? AND a.is_active = 1 AND v.is_active = 1 AND p.is_active = 1
       ORDER BY a.sort_order, a.created_at`,
    )
    .bind(videoId)
    .all<Row>()
  return results.map((row) => ({ ...row, is_active: row.is_active === 1 }))
}

function toPlaylist(row: Row) {
  return { ...row, is_active: row.is_active === 1 }
}

// The frontend expects `isQuiz`, matching the original Supabase column name.
function toVideo({ is_quiz, ...row }: Row) {
  return { ...row, is_active: row.is_active === 1, isQuiz: is_quiz === 1 }
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (allowed.includes('*')) headers['Access-Control-Allow-Origin'] = '*'
  else if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function json(body: unknown, status: number, headers: Record<string, string>, cacheable = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheable ? `public, max-age=${CACHE_SECONDS}` : 'no-store',
    },
  })
}
