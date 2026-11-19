import { useState, type FormEvent } from 'react'
import { BrandBanner, Button, ErrorState, LoadingState, TextField } from '../../ui'
import { problemMessage, register } from './accessApi'
import styles from './Access.module.css'

interface RegisterScreenProps {
  onRegistered: (registration: { email: string; firstName: string; lastName: string }) => void
}

export function RegisterScreen({ onRegistered }: RegisterScreenProps) {
  const [values, setValues] = useState({ email: '', firstName: '', lastName: '', password: '', phone: '', relation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const external = values.email.length > 0 && !values.email.toLowerCase().endsWith('@ucb.edu.bo')

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!values.email.includes('@') || !values.firstName || !values.lastName || values.password.length < 8) {
      setError('Completa todos los campos y usa una contraseña de al menos 8 caracteres.')
      return
    }
    if (external && (!values.phone || !values.relation)) {
      setError('Las cuentas externas requieren teléfono y relación con la Pastoral.')
      return
    }
    setLoading(true)
    try {
      await register(values)
      onRegistered({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
      })
    } catch (requestError) {
      setError(problemMessage(requestError, 'No se pudo iniciar el registro.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <BrandBanner />
      <main className={styles.content}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Crear cuenta</h2>
            <p className={styles.muted}>Regístrate para participar en U-VoluntApp.</p>
          </div>
          {loading && <LoadingState message="Enviando registro…" />}
          {error && <ErrorState title="No se pudo registrar" message={error} />}
          <form className={styles.form} onSubmit={submit} noValidate>
            <TextField label="Correo electrónico" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" />
            <div className={styles.grid}>
              <TextField label="Nombres" value={values.firstName} onChange={(event) => update('firstName', event.target.value)} />
              <TextField label="Apellidos" value={values.lastName} onChange={(event) => update('lastName', event.target.value)} />
            </div>
            <TextField label="Contraseña" type="password" value={values.password} onChange={(event) => update('password', event.target.value)} hint="Mínimo 8 caracteres." autoComplete="new-password" />
            {external && (
              <>
                <TextField label="Teléfono" type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
                <TextField label="Relación con la Pastoral" value={values.relation} onChange={(event) => update('relation', event.target.value)} />
              </>
            )}
            <div className={styles.actions}>
              <Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Continuar'}</Button>
              <a className={styles.link} href="/login">¿Ya tienes una cuenta? Inicia sesión</a>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
