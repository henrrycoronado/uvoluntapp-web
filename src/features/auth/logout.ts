import { navigate } from '../../app/navigation'
import { authApi } from './api'
import { clearSession, readSession } from './session'

/** Cierra la sesión en el servidor (si se puede) y siempre en el navegador. */
export async function logout(): Promise<void> {
  const session = readSession()
  if (session) {
    await authApi.logout(session.accessToken, session.refreshToken).catch(() => undefined)
  }
  clearSession()
  navigate('/acceso')
}
