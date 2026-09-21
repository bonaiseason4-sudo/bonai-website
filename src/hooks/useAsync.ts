import { useEffect, useState, type DependencyList } from 'react'

export function useAsync<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    factory()
      .then((result) => active && setData(result))
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason : new Error('حدث خطأ غير متوقع')))
      .finally(() => active && setLoading(false))

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
