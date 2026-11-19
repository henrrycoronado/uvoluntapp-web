import { useEffect, useState } from 'react'

/** Segundos restantes hasta poder repetir una acción (reenviar un código). */
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  return { remaining, restart: () => setRemaining(initialSeconds) }
}
