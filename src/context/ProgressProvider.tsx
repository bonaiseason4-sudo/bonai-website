import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCelebrations } from '../hooks/useCelebrations'
import { getProgress, progressOrder } from '../services/progressService'
import type { Progress } from '../types/progress'
import { ProgressContext } from './progressContext'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, available } = useAuth()
  const { celebrateBadges } = useCelebrations()
  // Demo mode has no accounts, so it never asks the API for progress.
  const userId = available ? user?.id ?? null : null
  // Tagged with its owner, so logging out (or in as someone else) hides the old numbers at once.
  const [stored, setStored] = useState<{ userId: string; progress: Progress } | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const progress = userId && stored?.userId === userId ? stored.progress : null
  const latest = useRef({ userId, progress })
  useEffect(() => { latest.current = { userId, progress } }, [userId, progress])
  const newestShown = useRef(0)

  const applyProgress = useCallback((next: Progress) => {
    // A late answer for an account that has since logged out.
    if (!userId || latest.current.userId !== userId) return
    // A late answer to a request sent before the one already shown (e.g. lessons marked quickly one after another).
    const order = progressOrder(next)
    if (order < newestShown.current) return
    newestShown.current = order
    const before = latest.current.progress
    if (before && next.run > before.run) setPulseKey((key) => key + 1)
    latest.current = { userId, progress: next }
    setStored({ userId, progress: next })
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const { progress: next, unseen_badges } = await getProgress()
      applyProgress(next)
      // Badges earned while away (or never celebrated) celebrate once now; the queue skips ones already shown.
      if (latest.current.userId === userId) celebrateBadges(unseen_badges)
    } catch {
      // Keep what is shown; the next attendance or visit tries again.
    }
  }, [userId, applyProgress, celebrateBadges])

  useEffect(() => { refresh() }, [refresh])

  // Windows close while the tab sits in the background, which can change the run; recount on return.
  useEffect(() => {
    if (!userId) return
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId, refresh])

  const value = useMemo(() => ({ progress, refresh, applyProgress, pulseKey }), [progress, refresh, applyProgress, pulseKey])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
