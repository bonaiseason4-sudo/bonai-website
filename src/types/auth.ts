export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  username: string
  phone: string | null
  role: UserRole
  created_at: string
}
