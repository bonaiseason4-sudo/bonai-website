import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ title, onClose, children, tone = 'default' }: { title: string; onClose: () => void; children: ReactNode; tone?: 'default' | 'danger' }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  // Rendered on <body> so blurred or transformed ancestors (like the header) can't trap the fixed overlay.
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal--${tone}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
