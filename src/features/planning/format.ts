import type { ActivityStatus, Modality, ProgramStatus } from './api'

export const programStatusLabels: Record<ProgramStatus | 'ARCHIVED', string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Archivado',
}

export const activityStatusLabels: Record<ActivityStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  IN_PROGRESS: 'En ejecución',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
}

export const modalityLabels: Record<Modality, string> = {
  IN_PERSON: 'Presencial',
  VIRTUAL: 'Virtual',
  HYBRID: 'Híbrida',
}

const dateTime = new Intl.DateTimeFormat('es-BO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const time = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' })

/** "sáb 22 nov, 09:00 – 11:00" o con la fecha final si cambia de día. */
export function formatSchedule(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const sameDay = start.toDateString() === end.toDateString()
  return `${dateTime.format(start)} – ${sameDay ? time.format(end) : dateTime.format(end)}`
}

/** Valor para <input type="datetime-local"> en hora local. */
export function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/** De <input type="datetime-local"> (hora local) a ISO UTC para la API. */
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString()
}

export function activityPlace(a: { modality: Modality; location?: string | null }): string {
  if (a.modality === 'VIRTUAL') return 'Virtual'
  return a.location ? `${a.location}${a.modality === 'HYBRID' ? ' · también virtual' : ''}` : modalityLabels[a.modality]
}

/** Rango de días (inputs type="date", hora local) para los filtros fromDate/toDate de la API. */
export function dayRange(from: string, to: string): { fromDate?: string; toDate?: string } {
  return {
    fromDate: from ? new Date(`${from}T00:00`).toISOString() : undefined,
    toDate: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  }
}
