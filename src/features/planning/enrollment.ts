import { ApiError } from '../../shared/api/http'
import type { Enrollment, EnrollmentErrorCode } from './api'

/** Mensaje claro para cada rechazo de inscripción que define el servidor (campo `code` del Problem Details). */
export const enrollmentErrorMessages: Record<EnrollmentErrorCode, string> = {
  INVALID_GROUP: 'Elige uno de los turnos de esta actividad.',
  ALREADY_ENROLLED: 'Ya tienes inscripción en este turno o actividad.',
  CAPACITY_FULL: 'El cupo está agotado. Prueba con otro turno.',
  TIME_OVERLAP: 'Tu horario coincide con otra inscripción activa.',
  STATE_NOT_OPEN: 'La actividad no admite inscripciones en este momento.',
}

export function describeEnrollmentError(caught: unknown): string {
  if (caught instanceof ApiError) {
    const code = caught.problem.code as EnrollmentErrorCode | undefined
    if (code && code in enrollmentErrorMessages) return enrollmentErrorMessages[code]
    if (caught.status === 401) return 'Tu sesión venció. Inicia sesión de nuevo.'
    if (caught.status === 404) return 'La actividad ya no existe.'
    return caught.problem.detail ?? caught.problem.title
  }
  return 'No pudimos conectar con el servidor.'
}

/** Inscripciones vigentes de una actividad (las canceladas quedan en el historial). */
export const activeEnrollments = (items: Enrollment[], activityId: string) =>
  items.filter((e) => e.activityId === activityId && e.status === 'ENROLLED')
