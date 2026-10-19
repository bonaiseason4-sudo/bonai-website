// Bindings from wrangler.jsonc, exposed through `import { env } from 'cloudflare:workers'`.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    ALLOWED_ORIGINS: string
  }
}
