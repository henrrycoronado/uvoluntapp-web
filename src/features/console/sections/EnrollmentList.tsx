import { planningApi, type Activity } from '../../planning/api'
import detail from '../../planning/detail.module.css'
import { formatDateTime, formatSchedule } from '../../planning/format'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

/**
 * Inscripciones de una actividad para quien la gestiona (prototipo 21): disponibilidad por grupo y lista de participantes.
 * La lista no crea asistencia ni horas.
 */
export function EnrollmentList({ token, activity }: { token: string; activity: Activity }) {
  const [list] = useLoad(() => planningApi.enrollments.ofActivity(token, activity.id))
  if (list.status === 'loading') return <p className={styles.muted}>Cargando inscripciones…</p>
  if (list.status === 'error') return <p role="alert" className={styles.alert}>{list.message}</p>

  const groups = activity.participation.groups
  const active = list.data.filter((e) => e.status === 'ENROLLED')
  const left = (capacity: number | null, taken: number) => (capacity == null ? 'Sin límite de cupo' : capacity - taken > 0 ? `${capacity - taken} ${capacity - taken === 1 ? 'cupo disponible' : 'cupos disponibles'}` : '0 cupos · inscripción no disponible')

  return (
    <div className={detail.layout}>
      <div className={detail.stack}>
        <section className={detail.card} aria-label="Disponibilidad por grupo">
          <h3 className={detail.cardTitle}>Disponibilidad por grupo</h3>
          <p className={detail.hint}>Sin grupos: inscripción al nivel de la actividad; con grupos: inscripción al turno.</p>
          {groups.length === 0 ? (
            <p>{left(activity.capacity ?? null, active.length)} · {active.length} inscritos</p>
          ) : (
            <dl className={detail.facts}>
              {groups.map((g) => (
                <div key={g.id}>
                  <dt>{g.name} · {formatSchedule(g.startsAt, g.endsAt)}</dt>
                  <dd>{left(g.capacity, active.filter((e) => e.groupId === g.id).length)}</dd>
                </div>
              ))}
              <div><dt>Multi-registro</dt><dd>{activity.participation.allowMultipleGroups ? 'Sí' : 'No'}</dd></div>
              <div><dt>Historial</dt><dd>Se conserva incluso si se cancela</dd></div>
            </dl>
          )}
        </section>

        <section className={detail.card} aria-label="Participantes y solicitudes">
          <h3 className={detail.cardTitle}>Participantes y solicitudes · {active.length}</h3>
          {list.data.length === 0 ? (
            <p className={detail.hint}>Todavía no hay inscripciones.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Correo</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Registrada el</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((e) => (
                  <tr key={e.id}>
                    <td>{e.participantName || 'Participante'}</td>
                    <td>{e.participantEmail ?? '—'}</td>
                    <td>{groups.find((g) => g.id === e.groupId)?.name ?? 'Sin grupo'}</td>
                    <td>{e.status === 'ENROLLED' ? 'Inscrita' : 'Cancelada'}</td>
                    <td>{formatDateTime(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <aside className={detail.card} aria-label="Validaciones">
        <h3 className={detail.cardTitle}>Validaciones</h3>
        <p className={detail.hint}>Un inscrito no adquiere asistencia ni horas acreditadas por su estado.</p>
        <p className={detail.hint}>Solo aplica cuando hay inscripción previa; SIMPLE no usa grupos ni cupos.</p>
        <p className={detail.hint}>La API controla la concurrencia, duplicados y solapamientos; al cancelar se libera el cupo, sin asignación automática.</p>
      </aside>
    </div>
  )
}
