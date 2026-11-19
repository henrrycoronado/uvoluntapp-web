import { type FormEvent, useCallback, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { GoogleButton } from '../GoogleButton'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { writeSession } from '../session'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const onGoogle = useCallback(async (idToken: string) => {
    setError(null)
    setNotice(null)
    try {
      const result = await authApi.google(idToken)
      if (result.tokens) {
        writeSession(result.tokens)
        navigate('/inicio')
      } else if (result.accountStatus === 'PENDING_APPROVAL') {
        setNotice('Tu cuenta de Google quedó registrada. Un administrador la revisará antes de que puedas entrar.')
      } else {
        setError('Tu cuenta no está activa. Contacta a la Pastoral.')
      }
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 400 ? 'Google no pudo verificar tu cuenta.' : loginMessage(caught))
    }
  }, [])
  const onGoogleError = useCallback((message: string) => setError(message), [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      writeSession(await authApi.login(email.trim(), password))
      navigate('/inicio')
    } catch (caught) {
      setError(loginMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" description="Entra con tu correo y tu contraseña.">
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <div className={styles.google}>
        <GoogleButton onCredential={onGoogle} onError={onGoogleError} />
      </div>
      <p className={styles.divider}><span>o con tu correo</span></p>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
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

function loginMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) return 'No pudimos conectar con el servidor. Intenta de nuevo.'
  switch (caught.status) {
    case 401:
      return 'Correo o contraseña incorrectos.'
    case 422:
      return 'Tu cuenta todavía no está activa.'
    case 429:
      return 'Demasiados intentos. Espera unos minutos.'
    default:
      return caught.problem.title
  }
}
