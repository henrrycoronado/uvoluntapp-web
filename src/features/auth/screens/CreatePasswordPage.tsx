import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { readPendingEmail, writeSession } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { LIMITS, PASSWORD_MIN, codeError, confirmError, emailError, passwordError } from '../validation'

/** Cuenta creada con Google que quiere entrar con contraseña: prueba su correo una vez con un código. */
export function CreatePasswordPage() {
  const fromLink = new URLSearchParams(window.location.search).get('correo') ?? ''
  const [form, setForm] = useState({ email: readPendingEmail() || fromLink, code: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fields = useFieldErrors({
    email: () => emailError(form.email),
    code: () => codeError(form.code),
    password: () => passwordError(form.password),
    confirm: () => confirmError(form.password, form.confirm),
  })

  const bind = (name: keyof typeof form) => ({
    name,
    value: form[name],
    error: fields.error(name),
    onBlur: fields.blur(name),
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: name === 'code' ? event.target.value.replace(/\D/g, '') : event.target.value })),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    try {
      const result = await authApi.setPassword(form.email.trim(), form.code, form.password)
      if (result.tokens) {
        writeSession(result.tokens)
        navigate('/inicio')
      } else {
        navigate('/en-revision')
      }
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 422 ? 'El código es incorrecto o ya venció. Vuelve a iniciar sesión para recibir otro.' : commonMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      variant="register"
      eyebrow="Tu cuenta con Google"
      title="Crea tu contraseña"
      description="Tu cuenta se creó con Google. Te enviamos un código por correo para que también puedas entrar con contraseña."
    >
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField label="Correo" maxLength={LIMITS.email} type="email" autoComplete="username" required {...bind('email')} />
        <TextField label="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required {...bind('code')} />
        <TextField label="Contraseña nueva" maxLength={LIMITS.password} type="password" autoComplete="new-password" hint={`Mínimo ${PASSWORD_MIN} caracteres.`} required {...bind('password')} />
        <TextField label="Repite la contraseña" maxLength={LIMITS.password} type="password" autoComplete="new-password" required {...bind('confirm')} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Crear contraseña'}
          </Button>
        </div>
      </form>
      <p className={styles.footnote}>
        <button type="button" className={styles.link} onClick={() => navigate('/acceso')}>
          Volver a iniciar sesión
        </button>
      </p>
    </AuthLayout>
  )
}
