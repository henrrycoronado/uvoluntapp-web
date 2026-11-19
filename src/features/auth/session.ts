const SESSION_KEY = 'uvoluntapp.session'
const PENDING_KEY = 'uvoluntapp.pendingEmail'

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

/** La sesión vive en sessionStorage: se borra al cerrar la pestaña. */
export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function setPendingEmail(email: string): void {
  sessionStorage.setItem(PENDING_KEY, email)
}

export function readPendingEmail(): string {
  return sessionStorage.getItem(PENDING_KEY) ?? ''
}
