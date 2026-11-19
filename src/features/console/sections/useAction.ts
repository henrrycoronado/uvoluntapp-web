import { useState } from 'react'
import { ApiError } from '../../../shared/api/http'

/** Ejecuta una acción de la consola y deja el resultado como mensaje legible. */
export function useAction() {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function run(action: () => Promise<unknown>, success: string, after?: () => void) {
    setMessage(null)
    try {
      await action()
      setMessage({ kind: 'ok', text: success })
      after?.()
    } catch (caught) {
      setMessage({ kind: 'error', text: describe(caught) })
    }
  }

  return { message, run }
}

export function describe(caught: unknown): string {
  if (!(caught instanceof ApiError)) return 'No pudimos conectar con el servidor.'
  const detail = caught.problem.detail ? ` ${caught.problem.detail}` : ''
  switch (caught.status) {
    case 403:
      return `No tienes permiso para esta acción.${detail}`
    case 404:
      return 'El recurso ya no existe.'
    case 409:
      return `Conflicto con el estado actual.${detail}`
    case 422:
      return `La operación no cumple una regla.${detail}`
    default:
      return `${caught.problem.title}${detail}`
  }
}
