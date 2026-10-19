import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getToken } from '../lib/api'
import * as authService from '../services/authService'
import { usingDemoData } from '../services/contentService'
import type { User } from '../types/auth'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const available = !usingDemoData
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(available && Boolean(getToken()))

  useEffect(() => {
    if (!available || !getToken()) return
    authService.getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [available])

  const login = useCallback(async (username: string, password: string) => {
    setUser(await authService.login({ username, password }))
  }, [])

  const register = useCallback(async (username: string, password: string, phone: string) => {
    setUser(await authService.register({ username, password, phone }))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, available, login, register, logout, setUser }), [user, loading, available, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
