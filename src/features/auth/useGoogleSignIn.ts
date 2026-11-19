import { useCallback, useState } from 'react'
import { navigate } from '../../app/navigation'
import { ApiError } from '../../shared/api/http'
import { authApi } from './api'
import { commonMessage } from './messages'
import { setPendingEmail, setPendingNames, writeSession } from './session'

/** Resultado del acceso con Google: sesión, datos de aprobación pendientes o cuenta en revisión. */
export function useGoogleSignIn() {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const onCredential = useCallback(async (idToken: string) => {
    setError(null)
    setNotice(null)
    try {
      const result = await authApi.google(idToken)
      if (result.tokens) {
        writeSession(result.tokens)
        navigate('/inicio')
      } else if (result.requiresApprovalData) {
        setPendingEmail(result.email)
        setPendingNames({ firstName: result.firstName ?? '', lastName: result.lastName ?? '' })
        navigate('/completar-registro')
      } else if (result.accountStatus === 'PENDING_APPROVAL') {
        setNotice('Tu cuenta está en revisión. Te avisaremos por correo cuando un administrador la apruebe.')
      } else {
        setError('Tu cuenta no está activa. Si crees que es un error, contacta a la Pastoral.')
      }
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 400 || caught.status === 401)) {
        setError('Google no pudo verificar tu cuenta. Intenta de nuevo o usa tu correo.')
      } else if (caught instanceof ApiError && caught.status === 422) {
        setError('Tu cuenta no está activa. Si crees que es un error, contacta a la Pastoral.')
      } else {
        setError(commonMessage(caught))
      }
    }
  }, [])

  const onError = useCallback((message: string) => setError(message), [])

  return { error, notice, onCredential, onError }
}
