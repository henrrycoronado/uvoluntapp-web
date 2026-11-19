import { ApiError } from '../../shared/api/http'

export const NETWORK_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'

/** Mensaje común para los errores que no tienen un trato propio en cada pantalla. */
export function commonMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) return NETWORK_MESSAGE
  if (caught.status === 429) return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
  if (caught.status === 400) return 'Revisa los datos ingresados.'
  return caught.problem.title
}

export function formatDate(iso: unknown): string {
  if (typeof iso !== 'string') return ''
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
}
