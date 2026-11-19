import { request } from '../../shared/api/http'

export interface RoleView {
  role: string
  scope: string
  scopeId?: string | null
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

export const profileApi = {
  get: (accessToken: string) => request<ProfileView>('/profile', { token: accessToken }),
}
