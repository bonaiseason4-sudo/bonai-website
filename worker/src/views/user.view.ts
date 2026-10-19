import type { UserRow } from '../models/user.model'

// Never send password_hash to the client.
export function userView({ id, username, phone, role, created_at }: UserRow) {
  return { id, username, phone, role, created_at }
}

// The user's own profile page. Attendance, streaks and daily questions will be added here later.
export function profileView(user: UserRow) {
  return userView(user)
}
