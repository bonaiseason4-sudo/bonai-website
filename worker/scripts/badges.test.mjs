// Unit tests for the badge rules: npm test (Node strips the types from badges.ts).
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { RULE_TYPES, evaluateBadge, parseRuleParams } from '../src/lib/badges.ts'
import { computeProgress } from '../src/lib/progress.ts'

const NOT_EARNED = { earned: false, progress: null }

// A Progress-shaped context; run and the other Progress fields are there to show badges ignore them.
function ctx(overrides = {}) {
  return {
    run: 0,
    best_run: 0,
    multiplier: 1,
    freezes: 0,
    points: 0,
    lives_to_next_freeze: 4,
    lives_to_max_multiplier: 5,
    total_live_on_time: 0,
    playlist_progress: {},
    ...overrides,
  }
}

const playlist = (marked, total, live_on_time) => ({ marked, total, live_on_time })
const badge = (rule_type, rule_params = {}) => ({ rule_type, rule_params })
const complete = (tier, playlist_id = 'p1') => badge('complete_playlist', { playlist_id, tier })
const one = (counts) => ctx({ playlist_progress: { p1: counts } })

describe('RULE_TYPES', () => {
  test('has the agreed rule types', () => {
    assert.deepEqual(Object.keys(RULE_TYPES).sort(), ['complete_playlist', 'first_live', 'live_count', 'points_reached', 'streak_reached'])
  })
})

describe('first_live', () => {
  test('not earned before any live on time', () => {
    assert.deepEqual(evaluateBadge(badge('first_live'), ctx()), { earned: false, progress: { current: 0, target: 1 } })
  })

  test('earned with the first live on time, progress stops at 1', () => {
    assert.deepEqual(evaluateBadge(badge('first_live'), ctx({ total_live_on_time: 1 })), { earned: true, progress: { current: 1, target: 1 } })
    assert.deepEqual(evaluateBadge(badge('first_live'), ctx({ total_live_on_time: 7 })), { earned: true, progress: { current: 1, target: 1 } })
  })

  test('ignores its params', () => {
    assert.equal(evaluateBadge(badge('first_live', { n: 5 }), ctx({ total_live_on_time: 1 })).earned, true)
  })
})

describe('live_count', () => {
  const live10 = badge('live_count', { n: 10 })

  test('counts lives on time up to n', () => {
    assert.deepEqual(evaluateBadge(live10, ctx()), { earned: false, progress: { current: 0, target: 10 } })
    assert.deepEqual(evaluateBadge(live10, ctx({ total_live_on_time: 9 })), { earned: false, progress: { current: 9, target: 10 } })
    assert.deepEqual(evaluateBadge(live10, ctx({ total_live_on_time: 10 })), { earned: true, progress: { current: 10, target: 10 } })
    assert.deepEqual(evaluateBadge(live10, ctx({ total_live_on_time: 15 })), { earned: true, progress: { current: 10, target: 10 } })
  })

  test('does not count the run or the points', () => {
    assert.equal(evaluateBadge(live10, ctx({ run: 10, best_run: 10, points: 500 })).earned, false)
  })
})

describe('streak_reached', () => {
  const streak4 = badge('streak_reached', { n: 4 })

  test('earned when the best run reaches n', () => {
    assert.deepEqual(evaluateBadge(streak4, ctx({ best_run: 3, run: 3 })), { earned: false, progress: { current: 3, target: 4 } })
    assert.deepEqual(evaluateBadge(streak4, ctx({ best_run: 4, run: 4 })), { earned: true, progress: { current: 4, target: 4 } })
    assert.deepEqual(evaluateBadge(streak4, ctx({ best_run: 9, run: 9 })), { earned: true, progress: { current: 4, target: 4 } })
  })

  test('uses best_run, not the current run, so a broken run keeps its progress', () => {
    assert.deepEqual(evaluateBadge(streak4, ctx({ best_run: 4, run: 0 })), { earned: true, progress: { current: 4, target: 4 } })
    assert.deepEqual(evaluateBadge(badge('streak_reached', { n: 10 }), ctx({ best_run: 6, run: 1 })), { earned: false, progress: { current: 6, target: 10 } })
    assert.equal(evaluateBadge(streak4, ctx({ best_run: 2, run: 4 })).earned, false)
  })
})

describe('points_reached', () => {
  const points100 = badge('points_reached', { n: 100 })

  test('earned at n points', () => {
    assert.deepEqual(evaluateBadge(points100, ctx({ points: 0 })), { earned: false, progress: { current: 0, target: 100 } })
    assert.deepEqual(evaluateBadge(points100, ctx({ points: 99 })), { earned: false, progress: { current: 99, target: 100 } })
    assert.deepEqual(evaluateBadge(points100, ctx({ points: 100 })), { earned: true, progress: { current: 100, target: 100 } })
    assert.deepEqual(evaluateBadge(points100, ctx({ points: 250 })), { earned: true, progress: { current: 100, target: 100 } })
  })
})

describe('rules with n: a bad n is never earned', () => {
  test('missing, zero, negative, fractional or text n', () => {
    for (const type of ['live_count', 'streak_reached', 'points_reached']) {
      for (const params of [{}, { n: 0 }, { n: -3 }, { n: 2.5 }, { n: '4' }, { n: null }]) {
        const result = evaluateBadge(badge(type, params), ctx({ total_live_on_time: 50, best_run: 50, points: 5000 }))
        assert.deepEqual(result, NOT_EARNED, `${type} ${JSON.stringify(params)}`)
      }
    }
  })
})

describe('complete_playlist: BRONZE', () => {
  test('earned when every lesson is marked, of any kind', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE'), one(playlist(0, 4, 0))), { earned: false, progress: { current: 0, target: 4 } })
    assert.deepEqual(evaluateBadge(complete('BRONZE'), one(playlist(3, 4, 3))), { earned: false, progress: { current: 3, target: 4 } })
    assert.deepEqual(evaluateBadge(complete('BRONZE'), one(playlist(4, 4, 0))), { earned: true, progress: { current: 4, target: 4 } })
  })
})

describe('complete_playlist: SILVER', () => {
  test('total 4: needs all 4 marked and 3 lives on time', () => {
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(4, 4, 2))), { earned: false, progress: { current: 2, target: 3 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(4, 4, 3))), { earned: true, progress: { current: 3, target: 3 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(4, 4, 4))), { earned: true, progress: { current: 3, target: 3 } })
  })

  test('total 5: needs 3 lives on time', () => {
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(5, 5, 2))), { earned: false, progress: { current: 2, target: 3 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(5, 5, 3))), { earned: true, progress: { current: 3, target: 3 } })
  })

  test('total 1 and 2: more than half means all of them', () => {
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(1, 1, 0))), { earned: false, progress: { current: 0, target: 1 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(1, 1, 1))), { earned: true, progress: { current: 1, target: 1 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(2, 2, 1))), { earned: false, progress: { current: 1, target: 2 } })
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(2, 2, 2))), { earned: true, progress: { current: 2, target: 2 } })
  })

  test('enough lives on time but a lesson still unmarked: not earned yet', () => {
    assert.deepEqual(evaluateBadge(complete('SILVER'), one(playlist(3, 4, 3))), { earned: false, progress: { current: 3, target: 3 } })
  })
})

describe('complete_playlist: GOLD', () => {
  test('earned when every lesson is LIVE on time', () => {
    assert.deepEqual(evaluateBadge(complete('GOLD'), one(playlist(4, 4, 3))), { earned: false, progress: { current: 3, target: 4 } })
    assert.deepEqual(evaluateBadge(complete('GOLD'), one(playlist(4, 4, 4))), { earned: true, progress: { current: 4, target: 4 } })
    assert.deepEqual(evaluateBadge(complete('GOLD'), one(playlist(1, 1, 1))), { earned: true, progress: { current: 1, target: 1 } })
  })
})

describe('complete_playlist: which playlist', () => {
  const many = ctx({
    playlist_progress: {
      a: playlist(1, 4, 1),
      b: playlist(3, 4, 2),
      c: playlist(2, 2, 2),
      empty: playlist(0, 0, 0),
    },
  })

  test('only looks at the named playlist', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE', 'a'), many), { earned: false, progress: { current: 1, target: 4 } })
    assert.deepEqual(evaluateBadge(complete('GOLD', 'c'), many), { earned: true, progress: { current: 2, target: 2 } })
  })

  test('a missing playlist is not earned and has no progress', () => {
    for (const tier of ['BRONZE', 'SILVER', 'GOLD']) assert.deepEqual(evaluateBadge(complete(tier, 'gone'), many), NOT_EARNED)
  })

  test('a playlist without lessons is not earned and has no progress', () => {
    for (const tier of ['BRONZE', 'SILVER', 'GOLD']) assert.deepEqual(evaluateBadge(complete(tier, 'empty'), many), NOT_EARNED)
  })

  test('playlist_id null: earned when any playlist qualifies, progress of the earned one', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE', null), many), { earned: true, progress: { current: 2, target: 2 } })
    assert.deepEqual(evaluateBadge(complete('GOLD', null), many), { earned: true, progress: { current: 2, target: 2 } })
  })

  test('playlist_id null and none qualifies: progress of the one closest by ratio', () => {
    const none = ctx({ playlist_progress: { a: playlist(1, 4, 1), b: playlist(3, 4, 2), big: playlist(5, 10, 5), empty: playlist(0, 0, 0) } })
    // BRONZE: a 1/4, b 3/4, big 5/10 -> b.
    assert.deepEqual(evaluateBadge(complete('BRONZE', null), none), { earned: false, progress: { current: 3, target: 4 } })
    // GOLD: a 1/4, b 2/4, big 5/10 -> b and big tie at a half; the first by id (b) wins.
    assert.deepEqual(evaluateBadge(complete('GOLD', null), none), { earned: false, progress: { current: 2, target: 4 } })
    // SILVER: a 1/3, b 2/3, big 5/6 -> big.
    assert.deepEqual(evaluateBadge(complete('SILVER', null), none), { earned: false, progress: { current: 5, target: 6 } })
  })

  test('playlist_id null prefers a playlist that earned it over a full bar that did not', () => {
    // a has every live it needs (4 of 4) but a lesson unmarked; b actually earned silver (3 of 3).
    const both = ctx({ playlist_progress: { a: playlist(5, 6, 4), b: playlist(5, 5, 3) } })
    assert.deepEqual(evaluateBadge(complete('SILVER', null), both), { earned: true, progress: { current: 3, target: 3 } })
    assert.deepEqual(evaluateBadge(complete('SILVER', 'a'), both), { earned: false, progress: { current: 4, target: 4 } })
  })

  test('playlist_id left out means any playlist too', () => {
    assert.deepEqual(evaluateBadge(badge('complete_playlist', { tier: 'GOLD' }), many), { earned: true, progress: { current: 2, target: 2 } })
  })

  test('playlist_id null with no playlists with lessons: not earned, no progress', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE', null), ctx()), NOT_EARNED)
    assert.deepEqual(evaluateBadge(complete('BRONZE', null), ctx({ playlist_progress: { empty: playlist(0, 0, 0) } })), NOT_EARNED)
  })

  test('a playlist_id that is not text, or a missing or unknown tier, is never earned', () => {
    assert.deepEqual(evaluateBadge(badge('complete_playlist', { playlist_id: 1, tier: 'BRONZE' }), many), NOT_EARNED)
    assert.deepEqual(evaluateBadge(badge('complete_playlist', { playlist_id: 'c' }), many), NOT_EARNED)
    assert.deepEqual(evaluateBadge(badge('complete_playlist', { playlist_id: 'c', tier: 'gold' }), many), NOT_EARNED)
    assert.deepEqual(evaluateBadge(badge('complete_playlist', { playlist_id: 'c', tier: 'PLATINUM' }), many), NOT_EARNED)
  })

  test('playlist ids that look like object keys are not found by accident', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE', 'toString'), many), NOT_EARNED)
    assert.deepEqual(evaluateBadge(complete('BRONZE', '__proto__'), many), NOT_EARNED)
  })
})

describe('evaluateBadge: params and bad rows', () => {
  test('params as JSON text or as an object give the same result', () => {
    const context = one(playlist(4, 4, 3))
    for (const params of [{ playlist_id: 'p1', tier: 'SILVER' }, { n: 4 }]) {
      for (const type of ['complete_playlist', 'streak_reached']) {
        const fromText = evaluateBadge(badge(type, JSON.stringify(params)), { ...context, best_run: 4 })
        const fromObject = evaluateBadge(badge(type, params), { ...context, best_run: 4 })
        assert.deepEqual(fromText, fromObject)
      }
    }
    assert.deepEqual(evaluateBadge(badge('streak_reached', '{"n":4}'), ctx({ best_run: 4 })), { earned: true, progress: { current: 4, target: 4 } })
    assert.deepEqual(evaluateBadge(badge('first_live', '{}'), ctx({ total_live_on_time: 1 })), { earned: true, progress: { current: 1, target: 1 } })
  })

  test('an unknown rule type is not earned', () => {
    const rich = ctx({ total_live_on_time: 99, best_run: 99, points: 9999 })
    for (const type of ['quran_memorized', 'FIRST_LIVE', '', 'toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      assert.deepEqual(evaluateBadge(badge(type, {}), rich), NOT_EARNED, type)
    }
  })

  test('rule_params that are not a JSON object are not earned', () => {
    const rich = ctx({ total_live_on_time: 99, best_run: 99, points: 9999 })
    for (const params of ['{n:4}', '', 'not json', '[4]', 'null', '4', '"x"', null, 4, [4]]) {
      assert.deepEqual(evaluateBadge(badge('first_live', params), rich), NOT_EARNED, JSON.stringify(params))
    }
  })

  test('never throws, even on a broken context', () => {
    assert.deepEqual(evaluateBadge(complete('BRONZE', null), { ...ctx(), playlist_progress: null }), NOT_EARNED)
    assert.deepEqual(evaluateBadge(complete('BRONZE', 'p1'), { ...ctx(), playlist_progress: { p1: null } }), NOT_EARNED)
  })
})

describe('parseRuleParams', () => {
  test('reads JSON objects and passes objects through', () => {
    assert.deepEqual(parseRuleParams('{"n":4}'), { n: 4 })
    assert.deepEqual(parseRuleParams({ tier: 'GOLD' }), { tier: 'GOLD' })
    assert.deepEqual(parseRuleParams('{}'), {})
  })

  test('anything else is null', () => {
    for (const value of ['', '{', '[]', 'null', '1', null, undefined, 1, [], true]) assert.equal(parseRuleParams(value), null, JSON.stringify(value))
  })
})

describe('with a real Progress from computeProgress', () => {
  const DAY = 24 * 60 * 60 * 1000
  const at = (days) => new Date(Date.parse('2026-01-01T00:00:00.000Z') + days * DAY).toISOString()
  const lesson = (id, until) => ({ id, playlist_id: 'p1', attend_from: at(until - 7), attend_until: at(until) })
  const mark = (id, kind, day) => ({ video_id: id, kind, marked_at: at(day) })

  test('four lessons: 3 LIVE on time and 1 recorded in time give bronze and silver, not gold', () => {
    const progress = computeProgress({
      lessons: [lesson('a', 1), lesson('b', 2), lesson('c', 3), lesson('d', 4)],
      marks: [mark('a', 'LIVE', 0), mark('b', 'LIVE', 1), mark('c', 'RECORDED', 2), mark('d', 'LIVE', 3)],
      userCreatedAt: at(-30),
      now: at(30),
    })
    assert.equal(evaluateBadge(complete('BRONZE'), progress).earned, true)
    assert.equal(evaluateBadge(complete('SILVER'), progress).earned, true)
    assert.deepEqual(evaluateBadge(complete('GOLD'), progress), { earned: false, progress: { current: 3, target: 4 } })
    assert.equal(evaluateBadge(badge('first_live'), progress).earned, true)
    assert.deepEqual(evaluateBadge(badge('streak_reached', { n: 4 }), progress), { earned: false, progress: { current: 3, target: 4 } })
  })

  test('late LIVE marks complete the playlist but count for neither silver nor gold', () => {
    const progress = computeProgress({
      lessons: [lesson('a', 1), lesson('b', 2)],
      marks: [mark('a', 'LIVE', 5), mark('b', 'LIVE', 6)],
      userCreatedAt: at(-30),
      now: at(30),
    })
    assert.equal(evaluateBadge(complete('BRONZE'), progress).earned, true)
    assert.deepEqual(evaluateBadge(complete('SILVER'), progress), { earned: false, progress: { current: 0, target: 2 } })
    assert.equal(evaluateBadge(complete('GOLD'), progress).earned, false)
    assert.equal(evaluateBadge(badge('first_live'), progress).earned, false)
  })
})
