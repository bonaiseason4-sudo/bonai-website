import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { markBadgesSeen } from '../services/badgeService'
import type { BadgeView } from '../types/badges'
import type { MarkAttendanceResult } from '../types/progress'
import { CelebrationContext, type Celebration } from './celebrationContext'

// Every streak celebration shares one key, so a newer run updates the one on screen instead of queueing another.
const STREAK_KEY = 'streak'

// One queue for every page, so a badge earned with a longer run waits until the streak celebration closes.
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { user, available } = useAuth()
  const userId = available ? user?.id ?? null : null
  // Tagged with its owner like the progress: logging out drops the queue at once, so guests never see it.
  const [stored, setStored] = useState<{ userId: string; queue: Celebration[] } | null>(null)
  const queue = useMemo(() => (userId && stored?.userId === userId ? stored.queue : []), [userId, stored])
  const owner = useRef(userId)
  useEffect(() => { owner.current = userId }, [userId])
  // "user:badge" pairs already queued (and so shown or about to be) in this tab. A badge comes from both the
  // attendance answer and the next progress load, and stays unseen there if marking it seen fails.
  const handled = useRef(new Set<string>())
  const seenSent = useRef(new Set<string>())

  const celebrateStreak = useCallback((result: MarkAttendanceResult) => {
    const id = owner.current
    if (!id) return
    setStored((state) => {
      const items = state?.userId === id ? state.queue : []
      const item: Celebration = { kind: 'streak', key: STREAK_KEY, result }
      const index = items.findIndex((entry) => entry.kind === 'streak')
      if (index !== -1) return { userId: id, queue: items.map((entry, at) => (at === index ? item : entry)) }
      // Right after whatever is on screen, ahead of badges still waiting.
      return { userId: id, queue: [...items.slice(0, 1), item, ...items.slice(1)] }
    })
  }, [])

  const celebrateBadges = useCallback((badges: BadgeView[]) => {
    const id = owner.current
    if (!id) return
    const fresh = badges.filter((badge) => {
      const key = `${id}:${badge.id}`
      if (handled.current.has(key)) return false
      handled.current.add(key)
      return true
    })
    if (!fresh.length) return
    setStored((state) => ({
      userId: id,
      queue: [...(state?.userId === id ? state.queue : []), ...fresh.map((badge): Celebration => ({ kind: 'badge', key: `badge:${badge.id}`, badge }))],
    }))
  }, [])

  const dismiss = useCallback((key: string) => {
    setStored((state) => state && { ...state, queue: state.queue.filter((item) => item.key !== key) })
  }, [])

  const current = queue[0] ?? null
  const shownBadge = current?.kind === 'badge' ? current.badge.id : null

  useEffect(() => {
    if (!userId || !shownBadge) return
    const key = `${userId}:${shownBadge}`
    // Guards against StrictMode's second effect run, too.
    if (seenSent.current.has(key)) return
    seenSent.current.add(key)
    // Fire and forget: if it fails, the badge stays unseen on the server and celebrates again on a later visit.
    markBadgesSeen([shownBadge]).catch(() => undefined)
  }, [userId, shownBadge])

  const value = useMemo(
    () => ({ current, waiting: Math.max(0, queue.length - 1), celebrateStreak, celebrateBadges, dismiss }),
    [current, queue.length, celebrateStreak, celebrateBadges, dismiss],
  )

  return <CelebrationContext.Provider value={value}>{children}</CelebrationContext.Provider>
}
