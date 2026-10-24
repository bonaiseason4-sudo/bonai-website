import { ApiError, apiRequest } from '../lib/api'
import type { Attendance, AttendanceKind, MarkAttendanceResult, Progress, ProgressResponse } from '../types/progress'

// Answers can arrive out of order (marks on several lessons in flight, a recount racing a mark), so each progress
// remembers the order its request was sent in, and the shared progress never goes back to an older one.
let requestsSent = 0
const sentOrder = new WeakMap<Progress, number>()

function stamp(progress: Progress, order: number): Progress {
  sentOrder.set(progress, order)
  return progress
}

// Higher is newer; 0 for progress that did not come from these requests.
export function progressOrder(progress: Progress): number {
  return sentOrder.get(progress) ?? 0
}

export async function markAttendance(videoId: string, kind: AttendanceKind): Promise<MarkAttendanceResult> {
  const order = ++requestsSent
  const result = await apiRequest<MarkAttendanceResult>('/api/attendance', { method: 'POST', body: { video_id: videoId, kind } })
  stamp(result.progress, order)
  return result
}

export async function unmarkAttendance(videoId: string): Promise<Progress> {
  const order = ++requestsSent
  const { progress } = await apiRequest<{ progress: Progress }>(`/api/attendance/${encodeURIComponent(videoId)}`, { method: 'DELETE' })
  return stamp(progress, order)
}

export async function getProgress(): Promise<ProgressResponse> {
  const order = ++requestsSent
  const { progress, unseen_badges } = await apiRequest<ProgressResponse>('/api/progress')
  return { progress: stamp(progress, order), unseen_badges: unseen_badges ?? [] }
}

export async function getPlaylistAttendance(playlistId: string): Promise<Attendance[]> {
  const { attendances } = await apiRequest<{ attendances: Attendance[] }>(`/api/playlists/${encodeURIComponent(playlistId)}/my-attendance`)
  return attendances
}

// Arabic message for a failed attendance request.
export function progressErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.'
  if (error.code === 'NOT_FOUND') return 'هذا الدرس غير متاح الآن.'
  if (error.code === 'INVALID_KIND') return 'نوع الحضور غير صحيح، حدّث الصفحة وحاول مرة أخرى.'
  if (error.code === 'NOT_STARTED') return 'ميعاد الحضور لم يبدأ بعد.'
  if (error.code === 'LIVE_CLOSED') return 'انتهى ميعاد الحضور المباشر، تقدر تسجّلها مسجّلة.'
  if (error.code === 'LOCKED') return 'حضورك في هذا الدرس محفوظ ولا يمكن تغييره بعد انتهاء الميعاد.'
  if (error.status === 401) return 'انتهت الجلسة، سجّل الدخول مرة أخرى.'
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
}
