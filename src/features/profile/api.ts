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
}
