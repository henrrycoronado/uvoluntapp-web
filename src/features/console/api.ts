import { request } from '../../shared/api/http'

export interface Paginated<T> {
  items: T[]
  meta: { page: number; pageSize: number; totalCount: number; totalPages: number }
}

export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  accountStatus: string
  createdAt: string
  /** null: la cuenta espera la verificación manual de un ADMIN. */
  verifiedAt?: string | null
}

export interface ApprovalRequest {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  relationWithPastoral: string
  status: string
  rejectionReason?: string | null
  createdAt: string
}

export interface RoleAssignment {
  id: string
  userId: string
  role: 'ADMIN' | 'PROGRAM_LEADER' | 'OPERATIONAL_LEADER'
  scope: 'GLOBAL' | 'PROGRAM' | 'ACTIVITY'
  scopeId?: string | null
  grantedBy: string
  validUntil?: string | null
  revokedAt?: string | null
  createdAt: string
}

export interface AdminGrant {
  id: string
  beneficiaryId: string
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvals: { adminId: string; approvedAt: string }[]
  rejectionReason?: string | null
  createdAt: string
}

export interface AuditEvent {
  id: string
  actorId?: string | null
  actorType?: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown> | null
  createdAt: string
}

export interface Program {
  id: string
  name: string
  description?: string | null
  status: string
}

export interface NewRoleAssignment {
  userId: string
  role: 'PROGRAM_LEADER' | 'OPERATIONAL_LEADER'
  scope: 'GLOBAL' | 'PROGRAM'
  scopeId: string | null
  /** Fin de la vigencia (UTC); null es sin vencimiento. */
  validUntil: string | null
}

const query = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : ''
}

/** Llamadas de la consola. Cada una lleva el token; el servidor decide si el rol puede. */
export const consoleApi = {
  users: {
    list: (token: string, search?: string) =>
      request<Paginated<UserSummary>>(`/users${query({ search, pageSize: '100' })}`, { token }),
    verify: (token: string, userId: string) =>
      request<{ message: string }>(`/users/${userId}/verify`, { method: 'POST', token }),
    changeEmail: (token: string, userId: string, newEmail: string, reason: string) =>
      request<{ message: string }>(`/users/${userId}/change-email`, { method: 'POST', body: { newEmail, reason }, token }),
    suspend: (token: string, userId: string, reason: string) =>
      request<{ message: string }>(`/users/${userId}/suspend`, { method: 'POST', body: { reason }, token }),
    reactivate: (token: string, userId: string) =>
      request<{ message: string }>(`/users/${userId}/reactivate`, { method: 'POST', token }),
  },
  approvals: {
    list: (token: string) =>
      request<Paginated<ApprovalRequest>>('/accounts/approval-requests?status=PENDING_APPROVAL', { token }),
    approve: (token: string, id: string) =>
      request<{ message: string }>(`/accounts/approval-requests/${id}/approve`, { method: 'POST', token }),
    reject: (token: string, id: string, reason: string) =>
      request<{ message: string }>(`/accounts/approval-requests/${id}/reject`, { method: 'POST', body: { reason }, token }),
  },
  roles: {
    list: (token: string) => request<Paginated<RoleAssignment>>('/role-assignments?pageSize=100', { token }),
    create: (token: string, body: NewRoleAssignment) =>
      request<RoleAssignment>('/role-assignments', { method: 'POST', body, token }),
    revoke: (token: string, id: string) =>
      request<RoleAssignment>(`/role-assignments/${id}/revoke`, { method: 'POST', token }),
  },
  grants: {
    list: (token: string) => request<Paginated<AdminGrant>>('/admin-grants?pageSize=50', { token }),
    create: (token: string, beneficiaryId: string) =>
      request<AdminGrant>('/admin-grants', { method: 'POST', body: { beneficiaryId }, token }),
    approve: (token: string, id: string) => request<AdminGrant>(`/admin-grants/${id}/approve`, { method: 'POST', token }),
    reject: (token: string, id: string, reason: string) =>
      request<AdminGrant>(`/admin-grants/${id}/reject`, { method: 'POST', body: { reason }, token }),
  },
  audit: {
    list: (token: string) => request<Paginated<AuditEvent>>('/audit-events?pageSize=50', { token }),
  },
  programs: {
    list: (token: string) => request<Paginated<Program>>('/programs?pageSize=100', { token }),
  },
}
