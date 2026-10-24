import { useEffect, useState } from 'react'

// The current time, refreshed every interval and when the tab comes back (background timers get throttled).
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    const timer = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  return now
}
