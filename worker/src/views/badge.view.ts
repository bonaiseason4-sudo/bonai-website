import type { BadgeProgress, BadgeTier } from '../lib/badges'
import type { UserBadgeRow } from '../models/badge.model'

// JSON shape of one badge for the logged-in user (matches src/types/badges.ts in the React app).
export interface BadgeView {
  id: string
  title: string
  description: string
  icon: string
  color: string
  tier: BadgeTier | null
  is_secret: boolean
  earned_at: string | null
  seen: boolean
  progress: BadgeProgress | null
}

// A secret badge gives nothing away until it is earned.
const SECRET = { title: 'وسام سري', description: 'مفاجأة! كمّل وهتعرفه', icon: 'secret' }

export function badgeView(badge: UserBadgeRow, progress: BadgeProgress | null): BadgeView {
  const hidden = badge.is_secret === 1 && badge.awarded_at === null
  return {
    id: badge.id,
    title: hidden ? SECRET.title : badge.title,
    description: hidden ? SECRET.description : badge.description,
    icon: hidden ? SECRET.icon : badge.icon,
    color: badge.color,
    tier: badge.tier,
    is_secret: badge.is_secret === 1,
    earned_at: badge.awarded_at,
    seen: badge.seen_at !== null,
    progress: hidden ? null : progress,
  }
}
