import { useState } from 'react'
import { Button, ConfirmButton } from '../../shared/ui'
import { planningApi, type CatalogActivity, type Enrollment } from './api'
import { activeEnrollments, describeEnrollmentError } from './enrollment'
import { formatSchedule } from './format'
import styles from './planning.module.css'

interface EnrollmentPanelProps {
  activity: CatalogActivity
  /** Sin token no hay sesión: el panel invita a iniciarla. */
  token?: string
  mine: Enrollment[]
  onLogin?: () => void
  onChanged: () => void
}

/**
 * Inscripción previa de una actividad (prototipo 05A, 05B, 05C y 05D). Sin grupos el destino es la actividad;
 * con turnos hay que elegir uno. El servidor decide siempre el cupo, el cruce de horarios y el estado.
 */
export function EnrollmentPanel({ activity, token, mine, onLogin, onChanged }: EnrollmentPanelProps) {
  const groups = activity.participation.groups
  const [groupId, setGroupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const current = activeEnrollments(mine, activity.id)

  if (activity.status === 'CANCELLED') return <p className={styles.hint}>Actividad cancelada: solo consulta.</p>
  if (activity.status === 'FINISHED') return <p className={styles.hint}>Actividad finalizada.</p>
  if (!activity.requiresRegistration) {
    return <p className={styles.hint}>No necesitas inscripción previa: llega en el horario indicado.</p>
  }
  if (!token) {
    return (
      <p className={styles.hint}>
        Para inscribirte necesitas una cuenta.{' '}
        {onLogin && <Button size="sm" variant="secondary" onClick={onLogin}>Iniciar sesión</Button>}
      </p>
    )
  }

  async function enroll() {
    if (!token) return
    setBusy(true)
    setMessage(null)
    try {
      await planningApi.enrollments.enroll(token, activity.id, groups.length > 0 ? groupId : null)
      setMessage({ kind: 'ok', text: 'Inscripción confirmada.' })
      setGroupId('')
      onChanged()
    } catch (caught) {
      setMessage({ kind: 'error', text: describeEnrollmentError(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function cancel(enrollment: Enrollment) {
    if (!token) return
    setMessage(null)
    try {
      await planningApi.enrollments.cancel(token, activity.id, enrollment.id)
      setMessage({ kind: 'ok', text: 'Inscripción cancelada.' })
      onChanged()
    } catch (caught) {
      setMessage({ kind: 'error', text: describeEnrollmentError(caught) })
    }
  }

  const enrolledGroupIds = new Set(current.map((e) => e.groupId))
  const needsGroup = groups.length > 0
  const canEnroll = needsGroup ? !!groupId : current.length === 0

  return (
    <div className={styles.group} aria-label="Inscripción">
      {current.map((e) => {
        const group = groups.find((g) => g.id === e.groupId)
        return (
          <p key={e.id} className={styles.hint}>
            Estás inscrito{group ? ` en ${group.name} (${formatSchedule(group.startsAt, group.endsAt)})` : ''}.{' '}
            <ConfirmButton label="Cancelar inscripción" confirmLabel="Sí, cancelar" onConfirm={() => cancel(e)} />
          </p>
        )
      })}

      {needsGroup && (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Elige un turno</legend>
          {groups.map((g) => {
            const taken = enrolledGroupIds.has(g.id)
            const blocked = taken || (!activity.participation.allowMultipleGroups && current.length > 0)
            return (
              <label key={g.id} className={styles.check}>
                <input type="radio" name={`group-${activity.id}`} value={g.id} checked={groupId === g.id} disabled={blocked} onChange={() => setGroupId(g.id)} />
                {g.name} · {formatSchedule(g.startsAt, g.endsAt)}
                {g.capacity != null ? ` · cupo ${g.capacity}` : ' · sin límite de cupo'}
                {taken ? ' · ya inscrito' : ''}
              </label>
            )
          })}
        </fieldset>
      )}

      {(needsGroup || current.length === 0) && (
        <div>
          <Button variant="primary" disabled={busy || !canEnroll} onClick={enroll}>
            {busy ? 'Inscribiendo…' : 'Inscribirme'}
          </Button>
        </div>
      )}
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? styles.warnings : styles.hint}>
          {message.text}
        </p>
      )}
    </div>
  )
}
