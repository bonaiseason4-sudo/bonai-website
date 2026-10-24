import type { BadgeView } from './badges'

export type AttendanceKind = 'LIVE' | 'RECORDED'

export interface Attendance {
  video_id: string
  kind: AttendanceKind
  marked_at: string
  // Marked before the window ended (or the lesson has no window).
  on_time: boolean
}

export interface PlaylistProgress {
  marked: number
  total: number
  // Lessons attended live and on time (a live mark on a lesson with no window counts).
  live_on_time: number
}

// Computed by the API from scratch on every request; the frontend only displays it.
export interface Progress {
  run: number
  best_run: number
  multiplier: number
  freezes: number
  points: number
  // null when the student already holds the most shields.
  lives_to_next_freeze: number | null
  lives_to_max_multiplier: number
  total_live_on_time: number
  playlist_progress: Record<string, PlaylistProgress>
}

export type ProgressEvent =
  | { type: 'FIRST_LIVE' }
  | { type: 'RUN_UP'; from: number; to: number }
  | { type: 'MAX_MULTIPLIER' }
  | { type: 'FREEZE_EARNED'; freezes: number }
  | { type: 'RECORDED_SAVED' }
  | { type: 'LATE_CATCH_UP' }
  | { type: 'BADGE_EARNED'; badge: BadgeView }

export interface ProgressResponse {
  progress: Progress
  // Earned but never celebrated, including any this request just awarded.
  unseen_badges: BadgeView[]
}

export interface MarkAttendanceResult {
  attendance: Attendance
  progress: Progress
  events: ProgressEvent[]
  points_gained: number
}
