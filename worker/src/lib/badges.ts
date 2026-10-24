// Badge rules. Pure and import-free like lib/progress.ts, so scripts/badges.test.mjs can load this file
// straight into Node: keep it to erasable TypeScript.
//
// A badge row names one of RULE_TYPES in rule_type and fills it in with rule_params (JSON), so a new badge
// of an existing type is only a database row; a new kind of achievement is one new entry here.
// Rules only look at what the student did: never at misses, shields or late marks.

// The parts of Progress (lib/progress.ts) that badges read; a Progress object can be passed as it is.
export type BadgeRuleContext = {
  best_run: number
  points: number
  total_live_on_time: number
  playlist_progress: Record<string, { marked: number; total: number; live_on_time: number }>
}

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD'

export interface BadgeProgress {
  current: number
  target: number
}

export type BadgeParams = Record<string, unknown>

export interface BadgeRule {
  earned(params: BadgeParams, ctx: BadgeRuleContext): boolean
  // How far along the student is, for the "almost there" list; null when there is nothing to measure.
  progress(params: BadgeParams, ctx: BadgeRuleContext): BadgeProgress | null
}

export interface BadgeEvaluation {
  earned: boolean
  progress: BadgeProgress | null
}

type PlaylistCounts = BadgeRuleContext['playlist_progress'][string]

const NOT_EARNED: BadgeEvaluation = { earned: false, progress: null }

// A target written by hand in rule_params: a whole number, 1 or more, or the badge can't be earned.
function target(params: BadgeParams): number | null {
  const n = params.n
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null
}

// "Reach n of something": earned at n, progress counts up to n and stops there.
function reached(read: (ctx: BadgeRuleContext) => number): BadgeRule {
  return {
    earned: (params, ctx) => {
      const n = target(params)
      return n !== null && read(ctx) >= n
    },
    progress: (params, ctx) => {
      const n = target(params)
      return n === null ? null : { current: Math.min(read(ctx), n), target: n }
    },
  }
}

// Silver needs every lesson marked and more than half of them LIVE on time: 3 of 4, 3 of 5.
const silverTarget = (total: number) => Math.floor(total / 2) + 1

// One playlist against one tier. Callers make sure total > 0.
const TIERS: Record<BadgeTier, { earned(p: PlaylistCounts): boolean; progress(p: PlaylistCounts): BadgeProgress }> = {
  BRONZE: {
    earned: (p) => p.marked === p.total,
    progress: (p) => ({ current: p.marked, target: p.total }),
  },
  SILVER: {
    earned: (p) => p.marked === p.total && p.live_on_time * 2 > p.total,
    progress: (p) => ({ current: Math.min(p.live_on_time, silverTarget(p.total)), target: silverTarget(p.total) }),
  },
  GOLD: {
    earned: (p) => p.live_on_time === p.total,
    progress: (p) => ({ current: p.live_on_time, target: p.total }),
  },
}

function tierOf(params: BadgeParams): BadgeTier | null {
  const tier = params.tier
  return tier === 'BRONZE' || tier === 'SILVER' || tier === 'GOLD' ? tier : null
}

// The playlists a complete_playlist badge looks at: the named one, or every playlist when playlist_id is null
// (or left out). A playlist without lessons can't be completed, so it is left out.
function playlistsFor(params: BadgeParams, ctx: BadgeRuleContext): { id: string; counts: PlaylistCounts }[] {
  const playlistId = params.playlist_id ?? null
  if (playlistId !== null && typeof playlistId !== 'string') return []
  const ids = playlistId === null ? Object.keys(ctx.playlist_progress).sort() : [playlistId]
  return ids
    .filter((id) => Object.hasOwn(ctx.playlist_progress, id) && ctx.playlist_progress[id].total > 0)
    .map((id) => ({ id, counts: ctx.playlist_progress[id] }))
}

// For "any playlist", show the one closest to the goal: an earned one first, then the highest ratio.
function closest(tier: BadgeTier, playlists: { counts: PlaylistCounts }[]): BadgeProgress | null {
  let best: { earned: boolean; ratio: number; progress: BadgeProgress } | null = null
  for (const { counts } of playlists) {
    const earned = TIERS[tier].earned(counts)
    const progress = TIERS[tier].progress(counts)
    const ratio = progress.current / progress.target
    if (!best || (earned && !best.earned) || (earned === best.earned && ratio > best.ratio)) best = { earned, ratio, progress }
  }
  return best ? best.progress : null
}

export const RULE_TYPES: Record<string, BadgeRule> = {
  // The first lesson attended LIVE on time.
  first_live: {
    earned: (_params, ctx) => ctx.total_live_on_time >= 1,
    progress: (_params, ctx) => ({ current: Math.min(ctx.total_live_on_time, 1), target: 1 }),
  },

  // {n}: n lessons attended LIVE on time, in total.
  live_count: reached((ctx) => ctx.total_live_on_time),

  // {n}: a run of n. Uses the best run, which never goes down, so a broken run doesn't hide the progress made.
  streak_reached: reached((ctx) => ctx.best_run),

  // {n}: n points in total.
  points_reached: reached((ctx) => ctx.points),

  // {playlist_id, tier}: every lesson of the playlist marked (bronze), with more than half LIVE on time (silver),
  // or all of them LIVE on time (gold). playlist_id null = any playlist.
  complete_playlist: {
    earned: (params, ctx) => {
      const tier = tierOf(params)
      return tier !== null && playlistsFor(params, ctx).some(({ counts }) => TIERS[tier].earned(counts))
    },
    progress: (params, ctx) => {
      const tier = tierOf(params)
      return tier === null ? null : closest(tier, playlistsFor(params, ctx))
    },
  },
}

// rule_params as stored (JSON text) or already parsed. Anything that isn't a JSON object gives null.
export function parseRuleParams(value: unknown): BadgeParams | null {
  let params = value
  if (typeof value === 'string') {
    try {
      params = JSON.parse(value)
    } catch {
      return null
    }
  }
  return typeof params === 'object' && params !== null && !Array.isArray(params) ? (params as BadgeParams) : null
}

// Never throws: a badge with an unknown rule_type or broken rule_params is simply not earned.
export function evaluateBadge(badge: { rule_type: string; rule_params: string | object }, ctx: BadgeRuleContext): BadgeEvaluation {
  const rule = Object.hasOwn(RULE_TYPES, badge.rule_type) ? RULE_TYPES[badge.rule_type] : null
  const params = parseRuleParams(badge.rule_params)
  if (!rule || !params) return NOT_EARNED
  try {
    return { earned: rule.earned(params, ctx) === true, progress: rule.progress(params, ctx) }
  } catch {
    return NOT_EARNED
  }
}
