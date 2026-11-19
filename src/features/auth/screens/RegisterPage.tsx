import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { GoogleButton } from '../GoogleButton'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { setPendingEmail, setPendingNames } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { useGoogleSignIn } from '../useGoogleSignIn'
import { PASSWORD_MIN, confirmError, emailError, passwordError, phoneError, requiredError } from '../validation'

const empty = { firstName: '', lastName: '', phone: '', email: '', password: '', confirm: '' }

export function RegisterPage() {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const google = useGoogleSignIn()
  const fields = useFieldErrors({
    firstName: () => requiredError(form.firstName, 'tus nombres'),
    lastName: () => requiredError(form.lastName, 'tus apellidos'),
    phone: () => phoneError(form.phone),
    email: () => emailError(form.email),
    password: () => passwordError(form.password),
    confirm: () => confirmError(form.password, form.confirm),
  })

  const bind = (name: keyof typeof empty) => ({
    name,
    value: form[name],
    error: fields.error(name),
    onBlur: fields.blur(name),
    onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [name]: event.target.value })),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    try {
      const email = form.email.trim()
      await authApi.register({
        email,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })
      setPendingEmail(email)
      setPendingNames({ firstName: form.firstName.trim(), lastName: form.lastName.trim() })
      navigate('/verificar')
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 409 ? 'No pudimos registrar ese correo. Si ya tienes cuenta, inicia sesión.' : commonMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  const passwordHint =
    form.password.length === 0
      ? `Mínimo ${PASSWORD_MIN} caracteres.`
      : form.password.length < PASSWORD_MIN
        ? `Te faltan ${PASSWORD_MIN - form.password.length} caracteres.`
        : 'Longitud suficiente.'

  const shownError = error ?? google.error

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Con tu correo @ucb.edu.bo la cuenta se activa al verificarla. Con otro correo, un administrador la revisa."
    >
      {shownError && <p role="alert" className={styles.alert}>{shownError}</p>}
      {google.notice && <p role="status" className={styles.notice}>{google.notice}</p>}
      <div className={styles.google}>
        <GoogleButton onCredential={google.onCredential} onError={google.onError} />
      </div>
      <p className={styles.divider}><span>o con tu correo</span></p>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.row}>
          <TextField label="Nombres" autoComplete="given-name" required {...bind('firstName')} />
          <TextField label="Apellidos" autoComplete="family-name" required {...bind('lastName')} />
        </div>
        <TextField label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" required {...bind('phone')} />
        <TextField label="Correo" type="email" autoComplete="email" inputMode="email" required {...bind('email')} />
        <TextField label="Contraseña" type="password" autoComplete="new-password" hint={passwordHint} required {...bind('password')} />
        <TextField label="Repite la contraseña" type="password" autoComplete="new-password" required {...bind('confirm')} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Enviando código…' : 'Continuar'}
          </Button>
        </div>
      </form>
      <p className={styles.footnote}>
        ¿Ya tienes cuenta?{' '}
        <button type="button" className={styles.link} onClick={() => navigate('/acceso')}>
          Inicia sesión
        </button>
      </p>
    </AuthLayout>
  )
}
