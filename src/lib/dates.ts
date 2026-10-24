const DAY = 24 * 60 * 60 * 1000

// Formatted in the device's time zone, e.g. "الخميس ٨:٠٠ م".
const weekdayTime = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', hour: 'numeric', minute: '2-digit' })
const fullDateTime = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
const dateTime = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
const dayMonthYear = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

// "٢٤ أكتوبر ٢٠٢٦", e.g. when a badge was earned.
export function formatDate(iso: string): string {
  const time = Date.parse(iso)
  return Number.isNaN(time) ? '' : dayMonthYear.format(time)
}

// The weekday alone is ambiguous a week or more away, so the date is added then.
export function formatAttendTime(iso: string, now = Date.now()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return ''
  return Math.abs(time - now) < 6 * DAY ? weekdayTime.format(time) : fullDateTime.format(time)
}

// "٢٩ أكتوبر في ٩:٠٠ م", for the admins' view of a window.
export function formatDateTime(iso: string): string {
  const time = Date.parse(iso)
  return Number.isNaN(time) ? '' : dateTime.format(time)
}

const pad = (value: number) => String(value).padStart(2, '0')

// Admin form: a datetime-local input works with local "YYYY-MM-DDTHH:mm" strings, the API with ISO UTC.
export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function isoToLocalInput(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : null
  return date && !Number.isNaN(date.getTime()) ? toLocalInput(date) : ''
}

export function localInputToIso(value: string): string {
  if (!value.trim()) return ''
  // Without an offset the string is read as local time.
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
