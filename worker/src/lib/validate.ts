// Input validators for API requests. Each throws ValidationError, which the error handler turns into a 400.

export class ValidationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
  }
}

// IDs appear in page URLs, so keep them to URL-safe characters.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

export function requiredId(value: unknown, field: string): string {
  const id = typeof value === 'string' ? value.trim() : ''
  if (!ID_PATTERN.test(id)) throw new ValidationError(`${field} must be 1-100 characters: English letters, numbers, _ or -`)
  return id
}

export function requiredText(value: unknown, field: string, max: number): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new ValidationError(`${field} is required`)
  if (text.length > max) throw new ValidationError(`${field} must be at most ${max} characters`)
  return text
}

export function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function sortOrder(value: unknown): number {
  const number = value === undefined || value === null || value === '' ? 0 : Number(value)
  if (!Number.isInteger(number) || number < 0) throw new ValidationError('sort_order must be a whole number, 0 or more')
  return number
}

export function flag(value: unknown, fallback: boolean): number {
  if (value === undefined || value === null) return fallback ? 1 : 0
  return value === true || value === 1 ? 1 : 0
}

export function oneOf<T extends string>(value: unknown, options: readonly T[], field: string, fallback: T | null): T | null {
  if (value === undefined || value === null || value === '') return fallback
  if (!options.includes(value as T)) throw new ValidationError(`${field} must be one of: ${options.join(', ')}`)
  return value as T
}

// Usernames are for logging in: English letters, numbers and _ only.
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/
// Display names: Arabic letters and spaces only. Script_Extensions (not Script) so diacritics like ُ count as Arabic.
const ARABIC_NAME_PATTERN = /^[\p{Script_Extensions=Arabic}\s]+$/u
const ARABIC_DIGITS_AND_PUNCTUATION = /[٠-٩۰-۹،؛؟٪-٭۔]/

export function username(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!USERNAME_PATTERN.test(text)) throw new ValidationError('Username must be 1-50 English letters, numbers or _', 'INVALID_USERNAME')
  return text
}

export function arabicName(value: unknown): string {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!text || text.length > 50 || !ARABIC_NAME_PATTERN.test(text) || ARABIC_DIGITS_AND_PUNCTUATION.test(text)) {
    throw new ValidationError('Name must be 1-50 Arabic letters', 'INVALID_NAME')
  }
  return text
}

export function phone(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length > 30) throw new ValidationError('Phone must be at most 30 characters', 'INVALID_PHONE')
  return text || null
}
