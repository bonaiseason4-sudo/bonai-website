import { env } from 'cloudflare:workers'

// D1 binding declared in wrangler.jsonc (binding: "DB").
export const db: D1Database = env.DB
