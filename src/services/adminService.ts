import { ApiError, apiRequest } from '../lib/api'

export type EntityKind = 'playlist' | 'video' | 'attachment'

const paths: Record<EntityKind, string> = {
  playlist: '/api/admin/playlists',
  video: '/api/admin/videos',
  attachment: '/api/admin/attachments',
}

// Creates when originalId is missing; otherwise replaces the item (the body may carry a new ID).
export async function saveEntity<T>(kind: EntityKind, body: Record<string, unknown>, originalId?: string): Promise<T> {
  return originalId
    ? apiRequest<T>(`${paths[kind]}/${encodeURIComponent(originalId)}`, { method: 'PUT', body })
    : apiRequest<T>(paths[kind], { method: 'POST', body })
}

export async function deleteEntity(kind: EntityKind, id: string): Promise<void> {
  await apiRequest(`${paths[kind]}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

const parentLabels: Record<EntityKind, string> = {
  playlist: '',
  video: 'لا توجد سلسلة بهذا الـID.',
  attachment: 'لا يوجد درس بهذا الـID.',
}

export function adminErrorMessage(error: unknown, kind: EntityKind): string {
  if (!(error instanceof ApiError)) return 'تعذّر الاتصال بالخادم. حاول مرة أخرى.'
  if (error.code === 'DUPLICATE_ID') return 'هذا الـID مستخدم بالفعل، اختر ID آخر.'
  if (error.code === 'MISSING_PARENT') return parentLabels[kind]
  if (error.code === 'INVALID_WINDOW') return 'ميعاد الحضور غير صحيح: اكتب البداية والنهاية معًا، والنهاية بعد البداية.'
  if (error.status === 401) return 'انتهت الجلسة، سجّل الدخول مرة أخرى.'
  if (error.status === 403) return 'هذه العملية للمشرفين فقط.'
  if (error.status === 404) return 'العنصر غير موجود، ربما حُذف بالفعل.'
  if (error.status === 400) return `تحقق من الحقول: ${error.message}`
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
}
