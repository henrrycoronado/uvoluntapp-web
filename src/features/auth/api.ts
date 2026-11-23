import { request } from '../../shared/api/http'
import type { Session } from './session'

export interface RegisterInput {
  email: string
  firstName: string
  lastName: string
  phone: string
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
  email: string
  requiresApprovalData: boolean
  firstName?: string | null
  lastName?: string | null
  /** Alta institucional con Google: faltan nombres o teléfono antes de emitir sesión. */
  requiresProfileData?: boolean
}

export interface GoogleProfile {
  firstName: string
  lastName: string
  phone: string
}

export interface ApprovalData {
  email: string
  firstName: string
  lastName: string
  phone: string
  relationWithPastoral: string
}

export interface SetPasswordResult {
  accountStatus: string
  tokens?: Session
}

interface Message {
  message: string
}

export const authApi = {
  google: (idToken: string, profile?: GoogleProfile) =>
    request<GoogleAuthResult>('/auth/google', { method: 'POST', body: { idToken, ...profile } }),

  register: (input: RegisterInput) =>
    request<Message>('/auth/register', { method: 'POST', body: input }),

  resendOtp: (email: string) =>
    request<Message>('/auth/resend-otp', { method: 'POST', body: { email } }),

  verifyOtp: (email: string, code: string) =>
    request<VerifyOtpResult>('/auth/verify-otp', { method: 'POST', body: { email, code } }),

  completeRegistration: (data: ApprovalData) =>
    request<Message>('/auth/complete-registration', { method: 'POST', body: data }),

  reapply: (data: ApprovalData & { password: string }) =>
    request<Message>('/auth/reapply', { method: 'POST', body: data }),

  login: (email: string, password: string) =>
    request<Session>('/auth/login', { method: 'POST', body: { email, password } }),

  setPassword: (email: string, code: string, password: string) =>
    request<SetPasswordResult>('/auth/set-password', { method: 'POST', body: { email, code, password } }),

  forgotPassword: (email: string) =>
    request<Message>('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token: string, newPassword: string) =>
    request<Message>('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),

  logout: (accessToken: string, refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: { refreshToken }, token: accessToken }),
}
