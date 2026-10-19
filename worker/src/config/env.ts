import { env } from 'cloudflare:workers'

// Comma-separated frontend origins allowed to call the API; "*" allows any.
export const allowedOrigins: string[] = String(env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
