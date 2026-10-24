// Unit tests for the streak and points rules: npm test (Node strips the types from progress.ts).
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { RULES, computeProgress, diffEvents } from '../src/lib/progress.ts'

const BASE = Date.parse('2026-01-01T00:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const at = (days) => new Date(BASE + days * DAY).toISOString()

// A lesson in the streak whose window closes on day `until` (it opens a week earlier).
const lesson = (id, until, playlist = 'p1') => ({ id, playlist_id: playlist, attend_from: at(until - 7), attend_until: at(until) })
// A lesson outside the streak.
const freeLesson = (id, playlist = 'p1') => ({ id, playlist_id: playlist, attend_from: null, attend_until: null })
const live = (id, day) => ({ video_id: id, kind: 'LIVE', marked_at: at(day) })
const recorded = (id, day) => ({ video_id: id, kind: 'RECORDED', marked_at: at(day) })

// By default the student registered long before every lesson and every window has closed.
function progress({ lessons, marks = [], created = at(-365), now = at(365) }) {
  return computeProgress({ lessons, marks, userCreatedAt: created, now })
}

// n lessons closing on days start, start + 1, ...; each marked LIVE a day before it closes.
function liveSeries(n, start = 1, prefix = 'l') {
  const lessons = []
  const marks = []
  for (let i = 0; i < n; i++) {
    const id = `${prefix}${String(i).padStart(2, '0')}`
    lessons.push(lesson(id, start + i))
    marks.push(live(id, start + i - 1))
  }
  return { lessons, marks }
}

const EMPTY = {
  run: 0,
  best_run: 0,
  multiplier: 1,
  freezes: 0,
  points: 0,
  lives_to_next_freeze: 4,
  lives_to_max_multiplier: 5,
  total_live_on_time: 0,
  playlist_progress: {},
}

describe('RULES', () => {
  test('has the agreed numbers', () => {
    assert.deepEqual({ ...RULES }, {
      BASE_POINTS: 10,
      MULTIPLIER_STEP: 0.1,
      MAX_LEVEL: 5,
      LIVES_PER_FREEZE: 4,
      MAX_FREEZES: 2,
      LATE_POINTS: 5,
      DEFAULT_WINDOW_DAYS: 7,
    })
  })
})

describe('computeProgress: starting point', () => {
  test('no lessons and no marks', () => {
    assert.deepEqual(progress({ lessons: [] }), EMPTY)
  })

  test('closed lessons before any mark reset nothing and earn nothing', () => {
    const result = progress({ lessons: [lesson('a', 1), lesson('b', 2)] })
    assert.deepEqual({ ...result, playlist_progress: {} }, EMPTY)
  })

  test('does not change its input', () => {
    const lessons = [lesson('b', 2), lesson('a', 1)]
    const marks = [live('a', 0), recorded('b', 1)]
    const copy = structuredClone({ lessons, marks })
    progress({ lessons, marks })
    assert.deepEqual({ lessons, marks }, copy)
  })
})

describe('computeProgress: lessons without a window', () => {
  test('a LIVE mark earns the base points but no run and no live count', () => {
    const result = progress({ lessons: [freeLesson('f')], marks: [live('f', 0)] })
    assert.equal(result.points, 10)
    assert.equal(result.run, 0)
    assert.equal(result.best_run, 0)
    assert.equal(result.total_live_on_time, 0)
  })

  test('a RECORDED mark earns the base points', () => {
    const result = progress({ lessons: [freeLesson('f')], marks: [recorded('f', 400)] })
    assert.equal(result.points, 10)
    assert.equal(result.run, 0)
  })

  test('never touch the run or the shields, marked or not', () => {
    const series = liveSeries(4)
    const result = progress({
      lessons: [...series.lessons, freeLesson('f1'), freeLesson('f2')],
      marks: [...series.marks, live('f1', 2)],
    })
    assert.equal(result.run, 4)
    assert.equal(result.freezes, 1)
    assert.equal(result.total_live_on_time, 4)
    assert.equal(result.points, 10 + 11 + 12 + 13 + 10)
  })
})

describe('computeProgress: LIVE on time', () => {
  test('points grow with the run and the multiplier caps at level 5', () => {
    const expected = [
      { points: 10, multiplier: 1.1, lives_to_max_multiplier: 4 },
      { points: 21, multiplier: 1.2, lives_to_max_multiplier: 3 },
      { points: 33, multiplier: 1.3, lives_to_max_multiplier: 2 },
      { points: 46, multiplier: 1.4, lives_to_max_multiplier: 1 },
      { points: 60, multiplier: 1.5, lives_to_max_multiplier: 0 },
      { points: 75, multiplier: 1.5, lives_to_max_multiplier: 0 },
      { points: 90, multiplier: 1.5, lives_to_max_multiplier: 0 },
    ]
    expected.forEach((want, index) => {
      const n = index + 1
      const result = progress(liveSeries(n))
      assert.equal(result.points, want.points, `points after ${n}`)
      assert.equal(result.multiplier, want.multiplier, `multiplier after ${n}`)
      assert.equal(result.lives_to_max_multiplier, want.lives_to_max_multiplier, `lives_to_max_multiplier after ${n}`)
      assert.equal(result.run, n)
      assert.equal(result.best_run, n)
      assert.equal(result.total_live_on_time, n)
    })
  })

  test('a mark exactly at the end of the window is on time', () => {
    const result = progress({ lessons: [lesson('a', 1)], marks: [live('a', 1)] })
    assert.equal(result.run, 1)
    assert.equal(result.points, 10)
  })

  test('times are compared as instants, not as raw text', () => {
    // Closes at 00:00Z written with a +02:00 offset; a mark at 01:00Z is late even though its text sorts first.
    const lessons = [{ id: 'a', playlist_id: 'p1', attend_from: '2026-01-01T02:00:00+02:00', attend_until: '2026-01-05T02:00:00+02:00' }]
    const late = progress({ lessons, marks: [{ video_id: 'a', kind: 'LIVE', marked_at: '2026-01-05T01:00:00.000Z' }] })
    assert.equal(late.run, 0)
    assert.equal(late.points, 5)
    // 23:30Z written as 01:30+02:00: on time even though its text sorts after the deadline.
    const onTime = progress({ lessons, marks: [{ video_id: 'a', kind: 'LIVE', marked_at: '2026-01-05T01:30:00+02:00' }] })
    assert.equal(onTime.run, 1)
    assert.equal(onTime.points, 10)
  })

  test('now and the registration time are compared as instants too', () => {
    const series = liveSeries(2)
    const lessons = [...series.lessons, { id: 'z', playlist_id: 'p1', attend_from: at(4), attend_until: '2026-01-12T00:00:00.000Z' }]
    // 23:00Z on the 11th: the window is still open, so no miss.
    assert.equal(progress({ lessons, marks: series.marks, now: '2026-01-12T01:00:00+02:00' }).run, 2)
    // Registered at 23:00Z on the 11th, before the window closed: a real miss.
    assert.equal(progress({ lessons, marks: series.marks, created: '2026-01-12T01:00:00+02:00' }).run, 0)
  })
})

describe('computeProgress: shields (freezes)', () => {
  test('earned at 4 and 8 lives in a row, capped at 2', () => {
    const freezes = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2]
    const nextFreeze = [3, 2, 1, 4, 3, 2, 1, null, null, null, null, null]
    for (let n = 1; n <= 12; n++) {
      const result = progress(liveSeries(n))
      assert.equal(result.freezes, freezes[n - 1], `freezes after ${n}`)
      assert.equal(result.lives_to_next_freeze, nextFreeze[n - 1], `lives_to_next_freeze after ${n}`)
    }
  })

  test('a miss uses a shield instead of resetting the run', () => {
    const series = liveSeries(4)
    const missed = progress({ lessons: [...series.lessons, lesson('miss', 10)], marks: series.marks })
    assert.equal(missed.run, 4)
    assert.equal(missed.freezes, 0)
    assert.equal(missed.points, 46)
    assert.equal(missed.lives_to_next_freeze, 4)

    const next = progress({ lessons: [...series.lessons, lesson('miss', 10), lesson('next', 11)], marks: [...series.marks, live('next', 10)] })
    assert.equal(next.run, 5)
    assert.equal(next.best_run, 5)
    assert.equal(next.points, 46 + 14)
    assert.equal(next.lives_to_next_freeze, 3)
  })

  test('two shields absorb two misses, the third miss resets', () => {
    const series = liveSeries(8)
    const lessons = [...series.lessons, lesson('m1', 20), lesson('m2', 21)]
    const two = progress({ lessons, marks: series.marks })
    assert.equal(two.run, 8)
    assert.equal(two.freezes, 0)

    const three = progress({ lessons: [...lessons, lesson('m3', 22)], marks: series.marks })
    assert.equal(three.run, 0)
    assert.equal(three.best_run, 8)
    assert.equal(three.freezes, 0)
  })

  test('a used shield can be earned again', () => {
    const first = liveSeries(4, 1, 'a')
    const second = liveSeries(4, 20, 'b')
    const result = progress({ lessons: [...first.lessons, lesson('miss', 10), ...second.lessons], marks: [...first.marks, ...second.marks] })
    assert.equal(result.run, 8)
    assert.equal(result.freezes, 1)
    assert.equal(result.points, 10 + 11 + 12 + 13 + 14 + 15 + 15 + 15)
    assert.equal(result.lives_to_next_freeze, 4)
  })
})

describe('computeProgress: misses without a shield', () => {
  test('reset the run but keep the earned points and the best run', () => {
    const series = liveSeries(3)
    const reset = progress({ lessons: [...series.lessons, lesson('miss', 10)], marks: series.marks })
    assert.equal(reset.run, 0)
    assert.equal(reset.best_run, 3)
    assert.equal(reset.freezes, 0)
    assert.equal(reset.multiplier, 1)
    assert.equal(reset.points, 33)
    assert.equal(reset.lives_to_max_multiplier, 5)

    const again = liveSeries(2, 20, 'r')
    const after = progress({ lessons: [...series.lessons, lesson('miss', 10), ...again.lessons], marks: [...series.marks, ...again.marks] })
    assert.equal(after.run, 2)
    assert.equal(after.best_run, 3)
    assert.equal(after.points, 33 + 10 + 11)
  })
})

describe('computeProgress: RECORDED on time', () => {
  test('earns the base points and keeps the run without growing it', () => {
    const lessons = [lesson('a', 1), lesson('b', 2), lesson('c', 3), lesson('d', 4)]
    const marks = [live('a', 0), live('b', 1), recorded('c', 2), live('d', 3)]
    const result = progress({ lessons, marks })
    assert.equal(result.run, 3)
    assert.equal(result.best_run, 3)
    assert.equal(result.total_live_on_time, 3)
    assert.equal(result.points, 10 + 11 + 10 + 12)
    assert.equal(result.freezes, 0)
  })
})

describe('computeProgress: late marks', () => {
  test('a late mark earns 5 points and still counts as a miss', () => {
    const lessons = [lesson('a', 1), lesson('b', 2), lesson('c', 3)]
    const result = progress({ lessons, marks: [live('a', 0), live('b', 1), recorded('c', 4)] })
    assert.equal(result.points, 10 + 11 + 5)
    assert.equal(result.run, 0)
    assert.equal(result.best_run, 2)
  })

  test('a late mark uses a shield like any miss', () => {
    const series = liveSeries(4)
    const result = progress({ lessons: [...series.lessons, lesson('late', 10)], marks: [...series.marks, recorded('late', 11)] })
    assert.equal(result.points, 46 + 5)
    assert.equal(result.run, 4)
    assert.equal(result.freezes, 0)
  })

  test('a late LIVE mark is not a live on time', () => {
    const lessons = [lesson('a', 1), lesson('b', 2)]
    const result = progress({ lessons, marks: [live('a', 0), live('b', 3)] })
    assert.equal(result.points, 10 + 5)
    assert.equal(result.run, 0)
    assert.equal(result.total_live_on_time, 1)
  })
})

describe('computeProgress: pending lessons', () => {
  test('an open window without a mark changes nothing', () => {
    const series = liveSeries(2)
    const result = progress({ lessons: [...series.lessons, lesson('open', 12)], marks: series.marks, now: at(10) })
    assert.equal(result.run, 2)
    assert.equal(result.points, 21)
    assert.deepEqual(result.playlist_progress, { p1: { marked: 2, total: 3, live_on_time: 2 } })
  })

  test('an open window with an on-time mark counts right away', () => {
    const series = liveSeries(2)
    const result = progress({ lessons: [...series.lessons, lesson('open', 12)], marks: [...series.marks, live('open', 9)], now: at(10) })
    assert.equal(result.run, 3)
    assert.equal(result.points, 33)
  })

  test('a window that closes exactly now is a miss', () => {
    const series = liveSeries(2)
    const result = progress({ lessons: [...series.lessons, lesson('closing', 10)], marks: series.marks, now: at(10) })
    assert.equal(result.run, 0)
  })
})

describe('computeProgress: lessons that ended before the student registered', () => {
  test('are not misses', () => {
    const lessons = [lesson('a', 3), lesson('b', 5)]
    const marks = [live('a', 2)]
    assert.equal(progress({ lessons, marks, created: at(6) }).run, 1)
    // Ending at the very moment of registration is still before the student existed.
    assert.equal(progress({ lessons, marks, created: at(5) }).run, 1)
    // Registered while it was open: a real miss.
    assert.equal(progress({ lessons, marks, created: at(4) }).run, 0)
  })

  test('a late catch-up on them earns 5 points without being a miss', () => {
    const lessons = [lesson('a', 3), lesson('b', 5)]
    const result = progress({ lessons, marks: [live('a', 2), recorded('b', 11)], created: at(10) })
    assert.equal(result.points, 10 + 5)
    assert.equal(result.run, 1)
  })
})

describe('computeProgress: order of lessons', () => {
  test('follows attend_until, not the input order', () => {
    // Sorted: b (day 1) live, c (day 2) missed, a (day 3) live.
    const result = progress({ lessons: [lesson('a', 3), lesson('b', 1), lesson('c', 2)], marks: [live('b', 0), live('a', 2)] })
    assert.equal(result.run, 1)
    assert.equal(result.best_run, 1)
    assert.equal(result.points, 20)
  })

  test('breaks ties on attend_until by id', () => {
    // Sorted: w (day 4) live, x (day 5) missed, y (day 5) live.
    const result = progress({ lessons: [lesson('y', 5), lesson('x', 5), lesson('w', 4)], marks: [live('y', 4), live('w', 3)] })
    assert.equal(result.run, 1)
    assert.equal(result.points, 20)
  })
})

describe('computeProgress: playlist_progress', () => {
  test('counts marked lessons of any kind against all lessons, per playlist', () => {
    const lessons = [freeLesson('f', 'p1'), lesson('late', 3, 'p1'), lesson('none', 4, 'p1'), lesson('x', 5, 'p2'), freeLesson('y', 'p2')]
    // A mark on a lesson that isn't listed (hidden, quiz or deleted) is ignored.
    const marks = [recorded('f', 1), recorded('late', 9), live('ghost', 1)]
    const result = progress({ lessons, marks })
    assert.deepEqual(result.playlist_progress, { p1: { marked: 2, total: 3, live_on_time: 0 }, p2: { marked: 0, total: 2, live_on_time: 0 } })
    assert.equal(result.points, 10 + 5)
    assert.equal(result.total_live_on_time, 0)
  })

  test('live_on_time counts LIVE marks in time, including LIVE on lessons without a window', () => {
    const lessons = [
      lesson('on', 2, 'p1'),
      lesson('edge', 3, 'p1'),
      lesson('late', 4, 'p1'),
      lesson('rec', 5, 'p1'),
      freeLesson('free', 'p1'),
      freeLesson('freeRec', 'p2'),
      lesson('open', 12, 'p2'),
    ]
    const marks = [live('on', 1), live('edge', 3), live('late', 5), recorded('rec', 4), live('free', 400), recorded('freeRec', 1), live('open', 9)]
    const result = progress({ lessons, marks, now: at(10) })
    assert.deepEqual(result.playlist_progress, { p1: { marked: 5, total: 5, live_on_time: 3 }, p2: { marked: 2, total: 2, live_on_time: 1 } })
    // The streak count still leaves out the lesson without a window.
    assert.equal(result.total_live_on_time, 3)
  })

  test('a playlist attended fully LIVE on time has live_on_time equal to total', () => {
    const result = progress(liveSeries(6))
    assert.deepEqual(result.playlist_progress, { p1: { marked: 6, total: 6, live_on_time: 6 } })
  })
})

describe('diffEvents', () => {
  const state = (overrides) => ({ ...EMPTY, ...overrides })
  const types = (events) => events.map((event) => event.type)

  test('first live on time: FIRST_LIVE then RUN_UP', () => {
    const events = diffEvents(EMPTY, state({ run: 1, total_live_on_time: 1 }), { kind: 'LIVE', on_time: true })
    assert.deepEqual(events, [{ type: 'FIRST_LIVE' }, { type: 'RUN_UP', from: 0, to: 1 }])
  })

  test('FIRST_LIVE only when there was no live on time before', () => {
    const events = diffEvents(state({ run: 1, total_live_on_time: 1 }), state({ run: 2, total_live_on_time: 2 }), { kind: 'LIVE', on_time: true })
    assert.deepEqual(events, [{ type: 'RUN_UP', from: 1, to: 2 }])
  })

  test('MAX_MULTIPLIER when the run reaches level 5', () => {
    const events = diffEvents(state({ run: 4, total_live_on_time: 4, freezes: 1 }), state({ run: 5, total_live_on_time: 5, freezes: 1 }), { kind: 'LIVE', on_time: true })
    assert.deepEqual(events, [{ type: 'RUN_UP', from: 4, to: 5 }, { type: 'MAX_MULTIPLIER' }])
  })

  test('no MAX_MULTIPLIER once already there', () => {
    const events = diffEvents(state({ run: 5, total_live_on_time: 5 }), state({ run: 6, total_live_on_time: 6 }), { kind: 'LIVE', on_time: true })
    assert.deepEqual(types(events), ['RUN_UP'])
  })

  test('FREEZE_EARNED carries the new shield count', () => {
    const events = diffEvents(state({ run: 7, total_live_on_time: 7, freezes: 1 }), state({ run: 8, total_live_on_time: 8, freezes: 2 }), { kind: 'LIVE', on_time: true })
    assert.deepEqual(events, [{ type: 'RUN_UP', from: 7, to: 8 }, { type: 'FREEZE_EARNED', freezes: 2 }])
  })

  test('no FREEZE_EARNED when shields stay the same or drop', () => {
    assert.deepEqual(diffEvents(state({ freezes: 2 }), state({ freezes: 2 }), { kind: 'LIVE', on_time: true }), [])
    assert.deepEqual(diffEvents(state({ freezes: 2 }), state({ freezes: 1 }), { kind: 'LIVE', on_time: true }), [])
  })

  test('RECORDED on time: RECORDED_SAVED', () => {
    const before = state({ run: 3, total_live_on_time: 3 })
    assert.deepEqual(diffEvents(before, before, { kind: 'RECORDED', on_time: true }), [{ type: 'RECORDED_SAVED' }])
  })

  test('late: LATE_CATCH_UP and never RECORDED_SAVED', () => {
    assert.deepEqual(diffEvents(EMPTY, EMPTY, { kind: 'RECORDED', on_time: false }), [{ type: 'LATE_CATCH_UP' }])
    assert.deepEqual(diffEvents(EMPTY, EMPTY, { kind: 'LIVE', on_time: false }), [{ type: 'LATE_CATCH_UP' }])
  })

  test('nothing new: no events', () => {
    const same = state({ run: 2, total_live_on_time: 2 })
    assert.deepEqual(diffEvents(same, same, { kind: 'LIVE', on_time: true }), [])
  })

  test('a shorter run is not RUN_UP', () => {
    const events = diffEvents(state({ run: 3, total_live_on_time: 3 }), state({ run: 2, total_live_on_time: 2 }), { kind: 'RECORDED', on_time: true })
    assert.deepEqual(events, [{ type: 'RECORDED_SAVED' }])
  })

  test('all at once, in the agreed order', () => {
    const before = state({ run: 3 })
    const after = state({ run: 5, total_live_on_time: 2, freezes: 1 })
    assert.deepEqual(types(diffEvents(before, after, { kind: 'LIVE', on_time: false })), ['FIRST_LIVE', 'RUN_UP', 'MAX_MULTIPLIER', 'FREEZE_EARNED', 'LATE_CATCH_UP'])
    assert.deepEqual(types(diffEvents(before, after, { kind: 'RECORDED', on_time: true })), ['FIRST_LIVE', 'RUN_UP', 'MAX_MULTIPLIER', 'FREEZE_EARNED', 'RECORDED_SAVED'])
  })

  test('works on real progress before and after a mark', () => {
    // Day 3: the fourth lesson's window is still open, so before the mark it is pending, not a miss.
    const series = liveSeries(4)
    const before = progress({ lessons: series.lessons, marks: series.marks.slice(0, 3), now: at(3) })
    const after = progress({ ...series, now: at(3) })
    assert.deepEqual(diffEvents(before, after, { kind: 'LIVE', on_time: true }), [{ type: 'RUN_UP', from: 3, to: 4 }, { type: 'FREEZE_EARNED', freezes: 1 }])
    assert.equal(after.points - before.points, 13)
  })
})
