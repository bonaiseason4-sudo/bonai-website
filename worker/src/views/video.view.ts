import type { VideoRow } from '../models/video.model'

// The frontend expects `isQuiz`, matching the original Supabase column name.
export function videoView({ is_quiz, ...row }: VideoRow) {
  return { ...row, is_active: row.is_active === 1, isQuiz: is_quiz === 1 }
}
