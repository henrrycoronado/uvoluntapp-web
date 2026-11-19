import { setTokenRefresher } from '../../shared/api/http'

const SESSION_KEY = 'uvoluntapp.session'
const PENDING_KEY = 'uvoluntapp.pendingEmail'
const NAMES_KEY = 'uvoluntapp.pendingNames'

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento (modo privado estricto) la sesión dura solo esta vista.
  }
}

/** La sesión vive en sessionStorage: se borra al cerrar la pestaña. */
export function readSession(): Session | null {
  const raw = read(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  write(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  write(SESSION_KEY, null)
}

/** Correo del registro en curso (OTP, completar datos, crear contraseña). */
export function setPendingEmail(email: string): void {
  write(PENDING_KEY, email)
}

export function readPendingEmail(): string {
  return read(PENDING_KEY) ?? ''
}

export interface PendingNames {
  firstName: string
  lastName: string
}

/** Nombres para precargar los datos de aprobación (los trae Google o el formulario de registro). */
export function setPendingNames(names: PendingNames | null): void {
  write(NAMES_KEY, names ? JSON.stringify(names) : null)
}

export function readPendingNames(): PendingNames {
  try {
    return { firstName: '', lastName: '', ...(JSON.parse(read(NAMES_KEY) ?? '{}') as Partial<PendingNames>) }
  } catch {
    return { firstName: '', lastName: '' }
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
let inFlight: Promise<string | null> | null = null

async function renew(rejectedToken: string): Promise<string | null> {
  const session = readSession()
  if (!session) return null
  // Otra petición ya renovó la sesión: basta con reintentar con el token nuevo.
  if (session.accessToken !== rejectedToken) return session.accessToken
  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
    if (!response.ok) {
      clearSession()
      return null
    }
    const next = (await response.json()) as Session
    writeSession(next)
    return next.accessToken
  } catch {
    return null
  }
}

/** Una sola renovación a la vez: el refresh token rota y no se puede usar dos veces. */
export function installSessionRefresh(): void {
  setTokenRefresher((rejectedToken) => {
    inFlight ??= renew(rejectedToken).finally(() => {
      inFlight = null
    })
    return inFlight
  })
}
