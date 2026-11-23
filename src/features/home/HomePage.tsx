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
  { label: 'Mi participación', items: [{ id: 'inscripciones', label: 'Mis inscripciones' }] },
]
const ids = ['inicio', 'programas', 'actividades', 'inscripciones', 'perfil']
const titles: Record<string, string> = { inicio: 'Inicio', programas: 'Programas', actividades: 'Actividades', inscripciones: 'Mis inscripciones', perfil: 'Mi perfil' }

/** Espacio general de toda persona: explorar, su participación y su perfil. */
export function HomePage() {
  const [user, reloadUser] = useCurrentUser()
  const [section, select] = useSection('/inicio', ids, 'inicio')
  const [programFilter, setProgramFilter] = useState<string | undefined>()
  // Actividad abierta desde "Mis inscripciones" (Ver actividad →).
  const [openActivity, setOpenActivity] = useState<string | null>(null)

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
        setOpenActivity(null)
        select(id)
      }}
      breadcrumb={['Espacio personal', titles[section] ?? 'Inicio']}
      switchAction={user.can.canOpenConsole ? { label: 'Consola Uvoluntapp', onClick: () => navigate('/consola') } : undefined}
    >
      {section === 'inicio' && <OverviewSection token={token} profile={user.profile} onOpen={select} />}
      {section === 'programas' && (
        <ProgramsSection
          onSeeActivities={(p) => {
            setProgramFilter(p.id)
            select('actividades')
          }}
        />
      )}
      {section === 'actividades' && <ActivitiesSection programId={programFilter} token={token} openId={openActivity} onOpenChange={setOpenActivity} />}
      {section === 'inscripciones' && (
        <RecordsSection
          token={token}
          onOpenActivity={(id) => {
            setOpenActivity(id)
            select('actividades')
          }}
        />
      )}
      {section === 'perfil' && (
        <>
          <h1 className={styles.heading}>Perfil</h1>
          <ProfileSection token={token} profile={user.profile} onSaved={reloadUser} />
        </>
      )}
    </AppShell>
  )
}
