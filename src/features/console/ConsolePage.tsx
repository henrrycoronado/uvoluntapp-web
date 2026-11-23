import { navigate } from '../../app/navigation'
import { AppShell } from '../../shared/layout/AppShell'
import { useSection } from '../../shared/layout/useSection'
import { useCurrentUser } from '../../shared/session/useCurrentUser'
import { activeRolesByRank, roleLabels } from '../../shared/session/roles'
import { AccessDenied } from '../../shared/ui'
import { ProfileSection } from '../profile/ProfileSection'
import { groupedSections, visibleSections } from './access'
import styles from './console.module.css'
import { ActivitiesSection } from './sections/ActivitiesSection'
import { AdminGrantsSection } from './sections/AdminGrantsSection'
import { ApprovalsSection } from './sections/ApprovalsSection'
import { AuditSection } from './sections/AuditSection'
import { EnrollmentsSection } from './sections/EnrollmentsSection'
import { OverviewSection } from './sections/OverviewSection'
import { PeriodsSection } from './sections/PeriodsSection'
import { PlaceholderSection } from './sections/PlaceholderSection'
import { ProgramsSection } from './sections/ProgramsSection'
import { RolesSection } from './sections/RolesSection'
import { TeamSection } from './sections/TeamSection'
import { UsersSection } from './sections/UsersSection'

/** Consola de gestión: secciones agrupadas por feature según el rol, con perfil propio en la barra lateral. */
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
  const groups = groupedSections(can).map((group) => ({
    label: group.feature,
    items: group.sections.map((s) => ({ id: s.id, label: s.title })),
  }))
  const token = session.accessToken
  const topRole = activeRolesByRank(profile.roles)[0]

  return (
    <AppShell
      area="Consola"
      groups={groups}
      active={selected}
      onSelect={select}
      breadcrumb={['Consola', selected === 'perfil' || !current ? 'Mi perfil' : current.title]}
      account={{ name: `${profile.firstName} ${profile.lastName}`.trim(), role: topRole ? (topRole.role === 'ADMIN' ? 'ADMIN' : roleLabels[topRole.role].toUpperCase()) : undefined }}
      switchAction={{ label: 'Espacio voluntario', onClick: () => navigate('/inicio') }}
    >
      {selected === 'perfil' || !current ? (
        <>
          <h1 className={styles.heading}>Perfil</h1>
          <ProfileSection token={token} profile={profile} onSaved={reloadUser} />
        </>
      ) : (
        <>
          <div>
            <h1 className={styles.heading}>{current.title}</h1>
            <p className={styles.summary}>{current.summary}</p>
          </div>
          {current.id === 'resumen' && <OverviewSection token={token} can={can} profile={profile} onOpen={select} />}
          {current.id === 'usuarios' && <UsersSection token={token} access={current.level} />}
          {current.id === 'aprobaciones' && <ApprovalsSection token={token} />}
          {current.id === 'asignaciones' && <RolesSection token={token} access={current.level} can={can} profile={profile} />}
          {current.id === 'administradores' && <AdminGrantsSection token={token} selfId={profile.id} />}
          {current.id === 'auditoria' && <AuditSection token={token} />}
          {current.id === 'programas' && <ProgramsSection token={token} can={can} />}
          {current.id === 'actividades' && <ActivitiesSection token={token} can={can} access={current.level} />}
          {current.id === 'agregacion' && <TeamSection token={token} can={can} access={current.level} />}
          {current.id === 'periodos' && <PeriodsSection token={token} />}
          {current.id === 'inscripciones' && <EnrollmentsSection token={token} />}
          {!current.live && <PlaceholderSection section={current} />}
        </>
      )}
    </AppShell>
  )
}
