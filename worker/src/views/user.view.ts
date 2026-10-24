import type { UserRow } from '../models/user.model'

// Never send password_hash to the client.
export function userView({ id, username, name, phone, role, created_at }: UserRow) {
  return { id, username, name, phone, role, created_at }
}

// The user's own profile page. Streak and points come from GET /api/progress; daily questions will be added later.
export function profileView(user: UserRow) {
  return userView(user)
}
