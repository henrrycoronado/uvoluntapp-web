import { useState } from 'react'
import { navigate } from '../../app/navigation'
import { AppShell } from '../../shared/layout/AppShell'
import { useSection } from '../../shared/layout/useSection'
import { useCurrentUser } from '../../shared/session/useCurrentUser'
import { ProfileSection } from '../profile/ProfileSection'
import styles from './home.module.css'
import { ActivitiesSection } from './sections/ActivitiesSection'
import { OverviewSection } from './sections/OverviewSection'
import { ProgramsSection } from './sections/ProgramsSection'
import { RecordsSection } from './sections/RecordsSection'

const groups = [
  { items: [{ id: 'inicio', label: 'Inicio' }] },
  { label: 'Explorar', items: [{ id: 'programas', label: 'Programas' }, { id: 'actividades', label: 'Actividades' }] },
  { label: 'Mi participación', items: [{ id: 'registros', label: 'Mis registros' }] },
]
const ids = ['inicio', 'programas', 'actividades', 'registros', 'perfil']

/** Espacio general de toda persona: explorar, su participación y su perfil. */
export function HomePage() {
  const [user, reloadUser] = useCurrentUser()
  const [section, select] = useSection('/inicio', ids, 'inicio')
  const [programFilter, setProgramFilter] = useState<string | undefined>()

  if (user.status === 'loading') return <main className={styles.muted}>Cargando…</main>
  if (user.status === 'error') return <main><p role="alert" className={styles.alert}>{user.message}</p></main>

  const token = user.session.accessToken
  return (
    <AppShell
      area="Mi espacio"
      groups={groups}
      active={section}
      onSelect={(id) => {
        setProgramFilter(undefined)
        select(id)
      }}
      switchAction={user.can.canOpenConsole ? { label: 'Consola Uvoluntapp', onClick: () => navigate('/consola') } : undefined}
    >
      {section === 'inicio' && <OverviewSection profile={user.profile} onOpen={select} />}
      {section === 'programas' && (
        <ProgramsSection
          onSeeActivities={(p) => {
            setProgramFilter(p.id)
            select('actividades')
          }}
        />
      )}
      {section === 'actividades' && <ActivitiesSection programId={programFilter} token={token} />}
      {section === 'registros' && <RecordsSection token={token} />}
      {section === 'perfil' && (
        <>
          <h1 className={styles.heading}>Perfil</h1>
          <ProfileSection token={token} profile={user.profile} onSaved={reloadUser} />
        </>
      )}
    </AppShell>
  )
}
