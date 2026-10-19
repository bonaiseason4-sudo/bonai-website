export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  username: string
  // Arabic display name; null for accounts created before names were added.
  name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}
