import { useCallback, useEffect, useState } from 'react'
import { navigate } from '../../app/navigation'
import { clearSession, readSession, type Session } from '../../features/auth/session'
import { profileApi, type ProfileView } from '../../features/profile/api'
import { ApiError } from '../api/http'
import { capabilitiesOf, type Capabilities } from './capabilities'

export type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; session: Session; profile: ProfileView; can: Capabilities }
  | { status: 'error'; message: string }

/** Carga la sesión y el perfil. Sin sesión válida, vuelve al inicio de sesión. */
export function useCurrentUser(): [CurrentUserState, () => void] {
  const [state, setState] = useState<CurrentUserState>({ status: 'loading' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const session = readSession()
    if (!session) {
      navigate('/acceso')
      return
    }
    let active = true
    profileApi
      .get(session.accessToken)
      .then((profile) => {
        if (active) setState({ status: 'ready', session, profile, can: capabilitiesOf(profile) })
      })
      .catch((caught: unknown) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 401) {
          clearSession()
          navigate('/acceso')
          return
        }
        setState({ status: 'error', message: 'No pudimos cargar tu cuenta. Intenta de nuevo.' })
      })
    return () => {
      active = false
    }
  }, [version])

  return [state, useCallback(() => setVersion((v) => v + 1), [])]
}
