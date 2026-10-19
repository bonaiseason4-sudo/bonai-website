import { createContext } from 'react'
import type { User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  // True while the stored session is being checked on page load.
  loading: boolean
  // False in demo mode, when there is no API to create accounts on.
  available: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, phone: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
