import { navigate } from '../../app/navigation'
import { AppShell } from '../../shared/layout/AppShell'
import { useSection } from '../../shared/layout/useSection'
import { useCurrentUser } from '../../shared/session/useCurrentUser'
import { AccessDenied } from '../../shared/ui'
import { ProfileSection } from '../profile/ProfileSection'
import { visibleSections } from './access'
import styles from './console.module.css'
import { AdminGrantsSection } from './sections/AdminGrantsSection'
import { ApprovalsSection } from './sections/ApprovalsSection'
import { AuditSection } from './sections/AuditSection'
import { PlaceholderSection } from './sections/PlaceholderSection'
import { RolesSection } from './sections/RolesSection'
import { UsersSection } from './sections/UsersSection'

/** Consola de gestión: secciones según el rol, con perfil propio en la barra lateral. */
export function ConsolePage() {
  const [user, reloadUser] = useCurrentUser()
  const sections = user.status === 'ready' ? visibleSections(user.can) : []
  const [selected, select] = useSection('/consola', [...sections.map((s) => s.id), 'perfil'], sections[0]?.id ?? 'perfil')

  if (user.status === 'loading') return <main className={styles.muted}>Cargando consola…</main>
  if (user.status === 'error') return <main><p role="alert" className={styles.alert}>{user.message}</p></main>

  const { can, profile, session } = user
  if (!can.canOpenConsole) {
    return (
      <main className={styles.main}>
        <AccessDenied action={<button type="button" onClick={() => navigate('/inicio')}>Volver a mi espacio</button>} />
      </main>
    )
  }

  const current = sections.find((s) => s.id === selected)
  const groups = [
    { label: 'Disponible', items: sections.filter((s) => s.module === 'Módulo 1').map((s) => ({ id: s.id, label: s.title })) },
    { label: 'Próximamente', items: sections.filter((s) => s.module !== 'Módulo 1').map((s) => ({ id: s.id, label: s.title })) },
  ]
  const token = session.accessToken

  return (
    <AppShell
      area="Consola"
      groups={groups}
      active={selected}
      onSelect={select}
      switchAction={{ label: 'Volver a mi espacio', onClick: () => navigate('/inicio') }}
    >
      {selected === 'perfil' || !current ? (
        <>
          <h1 className={styles.heading}>Perfil</h1>
          <ProfileSection token={token} profile={profile} onSaved={reloadUser} />
        </>
      ) : (
        <>
          <div className={styles.topbar}>
            <div>
              <h1 className={styles.heading}>{current.title}</h1>
              <p className={styles.summary}>{current.summary}</p>
            </div>
            <span className={current.level === 'edit' ? styles.badgeEdit : styles.badge}>
              {current.level === 'edit' ? 'Puedes gestionar' : 'Solo consulta'}
            </span>
          </div>
          {current.id === 'usuarios' && <UsersSection token={token} access={current.level} />}
          {current.id === 'aprobaciones' && <ApprovalsSection token={token} />}
          {current.id === 'asignaciones' && <RolesSection token={token} access={current.level} can={can} profile={profile} />}
          {current.id === 'administradores' && <AdminGrantsSection token={token} selfId={profile.id} />}
          {current.id === 'auditoria' && <AuditSection token={token} />}
          {current.module !== 'Módulo 1' && <PlaceholderSection section={current} canEdit={current.level === 'edit'} />}
        </>
      )}
    </AppShell>
  )
}
