import { useCallback, useEffect, useState } from 'react'
import { describe } from './useAction'

export type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string }

/** Carga datos de una sección y permite recargarlos después de una acción. */
export function useLoad<T>(loader: () => Promise<T>): [Load<T>, () => void] {
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    loader()
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((caught: unknown) => active && setState({ status: 'error', message: describe(caught) }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return [state, useCallback(() => setVersion((v) => v + 1), [])]
}
