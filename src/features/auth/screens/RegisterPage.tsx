import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { setPendingEmail } from '../session'

export function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const input = { ...form, email: form.email.trim() }
      await authApi.register(input)
      setPendingEmail(input.email)
      navigate('/verificar')
    } catch (caught) {
      setError(registerMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Con tu correo institucional se activa al instante. Con un correo externo, un administrador la revisa."
    >
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField label="Nombres" autoComplete="given-name" value={form.firstName} onChange={update('firstName')} required />
        <TextField label="Apellidos" autoComplete="family-name" value={form.lastName} onChange={update('lastName')} required />
        <TextField label="Correo" type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          value={form.password}
          onChange={update('password')}
          required
        />
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

function registerMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) return 'No pudimos conectar con el servidor. Intenta de nuevo.'
  if (caught.status === 409) return 'Ya existe una cuenta con ese correo.'
  if (caught.status === 400) return 'Revisa los datos ingresados.'
  return caught.problem.title
}
