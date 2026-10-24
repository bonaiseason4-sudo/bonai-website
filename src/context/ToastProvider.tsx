import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toast } from '../components/Toast'
import { ToastContext, type ToastItem, type ToastTone } from './toastContext'

// Errors stay a little longer so there is time to read them.
const DURATION: Record<ToastTone, number> = { success: 3000, error: 4500 }
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Set<number>())

  const showToast = useCallback((text: string, tone: ToastTone = 'success') => {
    const id = ++nextId.current
    setToasts((current) => [...current.slice(1 - MAX_VISIBLE), { id, text, tone }])
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, DURATION[tone])
    timers.current.add(timer)
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} />
    </ToastContext.Provider>
  )
}
