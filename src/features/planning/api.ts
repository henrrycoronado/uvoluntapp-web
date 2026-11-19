import { request } from '../../shared/api/http'
import type { Paginated } from '../console/api'

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'
export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'
export type Modality = 'IN_PERSON' | 'VIRTUAL' | 'HYBRID'

export interface Period {
  id: string
  label: string
  startDate: string
  endDate: string
}

export interface PlanningProgram {
  id: string
  name: string
  description?: string | null
  contact?: string | null
  referenceSchedule?: string | null
  status: ProgramStatus
  createdAt: string
  updatedAt?: string | null
  archivedAt?: string | null
  canManage: boolean
}

export interface ProgramDetails {
  name: string
  description: string | null
  contact: string | null
  referenceSchedule: string | null
}

/** Planificación y configuración de una actividad (SCRUM-48, SCRUM-49). */
export interface ActivityPlan {
  title: string
  description: string | null
  modality: Modality
  location: string | null
  meetingUrl: string | null
  startsAt: string
  endsAt: string
  requiresRegistration: boolean
  capacity: number | null
  expectedHours: number | null
  participationConditions: string | null
  periodicityNote: string | null
  groupLabel: string | null
}

export interface Activity extends ActivityPlan {
  id: string
  programId?: string | null
  programName?: string | null
  periodId: string
  status: ActivityStatus
  cancellationReason?: string | null
  startedAt?: string | null
  finishedAt?: string | null
  createdAt: string
  canManage: boolean
  canMove: boolean
}

export interface CatalogProgram {
  id: string
  name: string
  description?: string | null
  contact?: string | null
  referenceSchedule?: string | null
}

export type CatalogActivity = Omit<Activity, 'meetingUrl' | 'canManage' | 'canMove' | 'createdAt'>

export interface ConflictWarning {
  type: 'LEADER_OVERLAP' | 'LOCATION_OVERLAP'
  conflictingActivityId: string
  conflictingActivityTitle: string
  message: string
}

export interface Reschedule {
  id: string
  reason: string
  previousStartsAt: string
  previousEndsAt: string
  newStartsAt: string
  newEndsAt: string
  createdAt: string
}

export interface TeamMember {
  assignmentId: string
  userId: string
  fullName: string
  email: string
  role: 'PROGRAM_LEADER' | 'OPERATIONAL_LEADER'
  scope: 'PROGRAM' | 'ACTIVITY'
  scopeId: string
  activityTitle?: string | null
  validUntil?: string | null
  grantedBy?: string | null
}

export interface ActivityFilters {
  programId?: string
  periodId?: string
  status?: ActivityStatus | ''
  independent?: boolean
  groupLabel?: string
  fromDate?: string
  toDate?: string
}

const query = (params: Record<string, string | number | boolean | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : ''
}

const filters = (f: ActivityFilters, pageSize = 200) => query({ ...f, pageSize })

export const planningApi = {
  periods: () => request<Period[]>('/catalog/periods'),

  programs: {
    list: (token: string, includeArchived = false) =>
      request<Paginated<PlanningProgram>>(`/programs${query({ pageSize: 100, includeArchived: includeArchived || undefined })}`, { token }),
    get: (token: string, id: string) => request<PlanningProgram>(`/programs/${id}`, { token }),
    create: (token: string, body: ProgramDetails) => request<PlanningProgram>('/programs', { method: 'POST', body, token }),
    update: (token: string, id: string, body: ProgramDetails) => request<PlanningProgram>(`/programs/${id}`, { method: 'PATCH', body, token }),
    activate: (token: string, id: string) => request<PlanningProgram>(`/programs/${id}/activate`, { method: 'POST', token }),
    deactivate: (token: string, id: string) => request<PlanningProgram>(`/programs/${id}/deactivate`, { method: 'POST', token }),
    archive: (token: string, id: string, reason: string) => request<{ message: string }>(`/programs/${id}/archive`, { method: 'POST', body: { reason }, token }),
    periods: (token: string, id: string) => request<Period[]>(`/programs/${id}/periods`, { token }),
    team: (token: string, id: string) => request<TeamMember[]>(`/programs/${id}/team`, { token }),
  },

  activities: {
    list: (token: string, f: ActivityFilters) => request<Paginated<Activity>>(`/activities${filters(f)}`, { token }),
    get: (token: string, id: string) => request<Activity>(`/activities/${id}`, { token }),
    create: (token: string, body: ActivityPlan & { programId: string | null; periodId: string }) =>
      request<Activity>('/activities', { method: 'POST', body, token }),
    update: (token: string, id: string, body: ActivityPlan) => request<Activity>(`/activities/${id}`, { method: 'PATCH', body, token }),
    publish: (token: string, id: string) => request<Activity>(`/activities/${id}/publish`, { method: 'POST', token }),
    finish: (token: string, id: string) => request<Activity>(`/activities/${id}/finish`, { method: 'POST', token }),
    cancel: (token: string, id: string, reason: string) => request<Activity>(`/activities/${id}/cancel`, { method: 'POST', body: { reason }, token }),
    discard: (token: string, id: string) => request<void>(`/activities/${id}/discard`, { method: 'DELETE', token }),
    reschedules: (token: string, id: string) => request<Reschedule[]>(`/activities/${id}/reschedules`, { token }),
    reschedule: (token: string, id: string, body: { reason: string; newStartsAt: string; newEndsAt: string }) =>
      request<{ activity: Activity; conflicts: ConflictWarning[] }>(`/activities/${id}/reschedules`, { method: 'POST', body, token }),
    move: (token: string, id: string, programId: string | null, reason: string) =>
      request<Activity>(`/activities/${id}/move`, { method: 'POST', body: { programId, reason }, token }),
    checkConflicts: (
      token: string,
      body: { activityId?: string; programId?: string | null; startsAt: string; endsAt: string; location?: string | null },
    ) => request<{ hasConflicts: boolean; conflicts: ConflictWarning[] }>('/activities/check-conflicts', { method: 'POST', body, token }),
  },

  // Público: no exige sesión (SCRUM-52).
  catalog: {
    programs: (periodId?: string) => request<Paginated<CatalogProgram>>(`/catalog/programs${query({ periodId, pageSize: 100 })}`),
    activities: (f: ActivityFilters) => request<Paginated<CatalogActivity>>(`/catalog/activities${filters(f)}`),
  },

  delegations: {
    assign: (token: string, body: { userId: string; role: 'PROGRAM_LEADER' | 'OPERATIONAL_LEADER'; scope: 'PROGRAM' | 'ACTIVITY'; scopeId: string }) =>
      request<unknown>('/role-assignments', { method: 'POST', body, token }),
    revoke: (token: string, assignmentId: string) => request<unknown>(`/role-assignments/${assignmentId}/revoke`, { method: 'POST', token }),
  },
}
