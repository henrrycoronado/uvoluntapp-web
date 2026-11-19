import { request } from '../../shared/api/http'
import type { Session } from './session'

export interface RegisterInput {
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface VerifyOtpResult {
  accountStatus: string
  requiresApprovalData: boolean
  tokens?: Session
}

export interface GoogleAuthResult {
  accountStatus: string
  isNewAccount: boolean
  tokens?: Session | null
}

export const authApi = {
  google: (idToken: string) =>
    request<GoogleAuthResult>('/auth/google', { method: 'POST', body: { idToken } }),

  register: (input: RegisterInput) =>
    request<{ message: string }>('/auth/register', { method: 'POST', body: input }),

  verifyOtp: (email: string, code: string) =>
    request<VerifyOtpResult>('/auth/verify-otp', { method: 'POST', body: { email, code } }),

  login: (email: string, password: string) =>
    request<Session>('/auth/login', { method: 'POST', body: { email, password } }),

  logout: (accessToken: string, refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: { refreshToken }, token: accessToken }),
}
