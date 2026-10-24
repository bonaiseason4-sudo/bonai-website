import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { BadgeView } from '../../types/badges'
import { BadgeIcon } from './BadgeIcon'

const CONFETTI_COLORS = ['#ee7a4d', '#e7aa3a', '#2f9273', '#8d60d1', '#3f92d6', '#f6c453']
const PIECES = 26

// Fixed paths, so a render never needs randomness: each piece bursts out from the medal at its own angle, then falls.
const confetti = Array.from({ length: PIECES }, (_, index) => {
  const angle = (index / PIECES) * Math.PI * 2 + (index % 3) * 0.21
  const distance = 95 + ((index * 37) % 75)
  return {
    '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
    '--dy': `${Math.round(Math.sin(angle) * distance * 0.75)}px`,
    '--spin': `${200 + ((index * 97) % 340)}deg`,
    '--delay': `${520 + (index % 6) * 45}ms`,
    '--color': CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  } as CSSProperties
})

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// One newly earned badge; the queue shows the next one when this closes.
export function BadgeCelebration({ badge, more, onClose }: { badge: BadgeView; more: boolean; onClose: () => void }) {
  const [reduced] = useState(prefersReducedMotion)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openedAt = useRef(0)
  const titleId = useId()
  const descriptionId = useId()

  // A double tap on the previous badge's button must not close this one before it is seen.
  const close = useCallback(() => {
    if (performance.now() - openedAt.current > 500) onClose()
  }, [onClose])

  useEffect(() => {
    openedAt.current = performance.now()
    // Saved before focus moves in, so closing returns to where the student was (the attendance button, usually).
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus()
    }
  }, [close])

  return createPortal(
    <div className="modal-backdrop celebration-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className={`celebration badge-celebration${reduced ? '' : ' is-animated'}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <div className="badge-celebration__stage" aria-hidden="true">
          <span className="badge-celebration__rays" />
          <span className="badge-celebration__medal"><BadgeIcon icon={badge.icon} color={badge.color} tier={badge.tier} size="large" /></span>
          <span className="badge-celebration__sparkle badge-celebration__sparkle--1">✦</span>
          <span className="badge-celebration__sparkle badge-celebration__sparkle--2">✦</span>
          <span className="badge-celebration__sparkle badge-celebration__sparkle--3">✦</span>
        </div>
        {!reduced && (
          <span className="badge-celebration__confetti" aria-hidden="true">
            {confetti.map((style, index) => <i key={index} className={`confetti-piece confetti-piece--${index % 3}`} style={style} />)}
          </span>
        )}
        {/* The badge's name gets a line of its own, so it never breaks after the opening «. */}
        <h2 id={titleId}>ما شاء الله! أخدت وسام <span className="badge-celebration__name">«{badge.title}» 🎉</span></h2>
        <p className="badge-celebration__description" id={descriptionId}>{badge.description}</p>
        {more && <p className="badge-celebration__more">ولسه فيه مفاجأة كمان 🎁</p>}
        <button type="button" className="primary-button celebration__close" onClick={close} ref={closeRef}>الحمد لله</button>
      </div>
    </div>,
    document.body,
  )
}
