// Streak and points rules. Pure and import-free so scripts/progress.test.mjs can load this file
// straight into Node (which strips the types): keep it to erasable TypeScript, so no enums,
// namespaces or constructor parameter properties.

export const RULES = {
  BASE_POINTS: 10,
  MULTIPLIER_STEP: 0.1,
  // Live lessons in a row needed for the full multiplier (1 + 0.1 * 5 = ×1.5).
  MAX_LEVEL: 5,
  LIVES_PER_FREEZE: 4,
  MAX_FREEZES: 2,
  LATE_POINTS: 5,
  // Used by the admin form as the default window for a new lesson.
  DEFAULT_WINDOW_DAYS: 7,
} as const

export type AttendanceKind = 'LIVE' | 'RECORDED'

export interface ProgressLesson {
  id: string
  playlist_id: string
  attend_from: string | null
  attend_until: string | null
}

export interface ProgressMark {
  video_id: string
  kind: AttendanceKind
  marked_at: string
}

export interface ProgressInput {
  // Only active, non-quiz lessons of active playlists.
  lessons: ProgressLesson[]
  marks: ProgressMark[]
  userCreatedAt: string
  now: string
}

export interface PlaylistProgress {
  marked: number
  total: number
  // LIVE marks made in time, for the playlist badges. Unlike total_live_on_time, a LIVE mark on a lesson
  // without a window counts too: every lesson of the playlist can make it to gold.
  live_on_time: number
}

export interface Progress {
  run: number
  best_run: number
  multiplier: number
  freezes: number
  points: number
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

// Same instant, same text: lets ISO strings with other offsets or precision compare as plain strings.
function iso(value: string): string {
  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toISOString()
}

// A lesson without a window has no deadline, so any mark on it is on time.
export function isOnTime(markedAt: string, attendUntil: string | null): boolean {
  return attendUntil === null || iso(markedAt) <= iso(attendUntil)
}

function multiplierFor(run: number): number {
  return 1 + RULES.MULTIPLIER_STEP * Math.min(run, RULES.MAX_LEVEL)
}

export function computeProgress({ lessons, marks, userCreatedAt, now }: ProgressInput): Progress {
  const markByLesson = new Map(marks.map((mark) => [mark.video_id, mark]))
  const createdAt = iso(userCreatedAt)
  const current = iso(now)

  let points = 0
  let run = 0
  let bestRun = 0
  let freezes = 0
  let liveOnTime = 0
  const playlistProgress: Record<string, PlaylistProgress> = {}
  const windowed: { lesson: ProgressLesson; until: string; mark: ProgressMark | undefined }[] = []

  for (const lesson of lessons) {
    const mark = markByLesson.get(lesson.id)
    const counts = (playlistProgress[lesson.playlist_id] ??= { marked: 0, total: 0, live_on_time: 0 })
    counts.total += 1
    if (mark) counts.marked += 1
    if (mark?.kind === 'LIVE' && isOnTime(mark.marked_at, lesson.attend_until)) counts.live_on_time += 1

    // Outside the streak: a mark of either kind earns the base points and never touches the run.
    if (lesson.attend_until === null) {
      if (mark) points += RULES.BASE_POINTS
      continue
    }
    windowed.push({ lesson, until: iso(lesson.attend_until), mark })
  }

  // The streak follows the order the windows closed in; the id breaks ties so the result is stable.
  windowed.sort((a, b) => {
    if (a.until !== b.until) return a.until < b.until ? -1 : 1
    if (a.lesson.id !== b.lesson.id) return a.lesson.id < b.lesson.id ? -1 : 1
    return 0
  })

  for (const { until, mark } of windowed) {
    if (mark && isOnTime(mark.marked_at, until)) {
      if (mark.kind === 'LIVE') {
        points += Math.round(RULES.BASE_POINTS * multiplierFor(run))
        run += 1
        liveOnTime += 1
        bestRun = Math.max(bestRun, run)
        if (run % RULES.LIVES_PER_FREEZE === 0 && freezes < RULES.MAX_FREEZES) freezes += 1
      } else {
        // Listening to the recording in time keeps the run alive without growing it.
        points += RULES.BASE_POINTS
      }
      continue
    }

    // Window still open and not marked yet: nothing is decided.
    if (until > current) continue
    if (mark) points += RULES.LATE_POINTS
    // The window closed before the student registered, so it isn't a miss.
    if (until <= createdAt) continue
    // A miss: a shield absorbs it, otherwise the run starts over. Earned points are never taken back.
    if (freezes > 0) freezes -= 1
    else run = 0
  }

  return {
    run,
    best_run: bestRun,
    multiplier: Math.round(multiplierFor(run) * 10) / 10,
    freezes,
    points,
    lives_to_next_freeze: freezes >= RULES.MAX_FREEZES ? null : RULES.LIVES_PER_FREEZE - (run % RULES.LIVES_PER_FREEZE),
    lives_to_max_multiplier: Math.max(0, RULES.MAX_LEVEL - run),
    total_live_on_time: liveOnTime,
    playlist_progress: playlistProgress,
  }
}

// What changed with one mark, in the order the frontend shows it (celebration first, then toasts).
export function diffEvents(before: Progress, after: Progress, attendance: { kind: AttendanceKind; on_time: boolean }): ProgressEvent[] {
  const events: ProgressEvent[] = []
  if (before.total_live_on_time === 0 && after.total_live_on_time > 0) events.push({ type: 'FIRST_LIVE' })
  if (after.run > before.run) events.push({ type: 'RUN_UP', from: before.run, to: after.run })
  if (before.run < RULES.MAX_LEVEL && after.run >= RULES.MAX_LEVEL) events.push({ type: 'MAX_MULTIPLIER' })
  if (after.freezes > before.freezes) events.push({ type: 'FREEZE_EARNED', freezes: after.freezes })
  if (attendance.kind === 'RECORDED' && attendance.on_time) events.push({ type: 'RECORDED_SAVED' })
  if (!attendance.on_time) events.push({ type: 'LATE_CATCH_UP' })
  return events
}
