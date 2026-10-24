import { computeProgress, type Progress, type ProgressMark } from '../lib/progress'
import { AttendanceModel } from '../models/attendance.model'
import type { UserRow } from '../models/user.model'
import { VideoModel, type AttendableLesson } from '../models/video.model'

// Progress is never stored: it is rebuilt from the lessons and the user's marks on every request,
// so a changed lesson window or rule in lib/progress.ts applies to everyone at once.
export const ProgressService = {
  async load(userId: string): Promise<{ lessons: AttendableLesson[]; marks: ProgressMark[] }> {
    const [lessons, marks] = await Promise.all([VideoModel.findAttendable(), AttendanceModel.findByUser(userId)])
    return { lessons, marks }
  },

  compute(user: UserRow, lessons: AttendableLesson[], marks: ProgressMark[], now = new Date().toISOString()): Progress {
    return computeProgress({ lessons, marks, userCreatedAt: user.created_at, now })
  },

  async forUser(user: UserRow): Promise<Progress> {
    const { lessons, marks } = await ProgressService.load(user.id)
    return ProgressService.compute(user, lessons, marks)
  },
}
