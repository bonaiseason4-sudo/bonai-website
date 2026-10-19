import type { EntityKind } from '../../services/adminService'
import type { Attachment, AttachmentType, Playlist, Video } from '../../types/content'

export type FormValues = Record<string, string | boolean>

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'number' | 'checkbox' | 'select'
  required?: boolean
  hint?: string
  options?: { value: string; label: string }[]
  ltr?: boolean
  showIf?: (values: FormValues) => boolean
}

const idHint = 'حروف إنجليزية وأرقام و _ أو - فقط، مثل SEERAH_01'

const attachmentTypeLabels: Record<AttachmentType, string> = {
  PDF: 'PDF',
  POWERPOINT: 'PowerPoint',
  WORD: 'Word',
  SPREADSHEET: 'Excel / جدول',
  GOOGLE_FORM: 'Google Form (اختبار)',
  GEMINI_QUIZ: 'Gemini Quiz',
  LINK: 'رابط',
  OTHER: 'أخرى',
}

export const entityLabels: Record<EntityKind, { singular: string; add: string }> = {
  playlist: { singular: 'السلسلة', add: 'إضافة سلسلة' },
  video: { singular: 'الدرس', add: 'إضافة درس' },
  attachment: { singular: 'المرفق', add: 'إضافة مرفق' },
}

export const deleteWarnings: Record<EntityKind, string> = {
  playlist: 'سيتم حذف السلسلة وكل دروسها ومرفقاتها نهائيًا.',
  video: 'سيتم حذف الدرس وكل مرفقاته نهائيًا.',
  attachment: 'سيتم حذف المرفق نهائيًا.',
}

const visibleField: FieldConfig = { name: 'is_active', label: 'ظاهر للزوار', type: 'checkbox' }
const sortField: FieldConfig = { name: 'sort_order', label: 'الترتيب', type: 'number', hint: 'الأصغر يظهر أولًا' }

export const entityFields: Record<EntityKind, FieldConfig[]> = {
  playlist: [
    { name: 'id', label: 'ID', type: 'text', required: true, ltr: true, hint: idHint },
    { name: 'title', label: 'العنوان', type: 'text', required: true },
    { name: 'description', label: 'الوصف', type: 'textarea' },
    { name: 'image_url', label: 'رابط الصورة', type: 'url', ltr: true },
    sortField,
    // No visibility toggle: playlists are hidden or shown from the database only.
  ],
  video: [
    { name: 'id', label: 'ID', type: 'text', required: true, ltr: true, hint: idHint },
    { name: 'playlist_id', label: 'ID السلسلة', type: 'text', required: true, ltr: true, hint: 'غيّره لنقل الدرس إلى سلسلة أخرى' },
    { name: 'title', label: 'العنوان', type: 'text', required: true },
    { name: 'description', label: 'الوصف', type: 'textarea' },
    { name: 'isQuiz', label: 'هذا اختبار وليس درسًا', type: 'checkbox' },
    {
      name: 'video_source', label: 'مصدر الفيديو', type: 'select',
      options: [{ value: 'GOOGLE_DRIVE', label: 'Google Drive' }, { value: 'DIRECT', label: 'رابط مباشر (MP4 / Vconnct)' }, { value: '', label: 'بدون فيديو' }],
    },
    { name: 'drive_file_id', label: 'Google Drive File ID أو الرابط', type: 'text', ltr: true, required: true, showIf: (values) => values.video_source === 'GOOGLE_DRIVE' },
    { name: 'video_url', label: 'رابط الفيديو', type: 'url', ltr: true, required: true, showIf: (values) => values.video_source === 'DIRECT' },
    sortField,
    visibleField,
  ],
  attachment: [
    { name: 'id', label: 'ID', type: 'text', required: true, ltr: true, hint: idHint },
    { name: 'video_id', label: 'ID الدرس', type: 'text', required: true, ltr: true },
    { name: 'title', label: 'العنوان', type: 'text', required: true },
    { name: 'description', label: 'الوصف', type: 'textarea' },
    { name: 'url', label: 'الرابط', type: 'url', required: true, ltr: true },
    { name: 'file_type', label: 'النوع', type: 'select', options: Object.entries(attachmentTypeLabels).map(([value, label]) => ({ value, label })) },
    sortField,
    visibleField,
  ],
}

const text = (value: string | null | undefined) => value ?? ''

export function playlistValues(playlist?: Playlist, sortOrder = 0): FormValues {
  return {
    id: text(playlist?.id), title: text(playlist?.title), description: text(playlist?.description), image_url: text(playlist?.image_url),
    sort_order: String(playlist?.sort_order ?? sortOrder),
  }
}

export function videoValues(video: Video | undefined, playlistId: string, sortOrder = 0): FormValues {
  return {
    id: text(video?.id), playlist_id: video?.playlist_id ?? playlistId, title: text(video?.title), description: text(video?.description),
    isQuiz: video ? video.isQuiz === true || video.isQuiz === 1 : false,
    video_source: video ? text(video.video_source) : 'GOOGLE_DRIVE', drive_file_id: text(video?.drive_file_id), video_url: text(video?.video_url),
    sort_order: String(video?.sort_order ?? sortOrder), is_active: video?.is_active ?? true,
  }
}

export function attachmentValues(attachment: Attachment | undefined, videoId: string, sortOrder = 0): FormValues {
  return {
    id: text(attachment?.id), video_id: attachment?.video_id ?? videoId, title: text(attachment?.title), description: text(attachment?.description),
    url: text(attachment?.url), file_type: attachment?.file_type ?? 'PDF', sort_order: String(attachment?.sort_order ?? sortOrder), is_active: attachment?.is_active ?? true,
  }
}

// Turns form values into the API body: numbers for sort_order, hidden fields cleared.
export function toRequestBody(kind: EntityKind, values: FormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const field of entityFields[kind]) {
    const value = values[field.name]
    if (field.showIf && !field.showIf(values)) body[field.name] = ''
    else if (field.type === 'number') body[field.name] = Number(value || 0)
    else body[field.name] = typeof value === 'string' ? value.trim() : value
  }
  return body
}

export function nextSortOrder(items: { sort_order: number }[] | null | undefined): number {
  return (items ?? []).reduce((max, item) => Math.max(max, item.sort_order), 0) + 1
}
