import type { User } from '../types/auth'

// Same rules as the API (worker/src/lib/validate.ts), checked here first for instant Arabic messages.
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/
const ARABIC_NAME_PATTERN = /^[\p{Script_Extensions=Arabic}\s]+$/u
const ARABIC_DIGITS_AND_PUNCTUATION = /[٠-٩۰-۹،؛؟٪-٭۔]/

// ⁦…⁩ keeps the English example left-to-right inside the Arabic sentence.
export const usernameHint = 'بالإنجليزية فقط: حروف وأرقام و _ بدون مسافات، مثل ⁦ahmad_10⁩. تستخدمه لتسجيل الدخول.'
export const nameHint = 'بالعربية فقط، مثل: أحمد محمد. هذا هو الاسم الذي يظهر في الموقع.'

export function usernameError(username: string): string | null {
  return USERNAME_PATTERN.test(username.trim()) ? null : 'اسم المستخدم يجب أن يكون بالإنجليزية فقط (حروف وأرقام و _ بدون مسافات).'
}

export function nameError(name: string): string | null {
  const text = name.trim()
  if (!text) return 'اكتب اسمك بالعربية.'
  if (text.length > 50 || !ARABIC_NAME_PATTERN.test(text) || ARABIC_DIGITS_AND_PUNCTUATION.test(text)) return 'الاسم يجب أن يكون بالحروف العربية فقط.'
  return null
}

// The Arabic name when the user has one; older accounts fall back to the username.
export function displayName(user: User): string {
  return user.name || user.username
}
