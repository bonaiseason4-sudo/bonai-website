import type { Request, Response } from 'express'
import { diffEvents, isOnTime } from '../lib/progress'
import { ATTENDANCE_KINDS, AttendanceModel } from '../models/attendance.model'
import type { UserRow } from '../models/user.model'
import { BadgeService } from '../services/badge.service'
import { ProgressService } from '../services/progress.service'
import { attendanceView } from '../views/attendance.view'

function fail(res: Response, status: number, code: string, error: string) {
  res.status(status).json({ error, code })
}

// Once its window has closed, an on-time mark is part of the student's record and can't be changed or removed.
function isLocked(mark: { marked_at: string } | null | undefined, attendUntil: string | null, now: string): boolean {
  return !!mark && attendUntil !== null && now > attendUntil && isOnTime(mark.marked_at, attendUntil)
}

const LOCKED_MESSAGE = 'This attendance was on time and its window has ended, so it can no longer be changed'

export const AttendanceController = {
  async mark(req: Request, res: Response) {
    const user = res.locals.user as UserRow
    const videoId = typeof req.body?.video_id === 'string' ? req.body.video_id : ''
    const kind = req.body?.kind

    const { lessons, marks } = await ProgressService.load(user.id)
    const lesson = lessons.find((item) => item.id === videoId)
    if (!lesson) return fail(res, 404, 'NOT_FOUND', 'Lesson not found')
    if (!ATTENDANCE_KINDS.includes(kind)) return fail(res, 400, 'INVALID_KIND', 'kind must be LIVE or RECORDED')

    const now = new Date().toISOString()
    if (lesson.attend_from !== null && now < lesson.attend_from) return fail(res, 400, 'NOT_STARTED', 'Attendance for this lesson has not started yet')
    if (kind === 'LIVE' && lesson.attend_until !== null && now > lesson.attend_until) {
      return fail(res, 400, 'LIVE_CLOSED', 'Live attendance for this lesson has ended')
    }
    if (isLocked(marks.find((item) => item.video_id === lesson.id), lesson.attend_until, now)) return fail(res, 409, 'LOCKED', LOCKED_MESSAGE)

    const before = ProgressService.compute(user, lessons, marks, now)
    const saved = await AttendanceModel.upsert(user.id, lesson.id, kind, now)
    const after = ProgressService.compute(user, lessons, [...marks.filter((item) => item.video_id !== lesson.id), saved], now)
    const attendance = attendanceView(saved, lesson.attend_until)
    // Badges come after the streak events: the site celebrates them once the streak celebration closes.
    const badges = await BadgeService.evaluate(user, after, now)
    const events = [...diffEvents(before, after, attendance), ...badges.map((badge) => ({ type: 'BADGE_EARNED' as const, badge }))]

    res.json({ attendance, progress: after, events, points_gained: after.points - before.points })
  },

  async unmark(req: Request<{ videoId: string }>, res: Response) {
    const user = res.locals.user as UserRow
    const mark = await AttendanceModel.findOne(user.id, req.params.videoId)
    if (!mark) return fail(res, 404, 'NOT_FOUND', 'Attendance not found')
    if (isLocked(mark, mark.attend_until, new Date().toISOString())) return fail(res, 409, 'LOCKED', LOCKED_MESSAGE)

    await AttendanceModel.delete(user.id, mark.video_id)
    res.json({ progress: await ProgressService.forUser(user) })
  },

  // The user's marks on one playlist's lessons, for the lesson list.
  async playlist(req: Request<{ id: string }>, res: Response) {
    const marks = await AttendanceModel.findByPlaylist((res.locals.user as UserRow).id, req.params.id)
    res.json({ attendances: marks.map((mark) => attendanceView(mark, mark.attend_until)) })
  },
}

export const ProgressController = {
  // Also awards badges earned meanwhile (e.g. a rule or lesson changed), so they are celebrated on the next visit.
  async show(_req: Request, res: Response) {
    const user = res.locals.user as UserRow
    const progress = await ProgressService.forUser(user)
    res.json({ progress, unseen_badges: await BadgeService.unseen(user, progress) })
  },
}
