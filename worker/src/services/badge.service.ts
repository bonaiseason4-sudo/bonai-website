import { evaluateBadge, parseRuleParams, type BadgeProgress } from '../lib/badges'
import type { Progress } from '../lib/progress'
import { BadgeModel, type UserBadgeRow } from '../models/badge.model'
import { PlaylistModel } from '../models/playlist.model'
import type { UserRow } from '../models/user.model'
import { badgeView, type BadgeView } from '../views/badge.view'

interface CheckedBadge {
  row: UserBadgeRow
  // Can still be awarded: the badge is active and, for a playlist badge, its playlist is on the site.
  available: boolean
  earned: boolean
  progress: BadgeProgress | null
}

function isAvailable(row: UserBadgeRow, activePlaylists: Set<string>): boolean {
  const playlistId = parseRuleParams(row.rule_params)?.playlist_id
  return row.is_active === 1 && (typeof playlistId !== 'string' || activePlaylists.has(playlistId))
}

const view = ({ row, progress }: CheckedBadge) => badgeView(row, progress)

// Checks every badge against the progress just computed and records the ones earned for the first time.
// Awards are only ever added: a badge stays earned even if the progress behind it later goes down.
async function sync(user: UserRow, progress: Progress, now: string): Promise<{ badges: CheckedBadge[]; awarded: CheckedBadge[] }> {
  const [rows, activePlaylists] = await Promise.all([BadgeModel.findForUser(user.id), PlaylistModel.findActiveIds()])
  const checked = rows.map((row) => ({ row, available: isAvailable(row, activePlaylists), ...evaluateBadge(row, progress) }))

  const due = new Set(checked.filter((badge) => badge.available && badge.earned && badge.row.awarded_at === null).map((badge) => badge.row.id))
  const inserted = await BadgeModel.award(user.id, [...due], now)
  // A badge another request awarded a moment ago is earned too; only this request's inserts count as new.
  const badges = checked.map((badge) => (due.has(badge.row.id) ? { ...badge, row: { ...badge.row, awarded_at: now } } : badge))
  return { badges, awarded: badges.filter((badge) => inserted.has(badge.row.id)) }
}

export const BadgeService = {
  // The badges newly earned with this progress, in album order (for the BADGE_EARNED events).
  async evaluate(user: UserRow, progress: Progress, now = new Date().toISOString()): Promise<BadgeView[]> {
    const { awarded } = await sync(user, progress, now)
    return awarded.map(view)
  },

  // The whole album. A badge whose playlist is hidden or deleted is listed only for students who earned it.
  async album(user: UserRow, progress: Progress): Promise<{ badges: BadgeView[]; summary: { earned: number; total: number } }> {
    const { badges } = await sync(user, progress, new Date().toISOString())
    const listed = badges.filter((badge) => badge.row.awarded_at !== null || badge.available)
    return {
      badges: listed.map(view),
      summary: { earned: listed.filter((badge) => badge.row.awarded_at !== null).length, total: listed.length },
    }
  },

  // Earned badges the site hasn't celebrated yet, including any this call just awarded.
  async unseen(user: UserRow, progress: Progress): Promise<BadgeView[]> {
    const { badges } = await sync(user, progress, new Date().toISOString())
    return badges.filter((badge) => badge.row.awarded_at !== null && badge.row.seen_at === null).map(view)
  },

  async markSeen(user: UserRow, badgeIds: string[]): Promise<void> {
    await BadgeModel.markSeen(user.id, badgeIds, new Date().toISOString())
  },
}
