import { useCallback } from 'react'
import { useCelebrations } from '../hooks/useCelebrations'
import { CelebrationModal } from './attendance/CelebrationModal'
import { BadgeCelebration } from './badges/BadgeCelebration'

// Rendered once in the layout, so a celebration shows on whatever page the student is on.
export function CelebrationHost() {
  const { current, waiting, dismiss } = useCelebrations()
  const key = current?.key ?? ''
  // Stable while the same celebration is open: the dialogs re-run their focus handling when it changes.
  const close = useCallback(() => dismiss(key), [dismiss, key])

  if (!current) return null
  return current.kind === 'streak'
    ? <CelebrationModal key={current.key} result={current.result} onClose={close} />
    : <BadgeCelebration key={current.key} badge={current.badge} more={waiting > 0} onClose={close} />
}
