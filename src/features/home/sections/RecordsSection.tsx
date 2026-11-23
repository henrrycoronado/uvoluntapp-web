import { useState } from 'react'
import { imageSrc } from '../../../shared/api/http'
import { ConfirmButton } from '../../../shared/ui'
import { useLoad } from '../../console/sections/useLoad'
import { planningApi, type CatalogActivity, type Enrollment } from '../../planning/api'
import detail from '../../planning/detail.module.css'
import { describeEnrollmentError } from '../../planning/enrollment'
import { activityStatusLabels, formatSchedule } from '../../planning/format'
import styles from '../home.module.css'

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

const isCurrent = (r: Row) => r.enrollment.status === 'ENROLLED' && r.activity?.status !== 'FINISHED' && r.activity?.status !== 'CANCELLED'

/** "Mis inscripciones" (prototipo 06): pestañas Vigentes e Historial, con tarjetas de cada actividad. */
export function RecordsSection({ token, onOpenActivity }: { token: string; onOpenActivity: (activityId: string) => void }) {
  const [rows, reload] = useLoad(() => loadRows(token))
  const [tab, setTab] = useState<'current' | 'history'>('current')
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

  const all = rows.status === 'ready' ? rows.data : []
  const current = all.filter(isCurrent)
  const history = all.filter((r) => !isCurrent(r))
  const shown = tab === 'current' ? current : history

  const detailLine = (row: Row) => {
    const group = row.activity?.participation.groups.find((g) => g.id === row.enrollment.groupId)
    return group ? `Turno ${group.name} · ${formatSchedule(group.startsAt, group.endsAt)}` : 'Inscripción individual'
  }

  return (
    <>
      <div>
        <h1 className={styles.heading}>Mis inscripciones</h1>
        <p className={styles.summary}>Consulta tus solicitudes y actividades inscritas. Inscripción y asistencia son registros diferentes.</p>
      </div>

      <div className={detail.tabs} role="tablist" aria-label="Inscripciones">
        <button type="button" role="tab" aria-selected={tab === 'current'} className={tab === 'current' ? detail.tabActive : detail.tab} onClick={() => setTab('current')}>
          Vigentes
        </button>
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? detail.tabActive : detail.tab} onClick={() => setTab('history')}>
          Historial
        </button>
      </div>

      {error && <p role="alert" className={styles.alert}>{error}</p>}
      {rows.status === 'loading' && <p className={styles.muted}>Cargando tus inscripciones…</p>}
      {rows.status === 'error' && <p role="alert" className={styles.alert}>{rows.message}</p>}

      {rows.status === 'ready' && shown.length === 0 && (
        <article className={styles.empty}>
          <h2 className={styles.cardTitle}>{tab === 'current' ? 'Aún no tienes inscripciones vigentes' : 'Todavía no hay historial'}</h2>
          <p className={styles.muted}>
            {tab === 'current' ? 'Explora las actividades y elige una con inscripción previa.' : 'Aquí quedan las inscripciones canceladas y las de actividades que ya terminaron.'}
          </p>
        </article>
      )}

      {shown.length > 0 && (
        <ul className={detail.cards} aria-label={tab === 'current' ? 'Inscripciones vigentes' : 'Historial de inscripciones'}>
          {shown.map((r) => (
            <li key={r.enrollment.id} className={detail.row}>
              {r.activity?.imageUrl ? (
                <img className={detail.thumb} src={imageSrc(r.activity.imageUrl)} alt="" loading="lazy" />
              ) : (
                <span className={detail.thumbEmpty} aria-hidden="true" />
              )}
              <div className={detail.rowMeta}>
                <h2 className={detail.rowTitle}>{r.activity?.title ?? 'Actividad'}</h2>
                <span>
                  {r.activity?.programName ?? 'Actividad libre'}
                  {r.activity && ` · ${formatSchedule(r.activity.startsAt, r.activity.endsAt)}`}
                </span>
                <span>{detailLine(r)}</span>
              </div>
              <div className={detail.rowSide}>
                <span className={r.enrollment.status === 'ENROLLED' ? detail.chipPending : detail.chipOk}>
                  {r.enrollment.status === 'CANCELLED' ? 'Cancelada' : r.activity?.status === 'FINISHED' ? activityStatusLabels.FINISHED : 'Inscrita'}
                </span>
                {r.activity && (
                  <button type="button" className={detail.link} onClick={() => onOpenActivity(r.enrollment.activityId)} aria-label={`Ver actividad ${r.activity.title}`}>
                    Ver actividad →
                  </button>
                )}
                {isCurrent(r) && <ConfirmButton label="Cancelar inscripción" confirmLabel="Sí, cancelar" onConfirm={() => cancel(r)} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.muted}>Cancelar una inscripción propia depende del estado y las reglas de la actividad; esta pantalla no acredita horas.</p>
    </>
  )
}
