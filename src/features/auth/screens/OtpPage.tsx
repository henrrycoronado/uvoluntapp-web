import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { readPendingEmail, writeSession } from '../session'

export function OtpPage() {
  const email = readPendingEmail()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await authApi.verifyOtp(email, code.trim())
      if (result.tokens) {
        writeSession(result.tokens)
        navigate('/perfil')
      } else {
        setPendingApproval(true)
      }
    } catch (caught) {
      setError(otpMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Verifica tu correo">
        <p className={styles.notice}>Primero crea tu cuenta para recibir el código.</p>
        <Button variant="secondary" onClick={() => navigate('/registro')}>Ir a crear cuenta</Button>
      </AuthLayout>
    )
  }

  if (pendingApproval) {
    return (
      <AuthLayout title="Cuenta en revisión">
        <p className={styles.notice}>
          Tu correo está verificado. Un administrador revisará tu solicitud y te avisaremos cuando esté lista.
        </p>
        <Button variant="secondary" onClick={() => navigate('/acceso')}>Volver al inicio de sesión</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verifica tu correo" description={`Enviamos un código de 6 dígitos a ${email}.`}>
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Código"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          required
        />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting || code.length !== 6}>
            {submitting ? 'Verificando…' : 'Verificar'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}

function otpMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) return 'No pudimos conectar con el servidor. Intenta de nuevo.'
  if (caught.status === 422) return 'El código es inválido o ya venció. Revisa tu correo.'
  if (caught.status === 429) return 'Demasiados intentos. Espera unos minutos.'
  return caught.problem.title
}
