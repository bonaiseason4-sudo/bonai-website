import { db } from '../config/db'
import type { BadgeTier } from '../lib/badges'

export interface BadgeRow {
  id: string
  title: string
  description: string
  icon: string
  color: string
  tier: BadgeTier | null
  // Names a rule in lib/badges.ts; rule_params is its JSON settings.
  rule_type: string
  rule_params: string
  is_secret: number
  is_active: number
  sort_order: number
  created_at: string
}

// A badge with the user's award on it; both null when not earned.
export interface UserBadgeRow extends BadgeRow {
  awarded_at: string | null
  seen_at: string | null
}

export const BadgeModel = {
  // Active badges, plus hidden ones the user already earned: an award is never taken back.
  async findForUser(userId: string): Promise<UserBadgeRow[]> {
    const { results } = await db
      .prepare(
        `SELECT b.*, ub.awarded_at, ub.seen_at FROM badges b
         LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
         WHERE b.is_active = 1 OR ub.user_id IS NOT NULL
         ORDER BY b.sort_order, b.id`,
      )
      .bind(userId)
      .all<UserBadgeRow>()
    return results
  },

  // Returns the IDs actually inserted, so two requests at once can't both report the same new badge.
  async award(userId: string, badgeIds: string[], awardedAt: string): Promise<Set<string>> {
    if (!badgeIds.length) return new Set()
    const statement = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?, ?, ?)')
    const results = await db.batch(badgeIds.map((id) => statement.bind(userId, id, awardedAt)))
    return new Set(badgeIds.filter((_, index) => results[index].meta.changes > 0))
  },

  // Only the first time counts: badges already seen keep their seen_at. Unknown IDs match nothing.
  async markSeen(userId: string, badgeIds: string[], seenAt: string): Promise<void> {
    if (!badgeIds.length) return
    await db
      .prepare(`UPDATE user_badges SET seen_at = ? WHERE user_id = ? AND seen_at IS NULL AND badge_id IN (${badgeIds.map(() => '?').join(', ')})`)
      .bind(seenAt, userId, ...badgeIds)
      .run()
  },
}
