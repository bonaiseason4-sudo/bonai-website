import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { isOnTime } from '../lib/attendance'
import { plusPoints } from '../lib/progressText'
import { getPlaylistAttendance, markAttendance, progressErrorMessage, unmarkAttendance } from '../services/progressService'
import type { Video } from '../types/content'
import type { Attendance, AttendanceKind, MarkAttendanceResult, ProgressEvent } from '../types/progress'
import { useAuth } from './useAuth'
import { useCelebrations } from './useCelebrations'
import { useProgress } from './useProgress'
import { useToast } from './useToast'

type Marks = Record<string, Attendance>

const points = (count: number, unit: string) => (count > 0 ? `${plusPoints(count)} ${unit}، ` : '')

// The student's marks for one playlist, with optimistic marking and the toast or celebrations that follow.
export function useAttendance(playlistId: string) {
  const { user, loading: authLoading, available } = useAuth()
  const { applyProgress, refresh } = useProgress()
  const { celebrateStreak, celebrateBadges } = useCelebrations()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = available ? user?.id ?? null : null
  // Marks are tagged with the user and playlist they belong to, so switching either never shows stale ones.
  const key = userId ? `${userId}:${playlistId}` : ''
  const [store, setStore] = useState<{ key: string; marks: Marks; loaded: boolean }>({ key: '', marks: {}, loaded: false })
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  // Marks on different lessons can be in flight together, and the server may count them in either order.
  const writes = useRef({ inFlight: 0, overlapped: false })
  const current = store.key === key ? store : { key, marks: {} as Marks, loaded: !userId }

  useEffect(() => {
    if (!userId) return
    let active = true
    getPlaylistAttendance(playlistId)
      .then((list) => { if (active) setStore({ key, marks: Object.fromEntries(list.map((mark) => [mark.video_id, mark])), loaded: true }) })
      // Without the list the buttons still work; the API refuses anything that is not allowed.
      .catch(() => { if (active) setStore((state) => (state.key === key ? { ...state, loaded: true } : { key, marks: {}, loaded: true })) })
    return () => { active = false }
  }, [userId, playlistId, key, version])

  function setMark(videoId: string, mark: Attendance | null) {
    setStore((state) => {
      if (state.key !== key) return state
      const marks = { ...state.marks }
      if (mark) marks[videoId] = mark
      else delete marks[videoId]
      return { ...state, marks }
    })
  }

  function setBusy(videoId: string, busy: boolean) {
    setPending((state) => ({ ...state, [videoId]: busy }))
  }

  function announce(result: MarkAttendanceResult) {
    const has = (type: ProgressEvent['type']) => result.events.some((event) => event.type === type)
    const shield = has('FREEZE_EARNED') ? ' وكسبت درع 🛡️' : ''
    const gained = result.points_gained
    if (result.attendance.kind === 'LIVE' && has('RUN_UP')) celebrateStreak(result)
    else if (has('LATE_CATCH_UP')) showToast(`${points(gained, 'نقط')}استدراك جميل${shield}`)
    else if (has('RECORDED_SAVED')) showToast(`${points(gained, 'نقط')}شعلتك محفوظة 🔥 ${result.progress.run}${shield}`)
    else showToast(gained > 0 ? `${plusPoints(gained)} نقطة${shield}` : 'تم تسجيل حضورك')
    // Queued after the streak celebration, so they show once it closes.
    celebrateBadges(result.events.flatMap((event) => (event.type === 'BADGE_EARNED' ? [event.badge] : [])))
  }

  async function choose(video: Video, kind: AttendanceKind) {
    if (authLoading) return
    if (!userId) {
      // Back to this lesson after logging in, even when it was pressed in the list and not open yet.
      const params = new URLSearchParams(location.search)
      params.set('lesson', video.id)
      navigate('/login', { state: { from: `${location.pathname}?${params}` } })
      return
    }
    if (!current.loaded || pending[video.id]) return

    const previous = current.marks[video.id] ?? null
    // Pressing the selected button removes the mark; pressing the other one switches it.
    const removing = previous?.kind === kind
    const now = Date.now()
    setMark(video.id, removing ? null : { video_id: video.id, kind, marked_at: new Date(now).toISOString(), on_time: isOnTime(video, now) })
    setBusy(video.id, true)
    writes.current.overlapped ||= writes.current.inFlight > 0
    writes.current.inFlight += 1
    try {
      if (removing) {
        applyProgress(await unmarkAttendance(video.id))
      } else {
        const result = await markAttendance(video.id, kind)
        setMark(video.id, result.attendance)
        applyProgress(result.progress)
        announce(result)
      }
    } catch (error) {
      setMark(video.id, previous)
      showToast(progressErrorMessage(error), 'error')
      // The server knows better (e.g. a mark made in another tab): reload the marks.
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) setVersion((value) => value + 1)
    } finally {
      setBusy(video.id, false)
      writes.current.inFlight -= 1
      // The newest answer may have missed a mark counted alongside it; count once more after they all settle.
      if (writes.current.inFlight === 0 && writes.current.overlapped) {
        writes.current.overlapped = false
        refresh()
      }
    }
  }

  return {
    // False in demo mode: there are no accounts to attend with.
    enabled: available,
    marks: current.marks,
    isBusy: (videoId: string) => Boolean(pending[videoId]) || !current.loaded,
    choose,
  }
}
