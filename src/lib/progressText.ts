import type { Progress } from '../types/progress'

// LRI…PDI (U+2066/U+2069) keeps signs and numbers left-to-right inside Arabic text, so "+5" never shows as "5+".
const ltr = (text: string) => `\u2066${text}\u2069`
export const fullMultiplier = ltr('×1.5')

export function plusPoints(count: number): string {
  return ltr(`+${count}`)
}

// Arabic counting: 1 درس, 2 درسين, 3–10 دروس, 11+ درس.
export function lessonsText(count: number): string {
  if (count === 1) return 'درس واحد'
  if (count === 2) return 'درسين'
  return count <= 10 ? `${count} دروس` : `${count} درس`
}

export function timesText(count: number): string {
  if (count === 1) return 'مرة'
  if (count === 2) return 'مرتين'
  return count <= 10 ? `${count} مرات` : `${count} مرة`
}

// The numbers come from the API; this only words them.
export function multiplierHint(progress: Progress): string {
  const left = progress.lives_to_max_multiplier
  if (left <= 0) return `وصلت للمضاعِف الكامل ${fullMultiplier}`
  if (left === 1) return `درس كمان وتوصل للمضاعِف الكامل ${fullMultiplier}`
  return `باقي ${lessonsText(left)} مباشر وتوصل للمضاعِف الكامل ${fullMultiplier}`
}

export function freezeHint(progress: Progress): string {
  const left = progress.lives_to_next_freeze
  if (left === null) return 'معاك أقصى عدد من الدروع 🛡️'
  if (left === 1) return 'حضور مباشر كمان وتكسب درع 🛡️'
  return `باقي ${lessonsText(left)} مباشر وتكسب درع 🛡️`
}
