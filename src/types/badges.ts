export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD'

export interface BadgeProgress {
  current: number
  target: number
}

// Built by the API, which also decides who earned what; the frontend only draws it.
export interface BadgeView {
  id: string
  title: string
  description: string
  // flame, broadcast, star, crown, book, check, medal or secret; anything else is drawn as a medal.
  icon: string
  // coral, green, purple, gold, blue, bronze or silver; a tier's own color wins.
  color: string
  tier: BadgeTier | null
  is_secret: boolean
  // null until earned.
  earned_at: string | null
  seen: boolean
  // null for secret badges not earned yet and badges with nothing to count.
  progress: BadgeProgress | null
}

export interface BadgesResponse {
  badges: BadgeView[]
  summary: { earned: number; total: number }
}
