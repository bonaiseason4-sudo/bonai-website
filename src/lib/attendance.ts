import type { Video } from '../types/content'
import type { Attendance, AttendanceKind } from '../types/progress'
import { formatAttendTime } from './dates'

type AttendWindow = Pick<Video, 'attend_from' | 'attend_until'>

// Where the lesson's attendance window stands; 'none' = the lesson is outside the streak.
export type WindowPhase = 'none' | 'upcoming' | 'open' | 'ended'

// Same boundaries as the API: NOT_STARTED before attend_from, LIVE_CLOSED after attend_until.
export function windowPhase(video: AttendWindow, now: number): WindowPhase {
  if (!video.attend_from || !video.attend_until) return 'none'
  if (now < Date.parse(video.attend_from)) return 'upcoming'
  if (now > Date.parse(video.attend_until)) return 'ended'
  return 'open'
}

// Only for the optimistic mark shown until the API answers with the real one.
export function isOnTime(video: AttendWindow, now: number): boolean {
  return !video.attend_until || now <= Date.parse(video.attend_until)
}

export interface AttendanceView {
  phase: WindowPhase
  // An on-time mark after the window ended: kept as it is to protect the student's record.
  locked: boolean
  // Why each button is disabled, or null when it can be pressed.
  disabled: Record<AttendanceKind, string | null>
  status: string | null
  tone: 'live' | 'recorded' | 'late' | 'info'
}

export function attendanceView(video: AttendWindow, attendance: Attendance | undefined, now: number): AttendanceView {
  const phase = windowPhase(video, now)
  const locked = phase === 'ended' && attendance?.on_time === true
  const disabled: Record<AttendanceKind, string | null> = { LIVE: null, RECORDED: null }

  if (phase === 'upcoming') {
    disabled.LIVE = disabled.RECORDED = 'لم يبدأ ميعاد الحضور بعد'
  } else if (locked) {
    disabled.LIVE = disabled.RECORDED = 'حضورك محفوظ ولا يمكن تغييره بعد انتهاء الميعاد'
  } else if (phase === 'ended') {
    disabled.LIVE = 'انتهى ميعاد الحضور'
  }

  if (attendance) {
    if (!attendance.on_time) return { phase, locked, disabled, status: 'استدراك متأخر', tone: 'late' }
    return attendance.kind === 'LIVE'
      ? { phase, locked, disabled, status: 'حضرتها مباشر', tone: 'live' }
      : { phase, locked, disabled, status: 'سمعتها مسجّلة', tone: 'recorded' }
  }

  const status = phase === 'upcoming' ? `يبدأ الحضور ${formatAttendTime(video.attend_from!, now)}`
    : phase === 'open' ? `ينتهي الحضور ${formatAttendTime(video.attend_until!, now)}`
      : phase === 'ended' ? 'انتهى ميعاد الحضور، تقدر تستدركها مسجّلة'
        : null
  return { phase, locked, disabled, status, tone: 'info' }
}
