import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export function useAsync<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)
  // A reload keeps showing the current data instead of flashing the loading state.
  const reloading = useRef(false)

  useEffect(() => {
    let active = true
    if (!reloading.current) setLoading(true)
    reloading.current = false
    setError(null)

    factory()
      .then((result) => active && setData(result))
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason : new Error('حدث خطأ غير متوقع')))
      .finally(() => active && setLoading(false))

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => {
    reloading.current = true
    setVersion((current) => current + 1)
  }, [])

  return { data, loading, error, reload }
}
