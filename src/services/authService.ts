import { ApiError, apiRequest, setToken } from '../lib/api'
import type { User } from '../types/auth'

interface SessionResponse {
  user: User
  token: string
}

export async function register(data: { username: string; password: string; phone: string }): Promise<User> {
  const { user, token } = await apiRequest<SessionResponse>('/api/auth/register', { method: 'POST', body: data })
  setToken(token)
  return user
}

export async function login(data: { username: string; password: string }): Promise<User> {
  const { user, token } = await apiRequest<SessionResponse>('/api/auth/login', { method: 'POST', body: data })
  setToken(token)
  return user
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

// Returns the logged-in user, or null when the stored session is missing or expired.
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await apiRequest<{ user: User }>('/api/auth/me')
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setToken(null)
      return null
    }
    throw error
  }
}

export async function updateProfile(data: { phone: string }): Promise<User> {
  const { profile } = await apiRequest<{ profile: User }>('/api/profile', { method: 'PATCH', body: data })
  return profile
}

export async function changePassword(password: string): Promise<void> {
  await apiRequest('/api/profile/password', { method: 'PUT', body: { password } })
}

// Arabic message for an error returned by the API.
export function authErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.'
  if (error.status === 409) return 'اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر.'
  if (error.status === 401) return 'اسم المستخدم أو كلمة المرور غير صحيحة.'
  if (error.status === 400) return 'تأكد من إدخال اسم المستخدم وكلمة المرور.'
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
}
