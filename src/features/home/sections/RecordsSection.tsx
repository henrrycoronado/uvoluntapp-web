import { useState } from 'react'
import { useLoad } from '../../console/sections/useLoad'
import { planningApi, type CatalogActivity, type Enrollment } from '../../planning/api'
import { describeEnrollmentError } from '../../planning/enrollment'
import { activityStatusLabels, formatSchedule } from '../../planning/format'
import { ConfirmButton } from '../../../shared/ui'
import styles from '../home.module.css'

const upcoming = [
  { title: 'Registros de asistencia', text: 'Tus entradas y salidas en actividades.' },
  { title: 'Reportes personales', text: 'Tu resumen de horas y participación.' },
]

interface Row {
  enrollment: Enrollment
  activity: CatalogActivity | null
}

/** Inscripciones de la persona con los datos de cada actividad; las canceladas quedan en el historial. */
async function loadRows(token: string): Promise<Row[]> {
  const enrollments = await planningApi.enrollments.mine(token)
  const ids = [...new Set(enrollments.map((e) => e.activityId))]
  const found = await Promise.all(ids.map((id) => planningApi.catalog.activity(id).catch(() => null)))
  const byId = new Map(ids.map((id, i) => [id, found[i]]))
  return enrollments
    .map((enrollment) => ({ enrollment, activity: byId.get(enrollment.activityId) ?? null }))
    .sort((a, b) => b.enrollment.createdAt.localeCompare(a.enrollment.createdAt))
}

export function RecordsSection({ token }: { token: string }) {
  const [rows, reload] = useLoad(() => loadRows(token))
  const [error, setError] = useState<string | null>(null)

  async function cancel(row: Row) {
    setError(null)
    try {
      await planningApi.enrollments.cancel(token, row.enrollment.activityId, row.enrollment.id)
    } catch (caught) {
      setError(describeEnrollmentError(caught))
    }
    reload()
  }

  const active = rows.status === 'ready' ? rows.data.filter((r) => r.enrollment.status === 'ENROLLED' && r.activity?.status !== 'FINISHED' && r.activity?.status !== 'CANCELLED') : []
  const history = rows.status === 'ready' ? rows.data.filter((r) => !active.includes(r)) : []

  const label = (row: Row) => {
    const group = row.activity?.participation.groups.find((g) => g.id === row.enrollment.groupId)
    return group ? ` · ${group.name}` : ''
  }

  return (
    <>
      <div>
        <h1 className={styles.heading}>Mis inscripciones</h1>
        <p className={styles.summary}>Las actividades en las que te inscribiste. La inscripción no registra asistencia ni horas.</p>
      </div>

      {error && <p role="alert" className={styles.alert}>{error}</p>}
      {rows.status === 'loading' && <p className={styles.muted}>Cargando tus inscripciones…</p>}
      {rows.status === 'error' && <p role="alert" className={styles.alert}>{rows.message}</p>}

      {rows.status === 'ready' && rows.data.length === 0 && (
        <article className={styles.empty}>
          <h2 className={styles.cardTitle}>Aún no tienes inscripciones</h2>
          <p className={styles.muted}>Explora las actividades y elige una con inscripción previa.</p>
        </article>
      )}

      {active.length > 0 && (
        <section aria-label="Inscripciones vigentes">
          <h2 className={styles.cardTitle}>Vigentes</h2>
          <ul>
            {active.map((r) => (
              <li key={r.enrollment.id}>
                <strong>{r.activity?.title ?? 'Actividad'}</strong>{label(r)}
                {r.activity && <> · {formatSchedule(r.activity.startsAt, r.activity.endsAt)}</>}{' '}
                <ConfirmButton label="Cancelar inscripción" confirmLabel="Sí, cancelar" onConfirm={() => cancel(r)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section aria-label="Historial de inscripciones">
          <h2 className={styles.cardTitle}>Historial</h2>
          <ul>
            {history.map((r) => (
              <li key={r.enrollment.id}>
                <strong>{r.activity?.title ?? 'Actividad'}</strong>{label(r)} ·{' '}
                {r.enrollment.status === 'CANCELLED' ? 'Cancelada por ti' : r.activity ? activityStatusLabels[r.activity.status] : 'Cerrada'}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.pair}>
        {upcoming.map((r) => (
          <article key={r.title} className={styles.empty}>
            <h2 className={styles.cardTitle}>{r.title}</h2>
            <p className={styles.muted}>{r.text}</p>
            <p className={styles.muted}>Todavía no tienes registros.</p>
          </article>
        ))}
      </div>
    </>
  )
}
