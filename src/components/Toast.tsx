import { createPortal } from 'react-dom'
import type { ToastItem } from '../context/toastContext'

// The live region stays mounted even when empty: screen readers only announce changes to a region they already know.
export function Toast({ toasts }: { toasts: ToastItem[] }) {
  return createPortal(
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => <p key={toast.id} className={`toast toast--${toast.tone}`}>{toast.text}</p>)}
    </div>,
    document.body,
  )
}
