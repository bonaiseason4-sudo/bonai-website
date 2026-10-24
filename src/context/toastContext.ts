import { createContext } from 'react'

export type ToastTone = 'success' | 'error'

export interface ToastItem {
  id: number
  text: string
  tone: ToastTone
}

export interface ToastContextValue {
  showToast: (text: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
