import { useEffect, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button } from '../../../shared/ui'
import { authApi } from '../../auth/api'
import { clearSession, readSession, type Session } from '../../auth/session'
import { profileApi, type ProfileView } from '../api'
import styles from './ProfilePage.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileView }
  | { status: 'error'; message: string }

export function ProfilePage() {
  const [session] = useState<Session | null>(() => readSession())
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!session) {
      navigate('/acceso')
      return
    }
    let active = true
    profileApi
      .get(session.accessToken)
      .then((profile) => active && setState({ status: 'ready', profile }))
      .catch((caught: unknown) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 401) {
          clearSession()
          navigate('/acceso')
          return
        }
        setState({ status: 'error', message: 'No pudimos cargar tu perfil. Intenta de nuevo.' })
      })
    return () => {
      active = false
    }
  }, [session])

  async function logout() {
    if (session) {
      await authApi.logout(session.accessToken, session.refreshToken).catch(() => undefined)
    }
    clearSession()
    navigate('/acceso')
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Uvoluntapp</p>
        <Button variant="secondary" onClick={logout}>Cerrar sesión</Button>
      </header>

      {state.status === 'loading' && <p className={styles.muted}>Cargando tu perfil…</p>}
      {state.status === 'error' && <p role="alert" className={styles.alert}>{state.message}</p>}

      {state.status === 'ready' && (
        <article className={styles.card}>
          <h1 className={styles.name}>
            {state.profile.firstName} {state.profile.lastName}
          </h1>
          <dl className={styles.facts}>
            <Fact label="Correo de acceso" value={state.profile.email} />
            <Fact label="Correo institucional" value={state.profile.institutionalEmail ?? 'Sin verificar'} />
            <Fact label="Teléfono" value={state.profile.phone ?? 'No registrado'} />
            <Fact label="Estado de la cuenta" value={statusLabel(state.profile.accountStatus)} />
          </dl>
          <section aria-labelledby="roles-title" className={styles.roles}>
            <h2 id="roles-title" className={styles.sectionTitle}>Roles</h2>
            {state.profile.roles.length === 0 ? (
              <p className={styles.muted}>Tu cuenta no tiene roles de gestión. Puedes ver el catálogo público.</p>
            ) : (
              <ul className={styles.roleList}>
                {state.profile.roles.map((role, index) => (
                  <li key={`${role.role}-${index}`}>{roleLabel(role.role)} · {scopeLabel(role.scope)}</li>
                ))}
              </ul>
            )}
          </section>
        </article>
      )}
    </main>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activa',
    PENDING_APPROVAL: 'Pendiente de aprobación',
    PENDING_VERIFICATION: 'Pendiente de verificación',
    SUSPENDED: 'Suspendida',
    REJECTED: 'Rechazada',
  }
  return labels[status] ?? status
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    PROGRAM_LEADER: 'Líder de programa',
    OPERATIONAL_LEADER: 'Líder operativo',
  }
  return labels[role] ?? role
}

function scopeLabel(scope: string): string {
  const labels: Record<string, string> = { GLOBAL: 'Global', PROGRAM: 'Programa', ACTIVITY: 'Actividad' }
  return labels[scope] ?? scope
}
