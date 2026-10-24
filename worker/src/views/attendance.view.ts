import { isOnTime } from '../lib/progress'
import type { AttendanceRow } from '../models/attendance.model'

// JSON shape of one mark (matches src/types/progress.ts in the React app).
export function attendanceView({ video_id, kind, marked_at }: AttendanceRow, attendUntil: string | null) {
  return { video_id, kind, marked_at, on_time: isOnTime(marked_at, attendUntil) }
}
