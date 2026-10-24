import { createContext } from 'react'
import type { Progress } from '../types/progress'

export interface ProgressContextValue {
  // null for guests, in demo mode, and while the first load is in flight.
  progress: Progress | null
  refresh: () => Promise<void>
  // Shows progress returned by an attendance request without asking the API again.
  applyProgress: (progress: Progress) => void
  // Goes up each time the run grows, so the nav flame can replay its pulse.
  pulseKey: number
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
