import { useContext } from 'react'
import { CelebrationContext } from '../context/celebrationContext'

export function useCelebrations() {
  const context = useContext(CelebrationContext)
  if (!context) throw new Error('useCelebrations must be used inside <CelebrationProvider>')
  return context
}
