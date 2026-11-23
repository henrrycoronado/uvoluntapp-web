import { planningApi, type Activity } from '../../planning/api'
import { formatSchedule } from '../../planning/format'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

/** Inscripciones de una actividad para quien la gestiona. La lista no crea asistencia ni horas. */
export function EnrollmentList({ token, activity }: { token: string; activity: Activity }) {
  const [list] = useLoad(() => planningApi.enrollments.ofActivity(token, activity.id))
  if (list.status === 'loading') return <p className={styles.muted}>Cargando inscripciones…</p>
  if (list.status === 'error') return <p role="alert" className={styles.alert}>{list.message}</p>

  const groups = activity.participation.groups
  const active = list.data.filter((e) => e.status === 'ENROLLED')
  return (
    <section className={styles.panel} aria-label="Inscripciones de la actividad">
      <h3 className={styles.subheading}>Inscripciones · {active.length}{activity.capacity ? ` de ${activity.capacity}` : ''}</h3>
      {list.data.length === 0 && <p className={styles.muted}>Todavía no hay inscripciones.</p>}
      {groups.map((g) => (
        <p key={g.id} className={styles.muted}>
          {g.name} ({formatSchedule(g.startsAt, g.endsAt)}): {active.filter((e) => e.groupId === g.id).length}{g.capacity != null ? ` de ${g.capacity}` : ''}
        </p>
      ))}
      {list.data.length > 0 && (
        <ul>
          {list.data.map((e) => (
            <li key={e.id}>
              {e.userId.slice(0, 8)} · {groups.find((g) => g.id === e.groupId)?.name ?? 'Sin turno'} · {e.status === 'ENROLLED' ? 'Inscrito' : 'Cancelada'}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
