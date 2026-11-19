import { request } from '../../shared/api/http'

export interface RoleView {
  id: string
  role: 'ADMIN' | 'PROGRAM_LEADER' | 'OPERATIONAL_LEADER'
  scope: 'GLOBAL' | 'PROGRAM' | 'ACTIVITY'
  scopeId?: string | null
  revokedAt?: string | null
  validUntil?: string | null
}

export interface ProfileView {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  institutionalEmail?: string | null
  institutionalEmailVerifiedAt?: string | null
  /** Verificación de la cuenta: automática con correo institucional o manual por un ADMIN. */
  verifiedAt?: string | null
  accountStatus: string
  roles: RoleView[]
  createdAt: string
}

export interface ProfileUpdate {
  firstName?: string
  lastName?: string
  phone?: string | null
}

export const profileApi = {
  get: (accessToken: string) => request<ProfileView>('/profile', { token: accessToken }),
  update: (accessToken: string, update: ProfileUpdate) =>
    request<ProfileView>('/profile', { method: 'PATCH', body: update, token: accessToken }),
  changeEmail: (accessToken: string, newEmail: string, password: string) =>
    request<Message>('/profile/change-email', { method: 'POST', body: { newEmail, password }, token: accessToken }),
  verifyEmailChange: (accessToken: string, code: string) =>
    request<Message>('/profile/verify-email-change', { method: 'POST', body: { code }, token: accessToken }),
  setInstitutionalEmail: (accessToken: string, institutionalEmail: string) =>
    request<Message>('/profile/set-institutional-email', { method: 'POST', body: { institutionalEmail }, token: accessToken }),
  verifyInstitutionalEmail: (accessToken: string, code: string) =>
    request<Message>('/profile/verify-institutional-email', { method: 'POST', body: { code }, token: accessToken }),
}

interface Message {
  message: string
}
