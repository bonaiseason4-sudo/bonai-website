import { useCallback, useEffect, useState } from 'react'
import { getBadges } from '../services/badgeService'
import type { BadgesResponse } from '../types/badges'
import { useAuth } from './useAuth'

// The student's badge album. Loaded again when the tab comes back, since badges may have been earned elsewhere.
export function useBadges() {
  const { user, available } = useAuth()
  const userId = available ? user?.id ?? null : null
  // Tagged with its owner, so another account never sees this one's album.
  const [stored, setStored] = useState<{ userId: string; data: BadgesResponse | null; failed: boolean } | null>(null)
  const [version, setVersion] = useState(0)
  const current = userId && stored?.userId === userId ? stored : null

  useEffect(() => {
    if (!userId) return
    let active = true
    getBadges()
      .then((data) => { if (active) setStored({ userId, data, failed: false }) })
      // An album already shown stays; only an empty page shows the error.
      .catch(() => { if (active) setStored((state) => ({ userId, data: state?.userId === userId ? state.data : null, failed: true })) })
    return () => { active = false }
  }, [userId, version])

  const reload = useCallback(() => {
    // Back to loading after an error, instead of keeping the error up while trying again.
    setStored((state) => (state && !state.data ? { ...state, failed: false } : state))
    setVersion((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!userId) return
    const onVisible = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId, reload])

  return { data: current?.data ?? null, failed: current?.failed ?? false, reload }
}
