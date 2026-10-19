import { db } from '../config/db'

export type UserRole = 'user' | 'admin'

export interface UserRow {
  id: string
  username: string
  name: string | null
  phone: string | null
  password_hash: string
  role: UserRole
  created_at: string
}

export class UsernameTakenError extends Error {}

export const UserModel = {
  async findByUsername(username: string): Promise<UserRow | null> {
    return db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRow>()
  },

  async create(data: { username: string; name: string; phone: string | null; passwordHash: string }): Promise<UserRow> {
    const id = crypto.randomUUID()
    try {
      const user = await db
        .prepare('INSERT INTO users (id, username, name, phone, password_hash) VALUES (?, ?, ?, ?, ?) RETURNING *')
        .bind(id, data.username, data.name, data.phone, data.passwordHash)
        .first<UserRow>()
      return user!
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed: users.username')) throw new UsernameTakenError()
      throw error
    }
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, id).run()
  },

  async updateProfile(id: string, data: { name: string; phone: string | null }): Promise<UserRow> {
    const user = await db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ? RETURNING *').bind(data.name, data.phone, id).first<UserRow>()
    return user!
  },
}
