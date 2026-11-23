import { useState } from 'react'
import { planningApi } from '../../planning/api'
import { activityStatusLabels, formatSchedule } from '../../planning/format'
import styles from '../console.module.css'
import { Field } from './Field'
import { EnrollmentList } from './EnrollmentList'
import { useLoad } from './useLoad'

/** Inscritos por actividad: las que piden registro previo y ya salieron de borrador. */
export function EnrollmentsSection({ token }: { token: string }) {
  const [activities] = useLoad(() => planningApi.activities.list(token, {}))
  const [selected, setSelected] = useState('')

  if (activities.status === 'loading') return <p className={styles.muted}>Cargando actividades…</p>
  if (activities.status === 'error') return <p role="alert" className={styles.alert}>{activities.message}</p>

  const candidates = activities.data.items.filter((a) => a.requiresRegistration && a.status !== 'DRAFT')
  if (candidates.length === 0) return <p className={styles.muted}>No hay actividades con inscripción previa publicadas.</p>
  const current = candidates.find((a) => a.id === selected)

  return (
    <div className={styles.panel}>
      <Field label="Actividad">
        {(id) => (
          <select id={id} className={styles.select} value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Elige una actividad</option>
            {candidates.map((a) => (
              <option key={a.id} value={a.id}>{a.title} · {activityStatusLabels[a.status]}</option>
            ))}
          </select>
        )}
      </Field>
      {current && (
        <>
          <p className={styles.muted}>{formatSchedule(current.startsAt, current.endsAt)}</p>
          <EnrollmentList key={current.id} token={token} activity={current} />
        </>
      )}
    </div>
  )
}
