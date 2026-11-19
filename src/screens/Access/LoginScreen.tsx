import { useState, type FormEvent } from 'react'
import { BrandBanner, Button, ErrorState, LoadingState, TextField } from '../../ui'
import { login } from './accessApi'
import styles from './Access.module.css'

export function LoginScreen() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!values.email.includes('@') || !values.password) {
      setError('Ingresa un correo y una contraseña.')
      return
    }
    setLoading(true)
    try {
      await login(values.email, values.password)
      setLoggedIn(true)
    } catch {
      setError('El correo o la contraseña no son válidos.')
    } finally {
      setLoading(false)
    }
  }

  if (loggedIn) {
    return (
      <div className={styles.page}>
        <nav className={styles.menu} aria-label="Menú de sesión">
          <strong>U-VoluntApp</strong>
          <Button size="sm" variant="secondary" onClick={() => setLoggedIn(false)}>Cerrar sesión</Button>
        </nav>
        <main className={styles.content}>
          <section className={styles.card}>
            <h2 className={styles.title}>Sesión iniciada</h2>
            <p className={styles.muted}>Bienvenido a U-VoluntApp.</p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <BrandBanner />
      <main className={styles.content}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Iniciar sesión</h2>
            <p className={styles.muted}>Accede con tu correo y contraseña.</p>
          </div>
          {loading && <LoadingState message="Iniciando sesión…" />}
          {error && <ErrorState title="No se pudo iniciar sesión" message={error} />}
          <form className={styles.form} onSubmit={submit} noValidate>
            <TextField label="Correo electrónico" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} autoComplete="email" />
            <TextField label="Contraseña" type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} autoComplete="current-password" />
            <div className={styles.actions}>
              <Button type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</Button>
              <a className={styles.link} href="/register">Crear una cuenta</a>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
