import type { ProfileView } from '../../profile/api'
import type { Capabilities } from '../../../shared/session/capabilities'
import { activeRolesByRank, roleLabels } from '../../../shared/session/roles'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

interface OverviewProps {
  token: string
  can: Capabilities
  profile: ProfileView
  onOpen: (sectionId: string) => void
}

interface Stat {
  label: string
  value: number
  section: string
}

/** Resumen de la consola: cifras reales según lo que el rol puede ver. */
export function OverviewSection({ token, can, profile, onOpen }: OverviewProps) {
  const [stats] = useLoad<Stat[]>(async () => {
    const result: Stat[] = []
    const users = await consoleApi.users.list(token)
    result.push({ label: 'Personas registradas', value: users.meta.totalCount, section: 'usuarios' })
    if (can.isAdmin) {
      const [approvals, grants] = await Promise.all([consoleApi.approvals.list(token), consoleApi.grants.list(token)])
      result.push({ label: 'Cuentas externas por revisar', value: approvals.meta.totalCount, section: 'aprobaciones' })
      result.push({ label: 'Promociones a ADMIN pendientes', value: grants.items.filter((g) => g.status === 'PENDING').length, section: 'administradores' })
    }
    if (can.isAdmin || can.ledProgramIds.length > 0) {
      const roles = await consoleApi.roles.list(token)
      const active = roles.items.filter((r) => !r.revokedAt)
      result.push({
        label: can.isAdmin ? 'Roles vigentes' : 'Líderes operativos en tus programas',
        value: can.isAdmin ? active.length : active.filter((r) => r.role === 'OPERATIONAL_LEADER').length,
        section: 'asignaciones',
      })
    }
    return result
  })

  const roles = activeRolesByRank(profile.roles)
  return (
    <>
      <div className={styles.panel}>
        <h2 className={styles.subheading}>Tus roles</h2>
        <p className={styles.muted}>{roles.map((r) => roleLabels[r.role]).join(' · ')}</p>
        {can.isProgramLeader && can.ledProgramIds.length === 0 && !can.isAdmin && (
          <p className={styles.success}>Aún no tienes programas asignados. Un administrador debe asignarte uno para que puedas gestionarlo.</p>
        )}
      </div>
      {stats.status === 'loading' && <p className={styles.muted}>Calculando…</p>}
      {stats.status === 'error' && <p role="alert" className={styles.alert}>{stats.message}</p>}
      {stats.status === 'ready' && (
        <div className={styles.stats}>
          {stats.data.map((s) => (
            <button key={s.label} type="button" className={styles.stat} onClick={() => onOpen(s.section)}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
