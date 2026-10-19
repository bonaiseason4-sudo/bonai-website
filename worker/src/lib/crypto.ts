// Password hashing and session tokens using the Web Crypto API built into Workers.

const ALGORITHM = 'pbkdf2-sha256'
// Highest PBKDF2 iteration count Cloudflare Workers allows.
const ITERATIONS = 100_000
const encoder = new TextEncoder()

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
}

// Returns "pbkdf2-sha256$<iterations>$<salt>$<hash>", a random salt per password.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, ITERATIONS)
  return [ALGORITHM, ITERATIONS, toBase64(salt), toBase64(hash)].join('$')
}

// Re-hashes the input with the stored salt and compares in constant time.
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterations, salt, hash] = stored.split('$')
  if (algorithm !== ALGORITHM || !iterations || !salt || !hash) return false

  const expected = fromBase64(hash)
  const actual = new Uint8Array(await pbkdf2(password, fromBase64(salt), Number(iterations)))
  return expected.byteLength === actual.byteLength && crypto.subtle.timingSafeEqual(expected, actual)
}

export function generateToken(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sha256(value: string): Promise<string> {
  return toBase64(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}
