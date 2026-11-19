import { useState } from 'react'
import { AppHeader } from '../../app/AppHeader'
import { useCurrentUser } from '../../shared/session/useCurrentUser'
import { AccessDenied } from '../../shared/ui'
import { visibleSections } from './access'
import styles from './console.module.css'
import { AdminGrantsSection } from './sections/AdminGrantsSection'
import { ApprovalsSection } from './sections/ApprovalsSection'
import { AuditSection } from './sections/AuditSection'
import { PlaceholderSection } from './sections/PlaceholderSection'
import { RolesSection } from './sections/RolesSection'
import { UsersSection } from './sections/UsersSection'

function initialSection(): string | null {
  return new URLSearchParams(window.location.search).get('seccion')
}

export function ConsolePage() {
  const [user] = useCurrentUser()
  const [selected, setSelected] = useState<string | null>(initialSection)

  if (user.status === 'loading') return <main className={styles.main}><p className={styles.muted}>Cargando consola…</p></main>
  if (user.status === 'error') return <main className={styles.main}><p role="alert" className={styles.alert}>{user.message}</p></main>

  const { can, profile, session } = user
  if (!can.canOpenConsole) {
    return (
      <>
        <AppHeader showConsole={false} current="consola" />
        <main className={styles.main}>
          <AccessDenied />
        </main>
      </>
    )
  }

  const sections = visibleSections(can)
  const current = sections.find((s) => s.id === selected) ?? sections[0]
  const choose = (id: string) => {
    setSelected(id)
    window.history.replaceState({}, '', `/consola?seccion=${id}`)
  }
  const ready = sections.filter((s) => s.module === 'Módulo 1')
  const upcoming = sections.filter((s) => s.module !== 'Módulo 1')

  return (
    <>
      <AppHeader showConsole current="consola" />
      <div className={styles.shell}>
        <nav className={styles.sidebar} aria-label="Secciones de la consola">
          <p className={styles.brand}>Consola</p>
          <p className={styles.navGroup}>Disponible</p>
          {ready.map((s) => (
            <button key={s.id} type="button" className={s.id === current.id ? styles.navItemActive : styles.navItem} onClick={() => choose(s.id)} aria-current={s.id === current.id ? 'page' : undefined}>
              {s.title}
            </button>
          ))}
          <p className={styles.navGroup}>Próximamente</p>
          {upcoming.map((s) => (
            <button key={s.id} type="button" className={s.id === current.id ? styles.navItemActive : styles.navItem} onClick={() => choose(s.id)} aria-current={s.id === current.id ? 'page' : undefined}>
              {s.title}
            </button>
          ))}
        </nav>
        <main className={styles.main}>
          <div className={styles.topbar}>
            <div>
              <h1 className={styles.heading}>{current.title}</h1>
              <p className={styles.summary}>{current.summary}</p>
            </div>
            <span className={current.level === 'edit' ? styles.badgeEdit : styles.badge}>
              {current.level === 'edit' ? 'Puedes gestionar' : 'Solo consulta'}
            </span>
          </div>
          {current.id === 'usuarios' && <UsersSection token={session.accessToken} access={current.level} />}
          {current.id === 'aprobaciones' && <ApprovalsSection token={session.accessToken} />}
          {current.id === 'asignaciones' && <RolesSection token={session.accessToken} access={current.level} can={can} profile={profile} />}
          {current.id === 'administradores' && <AdminGrantsSection token={session.accessToken} selfId={profile.id} />}
          {current.id === 'auditoria' && <AuditSection token={session.accessToken} />}
          {current.module !== 'Módulo 1' && <PlaceholderSection section={current} canEdit={current.level === 'edit'} />}
        </main>
      </div>
    </>
  )
}
