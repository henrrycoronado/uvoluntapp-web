import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { clearSession } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { PASSWORD_MIN, confirmError, passwordError } from '../validation'

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fields = useFieldErrors({
    password: () => passwordError(form.password),
    confirm: () => confirmError(form.password, form.confirm),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    try {
      await authApi.resetPassword(token, form.password)
      // El servidor cerró todas las sesiones de la cuenta.
      clearSession()
      setDone(true)
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 422 ? 'El enlace venció o ya se usó. Pide uno nuevo.' : commonMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Enlace incompleto">
        <p className={styles.notice}>Abre el enlace completo que te enviamos por correo, o pide uno nuevo.</p>
        <Button variant="secondary" onClick={() => navigate('/recuperar')}>Pedir un enlace nuevo</Button>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Contraseña actualizada">
        <p className={styles.success} role="status">
          Ya puedes entrar con tu contraseña nueva. Por seguridad cerramos las sesiones abiertas en otros dispositivos.
        </p>
        <Button variant="primary" onClick={() => navigate('/acceso')}>Iniciar sesión</Button>
      </AuthLayout>
    )
  }

  const bind = (name: keyof typeof form) => ({
    name,
    value: form[name],
    error: fields.error(name),
    onBlur: fields.blur(name),
    onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [name]: event.target.value })),
  })

  return (
    <AuthLayout variant="register" eyebrow="Recuperar acceso" title="Crea una contraseña nueva" description="Elige una contraseña que no uses en otros sitios.">
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField label="Contraseña nueva" type="password" autoComplete="new-password" hint={`Mínimo ${PASSWORD_MIN} caracteres.`} required {...bind('password')} />
        <TextField label="Repite la contraseña" type="password" autoComplete="new-password" required {...bind('confirm')} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </div>
      </form>
      {error && (
        <p className={styles.footnote}>
          <button type="button" className={styles.link} onClick={() => navigate('/recuperar')}>
            Pedir un enlace nuevo
          </button>
        </p>
      )}
    </AuthLayout>
  )
}
