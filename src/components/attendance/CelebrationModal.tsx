import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fullMultiplier, multiplierHint, plusPoints, timesText } from '../../lib/progressText'
import type { MarkAttendanceResult, ProgressEvent } from '../../types/progress'
import { FlameIcon } from './icons'

// Matches the API's RULES.MAX_LEVEL; used only to draw the bar.
const BAR_CELLS = 5
const COUNT_DELAY_MS = 350
const COUNT_MS = 700

type RunUp = Extract<ProgressEvent, { type: 'RUN_UP' }>

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function headline(events: ProgressEvent[], run: number): string {
  if (events.some((event) => event.type === 'FIRST_LIVE')) return 'بداية جميلة! أول شعلة 🔥'
  if (events.some((event) => event.type === 'MAX_MULTIPLIER')) return `وصلت للمضاعِف الكامل ${fullMultiplier}!`
  // A run of one that is not the first ever: the flame was lit again after a miss.
  if (run === 1) return 'ما شاء الله! شعلتك ولّعت من جديد 🔥'
  return `ما شاء الله! حضرت مباشر ${timesText(run)} ورا بعض`
}

// Shown right after a LIVE mark that grew the run.
export function CelebrationModal({ result, onClose }: { result: MarkAttendanceResult; onClose: () => void }) {
  const runUp = result.events.find((event): event is RunUp => event.type === 'RUN_UP')
  const to = runUp?.to ?? result.progress.run
  const from = runUp?.from ?? to
  const [reduced] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(reduced ? to : from)
  const freezeEarned = result.events.some((event) => event.type === 'FREEZE_EARNED')
  const filled = Math.min(to, BAR_CELLS)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (reduced || from === to) return
    let frame = 0
    const start = performance.now() + COUNT_DELAY_MS
    const tick = (time: number) => {
      const step = Math.min(1, Math.max(0, (time - start) / COUNT_MS))
      setShown(Math.round(from + (to - from) * step))
      if (step < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [from, to, reduced])

  useEffect(() => {
    // Saved before focus moves into the dialog (not with autoFocus, which runs earlier), so closing returns to the
    // attendance button that opened it.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop celebration-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title" aria-describedby="celebration-summary">
        <div className={`celebration__flame${reduced ? '' : ' is-animated'}`} aria-hidden="true">
          <FlameIcon size={96} />
          <span className="celebration__count">{shown}</span>
        </div>
        <h2 id="celebration-title">{headline(result.events, to)}</h2>
        {freezeEarned && <p className="celebration__shield">وكسبت درع 🛡️</p>}
        {result.points_gained > 0 && <span className="celebration__points">{plusPoints(result.points_gained)} نقطة</span>}
        <div className="celebration__bar" aria-hidden="true">
          {Array.from({ length: BAR_CELLS }, (_, index) => (
            <span key={index} className={`${index < filled ? 'is-filled' : ''}${index === filled - 1 && to <= BAR_CELLS ? ' is-new' : ''}`} />
          ))}
        </div>
        <p className="celebration__hint">{multiplierHint(result.progress)}</p>
        <p className="sr-only" id="celebration-summary">
          شعلتك الآن {to}{result.points_gained > 0 ? `، وكسبت ${result.points_gained} نقطة` : ''}{freezeEarned ? '، وكسبت درع' : ''}. {multiplierHint(result.progress)}
        </p>
        <button type="button" className="primary-button celebration__close" onClick={onClose} ref={closeRef}>كمّل</button>
      </div>
    </div>,
    document.body,
  )
}
