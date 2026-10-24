import { createContext } from 'react'
import type { BadgeView } from '../types/badges'
import type { MarkAttendanceResult } from '../types/progress'

export type Celebration =
  | { kind: 'streak'; key: string; result: MarkAttendanceResult }
  | { kind: 'badge'; key: string; badge: BadgeView }

export interface CelebrationContextValue {
  // The celebration on screen, or null. One at a time: a streak first, then each new badge in turn.
  current: Celebration | null
  // How many more wait after the current one.
  waiting: number
  // After a live attendance that grew the run.
  celebrateStreak: (result: MarkAttendanceResult) => void
  // Badges already queued or shown in this tab are skipped, so each one celebrates once.
  celebrateBadges: (badges: BadgeView[]) => void
  dismiss: (key: string) => void
}

export const CelebrationContext = createContext<CelebrationContextValue | null>(null)
