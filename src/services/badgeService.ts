import { apiRequest } from '../lib/api'
import type { BadgesResponse } from '../types/badges'

export function getBadges(): Promise<BadgesResponse> {
  return apiRequest<BadgesResponse>('/api/badges')
}

// Stops a badge from celebrating again on the next visit.
export function markBadgesSeen(badgeIds: string[]): Promise<void> {
  return apiRequest<void>('/api/badges/seen', { method: 'POST', body: { badge_ids: badgeIds } })
}
