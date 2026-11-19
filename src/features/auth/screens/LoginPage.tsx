import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { GoogleButton } from '../GoogleButton'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage, formatDate } from '../messages'
import { giveReapplyHandoff } from '../reapplyHandoff'
import { setPendingEmail, writeSession } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { useGoogleSignIn } from '../useGoogleSignIn'
import { emailError, requiredError } from '../validation'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const google = useGoogleSignIn()
  const fields = useFieldErrors({
    email: () => emailError(email),
    password: () => requiredError(password, 'tu contraseña'),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    const address = email.trim()
    try {
      writeSession(await authApi.login(address, password))
      navigate('/inicio')
    } catch (caught) {
      handleLoginError(caught, address, password, setError, setNotice)
    } finally {
      setSubmitting(false)
    }
  }

  const shownError = error ?? google.error
  const shownNotice = notice ?? google.notice

  return (
    <AuthLayout title="Iniciar sesión" description="Entra con tu cuenta de Google o con tu correo y contraseña.">
      {shownError && <p role="alert" className={styles.alert}>{shownError}</p>}
      {shownNotice && <p role="status" className={styles.notice}>{shownNotice}</p>}
      <div className={styles.google}>
        <GoogleButton onCredential={google.onCredential} onError={google.onError} />
      </div>
      <p className={styles.divider}><span>o con tu correo</span></p>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Correo"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          value={email}
          error={fields.error('email')}
          onBlur={fields.blur('email')}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={fields.error('password')}
          onBlur={fields.blur('password')}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className={styles.meta}>
          <button type="button" className={styles.link} onClick={() => navigate('/recuperar')}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </div>
      </form>
      <p className={styles.footnote}>
        ¿Aún no tienes cuenta?{' '}
        <button type="button" className={styles.link} onClick={() => navigate('/registro')}>
          Regístrate
        </button>
      </p>
    </AuthLayout>
  )
}

function handleLoginError(
  caught: unknown,
  email: string,
  password: string,
  setError: (message: string) => void,
  setNotice: (message: string) => void,
) {
  if (!(caught instanceof ApiError)) {
    setError(commonMessage(caught))
    return
  }
  const problem = caught.problem
  if (caught.status === 409 && problem.type === 'urn:uvoluntapp:password-setup-required') {
    setPendingEmail(email)
    navigate('/crear-contrasena')
    return
  }
  if (caught.status === 401) {
    setError('Correo o contraseña incorrectos.')
    return
  }
  if (caught.status === 422 && problem.type === 'urn:uvoluntapp:inactive-account') {
    switch (problem.accountStatus) {
      case 'PENDING_APPROVAL':
        setNotice('Tu cuenta está en revisión. Te avisaremos por correo cuando un administrador la apruebe.')
        return
      case 'SUSPENDED':
        setError('Tu cuenta está suspendida. Si crees que es un error, contacta a la Pastoral.')
        return
      case 'REJECTED': {
        const reason = typeof problem.rejectionReason === 'string' ? ` Motivo: ${problem.rejectionReason}.` : ''
        const available = typeof problem.reapplyAvailableAt === 'string' ? new Date(problem.reapplyAvailableAt) : null
        if (available && available > new Date()) {
          setError(`Tu solicitud fue rechazada.${reason} Podrás enviar una nueva desde el ${formatDate(problem.reapplyAvailableAt)}.`)
          return
        }
        setPendingEmail(email)
        giveReapplyHandoff({ password, reason: typeof problem.rejectionReason === 'string' ? problem.rejectionReason : '' })
        navigate('/nueva-solicitud')
        return
      }
      default:
        setError('Tu cuenta todavía no está activa. Revisa tu correo para verificarla.')
        return
    }
  }
  setError(commonMessage(caught))
}
