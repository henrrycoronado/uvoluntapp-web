import type { ProfileView } from '../../profile/api'
import type { Capabilities } from '../../../shared/session/capabilities'
import { consoleApi, type Program } from '../api'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

const statusLabels: Record<string, string> = { ACTIVE: 'Activo', DRAFT: 'Borrador', INACTIVE: 'Inactivo', ARCHIVED: 'Archivado' }

/** Programas: los que la persona gestiona o apoya, y el resto solo para consulta. */
export function ProgramsSection({ token, can, profile }: { token: string; can: Capabilities; profile: ProfileView }) {
  const [programs] = useLoad(() => consoleApi.programs.list(token))
  const supported = profile.roles
    .filter((r) => !r.revokedAt && r.role === 'OPERATIONAL_LEADER' && r.scope === 'PROGRAM' && r.scopeId)
    .map((r) => r.scopeId as string)

  if (programs.status === 'loading') return <p className={styles.muted}>Cargando programas…</p>
  if (programs.status === 'error') return <p role="alert" className={styles.alert}>{programs.message}</p>

  const all = programs.data.items
  const mine = can.isAdmin ? all : all.filter((p) => can.ledProgramIds.includes(p.id))
  const helping = all.filter((p) => !mine.includes(p) && supported.includes(p.id))
  const others = all.filter((p) => !mine.includes(p) && !helping.includes(p))

  const card = (p: Program, muted: boolean) => (
    <article key={p.id} className={muted ? styles.programCardMuted : styles.programCard}>
      <h3 className={styles.subheading}>{p.name}</h3>
      {p.description && <p className={styles.muted}>{p.description}</p>}
      <span className={styles.badge}>{statusLabels[p.status] ?? p.status}</span>
    </article>
  )

  return (
    <>
      <section className={styles.panel} aria-label={can.isAdmin ? 'Todos los programas' : 'Programas que gestionas'}>
        <h2 className={styles.subheading}>{can.isAdmin ? 'Todos los programas' : 'Programas que gestionas'}</h2>
        {mine.length === 0 ? (
          <p className={styles.muted}>No tienes programas asignados para gestionar.</p>
        ) : (
          <div className={styles.cards}>{mine.map((p) => card(p, false))}</div>
        )}
        <p className={styles.muted}>La edición de fichas, estados y periodos se habilita con el módulo 2.</p>
      </section>
      {helping.length > 0 && (
        <section className={styles.panel} aria-label="Programas donde apoyas">
          <h2 className={styles.subheading}>Programas donde apoyas como líder operativo</h2>
          <div className={styles.cards}>{helping.map((p) => card(p, false))}</div>
        </section>
      )}
      {!can.isAdmin && others.length > 0 && (
        <section className={styles.panel} aria-label="Otros programas">
          <h2 className={styles.subheading}>Otros programas · solo consulta</h2>
          <div className={styles.cards}>{others.map((p) => card(p, true))}</div>
        </section>
      )}
    </>
  )
}
