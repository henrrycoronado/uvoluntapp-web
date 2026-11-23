import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { useFieldErrors } from '../useFieldErrors'
import { LIMITS, emailError } from '../validation'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fields = useFieldErrors({ email: () => emailError(email) })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (caught) {
      setError(commonMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Revisa tu correo">
        <p className={styles.success} role="status">
          Si existe una cuenta con <span className={styles.email}>{email.trim()}</span>, te enviamos un enlace para crear una
          contraseña nueva. Vence en 30 minutos y sirve una sola vez.
        </p>
        <Button variant="secondary" onClick={() => navigate('/acceso')}>Volver al inicio de sesión</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      variant="register"
      eyebrow="Recuperar acceso"
      title="¿Olvidaste tu contraseña?"
      description="Indica tu correo para solicitar un enlace temporal. Te ayudaremos a restablecer tu contraseña."
    >
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Correo electrónico"
          placeholder="nombre@ucb.edu.bo"
          name="email"
          maxLength={LIMITS.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          error={fields.error('email')}
          onBlur={fields.blur('email')}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <p className={styles.info}>Para proteger las cuentas, la respuesta de recuperación no confirma públicamente si un correo está registrado.</p>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </div>
      </form>
      <div className={styles.stackLinks}>
        <button type="button" className={styles.link} onClick={() => navigate('/acceso')}>
          Volver a inicio de sesión
        </button>
        <p className={styles.help}>Solo se enviará un correo al recuperar contraseña y al registrar manualmente.</p>
      </div>
    </AuthLayout>
  )
}
